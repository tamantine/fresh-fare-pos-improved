/**
 * Exemplo de utilização das funções RPC seguras
 * Demonstrando como substituir chamadas SQL arbitrário por RPCs específicos
 */

import { 
  getVendasResumo, 
  getProdutosEstoque, 
  updateEstoque, 
  insertVenda,
  insertMovimentacao 
} from '@/integrations/supabase/rpc';

// Exemplo de como obter resumo de vendas
export async function obterResumoVendas() {
  try {
    // Obter resumo dos últimos 30 dias
    const resumo = await getVendasResumo();
    console.log('Resumo de vendas:', resumo[0]);
    
    // Obter resumo de um período específico
    const dataInicial = new Date('2024-01-01');
    const dataFinal = new Date('2024-01-31');
    const resumoJaneiro = await getVendasResumo(dataInicial, dataFinal);
    console.log('Resumo de janeiro:', resumoJaneiro[0]);
    
    return resumo[0];
  } catch (error) {
    console.error('Erro ao obter resumo de vendas:', error);
    throw error;
  }
}

// Exemplo de como obter produtos com filtro
export async function obterProdutosComFiltro() {
  try {
    // Obter todos os produtos
    const todosProdutos = await getProdutosEstoque();
    console.log('Todos os produtos:', todosProdutos);
    
    // Obter produtos de uma categoria específica
    const categoriaId = 'uuid-da-categoria';
    const produtosCategoria = await getProdutosEstoque(categoriaId);
    console.log('Produtos da categoria:', produtosCategoria);
    
    // Buscar produtos por nome ou código de barras
    const produtosBusca = await getProdutosEstoque(null, 'batata');
    console.log('Produtos encontrados:', produtosBusca);
    
    return todosProdutos;
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    throw error;
  }
}

// Exemplo de como atualizar estoque
export async function ajustarEstoque(produtoId: string, quantidade: number, motivo: string) {
  try {
    const resultado = await updateEstoque(produtoId, quantidade, motivo);
    
    if (resultado[0].sucesso) {
      console.log('Estoque atualizado com sucesso:', resultado[0]);
      return resultado[0];
    } else {
      console.error('Falha ao atualizar estoque:', resultado[0].mensagem);
      throw new Error(resultado[0].mensagem);
    }
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    throw error;
  }
}

// Exemplo de como inserir uma venda
export async function registrarVenda(
  subtotal: number,
  desconto: number,
  total: number,
  formaPagamento: string
) {
  try {
    const resultado = await insertVenda(subtotal, desconto, total, formaPagamento);
    
    if (resultado[0].sucesso) {
      console.log('Venda registrada com sucesso:', resultado[0]);
      return resultado[0];
    } else {
      console.error('Falha ao registrar venda:', resultado[0].mensagem);
      throw new Error(resultado[0].mensagem);
    }
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    throw error;
  }
}

// Exemplo de como registrar movimentação de estoque
export async function registrarMovimentacao(
  produtoId: string,
  tipo: string,
  quantidade: number,
  estoqueAnterior: number,
  estoqueNovo: number,
  vendaId?: string
) {
  try {
    const resultado = await insertMovimentacao(
      produtoId,
      tipo,
      quantidade,
      estoqueAnterior,
      estoqueNovo,
      vendaId
    );
    
    if (resultado[0].sucesso) {
      console.log('Movimentação registrada com sucesso:', resultado[0]);
      return resultado[0];
    } else {
      console.error('Falha ao registrar movimentação:', resultado[0].mensagem);
      throw new Error(resultado[0].mensagem);
    }
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw error;
  }
}

// Exemplo de fluxo completo de venda com movimentação de estoque
export async function registrarVendaCompleta(
  itens: Array<{
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }>,
  formaPagamento: string
) {
  try {
    // Calcular totais
    const subtotal = itens.reduce((acc, item) => acc + item.subtotal, 0);
    const desconto = 0; // Pode ser calculado dinamicamente
    const total = subtotal - desconto;
    
    // 1. Registrar a venda
    const venda = await registrarVenda(subtotal, desconto, total, formaPagamento);
    
    if (!venda.venda_id) {
      throw new Error('Falha ao obter ID da venda');
    }
    
    // 2. Atualizar estoque e registrar movimentações para cada item
    for (const item of itens) {
      // Obter estoque atual do produto
      const produtos = await getProdutosEstoque(null, '');
      const produto = produtos.find(p => p.id === item.produtoId);
      
      if (!produto) {
        throw new Error(`Produto não encontrado: ${item.produtoId}`);
      }
      
      // Atualizar estoque (subtrair quantidade vendida)
      const estoqueAnterior = produto.estoque_atual;
      const estoqueNovo = estoqueAnterior - item.quantidade;
      
      await updateEstoque(item.produtoId, -item.quantidade, 'venda');
      
      // Registrar movimentação de saída
      await registrarMovimentacao(
        item.produtoId,
        'saida',
        item.quantidade,
        estoqueAnterior,
        estoqueNovo,
        venda.venda_id
      );
    }
    
    console.log('Venda completa registrada com sucesso');
    return venda;
    
  } catch (error) {
    console.error('Erro no fluxo de venda completa:', error);
    throw error;
  }
}

export default {
  obterResumoVendas,
  obterProdutosComFiltro,
  ajustarEstoque,
  registrarVenda,
  registrarMovimentacao,
  registrarVendaCompleta
};