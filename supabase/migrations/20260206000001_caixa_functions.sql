-- Função para abrir o caixa
CREATE OR REPLACE FUNCTION abrir_caixa(p_operador_id UUID, p_valor_inicial NUMERIC)
RETURNS UUID AS $$
DECLARE
  v_caixa_id UUID;
BEGIN
  -- Verificar se já existe caixa aberto para este operador (opcional, regra de negócio)
  IF EXISTS (SELECT 1 FROM public.caixas WHERE operador_id = p_operador_id AND status = 'aberto') THEN
    RAISE EXCEPTION 'Já existe um caixa aberto para este operador.';
  END IF;

  INSERT INTO public.caixas (operador_id, valor_inicial, status, data_abertura, saldo_dinheiro)
  VALUES (p_operador_id, p_valor_inicial, 'aberto', NOW(), p_valor_inicial)
  RETURNING id INTO v_caixa_id;

  RETURN v_caixa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para realizar sangria ou suprimento
CREATE OR REPLACE FUNCTION movimentar_caixa(
  p_caixa_id UUID,
  p_tipo TEXT, -- 'sangria' ou 'suprimento'
  p_valor NUMERIC,
  p_motivo TEXT,
  p_usuario_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'O valor deve ser positivo.';
  END IF;

  -- Registrar movimentação
  INSERT INTO public.movimentacoes_caixa (caixa_id, tipo, valor, motivo, usuario_responsavel)
  VALUES (p_caixa_id, p_tipo, p_valor, p_motivo, p_usuario_id);

  -- Atualizar saldo do caixa
  IF p_tipo = 'sangria' THEN
    UPDATE public.caixas 
    SET saldo_dinheiro = saldo_dinheiro - p_valor 
    WHERE id = p_caixa_id;
  ELSIF p_tipo = 'suprimento' THEN
    UPDATE public.caixas 
    SET saldo_dinheiro = saldo_dinheiro + p_valor 
    WHERE id = p_caixa_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para fechar caixa
CREATE OR REPLACE FUNCTION fechar_caixa(
  p_caixa_id UUID, 
  p_valor_final_informado NUMERIC,
  p_quebra NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.caixas
  SET 
    status = 'fechado',
    data_fechamento = NOW(),
    valor_final = p_valor_final_informado,
    quebra_de_caixa = p_quebra
  WHERE id = p_caixa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar saldo do caixa ao realizar venda
CREATE OR REPLACE FUNCTION atualizar_saldo_caixa_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para vendas finalizadas confirmadas
  IF NEW.status = 'finalizada' AND NEW.caixa_id IS NOT NULL THEN
    -- Converter caixa_id de texto para uuid se necessário, ou assumir que a tabela vendas usa uuid ou text
    -- O schema mostrou vendas.caixa_id como TEXT, vamos fazer cast
    
    IF NEW.forma_pagamento = 'dinheiro' THEN
       UPDATE public.caixas SET saldo_dinheiro = saldo_dinheiro + NEW.total WHERE id = NEW.caixa_id::UUID;
    ELSIF NEW.forma_pagamento = 'debito' THEN
       UPDATE public.caixas SET saldo_cartao = saldo_cartao + NEW.total WHERE id = NEW.caixa_id::UUID;
    ELSIF NEW.forma_pagamento = 'credito' THEN
       UPDATE public.caixas SET saldo_cartao = saldo_cartao + NEW.total WHERE id = NEW.caixa_id::UUID;
    ELSIF NEW.forma_pagamento = 'pix' THEN
       UPDATE public.caixas SET saldo_pix = saldo_pix + NEW.total WHERE id = NEW.caixa_id::UUID;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger se não existir
DROP TRIGGER IF EXISTS trg_atualizar_saldo_caixa ON public.vendas;
CREATE TRIGGER trg_atualizar_saldo_caixa
AFTER INSERT OR UPDATE OF status ON public.vendas
FOR EACH ROW
WHEN (NEW.status = 'finalizada')
EXECUTE FUNCTION atualizar_saldo_caixa_venda();

-- Permissões
GRANT EXECUTE ON FUNCTION abrir_caixa(UUID, NUMERIC) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION movimentar_caixa(UUID, TEXT, NUMERIC, TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION fechar_caixa(UUID, NUMERIC, NUMERIC) TO authenticated, anon;
