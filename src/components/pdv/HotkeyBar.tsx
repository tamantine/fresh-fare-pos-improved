import { Search, Scale, Percent, XCircle, CreditCard, CheckCircle } from 'lucide-react';

const hotkeys = [
  { key: 'F1', label: 'Buscar', icon: <Search className="h-4 w-4" /> },
  { key: 'F2', label: 'Balança', icon: <Scale className="h-4 w-4" /> },
  { key: 'F3', label: 'Desconto', icon: <Percent className="h-4 w-4" /> },
  { key: 'F4', label: 'Cancelar Item', icon: <XCircle className="h-4 w-4" /> },
  { key: 'F6', label: 'Pagamento', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'F12', label: 'Finalizar', icon: <CheckCircle className="h-4 w-4" /> },
];

export function HotkeyBar() {
  return (
    <div className="bg-pdv-footer text-primary-foreground/70 px-6 py-2">
      <div className="flex items-center justify-center gap-6">
        {hotkeys.map((hotkey) => (
          <div key={hotkey.key} className="flex items-center gap-2">
            <kbd className="hotkey-badge bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              {hotkey.key}
            </kbd>
            <span className="flex items-center gap-1.5 text-sm">
              {hotkey.icon}
              {hotkey.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
