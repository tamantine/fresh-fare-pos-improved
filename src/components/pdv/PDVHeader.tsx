import { Clock, User, Monitor, Wifi, WifiOff, Lock, Unlock, Loader2 } from 'lucide-react';
import { OfflineStatusBadge } from './OfflineStatusBadge';
import { useState, useEffect } from 'react';
import { useCaixa } from '@/hooks/useCaixa';
import { CaixaModal } from '@/components/pdv/CaixaModal';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export function PDVHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Caixa Hook
  const { caixaAberto, isLoading: isCaixaLoading } = useCaixa();
  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="pdv-header flex items-center justify-between">
      {/* Logo & Store Name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-white/20 shadow-md">
          <img src="/logo.jpg" alt="Hortifruti Bom Preço" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hortifruti Bom Preço</h1>
          <p className="text-primary-foreground/80 text-sm font-medium">PDV Profissional</p>
        </div>
      </div>

      {/* Caixa Status & Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className={`gap-2 border ${caixaAberto ? 'bg-green-500/20 text-green-100 border-green-500/50 hover:bg-green-500/30' : 'bg-red-500/20 text-red-100 border-red-500/50 hover:bg-red-500/30'}`}
          onClick={() => setIsCaixaModalOpen(true)}
        >
          {isCaixaLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : caixaAberto ? (
            <>
              <Unlock className="h-4 w-4 text-green-400" />
              <span className="font-bold">CAIXA ABERTO</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-red-400" />
              <span className="font-bold">CAIXA FECHADO</span>
            </>
          )}
        </Button>
      </div>

      {/* Center - Date/Time */}
      <div className="flex items-center gap-6 bg-primary-foreground/10 px-6 py-2 rounded-full">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-semibold">{formatTime(currentTime)}</span>
        </div>
        <div className="text-primary-foreground/70 text-sm">
          {formatDate(currentTime)}
          <OfflineStatusBadge onSync={() => window.dispatchEvent(new Event("freshfare:sync"))} />
        </div>
      </div>

      {/* Right - Status & User */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isOnline
          ? 'bg-success/20 text-success-foreground'
          : 'bg-warning/20 text-warning-foreground'
          }`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Terminal */}
        <div className="flex items-center gap-2 text-primary-foreground/70">
          <Monitor className="h-4 w-4" />
          <span className="text-sm">Caixa 01</span>
        </div>

        {/* Operator */}
        <div className="flex items-center gap-2 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">Operador</span>
        </div>

        {/* Theme Toggle */}
        <ModeToggle />
      </div>

      <CaixaModal
        isOpen={isCaixaModalOpen}
        onClose={() => setIsCaixaModalOpen(false)}
      />
    </header>
  );
}
