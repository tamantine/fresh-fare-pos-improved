import { useState, useMemo } from 'react';
import { Produto } from '@/types/pdv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  History, 
  ArrowUpDown,
  Scale,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ProdutoModal } from './ProdutoModal';
import { AjusteEstoqueModal } from './AjusteEstoqueModal';
import { MovimentacoesModal } from './MovimentacoesModal';

interface ProdutoTableProps {
  produtos: Produto[];
  isLoading: boolean;
}

export function ProdutoTable({ produtos, isLoading }: ProdutoTableProps) {
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [isMovimentacoesModalOpen, setIsMovimentacoesModalOpen] = useState(false);

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsProdutoModalOpen(true);
  };

  const handleAjuste = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsAjusteModalOpen(true);
  };

  const handleHistorico = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsMovimentacoesModalOpen(true);
  };

  const getStockStatus = useMemo(() => {
    return (produto: Produto) => {
      if (produto.estoque_atual <= 0) {
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Sem estoque' };
      }
      if (produto.estoque_atual <= produto.estoque_minimo) {
        return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Baixo' };
      }
      return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'OK' };
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-8 text-center text-muted-foreground">
          Carregando produtos...
        </div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou adicione um novo produto
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => {
              const status = getStockStatus(produto);
              const StatusIcon = status.icon;
              const preco = produto.tipo_venda === 'peso' ? produto.preco_kg : produto.preco_unidade;
              const unidade = produto.tipo_venda === 'peso' ? '/kg' : '/un';
              
              return (
                <TableRow key={produto.id} className="group">
                  <TableCell>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      produto.tipo_venda === 'peso' ? 'bg-primary/10' : 'bg-accent/10'
                    }`}>
                      {produto.tipo_venda === 'peso' ? (
                        <Scale className="h-5 w-5 text-primary" />
                      ) : (
                        <Package className="h-5 w-5 text-accent" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      {produto.codigo_barras && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {produto.codigo_barras}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {produto.categoria ? (
                      <Badge variant="secondary">{produto.categoria.nome}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm capitalize">{produto.tipo_venda}</span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <span className="font-price font-semibold">
                      R$ {preco?.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground text-sm">{unidade}</span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div>
                      <span className="font-mono font-semibold">
                        {produto.estoque_atual.toFixed(produto.tipo_venda === 'peso' ? 3 : 0)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Mín: {produto.estoque_minimo.toFixed(produto.tipo_venda === 'peso' ? 3 : 0)}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(produto)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAjuste(produto)}>
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          Ajustar Estoque
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHistorico(produto)}>
                          <History className="h-4 w-4 mr-2" />
                          Histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ProdutoModal
        produto={selectedProduto}
        isOpen={isProdutoModalOpen}
        onClose={() => {
          setIsProdutoModalOpen(false);
          setSelectedProduto(null);
        }}
      />

      <AjusteEstoqueModal
        produto={selectedProduto}
        isOpen={isAjusteModalOpen}
        onClose={() => {
          setIsAjusteModalOpen(false);
          setSelectedProduto(null);
        }}
      />

      <MovimentacoesModal
        produto={selectedProduto}
        isOpen={isMovimentacoesModalOpen}
        onClose={() => {
          setIsMovimentacoesModalOpen(false);
          setSelectedProduto(null);
        }}
      />
    </>
  );
}
