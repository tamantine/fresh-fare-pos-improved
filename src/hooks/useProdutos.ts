import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Produto, Categoria } from '@/types/pdv';

export function useProdutos(searchQuery?: string, categoryId?: string | null) {
  return useQuery({
    queryKey: ['produtos', searchQuery, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*, categorias(*)')
        .eq('ativo', true)
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
      return items.map(item => ({
        ...item,
        categoria: item.categorias as Categoria | undefined,
        tipo_venda: item.tipo_venda as Produto['tipo_venda'],
      })) as Produto[];
    },
  });
}

export function useProdutoByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['produto-barcode', barcode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(*)')
        .eq('codigo_barras', barcode)
        .eq('ativo', true)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        categoria: data.categorias as Categoria | undefined,
        tipo_venda: data.tipo_venda as Produto['tipo_venda'],
      } as Produto;
    },
    enabled: !!barcode && barcode.length >= 8,
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as Categoria[];
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
    },
  });
}
