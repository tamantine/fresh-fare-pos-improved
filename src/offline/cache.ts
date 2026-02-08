import { supabase } from '@/integrations/supabase/client';
import { setMeta, upsertCategorias, upsertProdutos } from './db';

export async function refreshOfflineCache() {
  const [{ data: categorias, error: catErr }, { data: produtos, error: prodErr }] = await Promise.all([
    supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
    supabase.from('produtos').select('*, categorias(*)').eq('ativo', true).order('nome'),
  ]);

  if (catErr) throw catErr;
  if (prodErr) throw prodErr;

  await upsertCategorias((categorias ?? []) as any);

  const normalized = (produtos ?? []).map((item: any) => ({
    ...item,
    categoria: item.categorias,
    tipo_venda: item.tipo_venda,
  }));

  await upsertProdutos(normalized as any);
  await setMeta('last_cache_refresh', new Date().toISOString());
}
