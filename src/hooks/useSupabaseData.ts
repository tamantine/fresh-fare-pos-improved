// @ts-nocheck
/**
 * Hooks otimizados para acesso aos dados do Supabase
 * Utiliza o serviço aprimorado para melhor performance e tipagem
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SupabaseService from '@/integrations/supabase/service';
import type {
  ProdutoInsert,
  ProdutoUpdate,
  CategoriaInsert,
  VendaInsert,
  ItemVendaInsert,
} from '@/integrations/supabase/service';

/**
 * Hook para listar produtos com filtros e paginacao
 */
export function useProdutosOtimizado(filtros?: {
  busca?: string;
  categoriaId?: string;
  apenasComEstoque?: boolean;
  pagina?: number;
  limite?: number;
}) {
  return useQuery({
    queryKey: ['produtos-otimizado', filtros],
    queryFn: () => SupabaseService.Produtos.listar({
      ...filtros,
      limite: filtros?.limite || 1000,
      pagina: filtros?.pagina || 0,
    }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para buscar produto por código de barras
 */
export function useProdutoPorCodigoBarras(codigoBarras: string) {
  return useQuery({
    queryKey: ['produto-codigo-barras', codigoBarras],
    queryFn: () => SupabaseService.Produtos.buscarPorCodigoBarras(codigoBarras),
    enabled: !!codigoBarras && codigoBarras.length >= 8,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para buscar produto por ID
 */
export function useProdutoPorId(id: string) {
  return useQuery({
    queryKey: ['produto-id', id],
    queryFn: () => SupabaseService.Produtos.buscarPorId(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para criar produto
 */
export function useCriarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (produto: ProdutoInsert) => SupabaseService.Produtos.criar(produto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

/**
 * Hook para atualizar produto
 */
export function useAtualizarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, produto }: { id: string; produto: ProdutoUpdate }) =>
      SupabaseService.Produtos.atualizar(id, produto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['produtos-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produto-id', data.id] });
    },
  });
}

/**
 * Hook para ajustar estoque
 */
export function useAjustarEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      produtoId,
      quantidade,
      tipo,
      motivo,
    }: {
      produtoId: string;
      quantidade: number;
      tipo: 'entrada' | 'saida' | 'ajuste';
      motivo?: string;
    }) => SupabaseService.Produtos.ajustarEstoque(produtoId, quantidade, tipo, motivo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produto-id', variables.produtoId] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}

/**
 * Hook para listar produtos com estoque baixo
 */
export function useProdutosEstoqueBaixo() {
  return useQuery({
    queryKey: ['produtos-estoque-baixo'],
    queryFn: () => SupabaseService.Produtos.listarEstoqueBaixo(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para listar categorias
 */
export function useCategoriasOtimizado() {
  return useQuery({
    queryKey: ['categorias-otimizado'],
    queryFn: () => SupabaseService.Categorias.listar(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para criar categoria
 */
export function useCriarCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoria: CategoriaInsert) => SupabaseService.Categorias.criar(categoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}


/**
 * Hook para listar vendas
 */
export function useVendasOtimizado(filtros?: {
  dataInicio?: string;
  dataFim?: string;
  status?: 'aberta' | 'finalizada' | 'cancelada';
}) {
  return useQuery({
    queryKey: ['vendas-otimizado', filtros],
    queryFn: () => SupabaseService.Vendas.listar(filtros),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para buscar venda por ID
 */
export function useVendaPorId(id: string) {
  return useQuery({
    queryKey: ['venda-id', id],
    queryFn: () => SupabaseService.Vendas.buscarPorId(id),
    enabled: !!id,
  });
}

/**
 * Hook para finalizar venda
 */
export function useFinalizarVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      formaPagamento,
    }: {
      id: string;
      formaPagamento: 'dinheiro' | 'debito' | 'credito' | 'pix';
    }) => SupabaseService.Vendas.finalizar(id, formaPagamento),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['venda-id', data.id] });
    },
  });
}

/**
 * Hook para cancelar venda
 */
export function useCancelarVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SupabaseService.Vendas.cancelar(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['venda-id', data.id] });
      queryClient.invalidateQueries({ queryKey: ['produtos-otimizado'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}

/**
 * Hook para obter estatísticas de vendas
 */
export function useEstatisticasVendas(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['estatisticas-vendas', dataInicio, dataFim],
    queryFn: () => SupabaseService.Vendas.obterEstatisticas(dataInicio, dataFim),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para listar movimentações de estoque
 */
export function useMovimentacoesEstoque(produtoId?: string, limite: number = 50) {
  return useQuery({
    queryKey: ['movimentacoes', produtoId, limite],
    queryFn: () => SupabaseService.Movimentacoes.listar(produtoId, limite),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
