import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, maybeNull, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Digital marketing and advertising: the questions a performance-marketing
 * analyst at an Indian D2C brand or agency is asked every week — which
 * campaigns are still live, click-through rate, cost per acquisition, budget
 * pacing and overspend, UTM sources out of landing URLs, email opens and
 * unsubscribes, influencer deals, first- and last-touch attribution, ad-click
 * sessions, funnels and flight-date gaps. Money is in rupees; dates are
 * 2023–2025. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const CHANNELS = ["search", "social", "display", "video", "email"] as const;
const CAMPAIGN_NAMES = [
  "Diwali Mega Sale", "Monsoon Footwear", "IPL Jersey Drop", "Back to College", "Republic Day Offers",
  "Summer Cooler Push", "New Year Plans", "Holi Colours Kit", "Onam Festive Deals", "Wedding Season Gold",
  "Raksha Bandhan Gifts", "Independence Day Sale", "Pongal Kitchen Week", "Navratri Ethnic Wear", "Exam Season Notes",
  "Winter Skincare", "Cricket World Cup Merch", "Eid Festive Edit", "Durga Puja Specials", "Ganesh Chaturthi Decor",
] as const;
const CREATORS = [
  "@chaiwithmeera", "@techbyrohan", "@fitwithkavya", "@desistyleaisha", "@foodiekabir", "@travelwithdev",
  "@budgetbyneha", "@gamerharsh", "@skincarebyira", "@momlifepooja", "@codewitharjun", "@bollybeatszara",
] as const;
const SUBJECTS = [
  "Your cart misses you",
  "Diwali deals end tonight: up to 60% off on everything you saved",
  "Last chance",
  "Free shipping this weekend only",
  "New arrivals for the monsoon season are here and they will not last long",
  "Your monthly statement of reward points and exclusive member-only offers",
  "Flash sale: 2 hours left",
  "We picked these just for you based on what you browsed last week",
  "Your order is on its way",
  "Rate your last purchase and earn 50 bonus coins on your next order",
  "Hello again",
  "Big Billion Days early access for our top 1 percent of loyal shoppers",
] as const;

