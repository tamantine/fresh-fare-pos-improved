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
import { useCaixa } from '@/hooks/useCaixa';
import { Loader2, DollarSign, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { generateClosingReport } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

interface CaixaManagerProps {
    isOpen: boolean;
    onClose: () => void;
    tipo: 'abertura' | 'fechamento';
}

export function CaixaManager({ isOpen, onClose, tipo }: CaixaManagerProps) {
    const { abrirCaixa, fecharCaixa, caixaAberto } = useCaixa();
    const [valor, setValor] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalComputado, setTotalComputado] = useState(0);

    useEffect(() => {
        if (isOpen && tipo === 'fechamento' && caixaAberto) {
            // Calcular total esperado (Dinheiro em gaveta) 
            // saldo_dinheiro já inclui o valor inicial + vendas em dinheiro (atualizado via trigger/rpc)
            const totalSistema = (caixaAberto.saldo_dinheiro || 0);
            setTotalComputado(totalSistema);
            setValor(totalSistema.toFixed(2)); // Sugerir o valor do sistema
        } else {
            setValor('');
        }
    }, [isOpen, tipo, caixaAberto]);

    const handleConfirm = async () => {
        const valorNumerico = parseFloat(valor.replace(',', '.'));

        if (isNaN(valorNumerico)) {
            toast.error("Por favor, insira um valor válido.");
            return;
        }

        setLoading(true);
        try {
            if (tipo === 'abertura') {
                await abrirCaixa.mutateAsync(valorNumerico);
            } else {
                if (!caixaAberto) return;

                // Quebra = Valor Informado - Valor Esperado
                // Se informado < esperado, quebra é negativa (falta dinheiro)
                const quebra = valorNumerico - totalComputado;

                await fecharCaixa.mutateAsync({
                    caixaId: caixaAberto.id,
                    valorFinal: valorNumerico,
                    quebra: quebra
                });

                // Gerar Relatório PDF
                const { data: relatorioData, error: relatorioError } = await supabase
                    .rpc('get_relatorio_fechamento', { p_caixa_id: caixaAberto.id });

                if (relatorioError) {
                    console.error("Erro ao gerar relatório:", relatorioError);
                    toast.error("Caixa fechado, mas erro ao gerar PDF.");
                } else {
                    generateClosingReport(relatorioData);
                    toast.success("Relatório de fechamento gerado!");
                }
            }
            onClose();
        } catch (error) {
            console.error(error);
            // Erro já tratado no hook
        } finally {
            setLoading(false);
        }
    };

    const isAbertura = tipo === 'abertura';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {isAbertura ? (
                            <Unlock className="h-6 w-6 text-green-600" />
                        ) : (
                            <Lock className="h-6 w-6 text-red-600" />
                        )}
                        {isAbertura ? 'Abertura de Caixa' : 'Fechamento de Caixa'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {isAbertura ? 'Fundo de Troco (Valor Inicial)' : 'Valor em Dinheiro na Gaveta'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                            <Input
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                className="pl-9 h-12 text-lg font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>

                        {!isAbertura && (
                            <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="flex justify-between">
                                    <span>Valor Esperado (Sistema):</span>
                                    <span className="font-bold">R$ {totalComputado.toFixed(2)}</span>
                                </div>
                                {valor && !isNaN(parseFloat(valor)) && (
                                    <div className={`flex justify-between mt-1 pt-1 border-t border-gray-200 ${(parseFloat(valor) - totalComputado) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        <span>Diferença (Quebra):</span>
                                        <span className="font-bold">R$ {(parseFloat(valor) - totalComputado).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!isAbertura && (parseFloat(valor) - totalComputado) < -10 && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p>Atenção: A diferença de caixa é significativa. Verifique a contagem.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || !valor}
                        className={isAbertura ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAbertura ? 'Confirmar Abertura' : 'Confirmar Fechamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
