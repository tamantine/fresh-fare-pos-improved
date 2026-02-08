-- Criação de funções RPC seguras para substituir execute_sql_query

-- Função para obter resumo de vendas (READ ONLY)
CREATE OR REPLACE FUNCTION public.get_vendas_resumo(
    p_data_inicial DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_data_final DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_vendas NUMERIC,
    total_receita NUMERIC,
    media_ticket NUMERIC,
    vendas_hoje NUMERIC,
    receita_hoje NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::NUMERIC as total_vendas,
        COALESCE(SUM(v.total), 0)::NUMERIC as total_receita,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(v.total), 0) / COUNT(*)
            ELSE 0
        END::NUMERIC as media_ticket,
        (SELECT COUNT(*)::NUMERIC FROM vendas WHERE DATE(created_at) = CURRENT_DATE)::NUMERIC as vendas_hoje,
        (SELECT COALESCE(SUM(total), 0)::NUMERIC FROM vendas WHERE DATE(created_at) = CURRENT_DATE)::NUMERIC as receita_hoje
    FROM vendas v
    WHERE v.created_at >= p_data_inicial AND v.created_at <= p_data_final
    AND v.status = 'finalizada';
END;
$$;

-- Função para obter estoque de produtos (READ ONLY)
CREATE OR REPLACE FUNCTION public.get_produtos_estoque(
    p_categoria_id UUID DEFAULT NULL,
    p_busca TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    codigo_barras TEXT,
    categoria_nome TEXT,
    tipo_venda TEXT,
    preco_unidade NUMERIC,
    preco_kg NUMERIC,
    estoque_atual NUMERIC,
    estoque_minimo NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        p.codigo_barras,
        COALESCE(c.nome, 'Sem categoria')::TEXT as categoria_nome,
        p.tipo_venda::TEXT,
        p.preco_unidade::NUMERIC,
        p.preco_kg::NUMERIC,
        p.estoque_atual::NUMERIC,
        p.estoque_minimo::NUMERIC,
        CASE 
            WHEN p.estoque_atual <= 0 THEN 'sem_estoque'
            WHEN p.estoque_atual <= p.estoque_minimo THEN 'baixo'
            ELSE 'ok'
        END::TEXT as status
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    AND (p_busca IS NULL OR p.nome ILIKE '%' || p_busca || '%' OR p.codigo_barras ILIKE '%' || p_busca || '%')
    ORDER BY p.nome;
END;
$$;

-- Função para atualizar estoque (WRITE - com validação)
CREATE OR REPLACE FUNCTION public.update_estoque(
    p_produto_id UUID,
    p_quantidade NUMERIC,
    p_motivo TEXT DEFAULT 'ajuste_manual'
)
RETURNS TABLE(
    sucesso BOOLEAN,
    mensagem TEXT,
    estoque_anterior NUMERIC,
    estoque_novo NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_estoque_atual NUMERIC;
    v_estoque_novo NUMERIC;
BEGIN
    -- Validar parâmetros
    IF p_produto_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'ID do produto não pode ser nulo'::TEXT, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;
    
    IF p_quantidade IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Quantidade não pode ser nula'::TEXT, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;
    
    -- Obter estoque atual
    SELECT estoque_atual INTO v_estoque_atual FROM produtos WHERE id = p_produto_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Produto não encontrado'::TEXT, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;
    
    -- Calcular novo estoque
    v_estoque_novo := v_estoque_atual + p_quantidade;
    
    -- Atualizar estoque
    UPDATE produtos SET estoque_atual = v_estoque_novo WHERE id = p_produto_id;
    
    -- Registrar movimentação
    INSERT INTO movimentacoes_estoque (
        produto_id, 
        tipo, 
        quantidade, 
        estoque_anterior, 
        estoque_novo, 
        motivo
    ) VALUES (
        p_produto_id,
        CASE WHEN p_quantidade > 0 THEN 'entrada' ELSE 'saida' END,
        ABS(p_quantidade),
        v_estoque_atual,
        v_estoque_novo,
        p_motivo
    );
    
    RETURN QUERY SELECT TRUE, 'Estoque atualizado com sucesso'::TEXT, v_estoque_atual, v_estoque_novo;
END;
$$;

-- Função para inserir venda (WRITE - com validação completa)
CREATE OR REPLACE FUNCTION public.insert_venda(
    p_subtotal NUMERIC,
    p_desconto NUMERIC,
    p_total NUMERIC,
    p_forma_pagamento TEXT
)
RETURNS TABLE(
    sucesso BOOLEAN,
    mensagem TEXT,
    venda_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venda_id UUID;
BEGIN
    -- Validar parâmetros
    IF p_subtotal IS NULL OR p_subtotal < 0 THEN
        RETURN QUERY SELECT FALSE, 'Subtotal inválido'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF p_total IS NULL OR p_total < 0 THEN
        RETURN QUERY SELECT FALSE, 'Total inválido'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF p_forma_pagamento IS NULL OR p_forma_pagamento = '' THEN
        RETURN QUERY SELECT FALSE, 'Forma de pagamento obrigatória'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Validar enum de forma de pagamento
    IF p_forma_pagamento NOT IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito') THEN
        RETURN QUERY SELECT FALSE, 'Forma de pagamento inválida'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Inserir venda
    INSERT INTO vendas (subtotal, desconto, total, forma_pagamento, status, sincronizado)
    VALUES (p_subtotal, p_desconto, p_total, p_forma_pagamento, 'finalizada', TRUE)
    RETURNING id INTO v_venda_id;
    
    RETURN QUERY SELECT TRUE, 'Venda inserida com sucesso'::TEXT, v_venda_id;
END;
$$;

-- Função para registrar movimentação de estoque (WRITE)
CREATE OR REPLACE FUNCTION public.insert_movimentacao(
    p_produto_id UUID,
    p_tipo TEXT,
    p_quantidade NUMERIC,
    p_estoque_anterior NUMERIC,
    p_estoque_novo NUMERIC,
    p_venda_id UUID DEFAULT NULL,
    p_compra_id UUID DEFAULT NULL
)
RETURNS TABLE(
    sucesso BOOLEAN,
    mensagem TEXT,
    movimentacao_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_movimentacao_id UUID;
BEGIN
    -- Validar parâmetros
    IF p_produto_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'ID do produto não pode ser nulo'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF p_tipo IS NULL OR p_tipo NOT IN ('entrada', 'saida', 'ajuste') THEN
        RETURN QUERY SELECT FALSE, 'Tipo de movimentação inválido'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Quantidade deve ser maior que zero'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Validar consistência de IDs
    IF p_venda_id IS NOT NULL AND p_compra_id IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Não pode ter ambos venda_id e compra_id'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Inserir movimentação
    INSERT INTO movimentacoes_estoque (
        produto_id, tipo, quantidade, estoque_anterior, estoque_novo, venda_id, compra_id
    ) VALUES (
        p_produto_id, p_tipo, p_quantidade, p_estoque_anterior, p_estoque_novo, p_venda_id, p_compra_id
    ) RETURNING id INTO v_movimentacao_id;
    
    RETURN QUERY SELECT TRUE, 'Movimentação registrada com sucesso'::TEXT, v_movimentacao_id;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.get_vendas_resumo(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_produtos_estoque(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_estoque(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_venda(NUMERIC, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_movimentacao(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, UUID) TO authenticated;