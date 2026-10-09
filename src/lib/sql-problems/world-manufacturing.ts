import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad2 = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' at a given hour and minute. */
const at = (date: string, h: number, m: number) => `${date} ${pad2(h)}:${pad2(m)}:00`;
/** A datetime `mins` minutes after 'YYYY-MM-DD HH:MM:SS' (UTC arithmetic, no time zones in the data). */
function plusMinutes(dt: string, mins: number): string {
  const d = new Date(Date.parse(`${dt.replace(" ", "T")}Z`) + mins * 60_000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

const MACHINE_TYPES = ["CNC", "Press", "Lathe", "Welder", "Moulder"] as const;
const PLANT_CODES = ["PUN", "CHN", "HSR", "AMD", "NSK"] as const;
const PART_NOS = ["BRK-110", "GSK-204", "SHF-330", "VLV-415", "PIN-520", "HUB-610"] as const;
const SENSOR_TYPES = ["temperature", "vibration", "pressure", "current"] as const;
const LINES = ["L1-ASSY", "L2-ASSY", "L3-PAINT", "L4-WELD", "L5-PACK"] as const;
const PRODUCTS = ["BR-DISC", "GEAR-12T", "AXLE-S", "PISTON-80", "VALVE-HP"] as const;
const STATIONS = [
  ["Koramangala Hub", "Bengaluru"], ["Hinjewadi Fast", "Pune"], ["BKC Plaza", "Mumbai"], ["Cyber City", "Gurugram"],
  ["OMR Tech Park", "Chennai"], ["HITEC Point", "Hyderabad"], ["Salt Lake V", "Kolkata"], ["Electronic City", "Bengaluru"],
] as const;

/**
 * Manufacturing, IoT and energy: production lines and work orders, machine
 * downtime and OEE, batch defect rates and dimensional inspections, sensor
 * readings and threshold breaches, calibration and maintenance schedules,
 * solar plants' daily generation and EV charging sessions — the questions a
 * plant's production engineer, a reliability team or an energy analyst asks
 * of the shop-floor data. Easiest first.
 */
export const WORLD_MANUFACTURING: SqlProblemSpec[] = [
  {
    slug: "machines-overdue-for-calibration",
    title: "Machines Overdue for Calibration on Audit Day",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "A quality auditor visits the plant on **2025-01-15**. Every machine must be recalibrated every `calibration_interval_days` days after its last calibration; its due date is `last_calibrated` plus that many days.",
      "",
      "Return every machine that is **overdue** on the audit day: its due date is **strictly before** 2025-01-15, or it has never been calibrated (`last_calibrated` is NULL). A machine due on the audit day itself is not overdue. Return `machine_id`, `asset_tag` and `due_date` (NULL for a machine never calibrated), ordered by `machine_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Machine",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "asset_tag", type: "varchar" },
          { name: "machine_type", type: "enum", values: [...MACHINE_TYPES] },
          { name: "last_calibrated", type: "date" },
          { name: "calibration_interval_days", type: "int" },
        ],
        primaryKey: ["machine_id"],
        note: "One row per machine on the shop floor. `last_calibrated` is NULL for a machine that has never been calibrated since it was installed.",
      },
    ],
    examples: [
      {
        Machine: [
          [1, "PUN-CNC-0007", "CNC", "2024-06-10", 180],
          [2, "PUN-PRS-0012", "Press", "2024-12-01", 90],
          [3, "PUN-LTH-0003", "Lathe", null, 365],
          [4, "PUN-WLD-0021", "Welder", "2024-10-17", 90],
          [5, "PUN-CNC-0008", "CNC", "2024-07-19", 180],
          [6, "PUN-MLD-0002", "Moulder", "2023-12-20", 365],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows = seq(1, n).map((id) => {
        const type = pick(rng, MACHINE_TYPES);
        const interval = pick(rng, [90, 180, 365] as const);
        let last: string | null = chance(rng, 0.15) ? null : dateBetween(rng, "2023-11-01", "2025-01-10");
        // Due exactly on the audit day — the boundary "strictly before" is about.
        if (last && chance(rng, 0.2)) last = addDays("2025-01-15", -interval);
        return [id, `PUN-${type.slice(0, 3).toUpperCase()}-${String(ri(rng, 1, 99)).padStart(4, "0")}`, type, last, interval];
      });
      return { Machine: rows };
    },
    solution: [
      "SELECT machine_id, asset_tag,",
      "       DATE_ADD(last_calibrated, INTERVAL calibration_interval_days DAY) AS due_date",
      "FROM Machine",
      "WHERE last_calibrated IS NULL",
      "   OR DATE_ADD(last_calibrated, INTERVAL calibration_interval_days DAY) < '2025-01-15'",
      "ORDER BY machine_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT machine_id, asset_tag, DATE_ADD(last_calibrated, INTERVAL calibration_interval_days DAY) AS due_date",
        "FROM Machine",
        "WHERE COALESCE(DATEDIFF('2025-01-15', last_calibrated) > calibration_interval_days, 1) = 1",
        "ORDER BY machine_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The due date is a date plus a number of days that differs per row — `DATE_ADD` takes a column as the interval.",
      "A NULL calibration date makes the due date NULL, and a comparison with NULL is never true — handle that case on its own.",
      "Strictly before means a machine due on the audit day stays off the list.",
    ],
    editorial: [
      "The due date of each machine is `DATE_ADD(last_calibrated, INTERVAL calibration_interval_days DAY)` — the interval can be a column, so each row gets its own date. A machine is overdue when that date is earlier than the audit day; because the dates are compared as dates, `< '2025-01-15'` keeps a machine due on the 14th and drops one due on the 15th, which is exactly the \"strictly before\" rule.",
      "",
      "The trap is the machine that was never calibrated. Its `last_calibrated` is NULL, so its due date is NULL too, and `NULL < '2025-01-15'` is unknown — a WHERE clause drops it. The statement counts it as overdue, so it needs its own `last_calibrated IS NULL` branch. Selecting the same expression as `due_date` prints NULL for those rows without any extra work.",
      "",
      "The alternative counts days instead: `DATEDIFF('2025-01-15', last_calibrated)` is the age of the calibration, overdue when it exceeds the interval, and `COALESCE(…, 1)` turns the NULL comparison into a yes. It is one pass over the table either way.",
    ].join("\n"),
  },

  {
    slug: "dimensional-inspection-pass-rework-scrap",
    title: "Dimensional Inspection: Pass, Rework or Scrap",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The quality lab measures one critical dimension of every sampled part with a gauge, in microns. A part's **deviation** is the absolute difference between `measured_um` and `nominal_um`.",
      "",
      "Return `check_id`, `part_no` and `verdict` for every check, where `verdict` is `'PASS'` when the deviation is at most `tolerance_um`, `'REWORK'` when it is more than the tolerance but at most twice the tolerance, `'SCRAP'` when it is more than twice the tolerance, and `'RECHECK'` when the gauge reading is missing (`measured_um` is NULL). Order the rows by `check_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DimensionCheck",
        columns: [
          { name: "check_id", type: "int" },
          { name: "part_no", type: "varchar" },
          { name: "nominal_um", type: "int" },
          { name: "measured_um", type: "int" },
          { name: "tolerance_um", type: "int" },
        ],
        primaryKey: ["check_id"],
        note: "One gauge check of one sampled part. All sizes are in microns; `measured_um` is NULL when the gauge reading was not captured.",
      },
    ],
    examples: [
      {
        DimensionCheck: [
          [1, "SHF-330", 25000, 25012, 20],
          [2, "SHF-330", 25000, 24980, 20],
          [3, "VLV-415", 12500, 12541, 20],
          [4, "VLV-415", 12500, 12540, 20],
          [5, "PIN-520", 8000, null, 10],
          [6, "PIN-520", 8000, 7985, 10],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      return {
        DimensionCheck: seq(1, n).map((id) => {
          const nominal = pick(rng, [8000, 12500, 25000, 40000] as const);
          const tol = pick(rng, [10, 20, 25, 50] as const);
          // Deviations often land exactly on a boundary (tol or 2·tol).
          const dev = chance(rng, 0.35) ? pick(rng, [tol, 2 * tol, 0]) : ri(rng, 0, 3 * tol);
          const measured = chance(rng, 0.12) ? null : nominal + (chance(rng, 0.5) ? dev : -dev);
          return [id, pick(rng, PART_NOS), nominal, measured, tol];
        }),
      };
    },
    solution: [
      "SELECT check_id, part_no,",
      "       CASE",
      "         WHEN measured_um IS NULL THEN 'RECHECK'",
      "         WHEN ABS(measured_um - nominal_um) <= tolerance_um THEN 'PASS'",
      "         WHEN ABS(measured_um - nominal_um) <= 2 * tolerance_um THEN 'REWORK'",
      "         ELSE 'SCRAP'",
      "       END AS verdict",
      "FROM DimensionCheck",
      "ORDER BY check_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT check_id, part_no,",
        "       IF(measured_um IS NULL, 'RECHECK',",
        "          IF(GREATEST(measured_um - nominal_um, nominal_um - measured_um) <= tolerance_um, 'PASS',",
        "             IF(GREATEST(measured_um - nominal_um, nominal_um - measured_um) <= 2 * tolerance_um, 'REWORK', 'SCRAP'))) AS verdict",
        "FROM DimensionCheck",
        "ORDER BY check_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A part can be over or under size; the absolute value of the difference measures both the same way.",
      "A CASE expression tries its branches top to bottom and stops at the first true one — order the bands from tightest to loosest.",
      "Where should the NULL reading go so that it never falls through to `'SCRAP'`?",
    ],
    editorial: [
      "Every row gets a label, so this is a CASE expression in the SELECT list rather than a filter. The deviation is `ABS(measured_um - nominal_um)` — a part 12 microns under size is as far out as one 12 microns over.",
      "",
      "CASE evaluates its WHEN branches in order and returns the first one that is true, so the bands can be written as plain upper bounds: at most the tolerance is a pass, otherwise at most twice the tolerance is rework, otherwise scrap. Using `<=` keeps a deviation exactly equal to a limit inside the better band, as the statement says.",
      "",
      "The missing reading must be tested first. With `measured_um` NULL every comparison is unknown, no branch matches, and the ELSE would wrongly scrap the part. Putting `measured_um IS NULL` at the top gives it `'RECHECK'`. Storing sizes as integer microns also keeps the comparisons exact — decimal millimetres held as floating point could put 10.05 − 10.00 a hair above 0.05. Nested IF calls with GREATEST in place of ABS give the same labels; either way it is one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "sensors-silent-through-january",
    title: "Sensors Silent Through January",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Each machine carries IoT sensors that push readings to the plant historian. A reading whose `value` is NULL is a dropped packet — the gateway saw the sensor but no measurement arrived — and does not count as the sensor reporting.",
      "",
      "Return every sensor that sent **no valid reading in January 2025** (from 2025-01-01 00:00:00 up to, but not including, 2025-02-01 00:00:00), with the columns `sensor_id` and `machine_id`. Readings outside January change nothing. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Sensor",
        columns: [
          { name: "sensor_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "sensor_type", type: "enum", values: [...SENSOR_TYPES] },
        ],
        primaryKey: ["sensor_id"],
        note: "One row per installed sensor.",
      },
      {
        name: "SensorReading",
        columns: [
          { name: "reading_id", type: "int" },
          { name: "sensor_id", type: "int" },
          { name: "read_at", type: "datetime" },
          { name: "value", type: "decimal" },
        ],
        primaryKey: ["reading_id"],
        note: "`value` is NULL for a dropped packet. `sensor_id` is always in `Sensor`.",
      },
    ],
    examples: [
      {
        Sensor: [
          [11, 1, "temperature"],
          [12, 1, "vibration"],
          [13, 2, "pressure"],
          [14, 3, "current"],
          [15, 3, "temperature"],
        ],
        SensorReading: [
          [1, 11, "2025-01-03 08:15:00", 71.5],
          [2, 12, "2024-12-31 23:59:59", 2.4],
          [3, 12, "2025-02-01 00:00:00", 2.6],
          [4, 13, "2025-01-20 14:00:00", null],
          [5, 14, "2025-01-31 23:59:00", 12.8],
          [6, 11, "2025-01-09 10:00:00", 72.1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const ids = seq(11, n);
      const sensors = ids.map((id) => [id, ri(rng, 1, 5), pick(rng, SENSOR_TYPES)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const edges = ["2024-12-31 23:59:59", "2025-01-01 00:00:00", "2025-02-01 00:00:00", "2025-01-31 23:59:59"];
      const readings = seq(1, m).map((id) => [
        id,
        pick(rng, ids),
        chance(rng, 0.25) ? pick(rng, edges) : atTime(rng, dateBetween(rng, "2024-12-25", "2025-02-05")),
        chance(rng, 0.2) ? null : roundTo(rng, 10, 900, 1) / 10,
      ]);
      return { Sensor: sensors, SensorReading: readings };
    },
    solution: [
      "SELECT s.sensor_id, s.machine_id",
      "FROM Sensor s",
      "LEFT JOIN SensorReading r",
      "  ON r.sensor_id = s.sensor_id",
      " AND r.value IS NOT NULL",
      " AND r.read_at >= '2025-01-01 00:00:00'",
      " AND r.read_at < '2025-02-01 00:00:00'",
      "WHERE r.reading_id IS NULL",
    ].join("\n"),
    alternatives: [
      [
        "SELECT sensor_id, machine_id FROM Sensor s",
        "WHERE NOT EXISTS (SELECT 1 FROM SensorReading r WHERE r.sensor_id = s.sensor_id AND r.value IS NOT NULL",
        "                  AND r.read_at BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59')",
      ].join("\n"),
      [
        "SELECT sensor_id, machine_id FROM Sensor",
        "WHERE sensor_id NOT IN (SELECT sensor_id FROM SensorReading",
        "                        WHERE value IS NOT NULL AND YEAR(read_at) = 2025 AND MONTH(read_at) = 1)",
      ].join("\n"),
    ],
    hints: [
      "Start from `Sensor`: a silent sensor may have no reading rows at all.",
      "Only some readings count. With a LEFT JOIN, where must the January and non-NULL conditions go so that a sensor without a matching reading is kept?",
      "A half-open range, `>=` the first instant and `<` the next month's first instant, catches every second of the 31st.",
    ],
    editorial: [
      "This is an anti join with a condition on the joined side: a sensor is silent when no reading **that counts** exists for it. A LEFT JOIN from `Sensor` keeps every sensor, and the rows with no partner come back with NULL in every column of `SensorReading`; `WHERE r.reading_id IS NULL` keeps only those.",
      "",
      "The subtle part is where the conditions on the reading go. They must sit in the `ON` clause: there they decide which readings are allowed to match, so a sensor whose only reading was a dropped packet or came in February finds no partner and survives. Moved to WHERE, the same conditions would run after the join and throw away exactly the unmatched rows the question is about.",
      "",
      "January is the half-open interval from `2025-01-01 00:00:00` to `2025-02-01 00:00:00`, which needs no thought about the last second of the 31st. `NOT EXISTS` reads the rule most directly; `NOT IN` works here because `sensor_id` is never NULL in the subquery. With an index on `(sensor_id, read_at)` each form is one range lookup per sensor.",
    ].join("\n"),
  },

  {
    slug: "production-batches-over-two-percent-defects",
    title: "Production Batches Over Two Percent Defects",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "Every production batch records how many units were made and how many of them failed final inspection. The plant's quality target is a defect rate of at most 2%.",
      "",
      "Return the batches whose defect rate is **strictly greater than 2%**, with the columns `batch_id`, `product_code` and `defect_rate_pct` — the defective units as a percentage of the units produced, **rounded to two decimals**. A batch that produced 0 units (a cancelled run) is never in the answer. Order the rows by `defect_rate_pct` from highest to lowest, then by `batch_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ProductionBatch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "product_code", type: "varchar" },
          { name: "units_produced", type: "int" },
          { name: "defective_units", type: "int" },
        ],
        primaryKey: ["batch_id"],
        note: "One row per batch; `defective_units` is never more than `units_produced`.",
      },
    ],
    examples: [
      {
        ProductionBatch: [
          [501, "BR-DISC", 1200, 18],
          [502, "BR-DISC", 1500, 30],
          [503, "GEAR-12T", 800, 31],
          [504, "AXLE-S", 0, 0],
          [505, "GEAR-12T", 750, 24],
          [506, "PISTON-80", 2000, 41],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      return {
        ProductionBatch: seq(501, n).map((id) => {
          const units = chance(rng, 0.1) ? 0 : roundTo(rng, 300, 3000, 50);
          // Exactly 2% now and then — the boundary "strictly greater" excludes.
          const bad = units === 0 ? 0 : chance(rng, 0.2) ? units / 50 : ri(rng, 0, Math.floor(units * 0.05));
          return [id, pick(rng, PRODUCTS), units, bad];
        }),
      };
    },
    solution: [
      "SELECT batch_id, product_code,",
      "       ROUND(100 * defective_units / units_produced, 2) AS defect_rate_pct",
      "FROM ProductionBatch",
      "WHERE units_produced > 0",
      "  AND defective_units * 100 > units_produced * 2",
      "ORDER BY defect_rate_pct DESC, batch_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT batch_id, product_code, ROUND(defective_units * 100 / NULLIF(units_produced, 0), 2) AS defect_rate_pct",
        "FROM ProductionBatch",
        "WHERE defective_units * 50 > units_produced AND units_produced <> 0",
        "ORDER BY 3 DESC, 1",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The rate is defective units divided by units produced, times 100.",
      "Comparing whole numbers (`defective_units * 100 > units_produced * 2`) avoids any doubt about rounding at exactly 2%.",
      "Dividing by zero units is not a defect rate — keep those batches out before you divide.",
    ],
    editorial: [
      "The rate is `100 * defective_units / units_produced`; the question keeps the batches where it exceeds 2 and prints it rounded to two decimals. The cleanest filter avoids division altogether: multiplying both sides by the (positive) units gives `defective_units * 100 > units_produced * 2`, an exact integer comparison, so a batch at exactly 2% — 30 bad out of 1,500 — is reliably left out.",
      "",
      "A batch with zero units has no rate at all. MySQL returns NULL for a division by zero, and the integer test `0 > 0` is false anyway, but stating `units_produced > 0` makes the intent visible and protects the division in the SELECT list; `NULLIF(units_produced, 0)` in the alternative does the same job.",
      "",
      "The order is by the rounded rate, highest first, with `batch_id` breaking ties so equal rates always come out the same way. One scan of the table, then a sort of the few batches that failed.",
    ].join("\n"),
  },

  {
    slug: "machine-count-per-plant-from-asset-tags",
    title: "Machine Count per Plant From Asset Tags",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "The company's fixed-asset register gives every machine an asset tag of the form `PLANT-TYPE-NUMBER`, such as `PUN-CNC-0042`: the part before the first hyphen is the plant code. The register has no plant column of its own.",
      "",
      "Return each plant code with the number of machines tagged to it, as `plant_code` and `machine_count`. Order the rows by `machine_count` from highest to lowest, then by `plant_code` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "AssetRegister",
        columns: [
          { name: "asset_tag", type: "varchar" },
          { name: "model", type: "varchar" },
          { name: "commissioned_on", type: "date" },
        ],
        primaryKey: ["asset_tag"],
        note: "One row per machine. Plant codes are always three upper-case letters; the number part is four digits.",
      },
    ],
    examples: [
      {
        AssetRegister: [
          ["PUN-CNC-0042", "Haas VF-2", "2021-03-14"],
          ["PUN-PRS-0007", "Schuler 250T", "2019-08-02"],
          ["CHN-CNC-0011", "Mazak VCN-530", "2022-11-21"],
          ["AMD-WLD-0003", "Lincoln 350MP", "2023-01-09"],
          ["CHN-LTH-0005", "Ace LT-20", "2020-06-30"],
          ["PUN-WLD-0019", "Lincoln 350MP", "2024-02-12"],
          ["AMD-CNC-0020", "Haas VF-2", "2024-05-05"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 18);
      const plants = sample(rng, PLANT_CODES, ri(rng, 1, 5));
      const tags = new Set<string>();
      const rows: Cell[][] = [];
      for (let i = 0; i < n; i++) {
        const tag = `${pick(rng, plants)}-${pick(rng, ["CNC", "PRS", "LTH", "WLD", "MLD"])}-${String(ri(rng, 1, 60)).padStart(4, "0")}`;
        if (tags.has(tag)) continue;
        tags.add(tag);
        rows.push([tag, pick(rng, ["Haas VF-2", "Mazak VCN-530", "Schuler 250T", "Ace LT-20", "Lincoln 350MP"]), dateBetween(rng, "2018-01-01", "2024-12-31")]);
      }
      return { AssetRegister: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(asset_tag, '-', 1) AS plant_code, COUNT(*) AS machine_count",
      "FROM AssetRegister",
      "GROUP BY SUBSTRING_INDEX(asset_tag, '-', 1)",
      "ORDER BY machine_count DESC, plant_code",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(asset_tag, 3) AS plant_code, COUNT(*) AS machine_count FROM AssetRegister GROUP BY LEFT(asset_tag, 3) ORDER BY 2 DESC, 1",
      [
        "SELECT plant_code, COUNT(*) AS machine_count",
        "FROM (SELECT SUBSTRING(asset_tag, 1, LOCATE('-', asset_tag) - 1) AS plant_code FROM AssetRegister) t",
        "GROUP BY plant_code ORDER BY machine_count DESC, plant_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The plant is hidden inside the tag — extract it before you can group by it.",
      "`SUBSTRING_INDEX(s, '-', 1)` returns everything before the first hyphen.",
      "Group by the extracted code (an expression, or a column of a derived table) and count the rows.",
    ],
    editorial: [
      "There is no plant column, so the grouping key has to be computed from the tag. `SUBSTRING_INDEX(asset_tag, '-', 1)` returns the text before the first hyphen — `PUN` for `PUN-CNC-0042` — and grouping by that expression puts every machine of a plant in one group, where `COUNT(*)` counts them.",
      "",
      "MySQL lets the GROUP BY repeat the expression, or you can compute the code in a derived table and group by its column; both are the same plan. Because plant codes are always three letters, `LEFT(asset_tag, 3)` gives the same key — but it silently breaks the day a four-letter plant is added, which is why splitting on the delimiter is the safer habit. `LOCATE` + `SUBSTRING` is the long-hand form of the same split.",
      "",
      "The order is by count, highest first, and plants with equal counts are listed alphabetically so the output is fixed. One scan, one hash aggregation over a handful of plants.",
    ].join("\n"),
  },

  {
    slug: "ev-charging-energy-delivered-per-station",
    title: "EV Charging Energy Delivered per Station",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "A charge-point operator runs public EV charging stations. A session ends as `completed`, `interrupted` (the car left early but energy was delivered) or `failed` (the charger never started, no energy).",
      "",
      "Return every station with `station_id`, `station_name`, `sessions` — the number of its **completed or interrupted** sessions — and `total_kwh`, the energy of those sessions summed and **rounded to one decimal**. A station with no such session must still appear, with `sessions` 0 and `total_kwh` 0. Order by `total_kwh` from highest to lowest, then by `station_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ChargingStation",
        columns: [
          { name: "station_id", type: "int" },
          { name: "station_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["station_id"],
      },
      {
        name: "ChargingSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "station_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "energy_kwh", type: "decimal" },
          { name: "status", type: "enum", values: ["completed", "interrupted", "failed"] },
        ],
        primaryKey: ["session_id"],
        note: "`energy_kwh` is 0 for a failed session. `station_id` is always in `ChargingStation`.",
      },
    ],
    examples: [
      {
        ChargingStation: [
          [1, "Koramangala Hub", "Bengaluru"],
          [2, "Hinjewadi Fast", "Pune"],
          [3, "BKC Plaza", "Mumbai"],
          [4, "Cyber City", "Gurugram"],
        ],
        ChargingSession: [
          [101, 1, "2024-11-02 09:12:00", 24.5, "completed"],
          [102, 1, "2024-11-02 13:40:00", 8.2, "interrupted"],
          [103, 2, "2024-11-03 18:05:00", 0, "failed"],
          [104, 3, "2024-11-03 19:30:00", 32.7, "completed"],
          [105, 2, "2024-11-04 07:55:00", 0, "failed"],
          [106, 3, "2024-11-04 21:10:00", 0, "failed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const stations = sample(rng, STATIONS, n).map((s, i) => [i + 1, s[0], s[1]]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 20);
      const sessions = seq(101, m).map((id) => {
        const status = pick(rng, ["completed", "completed", "interrupted", "failed"] as const);
        const kwh = status === "failed" ? 0 : roundTo(rng, 20, 600, 1) / 10;
        return [id, ri(rng, 1, n), atTime(rng, dateBetween(rng, "2024-11-01", "2024-11-30")), kwh, status];
      });
      return { ChargingStation: stations, ChargingSession: sessions };
    },
    solution: [
      "SELECT st.station_id, st.station_name,",
      "       COUNT(se.session_id) AS sessions,",
      "       ROUND(COALESCE(SUM(se.energy_kwh), 0), 1) AS total_kwh",
      "FROM ChargingStation st",
      "LEFT JOIN ChargingSession se",
      "  ON se.station_id = st.station_id AND se.status IN ('completed', 'interrupted')",
      "GROUP BY st.station_id, st.station_name",
      "ORDER BY total_kwh DESC, st.station_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT st.station_id, st.station_name,",
        "       SUM(CASE WHEN se.status <> 'failed' THEN 1 ELSE 0 END) AS sessions,",
        "       ROUND(SUM(CASE WHEN se.status <> 'failed' THEN se.energy_kwh ELSE 0 END), 1) AS total_kwh",
        "FROM ChargingStation st LEFT JOIN ChargingSession se ON se.station_id = st.station_id",
        "GROUP BY st.station_id, st.station_name",
        "ORDER BY total_kwh DESC, st.station_id",
      ].join("\n"),
      [
        "SELECT station_id, station_name,",
        "       (SELECT COUNT(*) FROM ChargingSession se WHERE se.station_id = st.station_id AND se.status <> 'failed') AS sessions,",
        "       ROUND((SELECT COALESCE(SUM(energy_kwh), 0) FROM ChargingSession se WHERE se.station_id = st.station_id AND se.status <> 'failed'), 1) AS total_kwh",
        "FROM ChargingStation st",
        "ORDER BY total_kwh DESC, station_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every station appears, sessions or not — which side of the join must be kept whole?",
      "If you filter out failed sessions in WHERE after a LEFT JOIN, what happens to a station whose only sessions failed?",
      "`COUNT(column)` skips NULLs, `SUM` of nothing is NULL — use that, and COALESCE where needed.",
    ],
    editorial: [
      "Every station must be listed, so the query starts from `ChargingStation` and LEFT JOINs its sessions. The condition that only completed and interrupted sessions count belongs in the `ON` clause: there it decides which sessions match, and a station whose sessions all failed still comes through once, with NULLs on the session side. The same test in WHERE would remove that station entirely — the classic way a LEFT JOIN quietly becomes an inner join.",
      "",
      "After grouping by the station, `COUNT(se.session_id)` counts only real matches (it skips the NULL of an unmatched row, where `COUNT(*)` would say 1), and `SUM(se.energy_kwh)` is NULL for a station with nothing — `COALESCE` turns it into 0. Rounding the sum to one decimal keeps floating-point noise from the decimal column out of the answer.",
      "",
      "Conditional aggregation (summing a CASE over all sessions) or two correlated subqueries per station give the same rows. The order is by energy, highest first, with `station_id` as the tie-break, so stations at 0 kWh come out in id order.",
    ].join("\n"),
  },

  {
    slug: "solar-plant-monthly-generation-2024",
    title: "Solar Plant Monthly Generation in 2024",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation"],
    description: [
      "Each solar plant reports the energy it exported to the grid once a day. The data covers late 2023 to early 2025, but the annual report is for calendar year **2024** only.",
      "",
      "Return `plant_id`, `month` (as text in the form `'YYYY-MM'`, e.g. `'2024-03'`) and `total_kwh`, the sum of the day readings of that plant in that month, for every plant and month of 2024 that has at least one reading. Order by `plant_id`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "DailyGeneration",
        columns: [
          { name: "plant_id", type: "int" },
          { name: "reading_date", type: "date" },
          { name: "kwh", type: "int" },
        ],
        primaryKey: ["plant_id", "reading_date"],
        note: "One row per plant per day it reported; days without a report have no row.",
      },
    ],
    examples: [
      {
        DailyGeneration: [
          [1, "2023-12-31", 4120],
          [1, "2024-01-01", 3980],
          [1, "2024-01-15", 4310],
          [1, "2024-02-02", 4555],
          [2, "2024-01-20", 8840],
          [2, "2024-12-31", 7020],
          [2, "2025-01-01", 6900],
        ],
      },
    ],
    gen: (rng) => {
      const plants = seq(1, ri(rng, 1, 3));
      const rows: Cell[][] = [];
      const seen = new Set<string>();
      const edges = ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"];
      for (let i = 0; i < ri(rng, 0, 20); i++) {
        const p = pick(rng, plants);
        const d = chance(rng, 0.25) ? pick(rng, edges) : dateBetween(rng, "2023-11-15", "2025-02-10");
        if (seen.has(`${p}${d}`)) continue;
        seen.add(`${p}${d}`);
        rows.push([p, d, roundTo(rng, 1500, 9500, 10)]);
      }
      return { DailyGeneration: rows };
    },
    solution: [
      "SELECT plant_id, DATE_FORMAT(reading_date, '%Y-%m') AS month, SUM(kwh) AS total_kwh",
      "FROM DailyGeneration",
      "WHERE reading_date >= '2024-01-01' AND reading_date < '2025-01-01'",
      "GROUP BY plant_id, DATE_FORMAT(reading_date, '%Y-%m')",
      "ORDER BY plant_id, month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT plant_id, CONCAT(YEAR(reading_date), '-', LPAD(MONTH(reading_date), 2, '0')) AS month, SUM(kwh) AS total_kwh",
        "FROM DailyGeneration WHERE YEAR(reading_date) = 2024",
        "GROUP BY plant_id, CONCAT(YEAR(reading_date), '-', LPAD(MONTH(reading_date), 2, '0'))",
        "ORDER BY plant_id, month",
      ].join("\n"),
      [
        "SELECT plant_id, LEFT(reading_date, 7) AS month, SUM(kwh) AS total_kwh",
        "FROM DailyGeneration WHERE reading_date BETWEEN '2024-01-01' AND '2024-12-31'",
        "GROUP BY plant_id, LEFT(reading_date, 7) ORDER BY 1, 2",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Restrict the rows to 2024 before grouping — the first and last days of the year are the edges to check.",
      "`DATE_FORMAT(d, '%Y-%m')` turns a date into its month as text, which is also a good grouping key.",
      "Group by the plant and the month together.",
    ],
    editorial: [
      "Two steps: keep the 2024 rows, then bucket them by month. The filter `reading_date >= '2024-01-01' AND reading_date < '2025-01-01'` is a half-open range on the date column itself, so 31 December 2023 and 1 January 2025 fall outside while both edge days of 2024 stay in — and an index on the date could serve it, which `YEAR(reading_date) = 2024` cannot.",
      "",
      "`DATE_FORMAT(reading_date, '%Y-%m')` maps every day to its month as `'2024-01'`; grouping by the plant and that expression gives one bucket per plant-month, and `SUM(kwh)` adds up its days. Months with no readings simply have no rows, which is what the statement asks for. The text form also sorts chronologically, so ordering by it is correct.",
      "",
      "Building the label from `YEAR` and `LPAD(MONTH(…), 2, '0')`, or taking the first seven characters of the date, are equivalent. One scan and a small aggregation.",
    ].join("\n"),
  },

  {
    slug: "completed-work-orders-good-units-per-line",
    title: "Completed Work Orders and Good Units per Line",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The MES (manufacturing execution system) tracks work orders on each assembly line. `good_qty` is filled in only once an order is completed; it is NULL while an order is planned, running or cancelled.",
      "",
      "For every line with at least one **completed** work order, return `line_code`, `completed_orders` (how many of its orders are completed) and `good_units` (the sum of `good_qty` over those orders). Lines with no completed order are not listed. Order the rows by `line_code`.",
    ].join("\n"),
    tables: [
      {
        name: "WorkOrder",
        columns: [
          { name: "work_order_id", type: "int" },
          { name: "line_code", type: "varchar" },
          { name: "status", type: "enum", values: ["planned", "in_progress", "completed", "cancelled"] },
          { name: "planned_qty", type: "int" },
          { name: "good_qty", type: "int" },
        ],
        primaryKey: ["work_order_id"],
        note: "`good_qty` is NULL unless `status` is `completed`.",
      },
    ],
    examples: [
      {
        WorkOrder: [
          [7001, "L1-ASSY", "completed", 500, 488],
          [7002, "L1-ASSY", "in_progress", 400, null],
          [7003, "L2-ASSY", "completed", 300, 300],
          [7004, "L3-PAINT", "cancelled", 250, null],
          [7005, "L1-ASSY", "completed", 600, 571],
          [7006, "L2-ASSY", "planned", 350, null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 16);
      const lines = sample(rng, LINES, ri(rng, 1, 5));
      return {
        WorkOrder: seq(7001, n).map((id) => {
          const status = pick(rng, ["planned", "in_progress", "completed", "completed", "cancelled"] as const);
          const planned = roundTo(rng, 100, 800, 50);
          return [id, pick(rng, lines), status, planned, status === "completed" ? planned - ri(rng, 0, 40) : null];
        }),
      };
    },
    solution: [
      "SELECT line_code, COUNT(*) AS completed_orders, SUM(good_qty) AS good_units",
      "FROM WorkOrder",
      "WHERE status = 'completed'",
      "GROUP BY line_code",
      "ORDER BY line_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT line_code, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders, SUM(good_qty) AS good_units",
        "FROM WorkOrder GROUP BY line_code",
        "HAVING SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) > 0",
        "ORDER BY line_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only completed orders matter for both numbers — filter before you group.",
      "After the filter, a line with no completed order has no rows left, so it drops out by itself.",
    ],
    editorial: [
      "Both numbers are about completed orders only, so the WHERE clause keeps `status = 'completed'` rows before grouping. Grouping by `line_code` then gives one group per line that still has rows: `COUNT(*)` is the number of completed orders and `SUM(good_qty)` their good units. A line whose orders are all planned or cancelled has no rows after the filter and therefore no group — exactly the \"not listed\" rule, with no HAVING needed.",
      "",
      "The alternative keeps every row and counts conditionally, then uses HAVING to drop lines with zero completed orders. It works because `good_qty` is NULL on every non-completed order and SUM ignores NULLs — but it leans on that data rule, while the filter-first version does not, which is why filtering first is the cleaner habit. It also lets an index on `status` skip most of the table.",
    ].join("\n"),
  },

  {
    slug: "machines-with-over-two-hours-unplanned-downtime",
    title: "Machines With Over Two Hours of Unplanned Downtime",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "The maintenance team logs every stoppage of a machine with its start and end time. Planned stoppages (changeovers, scheduled maintenance) are excluded from reliability reviews; an event still open has `ended_at` NULL and is ignored too.",
      "",
      "For **December 2024** (events that **started** from 2024-12-01 00:00:00 up to, but not including, 2025-01-01 00:00:00), return every machine whose closed **unplanned** stoppages add up to **more than 120 minutes**, with `machine_name`, `stoppages` (how many such events) and `downtime_minutes` (their total length in whole minutes, end minus start). Order by `downtime_minutes` from highest to lowest, then by `machine_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Machine",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "machine_name", type: "varchar" },
          { name: "line_code", type: "varchar" },
        ],
        primaryKey: ["machine_id"],
        note: "Machine names are unique.",
      },
      {
        name: "DowntimeEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
          { name: "category", type: "enum", values: ["planned", "unplanned"] },
        ],
        primaryKey: ["event_id"],
        note: "Times are whole minutes. `ended_at` is NULL while the machine is still down.",
      },
    ],
    examples: [
      {
        Machine: [
          [1, "CNC-07", "L1-ASSY"],
          [2, "PRESS-12", "L1-ASSY"],
          [3, "WELD-21", "L4-WELD"],
          [4, "MOULD-02", "L2-ASSY"],
        ],
        DowntimeEvent: [
          [1, 1, "2024-12-02 09:00:00", "2024-12-02 10:30:00", "unplanned"],
          [2, 1, "2024-12-14 14:10:00", "2024-12-14 14:45:00", "unplanned"],
          [3, 2, "2024-12-05 06:00:00", "2024-12-05 10:00:00", "planned"],
          [4, 2, "2024-12-09 11:00:00", "2024-12-09 13:00:00", "unplanned"],
          [5, 3, "2024-11-30 22:00:00", "2024-12-01 03:00:00", "unplanned"],
          [6, 3, "2024-12-31 23:00:00", "2025-01-01 02:15:00", "unplanned"],
          [7, 4, "2024-12-20 08:00:00", null, "unplanned"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const machines = seq(1, n).map((id) => [id, `${pick(rng, ["CNC", "PRESS", "WELD", "MOULD", "LATHE"])}-${String(id).padStart(2, "0")}`, pick(rng, LINES)]);
      const m = ri(rng, 0, 18);
      const events = seq(1, m).map((id) => {
        const start = chance(rng, 0.15)
          ? pick(rng, ["2024-11-30 23:30:00", "2024-12-01 00:00:00", "2024-12-31 23:59:00", "2025-01-01 00:00:00"])
          : at(dateBetween(rng, "2024-11-28", "2025-01-03"), ri(rng, 0, 23), ri(rng, 0, 59));
        // 120 exactly now and then, the boundary "more than" excludes.
        const len = chance(rng, 0.2) ? pick(rng, [60, 120, 121]) : ri(rng, 5, 150);
        return [id, ri(rng, 1, n), start, chance(rng, 0.1) ? null : plusMinutes(start, len), chance(rng, 0.7) ? "unplanned" : "planned"];
      });
      return { Machine: machines, DowntimeEvent: events };
    },
    solution: [
      "SELECT m.machine_name,",
      "       COUNT(*) AS stoppages,",
      "       SUM(TIMESTAMPDIFF(MINUTE, d.started_at, d.ended_at)) AS downtime_minutes",
      "FROM DowntimeEvent d",
      "JOIN Machine m ON m.machine_id = d.machine_id",
      "WHERE d.category = 'unplanned'",
      "  AND d.ended_at IS NOT NULL",
      "  AND d.started_at >= '2024-12-01 00:00:00'",
      "  AND d.started_at < '2025-01-01 00:00:00'",
      "GROUP BY m.machine_id, m.machine_name",
      "HAVING SUM(TIMESTAMPDIFF(MINUTE, d.started_at, d.ended_at)) > 120",
      "ORDER BY downtime_minutes DESC, m.machine_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT machine_name, stoppages, downtime_minutes FROM (",
        "  SELECT machine_id, COUNT(*) AS stoppages, SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) DIV 60 AS downtime_minutes",
        "  FROM DowntimeEvent",
        "  WHERE category = 'unplanned' AND ended_at IS NOT NULL AND YEAR(started_at) = 2024 AND MONTH(started_at) = 12",
        "  GROUP BY machine_id",
        ") t JOIN Machine USING (machine_id)",
        "WHERE downtime_minutes > 120",
        "ORDER BY downtime_minutes DESC, machine_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` gives the length of one stoppage.",
      "Filter the events (category, closed, December by start time) first, then group by machine.",
      "A condition on a total belongs in HAVING, not WHERE.",
    ],
    editorial: [
      "The question has two layers: which events count, and which machines' totals pass. The first layer is row filtering — unplanned, closed (`ended_at IS NOT NULL`) and started inside December by a half-open range — so it goes in WHERE. An event that started on 30 November and ran into December belongs to November by the statement's rule, and one that starts on New Year's Eve counts in full even though it ends in January.",
      "",
      "Each remaining event's length is `TIMESTAMPDIFF(MINUTE, started_at, ended_at)`. Grouping by the machine gives `COUNT(*)` stoppages and the summed minutes; the 120-minute threshold is a condition on that sum, so it lives in HAVING, and `> 120` leaves a machine at exactly two hours out. An open event would make its length NULL, which SUM would skip — filtering it explicitly says what is meant.",
      "",
      "The alternative aggregates in a derived table first and joins the names afterwards, which touches `Machine` only for the machines that passed. Either is one scan of the December events and a sort of the few survivors.",
    ].join("\n"),
  },

  {
    slug: "sensor-threshold-breach-rate",
    title: "Sensor Threshold Breach Rate",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic", "Aggregation"],
    description: [
      "Each sensor has an alarm threshold: a reading **strictly above** `max_threshold` is a breach. Readings with a NULL `value` (dropped packets) are not readings at all and count in neither number.",
      "",
      "For every sensor with at least one valid reading, return `sensor_id`, `sensor_type`, `readings` (valid readings), `breaches` and `breach_pct` — breaches as a percentage of valid readings, **rounded to two decimals**. Sensors with no valid reading are not listed. Order by `breach_pct` from highest to lowest, then by `sensor_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Sensor",
        columns: [
          { name: "sensor_id", type: "int" },
          { name: "sensor_type", type: "enum", values: [...SENSOR_TYPES] },
          { name: "max_threshold", type: "decimal" },
        ],
        primaryKey: ["sensor_id"],
      },
      {
        name: "Reading",
        columns: [
          { name: "reading_id", type: "int" },
          { name: "sensor_id", type: "int" },
          { name: "read_at", type: "datetime" },
          { name: "value", type: "decimal" },
        ],
        primaryKey: ["reading_id"],
        note: "`value` is NULL for a dropped packet; `sensor_id` is always in `Sensor`.",
      },
    ],
    examples: [
      {
        Sensor: [
          [21, "temperature", 85.0],
          [22, "vibration", 4.5],
          [23, "pressure", 6.0],
          [24, "current", 30.0],
        ],
        Reading: [
          [1, 21, "2025-02-01 08:00:00", 84.2],
          [2, 21, "2025-02-01 08:05:00", 86.9],
          [3, 21, "2025-02-01 08:10:00", 85.0],
          [4, 22, "2025-02-01 08:00:00", 5.1],
          [5, 22, "2025-02-01 08:05:00", null],
          [6, 23, "2025-02-01 08:00:00", 5.2],
          [7, 21, "2025-02-01 08:15:00", 88.4],
          [8, 24, "2025-02-01 08:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const thresholds: Record<number, number> = {};
      const sensors = seq(21, n).map((id) => {
        const t = pick(rng, [4.5, 6.0, 30.0, 85.0]);
        thresholds[id] = t;
        return [id, pick(rng, SENSOR_TYPES), t];
      });
      const m = ri(rng, 0, 20);
      const reads = seq(1, m).map((id) => {
        const s = ri(rng, 21, 20 + n);
        const t = thresholds[s]!;
        // Values on the threshold itself are not a breach.
        const v = chance(rng, 0.15) ? null : chance(rng, 0.2) ? t : Math.round(t * (0.8 + rng() * 0.35) * 10) / 10;
        return [id, s, at("2025-02-01", 8 + Math.floor(id / 12), (id * 5) % 60), v];
      });
      return { Sensor: sensors, Reading: reads };
    },
    solution: [
      "SELECT s.sensor_id, s.sensor_type,",
      "       COUNT(*) AS readings,",
      "       SUM(CASE WHEN r.value > s.max_threshold THEN 1 ELSE 0 END) AS breaches,",
      "       ROUND(100 * SUM(CASE WHEN r.value > s.max_threshold THEN 1 ELSE 0 END) / COUNT(*), 2) AS breach_pct",
      "FROM Sensor s",
      "JOIN Reading r ON r.sensor_id = s.sensor_id",
      "WHERE r.value IS NOT NULL",
      "GROUP BY s.sensor_id, s.sensor_type",
      "ORDER BY breach_pct DESC, s.sensor_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.sensor_id, s.sensor_type, COUNT(r.value) AS readings,",
        "       COUNT(IF(r.value > s.max_threshold, 1, NULL)) AS breaches,",
        "       ROUND(100 * COUNT(IF(r.value > s.max_threshold, 1, NULL)) / COUNT(r.value), 2) AS breach_pct",
        "FROM Sensor s LEFT JOIN Reading r ON r.sensor_id = s.sensor_id",
        "GROUP BY s.sensor_id, s.sensor_type",
        "HAVING COUNT(r.value) > 0",
        "ORDER BY breach_pct DESC, s.sensor_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The threshold lives on the sensor and the value on the reading — join them so each reading can be compared.",
      "Count breaches with a SUM over a CASE that yields 1 or 0.",
      "Decide what to do with NULL values before counting, so they are in neither the numerator nor the denominator.",
    ],
    editorial: [
      "Each reading has to be compared with its own sensor's threshold, so the reading rows are joined to `Sensor`. After dropping NULL values in WHERE, grouping by the sensor gives `COUNT(*)` valid readings, and **conditional aggregation** — `SUM(CASE WHEN r.value > s.max_threshold THEN 1 ELSE 0 END)` — counts the breaches in the same pass. The percentage is the ratio of the two times 100, rounded to two decimals as asked.",
      "",
      "NULLs need deliberate handling. Left in, a NULL value would fall into the ELSE branch and inflate the denominator without being a breach. The inner join plus `value IS NOT NULL` also takes care of sensors with no valid reading: they have no rows left and are not listed, so the division never sees zero. The comparison is strict, so a reading exactly on the threshold is not a breach.",
      "",
      "The alternative LEFT JOINs everything and lets `COUNT(r.value)` skip NULLs, then removes empty sensors with HAVING; `COUNT(IF(cond, 1, NULL))` is another spelling of the conditional count. One scan of the readings either way.",
    ].join("\n"),
  },

  {
    slug: "top-operators-per-shift-by-good-output",
    title: "Top Operators per Shift by Good Output",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Operators log the good units they produced on each machine during a shift (`A`, `B` or `C`); an operator who ran two machines in one shift has two log rows.",
      "",
      "For every shift — a `shift_date` and `shift` pair — find the operator or operators with the **highest total** good units in that shift (sum over their logs). If several operators tie for the top, list all of them. Return `shift_date`, `shift`, `operator_name` and `units`, ordered by `shift_date`, then `shift`, then `operator_name`.",
    ].join("\n"),
    tables: [
      {
        name: "ShiftOutput",
        columns: [
          { name: "log_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "shift", type: "enum", values: ["A", "B", "C"] },
          { name: "operator_name", type: "varchar" },
          { name: "machine_code", type: "varchar" },
          { name: "units_ok", type: "int" },
        ],
        primaryKey: ["log_id"],
        note: "Operator names are unique.",
      },
    ],
    examples: [
      {
        ShiftOutput: [
          [1, "2025-03-03", "A", "Ravi", "CNC-07", 140],
          [2, "2025-03-03", "A", "Ravi", "CNC-08", 60],
          [3, "2025-03-03", "A", "Meera", "CNC-09", 185],
          [4, "2025-03-03", "B", "Kabir", "CNC-07", 150],
          [5, "2025-03-03", "B", "Zara", "CNC-08", 150],
          [6, "2025-03-04", "A", "Meera", "CNC-07", 170],
          [7, "2025-03-04", "A", "Ravi", "CNC-08", 90],
        ],
      },
    ],
    gen: (rng) => {
      const crew = names(rng, ri(rng, 2, 6));
      const m = ri(rng, 0, 20);
      return {
        ShiftOutput: seq(1, m).map((id) => [
          id,
          pick(rng, ["2025-03-03", "2025-03-04", "2025-03-05"]),
          pick(rng, ["A", "B", "C"]),
          pick(rng, crew),
          pick(rng, ["CNC-07", "CNC-08", "CNC-09", "LTH-03"]),
          roundTo(rng, 40, 200, 10),
        ]),
      };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT shift_date, shift, operator_name, SUM(units_ok) AS units",
      "  FROM ShiftOutput",
      "  GROUP BY shift_date, shift, operator_name",
      "), ranked AS (",
      "  SELECT t.*, RANK() OVER (PARTITION BY shift_date, shift ORDER BY units DESC) AS rnk",
      "  FROM totals t",
      ")",
      "SELECT shift_date, shift, operator_name, units",
      "FROM ranked",
      "WHERE rnk = 1",
      "ORDER BY shift_date, shift, operator_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT shift_date, shift, operator_name, SUM(units_ok) AS units FROM ShiftOutput GROUP BY shift_date, shift, operator_name",
        ")",
        "SELECT t.shift_date, t.shift, t.operator_name, t.units FROM totals t",
        "WHERE t.units = (SELECT MAX(u.units) FROM totals u WHERE u.shift_date = t.shift_date AND u.shift = t.shift)",
        "ORDER BY t.shift_date, t.shift, t.operator_name",
      ].join("\n"),
      [
        "SELECT shift_date, shift, operator_name, units FROM (",
        "  SELECT shift_date, shift, operator_name, SUM(units_ok) AS units,",
        "         MAX(SUM(units_ok)) OVER (PARTITION BY shift_date, shift) AS best",
        "  FROM ShiftOutput GROUP BY shift_date, shift, operator_name",
        ") x WHERE units = best ORDER BY shift_date, shift, operator_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First add up each operator's logs within a shift — one row per operator per shift.",
      "Then compare operators within the same shift: a window partitioned by date and shift.",
      "RANK gives tied operators the same rank; ROW_NUMBER would drop one of them.",
    ],
    editorial: [
      "Two steps, in that order. First aggregate: an operator's output in a shift is the sum of their log rows, so group by `shift_date`, `shift` and `operator_name`. Ranking the raw logs instead would compare one machine's output with another operator's whole shift.",
      "",
      "Then rank within each shift: `RANK() OVER (PARTITION BY shift_date, shift ORDER BY units DESC)` numbers the operators of a shift from the top, giving equal totals the same rank. Keeping `rnk = 1` returns every operator tied for first — `ROW_NUMBER` would arbitrarily keep only one, and which one could change with storage order.",
      "",
      "Without a ranking function, compare each total with the shift's maximum through a correlated subquery over the same CTE, or compute `MAX(SUM(units_ok)) OVER (PARTITION BY …)` in the grouped query itself — a window over an aggregate is evaluated after GROUP BY. All three are one aggregation plus a pass over the much smaller set of totals.",
    ].join("\n"),
  },

  {
    slug: "late-work-order-rate-by-line",
    title: "Late Work Order Rate by Line",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "A work order is **late** when it was completed on a calendar day after its `due_date`; completing it any time on the due date itself is on time. Orders not yet completed (`completed_at` NULL) are left out of every number.",
      "",
      "For every line with at least one completed order, return `line_code`, `completed_orders`, `late_orders` and `late_pct` — late orders as a percentage of completed orders, **rounded to two decimals**. Order by `late_pct` from highest to lowest, then by `line_code`.",
    ].join("\n"),
    tables: [
      {
        name: "LineWorkOrder",
        columns: [
          { name: "work_order_id", type: "int" },
          { name: "line_code", type: "varchar" },
          { name: "due_date", type: "date" },
          { name: "completed_at", type: "datetime" },
        ],
        primaryKey: ["work_order_id"],
        note: "`completed_at` is NULL while an order is open.",
      },
    ],
    examples: [
      {
        LineWorkOrder: [
          [9001, "L1-ASSY", "2024-10-05", "2024-10-05 22:40:00"],
          [9002, "L1-ASSY", "2024-10-07", "2024-10-08 01:15:00"],
          [9003, "L1-ASSY", "2024-10-09", "2024-10-08 16:00:00"],
          [9004, "L4-WELD", "2024-10-06", "2024-10-10 09:30:00"],
          [9005, "L4-WELD", "2024-10-12", null],
          [9006, "L5-PACK", "2024-10-15", "2024-10-14 11:00:00"],
          [9007, "L3-PAINT", "2024-10-20", null],
        ],
      },
    ],
    gen: (rng) => {
      const lines = sample(rng, LINES, ri(rng, 1, 4));
      const m = ri(rng, 0, 18);
      return {
        LineWorkOrder: seq(9001, m).map((id) => {
          const due = dateBetween(rng, "2024-10-01", "2024-12-20");
          const done = chance(rng, 0.15) ? null : at(addDays(due, ri(rng, -3, 3)), pick(rng, [0, 9, 16, 23]), pick(rng, [0, 30, 59]));
          return [id, pick(rng, lines), due, done];
        }),
      };
    },
    solution: [
      "SELECT line_code,",
      "       COUNT(*) AS completed_orders,",
      "       SUM(CASE WHEN DATE(completed_at) > due_date THEN 1 ELSE 0 END) AS late_orders,",
      "       ROUND(100 * SUM(CASE WHEN DATE(completed_at) > due_date THEN 1 ELSE 0 END) / COUNT(*), 2) AS late_pct",
      "FROM LineWorkOrder",
      "WHERE completed_at IS NOT NULL",
      "GROUP BY line_code",
      "ORDER BY late_pct DESC, line_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT line_code, COUNT(completed_at) AS completed_orders,",
        "       SUM(IF(DATEDIFF(completed_at, due_date) > 0, 1, 0)) AS late_orders,",
        "       ROUND(100 * SUM(IF(DATEDIFF(completed_at, due_date) > 0, 1, 0)) / COUNT(completed_at), 2) AS late_pct",
        "FROM LineWorkOrder GROUP BY line_code HAVING COUNT(completed_at) > 0",
        "ORDER BY late_pct DESC, line_code",
      ].join("\n"),
      [
        "SELECT line_code, COUNT(*) AS completed_orders,",
        "       SUM(CASE WHEN completed_at >= DATE_ADD(due_date, INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS late_orders,",
        "       ROUND(100 * SUM(CASE WHEN completed_at >= DATE_ADD(due_date, INTERVAL 1 DAY) THEN 1 ELSE 0 END) / COUNT(*), 2) AS late_pct",
        "FROM LineWorkOrder WHERE completed_at IS NOT NULL GROUP BY line_code",
        "ORDER BY late_pct DESC, line_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`completed_at` has a time and `due_date` does not. Comparing them directly makes 22:40 on the due date look later than the date — what should you compare instead?",
      "Count the late orders with a CASE inside SUM, in the same grouped query as the total.",
      "Leave the open orders out before grouping.",
    ],
    editorial: [
      "The trap is the type mismatch. `completed_at` is a datetime and `due_date` a date; compared directly, `'2024-10-05 22:40:00' > '2024-10-05'` is true, so an order finished on its due date would be called late. Reduce the timestamp to its day with `DATE(completed_at)` before comparing, or use `DATEDIFF(completed_at, due_date) > 0`, which compares calendar days, or ask whether it finished at or after midnight of the next day.",
      "",
      "With that settled it is conditional aggregation: drop open orders in WHERE, group by line, `COUNT(*)` the completed ones and `SUM(CASE … THEN 1 ELSE 0 END)` the late ones, and divide for the percentage, rounded to two decimals. A line whose orders are all open has no rows after the filter and is not listed, which also keeps the division away from zero.",
      "",
      "The order is by the late rate, worst line first, ties alphabetical. One scan and one small aggregation.",
    ].join("\n"),
  },

  {
    slug: "machines-due-for-preventive-maintenance",
    title: "Machines Due for Preventive Maintenance by Quarter End",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "Every machine needs preventive maintenance (PM) every `pm_interval_days` days after its **last preventive** service. Breakdown repairs are logged too, but they do not reset the PM clock.",
      "",
      "List every machine whose next PM is due **on or before 2025-03-31**, plus every machine that has never had a preventive service. Return `machine_name`, `last_pm` (the date of its latest preventive service, NULL if none) and `next_due` (`last_pm` plus the interval, NULL if none). Order by `machine_name`.",
    ].join("\n"),
    tables: [
      {
        name: "PlantMachine",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "machine_name", type: "varchar" },
          { name: "pm_interval_days", type: "int" },
        ],
        primaryKey: ["machine_id"],
        note: "Machine names are unique.",
      },
      {
        name: "MaintenanceLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "done_on", type: "date" },
          { name: "kind", type: "enum", values: ["preventive", "breakdown"] },
        ],
        primaryKey: ["log_id"],
      },
    ],
    examples: [
      {
        PlantMachine: [
          [1, "Compressor-1", 90],
          [2, "CNC-07", 180],
          [3, "Boiler-2", 60],
          [4, "Press-12", 120],
          [5, "Chiller-3", 90],
        ],
        MaintenanceLog: [
          [1, 1, "2024-10-10", "preventive"],
          [2, 1, "2024-12-20", "preventive"],
          [3, 2, "2024-08-01", "preventive"],
          [4, 3, "2025-02-25", "breakdown"],
          [5, 4, "2024-12-01", "preventive"],
          [6, 5, "2025-01-01", "preventive"],
          [7, 2, "2025-01-15", "breakdown"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const intervals: number[] = [];
      const machines = seq(1, n).map((id) => {
        const iv = pick(rng, [60, 90, 120, 180]);
        intervals.push(iv);
        return [id, `${pick(rng, ["CNC", "Press", "Boiler", "Chiller", "Compressor"])}-${String(id).padStart(2, "0")}`, iv];
      });
      const m = ri(rng, 0, 16);
      const logs = seq(1, m).map((id) => {
        const mid = ri(rng, 1, n);
        // Exactly due on 31 March now and then.
        const d = chance(rng, 0.2) ? addDays("2025-03-31", -intervals[mid - 1]!) : dateBetween(rng, "2024-06-01", "2025-03-15");
        return [id, mid, d, chance(rng, 0.7) ? "preventive" : "breakdown"];
      });
      return { PlantMachine: machines, MaintenanceLog: logs };
    },
    solution: [
      "SELECT m.machine_name, p.last_pm,",
      "       DATE_ADD(p.last_pm, INTERVAL m.pm_interval_days DAY) AS next_due",
      "FROM PlantMachine m",
      "LEFT JOIN (",
      "  SELECT machine_id, MAX(done_on) AS last_pm",
      "  FROM MaintenanceLog",
      "  WHERE kind = 'preventive'",
      "  GROUP BY machine_id",
      ") p ON p.machine_id = m.machine_id",
      "WHERE p.last_pm IS NULL",
      "   OR DATE_ADD(p.last_pm, INTERVAL m.pm_interval_days DAY) <= '2025-03-31'",
      "ORDER BY m.machine_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT machine_name, last_pm, DATE_ADD(last_pm, INTERVAL pm_interval_days DAY) AS next_due FROM (",
        "  SELECT m.machine_name, m.pm_interval_days,",
        "         (SELECT MAX(l.done_on) FROM MaintenanceLog l WHERE l.machine_id = m.machine_id AND l.kind = 'preventive') AS last_pm",
        "  FROM PlantMachine m",
        ") t",
        "WHERE last_pm IS NULL OR DATEDIFF('2025-03-31', last_pm) >= pm_interval_days",
        "ORDER BY machine_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each machine's latest preventive service first — breakdown rows must not take part.",
      "A machine with no preventive service has no row in that result; keep it with a LEFT JOIN or a scalar subquery.",
      "\"On or before\" includes a machine due exactly on 31 March.",
    ],
    editorial: [
      "The latest PM per machine is `MAX(done_on)` over the preventive rows only — filtering `kind = 'preventive'` *inside* the aggregation is what stops a recent breakdown repair from resetting the clock. That derived table has a row only for machines that were ever serviced, so it is LEFT JOINed to `PlantMachine`; machines never serviced come through with `last_pm` NULL.",
      "",
      "The next due date is `DATE_ADD(last_pm, INTERVAL pm_interval_days DAY)`, and the machine is listed when that is `<= '2025-03-31'` or when there is no PM at all. Since the due date of an unserviced machine is NULL, it needs the explicit `IS NULL` branch, and selecting the same expression shows NULL for it.",
      "",
      "A correlated scalar subquery can fetch the latest PM per machine instead, with the due test written as `DATEDIFF('2025-03-31', last_pm) >= pm_interval_days`. With an index on `(machine_id, kind, done_on)` both read one index entry per machine.",
    ].join("\n"),
  },

  {
    slug: "batches-worse-than-their-product-defect-rate",
    title: "Batches Worse Than Their Product's Defect Rate",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Quality engineers compare every batch with its product's overall record. A product's **pooled defect rate** is the total defective units of all its batches divided by the total units produced by all its batches.",
      "",
      "Return the batches whose own defect rate (defective units ÷ units produced) is **strictly higher** than their product's pooled rate, with the columns `batch_id`, `product_code`, `units_produced` and `defective_units`. Batches that produced 0 units are never in the answer, and they add nothing to the pooled rate. Order by `product_code`, then `batch_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Batch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "product_code", type: "varchar" },
          { name: "units_produced", type: "int" },
          { name: "defective_units", type: "int" },
        ],
        primaryKey: ["batch_id"],
        note: "A cancelled batch has `units_produced` = 0 and `defective_units` = 0.",
      },
    ],
    examples: [
      {
        Batch: [
          [601, "GEAR-12T", 1000, 20],
          [602, "GEAR-12T", 500, 15],
          [603, "GEAR-12T", 500, 5],
          [604, "VALVE-HP", 800, 8],
          [605, "VALVE-HP", 400, 4],
          [606, "AXLE-S", 0, 0],
          [607, "AXLE-S", 1200, 30],
        ],
      },
    ],
    gen: (rng) => {
      const prods = sample(rng, PRODUCTS, ri(rng, 1, 4));
      const n = ri(rng, 1, 16);
      return {
        Batch: seq(601, n).map((id) => {
          const units = chance(rng, 0.1) ? 0 : roundTo(rng, 200, 2000, 100);
          // Rates from a few fixed values so batches often tie their product's rate.
          const bad = units === 0 ? 0 : (units / 100) * pick(rng, [0, 1, 1, 2, 2, 3, 5]);
          return [id, pick(rng, prods), units, bad];
        }),
      };
    },
    solution: [
      "SELECT b.batch_id, b.product_code, b.units_produced, b.defective_units",
      "FROM Batch b",
      "JOIN (",
      "  SELECT product_code, SUM(units_produced) AS units, SUM(defective_units) AS bad",
      "  FROM Batch",
      "  GROUP BY product_code",
      ") p ON p.product_code = b.product_code",
      "WHERE b.units_produced > 0",
      "  AND b.defective_units * p.units > p.bad * b.units_produced",
      "ORDER BY b.product_code, b.batch_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT batch_id, product_code, units_produced, defective_units FROM Batch b",
        "WHERE units_produced > 0",
        "  AND defective_units * (SELECT SUM(units_produced) FROM Batch x WHERE x.product_code = b.product_code)",
        "    > units_produced * (SELECT SUM(defective_units) FROM Batch x WHERE x.product_code = b.product_code)",
        "ORDER BY product_code, batch_id",
      ].join("\n"),
      [
        "SELECT batch_id, product_code, units_produced, defective_units FROM (",
        "  SELECT b.*, SUM(units_produced) OVER (PARTITION BY product_code) AS pu,",
        "         SUM(defective_units) OVER (PARTITION BY product_code) AS pd",
        "  FROM Batch b",
        ") t WHERE units_produced > 0 AND defective_units * pu > pd * units_produced",
        "ORDER BY product_code, batch_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The pooled rate is one ratio of two sums per product — not the average of the batch rates.",
      "Compute the product's totals in a derived table (or a correlated subquery) and compare each batch with them.",
      "`a/b > c/d` with positive b and d is `a*d > c*b` — no rounding, no division by zero.",
    ],
    editorial: [
      "The benchmark is a per-product aggregate, and each batch row is compared with its own product's value — the shape of a **correlated** comparison. Computing the totals once in a derived table (`SUM(units_produced)`, `SUM(defective_units)` per product) and joining it back is the usual form; a correlated scalar subquery per batch, or window sums partitioned by product, give the same numbers.",
      "",
      "Note that the pooled rate is a ratio of sums, not the average of batch rates: a big batch counts for more. Averaging rates would weigh a 200-unit trial batch like a 2,000-unit run.",
      "",
      "Instead of dividing, compare by cross-multiplying: `defective_units / units_produced > bad / units` is `defective_units * units > bad * units_produced` for positive totals. Integer arithmetic makes a batch exactly at the pooled rate compare equal — it is not \"strictly higher\" — and needs no rounding. Cancelled batches contribute zeros to both sums, so they change nothing, and `units_produced > 0` keeps them out of the answer.",
    ].join("\n"),
  },

  {
    slug: "solar-generation-sharp-day-over-day-drops",
    title: "Solar Generation Sharp Day-Over-Day Drops",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "An O&M (operations and maintenance) analyst hunts for days when a solar plant's output collapsed — soiled panels, a tripped inverter, a cloudburst. A day is a **sharp drop** when its `kwh` is **less than 70%** of the plant's previous **reported** day (the latest earlier `gen_date` of the same plant, however many days back; days without a report have no row).",
      "",
      "Return `plant_id`, `gen_date`, `prev_date`, `prev_kwh` and `kwh` for every sharp drop. A plant's first reported day has no previous day and is never a drop. Order by `plant_id`, then `gen_date`.",
    ].join("\n"),
    tables: [
      {
        name: "PlantDailyYield",
        columns: [
          { name: "plant_id", type: "int" },
          { name: "gen_date", type: "date" },
          { name: "kwh", type: "int" },
        ],
        primaryKey: ["plant_id", "gen_date"],
        note: "One row per plant per day that the SCADA system reported.",
      },
    ],
    examples: [
      {
        PlantDailyYield: [
          [1, "2024-07-01", 5200],
          [1, "2024-07-02", 3600],
          [1, "2024-07-03", 2520],
          [1, "2024-07-06", 1700],
          [2, "2024-07-01", 9100],
          [2, "2024-07-02", 9050],
          [2, "2024-07-04", 4000],
          [3, "2024-07-02", 1200],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const p of seq(1, ri(rng, 1, 3))) {
        let d = dateBetween(rng, "2024-07-01", "2024-07-05");
        let kwh = roundTo(rng, 2000, 9000, 100);
        for (let i = 0; i < ri(rng, 0, 8); i++) {
          rows.push([p, d, kwh]);
          d = addDays(d, ri(rng, 1, 3));
          // Exactly 70% now and then — not a drop.
          const r = pick(rng, [5, 7, 7, 9, 10, 12, 6]);
          kwh = Math.max(100, Math.round((kwh * r) / 100) * 10);
        }
      }
      return { PlantDailyYield: rows };
    },
    solution: [
      "SELECT plant_id, gen_date, prev_date, prev_kwh, kwh FROM (",
      "  SELECT plant_id, gen_date, kwh,",
      "         LAG(gen_date) OVER (PARTITION BY plant_id ORDER BY gen_date) AS prev_date,",
      "         LAG(kwh) OVER (PARTITION BY plant_id ORDER BY gen_date) AS prev_kwh",
      "  FROM PlantDailyYield",
      ") t",
      "WHERE kwh * 10 < prev_kwh * 7",
      "ORDER BY plant_id, gen_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.plant_id, c.gen_date, p.gen_date AS prev_date, p.kwh AS prev_kwh, c.kwh",
        "FROM PlantDailyYield c",
        "JOIN PlantDailyYield p ON p.plant_id = c.plant_id",
        " AND p.gen_date = (SELECT MAX(x.gen_date) FROM PlantDailyYield x WHERE x.plant_id = c.plant_id AND x.gen_date < c.gen_date)",
        "WHERE c.kwh * 10 < p.kwh * 7",
        "ORDER BY c.plant_id, c.gen_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"The previous reported day\" is the previous row of the same plant in date order — not necessarily yesterday.",
      "`LAG(column) OVER (PARTITION BY … ORDER BY …)` reads a value from the row before.",
      "Filter on the window's result in an outer query; window functions cannot appear in WHERE.",
    ],
    editorial: [
      "Comparing each day with the previous **row** of the same plant is exactly what `LAG` does: partitioned by `plant_id` and ordered by `gen_date`, `LAG(kwh)` is the output of the latest earlier report, whether that was yesterday or three days ago, and `LAG(gen_date)` its date. Joining on `gen_date - 1` would miss every comparison across a gap in reporting.",
      "",
      "Window functions are computed after WHERE, so the drop test goes in an outer query over the derived table. Writing it as `kwh * 10 < prev_kwh * 7` keeps it in integers, so a day at exactly 70% is reliably not a drop. A plant's first day has `prev_kwh` NULL; the comparison is unknown and the row is filtered out, as required.",
      "",
      "Without window functions, a correlated subquery finds the latest earlier date and a self join fetches that day's output. It is correct but probes the table once per row; the window version sorts each plant's rows once.",
    ].join("\n"),
  },

  {
    slug: "incoming-lot-rejection-rate-by-supplier",
    title: "Incoming Lot Rejection Rate by Supplier",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Goods-receipt inspection checks every incoming lot of bought-out parts. A lot code looks like `LOT-SUNDRAM-2024-117`: the second hyphen-separated part is the **supplier code**, and supplier codes have different lengths.",
      "",
      "For every supplier, return `supplier`, `lots` (the number of lots inspected), `received` (total units received), `rejected` (total units rejected) and `rejection_pct` — rejected units as a percentage of received units, **rounded to two decimals**. Order by `rejection_pct` from highest to lowest, then by `supplier`.",
    ].join("\n"),
    tables: [
      {
        name: "GoodsReceiptInspection",
        columns: [
          { name: "inspection_id", type: "int" },
          { name: "lot_code", type: "varchar" },
          { name: "qty_received", type: "int" },
          { name: "qty_rejected", type: "int" },
        ],
        primaryKey: ["inspection_id"],
        note: "Lot codes are `LOT-<SUPPLIER>-<YEAR>-<SEQ>` in upper case; `qty_received` is always positive.",
      },
    ],
    examples: [
      {
        GoodsReceiptInspection: [
          [1, "LOT-SUNDRAM-2024-117", 2000, 14],
          [2, "LOT-RANE-2024-031", 1500, 45],
          [3, "LOT-SUNDRAM-2024-118", 1000, 6],
          [4, "LOT-MINDA-2024-009", 800, 0],
          [5, "LOT-RANE-2025-002", 500, 5],
          [6, "LOT-BOSCH-2025-014", 1200, 18],
        ],
      },
    ],
    gen: (rng) => {
      const sups = sample(rng, ["SUNDRAM", "RANE", "MINDA", "BOSCH", "ENDURANCE", "UCAL"], ri(rng, 1, 5));
      const m = ri(rng, 1, 16);
      return {
        GoodsReceiptInspection: seq(1, m).map((id) => {
          const qty = roundTo(rng, 300, 3000, 100);
          return [id, `LOT-${pick(rng, sups)}-${pick(rng, [2024, 2025])}-${String(100 + id).padStart(3, "0")}`, qty, chance(rng, 0.2) ? 0 : ri(rng, 0, Math.floor(qty / 25))];
        }),
      };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(lot_code, '-', 2), '-', -1) AS supplier,",
      "       COUNT(*) AS lots,",
      "       SUM(qty_received) AS received,",
      "       SUM(qty_rejected) AS rejected,",
      "       ROUND(100 * SUM(qty_rejected) / SUM(qty_received), 2) AS rejection_pct",
      "FROM GoodsReceiptInspection",
      "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(lot_code, '-', 2), '-', -1)",
      "ORDER BY rejection_pct DESC, supplier",
    ].join("\n"),
    alternatives: [
      [
        "SELECT supplier, COUNT(*) AS lots, SUM(qty_received) AS received, SUM(qty_rejected) AS rejected,",
        "       ROUND(SUM(qty_rejected) * 100 / SUM(qty_received), 2) AS rejection_pct",
        "FROM (SELECT SUBSTRING(lot_code, 5, LOCATE('-', lot_code, 5) - 5) AS supplier, qty_received, qty_rejected",
        "      FROM GoodsReceiptInspection) t",
        "GROUP BY supplier ORDER BY rejection_pct DESC, supplier",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The supplier code sits between the first and second hyphens; its length varies, so a fixed-length LEFT or SUBSTRING will not do.",
      "`SUBSTRING_INDEX(s, '-', 2)` keeps everything before the second hyphen; a negative count then takes from the right.",
      "The rate is a ratio of the two sums, not the average of each lot's rate.",
    ],
    editorial: [
      "The grouping key is inside a delimited string. `SUBSTRING_INDEX(lot_code, '-', 2)` returns `LOT-SUNDRAM` (everything before the second hyphen) and `SUBSTRING_INDEX(…, '-', -1)` takes the last piece of that, `SUNDRAM`. Nesting the two is the standard way to pull the n-th field out of a delimited code in MySQL, and it does not care how long the field is. The alternative finds the second hyphen with `LOCATE('-', lot_code, 5)` — searching from just after `LOT-` — and cuts between the two.",
      "",
      "Grouping by that expression gives one row per supplier. The rejection rate is pooled — total rejected over total received — so a 3,000-unit lot weighs more than a 300-unit one, which is what a supplier scorecard wants; averaging per-lot rates would not. `qty_received` is always positive, so the division is safe, and the result is rounded to two decimals as asked.",
      "",
      "The order is worst supplier first, alphabetical among ties. One scan with a string function per row.",
    ].join("\n"),
  },

  {
    slug: "ev-charging-peak-and-off-peak-revenue",
    title: "EV Charging Peak and Off-Peak Revenue",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic"],
    description: [
      "The charge-point operator bills by time of day: a session that **starts** in the evening peak — any time from 18:00:00 to 21:59:59 — is billed at **₹24 per kWh**; every other session at **₹18 per kWh**.",
      "",
      "For every station with at least one session, return `station_id`, `peak_sessions`, `off_peak_sessions` and `revenue_inr`, the total billed for that station's sessions. Order by `station_id`.",
    ].join("\n"),
    tables: [
      {
        name: "EvSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "station_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
          { name: "energy_kwh", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "`energy_kwh` is the whole kWh billed for the session.",
      },
    ],
    examples: [
      {
        EvSession: [
          [1, 10, "2024-09-01 17:59:59", "2024-09-01 18:40:00", 20],
          [2, 10, "2024-09-01 18:00:00", "2024-09-01 18:55:00", 25],
          [3, 10, "2024-09-01 21:59:59", "2024-09-01 22:30:00", 10],
          [4, 11, "2024-09-02 22:00:00", "2024-09-02 23:10:00", 30],
          [5, 11, "2024-09-03 08:15:00", "2024-09-03 09:00:00", 18],
          [6, 12, "2024-09-03 19:20:00", "2024-09-03 20:05:00", 15],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 18);
      const stations = sample(rng, [10, 11, 12, 13, 14], ri(rng, 1, 4));
      return {
        EvSession: seq(1, m).map((id) => {
          const day = dateBetween(rng, "2024-09-01", "2024-09-30");
          const start = chance(rng, 0.3)
            ? `${day} ${pick(rng, ["17:59:59", "18:00:00", "21:59:59", "22:00:00"])}`
            : at(day, ri(rng, 0, 23), ri(rng, 0, 59));
          return [id, pick(rng, stations), start, plusMinutes(start, ri(rng, 20, 120)), ri(rng, 5, 45)];
        }),
      };
    },
    solution: [
      "SELECT station_id,",
      "       SUM(CASE WHEN HOUR(started_at) BETWEEN 18 AND 21 THEN 1 ELSE 0 END) AS peak_sessions,",
      "       SUM(CASE WHEN HOUR(started_at) BETWEEN 18 AND 21 THEN 0 ELSE 1 END) AS off_peak_sessions,",
      "       SUM(energy_kwh * CASE WHEN HOUR(started_at) BETWEEN 18 AND 21 THEN 24 ELSE 18 END) AS revenue_inr",
      "FROM EvSession",
      "GROUP BY station_id",
      "ORDER BY station_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT station_id, SUM(peak) AS peak_sessions, COUNT(*) - SUM(peak) AS off_peak_sessions,",
        "       SUM(energy_kwh * IF(peak = 1, 24, 18)) AS revenue_inr",
        "FROM (SELECT station_id, energy_kwh,",
        "             IF(RIGHT(started_at, 8) >= '18:00:00' AND RIGHT(started_at, 8) < '22:00:00', 1, 0) AS peak",
        "      FROM EvSession) t",
        "GROUP BY station_id ORDER BY station_id",
      ].join("\n"),
      [
        "SELECT station_id,",
        "       COUNT(CASE WHEN HOUR(started_at) >= 18 AND HOUR(started_at) < 22 THEN 1 END) AS peak_sessions,",
        "       COUNT(CASE WHEN HOUR(started_at) < 18 OR HOUR(started_at) >= 22 THEN 1 END) AS off_peak_sessions,",
        "       18 * SUM(energy_kwh) + 6 * SUM(CASE WHEN HOUR(started_at) >= 18 AND HOUR(started_at) < 22 THEN energy_kwh ELSE 0 END) AS revenue_inr",
        "FROM EvSession GROUP BY station_id ORDER BY station_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only the start time decides the tariff, and only its hour matters: 18, 19, 20 and 21 are peak.",
      "One grouped query can count both kinds of session with two conditional sums.",
      "The rate can be a CASE expression multiplied by the energy inside the SUM.",
    ],
    editorial: [
      "The peak window 18:00:00–21:59:59 is exactly the hours 18 to 21, so `HOUR(started_at) BETWEEN 18 AND 21` classifies a session without any string handling — 17:59:59 is hour 17 and off-peak, 21:59:59 is hour 21 and peak, 22:00:00 is off-peak. The end time is irrelevant: a session that starts at 17:59 and runs into the evening is billed off-peak.",
      "",
      "Everything is then **conditional aggregation** in one grouped pass: a SUM of a 1/0 CASE counts the peak sessions, its mirror the off-peak ones, and the revenue multiplies each session's energy by the rate chosen by the same CASE. Because `energy_kwh` is a whole number and the rates are whole rupees, the total is exact.",
      "",
      "The alternatives compare the time of day as text, or split the bill as ₹18 on everything plus ₹6 extra on peak energy. Since every row of `EvSession` belongs to a station with a session, there is no empty group to worry about.",
    ].join("\n"),
  },

  {
    slug: "machines-with-repeating-fault-codes",
    title: "Machines With Repeating Fault Codes",
    difficulty: "MEDIUM",
    topics: ["Strings", "Joins", "Aggregation"],
    description: [
      "The PLC on every machine raises fault codes such as `E-104` (spindle overload) into a fault log. A reliability engineer wants the **repeat offenders**: a fault code is *repeating* on a machine when it was logged on that machine **at least twice**.",
      "",
      "For every machine with at least one repeating code, return `machine_name` and `repeating_codes` — its repeating codes in alphabetical order, joined into one string with `', '` (comma and space) between them. Order the rows by `machine_name`.",
    ].join("\n"),
    tables: [
      {
        name: "FloorMachine",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "machine_name", type: "varchar" },
        ],
        primaryKey: ["machine_id"],
        note: "Machine names are unique.",
      },
      {
        name: "FaultLog",
        columns: [
          { name: "fault_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "fault_code", type: "varchar" },
          { name: "logged_at", type: "datetime" },
        ],
        primaryKey: ["fault_id"],
        note: "Fault codes are `E-` followed by three digits.",
      },
    ],
    examples: [
      {
        FloorMachine: [
          [1, "CNC-07"],
          [2, "PRESS-12"],
          [3, "WELD-21"],
        ],
        FaultLog: [
          [1, 1, "E-221", "2025-01-04 10:00:00"],
          [2, 1, "E-104", "2025-01-05 11:30:00"],
          [3, 1, "E-221", "2025-01-09 09:15:00"],
          [4, 1, "E-104", "2025-01-12 16:40:00"],
          [5, 1, "E-310", "2025-01-13 08:05:00"],
          [6, 2, "E-104", "2025-01-06 07:20:00"],
          [7, 3, "E-512", "2025-01-07 22:10:00"],
          [8, 3, "E-512", "2025-01-08 02:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 5);
      const machines = seq(1, n).map((id) => [id, `${pick(rng, ["CNC", "PRESS", "WELD", "LATHE"])}-${String(id * 3).padStart(2, "0")}`]);
      const codes = sample(rng, ["E-104", "E-221", "E-310", "E-512", "E-007", "E-450"], ri(rng, 2, 5));
      const m = ri(rng, 0, 20);
      return {
        FloorMachine: machines,
        FaultLog: seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, codes), atTime(rng, dateBetween(rng, "2025-01-01", "2025-01-31"))]),
      };
    },
    solution: [
      "SELECT m.machine_name,",
      "       GROUP_CONCAT(r.fault_code ORDER BY r.fault_code SEPARATOR ', ') AS repeating_codes",
      "FROM (",
      "  SELECT machine_id, fault_code",
      "  FROM FaultLog",
      "  GROUP BY machine_id, fault_code",
      "  HAVING COUNT(*) >= 2",
      ") r",
      "JOIN FloorMachine m ON m.machine_id = r.machine_id",
      "GROUP BY m.machine_id, m.machine_name",
      "ORDER BY m.machine_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.machine_name,",
        "       GROUP_CONCAT(f.fault_code ORDER BY f.fault_code SEPARATOR ', ') AS repeating_codes",
        "FROM FloorMachine m",
        "JOIN (SELECT DISTINCT machine_id, fault_code FROM FaultLog f",
        "      WHERE EXISTS (SELECT 1 FROM FaultLog g WHERE g.machine_id = f.machine_id AND g.fault_code = f.fault_code AND g.fault_id <> f.fault_id)) f",
        "  ON f.machine_id = m.machine_id",
        "GROUP BY m.machine_id, m.machine_name",
        "ORDER BY m.machine_name",
      ].join("\n"),
      [
        "SELECT machine_name, GROUP_CONCAT(fault_code ORDER BY fault_code SEPARATOR ', ') AS repeating_codes FROM (",
        "  SELECT DISTINCT m.machine_id, m.machine_name, f.fault_code",
        "  FROM (SELECT machine_id, fault_code, COUNT(*) OVER (PARTITION BY machine_id, fault_code) AS times FROM FaultLog) f",
        "  JOIN FloorMachine m ON m.machine_id = f.machine_id",
        "  WHERE f.times >= 2",
        ") t GROUP BY machine_id, machine_name ORDER BY machine_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First find the (machine, code) pairs that occur twice or more — a GROUP BY with HAVING.",
      "Then aggregate those pairs again, per machine, into one string.",
      "`GROUP_CONCAT` takes its own `ORDER BY` and `SEPARATOR`.",
    ],
    editorial: [
      "Two levels of grouping. The inner query groups the fault log by machine **and** code and keeps the pairs with `HAVING COUNT(*) >= 2` — each surviving row is one repeating code on one machine, listed once however many times it fired. A machine whose codes all fired once has no surviving row, so it is not in the answer.",
      "",
      "The outer query joins the machine names and groups again by machine, folding the codes into a single string with `GROUP_CONCAT(fault_code ORDER BY fault_code SEPARATOR ', ')`. The ORDER BY inside GROUP_CONCAT is what fixes the order of the codes in the string; without it the order would follow whatever order the engine read the rows in, and the comma-space separator must be given explicitly because the default is a bare comma.",
      "",
      "The alternatives keep each log row that has a twin (same machine, same code, another id) via EXISTS, or count each pair with a window `COUNT(*) OVER (PARTITION BY machine_id, fault_code)`, and reduce to distinct pairs before concatenating. The EXISTS form reads the log more times; the double GROUP BY is one pass plus a small second aggregation.",
    ].join("\n"),
  },

  {
    slug: "machine-oee-per-planned-shift",
    title: "Machine OEE per Planned Shift",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation"],
    description: [
      "Overall Equipment Effectiveness (OEE) is the plant's headline metric. For one machine on one planned shift, using the shift's planned minutes, the stoppage minutes logged against that shift, and the part counter's readings (a shift can have several counter rows, one per hour bucket):",
      "",
      "- `availability_pct` = 100 × (planned minutes − stoppage minutes) ÷ planned minutes;",
      "- `quality_pct` = 100 × good units ÷ total units, or **NULL** when the shift counted no units at all;",
      "- `oee_pct` = 100 × good units × `ideal_cycle_secs` ÷ (planned minutes × 60) — **0** when no good units were counted.",
      "",
      "Return one row for **every planned shift** with `machine_name`, `shift_date`, `availability_pct`, `quality_pct` and `oee_pct`, each percentage **rounded to one decimal**. A shift with no stoppage has 100% availability. Order by `machine_name`, then `shift_date`.",
    ].join("\n"),
    tables: [
      {
        name: "OeeMachine",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "machine_name", type: "varchar" },
          { name: "ideal_cycle_secs", type: "int" },
        ],
        primaryKey: ["machine_id"],
        note: "`ideal_cycle_secs` is the design time to make one part. Machine names are unique.",
      },
      {
        name: "ShiftPlan",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "planned_minutes", type: "int" },
        ],
        primaryKey: ["machine_id", "shift_date"],
        note: "One row per machine per shift it was scheduled to run (breaks already excluded).",
      },
      {
        name: "Stoppage",
        columns: [
          { name: "stoppage_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "minutes", type: "int" },
        ],
        primaryKey: ["stoppage_id"],
        note: "Every stoppage belongs to a planned shift; a shift can have several.",
      },
      {
        name: "PartCount",
        columns: [
          { name: "count_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "total_units", type: "int" },
          { name: "good_units", type: "int" },
        ],
        primaryKey: ["count_id"],
        note: "Counter readings for an hour bucket of a planned shift; `good_units` ≤ `total_units`.",
      },
    ],
    examples: [
      {
        OeeMachine: [
          [1, "CNC-07", 60],
          [2, "PRESS-12", 12],
        ],
        ShiftPlan: [
          [1, "2025-04-07", 480],
          [1, "2025-04-08", 480],
          [2, "2025-04-07", 450],
          [2, "2025-04-08", 450],
        ],
        Stoppage: [
          [1, 1, "2025-04-07", 30],
          [2, 1, "2025-04-07", 18],
          [3, 2, "2025-04-07", 45],
          [4, 1, "2025-04-08", 120],
        ],
        PartCount: [
          [1, 1, "2025-04-07", 200, 196],
          [2, 1, "2025-04-07", 180, 170],
          [3, 2, "2025-04-07", 1800, 1750],
          [4, 1, "2025-04-08", 240, 240],
          [5, 1, "2025-04-07", 0, 0],
        ],
      },
    ],
    gen: (rng) => {
      const machines = seq(1, ri(rng, 1, 3)).map((id) => [id, `${pick(rng, ["CNC", "PRESS", "MOULD"])}-${String(id * 4).padStart(2, "0")}`, pick(rng, [12, 30, 45, 60])]);
      const plans: Cell[][] = [];
      const stops: Cell[][] = [];
      const counts: Cell[][] = [];
      for (const [mid, , cycle] of machines) {
        for (const d of ["2025-04-07", "2025-04-08", "2025-04-09"]) {
          if (!chance(rng, 0.7)) continue;
          const planned = pick(rng, [420, 450, 480]);
          plans.push([mid!, d, planned]);
          let down = 0;
          for (let k = ri(rng, 0, 3); k > 0; k--) {
            const mins = ri(rng, 5, 60);
            down += mins;
            stops.push([stops.length + 1, mid!, d, mins]);
          }
          const capacity = Math.floor(((planned - down) * 60) / (cycle as number));
          for (let k = ri(rng, 0, 3); k > 0; k--) {
            const total = ri(rng, 0, Math.floor(capacity / 3));
            counts.push([counts.length + 1, mid!, d, total, chance(rng, 0.3) ? total : ri(rng, Math.floor(total * 0.9), total)]);
          }
        }
      }
      return { OeeMachine: machines, ShiftPlan: plans, Stoppage: stops, PartCount: counts };
    },
    solution: [
      "WITH down AS (",
      "  SELECT machine_id, shift_date, SUM(minutes) AS stop_minutes",
      "  FROM Stoppage GROUP BY machine_id, shift_date",
      "), made AS (",
      "  SELECT machine_id, shift_date, SUM(total_units) AS total_units, SUM(good_units) AS good_units",
      "  FROM PartCount GROUP BY machine_id, shift_date",
      ")",
      "SELECT m.machine_name, p.shift_date,",
      "       ROUND(100 * (p.planned_minutes - COALESCE(d.stop_minutes, 0)) / p.planned_minutes, 1) AS availability_pct,",
      "       ROUND(100 * mk.good_units / NULLIF(mk.total_units, 0), 1) AS quality_pct,",
      "       ROUND(100 * COALESCE(mk.good_units, 0) * m.ideal_cycle_secs / (p.planned_minutes * 60), 1) AS oee_pct",
      "FROM ShiftPlan p",
      "JOIN OeeMachine m ON m.machine_id = p.machine_id",
      "LEFT JOIN down d ON d.machine_id = p.machine_id AND d.shift_date = p.shift_date",
      "LEFT JOIN made mk ON mk.machine_id = p.machine_id AND mk.shift_date = p.shift_date",
      "ORDER BY m.machine_name, p.shift_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.machine_name, p.shift_date,",
        "       ROUND(100 * (p.planned_minutes - (SELECT COALESCE(SUM(s.minutes), 0) FROM Stoppage s",
        "                                          WHERE s.machine_id = p.machine_id AND s.shift_date = p.shift_date)) / p.planned_minutes, 1) AS availability_pct,",
        "       ROUND(100 * (SELECT SUM(c.good_units) FROM PartCount c WHERE c.machine_id = p.machine_id AND c.shift_date = p.shift_date)",
        "             / NULLIF((SELECT SUM(c.total_units) FROM PartCount c WHERE c.machine_id = p.machine_id AND c.shift_date = p.shift_date), 0), 1) AS quality_pct,",
        "       ROUND(100 * (SELECT COALESCE(SUM(c.good_units), 0) FROM PartCount c WHERE c.machine_id = p.machine_id AND c.shift_date = p.shift_date)",
        "             * m.ideal_cycle_secs / (p.planned_minutes * 60), 1) AS oee_pct",
        "FROM ShiftPlan p JOIN OeeMachine m ON m.machine_id = p.machine_id",
        "ORDER BY m.machine_name, p.shift_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Stoppages and counter rows are both many-per-shift. What happens to the sums if you join both to the shift at once?",
      "Aggregate each of them to one row per machine and shift first, then join those to the plan.",
      "Not every shift has stoppages or counts — LEFT JOIN, and decide what a missing total means for each number.",
      "Multiply before dividing, and do the whole OEE formula as one division, so rounding happens only once.",
    ],
    editorial: [
      "The heart of the problem is the **fan-out trap**. A shift with two stoppages and three counter rows joined to both tables at once becomes 2 × 3 = 6 rows, so the stoppage minutes would be counted three times and the units twice. The fix is to aggregate each many-side table to the grain of the answer — one row per `(machine_id, shift_date)` — in its own CTE, and only then join them to `ShiftPlan`.",
      "",
      "Every planned shift must appear, so the plan is the driving table and both aggregates are LEFT JOINed. The missing cases then follow the statement: no stoppage means `COALESCE(stop_minutes, 0)` and 100% availability; no counts means the quality ratio has no denominator — `NULLIF(total_units, 0)` makes it NULL, which also covers counter rows that all read zero; and OEE uses `COALESCE(good_units, 0)`, giving 0.",
      "",
      "OEE is the product of availability, performance and quality, but the three ratios cancel to good units × ideal cycle time ÷ planned time. Computing it as that single division avoids multiplying three already-rounded percentages. The correlated-subquery alternative computes each sum per shift instead of per join; it is correct for the same reason — each subquery sums one table alone — but scans the many-side tables once per shift.",
    ].join("\n"),
  },

  {
    slug: "longest-defect-free-batch-streak-per-line",
    title: "Longest Defect-Free Batch Streak per Line",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "A line's batches run one after another, in `batch_id` order (ids grow over time, but numbering is shared across lines, so a line's ids have gaps). A batch is **clean** when it has 0 defects. The plant celebrates long runs of consecutive clean batches on a line.",
      "",
      "For every line that has at least one batch, return `line_code` and `longest_streak` — the largest number of **consecutive batches of that line** that are all clean, or **0** if none of its batches is clean. Batches of other lines in between do not break a line's streak. Order by `longest_streak` from highest to lowest, then by `line_code`.",
    ].join("\n"),
    tables: [
      {
        name: "LineBatch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "line_code", type: "varchar" },
          { name: "produced_on", type: "date" },
          { name: "defects", type: "int" },
        ],
        primaryKey: ["batch_id"],
        note: "`defects` is never NULL.",
      },
    ],
    examples: [
      {
        LineBatch: [
          [1, "L1-ASSY", "2025-05-01", 0],
          [2, "L1-ASSY", "2025-05-01", 0],
          [3, "L2-ASSY", "2025-05-01", 4],
          [4, "L1-ASSY", "2025-05-02", 2],
          [5, "L1-ASSY", "2025-05-02", 0],
          [6, "L2-ASSY", "2025-05-02", 1],
          [7, "L1-ASSY", "2025-05-03", 0],
          [8, "L3-PAINT", "2025-05-03", 0],
          [9, "L1-ASSY", "2025-05-03", 0],
        ],
      },
    ],
    gen: (rng) => {
      const lines = sample(rng, LINES, ri(rng, 1, 3));
      const n = ri(rng, 1, 24);
      return {
        LineBatch: seq(1, n).map((id) => [id, pick(rng, lines), addDays("2025-05-01", Math.floor(id / 4)), chance(rng, 0.6) ? 0 : ri(rng, 1, 6)]),
      };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT line_code, batch_id, defects,",
      "         ROW_NUMBER() OVER (PARTITION BY line_code ORDER BY batch_id)",
      "       - ROW_NUMBER() OVER (PARTITION BY line_code, CASE WHEN defects = 0 THEN 1 ELSE 0 END ORDER BY batch_id) AS island",
      "  FROM LineBatch",
      "), streaks AS (",
      "  SELECT line_code, island, COUNT(*) AS len",
      "  FROM flagged",
      "  WHERE defects = 0",
      "  GROUP BY line_code, island",
      ")",
      "SELECT l.line_code, COALESCE(MAX(s.len), 0) AS longest_streak",
      "FROM (SELECT DISTINCT line_code FROM LineBatch) l",
      "LEFT JOIN streaks s ON s.line_code = l.line_code",
      "GROUP BY l.line_code",
      "ORDER BY longest_streak DESC, l.line_code",
    ].join("\n"),
    alternatives: [
      [
        "WITH grouped AS (",
        "  SELECT line_code, defects,",
        "         SUM(CASE WHEN defects > 0 THEN 1 ELSE 0 END) OVER (PARTITION BY line_code ORDER BY batch_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp",
        "  FROM LineBatch",
        "), runs AS (",
        "  SELECT line_code, grp, SUM(CASE WHEN defects = 0 THEN 1 ELSE 0 END) AS clean_run",
        "  FROM grouped GROUP BY line_code, grp",
        ")",
        "SELECT line_code, MAX(clean_run) AS longest_streak FROM runs GROUP BY line_code",
        "ORDER BY longest_streak DESC, line_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each line's batches in order; consecutive means consecutive in that numbering, not in `batch_id`.",
      "Within one run of clean batches, the line's row number and the row number among only its clean batches rise together — their difference is constant.",
      "Or: a running count of dirty batches stays the same throughout a clean run, so it can label the run.",
      "Lines with no clean batch still need a row with 0.",
    ],
    editorial: [
      "This is **gaps and islands**: the islands are maximal runs of clean batches within a line. Consecutive has to be measured within the line, so the order is `ROW_NUMBER() OVER (PARTITION BY line_code ORDER BY batch_id)` — the raw ids have gaps where other lines ran.",
      "",
      "The classic labelling subtracts two row numbers: the position among all of the line's batches, and the position among the line's batches of the same kind (clean or dirty). Inside one clean run both increase by one per batch, so their difference is constant, and it changes whenever a dirty batch interrupts. Grouping the clean rows by `(line_code, island)` and counting gives each run's length; the longest per line is the MAX.",
      "",
      "The alternative labels runs with a running total of dirty batches (`SUM(…) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`): every clean batch after the k-th dirty one carries k. Counting the clean rows per label also yields 0 for a label holding only the dirty batch, so lines with no clean batch get 0 for free; the first version needs the LEFT JOIN from the distinct lines with `COALESCE`. Both sort each line once.",
    ].join("\n"),
  },

  {
    slug: "merged-alarm-downtime-per-machine",
    title: "Merged Alarm Downtime per Machine",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Several subsystems of a machine (hydraulics, coolant, safety door…) raise alarms independently, and a machine is **down whenever at least one alarm is active**. Alarms often overlap, so adding up their lengths double-counts. An alarm that starts exactly when another one ends continues the same outage.",
      "",
      "For every machine with at least one alarm, return `machine_id`, `outages` — the number of separate down periods after merging overlapping or touching alarms — and `down_minutes`, the total length of those merged periods in minutes. Order by `machine_id`.",
    ].join("\n"),
    tables: [
      {
        name: "MachineAlarm",
        columns: [
          { name: "alarm_id", type: "int" },
          { name: "machine_id", type: "int" },
          { name: "subsystem", type: "varchar" },
          { name: "alarm_start", type: "datetime" },
          { name: "alarm_end", type: "datetime" },
        ],
        primaryKey: ["alarm_id"],
        note: "Times are whole minutes, and `alarm_end` is always later than `alarm_start`.",
      },
    ],
    examples: [
      {
        MachineAlarm: [
          [1, 1, "hydraulics", "2025-06-02 08:00:00", "2025-06-02 08:30:00"],
          [2, 1, "coolant", "2025-06-02 08:20:00", "2025-06-02 08:50:00"],
          [3, 1, "safety_door", "2025-06-02 08:25:00", "2025-06-02 08:35:00"],
          [4, 1, "coolant", "2025-06-02 08:50:00", "2025-06-02 09:00:00"],
          [5, 1, "hydraulics", "2025-06-02 10:00:00", "2025-06-02 10:15:00"],
          [6, 2, "spindle", "2025-06-02 09:00:00", "2025-06-02 09:40:00"],
          [7, 2, "coolant", "2025-06-02 09:05:00", "2025-06-02 09:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 16);
      const machines = seq(1, ri(rng, 1, 3));
      return {
        MachineAlarm: seq(1, m).map((id) => {
          const start = at("2025-06-02", ri(rng, 8, 11), pick(rng, [0, 10, 15, 20, 30, 40, 45, 50]));
          return [id, pick(rng, machines), pick(rng, ["hydraulics", "coolant", "spindle", "safety_door"]), start, plusMinutes(start, pick(rng, [5, 10, 15, 20, 30, 45]))];
        }),
      };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT machine_id, alarm_id, alarm_start, alarm_end,",
      "         MAX(alarm_end) OVER (PARTITION BY machine_id ORDER BY alarm_start, alarm_id",
      "                              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS reach",
      "  FROM MachineAlarm",
      "), marked AS (",
      "  SELECT machine_id, alarm_id, alarm_start, alarm_end,",
      "         SUM(CASE WHEN reach IS NULL OR alarm_start > reach THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY machine_id ORDER BY alarm_start, alarm_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS outage_no",
      "  FROM ordered",
      "), outages AS (",
      "  SELECT machine_id, outage_no, MIN(alarm_start) AS s, MAX(alarm_end) AS e",
      "  FROM marked GROUP BY machine_id, outage_no",
      ")",
      "SELECT machine_id, COUNT(*) AS outages, SUM(TIMESTAMPDIFF(MINUTE, s, e)) AS down_minutes",
      "FROM outages",
      "GROUP BY machine_id",
      "ORDER BY machine_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT a.machine_id, a.alarm_id, a.alarm_start, a.alarm_end,",
        "         CASE WHEN EXISTS (SELECT 1 FROM MachineAlarm b",
        "                           WHERE b.machine_id = a.machine_id AND b.alarm_end >= a.alarm_start",
        "                             AND (b.alarm_start < a.alarm_start OR (b.alarm_start = a.alarm_start AND b.alarm_id < a.alarm_id)))",
        "              THEN 0 ELSE 1 END AS is_start",
        "  FROM MachineAlarm a",
        "), numbered AS (",
        "  SELECT machine_id, alarm_start, alarm_end,",
        "         SUM(is_start) OVER (PARTITION BY machine_id ORDER BY alarm_start, alarm_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS k",
        "  FROM starts",
        ")",
        "SELECT machine_id, COUNT(*) AS outages, SUM(mins) AS down_minutes FROM (",
        "  SELECT machine_id, k, TIMESTAMPDIFF(MINUTE, MIN(alarm_start), MAX(alarm_end)) AS mins FROM numbered GROUP BY machine_id, k",
        ") t GROUP BY machine_id ORDER BY machine_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sort each machine's alarms by start time. When does an alarm begin a new outage rather than extend the current one?",
      "Comparing with only the previous alarm's end is not enough — a long alarm earlier on can still be active. Track the latest end seen so far.",
      "A running SUM of \"starts a new outage\" flags numbers the outages; then each outage is MIN(start) to MAX(end).",
    ],
    editorial: [
      "This is **merging overlapping intervals**. Order each machine's alarms by `alarm_start` (with `alarm_id` to break ties deterministically). An alarm starts a new outage exactly when it begins after every earlier alarm has ended — that is, after the **maximum** end seen so far, `MAX(alarm_end) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)`. Using only `LAG(alarm_end)` fails when a long alarm swallows a short one and the next alarm still overlaps the long one.",
      "",
      "Touching alarms (start equal to the running end) are not a new outage, so the test is strictly `alarm_start > reach`; the first alarm has no earlier one (`reach` NULL) and always starts one. A running SUM of those 0/1 flags gives every alarm its outage number, and grouping by it yields each merged period from `MIN(alarm_start)` to `MAX(alarm_end)`. The machine's answer is the count of periods and the sum of their `TIMESTAMPDIFF` minutes.",
      "",
      "The alternative decides \"starts an outage\" with NOT EXISTS: no earlier alarm (or same start with smaller id) is still running at this start. That is correct because, in start order, an alarm extends an outage iff some earlier alarm ends at or after its start. It is quadratic per machine; the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "sustained-vibration-breach-episodes",
    title: "Sustained Vibration Breach Episodes",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Condition-monitoring sensors on pumps report vibration velocity in mm/s every few minutes. A reading **above 7.1 mm/s** is a breach. A single spike is noise; the reliability team wants **sustained episodes**: maximal runs of **consecutive readings of one sensor** (in time order) that are all breaches, at least **3 readings** long.",
      "",
      "Return `sensor_id`, `episode_start` and `episode_end` (the first and last reading times of the run), `readings` (its length) and `peak_mm_s` (its highest value). Order by `sensor_id`, then `episode_start`.",
    ].join("\n"),
    tables: [
      {
        name: "VibrationReading",
        columns: [
          { name: "sensor_id", type: "int" },
          { name: "read_at", type: "datetime" },
          { name: "mm_s", type: "decimal" },
        ],
        primaryKey: ["sensor_id", "read_at"],
        note: "`mm_s` is never NULL and has one decimal place.",
      },
    ],
    examples: [
      {
        VibrationReading: [
          [1, "2025-07-01 10:00:00", 6.8],
          [1, "2025-07-01 10:05:00", 7.4],
          [1, "2025-07-01 10:10:00", 8.2],
          [1, "2025-07-01 10:15:00", 7.9],
          [1, "2025-07-01 10:20:00", 7.1],
          [1, "2025-07-01 10:25:00", 9.0],
          [1, "2025-07-01 10:30:00", 9.3],
          [2, "2025-07-01 10:00:00", 7.5],
          [2, "2025-07-01 10:05:00", 7.6],
          [2, "2025-07-01 10:10:00", 7.7],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const s of seq(1, ri(rng, 1, 3))) {
        const k = ri(rng, 0, 12);
        for (let i = 0; i < k; i++) {
          const v = chance(rng, 0.15) ? 7.1 : chance(rng, 0.6) ? ri(rng, 72, 99) / 10 : ri(rng, 50, 70) / 10;
          rows.push([s, at("2025-07-01", 10 + Math.floor((i * 5) / 60), (i * 5) % 60), v]);
        }
      }
      return { VibrationReading: rows };
    },
    solution: [
      "WITH tagged AS (",
      "  SELECT sensor_id, read_at, mm_s,",
      "         CASE WHEN mm_s > 7.1 THEN 1 ELSE 0 END AS breach,",
      "         ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY read_at) AS rn_all,",
      "         ROW_NUMBER() OVER (PARTITION BY sensor_id, CASE WHEN mm_s > 7.1 THEN 1 ELSE 0 END ORDER BY read_at) AS rn_kind",
      "  FROM VibrationReading",
      ")",
      "SELECT sensor_id, MIN(read_at) AS episode_start, MAX(read_at) AS episode_end,",
      "       COUNT(*) AS readings, MAX(mm_s) AS peak_mm_s",
      "FROM tagged",
      "WHERE breach = 1",
      "GROUP BY sensor_id, rn_all - rn_kind",
      "HAVING COUNT(*) >= 3",
      "ORDER BY sensor_id, episode_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH g AS (",
        "  SELECT sensor_id, read_at, mm_s,",
        "         SUM(CASE WHEN mm_s <= 7.1 THEN 1 ELSE 0 END) OVER (PARTITION BY sensor_id ORDER BY read_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS calm_seen",
        "  FROM VibrationReading",
        ")",
        "SELECT sensor_id, MIN(read_at) AS episode_start, MAX(read_at) AS episode_end, COUNT(*) AS readings, MAX(mm_s) AS peak_mm_s",
        "FROM g WHERE mm_s > 7.1",
        "GROUP BY sensor_id, calm_seen HAVING COUNT(*) >= 3",
        "ORDER BY sensor_id, episode_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Consecutive is about each sensor's readings in time order — number them.",
      "Inside a run of breaches, the overall row number and the row number among breaches only move in step.",
      "Group the breach rows by that label, then keep the groups with at least three rows.",
      "A reading of exactly 7.1 is not a breach and ends a run.",
    ],
    editorial: [
      "An episode is an **island** of breach readings within a sensor's time series, so the tools are the gaps-and-islands ones. Number every reading of a sensor by time (`rn_all`), and number it again within its kind, breach or not (`rn_kind`). Along a run of breaches both numbers grow by one per reading, so `rn_all - rn_kind` is constant on the run and jumps whenever a calm reading intervenes. Grouping the breach rows by `(sensor_id, rn_all - rn_kind)` gives one group per run.",
      "",
      "Each group's `MIN(read_at)` and `MAX(read_at)` are the episode's ends, `COUNT(*)` its length and `MAX(mm_s)` its peak; `HAVING COUNT(*) >= 3` drops short spikes. The threshold is strict, so a reading of 7.1 is calm and breaks a run — the same CASE must be used in the flag and in the partition so they agree.",
      "",
      "The alternative labels runs with a running count of calm readings: every breach after the k-th calm reading carries k, and only consecutive breaches share a label. Both are a sort per sensor and one aggregation. Note that consecutive means consecutive *readings*, regardless of the time gap between them.",
    ].join("\n"),
  },

  {
    slug: "median-ev-charging-session-length-by-city",
    title: "Median EV Charging Session Length by City",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Averages of plug-in time are skewed by cars left plugged in overnight, so the operator plans charger capacity on the **median** session length. A session's length is `plugged_out` minus `plugged_in` in whole minutes; a session still in progress (`plugged_out` NULL) is left out.",
      "",
      "For every city with at least one finished session, return `city`, `sessions` (finished sessions) and `median_minutes` — the middle length when the city's lengths are sorted, or the **average of the two middle lengths** when the count is even, **rounded to one decimal**. Order by `city`.",
    ].join("\n"),
    tables: [
      {
        name: "ChargePoint",
        columns: [
          { name: "charge_point_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "power_kw", type: "int" },
        ],
        primaryKey: ["charge_point_id"],
      },
      {
        name: "PlugSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "charge_point_id", type: "int" },
          { name: "plugged_in", type: "datetime" },
          { name: "plugged_out", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "Times are whole minutes; `plugged_out` is NULL while the car is still connected.",
      },
    ],
    examples: [
      {
        ChargePoint: [
          [1, "Bengaluru", 60],
          [2, "Bengaluru", 30],
          [3, "Pune", 60],
          [4, "Chennai", 120],
        ],
        PlugSession: [
          [1, 1, "2024-12-01 09:00:00", "2024-12-01 09:40:00"],
          [2, 2, "2024-12-01 10:00:00", "2024-12-01 11:30:00"],
          [3, 1, "2024-12-01 20:00:00", "2024-12-02 07:00:00"],
          [4, 2, "2024-12-02 08:00:00", "2024-12-02 08:25:00"],
          [5, 3, "2024-12-02 09:10:00", "2024-12-02 10:05:00"],
          [6, 3, "2024-12-02 18:00:00", "2024-12-02 18:30:00"],
          [7, 3, "2024-12-03 07:45:00", "2024-12-03 08:30:00"],
          [8, 4, "2024-12-03 09:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, ["Bengaluru", "Pune", "Chennai", "Mumbai", "Hyderabad"], ri(rng, 1, 3));
      const points = seq(1, ri(rng, 1, 5)).map((id) => [id, pick(rng, cities), pick(rng, [30, 60, 120])]);
      const m = ri(rng, 0, 18);
      return {
        ChargePoint: points,
        PlugSession: seq(1, m).map((id) => {
          const start = at(dateBetween(rng, "2024-12-01", "2024-12-07"), ri(rng, 6, 22), pick(rng, [0, 5, 15, 30, 45]));
          const len = chance(rng, 0.15) ? ri(rng, 300, 700) : pick(rng, [25, 30, 40, 45, 55, 60, 90]);
          return [id, ri(rng, 1, points.length), start, chance(rng, 0.12) ? null : plusMinutes(start, len)];
        }),
      };
    },
    solution: [
      "WITH lengths AS (",
      "  SELECT cp.city, TIMESTAMPDIFF(MINUTE, s.plugged_in, s.plugged_out) AS mins",
      "  FROM PlugSession s",
      "  JOIN ChargePoint cp ON cp.charge_point_id = s.charge_point_id",
      "  WHERE s.plugged_out IS NOT NULL",
      "), ranked AS (",
      "  SELECT city, mins,",
      "         ROW_NUMBER() OVER (PARTITION BY city ORDER BY mins) AS rn,",
      "         COUNT(*) OVER (PARTITION BY city) AS cnt",
      "  FROM lengths",
      ")",
      "SELECT city, MAX(cnt) AS sessions, ROUND(AVG(mins), 1) AS median_minutes",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY city",
      "ORDER BY city",
    ].join("\n"),
    alternatives: [
      [
        "WITH lengths AS (",
        "  SELECT s.session_id, cp.city, TIMESTAMPDIFF(MINUTE, s.plugged_in, s.plugged_out) AS mins",
        "  FROM PlugSession s JOIN ChargePoint cp ON cp.charge_point_id = s.charge_point_id",
        "  WHERE s.plugged_out IS NOT NULL",
        ")",
        "SELECT a.city, (SELECT COUNT(*) FROM lengths c WHERE c.city = a.city) AS sessions, ROUND(AVG(DISTINCT a.mins), 1) AS median_minutes",
        "FROM lengths a",
        "WHERE 2 * (SELECT COUNT(*) FROM lengths b WHERE b.city = a.city AND b.mins <= a.mins) >= (SELECT COUNT(*) FROM lengths c WHERE c.city = a.city)",
        "  AND 2 * (SELECT COUNT(*) FROM lengths b WHERE b.city = a.city AND b.mins >= a.mins) >= (SELECT COUNT(*) FROM lengths c WHERE c.city = a.city)",
        "GROUP BY a.city",
        "ORDER BY a.city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A session's city comes from its charge point; work out each finished session's length in minutes first.",
      "Number the lengths in order within each city, and count them per city, with window functions.",
      "For a count `n`, the middle positions are `FLOOR((n+1)/2)` and `FLOOR((n+2)/2)` — the same position when `n` is odd.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so the median is built from window functions. First compute each finished session's length with `TIMESTAMPDIFF(MINUTE, plugged_in, plugged_out)` and attach its city through the charge point; in-progress sessions are filtered out so they cannot shift the middle.",
      "",
      "Then `ROW_NUMBER() OVER (PARTITION BY city ORDER BY mins)` gives each length its position and `COUNT(*) OVER (PARTITION BY city)` the city's total `n`. The middle positions are `FLOOR((n+1)/2)` and `FLOOR((n+2)/2)`: for n = 3 both are 2; for n = 4 they are 2 and 3. Averaging the one or two rows at those positions gives the median in both cases, and duplicates are harmless because positions, not values, are picked. `MAX(cnt)` just carries the per-city count through the GROUP BY.",
      "",
      "The alternative uses the definition instead: a value is a median candidate when at least half the city's lengths are ≤ it and at least half are ≥ it. Those candidates are exactly the one or two middle values, so `AVG(DISTINCT …)` of them is the median. It is quadratic per city; the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "solar-daily-output-with-missing-days-filled",
    title: "Solar Daily Output With Missing Days Filled",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions"],
    description: [
      "A rooftop solar site has several inverters, each logging the energy it produced on the days its data logger was online; a day with no log from any inverter has no row at all. The client's monthly report must show **every calendar day** from the first logged day to the last logged day.",
      "",
      "Return one row per day of that range with `day`, `total_kwh` (the sum over all inverters that day, **0** for a day with no logs) and `cumulative_kwh` (the running total from the first day up to and including this one). If there are no logs, return no rows. Order by `day`.",
    ].join("\n"),
    tables: [
      {
        name: "InverterLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "inverter_id", type: "int" },
          { name: "logged_on", type: "date" },
          { name: "kwh", type: "int" },
        ],
        primaryKey: ["log_id"],
        note: "An inverter logs at most once a day. The logged days span at most a few weeks.",
      },
    ],
    examples: [
      {
        InverterLog: [
          [1, 1, "2025-02-26", 42],
          [2, 2, "2025-02-26", 39],
          [3, 1, "2025-02-27", 45],
          [4, 1, "2025-03-01", 40],
          [5, 2, "2025-03-01", 37],
          [6, 2, "2025-03-03", 44],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 16);
      const used = new Set<string>();
      const rows: Cell[][] = [];
      const base = dateBetween(rng, "2025-02-10", "2025-02-25");
      for (let i = 0; i < m; i++) {
        const inv = ri(rng, 1, 3);
        const d = addDays(base, ri(rng, 0, 12));
        if (used.has(`${inv}${d}`)) continue;
        used.add(`${inv}${d}`);
        rows.push([rows.length + 1, inv, d, ri(rng, 20, 55)]);
      }
      return { InverterLog: rows };
    },
    solution: [
      "WITH RECURSIVE bounds AS (",
      "  SELECT MIN(logged_on) AS lo, MAX(logged_on) AS hi FROM InverterLog",
      "), days AS (",
      "  SELECT lo AS day, hi FROM bounds WHERE lo IS NOT NULL",
      "  UNION ALL",
      "  SELECT DATE_ADD(day, INTERVAL 1 DAY), hi FROM days WHERE day < hi",
      "), daily AS (",
      "  SELECT logged_on, SUM(kwh) AS kwh FROM InverterLog GROUP BY logged_on",
      ")",
      "SELECT d.day, COALESCE(x.kwh, 0) AS total_kwh,",
      "       SUM(COALESCE(x.kwh, 0)) OVER (ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_kwh",
      "FROM days d",
      "LEFT JOIN daily x ON x.logged_on = d.day",
      "ORDER BY d.day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days AS (",
        "  SELECT MIN(logged_on) AS day FROM InverterLog HAVING COUNT(*) > 0",
        "  UNION ALL",
        "  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM days WHERE day < (SELECT MAX(logged_on) FROM InverterLog)",
        ")",
        "SELECT day,",
        "       (SELECT COALESCE(SUM(kwh), 0) FROM InverterLog WHERE logged_on = d.day) AS total_kwh,",
        "       (SELECT COALESCE(SUM(kwh), 0) FROM InverterLog WHERE logged_on <= d.day) AS cumulative_kwh",
        "FROM days d",
        "ORDER BY day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The days with no logs are missing from the table, so they have to be generated.",
      "A recursive CTE can start at the first logged day and add one day at a time until the last.",
      "LEFT JOIN the daily totals to the generated days, and use a running SUM window for the cumulative column.",
    ],
    editorial: [
      "Rows that do not exist cannot be grouped, so the calendar has to be **generated**. A recursive CTE does it: the anchor selects the first logged day (and carries the last one along), and the recursive step adds `INTERVAL 1 DAY` while the day is before the last. The `lo IS NOT NULL` guard makes an empty log produce no calendar at all — `MIN` over no rows is NULL, and a NULL seed would print one empty row.",
      "",
      "Separately, the logs are summed per day across inverters. LEFT JOINing those totals to the calendar keeps every day; `COALESCE(…, 0)` turns the gaps into zeros. The running total is `SUM(…) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — days are unique, so the explicit ROWS frame and the default RANGE frame agree, but stating it avoids surprises.",
      "",
      "The alternative seeds the recursion with `HAVING COUNT(*) > 0` and computes both totals with correlated subqueries per day. That is fine for a month-long report but quadratic in the number of days; the window version aggregates once and scans the calendar once. The recursion is bounded by the span of the data, here a few weeks.",
    ].join("\n"),
  },

  {
    slug: "service-due-day-each-maintenance-cycle",
    title: "Service-Due Day in Each Maintenance Cycle",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Conditional Logic"],
    description: [
      "Each compressor must be serviced after every `service_interval_hours` hours of running. Daily run hours are logged; a **service** done on a date resets the counter, and it happens before that day's run, so that day's hours already count toward the **new** cycle. The hours logged before a machine's first service form its first cycle.",
      "",
      "For every cycle in which a machine's running hours **reached or passed** its interval, return the **first** day it did so: `machine_id`, `due_on` (that log date) and `hours_at_due` (the cycle's cumulative run hours at the end of that day). A cycle that never reaches the interval is not listed. Order by `machine_id`, then `due_on`.",
    ].join("\n"),
    tables: [
      {
        name: "Compressor",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "model", type: "varchar" },
          { name: "service_interval_hours", type: "int" },
        ],
        primaryKey: ["machine_id"],
      },
      {
        name: "RunLog",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "log_date", type: "date" },
          { name: "run_hours", type: "int" },
        ],
        primaryKey: ["machine_id", "log_date"],
        note: "Hours the machine ran on that day; days it did not run may have 0 or no row.",
      },
      {
        name: "ServiceVisit",
        columns: [
          { name: "machine_id", type: "int" },
          { name: "service_date", type: "date" },
        ],
        primaryKey: ["machine_id", "service_date"],
      },
    ],
    examples: [
      {
        Compressor: [
          [1, "Atlas GA-30", 40],
          [2, "Elgi EG-22", 30],
        ],
        RunLog: [
          [1, "2025-08-01", 16],
          [1, "2025-08-02", 18],
          [1, "2025-08-03", 10],
          [1, "2025-08-04", 20],
          [1, "2025-08-05", 22],
          [1, "2025-08-06", 5],
          [2, "2025-08-01", 12],
          [2, "2025-08-02", 18],
          [2, "2025-08-03", 9],
        ],
        ServiceVisit: [
          [1, "2025-08-04"],
          [2, "2025-08-03"],
        ],
      },
    ],
    gen: (rng) => {
      const machines = seq(1, ri(rng, 1, 3)).map((id) => [id, pick(rng, ["Atlas GA-30", "Elgi EG-22", "Kaeser SK-15"]), pick(rng, [30, 40, 50])]);
      const logs: Cell[][] = [];
      const visits: Cell[][] = [];
      for (const [mid] of machines) {
        const days = ri(rng, 2, 12);
        for (let i = 0; i < days; i++) {
          if (chance(rng, 0.85)) logs.push([mid!, addDays("2025-08-01", i), pick(rng, [0, 8, 10, 12, 15, 20, 24])]);
          if (chance(rng, 0.15)) visits.push([mid!, addDays("2025-08-01", i)]);
        }
      }
      return { Compressor: machines, RunLog: logs, ServiceVisit: visits };
    },
    solution: [
      "WITH cycled AS (",
      "  SELECT r.machine_id, r.log_date, r.run_hours,",
      "         (SELECT COUNT(*) FROM ServiceVisit v WHERE v.machine_id = r.machine_id AND v.service_date <= r.log_date) AS cycle_no",
      "  FROM RunLog r",
      "), running AS (",
      "  SELECT c.machine_id, c.log_date, c.run_hours, k.service_interval_hours AS lim,",
      "         SUM(c.run_hours) OVER (PARTITION BY c.machine_id, c.cycle_no ORDER BY c.log_date",
      "                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum",
      "  FROM cycled c",
      "  JOIN Compressor k ON k.machine_id = c.machine_id",
      ")",
      "SELECT machine_id, log_date AS due_on, cum AS hours_at_due",
      "FROM running",
      "WHERE cum >= lim AND cum - run_hours < lim",
      "ORDER BY machine_id, due_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH cycled AS (",
        "  SELECT r.machine_id, r.log_date, r.run_hours, COUNT(v.service_date) AS cycle_no",
        "  FROM RunLog r LEFT JOIN ServiceVisit v ON v.machine_id = r.machine_id AND v.service_date <= r.log_date",
        "  GROUP BY r.machine_id, r.log_date, r.run_hours",
        "), running AS (",
        "  SELECT c.*, k.service_interval_hours AS lim,",
        "         SUM(run_hours) OVER (PARTITION BY c.machine_id, cycle_no ORDER BY log_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum",
        "  FROM cycled c JOIN Compressor k ON k.machine_id = c.machine_id",
        "), hit AS (",
        "  SELECT machine_id, log_date, cum, ROW_NUMBER() OVER (PARTITION BY machine_id, cycle_no ORDER BY log_date) AS k",
        "  FROM running WHERE cum >= lim",
        ")",
        "SELECT machine_id, log_date AS due_on, cum AS hours_at_due FROM hit WHERE k = 1 ORDER BY machine_id, due_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Give every log row a cycle number: how many services of that machine happened on or before its date.",
      "A running SUM partitioned by machine **and** cycle restarts at every service.",
      "The first crossing is the row where the running total is at least the limit but was below it before this day's hours.",
    ],
    editorial: [
      "This is a **running total with resets**. A window SUM cannot reset by itself, so the trick is to give it a partition that changes at each reset. A row's cycle number is the count of that machine's services dated on or before its log date — a correlated COUNT, or a LEFT JOIN plus GROUP BY. Because a service on day d counts for day d (`<=`), that day's hours fall into the new cycle, as the statement says; logs before any service get cycle 0.",
      "",
      "`SUM(run_hours) OVER (PARTITION BY machine_id, cycle_no ORDER BY log_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` is then the hours since the last service at the end of each day. The first day of a cycle to reach the limit is the one where the total is `>= lim` while the total *before* that day's hours, `cum - run_hours`, was still below it. Since hours are never negative the running total only grows, so this happens at most once per cycle.",
      "",
      "The alternative keeps every row at or past the limit and takes the earliest per cycle with ROW_NUMBER. Both sort each machine's logs once; the cycle numbering is the only quadratic part, and services are few.",
    ].join("\n"),
  },
];
