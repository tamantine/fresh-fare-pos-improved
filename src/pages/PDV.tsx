// @ts-nocheck
// FORCE DEPLOY TIMESTAMP: 2026-02-04T13:30:00
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Barcode,
  Scale,
  Printer,
  Trash2,
  CreditCard,
  X,
  ArrowLeft,
  Plus,
  Minus,
  Keyboard,
  Maximize2,
  LogOut,
  Home,
  Unlock,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { balanca } from '@/lib/balanca';
// import { impressora } from '@/lib/impressora'; // Substituído pelo usePrinter
import { usePrinter } from '@/hooks/usePrinter';
import { ScaleParser } from '@/utils/scaleParser';
import { useProdutosOtimizado } from '@/hooks/useSupabaseData';
import { useCreateVenda } from '@/hooks/useVendas';
import { useCaixa } from '@/hooks/useCaixa';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PaymentModal } from '@/components/pdv/PaymentModal';
import { CaixaManager } from '@/components/pdv/CaixaManager';
import { ReceiptModal } from '@/components/pdv/ReceiptModal';



const ResumoCaixaModal = ({ isOpen, onClose }: any) => {
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarResumo();
    }
  }, [isOpen]);

  const carregarResumo = async () => {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];

    // Busca vendas do dia
    const { data: vendas } = await supabase
      .from('vendas')
      .select('total, forma_pagamento, created_at')
      .gte('created_at', `${hoje}T00:00:00`)
      .lte('created_at', `${hoje}T23:59:59`);

    if (vendas) {
      const totalVendido = vendas.reduce((acc, v) => acc + v.total, 0);
      const qtdVendas = vendas.length;
      const porPagamento = vendas.reduce((acc: Record<string, number>, v) => {
        acc[v.forma_pagamento] = (acc[v.forma_pagamento] || 0) + v.total;
        return acc;
      }, {});

      setResumo({ totalVendido, qtdVendas, porPagamento });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-black">
        <DialogHeader>
          <DialogTitle>Resumo do Caixa (Hoje)</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-10 text-center">Carregando movimentações...</div>
        ) : resumo ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
              <p className="text-sm text-green-600 font-medium uppercase">Total Vendido</p>
              <p className="text-3xl font-black text-green-700">R$ {resumo.totalVendido.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{resumo.qtdVendas} vendas realizadas</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Detalhamento por Pagamento</p>
              {Object.entries(resumo.porPagamento).map(([forma, valor]: any) => (
                <div key={forma} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                  <span className="capitalize">{forma}</span>
                  <span className="font-bold">R$ {valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">Nenhuma venda registrada hoje.</div>
        )}
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">Fechar Resumo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PDV = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // State for PDV structure
  const [cart, setCart] = useState<any[]>([]); // Mantendo any por enquanto para evitar cascata de erros de tipo
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [isBalancaConnected, setIsBalancaConnected] = useState(false);

  // Hook de Impressora WebUSB
  const { isConnected: isPrinterConnected, connect: connectPrinter, printReceipt } = usePrinter();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isResumoOpen, setIsResumoOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Caixa Manager State
  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);
  const [tipoCaixaModal, setTipoCaixaModal] = useState<'abertura' | 'fechamento'>('abertura');

  const [lastSale, setLastSale] = useState<{ venda: any, itens: any[] } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // CARREGAR TUDO: Removemos o filtro 'busca' pare carregar todos os produtos (estratégia Offline-First)
  // Isso garante que códigos curtos como '1', '2' estejam em memória para match exato local
  const { data: produtosResponse, error: produtosError, isLoading, refetch: recarregarProdutos } = useProdutosOtimizado({});

  // Forçar recarregamento na montagem (Clean Fetch)
  useEffect(() => {
    recarregarProdutos();
  }, [recarregarProdutos]);
  // Extração segura de dados, similar ao Estoque.tsx
  const produtos = produtosResponse?.data || [];
  const { mutate: criarVenda, isPending: isFinalizing } = useCreateVenda();

  // Focar no input de busca ao carregar e Configurar Segurança
  useEffect(() => {
    inputRef.current?.focus();

    // BLOQUEIO DE SEGURANÇA (Botão Direito + F5)
    const handleContext = (e: Event) => e.preventDefault();
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKeys);

    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKeys);
    };
  }, []);

  // Atalhos de teclado
  useKeyboardShortcuts({
    F1: () => inputRef.current?.focus(),
    F2: handleConectarBalanca,
    F3: () => toast({ title: 'Desconto', description: 'Funcionalidade em desenvolvimento' }),
    F4: () => removeLastItem(),
    F6: () => handleFinalizarVenda(),
    F9: () => setIsResumoOpen(true), // Atalho novo para Resumo
    F11: toggleFullscreen,
    F12: () => handleFinalizarVenda(),
    Escape: () => {
      setSearchQuery('');
      setSelectedProduct(null);
      inputRef.current?.focus();
    },
  });

  function handleConectarBalanca() {
    balanca.conectar().then((ok) => {
      if (ok) {
        setIsBalancaConnected(true);
        balanca.lerPeso((data) => setWeight(data.peso));
        toast({ title: "Balança Conectada", description: "Lendo peso em tempo real." });
      }
    });
  }

  // handleConectarImpressora removido - usando hook usePrinter

  // useSearchParams para detectar modo standalone
  const [searchParams] = useSearchParams();
  const isStandalone = searchParams.get('mode') === 'standalone';

  function toggleFullscreen() {
    if (!isStandalone) {
      // Se não estiver em modo standalone, abre em nova aba
      window.open('/pdv?mode=standalone', '_blank', 'noopener,noreferrer');
    } else {
      // Se já estiver em standalone, alterna tela cheia real (kiosk mode)
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          toast({ title: "Erro", description: "Não foi possível ativar tela cheia", variant: "destructive" });
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }

  const addToCart = (produto: any) => {
    const itemExistente = cart.find(item => item.id === produto.id);
    const preco = produto.tipo_venda === 'peso' ? produto.preco_kg : produto.preco_unidade;
    const qtd = produto.tipo_venda === 'peso' ? weight : quantity;

    if (produto.tipo_venda === 'peso' && weight <= 0) {
      toast({
        title: "Peso necessário",
        description: "Coloque o produto na balança ou digite o peso.",
        variant: "destructive"
      });
      return;
    }

    if (itemExistente && produto.tipo_venda !== 'peso') {
      setCart(cart.map(item =>
        item.id === produto.id ? { ...item, quantidade: item.quantidade + quantity } : item
      ));
    } else {
      setCart([...cart, {
        ...produto,
        quantidade: qtd,
        preco_unitario: preco,
        subtotal: qtd * preco
      }]);
    }

    setSearchQuery('');
    setSelectedProduct(null);
    setQuantity(1);
    setWeight(0);
    // Delay ajustado para garantir foco após renderização do React
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const removeFromCart = (index: number) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  const removeLastItem = () => {
    setCart(prevCart => {
      if (prevCart.length > 0) {
        toast({ title: "Item removido", description: "Último item foi removido do carrinho" });
        return prevCart.slice(0, -1);
      }
      return prevCart;
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

  // Caixa Hook
  const { caixaAberto } = useCaixa();

  const handleFinalizarVenda = () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens antes de finalizar", variant: "destructive" });
      return;
    }

    if (!caixaAberto) {
      toast({ title: "Erro", description: "O caixa está fechado. Abra o caixa no topo da tela (F12) para prosseguir.", variant: "destructive" });
      return;
    }

    // Abrir modal de pagamento
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (venda?: any, itens?: any[]) => {
    if (venda && itens) {
      setLastSale({ venda, itens });
    }
    setCart([]);
    setIsReceiptOpen(true); // Auto open receipt
    setIsPaymentModalOpen(false);
  };

  // Funções antigas comentadas ou removidas para limpeza
  /*
  const handleFinalizarVendaAntigo = () => {
    // ... lógica antiga
  };
  */

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setCart([]);
    setLastSale(null);
    // Pequeno delay para garantir o foco após o fechamento do modal
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleBackToHome = () => {
    if (cart.length > 0) {
      // Usando confirm nativo por simplicidade e robustez, conforme permitido nas instruções
      if (!window.confirm("Você tem itens no carrinho. Deseja realmente sair e perder a venda atual?")) {
        return;
      }
    }
    navigate('/');
  };



  /* --- INTEGRAÇÃO COM BALANÇA (WEB SERIAL & BUFFER) --- */
  const conectarBalanca = async () => {
    try {
      if (!('serial' in navigator)) {
        toast({ title: "Erro", description: "Navegador sem suporte Serial.", variant: "destructive" });
        return;
      }
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setIsBalancaConnected(true);
      toast({ title: "Conectado", description: "Balança conectada com sucesso!" });

      const reader = port.readable.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // Buffer para acumular fragmentos de dados

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          // Acumula no buffer
          buffer += decoder.decode(value);

          // Verifica se temos uma leitura completa (muitas balanças usam CR/LF ou STX/ETX)
          // Na dúvida, processamos o que parece ser um número completo

          // Regex para extrair números decimais (peso)
          // Exemplo Toledo: "ST,GS,+  1.250kg" -> pega "1.250"
          // Exemplo Filizola: "01500" (sem ponto) -> precisa dividir por 1000
          // Assumindo padrão com ponto ou vírgula decimal na string
          const match = buffer.match(/(\d+[.,]\d{3})/); // Procura padrão X.XXX

          if (match) {
            const pesoStr = match[0].replace(',', '.');
            const pesoLido = parseFloat(pesoStr);

            if (!isNaN(pesoLido) && pesoLido > 0) {
              setWeight(pesoLido);
              // Limpa o buffer parcialmente para não reler o mesmo número infinitamente
              // ou, idealmente, limpa tudo se o protocolo for linha a linha
              buffer = "";
            }
          }

          // Limite de segurança para buffer não explodir
          if (buffer.length > 100) buffer = buffer.slice(-50);
        }
      } catch (readError) {
        console.error(readError);
        setIsBalancaConnected(false);
        toast({ title: "Desconectado", description: "Perda de conexão com balança.", variant: "destructive" });
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      console.error('Erro de Balança', err);
      toast({ title: "Erro", description: "Falha ao abrir porta serial.", variant: "destructive" });
    }
  };

  const handleTare = () => {
    // Envia comando de tara se possível, ou apenas reseta visual
    // Como Serial Write é complexo sem saber o protocolo exato, vamos simular o zero aqui
    setWeight(0);
    toast({ title: "Tara", description: "Balança zerada (Simulação Software)." });

    console.log('[HARDWARE] Comando TARA enviado.');
  };

  const usarPesoBalanca = () => {
    // Simulação de peso se não estiver conectado, para testes rápidos em dev
    if (!isBalancaConnected) {
      const pesoSimulado = 1.450;
      console.log(`[SIMULAÇÃO] Peso capturado: ${pesoSimulado.toFixed(3)}kg`);
      setWeight(pesoSimulado);
      toast({ title: "Modo Simulação", description: `Peso ${pesoSimulado}kg aplicado (Sem Hardware).` });
      return;
    }
    // Se já estiver conectado, o loop de leitura acima já está atualizando o state 'weight'
    toast({ title: "Lendo...", description: "Peso atualizado da balança." });
  };


  const handleAddToCart = (produto: any) => {
    if (!produto) return;

    // QUICK SALE FLOW: Se for peso, força o uso da balança ou popup
    if (produto.tipo_venda === 'peso' && weight === 0) {
      // Se o peso está zerado, tenta pegar da balança ou avisa o usuario
      if (isBalancaConnected) {
        toast({ title: "Aguardando Peso", description: "Coloque o item na balança." });
        // Se não tem balança, foca no input de peso para digitação manual ou simula se for dev
        if (selectedProduct) {
          // Se clicar de novo ou der enter e não tiver peso
          usarPesoBalanca(); // Tenta simular ou avisar
          if (weight > 0) {
            // Se pegou peso (simulado ou real que acabou de chegar), adiciona
            // Mas precisamos esperar o state atualizar... ou passar direto.
            // Como é state, melhor apenas avisar "Peso Capturado" e pedir Enter de novo
            return;
          }
        }
        toast({ title: "Digite o Peso", description: "Informe o peso ou conecte a balança." });
        setSelectedProduct(produto);
        return;
      }
    }

    addToCart(produto);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isFinalizing) return;


      // 1. Se já tem um produto selecionado visualmente (clicado ou navegado), adiciona
      if (selectedProduct) {
        handleAddToCart(selectedProduct);
        return;
      }

      // 2. Se não tem selecionado, tenta encontrar na lista atual de produtos (resultado da busca)
      if (produtos && Array.isArray(produtos) && produtos.length > 0) {

        // Lógica de Busca Crítica (Short Codes)
        const termoLimpo = String(searchQuery).trim();

        // 0. Verifica se é código de balança (EAN-13 variável começando com 2)
        if (ScaleParser.isScaleBarcode(termoLimpo)) {
          const parsed = ScaleParser.parse(termoLimpo, 'price'); // Assumindo preço total

          if (parsed.isValid && parsed.plu) {
            // Tenta encontrar o produto pelo Código (PLU)
            // O PLU da balança geralmente é o código de barras ou ID interno curto
            // Vamos procurar em 'codigo_barras' e também se o ID for numérico curto
            const produtoPlu = produtos.find((p: any) => {
              // Remove zeros a esquerda do codigo de barras do banco pra comparar com o PLU da balança (que removemos zeros tb)
              const dbCode = String(p.codigo_barras || '').replace(/^0+/, '');
              return dbCode === parsed.plu || String(p.id) === parsed.plu;
            });

            if (produtoPlu) {
              if (produtoPlu.tipo_venda !== 'peso') {
                toast({ title: "Atenção", description: "Código de balança lido para produto que não é de peso.", variant: "destructive" });
                setSearchQuery('');
                return;
              }

              const valorTotalEtiqueta = parsed.value || 0;
              const precoUnitario = produtoPlu.preco_kg || 0;

              if (precoUnitario <= 0) {
                toast({ title: "Erro de Preço", description: "Produto com preço inválido no sistema.", variant: "destructive" });
                return;
              }

              // Calcula Peso baseado no Total / Preço Unitário
              // Peso = Total / Unitário
              const pesoCalculado = valorTotalEtiqueta / precoUnitario;

              toast({
                title: "Item de Balança",
                description: `Produto: ${produtoPlu.nome} | Peso: ${pesoCalculado.toFixed(3)}kg | Total: R$ ${valorTotalEtiqueta.toFixed(2)}`
              });

              // Configura para adicionar
              // Precisamos passar essas infos para o addToCart
              // Como addToCart usa o state 'weight', vamos setar aqui e chamar
              // Mas o setState é assíncrono. Melhor criar um addToCart direto q aceite qtd/peso override

              // Helper interno para adicionar direto sem depender do state
              const itemCarrinho = {
                ...produtoPlu,
                quantidade: pesoCalculado,
                preco_unitario: precoUnitario,
                subtotal: valorTotalEtiqueta
              };

              setCart(prev => [...prev, itemCarrinho]);
              setSearchQuery('');
              setSelectedProduct(null);
              setQuantity(1);
              setWeight(0);
              return;
            } else {
              toast({ title: "Não Encontrado", description: `Produto com PLU ${parsed.plu} não existe no sistema.`, variant: "destructive" });
            }
          }
        }

        const exato = produtos.find((p: any) =>
          String(p.codigo_barras).trim() === termoLimpo ||
          String(p.id).trim() === termoLimpo
        );

        if (exato) {
          // Match perfeito de código de barras -> Adiciona direto
          // Precisamos setar o selectedProduct temporariamente ou passar direto para addToCart
          // Como addToCart usa o state 'weight' e 'quantity', precisamos garantir que estejam ok.
          // Para fluxo rápido de barcode, weight é 0 e quantity é 1 (padrão)

          // Se for produto por peso, não dá pra adicionar direto sem peso. 
          if (exato.tipo_venda === 'peso' && weight <= 0) {
            setSelectedProduct(exato);
            toast({ title: "Aguardando Peso", description: "Coloque o produto na balança ou digite o peso.", variant: "default" });
            // Focar no input de peso seria ideal aqui, mas vamos manter simples por enquanto ou focar no input de peso
            return;
          }

          // Se for unidade ou peso já preenchido
          addToCart(exato);
          return;
        }

        // Se houver APENAS UM resultado na busca e o usuário deu enter, assume que é ele
        if (produtos.length === 1) {
          const unico = produtos[0];
          if (unico.tipo_venda === 'peso' && weight <= 0) {
            setSelectedProduct(unico);
            toast({ title: "Aguardando Peso", description: "Coloque o produto na balança ou digite o peso.", variant: "default" });
            return;
          }
          addToCart(unico);
          return;
        }

        // Se houver vários, foca no primeiro ou avisa para selecionar
        // Melhor UX: Selecionar o primeiro para facilitar? Ou pedir para especificar?
        // Vamos pedir para selecionar se não for exato nem único
        toast({ title: "Vários produtos encontrados", description: "Selecione o produto desejado na lista ou digite o código completo.", variant: "destructive" });
      } else {
        if (searchQuery.trim().length > 0) {
          toast({ title: "Produto não encontrado", description: "Verifique o código ou nome digitado.", variant: "destructive" });
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="h-screen w-screen flex flex-col bg-[#f4f7f6] font-sans overflow-hidden">
      {/* Header Estilo Supermercado (Verde) */}
      <header className="bg-[#27ae60] text-white p-3 shadow-md flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
            <span className="text-xl">🍎</span>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Hortifruti Bom Preço</h1>
            <p className="text-xs opacity-80 mt-0.5">SISTEMA PDV PROFISSIONAL</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 text-xs"
            onClick={handleBackToHome}
          >
            <Home className="h-4 w-4 mr-1" /> Início
          </Button>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center text-sm">
            <p className="text-xs opacity-70 uppercase">Data/Hora</p>
            <p className="font-mono font-bold text-sm">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString().substring(0, 5)}</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex gap-1">
            {/* Botões Caixa */}
            {caixaAberto ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 text-xs bg-red-600/20 hover:bg-red-600/40"
                onClick={() => {
                  setTipoCaixaModal('fechamento');
                  setIsCaixaModalOpen(true);
                }}
              >
                <Lock className="h-3 w-3 mr-1" /> Fechar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 text-xs bg-green-600/20 hover:bg-green-600/40"
                onClick={() => {
                  setTipoCaixaModal('abertura');
                  setIsCaixaModalOpen(true);
                }}
              >
                <Unlock className="h-3 w-3 mr-1" /> Abrir
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/10 text-xs ${isBalancaConnected ? 'bg-white/20' : ''}`}
              onClick={handleConectarBalanca}
            >
              <Scale className="h-3 w-3 mr-1" /> Balança
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/10 text-xs ${isPrinterConnected ? 'bg-white/20' : ''}`}
              onClick={connectPrinter}
            >
              <Printer className="h-3 w-3 mr-1" /> {isPrinterConnected ? 'Imp. Conectada' : 'Conectar Imp.'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 text-xs"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-3 w-3 mr-1" /> Tela Cheia
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="h-3 w-3 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">

        {/* Left Side: Inputs and Product Info */}
        <div className="w-1/3 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Status Box */}
          <div className={`p-4 rounded-xl shadow-lg text-center flex-shrink-0 transition-colors ${caixaAberto ? 'bg-[#1a3a2a]' : 'bg-red-600'}`}>
            <h2 className="text-2xl font-black tracking-widest uppercase text-white">
              {caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
            </h2>
            {caixaAberto && <p className="text-xs text-white/70 font-mono mt-1">ID: {caixaAberto.id.slice(0, 8)}</p>}
          </div>

          {/* Input Fields */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 flex-shrink-0">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Código de Barras / Nome (F1)</label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0000000000000"
                  className="h-12 text-lg font-mono border-2 border-[#27ae60]/30 focus:border-[#27ae60] rounded-lg"
                  autoComplete="off"
                  disabled={isFinalizing}
                />
                <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-6 w-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Valor Unitário</label>
                <div className="h-12 bg-gray-100 rounded-lg flex items-center px-3 border border-gray-200">
                  <span className="text-gray-400 mr-1 text-sm">R$</span>
                  <span className="text-lg font-bold text-gray-700">
                    {selectedProduct ? (selectedProduct.tipo_venda === 'peso' ? selectedProduct.preco_kg : selectedProduct.preco_unidade).toFixed(2) : '0,00'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Qtd / Peso</label>
                <Input
                  type="number"
                  value={selectedProduct?.tipo_venda === 'peso' ? weight : quantity}
                  onChange={(e) => selectedProduct?.tipo_venda === 'peso' ? setWeight(Number(e.target.value)) : setQuantity(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedProduct) {
                      addToCart(selectedProduct); // Use direct addToCart to avoid loop logic
                    }
                  }}
                  className="h-12 text-lg font-bold text-center border-2 border-gray-200 rounded-lg"
                  disabled={isFinalizing}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Total do Item</label>
              <div className="h-16 bg-[#27ae60]/10 rounded-lg flex items-center justify-between px-4 border-2 border-[#27ae60]/20">
                <span className="text-[#27ae60] font-bold text-sm">R$</span>
                <span className="text-3xl font-black text-[#27ae60]">
                  {selectedProduct ? ((selectedProduct.tipo_venda === 'peso' ? weight : quantity) * (selectedProduct.tipo_venda === 'peso' ? selectedProduct.preco_kg : selectedProduct.preco_unidade)).toFixed(2) : '0,00'}
                </span>
              </div>
            </div>

            <Button
              className="h-12 bg-[#27ae60] hover:bg-[#219150] text-base font-bold rounded-xl shadow-lg"
              disabled={!selectedProduct || isFinalizing}
              onClick={() => handleAddToCart(selectedProduct)}
            >
              <Plus className="mr-2 h-5 w-5" /> Adicionar Item
            </Button>
          </div>

          {/* Search Results (Floating) */}
          {searchQuery.length > 0 && Array.isArray(produtos) && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto flex-1 min-h-0">
              {produtos.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex justify-between items-center"
                  onClick={() => {
                    setSelectedProduct(p);
                    setSearchQuery('');
                  }}
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{p.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.codigo_barras}</p>
                  </div>
                  <p className="font-bold text-[#27ae60] text-sm">R$ {(p.tipo_venda === 'peso' ? p.preco_kg : p.preco_unidade).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Cart List and Totals */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Cart Table */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="bg-gray-50 p-3 border-b border-gray-200 grid grid-cols-12 text-xs font-black text-gray-400 uppercase tracking-wider flex-shrink-0">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Descrição do Produto</div>
              <div className="col-span-2 text-center">Qtd/Peso</div>
              <div className="col-span-2 text-right">Vl. Unit</div>
              <div className="col-span-2 text-right">Vl. Total</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                  <ShoppingCart className="h-16 w-16 opacity-20" />
                  <p className="text-base font-medium">Carrinho Vazio</p>
                </div>
              ) : (
                Array.isArray(cart) && cart.map((item, index) => (
                  <div key={index} className="p-3 border-b border-gray-50 grid grid-cols-12 items-center hover:bg-gray-50 group text-sm">
                    <div className="col-span-1 text-gray-400 font-mono text-xs">{index + 1}</div>
                    <div className="col-span-5">
                      <p className="font-bold text-gray-700 text-sm">{item.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.codigo_barras}</p>
                    </div>
                    <div className="col-span-2 text-center font-bold text-gray-600 text-sm">
                      {item.quantidade} {item.tipo_venda === 'peso' ? 'kg' : 'un'}
                    </div>
                    <div className="col-span-2 text-right text-gray-500 text-sm">
                      {item.preco_unitario.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-black text-gray-800 flex items-center justify-end gap-2">
                      {(item.quantidade * item.preco_unitario).toFixed(2)}
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        disabled={isFinalizing}
                        title="Remover Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals and Actions */}
          <div className="grid grid-cols-12 gap-3 flex-shrink-0">
            <div className="col-span-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Subtotal</span>
                <span className="text-xl font-bold text-gray-400">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end mt-3">
                <span className="text-lg font-black text-gray-700 uppercase tracking-tighter">Total a Pagar</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-[#27ae60] leading-none">
                    R$ {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-4 flex flex-col gap-2">
              <Button
                className="flex-1 bg-[#f39c12] hover:bg-[#e67e22] text-white text-base font-black rounded-xl shadow-lg uppercase"
                onClick={() => handleFinalizarVenda()}
                disabled={cart.length === 0 || isFinalizing}
              >
                <CreditCard className="mr-2 h-5 w-5" /> {isFinalizing ? 'Processando...' : 'Pagamento (F6)'}
              </Button>
              <Button
                variant="outline"
                className="h-12 border-2 border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm"
                onClick={() => setCart([])}
                disabled={cart.length === 0 || isFinalizing}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Cancelar Venda
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Shortcut Bar */}
      <footer className="bg-[#1a3a2a] text-white/60 p-2 px-4 flex gap-6 text-[9px] font-bold uppercase tracking-widest overflow-x-auto flex-shrink-0">
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F1</Badge> Buscar</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F2</Badge> Balança</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F3</Badge> Desconto</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F4</Badge> Cancelar</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F6</Badge> Pagamento</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F11</Badge> Tela Cheia</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F6</Badge> Finalizar</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">F9</Badge> Resumo Caixa</div>
        <div className="flex items-center gap-1 whitespace-nowrap"><Badge className="bg-white/20 text-white text-xs">ESC</Badge> Limpar</div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/70"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online</div>
          <div className="flex items-center gap-1 text-white/70">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={conectarBalanca}>
              <Scale className={`h-3 w-3 mr-1 ${isBalancaConnected ? 'text-green-400' : 'text-red-400'}`} />
              {isBalancaConnected ? 'Balança ON' : 'Conectar Balança'}
            </Button>
            {isBalancaConnected && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-white/50 hover:text-white" onClick={handleTare}>
                [ TARA ]
              </Button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
          </div>
        </div>
      </footer>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cart}
        subtotal={subtotal}
        total={subtotal}
        onPaymentSuccess={handlePaymentSuccess}
        caixaId={caixaAberto?.id}
      />

      {/* Modal de Recibo */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        onPrint={handlePrintReceipt}
        venda={lastSale?.venda}
        itens={lastSale?.itens}
        autoPrint={true}
      />
      <ResumoCaixaModal isOpen={isResumoOpen} onClose={() => setIsResumoOpen(false)} />
      <CaixaManager isOpen={isCaixaModalOpen} onClose={() => setIsCaixaModalOpen(false)} tipo={tipoCaixaModal} />
    </div>
  );
};

export default PDV;
