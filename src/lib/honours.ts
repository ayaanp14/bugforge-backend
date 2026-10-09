/**
 * Honours: recognition given by hand, never earned by a counter.
 *
 * The founding members came first (2026-10-09, the owner's ask): the
 * earliest accounts that stayed active, thanked with a celebration on their
 * next visit, a frame round their avatar and name that no one else wears, a
 * badge on their profile, lifetime access to everything, and a mail. The
 * owner will name more people later — and perhaps other honours — so the
 * kind is a template here and a grant is one row (the Honour model):
 * `scripts/grant-honour.ts` or the admin panel's Honours tab adds people, and
 * nothing about a kind is written anywhere but this table and its mirror in
 * frontend/src/lib/honours.ts (the words the celebration and the profile
 * show — keep the two in step).
 *
 * Unlike a badge (lib/badges.ts, derived from counters, no table) an honour
 * cannot be re-derived from anything, so it is stored; and unlike a badge's
 * moment, which each browser finds by difference, the celebration is
 * recorded on the row (`celebratedAt`), so it plays once per person.
 *
 * Import-free on purpose, like WORN_CREDENTIAL_SELECT in lib/skill-tests.ts:
 * HONOUR_SELECT is spread into ME_SELECT and the community's author select,
 * both built at module load.
 */

export interface HonourDef {
  kind: string;
  /** The badge's name, as the profile and the share card print it. */
  name: string;
  /** One line under the name: what it recognises. */
  line: string;
  /** Lifts every quota for good (services/entitlements activePlan). */
  lifetimeAccess: boolean;
  /** The LinkedIn certification form's name field (frontend linkedInHonourUrl). */
  linkedinName: string;
}

export const HONOURS: Record<string, HonourDef> = {
  founding_member: {
    kind: "founding_member",
    name: "Founding Member",
    line: "One of the first people to build their practice on CodeKairo, and one of its most active.",
    lifetimeAccess: true,
    linkedinName: "Founding Member — CodeKairo",
  },
};

export const HONOUR_KINDS = Object.keys(HONOURS);

export function honourDef(kind: unknown): HonourDef | null {
  return typeof kind === "string" && Object.prototype.hasOwnProperty.call(HONOURS, kind) ? HONOURS[kind] : null;
}

/** Whether any of these held kinds lifts every quota. */
export function grantsLifetimeAccess(kinds: Iterable<string>): boolean {
  for (const kind of kinds) if (honourDef(kind)?.lifetimeAccess) return true;
  return false;
}

/**
 * What every author payload carries (feed, comments, /api/me, the public
 * profile): the kinds held, so the frame can be drawn wherever the name is.
 * Nothing else about the row leaves the server through it.
 */
export const HONOUR_SELECT = {
  honours: { select: { kind: true } },
} as const;

/** The LinkedIn clicks the owner asked to be told about (Honour.linkedin*). */
export const HONOUR_SHARE_ACTIONS = ["linkedin_post", "linkedin_profile"] as const;
export type HonourShareAction = (typeof HONOUR_SHARE_ACTIONS)[number];

export const isHonourShareAction = (value: unknown): value is HonourShareAction =>
  typeof value === "string" && (HONOUR_SHARE_ACTIONS as readonly string[]).includes(value);

/** A holder's note, as the celebration's feedback box sends it. */
export const HONOUR_FEEDBACK_MAX = 2000;
export const HONOUR_FEEDBACK_MIN = 3;

export function parseHonourFeedback(body: unknown): { ok: true; comment: string; rating: number | null } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const comment = typeof b["comment"] === "string" ? b["comment"].trim().slice(0, HONOUR_FEEDBACK_MAX) : "";
  if (comment.length < HONOUR_FEEDBACK_MIN) return { ok: false, error: "Write a few words first." };
  const raw = b["rating"];
  if (raw === undefined || raw === null) return { ok: true, comment, rating: null };
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1 || raw > 5) return { ok: false, error: "rating must be a whole number from 1 to 5" };
  return { ok: true, comment, rating: raw };
}

/**
 * The people a grant names: emails or usernames (a leading @ allowed), split
 * on commas, spaces or new lines, de-duplicated, lower-cased. Emails and
 * usernames are both unique columns, so either finds one account.
 */
export function parseHonourees(input: unknown): string[] {
  const list = Array.isArray(input) ? input.filter((x): x is string => typeof x === "string").join("\n") : typeof input === "string" ? input : "";
  const seen = new Set<string>();
  for (const raw of list.split(/[\s,;]+/)) {
    const item = raw.trim().replace(/^@/, "").toLowerCase();
    if (item) seen.add(item);
  }
  return [...seen].slice(0, 200);
}
