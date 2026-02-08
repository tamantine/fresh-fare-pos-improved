import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ImageIcon, Download, Sparkles, Wand2, Upload, Edit3, RectangleVertical, Square } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://juhiiwsxrzhxprgbpeia.supabase.co';

export default function GerarImagem() {
    // Estados para criação
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [activeTab, setActiveTab] = useState('generate');

    // Estados para edição estruturada
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [nomeProduto, setNomeProduto] = useState('');
    const [preco, setPreco] = useState('');
    const [tipoVenda, setTipoVenda] = useState<'kg' | 'unidade' | 'bandeja'>('kg');
    const [proporcao, setProporcao] = useState<'9:16' | '1:1'>('9:16');
    const [promptExtra, setPromptExtra] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const sugestoes = [
        'Placa de promoção de banana com fundo amarelo',
        'Banner de oferta de frutas frescas',
        'Cartaz de hortifruti com legumes coloridos',
    ];

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setReferenceImage(e.target?.result as string);
            toast.success('Imagem carregada!');
        };
        reader.readAsDataURL(file);
    };

    // Gerar imagem do zero
    const gerarImagem = async () => {
        if (!prompt.trim()) {
            toast.error('Digite uma descrição');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Gerando imagem...');
        setGeneratedImage(null);

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    mode: 'generate',
                    aspect_ratio: proporcao
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.success && data.image) {
                setGeneratedImage(data.image);
                toast.success('Imagem gerada!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao gerar imagem');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Editar imagem existente
    const editarImagem = async () => {
        if (!referenceImage) {
            toast.error('Faça upload de uma imagem base');
            return;
        }
        if (!nomeProduto.trim()) {
            toast.error('Digite o nome do produto');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Editando imagem...');
        setGeneratedImage(null);

        // Construir prompt estruturado
        let promptFinal = `Editar esta imagem mantendo o mesmo estilo e layout. `;
        promptFinal += `Alterar o produto para ${nomeProduto}. `;

        if (preco) {
            promptFinal += `O preço deve mostrar R$ ${preco} por ${tipoVenda === 'kg' ? 'kg' : tipoVenda === 'unidade' ? 'unidade' : 'bandeja'}. `;
        }

        if (promptExtra.trim()) {
            promptFinal += promptExtra;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptFinal,
                    mode: 'edit',
                    reference_image: referenceImage,
                    aspect_ratio: proporcao,
                    use_ai_prompt: false // Não preprocessar, já está estruturado
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.success && data.image) {
                setGeneratedImage(data.image);
                toast.success('Imagem editada!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao editar imagem');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const baixarImagem = async () => {
        if (!generatedImage) return;

        try {
            if (generatedImage.startsWith('http')) {
                const response = await fetch(generatedImage);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${nomeProduto || 'imagem'}-${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                const link = document.createElement('a');
                link.href = generatedImage;
                link.download = `${nomeProduto || 'imagem'}-${Date.now()}.png`;
                link.click();
            }
            toast.success('Download iniciado!');
        } catch (error) {
            toast.error('Erro ao baixar imagem');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Wand2 className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Gerador de Imagens IA
                    </h1>
                    <p className="text-muted-foreground">Crie e edite placas promocionais</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Painel de Criação/Edição */}
                <Card className="border-2">
                    <CardHeader className="pb-3">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="generate" className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Criar Nova
                                </TabsTrigger>
                                <TabsTrigger value="edit" className="flex items-center gap-2">
                                    <Edit3 className="h-4 w-4" />
                                    Editar Placa
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeTab === 'generate' ? (
                            // Aba CRIAR NOVA
                            <>
                                <div>
                                    <Label>Descrição da imagem</Label>
                                    <Textarea
                                        placeholder="Ex: Promoção de banana 3,99 o kg..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={3}
                                        className="resize-none mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Proporção</Label>
                                        <Select value={proporcao} onValueChange={(v: '9:16' | '1:1') => setProporcao(v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="9:16">
                                                    <div className="flex items-center gap-2">
                                                        <RectangleVertical className="h-4 w-4" />
                                                        9:16 (Vertical)
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="1:1">
                                                    <div className="flex items-center gap-2">
                                                        <Square className="h-4 w-4" />
                                                        1:1 (Quadrado)
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    onClick={gerarImagem}
                                    disabled={isLoading || !prompt.trim()}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{loadingMessage}</>
                                    ) : (
                                        <><Wand2 className="mr-2 h-5 w-5" />Gerar Imagem</>
                                    )}
                                </Button>

                                <div className="pt-3 border-t">
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Sugestões:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {sugestoes.map((sug, idx) => (
                                            <Button key={idx} variant="outline" size="sm" onClick={() => setPrompt(sug)} className="text-xs h-7">
                                                {sug.substring(0, 20)}...
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Aba EDITAR PLACA
                            <>
                                {/* Upload da imagem base */}
                                <div>
                                    <Label>Imagem Base (sua placa modelo)</Label>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                    {referenceImage ? (
                                        <div className="relative mt-1">
                                            <img src={referenceImage} alt="Base" className="w-full h-32 object-contain rounded-lg border bg-muted" />
                                            <Button variant="outline" size="sm" className="absolute top-1 right-1 h-7" onClick={() => fileInputRef.current?.click()}>
                                                Trocar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" className="w-full h-24 border-dashed mt-1" onClick={() => fileInputRef.current?.click()}>
                                            <div className="flex flex-col items-center gap-1">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-sm">Carregar imagem base</span>
                                            </div>
                                        </Button>
                                    )}
                                </div>

                                {/* Campos estruturados */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nome do Produto *</Label>
                                        <Input
                                            placeholder="Ex: Banana Prata"
                                            value={nomeProduto}
                                            onChange={(e) => setNomeProduto(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Preço (opcional)</Label>
                                        <Input
                                            placeholder="Ex: 4,99"
                                            value={preco}
                                            onChange={(e) => setPreco(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Tipo de Venda</Label>
                                        <Select value={tipoVenda} onValueChange={(v: 'kg' | 'unidade' | 'bandeja') => setTipoVenda(v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">Por Kg</SelectItem>
                                                <SelectItem value="unidade">Por Unidade</SelectItem>
                                                <SelectItem value="bandeja">Por Bandeja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Proporção</Label>
                                        <Select value={proporcao} onValueChange={(v: '9:16' | '1:1') => setProporcao(v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                                                <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Instruções Extras (opcional)</Label>
                                    <Textarea
                                        placeholder="Ex: Mude a cor do fundo para verde, adicione mais frutas..."
                                        value={promptExtra}
                                        onChange={(e) => setPromptExtra(e.target.value)}
                                        rows={2}
                                        className="resize-none mt-1"
                                    />
                                </div>

                                <Button
                                    onClick={editarImagem}
                                    disabled={isLoading || !referenceImage || !nomeProduto.trim()}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{loadingMessage}</>
                                    ) : (
                                        <><Edit3 className="mr-2 h-5 w-5" />Editar Placa</>
                                    )}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Painel de Resultado */}
                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ImageIcon className="h-5 w-5 text-pink-500" />
                            Resultado
                            {proporcao === '9:16' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Vertical</span>}
                            {proporcao === '1:1' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Quadrado</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`rounded-xl flex items-center justify-center overflow-hidden border-2 ${generatedImage ? 'border-transparent bg-transparent' : 'border-dashed bg-muted'} ${proporcao === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                            {isLoading ? (
                                <div className="text-center p-6 bg-muted w-full h-full flex flex-col items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-purple-500" />
                                    <p className="text-sm text-muted-foreground">{loadingMessage}</p>
                                </div>
                            ) : generatedImage ? (
                                <img src={generatedImage} alt="Resultado" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <div className="text-center p-6">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">Nenhuma imagem ainda</p>
                                </div>
                            )}
                        </div>

                        {generatedImage && (
                            <Button onClick={baixarImagem} variant="outline" className="w-full mt-3" size="lg">
                                <Download className="mr-2 h-5 w-5" />
                                Baixar Imagem
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
