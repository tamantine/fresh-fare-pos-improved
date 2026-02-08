/**
 * Serviço de RPC seguro para chamadas de funções PostgreSQL
 * Substitui a execução de SQL arbitrário por chamadas a funções específicas
 */

import { supabase } from './client';

export interface VendasResumo {
  total_vendas: number;
  total_receita: number;
  media_ticket: number;
  vendas_hoje: number;
  receita_hoje: number;
}

export interface ProdutoEstoque {
  id: string;
  nome: string;
  codigo_barras: string | null;
  categoria_nome: string;
  tipo_venda: string;
  preco_unidade: number;
  preco_kg: number;
  estoque_atual: number;
  estoque_minimo: number;
  status: string;
}

export interface UpdateEstoqueResult {
  sucesso: boolean;
  mensagem: string;
  estoque_anterior: number;
  estoque_novo: number;
}

export interface InsertVendaResult {
  sucesso: boolean;
  mensagem: string;
  venda_id: string | null;
}

export interface InsertMovimentacaoResult {
  sucesso: boolean;
  mensagem: string;
  movimentacao_id: string | null;
}

/**
 * Obtém resumo de vendas com segurança
 */
export async function getVendasResumo(
  dataInicial?: Date,
  dataFinal?: Date
): Promise<VendasResumo[]> {
  const params: any = {};
  
  if (dataInicial) {
    params.p_data_inicial = dataInicial.toISOString().split('T')[0];
  }
  
  if (dataFinal) {
    params.p_data_final = dataFinal.toISOString().split('T')[0];
  }


  // Monta a query SQL conforme os parâmetros
  let query = 'select * from get_vendas_resumo(';
  query += params.p_data_inicial ? `p_data_inicial := '${params.p_data_inicial}'` : '';
  if (params.p_data_inicial && params.p_data_final) query += ', ';
  query += params.p_data_final ? `p_data_final := '${params.p_data_final}'` : '';
  query += ');';

  const { data, error } = await supabase
    .rpc('execute_sql_query', { query_text: query });

  if (error) {
    throw new Error(`Erro ao obter resumo de vendas: ${error.message}`);
  }

  return data as unknown as VendasResumo[];
}

/**
 * Obtém produtos com estoque com segurança
 */
export async function getProdutosEstoque(
  categoriaId?: string,
  busca?: string
): Promise<ProdutoEstoque[]> {
  // Monta a query SQL conforme os parâmetros
  let query = 'select * from get_produtos_estoque(';
  let paramsArr = [];
  if (categoriaId) paramsArr.push(`p_categoria_id := '${categoriaId}'`);
  if (busca) paramsArr.push(`p_busca := '${busca}'`);
  query += paramsArr.join(', ');
  query += ');';

  const { data, error } = await supabase
    .rpc('execute_sql_query', { query_text: query });

  if (error) {
    throw new Error(`Erro ao obter produtos: ${error.message}`);
  }

  return data as unknown as ProdutoEstoque[];
}

/**
 * Atualiza estoque de forma segura
 */
export async function updateEstoque(
  produtoId: string,
  quantidade: number,
  motivo?: string
): Promise<UpdateEstoqueResult[]> {
  // Monta a query SQL conforme os parâmetros
  let query = 'select * from update_estoque(';
  let paramsArr = [];
  if (produtoId) paramsArr.push(`p_produto_id := '${produtoId}'`);
  if (quantidade !== undefined) paramsArr.push(`p_quantidade := ${quantidade}`);
  paramsArr.push(`p_motivo := '${motivo || 'ajuste_manual'}'`);
  query += paramsArr.join(', ');
  query += ');';

  const { data, error } = await supabase
    .rpc('execute_sql_query', { query_text: query });

  if (error) {
    throw new Error(`Erro ao atualizar estoque: ${error.message}`);
  }

  return data as unknown as UpdateEstoqueResult[];
}

/**
 * Insere venda de forma segura
 */
export async function insertVenda(
  subtotal: number,
  desconto: number,
  total: number,
  formaPagamento: string
): Promise<InsertVendaResult[]> {
  // Monta a query SQL conforme os parâmetros
  let query = 'select * from insert_venda(';
  let paramsArr = [];
  paramsArr.push(`p_subtotal := ${subtotal}`);
  paramsArr.push(`p_desconto := ${desconto}`);
  paramsArr.push(`p_total := ${total}`);
  paramsArr.push(`p_forma_pagamento := '${formaPagamento}'`);
  query += paramsArr.join(', ');
  query += ');';

  const { data, error } = await supabase
    .rpc('execute_sql_query', { query_text: query });

  if (error) {
    throw new Error(`Erro ao inserir venda: ${error.message}`);
  }

  return data as unknown as InsertVendaResult[];
}

/**
 * Insere movimentação de estoque de forma segura
 */
export async function insertMovimentacao(
  produtoId: string,
  tipo: string,
  quantidade: number,
  estoqueAnterior: number,
  estoqueNovo: number,
  vendaId?: string,
  compraId?: string
): Promise<InsertMovimentacaoResult[]> {
  // Monta a query SQL conforme os parâmetros
  let query = 'select * from insert_movimentacao(';
  let paramsArr = [];
  if (produtoId) paramsArr.push(`p_produto_id := '${produtoId}'`);
  if (tipo) paramsArr.push(`p_tipo := '${tipo}'`);
  if (quantidade !== undefined) paramsArr.push(`p_quantidade := ${quantidade}`);
  if (estoqueAnterior !== undefined) paramsArr.push(`p_estoque_anterior := ${estoqueAnterior}`);
  if (estoqueNovo !== undefined) paramsArr.push(`p_estoque_novo := ${estoqueNovo}`);
  paramsArr.push(`p_venda_id := ${vendaId ? `'${vendaId}'` : 'null'}`);
  paramsArr.push(`p_compra_id := ${compraId ? `'${compraId}'` : 'null'}`);
  query += paramsArr.join(', ');
  query += ');';

  const { data, error } = await supabase
    .rpc('execute_sql_query', { query_text: query });

  if (error) {
    throw new Error(`Erro ao inserir movimentação: ${error.message}`);
  }

  return data as unknown as InsertMovimentacaoResult[];
}