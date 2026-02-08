-- ============================================
-- MIGRATION: Setup App Hortifruti Mobile
-- Data: 2026-02-08
-- ============================================

-- 1. Adicionar colunas faltantes na tabela produtos para o app mobile
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS preco_oferta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS em_vitrine BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral';

-- 2. Criar tabela vitrine_conteudo (configurações da vitrine no app)
CREATE TABLE IF NOT EXISTS public.vitrine_conteudo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL DEFAULT 'Ofertas do Dia',
    slogan TEXT DEFAULT 'Fresquinhos para você!',
    copywriting TEXT DEFAULT 'Os melhores produtos selecionados',
    tema_visual JSONB DEFAULT '{"cor": "green", "emoji": "🥗"}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS na tabela vitrine_conteudo
ALTER TABLE public.vitrine_conteudo ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso
-- Policy para leitura pública (app cliente)
DROP POLICY IF EXISTS "Vitrine pública" ON public.vitrine_conteudo;
CREATE POLICY "Vitrine pública" ON public.vitrine_conteudo
    FOR SELECT USING (ativo = true);

-- Policy para admin gerenciar
DROP POLICY IF EXISTS "Admin pode gerenciar vitrine" ON public.vitrine_conteudo;
CREATE POLICY "Admin pode gerenciar vitrine" ON public.vitrine_conteudo
    FOR ALL USING (true);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_vitrine ON public.produtos(em_vitrine) WHERE em_vitrine = true;
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_vitrine_conteudo_ativo ON public.vitrine_conteudo(ativo);

-- 6. Trigger para updated_at automático na vitrine
CREATE OR REPLACE FUNCTION update_vitrine_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vitrine_updated_at ON public.vitrine_conteudo;
CREATE TRIGGER trigger_vitrine_updated_at
    BEFORE UPDATE ON public.vitrine_conteudo
    FOR EACH ROW
    EXECUTE FUNCTION update_vitrine_updated_at();

-- 7. Inserir conteúdo inicial da vitrine
INSERT INTO public.vitrine_conteudo (titulo, slogan, copywriting, tema_visual, ativo)
VALUES (
    'Ofertas da Semana 🌱',
    'Produtos fresquinhos direto do produtor!',
    'Aproveite nossas ofertas especiais selecionadas com carinho para você e sua família.',
    '{"cor": "#10b981", "emoji": "🥬"}',
    true
) ON CONFLICT DO NOTHING;

-- 8. Atualizar alguns produtos para aparecer na vitrine (usando subquery)
UPDATE public.produtos 
SET em_vitrine = true, 
    preco_oferta = preco_unidade * 0.9
WHERE id IN (
    SELECT id FROM public.produtos 
    WHERE ativo = true 
    LIMIT 5
);

-- Verificar resultado
SELECT 'Migration do App Hortifruti executada com sucesso!' as status;
