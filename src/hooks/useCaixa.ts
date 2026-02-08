
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StatusCaixa = 'aberto' | 'fechado';

export interface Caixa {
    id: string;
    operador_id: string;
    valor_inicial: number;
    valor_final?: number;
    status: StatusCaixa;
    data_abertura: string;
    data_fechamento?: string;
    saldo_dinheiro: number;
    saldo_cartao: number;
    saldo_pix: number;
    observacoes?: string;
}

export function useCaixa() {
    const queryClient = useQueryClient();

    // Buscar caixa aberto do usuário atual
    const { data: caixaAberto, isLoading } = useQuery({
        queryKey: ['caixa-aberto'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('caixas')
                .select('*')
                .eq('operador_id', user.id)
                .eq('status', 'aberto')
                .maybeSingle();

            if (error) throw error;
            return data as Caixa | null;
        },
    });

    // Mutação para Abrir Caixa
    const abrirCaixa = useMutation({
        mutationFn: async (valorInicial: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase.rpc('abrir_caixa', {
                p_operador_id: user.id,
                p_valor_inicial: valorInicial
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] });
            toast.success('Caixa aberto com sucesso!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erro ao abrir caixa');
        }
    });

    // Mutação para Fechar Caixa
    const fecharCaixa = useMutation({
        mutationFn: async ({ caixaId, valorFinal, quebra }: { caixaId: string, valorFinal: number, quebra: number }) => {
            const { error } = await supabase.rpc('fechar_caixa', {
                p_caixa_id: caixaId,
                p_valor_final_informado: valorFinal,
                p_quebra: quebra
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] });
            toast.success('Caixa fechado com sucesso!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erro ao fechar caixa');
        }
    });

    // Mutação para Sangria/Suprimento
    const movimentarCaixa = useMutation({
        mutationFn: async ({ caixaId, tipo, valor, motivo }: { caixaId: string, tipo: 'sangria' | 'suprimento', valor: number, motivo: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase.rpc('movimentar_caixa', {
                p_caixa_id: caixaId,
                p_tipo: tipo,
                p_valor: valor,
                p_motivo: motivo,
                p_usuario_id: user.id
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] });
            toast.success('Movimentação realizada com sucesso!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erro ao movimentar caixa');
        }
    });

    return {
        caixaAberto,
        isLoading,
        abrirCaixa,
        fecharCaixa,
        movimentarCaixa
    };
}
