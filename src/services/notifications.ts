import { prisma } from "../lib/prisma.js";
import { broadcastSignal, onSignal } from "../lib/cache.js";

/**
 * In-app notifications (the bell in the top nav).
 * One-shot types ("welcome", "first_solve", streak milestones) are deduped
 * per user via createNotificationOnce, so triggers can fire repeatedly
 * without spamming.
 */

/* ── the unread badge ──────────────────────────────────────────────────── */

/**
 * The unread count is read on every /api/me, which the SPA calls on every
 * load, and against a ~500ms database that COUNT was the whole visible cost
 * of the request once the rest of the payload was cached.
 *
 * So it is cached here — but deliberately not through lib/cache.ts. That tier
 * serves stale-while-revalidate, which is right for a dashboard and wrong for
 * a badge: the first read after a new notification would return the old count
 * while refreshing behind it, and the bell would silently lag. This map has a
 * hard expiry instead, and every write path in this file drops the entry, so
 * the badge is exact for anything written through here. The TTL only bounds
 * the lag of a write that went around this module.
 */
const UNREAD_TTL_MS = 120_000;
const UNREAD_MAX_ENTRIES = 5000;
const UNREAD_SIGNAL = "unread";

const unread = new Map<string, { count: number; expiresAt: number }>();

function dropUnread(userId: string): void {
  unread.delete(userId);
}

// Another instance wrote a notification for this user: forget our count.
onSignal(UNREAD_SIGNAL, dropUnread);

/**
 * Drop the cached badge count after any notification write. Exported so a
 * route that writes `prisma.notification` directly (community likes, mentions,
 * follows) can keep the badge honest without routing through this file.
 */
export function invalidateUnread(userId: string): void {
  dropUnread(userId);
  broadcastSignal(UNREAD_SIGNAL, userId);
}

/** The badge count, from cache when it is recent enough. */
export async function getUnreadCount(userId: string): Promise<number> {
  const now = Date.now();
  const hit = unread.get(userId);
  if (hit && hit.expiresAt > now) return hit.count;

  const count = await countUnread(userId);
  // Bounded the cheap way: a full clear at the cap costs one COUNT per active
  // user afterwards, which is the state a fresh process starts in anyway.
  if (unread.size >= UNREAD_MAX_ENTRIES) unread.clear();
  unread.set(userId, { count, expiresAt: now + UNREAD_TTL_MS });
  return count;
}

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  href?: string | null;
}

export const WELCOME: NotificationInput = {
  type: "welcome",
  title: "Welcome to CodeKairo 👋",
  body: "Your journey starts here. Solve your first problem to earn XP, light up the heatmap and start a streak.",
  href: "/challenges",
};

export const FIRST_SOLVE: NotificationInput = {
  type: "first_solve",
  title: "First problem solved 🎉",
  body: "You cracked your first challenge and banked your first XP. The streak counter is officially running.",
  href: "/",
};

export const CAMPUS_APPLIED: NotificationInput = {
  type: "campus_ambassador_applied",
  title: "Ambassador application received 🎓",
  body: "Thanks for applying to run CodeKairo on your campus. We review applications every week and reply either way.",
  href: "/campus-ambassador",
};

/** Streak milestones worth celebrating. Returns null for ordinary days. */
export function streakMilestone(days: number): NotificationInput | null {
  const milestones: Record<number, { title: string; body: string }> = {
    3: { title: "3-day streak 🔥", body: "Three days in a row. Consistency beats intensity — keep it alive." },
    7: { title: "One-week streak 🔥", body: "Seven straight days of solving. You're building a serious habit." },
    14: { title: "Two-week streak ⚡", body: "Fourteen days without missing. The leaderboard is watching." },
    30: { title: "30-day streak 🏆", body: "A full month of daily solving. That puts you in rare company." },
  };
  const m = milestones[days];
  return m ? { type: `streak_${days}`, ...m, href: "/" } : null;
}

export async function createNotification(userId: string, input: NotificationInput) {
  try {
    const created = await prisma.notification.create({
      data: { userId, type: input.type, title: input.title, body: input.body, href: input.href ?? null },
    });
    invalidateUnread(userId);
    return created;
  } catch (err) {
    console.error(`createNotification(${input.type}) error:`, err);
    return null;
  }
}

/** Create only if the user has never received a notification of this type. */
export async function createNotificationOnce(userId: string, input: NotificationInput) {
  try {
    const existing = await prisma.notification.findFirst({
      where: { userId, type: input.type },
      select: { id: true },
    });
    if (existing) return null;
    return await createNotification(userId, input);
  } catch (err) {
    console.error(`createNotificationOnce(${input.type}) error:`, err);
    return null;
  }
}

export function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, type: true, title: true, body: true, href: true, isRead: true, createdAt: true },
  });
}

/**
 * The live COUNT against the (userId, isRead) index. Routes should read
 * `getUnreadCount` instead; this is what fills it.
 */
export function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  invalidateUnread(userId);
  return result;
}

/** Backfill for accounts that predate the notification system. */
export async function ensureBaseline(userId: string) {
  await createNotificationOnce(userId, WELCOME);
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { problemsSolved: true },
  });
  if (stats && stats.problemsSolved > 0) {
    await createNotificationOnce(userId, FIRST_SOLVE);
  }
}
