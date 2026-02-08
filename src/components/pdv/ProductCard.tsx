import { Produto } from '@/types/pdv';
import { Scale, Package, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  produto: Produto;
  onSelect: (produto: Produto) => void;
  isSelected?: boolean;
}

export function ProductCard({ produto, onSelect, isSelected }: ProductCardProps) {
  const preco = produto.tipo_venda === 'peso' 
    ? produto.preco_kg 
    : produto.preco_unidade;
  
  const unidade = produto.tipo_venda === 'peso' ? '/kg' : '/un';
  const isLowStock = produto.estoque_atual <= produto.estoque_minimo;

  return (
    <button
      onClick={() => onSelect(produto)}
      className={`pdv-product-card group w-full text-left animate-scale-in ${isSelected ? 'selected' : ''}`}
    >
      {/* Product Image with Enhanced Overlay */}
      <div className="relative aspect-square mb-4 rounded-xl bg-gradient-to-br from-secondary to-muted overflow-hidden">
        {produto.imagem_url ? (
          <>
            <img 
              src={produto.imagem_url} 
              alt={produto.nome}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {produto.tipo_venda === 'peso' ? (
              <Scale className="h-16 w-16 text-muted-foreground/40 transition-all duration-300 group-hover:scale-110 group-hover:text-primary/60" />
            ) : (
              <Package className="h-16 w-16 text-muted-foreground/40 transition-all duration-300 group-hover:scale-110 group-hover:text-primary/60" />
            )}
            
            {/* Animated Background Circle */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity duration-300">
              <div className="w-24 h-24 rounded-full bg-primary animate-pulse-scale" />
            </div>
          </div>
        )}
        
        {/* Type Badge with Enhanced Design */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 text-xs font-semibold backdrop-blur-sm bg-card/95 border-2 border-card-border shadow-lg transition-all duration-200 group-hover:scale-105"
        >
          {produto.tipo_venda === 'peso' ? (
            <><Scale className="h-3 w-3 mr-1" /> Peso</>
          ) : (
            <><Package className="h-3 w-3 mr-1" /> Unidade</>
          )}
        </Badge>
        
        {/* Low Stock Warning with Animation */}
        {isLowStock && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-warning/95 backdrop-blur-sm text-warning-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg animate-pulse border-2 border-warning">
            <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
            <span>Estoque baixo</span>
          </div>
        )}

        {/* Hover Overlay with Add Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary/10 backdrop-blur-sm">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-glow-md transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>
      
      {/* Product Info with Enhanced Typography */}
      <div className="space-y-2">
        <h3 className="font-bold text-foreground line-clamp-2 leading-tight text-base group-hover:text-primary transition-colors duration-200">
          {produto.nome}
        </h3>
        
        {produto.codigo_barras && (
          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
            {produto.codigo_barras}
          </p>
        )}
        
        {/* Price Section with Enhanced Design */}
        <div className="flex items-baseline gap-1.5 pt-2">
          <span className="text-sm text-muted-foreground font-medium">R$</span>
          <span className="text-3xl font-bold font-price text-primary group-hover:text-primary-hover transition-colors duration-200">
            {preco?.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-muted-foreground font-semibold ml-0.5">
            {unidade}
          </span>
        </div>

        {/* Stock Indicator Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium">Estoque</span>
            <span className="font-bold">{produto.estoque_atual} un.</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isLowStock ? 'bg-warning' : 'bg-success'
              }`}
              style={{ 
                width: `${Math.min((produto.estoque_atual / (produto.estoque_minimo * 3)) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full p-2 shadow-glow-md animate-scale-in">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}
