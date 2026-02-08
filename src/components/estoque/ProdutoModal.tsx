// @ts-nocheck
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Produto, TipoVenda } from '@/types/pdv';
import { useCategoriasOtimizado } from '@/hooks/useSupabaseData';
import { useCriarProduto, useAtualizarProduto } from '@/hooks/useSupabaseData';
import { Loader2, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';

const produtoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  codigo_barras: z.string().optional(),
  categoria_id: z.string().optional(),
  tipo_venda: z.enum(['peso', 'unidade', 'hibrido']),
  preco_kg: z.number().min(0).optional(),
  preco_unidade: z.number().min(0).optional(),
  estoque_atual: z.number().min(0),
  estoque_minimo: z.number().min(0),
  perecivel: z.boolean(),
  ativo: z.boolean(),
  imagem_url: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProdutoModal({ produto, isOpen, onClose }: ProdutoModalProps) {
  const { data: categorias } = useCategoriasOtimizado();
  const criarProduto = useCriarProduto();
  const atualizarProduto = useAtualizarProduto();

  const isEditing = !!produto;

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      codigo_barras: '',
      categoria_id: '',
      tipo_venda: 'unidade',
      preco_kg: 0,
      preco_unidade: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      perecivel: true,
      ativo: true,
      imagem_url: '',
    },
  });

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        codigo_barras: produto.codigo_barras || '',
        categoria_id: produto.categoria_id || '',
        tipo_venda: produto.tipo_venda,
        preco_kg: produto.preco_kg || 0,
        preco_unidade: produto.preco_unidade || 0,
        estoque_atual: produto.estoque_atual,
        estoque_minimo: produto.estoque_minimo,
        perecivel: produto.perecivel,
        ativo: produto.ativo,
        imagem_url: produto.imagem_url || '',
      });
    } else {
      form.reset({
        nome: '',
        codigo_barras: '',
        categoria_id: '',
        tipo_venda: 'unidade',
        preco_kg: 0,
        preco_unidade: 0,
        estoque_atual: 0,
        estoque_minimo: 0,
        perecivel: true,
        ativo: true,
        imagem_url: '',
      });
    }
  }, [produto, form]);

  const tipoVenda = form.watch('tipo_venda');

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      const payload = {
        ...data,
        categoria_id: data.categoria_id || null,
        codigo_barras: data.codigo_barras ? data.codigo_barras.trim() : null,
        preco_kg: data.tipo_venda === 'peso' || data.tipo_venda === 'hibrido' ? data.preco_kg : null,
        preco_unidade: data.tipo_venda === 'unidade' || data.tipo_venda === 'hibrido' ? data.preco_unidade : null,
      };

      const dadosParaSalvar = { ...payload } as any;

      if (isEditing && produto) {
        await atualizarProduto.mutateAsync({ id: produto.id, ...dadosParaSalvar, produto: dadosParaSalvar }); // Note: useAtualizarProduto expects {id, produto}
      } else {
        await criarProduto.mutateAsync(dadosParaSalvar);
      }

      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');

      onClose();
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error(error);
    }
  };

  const isPending = criarProduto.isPending || atualizarProduto.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-primary" />
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Faça alterações nos detalhes do produto abaixo. Clique em salvar quando terminar.'
              : 'Preencha os detalhes do novo produto. Clique em salvar quando terminar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna da Esquerda: Dados Básicos */}
            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  {...form.register('nome')}
                  placeholder="Ex: Banana Prata"
                />
                {form.formState.errors.nome && (
                  <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
                )}
              </div>

              {/* Código de Barras */}
              <div className="space-y-2">
                <Label htmlFor="codigo_barras">Código de Barras</Label>
                <Input
                  id="codigo_barras"
                  {...form.register('codigo_barras')}
                  placeholder="Ex: 1, 101, BANANA"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.watch('categoria_id') || ''}
                  onValueChange={(value) => form.setValue('categoria_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Venda */}
              <div className="space-y-2">
                <Label>Tipo de Venda *</Label>
                <Select
                  value={form.watch('tipo_venda')}
                  onValueChange={(value) => form.setValue('tipo_venda', value as TipoVenda)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peso">Por Peso (kg)</SelectItem>
                    <SelectItem value="unidade">Por Unidade</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coluna da Direita: Imagem e Estoque */}
            <div className="space-y-4">
              {/* Imagem */}
              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <Controller
                  control={form.control}
                  name="imagem_url"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Preços */}
            {(tipoVenda === 'peso' || tipoVenda === 'hibrido') && (
              <div className="space-y-2">
                <Label htmlFor="preco_kg">Preço por kg (R$)</Label>
                <Input
                  id="preco_kg"
                  type="number"
                  step="0.01"
                  {...form.register('preco_kg', { valueAsNumber: true })}
                />
              </div>
            )}

            {(tipoVenda === 'unidade' || tipoVenda === 'hibrido') && (
              <div className="space-y-2">
                <Label htmlFor="preco_unidade">Preço unitário (R$)</Label>
                <Input
                  id="preco_unidade"
                  type="number"
                  step="0.01"
                  {...form.register('preco_unidade', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Estoque e Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input
                  id="estoque_atual"
                  type="number"
                  step="0.001"
                  {...form.register('estoque_atual', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  step="0.001"
                  {...form.register('estoque_minimo', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4 p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="perecivel"
                  checked={form.watch('perecivel')}
                  onCheckedChange={(checked) => form.setValue('perecivel', checked)}
                />
                <Label htmlFor="perecivel" className="cursor-pointer">Produto Perecível</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={form.watch('ativo')}
                  onCheckedChange={(checked) => form.setValue('ativo', checked)}
                />
                <Label htmlFor="ativo" className="cursor-pointer">Produto Ativo</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Produto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
