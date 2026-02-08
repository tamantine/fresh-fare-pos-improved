import { Link } from 'react-router-dom';
import { ArrowLeft, Package, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEstoqueStats } from '@/hooks/useEstoque';

export function EstoqueHeader() {
  const { data: stats } = useEstoqueStats();

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Navigation */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestão de Estoque</h1>
                <p className="text-sm text-muted-foreground">Hortifruti Bom Preço</p>
              </div>
            </div>
          </div>

          {/* Right - Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-semibold">{stats?.total || 0} produtos</span>
            </div>

            {(stats?.lowStock || 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Estoque baixo:</span>
                <span className="font-semibold">{stats?.lowStock}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-semibold font-price text-primary">
                R$ {stats?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
