import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calculator, Save, DollarSign, Package, AlertTriangle } from "lucide-react";

export default function Precificacao() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [nome, setNome] = useState("");
    const [ehCaixa, setEhCaixa] = useState(false);
    const [pesoCaixa, setPesoCaixa] = useState(""); // em kg
    const [custo, setCusto] = useState(""); // R$
    const [margem, setMargem] = useState("50"); // %
    const [perda, setPerda] = useState("15"); // % (DEFAULT 15%)
    const [tipoUnidade, setTipoUnidade] = useState("un"); // un ou kg

    // Calculated State
    const [custoUnitarioNota, setCustoUnitarioNota] = useState(0); // Custo "Limpo" da Nota
    const [custoReal, setCustoReal] = useState(0); // Custo com Quebra
    const [precoVenda, setPrecoVenda] = useState(0);

    // Auto-Calculate Effect
    useEffect(() => {
        const custoNum = parseFloat(custo.replace(',', '.')) || 0;
        const margemNum = parseFloat(margem) || 0;
        const perdaNum = parseFloat(perda) || 0;
        const pesoNum = parseFloat(pesoCaixa.replace(',', '.')) || 1;

        // 1. Custo Unitário da Nota (Sem Perda)
        let custoBase = custoNum;
        if (ehCaixa && pesoNum > 0) {
            custoBase = custoNum / pesoNum;
        }
        setCustoUnitarioNota(custoBase);

        // 2. Custo Real (Com Perda/Quebra)
        // Fórmula: Custo / (1 - Perda%)
        // Ex: 4.00 / (1 - 0.15) = 4.00 / 0.85 = 4.705...
        const divisorPerda = 1 - (perdaNum / 100);
        const custoComQuebra = divisorPerda > 0 ? custoBase / divisorPerda : custoBase; // Evitar divisão por zero/negativo
        setCustoReal(custoComQuebra);

        // 3. Preço de Venda (Sobre Custo Real)
        // Fórmula: CustoReal * (1 + Margem%)
        const venda = custoComQuebra * (1 + (margemNum / 100));
        setPrecoVenda(venda);

        // Ajusta o tipo de unidade automaticamente
        if (ehCaixa) setTipoUnidade("kg");

    }, [custo, margem, perda, ehCaixa, pesoCaixa]);

    const handleSave = async () => {
        if (!nome || !custo) {
            toast({
                title: "Erro de Validação",
                description: "Preencha pelo menos o Nome e o Preço de Custo.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { data: existing } = await supabase
                .from('produtos')
                .select('id')
                .ilike('nome', nome.trim())
                .limit(1)
                .single();

            const produtoId = existing?.id;

            const payload = {
                nome: nome.trim(),
                preco_custo: parseFloat(custo.replace(',', '.')),
                eh_caixa: ehCaixa,
                peso_caixa: ehCaixa ? parseFloat(pesoCaixa.replace(',', '.')) : null,
                margem_lucro: parseFloat(margem),
                margem_perda: parseFloat(perda), // Novo Campo
                preco_unidade: precoVenda,
                tipo_venda: (ehCaixa ? 'peso' : (tipoUnidade === 'kg' ? 'peso' : 'unidade')) as "peso" | "unidade" | "hibrido",
                estoque_atual: 0,
            };

            let error;
            if (produtoId) {
                const res = await supabase.from('produtos').update(payload).eq('id', produtoId);
                error = res.error;
            } else {
                const res = await supabase.from('produtos').insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: `Produto "${nome}" salvo! Venda: R$ ${precoVenda.toFixed(2)}.`,
            });

            setNome("");
            setCusto("");
            // Mantém margens configuradas
        } catch (err: any) {
            toast({
                title: "Erro ao Salvar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Calculator className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Precificação Profissional</h1>
                    <p className="text-muted-foreground">Calcule o preço ideal considerando custos, perdas e lucro.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" /> Dados de Entrada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome do Produto</Label>
                            <Input
                                id="nome"
                                placeholder="Ex: Tomate Italiano..."
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="text-lg"
                            />
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <Switch id="eh-caixa" checked={ehCaixa} onCheckedChange={setEhCaixa} />
                            <Label htmlFor="eh-caixa">Compra por Caixa Fechada?</Label>
                        </div>

                        {ehCaixa && (
                            <div className="space-y-2 bg-secondary/30 p-4 rounded-md border border-secondary">
                                <Label htmlFor="peso-caixa">Peso Total da Caixa</Label>
                                <div className="relative">
                                    <Input
                                        id="peso-caixa"
                                        type="number"
                                        placeholder="Ex: 18 (kg)"
                                        value={pesoCaixa}
                                        onChange={(e) => setPesoCaixa(e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">kg</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* PREÇO CUSTO NOTA */}
                            <div className="space-y-2">
                                <Label htmlFor="custo">Custo na Nota (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="custo"
                                        type="number"
                                        className="pl-9"
                                        placeholder="0,00"
                                        value={custo}
                                        onChange={(e) => setCusto(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* MARGEM DE PERDA (NOVO COMPONENTE) */}
                            <div className="space-y-2">
                                <Label htmlFor="perda" className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="w-3 h-3" /> Quebra/Perda (%)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="perda"
                                        type="number"
                                        value={perda}
                                        onChange={(e) => setPerda(e.target.value)}
                                        className="pr-8 border-amber-200 focus-visible:ring-amber-400"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="margem">Margem de Lucro Desejada (%)</Label>
                            <div className="relative">
                                <Input
                                    id="margem"
                                    type="number"
                                    value={margem}
                                    onChange={(e) => setMargem(e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                            </div>
                        </div>

                        {!ehCaixa && (
                            <div className="space-y-2">
                                <Label>Tipo de Venda</Label>
                                <Select value={tipoUnidade} onValueChange={setTipoUnidade}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="un">Unidade (un)</SelectItem>
                                        <SelectItem value="kg">Peso (kg)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* LADO DIREITO: RESULTADO DETALHADO */}
                <Card className="bg-gradient-to-br from-background to-secondary/10 border-primary/20 shadow-lg flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5" /> Composição do Preço
                        </CardTitle>
                        <CardDescription>Entenda como chegamos ao valor final</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Custo Unitário (Nota):</span>
                                <span>R$ {custoUnitarioNota.toFixed(2)}</span>
                            </div>

                            {/* VISUALIZAÇÃO DO CUSTO REAL COM PERDA */}
                            <div className="flex justify-between text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Custo Real (+{perda}% Quebra):</span>
                                <span>R$ {custoReal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Lucro Aplicado (+{margem}%):</span>
                                <span className="text-green-600 font-bold">
                                    + R$ {(precoVenda - custoReal).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="text-center py-6 border-y border-dashed border-primary/30">
                            <span className="text-sm text-muted-foreground uppercase tracking-wider">Preço de Venda Sugerido</span>
                            <div className="text-5xl font-extrabold text-primary mt-2">
                                R$ {precoVenda.toFixed(2)}
                                <span className="text-sm text-muted-foreground font-normal ml-2">
                                    /{ehCaixa ? 'kg' : tipoUnidade}
                                </span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-lg h-14 bg-green-600 hover:bg-green-700"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-5 w-5" />
                            )}
                            {loading ? "Salvando..." : "Salvar Produto"}
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
