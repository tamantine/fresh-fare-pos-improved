import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashRegisterModal } from '@/components/CashRegisterModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    ArrowLeft,
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Printer,
    CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ManagerChat } from '@/components/ManagerChat';

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalFaturamento: 0,
        qtdVendas: 0,
        ticketMedio: 0,
        totalItens: 0
    });
    const [vendasPorPagamento, setVendasPorPagamento] = useState<any[]>([]);
    const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);

    const [dataAtual, setDataAtual] = useState(new Date());
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const inicioDia = `${hoje}T00:00:00`;
            const fimDia = `${hoje}T23:59:59`;

            // 1. Buscar Vendas do Dia
            const { data: vendas, error } = await supabase
                .from('vendas')
                .select(`
          *,
          itens_venda (quantidade, produto_id, produtos(nome))
        `)
                .gte('created_at', inicioDia)
                .lte('created_at', fimDia)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (vendas) {
                // Métricas Gerais
                const totalFaturamento = vendas.reduce((acc, v) => acc + (v.total || 0), 0);
                const qtdVendas = vendas.length;
                const ticketMedio = qtdVendas > 0 ? totalFaturamento / qtdVendas : 0;

                let totalItens = 0;
                vendas.forEach(v => {
                    if (v.itens_venda) {
                        v.itens_venda.forEach((i: any) => totalItens += i.quantidade || 0);
                    }
                });

                setMetrics({
                    totalFaturamento,
                    qtdVendas,
                    ticketMedio,
                    totalItens
                });

                // Agrupamento por Pagamento
                const pagamentos: any = {};
                vendas.forEach(v => {
                    const forma = v.forma_pagamento || 'outros';
                    pagamentos[forma] = (pagamentos[forma] || 0) + v.total;
                });

                const dadosGrafico = Object.keys(pagamentos).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: pagamentos[key]
                }));
                setVendasPorPagamento(dadosGrafico);

                // Últimas Vendas
                setUltimasVendas(vendas.slice(0, 5));
            }

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center no-print">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Dashboard de Gestão</h1>
                            <p className="text-gray-500">Visão geral do dia {dataAtual.toLocaleDateString()}</p>
                        </div>
                    </div>
                    <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Printer className="h-4 w-4" /> Imprimir Relatório
                    </Button>
                </div>

                <CashRegisterModal
                    isOpen={isCashModalOpen}
                    onClose={() => setIsCashModalOpen(false)}
                    onSuccess={carregarDados}
                />

                {/* CSS de Impressão */}
                <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            .print-break { break-inside: avoid; }
          }
        `}</style>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Carregando indicadores...</div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Faturamento Hoje</CardTitle>
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R$ {metrics.totalFaturamento.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">+0% em relação a ontem (Demo)</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Vendas Realizadas</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.qtdVendas}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
                                    <CreditCard className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R$ {metrics.ticketMedio.toFixed(2)}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Itens Vendidos</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.totalItens}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Gráfico de Pagamentos */}
                            <Card className="print-break">
                                <CardHeader>
                                    <CardTitle>Vendas por Pagamento</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={vendasPorPagamento}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {vendasPorPagamento.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Tabela de Últimas Vendas */}
                            <Card className="print-break">
                                <CardHeader>
                                    <CardTitle>Últimas Vendas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3">ID</th>
                                                    <th className="px-4 py-3">Hora</th>
                                                    <th className="px-4 py-3">Pagamento</th>
                                                    <th className="px-4 py-3 text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ultimasVendas.map((venda) => (
                                                    <tr key={venda.id} className="bg-white border-b hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-mono">{venda.id.slice(0, 8)}</td>
                                                        <td className="px-4 py-3">{new Date(venda.created_at).toLocaleTimeString().slice(0, 5)}</td>
                                                        <td className="px-4 py-3 capitalize">{venda.forma_pagamento}</td>
                                                        <td className="px-4 py-3 text-right font-bold">R$ {venda.total.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </>
                )}
            </div>
            <ManagerChat />
        </div >
    );
};

export default Dashboard;
