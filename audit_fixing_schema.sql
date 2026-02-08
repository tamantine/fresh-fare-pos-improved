-- ============================================================================
-- AUDIT AND FIX SCHEMA SCRIPT + AI AGENT PERMISSIONS (V2 - VALOR_INICIAL)
-- Purpose: 
-- 1. Ensure 'caixas' uses 'valor_inicial' / 'valor_final'.
-- 2. Create 'execute_sql_query' function for AI Agent.
-- ============================================================================

DO $$
BEGIN
    -- [SECTION 1] TABLE CORRECTIONS
    
    -- Rename columns to standard 'valor_inicial' / 'valor_final'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'val_abertura') THEN
        ALTER TABLE public.caixas RENAME COLUMN val_abertura TO valor_inicial;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'valor_abertura') THEN
        ALTER TABLE public.caixas RENAME COLUMN valor_abertura TO valor_inicial;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'val_fechamento') THEN
        ALTER TABLE public.caixas RENAME COLUMN val_fechamento TO valor_final;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'valor_fechamento') THEN
        ALTER TABLE public.caixas RENAME COLUMN valor_fechamento TO valor_final;
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'valor_inicial') THEN
        ALTER TABLE public.caixas ADD COLUMN valor_inicial DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'valor_final') THEN
        ALTER TABLE public.caixas ADD COLUMN valor_final DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'saldo_pix') THEN
        ALTER TABLE public.caixas ADD COLUMN saldo_pix DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'saldo_cartao') THEN
        ALTER TABLE public.caixas ADD COLUMN saldo_cartao DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'quebra_de_caixa') THEN
        ALTER TABLE public.caixas ADD COLUMN quebra_de_caixa DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Movimentacoes_caixa fixes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimentacoes_caixa' AND column_name = 'criado_em') THEN
         ALTER TABLE public.movimentacoes_caixa ADD COLUMN criado_em TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- [SECTION 2] AI AGENT RPC FUNCTION (FULL ACCESS)
CREATE OR REPLACE FUNCTION public.execute_sql_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || query_text || ') t' INTO result;
  IF result IS NULL THEN result := '[]'::jsonb; END IF;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;
