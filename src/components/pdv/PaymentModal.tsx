import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateVenda } from '@/hooks/useVendas';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  Check,
  Loader2,
  Receipt,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePrinter } from '@/hooks/usePrinter';
import { supabase } from '@/integrations/supabase/client';

type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  subtotal: number;
  total: number;
  discount?: number;
  onPaymentSuccess?: (venda?: any, itens?: any[]) => void;
  caixaId?: string;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-6 w-6" /> },
  { id: 'debito', label: 'Débito', icon: <CreditCard className="h-6 w-6" /> },
  { id: 'credito', label: 'Crédito', icon: <Wallet className="h-6 w-6" /> },
  { id: 'pix', label: 'PIX', icon: <Smartphone className="h-6 w-6" /> },
];

export function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  total,
  discount = 0,
  onPaymentSuccess,
  caixaId
}: PaymentModalProps) {

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [payments, setPayments] = useState<{ id: string; method: PaymentMethod; value: number }[]>([]);

  const createVenda = useCreateVenda();
  const { printReceipt } = usePrinter();

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setSelectedMethod(null);
      setInputValue('');
    }
  }, [isOpen]);

  // Derived values
  const totalPaid = payments.reduce((acc, p) => acc + p.value, 0);
  const currentInputValue = parseFloat(inputValue.replace(',', '.')) || 0;

  // Calculate remaining
  // If we have a current input value, we shouldn't count it as "paid" yet for the remaining display ABOVE the input?
  // Actually, standard logic: Remaining = Total - AlreadyConfirmedPayments
  const remaining = Math.max(0, total - totalPaid);

  // Auto-fill input when method changes
  useEffect(() => {
    if (selectedMethod && remaining > 0) {
      setInputValue(remaining.toFixed(2).replace('.', ','));
    }
  }, [selectedMethod, remaining]);

  // Logic to determine if we can finalize
  // Scenario 1: List is empty. User selects method and value >= total.
  // Scenario 2: List has items. Remaining > 0. User selects method and value >= remaining.
  // Scenario 3: List has items. Remaining = 0. User just needs to finalize. (Input valid is 0?)

  // Let's create a "Projected Transaction" to validate
  const projectedPayments = [...payments];
  if (selectedMethod && currentInputValue > 0) {
    projectedPayments.push({
      id: 'temp',
      method: selectedMethod,
      value: currentInputValue
    });
  }

  const projectedTotalPaid = projectedPayments.reduce((acc, p) => acc + p.value, 0);
  const projectedChange = projectedTotalPaid - total;
  const isEnough = projectedTotalPaid >= total - 0.01; // tolerance

  // Validation: Only cash allows overpayment (change)
  const nonCashOverpayment = projectedPayments.some(p => p.method !== 'dinheiro') && projectedTotalPaid > total + 0.01 && projectedChange > 0.01;
  // Actually complex: if 20 card + 30 card = 50. OK.
  // If 20 card + 40 card = 60. ERROR.
  // If 20 card + 40 cash = 60. OK (10 change).

  // Simplified validation:
  // Calculate non-cash sum
  const nonCashSum = projectedPayments.filter(p => p.method !== 'dinheiro').reduce((acc, p) => acc + p.value, 0);
  const cashSum = projectedPayments.filter(p => p.method === 'dinheiro').reduce((acc, p) => acc + p.value, 0);

  // If non-cash exceeds total -> Error
  const isNonCashInvalid = nonCashSum > total + 0.01;
  // If total exceeds sum -> Invalid

  const canFinalize = isEnough && !isNonCashInvalid;

  const handleAddPayment = () => {
    if (!selectedMethod || currentInputValue <= 0) return;

    // Validate if adding this would exceed total (unless cash)
    if (selectedMethod !== 'dinheiro' && (currentInputValue + totalPaid) > total + 0.01) {
      toast.error('Pagamento em cartão/pix não pode exceder o valor restante.');
      return;
    }

    setPayments([...payments, {
      id: Math.random().toString(36).substr(2, 9),
      method: selectedMethod,
      value: currentInputValue
    }]);

    setSelectedMethod(null);
    setInputValue('');
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleFinalizeSale = async () => {
    if (!canFinalize) return;

    // Construct final list of payments
    // If there is a pending selection that completes the payment, include it.
    let finalPayments = [...payments];

    // If we have a pending input that contributes to the total, add it
    if (selectedMethod && currentInputValue > 0 && remaining > 0) {
      finalPayments.push({
        id: 'auto-added',
        method: selectedMethod,
        value: currentInputValue
      });
    }

    try {
      // Determine Main Payment Method for 'vendas' table
      // Logic: If multiple -> 'multiplo'. If single -> that method.
      const isMulti = finalPayments.length > 1;
      const mainMethod = isMulti ? 'multiplo' as any : finalPayments[0].method; // Cast for custom enum value

      // 1. Criar Venda
      const vendaPayload = {
        subtotal,
        desconto: discount,
        total,
        forma_pagamento: mainMethod,
        status: 'finalizada' as const,
        cupom_impresso: false,
        caixa_id: caixaId,
      };

      const itensPayload = cartItems.map((item: any, index: number) => ({
        produto_id: item.id,
        quantidade: item.quantidade,
        peso_liquido: item.tipo_venda === 'peso' ? item.quantidade : null,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        sequencia: index + 1
      }));

      // Sanitizar pagamentos para envio (remover id)
      const pagamentosPayload = finalPayments.map(p => ({
        forma_pagamento: p.method,
        valor: p.value
      }));

      const { venda: vendaRegistrada } = await createVenda.mutateAsync({
        venda: vendaPayload,
        itens: itensPayload,
        pagamentos: pagamentosPayload
      });

      // 2. Imprimir Cupom
      // Calcular troco final
      const finalTotalPaid = finalPayments.reduce((acc, p) => acc + p.value, 0);
      const finalChange = finalTotalPaid - total;

      const vendaParaImpressao = {
        ...vendaRegistrada,
        items: cartItems.map(item => ({
          name: item.nome,
          quantity: item.quantidade,
          price: item.preco_unitario
        })),
        paymentMethod: mainMethod, // 'multiplo' or specific
        payments: finalPayments.map(p => ({ method: p.method, value: p.value })), // New detail for receipt
        moneyReceived: finalPayments.filter(p => p.method === 'dinheiro').reduce((acc, p) => acc + p.value, 0), // Total Cash
        change: finalChange
      };

      try {
        const success = await printReceipt(vendaParaImpressao);
        if (success) {
          await supabase.rpc('marcar_venda_impressa', { p_venda_id: vendaRegistrada.id });
        }
      } catch (err) {
        console.error("Erro na impressão (não bloqueante):", err);
      }

      toast.success('Venda finalizada com sucesso!');

      if (onPaymentSuccess) onPaymentSuccess(vendaRegistrada, cartItems);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao finalizar venda: ' + (error.message || 'Desconhecido'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Finalizar Pagamento (F12)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Display */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-medium text-slate-500">Total a Pagar</span>
              <span className="text-2xl font-bold font-price text-slate-900">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>

            {payments.length > 0 && (
              <>
                <div className="flex justify-between items-center text-sm text-green-600 mt-1">
                  <span>Pago</span>
                  <span className="font-medium">- R$ {totalPaid.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Restante</span>
                  <span className={`text-xl font-bold font-price ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    R$ {remaining.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Payments List */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagamentos Adicionados</span>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-md">
                        {paymentMethods.find(m => m.id === p.method)?.icon}
                      </div>
                      <span className="font-medium text-sm capitalize">{paymentMethods.find(m => m.id === p.method)?.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">R$ {p.value.toFixed(2).replace('.', ',')}</span>
                      <button onClick={() => removePayment(p.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          {remaining > 0.01 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${selectedMethod === method.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {method.icon}
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Area */}
              {selectedMethod && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                      <Input
                        value={inputValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9,]/g, '');
                          setInputValue(val);
                        }}
                        className="pl-9 h-12 text-lg font-bold font-price"
                        autoFocus
                        placeholder="0,00"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (currentInputValue < remaining) {
                              handleAddPayment();
                            } else {
                              handleFinalizeSale(); // If covering full amount, finalize
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Only show "Add" if it's a partial payment, otherwise logical next step is Finalize */}
                    {currentInputValue > 0 && currentInputValue < remaining - 0.01 && (
                      <Button
                        variant="secondary"
                        className="h-12 px-4 shadow-sm"
                        onClick={handleAddPayment}
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>

                  {/* Quick Values */}
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[10, 20, 50, 100].map(val => (
                      <button
                        key={val}
                        onClick={() => setInputValue(val.toFixed(2).replace('.', ','))}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-mono font-medium text-slate-600 transition-colors"
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Change Display */}
          {projectedChange > 0 && (
            <div className="flex justify-between items-center p-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
              <span className="font-medium">Troco Estimado</span>
              <span className="text-xl font-bold font-price">R$ {projectedChange.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          {/* Finalize Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20"
            onClick={handleFinalizeSale}
            disabled={!canFinalize || createVenda.isPending}
          >
            {createVenda.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                {payments.length >= 1 ? 'Confirmar Distribuição e Vender' : 'Finalizar Venda'}
              </>
            )}
          </Button>

          {isNonCashInvalid && (
            <p className="text-xs text-red-500 text-center font-medium">
              Atenção: O valor em Cartão/Pix excede o total da venda. Apenas pagamentos em Dinheiro podem gerar troco.
            </p>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
