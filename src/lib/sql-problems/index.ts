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
import { COMPANY_AIRBNB } from "./company-airbnb.js";
import { COMPANY_AMAZON } from "./company-amazon.js";
import { COMPANY_APPLE } from "./company-apple.js";
import { COMPANY_DREAM11 } from "./company-dream11.js";
import { COMPANY_FLIPKART } from "./company-flipkart.js";
import { COMPANY_GOOGLE } from "./company-google.js";
import { COMPANY_HOTSTAR } from "./company-hotstar.js";
import { COMPANY_LINKEDIN } from "./company-linkedin.js";
import { COMPANY_META } from "./company-meta.js";
import { COMPANY_MICROSOFT } from "./company-microsoft.js";
import { COMPANY_MYNTRA } from "./company-myntra.js";
import { COMPANY_OLA } from "./company-ola.js";
import { COMPANY_PAYTM } from "./company-paytm.js";
import { COMPANY_PHONEPE } from "./company-phonepe.js";
import { COMPANY_RAZORPAY } from "./company-razorpay.js";
import { COMPANY_SPOTIFY } from "./company-spotify.js";
import { COMPANY_SWIGGY } from "./company-swiggy.js";
import { COMPANY_UBER } from "./company-uber.js";
import { COMPANY_WALMART } from "./company-walmart.js";
import { COMPANY_ZOMATO } from "./company-zomato.js";

/**
 * The SQL problems, in the order the list shows them (by topic, each file
 * easiest first), then the real-world sets (`world-*.ts`, one industry each —
 * e-commerce, banking, healthcare, SaaS, … — 25 a file, easiest first, added
 * 2026-10-09), then the company sets (`company-*.ts`, one company each — Amazon,
 * Swiggy, PhonePe, … — 25 a file, easiest first, added 2026-10-22: the question
 * an analyst there would be asked, slug and title prefixed with the company so
 * the list's search finds them by name; fictional data, the company's real
 * products). Adding a problem: append it to its topic's, industry's or company's file, run
 * `npx tsx scripts/sql-problems.ts --validate --only <slug>`, deploy.
 */
export const SQL_TOPICS = ["Basics", "Joins", "Aggregation", "Subqueries", "Window Functions", "Strings", "Dates", "Conditional Logic"] as const;
export type SqlTopic = (typeof SQL_TOPICS)[number];

/**
 * The company sets with the company each is set at, in the list's order. The
 * name is stamped onto every problem of its file here rather than written 25
 * times a file; it is spelled as in lib/companies.ts COMPANY_TAGS, so /sql's
 * Companies filter and the catalogue's company hubs name a company alike.
 */
const COMPANY_SETS: ReadonlyArray<readonly [string, readonly SqlProblemSpec[]]> = (
  [
    ["Airbnb", COMPANY_AIRBNB],
    ["Amazon", COMPANY_AMAZON],
    ["Apple", COMPANY_APPLE],
    ["Dream11", COMPANY_DREAM11],
    ["Flipkart", COMPANY_FLIPKART],
    ["Google", COMPANY_GOOGLE],
    ["Hotstar", COMPANY_HOTSTAR],
    ["LinkedIn", COMPANY_LINKEDIN],
    ["Meta", COMPANY_META],
    ["Microsoft", COMPANY_MICROSOFT],
    ["Myntra", COMPANY_MYNTRA],
    ["Ola", COMPANY_OLA],
    ["Paytm", COMPANY_PAYTM],
    ["PhonePe", COMPANY_PHONEPE],
    ["Razorpay", COMPANY_RAZORPAY],
    ["Spotify", COMPANY_SPOTIFY],
    ["Swiggy", COMPANY_SWIGGY],
    ["Uber", COMPANY_UBER],
    ["Walmart", COMPANY_WALMART],
    ["Zomato", COMPANY_ZOMATO],
  ] as const
).map(([company, set]) => [company, set.map((p) => ({ ...p, company }))] as const);

/** The companies with a SQL set, in the list's order. */
export const SQL_COMPANIES: readonly string[] = COMPANY_SETS.map(([company]) => company);

export const SQL_PROBLEMS: readonly SqlProblemSpec[] = [...BASICS, ...JOINS, ...AGGREGATION, ...SUBQUERIES, ...WINDOWS, ...STRINGS_DATES,
  ...WORLD_BANKING, ...WORLD_CIVIC, ...WORLD_ECOMMERCE, ...WORLD_EDUCATION, ...WORLD_FOOD_DELIVERY, ...WORLD_GAMING, ...WORLD_HEALTHCARE, ...WORLD_HR, ...WORLD_MANUFACTURING, ...WORLD_MARKETING, ...WORLD_MOBILITY, ...WORLD_OPS, ...WORLD_REAL_ESTATE, ...WORLD_RETAIL, ...WORLD_SAAS, ...WORLD_SOCIAL, ...WORLD_SPORTS, ...WORLD_STREAMING, ...WORLD_TELECOM, ...WORLD_TRAVEL,
  ...COMPANY_SETS.flatMap(([, set]) => set),
];

const BY_SLUG = new Map(SQL_PROBLEMS.map((p) => [p.slug, p]));
export const sqlProblem = (slug: string): SqlProblemSpec | undefined => BY_SLUG.get(slug);
