import { usePDVStore } from '@/store/pdvStore';
import { CartItem } from './CartItem';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Cart() {
  const { cartItems, removeFromCart, clearCart } = usePDVStore();

  if (cartItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Carrinho vazio</p>
        <p className="text-sm text-center mt-1">
          Selecione produtos para adicionar
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
      
      {/* Cart Items */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {cartItems.map((item, index) => (
            <CartItem
              key={item.id}
              item={item}
              index={index}
              onRemove={removeFromCart}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
