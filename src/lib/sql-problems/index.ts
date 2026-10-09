import type { SqlProblemSpec } from "./types.js";
import { BASICS } from "./basics.js";
import { JOINS } from "./joins.js";
import { AGGREGATION } from "./aggregation.js";
import { SUBQUERIES } from "./subqueries.js";
import { WINDOWS } from "./windows.js";
import { STRINGS_DATES } from "./strings-dates.js";
import { WORLD_BANKING } from "./world-banking.js";
import { WORLD_CIVIC } from "./world-civic.js";
import { WORLD_ECOMMERCE } from "./world-ecommerce.js";
import { WORLD_EDUCATION } from "./world-education.js";
import { WORLD_FOOD_DELIVERY } from "./world-food-delivery.js";
import { WORLD_GAMING } from "./world-gaming.js";
import { WORLD_HEALTHCARE } from "./world-healthcare.js";
import { WORLD_HR } from "./world-hr.js";
import { WORLD_MANUFACTURING } from "./world-manufacturing.js";
import { WORLD_MARKETING } from "./world-marketing.js";
import { WORLD_MOBILITY } from "./world-mobility.js";
import { WORLD_OPS } from "./world-ops.js";
import { WORLD_REAL_ESTATE } from "./world-real-estate.js";
import { WORLD_RETAIL } from "./world-retail.js";
import { WORLD_SAAS } from "./world-saas.js";
import { WORLD_SOCIAL } from "./world-social.js";
import { WORLD_SPORTS } from "./world-sports.js";
import { WORLD_STREAMING } from "./world-streaming.js";
import { WORLD_TELECOM } from "./world-telecom.js";
import { WORLD_TRAVEL } from "./world-travel.js";

/**
 * The SQL problems, in the order the list shows them (by topic, each file
 * easiest first), then the real-world sets (`world-*.ts`, one industry each —
 * e-commerce, banking, healthcare, SaaS, … — 25 a file, easiest first, added
 * 2026-10-09). Adding a problem: append it to its topic's or industry's file, run
 * `npx tsx scripts/sql-problems.ts --validate --only <slug>`, deploy.
 */
export const SQL_TOPICS = ["Basics", "Joins", "Aggregation", "Subqueries", "Window Functions", "Strings", "Dates", "Conditional Logic"] as const;
export type SqlTopic = (typeof SQL_TOPICS)[number];

export const SQL_PROBLEMS: readonly SqlProblemSpec[] = [...BASICS, ...JOINS, ...AGGREGATION, ...SUBQUERIES, ...WINDOWS, ...STRINGS_DATES,
  ...WORLD_BANKING, ...WORLD_CIVIC, ...WORLD_ECOMMERCE, ...WORLD_EDUCATION, ...WORLD_FOOD_DELIVERY, ...WORLD_GAMING, ...WORLD_HEALTHCARE, ...WORLD_HR, ...WORLD_MANUFACTURING, ...WORLD_MARKETING, ...WORLD_MOBILITY, ...WORLD_OPS, ...WORLD_REAL_ESTATE, ...WORLD_RETAIL, ...WORLD_SAAS, ...WORLD_SOCIAL, ...WORLD_SPORTS, ...WORLD_STREAMING, ...WORLD_TELECOM, ...WORLD_TRAVEL,
];

const BY_SLUG = new Map(SQL_PROBLEMS.map((p) => [p.slug, p]));
export const sqlProblem = (slug: string): SqlProblemSpec | undefined => BY_SLUG.get(slug);
