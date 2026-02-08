/**
 * Funções de otimização de performance para o sistema Fresh Fare POS
 */

import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';

/**
 * Debounce para consultas ao banco de dados
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Memoização de resultados de funções pesadas
 */
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limitar tamanho do cache para evitar memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

/**
 * Virtualização de listas longas
 */
export const virtualizeList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
): { visibleItems: T[]; startIndex: number; endIndex: number } => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex + 1),
    startIndex,
    endIndex,
  };
};

/**
 * Lazy loading de imagens
 */
export const lazyImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Otimização de loops intensivos
 */
export const optimizedLoop = <T, U>(
  items: T[],
  callback: (item: T, index: number) => U,
  batchSize: number = 100
): U[] => {
  const results: U[] = [];
  
  const processBatch = (start: number) => {
    const end = Math.min(start + batchSize, items.length);
    
    for (let i = start; i < end; i++) {
      results.push(callback(items[i], i));
    }
    
    if (end < items.length) {
      // Processar próximo lote de forma assíncrona para não bloquear UI
      setTimeout(() => processBatch(end), 0);
    }
  };
  
  processBatch(0);
  return results;
};

/**
 * Controle de renderização condicional
 */
export const shouldRender = (condition: boolean, component: React.ReactNode): React.ReactNode => {
  return condition ? component : null;
};

/**
 * Otimização de busca em listas grandes
 */
export const optimizedSearch = <T>(
  items: T[],
  searchField: keyof T,
  searchTerm: string,
  maxResults: number = 50
): T[] => {
  if (!searchTerm.trim()) return items.slice(0, maxResults);
  
  const term = searchTerm.toLowerCase();
  
  return items
    .filter((item) => {
      const value = item[searchField];
      return value && String(value).toLowerCase().includes(term);
    })
    .slice(0, maxResults);
};

/**
 * Tipos de dados para cache
 */
export interface ProdutoEstoque {
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

/**
 * Cache de consultas ao banco
 */
export class QueryCache {
  private static instance: QueryCache;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Expor o cache para hooks que precisam de acesso direto
   */
  getCache(): Map<string, { data: any; timestamp: number; ttl: number }> {
    return this.cache;
  }
}

/**
 * Hook para memoização de consultas
 */
export const useCachedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => Promise<void> } => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = useMemo(() => QueryCache.getInstance(), []);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        return;
      }

      const result = await queryFn();
      setData(result);
      cache.set(key, result, ttl);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro na consulta'));
    } finally {
      setIsLoading(false);
    }
  }, [key, queryFn, cache, ttl]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};

/**
 * Controle de atualizações de estado
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number
): [T, (value: T) => void, T] => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, setValue, debouncedValue];
};

/**
 * Renderização otimizada de listas
 */
export const OptimizedList = memo(<T,>({
  items,
  renderItem,
  keyExtractor,
  itemHeight,
  containerHeight,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, startIndex } = useMemo(() => {
    if (!containerRef.current) return { visibleItems: items, startIndex: 0 };
    
    return virtualizeList(
      items,
      itemHeight,
      containerHeight
    );
  }, [items, itemHeight, containerHeight, scrollTop]);

  return (
    React.createElement('div', {
      ref: containerRef,
      className: className,
      onScroll: handleScroll,
      style: { height: containerHeight, overflow: 'auto' }
    },
      React.createElement('div', {
        style: { height: items.length * itemHeight, position: 'relative' }
      },
        React.createElement('div', {
          style: { transform: `translateY(${startIndex * itemHeight}px)` }
        },
          visibleItems.map((item, index) => 
            React.createElement('div', {
              key: keyExtractor(item, startIndex + index)
            },
              renderItem(item, startIndex + index)
            )
          )
        )
      )
    )
  );
});

OptimizedList.displayName = 'OptimizedList';

/**
 * Monitoramento de performance
 */
export const usePerformanceMonitor = (label: string) => {
  useEffect(() => {
    performance.mark(`${label}-start`);
    
    return () => {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measures = performance.getEntriesByName(label, 'measure');
      if (measures.length > 0) {
        const lastMeasure = measures[measures.length - 1];
        console.log(`${label}: ${lastMeasure.duration.toFixed(2)}ms`);
      }
    };
  }, [label]);
};

export default {
  debounce,
  memoize,
  virtualizeList,
  lazyImage,
  optimizedLoop,
  shouldRender,
  optimizedSearch,
  QueryCache,
  useCachedQuery,
  useDebouncedState,
  OptimizedList,
  usePerformanceMonitor,
};