import { prisma } from "../lib/prisma.js";

/**
 * In-app notifications (the bell in the top nav).
 * One-shot types ("welcome", "first_solve", streak milestones) are deduped
 * per user via createNotificationOnce, so triggers can fire repeatedly
 * without spamming.
 */

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  href?: string | null;
}

export const WELCOME: NotificationInput = {
  type: "welcome",
  title: "Welcome to Codexa 👋",
  body: "Your journey starts here. Solve your first problem to earn XP, light up the heatmap and start a streak.",
  href: "/challenges",
};

export const FIRST_SOLVE: NotificationInput = {
  type: "first_solve",
  title: "First problem solved 🎉",
  body: "You cracked your first challenge and banked your first XP. The streak counter is officially running.",
  href: "/",
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
    return await prisma.notification.create({
      data: { userId, type: input.type, title: input.title, body: input.body, href: input.href ?? null },
    });
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

export function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
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
