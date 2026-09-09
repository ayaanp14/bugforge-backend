/**
 * When to ask for a platform rating.
 *
 * The prompt is a small interruption, so it is rationed here rather than left
 * to the client: a brand-new account has nothing to rate yet, and an account
 * that has already answered is not asked again for a month. The client adds
 * its own conditions on top — the candidate must be active, on a page that is
 * not a problem or an interview, and not have dismissed the prompt in the last
 * few days — but those are about timing within a visit; this is about whether
 * the visit should ask at all.
 */

export const FEEDBACK_KINDS = ["platform", "interview"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

/** Days an account must exist before it is first asked about the platform. */
export const PLATFORM_PROMPT_MIN_ACCOUNT_AGE_DAYS = 2;
/** Days between platform ratings from the same account. */
export const PLATFORM_PROMPT_INTERVAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function platformPromptDue({
  accountCreatedAt,
  lastPlatformAt,
  now = new Date(),
}: {
  accountCreatedAt: Date;
  lastPlatformAt: Date | null;
  now?: Date;
}): boolean {
  if (now.getTime() - accountCreatedAt.getTime() < PLATFORM_PROMPT_MIN_ACCOUNT_AGE_DAYS * DAY_MS) return false;
  if (lastPlatformAt && now.getTime() - lastPlatformAt.getTime() < PLATFORM_PROMPT_INTERVAL_DAYS * DAY_MS) return false;
  return true;
}

export const MAX_COMMENT_LENGTH = 2000;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 60;
export const MAX_PATH_LENGTH = 200;

export interface FeedbackInput {
  kind: FeedbackKind;
  rating: number;
  comment: string | null;
  tags: string[];
  sessionId: string | null;
  path: string | null;
}

/**
 * Shapes an untrusted body into a FeedbackInput, or explains why it cannot.
 * Whole stars only: the UI offers five, and half values would only come from
 * a hand-made request.
 */
export function parseFeedback(body: unknown): { ok: true; value: FeedbackInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const kind = b["kind"];
  if (kind !== "platform" && kind !== "interview") return { ok: false, error: "kind must be platform or interview" };

  const rating = b["rating"];
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "rating must be a whole number from 1 to 5" };
  }

  const commentRaw = b["comment"];
  if (commentRaw !== undefined && commentRaw !== null && typeof commentRaw !== "string") return { ok: false, error: "comment must be text" };
  const comment = typeof commentRaw === "string" ? commentRaw.trim().slice(0, MAX_COMMENT_LENGTH) : "";

  const tagsRaw = b["tags"];
  if (tagsRaw !== undefined && !Array.isArray(tagsRaw)) return { ok: false, error: "tags must be a list" };
  const tags = (Array.isArray(tagsRaw) ? tagsRaw : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TAGS);

  const sessionRaw = b["sessionId"];
  const sessionId = typeof sessionRaw === "string" && sessionRaw.trim() ? sessionRaw.trim() : null;
  if (kind === "interview" && !sessionId) return { ok: false, error: "sessionId is required for interview feedback" };

  const pathRaw = b["path"];
  const path = typeof pathRaw === "string" && pathRaw.trim() ? pathRaw.trim().slice(0, MAX_PATH_LENGTH) : null;

  return {
    ok: true,
    value: { kind, rating, comment: comment || null, tags, sessionId: kind === "interview" ? sessionId : null, path },
  };
}
