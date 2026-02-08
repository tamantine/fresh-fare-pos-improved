import { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Image as ImageIcon,
  Filter,
  Download
} from 'lucide-react';
import { ScaleExport } from '@/utils/scaleExport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProdutosOtimizado, useCategoriasOtimizado } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MassImportModal } from '@/components/MassImportModal';
import { ProdutoModal } from '@/components/estoque/ProdutoModal';

const Estoque = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: produtosResponse, refetch } = useProdutosOtimizado({ busca });
  const produtos = Array.isArray(produtosResponse?.data) ? produtosResponse.data : [];
  const { data: categorias } = useCategoriasOtimizado();


  // handleSave movido para ProdutoModal

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Produto excluído!" });
      refetch();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleExportScales = async () => {
    try {
      toast({ title: "Gerando Arquivo", description: "Buscando produtos de peso..." });
      // Busca todos os produtos ativos (sem paginação idealmente, ou aumentar limite)
      // Aqui vamos buscar até 1000 produtos de peso
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        // .eq('tipo_venda', 'peso') // Toledo aceita unitários também (como unitário), mas geralmente exportamos tudo que for pertinente.
        // Se quiser exportar SÓ peso:
        // .eq('tipo_venda', 'peso')
        .limit(2000);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "Sem Produtos", description: "Nenhum produto encontrado para exportação.", variant: "destructive" });
        return;
      }

      const content = ScaleExport.generateToledoMGV(data as any[]);
      ScaleExport.downloadFile(content, "ITENS.TXT");

      toast({ title: "Sucesso", description: "Arquivo ITENS.TXT gerado com sucesso!" });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao gerar arquivo de balança.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800">Gestão de Estoque</h1>
            <p className="text-gray-500">Controle seus produtos e preços</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 border-gray-300 text-gray-600 hover:bg-gray-50" onClick={handleExportScales}>
            <Download className="mr-2 h-4 w-4" /> Exportar Balança (MGV)
          </Button>

          <MassImportModal onSuccess={refetch} />



          <Button
            className="bg-[#27ae60] hover:bg-[#219150] h-12 px-6 font-bold rounded-xl shadow-lg"
            onClick={() => {
              setEditingProduct(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-5 w-5 mr-2" /> Novo Produto
          </Button>

          <ProdutoModal
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingProduct(null);
              // refetch(); // React Query handles this automatically via cache invalidation
            }}
            produto={editingProduct}
          />
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código de barras..."
            className="pl-10 h-12 border-gray-200 rounded-xl"
          />
        </div>
        <Button variant="outline" className="h-12 rounded-xl px-6 border-gray-200">
          <Filter className="h-5 w-5 mr-2" /> Filtros
        </Button>
      </div>

      {/* Tabela de Produtos */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-black text-gray-400 uppercase">Produto</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase">Categoria</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase text-center">Tipo</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase text-right">Preço</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase text-center">Estoque</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(produtos || [])?.map((p: any) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                      {p.imagem_url ? (
                        <img src={p.imagem_url} className="w-full h-full object-cover" alt={p.nome} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{p.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.codigo_barras || 'SEM CÓDIGO'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-[#27ae60]/10 text-[#27ae60] text-xs font-bold">
                    {p.categorias?.nome || 'Geral'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {p.tipo_venda === 'peso' ? 'Kg' : 'Un'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <p className="font-bold text-gray-700">
                    R$ {(p.tipo_venda === 'peso' ? p.preco_kg : p.preco_unidade).toFixed(2)}
                  </p>
                </td>
                <td className="p-4 text-center">
                  <p className={`font-bold ${p.estoque_atual <= p.estoque_minimo ? 'text-red-500' : 'text-gray-600'}`}>
                    {p.estoque_atual}
                  </p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!produtos || produtos.length === 0) && (
          <div className="p-20 text-center text-gray-300">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estoque;
