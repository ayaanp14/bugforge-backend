import { prisma } from "../lib/prisma.js";
import { verifyAchievement, type VerifiedAchievement } from "./achievements.js";

/**
 * Shareable win pictures (see the ShareCard model for why they exist).
 *
 * The browser draws the picture and uploads it; this keeps it, answers it
 * back to the link-preview crawlers, and describes the /share/<id> page. What
 * the card claims is verified exactly as a community achievement post is
 * (services/achievements.ts): a picture of "I solved X" that anyone could
 * post without solving X would be a lie on our own domain.
 *
 * JPEG, not PNG: the card is all smooth gradients, which PNG stores nearly
 * raw — the first cards came out at ~870 KB, slow for every crawler and over
 * the size some platforms will draw. A JPEG of the same card is a tenth of it.
 */

/** 1200×627 — the only size the client draws (frontend share-image.ts), so the only size accepted. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 627;
/** A drawn card is ~60–150 KB as JPEG; anything near this is not one. */
export const MAX_CARD_BYTES = 600 * 1024;
/** Cards an account keeps; older ones are deleted as new ones arrive. */
const KEEP_PER_ACCOUNT = 30;

export class ShareCardError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The frame's size from a JPEG, read from the file itself: the SOI marker,
 * then segment by segment to the first start-of-frame (any SOFn but the DHT,
 * JPG and DAC markers that share the C0–CF range), whose header holds the
 * height and width. Null for anything that is not a well-formed JPEG.
 */
export function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    // Fill bytes and the standalone markers carry no length.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    // End of image or start of scan before any frame header: not a picture we can read.
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      if (length < 7) return null;
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + length;
  }
  return null;
}

/**
 * Whether the bytes are a JPEG of exactly the card's size. The endpoint
 * serves what it stores to anyone, unsigned, on the site's own domain, so it
 * must only ever hold win cards — not arbitrary pictures.
 */
export function isCardImage(bytes: Uint8Array): boolean {
  if (bytes.length > MAX_CARD_BYTES) return false;
  const size = jpegSize(bytes);
  return size !== null && size.width === CARD_WIDTH && size.height === CARD_HEIGHT;
}

export async function createShareCard(userId: string, meta: Record<string, unknown>, bytes: Uint8Array): Promise<{ id: string }> {
  if (!isCardImage(bytes)) throw new ShareCardError(400, "That is not a CodeKairo win card.");
  const check = await verifyAchievement(userId, meta);
  if (!check.ok) throw new ShareCardError(400, check.error);
  const a: VerifiedAchievement = check.achievement;
  const card = await prisma.shareCard.create({
    data: {
      userId,
      kind: a.kind,
      title: a.title.slice(0, 200),
      difficulty: a.difficulty ? a.difficulty.toLowerCase().slice(0, 20) : null,
      slug: a.slug ?? null,
      challengeId: a.challengeId ?? null,
      xp: a.xp ?? null,
      image: Buffer.from(bytes),
    },
    select: { id: true },
  });
  // Keep the newest few. Old links then fall back to the site's default
  // preview (the page 404s), which is the right end for a months-old share.
  const stale = await prisma.shareCard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: KEEP_PER_ACCOUNT,
    select: { id: true },
  });
  if (stale.length) await prisma.shareCard.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  return card;
}

/** The card's facts and its author, for the page and its head — never the bytes. */
export function getShareCard(id: string) {
  return prisma.shareCard.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      title: true,
      difficulty: true,
      slug: true,
      challengeId: true,
      xp: true,
      createdAt: true,
      user: { select: { name: true, username: true, avatar_url: true } },
    },
  });
}

export async function getShareImage(id: string): Promise<Uint8Array | null> {
  const row = await prisma.shareCard.findUnique({ where: { id }, select: { image: true } });
  return row ? new Uint8Array(row.image) : null;
}
