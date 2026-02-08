import { supabase } from '@/integrations/supabase/client';
import { listOfflineSalesByStatus, updateOfflineSale } from './db';

export async function syncPendingSales() {
  const pending = await listOfflineSalesByStatus('pending');
  for (const sale of pending) {
    await updateOfflineSale(sale.id, { status: 'syncing' });
    try {
      // Create venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          subtotal: sale.payload.subtotal,
          desconto: sale.payload.desconto,
          total: sale.payload.total,
          forma_pagamento: sale.payload.forma_pagamento,
          status: 'finalizada',
          sincronizado: true,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      const itensVenda = sale.payload.items.map((i) => ({
        venda_id: venda.id,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        peso_liquido: i.peso,
        preco_unitario: i.preco_unitario,
        subtotal: i.subtotal,
        desconto_item: i.desconto_item,
        sequencia: i.sequencia,
      }));

      const { error: itensError } = await supabase.from('itens_venda').insert(itensVenda);
      if (itensError) throw itensError;

      // Stock update best-effort (same as online flow)
      for (const i of sale.payload.items) {
        const quantityToDeduct = i.peso ?? i.quantidade;
        const { data: produto } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', i.produto_id)
          .single();

        if (produto) {
          const novoEstoque = produto.estoque_atual - quantityToDeduct;
          await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', i.produto_id);
          await supabase.from('movimentacoes_estoque').insert({
            produto_id: i.produto_id,
            tipo: 'venda',
            quantidade: -quantityToDeduct,
            estoque_anterior: produto.estoque_atual,
            estoque_novo: novoEstoque,
            venda_id: venda.id,
          });
        }
      }

      await updateOfflineSale(sale.id, { status: 'synced', last_error: undefined });
    } catch (e: any) {
      await updateOfflineSale(sale.id, {
        status: 'failed',
        last_error: e?.message ? String(e.message) : 'Erro desconhecido',
        attempt_count: (sale.attempt_count ?? 0) + 1,
      });
    }
  }
}
