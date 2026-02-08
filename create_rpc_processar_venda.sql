-- Função RPC para processar venda completa de forma transacional
-- Recebe dados da venda e itens em formato JSON para evitar múltiplas chamadas de rede
-- e garantir consistência (se falhar, nada é inserido)

CREATE OR REPLACE FUNCTION processar_venda_completa(
    p_venda JSONB,
    p_itens JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_venda_id UUID;
    v_item JSONB;
    v_venda_result JSONB;
BEGIN
    -- 1. Inserir a Venda
    INSERT INTO public.vendas (
        total,
        subtotal,
        desconto,
        forma_pagamento,
        status,
        cupom_impresso,
        caixa_id,
        operador_id,
        observacoes,
        created_at,
        updated_at
    )
    VALUES (
        (p_venda->>'total')::DECIMAL,
        (p_venda->>'subtotal')::DECIMAL,
        (p_venda->>'desconto')::DECIMAL,
        (p_venda->>'forma_pagamento')::public.forma_pagamento,
        COALESCE((p_venda->>'status')::public.status_venda, 'finalizada'),
        COALESCE((p_venda->>'cupom_impresso')::BOOLEAN, false),
        (p_venda->>'caixa_id')::UUID,
        auth.uid(), -- Pega o ID do usuário autenticado atual
        p_venda->>'observacoes',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_venda_id;

    -- 2. Inserir Itens e Atualizar Estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        -- Inserir Item
        INSERT INTO public.itens_venda (
            venda_id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            desconto_item,
            sequencia
        )
        VALUES (
            v_venda_id,
            (v_item->>'produto_id')::UUID,
            (v_item->>'quantidade')::DECIMAL,
            (v_item->>'preco_unitario')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL,
            COALESCE((v_item->>'desconto_item')::DECIMAL, 0),
            COALESCE((v_item->>'sequencia')::INTEGER, 1)
        );

        -- Baixar Estoque
        UPDATE public.produtos
        SET 
            estoque_atual = estoque_atual - (v_item->>'quantidade')::DECIMAL,
            updated_at = NOW()
        WHERE id = (v_item->>'produto_id')::UUID;
    END LOOP;

    -- 3. Retornar a venda criada
    SELECT to_jsonb(v) INTO v_venda_result
    FROM public.vendas v
    WHERE v.id = v_venda_id;

    RETURN v_venda_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao processar venda: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION processar_venda_completa(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION processar_venda_completa(JSONB, JSONB) TO service_role;
