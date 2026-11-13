import { z } from "zod";
import { fenced } from "./submission-review.js";

/**
 * System design practice (2026-11-14, the owner's System Design track: learn →
 * practise → interview). The member designs one classic system on a canvas —
 * requirements, estimates, API, data model, the components and how a request
 * flows through them, the bottlenecks and trade-offs — and a model reviews it
 * against one fixed rubric, the "Why it failed" pattern applied to a design.
 *
 * Content as code (no seed): `DESIGN_PROBLEMS` names each problem, its brief
 * and the note that teaches it; the reference design is that note, so the
 * review never has to hold one. Pure — the call is services/design-practice.ts
 * through lib/ai; design-practice.test.ts pins it. The score teaches and feeds
 * the `int:design` interview skill (services/skill-profile); it pays nothing.
 */

export interface DesignProblem {
  slug: string;
  title: string;
  /** What to design, as an interviewer would open. */
  brief: string;
  /** The scale stated to the candidate, so estimates have something to work from. */
  scale: string;
  /** The System Design note that walks through a reference design. */
  note: string;
  level: "beginner" | "intermediate" | "advanced";
  /** What a strong answer must not miss — told to the reviewer, never shown before a review. */
  mustCover: string[];
}

export const DESIGN_PROBLEMS: readonly DesignProblem[] = [
  {
    slug: "url-shortener",
    title: "Design a URL Shortener",
    brief: "Users paste a long URL and get a short one; opening the short link redirects to the original.",
    scale: "100 million new links a month, read 100 times more often than they are written; links live for years.",
    note: "design-a-url-shortener",
    level: "beginner",
    mustCover: ["key generation without collisions (counter + base62 or hashing with a check)", "read-heavy: cache hot links", "301 vs 302 redirect choice", "storage estimate over years"],
  },
  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter",
    brief: "Limit how many requests each client may make to an API, across a fleet of API servers.",
    scale: "50,000 requests a second across 20 API servers; limits like 100 requests a minute per user.",
    note: "rate-limiting",
    level: "beginner",
    mustCover: ["an algorithm (token bucket, sliding window) and why", "shared counters in a fast store such as Redis with atomic updates", "what the client is told (429, retry-after)", "behaviour when the limiter's store is down"],
  },
  {
    slug: "chat-app",
    title: "Design a Chat App",
    brief: "One-to-one and small group chat with delivery and read receipts, online presence and message history.",
    scale: "50 million daily users, each sending about 40 messages a day; groups up to 100 people.",
    note: "design-a-chat-app",
    level: "intermediate",
    mustCover: ["persistent connections (WebSockets) and how a message finds the recipient's server", "message ordering per conversation and delivery to offline users", "storage of history (a wide-column or partitioned store keyed by conversation)", "presence without flooding the system"],
  },
  {
    slug: "news-feed",
    title: "Design a News Feed",
    brief: "Users follow others and see a feed of recent posts from the people they follow, newest or ranked first.",
    scale: "300 million daily users; the average user follows 200 accounts; some accounts have tens of millions of followers.",
    note: "design-a-news-feed",
    level: "intermediate",
    mustCover: ["fan-out on write vs fan-out on read, and a hybrid for very large accounts", "a feed cache per user", "pagination with cursors", "media served from object storage and a CDN"],
  },
  {
    slug: "notification-system",
    title: "Design a Notification System",
    brief: "Send push, SMS and email notifications for many product events, honouring each user's preferences.",
    scale: "10 million notifications a day with bursts of 10 times the average; three delivery channels.",
    note: "design-a-notification-system",
    level: "intermediate",
    mustCover: ["a queue between producers and per-channel workers", "retries with backoff and idempotency so nothing is sent twice", "user preferences and rate limits per user", "third-party provider failures"],
  },
  {
    slug: "file-storage",
    title: "Design a File Storage Service",
    brief: "Users upload files from any device; files sync across their devices and can be shared.",
    scale: "50 million users with 10 GB each on average; files up to a few GB.",
    note: "design-file-storage",
    level: "advanced",
    mustCover: ["chunking large files and hashing chunks for dedup and resumable upload", "metadata store separate from blob storage", "sync: notifying devices of changes and uploading only changed chunks", "conflicting edits"],
  },
  {
    slug: "ride-hailing",
    title: "Design a Ride-Hailing App",
    brief: "Riders request a ride; the system finds a nearby available driver, tracks the trip and charges the rider.",
    scale: "1 million active drivers sending a location every 4 seconds; 20,000 ride requests a minute at peak.",
    note: "design-ride-hailing",
    level: "advanced",
    mustCover: ["a geospatial index (geohash, quadtree) for nearby drivers", "high-frequency location updates kept in memory, not the main database", "matching and avoiding two riders getting one driver", "a trip state machine"],
  },
  {
    slug: "web-crawler",
    title: "Design a Web Crawler",
    brief: "Crawl the web from a set of seed URLs, store the pages, and keep crawling newly found links.",
    scale: "1 billion pages a month; pages average 100 KB.",
    note: "design-a-web-crawler",
    level: "advanced",
    mustCover: ["a URL frontier with per-host politeness", "robots.txt", "dedup of URLs and of page content", "distributing the work across many workers"],
  },
  {
    slug: "search-autocomplete",
    title: "Design Search Autocomplete",
    brief: "As a user types into a search box, suggest the top completions for what they have typed so far.",
    scale: "10 million daily users, a suggestion request on every keystroke, answers within 100 ms.",
    note: "design-search-autocomplete",
    level: "intermediate",
    mustCover: ["a trie (or prefix index) with top-k suggestions per prefix", "building it offline from query logs and refreshing periodically", "caching and replication for the read volume", "debouncing on the client"],
  },
];

