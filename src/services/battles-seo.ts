import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { escapeHtml } from "../lib/markdown-html.js";
import { BATTLES_URL } from "../lib/sites.js";
import { tournamentPhase, type TournamentPhase } from "./battles-rules.js";

/**
 * What a search engine is told about the tournament site's own content —
 * a tournament's page (/t/<slug>) and an organizer's (/o/<slug>) on
 * battles.codekairo.com. services/seo.ts is the same thing for the main
 * site; this is its twin, kept apart because the two sites have different
 * origins, brands and page shapes.
 *
 * Three readers take one answer, so the words cannot disagree:
 *  - the Battles Worker (battles/worker) asks `battlesHead(path)` through
 *    GET /api/seo/battles/head and writes the title, description,
 *    canonical, JSON-LD (built from `facts` by battles/src/seo/
 *    structured-data) and `content` into the page before it leaves the
 *    edge, for crawlers that never run JavaScript;
 *  - the tournament and organizer payloads the app reads carry the same
 *    `seo` block (services/battles.ts), and the pages set their runtime
 *    head from it;
 *  - the sitemaps list exactly the pages that answer `index: true`.
 *
 * Only what the page shows a visitor is said here, and nothing about
 * people: no entrant, player or team names, even where the bracket or the
 * board shows them — those pages stay out of search. A tournament is
 * public (and so indexable) only when it is published by a verified
 * organization; anything else is a 404 here, as it is on the page.
 */

/** The tournament site's canonical origin: production's, or the configured one in development. */
export const BATTLES_ORIGIN = BATTLES_URL || "https://battles.codekairo.com";

const BRAND = "CodeKairo Battles";
const DESCRIPTION_MAX = 158;
const HEAD_TTL_MS = 5 * 60 * 1000;
const SITEMAP_TTL_MS = 15 * 60 * 1000;

export interface Crumb {
  name: string;
  path: string;
}

/**
 * The SPA's BattlesFacts (battles/src/seo/structured-data.ts), mirrored:
 * the fields a tournament's Event node and an organizer's node are built
 * from. Dates are ISO instants.
 */
export type BattlesFacts =
  | {
      kind: "tournament";
      name: string;
      format: "knockout" | "icpc";
      formatName: string;
      startDate: string;
      /** An ICPC contest ends on its clock; a knockout when its final is decided (unknown until then). */
      endDate?: string;
      registrationCloses: string;
      cancelled: boolean;
      phase: TournamentPhase;
      organizer: { name: string; path: string };
      entries: number;
      capacity: number | null;
      teamSize: number;
      description?: string;
      trail: Crumb[];
    }
  | {
      kind: "org";
      name: string;
      orgKind: string;
      city?: string;
      website?: string;
      about?: string;
      tournaments: number;
      trail: Crumb[];
    };

export interface BattlesHead {
  path: string;
  title: string;
  description: string;
  /** Whether the page belongs in search results (a cancelled tournament, an organizer with nothing published, does not). */
  index: boolean;
  facts: BattlesFacts;
  /** The page's text as safe HTML, for the prerendered body. */
  content: string;
  /** The breadcrumb label: the page's own name. */
  crumb: string;
}

/** The part of a head a page needs at runtime (the payloads carry it; no body). */
export type BattlesSeo = Omit<BattlesHead, "content">;

/* ── Words ─────────────────────────────────────────────────────── */

const FORMAT_TITLE = { knockout: "1v1 Coding Knockout", icpc: "ICPC-Style Coding Contest" } as const;
const FORMAT_NAME = { knockout: "1v1 knockout", icpc: "ICPC-style contest" } as const;
const PHASE_LABEL: Record<TournamentPhase, string> = {
  draft: "Draft",
  cancelled: "Cancelled",
  registration: "Registration open",
  registration_closed: "Registration closed",
  live: "Live now",
  finished: "Finished",
};
const ORG_KIND: Record<string, string> = { college: "College", club: "Club", company: "Company", community: "Community" };

const IST = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const IST_DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
/**
 * "Sat, 3 Oct 2026, 10:00 IST" — the product's calendar is Indian time
 * (the handbook says so too). Assembled from the parts: ICU's en-IN
 * pattern puts a comma after the month ("3 Oct, 2026").
 */
