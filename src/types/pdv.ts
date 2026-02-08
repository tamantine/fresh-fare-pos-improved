export type TipoVenda = 'peso' | 'unidade' | 'hibrido';
export type FormaPagamento = 'dinheiro' | 'debito' | 'credito' | 'pix';
export type StatusVenda = 'aberta' | 'finalizada' | 'cancelada';

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  categoria_pai_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  codigo_barras?: string;
  nome: string;
  categoria_id?: string;
  categoria?: Categoria;
  tipo_venda: TipoVenda;
  preco_kg?: number;
  preco_unidade?: number;
  estoque_atual: number;
  estoque_minimo: number;
  margem_lucro?: number;
  perecivel: boolean;
  validade?: string;
  fornecedor_id?: string;
  imagem_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  produto?: Produto;
  quantidade: number;
  peso_liquido?: number;
  preco_unitario: number;
  subtotal: number;
  desconto_item: number;
  sequencia: number;
  created_at: string;
}

export interface Venda {
  id: string;
  numero_venda: number;
  data_hora: string;
  caixa_id?: string;
  operador_id?: string;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento?: FormaPagamento;
  status: StatusVenda;
  cupom_impresso: boolean;
  sincronizado: boolean;
  observacoes?: string;
  itens?: ItemVenda[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  produto: Produto;
  quantidade: number;
  peso?: number;
  preco_unitario: number;
  subtotal: number;
  desconto: number;
}
