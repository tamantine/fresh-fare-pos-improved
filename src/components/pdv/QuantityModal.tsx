import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Produto } from '@/types/pdv';
import { Package, Minus, Plus, Check } from 'lucide-react';

interface QuantityModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantidade: number) => void;
}

export function QuantityModal({ produto, isOpen, onClose, onConfirm }: QuantityModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity);
    }
  };

  const subtotal = quantity * (produto?.preco_unidade || 0);

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Informar Quantidade
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-secondary rounded-xl">
            <h3 className="font-semibold text-lg">{produto.nome}</h3>
            <p className="text-muted-foreground">
              R$ {produto.preco_unidade?.toFixed(2).replace('.', ',')} / un
            </p>
          </div>
          
          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <div className="w-24 h-20 flex items-center justify-center bg-card border-2 border-border rounded-xl">
              <span className="text-4xl font-bold font-price">{quantity}</span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={() => setQuantity(q => q + 1)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Quick Quantity Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5, 6, 10, 12, 24].map((num) => (
              <button
                key={num}
                onClick={() => setQuantity(num)}
                className={`pdv-numpad-btn !aspect-auto py-3 ${quantity === num ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
          
          {/* Subtotal Preview */}
          <div className="p-4 bg-primary/10 rounded-xl flex justify-between items-center">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="text-2xl font-bold font-price text-primary">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
