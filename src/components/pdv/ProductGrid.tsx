import { useProdutosOffline } from '@/hooks/useProdutosOffline';
import { usePDVStore } from '@/store/pdvStore';
import { ProductCard } from './ProductCard';
import { Produto } from '@/types/pdv';
import { Package, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductGridProps {
  onProductSelect: (produto: Produto) => void;
}

export function ProductGrid({ onProductSelect }: ProductGridProps) {
  const { searchQuery, selectedCategory, selectedProduct } = usePDVStore();
  const { data: produtos, isLoading, error } = useProdutosOffline(searchQuery, selectedCategory);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <Package className="h-12 w-12" />
          <p>Erro ao carregar produtos</p>
        </div>
      </div>
    );
  }

  if (!produtos || produtos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p>Nenhum produto encontrado</p>
          {searchQuery && (
            <p className="text-sm">
              Tente buscar por outro termo
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
        {produtos.map((produto) => (
          <ProductCard
            key={produto.id}
            produto={produto}
            onSelect={onProductSelect}
            isSelected={selectedProduct?.id === produto.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