export const problemBySlug = (slug: string): DesignProblem | undefined => DESIGN_PROBLEMS.find((p) => p.slug === slug);

/**
 * The canvas's component palette. Picked components are drawn as the
 * member's architecture (by `layer`, left to right) and named to the
 * reviewer; the flow text says how they connect.
 */
export const COMPONENTS = [
  { key: "client", label: "Client", layer: 0 },
  { key: "dns", label: "DNS", layer: 1 },
  { key: "cdn", label: "CDN", layer: 1 },
  { key: "load-balancer", label: "Load balancer", layer: 1 },
  { key: "api-gateway", label: "API gateway", layer: 1 },
  { key: "rate-limiter", label: "Rate limiter", layer: 1 },
  { key: "app-server", label: "App servers", layer: 2 },
  { key: "websocket", label: "WebSocket servers", layer: 2 },
  { key: "worker", label: "Workers", layer: 2 },
  { key: "cache", label: "Cache", layer: 3 },
  { key: "queue", label: "Message queue", layer: 3 },
  { key: "search", label: "Search index", layer: 3 },
  { key: "sql", label: "SQL database", layer: 4 },
  { key: "nosql", label: "NoSQL store", layer: 4 },
  { key: "object-store", label: "Object storage", layer: 4 },
  { key: "analytics", label: "Analytics / logs", layer: 4 },
] as const;
export type ComponentKey = (typeof COMPONENTS)[number]["key"];
const COMPONENT_KEYS = new Set<string>(COMPONENTS.map((c) => c.key));

/** The canvas's sections, in the order the page asks them — and each one's cap. */
export const ANSWER_FIELDS = [
  { key: "functional", label: "Functional requirements", max: 1_500 },
  { key: "nonFunctional", label: "Non-functional requirements", max: 1_500 },
  { key: "estimates", label: "Capacity estimates", max: 1_500 },
  { key: "api", label: "API", max: 2_000 },
  { key: "dataModel", label: "Data model", max: 2_000 },
  { key: "flow", label: "How a request flows", max: 2_000 },
  { key: "deepDive", label: "Bottlenecks and trade-offs", max: 2_500 },
] as const;
export type AnswerField = (typeof ANSWER_FIELDS)[number]["key"];
export type DesignAnswer = Record<AnswerField, string> & { components: ComponentKey[] };

