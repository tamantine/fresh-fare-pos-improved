-- 1. Criação do Bucket 'produtos' (se não existir)
-- Assegura que o bucket 'produtos' seja criado e seja público
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- NOTA: A linha 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;' foi removida
-- pois a tabela 'storage.objects' já possui RLS habilitado por padrão e pertence ao sistema,
-- o que causava o erro de permissão (42501).

-- 2. Limpeza de políticas existentes (para evitar conflitos)
DO $$
BEGIN
    BEGIN
        DROP POLICY "Public Read Produtos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY "Authenticated Upload Produtos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY "Authenticated Update Produtos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY "Authenticated Delete Produtos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Criação de novas políticas de segurança

-- Leitura Pública: Qualquer pessoa pode ver as imagens dos produtos
CREATE POLICY "Public Read Produtos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'produtos' );

-- Upload Autenticado: Apenas usuários logados podem enviar imagens
CREATE POLICY "Authenticated Upload Produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'produtos' );

-- Atualização Autenticada: Apenas usuários logados podem atualizar imagens
CREATE POLICY "Authenticated Update Produtos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'produtos' );

-- Deleção Autenticada: Apenas usuários logados podem excluir imagens
CREATE POLICY "Authenticated Delete Produtos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'produtos' );