export function istTime(d: Date): string {
  const p = Object.fromEntries(IST.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p["weekday"]}, ${p["day"]} ${p["month"]} ${p["year"]}, ${p["hour"]}:${p["minute"]} IST`;
}
const istDate = (d: Date) => IST_DATE.format(d);

function minutes(n: number): string {
  const h = Math.floor(n / 60);
  const m = n % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

/** Whole sentences up to the limit — a description is never cut mid-word. */
function fit(sentences: string[], max = DESCRIPTION_MAX): string {
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out || sentences[0]!.slice(0, max);
}

const h = escapeHtml;
const link = (href: string, label: string) => `<a href="${h(href)}">${h(label)}</a>`;
/** Plain text as the page shows it (white-space: pre-line): blank lines part paragraphs, single newlines break lines. */
const paragraphs = (text: string) =>
  text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${h(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
const factList = (pairs: Array<[string, string | null | undefined, boolean?]>) =>
  `<ul class="facts">${pairs
    .filter((p) => Boolean(p[1]))
    .map(([k, v, html]) => `<li><strong>${h(k)}:</strong> ${html ? v : h(v!)}</li>`)
    .join("")}</ul>`;
const section = (title: string, html: string) => (html.trim() ? `<section><h2>${h(title)}</h2>${html}</section>` : "");

const TOURNAMENTS: Crumb = { name: "Tournaments", path: "/tournaments" };
const HOME: Crumb = { name: "Battles", path: "/" };

/* ── A tournament ──────────────────────────────────────────────── */

/** What `tournamentSeo` reads — the columns services/battles.ts already loads for the page. */
export interface TournamentRow {
  slug: string;
  title: string;
  description: string | null;
  format: string;
  status: string;
  teamSize: number;
  capacity: number | null;
  registrationClosesAt: Date;
  startsAt: Date;
  durationMinutes: number;
  finishedAt: Date | null;
  allowedDomains: unknown;
  inviteCode: string | null;
  requiresApproval: boolean;
  org: { slug: string; name: string; verifiedAt: Date | null };
  entries: number;
  problems: number;
}

const domainsOf = (v: unknown): string[] => (Array.isArray(v) ? v.filter((d): d is string => typeof d === "string") : []);

/** Who may enter, in one sentence — the registration panel's rules, joined. */
function entryRule(t: TournamentRow): string {
  if (t.format === "icpc") return "Teams are entered by the organizer.";
  const domains = domainsOf(t.allowedDomains);
  const who = domains.length ? `Open to ${domains.map((d) => `@${d}`).join(", ")} email addresses` : "Open to every CodeKairo account";
  const extra = [t.inviteCode ? "with the organizer's invite code" : null, t.requiresApproval ? "subject to the organizer's approval" : null].filter(Boolean);
  return `${who}${extra.length ? `, ${extra.join(" and ")}` : ""}.`;
}

/**
 * A tournament's head, or null when it is not public — a draft, or one of an
 * organization CodeKairo has not verified: the page 404s for them too.
 */
export function tournamentSeo(t: TournamentRow, now = new Date()): BattlesHead | null {
  if (t.status === "draft" || !t.org.verifiedAt) return null;
  const format = t.format === "icpc" ? "icpc" : "knockout";
  const phase = tournamentPhase(t, now);
  const path = `/t/${t.slug}`;
  const orgPath = `/o/${t.org.slug}`;
  const formatLower = format === "icpc" ? `ICPC-style coding contest for teams of up to ${t.teamSize}` : "1v1 coding knockout";
  const when =
    phase === "cancelled"
      ? "It was cancelled."
      : phase === "finished"
        ? `It was held on ${istDate(t.startsAt)}.`
        : `It starts ${istTime(t.startsAt)}.`;
  const places = t.capacity ? `${t.entries} of ${t.capacity} places taken` : `${t.entries} ${format === "icpc" ? "entrants" : "players"} so far`;

  const title = `${t.title} — ${FORMAT_TITLE[format]} by ${t.org.name} — ${BRAND}`;
  const description = fit([`${t.title}: ${format === "icpc" ? "an" : "a"} ${formatLower} hosted by ${t.org.name}.`, when, entryRule(t), "Free, judged live in 13 languages."]);

  const endDate = format === "icpc" ? new Date(t.startsAt.getTime() + t.durationMinutes * 60_000) : t.finishedAt;
  const trail = [HOME, TOURNAMENTS, { name: t.title, path }];

  const how =
    format === "icpc"
      ? `<p>Every team works the same problem set on one clock. The board ranks by problems solved, then penalty time — the minutes to each first accepted solution plus 20 for every rejected attempt before it. ${link("/icpc-contest", "How an ICPC-style contest works")} · ${link("/rules", "the full rules")}</p>`
      : `<p>Players check in during the hour before the start and are seeded by CodeKairo rating. Each match is one problem on a clock: the first accepted solution wins, or at time the most hidden tests passed. ${link("/knockout", "How a knockout works")} · ${link("/rules", "the full rules")}</p>`;
  const takingPart =
    format === "icpc"
      ? `<p>The organizer enters every team by CodeKairo email or username; members sign in with their own accounts and solve in any of 13 languages. Every accepted solve counts on the solver's CodeKairo profile. ${link("/for-players", "Taking part")}</p>`
      : `<p>Register on this page before registration closes, then check in during the hour before the start. Solve in any of 13 languages; every accepted solve counts on your CodeKairo profile. ${link("/for-players", "Taking part")}</p>`;

  const content = [
    `<p>${link(orgPath, t.org.name)} hosts this ${h(FORMAT_NAME[format])}. ${h(PHASE_LABEL[phase])}.</p>`,
    factList([
      ["Organizer", link(orgPath, t.org.name), true],
      ["Format", format === "icpc" ? `ICPC-style contest, teams of up to ${t.teamSize}` : "1v1 knockout"],
      ["Starts", istTime(t.startsAt)],
      [format === "icpc" ? "Contest length" : "Each match", minutes(t.durationMinutes)],
      ["Registration closes", format === "icpc" ? null : istTime(t.registrationClosesAt)],
      ["Who may enter", entryRule(t)],
      [format === "icpc" ? "Entrants" : "Players", t.capacity ? `${t.entries} of ${t.capacity}` : String(t.entries)],
      ["Problems", t.problems ? `${t.problems}, revealed at the start` : null],
      ["Status", PHASE_LABEL[phase]],
    ]),
    t.description ? section("About this tournament", paragraphs(t.description)) : "",
    section("How it is decided", how),
    section("Taking part", takingPart),
    `<p>${link("/tournaments", "More tournaments")} · ${link(orgPath, `More from ${t.org.name}`)}</p>`,
  ].join("");

  return {
    path,
    title,
    description,
    index: phase !== "cancelled",
    crumb: t.title,
    content,
    facts: {
      kind: "tournament",
      name: t.title,
      format,
      formatName: FORMAT_NAME[format],
      startDate: t.startsAt.toISOString(),
      ...(endDate ? { endDate: endDate.toISOString() } : {}),
      registrationCloses: t.registrationClosesAt.toISOString(),
      cancelled: phase === "cancelled",
      phase,
      organizer: { name: t.org.name, path: orgPath },
      entries: t.entries,
      capacity: t.capacity,
      teamSize: t.teamSize,
      ...(t.description ? { description: t.description.slice(0, 500) } : {}),
      trail,
    },
  };
}

