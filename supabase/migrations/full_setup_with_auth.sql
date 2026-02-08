-- SQL Script Completo para Supabase - Hortifruti Bom Preço
-- Este script inclui a criação de tabelas, tipos, funções, triggers, 
-- políticas de Row Level Security (RLS) e integração com Supabase Auth.

-- 1. Tipos ENUM
--------------------------------------------------------------------------------
CREATE TYPE public.tipo_venda AS ENUM (
  'peso',
  'unidade',
  'hibrido'
);

CREATE TYPE public.forma_pagamento AS ENUM (
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

-- 2. Tabelas Principais
--------------------------------------------------------------------------------

-- Tabela: public.categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#27ae60',
  icone TEXT,
  categoria_pai_id UUID REFERENCES public.categorias(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_barras TEXT UNIQUE,
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id),
  tipo_venda tipo_venda NOT NULL DEFAULT 'unidade',
  preco_kg DECIMAL(10,2),
  preco_unidade DECIMAL(10,2),
  estoque_atual DECIMAL(10,3) NOT NULL DEFAULT 0,
  estoque_minimo DECIMAL(10,3) NOT NULL DEFAULT 0,
  margem_lucro DECIMAL(5,2),
  perecivel BOOLEAN NOT NULL DEFAULT false,
  validade DATE,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.vendas
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_venda SERIAL NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  caixa_id TEXT,
  operador_id UUID REFERENCES auth.users(id), -- Referência ao usuário autenticado
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento forma_pagamento,
  status status_venda NOT NULL DEFAULT 'aberta',
  cupom_impresso BOOLEAN NOT NULL DEFAULT false,
  sincronizado BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.itens_venda
CREATE TABLE public.itens_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  peso_liquido DECIMAL(10,3),
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  desconto_item DECIMAL(10,2) NOT NULL DEFAULT 0,
  sequencia INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.movimentacoes_estoque (Audit Log)
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda')),
  quantidade DECIMAL(10,3) NOT NULL,
  estoque_anterior DECIMAL(10,3) NOT NULL,
  estoque_novo DECIMAL(10,3) NOT NULL,
  motivo TEXT,
  venda_id UUID REFERENCES public.vendas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: public.profiles (para dados adicionais do usuário)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Funções e Triggers
--------------------------------------------------------------------------------

-- Função para atualizar a coluna 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática de 'updated_at'
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar um perfil automaticamente após o registro de um novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para 'handle_new_user' na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Row Level Security (RLS)
--------------------------------------------------------------------------------

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para public.profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para public.categorias
CREATE POLICY "Allow authenticated users to view categorias" ON public.categorias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert categorias" ON public.categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update categorias" ON public.categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete categorias" ON public.categorias FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para public.fornecedores
CREATE POLICY "Allow authenticated users to view fornecedores" ON public.fornecedores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update fornecedores" ON public.fornecedores FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete fornecedores" ON public.fornecedores FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para public.produtos
CREATE POLICY "Allow authenticated users to view produtos" ON public.produtos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert produtos" ON public.produtos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update produtos" ON public.produtos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete produtos" ON public.produtos FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para public.vendas
CREATE POLICY "Allow authenticated users to view vendas" ON public.vendas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert vendas" ON public.vendas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update vendas" ON public.vendas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete vendas" ON public.vendas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para public.itens_venda
CREATE POLICY "Allow authenticated users to view itens_venda" ON public.itens_venda FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert itens_venda" ON public.itens_venda FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update itens_venda" ON public.itens_venda FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete itens_venda" ON public.itens_venda FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para public.movimentacoes_estoque
CREATE POLICY "Allow authenticated users to view movimentacoes_estoque" ON public.movimentacoes_estoque FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert movimentacoes_estoque" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Índices para Performance
--------------------------------------------------------------------------------
CREATE INDEX idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_produtos_nome ON public.produtos(nome);
CREATE INDEX idx_vendas_data ON public.vendas(data_hora);
CREATE INDEX idx_vendas_status ON public.vendas(status);
CREATE INDEX idx_itens_venda_venda ON public.itens_venda(venda_id);

-- 6. Configuração de Autenticação (Exemplo - Ajuste conforme necessidade)
--------------------------------------------------------------------------------
-- Você pode configurar provedores de autenticação (email/senha, Google, etc.)
-- diretamente no painel do Supabase em Authentication -> Settings.
-- Este script garante que a tabela 'profiles' seja criada e vinculada.

-- Para permitir que usuários se registrem via email/senha, vá em:
-- Supabase Dashboard -> Authentication -> Settings -> Email Sign Up -> Habilitar

-- Para testar, você pode criar um usuário manualmente no painel do Supabase
-- ou usar a função de registro na aplicação após implementarmos a tela de login.

-- FIM DO SCRIPT
