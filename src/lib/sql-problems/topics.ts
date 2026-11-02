import { SQL_TOPICS, type SqlTopic } from "./index.js";

/**
 * The SQL topics' hub pages (/sql/joins, /sql/window-functions …), added
 * 2026-11-02. Until then a topic was only /sql?topic=Joins, which Search
 * Console filed as "Alternate page with proper canonical tag" — a filtered
 * view of /sql, never a page of its own — so "sql joins practice problems"
 * had nothing to land on.
 *
 * The slugs share /sql/<slug> with the problems, so they are reserved:
 * `sql-topics.test.ts` holds that no problem's slug is one of them, and the
 * route, the head and the SPA try the topic first. The SPA mirrors the
 * slug ↔ name list (frontend lib/seo/routes.ts SQL_TOPIC_HUBS) — keep in step.
 *
 * Each blurb is what the topic is and what its problems drill, written for
 * the page's introduction and its meta description (the first sentence is
 * both the description's lead and the line under the h1). Facts about SQL
 * and this list only — no claims about who asks what.
 */
export interface SqlTopicGuide {
  slug: string;
  topic: SqlTopic;
  /** The techniques in a few words, for the meta description (no underscores or asterisks: plain text). */
  focus: string;
  blurb: string;
}

const GUIDES: Record<SqlTopic, Omit<SqlTopicGuide, "topic">> = {
  Basics: {
    slug: "basics",
    focus: "SELECT, WHERE, ORDER BY, LIMIT, DISTINCT and NULLs",
    blurb:
      "Practise the SQL every query is built from: SELECT, WHERE, ORDER BY, LIMIT, DISTINCT and NULL handling, on small tables you can read at a glance. Each problem asks for one exact result set and is judged on hidden datasets as well as the example. Start here if you are new to SQL or warming up before an interview.",
  },
  Joins: {
    slug: "joins",
    focus: "INNER, LEFT and self joins, anti joins and multi-table joins",
    blurb:
      "Practise SQL joins in MySQL: INNER, LEFT and RIGHT joins, self joins, anti joins with LEFT JOIN … IS NULL, and joins across three or more tables. The wrong join type loses or duplicates rows — a customer with no orders, an employee with no manager — which is what these problems are built around. Joins are the most common SQL interview topic, and most later topics assume them.",
  },
  Aggregation: {
    slug: "aggregation",
    focus: "GROUP BY, HAVING, COUNT, SUM, AVG and COUNT DISTINCT",
    blurb:
      "Practise SQL aggregation: GROUP BY with COUNT, SUM, AVG, MIN and MAX, HAVING to filter groups, COUNT(DISTINCT …) and grouping after a join. Every reference solution is written in MySQL and checked against a real MySQL 8. Aggregation is where most reporting questions — totals per day, the top customer, averages per department — begin.",
  },
  Subqueries: {
    slug: "subqueries",
    focus: "IN, EXISTS, correlated subqueries, derived tables and CTEs",
    blurb:
      "Practise SQL subqueries: scalar subqueries, IN and NOT IN, EXISTS and NOT EXISTS, correlated subqueries and derived tables in FROM, plus common table expressions with WITH. Many of these questions can also be answered with a join or a window function; where a problem has a second reference query, its page shows it.",
  },
  "Window Functions": {
    slug: "window-functions",
    focus: "RANK, LAG, LEAD, running totals and top N per group",
    blurb:
      "Practise SQL window functions in MySQL 8: ROW_NUMBER, RANK and DENSE_RANK, LAG and LEAD, running totals with SUM() OVER, moving averages and PARTITION BY. These are the questions behind \"top N per group\", \"second highest salary\", \"consecutive days\" and \"month-over-month growth\". Learn the joins and GROUP BY problems first.",
  },
  Strings: {
    slug: "strings",
    focus: "CONCAT, SUBSTRING, TRIM, REPLACE, LIKE and GROUP CONCAT",
    blurb:
      "Practise SQL string functions in MySQL: CONCAT, SUBSTRING, LEFT and RIGHT, UPPER and LOWER, TRIM, REPLACE, LENGTH, LIKE patterns and GROUP_CONCAT. The problems fix names, mask card and phone numbers, read e-mail domains and build labels, the text work that turns up in data-cleaning and reporting rounds.",
  },
  Dates: {
    slug: "dates",
    focus: "DATEDIFF, DATE ADD, DATE FORMAT, months, weeks and retention",
    blurb:
      "Practise SQL date functions in MySQL: DATEDIFF, DATE_ADD and DATE_SUB with INTERVAL, YEAR, MONTH and DATE_FORMAT, TIMESTAMPDIFF and grouping by day, week or month. The problems are the time questions analysts are asked — retention after seven days, orders per month, the gap between two events.",
  },
  "Conditional Logic": {
    slug: "conditional-logic",
    focus: "CASE WHEN, IF, COALESCE and conditional aggregation",
    blurb:
      "Practise conditional logic in SQL: CASE WHEN, IF, COALESCE and IFNULL, and conditional aggregation such as SUM(CASE WHEN … THEN 1 ELSE 0 END) to pivot rows into columns. These problems label rows into buckets, count several conditions in one pass and replace missing values — the pattern behind most \"report\" questions in a SQL interview.",
  },
};

export const SQL_TOPIC_GUIDES: readonly SqlTopicGuide[] = SQL_TOPICS.map((topic) => ({ topic, ...GUIDES[topic] }));

const BY_SLUG = new Map(SQL_TOPIC_GUIDES.map((g) => [g.slug, g]));
const BY_TOPIC = new Map(SQL_TOPIC_GUIDES.map((g) => [g.topic as string, g]));

/** The topic whose hub lives at /sql/<slug>, or undefined when the slug is a problem's (or nothing). */
export const sqlTopicBySlug = (slug: string): SqlTopicGuide | undefined => BY_SLUG.get(slug);
/** A topic's hub slug by its name ("Window Functions" → "window-functions"). */
export const sqlTopicSlug = (topic: string): string | undefined => BY_TOPIC.get(topic)?.slug;
