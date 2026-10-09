import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Travel & hospitality: the questions a revenue manager, an airline ops desk,
 * a rail reservations analyst or a travel agency's finance team asks every
 * week — room nights, occupancy and ADR, double-booked rooms, flight delays
 * and on-time performance, IRCTC-style PNR status and waitlists, agency
 * commissions, cancellation refunds and loyalty points. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight. */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
/** A 10-digit PNR. */
const pnrOf = (rng: () => number): number => ri(rng, 2100000000, 8999999999);

const LEISURE_CITIES = ["Goa", "Jaipur", "Udaipur", "Shimla", "Kochi", "Munnar"] as const;
const HOTELS = [
  "Seaview Residency", "Pink City Palace", "Lakeside Haveli", "Pine Ridge Lodge",
  "Backwater Retreat", "Tea Garden Inn", "Marine Drive Suites", "Hilltop Heritage",
] as const;
const AGENCIES = ["Yatra Tours", "GoTrip Travels", "Sahil Holidays", "Blue Lotus Travel", "Northstar Journeys", "Konkan Getaways"] as const;
const AIRPORTS = ["BLR", "DEL", "BOM", "MAA", "HYD", "CCU", "GOI", "COK"] as const;
const AIRLINES = [["6E", "IndiGo"], ["AI", "Air India"], ["UK", "Vistara"], ["SG", "SpiceJet"], ["QP", "Akasa Air"]] as const;
const DOMAINS = ["gmail.com", "yahoo.co.in", "outlook.com", "rediffmail.com", "corp.tcs.com", "infosys.com"] as const;
const COACHES = ["S1", "S2", "S4", "B1", "B2", "A1", "H1"] as const;
const ROOM_TYPES = ["Deluxe", "Super Deluxe", "Suite", "Standard", "Family"] as const;

