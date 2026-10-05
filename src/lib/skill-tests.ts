/**
 * The rules of a skill test that do not need a database: how a score
 * becomes a band, when a test can be sat again, what a credential's code
 * looks like and when it is valid, when a sitting is flagged, and when
 * leaving the screen ends one.
 *
 * Pure so skill-tests.test.ts can pin them. The sitting itself (drawing a
 * paper, the clock, coding marks) is lib/mock-tests.ts, shared with the
 * placement tests; routes/skill-tests.ts and services/skill-credentials.ts
 * are the I/O around both.
 */
import { randomBytes } from "node:crypto";

export type Band = "distinction" | "pass" | "fail";

/**
 * A score as a whole percentage, rounded down: 59.96 % is not a pass. The
 * epsilon keeps a float like 0.6 * 100 = 59.99999999999999 from losing the
 * point it actually earned.
 */
export function percentOf(score: number, maxScore: number): number {
  if (!(maxScore > 0)) return 0;
  return Math.max(0, Math.min(100, Math.floor((score / maxScore) * 100 + 1e-9)));
}

export function bandFor(percent: number, passPercent: number, distinctionPercent: number): Band {
  if (percent >= distinctionPercent) return "distinction";
  if (percent >= passPercent) return "pass";
  return "fail";
}

export const BAND_LABEL: Record<Band, string> = {
  distinction: "Passed with distinction",
  pass: "Passed",
  fail: "Not passed",
};

/**
 * The options a candidate chose, from an untrusted body: integer indices in
 * range, deduplicated and sorted. `null` (or an empty list) is "no answer".
 * Returns "invalid" for anything else, so the route can refuse it rather
 * than store a guess at what was meant.
 */
export function parseSelection(raw: unknown, optionCount: number): number[] | null | "invalid" {
  if (raw === null || raw === undefined) return null;
  const list = Array.isArray(raw) ? raw : [raw];
  if (list.length === 0) return null;
  if (list.length > optionCount) return "invalid";
  const picked = new Set<number>();
  for (const value of list) {
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= optionCount) return "invalid";
    picked.add(index);
  }
  return [...picked].sort((a, b) => a - b);
}

/** All-or-nothing: the chosen set is exactly the keyed set. */
export function isCorrectSelection(selected: readonly number[] | null, answer: readonly number[]): boolean {
  if (!selected || selected.length === 0 || selected.length !== answer.length) return false;
  const key = new Set(answer);
  return selected.every((index) => key.has(index));
}

/** When the test can next be started, or null if it can be started now. */
export function nextSittingAt(lastClosedAt: Date | null, cooldownDays: number, now: Date = new Date()): Date | null {
  if (!lastClosedAt || cooldownDays <= 0) return null;
  const at = new Date(lastClosedAt.getTime() + cooldownDays * 86_400_000);
  return at.getTime() > now.getTime() ? at : null;
}

/** Calendar months, clamped to the month's last day (31 Jan + 1 → 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const out = new Date(date.getTime());
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(out.getUTCMonth() + months);
  const last = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, last));
  return out;
}

/* ── credential codes ────────────────────────────────────────────────── */

/**
 * Crockford's base32: no I, L, O or U, so a code read aloud or typed from a
 * printed certificate cannot be mistaken — and normalizeCredentialCode maps
 * the look-alikes back.
 */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * "CK-7H3K-9QXM": 8 symbols, 40 random bits. Random rather than derived
 * from a row id, so codes cannot be walked; the unique index settles the
 * one-in-a-trillion collision (the issuer retries).
 */
