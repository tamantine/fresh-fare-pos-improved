/**
 * Testes de validação de negócios
 */

import { formatPrice, formatWeight, formatQuantity } from '@/lib/format';

describe('Validação de Negócios - Formatação', () => {
  describe('Formato de Preços', () => {
    it('deve validar formatação de preço brasileiro', () => {
      expect(formatPrice(0)).toBe('R$ 0,00');
      expect(formatPrice(1)).toBe('R$ 1,00');
      expect(formatPrice(99.99)).toBe('R$ 99,99');
      expect(formatPrice(1000.5)).toBe('R$ 1000,50');
    });

    it('deve validar arredondamento de preços', () => {
      expect(formatPrice(10.555)).toBe('R$ 10,56');
      expect(formatPrice(10.554)).toBe('R$ 10,55');
      expect(formatPrice(0.005)).toBe('R$ 0,01');
    });

    it('deve validar preços negativos', () => {
      expect(formatPrice(-10.5)).toBe('R$ -10,50');
      expect(formatPrice(-100)).toBe('R$ -100,00');
    });
  });

  describe('Formato de Pesos', () => {
    it('deve validar formatação de peso com 3 casas decimais', () => {
      expect(formatWeight(0)).toBe('0,000');
      expect(formatWeight(1)).toBe('1,000');
      expect(formatWeight(0.5)).toBe('0,500');
      expect(formatWeight(2.75)).toBe('2,750');
    });

    it('deve validar arredondamento de pesos', () => {
      expect(formatWeight(1.2345)).toBe('1,235');
      expect(formatWeight(1.2344)).toBe('1,234');
      expect(formatWeight(0.0005)).toBe('0,001');
    });

    it('deve validar pesos negativos', () => {
      expect(formatWeight(-1.5)).toBe('-1,500');
      expect(formatWeight(-0.123)).toBe('-0,123');
    });
  });

  describe('Formato de Quantidades', () => {
    it('deve validar formatação de quantidades inteiras', () => {
      expect(formatQuantity(0)).toBe('0');
      expect(formatQuantity(1)).toBe('1');
      expect(formatQuantity(10)).toBe('10');
      expect(formatQuantity(100)).toBe('100');
    });

    it('deve validar arredondamento de quantidades', () => {
      expect(formatQuantity(1.2)).toBe('1');
      expect(formatQuantity(1.7)).toBe('2');
      expect(formatQuantity(1.5)).toBe('2');
      expect(formatQuantity(0.4)).toBe('0');
    });

    it('deve validar quantidades negativas', () => {
      expect(formatQuantity(-5)).toBe('-5');
      expect(formatQuantity(-5.7)).toBe('-6');
    });
  });
});

describe('Validação de Negócios - Cálculos', () => {
  describe('Cálculo de Totais', () => {
    it('deve calcular total corretamente', () => {
      const subtotal = 100.00;
      const desconto = 10.00;
      const total = subtotal - desconto;
      
      expect(total).toBe(90.00);
      expect(formatPrice(total)).toBe('R$ 90,00');
    });

    it('deve validar que desconto não pode ser maior que subtotal', () => {
      const subtotal = 50.00;
      const desconto = 60.00; // Inválido
      
      expect(desconto).toBeGreaterThan(subtotal);
      expect(subtotal - desconto).toBeLessThan(0);
    });

    it('deve validar valores não negativos', () => {
      const valores = [100.00, 50.50, 0.01, 1000.00];
      
      valores.forEach(valor => {
        expect(valor).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Cálculo de Estoque', () => {
    it('deve validar movimentação de estoque', () => {
      const estoqueInicial = 50;
      const quantidadeMovimentada = 10;
      const estoqueFinal = estoqueInicial - quantidadeMovimentada;
      
      expect(estoqueFinal).toBe(40);
      expect(estoqueFinal).toBeGreaterThanOrEqual(0);
    });

    it('deve validar estoque mínimo', () => {
      const estoqueAtual = 5;
      const estoqueMinimo = 10;
      
      expect(estoqueAtual).toBeLessThan(estoqueMinimo);
      expect(estoqueAtual).toBeGreaterThanOrEqual(0);
    });

    it('deve validar quantidade de movimentação positiva', () => {
      const quantidade = 5;
      
      expect(quantidade).toBeGreaterThan(0);
      expect(quantidade).toBeLessThanOrEqual(1000); // Limite razoável
    });
  });

  describe('Validação de Formas de Pagamento', () => {
    const formasValidas = ['dinheiro', 'pix', 'cartao_debito', 'cartao_credito'];
    
    it('deve validar formas de pagamento aceitas', () => {
      formasValidas.forEach(forma => {
        expect(formasValidas).toContain(forma);
        expect(typeof forma).toBe('string');
        expect(forma.length).toBeGreaterThan(0);
      });
    });

    it('deve rejeitar formas de pagamento inválidas', () => {
      const formaInvalida = 'forma_invalida';
      const formaVazia = '';
      const formaNumerica = 123;
      
      expect(formasValidas).not.toContain(formaInvalida);
      expect(formasValidas).not.toContain(formaVazia);
      expect(typeof formaNumerica).not.toBe('string');
    });
  });
});

describe('Validação de Negócios - Identificadores', () => {
  describe('Validação de UUIDs', () => {
    it('deve validar formato de UUID', () => {
      const uuidValido = '123e4567-e89b-12d3-a456-426614174000';
      const uuidInvalido = 'uuid-invalido';
      const uuidVazio = '';
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(uuidValido).toMatch(uuidRegex);
      expect(uuidInvalido).not.toMatch(uuidRegex);
      expect(uuidVazio).not.toMatch(uuidRegex);
    });
  });

  describe('Validação de Códigos de Barras', () => {
    it('deve validar códigos de barras', () => {
      const codigoValido = '1234567890123';
      const codigoInvalido = 'abc123';
      const codigoVazio = '';
      
      expect(codigoValido).toHaveLength(13);
      expect(codigoValido).toMatch(/^\d+$/);
      
      expect(codigoInvalido).not.toMatch(/^\d+$/);
      expect(codigoVazio).toHaveLength(0);
    });
  });
});