/* ── An organizer ──────────────────────────────────────────────── */

export interface OrgRow {
  slug: string;
  name: string;
  kind: string;
  website: string | null;
  city: string | null;
  about: string | null;
  verifiedAt: Date | null;
}

export interface OrgTournamentRow {
  slug: string;
  title: string;
  format: string;
  status: string;
  startsAt: Date;
  registrationClosesAt: Date;
  durationMinutes: number;
  finishedAt: Date | null;
}

/**
 * An organizer's head, or null when it is not public (unverified). With no
 * published tournament yet the page is served but not indexed: a name and
 * an empty list are not a search result.
 */
export function orgSeo(org: OrgRow, tournaments: OrgTournamentRow[], now = new Date()): BattlesHead | null {
  if (!org.verifiedAt) return null;
  const published = tournaments.filter((t) => t.status === "published");
  const path = `/o/${org.slug}`;
  const kind = ORG_KIND[org.kind] ?? "Organizer";
  const place = org.city ? `${org.name}, ${org.city}` : org.name;
  const count = published.length;

  const title = `${org.name}: Coding Competitions and Tournaments — ${BRAND}`;
  const description = fit([
    `Coding tournaments hosted by ${place} on ${BRAND}.`,
    count ? `${count} ${count === 1 ? "knockout or contest" : "knockouts and contests"} so far, judged live in 13 languages.` : "Judged live in 13 languages.",
    "A verified organizer.",
  ]);

  const rows = published
    .map((t) => {
      const format = t.format === "icpc" ? "icpc" : "knockout";
      const phase = tournamentPhase({ ...t, format }, now);
      return `<li>${link(`/t/${t.slug}`, t.title)} <span class="note">${h(`${FORMAT_NAME[format]} · ${istDate(t.startsAt)} · ${PHASE_LABEL[phase]}`)}</span></li>`;
    })
    .join("");

  const content = [
    factList([
      ["Kind", kind],
      ["City", org.city],
      // An organizer's own address, as the page shows it; nofollow, since
      // the organizer typed it.
      ["Website", org.website ? `<a href="${h(org.website)}" rel="nofollow noopener">${h(org.website.replace(/^https?:\/\//, ""))}</a>` : null, true],
      ["Verified", "by CodeKairo"],
    ]),
    org.about ? section(`About ${org.name}`, paragraphs(org.about)) : "",
    section("Tournaments", rows ? `<ul>${rows}</ul>` : "<p>No tournaments yet.</p>"),
    `<p>${link("/tournaments", "Every open tournament")} · ${link("/for-organizers", "Host a tournament of your own")}</p>`,
  ].join("");

  return {
    path,
    title,
    description,
    index: count > 0,
    crumb: org.name,
    content,
    facts: {
      kind: "org",
      name: org.name,
      orgKind: kind,
      ...(org.city ? { city: org.city } : {}),
      ...(org.website ? { website: org.website } : {}),
      ...(org.about ? { about: org.about.slice(0, 500) } : {}),
      tournaments: count,
      trail: [HOME, TOURNAMENTS, { name: org.name, path }],
    },
  };
}

