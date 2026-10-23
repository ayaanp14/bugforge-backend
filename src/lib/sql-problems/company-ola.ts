import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Company set — Ola. The questions an analyst or data engineer at an Indian
 * mobility company in Ola's line of business gets asked: on the electric side,
 * scooter software (MoveOS-style OTA releases), battery state-of-health
 * checks, Hypercharger-style fast-charging stations, service-centre tickets,
 * experience-centre test rides and the wait from booking to delivery; on the
 * cabs side, auto/mini/prime categories, hourly rental packages, rider
 * cancellation fees, wallet top-ups and cashback, and driver-partner
 * onboarding documents. Every schema, name and number here is invented for
 * practice — none of it is Ola's real data or real schema. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and seconds after its midnight (may run past a day). */
const atSec = (date: string, seconds: number): string => {
  const d = addDays(date, Math.floor(seconds / 86400));
  const s = ((seconds % 86400) + 86400) % 86400;
  return `${d} ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight. */
const atMin = (date: string, minutes: number): string => atSec(date, minutes * 60);

const MODELS = ["S1 Pro", "S1 Air", "S1 X"] as const;
const OLA_CITIES = ["Bengaluru", "Pune", "Hyderabad", "Chennai", "Delhi", "Mumbai"] as const;
const STATIONS = [
  ["HC Koramangala", "Bengaluru"], ["HC Whitefield", "Bengaluru"], ["HC Baner", "Pune"], ["HC Hinjewadi", "Pune"],
  ["HC Gachibowli", "Hyderabad"], ["HC Velachery", "Chennai"], ["HC Saket", "Delhi"], ["HC Andheri", "Mumbai"],
] as const;
const CENTRES = ["EC Indiranagar", "EC Kothrud", "EC Jubilee Hills", "EC Anna Nagar", "EC Rajouri Garden", "EC Powai"] as const;
const RENTAL_PACKAGES = [
  ["1 hr 10 km", 1, 10, 249],
  ["2 hr 20 km", 2, 20, 449],
  ["4 hr 40 km", 4, 40, 849],
  ["4 hr 50 km", 4, 50, 949],
  ["8 hr 80 km", 8, 80, 1649],
  ["12 hr 120 km", 12, 120, 2399],
] as const;
const STATES = ["KA", "MH", "DL", "TN", "TS", "WB"] as const;

export const COMPANY_OLA: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "ola-scooters-still-below-moveos-4-2",
    title: "Ola: Scooters Still Below MoveOS 4.2",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "Before a battery-safety fix ships, the electric fleet team at Ola wants every scooter that is not yet on software **4.2 or later**, so it can be nudged to update.",
      "",
      "A version is `os_major.os_minor`: 3.9 is older than 4.0, 4.1 is older than 4.2, and 5.0 is newer. A scooter that has **never reported** a version (`os_major` is NULL) must be listed too, since nobody can confirm it is safe.",
      "",
      "Return `scooter_id`, `model`, `city` and `current_version` — the version written as `os_major`, a dot and `os_minor` (for example `4.1`), or NULL when it was never reported — ordered by `scooter_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Scooter",
        columns: [
          { name: "scooter_id", type: "int" },
          { name: "model", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "os_major", type: "int" },
          { name: "os_minor", type: "int" },
        ],
        primaryKey: ["scooter_id"],
        note: "One row per scooter sold. `os_major` and `os_minor` are both NULL until the scooter first reports its software version; `os_minor` is always below 100.",
      },
    ],
    examples: [
      {
        Scooter: [
          [1, "S1 Pro", "Bengaluru", 4, 2],
          [2, "S1 Air", "Pune", 4, 1],
          [3, "S1 X", "Chennai", 3, 9],
          [4, "S1 Pro", "Delhi", 5, 0],
          [5, "S1 X", "Pune", null, null],
          [6, "S1 Air", "Bengaluru", 4, 3],
          [7, "S1 Pro", "Hyderabad", 4, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 14);
      const versions = [[3, 8], [3, 9], [4, 0], [4, 1], [4, 2], [4, 2], [4, 3], [5, 0], [5, 1]] as const;
      const rows: Cell[][] = seq(1, n).map((id) => {
        const v = chance(rng, 0.12) ? null : pick(rng, versions);
        return [id, pick(rng, MODELS), pick(rng, OLA_CITIES), v ? v[0] : null, v ? v[1] : null];
      });
      return { Scooter: shuffle(rng, rows) };
    },
    solution: [
      "SELECT scooter_id, model, city, CONCAT(os_major, '.', os_minor) AS current_version",
      "FROM Scooter",
      "WHERE os_major IS NULL",
      "   OR os_major < 4",
      "   OR (os_major = 4 AND os_minor < 2)",
      "ORDER BY scooter_id",
    ].join("\n"),
    alternatives: [
      "SELECT scooter_id, model, city, CONCAT(os_major, '.', os_minor) AS current_version FROM Scooter WHERE COALESCE(os_major * 100 + os_minor, 0) < 402 ORDER BY scooter_id",
      "SELECT scooter_id, model, city, CASE WHEN os_major IS NULL THEN NULL ELSE CONCAT_WS('.', os_major, os_minor) END AS current_version FROM Scooter WHERE NOT (os_major > 4 OR (os_major = 4 AND os_minor >= 2)) OR os_major IS NULL ORDER BY scooter_id",
    ],
    ordered: true,
    hints: [
      "Compare the major part first; the minor part only matters when the majors are equal.",
      "A NULL version makes every comparison unknown, so a scooter that never reported has to be asked for with `IS NULL`.",
      "`CONCAT` returns NULL as soon as one argument is NULL — exactly the `current_version` the statement wants for those scooters.",
    ],
    editorial: [
      "A two-part version is compared like a word in a dictionary: the major number decides, and only on a tie does the minor number count. So \"older than 4.2\" is `os_major < 4 OR (os_major = 4 AND os_minor < 2)`. Writing just `os_minor < 2` would wrongly drop 3.9 and wrongly keep 5.0.",
      "",
      "Scooters that never reported have both parts NULL. Every comparison with NULL is unknown, which `WHERE` treats as false, so they need their own `os_major IS NULL` branch. The display column is a `CONCAT` of the two parts with a dot; MySQL's `CONCAT` returns NULL when any argument is NULL, which gives the NULL the statement asks for without a `CASE`.",
      "",
      "The first alternative packs the version into one number, `major * 100 + minor` (safe because the minor part is below 100), and maps a missing version to 0 with `COALESCE` so it falls under 402. The second negates \"4.2 or later\" and adds the NULL branch back. All of them are one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "ola-hypercharger-stations-idle-for-a-week",
    title: "Ola: Hypercharger Stations Idle Through a Whole Week",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The charging-network team reviews fast-charging stations that nobody used, to check for a broken charger or a blocked parking bay.",
      "",
      "Return every station that was **commissioned on or before 2024-06-03** and had **no charging session start** between `2024-06-03 00:00:00` and `2024-06-09 23:59:59` (the week from Monday to Sunday). Sessions outside that week do not matter, and a station commissioned later in the week is not expected to have traffic yet. Return `station_id`, `station_name` and `city`, ordered by `station_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Hypercharger",
        columns: [
          { name: "station_id", type: "int" },
          { name: "station_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "commissioned_on", type: "date" },
        ],
        primaryKey: ["station_id"],
        note: "One row per fast-charging station.",
      },
      {
        name: "ChargeSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "station_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "kwh", type: "decimal" },
        ],
        primaryKey: ["session_id"],
        note: "One row per charging session; `station_id` always names a station.",
      },
    ],
    examples: [
      {
        Hypercharger: [
          [1, "HC Koramangala", "Bengaluru", "2024-03-12"],
          [2, "HC Baner", "Pune", "2024-05-20"],
          [3, "HC Gachibowli", "Hyderabad", "2024-06-03"],
          [4, "HC Velachery", "Chennai", "2024-06-05"],
          [5, "HC Saket", "Delhi", "2024-04-01"],
        ],
        ChargeSession: [
          [101, 1, 9001, "2024-06-04 08:15:00", 2.4],
          [102, 2, 9002, "2024-06-02 21:40:00", 1.8],
          [103, 2, 9003, "2024-06-10 00:00:00", 2.1],
          [104, 5, 9004, "2024-06-09 23:58:30", 3.0],
          [105, 3, 9005, "2024-05-30 10:00:00", 1.2],
        ],
      },
    ],
    gen: (rng) => {
      const picked = sample(rng, STATIONS, ri(rng, 2, 8));
      const stations: Cell[][] = picked.map(([name, city], i) => [
        i + 1,
        name,
        city,
        chance(rng, 0.25) ? pick(rng, ["2024-06-03", "2024-06-04", "2024-06-02"]) : dateBetween(rng, "2024-03-01", "2024-06-08"),
      ]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 16);
      const sessions: Cell[][] = seq(101, n).map((id) => [
        id,
        ri(rng, 1, stations.length),
        ri(rng, 9001, 9040),
        chance(rng, 0.25)
          ? pick(rng, ["2024-06-03 00:00:00", "2024-06-02 23:59:59", "2024-06-09 23:59:59", "2024-06-10 00:00:00"])
          : atSec(dateBetween(rng, "2024-05-31", "2024-06-12"), ri(rng, 0, 86399)),
        roundTo(rng, 5, 40, 1) / 10,
      ]);
      return { Hypercharger: stations, ChargeSession: sessions };
    },
    solution: [
      "SELECT h.station_id, h.station_name, h.city",
      "FROM Hypercharger h",
      "WHERE h.commissioned_on <= '2024-06-03'",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM ChargeSession s",
      "    WHERE s.station_id = h.station_id",
      "      AND s.started_at >= '2024-06-03' AND s.started_at < '2024-06-10'",
      "  )",
      "ORDER BY h.station_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT h.station_id, h.station_name, h.city",
        "FROM Hypercharger h",
        "LEFT JOIN ChargeSession s ON s.station_id = h.station_id AND s.started_at BETWEEN '2024-06-03 00:00:00' AND '2024-06-09 23:59:59'",
        "WHERE h.commissioned_on <= '2024-06-03' AND s.session_id IS NULL",
        "ORDER BY h.station_id",
      ].join("\n"),
      "SELECT station_id, station_name, city FROM Hypercharger WHERE commissioned_on <= '2024-06-03' AND station_id NOT IN (SELECT station_id FROM ChargeSession WHERE CAST(started_at AS DATE) BETWEEN '2024-06-03' AND '2024-06-09') ORDER BY station_id",
    ],
    ordered: true,
    hints: [
      "This is an anti join: keep a station when *no* matching session exists.",
      "The week's condition belongs inside the lookup — a session in May must not save a station from the list.",
      "A half-open range `>= '2024-06-03' AND < '2024-06-10'` covers every second of the week without worrying about 23:59:59.",
    ],
    editorial: [
      "The question is about the absence of rows, so it is an **anti join**. For each station commissioned in time, look for a session at that station that started inside the week; keep the station only when that lookup finds nothing. `NOT EXISTS` says exactly that.",
      "",
      "The week's boundaries have to sit inside the subquery (or, in the join version, inside `ON`). If the date filter were applied in the outer `WHERE` after a left join, a station with a session only in May would join that row, survive the `IS NULL` test incorrectly or be dropped wrongly depending on where the filter sits. A half-open interval — on or after 2024-06-03 and before 2024-06-10 — includes a session at 23:58 on Sunday and excludes one at midnight on Monday.",
      "",
      "The `LEFT JOIN … IS NULL` and `NOT IN` alternatives give the same result here because `station_id` is never NULL in `ChargeSession`; with nullable keys `NOT IN` would return nothing, which is why `NOT EXISTS` is the safer habit. With an index on `(station_id, started_at)` each lookup is one index probe.",
    ].join("\n"),
  },

  {
    slug: "ola-rentals-completed-bookings-per-package",
    title: "Ola: Completed Rentals Bookings per Hourly Package",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The Rentals product manager at Ola wants to see how each hourly package is doing, including packages that have not sold at all, before trimming the menu.",
      "",
      "For **every** package, return `package_name`, `hours` and `completed_bookings` — the number of its bookings whose status is `completed` (0 when there are none; cancelled bookings and bookings that found no driver do not count). Order the rows by `hours`, then by `package_id`.",
    ].join("\n"),
    tables: [
      {
        name: "RentalPackage",
        columns: [
          { name: "package_id", type: "int" },
          { name: "package_name", type: "varchar" },
          { name: "hours", type: "int" },
          { name: "included_km", type: "int" },
          { name: "base_fare", type: "int" },
        ],
        primaryKey: ["package_id"],
        note: "One row per hourly package on the menu. Two packages can have the same number of hours with different kilometre allowances.",
      },
      {
        name: "RentalBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "package_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "booked_on", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled", "no_driver"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per rental booking; `package_id` always names a package.",
      },
    ],
    examples: [
      {
        RentalPackage: [
          [3, "4 hr 40 km", 4, 40, 849],
          [1, "1 hr 10 km", 1, 10, 249],
          [5, "8 hr 80 km", 8, 80, 1649],
          [2, "4 hr 50 km", 4, 50, 949],
          [4, "2 hr 20 km", 2, 20, 449],
        ],
        RentalBooking: [
          [501, 3, 71, "2024-08-01", "completed"],
          [502, 3, 72, "2024-08-01", "completed"],
          [503, 1, 73, "2024-08-02", "cancelled"],
          [504, 2, 74, "2024-08-02", "completed"],
          [505, 4, 75, "2024-08-03", "no_driver"],
          [506, 4, 71, "2024-08-04", "completed"],
          [507, 3, 76, "2024-08-04", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const picked = sample(rng, RENTAL_PACKAGES, ri(rng, 2, 6));
      const ids = shuffle(rng, seq(1, picked.length));
      const packages: Cell[][] = picked.map(([name, hours, km, fare], i) => [ids[i]!, name, hours, km, fare]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 18);
      const bookings: Cell[][] = seq(501, n).map((id) => [
        id,
        ri(rng, 1, packages.length),
        ri(rng, 70, 90),
        dateBetween(rng, "2024-08-01", "2024-08-31"),
        pick(rng, ["completed", "completed", "completed", "cancelled", "no_driver"]),
      ]);
      return { RentalPackage: packages, RentalBooking: bookings };
    },
    solution: [
      "SELECT p.package_name, p.hours, COUNT(b.booking_id) AS completed_bookings",
      "FROM RentalPackage p",
      "LEFT JOIN RentalBooking b ON b.package_id = p.package_id AND b.status = 'completed'",
      "GROUP BY p.package_id, p.package_name, p.hours",
      "ORDER BY p.hours, p.package_id",
    ].join("\n"),
    alternatives: [
      "SELECT p.package_name, p.hours, (SELECT COUNT(*) FROM RentalBooking b WHERE b.package_id = p.package_id AND b.status = 'completed') AS completed_bookings FROM RentalPackage p ORDER BY p.hours, p.package_id",
      "SELECT p.package_name, p.hours, COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_bookings FROM RentalPackage p LEFT JOIN RentalBooking b ON b.package_id = p.package_id GROUP BY p.package_id, p.package_name, p.hours ORDER BY p.hours, p.package_id",
    ],
    ordered: true,
    hints: [
      "Every package must appear, sold or not — start from `RentalPackage` and keep it whole with a LEFT JOIN.",
      "If the status filter goes in `WHERE`, packages with no completed booking disappear. Put it in `ON` instead.",
      "`COUNT(column)` skips NULLs, so an unmatched package counts 0.",
    ],
    editorial: [
      "The menu has to be listed in full, so the query starts from `RentalPackage` and attaches bookings with a `LEFT JOIN`. The trap is where the status condition goes. In `WHERE`, it runs after the join and throws away the NULL-extended row of a package with no completed bookings, so that package vanishes. In the join's `ON` clause it only decides which bookings attach, and a package with none keeps one row whose booking columns are NULL.",
      "",
      "`COUNT(b.booking_id)` then counts only real bookings, so the unmatched package shows 0. `COUNT(*)` would count the NULL row and show 1. Grouping by `package_id` keeps two packages apart even if they share hours, and the tie on `hours` is broken by `package_id` as asked.",
      "",
      "The alternatives count with a correlated subquery per package, or join every booking and add up a `CASE` that is 1 only for completed ones (wrapped in `COALESCE`, since the sum over a lone NULL row is NULL). All of them read each booking once.",
    ].join("\n"),
  },

  {
    slug: "ola-money-wallets-over-monthly-load-limit",
    title: "Ola: Wallets Topped Up Over ₹10,000 in May 2024",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Wallets on minimum KYC may be loaded with at most ₹10,000 in a calendar month, and the payments compliance team at Ola checks each month that no wallet slipped past the limit.",
      "",
      "Return every `user_id` whose **top-ups** in **May 2024** add up to **more than 10000**, with that total as `may_topups`. Ride payments, refunds and cashback are not loads and do not count; a wallet at exactly 10000 is within the limit. Order the rows by `may_topups` from highest to lowest, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "WalletTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["topup", "ride_payment", "refund", "cashback"] },
          { name: "amount", type: "int" },
          { name: "txn_at", type: "datetime" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per wallet transaction; `amount` is in rupees and always positive.",
      },
    ],
    examples: [
      {
        WalletTxn: [
          [1, 11, "topup", 6000, "2024-05-02 09:10:00"],
          [2, 11, "topup", 5000, "2024-05-20 18:00:00"],
          [3, 12, "topup", 10000, "2024-05-05 11:30:00"],
          [4, 12, "refund", 500, "2024-05-06 08:00:00"],
          [5, 13, "topup", 7000, "2024-04-30 23:59:59"],
          [6, 13, "topup", 4000, "2024-05-31 23:00:00"],
          [7, 14, "topup", 9000, "2024-05-12 10:00:00"],
          [8, 14, "topup", 2000, "2024-06-01 00:00:00"],
          [9, 15, "topup", 8000, "2024-05-09 12:00:00"],
          [10, 15, "topup", 3000, "2024-05-10 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 8, 24);
      const users = seq(11, ri(rng, 2, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, users),
        pick(rng, ["topup", "topup", "topup", "topup", "ride_payment", "refund", "cashback"]),
        roundTo(rng, 2000, 8000, 500),
        chance(rng, 0.2)
          ? pick(rng, ["2024-04-30 23:59:59", "2024-05-01 00:00:00", "2024-05-31 23:59:59", "2024-06-01 00:00:00"])
          : atSec(dateBetween(rng, "2024-04-25", "2024-06-05"), ri(rng, 0, 86399)),
      ]);
      // A wallet loaded to exactly the limit, now and then.
      if (chance(rng, 0.4)) {
        rows.push([n + 1, 99, "topup", 6000, "2024-05-03 10:00:00"], [n + 2, 99, "topup", 4000, "2024-05-25 10:00:00"]);
      }
      return { WalletTxn: rows };
    },
    solution: [
      "SELECT user_id, SUM(amount) AS may_topups",
      "FROM WalletTxn",
      "WHERE txn_type = 'topup'",
      "  AND txn_at >= '2024-05-01' AND txn_at < '2024-06-01'",
      "GROUP BY user_id",
      "HAVING SUM(amount) > 10000",
      "ORDER BY may_topups DESC, user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, may_topups FROM (SELECT user_id, SUM(amount) AS may_topups FROM WalletTxn WHERE txn_type = 'topup' AND YEAR(txn_at) = 2024 AND MONTH(txn_at) = 5 GROUP BY user_id) t WHERE may_topups > 10000 ORDER BY may_topups DESC, user_id",
      "SELECT user_id, SUM(CASE WHEN txn_type = 'topup' AND DATE_FORMAT(txn_at, '%Y-%m') = '2024-05' THEN amount ELSE 0 END) AS may_topups FROM WalletTxn GROUP BY user_id HAVING may_topups > 10000 ORDER BY may_topups DESC, user_id",
    ],
    ordered: true,
    hints: [
      "Filter to top-ups in May first, then add up per user.",
      "A condition on a total belongs in `HAVING`, not `WHERE`.",
      "\"More than\" is strict: a wallet at exactly 10000 stays off the list.",
    ],
    editorial: [
      "The check is a total per wallet, so it is a `GROUP BY user_id` with `SUM(amount)`. Two filters act at different stages. Which rows count — top-ups only, and only those dated in May — is a row filter in `WHERE`, applied before grouping. Which wallets are reported — those whose total is over 10000 — depends on the sum, so it goes in `HAVING`, after grouping.",
      "",
      "The month is written as a half-open range: on or after `2024-05-01` and before `2024-06-01`. That includes a top-up at 23:59:59 on 31 May and excludes one at midnight on 1 June, without depending on how many days the month has. The comparison is strict, so a wallet loaded to exactly ₹10,000 is not flagged. Ties on the total are ordered by `user_id`.",
      "",
      "The alternatives filter the month with `YEAR`/`MONTH` or `DATE_FORMAT`, and one moves the type and month test into a conditional `SUM` over all rows. The range form is the one that can use an index on `txn_at`.",
    ].join("\n"),
  },

  {
    slug: "ola-driver-licences-expiring-in-july",
    title: "Ola: Driver Licences Expiring Within 30 Days",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "On 2024-07-01 the driver-partner operations team sends renewal reminders to active drivers whose driving licence is about to run out.",
      "",
      "Return every **active** driver whose `driving_licence` document expires **from 2024-07-01 to 30 days after it, both days included**. Licences already expired before 2024-07-01 go to a different team and are not listed; other document types are ignored. Return `driver_id`, `full_name`, `expires_on` and `days_left` — the days from 2024-07-01 to the expiry date — ordered by `days_left`, then `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "status", type: "enum", values: ["active", "suspended", "offboarded"] },
        ],
        primaryKey: ["driver_id"],
        note: "One row per driver-partner.",
      },
      {
        name: "DriverDocument",
        columns: [
          { name: "doc_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "doc_type", type: "enum", values: ["driving_licence", "vehicle_rc", "insurance", "pan"] },
          { name: "expires_on", type: "date" },
        ],
        primaryKey: ["doc_id"],
        note: "A driver has at most one current document of each type. `expires_on` is NULL for documents that never expire (PAN).",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Ravi Kumar", "Bengaluru", "active"],
          [2, "Suresh Patil", "Pune", "active"],
          [3, "Imran Shaikh", "Mumbai", "suspended"],
          [4, "Gopal Rao", "Hyderabad", "active"],
          [5, "Manoj Yadav", "Delhi", "active"],
        ],
        DriverDocument: [
          [11, 1, "driving_licence", "2024-07-31"],
          [12, 1, "insurance", "2024-07-05"],
          [13, 2, "driving_licence", "2024-07-01"],
          [14, 3, "driving_licence", "2024-07-10"],
          [15, 4, "driving_licence", "2024-08-01"],
          [16, 5, "driving_licence", "2024-06-30"],
          [17, 5, "pan", null],
          [18, 4, "vehicle_rc", "2024-07-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const people = names(rng, n);
      const drivers: Cell[][] = people.map((p, i) => [i + 1, `${p} ${pick(rng, ["Kumar", "Patil", "Rao", "Yadav", "Shaikh", "Reddy"])}`, pick(rng, OLA_CITIES), pick(rng, ["active", "active", "active", "suspended", "offboarded"])]);
      const docs: Cell[][] = [];
      let id = 11;
      for (const d of drivers) {
        for (const type of ["driving_licence", "vehicle_rc", "insurance", "pan"]) {
          if (type !== "driving_licence" && chance(rng, 0.5)) continue;
          if (type === "driving_licence" && chance(rng, 0.1)) continue;
          const exp = type === "pan" ? null : chance(rng, 0.3) ? pick(rng, ["2024-06-30", "2024-07-01", "2024-07-31", "2024-08-01"]) : dateBetween(rng, "2024-06-10", "2024-08-25");
          docs.push([id++, d[0]!, type, exp]);
        }
      }
      return { Driver: drivers, DriverDocument: shuffle(rng, docs) };
    },
    solution: [
      "SELECT d.driver_id, d.full_name, x.expires_on, DATEDIFF(x.expires_on, '2024-07-01') AS days_left",
      "FROM Driver d",
      "JOIN DriverDocument x ON x.driver_id = d.driver_id",
      "WHERE d.status = 'active'",
      "  AND x.doc_type = 'driving_licence'",
      "  AND x.expires_on BETWEEN '2024-07-01' AND DATE_ADD('2024-07-01', INTERVAL 30 DAY)",
      "ORDER BY days_left, d.driver_id",
    ].join("\n"),
    alternatives: [
      "SELECT d.driver_id, d.full_name, x.expires_on, TIMESTAMPDIFF(DAY, '2024-07-01', x.expires_on) AS days_left FROM Driver d JOIN DriverDocument x ON x.driver_id = d.driver_id AND x.doc_type = 'driving_licence' WHERE d.status = 'active' AND TIMESTAMPDIFF(DAY, '2024-07-01', x.expires_on) BETWEEN 0 AND 30 ORDER BY days_left, d.driver_id",
      "SELECT x.driver_id, (SELECT full_name FROM Driver d WHERE d.driver_id = x.driver_id) AS full_name, x.expires_on, DATEDIFF(x.expires_on, '2024-07-01') AS days_left FROM DriverDocument x WHERE x.doc_type = 'driving_licence' AND x.expires_on >= '2024-07-01' AND x.expires_on <= '2024-07-31' AND x.driver_id IN (SELECT driver_id FROM Driver WHERE status = 'active') ORDER BY days_left, x.driver_id",
    ],
    ordered: true,
    hints: [
      "Join the driver to their documents and keep only the licence row.",
      "\"Within 30 days, both ends included\" is a `BETWEEN` from 2024-07-01 to `DATE_ADD('2024-07-01', INTERVAL 30 DAY)`.",
      "`DATEDIFF(later, earlier)` counts whole days, so a licence expiring on 2024-07-01 has 0 days left.",
    ],
    editorial: [
      "Each driver's status lives in `Driver` and the expiry dates live in `DriverDocument`, so the query joins the two and filters: the driver must be active, the document must be the driving licence, and the expiry must fall in the 30-day window starting 2024-07-01.",
      "",
      "`DATE_ADD('2024-07-01', INTERVAL 30 DAY)` is 2024-07-31, and `BETWEEN` includes both ends, so a licence expiring on the 1st (0 days left) and one expiring on the 31st (30 days left) are both reminded, while one that lapsed on 30 June and one expiring on 1 August are not. A NULL expiry never satisfies `BETWEEN`, but only PAN rows have one and they are filtered by type anyway.",
      "",
      "`days_left` is `DATEDIFF(expires_on, '2024-07-01')`; the first alternative uses `TIMESTAMPDIFF(DAY, …)`, which gives the same whole days for plain dates. The second avoids the join by looking the name up with a scalar subquery and the status with `IN`. Ties on `days_left` go by `driver_id`.",
    ].join("\n"),
  },

  {
    slug: "ola-test-ride-no-shows-by-experience-centre",
    title: "Ola: Test Ride Bookings and No-Shows per Experience Centre",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "Experience centres let a customer book a scooter test ride, and the retail team at Ola wants to know which centres lose the most slots to people who never turn up.",
      "",
      "For every centre with at least one test-ride booking, return `centre_name`, `booked` (all its bookings, whatever the outcome), `completed` (outcome `completed`) and `no_shows` (outcome `no_show`). Rescheduled bookings count only in `booked`. Order the rows by `no_shows` from highest to lowest, then by `centre_name`.",
    ].join("\n"),
    tables: [
      {
        name: "ExperienceCentre",
        columns: [
          { name: "centre_id", type: "int" },
          { name: "centre_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["centre_id"],
        note: "One row per experience centre; names are unique.",
      },
      {
        name: "TestRide",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "centre_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "slot_at", type: "datetime" },
          { name: "outcome", type: "enum", values: ["completed", "no_show", "rescheduled"] },
        ],
        primaryKey: ["ride_id"],
        note: "One row per booked test-ride slot.",
      },
    ],
    examples: [
      {
        ExperienceCentre: [
          [1, "EC Indiranagar", "Bengaluru"],
          [2, "EC Kothrud", "Pune"],
          [3, "EC Powai", "Mumbai"],
          [4, "EC Anna Nagar", "Chennai"],
        ],
        TestRide: [
          [1, 1, 501, "2024-09-07 11:00:00", "completed"],
          [2, 1, 502, "2024-09-07 12:00:00", "no_show"],
          [3, 1, 503, "2024-09-08 10:00:00", "no_show"],
          [4, 2, 504, "2024-09-07 16:00:00", "completed"],
          [5, 2, 505, "2024-09-08 17:00:00", "rescheduled"],
          [6, 4, 506, "2024-09-08 18:00:00", "no_show"],
          [7, 4, 507, "2024-09-09 11:00:00", "no_show"],
          [8, 2, 508, "2024-09-09 12:00:00", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const centres: Cell[][] = sample(rng, CENTRES, ri(rng, 1, 5)).map((name, i) => [i + 1, name, pick(rng, OLA_CITIES)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rides: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, centres.length),
        ri(rng, 500, 560),
        atMin(dateBetween(rng, "2024-09-01", "2024-09-15"), ri(rng, 10, 19) * 60),
        pick(rng, ["completed", "completed", "no_show", "no_show", "rescheduled"]),
      ]);
      return { ExperienceCentre: centres, TestRide: rides };
    },
    solution: [
      "SELECT c.centre_name,",
      "       COUNT(*) AS booked,",
      "       SUM(CASE WHEN t.outcome = 'completed' THEN 1 ELSE 0 END) AS completed,",
      "       SUM(CASE WHEN t.outcome = 'no_show' THEN 1 ELSE 0 END) AS no_shows",
      "FROM ExperienceCentre c",
      "JOIN TestRide t ON t.centre_id = c.centre_id",
      "GROUP BY c.centre_id, c.centre_name",
      "ORDER BY no_shows DESC, c.centre_name",
    ].join("\n"),
    alternatives: [
      "SELECT c.centre_name, COUNT(*) AS booked, SUM(t.outcome = 'completed') AS completed, SUM(t.outcome = 'no_show') AS no_shows FROM ExperienceCentre c JOIN TestRide t ON t.centre_id = c.centre_id GROUP BY c.centre_id, c.centre_name ORDER BY no_shows DESC, c.centre_name",
      "SELECT c.centre_name, x.booked, x.completed, x.no_shows FROM ExperienceCentre c JOIN (SELECT centre_id, COUNT(*) AS booked, COUNT(IF(outcome = 'completed', 1, NULL)) AS completed, COUNT(IF(outcome = 'no_show', 1, NULL)) AS no_shows FROM TestRide GROUP BY centre_id) x ON x.centre_id = c.centre_id ORDER BY x.no_shows DESC, c.centre_name",
    ],
    ordered: true,
    hints: [
      "One row per centre means one `GROUP BY` — the three counts come from the same group.",
      "Count one outcome inside a group with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "An inner join already leaves out centres without bookings.",
    ],
    editorial: [
      "All three numbers describe the same group of rows — one centre's bookings — so they come out of a single `GROUP BY` with **conditional aggregation**. `COUNT(*)` counts every booking. For the outcome-specific counts, a `CASE` turns each row into 1 when it has that outcome and 0 otherwise, and `SUM` adds them up; a rescheduled booking contributes 0 to both and still counts in `booked`.",
      "",
      "Joining with an inner join drops centres that had no bookings, which the statement wants. Grouping by `centre_id` as well as the name is the safe habit even though names are unique here. The order is by `no_shows` descending, with the name breaking ties so the result is fixed.",
      "",
      "In MySQL a comparison is 1 or 0, so `SUM(t.outcome = 'no_show')` is a shorter spelling of the same count, used in the first alternative. The second aggregates the bookings in a derived table with `COUNT(IF(…, 1, NULL))` — `COUNT` skips the NULLs — and joins the centre names on afterwards. Each version reads the bookings once.",
    ].join("\n"),
  },

  {
    slug: "ola-registration-plates-cleaned-for-upload",
    title: "Ola: Registration Plates Cleaned for the Compliance Upload",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Driver-partners type their vehicle's registration number themselves, in any case and with spaces or hyphens, and the compliance team must upload clean plates in one fixed format.",
      "",
      "For every vehicle return `vehicle_id`, `clean_plate` — the plate in **upper case with every space and hyphen removed** (so `ka 01-ab 1234` becomes `KA01AB1234`) — and `state_code`, the **first two characters** of the clean plate. A vehicle with no plate on file (`plate` is NULL) appears with NULL in both columns. Order the rows by `vehicle_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Vehicle",
        columns: [
          { name: "vehicle_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "category", type: "enum", values: ["auto", "mini", "prime_sedan", "prime_suv"] },
          { name: "plate", type: "varchar" },
        ],
        primaryKey: ["vehicle_id"],
        note: "`plate` is exactly what the driver typed: letters, digits, spaces and hyphens, possibly with spaces at either end.",
      },
    ],
    examples: [
      {
        Vehicle: [
          [1, 201, "auto", "ka 01-ab 1234"],
          [2, 202, "mini", "MH12DE4521"],
          [3, 203, "prime_sedan", "  dl-3c-af-0042 "],
          [4, 204, "prime_suv", null],
          [5, 205, "mini", "Ts 09 Ex 7781"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
      const rows: Cell[][] = seq(1, n).map((id) => {
        if (chance(rng, 0.12)) return [id, 200 + id, pick(rng, ["auto", "mini", "prime_sedan", "prime_suv"]), null];
        const parts = [
          pick(rng, STATES),
          pad(ri(rng, 1, 20)),
          Array.from({ length: ri(rng, 1, 2) }, () => letters[ri(rng, 0, letters.length - 1)]).join(""),
          String(ri(rng, 1, 9999)).padStart(4, "0"),
        ];
        const sep = pick(rng, ["", " ", "-", " - "]);
        let plate = parts.join(sep);
        const style = ri(rng, 0, 2);
        if (style === 1) plate = plate.toLowerCase();
        else if (style === 2) plate = plate.split("").map((ch) => (chance(rng, 0.5) ? ch.toLowerCase() : ch)).join("");
        if (chance(rng, 0.3)) plate = `${" ".repeat(ri(rng, 0, 2))}${plate}${" ".repeat(ri(rng, 1, 2))}`;
        return [id, 200 + id, pick(rng, ["auto", "mini", "prime_sedan", "prime_suv"]), plate];
      });
      return { Vehicle: shuffle(rng, rows) };
    },
    solution: [
      "SELECT vehicle_id,",
      "       UPPER(REPLACE(REPLACE(plate, ' ', ''), '-', '')) AS clean_plate,",
      "       UPPER(LEFT(REPLACE(REPLACE(plate, ' ', ''), '-', ''), 2)) AS state_code",
      "FROM Vehicle",
      "ORDER BY vehicle_id",
    ].join("\n"),
    alternatives: [
      "WITH c AS (SELECT vehicle_id, UCASE(REPLACE(REPLACE(TRIM(plate), '-', ''), ' ', '')) AS clean_plate FROM Vehicle) SELECT vehicle_id, clean_plate, SUBSTRING(clean_plate, 1, 2) AS state_code FROM c ORDER BY vehicle_id",
    ],
    ordered: true,
    hints: [
      "`REPLACE(s, ' ', '')` removes every space, not just the ones at the ends.",
      "Nest a second `REPLACE` for the hyphens, then wrap the result in `UPPER`.",
      "Take the state code from the cleaned plate, not the raw one — the raw plate may start with spaces.",
    ],
    editorial: [
      "Cleaning a string usually means stacking simple functions. `REPLACE(plate, ' ', '')` deletes every space anywhere in the plate (so a separate `TRIM` is not needed), a second `REPLACE` deletes the hyphens, and `UPPER` fixes the case. The order of the two `REPLACE`s does not matter, and upper-casing before or after removing characters gives the same result.",
      "",
      "The state code has to be cut from the cleaned value: `LEFT(raw_plate, 2)` on `'  dl-3c…'` would return two spaces. Taking `LEFT(…, 2)` of the cleaned plate gives `DL`. Repeating the cleaning expression is fine; the alternative computes it once in a CTE and reads `SUBSTRING(clean_plate, 1, 2)` from it.",
      "",
      "NULL needs no special handling: every string function returns NULL for a NULL input, so a vehicle with no plate keeps its row with NULL in both computed columns, as asked. The query is a single scan with constant work per row.",
    ].join("\n"),
  },

  {
    slug: "ola-scooters-due-for-their-first-free-service",
    title: "Ola: Scooters Due for Their First Free Service",
    difficulty: "EASY",
    topics: ["Dates", "Conditional Logic"],
    description: [
      "A new scooter's first free service falls due **90 days after delivery or at 1,000 km, whichever comes first**. On 2024-10-01 the after-sales team calls owners whose scooter is due and has not been serviced yet.",
      "",
      "Return every scooter with **no first service recorded** (`first_service_on` is NULL) that is due on 2024-10-01: at least **90 days** since `delivered_on` (`DATEDIFF('2024-10-01', delivered_on) >= 90`) **or** an `odometer_km` of at least **1000**. Return `scooter_id`, `owner_name`, `days_since_delivery` and `due_reason` — `both` when both limits are reached, `distance` when only the kilometres are, `time` when only the days are. Order the rows by `days_since_delivery` from most to fewest, then by `scooter_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ScooterOwner",
        columns: [
          { name: "scooter_id", type: "int" },
          { name: "owner_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "delivered_on", type: "date" },
          { name: "odometer_km", type: "int" },
          { name: "first_service_on", type: "date" },
        ],
        primaryKey: ["scooter_id"],
        note: "One row per delivered scooter, with its latest odometer reading. `first_service_on` is NULL until the first free service is done. Every delivery is on or before 2024-10-01.",
      },
    ],
    examples: [
      {
        ScooterOwner: [
          [1, "Aarav", "Bengaluru", "2024-06-20", 640, null],
          [2, "Diya", "Pune", "2024-08-28", 1000, null],
          [3, "Kabir", "Chennai", "2024-07-03", 999, null],
          [4, "Meera", "Delhi", "2024-07-04", 820, null],
          [5, "Rohan", "Hyderabad", "2024-05-30", 1450, null],
          [6, "Zara", "Bengaluru", "2024-05-12", 2100, "2024-08-01"],
          [7, "Ishaan", "Mumbai", "2024-09-25", 1210, null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 14);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const delivered = chance(rng, 0.25) ? pick(rng, ["2024-07-03", "2024-07-04", "2024-10-01"]) : dateBetween(rng, "2024-05-01", "2024-09-30");
        const km = chance(rng, 0.25) ? pick(rng, [999, 1000, 1001]) : ri(rng, 100, 2200);
        const serviced = chance(rng, 0.3) ? addDays(delivered, ri(rng, 20, 80)) : null;
        return [id, who[i]!, pick(rng, OLA_CITIES), delivered, km, serviced];
      });
      return { ScooterOwner: shuffle(rng, rows) };
    },
    solution: [
      "SELECT scooter_id, owner_name,",
      "       DATEDIFF('2024-10-01', delivered_on) AS days_since_delivery,",
      "       CASE WHEN DATEDIFF('2024-10-01', delivered_on) >= 90 AND odometer_km >= 1000 THEN 'both'",
      "            WHEN odometer_km >= 1000 THEN 'distance'",
      "            ELSE 'time' END AS due_reason",
      "FROM ScooterOwner",
      "WHERE first_service_on IS NULL",
      "  AND (DATEDIFF('2024-10-01', delivered_on) >= 90 OR odometer_km >= 1000)",
      "ORDER BY days_since_delivery DESC, scooter_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT scooter_id, owner_name, days_since_delivery,",
        "       IF(by_time = 1, IF(by_km = 1, 'both', 'time'), 'distance') AS due_reason",
        "FROM (",
        "  SELECT scooter_id, owner_name, first_service_on,",
        "         TIMESTAMPDIFF(DAY, delivered_on, '2024-10-01') AS days_since_delivery,",
        "         IF(delivered_on <= DATE_SUB('2024-10-01', INTERVAL 90 DAY), 1, 0) AS by_time,",
        "         IF(odometer_km >= 1000, 1, 0) AS by_km",
        "  FROM ScooterOwner",
        ") s",
        "WHERE first_service_on IS NULL AND by_time + by_km > 0",
        "ORDER BY days_since_delivery DESC, scooter_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"Whichever comes first\" means the scooter is due when *either* limit is reached — an `OR`.",
      "Both limits are inclusive: exactly 90 days or exactly 1000 km is due.",
      "Test the `both` case first in the `CASE`; the later branches then only see scooters that reached one limit.",
    ],
    editorial: [
      "Two independent triggers make a scooter due — elapsed time and distance — and the scooter qualifies as soon as either fires, so the filter is `days >= 90 OR odometer_km >= 1000`, together with `first_service_on IS NULL` for scooters that have not been serviced. The parentheses around the `OR` matter: without them `AND` binds tighter and serviced scooters with high mileage would slip in.",
      "",
      "`DATEDIFF('2024-10-01', delivered_on)` counts whole days, so a scooter delivered on 2024-07-03 is exactly 90 days old and due, while one delivered a day later is not. The reason label is a `CASE` whose branches are tried in order: both limits reached gives `both`; otherwise, since the row passed the filter, exactly one limit fired, and testing the distance next leaves `time` for the `ELSE`.",
      "",
      "The alternative computes the two triggers as 0/1 flags in a derived table — the time test written as `delivered_on <= DATE_SUB('2024-10-01', INTERVAL 90 DAY)` — and builds the label with nested `IF`s. Both are a single scan; the date comparison form can use an index on `delivered_on`.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "ola-energy-use-outliers-within-each-model",
    title: "Ola: Scooters With Outlier Energy Use Within Their Model",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Joins", "Conditional Logic"],
    description: [
      "Every month the fleet-efficiency report gives each scooter's average energy use in watt-hours per kilometre. A scooter far from the rest of its model may have a dragging brake, a weak pack or an unusual rider, so the battery team flags statistical outliers.",
      "",
      "Use only the **October 2024** report (`report_month = '2024-10'`) and only scooters that rode that month (`wh_per_km` is not NULL). Within each `model`, let `mean` be the average `wh_per_km` and `sd` the **population** standard deviation, `sd² = AVG(x²) − AVG(x)²`. A scooter is an outlier when it lies **more than 2 standard deviations** from its model's mean: `(x − mean)² > 4·sd²` (exactly 2 is not). Return `scooter_id`, `model`, `wh_per_km` and `direction` (`high` above the mean, `low` below it), ordered by `model`, then `scooter_id`. Compare in squared form — no square roots, so the test stays exact.",
    ].join("\n"),
    tables: [
      {
        name: "EfficiencyReport",
        columns: [
          { name: "scooter_id", type: "int" },
          { name: "report_month", type: "char" },
          { name: "model", type: "varchar" },
          { name: "wh_per_km", type: "int" },
        ],
        primaryKey: ["scooter_id", "report_month"],
        note: "One row per scooter per month, `report_month` as `YYYY-MM`. `wh_per_km` is NULL when the scooter was not ridden that month.",
      },
    ],
    examples: [
      {
        EfficiencyReport: [
          [1, "2024-10", "S1 Pro", 30],
          [2, "2024-10", "S1 Pro", 31],
          [3, "2024-10", "S1 Pro", 29],
          [4, "2024-10", "S1 Pro", 30],
          [5, "2024-10", "S1 Pro", 32],
          [6, "2024-10", "S1 Pro", 30],
          [7, "2024-10", "S1 Pro", 48],
          [8, "2024-10", "S1 Pro", null],
          [9, "2024-10", "S1 X", 25],
          [10, "2024-10", "S1 X", 40],
          [11, "2024-10", "S1 X", 33],
          [7, "2024-09", "S1 Pro", 31],
          [12, "2024-09", "S1 X", 90],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const models = sample(rng, MODELS, ri(rng, 1, 3));
      let id = 1;
      for (const model of models) {
        const base = ri(rng, 24, 36);
        const n = chance(rng, 0.15) ? ri(rng, 1, 5) : ri(rng, 7, 12);
        const spike = chance(rng, 0.85);
        for (let i = 0; i < n; i++) {
          let v: number | null = base + ri(rng, -2, 2);
          if (spike && i === n - 1) v = base + pick(rng, [-16, -12, 15, 20, 28]);
          if (chance(rng, 0.08)) v = null;
          rows.push([id, "2024-10", model, v]);
          if (chance(rng, 0.3)) rows.push([id, "2024-09", model, base + ri(rng, -20, 30)]);
          id++;
        }
      }
      return { EfficiencyReport: shuffle(rng, rows) };
    },
    solution: [
      "WITH stats AS (",
      "  SELECT model, COUNT(wh_per_km) AS n, SUM(wh_per_km) AS sx, SUM(wh_per_km * wh_per_km) AS sxx",
      "  FROM EfficiencyReport",
      "  WHERE report_month = '2024-10' AND wh_per_km IS NOT NULL",
      "  GROUP BY model",
      ")",
      "SELECT e.scooter_id, e.model, e.wh_per_km,",
      "       CASE WHEN e.wh_per_km * s.n > s.sx THEN 'high' ELSE 'low' END AS direction",
      "FROM EfficiencyReport e",
      "JOIN stats s ON s.model = e.model",
      "WHERE e.report_month = '2024-10' AND e.wh_per_km IS NOT NULL",
      "  AND (e.wh_per_km * s.n - s.sx) * (e.wh_per_km * s.n - s.sx) > 4 * (s.n * s.sxx - s.sx * s.sx)",
      "ORDER BY e.model, e.scooter_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH w AS (",
        "  SELECT scooter_id, model, wh_per_km,",
        "         COUNT(*) OVER (PARTITION BY model) AS n,",
        "         SUM(wh_per_km) OVER (PARTITION BY model) AS sx,",
        "         SUM(wh_per_km * wh_per_km) OVER (PARTITION BY model) AS sxx",
        "  FROM EfficiencyReport",
        "  WHERE report_month = '2024-10' AND wh_per_km IS NOT NULL",
        ")",
        "SELECT scooter_id, model, wh_per_km, IF(wh_per_km * n > sx, 'high', 'low') AS direction",
        "FROM w",
        "WHERE POW(n * wh_per_km - sx, 2) > 4 * (n * sxx - POW(sx, 2))",
        "ORDER BY model, scooter_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Per model you need three aggregates: how many values, their sum and the sum of their squares.",
      "With `mean = sx / n` and `sd² = sxx / n − mean²`, multiply the outlier test by `n²` to clear every fraction: `(n·x − sx)² > 4·(n·sxx − sx²)`.",
      "Filter the month and the NULLs before computing the statistics — a September value or a non-rider must not move the mean.",
    ],
    editorial: [
      "The **mean ± 2 standard deviations** rule needs the mean and the standard deviation of each model's values. Both come from three aggregates: the count `n`, the sum `sx` and the sum of squares `sxx`. The mean is `sx / n`, and the population variance is the mean of the squares minus the square of the mean, `sxx / n − (sx / n)²`.",
      "",
      "Taking a square root and comparing decimals invites rounding: MySQL keeps only four extra decimal places in a division, so a value near the boundary could flip. Squaring both sides of `|x − mean| > 2·sd` gives `(x − mean)² > 4·sd²`, and multiplying by `n²` clears every fraction: `(n·x − sx)² > 4·(n·sxx − sx²)`. Everything left is integer arithmetic, so the test is exact on any engine, and the strict `>` leaves a value at exactly two standard deviations unflagged. The sign of `n·x − sx` gives the direction.",
      "",
      "The statistics must use exactly the rows being judged, so the October filter and the NULL filter go inside the aggregate (`COUNT(wh_per_km)` would also skip NULLs, but `COUNT(*)` would not). The solution aggregates per model and joins the statistics back; the alternative carries the same three sums onto every row with window functions and compares with `POW`. Note that with very few scooters no value can be an outlier: with `n` values none can lie more than `√(n − 1)` standard deviations out, so a model needs at least six scooters for the rule to fire.",
    ].join("\n"),
  },

  {
    slug: "ola-busiest-hour-at-each-hypercharger",
    title: "Ola: Busiest Hour of the Day at Each Hypercharger",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "To schedule technicians outside the rush, the charging-network team needs each station's busiest hour of the day.",
      "",
      "For every station with at least one session, find the hour of the day (0 to 23, from `started_at`) in which the **most sessions started**, over all dates together. If several hours tie, take the **earliest** hour. Return `station_name`, `busiest_hour` and `sessions` (the number of sessions that started in that hour), ordered by `station_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Hypercharger",
        columns: [
          { name: "station_id", type: "int" },
          { name: "station_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["station_id"],
        note: "One row per station; names are unique.",
      },
      {
        name: "ChargeSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "station_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "kwh", type: "decimal" },
        ],
        primaryKey: ["session_id"],
        note: "One row per session; `station_id` always names a station.",
      },
    ],
    examples: [
      {
        Hypercharger: [
          [1, "HC Koramangala", "Bengaluru"],
          [2, "HC Baner", "Pune"],
          [3, "HC Saket", "Delhi"],
        ],
        ChargeSession: [
          [1, 1, "2024-07-01 08:05:00", 2.0],
          [2, 1, "2024-07-01 08:40:00", 1.5],
          [3, 1, "2024-07-02 19:10:00", 2.2],
          [4, 1, "2024-07-03 08:59:59", 1.1],
          [5, 2, "2024-07-01 19:00:00", 3.0],
          [6, 2, "2024-07-02 09:30:00", 2.4],
          [7, 2, "2024-07-03 19:45:00", 1.9],
          [8, 2, "2024-07-04 09:05:00", 2.6],
        ],
      },
    ],
    gen: (rng) => {
      const stations: Cell[][] = sample(rng, STATIONS, ri(rng, 1, 5)).map(([name, city], i) => [i + 1, name, city]);
      const hours = sample(rng, [6, 7, 8, 9, 13, 18, 19, 21, 23], ri(rng, 2, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 24);
      const sessions: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, stations.length),
        atSec(dateBetween(rng, "2024-07-01", "2024-07-07"), pick(rng, hours) * 3600 + ri(rng, 0, 3599)),
        roundTo(rng, 5, 40, 1) / 10,
      ]);
      return { Hypercharger: stations, ChargeSession: sessions };
    },
    solution: [
      "WITH per_hour AS (",
      "  SELECT station_id, HOUR(started_at) AS hr, COUNT(*) AS sessions",
      "  FROM ChargeSession",
      "  GROUP BY station_id, HOUR(started_at)",
      "), ranked AS (",
      "  SELECT station_id, hr, sessions,",
      "         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY sessions DESC, hr) AS rn",
      "  FROM per_hour",
      ")",
      "SELECT h.station_name, r.hr AS busiest_hour, r.sessions",
      "FROM ranked r",
      "JOIN Hypercharger h ON h.station_id = r.station_id",
      "WHERE r.rn = 1",
      "ORDER BY h.station_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH per_hour AS (SELECT station_id, HOUR(started_at) AS hr, COUNT(*) AS sessions FROM ChargeSession GROUP BY station_id, HOUR(started_at))",
        "SELECT h.station_name, p.hr AS busiest_hour, p.sessions",
        "FROM per_hour p JOIN Hypercharger h ON h.station_id = p.station_id",
        "WHERE NOT EXISTS (SELECT 1 FROM per_hour q WHERE q.station_id = p.station_id AND (q.sessions > p.sessions OR (q.sessions = p.sessions AND q.hr < p.hr)))",
        "ORDER BY h.station_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First count sessions per station and hour: `GROUP BY station_id, HOUR(started_at)`.",
      "Then pick one row per station — rank the hours by count descending and hour ascending.",
      "`ROW_NUMBER` (not `RANK`) guarantees a single winner once the tie-break is in the ORDER BY.",
    ],
    editorial: [
      "This is a \"top one per group\" question on top of an aggregation. The first step folds all dates together and counts sessions per station and hour of the day: `HOUR(started_at)` extracts 0–23, and grouping by it gives one row per station-hour.",
      "",
      "The second step picks the best hour inside each station. `ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY sessions DESC, hr)` numbers the hours from busiest to quietest, and among hours with equal counts the earlier one comes first, so row 1 is exactly the requested hour. A station with no sessions has no rows in `ChargeSession`, so it never appears. The station name is joined on at the end.",
      "",
      "The alternative keeps an hour when no other hour of the same station beats it — more sessions, or the same number at an earlier hour — using `NOT EXISTS` over the same CTE. It needs no window function but compares every pair of hours within a station, which is still tiny here (at most 24 per station).",
    ].join("\n"),
  },

  {
    slug: "ola-test-rides-converted-to-purchases",
    title: "Ola: Test Riders Who Bought Within 30 Days, per Centre",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "The retail team at Ola measures how well each experience centre turns test rides into scooter orders.",
      "",
      "For every centre with at least one **completed** test ride, return `centre_name`, `test_riders` — the number of **different customers** who completed a test ride there — and `converted`, how many of those customers placed a **confirmed** order from **the day of** such a test ride **up to 30 days after it** (both ends included). A customer counts once per centre however many rides or orders they have; a cancelled order or one outside the window does not convert. Order the rows by `converted` from highest to lowest, then by `centre_name`.",
    ].join("\n"),
    tables: [
      {
        name: "ExperienceCentre",
        columns: [
          { name: "centre_id", type: "int" },
          { name: "centre_name", type: "varchar" },
        ],
        primaryKey: ["centre_id"],
        note: "One row per centre; names are unique.",
      },
      {
        name: "TestRide",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "centre_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ride_date", type: "date" },
          { name: "outcome", type: "enum", values: ["completed", "no_show"] },
        ],
        primaryKey: ["ride_id"],
        note: "One row per booked test ride.",
      },
      {
        name: "ScooterOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per scooter order, wherever it was placed.",
      },
    ],
    examples: [
      {
        ExperienceCentre: [
          [1, "EC Indiranagar"],
          [2, "EC Kothrud"],
          [3, "EC Powai"],
        ],
        TestRide: [
          [1, 1, 501, "2024-05-01", "completed"],
          [2, 1, 502, "2024-05-03", "completed"],
          [3, 1, 501, "2024-05-10", "completed"],
          [4, 2, 503, "2024-05-04", "completed"],
          [5, 2, 504, "2024-05-04", "no_show"],
          [6, 3, 505, "2024-05-06", "no_show"],
          [7, 2, 506, "2024-05-20", "completed"],
        ],
        ScooterOrder: [
          [11, 501, "2024-05-31", "confirmed"],
          [12, 502, "2024-06-03", "confirmed"],
          [13, 503, "2024-05-04", "confirmed"],
          [14, 504, "2024-05-05", "confirmed"],
          [15, 506, "2024-05-25", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const centres: Cell[][] = sample(rng, CENTRES, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      const rides: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, centres.length),
        ri(rng, 501, 510),
        dateBetween(rng, "2024-05-01", "2024-05-31"),
        chance(rng, 0.75) ? "completed" : "no_show",
      ]);
      const orders: Cell[][] = [];
      let oid = 11;
      for (const r of rides) {
        if (!chance(rng, 0.55)) continue;
        orders.push([oid++, r[2]!, addDays(r[3] as string, pick(rng, [-3, -1, 0, 5, 12, 30, 31, 45])), chance(rng, 0.8) ? "confirmed" : "cancelled"]);
      }
      return { ExperienceCentre: centres, TestRide: rides, ScooterOrder: shuffle(rng, orders) };
    },
    solution: [
      "SELECT c.centre_name,",
      "       COUNT(DISTINCT t.customer_id) AS test_riders,",
      "       COUNT(DISTINCT o.customer_id) AS converted",
      "FROM ExperienceCentre c",
      "JOIN TestRide t ON t.centre_id = c.centre_id AND t.outcome = 'completed'",
      "LEFT JOIN ScooterOrder o ON o.customer_id = t.customer_id",
      " AND o.status = 'confirmed'",
      " AND o.ordered_on BETWEEN t.ride_date AND DATE_ADD(t.ride_date, INTERVAL 30 DAY)",
      "GROUP BY c.centre_id, c.centre_name",
      "ORDER BY converted DESC, c.centre_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.centre_name, COUNT(DISTINCT t.customer_id) AS test_riders,",
        "       COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM ScooterOrder o WHERE o.customer_id = t.customer_id AND o.status = 'confirmed'",
        "                                          AND DATEDIFF(o.ordered_on, t.ride_date) BETWEEN 0 AND 30) THEN t.customer_id END) AS converted",
        "FROM ExperienceCentre c JOIN TestRide t ON t.centre_id = c.centre_id",
        "WHERE t.outcome = 'completed'",
        "GROUP BY c.centre_id, c.centre_name",
        "ORDER BY converted DESC, c.centre_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Count people, not rides: `COUNT(DISTINCT customer_id)`.",
      "Attach orders with a LEFT JOIN whose `ON` holds the whole conversion rule — same customer, confirmed, inside the window.",
      "An order matched to two rides of the same customer must still count once — DISTINCT handles that too.",
    ],
    editorial: [
      "Two counts come from the same set of completed test rides per centre, so the query groups by centre after joining. `test_riders` is `COUNT(DISTINCT t.customer_id)`: a customer who rode twice at one centre is one test rider.",
      "",
      "For `converted`, every completed ride is matched to the orders that would convert it — same customer, status confirmed, `ordered_on` between the ride date and 30 days later — with a `LEFT JOIN` so rides without such an order stay in the group. The matched rows carry the customer id in `o.customer_id`, unmatched ones carry NULL, so `COUNT(DISTINCT o.customer_id)` counts converted customers once each and ignores the NULLs. Putting the rule in `ON` rather than `WHERE` is what keeps unconverted riders in `test_riders`.",
      "",
      "The window is inclusive at both ends: an order on the ride day counts, and so does one exactly 30 days later; an order placed before the ride does not. The alternative tests each ride with `EXISTS` and counts the customers for which it holds. A no-show ride never qualifies a customer, and a centre with only no-shows has no group at all.",
    ].join("\n"),
  },

  {
    slug: "ola-rentals-bill-with-extra-km-and-time",
    title: "Ola: Rentals Bill With Extra Kilometres and Minutes",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Dates", "Joins"],
    description: [
      "An hourly rental includes a fixed number of minutes and kilometres; anything beyond is charged per extra kilometre and per extra minute. The Rentals billing team recomputes each finished trip's bill to audit the invoices.",
      "",
      "For every **finished** trip (`ended_at` is not NULL), return `trip_id`, `extra_km`, `extra_minutes` and `total_fare`. The trip's minutes are the **whole minutes** from `started_at` to `ended_at` (a partial minute is not charged). `extra_km` and `extra_minutes` are how far the trip went over the package's allowance, or 0 when it stayed within it. `total_fare` = `base_fare` + `extra_km` × `per_extra_km` + `extra_minutes` × `per_extra_min`. Order the rows by `trip_id`.",
    ].join("\n"),
    tables: [
      {
        name: "RentalPackage",
        columns: [
          { name: "package_id", type: "int" },
          { name: "package_name", type: "varchar" },
          { name: "included_minutes", type: "int" },
          { name: "included_km", type: "int" },
          { name: "base_fare", type: "int" },
          { name: "per_extra_km", type: "int" },
          { name: "per_extra_min", type: "int" },
        ],
        primaryKey: ["package_id"],
        note: "One row per package; all money in rupees.",
      },
      {
        name: "RentalTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "package_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
          { name: "km_driven", type: "int" },
        ],
        primaryKey: ["trip_id"],
        note: "`ended_at` is NULL while the trip is still running.",
      },
    ],
    examples: [
      {
        RentalPackage: [
          [1, "1 hr 10 km", 60, 10, 249, 14, 2],
          [2, "4 hr 40 km", 240, 40, 849, 13, 2],
        ],
        RentalTrip: [
          [101, 1, "2024-08-05 10:00:00", "2024-08-05 10:59:59", 10],
          [102, 1, "2024-08-05 11:00:00", "2024-08-05 12:15:30", 14],
          [103, 2, "2024-08-05 09:00:00", "2024-08-05 12:30:00", 52],
          [104, 2, "2024-08-05 13:00:00", null, 20],
          [105, 2, "2024-08-05 22:00:00", "2024-08-06 02:10:00", 38],
        ],
      },
    ],
    gen: (rng) => {
      const defs = [
        ["1 hr 10 km", 60, 10, 249, 14, 2],
        ["2 hr 20 km", 120, 20, 449, 14, 2],
        ["4 hr 40 km", 240, 40, 849, 13, 2],
        ["8 hr 80 km", 480, 80, 1649, 12, 2],
      ] as const;
      const packages: Cell[][] = sample(rng, defs, ri(rng, 1, 3)).map((d, i) => [i + 1, ...d]);
      const n = ri(rng, 1, 14);
      const trips: Cell[][] = seq(101, n).map((id) => {
        const pkg = ri(rng, 1, packages.length);
        const incMin = packages[pkg - 1]![2] as number;
        const incKm = packages[pkg - 1]![3] as number;
        const start = ri(rng, 6 * 3600, 22 * 3600);
        const secs = chance(rng, 0.3) ? incMin * 60 + pick(rng, [-1, 0, 59, 60, 61]) : ri(rng, incMin * 30, incMin * 90);
        const day = dateBetween(rng, "2024-08-01", "2024-08-10");
        return [id, pkg, atSec(day, start), chance(rng, 0.1) ? null : atSec(day, start + secs), chance(rng, 0.3) ? incKm + pick(rng, [-1, 0, 1]) : ri(rng, Math.floor(incKm / 2), incKm * 2)];
      });
      return { RentalPackage: packages, RentalTrip: trips };
    },
    solution: [
      "WITH t AS (",
      "  SELECT r.trip_id, p.base_fare, p.per_extra_km, p.per_extra_min,",
      "         GREATEST(r.km_driven - p.included_km, 0) AS extra_km,",
      "         GREATEST(TIMESTAMPDIFF(MINUTE, r.started_at, r.ended_at) - p.included_minutes, 0) AS extra_minutes",
      "  FROM RentalTrip r",
      "  JOIN RentalPackage p ON p.package_id = r.package_id",
      "  WHERE r.ended_at IS NOT NULL",
      ")",
      "SELECT trip_id, extra_km, extra_minutes,",
      "       base_fare + extra_km * per_extra_km + extra_minutes * per_extra_min AS total_fare",
      "FROM t",
      "ORDER BY trip_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.trip_id,",
        "       CASE WHEN r.km_driven > p.included_km THEN r.km_driven - p.included_km ELSE 0 END AS extra_km,",
        "       CASE WHEN TIMESTAMPDIFF(SECOND, r.started_at, r.ended_at) DIV 60 > p.included_minutes",
        "            THEN TIMESTAMPDIFF(SECOND, r.started_at, r.ended_at) DIV 60 - p.included_minutes ELSE 0 END AS extra_minutes,",
        "       p.base_fare",
        "         + (CASE WHEN r.km_driven > p.included_km THEN r.km_driven - p.included_km ELSE 0 END) * p.per_extra_km",
        "         + (CASE WHEN TIMESTAMPDIFF(SECOND, r.started_at, r.ended_at) DIV 60 > p.included_minutes",
        "                 THEN TIMESTAMPDIFF(SECOND, r.started_at, r.ended_at) DIV 60 - p.included_minutes ELSE 0 END) * p.per_extra_min AS total_fare",
        "FROM RentalTrip r JOIN RentalPackage p ON p.package_id = r.package_id",
        "WHERE r.ended_at IS NOT NULL",
        "ORDER BY r.trip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` already drops a partial minute.",
      "\"Over the allowance, or 0\" is `GREATEST(used - included, 0)`.",
      "Compute the two extras once in a CTE and build the fare from them, so the arithmetic is not repeated.",
    ],
    editorial: [
      "Each trip is billed from its own row plus its package's row, so the query joins `RentalTrip` to `RentalPackage` and drops trips still running (`ended_at IS NULL`).",
      "",
      "The overage on each meter is \"used minus included, but never below zero\". `GREATEST(x, 0)` expresses that floor directly. For time, `TIMESTAMPDIFF(MINUTE, started_at, ended_at)` returns whole minutes and truncates the rest, so a trip of 59 minutes 59 seconds is 59 minutes, and one that ends exactly at the allowance is 0 minutes over. Trips that cross midnight are fine because the difference is taken on full timestamps. Computing `extra_km` and `extra_minutes` once in a CTE lets the outer query build `total_fare` from the named values, which keeps the formula readable and the three columns consistent.",
      "",
      "The alternative writes the floor as `CASE WHEN used > included THEN used - included ELSE 0 END` and derives whole minutes from seconds with `DIV 60`, repeating the expressions inline. Both are a single pass over the trips with a primary-key lookup of the package.",
    ].join("\n"),
  },

  {
    slug: "ola-new-riders-second-ride-within-a-week",
    title: "Ola: New Riders Who Took a Second Ride Within 7 Days",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "The growth team at Ola calls a new rider **activated** when their second completed ride comes soon after their first.",
      "",
      "Consider riders whose **first completed ride ever** was in **June 2024**. For each, return `rider_id`, `first_ride_on` and `second_ride_on` — the calendar dates of their first and second completed rides (NULL if there is no second yet) — and `activated`: 1 if the second ride's date is **at most 7 days** after the first ride's date (`DATEDIFF` ≤ 7, so the same day counts), otherwise 0. Cancelled rides are ignored throughout. Order the rows by `rider_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Ride",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["ride_id"],
        note: "One row per ride request. A rider never has two requests at the same second.",
      },
    ],
    examples: [
      {
        Ride: [
          [1, 51, "2024-05-30 09:00:00", "completed"],
          [2, 51, "2024-06-02 10:00:00", "completed"],
          [3, 52, "2024-06-03 08:30:00", "completed"],
          [4, 52, "2024-06-10 22:15:00", "completed"],
          [5, 53, "2024-06-05 07:00:00", "cancelled"],
          [6, 53, "2024-06-06 07:10:00", "completed"],
          [7, 53, "2024-06-14 18:00:00", "completed"],
          [8, 54, "2024-06-30 23:50:00", "completed"],
          [9, 55, "2024-06-12 12:00:00", "completed"],
          [10, 55, "2024-06-12 19:00:00", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const riders = ri(rng, 2, 8);
      for (let r = 0; r < riders; r++) {
        let t = Date.parse(`${dateBetween(rng, "2024-05-26", "2024-07-02")}T00:00:00Z`) / 1000 + ri(rng, 6 * 3600, 23 * 3600);
        const k = ri(rng, 1, 4);
        for (let i = 0; i < k; i++) {
          const d = new Date(t * 1000).toISOString();
          rows.push([0, 51 + r, `${d.slice(0, 10)} ${d.slice(11, 19)}`, chance(rng, 0.8) ? "completed" : "cancelled"]);
          t += pick(rng, [0, 1, 3, 6, 7, 8, 12]) * 86400 + ri(rng, 600, 30000);
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { Ride: rows };
    },
    solution: [
      "WITH r AS (",
      "  SELECT rider_id, requested_at,",
      "         ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY requested_at) AS n",
      "  FROM Ride",
      "  WHERE status = 'completed'",
      "), first_ride AS (",
      "  SELECT rider_id, requested_at AS first_at FROM r",
      "  WHERE n = 1 AND requested_at >= '2024-06-01' AND requested_at < '2024-07-01'",
      "), second_ride AS (",
      "  SELECT rider_id, requested_at AS second_at FROM r WHERE n = 2",
      ")",
      "SELECT f.rider_id,",
      "       CAST(f.first_at AS DATE) AS first_ride_on,",
      "       CAST(s.second_at AS DATE) AS second_ride_on,",
      "       CASE WHEN DATEDIFF(s.second_at, f.first_at) <= 7 THEN 1 ELSE 0 END AS activated",
      "FROM first_ride f",
      "LEFT JOIN second_ride s ON s.rider_id = f.rider_id",
      "ORDER BY f.rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH r AS (",
        "  SELECT rider_id, requested_at,",
        "         LEAD(requested_at) OVER (PARTITION BY rider_id ORDER BY requested_at) AS next_at,",
        "         ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY requested_at) AS n",
        "  FROM Ride WHERE status = 'completed'",
        ")",
        "SELECT rider_id, CAST(requested_at AS DATE) AS first_ride_on, CAST(next_at AS DATE) AS second_ride_on,",
        "       IF(next_at IS NOT NULL AND DATEDIFF(next_at, requested_at) <= 7, 1, 0) AS activated",
        "FROM r",
        "WHERE n = 1 AND YEAR(requested_at) = 2024 AND MONTH(requested_at) = 6",
        "ORDER BY rider_id",
      ].join("\n"),
      [
        "SELECT f.rider_id, CAST(f.first_at AS DATE) AS first_ride_on, CAST(f.second_at AS DATE) AS second_ride_on,",
        "       CASE WHEN f.second_at IS NOT NULL AND DATEDIFF(f.second_at, f.first_at) <= 7 THEN 1 ELSE 0 END AS activated",
        "FROM (",
        "  SELECT a.rider_id, a.first_at,",
        "         (SELECT MIN(x.requested_at) FROM Ride x WHERE x.rider_id = a.rider_id AND x.status = 'completed' AND x.requested_at > a.first_at) AS second_at",
        "  FROM (SELECT rider_id, MIN(requested_at) AS first_at FROM Ride WHERE status = 'completed' GROUP BY rider_id) a",
        "  WHERE a.first_at >= '2024-06-01' AND a.first_at < '2024-07-01'",
        ") f",
        "ORDER BY f.rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each rider's completed rides in time order; ride 1 and ride 2 are what you need.",
      "Filter the June condition on ride 1 *after* numbering — a rider whose first ride was in May is not new in June.",
      "A rider with no second ride still appears: join the second ride with a LEFT JOIN, and a NULL date gives 0.",
    ],
    editorial: [
      "The cohort is defined by a rider's **first** completed ride, so cancelled rides are removed first and the rest are numbered per rider with `ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY requested_at)`. Ride 1 is the first completed ride ever; only after numbering may the query keep the riders whose ride 1 is in June. Filtering June first would make a May rider's June ride look like a first ride.",
      "",
      "Ride 2, when it exists, is attached with a `LEFT JOIN` so riders with a single ride stay in the answer with a NULL `second_ride_on`. `DATEDIFF` compares calendar dates and ignores the time of day, so a second ride later the same day is 0 days and a ride on the seventh day is 7 — both activated. With no second ride, `DATEDIFF` is NULL, the `CASE` falls to `ELSE`, and `activated` is 0. `CAST(… AS DATE)` turns the timestamps into the dates the output asks for.",
      "",
      "The alternatives read ride 2 with `LEAD` on the same window, or find the first ride with `MIN` and the second with a correlated `MIN` over later completed rides. All are one or two passes over each rider's rides.",
    ].join("\n"),
  },

  {
    slug: "ola-wallet-cashback-not-fully-credited",
    title: "Ola: Wallet Cashback That Was Not Fully Credited",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "In August 2024 a promotion promised **10% cashback, capped at ₹50**, on every ride paid with the in-app wallet. Support tickets say some cashback never arrived, so the payments team reconciles what was due against what was credited.",
      "",
      "A payment qualifies when its `method` is `ola_money` and `paid_at` is in August 2024. Its cashback due is `amount DIV 10` (whole rupees, rounded down), but **never more than 50**. Credits may arrive in several parts. Return every qualifying payment whose credited total is **less than** what was due, with `payment_id`, `user_id`, `due`, `credited` (0 when nothing arrived) and `shortfall` (`due − credited`), ordered by `payment_id`.",
    ].join("\n"),
    tables: [
      {
        name: "RidePayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "method", type: "enum", values: ["ola_money", "upi", "cash", "card"] },
          { name: "amount", type: "int" },
          { name: "paid_at", type: "datetime" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per ride payment, in whole rupees.",
      },
      {
        name: "CashbackCredit",
        columns: [
          { name: "credit_id", type: "int" },
          { name: "payment_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "credited_at", type: "datetime" },
        ],
        primaryKey: ["credit_id"],
        note: "One row per cashback credit; a payment can have zero, one or several.",
      },
    ],
    examples: [
      {
        RidePayment: [
          [1, 31, "ola_money", 240, "2024-08-03 09:00:00"],
          [2, 31, "ola_money", 760, "2024-08-04 18:30:00"],
          [3, 32, "upi", 300, "2024-08-05 10:00:00"],
          [4, 33, "ola_money", 199, "2024-08-31 23:59:00"],
          [5, 33, "ola_money", 450, "2024-09-01 00:05:00"],
          [6, 34, "ola_money", 8, "2024-08-10 12:00:00"],
          [7, 34, "ola_money", 505, "2024-08-11 12:00:00"],
        ],
        CashbackCredit: [
          [1, 1, 24, "2024-08-03 09:05:00"],
          [2, 2, 30, "2024-08-04 18:35:00"],
          [3, 2, 10, "2024-08-06 08:00:00"],
          [4, 7, 50, "2024-08-11 12:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 16);
      const pays: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 31, 38),
        pick(rng, ["ola_money", "ola_money", "ola_money", "upi", "cash", "card"]),
        chance(rng, 0.3) ? pick(rng, [9, 10, 499, 500, 501, 509, 510]) : ri(rng, 40, 900),
        chance(rng, 0.2)
          ? pick(rng, ["2024-07-31 23:59:59", "2024-08-01 00:00:00", "2024-08-31 23:59:59", "2024-09-01 00:00:00"])
          : atSec(dateBetween(rng, "2024-07-28", "2024-09-03"), ri(rng, 0, 86399)),
      ]);
      const credits: Cell[][] = [];
      let cid = 1;
      for (const p of pays) {
        const due = Math.min(Math.floor((p[3] as number) / 10), 50);
        const plan = pick(rng, ["full", "full", "none", "short", "split", "split_short", "over"]);
        const at = `${(p[4] as string).slice(0, 10)} 23:59:59`;
        if (plan === "full" && due > 0) credits.push([cid++, p[0]!, due, at]);
        else if (plan === "short" && due > 1) credits.push([cid++, p[0]!, due - ri(rng, 1, Math.min(due - 1, 20)), at]);
        else if (plan === "split" && due > 1) {
          const a = ri(rng, 1, due - 1);
          credits.push([cid++, p[0]!, a, at], [cid++, p[0]!, due - a, at]);
        } else if (plan === "split_short" && due > 2) {
          credits.push([cid++, p[0]!, 1, at], [cid++, p[0]!, 1, at]);
        } else if (plan === "over") credits.push([cid++, p[0]!, due + 5, at]);
      }
      return { RidePayment: pays, CashbackCredit: shuffle(rng, credits) };
    },
    solution: [
      "SELECT p.payment_id, p.user_id,",
      "       LEAST(p.amount DIV 10, 50) AS due,",
      "       COALESCE(SUM(c.amount), 0) AS credited,",
      "       LEAST(p.amount DIV 10, 50) - COALESCE(SUM(c.amount), 0) AS shortfall",
      "FROM RidePayment p",
      "LEFT JOIN CashbackCredit c ON c.payment_id = p.payment_id",
      "WHERE p.method = 'ola_money'",
      "  AND p.paid_at >= '2024-08-01' AND p.paid_at < '2024-09-01'",
      "GROUP BY p.payment_id, p.user_id, p.amount",
      "HAVING COALESCE(SUM(c.amount), 0) < LEAST(p.amount DIV 10, 50)",
      "ORDER BY p.payment_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH paid AS (SELECT payment_id, SUM(amount) AS credited FROM CashbackCredit GROUP BY payment_id),",
        "due AS (",
        "  SELECT payment_id, user_id, CASE WHEN FLOOR(amount / 10) > 50 THEN 50 ELSE FLOOR(amount / 10) END AS due",
        "  FROM RidePayment",
        "  WHERE method = 'ola_money' AND DATE_FORMAT(paid_at, '%Y-%m') = '2024-08'",
        ")",
        "SELECT d.payment_id, d.user_id, d.due, IFNULL(p.credited, 0) AS credited, d.due - IFNULL(p.credited, 0) AS shortfall",
        "FROM due d LEFT JOIN paid p ON p.payment_id = d.payment_id",
        "WHERE IFNULL(p.credited, 0) < d.due",
        "ORDER BY d.payment_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work out the due amount per payment first: `LEAST(amount DIV 10, 50)`.",
      "A payment with no credit must still be compared — LEFT JOIN the credits and treat a missing sum as 0.",
      "Several credit rows belong to one payment, so add them up before comparing with what was due.",
    ],
    editorial: [
      "Reconciliation compares two numbers per payment: what the rule says was due and what actually arrived. The due amount comes from the payment row alone — `amount DIV 10` is 10% rounded down to whole rupees, and `LEAST(…, 50)` applies the cap. The credited amount is a sum over however many credit rows the payment has.",
      "",
      "Joining credits with a `LEFT JOIN` keeps payments that received nothing; for them `SUM(c.amount)` is NULL, so `COALESCE(…, 0)` turns it into 0 both for the output and for the comparison in `HAVING`. The filter on method and month is on the payment and goes in `WHERE`, before grouping; the shortfall test needs the sum and goes in `HAVING`. A payment under ₹10 has 0 due and can never be short, and an over-credited payment is not short either.",
      "",
      "Summing credits after a join is safe here because each payment row joins only its own credits. The alternative sums the credits in their own CTE first, computes due with `FLOOR` and a `CASE` cap, and joins the two — the pattern to prefer when more than one child table would be joined, since summing after joining two child tables multiplies rows.",
    ].join("\n"),
  },

  {
    slug: "ola-driver-partners-ready-to-go-live",
    title: "Ola: Driver-Partners Cleared on All Four Documents",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Subqueries"],
    description: [
      "A new driver-partner can start taking rides only when four documents are verified: `driving_licence`, `vehicle_rc`, `insurance` and `police_verification`. A document may be reviewed several times (re-uploads after a rejection), and **only its latest review counts**.",
      "",
      "Return every applicant whose latest review of **each of the four** documents is `approved`, with `driver_id`, `full_name` and `cleared_at` — the time of the latest of those reviews, when the last document was cleared. An applicant missing any review, or whose latest review of any document is a rejection, is not returned. Order the rows by `cleared_at`, then `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DriverApplicant",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "applied_on", type: "date" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per person who applied to drive.",
      },
      {
        name: "DocumentReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "doc_type", type: "enum", values: ["driving_licence", "vehicle_rc", "insurance", "police_verification"] },
          { name: "verdict", type: "enum", values: ["approved", "rejected"] },
          { name: "reviewed_at", type: "datetime" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review. Two reviews of the same driver's same document never share a `reviewed_at`.",
      },
    ],
    examples: [
      {
        DriverApplicant: [
          [1, "Ramesh Gowda", "Bengaluru", "2024-04-01"],
          [2, "Sunil Jadhav", "Pune", "2024-04-02"],
          [3, "Ajay Verma", "Delhi", "2024-04-02"],
          [4, "Kiran Naidu", "Hyderabad", "2024-04-03"],
        ],
        DocumentReview: [
          [1, 1, "driving_licence", "approved", "2024-04-02 10:00:00"],
          [2, 1, "vehicle_rc", "rejected", "2024-04-02 10:05:00"],
          [3, 1, "insurance", "approved", "2024-04-02 10:10:00"],
          [4, 1, "police_verification", "approved", "2024-04-05 16:00:00"],
          [5, 1, "vehicle_rc", "approved", "2024-04-06 11:00:00"],
          [6, 2, "driving_licence", "approved", "2024-04-03 09:00:00"],
          [7, 2, "vehicle_rc", "approved", "2024-04-03 09:10:00"],
          [8, 2, "insurance", "approved", "2024-04-03 09:20:00"],
          [9, 3, "driving_licence", "approved", "2024-04-03 12:00:00"],
          [10, 3, "vehicle_rc", "approved", "2024-04-03 12:10:00"],
          [11, 3, "insurance", "approved", "2024-04-03 12:20:00"],
          [12, 3, "police_verification", "approved", "2024-04-04 08:00:00"],
          [13, 3, "insurance", "rejected", "2024-04-05 08:00:00"],
          [14, 4, "driving_licence", "approved", "2024-04-04 10:00:00"],
          [15, 4, "vehicle_rc", "approved", "2024-04-04 10:30:00"],
          [16, 4, "insurance", "approved", "2024-04-04 11:00:00"],
          [17, 4, "police_verification", "approved", "2024-04-05 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const people = names(rng, n);
      const applicants: Cell[][] = people.map((p, i) => [i + 1, `${p} ${pick(rng, ["Gowda", "Jadhav", "Verma", "Naidu", "Pillai", "Mishra"])}`, pick(rng, OLA_CITIES), dateBetween(rng, "2024-04-01", "2024-04-10")]);
      const reviews: Cell[][] = [];
      for (const a of applicants) {
        const allGood = chance(rng, 0.5);
        for (const doc of ["driving_licence", "vehicle_rc", "insurance", "police_verification"]) {
          if (!allGood && chance(rng, 0.15)) continue;
          const k = ri(rng, 1, 3);
          const offsets = sample(rng, seq(0, 40), k).sort((x, y) => x - y);
          offsets.forEach((o, i) => {
            const last = i === k - 1;
            const verdict = last ? (allGood || chance(rng, 0.7) ? "approved" : "rejected") : pick(rng, ["approved", "rejected", "rejected"]);
            // Whole hours from 2024-04-10 00:00, so two drivers can clear at the same moment.
            reviews.push([0, a[0]!, doc, verdict, atMin("2024-04-10", o * 60)]);
          });
        }
      }
      const ids = shuffle(rng, seq(1, reviews.length));
      reviews.forEach((r, i) => (r[0] = ids[i]!));
      return { DriverApplicant: applicants, DocumentReview: reviews };
    },
    solution: [
      "WITH latest AS (",
      "  SELECT driver_id, doc_type, verdict, reviewed_at,",
      "         ROW_NUMBER() OVER (PARTITION BY driver_id, doc_type ORDER BY reviewed_at DESC) AS rn",
      "  FROM DocumentReview",
      ")",
      "SELECT a.driver_id, a.full_name, MAX(l.reviewed_at) AS cleared_at",
      "FROM DriverApplicant a",
      "JOIN latest l ON l.driver_id = a.driver_id AND l.rn = 1",
      "GROUP BY a.driver_id, a.full_name",
      "HAVING COUNT(*) = 4 AND SUM(CASE WHEN l.verdict = 'approved' THEN 1 ELSE 0 END) = 4",
      "ORDER BY cleared_at, a.driver_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.driver_id, a.full_name,",
        "       (SELECT MAX(r.reviewed_at) FROM DocumentReview r WHERE r.driver_id = a.driver_id) AS cleared_at",
        "FROM DriverApplicant a",
        "WHERE 4 = (",
        "  SELECT COUNT(*) FROM DocumentReview r",
        "  WHERE r.driver_id = a.driver_id AND r.verdict = 'approved'",
        "    AND NOT EXISTS (SELECT 1 FROM DocumentReview r2",
        "                    WHERE r2.driver_id = r.driver_id AND r2.doc_type = r.doc_type AND r2.reviewed_at > r.reviewed_at)",
        ")",
        "ORDER BY cleared_at, a.driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the reviews to the latest one per driver and document.",
      "A driver is cleared when exactly four latest reviews exist and all four are approvals.",
      "The moment the driver was cleared is the latest of those four reviews — which is also the driver's latest review overall.",
    ],
    editorial: [
      "Two ideas combine here: **latest row per group** and **all of a set** (relational division). The first is a `ROW_NUMBER()` partitioned by driver and document, newest first; `rn = 1` keeps the review that currently stands for each document. A rejection followed by an approval leaves the approval; an approval followed by a rejection leaves the rejection.",
      "",
      "Then each applicant's standing reviews are grouped. The applicant is cleared only when there are **four** of them (no document missing) and **four** are approvals. Counting both conditions in `HAVING` handles a missing document and a standing rejection in one place. `cleared_at` is the `MAX` of the four review times — the moment the last document passed — and since those are the latest review of each document, it is also the driver's latest review of any kind, which the alternative uses.",
      "",
      "The alternative finds approved reviews that no later review of the same document overrides (`NOT EXISTS` with a later `reviewed_at`) and requires four of them. It needs no window function but runs a correlated check per review. Ties in `cleared_at` are broken by `driver_id`.",
    ].join("\n"),
  },

  {
    slug: "ola-ota-update-adoption-in-the-first-week",
    title: "Ola: OTA Update Adoption in Its First Week, by City",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "When the software team pushes over-the-air release `4.0.0`, it tracks how quickly scooters in each city take it.",
      "",
      "For every city that has scooters, return `city`, `fleet` (its scooters), `within_week` — scooters whose **first** install of release `4.0.0` happened **before 7 days had passed** since its `released_on` date (released on 2024-09-02 means installed before `2024-09-09 00:00:00`) — and `not_installed`, scooters with no install of `4.0.0` at all. Installs of other releases do not count, and a scooter that retried the same install is still one scooter. Order the rows by `city`.",
    ].join("\n"),
    tables: [
      {
        name: "Scooter",
        columns: [
          { name: "scooter_id", type: "int" },
          { name: "model", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["scooter_id"],
        note: "One row per scooter in the fleet.",
      },
      {
        name: "OtaRelease",
        columns: [
          { name: "release_id", type: "int" },
          { name: "version", type: "varchar" },
          { name: "released_on", type: "date" },
        ],
        primaryKey: ["release_id"],
        note: "One row per release; versions are unique.",
      },
      {
        name: "OtaInstall",
        columns: [
          { name: "install_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "release_id", type: "int" },
          { name: "installed_at", type: "datetime" },
        ],
        primaryKey: ["install_id"],
        note: "One row per successful install, never before the release date; a scooter can install the same release again after a reset.",
      },
    ],
    examples: [
      {
        Scooter: [
          [1, "S1 Pro", "Bengaluru"],
          [2, "S1 Air", "Bengaluru"],
          [3, "S1 X", "Bengaluru"],
          [4, "S1 Pro", "Pune"],
          [5, "S1 Air", "Pune"],
        ],
        OtaRelease: [
          [1, "3.2.1", "2024-07-15"],
          [2, "4.0.0", "2024-09-02"],
        ],
        OtaInstall: [
          [1, 1, 2, "2024-09-02 21:00:00"],
          [2, 2, 2, "2024-09-09 00:00:00"],
          [3, 2, 2, "2024-09-12 08:00:00"],
          [4, 3, 1, "2024-07-20 10:00:00"],
          [5, 4, 2, "2024-09-08 23:59:59"],
          [6, 4, 2, "2024-09-10 09:00:00"],
          [7, 5, 1, "2024-07-18 10:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const released = dateBetween(rng, "2024-08-26", "2024-09-09");
      const releases: Cell[][] = shuffle(rng, [
        [0, "3.2.1", "2024-07-15"],
        [0, "4.0.0", released],
        [0, "4.0.1", addDays(released, 10)],
      ]);
      releases.forEach((r, i) => (r[0] = i + 1));
      const target = releases.find((r) => r[1] === "4.0.0")![0] as number;
      const other = releases.find((r) => r[1] === "3.2.1")![0] as number;
      const cities = sample(rng, OLA_CITIES, ri(rng, 1, 4));
      const n = ri(rng, 1, 14);
      const scooters: Cell[][] = seq(1, n).map((id) => [id, pick(rng, MODELS), pick(rng, cities)]);
      const installs: Cell[][] = [];
      let iid = 1;
      for (const s of scooters) {
        if (chance(rng, 0.4)) installs.push([iid++, s[0]!, other, atSec("2024-07-16", ri(rng, 0, 20 * 86400))]);
        if (chance(rng, 0.7)) {
          const sec = chance(rng, 0.25) ? 7 * 86400 + pick(rng, [-1, 0]) : ri(rng, 3600, 12 * 86400);
          installs.push([iid++, s[0]!, target, atSec(released, sec)]);
          if (chance(rng, 0.25)) installs.push([iid++, s[0]!, target, atSec(released, sec + ri(rng, 3600, 5 * 86400))]);
        }
      }
      return { Scooter: scooters, OtaRelease: releases, OtaInstall: shuffle(rng, installs) };
    },
    solution: [
      "WITH rel AS (",
      "  SELECT release_id, released_on FROM OtaRelease WHERE version = '4.0.0'",
      "), first_install AS (",
      "  SELECT i.scooter_id, MIN(i.installed_at) AS first_at",
      "  FROM OtaInstall i JOIN rel ON rel.release_id = i.release_id",
      "  GROUP BY i.scooter_id",
      ")",
      "SELECT s.city,",
      "       COUNT(*) AS fleet,",
      "       SUM(CASE WHEN f.first_at < DATE_ADD(rel.released_on, INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS within_week,",
      "       SUM(CASE WHEN f.first_at IS NULL THEN 1 ELSE 0 END) AS not_installed",
      "FROM Scooter s",
      "CROSS JOIN rel",
      "LEFT JOIN first_install f ON f.scooter_id = s.scooter_id",
      "GROUP BY s.city",
      "ORDER BY s.city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.city, COUNT(*) AS fleet,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM OtaInstall i JOIN OtaRelease r ON r.release_id = i.release_id",
        "                             WHERE i.scooter_id = s.scooter_id AND r.version = '4.0.0'",
        "                               AND TIMESTAMPDIFF(SECOND, r.released_on, i.installed_at) < 7 * 86400) THEN 1 ELSE 0 END) AS within_week,",
        "       SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM OtaInstall i JOIN OtaRelease r ON r.release_id = i.release_id",
        "                                 WHERE i.scooter_id = s.scooter_id AND r.version = '4.0.0') THEN 1 ELSE 0 END) AS not_installed",
        "FROM Scooter s",
        "GROUP BY s.city",
        "ORDER BY s.city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the installs to one row per scooter for release 4.0.0: its first install time.",
      "LEFT JOIN that to every scooter, so scooters that never installed stay with a NULL time.",
      "\"Before 7 days had passed\" is `first_at < DATE_ADD(released_on, INTERVAL 7 DAY)` — strict, because midnight on day 7 is already a week.",
    ],
    editorial: [
      "Every scooter must be counted in its city's fleet, so the query starts from `Scooter` and keeps it whole. The install history is first reduced to what matters: for release 4.0.0 only, each scooter's **first** install time (`MIN(installed_at)`). That collapses retries, so a scooter that installed twice is one scooter, and it ignores installs of other versions.",
      "",
      "A `LEFT JOIN` of that per-scooter time onto every scooter leaves NULL for scooters that never installed. Two conditional sums then count per city: `first_at` before `released_on + 7 days` counts as within the week (NULL fails the comparison and adds 0), and a NULL `first_at` counts as not installed. Comparing a datetime against the date `DATE_ADD(released_on, INTERVAL 7 DAY)` means against its midnight, so an install at 23:59:59 on day 6 is in and one at 00:00:00 on day 7 is out. Testing \"some install within the week\" gives the same answer, because the earliest install is within the week whenever any install is.",
      "",
      "The release date is read once from a one-row CTE joined with `CROSS JOIN`. The alternative tests each scooter with two `EXISTS` subqueries and measures the delay in seconds.",
    ].join("\n"),
  },

  {
    slug: "ola-riders-who-traded-up-from-auto",
    title: "Ola: Riders Whose Main Ride Moved From Auto to Cabs",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "The marketing team ran an October campaign to move auto riders into cabs, and wants the riders whose habit actually changed.",
      "",
      "Group categories into three families: `auto`, `mini`, and `prime` (`prime_sedan` and `prime_suv`). A rider's **main family** in a month is the family with the **most completed rides** that month; on a tie, the **cheaper** family wins (auto, then mini, then prime). Return every rider whose main family was `auto` in **September 2024** and **not** `auto` in **October 2024** (a rider with no completed ride in October has no main family and is not returned). Return `rider_id`, `sept_rides` and `oct_rides` (all completed rides in each month) and `oct_family`, ordered by `rider_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CabRide",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "category", type: "enum", values: ["auto", "mini", "prime_sedan", "prime_suv"] },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
          { name: "requested_at", type: "datetime" },
        ],
        primaryKey: ["ride_id"],
        note: "One row per ride request.",
      },
    ],
    examples: [
      {
        CabRide: [
          [1, 71, "auto", "completed", "2024-09-03 09:00:00"],
          [2, 71, "auto", "completed", "2024-09-10 09:00:00"],
          [3, 71, "mini", "completed", "2024-09-18 19:00:00"],
          [4, 71, "prime_sedan", "completed", "2024-10-02 09:00:00"],
          [5, 71, "prime_suv", "completed", "2024-10-09 09:00:00"],
          [6, 71, "auto", "completed", "2024-10-15 09:00:00"],
          [7, 72, "auto", "completed", "2024-09-05 08:00:00"],
          [8, 72, "mini", "completed", "2024-09-06 08:00:00"],
          [9, 72, "mini", "completed", "2024-10-01 08:00:00"],
          [10, 73, "auto", "completed", "2024-09-30 23:30:00"],
          [11, 73, "mini", "cancelled", "2024-10-04 10:00:00"],
          [12, 74, "mini", "completed", "2024-09-12 12:00:00"],
          [13, 74, "auto", "completed", "2024-10-12 12:00:00"],
          [14, 75, "auto", "completed", "2024-09-20 18:00:00"],
          [15, 75, "auto", "completed", "2024-10-20 18:00:00"],
          [16, 75, "mini", "completed", "2024-10-21 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const cats = ["auto", "mini", "prime_sedan", "prime_suv"];
      const riders = ri(rng, 2, 8);
      for (let r = 0; r < riders; r++) {
        const septFav = chance(rng, 0.8) ? "auto" : pick(rng, cats);
        const octFav = chance(rng, 0.3) ? "auto" : pick(rng, ["mini", "prime_sedan", "prime_suv"]);
        for (const [month, fav, from, to] of [["09", septFav, "2024-08-29", "2024-09-30"], ["10", octFav, "2024-10-01", "2024-11-02"]] as const) {
          void month;
          for (let k = ri(rng, 1, 5); k > 0; k--) {
            const day = chance(rng, 0.15) ? pick(rng, [from, to]) : dateBetween(rng, from, to);
            rows.push([0, 71 + r, chance(rng, 0.7) ? fav : pick(rng, cats), chance(rng, 0.85) ? "completed" : "cancelled", atSec(day, ri(rng, 0, 86399))]);
          }
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((x, i) => (x[0] = ids[i]!));
      return { CabRide: rows };
    },
    solution: [
      "WITH rides AS (",
      "  SELECT rider_id, DATE_FORMAT(requested_at, '%Y-%m') AS mon,",
      "         CASE WHEN category IN ('prime_sedan', 'prime_suv') THEN 'prime' ELSE category END AS family",
      "  FROM CabRide",
      "  WHERE status = 'completed' AND requested_at >= '2024-09-01' AND requested_at < '2024-11-01'",
      "), per_family AS (",
      "  SELECT rider_id, mon, family, COUNT(*) AS n",
      "  FROM rides",
      "  GROUP BY rider_id, mon, family",
      "), ranked AS (",
      "  SELECT rider_id, mon, family,",
      "         SUM(n) OVER (PARTITION BY rider_id, mon) AS month_rides,",
      "         ROW_NUMBER() OVER (PARTITION BY rider_id, mon",
      "                            ORDER BY n DESC, CASE family WHEN 'auto' THEN 1 WHEN 'mini' THEN 2 ELSE 3 END) AS rn",
      "  FROM per_family",
      ")",
      "SELECT s.rider_id, s.month_rides AS sept_rides, o.month_rides AS oct_rides, o.family AS oct_family",
      "FROM ranked s",
      "JOIN ranked o ON o.rider_id = s.rider_id AND o.mon = '2024-10' AND o.rn = 1",
      "WHERE s.mon = '2024-09' AND s.rn = 1 AND s.family = 'auto' AND o.family <> 'auto'",
      "ORDER BY s.rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH per_family AS (",
        "  SELECT rider_id, YEAR(requested_at) * 100 + MONTH(requested_at) AS mon,",
        "         IF(category LIKE 'prime%', 'prime', category) AS family, COUNT(*) AS n",
        "  FROM CabRide",
        "  WHERE status = 'completed' AND YEAR(requested_at) = 2024 AND MONTH(requested_at) IN (9, 10)",
        "  GROUP BY rider_id, YEAR(requested_at) * 100 + MONTH(requested_at), IF(category LIKE 'prime%', 'prime', category)",
        "), main AS (",
        "  SELECT a.rider_id, a.mon, a.family,",
        "         (SELECT SUM(t.n) FROM per_family t WHERE t.rider_id = a.rider_id AND t.mon = a.mon) AS month_rides",
        "  FROM per_family a",
        "  WHERE NOT EXISTS (SELECT 1 FROM per_family b",
        "                    WHERE b.rider_id = a.rider_id AND b.mon = a.mon",
        "                      AND (b.n > a.n OR (b.n = a.n AND b.family < a.family)))",
        ")",
        "SELECT s.rider_id, s.month_rides AS sept_rides, o.month_rides AS oct_rides, o.family AS oct_family",
        "FROM main s JOIN main o ON o.rider_id = s.rider_id AND o.mon = 202410",
        "WHERE s.mon = 202409 AND s.family = 'auto' AND o.family IN ('mini', 'prime')",
        "ORDER BY s.rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Fold the two prime categories into one family before counting anything.",
      "Count completed rides per rider, month and family; the main family is the top row of each rider-month, with the price order breaking ties.",
      "Pick the September and October winners separately and join them on `rider_id`.",
    ],
    editorial: [
      "The question compares a statistical **mode** — each rider's most-used family — across two months. First the raw categories are mapped to families (`prime_sedan` and `prime_suv` become `prime`), cancelled rides and rides outside September–October are dropped, and the rows are counted per rider, month and family.",
      "",
      "Inside each rider-month, `ROW_NUMBER()` ordered by the count descending and then by price rank (auto 1, mini 2, prime 3) puts the main family first, so a 1–1 tie between auto and mini goes to auto, as the statement requires. In the same pass `SUM(n) OVER (PARTITION BY rider_id, mon)` gives the month's total completed rides. Joining the September winner to the October winner with an inner join keeps only riders who completed rides in both months; the filters then demand auto in September and something else in October. A rider whose only October ride was cancelled has no October row and drops out.",
      "",
      "The alternative finds the mode without window functions: a family wins when no other family of the same rider-month has more rides, or as many and an earlier name — the names happen to sort in price order. It totals the month with a correlated `SUM`. Both scan the rides once and then work on the much smaller per-family counts.",
    ].join("\n"),
  },

  {
    slug: "ola-ride-category-mix-by-city",
    title: "Ola: Auto, Mini and Prime Ride Mix in Each City",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Subqueries"],
    description: [
      "City managers want one line per city showing how completed rides split between the three product families: **auto**, **mini** and **prime** (`prime_sedan` and `prime_suv` together).",
      "",
      "For every city with at least one **completed** ride, return `city`, `auto_rides`, `mini_rides`, `prime_rides` and `top_category` — the family with the most completed rides, written `auto`, `mini` or `prime`. If families tie for the most, take the cheaper one: auto before mini before prime. Cancelled rides are ignored. Order the rows by `city`.",
    ].join("\n"),
    tables: [
      {
        name: "CabRide",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "category", type: "enum", values: ["auto", "mini", "prime_sedan", "prime_suv"] },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
          { name: "ride_date", type: "date" },
        ],
        primaryKey: ["ride_id"],
        note: "One row per ride request.",
      },
    ],
    examples: [
      {
        CabRide: [
          [1, "Bengaluru", "auto", "completed", "2024-10-01"],
          [2, "Bengaluru", "prime_sedan", "completed", "2024-10-01"],
          [3, "Bengaluru", "prime_suv", "completed", "2024-10-02"],
          [4, "Bengaluru", "mini", "cancelled", "2024-10-02"],
          [5, "Pune", "mini", "completed", "2024-10-01"],
          [6, "Pune", "auto", "completed", "2024-10-01"],
          [7, "Pune", "auto", "cancelled", "2024-10-03"],
          [8, "Chennai", "prime_suv", "cancelled", "2024-10-02"],
          [9, "Delhi", "mini", "completed", "2024-10-03"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, OLA_CITIES, ri(rng, 1, 4));
      const n = ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cities),
        pick(rng, ["auto", "mini", "prime_sedan", "prime_suv"]),
        chance(rng, 0.8) ? "completed" : "cancelled",
        dateBetween(rng, "2024-10-01", "2024-10-07"),
      ]);
      return { CabRide: rows };
    },
    solution: [
      "WITH c AS (",
      "  SELECT city,",
      "         SUM(CASE WHEN category = 'auto' THEN 1 ELSE 0 END) AS auto_rides,",
      "         SUM(CASE WHEN category = 'mini' THEN 1 ELSE 0 END) AS mini_rides,",
      "         SUM(CASE WHEN category IN ('prime_sedan', 'prime_suv') THEN 1 ELSE 0 END) AS prime_rides",
      "  FROM CabRide",
      "  WHERE status = 'completed'",
      "  GROUP BY city",
      ")",
      "SELECT city, auto_rides, mini_rides, prime_rides,",
      "       CASE WHEN auto_rides >= mini_rides AND auto_rides >= prime_rides THEN 'auto'",
      "            WHEN mini_rides >= prime_rides THEN 'mini'",
      "            ELSE 'prime' END AS top_category",
      "FROM c",
      "ORDER BY city",
    ].join("\n"),
    alternatives: [
      [
        "WITH fam AS (",
        "  SELECT city, CASE WHEN category LIKE 'prime%' THEN 'prime' ELSE category END AS family,",
        "         CASE category WHEN 'auto' THEN 1 WHEN 'mini' THEN 2 ELSE 3 END AS price_rank",
        "  FROM CabRide WHERE status = 'completed'",
        "), counts AS (",
        "  SELECT city, family, price_rank, COUNT(*) AS rides FROM fam GROUP BY city, family, price_rank",
        "), best AS (",
        "  SELECT city, family, ROW_NUMBER() OVER (PARTITION BY city ORDER BY rides DESC, price_rank) AS rn FROM counts",
        ")",
        "SELECT b.city,",
        "       COALESCE((SELECT rides FROM counts x WHERE x.city = b.city AND x.family = 'auto'), 0) AS auto_rides,",
        "       COALESCE((SELECT rides FROM counts x WHERE x.city = b.city AND x.family = 'mini'), 0) AS mini_rides,",
        "       COALESCE((SELECT rides FROM counts x WHERE x.city = b.city AND x.family = 'prime'), 0) AS prime_rides,",
        "       b.family AS top_category",
        "FROM best b WHERE b.rn = 1",
        "ORDER BY b.city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn rows into columns with one `SUM(CASE …)` per family; prime covers two categories.",
      "Cancelled rides go in `WHERE`, so a city with only cancellations has no group at all.",
      "Pick the winner with a `CASE` that tests the cheaper family first using `>=`, so a tie goes to it.",
    ],
    editorial: [
      "The output has one row per city and one column per family, so it is a **pivot** done with conditional aggregation: after keeping completed rides only, each `SUM(CASE WHEN … THEN 1 ELSE 0 END)` counts one family, and `category IN ('prime_sedan', 'prime_suv')` folds the two prime categories into one column. Families a city never sold show 0 rather than NULL because the `ELSE 0` contributes for every row.",
      "",
      "The top family is a comparison of three numbers in the same row. Testing in price order with `>=` resolves ties exactly as asked: auto wins if it is at least as large as both others; otherwise mini wins if it is at least as large as prime; otherwise prime. Because auto was already ruled out in the second branch, mini only needs to be compared with prime.",
      "",
      "The alternative keeps the data long instead: one row per city and family, ranked with `ROW_NUMBER()` by rides and then by a price rank, and the three columns looked up with scalar subqueries. It generalises better to many categories, while the pivot is a single pass.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "ola-scooters-behind-their-models-newest-firmware",
    title: "Ola: Scooters Behind Their Model's Newest Firmware",
    difficulty: "HARD",
    topics: ["Strings", "Window Functions", "Subqueries"],
    description: [
      "Scooters do not report their software in neat columns: every telemetry report carries one header string such as `S1PRO/BLR/fw=4.10.2/bms=2.1` — model, city code, firmware version and battery-management version, always in that order and separated by `/`. The software-quality team wants the scooters that are behind the rest of their model.",
      "",
      "A scooter's **current firmware** is the `fw=` version in its **latest** report (by `reported_at`) — a scooter that was rolled back reports the older version. A model's **newest firmware** is the highest current firmware among that model's scooters. Versions are `major.minor.patch` and compare **numerically, part by part** (4.10.0 is newer than 4.9.1); each part is below 100. Return every scooter whose current firmware is lower than its model's newest, as `scooter_id`, `model`, `current_fw` and `newest_fw` (the versions as written after `fw=`), ordered by `model`, then `scooter_id`.",
    ].join("\n"),
    tables: [
      {
        name: "TelemetryHeader",
        columns: [
          { name: "report_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "reported_at", type: "datetime" },
          { name: "header", type: "varchar" },
        ],
        primaryKey: ["report_id"],
        note: "One row per telemetry report. A scooter never sends two reports at the same second, and its model never changes.",
      },
    ],
    examples: [
      {
        TelemetryHeader: [
          [1, 701, "2024-10-01 08:00:00", "S1PRO/BLR/fw=4.9.1/bms=2.0"],
          [2, 701, "2024-10-05 09:00:00", "S1PRO/BLR/fw=4.10.0/bms=2.1"],
          [3, 702, "2024-10-04 10:00:00", "S1PRO/PNQ/fw=4.10.2/bms=2.1"],
          [4, 703, "2024-10-06 11:00:00", "S1PRO/HYD/fw=4.9.1/bms=2.0"],
          [5, 704, "2024-10-02 07:00:00", "S1X/BLR/fw=5.0.0/bms=2.1"],
          [6, 704, "2024-10-07 07:30:00", "S1X/BLR/fw=4.2.0/bms=2.0"],
          [7, 705, "2024-10-03 12:00:00", "S1X/PNQ/fw=4.2.0/bms=2.0"],
          [8, 706, "2024-10-03 12:00:00", "S1AIR/HYD/fw=3.9.4/bms=2.0"],
        ],
      },
    ],
    gen: (rng) => {
      const pool = ["3.9.4", "4.2.0", "4.9.1", "4.10.0", "4.10.2", "5.0.0"];
      const models = sample(rng, ["S1PRO", "S1AIR", "S1X"], ri(rng, 1, 3));
      const rows: Cell[][] = [];
      const scooters = ri(rng, 1, 10);
      for (let s = 0; s < scooters; s++) {
        const model = pick(rng, models);
        const city = pick(rng, ["BLR", "PNQ", "HYD", "MAA", "DEL"]);
        const times = sample(rng, seq(0, 200), ri(rng, 1, 4));
        for (const t of times) {
          rows.push([0, 701 + s, atMin("2024-10-01", t * 60 + ri(rng, 0, 59)), `${model}/${city}/fw=${pick(rng, pool)}/bms=${pick(rng, ["2.0", "2.1"])}`]);
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { TelemetryHeader: rows };
    },
    solution: [
      "WITH latest AS (",
      "  SELECT scooter_id, header,",
      "         ROW_NUMBER() OVER (PARTITION BY scooter_id ORDER BY reported_at DESC) AS rn",
      "  FROM TelemetryHeader",
      "), cur AS (",
      "  SELECT scooter_id,",
      "         SUBSTRING_INDEX(header, '/', 1) AS model,",
      "         SUBSTRING(SUBSTRING_INDEX(SUBSTRING_INDEX(header, '/', 3), '/', -1), 4) AS fw",
      "  FROM latest",
      "  WHERE rn = 1",
      "), keyed AS (",
      "  SELECT scooter_id, model, fw,",
      "         CAST(SUBSTRING_INDEX(fw, '.', 1) AS SIGNED) * 10000",
      "           + CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(fw, '.', 2), '.', -1) AS SIGNED) * 100",
      "           + CAST(SUBSTRING_INDEX(fw, '.', -1) AS SIGNED) AS fw_key",
      "  FROM cur",
      "), best AS (",
      "  SELECT model, fw AS newest_fw, fw_key AS top_key,",
      "         ROW_NUMBER() OVER (PARTITION BY model ORDER BY fw_key DESC, scooter_id) AS rn",
      "  FROM keyed",
      ")",
      "SELECT k.scooter_id, k.model, k.fw AS current_fw, b.newest_fw",
      "FROM keyed k",
      "JOIN best b ON b.model = k.model AND b.rn = 1",
      "WHERE k.fw_key < b.top_key",
      "ORDER BY k.model, k.scooter_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH cur AS (",
        "  SELECT t.scooter_id, SUBSTRING_INDEX(t.header, '/', 1) AS model,",
        "         REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(t.header, '/', 3), '/', -1), 'fw=', '') AS fw",
        "  FROM TelemetryHeader t",
        "  WHERE NOT EXISTS (SELECT 1 FROM TelemetryHeader u WHERE u.scooter_id = t.scooter_id AND u.reported_at > t.reported_at)",
        "), padded AS (",
        "  SELECT scooter_id, model, fw,",
        "         CONCAT(LPAD(SUBSTRING_INDEX(fw, '.', 1), 2, '0'),",
        "                LPAD(SUBSTRING_INDEX(SUBSTRING_INDEX(fw, '.', 2), '.', -1), 2, '0'),",
        "                LPAD(SUBSTRING_INDEX(fw, '.', -1), 2, '0')) AS sort_key",
        "  FROM cur",
        "), top AS (SELECT model, MAX(sort_key) AS top_key FROM padded GROUP BY model)",
        "SELECT p.scooter_id, p.model, p.fw AS current_fw,",
        "       (SELECT MIN(q.fw) FROM padded q WHERE q.model = p.model AND q.sort_key = t.top_key) AS newest_fw",
        "FROM padded p JOIN top t ON t.model = p.model",
        "WHERE p.sort_key < t.top_key",
        "ORDER BY p.model, p.scooter_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only each scooter's latest report before parsing anything — an earlier, newer version must not count.",
      "`SUBSTRING_INDEX(SUBSTRING_INDEX(header, '/', 3), '/', -1)` isolates the third field; drop its `fw=` prefix.",
      "Comparing `'4.10.0'` and `'4.9.1'` as text gets it wrong. Split the three parts and turn them into one number (or zero-padded text) that sorts correctly.",
    ],
    editorial: [
      "Three steps, each a classic. **Keep the latest row per group**: `ROW_NUMBER()` per scooter, newest `reported_at` first, and keep row 1. This must happen before anything else, because a scooter that installed 5.0.0 and was rolled back to 4.2.0 currently runs 4.2.0; taking the highest version it ever reported would be wrong.",
      "",
      "**Parse the header**: `SUBSTRING_INDEX(header, '/', 1)` is the model, and the nested `SUBSTRING_INDEX(SUBSTRING_INDEX(header, '/', 3), '/', -1)` cuts the first three fields and then keeps the last of them, `fw=4.10.2`; `SUBSTRING(…, 4)` drops the three-character prefix. The version's parts come out the same way with `.` as the separator.",
      "",
      "**Compare versions correctly**: as text, `'4.10.0' < '4.9.1'` because `'1' < '9'`. Since every part is below 100, `major * 10000 + minor * 100 + patch` is a number that orders versions exactly as they should be ordered. A second `ROW_NUMBER()` per model on that key finds the newest version (any scooter at the top gives the same text), and the scooters with a smaller key are behind. A scooter at the newest version — even a lone scooter of its model — is never listed.",
      "",
      "The alternative finds the latest report with `NOT EXISTS` (no later report from the same scooter), strips the prefix with `REPLACE`, and builds a sortable key by zero-padding each part with `LPAD` to two digits, so plain string `MAX` works. Both are linear after one sort per scooter.",
    ].join("\n"),
  },

  {
    slug: "ola-daily-opening-and-closing-odometer",
    title: "Ola: Each Scooter's Opening and Closing Readings per Day",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The connected-vehicle team builds a daily sheet for every scooter from its raw telemetry: where the odometer and the battery stood at the first reading of the day and at the last.",
      "",
      "For each scooter and calendar day (the date part of `read_at`; a reading at `00:00:00` belongs to the new day), the **opening** reading is the day's earliest and the **closing** reading is the day's latest. Return `scooter_id`, `ride_date`, `opening_km`, `closing_km`, `km_ridden` (closing minus opening odometer), `opening_soc` and `closing_soc` (battery percent at those two readings) — only for days on which the scooter **moved** (`km_ridden` above 0). A day with a single reading never qualifies. Order the rows by `scooter_id`, then `ride_date`.",
    ].join("\n"),
    tables: [
      {
        name: "Telemetry",
        columns: [
          { name: "scooter_id", type: "int" },
          { name: "read_at", type: "datetime" },
          { name: "odometer_km", type: "int" },
          { name: "soc_pct", type: "int" },
        ],
        primaryKey: ["scooter_id", "read_at"],
        note: "One row per telemetry reading. The odometer never goes down; the state of charge rises when the scooter is charged.",
      },
    ],
    examples: [
      {
        Telemetry: [
          [801, "2024-11-04 07:55:00", 1520, 92],
          [801, "2024-11-04 09:10:00", 1534, 81],
          [801, "2024-11-04 21:40:00", 1561, 58],
          [801, "2024-11-05 00:00:00", 1561, 57],
          [801, "2024-11-05 18:30:00", 1561, 96],
          [801, "2024-11-06 08:00:00", 1561, 96],
          [801, "2024-11-06 08:45:00", 1575, 88],
          [802, "2024-11-04 23:59:59", 300, 40],
          [802, "2024-11-05 06:00:00", 302, 39],
          [802, "2024-11-05 19:15:00", 331, 12],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const scooters = ri(rng, 1, 3);
      for (let s = 0; s < scooters; s++) {
        let odo = ri(rng, 200, 4000);
        let soc = ri(rng, 60, 100);
        const times = sample(rng, seq(0, 4 * 48 - 1), ri(rng, 1, 12)).sort((a, b) => a - b);
        for (const t of times) {
          const moved = chance(rng, 0.6) ? ri(rng, 1, 25) : 0;
          odo += moved;
          soc = chance(rng, 0.15) ? ri(rng, 85, 100) : Math.max(5, soc - Math.ceil(moved / 2));
          const sec = t * 1800 + (chance(rng, 0.15) ? 0 : ri(rng, 0, 1799));
          rows.push([801 + s, atSec("2024-11-04", sec), odo, soc]);
        }
      }
      return { Telemetry: shuffle(rng, rows) };
    },
    solution: [
      "WITH day_view AS (",
      "  SELECT scooter_id, CAST(read_at AS DATE) AS ride_date,",
      "         FIRST_VALUE(odometer_km) OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS opening_km,",
      "         LAST_VALUE(odometer_km) OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS closing_km,",
      "         FIRST_VALUE(soc_pct) OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS opening_soc,",
      "         LAST_VALUE(soc_pct) OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS closing_soc",
      "  FROM Telemetry",
      ")",
      "SELECT DISTINCT scooter_id, ride_date, opening_km, closing_km, closing_km - opening_km AS km_ridden, opening_soc, closing_soc",
      "FROM day_view",
      "WHERE closing_km - opening_km > 0",
      "ORDER BY scooter_id, ride_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH bounds AS (",
        "  SELECT scooter_id, CAST(read_at AS DATE) AS ride_date, MIN(read_at) AS first_at, MAX(read_at) AS last_at",
        "  FROM Telemetry",
        "  GROUP BY scooter_id, CAST(read_at AS DATE)",
        ")",
        "SELECT b.scooter_id, b.ride_date, o.odometer_km AS opening_km, c.odometer_km AS closing_km,",
        "       c.odometer_km - o.odometer_km AS km_ridden, o.soc_pct AS opening_soc, c.soc_pct AS closing_soc",
        "FROM bounds b",
        "JOIN Telemetry o ON o.scooter_id = b.scooter_id AND o.read_at = b.first_at",
        "JOIN Telemetry c ON c.scooter_id = b.scooter_id AND c.read_at = b.last_at",
        "WHERE c.odometer_km > o.odometer_km",
        "ORDER BY b.scooter_id, b.ride_date",
      ].join("\n"),
      [
        "WITH r AS (",
        "  SELECT scooter_id, CAST(read_at AS DATE) AS ride_date, odometer_km, soc_pct,",
        "         ROW_NUMBER() OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at) AS up,",
        "         ROW_NUMBER() OVER (PARTITION BY scooter_id, CAST(read_at AS DATE) ORDER BY read_at DESC) AS down",
        "  FROM Telemetry",
        ")",
        "SELECT o.scooter_id, o.ride_date, o.odometer_km AS opening_km, c.odometer_km AS closing_km,",
        "       c.odometer_km - o.odometer_km AS km_ridden, o.soc_pct AS opening_soc, c.soc_pct AS closing_soc",
        "FROM r o JOIN r c ON c.scooter_id = o.scooter_id AND c.ride_date = o.ride_date AND c.down = 1",
        "WHERE o.up = 1 AND c.odometer_km > o.odometer_km",
        "ORDER BY o.scooter_id, o.ride_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Partition the readings by scooter *and* day, ordered by time.",
      "`FIRST_VALUE` works with the default frame, but `LAST_VALUE` does not — its default frame ends at the current row. Widen it to `UNBOUNDED FOLLOWING`.",
      "Window functions keep every reading, so collapse the result to one row per scooter-day before filtering.",
    ],
    editorial: [
      "Opening and closing values are the classic use of `FIRST_VALUE` and `LAST_VALUE`. Partition the readings by scooter and by the reading's date (`CAST(read_at AS DATE)`, so midnight starts a new day) and order them by `read_at`; `FIRST_VALUE(odometer_km)` is then the opening reading on every row of the day, and the same window with `soc_pct` gives the opening charge.",
      "",
      "The trap is the frame. With an `ORDER BY`, a window's default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, so `LAST_VALUE` returns the current row's own value — the \"last so far\" — and the closing reading would differ on every row. Declaring `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` makes every row see the whole day. Because a window keeps one output row per reading, `DISTINCT` collapses each scooter-day to one row (all its values are identical across the day), and the `km_ridden > 0` filter drops parked days and single-reading days, whose opening and closing are the same reading.",
      "",
      "The first alternative finds each day's first and last timestamps with `MIN`/`MAX` and joins the two readings back by the primary key. The second numbers the day's readings in both directions with `ROW_NUMBER` and pairs row 1 up with row 1 down. All three sort each scooter's readings once.",
    ].join("\n"),
  },

  {
    slug: "ola-driver-partner-activation-by-approval-month",
    title: "Ola: Driver-Partner Activation and Retention by Approval Month",
    difficulty: "HARD",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "The supply team judges each month's batch of newly approved driver-partners by how they drive in their first four weeks.",
      "",
      "Measure each driver's weeks from their `approved_on` date: week 1 is days 0–6 after approval (`DATEDIFF(completed_at, approved_on)`), week 2 is days 7–13, week 3 days 14–20 and week 4 days 21–27. Only **completed** trips count. For every approval month (`cohort_month` as `YYYY-MM`), return `approved` (drivers approved that month), `active_week_1` (drivers with a completed trip in week 1), `active_week_4` (in week 4) and `all_four_weeks` (drivers with a completed trip in **each** of weeks 1 to 4). Drivers still awaiting approval (`approved_on` is NULL) are left out. Order the rows by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "DriverPartner",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "approved_on", type: "date" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per driver-partner; `approved_on` is NULL until onboarding finishes.",
      },
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
          { name: "completed_at", type: "datetime" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip a driver accepted; for a cancelled trip `completed_at` is when it was cancelled. Trips never come before approval.",
      },
    ],
    examples: [
      {
        DriverPartner: [
          [1, "Bengaluru", "2024-01-10"],
          [2, "Pune", "2024-01-25"],
          [3, "Chennai", "2024-02-05"],
          [4, "Delhi", null],
          [5, "Hyderabad", "2024-02-20"],
        ],
        Trip: [
          [1, 1, "completed", "2024-01-10 09:00:00"],
          [2, 1, "completed", "2024-01-17 18:30:00"],
          [3, 1, "completed", "2024-01-24 11:00:00"],
          [4, 1, "completed", "2024-01-31 20:00:00"],
          [5, 2, "completed", "2024-01-31 23:00:00"],
          [6, 2, "cancelled", "2024-02-21 10:00:00"],
          [7, 3, "completed", "2024-02-12 08:00:00"],
          [8, 3, "completed", "2024-03-03 19:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 12);
      const drivers: Cell[][] = seq(1, n).map((id) => [id, pick(rng, OLA_CITIES), chance(rng, 0.1) ? null : dateBetween(rng, "2024-01-01", "2024-03-31")]);
      const trips: Cell[][] = [];
      let tid = 1;
      for (const d of drivers) {
        if (d[2] === null) continue;
        const steady = chance(rng, 0.3);
        const offsets = steady ? [ri(rng, 0, 6), ri(rng, 7, 13), ri(rng, 14, 20), ri(rng, 21, 27)] : [];
        for (let k = ri(rng, 0, 5); k > 0; k--) offsets.push(chance(rng, 0.4) ? pick(rng, [0, 6, 7, 13, 14, 20, 21, 27, 28]) : ri(rng, 0, 35));
        for (const o of offsets) {
          trips.push([tid++, d[0]!, chance(rng, 0.85) ? "completed" : "cancelled", atSec(addDays(d[2] as string, o), ri(rng, 0, 86399))]);
        }
      }
      return { DriverPartner: drivers, Trip: shuffle(rng, trips) };
    },
    solution: [
      "WITH per_driver AS (",
      "  SELECT d.driver_id, d.approved_on,",
      "         MAX(CASE WHEN DATEDIFF(t.completed_at, d.approved_on) BETWEEN 0 AND 6 THEN 1 ELSE 0 END) AS w1,",
      "         MAX(CASE WHEN DATEDIFF(t.completed_at, d.approved_on) BETWEEN 21 AND 27 THEN 1 ELSE 0 END) AS w4,",
      "         COUNT(DISTINCT CASE WHEN DATEDIFF(t.completed_at, d.approved_on) BETWEEN 0 AND 27",
      "                             THEN DATEDIFF(t.completed_at, d.approved_on) DIV 7 END) AS weeks_active",
      "  FROM DriverPartner d",
      "  LEFT JOIN Trip t ON t.driver_id = d.driver_id AND t.status = 'completed'",
      "  WHERE d.approved_on IS NOT NULL",
      "  GROUP BY d.driver_id, d.approved_on",
      ")",
      "SELECT DATE_FORMAT(approved_on, '%Y-%m') AS cohort_month,",
      "       COUNT(*) AS approved,",
      "       SUM(w1) AS active_week_1,",
      "       SUM(w4) AS active_week_4,",
      "       SUM(CASE WHEN weeks_active = 4 THEN 1 ELSE 0 END) AS all_four_weeks",
      "FROM per_driver",
      "GROUP BY DATE_FORMAT(approved_on, '%Y-%m')",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH flags AS (",
        "  SELECT d.driver_id, DATE_FORMAT(d.approved_on, '%Y-%m') AS cohort_month,",
        "         EXISTS (SELECT 1 FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed' AND DATEDIFF(t.completed_at, d.approved_on) BETWEEN 0 AND 6) AS w1,",
        "         EXISTS (SELECT 1 FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed' AND DATEDIFF(t.completed_at, d.approved_on) BETWEEN 7 AND 13) AS w2,",
        "         EXISTS (SELECT 1 FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed' AND DATEDIFF(t.completed_at, d.approved_on) BETWEEN 14 AND 20) AS w3,",
        "         EXISTS (SELECT 1 FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed' AND DATEDIFF(t.completed_at, d.approved_on) BETWEEN 21 AND 27) AS w4",
        "  FROM DriverPartner d",
        "  WHERE d.approved_on IS NOT NULL",
        ")",
        "SELECT cohort_month, COUNT(*) AS approved, SUM(w1) AS active_week_1, SUM(w4) AS active_week_4,",
        "       SUM(CASE WHEN w1 = 1 AND w2 = 1 AND w3 = 1 AND w4 = 1 THEN 1 ELSE 0 END) AS all_four_weeks",
        "FROM flags",
        "GROUP BY cohort_month",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work per driver first, then roll the drivers up into months — two levels of grouping.",
      "`DATEDIFF(completed_at, approved_on) DIV 7` turns a trip into its week number (0 for week 1).",
      "\"Each of weeks 1 to 4\" means four distinct week numbers among trips in days 0–27.",
    ],
    editorial: [
      "Cohort questions have two levels: facts about each member, then counts over each cohort. The per-driver level joins a driver's **completed** trips with a `LEFT JOIN` (the status test belongs in `ON`, so drivers whose trips were all cancelled still count as approved) and computes three facts in one `GROUP BY`. `MAX(CASE …)` is 1 when any trip falls in days 0–6, likewise for days 21–27. For \"every one of the four weeks\", each trip's week number is `DATEDIFF(…) DIV 7` (0–3 within the first 28 days), and `COUNT(DISTINCT …)` over trips inside that window counts how many different weeks were active; four means all of them. A driver with no trips has a NULL `DATEDIFF`, every `CASE` gives 0, and the distinct count is 0.",
      "",
      "The cohort level then groups those per-driver rows by `DATE_FORMAT(approved_on, '%Y-%m')` and adds up the flags. Pending drivers are removed in `WHERE` before anything is counted. Days are counted as calendar days, so a trip at 23:00 on day 6 is still week 1 and a trip on day 28 belongs to none of the four weeks.",
      "",
      "The alternative replaces the join with four correlated `EXISTS` tests per driver — one per week — which reads more literally but scans each driver's trips four times.",
    ].join("\n"),
  },

  {
    slug: "ola-care-plan-coverage-on-each-month-end",
    title: "Ola: Scooters Covered by a Care Plan on Each Month End",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Aggregation", "Subqueries"],
    description: [
      "Owners can buy a paid service-and-warranty plan for their scooter and renew it, sometimes before the old plan runs out. Finance reports the covered base as a **snapshot on the last day of every month**.",
      "",
      "A scooter is **covered** on a date when at least one of its plans has `starts_on` on or before that date and `ends_on` on or after it (both days included); a scooter with two overlapping plans still counts once. For **every city that appears in `CarePlan`** and **every month end from 2024-01-31 to 2024-06-30** (the last day of each month, January to June), return `city`, `month_end` and `covered_scooters` — **0** when nothing was covered, so each city has six rows. Order the rows by `city`, then `month_end`.",
    ].join("\n"),
    tables: [
      {
        name: "CarePlan",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
        ],
        primaryKey: ["plan_id"],
        note: "One row per plan bought; a renewal is a new row. A scooter's city never changes, and `ends_on` is never before `starts_on`.",
      },
    ],
    examples: [
      {
        CarePlan: [
          [1, 901, "Bengaluru", "2023-12-15", "2024-03-14"],
          [2, 901, "Bengaluru", "2024-03-01", "2024-08-31"],
          [3, 902, "Bengaluru", "2024-01-31", "2024-02-29"],
          [4, 903, "Bengaluru", "2024-04-01", "2024-04-29"],
          [5, 904, "Pune", "2024-02-01", "2024-05-31"],
          [6, 905, "Pune", "2024-06-30", "2024-12-29"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, OLA_CITIES, ri(rng, 1, 3));
      const ends = ["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30", "2024-05-31", "2024-06-30"];
      const rows: Cell[][] = [];
      let id = 1;
      const scooters = chance(rng, 0.05) ? 0 : ri(rng, 1, 9);
      for (let s = 0; s < scooters; s++) {
        const city = pick(rng, cities);
        let start = chance(rng, 0.3) ? addDays(pick(rng, ends), pick(rng, [0, 1])) : dateBetween(rng, "2023-10-01", "2024-06-30");
        for (let k = ri(rng, 1, 3); k > 0; k--) {
          const end = chance(rng, 0.3) ? pick(rng, ends) : addDays(start, pick(rng, [29, 59, 89, 179]));
          const finish = end < start ? start : end;
          rows.push([id++, 901 + s, city, start, finish]);
          start = addDays(finish, pick(rng, [-20, -1, 1, 15, 40]));
        }
      }
      return { CarePlan: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE month_ends AS (",
      "  SELECT CAST('2024-01-31' AS DATE) AS month_end",
      "  UNION ALL",
      "  SELECT LAST_DAY(DATE_ADD(month_end, INTERVAL 1 DAY)) FROM month_ends WHERE month_end < '2024-06-30'",
      "), cities AS (",
      "  SELECT DISTINCT city FROM CarePlan",
      ")",
      "SELECT c.city, m.month_end, COUNT(DISTINCT p.scooter_id) AS covered_scooters",
      "FROM cities c",
      "CROSS JOIN month_ends m",
      "LEFT JOIN CarePlan p ON p.city = c.city AND p.starts_on <= m.month_end AND p.ends_on >= m.month_end",
      "GROUP BY c.city, m.month_end",
      "ORDER BY c.city, m.month_end",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.city, m.month_end,",
        "       (SELECT COUNT(DISTINCT p.scooter_id) FROM CarePlan p",
        "        WHERE p.city = c.city AND m.month_end BETWEEN p.starts_on AND p.ends_on) AS covered_scooters",
        "FROM (SELECT DISTINCT city FROM CarePlan) c",
        "CROSS JOIN (",
        "  SELECT LAST_DAY('2024-01-01') AS month_end UNION ALL SELECT LAST_DAY('2024-02-01')",
        "  UNION ALL SELECT LAST_DAY('2024-03-01') UNION ALL SELECT LAST_DAY('2024-04-01')",
        "  UNION ALL SELECT LAST_DAY('2024-05-01') UNION ALL SELECT LAST_DAY('2024-06-01')",
        ") m",
        "ORDER BY c.city, m.month_end",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build the six snapshot dates. `LAST_DAY(d)` gives the month's last day, and February 2024 has 29 days.",
      "Every city needs every date, even with nothing covered — `CROSS JOIN` the cities with the dates, then `LEFT JOIN` the plans.",
      "A plan covers a snapshot date when `starts_on <= month_end AND ends_on >= month_end`; count `DISTINCT scooter_id` so overlapping renewals count once.",
    ],
    editorial: [
      "A **month-end snapshot** asks for the state of the data on a set of dates that are not in the data. So the dates come first: a recursive CTE starts at 2024-01-31 and repeatedly steps one day past the previous month end and takes `LAST_DAY` of that, giving 01-31, 02-29, 03-31, 04-30, 05-31 and 06-30. Adding a month to 01-31 and hoping for the right day is fragile; going to the first of the next month and taking its last day is not.",
      "",
      "The answer has a row for every city and every date, so the grid is the `CROSS JOIN` of the distinct cities with the six dates. Plans are then attached with a `LEFT JOIN` whose `ON` holds the whole coverage test — same city, started on or before the date, ending on or after it. Keeping the test in `ON` (not `WHERE`) is what lets an uncovered city-date survive with NULLs, and `COUNT(DISTINCT p.scooter_id)` turns those into 0 while counting a scooter with an overlapping renewal once. A plan ending exactly on a month end still covers it; one starting the next day does not.",
      "",
      "The alternative lists the six month ends literally with `LAST_DAY` in a `UNION ALL` derived table and counts with a correlated subquery per grid cell. The join version touches each plan once per snapshot date it is compared with; with an index on `(city, starts_on)` either is cheap.",
    ].join("\n"),
  },

  {
    slug: "ola-peak-concurrent-sessions-at-each-hypercharger",
    title: "Ola: Peak Simultaneous Charging Sessions at Each Station",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "To decide where to add charging points, the charging-network team needs the **most sessions ever in progress at the same moment** at each station.",
      "",
      "A session is in progress from `started_at` up to, but not including, `ended_at` — a session that ends at the exact second another starts does **not** overlap it. For every station with at least one session, return `station_id`, `peak_sessions` (the largest number of sessions in progress at once) and `peak_at` — the **earliest** moment that number was reached. Order the rows by `station_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ChargeSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "station_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per finished session; `ended_at` is always after `started_at`.",
      },
    ],
    examples: [
      {
        ChargeSession: [
          [1, 1, 9001, "2024-12-02 10:00:00", "2024-12-02 10:30:00"],
          [2, 1, 9002, "2024-12-02 10:10:00", "2024-12-02 10:40:00"],
          [3, 1, 9003, "2024-12-02 10:30:00", "2024-12-02 11:00:00"],
          [4, 1, 9004, "2024-12-02 10:20:00", "2024-12-02 10:25:00"],
          [5, 2, 9005, "2024-12-02 09:00:00", "2024-12-02 09:20:00"],
          [6, 2, 9006, "2024-12-02 09:20:00", "2024-12-02 09:40:00"],
          [7, 3, 9007, "2024-12-02 14:00:00", "2024-12-02 15:00:00"],
          [8, 3, 9008, "2024-12-02 14:00:00", "2024-12-02 14:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const stations = ri(rng, 1, 3);
      let id = 1;
      for (let s = 1; s <= stations; s++) {
        for (let k = ri(rng, 1, 9); k > 0; k--) {
          const start = ri(rng, 54, 66) * 10; // on a ten-minute grid, so starts and ends meet
          const length = ri(rng, 1, 8) * 10;
          rows.push([id++, s, ri(rng, 9001, 9060), atMin("2024-12-02", start), atMin("2024-12-02", start + length)]);
        }
      }
      return { ChargeSession: shuffle(rng, rows) };
    },
    solution: [
      "WITH events AS (",
      "  SELECT station_id, session_id, started_at AS at_time, 1 AS delta FROM ChargeSession",
      "  UNION ALL",
      "  SELECT station_id, session_id, ended_at AS at_time, -1 AS delta FROM ChargeSession",
      "), running AS (",
      "  SELECT station_id, at_time,",
      "         SUM(delta) OVER (PARTITION BY station_id ORDER BY at_time, delta, session_id",
      "                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS live",
      "  FROM events",
      "), peak AS (",
      "  SELECT station_id, MAX(live) AS peak_sessions FROM running GROUP BY station_id",
      ")",
      "SELECT p.station_id, p.peak_sessions, MIN(r.at_time) AS peak_at",
      "FROM peak p",
      "JOIN running r ON r.station_id = p.station_id AND r.live = p.peak_sessions",
      "GROUP BY p.station_id, p.peak_sessions",
      "ORDER BY p.station_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH at_start AS (",
        "  SELECT s.station_id, s.started_at,",
        "         (SELECT COUNT(*) FROM ChargeSession o",
        "          WHERE o.station_id = s.station_id AND o.started_at <= s.started_at AND o.ended_at > s.started_at) AS live",
        "  FROM ChargeSession s",
        ")",
        "SELECT a.station_id, a.live AS peak_sessions, MIN(a.started_at) AS peak_at",
        "FROM at_start a",
        "WHERE NOT EXISTS (SELECT 1 FROM at_start b WHERE b.station_id = a.station_id AND b.live > a.live)",
        "GROUP BY a.station_id, a.live",
        "ORDER BY a.station_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn every session into two events: +1 when it starts, −1 when it ends.",
      "A running sum of those events in time order is the number of sessions in progress after each event.",
      "At equal times, process the −1 events first, so a session ending as another starts is not counted twice.",
    ],
    editorial: [
      "Counting overlaps pair by pair is quadratic; the **sweep line** does it in one ordered pass. Each session becomes two events — `+1` at `started_at` and `−1` at `ended_at` — combined with `UNION ALL`. Walking a station's events in time order and keeping a running `SUM(delta)` gives the number of sessions in progress after each event, and the peak is the largest running value.",
      "",
      "Ties in time need care. Because a session is not in progress at its own `ended_at`, an end and a start at the same second must not count together, so the window orders by `at_time` and then `delta`: `−1` sorts before `+1`, and the drop is applied before the rise. Among several starts at one moment the running value climbs to its full height on the last of them, so the peak is still reached at that moment; `session_id` only makes the order total. The earliest moment of the peak is the smallest `at_time` whose running value equals the maximum — never an end event, since those only lower the count.",
      "",
      "The alternative uses the fact that the count can only rise at a start: for each session it counts sessions in progress at its `started_at` (started at or before, ending after), then keeps the largest count and its earliest moment. That is a correlated count per session; the sweep sorts 2n events once.",
    ].join("\n"),
  },

  {
    slug: "ola-first-fault-after-each-ota-install",
    title: "Ola: First Fault Code After Each Software Install",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Dates"],
    description: [
      "Before widening a rollout, the software-quality team checks how soon scooters raise a fault after taking an update — and which fault comes first.",
      "",
      "For every install, find the **first fault** the same scooter raised **strictly after** the install and **strictly before** that scooter's **next** install (if it has one); a fault at the exact second of the next install belongs to neither. If two faults share the earliest second, take the one with the smaller `fault_id`. Return `install_id`, `scooter_id`, `version`, `first_fault_code` and `minutes_to_fault` (whole minutes from the install to that fault), with NULL in the last two when no fault falls in the window. Order the rows by `install_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SoftwareInstall",
        columns: [
          { name: "install_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "version", type: "varchar" },
          { name: "installed_at", type: "datetime" },
        ],
        primaryKey: ["install_id"],
        note: "One row per software install; a scooter never has two installs at the same second.",
      },
      {
        name: "FaultEvent",
        columns: [
          { name: "fault_id", type: "int" },
          { name: "scooter_id", type: "int" },
          { name: "fault_code", type: "varchar" },
          { name: "raised_at", type: "datetime" },
        ],
        primaryKey: ["fault_id"],
        note: "One row per diagnostic fault a scooter raised.",
      },
    ],
    examples: [
      {
        SoftwareInstall: [
          [1, 401, "4.0.0", "2024-09-03 02:00:00"],
          [2, 401, "4.0.1", "2024-09-10 02:00:00"],
          [3, 402, "4.0.0", "2024-09-04 03:00:00"],
          [4, 403, "4.0.1", "2024-09-11 01:30:00"],
          [5, 402, "4.0.1", "2024-09-12 03:00:00"],
        ],
        FaultEvent: [
          [1, 401, "BMS-12", "2024-09-02 23:00:00"],
          [2, 401, "MC-03", "2024-09-05 10:15:00"],
          [3, 401, "BMS-12", "2024-09-06 08:00:00"],
          [4, 401, "DSP-01", "2024-09-10 02:00:00"],
          [5, 401, "MC-03", "2024-09-10 05:30:00"],
          [6, 402, "TPMS-02", "2024-09-13 09:00:00"],
          [7, 402, "BMS-12", "2024-09-13 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const installs: Cell[][] = [];
      const faults: Cell[][] = [];
      const scooters = ri(rng, 1, 4);
      const codes = ["BMS-12", "MC-03", "DSP-01", "TPMS-02", "CHG-07"];
      for (let s = 0; s < scooters; s++) {
        const sid = 401 + s;
        const times = sample(rng, seq(0, 20), ri(rng, 1, 3)).sort((a, b) => a - b).map((d) => d * 1440 + ri(rng, 60, 300));
        const versions = ["3.2.1", "4.0.0", "4.0.1"].slice(3 - times.length);
        times.forEach((t, i) => installs.push([0, sid, versions[i]!, atMin("2024-09-01", t)]));
        for (let k = ri(rng, 0, 6); k > 0; k--) {
          const t = chance(rng, 0.2) ? pick(rng, times) : ri(rng, 0, 23 * 1440);
          const at = atMin("2024-09-01", t);
          faults.push([0, sid, pick(rng, codes), at]);
          if (chance(rng, 0.2)) faults.push([0, sid, pick(rng, codes), at]);
        }
      }
      const iids = shuffle(rng, seq(1, installs.length));
      installs.forEach((r, i) => (r[0] = iids[i]!));
      const fids = shuffle(rng, seq(1, faults.length));
      faults.forEach((r, i) => (r[0] = fids[i]!));
      return { SoftwareInstall: installs, FaultEvent: faults };
    },
    solution: [
      "WITH windowed AS (",
      "  SELECT install_id, scooter_id, version, installed_at,",
      "         LEAD(installed_at) OVER (PARTITION BY scooter_id ORDER BY installed_at) AS next_at",
      "  FROM SoftwareInstall",
      "), hits AS (",
      "  SELECT w.install_id, f.fault_code, f.raised_at,",
      "         ROW_NUMBER() OVER (PARTITION BY w.install_id ORDER BY f.raised_at, f.fault_id) AS rn",
      "  FROM windowed w",
      "  JOIN FaultEvent f ON f.scooter_id = w.scooter_id",
      "   AND f.raised_at > w.installed_at",
      "   AND (w.next_at IS NULL OR f.raised_at < w.next_at)",
      ")",
      "SELECT w.install_id, w.scooter_id, w.version,",
      "       h.fault_code AS first_fault_code,",
      "       TIMESTAMPDIFF(MINUTE, w.installed_at, h.raised_at) AS minutes_to_fault",
      "FROM windowed w",
      "LEFT JOIN hits h ON h.install_id = w.install_id AND h.rn = 1",
      "ORDER BY w.install_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (",
        "  SELECT i.install_id, i.scooter_id, i.version, i.installed_at,",
        "         (SELECT f.fault_id FROM FaultEvent f",
        "          WHERE f.scooter_id = i.scooter_id AND f.raised_at > i.installed_at",
        "            AND NOT EXISTS (SELECT 1 FROM SoftwareInstall n WHERE n.scooter_id = i.scooter_id",
        "                              AND n.installed_at > i.installed_at AND n.installed_at <= f.raised_at)",
        "          ORDER BY f.raised_at, f.fault_id LIMIT 1) AS fault_id",
        "  FROM SoftwareInstall i",
        ")",
        "SELECT x.install_id, x.scooter_id, x.version, f.fault_code AS first_fault_code,",
        "       TIMESTAMPDIFF(MINUTE, x.installed_at, f.raised_at) AS minutes_to_fault",
        "FROM firsts x",
        "LEFT JOIN FaultEvent f ON f.fault_id = x.fault_id",
        "ORDER BY x.install_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each install owns a time window: from its own time to the scooter's next install. `LEAD` gives the end.",
      "Join faults into their window, then number them per install by time and `fault_id`.",
      "LEFT JOIN the first numbered fault back to every install, so installs without a fault keep their row.",
    ],
    editorial: [
      "The question attaches events of one stream (faults) to intervals defined by another (installs). Each install's interval runs from its own `installed_at` to the scooter's next install, which `LEAD(installed_at)` over the scooter's installs provides; the last install has a NULL end and its interval is open.",
      "",
      "Faults are joined to the interval that contains them — strictly after the install and, when there is a next install, strictly before it. Strict comparisons at both ends mean a fault at the exact second of an install falls in no interval, as the statement asks. Among the faults of one interval, `ROW_NUMBER()` ordered by `raised_at` and then `fault_id` marks the first, settling same-second ties on the smaller id. A final `LEFT JOIN` of the first hit onto every install keeps installs with no fault, whose code and minutes come out NULL; `TIMESTAMPDIFF(MINUTE, …)` gives whole minutes.",
      "",
      "The alternative finds the first fault per install with a correlated `ORDER BY … LIMIT 1` subquery, expressing \"before the next install\" as \"no install of the scooter lies between this install and the fault\". It costs a sorted lookup per install instead of one windowed join.",
    ].join("\n"),
  },

  {
    slug: "ola-service-tickets-breaching-sla-in-working-days",
    title: "Ola: Service Tickets Breaching the 3-Working-Day SLA",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "Service centres promise to close a ticket within **3 working days**. Centres are shut on **Sundays** and on the dates in `Holiday`, so the after-sales team counts working days rather than calendar days.",
      "",
      "A closed ticket's **working days** are the days **after** `opened_on` up to and **including** `closed_on` that are neither a Sunday nor a holiday — a ticket closed the day it opened took 0. A ticket **breaches** when it took **more than 3** working days. For every centre with at least one closed ticket, return `centre_name`, `closed_tickets` and `breached`. Tickets still open are ignored. Order the rows by `centre_name`.",
    ].join("\n"),
    tables: [
      {
        name: "ServiceCentre",
        columns: [
          { name: "centre_id", type: "int" },
          { name: "centre_name", type: "varchar" },
        ],
        primaryKey: ["centre_id"],
        note: "One row per service centre; names are unique.",
      },
      {
        name: "ServiceTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "centre_id", type: "int" },
          { name: "opened_on", type: "date" },
          { name: "closed_on", type: "date" },
        ],
        primaryKey: ["ticket_id"],
        note: "`closed_on` is NULL while the ticket is open, and never before `opened_on`.",
      },
      {
        name: "Holiday",
        columns: [
          { name: "holiday_on", type: "date" },
          { name: "holiday_name", type: "varchar" },
        ],
        primaryKey: ["holiday_on"],
        note: "Dates every centre is closed. A holiday can fall on a Sunday.",
      },
    ],
    examples: [
      {
        ServiceCentre: [
          [1, "SC Whitefield"],
          [2, "SC Hadapsar"],
          [3, "SC Madhapur"],
        ],
        ServiceTicket: [
          [1, 1, "2024-08-01", "2024-08-05"],
          [2, 1, "2024-08-13", "2024-08-17"],
          [3, 1, "2024-08-13", "2024-08-19"],
          [4, 2, "2024-08-22", "2024-08-27"],
          [5, 2, "2024-08-20", null],
          [6, 2, "2024-08-28", "2024-08-28"],
          [7, 3, "2024-08-05", "2024-08-12"],
        ],
        Holiday: [
          ["2024-08-15", "Independence Day"],
          ["2024-08-26", "Janmashtami"],
        ],
      },
    ],
    gen: (rng) => {
      const centres: Cell[][] = sample(rng, ["SC Whitefield", "SC Hadapsar", "SC Madhapur", "SC Velachery", "SC Sector 18"], ri(rng, 1, 3)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      const tickets: Cell[][] = seq(1, n).map((id) => {
        const opened = dateBetween(rng, "2024-08-01", "2024-08-31");
        return [id, ri(rng, 1, centres.length), opened, chance(rng, 0.15) ? null : addDays(opened, ri(rng, 0, 9))];
      });
      const holidays: Cell[][] = sample(
        rng,
        [["2024-08-15", "Independence Day"], ["2024-08-19", "Raksha Bandhan"], ["2024-08-26", "Janmashtami"], ["2024-09-07", "Ganesh Chaturthi"], ["2024-08-11", "Local holiday"]],
        ri(rng, 0, 4),
      );
      return { ServiceCentre: centres, ServiceTicket: tickets, Holiday: holidays };
    },
    solution: [
      "WITH RECURSIVE ticket_days AS (",
      "  SELECT ticket_id, opened_on AS d, closed_on FROM ServiceTicket WHERE closed_on IS NOT NULL",
      "  UNION ALL",
      "  SELECT ticket_id, DATE_ADD(d, INTERVAL 1 DAY), closed_on FROM ticket_days WHERE d < closed_on",
      "), worked AS (",
      "  SELECT t.ticket_id, t.centre_id, COUNT(x.d) AS working_days",
      "  FROM ServiceTicket t",
      "  LEFT JOIN ticket_days x ON x.ticket_id = t.ticket_id",
      "   AND x.d > t.opened_on",
      "   AND DAYOFWEEK(x.d) <> 1",
      "   AND NOT EXISTS (SELECT 1 FROM Holiday h WHERE h.holiday_on = x.d)",
      "  WHERE t.closed_on IS NOT NULL",
      "  GROUP BY t.ticket_id, t.centre_id",
      ")",
      "SELECT c.centre_name, COUNT(*) AS closed_tickets,",
      "       SUM(CASE WHEN w.working_days > 3 THEN 1 ELSE 0 END) AS breached",
      "FROM worked w",
      "JOIN ServiceCentre c ON c.centre_id = w.centre_id",
      "GROUP BY c.centre_id, c.centre_name",
      "ORDER BY c.centre_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE cal AS (",
        "  SELECT MIN(opened_on) AS d, MAX(closed_on) AS last_day FROM ServiceTicket",
        "  UNION ALL",
        "  SELECT DATE_ADD(d, INTERVAL 1 DAY), last_day FROM cal WHERE d < last_day",
        "), open_days AS (",
        "  SELECT d FROM cal WHERE DAYOFWEEK(d) <> 1 AND d NOT IN (SELECT holiday_on FROM Holiday)",
        ")",
        "SELECT c.centre_name, COUNT(*) AS closed_tickets,",
        "       SUM(CASE WHEN (SELECT COUNT(*) FROM open_days o WHERE o.d > t.opened_on AND o.d <= t.closed_on) > 3 THEN 1 ELSE 0 END) AS breached",
        "FROM ServiceTicket t",
        "JOIN ServiceCentre c ON c.centre_id = t.centre_id",
        "WHERE t.closed_on IS NOT NULL",
        "GROUP BY c.centre_id, c.centre_name",
        "ORDER BY c.centre_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Working days cannot be computed from the two dates alone — you need the individual days in between.",
      "A recursive CTE can expand each ticket into one row per date from `opened_on` to `closed_on`.",
      "Count the expanded dates after `opened_on` that are not a Sunday (`DAYOFWEEK(d) = 1`) and not in `Holiday`.",
    ],
    editorial: [
      "`DATEDIFF` counts calendar days, but the SLA counts only days the centre is open, and holidays can fall anywhere. So the days between opening and closing have to be **materialised** and inspected one by one. A recursive CTE does that: the anchor is each closed ticket's `opened_on`, and the recursive step adds one day while the date is still before `closed_on`, producing every date from opening to closing inclusive.",
      "",
      "Each ticket's expanded dates are then filtered: strictly after `opened_on` (the opening day is not counted, so a same-day close is 0), not a Sunday (`DAYOFWEEK` returns 1 for Sunday), and not in `Holiday` (`NOT EXISTS`). A holiday on a Sunday is excluded once, not twice, because each date is one row. The filter sits in the `LEFT JOIN`'s `ON`, so a ticket with no counted days still appears with `COUNT(x.d) = 0`. Per centre, the closed tickets and those above 3 working days are counted; open tickets never enter.",
      "",
      "The alternative builds one shared calendar from the earliest opening to the latest closing, keeps the open days, and counts them per ticket with a correlated subquery. It generates fewer rows when tickets overlap heavily; the per-ticket expansion is simpler to reason about. Both are linear in the total number of days covered.",
    ].join("\n"),
  },
];
