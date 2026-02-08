import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Produto } from '@/types/pdv';
import { useAjustarEstoque } from '@/hooks/useEstoque';
import { Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AjusteEstoqueModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
}

type TipoAjuste = 'entrada' | 'saida' | 'ajuste';

export function AjusteEstoqueModal({ produto, isOpen, onClose }: AjusteEstoqueModalProps) {
  const [tipo, setTipo] = useState<TipoAjuste>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  
  const ajustarEstoque = useAjustarEstoque();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!produto) return;
    
    const qtd = parseFloat(quantidade.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    
    if (tipo === 'saida' && qtd > produto.estoque_atual) {
      toast.error('Quantidade maior que o estoque disponível');
      return;
    }
    
    try {
      const result = await ajustarEstoque.mutateAsync({
        produtoId: produto.id,
        tipo,
        quantidade: qtd,
        motivo: motivo || undefined,
      });
      
      toast.success(
        <div>
          <p className="font-medium">Estoque atualizado!</p>
          <p className="text-sm text-muted-foreground">
            {result.estoqueAnterior.toFixed(3)} → {result.novoEstoque.toFixed(3)}
          </p>
        </div>
      );
      
      setQuantidade('');
      setMotivo('');
      setTipo('entrada');
      onClose();
    } catch (error) {
      toast.error('Erro ao ajustar estoque');
      console.error(error);
    }
  };

  if (!produto) return null;

  const unidade = produto.tipo_venda === 'peso' ? 'kg' : 'un';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Produto Info */}
          <div className="p-4 bg-secondary rounded-xl">
            <h3 className="font-semibold">{produto.nome}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Estoque atual: <span className="font-mono font-semibold">{produto.estoque_atual.toFixed(3)} {unidade}</span>
            </p>
          </div>
          
          {/* Tipo de Ajuste */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipo === 'entrada'
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border hover:border-success/50'
              }`}
            >
              <ArrowUpCircle className="h-6 w-6" />
              <span className="text-sm font-medium">Entrada</span>
            </button>
            
            <button
              type="button"
              onClick={() => setTipo('saida')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipo === 'saida'
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border hover:border-destructive/50'
              }`}
            >
              <ArrowDownCircle className="h-6 w-6" />
              <span className="text-sm font-medium">Saída</span>
            </button>
            
            <button
              type="button"
              onClick={() => setTipo('ajuste')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipo === 'ajuste'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RefreshCw className="h-6 w-6" />
              <span className="text-sm font-medium">Ajuste</span>
            </button>
          </div>
          
          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">
              {tipo === 'ajuste' ? 'Novo estoque' : 'Quantidade'} ({unidade})
            </Label>
            <Input
              id="quantidade"
              type="text"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder={tipo === 'ajuste' ? 'Novo valor do estoque' : 'Quantidade a movimentar'}
              className="text-lg font-mono"
              autoFocus
            />
          </div>
          
          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Compra de fornecedor, perda, inventário..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={ajustarEstoque.isPending}>
              {ajustarEstoque.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
