/**
 * Testes unitários para funções RPC seguras
 */

// Mock do Supabase
import { jest } from 'jest';
const mockRpc = jest.fn();
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

import {
  getVendasResumo,
  getProdutosEstoque,
  updateEstoque,
  insertVenda,
  insertMovimentacao,
  VendasResumo,
  ProdutoEstoque,
  UpdateEstoqueResult,
  InsertVendaResult,
  InsertMovimentacaoResult,
} from '@/integrations/supabase/rpc';

describe('RPC Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVendasResumo', () => {
    it('deve obter resumo de vendas sem parâmetros', async () => {
      const mockData: VendasResumo[] = [{
        total_vendas: 50,
        total_receita: 5000.00,
        media_ticket: 100.00,
        vendas_hoje: 5,
        receita_hoje: 500.00,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await getVendasResumo();

      expect(mockRpc).toHaveBeenCalledWith('get_vendas_resumo', {});
      expect(result).toEqual(mockData);
    });

    it('deve obter resumo de vendas com parâmetros de data', async () => {
      const dataInicial = new Date('2024-01-01');
      const dataFinal = new Date('2024-01-31');

      const mockData: VendasResumo[] = [{
        total_vendas: 100,
        total_receita: 10000.00,
        media_ticket: 100.00,
        vendas_hoje: 10,
        receita_hoje: 1000.00,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await getVendasResumo(dataInicial, dataFinal);

      expect(mockRpc).toHaveBeenCalledWith('get_vendas_resumo', {
        p_data_inicial: '2024-01-01',
        p_data_final: '2024-01-31',
      });
      expect(result).toEqual(mockData);
    });

    it('deve lançar erro quando RPC falhar', async () => {
      const error = new Error('Erro no banco de dados');
      mockRpc.mockResolvedValue({ data: null, error });

      await expect(getVendasResumo()).rejects.toThrow('Erro ao obter resumo de vendas: Erro no banco de dados');
    });
  });

  describe('getProdutosEstoque', () => {
    it('deve obter todos os produtos sem filtros', async () => {
      const mockData: ProdutoEstoque[] = [{
        id: 'uuid-1',
        nome: 'Batata',
        codigo_barras: '123456789',
        categoria_nome: 'Legumes',
        tipo_venda: 'peso',
        preco_unidade: 5.00,
        preco_kg: 10.00,
        estoque_atual: 50.00,
        estoque_minimo: 10.00,
        status: 'ok',
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await getProdutosEstoque();

      expect(mockRpc).toHaveBeenCalledWith('get_produtos_estoque', {
        p_categoria_id: null,
        p_busca: null,
      });
      expect(result).toEqual(mockData);
    });

    it('deve obter produtos por categoria', async () => {
      const categoriaId = 'uuid-categoria';
      const mockData: ProdutoEstoque[] = [];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await getProdutosEstoque(categoriaId);

      expect(mockRpc).toHaveBeenCalledWith('get_produtos_estoque', {
        p_categoria_id: categoriaId,
        p_busca: null,
      });
      expect(result).toEqual(mockData);
    });

    it('deve obter produtos por busca', async () => {
      const busca = 'batata';
      const mockData: ProdutoEstoque[] = [];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await getProdutosEstoque(null, busca);

      expect(mockRpc).toHaveBeenCalledWith('get_produtos_estoque', {
        p_categoria_id: null,
        p_busca: busca,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('updateEstoque', () => {
    it('deve atualizar estoque com sucesso', async () => {
      const mockData: UpdateEstoqueResult[] = [{
        sucesso: true,
        mensagem: 'Estoque atualizado com sucesso',
        estoque_anterior: 50.00,
        estoque_novo: 60.00,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await updateEstoque('uuid-produto', 10, 'entrada');

      expect(mockRpc).toHaveBeenCalledWith('update_estoque', {
        p_produto_id: 'uuid-produto',
        p_quantidade: 10,
        p_motivo: 'entrada',
      });
      expect(result).toEqual(mockData);
    });

    it('deve falhar ao atualizar estoque com erro', async () => {
      const mockData: UpdateEstoqueResult[] = [{
        sucesso: false,
        mensagem: 'Produto não encontrado',
        estoque_anterior: 0,
        estoque_novo: 0,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await updateEstoque('uuid-inexistente', 10);

      expect(result[0].sucesso).toBe(false);
      expect(result[0].mensagem).toBe('Produto não encontrado');
    });
  });

  describe('insertVenda', () => {
    it('deve inserir venda com sucesso', async () => {
      const mockData: InsertVendaResult[] = [{
        sucesso: true,
        mensagem: 'Venda inserida com sucesso',
        venda_id: 'uuid-venda',
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await insertVenda(100.00, 10.00, 90.00, 'pix');

      expect(mockRpc).toHaveBeenCalledWith('insert_venda', {
        p_subtotal: 100.00,
        p_desconto: 10.00,
        p_total: 90.00,
        p_forma_pagamento: 'pix',
      });
      expect(result).toEqual(mockData);
    });

    it('deve validar forma de pagamento', async () => {
      const mockData: InsertVendaResult[] = [{
        sucesso: false,
        mensagem: 'Forma de pagamento inválida',
        venda_id: null,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await insertVenda(100.00, 10.00, 90.00, 'forma-invalida');

      expect(result[0].sucesso).toBe(false);
      expect(result[0].mensagem).toBe('Forma de pagamento inválida');
    });
  });

  describe('insertMovimentacao', () => {
    it('deve inserir movimentação com sucesso', async () => {
      const mockData: InsertMovimentacaoResult[] = [{
        sucesso: true,
        mensagem: 'Movimentação registrada com sucesso',
        movimentacao_id: 'uuid-movimentacao',
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await insertMovimentacao(
        'uuid-produto',
        'saida',
        5,
        20,
        15,
        'uuid-venda'
      );

      expect(mockRpc).toHaveBeenCalledWith('insert_movimentacao', {
        p_produto_id: 'uuid-produto',
        p_tipo: 'saida',
        p_quantidade: 5,
        p_estoque_anterior: 20,
        p_estoque_novo: 15,
        p_venda_id: 'uuid-venda',
        p_compra_id: null,
      });
      expect(result).toEqual(mockData);
    });

    it('deve validar exclusividade de venda_id e compra_id', async () => {
      const mockData: InsertMovimentacaoResult[] = [{
        sucesso: false,
        mensagem: 'Não pode ter ambos venda_id e compra_id',
        movimentacao_id: null,
      }];

      mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await insertMovimentacao(
        'uuid-produto',
        'saida',
        5,
        20,
        15,
        'uuid-venda',
        'uuid-compra'
      );

      expect(result[0].sucesso).toBe(false);
      expect(result[0].mensagem).toBe('Não pode ter ambos venda_id e compra_id');
    });
  });
});