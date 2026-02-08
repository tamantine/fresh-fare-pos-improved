-- ============================================================================
-- CORREÇÃO DO FECHAMENTO DE CAIXA COM PAGAMENTO DIVIDIDO
-- Execute este script no Editor SQL do Supabase
-- ============================================================================

-- 1. Adicionar colunas de saldo no caixa se não existirem
ALTER TABLE public.caixas ADD COLUMN IF NOT EXISTS saldo_cartao DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.caixas ADD COLUMN IF NOT EXISTS saldo_pix DECIMAL(10,2) DEFAULT 0;

-- 2. Atualizar Trigger para processar pagamentos divididos
CREATE OR REPLACE FUNCTION atualizar_saldo_caixa_venda()
RETURNS TRIGGER AS $$
DECLARE
  v_pagamento RECORD;
  v_has_pagamentos BOOLEAN;
BEGIN
  IF NEW.status = 'finalizada' AND NEW.caixa_id IS NOT NULL THEN
    -- Verificar se há pagamentos na tabela vendas_pagamentos
    SELECT EXISTS(SELECT 1 FROM vendas_pagamentos WHERE venda_id = NEW.id) INTO v_has_pagamentos;
    
    IF v_has_pagamentos THEN
      -- Processar cada pagamento da tabela vendas_pagamentos
      FOR v_pagamento IN 
        SELECT fp.nome as forma, vp.valor 
        FROM vendas_pagamentos vp
        JOIN formas_pagamento fp ON fp.id = vp.forma_pagamento_id
        WHERE vp.venda_id = NEW.id
      LOOP
        IF v_pagamento.forma = 'dinheiro' THEN
          UPDATE caixas SET saldo_dinheiro = COALESCE(saldo_dinheiro, 0) + v_pagamento.valor WHERE id = NEW.caixa_id::UUID;
        ELSIF v_pagamento.forma IN ('debito', 'credito') THEN
          UPDATE caixas SET saldo_cartao = COALESCE(saldo_cartao, 0) + v_pagamento.valor WHERE id = NEW.caixa_id::UUID;
        ELSIF v_pagamento.forma = 'pix' THEN
          UPDATE caixas SET saldo_pix = COALESCE(saldo_pix, 0) + v_pagamento.valor WHERE id = NEW.caixa_id::UUID;
        END IF;
      END LOOP;
    ELSE
      -- Fallback: usar forma_pagamento única (compatibilidade legada)
      IF NEW.forma_pagamento = 'dinheiro' THEN
        UPDATE caixas SET saldo_dinheiro = COALESCE(saldo_dinheiro, 0) + NEW.total WHERE id = NEW.caixa_id::UUID;
      ELSIF NEW.forma_pagamento IN ('debito', 'credito') THEN
        UPDATE caixas SET saldo_cartao = COALESCE(saldo_cartao, 0) + NEW.total WHERE id = NEW.caixa_id::UUID;
      ELSIF NEW.forma_pagamento = 'pix' THEN
        UPDATE caixas SET saldo_pix = COALESCE(saldo_pix, 0) + NEW.total WHERE id = NEW.caixa_id::UUID;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reaplicar trigger
DROP TRIGGER IF EXISTS trg_atualizar_saldo_caixa ON public.vendas;
CREATE TRIGGER trg_atualizar_saldo_caixa
AFTER INSERT OR UPDATE OF status ON public.vendas
FOR EACH ROW
WHEN (NEW.status = 'finalizada')
EXECUTE FUNCTION atualizar_saldo_caixa_venda();