export function credentialCode(bytes: Uint8Array = randomBytes(5)): string {
  let bits = 0n;
  for (const byte of bytes.slice(0, 5)) bits = (bits << 8n) | BigInt(byte);
  let symbols = "";
  for (let i = 0; i < 8; i += 1) {
    symbols = CROCKFORD[Number(bits & 31n)]! + symbols;
    bits >>= 5n;
  }
  return `CK-${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}

/**
 * A code as typed or as it appears in a URL ("ck-7h3k-9qxm", "CK7H3K9QXM",
 * "ck-7h3k-9qxo") to its stored form, or null when it cannot be one.
 */
export function normalizeCredentialCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toUpperCase().replace(/[\s-]/g, "");
  const body = raw.startsWith("CK") ? raw.slice(2) : raw;
  if (body.length !== 8) return null;
  const mapped = body.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (![...mapped].every((ch) => CROCKFORD.includes(ch))) return null;
  return `CK-${mapped.slice(0, 4)}-${mapped.slice(4)}`;
}

/** The lowercase form a /verify URL carries. */
export const credentialPath = (code: string) => `/verify/${code.toLowerCase()}`;

export type CredentialStatus = "valid" | "expired" | "revoked";

export function credentialStatus(credential: { expiresAt: Date; revokedAt: Date | null }, now: Date = new Date()): CredentialStatus {
  if (credential.revokedAt) return "revoked";
  return credential.expiresAt.getTime() > now.getTime() ? "valid" : "expired";
}

/**
 * Whether a new passing sitting should replace what a credential shows. A
 * better score raises it; any pass renews an expired one. A revoked
 * credential is never reissued by a sitting — revocation is a judgement
 * someone made, and only an admin undoes it.
 */
export function improvesCredential(
  existing: { percent: number; expiresAt: Date; revokedAt: Date | null },
  next: { percent: number },
  now: Date = new Date(),
): boolean {
  const status = credentialStatus(existing, now);
  if (status === "revoked") return false;
  if (status === "expired") return true;
  return next.percent > existing.percent;
}

/**
 * What every author payload carries for the frame: the credential its
 * holder chose to wear. Spread into AUTHOR_SELECT (community), ME_SELECT and
 * the dashboard's user read. Lives here, in a module that imports nothing
 * of the app, because those selects are built at module load and the
 * credential service sits in an import cycle with the dashboard.
 *
 * No `revokedAt`: revoking clears the column that points here. The client
 * hides a frame whose `expiresAt` has passed, so a cached payload cannot
 * keep an expired frame on show.
 */
export const WORN_CREDENTIAL_SELECT = {
  wornCredential: { select: { code: true, skill: true, level: true, band: true, expiresAt: true } },
} as const;

/* ── integrity ───────────────────────────────────────────────────────── */

/** What the runner may report. Anything else is ignored. */
export const SIGNAL_KINDS = ["tabHidden", "paste", "fullscreenExit", "focusLost"] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
/** The counters — signals and breach causes — plus `breaches`, the warnings spent (see recordBreach). */
export type Signals = Partial<Record<SignalKind | BreachCause | "breaches", number>>;

export const isSignalKind = (value: unknown): value is SignalKind =>
  typeof value === "string" && (SIGNAL_KINDS as readonly string[]).includes(value);

/** A signal counter stops counting here; past it the number says nothing more. */
export const SIGNAL_CAP = 500;

/**
 * The sitting is proctored in the browser (2026-10-02, at the owner's ask:
 * counting and leaving it to a reviewer was too lenient). It must stay full
 * screen, in front and focused; the runner blurs the paper whenever it is
 * not, and each time it leaves — another tab, another window, minimised,
 * full screen dropped — is one breach, however many of those signals the one
 * departure fired. The first breaches are warnings; the one that reaches
 * this limit ends the sitting on the server, graded as not passed.
 *
 * Three, not one: Esc is held off by Keyboard Lock only in Chromium, a
 * system dialog can take focus, and a candidate who slipped once should get
 * a warning before a seven-day cooldown.
 *
 * The webcam is mandatory too (same day): what the in-browser check holds
 * against the frame — no face, a second face, the head turned away, a phone
 * in view, the camera switched off — is a breach on the same count, not a
 * limit of its own. The frames never leave the browser; only the cause does.
 *
 * Placement tests (routes/mock-tests.ts) are proctored by these same rules
 * since 2026-10-05 — the limit, the causes, recordBreach, isMobileClient —
 * so a change here changes both.
 */
export const BREACH_LIMIT = 3;

/** What a breach is made of: a departure's signals, or a webcam finding. A blocked paste is neither. */
export const BREACH_CAUSES = ["tabHidden", "fullscreenExit", "focusLost", "noFace", "multipleFaces", "lookingAway", "phone", "cameraOff"] as const;
export type BreachCause = (typeof BREACH_CAUSES)[number];

export const breachCausesOf = (value: unknown): BreachCause[] =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is BreachCause => (BREACH_CAUSES as readonly unknown[]).includes(v)))] : [];

/**
 * One departure: each cause's counter and the breach count go up by one.
 * `ended` is true from the breach that reaches the limit on — the caller
 * closes the sitting.
 */
export function recordBreach(signals: Signals, causes: readonly BreachCause[]): { signals: Signals; breaches: number; ended: boolean } {
  const next: Signals = { ...signals };
  for (const cause of causes) next[cause] = Math.min(SIGNAL_CAP, (next[cause] ?? 0) + 1);
  const breaches = Math.min(SIGNAL_CAP, (next.breaches ?? 0) + 1);
  next.breaches = breaches;
  return { signals: next, breaches, ended: breaches >= BREACH_LIMIT };
}

/**
 * The bars a sitting is flagged at. Generous on purpose: a flag only puts
 * the sitting in front of a reviewer, and a candidate who glanced at a
 * notification twice has not cheated. A coding answer that is nearly the
 * published editorial line for line is a different matter.
 */
export const FLAG_THRESHOLDS = {
  tabHidden: 6,
  paste: 4,
  fullscreenExit: 4,
  focusLost: 4,
  similarity: 0.85,
} as const;

const CAMERA_FLAG_TEXT: ReadonlyArray<[BreachCause, string]> = [
  ["phone", "A phone was seen on camera"],
  ["multipleFaces", "Another person was seen on camera"],
  ["noFace", "Out of the camera's view"],
  ["lookingAway", "Looked away from the screen"],
  ["cameraOff", "The camera was switched off"],
];

/**
 * Is the request from a phone or a tablet? Skill and placement tests are sat
 * on a laptop or desktop only; the runner says so before the click, this refuses the
 * click that got past it. Chromium's `Sec-CH-UA-Mobile` first, then the user
 * agent. An iPad presents itself as a Mac here — only the browser can tell
 * (frontend lib/proctor/device.ts).
 */
export function isMobileClient(headers: { [name: string]: string | string[] | undefined }): boolean {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  if (one(headers["sec-ch-ua-mobile"]).trim() === "?1") return true;
  return /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(one(headers["user-agent"]));
}

export function flagsFor(signals: Signals, similarities: ReadonlyArray<{ title: string; similarity: number }>): string[] {
  const flags: string[] = [];
  const tab = signals.tabHidden ?? 0;
  const paste = signals.paste ?? 0;
  const fullscreen = signals.fullscreenExit ?? 0;
  const focus = signals.focusLost ?? 0;
  const breaches = signals.breaches ?? 0;
  if (breaches >= BREACH_LIMIT) flags.push(`Ended automatically after ${breaches} warnings`);
  if (tab >= FLAG_THRESHOLDS.tabHidden) flags.push(`Left the test tab ${tab} times`);
  if (paste >= FLAG_THRESHOLDS.paste) flags.push(`Tried to paste into the editor ${paste} times`);
  if (fullscreen >= FLAG_THRESHOLDS.fullscreenExit) flags.push(`Left full screen ${fullscreen} times`);
  if (focus >= FLAG_THRESHOLDS.focusLost) flags.push(`Switched to another window ${focus} times`);
  // Every webcam finding is named: each was already a warning, and a
  // reviewer reading a sitting wants to know a phone was seen even once.
  for (const [cause, what] of CAMERA_FLAG_TEXT) {
    const n = signals[cause] ?? 0;
    if (n > 0) flags.push(`${what} ${n === 1 ? "once" : `${n} times`}`);
  }
  for (const answer of similarities) {
    if (answer.similarity >= FLAG_THRESHOLDS.similarity) {
      flags.push(`"${answer.title}" matches the published editorial solution (${Math.round(answer.similarity * 100)}%)`);
    }
  }
  return flags;
}
