-- Create enum for tipo_venda
CREATE TYPE public.tipo_venda AS ENUM ('peso', 'unidade', 'hibrido');

-- Create enum for forma_pagamento
CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'debito', 'credito', 'pix');

-- Create enum for status_venda
CREATE TYPE public.status_venda AS ENUM ('aberta', 'finalizada', 'cancelada');

-- Create categorias table
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

-- Create fornecedores table
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

-- Create produtos table
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

-- Create vendas table
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_venda SERIAL NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  caixa_id TEXT,
  operador_id UUID,
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

-- Create itens_venda table
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

-- Create movimentacoes_estoque table for audit log
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

-- Enable RLS on all tables
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for demo/testing - in production would require auth)
CREATE POLICY "Allow public read access to categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Allow public insert to categorias" ON public.categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to categorias" ON public.categorias FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to fornecedores" ON public.fornecedores FOR SELECT USING (true);
CREATE POLICY "Allow public insert to fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to fornecedores" ON public.fornecedores FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to produtos" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Allow public insert to produtos" ON public.produtos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to produtos" ON public.produtos FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to vendas" ON public.vendas FOR SELECT USING (true);
CREATE POLICY "Allow public insert to vendas" ON public.vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to vendas" ON public.vendas FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to itens_venda" ON public.itens_venda FOR SELECT USING (true);
CREATE POLICY "Allow public insert to itens_venda" ON public.itens_venda FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete to itens_venda" ON public.itens_venda FOR DELETE USING (true);

CREATE POLICY "Allow public read access to movimentacoes_estoque" ON public.movimentacoes_estoque FOR SELECT USING (true);
CREATE POLICY "Allow public insert to movimentacoes_estoque" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_produtos_nome ON public.produtos(nome);
CREATE INDEX idx_vendas_data ON public.vendas(data_hora);
CREATE INDEX idx_vendas_status ON public.vendas(status);
CREATE INDEX idx_itens_venda_venda ON public.itens_venda(venda_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();