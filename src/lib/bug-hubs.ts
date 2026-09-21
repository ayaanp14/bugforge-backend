/**
 * The bug hunts' hub pages: one per project language and one per category,
 * at /bug-hunts/<id>. Each is a list of every published hunt in that slice
 * with an introduction — the page a search for "javascript debugging
 * exercises" or "sql bug practice" should land on, and the crawl path from
 * the index to the 160 hunts. The ids are reserved: a hunt's slug can never
 * be one of them (lib/slug.ts `uniqueSlug` is told so by the seeder).
 *
 * The copy names hunts that exist in the catalogue (scripts/bugs-*.ts) and
 * claims no counts; the API adds those from the rows.
 */

export interface BugHub {
  id: string;
  kind: "language" | "category";
  /** The matching column value ("javascript", "frontend"). */
  value: string;
  label: string;
  /** How the hub names its hunts: "JavaScript bug hunts". */
  noun: string;
  blurb: string;
}

export const BUG_HUBS: BugHub[] = [
  {
    id: "javascript",
    kind: "language",
    value: "javascript",
    label: "JavaScript",
    noun: "JavaScript bug hunts",
    blurb:
      "Small Node.js and browser projects with a planted bug: a cart total that goes negative once a coupon is applied, a session token that never expires, a rate limiter that limits nobody, a regex that trusts the wrong email, a price that rounds the tip away. Each hunt hands you the files, a bug report written the way support writes them, and hidden tests that pass only when the fix is complete.",
  },
  {
    id: "python",
    kind: "language",
    value: "python",
    label: "Python",
    noun: "Python bug hunts",
    blurb:
      "Python services and scripts that ship with a defect — a mutable default argument, a generator consumed twice, money kept in floating point, a schedule that forgets the timezone, a webhook that can be replayed. Read the report, run the visible tests, fix the editable module and let the hidden tests judge the repair.",
  },
  {
    id: "java",
    kind: "language",
    value: "java",
    label: "Java",
    noun: "Java bug hunts",
    blurb:
      "Java classes and services with a bug in the logic: strings compared by reference, integer division where a ratio was meant, counters and casts that overflow, a calendar that forgets a leap year. The project compiles; the tests say what it should have done.",
  },
  {
    id: "frontend",
    kind: "category",
    value: "frontend",
    label: "Frontend",
    noun: "frontend bug hunts",
    blurb:
      "Bugs in the code a browser runs: the calculation behind a checkout, a search box, a signup form, a progress bar, an unread badge, an infinite scroll. The framework is out of the way — what you fix is the function a component calls, judged by tests that exercise it directly.",
  },
  {
    id: "backend",
    kind: "category",
    value: "backend",
    label: "Backend",
    noun: "backend bug hunts",
    blurb:
      "Bugs in services: request handlers, validators, rate limiters, caches, schedulers, parsers and the security checks between them — many modelled on incidents that made the news. The largest set of hunts, because it is where most production outages start.",
  },
  {
    id: "database",
    kind: "category",
    value: "database",
    label: "Database",
    noun: "database bug hunts",
    blurb:
      "Bugs in the data layer: ghost rows in an audit log, a WHERE clause that vanishes, a cache stampede, an N+1 query storm, a connection never released, keyset pagination without a tiebreak, a batch half applied. The code that talks to the database is what you edit; the tests read what it wrote.",
  },
];

const HUB_BY_ID = new Map(BUG_HUBS.map((h) => [h.id, h]));

export const bugHub = (id: string): BugHub | undefined => HUB_BY_ID.get(id);

/** Every hub id — the slugs a hunt may not take. */
export const BUG_HUB_IDS: ReadonlySet<string> = new Set(BUG_HUBS.map((h) => h.id));
