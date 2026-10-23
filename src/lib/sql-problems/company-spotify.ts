import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, CITIES, dateBetween, names, pick, ri, sample, shuffle } from "./kit.js";

/**
 * Company set — Spotify: the questions a data analyst or data engineer at a
 * music and podcast streaming service is asked — explicit tracks on kids
 * playlists, skips and full plays, Premium Family/Duo/Student plans, Discover
 * Weekly saves, the free tier's skip cap and ad load, Wrapped-style top
 * artists, songwriter splits, year-over-year growth by market,
 * featured-artist credits in titles, podcast episode-to-episode retention,
 * the pro-rata royalty pool and the weekly chart's movement labels. Every
 * schema and number here is invented for practice; none of it describes
 * Spotify's real data or internal figures. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

/** Fictional artists — distinct first letters, so no ordering ever hinges on letter case. */
const ARTISTS = [
  "Aurora Lanes", "Bombay Bassline", "Coral Static", "Dusk Riders", "Echo Harbour", "Firefly Theory",
  "Ghats Collective", "Hampi Nights", "Indigo Tides", "Juhu Satellites", "Kavya Rao", "Lunar Rickshaw",
] as const;
const TRACK_TITLES = [
  "Monsoon Letters", "Chasing Neon", "Paper Planes", "Slow Rickshaw", "Kites Over Juhu", "Last Local Train",
  "Golden Hour", "Static Hearts", "Midnight Chai", "Ocean Drive", "Saffron Sun", "Quiet Storm",
  "Rooftop Echo", "Lost in Hampi",
] as const;
const PLAYLIST_NAMES = [
  "Bedtime Lullabies", "Road Trip Hits", "Kids Dance Party", "Saturday Cartoons", "Gym Hustle",
  "Rainy Day Lo-fi", "School Bus Singalong", "Late Night Drive", "Focus Flow", "Desi Throwbacks",
] as const;
const SHOWS = [
  "Founders Unfiltered", "Cricket After Hours", "The Daily Byte", "Mindful Mornings", "Startup Chai",
  "History Untold", "Code and Coffee", "Rohan's Mixtape", "Aditi's Book Club", "Weekend Wanderer",
] as const;
const GENRES = ["Bollywood", "Classical", "Electronic", "Hip-Hop", "Indie", "Jazz", "Lo-fi", "Pop", "Rock"] as const;
const MARKETS = ["BR", "DE", "GB", "ID", "IN", "US"] as const;
const POSTCODES = ["560001", "560034", "400050", "110017", "600028", "411014"] as const;

