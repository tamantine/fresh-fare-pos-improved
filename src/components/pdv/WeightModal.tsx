import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Produto } from '@/types/pdv';
import { Scale, Plus, Check } from 'lucide-react';
import { usePDVStore } from '@/store/pdvStore';

interface WeightModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (peso: number) => void;
}

export function WeightModal({ produto, isOpen, onClose, onConfirm }: WeightModalProps) {
  const [weight, setWeight] = useState('');
  const { currentWeight } = usePDVStore();

  useEffect(() => {
    if (currentWeight > 0) {
      setWeight(currentWeight.toFixed(3));
    }
  }, [currentWeight]);

  useEffect(() => {
    if (isOpen) {
      setWeight('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const parsedWeight = parseFloat(weight.replace(',', '.'));
    if (parsedWeight > 0) {
      onConfirm(parsedWeight);
      setWeight('');
    }
  };

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setWeight('');
    } else if (value === '⌫') {
      setWeight(prev => prev.slice(0, -1));
    } else if (value === ',') {
      if (!weight.includes(',') && !weight.includes('.')) {
        setWeight(prev => prev + ',');
      }
    } else {
      setWeight(prev => prev + value);
    }
  };

  const parsedWeight = parseFloat(weight.replace(',', '.')) || 0;
  const subtotal = parsedWeight * (produto?.preco_kg || 0);

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Informar Peso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-secondary rounded-xl">
            <h3 className="font-semibold text-lg">{produto.nome}</h3>
            <p className="text-muted-foreground">
              R$ {produto.preco_kg?.toFixed(2).replace('.', ',')} / kg
            </p>
          </div>
          
          {/* Weight Input */}
          <div className="relative">
            <Input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0,000"
              className="h-16 text-3xl font-price text-center pr-12"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
              kg
            </span>
          </div>
          
          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', ','].map((key) => (
              <button
                key={key}
                onClick={() => handleNumpadClick(key)}
                className={`pdv-numpad-btn ${key === 'C' ? 'text-destructive' : ''}`}
              >
                {key}
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
            disabled={parsedWeight <= 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
