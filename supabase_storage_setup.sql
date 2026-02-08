-- Criação do Bucket 'produtos'
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS (embora buckets geralmente já tenham)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Leitura Pública (Qualquer um pode ver as imagens)
CREATE POLICY "Public Read Produtos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'produtos' );

-- Policy 2: Upload Autenticado (Apenas usuários logados podem fazer upload)
CREATE POLICY "Authenticated Upload Produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'produtos' );

-- Policy 3: Atualização Autenticada (Usuários logados podem atualizar imagens)
CREATE POLICY "Authenticated Update Produtos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'produtos' );

-- Policy 4: Deleção Autenticada (Usuários logados podem deletar imagens)
CREATE POLICY "Authenticated Delete Produtos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'produtos' );
