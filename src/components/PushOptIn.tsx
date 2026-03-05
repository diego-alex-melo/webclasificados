'use client';

import { useCallback, useEffect, useState } from 'react';

import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'push_optin_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PushOptIn() {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSupported || isSubscribed) {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        setVisible(false);
        return;
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    setVisible(true);
  }, [isSupported, isSubscribed]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const handleSubscribe = useCallback(async () => {
    await subscribe();
    setVisible(false);
  }, [subscribe]);

  if (!visible) return null;

  return (
    <div className="animate-slide-down border-b border-accent-gold/20 bg-bg-secondary/80 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">
          <span className="mr-1.5 text-accent-gold">&#128276;</span>
          Recibe notificaciones cuando te contacten por WhatsApp
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="rounded-full bg-accent-gold/15 px-4 py-1.5 text-sm font-medium text-accent-gold transition-colors hover:bg-accent-gold/25 disabled:opacity-50"
          >
            {isLoading ? 'Activando...' : 'Activar notificaciones'}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
