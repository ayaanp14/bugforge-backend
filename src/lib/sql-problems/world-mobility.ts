import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' at an exact hour and minute. */
const at = (date: string, h: number, m: number): string => `${date} ${pad(h)}:${pad(m)}:00`;
/** A datetime `mins` minutes after `dt` ('YYYY-MM-DD HH:MM:SS'). */
function addMinutes(dt: string, mins: number): string {
  const d = new Date(Date.parse(dt.replace(" ", "T") + "Z") + mins * 60_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

const BLR_ZONES = ["Airport", "Koramangala", "Whitefield", "MG Road", "Electronic City", "Hebbal", "Indiranagar"] as const;
const CITIES3 = ["Bengaluru", "Mumbai", "Hyderabad", "Pune", "Chennai"] as const;
const HUB_NAMES = ["Bhiwandi Mother Hub", "Hoskote Gateway", "Gurugram Sorting Centre", "Medchal Hub", "Chakan Depot", "Sriperumbudur Hub", "Dankuni Hub"] as const;
const STATE_CODES = ["KA", "MH", "TN", "DL", "TS", "KL", "GJ"] as const;
const LETTERS = ["AB", "MN", "PQ", "XY", "CD", "RS", "JK"] as const;

/**
 * Ride-hailing, courier and logistics: the questions an ops analyst at a cab
 * aggregator or a parcel network is asked every week — airport surge trips,
 * idle drivers, hub volumes, registration states, cancellation mix, SLA misses
 * by courier, incentive qualifiers, latest tracking scans, fleet utilisation,
 * driver streaks, booking sessions, earnings targets, median delivery times,
 * delivery funnels, double-booked vehicles and the daily hub backlog.
 */
export const WORLD_MOBILITY: SqlProblemSpec[] = [
  {
    slug: "airport-drop-trips-with-surge-pricing",
    title: "Airport Drop Trips Charged With Surge Pricing",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The pricing team of a Bengaluru cab aggregator is reviewing how often surge pricing hits riders going to the airport. A trip was surged when its `surge_multiplier` is **greater than 1.0**; a multiplier of exactly 1.0 means normal fare.",
      "",
      "Return every **completed** trip whose `drop_zone` is `'Airport'` and that was surged, with the columns `trip_id`, `driver_id` and `fare`. Cancelled trips never appear. Order the rows by `fare` from highest to lowest, and by `trip_id` ascending when fares are equal.",
    ].join("\n"),
    tables: [
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "pickup_zone", type: "varchar" },
          { name: "drop_zone", type: "varchar" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
          { name: "fare", type: "int" },
          { name: "surge_multiplier", type: "decimal" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip. `fare` is in rupees (0 for a cancelled trip); `surge_multiplier` is 1.0 when no surge applied.",
      },
    ],
    examples: [
      {
        Trip: [
          [1, 11, "Koramangala", "Airport", "completed", 1240, 1.4],
          [2, 12, "Whitefield", "Airport", "completed", 980, 1.0],
          [3, 13, "Hebbal", "Airport", "cancelled", 0, 1.6],
          [4, 11, "Airport", "MG Road", "completed", 1100, 1.5],
          [5, 14, "Indiranagar", "Airport", "completed", 1240, 1.2],
          [6, 12, "MG Road", "Airport", "completed", 1510, 1.8],
          [7, 15, "Electronic City", "Koramangala", "completed", 320, 1.0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const fares = [780, 920, 1100, 1240, 1380, 1510];
      return {
        Trip: seq(1, n).map((id) => {
          const done = chance(rng, 0.8);
          const drop = chance(rng, 0.55) ? "Airport" : pick(rng, BLR_ZONES);
          const surge = pick(rng, [1.0, 1.0, 1.1, 1.3, 1.5, 2.0]);
          return [id, ri(rng, 11, 18), pick(rng, BLR_ZONES), drop, done ? "completed" : "cancelled", done ? pick(rng, fares) : 0, surge];
        }),
      };
    },
    solution: [
      "SELECT trip_id, driver_id, fare",
      "FROM Trip",
      "WHERE status = 'completed'",
      "  AND drop_zone = 'Airport'",
      "  AND surge_multiplier > 1.0",
      "ORDER BY fare DESC, trip_id",
    ].join("\n"),
    alternatives: [
      "SELECT trip_id, driver_id, fare FROM Trip WHERE drop_zone IN ('Airport') AND status <> 'cancelled' AND NOT (surge_multiplier <= 1.0) ORDER BY fare DESC, trip_id ASC",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold at once: the status, the drop zone and the multiplier.",
      "A multiplier of exactly 1.0 is a normal fare — use a strict comparison.",
      "Two trips can have the same fare; the statement says which comes first then.",
    ],
    editorial: [
      "This is a pure filter over one table. Every row of the answer is a trip, so there is no join and no grouping: keep the rows where all three conditions are true — `status = 'completed'`, `drop_zone = 'Airport'` and `surge_multiplier > 1.0` — combined with `AND`.",
      "",
      "Two details decide whether the answer is right. First, the comparison on the multiplier must be strict: a trip at exactly 1.0 paid the normal fare and is not surged. Second, the drop zone must be the airport; a trip *from* the airport (pickup zone) is a different question and must not slip in.",
      "",
      "The order is fixed by the statement, fare descending, and because two trips can cost the same the tie needs its own key, `trip_id` ascending — without it two equal fares could come back in either order. An index on `(drop_zone, status)` would let the database read only airport trips; otherwise it is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "drivers-with-no-completed-trip-in-march",
    title: "Drivers Without a Single Completed Trip in March 2024",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "The driver-success team wants to call every driver who went idle in March 2024. A driver counts as idle when they have **no completed trip that started in March 2024** (from `2024-03-01 00:00:00` up to and including `2024-03-31 23:59:59`). Cancelled trips in March, and completed trips in other months, do not count.",
      "",
      "Return the columns `driver_id` and `name` of every idle driver, including drivers with no trips at all. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per onboarded driver.",
      },
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
        note: "`driver_id` always names a row of `Driver`.",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Ramesh", "Bengaluru"],
          [2, "Suresh", "Bengaluru"],
          [3, "Imran", "Mumbai"],
          [4, "Gurpreet", "Delhi"],
          [5, "Lakshmi", "Chennai"],
        ],
        Trip: [
          [101, 1, "2024-03-05 09:12:00", "completed"],
          [102, 2, "2024-03-14 18:40:00", "cancelled"],
          [103, 2, "2024-02-29 23:50:00", "completed"],
          [104, 3, "2024-03-31 23:59:59", "completed"],
          [105, 4, "2024-04-01 00:00:00", "completed"],
          [106, 1, "2024-03-20 11:00:00", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const drivers = who.map((nm, i) => [i + 1, nm, pick(rng, CITIES3)]);
      const edges = ["2024-02-29 23:59:59", "2024-03-01 00:00:00", "2024-03-31 23:59:59", "2024-04-01 00:00:00"];
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const trips = seq(1, m).map((id) => {
        const when = chance(rng, 0.3) ? pick(rng, edges) : at(dateBetween(rng, "2024-02-15", "2024-04-15"), ri(rng, 0, 23), ri(rng, 0, 59));
        return [100 + id, ri(rng, 1, n), when, chance(rng, 0.75) ? "completed" : "cancelled"];
      });
      return { Driver: drivers, Trip: trips };
    },
    solution: [
      "SELECT d.driver_id, d.name",
      "FROM Driver d",
      "LEFT JOIN Trip t",
      "  ON t.driver_id = d.driver_id",
      " AND t.status = 'completed'",
      " AND t.started_at >= '2024-03-01 00:00:00'",
      " AND t.started_at < '2024-04-01 00:00:00'",
      "WHERE t.trip_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT driver_id, name FROM Driver d WHERE NOT EXISTS (SELECT 1 FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed' AND YEAR(t.started_at) = 2024 AND MONTH(t.started_at) = 3)",
      "SELECT driver_id, name FROM Driver WHERE driver_id NOT IN (SELECT driver_id FROM Trip WHERE status = 'completed' AND DATE_FORMAT(started_at, '%Y-%m') = '2024-03')",
    ],
    hints: [
      "Start from `Driver`: the answer includes drivers who have no trips at all.",
      "Which trips should be allowed to \"match\" a driver? Only completed ones that started in March.",
      "If you put those conditions in `WHERE` after a LEFT JOIN, what happens to drivers whose only trips are outside March?",
      "Half-open ranges (`>= '2024-03-01'` and `< '2024-04-01'`) catch the last second of the month without guessing at it.",
    ],
    editorial: [
      "This is an anti join with a filtered right side: we want drivers who have **no** trip satisfying three conditions — same driver, completed, started in March 2024.",
      "",
      "With a LEFT JOIN all three conditions belong in the `ON` clause. Then a driver with a qualifying trip is matched, and a driver without one — whether they had no trips, only cancelled ones, or only trips in February or April — comes out once with NULLs on the trip side, which `WHERE t.trip_id IS NULL` keeps. Putting the status or date tests in `WHERE` instead would throw away exactly those NULL rows and lose the idle drivers who had trips in other months.",
      "",
      "The month boundary is written as a half-open range, `>= '2024-03-01 00:00:00'` and `< '2024-04-01 00:00:00'`, which includes `23:59:59` on the 31st and nothing of April 1st. `YEAR()`/`MONTH()` or `DATE_FORMAT(…, '%Y-%m')` say the same thing but cannot use an index on `started_at`. `NOT EXISTS` and `NOT IN` work too; `NOT IN` is safe here only because `Trip.driver_id` is never NULL.",
    ].join("\n"),
  },

  {
    slug: "shipments-booked-at-each-courier-hub",
    title: "Shipments Booked at Each Courier Hub",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "A courier network books every shipment at an origin hub. The network planner wants a volume list of **all** hubs, including newly opened hubs where nothing has been booked yet.",
      "",
      "Return the columns `hub_name` and `shipments` (the number of shipments booked at that hub, 0 when none). Hub names are unique. Order the rows by `shipments` descending, then by `hub_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Hub",
        columns: [
          { name: "hub_id", type: "int" },
          { name: "hub_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["hub_id"],
        note: "One row per hub.",
      },
      {
        name: "Shipment",
        columns: [
          { name: "shipment_id", type: "int" },
          { name: "origin_hub_id", type: "int" },
          { name: "booked_on", type: "date" },
          { name: "weight_kg", type: "decimal" },
        ],
        primaryKey: ["shipment_id"],
        note: "`origin_hub_id` always names a row of `Hub`.",
      },
    ],
    examples: [
      {
        Hub: [
          [1, "Bhiwandi Mother Hub", "Mumbai"],
          [2, "Hoskote Gateway", "Bengaluru"],
          [3, "Medchal Hub", "Hyderabad"],
          [4, "Chakan Depot", "Pune"],
        ],
        Shipment: [
          [5001, 1, "2024-06-01", 2.5],
          [5002, 2, "2024-06-01", 0.8],
          [5003, 1, "2024-06-02", 12.0],
          [5004, 3, "2024-06-02", 4.2],
          [5005, 2, "2024-06-03", 1.1],
          [5006, 1, "2024-06-03", 0.5],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 6);
      const hubs = sample(rng, HUB_NAMES, k).map((nm, i) => [i + 1, nm, pick(rng, CITIES3)]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const ships = seq(1, m).map((i) => [5000 + i, ri(rng, 1, k), dateBetween(rng, "2024-06-01", "2024-06-10"), roundTo(rng, 1, 200, 1) / 10]);
      return { Hub: hubs, Shipment: ships };
    },
    solution: [
      "SELECT h.hub_name, COUNT(s.shipment_id) AS shipments",
      "FROM Hub h",
      "LEFT JOIN Shipment s ON s.origin_hub_id = h.hub_id",
      "GROUP BY h.hub_id, h.hub_name",
      "ORDER BY shipments DESC, h.hub_name",
    ].join("\n"),
    alternatives: [
      "SELECT hub_name, (SELECT COUNT(*) FROM Shipment s WHERE s.origin_hub_id = h.hub_id) AS shipments FROM Hub h ORDER BY shipments DESC, hub_name",
    ],
    ordered: true,
    hints: [
      "Every hub must appear, so the hubs drive the query.",
      "An inner join would drop the hubs with no bookings — which join keeps them?",
      "`COUNT(*)` and `COUNT(column)` differ on a row where the joined side is NULL.",
    ],
    editorial: [
      "We need one row per hub with a count of its shipments, and hubs with no shipments must show 0. A LEFT JOIN from `Hub` to `Shipment` keeps every hub: a hub with three bookings becomes three joined rows, a hub with none becomes one row whose shipment columns are all NULL.",
      "",
      "Grouping by the hub then gives one row per hub, and the choice of count matters. `COUNT(*)` counts rows, so the empty hub would wrongly show 1; `COUNT(s.shipment_id)` counts non-NULL values, so it shows 0. Group by `hub_id` (the key) as well as the name so the grouping is right even if two hubs ever shared a name.",
      "",
      "The order is part of the answer: most shipments first, and the name breaks ties. A correlated subquery that counts shipments per hub is an equally valid alternative — it reads each hub once and probes `Shipment` by `origin_hub_id`, which is fast with an index on that column.",
    ].join("\n"),
  },

  {
    slug: "active-vehicles-by-registration-state",
    title: "Active Fleet Vehicles by Registration State",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Indian vehicle registration numbers start with a two-letter state code (`KA01AB1234` is Karnataka, `MH12PQ4455` Maharashtra). The onboarding team typed some numbers with stray spaces before or after them.",
      "",
      "For every state code with **at least one active vehicle** (`active = 1`), return `state_code` (the first two characters of the registration number once the surrounding spaces are removed) and `active_vehicles` (how many active vehicles carry it). Order by `active_vehicles` descending, then `state_code` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Vehicle",
        columns: [
          { name: "vehicle_id", type: "int" },
          { name: "registration_no", type: "varchar" },
          { name: "vehicle_type", type: "enum", values: ["auto", "bike", "cab"] },
          { name: "active", type: "bool" },
        ],
        primaryKey: ["vehicle_id"],
        note: "Registration numbers are upper case; some carry leading or trailing spaces. `active` is 1 for a vehicle currently on the platform.",
      },
    ],
    examples: [
      {
        Vehicle: [
          [1, "KA01AB1234", "cab", 1],
          [2, " KA05MN9876", "bike", 1],
          [3, "MH12PQ4455 ", "cab", 1],
          [4, "TN09XY0001", "auto", 0],
          [5, "MH02CD7788", "auto", 1],
          [6, "DL3CRS5521", "cab", 0],
          [7, "KA53JK3002", "bike", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const states = sample(rng, STATE_CODES, ri(rng, 1, 5));
      return {
        Vehicle: seq(1, n).map((id) => {
          const reg = `${pick(rng, states)}${pad(ri(rng, 1, 60))}${pick(rng, LETTERS)}${String(ri(rng, 1, 9999)).padStart(4, "0")}`;
          const padded = chance(rng, 0.25) ? (chance(rng, 0.5) ? ` ${reg}` : `${reg}  `) : reg;
          return [id, padded, pick(rng, ["auto", "bike", "cab"]), chance(rng, 0.7) ? 1 : 0];
        }),
      };
    },
    solution: [
      "SELECT LEFT(TRIM(registration_no), 2) AS state_code, COUNT(*) AS active_vehicles",
      "FROM Vehicle",
      "WHERE active = 1",
      "GROUP BY LEFT(TRIM(registration_no), 2)",
      "ORDER BY active_vehicles DESC, state_code",
    ].join("\n"),
    alternatives: [
      "SELECT state_code, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_vehicles FROM (SELECT SUBSTRING(TRIM(registration_no), 1, 2) AS state_code, active FROM Vehicle) v GROUP BY state_code HAVING SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) > 0 ORDER BY active_vehicles DESC, state_code",
    ],
    ordered: true,
    hints: [
      "The state is not a column — derive it from the registration number.",
      "What are the first two characters of `' KA05MN9876'`? Clean the value before cutting it.",
      "Filter to active vehicles before grouping, then group by the derived code.",
    ],
    editorial: [
      "The grouping key is computed, not stored: the state code is the first two characters of the registration number. `LEFT(registration_no, 2)` would be enough if the data were clean, but a value typed as `' KA05MN9876'` starts with a space, so its first two characters are `' K'` — a bogus state. Applying `TRIM` first removes the surrounding spaces, and `LEFT(TRIM(registration_no), 2)` gives `KA` for both spellings.",
      "",
      "Inactive vehicles are filtered in `WHERE` before grouping, so a state whose vehicles are all inactive never forms a group, which is what \"at least one active vehicle\" asks. The alternative keeps every row, counts actives with a `CASE`, and removes the zero groups with `HAVING` — same answer, a little more work.",
      "",
      "Group by the same expression you select (or by its alias in MySQL). The order is by count descending with the code as the tie-breaker. The query is one scan; no index can help with a computed key unless you store the state as its own column, which is what a production schema would do.",
    ].join("\n"),
  },

  {
    slug: "ride-request-outcome-mix",
    title: "Ride Request Outcome Mix: Rider, Driver or No Driver",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "Every ride request ends one of three ways: it becomes a trip (`completed`), nobody accepts it (`no_driver`), or someone cancels it (`cancelled`, with a `cancel_reason`). Reasons that start with `rider_` were rider cancellations and reasons that start with `driver_` were driver cancellations.",
      "",
      "Label each request as `'Completed'`, `'No driver found'`, `'Rider cancelled'` or `'Driver cancelled'` and return `outcome` and `requests` (the count) for every label that occurs. Order by `requests` descending, then `outcome` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "RideRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "cancelled", "no_driver"] },
          { name: "cancel_reason", type: "enum", values: ["rider_changed_plans", "rider_long_eta", "driver_far_away", "driver_vehicle_issue"] },
        ],
        primaryKey: ["request_id"],
        note: "`cancel_reason` is set only when `status` is `cancelled`, and NULL otherwise.",
      },
    ],
    examples: [
      {
        RideRequest: [
          [1, 501, "2024-05-10 08:01:00", "completed", null],
          [2, 502, "2024-05-10 08:03:00", "cancelled", "rider_long_eta"],
          [3, 503, "2024-05-10 08:05:00", "cancelled", "driver_far_away"],
          [4, 501, "2024-05-10 08:09:00", "no_driver", null],
          [5, 504, "2024-05-10 08:15:00", "completed", null],
          [6, 505, "2024-05-10 08:20:00", "cancelled", "rider_changed_plans"],
          [7, 506, "2024-05-10 08:22:00", "completed", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const reasons = ["rider_changed_plans", "rider_long_eta", "driver_far_away", "driver_vehicle_issue"];
      const mix = sample(rng, ["completed", "cancelled", "no_driver", "completed"], ri(rng, 1, 4));
      return {
        RideRequest: seq(1, n).map((id) => {
          const s = pick(rng, mix);
          return [id, ri(rng, 500, 520), at(dateBetween(rng, "2024-05-01", "2024-05-31"), ri(rng, 6, 23), ri(rng, 0, 59)), s, s === "cancelled" ? pick(rng, reasons) : null];
        }),
      };
    },
    solution: [
      "SELECT CASE",
      "         WHEN status = 'completed' THEN 'Completed'",
      "         WHEN status = 'no_driver' THEN 'No driver found'",
      "         WHEN cancel_reason LIKE 'rider%' THEN 'Rider cancelled'",
      "         ELSE 'Driver cancelled'",
      "       END AS outcome,",
      "       COUNT(*) AS requests",
      "FROM RideRequest",
      "GROUP BY outcome",
      "ORDER BY requests DESC, outcome",
    ].join("\n"),
    alternatives: [
      "SELECT outcome, COUNT(*) AS requests FROM (SELECT IF(status = 'completed', 'Completed', IF(status = 'no_driver', 'No driver found', IF(LEFT(cancel_reason, 6) = 'rider_', 'Rider cancelled', 'Driver cancelled'))) AS outcome FROM RideRequest) r GROUP BY outcome ORDER BY requests DESC, outcome",
      [
        "SELECT outcome, requests FROM (",
        "  SELECT 'Completed' AS outcome, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS requests FROM RideRequest",
        "  UNION ALL SELECT 'No driver found', SUM(CASE WHEN status = 'no_driver' THEN 1 ELSE 0 END) FROM RideRequest",
        "  UNION ALL SELECT 'Rider cancelled', SUM(CASE WHEN status = 'cancelled' AND cancel_reason LIKE 'rider%' THEN 1 ELSE 0 END) FROM RideRequest",
        "  UNION ALL SELECT 'Driver cancelled', SUM(CASE WHEN status = 'cancelled' AND cancel_reason LIKE 'driver%' THEN 1 ELSE 0 END) FROM RideRequest",
        ") x WHERE requests > 0 ORDER BY requests DESC, outcome",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each row into one label first, then count the labels.",
      "A `CASE` expression checks its branches in order — use that to keep the status tests ahead of the reason tests.",
      "The reason's prefix tells you who cancelled.",
    ],
    editorial: [
      "The output groups by a label that is not stored anywhere, so build it with a `CASE` expression and group by it. The branches run top to bottom and the first true one wins: test `status = 'completed'` and `status = 'no_driver'` first; any row left is a cancellation, and its `cancel_reason` decides who cancelled — a `rider_` prefix means the rider, everything else (the `driver_` reasons) the driver.",
      "",
      "In a `LIKE` pattern the underscore is itself a wildcard (any one character), so `'rider_%'` would not test for a literal underscore; `'rider%'` is enough here because no driver reason starts with `rider`. `LEFT(cancel_reason, 6) = 'rider_'` avoids pattern syntax altogether.",
      "",
      "MySQL lets you `GROUP BY` the select alias; repeating the whole `CASE` also works. Only labels that occur form groups, so a label with zero requests is simply absent. The `UNION ALL` alternative counts each label with conditional aggregation and must filter out zero counts to match. All versions are one or four scans of the table.",
    ].join("\n"),
  },

  {
    slug: "late-night-ride-requests-for-safety-audit",
    title: "Late-Night Ride Requests for the May Safety Audit",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The trust-and-safety team audits every ride requested in the small hours. A request is **late-night** when it was made between `00:00:00` and `04:59:59` (inclusive) on any day of **May 2024**.",
      "",
      "Return the columns `request_id`, `rider_id` and `requested_at` of every late-night request in May 2024, ordered by `requested_at` ascending and then by `request_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "RideRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "pickup_zone", type: "varchar" },
        ],
        primaryKey: ["request_id"],
        note: "One row per request a rider made in the app; `requested_at` is local time (IST).",
      },
    ],
    examples: [
      {
        RideRequest: [
          [1, 701, "2024-05-03 00:00:00", "Koramangala"],
          [2, 702, "2024-05-03 04:59:59", "Hebbal"],
          [3, 703, "2024-05-03 05:00:00", "Airport"],
          [4, 701, "2024-05-12 02:15:00", "MG Road"],
          [5, 704, "2024-04-30 03:30:00", "Whitefield"],
          [6, 705, "2024-05-31 23:59:00", "Indiranagar"],
          [7, 706, "2024-05-12 02:15:00", "Airport"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const edges: [number, number, number][] = [[0, 0, 0], [4, 59, 59], [5, 0, 0], [23, 59, 59]];
      return {
        RideRequest: seq(1, n).map((id) => {
          const day = dateBetween(rng, "2024-04-29", "2024-06-02");
          const [h, m, s] = chance(rng, 0.35) ? pick(rng, edges) : [ri(rng, 0, 7), ri(rng, 0, 59), 0];
          return [id, ri(rng, 700, 712), `${day} ${pad(h)}:${pad(m)}:${pad(s)}`, pick(rng, BLR_ZONES)];
        }),
      };
    },
    solution: [
      "SELECT request_id, rider_id, requested_at",
      "FROM RideRequest",
      "WHERE requested_at >= '2024-05-01' AND requested_at < '2024-06-01'",
      "  AND HOUR(requested_at) < 5",
      "ORDER BY requested_at, request_id",
    ].join("\n"),
    alternatives: [
      "SELECT request_id, rider_id, requested_at FROM RideRequest WHERE DATE_FORMAT(requested_at, '%Y-%m') = '2024-05' AND HOUR(requested_at) BETWEEN 0 AND 4 ORDER BY requested_at, request_id",
      "SELECT request_id, rider_id, requested_at FROM RideRequest WHERE YEAR(requested_at) = 2024 AND MONTH(requested_at) = 5 AND DATE_FORMAT(requested_at, '%H:%i:%s') <= '04:59:59' ORDER BY requested_at ASC, request_id ASC",
    ],
    ordered: true,
    hints: [
      "Two separate conditions: the month, and the time of day.",
      "`HOUR()` pulls the hour out of a datetime; which hours make up 00:00:00–04:59:59?",
      "A request at exactly 05:00:00 is not late-night; one at 04:59:59 is.",
    ],
    editorial: [
      "The window has two parts that must both hold. The **date** part is May 2024, best written as the half-open range `requested_at >= '2024-05-01'` and `< '2024-06-01'`, which keeps every second of 31 May and nothing of April 30 or June 1. The **time-of-day** part is 00:00:00 to 04:59:59, which is exactly the hours 0, 1, 2, 3 and 4 — so `HOUR(requested_at) < 5` (or `BETWEEN 0 AND 4`) captures it without worrying about minutes and seconds.",
      "",
      "Checking the boundaries is the whole exercise: `00:00:00` is in (hour 0), `04:59:59` is in (hour 4), `05:00:00` is out (hour 5). Comparing the formatted time `DATE_FORMAT(requested_at, '%H:%i:%s') <= '04:59:59'` works too, because the fixed-width text sorts like time.",
      "",
      "Two requests can share a timestamp, so `request_id` breaks the tie in the required order. The date range can use an index on `requested_at`; the hour test is then applied to the month's rows.",
    ].join("\n"),
  },

  {
    slug: "undelivered-shipments-past-promised-date",
    title: "Undelivered Shipments Past Their Promised Date",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The customer-experience desk runs a breach report every morning. On the report date **2024-06-15**, a shipment is breached when it is still `in_transit`, has no `delivered_on` date, and its `promised_date` is **before** 2024-06-15. Shipments returned to origin (`rto`) are handled elsewhere and never appear.",
      "",
      "Return `awb`, `promised_date` and `days_overdue` (the days from the promised date to 2024-06-15) for every breached shipment, ordered by `days_overdue` descending and then `awb` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Shipment",
        columns: [
          { name: "awb", type: "bigint" },
          { name: "destination_city", type: "varchar" },
          { name: "promised_date", type: "date" },
          { name: "delivered_on", type: "date" },
          { name: "status", type: "enum", values: ["in_transit", "delivered", "rto"] },
        ],
        primaryKey: ["awb"],
        note: "`awb` is the 12-digit air waybill number. `delivered_on` is NULL until the parcel is delivered.",
      },
    ],
    examples: [
      {
        Shipment: [
          [784512300011, "Pune", "2024-06-10", null, "in_transit"],
          [784512300012, "Mumbai", "2024-06-15", null, "in_transit"],
          [784512300013, "Delhi", "2024-06-12", "2024-06-14", "delivered"],
          [784512300014, "Chennai", "2024-06-01", null, "rto"],
          [784512300015, "Kochi", "2024-06-14", null, "in_transit"],
          [784512300016, "Jaipur", "2024-06-10", null, "in_transit"],
          [784512300017, "Delhi", "2024-06-20", null, "in_transit"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const awbs = sample(rng, seq(11, 80), n);
      return {
        Shipment: awbs.map((k) => {
          const promised = chance(rng, 0.2) ? pick(rng, ["2024-06-14", "2024-06-15"]) : dateBetween(rng, "2024-05-28", "2024-06-22");
          const s = pick(rng, ["in_transit", "in_transit", "in_transit", "delivered", "rto"]);
          const delivered = s === "delivered" ? addDays(promised, ri(rng, -3, 4)) : null;
          return [784512300000 + k, pick(rng, ["Pune", "Mumbai", "Delhi", "Chennai", "Kochi", "Jaipur"]), promised, delivered, s];
        }),
      };
    },
    solution: [
      "SELECT awb, promised_date, DATEDIFF('2024-06-15', promised_date) AS days_overdue",
      "FROM Shipment",
      "WHERE status = 'in_transit'",
      "  AND delivered_on IS NULL",
      "  AND promised_date < '2024-06-15'",
      "ORDER BY days_overdue DESC, awb",
    ].join("\n"),
    alternatives: [
      "SELECT awb, promised_date, TIMESTAMPDIFF(DAY, promised_date, '2024-06-15') AS days_overdue FROM Shipment WHERE status NOT IN ('delivered', 'rto') AND delivered_on IS NULL AND DATEDIFF('2024-06-15', promised_date) > 0 ORDER BY days_overdue DESC, awb ASC",
    ],
    ordered: true,
    hints: [
      "Filter first: still in transit, not delivered, promised before the report date.",
      "`DATEDIFF(later, earlier)` counts the days between two dates.",
      "A shipment promised for the report date itself is not late yet.",
    ],
    editorial: [
      "Breached shipments are the rows that pass three tests: `status = 'in_transit'` (RTO and delivered parcels are excluded), `delivered_on IS NULL` (no delivery recorded) and `promised_date < '2024-06-15'`. The comparison is strict — a parcel promised for the 15th still has the whole day, so it is not overdue on the morning report.",
      "",
      "The overdue age is the gap between two dates, `DATEDIFF('2024-06-15', promised_date)`; the later date goes first so the result is positive. `TIMESTAMPDIFF(DAY, promised_date, '2024-06-15')` takes its arguments the other way round and gives the same number for plain dates.",
      "",
      "Testing `IS NULL` needs `IS`, never `= NULL`, which is never true. The order is oldest breach first, and since many parcels share a promised date the AWB number breaks ties. With an index on `(status, promised_date)` the report reads only the in-transit rows it needs.",
    ].join("\n"),
  },

  {
    slug: "drivers-rated-above-fleet-average",
    title: "Drivers Rated Above the Fleet Average",
    difficulty: "EASY",
    topics: ["Subqueries"],
    description: [
      "Drivers whose rating is above the fleet's average get priority on airport queues. New drivers have no rating yet (`avg_rating` is NULL); they are left out of the average and never qualify.",
      "",
      "Return `driver_id`, `name` and `avg_rating` of every driver whose rating is **strictly greater** than the average rating of all rated drivers. Order by `avg_rating` descending, then `driver_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "avg_rating", type: "decimal" },
        ],
        primaryKey: ["driver_id"],
        note: "`avg_rating` is the driver's lifetime rating out of 5 (in steps of 0.25), or NULL for a driver with no rated trips.",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Ramesh", "Bengaluru", 4.75],
          [2, "Imran", "Mumbai", 4.25],
          [3, "Lakshmi", "Chennai", null],
          [4, "Gurpreet", "Delhi", 4.5],
          [5, "Suresh", "Bengaluru", 4.0],
          [6, "Farida", "Hyderabad", 4.75],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const ratings = Array.from({ length: ri(rng, 1, 5) }, () => ri(rng, 14, 20) / 4);
      return {
        Driver: names(rng, n).map((nm, i) => [i + 1, nm, pick(rng, CITIES3), chance(rng, 0.15) ? null : pick(rng, ratings)]),
      };
    },
    solution: [
      "SELECT driver_id, name, avg_rating",
      "FROM Driver",
      "WHERE avg_rating > (SELECT AVG(avg_rating) FROM Driver)",
      "ORDER BY avg_rating DESC, driver_id",
    ].join("\n"),
    alternatives: [
      "SELECT d.driver_id, d.name, d.avg_rating FROM Driver d CROSS JOIN (SELECT AVG(avg_rating) AS fleet_avg FROM Driver) f WHERE d.avg_rating > f.fleet_avg ORDER BY d.avg_rating DESC, d.driver_id",
      "SELECT driver_id, name, avg_rating FROM (SELECT driver_id, name, avg_rating, AVG(avg_rating) OVER () AS fleet_avg FROM Driver) x WHERE avg_rating > fleet_avg ORDER BY avg_rating DESC, driver_id",
    ],
    ordered: true,
    hints: [
      "The threshold is one number computed from the whole table.",
      "A scalar subquery can stand wherever a value can.",
      "`AVG` already skips NULLs — and a NULL rating fails any comparison.",
    ],
    editorial: [
      "The comparison value is a single number, the fleet's average rating, so compute it in a **scalar subquery** — `(SELECT AVG(avg_rating) FROM Driver)` — and compare every row against it in `WHERE`.",
      "",
      "NULLs need no special handling. `AVG` ignores NULL values, so unrated drivers do not drag the average down; and for an unrated driver `NULL > 4.4` is unknown, which `WHERE` treats as false, so they never qualify. A driver exactly at the average is not above it, which is why the comparison is strict.",
      "",
      "The alternatives compute the same average once and attach it to every row: a derived table joined with `CROSS JOIN`, or the window `AVG(avg_rating) OVER ()`, which has an empty window — the whole table. All three read the table about twice. Ratings come in steps of 0.25 here, so the average and the ratings compare exactly in every engine.",
    ].join("\n"),
  },

  {
    slug: "driver-dispatch-offer-acceptance-rate",
    title: "Dispatch Offer Acceptance Rate per Driver",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "When a rider books, the dispatch engine offers the trip to a nearby driver, who can accept it, reject it, or let it time out. Ops tracks each driver's acceptance rate, but only for drivers with **at least 5 offers** — fewer is too noisy.",
      "",
      "Return `driver_id`, `offers` (the number of offers made to the driver) and `acceptance_pct` (accepted offers as a percentage of all offers, **rounded to 2 decimals**; rejected and timed-out offers both count as not accepted). Order by `acceptance_pct` descending, then `driver_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "DispatchOffer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "offered_at", type: "datetime" },
          { name: "response", type: "enum", values: ["accepted", "rejected", "timed_out"] },
        ],
        primaryKey: ["offer_id"],
        note: "One row per offer the dispatch engine sent to a driver.",
      },
    ],
    examples: [
      {
        DispatchOffer: [
          [1, 21, "2024-07-01 08:00:00", "accepted"],
          [2, 21, "2024-07-01 08:20:00", "rejected"],
          [3, 21, "2024-07-01 09:05:00", "accepted"],
          [4, 21, "2024-07-01 09:40:00", "timed_out"],
          [5, 21, "2024-07-01 10:10:00", "accepted"],
          [6, 22, "2024-07-01 08:02:00", "accepted"],
          [7, 22, "2024-07-01 08:30:00", "accepted"],
          [8, 22, "2024-07-01 09:00:00", "accepted"],
          [9, 23, "2024-07-01 08:05:00", "timed_out"],
          [10, 23, "2024-07-01 08:45:00", "accepted"],
          [11, 23, "2024-07-01 09:15:00", "rejected"],
          [12, 23, "2024-07-01 09:50:00", "rejected"],
          [13, 23, "2024-07-01 10:30:00", "accepted"],
          [14, 23, "2024-07-01 11:00:00", "accepted"],
        ],
      },
    ],
    gen: (rng) => {
      const drivers = ri(rng, 1, 5);
      const rows: Cell[][] = [];
      let id = 1;
      for (let d = 0; d < drivers; d++) {
        const k = pick(rng, [3, 4, 5, 5, 6, 8, 10]);
        const p = pick(rng, [0, 0.5, 0.6, 0.8, 1]);
        for (let j = 0; j < k; j++) {
          const r = chance(rng, p) ? "accepted" : pick(rng, ["rejected", "timed_out"]);
          rows.push([id++, 21 + d, at(dateBetween(rng, "2024-07-01", "2024-07-07"), ri(rng, 6, 22), ri(rng, 0, 59)), r]);
        }
      }
      return { DispatchOffer: rows };
    },
    solution: [
      "SELECT driver_id,",
      "       COUNT(*) AS offers,",
      "       ROUND(100 * SUM(CASE WHEN response = 'accepted' THEN 1 ELSE 0 END) / COUNT(*), 2) AS acceptance_pct",
      "FROM DispatchOffer",
      "GROUP BY driver_id",
      "HAVING COUNT(*) >= 5",
      "ORDER BY acceptance_pct DESC, driver_id",
    ].join("\n"),
    alternatives: [
      "SELECT driver_id, COUNT(offer_id) AS offers, ROUND(AVG(IF(response = 'accepted', 100, 0)), 2) AS acceptance_pct FROM DispatchOffer GROUP BY driver_id HAVING COUNT(offer_id) > 4 ORDER BY acceptance_pct DESC, driver_id",
      "SELECT o.driver_id, o.offers, ROUND(100 * COALESCE(a.accepted, 0) / o.offers, 2) AS acceptance_pct FROM (SELECT driver_id, COUNT(*) AS offers FROM DispatchOffer GROUP BY driver_id) o LEFT JOIN (SELECT driver_id, COUNT(*) AS accepted FROM DispatchOffer WHERE response = 'accepted' GROUP BY driver_id) a ON a.driver_id = o.driver_id WHERE o.offers >= 5 ORDER BY acceptance_pct DESC, o.driver_id",
    ],
    ordered: true,
    hints: [
      "Group the offers by driver; the denominator is the group's size.",
      "Count only the accepted offers with a `CASE` inside `SUM` — 1 for accepted, 0 otherwise.",
      "The minimum-offers rule is about a group, so it belongs in `HAVING`.",
      "A driver who accepted nothing should show 0, not disappear.",
    ],
    editorial: [
      "One group per driver gives the denominator directly: `COUNT(*)` is the number of offers. The numerator is a **conditional count** — `SUM(CASE WHEN response = 'accepted' THEN 1 ELSE 0 END)` adds 1 for each accepted offer and 0 for rejected and timed-out ones — so both numbers come out of the same pass over the table.",
      "",
      "Multiply by 100 before dividing and round to two decimals as the statement asks; MySQL's `/` returns a decimal, so no integer truncation happens. The \"at least 5 offers\" rule filters groups, not rows, so it goes in `HAVING COUNT(*) >= 5`. A driver who never accepts still forms a group, and the `CASE` sum gives them 0 %.",
      "",
      "Another neat form: the average of a 100-or-0 flag *is* the percentage, so `AVG(IF(response = 'accepted', 100, 0))` does it in one function. Joining two pre-aggregated subqueries also works, but needs a LEFT JOIN and `COALESCE` so a driver with no accepted offer is kept. The single-pass versions cost one scan and a group-by.",
    ].join("\n"),
  },

  {
    slug: "couriers-missing-delivery-sla-in-may",
    title: "Couriers Who Missed the Delivery SLA on Over 20% of May Drops",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "Each delivery carries a `promised_by` time; a delivery is **late** when `delivered_at` is after `promised_by`. The last-mile manager reviews couriers whose late share in **May 2024** (deliveries whose `delivered_at` falls in May 2024) is **strictly more than 20%**. Failed deliveries have no `delivered_at` and are ignored.",
      "",
      "Return `courier_id`, `name`, `deliveries` (May deliveries), `late_deliveries` and `late_pct` (late ÷ deliveries × 100, **rounded to 2 decimals**). Order by `late_pct` descending, then `courier_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Courier",
        columns: [
          { name: "courier_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "hub", type: "varchar" },
        ],
        primaryKey: ["courier_id"],
        note: "One row per last-mile delivery associate.",
      },
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "courier_id", type: "int" },
          { name: "promised_by", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
          { name: "status", type: "enum", values: ["delivered", "failed"] },
        ],
        primaryKey: ["delivery_id"],
        note: "`delivered_at` is NULL for a failed attempt. A delivery exactly at `promised_by` is on time.",
      },
    ],
    examples: [
      {
        Courier: [
          [1, "Mahesh", "HSR Layout"],
          [2, "Anwar", "Andheri East"],
          [3, "Selvi", "Velachery"],
        ],
        Delivery: [
          [1, 1, "2024-05-02 18:00:00", "2024-05-02 18:40:00", "delivered"],
          [2, 1, "2024-05-03 14:00:00", "2024-05-03 13:10:00", "delivered"],
          [3, 1, "2024-05-04 12:00:00", "2024-05-04 12:00:00", "delivered"],
          [4, 1, "2024-05-05 20:00:00", null, "failed"],
          [5, 2, "2024-05-10 11:00:00", "2024-05-10 10:30:00", "delivered"],
          [6, 2, "2024-05-11 11:00:00", "2024-05-11 12:15:00", "delivered"],
          [7, 2, "2024-05-12 11:00:00", "2024-05-12 10:00:00", "delivered"],
          [8, 2, "2024-05-13 11:00:00", "2024-05-13 10:45:00", "delivered"],
          [9, 2, "2024-05-14 11:00:00", "2024-05-14 10:50:00", "delivered"],
          [10, 3, "2024-04-30 21:00:00", "2024-05-01 09:30:00", "delivered"],
          [11, 3, "2024-05-31 22:00:00", "2024-06-01 08:00:00", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 5);
      const couriers = names(rng, k).map((nm, i) => [i + 1, nm, pick(rng, ["HSR Layout", "Andheri East", "Velachery", "Gachibowli"])]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 26);
      const lateness = couriers.map(() => pick(rng, [0, 0.1, 0.2, 0.25, 0.4, 0.6]));
      const rows: Cell[][] = seq(1, m).map((id) => {
        const c = ri(rng, 1, k);
        const promised = at(dateBetween(rng, "2024-04-28", "2024-06-03"), ri(rng, 9, 21), 0);
        if (chance(rng, 0.12)) return [id, c, promised, null, "failed"];
        const delta = chance(rng, lateness[c - 1]!) ? ri(rng, 1, 180) : chance(rng, 0.2) ? 0 : -ri(rng, 5, 120);
        return [id, c, promised, addMinutes(promised, delta), "delivered"];
      });
      return { Courier: couriers, Delivery: rows };
    },
    solution: [
      "SELECT c.courier_id, c.name,",
      "       COUNT(*) AS deliveries,",
      "       SUM(CASE WHEN d.delivered_at > d.promised_by THEN 1 ELSE 0 END) AS late_deliveries,",
      "       ROUND(100 * SUM(CASE WHEN d.delivered_at > d.promised_by THEN 1 ELSE 0 END) / COUNT(*), 2) AS late_pct",
      "FROM Courier c",
      "JOIN Delivery d ON d.courier_id = c.courier_id",
      "WHERE d.delivered_at >= '2024-05-01' AND d.delivered_at < '2024-06-01'",
      "GROUP BY c.courier_id, c.name",
      "HAVING 5 * SUM(CASE WHEN d.delivered_at > d.promised_by THEN 1 ELSE 0 END) > COUNT(*)",
      "ORDER BY late_pct DESC, c.courier_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH may AS (",
        "  SELECT courier_id, COUNT(*) AS deliveries, SUM(IF(delivered_at > promised_by, 1, 0)) AS late_deliveries",
        "  FROM Delivery",
        "  WHERE status = 'delivered' AND DATE_FORMAT(delivered_at, '%Y-%m') = '2024-05'",
        "  GROUP BY courier_id",
        ")",
        "SELECT c.courier_id, c.name, m.deliveries, m.late_deliveries, ROUND(100 * m.late_deliveries / m.deliveries, 2) AS late_pct",
        "FROM may m JOIN Courier c ON c.courier_id = m.courier_id",
        "WHERE m.late_deliveries / m.deliveries > 0.2",
        "ORDER BY late_pct DESC, c.courier_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Which date decides whether a delivery belongs to May — the promise or the drop?",
      "Count late deliveries with a `CASE` inside `SUM`, in the same group as the total.",
      "\"More than 20%\" compares two aggregates, so it goes in `HAVING`; exactly 20% is not enough.",
      "Failed attempts have a NULL `delivered_at` — does your month filter already drop them?",
    ],
    editorial: [
      "First decide which rows are in scope: deliveries whose `delivered_at` falls in May 2024, written as `>= '2024-05-01'` and `< '2024-06-01'`. That one filter also removes failed attempts, because a NULL `delivered_at` fails every comparison. A parcel promised on 30 April but dropped on 1 May is a May delivery; one dropped on 1 June is not.",
      "",
      "Then group per courier and compute two numbers in one pass: `COUNT(*)` for the deliveries and `SUM(CASE WHEN delivered_at > promised_by THEN 1 ELSE 0 END)` for the late ones. A drop exactly at the promised time is on time, so the comparison is strict.",
      "",
      "The threshold compares aggregates, so it is a `HAVING`. Writing it as `5 * late > deliveries` keeps it in integers — no rounding can push 20.0000 % over the line — while `late / deliveries > 0.2` is equivalent in exact arithmetic. The percentage itself is rounded to two decimals for display. The cost is one scan of the month's deliveries plus a join to the small courier table.",
    ].join("\n"),
  },

  {
    slug: "top-earning-driver-in-each-city-q1",
    title: "Top-Earning Driver in Each City for Q1 2024",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Dates"],
    description: [
      "Drivers are paid out several times a week. For the quarterly city awards, ops needs the driver with the **highest total payout in Q1 2024** (payouts dated 2024-01-01 to 2024-03-31) in each city. If drivers tie for the top total in a city, all of them win.",
      "",
      "Return `city`, `driver_id`, `name` and `q1_earnings` (the driver's Q1 payout total) for every winner. Drivers with no Q1 payout are not considered, and a city whose drivers had none does not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per driver; a driver works in one city.",
      },
      {
        name: "Payout",
        columns: [
          { name: "payout_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "payout_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["payout_id"],
        note: "A transfer to the driver's bank account, in rupees. `driver_id` always names a row of `Driver`.",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Ramesh", "Bengaluru"],
          [2, "Suresh", "Bengaluru"],
          [3, "Imran", "Mumbai"],
          [4, "Anil", "Mumbai"],
          [5, "Lakshmi", "Chennai"],
          [6, "Farida", "Chennai"],
        ],
        Payout: [
          [1, 1, "2024-01-15", 18000],
          [2, 1, "2024-02-15", 21000],
          [3, 2, "2024-03-31", 42000],
          [4, 3, "2024-02-01", 25000],
          [5, 4, "2024-01-20", 15000],
          [6, 4, "2024-03-10", 10000],
          [7, 5, "2024-04-01", 50000],
          [8, 6, "2023-12-31", 30000],
          [9, 1, "2024-04-02", 9000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const drivers = names(rng, n).map((nm, i) => [i + 1, nm, pick(rng, CITIES3.slice(0, 3))]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 22);
      const amounts = [5000, 10000, 15000, 20000];
      const payouts = seq(1, m).map((id) => {
        const d = chance(rng, 0.2) ? pick(rng, ["2023-12-31", "2024-01-01", "2024-03-31", "2024-04-01"]) : dateBetween(rng, "2023-12-20", "2024-04-10");
        return [id, ri(rng, 1, n), d, pick(rng, amounts)];
      });
      return { Driver: drivers, Payout: payouts };
    },
    solution: [
      "WITH q1 AS (",
      "  SELECT d.city, d.driver_id, d.name, SUM(p.amount) AS q1_earnings",
      "  FROM Driver d",
      "  JOIN Payout p ON p.driver_id = d.driver_id",
      "  WHERE p.payout_date BETWEEN '2024-01-01' AND '2024-03-31'",
      "  GROUP BY d.city, d.driver_id, d.name",
      "), ranked AS (",
      "  SELECT q1.*, RANK() OVER (PARTITION BY city ORDER BY q1_earnings DESC) AS rnk",
      "  FROM q1",
      ")",
      "SELECT city, driver_id, name, q1_earnings",
      "FROM ranked",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH q1 AS (",
        "  SELECT d.city, d.driver_id, d.name, SUM(p.amount) AS q1_earnings",
        "  FROM Driver d JOIN Payout p ON p.driver_id = d.driver_id",
        "  WHERE p.payout_date >= '2024-01-01' AND p.payout_date < '2024-04-01'",
        "  GROUP BY d.city, d.driver_id, d.name",
        ")",
        "SELECT city, driver_id, name, q1_earnings FROM q1 a",
        "WHERE q1_earnings = (SELECT MAX(b.q1_earnings) FROM q1 b WHERE b.city = a.city)",
      ].join("\n"),
      [
        "SELECT city, driver_id, name, q1_earnings FROM (",
        "  SELECT d.city, d.driver_id, d.name, SUM(p.amount) AS q1_earnings,",
        "         MAX(SUM(p.amount)) OVER (PARTITION BY d.city) AS city_best",
        "  FROM Driver d JOIN Payout p ON p.driver_id = d.driver_id",
        "  WHERE QUARTER(p.payout_date) = 1 AND YEAR(p.payout_date) = 2024",
        "  GROUP BY d.city, d.driver_id, d.name",
        ") t WHERE q1_earnings = city_best",
      ].join("\n"),
    ],
    hints: [
      "Two steps: total each driver's Q1 payouts, then find the best total per city.",
      "Filter payouts to the quarter before summing — a 1 April payout is Q2.",
      "Ties must all be kept: which ranking function gives two equal totals the same rank 1?",
    ],
    editorial: [
      "The question is a **top-1 per group with ties**, on a value that has to be aggregated first. Step one joins drivers to their payouts, keeps only payouts dated in Q1 2024 (`BETWEEN '2024-01-01' AND '2024-03-31'` on a `date` column is inclusive at both ends) and sums per driver — the city comes along in the `GROUP BY`.",
      "",
      "Step two ranks those totals within each city: `RANK() OVER (PARTITION BY city ORDER BY q1_earnings DESC)`. Drivers sharing the top total both get rank 1, so `WHERE rnk = 1` keeps every winner; `ROW_NUMBER()` would drop one of them arbitrarily, which is wrong *and* non-deterministic.",
      "",
      "Because the ranking reads the result of the aggregation, it lives in a second CTE (or a derived table). The alternatives compare each total with the city's maximum — via a correlated `MAX`, or the window `MAX(SUM(amount)) OVER (PARTITION BY city)`, which nests an aggregate inside a window in one query. An inner join means drivers with no Q1 payout never enter, as the statement requires.",
    ].join("\n"),
  },

  {
    slug: "drivers-qualifying-for-city-trip-incentives",
    title: "Drivers Qualifying for City Trip Incentives",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The growth team runs trip incentives per city: a driver in the incentive's city who completes **at least `min_trips` trips dated within the incentive window** (`start_date` to `end_date`, both inclusive) earns the `bonus`. A driver can qualify for several incentives; cancelled trips never count.",
      "",
      "Return `incentive_id`, `driver_id`, `completed_trips` (the driver's completed trips in that window) and `bonus` for every qualifying pair, ordered by `incentive_id` then `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Incentive",
        columns: [
          { name: "incentive_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
          { name: "min_trips", type: "int" },
          { name: "bonus", type: "int" },
        ],
        primaryKey: ["incentive_id"],
        note: "One incentive scheme; `bonus` in rupees.",
      },
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["driver_id"],
      },
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "trip_date", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
      },
    ],
    examples: [
      {
        Incentive: [
          [1, "Pune", "2024-08-05", "2024-08-07", 3, 500],
          [2, "Mumbai", "2024-08-05", "2024-08-11", 2, 800],
        ],
        Driver: [
          [1, "Sachin", "Pune"],
          [2, "Neha", "Pune"],
          [3, "Imran", "Mumbai"],
          [4, "Asha", "Mumbai"],
        ],
        Trip: [
          [1, 1, "2024-08-05", "completed"],
          [2, 1, "2024-08-06", "completed"],
          [3, 1, "2024-08-07", "completed"],
          [4, 2, "2024-08-05", "completed"],
          [5, 2, "2024-08-06", "cancelled"],
          [6, 2, "2024-08-08", "completed"],
          [7, 2, "2024-08-07", "completed"],
          [8, 3, "2024-08-11", "completed"],
          [9, 3, "2024-08-04", "completed"],
          [10, 4, "2024-08-09", "completed"],
          [11, 4, "2024-08-10", "completed"],
          [12, 1, "2024-08-09", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = ["Pune", "Mumbai"];
      const k = ri(rng, 1, 3);
      const incentives = seq(1, k).map((id) => {
        const s = dateBetween(rng, "2024-08-01", "2024-08-08");
        return [id, pick(rng, cities), s, addDays(s, ri(rng, 1, 6)), ri(rng, 1, 3), pick(rng, [300, 500, 800])];
      });
      const n = ri(rng, 1, 6);
      const drivers = names(rng, n).map((nm, i) => [i + 1, nm, chance(rng, 0.8) ? (pick(rng, incentives)[1] as string) : pick(rng, cities)]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 4, 28);
      const trips = seq(1, m).map((id) => [id, ri(rng, 1, n), dateBetween(rng, "2024-08-01", "2024-08-14"), chance(rng, 0.8) ? "completed" : "cancelled"]);
      return { Incentive: incentives, Driver: drivers, Trip: trips };
    },
    solution: [
      "SELECT i.incentive_id, d.driver_id, COUNT(*) AS completed_trips, i.bonus",
      "FROM Incentive i",
      "JOIN Driver d ON d.city = i.city",
      "JOIN Trip t ON t.driver_id = d.driver_id",
      "  AND t.status = 'completed'",
      "  AND t.trip_date BETWEEN i.start_date AND i.end_date",
      "GROUP BY i.incentive_id, d.driver_id, i.bonus, i.min_trips",
      "HAVING COUNT(*) >= i.min_trips",
      "ORDER BY i.incentive_id, d.driver_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT incentive_id, driver_id, completed_trips, bonus FROM (",
        "  SELECT i.incentive_id, d.driver_id, i.bonus, i.min_trips,",
        "         (SELECT COUNT(*) FROM Trip t WHERE t.driver_id = d.driver_id AND t.status = 'completed'",
        "            AND t.trip_date >= i.start_date AND t.trip_date <= i.end_date) AS completed_trips",
        "  FROM Incentive i CROSS JOIN Driver d WHERE d.city = i.city",
        ") x WHERE completed_trips >= min_trips AND completed_trips > 0",
        "ORDER BY incentive_id, driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A driver is eligible for an incentive only in their own city — that is a join condition.",
      "Trips join on the driver *and* on falling inside the incentive's window: a range condition in `ON`.",
      "Count per (incentive, driver) pair and compare with that incentive's own `min_trips`.",
      "Any column you use in `HAVING` must be grouped or aggregated.",
    ],
    editorial: [
      "Each row of the answer is a pair (incentive, driver), so build those pairs with joins: `Driver` joins `Incentive` on the city, and `Trip` joins on the driver **and** a range condition — `t.trip_date BETWEEN i.start_date AND i.end_date` — plus `status = 'completed'`. A join condition need not be an equality; a trip on 8 August simply fails to match a scheme ending on the 7th.",
      "",
      "Group by the pair and count the matched trips. The threshold differs per incentive, so `HAVING COUNT(*) >= i.min_trips` compares each group with its own incentive's value; because `min_trips` and `bonus` are functionally determined by the incentive, list them in `GROUP BY` so MySQL's ONLY_FULL_GROUP_BY accepts them.",
      "",
      "An inner join drops pairs with no qualifying trips at all, which is fine since `min_trips` is at least 1. The alternative counts with a correlated subquery for every eligible pair, which is clearer but re-scans trips per pair; with an index on `Trip(driver_id, trip_date)` both are quick.",
    ].join("\n"),
  },

  {
    slug: "latest-tracking-scan-for-each-parcel",
    title: "Latest Tracking Scan for Each Parcel",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Window Functions"],
    description: [
      "Every time a parcel passes a scanner — pickup, hub inbound, out for delivery, delivery or a failed attempt — a row is written to `TrackingScan`. The tracking page shows each parcel's **latest** scan. Scanners batch-upload, so two scans of one parcel can share a timestamp; then the one with the higher `scan_id` is the latest.",
      "",
      "Return `awb`, `hub_code`, `scan_type` and `scanned_at` of each parcel's latest scan, one row per parcel, ordered by `awb`.",
    ].join("\n"),
    tables: [
      {
        name: "TrackingScan",
        columns: [
          { name: "scan_id", type: "int" },
          { name: "awb", type: "bigint" },
          { name: "hub_code", type: "varchar" },
          { name: "scan_type", type: "enum", values: ["picked_up", "in_hub", "out_for_delivery", "delivered", "failed_attempt"] },
          { name: "scanned_at", type: "datetime" },
        ],
        primaryKey: ["scan_id"],
        note: "`awb` is the parcel's 12-digit waybill number; `hub_code` the scanning facility.",
      },
    ],
    examples: [
      {
        TrackingScan: [
          [1, 900100200301, "BLR-HSK", "picked_up", "2024-09-01 10:00:00"],
          [2, 900100200301, "BLR-HSK", "in_hub", "2024-09-01 18:30:00"],
          [3, 900100200302, "MUM-BHW", "picked_up", "2024-09-01 11:15:00"],
          [4, 900100200301, "PNQ-CHK", "in_hub", "2024-09-02 06:10:00"],
          [5, 900100200302, "MUM-BHW", "in_hub", "2024-09-01 20:00:00"],
          [6, 900100200302, "MUM-AND", "out_for_delivery", "2024-09-01 20:00:00"],
          [7, 900100200303, "DEL-GGN", "picked_up", "2024-09-02 09:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const parcels = sample(rng, seq(301, 40), ri(rng, 1, 6));
      const hubs = ["BLR-HSK", "MUM-BHW", "MUM-AND", "PNQ-CHK", "DEL-GGN", "HYD-MDL"];
      const types = ["picked_up", "in_hub", "out_for_delivery", "delivered", "failed_attempt"];
      const rows: Cell[][] = [];
      let id = 1;
      for (const p of parcels) {
        let t = at(dateBetween(rng, "2024-09-01", "2024-09-03"), ri(rng, 6, 12), ri(rng, 0, 59));
        const k = ri(rng, 1, 5);
        for (let j = 0; j < k; j++) {
          rows.push([id++, 900100200000 + p, pick(rng, hubs), pick(rng, types), t]);
          if (!chance(rng, 0.3)) t = addMinutes(t, ri(rng, 30, 600));
        }
      }
      return { TrackingScan: rows };
    },
    solution: [
      "SELECT awb, hub_code, scan_type, scanned_at",
      "FROM (",
      "  SELECT awb, hub_code, scan_type, scanned_at,",
      "         ROW_NUMBER() OVER (PARTITION BY awb ORDER BY scanned_at DESC, scan_id DESC) AS rn",
      "  FROM TrackingScan",
      ") s",
      "WHERE rn = 1",
      "ORDER BY awb",
    ].join("\n"),
    alternatives: [
      "SELECT s.awb, s.hub_code, s.scan_type, s.scanned_at FROM TrackingScan s WHERE NOT EXISTS (SELECT 1 FROM TrackingScan t WHERE t.awb = s.awb AND (t.scanned_at > s.scanned_at OR (t.scanned_at = s.scanned_at AND t.scan_id > s.scan_id))) ORDER BY s.awb",
      "SELECT s.awb, s.hub_code, s.scan_type, s.scanned_at FROM TrackingScan s WHERE s.scan_id = (SELECT t.scan_id FROM TrackingScan t WHERE t.awb = s.awb ORDER BY t.scanned_at DESC, t.scan_id DESC LIMIT 1) ORDER BY s.awb",
    ],
    ordered: true,
    hints: [
      "You want one whole row per parcel — `GROUP BY awb` with `MAX(scanned_at)` alone cannot give you the other columns of that row.",
      "Number each parcel's scans from newest to oldest and keep number 1.",
      "Two scans at the same time: add a second sort key so the numbering is fixed.",
    ],
    editorial: [
      "This is the classic **latest row per group** problem. `MAX(scanned_at)` per `awb` finds the time, but not the hub and type of the row that holds it; and joining back on the time would return two rows when two scans share it.",
      "",
      "`ROW_NUMBER() OVER (PARTITION BY awb ORDER BY scanned_at DESC, scan_id DESC)` numbers each parcel's scans from newest, with `scan_id` deciding equal timestamps, so exactly one row per parcel gets 1. Filter on it outside the subquery, since a window value cannot be used in the `WHERE` of the query that computes it.",
      "",
      "Without windows, keep a scan when **no** other scan of the same parcel is later — `NOT EXISTS` with the tie rule spelt out as `(later time) OR (same time AND higher id)`. Or pick the latest scan's id with an ordered `LIMIT 1` correlated subquery. With an index on `(awb, scanned_at, scan_id)` all three read each parcel's newest scan directly; the window version sorts the whole table once.",
    ].join("\n"),
  },

  {
    slug: "monthly-completed-trips-and-gmv",
    title: "Monthly Completed Trips, GMV and Average Fare",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "The finance team's monthly dashboard groups ride requests by the month they were made (`requested_at` as `'YYYY-MM'`). Every month with at least one request appears, even if nothing was completed.",
      "",
      "Return `month`, `completed_trips` (completed requests), `gmv` (the sum of `fare` over completed requests, 0 if none) and `avg_fare` (the average completed fare **rounded to 2 decimals**, NULL if none). Cancelled requests count in no column. Order by `month` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Ride",
        columns: [
          { name: "ride_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
          { name: "fare", type: "int" },
        ],
        primaryKey: ["ride_id"],
        note: "`fare` is in rupees; a cancelled ride may still carry the fare quoted at booking.",
      },
    ],
    examples: [
      {
        Ride: [
          [1, 41, "2024-01-05 09:00:00", "completed", 240],
          [2, 42, "2024-01-18 19:30:00", "completed", 410],
          [3, 41, "2024-01-31 23:59:59", "cancelled", 300],
          [4, 43, "2024-02-01 00:00:10", "completed", 180],
          [5, 44, "2024-02-14 21:10:00", "completed", 520],
          [6, 42, "2024-02-20 08:45:00", "completed", 330],
          [7, 45, "2024-03-03 12:00:00", "cancelled", 260],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      return {
        Ride: seq(1, n).map((id) => [
          id,
          ri(rng, 40, 60),
          at(dateBetween(rng, "2023-12-25", "2024-04-05"), ri(rng, 0, 23), ri(rng, 0, 59)),
          chance(rng, 0.7) ? "completed" : "cancelled",
          roundTo(rng, 120, 900, 10),
        ]),
      };
    },
    solution: [
      "SELECT DATE_FORMAT(requested_at, '%Y-%m') AS month,",
      "       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_trips,",
      "       SUM(CASE WHEN status = 'completed' THEN fare ELSE 0 END) AS gmv,",
      "       ROUND(AVG(CASE WHEN status = 'completed' THEN fare END), 2) AS avg_fare",
      "FROM Ride",
      "GROUP BY DATE_FORMAT(requested_at, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.month, COUNT(c.ride_id) AS completed_trips, COALESCE(SUM(c.fare), 0) AS gmv, ROUND(AVG(c.fare), 2) AS avg_fare",
        "FROM (SELECT DISTINCT LEFT(requested_at, 7) AS month FROM Ride) m",
        "LEFT JOIN Ride c ON LEFT(c.requested_at, 7) = m.month AND c.status = 'completed'",
        "GROUP BY m.month ORDER BY m.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket by month with `DATE_FORMAT(requested_at, '%Y-%m')`.",
      "Grouping all rides keeps months that had only cancellations; count and sum the completed ones with `CASE`.",
      "`AVG` ignores NULLs — so a `CASE` with no `ELSE` gives the average over completed rides only.",
    ],
    editorial: [
      "Bucket every ride by `DATE_FORMAT(requested_at, '%Y-%m')` and group by it. Because the statement wants months with only cancellations too, group **all** rides and decide per column what counts, instead of filtering cancelled rows in `WHERE` (which would delete such a month).",
      "",
      "Conditional aggregation does the rest. `SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)` counts completed rides; the same with `fare` in place of 1 sums GMV and yields 0 for a month without completions. For the average, leave out the `ELSE`: the `CASE` is NULL for cancelled rides, `AVG` skips NULLs, and a month with no completed ride averages nothing and gives NULL — exactly the rule asked for. The quoted fare on a cancelled ride is thus ignored everywhere.",
      "",
      "The alternative lists the months first and LEFT JOINs the completed rides to them, then needs `COALESCE` for the GMV. The single-pass `CASE` version is one scan and one group-by.",
    ].join("\n"),
  },

  {
    slug: "fleet-utilisation-by-vehicle-type",
    title: "Fleet Utilisation by Vehicle Type for One Week",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "Fleet utilisation is the share of online time a vehicle spends on trips. For the week **2024-08-05 to 2024-08-11** (inclusive), compute it per vehicle type over all that type's shifts: total `on_trip_minutes` ÷ total `online_minutes` × 100, **rounded to 2 decimals** (NULL if the type logged no online minutes).",
      "",
      "Return `vehicle_type`, `vehicles_online` (distinct vehicles of that type with a shift in the week) and `utilisation_pct`, for every type with at least one shift in the week. Order by `utilisation_pct` descending, then `vehicle_type` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "FleetVehicle",
        columns: [
          { name: "vehicle_id", type: "int" },
          { name: "registration_no", type: "varchar" },
          { name: "vehicle_type", type: "enum", values: ["auto", "bike", "cab", "ev_cab"] },
        ],
        primaryKey: ["vehicle_id"],
      },
      {
        name: "VehicleShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "vehicle_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "online_minutes", type: "int" },
          { name: "on_trip_minutes", type: "int" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per vehicle per shift; `on_trip_minutes` never exceeds `online_minutes`.",
      },
    ],
    examples: [
      {
        FleetVehicle: [
          [1, "KA01AB1001", "cab"],
          [2, "KA01AB1002", "cab"],
          [3, "KA05MN2001", "bike"],
          [4, "KA03XY3001", "auto"],
          [5, "KA51EV4001", "ev_cab"],
        ],
        VehicleShift: [
          [1, 1, "2024-08-05", 600, 420],
          [2, 1, "2024-08-06", 480, 300],
          [3, 2, "2024-08-11", 540, 270],
          [4, 3, "2024-08-07", 300, 240],
          [5, 4, "2024-08-04", 600, 500],
          [6, 4, "2024-08-12", 600, 450],
          [7, 5, "2024-08-08", 0, 0],
          [8, 3, "2024-08-09", 120, 60],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const vehicles = seq(1, n).map((id) => [id, `KA${pad(ri(rng, 1, 60))}${pick(rng, LETTERS)}${1000 + id}`, pick(rng, ["auto", "bike", "cab", "ev_cab"])]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const shifts = seq(1, m).map((id) => {
        const online = chance(rng, 0.1) ? 0 : roundTo(rng, 60, 720, 60);
        return [id, ri(rng, 1, n), dateBetween(rng, "2024-08-03", "2024-08-13"), online, roundTo(rng, 0, online, 30)];
      });
      return { FleetVehicle: vehicles, VehicleShift: shifts };
    },
    solution: [
      "SELECT v.vehicle_type,",
      "       COUNT(DISTINCT s.vehicle_id) AS vehicles_online,",
      "       ROUND(100 * SUM(s.on_trip_minutes) / NULLIF(SUM(s.online_minutes), 0), 2) AS utilisation_pct",
      "FROM FleetVehicle v",
      "JOIN VehicleShift s ON s.vehicle_id = v.vehicle_id",
      "WHERE s.shift_date BETWEEN '2024-08-05' AND '2024-08-11'",
      "GROUP BY v.vehicle_type",
      "ORDER BY utilisation_pct DESC, v.vehicle_type",
    ].join("\n"),
    alternatives: [
      [
        "SELECT vehicle_type, COUNT(*) AS vehicles_online,",
        "       ROUND(100 * SUM(trip) / NULLIF(SUM(online), 0), 2) AS utilisation_pct",
        "FROM (",
        "  SELECT v.vehicle_type, s.vehicle_id, SUM(s.online_minutes) AS online, SUM(s.on_trip_minutes) AS trip",
        "  FROM VehicleShift s JOIN FleetVehicle v ON v.vehicle_id = s.vehicle_id",
        "  WHERE s.shift_date >= '2024-08-05' AND s.shift_date < '2024-08-12'",
        "  GROUP BY v.vehicle_type, s.vehicle_id",
        ") per_vehicle",
        "GROUP BY vehicle_type",
        "ORDER BY utilisation_pct IS NULL, utilisation_pct DESC, vehicle_type",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The type lives on the vehicle, the minutes on the shift — join them.",
      "Utilisation of a type is a ratio of sums, not an average of each shift's ratio.",
      "A vehicle with three shifts is still one vehicle: count it with `DISTINCT`.",
      "Guard the division: a type whose shifts all logged 0 online minutes.",
    ],
    editorial: [
      "Join shifts to their vehicles, keep the shifts dated in the week (`BETWEEN` on a date column includes both ends), and group by `vehicle_type`.",
      "",
      "The utilisation of a type is **a ratio of sums** — total trip minutes over total online minutes — not the average of each shift's own ratio, which would give a 2-hour shift the same weight as a 10-hour one. Multiply by 100 before dividing, round to two decimals, and wrap the denominator in `NULLIF(…, 0)` so a type whose shifts logged zero online minutes yields NULL instead of a division error.",
      "",
      "`vehicles_online` counts vehicles, not shifts, so it needs `COUNT(DISTINCT s.vehicle_id)`. The alternative first sums per vehicle and then per type — the inner group makes each vehicle one row, so a plain `COUNT(*)` counts vehicles. In a descending sort MySQL places NULL last; spelling `utilisation_pct IS NULL` first makes that explicit. One scan of the week's shifts and a hash join to the vehicle table.",
    ].join("\n"),
  },

  {
    slug: "promo-campaign-redemptions-and-discount",
    title: "Promo Campaign Redemptions and Discount Burn",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Marketing issues promo codes named `<CAMPAIGN>-<variant>`, such as `DIWALI-24-BLR` or `MONSOON-MUM`; the **campaign is the part before the first hyphen**. A few legacy codes have no hyphen at all (`UPI50`) — the whole code is then its own campaign.",
      "",
      "For every campaign with **at least 2 redemptions**, return `campaign`, `redemptions`, `unique_riders` (distinct riders who redeemed it) and `total_discount` (rupees). Order by `total_discount` descending, then `campaign` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PromoRedemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "promo_code", type: "varchar" },
          { name: "redeemed_at", type: "datetime" },
          { name: "discount", type: "int" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per ride on which a promo code was applied. Codes are stored in upper case.",
      },
    ],
    examples: [
      {
        PromoRedemption: [
          [1, 81, "DIWALI-24-BLR", "2024-10-28 19:00:00", 75],
          [2, 82, "DIWALI-24-MUM", "2024-10-29 09:10:00", 60],
          [3, 81, "DIWALI-24-BLR", "2024-10-30 21:40:00", 75],
          [4, 83, "UPI50", "2024-10-30 10:00:00", 50],
          [5, 84, "UPI50", "2024-10-31 18:20:00", 50],
          [6, 85, "MONSOON-MUM", "2024-07-12 08:00:00", 40],
          [7, 86, "NEWUSER-100", "2024-10-01 12:00:00", 100],
          [8, 87, "NEWUSER-100", "2024-10-02 13:30:00", 100],
        ],
      },
    ],
    gen: (rng) => {
      const codes = ["DIWALI-24-BLR", "DIWALI-24-MUM", "DIWALI-PUNE", "UPI50", "UPI75", "MONSOON-MUM", "MONSOON-24-HYD", "NEWUSER-100", "NEWUSER-50", "IPLNIGHT"];
      const pool = sample(rng, codes, ri(rng, 2, 6));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      return {
        PromoRedemption: seq(1, n).map((id) => [
          id,
          ri(rng, 80, 90),
          pick(rng, pool),
          at(dateBetween(rng, "2024-07-01", "2024-11-05"), ri(rng, 7, 23), ri(rng, 0, 59)),
          pick(rng, [25, 40, 50, 75, 100]),
        ]),
      };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(promo_code, '-', 1) AS campaign,",
      "       COUNT(*) AS redemptions,",
      "       COUNT(DISTINCT rider_id) AS unique_riders,",
      "       SUM(discount) AS total_discount",
      "FROM PromoRedemption",
      "GROUP BY SUBSTRING_INDEX(promo_code, '-', 1)",
      "HAVING COUNT(*) >= 2",
      "ORDER BY total_discount DESC, campaign",
    ].join("\n"),
    alternatives: [
      [
        "SELECT campaign, COUNT(*) AS redemptions, COUNT(DISTINCT rider_id) AS unique_riders, SUM(discount) AS total_discount",
        "FROM (",
        "  SELECT rider_id, discount,",
        "         CASE WHEN LOCATE('-', promo_code) = 0 THEN promo_code",
        "              ELSE LEFT(promo_code, LOCATE('-', promo_code) - 1) END AS campaign",
        "  FROM PromoRedemption",
        ") r",
        "GROUP BY campaign",
        "HAVING COUNT(*) > 1",
        "ORDER BY total_discount DESC, campaign",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Derive the campaign from the code, then group by it.",
      "`SUBSTRING_INDEX(s, '-', 1)` returns everything before the first hyphen — and the whole string when there is none.",
      "Redemptions count rows; unique riders count distinct `rider_id`s.",
    ],
    editorial: [
      "The campaign is computed from the code: everything before the **first** hyphen. `SUBSTRING_INDEX(promo_code, '-', 1)` does exactly that, and conveniently returns the whole string when no hyphen exists, so the legacy `UPI50` becomes its own campaign without a special case. `DIWALI-24-BLR` and `DIWALI-24-MUM` both map to `DIWALI`, which is the point of the report.",
      "",
      "Group by that expression and compute three aggregates at once: `COUNT(*)` redemptions, `COUNT(DISTINCT rider_id)` unique riders (a rider using the code twice counts once), and `SUM(discount)`. The two-redemption minimum filters groups, so it goes in `HAVING`.",
      "",
      "The alternative finds the hyphen with `LOCATE` and cuts with `LEFT`, with a `CASE` for codes where `LOCATE` returns 0 — a reminder that `LEFT(code, 0 - 1)` would return an empty string. Either way it is one scan and a group-by; storing the campaign as its own column would let an index do the grouping.",
    ].join("\n"),
  },

  {
    slug: "driver-idle-gaps-between-trips",
    title: "Driver Idle Gaps Longer Than 90 Minutes",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Supply planners look for drivers left idle between trips. Take each driver's trips in order of `started_at`; the **idle gap** before a trip is the minutes from the previous trip's `ended_at` to this trip's `started_at`. Only pairs where **both trips started on the same calendar day** count, and only gaps **strictly longer than 90 minutes**.",
      "",
      "Return `driver_id`, `previous_trip_id`, `trip_id` and `idle_minutes` for every such gap, ordered by `driver_id`, then `trip_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["trip_id"],
        note: "A driver's trips never overlap, and no two trips of one driver start at the same moment.",
      },
    ],
    examples: [
      {
        Trip: [
          [1, 7, "2024-04-10 08:00:00", "2024-04-10 08:40:00"],
          [2, 7, "2024-04-10 10:10:00", "2024-04-10 10:55:00"],
          [3, 7, "2024-04-10 12:30:00", "2024-04-10 13:00:00"],
          [4, 7, "2024-04-11 09:00:00", "2024-04-11 09:30:00"],
          [5, 8, "2024-04-10 07:00:00", "2024-04-10 07:20:00"],
          [6, 8, "2024-04-10 07:50:00", "2024-04-10 08:30:00"],
          [7, 8, "2024-04-10 11:45:00", "2024-04-10 12:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const drivers = ri(rng, 1, 4);
      for (let d = 0; d < drivers; d++) {
        let t = at(pick(rng, ["2024-04-10", "2024-04-11"]), ri(rng, 6, 10), pick(rng, [0, 15, 30, 45]));
        const k = chance(rng, 0.1) ? 0 : ri(rng, 1, 7);
        for (let j = 0; j < k; j++) {
          const end = addMinutes(t, ri(rng, 10, 60));
          rows.push([id++, 7 + d, t, end]);
          t = addMinutes(end, chance(rng, 0.25) ? pick(rng, [90, 91]) : ri(rng, 5, 400));
        }
      }
      return { Trip: rows };
    },
    solution: [
      "SELECT driver_id, previous_trip_id, trip_id, idle_minutes",
      "FROM (",
      "  SELECT driver_id, trip_id, started_at,",
      "         LAG(trip_id) OVER (PARTITION BY driver_id ORDER BY started_at) AS previous_trip_id,",
      "         LAG(started_at) OVER (PARTITION BY driver_id ORDER BY started_at) AS prev_started_at,",
      "         TIMESTAMPDIFF(MINUTE, LAG(ended_at) OVER (PARTITION BY driver_id ORDER BY started_at), started_at) AS idle_minutes",
      "  FROM Trip",
      ") t",
      "WHERE DATE(prev_started_at) = DATE(started_at)",
      "  AND idle_minutes > 90",
      "ORDER BY driver_id, trip_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.driver_id, p.trip_id AS previous_trip_id, a.trip_id, TIMESTAMPDIFF(MINUTE, p.ended_at, a.started_at) AS idle_minutes",
        "FROM Trip a",
        "JOIN Trip p ON p.driver_id = a.driver_id AND p.started_at < a.started_at",
        "WHERE NOT EXISTS (SELECT 1 FROM Trip m WHERE m.driver_id = a.driver_id AND m.started_at > p.started_at AND m.started_at < a.started_at)",
        "  AND LEFT(p.started_at, 10) = LEFT(a.started_at, 10)",
        "  AND TIMESTAMPDIFF(MINUTE, p.ended_at, a.started_at) > 90",
        "ORDER BY a.driver_id, a.trip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each row compares a trip with the one just before it for the same driver.",
      "`LAG(...) OVER (PARTITION BY driver_id ORDER BY started_at)` reads a column of the previous trip.",
      "`TIMESTAMPDIFF(MINUTE, earlier, later)` gives the gap in minutes.",
      "The first trip of a driver has no previous trip — what does `LAG` return there, and does your filter drop it?",
    ],
    editorial: [
      "\"The previous trip of the same driver\" is what `LAG` is for. Partition by driver, order by `started_at`, and `LAG(trip_id)`, `LAG(started_at)` and `LAG(ended_at)` give the id, start and end of the trip just before each one. The gap is `TIMESTAMPDIFF(MINUTE, previous end, this start)`.",
      "",
      "Window results cannot be filtered in the same `SELECT`, so compute them in a derived table and filter outside: both trips started on the same day (`DATE(prev_started_at) = DATE(started_at)`), and the gap is **more than** 90 minutes — exactly 90 is not reported. A driver's first trip has NULL for every `LAG` column, and NULL fails both tests, so it drops out on its own; so does the overnight gap between a day's last trip and the next morning's first.",
      "",
      "Without windows, pair each trip with an earlier one of the same driver and use `NOT EXISTS` to insist nothing started in between — correct, but a self join that is quadratic per driver. The window plan sorts each driver's trips once.",
    ].join("\n"),
  },

  {
    slug: "couriers-above-their-hub-average-deliveries",
    title: "Couriers Delivering More Than Their Hub's Average in June",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Each courier belongs to one hub. A hub's average is its **June 2024 deliveries divided by the number of couriers at the hub**, counting couriers who delivered nothing in June.",
      "",
      "Return `hub_id`, `courier_id`, `name` and `deliveries` (the courier's June 2024 deliveries) for every courier whose deliveries are **strictly above** their hub's average. Order by `hub_id`, then `deliveries` descending, then `courier_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Courier",
        columns: [
          { name: "courier_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "hub_id", type: "int" },
        ],
        primaryKey: ["courier_id"],
      },
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "courier_id", type: "int" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per parcel delivered. `courier_id` always names a row of `Courier`.",
      },
    ],
    examples: [
      {
        Courier: [
          [1, "Mahesh", 10],
          [2, "Anwar", 10],
          [3, "Selvi", 10],
          [4, "Pradeep", 20],
          [5, "Joseph", 20],
        ],
        Delivery: [
          [1, 1, "2024-06-03"],
          [2, 1, "2024-06-04"],
          [3, 1, "2024-06-05"],
          [4, 2, "2024-06-03"],
          [5, 2, "2024-05-31"],
          [6, 4, "2024-06-10"],
          [7, 5, "2024-06-11"],
          [8, 3, "2024-07-01"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const couriers = names(rng, n).map((nm, i) => [i + 1, nm, pick(rng, [10, 20, 30])]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 25);
      const skew = couriers.map(() => ri(rng, 1, 4));
      const weighted = couriers.flatMap((c, i) => Array.from({ length: skew[i]! }, () => c[0] as number));
      const del = seq(1, m).map((id) => [id, pick(rng, weighted), dateBetween(rng, "2024-05-29", "2024-07-02")]);
      return { Courier: couriers, Delivery: del };
    },
    solution: [
      "WITH june AS (",
      "  SELECT c.courier_id, c.name, c.hub_id, COUNT(d.delivery_id) AS deliveries",
      "  FROM Courier c",
      "  LEFT JOIN Delivery d ON d.courier_id = c.courier_id",
      "   AND d.delivered_on BETWEEN '2024-06-01' AND '2024-06-30'",
      "  GROUP BY c.courier_id, c.name, c.hub_id",
      ")",
      "SELECT j.hub_id, j.courier_id, j.name, j.deliveries",
      "FROM june j",
      "WHERE j.deliveries > (SELECT AVG(k.deliveries) FROM june k WHERE k.hub_id = j.hub_id)",
      "ORDER BY j.hub_id, j.deliveries DESC, j.courier_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT hub_id, courier_id, name, deliveries FROM (",
        "  SELECT c.hub_id, c.courier_id, c.name,",
        "         (SELECT COUNT(*) FROM Delivery d WHERE d.courier_id = c.courier_id AND d.delivered_on >= '2024-06-01' AND d.delivered_on < '2024-07-01') AS deliveries",
        "  FROM Courier c",
        ") x",
        "WHERE deliveries * (SELECT COUNT(*) FROM Courier c2 WHERE c2.hub_id = x.hub_id) >",
        "      (SELECT COUNT(*) FROM Delivery d2 JOIN Courier c3 ON c3.courier_id = d2.courier_id",
        "        WHERE c3.hub_id = x.hub_id AND d2.delivered_on >= '2024-06-01' AND d2.delivered_on < '2024-07-01')",
        "ORDER BY hub_id, deliveries DESC, courier_id",
      ].join("\n"),
      [
        "SELECT hub_id, courier_id, name, deliveries FROM (",
        "  SELECT c.hub_id, c.courier_id, c.name, COUNT(d.delivery_id) AS deliveries,",
        "         AVG(COUNT(d.delivery_id)) OVER (PARTITION BY c.hub_id) AS hub_avg",
        "  FROM Courier c LEFT JOIN Delivery d ON d.courier_id = c.courier_id AND MONTH(d.delivered_on) = 6 AND YEAR(d.delivered_on) = 2024",
        "  GROUP BY c.hub_id, c.courier_id, c.name",
        ") t WHERE deliveries > hub_avg",
        "ORDER BY hub_id, deliveries DESC, courier_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First get one row per courier with their June count — including couriers at 0.",
      "Then compare each courier with the average of the couriers who share their hub: a correlated subquery.",
      "If the zero-delivery couriers are missing from your averages, the averages come out too high.",
    ],
    editorial: [
      "Build the per-courier June counts first. A LEFT JOIN from `Courier` to `Delivery`, with the June condition in the `ON` clause, keeps couriers who delivered nothing and counts them as 0 (`COUNT(d.delivery_id)` ignores the NULL row). Filtering June in `WHERE` instead would delete those couriers — and the hub averages would silently rise.",
      "",
      "Then each courier is compared with their own hub's average: a **correlated subquery** over the same CTE, `(SELECT AVG(deliveries) FROM june k WHERE k.hub_id = j.hub_id)`, re-evaluated for every outer row. The comparison is strict, so a courier exactly at the average is left out.",
      "",
      "The first alternative avoids averages altogether — `deliveries × couriers_at_hub > hub_total` is the same test in integers. The second uses the window `AVG(COUNT(...)) OVER (PARTITION BY hub_id)`, which averages the grouped counts per hub in one pass. All of them are cheap at this size; the window form scales best.",
    ].join("\n"),
  },

  {
    slug: "longest-driver-active-day-streak",
    title: "Each Driver's Longest Streak of Active Days",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A driver is **active** on a day when they completed at least one trip that day; cancelled trips do not make a day active. The loyalty programme rewards long runs of consecutive active days.",
      "",
      "For every driver with at least one active day, return `driver_id`, `streak_start`, `streak_end` and `streak_days` of their **longest** run of consecutive active days. If a driver has several runs of the same longest length, report the **earliest** one. Order by `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DriverTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "trip_date", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
        note: "A driver can have many trips on one day.",
      },
    ],
    examples: [
      {
        DriverTrip: [
          [1, 1, "2024-02-27", "completed"],
          [2, 1, "2024-02-28", "completed"],
          [3, 1, "2024-02-28", "completed"],
          [4, 1, "2024-02-29", "completed"],
          [5, 1, "2024-03-01", "completed"],
          [6, 1, "2024-03-03", "completed"],
          [7, 2, "2024-03-01", "completed"],
          [8, 2, "2024-03-02", "cancelled"],
          [9, 2, "2024-03-03", "completed"],
          [10, 2, "2024-03-04", "completed"],
          [11, 2, "2024-03-06", "completed"],
          [12, 2, "2024-03-07", "completed"],
          [13, 3, "2024-03-05", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const drivers = ri(rng, 1, 4);
      for (let d = 1; d <= drivers; d++) {
        const k = ri(rng, 0, 10);
        for (let j = 0; j < k; j++) {
          rows.push([id++, d, dateBetween(rng, "2024-02-25", "2024-03-08"), chance(rng, 0.8) ? "completed" : "cancelled"]);
        }
      }
      return { DriverTrip: rows };
    },
    solution: [
      "WITH active_days AS (",
      "  SELECT DISTINCT driver_id, trip_date",
      "  FROM DriverTrip",
      "  WHERE status = 'completed'",
      "), islands AS (",
      "  SELECT driver_id, trip_date,",
      "         DATE_SUB(trip_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY trip_date) DAY) AS grp",
      "  FROM active_days",
      "), streaks AS (",
      "  SELECT driver_id, MIN(trip_date) AS streak_start, MAX(trip_date) AS streak_end, COUNT(*) AS streak_days",
      "  FROM islands",
      "  GROUP BY driver_id, grp",
      "), ranked AS (",
      "  SELECT streaks.*, ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY streak_days DESC, streak_start) AS rn",
      "  FROM streaks",
      ")",
      "SELECT driver_id, streak_start, streak_end, streak_days",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY driver_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH active_days AS (",
        "  SELECT driver_id, trip_date FROM DriverTrip WHERE status = 'completed' GROUP BY driver_id, trip_date",
        "), flagged AS (",
        "  SELECT driver_id, trip_date,",
        "         CASE WHEN DATEDIFF(trip_date, LAG(trip_date) OVER (PARTITION BY driver_id ORDER BY trip_date)) = 1 THEN 0 ELSE 1 END AS is_start",
        "  FROM active_days",
        "), numbered AS (",
        "  SELECT driver_id, trip_date,",
        "         SUM(is_start) OVER (PARTITION BY driver_id ORDER BY trip_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS streak_no",
        "  FROM flagged",
        "), streaks AS (",
        "  SELECT driver_id, MIN(trip_date) AS streak_start, MAX(trip_date) AS streak_end, DATEDIFF(MAX(trip_date), MIN(trip_date)) + 1 AS streak_days",
        "  FROM numbered GROUP BY driver_id, streak_no",
        ")",
        "SELECT s.driver_id, s.streak_start, s.streak_end, s.streak_days FROM streaks s",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM streaks t WHERE t.driver_id = s.driver_id",
        "    AND (t.streak_days > s.streak_days OR (t.streak_days = s.streak_days AND t.streak_start < s.streak_start))",
        ")",
        "ORDER BY s.driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the trips to one row per driver per active day first — several trips on a day are still one day.",
      "Within a run of consecutive days, the date minus the row's position is the same for every day.",
      "Group by that constant to get each run's start, end and length.",
      "Then keep the longest run per driver, breaking ties by the earlier start.",
    ],
    editorial: [
      "This is **gaps and islands**. First collapse the data to distinct (driver, active day) pairs from completed trips: three trips on one day are one day, and a day with only cancellations is not active.",
      "",
      "Number each driver's active days in date order with `ROW_NUMBER()`. Along a run of consecutive days both the date and the row number go up by one, so `trip_date − row_number days` stays constant; a skipped day bumps it. That constant is the island's key: group by (driver, key) for `MIN`, `MAX` and `COUNT` of each run. It works across month ends (28 Feb → 29 Feb → 1 Mar in 2024) because date arithmetic is calendar-aware.",
      "",
      "Finally pick one run per driver: `ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY streak_days DESC, streak_start)` makes the earliest of equal-longest runs number 1. The alternative marks a row as a new run when the gap to the previous active day (via `LAG`) is not exactly one, numbers runs with a running `SUM`, and selects the best run with `NOT EXISTS`. Both are a couple of sorts per driver.",
    ].join("\n"),
  },

  {
    slug: "rider-app-sessions-and-booking-conversion",
    title: "Rider App Sessions and Booking Conversion",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic", "Dates"],
    description: [
      "The product team measures how often a visit to the rider app ends in a booking. A rider's events are split into **sessions**: a new session starts at the rider's first event and whenever **more than 30 minutes** have passed since the rider's previous event (a gap of exactly 30 minutes stays in the same session). A session **converts** when it contains at least one `booking` event.",
      "",
      "Return `rider_id`, `sessions`, `booking_sessions` and `conversion_pct` (booking sessions ÷ sessions × 100, **rounded to 2 decimals**) for every rider with events. Order by `conversion_pct` descending, then `rider_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "AppEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "event_at", type: "datetime" },
          { name: "event_type", type: "enum", values: ["app_open", "search", "fare_check", "booking", "payment"] },
        ],
        primaryKey: ["event_id"],
        note: "No two events of one rider share a timestamp.",
      },
    ],
    examples: [
      {
        AppEvent: [
          [1, 301, "2024-06-01 09:00:00", "app_open"],
          [2, 301, "2024-06-01 09:02:00", "search"],
          [3, 301, "2024-06-01 09:32:00", "booking"],
          [4, 301, "2024-06-01 18:00:00", "app_open"],
          [5, 301, "2024-06-01 18:31:00", "fare_check"],
          [6, 302, "2024-06-01 10:00:00", "app_open"],
          [7, 302, "2024-06-01 10:05:00", "booking"],
          [8, 302, "2024-06-01 10:06:00", "payment"],
          [9, 303, "2024-06-01 11:00:00", "search"],
          [10, 303, "2024-06-01 13:00:00", "search"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const riders = ri(rng, 1, 4);
      for (let r = 0; r < riders; r++) {
        let t = at("2024-06-01", ri(rng, 7, 11), pick(rng, [0, 10, 20]));
        const k = ri(rng, 1, 8);
        for (let j = 0; j < k; j++) {
          rows.push([id++, 301 + r, t, pick(rng, ["app_open", "search", "fare_check", "fare_check", "booking", "payment"])]);
          t = addMinutes(t, chance(rng, 0.25) ? pick(rng, [30, 31]) : chance(rng, 0.5) ? ri(rng, 1, 15) : ri(rng, 35, 300));
        }
      }
      return { AppEvent: rows };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT rider_id, event_at, event_type,",
      "         CASE WHEN LAG(event_at) OVER (PARTITION BY rider_id ORDER BY event_at) IS NULL",
      "                OR TIMESTAMPDIFF(SECOND, LAG(event_at) OVER (PARTITION BY rider_id ORDER BY event_at), event_at) > 1800",
      "              THEN 1 ELSE 0 END AS new_session",
      "  FROM AppEvent",
      "), numbered AS (",
      "  SELECT rider_id, event_type,",
      "         SUM(new_session) OVER (PARTITION BY rider_id ORDER BY event_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM gaps",
      "), per_session AS (",
      "  SELECT rider_id, session_no, MAX(CASE WHEN event_type = 'booking' THEN 1 ELSE 0 END) AS booked",
      "  FROM numbered",
      "  GROUP BY rider_id, session_no",
      ")",
      "SELECT rider_id, COUNT(*) AS sessions, SUM(booked) AS booking_sessions,",
      "       ROUND(100 * SUM(booked) / COUNT(*), 2) AS conversion_pct",
      "FROM per_session",
      "GROUP BY rider_id",
      "ORDER BY conversion_pct DESC, rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT e.rider_id, e.event_at FROM AppEvent e",
        "  WHERE NOT EXISTS (SELECT 1 FROM AppEvent p WHERE p.rider_id = e.rider_id AND p.event_at < e.event_at",
        "                    AND p.event_at >= DATE_SUB(e.event_at, INTERVAL 30 MINUTE))",
        "), tagged AS (",
        "  SELECT e.rider_id, e.event_type,",
        "         (SELECT MAX(s.event_at) FROM starts s WHERE s.rider_id = e.rider_id AND s.event_at <= e.event_at) AS session_start",
        "  FROM AppEvent e",
        ")",
        "SELECT rider_id, COUNT(DISTINCT session_start) AS sessions,",
        "       COUNT(DISTINCT CASE WHEN event_type = 'booking' THEN session_start END) AS booking_sessions,",
        "       ROUND(100 * COUNT(DISTINCT CASE WHEN event_type = 'booking' THEN session_start END) / COUNT(DISTINCT session_start), 2) AS conversion_pct",
        "FROM tagged",
        "GROUP BY rider_id",
        "ORDER BY conversion_pct DESC, rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Mark each event that starts a session: the rider's first event, or one more than 30 minutes after the previous event.",
      "A running `SUM` of those marks gives every event its session number.",
      "Per session, did any event have type `booking`? `MAX` of a 0/1 flag answers that.",
      "Then aggregate the sessions per rider.",
    ],
    editorial: [
      "**Sessionisation** is gaps-and-islands on time. Step one flags session starts: with `LAG(event_at)` over the rider's events in time order, an event starts a session when there is no previous event (LAG is NULL) or the gap is more than 1,800 seconds. Measuring in seconds and comparing with `>` keeps the exactly-30-minute case inside the session.",
      "",
      "Step two turns flags into ids: a running `SUM(new_session)` per rider — with an explicit `ROWS` frame over a unique order — numbers sessions 1, 2, 3… and gives every event the number of the session it belongs to.",
      "",
      "Step three collapses events into sessions; `MAX(CASE WHEN event_type = 'booking' THEN 1 ELSE 0 END)` is 1 for a session with any booking, however many it had. Step four counts sessions and converting sessions per rider and rounds the percentage.",
      "",
      "The alternative defines a session start as an event with no event of the same rider in the 30 minutes before it, labels each event with its latest start at or before it, and counts distinct starts. It is correlated and quadratic per rider; the window chain sorts each rider's events once.",
    ].join("\n"),
  },

  {
    slug: "day-driver-hit-monthly-earnings-target",
    title: "The Day Each Driver Hit the Monthly ₹10,000 Target",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "Drivers earn a bonus tier once their earnings in a calendar month reach **₹10,000**. The running total **resets on the first of every month**, and a driver can have several earnings on one day.",
      "",
      "For every driver and month in which the driver's month-to-date total reached at least 10,000, return `driver_id`, `month` (`'YYYY-MM'`), `target_hit_on` (the first date on which the month-to-date total was ≥ 10,000) and `month_total` (the driver's total for the whole month). Months that never reach the target are left out. Order by `driver_id`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "DriverEarning",
        columns: [
          { name: "earning_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "earned_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["earning_id"],
        note: "One row per credited trip fare or incentive, in rupees.",
      },
    ],
    examples: [
      {
        DriverEarning: [
          [1, 1, "2024-01-10", 4000],
          [2, 1, "2024-01-20", 3500],
          [3, 1, "2024-01-20", 2500],
          [4, 1, "2024-01-28", 1500],
          [5, 1, "2024-02-01", 6000],
          [6, 1, "2024-02-15", 3000],
          [7, 2, "2024-01-31", 9000],
          [8, 2, "2024-02-01", 2000],
          [9, 2, "2024-02-02", 9000],
          [10, 3, "2024-02-05", 12000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      return {
        DriverEarning: seq(1, n).map((id) => [id, ri(rng, 1, 4), dateBetween(rng, "2024-01-25", "2024-03-05"), roundTo(rng, 500, 6000, 500)]),
      };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT driver_id, DATE_FORMAT(earned_on, '%Y-%m') AS month, earned_on, SUM(amount) AS day_amount",
      "  FROM DriverEarning",
      "  GROUP BY driver_id, DATE_FORMAT(earned_on, '%Y-%m'), earned_on",
      "), running AS (",
      "  SELECT driver_id, month, earned_on,",
      "         SUM(day_amount) OVER (PARTITION BY driver_id, month ORDER BY earned_on ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS mtd,",
      "         SUM(day_amount) OVER (PARTITION BY driver_id, month) AS month_total",
      "  FROM daily",
      ")",
      "SELECT driver_id, month, MIN(earned_on) AS target_hit_on, MAX(month_total) AS month_total",
      "FROM running",
      "WHERE mtd >= 10000",
      "GROUP BY driver_id, month",
      "ORDER BY driver_id, month",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (",
        "  SELECT driver_id, LEFT(earned_on, 7) AS month, earned_on, SUM(amount) AS day_amount",
        "  FROM DriverEarning GROUP BY driver_id, LEFT(earned_on, 7), earned_on",
        "), hits AS (",
        "  SELECT a.driver_id, a.month, a.earned_on",
        "  FROM daily a",
        "  WHERE (SELECT SUM(b.day_amount) FROM daily b WHERE b.driver_id = a.driver_id AND b.month = a.month AND b.earned_on <= a.earned_on) >= 10000",
        ")",
        "SELECT h.driver_id, h.month, MIN(h.earned_on) AS target_hit_on,",
        "       (SELECT SUM(e.amount) FROM DriverEarning e WHERE e.driver_id = h.driver_id AND LEFT(e.earned_on, 7) = h.month) AS month_total",
        "FROM hits h",
        "GROUP BY h.driver_id, h.month",
        "ORDER BY h.driver_id, h.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Several earnings on a day should move the total once — add them up per day first.",
      "A running total that restarts every month: partition the window by driver **and** month.",
      "The target day is the earliest day whose running total is at least 10,000.",
      "The whole month's total is another window (or aggregate) over the same partition.",
    ],
    editorial: [
      "Start by rolling earnings up to one row per driver per day, tagged with the month (`DATE_FORMAT(earned_on, '%Y-%m')`). Without that step, two credits on the same day would be two rows of a running total, and \"the first date the total reached 10,000\" would still be right — but a window ordered only by date would then have tied rows, which is exactly where frame semantics get murky.",
      "",
      "Next, a **running total with a reset**: `SUM(day_amount) OVER (PARTITION BY driver_id, month ORDER BY earned_on ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Putting the month in the partition is what resets it on the 1st — 31 January's ₹9,000 does not help on 1 February. The same `SUM` without an `ORDER BY` is the month's full total on every row.",
      "",
      "Finally keep the days where the month-to-date is at least 10,000 and take the earliest per (driver, month); the month total is constant within the group, so `MAX` simply carries it out. A month that never reaches the target has no qualifying day and vanishes. The alternative computes the running total with a correlated sum — quadratic per driver-month, but window-free.",
    ].join("\n"),
  },

  {
    slug: "median-delivery-minutes-by-zone",
    title: "Median Pickup-to-Drop Minutes in Each Delivery Zone",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Averages are skewed by a few parcels stuck for hours, so the quick-commerce team reports the **median** delivery time per zone. A delivery's time is the whole minutes from `picked_up_at` to `delivered_at`; orders not yet delivered (`delivered_at` NULL) are ignored. With an even number of deliveries the median is the average of the two middle values.",
      "",
      "Return `zone`, `deliveries` and `median_minutes` (**rounded to 1 decimal**) for every zone with at least one delivered order, ordered by `zone`.",
    ].join("\n"),
    tables: [
      {
        name: "QuickDelivery",
        columns: [
          { name: "order_id", type: "int" },
          { name: "zone", type: "varchar" },
          { name: "picked_up_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "`delivered_at` is NULL while the order is still on the way.",
      },
    ],
    examples: [
      {
        QuickDelivery: [
          [1, "Andheri", "2024-11-02 10:00:00", "2024-11-02 10:12:00"],
          [2, "Andheri", "2024-11-02 10:05:00", "2024-11-02 10:20:00"],
          [3, "Andheri", "2024-11-02 10:10:00", "2024-11-02 11:40:00"],
          [4, "Bandra", "2024-11-02 11:00:00", "2024-11-02 11:09:00"],
          [5, "Bandra", "2024-11-02 11:02:00", "2024-11-02 11:16:00"],
          [6, "Bandra", "2024-11-02 11:03:00", null],
          [7, "Powai", "2024-11-02 12:00:00", "2024-11-02 12:25:00"],
          [8, "Bandra", "2024-11-02 11:30:00", "2024-11-02 11:40:00"],
          [9, "Bandra", "2024-11-02 11:40:00", "2024-11-02 11:51:00"],
        ],
      },
    ],
    gen: (rng) => {
      const zones = sample(rng, ["Andheri", "Bandra", "Powai", "Dadar", "Thane"], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      return {
        QuickDelivery: seq(1, n).map((id) => {
          const p = at("2024-11-02", ri(rng, 8, 22), ri(rng, 0, 59));
          const mins = chance(rng, 0.15) ? ri(rng, 60, 180) : pick(rng, [8, 10, 12, 12, 15, 18, 20, 25]);
          return [id, pick(rng, zones), p, chance(rng, 0.12) ? null : addMinutes(p, mins)];
        }),
      };
    },
    solution: [
      "WITH t AS (",
      "  SELECT zone, TIMESTAMPDIFF(MINUTE, picked_up_at, delivered_at) AS mins",
      "  FROM QuickDelivery",
      "  WHERE delivered_at IS NOT NULL",
      "), ranked AS (",
      "  SELECT zone, mins,",
      "         ROW_NUMBER() OVER (PARTITION BY zone ORDER BY mins) AS rn,",
      "         COUNT(*) OVER (PARTITION BY zone) AS cnt",
      "  FROM t",
      ")",
      "SELECT zone, MAX(cnt) AS deliveries, ROUND(AVG(mins), 1) AS median_minutes",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR(cnt / 2) + 1)",
      "GROUP BY zone",
      "ORDER BY zone",
    ].join("\n"),
    alternatives: [
      [
        "WITH t AS (",
        "  SELECT zone, TIMESTAMPDIFF(MINUTE, picked_up_at, delivered_at) AS mins FROM QuickDelivery WHERE delivered_at IS NOT NULL",
        "), c AS (SELECT zone, COUNT(*) AS n FROM t GROUP BY zone)",
        "SELECT c.zone, c.n AS deliveries,",
        "       (SELECT ROUND(AVG(DISTINCT a.mins), 1) FROM t a WHERE a.zone = c.zone",
        "          AND (SELECT COUNT(*) FROM t b WHERE b.zone = a.zone AND b.mins <= a.mins) >= c.n / 2",
        "          AND (SELECT COUNT(*) FROM t b WHERE b.zone = a.zone AND b.mins >= a.mins) >= c.n / 2) AS median_minutes",
        "FROM c ORDER BY c.zone",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute each delivered order's minutes first, and drop the undelivered ones before counting.",
      "Number the times within each zone in ascending order and count the zone's rows.",
      "For n rows the middle positions are ⌊(n+1)/2⌋ and ⌊n/2⌋+1 — one position when n is odd, two when even.",
      "Averaging the rows at those positions gives the median either way.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so build it from ranks. First compute each delivered order's minutes with `TIMESTAMPDIFF(MINUTE, picked_up_at, delivered_at)` and filter out NULL drops **before** ranking — otherwise the undelivered orders would shift the middle.",
      "",
      "Then, per zone, `ROW_NUMBER() OVER (PARTITION BY zone ORDER BY mins)` gives positions 1…n and `COUNT(*) OVER (PARTITION BY zone)` gives n on every row. The middle positions are `FLOOR((n+1)/2)` and `FLOOR(n/2)+1`: for n = 5 both are 3, for n = 4 they are 2 and 3. Keeping those rows and averaging them gives the median in both cases; equal times at the middle do not matter, since `ROW_NUMBER` still picks exactly the right positions. Round to one decimal (a half-minute is the only fraction that can appear).",
      "",
      "The window-free alternative uses the definition: the median values are those with at least n/2 values ≤ them and at least n/2 values ≥ them. With duplicates several rows can qualify, so it averages the **distinct** qualifying values. That is cubic in the worst case; the window version is a sort per zone.",
    ].join("\n"),
  },

  {
    slug: "parcel-delivery-funnel-by-destination-city",
    title: "Parcel Delivery Funnel and First-Attempt Rate by City",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "The last-mile funnel follows each booked shipment through its scans: `picked_up`, then `out_for_delivery`, then `delivered`, with possibly some `failed_attempt` scans on the way. A shipment reaches a stage when it has **at least one** scan of that type (scanned more than once still counts once).",
      "",
      "For every destination city, return `city`, `booked` (shipments), `picked_up`, `out_for_delivery`, `delivered` (shipments reaching each stage) and `first_attempt_pct` — delivered shipments with **no** `failed_attempt` scan as a percentage of delivered shipments, **rounded to 2 decimals**, NULL when nothing was delivered. Order by `city`.",
    ].join("\n"),
    tables: [
      {
        name: "Shipment",
        columns: [
          { name: "awb", type: "bigint" },
          { name: "dest_city", type: "varchar" },
          { name: "booked_on", type: "date" },
        ],
        primaryKey: ["awb"],
      },
      {
        name: "Scan",
        columns: [
          { name: "scan_id", type: "int" },
          { name: "awb", type: "bigint" },
          { name: "scan_type", type: "enum", values: ["picked_up", "in_hub", "out_for_delivery", "failed_attempt", "delivered"] },
          { name: "scanned_at", type: "datetime" },
        ],
        primaryKey: ["scan_id"],
        note: "`awb` always names a row of `Shipment`.",
      },
    ],
    examples: [
      {
        Shipment: [
          [600100000001, "Pune", "2024-12-01"],
          [600100000002, "Pune", "2024-12-01"],
          [600100000003, "Pune", "2024-12-02"],
          [600100000004, "Kochi", "2024-12-02"],
          [600100000005, "Kochi", "2024-12-03"],
          [600100000006, "Jaipur", "2024-12-03"],
        ],
        Scan: [
          [1, 600100000001, "picked_up", "2024-12-01 12:00:00"],
          [2, 600100000001, "out_for_delivery", "2024-12-02 08:00:00"],
          [3, 600100000001, "delivered", "2024-12-02 13:00:00"],
          [4, 600100000002, "picked_up", "2024-12-01 15:00:00"],
          [5, 600100000002, "out_for_delivery", "2024-12-02 08:30:00"],
          [6, 600100000002, "failed_attempt", "2024-12-02 17:00:00"],
          [7, 600100000002, "out_for_delivery", "2024-12-03 08:10:00"],
          [8, 600100000002, "delivered", "2024-12-03 11:20:00"],
          [9, 600100000003, "picked_up", "2024-12-02 16:00:00"],
          [10, 600100000004, "picked_up", "2024-12-02 10:00:00"],
          [11, 600100000004, "out_for_delivery", "2024-12-04 09:00:00"],
          [12, 600100000004, "failed_attempt", "2024-12-04 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 10);
      const cities = sample(rng, ["Pune", "Kochi", "Jaipur", "Indore"], ri(rng, 1, 3));
      const ships = seq(1, n).map((i) => [600100000000 + i, pick(rng, cities), dateBetween(rng, "2024-12-01", "2024-12-03")]);
      const scans: Cell[][] = [];
      let id = 1;
      for (const s of ships) {
        let t = at(s[2] as string, 12, 0);
        const push = (type: string) => {
          scans.push([id++, s[0]!, type, t]);
          t = addMinutes(t, ri(rng, 60, 900));
        };
        if (!chance(rng, 0.85)) continue;
        push("picked_up");
        if (chance(rng, 0.3)) push("in_hub");
        if (!chance(rng, 0.8)) continue;
        push("out_for_delivery");
        if (chance(rng, 0.35)) {
          push("failed_attempt");
          if (!chance(rng, 0.6)) continue;
          push("out_for_delivery");
        }
        if (chance(rng, 0.8)) push("delivered");
      }
      return { Shipment: ships, Scan: scans };
    },
    solution: [
      "WITH per_shipment AS (",
      "  SELECT s.awb, s.dest_city,",
      "         MAX(CASE WHEN c.scan_type = 'picked_up' THEN 1 ELSE 0 END) AS picked,",
      "         MAX(CASE WHEN c.scan_type = 'out_for_delivery' THEN 1 ELSE 0 END) AS ofd,",
      "         MAX(CASE WHEN c.scan_type = 'delivered' THEN 1 ELSE 0 END) AS done,",
      "         MAX(CASE WHEN c.scan_type = 'failed_attempt' THEN 1 ELSE 0 END) AS failed",
      "  FROM Shipment s",
      "  LEFT JOIN Scan c ON c.awb = s.awb",
      "  GROUP BY s.awb, s.dest_city",
      ")",
      "SELECT dest_city AS city,",
      "       COUNT(*) AS booked,",
      "       SUM(picked) AS picked_up,",
      "       SUM(ofd) AS out_for_delivery,",
      "       SUM(done) AS delivered,",
      "       ROUND(100 * SUM(CASE WHEN done = 1 AND failed = 0 THEN 1 ELSE 0 END) / NULLIF(SUM(done), 0), 2) AS first_attempt_pct",
      "FROM per_shipment",
      "GROUP BY dest_city",
      "ORDER BY city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.dest_city AS city,",
        "       COUNT(*) AS booked,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'picked_up') THEN 1 ELSE 0 END) AS picked_up,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'out_for_delivery') THEN 1 ELSE 0 END) AS out_for_delivery,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'delivered') THEN 1 ELSE 0 END) AS delivered,",
        "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'delivered')",
        "                             AND NOT EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'failed_attempt') THEN 1 ELSE 0 END)",
        "             / NULLIF(SUM(CASE WHEN EXISTS (SELECT 1 FROM Scan c WHERE c.awb = s.awb AND c.scan_type = 'delivered') THEN 1 ELSE 0 END), 0), 2) AS first_attempt_pct",
        "FROM Shipment s",
        "GROUP BY s.dest_city",
        "ORDER BY city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Counting scans per city would count a shipment twice when it went out for delivery twice — reduce to one row per shipment first.",
      "Per shipment, `MAX(CASE WHEN scan_type = '…' THEN 1 ELSE 0 END)` says whether it ever reached that stage.",
      "Keep shipments with no scans at all: they are booked but nothing else.",
      "The first-attempt rate divides by delivered shipments — guard that denominator.",
    ],
    editorial: [
      "The trap is double counting: a shipment that failed once goes out for delivery twice, so counting `out_for_delivery` scans per city overstates the funnel. Work in **two levels**. First, one row per shipment: LEFT JOIN `Scan` (so a booked shipment with no scans survives) and turn each stage into a 0/1 flag with `MAX(CASE WHEN scan_type = '…' THEN 1 ELSE 0 END)` — the maximum is 1 if *any* scan of that type exists.",
      "",
      "Second, aggregate the flags per destination city: `COUNT(*)` is booked, and `SUM` of each flag counts shipments reaching that stage. The first-attempt numerator is shipments delivered **and** never failed — a `CASE` over two flags — and the denominator is delivered shipments, wrapped in `NULLIF(…, 0)` so a city with no deliveries gets NULL rather than an error. Round to two decimals.",
      "",
      "The alternative asks each question with `EXISTS` subqueries per shipment — no double counting by construction, but five probes into `Scan` per shipment. The flag table reads the scans once and is the usual way to build a funnel.",
    ].join("\n"),
  },

  {
    slug: "double-booked-self-drive-rental-cars",
    title: "Double-Booked Self-Drive Rental Cars",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "A self-drive car rental app found that a sync bug let two customers book the same car for overlapping times. Two **confirmed** bookings of one car overlap when each starts **before** the other ends; a booking that starts exactly when another ends is a clean handover, not an overlap. Cancelled bookings never clash.",
      "",
      "Return every clashing pair once, with `vehicle_id`, `booking_a` and `booking_b` (the two booking ids, `booking_a < booking_b`) and `overlap_minutes` (the length of the shared time). Order by `vehicle_id`, `booking_a`, `booking_b`.",
    ].join("\n"),
    tables: [
      {
        name: "RentalBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "vehicle_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "start_at", type: "datetime" },
          { name: "end_at", type: "datetime" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "`end_at` is always after `start_at`.",
      },
    ],
    examples: [
      {
        RentalBooking: [
          [1, 50, 901, "2024-12-20 09:00:00", "2024-12-20 18:00:00", "confirmed"],
          [2, 50, 902, "2024-12-20 15:00:00", "2024-12-21 10:00:00", "confirmed"],
          [3, 50, 903, "2024-12-21 10:00:00", "2024-12-21 20:00:00", "confirmed"],
          [4, 51, 904, "2024-12-20 08:00:00", "2024-12-22 08:00:00", "confirmed"],
          [5, 51, 905, "2024-12-21 12:00:00", "2024-12-21 14:30:00", "confirmed"],
          [6, 51, 906, "2024-12-21 13:00:00", "2024-12-21 16:00:00", "cancelled"],
          [7, 52, 907, "2024-12-20 10:00:00", "2024-12-20 12:00:00", "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 16);
      const cars = ri(rng, 1, 4);
      return {
        RentalBooking: seq(1, n).map((id) => {
          const s = at(pick(rng, ["2024-12-20", "2024-12-21", "2024-12-22"]), pick(rng, [6, 8, 10, 12, 14, 16]), pick(rng, [0, 30]));
          return [id, 50 + ri(rng, 0, cars - 1), 900 + id, s, addMinutes(s, pick(rng, [60, 120, 240, 480, 1440])), chance(rng, 0.85) ? "confirmed" : "cancelled"];
        }),
      };
    },
    solution: [
      "SELECT a.vehicle_id, a.booking_id AS booking_a, b.booking_id AS booking_b,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.start_at, b.start_at), LEAST(a.end_at, b.end_at)) AS overlap_minutes",
      "FROM RentalBooking a",
      "JOIN RentalBooking b",
      "  ON b.vehicle_id = a.vehicle_id",
      " AND a.booking_id < b.booking_id",
      " AND a.start_at < b.end_at",
      " AND b.start_at < a.end_at",
      "WHERE a.status = 'confirmed' AND b.status = 'confirmed'",
      "ORDER BY a.vehicle_id, booking_a, booking_b",
    ].join("\n"),
    alternatives: [
      [
        "WITH c AS (SELECT booking_id, vehicle_id, start_at, end_at FROM RentalBooking WHERE status <> 'cancelled')",
        "SELECT a.vehicle_id, a.booking_id AS booking_a, b.booking_id AS booking_b,",
        "       TIMESTAMPDIFF(MINUTE,",
        "         CASE WHEN a.start_at > b.start_at THEN a.start_at ELSE b.start_at END,",
        "         CASE WHEN a.end_at < b.end_at THEN a.end_at ELSE b.end_at END) AS overlap_minutes",
        "FROM c a CROSS JOIN c b",
        "WHERE a.vehicle_id = b.vehicle_id AND a.booking_id < b.booking_id",
        "  AND NOT (a.end_at <= b.start_at OR b.end_at <= a.start_at)",
        "ORDER BY a.vehicle_id, a.booking_id, b.booking_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare every booking with every other booking of the same car: a self join.",
      "Two intervals overlap exactly when each one starts before the other ends.",
      "`a.booking_id < b.booking_id` reports each pair once and never pairs a booking with itself.",
      "The shared time runs from the later start to the earlier end.",
    ],
    editorial: [
      "Overlap questions pair rows of one table, so join `RentalBooking` to itself on the same `vehicle_id`. The condition `a.booking_id < b.booking_id` does double duty: it never pairs a booking with itself and it reports each clashing pair once instead of twice.",
      "",
      "The **overlap test** is the one to remember: intervals `[s1, e1)` and `[s2, e2)` overlap exactly when `s1 < e2 AND s2 < e1`. It covers every shape — partial overlap, one booking inside another, identical times — and the strict `<` makes a handover (one ends at 10:00, the next starts at 10:00) not a clash. The negated form `NOT (e1 <= s2 OR e2 <= s1)` says \"neither is entirely before the other\", which is the same thing.",
      "",
      "The shared stretch starts at the later of the two starts and ends at the earlier of the two ends: `GREATEST(start…)` and `LEAST(end…)`, or the equivalent `CASE` expressions, measured with `TIMESTAMPDIFF(MINUTE, …)`. Both status filters must be applied to both sides. The self join is quadratic per car; sorting each car's bookings by start and comparing neighbours would scale better for large fleets.",
    ].join("\n"),
  },

  {
    slug: "daily-hub-backlog-including-empty-days",
    title: "Daily Sorting-Hub Backlog Including Days With None",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Subqueries"],
    description: [
      "A parcel is in the hub's **backlog at the end of a day** when it arrived on or before that day and had not been dispatched by then — `dispatched_on` is NULL, or later than that day. A parcel dispatched on the day it arrived is never in the backlog.",
      "",
      "For **every day from 2024-07-01 to 2024-07-10** (all ten days, even when the backlog is 0), return `day`, `backlog` (parcels in the backlog at the end of the day) and `ageing` (backlog parcels that arrived **more than 2 days** before that day). Order by `day`.",
    ].join("\n"),
    tables: [
      {
        name: "HubParcel",
        columns: [
          { name: "parcel_id", type: "int" },
          { name: "hub_code", type: "varchar" },
          { name: "arrived_on", type: "date" },
          { name: "dispatched_on", type: "date" },
        ],
        primaryKey: ["parcel_id"],
        note: "One row per parcel inbound at the sorting hub. `dispatched_on` is NULL while the parcel is still there.",
      },
    ],
    examples: [
      {
        HubParcel: [
          [1, "BLR-HSK", "2024-06-29", "2024-07-01"],
          [2, "BLR-HSK", "2024-07-01", "2024-07-01"],
          [3, "BLR-HSK", "2024-07-02", null],
          [4, "BLR-HSK", "2024-07-03", "2024-07-04"],
          [5, "BLR-HSK", "2024-07-05", "2024-07-06"],
          [6, "BLR-HSK", "2024-07-11", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      return {
        HubParcel: seq(1, n).map((id) => {
          const a = dateBetween(rng, "2024-06-26", "2024-07-11");
          const d = chance(rng, 0.2) ? null : addDays(a, pick(rng, [0, 0, 1, 2, 3, 5, 8]));
          return [id, "BLR-HSK", a, d];
        }),
      };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT CAST('2024-07-01' AS DATE) AS day",
      "  UNION ALL",
      "  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM days WHERE day < '2024-07-10'",
      ")",
      "SELECT d.day,",
      "       COUNT(p.parcel_id) AS backlog,",
      "       SUM(CASE WHEN DATEDIFF(d.day, p.arrived_on) > 2 THEN 1 ELSE 0 END) AS ageing",
      "FROM days d",
      "LEFT JOIN HubParcel p",
      "  ON p.arrived_on <= d.day",
      " AND (p.dispatched_on IS NULL OR p.dispatched_on > d.day)",
      "GROUP BY d.day",
      "ORDER BY d.day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days (n, day) AS (",
        "  SELECT 1, CAST('2024-07-01' AS DATE)",
        "  UNION ALL",
        "  SELECT n + 1, DATE_ADD(day, INTERVAL 1 DAY) FROM days WHERE n < 10",
        ")",
        "SELECT day,",
        "       (SELECT COUNT(*) FROM HubParcel p WHERE p.arrived_on <= d.day AND COALESCE(p.dispatched_on, '9999-12-31') > d.day) AS backlog,",
        "       (SELECT COUNT(*) FROM HubParcel p WHERE p.arrived_on < DATE_SUB(d.day, INTERVAL 2 DAY) AND COALESCE(p.dispatched_on, '9999-12-31') > d.day) AS ageing",
        "FROM days d",
        "ORDER BY day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days with no backlog have no rows anywhere — you need to generate the ten dates yourself.",
      "A recursive CTE can produce a date series: start at 2024-07-01 and add a day until 2024-07-10.",
      "A parcel belongs to a day when that day falls in its stay; write that as a join condition, minding the NULL dispatch.",
      "`COUNT` a column of the parcel side so a day with no match shows 0.",
    ],
    editorial: [
      "The output must have a row for every day, but a day with an empty hub has no data to group — so generate the calendar. A **recursive CTE** starts from `CAST('2024-07-01' AS DATE)` and adds `DATE_ADD(day, INTERVAL 1 DAY)` until the 10th: ten rows, bounded by the `WHERE` in the recursive step.",
      "",
      "Then LEFT JOIN parcels to days with the **stay** as the join condition: arrived on or before the day, and either never dispatched (`dispatched_on IS NULL`) or dispatched after it. A same-day dispatch fails `dispatched_on > day` on its only candidate day, so it never counts. `COUNT(p.parcel_id)` gives 0 for a day nothing matched, and `ageing` adds a `CASE` on `DATEDIFF(day, arrived_on) > 2`; on an unmatched day that `CASE` sees NULL and adds 0.",
      "",
      "The alternative counts with two correlated subqueries per day and replaces the NULL test with `COALESCE(dispatched_on, '9999-12-31')` — a far-future sentinel that is \"after\" every day. It also shows a counter column to stop recursion. Either way the cost is ten passes (or one join) over the parcels.",
    ].join("\n"),
  },
];
