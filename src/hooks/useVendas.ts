
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SupabaseService from '@/integrations/supabase/service';
import type {
  VendaInsert,
  ItemVendaInsert,
} from '@/integrations/supabase/service';

/**
 * Hook para criar venda
 */
export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venda,
      itens,
      pagamentos,
    }: {
      venda: VendaInsert;
      itens: Omit<ItemVendaInsert, 'venda_id'>[];
      pagamentos?: any[];
    }) => SupabaseService.Vendas.criar(venda, itens, pagamentos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] }); // Atualizar saldo do caixa
    },
  });
}
