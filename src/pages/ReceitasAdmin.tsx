import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
    Loader2,
    Plus,
    Trash2,
    Upload,
    FileText,
    Clock,
    Flame,
    ChefHat,
    Smartphone,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Store,
} from "lucide-react";

interface Receita {
    id: string;
    titulo: string;
    descricao: string;
    tempo_preparo: string;
    calorias: number;
    dificuldade: string;
    categoria: string;
    pdf_url: string | null;
    imagem_url: string | null;
    ativo: boolean;
    created_at: string;
}

interface Produto {
    id: string;
    nome: string;
    categoria: string;
    preco_venda: number;
    em_vitrine: boolean;
    preco_oferta: number | null;
    imagem_url: string | null;
}

const CATEGORIAS_RECEITA = ["Saladas", "Bowls", "Bebidas", "Lanches", "Pratos Quentes", "Sobremesas"];
const DIFICULDADES = ["fácil", "médio", "difícil"];

export default function ReceitasAdmin() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        titulo: "",
        descricao: "",
        tempo_preparo: "15 min",
        calorias: 200,
        dificuldade: "fácil",
        categoria: "Saladas",
        pdf_url: "",
        imagem_url: "",
        ativo: true,
    });

    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([loadReceitas(), loadProdutos()]);
        } finally {
            setLoading(false);
        }
    };

    const loadReceitas = async () => {
        try {
            const { data, error } = await supabase
                .from("receitas")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReceitas((data as Receita[]) || []);
        } catch (error: any) {
            toast({
                title: "Erro ao carregar receitas",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const loadProdutos = async () => {
        try {
            const { data, error } = await supabase
                .from("produtos")
                .select("id, nome, categoria, preco_venda, em_vitrine, preco_oferta, imagem_url")
                .order("nome");

            if (error) throw error;
            setProdutos((data as Produto[]) || []);
        } catch (error: any) {
            toast({
                title: "Erro ao carregar produtos",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setForm({
            titulo: "",
            descricao: "",
            tempo_preparo: "15 min",
            calorias: 200,
            dificuldade: "fácil",
            categoria: "Saladas",
            pdf_url: "",
            imagem_url: "",
            ativo: true,
        });
        setEditingId(null);
    };

    const openEditDialog = (receita: Receita) => {
        setEditingId(receita.id);
        setForm({
            titulo: receita.titulo,
            descricao: receita.descricao || "",
            tempo_preparo: receita.tempo_preparo,
            calorias: receita.calorias,
            dificuldade: receita.dificuldade,
            categoria: receita.categoria,
            pdf_url: receita.pdf_url || "",
            imagem_url: receita.imagem_url || "",
            ativo: receita.ativo,
        });
        setDialogOpen(true);
    };

    const handleUpload = async (file: File, type: "pdf" | "image") => {
        const bucket = "receitas";
        const ext = file.name.split(".").pop();
        const fileName = `${type}_${Date.now()}.${ext}`;

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

            if (type === "pdf") {
                setForm((prev) => ({ ...prev, pdf_url: urlData.publicUrl }));
            } else {
                setForm((prev) => ({ ...prev, imagem_url: urlData.publicUrl }));
            }

            toast({
                title: "Upload realizado!",
                description: `${type === "pdf" ? "PDF" : "Imagem"} enviado com sucesso.`,
            });
        } catch (error: any) {
            toast({
                title: "Erro no upload",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        if (!form.titulo.trim()) {
            toast({
                title: "Título obrigatório",
                description: "Informe o título da receita.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                titulo: form.titulo,
                descricao: form.descricao,
                tempo_preparo: form.tempo_preparo,
                calorias: form.calorias,
                dificuldade: form.dificuldade,
                categoria: form.categoria,
                pdf_url: form.pdf_url || null,
                imagem_url: form.imagem_url || null,
                ativo: form.ativo,
            };

            if (editingId) {
                const { error } = await supabase
                    .from("receitas")
                    .update(payload)
                    .eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("receitas").insert(payload);
                if (error) throw error;
            }

            toast({
                title: editingId ? "Receita atualizada!" : "Receita criada!",
                className: "bg-green-50 border-green-200",
            });

            setDialogOpen(false);
            resetForm();
            loadReceitas();
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

        try {
            const { error } = await supabase.from("receitas").delete().eq("id", id);
            if (error) throw error;

            toast({ title: "Receita excluída!" });
            loadReceitas();
        } catch (error: any) {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const toggleAtivoReceita = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("receitas")
                .update({ ativo: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            setReceitas((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ativo: !currentStatus } : r))
            );
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const toggleVitrineQualquer = async (produtoId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("produtos")
                .update({ em_vitrine: !currentStatus })
                .eq("id", produtoId);

            if (error) throw error;

            setProdutos((prev) =>
                prev.map((p) => (p.id === produtoId ? { ...p, em_vitrine: !currentStatus } : p))
            );

            toast({
                title: !currentStatus ? "✅ Adicionado à vitrine" : "❌ Removido da vitrine",
                className: !currentStatus ? "bg-green-50" : "bg-gray-50",
            });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getDifficultyColor = (dif: string) => {
        switch (dif) {
            case "fácil":
                return "bg-green-100 text-green-700";
            case "médio":
                return "bg-orange-100 text-orange-700";
            case "difícil":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Smartphone className="w-8 h-8 text-primary" /> Gestor do App Mobile
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie receitas e produtos da vitrine do aplicativo.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="receitas" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="receitas" className="gap-2">
                        <ChefHat className="w-4 h-4" /> Receitas
                    </TabsTrigger>
                    <TabsTrigger value="vitrine" className="gap-2">
                        <Store className="w-4 h-4" /> Vitrine
                    </TabsTrigger>
                </TabsList>

                {/* TAB RECEITAS */}
                <TabsContent value="receitas" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                                    onClick={() => {
                                        resetForm();
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-5 w-5" /> Nova Receita
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <ChefHat className="w-5 h-5" />
                                        {editingId ? "Editar Receita" : "Nova Receita"}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Label>Título *</Label>
                                            <Input
                                                placeholder="Nome da receita"
                                                value={form.titulo}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, titulo: e.target.value }))
                                                }
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <Label>Descrição</Label>
                                            <Textarea
                                                placeholder="Breve descrição da receita"
                                                value={form.descricao}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, descricao: e.target.value }))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Tempo de Preparo</Label>
                                            <Input
                                                placeholder="Ex: 15 min"
                                                value={form.tempo_preparo}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        tempo_preparo: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Calorias (kcal)</Label>
                                            <Input
                                                type="number"
                                                placeholder="200"
                                                value={form.calorias}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        calorias: parseInt(e.target.value) || 0,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Dificuldade</Label>
                                            <Select
                                                value={form.dificuldade}
                                                onValueChange={(val) =>
                                                    setForm((prev) => ({ ...prev, dificuldade: val }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DIFICULDADES.map((d) => (
                                                        <SelectItem key={d} value={d}>
                                                            {d.charAt(0).toUpperCase() + d.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Categoria</Label>
                                            <Select
                                                value={form.categoria}
                                                onValueChange={(val) =>
                                                    setForm((prev) => ({ ...prev, categoria: val }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORIAS_RECEITA.map((c) => (
                                                        <SelectItem key={c} value={c}>
                                                            {c}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Upload PDF */}
                                        <div className="col-span-2">
                                            <Label>PDF da Receita</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input
                                                    placeholder="URL do PDF ou faça upload"
                                                    value={form.pdf_url}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({ ...prev, pdf_url: e.target.value }))
                                                    }
                                                    className="flex-1"
                                                />
                                                <input
                                                    ref={pdfInputRef}
                                                    type="file"
                                                    accept=".pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUpload(file, "pdf");
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => pdfInputRef.current?.click()}
                                                >
                                                    <Upload className="w-4 h-4 mr-2" /> Upload
                                                </Button>
                                            </div>
                                            {form.pdf_url && (
                                                <a
                                                    href={form.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary flex items-center gap-1 mt-1"
                                                >
                                                    <FileText className="w-3 h-3" /> Ver PDF
                                                </a>
                                            )}
                                        </div>

                                        {/* Upload Imagem */}
                                        <div className="col-span-2">
                                            <Label>Imagem (Thumbnail)</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input
                                                    placeholder="URL da imagem ou faça upload"
                                                    value={form.imagem_url}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            imagem_url: e.target.value,
                                                        }))
                                                    }
                                                    className="flex-1"
                                                />
                                                <input
                                                    ref={imgInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUpload(file, "image");
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => imgInputRef.current?.click()}
                                                >
                                                    <ImageIcon className="w-4 h-4 mr-2" /> Upload
                                                </Button>
                                            </div>
                                            {form.imagem_url && (
                                                <img
                                                    src={form.imagem_url}
                                                    alt="Preview"
                                                    className="w-20 h-20 object-cover rounded-lg mt-2 border"
                                                />
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2">
                                            <Switch
                                                checked={form.ativo}
                                                onCheckedChange={(val) =>
                                                    setForm((prev) => ({ ...prev, ativo: val }))
                                                }
                                            />
                                            <Label>Receita ativa (visível no app)</Label>
                                        </div>
                                    </div>

                                    <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        {editingId ? "Salvar Alterações" : "Criar Receita"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Lista de Receitas */}
                    <div className="grid gap-4">
                        {receitas.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <ChefHat className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
                                    <p className="text-muted-foreground mt-4">
                                        Nenhuma receita cadastrada ainda.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            receitas.map((receita) => (
                                <Card
                                    key={receita.id}
                                    className={`transition-all ${!receita.ativo ? "opacity-60" : ""}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Thumbnail */}
                                            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {receita.imagem_url ? (
                                                    <img
                                                        src={receita.imagem_url}
                                                        alt={receita.titulo}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-lg">{receita.titulo}</h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={getDifficultyColor(receita.dificuldade)}
                                                    >
                                                        {receita.dificuldade}
                                                    </Badge>
                                                    <Badge variant="secondary">{receita.categoria}</Badge>
                                                    {!receita.ativo && (
                                                        <Badge variant="outline" className="bg-gray-100">
                                                            <EyeOff className="w-3 h-3 mr-1" /> Oculta
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {receita.descricao || "Sem descrição"}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" /> {receita.tempo_preparo}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Flame className="w-4 h-4" /> {receita.calorias} kcal
                                                    </span>
                                                    {receita.pdf_url && (
                                                        <a
                                                            href={receita.pdf_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <FileText className="w-4 h-4" /> PDF
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={receita.ativo}
                                                    onCheckedChange={() =>
                                                        toggleAtivoReceita(receita.id, receita.ativo)
                                                    }
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(receita)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(receita.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* TAB VITRINE */}
                <TabsContent value="vitrine" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="w-5 h-5" />
                                Produtos na Vitrine do App
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Marque os produtos que devem aparecer na aba "Ofertas" do aplicativo mobile.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                {produtos.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhum produto cadastrado no sistema.
                                    </p>
                                ) : (
                                    produtos.map((produto) => (
                                        <div
                                            key={produto.id}
                                            className={`flex items-center justify-between p-3 border rounded-lg transition-all ${produto.em_vitrine
                                                    ? "bg-green-50 border-green-200"
                                                    : "bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {produto.imagem_url ? (
                                                        <img
                                                            src={produto.imagem_url}
                                                            alt={produto.nome}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Store className="w-6 h-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{produto.nome}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {produto.categoria} • R${" "}
                                                        {produto.preco_oferta || produto.preco_venda}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {produto.em_vitrine && (
                                                    <Badge className="bg-green-600">
                                                        <Eye className="w-3 h-3 mr-1" /> Visível
                                                    </Badge>
                                                )}
                                                <Switch
                                                    checked={produto.em_vitrine}
                                                    onCheckedChange={() =>
                                                        toggleVitrineQualquer(produto.id, produto.em_vitrine)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
