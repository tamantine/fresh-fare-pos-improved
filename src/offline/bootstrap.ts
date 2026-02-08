import { refreshOfflineCache } from './cache';
import { syncPendingSales } from './sync';

export async function offlineBootstrap() {
  // Try refresh cache at startup if possible
  try {
    await refreshOfflineCache();
  } catch {
    // ignore
  }

  // Attempt sync on boot
  try {
    await syncPendingSales();
  } catch {
    // ignore
  }

  // Sync whenever we come back online
  window.addEventListener('online', () => {
    syncPendingSales().catch(() => undefined);
    refreshOfflineCache().catch(() => undefined);
  });

  // Manual sync trigger from UI
  window.addEventListener('freshfare:sync', () => {
    syncPendingSales().catch(() => undefined);
    refreshOfflineCache().catch(() => undefined);
  });
}