export const COMPANY_SPOTIFY: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "spotify-explicit-tracks-on-kids-playlists",
    title: "Spotify: Explicit Tracks Sitting on Kids Playlists",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "The trust and safety team at Spotify audits playlists marked as made for kids: an explicit track should never sit on one, and every hit is sent to the curator to fix.",
      "",
      "Return one row for every **explicit track on a kids playlist**, with the columns `playlist_id`, `playlist_name`, `track_id` and `title`. Explicit tracks on other playlists, and clean tracks on kids playlists, are fine. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "artist_name", type: "varchar" },
          { name: "is_explicit", type: "bool" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track. `is_explicit` is 1 when the track carries the explicit-content label.",
      },
      {
        name: "Playlist",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "playlist_name", type: "varchar" },
          { name: "is_kids", type: "bool" },
        ],
        primaryKey: ["playlist_id"],
        note: "`is_kids` is 1 for a playlist published as made for kids.",
      },
      {
        name: "PlaylistTrack",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["playlist_id", "track_id"],
        note: "One row per track on a playlist; a track appears on a playlist at most once.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters", "Kavya Rao", 0],
          [2, "Chasing Neon", "Coral Static", 1],
          [3, "Paper Planes", "Firefly Theory", 0],
          [4, "Static Hearts", "Bombay Bassline", 1],
          [5, "Golden Hour", "Lunar Rickshaw", 1],
        ],
        Playlist: [
          [10, "Bedtime Lullabies", 1],
          [11, "Road Trip Hits", 0],
          [12, "Kids Dance Party", 1],
          [13, "Saturday Cartoons", 1],
        ],
        PlaylistTrack: [
          [10, 1, "2024-05-01"],
          [10, 2, "2024-05-03"],
          [11, 2, "2024-04-11"],
          [11, 4, "2024-04-12"],
          [12, 4, "2024-06-02"],
          [12, 3, "2024-06-02"],
          [12, 2, "2024-06-05"],
          [13, 3, "2024-07-19"],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 3, 10);
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t, pick(rng, ARTISTS), chance(rng, 0.5) ? 1 : 0]);
      const np = ri(rng, 2, 5);
      const playlists: Cell[][] = sample(rng, PLAYLIST_NAMES, np).map((p, i) => [10 + i, p, i === 0 || chance(rng, 0.5) ? 1 : 0]);
      const links: Cell[][] = [];
      if (!chance(rng, 0.05)) {
        for (const p of playlists) {
          for (const t of sample(rng, seq(1, nt), ri(rng, 1, Math.min(6, nt)))) links.push([p[0]!, t, dateBetween(rng, "2024-01-01", "2024-09-30")]);
        }
      }
      return { Track: tracks, Playlist: playlists, PlaylistTrack: shuffle(rng, links) };
    },
    solution: [
      "SELECT p.playlist_id, p.playlist_name, t.track_id, t.title",
      "FROM PlaylistTrack pt",
      "JOIN Playlist p ON p.playlist_id = pt.playlist_id",
      "JOIN Track t ON t.track_id = pt.track_id",
      "WHERE p.is_kids = 1 AND t.is_explicit = 1",
    ].join("\n"),
    alternatives: [
      "SELECT p.playlist_id, p.playlist_name, t.track_id, t.title FROM Playlist p, Track t WHERE p.is_kids = 1 AND t.is_explicit = 1 AND EXISTS (SELECT 1 FROM PlaylistTrack pt WHERE pt.playlist_id = p.playlist_id AND pt.track_id = t.track_id)",
      "SELECT p.playlist_id, p.playlist_name, t.track_id, t.title FROM (SELECT * FROM Playlist WHERE is_kids <> 0) p JOIN PlaylistTrack pt ON pt.playlist_id = p.playlist_id JOIN (SELECT * FROM Track WHERE is_explicit <> 0) t ON t.track_id = pt.track_id",
    ],
    hints: [
      "`PlaylistTrack` is the bridge: each of its rows pairs one playlist with one track.",
      "Join the bridge to both `Playlist` and `Track` so each row carries the playlist's flag and the track's flag.",
      "Keep the rows where both flags are 1.",
    ],
    editorial: [
      "Playlists and tracks are a many-to-many relation: a track sits on many playlists and a playlist holds many tracks. The bridge table `PlaylistTrack` stores the pairs, so the answer is a walk across it — join each pair to its playlist and to its track, then keep the pairs where the playlist is for kids **and** the track is explicit.",
      "",
      "Both conditions are row-level filters after the joins, so `WHERE p.is_kids = 1 AND t.is_explicit = 1` is all it takes. A track that is explicit but only on adult playlists fails the first test; a clean song on a kids playlist fails the second. Because the primary key of the bridge is `(playlist_id, track_id)`, each offending pair appears exactly once and no `DISTINCT` is needed.",
      "",
      "The alternatives start from the other side — every kids playlist crossed with every explicit track, kept when the pair exists in the bridge (`EXISTS`) — or filter each table first in derived tables and then join. With indexes on the bridge's key the join version reads each link once, which is the cheapest plan for a catalogue-sized table.",
    ].join("\n"),
  },

  {
    slug: "spotify-long-form-podcast-episodes-of-2024",
    title: "Spotify: Long-Form Podcast Episodes Released in 2024",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "Spotify's podcast ad sales team sells a separate package for long-form shows and needs the list of long episodes published last year.",
      "",
      "Return every episode **released in 2024** that runs **at least one hour** (`duration_sec` of 3600 or more), with the columns `episode_id`, `show_name` and `minutes` — the duration in **whole minutes**, any leftover seconds dropped. Order by `duration_sec` from longest to shortest, then by `episode_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Episode",
        columns: [
          { name: "episode_id", type: "int" },
          { name: "show_name", type: "varchar" },
          { name: "episode_title", type: "varchar" },
          { name: "released_on", type: "date" },
          { name: "duration_sec", type: "int" },
        ],
        primaryKey: ["episode_id"],
        note: "One row per published podcast episode; `duration_sec` is its running time in seconds.",
      },
    ],
    examples: [
      {
        Episode: [
          [1, "Founders Unfiltered", "Bootstrapping in Pune", "2024-03-14", 4210],
          [2, "Cricket After Hours", "The Perfect Yorker", "2024-05-02", 3600],
          [3, "The Daily Byte", "Chips and Tariffs", "2024-05-03", 3599],
          [4, "History Untold", "The Silk Route", "2023-12-31", 5400],
          [5, "Startup Chai", "Pricing Your SaaS", "2025-01-01", 3900],
          [6, "Code and Coffee", "Rust for Beginners", "2024-01-01", 4210],
          [7, "Mindful Mornings", "Breath Work", "2024-12-31", 7265],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 15);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, SHOWS),
        `Episode ${ri(rng, 1, 300)}`,
        chance(rng, 0.2) ? pick(rng, ["2024-01-01", "2024-12-31", "2023-12-31", "2025-01-01"]) : dateBetween(rng, "2023-10-01", "2025-03-31"),
        chance(rng, 0.2) ? pick(rng, [3600, 3599, 3660, 3659]) : ri(rng, 1200, 9000),
      ]);
      return { Episode: rows };
    },
    solution: [
      "SELECT episode_id, show_name, duration_sec DIV 60 AS minutes",
      "FROM Episode",
      "WHERE released_on BETWEEN '2024-01-01' AND '2024-12-31'",
      "  AND duration_sec >= 3600",
      "ORDER BY duration_sec DESC, episode_id",
    ].join("\n"),
    alternatives: [
      "SELECT episode_id, show_name, FLOOR(duration_sec / 60) AS minutes FROM Episode WHERE YEAR(released_on) = 2024 AND NOT duration_sec < 3600 ORDER BY duration_sec DESC, episode_id",
    ],
    ordered: true,
    hints: [
      "\"At least one hour\" includes exactly 3600 seconds.",
      "A year can be tested with a date range (both ends inclusive) or with `YEAR()`.",
      "Whole minutes means integer division: `DIV 60`, or `FLOOR` of the decimal quotient.",
      "Sort on the seconds, not the minutes, so two episodes in the same minute still come out in a fixed order.",
    ],
    editorial: [
      "This is a single-table filter with a computed column. Two conditions select the rows: the release date falls in 2024, and `duration_sec >= 3600`. The comparison must be `>=` — an episode of exactly one hour is long-form, while 3599 seconds is not.",
      "",
      "The year test can be written as a range, `released_on BETWEEN '2024-01-01' AND '2024-12-31'`, which keeps both New Year's Day and New Year's Eve, or as `YEAR(released_on) = 2024`. The range is the one an index on `released_on` can use.",
      "",
      "Minutes are whole minutes, so leftover seconds are dropped rather than rounded: 4210 seconds is 70 minutes, not 70.17 or 71. In MySQL `/` returns a decimal, so use `DIV` (integer division) or wrap the quotient in `FLOOR`. Finally the order: the statement sorts by the exact duration, so two episodes that both show 70 minutes but differ in seconds keep their true order, and `episode_id` breaks exact ties. One scan of the table plus a sort of the few qualifying rows.",
    ].join("\n"),
  },

  {
    slug: "spotify-skips-and-full-plays-per-track",
    title: "Spotify: Skips and Full Plays per Track",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "An editor deciding which songs stay on a flagship playlist looks at two signals per track: how often listeners bail out early and how often they hear it to the end.",
      "",
      "A play is a **skip** when `ms_played` is **below 30000** (under 30 seconds), and a **full play** when `ms_played` is **at least the track's `duration_ms`**; a play can be neither. For every track with at least one play, return `track_id`, `title`, `skips` and `full_plays`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "duration_ms", type: "int" },
        ],
        primaryKey: ["track_id"],
        note: "`duration_ms` is the track's length in milliseconds; every track is longer than 30 seconds.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "ms_played", type: "int" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play; `ms_played` is how long it was heard, never more than the track's length.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters", 200000],
          [2, "Chasing Neon", 185000],
          [3, "Paper Planes", 240000],
          [4, "Golden Hour", 210000],
        ],
        Play: [
          [1, 1, 7, 12000],
          [2, 1, 8, 200000],
          [3, 1, 9, 30000],
          [4, 2, 7, 29999],
          [5, 2, 8, 4000],
          [6, 3, 9, 240000],
          [7, 3, 7, 240000],
          [8, 3, 8, 150000],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 6);
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t, ri(rng, 120, 300) * 1000]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const plays: Cell[][] = seq(1, n).map((id) => {
        const tr = pick(rng, tracks);
        const dur = tr[2] as number;
        const kind = ri(rng, 0, 4);
        const ms = kind === 0 ? ri(rng, 0, 29) * 1000 : kind === 1 ? pick(rng, [30000, 29999]) : kind === 2 ? dur : ri(rng, 31, dur / 1000 - 1) * 1000;
        return [id, tr[0]!, ri(rng, 1, 9), ms];
      });
      return { Track: tracks, Play: plays };
    },
    solution: [
      "SELECT t.track_id, t.title,",
      "       SUM(CASE WHEN p.ms_played < 30000 THEN 1 ELSE 0 END) AS skips,",
      "       SUM(CASE WHEN p.ms_played >= t.duration_ms THEN 1 ELSE 0 END) AS full_plays",
      "FROM Track t",
      "JOIN Play p ON p.track_id = t.track_id",
      "GROUP BY t.track_id, t.title",
    ].join("\n"),
    alternatives: [
      "SELECT t.track_id, t.title, COUNT(IF(p.ms_played < 30000, 1, NULL)) AS skips, COUNT(IF(p.ms_played >= t.duration_ms, 1, NULL)) AS full_plays FROM Track t JOIN Play p ON p.track_id = t.track_id GROUP BY t.track_id, t.title",
      "SELECT t.track_id, t.title, (SELECT COUNT(*) FROM Play p WHERE p.track_id = t.track_id AND p.ms_played < 30000) AS skips, (SELECT COUNT(*) FROM Play p WHERE p.track_id = t.track_id AND p.ms_played >= t.duration_ms) AS full_plays FROM Track t WHERE EXISTS (SELECT 1 FROM Play p WHERE p.track_id = t.track_id)",
    ],
    hints: [
      "Both counts come from the same group of plays, so one GROUP BY per track is enough.",
      "Count only some rows of a group with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "Exactly 30 seconds is not a skip, and a play equal to the track's length is a full play.",
    ],
    editorial: [
      "Two different counts over the same group is the textbook case for **conditional aggregation**. Join each play to its track (the full-play test needs `duration_ms`), group by track, and inside the group add 1 for each row that meets a condition: `SUM(CASE WHEN ms_played < 30000 THEN 1 ELSE 0 END)` counts skips, and the same shape with `ms_played >= duration_ms` counts full plays. A play of 2 minutes on a 3-minute song adds to neither, which is what the statement asks.",
      "",
      "Both boundaries are on purpose: 29,999 ms is a skip and 30,000 ms is not, and a play that reaches the last millisecond is a full play. The inner join leaves out tracks with no plays at all, and a track whose plays were all middling still appears, with two zeros — `ELSE 0` keeps the sums at 0 rather than NULL.",
      "",
      "`COUNT(IF(cond, 1, NULL))` is the same idea, since COUNT ignores NULL. The correlated-subquery version computes each count separately per track; it reads the plays twice and is the slowest of the three, while the grouped join is a single pass.",
    ].join("\n"),
  },

  {
    slug: "spotify-family-and-duo-plans-with-open-seats",
    title: "Spotify: Family and Duo Plans With Open Seats",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins", "Conditional Logic"],
    description: [
      "The Premium growth team nudges plan managers who are paying for seats nobody uses. A **family** plan has **6** seats and a **duo** plan has **2**; every member, the manager included, takes one seat.",
      "",
      "Return every plan with at least one open seat, with the columns `plan_id`, `plan_type`, `members` and `open_seats`. A plan with no member rows at all has every seat open. Order by `open_seats` from most to fewest, then by `plan_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PremiumPlan",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "plan_type", type: "enum", values: ["family", "duo"] },
          { name: "started_on", type: "date" },
        ],
        primaryKey: ["plan_id"],
        note: "One row per shared Premium plan.",
      },
      {
        name: "PlanMember",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["plan_id", "user_id"],
        note: "One row per person currently on a plan; a plan never has more members than seats.",
      },
    ],
    examples: [
      {
        PremiumPlan: [
          [1, "family", "2023-04-01"],
          [2, "duo", "2023-09-12"],
          [3, "family", "2024-01-20"],
          [4, "duo", "2024-02-02"],
          [5, "family", "2024-03-15"],
        ],
        PlanMember: [
          [1, 101, "2023-04-01"], [1, 102, "2023-04-03"], [1, 103, "2023-05-10"],
          [1, 104, "2023-06-01"], [1, 105, "2023-06-01"], [1, 106, "2023-08-19"],
          [2, 201, "2023-09-12"], [2, 202, "2023-09-14"],
          [3, 301, "2024-01-20"], [3, 302, "2024-02-01"],
          [4, 401, "2024-02-02"],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 1, 8);
      const plans: Cell[][] = [];
      const members: Cell[][] = [];
      for (const id of seq(1, np)) {
        const type = chance(rng, 0.55) ? "family" : "duo";
        const start = dateBetween(rng, "2023-01-01", "2024-06-30");
        plans.push([id, type, start]);
        const seats = type === "family" ? 6 : 2;
        const k = chance(rng, 0.25) ? seats : ri(rng, 0, seats);
        for (const j of seq(1, k)) members.push([id, id * 100 + j, addDays(start, ri(rng, 0, 120))]);
      }
      return { PremiumPlan: plans, PlanMember: shuffle(rng, members) };
    },
    solution: [
      "SELECT p.plan_id, p.plan_type, COUNT(m.user_id) AS members,",
      "       CASE WHEN p.plan_type = 'family' THEN 6 ELSE 2 END - COUNT(m.user_id) AS open_seats",
      "FROM PremiumPlan p",
      "LEFT JOIN PlanMember m ON m.plan_id = p.plan_id",
      "GROUP BY p.plan_id, p.plan_type",
      "HAVING COUNT(m.user_id) < CASE WHEN p.plan_type = 'family' THEN 6 ELSE 2 END",
      "ORDER BY open_seats DESC, p.plan_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT plan_id, plan_type, members, seats - members AS open_seats",
        "FROM (SELECT p.plan_id, p.plan_type, IF(p.plan_type = 'family', 6, 2) AS seats,",
        "             (SELECT COUNT(*) FROM PlanMember m WHERE m.plan_id = p.plan_id) AS members",
        "      FROM PremiumPlan p) x",
        "WHERE members < seats",
        "ORDER BY open_seats DESC, plan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The seat count depends on the plan type — a CASE expression gives 6 or 2.",
      "A plan with no members must still appear, so start from the plans and LEFT JOIN the members.",
      "Count `m.user_id`, not `*`: on an unmatched LEFT JOIN row the member columns are NULL and should count as zero.",
    ],
    editorial: [
      "Open seats are seats minus members. Seats come from the plan type — `CASE WHEN plan_type = 'family' THEN 6 ELSE 2 END` — and members are a count per plan, so the query groups the plan's member rows and subtracts.",
      "",
      "The trap is the plan with nobody on it. An inner join would drop it, yet it is the plan with the most open seats. A `LEFT JOIN` keeps it as one row with NULL member columns, and `COUNT(m.user_id)` counts that NULL as 0 — `COUNT(*)` would have counted the row and reported one member. Full plans are removed in `HAVING`, since the condition is on an aggregate.",
      "",
      "The order is fixed by the statement: most open seats first, `plan_id` breaking ties. The alternative computes each plan's member count with a correlated subquery and filters in an outer query, which reads naturally but probes the members table once per plan; the grouped LEFT JOIN does it in one pass.",
    ].join("\n"),
  },

  {
    slug: "spotify-artists-with-no-release-in-2024",
    title: "Spotify: Artists Who Released Nothing in 2024",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries", "Dates"],
    description: [
      "Artist relations at Spotify reaches out to artists who went a whole year without putting out music, to pitch the tools for planning a release.",
      "",
      "Return every artist with **no release dated in 2024** — artists whose releases are all in other years, and artists with no releases at all — with the columns `artist_id` and `artist_name`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
          { name: "home_country", type: "char" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist profile.",
      },
      {
        name: "ArtistRelease",
        columns: [
          { name: "release_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "release_type", type: "enum", values: ["single", "ep", "album"] },
          { name: "released_on", type: "date" },
        ],
        primaryKey: ["release_id"],
        note: "One row per single, EP or album; `artist_id` always names an artist.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes", "IN"],
          [2, "Bombay Bassline", "IN"],
          [3, "Coral Static", "GB"],
          [4, "Dusk Riders", "US"],
          [5, "Echo Harbour", "IN"],
        ],
        ArtistRelease: [
          [10, 1, "single", "2024-02-14"],
          [11, 1, "album", "2023-11-03"],
          [12, 2, "ep", "2023-12-31"],
          [13, 2, "single", "2025-01-01"],
          [14, 3, "album", "2024-12-31"],
          [15, 5, "single", "2022-06-10"],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 1, 8);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a, pick(rng, MARKETS)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rel: Cell[][] = seq(10, n).map((id) => [
        id,
        ri(rng, 1, na),
        pick(rng, ["single", "single", "ep", "album"]),
        chance(rng, 0.25) ? pick(rng, ["2024-01-01", "2024-12-31", "2023-12-31", "2025-01-01"]) : dateBetween(rng, "2022-01-01", "2025-06-30"),
      ]);
      return { Artist: artists, ArtistRelease: rel };
    },
    solution: [
      "SELECT a.artist_id, a.artist_name",
      "FROM Artist a",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM ArtistRelease r",
      "  WHERE r.artist_id = a.artist_id",
      "    AND r.released_on BETWEEN '2024-01-01' AND '2024-12-31'",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT a.artist_id, a.artist_name FROM Artist a LEFT JOIN ArtistRelease r ON r.artist_id = a.artist_id AND YEAR(r.released_on) = 2024 WHERE r.release_id IS NULL",
      "SELECT artist_id, artist_name FROM Artist WHERE artist_id NOT IN (SELECT artist_id FROM ArtistRelease WHERE released_on >= '2024-01-01' AND released_on < '2025-01-01')",
    ],
    hints: [
      "This is an anti join: keep the artists for whom a certain row does *not* exist.",
      "The year belongs inside the existence test, not in the outer WHERE.",
      "With a LEFT JOIN, put the year condition in the ON clause; in WHERE it would turn the join back into an inner one.",
    ],
    editorial: [
      "The question is about a row that is missing — a 2024 release — so it is an **anti join**. `NOT EXISTS` states it directly: keep an artist when no release of theirs falls between 1 January and 31 December 2024. An artist with only 2023 and 2025 releases passes, and so does an artist with no releases at all, because the subquery finds nothing either way.",
      "",
      "Where the date condition sits matters. In the LEFT JOIN alternative the year test is in `ON`, so the join only matches 2024 releases and `r.release_id IS NULL` keeps the artists that matched none. Moving `YEAR(...) = 2024` into `WHERE` would throw away exactly the unmatched rows we want. The `NOT IN` version is safe here because `ArtistRelease.artist_id` is never NULL — a single NULL in the list would make `NOT IN` return nothing.",
      "",
      "Both boundary days count as 2024; the hidden datasets test 31 December 2023 and 1 January 2025 too. With an index on `(artist_id, released_on)` each artist costs one index probe.",
    ].join("\n"),
  },

  {
    slug: "spotify-student-plans-due-for-reverification",
    title: "Spotify: Student Plans Due for Re-Verification",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Premium Student is discounted only while the subscriber is still enrolled, so Spotify asks students to re-verify **every 12 months**. Billing runs the check on **2025-03-01**.",
      "",
      "Return every **active** student subscriber whose last verification was **12 months or more** before 2025-03-01 — that is, `verified_on` on or before 2024-03-01 — with the columns `user_id`, `user_name` and `days_since_verified` (days from `verified_on` to 2025-03-01). Order by `days_since_verified` from most to fewest, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "StudentPlan",
        columns: [
          { name: "user_id", type: "int" },
          { name: "user_name", type: "varchar" },
          { name: "university", type: "varchar" },
          { name: "verified_on", type: "date" },
          { name: "status", type: "enum", values: ["active", "cancelled"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per Premium Student subscription; `verified_on` is the date enrolment was last confirmed.",
      },
    ],
    examples: [
      {
        StudentPlan: [
          [1, "Aarav", "IIT Bombay", "2024-03-01", "active"],
          [2, "Diya", "Delhi University", "2024-03-02", "active"],
          [3, "Kabir", "BITS Pilani", "2023-08-15", "active"],
          [4, "Meera", "Anna University", "2023-01-10", "cancelled"],
          [5, "Rohan", "Christ University", "2024-02-29", "active"],
          [6, "Zara", "IIT Madras", "2023-08-15", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 15);
      const who = names(rng, n);
      const unis = ["IIT Bombay", "Delhi University", "BITS Pilani", "Anna University", "Christ University", "IIT Madras", "Jadavpur University"];
      const rows: Cell[][] = seq(1, n).map((id, i) => [
        id,
        who[i]!,
        pick(rng, unis),
        chance(rng, 0.25) ? pick(rng, ["2024-03-01", "2024-03-02", "2024-02-29", "2023-03-01"]) : dateBetween(rng, "2022-06-01", "2025-02-15"),
        chance(rng, 0.8) ? "active" : "cancelled",
      ]);
      return { StudentPlan: rows };
    },
    solution: [
      "SELECT user_id, user_name, DATEDIFF('2025-03-01', verified_on) AS days_since_verified",
      "FROM StudentPlan",
      "WHERE status = 'active'",
      "  AND verified_on <= '2024-03-01'",
      "ORDER BY days_since_verified DESC, user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, user_name, DATEDIFF('2025-03-01', verified_on) AS days_since_verified FROM StudentPlan WHERE status = 'active' AND verified_on <= DATE_SUB('2025-03-01', INTERVAL 12 MONTH) ORDER BY days_since_verified DESC, user_id",
      "SELECT user_id, user_name, DATEDIFF('2025-03-01', verified_on) AS days_since_verified FROM StudentPlan WHERE status <> 'cancelled' AND DATE_ADD(verified_on, INTERVAL 1 YEAR) <= '2025-03-01' ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Twelve months before 2025-03-01 is 2024-03-01; a verification on that very day is due.",
      "`DATEDIFF(later, earlier)` gives the number of days between two dates.",
      "Cancelled subscriptions are not billed, so they are not checked.",
    ],
    editorial: [
      "The rule is a cut-off date: anyone verified on or before 2024-03-01 has gone twelve months without re-verifying by the run date. Writing the cut-off as `DATE_SUB('2025-03-01', INTERVAL 12 MONTH)` lets the database work it out, and the comparison `verified_on <= cut-off` is inclusive because a student verified exactly a year ago is due today. A student verified on 2024-03-02 still has a day left.",
      "",
      "The leap day is a nice check: 29 February 2024 plus one year is 28 February 2025 in MySQL's month arithmetic, which is before the run date, so that student is due under every formulation — the date range, `DATE_SUB` and `DATE_ADD(verified_on, INTERVAL 1 YEAR)` all agree.",
      "",
      "`DATEDIFF('2025-03-01', verified_on)` gives the age of the verification in days, and the statement fixes the order, with `user_id` breaking ties between students verified the same day. One scan of the table, or an index range scan on `verified_on`.",
    ].join("\n"),
  },

  {
    slug: "spotify-artist-merch-revenue-from-shipped-orders",
    title: "Spotify: Artist Merch Revenue From Shipped Orders",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "Artists can sell merchandise from their Spotify profile, and the partnerships team reports how much each artist's store actually sold. Only orders that **shipped** count — refunded and pending orders do not.",
      "",
      "For every artist with at least one shipped order, return `artist_name`, `units` (total quantity shipped) and `revenue` (the sum of `quantity * unit_price` over shipped orders). Order by `revenue` from highest to lowest, then by `artist_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist; names are unique.",
      },
      {
        name: "MerchOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "item", type: "varchar" },
          { name: "quantity", type: "int" },
          { name: "unit_price", type: "int" },
          { name: "status", type: "enum", values: ["shipped", "refunded", "pending"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order line; `unit_price` is in rupees.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes"],
          [2, "Bombay Bassline"],
          [3, "Coral Static"],
          [4, "Dusk Riders"],
        ],
        MerchOrder: [
          [100, 1, "Tour T-shirt", 2, 900, "shipped"],
          [101, 1, "Vinyl", 1, 2400, "refunded"],
          [102, 2, "Hoodie", 1, 1800, "shipped"],
          [103, 3, "Poster", 4, 300, "shipped"],
          [104, 3, "Cap", 1, 600, "shipped"],
          [105, 4, "Vinyl", 1, 2600, "pending"],
          [106, 2, "Poster", 2, 0, "shipped"],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 1, 6);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a]);
      const items: [string, number][] = [["Tour T-shirt", 900], ["Hoodie", 1800], ["Poster", 300], ["Cap", 600], ["Vinyl", 2400], ["Tote Bag", 450]];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(100, n).map((id) => {
        const [item, price] = pick(rng, items);
        return [id, ri(rng, 1, na), item, ri(rng, 1, 4), price, pick(rng, ["shipped", "shipped", "shipped", "refunded", "pending"])];
      });
      return { Artist: artists, MerchOrder: rows };
    },
    solution: [
      "SELECT a.artist_name, SUM(o.quantity) AS units, SUM(o.quantity * o.unit_price) AS revenue",
      "FROM Artist a",
      "JOIN MerchOrder o ON o.artist_id = a.artist_id",
      "WHERE o.status = 'shipped'",
      "GROUP BY a.artist_id, a.artist_name",
      "ORDER BY revenue DESC, a.artist_name",
    ].join("\n"),
    alternatives: [
      "SELECT a.artist_name, t.units, t.revenue FROM Artist a JOIN (SELECT artist_id, SUM(quantity) AS units, SUM(quantity * unit_price) AS revenue FROM MerchOrder WHERE status IN ('shipped') GROUP BY artist_id) t ON t.artist_id = a.artist_id ORDER BY t.revenue DESC, a.artist_name",
    ],
    ordered: true,
    hints: [
      "Filter to shipped orders before grouping.",
      "Revenue of a line is `quantity * unit_price`; sum that expression, not the prices.",
      "Two artists can tie on revenue — the name decides their order.",
    ],
    editorial: [
      "Revenue is a sum over order lines of `quantity * unit_price`, so the expression goes inside `SUM`. Summing `unit_price` alone would undercount a line of four posters, and multiplying the summed quantity by an average price would be wrong when an artist sells several items at different prices.",
      "",
      "The status filter runs in `WHERE`, before grouping, so a refunded vinyl or a pending order adds nothing. Because the join is an inner one and the filter removes non-shipped lines, an artist whose orders are all refunded or pending has no rows left and is not listed, which is what \"at least one shipped order\" means. A free giveaway line (price 0) still counts its units.",
      "",
      "Order by revenue, highest first, with the artist name breaking ties — in the example all three artists with shipped orders sell exactly ₹1,800, so the names alone decide the order. The alternative aggregates the orders in a derived table first and joins the names afterwards, which is the same plan; grouping per `artist_id` keeps two artists apart even if a name repeated.",
    ].join("\n"),
  },

  {
    slug: "spotify-podcast-show-url-slugs",
    title: "Spotify: URL Slugs for Podcast Show Names",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "The podcast team is moving shows to readable web addresses built from the show name. Creators typed names by hand, so some have stray spaces at either end and some contain an apostrophe.",
      "",
      "For every show, return `show_id` and `url_slug`: the name with **leading and trailing spaces removed**, **apostrophes (') deleted**, every remaining **space replaced by a hyphen**, and all letters in **lower case**. Names never contain two spaces in a row. Order by `show_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PodcastShow",
        columns: [
          { name: "show_id", type: "int" },
          { name: "show_name", type: "varchar" },
          { name: "host_name", type: "varchar" },
        ],
        primaryKey: ["show_id"],
        note: "One row per podcast show, the name exactly as the creator entered it.",
      },
    ],
    examples: [
      {
        PodcastShow: [
          [1, "Founders Unfiltered", "Ishaan"],
          [2, "  Cricket After Hours ", "Kabir"],
          [3, "Rohan's Mixtape", "Rohan"],
          [4, "The Daily Byte  ", "Ananya"],
          [5, "Aditi's Book Club", "Aditi"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const rows: Cell[][] = sample(rng, SHOWS, n).map((s, i) => {
        let name: string = s;
        if (chance(rng, 0.3)) name = name.toUpperCase();
        if (chance(rng, 0.3)) name = " ".repeat(ri(rng, 1, 3)) + name;
        if (chance(rng, 0.3)) name = name + " ".repeat(ri(rng, 1, 2));
        return [i + 1, name, pick(rng, names(rng, 5))];
      });
      return { PodcastShow: rows };
    },
    solution: [
      "SELECT show_id,",
      "       LOWER(REPLACE(REPLACE(TRIM(show_name), '''', ''), ' ', '-')) AS url_slug",
      "FROM PodcastShow",
      "ORDER BY show_id",
    ].join("\n"),
    alternatives: [
      "SELECT show_id, REPLACE(REPLACE(LCASE(TRIM(show_name)), ' ', '-'), '''', '') AS url_slug FROM PodcastShow ORDER BY show_id",
      "SELECT show_id, LOWER(REPLACE(TRIM(REPLACE(show_name, '''', '')), ' ', '-')) AS url_slug FROM PodcastShow ORDER BY show_id",
    ],
    ordered: true,
    hints: [
      "Trim first: spaces at the ends must disappear, not become hyphens.",
      "`REPLACE(s, from, to)` with an empty `to` deletes characters.",
      "Inside a SQL string an apostrophe is written as two: `''''` is a one-character string holding `'`.",
    ],
    editorial: [
      "A slug is built by a chain of string functions, and the only real decision is their order. `TRIM` must come before the space-to-hyphen replacement: `'  Cricket After Hours '` trimmed is `'Cricket After Hours'`, which becomes `cricket-after-hours`; replacing first would leave hyphens at both ends.",
      "",
      "Apostrophes are deleted with `REPLACE(x, '''', '')`. The odd-looking literal is a string containing one apostrophe — inside single quotes, a quote is escaped by doubling it. So `Rohan's Mixtape` turns into `rohans-mixtape`. Lower-casing can happen at any point because it does not change spaces or apostrophes, and `LOWER` and `LCASE` are synonyms.",
      "",
      "The alternatives apply the same steps in other orders — lower-case first, or deleting apostrophes before trimming — and give identical slugs, which is a good way to convince yourself which steps commute. Each row is processed on its own, so the query is a single scan plus the sort by `show_id`.",
    ].join("\n"),
  },
  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "spotify-discover-weekly-save-rate",
    title: "Spotify: Discover Weekly Save Rate per Listener",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The personalisation team judges each Discover Weekly drop by how many of its recommendations listeners save. A recommendation counts as **saved** only when the listener saved that track **during the playlist's week** — from `week_start` through the sixth day after it, both included. A track saved earlier was not discovered by the playlist.",
      "",
      "For the playlist of the week starting **2024-09-02**, return one row per listener who received it, with the columns `listener_id`, `recommended` (tracks in their playlist), `saved` and `save_rate_pct` — `saved` as a percentage of `recommended`, **rounded to 2 decimal places**. Order by `save_rate_pct` from highest to lowest, then by `listener_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DiscoverWeekly",
        columns: [
          { name: "week_start", type: "date" },
          { name: "listener_id", type: "int" },
          { name: "track_id", type: "int" },
        ],
        primaryKey: ["week_start", "listener_id", "track_id"],
        note: "One row per track recommended to a listener in a week's Discover Weekly; weeks start on Mondays.",
      },
      {
        name: "SavedTrack",
        columns: [
          { name: "listener_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "saved_on", type: "date" },
        ],
        primaryKey: ["listener_id", "track_id"],
        note: "A track in a listener's Liked Songs and the day it was saved; a track is saved at most once.",
      },
    ],
    examples: [
      {
        DiscoverWeekly: [
          ["2024-09-02", 1, 11], ["2024-09-02", 1, 12], ["2024-09-02", 1, 13], ["2024-09-02", 1, 14],
          ["2024-09-02", 2, 11], ["2024-09-02", 2, 15],
          ["2024-09-02", 3, 16], ["2024-09-02", 3, 17], ["2024-09-02", 3, 18],
          ["2024-08-26", 4, 12], ["2024-08-26", 4, 19],
        ],
        SavedTrack: [
          [1, 11, "2024-09-02"],
          [1, 13, "2024-09-08"],
          [1, 14, "2024-09-09"],
          [2, 11, "2024-08-20"],
          [2, 15, "2024-09-05"],
          [4, 12, "2024-08-27"],
        ],
      },
    ],
    gen: (rng) => {
      const weeks = ["2024-08-26", "2024-09-02", "2024-09-02", "2024-09-09"];
      const dw: Cell[][] = [];
      const saves = new Map<string, Cell[]>();
      for (const listener of seq(1, ri(rng, 1, 5))) {
        for (const week of new Set(sample(rng, weeks, ri(rng, 1, 3)))) {
          for (const track of sample(rng, seq(10, 20), ri(rng, 1, week === "2024-09-02" ? 8 : 3))) {
            dw.push([week, listener, track]);
            const key = `${listener}-${track}`;
            if (!saves.has(key) && chance(rng, 0.5)) {
              const day = chance(rng, 0.3) ? pick(rng, [-1, 0, 6, 7]) : ri(rng, -5, 10);
              saves.set(key, [listener, track, addDays(week, day)]);
            }
          }
        }
      }
      return { DiscoverWeekly: dw, SavedTrack: shuffle(rng, [...saves.values()]) };
    },
    solution: [
      "SELECT d.listener_id,",
      "       COUNT(*) AS recommended,",
      "       COUNT(s.track_id) AS saved,",
      "       ROUND(100 * COUNT(s.track_id) / COUNT(*), 2) AS save_rate_pct",
      "FROM DiscoverWeekly d",
      "LEFT JOIN SavedTrack s",
      "  ON s.listener_id = d.listener_id",
      " AND s.track_id = d.track_id",
      " AND s.saved_on BETWEEN d.week_start AND DATE_ADD(d.week_start, INTERVAL 6 DAY)",
      "WHERE d.week_start = '2024-09-02'",
      "GROUP BY d.listener_id",
      "ORDER BY save_rate_pct DESC, d.listener_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT listener_id, COUNT(*) AS recommended, SUM(was_saved) AS saved, ROUND(100 * SUM(was_saved) / COUNT(*), 2) AS save_rate_pct",
        "FROM (SELECT d.listener_id, CASE WHEN EXISTS (SELECT 1 FROM SavedTrack s WHERE s.listener_id = d.listener_id AND s.track_id = d.track_id",
        "        AND s.saved_on >= '2024-09-02' AND s.saved_on <= '2024-09-08') THEN 1 ELSE 0 END AS was_saved",
        "      FROM DiscoverWeekly d WHERE d.week_start = '2024-09-02') x",
        "GROUP BY listener_id",
        "ORDER BY save_rate_pct DESC, listener_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start from the recommendations, so a listener who saved nothing still gets a row.",
      "Match a save on listener **and** track, and put the week's date window in the join condition.",
      "With a LEFT JOIN, `COUNT(s.track_id)` counts only the matched saves.",
      "`/` is decimal division in MySQL, so `100 * saved / recommended` keeps the fraction until ROUND.",
    ],
    editorial: [
      "Every recommendation of the week is one row of `DiscoverWeekly`; the question for each is whether a matching save exists inside the week. A `LEFT JOIN` to `SavedTrack` on listener, track **and** the date window answers it row by row: matched rows carry a save, unmatched ones carry NULLs. Grouping by listener, `COUNT(*)` is the playlist size and `COUNT(s.track_id)` the number saved.",
      "",
      "The window belongs in `ON`. In `WHERE`, `s.saved_on BETWEEN …` would be NULL for unmatched rows and drop them, turning the LEFT JOIN into an inner one and losing every listener who saved nothing — and their recommendations from the denominator. Saves before the week (listener 2's track 11 was liked in August) are not discoveries; a save on the seventh day after `week_start` is the next week's. Both window ends are inclusive: 2 September and 8 September count.",
      "",
      "The rate is `100 * saved / recommended`, rounded to two places. The alternative tests each recommendation with a correlated `EXISTS` and averages the flags, which is the same plan written out. Both are one pass over the week's recommendations with a primary-key probe into the saves.",
    ].join("\n"),
  },

  {
    slug: "spotify-free-listeners-hitting-the-hourly-skip-cap",
    title: "Spotify: Free Listeners Who Hit the Hourly Skip Cap",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Subqueries"],
    description: [
      "On the free tier a listener gets a limited number of skips per hour. Product analytics wants to know who keeps running into the limit, as a signal for an upgrade offer. Count skips per **clock hour** — the same date and the same hour, so 10:00:00 to 10:59:59 — and call an hour **capped** when a listener made **6 or more** skips in it.",
      "",
      "Return every **free** listener with at least one capped hour, with the columns `listener_id`, `display_name`, `capped_hours` (how many clock hours were capped) and `peak_skips` (the most skips they made in any single clock hour). Premium listeners are never in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Listener",
        columns: [
          { name: "listener_id", type: "int" },
          { name: "display_name", type: "varchar" },
          { name: "tier", type: "enum", values: ["free", "premium"] },
        ],
        primaryKey: ["listener_id"],
        note: "One row per listener and their current tier.",
      },
      {
        name: "SkipEvent",
        columns: [
          { name: "skip_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "skipped_at", type: "datetime" },
        ],
        primaryKey: ["skip_id"],
        note: "One row per press of the skip button.",
      },
    ],
    examples: [
      {
        Listener: [
          [1, "Aarav", "free"],
          [2, "Diya", "free"],
          [3, "Kabir", "premium"],
          [4, "Meera", "free"],
        ],
        SkipEvent: [
          [1, 1, "2024-10-05 21:02:10"], [2, 1, "2024-10-05 21:05:44"], [3, 1, "2024-10-05 21:10:03"],
          [4, 1, "2024-10-05 21:31:59"], [5, 1, "2024-10-05 21:47:20"], [6, 1, "2024-10-05 21:59:59"],
          [7, 2, "2024-10-05 09:50:00"], [8, 2, "2024-10-05 09:52:00"], [9, 2, "2024-10-05 09:55:00"],
          [10, 2, "2024-10-05 10:01:00"], [11, 2, "2024-10-05 10:03:00"], [12, 2, "2024-10-05 10:04:00"],
          [13, 3, "2024-10-06 18:00:01"], [14, 3, "2024-10-06 18:01:01"], [15, 3, "2024-10-06 18:02:01"],
          [16, 3, "2024-10-06 18:03:01"], [17, 3, "2024-10-06 18:04:01"], [18, 3, "2024-10-06 18:05:01"],
          [19, 4, "2024-10-06 08:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nl = ri(rng, 2, 5);
      const who = names(rng, nl);
      const listeners: Cell[][] = seq(1, nl).map((id, i) => [id, who[i]!, chance(rng, 0.8) ? "free" : "premium"]);
      const skips: Cell[][] = [];
      const pad = (n: number) => String(n).padStart(2, "0");
      for (const l of listeners) {
        for (let b = ri(rng, chance(rng, 0.1) ? 0 : 1, 2); b > 0; b--) {
          const day = dateBetween(rng, "2024-10-01", "2024-10-07");
          const hour = ri(rng, 0, 22);
          const k = chance(rng, 0.35) ? 6 : ri(rng, 3, 9);
          for (let j = 0; j < k; j++) {
            // A burst sometimes straddles the hour boundary.
            const h = chance(rng, 0.15) ? hour + 1 : hour;
            skips.push([0, l[0]!, `${day} ${pad(h)}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`]);
          }
        }
      }
      shuffle(rng, skips).forEach((r, i) => (r[0] = i + 1));
      return { Listener: listeners, SkipEvent: skips };
    },
    solution: [
      "WITH hourly AS (",
      "  SELECT listener_id, LEFT(skipped_at, 13) AS clock_hour, COUNT(*) AS skips",
      "  FROM SkipEvent",
      "  GROUP BY listener_id, LEFT(skipped_at, 13)",
      ")",
      "SELECT l.listener_id, l.display_name, COUNT(*) AS capped_hours, MAX(h.skips) AS peak_skips",
      "FROM Listener l",
      "JOIN hourly h ON h.listener_id = l.listener_id",
      "WHERE l.tier = 'free' AND h.skips >= 6",
      "GROUP BY l.listener_id, l.display_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.listener_id, l.display_name, COUNT(*) AS capped_hours, MAX(h.skips) AS peak_skips",
        "FROM Listener l",
        "JOIN (SELECT listener_id, DATE(skipped_at) AS d, HOUR(skipped_at) AS hr, COUNT(*) AS skips",
        "      FROM SkipEvent GROUP BY listener_id, DATE(skipped_at), HOUR(skipped_at)",
        "      HAVING COUNT(*) >= 6) h ON h.listener_id = l.listener_id",
        "WHERE l.tier IN ('free')",
        "GROUP BY l.listener_id, l.display_name",
      ].join("\n"),
      [
        "SELECT l.listener_id, l.display_name, x.capped_hours, x.peak_skips",
        "FROM Listener l",
        "JOIN (SELECT listener_id, SUM(CASE WHEN skips >= 6 THEN 1 ELSE 0 END) AS capped_hours, MAX(skips) AS peak_skips",
        "      FROM (SELECT listener_id, DATE_FORMAT(skipped_at, '%Y-%m-%d %H') AS hh, COUNT(*) AS skips FROM SkipEvent GROUP BY listener_id, DATE_FORMAT(skipped_at, '%Y-%m-%d %H')) t",
        "      GROUP BY listener_id) x ON x.listener_id = l.listener_id",
        "WHERE l.tier = 'free' AND x.capped_hours > 0",
      ].join("\n"),
    ],
    hints: [
      "Two levels of grouping: first skips per listener per clock hour, then hours per listener.",
      "A clock hour is the timestamp cut to its hour — `LEFT(skipped_at, 13)` or `DATE()` plus `HOUR()`.",
      "Skips at 09:55 and 10:01 are in different hours even though they are six minutes apart.",
      "The busiest hour of a listener with a capped hour is itself capped, so the peak can be taken over capped hours only.",
    ],
    editorial: [
      "The cap is measured per clock hour, so the first step is a bucket per listener per hour. Since timestamps are stored as `YYYY-MM-DD HH:MM:SS`, the first 13 characters (`LEFT(skipped_at, 13)`) name the date and the hour, and grouping by that with `COUNT(*)` gives skips per bucket. `DATE()` plus `HOUR()` or `DATE_FORMAT(…, '%Y-%m-%d %H')` build the same key.",
      "",
      "The second step keeps the capped buckets (`skips >= 6`, so exactly six counts) and groups again per listener: `COUNT(*)` is the number of capped hours and `MAX(skips)` the peak. Joining `Listener` and filtering `tier = 'free'` removes premium users — in the example Kabir skips six times in an hour, but he is premium. Diya's burst of six skips straddles 10:00, three on each side, so she never hits the cap.",
      "",
      "The peak over capped hours equals the peak over all hours, because a listener's busiest hour is at least as busy as any capped one. The last alternative shows that by computing both figures over every hour and filtering afterwards. All versions are two hash aggregations over the skip log.",
    ].join("\n"),
  },

  {
    slug: "spotify-wrapped-top-artist-of-every-listener",
    title: "Spotify: Wrapped Top Artist of Every Listener",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "For the year-end Wrapped story, every listener's card opens with the artist they spent the most time with in **2024**. Only plays whose `played_at` falls in 2024 count, and time is the sum of `ms_played`.",
      "",
      "Return one row per listener with at least one 2024 play, with the columns `listener_id`, `top_artist` (the artist's name) and `minutes_played` — that artist's 2024 listening time in minutes (`ms / 60000`), **rounded to 1 decimal place**. When two artists tie on time, the one whose name comes **first alphabetically** wins. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist; names are unique.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "played_at", type: "datetime" },
          { name: "ms_played", type: "int" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play of a track, credited to the track's main artist.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes"],
          [2, "Bombay Bassline"],
          [3, "Coral Static"],
        ],
        Play: [
          [1, 7, 1, "2024-02-11 08:30:00", 180000],
          [2, 7, 2, "2024-03-01 19:05:00", 240000],
          [3, 7, 1, "2024-12-31 23:59:00", 60000],
          [4, 8, 3, "2023-12-31 22:00:00", 900000],
          [5, 8, 2, "2024-01-01 00:10:00", 126000],
          [6, 9, 3, "2024-06-14 10:00:00", 300000],
          [7, 9, 2, "2024-06-15 10:00:00", 300000],
          [8, 10, 1, "2025-01-01 00:00:00", 200000],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 2, 6);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 28);
      const plays: Cell[][] = seq(1, n).map((id) => {
        const day = chance(rng, 0.15) ? pick(rng, ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2023-11-01", "2025-02-15");
        // Multiples of 6 seconds keep every minute figure a clean tenth.
        return [id, ri(rng, 1, 5), ri(rng, 1, na), atTime(rng, day), (chance(rng, 0.3) ? 30 : ri(rng, 5, 60)) * 6000];
      });
      return { Artist: artists, Play: plays };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT p.listener_id, a.artist_name, SUM(p.ms_played) AS ms",
      "  FROM Play p",
      "  JOIN Artist a ON a.artist_id = p.artist_id",
      "  WHERE p.played_at >= '2024-01-01' AND p.played_at < '2025-01-01'",
      "  GROUP BY p.listener_id, a.artist_id, a.artist_name",
      "), ranked AS (",
      "  SELECT listener_id, artist_name, ms,",
      "         ROW_NUMBER() OVER (PARTITION BY listener_id ORDER BY ms DESC, artist_name) AS rn",
      "  FROM totals",
      ")",
      "SELECT listener_id, artist_name AS top_artist, ROUND(ms / 60000, 1) AS minutes_played",
      "FROM ranked",
      "WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (SELECT p.listener_id, a.artist_name, SUM(p.ms_played) AS ms FROM Play p JOIN Artist a ON a.artist_id = p.artist_id",
        "                WHERE YEAR(p.played_at) = 2024 GROUP BY p.listener_id, a.artist_id, a.artist_name)",
        "SELECT t.listener_id, t.artist_name AS top_artist, ROUND(t.ms / 60000, 1) AS minutes_played",
        "FROM totals t",
        "WHERE NOT EXISTS (SELECT 1 FROM totals o WHERE o.listener_id = t.listener_id",
        "                  AND (o.ms > t.ms OR (o.ms = t.ms AND o.artist_name < t.artist_name)))",
      ].join("\n"),
    ],
    hints: [
      "First total the 2024 listening per listener and artist; only then pick the top one.",
      "A plain `MAX` gives the top time but not who earned it — rank the artists inside each listener instead.",
      "Put the tie-break in the window's ORDER BY: time descending, then name ascending.",
    ],
    editorial: [
      "This is a **top-1 per group** over an aggregate. Step one sums `ms_played` per listener and artist, keeping only plays with `played_at` in 2024 — the half-open range `>= '2024-01-01' AND < '2025-01-01'` keeps a play at 23:59 on New Year's Eve and drops one at midnight after it.",
      "",
      "Step two ranks each listener's artists with `ROW_NUMBER() OVER (PARTITION BY listener_id ORDER BY ms DESC, artist_name)` and keeps rank 1. Because the order includes the name, a tie on time — listener 9 spent exactly five minutes with two artists — resolves to the alphabetically first artist, and exactly one row per listener survives. `RANK()` would keep both tied artists.",
      "",
      "The alternative keeps a total when no other total of the same listener beats it, with the same two-level comparison spelled out in `NOT EXISTS`. A listener whose only plays are from 2023 or 2025 has no totals and no row. The minutes are `ms / 60000` rounded to one place. Both approaches aggregate once; the window version then sorts each listener's few artists, the anti-join compares pairs of them.",
    ].join("\n"),
  },

  {
    slug: "spotify-collaborative-playlists-only-the-owner-edits",
    title: "Spotify: Collaborative Playlists Only the Owner Edits",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "A collaborative playlist is meant to be built by friends together. The social features team wants the collaborative playlists where, so far, **every track was added by the owner** — the owner switched collaboration on but nobody joined in — to test an \"invite a friend\" nudge.",
      "",
      "Return every **collaborative** playlist with **at least one** added track, all of them added by its owner, with the columns `playlist_id`, `playlist_name` and `tracks_added`. Playlists that are not collaborative, and collaborative playlists with no tracks yet, are not in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Playlist",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "playlist_name", type: "varchar" },
          { name: "owner_id", type: "int" },
          { name: "is_collaborative", type: "bool" },
        ],
        primaryKey: ["playlist_id"],
        note: "One row per user playlist; `owner_id` is the user who created it.",
      },
      {
        name: "PlaylistAdd",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "added_by", type: "int" },
          { name: "added_at", type: "datetime" },
        ],
        primaryKey: ["playlist_id", "track_id"],
        note: "One row per track currently on a playlist, with the user who added it.",
      },
    ],
    examples: [
      {
        Playlist: [
          [1, "Goa Trip 2024", 100, 1],
          [2, "Hostel Room 204", 200, 1],
          [3, "Late Night Drive", 300, 0],
          [4, "Office Friday", 400, 1],
          [5, "Wedding Sangeet", 500, 1],
        ],
        PlaylistAdd: [
          [1, 11, 100, "2024-04-01 10:00:00"],
          [1, 12, 100, "2024-04-01 10:02:00"],
          [1, 13, 100, "2024-04-02 18:30:00"],
          [2, 11, 200, "2024-05-10 22:00:00"],
          [2, 14, 201, "2024-05-10 22:05:00"],
          [3, 15, 300, "2024-06-01 01:00:00"],
          [5, 16, 500, "2024-07-07 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 1, 7);
      const lists: Cell[][] = sample(rng, PLAYLIST_NAMES, np).map((n, i) => [i + 1, n, (i + 1) * 100, chance(rng, 0.75) ? 1 : 0]);
      const adds: Cell[][] = [];
      for (const p of lists) {
        const k = chance(rng, 0.15) ? 0 : ri(rng, 1, 5);
        const friendly = chance(rng, 0.45);
        for (const t of sample(rng, seq(11, 20), k)) {
          const by = friendly && chance(rng, 0.5) ? (p[2] as number) + ri(rng, 1, 3) : p[2]!;
          adds.push([p[0]!, t, by, atTime(rng, dateBetween(rng, "2024-03-01", "2024-09-30"))]);
        }
      }
      return { Playlist: lists, PlaylistAdd: shuffle(rng, adds) };
    },
    solution: [
      "SELECT p.playlist_id, p.playlist_name, COUNT(*) AS tracks_added",
      "FROM Playlist p",
      "JOIN PlaylistAdd a ON a.playlist_id = p.playlist_id",
      "WHERE p.is_collaborative = 1",
      "GROUP BY p.playlist_id, p.playlist_name, p.owner_id",
      "HAVING SUM(CASE WHEN a.added_by <> p.owner_id THEN 1 ELSE 0 END) = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.playlist_id, p.playlist_name, (SELECT COUNT(*) FROM PlaylistAdd a WHERE a.playlist_id = p.playlist_id) AS tracks_added",
        "FROM Playlist p",
        "WHERE p.is_collaborative = 1",
        "  AND EXISTS (SELECT 1 FROM PlaylistAdd a WHERE a.playlist_id = p.playlist_id)",
        "  AND NOT EXISTS (SELECT 1 FROM PlaylistAdd a WHERE a.playlist_id = p.playlist_id AND a.added_by <> p.owner_id)",
      ].join("\n"),
      "SELECT p.playlist_id, p.playlist_name, COUNT(*) AS tracks_added FROM Playlist p JOIN PlaylistAdd a ON a.playlist_id = p.playlist_id WHERE p.is_collaborative <> 0 GROUP BY p.playlist_id, p.playlist_name HAVING COUNT(DISTINCT a.added_by) = 1 AND MIN(a.added_by) = MIN(p.owner_id)",
    ],
    hints: [
      "\"Every add is by the owner\" is the same as \"no add is by someone else\".",
      "After grouping a playlist's adds, count the ones whose `added_by` differs from the owner; that count must be 0.",
      "An inner join already drops the playlists with no adds.",
    ],
    editorial: [
      "\"All adds were by the owner\" is a universal condition, and SQL has two standard ways to test one. The grouped way joins every add to its playlist, groups per playlist, and requires that the number of foreign adds is zero: `HAVING SUM(CASE WHEN added_by <> owner_id THEN 1 ELSE 0 END) = 0`. `COUNT(*)` in the same group is the number of tracks added.",
      "",
      "The other way turns *all* into *none*: keep the playlist when `NOT EXISTS` an add by somebody else. On its own that is true for an empty playlist too — a vacuous \"everyone who added was the owner\" — so the alternative also demands `EXISTS` an add. The grouped join gets that for free, since a playlist with no adds forms no group. Non-collaborative playlists are filtered first; Late Night Drive has only the owner's tracks but is not collaborative.",
      "",
      "The third query says the same with one distinct contributor who is the owner. The grouped forms read the adds once; the subquery form probes them up to three times per playlist, cheap with the `(playlist_id, track_id)` key.",
    ].join("\n"),
  },

  {
    slug: "spotify-ad-load-by-market-against-the-cap",
    title: "Spotify: Ad Load by Market Against the Four-an-Hour Cap",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Ad-supported listening has a target ceiling of **four ads per hour** of listening. The ads operations team checks each market's load for **October 2024**: listening minutes come from free-tier sessions dated in October, ads from impressions served in October, and both are credited to the market of the listener.",
      "",
      "For every market with at least one October session, return `market`, `listening_minutes`, `ads_served` (0 when no ad was served) and `load_status`: `'over cap'` when the market served **more than 4 ads per 60 listening minutes**, otherwise `'within cap'`. Exactly four an hour is within the cap. Order by `market`.",
    ].join("\n"),
    tables: [
      {
        name: "Listener",
        columns: [
          { name: "listener_id", type: "int" },
          { name: "market", type: "char" },
        ],
        primaryKey: ["listener_id"],
        note: "One row per free-tier listener and their two-letter market code.",
      },
      {
        name: "AdSupportedSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "session_date", type: "date" },
          { name: "minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per listening session on the free tier, with its length in whole minutes.",
      },
      {
        name: "AdImpression",
        columns: [
          { name: "impression_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "served_at", type: "datetime" },
        ],
        primaryKey: ["impression_id"],
        note: "One row per audio ad played to a listener.",
      },
    ],
    examples: [
      {
        Listener: [
          [1, "IN"], [2, "IN"], [3, "BR"], [4, "US"], [5, "DE"],
        ],
        AdSupportedSession: [
          [10, 1, "2024-10-02", 45],
          [11, 2, "2024-10-03", 15],
          [12, 3, "2024-10-05", 30],
          [13, 3, "2024-09-30", 90],
          [14, 4, "2024-10-31", 60],
        ],
        AdImpression: [
          [100, 1, "2024-10-02 08:10:00"], [101, 1, "2024-10-02 08:25:00"], [102, 2, "2024-10-03 21:00:00"],
          [103, 2, "2024-10-03 21:07:00"], [104, 3, "2024-10-05 12:00:00"], [105, 3, "2024-10-05 12:12:00"],
          [106, 3, "2024-10-05 12:20:00"], [107, 3, "2024-11-01 00:00:05"], [108, 5, "2024-10-09 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nl = ri(rng, 2, 8);
      const listeners: Cell[][] = seq(1, nl).map((id) => [id, pick(rng, MARKETS)]);
      const ns = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const sessions: Cell[][] = seq(10, ns).map((id) => [
        id,
        ri(rng, 1, nl),
        chance(rng, 0.15) ? pick(rng, ["2024-09-30", "2024-10-01", "2024-10-31", "2024-11-01"]) : dateBetween(rng, "2024-09-25", "2024-11-05"),
        pick(rng, [15, 30, 45, 60, 90, ri(rng, 5, 120)]),
      ]);
      const ni = ri(rng, 0, 25);
      const ads: Cell[][] = seq(100, ni).map((id) => {
        const day = chance(rng, 0.1) ? pick(rng, ["2024-09-30", "2024-11-01"]) : dateBetween(rng, "2024-10-01", "2024-10-31");
        return [id, ri(rng, 1, nl), atTime(rng, day)];
      });
      return { Listener: listeners, AdSupportedSession: sessions, AdImpression: ads };
    },
    solution: [
      "WITH mins AS (",
      "  SELECT l.market, SUM(s.minutes) AS listening_minutes",
      "  FROM AdSupportedSession s",
      "  JOIN Listener l ON l.listener_id = s.listener_id",
      "  WHERE s.session_date BETWEEN '2024-10-01' AND '2024-10-31'",
      "  GROUP BY l.market",
      "), ads AS (",
      "  SELECT l.market, COUNT(*) AS ads_served",
      "  FROM AdImpression i",
      "  JOIN Listener l ON l.listener_id = i.listener_id",
      "  WHERE i.served_at >= '2024-10-01' AND i.served_at < '2024-11-01'",
      "  GROUP BY l.market",
      ")",
      "SELECT m.market, m.listening_minutes, COALESCE(a.ads_served, 0) AS ads_served,",
      "       CASE WHEN COALESCE(a.ads_served, 0) * 60 > m.listening_minutes * 4 THEN 'over cap' ELSE 'within cap' END AS load_status",
      "FROM mins m",
      "LEFT JOIN ads a ON a.market = m.market",
      "ORDER BY m.market",
    ].join("\n"),
    alternatives: [
      [
        "SELECT x.market, x.listening_minutes, x.ads_served, IF(x.ads_served * 15 > x.listening_minutes, 'over cap', 'within cap') AS load_status",
        "FROM (SELECT l.market, SUM(s.minutes) AS listening_minutes,",
        "             (SELECT COUNT(*) FROM AdImpression i JOIN Listener l2 ON l2.listener_id = i.listener_id",
        "              WHERE l2.market = l.market AND DATE(i.served_at) BETWEEN '2024-10-01' AND '2024-10-31') AS ads_served",
        "      FROM AdSupportedSession s JOIN Listener l ON l.listener_id = s.listener_id",
        "      WHERE YEAR(s.session_date) = 2024 AND MONTH(s.session_date) = 10",
        "      GROUP BY l.market) x",
        "ORDER BY x.market",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Joining sessions and impressions directly multiplies rows — each session would pair with every ad of the market.",
      "Aggregate minutes per market and ads per market separately, then join the two summaries.",
      "Avoid a fractional rate: \"more than 4 per 60 minutes\" is `ads * 60 > minutes * 4`.",
      "A market with listening but no ads must show 0, so LEFT JOIN the ads summary and COALESCE.",
    ],
    editorial: [
      "Two independent facts per market — minutes listened and ads served — live in two different tables, both reached through `Listener`. Joining all three at once is the classic **fan-out** bug: a market's every session pairs with every impression, so minutes get multiplied by the number of ads and ads by the number of sessions. The fix is to aggregate each fact on its own, in two CTEs keyed by market, and join the summaries one-to-one.",
      "",
      "The date filters go inside each summary. Sessions are dated, so `BETWEEN '2024-10-01' AND '2024-10-31'` is exact; impressions are timestamps, so a half-open range up to `'2024-11-01'` keeps 31 October 23:59 and drops 1 November 00:00:05. The answer starts from the minutes summary, because the statement lists markets with October listening; a `LEFT JOIN` to ads plus `COALESCE` gives 0 for a market without ads, and a market with ads but no sessions (DE in the example) never appears.",
      "",
      "The cap test stays in integers: four per hour means `ads * 60 > minutes * 4`, or `ads * 15 > minutes` — no division, no rounding, and exactly four an hour (IN: 4 ads in 60 minutes) is within the cap. The alternative counts each market's ads in a correlated subquery instead of a second summary.",
    ].join("\n"),
  },

  {
    slug: "spotify-artists-not-touring-their-top-listening-city",
    title: "Spotify: Artists Not Touring Their Top Listening City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries", "Joins"],
    description: [
      "Spotify shows artists where their listeners are, so that tour routing follows demand. An artist's **top city** is the city with the **most distinct listeners** who played the artist (a listener's city is the one on their profile); when two cities tie, the one that comes **first alphabetically** is the top city.",
      "",
      "Return every artist whose top city has **no concert** of theirs in the `Concert` table, with the columns `artist_name`, `top_city` and `listeners` (distinct listeners in that city). Artists nobody played are not in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist; names are unique.",
      },
      {
        name: "Listener",
        columns: [
          { name: "listener_id", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["listener_id"],
        note: "One row per listener and the city on their profile.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "played_on", type: "date" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play; one listener may play an artist many times.",
      },
      {
        name: "Concert",
        columns: [
          { name: "concert_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "show_date", type: "date" },
        ],
        primaryKey: ["concert_id"],
        note: "One row per listed concert, past or upcoming.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes"],
          [2, "Bombay Bassline"],
          [3, "Coral Static"],
          [4, "Dusk Riders"],
        ],
        Listener: [
          [1, "Mumbai"], [2, "Mumbai"], [3, "Pune"], [4, "Delhi"], [5, "Delhi"], [6, "Bengaluru"],
        ],
        Play: [
          [1, 1, 1, "2024-08-01"], [2, 1, 1, "2024-08-02"], [3, 1, 1, "2024-08-03"], [4, 3, 1, "2024-08-04"],
          [5, 4, 1, "2024-08-04"], [6, 5, 1, "2024-08-05"],
          [7, 1, 2, "2024-08-01"], [8, 2, 2, "2024-08-02"], [9, 6, 2, "2024-08-03"],
          [10, 4, 3, "2024-08-03"], [11, 6, 3, "2024-08-03"],
        ],
        Concert: [
          [1, 2, "Mumbai", "2024-12-14"],
          [2, 1, "Pune", "2025-01-18"],
          [3, 3, "Delhi", "2024-11-02"],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 1, 5);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a]);
      const cities = sample(rng, CITIES, ri(rng, 2, 4));
      const nl = ri(rng, 2, 8);
      const listeners: Cell[][] = seq(1, nl).map((id) => [id, pick(rng, cities)]);
      const np = chance(rng, 0.05) ? 0 : ri(rng, 2, 25);
      const plays: Cell[][] = seq(1, np).map((id) => [id, ri(rng, 1, nl), ri(rng, 1, na), dateBetween(rng, "2024-06-01", "2024-09-30")]);
      const nc = ri(rng, 0, 5);
      const concerts: Cell[][] = seq(1, nc).map((id) => [id, ri(rng, 1, na), pick(rng, cities), dateBetween(rng, "2024-10-01", "2025-03-31")]);
      return { Artist: artists, Listener: listeners, Play: plays, Concert: concerts };
    },
    solution: [
      "WITH reach AS (",
      "  SELECT p.artist_id, l.city, COUNT(DISTINCT p.listener_id) AS listeners",
      "  FROM Play p",
      "  JOIN Listener l ON l.listener_id = p.listener_id",
      "  GROUP BY p.artist_id, l.city",
      "), best AS (",
      "  SELECT artist_id, city, listeners,",
      "         ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY listeners DESC, city) AS rn",
      "  FROM reach",
      ")",
      "SELECT a.artist_name, b.city AS top_city, b.listeners",
      "FROM best b",
      "JOIN Artist a ON a.artist_id = b.artist_id",
      "WHERE b.rn = 1",
      "  AND NOT EXISTS (SELECT 1 FROM Concert c WHERE c.artist_id = b.artist_id AND c.city = b.city)",
    ].join("\n"),
    alternatives: [
      [
        "WITH reach AS (SELECT p.artist_id, l.city, COUNT(DISTINCT p.listener_id) AS listeners FROM Play p JOIN Listener l ON l.listener_id = p.listener_id GROUP BY p.artist_id, l.city)",
        "SELECT DISTINCT a.artist_name, r.city AS top_city, r.listeners",
        "FROM reach r",
        "JOIN Artist a ON a.artist_id = r.artist_id",
        "LEFT JOIN Concert c ON c.artist_id = r.artist_id AND c.city = r.city",
        "WHERE c.concert_id IS NULL",
        "  AND NOT EXISTS (SELECT 1 FROM reach o WHERE o.artist_id = r.artist_id",
        "                  AND (o.listeners > r.listeners OR (o.listeners = r.listeners AND o.city < r.city)))",
      ].join("\n"),
    ],
    hints: [
      "Reach is about people, not plays: count `DISTINCT listener_id` per artist and city.",
      "Pick one city per artist — rank the cities with the tie-break in the ORDER BY.",
      "Then keep the artists whose top city has no matching concert row (artist **and** city).",
    ],
    editorial: [
      "Three steps. First, **reach per city**: join plays to listeners to get each play's city, then `COUNT(DISTINCT listener_id)` per artist and city. Counting plays would let one superfan outweigh a city full of casual listeners — in the example listener 1 plays Aurora Lanes three times, but Mumbai still has only one Aurora listener, as does Pune, while Delhi has two.",
      "",
      "Second, the **top city**: `ROW_NUMBER()` per artist ordered by listeners descending, then city ascending, so a tie resolves to the alphabetically first city and each artist gets exactly one. Bombay Bassline has two Mumbai listeners and one in Bengaluru, so Mumbai is top; Coral Static ties one–one between Bengaluru and Delhi, and Bengaluru wins the tie.",
      "",
      "Third, an **anti join** against `Concert` on both artist and city: Bombay Bassline already plays Mumbai, so it is fine; Aurora Lanes has a Pune date but its top city is Delhi, so it is reported. The alternative finds the top city with `NOT EXISTS` a better city and the missing concert with a `LEFT JOIN … IS NULL`. The cost is one aggregation over plays plus small sorts.",
    ].join("\n"),
  },

  {
    slug: "spotify-shared-plans-with-members-at-different-addresses",
    title: "Spotify: Shared Plans With Members at Different Addresses",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Joins"],
    description: [
      "Premium Family and Premium Duo are meant for people who live together, so the plan-integrity team looks for shared plans whose members' accounts show **more than one postal code**. A member who never entered a postal code (NULL) neither proves nor breaks the rule and is ignored in the comparison.",
      "",
      "Return every `duo` or `family` plan whose members have **two or more different known postal codes**, with the columns `plan_id`, `plan_type`, `members` (all members, including those without a postal code) and `postal_codes` (the number of distinct known codes). Order by `plan_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SubscriptionPlan",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "plan_type", type: "enum", values: ["individual", "student", "duo", "family"] },
        ],
        primaryKey: ["plan_id"],
        note: "One row per Premium subscription.",
      },
      {
        name: "PlanMember",
        columns: [
          { name: "user_id", type: "int" },
          { name: "plan_id", type: "int" },
        ],
        primaryKey: ["user_id"],
        note: "Which plan each user belongs to; a user is on at most one plan.",
      },
      {
        name: "Account",
        columns: [
          { name: "user_id", type: "int" },
          { name: "user_name", type: "varchar" },
          { name: "postal_code", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per user; `postal_code` is NULL when the user never entered one.",
      },
    ],
    examples: [
      {
        SubscriptionPlan: [
          [1, "family"], [2, "duo"], [3, "duo"], [4, "individual"], [5, "family"],
        ],
        PlanMember: [
          [11, 1], [12, 1], [13, 1], [14, 1],
          [21, 2], [22, 2],
          [31, 3], [32, 3],
          [41, 4],
          [51, 5], [52, 5],
        ],
        Account: [
          [11, "Aarav", "560001"], [12, "Aditi", "560001"], [13, "Ishaan", "560034"], [14, "Ira", null],
          [21, "Kabir", "400050"], [22, "Karan", null],
          [31, "Meera", "110017"], [32, "Mia", "600028"],
          [41, "Neha", "411014"],
          [51, "Riya", "411014"], [52, "Rohan", "411014"],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 1, 7);
      const plans: Cell[][] = [];
      const members: Cell[][] = [];
      const accounts: Cell[][] = [];
      for (const id of seq(1, np)) {
        const type = pick(rng, ["family", "family", "duo", "duo", "individual", "student"]);
        plans.push([id, type]);
        const k = type === "family" ? ri(rng, 1, 6) : type === "duo" ? ri(rng, 1, 2) : 1;
        const home = pick(rng, POSTCODES);
        const who = names(rng, k);
        for (const j of seq(1, k)) {
          const uid = id * 10 + j;
          members.push([uid, id]);
          const code = chance(rng, 0.2) ? null : chance(rng, 0.25) ? pick(rng, POSTCODES) : home;
          accounts.push([uid, who[j - 1]!, code]);
        }
      }
      return { SubscriptionPlan: plans, PlanMember: shuffle(rng, members), Account: accounts };
    },
    solution: [
      "SELECT p.plan_id, p.plan_type, COUNT(*) AS members, COUNT(DISTINCT a.postal_code) AS postal_codes",
      "FROM SubscriptionPlan p",
      "JOIN PlanMember m ON m.plan_id = p.plan_id",
      "JOIN Account a ON a.user_id = m.user_id",
      "WHERE p.plan_type IN ('duo', 'family')",
      "GROUP BY p.plan_id, p.plan_type",
      "HAVING COUNT(DISTINCT a.postal_code) > 1",
      "ORDER BY p.plan_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.plan_id, p.plan_type, COUNT(*) AS members, COUNT(DISTINCT a.postal_code) AS postal_codes",
        "FROM SubscriptionPlan p JOIN PlanMember m ON m.plan_id = p.plan_id JOIN Account a ON a.user_id = m.user_id",
        "WHERE p.plan_type = 'duo' OR p.plan_type = 'family'",
        "GROUP BY p.plan_id, p.plan_type",
        "HAVING MIN(a.postal_code) <> MAX(a.postal_code)",
        "ORDER BY p.plan_id",
      ].join("\n"),
      [
        "SELECT p.plan_id, p.plan_type, (SELECT COUNT(*) FROM PlanMember m WHERE m.plan_id = p.plan_id) AS members,",
        "       (SELECT COUNT(DISTINCT a.postal_code) FROM PlanMember m JOIN Account a ON a.user_id = m.user_id WHERE m.plan_id = p.plan_id) AS postal_codes",
        "FROM SubscriptionPlan p",
        "WHERE p.plan_type IN ('duo', 'family')",
        "  AND EXISTS (SELECT 1 FROM PlanMember m1 JOIN Account a1 ON a1.user_id = m1.user_id",
        "              JOIN PlanMember m2 ON m2.plan_id = m1.plan_id JOIN Account a2 ON a2.user_id = m2.user_id",
        "              WHERE m1.plan_id = p.plan_id AND a1.postal_code <> a2.postal_code)",
        "ORDER BY p.plan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join plan → member → account so each row carries a member's postal code.",
      "`COUNT(DISTINCT col)` ignores NULLs, which is exactly the rule for missing codes.",
      "Count members with `COUNT(*)` so members without a code are still counted.",
    ],
    editorial: [
      "Per plan we need two numbers, so it is a grouped query over plan → member → account. `COUNT(*)` counts every member row, and `COUNT(DISTINCT a.postal_code)` counts the different codes. Aggregate functions skip NULL, so a member with no code adds to `members` but not to `postal_codes` — the statement's rule exactly. The `HAVING` keeps plans with more than one distinct code, and `WHERE` removes individual and student plans before grouping.",
      "",
      "In the example the family plan 1 has codes 560001 (twice), 560034 and NULL: two distinct known codes, four members — flagged. Duo 2 has one code and one NULL, which is not evidence of two homes. Family 5 shares one code and passes.",
      "",
      "Two other formulations agree. `MIN(code) <> MAX(code)` is true exactly when at least two distinct non-NULL values exist, since MIN and MAX also skip NULLs. And the self-join `EXISTS` looks for any two members of the plan whose codes differ — a NULL comparison is never true, so it ignores missing codes too. The grouped version is one pass; the self-join compares pairs and is quadratic in plan size, which is fine for at most six members.",
    ].join("\n"),
  },

  {
    slug: "spotify-songwriter-splits-that-do-not-add-up",
    title: "Spotify: Songwriter Splits That Don't Add Up to 100%",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Before publishing royalties can be paid on a track, its songwriter split sheet must share out **exactly 100%**. The publishing operations team wants every track that is not ready: splits that total more or less than 100, and tracks with **no split rows at all**.",
      "",
      "Return those tracks with the columns `track_id`, `title`, `writers` (number of split rows) and `total_share` (the sum of `share_pct`, **0** for a track with no splits). Order by `track_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "release_date", type: "date" },
        ],
        primaryKey: ["track_id"],
        note: "One row per recording.",
      },
      {
        name: "WriterSplit",
        columns: [
          { name: "track_id", type: "int" },
          { name: "writer_name", type: "varchar" },
          { name: "share_pct", type: "int" },
        ],
        primaryKey: ["track_id", "writer_name"],
        note: "One row per songwriter credited on a track, with their share in whole percent.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters", "2024-01-12"],
          [2, "Chasing Neon", "2024-02-02"],
          [3, "Paper Planes", "2024-03-15"],
          [4, "Golden Hour", "2024-04-19"],
          [5, "Static Hearts", "2024-05-24"],
        ],
        WriterSplit: [
          [1, "Kavya Rao", 50], [1, "Vikram Iyer", 50],
          [2, "Neha Das", 40], [2, "Arjun Nair", 40],
          [3, "Ishaan Bose", 60], [3, "Priya Menon", 30], [3, "Dev Rao", 20],
          [5, "Simran Joshi", 100],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 8);
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t, dateBetween(rng, "2024-01-01", "2024-12-31")]);
      const splits: Cell[][] = [];
      const writers = ["Kavya Rao", "Vikram Iyer", "Neha Das", "Arjun Nair", "Ishaan Bose", "Priya Menon", "Dev Rao", "Simran Joshi"];
      for (const t of tracks) {
        const mode = ri(rng, 0, 3);
        if (mode === 0) continue;
        const who = sample(rng, writers, ri(rng, 1, 4));
        const shares = who.map(() => 0);
        let left = 100;
        who.forEach((_, i) => {
          shares[i] = i === who.length - 1 ? left : ri(rng, 1, Math.max(1, left - (who.length - 1 - i)));
          left -= shares[i]!;
        });
        if (mode === 3) shares[0]! += pick(rng, [-10, -5, 5, 20]);
        who.forEach((w, i) => splits.push([t[0]!, w, Math.max(1, shares[i]!)]));
      }
      return { Track: tracks, WriterSplit: shuffle(rng, splits) };
    },
    solution: [
      "SELECT t.track_id, t.title, COUNT(w.writer_name) AS writers, COALESCE(SUM(w.share_pct), 0) AS total_share",
      "FROM Track t",
      "LEFT JOIN WriterSplit w ON w.track_id = t.track_id",
      "GROUP BY t.track_id, t.title",
      "HAVING COALESCE(SUM(w.share_pct), 0) <> 100",
      "ORDER BY t.track_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.track_id, t.title, COALESCE(s.writers, 0) AS writers, COALESCE(s.total_share, 0) AS total_share",
        "FROM Track t",
        "LEFT JOIN (SELECT track_id, COUNT(*) AS writers, SUM(share_pct) AS total_share FROM WriterSplit GROUP BY track_id) s ON s.track_id = t.track_id",
        "WHERE s.total_share IS NULL OR s.total_share <> 100",
        "ORDER BY t.track_id",
      ].join("\n"),
      "SELECT track_id, title, (SELECT COUNT(*) FROM WriterSplit w WHERE w.track_id = t.track_id) AS writers, IFNULL((SELECT SUM(share_pct) FROM WriterSplit w WHERE w.track_id = t.track_id), 0) AS total_share FROM Track t WHERE IFNULL((SELECT SUM(share_pct) FROM WriterSplit w WHERE w.track_id = t.track_id), 0) <> 100 ORDER BY track_id",
    ],
    ordered: true,
    hints: [
      "A track with no splits has no rows to sum — start from `Track` and LEFT JOIN.",
      "`SUM` over no rows is NULL, and `NULL <> 100` is not true; turn it into 0 first.",
      "Count the writer column, not `*`, so a track without splits shows 0 writers.",
    ],
    editorial: [
      "The check is a sum per track compared with 100, so the core is `GROUP BY track_id` with `SUM(share_pct)`. The interesting part is the track with **no** split rows: it is the least ready of all, but an inner join would never see it, and even with a `LEFT JOIN` its `SUM` is NULL. `NULL <> 100` evaluates to NULL, which `HAVING` treats as false — the track would silently vanish. `COALESCE(SUM(...), 0)` turns it into 0, which is not 100, so it is reported with `total_share` 0.",
      "",
      "`COUNT(w.writer_name)` counts only matched split rows, giving 0 writers for such a track, whereas `COUNT(*)` would count the one NULL-padded row. Shares are whole percents, so the comparison with 100 is exact; with fractional shares like 33.33 you would compare against a tolerance or store basis points.",
      "",
      "The alternatives aggregate the splits in a derived table first and test `IS NULL OR <> 100` after the LEFT JOIN, or compute both figures with correlated subqueries. All read the split table once per track or once in total; the grouped LEFT JOIN is the simplest single pass.",
    ].join("\n"),
  },

  {
    slug: "spotify-listeners-who-finished-an-album",
    title: "Spotify: Listeners Who Played an Album Front to Back",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "Album-first listening is something labels ask about when deciding on track order. A listener **completed** an album when they played **every track on it** at least once for **30 seconds or more** (`ms_played` of 30000 or more); the plays can be in any order and on any days, and shorter plays do not count.",
      "",
      "Return one row per completed album and listener, with the columns `listener_id` and `album_title`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Album",
        columns: [
          { name: "album_id", type: "int" },
          { name: "album_title", type: "varchar" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["album_id"],
        note: "One row per album; titles are unique.",
      },
      {
        name: "AlbumTrack",
        columns: [
          { name: "track_id", type: "int" },
          { name: "album_id", type: "int" },
          { name: "track_no", type: "int" },
        ],
        primaryKey: ["track_id"],
        note: "Every track belongs to exactly one album, and every album has at least one track.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "ms_played", type: "int" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play of a track.",
      },
    ],
    examples: [
      {
        Album: [
          [1, "Monsoon Letters", "Kavya Rao"],
          [2, "Neon Bazaar", "Coral Static"],
          [3, "Single Origin", "Echo Harbour"],
        ],
        AlbumTrack: [
          [11, 1, 1], [12, 1, 2], [13, 1, 3],
          [21, 2, 1], [22, 2, 2],
          [31, 3, 1],
        ],
        Play: [
          [1, 7, 13, 200000], [2, 7, 11, 31000], [3, 7, 12, 30000], [4, 7, 12, 1000],
          [5, 8, 11, 210000], [6, 8, 12, 190000], [7, 8, 13, 29999],
          [8, 8, 21, 200000], [9, 8, 22, 200000], [10, 8, 21, 200000],
          [11, 9, 31, 45000], [12, 9, 21, 60000],
        ],
      },
    ],
    gen: (rng) => {
      const nAlb = ri(rng, 1, 4);
      const titles = sample(rng, ["Monsoon Letters", "Neon Bazaar", "Single Origin", "Paper Boats", "Night Market", "Coastal Lines"], nAlb);
      const albums: Cell[][] = titles.map((t, i) => [i + 1, t, pick(rng, ARTISTS)]);
      const tracks: Cell[][] = [];
      for (const a of albums) {
        const k = ri(rng, 1, 4);
        for (const j of seq(1, k)) tracks.push([(a[0] as number) * 10 + j, a[0]!, j]);
      }
      const plays: Cell[][] = [];
      let id = 1;
      for (const listener of seq(1, ri(rng, 1, 4))) {
        for (const a of sample(rng, albums, ri(rng, 0, nAlb))) {
          const albumTracks = tracks.filter((t) => t[1] === a[0]);
          const full = chance(rng, 0.5);
          for (const t of albumTracks) {
            if (!full && chance(rng, 0.4)) continue;
            const ms = chance(rng, 0.15) ? pick(rng, [29999, 30000, 5000]) : ri(rng, 31, 240) * 1000;
            plays.push([id++, listener, t[0]!, ms]);
            if (chance(rng, 0.2)) plays.push([id++, listener, t[0]!, ri(rng, 1, 29) * 1000]);
          }
        }
      }
      return { Album: albums, AlbumTrack: tracks, Play: plays };
    },
    solution: [
      "SELECT q.listener_id, al.album_title",
      "FROM (",
      "  SELECT p.listener_id, t.album_id, COUNT(DISTINCT p.track_id) AS played",
      "  FROM Play p",
      "  JOIN AlbumTrack t ON t.track_id = p.track_id",
      "  WHERE p.ms_played >= 30000",
      "  GROUP BY p.listener_id, t.album_id",
      ") q",
      "JOIN Album al ON al.album_id = q.album_id",
      "WHERE q.played = (SELECT COUNT(*) FROM AlbumTrack t2 WHERE t2.album_id = q.album_id)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT p.listener_id, al.album_title",
        "FROM Play p",
        "JOIN AlbumTrack t ON t.track_id = p.track_id",
        "JOIN Album al ON al.album_id = t.album_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM AlbumTrack t2",
        "  WHERE t2.album_id = t.album_id",
        "    AND NOT EXISTS (SELECT 1 FROM Play p2 WHERE p2.listener_id = p.listener_id AND p2.track_id = t2.track_id AND p2.ms_played >= 30000)",
        ")",
      ].join("\n"),
      [
        "WITH sizes AS (SELECT album_id, COUNT(*) AS n FROM AlbumTrack GROUP BY album_id)",
        "SELECT p.listener_id, al.album_title",
        "FROM Play p JOIN AlbumTrack t ON t.track_id = p.track_id JOIN Album al ON al.album_id = t.album_id JOIN sizes s ON s.album_id = t.album_id",
        "WHERE p.ms_played >= 30000",
        "GROUP BY p.listener_id, al.album_id, al.album_title, s.n",
        "HAVING COUNT(DISTINCT p.track_id) = s.n",
      ].join("\n"),
    ],
    hints: [
      "This is relational division: listeners who played *all* tracks of an album.",
      "Count the distinct qualifying tracks a listener played per album and compare with the album's track count.",
      "Filter out plays under 30 seconds before counting, and count tracks, not plays — replays do not fill a gap.",
    ],
    editorial: [
      "\"Every track on the album\" makes this **relational division**. The counting form is the most common: keep plays of at least 30 seconds, group by listener and album, and count the **distinct** tracks played. The listener completed the album when that count equals the album's number of tracks.",
      "",
      "Both details matter. Without `DISTINCT`, listener 8's two plays of track 21 would make the two-track album look complete after one track — here it really is complete, but the count must not depend on replays. And the 30-second filter must come before counting: listener 8 played Monsoon Letters' third track for only 29,999 ms, so that album is not complete, while listener 7's plays of exactly 30,000 ms do count. The one-track album completes with a single qualifying play.",
      "",
      "The double `NOT EXISTS` alternative states the definition literally: there is no track on the album that the listener did not play for 30 seconds. It relies on every album having a track; on an empty album it would be vacuously true, while the counting form would never return it. The counting form is two aggregations; the nested anti-join probes plays per (listener, album, track) and wants an index on `(listener_id, track_id)`.",
    ].join("\n"),
  },

  {
    slug: "spotify-featured-artist-credits-per-label",
    title: "Spotify: Featured-Artist Credits in Track Titles per Label",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Joins"],
    description: [
      "Labels deliver track metadata to Spotify with featured artists written into the title, like `Golden Hour (feat. Dusk Riders)`. The content-operations team audits each label's deliveries. A **featured credit** is one occurrence of the exact text `(feat. ` (open bracket, `feat.`, space) in `title` — a word like `Defeat.` is not a credit. The `artists` column lists every credited artist, separated by `, ` (comma and space).",
      "",
      "A track has a **credit mismatch** when its title names **more** featured credits than there are credited artists besides the first one (that is, more than the number of artists in `artists` minus 1).",
      "",
      "For every label with at least one track, return `label_name`, `tracks`, `feat_credits` (featured credits across all its titles) and `credit_mismatches` (tracks with a mismatch). Order by `feat_credits` from most to fewest, then by `label_name`.",
    ].join("\n"),
    tables: [
      {
        name: "RecordLabel",
        columns: [
          { name: "label_id", type: "int" },
          { name: "label_name", type: "varchar" },
        ],
        primaryKey: ["label_id"],
        note: "One row per label or distributor delivering music; names are unique.",
      },
      {
        name: "TrackDelivery",
        columns: [
          { name: "track_id", type: "int" },
          { name: "label_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "artists", type: "varchar" },
        ],
        primaryKey: ["track_id"],
        note: "One row per delivered track. `artists` is never empty, never has a trailing separator, and no artist name contains a comma; all text is plain ASCII.",
      },
    ],
    examples: [
      {
        RecordLabel: [
          [1, "Saffron Records"],
          [2, "Neon Coast Music"],
          [3, "Ghats Independent"],
          [4, "Monsoon Sound"],
        ],
        TrackDelivery: [
          [1, 1, "Monsoon Letters (feat. Kavya Rao)", "Aurora Lanes, Kavya Rao"],
          [2, 1, "Golden Hour (feat. Dusk Riders) (feat. Echo Harbour)", "Aurora Lanes, Dusk Riders, Echo Harbour"],
          [3, 1, "Paper Planes", "Aurora Lanes"],
          [4, 2, "Chasing Neon (feat. Coral Static)", "Bombay Bassline"],
          [5, 2, "Static Hearts (feat. Kavya Rao & Indigo Tides)", "Bombay Bassline, Kavya Rao, Indigo Tides"],
          [6, 2, "Sweet Defeat. Again", "Bombay Bassline"],
          [7, 3, "Quiet Storm", "Hampi Nights, Lunar Rickshaw"],
          [8, 3, "Rooftop Echo (feat. Juhu Satellites) (feat. Firefly Theory)", "Hampi Nights, Juhu Satellites"],
        ],
      },
    ],
    gen: (rng) => {
      const labelNames = ["Saffron Records", "Neon Coast Music", "Ghats Independent", "Monsoon Sound", "Bassline Collective"];
      const nl = ri(rng, 1, 4);
      const labels: Cell[][] = sample(rng, labelNames, nl).map((n, i) => [i + 1, n]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const main = pick(rng, ARTISTS);
        const guests = sample(rng, ARTISTS.filter((a) => a !== main), ri(rng, 0, 3));
        // How many guests make it into the title, and how many into the artists list, vary on purpose.
        const inTitle = guests.slice(0, chance(rng, 0.7) ? guests.length : ri(rng, 0, guests.length));
        const credited = chance(rng, 0.7) ? guests : guests.slice(0, ri(rng, 0, guests.length));
        let title: string = pick(rng, TRACK_TITLES);
        if (chance(rng, 0.15)) title = `${title} Defeat.`;
        for (const g of inTitle) title += ` (feat. ${g})`;
        return [id, ri(rng, 1, nl), title, [main, ...credited].join(", ")];
      });
      return { RecordLabel: labels, TrackDelivery: rows };
    },
    solution: [
      "WITH counted AS (",
      "  SELECT label_id,",
      "         (LENGTH(title) - LENGTH(REPLACE(title, '(feat. ', ''))) / LENGTH('(feat. ') AS feats,",
      "         (LENGTH(artists) - LENGTH(REPLACE(artists, ', ', ''))) / LENGTH(', ') AS guests_credited",
      "  FROM TrackDelivery",
      ")",
      "SELECT l.label_name, COUNT(*) AS tracks, SUM(c.feats) AS feat_credits,",
      "       SUM(CASE WHEN c.feats > c.guests_credited THEN 1 ELSE 0 END) AS credit_mismatches",
      "FROM counted c",
      "JOIN RecordLabel l ON l.label_id = c.label_id",
      "GROUP BY l.label_id, l.label_name",
      "ORDER BY feat_credits DESC, l.label_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.label_name, COUNT(*) AS tracks,",
        "       SUM(CHAR_LENGTH(t.title) - CHAR_LENGTH(REPLACE(t.title, '(feat. ', '(feat.'))) AS feat_credits,",
        "       SUM(IF(CHAR_LENGTH(t.title) - CHAR_LENGTH(REPLACE(t.title, '(feat. ', '(feat.'))",
        "              > CHAR_LENGTH(t.artists) - CHAR_LENGTH(REPLACE(t.artists, ',', '')), 1, 0)) AS credit_mismatches",
        "FROM TrackDelivery t",
        "JOIN RecordLabel l ON l.label_id = t.label_id",
        "GROUP BY l.label_id, l.label_name",
        "ORDER BY feat_credits DESC, l.label_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Removing every occurrence of a pattern shortens the text by (occurrences × pattern length).",
      "So `(LENGTH(s) - LENGTH(REPLACE(s, p, ''))) / LENGTH(p)` counts how many times `p` occurs in `s`.",
      "Count `(feat. ` with its bracket so `Defeat.` is not a credit; count the `, ` separators in `artists` — the artists besides the first equal the number of separators.",
      "Aggregate per label, and compare the two counts per track inside a conditional SUM.",
    ],
    editorial: [
      "SQL has no `COUNT_OCCURRENCES` function, but `REPLACE` gives one. Deleting every copy of a pattern `p` from `s` shortens it by `LENGTH(p)` characters per copy, so `(LENGTH(s) − LENGTH(REPLACE(s, p, ''))) / LENGTH(p)` is the number of copies. Here `p` is `(feat. `, seven characters: Golden Hour's title loses fourteen, so it has two credits.",
      "",
      "Choosing the pattern is the real decision. Searching for plain `feat.` would count `Sweet Defeat. Again` as a featured credit; including the opening bracket and the trailing space matches only the credit format. For the credited artists, count the `, ` separators the same way: with no trailing separator, the number of artists besides the first one is exactly the number of separators.",
      "",
      "A mismatch is a title naming more guests than are credited: Chasing Neon names one guest with none credited, and Rooftop Echo names two with one credited. Static Hearts names two artists inside one `(feat. …)`, which is one credit by this rule, and credits both — not a mismatch. Per label, `COUNT(*)`, `SUM(feats)` and a conditional `SUM` give the three columns; labels without deliveries never join.",
      "",
      "The alternative uses a neat variant: replace `(feat. ` with `(feat.` — one character shorter — so the length difference *is* the count with no division, and counts single commas in `artists` (names contain no commas). Both are one scan of the deliveries.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "spotify-artists-growing-year-over-year-in-every-market",
    title: "Spotify: Artists Growing Year Over Year in Every Market",
    difficulty: "HARD",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "The artist-growth team wants a list of artists whose growth is broad, not carried by one country. It compares the **first half** of each year: H1 2023 is 2023-01-01 to 2023-06-30 and H1 2024 is 2024-01-01 to 2024-06-30, both inclusive. Rows outside those two windows are ignored.",
      "",
      "Per artist and market, add up the streams in each window. A market where the artist had streams in H1 2023 is a **2023 market**; one with streams in H1 2024 but none in H1 2023 is a **new market**. An artist qualifies when they have **at least two** 2023 markets and **every** 2023 market grew — H1 2024 streams **strictly greater** than H1 2023 (a market with no H1 2024 streams has 0, so it shrank).",
      "",
      "Return each qualifying artist with the columns `artist_name`, `markets_2023`, `new_markets`, `streams_2023` and `streams_2024` (the artist's H1 totals across all markets). Order by `artist_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist; names are unique.",
      },
      {
        name: "DailyArtistStreams",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "market", type: "char" },
          { name: "stream_date", type: "date" },
          { name: "streams", type: "int" },
        ],
        primaryKey: ["artist_id", "market", "stream_date"],
        note: "An artist's streams in one market on one day. Days with no streams have no row, so `streams` is always at least 1.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes"],
          [2, "Bombay Bassline"],
          [3, "Coral Static"],
          [4, "Dusk Riders"],
          [5, "Echo Harbour"],
        ],
        DailyArtistStreams: [
          [1, "IN", "2023-02-10", 600], [1, "IN", "2023-05-01", 400], [1, "IN", "2024-03-03", 1500],
          [1, "US", "2023-06-30", 400], [1, "US", "2024-01-01", 900], [1, "BR", "2024-04-12", 300],
          [2, "IN", "2023-03-15", 800], [2, "IN", "2024-03-15", 1200],
          [2, "GB", "2023-04-04", 500], [2, "GB", "2024-04-04", 500],
          [3, "IN", "2023-01-20", 300], [3, "IN", "2024-01-20", 600], [3, "US", "2024-02-02", 250],
          [4, "IN", "2023-02-01", 700], [4, "IN", "2024-02-01", 900],
          [4, "US", "2023-03-09", 200], [4, "US", "2024-07-02", 5000],
          [5, "DE", "2023-06-01", 100], [5, "DE", "2024-02-29", 150],
          [5, "ID", "2023-01-01", 120], [5, "ID", "2024-06-30", 130],
          [5, "GB", "2023-07-15", 90],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 2, 4);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a]);
      const rows: Cell[][] = [];
      const days23 = ["2023-01-01", "2023-02-14", "2023-03-31", "2023-05-20", "2023-06-30"];
      const days24 = ["2024-01-01", "2024-02-29", "2024-04-15", "2024-05-05", "2024-06-30"];
      const outside = ["2022-12-31", "2023-07-01", "2023-12-31", "2024-07-01"];
      const put = (artist: number, market: string, days: readonly string[], total: number) => {
        if (total <= 0) return;
        if (total > 1 && chance(rng, 0.35)) {
          const [d1, d2] = sample(rng, days, 2);
          const part = ri(rng, 1, total - 1);
          rows.push([artist, market, d1!, part], [artist, market, d2!, total - part]);
        } else rows.push([artist, market, pick(rng, days), total]);
      };
      for (const a of artists) {
        const grower = chance(rng, 0.6);
        for (const m of sample(rng, MARKETS, ri(rng, 2, 3))) {
          const s23 = chance(rng, 0.15) ? 0 : ri(rng, 1, 20) * 50;
          const s24 = grower
            ? (chance(rng, 0.1) ? s23 : s23 + ri(rng, 1, 20) * 50)
            : (chance(rng, 0.2) ? 0 : ri(rng, 1, 20) * 50);
          put(a[0] as number, m, days23, s23);
          put(a[0] as number, m, days24, s24);
          if (chance(rng, 0.2)) rows.push([a[0]!, m, pick(rng, outside), ri(rng, 1, 40) * 50]);
        }
      }
      // The same (artist, market, day) can only appear once.
      const seen = new Set<string>();
      const unique = rows.filter((r) => {
        const k = `${r[0]}|${r[1]}|${r[2]}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return { Artist: artists, DailyArtistStreams: shuffle(rng, unique) };
    },
    solution: [
      "WITH per_market AS (",
      "  SELECT artist_id, market,",
      "         SUM(CASE WHEN stream_date BETWEEN '2023-01-01' AND '2023-06-30' THEN streams ELSE 0 END) AS s23,",
      "         SUM(CASE WHEN stream_date BETWEEN '2024-01-01' AND '2024-06-30' THEN streams ELSE 0 END) AS s24",
      "  FROM DailyArtistStreams",
      "  GROUP BY artist_id, market",
      ")",
      "SELECT a.artist_name,",
      "       SUM(CASE WHEN pm.s23 > 0 THEN 1 ELSE 0 END) AS markets_2023,",
      "       SUM(CASE WHEN pm.s23 = 0 AND pm.s24 > 0 THEN 1 ELSE 0 END) AS new_markets,",
      "       SUM(pm.s23) AS streams_2023,",
      "       SUM(pm.s24) AS streams_2024",
      "FROM per_market pm",
      "JOIN Artist a ON a.artist_id = pm.artist_id",
      "GROUP BY a.artist_id, a.artist_name",
      "HAVING SUM(CASE WHEN pm.s23 > 0 THEN 1 ELSE 0 END) >= 2",
      "   AND SUM(CASE WHEN pm.s23 > 0 AND pm.s24 <= pm.s23 THEN 1 ELSE 0 END) = 0",
      "ORDER BY a.artist_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH y AS (SELECT artist_id, market, YEAR(stream_date) AS yr, SUM(streams) AS s",
        "           FROM DailyArtistStreams",
        "           WHERE YEAR(stream_date) IN (2023, 2024) AND MONTH(stream_date) <= 6",
        "           GROUP BY artist_id, market, YEAR(stream_date)),",
        "m AS (SELECT DISTINCT artist_id, market FROM y)",
        "SELECT a.artist_name,",
        "       COUNT(o.s) AS markets_2023,",
        "       SUM(CASE WHEN o.s IS NULL THEN 1 ELSE 0 END) AS new_markets,",
        "       COALESCE(SUM(o.s), 0) AS streams_2023,",
        "       COALESCE(SUM(n.s), 0) AS streams_2024",
        "FROM m",
        "JOIN Artist a ON a.artist_id = m.artist_id",
        "LEFT JOIN y o ON o.artist_id = m.artist_id AND o.market = m.market AND o.yr = 2023",
        "LEFT JOIN y n ON n.artist_id = m.artist_id AND n.market = m.market AND n.yr = 2024",
        "GROUP BY a.artist_id, a.artist_name",
        "HAVING COUNT(o.s) >= 2",
        "   AND SUM(CASE WHEN o.s IS NOT NULL AND COALESCE(n.s, 0) <= o.s THEN 1 ELSE 0 END) = 0",
        "ORDER BY a.artist_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pivot first: one row per artist and market, with an H1 2023 total and an H1 2024 total side by side (`SUM(CASE WHEN … THEN streams ELSE 0 END)`).",
      "\"Every 2023 market grew\" is \"no 2023 market failed to grow\": count the failures and require 0.",
      "A 2023 market missing from H1 2024 has a 2024 total of 0 in the pivot — it must count as a failure, not vanish.",
      "Then a second level of aggregation per artist gives the counts and the totals.",
    ],
    editorial: [
      "A year-over-year comparison needs the two years **side by side** in one row, and conditional aggregation is the pivot that puts them there. Grouping the daily rows by artist and market, `SUM(CASE WHEN stream_date BETWEEN '2023-01-01' AND '2023-06-30' THEN streams ELSE 0 END)` is the H1 2023 total and the same with the 2024 window the H1 2024 total. Rows outside both windows contribute 0 to each, so Echo Harbour's July 2023 row in GB makes GB neither a 2023 market nor a new one. The windows are inclusive: 30 June and 1 January count, and 29 February 2024 is just another H1 day.",
      "",
      "The second level groups those pairs per artist. A 2023 market is one with `s23 > 0`; a new market has `s23 = 0` and `s24 > 0`. The universal condition \"every 2023 market grew\" becomes a count of counterexamples that must be zero: `SUM(CASE WHEN s23 > 0 AND s24 <= s23 THEN 1 ELSE 0 END) = 0`. Equal streams are not growth (Bombay Bassline's GB), and a market that went silent in H1 2024 has `s24 = 0` and fails — Dusk Riders' only 2024 US streams came in July. Coral Static grew, but in a single 2023 market, short of the two required. Aurora Lanes (two growing markets and a new one in BR) and Echo Harbour qualify.",
      "",
      "The alternative aggregates by `YEAR()` first and rebuilds the side-by-side shape with two LEFT JOINs from the distinct artist–market pairs, treating a missing year as NULL. It must remember that a missing 2024 is a fall (`COALESCE(n.s, 0)`). The pivot reads the table once and needs no join, which is why it is the usual way to write period-over-period reports.",
    ].join("\n"),
  },

  {
    slug: "spotify-podcast-episode-to-episode-retention",
    title: "Spotify: Podcast Episode-to-Episode Listener Retention",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "Podcast creators on Spotify want to know where a series loses its audience. For an episode `n` of a show, its **listeners** are the distinct listeners who played it, and its **retention** is the share of them who also played episode `n + 1` of the same show — at any time, before or after.",
      "",
      "Return one row for every episode that has **at least one listener** and **a next episode** in its show, with the columns `show_name`, `episode_no`, `listeners` and `retained_pct` — retained listeners as a percentage of `listeners`, **rounded to 2 decimal places**. The last episode of a show has no next one and is left out. Order by `show_name`, then `episode_no`.",
    ].join("\n"),
    tables: [
      {
        name: "PodcastShow",
        columns: [
          { name: "show_id", type: "int" },
          { name: "show_name", type: "varchar" },
        ],
        primaryKey: ["show_id"],
        note: "One row per show; names are unique.",
      },
      {
        name: "Episode",
        columns: [
          { name: "episode_id", type: "int" },
          { name: "show_id", type: "int" },
          { name: "episode_no", type: "int" },
        ],
        primaryKey: ["episode_id"],
        note: "A show's episodes are numbered 1, 2, 3, … with no gaps.",
      },
      {
        name: "EpisodePlay",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "episode_id", type: "int" },
          { name: "played_on", type: "date" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play; a listener may play an episode several times.",
      },
    ],
    examples: [
      {
        PodcastShow: [
          [1, "Founders Unfiltered"],
          [2, "Cricket After Hours"],
        ],
        Episode: [
          [11, 1, 1], [12, 1, 2], [13, 1, 3],
          [21, 2, 1], [22, 2, 2],
        ],
        EpisodePlay: [
          [1, 100, 11, "2024-04-01"], [2, 101, 11, "2024-04-02"], [3, 102, 11, "2024-04-02"], [4, 100, 11, "2024-04-09"],
          [5, 100, 12, "2024-04-10"], [6, 102, 12, "2024-04-01"], [7, 103, 12, "2024-04-05"],
          [8, 103, 13, "2024-04-20"], [9, 101, 13, "2024-04-21"],
          [10, 100, 22, "2024-05-01"], [11, 104, 21, "2024-05-02"],
        ],
      },
    ],
    gen: (rng) => {
      const ns = ri(rng, 1, 3);
      const shows: Cell[][] = sample(rng, SHOWS, ns).map((s, i) => [i + 1, s]);
      const eps: Cell[][] = [];
      for (const s of shows) for (const n of seq(1, ri(rng, 1, 5))) eps.push([(s[0] as number) * 10 + n, s[0]!, n]);
      const plays: Cell[][] = [];
      for (const listener of seq(100, ri(rng, 2, 7))) {
        for (const s of shows) {
          if (chance(rng, 0.3)) continue;
          const mine = eps.filter((e) => e[1] === s[0]);
          let n = chance(rng, 0.75) ? 1 : ri(rng, 1, mine.length);
          while (n <= mine.length) {
            const e = mine[n - 1]!;
            plays.push([0, listener, e[0]!, dateBetween(rng, "2024-04-01", "2024-06-30")]);
            if (chance(rng, 0.15)) plays.push([0, listener, e[0]!, dateBetween(rng, "2024-04-01", "2024-06-30")]);
            if (!chance(rng, 0.65)) break;
            n += chance(rng, 0.15) ? 2 : 1;
          }
        }
      }
      shuffle(rng, plays).forEach((p, i) => (p[0] = i + 1));
      return { PodcastShow: shows, Episode: eps, EpisodePlay: plays };
    },
    solution: [
      "WITH heard AS (",
      "  SELECT DISTINCT p.listener_id, e.show_id, e.episode_no",
      "  FROM EpisodePlay p",
      "  JOIN Episode e ON e.episode_id = p.episode_id",
      ")",
      "SELECT s.show_name, h.episode_no, COUNT(*) AS listeners,",
      "       ROUND(100 * COUNT(n.listener_id) / COUNT(*), 2) AS retained_pct",
      "FROM heard h",
      "JOIN PodcastShow s ON s.show_id = h.show_id",
      "LEFT JOIN heard n",
      "  ON n.listener_id = h.listener_id AND n.show_id = h.show_id AND n.episode_no = h.episode_no + 1",
      "WHERE EXISTS (SELECT 1 FROM Episode x WHERE x.show_id = h.show_id AND x.episode_no = h.episode_no + 1)",
      "GROUP BY s.show_id, s.show_name, h.episode_no",
      "ORDER BY s.show_name, h.episode_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.show_name, e.episode_no,",
        "       COUNT(DISTINCT p.listener_id) AS listeners,",
        "       ROUND(100 * COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM EpisodePlay p2 WHERE p2.listener_id = p.listener_id AND p2.episode_id = nx.episode_id)",
        "                                  THEN p.listener_id END) / COUNT(DISTINCT p.listener_id), 2) AS retained_pct",
        "FROM Episode e",
        "JOIN Episode nx ON nx.show_id = e.show_id AND nx.episode_no = e.episode_no + 1",
        "JOIN EpisodePlay p ON p.episode_id = e.episode_id",
        "JOIN PodcastShow s ON s.show_id = e.show_id",
        "GROUP BY s.show_id, s.show_name, e.episode_id, e.episode_no",
        "ORDER BY s.show_name, e.episode_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the plays to one row per listener and episode first — replays must not count twice.",
      "Pair each (listener, episode n) with the same listener's (episode n + 1) through a LEFT JOIN; unmatched means not retained.",
      "Leave out episodes with no next episode in their show — check the `Episode` table, not the plays, because nobody may have played the next one.",
    ],
    editorial: [
      "Start by reducing the plays to the set of **(listener, show, episode number)** facts with `SELECT DISTINCT`. Listener 100 played episode 1 twice; counted as plays, that would inflate both the denominator and the numerator.",
      "",
      "Retention is then a self join of that set: each fact for episode `n` looks for the same listener's fact for episode `n + 1` of the same show. A `LEFT JOIN` keeps the facts that find no partner, so per episode `COUNT(*)` is the number of listeners and `COUNT(n.listener_id)` the number retained. The order of plays in time is irrelevant — listener 102 played episode 2 before episode 1 and still counts as retained.",
      "",
      "Which episodes qualify is decided by the catalogue, not the plays: an episode is left out only when its show has no episode `n + 1` (the `EXISTS` on `Episode`). If the next episode exists but nobody played it, the episode stays with 0% — the clearest drop-off of all. In the example Founders Unfiltered keeps 2 of 3 listeners from episode 1 to 2 (66.67%) and 1 of 3 from 2 to 3; Cricket After Hours keeps neither of its episode-1 listeners. The alternative joins each episode to its successor up front and tests retention per play with a correlated `EXISTS` inside a conditional `COUNT(DISTINCT …)`.",
    ].join("\n"),
  },

  {
    slug: "spotify-family-plans-over-six-members-at-once",
    title: "Spotify: Family Plans That Ever Had Over Six Members at Once",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "A Premium Family plan has six seats, but a billing bug let some plans add members while full. To size the fix, the subscriptions team replays membership history. A membership counts from `joined_on` **up to but not including** `left_on`; a NULL `left_on` means the person is still on the plan. Someone who leaves and a new member who joins on the same day never overlap.",
      "",
      "Return every plan whose number of simultaneous members was **ever more than 6**, with the columns `plan_id`, `peak_members` (the largest number of members on any single day) and `first_day_over` (the first date on which the plan had more than 6 members). Order by `plan_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FamilyMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "plan_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_on", type: "date" },
          { name: "left_on", type: "date" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per stint of a user on a Family plan; `left_on` is after `joined_on`, or NULL while the stint is ongoing. A user can have several stints.",
      },
    ],
    examples: [
      {
        FamilyMembership: [
          [1, 1, 11, "2024-01-01", null],
          [2, 1, 12, "2024-01-01", null],
          [3, 1, 13, "2024-01-05", null],
          [4, 1, 14, "2024-01-10", "2024-03-01"],
          [5, 1, 15, "2024-02-01", null],
          [6, 1, 16, "2024-02-10", null],
          [7, 1, 17, "2024-03-01", null],
          [8, 1, 18, "2024-03-01", "2024-03-20"],
          [9, 2, 21, "2024-01-01", null],
          [10, 2, 22, "2024-01-01", null],
          [11, 2, 23, "2024-01-01", "2024-02-01"],
          [12, 2, 24, "2024-01-15", null],
          [13, 2, 25, "2024-01-20", null],
          [14, 2, 26, "2024-01-25", null],
          [15, 2, 27, "2024-02-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const plan of seq(1, ri(rng, 1, 3))) {
        const k = ri(rng, 5, 11);
        for (const u of seq(1, k)) {
          const joined = dateBetween(rng, "2024-01-01", "2024-06-30");
          const left = chance(rng, 0.55) ? null : addDays(joined, chance(rng, 0.2) ? 1 : ri(rng, 10, 150));
          rows.push([id++, plan, plan * 100 + u, joined, left]);
        }
        // Now and then a hand-over on one day: someone leaves the day another joins.
        if (chance(rng, 0.4)) {
          const d = dateBetween(rng, "2024-02-01", "2024-05-31");
          rows.push([id++, plan, plan * 100 + 50, addDays(d, -20), d]);
          rows.push([id++, plan, plan * 100 + 51, d, null]);
        }
      }
      return { FamilyMembership: shuffle(rng, rows) };
    },
    solution: [
      "WITH events AS (",
      "  SELECT plan_id, joined_on AS d, 1 AS delta FROM FamilyMembership",
      "  UNION ALL",
      "  SELECT plan_id, left_on AS d, -1 AS delta FROM FamilyMembership WHERE left_on IS NOT NULL",
      "), daily AS (",
      "  SELECT plan_id, d, SUM(delta) AS delta",
      "  FROM events",
      "  GROUP BY plan_id, d",
      "), running AS (",
      "  SELECT plan_id, d, SUM(delta) OVER (PARTITION BY plan_id ORDER BY d) AS members",
      "  FROM daily",
      ")",
      "SELECT plan_id, MAX(members) AS peak_members,",
      "       MIN(CASE WHEN members > 6 THEN d END) AS first_day_over",
      "FROM running",
      "GROUP BY plan_id",
      "HAVING MAX(members) > 6",
      "ORDER BY plan_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT plan_id, MAX(c) AS peak_members, MIN(CASE WHEN c > 6 THEN joined_on END) AS first_day_over",
        "FROM (SELECT f.plan_id, f.joined_on,",
        "             (SELECT COUNT(*) FROM FamilyMembership g",
        "              WHERE g.plan_id = f.plan_id AND g.joined_on <= f.joined_on",
        "                AND (g.left_on IS NULL OR g.left_on > f.joined_on)) AS c",
        "      FROM FamilyMembership f) x",
        "GROUP BY plan_id",
        "HAVING MAX(c) > 6",
        "ORDER BY plan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each membership into two events: +1 on `joined_on`, −1 on `left_on` (when there is one).",
      "Net the events of the same plan and day before taking a running total, so a leave and a join on one day cancel out.",
      "A running `SUM(delta)` in date order is the head count from that day on; its maximum is the peak.",
      "The count can only go up on a join day, so checking the join days alone is enough.",
    ],
    editorial: [
      "Counting overlapping intervals is a **sweep line**. Each membership becomes a +1 event on its join date and, if it ended, a −1 event on its leave date. Sorted by date, the running sum of the events is the number of members from that day until the next event, so the peak is the maximum running sum and the first day over six is the earliest date whose running sum exceeds 6.",
      "",
      "Same-day events need care. The statement makes `left_on` exclusive, so a member leaving on 1 March and another joining on 1 March are never on the plan together. Netting the deltas per `(plan_id, day)` before the running total implements exactly that — plan 2's member 23 leaves on 1 February as member 27 joins, and the count stays at 6, so plan 2 never goes over. Without the netting a window ordered by date alone would process the two events in an arbitrary order and could report a phantom 7. Plan 1 reaches six on 10 February, and on 1 March two people join while one leaves, taking it to 7 — its first day over.",
      "",
      "The alternative uses the observation that the head count rises only on join days: for every join date it counts the stints active on that day with a correlated subquery. That is quadratic per plan, while the sweep is one sort of the events.",
    ].join("\n"),
  },

  {
    slug: "spotify-weekly-top-three-chart-movement",
    title: "Spotify: Weekly Top 3 Chart With New, Re-Entry, Up and Down Labels",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "Spotify's charts team publishes a weekly chart, and every entry carries a movement label next to its position. A week's chart is its **top 3 tracks by `streams`**; when two tracks have the same streams, the lower `track_id` ranks higher. Positions are 1, 2 and 3.",
      "",
      "Label each chart entry by comparing it with the chart of the week **exactly 7 days earlier**:",
      "",
      "- `NEW` — the track has never been on any earlier week's chart;",
      "- `RE-ENTRY` — it was on an earlier chart, but not on the previous week's;",
      "- `UP n` / `DOWN n` — it was on the previous week's chart, and has moved up or down `n` places (for example `UP 1`, `DOWN 2`);",
      "- `SAME` — it holds the position it had the previous week.",
      "",
      "Return every chart entry of every week, with the columns `week_start`, `chart_pos`, `title` and `movement`. Order by `week_start`, then `chart_pos`.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track.",
      },
      {
        name: "WeeklyStreams",
        columns: [
          { name: "week_start", type: "date" },
          { name: "track_id", type: "int" },
          { name: "streams", type: "int" },
        ],
        primaryKey: ["week_start", "track_id"],
        note: "A track's total streams in the chart week starting on `week_start` (always a Monday). A track with no streams that week has no row.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters"],
          [2, "Chasing Neon"],
          [3, "Paper Planes"],
          [4, "Golden Hour"],
          [5, "Quiet Storm"],
        ],
        WeeklyStreams: [
          ["2024-03-04", 1, 9000], ["2024-03-04", 2, 7000], ["2024-03-04", 3, 5000], ["2024-03-04", 4, 1000],
          ["2024-03-11", 2, 9500], ["2024-03-11", 1, 8000], ["2024-03-11", 4, 6000], ["2024-03-11", 3, 2000],
          ["2024-03-18", 2, 9000], ["2024-03-18", 3, 7000], ["2024-03-18", 4, 7000], ["2024-03-18", 1, 3000], ["2024-03-18", 5, 500],
          ["2024-03-25", 5, 12000], ["2024-03-25", 1, 8000], ["2024-03-25", 2, 8000], ["2024-03-25", 3, 100],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 3, 7);
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t]);
      const rows: Cell[][] = [];
      const weeks = ri(rng, 2, 6);
      for (let w = 0; w < weeks; w++) {
        // Now and then a week with no data at all, so the next week has no previous chart.
        if (w > 0 && chance(rng, 0.1)) continue;
        const week = addDays("2024-03-04", 7 * w);
        for (const t of seq(1, nt)) if (chance(rng, 0.8)) rows.push([week, t, ri(rng, 1, 16) * 500]);
      }
      return { Track: tracks, WeeklyStreams: shuffle(rng, rows) };
    },
    solution: [
      "WITH chart AS (",
      "  SELECT week_start, track_id,",
      "         ROW_NUMBER() OVER (PARTITION BY week_start ORDER BY streams DESC, track_id) AS pos",
      "  FROM WeeklyStreams",
      "), top3 AS (",
      "  SELECT week_start, track_id, pos FROM chart WHERE pos <= 3",
      ")",
      "SELECT c.week_start, c.pos AS chart_pos, t.title,",
      "       CASE",
      "         WHEN p.pos IS NULL THEN",
      "           CASE WHEN EXISTS (SELECT 1 FROM top3 e WHERE e.track_id = c.track_id AND e.week_start < c.week_start)",
      "                THEN 'RE-ENTRY' ELSE 'NEW' END",
      "         WHEN p.pos > c.pos THEN CONCAT('UP ', p.pos - c.pos)",
      "         WHEN p.pos < c.pos THEN CONCAT('DOWN ', c.pos - p.pos)",
      "         ELSE 'SAME'",
      "       END AS movement",
      "FROM top3 c",
      "JOIN Track t ON t.track_id = c.track_id",
      "LEFT JOIN top3 p ON p.track_id = c.track_id AND p.week_start = DATE_SUB(c.week_start, INTERVAL 7 DAY)",
      "ORDER BY c.week_start, c.pos",
    ].join("\n"),
    alternatives: [
      [
        "WITH top3 AS (SELECT week_start, track_id, pos FROM (SELECT week_start, track_id,",
        "                RANK() OVER (PARTITION BY week_start ORDER BY streams DESC, track_id) AS pos FROM WeeklyStreams) r WHERE pos <= 3),",
        "history AS (SELECT week_start, track_id, pos,",
        "                   LAG(week_start) OVER (PARTITION BY track_id ORDER BY week_start) AS prev_week,",
        "                   LAG(pos) OVER (PARTITION BY track_id ORDER BY week_start) AS prev_pos",
        "            FROM top3)",
        "SELECT h.week_start, h.pos AS chart_pos, t.title,",
        "       CASE WHEN h.prev_week IS NULL THEN 'NEW'",
        "            WHEN DATEDIFF(h.week_start, h.prev_week) > 7 THEN 'RE-ENTRY'",
        "            WHEN h.prev_pos > h.pos THEN CONCAT('UP ', h.prev_pos - h.pos)",
        "            WHEN h.prev_pos < h.pos THEN CONCAT('DOWN ', h.pos - h.prev_pos)",
        "            ELSE 'SAME' END AS movement",
        "FROM history h JOIN Track t ON t.track_id = h.track_id",
        "ORDER BY h.week_start, h.pos",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build each week's chart: number the tracks of a week by streams descending, `track_id` ascending, and keep positions 1–3.",
      "The previous week is `DATE_SUB(week_start, INTERVAL 7 DAY)` — not simply the last week that has data.",
      "Telling NEW from RE-ENTRY needs the whole chart history, not just last week: did the track chart on any earlier week?",
      "Subtract positions only in the direction that is positive (MySQL's ROW_NUMBER is unsigned).",
    ],
    editorial: [
      "Build the chart first. `ROW_NUMBER() OVER (PARTITION BY week_start ORDER BY streams DESC, track_id)` numbers each week's tracks, and the tie-break inside the window makes the positions unique — on 18 March Paper Planes and Golden Hour both have 7,000 streams, and the lower id takes position 2. Keeping `pos <= 3` gives the chart, which is the only thing compared from here on: a track that ranked 4th last week was *not* on last week's chart.",
      "",
      "Then label each entry. A `LEFT JOIN` of the chart to itself on the same track and `week_start` exactly seven days earlier finds last week's position. If it exists, compare: a smaller number now is a climb (`UP n`, with `n = previous − current`), a larger one a fall, equal is `SAME`. If it does not, the entry is either a debut or a comeback, and only the full history can tell: `EXISTS` an earlier chart row of the track means `RE-ENTRY`, otherwise `NEW`. Monsoon Letters charts in weeks 1 and 2, drops out in week 3 and comes back in week 4 as `RE-ENTRY`; Quiet Storm's first chart is week 4, so it is `NEW` even though it had streams in week 3.",
      "",
      "Two MySQL details: `ROW_NUMBER()` is unsigned, so each `CASE` branch subtracts only in the positive direction, and `CONCAT('UP ', n)` turns the number into text. The alternative walks each track's own chart history with `LAG` — its previous chart week and position — and calls a gap of more than seven days a re-entry; it uses `RANK()`, which equals `ROW_NUMBER()` here because the tie-break makes every position unique. Both sort the weekly rows once per window.",
    ].join("\n"),
  },

  {
    slug: "spotify-pro-rata-royalty-pool-payouts",
    title: "Spotify: Pro-Rata Royalty Pool Payouts for June 2024",
    difficulty: "HARD",
    topics: ["Aggregation", "Joins", "Window Functions"],
    description: [
      "In a **pro-rata** royalty model, each market's royalty pool for the month is shared among artists in proportion to their share of that market's royalty-bearing streams. A stream bears royalties when it was played for **at least 30 seconds** and is dated in **June 2024**. An artist's payout from a market is `pool_inr × (artist's royalty-bearing streams there) / (all royalty-bearing streams there)`, and their total payout is the sum over markets. A market with streams but no pool row pays nothing; a pool with no royalty-bearing streams pays no one.",
      "",
      "Return every artist with a payout, with the columns `artist_name` and `payout_inr` — the total, **rounded to 2 decimal places** only at the end. Order by `payout_inr` from highest to lowest, then by `artist_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist; names are unique.",
      },
      {
        name: "RoyaltyPool",
        columns: [
          { name: "market", type: "char" },
          { name: "pool_inr", type: "int" },
        ],
        primaryKey: ["market"],
        note: "The June 2024 royalty pool of each market, in rupees.",
      },
      {
        name: "StreamLog",
        columns: [
          { name: "stream_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "market", type: "char" },
          { name: "streamed_on", type: "date" },
          { name: "ms_played", type: "int" },
        ],
        primaryKey: ["stream_id"],
        note: "One row per stream, credited to the track's main artist, with the market it was played in.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Aurora Lanes"],
          [2, "Bombay Bassline"],
          [3, "Coral Static"],
          [4, "Dusk Riders"],
        ],
        RoyaltyPool: [
          ["IN", 90000],
          ["US", 60000],
          ["GB", 40000],
        ],
        StreamLog: [
          [1, 1, "IN", "2024-06-01", 200000],
          [2, 1, "IN", "2024-06-15", 31000],
          [3, 2, "IN", "2024-06-30", 30000],
          [4, 2, "IN", "2024-06-30", 29000],
          [5, 1, "US", "2024-06-04", 120000],
          [6, 3, "US", "2024-06-09", 150000],
          [7, 3, "US", "2024-07-01", 150000],
          [8, 4, "BR", "2024-06-12", 180000],
          [9, 3, "US", "2024-05-31", 200000],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 2, 6);
      const artists: Cell[][] = sample(rng, ARTISTS, na).map((a, i) => [i + 1, a]);
      const markets = sample(rng, MARKETS, ri(rng, 2, 4));
      const pools: Cell[][] = markets.filter(() => chance(rng, 0.85)).map((m) => [m, ri(rng, 3, 30) * 10000]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 30);
      const streams: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, na),
        pick(rng, markets),
        chance(rng, 0.15) ? pick(rng, ["2024-05-31", "2024-06-01", "2024-06-30", "2024-07-01"]) : dateBetween(rng, "2024-06-01", "2024-06-30"),
        chance(rng, 0.2) ? pick(rng, [29999, 30000, 12000]) : ri(rng, 31, 300) * 1000,
      ]);
      return { Artist: artists, RoyaltyPool: pools, StreamLog: streams };
    },
    solution: [
      "WITH paid AS (",
      "  SELECT artist_id, market",
      "  FROM StreamLog",
      "  WHERE ms_played >= 30000 AND streamed_on BETWEEN '2024-06-01' AND '2024-06-30'",
      "), market_total AS (",
      "  SELECT market, COUNT(*) AS total FROM paid GROUP BY market",
      "), artist_market AS (",
      "  SELECT artist_id, market, COUNT(*) AS n FROM paid GROUP BY artist_id, market",
      ")",
      "SELECT a.artist_name, ROUND(SUM(r.pool_inr * am.n / mt.total), 2) AS payout_inr",
      "FROM artist_market am",
      "JOIN market_total mt ON mt.market = am.market",
      "JOIN RoyaltyPool r ON r.market = am.market",
      "JOIN Artist a ON a.artist_id = am.artist_id",
      "GROUP BY a.artist_id, a.artist_name",
      "ORDER BY payout_inr DESC, a.artist_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.artist_name, ROUND(SUM(r.pool_inr * x.n / x.total), 2) AS payout_inr",
        "FROM (SELECT artist_id, market, COUNT(*) AS n, SUM(COUNT(*)) OVER (PARTITION BY market) AS total",
        "      FROM StreamLog",
        "      WHERE ms_played >= 30000 AND streamed_on >= '2024-06-01' AND streamed_on < '2024-07-01'",
        "      GROUP BY artist_id, market) x",
        "JOIN RoyaltyPool r ON r.market = x.market",
        "JOIN Artist a ON a.artist_id = x.artist_id",
        "GROUP BY a.artist_id, a.artist_name",
        "ORDER BY payout_inr DESC, a.artist_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter the qualifying streams once (30 seconds, June) and reuse them for both counts.",
      "You need two counts per market: each artist's streams there and everyone's streams there.",
      "Join the pool with an inner join — a market without a pool contributes nothing.",
      "Sum the per-market shares per artist, and round only the final total.",
    ],
    editorial: [
      "The pro-rata formula needs two counts at different grains: royalty-bearing streams per **(artist, market)** and per **market**. Compute the qualifying streams once — at least 30,000 ms and dated in June, so 29,999 ms, 31 May and 1 July are all out — then aggregate them both ways. The window form does it in one pass: grouping by artist and market gives `COUNT(*)`, and `SUM(COUNT(*)) OVER (PARTITION BY market)` adds those counts across the market.",
      "",
      "Each (artist, market) row earns `pool_inr * n / total`; in MySQL `/` is exact decimal division, so the share is not truncated. Joining `RoyaltyPool` with an inner join drops markets with no pool (BR in the example), so Dusk Riders, who streamed only there, earns nothing and is not listed. A pool whose market has no qualifying streams never meets an artist row. Summing per artist and rounding once at the end avoids rounding drift; rounding each market's share first could move the total by a paisa.",
      "",
      "In the example India's ₹90,000 is split 2:1 between Aurora Lanes and Bombay Bassline (the 29-second stream is out), and the US pool 1:1 between Aurora Lanes and Coral Static, giving Aurora Lanes ₹90,000. Both queries are a single aggregation over the stream log plus small joins.",
    ].join("\n"),
  },

  {
    slug: "spotify-listeners-whose-top-genre-changed",
    title: "Spotify: Listeners Whose Top Genre Changed From Q1 to Q2",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "The taste-profile team tracks listeners whose taste is shifting, because their recommendations need refreshing. A listener's **top genre** in a quarter is the genre of the tracks they streamed most often that quarter, counted in streams; a tie goes to the genre that comes **first alphabetically**. Q1 is January–March 2024 and Q2 is April–June 2024.",
      "",
      "Return every listener who streamed in **both** quarters and whose top genre in Q2 differs from Q1, with the columns `listener_id`, `q1_genre` and `q2_genre`. Streams outside the first half of 2024 are ignored. Order by `listener_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "genre", type: "varchar" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track and its primary genre.",
      },
      {
        name: "StreamLog",
        columns: [
          { name: "stream_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "streamed_on", type: "date" },
        ],
        primaryKey: ["stream_id"],
        note: "One row per stream.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters", "Indie"],
          [2, "Chasing Neon", "Electronic"],
          [3, "Paper Planes", "Indie"],
          [4, "Golden Hour", "Bollywood"],
          [5, "Quiet Storm", "Lo-fi"],
        ],
        StreamLog: [
          [1, 7, 1, "2024-01-05"], [2, 7, 3, "2024-02-11"], [3, 7, 2, "2024-03-31"],
          [4, 7, 2, "2024-04-01"], [5, 7, 2, "2024-05-20"], [6, 7, 1, "2024-06-02"],
          [7, 8, 4, "2024-01-09"], [8, 8, 5, "2024-02-14"],
          [9, 8, 5, "2024-04-03"], [10, 8, 4, "2024-06-30"], [11, 8, 4, "2024-07-01"],
          [12, 9, 1, "2024-03-03"], [13, 9, 3, "2024-05-05"],
          [14, 10, 2, "2023-12-31"], [15, 10, 5, "2024-04-10"],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 3, 8);
      const genres = sample(rng, GENRES, ri(rng, 2, 4));
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t, pick(rng, genres)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 6, 30);
      const streams: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 5),
        ri(rng, 1, nt),
        chance(rng, 0.12) ? pick(rng, ["2023-12-31", "2024-03-31", "2024-04-01", "2024-06-30", "2024-07-01"]) : dateBetween(rng, "2024-01-01", "2024-06-30"),
      ]);
      return { Track: tracks, StreamLog: streams };
    },
    solution: [
      "WITH per_quarter AS (",
      "  SELECT s.listener_id,",
      "         CASE WHEN s.streamed_on < '2024-04-01' THEN 1 ELSE 2 END AS qtr,",
      "         t.genre, COUNT(*) AS streams",
      "  FROM StreamLog s",
      "  JOIN Track t ON t.track_id = s.track_id",
      "  WHERE s.streamed_on BETWEEN '2024-01-01' AND '2024-06-30'",
      "  GROUP BY s.listener_id, CASE WHEN s.streamed_on < '2024-04-01' THEN 1 ELSE 2 END, t.genre",
      "), ranked AS (",
      "  SELECT listener_id, qtr, genre,",
      "         ROW_NUMBER() OVER (PARTITION BY listener_id, qtr ORDER BY streams DESC, genre) AS rn",
      "  FROM per_quarter",
      ")",
      "SELECT a.listener_id, a.genre AS q1_genre, b.genre AS q2_genre",
      "FROM ranked a",
      "JOIN ranked b ON b.listener_id = a.listener_id AND b.qtr = 2 AND b.rn = 1",
      "WHERE a.qtr = 1 AND a.rn = 1 AND a.genre <> b.genre",
      "ORDER BY a.listener_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH per_quarter AS (SELECT s.listener_id, QUARTER(s.streamed_on) AS qtr, t.genre, COUNT(*) AS streams",
        "                     FROM StreamLog s JOIN Track t ON t.track_id = s.track_id",
        "                     WHERE YEAR(s.streamed_on) = 2024 AND QUARTER(s.streamed_on) IN (1, 2)",
        "                     GROUP BY s.listener_id, QUARTER(s.streamed_on), t.genre),",
        "tops AS (SELECT p.listener_id, p.qtr, p.genre FROM per_quarter p",
        "         WHERE NOT EXISTS (SELECT 1 FROM per_quarter o WHERE o.listener_id = p.listener_id AND o.qtr = p.qtr",
        "                           AND (o.streams > p.streams OR (o.streams = p.streams AND o.genre < p.genre))))",
        "SELECT q1.listener_id, q1.genre AS q1_genre, q2.genre AS q2_genre",
        "FROM tops q1 JOIN tops q2 ON q2.listener_id = q1.listener_id AND q2.qtr = 2",
        "WHERE q1.qtr = 1 AND q1.genre <> q2.genre",
        "ORDER BY q1.listener_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Label each stream with its quarter, then count streams per listener, quarter and genre.",
      "Pick one top genre per listener and quarter with a ranking that includes the alphabetical tie-break.",
      "Join the Q1 pick to the Q2 pick of the same listener — the inner join drops anyone missing a quarter.",
    ],
    editorial: [
      "Three steps. First, **count**: label each stream with its quarter (before 1 April is Q1, otherwise Q2, after limiting to the first half of 2024) and count streams per listener, quarter and genre. `QUARTER(streamed_on)` builds the same label. The boundaries are exact: 31 March is Q1, 1 April is Q2, and 31 December 2023 and 1 July 2024 are out.",
      "",
      "Second, **pick**: `ROW_NUMBER()` per listener and quarter, ordered by streams descending then genre ascending, gives exactly one top genre even when genres tie. Listener 8 streamed Bollywood once and Lo-fi once in Q1, so Bollywood wins alphabetically; in Q2 Lo-fi and Bollywood again tie once each (the July stream is ignored) — Bollywood again, so no change is reported. Listener 7 moves from Indie (2 of 3) to Electronic (2 of 3).",
      "",
      "Third, **compare**: an inner self-join of the Q1 picks to the Q2 picks keeps only listeners present in both quarters (listener 10's only other stream is from 2023), and `a.genre <> b.genre` keeps the changers. The alternative picks the top genre with `NOT EXISTS` a better one. The cost is one aggregation of the streams plus a sort per listener-quarter.",
    ].join("\n"),
  },

  {
    slug: "spotify-playlists-sharing-half-their-tracks",
    title: "Spotify: Playlist Pairs Sharing Half Their Available Tracks",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "To suggest \"similar playlists\", the discovery team looks for pairs of playlists with heavy overlap. Only tracks that are still **available** (`is_available = 1`) count — towards the overlap and towards a playlist's size. Two playlists **overlap heavily** when they share at least one available track and the shared tracks make up **at least half** of the **smaller** playlist's available tracks.",
      "",
      "Return each such pair once, with the smaller id first, as `playlist_a`, `playlist_b`, `shared_tracks` and `smaller_size` (the smaller of the two playlists' available-track counts). Order by `playlist_a`, then `playlist_b`.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "is_available", type: "bool" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track; `is_available` is 0 when the track was taken down in this market.",
      },
      {
        name: "PlaylistTrack",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "track_id", type: "int" },
        ],
        primaryKey: ["playlist_id", "track_id"],
        note: "One row per track on a playlist; a track appears on a playlist at most once.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Monsoon Letters", 1], [2, "Chasing Neon", 1], [3, "Paper Planes", 1], [4, "Slow Rickshaw", 1],
          [5, "Golden Hour", 0], [6, "Static Hearts", 1], [7, "Midnight Chai", 1],
        ],
        PlaylistTrack: [
          [10, 1], [10, 2], [10, 3], [10, 4],
          [20, 1], [20, 2], [20, 6], [20, 7],
          [30, 3], [30, 5], [30, 6],
          [40, 5], [40, 7],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 4, 10);
      const tracks: Cell[][] = sample(rng, TRACK_TITLES, nt).map((t, i) => [i + 1, t, chance(rng, 0.85) ? 1 : 0]);
      const links: Cell[][] = [];
      const pool = seq(1, Math.min(nt, ri(rng, 4, 8)));
      for (const p of seq(1, ri(rng, 2, 5))) {
        for (const t of sample(rng, pool, ri(rng, 1, Math.min(6, pool.length)))) links.push([p * 10, t]);
      }
      return { Track: tracks, PlaylistTrack: shuffle(rng, links) };
    },
    solution: [
      "WITH avail AS (",
      "  SELECT pt.playlist_id, pt.track_id",
      "  FROM PlaylistTrack pt",
      "  JOIN Track t ON t.track_id = pt.track_id",
      "  WHERE t.is_available = 1",
      "), sizes AS (",
      "  SELECT playlist_id, COUNT(*) AS size FROM avail GROUP BY playlist_id",
      "), shared AS (",
      "  SELECT a.playlist_id AS playlist_a, b.playlist_id AS playlist_b, COUNT(*) AS shared_tracks",
      "  FROM avail a",
      "  JOIN avail b ON b.track_id = a.track_id AND a.playlist_id < b.playlist_id",
      "  GROUP BY a.playlist_id, b.playlist_id",
      ")",
      "SELECT sh.playlist_a, sh.playlist_b, sh.shared_tracks, LEAST(sa.size, sb.size) AS smaller_size",
      "FROM shared sh",
      "JOIN sizes sa ON sa.playlist_id = sh.playlist_a",
      "JOIN sizes sb ON sb.playlist_id = sh.playlist_b",
      "WHERE 2 * sh.shared_tracks >= LEAST(sa.size, sb.size)",
      "ORDER BY sh.playlist_a, sh.playlist_b",
    ].join("\n"),
    alternatives: [
      [
        "SELECT playlist_a, playlist_b, shared_tracks, smaller_size",
        "FROM (SELECT x.playlist_a, x.playlist_b, x.shared_tracks,",
        "             CASE WHEN x.size_a < x.size_b THEN x.size_a ELSE x.size_b END AS smaller_size",
        "      FROM (SELECT a.playlist_id AS playlist_a, b.playlist_id AS playlist_b, COUNT(*) AS shared_tracks,",
        "                   (SELECT COUNT(*) FROM PlaylistTrack p JOIN Track t ON t.track_id = p.track_id WHERE p.playlist_id = a.playlist_id AND t.is_available <> 0) AS size_a,",
        "                   (SELECT COUNT(*) FROM PlaylistTrack p JOIN Track t ON t.track_id = p.track_id WHERE p.playlist_id = b.playlist_id AND t.is_available <> 0) AS size_b",
        "            FROM PlaylistTrack a",
        "            JOIN PlaylistTrack b ON b.track_id = a.track_id AND b.playlist_id > a.playlist_id",
        "            JOIN Track t ON t.track_id = a.track_id",
        "            WHERE t.is_available = 1",
        "            GROUP BY a.playlist_id, b.playlist_id) x) y",
        "WHERE shared_tracks * 2 >= smaller_size",
        "ORDER BY playlist_a, playlist_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop unavailable tracks first, and use the filtered set for both the sizes and the overlap.",
      "A self join of the playlist–track pairs on `track_id`, with `a.playlist_id < b.playlist_id`, lists each shared track of each pair once.",
      "\"At least half\" without fractions: `2 * shared >= smaller size`.",
    ],
    editorial: [
      "The overlap of two playlists is found by a **self join** of the playlist–track pairs on the track: every row of the join is one track the two playlists share. The condition `a.playlist_id < b.playlist_id` keeps each unordered pair once (and never pairs a playlist with itself), and grouping by the pair counts the shared tracks. Pairs that share nothing never appear, as the statement requires.",
      "",
      "Availability changes both sides of the comparison, so it is applied once up front in the `avail` CTE and reused for sizes and overlap. In the example Golden Hour is unavailable: playlist 30 counts as two tracks, not three, and playlist 40 as one. Playlists 30 and 40 then share nothing available, while 20 and 40 share Midnight Chai — one track, which is half of 40's single available track or more — so they qualify. Playlists 10 and 20 share 2 of 4; 10 and 30 share 1 of 2; 20 and 30 share 1 of 2.",
      "",
      "The threshold is compared in integers, `2 * shared >= LEAST(size_a, size_b)`, so no rounding can sneak in. The alternative computes each playlist's size with correlated subqueries inside the grouped pair query and picks the smaller with `CASE`. The self join is quadratic in the number of playlists sharing a track — fine for curated catalogues, and the reason production systems use MinHash for this at scale.",
    ].join("\n"),
  },
];