export const WORLD_TRAVEL: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "premium-new-year-stays-in-goa",
    title: "Premium New Year Stays in Goa",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The revenue team is planning a thank-you mailer for guests who booked a premium stay in Goa over the New Year.",
      "",
      "Return every booking that is **confirmed**, is at a hotel in `Goa`, has a `nightly_rate` of **at least 8000** rupees, and checks in **between 2024-12-24 and 2025-01-02 inclusive**. Return the columns `booking_id`, `guest_name` and `nightly_rate`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "HotelBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "guest_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "check_in", type: "date" },
          { name: "nightly_rate", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled", "no_show"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per room booking. `nightly_rate` is in rupees, before GST.",
      },
    ],
    examples: [
      {
        HotelBooking: [
          [1, "Aarav", "Goa", "2024-12-28", 9500, "confirmed"],
          [2, "Diya", "Goa", "2024-12-30", 8000, "confirmed"],
          [3, "Kabir", "Jaipur", "2024-12-31", 12000, "confirmed"],
          [4, "Meera", "Goa", "2024-12-26", 15000, "cancelled"],
          [5, "Rohan", "Goa", "2025-01-03", 11000, "confirmed"],
          [6, "Zara", "Goa", "2024-12-24", 7500, "confirmed"],
          [7, "Ishaan", "Goa", "2025-01-02", 13500, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => [
        id,
        who[i]!,
        chance(rng, 0.55) ? "Goa" : pick(rng, LEISURE_CITIES),
        chance(rng, 0.2) ? pick(rng, ["2024-12-24", "2025-01-02", "2024-12-23", "2025-01-03"]) : dateBetween(rng, "2024-12-18", "2025-01-08"),
        chance(rng, 0.2) ? 8000 : roundTo(rng, 3000, 16000, 500),
        pick(rng, ["confirmed", "confirmed", "confirmed", "cancelled", "no_show"]),
      ]);
      return { HotelBooking: rows };
    },
    solution: [
      "SELECT booking_id, guest_name, nightly_rate",
      "FROM HotelBooking",
      "WHERE status = 'confirmed'",
      "  AND city = 'Goa'",
      "  AND nightly_rate >= 8000",
      "  AND check_in BETWEEN '2024-12-24' AND '2025-01-02'",
    ].join("\n"),
    alternatives: [
      "SELECT booking_id, guest_name, nightly_rate FROM HotelBooking WHERE status IN ('confirmed') AND city = 'Goa' AND NOT nightly_rate < 8000 AND check_in >= '2024-12-24' AND check_in <= '2025-01-02'",
    ],
    hints: [
      "Every condition must hold at once, so they are joined with AND.",
      "\"At least 8000\" includes 8000 itself, and \"inclusive\" means both end dates count.",
      "`BETWEEN a AND b` is inclusive at both ends.",
    ],
    editorial: [
      "This is a pure filter on one table: each booking either qualifies or it does not, and nothing has to be counted or combined. Four conditions must all be true, so they are joined with `AND` in the `WHERE` clause: the status is `confirmed` (cancelled bookings and no-shows are not guests to thank), the city is `Goa`, the nightly rate is at least 8000, and the check-in date falls in the holiday window.",
      "",
      "Both boundaries are inclusive. `nightly_rate >= 8000` keeps a booking at exactly 8000, which a strict `>` would lose, and `BETWEEN '2024-12-24' AND '2025-01-02'` keeps check-ins on both end dates. Dates stored as `YYYY-MM-DD` compare correctly as text and as dates, so the range test is safe.",
      "",
      "The alternative spells the same range with `>=` and `<=` and writes the rate test as `NOT nightly_rate < 8000`. With an index on `(city, check_in)` the query reads only the Goa bookings in the window; without one it is a single scan.",
    ].join("\n"),
  },

  {
    slug: "room-nights-sold-per-hotel",
    title: "Room Nights Sold per Hotel",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "A **room night** is one room occupied for one night: a booking from 2024-03-01 to 2024-03-04 is three room nights.",
      "",
      "For every hotel with at least one booking that was **not cancelled**, return `hotel_name` and `room_nights`, the total room nights of its non-cancelled bookings. Hotels with only cancelled bookings, or none at all, do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Hotel",
        columns: [
          { name: "hotel_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["hotel_id"],
        note: "One row per property.",
      },
      {
        name: "Booking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "hotel_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "status", type: "enum", values: ["confirmed", "checked_out", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One room per booking; `check_out` is always after `check_in`, and `hotel_id` always names a hotel.",
      },
    ],
    examples: [
      {
        Hotel: [
          [1, "Seaview Residency", "Goa"],
          [2, "Pink City Palace", "Jaipur"],
          [3, "Pine Ridge Lodge", "Shimla"],
          [4, "Tea Garden Inn", "Munnar"],
        ],
        Booking: [
          [101, 1, "2024-03-01", "2024-03-04", "checked_out"],
          [102, 1, "2024-03-02", "2024-03-03", "confirmed"],
          [103, 2, "2024-02-28", "2024-03-02", "checked_out"],
          [104, 2, "2024-03-05", "2024-03-09", "cancelled"],
          [105, 3, "2024-03-10", "2024-03-12", "cancelled"],
          [106, 1, "2024-03-29", "2024-04-02", "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const hotels = sample(rng, HOTELS, ri(rng, 1, 5)).map((name, i) => [i + 1, name, pick(rng, LEISURE_CITIES)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(101, n).map((id) => {
        const ci = dateBetween(rng, "2024-01-20", "2024-04-10");
        return [id, ri(rng, 1, hotels.length), ci, addDays(ci, ri(rng, 1, 7)), pick(rng, ["confirmed", "checked_out", "checked_out", "cancelled"])];
      });
      return { Hotel: hotels, Booking: rows };
    },
    solution: [
      "SELECT h.hotel_name, SUM(DATEDIFF(b.check_out, b.check_in)) AS room_nights",
      "FROM Hotel h",
      "JOIN Booking b ON b.hotel_id = h.hotel_id",
      "WHERE b.status <> 'cancelled'",
      "GROUP BY h.hotel_id, h.hotel_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT h.hotel_name, t.room_nights",
        "FROM Hotel h",
        "JOIN (SELECT hotel_id, SUM(TIMESTAMPDIFF(DAY, check_in, check_out)) AS room_nights",
        "      FROM Booking WHERE status IN ('confirmed', 'checked_out') GROUP BY hotel_id) t ON t.hotel_id = h.hotel_id",
      ].join("\n"),
    ],
    hints: [
      "The nights of one booking are the days between check-in and check-out — `DATEDIFF(later, earlier)`.",
      "Drop the cancelled bookings before you add anything up.",
      "An inner join plus GROUP BY per hotel leaves out hotels with nothing to add.",
    ],
    editorial: [
      "Each booking contributes `DATEDIFF(check_out, check_in)` room nights: the check-out day itself is not a night, which is exactly what the difference of the two dates counts. The answer per hotel is the sum of that over its bookings, so the query is a join, a filter and a `GROUP BY`.",
      "",
      "The filter `status <> 'cancelled'` runs before grouping, so a cancelled booking adds nothing. Because the join is an inner join, a hotel whose only bookings were cancelled loses all its rows in `WHERE` and never forms a group, and a hotel with no bookings never joins at all — both are left out, as asked. Group by `hotel_id` as well as the name, so two properties sharing a name would still be counted apart.",
      "",
      "The alternative sums per `hotel_id` inside a derived table using `TIMESTAMPDIFF(DAY, …)`, then joins the names on. Either form is one pass over the bookings plus a lookup per hotel.",
    ].join("\n"),
  },

  {
    slug: "flights-departing-over-an-hour-late",
    title: "Flights Departing More Than an Hour Late",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The airline's ops desk files a delay report for every departure that left **more than 60 minutes** after its scheduled time. A cancelled flight has `actual_departure` NULL and is not a delay.",
      "",
      "Return `flight_no`, `scheduled_departure` and `delay_minutes` (whole minutes between the scheduled and actual departure) for every such flight. A flight exactly 60 minutes late is not reported. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FlightDeparture",
        columns: [
          { name: "departure_id", type: "int" },
          { name: "flight_no", type: "varchar" },
          { name: "origin", type: "char" },
          { name: "destination", type: "char" },
          { name: "scheduled_departure", type: "datetime" },
          { name: "actual_departure", type: "datetime" },
        ],
        primaryKey: ["departure_id"],
        note: "One row per operated (or cancelled) flight; times are local and on the minute. `actual_departure` is NULL for a cancelled flight.",
      },
    ],
    examples: [
      {
        FlightDeparture: [
          [1, "6E 512", "BLR", "DEL", "2024-07-01 06:10:00", "2024-07-01 06:25:00"],
          [2, "AI 803", "DEL", "BOM", "2024-07-01 09:00:00", "2024-07-01 10:45:00"],
          [3, "UK 829", "BOM", "MAA", "2024-07-01 21:30:00", "2024-07-01 22:30:00"],
          [4, "SG 116", "GOI", "BLR", "2024-07-01 23:20:00", "2024-07-02 01:05:00"],
          [5, "6E 219", "HYD", "CCU", "2024-07-02 07:40:00", null],
          [6, "QP 1401", "BOM", "BLR", "2024-07-02 13:15:00", "2024-07-02 14:16:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [code] = pick(rng, AIRLINES);
        const [o, d] = sample(rng, AIRPORTS, 2);
        const day = dateBetween(rng, "2024-07-01", "2024-07-10");
        const sched = ri(rng, 5 * 12, 23 * 12) * 5;
        const delay = chance(rng, 0.15) ? 60 : chance(rng, 0.15) ? 61 : ri(rng, -5, 200);
        return [id, `${code} ${ri(rng, 100, 999)}`, o!, d!, at(day, sched), chance(rng, 0.1) ? null : at(day, sched + delay)];
      });
      return { FlightDeparture: rows };
    },
    solution: [
      "SELECT flight_no, scheduled_departure,",
      "       TIMESTAMPDIFF(MINUTE, scheduled_departure, actual_departure) AS delay_minutes",
      "FROM FlightDeparture",
      "WHERE TIMESTAMPDIFF(MINUTE, scheduled_departure, actual_departure) > 60",
    ].join("\n"),
    alternatives: [
      [
        "SELECT flight_no, scheduled_departure, TIMESTAMPDIFF(MINUTE, scheduled_departure, actual_departure) AS delay_minutes",
        "FROM FlightDeparture",
        "WHERE actual_departure IS NOT NULL AND actual_departure > DATE_ADD(scheduled_departure, INTERVAL 60 MINUTE)",
      ].join("\n"),
    ],
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` gives the minutes from `start` to `end`.",
      "A delay that crosses midnight is still a difference between two datetimes, not between two clock times.",
      "What does the difference come out as when `actual_departure` is NULL — and does it pass a `>` test?",
    ],
    editorial: [
      "The delay of a flight is the gap between two datetimes, `TIMESTAMPDIFF(MINUTE, scheduled_departure, actual_departure)`. Comparing full datetimes rather than just the clock times matters for a late-evening departure that leaves after midnight: 23:20 to 01:05 the next day is 105 minutes, while the clock times alone would look like a negative delay.",
      "",
      "The report keeps flights where that difference is **strictly** greater than 60, so a flight exactly an hour late is left out and one at 61 minutes is in. The same expression is selected as `delay_minutes`.",
      "",
      "Cancelled flights need no special case: with `actual_departure` NULL the difference is NULL, and `NULL > 60` is not true, so the row is filtered out. The alternative compares the actual time with `DATE_ADD(scheduled_departure, INTERVAL 60 MINUTE)` instead, which can use an index on the departure time. Either way the query is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "flight-bookings-by-sales-channel",
    title: "Flight Bookings by Sales Channel",
    difficulty: "EASY",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "Tickets are sold either through a partner travel agency or directly on the airline's own app. A direct booking has `agency_id` NULL.",
      "",
      "Return **one row per booking** with the columns `booking_ref`, `passenger_name` and `channel`, where `channel` is the agency's name, or the text `Direct` for a booking with no agency. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "TravelAgency",
        columns: [
          { name: "agency_id", type: "int" },
          { name: "agency_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["agency_id"],
        note: "One row per partner agency.",
      },
      {
        name: "FlightBooking",
        columns: [
          { name: "booking_ref", type: "char" },
          { name: "passenger_name", type: "varchar" },
          { name: "agency_id", type: "int" },
          { name: "fare", type: "int" },
        ],
        primaryKey: ["booking_ref"],
        note: "`agency_id` names the agency that sold the ticket, or is NULL for a direct booking.",
      },
    ],
    examples: [
      {
        TravelAgency: [
          [1, "Yatra Tours", "Delhi"],
          [2, "Konkan Getaways", "Mumbai"],
          [3, "Blue Lotus Travel", "Kochi"],
        ],
        FlightBooking: [
          ["QX7H2P", "Ananya", 1, 6420],
          ["MB91TZ", "Vikram", null, 4890],
          ["KD3W8R", "Sneha", 2, 7310],
          ["PL0Q5N", "Farhan", 1, 5120],
          ["ZT4E6C", "Pooja", null, 9980],
        ],
      },
    ],
    gen: (rng) => {
      const agencies = sample(rng, AGENCIES, ri(rng, 1, 4)).map((name, i) => [i + 1, name, pick(rng, ["Delhi", "Mumbai", "Bengaluru", "Kochi", "Pune"])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const who = names(rng, n);
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const refs = new Set<string>();
      while (refs.size < n) refs.add(Array.from({ length: 6 }, () => letters[ri(rng, 0, letters.length - 1)]).join(""));
      const directRate = pick(rng, [0, 0.3, 0.6, 1]);
      const rows: Cell[][] = [...refs].map((ref, i) => [ref, who[i]!, chance(rng, directRate) ? null : ri(rng, 1, agencies.length), roundTo(rng, 2500, 14000, 10)]);
      return { TravelAgency: agencies, FlightBooking: rows };
    },
    solution: [
      "SELECT b.booking_ref, b.passenger_name, COALESCE(a.agency_name, 'Direct') AS channel",
      "FROM FlightBooking b",
      "LEFT JOIN TravelAgency a ON a.agency_id = b.agency_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.booking_ref, b.passenger_name,",
        "       CASE WHEN b.agency_id IS NULL THEN 'Direct'",
        "            ELSE (SELECT a.agency_name FROM TravelAgency a WHERE a.agency_id = b.agency_id) END AS channel",
        "FROM FlightBooking b",
      ].join("\n"),
      "SELECT b.booking_ref, b.passenger_name, IFNULL(a.agency_name, 'Direct') AS channel FROM TravelAgency a RIGHT JOIN FlightBooking b ON a.agency_id = b.agency_id",
    ],
    hints: [
      "Every booking must appear, even the ones whose agency is NULL — which join keeps them?",
      "After a LEFT JOIN, a direct booking has NULL in every agency column.",
      "`COALESCE(x, 'Direct')` replaces a NULL with a fallback.",
    ],
    editorial: [
      "The answer has one row per booking, so the query starts from `FlightBooking` and looks up the agency. An inner join would silently drop every direct booking, because `NULL = agency_id` never matches; a **LEFT JOIN** keeps them, with NULL in every column of `TravelAgency`.",
      "",
      "Those NULLs are then turned into the label the report wants. `COALESCE(a.agency_name, 'Direct')` returns the agency's name when there is one and `Direct` otherwise; `IFNULL` is MySQL's two-argument spelling of the same thing, and a `CASE` on `agency_id IS NULL` with a scalar subquery for the name is a third way to write it.",
      "",
      "Since `agency_id` is the agency's primary key, each booking matches at most one agency and no row is duplicated. The lookup is one index probe per booking.",
    ].join("\n"),
  },

  {
    slug: "train-pnr-current-status-labels",
    title: "Current Status Labels for Train PNRs",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "A rail reservation is in exactly one of three states: **confirmed** (it has a `coach` and a `berth_no`), **RAC** (it has an `rac_no`) or **waitlisted** (it has a `wl_no`). The other state columns are NULL.",
      "",
      "Return `pnr`, `passenger_name` and `current_status`, where `current_status` reads like the enquiry screen: `CNF/<coach>/<berth_no>` for a confirmed berth (for example `CNF/S4/32`), `RAC <rac_no>` (for example `RAC 7`) or `WL <wl_no>` (for example `WL 23`). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "pnr", type: "bigint" },
          { name: "passenger_name", type: "varchar" },
          { name: "train_no", type: "int" },
          { name: "coach", type: "varchar" },
          { name: "berth_no", type: "int" },
          { name: "rac_no", type: "int" },
          { name: "wl_no", type: "int" },
        ],
        primaryKey: ["pnr"],
        note: "One passenger per PNR. Exactly one of (`coach` and `berth_no`), `rac_no` or `wl_no` is filled in.",
      },
    ],
    examples: [
      {
        Reservation: [
          [4521876390, "Kavya", 12627, "S4", 32, null, null],
          [4521876391, "Arjun", 12627, null, null, 7, null],
          [6203914875, "Neha", 12951, null, null, null, 23],
          [6203914880, "Harsh", 12951, "B2", 5, null, null],
          [2876104553, "Simran", 16345, null, null, null, 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const who = names(rng, n);
      const pnrs = new Set<number>();
      while (pnrs.size < n) pnrs.add(pnrOf(rng));
      const rows: Cell[][] = [...pnrs].map((pnr, i) => {
        const train = pick(rng, [12627, 12951, 16345, 22439, 12213]);
        const s = ri(rng, 0, 2);
        if (s === 0) return [pnr, who[i]!, train, pick(rng, COACHES), ri(rng, 1, 72), null, null];
        if (s === 1) return [pnr, who[i]!, train, null, null, ri(rng, 1, 40), null];
        return [pnr, who[i]!, train, null, null, null, ri(rng, 1, 120)];
      });
      return { Reservation: rows };
    },
    solution: [
      "SELECT pnr, passenger_name,",
      "       CASE",
      "         WHEN coach IS NOT NULL THEN CONCAT('CNF/', coach, '/', berth_no)",
      "         WHEN rac_no IS NOT NULL THEN CONCAT('RAC ', rac_no)",
      "         ELSE CONCAT('WL ', wl_no)",
      "       END AS current_status",
      "FROM Reservation",
    ].join("\n"),
    alternatives: [
      "SELECT pnr, passenger_name, COALESCE(CONCAT('CNF/', coach, '/', berth_no), CONCAT('RAC ', rac_no), CONCAT('WL ', wl_no)) AS current_status FROM Reservation",
      "SELECT pnr, passenger_name, IF(coach IS NULL, IF(rac_no IS NULL, CONCAT_WS(' ', 'WL', wl_no), CONCAT_WS(' ', 'RAC', rac_no)), CONCAT_WS('/', 'CNF', coach, berth_no)) AS current_status FROM Reservation",
    ],
    hints: [
      "Decide the state first, then build the text: a CASE with one branch per state.",
      "`CONCAT` joins its arguments into one string and accepts numbers too.",
      "In MySQL `CONCAT` returns NULL when any argument is NULL — can that be used instead of the CASE?",
    ],
    editorial: [
      "Each row needs a different label depending on which state columns are filled, so the natural shape is a `CASE` with one branch per state: a non-NULL `coach` means a confirmed berth, otherwise a non-NULL `rac_no` means RAC, and otherwise the passenger is on the waitlist. Inside each branch `CONCAT` builds the text, turning the numbers into strings on the way.",
      "",
      "There is a neat trick hiding in MySQL's `CONCAT` rule: it returns NULL if any argument is NULL. So `CONCAT('CNF/', coach, '/', berth_no)` is NULL for every row that is not confirmed, `CONCAT('RAC ', rac_no)` is NULL unless the row is in RAC, and `COALESCE` over the three picks the one that exists — the first alternative.",
      "",
      "`CONCAT_WS` (concat with separator) is a third spelling. Every form reads each row once; nothing is grouped or joined.",
    ].join("\n"),
  },

  {
    slug: "loyalty-members-per-email-domain",
    title: "Hotel Loyalty Members per Email Domain",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "The hotel chain's loyalty programme wants to know which email providers and corporate domains its members sign up with, to plan a corporate-rates campaign. The **domain** of an email address is everything after the `@`.",
      "",
      "Return `domain` and `members` (how many members use it), ordered by `members` **descending**, then by `domain` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "LoyaltyMember",
        columns: [
          { name: "member_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "email", type: "varchar" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["member_id"],
        note: "One row per member. Every email is stored in lower case and contains exactly one `@`.",
      },
    ],
    examples: [
      {
        LoyaltyMember: [
          [1, "Aditi Sharma", "aditi.sharma@gmail.com", "2023-04-11"],
          [2, "Rahul Iyer", "rahul.iyer@corp.tcs.com", "2023-06-02"],
          [3, "Priya Nair", "priyan@gmail.com", "2023-09-19"],
          [4, "Karan Mehta", "karan.m@infosys.com", "2024-01-07"],
          [5, "Saanvi Rao", "saanvi.rao@corp.tcs.com", "2024-02-25"],
          [6, "Dev Joshi", "devj@outlook.com", "2024-05-30"],
          [7, "Ira Bose", "ira.bose@gmail.com", "2024-08-14"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const who = names(rng, n);
      const pool = sample(rng, DOMAINS, ri(rng, 1, 5));
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const first = who[i]!;
        return [id, first, `${first.toLowerCase()}${ri(rng, 1, 99)}@${pick(rng, pool)}`, dateBetween(rng, "2023-01-01", "2025-06-30")];
      });
      return { LoyaltyMember: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(email, '@', -1) AS domain, COUNT(*) AS members",
      "FROM LoyaltyMember",
      "GROUP BY SUBSTRING_INDEX(email, '@', -1)",
      "ORDER BY members DESC, domain",
    ].join("\n"),
    alternatives: [
      [
        "SELECT domain, COUNT(*) AS members",
        "FROM (SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS domain FROM LoyaltyMember) d",
        "GROUP BY domain",
        "ORDER BY COUNT(*) DESC, domain ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Cut the address at the `@` and keep the right-hand part.",
      "`SUBSTRING_INDEX(s, '@', -1)` returns what follows the last `@`; `LOCATE` with `SUBSTRING` works too.",
      "Group by the extracted domain and count the rows in each group.",
    ],
    editorial: [
      "The work is in extracting the domain; after that it is a plain count per group. `SUBSTRING_INDEX(email, '@', -1)` returns everything after the last `@` (a negative count counts delimiters from the right), which is the domain because each address has exactly one. Equivalently, `LOCATE('@', email)` finds the position of the `@` and `SUBSTRING(email, pos + 1)` takes the rest.",
      "",
      "Group by that expression — or compute it in a derived table and group by its alias — and `COUNT(*)` the members of each domain. The report is ordered, so the `ORDER BY` fixes both keys: the count descending, then the domain alphabetically so that two domains with the same count always come out in the same order.",
      "",
      "Because the addresses are stored in lower case, `Gmail.com` and `gmail.com` can never split one provider into two groups; on real data you would wrap the expression in `LOWER()`. The query is one scan plus a sort of the (few) groups.",
    ].join("\n"),
  },

  {
    slug: "hotel-rooms-priced-above-average-tariff",
    title: "Hotel Rooms Priced Above the Average Tariff",
    difficulty: "EASY",
    topics: ["Subqueries"],
    description: [
      "A booking aggregator lists the rack tariff of every room type it sells. The pricing team wants the rooms whose tariff is **strictly above the average tariff of all rooms** in the table.",
      "",
      "Return `room_id`, `hotel_name`, `room_type` and `tariff` for those rooms, in any order. A room exactly at the average is not included.",
    ].join("\n"),
    tables: [
      {
        name: "Room",
        columns: [
          { name: "room_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
          { name: "room_type", type: "varchar" },
          { name: "tariff", type: "int" },
        ],
        primaryKey: ["room_id"],
        note: "One row per room type the aggregator sells; `tariff` is the nightly rack rate in rupees.",
      },
    ],
    examples: [
      {
        Room: [
          [1, "Seaview Residency", "Deluxe", 6500],
          [2, "Seaview Residency", "Suite", 14000],
          [3, "Lakeside Haveli", "Standard", 4000],
          [4, "Lakeside Haveli", "Suite", 9500],
          [5, "Pine Ridge Lodge", "Family", 8000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, HOTELS), pick(rng, ROOM_TYPES), roundTo(rng, 2000, 16000, 500)]);
      // Sometimes a room sits exactly on the average.
      if (n >= 3 && chance(rng, 0.3)) {
        rows[0]![3] = 4000;
        rows[1]![3] = 8000;
        rows[2]![3] = 12000;
        for (let i = 3; i < n; i += 2) {
          rows[i]![3] = 8000 + 500 * (i + 1);
          if (rows[i + 1]) rows[i + 1]![3] = 8000 - 500 * (i + 1);
        }
      }
      return { Room: rows };
    },
    solution: [
      "SELECT room_id, hotel_name, room_type, tariff",
      "FROM Room",
      "WHERE tariff > (SELECT AVG(tariff) FROM Room)",
    ].join("\n"),
    alternatives: [
      "SELECT r.room_id, r.hotel_name, r.room_type, r.tariff FROM Room r CROSS JOIN (SELECT AVG(tariff) AS avg_tariff FROM Room) a WHERE r.tariff > a.avg_tariff",
      "SELECT room_id, hotel_name, room_type, tariff FROM (SELECT r.*, AVG(tariff) OVER () AS avg_tariff FROM Room r) x WHERE tariff > avg_tariff",
    ],
    hints: [
      "First work out one number: the average tariff over the whole table.",
      "A subquery that returns a single value can sit on the right of a comparison.",
      "Aggregates cannot appear in `WHERE` directly — that is what the subquery is for.",
    ],
    editorial: [
      "`WHERE tariff > AVG(tariff)` is not allowed: `WHERE` filters single rows before any aggregate exists. The average has to be computed separately and then compared against, and a **scalar subquery** does exactly that — `(SELECT AVG(tariff) FROM Room)` returns one value, which every row is compared with.",
      "",
      "The comparison is strict, so a room priced exactly at the average stays out. The tariffs are whole rupees and the average is an exact decimal in both MySQL and the judge, so the equality case behaves the same everywhere.",
      "",
      "The same value can be joined on as a one-row derived table (`CROSS JOIN`), or attached to every row with the window `AVG(tariff) OVER ()` and filtered in an outer query. The subquery is not correlated, so the database computes it once: two passes over the table in total. On an empty table the average is NULL and nothing is returned.",
    ].join("\n"),
  },

  {
    slug: "loyalty-tier-headcount-from-points",
    title: "Loyalty Tier Headcount From Points Balance",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "An airline's frequent-flyer tiers come from the points balance: **Platinum** at 50000 points or more, **Gold** at 20000 or more, **Silver** at 5000 or more, and **Blue** below 5000.",
      "",
      "Return `tier` and `members` (the number of members in that tier) for every tier that has at least one member. A balance exactly on a threshold belongs to the higher tier. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FlyerAccount",
        columns: [
          { name: "member_id", type: "int" },
          { name: "member_name", type: "varchar" },
          { name: "points_balance", type: "int" },
        ],
        primaryKey: ["member_id"],
        note: "One row per frequent-flyer account; `points_balance` is never NULL or negative.",
      },
    ],
    examples: [
      {
        FlyerAccount: [
          [1, "Riya", 62000],
          [2, "Nikhil", 20000],
          [3, "Tanvi", 18750],
          [4, "Aisha", 4999],
          [5, "Vivaan", 5000],
          [6, "Maria", 31200],
          [7, "John", 1200],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const who = names(rng, n);
      const lean = pick(rng, [[0, 6000], [0, 80000], [15000, 60000], [0, 25000]] as const);
      const rows: Cell[][] = seq(1, n).map((id, i) => [
        id,
        who[i]!,
        chance(rng, 0.2) ? pick(rng, [4999, 5000, 19999, 20000, 49999, 50000]) : ri(rng, lean[0], lean[1]),
      ]);
      return { FlyerAccount: rows };
    },
    solution: [
      "SELECT tier, COUNT(*) AS members",
      "FROM (",
      "  SELECT CASE",
      "           WHEN points_balance >= 50000 THEN 'Platinum'",
      "           WHEN points_balance >= 20000 THEN 'Gold'",
      "           WHEN points_balance >= 5000 THEN 'Silver'",
      "           ELSE 'Blue'",
      "         END AS tier",
      "  FROM FlyerAccount",
      ") t",
      "GROUP BY tier",
    ].join("\n"),
    alternatives: [
      [
        "SELECT 'Platinum' AS tier, COUNT(*) AS members FROM FlyerAccount WHERE points_balance >= 50000 HAVING COUNT(*) > 0",
        "UNION ALL SELECT 'Gold', COUNT(*) FROM FlyerAccount WHERE points_balance >= 20000 AND points_balance < 50000 HAVING COUNT(*) > 0",
        "UNION ALL SELECT 'Silver', COUNT(*) FROM FlyerAccount WHERE points_balance >= 5000 AND points_balance < 20000 HAVING COUNT(*) > 0",
        "UNION ALL SELECT 'Blue', COUNT(*) FROM FlyerAccount WHERE points_balance < 5000 HAVING COUNT(*) > 0",
      ].join("\n"),
    ],
    hints: [
      "Turn each balance into a tier name with a CASE expression.",
      "A CASE takes the first branch that matches, so test the highest threshold first.",
      "Then group by the tier and count.",
    ],
    editorial: [
      "The tiers are not stored, so each balance is first mapped to its tier with a `CASE` expression, and then the rows are counted per tier. Because `CASE` returns the first branch whose condition is true, testing the thresholds from the top down — 50000, then 20000, then 5000 — gives each member exactly one tier without writing both ends of every range. A balance of exactly 20000 hits `>= 20000` and lands in Gold, as the statement requires.",
      "",
      "Computing the tier in a derived table and grouping by its alias keeps the expression in one place. Grouping only produces groups for tiers that actually occur, so an empty tier never appears.",
      "",
      "The alternative counts each tier with its own `WHERE` range and stitches the four counts together with `UNION ALL`, using `HAVING COUNT(*) > 0` to drop empty tiers; it is four scans instead of one, and every range has to be written with both ends.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    slug: "hotel-occupancy-on-new-years-eve",
    title: "Hotel Occupancy on New Year's Eve",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "A booking occupies its rooms on every night from `check_in` up to, but not including, `check_out`. So a booking is in-house on the night of **2024-12-31** when `check_in <= '2024-12-31'` and `check_out > '2024-12-31'`. Cancelled bookings occupy nothing.",
      "",
      "For **every hotel**, return `hotel_name`, `rooms_sold` (rooms occupied that night) and `occupancy_pct` = 100 × `rooms_sold` / `total_rooms`, **rounded to 2 decimals**. A hotel with nothing in-house shows 0 and 0. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Property",
        columns: [
          { name: "hotel_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
          { name: "total_rooms", type: "int" },
        ],
        primaryKey: ["hotel_id"],
        note: "One row per hotel; `total_rooms` is the sellable inventory.",
      },
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "hotel_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "rooms", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "checked_in", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "A reservation may hold several rooms. `check_out` is after `check_in`.",
      },
    ],
    examples: [
      {
        Property: [
          [1, "Seaview Residency", 40],
          [2, "Pine Ridge Lodge", 12],
          [3, "Lakeside Haveli", 25],
        ],
        Reservation: [
          [1, 1, "2024-12-29", "2025-01-02", 6, "checked_in"],
          [2, 1, "2024-12-31", "2025-01-01", 4, "confirmed"],
          [3, 1, "2024-12-30", "2024-12-31", 3, "checked_in"],
          [4, 2, "2024-12-28", "2025-01-03", 5, "checked_in"],
          [5, 2, "2024-12-31", "2025-01-02", 2, "cancelled"],
          [6, 3, "2025-01-01", "2025-01-04", 8, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const hotels = sample(rng, HOTELS, ri(rng, 1, 5)).map((name, i) => [i + 1, name, pick(rng, [12, 15, 20, 24, 25, 30, 40, 50, 60, 80])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ci = chance(rng, 0.2) ? "2024-12-31" : dateBetween(rng, "2024-12-25", "2025-01-02");
        const co = chance(rng, 0.2) ? "2024-12-31" > ci ? "2024-12-31" : addDays(ci, 1) : addDays(ci, ri(rng, 1, 5));
        return [id, ri(rng, 1, hotels.length), ci, co, ri(rng, 1, 6), pick(rng, ["confirmed", "checked_in", "checked_in", "cancelled"])];
      });
      return { Property: hotels, Reservation: rows };
    },
    solution: [
      "SELECT p.hotel_name,",
      "       COALESCE(SUM(r.rooms), 0) AS rooms_sold,",
      "       ROUND(100 * COALESCE(SUM(r.rooms), 0) / p.total_rooms, 2) AS occupancy_pct",
      "FROM Property p",
      "LEFT JOIN Reservation r",
      "  ON r.hotel_id = p.hotel_id",
      " AND r.status <> 'cancelled'",
      " AND r.check_in <= '2024-12-31' AND r.check_out > '2024-12-31'",
      "GROUP BY p.hotel_id, p.hotel_name, p.total_rooms",
    ].join("\n"),
    alternatives: [
      [
        "SELECT hotel_name, sold AS rooms_sold, ROUND(100 * sold / total_rooms, 2) AS occupancy_pct",
        "FROM (SELECT p.hotel_name, p.total_rooms,",
        "             (SELECT COALESCE(SUM(r.rooms), 0) FROM Reservation r",
        "              WHERE r.hotel_id = p.hotel_id AND r.status IN ('confirmed', 'checked_in')",
        "                AND '2024-12-31' BETWEEN r.check_in AND DATE_SUB(r.check_out, INTERVAL 1 DAY)) AS sold",
        "      FROM Property p) t",
      ].join("\n"),
      [
        "SELECT p.hotel_name,",
        "       SUM(CASE WHEN r.status <> 'cancelled' AND r.check_in <= '2024-12-31' AND r.check_out > '2024-12-31' THEN r.rooms ELSE 0 END) AS rooms_sold,",
        "       ROUND(100 * SUM(CASE WHEN r.status <> 'cancelled' AND r.check_in <= '2024-12-31' AND r.check_out > '2024-12-31' THEN r.rooms ELSE 0 END) / p.total_rooms, 2) AS occupancy_pct",
        "FROM Property p LEFT JOIN Reservation r ON r.hotel_id = p.hotel_id",
        "GROUP BY p.hotel_id, p.hotel_name, p.total_rooms",
      ].join("\n"),
    ],
    hints: [
      "Write the \"in-house that night\" test first: which check-in and check-out dates cover the night of the 31st?",
      "Every hotel must appear, so start from the hotels and LEFT JOIN the reservations.",
      "If the date and status tests sit in `WHERE`, what happens to a hotel with no matching reservation?",
      "`SUM` over no rows is NULL — turn it into 0.",
    ],
    editorial: [
      "A reservation covers a night when the night falls in the half-open range `[check_in, check_out)`: a guest checking in on the 31st sleeps there, a guest checking out on the 31st does not. That is the test `check_in <= '2024-12-31' AND check_out > '2024-12-31'`, together with excluding cancellations.",
      "",
      "Every hotel must be reported, so the query starts from `Property` and LEFT JOINs the reservations. The crucial detail is *where* the tests go. Put them in `WHERE` and a hotel with no in-house reservation loses its only (NULL-padded) row and vanishes; put them in the `ON` clause and the hotel survives with NULLs, which `COALESCE(SUM(r.rooms), 0)` turns into zero. Occupancy is then `100 * rooms_sold / total_rooms`, rounded to two decimals as asked — the divide is decimal division in MySQL, so 7 of 12 rooms is 58.33.",
      "",
      "The alternatives compute the same total with a correlated subquery per hotel (writing the night test with `BETWEEN` and `DATE_SUB`) or with conditional aggregation over a plain LEFT JOIN. All are one pass over the reservations per hotel; an index on `(hotel_id, check_in)` keeps it cheap.",
    ].join("\n"),
  },

  {
    slug: "average-daily-rate-by-hotel-and-month",
    title: "Average Daily Rate by Hotel and Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "**ADR** (average daily rate) is the room revenue divided by the room nights sold: a 3-night stay at 4000 and a 1-night stay at 8000 give (12000 + 8000) / 4 = 5000, not the average of the two rates. Only stays with status `checked_out` count, and a stay belongs to the month of its `check_in`.",
      "",
      "Return `hotel_name`, `stay_month` (as `YYYY-MM`), `room_nights` and `adr` (**rounded to 2 decimals**) for every hotel and month with at least one checked-out stay, ordered by `hotel_name`, then `stay_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Hotel",
        columns: [
          { name: "hotel_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
        ],
        primaryKey: ["hotel_id"],
        note: "One row per hotel; names are unique.",
      },
      {
        name: "Stay",
        columns: [
          { name: "stay_id", type: "int" },
          { name: "hotel_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "nightly_rate", type: "int" },
          { name: "status", type: "enum", values: ["checked_out", "cancelled", "no_show"] },
        ],
        primaryKey: ["stay_id"],
        note: "One room per stay at one `nightly_rate` (rupees) for every night; `check_out` is after `check_in`.",
      },
    ],
    examples: [
      {
        Hotel: [
          [1, "Pink City Palace"],
          [2, "Backwater Retreat"],
        ],
        Stay: [
          [1, 1, "2024-10-03", "2024-10-06", 4000, "checked_out"],
          [2, 1, "2024-10-20", "2024-10-21", 8000, "checked_out"],
          [3, 1, "2024-10-25", "2024-10-27", 6000, "cancelled"],
          [4, 1, "2024-11-30", "2024-12-02", 5200, "checked_out"],
          [5, 2, "2024-11-02", "2024-11-05", 7600, "checked_out"],
          [6, 2, "2024-11-15", "2024-11-17", 6400, "checked_out"],
          [7, 2, "2024-12-24", "2024-12-26", 9200, "no_show"],
        ],
      },
    ],
    gen: (rng) => {
      const hotels = sample(rng, HOTELS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ci = dateBetween(rng, "2024-10-01", "2024-12-31");
        return [id, ri(rng, 1, hotels.length), ci, addDays(ci, ri(rng, 1, 4)), roundTo(rng, 2400, 12000, 400), pick(rng, ["checked_out", "checked_out", "checked_out", "cancelled", "no_show"])];
      });
      return { Hotel: hotels, Stay: rows };
    },
    solution: [
      "SELECT h.hotel_name,",
      "       DATE_FORMAT(s.check_in, '%Y-%m') AS stay_month,",
      "       SUM(DATEDIFF(s.check_out, s.check_in)) AS room_nights,",
      "       ROUND(SUM(s.nightly_rate * DATEDIFF(s.check_out, s.check_in)) / SUM(DATEDIFF(s.check_out, s.check_in)), 2) AS adr",
      "FROM Stay s",
      "JOIN Hotel h ON h.hotel_id = s.hotel_id",
      "WHERE s.status = 'checked_out'",
      "GROUP BY h.hotel_name, DATE_FORMAT(s.check_in, '%Y-%m')",
      "ORDER BY h.hotel_name, stay_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH n AS (",
        "  SELECT hotel_id, LEFT(check_in, 7) AS stay_month, DATEDIFF(check_out, check_in) AS nights, nightly_rate",
        "  FROM Stay WHERE status = 'checked_out'",
        ")",
        "SELECT h.hotel_name, n.stay_month, SUM(n.nights) AS room_nights, ROUND(SUM(n.nights * n.nightly_rate) / SUM(n.nights), 2) AS adr",
        "FROM n JOIN Hotel h ON h.hotel_id = n.hotel_id",
        "GROUP BY h.hotel_name, n.stay_month",
        "ORDER BY h.hotel_name ASC, n.stay_month ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "ADR is a weighted average: revenue over nights, not the average of the rates.",
      "Revenue of one stay = its rate × its nights; nights = `DATEDIFF(check_out, check_in)`.",
      "Bucket by month with `DATE_FORMAT(check_in, '%Y-%m')` and group by hotel and that bucket.",
    ],
    editorial: [
      "The trap in ADR is averaging the wrong thing. `AVG(nightly_rate)` treats a one-night stay and a five-night stay as equally important; ADR weights each rate by the nights it was sold for. So each stay contributes `nightly_rate * nights` of revenue and `nights` of inventory, and the ratio is taken **after** summing both: `SUM(rate * nights) / SUM(nights)`.",
      "",
      "Nights come from `DATEDIFF(check_out, check_in)`. The month bucket is `DATE_FORMAT(check_in, '%Y-%m')` — or `LEFT(check_in, 7)` on the stored text — and the query groups by hotel and that bucket after keeping only `checked_out` stays, so cancellations and no-shows add neither revenue nor nights. A hotel-month with no checked-out stay simply forms no group, so the division never sees a zero.",
      "",
      "The ratio is rounded to two decimals because MySQL and other engines carry different precision on a division. The result is ordered by hotel name and month, which the statement fixes. The CTE version computes the nights once per stay and then aggregates; both are a single pass plus a sort of the groups.",
    ].join("\n"),
  },

  {
    slug: "airline-on-time-arrival-performance",
    title: "On-Time Arrival Performance by Airline",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "The aviation regulator counts an operated flight as **on time** when it arrives **no more than 15 minutes** after schedule (early arrivals have a negative delay and are on time). Cancelled flights have `arrival_delay_min` NULL and are counted separately.",
      "",
      "For every airline with at least one flight in `Flight`, return `airline_name`, `operated` (operated flights), `cancelled` (cancelled flights) and `on_time_pct` = 100 × on-time flights / operated flights, **rounded to 2 decimals** — NULL when the airline operated no flight. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Airline",
        columns: [
          { name: "airline_code", type: "char" },
          { name: "airline_name", type: "varchar" },
        ],
        primaryKey: ["airline_code"],
        note: "One row per carrier.",
      },
      {
        name: "Flight",
        columns: [
          { name: "flight_id", type: "int" },
          { name: "airline_code", type: "char" },
          { name: "flight_date", type: "date" },
          { name: "status", type: "enum", values: ["operated", "cancelled"] },
          { name: "arrival_delay_min", type: "int" },
        ],
        primaryKey: ["flight_id"],
        note: "`arrival_delay_min` is minutes late on arrival (negative when early), and NULL exactly when the flight was cancelled.",
      },
    ],
    examples: [
      {
        Airline: [
          ["6E", "IndiGo"],
          ["AI", "Air India"],
          ["SG", "SpiceJet"],
          ["QP", "Akasa Air"],
        ],
        Flight: [
          [1, "6E", "2024-08-01", "operated", -4],
          [2, "6E", "2024-08-01", "operated", 15],
          [3, "6E", "2024-08-02", "operated", 16],
          [4, "AI", "2024-08-01", "operated", 42],
          [5, "AI", "2024-08-02", "cancelled", null],
          [6, "AI", "2024-08-02", "operated", 3],
          [7, "SG", "2024-08-03", "cancelled", null],
          [8, "6E", "2024-08-03", "operated", 0],
        ],
      },
    ],
    gen: (rng) => {
      const airlines = sample(rng, AIRLINES, ri(rng, 1, 5)).map(([c, nm]) => [c, nm]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const cancelled = chance(rng, 0.15);
        return [
          id,
          pick(rng, airlines)[0]!,
          dateBetween(rng, "2024-08-01", "2024-08-07"),
          cancelled ? "cancelled" : "operated",
          cancelled ? null : chance(rng, 0.2) ? pick(rng, [15, 16]) : ri(rng, -20, 90),
        ];
      });
      return { Airline: airlines, Flight: rows };
    },
    solution: [
      "SELECT a.airline_name,",
      "       SUM(CASE WHEN f.status = 'operated' THEN 1 ELSE 0 END) AS operated,",
      "       SUM(CASE WHEN f.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,",
      "       ROUND(100 * SUM(CASE WHEN f.status = 'operated' AND f.arrival_delay_min <= 15 THEN 1 ELSE 0 END)",
      "             / NULLIF(SUM(CASE WHEN f.status = 'operated' THEN 1 ELSE 0 END), 0), 2) AS on_time_pct",
      "FROM Airline a",
      "JOIN Flight f ON f.airline_code = a.airline_code",
      "GROUP BY a.airline_code, a.airline_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.airline_name, COUNT(f.arrival_delay_min) AS operated, COUNT(*) - COUNT(f.arrival_delay_min) AS cancelled,",
        "       ROUND(100 * AVG(IF(f.arrival_delay_min IS NULL, NULL, IF(f.arrival_delay_min <= 15, 1, 0))), 2) AS on_time_pct",
        "FROM Flight f JOIN Airline a ON a.airline_code = f.airline_code",
        "GROUP BY a.airline_code, a.airline_name",
      ].join("\n"),
    ],
    hints: [
      "Each count is a different condition over the same rows — conditional aggregation: `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "The 15-minute line is inclusive; a negative delay is an early arrival.",
      "The denominator is operated flights, which can be zero — guard it with `NULLIF`.",
    ],
    editorial: [
      "Three numbers per airline, each counting a different subset of the same rows, is the classic case for **conditional aggregation**: group once by airline and sum a `CASE` that is 1 for the rows of interest and 0 otherwise. Operated and cancelled come straight from the status; on-time adds the condition `arrival_delay_min <= 15`, which is inclusive and also accepts early (negative) arrivals.",
      "",
      "The percentage divides on-time flights by operated flights — not by all flights, since a cancelled flight is neither on time nor late. An airline whose only flights were cancelled has an operated count of 0, and dividing by zero is an error in some engines and NULL in others; `NULLIF(…, 0)` turns the denominator into NULL, so the percentage is NULL everywhere, as asked. Then round to two decimals.",
      "",
      "The alternative leans on NULL semantics: `COUNT(arrival_delay_min)` counts only operated flights, and `AVG` of a 1/0 flag that is NULL for cancellations is exactly the on-time share — it ignores NULLs and returns NULL for an empty set. One grouped pass either way.",
    ].join("\n"),
  },

  {
    slug: "train-waitlist-positions-per-class",
    title: "Waitlist Positions on a Train per Class",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Waitlisted rail tickets move up as others confirm or cancel. A ticket's current **WL position** is its place among the tickets that are **still waitlisted** for the same `train_no`, `journey_date` and `travel_class`, ordered by `booked_at` (earliest first); two tickets booked in the same second are ordered by the smaller `pnr` first.",
      "",
      "Return `pnr`, `train_no`, `journey_date`, `travel_class` and `wl_position` for every ticket whose status is `WL`. Confirmed and cancelled tickets take no position. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "TicketRequest",
        columns: [
          { name: "pnr", type: "bigint" },
          { name: "train_no", type: "int" },
          { name: "journey_date", type: "date" },
          { name: "travel_class", type: "enum", values: ["SL", "3A", "2A"] },
          { name: "booked_at", type: "datetime" },
          { name: "status", type: "enum", values: ["WL", "CNF", "CAN"] },
        ],
        primaryKey: ["pnr"],
        note: "One passenger per PNR. `status` is the ticket's state now: still waitlisted, confirmed, or cancelled.",
      },
    ],
    examples: [
      {
        TicketRequest: [
          [4810023311, 12627, "2024-10-30", "SL", "2024-09-01 08:00:04", "CNF"],
          [4810023390, 12627, "2024-10-30", "SL", "2024-09-01 08:00:09", "WL"],
          [4810023355, 12627, "2024-10-30", "SL", "2024-09-01 08:00:09", "WL"],
          [4810024102, 12627, "2024-10-30", "SL", "2024-09-02 19:41:20", "CAN"],
          [4810024567, 12627, "2024-10-30", "SL", "2024-09-03 10:12:00", "WL"],
          [4810025001, 12627, "2024-10-30", "3A", "2024-09-03 11:30:45", "WL"],
          [4810025102, 12627, "2024-10-31", "SL", "2024-09-02 07:15:00", "WL"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const pnrs = new Set<number>();
      while (pnrs.size < n) pnrs.add(pnrOf(rng));
      const trains = sample(rng, [12627, 12951, 16345, 22439], ri(rng, 1, 2));
      const dates = sample(rng, ["2024-10-30", "2024-10-31", "2024-11-01"], ri(rng, 1, 2));
      const stamps = Array.from({ length: 5 }, () => `${dateBetween(rng, "2024-09-01", "2024-09-05")} ${pad(ri(rng, 6, 22))}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`);
      const rows: Cell[][] = [...pnrs].map((pnr) => [
        pnr,
        pick(rng, trains),
        pick(rng, dates),
        pick(rng, ["SL", "SL", "3A", "2A"]),
        pick(rng, stamps),
        pick(rng, ["WL", "WL", "WL", "CNF", "CAN"]),
      ]);
      return { TicketRequest: rows };
    },
    solution: [
      "SELECT pnr, train_no, journey_date, travel_class,",
      "       ROW_NUMBER() OVER (PARTITION BY train_no, journey_date, travel_class ORDER BY booked_at, pnr) AS wl_position",
      "FROM TicketRequest",
      "WHERE status = 'WL'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.pnr, t.train_no, t.journey_date, t.travel_class,",
        "       (SELECT COUNT(*) FROM TicketRequest u",
        "        WHERE u.status = 'WL' AND u.train_no = t.train_no AND u.journey_date = t.journey_date AND u.travel_class = t.travel_class",
        "          AND (u.booked_at < t.booked_at OR (u.booked_at = t.booked_at AND u.pnr <= t.pnr))) AS wl_position",
        "FROM TicketRequest t",
        "WHERE t.status = 'WL'",
      ].join("\n"),
    ],
    hints: [
      "The numbering restarts for every train, date and class: that is a `PARTITION BY`.",
      "Only waitlisted tickets should be numbered — filter before the window is computed.",
      "Equal booking times need a second ordering key so the numbering is unique.",
    ],
    editorial: [
      "A waitlist position is a running number within a queue, and the queue is one train on one date in one class — so it is `ROW_NUMBER()` partitioned by `(train_no, journey_date, travel_class)` and ordered by `booked_at`. `RANK()` would be wrong here: two tickets booked in the same second still occupy two different places, which is why the order adds `pnr` as a tie-breaker and the statement says which goes first.",
      "",
      "The filter `status = 'WL'` sits in `WHERE`, and `WHERE` runs before window functions. That is exactly what is wanted: a confirmed or cancelled ticket is gone from the queue and must not push anyone back, so it is removed before the numbering starts.",
      "",
      "Without window functions, count the waitlisted tickets in the same queue that were booked earlier, or at the same time with a smaller-or-equal PNR — the correlated subquery in the alternative. It is quadratic per queue, whereas the window needs one sort of the waitlisted rows.",
    ].join("\n"),
  },

  {
    slug: "top-agencies-by-quarterly-commission",
    title: "Top Two Agencies by Commission Each Quarter",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "An airline pays each partner agency `commission_pct` percent of the value of every ticket it sells that is still `ticketed` (refunded tickets earn nothing). A quarter is labelled like `2024-Q3`.",
      "",
      "For every quarter, return the agencies whose total commission ranks in the **top 2** of that quarter, with columns `quarter`, `agency_name`, `commission` (**rounded to 2 decimals**) and `quarter_rank`. Agencies with equal commission share a rank, and the next rank is skipped (1, 1, 3), so a tie can put more than two agencies in. Agencies with no ticketed sale in a quarter are not ranked in it. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Agency",
        columns: [
          { name: "agency_id", type: "int" },
          { name: "agency_name", type: "varchar" },
          { name: "commission_pct", type: "int" },
        ],
        primaryKey: ["agency_id"],
        note: "One row per partner; `commission_pct` is a whole percentage.",
      },
      {
        name: "TicketSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "agency_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "ticket_value", type: "int" },
          { name: "status", type: "enum", values: ["ticketed", "refunded"] },
        ],
        primaryKey: ["sale_id"],
        note: "`ticket_value` is in rupees; `agency_id` always names an agency.",
      },
    ],
    examples: [
      {
        Agency: [
          [1, "Yatra Tours", 5],
          [2, "Sahil Holidays", 8],
          [3, "Blue Lotus Travel", 4],
          [4, "Northstar Journeys", 6],
        ],
        TicketSale: [
          [1, 1, "2024-07-04", 20000, "ticketed"],
          [2, 2, "2024-07-19", 12500, "ticketed"],
          [3, 3, "2024-08-02", 25000, "ticketed"],
          [4, 4, "2024-09-11", 9000, "ticketed"],
          [5, 4, "2024-09-28", 15000, "refunded"],
          [6, 1, "2024-10-05", 8000, "ticketed"],
          [7, 2, "2024-11-21", 4000, "ticketed"],
          [8, 3, "2024-12-30", 6000, "ticketed"],
        ],
      },
    ],
    gen: (rng) => {
      const agencies = sample(rng, AGENCIES, ri(rng, 1, 5)).map((name, i) => [i + 1, name, pick(rng, [4, 5, 6, 8, 10])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, agencies.length),
        dateBetween(rng, "2024-04-01", "2024-12-31"),
        pick(rng, [4000, 5000, 8000, 10000, 12500, 20000]),
        pick(rng, ["ticketed", "ticketed", "ticketed", "refunded"]),
      ]);
      return { Agency: agencies, TicketSale: rows };
    },
    solution: [
      "WITH q AS (",
      "  SELECT CONCAT(YEAR(s.sale_date), '-Q', QUARTER(s.sale_date)) AS quarter, a.agency_id, a.agency_name,",
      "         SUM(s.ticket_value * a.commission_pct / 100) AS commission",
      "  FROM TicketSale s",
      "  JOIN Agency a ON a.agency_id = s.agency_id",
      "  WHERE s.status = 'ticketed'",
      "  GROUP BY CONCAT(YEAR(s.sale_date), '-Q', QUARTER(s.sale_date)), a.agency_id, a.agency_name",
      "), r AS (",
      "  SELECT quarter, agency_name, commission, RANK() OVER (PARTITION BY quarter ORDER BY commission DESC) AS quarter_rank",
      "  FROM q",
      ")",
      "SELECT quarter, agency_name, ROUND(commission, 2) AS commission, quarter_rank",
      "FROM r",
      "WHERE quarter_rank <= 2",
    ].join("\n"),
    alternatives: [
      [
        "WITH q AS (",
        "  SELECT CONCAT(YEAR(s.sale_date), '-Q', QUARTER(s.sale_date)) AS quarter, a.agency_id, a.agency_name,",
        "         SUM(s.ticket_value * a.commission_pct) / 100 AS commission",
        "  FROM TicketSale s JOIN Agency a ON a.agency_id = s.agency_id",
        "  WHERE s.status = 'ticketed'",
        "  GROUP BY CONCAT(YEAR(s.sale_date), '-Q', QUARTER(s.sale_date)), a.agency_id, a.agency_name",
        ")",
        "SELECT x.quarter, x.agency_name, ROUND(x.commission, 2) AS commission,",
        "       1 + (SELECT COUNT(*) FROM q y WHERE y.quarter = x.quarter AND y.commission > x.commission) AS quarter_rank",
        "FROM q x",
        "WHERE (SELECT COUNT(*) FROM q y WHERE y.quarter = x.quarter AND y.commission > x.commission) < 2",
      ].join("\n"),
    ],
    hints: [
      "First total each agency's commission per quarter; only then rank.",
      "`QUARTER(date)` gives 1–4; build the label with `CONCAT`.",
      "Which ranking function gives 1, 1, 3 for a tie at the top?",
      "A window result can only be filtered in an outer query.",
    ],
    editorial: [
      "There are two steps, and they must happen in this order: aggregate, then rank. The first CTE turns sales into one row per (quarter, agency): it drops refunded tickets, computes each ticket's commission as `ticket_value * commission_pct / 100`, labels the quarter with `CONCAT(YEAR(d), '-Q', QUARTER(d))`, and sums. An agency with no ticketed sale in a quarter simply has no row there, so it is never ranked.",
      "",
      "The second step ranks those totals inside each quarter with `RANK() OVER (PARTITION BY quarter ORDER BY commission DESC)`. `RANK` is the function the statement describes — equal totals share a rank and the next one is skipped — so a tie for first place yields ranks 1, 1, 3 and both tied agencies appear while the third does not. Because a window value cannot be used in the `WHERE` of its own query, the filter `quarter_rank <= 2` goes one level out.",
      "",
      "The commission is rounded only for display, after ranking, so rounding never creates or breaks a tie. The alternative computes the rank as 1 + the number of agencies with strictly more commission in the quarter — the definition of `RANK` — with a correlated count.",
    ].join("\n"),
  },
  {
    slug: "hotel-cancellation-refunds-by-policy",
    title: "Hotel Cancellation Refunds Under a Tiered Policy",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Dates", "Aggregation"],
    description: [
      "The chain's cancellation policy refunds by how many days before check-in a booking was cancelled, `DATEDIFF(check_in, cancelled_on)`: **7 days or more** — a full refund of `amount_paid`; **2 to 6 days** — half of it; **fewer than 2 days** (including a cancellation on or after the check-in day) — nothing.",
      "",
      "For every hotel with at least one cancelled booking, return `hotel_name`, `cancellations` (the number of cancelled bookings) and `total_refund` (the rupees refunded across them). Bookings that were not cancelled have `cancelled_on` NULL and are ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Hotel",
        columns: [
          { name: "hotel_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
        ],
        primaryKey: ["hotel_id"],
        note: "One row per hotel.",
      },
      {
        name: "Booking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "hotel_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "amount_paid", type: "int" },
          { name: "cancelled_on", type: "date" },
        ],
        primaryKey: ["booking_id"],
        note: "`amount_paid` is the prepaid amount in rupees (always even). `cancelled_on` is the date of cancellation, or NULL if the booking stands.",
      },
    ],
    examples: [
      {
        Hotel: [
          [1, "Marine Drive Suites"],
          [2, "Hilltop Heritage"],
          [3, "Tea Garden Inn"],
        ],
        Booking: [
          [1, 1, "2024-05-20", 12000, "2024-05-10"],
          [2, 1, "2024-05-20", 9000, "2024-05-14"],
          [3, 1, "2024-05-22", 8000, "2024-05-21"],
          [4, 1, "2024-05-25", 15000, null],
          [5, 2, "2024-06-01", 6400, "2024-05-30"],
          [6, 2, "2024-06-03", 7000, "2024-06-04"],
          [7, 3, "2024-06-10", 5000, null],
        ],
      },
    ],
    gen: (rng) => {
      const hotels = sample(rng, HOTELS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ci = dateBetween(rng, "2024-05-01", "2024-06-30");
        const before = chance(rng, 0.3) ? pick(rng, [1, 2, 6, 7]) : ri(rng, -2, 20);
        return [id, ri(rng, 1, hotels.length), ci, roundTo(rng, 3000, 20000, 200), chance(rng, 0.3) ? null : addDays(ci, -before)];
      });
      return { Hotel: hotels, Booking: rows };
    },
    solution: [
      "SELECT h.hotel_name,",
      "       COUNT(*) AS cancellations,",
      "       SUM(CASE",
      "             WHEN DATEDIFF(b.check_in, b.cancelled_on) >= 7 THEN b.amount_paid",
      "             WHEN DATEDIFF(b.check_in, b.cancelled_on) >= 2 THEN b.amount_paid / 2",
      "             ELSE 0",
      "           END) AS total_refund",
      "FROM Booking b",
      "JOIN Hotel h ON h.hotel_id = b.hotel_id",
      "WHERE b.cancelled_on IS NOT NULL",
      "GROUP BY h.hotel_id, h.hotel_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT h.hotel_name, COUNT(b.cancelled_on) AS cancellations,",
        "       SUM(b.amount_paid * IF(DATEDIFF(b.check_in, b.cancelled_on) >= 7, 1, IF(DATEDIFF(b.check_in, b.cancelled_on) >= 2, 0.5, 0))) AS total_refund",
        "FROM Hotel h JOIN Booking b ON b.hotel_id = h.hotel_id",
        "GROUP BY h.hotel_id, h.hotel_name",
        "HAVING COUNT(b.cancelled_on) > 0",
      ].join("\n"),
    ],
    hints: [
      "Compute the notice period of each cancellation with `DATEDIFF(check_in, cancelled_on)`.",
      "A CASE checked from the longest notice down gives each cancellation its refund.",
      "Keep only cancelled bookings, then sum the refunds per hotel.",
    ],
    editorial: [
      "Each cancelled booking gets a refund decided by its notice period, `DATEDIFF(check_in, cancelled_on)` — the number of days between cancelling and the planned arrival. A `CASE` tested from the most generous band down maps that to an amount: `>= 7` refunds everything, otherwise `>= 2` refunds half, otherwise nothing. The bands meet at exact values (a notice of 7 is a full refund, 2 is half, 1 is nothing), and a cancellation on or after the check-in day has a notice of 0 or less, which falls into the last branch.",
      "",
      "Bookings that stand have `cancelled_on` NULL. Filtering them out in `WHERE` leaves only cancellations, so `COUNT(*)` per hotel counts them and the `SUM` of the `CASE` totals the refunds; a hotel with no cancellation forms no group and is absent. `amount_paid` is even, so half of it is a whole number of rupees.",
      "",
      "The alternative keeps every booking in the join, multiplies the amount by a 1 / 0.5 / 0 factor — for a NULL `cancelled_on` the `DATEDIFF` is NULL, the product NULL, and `SUM` skips it — counts `cancelled_on` (which ignores NULLs) and drops hotels without cancellations in `HAVING`.",
    ].join("\n"),
  },

  {
    slug: "passengers-who-flew-both-directions",
    title: "Passengers Who Flew a Route in Both Directions",
    difficulty: "MEDIUM",
    topics: ["Joins", "Strings"],
    description: [
      "The network-planning team wants to know which travellers fly a city pair **both ways** — for example BLR→DEL on one ticket and DEL→BLR on another, on any dates.",
      "",
      "Return `passenger_id`, `passenger_name` and `city_pair` for every passenger and every pair of airports they flew in both directions. Write `city_pair` as the two airport codes in alphabetical order joined by a hyphen (`BLR-DEL`, never `DEL-BLR`), and list each passenger and pair **once**, however many times it was flown. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Passenger",
        columns: [
          { name: "passenger_id", type: "int" },
          { name: "passenger_name", type: "varchar" },
        ],
        primaryKey: ["passenger_id"],
        note: "One row per traveller in the frequent-flyer database.",
      },
      {
        name: "FlightSegment",
        columns: [
          { name: "segment_id", type: "int" },
          { name: "passenger_id", type: "int" },
          { name: "origin", type: "char" },
          { name: "destination", type: "char" },
          { name: "travel_date", type: "date" },
        ],
        primaryKey: ["segment_id"],
        note: "One row per flown segment; airport codes are three upper-case letters and `origin` never equals `destination`.",
      },
    ],
    examples: [
      {
        Passenger: [
          [1, "Anjali"],
          [2, "Karan"],
          [3, "Emma"],
        ],
        FlightSegment: [
          [1, 1, "DEL", "BLR", "2024-02-02"],
          [2, 1, "BLR", "DEL", "2024-02-05"],
          [3, 1, "DEL", "BLR", "2024-03-11"],
          [4, 2, "BOM", "GOI", "2024-02-10"],
          [5, 3, "BOM", "GOI", "2024-02-14"],
          [6, 2, "BOM", "BLR", "2024-02-20"],
          [7, 3, "GOI", "BOM", "2024-02-18"],
          [8, 1, "BOM", "MAA", "2024-04-01"],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 1, 5);
      const people = names(rng, np).map((nm, i) => [i + 1, nm]);
      const ports = sample(rng, AIRPORTS, ri(rng, 3, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const rows: Cell[][] = [];
      for (let id = 1; id <= n; id++) {
        const [o, d] = sample(rng, ports, 2);
        const pid = ri(rng, 1, np);
        rows.push([id, pid, o!, d!, dateBetween(rng, "2024-02-01", "2024-05-31")]);
        if (id < n && chance(rng, 0.3)) rows.push([++id, pid, d!, o!, dateBetween(rng, "2024-02-01", "2024-05-31")]);
      }
      return { Passenger: people, FlightSegment: rows };
    },
    solution: [
      "SELECT DISTINCT p.passenger_id, p.passenger_name, CONCAT(a.origin, '-', a.destination) AS city_pair",
      "FROM FlightSegment a",
      "JOIN FlightSegment b",
      "  ON b.passenger_id = a.passenger_id AND b.origin = a.destination AND b.destination = a.origin",
      "JOIN Passenger p ON p.passenger_id = a.passenger_id",
      "WHERE a.origin < a.destination",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.passenger_id, p.passenger_name, t.city_pair",
        "FROM (SELECT passenger_id, origin, CONCAT(LEAST(origin, destination), '-', GREATEST(origin, destination)) AS city_pair FROM FlightSegment) t",
        "JOIN Passenger p ON p.passenger_id = t.passenger_id",
        "GROUP BY p.passenger_id, p.passenger_name, t.city_pair",
        "HAVING COUNT(DISTINCT t.origin) = 2",
      ].join("\n"),
      [
        "SELECT p.passenger_id, p.passenger_name, x.city_pair",
        "FROM Passenger p",
        "JOIN (SELECT DISTINCT passenger_id, CONCAT(origin, '-', destination) AS city_pair FROM FlightSegment s",
        "      WHERE origin < destination AND EXISTS (SELECT 1 FROM FlightSegment r",
        "        WHERE r.passenger_id = s.passenger_id AND r.origin = s.destination AND r.destination = s.origin)) x",
        "  ON x.passenger_id = p.passenger_id",
      ].join("\n"),
    ],
    hints: [
      "Pair each segment with another segment of the same passenger whose origin and destination are swapped.",
      "Each matching pair is found twice — once from each side. Keep only the side whose origin sorts first.",
      "A passenger can fly the pair several times; `DISTINCT` (or GROUP BY) keeps one row.",
    ],
    editorial: [
      "A round trip shows up as two rows of `FlightSegment` for one passenger with origin and destination swapped, so a **self join** on `b.passenger_id = a.passenger_id AND b.origin = a.destination AND b.destination = a.origin` finds every such match.",
      "",
      "Each match is found twice — the outbound row pairs with the return, and the return pairs with the outbound. Keeping only the side where `a.origin < a.destination` removes the mirror image and, at the same time, makes `CONCAT(a.origin, '-', a.destination)` the alphabetical spelling the statement wants. A passenger who flew BLR→DEL twice and DEL→BLR once still produces several joined rows, so `DISTINCT` collapses them to one per passenger and pair.",
      "",
      "The first alternative avoids the join: group a passenger's segments by the unordered pair (`LEAST` / `GREATEST` of the two codes) and keep the groups with two distinct origins — that can only happen if both directions were flown. The second uses `EXISTS` for the return leg. The self join is quadratic per passenger in the worst case; the grouping is a single sort.",
    ].join("\n"),
  },

  {
    slug: "double-booked-hotel-rooms",
    title: "Double-Booked Hotel Rooms",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates"],
    description: [
      "A channel-manager glitch let two websites sell the same room for the same nights. Two active reservations of the same room **overlap** when each one starts before the other ends; a stay checking out on the day the next one checks in does **not** overlap. Cancelled reservations never clash with anything.",
      "",
      "Return one row per clashing pair with `room_no`, `first_reservation` (the smaller `reservation_id`), `second_reservation` (the larger) and `overlap_nights` (the number of nights both hold). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "RoomReservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "room_no", type: "int" },
          { name: "guest_name", type: "varchar" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "status", type: "enum", values: ["active", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "One hotel. A reservation holds `room_no` for the nights from `check_in` up to (not including) `check_out`.",
      },
    ],
    examples: [
      {
        RoomReservation: [
          [1, 204, "Aarav", "2024-12-20", "2024-12-24", "active"],
          [2, 204, "Diya", "2024-12-22", "2024-12-26", "active"],
          [3, 204, "Kabir", "2024-12-26", "2024-12-28", "active"],
          [4, 305, "Meera", "2024-12-21", "2024-12-23", "active"],
          [5, 305, "Rohan", "2024-12-21", "2024-12-22", "cancelled"],
          [6, 305, "Zara", "2024-12-18", "2024-12-25", "active"],
          [7, 204, "Ishaan", "2024-12-23", "2024-12-27", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const rooms = sample(rng, [101, 102, 204, 305, 410], ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const ci = dateBetween(rng, "2024-12-15", "2024-12-30");
        return [id, pick(rng, rooms), who[i]!, ci, addDays(ci, ri(rng, 1, 4)), chance(rng, 0.2) ? "cancelled" : "active"];
      });
      // A back-to-back stay now and then: the boundary that is not a clash.
      if (n >= 2 && chance(rng, 0.4)) {
        rows[1]![1] = rows[0]![1]!;
        rows[1]![3] = rows[0]![4]!;
        rows[1]![4] = addDays(rows[0]![4] as string, 2);
      }
      return { RoomReservation: rows };
    },
    solution: [
      "SELECT a.room_no,",
      "       a.reservation_id AS first_reservation,",
      "       b.reservation_id AS second_reservation,",
      "       DATEDIFF(LEAST(a.check_out, b.check_out), GREATEST(a.check_in, b.check_in)) AS overlap_nights",
      "FROM RoomReservation a",
      "JOIN RoomReservation b",
      "  ON b.room_no = a.room_no",
      " AND a.reservation_id < b.reservation_id",
      " AND a.check_in < b.check_out",
      " AND b.check_in < a.check_out",
      "WHERE a.status = 'active' AND b.status = 'active'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.room_no, a.reservation_id AS first_reservation, b.reservation_id AS second_reservation,",
        "       DATEDIFF(CASE WHEN a.check_out < b.check_out THEN a.check_out ELSE b.check_out END,",
        "                CASE WHEN a.check_in > b.check_in THEN a.check_in ELSE b.check_in END) AS overlap_nights",
        "FROM RoomReservation a, RoomReservation b",
        "WHERE a.room_no = b.room_no AND a.reservation_id < b.reservation_id",
        "  AND a.status = 'active' AND b.status = 'active'",
        "  AND DATEDIFF(CASE WHEN a.check_out < b.check_out THEN a.check_out ELSE b.check_out END,",
        "               CASE WHEN a.check_in > b.check_in THEN a.check_in ELSE b.check_in END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Compare reservations of the same room with each other: a self join on `room_no`.",
      "Two ranges [s1, e1) and [s2, e2) overlap exactly when s1 < e2 and s2 < e1.",
      "Use `a.reservation_id < b.reservation_id` so each pair appears once and never with itself.",
      "The shared nights run from the later check-in to the earlier check-out.",
    ],
    editorial: [
      "Clashes are between two rows of the same table, so the query is a **self join** of `RoomReservation` on `room_no`, restricted to active rows on both sides. Writing `a.reservation_id < b.reservation_id` does two jobs: it stops a reservation from matching itself, and it keeps each clashing pair once, with the smaller id first as the statement asks.",
      "",
      "The overlap test for half-open stays `[check_in, check_out)` is the classic one: they overlap exactly when `a.check_in < b.check_out AND b.check_in < a.check_out`. The strict `<` is what makes back-to-back stays safe — a check-out on the 24th and a check-in on the 24th share no night. It also catches containment (one stay entirely inside another), which a test on just the start dates would miss.",
      "",
      "The shared part runs from the later check-in, `GREATEST(a.check_in, b.check_in)`, to the earlier check-out, `LEAST(a.check_out, b.check_out)`, and their `DATEDIFF` is the number of double-sold nights. The alternative spells `LEAST`/`GREATEST` with `CASE` and uses \"the overlap is positive\" as the clash test, which is the same condition. Both are quadratic per room; an index on `(room_no, check_in)` limits the comparisons.",
    ].join("\n"),
  },

  {
    slug: "loyalty-points-expiring-for-inactive-members",
    title: "Loyalty Points Expiring for Inactive Members",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates", "Conditional Logic"],
    description: [
      "A hotel loyalty programme's points expire when an account has had **no earn or redeem activity for 12 months**. The expiry run on **2025-06-30** wipes every account whose last ledger entry is **before 2024-07-01** and whose balance (earned points minus redeemed points) is **greater than 0**.",
      "",
      "Return `member_id`, `member_name`, `last_activity` (the date of the member's latest entry) and `points_expiring` (the balance) for those members. Members with no ledger entries have nothing to expire. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "member_name", type: "varchar" },
          { name: "tier", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per loyalty account.",
      },
      {
        name: "PointsLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "entry_date", type: "date" },
          { name: "entry_type", type: "enum", values: ["earn", "redeem"] },
          { name: "points", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "`points` is always positive; `entry_type` says whether it was added or spent.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Priya", "Gold"],
          [2, "Vikram", "Silver"],
          [3, "Sara", "Silver"],
          [4, "Arjun", "Gold"],
          [5, "Noah", "Blue"],
        ],
        PointsLedger: [
          [1, 1, "2023-11-02", "earn", 4200],
          [2, 1, "2024-03-15", "redeem", 1500],
          [3, 2, "2024-01-20", "earn", 2600],
          [4, 2, "2024-07-01", "earn", 800],
          [5, 3, "2023-12-05", "earn", 3000],
          [6, 3, "2024-02-10", "redeem", 3000],
          [7, 4, "2024-06-30", "earn", 950],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 6);
      const members = names(rng, nm).map((n, i) => [i + 1, n, pick(rng, ["Blue", "Silver", "Gold"])]);
      const rows: Cell[][] = [];
      let id = 1;
      for (let m = 1; m <= nm; m++) {
        if (chance(rng, 0.15)) continue;
        let bal = 0;
        const lastDay = chance(rng, 0.6) ? "2024-06-30" : "2025-05-31";
        for (let k = ri(rng, 1, 4); k > 0; k--) {
          const d = chance(rng, 0.15) ? pick(rng, ["2024-06-30", "2024-07-01"]) : dateBetween(rng, "2023-06-01", lastDay);
          const redeem = bal > 0 && chance(rng, 0.35);
          const pts = redeem ? (chance(rng, 0.4) ? bal : roundTo(rng, 100, bal, 100) || bal) : roundTo(rng, 200, 6000, 50);
          bal += redeem ? -pts : pts;
          rows.push([id++, m, d, redeem ? "redeem" : "earn", pts]);
        }
      }
      return { Member: members, PointsLedger: rows };
    },
    solution: [
      "SELECT m.member_id, m.member_name, l.last_activity, l.balance AS points_expiring",
      "FROM Member m",
      "JOIN (",
      "  SELECT member_id,",
      "         MAX(entry_date) AS last_activity,",
      "         SUM(CASE WHEN entry_type = 'earn' THEN points ELSE -points END) AS balance",
      "  FROM PointsLedger",
      "  GROUP BY member_id",
      ") l ON l.member_id = m.member_id",
      "WHERE l.last_activity < '2024-07-01' AND l.balance > 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.member_id, m.member_name,",
        "       (SELECT MAX(entry_date) FROM PointsLedger x WHERE x.member_id = m.member_id) AS last_activity,",
        "       (SELECT SUM(IF(entry_type = 'earn', points, -points)) FROM PointsLedger x WHERE x.member_id = m.member_id) AS points_expiring",
        "FROM Member m",
        "WHERE EXISTS (SELECT 1 FROM PointsLedger x WHERE x.member_id = m.member_id)",
        "  AND NOT EXISTS (SELECT 1 FROM PointsLedger x WHERE x.member_id = m.member_id AND x.entry_date >= '2024-07-01')",
        "  AND (SELECT SUM(IF(entry_type = 'earn', points, -points)) FROM PointsLedger x WHERE x.member_id = m.member_id) > 0",
      ].join("\n"),
      [
        "SELECT m.member_id, m.member_name, MAX(l.entry_date) AS last_activity,",
        "       SUM(CASE l.entry_type WHEN 'redeem' THEN -l.points ELSE l.points END) AS points_expiring",
        "FROM Member m JOIN PointsLedger l ON l.member_id = m.member_id",
        "GROUP BY m.member_id, m.member_name",
        "HAVING MAX(l.entry_date) < '2024-07-01' AND SUM(CASE l.entry_type WHEN 'redeem' THEN -l.points ELSE l.points END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Summarise the ledger per member first: the latest entry date and the signed sum of points.",
      "Redeemed points count against the balance — a CASE can give them a minus sign.",
      "\"Before 2024-07-01\" is strict: activity on that day keeps the points alive.",
    ],
    editorial: [
      "Two facts are needed per member — when they last did anything, and what their balance is — and both come from one pass over the ledger grouped by `member_id`: `MAX(entry_date)` for the last activity and `SUM(CASE WHEN entry_type = 'earn' THEN points ELSE -points END)` for the balance, since redemptions subtract. Doing this in a derived table and joining it to `Member` keeps the outer query a simple filter.",
      "",
      "The filter applies both expiry conditions: `last_activity < '2024-07-01'` (strictly — an entry on 2024-07-01 is within the 12 months and saves the account) and `balance > 0` (an account already at zero has nothing to wipe). Members with no ledger rows have no summary row, so the inner join leaves them out, as the statement says.",
      "",
      "The second alternative is the same idea with `GROUP BY … HAVING` on the joined rows. The first is written as correlated subqueries: `NOT EXISTS` an entry on or after the cut-off states \"inactive\" directly, and scalar subqueries fetch the date and balance. It reads like the policy but scans the ledger several times per member; the grouped forms read it once.",
    ].join("\n"),
  },

  {
    slug: "connecting-itineraries-per-city-pair",
    title: "Connecting Itineraries per City Pair",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "An online travel agency stores each itinerary's routing as airport codes joined by hyphens, for example `BLR-HYD-DEL` (BLR to DEL with one stop in HYD). The first code is the **origin**, the last is the **destination**, and every code in between is a **stop**.",
      "",
      "Considering only itineraries with **at least one stop**, return for every origin–destination pair: `origin`, `destination`, `connecting_bookings` (how many such itineraries) and `max_stops` (the most stops any of them makes). Order by `connecting_bookings` descending, then `origin`, then `destination`.",
    ].join("\n"),
    tables: [
      {
        name: "Itinerary",
        columns: [
          { name: "booking_ref", type: "char" },
          { name: "passenger_name", type: "varchar" },
          { name: "routing", type: "varchar" },
          { name: "fare", type: "int" },
        ],
        primaryKey: ["booking_ref"],
        note: "`routing` holds two to five three-letter airport codes separated by single hyphens, with no spaces.",
      },
    ],
    examples: [
      {
        Itinerary: [
          ["AB12CD", "Neha", "BLR-HYD-DEL", 7400],
          ["EF34GH", "Rahul", "BLR-DEL", 5600],
          ["JK56LM", "Tanvi", "BLR-BOM-DEL", 6900],
          ["NP78QR", "Liam", "MAA-BLR-BOM-GOI", 9100],
          ["ST90UV", "Zara", "COK-BOM-DEL", 8800],
          ["WX12YZ", "Dev", "MAA-HYD-GOI", 7200],
          ["BC34DF", "Ira", "COK-DEL", 9900],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const ends = sample(rng, AIRPORTS, 4);
      const pairs = [[ends[0]!, ends[1]!], [ends[2]!, ends[3]!], [ends[1]!, ends[0]!]];
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
      const refs = new Set<string>();
      while (refs.size < n) refs.add(Array.from({ length: 6 }, () => letters[ri(rng, 0, letters.length - 1)]).join(""));
      const who = names(rng, n);
      const rows: Cell[][] = [...refs].map((ref, i) => {
        const [o, d] = pick(rng, pairs);
        const via = sample(rng, AIRPORTS.filter((a) => a !== o && a !== d), ri(rng, 0, 3));
        return [ref, who[i]!, [o, ...via, d].join("-"), roundTo(rng, 3000, 15000, 100)];
      });
      return { Itinerary: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(routing, '-', 1) AS origin,",
      "       SUBSTRING_INDEX(routing, '-', -1) AS destination,",
      "       COUNT(*) AS connecting_bookings,",
      "       MAX(LENGTH(routing) - LENGTH(REPLACE(routing, '-', '')) - 1) AS max_stops",
      "FROM Itinerary",
      "WHERE LENGTH(routing) - LENGTH(REPLACE(routing, '-', '')) >= 2",
      "GROUP BY SUBSTRING_INDEX(routing, '-', 1), SUBSTRING_INDEX(routing, '-', -1)",
      "ORDER BY connecting_bookings DESC, origin, destination",
    ].join("\n"),
    alternatives: [
      [
        "SELECT origin, destination, COUNT(*) AS connecting_bookings, MAX(stops) AS max_stops",
        "FROM (SELECT LEFT(routing, 3) AS origin, RIGHT(routing, 3) AS destination, (CHAR_LENGTH(routing) - 7) DIV 4 AS stops FROM Itinerary) t",
        "WHERE stops >= 1",
        "GROUP BY origin, destination",
        "ORDER BY COUNT(*) DESC, origin ASC, destination ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(s, '-', 1)` is the text before the first hyphen; with `-1` it is the text after the last.",
      "The number of hyphens is `LENGTH(s) - LENGTH(REPLACE(s, '-', ''))`; the stops are one fewer than that.",
      "Filter to itineraries with at least one stop before grouping by the pair.",
    ],
    editorial: [
      "Everything the question needs is inside the `routing` string. The origin is the part before the first hyphen, `SUBSTRING_INDEX(routing, '-', 1)`, and the destination the part after the last, `SUBSTRING_INDEX(routing, '-', -1)`. The number of stops is the number of codes minus two, which is the number of hyphens minus one; counting a character is the standard trick `LENGTH(s) - LENGTH(REPLACE(s, '-', ''))` — remove every hyphen and see how much shorter the string gets.",
      "",
      "A direct flight has one hyphen, so `hyphens >= 2` keeps exactly the connecting itineraries. Group what is left by the (origin, destination) expressions and take `COUNT(*)` and the `MAX` of the stops. Direction matters — BLR→DEL and DEL→BLR are different pairs — which the grouping respects.",
      "",
      "Because every code has exactly three letters, the alternative can use positions instead: `LEFT(routing, 3)`, `RIGHT(routing, 3)`, and stops = (length − 7) DIV 4. That only works on fixed-width data, which is why the hyphen-based version is the safer habit. The order is fixed by the statement, with origin and destination breaking ties.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "flights-delayed-on-consecutive-days",
    title: "Flights Delayed Three or More Days in a Row",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The airline's reliability team flags a flight number that is **delayed by more than 30 minutes on at least 3 consecutive calendar days**. A day on which the flight did not operate (no row) breaks a run, and so does a day with a delay of 30 minutes or less.",
      "",
      "Return one row per such run with `flight_no`, `streak_start`, `streak_end` and `delayed_days` (the length of the run). A flight can have several runs. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DailyFlight",
        columns: [
          { name: "flight_no", type: "varchar" },
          { name: "flight_date", type: "date" },
          { name: "departure_delay_min", type: "int" },
        ],
        primaryKey: ["flight_no", "flight_date"],
        note: "One row per flight number per day it operated; `departure_delay_min` is minutes late (0 or negative when on time).",
      },
    ],
    examples: [
      {
        DailyFlight: [
          ["6E 2134", "2024-12-01", 45],
          ["6E 2134", "2024-12-02", 31],
          ["6E 2134", "2024-12-03", 80],
          ["6E 2134", "2024-12-04", 30],
          ["6E 2134", "2024-12-05", 55],
          ["6E 2134", "2024-12-06", 62],
          ["6E 2134", "2024-12-07", 44],
          ["AI 505", "2024-12-01", 90],
          ["AI 505", "2024-12-02", 120],
          ["AI 505", "2024-12-04", 75],
          ["AI 505", "2024-12-05", 40],
        ],
      },
    ],
    gen: (rng) => {
      const flights = sample(rng, ["6E 2134", "AI 505", "UK 811", "SG 160", "QP 1102"], ri(rng, 1, 3));
      const rows: Cell[][] = [];
      const late = pick(rng, [0.6, 0.75, 0.9]);
      for (const f of flights) {
        const start = dateBetween(rng, "2024-12-01", "2024-12-05");
        const days = ri(rng, 4, 12);
        for (let d = 0; d < days; d++) {
          if (chance(rng, 0.08)) continue;
          const delay = chance(rng, late) ? (chance(rng, 0.2) ? 31 : ri(rng, 31, 150)) : chance(rng, 0.3) ? 30 : ri(rng, -10, 30);
          rows.push([f, addDays(start, d), delay]);
        }
      }
      return { DailyFlight: rows };
    },
    solution: [
      "WITH late AS (",
      "  SELECT flight_no, flight_date,",
      "         DATE_SUB(flight_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY flight_no ORDER BY flight_date) DAY) AS grp",
      "  FROM DailyFlight",
      "  WHERE departure_delay_min > 30",
      ")",
      "SELECT flight_no, MIN(flight_date) AS streak_start, MAX(flight_date) AS streak_end, COUNT(*) AS delayed_days",
      "FROM late",
      "GROUP BY flight_no, grp",
      "HAVING COUNT(*) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT flight_no, flight_date,",
        "         CASE WHEN DATEDIFF(flight_date, LAG(flight_date) OVER (PARTITION BY flight_no ORDER BY flight_date)) = 1 THEN 0 ELSE 1 END AS starts_run",
        "  FROM DailyFlight WHERE departure_delay_min > 30",
        "), runs AS (",
        "  SELECT flight_no, flight_date,",
        "         SUM(starts_run) OVER (PARTITION BY flight_no ORDER BY flight_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_id",
        "  FROM marked",
        ")",
        "SELECT flight_no, MIN(flight_date) AS streak_start, MAX(flight_date) AS streak_end, COUNT(*) AS delayed_days",
        "FROM runs GROUP BY flight_no, run_id HAVING COUNT(*) >= 3",
      ].join("\n"),
    ],
    hints: [
      "Keep only the delayed days first; the question is then about runs of consecutive dates.",
      "Number the delayed days of each flight in date order. What do date − number look like inside one run?",
      "Group by flight and that difference; each group is one run.",
      "Alternatively, mark the days that start a run (the previous delayed day is not yesterday) and take a running sum of the marks.",
    ],
    editorial: [
      "This is a **gaps-and-islands** problem. After keeping only the days with a delay over 30 minutes, the runs are maximal sets of consecutive dates for one flight. The classic trick: number each flight's delayed days in date order with `ROW_NUMBER()`, and subtract that many days from the date. Inside a run both the date and the number go up by one per row, so `flight_date - rn` is constant; a missing day (no flight, or an on-time day removed by the filter) makes the date jump while the number does not, and the difference changes.",
      "",
      "Grouping by `(flight_no, grp)` therefore gives one group per run; `MIN` and `MAX` of the date are its ends, `COUNT(*)` its length, and `HAVING COUNT(*) >= 3` keeps the long ones. A delay of exactly 30 minutes is not \"more than 30\", so it is filtered out and splits a run like a missing day does.",
      "",
      "The alternative builds the island id explicitly: `LAG` finds the previous delayed date, a day starts a new run unless that date was yesterday, and a running `SUM` of the start flags (with an explicit `ROWS` frame over a unique order) numbers the runs. Both need one sort per flight.",
    ].join("\n"),
  },

  {
    slug: "peak-in-house-guests-per-hotel",
    title: "Peak In-House Guests per Hotel",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Housekeeping and the kitchen plan for the busiest night. A stay has its `guests` in-house on every night from `check_in` up to, but not including, `check_out`, so a guest who checks out on a day and a guest who checks in that day are never counted together.",
      "",
      "For every hotel with at least one stay, return `hotel_name`, `peak_guests` (the largest number of guests in-house on any night) and `first_peak_night` (the **earliest** night that reached it). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Hotel",
        columns: [
          { name: "hotel_id", type: "int" },
          { name: "hotel_name", type: "varchar" },
        ],
        primaryKey: ["hotel_id"],
        note: "One row per hotel.",
      },
      {
        name: "GuestStay",
        columns: [
          { name: "stay_id", type: "int" },
          { name: "hotel_id", type: "int" },
          { name: "guests", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
        ],
        primaryKey: ["stay_id"],
        note: "`check_out` is after `check_in`; `guests` is at least 1.",
      },
    ],
    examples: [
      {
        Hotel: [
          [1, "Lakeside Haveli"],
          [2, "Pine Ridge Lodge"],
          [3, "Tea Garden Inn"],
        ],
        GuestStay: [
          [1, 1, 2, "2024-10-10", "2024-10-13"],
          [2, 1, 3, "2024-10-11", "2024-10-12"],
          [3, 1, 4, "2024-10-13", "2024-10-15"],
          [4, 1, 1, "2024-10-14", "2024-10-16"],
          [5, 2, 2, "2024-10-01", "2024-10-03"],
          [6, 2, 2, "2024-10-03", "2024-10-04"],
        ],
      },
    ],
    gen: (rng) => {
      const hotels = sample(rng, HOTELS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ci = dateBetween(rng, "2024-10-01", "2024-10-12");
        return [id, ri(rng, 1, hotels.length), ri(rng, 1, 4), ci, addDays(ci, ri(rng, 1, 4))];
      });
      return { Hotel: hotels, GuestStay: rows };
    },
    solution: [
      "WITH moves AS (",
      "  SELECT hotel_id, check_in AS night, guests AS delta FROM GuestStay",
      "  UNION ALL",
      "  SELECT hotel_id, check_out, -guests FROM GuestStay",
      "), daily AS (",
      "  SELECT hotel_id, night, SUM(delta) AS delta FROM moves GROUP BY hotel_id, night",
      "), level AS (",
      "  SELECT hotel_id, night,",
      "         SUM(delta) OVER (PARTITION BY hotel_id ORDER BY night ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS in_house",
      "  FROM daily",
      "), ranked AS (",
      "  SELECT hotel_id, night, in_house,",
      "         ROW_NUMBER() OVER (PARTITION BY hotel_id ORDER BY in_house DESC, night) AS rn",
      "  FROM level",
      ")",
      "SELECT h.hotel_name, r.in_house AS peak_guests, r.night AS first_peak_night",
      "FROM ranked r JOIN Hotel h ON h.hotel_id = r.hotel_id",
      "WHERE r.rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH nightly AS (",
        "  SELECT s.hotel_id, s.check_in AS night,",
        "         (SELECT SUM(t.guests) FROM GuestStay t",
        "          WHERE t.hotel_id = s.hotel_id AND t.check_in <= s.check_in AND t.check_out > s.check_in) AS in_house",
        "  FROM GuestStay s",
        "), peak AS (",
        "  SELECT hotel_id, MAX(in_house) AS peak_guests FROM nightly GROUP BY hotel_id",
        ")",
        "SELECT h.hotel_name, p.peak_guests, MIN(n.night) AS first_peak_night",
        "FROM peak p",
        "JOIN nightly n ON n.hotel_id = p.hotel_id AND n.in_house = p.peak_guests",
        "JOIN Hotel h ON h.hotel_id = p.hotel_id",
        "GROUP BY h.hotel_id, h.hotel_name, p.peak_guests",
      ].join("\n"),
    ],
    hints: [
      "The number in-house only changes on a check-in or a check-out day.",
      "Turn every stay into two events: +guests on `check_in`, −guests on `check_out`. A running sum of the events is the occupancy.",
      "Net the events of one day together before the running sum, so a check-out and a check-in on the same day cancel correctly.",
      "The busiest night always starts on some check-in date — which gives a second way to solve it.",
    ],
    editorial: [
      "The occupancy of a hotel is a step function that changes only when someone arrives or leaves, so a **sweep line** solves it: turn each stay into an arrival event `+guests` on `check_in` and a departure event `-guests` on `check_out`, and the running total of the events in date order is the number of guests in-house on each night.",
      "",
      "Two details make it correct. First, all events of one hotel and day are netted together *before* the running sum (`GROUP BY hotel_id, night`), so a departure and an arrival on the same day are applied at once — the departing guest never overlaps the arriving one, matching the half-open `[check_in, check_out)` rule. That also leaves one row per day, so the running `SUM` with an explicit `ROWS` frame has a unique order. Second, the peak and its first night come from `ROW_NUMBER()` ordered by `in_house DESC, night`, which picks the earliest of several nights at the same peak.",
      "",
      "The alternative uses the fact that the maximum is reached on some check-in date: for every check-in date, sum the guests whose stay covers that night with a correlated subquery, then keep the max and the earliest date reaching it. It is quadratic in the stays per hotel; the sweep is one sort.",
    ].join("\n"),
  },

  {
    slug: "repeat-guest-90-day-retention-by-cohort",
    title: "Repeat-Guest Retention Within 90 Days by Cohort",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Aggregation"],
    description: [
      "A hotel booking app groups new guests into **cohorts** by the month of their first booking. A guest is **retained** if they made another booking **1 to 90 days after** their first booking date (a second booking on the same day as the first does not count).",
      "",
      "For every cohort return `cohort_month` (`YYYY-MM`), `new_guests`, `retained_guests` and `retention_pct` = 100 × retained / new, **rounded to 2 decimals**. Order by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "AppBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "booked_on", type: "date" },
          { name: "booking_value", type: "int" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per booking made in the app; a guest can book several times, including twice on one day.",
      },
    ],
    examples: [
      {
        AppBooking: [
          [1, 11, "2024-01-05", 4200],
          [2, 11, "2024-03-20", 6100],
          [3, 12, "2024-01-18", 3800],
          [4, 12, "2024-01-18", 2900],
          [5, 13, "2024-01-25", 5400],
          [6, 13, "2024-04-24", 4700],
          [7, 14, "2024-02-02", 7300],
          [8, 14, "2024-05-02", 3100],
          [9, 15, "2024-02-14", 8800],
        ],
      },
    ],
    gen: (rng) => {
      const ng = chance(rng, 0.05) ? 0 : ri(rng, 1, 10);
      const rows: Cell[][] = [];
      let id = 1;
      for (let g = 1; g <= ng; g++) {
        const first = dateBetween(rng, "2024-01-01", "2024-04-30");
        rows.push([id++, 100 + g, first, roundTo(rng, 2000, 12000, 100)]);
        for (let k = ri(rng, 0, 2); k > 0; k--) {
          const gap = chance(rng, 0.3) ? pick(rng, [0, 1, 90, 91]) : ri(rng, 0, 150);
          rows.push([id++, 100 + g, addDays(first, gap), roundTo(rng, 2000, 12000, 100)]);
        }
      }
      return { AppBooking: rows };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT guest_id, MIN(booked_on) AS first_on FROM AppBooking GROUP BY guest_id",
      "), flagged AS (",
      "  SELECT f.guest_id, DATE_FORMAT(f.first_on, '%Y-%m') AS cohort_month,",
      "         CASE WHEN EXISTS (SELECT 1 FROM AppBooking b",
      "                           WHERE b.guest_id = f.guest_id",
      "                             AND b.booked_on > f.first_on",
      "                             AND b.booked_on <= DATE_ADD(f.first_on, INTERVAL 90 DAY)) THEN 1 ELSE 0 END AS retained",
      "  FROM firsts f",
      ")",
      "SELECT cohort_month, COUNT(*) AS new_guests, SUM(retained) AS retained_guests,",
      "       ROUND(100 * SUM(retained) / COUNT(*), 2) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(f.first_on, 7) AS cohort_month, COUNT(DISTINCT f.guest_id) AS new_guests,",
        "       COUNT(DISTINCT b.guest_id) AS retained_guests,",
        "       ROUND(100 * COUNT(DISTINCT b.guest_id) / COUNT(DISTINCT f.guest_id), 2) AS retention_pct",
        "FROM (SELECT guest_id, MIN(booked_on) AS first_on FROM AppBooking GROUP BY guest_id) f",
        "LEFT JOIN AppBooking b ON b.guest_id = f.guest_id AND DATEDIFF(b.booked_on, f.first_on) BETWEEN 1 AND 90",
        "GROUP BY LEFT(f.first_on, 7)",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start with one row per guest: their first booking date.",
      "The cohort is the month of that date; retention asks whether a later booking falls 1–90 days after it.",
      "`EXISTS` (or a LEFT JOIN counted with `COUNT(DISTINCT …)`) turns \"any booking in the window\" into a 0/1 per guest.",
      "Count guests per cohort only after each guest has one row, or repeat bookings inflate the counts.",
    ],
    editorial: [
      "Retention analysis always starts by reducing the events to **one row per user** carrying the anchor date — here `MIN(booked_on)` per guest. The cohort is the month of that date, `DATE_FORMAT(first_on, '%Y-%m')`.",
      "",
      "Next, each guest gets a 0/1 retained flag: does any booking fall strictly after the first date and at most 90 days after it? An `EXISTS` over `booked_on > first_on AND booked_on <= DATE_ADD(first_on, INTERVAL 90 DAY)` says exactly that. The strict `>` handles the same-day second booking (a guest who booked twice on day one is not retained by it), and `<= … 90 DAY` keeps the 90th day in while the 91st is out.",
      "",
      "Only then is the data grouped by cohort: `COUNT(*)` new guests, `SUM(retained)` retained ones, and the percentage rounded to two decimals. The alternative LEFT JOINs each guest's first date to the bookings in the 1–90 day window and counts *distinct* guests on both sides — without `DISTINCT`, a guest with two return bookings would be counted twice. Both read the bookings twice; an index on `(guest_id, booked_on)` makes the window lookup cheap.",
    ].join("\n"),
  },

  {
    slug: "median-departure-delay-per-airport",
    title: "Median Departure Delay per Airport",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Average delays are skewed by a few disasters, so the operations dashboard reports the **median** departure delay at each origin airport: the middle value of its delays in sorted order, or the average of the two middle values when the count is even.",
      "",
      "Return `origin`, `departures` (the number of departures from it) and `median_delay`, **rounded to 1 decimal**, for every airport with at least one departure. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Departure",
        columns: [
          { name: "departure_id", type: "int" },
          { name: "flight_no", type: "varchar" },
          { name: "origin", type: "char" },
          { name: "delay_min", type: "int" },
        ],
        primaryKey: ["departure_id"],
        note: "One row per departure; `delay_min` is minutes late (negative when it left early) and is never NULL.",
      },
    ],
    examples: [
      {
        Departure: [
          [1, "6E 512", "BLR", 5],
          [2, "AI 503", "BLR", 120],
          [3, "UK 811", "BLR", 0],
          [4, "6E 6031", "DEL", 15],
          [5, "SG 8169", "DEL", -3],
          [6, "AI 865", "DEL", 15],
          [7, "QP 1301", "DEL", 48],
          [8, "6E 371", "GOI", 22],
        ],
      },
    ],
    gen: (rng) => {
      const ports = sample(rng, AIRPORTS, ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const pool = Array.from({ length: 6 }, () => ri(rng, -10, 90));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [code] = pick(rng, AIRLINES);
        return [id, `${code} ${ri(rng, 100, 999)}`, pick(rng, ports), chance(rng, 0.4) ? pick(rng, pool) : ri(rng, -10, 180)];
      });
      return { Departure: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT origin, delay_min,",
      "         ROW_NUMBER() OVER (PARTITION BY origin ORDER BY delay_min, departure_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY origin) AS cnt",
      "  FROM Departure",
      ")",
      "SELECT origin, MAX(cnt) AS departures, ROUND(AVG(delay_min), 1) AS median_delay",
      "FROM ordered",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), CEIL((cnt + 1) / 2))",
      "GROUP BY origin",
    ].join("\n"),
    alternatives: [
      [
        "WITH pos AS (",
        "  SELECT d.origin, d.delay_min,",
        "         (SELECT COUNT(*) FROM Departure e WHERE e.origin = d.origin",
        "            AND (e.delay_min < d.delay_min OR (e.delay_min = d.delay_min AND e.departure_id <= d.departure_id))) AS rn,",
        "         (SELECT COUNT(*) FROM Departure e WHERE e.origin = d.origin) AS cnt",
        "  FROM Departure d",
        ")",
        "SELECT origin, MIN(cnt) AS departures, ROUND(SUM(delay_min) / COUNT(*), 1) AS median_delay",
        "FROM pos",
        "WHERE 2 * rn BETWEEN cnt AND cnt + 2",
        "GROUP BY origin",
      ].join("\n"),
    ],
    hints: [
      "Number each airport's departures in delay order, and attach the airport's total count to every row.",
      "With n rows, the middle positions are ⌊(n+1)/2⌋ and ⌈(n+1)/2⌉ — the same position when n is odd.",
      "Average the delay of the rows at those positions.",
      "Equal delays need a tie-breaker in the numbering so the positions are unique.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so it is computed from positions. Number each airport's departures by delay with `ROW_NUMBER() OVER (PARTITION BY origin ORDER BY delay_min, departure_id)` and attach the group size with `COUNT(*) OVER (PARTITION BY origin)`. The median sits at positions `FLOOR((n+1)/2)` and `CEIL((n+1)/2)`: for n = 3 both are 2, for n = 4 they are 2 and 3. Keeping those one or two rows and averaging their delays gives the median in both cases.",
      "",
      "The tie-breaker on `departure_id` only makes the numbering unique; equal delays are interchangeable, so the median value does not depend on it. `MAX(cnt)` (every row carries the same count) reports the number of departures, and the result is rounded to one decimal — a median of whole minutes is either whole or ends in .5.",
      "",
      "The alternative replaces the window functions with correlated counts: a row's position is the number of rows of its airport that sort before or equal to it, and `2 * rn BETWEEN n AND n + 2` is another way to say \"one of the middle positions\". That is quadratic per airport; the window version is one sort.",
    ].join("\n"),
  },
  {
    slug: "nightly-rooms-sold-calendar-holiday-season",
    title: "Nightly Rooms Sold Calendar for the Holiday Season",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "A resort's revenue manager wants a calendar of **every night from 2024-12-20 to 2025-01-05 inclusive** showing how many rooms were sold for it — including nights where nothing was sold, which must show 0. A reservation occupies its `rooms` on every night from `check_in` up to, but not including, `check_out`; cancelled reservations occupy nothing, and reservations reaching outside the window count only for the nights inside it.",
      "",
      "Return `night` and `rooms_sold`, one row per night of the window (17 rows), ordered by `night`.",
    ].join("\n"),
    tables: [
      {
        name: "ResortReservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "guest_name", type: "varchar" },
          { name: "rooms", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "One resort. `check_out` is after `check_in`.",
      },
    ],
    examples: [
      {
        ResortReservation: [
          [1, "Aditi", 2, "2024-12-18", "2024-12-22", "confirmed"],
          [2, "Kabir", 1, "2024-12-21", "2024-12-23", "confirmed"],
          [3, "Riya", 3, "2024-12-22", "2024-12-24", "cancelled"],
          [4, "Olivia", 4, "2024-12-30", "2025-01-02", "confirmed"],
          [5, "Farhan", 1, "2024-12-31", "2025-01-01", "confirmed"],
          [6, "Meera", 2, "2025-01-04", "2025-01-09", "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.1) ? 0 : ri(rng, 1, 12);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const ci = dateBetween(rng, "2024-12-14", "2025-01-08");
        return [id, who[i]!, ri(rng, 1, 5), ci, addDays(ci, ri(rng, 1, 6)), chance(rng, 0.2) ? "cancelled" : "confirmed"];
      });
      return { ResortReservation: rows };
    },
    solution: [
      "WITH RECURSIVE calendar AS (",
      "  SELECT CAST('2024-12-20' AS DATE) AS night",
      "  UNION ALL",
      "  SELECT DATE_ADD(night, INTERVAL 1 DAY) FROM calendar WHERE night < '2025-01-05'",
      ")",
      "SELECT c.night, COALESCE(SUM(r.rooms), 0) AS rooms_sold",
      "FROM calendar c",
      "LEFT JOIN ResortReservation r",
      "  ON r.status = 'confirmed' AND r.check_in <= c.night AND r.check_out > c.night",
      "GROUP BY c.night",
      "ORDER BY c.night",
    ].join("\n"),
    alternatives: [
      [
        "WITH digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),",
        "calendar AS (",
        "  SELECT DATE_ADD('2024-12-20', INTERVAL a.d * 10 + b.d DAY) AS night",
        "  FROM digits a CROSS JOIN digits b WHERE a.d * 10 + b.d <= 16",
        ")",
        "SELECT c.night,",
        "       (SELECT COALESCE(SUM(r.rooms), 0) FROM ResortReservation r",
        "        WHERE r.status = 'confirmed' AND c.night BETWEEN r.check_in AND DATE_SUB(r.check_out, INTERVAL 1 DAY)) AS rooms_sold",
        "FROM calendar c",
        "ORDER BY c.night",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Nights with no reservation have no row anywhere — the calendar itself has to be generated.",
      "A recursive CTE can start at 2024-12-20 and add one day until 2025-01-05.",
      "LEFT JOIN the reservations that cover each night, and put the status and date tests in the `ON` clause.",
      "`SUM` over no matching rows is NULL; report 0 instead.",
    ],
    editorial: [
      "The difficulty is the nights that sold nothing: a query over `ResortReservation` alone can only produce dates that appear in it, so the calendar has to be **generated**. A recursive CTE does it: the anchor row is `2024-12-20`, and the recursive step adds one day with `DATE_ADD(night, INTERVAL 1 DAY)` while the previous night is before `2025-01-05`, which stops after 17 rows.",
      "",
      "Each calendar night is then LEFT JOINed to the reservations covering it — confirmed, `check_in <= night` and `check_out > night`, the half-open stay rule. All three tests belong in the `ON` clause: in `WHERE` they would discard the NULL-padded rows of empty nights. `COALESCE(SUM(r.rooms), 0)` turns those empty nights into 0. Reservations that start before the window or end after it need no clipping, because they only match the calendar nights they actually cover.",
      "",
      "Without recursion, a calendar can be built from a cross join of two digit tables (0–99) filtered to the 17 offsets needed, and the rooms counted with a correlated subquery per night, as in the alternative. Either way the work is one probe of the reservations per night.",
    ].join("\n"),
  },

  {
    slug: "app-sessions-ending-in-a-hotel-booking",
    title: "App Sessions That End in a Hotel Booking",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "The product team measures how often a visit to the hotel app converts. Each user's events are split into **sessions**: a new session starts with a user's first event and with any event that comes **more than 30 minutes** after that user's previous event (a gap of exactly 30 minutes stays in the same session).",
      "",
      "For every user with at least one event, return `user_id`, `sessions`, `booking_sessions` (sessions containing at least one `book` event) and `conversion_pct` = 100 × booking_sessions / sessions, **rounded to 2 decimals**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_time", type: "datetime" },
          { name: "event_type", type: "enum", values: ["search", "view_hotel", "start_checkout", "book"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked event. Two events of the same user never share an `event_time`.",
      },
    ],
    examples: [
      {
        AppEvent: [
          [1, 7, "2024-09-14 10:00:00", "search"],
          [2, 7, "2024-09-14 10:12:00", "view_hotel"],
          [3, 7, "2024-09-14 10:42:00", "book"],
          [4, 7, "2024-09-14 11:20:00", "search"],
          [5, 7, "2024-09-15 09:05:00", "search"],
          [6, 7, "2024-09-15 09:20:00", "book"],
          [7, 9, "2024-09-14 22:50:00", "search"],
          [8, 9, "2024-09-14 23:15:00", "start_checkout"],
          [9, 9, "2024-09-14 23:46:00", "book"],
        ],
      },
    ],
    gen: (rng) => {
      const users = sample(rng, [3, 7, 9, 12, 15, 21], ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const u of users) {
        if (chance(rng, 0.1)) continue;
        let t = ri(rng, 8 * 60, 12 * 60);
        const day = dateBetween(rng, "2024-09-10", "2024-09-14");
        for (let k = ri(rng, 1, 7); k > 0; k--) {
          rows.push([id++, u, at(day, t), pick(rng, ["search", "search", "view_hotel", "start_checkout", "book"])]);
          t += chance(rng, 0.25) ? pick(rng, [30, 31]) : chance(rng, 0.6) ? ri(rng, 1, 25) : ri(rng, 32, 400);
        }
      }
      return { AppEvent: shuffle(rng, rows) };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT user_id, event_time, event_type,",
      "         CASE",
      "           WHEN LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL THEN 1",
      "           WHEN TIMESTAMPDIFF(SECOND, LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time), event_time) > 1800 THEN 1",
      "           ELSE 0",
      "         END AS new_session",
      "  FROM AppEvent",
      "), numbered AS (",
      "  SELECT user_id, event_type,",
      "         SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM gaps",
      "), per_session AS (",
      "  SELECT user_id, session_no, MAX(CASE WHEN event_type = 'book' THEN 1 ELSE 0 END) AS booked",
      "  FROM numbered",
      "  GROUP BY user_id, session_no",
      ")",
      "SELECT user_id, COUNT(*) AS sessions, SUM(booked) AS booking_sessions,",
      "       ROUND(100 * SUM(booked) / COUNT(*), 2) AS conversion_pct",
      "FROM per_session",
      "GROUP BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT e.user_id, e.event_time FROM AppEvent e",
        "  WHERE NOT EXISTS (SELECT 1 FROM AppEvent p WHERE p.user_id = e.user_id AND p.event_time < e.event_time",
        "                      AND p.event_time >= DATE_SUB(e.event_time, INTERVAL 30 MINUTE))",
        "), tagged AS (",
        "  SELECT e.user_id, e.event_type,",
        "         (SELECT MAX(s.event_time) FROM starts s WHERE s.user_id = e.user_id AND s.event_time <= e.event_time) AS session_start",
        "  FROM AppEvent e",
        ")",
        "SELECT user_id, COUNT(DISTINCT session_start) AS sessions,",
        "       COUNT(DISTINCT CASE WHEN event_type = 'book' THEN session_start END) AS booking_sessions,",
        "       ROUND(100 * COUNT(DISTINCT CASE WHEN event_type = 'book' THEN session_start END) / COUNT(DISTINCT session_start), 2) AS conversion_pct",
        "FROM tagged",
        "GROUP BY user_id",
      ].join("\n"),
    ],
    hints: [
      "Compare each event with the same user's previous event — `LAG` over the user's events in time order.",
      "Mark an event 1 when it starts a session (no previous event, or a gap over 30 minutes) and 0 otherwise.",
      "A running sum of those marks numbers the sessions.",
      "Reduce to one row per session, with a flag for whether it contained a booking, before counting per user.",
    ],
    editorial: [
      "**Sessionisation** turns a stream of events into visits. Within each user, order events by time and look at the previous one with `LAG(event_time)`. An event starts a new session if there is no previous event or if the gap, `TIMESTAMPDIFF(SECOND, previous, current)`, is more than 1800 seconds. The gap of exactly 30 minutes fails the strict `>` and stays in the session, as the statement requires; measuring in seconds avoids any question of how minutes are truncated.",
      "",
      "A running `SUM` of those 0/1 start marks — with an explicit `ROWS` frame over the user's unique event times — gives every event its session number. Grouping by `(user_id, session_no)` collapses each session to one row, and `MAX(CASE WHEN event_type = 'book' THEN 1 ELSE 0 END)` flags whether it contained a booking; a session with two bookings still counts once. A final group per user counts sessions and booking sessions and rounds the ratio.",
      "",
      "The alternative avoids windows: a session start is an event with no earlier event of the same user in the preceding 30 minutes (`NOT EXISTS`), each event belongs to the latest start at or before it, and `COUNT(DISTINCT …)` over the start times counts sessions. It is quadratic per user; the window plan is one sort.",
    ].join("\n"),
  },

  {
    slug: "frequent-flyer-gold-qualification-date",
    title: "Date Each Frequent Flyer Qualified for Gold",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "A frequent flyer earns **Gold** status in a calendar year on the day their tier points earned **in that year** first reach **25000 or more**. The count starts again from zero every 1 January, so points from December never help in January.",
      "",
      "Return `member_id`, `member_name`, `qualify_year` and `qualified_on` (the date the year's running total first reached 25000) for every member and every year in which they qualified. Years in which a member stayed below 25000 are not listed. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FlyerMember",
        columns: [
          { name: "member_id", type: "int" },
          { name: "member_name", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per member of the programme.",
      },
      {
        name: "TierPointCredit",
        columns: [
          { name: "credit_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "flown_on", type: "date" },
          { name: "tier_points", type: "int" },
        ],
        primaryKey: ["credit_id"],
        note: "One row per flown segment credited; a member can be credited several segments on one day. `tier_points` is positive.",
      },
    ],
    examples: [
      {
        FlyerMember: [
          [1, "Rohan"],
          [2, "Simran"],
          [3, "David"],
        ],
        TierPointCredit: [
          [1, 1, "2023-11-03", 14000],
          [2, 1, "2023-12-18", 9000],
          [3, 1, "2024-01-09", 6000],
          [4, 1, "2024-03-22", 12000],
          [5, 1, "2024-03-22", 7000],
          [6, 2, "2024-02-14", 20000],
          [7, 2, "2024-06-30", 5000],
          [8, 2, "2024-08-11", 3000],
          [9, 3, "2024-05-05", 24000],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 5);
      const members = names(rng, nm).map((n, i) => [i + 1, n]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, nm),
        chance(rng, 0.15) ? pick(rng, ["2023-12-31", "2024-01-01"]) : dateBetween(rng, "2023-09-01", "2024-12-31"),
        chance(rng, 0.2) ? pick(rng, [12500, 5000, 25000]) : roundTo(rng, 1000, 15000, 500),
      ]);
      return { FlyerMember: members, TierPointCredit: rows };
    },
    solution: [
      "WITH running AS (",
      "  SELECT member_id, YEAR(flown_on) AS qualify_year, flown_on,",
      "         SUM(tier_points) OVER (PARTITION BY member_id, YEAR(flown_on)",
      "                                ORDER BY flown_on, credit_id",
      "                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS year_points",
      "  FROM TierPointCredit",
      ")",
      "SELECT m.member_id, m.member_name, r.qualify_year, MIN(r.flown_on) AS qualified_on",
      "FROM running r",
      "JOIN FlyerMember m ON m.member_id = r.member_id",
      "WHERE r.year_points >= 25000",
      "GROUP BY m.member_id, m.member_name, r.qualify_year",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (",
        "  SELECT member_id, flown_on, SUM(tier_points) AS pts FROM TierPointCredit GROUP BY member_id, flown_on",
        ")",
        "SELECT m.member_id, m.member_name, YEAR(d.flown_on) AS qualify_year, MIN(d.flown_on) AS qualified_on",
        "FROM daily d",
        "JOIN FlyerMember m ON m.member_id = d.member_id",
        "WHERE (SELECT SUM(e.pts) FROM daily e",
        "       WHERE e.member_id = d.member_id AND YEAR(e.flown_on) = YEAR(d.flown_on) AND e.flown_on <= d.flown_on) >= 25000",
        "GROUP BY m.member_id, m.member_name, YEAR(d.flown_on)",
      ].join("\n"),
    ],
    hints: [
      "A total that restarts every year is a running sum partitioned by member **and** year.",
      "Order the running sum by date, with a unique tie-breaker and an explicit `ROWS` frame.",
      "Of the rows where the running total is at least 25000, the qualification date is the earliest.",
      "Does it matter in which order two credits of the same day are added? Think about what date you report.",
    ],
    editorial: [
      "\"Points earned this year so far\" is a **running total that resets** — in SQL, a windowed `SUM` whose partition includes the reset key: `PARTITION BY member_id, YEAR(flown_on)`. Ordering by `flown_on, credit_id` with `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` adds one credit at a time in a fixed order, so the running total is deterministic.",
      "",
      "Once the running total crosses 25000 it never falls back, because points are positive. So the qualification date is simply the earliest date among rows whose running total is at least 25000 — `MIN(flown_on)` grouped by member and year. Years that never reach the line produce no qualifying rows and no output. Several credits on one day can be added in any order without changing the *date* reported: the total at the end of that day is the same, and the totals before that day are unaffected.",
      "",
      "The alternative first nets each member's points per day, then uses a correlated subquery to compute the year-to-date total for each day and keeps the earliest day at or above 25000. It is quadratic per member and year; the window version needs a single sort. The 1 January reset is the edge case both handle through `YEAR(flown_on)`.",
    ].join("\n"),
  },
];