/** Below this much written, a review would only say "write more". */
export const MIN_ANSWER_CHARS = 300;

export function emptyAnswer(): DesignAnswer {
  return { functional: "", nonFunctional: "", estimates: "", api: "", dataModel: "", flow: "", deepDive: "", components: [] };
}

/** The answer as stored, or why it cannot be reviewed. Unknown components are dropped, never an error. */
export function parseAnswer(raw: unknown): { answer: DesignAnswer } | { error: string } {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!o) return { error: "Send the design as an object." };
  const answer = emptyAnswer();
  for (const f of ANSWER_FIELDS) {
    const v = o[f.key];
    if (v !== undefined && typeof v !== "string") return { error: `${f.label} must be text.` };
    const text = (v ?? "").replace(/\r\n?/g, "\n").trim();
    if (text.length > f.max) return { error: `${f.label} is over ${f.max.toLocaleString("en-US")} characters.` };
    answer[f.key] = text;
  }
  const comps = Array.isArray(o["components"]) ? o["components"] : [];
  answer.components = [...new Set(comps.filter((c): c is ComponentKey => typeof c === "string" && COMPONENT_KEYS.has(c)))];
  const written = ANSWER_FIELDS.reduce((n, f) => n + answer[f.key].length, 0);
  if (written < MIN_ANSWER_CHARS) return { error: `Write at least ${MIN_ANSWER_CHARS} characters across the sections before asking for a review.` };
  return { answer };
}

/* ── The rubric ───────────────────────────────────────────────────── */

export interface DesignCriterion {
  key: "requirements" | "estimates" | "interfaces" | "architecture" | "tradeoffs";
  label: string;
  max: number;
  asks: string;
}

export const DESIGN_RUBRIC: readonly DesignCriterion[] = [
  { key: "requirements", label: "Requirements", max: 20, asks: "States the functional requirements in scope and the non-functional ones that drive the design (scale, latency, availability, consistency), and leaves out what is out of scope." },
  { key: "estimates", label: "Scale estimates", max: 15, asks: "Turns the stated scale into requests per second (average and peak), storage and bandwidth, with the arithmetic shown, and uses the numbers to make a decision." },
  { key: "interfaces", label: "API and data model", max: 20, asks: "Defines the main API calls with their inputs and outputs, and a data model whose keys and store fit the access patterns." },
  { key: "architecture", label: "Architecture", max: 25, asks: "Chooses components that fit the requirements and explains how a request moves through them, for the main read and write paths." },
  { key: "tradeoffs", label: "Bottlenecks and trade-offs", max: 20, asks: "Names the real bottlenecks and failure points at this scale and how the design handles them, weighing the alternatives (consistency vs availability, push vs pull, cost)." },
];
export const DESIGN_POINTS = DESIGN_RUBRIC.reduce((n, c) => n + c.max, 0);

const componentLabel = (k: string) => COMPONENTS.find((c) => c.key === k)?.label ?? k;

/** The messages for one review. The design is the member's text, fenced as data. */
export function buildDesignMessages(problem: DesignProblem, answer: DesignAnswer, system: string): Array<{ role: "system" | "user"; content: string }> {
  const rubric = DESIGN_RUBRIC.map((c) => `- ${c.key} (0–${c.max}): ${c.asks}`).join("\n");
  const design = [
    ...ANSWER_FIELDS.map((f) => `## ${f.label}\n${answer[f.key] || "(left empty)"}`),
    `## Components chosen\n${answer.components.length ? answer.components.map(componentLabel).join(", ") : "(none chosen)"}`,
  ].join("\n\n");
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        `PROBLEM: ${problem.title}`,
        `BRIEF: ${problem.brief}`,
        `SCALE GIVEN TO THE CANDIDATE: ${problem.scale}`,
        `A STRONG ANSWER COVERS (for you; the candidate did not see this list): ${problem.mustCover.map((m) => `\n- ${m}`).join("")}`,
        `RUBRIC:\n${rubric}`,
        fenced("DESIGN", design),
      ].join("\n\n"),
    },
  ];
}

