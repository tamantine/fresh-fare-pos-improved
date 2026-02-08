import { create } from 'zustand';
import { CartItem, FormaPagamento, Produto } from '@/types/pdv';

interface PDVState {
  cartItems: CartItem[];
  selectedProduct: Produto | null;
  currentWeight: number;
  discount: number;
  paymentMethod: FormaPagamento | null;
  isPaymentModalOpen: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  
  // Actions
  addToCart: (produto: Produto, quantidade: number, peso?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantidade: number) => void;
  clearCart: () => void;
  setSelectedProduct: (produto: Produto | null) => void;
  setCurrentWeight: (weight: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: FormaPagamento | null) => void;
  setPaymentModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePDVStore = create<PDVState>((set, get) => ({
  cartItems: [],
  selectedProduct: null,
  currentWeight: 0,
  discount: 0,
  paymentMethod: null,
  isPaymentModalOpen: false,
  searchQuery: '',
  selectedCategory: null,
  
  addToCart: (produto, quantidade, peso) => {
    const precoUnitario = produto.tipo_venda === 'peso' 
      ? (produto.preco_kg || 0) 
      : (produto.preco_unidade || 0);
    
    const subtotal = produto.tipo_venda === 'peso'
      ? (peso || 0) * precoUnitario
      : quantidade * precoUnitario;
    
    const newItem: CartItem = {
      id: `${produto.id}-${Date.now()}`,
      produto,
      quantidade,
      peso,
      preco_unitario: precoUnitario,
      subtotal,
      desconto: 0,
    };
    
    set((state) => ({
      cartItems: [...state.cartItems, newItem],
      selectedProduct: null,
      currentWeight: 0,
    }));
  },
  
  removeFromCart: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }));
  },
  
  updateCartItemQuantity: (itemId, quantidade) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.id === itemId) {
          const subtotal = item.produto.tipo_venda === 'peso'
            ? (item.peso || 0) * item.preco_unitario
            : quantidade * item.preco_unitario;
          return { ...item, quantidade, subtotal };
        }
        return item;
      }),
    }));
  },
  
  clearCart: () => {
    set({ cartItems: [], discount: 0, paymentMethod: null });
  },
  
  setSelectedProduct: (produto) => set({ selectedProduct: produto }),
  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  
  getSubtotal: () => {
    return get().cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal - get().discount;
  },
  
  getItemCount: () => {
    return get().cartItems.length;
  },
}));