/** The runtime part of a head: what the payloads carry. */
export const seoOf = (head: BattlesHead | null): BattlesSeo | null => {
  if (!head) return null;
  const { content: _content, ...rest } = head;
  return rest;
};

/* ── Lookups, for the Worker ───────────────────────────────────── */

const TOURNAMENT_SELECT = {
  slug: true,
  title: true,
  description: true,
  format: true,
  status: true,
  teamSize: true,
  capacity: true,
  registrationClosesAt: true,
  startsAt: true,
  durationMinutes: true,
  finishedAt: true,
  allowedDomains: true,
  inviteCode: true,
  requiresApproval: true,
  org: { select: { slug: true, name: true, verifiedAt: true } },
  _count: { select: { problems: true, entries: { where: { status: { in: ["pending", "approved"] } } } } },
} satisfies Prisma.TournamentSelect;

/** The head for a tournament-site URL the Worker asks about; null for anything that is not a public page. */
export async function battlesHead(path: string): Promise<BattlesHead | null> {
  let m: RegExpExecArray | null;
  if ((m = /^\/t\/([a-z0-9][a-z0-9-]*)$/.exec(path))) {
    const slug = m[1]!;
    return cached(`battles-seo:t:${slug}`, HEAD_TTL_MS, async () => {
      const t = await prisma.tournament.findUnique({ where: { slug }, select: TOURNAMENT_SELECT });
      if (!t) return null;
      const { _count, ...row } = t;
      return tournamentSeo({ ...row, entries: _count.entries, problems: _count.problems });
    });
  }
  if ((m = /^\/o\/([a-z0-9][a-z0-9-]*)$/.exec(path))) {
    const slug = m[1]!;
    return cached(`battles-seo:o:${slug}`, HEAD_TTL_MS, async () => {
      const org = await prisma.battleOrg.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, kind: true, website: true, city: true, about: true, verifiedAt: true } });
      if (!org?.verifiedAt) return null;
      const tournaments = await prisma.tournament.findMany({
        where: { orgId: org.id, status: "published" },
        orderBy: { startsAt: "desc" },
        take: 100,
        select: { slug: true, title: true, format: true, status: true, startsAt: true, registrationClosesAt: true, durationMinutes: true, finishedAt: true },
      });
      return orgSeo(org, tournaments);
    });
  }
  return null;
}

