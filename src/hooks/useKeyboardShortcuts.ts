import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  F1?: () => void;  // Buscar
  F2?: () => void;  // Balança
  F3?: () => void;  // Desconto
  F4?: () => void;  // Cancelar Item
  F5?: () => void;  // Reservado
  F6?: () => void;  // Pagamento
  F7?: () => void;  // Reservado
  F8?: () => void;  // Reservado
  F9?: () => void;  // Reservado
  F10?: () => void; // Reservado
  F11?: () => void; // Tela Cheia
  F12?: () => void; // Finalizar
  Enter?: () => void; // Confirmar
  Escape?: () => void; // Cancelar
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se estiver digitando em um input
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    // Mapear teclas para funções
    const keyMap: { [key: string]: keyof KeyboardShortcuts } = {
      'F1': 'F1',
      'F2': 'F2',
      'F3': 'F3',
      'F4': 'F4',
      'F5': 'F5',
      'F6': 'F6',
      'F7': 'F7',
      'F8': 'F8',
      'F9': 'F9',
      'F10': 'F10',
      'F11': 'F11',
      'F12': 'F12',
      'Enter': 'Enter',
      'Escape': 'Escape',
    };

    const shortcutKey = keyMap[event.key];

    if (shortcutKey && shortcuts[shortcutKey]) {
      // Para F1-F12, sempre prevenir comportamento padrão
      if (event.key.startsWith('F')) {
        event.preventDefault();
      }

      // Para Enter/Escape, apenas prevenir se não estiver em input
      if ((event.key === 'Enter' || event.key === 'Escape') && !isInput) {
        event.preventDefault();
      } else if ((event.key === 'Enter' || event.key === 'Escape') && isInput) {
        return; // Deixar o input processar normalmente
      }

      shortcuts[shortcutKey]?.();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
