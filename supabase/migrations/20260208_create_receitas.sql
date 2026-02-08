-- ============================================
-- MIGRATION: Tabela Receitas e Categoria de Produtos
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Tabela para receitas fit do app
CREATE TABLE IF NOT EXISTS public.receitas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tempo_preparo TEXT DEFAULT '15 min',
    calorias INTEGER DEFAULT 0,
    dificuldade TEXT DEFAULT 'fácil' CHECK (dificuldade IN ('fácil', 'médio', 'difícil')),
    categoria TEXT DEFAULT 'Geral',
    pdf_url TEXT,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_receitas_ativo ON public.receitas(ativo);
CREATE INDEX IF NOT EXISTS idx_receitas_categoria ON public.receitas(categoria);

-- 3. RLS (Row Level Security)
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (app cliente)
DROP POLICY IF EXISTS "Receitas ativas são públicas" ON public.receitas;
CREATE POLICY "Receitas ativas são públicas" ON public.receitas
    FOR SELECT USING (ativo = true);

-- Policy para admin (insert/update/delete)
DROP POLICY IF EXISTS "Admin pode gerenciar receitas" ON public.receitas;
CREATE POLICY "Admin pode gerenciar receitas" ON public.receitas
    FOR ALL USING (true);

-- 4. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_receitas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_receitas_updated_at ON public.receitas;
CREATE TRIGGER trigger_receitas_updated_at
    BEFORE UPDATE ON public.receitas
    FOR EACH ROW
    EXECUTE FUNCTION update_receitas_updated_at();

-- 5. Adicionar coluna categoria na tabela produtos se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produtos' AND column_name = 'categoria') THEN
        ALTER TABLE public.produtos ADD COLUMN categoria TEXT DEFAULT 'Geral';
    END IF;
END $$;

-- 6. Dados de exemplo (opcional)
-- INSERT INTO public.receitas (titulo, descricao, tempo_preparo, calorias, dificuldade, categoria) VALUES
-- ('Salada de Quinoa Imperial', 'Grãos antigos com vegetais assados e vinagrete cítrico', '15 min', 240, 'fácil', 'Saladas'),
-- ('Bowl de Proteína Vegana', 'Bowl nutritivo com grão de bico, abacate e legumes', '20 min', 310, 'fácil', 'Bowls'),
-- ('Suco Detox Verde', 'Couve, maçã verde, gengibre e limão', '5 min', 85, 'fácil', 'Bebidas');

SELECT 'Migration executada com sucesso!' as status;