export const DesignReviewSchema = z.object({
  criteria: z.array(z.object({ key: z.string(), score: z.number(), note: z.string() })),
  summary: z.string(),
  strengths: z.array(z.string()),
  missed: z.array(z.string()),
  confidence: z.string(),
});
export type RawDesignReview = z.infer<typeof DesignReviewSchema>;

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(str) : typeof v === "string" && v ? [v] : []);

/** The model's reply into the schema's shape: stringly numbers, a list given as one string. */
export function coerceDesignReview(raw: unknown): unknown {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const criteria = Array.isArray(o["criteria"]) ? o["criteria"] : [];
  return {
    criteria: criteria.map((c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      const score = typeof r["score"] === "number" ? r["score"] : typeof r["score"] === "string" && /^-?\d+(\.\d+)?$/.test(r["score"]) ? Number(r["score"]) : 0;
      return { key: str(r["key"]), score, note: str(r["note"]) };
    }),
    summary: str(o["summary"]),
    strengths: list(o["strengths"]),
    missed: list(o["missed"]),
    confidence: str(o["confidence"]),
  };
}

export interface DesignReview {
  criteria: Array<{ key: DesignCriterion["key"]; label: string; score: number; max: number; note: string }>;
  summary: string;
  strengths: string[];
  missed: string[];
  confidence: "low" | "medium" | "high";
  /** 0–100. */
  score: number;
}

const tidy = (text: string, max: number): string => {
  const s = text.replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/**
 * Every criterion in the rubric's order, clamped to its points — one the
 * model skipped scores 0 ("Not addressed."), one it invented is dropped.
 * Null when nothing was scored. A section the member left empty cannot earn
 * points whatever the model says: requirements, estimates and the interface
 * criterion are capped at 0 when every field they read is empty.
 */
export function guardDesignReview(raw: RawDesignReview, answer: DesignAnswer): DesignReview | null {
  const given = new Map(raw.criteria.map((c) => [c.key.trim().toLowerCase(), c]));
  if (!DESIGN_RUBRIC.some((c) => given.has(c.key.toLowerCase()))) return null;
  const empty: Record<DesignCriterion["key"], boolean> = {
    requirements: !answer.functional && !answer.nonFunctional,
    estimates: !answer.estimates,
    interfaces: !answer.api && !answer.dataModel,
    architecture: !answer.flow && answer.components.length === 0,
    tradeoffs: !answer.deepDive,
  };
  const criteria = DESIGN_RUBRIC.map((c) => {
    const r = given.get(c.key.toLowerCase());
    const score = empty[c.key] ? 0 : r && Number.isFinite(r.score) ? Math.min(c.max, Math.max(0, Math.round(r.score))) : 0;
    const note = empty[c.key] ? "Left empty." : r ? tidy(r.note, 260) || (score ? "" : "Not addressed.") : "Not addressed.";
    return { key: c.key, label: c.label, score, max: c.max, note };
  });
  return {
    criteria,
    summary: tidy(raw.summary, 400),
    strengths: raw.strengths.map((s) => tidy(s, 200)).filter(Boolean).slice(0, 3),
    missed: raw.missed.map((m) => tidy(m, 220)).filter(Boolean).slice(0, 4),
    confidence: (["low", "medium", "high"] as const).find((c) => c === raw.confidence.trim().toLowerCase()) ?? "medium",
    score: Math.round((criteria.reduce((n, c) => n + c.score, 0) / DESIGN_POINTS) * 100),
  };
}

/** The problem's level as the skill scorer reads an assessment's. */
export const assessmentLevel = (p: DesignProblem): "basic" | "intermediate" | "advanced" => (p.level === "beginner" ? "basic" : p.level);
