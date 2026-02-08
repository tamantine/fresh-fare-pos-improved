/**
 * Funções de formatação de valores monetários
 */

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function formatWeight(value: number): string {
  return value.toFixed(3).replace('.', ',');
}

export function formatQuantity(value: number, isWeight: boolean = false): string {
  return isWeight ? formatWeight(value) : value.toFixed(0);
}