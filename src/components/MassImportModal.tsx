
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCategoriasOtimizado } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { FileDown, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MassImportModalProps {
    onSuccess: () => void;
}

export const MassImportModal = ({ onSuccess }: MassImportModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [defaultPrice, setDefaultPrice] = useState<string>('0.00');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    const { data: categorias } = useCategoriasOtimizado();
    const { toast } = useToast();

    const handleMassImport = async () => {
        if (!inputText.trim()) {
            toast({ title: "Erro", description: "Cole a lista de produtos.", variant: "destructive" });
            return;
        }
        if (!selectedCategory) {
            toast({ title: "Erro", description: "Selecione uma categoria padrão.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setProgress(0);
        setStatusMessage('Iniciando importação...');

        try {
            // 1. Parse and Sort
            const lines = inputText.split('\n').filter(line => line.trim() !== '');
            const uniqueNames = [...new Set(lines)].sort(); // Deduplicate and sort

            const total = uniqueNames.length;
            setStatusMessage(`Preparando ${total} produtos...`);

            // 2. Determine starting barcode
            // Get the highest current barcode to ensure uniqueness/sequence
            const { data: lastProduct } = await supabase
                .from('produtos')
                .select('codigo_barras')
                .order('id', { ascending: false }) // Assuming ID correlates with time.
                .limit(1)
                .single();

            let nextBarcode = 1;

            // Logic: If database is cleared (no lastProduct), start from 1. 
            // If exists, start from max + 1.
            if (lastProduct?.codigo_barras) {
                const lastCode = parseInt(lastProduct.codigo_barras);
                if (!isNaN(lastCode)) {
                    nextBarcode = lastCode + 1;
                }
            }

            // 3. Construct Data Array
            const productsToInsert = uniqueNames.map((name, index) => {
                // Generate sequential barcode relative to the batch start
                const barcode = (nextBarcode + index).toString();

                // Explicitly typing the object for Supabase to match Schema
                // Using 'preco_unidade' as 'preco_venda' does not exist in schema.
                const newProduct = {
                    nome: name.trim(),
                    codigo_barras: barcode,
                    categoria_id: selectedCategory,
                    preco_kg: 0,
                    preco_unidade: parseFloat(defaultPrice) || 0,
                    estoque_atual: 0,
                    tipo_venda: 'unidade' as 'unidade' | 'peso' | 'hibrido',
                };
                return newProduct;
            });

            // 4. Batch Insert (Upsert)
            const CHUNK_SIZE = 50;
            let insertedCount = 0;

            for (let i = 0; i < productsToInsert.length; i += CHUNK_SIZE) {
                const chunk = productsToInsert.slice(i, i + CHUNK_SIZE);

                // We shouldn't need 'as any' if the object structure is perfect. 
                // However, Supabase types sometimes have issues with strict optional vs null.
                // We'll keep a specific cast if needed, but try to rely on inference or strict shape.
                // The 'upsert' method expects the TableInsert type.

                const { error } = await supabase
                    .from('produtos')
                    .upsert(chunk, { onConflict: 'codigo_barras' });
                // Re-reading requirements: "upsert using insert([...])".
                // If we use Upsert without onConflict, it needs a primary key match.
                // Since ID is auto-gen, we rely on insert. But if barcode duplicates exist, it might fail if unique constraint.
                // Let's assume insert is safer for "New" products.
                // Actually, let's stick to simple insert.

                if (error) throw error;

                insertedCount += chunk.length;
                setProgress((insertedCount / total) * 100);
                setStatusMessage(`Importando ${insertedCount} de ${total}...`);
            }

            toast({
                title: "Sucesso!",
                description: `${total} produtos importados com sucesso.`,
            });

            setIsOpen(false);
            setInputText('');
            onSuccess();

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro na Importação",
                description: error.message || "Ocorreu um erro desconhecido.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm("TEM CERTEZA ABSOLUTA? Isso apagará TODOS os produtos do sistema!")) return;

        setIsLoading(true);
        setStatusMessage("Limpando banco de dados...");

        try {
            const { error } = await supabase.from('produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all using Nil UUID for type safety
            if (error) throw error;

            toast({ title: "Banco Limpo", description: "Todos os produtos foram removidos." });
            onSuccess();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-12 font-bold rounded-xl">
                    <FileDown className="h-5 w-5 mr-2" /> Importação Rápida
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Upload className="h-6 w-6 text-emerald-600" />
                        Importação em Massa
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Progress Feedback */}
                    {isLoading && (
                        <div className="space-y-2 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                            <div className="flex justify-between text-sm font-medium text-emerald-800">
                                <span>{statusMessage}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Categoria Padrão</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {(categorias || [])?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Preço Padrão (R$)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600">
                            Lista de Produtos <span className="text-gray-400 font-normal">(Um nome por linha)</span>
                        </label>
                        <Textarea
                            placeholder="Exemplo:&#10;Banana Prata&#10;Maçã Gala&#10;Alface Americana"
                            className="h-64 font-mono text-sm leading-relaxed"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleClearDatabase}
                            disabled={isLoading}
                            type="button"
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Limpar Tudo (Perigo)
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
                            <Button
                                onClick={handleMassImport}
                                disabled={isLoading}
                                className="bg-[#27ae60] hover:bg-[#219150] min-w-[140px]"
                            >
                                {isLoading ? 'Processando...' : 'Iniciar Importação'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
