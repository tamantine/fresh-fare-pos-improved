/**
 * Testes unitários para funções de formatação
 */

import { formatPrice, formatWeight, formatQuantity } from '@/lib/format';

describe('formatPrice', () => {
  it('deve formatar preço com duas casas decimais', () => {
    expect(formatPrice(10)).toBe('R$ 10,00');
    expect(formatPrice(10.5)).toBe('R$ 10,50');
    expect(formatPrice(10.55)).toBe('R$ 10,55');
  });

  it('deve formatar preço com vírgula como separador decimal', () => {
    expect(formatPrice(1000.99)).toBe('R$ 1000,99');
    expect(formatPrice(0.01)).toBe('R$ 0,01');
  });

  it('deve formatar valores negativos', () => {
    expect(formatPrice(-10.5)).toBe('R$ -10,50');
  });

  it('deve arredondar para duas casas decimais', () => {
    expect(formatPrice(10.555)).toBe('R$ 10,56');
    expect(formatPrice(10.554)).toBe('R$ 10,55');
  });
});

describe('formatWeight', () => {
  it('deve formatar peso com três casas decimais', () => {
    expect(formatWeight(1)).toBe('1,000');
    expect(formatWeight(1.5)).toBe('1,500');
    expect(formatWeight(1.234)).toBe('1,234');
  });

  it('deve usar vírgula como separador decimal', () => {
    expect(formatWeight(0.5)).toBe('0,500');
    expect(formatWeight(2.75)).toBe('2,750');
  });

  it('deve arredondar para três casas decimais', () => {
    expect(formatWeight(1.2345)).toBe('1,235');
    expect(formatWeight(1.2344)).toBe('1,234');
  });

  it('deve lidar com valores negativos', () => {
    expect(formatWeight(-1.5)).toBe('-1,500');
  });
});

describe('formatQuantity', () => {
  it('deve formatar quantidade como número inteiro', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(10)).toBe('10');
    expect(formatQuantity(100)).toBe('100');
  });

  it('deve arredondar valores decimais', () => {
    expect(formatQuantity(1.7)).toBe('2');
    expect(formatQuantity(1.2)).toBe('1');
    expect(formatQuantity(1.5)).toBe('2');
  });

  it('deve lidar com valores negativos', () => {
    expect(formatQuantity(-5.7)).toBe('-6');
  });

  it('deve lidar com zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });
});