-- Script de Cadastro em Massa de Produtos - Hortifruti Bom Preço
-- Preços definidos como 0.00 para edição posterior pelo usuário.
-- Imagens selecionadas de bancos de imagens públicos (Unsplash/Pexels).

-- 1. Garantir que as categorias existam
INSERT INTO public.categorias (nome, cor) VALUES 
('Frutas', '#27ae60'),
('Legumes e Raízes', '#e67e22'),
('Verduras e Ervas', '#2ecc71')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserção de Produtos
DO $$ 
DECLARE 
    cat_frutas UUID;
    cat_legumes UUID;
    cat_verduras UUID;
BEGIN
    -- Obter IDs das categorias
    SELECT id INTO cat_frutas FROM public.categorias WHERE nome = 'Frutas' LIMIT 1;
    SELECT id INTO cat_legumes FROM public.categorias WHERE nome = 'Legumes e Raízes' LIMIT 1;
    SELECT id INTO cat_verduras FROM public.categorias WHERE nome = 'Verduras e Ervas' LIMIT 1;

    -- FRUTAS
    INSERT INTO public.produtos (nome, categoria_id, tipo_venda, preco_kg, preco_unidade, imagem_url) VALUES
    ('Acerola', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1615485242231-973f7a01d612?auto=format&fit=crop&w=400&q=80'),
    ('Ameixa (Nacional / Importada)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1595124253848-21227d3f3045?auto=format&fit=crop&w=400&q=80'),
    ('Atemoia', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=400&q=80'),
    ('Caju', cat_frutas, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1591935111025-11630b71ad06?auto=format&fit=crop&w=400&q=80'),
    ('Caqui (Fuyu / Rama Forte)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1604492808724-6521b49ac246?auto=format&fit=crop&w=400&q=80'),
    ('Carambola', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=400&q=80'),
    ('Figo', cat_frutas, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1593031402262-978693836287?auto=format&fit=crop&w=400&q=80'),
    ('Goiaba (Branca / Vermelha)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1536511118081-0668f286c330?auto=format&fit=crop&w=400&q=80'),
    ('Kiwi (Nacional / Importado)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=400&q=80'),
    ('Lichia', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=400&q=80'),
    ('Melão (Amarelo / Pele de Sapo)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=400&q=80'),
    ('Pera (Williams / Portuguesa)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1514983693064-c678604f8424?auto=format&fit=crop&w=400&q=80'),
    ('Pêssego', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1595124253848-21227d3f3045?auto=format&fit=crop&w=400&q=80'),
    ('Pitaya (Branca / Vermelha)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=400&q=80'),
    ('Romã', cat_frutas, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1615485242231-973f7a01d612?auto=format&fit=crop&w=400&q=80'),
    ('Tangerina (Murcot / Ponkan)', cat_frutas, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=400&q=80');

    -- LEGUMES E RAÍZES
    INSERT INTO public.produtos (nome, categoria_id, tipo_venda, preco_kg, preco_unidade, imagem_url) VALUES
    ('Abóbora (Japonesa / Paulista)', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1506806732259-39c2d4a68470?auto=format&fit=crop&w=400&q=80'),
    ('Batata Doce (Roxa / Branca)', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80'),
    ('Batata Baroa (Mandioquinha)', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80'),
    ('Cogumelos (Paris / Shimeji / Shiitake)', cat_legumes, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'),
    ('Ervilha Torta', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1587486914432-03d1037770d7?auto=format&fit=crop&w=400&q=80'),
    ('Gengibre', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=400&q=80'),
    ('Inhame', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80'),
    ('Maxixe', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1587486914432-03d1037770d7?auto=format&fit=crop&w=400&q=80'),
    ('Palmito Fresco', cat_legumes, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1587486914432-03d1037770d7?auto=format&fit=crop&w=400&q=80'),
    ('Pimenta (Biquinho / Cambuci)', cat_legumes, 'peso', 0.00, 0.00, 'https://images.unsplash.com/photo-1588252303782-cb80119f702e?auto=format&fit=crop&w=400&q=80'),
    ('Rabanete', cat_legumes, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1590005354167-6da97870c912?auto=format&fit=crop&w=400&q=80');

    -- VERDURAS E ERVAS
    INSERT INTO public.produtos (nome, categoria_id, tipo_venda, preco_kg, preco_unidade, imagem_url) VALUES
    ('Almeirão', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'),
    ('Aspargos', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1515471209610-dae1c92d814e?auto=format&fit=crop&w=400&q=80'),
    ('Catalonha', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'),
    ('Chicória', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'),
    ('Salsão / Aipo', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?auto=format&fit=crop&w=400&q=80'),
    ('Taioba', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'),
    ('Alecrim / Louro / Tomilho', cat_verduras, 'unidade', 0.00, 0.00, 'https://images.unsplash.com/photo-1594900161927-937800bb8ca8?auto=format&fit=crop&w=400&q=80');

END $$;
