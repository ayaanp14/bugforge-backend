/**
 * Web Push: a bell notification also shown by the operating system, on the
 * browsers an account switched it on for (PushSubscription rows), so the
 * evening streak reminder or a tournament starting in an hour reaches
 * someone who has no CodeKairo tab open — without email, whose free plan's
 * 300 a day the sign-in codes share (lib/brevo.ts).
 *
 * Off unless VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set (backend
 * .env.example says how to make a pair); then GET /api/push/key answers
 * null and the profile shows no switch.
 *
 * What is pushed is a short list (PUSHED): reminders the account kept on
 * and things another person did to it. Not what the account just did itself
 * — a cleared stage, a credential — since it is on the site to see those.
 * And nothing for an account with a live `/rt` socket here: an open tab's
 * bell already lit up, and a second ping from the OS would be the same news
 * twice. (Local sockets only, like userIsConnected; this is one instance.)
 */
import webpush from "web-push";
import { prisma } from "./prisma.js";
import { userIsConnected } from "./realtime.js";

const PUBLIC_KEY = process.env["VAPID_PUBLIC_KEY"]?.trim() || null;
const PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"]?.trim() || null;
const SUBJECT = process.env["VAPID_SUBJECT"]?.trim() || "mailto:support@codekairo.com";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  } catch (err) {
    console.error("[push] the VAPID keys were refused; push is off:", (err as Error).message);
  }
}

/** The application server key a browser subscribes with, or null when push is off. */
export const pushPublicKey = (): string | null => (configured ? PUBLIC_KEY : null);

/**
 * The browsers' push services. The server POSTs to whatever endpoint a
 * subscription names, so an endpoint is accepted only on one of these hosts —
 * otherwise anyone could register an internal address and have the API
 * send requests to it.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export function isPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.port === "" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

/** The notification types also sent as a system notification. */
const PUSHED: RegExp[] = [
  /^streak_at_risk_/,
  /^daily_kata_/,
  /^study_plan_due_/,
  /^review_due_/,
  /^battles_reminder:/,
  /^(mention|comment_reply|post_comment|answer_accepted|new_follower)$/,
];

export const isPushed = (type: string): boolean => PUSHED.some((re) => re.test(type));

export interface PushItem {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
}

/** How long a push service may hold one for a device that is off: news older than this is stale. */
const TTL_SECONDS = 6 * 60 * 60;
const CONCURRENCY = 8;

/**
 * Sends each item to every browser its account switched push on for, unless
 * the type is not pushed or the account has the site open. Never throws, and
 * a caller never waits on it (the bell row is already written): `void` it.
 */
export async function pushNotifications(items: PushItem[]): Promise<void> {
  if (!configured) return;
  const wanted = items.filter((i) => isPushed(i.type) && !userIsConnected(i.userId));
  if (wanted.length === 0) return;
  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: [...new Set(wanted.map((i) => i.userId))] } },
      select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
    });
    if (subs.length === 0) return;
    const byUser = new Map<string, typeof subs>();
    for (const s of subs) byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);

    const jobs = wanted.flatMap((item) =>
      (byUser.get(item.userId) ?? []).map((sub) => ({
        sub,
        payload: JSON.stringify({
          title: item.title.slice(0, 120),
          body: item.body.slice(0, 300),
          href: item.href ?? "/",
          // One per type: a newer push of the same kind replaces the older on the screen.
          tag: item.type,
        }),
      })),
    );

    const delivered: string[] = [];
    const gone: string[] = [];
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const { sub, payload } = jobs[next++]!;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: TTL_SECONDS, timeout: 10_000 });
          delivered.push(sub.id);
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          // The browser unsubscribed, or the service expired it: forget it.
          if (status === 404 || status === 410) gone.push(sub.id);
          else console.error(`[push] send failed (${status ?? "network"}):`, (err as Error).message);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

    await Promise.all([
      gone.length ? prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } }) : null,
      delivered.length ? prisma.pushSubscription.updateMany({ where: { id: { in: delivered } }, data: { lastPushAt: new Date() } }) : null,
    ]);
  } catch (err) {
    console.error("[push] delivery failed:", (err as Error).message);
  }
}
