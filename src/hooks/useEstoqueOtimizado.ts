/**
 * Hook otimizado para gerenciamento de estoque com cache inteligente
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { QueryCache, debounce, optimizedSearch, ProdutoEstoque } from '@/lib/performance';

/**
 * Tipos para o hook de estoque otimizado
 */
interface ProdutoEstoqueLocal {
  id: string;
  nome: string;
  codigo_barras: string;
  categoria_nome: string;
  tipo_venda: 'peso' | 'unidade';
  preco_unidade: number;
  preco_kg: number;
  estoque_atual: number;
  estoque_minimo: number;
  status: 'ok' | 'baixo' | 'critico';
}

export const useEstoqueOtimizado = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const cache = useMemo(() => QueryCache.getInstance(), []);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Busca otimizada com cache
  const buscarProdutos = useCallback(async (
    categoriaId?: string,
    busca?: string
  ): Promise<ProdutoEstoqueLocal[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Chave de cache baseada nos parâmetros
      const cacheKey = `produtos_${categoriaId || 'todos'}_${busca || 'todos'}`;
      
      // Verificar cache primeiro
      const cachedData = cache.get<ProdutoEstoque[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Importar o serviço apenas quando necessário (code splitting)
      const { getProdutosEstoque } = await import('@/integrations/supabase/rpc');
      
      const result = await getProdutosEstoque(categoriaId, busca);
      
      // Armazenar no cache por 2 minutos
      cache.set(cacheKey, result as ProdutoEstoqueLocal[], 2 * 60 * 1000);
      
      return result as ProdutoEstoqueLocal[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produtos';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cache]);

  // Busca com debounce
  const buscarProdutosDebounced = useMemo(
    () => debounce(buscarProdutos, 300),
    [buscarProdutos]
  );

  // Resultados filtrados localmente
  const produtosFiltrados = useMemo(() => {
    if (!debouncedSearchTerm.trim() && !categoriaFiltro) {
      return [];
    }
    
    // Buscar produtos se ainda não estiverem em cache
    buscarProdutosDebounced(categoriaFiltro || undefined, debouncedSearchTerm || undefined);
    
    const cacheKey = `produtos_${categoriaFiltro || 'todos'}_${debouncedSearchTerm || 'todos'}`;
    return cache.get<ProdutoEstoqueLocal[]>(cacheKey) || [];
  }, [debouncedSearchTerm, categoriaFiltro, buscarProdutosDebounced, cache]);

  // Busca avançada com otimização
  const buscarAvancada = useCallback((termo: string, categoriaId?: string): ProdutoEstoqueLocal[] => {
    // Primeiro busca no cache local
    const cacheKey = `produtos_${categoriaId || 'todos'}_${termo || 'todos'}`;
    let resultados = cache.get<ProdutoEstoque[]>(cacheKey) || [];
    
    // Se não encontrar no cache, busca no banco
    if (resultados.length === 0 && termo.trim()) {
      buscarProdutos(categoriaId, termo);
    }
    
    // Busca local otimizada se já temos dados
    if (resultados.length > 0 && termo.trim()) {
      resultados = optimizedSearch(resultados, 'nome' as keyof ProdutoEstoqueLocal, termo, 100);
    }
    
    return resultados;
  }, [cache, buscarProdutos]);

  // Atualização de cache
  const invalidarCache = useCallback((categoriaId?: string) => {
    const patterns = [
      `produtos_${categoriaId || '*'}`,
      'produtos_todos_*'
    ];
    
    const cacheMap = cache.getCache();
    for (const [key] of cacheMap.entries()) {
      if (patterns.some(pattern => key.includes(pattern.replace('*', '')))) {
        cacheMap.delete(key);
      }
    }
  }, [cache]);

  // Atualização de estoque com cache invalidation
  const atualizarEstoque = useCallback(async (
    produtoId: string,
    quantidade: number,
    motivo: 'entrada' | 'saida' = 'saida'
  ) => {
    try {
      const { updateEstoque } = await import('@/integrations/supabase/rpc');
      
      const result = await updateEstoque(produtoId, quantidade, motivo);
      
      // Invalidar cache relacionado
      invalidarCache();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estoque');
      throw err;
    }
  }, [invalidarCache]);

  // Estatísticas de performance
  const getEstatisticasCache = useCallback(() => {
    const cacheMap = cache.getCache();
    return {
      tamanho: cacheMap.size,
      chaves: Array.from(cacheMap.keys()),
    };
  }, [cache]);

  return {
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    categoriaFiltro,
    setCategoriaFiltro,
    produtosFiltrados,
    buscarProdutos,
    buscarAvancada,
    atualizarEstoque,
    invalidarCache,
    getEstatisticasCache,
    debouncedSearchTerm,
  };
};

export default useEstoqueOtimizado;