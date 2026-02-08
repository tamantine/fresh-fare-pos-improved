import { useQuery } from '@tanstack/react-query';
import { useOnlineStatus } from '@/offline/network';
import { getAllProdutos, getAllCategorias } from '@/offline/db';
import { useProdutos, useCategorias } from './useProdutos';

export function useProdutosOffline(searchQuery?: string, categoryId?: string | null) {
  const online = useOnlineStatus();
  const onlineQuery = useProdutos(searchQuery, categoryId);

  return useQuery({
    queryKey: ['produtos-offline', online, searchQuery, categoryId],
    queryFn: async () => {
      if (online) {
        return onlineQuery.data ?? [];
      }

      const all = await getAllProdutos();
      let filtered = all;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) => p.nome.toLowerCase().includes(q) || (p.codigo_barras ?? '').toLowerCase().includes(q),
        );
      }
      if (categoryId) {
        filtered = filtered.filter((p) => p.categoria_id === categoryId);
      }

      return filtered;
    },
    enabled: true,
  });
}

export function useCategoriasOffline() {
  const online = useOnlineStatus();
  const onlineQuery = useCategorias();

  return useQuery({
    queryKey: ['categorias-offline', online],
    queryFn: async () => {
      if (online) return onlineQuery.data ?? [];
      return getAllCategorias();
    },
    enabled: true,
  });
}
