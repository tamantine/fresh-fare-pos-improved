import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Terminal } from 'lucide-react';

const SystemTest = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runTests = async () => {
        setIsRunning(true);
        setLogs([]);
        addLog('🚀 Iniciando Testes de Sistema (Browser Mode)...');

        try {
            // 1. Teste de Fluxo de Caixa
            addLog('\n📦 1. Testando Fluxo de Caixa...');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Usuário não autenticado.');
            }

            // 1.1 Abrir Caixa
            const { data: caixa, error: openError } = await supabase
                .from('caixas')
                .insert({
                    valor_inicial: 100.00,
                    status: 'aberto',
                    operador_id: user.id,
                    data_abertura: new Date().toISOString()
                })
                .select()
                .single();

            if (openError) throw new Error(`Falha ao abrir caixa: ${openError.message}`);
            addLog(`✅ Caixa aberto com sucesso! ID: ${caixa.id}`);

            // 1.2 Sangria
            const { error: sangriaError } = await supabase
                .from('movimentacoes_caixa')
                .insert({
                    caixa_id: caixa.id,
                    tipo: 'sangria',
                    valor: 50.00,
                    motivo: 'Teste Automatizado Browser'
                });

            if (sangriaError) throw new Error(`Falha na sangria: ${sangriaError.message}`);
            addLog('✅ Sangria de R$ 50,00 registrada.');

            // 1.3 Fechar Caixa
            const { error: closeError } = await supabase
                .from('caixas')
                .update({
                    status: 'fechado',
                    data_fechamento: new Date().toISOString(),
                    valor_final: 50.00
                })
                .eq('id', caixa.id);

            if (closeError) throw new Error(`Falha ao fechar caixa: ${closeError.message}`);
            addLog('✅ Caixa fechado com sucesso.');

            // 2. Teste de Estoque e PDV
            addLog('\n🛒 2. Testando Estoque...');
            const { data: produto } = await supabase.from('produtos').select('*').limit(1).single();

            if (produto) {
                const estoqueInicial = produto.estoque_atual || 0;
                addLog(`🔹 Produto: ${produto.nome} | Estoque Atual: ${estoqueInicial}`);

                // Simular Venda (Update)
                const { error: saleError } = await supabase
                    .from('produtos')
                    .update({ estoque_atual: estoqueInicial - 1 })
                    .eq('id', produto.id);

                if (saleError) throw new Error(`Erro ao atualizar estoque: ${saleError.message}`);
                addLog('✅ Estoque decrementado (-1).');

                // Reverter
                await supabase.from('produtos').update({ estoque_atual: estoqueInicial }).eq('id', produto.id);
                addLog('✅ Estoque revertido para original.');
            } else {
                addLog('⚠️ Nenhum produto encontrado para teste.');
            }

            // 3. Teste do Agente IA (Edge Function)
            addLog('\n🤖 3. Testando Agente IA (Manager)...');

            // 3.1 Check RPC
            addLog('🔍 Verificando função RPC execute_sql_query...');
            const { error: rpcError } = await supabase.rpc('execute_sql_query', { query_text: 'SELECT count(*) FROM vendas' });

            if (rpcError) {
                addLog(`❌ Erro RPC: ${rpcError.message}`);
                addLog('💡 DICA: Você precisa rodar o script SQL no Supabase Dashboard!');
            } else {
                addLog('✅ Função RPC existe e está acessível.');
            }

            // 3.2 Invoke Agent
            addLog('💬 Invocando Agente...');
            const { data: agentData, error: agentError } = await supabase.functions.invoke('manager-agent', {
                body: { message: "Qual o total de vendas hoje?" }
            });

            if (agentError) {
                addLog(`❌ Erro no Agente: ${agentError.message}`);
            } else {
                addLog(`✅ Resposta do Agente: "${agentData?.content?.slice(0, 100)}..."`);
            }

            addLog('\n🏁 Testes Finalizados!');

        } catch (error: any) {
            addLog(`❌ ERRO CRÍTICO: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-6 w-6" />
                        Diagnóstico de Sistema (E2E)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <p className="font-bold mb-2">Instruções:</p>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li>Certifique-se de estar logado no sistema.</li>
                            <li>Se o teste do Agente falhar, verifique se aplicou o SQL e fez o deploy da função.</li>
                            <li>Este teste cria registros reais no banco (Caixas de teste), mas tenta limpar ou fechar adequadamente.</li>
                        </ol>
                    </div>

                    <Button
                        onClick={runTests}
                        disabled={isRunning}
                        className="w-full h-12 text-lg"
                    >
                        {isRunning ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rodando Testes...</>
                        ) : (
                            'Iniciar Verificação Completa'
                        )}
                    </Button>

                    <ScrollArea className="h-[400px] w-full rounded-md border bg-slate-950 p-4 font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="text-slate-500 text-center mt-20">Clique em Iniciar para ver os logs...</div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className={`
                                        ${log.includes('✅') ? 'text-green-400' : ''}
                                        ${log.includes('❌') ? 'text-red-400' : ''}
                                        ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                                        ${log.includes('🔹') ? 'text-blue-400' : ''}
                                        ${!['✅', '❌', '⚠️', '🔹'].some(emoji => log.includes(emoji)) ? 'text-slate-300' : ''}

                                    `}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemTest;
