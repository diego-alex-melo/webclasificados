'use client';

import { useCallback, useReducer } from 'react';

import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'push_optin_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const elapsed = Date.now() - Number(dismissedAt);
  if (elapsed < DISMISS_DURATION_MS) return true;
  localStorage.removeItem(DISMISS_KEY);
  return false;
}

export default function PushOptIn() {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [hidden, hide] = useReducer(() => true, false);

  const visible = isSupported && !isSubscribed && !hidden && !isDismissed();

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    hide();
  }, []);

  const handleSubscribe = useCallback(async () => {
    await subscribe();
    hide();
  }, [subscribe]);

  if (!visible) return null;

  return (
    <div className="animate-slide-down border-b border-accent-gold/20 bg-bg-secondary/80 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            {isLoading ? 'Activando...' : 'Activar'}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
