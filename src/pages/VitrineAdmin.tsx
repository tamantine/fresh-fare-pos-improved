
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Store, Save, Search, RefreshCw, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Produto {
    id: string;
    nome: string;
    preco_unidade: number;
    preco_oferta: number | null;
    em_vitrine: boolean;
    imagem_url: string | null;
}

interface VitrineIdeia {
    titulo: string;
    slogan: string;
    copywriting: string;
    tema_visual: { cor: string; emoji: string };
    created_at: string;
}

export default function VitrineAdmin() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [ideiaAtual, setIdeiaAtual] = useState<VitrineIdeia | null>(null);

    useEffect(() => {
        fetchProdutos();
        fetchUltimaIdeia();
    }, []);

    const fetchProdutos = async () => {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('nome');

            if (error) throw error;
            setProdutos(data || []);
        } catch (error: any) {
            toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchUltimaIdeia = async () => {
        try {
            const { data, error } = await supabase
                .from('vitrine_conteudo')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                // Parse tema_visual if it's a string, with fallback default
                let tema: { cor: string; emoji: string } = { cor: '#6B21A8', emoji: '🛒' };
                if (typeof data.tema_visual === 'string') {
                    try { tema = JSON.parse(data.tema_visual); } catch (e) { /* usa o padrão */ }
                } else if (data.tema_visual && typeof data.tema_visual === 'object') {
                    tema = data.tema_visual as { cor: string; emoji: string };
                }
                setIdeiaAtual({ ...data, tema_visual: tema });
            }
        } catch (error) {
            console.log("Nenhuma ideia anterior encontrada");
        }
    };

    const toggleVitrine = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('produtos')
                .update({ em_vitrine: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setProdutos(produtos.map(p =>
                p.id === id ? { ...p, em_vitrine: !currentStatus } : p
            ));
        } catch (error: any) {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        }
    };

    const updatePrecoOferta = async (id: string, novoPreco: string) => {
        const precoNum = parseFloat(novoPreco.replace(',', '.'));
        if (isNaN(precoNum)) return;

        try {
            const { error } = await supabase
                .from('produtos')
                .update({ preco_oferta: precoNum })
                .eq('id', id);

            if (error) throw error;

            setProdutos(produtos.map(p =>
                p.id === id ? { ...p, preco_oferta: precoNum } : p
            ));
        } catch (error: any) {
            toast({ title: "Erro ao atualizar preço", description: error.message, variant: "destructive" });
        }
    };

    const gerarNovaIdeia = async () => {
        const produtosVitrine = produtos.filter(p => p.em_vitrine);
        if (produtosVitrine.length === 0) {
            toast({ title: "⚠️ Vitrine Vazia", description: "Selecione pelo menos um produto para a vitrine antes de gerar.", variant: "default" });
            return;
        }

        setGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('gerar-vitrine');

            if (error) throw error;

            setIdeiaAtual(data);
            toast({
                title: "✨ Ideia Gerada com Sucesso!",
                description: `Tema: ${data.titulo}`,
                className: "bg-green-50 border-green-200"
            });
        } catch (error: any) {
            toast({ title: "Erro na IA", description: error.message, variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const filteredProdutos = produtos.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Store className="w-8 h-8 text-primary" /> Gestor de Vitrine
                    </h1>
                    <p className="text-muted-foreground">Escolha os produtos e deixe a IA criar sua campanha de vendas.</p>
                </div>
                <Button
                    size="lg"
                    onClick={gerarNovaIdeia}
                    disabled={generating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transition-all hover:scale-105"
                >
                    {generating ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-5 w-5" />
                    )}
                    {generating ? "Criando Mágica..." : "Gerar Nova Vitrine com IA"}
                </Button>
            </div>

            {/* ÁREA DA IDEIA ATUAL (RESULTADO DA IA) */}
            {ideiaAtual && (
                <Card className="border-purple-200 bg-purple-50/30 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-[100px]">
                        {ideiaAtual.tema_visual?.emoji}
                    </div>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-purple-800">
                            <span className="flex items-center gap-2">
                                <Palette className="w-5 h-5" /> Tema Atual: {ideiaAtual.titulo}
                            </span>
                            <Badge variant="outline" className="bg-white text-xl p-2">{ideiaAtual.tema_visual?.emoji}</Badge>
                        </CardTitle>
                        <CardDescription className="text-lg font-medium text-purple-600">
                            "{ideiaAtual.slogan}"
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-white p-4 rounded-lg border border-purple-100 italic text-muted-foreground">
                            "{ideiaAtual.copywriting}"
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            Gerado em: {new Date(ideiaAtual.created_at).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>Produtos Disponíveis</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar produto..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {filteredProdutos.map((produto) => (
                                <div
                                    key={produto.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${produto.em_vitrine ? 'bg-primary/5 border-primary shadow-sm' : 'bg-background hover:bg-muted/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={produto.em_vitrine}
                                            onCheckedChange={() => toggleVitrine(produto.id, produto.em_vitrine)}
                                        />
                                        <div>
                                            <p className={`font-medium ${produto.em_vitrine ? 'text-primary' : ''}`}>{produto.nome}</p>
                                            <p className="text-sm text-muted-foreground">R$ {(produto.preco_unidade ?? 0).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {produto.em_vitrine && (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-5 fade-in">
                                            <span className="text-sm font-medium text-green-600 hidden md:inline">Oferta:</span>
                                            <div className="relative w-28">
                                                <span className="absolute left-2 top-2 text-xs text-muted-foreground">R$</span>
                                                <Input
                                                    className="h-8 pl-6 border-green-200 focus-visible:ring-green-400 font-bold text-green-700"
                                                    placeholder={(produto.preco_unidade ?? 0).toFixed(2)}
                                                    defaultValue={produto.preco_oferta || ''}
                                                    onBlur={(e) => updatePrecoOferta(produto.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {filteredProdutos.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum produto encontrado.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
