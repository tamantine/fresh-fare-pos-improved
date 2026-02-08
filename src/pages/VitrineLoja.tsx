
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Produto {
    id: string;
    nome: string;
    preco_unidade: number;
    preco_oferta: number | null;
    tipo_venda: string;
    imagem_url: string | null;
}

interface VitrineTema {
    titulo: string;
    slogan: string;
    tema_visual: { cor: string; emoji: string };
    copywriting: string;
}

export default function VitrineLoja() {
    const [loading, setLoading] = useState(true);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [tema, setTema] = useState<VitrineTema | null>(null);

    useEffect(() => {
        const loadVitrine = async () => {
            try {
                // 1. Carregar Tema Ativo
                const { data: temaData } = await supabase
                    .from('vitrine_conteudo')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (temaData) {
                    let visual = temaData.tema_visual;
                    if (typeof visual === 'string') {
                        try { visual = JSON.parse(visual); } catch (e) { visual = { cor: 'green', emoji: '🥗' }; }
                    }
                    setTema({ ...temaData, tema_visual: visual });
                }

                // 2. Carregar Produtos da Vitrine
                const { data: prodData } = await supabase
                    .from('produtos')
                    .select('*')
                    .eq('em_vitrine', true)
                    .order('nome');

                setProdutos(prodData || []);
            } catch (error) {
                console.error("Erro ao carregar vitrine", error);
            } finally {
                setLoading(false);
            }
        };

        loadVitrine();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    // Default Fallback Theme
    const bgColor = tema?.tema_visual?.cor === 'purple' ? 'bg-purple-50' :
        tema?.tema_visual?.cor === 'red' ? 'bg-red-50' :
            tema?.tema_visual?.cor === 'orange' ? 'bg-orange-50' : 'bg-green-50';

    const primaryColor = tema?.tema_visual?.cor === 'purple' ? 'text-purple-700' :
        tema?.tema_visual?.cor === 'red' ? 'text-red-700' :
            tema?.tema_visual?.cor === 'orange' ? 'text-orange-700' : 'text-green-700';

    const borderColor = tema?.tema_visual?.cor === 'purple' ? 'border-purple-200' :
        tema?.tema_visual?.cor === 'red' ? 'border-red-200' :
            tema?.tema_visual?.cor === 'orange' ? 'border-orange-200' : 'border-green-200';

    return (
        <div className={`min-h-screen ${bgColor} animate-in fade-in duration-700 font-sans`}>
            {/* HERÓI / CABEÇALHO */}
            <header className="relative overflow-hidden bg-white shadow-sm pb-12 pt-6 px-4 text-center rounded-b-[3rem]">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

                <div className="mb-4 inline-block animate-bounce duration-[2000ms]">
                    <span className="text-6xl filter drop-shadow-md">{tema?.tema_visual?.emoji || '🥗'}</span>
                </div>

                <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-2 ${primaryColor} drop-shadow-sm uppercase`}>
                    {tema?.titulo || "Ofertas Fresquinhas"}
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground font-light italic max-w-2xl mx-auto">
                    "{tema?.slogan || "Do campo direto para sua mesa"}"
                </p>

                {tema?.copywriting && (
                    <div className="mt-6 max-w-lg mx-auto bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm md:text-base shadow-sm">
                        ✨ {tema.copywriting}
                    </div>
                )}
            </header>

            {/* GRADE DE PRODUTOS */}
            <main className="container mx-auto px-4 py-12">
                {produtos.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-xl">Nenhuma oferta disponível no momento.</p>
                        <p>Volte mais tarde para conferir nossas novidades!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {produtos.map((produto) => (
                            <Card
                                key={produto.id}
                                className={`group overflow-hidden border-2 ${borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white`}
                            >
                                <div className="aspect-square relative bg-white flex items-center justify-center p-4 overflow-hidden">
                                    {produto.preco_oferta && (
                                        <div className="absolute top-2 right-2 z-10 animate-pulse">
                                            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 px-3 py-1 text-sm font-bold shadow-lg transform rotate-3">
                                                OFERTA
                                            </Badge>
                                        </div>
                                    )}

                                    {produto.imagem_url ? (
                                        <img
                                            src={produto.imagem_url}
                                            alt={produto.nome}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="text-6xl group-hover:scale-125 transition-transform duration-300 opacity-20">
                                            {tema?.tema_visual?.emoji || '🥕'}
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 text-center relative z-20 bg-white/90 backdrop-blur-sm">
                                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-primary transition-colors text-lg">
                                        {produto.nome}
                                    </h3>

                                    <div className="flex flex-col items-center justify-center gap-1 mt-2">
                                        {produto.preco_oferta ? (
                                            <>
                                                <span className="text-xs text-muted-foreground line-through">
                                                    R$ {(produto.preco_unidade ?? 0).toFixed(2)}
                                                </span>
                                                <div className="text-2xl font-black text-red-600 flex items-baseline gap-1">
                                                    <span className="text-sm">R$</span>
                                                    {(produto.preco_oferta ?? 0).toFixed(2)}
                                                    <span className="text-sm font-normal text-muted-foreground">/{produto.tipo_venda === 'peso' ? 'kg' : 'un'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-2xl font-black text-gray-700 flex items-baseline gap-1">
                                                <span className="text-sm">R$</span>
                                                {(produto.preco_unidade ?? 0).toFixed(2)}
                                                <span className="text-sm font-normal text-muted-foreground">/{produto.tipo_venda === 'peso' ? 'kg' : 'un'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button className="w-full mt-4 bg-gray-900 text-white hover:bg-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all font-bold tracking-wide">
                                        <ShoppingCart className="w-4 h-4 mr-2" /> EU QUERO
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* RODAPÉ */}
            <footer className="bg-white py-8 text-center border-t relative overflow-hidden">
                <p className="text-muted-foreground font-medium">
                    © {new Date().getFullYear()} Hortifruti Bom Preço
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Ofertas válidas enquanto durarem os estoques. Imagens meramente ilustrativas.
                </p>
                <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 opacity-50"></div>
            </footer>
        </div>
    );
}
