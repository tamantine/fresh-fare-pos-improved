-- SQL Script Completo para Supabase - Hortifruti Bom Preço (ERP Completo)
-- Este script inclui a criação de tabelas, tipos, funções, triggers, 
-- políticas de Row Level Security (RLS) e integração com Supabase Auth.
-- Inclui as novas tabelas: clientes, estoque (detalhado), precos_historico, 
-- formas_pagamento, vendas_pagamentos, usuarios, caixa, despesas.

-- ATENÇÃO: Se você já possui o banco de dados configurado, execute este script
-- com cautela. Recomenda-se fazer um backup antes. Este script irá ADICIONAR
-- novas tabelas e modificar algumas existentes (como 'produtos' e 'vendas').

-- 1. Tipos ENUM (Atualizados e Novos)
--------------------------------------------------------------------------------
-- Tipos existentes
CREATE TYPE public.tipo_venda AS ENUM (
  'peso',
  'unidade',
  'hibrido'
);

CREATE TYPE public.forma_pagamento_venda AS ENUM (
  'dinheiro',
  'debito',
  'credito',
  'pix'
);

CREATE TYPE public.status_venda AS ENUM (
  'aberta',
  'finalizada',
  'cancelada'
);

-- Novos tipos
CREATE TYPE public.perfil_usuario AS ENUM (
  'admin',
  'vendedor',
  'estoquista'
);

CREATE TYPE public.status_caixa AS ENUM (
  'aberto',
  'fechado'
);

CREATE TYPE public.status_despesa AS ENUM (
  'pago',
  'pendente'
);

-- 2. Tabelas Principais (Atualizadas e Novas)
--------------------------------------------------------------------------------

-- Tabela: public.categorias (Existente)
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#27ae60',
  icone TEXT,
  categoria_pai_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.fornecedores (Existente)
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.produtos (Atualizada)
-- Adicionado quantidade_minima e renomeado estoque_atual para quantidade_disponivel
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo_barras TEXT UNIQUE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  tipo_venda public.tipo_venda NOT NULL DEFAULT 'unidade',
  preco_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (preco_kg >= 0),
  preco_unidade NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (preco_unidade >= 0),
  quantidade_disponivel NUMERIC(10, 3) NOT NULL DEFAULT 0.000 CHECK (quantidade_disponivel >= 0), -- Renomeado e tipo ajustado para peso
  quantidade_minima NUMERIC(10, 3) NOT NULL DEFAULT 0.000 CHECK (quantidade_minima >= 0), -- Novo campo
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.clientes (NOVA)
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT UNIQUE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  data_nascimento DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.precos_historico (NOVA)
CREATE TABLE public.precos_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  preco_anterior NUMERIC(10, 2) NOT NULL,
  preco_novo NUMERIC(10, 2) NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.formas_pagamento (NOVA)
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  taxa_percentual NUMERIC(5, 2) DEFAULT 0.00 CHECK (taxa_percentual >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir formas de pagamento padrão
INSERT INTO public.formas_pagamento (nome, ativo, taxa_percentual) VALUES
('Dinheiro', TRUE, 0.00),
('Pix', TRUE, 0.00),
('Cartão Débito', TRUE, 1.50),
('Cartão Crédito', TRUE, 3.00)
ON CONFLICT (nome) DO NOTHING;

-- Tabela: public.vendas (Atualizada)
-- Adicionado cliente_id e removido forma_pagamento (agora em vendas_pagamentos)
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Vincula ao usuário autenticado
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_bruto NUMERIC(10, 2) NOT NULL CHECK (total_bruto >= 0),
  desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (desconto >= 0),
  total_liquido NUMERIC(10, 2) NOT NULL CHECK (total_liquido >= 0),
  status public.status_venda NOT NULL DEFAULT 'aberta',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.itens_venda (Existente)
CREATE TABLE public.itens_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  quantidade NUMERIC(10, 3) NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.vendas_pagamentos (NOVA)
CREATE TABLE public.vendas_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  forma_pagamento_id UUID NOT NULL REFERENCES public.formas_pagamento(id) ON DELETE RESTRICT,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.movimentacoes_estoque (Existente)
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL, -- 'entrada', 'saida', 'ajuste'
  quantidade NUMERIC(10, 3) NOT NULL CHECK (quantidade > 0),
  estoque_anterior NUMERIC(10, 3) NOT NULL,
  estoque_novo NUMERIC(10, 3) NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.usuarios (NOVA) - Para perfis de usuário do sistema
-- Vinculada à tabela auth.users do Supabase
CREATE TABLE public.usuarios (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil public.perfil_usuario NOT NULL DEFAULT 'vendedor',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.caixa (NOVA)
CREATE TABLE public.caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_inicial NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_inicial >= 0),
  valor_final NUMERIC(10, 2) CHECK (valor_final >= 0),
  valor_vendas NUMERIC(10, 2) DEFAULT 0.00 CHECK (valor_vendas >= 0),
  valor_despesas NUMERIC(10, 2) DEFAULT 0.00 CHECK (valor_despesas >= 0),
  status public.status_caixa NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.despesas (NOVA)
CREATE TABLE public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  categoria TEXT, -- 'luz', 'água', 'aluguel', etc.
  data_vencimento DATE,
  data_pagamento DATE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  status public.status_despesa NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Funções e Triggers (Atualizadas e Novas)
--------------------------------------------------------------------------------

-- Função para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

-- Trigger para `categorias`
CREATE OR REPLACE TRIGGER set_categorias_updated_at 
BEFORE UPDATE ON public.categorias 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `fornecedores`
CREATE OR REPLACE TRIGGER set_fornecedores_updated_at 
BEFORE UPDATE ON public.fornecedores 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `produtos`
CREATE OR REPLACE TRIGGER set_produtos_updated_at 
BEFORE UPDATE ON public.produtos 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `clientes`
CREATE OR REPLACE TRIGGER set_clientes_updated_at 
BEFORE UPDATE ON public.clientes 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `vendas`
CREATE OR REPLACE TRIGGER set_vendas_updated_at 
BEFORE UPDATE ON public.vendas 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `formas_pagamento`
CREATE OR REPLACE TRIGGER set_formas_pagamento_updated_at 
BEFORE UPDATE ON public.formas_pagamento 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `usuarios`
CREATE OR REPLACE TRIGGER set_usuarios_updated_at 
BEFORE UPDATE ON public.usuarios 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `caixa`
CREATE OR REPLACE TRIGGER set_caixa_updated_at 
BEFORE UPDATE ON public.caixa 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para `despesas`
CREATE OR REPLACE TRIGGER set_despesas_updated_at 
BEFORE UPDATE ON public.despesas 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Função para criar um perfil de usuário na tabela `public.usuarios` após o registro no `auth.users`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>
'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para `auth.users`
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Row Level Security (RLS) - Políticas (Atualizadas e Novas)
--------------------------------------------------------------------------------

-- Habilitar RLS para todas as tabelas (se ainda não estiverem habilitadas)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem) para evitar conflitos
DROP POLICY IF EXISTS "Allow authenticated users to view categories" ON public.categorias;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categorias;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categorias;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categorias;

