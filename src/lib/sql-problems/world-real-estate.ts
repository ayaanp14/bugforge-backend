import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle, LAST_NAMES } from "./kit.js";

/**
 * Real estate, rentals and co-living — the questions a property portal's
 * analyst, a rental manager, a co-living operator or a housing society's
 * treasurer is asked: listings by budget and locality, price per square foot,
 * site visits and lead funnels, leases, rent collections and vacancy between
 * tenants, maintenance tickets against an SLA, brokers' commissions and deals,
 * and society maintenance dues. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const LOCALITIES = ["Baner", "Wakad", "Hinjewadi", "Kharadi", "Viman Nagar", "Hadapsar", "Aundh", "Kothrud"] as const;
const BLR_LOCALITIES = ["Whitefield", "HSR Layout", "Koramangala", "Sarjapur Road", "Hebbal", "Electronic City", "Indiranagar"] as const;
const LEAD_SOURCES = ["99acres", "MagicBricks", "Housing", "Walk-in", "Referral"] as const;
const WINGS = ["A", "B", "C", "D"] as const;
const TICKET_CATEGORIES = ["plumbing", "electrical", "carpentry", "painting", "pest_control"] as const;
const BROKERS = ["Sunil Realty", "Kumar Estates", "Prime Homes", "Nest Brokers", "Urban Keys", "Shree Properties"] as const;
const CITIES_RE = ["Pune", "Bengaluru", "Hyderabad", "Mumbai"] as const;

/** A full name "First Last" from the kit lists. */
const fullName = (first: string, rng: () => number): string => `${first} ${pick(rng, LAST_NAMES)}`;
/** A 10-digit Indian mobile number. */
const mobile = (rng: () => number): number => ri(rng, 6, 9) * 1_000_000_000 + ri(rng, 0, 999_999_999);
/** The first day of the month `k` months after `ym` ('YYYY-MM-01'). */
const monthStart = (y: number, m: number, k: number): string => {
  const t = y * 12 + (m - 1) + k;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}-01`;
};

export const WORLD_REAL_ESTATE: SqlProblemSpec[] = [
  {
    slug: "ready-to-move-2bhk-listings-under-80-lakh",
    title: "Ready-to-Move 2 BHK Listings Under ₹80 Lakh",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "A property portal is sending a shortlist to a buyer who wants a **2 BHK** that is **ready to move in**, still **active** on the site, with an asking price of **at most ₹80 lakh**.",
      "",
      "Return `listing_id`, `locality` and `price_lakh` of every listing that meets all four conditions, **ordered by `price_lakh`** ascending, ties by `listing_id` ascending. A listing priced exactly 80 lakh qualifies.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "locality", type: "varchar" },
          { name: "bhk", type: "int" },
          { name: "price_lakh", type: "int" },
          { name: "possession", type: "enum", values: ["ready", "under_construction"] },
          { name: "status", type: "enum", values: ["active", "sold", "withdrawn"] },
        ],
        primaryKey: ["listing_id"],
        note: "One row per flat listed for sale. `price_lakh` is the asking price in lakh rupees (1 lakh = ₹1,00,000).",
      },
    ],
    examples: [
      {
        Listing: [
          [201, "Baner", 2, 78, "ready", "active"],
          [202, "Wakad", 2, 64, "ready", "active"],
          [203, "Wakad", 3, 72, "ready", "active"],
          [204, "Kharadi", 2, 80, "ready", "active"],
          [205, "Hinjewadi", 2, 58, "under_construction", "active"],
          [206, "Aundh", 2, 79, "ready", "sold"],
          [207, "Kothrud", 2, 81, "ready", "active"],
          [208, "Hadapsar", 2, 64, "ready", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const ids = sample(rng, seq(101, 60), n);
      const rows = ids.map((id) => [
        id,
        pick(rng, LOCALITIES),
        chance(rng, 0.6) ? 2 : pick(rng, [1, 3, 4]),
        chance(rng, 0.15) ? pick(rng, [80, 81, 79]) : ri(rng, 40, 120),
        chance(rng, 0.75) ? "ready" : "under_construction",
        pick(rng, ["active", "active", "active", "sold", "withdrawn"]),
      ]);
      return { Listing: rows };
    },
    solution: [
      "SELECT listing_id, locality, price_lakh",
      "FROM Listing",
      "WHERE bhk = 2",
      "  AND possession = 'ready'",
      "  AND status = 'active'",
      "  AND price_lakh <= 80",
      "ORDER BY price_lakh, listing_id",
    ].join("\n"),
    alternatives: [
      "SELECT listing_id, locality, price_lakh FROM Listing WHERE NOT (price_lakh > 80) AND bhk BETWEEN 2 AND 2 AND possession IN ('ready') AND status IN ('active') ORDER BY 3, 1",
      "SELECT listing_id, locality, price_lakh FROM (SELECT * FROM Listing WHERE status = 'active' AND possession = 'ready') a WHERE bhk = 2 AND price_lakh < 81 ORDER BY price_lakh ASC, listing_id ASC",
    ],
    ordered: true,
    hints: [
      "Every condition is about one row on its own, so this is a single WHERE clause joined with AND.",
      "\"At most 80\" includes 80 — pick the comparison operator accordingly.",
      "Two listings can share a price; the second sort key settles their order.",
    ],
    editorial: [
      "Each requirement — the configuration, the possession status, the listing status and the budget — is a test on one row, so the whole question is one `WHERE` clause with the four conditions joined by `AND`. A row survives only if all four hold.",
      "",
      "The budget is inclusive: \"at most ₹80 lakh\" means `price_lakh <= 80`, so the flat listed at exactly 80 lakh stays, and the one at 81 does not. The sold flat in Aundh and the under-construction one in Hinjewadi fail on status and possession even though their prices fit.",
      "",
      "The order is fixed by the statement: price first, and because two flats can be listed at the same price, `listing_id` second so the result is the same however the rows are stored. Equivalent spellings — `NOT (price_lakh > 80)`, `IN` lists of one value, a derived table that filters status first — return the same rows. The query reads the table once; an index on `(status, bhk, price_lakh)` would let a large portal answer it without a full scan.",
    ].join("\n"),
  },

  {
    slug: "locality-rate-per-sqft-for-active-listings",
    title: "Rate per Square Foot by Locality",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "A real estate research desk publishes a locality's **rate per square foot** as the total asking price of its **active** listings divided by their total carpet area — a weighted rate, so a big flat counts for more than a small one.",
      "",
      "Return one row per locality that has at least one active listing, with `locality`, `listings` (the number of active listings) and `rate_per_sqft` **rounded to the nearest rupee**. Order the rows by `rate_per_sqft` **descending**, ties by `locality` ascending. Sold and withdrawn listings are ignored.",
    ].join("\n"),
    tables: [
      {
        name: "PropertyListing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "locality", type: "varchar" },
          { name: "carpet_sqft", type: "int" },
          { name: "asking_price", type: "int" },
          { name: "status", type: "enum", values: ["active", "sold", "withdrawn"] },
        ],
        primaryKey: ["listing_id"],
        note: "`asking_price` is in rupees; `carpet_sqft` is the flat's carpet area in square feet.",
      },
    ],
    examples: [
      {
        PropertyListing: [
          [1, "Whitefield", 1150, 9200000, "active"],
          [2, "Whitefield", 1600, 13800000, "active"],
          [3, "HSR Layout", 1200, 14400000, "active"],
          [4, "HSR Layout", 900, 12500000, "sold"],
          [5, "Hebbal", 1400, 12600000, "active"],
          [6, "Electronic City", 1050, 5600000, "active"],
          [7, "Electronic City", 980, 5100000, "withdrawn"],
          [8, "Koramangala", 1000, 12000000, "active"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const locs = sample(rng, BLR_LOCALITIES, ri(rng, 1, 5));
      const rows = seq(1, n).map((id) => {
        const sqft = roundTo(rng, 450, 2200, 10);
        const rate = roundTo(rng, 4500, 16000, 100);
        return [id, pick(rng, locs), sqft, Math.round((sqft * rate) / 100000) * 100000, pick(rng, ["active", "active", "active", "sold", "withdrawn"])];
      });
      return { PropertyListing: rows };
    },
    solution: [
      "SELECT locality,",
      "       COUNT(*) AS listings,",
      "       ROUND(SUM(asking_price) / SUM(carpet_sqft)) AS rate_per_sqft",
      "FROM PropertyListing",
      "WHERE status = 'active'",
      "GROUP BY locality",
      "ORDER BY rate_per_sqft DESC, locality",
    ].join("\n"),
    alternatives: [
      "SELECT locality, COUNT(listing_id) AS listings, ROUND(SUM(asking_price) * 1.0 / SUM(carpet_sqft), 0) AS rate_per_sqft FROM PropertyListing WHERE status IN ('active') GROUP BY locality ORDER BY 3 DESC, 1",
      "SELECT locality, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS listings, ROUND(SUM(CASE WHEN status = 'active' THEN asking_price END) / SUM(CASE WHEN status = 'active' THEN carpet_sqft END)) AS rate_per_sqft FROM PropertyListing GROUP BY locality HAVING SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) > 0 ORDER BY rate_per_sqft DESC, locality",
    ],
    ordered: true,
    hints: [
      "Filter to active listings before grouping, then make one group per locality.",
      "The weighted rate is a ratio of two sums, not the average of each flat's own rate.",
      "Round only the final ratio, and break equal rates by the locality name.",
    ],
    editorial: [
      "Filter first: only active listings belong in the published rate, so `WHERE status = 'active'` runs before the grouping, and a locality whose listings are all sold or withdrawn disappears from the answer altogether — which is what the statement asks.",
      "",
      "Then `GROUP BY locality` and compute two sums per group: the total asking price and the total carpet area. Their ratio is the weighted rate. It is not the same as `AVG(asking_price / carpet_sqft)` — the average of per-flat rates gives a 450 sq ft studio the same say as a 2,000 sq ft penthouse, which is not how the desk defines it.",
      "",
      "Round the ratio once at the end; rounding the inputs would drift. The order is by the rounded rate, highest first, with the locality name as the tie-breaker. Conditional aggregation over the whole table, with a `HAVING` that drops localities without active listings, is an equivalent route. One pass over the table either way.",
    ].join("\n"),
  },

  {
    slug: "leads-never-taken-on-a-completed-site-visit",
    title: "Leads Never Taken on a Completed Site Visit",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "A builder's sales team logs every site visit it schedules for a lead. A visit can be **completed**, **cancelled** or a **no_show**. The sales head wants to call back every lead who has **not yet completed a single site visit** — including leads who never had a visit scheduled.",
      "",
      "Return `lead_id` and `name` of those leads, in any order. A lead with only cancelled or no-show visits is in the answer; a lead with at least one completed visit is not.",
    ].join("\n"),
    tables: [
      {
        name: "SalesLead",
        columns: [
          { name: "lead_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "phone", type: "bigint" },
          { name: "source", type: "enum", values: [...LEAD_SOURCES] },
        ],
        primaryKey: ["lead_id"],
        note: "One row per enquiry the sales team received.",
      },
      {
        name: "SiteVisit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "lead_id", type: "int" },
          { name: "visit_date", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled", "no_show"] },
        ],
        primaryKey: ["visit_id"],
        note: "`lead_id` is always a lead in `SalesLead`; a lead can have several visits.",
      },
    ],
    examples: [
      {
        SalesLead: [
          [1, "Aditi Sharma", 9876543210, "99acres"],
          [2, "Rohan Iyer", 9123456780, "Walk-in"],
          [3, "Neha Gupta", 8899776655, "Referral"],
          [4, "Kabir Khan", 9988001122, "Housing"],
          [5, "Pooja Nair", 7766554433, "MagicBricks"],
        ],
        SiteVisit: [
          [11, 1, "2025-01-11", "completed"],
          [12, 2, "2025-01-12", "no_show"],
          [13, 2, "2025-01-19", "cancelled"],
          [14, 4, "2025-01-14", "cancelled"],
          [15, 4, "2025-01-21", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const ids = sample(rng, seq(1, 40), n);
      const who = names(rng, n);
      const leads = ids.map((id, i) => [id, fullName(who[i]!, rng), mobile(rng), pick(rng, LEAD_SOURCES)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const doneRate = pick(rng, [0.2, 0.5, 0.8]);
      const visits = seq(1, m).map((v) => [
        100 + v,
        pick(rng, ids),
        dateBetween(rng, "2025-01-01", "2025-03-31"),
        chance(rng, doneRate) ? "completed" : pick(rng, ["cancelled", "no_show"]),
      ]);
      return { SalesLead: leads, SiteVisit: visits };
    },
    solution: [
      "SELECT l.lead_id, l.name",
      "FROM SalesLead l",
      "LEFT JOIN SiteVisit v",
      "  ON v.lead_id = l.lead_id AND v.status = 'completed'",
      "WHERE v.visit_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT lead_id, name FROM SalesLead l WHERE NOT EXISTS (SELECT 1 FROM SiteVisit v WHERE v.lead_id = l.lead_id AND v.status = 'completed')",
      "SELECT lead_id, name FROM SalesLead WHERE lead_id NOT IN (SELECT lead_id FROM SiteVisit WHERE status = 'completed')",
    ],
    hints: [
      "Start from `SalesLead` — every row of the answer is a lead, visited or not.",
      "Look only for completed visits. Where does that condition go in a LEFT JOIN so that it does not throw away the unmatched leads?",
      "A lead with no completed visit has NULL in every column of the joined visit.",
    ],
    editorial: [
      "The question is an **anti join**: leads for which no completed visit exists. With a LEFT JOIN, the condition on the visit's status must sit in the `ON` clause, not in `WHERE`. In `ON`, it narrows which visits can match; a lead whose visits are all cancelled or no-show simply finds no match and comes through with NULLs, and `v.visit_id IS NULL` keeps it. Put `v.status = 'completed'` in `WHERE` instead and those NULL rows fail the test — the LEFT JOIN silently turns into an inner join and the answer is empty.",
      "",
      "`NOT EXISTS` with the status in the subquery states the rule most directly. `NOT IN` is safe here because `SiteVisit.lead_id` is never NULL; if it could be, one NULL in the list would make every comparison unknown. Each form is one indexed lookup per lead with an index on `SiteVisit(lead_id, status)`.",
    ].join("\n"),
  },

  {
    slug: "masked-tenant-phones-for-the-notice-board",
    title: "Masked Tenant Phone Numbers for the Notice Board",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "A housing society pins an emergency-contact list on the lobby notice board. For privacy it shows only each tenant's **first name** and a phone number with all but the **last four digits** replaced by `X` — `9876543210` becomes `XXXXXX3210`.",
      "",
      "Return `flat_no`, `first_name` (the part of `full_name` before the first space) and `masked_phone`, **ordered by `flat_no`**. A tenant with no phone on record gets NULL in `masked_phone`. Every phone is exactly 10 digits and every full name has at least one space.",
    ].join("\n"),
    tables: [
      {
        name: "Tenant",
        columns: [
          { name: "tenant_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "flat_no", type: "varchar" },
          { name: "phone", type: "bigint" },
        ],
        primaryKey: ["tenant_id"],
        note: "One tenant per flat; `flat_no` is the wing letter, a hyphen and the flat number (`B-1204`). `phone` is NULL when the tenant did not share one.",
      },
    ],
    examples: [
      {
        Tenant: [
          [1, "Meera Iyer", "B-1204", 9876543210],
          [2, "Arjun Singh Rathore", "A-0302", 9123400078],
          [3, "Zara Khan", "A-1101", null],
          [4, "Vikram Rao", "C-0701", 8000012345],
          [5, "Sneha Das", "A-0105", 7012345609],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const flats = sample(
        rng,
        WINGS.flatMap((w) => seq(1, 12).map((f) => `${w}-${String(f).padStart(2, "0")}0${ri(rng, 1, 4)}`)),
        n,
      );
      const rows = who.map((first, i) => [
        i + 1,
        chance(rng, 0.2) ? `${first} ${pick(rng, LAST_NAMES)} ${pick(rng, LAST_NAMES)}` : fullName(first, rng),
        flats[i]!,
        chance(rng, 0.15) ? null : mobile(rng),
      ]);
      return { Tenant: shuffle(rng, rows) };
    },
    solution: [
      "SELECT flat_no,",
      "       SUBSTRING_INDEX(full_name, ' ', 1) AS first_name,",
      "       CONCAT('XXXXXX', RIGHT(phone, 4)) AS masked_phone",
      "FROM Tenant",
      "ORDER BY flat_no",
    ].join("\n"),
    alternatives: [
      "SELECT flat_no, LEFT(full_name, LOCATE(' ', full_name) - 1) AS first_name, CASE WHEN phone IS NULL THEN NULL ELSE CONCAT(REPEAT('X', 6), SUBSTRING(phone, 7, 4)) END AS masked_phone FROM Tenant ORDER BY flat_no",
      "SELECT flat_no, SUBSTRING(full_name, 1, INSTR(full_name, ' ') - 1) AS first_name, CONCAT(LPAD('', 6, 'X'), SUBSTR(phone, -4)) AS masked_phone FROM Tenant ORDER BY flat_no",
    ],
    ordered: true,
    hints: [
      "The first name is everything before the first space — one string function cuts a string at the n-th occurrence of a delimiter.",
      "The last four digits are the rightmost four characters of the number.",
      "CONCAT returns NULL when any argument is NULL, which already handles a missing phone.",
    ],
    editorial: [
      "Two string operations and one concatenation. `SUBSTRING_INDEX(full_name, ' ', 1)` returns everything before the first space, so \"Arjun Singh Rathore\" becomes \"Arjun\" — the count of 1 means \"up to the first delimiter\", which is exactly the first name even when the name has three parts. `LEFT(full_name, LOCATE(' ', full_name) - 1)` does the same by finding the space's position.",
      "",
      "For the phone, `RIGHT(phone, 4)` takes the last four characters of the number's text, keeping leading zeros of that tail (`8000012345` ends in `2345`, `9123400078` in `0078`). Prefixing six `X` characters gives a ten-character mask. Because `CONCAT` returns NULL if any argument is NULL, a tenant without a phone gets NULL without a `CASE` — the second alternative spells the CASE out anyway.",
      "",
      "The order is by `flat_no` as text; the zero-padded flat numbers make that the natural order within a wing. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "maintenance-tickets-breaching-seven-day-sla",
    title: "Maintenance Tickets Breaching the Seven-Day SLA",
    difficulty: "EASY",
    topics: ["Dates", "Conditional Logic"],
    description: [
      "A rental management company promises that every maintenance ticket is fixed within **7 days** of being raised. On the review date **2025-03-31**, a ticket's age is the number of days from `raised_on` to `resolved_on` — or, for a ticket still open (`resolved_on` NULL), from `raised_on` to 2025-03-31.",
      "",
      "Return every ticket whose age is **more than 7 days**, with `request_id`, `flat_no`, `category`, `days_open` (the age) and `state` (`'resolved'` or `'open'`), **ordered by `days_open` descending**, ties by `request_id` ascending. A ticket fixed in exactly 7 days met the SLA.",
    ].join("\n"),
    tables: [
      {
        name: "MaintenanceRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "category", type: "enum", values: [...TICKET_CATEGORIES] },
          { name: "raised_on", type: "date" },
          { name: "resolved_on", type: "date" },
        ],
        primaryKey: ["request_id"],
        note: "`resolved_on` is NULL while the ticket is open. Every ticket was raised on or before 2025-03-31.",
      },
    ],
    examples: [
      {
        MaintenanceRequest: [
          [501, "A-0302", "plumbing", "2025-03-01", "2025-03-04"],
          [502, "B-1204", "electrical", "2025-03-02", "2025-03-09"],
          [503, "B-0801", "carpentry", "2025-03-03", "2025-03-14"],
          [504, "C-0101", "pest_control", "2025-03-20", null],
          [505, "A-1101", "painting", "2025-03-10", null],
          [506, "C-0505", "plumbing", "2025-02-25", "2025-03-08"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 18);
      const rows = seq(1, n).map((i) => {
        const raised = dateBetween(rng, "2025-02-01", "2025-03-31");
        const open = chance(rng, 0.3);
        const took = chance(rng, 0.2) ? pick(rng, [7, 8]) : ri(rng, 0, 20);
        let resolved: string | null = open ? null : addDays(raised, took);
        if (resolved && resolved > "2025-03-31") resolved = null;
        return [500 + i, `${pick(rng, WINGS)}-0${ri(rng, 1, 9)}0${ri(rng, 1, 4)}`, pick(rng, TICKET_CATEGORIES), raised, resolved];
      });
      return { MaintenanceRequest: rows };
    },
    solution: [
      "SELECT request_id, flat_no, category,",
      "       DATEDIFF(COALESCE(resolved_on, '2025-03-31'), raised_on) AS days_open,",
      "       CASE WHEN resolved_on IS NULL THEN 'open' ELSE 'resolved' END AS state",
      "FROM MaintenanceRequest",
      "WHERE DATEDIFF(COALESCE(resolved_on, '2025-03-31'), raised_on) > 7",
      "ORDER BY days_open DESC, request_id",
    ].join("\n"),
    alternatives: [
      "SELECT * FROM (SELECT request_id, flat_no, category, DATEDIFF(IFNULL(resolved_on, '2025-03-31'), raised_on) AS days_open, IF(resolved_on IS NULL, 'open', 'resolved') AS state FROM MaintenanceRequest) t WHERE days_open >= 8 ORDER BY days_open DESC, request_id",
      "SELECT request_id, flat_no, category, CASE WHEN resolved_on IS NULL THEN DATEDIFF('2025-03-31', raised_on) ELSE DATEDIFF(resolved_on, raised_on) END AS days_open, CASE WHEN resolved_on IS NULL THEN 'open' ELSE 'resolved' END AS state FROM MaintenanceRequest WHERE (resolved_on IS NULL AND raised_on < '2025-03-24') OR DATEDIFF(resolved_on, raised_on) > 7 ORDER BY days_open DESC, request_id",
    ],
    ordered: true,
    hints: [
      "An open ticket's end date is the review date; COALESCE gives one end date for both kinds.",
      "DATEDIFF(later, earlier) counts the days between two dates.",
      "Exactly 7 days is within the SLA, so the filter is strictly greater than 7.",
    ],
    editorial: [
      "Every ticket needs an end date to measure against: its `resolved_on` if it was fixed, otherwise the review date. `COALESCE(resolved_on, '2025-03-31')` gives that in one expression, and `DATEDIFF(end, raised_on)` turns it into the age in days. The same expression filters (`> 7`) and is selected as `days_open`; a derived table lets you name it once and filter on the alias, as the first alternative does.",
      "",
      "The state is a plain `CASE` on whether `resolved_on` is NULL. The boundary matters: ticket 502 was raised on the 2nd and fixed on the 9th — exactly 7 days — and met the promise, so it is not listed; ticket 503 took 11 days and is.",
      "",
      "For open tickets, \"older than 7 days on 31 March\" is the same as raised before 24 March, which the second alternative uses. Order by age, oldest breach first, with the ticket id breaking ties. One scan of the table.",
    ].join("\n"),
  },
  {
    slug: "broker-commission-by-deal-slab",
    title: "Broker Commission by Deal Slab",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "A brokerage pays its agents by slab. On a **rent** deal the commission is **one month's rent** (`deal_value` is the monthly rent). On a **sale** the commission is **2%** of the sale price when the price is **below ₹1 crore** (₹1,00,00,000) and **1.5%** when it is ₹1 crore or more.",
      "",
      "Return `deal_id`, `broker` and `commission` (in rupees) for every deal, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Deal",
        columns: [
          { name: "deal_id", type: "int" },
          { name: "broker", type: "varchar" },
          { name: "deal_type", type: "enum", values: ["sale", "rent"] },
          { name: "deal_value", type: "int" },
        ],
        primaryKey: ["deal_id"],
        note: "`deal_value` is the sale price for a sale and the monthly rent for a rent deal, in rupees.",
      },
    ],
    examples: [
      {
        Deal: [
          [1, "Sunil Realty", "sale", 8500000],
          [2, "Sunil Realty", "rent", 32000],
          [3, "Prime Homes", "sale", 10000000],
          [4, "Prime Homes", "sale", 9900000],
          [5, "Urban Keys", "rent", 75000],
          [6, "Urban Keys", "sale", 21500000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const rows = seq(1, n).map((id) => {
        const sale = chance(rng, 0.6);
        const value = sale
          ? chance(rng, 0.15) ? pick(rng, [10000000, 9900000]) : roundTo(rng, 3000000, 35000000, 100000)
          : roundTo(rng, 12000, 120000, 500);
        return [id, pick(rng, BROKERS), sale ? "sale" : "rent", value];
      });
      return { Deal: rows };
    },
    solution: [
      "SELECT deal_id, broker,",
      "       CASE",
      "         WHEN deal_type = 'rent' THEN deal_value",
      "         WHEN deal_value < 10000000 THEN deal_value * 0.02",
      "         ELSE deal_value * 0.015",
      "       END AS commission",
      "FROM Deal",
    ].join("\n"),
    alternatives: [
      "SELECT deal_id, broker, IF(deal_type = 'rent', deal_value, IF(deal_value >= 10000000, deal_value * 15 / 1000, deal_value * 2 / 100)) AS commission FROM Deal",
      "SELECT deal_id, broker, deal_value AS commission FROM Deal WHERE deal_type = 'rent' UNION ALL SELECT deal_id, broker, deal_value * CASE WHEN deal_value >= 10000000 THEN 0.015 ELSE 0.02 END FROM Deal WHERE deal_type = 'sale'",
    ],
    hints: [
      "There are three cases; a CASE expression checks them in order and stops at the first that holds.",
      "Test the deal type first — the price slab only applies to sales.",
      "Exactly ₹1 crore is not \"below ₹1 crore\".",
    ],
    editorial: [
      "The commission is a function of two columns, so it is one `CASE` expression evaluated per row. Order the branches so that the deal type is decided first: a rent deal pays its `deal_value` whatever the amount, and only for sales does the price slab matter. Because `CASE` stops at the first true branch, the second branch (`deal_value < 10000000`) is only ever reached by a sale, and the `ELSE` catches sales of ₹1 crore and above.",
      "",
      "The boundary is the usual trap: deal 3 is exactly ₹1 crore, which is not *below* a crore, so it is paid at 1.5% (₹1,50,000), while deal 4 at ₹99 lakh earns 2% (₹1,98,000) — more commission on a cheaper flat, which is why such slabs are argued about.",
      "",
      "Nested `IF`s say the same thing, and a `UNION ALL` of the rent rows and the sale rows splits the cases into two queries. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "society-dues-collected-per-wing",
    title: "Society Maintenance Dues Collected per Wing",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "A housing society's treasurer reports the **March 2025** maintenance collection wing by wing. A flat may pay its dues in more than one instalment, and some flats have not paid at all.",
      "",
      "Return one row per wing in `Flat` with `wing`, `flats` (the number of flats in the wing), `paid_flats` (flats with at least one payment for `'2025-03'`) and `collected` (the total paid for `'2025-03'`, **0** for a wing with no payment). Payments for other months are ignored. Order the rows by `wing`.",
    ].join("\n"),
    tables: [
      {
        name: "Flat",
        columns: [
          { name: "flat_no", type: "varchar" },
          { name: "wing", type: "char" },
          { name: "area_sqft", type: "int" },
        ],
        primaryKey: ["flat_no"],
        note: "Every flat of the society.",
      },
      {
        name: "DuesPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "dues_month", type: "char" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "`dues_month` is the month paid for, as `'YYYY-MM'`. `flat_no` is always a flat in `Flat`.",
      },
    ],
    examples: [
      {
        Flat: [
          ["A-101", "A", 950],
          ["A-102", "A", 1100],
          ["A-201", "A", 950],
          ["B-101", "B", 1250],
          ["B-102", "B", 1250],
          ["C-101", "C", 800],
        ],
        DuesPayment: [
          [1, "A-101", "2025-03", 3000],
          [2, "A-101", "2025-03", 1750],
          [3, "A-102", "2025-03", 5500],
          [4, "B-101", "2025-02", 6250],
          [5, "B-102", "2025-03", 6250],
          [6, "A-201", "2025-02", 4750],
        ],
      },
    ],
    gen: (rng) => {
      const wings = sample(rng, WINGS, ri(rng, 1, 4));
      const flats: Cell[][] = [];
      for (const w of wings) for (const f of sample(rng, seq(101, 8), ri(rng, 1, 4))) flats.push([`${w}-${f}`, w, roundTo(rng, 700, 1600, 50)]);
      const pays: Cell[][] = [];
      let id = 1;
      const rate = pick(rng, [0, 0.4, 0.7, 1]);
      for (const f of flats) {
        if (chance(rng, rate)) {
          const parts = chance(rng, 0.25) ? 2 : 1;
          for (let k = 0; k < parts; k++) pays.push([id++, f[0]!, "2025-03", roundTo(rng, 1000, 7000, 250)]);
        }
        if (chance(rng, 0.3)) pays.push([id++, f[0]!, pick(rng, ["2025-02", "2025-04"]), roundTo(rng, 1000, 7000, 250)]);
      }
      return { Flat: flats, DuesPayment: pays };
    },
    solution: [
      "SELECT f.wing,",
      "       COUNT(DISTINCT f.flat_no) AS flats,",
      "       COUNT(DISTINCT p.flat_no) AS paid_flats,",
      "       COALESCE(SUM(p.amount), 0) AS collected",
      "FROM Flat f",
      "LEFT JOIN DuesPayment p",
      "  ON p.flat_no = f.flat_no AND p.dues_month = '2025-03'",
      "GROUP BY f.wing",
      "ORDER BY f.wing",
    ].join("\n"),
    alternatives: [
      "SELECT w.wing, (SELECT COUNT(*) FROM Flat x WHERE x.wing = w.wing) AS flats, (SELECT COUNT(DISTINCT p.flat_no) FROM DuesPayment p JOIN Flat x ON x.flat_no = p.flat_no WHERE x.wing = w.wing AND p.dues_month = '2025-03') AS paid_flats, (SELECT IFNULL(SUM(p.amount), 0) FROM DuesPayment p JOIN Flat x ON x.flat_no = p.flat_no WHERE x.wing = w.wing AND p.dues_month = '2025-03') AS collected FROM (SELECT DISTINCT wing FROM Flat) w ORDER BY w.wing",
      "SELECT f.wing, COUNT(*) AS flats, SUM(CASE WHEN t.paid IS NULL THEN 0 ELSE 1 END) AS paid_flats, COALESCE(SUM(t.paid), 0) AS collected FROM Flat f LEFT JOIN (SELECT flat_no, SUM(amount) AS paid FROM DuesPayment WHERE dues_month = '2025-03' GROUP BY flat_no) t ON t.flat_no = f.flat_no GROUP BY f.wing ORDER BY f.wing",
    ],
    ordered: true,
    hints: [
      "Start from `Flat` so that a wing with no March payment still appears.",
      "The month filter belongs in the join condition — in WHERE it would drop the flats that did not pay.",
      "A flat that paid twice joins twice; count flats with DISTINCT, and turn a missing sum into 0.",
    ],
    editorial: [
      "The answer has a row for every wing, paid or not, so the query starts from `Flat` and LEFT JOINs the March payments. The month condition goes into the `ON` clause: it restricts which payments may match while every flat survives — a flat with no March payment comes through once with NULLs.",
      "",
      "Two things change the counts. A flat that paid in two instalments matches two payment rows, so `COUNT(*)` would count it twice; `COUNT(DISTINCT f.flat_no)` counts flats, and `COUNT(DISTINCT p.flat_no)` counts only flats that matched a payment, because NULLs are not counted. And a wing where nobody paid sums to NULL, which `COALESCE(…, 0)` turns into 0, as wing C shows.",
      "",
      "Pre-aggregating payments per flat in a derived table first avoids the duplication altogether — then every flat is one row and plain counts work. Correlated subqueries per wing are a third way, slower but clear.",
    ].join("\n"),
  },

  {
    slug: "leases-ending-within-thirty-days",
    title: "Leases Ending Within the Next 30 Days",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "On **2025-03-01** a property manager starts renewal calls for every lease that ends **between 2025-03-01 and 30 days later (2025-03-31), both inclusive**.",
      "",
      "Return `lease_id`, `flat_no`, `end_date` and `days_left` (days from 2025-03-01 to `end_date`, 0 for a lease ending that day) for those leases, **ordered by `end_date`**, ties by `lease_id`. Leases that already ended before 2025-03-01 are not called.",
    ].join("\n"),
    tables: [
      {
        name: "Lease",
        columns: [
          { name: "lease_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "tenant_name", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
          { name: "monthly_rent", type: "int" },
        ],
        primaryKey: ["lease_id"],
        note: "One row per rental agreement; `end_date` is the last day of the lease.",
      },
    ],
    examples: [
      {
        Lease: [
          [1, "A-302", "Kavya Menon", "2024-03-01", "2025-02-28", 28000],
          [2, "B-1204", "Rahul Verma", "2024-03-01", "2025-03-01", 35000],
          [3, "C-701", "Ira Joshi", "2024-04-15", "2025-03-14", 22000],
          [4, "A-105", "Dev Patel", "2024-04-01", "2025-03-31", 41000],
          [5, "B-801", "Simran Bose", "2024-05-01", "2025-04-01", 26500],
          [6, "C-202", "Karan Reddy", "2024-04-15", "2025-03-14", 24000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = names(rng, n);
      const rows = who.map((first, i) => {
        const end = chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-10", "2025-04-20");
        return [i + 1, `${pick(rng, WINGS)}-${ri(rng, 1, 12)}0${ri(rng, 1, 4)}`, fullName(first, rng), addDays(end, -ri(rng, 330, 364)), end, roundTo(rng, 15000, 60000, 500)];
      });
      return { Lease: rows };
    },
    solution: [
      "SELECT lease_id, flat_no, end_date,",
      "       DATEDIFF(end_date, '2025-03-01') AS days_left",
      "FROM Lease",
      "WHERE end_date BETWEEN '2025-03-01' AND DATE_ADD('2025-03-01', INTERVAL 30 DAY)",
      "ORDER BY end_date, lease_id",
    ].join("\n"),
    alternatives: [
      "SELECT lease_id, flat_no, end_date, DATEDIFF(end_date, '2025-03-01') AS days_left FROM Lease WHERE DATEDIFF(end_date, '2025-03-01') BETWEEN 0 AND 30 ORDER BY end_date, lease_id",
      "SELECT lease_id, flat_no, end_date, DATEDIFF(end_date, '2025-03-01') AS days_left FROM Lease WHERE end_date >= '2025-03-01' AND end_date < '2025-04-01' ORDER BY 3, 1",
    ],
    ordered: true,
    hints: [
      "The window is a range of dates; BETWEEN includes both ends.",
      "DATE_ADD can compute the end of the window from the start date.",
      "DATEDIFF(end_date, start) gives the days left.",
    ],
    editorial: [
      "The window is fixed: from the call date to 30 days after it, both ends included. `end_date BETWEEN '2025-03-01' AND DATE_ADD('2025-03-01', INTERVAL 30 DAY)` expresses it directly — the dates are stored as fixed-format text, so the comparison orders them correctly, and `DATE_ADD` saves you from counting March's days by hand.",
      "",
      "`days_left` is `DATEDIFF(end_date, '2025-03-01')`, which is 0 for lease 2 ending on the call date itself and 30 for lease 4 ending on the 31st. Lease 1 ended the day before and lease 5 one day too late; both are outside.",
      "",
      "Filtering on the computed difference (`BETWEEN 0 AND 30`) gives the same rows but cannot use an index on `end_date`; a half-open range `>= '2025-03-01' AND < '2025-04-01'` can, and is the most robust form when the column might hold times. Two leases ending on the same day are ordered by id.",
    ].join("\n"),
  },

  {
    slug: "costliest-rental-listing-in-each-city",
    title: "Costliest Rental Listing in Each City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "A rental portal's homepage features the **highest monthly rent** asked in each city. Each listing sits in a locality, and each locality belongs to a city. When several listings in a city share the highest rent, feature **all of them**.",
      "",
      "Return `city`, `locality_name`, `listing_id` and `monthly_rent` for the featured listings, in any order. Cities without listings do not appear.",
    ].join("\n"),
    tables: [
      {
        name: "Locality",
        columns: [
          { name: "locality_id", type: "int" },
          { name: "locality_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["locality_id"],
      },
      {
        name: "RentalListing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "locality_id", type: "int" },
          { name: "bhk", type: "int" },
          { name: "monthly_rent", type: "int" },
        ],
        primaryKey: ["listing_id"],
        note: "`locality_id` is always a locality in `Locality`. `monthly_rent` is in rupees.",
      },
    ],
    examples: [
      {
        Locality: [
          [1, "Baner", "Pune"],
          [2, "Kharadi", "Pune"],
          [3, "Whitefield", "Bengaluru"],
          [4, "Koramangala", "Bengaluru"],
          [5, "Gachibowli", "Hyderabad"],
        ],
        RentalListing: [
          [10, 1, 2, 32000],
          [11, 2, 3, 45000],
          [12, 1, 3, 45000],
          [13, 3, 2, 38000],
          [14, 4, 3, 72000],
          [15, 4, 2, 41000],
          [16, 2, 1, 18000],
        ],
      },
    ],
    gen: (rng) => {
      const locs: Cell[][] = [];
      let lid = 1;
      for (const city of sample(rng, CITIES_RE, ri(rng, 1, 4))) {
        for (const name of sample(rng, city === "Pune" ? LOCALITIES : BLR_LOCALITIES, ri(rng, 1, 3))) locs.push([lid++, name, city]);
      }
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rents = [25000, 32000, 45000, 45000, 60000];
      const rows = seq(1, n).map((id) => [
        100 + id,
        pick(rng, locs)[0]!,
        ri(rng, 1, 4),
        chance(rng, 0.35) ? pick(rng, rents) : roundTo(rng, 12000, 90000, 1000),
      ]);
      return { Locality: locs, RentalListing: rows };
    },
    solution: [
      "SELECT city, locality_name, listing_id, monthly_rent",
      "FROM (",
      "  SELECT l.city, l.locality_name, r.listing_id, r.monthly_rent,",
      "         RANK() OVER (PARTITION BY l.city ORDER BY r.monthly_rent DESC) AS rnk",
      "  FROM RentalListing r",
      "  JOIN Locality l ON l.locality_id = r.locality_id",
      ") ranked",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      "SELECT l.city, l.locality_name, r.listing_id, r.monthly_rent FROM RentalListing r JOIN Locality l ON l.locality_id = r.locality_id WHERE r.monthly_rent = (SELECT MAX(r2.monthly_rent) FROM RentalListing r2 JOIN Locality l2 ON l2.locality_id = r2.locality_id WHERE l2.city = l.city)",
      "WITH tops AS (SELECT l.city, MAX(r.monthly_rent) AS top_rent FROM RentalListing r JOIN Locality l ON l.locality_id = r.locality_id GROUP BY l.city) SELECT l.city, l.locality_name, r.listing_id, r.monthly_rent FROM RentalListing r JOIN Locality l ON l.locality_id = r.locality_id JOIN tops t ON t.city = l.city AND t.top_rent = r.monthly_rent",
    ],
    hints: [
      "The city is in `Locality`, so join first to know each listing's city.",
      "The group is the city, not the locality — partition by city.",
      "RANK gives every tied listing rank 1; ROW_NUMBER would keep only one of them.",
    ],
    editorial: [
      "Two steps: attach the city to each listing, then keep each city's top rent. The join `RentalListing → Locality` gives every listing its city and locality name. Then `RANK() OVER (PARTITION BY city ORDER BY monthly_rent DESC)` numbers listings within each city from the most expensive down, and the outer query keeps rank 1.",
      "",
      "Ties are why `RANK` is the right function: in Pune, Baner and Kharadi both have a 3 BHK at ₹45,000, both get rank 1, and both are featured. `ROW_NUMBER` would pick one arbitrarily, and the answer would depend on storage order. `DENSE_RANK` would also work for rank 1.",
      "",
      "The classic alternative computes each city's `MAX(monthly_rent)` — in a correlated subquery or a grouped CTE — and joins back to keep listings equal to it; it handles ties the same way. Note the partition is the city even though the output shows the locality: grouping by locality would feature one listing per locality instead.",
    ].join("\n"),
  },

  {
    slug: "broker-site-visit-conversion-rate",
    title: "Broker Site-Visit Conversion Rate",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "A developer's channel-partner team ranks brokers by how often a site visit they bring ends in a **booking**. Brokers with fewer than **3** visits are too new to rank.",
      "",
      "For every broker with **at least 3 visits**, return `broker_name`, `visits`, `bookings` (visits with outcome `'booked'`) and `conversion_pct` = 100 × bookings ÷ visits, **rounded to 1 decimal place**. Order by `conversion_pct` **descending**, then `broker_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Broker",
        columns: [
          { name: "broker_id", type: "int" },
          { name: "broker_name", type: "varchar" },
          { name: "rera_no", type: "varchar" },
        ],
        primaryKey: ["broker_id"],
        note: "Registered channel partners; broker names are unique.",
      },
      {
        name: "BrokerVisit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "broker_id", type: "int" },
          { name: "visit_date", type: "date" },
          { name: "outcome", type: "enum", values: ["booked", "interested", "not_interested", "no_show"] },
        ],
        primaryKey: ["visit_id"],
        note: "One row per site visit a broker brought; `broker_id` is always in `Broker`.",
      },
    ],
    examples: [
      {
        Broker: [
          [1, "Sunil Realty", "P52100011"],
          [2, "Kumar Estates", "P52100023"],
          [3, "Prime Homes", "P52100037"],
          [4, "Nest Brokers", "P52100041"],
        ],
        BrokerVisit: [
          [1, 1, "2025-02-01", "booked"],
          [2, 1, "2025-02-03", "interested"],
          [3, 1, "2025-02-08", "no_show"],
          [4, 1, "2025-02-09", "booked"],
          [5, 2, "2025-02-02", "booked"],
          [6, 2, "2025-02-05", "booked"],
          [7, 3, "2025-02-04", "not_interested"],
          [8, 3, "2025-02-06", "interested"],
          [9, 3, "2025-02-10", "no_show"],
          [10, 2, "2025-02-11", "not_interested"],
          [11, 2, "2025-02-12", "booked"],
          [12, 2, "2025-02-14", "interested"],
        ],
      },
    ],
    gen: (rng) => {
      const brokers = sample(rng, BROKERS, ri(rng, 1, 6)).map((b, i) => [i + 1, b, `P521${String(ri(rng, 10000, 99999))}`]);
      const visits: Cell[][] = [];
      let id = 1;
      for (const b of brokers) {
        const k = chance(rng, 0.2) ? pick(rng, [0, 2, 3]) : ri(rng, 1, 12);
        const rate = pick(rng, [0, 0.25, 0.5, 1]);
        for (let i = 0; i < k; i++) {
          visits.push([id++, b[0]!, dateBetween(rng, "2025-01-01", "2025-03-31"), chance(rng, rate) ? "booked" : pick(rng, ["interested", "not_interested", "no_show"])]);
        }
      }
      return { Broker: brokers, BrokerVisit: shuffle(rng, visits) };
    },
    solution: [
      "SELECT b.broker_name,",
      "       COUNT(*) AS visits,",
      "       SUM(CASE WHEN v.outcome = 'booked' THEN 1 ELSE 0 END) AS bookings,",
      "       ROUND(100 * SUM(CASE WHEN v.outcome = 'booked' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct",
      "FROM Broker b",
      "JOIN BrokerVisit v ON v.broker_id = b.broker_id",
      "GROUP BY b.broker_id, b.broker_name",
      "HAVING COUNT(*) >= 3",
      "ORDER BY conversion_pct DESC, b.broker_name",
    ].join("\n"),
    alternatives: [
      "SELECT b.broker_name, t.visits, t.bookings, ROUND(100 * t.bookings / t.visits, 1) AS conversion_pct FROM Broker b JOIN (SELECT broker_id, COUNT(*) AS visits, COUNT(CASE WHEN outcome = 'booked' THEN 1 END) AS bookings FROM BrokerVisit GROUP BY broker_id) t ON t.broker_id = b.broker_id WHERE t.visits > 2 ORDER BY conversion_pct DESC, b.broker_name",
      "SELECT b.broker_name, COUNT(v.visit_id) AS visits, SUM(IF(v.outcome = 'booked', 1, 0)) AS bookings, ROUND(AVG(IF(v.outcome = 'booked', 100, 0)), 1) AS conversion_pct FROM Broker b LEFT JOIN BrokerVisit v ON v.broker_id = b.broker_id GROUP BY b.broker_name HAVING COUNT(v.visit_id) >= 3 ORDER BY 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Group visits by broker; COUNT(*) is the number of visits.",
      "Count bookings with a CASE inside SUM, so each group counts only its booked rows.",
      "The minimum-visits rule is about a group, so it goes in HAVING.",
    ],
    editorial: [
      "Join each visit to its broker and group by broker: `COUNT(*)` is the visits, and **conditional aggregation** — `SUM(CASE WHEN outcome = 'booked' THEN 1 ELSE 0 END)` — counts the bookings in the same pass. The conversion rate is their ratio times 100, rounded once at the end; writing `100 *` before the division keeps it a percentage rather than a fraction.",
      "",
      "The 3-visit floor is a condition on the group, so it lives in `HAVING`, after the counts exist; a `WHERE` cannot see `COUNT(*)`. Prime Homes has three visits and no booking — it qualifies with 0.0%, while a broker with two visits would be dropped however good they look.",
      "",
      "Equivalent forms: pre-aggregate visits per broker in a derived table and join the names afterwards, or note that the average of a 100-or-0 flag *is* the percentage. Grouping by `broker_id` as well as the name keeps two brokers apart even if names repeated. One pass over the visits.",
    ].join("\n"),
  },
  {
    slug: "flat-vacancy-gaps-between-tenants",
    title: "Vacancy Gaps Between Tenants of a Flat",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A landlord company wants to know which flats sat empty for long between one tenant moving out and the next moving in. A flat's leases never overlap. The **vacant days** before a lease are the days strictly between the previous lease's `end_date` and this lease's `start_date` — a lease starting the day after the last one ended has 0 vacant days.",
      "",
      "Return `flat_no`, `lease_id` (the lease that ended the vacancy) and `vacant_days` for every gap of **more than 30 days**, ordered by `vacant_days` **descending**, then `flat_no`, then `lease_id`. A flat's first lease has no gap before it.",
    ].join("\n"),
    tables: [
      {
        name: "FlatLease",
        columns: [
          { name: "lease_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "tenant_name", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["lease_id"],
        note: "`end_date` is the tenant's last day in the flat. Leases of one flat never overlap.",
      },
    ],
    examples: [
      {
        FlatLease: [
          [1, "A-302", "Aarav Shah", "2023-04-01", "2024-03-31"],
          [2, "A-302", "Diya Rao", "2024-04-01", "2024-09-30"],
          [3, "A-302", "Harsh Mehta", "2024-12-15", "2025-06-14"],
          [4, "B-1204", "Tanvi Iyer", "2023-06-01", "2024-05-31"],
          [5, "B-1204", "Liam Das", "2024-07-01", "2025-06-30"],
          [6, "C-701", "Ira Nair", "2024-01-10", "2024-12-09"],
          [7, "C-701", "Kabir Singh", "2025-01-10", "2025-12-09"],
          [8, "D-105", "Maria Joshi", "2024-02-01", "2025-01-31"],
        ],
      },
    ],
    gen: (rng) => {
      const flats = sample(rng, ["A-302", "A-105", "B-1204", "B-801", "C-701", "C-202", "D-105"], ri(rng, 1, 5));
      const rows: Cell[][] = [];
      let id = 1;
      for (const f of flats) {
        let start = dateBetween(rng, "2023-01-01", "2023-12-31");
        const k = ri(rng, 1, 4);
        for (let i = 0; i < k; i++) {
          const end = addDays(start, ri(rng, 150, 364));
          rows.push([id++, f, fullName(pick(rng, names(rng, 5)), rng), start, end]);
          const gap = chance(rng, 0.25) ? pick(rng, [30, 31]) : ri(rng, 0, 100);
          start = addDays(end, gap + 1);
        }
      }
      return { FlatLease: shuffle(rng, rows) };
    },
    solution: [
      "SELECT flat_no, lease_id, vacant_days",
      "FROM (",
      "  SELECT flat_no, lease_id,",
      "         DATEDIFF(start_date, LAG(end_date) OVER (PARTITION BY flat_no ORDER BY start_date)) - 1 AS vacant_days",
      "  FROM FlatLease",
      ") g",
      "WHERE vacant_days > 30",
      "ORDER BY vacant_days DESC, flat_no, lease_id",
    ].join("\n"),
    alternatives: [
      "SELECT flat_no, lease_id, vacant_days FROM (SELECT l.flat_no, l.lease_id, DATEDIFF(l.start_date, (SELECT MAX(p.end_date) FROM FlatLease p WHERE p.flat_no = l.flat_no AND p.end_date < l.start_date)) - 1 AS vacant_days FROM FlatLease l) t WHERE vacant_days > 30 ORDER BY vacant_days DESC, flat_no, lease_id",
      "SELECT cur.flat_no, cur.lease_id, DATEDIFF(cur.start_date, prev.end_date) - 1 AS vacant_days FROM FlatLease cur JOIN FlatLease prev ON prev.flat_no = cur.flat_no AND prev.end_date < cur.start_date WHERE NOT EXISTS (SELECT 1 FROM FlatLease mid WHERE mid.flat_no = cur.flat_no AND mid.end_date > prev.end_date AND mid.end_date < cur.start_date) AND DATEDIFF(cur.start_date, prev.end_date) - 1 > 30 ORDER BY vacant_days DESC, cur.flat_no, cur.lease_id",
    ],
    ordered: true,
    hints: [
      "Each lease needs the end date of the lease before it in the same flat.",
      "LAG over a window partitioned by flat and ordered by start date fetches the previous row's value.",
      "The days strictly between two dates are their DATEDIFF minus one; the first lease's LAG is NULL and drops out of any comparison.",
    ],
    editorial: [
      "The gap belongs to a pair of consecutive leases of the same flat, so each lease needs its predecessor's `end_date`. `LAG(end_date) OVER (PARTITION BY flat_no ORDER BY start_date)` fetches exactly that: the partition keeps flats apart and the ordering by start date makes \"previous\" mean the lease before in time. A flat's first lease gets NULL, so its `vacant_days` is NULL and `> 30` filters it out.",
      "",
      "Be careful with the off-by-one: a lease ending on 30 September and the next starting on 1 October leave **no** empty day, and `DATEDIFF` returns 1 — hence the `- 1`. In the example, C-701 ended on 9 December and was let again on 10 January: 31 days between, 30 vacant, so it is not listed.",
      "",
      "Without window functions, the previous end date is `MAX(end_date)` among the flat's leases ending before this start (a correlated subquery), or a self join with a `NOT EXISTS` that no lease sits between the two. Both are quadratic per flat; the window is one sort.",
    ].join("\n"),
  },

  {
    slug: "monthly-rent-collection-on-time-late-unpaid",
    title: "Monthly Rent Collection: On Time, Late and Unpaid",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "A rental manager tracks every rent invoice. Tenants get a **5-day grace period**: an invoice paid **on or before `due_date` + 5 days** is on time, one paid after that is late, and one with `paid_on` NULL is unpaid.",
      "",
      "For each month of `due_date` (as `'YYYY-MM'`), return `due_month`, `invoices`, `on_time`, `late`, `unpaid` and `collected` (the total `amount` of invoices that were paid, on time or late — 0 if none). **Order by `due_month`.**",
    ].join("\n"),
    tables: [
      {
        name: "RentInvoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "lease_id", type: "int" },
          { name: "due_date", type: "date" },
          { name: "amount", type: "int" },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["invoice_id"],
        note: "One invoice per lease per month; `paid_on` is NULL until the rent is received.",
      },
    ],
    examples: [
      {
        RentInvoice: [
          [1, 11, "2025-01-05", 28000, "2025-01-04"],
          [2, 12, "2025-01-05", 35000, "2025-01-10"],
          [3, 13, "2025-01-01", 22000, "2025-01-09"],
          [4, 11, "2025-02-05", 28000, "2025-02-05"],
          [5, 12, "2025-02-05", 35000, null],
          [6, 13, "2025-02-01", 22000, "2025-02-07"],
          [7, 14, "2025-03-01", 41000, null],
        ],
      },
    ],
    gen: (rng) => {
      const leases = sample(rng, seq(11, 12), ri(rng, 1, 5));
      const rows: Cell[][] = [];
      let id = 1;
      const months = ri(rng, 1, 4);
      const first = ri(rng, 9, 12);
      for (const l of leases) {
        const day = pick(rng, [1, 5, 7, 10]);
        const amount = roundTo(rng, 12000, 60000, 500);
        for (let k = 0; k < months; k++) {
          if (chance(rng, 0.15)) continue;
          const due = addDays(monthStart(2024, first, k), day - 1);
          const r = rng();
          const paid = r < 0.15 ? null : r < 0.3 ? addDays(due, pick(rng, [5, 6])) : addDays(due, ri(rng, -4, 15));
          rows.push([id++, l, due, amount, paid]);
        }
      }
      return { RentInvoice: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(due_date, '%Y-%m') AS due_month,",
      "       COUNT(*) AS invoices,",
      "       SUM(CASE WHEN paid_on <= DATE_ADD(due_date, INTERVAL 5 DAY) THEN 1 ELSE 0 END) AS on_time,",
      "       SUM(CASE WHEN paid_on > DATE_ADD(due_date, INTERVAL 5 DAY) THEN 1 ELSE 0 END) AS late,",
      "       SUM(CASE WHEN paid_on IS NULL THEN 1 ELSE 0 END) AS unpaid,",
      "       COALESCE(SUM(CASE WHEN paid_on IS NOT NULL THEN amount END), 0) AS collected",
      "FROM RentInvoice",
      "GROUP BY DATE_FORMAT(due_date, '%Y-%m')",
      "ORDER BY due_month",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(due_date, 7) AS due_month, COUNT(*) AS invoices, SUM(IF(DATEDIFF(paid_on, due_date) <= 5, 1, 0)) AS on_time, SUM(IF(DATEDIFF(paid_on, due_date) > 5, 1, 0)) AS late, COUNT(*) - COUNT(paid_on) AS unpaid, IFNULL(SUM(IF(paid_on IS NULL, 0, amount)), 0) AS collected FROM RentInvoice GROUP BY LEFT(due_date, 7) ORDER BY 1",
      "SELECT due_month, COUNT(*) AS invoices, SUM(CASE WHEN status = 'on_time' THEN 1 ELSE 0 END) AS on_time, SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late, SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid, SUM(CASE WHEN status = 'unpaid' THEN 0 ELSE amount END) AS collected FROM (SELECT SUBSTRING(due_date, 1, 7) AS due_month, amount, CASE WHEN paid_on IS NULL THEN 'unpaid' WHEN DATEDIFF(paid_on, due_date) > 5 THEN 'late' ELSE 'on_time' END AS status FROM RentInvoice) t GROUP BY due_month ORDER BY due_month",
    ],
    ordered: true,
    hints: [
      "Bucket by month with DATE_FORMAT(due_date, '%Y-%m') and group by that.",
      "Each count is a SUM of a CASE that is 1 for the rows of that kind.",
      "A comparison with a NULL `paid_on` is never true, so unpaid invoices fall out of the on-time and late counts by themselves.",
    ],
    editorial: [
      "Bucket the invoices by the month they fall due — `DATE_FORMAT(due_date, '%Y-%m')` gives a sortable `'2025-01'` label — and classify each invoice inside the aggregates with **conditional aggregation**: one `SUM(CASE …)` per category. The grace period is `DATE_ADD(due_date, INTERVAL 5 DAY)`; paid on or before it is on time, after it is late.",
      "",
      "NULLs do the right thing without help: for an unpaid invoice, `paid_on <= …` and `paid_on > …` are both unknown, so it lands in neither, and the explicit `paid_on IS NULL` count picks it up. The boundary counts too: invoice 4 was paid on the due date and invoice 3 on day 8 after a due date of the 1st — late. `collected` sums only paid invoices and `COALESCE` turns a month with nothing received into 0.",
      "",
      "`DATEDIFF(paid_on, due_date) <= 5` is the same test, and `COUNT(*) - COUNT(paid_on)` counts NULLs. Classifying in a derived table first, then counting statuses, reads well for many categories. One pass and one sort.",
    ].join("\n"),
  },

  {
    slug: "flats-owing-more-than-their-wing-average",
    title: "Flats Owing More Than Their Wing's Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "A housing society keeps a dues ledger: maintenance **charges** raised on a flat and **payments** received from it. A flat's **outstanding** is its total charges minus its total payments (negative when it paid in advance; 0 for a flat with no ledger entries).",
      "",
      "Return the flats whose outstanding is **strictly greater than the average outstanding of all flats in the same wing** (flats without entries count as 0 in that average). Columns: `flat_no`, `wing`, `outstanding` and `wing_average` rounded to 2 decimals, **ordered by `wing`, then `outstanding` descending, then `flat_no`**.",
    ].join("\n"),
    tables: [
      {
        name: "SocietyFlat",
        columns: [
          { name: "flat_no", type: "varchar" },
          { name: "wing", type: "char" },
          { name: "owner_name", type: "varchar" },
        ],
        primaryKey: ["flat_no"],
      },
      {
        name: "DuesLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "entry_type", type: "enum", values: ["charge", "payment"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "`amount` is always positive; `entry_type` says whether it was billed or received. `flat_no` is always in `SocietyFlat`.",
      },
    ],
    examples: [
      {
        SocietyFlat: [
          ["A-101", "A", "Priya Menon"],
          ["A-102", "A", "Rohan Gupta"],
          ["A-103", "A", "Saanvi Rao"],
          ["B-101", "B", "Farhan Khan"],
          ["B-102", "B", "Emma Das"],
        ],
        DuesLedger: [
          [1, "A-101", "charge", 9000],
          [2, "A-101", "payment", 3000],
          [3, "A-102", "charge", 9000],
          [4, "A-102", "payment", 9000],
          [5, "B-101", "charge", 6000],
          [6, "B-102", "charge", 6000],
          [7, "B-102", "payment", 6000],
          [8, "B-101", "payment", 1000],
          [9, "A-103", "charge", 4500],
        ],
      },
    ],
    gen: (rng) => {
      const flats: Cell[][] = [];
      for (const w of sample(rng, WINGS, ri(rng, 1, 3))) {
        for (const f of sample(rng, seq(101, 9), ri(rng, 1, 6))) flats.push([`${w}-${f}`, w, fullName(pick(rng, names(rng, 6)), rng)]);
      }
      const rows: Cell[][] = [];
      let id = 1;
      for (const f of flats) {
        if (chance(rng, 0.15)) continue;
        const charge = roundTo(rng, 3000, 12000, 500);
        rows.push([id++, f[0]!, "charge", charge]);
        if (chance(rng, 0.3)) rows.push([id++, f[0]!, "charge", roundTo(rng, 500, 3000, 500)]);
        const pay = chance(rng, 0.3) ? charge : chance(rng, 0.1) ? charge + 1000 : roundTo(rng, 0, charge, 500);
        if (pay > 0) rows.push([id++, f[0]!, "payment", pay]);
      }
      return { SocietyFlat: flats, DuesLedger: shuffle(rng, rows) };
    },
    solution: [
      "WITH balance AS (",
      "  SELECT f.flat_no, f.wing,",
      "         COALESCE(SUM(CASE WHEN d.entry_type = 'charge' THEN d.amount ELSE -d.amount END), 0) AS outstanding",
      "  FROM SocietyFlat f",
      "  LEFT JOIN DuesLedger d ON d.flat_no = f.flat_no",
      "  GROUP BY f.flat_no, f.wing",
      ")",
      "SELECT b.flat_no, b.wing, b.outstanding,",
      "       ROUND((SELECT AVG(x.outstanding) FROM balance x WHERE x.wing = b.wing), 2) AS wing_average",
      "FROM balance b",
      "WHERE b.outstanding > (SELECT AVG(x.outstanding) FROM balance x WHERE x.wing = b.wing)",
      "ORDER BY b.wing, b.outstanding DESC, b.flat_no",
    ].join("\n"),
    alternatives: [
      "SELECT flat_no, wing, outstanding, ROUND(wing_avg, 2) AS wing_average FROM (SELECT flat_no, wing, outstanding, AVG(outstanding) OVER (PARTITION BY wing) AS wing_avg FROM (SELECT f.flat_no, f.wing, IFNULL(SUM(IF(d.entry_type = 'charge', d.amount, -d.amount)), 0) AS outstanding FROM SocietyFlat f LEFT JOIN DuesLedger d ON d.flat_no = f.flat_no GROUP BY f.flat_no, f.wing) b) t WHERE outstanding > wing_avg ORDER BY wing, outstanding DESC, flat_no",
      "WITH bal AS (SELECT f.flat_no, f.wing, COALESCE((SELECT SUM(amount) FROM DuesLedger d WHERE d.flat_no = f.flat_no AND d.entry_type = 'charge'), 0) - COALESCE((SELECT SUM(amount) FROM DuesLedger d WHERE d.flat_no = f.flat_no AND d.entry_type = 'payment'), 0) AS outstanding FROM SocietyFlat f), wavg AS (SELECT wing, AVG(outstanding) AS a FROM bal GROUP BY wing) SELECT b.flat_no, b.wing, b.outstanding, ROUND(w.a, 2) AS wing_average FROM bal b JOIN wavg w ON w.wing = b.wing WHERE b.outstanding > w.a ORDER BY b.wing, b.outstanding DESC, b.flat_no",
    ],
    ordered: true,
    hints: [
      "First compute one outstanding figure per flat: charges count plus, payments minus.",
      "Start from the flats and LEFT JOIN the ledger so a flat with no entries gets 0.",
      "Then compare each flat with the average of its own wing — a correlated subquery, a grouped CTE, or AVG over a window.",
    ],
    editorial: [
      "Two levels of aggregation, so do them one at a time. First, one balance per flat: LEFT JOIN the ledger to `SocietyFlat` and sum the entries with a sign — `+amount` for a charge, `-amount` for a payment. The LEFT JOIN plus `COALESCE(…, 0)` gives a flat with no entries an outstanding of 0, which matters because the statement counts those flats in the wing's average.",
      "",
      "Second, compare each flat with its wing. A **correlated subquery** `(SELECT AVG(outstanding) FROM balance WHERE wing = b.wing)` recomputes the wing's average for each flat; a grouped CTE joined back, or `AVG(outstanding) OVER (PARTITION BY wing)`, computes it once per wing. In the example wing A averages (6000 + 0 + 4500) / 3 = 3500, so A-101 and A-103 owe more than average.",
      "",
      "Compare against the unrounded average and round only for display, or a flat equal to a rounded figure could slip through. The comparison is strict, so a wing where every flat owes the same returns nothing.",
    ].join("\n"),
  },

  {
    slug: "portal-listing-titles-parsed-by-locality",
    title: "Parse Listing Titles Into Locality and BHK",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "An old property portal stored only a free-text `title` such as `3 BHK Apartment - Baner, Pune` or `Studio Apartment - Wakad, Pune`: the configuration, the property type, then `' - '`, the locality, a comma and the city. Spaces around the comma are not consistent.",
      "",
      "Return one row per locality with `locality` (trimmed), `listings`, `villas` (titles whose type is `Villa`) and `largest_bhk` (the largest BHK number; a **Studio counts as 0**). Order by `listings` **descending**, then `locality`.",
    ].join("\n"),
    tables: [
      {
        name: "PortalListing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "price_lakh", type: "int" },
        ],
        primaryKey: ["listing_id"],
        note: "`title` is `'<n> BHK <Type> - <Locality>, <City>'` or `'Studio <Type> - <Locality>, <City>'`. Types are Apartment, Villa, Row House or Penthouse; localities contain no comma or hyphen.",
      },
    ],
    examples: [
      {
        PortalListing: [
          [1, "3 BHK Apartment - Baner, Pune", 145],
          [2, "2 BHK Apartment - Baner , Pune", 92],
          [3, "4 BHK Villa - Baner,Pune", 310],
          [4, "Studio Apartment - Wakad, Pune", 38],
          [5, "1 BHK Apartment - Wakad, Pune", 46],
          [6, "Studio Apartment - Viman Nagar, Pune", 41],
          [7, "3 BHK Villa - Aundh, Pune", 260],
          [8, "2 BHK Row House - Aundh ,Pune", 175],
        ],
      },
    ],
    gen: (rng) => {
      const locs = sample(rng, LOCALITIES, ri(rng, 1, 5));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows = seq(1, n).map((id) => {
        const bhk = chance(rng, 0.2) ? 0 : ri(rng, 1, 5);
        const type = bhk === 0 ? "Apartment" : pick(rng, ["Apartment", "Apartment", "Villa", "Row House", "Penthouse"]);
        const comma = pick(rng, [", ", " , ", ",", " ,"]);
        return [id, `${bhk === 0 ? "Studio" : `${bhk} BHK`} ${type} - ${pick(rng, locs)}${comma}Pune`, ri(rng, 30, 400)];
      });
      return { PortalListing: rows };
    },
    solution: [
      "SELECT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' - ', -1), ',', 1)) AS locality,",
      "       COUNT(*) AS listings,",
      "       SUM(CASE WHEN title LIKE '% Villa - %' THEN 1 ELSE 0 END) AS villas,",
      "       MAX(CASE WHEN title LIKE 'Studio %' THEN 0 ELSE CAST(SUBSTRING_INDEX(title, ' ', 1) AS SIGNED) END) AS largest_bhk",
      "FROM PortalListing",
      "GROUP BY TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' - ', -1), ',', 1))",
      "ORDER BY listings DESC, locality",
    ].join("\n"),
    alternatives: [
      "SELECT locality, COUNT(*) AS listings, SUM(IF(kind = 'Villa', 1, 0)) AS villas, MAX(bhk) AS largest_bhk FROM (SELECT TRIM(SUBSTRING(title, LOCATE(' - ', title) + 3, LOCATE(',', title) - LOCATE(' - ', title) - 3)) AS locality, IF(LEFT(title, 6) = 'Studio', 0, CAST(LEFT(title, LOCATE(' ', title) - 1) AS SIGNED)) AS bhk, SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' - ', 1), ' ', -1) AS kind FROM PortalListing) t GROUP BY locality ORDER BY listings DESC, locality",
    ],
    ordered: true,
    hints: [
      "The locality sits between `' - '` and the comma: SUBSTRING_INDEX with a negative count keeps what is after the last delimiter.",
      "Cut at `' - '` first, then at the comma, then TRIM the spaces.",
      "The BHK number is the first word, unless the title starts with Studio.",
    ],
    editorial: [
      "All the facts are inside one text column, so the work is **string parsing**, then an ordinary GROUP BY on the parsed value. `SUBSTRING_INDEX(title, ' - ', -1)` keeps everything after the separator (`'Baner , Pune'`), `SUBSTRING_INDEX(…, ',', 1)` keeps what is before the comma (`'Baner '`), and `TRIM` removes the stray space. Without the TRIM, `'Baner'` and `'Baner '` would be two groups — the example's inconsistent commas are there to catch that.",
      "",
      "The BHK is the first word cast to a number, but a studio's first word is `'Studio'`, so a `CASE` gives it 0 before the cast. The villa count is a conditional sum on the type word, matched with its surrounding spaces and separator so a locality name can never match by accident.",
      "",
      "MySQL lets you `GROUP BY` the alias; repeating the expression works everywhere. Parsing in a derived table first, with `LOCATE` and `SUBSTRING` instead of `SUBSTRING_INDEX`, is the alternative. Each title is parsed once.",
    ].join("\n"),
  },

  {
    slug: "days-from-first-site-visit-to-booking",
    title: "Days From First Site Visit to Booking",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "A builder's CRM records leads, their site visits and unit bookings (a lead books at most one unit). Sales wants the time to close: for each lead that **booked** and had **at least one site visit on or before the booking date**, how long it took from their first visit.",
      "",
      "Return `lead_id`, `name`, `first_visit`, `booked_on`, `days_to_book` (days from `first_visit` to `booked_on`) and `visits_before_booking` (visits on or before `booked_on`). Visits after the booking (handover walkthroughs) are ignored. Order by `days_to_book`, then `lead_id`.",
    ].join("\n"),
    tables: [
      {
        name: "BuyerLead",
        columns: [
          { name: "lead_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "source", type: "enum", values: [...LEAD_SOURCES] },
        ],
        primaryKey: ["lead_id"],
      },
      {
        name: "LeadVisit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "lead_id", type: "int" },
          { name: "visit_date", type: "date" },
        ],
        primaryKey: ["visit_id"],
        note: "One row per completed site visit.",
      },
      {
        name: "UnitBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "lead_id", type: "int" },
          { name: "unit_no", type: "varchar" },
          { name: "booked_on", type: "date" },
        ],
        primaryKey: ["booking_id"],
        note: "At most one booking per lead.",
      },
    ],
    examples: [
      {
        BuyerLead: [
          [1, "Ananya Reddy", "Housing"],
          [2, "Vivaan Joshi", "Walk-in"],
          [3, "Mia Patel", "Referral"],
          [4, "Nikhil Bose", "99acres"],
          [5, "Riya Singh", "MagicBricks"],
        ],
        LeadVisit: [
          [1, 1, "2025-01-04"],
          [2, 1, "2025-01-18"],
          [3, 2, "2025-01-10"],
          [4, 2, "2025-02-20"],
          [5, 3, "2025-01-12"],
          [6, 4, "2025-02-01"],
          [7, 5, "2025-02-02"],
        ],
        UnitBooking: [
          [1, 1, "T2-1103", "2025-01-25"],
          [2, 2, "T1-0704", "2025-01-10"],
          [3, 4, "T3-0201", "2025-01-28"],
          [4, 5, "T2-0905", "2025-02-16"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const leads = who.map((f, i) => [i + 1, fullName(f, rng), pick(rng, LEAD_SOURCES)]);
      const visits: Cell[][] = [];
      const bookings: Cell[][] = [];
      let vid = 1;
      let bid = 1;
      for (const l of leads) {
        const firstVisit = dateBetween(rng, "2025-01-01", "2025-03-15");
        const k = ri(rng, 0, 3);
        for (let i = 0; i < k; i++) visits.push([vid++, l[0]!, addDays(firstVisit, i === 0 ? 0 : ri(rng, 1, 40))]);
        if (chance(rng, 0.65)) {
          const booked = addDays(firstVisit, chance(rng, 0.2) ? pick(rng, [0, -3]) : ri(rng, 1, 45));
          bookings.push([bid++, l[0]!, `T${ri(rng, 1, 3)}-${String(ri(rng, 1, 15)).padStart(2, "0")}0${ri(rng, 1, 6)}`, booked]);
        }
      }
      return { BuyerLead: leads, LeadVisit: shuffle(rng, visits), UnitBooking: bookings };
    },
    solution: [
      "SELECT l.lead_id, l.name,",
      "       MIN(v.visit_date) AS first_visit,",
      "       b.booked_on,",
      "       DATEDIFF(b.booked_on, MIN(v.visit_date)) AS days_to_book,",
      "       COUNT(*) AS visits_before_booking",
      "FROM BuyerLead l",
      "JOIN UnitBooking b ON b.lead_id = l.lead_id",
      "JOIN LeadVisit v ON v.lead_id = l.lead_id AND v.visit_date <= b.booked_on",
      "GROUP BY l.lead_id, l.name, b.booked_on",
      "ORDER BY days_to_book, l.lead_id",
    ].join("\n"),
    alternatives: [
      "SELECT * FROM (SELECT l.lead_id, l.name, (SELECT MIN(v.visit_date) FROM LeadVisit v WHERE v.lead_id = l.lead_id AND v.visit_date <= b.booked_on) AS first_visit, b.booked_on, DATEDIFF(b.booked_on, (SELECT MIN(v.visit_date) FROM LeadVisit v WHERE v.lead_id = l.lead_id AND v.visit_date <= b.booked_on)) AS days_to_book, (SELECT COUNT(*) FROM LeadVisit v WHERE v.lead_id = l.lead_id AND v.visit_date <= b.booked_on) AS visits_before_booking FROM BuyerLead l JOIN UnitBooking b ON b.lead_id = l.lead_id) t WHERE first_visit IS NOT NULL ORDER BY days_to_book, lead_id",
      "WITH pre AS (SELECT b.lead_id, b.booked_on, v.visit_date FROM UnitBooking b JOIN LeadVisit v ON v.lead_id = b.lead_id WHERE v.visit_date <= b.booked_on) SELECT l.lead_id, l.name, MIN(p.visit_date) AS first_visit, MAX(p.booked_on) AS booked_on, DATEDIFF(MAX(p.booked_on), MIN(p.visit_date)) AS days_to_book, COUNT(*) AS visits_before_booking FROM pre p JOIN BuyerLead l ON l.lead_id = p.lead_id GROUP BY l.lead_id, l.name ORDER BY days_to_book, l.lead_id",
    ],
    ordered: true,
    hints: [
      "Join the booking to the lead's visits, keeping only visits on or before the booking date.",
      "Group per lead: the first visit is a MIN, the visit count a COUNT.",
      "An inner join drops leads who booked without a prior visit, as the statement wants.",
    ],
    editorial: [
      "Join three tables and aggregate once. Each lead with a booking is joined to its visits, with the condition `v.visit_date <= b.booked_on` in the join so that post-booking walkthroughs never match. Grouping by the lead (and the booking date, which is one value per lead) gives `MIN(visit_date)` as the first visit and `COUNT(*)` as the visits before booking; `DATEDIFF` of the two dates is the time to close.",
      "",
      "Inner joins do the exclusions for free: a lead with no booking (Mia) never joins `UnitBooking`, and a lead whose only visit came after the booking (Nikhil) finds no qualifying visit. A visit on the booking day itself counts — Vivaan visited and booked on the 10th, so his time to close is 0 and his later visit is ignored.",
      "",
      "Correlated subqueries for the first visit and the count work too, with an outer filter dropping leads whose first visit is NULL. With an index on `LeadVisit(lead_id, visit_date)` every form is one range read per booked lead.",
    ].join("\n"),
  },
  {
    slug: "co-living-bed-occupancy-by-property",
    title: "Co-Living Bed Occupancy by Property",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic", "Dates"],
    description: [
      "A co-living operator reports occupancy at the end of the quarter, the night of **2025-06-30**. A bed is **occupied** that night when some stay on it has `check_in` on or before 2025-06-30 and either no `check_out` yet or a `check_out` **after** 2025-06-30 (the check-out day itself is not a night stayed).",
      "",
      "Return every property with `property_name`, `beds`, `occupied` and `occupancy_pct` = 100 × occupied ÷ beds **rounded to 1 decimal** (NULL for a property with no beds yet). Order by `property_name`.",
    ].join("\n"),
    tables: [
      {
        name: "CoLivingProperty",
        columns: [
          { name: "property_id", type: "int" },
          { name: "property_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["property_id"],
        note: "Property names are unique.",
      },
      {
        name: "Bed",
        columns: [
          { name: "bed_id", type: "int" },
          { name: "property_id", type: "int" },
          { name: "room_type", type: "enum", values: ["single", "twin", "triple"] },
        ],
        primaryKey: ["bed_id"],
      },
      {
        name: "Stay",
        columns: [
          { name: "stay_id", type: "int" },
          { name: "bed_id", type: "int" },
          { name: "resident_name", type: "varchar" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
        ],
        primaryKey: ["stay_id"],
        note: "Stays on one bed never overlap. `check_out` is NULL while the resident still lives there.",
      },
    ],
    examples: [
      {
        CoLivingProperty: [
          [1, "Nest Koramangala", "Bengaluru"],
          [2, "Nest Baner", "Pune"],
          [3, "Nest Hitech City", "Hyderabad"],
        ],
        Bed: [
          [11, 1, "single"],
          [12, 1, "twin"],
          [13, 1, "twin"],
          [14, 1, "triple"],
          [21, 2, "single"],
          [22, 2, "twin"],
        ],
        Stay: [
          [1, 11, "Aisha Khan", "2025-01-05", null],
          [2, 12, "Dev Iyer", "2025-03-01", "2025-06-30"],
          [3, 12, "Olivia Rao", "2025-06-30", null],
          [4, 13, "Karan Nair", "2025-04-10", "2025-07-15"],
          [5, 14, "Sara Das", "2025-07-01", null],
          [6, 21, "Noah Gupta", "2025-02-01", "2025-05-31"],
          [7, 22, "Ira Verma", "2025-05-01", "2025-07-01"],
        ],
      },
    ],
    gen: (rng) => {
      const props = sample(rng, ["Nest Koramangala", "Nest Baner", "Nest Hitech City", "Nest Powai", "Nest Gurugram"], ri(rng, 1, 4)).map((p, i) => [i + 1, p, pick(rng, CITIES_RE)]);
      const beds: Cell[][] = [];
      const stays: Cell[][] = [];
      let bid = 1;
      let sid = 1;
      for (const p of props) {
        const k = chance(rng, 0.15) ? 0 : ri(rng, 1, 6);
        for (let i = 0; i < k; i++) {
          const bed = bid++;
          beds.push([bed, p[0]!, pick(rng, ["single", "twin", "triple"])]);
          let at = dateBetween(rng, "2025-01-01", "2025-05-01");
          for (let s = ri(rng, 0, 2); s > 0; s--) {
            const out = chance(rng, 0.2) ? (chance(rng, 0.5) ? "2025-06-30" : "2025-07-01") : addDays(at, ri(rng, 20, 160));
            const open = chance(rng, 0.25);
            if (out <= at) break;
            stays.push([sid++, bed, fullName(pick(rng, names(rng, 4)), rng), at, open ? null : out]);
            if (open) break;
            at = out;
          }
        }
      }
      return { CoLivingProperty: props, Bed: beds, Stay: stays };
    },
    solution: [
      "SELECT p.property_name,",
      "       COUNT(DISTINCT b.bed_id) AS beds,",
      "       COUNT(DISTINCT CASE WHEN s.stay_id IS NOT NULL THEN b.bed_id END) AS occupied,",
      "       ROUND(100 * COUNT(DISTINCT CASE WHEN s.stay_id IS NOT NULL THEN b.bed_id END) / NULLIF(COUNT(DISTINCT b.bed_id), 0), 1) AS occupancy_pct",
      "FROM CoLivingProperty p",
      "LEFT JOIN Bed b ON b.property_id = p.property_id",
      "LEFT JOIN Stay s ON s.bed_id = b.bed_id",
      "  AND s.check_in <= '2025-06-30'",
      "  AND (s.check_out IS NULL OR s.check_out > '2025-06-30')",
      "GROUP BY p.property_id, p.property_name",
      "ORDER BY p.property_name",
    ].join("\n"),
    alternatives: [
      "SELECT p.property_name, COUNT(b.bed_id) AS beds, COALESCE(SUM(b.occ), 0) AS occupied, ROUND(100 * SUM(b.occ) / NULLIF(COUNT(b.bed_id), 0), 1) AS occupancy_pct FROM CoLivingProperty p LEFT JOIN (SELECT bed_id, property_id, CASE WHEN EXISTS (SELECT 1 FROM Stay s WHERE s.bed_id = bd.bed_id AND s.check_in <= '2025-06-30' AND COALESCE(s.check_out, '9999-12-31') > '2025-06-30') THEN 1 ELSE 0 END AS occ FROM Bed bd) b ON b.property_id = p.property_id GROUP BY p.property_id, p.property_name ORDER BY p.property_name",
    ],
    ordered: true,
    hints: [
      "Start from the property and LEFT JOIN beds, then LEFT JOIN only the stays that cover the night of 30 June.",
      "The stay's date test belongs in the join condition, so a bed without such a stay is kept as unoccupied.",
      "Guard the division with NULLIF for a property that has no beds.",
    ],
    editorial: [
      "Every property appears, so the query starts at `CoLivingProperty` and LEFT JOINs `Bed`, then LEFT JOINs `Stay` with the **night-of test in the `ON` clause**: checked in on or before the 30th, and either still there or checking out after it. Beds with no covering stay stay in the result with NULL stay columns — they are the unoccupied beds. Putting the date test in `WHERE` would delete them and every property would look full.",
      "",
      "The boundary decides two beds in the example: Dev checks out on the 30th and Olivia checks in the same day — the bed is occupied that night by Olivia, once. Counting `DISTINCT` bed ids keeps a bed from counting twice if two stays ever matched. Noah left in May, Ira is still in on the 30th.",
      "",
      "`NULLIF(beds, 0)` turns the percentage of a property without beds into NULL instead of a division error. The alternative computes an occupied flag per bed with `EXISTS` and sums it.",
    ].join("\n"),
  },

  {
    slug: "broker-best-month-by-deal-value",
    title: "Each Broker's Best Month by Deal Value",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "A brokerage's annual awards name each broker's **best month**: the calendar month (`'YYYY-MM'`) in which the broker's closed deals added up to the **highest total `deal_value`**. If two months tie, the **earlier** month wins.",
      "",
      "Return `broker_name`, `best_month`, `month_value` (that month's total) and `deals_in_month`, one row per broker who closed any deal, **ordered by `broker_name`**.",
    ].join("\n"),
    tables: [
      {
        name: "ClosedDeal",
        columns: [
          { name: "deal_id", type: "int" },
          { name: "broker_name", type: "varchar" },
          { name: "closed_on", type: "date" },
          { name: "deal_value", type: "int" },
        ],
        primaryKey: ["deal_id"],
        note: "`deal_value` is the transaction value in rupees.",
      },
    ],
    examples: [
      {
        ClosedDeal: [
          [1, "Kumar Estates", "2024-11-03", 9500000],
          [2, "Kumar Estates", "2024-11-21", 4500000],
          [3, "Kumar Estates", "2024-12-09", 14000000],
          [4, "Prime Homes", "2024-10-15", 7200000],
          [5, "Prime Homes", "2025-01-11", 3100000],
          [6, "Prime Homes", "2025-01-28", 5200000],
          [7, "Urban Keys", "2024-12-30", 8800000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const brokers = sample(rng, BROKERS, ri(rng, 1, 4));
      const values = [4000000, 5000000, 9000000, 10000000];
      const rows = seq(1, n).map((id) => [
        id,
        pick(rng, brokers),
        dateBetween(rng, "2024-09-01", "2025-02-28"),
        chance(rng, 0.5) ? pick(rng, values) : roundTo(rng, 2000000, 20000000, 100000),
      ]);
      return { ClosedDeal: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT broker_name,",
      "         DATE_FORMAT(closed_on, '%Y-%m') AS month,",
      "         SUM(deal_value) AS month_value,",
      "         COUNT(*) AS deals_in_month",
      "  FROM ClosedDeal",
      "  GROUP BY broker_name, DATE_FORMAT(closed_on, '%Y-%m')",
      "), ranked AS (",
      "  SELECT m.*, ROW_NUMBER() OVER (PARTITION BY broker_name ORDER BY month_value DESC, month) AS rn",
      "  FROM monthly m",
      ")",
      "SELECT broker_name, month AS best_month, month_value, deals_in_month",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY broker_name",
    ].join("\n"),
    alternatives: [
      "WITH monthly AS (SELECT broker_name, LEFT(closed_on, 7) AS month, SUM(deal_value) AS month_value, COUNT(*) AS deals_in_month FROM ClosedDeal GROUP BY broker_name, LEFT(closed_on, 7)) SELECT a.broker_name, a.month AS best_month, a.month_value, a.deals_in_month FROM monthly a WHERE NOT EXISTS (SELECT 1 FROM monthly b WHERE b.broker_name = a.broker_name AND (b.month_value > a.month_value OR (b.month_value = a.month_value AND b.month < a.month))) ORDER BY a.broker_name",
      "WITH monthly AS (SELECT broker_name, SUBSTRING(closed_on, 1, 7) AS month, SUM(deal_value) AS month_value, COUNT(*) AS deals_in_month FROM ClosedDeal GROUP BY broker_name, SUBSTRING(closed_on, 1, 7)), best AS (SELECT broker_name, MAX(month_value) AS top FROM monthly GROUP BY broker_name) SELECT m.broker_name, MIN(m.month) AS best_month, MAX(m.month_value) AS month_value, MIN(m.deals_in_month) AS deals_in_month FROM monthly m JOIN best b ON b.broker_name = m.broker_name AND b.top = m.month_value WHERE m.month = (SELECT MIN(x.month) FROM monthly x WHERE x.broker_name = m.broker_name AND x.month_value = b.top) GROUP BY m.broker_name ORDER BY m.broker_name",
    ],
    ordered: true,
    hints: [
      "First total each broker's deals per month — group by broker and the 'YYYY-MM' of the close date.",
      "Then rank each broker's months by total, highest first.",
      "Make the earlier month win a tie by adding it as the second sort key, and keep only rank 1.",
    ],
    editorial: [
      "Two steps. First aggregate to one row per broker per month: `DATE_FORMAT(closed_on, '%Y-%m')` buckets the dates, and `SUM`/`COUNT` give the month's value and number of deals. Then pick the top month per broker with `ROW_NUMBER() OVER (PARTITION BY broker_name ORDER BY month_value DESC, month)` and keep row 1.",
      "",
      "The second sort key is the tie rule. Kumar Estates closed ₹1.4 crore in November (two deals) and ₹1.4 crore in December (one deal): the totals tie, and ordering by `month` ascending makes November rank first. Without it, `ROW_NUMBER` would choose arbitrarily and the answer would change with storage order; with `RANK` both months would come back.",
      "",
      "The window-free alternative keeps a month when no other month of the same broker is better — a higher total, or the same total earlier — via `NOT EXISTS`. Either way the grouped CTE is small: one row per broker-month.",
    ].join("\n"),
  },

  {
    slug: "towers-where-every-unit-cleared-march-dues",
    title: "Towers Where Every Unit Cleared March Dues",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "A gated community wants to thank the towers where **every unit paid its full maintenance for `'2025-03'`**. A unit may pay in several receipts; it has cleared the month when its receipts for `'2025-03'` add up to **at least its `monthly_charge`**. A unit with no receipt for the month has not cleared it.",
      "",
      "Return `tower` and `units` (the number of units in it) for every tower where all units cleared the month, ordered by `tower`.",
    ].join("\n"),
    tables: [
      {
        name: "ApartmentUnit",
        columns: [
          { name: "unit_no", type: "varchar" },
          { name: "tower", type: "varchar" },
          { name: "monthly_charge", type: "int" },
        ],
        primaryKey: ["unit_no"],
        note: "`monthly_charge` is the unit's maintenance per month, in rupees.",
      },
      {
        name: "MaintenanceReceipt",
        columns: [
          { name: "receipt_id", type: "int" },
          { name: "unit_no", type: "varchar" },
          { name: "period", type: "char" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["receipt_id"],
        note: "`period` is the month paid for as `'YYYY-MM'`; `unit_no` is always in `ApartmentUnit`.",
      },
    ],
    examples: [
      {
        ApartmentUnit: [
          ["T1-101", "Tower 1", 4200],
          ["T1-102", "Tower 1", 4200],
          ["T2-101", "Tower 2", 5100],
          ["T2-102", "Tower 2", 5100],
          ["T3-101", "Tower 3", 3600],
          ["T4-101", "Tower 4", 3900],
        ],
        MaintenanceReceipt: [
          [1, "T1-101", "2025-03", 4200],
          [2, "T1-102", "2025-03", 2000],
          [3, "T1-102", "2025-03", 2200],
          [4, "T2-101", "2025-03", 5100],
          [5, "T2-102", "2025-03", 5000],
          [6, "T3-101", "2025-02", 3600],
          [7, "T4-101", "2025-03", 4000],
        ],
      },
    ],
    gen: (rng) => {
      const units: Cell[][] = [];
      for (const t of sample(rng, ["Tower 1", "Tower 2", "Tower 3", "Tower 4", "Tower 5"], ri(rng, 1, 4))) {
        const charge = roundTo(rng, 3000, 6000, 100);
        for (const u of sample(rng, seq(101, 6), ri(rng, 1, 3))) units.push([`T${t.slice(-1)}-${u}`, t, charge]);
      }
      const rows: Cell[][] = [];
      let id = 1;
      const good = pick(rng, [0.6, 0.85, 1]);
      for (const u of units) {
        const charge = u[2] as number;
        if (chance(rng, good)) {
          if (chance(rng, 0.3)) {
            const a = roundTo(rng, 500, charge - 500, 100);
            rows.push([id++, u[0]!, "2025-03", a], [id++, u[0]!, "2025-03", charge - a]);
          } else rows.push([id++, u[0]!, "2025-03", charge + pick(rng, [0, 0, 100])]);
        } else if (chance(rng, 0.6)) rows.push([id++, u[0]!, chance(rng, 0.5) ? "2025-03" : "2025-02", charge - pick(rng, [100, 500, 0])]);
      }
      return { ApartmentUnit: units, MaintenanceReceipt: shuffle(rng, rows) };
    },
    solution: [
      "SELECT u.tower, COUNT(*) AS units",
      "FROM ApartmentUnit u",
      "GROUP BY u.tower",
      "HAVING SUM(CASE WHEN u.monthly_charge <= (",
      "         SELECT COALESCE(SUM(r.amount), 0) FROM MaintenanceReceipt r",
      "         WHERE r.unit_no = u.unit_no AND r.period = '2025-03'",
      "       ) THEN 0 ELSE 1 END) = 0",
      "ORDER BY u.tower",
    ].join("\n"),
    alternatives: [
      "SELECT tower, COUNT(*) AS units FROM ApartmentUnit t WHERE NOT EXISTS (SELECT 1 FROM ApartmentUnit u WHERE u.tower = t.tower AND u.monthly_charge > (SELECT IFNULL(SUM(amount), 0) FROM MaintenanceReceipt r WHERE r.unit_no = u.unit_no AND r.period = '2025-03')) GROUP BY tower ORDER BY tower",
      "SELECT u.tower, COUNT(*) AS units FROM ApartmentUnit u LEFT JOIN (SELECT unit_no, SUM(amount) AS paid FROM MaintenanceReceipt WHERE period = '2025-03' GROUP BY unit_no) p ON p.unit_no = u.unit_no GROUP BY u.tower HAVING MIN(CASE WHEN COALESCE(p.paid, 0) >= u.monthly_charge THEN 1 ELSE 0 END) = 1 ORDER BY u.tower",
    ],
    ordered: true,
    hints: [
      "First work out, per unit, how much it paid for March — a unit with no receipt paid 0.",
      "A tower qualifies when **no** unit in it paid less than its charge.",
      "Either count the failing units per tower and require zero, or use NOT EXISTS for a failing unit.",
    ],
    editorial: [
      "This is a \"for all\" question — a tower qualifies only if *every* unit cleared — and SQL answers \"for all\" by checking that **no counterexample exists**. The counterexample is a unit whose March receipts sum to less than its charge. Summing per unit is required because units pay in instalments: T1-102 paid 2,000 + 2,200 = 4,200 and cleared, while T2-102 paid 5,000 of 5,100 and kept Tower 2 off the list.",
      "",
      "A unit without any March receipt must count as paying 0 — that is the `COALESCE(SUM(…), 0)` in the correlated subquery, or `COALESCE(p.paid, 0)` after a LEFT JOIN to pre-aggregated payments. Tower 3 paid only for February, so it fails; Tower 4 overpaid, which still clears.",
      "",
      "Three equivalent shapes: count failing units in `HAVING` and require zero; `NOT EXISTS` a failing unit in the same tower; or take the `MIN` of a cleared flag per tower and require 1. Pre-aggregating receipts once is the cheapest on a large ledger.",
    ].join("\n"),
  },

  {
    slug: "tenants-late-on-rent-three-months-running",
    title: "Tenants Late on Rent Three Months Running",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "A rental company escalates a lease when its rent was **late for three or more consecutive calendar months**. Each month's rent row has `rent_month` (the first of the month); rent is **late** when `paid_on` is NULL or after `rent_month` + 5 days. A month with no rent row (the lease was on a rent holiday) **breaks** a streak.",
      "",
      "Return one row per streak of 3+ consecutive late months: `lease_id`, `tenant_name`, `streak_start` and `streak_end` (the first and last `rent_month` of the streak) and `months`. Order by `lease_id`, then `streak_start`.",
    ].join("\n"),
    tables: [
      {
        name: "Tenancy",
        columns: [
          { name: "lease_id", type: "int" },
          { name: "tenant_name", type: "varchar" },
          { name: "flat_no", type: "varchar" },
        ],
        primaryKey: ["lease_id"],
      },
      {
        name: "MonthlyRent",
        columns: [
          { name: "lease_id", type: "int" },
          { name: "rent_month", type: "date" },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["lease_id", "rent_month"],
        note: "`rent_month` is always the first day of a month. `paid_on` is NULL when the rent was never received.",
      },
    ],
    examples: [
      {
        Tenancy: [
          [1, "Rahul Sharma", "A-302"],
          [2, "Zara Khan", "B-1204"],
          [3, "John Mehta", "C-701"],
          [4, "Emma Bose", "D-105"],
        ],
        MonthlyRent: [
          [1, "2024-10-01", "2024-10-03"],
          [1, "2024-11-01", "2024-11-09"],
          [1, "2024-12-01", null],
          [1, "2025-01-01", "2025-01-20"],
          [1, "2025-02-01", "2025-02-06"],
          [4, "2024-11-01", null],
          [4, "2024-12-01", null],
          [4, "2025-01-01", "2025-01-10"],
          [2, "2024-11-01", "2024-11-12"],
          [2, "2024-12-01", "2024-12-15"],
          [2, "2025-02-01", "2025-02-10"],
          [2, "2025-03-01", "2025-03-04"],
          [3, "2024-12-01", "2024-12-06"],
          [3, "2025-01-01", "2025-01-08"],
          [3, "2025-02-01", "2025-02-07"],
        ],
      },
    ],
    gen: (rng) => {
      const leases = sample(rng, seq(1, 8), ri(rng, 1, 4)).map((id) => [id, fullName(pick(rng, names(rng, 5)), rng), `${pick(rng, WINGS)}-${ri(rng, 1, 9)}0${ri(rng, 1, 4)}`]);
      const rows: Cell[][] = [];
      const lateRate = pick(rng, [0.4, 0.6, 0.8]);
      for (const l of leases) {
        const startM = ri(rng, 1, 6);
        const span = ri(rng, 2, 8);
        for (let k = 0; k < span; k++) {
          if (chance(rng, 0.1)) continue;
          const m = monthStart(2024, startM, k);
          const r = rng();
          const paid = chance(rng, lateRate)
            ? r < 0.25 ? null : addDays(m, pick(rng, [6, 9, 15, 25]))
            : addDays(m, pick(rng, [0, 2, 4, 5]));
          rows.push([l[0]!, m, paid]);
        }
      }
      return { Tenancy: leases, MonthlyRent: shuffle(rng, rows) };
    },
    solution: [
      "WITH late AS (",
      "  SELECT lease_id, rent_month,",
      "         YEAR(rent_month) * 12 + MONTH(rent_month)",
      "           - ROW_NUMBER() OVER (PARTITION BY lease_id ORDER BY rent_month) AS island",
      "  FROM MonthlyRent",
      "  WHERE paid_on IS NULL OR paid_on > DATE_ADD(rent_month, INTERVAL 5 DAY)",
      ")",
      "SELECT l.lease_id, t.tenant_name,",
      "       MIN(l.rent_month) AS streak_start,",
      "       MAX(l.rent_month) AS streak_end,",
      "       COUNT(*) AS months",
      "FROM late l",
      "JOIN Tenancy t ON t.lease_id = l.lease_id",
      "GROUP BY l.lease_id, t.tenant_name, l.island",
      "HAVING COUNT(*) >= 3",
      "ORDER BY l.lease_id, streak_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH flagged AS (",
        "  SELECT lease_id, rent_month, YEAR(rent_month) * 12 + MONTH(rent_month) AS mi,",
        "         CASE WHEN paid_on IS NULL OR DATEDIFF(paid_on, rent_month) > 5 THEN 1 ELSE 0 END AS is_late",
        "  FROM MonthlyRent",
        "), marked AS (",
        "  SELECT lease_id, rent_month, mi,",
        "         CASE WHEN LAG(mi) OVER (PARTITION BY lease_id ORDER BY mi) = mi - 1 THEN 0 ELSE 1 END AS starts",
        "  FROM flagged WHERE is_late = 1",
        "), grouped AS (",
        "  SELECT lease_id, rent_month,",
        "         SUM(starts) OVER (PARTITION BY lease_id ORDER BY mi ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp",
        "  FROM marked",
        ")",
        "SELECT g.lease_id, t.tenant_name, MIN(g.rent_month) AS streak_start, MAX(g.rent_month) AS streak_end, COUNT(*) AS months",
        "FROM grouped g JOIN Tenancy t ON t.lease_id = g.lease_id",
        "GROUP BY g.lease_id, t.tenant_name, g.grp",
        "HAVING COUNT(*) >= 3",
        "ORDER BY g.lease_id, streak_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the late months first; the streak question is then about consecutive months among those rows.",
      "Turn a month into a running number with YEAR × 12 + MONTH, so consecutive months differ by exactly 1.",
      "Within a lease, that number minus ROW_NUMBER is constant along a run of consecutive late months — group by it.",
      "A missing month leaves a hole in the month numbers, so it breaks the run by itself.",
    ],
    editorial: [
      "This is **gaps and islands**. Filter to the late months (`paid_on` NULL or more than 5 days after the first of the month) and number the months continuously with `YEAR * 12 + MONTH`, so December 2024 and January 2025 are neighbours. Along a run of consecutive late months, the month number rises by 1 and so does `ROW_NUMBER()` within the lease — their **difference is constant**, and it changes the moment a month is skipped. That difference is the island key: group by lease and key, and each group is one streak with `MIN`/`MAX` as its ends and `COUNT(*)` as its length.",
      "",
      "A gap breaks a streak either way: an on-time month is filtered out, and a missing month (Zara's January rent holiday) is simply absent, so in both cases the month numbers jump. Mind the grace boundary: rent for 1 February paid on the 6th is exactly 5 days later and on time, so Rahul's streak is November–January (paid on the 9th, never, the 20th) — three months. John paid on the 6th (on time), 8th and 7th: only two late months. Emma's streak runs across the new year, which the `YEAR * 12 + MONTH` numbering handles.",
      "",
      "The alternative marks a streak start wherever `LAG` of the month number is not the previous month and takes a running `SUM` of the marks as the group id. Both are a sort per lease.",
    ].join("\n"),
  },

  {
    slug: "median-registered-rate-per-sqft-by-locality",
    title: "Median Registered Rate per Sq Ft by Locality",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "A housing-price index uses the **median** registered rate per square foot rather than the mean, so one luxury sale cannot skew a locality. Use only transactions **registered in 2024**, and only localities with **at least 3** such transactions.",
      "",
      "The median of an odd number of rates is the middle one; of an even number, the average of the two middle ones. Return `locality`, `transactions` and `median_rate` **rounded to 1 decimal**, ordered by `median_rate` **descending**, then `locality`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleRegistration",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "locality", type: "varchar" },
          { name: "registered_on", type: "date" },
          { name: "rate_per_sqft", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per sale deed registered; `rate_per_sqft` is the consideration divided by the carpet area, in rupees.",
      },
    ],
    examples: [
      {
        SaleRegistration: [
          [1, "Whitefield", "2024-02-11", 7800],
          [2, "Whitefield", "2024-05-02", 9100],
          [3, "Whitefield", "2024-07-19", 8200],
          [4, "Whitefield", "2024-09-30", 21000],
          [5, "Hebbal", "2024-03-14", 11200],
          [6, "Hebbal", "2024-06-21", 10400],
          [7, "Hebbal", "2024-11-05", 10900],
          [8, "Hebbal", "2023-12-28", 9800],
          [9, "Koramangala", "2024-04-17", 16500],
          [10, "Koramangala", "2025-01-03", 17200],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      const locs = sample(rng, BLR_LOCALITIES, ri(rng, 1, 4));
      const base = Object.fromEntries(locs.map((l) => [l, roundTo(rng, 6000, 16000, 100)]));
      const rows = seq(1, n).map((id) => {
        const l = pick(rng, locs);
        const rate = chance(rng, 0.2) ? base[l]! : chance(rng, 0.1) ? base[l]! * 2 : base[l]! + roundTo(rng, -2000, 2000, 50);
        return [id, l, chance(rng, 0.85) ? dateBetween(rng, "2024-01-01", "2024-12-31") : pick(rng, ["2023-12-31", "2025-01-01", "2023-08-14"]), rate];
      });
      return { SaleRegistration: rows };
    },
    solution: [
      "WITH y AS (",
      "  SELECT locality, rate_per_sqft,",
      "         ROW_NUMBER() OVER (PARTITION BY locality ORDER BY rate_per_sqft, txn_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY locality) AS cnt",
      "  FROM SaleRegistration",
      "  WHERE registered_on BETWEEN '2024-01-01' AND '2024-12-31'",
      ")",
      "SELECT locality, MAX(cnt) AS transactions, ROUND(AVG(rate_per_sqft), 1) AS median_rate",
      "FROM y",
      "WHERE cnt >= 3",
      "  AND rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY locality",
      "ORDER BY median_rate DESC, locality",
    ].join("\n"),
    alternatives: [
      "WITH y AS (SELECT locality, rate_per_sqft, ROW_NUMBER() OVER (PARTITION BY locality ORDER BY rate_per_sqft, txn_id) AS up, ROW_NUMBER() OVER (PARTITION BY locality ORDER BY rate_per_sqft DESC, txn_id DESC) AS down FROM SaleRegistration WHERE YEAR(registered_on) = 2024) SELECT locality, MAX(up + down - 1) AS transactions, ROUND(AVG(rate_per_sqft), 1) AS median_rate FROM y WHERE ABS(CAST(up AS SIGNED) - CAST(down AS SIGNED)) <= 1 GROUP BY locality HAVING MAX(up + down - 1) >= 3 ORDER BY median_rate DESC, locality",
      "WITH y AS (SELECT txn_id, locality, rate_per_sqft FROM SaleRegistration WHERE YEAR(registered_on) = 2024), r AS (SELECT a.locality, a.rate_per_sqft, (SELECT COUNT(*) FROM y b WHERE b.locality = a.locality AND (b.rate_per_sqft < a.rate_per_sqft OR (b.rate_per_sqft = a.rate_per_sqft AND b.txn_id <= a.txn_id))) AS rn, (SELECT COUNT(*) FROM y c WHERE c.locality = a.locality) AS cnt FROM y a) SELECT locality, MAX(cnt) AS transactions, ROUND(AVG(rate_per_sqft), 1) AS median_rate FROM r WHERE cnt >= 3 AND (rn * 2 = cnt + 1 OR rn * 2 = cnt OR rn * 2 = cnt + 2) GROUP BY locality ORDER BY median_rate DESC, locality",
    ],
    ordered: true,
    hints: [
      "Number each locality's 2024 rates from lowest to highest, and count them, with two window functions.",
      "For n rates the middle positions are FLOOR((n + 1) / 2) and FLOOR((n + 2) / 2) — the same position when n is odd.",
      "Average the one or two middle rows per locality; break equal rates by `txn_id` so the numbering is fixed.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so build it from positions. Within each locality's 2024 transactions, `ROW_NUMBER() OVER (PARTITION BY locality ORDER BY rate_per_sqft, txn_id)` gives every rate its rank in sorted order, and `COUNT(*) OVER (PARTITION BY locality)` gives n on every row. The middle positions are `FLOOR((n + 1) / 2)` and `FLOOR((n + 2) / 2)`: for n = 3 both are 2, for n = 4 they are 2 and 3. Keeping those rows and averaging them per locality gives the median in both cases.",
      "",
      "The year filter runs before the windows so that n counts 2024 deeds only — Hebbal's December 2023 deed and Koramangala's January 2025 one do not count, which drops Koramangala below the 3-transaction floor. Whitefield's ₹21,000 luxury sale barely moves its median (8,650), which is the point of using one. Equal rates are harmless: the tie-break by `txn_id` fixes the numbering, and equal values give the same median whichever comes first.",
      "",
      "Without windows, a correlated count of the rates at or below each row (ties broken by id) gives the same position.",
    ].join("\n"),
  },
  {
    slug: "enquiry-to-token-funnel-by-lead-source",
    title: "Enquiry-to-Token Funnel by Lead Source",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A developer measures its sales funnel per lead source: **enquiry → site tour → token payment**. A stage only counts **in order**: an enquiry has *toured* if it has a tour on or after its `enquired_on` date, and has *tokened* if it paid a token on or after its **first** such tour. A token paid without a tour before it (an NRI booking over video call) does not count as tokened.",
      "",
      "Return one row per source with `source`, `enquiries`, `toured`, `tokened` and `tour_to_token_pct` = 100 × tokened ÷ toured **rounded to 1 decimal** (NULL when nothing toured). Order by `enquiries` **descending**, then `source`.",
    ].join("\n"),
    tables: [
      {
        name: "Enquiry",
        columns: [
          { name: "enquiry_id", type: "int" },
          { name: "source", type: "enum", values: [...LEAD_SOURCES] },
          { name: "enquired_on", type: "date" },
        ],
        primaryKey: ["enquiry_id"],
      },
      {
        name: "SiteTour",
        columns: [
          { name: "tour_id", type: "int" },
          { name: "enquiry_id", type: "int" },
          { name: "toured_on", type: "date" },
        ],
        primaryKey: ["tour_id"],
        note: "An enquiry can tour the site several times. A tour dated before the enquiry is a data-entry slip and does not count.",
      },
      {
        name: "TokenPayment",
        columns: [
          { name: "token_id", type: "int" },
          { name: "enquiry_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["token_id"],
        note: "A token is the booking advance; an enquiry may pay it in parts.",
      },
    ],
    examples: [
      {
        Enquiry: [
          [1, "99acres", "2025-01-02"],
          [2, "99acres", "2025-01-05"],
          [3, "99acres", "2025-01-07"],
          [4, "Referral", "2025-01-03"],
          [5, "Referral", "2025-01-09"],
          [6, "Walk-in", "2025-01-10"],
          [7, "Housing", "2025-01-12"],
        ],
        SiteTour: [
          [1, 1, "2025-01-06"],
          [2, 1, "2025-01-20"],
          [3, 2, "2025-01-11"],
          [4, 4, "2025-01-08"],
          [5, 6, "2025-01-10"],
          [6, 7, "2025-01-10"],
        ],
        TokenPayment: [
          [1, 1, "2025-01-20", 100000],
          [2, 1, "2025-01-25", 150000],
          [3, 3, "2025-01-15", 200000],
          [4, 4, "2025-01-08", 100000],
          [5, 6, "2025-01-09", 50000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const enq = seq(1, n).map((id) => [id, pick(rng, LEAD_SOURCES), dateBetween(rng, "2025-01-01", "2025-02-28")]);
      const tours: Cell[][] = [];
      const tokens: Cell[][] = [];
      let tid = 1;
      let kid = 1;
      const tourRate = pick(rng, [0.4, 0.7, 0.9]);
      for (const e of enq) {
        const on = e[2] as string;
        let first: string | null = null;
        if (chance(rng, tourRate)) {
          const k = ri(rng, 1, 2);
          for (let i = 0; i < k; i++) {
            const d = addDays(on, chance(rng, 0.1) ? -2 : ri(rng, 0, 20));
            tours.push([tid++, e[0]!, d]);
            if (d >= on && (first === null || d < first)) first = d;
          }
        }
        if (chance(rng, 0.5)) {
          const anchor = first ?? on;
          tokens.push([kid++, e[0]!, addDays(anchor, chance(rng, 0.2) ? pick(rng, [0, -1]) : ri(rng, 1, 20)), roundTo(rng, 50000, 300000, 25000)]);
        }
      }
      return { Enquiry: enq, SiteTour: shuffle(rng, tours), TokenPayment: tokens };
    },
    solution: [
      "WITH first_tour AS (",
      "  SELECT e.enquiry_id, MIN(t.toured_on) AS first_tour_on",
      "  FROM Enquiry e",
      "  JOIN SiteTour t ON t.enquiry_id = e.enquiry_id AND t.toured_on >= e.enquired_on",
      "  GROUP BY e.enquiry_id",
      "), stages AS (",
      "  SELECT e.enquiry_id, e.source,",
      "         CASE WHEN f.enquiry_id IS NULL THEN 0 ELSE 1 END AS toured,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM TokenPayment p",
      "           WHERE p.enquiry_id = e.enquiry_id AND p.paid_on >= f.first_tour_on",
      "         ) THEN 1 ELSE 0 END AS tokened",
      "  FROM Enquiry e",
      "  LEFT JOIN first_tour f ON f.enquiry_id = e.enquiry_id",
      ")",
      "SELECT source,",
      "       COUNT(*) AS enquiries,",
      "       SUM(toured) AS toured,",
      "       SUM(tokened) AS tokened,",
      "       ROUND(100 * SUM(tokened) / NULLIF(SUM(toured), 0), 1) AS tour_to_token_pct",
      "FROM stages",
      "GROUP BY source",
      "ORDER BY enquiries DESC, source",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.source, COUNT(DISTINCT e.enquiry_id) AS enquiries,",
        "       COUNT(DISTINCT t.enquiry_id) AS toured,",
        "       COUNT(DISTINCT p.enquiry_id) AS tokened,",
        "       ROUND(100 * COUNT(DISTINCT p.enquiry_id) / NULLIF(COUNT(DISTINCT t.enquiry_id), 0), 1) AS tour_to_token_pct",
        "FROM Enquiry e",
        "LEFT JOIN (SELECT s.enquiry_id, MIN(s.toured_on) AS first_on FROM SiteTour s JOIN Enquiry q ON q.enquiry_id = s.enquiry_id WHERE s.toured_on >= q.enquired_on GROUP BY s.enquiry_id) t ON t.enquiry_id = e.enquiry_id",
        "LEFT JOIN TokenPayment p ON p.enquiry_id = t.enquiry_id AND p.paid_on >= t.first_on",
        "GROUP BY e.source",
        "ORDER BY enquiries DESC, e.source",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work enquiry by enquiry first: find each enquiry's first valid tour (on or after the enquiry date).",
      "An enquiry has tokened only when a token's date is on or after that first tour — a token with no valid tour has nothing to compare to.",
      "Then aggregate the per-enquiry 0/1 flags by source; guard the percentage against zero tours with NULLIF.",
      "If you join tours and tokens directly, the rows multiply — count DISTINCT enquiries or pre-aggregate.",
    ],
    editorial: [
      "A funnel is easiest to get right **one entity at a time**: reduce each enquiry to a row of 0/1 stage flags, then aggregate the flags. The first CTE finds each enquiry's first valid tour — `MIN(toured_on)` over tours dated on or after the enquiry, so a tour typed in before the enquiry (a slip) never counts. The second CTE LEFT JOINs that to every enquiry: no first tour means `toured = 0`, and `tokened` is an `EXISTS` for a token paid on or after the first tour. When the first tour is NULL, the comparison is unknown and the flag is 0 — a token without a prior tour is not counted, which is the in-order rule.",
      "",
      "In the example, enquiry 3 paid a token but never toured; enquiry 6 paid the day before its tour; enquiry 7's only tour is dated before the enquiry. None of those advance. Enquiry 4 toured and paid on the same day — in order, so it counts.",
      "",
      "Joining tours and tokens straight onto enquiries multiplies rows (two tours × two token parts), so the alternative pre-aggregates the first tour and then counts `DISTINCT` enquiry ids at each stage. `NULLIF` keeps a source with no tours from dividing by zero.",
    ].join("\n"),
  },

  {
    slug: "overlapping-co-living-bed-bookings",
    title: "Double-Booked Beds in a Co-Living Space",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "A co-living operator's old booking tool allowed two residents to be booked on the same bed for overlapping dates. A booking occupies the nights from `move_in` up to the day **before** `move_out` — so one resident moving out on the day another moves in is **not** a clash.",
      "",
      "Return every pair of bookings on the same bed whose nights overlap, with `bed_code`, `first_booking` and `second_booking` (the smaller and larger `booking_id`) and `overlap_nights` (the number of nights both hold). Order by `bed_code`, `first_booking`, `second_booking`.",
    ].join("\n"),
    tables: [
      {
        name: "BedBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "bed_code", type: "varchar" },
          { name: "resident", type: "varchar" },
          { name: "move_in", type: "date" },
          { name: "move_out", type: "date" },
        ],
        primaryKey: ["booking_id"],
        note: "`move_out` is the departure day and is always after `move_in`. `bed_code` is the room and bed, such as `KOR-204-B`.",
      },
    ],
    examples: [
      {
        BedBooking: [
          [1, "KOR-204-A", "Aisha Khan", "2025-04-01", "2025-06-01"],
          [2, "KOR-204-A", "Diya Nair", "2025-06-01", "2025-08-01"],
          [3, "KOR-204-B", "Arjun Rao", "2025-04-10", "2025-05-10"],
          [4, "KOR-204-B", "Kabir Das", "2025-05-01", "2025-07-01"],
          [5, "KOR-204-B", "Liam Iyer", "2025-05-05", "2025-05-20"],
          [6, "KOR-301-A", "Meera Shah", "2025-04-15", "2025-09-15"],
          [7, "KOR-301-A", "Zara Joshi", "2025-06-01", "2025-06-02"],
        ],
      },
    ],
    gen: (rng) => {
      const beds = sample(rng, ["KOR-204-A", "KOR-204-B", "KOR-301-A", "BAN-102-A", "BAN-102-B"], ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const b of beds) {
        let at = dateBetween(rng, "2025-03-01", "2025-05-01");
        for (let k = ri(rng, 1, 5); k > 0; k--) {
          const len = ri(rng, 5, 60);
          rows.push([id++, b, fullName(pick(rng, names(rng, 5)), rng), at, addDays(at, len)]);
          // Next booking: back to back, a little later, or overlapping this one.
          const r = rng();
          at = r < 0.3 ? addDays(at, len) : r < 0.55 ? addDays(at, len + ri(rng, 1, 20)) : addDays(at, ri(rng, 1, Math.max(1, len - 1)));
        }
      }
      return { BedBooking: shuffle(rng, rows) };
    },
    solution: [
      "SELECT a.bed_code,",
      "       a.booking_id AS first_booking,",
      "       b.booking_id AS second_booking,",
      "       DATEDIFF(LEAST(a.move_out, b.move_out), GREATEST(a.move_in, b.move_in)) AS overlap_nights",
      "FROM BedBooking a",
      "JOIN BedBooking b",
      "  ON b.bed_code = a.bed_code",
      " AND a.booking_id < b.booking_id",
      " AND a.move_in < b.move_out",
      " AND b.move_in < a.move_out",
      "ORDER BY a.bed_code, first_booking, second_booking",
    ].join("\n"),
    alternatives: [
      "SELECT * FROM (SELECT a.bed_code, a.booking_id AS first_booking, b.booking_id AS second_booking, DATEDIFF(CASE WHEN a.move_out < b.move_out THEN a.move_out ELSE b.move_out END, CASE WHEN a.move_in > b.move_in THEN a.move_in ELSE b.move_in END) AS overlap_nights FROM BedBooking a JOIN BedBooking b ON b.bed_code = a.bed_code AND b.booking_id > a.booking_id) p WHERE overlap_nights > 0 ORDER BY bed_code, first_booking, second_booking",
    ],
    ordered: true,
    hints: [
      "Compare every booking with every other booking on the same bed — a self join on `bed_code`.",
      "Keep each pair once by requiring the first id to be smaller than the second.",
      "Two half-open ranges [in, out) overlap exactly when each starts before the other ends.",
      "The shared nights run from the later move-in to the earlier move-out.",
    ],
    editorial: [
      "Overlap is a property of a **pair** of rows, so self join `BedBooking` on the bed. `a.booking_id < b.booking_id` keeps every pair once (and never pairs a booking with itself). A booking holds the half-open range of nights `[move_in, move_out)`, and two half-open ranges overlap exactly when **each starts before the other ends**: `a.move_in < b.move_out AND b.move_in < a.move_out`. Strict inequalities make back-to-back stays — Aisha leaving on 1 June as Diya arrives — a non-clash.",
      "",
      "The overlap itself runs from the later start, `GREATEST(move_in)`, to the earlier end, `LEAST(move_out)`, and `DATEDIFF` counts the nights between. Zara's one-night stay inside Meera's long one overlaps for 1 night. On bed KOR-204-B three bookings collide: 3 and 4 share 9 nights, 3 and 5 share 5, and 4 and 5 share 15 — every pair is reported, not just neighbours in time.",
      "",
      "The alternative computes the overlap for every pair and keeps the positive ones, writing LEAST/GREATEST as CASE. The self join is quadratic per bed, which is fine for a handful of bookings per bed; an index on `(bed_code, move_in)` helps on a real table.",
    ].join("\n"),
  },

  {
    slug: "occupied-flats-on-the-first-of-each-month",
    title: "Occupied Flats on the First of Each Month",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "A landlord's dashboard charts, for the **first day of each month from January to June 2025**, how many of its flats had a tenant that day. A tenancy covers a day when `start_date` ≤ day ≤ `end_date`, or `end_date` is NULL (still running). **Every one of the six months must appear**, even when no flat was occupied.",
      "",
      "Return `month_start` (`'2025-01-01'` … `'2025-06-01'`), `occupied_flats` and `vacant_flats` (flats in `RentalFlat` minus occupied), ordered by `month_start`.",
    ].join("\n"),
    tables: [
      {
        name: "RentalFlat",
        columns: [
          { name: "flat_no", type: "varchar" },
          { name: "locality", type: "varchar" },
          { name: "bhk", type: "int" },
        ],
        primaryKey: ["flat_no"],
      },
      {
        name: "FlatTenancy",
        columns: [
          { name: "tenancy_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["tenancy_id"],
        note: "`end_date` is the tenant's last day, NULL while the tenancy runs. A flat's tenancies may touch but a flat is never counted twice on one day.",
      },
    ],
    examples: [
      {
        RentalFlat: [
          ["BN-101", "Baner", 2],
          ["BN-102", "Baner", 3],
          ["WK-201", "Wakad", 1],
          ["KH-305", "Kharadi", 2],
        ],
        FlatTenancy: [
          [1, "BN-101", "2024-06-01", "2025-02-28"],
          [2, "BN-101", "2025-04-01", null],
          [3, "BN-102", "2025-01-01", "2025-03-01"],
          [4, "WK-201", "2025-02-15", "2025-05-31"],
          [5, "BN-102", "2025-03-01", "2025-04-30"],
        ],
      },
    ],
    gen: (rng) => {
      const flats = sample(rng, ["BN-101", "BN-102", "WK-201", "WK-202", "KH-305", "AU-110", "HN-404"], ri(rng, 1, 6)).map((f) => [f, pick(rng, LOCALITIES), ri(rng, 1, 3)]);
      const rows: Cell[][] = [];
      let id = 1;
      const rate = pick(rng, [0, 0.5, 0.8, 1]);
      for (const f of flats) {
        if (!chance(rng, rate)) continue;
        let at = dateBetween(rng, "2024-10-01", "2025-04-01");
        for (let k = ri(rng, 1, 2); k > 0; k--) {
          const open = chance(rng, 0.25);
          const end = chance(rng, 0.25) ? addDays(monthStart(2025, ri(rng, 1, 6), 0), pick(rng, [-1, 0])) : addDays(at, ri(rng, 30, 200));
          if (end < at) break;
          rows.push([id++, f[0]!, at, open ? null : end]);
          if (open) break;
          at = addDays(end, ri(rng, 1, 60));
        }
      }
      return { RentalFlat: flats, FlatTenancy: rows };
    },
    solution: [
      "WITH RECURSIVE months AS (",
      "  SELECT CAST('2025-01-01' AS DATE) AS month_start",
      "  UNION ALL",
      "  SELECT DATE_ADD(month_start, INTERVAL 1 MONTH) FROM months WHERE month_start < '2025-06-01'",
      ")",
      "SELECT m.month_start,",
      "       COUNT(DISTINCT t.flat_no) AS occupied_flats,",
      "       (SELECT COUNT(*) FROM RentalFlat) - COUNT(DISTINCT t.flat_no) AS vacant_flats",
      "FROM months m",
      "LEFT JOIN FlatTenancy t",
      "  ON t.start_date <= m.month_start",
      " AND (t.end_date IS NULL OR t.end_date >= m.month_start)",
      "GROUP BY m.month_start",
      "ORDER BY m.month_start",
    ].join("\n"),
    alternatives: [
      "WITH months AS (SELECT CAST('2025-01-01' AS DATE) AS month_start UNION ALL SELECT CAST('2025-02-01' AS DATE) UNION ALL SELECT CAST('2025-03-01' AS DATE) UNION ALL SELECT CAST('2025-04-01' AS DATE) UNION ALL SELECT CAST('2025-05-01' AS DATE) UNION ALL SELECT CAST('2025-06-01' AS DATE)) SELECT m.month_start, (SELECT COUNT(*) FROM RentalFlat f WHERE EXISTS (SELECT 1 FROM FlatTenancy t WHERE t.flat_no = f.flat_no AND t.start_date <= m.month_start AND COALESCE(t.end_date, '9999-12-31') >= m.month_start)) AS occupied_flats, (SELECT COUNT(*) FROM RentalFlat f WHERE NOT EXISTS (SELECT 1 FROM FlatTenancy t WHERE t.flat_no = f.flat_no AND t.start_date <= m.month_start AND COALESCE(t.end_date, '9999-12-31') >= m.month_start)) AS vacant_flats FROM months m ORDER BY m.month_start",
    ],
    ordered: true,
    hints: [
      "The months must exist even when no tenancy matches them, so generate them yourself — a recursive CTE or six literal rows.",
      "LEFT JOIN tenancies to the months with the covering test in the ON clause.",
      "A NULL end date means the tenancy is still running.",
      "Count DISTINCT flats, and get the vacant figure from the total number of flats.",
    ],
    editorial: [
      "The output's rows are **dates that may not appear in any table**, so the query must make them. A recursive CTE starts at `2025-01-01` and adds a month with `DATE_ADD(…, INTERVAL 1 MONTH)` until June — six rows, bounded by the `WHERE` in the recursive step. Six literal rows joined by `UNION ALL` work as well for a fixed range.",
      "",
      "LEFT JOIN `FlatTenancy` to the months with the covering condition — started on or before the day, and ending on or after it or not at all — in the `ON` clause, so a month with no tenant still yields one row with NULLs, and `COUNT(DISTINCT t.flat_no)` counts 0 there. The end date is inclusive: BN-102's first tenancy ends on 1 March and the next starts that day, and the flat is counted once, which is what `DISTINCT` is for. BN-101's tenancy ending 28 February leaves it vacant on 1 March.",
      "",
      "Vacant flats are the total from `RentalFlat` minus the occupied count. The alternative counts flats with and without a covering tenancy using `EXISTS` per month.",
    ].join("\n"),
  },

  {
    slug: "top-two-agents-per-city-by-commission-with-ties",
    title: "Top Two Agents per City by Commission, Ties Included",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "A national brokerage rewards the **top two commission totals in each city** for financial year 2024–25 (**2024-04-01 to 2025-03-31**, inclusive). Agents with equal totals share a place, and places are not skipped: if two agents tie for first, the next total is second.",
      "",
      "Return `city`, `agent_name`, `total_commission` and `city_rank` (1 or 2) for every agent in the first two places of their city. Agents with no commission in the year are not ranked. Order by `city`, `city_rank`, `agent_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Agent",
        columns: [
          { name: "agent_id", type: "int" },
          { name: "agent_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["agent_id"],
        note: "Agent names are unique.",
      },
      {
        name: "CommissionEarned",
        columns: [
          { name: "commission_id", type: "int" },
          { name: "agent_id", type: "int" },
          { name: "earned_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["commission_id"],
        note: "One row per commission credited, in rupees.",
      },
    ],
    examples: [
      {
        Agent: [
          [1, "Aditi Verma", "Pune"],
          [2, "Rohan Shah", "Pune"],
          [3, "Neha Iyer", "Pune"],
          [4, "Kabir Menon", "Pune"],
          [5, "Simran Rao", "Mumbai"],
          [6, "David Khan", "Mumbai"],
        ],
        CommissionEarned: [
          [1, 1, "2024-05-10", 150000],
          [2, 1, "2024-11-02", 90000],
          [3, 2, "2024-08-19", 240000],
          [4, 3, "2024-06-30", 120000],
          [5, 3, "2025-04-02", 400000],
          [6, 4, "2024-03-31", 500000],
          [7, 4, "2024-12-12", 80000],
          [8, 5, "2025-03-31", 310000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const agents = who.map((f, i) => [i + 1, fullName(f, rng), pick(rng, ["Pune", "Mumbai", "Bengaluru"])]);
      const rows: Cell[][] = [];
      let id = 1;
      const amounts = [100000, 150000, 200000];
      for (const a of agents) {
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const d = chance(rng, 0.15) ? pick(rng, ["2024-03-31", "2024-04-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2024-04-01", "2025-03-31");
          rows.push([id++, a[0]!, d, chance(rng, 0.6) ? pick(rng, amounts) : roundTo(rng, 20000, 300000, 10000)]);
        }
      }
      return { Agent: agents, CommissionEarned: shuffle(rng, rows) };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT a.city, a.agent_name, SUM(c.amount) AS total_commission",
      "  FROM Agent a",
      "  JOIN CommissionEarned c ON c.agent_id = a.agent_id",
      "  WHERE c.earned_on BETWEEN '2024-04-01' AND '2025-03-31'",
      "  GROUP BY a.agent_id, a.city, a.agent_name",
      "), ranked AS (",
      "  SELECT city, agent_name, total_commission,",
      "         DENSE_RANK() OVER (PARTITION BY city ORDER BY total_commission DESC) AS city_rank",
      "  FROM totals",
      ")",
      "SELECT city, agent_name, total_commission, city_rank",
      "FROM ranked",
      "WHERE city_rank <= 2",
      "ORDER BY city, city_rank, agent_name",
    ].join("\n"),
    alternatives: [
      "WITH totals AS (SELECT a.city, a.agent_name, SUM(c.amount) AS total_commission FROM Agent a JOIN CommissionEarned c ON c.agent_id = a.agent_id WHERE c.earned_on >= '2024-04-01' AND c.earned_on < '2025-04-01' GROUP BY a.city, a.agent_name) SELECT t.city, t.agent_name, t.total_commission, (SELECT COUNT(DISTINCT u.total_commission) FROM totals u WHERE u.city = t.city AND u.total_commission >= t.total_commission) AS city_rank FROM totals t WHERE (SELECT COUNT(DISTINCT u.total_commission) FROM totals u WHERE u.city = t.city AND u.total_commission > t.total_commission) < 2 ORDER BY t.city, city_rank, t.agent_name",
    ],
    ordered: true,
    hints: [
      "Filter the commissions to the financial year before summing — the year boundaries are both inclusive.",
      "Total per agent, then rank within each city.",
      "\"Places are not skipped\" after a tie is DENSE_RANK, not RANK.",
    ],
    editorial: [
      "First reduce the ledger to one total per agent for the financial year. The date filter goes **before** the sum: Neha's ₹4 lakh credited on 2 April 2025 belongs to the next year, and Kabir's ₹5 lakh on 31 March 2024 to the previous one, which changes both their places. The inner join leaves out agents with no commission in the year.",
      "",
      "Then rank within each city with `DENSE_RANK() OVER (PARTITION BY city ORDER BY total_commission DESC)` and keep places 1 and 2. In Pune, Aditi (1.5 + 0.9 lakh) and Rohan both total ₹2.4 lakh and share first place; with `DENSE_RANK` Neha's ₹1.2 lakh is second, so three Pune agents are rewarded. `RANK` would give Neha 3 and drop her, and `ROW_NUMBER` would separate the tied pair arbitrarily — the statement's \"places are not skipped\" picks `DENSE_RANK`.",
      "",
      "Without windows, an agent's dense place is one plus the number of **distinct** higher totals in the city, computed by a correlated `COUNT(DISTINCT …)`.",
    ].join("\n"),
  },

  {
    slug: "renter-six-month-retention-by-move-in-cohort",
    title: "Six-Month Renter Retention by Move-In Cohort",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "A rental platform measures how many renters are still renting **through it six months after they first moved in**. A renter's **cohort** is the month (`'YYYY-MM'`) of their earliest lease `start_date`. A renter is **retained** when some lease of theirs — in any flat, since people move — covers the date exactly 6 months after that first start (`start_date` ≤ that date, and `end_date` on or after it or NULL).",
      "",
      "Return `cohort_month`, `renters`, `retained` and `retention_pct` = 100 × retained ÷ renters **rounded to 1 decimal**, ordered by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "RenterLease",
        columns: [
          { name: "lease_id", type: "int" },
          { name: "renter_id", type: "int" },
          { name: "flat_no", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["lease_id"],
        note: "`end_date` is the last day of the lease, NULL while it runs. A renter can hold several leases over time.",
      },
    ],
    examples: [
      {
        RenterLease: [
          [1, 101, "BN-101", "2024-01-10", "2024-07-09"],
          [2, 101, "WK-201", "2024-07-10", null],
          [3, 102, "KH-305", "2024-01-20", "2024-06-30"],
          [4, 103, "AU-110", "2024-01-05", "2024-07-05"],
          [5, 104, "BN-102", "2024-02-01", "2025-01-31"],
          [6, 105, "HN-404", "2024-02-14", "2024-05-13"],
          [7, 105, "BN-101", "2024-09-01", null],
          [8, 106, "WK-202", "2024-03-03", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const rows: Cell[][] = [];
      let id = 1;
      for (let r = 0; r < n; r++) {
        const renter = 100 + r + 1;
        let at = `2024-${String(ri(rng, 1, 4)).padStart(2, "0")}-${String(ri(rng, 1, 28)).padStart(2, "0")}`;
        for (let k = ri(rng, 1, 3); k > 0; k--) {
          const sixMonths = addDays(at, 182);
          const end = chance(rng, 0.2) ? null : chance(rng, 0.2) ? pick(rng, [addDays(sixMonths, -3), addDays(sixMonths, 2)]) : addDays(at, ri(rng, 60, 360));
          rows.push([id++, renter, `${pick(rng, ["BN", "WK", "KH", "AU"])}-${ri(rng, 1, 4)}0${ri(rng, 1, 9)}`, at, end]);
          if (end === null) break;
          at = addDays(end, chance(rng, 0.5) ? 1 : ri(rng, 10, 90));
        }
      }
      return { RenterLease: shuffle(rng, rows) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT renter_id, MIN(start_date) AS first_start",
      "  FROM RenterLease",
      "  GROUP BY renter_id",
      "), flagged AS (",
      "  SELECT f.renter_id,",
      "         DATE_FORMAT(f.first_start, '%Y-%m') AS cohort_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM RenterLease l",
      "           WHERE l.renter_id = f.renter_id",
      "             AND l.start_date <= DATE_ADD(f.first_start, INTERVAL 6 MONTH)",
      "             AND (l.end_date IS NULL OR l.end_date >= DATE_ADD(f.first_start, INTERVAL 6 MONTH))",
      "         ) THEN 1 ELSE 0 END AS retained",
      "  FROM firsts f",
      ")",
      "SELECT cohort_month,",
      "       COUNT(*) AS renters,",
      "       SUM(retained) AS retained,",
      "       ROUND(100 * SUM(retained) / COUNT(*), 1) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(f.first_start, 7) AS cohort_month,",
        "       COUNT(DISTINCT f.renter_id) AS renters,",
        "       COUNT(DISTINCT l.renter_id) AS retained,",
        "       ROUND(100 * COUNT(DISTINCT l.renter_id) / COUNT(DISTINCT f.renter_id), 1) AS retention_pct",
        "FROM (SELECT renter_id, MIN(start_date) AS first_start FROM RenterLease GROUP BY renter_id) f",
        "LEFT JOIN RenterLease l",
        "  ON l.renter_id = f.renter_id",
        " AND l.start_date <= DATE_ADD(f.first_start, INTERVAL 6 MONTH)",
        " AND COALESCE(l.end_date, '9999-12-31') >= DATE_ADD(f.first_start, INTERVAL 6 MONTH)",
        "GROUP BY LEFT(f.first_start, 7)",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each renter's first start date — that fixes both the cohort and the checkpoint date.",
      "The checkpoint is DATE_ADD(first_start, INTERVAL 6 MONTH); test whether any of the renter's leases covers it.",
      "A renter who moved flats may be covered by a later lease, so look at all their leases, not just the first.",
      "Aggregate the per-renter 0/1 flags by cohort month.",
    ],
    editorial: [
      "Cohort analysis is two steps: put each renter in a cohort, then measure an outcome per renter and aggregate. The first CTE takes `MIN(start_date)` per renter — that date fixes the cohort (`DATE_FORMAT(…, '%Y-%m')`) and the checkpoint, `DATE_ADD(first_start, INTERVAL 6 MONTH)`. The outcome is an `EXISTS`: is there a lease of this renter, any flat, that started on or before the checkpoint and ends on or after it or is still open?",
      "",
      "Looking at *all* leases is what makes movers count: renter 101's first lease ended on 9 July, but the new lease starting 10 July covers the checkpoint of 10 July. Renter 103's lease ends on 5 July — the very checkpoint, inclusive — so 103 is retained too, while 102 left in June. Renter 105 left after three months and came back in September; on the checkpoint, 14 August, there was no lease, so 105 is not retained.",
      "",
      "The alternative LEFT JOINs the covering leases and counts distinct renters on each side. Each cohort's percentage has a non-zero denominator, since a cohort exists only because it has renters.",
    ].join("\n"),
  },
];

