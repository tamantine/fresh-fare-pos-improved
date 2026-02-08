import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { useOnlineStatus } from '@/offline/network';
import { useQuery } from '@tanstack/react-query';
import { countOfflineSales, getMeta } from '@/offline/db';

export function OfflineStatusBadge({ onSync }: { onSync: () => void }) {
  const online = useOnlineStatus();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['offline-sales-count'],
    queryFn: async () => countOfflineSales('pending'),
    refetchInterval: 2000,
  });

  const { data: lastRefresh } = useQuery({
    queryKey: ['offline-cache-last-refresh'],
    queryFn: async () => getMeta('last_cache_refresh'),
    refetchInterval: 5000,
  });

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={
          "inline-flex items-center gap-1 rounded-full px-2 py-1 border " +
          (online
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-destructive/10 text-destructive border-destructive/20')
        }
        title={online ? 'Online' : 'Offline'}
      >
        {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {online ? 'Online' : 'Offline'}
      </span>

      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 border bg-secondary text-secondary-foreground"
        title={lastRefresh ? `Cache atualizado: ${new Date(lastRefresh).toLocaleString()}` : 'Cache não atualizado'}
      >
        Cache
      </span>

      {pendingCount > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 border bg-warning/10 text-warning border-warning/20"
          title="Vendas aguardando sincronização"
        >
          {pendingCount} pendente(s)
        </span>
      )}

      {online && (
        <button
          onClick={onSync}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 border bg-card hover:bg-accent/10"
          title="Sincronizar agora"
        >
          <RefreshCcw className="h-3 w-3" />
          Sync
        </button>
      )}
    </div>
  );
}
