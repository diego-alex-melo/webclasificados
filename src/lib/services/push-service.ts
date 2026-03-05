import webpush from 'web-push';

import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';

// ---------------------------------------------------------------------------
// VAPID configuration
// ---------------------------------------------------------------------------

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@webclasificados.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

// ---------------------------------------------------------------------------
// Core push sender
// ---------------------------------------------------------------------------

/**
 * Send a push notification to a single subscription.
 * If the subscription is expired (HTTP 410), delete it from the DB.
 * Errors are caught silently to never crash the caller.
 */
export async function sendPushNotification(
  advertiserId: string,
  subscription: webpush.PushSubscription,
  payload: PushPayload,
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription expired or invalid — remove from DB
      await prisma.advertiser
        .update({
          where: { id: advertiserId },
          data: { pushSubscription: Prisma.DbNull },
        })
        .catch(() => {});
    }
    // All other errors silently swallowed
  }
}

// ---------------------------------------------------------------------------
// Domain notification helpers
// ---------------------------------------------------------------------------

async function getSubscription(
  advertiserId: string,
): Promise<{ subscription: webpush.PushSubscription; id: string } | null> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: { id: true, pushSubscription: true },
  });

  if (!advertiser?.pushSubscription) return null;

  return {
    id: advertiser.id,
    subscription: advertiser.pushSubscription as unknown as webpush.PushSubscription,
  };
}

/**
 * Notify an advertiser when someone contacts them via WhatsApp.
 */
export async function notifyNewContact(advertiserId: string, adTitle: string): Promise<void> {
  const data = await getSubscription(advertiserId);
  if (!data) return;

  await sendPushNotification(data.id, data.subscription, {
    title: 'Nuevo contacto por WhatsApp',
    body: `Alguien te contactó por tu anuncio '${adTitle}'`,
    url: '/dashboard',
    icon: '/icon-192.png',
  });
}

/**
 * Notify an advertiser when their ad reaches a view milestone.
 */
export async function notifyViewMilestone(
  advertiserId: string,
  adTitle: string,
  views: number,
): Promise<void> {
  const data = await getSubscription(advertiserId);
  if (!data) return;

  await sendPushNotification(data.id, data.subscription, {
    title: 'Tu anuncio es popular',
    body: `Tu anuncio '${adTitle}' alcanzó ${views} vistas!`,
    url: '/dashboard',
    icon: '/icon-192.png',
  });
}

/**
 * Notify an advertiser that their ad is about to expire.
 */
export async function notifyExpirationWarning(
  advertiserId: string,
  adTitle: string,
  daysLeft: number,
): Promise<void> {
  const data = await getSubscription(advertiserId);
  if (!data) return;

  await sendPushNotification(data.id, data.subscription, {
    title: 'Tu anuncio está por expirar',
    body: `Tu anuncio '${adTitle}' expira en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`,
    url: '/dashboard',
    icon: '/icon-192.png',
  });
}
