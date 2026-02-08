/**
 * Hook para gerenciar e monitorar a conexão com Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { SupabaseUtils } from '@/integrations/supabase/service';

interface ConnectionStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export function useSupabaseConnection(checkInterval: number = 30000) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isChecking: true,
    lastChecked: null,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const isConnected = await SupabaseUtils.verificarConexao();
      setStatus({
        isConnected,
        isChecking: false,
        lastChecked: new Date(),
        error: null,
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        isChecking: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Erro ao verificar conexão',
      });
    }
  }, []);

  useEffect(() => {
    // Verificação inicial
    checkConnection();

    // Verificação periódica
    const interval = setInterval(checkConnection, checkInterval);

    // Verificar quando a janela volta ao foco
    const handleFocus = () => checkConnection();
    window.addEventListener('focus', handleFocus);

    // Verificar quando a conexão é restaurada
    const handleOnline = () => checkConnection();
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkConnection, checkInterval]);

  return {
    ...status,
    checkConnection,
    projectInfo: SupabaseUtils.getProjectInfo(),
  };
}
