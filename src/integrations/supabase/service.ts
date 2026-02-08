/**
 * Serviço aprimorado de conexão com Supabase
 * Fornece métodos otimizados e tipados para interação com o banco de dados
 */

import { supabase } from './client';
import type { Database, Json } from './types';

// Types para facilitar o uso
export type Produto = Database['public']['Tables']['produtos']['Row'];
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert'];
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update'];

export type Categoria = Database['public']['Tables']['categorias']['Row'];
export type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];

export type Venda = Database['public']['Tables']['vendas']['Row'];
export type VendaInsert = Database['public']['Tables']['vendas']['Insert'];

export type ItemVenda = Database['public']['Tables']['itens_venda']['Row'];
export type ItemVendaInsert = Database['public']['Tables']['itens_venda']['Insert'];

export type MovimentacaoEstoque = Database['public']['Tables']['movimentacoes_estoque']['Row'];
export type MovimentacaoEstoqueInsert = Database['public']['Tables']['movimentacoes_estoque']['Insert'];

/**
 * Serviço de Produtos
 */
export const ProdutosService = {
  /**
   * Lista todos os produtos ativos com suas categorias
   * Suporta paginação para grandes volumes de dados
   */
  async listar(filtros?: {
    busca?: string;
    categoriaId?: string;
    apenasComEstoque?: boolean;
    tipoVenda?: Database['public']['Enums']['tipo_venda'];
    pagina?: number;
    limite?: number;
  }) {
    const limite = filtros?.limite || 1000; // Limite padrão de 1000, pode ser aumentado
    const pagina = filtros?.pagina || 0;
    const inicio = pagina * limite;
    const fim = inicio + limite - 1;

    let query = supabase
      .from('produtos')
      .select('*, categorias(*)', { count: 'exact' })
      .eq('ativo', true)
      .order('nome')
      .range(inicio, fim);

    if (filtros?.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,codigo_barras.ilike.%${filtros.busca}%`);
    }

    if (filtros?.categoriaId) {
      query = query.eq('categoria_id', filtros.categoriaId);
    }

    if (filtros?.apenasComEstoque) {
      query = query.gt('estoque_atual', 0);
    }

    if (filtros?.tipoVenda) {
      query = query.eq('tipo_venda', filtros.tipoVenda);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0, pagina, limite };
  },

  /**
   * Busca produto por código de barras
   */
  async buscarPorCodigoBarras(codigoBarras: string) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categorias(*)')
      .eq('codigo_barras', codigoBarras)
      .eq('ativo', true)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Busca produto por ID
   */
  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categorias(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cria um novo produto
   */
  async criar(produto: ProdutoInsert) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select('*, categorias(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza um produto existente
   */
  async atualizar(id: string, produto: ProdutoUpdate) {
    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select('*, categorias(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Ajusta o estoque de um produto
   */
  async ajustarEstoque(
    produtoId: string,
    quantidade: number,
    tipo: 'entrada' | 'saida' | 'ajuste' | 'venda',
    motivo?: string
  ) {
    // Buscar estoque atual
    const { data: produto, error: errorProduto } = await supabase
      .from('produtos')
      .select('estoque_atual')
      .eq('id', produtoId)
      .single();

    if (errorProduto) throw errorProduto;

    const estoqueAnterior = produto.estoque_atual;
    const estoqueNovo = (tipo === 'saida' || tipo === 'venda')
      ? estoqueAnterior - quantidade
      : estoqueAnterior + quantidade;

    // Atualizar estoque
    const { error: errorUpdate } = await supabase
      .from('produtos')
      .update({ estoque_atual: estoqueNovo })
      .eq('id', produtoId);

    if (errorUpdate) throw errorUpdate;

    // Registrar movimentação
    const { data: movimentacao, error: errorMov } = await supabase
      .from('movimentacoes_estoque')
      .insert([{
        produto_id: produtoId,
        tipo,
        quantidade,
        estoque_anterior: estoqueAnterior,
        estoque_novo: estoqueNovo,
        motivo,
      }])
      .select()
      .single();

    if (errorMov) throw errorMov;
    return movimentacao;
  },

  /**
   * Lista produtos com estoque baixo
   */
  async listarEstoqueBaixo(limite: number = 1000, pagina: number = 0) {
    const inicio = pagina * limite;
    const fim = inicio + limite - 1;

    // Como o Supabase não permite comparar duas colunas diretamente no filtro .filter()
    // Buscamos os produtos ativos e filtramos no frontend
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categorias(*)')
      .eq('ativo', true)
      .order('estoque_atual');

    if (error) throw error;

    const produtosBaixoEstoque = (data || []).filter(
      p => p.estoque_atual <= (p.estoque_minimo || 0)
    );

    const paginado = produtosBaixoEstoque.slice(inicio, inicio + limite);

    return {
      data: paginado,
      count: produtosBaixoEstoque.length,
      pagina,
      limite
    };
  }
};

/**
 * Serviço de Categorias
 */
export const CategoriasService = {
  /**
   * Lista todas as categorias ativas
   */
  async listar() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;
    return data;
  },

  /**
   * Cria uma nova categoria
   */
  async criar(categoria: CategoriaInsert) {
    const { data, error } = await supabase
      .from('categorias')
      .insert([categoria])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Serviço de Vendas
 */
export const VendasService = {
  /**
   * Cria uma nova venda com seus itens
   */
  async criar(venda: VendaInsert, itens: Omit<ItemVendaInsert, 'venda_id'>[], pagamentos: any[] = []) {
    // Usar RPC transacional para garantir consistência e performance
    const { data: vendaCriada, error } = await supabase.rpc('processar_venda_completa', {
      p_venda: venda as unknown as Json,
      p_itens: itens as unknown as Json,
      p_pagamentos: pagamentos as unknown as Json,
    });

    if (error) {
      console.error('Erro ao processar venda completa via RPC:', error);
      throw error;
    }

    // O RPC retorna o objeto da venda criado
    const vendaResult = vendaCriada as unknown as Venda;

    return { venda: vendaResult, itens: [] };
  },

  /**
   * Lista vendas com filtros
   */
  async listar(filtros?: {
    dataInicio?: string;
    dataFim?: string;
    status?: Database['public']['Enums']['status_venda'];
  }) {
    let query = supabase
      .from('vendas')
      .select('*, itens_venda(*, produtos(*))')
      .order('data_hora', { ascending: false });

    if (filtros?.dataInicio) {
      query = query.gte('data_hora', filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      query = query.lte('data_hora', filtros.dataFim);
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Busca uma venda específica por ID
   */
  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('vendas')
      .select('*, itens_venda(*, produtos(*, categorias(*)))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Finaliza uma venda
   */
  async finalizar(id: string, formaPagamento: Database['public']['Enums']['forma_pagamento']) {
    const { data, error } = await supabase
      .from('vendas')
      .update({
        status: 'finalizada',
        forma_pagamento: formaPagamento,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancela uma venda e reverte o estoque
   */
  async cancelar(id: string) {
    // Buscar itens da venda
    const { data: venda, error: errorVenda } = await supabase
      .from('vendas')
      .select('*, itens_venda(*)')
      .eq('id', id)
      .single();

    if (errorVenda) throw errorVenda;

    // Reverter estoque
    if (venda.itens_venda) {
      for (const item of venda.itens_venda) {
        await ProdutosService.ajustarEstoque(
          item.produto_id,
          item.quantidade,
          'entrada',
          `Cancelamento da venda #${venda.numero_venda}`
        );
      }
    }

    // Atualizar status da venda
    const { data, error } = await supabase
      .from('vendas')
      .update({ status: 'cancelada' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obtém estatísticas de vendas
   */
  async obterEstatisticas(dataInicio?: string, dataFim?: string) {
    let query = supabase
      .from('vendas')
      .select('total, data_hora, status')
      .eq('status', 'finalizada');

    if (dataInicio) {
      query = query.gte('data_hora', dataInicio);
    }

    if (dataFim) {
      query = query.lte('data_hora', dataFim);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalVendas = data.length;
    const valorTotal = data.reduce((acc, venda) => acc + Number(venda.total), 0);
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

    return {
      totalVendas,
      valorTotal,
      ticketMedio,
    };
  },
};

/**
 * Serviço de Movimentações de Estoque
 */
export const MovimentacoesService = {
  /**
   * Lista movimentações de estoque
   */
  async listar(produtoId?: string, limite: number = 50) {
    let query = supabase
      .from('movimentacoes_estoque')
      .select('*, produtos(nome, codigo_barras)')
      .order('created_at', { ascending: false })
      .limit(limite);

    if (produtoId) {
      query = query.eq('produto_id', produtoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

/**
 * Utilitários de conexão
 */
export const SupabaseUtils = {
  /**
   * Verifica se a conexão com o Supabase está ativa
   */
  async verificarConexao() {
    try {
      const { error } = await supabase.from('categorias').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Obtém informações sobre o projeto Supabase
   */
  getProjectInfo() {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    };
  },
};

export default {
  Produtos: ProdutosService,
  Categorias: CategoriasService,
  Vendas: VendasService,
  Movimentacoes: MovimentacoesService,
  Utils: SupabaseUtils,
};
