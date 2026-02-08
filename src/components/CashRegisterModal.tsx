import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Unlock, DollarSign, Wallet } from 'lucide-react';

interface CashRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CashRegisterModal = ({ isOpen, onClose, onSuccess }: CashRegisterModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [currentCaixa, setCurrentCaixa] = useState<any>(null);

    // Form States
    const [openingBalance, setOpeningBalance] = useState('');
    const [bleedAmount, setBleedAmount] = useState('');
    const [bleedReason, setBleedReason] = useState('');
    const [closingBalance, setClosingBalance] = useState(''); // Valor conferido (opcional)

    useEffect(() => {
        if (isOpen) {
            checkOpenRegister();
        }
    }, [isOpen]);

    const checkOpenRegister = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('caixas')
                .select('*')
                .eq('operador_id', user.id)
                .eq('status', 'aberto')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar caixa:', error);
            }

            setCurrentCaixa(data);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenRegister = async () => {
        if (!openingBalance) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await supabase.from('caixas').insert({
                operador_id: user.id,
                valor_inicial: parseFloat(openingBalance),
                status: 'aberto',
                data_abertura: new Date().toISOString()
            });

            if (error) throw error;

            toast({ title: "Caixa Aberto", description: "Turno iniciado com sucesso." });
            setOpeningBalance('');
            onSuccess();
            checkOpenRegister();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBleed = async () => {
        if (!bleedAmount || !currentCaixa) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const bleedValue = parseFloat(bleedAmount);

            // Inserir movimentação
            const { error } = await supabase.from('movimentacoes_caixa').insert({
                caixa_id: currentCaixa.id,
                tipo: 'sangria',
                valor: bleedValue,
                motivo: bleedReason || 'Sangria Avulsa',
                usuario_responsavel: user?.id,
                criado_em: new Date().toISOString()
            });

            if (error) throw error;

            toast({ title: "Sangria Realizada", description: `R$ ${bleedValue} retirado do caixa.` });
            setBleedAmount('');
            setBleedReason('');
            onSuccess();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseRegister = async () => {
        if (!currentCaixa) return;
        setIsLoading(true); // Don't allow multiple clicks

        try {
            // Calcular totais do sistema
            const { data: vendas } = await supabase
                .from('vendas')
                .select('total, forma_pagamento')
                .eq('caixa_id', currentCaixa.id)
                .neq('status', 'cancelada');

            const saldoDinheiro = vendas?.filter(v => v.forma_pagamento === 'dinheiro').reduce((acc, v) => acc + (v.total || 0), 0) || 0;
            const saldoPix = vendas?.filter(v => v.forma_pagamento === 'pix').reduce((acc, v) => acc + (v.total || 0), 0) || 0;
            const saldoCartao = vendas?.filter(v => ['credito', 'debito'].includes(v.forma_pagamento || '')).reduce((acc, v) => acc + (v.total || 0), 0) || 0;

            // Calcular sangrias
            const { data: movs } = await supabase
                .from('movimentacoes_caixa')
                .select('valor, tipo')
                .eq('caixa_id', currentCaixa.id);

            const totalSangria = movs?.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + m.valor, 0) || 0;
            const totalSuprimento = movs?.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0) || 0;

            const saldoFinalSistema = (currentCaixa.valor_inicial || 0) + saldoDinheiro + totalSuprimento - totalSangria;
            const valorInformado = parseFloat(closingBalance) || saldoFinalSistema; // Se não informar, assume sistema
            const quebra = valorInformado - saldoFinalSistema;

            const { error } = await supabase.from('caixas').update({
                status: 'fechado',
                data_fechamento: new Date().toISOString(),
                valor_final: valorInformado,
                quebra_de_caixa: quebra,
                saldo_dinheiro: saldoDinheiro,
                saldo_pix: saldoPix,
                saldo_cartao: saldoCartao
            }).eq('id', currentCaixa.id);

            if (error) throw error;

            toast({
                title: "Caixa Fechado",
                description: `Fechamento realizado. Quebra: R$ ${quebra.toFixed(2)}`
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {currentCaixa ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5 text-red-500" />}
                        Gestão de Caixa
                    </DialogTitle>
                </DialogHeader>

                {isLoading && !currentCaixa && <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}

                {!isLoading && !currentCaixa && (
                    <div className="space-y-4">
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-2">O caixa está fechado.</p>
                            <h3 className="font-bold text-lg">Inicie um novo turno</h3>
                        </div>
                        <div className="space-y-2">
                            <Label>Fundo de Troco (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                            />
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleOpenRegister}>
                            Abrir Caixa
                        </Button>
                    </div>
                )}

                {!isLoading && currentCaixa && (
                    <Tabs defaultValue="sangria" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="sangria">Sangria / Retirada</TabsTrigger>
                            <TabsTrigger value="fechar">Fechar Caixa</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sangria" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Valor da Retirada (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.10"
                                    value={bleedAmount}
                                    onChange={(e) => setBleedAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Motivo</Label>
                                <Input
                                    placeholder="Ex: Pagamento Fornecedor"
                                    value={bleedReason}
                                    onChange={(e) => setBleedReason(e.target.value)}
                                />
                            </div>
                            <Button variant="destructive" className="w-full" onClick={handleBleed}>
                                Confirmar Sangria
                            </Button>
                        </TabsContent>

                        <TabsContent value="fechar" className="space-y-4 pt-4">
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800 font-medium">Atenção: Essa ação encerra o turno atual e não pode ser desfeita.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor em Caixa (Conferência Física)</Label>
                                <Input
                                    type="number"
                                    placeholder="Informe o valor contado..."
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCloseRegister}>
                                Fechar Caixa Agora
                            </Button>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};
