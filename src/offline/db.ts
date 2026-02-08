import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Produto, Categoria, Venda } from '@/types/pdv';

export type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflineSale {
  id: string; // client id
  created_at: string; // ISO
  payload: {
    items: Array<{
      produto_id: string;
      quantidade: number;
      peso?: number;
      preco_unitario: number;
      subtotal: number;
      desconto_item: number;
      sequencia: number;
    }>;
    subtotal: number;
    desconto: number;
    total: number;
    forma_pagamento: string;
  };
  status: OfflineSyncStatus;
  last_error?: string;
  attempt_count: number;
}

interface FreshFareDB extends DBSchema {
  produtos: {
    key: string;
    value: Produto;
    indexes: { 'by_nome': string; 'by_categoria': string };
  };
  categorias: {
    key: string;
    value: Categoria;
    indexes: { 'by_nome': string };
  };
  offline_sales: {
    key: string;
    value: OfflineSale;
    indexes: { 'by_status': OfflineSyncStatus; 'by_created_at': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<FreshFareDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FreshFareDB>('fresh-fare-pos', 1, {
      upgrade(db) {
        const produtos = db.createObjectStore('produtos', { keyPath: 'id' });
        produtos.createIndex('by_nome', 'nome');
        produtos.createIndex('by_categoria', 'categoria_id');

        const categorias = db.createObjectStore('categorias', { keyPath: 'id' });
        categorias.createIndex('by_nome', 'nome');

        const sales = db.createObjectStore('offline_sales', { keyPath: 'id' });
        sales.createIndex('by_status', 'status');
        sales.createIndex('by_created_at', 'created_at');

        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }

  return dbPromise;
}

export async function setMeta(key: string, value: string) {
  const db = await getDB();
  await db.put('meta', { key, value });
}

export async function getMeta(key: string) {
  const db = await getDB();
  return (await db.get('meta', key))?.value;
}

export async function upsertProdutos(produtos: Produto[]) {
  const db = await getDB();
  const tx = db.transaction('produtos', 'readwrite');
  for (const p of produtos) await tx.store.put(p);
  await tx.done;
}

export async function upsertCategorias(categorias: Categoria[]) {
  const db = await getDB();
  const tx = db.transaction('categorias', 'readwrite');
  for (const c of categorias) await tx.store.put(c);
  await tx.done;
}

export async function getAllProdutos() {
  const db = await getDB();
  return db.getAll('produtos');
}

export async function getAllCategorias() {
  const db = await getDB();
  return db.getAll('categorias');
}

export async function queueOfflineSale(sale: OfflineSale) {
  const db = await getDB();
  await db.put('offline_sales', sale);
}

export async function listOfflineSalesByStatus(status: OfflineSyncStatus) {
  const db = await getDB();
  return db.getAllFromIndex('offline_sales', 'by_status', status);
}

export async function updateOfflineSale(id: string, patch: Partial<OfflineSale>) {
  const db = await getDB();
  const current = await db.get('offline_sales', id);
  if (!current) return;
  await db.put('offline_sales', { ...current, ...patch });
}

export async function countOfflineSales(status?: OfflineSyncStatus) {
  const db = await getDB();
  if (!status) return db.count('offline_sales');
  return db.countFromIndex('offline_sales', 'by_status', status);
}
