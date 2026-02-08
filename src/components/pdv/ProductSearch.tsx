import { Search, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePDVStore } from '@/store/pdvStore';

export function ProductSearch() {
  const { searchQuery, setSearchQuery } = usePDVStore();

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar produto por nome ou código de barras... (F1)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-12 pr-12 h-14 text-lg bg-card border-2 border-border focus:border-primary rounded-xl shadow-sm"
      />
      <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    </div>
  );
}