/* ── The list, for the prerendered index pages ─────────────────── */

/**
 * Every public tournament and organizer as links, for the Worker to write
 * into the prerendered /tournaments and home pages — whose lists are drawn
 * by the app, so without this a crawler reading raw HTML found tournament
 * pages only in the sitemap (seo-audit.mjs listed every one as an orphan).
 * The main site does the same for its index pages (services/seo.ts,
 * `section: "index"`). What is open or coming first, then what finished
 * lately, then the organizers — no names of people, as everywhere here.
 */
export function battlesIndexHtml(now = new Date()): Promise<string> {
  return cached("battles-seo:index", HEAD_TTL_MS, async () => {
    const [tournaments, orgs] = await Promise.all([
      prisma.tournament.findMany({
        where: { status: "published", org: { verifiedAt: { not: null } } },
        orderBy: { startsAt: "desc" },
        take: 200,
        select: { slug: true, title: true, format: true, status: true, startsAt: true, registrationClosesAt: true, durationMinutes: true, finishedAt: true, org: { select: { name: true } } },
      }),
      prisma.battleOrg.findMany({
        where: { verifiedAt: { not: null }, tournaments: { some: { status: "published" } } },
        orderBy: { name: "asc" },
        take: 200,
        select: { slug: true, name: true, city: true },
      }),
    ]);
    const row = (t: (typeof tournaments)[number]) => {
      const format = t.format === "icpc" ? "icpc" : "knockout";
      const phase = tournamentPhase({ ...t, format }, now);
      return { phase, html: `<li>${link(`/t/${t.slug}`, t.title)} <span class="note">${h(`${FORMAT_NAME[format]} · ${t.org.name} · ${istDate(t.startsAt)} · ${PHASE_LABEL[phase]}`)}</span></li>` };
    };
    const rows = tournaments.map(row);
    const open = rows.filter((r) => r.phase !== "finished").reverse(); // soonest first
    const done = rows.filter((r) => r.phase === "finished").slice(0, 60);
    return [
      section("Open and upcoming", open.length ? `<ul>${open.map((r) => r.html).join("")}</ul>` : "<p>No tournament is open right now.</p>"),
      done.length ? section("Recently finished", `<ul>${done.map((r) => r.html).join("")}</ul>`) : "",
      orgs.length ? section("Organizers", `<ul>${orgs.map((o) => `<li>${link(`/o/${o.slug}`, o.name)}${o.city ? ` <span class="note">${h(o.city)}</span>` : ""}</li>`).join("")}</ul>`) : "",
    ].join("");
  });
}

/* ── Sitemaps ──────────────────────────────────────────────────── */

export const BATTLES_SITEMAP_NAMES = ["tournaments", "organizers"] as const;

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlset(entries: Array<{ path: string; lastmod?: Date }>): string {
  const rows = entries.map((e) => `  <url>\n    <loc>${xml(BATTLES_ORIGIN + e.path)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>` : ""}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

/**
 * One of the tournament site's content sitemaps: exactly the pages whose
 * head says `index: true` — published tournaments of verified organizers
 * (a cancelled one is left out), and verified organizers with at least one
 * published tournament. lastmod is the row's own update time.
 */
export function battlesSitemapXml(name: string): Promise<string | null> {
  if (!(BATTLES_SITEMAP_NAMES as readonly string[]).includes(name)) return Promise.resolve(null);
  return cached(`battles-seo:sitemap:${name}`, SITEMAP_TTL_MS, async () => {
    if (name === "tournaments") {
      const rows = await prisma.tournament.findMany({
        where: { status: "published", org: { verifiedAt: { not: null } } },
        orderBy: { startsAt: "desc" },
        take: 45_000,
        select: { slug: true, updatedAt: true },
      });
      return urlset(rows.map((r) => ({ path: `/t/${r.slug}`, lastmod: r.updatedAt })));
    }
    const rows = await prisma.battleOrg.findMany({
      where: { verifiedAt: { not: null }, tournaments: { some: { status: "published" } } },
      orderBy: { name: "asc" },
      select: { slug: true, updatedAt: true },
    });
    return urlset(rows.map((r) => ({ path: `/o/${r.slug}`, lastmod: r.updatedAt })));
  });
}
