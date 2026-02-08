/**
 * Componente de Dashboard com estatísticas de vendas e estoque
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEstatisticasVendas, useProdutosEstoqueBaixo } from '@/hooks/useSupabaseData';
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardStats() {
  const { data: stats, isLoading: loadingStats } = useEstatisticasVendas();
  const { data: responseEstoque, isLoading: loadingEstoque } = useProdutosEstoqueBaixo();
  const produtosEstoqueBaixo = responseEstoque?.data || [];

  if (loadingStats || loadingEstoque) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Vendas */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalVendas || 0}</div>
          <p className="text-xs text-muted-foreground">vendas finalizadas</p>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.valorTotal || 0)}
          </div>
          <p className="text-xs text-muted-foreground">em vendas finalizadas</p>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats?.ticketMedio || 0)}
          </div>
          <p className="text-xs text-muted-foreground">por venda</p>
        </CardContent>
      </Card>

      {/* Produtos com Estoque Baixo */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {produtosEstoqueBaixo?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">produtos precisam reposição</p>
        </CardContent>
      </Card>
    </div>
  );
}
