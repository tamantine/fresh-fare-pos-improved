import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Produto, Categoria } from '@/types/pdv';

interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  produto?: { nome: string };
  tipo: 'entrada' | 'saida' | 'ajuste' | 'venda';
  quantidade: number;
  estoque_anterior: number;
  estoque_novo: number;
  motivo?: string;
  venda_id?: string;
  created_at: string;
}

export function useProdutosEstoque(searchQuery?: string, categoryId?: string | null, showLowStock?: boolean) {
  return useQuery({
    queryKey: ['produtos-estoque', searchQuery, categoryId, showLowStock],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*, categorias(*)')
        .order('nome');
      
      if (searchQuery) {
        query = query.or(`nome.ilike.%${searchQuery}%,codigo_barras.ilike.%${searchQuery}%`);
      }
      
      if (categoryId) {
        query = query.eq('categoria_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const items = Array.isArray(data) ? data : [];
      let produtos = items.map(item => ({
        ...item,
        categoria: item.categorias as Categoria | undefined,
        tipo_venda: item.tipo_venda as Produto['tipo_venda'],
      })) as Produto[];
      
      if (showLowStock) {
        produtos = produtos.filter(p => p.estoque_atual <= p.estoque_minimo);
      }
      
      return produtos;
    },
  });
}

export function useMovimentacoesEstoque(produtoId?: string) {
  return useQuery({
    queryKey: ['movimentacoes', produtoId],
    queryFn: async () => {
      let query = supabase
        .from('movimentacoes_estoque')
        .select('*, produtos(nome)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (produtoId) {
        query = query.eq('produto_id', produtoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        tipo: item.tipo as MovimentacaoEstoque['tipo'],
        produto: item.produtos ? { nome: (item.produtos as { nome: string }).nome } : undefined,
      })) as MovimentacaoEstoque[];
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-estoque'] });
    },
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at' | 'categoria'>) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert([produto])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-estoque'] });
    },
  });
}

export function useAjustarEstoque() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      produtoId, 
      tipo, 
      quantidade, 
      motivo 
    }: { 
      produtoId: string; 
      tipo: 'entrada' | 'saida' | 'ajuste'; 
      quantidade: number; 
      motivo?: string;
    }) => {
      // Get current stock
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('estoque_atual')
        .eq('id', produtoId)
        .single();
      
      if (produtoError) throw produtoError;
      
      const estoqueAtual = produto.estoque_atual;
      const quantidadeMovimento = tipo === 'saida' ? -quantidade : quantidade;
      const novoEstoque = tipo === 'ajuste' ? quantidade : estoqueAtual + quantidadeMovimento;
      
      // Update stock
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ estoque_atual: novoEstoque })
        .eq('id', produtoId);
      
      if (updateError) throw updateError;
      
      // Log movement
      const { error: logError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          produto_id: produtoId,
          tipo,
          quantidade: tipo === 'ajuste' ? novoEstoque - estoqueAtual : quantidadeMovimento,
          estoque_anterior: estoqueAtual,
          estoque_novo: novoEstoque,
          motivo,
        });
      
      if (logError) throw logError;
      
      return { estoqueAnterior: estoqueAtual, novoEstoque };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}

export function useEstoqueStats() {
  return useQuery({
    queryKey: ['estoque-stats'],
    queryFn: async () => {
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('estoque_atual, estoque_minimo, preco_kg, preco_unidade, tipo_venda, ativo')
        .eq('ativo', true);
      
      if (error) throw error;
      
      const total = produtos?.length || 0;
      const lowStock = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo).length || 0;
      const outOfStock = produtos?.filter(p => p.estoque_atual <= 0).length || 0;
      
      const valorTotal = produtos?.reduce((acc, p) => {
        const preco = p.tipo_venda === 'peso' ? (p.preco_kg || 0) : (p.preco_unidade || 0);
        return acc + (p.estoque_atual * preco);
      }, 0) || 0;
      
      return { total, lowStock, outOfStock, valorTotal };
    },
  });
}
