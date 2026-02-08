import { useEffect, useState } from 'react';

export function isOnlineNow() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnlineNow());

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  return online;
}
