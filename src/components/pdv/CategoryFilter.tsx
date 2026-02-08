import { useCategoriasOffline } from '@/hooks/useProdutosOffline';
import { usePDVStore } from '@/store/pdvStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Apple, Carrot, Leaf, Package, Sparkles } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  frutas: <Apple className="h-4 w-4" />,
  verduras: <Leaf className="h-4 w-4" />,
  legumes: <Carrot className="h-4 w-4" />,
  organicos: <Sparkles className="h-4 w-4" />,
  default: <Package className="h-4 w-4" />,
};

export function CategoryFilter() {
  const { data: categorias, isLoading } = useCategoriasOffline();
  const { selectedCategory, setSelectedCategory } = usePDVStore();

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 py-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`pdv-category-pill ${!selectedCategory ? 'active' : ''}`}
        >
          <Package className="h-4 w-4" />
          <span>Todos</span>
        </button>
        
        {categorias?.map((categoria) => {
          const iconKey = categoria.nome.toLowerCase();
          const icon = categoryIcons[iconKey] || categoryIcons.default;
          
          return (
            <button
              key={categoria.id}
              onClick={() => setSelectedCategory(categoria.id)}
              className={`pdv-category-pill ${selectedCategory === categoria.id ? 'active' : ''}`}
              style={selectedCategory === categoria.id ? {} : { 
                '--category-color': categoria.cor || 'hsl(var(--primary))' 
              } as React.CSSProperties}
            >
              {icon}
              <span>{categoria.nome}</span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
