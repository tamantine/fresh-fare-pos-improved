
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCaixa } from '@/hooks/useCaixa';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Lock,
    Wallet,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { formatCurrency } from '@/utils/escpos';

interface CaixaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ViewState = 'menu' | 'abrir' | 'fechar' | 'sangria' | 'suprimento';

export function CaixaModal({ isOpen, onClose }: CaixaModalProps) {
    const { caixaAberto, isLoading, abrirCaixa, fecharCaixa, movimentarCaixa } = useCaixa();
    const [view, setView] = useState<ViewState>('menu');
    const [inputValue, setInputValue] = useState('');
    const [motivo, setMotivo] = useState('');

    // Reset view when opening modal
    useEffect(() => {
        if (isOpen) {
            if (isLoading) return;
            if (!caixaAberto) setView('abrir');
            else setView('menu');
        }
    }, [isOpen, caixaAberto, isLoading]);

    const handleAbrir = async () => {
        const val = parseFloat(inputValue.replace(',', '.')) || 0;
        await abrirCaixa.mutateAsync(val);
        onClose();
    };

    const handleFechar = async () => {
        const valFinal = parseFloat(inputValue.replace(',', '.')) || 0;
        await fecharCaixa.mutateAsync({ caixaId: caixaAberto!.id, valorFinal: valFinal, quebra: 0 });
        onClose();
    };

    const handleMovimentacao = async (tipo: 'sangria' | 'suprimento') => {
        const val = parseFloat(inputValue.replace(',', '.')) || 0;
        if (val <= 0 || !motivo) return;

        await movimentarCaixa.mutateAsync({
            caixaId: caixaAberto!.id,
            tipo,
            valor: val,
            motivo
        });
        setInputValue('');
        setMotivo('');
        setView('menu');
    };

    if (isLoading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        Gestão de Caixa
                    </DialogTitle>
                </DialogHeader>

                {/* VIEW: ABRIR CAIXA */}
                {view === 'abrir' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-yellow-100 p-4 rounded-lg flex items-center gap-3 text-yellow-800">
                            <AlertTriangle className="h-5 w-5" />
                            <p className="text-sm font-medium">O caixa está fechado. Informe o valor inicial para abrir.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor de Abertura (Fundo de Troco)</Label>
                            <Input
                                autoFocus
                                className="text-right text-xl font-bold"
                                placeholder="0,00"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value.replace(/[^0-9,]/g, ''))}
                            />
                        </div>

                        <Button className="w-full h-12 text-lg" onClick={handleAbrir} disabled={abrirCaixa.isPending}>
                            {abrirCaixa.isPending ? <Loader2 className="animate-spin" /> : 'Abrir Caixa'}
                        </Button>
                    </div>
                )}

                {/* VIEW: MENU PRINCIPAL (CAIXA ABERTO) */}
                {view === 'menu' && caixaAberto && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Saldo Inicial</span>
                                <p className="text-xl font-mono text-gray-700">{formatCurrency(caixaAberto.valor_inicial)}</p>
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Saldo Atual (Dinheiro)</span>
                                <p className="text-xl font-bold text-primary font-mono">{formatCurrency(caixaAberto.saldo_dinheiro)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-20 flex-col gap-2 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => { setView('sangria'); setInputValue(''); }}>
                                <ArrowDownCircle className="h-6 w-6" /> Sangria
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2 border-green-200 hover:bg-green-50 hover:text-green-600" onClick={() => { setView('suprimento'); setInputValue(''); }}>
                                <ArrowUpCircle className="h-6 w-6" /> Suprimento
                            </Button>
                        </div>

                        <Button variant="destructive" className="w-full h-12 gap-2" onClick={() => { setView('fechar'); setInputValue(''); }}>
                            <Lock className="h-4 w-4" /> Fechar Caixa
                        </Button>
                    </div>
                )}

                {/* VIEW: SANGRIA / SUPRIMENTO */}
                {(view === 'sangria' || view === 'suprimento') && (
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg flex items-center gap-2 ${view === 'sangria' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {view === 'sangria' ? <ArrowDownCircle /> : <ArrowUpCircle />}
                            <span className="font-bold uppercase">{view}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                autoFocus
                                className="text-right text-xl font-bold"
                                placeholder="0,00"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value.replace(/[^0-9,]/g, ''))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo / Observação</Label>
                            <Input
                                placeholder="Ex: Pagamento Fornecedor / Troco banco"
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setView('menu')}>Cancelar</Button>
                            <Button
                                className={`flex-1 ${view === 'sangria' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                onClick={() => handleMovimentacao(view)}
                                disabled={!inputValue || !motivo || movimentarCaixa.isPending}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW: FECHAR CAIXA */}
                {view === 'fechar' && (
                    <div className="space-y-4">
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-500 mb-1">Saldo em Sistema (Dinheiro)</p>
                            <p className="text-3xl font-bold text-slate-800 font-mono">{formatCurrency(caixaAberto?.saldo_dinheiro || 0)}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor em Gaveta (Contagem Final)</Label>
                            <Input
                                autoFocus
                                className="text-right text-2xl font-bold border-2 border-slate-300 focus:border-black"
                                placeholder="0,00"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value.replace(/[^0-9,]/g, ''))}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="ghost" className="flex-1" onClick={() => setView('menu')}>Cancelar</Button>
                            <Button variant="default" className="flex-1 h-12 bg-slate-900 text-white" onClick={handleFechar} disabled={!inputValue || fecharCaixa.isPending}>
                                {fecharCaixa.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Fechamento'}
                            </Button>
                        </div>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
