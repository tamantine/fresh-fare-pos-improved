import { CartItem as CartItemType } from '@/types/pdv';
import { Trash2, Scale, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatWeight, formatQuantity } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onRemove: (id: string) => void;
}

export function CartItem({ item, index, onRemove }: CartItemProps) {
  const isPeso = item.produto.tipo_venda === 'peso';
  
  return (
    <div className="pdv-cart-item animate-slide-in-right group">
      {/* Sequence Number */}
      <div className="w-8 h-8 flex items-center justify-center bg-secondary rounded-lg text-sm font-semibold text-muted-foreground">
        {index + 1}
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isPeso ? (
            <Scale className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Package className="h-4 w-4 text-accent shrink-0" />
          )}
          <span className="font-medium truncate">{item.produto.nome}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">
          {isPeso ? (
            <span>
              {formatWeight(item.peso || 0)} kg × {formatPrice(item.preco_unitario)}
            </span>
          ) : (
            <span>
              {item.quantidade} un × {formatPrice(item.preco_unitario)}
            </span>
          )}
        </div>
      </div>
      
      {/* Subtotal */}
      <div className="text-right">
        <span className="font-bold font-price text-lg">
          {formatPrice(item.subtotal)}
        </span>
      </div>
      
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
