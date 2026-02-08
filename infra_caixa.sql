-- ============================================================================
-- SCRIPT DE INFRAESTRUTURA: FLUXO DE CAIXA E AUDITORIA
-- Data: 2026-02-04
-- Autor: Sistema PDV
-- ============================================================================

-- 1. Tabela de Caixas (Turnos)
CREATE TABLE IF NOT EXISTS public.caixas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operador_id UUID REFERENCES auth.users(id),
    valor_abertura DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_fechamento DECIMAL(10,2),
    saldo_dinheiro DECIMAL(10,2) DEFAULT 0,
    saldo_pix DECIMAL(10,2) DEFAULT 0,
    saldo_cartao DECIMAL(10,2) DEFAULT 0,
    quebra_de_caixa DECIMAL(10,2), -- Diferença entre calculado e real
    status TEXT CHECK (status IN ('aberto', 'fechado')) DEFAULT 'aberto',
    observacoes TEXT,
    data_abertura TIMESTAMPTZ DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Movimentações de Caixa (Sangria/Suprimento)
CREATE TABLE IF NOT EXISTS public.movimentacoes_caixa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caixa_id UUID REFERENCES public.caixas(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('sangria', 'suprimento')) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    motivo TEXT,
    usuario_responsavel UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Atualização da Tabela de Vendas
-- Adiciona a coluna caixa_id para vincular cada venda ao turno aberto
-- 2.1 Enums
DO $$ BEGIN
    CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'debito', 'credito', 'pix');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_venda AS ENUM ('aberta', 'finalizada', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_venda AS ENUM ('peso', 'unidade', 'hibrido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2.2 Tabela de Vendas (Caso não exista)
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_venda SERIAL,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    status status_venda DEFAULT 'aberta',
    total DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    forma_pagamento forma_pagamento,
    caixa_id UUID REFERENCES public.caixas(id),
    operador_id UUID REFERENCES auth.users(id),
    observacoes TEXT,
    cupom_impresso BOOLEAN DEFAULT FALSE,
    sincronizado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Tabela de Itens de Venda (Caso não exista)
-- Garantir que a tabela de itens também exista se vamos usar o sistema de vendas
CREATE TABLE IF NOT EXISTS public.itens_venda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id),
    quantidade DECIMAL(10,3) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    desconto_item DECIMAL(10,2) DEFAULT 0,
    sequencia SERIAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Atualização da Tabela de Vendas (Garantia extra de coluna)
-- Adiciona a coluna caixa_id caso a tabela já existisse mas sem ela
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendas') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'caixa_id') THEN
            ALTER TABLE public.vendas ADD COLUMN caixa_id UUID REFERENCES public.caixas(id);
        END IF;
    END IF;
END $$;

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_caixas_operador ON public.caixas(operador_id);
CREATE INDEX IF NOT EXISTS idx_caixas_status ON public.caixas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_caixa_id ON public.vendas(caixa_id);

-- 5. Segurança (Row Level Security)

-- Habilitar RLS
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas para Caixas
CREATE POLICY "Permitir leitura de caixas para autenticados" 
ON public.caixas FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir criar/atualizar caixas para autenticados" 
ON public.caixas FOR ALL 
USING (auth.role() = 'authenticated');

-- Políticas para Movimentações
CREATE POLICY "Permitir leitura de movimentacoes para autenticados" 
ON public.movimentacoes_caixa FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir criar movimentacoes para autenticados" 
ON public.movimentacoes_caixa FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
