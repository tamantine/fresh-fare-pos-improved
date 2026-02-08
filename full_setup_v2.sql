-- ============================================================================
-- SCRIPT DE CORREÇÃO TOTAL (V2) - Execute TUDO de uma vez
-- ============================================================================

-- 1. Garantir Tipos (Enums)
DO $$ BEGIN
    CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'debito', 'credito', 'pix');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.status_venda AS ENUM ('aberta', 'finalizada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Garantir Tabelas Necessárias
CREATE TABLE IF NOT EXISTS public.caixas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operador_id UUID REFERENCES auth.users(id),
    valor_abertura DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'aberto',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data_abertura TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em Caixas se ainda não estiver
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caixas Insert" ON public.caixas FOR INSERT WITH CHECK (true);
CREATE POLICY "Caixas Select" ON public.caixas FOR SELECT USING (true);
CREATE POLICY "Caixas Update" ON public.caixas FOR UPDATE USING (true);


CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    total DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    desconto DECIMAL(10,2),
    forma_pagamento public.forma_pagamento,
    status public.status_venda DEFAULT 'finalizada',
    cupom_impresso BOOLEAN DEFAULT FALSE,
    caixa_id UUID REFERENCES public.caixas(id),
    operador_id UUID REFERENCES auth.users(id),
    observacoes TEXT
);

-- Habilitar RLS em Vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendas Insert" ON public.vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendas Select" ON public.vendas FOR SELECT USING (true);
CREATE POLICY "Vendas Update" ON public.vendas FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS public.itens_venda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID REFERENCES public.vendas(id),
    produto_id UUID REFERENCES public.produtos(id),
    quantidade DECIMAL(10,3),
    preco_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    desconto_item DECIMAL(10,2),
    sequencia INTEGER
);

-- Habilitar RLS em Itens
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens Insert" ON public.itens_venda FOR INSERT WITH CHECK (true);
CREATE POLICY "Itens Select" ON public.itens_venda FOR SELECT USING (true);

-- 3. Recriar RPC processar_venda_completa (Com tratamento de erro melhorado)
CREATE OR REPLACE FUNCTION public.processar_venda_completa(
    p_venda JSONB,
    p_itens JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_venda_id UUID;
    v_item JSONB;
    v_venda_result JSONB;
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
        (p_venda->>'desconto')::DECIMAL,
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

        -- Atualizar Estoque (Opcional: Se produto existir)
        UPDATE public.produtos
        SET estoque_atual = estoque_atual - (v_item->>'quantidade')::DECIMAL
        WHERE id = (v_item->>'produto_id')::UUID;
    END LOOP;

    -- Retorno
    SELECT to_jsonb(v) INTO v_venda_result FROM public.vendas v WHERE v.id = v_venda_id;
    RETURN v_venda_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants
GRANT ALL ON public.vendas TO authenticated;
GRANT ALL ON public.itens_venda TO authenticated;
GRANT ALL ON public.caixas TO authenticated;
GRANT EXECUTE ON FUNCTION public.processar_venda_completa(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.processar_venda_completa(JSONB, JSONB) TO service_role;
