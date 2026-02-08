import { usePDVStore } from '@/store/pdvStore';
import { Button } from '@/components/ui/button';
import { CreditCard, Percent } from 'lucide-react';

export function Totalizador() {
  const { getSubtotal, getTotal, discount, setPaymentModalOpen, cartItems } = usePDVStore();
  
  const subtotal = getSubtotal();
  const total = getTotal();
  const hasItems = cartItems.length > 0;

  return (
    <div className="border-t border-border bg-card p-4 space-y-4">
      {/* Subtotal & Discount */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-price">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Desconto
            </span>
            <span className="font-price">- R$ {discount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
      </div>
      
      {/* Total */}
      <div className="pdv-total-display">
        <div className="flex justify-between items-center">
          <span className="text-primary-foreground/80 text-lg">Total</span>
          <span className="text-4xl font-bold font-price">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
      
      {/* Payment Button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg"
        onClick={() => setPaymentModalOpen(true)}
        disabled={!hasItems}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        Pagamento (F6)
      </Button>
    </div>
  );
}