-- 3. Atualizar RPC processar_venda_completa para inserir pagamentos
CREATE OR REPLACE FUNCTION public.processar_venda_completa(
    p_venda JSONB,
    p_itens JSONB,
    p_pagamentos JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_venda_id UUID;
    v_item JSONB;
    v_pagamento JSONB;
    v_venda_result JSONB;
    v_forma_id UUID;
BEGIN
    -- Inserir Venda
    INSERT INTO public.vendas (
        total,
        subtotal,
        desconto,
        forma_pagamento,
        status,
        cupom_impresso,
        caixa_id,
        operador_id,
        observacoes
    )
    VALUES (
        (p_venda->>'total')::DECIMAL,
        (p_venda->>'subtotal')::DECIMAL,
        COALESCE((p_venda->>'desconto')::DECIMAL, 0),
        (p_venda->>'forma_pagamento')::public.forma_pagamento,
        'finalizada',
        COALESCE((p_venda->>'cupom_impresso')::BOOLEAN, false),
        (p_venda->>'caixa_id')::UUID,
        auth.uid(),
        p_venda->>'observacoes'
    )
    RETURNING id INTO v_venda_id;

    -- Inserir Itens
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO public.itens_venda (
            venda_id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            desconto_item,
            sequencia,
            peso_liquido
        )
        VALUES (
            v_venda_id,
            (v_item->>'produto_id')::UUID,
            (v_item->>'quantidade')::DECIMAL,
            (v_item->>'preco_unitario')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL,
            COALESCE((v_item->>'desconto_item')::DECIMAL, 0),
            COALESCE((v_item->>'sequencia')::INTEGER, 1),
            (v_item->>'peso_liquido')::DECIMAL
        );

        -- Atualizar Estoque
        UPDATE public.produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) - (v_item->>'quantidade')::DECIMAL
        WHERE id = (v_item->>'produto_id')::UUID;
    END LOOP;

    -- Inserir Pagamentos (NOVO!)
    IF jsonb_array_length(p_pagamentos) > 0 THEN
        FOR v_pagamento IN SELECT * FROM jsonb_array_elements(p_pagamentos)
        LOOP
            -- Buscar ID da forma de pagamento pelo nome
            SELECT id INTO v_forma_id 
            FROM formas_pagamento 
            WHERE nome = v_pagamento->>'forma_pagamento'
            LIMIT 1;
            
            IF v_forma_id IS NOT NULL THEN
                INSERT INTO vendas_pagamentos (venda_id, forma_pagamento_id, valor)
                VALUES (v_venda_id, v_forma_id, (v_pagamento->>'valor')::DECIMAL);
            END IF;
        END LOOP;
    END IF;

    -- Retorno
    SELECT to_jsonb(v) INTO v_venda_result FROM public.vendas v WHERE v.id = v_venda_id;
    RETURN v_venda_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atualizar RPC get_relatorio_fechamento
CREATE OR REPLACE FUNCTION get_relatorio_fechamento(p_caixa_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_caixa RECORD;
  v_vendas_por_pagamento JSONB;
  v_total_vendas DECIMAL;
BEGIN
  -- Buscar dados do caixa
  SELECT * INTO v_caixa FROM caixas WHERE id = p_caixa_id;
  
  -- Totalizar vendas por forma de pagamento (usando vendas_pagamentos)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'forma_pagamento', sub.forma,
    'qtd', sub.qtd,
    'total', sub.total
  )), '[]'::jsonb)
  INTO v_vendas_por_pagamento
  FROM (
    SELECT 
      fp.nome as forma,
      COUNT(DISTINCT vp.venda_id) as qtd,
      SUM(vp.valor) as total
    FROM vendas_pagamentos vp
    JOIN vendas v ON v.id = vp.venda_id
    JOIN formas_pagamento fp ON fp.id = vp.forma_pagamento_id
    WHERE v.caixa_id = p_caixa_id AND v.status = 'finalizada'
    GROUP BY fp.nome
    
    UNION ALL
    
    -- Fallback: vendas sem registro em vendas_pagamentos (compatibilidade)
    SELECT 
      v.forma_pagamento::TEXT as forma,
      COUNT(*) as qtd,
      SUM(v.total) as total
    FROM vendas v
    WHERE v.caixa_id = p_caixa_id 
      AND v.status = 'finalizada'
      AND NOT EXISTS (SELECT 1 FROM vendas_pagamentos vp WHERE vp.venda_id = v.id)
      AND v.forma_pagamento IS NOT NULL
    GROUP BY v.forma_pagamento
  ) sub;
  
  -- Total de vendas
  SELECT COALESCE(SUM(total), 0) INTO v_total_vendas
  FROM vendas WHERE caixa_id = p_caixa_id AND status = 'finalizada';
  
  -- Montar retorno
  v_result := jsonb_build_object(
    'caixa_id', v_caixa.id,
    'data_abertura', v_caixa.data_abertura,
    'data_fechamento', v_caixa.data_fechamento,
    'valor_inicial', COALESCE(v_caixa.valor_inicial, v_caixa.valor_abertura, 0),
    'total_vendas', v_total_vendas,
    'saldo_sistema', COALESCE(v_caixa.saldo_dinheiro, 0),
    'saldo_cartao', COALESCE(v_caixa.saldo_cartao, 0),
    'saldo_pix', COALESCE(v_caixa.saldo_pix, 0),
    'valor_final_informado', v_caixa.valor_final,
    'quebra', v_caixa.quebra_de_caixa,
    'vendas_por_pagamento', v_vendas_por_pagamento
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grants
GRANT EXECUTE ON FUNCTION public.processar_venda_completa(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.processar_venda_completa(JSONB, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_relatorio_fechamento(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_relatorio_fechamento(UUID) TO service_role;
