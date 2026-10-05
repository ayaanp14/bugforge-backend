import type { SqlProblemSpec } from "./types.js";
import { BASICS } from "./basics.js";
import { JOINS } from "./joins.js";
import { AGGREGATION } from "./aggregation.js";
import { SUBQUERIES } from "./subqueries.js";
import { WINDOWS } from "./windows.js";
import { STRINGS_DATES } from "./strings-dates.js";

/**
 * The SQL problems, in the order the list shows them (by topic, each file
 * easiest first). Adding a problem: append it to its topic's file, run
 * `npx tsx scripts/sql-problems.ts --validate --only <slug>`, deploy.
 */
export const SQL_TOPICS = ["Basics", "Joins", "Aggregation", "Subqueries", "Window Functions", "Strings", "Dates", "Conditional Logic"] as const;
export type SqlTopic = (typeof SQL_TOPICS)[number];

export const SQL_PROBLEMS: readonly SqlProblemSpec[] = [...BASICS, ...JOINS, ...AGGREGATION, ...SUBQUERIES, ...WINDOWS, ...STRINGS_DATES];

const BY_SLUG = new Map(SQL_PROBLEMS.map((p) => [p.slug, p]));
export const sqlProblem = (slug: string): SqlProblemSpec | undefined => BY_SLUG.get(slug);