DROP POLICY IF EXISTS "Allow authenticated users to view suppliers" ON public.fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to insert suppliers" ON public.fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to update suppliers" ON public.fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to delete suppliers" ON public.fornecedores;

DROP POLICY IF EXISTS "Allow authenticated users to view products" ON public.produtos;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.produtos;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.produtos;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.produtos;

DROP POLICY IF EXISTS "Allow authenticated users to view sales" ON public.vendas;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON public.vendas;
DROP POLICY IF EXISTS "Allow authenticated users to update sales" ON public.vendas;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales" ON public.vendas;

DROP POLICY IF EXISTS "Allow authenticated users to view itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Allow authenticated users to insert itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Allow authenticated users to update itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Allow authenticated users to delete itens_venda" ON public.itens_venda;

DROP POLICY IF EXISTS "Allow authenticated users to view movimentacoes_estoque" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "Allow authenticated users to insert movimentacoes_estoque" ON public.movimentacoes_estoque;

-- Políticas RLS para public.categorias
CREATE POLICY "Categorias: Acesso total para autenticados" ON public.categorias
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.fornecedores
CREATE POLICY "Fornecedores: Acesso total para autenticados" ON public.fornecedores
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.produtos
CREATE POLICY "Produtos: Acesso total para autenticados" ON public.produtos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.clientes
CREATE POLICY "Clientes: Acesso total para autenticados" ON public.clientes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.precos_historico
CREATE POLICY "Precos_Historico: Acesso total para autenticados" ON public.precos_historico
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.formas_pagamento
CREATE POLICY "Formas_Pagamento: Acesso total para autenticados" ON public.formas_pagamento
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.vendas
CREATE POLICY "Vendas: Acesso total para autenticados" ON public.vendas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.itens_venda
CREATE POLICY "Itens_Venda: Acesso total para autenticados" ON public.itens_venda
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.vendas_pagamentos
CREATE POLICY "Vendas_Pagamentos: Acesso total para autenticados" ON public.vendas_pagamentos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.movimentacoes_estoque
CREATE POLICY "Movimentacoes_Estoque: Acesso total para autenticados" ON public.movimentacoes_estoque
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.usuarios
CREATE POLICY "Usuarios: Acesso total para autenticados" ON public.usuarios
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.caixa
CREATE POLICY "Caixa: Acesso total para autenticados" ON public.caixa
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para public.despesas
CREATE POLICY "Despesas: Acesso total para autenticados" ON public.despesas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. Índices para Performance (Atualizados)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_hora);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario ON public.vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON public.itens_venda(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pagamentos_venda ON public.vendas_pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pagamentos_forma_pagamento ON public.vendas_pagamentos(forma_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_precos_historico_produto ON public.precos_historico(produto_id);
CREATE INDEX IF NOT EXISTS idx_caixa_usuario ON public.caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_caixa_data_abertura ON public.caixa(data_abertura);
CREATE INDEX IF NOT EXISTS idx_despesas_fornecedor ON public.despesas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON public.despesas(status);

-- FIM DO SCRIPT
