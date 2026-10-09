import { companyKey } from "./readiness.js";

/**
 * The application tracker's rules (Phase 8 of ADAPTIVE_COACH.md, §15), pure:
 * what a row may hold, the stages in order, how a row is matched to a company
 * the site knows (so it can link to readiness and that company's simulation),
 * and the tracker's summary. Pinned by applications.test.ts.
 *
 * Private by design: nothing here is ever on the public profile. A company is
 * free text — a startup the site has never heard of is as trackable as TCS —
 * and only a loose name match (lib/readiness companyKey, so "HCLTech" is
 * "HCL") turns a row into links.
 */

export const STAGES = ["saved", "applied", "assessment", "interviewing", "offer", "rejected", "withdrawn"] as const;
export type Stage = (typeof STAGES)[number];

/** Stages still in play — the ones a next date matters for. */
export const OPEN_STAGES: ReadonlySet<Stage> = new Set(["saved", "applied", "assessment", "interviewing"]);

export const SOURCES = ["on-campus", "off-campus", "referral", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const APPLICATION_LIMITS = { company: 120, role: 120, link: 500, nextLabel: 80, notes: 4_000, perAccount: 200 } as const;

export interface ApplicationData {
  company: string;
  role: string;
  stage: Stage;
  source: Source | null;
  link: string | null;
  appliedOn: Date | null;
  nextOn: Date | null;
  nextLabel: string | null;
  notes: string | null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MS = 366 * 86_400_000;

function text(v: unknown, max: number, field: string, required: boolean): { value: string | null } | { error: string } {
  if (v == null || (typeof v === "string" && !v.trim())) return required ? { error: `Give the ${field}.` } : { value: null };
  if (typeof v !== "string") return { error: `The ${field} must be text.` };
  const t = v.replace(/\s+/g, " ").trim();
  if (t.length > max) return { error: `Keep the ${field} under ${max} characters.` };
  return { value: t };
}

function day(v: unknown, field: string, now: number): { value: Date | null } | { error: string } {
  if (v == null || v === "") return { value: null };
  if (typeof v !== "string" || !DATE.test(v)) return { error: `Give the ${field} as YYYY-MM-DD.` };
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || Math.abs(d.getTime() - now) > 3 * YEAR_MS) return { error: `That ${field} is not a usable date.` };
  return { value: d };
}

/** A link, only http(s) — it is rendered as an anchor on the owner's page. */
function link(v: unknown): { value: string | null } | { error: string } {
  const t = text(v, APPLICATION_LIMITS.link, "link", false);
  if ("error" in t || t.value == null) return t;
  try {
    const u = new URL(t.value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "The link must start with https://." };
    return { value: u.toString() };
  } catch {
    return { error: "That link is not a web address." };
  }
}

/**
 * A row from a request body. `partial` (an edit) takes only the fields
 * present; a create needs a company and a role, and starts at "applied"
 * unless a stage is given.
 */
export function parseApplication(body: unknown, partial: boolean, now = Date.now()): { data: Partial<ApplicationData> } | { error: string } {
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(b, k);
  const data: Partial<ApplicationData> = {};
  const take = <K extends keyof ApplicationData>(k: K, r: { value: unknown } | { error: string }): string | null => {
    if ("error" in r) return r.error;
    data[k] = r.value as ApplicationData[K];
    return null;
  };
  const steps: Array<[keyof ApplicationData, () => { value: unknown } | { error: string }]> = [
    ["company", () => text(b["company"], APPLICATION_LIMITS.company, "company", true)],
    ["role", () => text(b["role"], APPLICATION_LIMITS.role, "role", true)],
    [
      "stage",
      () => {
        if (!has("stage") && !partial) return { value: "applied" };
        return (STAGES as readonly unknown[]).includes(b["stage"]) ? { value: b["stage"] } : { error: "Pick a stage from the list." };
      },
    ],
    ["source", () => (b["source"] == null || b["source"] === "" ? { value: null } : (SOURCES as readonly unknown[]).includes(b["source"]) ? { value: b["source"] } : { error: "Pick where it came from from the list." })],
    ["link", () => link(b["link"])],
    ["appliedOn", () => day(b["appliedOn"], "applied date", now)],
    ["nextOn", () => day(b["nextOn"], "next date", now)],
    ["nextLabel", () => text(b["nextLabel"], APPLICATION_LIMITS.nextLabel, "next step", false)],
    ["notes", () => {
      if (b["notes"] == null || b["notes"] === "") return { value: null };
      if (typeof b["notes"] !== "string") return { error: "Notes must be text." };
      const t = b["notes"].replace(/\r\n?/g, "\n").trim();
      return t.length > APPLICATION_LIMITS.notes ? { error: `Keep the notes under ${APPLICATION_LIMITS.notes.toLocaleString("en-US")} characters.` } : { value: t || null };
    }],
  ];
  for (const [key, run] of steps) {
    // A create reads every field (stage defaults); an edit only those sent.
    if (partial && !has(key)) continue;
    const err = take(key, run());
    if (err) return { error: err };
  }
  if (partial && Object.keys(data).length === 0) return { error: "Nothing to change." };
  return { data };
}

// ── Matching a row to the site ────────────────────────────────────

export interface CompanyLinks {
  /** The site's spelling of the company, when it knows it. */
  company: string | null;
  /** /readiness?company=…, when readiness can read the company. */
  readiness: string | null;
  /** /simulations/<slug>, when the company has a simulation. */
  simulation: string | null;
}

export function linksFor(company: string, known: ReadonlyArray<{ name: string }>, simulations: ReadonlyArray<{ slug: string; company: string }>): CompanyLinks {
  const key = companyKey(company);
  if (!key) return { company: null, readiness: null, simulation: null };
  const hit = known.find((c) => companyKey(c.name) === key) ?? null;
  const sim = simulations.find((s) => companyKey(s.company) === key) ?? null;
  return {
    company: hit?.name ?? sim?.company ?? null,
    readiness: hit ? `/readiness?company=${encodeURIComponent(hit.name)}` : null,
    simulation: sim ? `/simulations/${sim.slug}` : null,
  };
}

// ── The summary ───────────────────────────────────────────────────

export interface TrackerSummary {
  total: number;
  byStage: Record<Stage, number>;
  /** Open applications with a next date from today on, soonest first (at most five). */
  upcoming: Array<{ id: string; company: string; role: string; nextOn: string; nextLabel: string | null; daysLeft: number }>;
}

const dayStart = (ms: number) => Math.floor(ms / 86_400_000);

export function summaryOf(rows: ReadonlyArray<{ id: string; company: string; role: string; stage: string; nextOn: Date | null; nextLabel: string | null }>, now = Date.now()): TrackerSummary {
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const r of rows) if ((STAGES as readonly string[]).includes(r.stage)) byStage[r.stage as Stage] += 1;
  const today = dayStart(now);
  const upcoming = rows
    .filter((r) => r.nextOn && OPEN_STAGES.has(r.stage as Stage) && dayStart(r.nextOn.getTime()) >= today)
    .map((r) => ({ id: r.id, company: r.company, role: r.role, nextOn: r.nextOn!.toISOString().slice(0, 10), nextLabel: r.nextLabel, daysLeft: dayStart(r.nextOn!.getTime()) - today }))
    .sort((a, b) => a.daysLeft - b.daysLeft || a.company.localeCompare(b.company))
    .slice(0, 5);
  return { total: rows.length, byStage, upcoming };
}
