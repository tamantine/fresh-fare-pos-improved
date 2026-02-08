/**
 * Componente que exibe o status da conexão com o Supabase
 */

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ConnectionStatusIndicator() {
  const { isConnected, isChecking, lastChecked, error, checkConnection } = useSupabaseConnection();

  const getStatusColor = () => {
    if (isChecking) return 'bg-yellow-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Verificando...';
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isConnected) return <Wifi className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {getStatusIcon()}
            <span className="text-xs font-medium">{getStatusText()}</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={checkConnection}
            disabled={isChecking}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p className="font-semibold">Status da Conexão Supabase</p>
          <p>Status: {getStatusText()}</p>
          {lastChecked && (
            <p>Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}</p>
          )}
          {error && (
            <p className="text-red-400">Erro: {error}</p>
          )}
          <p className="text-muted-foreground mt-2">Clique no botão para verificar novamente</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