export const WORLD_MARKETING: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "ad-campaigns-still-live-at-quarter-close",
    title: "Ad Campaigns Still Live at the Quarter Close",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The finance team closes the books on **2024-06-30** and needs to accrue the cost of every campaign that is still running that day.",
      "",
      "A campaign is still live on 2024-06-30 when its `status` is `'active'`, its `start_date` is **on or before** 2024-06-30, and its `end_date` is either NULL (an always-on campaign) or **on or after** 2024-06-30. Return `campaign_id`, `campaign_name` and `channel`, ordered by `campaign_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "channel", type: "enum", values: [...CHANNELS] },
          { name: "status", type: "enum", values: ["active", "paused", "ended", "draft"] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per ad campaign. `end_date` is NULL for an always-on campaign with no planned end.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Monsoon Footwear", "social", "active", "2024-06-01", "2024-07-15"],
          [2, "IPL Jersey Drop", "video", "active", "2024-03-20", "2024-05-26"],
          [3, "Back to College", "search", "active", "2024-06-10", null],
          [4, "Summer Cooler Push", "display", "paused", "2024-04-01", null],
          [5, "Independence Day Sale", "social", "active", "2024-08-01", "2024-08-16"],
          [6, "Exam Season Notes", "search", "active", "2024-05-01", "2024-06-30"],
          [7, "Holi Colours Kit", "email", "draft", "2024-06-15", "2024-07-01"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows: Cell[][] = sample(rng, CAMPAIGN_NAMES, n).map((name, i) => {
        const start = chance(rng, 0.1) ? "2024-06-30" : dateBetween(rng, "2024-03-01", "2024-08-31");
        const end = chance(rng, 0.3) ? null : chance(rng, 0.15) ? "2024-06-30" : addDays(start, ri(rng, 0, 120));
        return [i + 1, name, pick(rng, CHANNELS), pick(rng, ["active", "active", "active", "paused", "ended", "draft"]), start, end];
      });
      return { Campaign: rows };
    },
    solution: [
      "SELECT campaign_id, campaign_name, channel",
      "FROM Campaign",
      "WHERE status = 'active'",
      "  AND start_date <= '2024-06-30'",
      "  AND (end_date IS NULL OR end_date >= '2024-06-30')",
      "ORDER BY campaign_id",
    ].join("\n"),
    alternatives: [
      "SELECT campaign_id, campaign_name, channel FROM Campaign WHERE status = 'active' AND '2024-06-30' BETWEEN start_date AND COALESCE(end_date, '9999-12-31') ORDER BY campaign_id",
      "SELECT campaign_id, campaign_name, channel FROM Campaign WHERE status = 'active' AND DATEDIFF('2024-06-30', start_date) >= 0 AND DATEDIFF(IFNULL(end_date, '2099-12-31'), '2024-06-30') >= 0 ORDER BY campaign_id",
    ],
    ordered: true,
    hints: [
      "Three conditions must hold at once: the status, the start and the end.",
      "A campaign that ends on 2024-06-30 still runs that day, so both date comparisons include equality.",
      "`end_date >= '2024-06-30'` is unknown, not true, when `end_date` is NULL — handle the always-on campaigns explicitly.",
    ],
    editorial: [
      "This is a plain filter, and the whole difficulty is in the NULL. A campaign covers the day when the day falls inside `[start_date, end_date]`, both ends included, and it must also be `active` — a paused or draft campaign spends nothing even if its dates cover the day.",
      "",
      "For an always-on campaign `end_date` is NULL, and any comparison with NULL is *unknown*, which `WHERE` treats as false. Writing `end_date IS NULL OR end_date >= '2024-06-30'` keeps those campaigns. The alternatives replace the NULL by a date far in the future with `COALESCE` or `IFNULL`, which turns the check into one `BETWEEN`.",
      "",
      "Because dates are stored as fixed-format text, comparing them as strings is the same as comparing them as dates. The query reads the table once; an index on `status` or `start_date` would let it skip rows.",
    ].join("\n"),
  },

  {
    slug: "ad-group-click-through-rate",
    title: "Click-Through Rate of Every Ad Group",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The ads platform exports one row per ad group per day with that day's impressions and clicks. The account manager wants the lifetime click-through rate of each ad group.",
      "",
      "Return one row per ad group with `ad_group_id`, `impressions` (the total), `clicks` (the total) and `ctr_pct` = 100 × total clicks ÷ total impressions, **rounded to 2 decimals**. An ad group whose total impressions are 0 has `ctr_pct` NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AdGroupDailyStat",
        columns: [
          { name: "ad_group_id", type: "int" },
          { name: "stat_date", type: "date" },
          { name: "impressions", type: "int" },
          { name: "clicks", type: "int" },
        ],
        primaryKey: ["ad_group_id", "stat_date"],
        note: "One row per ad group per day it was eligible to serve. `clicks` never exceeds `impressions`.",
      },
    ],
    examples: [
      {
        AdGroupDailyStat: [
          [11, "2024-02-01", 1200, 36],
          [11, "2024-02-02", 800, 28],
          [12, "2024-02-01", 0, 0],
          [12, "2024-02-02", 0, 0],
          [13, "2024-02-01", 4500, 60],
          [14, "2024-02-02", 300, 9],
        ],
      },
    ],
    gen: (rng) => {
      const groups = sample(rng, seq(11, 20), ri(rng, 1, 7));
      const rows: Cell[][] = [];
      for (const g of groups) {
        const dead = chance(rng, 0.15);
        const days = ri(rng, 1, 4);
        for (let d = 0; d < days; d++) {
          const imp = dead ? 0 : roundTo(rng, 0, 6000, 50);
          rows.push([g, addDays("2024-02-01", d), imp, imp === 0 ? 0 : ri(rng, 0, Math.floor(imp / 15))]);
        }
      }
      return { AdGroupDailyStat: rows };
    },
    solution: [
      "SELECT ad_group_id,",
      "       SUM(impressions) AS impressions,",
      "       SUM(clicks) AS clicks,",
      "       ROUND(100 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2) AS ctr_pct",
      "FROM AdGroupDailyStat",
      "GROUP BY ad_group_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ad_group_id, SUM(impressions) AS impressions, SUM(clicks) AS clicks,",
        "       CASE WHEN SUM(impressions) = 0 THEN NULL ELSE ROUND(SUM(clicks) * 100 / SUM(impressions), 2) END AS ctr_pct",
        "FROM AdGroupDailyStat GROUP BY ad_group_id",
      ].join("\n"),
    ],
    hints: [
      "CTR is a ratio of totals, so sum the impressions and the clicks per ad group first.",
      "Averaging each day's CTR is a different number — a quiet day would weigh as much as a busy one.",
      "Dividing by zero must give NULL: `NULLIF` turns a zero denominator into NULL.",
    ],
    editorial: [
      "Group the daily rows by `ad_group_id` and sum both counters. The click-through rate of the whole period is the **ratio of the totals**, `100 × SUM(clicks) / SUM(impressions)`. Averaging the daily rates instead would give a day with 50 impressions the same weight as a day with 5,000, which is not what CTR means.",
      "",
      "An ad group that never served has a total of 0 impressions. `NULLIF(SUM(impressions), 0)` turns that zero into NULL, and any arithmetic with NULL is NULL, so the rate comes out NULL without an error in any engine. A `CASE` on the total, as in the alternative, says the same thing explicitly.",
      "",
      "Round last, on the exact ratio. The query is one pass over the table with a hash aggregate on the ad group.",
    ].join("\n"),
  },

  {
    slug: "campaigns-with-clicks-but-no-conversions",
    title: "Campaigns That Got Clicks but No Conversions",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Every tracked ad click belongs to a campaign, and a conversion (a purchase on the site) is credited to the click that brought the shopper in. The growth lead wants to pause campaigns that are buying traffic that never converts.",
      "",
      "Return `campaign_id` and `campaign_name` of every campaign that has **at least one click** and **no conversion on any of its clicks**. Campaigns with no clicks at all are not in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "channel", type: "enum", values: [...CHANNELS] },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign.",
      },
      {
        name: "AdClick",
        columns: [
          { name: "click_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "clicked_at", type: "datetime" },
        ],
        primaryKey: ["click_id"],
        note: "One row per tracked click; `campaign_id` is always in `Campaign`.",
      },
      {
        name: "Conversion",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "click_id", type: "int" },
          { name: "revenue", type: "int" },
        ],
        primaryKey: ["conversion_id"],
        note: "One row per order credited to a click; `click_id` is always in `AdClick`. `revenue` is in rupees.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Diwali Mega Sale", "search"],
          [2, "Winter Skincare", "social"],
          [3, "Pongal Kitchen Week", "display"],
          [4, "Onam Festive Deals", "video"],
        ],
        AdClick: [
          [101, 1, "2024-10-20 10:15:00"],
          [102, 1, "2024-10-20 11:02:00"],
          [103, 2, "2024-10-21 09:40:00"],
          [104, 2, "2024-10-21 21:05:00"],
          [105, 4, "2024-10-22 13:30:00"],
        ],
        Conversion: [
          [1, 102, 2499],
          [2, 105, 899],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 8)).map((n, i) => [i + 1, n, pick(rng, CHANNELS)]);
      const clicks: Cell[][] = seq(101, chance(rng, 0.05) ? 0 : ri(rng, 1, 20)).map((id) => [
        id, ri(rng, 1, camps.length), atTime(rng, dateBetween(rng, "2024-10-01", "2024-10-31")),
      ]);
      const conv: Cell[][] = [];
      let cid = 1;
      for (const c of clicks) if (chance(rng, 0.3)) conv.push([cid++, c[0]!, roundTo(rng, 199, 4999, 100)]);
      return { Campaign: camps, AdClick: clicks, Conversion: conv };
    },
    solution: [
      "SELECT c.campaign_id, c.campaign_name",
      "FROM Campaign c",
      "WHERE EXISTS (SELECT 1 FROM AdClick k WHERE k.campaign_id = c.campaign_id)",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM AdClick k JOIN Conversion v ON v.click_id = k.click_id",
      "    WHERE k.campaign_id = c.campaign_id",
      "  )",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.campaign_id, c.campaign_name",
        "FROM Campaign c",
        "JOIN AdClick k ON k.campaign_id = c.campaign_id",
        "LEFT JOIN Conversion v ON v.click_id = k.click_id",
        "GROUP BY c.campaign_id, c.campaign_name",
        "HAVING COUNT(v.conversion_id) = 0",
      ].join("\n"),
      [
        "SELECT campaign_id, campaign_name FROM Campaign",
        "WHERE campaign_id IN (SELECT campaign_id FROM AdClick)",
        "  AND campaign_id NOT IN (SELECT k.campaign_id FROM AdClick k JOIN Conversion v ON v.click_id = k.click_id)",
      ].join("\n"),
    ],
    hints: [
      "Two conditions: the campaign has a click, and none of its clicks has a conversion.",
      "A conversion reaches its campaign only through the click — join `Conversion` to `AdClick` to see which campaign it belongs to.",
      "An inner join to the clicks drops campaigns without clicks; a LEFT JOIN on to the conversions keeps clicks that never converted.",
    ],
    editorial: [
      "A conversion points at a click, and the click points at a campaign, so a campaign's conversions are found through `AdClick`. The answer is the campaigns with a click (**semi join**) and without a converted click (**anti join**).",
      "",
      "`EXISTS` and `NOT EXISTS` say exactly that: the first subquery looks for any click of the campaign, the second for any click of the campaign that has a conversion row. The join version starts from the clicks — an inner join to `AdClick` already removes campaigns with no traffic — then LEFT JOINs the conversions and keeps the groups where `COUNT(v.conversion_id)` is zero, since `COUNT` of a column skips the NULLs a missing match produces.",
      "",
      "`NOT IN` is safe here because the subquery's `campaign_id` is never NULL. With indexes on `AdClick.campaign_id` and `Conversion.click_id`, each form is a few lookups per campaign.",
    ].join("\n"),
  },

  {
    slug: "email-subject-lines-cut-off-in-the-inbox",
    title: "Email Subject Lines Cut Off in the Inbox Preview",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "Most mobile inboxes show only about 45 characters of a subject line. The CRM team wants every email campaign whose subject will be cut off, so it can be rewritten before the next send.",
      "",
      "Measure each subject **after trimming leading and trailing spaces**. Return `email_campaign_id`, `subject` (as stored) and `subject_length` (the trimmed length in characters) for every campaign whose trimmed subject is **longer than 45 characters**. A NULL subject (an unfinished draft) is never in the answer. Order by `subject_length` descending, then `email_campaign_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "EmailCampaign",
        columns: [
          { name: "email_campaign_id", type: "int" },
          { name: "subject", type: "varchar" },
          { name: "scheduled_on", type: "date" },
        ],
        primaryKey: ["email_campaign_id"],
        note: "One row per email blast. `subject` can carry stray spaces pasted from the copy doc, or be NULL for a draft.",
      },
    ],
    examples: [
      {
        EmailCampaign: [
          [1, "Your cart misses you", "2024-11-02"],
          [2, "Diwali deals end tonight: up to 60% off on everything you saved", "2024-10-30"],
          [3, "  Free shipping this weekend only on all orders  ", "2024-11-08"],
          [4, null, "2024-11-15"],
          [5, "Your monthly statement of reward points and exclusive member-only offers", "2024-11-01"],
          [6, "New arrivals for the monsoon are here, grab them!", "2024-07-04"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const rows: Cell[][] = seq(1, n).map((id) => {
        let s: string | null = pick(rng, SUBJECTS);
        if (chance(rng, 0.25)) s = `${" ".repeat(ri(rng, 1, 3))}${s}${" ".repeat(ri(rng, 0, 3))}`;
        // Now and then a subject of exactly 45 characters, the boundary "longer than" is about.
        if (chance(rng, 0.15)) s = "Weekend flash sale on shoes, bags and watches".padEnd(46, "!").slice(0, 45 + ri(rng, 0, 1));
        return [id, maybeNull(rng, 0.1, s), dateBetween(rng, "2024-06-01", "2024-12-31")];
      });
      return { EmailCampaign: rows };
    },
    solution: [
      "SELECT email_campaign_id, subject, CHAR_LENGTH(TRIM(subject)) AS subject_length",
      "FROM EmailCampaign",
      "WHERE CHAR_LENGTH(TRIM(subject)) > 45",
      "ORDER BY subject_length DESC, email_campaign_id",
    ].join("\n"),
    alternatives: [
      "SELECT * FROM (SELECT email_campaign_id, subject, LENGTH(TRIM(subject)) AS subject_length FROM EmailCampaign WHERE subject IS NOT NULL) t WHERE subject_length > 45 ORDER BY subject_length DESC, email_campaign_id",
    ],
    ordered: true,
    hints: [
      "`CHAR_LENGTH` counts characters; `TRIM` removes the spaces at both ends first.",
      "Filter on the trimmed length, not on the stored one — padding must not push a subject over the limit.",
      "The length of NULL is NULL, and `NULL > 45` is not true, so drafts drop out by themselves.",
    ],
    editorial: [
      "Compute the trimmed length once per row — `CHAR_LENGTH(TRIM(subject))` — and keep the rows where it is above 45. Measuring the stored text would count the stray spaces at either end, so a short subject pasted with padding would be flagged wrongly, which is why the statement asks for the trimmed length.",
      "",
      "A draft has a NULL subject; `TRIM(NULL)` and `CHAR_LENGTH(NULL)` are both NULL and `NULL > 45` is unknown, so the row is filtered out without a separate check. A subject of exactly 45 characters fits, because the condition is strict.",
      "",
      "The subjects here are plain ASCII, so `LENGTH` (bytes) and `CHAR_LENGTH` (characters) agree, as the alternative shows; with emoji or Devanagari they would not, and `CHAR_LENGTH` is the right one. Ordering by the alias works because `ORDER BY` runs after `SELECT`. The query is one scan.",
    ].join("\n"),
  },

  {
    slug: "email-campaigns-with-repeated-unsubscribes",
    title: "Email Campaigns That Drove Two or More Unsubscribes",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Every email delivered to a subscriber is one row, flagged when the subscriber opened it and when they clicked the unsubscribe link in it. The deliverability team reviews every campaign that cost the list **at least two unsubscribes**.",
      "",
      "Return `email_campaign_id`, `sends` (rows for the campaign) and `unsubscribes` (rows with `unsubscribed` = 1) for campaigns with `unsubscribes` ≥ 2. Order by `unsubscribes` descending, then `email_campaign_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "EmailSend",
        columns: [
          { name: "send_id", type: "int" },
          { name: "email_campaign_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "opened", type: "bool" },
          { name: "unsubscribed", type: "bool" },
        ],
        primaryKey: ["send_id"],
        note: "One row per email delivered. `opened` and `unsubscribed` are 0 or 1.",
      },
    ],
    examples: [
      {
        EmailSend: [
          [1, 7, 501, 1, 0],
          [2, 7, 502, 1, 1],
          [3, 7, 503, 0, 0],
          [4, 8, 501, 1, 1],
          [5, 8, 504, 1, 1],
          [6, 8, 505, 0, 0],
          [7, 9, 502, 1, 1],
          [8, 9, 506, 1, 1],
          [9, 9, 507, 1, 0],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const camp of sample(rng, seq(1, 12), ri(rng, 1, 7))) {
        const rate = pick(rng, [0, 0.4, 0.6, 0.8]);
        for (const sub of sample(rng, seq(501, 30), ri(rng, 2, 7))) {
          const opened = chance(rng, 0.75) ? 1 : 0;
          rows.push([id++, camp, sub, opened, opened && chance(rng, rate) ? 1 : 0]);
        }
      }
      return { EmailSend: rows };
    },
    solution: [
      "SELECT email_campaign_id,",
      "       COUNT(*) AS sends,",
      "       SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) AS unsubscribes",
      "FROM EmailSend",
      "GROUP BY email_campaign_id",
      "HAVING SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) >= 2",
      "ORDER BY unsubscribes DESC, email_campaign_id",
    ].join("\n"),
    alternatives: [
      "SELECT email_campaign_id, COUNT(*) AS sends, SUM(unsubscribed) AS unsubscribes FROM EmailSend GROUP BY email_campaign_id HAVING SUM(unsubscribed) >= 2 ORDER BY unsubscribes DESC, email_campaign_id",
      "SELECT email_campaign_id, COUNT(send_id) AS sends, COUNT(IF(unsubscribed = 1, 1, NULL)) AS unsubscribes FROM EmailSend GROUP BY email_campaign_id HAVING COUNT(IF(unsubscribed = 1, 1, NULL)) > 1 ORDER BY unsubscribes DESC, email_campaign_id",
    ],
    ordered: true,
    hints: [
      "One row per campaign: `GROUP BY email_campaign_id`.",
      "Counting only some rows of a group is a conditional sum — add 1 when the flag is set, 0 otherwise.",
      "A condition on an aggregate goes in `HAVING`, not `WHERE`.",
    ],
    editorial: [
      "Group the sends by campaign. `COUNT(*)` is the number of emails delivered, and the unsubscribes are a **conditional count**: `SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END)` adds one per flagged row. Because the flag is already 0 or 1, `SUM(unsubscribed)` is the same number, and `COUNT(IF(…, 1, NULL))` counts the non-NULLs — three spellings of one idea.",
      "",
      "The threshold is on an aggregate, so it belongs in `HAVING`; `WHERE unsubscribed = 1` would throw away the other rows before grouping and break the `sends` column. Ties on the count are ordered by campaign id, so the order is fully fixed. The query is one scan and one hash aggregate.",
    ].join("\n"),
  },

  {
    slug: "instagram-creator-deals-signed-in-q3-2024",
    title: "Instagram Creator Deals Signed in Q3 2024",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The influencer team signs paid deals with creators across platforms. For the quarterly review, the brand head wants the Instagram deals signed in the **third quarter of 2024** (1 July to 30 September, both included).",
      "",
      "Return `deal_id`, `creator_handle` and `fee` for every deal with `platform` = `'instagram'` signed in that quarter, ordered by `fee` descending, then `deal_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "InfluencerDeal",
        columns: [
          { name: "deal_id", type: "int" },
          { name: "creator_handle", type: "varchar" },
          { name: "platform", type: "enum", values: ["instagram", "youtube", "moj", "x"] },
          { name: "fee", type: "int" },
          { name: "signed_on", type: "date" },
        ],
        primaryKey: ["deal_id"],
        note: "One row per signed deal. `fee` is the agreed amount in rupees.",
      },
    ],
    examples: [
      {
        InfluencerDeal: [
          [1, "@chaiwithmeera", "instagram", 45000, "2024-07-01"],
          [2, "@techbyrohan", "youtube", 120000, "2024-08-12"],
          [3, "@fitwithkavya", "instagram", 60000, "2024-09-30"],
          [4, "@desistyleaisha", "instagram", 45000, "2024-08-05"],
          [5, "@foodiekabir", "instagram", 80000, "2024-10-01"],
          [6, "@budgetbyneha", "instagram", 30000, "2024-06-30"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const edges = ["2024-06-30", "2024-07-01", "2024-09-30", "2024-10-01", "2023-08-15"];
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, CREATORS),
        pick(rng, ["instagram", "instagram", "instagram", "youtube", "moj", "x"]),
        roundTo(rng, 15000, 150000, 15000),
        chance(rng, 0.3) ? pick(rng, edges) : dateBetween(rng, "2024-06-01", "2024-10-31"),
      ]);
      return { InfluencerDeal: rows };
    },
    solution: [
      "SELECT deal_id, creator_handle, fee",
      "FROM InfluencerDeal",
      "WHERE platform = 'instagram'",
      "  AND signed_on BETWEEN '2024-07-01' AND '2024-09-30'",
      "ORDER BY fee DESC, deal_id",
    ].join("\n"),
    alternatives: [
      "SELECT deal_id, creator_handle, fee FROM InfluencerDeal WHERE platform = 'instagram' AND YEAR(signed_on) = 2024 AND QUARTER(signed_on) = 3 ORDER BY fee DESC, deal_id",
      "SELECT deal_id, creator_handle, fee FROM InfluencerDeal WHERE platform = 'instagram' AND signed_on >= '2024-07-01' AND signed_on < '2024-10-01' ORDER BY fee DESC, deal_id",
    ],
    ordered: true,
    hints: [
      "Filter on the platform and on a date range.",
      "Both ends of the quarter are included — check a deal signed on 30 September.",
      "`QUARTER()` and `YEAR()` name the quarter directly, but a range on the raw column can use an index.",
    ],
    editorial: [
      "Two filters: the platform, and the signing date inside the quarter. `BETWEEN '2024-07-01' AND '2024-09-30'` includes both ends, which is what the statement asks for, and because the column is a `date` there is no time-of-day to fall past the upper bound. The half-open range `>= '2024-07-01' AND < '2024-10-01'` is the safer habit, since it stays correct for a `datetime` column too.",
      "",
      "`YEAR(signed_on) = 2024 AND QUARTER(signed_on) = 3` reads closest to the question, but wrapping the column in functions stops an index on `signed_on` from being used. The year check matters: a Q3 deal from 2023 must not slip in. Equal fees are broken by `deal_id`, so the order is fixed.",
    ].join("\n"),
  },

  {
    slug: "paid-media-spend-per-channel-in-march",
    title: "Paid Media Spend per Channel in March 2024",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Spend is recorded per campaign per day; the channel lives on the campaign. The CMO's monthly deck needs the total spend of each channel for **March 2024**.",
      "",
      "Return `channel` and `total_spend` (the sum of `spend` on days from 2024-03-01 to 2024-03-31) for every channel that spent in March. Channels with no March spend rows are left out. Order by `total_spend` descending, then `channel` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "channel", type: "enum", values: [...CHANNELS] },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day it spent; `spend` is in rupees and `campaign_id` is always in `Campaign`.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Holi Colours Kit", "social"],
          [2, "Exam Season Notes", "search"],
          [3, "Summer Cooler Push", "display"],
          [4, "Cricket World Cup Merch", "social"],
        ],
        DailySpend: [
          [1, "2024-03-20", 12000],
          [1, "2024-03-21", 15000],
          [2, "2024-03-01", 18000],
          [2, "2024-02-29", 9000],
          [3, "2024-04-01", 7000],
          [4, "2024-03-31", 9000],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 7)).map((n, i) => [i + 1, n, pick(rng, CHANNELS)]);
      const rows: Cell[][] = [];
      for (const c of camps) {
        const dates = new Set<string>();
        const k = ri(rng, 0, 4);
        for (let i = 0; i < k; i++) dates.add(chance(rng, 0.25) ? pick(rng, ["2024-02-29", "2024-03-01", "2024-03-31", "2024-04-01"]) : dateBetween(rng, "2024-02-20", "2024-04-10"));
        for (const d of dates) rows.push([c[0]!, d, roundTo(rng, 3000, 30000, 1000)]);
      }
      return { Campaign: camps, DailySpend: rows };
    },
    solution: [
      "SELECT c.channel, SUM(s.spend) AS total_spend",
      "FROM DailySpend s",
      "JOIN Campaign c ON c.campaign_id = s.campaign_id",
      "WHERE s.spend_date >= '2024-03-01' AND s.spend_date < '2024-04-01'",
      "GROUP BY c.channel",
      "ORDER BY total_spend DESC, c.channel",
    ].join("\n"),
    alternatives: [
      "SELECT c.channel, SUM(s.spend) AS total_spend FROM Campaign c JOIN DailySpend s ON s.campaign_id = c.campaign_id AND YEAR(s.spend_date) = 2024 AND MONTH(s.spend_date) = 3 GROUP BY c.channel ORDER BY total_spend DESC, c.channel",
      "SELECT channel, SUM(spend) AS total_spend FROM (SELECT (SELECT channel FROM Campaign c WHERE c.campaign_id = s.campaign_id) AS channel, spend FROM DailySpend s WHERE DATE_FORMAT(spend_date, '%Y-%m') = '2024-03') t GROUP BY channel ORDER BY total_spend DESC, channel",
    ],
    ordered: true,
    hints: [
      "The spend rows don't carry the channel — join them to `Campaign`.",
      "Filter to March before grouping; the leap day 29 February and 1 April sit right outside it.",
      "Group by the channel, not by the campaign.",
    ],
    editorial: [
      "Join each spend row to its campaign to learn the channel, keep only March's rows, and sum per channel. Filtering in `WHERE` before the `GROUP BY` means a channel whose only rows fall outside March produces no group at all, which is exactly \"left out\".",
      "",
      "The month can be written as a half-open range (`>= '2024-03-01' AND < '2024-04-01'`), as `YEAR(...) = 2024 AND MONTH(...) = 3`, or as `DATE_FORMAT(spend_date, '%Y-%m') = '2024-03'`. The range is the one that can use an index on `spend_date`; the others are easier to read. Several campaigns can share a channel, so grouping by the campaign would split the channel's total.",
      "",
      "Equal totals are ordered by the channel name, so the order is complete. Cost: one pass over the spend rows plus a primary-key lookup per row.",
    ].join("\n"),
  },

  {
    slug: "campaign-monthly-budget-tiers",
    title: "Label Each Campaign by Its Monthly Budget Tier",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "Media planners sort campaigns into budget tiers before the approval meeting. A campaign whose `monthly_budget` is NULL has not been planned yet.",
      "",
      "Return `campaign_id`, `campaign_name` and `budget_tier`: `'unset'` when the budget is NULL, `'small'` below ₹50,000, `'mid'` from ₹50,000 up to but not including ₹2,00,000, and `'large'` at ₹2,00,000 or more. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "monthly_budget", type: "int" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign. `monthly_budget` is in rupees, or NULL before the plan is approved.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Navratri Ethnic Wear", 250000],
          [2, "Raksha Bandhan Gifts", 50000],
          [3, "Winter Skincare", 49999],
          [4, "Eid Festive Edit", null],
          [5, "Wedding Season Gold", 200000],
          [6, "Ganesh Chaturthi Decor", 120000],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 12)).map((name, i) => [
        i + 1,
        name,
        maybeNull(rng, 0.15, chance(rng, 0.3) ? pick(rng, [49999, 50000, 199999, 200000]) : roundTo(rng, 10000, 400000, 5000)),
      ]);
      return { Campaign: rows };
    },
    solution: [
      "SELECT campaign_id, campaign_name,",
      "       CASE",
      "         WHEN monthly_budget IS NULL THEN 'unset'",
      "         WHEN monthly_budget < 50000 THEN 'small'",
      "         WHEN monthly_budget < 200000 THEN 'mid'",
      "         ELSE 'large'",
      "       END AS budget_tier",
      "FROM Campaign",
    ].join("\n"),
    alternatives: [
      "SELECT campaign_id, campaign_name, IF(monthly_budget IS NULL, 'unset', IF(monthly_budget < 50000, 'small', IF(monthly_budget < 200000, 'mid', 'large'))) AS budget_tier FROM Campaign",
      "SELECT campaign_id, campaign_name, CASE WHEN monthly_budget >= 200000 THEN 'large' WHEN monthly_budget >= 50000 THEN 'mid' WHEN monthly_budget >= 0 THEN 'small' ELSE 'unset' END AS budget_tier FROM Campaign",
    ],
    hints: [
      "A `CASE` expression checks its branches top to bottom and stops at the first true one.",
      "Order the thresholds so each branch only needs one comparison.",
      "Where does a NULL budget go if no branch mentions it?",
    ],
    editorial: [
      "A searched `CASE` returns the result of the first branch whose condition is true. Checking `IS NULL` first, then `< 50000`, then `< 200000`, leaves only budgets of ₹2,00,000 or more for `ELSE`, and each boundary value falls on the right side: 50,000 is not below 50,000, so it is `mid`; 2,00,000 is not below 2,00,000, so it is `large`.",
      "",
      "NULL needs care: every comparison with it is unknown, so with no explicit branch it would reach `ELSE` and be labelled `large`. The second alternative turns that around — testing the large tiers first and letting NULL fall through every comparison to `ELSE 'unset'`. Nested `IF` calls are MySQL's shorter spelling of the same decision. One scan of the table.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "signups-by-utm-source-from-landing-urls",
    title: "Sign-ups by UTM Source Read From Landing URLs",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "The sign-up form stores the full landing URL the visitor arrived on, query string and all, but nobody split out the UTM tags. The acquisition team wants sign-ups per source.",
      "",
      "The source is the value of the `utm_source` parameter: the text after `utm_source=` up to the next `&` (or the end of the URL). A sign-up whose URL has **no `utm_source=`**, or whose URL is NULL, counts under the source `'direct'`. Return `utm_source` and `signups`, ordered by `signups` descending, then `utm_source` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Signup",
        columns: [
          { name: "signup_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "landing_url", type: "varchar" },
          { name: "signed_up_at", type: "datetime" },
        ],
        primaryKey: ["signup_id"],
        note: "One row per new account. `landing_url` is the first page of the visit, or NULL when the browser blocked it. UTM values are lower case.",
      },
    ],
    examples: [
      {
        Signup: [
          [1, "aarav@mail.in", "https://shop.example.in/diwali?utm_source=google&utm_medium=cpc&utm_campaign=diwali", "2024-10-21 10:02:11"],
          [2, "diya@mail.in", "https://shop.example.in/?utm_medium=social&utm_source=instagram", "2024-10-21 11:45:00"],
          [3, "kabir@mail.in", "https://shop.example.in/", "2024-10-21 12:10:40"],
          [4, "meera@mail.in", "https://shop.example.in/sale?utm_source=google&utm_medium=cpc", "2024-10-22 09:30:05"],
          [5, "zara@mail.in", null, "2024-10-22 18:22:19"],
          [6, "rohan@mail.in", "https://shop.example.in/app?utm_source=newsletter", "2024-10-23 07:55:00"],
          [7, "ira@mail.in", "https://shop.example.in/?utm_source=instagram&utm_content=reel", "2024-10-23 20:14:31"],
        ],
      },
    ],
    gen: (rng) => {
      const sources = ["google", "instagram", "facebook", "newsletter", "youtube", "whatsapp"];
      const n = ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const page = pick(rng, ["/", "/sale", "/diwali", "/app", "/new-arrivals"]);
        const r = rng();
        let url: string | null;
        if (r < 0.12) url = null;
        else if (r < 0.25) url = `https://shop.example.in${page}`;
        else if (r < 0.35) url = `https://shop.example.in${page}?utm_medium=email`;
        else {
          const src = pick(rng, sources);
          const shape = ri(rng, 0, 2);
          url = shape === 0 ? `https://shop.example.in${page}?utm_source=${src}`
            : shape === 1 ? `https://shop.example.in${page}?utm_source=${src}&utm_medium=cpc`
            : `https://shop.example.in${page}?utm_medium=paid&utm_source=${src}&utm_campaign=fest`;
        }
        return [id, `user${id}@mail.in`, url, atTime(rng, dateBetween(rng, "2024-10-01", "2024-10-31"))];
      });
      return { Signup: rows };
    },
    solution: [
      "SELECT utm_source, COUNT(*) AS signups",
      "FROM (",
      "  SELECT CASE",
      "           WHEN LOCATE('utm_source=', landing_url) > 0",
      "             THEN SUBSTRING_INDEX(SUBSTRING_INDEX(landing_url, 'utm_source=', -1), '&', 1)",
      "           ELSE 'direct'",
      "         END AS utm_source",
      "  FROM Signup",
      ") s",
      "GROUP BY utm_source",
      "ORDER BY signups DESC, utm_source",
    ].join("\n"),
    alternatives: [
      [
        "SELECT utm_source, COUNT(*) AS signups FROM (",
        "  SELECT IF(IFNULL(INSTR(landing_url, 'utm_source='), 0) = 0, 'direct',",
        "            SUBSTRING_INDEX(SUBSTRING(landing_url, INSTR(landing_url, 'utm_source=') + 11), '&', 1)) AS utm_source",
        "  FROM Signup) s",
        "GROUP BY utm_source ORDER BY signups DESC, utm_source",
      ].join("\n"),
      [
        "SELECT 'direct' AS utm_source, COUNT(*) AS signups FROM Signup WHERE landing_url IS NULL OR landing_url NOT LIKE '%utm_source=%' HAVING COUNT(*) > 0",
        "UNION ALL",
        "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(landing_url, 'utm_source=', -1), '&', 1), COUNT(*) FROM Signup WHERE landing_url LIKE '%utm_source=%'",
        "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(landing_url, 'utm_source=', -1), '&', 1)",
        "ORDER BY signups DESC, utm_source",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First turn each URL into its source, then group — a derived table keeps the expression in one place.",
      "`SUBSTRING_INDEX(s, 'utm_source=', -1)` is everything after the marker; a second `SUBSTRING_INDEX(…, '&', 1)` cuts at the next parameter.",
      "When the marker is missing, `SUBSTRING_INDEX` returns the whole string — test for the marker with `LOCATE` or `LIKE` first.",
      "`utm_source` is not always the first parameter, so don't cut at `?`.",
    ],
    editorial: [
      "Parse first, aggregate second. For a URL containing `utm_source=`, `SUBSTRING_INDEX(url, 'utm_source=', -1)` returns the text after the last occurrence of the marker — `google&utm_medium=cpc` — and `SUBSTRING_INDEX(…, '&', 1)` keeps what precedes the first `&`, which is the value whether the parameter sits first, in the middle or last.",
      "",
      "The guard matters: when the delimiter is absent, `SUBSTRING_INDEX` returns the whole input, so a URL with no UTM tag would become its own \"source\". `LOCATE('utm_source=', url) > 0` routes those to `'direct'`, and since `LOCATE` on a NULL URL is NULL, the comparison is unknown and the NULL URLs fall to `ELSE` too. The first alternative uses `INSTR` and `SUBSTRING` with the marker's length (11); the second counts the direct sign-ups and the tagged ones in two queries joined by `UNION ALL` (the `HAVING` stops an empty direct group from appearing as a 0).",
      "",
      "Grouping by the alias of a derived table is portable. One scan; string work is per row.",
    ].join("\n"),
  },

  {
    slug: "cost-per-acquisition-by-campaign",
    title: "Cost per Acquisition of Every Campaign",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "Spend arrives from the ad platforms per campaign per day; conversions come from the website's order tracking. The performance team wants each campaign's cost per acquisition (CPA).",
      "",
      "Return every campaign with `campaign_id`, `campaign_name`, `total_spend` (0 when it has no spend rows), `conversions` (0 when it has none) and `cpa` = total_spend ÷ conversions **rounded to 2 decimals**, NULL when there are no conversions. Order by `campaign_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day it spent, in rupees.",
      },
      {
        name: "Conversion",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "converted_on", type: "date" },
          { name: "revenue", type: "int" },
        ],
        primaryKey: ["conversion_id"],
        note: "One row per attributed order; `campaign_id` is always in `Campaign`.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Diwali Mega Sale"],
          [2, "Monsoon Footwear"],
          [3, "Back to College"],
          [4, "Wedding Season Gold"],
        ],
        DailySpend: [
          [1, "2024-10-25", 20000],
          [1, "2024-10-26", 25000],
          [2, "2024-07-01", 8000],
          [3, "2024-06-15", 5000],
          [3, "2024-06-16", 5000],
        ],
        Conversion: [
          [1, 1, "2024-10-25", 2999],
          [2, 1, "2024-10-26", 1499],
          [3, 1, "2024-10-26", 899],
          [4, 3, "2024-06-16", 499],
          [5, 4, "2024-11-20", 15999],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 7)).map((n, i) => [i + 1, n]);
      const spend: Cell[][] = [];
      const conv: Cell[][] = [];
      let cid = 1;
      for (const c of camps) {
        const days = chance(rng, 0.2) ? 0 : ri(rng, 1, 4);
        for (let d = 0; d < days; d++) spend.push([c[0]!, addDays("2024-09-01", d), roundTo(rng, 1000, 30000, 100)]);
        const k = chance(rng, 0.25) ? 0 : ri(rng, 1, 7);
        for (let i = 0; i < k; i++) conv.push([cid++, c[0]!, addDays("2024-09-01", ri(rng, 0, 5)), roundTo(rng, 299, 9999, 100)]);
      }
      return { Campaign: camps, DailySpend: spend, Conversion: conv };
    },
    solution: [
      "SELECT c.campaign_id, c.campaign_name,",
      "       COALESCE(s.total_spend, 0) AS total_spend,",
      "       COALESCE(v.conversions, 0) AS conversions,",
      "       ROUND(COALESCE(s.total_spend, 0) / v.conversions, 2) AS cpa",
      "FROM Campaign c",
      "LEFT JOIN (SELECT campaign_id, SUM(spend) AS total_spend FROM DailySpend GROUP BY campaign_id) s",
      "  ON s.campaign_id = c.campaign_id",
      "LEFT JOIN (SELECT campaign_id, COUNT(*) AS conversions FROM Conversion GROUP BY campaign_id) v",
      "  ON v.campaign_id = c.campaign_id",
      "ORDER BY c.campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.campaign_id, c.campaign_name,",
        "       (SELECT COALESCE(SUM(spend), 0) FROM DailySpend d WHERE d.campaign_id = c.campaign_id) AS total_spend,",
        "       (SELECT COUNT(*) FROM Conversion v WHERE v.campaign_id = c.campaign_id) AS conversions,",
        "       ROUND((SELECT COALESCE(SUM(spend), 0) FROM DailySpend d WHERE d.campaign_id = c.campaign_id)",
        "             / NULLIF((SELECT COUNT(*) FROM Conversion v WHERE v.campaign_id = c.campaign_id), 0), 2) AS cpa",
        "FROM Campaign c ORDER BY c.campaign_id",
      ].join("\n"),
      [
        "WITH t AS (",
        "  SELECT campaign_id, spend AS amt, 0 AS conv FROM DailySpend",
        "  UNION ALL SELECT campaign_id, 0, 1 FROM Conversion",
        ")",
        "SELECT c.campaign_id, c.campaign_name, COALESCE(SUM(t.amt), 0) AS total_spend, COALESCE(SUM(t.conv), 0) AS conversions,",
        "       ROUND(COALESCE(SUM(t.amt), 0) / NULLIF(SUM(t.conv), 0), 2) AS cpa",
        "FROM Campaign c LEFT JOIN t ON t.campaign_id = c.campaign_id",
        "GROUP BY c.campaign_id, c.campaign_name ORDER BY c.campaign_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Joining both detail tables to the campaign at once multiplies the rows: three spend days × two conversions is six rows.",
      "Aggregate each table to one row per campaign first, then join the totals.",
      "A campaign missing from a total gets NULL from the LEFT JOIN — turn it into 0 for the counts, but let the CPA stay NULL when nothing converted.",
    ],
    editorial: [
      "The trap is the **fan-out**. Joining `Campaign` to `DailySpend` and `Conversion` together pairs every spend day with every conversion, so a campaign with three spend rows and two conversions shows six rows: `SUM(spend)` doubles and `COUNT(*)` triples. Aggregate each detail table to one row per campaign in its own derived table, and only then LEFT JOIN those totals to `Campaign` — a one-to-one join cannot multiply anything.",
      "",
      "LEFT JOINs keep campaigns with no spend or no conversions; `COALESCE(…, 0)` reports those as 0. The CPA divides by the raw `v.conversions`, which is NULL when there are none, so the ratio is NULL with no division by zero.",
      "",
      "The correlated-subquery alternative computes each total per campaign directly; the `UNION ALL` alternative stacks spend and conversions as one stream of (amount, count) rows so a single `GROUP BY` sums both safely. All three read each table once.",
    ].join("\n"),
  },

  {
    slug: "top-two-ads-by-conversions-in-each-campaign",
    title: "Top Two Ads by Conversions in Each Campaign",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "Each campaign rotates several ad creatives. Before the next refresh, the creative team keeps the best performers of every campaign and retires the rest.",
      "",
      "Rank the ads of each campaign by `conversions`, highest first, with **standard competition ranking** — tied ads share a place and the next place is skipped (two ads tied for first leave no second place). Return `campaign_id`, `ad_id`, `headline` and `conversions` for the ads ranked **1 or 2**. An ad with 0 conversions is never kept. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Ad",
        columns: [
          { name: "ad_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "headline", type: "varchar" },
          { name: "conversions", type: "int" },
        ],
        primaryKey: ["ad_id"],
        note: "One row per ad creative with its conversions to date.",
      },
    ],
    examples: [
      {
        Ad: [
          [1, 10, "Lights, Deals, Diwali", 42],
          [2, 10, "Up to 60% Off Today", 42],
          [3, 10, "Gift Hampers from Rs 499", 30],
          [4, 20, "Rain-Ready Sandals", 18],
          [5, 20, "Monsoon Sale Is Live", 25],
          [6, 20, "Free Delivery on Shoes", 11],
          [7, 30, "Back to College Kits", 0],
          [8, 30, "Laptop Bags Under Rs 999", 7],
        ],
      },
    ],
    gen: (rng) => {
      const heads = ["Shop the Sale", "Free Delivery Today", "New Arrivals", "Flat 40% Off", "Limited Stock", "Festive Picks", "Under Rs 999", "Buy 1 Get 1"];
      const rows: Cell[][] = [];
      let id = 1;
      for (const camp of sample(rng, [10, 20, 30, 40, 50], ri(rng, 1, 4))) {
        const pool = Array.from({ length: ri(rng, 1, 4) }, () => (chance(rng, 0.15) ? 0 : ri(rng, 1, 60)));
        for (let k = ri(rng, 1, 6); k > 0; k--) rows.push([id++, camp, pick(rng, heads), pick(rng, pool)]);
      }
      return { Ad: rows };
    },
    solution: [
      "SELECT campaign_id, ad_id, headline, conversions",
      "FROM (",
      "  SELECT campaign_id, ad_id, headline, conversions,",
      "         RANK() OVER (PARTITION BY campaign_id ORDER BY conversions DESC) AS rnk",
      "  FROM Ad",
      "  WHERE conversions > 0",
      ") r",
      "WHERE rnk <= 2",
    ].join("\n"),
    alternatives: [
      "SELECT campaign_id, ad_id, headline, conversions FROM Ad a WHERE conversions > 0 AND (SELECT COUNT(*) FROM Ad b WHERE b.campaign_id = a.campaign_id AND b.conversions > a.conversions) < 2",
      [
        "SELECT a.campaign_id, a.ad_id, a.headline, a.conversions",
        "FROM Ad a LEFT JOIN Ad b ON b.campaign_id = a.campaign_id AND b.conversions > a.conversions",
        "WHERE a.conversions > 0",
        "GROUP BY a.ad_id, a.campaign_id, a.headline, a.conversions",
        "HAVING COUNT(b.ad_id) < 2",
      ].join("\n"),
    ],
    hints: [
      "The ranking restarts in each campaign — `PARTITION BY campaign_id`.",
      "Which of ROW_NUMBER, RANK and DENSE_RANK gives 1, 1, 3 for a tie at the top?",
      "An ad's rank is 1 + the number of ads in its campaign with strictly more conversions.",
      "Drop the zero-conversion ads before ranking, or a weak campaign keeps an ad that never converted.",
    ],
    editorial: [
      "Standard competition ranking is `RANK()`: ties share a place and the places after a tie are skipped, so 42, 42, 30 rank 1, 1, 3 and only the two tied ads survive. `DENSE_RANK()` would give 1, 1, 2 and keep the third ad, `ROW_NUMBER()` would keep exactly two and pick between ties arbitrarily — both answer a different question.",
      "",
      "Rank inside a derived table, since a window result cannot be filtered in the `WHERE` of the same query, and filter `conversions > 0` before ranking so an ad that never converted cannot take a place in a campaign with a single good ad.",
      "",
      "The rank also has a definition without windows: 1 + the number of ads in the same campaign with strictly more conversions. \"Rank ≤ 2\" is then \"fewer than two better ads\", which the correlated `COUNT` and the self-join `HAVING COUNT(b.ad_id) < 2` express. Those are quadratic within a campaign; the window is one sort.",
    ].join("\n"),
  },

  {
    slug: "campaign-months-that-overspent-the-budget",
    title: "Campaign Months That Overspent the Budget",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "Each campaign has a fixed monthly budget, and the agency must explain to the client every calendar month in which a campaign spent more than it.",
      "",
      "For each campaign and calendar month with spend, add up the daily spend. Return `campaign_id`, `month` (as `'YYYY-MM'`), `month_spend` and `overspend` (month_spend − monthly_budget) for the months where month_spend is **strictly greater** than the budget. A campaign with a NULL budget is never reported. Order by `campaign_id`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "monthly_budget", type: "int" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign; `monthly_budget` in rupees, NULL when not yet approved.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day it spent, in rupees.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Navratri Ethnic Wear", 50000],
          [2, "Winter Skincare", 30000],
          [3, "Pongal Kitchen Week", null],
        ],
        DailySpend: [
          [1, "2024-09-29", 30000],
          [1, "2024-09-30", 22000],
          [1, "2024-10-01", 40000],
          [1, "2024-10-02", 10000],
          [2, "2024-11-10", 18000],
          [2, "2024-11-11", 12000],
          [2, "2024-12-01", 31000],
          [3, "2024-12-28", 90000],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 5)).map((n, i) => [i + 1, n, maybeNull(rng, 0.12, roundTo(rng, 20000, 50000, 10000))]);
      const rows: Cell[][] = [];
      for (const c of camps) {
        const dates = new Set<string>();
        for (let k = ri(rng, 0, 9); k > 0; k--) dates.add(dateBetween(rng, "2024-09-25", "2024-11-05"));
        for (const d of dates) rows.push([c[0]!, d, roundTo(rng, 5000, 30000, 5000)]);
      }
      return { Campaign: camps, DailySpend: rows };
    },
    solution: [
      "SELECT c.campaign_id, m.month, m.month_spend, m.month_spend - c.monthly_budget AS overspend",
      "FROM (",
      "  SELECT campaign_id, DATE_FORMAT(spend_date, '%Y-%m') AS month, SUM(spend) AS month_spend",
      "  FROM DailySpend",
      "  GROUP BY campaign_id, DATE_FORMAT(spend_date, '%Y-%m')",
      ") m",
      "JOIN Campaign c ON c.campaign_id = m.campaign_id",
      "WHERE m.month_spend > c.monthly_budget",
      "ORDER BY c.campaign_id, m.month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.campaign_id, LEFT(s.spend_date, 7) AS month, SUM(s.spend) AS month_spend, SUM(s.spend) - c.monthly_budget AS overspend",
        "FROM DailySpend s JOIN Campaign c ON c.campaign_id = s.campaign_id",
        "WHERE c.monthly_budget IS NOT NULL",
        "GROUP BY s.campaign_id, LEFT(s.spend_date, 7), c.monthly_budget",
        "HAVING SUM(s.spend) > c.monthly_budget",
        "ORDER BY s.campaign_id, month",
      ].join("\n"),
      [
        "SELECT s.campaign_id, CONCAT(YEAR(s.spend_date), '-', LPAD(MONTH(s.spend_date), 2, '0')) AS month, SUM(s.spend) AS month_spend,",
        "       SUM(s.spend) - MAX(c.monthly_budget) AS overspend",
        "FROM DailySpend s JOIN Campaign c ON c.campaign_id = s.campaign_id",
        "GROUP BY s.campaign_id, CONCAT(YEAR(s.spend_date), '-', LPAD(MONTH(s.spend_date), 2, '0'))",
        "HAVING SUM(s.spend) > MAX(c.monthly_budget)",
        "ORDER BY s.campaign_id, month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket the days into months with `DATE_FORMAT(spend_date, '%Y-%m')`, and group by campaign and month.",
      "The budget is per campaign, so compare it with the monthly total, not with a day's spend.",
      "A month where spend exactly equals the budget is on plan, not over it.",
    ],
    editorial: [
      "The comparison is between a **monthly total** and the budget, so first collapse the daily rows into (campaign, month) buckets. `DATE_FORMAT(spend_date, '%Y-%m')` is the bucket and also the output format; `LEFT(spend_date, 7)` gives the same text because the dates are stored as 'YYYY-MM-DD'. A campaign running across 30 September and 1 October lands in two buckets, each judged on its own.",
      "",
      "Then join the budget and keep the buckets strictly above it. A NULL budget makes `month_spend > NULL` unknown, so those campaigns drop out without a special case. The alternatives group and compare in one query with `HAVING` — the budget must then be grouped on or wrapped in `MAX` so no bare column sits under `GROUP BY`.",
      "",
      "Cost: one aggregate over the spend rows and one key lookup per bucket.",
    ].join("\n"),
  },

  {
    slug: "last-touch-channel-for-each-conversion",
    title: "Last-Touch Channel for Each Conversion",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins"],
    description: [
      "Under last-touch attribution, a conversion is credited to the **most recent marketing touchpoint of the same user at or before the moment of conversion**. Touches after the conversion don't count.",
      "",
      "Return `conversion_id` and `last_touch_channel` for every conversion. When two qualifying touches share the latest timestamp, the one with the higher `touch_id` wins. A conversion with no qualifying touch is credited to `'direct'`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Touchpoint",
        columns: [
          { name: "touch_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "channel", type: "enum", values: ["paid_search", "paid_social", "email", "affiliate", "organic"] },
          { name: "touched_at", type: "datetime" },
        ],
        primaryKey: ["touch_id"],
        note: "One row per tracked visit from a marketing channel.",
      },
      {
        name: "Conversion",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "converted_at", type: "datetime" },
          { name: "revenue", type: "int" },
        ],
        primaryKey: ["conversion_id"],
        note: "One row per order, in rupees.",
      },
    ],
    examples: [
      {
        Touchpoint: [
          [1, 7, "paid_social", "2024-11-01 09:00:00"],
          [2, 7, "email", "2024-11-02 18:30:00"],
          [3, 7, "paid_search", "2024-11-04 10:00:00"],
          [4, 8, "affiliate", "2024-11-03 12:00:00"],
          [5, 8, "email", "2024-11-03 12:00:00"],
          [6, 9, "organic", "2024-11-05 08:15:00"],
        ],
        Conversion: [
          [101, 7, "2024-11-03 20:00:00", 1499],
          [102, 8, "2024-11-03 12:00:00", 2599],
          [103, 9, "2024-11-04 22:00:00", 799],
          [104, 10, "2024-11-05 11:00:00", 349],
        ],
      },
    ],
    gen: (rng) => {
      const ch = ["paid_search", "paid_social", "email", "affiliate", "organic"];
      const days = ["2024-11-01", "2024-11-02", "2024-11-03"];
      const slot = () => `${pick(rng, days)} ${pick(rng, ["09:00:00", "12:00:00", "18:30:00", "21:45:00"])}`;
      const touches: Cell[][] = seq(1, ri(rng, 0, 16)).map((id) => [id, ri(rng, 1, 6), pick(rng, ch), slot()]);
      const conv: Cell[][] = seq(101, ri(rng, 1, 8)).map((id) => [id, ri(rng, 1, 7), slot(), roundTo(rng, 199, 4999, 100)]);
      return { Touchpoint: touches, Conversion: conv };
    },
    solution: [
      "SELECT v.conversion_id,",
      "       COALESCE((",
      "         SELECT t.channel FROM Touchpoint t",
      "         WHERE t.user_id = v.user_id AND t.touched_at <= v.converted_at",
      "         ORDER BY t.touched_at DESC, t.touch_id DESC",
      "         LIMIT 1",
      "       ), 'direct') AS last_touch_channel",
      "FROM Conversion v",
    ].join("\n"),
    alternatives: [
      [
        "SELECT conversion_id, COALESCE(channel, 'direct') AS last_touch_channel FROM (",
        "  SELECT v.conversion_id, t.channel,",
        "         ROW_NUMBER() OVER (PARTITION BY v.conversion_id ORDER BY t.touched_at DESC, t.touch_id DESC) AS rn",
        "  FROM Conversion v",
        "  LEFT JOIN Touchpoint t ON t.user_id = v.user_id AND t.touched_at <= v.converted_at",
        ") x WHERE rn = 1",
      ].join("\n"),
      [
        "SELECT v.conversion_id, COALESCE(t.channel, 'direct') AS last_touch_channel",
        "FROM Conversion v",
        "LEFT JOIN Touchpoint t ON t.user_id = v.user_id AND t.touched_at <= v.converted_at",
        "  AND NOT EXISTS (SELECT 1 FROM Touchpoint u WHERE u.user_id = v.user_id AND u.touched_at <= v.converted_at",
        "                  AND (u.touched_at > t.touched_at OR (u.touched_at = t.touched_at AND u.touch_id > t.touch_id)))",
      ].join("\n"),
    ],
    hints: [
      "For one conversion, the candidates are that user's touches with `touched_at <= converted_at`.",
      "The winner is the first candidate when sorted by time descending, then `touch_id` descending.",
      "A scalar subquery with `ORDER BY … LIMIT 1` returns NULL when there is no candidate — `COALESCE` turns that into `'direct'`.",
    ],
    editorial: [
      "Each conversion needs one value from a set of rows: among the user's touches at or before the conversion, the latest. A **correlated scalar subquery** expresses that directly — filter by user and time, sort by `touched_at DESC, touch_id DESC` so equal timestamps are decided by the higher id, and take one row. With no qualifying touch the subquery returns NULL, which `COALESCE` reports as `'direct'`. A touch at exactly the conversion time qualifies, because the window is \"at or before\".",
      "",
      "The window alternative LEFT JOINs every qualifying touch to the conversion and keeps row number 1 per conversion; a conversion without touches survives the LEFT JOIN as one row with a NULL channel. The third form keeps only the touch that no other qualifying touch beats (later, or same time and higher id) — a classic greatest-per-group anti join.",
      "",
      "With an index on `(user_id, touched_at)` each subquery is one short index range scan.",
    ].join("\n"),
  },

  {
    slug: "email-open-rate-by-send-hour",
    title: "Email Open Rate by Hour of Send",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "The CRM team is testing what time of day to send. An email only counts as opened for this test when it was opened **within 24 hours of being sent** (at most 86,400 seconds after `sent_at`); later opens and unopened emails count as not opened.",
      "",
      "Group the deliveries by the hour of `sent_at` (0–23). Return `send_hour`, `sends`, `opens` and `open_rate_pct` = 100 × opens ÷ sends **rounded to 2 decimals**, for every hour that has at least one send, ordered by `send_hour`.",
    ].join("\n"),
    tables: [
      {
        name: "EmailDelivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "sent_at", type: "datetime" },
          { name: "opened_at", type: "datetime" },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per email delivered; `opened_at` is the first open, or NULL if it was never opened.",
      },
    ],
    examples: [
      {
        EmailDelivery: [
          [1, 501, "2024-12-02 09:00:00", "2024-12-02 09:41:12"],
          [2, 502, "2024-12-02 09:00:00", null],
          [3, 503, "2024-12-02 09:30:00", "2024-12-03 09:30:00"],
          [4, 504, "2024-12-02 19:00:00", "2024-12-04 08:00:00"],
          [5, 505, "2024-12-02 19:15:00", "2024-12-02 22:02:45"],
          [6, 506, "2024-12-03 19:00:00", "2024-12-03 19:05:00"],
          [7, 507, "2024-12-03 07:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const hours = sample(rng, [7, 9, 12, 13, 18, 19, 21], ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, ri(rng, 1, 20)).map((id) => {
        const day = dateBetween(rng, "2024-12-01", "2024-12-10");
        const h = pick(rng, hours);
        const sent = `${day} ${String(h).padStart(2, "0")}:${pick(rng, ["00", "15", "30", "45"])}:00`;
        const r = rng();
        const opened = r < 0.3 ? null
          : r < 0.4 ? addSeconds(sent, 86400)
          : r < 0.47 ? addSeconds(sent, 86401)
          : r < 0.55 ? addSeconds(sent, ri(rng, 90000, 300000))
          : addSeconds(sent, ri(rng, 30, 80000));
        return [id, 500 + ri(rng, 1, 40), sent, opened];
      });
      return { EmailDelivery: rows };
    },
    solution: [
      "SELECT HOUR(sent_at) AS send_hour,",
      "       COUNT(*) AS sends,",
      "       SUM(CASE WHEN opened_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, sent_at, opened_at) <= 86400 THEN 1 ELSE 0 END) AS opens,",
      "       ROUND(100 * SUM(CASE WHEN opened_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, sent_at, opened_at) <= 86400 THEN 1 ELSE 0 END) / COUNT(*), 2) AS open_rate_pct",
      "FROM EmailDelivery",
      "GROUP BY HOUR(sent_at)",
      "ORDER BY send_hour",
    ].join("\n"),
    alternatives: [
      [
        "SELECT send_hour, COUNT(*) AS sends, SUM(o) AS opens, ROUND(SUM(o) * 100 / COUNT(*), 2) AS open_rate_pct FROM (",
        "  SELECT HOUR(sent_at) AS send_hour, IF(opened_at <= DATE_ADD(sent_at, INTERVAL 1 DAY), 1, 0) AS o FROM EmailDelivery",
        ") d GROUP BY send_hour ORDER BY send_hour",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`HOUR(sent_at)` is the bucket.",
      "An open counts only when `opened_at` is not NULL and no more than 86,400 seconds after the send — measure it with `TIMESTAMPDIFF(SECOND, …)`.",
      "Turn each row into 1 (counted open) or 0 and sum; the rate is that sum over the row count.",
    ],
    editorial: [
      "Bucket by `HOUR(sent_at)` and count two things per bucket: all deliveries, and the deliveries that count as opened. The second is a conditional sum — 1 when `opened_at` exists and `TIMESTAMPDIFF(SECOND, sent_at, opened_at) <= 86400`, else 0. An email opened exactly 24 hours later still counts; one second later does not.",
      "",
      "NULL needs no special case in the alternative: `opened_at <= DATE_ADD(sent_at, INTERVAL 1 DAY)` is unknown for a NULL `opened_at`, and `IF` treats unknown as false, giving 0. Comparing to the send time plus one day is the same window as the seconds difference.",
      "",
      "The rate is computed from the two exact counts and rounded last. Every hour in the output has at least one send, so the division is always defined. One scan with a 24-bucket aggregate.",
    ].join("\n"),
  },

  {
    slug: "campaigns-outspending-their-channel-average",
    title: "Campaigns Outspending Their Channel's Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "The media director wants to know which campaigns are taking more than their fair share of a channel's money. A campaign's spend is the sum of its daily spend rows; campaigns with no spend rows have not launched and take no part in the comparison.",
      "",
      "Return `campaign_id`, `campaign_name`, `channel` and `total_spend` for every launched campaign whose total spend is **strictly greater** than the average total spend of the launched campaigns in **its own channel**. Order by `channel`, then `total_spend` descending, then `campaign_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "channel", type: "enum", values: [...CHANNELS] },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day it spent, in rupees.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Diwali Mega Sale", "search"],
          [2, "Exam Season Notes", "search"],
          [3, "Back to College", "search"],
          [4, "Holi Colours Kit", "social"],
          [5, "Eid Festive Edit", "social"],
          [6, "Winter Skincare", "social"],
          [7, "Onam Festive Deals", "video"],
        ],
        DailySpend: [
          [1, "2024-10-25", 60000],
          [1, "2024-10-26", 40000],
          [2, "2024-10-25", 30000],
          [3, "2024-10-25", 20000],
          [4, "2024-03-20", 25000],
          [5, "2024-04-10", 25000],
          [7, "2024-09-01", 15000],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = sample(rng, CAMPAIGN_NAMES, ri(rng, 1, 10)).map((n, i) => [i + 1, n, pick(rng, CHANNELS.slice(0, 3))]);
      const rows: Cell[][] = [];
      for (const c of camps) {
        if (chance(rng, 0.15)) continue;
        for (let d = ri(rng, 1, 3); d > 0; d--) rows.push([c[0]!, addDays("2024-10-01", d), roundTo(rng, 5000, 40000, 5000)]);
      }
      return { Campaign: camps, DailySpend: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT c.campaign_id, c.campaign_name, c.channel, SUM(s.spend) AS total_spend",
      "  FROM Campaign c",
      "  JOIN DailySpend s ON s.campaign_id = c.campaign_id",
      "  GROUP BY c.campaign_id, c.campaign_name, c.channel",
      ")",
      "SELECT campaign_id, campaign_name, channel, total_spend",
      "FROM totals t",
      "WHERE total_spend > (SELECT AVG(u.total_spend) FROM totals u WHERE u.channel = t.channel)",
      "ORDER BY channel, total_spend DESC, campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT campaign_id, campaign_name, channel, total_spend FROM (",
        "  SELECT c.campaign_id, c.campaign_name, c.channel, SUM(s.spend) AS total_spend,",
        "         AVG(SUM(s.spend)) OVER (PARTITION BY c.channel) AS channel_avg",
        "  FROM Campaign c JOIN DailySpend s ON s.campaign_id = c.campaign_id",
        "  GROUP BY c.campaign_id, c.campaign_name, c.channel",
        ") x WHERE total_spend > channel_avg",
        "ORDER BY channel, total_spend DESC, campaign_id",
      ].join("\n"),
      [
        "WITH totals AS (SELECT campaign_id, SUM(spend) AS total_spend FROM DailySpend GROUP BY campaign_id),",
        "     avgs AS (SELECT c.channel, AVG(t.total_spend) AS a FROM totals t JOIN Campaign c ON c.campaign_id = t.campaign_id GROUP BY c.channel)",
        "SELECT c.campaign_id, c.campaign_name, c.channel, t.total_spend",
        "FROM totals t JOIN Campaign c ON c.campaign_id = t.campaign_id JOIN avgs g ON g.channel = c.channel",
        "WHERE t.total_spend > g.a",
        "ORDER BY c.channel, t.total_spend DESC, c.campaign_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build each launched campaign's total spend — an inner join to the spend rows drops the unlaunched ones.",
      "The average is over campaign totals, not over daily rows: a campaign with ten small days must not drag the average down ten times.",
      "Compare each total with the average of its own channel — a correlated subquery or `AVG(...) OVER (PARTITION BY channel)`.",
    ],
    editorial: [
      "Two levels of aggregation are involved. First, each campaign's **total** spend: join `Campaign` to `DailySpend` and sum per campaign; the inner join leaves out campaigns that never spent, as the statement asks. Second, the **average of those totals per channel**. Averaging the daily rows directly would be a different number — it weights a campaign by how many days it ran.",
      "",
      "With the totals in a CTE, a correlated subquery computes the channel's average for each row and the outer filter keeps totals strictly above it; a channel with one launched campaign never qualifies, because a total is never above itself. A window function can sit on top of the aggregate (`AVG(SUM(spend)) OVER (PARTITION BY channel)`), which avoids reading the totals twice, and the third form joins a per-channel averages table.",
      "",
      "Equal totals are ordered by id, so the order is complete. Cost: one aggregate pass plus one per-channel average.",
    ].join("\n"),
  },

  {
    slug: "weekly-leads-by-utm-medium",
    title: "Weekly Leads by UTM Medium",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation"],
    description: [
      "The demand-generation team reports leads every Monday. A week runs **Monday to Sunday** and is named by its Monday. A lead with a NULL `utm_medium` arrived untagged and is reported under the medium `'untagged'`.",
      "",
      "Return `week_start` (the Monday of the lead's week, as a date), `utm_medium` and `leads` (the number of leads), for every week and medium that has leads. Order by `week_start`, then `utm_medium`.",
    ].join("\n"),
    tables: [
      {
        name: "MarketingLead",
        columns: [
          { name: "lead_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "utm_medium", type: "varchar" },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["lead_id"],
        note: "One row per form fill. `utm_medium` is lower case (`cpc`, `social`, `email`, `referral`) or NULL when the link carried no tag.",
      },
    ],
    examples: [
      {
        MarketingLead: [
          [1, "neha@corp.in", "cpc", "2024-04-01 09:12:00"],
          [2, "rahul@corp.in", "cpc", "2024-04-07 23:59:59"],
          [3, "sara@corp.in", "social", "2024-04-03 14:00:00"],
          [4, "dev@corp.in", "cpc", "2024-04-08 00:00:01"],
          [5, "pooja@corp.in", null, "2024-04-09 11:30:00"],
          [6, "liam@corp.in", "email", "2024-03-31 18:45:00"],
          [7, "ira@corp.in", null, "2024-04-10 10:10:10"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = seq(1, ri(rng, 1, 20)).map((id) => {
        const d = dateBetween(rng, "2024-03-25", "2024-04-21");
        const t = chance(rng, 0.2) ? `${d} ${pick(rng, ["00:00:00", "23:59:59"])}` : atTime(rng, d);
        return [id, `lead${id}@corp.in`, maybeNull(rng, 0.15, pick(rng, ["cpc", "social", "email", "referral"])), t];
      });
      return { MarketingLead: rows };
    },
    solution: [
      "SELECT week_start, utm_medium, COUNT(*) AS leads",
      "FROM (",
      "  SELECT DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY) AS week_start,",
      "         COALESCE(utm_medium, 'untagged') AS utm_medium",
      "  FROM MarketingLead",
      ") l",
      "GROUP BY week_start, utm_medium",
      "ORDER BY week_start, utm_medium",
    ].join("\n"),
    alternatives: [
      [
        "SELECT SUBDATE(CAST(created_at AS DATE), (DAYOFWEEK(created_at) + 5) % 7) AS week_start, IFNULL(utm_medium, 'untagged') AS utm_medium, COUNT(*) AS leads",
        "FROM MarketingLead",
        "GROUP BY SUBDATE(CAST(created_at AS DATE), (DAYOFWEEK(created_at) + 5) % 7), IFNULL(utm_medium, 'untagged')",
        "ORDER BY week_start, utm_medium",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Map every timestamp to the Monday of its week, then group by that date.",
      "`WEEKDAY(d)` is 0 on Monday and 6 on Sunday — how many days back is that week's Monday?",
      "Take the date part of the timestamp first so the result is a date, not a time.",
      "Replace the NULL medium before grouping, so all untagged leads of a week land in one group.",
    ],
    editorial: [
      "Bucketing by week is bucketing by a computed date. `WEEKDAY(created_at)` counts days since Monday (Monday 0 … Sunday 6), so `DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY)` is the Monday of the week: a lead at 23:59:59 on Sunday 7 April belongs to the week of 1 April, and one second past midnight on Monday 8 April starts the next week. `WEEK()`/`YEARWEEK()` are tempting but depend on a mode argument and number weeks rather than dating them.",
      "",
      "`DAYOFWEEK` counts from Sunday = 1, so `(DAYOFWEEK(d) + 5) % 7` gives the same days-since-Monday, as the alternative uses with `SUBDATE`. `COALESCE` renames the NULL medium before grouping — `GROUP BY` would put NULLs in one group anyway, but the output must say `'untagged'`.",
      "",
      "One scan, one aggregate over a handful of (week, medium) buckets.",
    ].join("\n"),
  },

  {
    slug: "month-over-month-ad-spend-change-by-channel",
    title: "Month-over-Month Ad Spend Change by Channel",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Finance receives several media invoices per channel each month. For the monthly review, each channel's spend is compared with the **immediately preceding calendar month**.",
      "",
      "For every channel and month with invoices, return `channel`, `month` (`'YYYY-MM'` of `invoice_date`), `spend` (the month's total), `prev_month_spend` (the channel's total for the calendar month just before, or NULL if that month had no invoices for the channel) and `change` (spend − prev_month_spend, NULL when prev_month_spend is NULL). Order by `channel`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "MediaInvoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "channel", type: "enum", values: [...CHANNELS] },
          { name: "invoice_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["invoice_id"],
        note: "One row per invoice from a media vendor, amount in rupees (before GST).",
      },
    ],
    examples: [
      {
        MediaInvoice: [
          [1, "search", "2024-01-10", 80000],
          [2, "search", "2024-01-25", 20000],
          [3, "search", "2024-02-15", 130000],
          [4, "search", "2024-04-05", 90000],
          [5, "social", "2024-02-01", 50000],
          [6, "social", "2024-03-31", 45000],
          [7, "social", "2024-03-02", 15000],
        ],
      },
    ],
    gen: (rng) => {
      const months = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-12", "2025-01"];
      const rows: Cell[][] = seq(1, ri(rng, 1, 18)).map((id) => [
        id,
        pick(rng, CHANNELS.slice(0, 3)),
        `${pick(rng, months)}-${String(ri(rng, 1, 28)).padStart(2, "0")}`,
        roundTo(rng, 10000, 150000, 5000),
      ]);
      return { MediaInvoice: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT channel, DATE_FORMAT(invoice_date, '%Y-%m') AS month, SUM(amount) AS spend",
      "  FROM MediaInvoice",
      "  GROUP BY channel, DATE_FORMAT(invoice_date, '%Y-%m')",
      "), lagged AS (",
      "  SELECT channel, month, spend,",
      "         LAG(month) OVER (PARTITION BY channel ORDER BY month) AS prev_month,",
      "         LAG(spend) OVER (PARTITION BY channel ORDER BY month) AS prev_spend",
      "  FROM monthly",
      ")",
      "SELECT channel, month, spend,",
      "       CASE WHEN prev_month = DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m') THEN prev_spend END AS prev_month_spend,",
      "       CASE WHEN prev_month = DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m') THEN spend - prev_spend END AS `change`",
      "FROM lagged",
      "ORDER BY channel, month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT channel, DATE_FORMAT(invoice_date, '%Y-%m') AS month, SUM(amount) AS spend",
        "  FROM MediaInvoice GROUP BY channel, DATE_FORMAT(invoice_date, '%Y-%m')",
        ")",
        "SELECT m.channel, m.month, m.spend, p.spend AS prev_month_spend, m.spend - p.spend AS `change`",
        "FROM monthly m",
        "LEFT JOIN monthly p ON p.channel = m.channel",
        "  AND p.month = DATE_FORMAT(DATE_SUB(CONCAT(m.month, '-01'), INTERVAL 1 MONTH), '%Y-%m')",
        "ORDER BY m.channel, m.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the invoices to one row per channel and month first.",
      "`LAG` gives the previous row in the channel — but the previous row is not always the previous calendar month.",
      "Compute the calendar month before each month (`DATE_SUB(first_of_month, INTERVAL 1 MONTH)`) and only trust the lagged value when it is that month.",
      "January's previous month is December of the year before.",
    ],
    editorial: [
      "Start with one row per (channel, month): `DATE_FORMAT(invoice_date, '%Y-%m')` buckets the invoices and doubles as the output label, and since the label sorts like the date it can order a window.",
      "",
      "`LAG(spend) OVER (PARTITION BY channel ORDER BY month)` fetches the previous **row's** total. That is right only when the previous row is the previous **calendar** month; when a channel skipped a month (search in March above) the lagged row is two months back, and the statement wants NULL. So lag the month label too, compute the true previous month with `DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH)` — which also rolls January back to December of the year before — and keep the lagged values only when they match.",
      "",
      "The self-join alternative avoids the check entirely: LEFT JOIN each month to the row whose month is exactly the previous one; a missing month gives NULLs. `change` is a reserved word in MySQL, hence the backticks. Both plans aggregate once; the join adds a lookup per month.",
    ].join("\n"),
  },

  {
    slug: "email-subscribers-who-open-but-never-click",
    title: "Email Subscribers Who Open but Never Click",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "The lifecycle team wants a re-engagement list: subscribers who keep opening the newsletters but never click through. An **open** or a **click** is an event of that type; delivery and unsubscribe events don't matter here.",
      "",
      "Return `subscriber_id`, `email` and `campaigns_opened` (the number of **distinct** email campaigns the subscriber opened) for subscribers who opened **at least 3 distinct campaigns** and have **no click event at all**. Order by `campaigns_opened` descending, then `subscriber_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Subscriber",
        columns: [
          { name: "subscriber_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["subscriber_id"],
        note: "One row per newsletter subscriber.",
      },
      {
        name: "EmailEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "email_campaign_id", type: "int" },
          { name: "event_type", type: "enum", values: ["delivered", "open", "click", "unsubscribe"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked event; opening the same email twice gives two `open` rows.",
      },
    ],
    examples: [
      {
        Subscriber: [
          [501, "aditi@mail.in", "Pune"],
          [502, "farhan@mail.in", "Mumbai"],
          [503, "tanvi@mail.in", "Kochi"],
          [504, "noah@mail.in", "Delhi"],
        ],
        EmailEvent: [
          [1, 501, 1, "open", "2024-05-01 08:00:00"],
          [2, 501, 2, "open", "2024-05-08 08:10:00"],
          [3, 501, 3, "open", "2024-05-15 07:55:00"],
          [4, 502, 1, "open", "2024-05-01 09:00:00"],
          [5, 502, 1, "open", "2024-05-02 09:00:00"],
          [6, 502, 2, "open", "2024-05-08 09:00:00"],
          [7, 502, 2, "delivered", "2024-05-08 06:00:00"],
          [8, 503, 1, "open", "2024-05-01 10:00:00"],
          [9, 503, 2, "open", "2024-05-08 10:00:00"],
          [10, 503, 3, "open", "2024-05-15 10:00:00"],
          [11, 503, 3, "click", "2024-05-15 10:01:00"],
        ],
      },
    ],
    gen: (rng) => {
      const subs: Cell[][] = seq(501, ri(rng, 1, 7)).map((id) => [id, `sub${id}@mail.in`, pick(rng, ["Pune", "Mumbai", "Delhi", "Kochi", "Jaipur"])]);
      const ev: Cell[][] = [];
      let id = 1;
      for (const s of subs) {
        const opener = chance(rng, 0.6);
        for (let k = ri(rng, 0, opener ? 6 : 3); k > 0; k--) {
          const camp = ri(rng, 1, 5);
          const day = addDays("2024-05-01", (camp - 1) * 7);
          ev.push([id++, s[0]!, camp, opener ? "open" : pick(rng, ["delivered", "open", "unsubscribe"]), atTime(rng, day)]);
        }
        if (chance(rng, 0.25)) ev.push([id++, s[0]!, ri(rng, 1, 5), "click", atTime(rng, "2024-05-20")]);
      }
      return { Subscriber: subs, EmailEvent: ev };
    },
    solution: [
      "SELECT s.subscriber_id, s.email,",
      "       COUNT(DISTINCT CASE WHEN e.event_type = 'open' THEN e.email_campaign_id END) AS campaigns_opened",
      "FROM Subscriber s",
      "JOIN EmailEvent e ON e.subscriber_id = s.subscriber_id",
      "GROUP BY s.subscriber_id, s.email",
      "HAVING COUNT(DISTINCT CASE WHEN e.event_type = 'open' THEN e.email_campaign_id END) >= 3",
      "   AND SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) = 0",
      "ORDER BY campaigns_opened DESC, s.subscriber_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.subscriber_id, s.email, COUNT(DISTINCT e.email_campaign_id) AS campaigns_opened",
        "FROM Subscriber s JOIN EmailEvent e ON e.subscriber_id = s.subscriber_id AND e.event_type = 'open'",
        "WHERE NOT EXISTS (SELECT 1 FROM EmailEvent c WHERE c.subscriber_id = s.subscriber_id AND c.event_type = 'click')",
        "GROUP BY s.subscriber_id, s.email",
        "HAVING COUNT(DISTINCT e.email_campaign_id) >= 3",
        "ORDER BY campaigns_opened DESC, s.subscriber_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Opening one email twice is still one campaign — count distinct campaign ids among the opens.",
      "`COUNT(DISTINCT CASE WHEN … THEN email_campaign_id END)` counts only the rows the CASE keeps, because the others are NULL.",
      "\"No click at all\" is a second condition on the same group: a conditional sum equal to 0, or a NOT EXISTS.",
    ],
    editorial: [
      "Group each subscriber's events and compute two numbers from the same group with **conditional aggregation**. The opened campaigns are `COUNT(DISTINCT CASE WHEN event_type = 'open' THEN email_campaign_id END)`: for any other event type the CASE yields NULL, which `COUNT` ignores, and `DISTINCT` collapses repeat opens of one email. The clicks are `SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END)`. `HAVING` keeps the groups with at least three campaigns and zero clicks.",
      "",
      "The alternative splits the two conditions: join only the open events (so the plain distinct count works) and exclude clickers with `NOT EXISTS`. Filtering opens in the join would make a conditional click count impossible, which is why the click check moves to a subquery there.",
      "",
      "Both read the events once (plus a probe per subscriber for the anti join); an index on `(subscriber_id, event_type)` helps the second.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "first-and-last-touch-revenue-by-channel",
    title: "First-Touch vs Last-Touch Revenue by Channel",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "The marketing mix review compares two attribution models side by side. For a conversion, the qualifying touches are the same user's touchpoints **at or before** `converted_at`. **First touch** credits the conversion's whole revenue to the earliest qualifying touch (equal times: the lower `touch_id`); **last touch** credits it to the latest (equal times: the higher `touch_id`). Conversions with no qualifying touch are credited to nobody.",
      "",
      "Return `channel`, `first_touch_revenue` and `last_touch_revenue` (the revenue credited to the channel under each model, 0 when none) for every channel credited under **at least one** model. Order by `channel`.",
    ].join("\n"),
    tables: [
      {
        name: "Touchpoint",
        columns: [
          { name: "touch_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "channel", type: "enum", values: ["paid_search", "paid_social", "email", "affiliate", "organic"] },
          { name: "touched_at", type: "datetime" },
        ],
        primaryKey: ["touch_id"],
        note: "One row per tracked visit from a marketing channel.",
      },
      {
        name: "Conversion",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "converted_at", type: "datetime" },
          { name: "revenue", type: "int" },
        ],
        primaryKey: ["conversion_id"],
        note: "One row per order; `revenue` in rupees.",
      },
    ],
    examples: [
      {
        Touchpoint: [
          [1, 7, "paid_social", "2024-11-01 09:00:00"],
          [2, 7, "email", "2024-11-02 18:30:00"],
          [3, 7, "paid_search", "2024-11-03 10:00:00"],
          [4, 8, "affiliate", "2024-11-02 12:00:00"],
          [5, 8, "email", "2024-11-02 12:00:00"],
          [6, 9, "organic", "2024-11-05 08:15:00"],
          [7, 7, "organic", "2024-11-06 08:00:00"],
        ],
        Conversion: [
          [101, 7, "2024-11-03 20:00:00", 1500],
          [102, 8, "2024-11-02 12:00:00", 2600],
          [103, 9, "2024-11-04 22:00:00", 800],
          [104, 7, "2024-11-02 19:00:00", 400],
        ],
      },
    ],
    gen: (rng) => {
      const ch = ["paid_search", "paid_social", "email", "affiliate", "organic"];
      const days = ["2024-11-01", "2024-11-02", "2024-11-03"];
      const slot = () => `${pick(rng, days)} ${pick(rng, ["09:00:00", "12:00:00", "18:30:00", "21:45:00"])}`;
      const touches: Cell[][] = seq(1, ri(rng, 0, 16)).map((id) => [id, ri(rng, 1, 5), pick(rng, ch), slot()]);
      const conv: Cell[][] = seq(101, ri(rng, 1, 8)).map((id) => [id, ri(rng, 1, 6), slot(), roundTo(rng, 200, 5000, 100)]);
      return { Touchpoint: touches, Conversion: conv };
    },
    solution: [
      "WITH q AS (",
      "  SELECT v.conversion_id, v.revenue, t.channel,",
      "         ROW_NUMBER() OVER (PARTITION BY v.conversion_id ORDER BY t.touched_at, t.touch_id) AS first_rn,",
      "         ROW_NUMBER() OVER (PARTITION BY v.conversion_id ORDER BY t.touched_at DESC, t.touch_id DESC) AS last_rn",
      "  FROM Conversion v",
      "  JOIN Touchpoint t ON t.user_id = v.user_id AND t.touched_at <= v.converted_at",
      ")",
      "SELECT channel,",
      "       SUM(CASE WHEN first_rn = 1 THEN revenue ELSE 0 END) AS first_touch_revenue,",
      "       SUM(CASE WHEN last_rn = 1 THEN revenue ELSE 0 END) AS last_touch_revenue",
      "FROM q",
      "WHERE first_rn = 1 OR last_rn = 1",
      "GROUP BY channel",
      "ORDER BY channel",
    ].join("\n"),
    alternatives: [
      [
        "WITH credit AS (",
        "  SELECT (SELECT t.channel FROM Touchpoint t WHERE t.user_id = v.user_id AND t.touched_at <= v.converted_at",
        "          ORDER BY t.touched_at, t.touch_id LIMIT 1) AS channel, v.revenue AS f, 0 AS l",
        "  FROM Conversion v",
        "  UNION ALL",
        "  SELECT (SELECT t.channel FROM Touchpoint t WHERE t.user_id = v.user_id AND t.touched_at <= v.converted_at",
        "          ORDER BY t.touched_at DESC, t.touch_id DESC LIMIT 1), 0, v.revenue",
        "  FROM Conversion v",
        ")",
        "SELECT channel, SUM(f) AS first_touch_revenue, SUM(l) AS last_touch_revenue",
        "FROM credit WHERE channel IS NOT NULL",
        "GROUP BY channel ORDER BY channel",
      ].join("\n"),
      [
        "WITH q AS (",
        "  SELECT v.conversion_id, v.revenue, t.touch_id, t.channel, t.touched_at",
        "  FROM Conversion v JOIN Touchpoint t ON t.user_id = v.user_id AND t.touched_at <= v.converted_at",
        "), firsts AS (",
        "  SELECT a.channel, a.revenue FROM q a",
        "  WHERE NOT EXISTS (SELECT 1 FROM q b WHERE b.conversion_id = a.conversion_id",
        "                    AND (b.touched_at < a.touched_at OR (b.touched_at = a.touched_at AND b.touch_id < a.touch_id)))",
        "), lasts AS (",
        "  SELECT a.channel, a.revenue FROM q a",
        "  WHERE NOT EXISTS (SELECT 1 FROM q b WHERE b.conversion_id = a.conversion_id",
        "                    AND (b.touched_at > a.touched_at OR (b.touched_at = a.touched_at AND b.touch_id > a.touch_id)))",
        ")",
        "SELECT channel, SUM(f) AS first_touch_revenue, SUM(l) AS last_touch_revenue FROM (",
        "  SELECT channel, revenue AS f, 0 AS l FROM firsts UNION ALL SELECT channel, 0, revenue FROM lasts",
        ") x GROUP BY channel ORDER BY channel",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair each conversion with all of its qualifying touches first.",
      "Two `ROW_NUMBER()`s over the same partition — one ascending, one descending by time — mark the first and the last touch.",
      "A single touch can be both first and last; it must then credit both columns.",
      "Sum each model with a conditional sum, and keep only rows that won under some model.",
    ],
    editorial: [
      "Start by joining every conversion to its **qualifying touches** — same user, `touched_at <= converted_at`. A conversion with no such touch disappears from the inner join, which is exactly \"credited to nobody\". Touches after the conversion (user 7's organic visit on 6 November) never enter.",
      "",
      "Within each conversion, `ROW_NUMBER()` ordered by `touched_at, touch_id` marks the first touch with 1, and the same window ordered descending marks the last touch. Breaking ties by `touch_id` in opposite directions is what the statement asks for — two touches at 12:00 on 2 November give the affiliate the first touch and email the last. A conversion with a single touch has `first_rn = 1` and `last_rn = 1` on the same row, so both conditional sums pick it up.",
      "",
      "Aggregating per channel with `SUM(CASE WHEN first_rn = 1 THEN revenue ELSE 0 END)` (and the same for last) gives both models in one pass; filtering to the winning rows keeps channels that were merely touched from appearing with two zeros. The alternatives find each winner with an ordered scalar subquery, or with a NOT EXISTS \"nobody earlier / later\" anti join, and stack the two credit streams with `UNION ALL`. The window plan sorts the joined rows twice; the subquery plans probe an index on `(user_id, touched_at)` per conversion.",
    ].join("\n"),
  },

  {
    slug: "campaign-overspend-streaks",
    title: "Streaks of Three or More Overspent Days",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A day is **overspent** for a campaign when its `spend` is strictly greater than the campaign's `daily_budget`. Pacing alerts fire only on a streak: **three or more consecutive calendar days**, all overspent. A day with no spend row breaks a streak, as does a day at or under budget.",
      "",
      "Return one row per streak of at least 3 days with `campaign_id`, `streak_start`, `streak_end` and `streak_days`. Order by `campaign_id`, then `streak_start`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "daily_budget", type: "int" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign; `daily_budget` in rupees.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day it spent, in rupees.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Independence Day Sale", 10000],
          [2, "Raksha Bandhan Gifts", 15000],
        ],
        DailySpend: [
          [1, "2024-08-10", 12000],
          [1, "2024-08-11", 11000],
          [1, "2024-08-12", 10500],
          [1, "2024-08-13", 10000],
          [1, "2024-08-14", 13000],
          [1, "2024-08-15", 18000],
          [1, "2024-08-17", 14000],
          [2, "2024-08-10", 16000],
          [2, "2024-08-11", 17000],
          [2, "2024-08-12", 15500],
          [2, "2024-08-13", 19000],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = seq(1, ri(rng, 1, 3)).map((id) => [id, pick(rng, CAMPAIGN_NAMES), pick(rng, [10000, 15000, 20000])]);
      const rows: Cell[][] = [];
      for (const c of camps) {
        const budget = c[2] as number;
        let day = "2024-08-01";
        for (let k = ri(rng, 0, 12); k > 0; k--) {
          if (chance(rng, 0.1)) day = addDays(day, 1); // a dark day breaks the run
          const r = rng();
          rows.push([c[0]!, day, r < 0.65 ? budget + roundTo(rng, 500, 5000, 500) : r < 0.8 ? budget : budget - roundTo(rng, 500, 5000, 500)]);
          day = addDays(day, 1);
        }
      }
      return { Campaign: camps, DailySpend: rows };
    },
    solution: [
      "WITH over_days AS (",
      "  SELECT s.campaign_id, s.spend_date,",
      "         ROW_NUMBER() OVER (PARTITION BY s.campaign_id ORDER BY s.spend_date) AS rn",
      "  FROM DailySpend s",
      "  JOIN Campaign c ON c.campaign_id = s.campaign_id",
      "  WHERE s.spend > c.daily_budget",
      "), islands AS (",
      "  SELECT campaign_id, spend_date, DATE_SUB(spend_date, INTERVAL rn DAY) AS grp",
      "  FROM over_days",
      ")",
      "SELECT campaign_id, MIN(spend_date) AS streak_start, MAX(spend_date) AS streak_end, COUNT(*) AS streak_days",
      "FROM islands",
      "GROUP BY campaign_id, grp",
      "HAVING COUNT(*) >= 3",
      "ORDER BY campaign_id, streak_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH o AS (",
        "  SELECT s.campaign_id, s.spend_date,",
        "         LAG(s.spend_date) OVER (PARTITION BY s.campaign_id ORDER BY s.spend_date) AS prev_date",
        "  FROM DailySpend s JOIN Campaign c ON c.campaign_id = s.campaign_id",
        "  WHERE s.spend > c.daily_budget",
        "), f AS (",
        "  SELECT campaign_id, spend_date,",
        "         SUM(CASE WHEN prev_date IS NOT NULL AND DATEDIFF(spend_date, prev_date) = 1 THEN 0 ELSE 1 END)",
        "           OVER (PARTITION BY campaign_id ORDER BY spend_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS island",
        "  FROM o",
        ")",
        "SELECT campaign_id, MIN(spend_date) AS streak_start, MAX(spend_date) AS streak_end, COUNT(*) AS streak_days",
        "FROM f GROUP BY campaign_id, island HAVING COUNT(*) >= 3",
        "ORDER BY campaign_id, streak_start",
      ].join("\n"),
      [
        "WITH o AS (",
        "  SELECT s.campaign_id, s.spend_date FROM DailySpend s JOIN Campaign c ON c.campaign_id = s.campaign_id",
        "  WHERE s.spend > c.daily_budget",
        "), starts AS (",
        "  SELECT a.campaign_id, a.spend_date AS streak_start FROM o a",
        "  WHERE NOT EXISTS (SELECT 1 FROM o b WHERE b.campaign_id = a.campaign_id AND b.spend_date = DATE_SUB(a.spend_date, INTERVAL 1 DAY))",
        "), ends AS (",
        "  SELECT a.campaign_id, a.spend_date AS streak_end FROM o a",
        "  WHERE NOT EXISTS (SELECT 1 FROM o b WHERE b.campaign_id = a.campaign_id AND b.spend_date = DATE_ADD(a.spend_date, INTERVAL 1 DAY))",
        ")",
        "SELECT s.campaign_id, s.streak_start, MIN(e.streak_end) AS streak_end, DATEDIFF(MIN(e.streak_end), s.streak_start) + 1 AS streak_days",
        "FROM starts s JOIN ends e ON e.campaign_id = s.campaign_id AND e.streak_end >= s.streak_start",
        "GROUP BY s.campaign_id, s.streak_start",
        "HAVING DATEDIFF(MIN(e.streak_end), s.streak_start) + 1 >= 3",
        "ORDER BY s.campaign_id, s.streak_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the overspent days first; a streak is then a run of consecutive dates among them.",
      "Number the overspent days of each campaign in date order. Within a run of consecutive dates, date minus row number is constant.",
      "Group by that constant to get one row per run, and keep the runs of three or more.",
      "A day spent exactly at budget is not overspent, and a missing date is a gap — both must end the run.",
    ],
    editorial: [
      "This is **gaps and islands**. Filter to the overspent days (`spend > daily_budget`, so a day exactly at budget is out). Among what remains, a streak is a maximal run of consecutive calendar dates per campaign.",
      "",
      "Number those days with `ROW_NUMBER()` per campaign in date order. Inside a run, the date and the row number both advance by one each day, so `spend_date − rn days` is the same for the whole run; a gap — a missing date or a filtered-out day — advances the date by more than the row number and starts a new constant. Grouping by (campaign, that constant) yields one row per run, with `MIN`/`MAX`/`COUNT` giving its bounds and length; `HAVING COUNT(*) >= 3` keeps the alert-worthy ones.",
      "",
      "The first alternative flags a new island whenever the previous overspent date is not exactly one day earlier (`LAG` + `DATEDIFF`) and numbers islands with a running sum of those flags — an explicit `ROWS` frame keeps the sum strictly row by row. The second finds streak starts (no overspent day before) and ends (none after) with anti joins and pairs each start with the first end at or after it. The window versions sort once per campaign; the anti-join version is quadratic in the worst case.",
    ].join("\n"),
  },

  {
    slug: "ad-click-sessions-per-user",
    title: "Ad-Click Sessions per Shopper",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The click-fraud team groups each shopper's ad clicks into **sessions**: a click starts a new session when it is the shopper's first click or comes **more than 30 minutes** (1,800 seconds) after that shopper's previous click; otherwise it continues the current session. A gap of exactly 30 minutes continues it.",
      "",
      "Return `user_id`, `sessions` (the number of sessions) and `longest_session_clicks` (the most clicks in any one session) for every shopper with at least one click. Order by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "AdClick",
        columns: [
          { name: "click_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "clicked_at", type: "datetime" },
        ],
        primaryKey: ["click_id"],
        note: "One row per tracked ad click. Two clicks of one shopper can carry the same timestamp.",
      },
    ],
    examples: [
      {
        AdClick: [
          [1, 41, 3, "2024-11-11 10:00:00"],
          [2, 41, 3, "2024-11-11 10:12:00"],
          [3, 41, 5, "2024-11-11 10:42:00"],
          [4, 41, 5, "2024-11-11 11:12:01"],
          [5, 42, 3, "2024-11-11 09:00:00"],
          [6, 42, 3, "2024-11-11 09:00:00"],
          [7, 42, 4, "2024-11-11 13:30:00"],
          [8, 43, 5, "2024-11-11 23:50:00"],
          [9, 43, 5, "2024-11-12 00:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const u of sample(rng, seq(41, 8), ri(rng, 1, 5))) {
        let t = `2024-11-11 ${String(ri(rng, 8, 20)).padStart(2, "0")}:00:00`;
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          rows.push([id++, u, ri(rng, 1, 5), t]);
          t = addSeconds(t, pick(rng, [0, 300, 1200, 1799, 1800, 1801, 2700, 7200]));
        }
      }
      return { AdClick: rows };
    },
    solution: [
      "WITH g AS (",
      "  SELECT user_id, click_id, clicked_at,",
      "         CASE WHEN LAG(clicked_at) OVER (PARTITION BY user_id ORDER BY clicked_at, click_id) IS NULL",
      "                OR TIMESTAMPDIFF(SECOND, LAG(clicked_at) OVER (PARTITION BY user_id ORDER BY clicked_at, click_id), clicked_at) > 1800",
      "              THEN 1 ELSE 0 END AS is_start",
      "  FROM AdClick",
      "), s AS (",
      "  SELECT user_id, click_id,",
      "         SUM(is_start) OVER (PARTITION BY user_id ORDER BY clicked_at, click_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM g",
      "), sizes AS (",
      "  SELECT user_id, session_no, COUNT(*) AS clicks FROM s GROUP BY user_id, session_no",
      ")",
      "SELECT user_id, COUNT(*) AS sessions, MAX(clicks) AS longest_session_clicks",
      "FROM sizes",
      "GROUP BY user_id",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT a.user_id, a.click_id, a.clicked_at FROM AdClick a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM AdClick b WHERE b.user_id = a.user_id",
        "      AND (b.clicked_at < a.clicked_at OR (b.clicked_at = a.clicked_at AND b.click_id < a.click_id))",
        "      AND TIMESTAMPDIFF(SECOND, b.clicked_at, a.clicked_at) <= 1800)",
        "), tagged AS (",
        "  SELECT c.user_id, c.click_id,",
        "         (SELECT COUNT(*) FROM starts s WHERE s.user_id = c.user_id",
        "            AND (s.clicked_at < c.clicked_at OR (s.clicked_at = c.clicked_at AND s.click_id <= c.click_id))) AS session_no",
        "  FROM AdClick c",
        ")",
        "SELECT user_id, COUNT(DISTINCT session_no) AS sessions,",
        "       MAX(n) AS longest_session_clicks",
        "FROM (SELECT user_id, session_no, COUNT(*) OVER (PARTITION BY user_id, session_no) AS n FROM tagged) t",
        "GROUP BY user_id ORDER BY user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Order each shopper's clicks by time, with `click_id` deciding equal timestamps.",
      "`LAG(clicked_at)` gives the previous click; flag the click as a session start when there is none or the gap is above 1,800 seconds.",
      "A running sum of the start flags numbers the sessions.",
      "Then count clicks per (shopper, session), and aggregate once more per shopper.",
    ],
    editorial: [
      "**Sessionisation** in three steps. First, compare each click with the shopper's previous one: `LAG(clicked_at) OVER (PARTITION BY user_id ORDER BY clicked_at, click_id)`. The click starts a session when there is no previous click or when `TIMESTAMPDIFF(SECOND, prev, clicked_at) > 1800`; exactly 1,800 seconds continues the session, and two clicks at the same second have a gap of 0. Ordering by `click_id` as well makes the sequence unique, which matters for the next step.",
      "",
      "Second, a running `SUM` of the start flags (with an explicit `ROWS` frame over the unique order) gives every click its session number. Third, group by (shopper, session) for each session's size, then by shopper for the count of sessions and the largest size. Sessions cross midnight naturally because the gap is measured on the timestamp, not the date.",
      "",
      "The alternative defines a session start without windows — no earlier click of the shopper within the last 1,800 seconds — and numbers each click by counting the starts at or before it. That is quadratic per shopper; the window plan is one sort.",
    ].join("\n"),
  },

  {
    slug: "campaign-funnel-click-to-signup-to-purchase",
    title: "Click to Sign-up to Purchase Funnel per Campaign",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Joins", "Subqueries"],
    description: [
      "Each funnel event is tagged with the campaign the shopper came from. For a campaign, a shopper **clicked** if they have a click event for it; **signed up** if they also have a sign-up event for it at or after their **first click** on it; **purchased** if they also have a purchase event for it at or after their **first such sign-up**. Events out of order (a purchase before any qualifying sign-up) don't count.",
      "",
      "For every campaign with at least one click, return `campaign_id`, `clicked`, `signed_up`, `purchased` (numbers of distinct shoppers at each stage) and `click_to_purchase_pct` = 100 × purchased ÷ clicked **rounded to 2 decimals**. Order by `campaign_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FunnelEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "event_type", type: "enum", values: ["click", "signup", "purchase"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked funnel event; a shopper can repeat any event.",
      },
    ],
    examples: [
      {
        FunnelEvent: [
          [1, 1, 10, "click", "2024-09-01 10:00:00"],
          [2, 1, 10, "signup", "2024-09-01 10:05:00"],
          [3, 1, 10, "purchase", "2024-09-02 18:00:00"],
          [4, 2, 10, "click", "2024-09-01 11:00:00"],
          [5, 2, 10, "click", "2024-09-01 11:20:00"],
          [6, 2, 10, "signup", "2024-09-01 11:30:00"],
          [7, 3, 10, "signup", "2024-09-01 09:00:00"],
          [8, 3, 10, "click", "2024-09-01 12:00:00"],
          [9, 3, 10, "purchase", "2024-09-01 12:10:00"],
          [10, 4, 20, "click", "2024-09-03 08:00:00"],
          [11, 5, 30, "purchase", "2024-09-03 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const camp of sample(rng, [10, 20, 30], ri(rng, 1, 3))) {
        for (const u of sample(rng, seq(1, 9), ri(rng, 1, 6))) {
          let t = `2024-09-0${ri(rng, 1, 3)} ${String(ri(rng, 8, 12)).padStart(2, "0")}:00:00`;
          for (let k = ri(rng, 1, 4); k > 0; k--) {
            const r = rng();
            rows.push([id++, u, camp, r < 0.45 ? "click" : r < 0.75 ? "signup" : "purchase", t]);
            t = addSeconds(t, pick(rng, [0, 600, 3600]));
          }
        }
      }
      return { FunnelEvent: rows };
    },
    solution: [
      "WITH clicks AS (",
      "  SELECT campaign_id, user_id, MIN(event_at) AS first_click",
      "  FROM FunnelEvent WHERE event_type = 'click'",
      "  GROUP BY campaign_id, user_id",
      "), signups AS (",
      "  SELECT c.campaign_id, c.user_id, MIN(e.event_at) AS first_signup",
      "  FROM clicks c",
      "  JOIN FunnelEvent e ON e.campaign_id = c.campaign_id AND e.user_id = c.user_id",
      "   AND e.event_type = 'signup' AND e.event_at >= c.first_click",
      "  GROUP BY c.campaign_id, c.user_id",
      "), buyers AS (",
      "  SELECT DISTINCT s.campaign_id, s.user_id",
      "  FROM signups s",
      "  JOIN FunnelEvent e ON e.campaign_id = s.campaign_id AND e.user_id = s.user_id",
      "   AND e.event_type = 'purchase' AND e.event_at >= s.first_signup",
      ")",
      "SELECT c.campaign_id, COUNT(*) AS clicked, COUNT(s.user_id) AS signed_up, COUNT(b.user_id) AS purchased,",
      "       ROUND(100 * COUNT(b.user_id) / COUNT(*), 2) AS click_to_purchase_pct",
      "FROM clicks c",
      "LEFT JOIN signups s ON s.campaign_id = c.campaign_id AND s.user_id = c.user_id",
      "LEFT JOIN buyers b ON b.campaign_id = c.campaign_id AND b.user_id = c.user_id",
      "GROUP BY c.campaign_id",
      "ORDER BY c.campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH clicks AS (",
        "  SELECT campaign_id, user_id, MIN(event_at) AS first_click FROM FunnelEvent WHERE event_type = 'click' GROUP BY campaign_id, user_id",
        "), staged AS (",
        "  SELECT c.campaign_id,",
        "         CASE WHEN EXISTS (SELECT 1 FROM FunnelEvent s WHERE s.campaign_id = c.campaign_id AND s.user_id = c.user_id",
        "                           AND s.event_type = 'signup' AND s.event_at >= c.first_click) THEN 1 ELSE 0 END AS su,",
        "         CASE WHEN EXISTS (SELECT 1 FROM FunnelEvent s JOIN FunnelEvent p ON p.campaign_id = s.campaign_id AND p.user_id = s.user_id",
        "                           WHERE s.campaign_id = c.campaign_id AND s.user_id = c.user_id AND s.event_type = 'signup'",
        "                             AND s.event_at >= c.first_click AND p.event_type = 'purchase' AND p.event_at >= s.event_at) THEN 1 ELSE 0 END AS pu",
        "  FROM clicks c",
        ")",
        "SELECT campaign_id, COUNT(*) AS clicked, SUM(su) AS signed_up, SUM(pu) AS purchased,",
        "       ROUND(SUM(pu) * 100 / COUNT(*), 2) AS click_to_purchase_pct",
        "FROM staged GROUP BY campaign_id ORDER BY campaign_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work per (campaign, shopper): the first step is each shopper's first click on the campaign.",
      "A sign-up counts only from the first click on; take the earliest such sign-up as the shopper's sign-up time.",
      "A purchase counts only from that sign-up on. Purchasing after *any* qualifying sign-up is the same as purchasing after the first one.",
      "LEFT JOIN the later stages back to the clickers so shoppers who stopped early still count as clicked.",
    ],
    editorial: [
      "A funnel is a chain of **ordered** conditions, so build it stage by stage per (campaign, shopper). `clicks` holds each shopper's first click. `signups` joins their sign-up events that happen at or after that click and keeps the earliest, the time the next stage must follow. `buyers` keeps shoppers with a purchase at or after that sign-up. Each CTE only narrows the one before, so the stages are nested by construction: shopper 3 above signed up before clicking, so that sign-up does not count and neither does the purchase after it.",
      "",
      "The final query LEFT JOINs the later stages back onto the clickers, so `COUNT(*)` is the clickers and `COUNT(s.user_id)`, `COUNT(b.user_id)` count only matched shoppers. Every row is one shopper (each CTE is unique per campaign and shopper), so nothing is double counted. The rate divides two exact counts and is rounded last; the denominator is never zero because only clicked campaigns appear.",
      "",
      "The alternative replaces the joins with `EXISTS` flags per clicker. Its purchase test asks for *some* qualifying sign-up followed by a purchase — equivalent, because if a purchase follows any qualifying sign-up it also follows the earliest one. With an index on `(campaign_id, user_id, event_type, event_at)` every stage is a short range scan.",
    ].join("\n"),
  },

  {
    slug: "median-daily-spend-by-channel",
    title: "Median Daily Spend of Each Channel",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Subqueries"],
    description: [
      "Average daily spend is skewed by a few festival days, so the planning team wants the **median** daily spend of each channel. With an odd number of days the median is the middle value; with an even number it is the average of the two middle values. Equal amounts count as separate days.",
      "",
      "Return `channel` and `median_daily_spend`, **rounded to 2 decimals**, for every channel with at least one day. Order by `channel`.",
    ].join("\n"),
    tables: [
      {
        name: "ChannelDailySpend",
        columns: [
          { name: "channel", type: "enum", values: [...CHANNELS] },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["channel", "spend_date"],
        note: "One row per channel per day with spend, in rupees.",
      },
    ],
    examples: [
      {
        ChannelDailySpend: [
          ["search", "2024-10-28", 20000],
          ["search", "2024-10-29", 25000],
          ["search", "2024-10-30", 90000],
          ["search", "2024-10-31", 22000],
          ["social", "2024-10-28", 15000],
          ["social", "2024-10-29", 15000],
          ["social", "2024-10-30", 60000],
          ["video", "2024-10-31", 41000],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const ch of sample(rng, CHANNELS, ri(rng, 1, 4))) {
        const pool = Array.from({ length: ri(rng, 2, 5) }, () => roundTo(rng, 5000, 60000, 500));
        for (let d = ri(rng, 1, 8); d > 0; d--) rows.push([ch, addDays("2024-10-01", d), pick(rng, pool)]);
      }
      return { ChannelDailySpend: rows };
    },
    solution: [
      "WITH r AS (",
      "  SELECT channel, spend,",
      "         ROW_NUMBER() OVER (PARTITION BY channel ORDER BY spend, spend_date) AS rn,",
      "         COUNT(*) OVER (PARTITION BY channel) AS n",
      "  FROM ChannelDailySpend",
      ")",
      "SELECT channel, ROUND(AVG(spend), 2) AS median_daily_spend",
      "FROM r",
      "WHERE rn IN (FLOOR((n + 1) / 2), FLOOR((n + 2) / 2))",
      "GROUP BY channel",
      "ORDER BY channel",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.channel, ROUND(AVG(DISTINCT a.spend), 2) AS median_daily_spend",
        "FROM ChannelDailySpend a",
        "WHERE (SELECT COUNT(*) FROM ChannelDailySpend b WHERE b.channel = a.channel AND b.spend <= a.spend) * 2",
        "        >= (SELECT COUNT(*) FROM ChannelDailySpend b WHERE b.channel = a.channel)",
        "  AND (SELECT COUNT(*) FROM ChannelDailySpend b WHERE b.channel = a.channel AND b.spend >= a.spend) * 2",
        "        >= (SELECT COUNT(*) FROM ChannelDailySpend b WHERE b.channel = a.channel)",
        "GROUP BY a.channel ORDER BY a.channel",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each channel's days by spend with `ROW_NUMBER()`, and get the channel's day count with `COUNT(*) OVER`.",
      "For n days the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋ — the same position when n is odd.",
      "Averaging the rows at those positions gives the median in both cases.",
      "Without windows: a value is a middle value when at least half the days are ≤ it and at least half are ≥ it.",
    ],
    editorial: [
      "Sort each channel's days by spend and pick the middle. `ROW_NUMBER()` (ties broken by date so the numbering is fixed) gives each day its position, and `COUNT(*) OVER (PARTITION BY channel)` gives n on every row. The middle positions are `FLOOR((n + 1) / 2)` and `FLOOR((n + 2) / 2)`: for n = 4 that is 2 and 3, for n = 3 it is 2 twice, so one `AVG` over the rows at those positions is the median whether n is odd or even. Equal amounts occupy separate positions, exactly as \"separate days\" requires; which of two equal amounts gets which number does not change the values averaged.",
      "",
      "The alternative uses the definition instead of positions: a value lies in the middle when at least half of the days are at most it and at least half are at least it. The candidates are the lower and upper middle values (or one value when they coincide), and `AVG(DISTINCT …)` averages those distinct values — plain `AVG` would overweight a repeated middle value. It is quadratic per channel; the window version is one sort.",
      "",
      "The average of two whole-rupee amounts ends in .0 or .5, so rounding to 2 decimals is exact.",
    ].join("\n"),
  },

  {
    slug: "dark-days-inside-campaign-flights",
    title: "Dark Days Inside Campaign Flight Dates",
    difficulty: "HARD",
    topics: ["Dates", "Joins"],
    description: [
      "Every campaign is booked to run on each day of its flight, from `flight_start` to `flight_end` inclusive. A **dark day** is a flight day on which the campaign spent nothing: it has no spend row, or its spend row shows 0. Spend outside the flight doesn't matter.",
      "",
      "Return `campaign_id` and `dark_day` for every dark day of every campaign. Order by `campaign_id`, then `dark_day`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "flight_start", type: "date" },
          { name: "flight_end", type: "date" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign; flights are at most three weeks long and `flight_end` is never before `flight_start`.",
      },
      {
        name: "DailySpend",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id", "spend_date"],
        note: "One row per campaign per day the ad server reported, in rupees (0 when the ads were disapproved all day).",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Ganesh Chaturthi Decor", "2024-09-05", "2024-09-09"],
          [2, "Onam Festive Deals", "2024-09-10", "2024-09-11"],
          [3, "Durga Puja Specials", "2024-10-01", "2024-10-01"],
        ],
        DailySpend: [
          [1, "2024-09-04", 5000],
          [1, "2024-09-05", 8000],
          [1, "2024-09-07", 0],
          [1, "2024-09-08", 9000],
          [2, "2024-09-10", 6000],
          [2, "2024-09-11", 6500],
          [3, "2024-10-02", 4000],
        ],
      },
    ],
    gen: (rng) => {
      const camps: Cell[][] = [];
      const rows: Cell[][] = [];
      for (const id of seq(1, ri(rng, 1, 4))) {
        const start = dateBetween(rng, "2024-06-01", "2024-06-20");
        const len = ri(rng, 0, 8);
        camps.push([id, pick(rng, CAMPAIGN_NAMES), start, addDays(start, len)]);
        for (let d = -1; d <= len + 1; d++) {
          if (chance(rng, 0.65)) rows.push([id, addDays(start, d), chance(rng, 0.15) ? 0 : roundTo(rng, 2000, 20000, 500)]);
        }
      }
      return { Campaign: camps, DailySpend: rows };
    },
    solution: [
      "WITH RECURSIVE flight AS (",
      "  SELECT campaign_id, flight_start AS day, flight_end FROM Campaign",
      "  UNION ALL",
      "  SELECT campaign_id, DATE_ADD(day, INTERVAL 1 DAY), flight_end FROM flight WHERE day < flight_end",
      ")",
      "SELECT f.campaign_id, f.day AS dark_day",
      "FROM flight f",
      "LEFT JOIN DailySpend s ON s.campaign_id = f.campaign_id AND s.spend_date = f.day",
      "WHERE s.spend IS NULL OR s.spend = 0",
      "ORDER BY f.campaign_id, f.day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE n AS (SELECT 0 AS k UNION ALL SELECT k + 1 FROM n WHERE k < 30)",
        "SELECT c.campaign_id, DATE_ADD(c.flight_start, INTERVAL n.k DAY) AS dark_day",
        "FROM Campaign c JOIN n ON DATE_ADD(c.flight_start, INTERVAL n.k DAY) <= c.flight_end",
        "WHERE NOT EXISTS (SELECT 1 FROM DailySpend s WHERE s.campaign_id = c.campaign_id",
        "                  AND s.spend_date = DATE_ADD(c.flight_start, INTERVAL n.k DAY) AND s.spend > 0)",
        "ORDER BY c.campaign_id, dark_day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The days you need are not rows anywhere — generate them.",
      "A recursive CTE can start at each campaign's `flight_start` and add one day until it reaches `flight_end`.",
      "LEFT JOIN the generated days to the spend rows; a missing row and a 0 row are both dark.",
    ],
    editorial: [
      "The answer consists of days that may have **no row** at all, so they must be generated. A recursive CTE seeds one row per campaign at `flight_start` and repeatedly adds `DATE_ADD(day, INTERVAL 1 DAY)` while `day < flight_end`, producing every flight day exactly once — a one-day flight is just its seed. The recursion stops because every campaign's day climbs towards a fixed end, and flights are short.",
      "",
      "LEFT JOIN those days to `DailySpend` on campaign and date. A day without a report comes back with `s.spend` NULL; a disapproved day has `spend = 0`; both are dark. Spend rows outside the flight never match a generated day, so they are ignored without a filter.",
      "",
      "The alternative generates a small numbers table 0–30 once and joins it to every campaign with `flight_start + k ≤ flight_end`, then keeps days with no positive spend via `NOT EXISTS` — the same calendar, built from offsets instead of per-campaign recursion. Both cost one probe per flight day.",
    ].join("\n"),
  },

  {
    slug: "overlapping-exclusive-influencer-contracts",
    title: "Creators Booked by Two Rival Brands at Once",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Creator contracts carry category exclusivity: a creator must not promote two **different brands in the same category** during overlapping periods. Periods run from `start_date` to `end_date` **inclusive**, so a contract ending on the day another starts overlaps it by one day. Two contracts with the same brand never conflict.",
      "",
      "Return every conflicting pair once, with `creator_handle`, `contract_a` (the smaller `contract_id`), `contract_b` (the larger) and `overlap_days` (the number of days both run). Order by `creator_handle`, then `contract_a`, then `contract_b`.",
    ].join("\n"),
    tables: [
      {
        name: "CreatorContract",
        columns: [
          { name: "contract_id", type: "int" },
          { name: "creator_handle", type: "varchar" },
          { name: "brand", type: "varchar" },
          { name: "category", type: "enum", values: ["audio", "skincare", "footwear"] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["contract_id"],
        note: "One row per signed contract; `end_date` is never before `start_date`. Handles and brands are stored in one consistent case.",
      },
    ],
    examples: [
      {
        CreatorContract: [
          [1, "@techbyrohan", "Sonicbay", "audio", "2024-03-01", "2024-04-30"],
          [2, "@techbyrohan", "Wavely", "audio", "2024-04-20", "2024-05-31"],
          [3, "@techbyrohan", "Glowveda", "skincare", "2024-04-01", "2024-04-30"],
          [4, "@skincarebyira", "Glowveda", "skincare", "2024-01-01", "2024-02-15"],
          [5, "@skincarebyira", "Dermique", "skincare", "2024-02-15", "2024-03-31"],
          [6, "@skincarebyira", "Glowveda", "skincare", "2024-02-01", "2024-02-28"],
          [7, "@fitwithkavya", "Kicksmith", "footwear", "2024-06-01", "2024-06-30"],
          [8, "@fitwithkavya", "Stridewell", "footwear", "2024-07-01", "2024-07-31"],
        ],
      },
    ],
    gen: (rng) => {
      const brands: Record<string, string[]> = {
        audio: ["Sonicbay", "Wavely", "Beatrix"],
        skincare: ["Glowveda", "Dermique"],
        footwear: ["Kicksmith", "Stridewell", "Trailor"],
      };
      const creators = sample(rng, CREATORS, ri(rng, 1, 2));
      const cats = sample(rng, ["audio", "skincare", "footwear"], ri(rng, 1, 2));
      const rows: Cell[][] = [];
      let prevEnd = "2024-02-01";
      for (const id of seq(1, ri(rng, 1, 12))) {
        const cat = pick(rng, cats);
        // Now and then start on the last contract's end day — the one-day overlap the statement spells out.
        const start = chance(rng, 0.25) ? prevEnd : dateBetween(rng, "2024-01-01", "2024-06-30");
        const end = addDays(start, ri(rng, 0, 75));
        prevEnd = end;
        rows.push([id, pick(rng, creators), pick(rng, brands[cat]!), cat, start, end]);
      }
      return { CreatorContract: rows };
    },
    solution: [
      "SELECT a.creator_handle, a.contract_id AS contract_a, b.contract_id AS contract_b,",
      "       DATEDIFF(LEAST(a.end_date, b.end_date), GREATEST(a.start_date, b.start_date)) + 1 AS overlap_days",
      "FROM CreatorContract a",
      "JOIN CreatorContract b",
      "  ON b.creator_handle = a.creator_handle",
      " AND b.category = a.category",
      " AND b.brand <> a.brand",
      " AND a.contract_id < b.contract_id",
      " AND a.start_date <= b.end_date",
      " AND b.start_date <= a.end_date",
      "ORDER BY a.creator_handle, contract_a, contract_b",
    ].join("\n"),
    alternatives: [
      [
        "SELECT creator_handle, contract_a, contract_b, overlap_days FROM (",
        "  SELECT a.creator_handle, a.contract_id AS contract_a, b.contract_id AS contract_b,",
        "         DATEDIFF(CASE WHEN a.end_date < b.end_date THEN a.end_date ELSE b.end_date END,",
        "                  CASE WHEN a.start_date > b.start_date THEN a.start_date ELSE b.start_date END) + 1 AS overlap_days",
        "  FROM CreatorContract a, CreatorContract b",
        "  WHERE a.creator_handle = b.creator_handle AND a.category = b.category AND a.brand <> b.brand AND a.contract_id < b.contract_id",
        ") p WHERE overlap_days > 0",
        "ORDER BY creator_handle, contract_a, contract_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair every contract with every other contract of the same creator and category — a self join.",
      "`a.contract_id < b.contract_id` lists each pair once and never pairs a contract with itself.",
      "Two inclusive ranges overlap exactly when each starts on or before the other ends.",
      "The shared days run from the later start to the earlier end: `GREATEST` and `LEAST`.",
    ],
    editorial: [
      "A conflict is a relation between **two rows of the same table**, so self-join `CreatorContract` on the same creator and category, different brands, and `a.contract_id < b.contract_id` — that ordering lists each unordered pair exactly once and excludes pairing a contract with itself.",
      "",
      "Two closed intervals `[a.start, a.end]` and `[b.start, b.end]` overlap if and only if `a.start <= b.end AND b.start <= a.end`. Both comparisons include equality because the dates are inclusive: Glowveda ending on 15 February and Dermique starting that day share one day. Contracts with the same brand (contract 4 and 6) are a renewal, not a conflict, and the `brand <>` condition drops them.",
      "",
      "The shared stretch starts at the later start and ends at the earlier end, so its length is `DATEDIFF(LEAST(ends), GREATEST(starts)) + 1`. The alternative computes that length for every candidate pair with `CASE` instead of `LEAST`/`GREATEST` and keeps the positive ones, which is the same overlap test in arithmetic form. The pair search is quadratic within a creator and category; an index on `(creator_handle, category)` keeps it small.",
    ].join("\n"),
  },
];

/** `datetime` ('YYYY-MM-DD HH:MM:SS') plus `secs` seconds. */
function addSeconds(datetime: string, secs: number): string {
  const d = new Date(Date.parse(`${datetime.replace(" ", "T")}Z`) + secs * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}
