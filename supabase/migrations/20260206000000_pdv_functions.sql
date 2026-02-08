-- Função para marcar venda como impressa
CREATE OR REPLACE FUNCTION marcar_venda_impressa(p_venda_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.vendas
  SET cupom_impresso = TRUE,
      updated_at = NOW()
  WHERE id = p_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função segura para decrementar estoque (caso precise ser chamada manualmente ou por script externo)
CREATE OR REPLACE FUNCTION decrementar_estoque(p_produto_id UUID, p_quantidade NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.produtos
  SET 
    estoque_atual = estoque_atual - p_quantidade,
    quantidade_disponivel = quantidade_disponivel - p_quantidade,
    updated_at = NOW()
  WHERE id = p_produto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões para o role autenticado e anonimo (se for app público/kiosk)
GRANT EXECUTE ON FUNCTION marcar_venda_impressa(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION decrementar_estoque(UUID, NUMERIC) TO authenticated, anon;

-- Política RLS para garantir que PDV consiga inserir vendas e itens
-- (Verificando se já existem, senão criar. O comando 'create policy if not exists' não é padrão SQL puro simples,
--  então vamos usar DO block ou assumir que precisamos criar se falhar)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vendas' AND policyname = 'Vendas Insert Publico'
    ) THEN
        CREATE POLICY "Vendas Insert Publico" ON public.vendas FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'itens_venda' AND policyname = 'Itens Insert Publico'
    ) THEN
        CREATE POLICY "Itens Insert Publico" ON public.itens_venda FOR INSERT WITH CHECK (true);
    END IF;
END $$;
