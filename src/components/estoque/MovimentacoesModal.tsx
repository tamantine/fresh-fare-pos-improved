import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Produto } from '@/types/pdv';
import { useMovimentacoesEstoque } from '@/hooks/useEstoque';
import { Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw, ShoppingCart, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MovimentacoesModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
}

const tipoConfig = {
  entrada: { icon: ArrowUpCircle, color: 'text-success', bg: 'bg-success/10', label: 'Entrada' },
  saida: { icon: ArrowDownCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Saída' },
  ajuste: { icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10', label: 'Ajuste' },
  venda: { icon: ShoppingCart, color: 'text-accent', bg: 'bg-accent/10', label: 'Venda' },
};

export function MovimentacoesModal({ produto, isOpen, onClose }: MovimentacoesModalProps) {
  const { data: movimentacoes, isLoading } = useMovimentacoesEstoque(produto?.id);

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Movimentações
          </DialogTitle>
        </DialogHeader>
        
        {/* Produto Info */}
        <div className="p-4 bg-secondary rounded-xl">
          <h3 className="font-semibold">{produto.nome}</h3>
          <p className="text-sm text-muted-foreground">
            Estoque atual: <span className="font-mono font-semibold">{produto.estoque_atual.toFixed(3)}</span>
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : movimentacoes && movimentacoes.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {movimentacoes.map((mov) => {
                const config = tipoConfig[mov.tipo];
                const Icon = config.icon;
                
                return (
                  <div
                    key={mov.id}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="mt-1.5 flex items-center gap-2 text-sm">
                        <span className="font-mono">{mov.estoque_anterior.toFixed(3)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono font-semibold">{mov.estoque_novo.toFixed(3)}</span>
                        <span className={`font-mono text-xs ${mov.quantidade >= 0 ? 'text-success' : 'text-destructive'}`}>
                          ({mov.quantidade >= 0 ? '+' : ''}{mov.quantidade.toFixed(3)})
                        </span>
                      </div>
                      
                      {mov.motivo && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {mov.motivo}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-3 opacity-50" />
            <p>Nenhuma movimentação registrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
