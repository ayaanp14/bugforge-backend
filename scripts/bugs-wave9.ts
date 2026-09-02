/** Wave 9 — the final batch: marketplace, consistency and loop bugs. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE9: BugSpec[] = [

  {
    title: "The One-Cent Book of Madness",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Pricing", "Feedback Loops"],
    description: `Inspired by the algorithmic pricing wars on marketplace sites — most famously the biology textbook priced at **$23 million** by two bots repricing against each other, and the mirror-image death spirals racing to one cent.

Two sellers undercut each other by a cent per round. Without a **floor**, they race to zero. \`repricer.js\` has no floor.`,
    bugReport: `**BUG-23M** · Priority: High · Reported by: marketplace integrity

battle(priceA, priceB, floorA, floorB, rounds):
- each round: A = max(floorA, B - 1), then B = max(floorB, A - 1)
- returns [finalA, finalB]

Observed: after a weekend of rounds both sellers list at 1 cent — the floors
are ignored entirely.`,
    logs: `[reprice] round 84212: A=1 B=1 (floors: 800, 795)`,
    files: [
      {
        filePath: "src/market/repricer.js",
        isEditable: true,
        language: "javascript",
        content: `// Simulates two repricing bots undercutting each other (cents).
exports.battle = function (priceA, priceB, floorA, floorB, rounds) {
  var a = priceA, b = priceB;
  for (var i = 0; i < rounds; i++) {
    a = b - 1;
    b = a - 1;
  }
  return [a, b];
};
`,
      },
    ],
    tests: [
      {
        name: "one round undercuts by a cent",
        isHidden: false,
        source: `var battle = require("src/market/repricer").battle;
assert.equal(battle(1000, 999, 800, 795, 1), [998, 997]);`,
      },
      {
        name: "long wars stop at the floors",
        isHidden: false,
        source: `var battle = require("src/market/repricer").battle;
assert.equal(battle(1000, 999, 800, 795, 300), [800, 799], "floors must hold");`,
      },
      {
        name: "prices already at floor stay put",
        isHidden: true,
        source: `var battle = require("src/market/repricer").battle;
assert.equal(battle(800, 795, 800, 795, 50), [800, 799]);`,
      },
    ],
    fixedFiles: {
      "src/market/repricer.js": `// Simulates two repricing bots undercutting each other (cents).
exports.battle = function (priceA, priceB, floorA, floorB, rounds) {
  var a = priceA, b = priceB;
  for (var i = 0; i < rounds; i++) {
    a = Math.max(floorA, b - 1);
    b = Math.max(floorB, a - 1);
  }
  return [a, b];
};
`,
    },
  },

  {
    title: "Sold Out, Sold Again",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Inventory", "Check-Then-Act"],
    description: `Inspired by every on-sale meltdown where more tickets sell than exist. The batch processor reads the inventory count **once**, then validates the entire queue against that stale snapshot — every request "fits".

\`reservations.js\` must re-check against the live count for each request.`,
    bugReport: `**BUG-OVERSELL** · Priority: Critical (refund storm) · Reported by: ticketing

processQueue(store, requests):
- for each requested qty: if store.count >= qty, deduct and record true;
  otherwise record false
- returns the array of decisions; store.count must end correct

Observed: 5 seats, queue [3, 3] -> both approved, 6 of 5 sold.`,
    logs: `[gate] event 8112: capacity 5, tickets issued 6`,
    files: [
      {
        filePath: "src/tickets/reservations.js",
        isEditable: true,
        language: "javascript",
        content: `// Processes a queue of reservation requests against the inventory.
exports.processQueue = function (store, requests) {
  var available = store.count;
  var decisions = [];
  for (var i = 0; i < requests.length; i++) {
    if (available >= requests[i]) {
      store.count = available - requests[i];
      decisions.push(true);
    } else {
      decisions.push(false);
    }
  }
  return decisions;
};
`,
      },
    ],
    tests: [
      {
        name: "the second oversized request is rejected",
        isHidden: false,
        source: `var q = require("src/tickets/reservations").processQueue;
var store = { count: 5 };
assert.equal(q(store, [3, 3]), [true, false], "only 2 seats remained");
assert.equal(store.count, 2);`,
      },
      {
        name: "requests that fit all pass",
        isHidden: false,
        source: `var q = require("src/tickets/reservations").processQueue;
var store = { count: 10 };
assert.equal(q(store, [4, 3, 3]), [true, true, true]);
assert.equal(store.count, 0);`,
      },
      {
        name: "an exact-fit tail request succeeds",
        isHidden: true,
        source: `var q = require("src/tickets/reservations").processQueue;
var store = { count: 6 };
assert.equal(q(store, [4, 3, 2]), [true, false, true]);
assert.equal(store.count, 0);`,
      },
    ],
    fixedFiles: {
      "src/tickets/reservations.js": `// Processes a queue of reservation requests against the inventory.
exports.processQueue = function (store, requests) {
  var decisions = [];
  for (var i = 0; i < requests.length; i++) {
    if (store.count >= requests[i]) {
      store.count = store.count - requests[i];
      decisions.push(true);
    } else {
      decisions.push(false);
    }
  }
  return decisions;
};
`,
    },
  },

  {
    title: "The Negative-Price Flash Sale",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Pricing", "Math"],
    description: `Inspired by the seasonal-sale pricing bugs that turn storefronts into charities: stacking a 50% banner discount with a 75% coupon by **adding** the percentages takes 125% off. The store briefly paid customers to take games.

Discounts compound **multiplicatively** — fix \`discounts.js\`.`,
    bugReport: `**BUG-125PCT** · Priority: Critical · Reported by: storefront

applyDiscounts(priceCents, percents):
- apply each percentage to the RUNNING price (integer floor each step)
- 1000 with [50, 75] -> 500 -> 125

Observed: percentages are summed first — [50, 75] takes 125% off and the
checkout total goes negative.`,
    logs: `[cart] total: -250 cents ("you earn $2.50 buying this")`,
    files: [
      {
        filePath: "src/store/discounts.js",
        isEditable: true,
        language: "javascript",
        content: `// Applies stacked percentage discounts to a price in cents.
exports.applyDiscounts = function (priceCents, percents) {
  var totalPercent = 0;
  for (var i = 0; i < percents.length; i++) {
    totalPercent += percents[i];
  }
  return Math.floor(priceCents * (100 - totalPercent) / 100);
};
`,
      },
    ],
    tests: [
      {
        name: "stacked discounts compound, never sum",
        isHidden: false,
        source: `var apply = require("src/store/discounts").applyDiscounts;
assert.equal(apply(1000, [50, 75]), 125);`,
      },
      {
        name: "a single discount is simple",
        isHidden: false,
        source: `var apply = require("src/store/discounts").applyDiscounts;
assert.equal(apply(1000, [30]), 700);
assert.equal(apply(999, []), 999);`,
      },
      {
        name: "prices can never go negative",
        isHidden: true,
        source: `var apply = require("src/store/discounts").applyDiscounts;
var out = apply(500, [90, 90, 90]);
assert.ok(out >= 0, "got " + out);
assert.equal(out, 0, "50 -> 5 -> 0 with flooring");`,
      },
    ],
    fixedFiles: {
      "src/store/discounts.js": `// Applies stacked percentage discounts to a price in cents.
exports.applyDiscounts = function (priceCents, percents) {
  var price = priceCents;
  for (var i = 0; i < percents.length; i++) {
    price = Math.floor(price * (100 - percents[i]) / 100);
  }
  return price;
};
`,
    },
  },

  {
    title: "The Notification Echo",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Dedupe", "State"],
    description: `Inspired by the price-alert storms that buzz phones at 3 AM — the same alert, five times, because the dedupe state was **shared globally** instead of tracked per user and per alert.

\`alerts.py\` rate-limits notifications: one per (user, alert key) per hour.`,
    bugReport: `**BUG-BUZZ** · Priority: High (app deletions) · Reported by: mobile

should_send(user, key, now, state):
- send if this (user, key) pair has not fired within 3600 seconds
- record the send time on success

Observed: ONE global timestamp for everything — after any alert fires, every
other user's alerts are suppressed for an hour (and vice versa at reset).`,
    logs: `[alerts] user_a BTC alert fired -> user_b's ETH alert suppressed`,
    files: [
      {
        filePath: "src/notify/alerts.py",
        isEditable: true,
        language: "python",
        content: `# Per-user, per-alert notification rate limiting.

WINDOW_SECONDS = 3600

def should_send(user, key, now, state):
    last = state.get("last_sent")
    if last is not None and now - last < WINDOW_SECONDS:
        return False
    state["last_sent"] = now
    return True
`,
      },
    ],
    tests: [
      {
        name: "different users are independent",
        isHidden: false,
        source: `m = bug_require("src/notify/alerts")
state = {}
assert_.ok(m.should_send("user_a", "BTC", 1000, state))
assert_.ok(m.should_send("user_b", "ETH", 1001, state), "user_b was never notified")`,
      },
      {
        name: "the same alert is suppressed within the window",
        isHidden: false,
        source: `m = bug_require("src/notify/alerts")
state = {}
assert_.ok(m.should_send("user_a", "BTC", 1000, state))
assert_.ok(not m.should_send("user_a", "BTC", 2000, state))`,
      },
      {
        name: "the window expires",
        isHidden: false,
        source: `m = bug_require("src/notify/alerts")
state = {}
m.should_send("user_a", "BTC", 1000, state)
assert_.ok(m.should_send("user_a", "BTC", 1000 + 3600, state))`,
      },
      {
        name: "different alerts for one user are independent",
        isHidden: true,
        source: `m = bug_require("src/notify/alerts")
state = {}
assert_.ok(m.should_send("user_a", "BTC", 1000, state))
assert_.ok(m.should_send("user_a", "ETH", 1001, state))`,
      },
    ],
    fixedFiles: {
      "src/notify/alerts.py": `# Per-user, per-alert notification rate limiting.

WINDOW_SECONDS = 3600

def should_send(user, key, now, state):
    pair = (user, key)
    last = state.get(pair)
    if last is not None and now - last < WINDOW_SECONDS:
        return False
    state[pair] = now
    return True
`,
    },
  },

  {
    title: "Nine A.M. Somewhere",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Timezones", "Scheduling"],
    description: `Inspired by the digest emails that arrive at 3 AM: "send at 9 AM" was implemented as 9 AM **server time**, for every user on the planet.

\`digest.py\` converts each user's local send-hour to the UTC hour the scheduler runs on. Offsets are minutes east of UTC.`,
    bugReport: `**BUG-9AM** · Reported by: lifecycle marketing

send_hour_utc(local_hour, offset_minutes):
- the UTC hour at which the user's wall clock reads local_hour
- Mumbai (+330): 9 AM local -> 3 UTC
- New York (-300): 9 AM local -> 14 UTC

Observed: the offset is ignored — everyone gets the digest at server 9 AM.`,
    logs: `[digest] IST users report 2:30 PM delivery; PST users 1 AM`,
    files: [
      {
        filePath: "src/mail/digest.py",
        isEditable: true,
        language: "python",
        content: `# UTC hour at which to send a user's local-time digest.

def send_hour_utc(local_hour, offset_minutes):
    return local_hour
`,
      },
    ],
    tests: [
      {
        name: "east-of-UTC users send earlier in UTC",
        isHidden: false,
        source: `m = bug_require("src/mail/digest")
assert_.equal(m.send_hour_utc(9, 330), 3, "9 AM IST is 03:30 UTC -> hour 3")`,
      },
      {
        name: "west-of-UTC users send later in UTC",
        isHidden: false,
        source: `m = bug_require("src/mail/digest")
assert_.equal(m.send_hour_utc(9, -300), 14)`,
      },
      {
        name: "wrapping around midnight works",
        isHidden: true,
        source: `m = bug_require("src/mail/digest")
assert_.equal(m.send_hour_utc(1, 120), 23)
assert_.equal(m.send_hour_utc(9, 0), 9)`,
      },
    ],
    fixedFiles: {
      "src/mail/digest.py": `# UTC hour at which to send a user's local-time digest.

def send_hour_utc(local_hour, offset_minutes):
    return ((local_hour * 60 - offset_minutes) % 1440) // 60
`,
    },
  },

  {
    title: "Version 1.10 Beats Version 1.9",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Versioning", "Parsing"],
    description: `Inspired by every auto-updater that ever refused to update: comparing version strings as **strings** makes "1.10.0" sort *before* "1.9.0", so half the fleet stays on the old release forever.

\`semver.js\` — compare numerically, segment by segment.`,
    bugReport: `**BUG-VERCMP** · Priority: High · Reported by: release eng

isNewer(a, b) — true iff version a is strictly newer than b:
- compare dot-separated segments numerically
- missing segments count as 0 ("2.0" == "2.0.0")

Observed: "1.10.0" is treated as OLDER than "1.9.0"; the updater loops.`,
    logs: `[updater] latest=1.10.0 current=1.9.0 -> "already up to date"`,
    files: [
      {
        filePath: "src/release/semver.js",
        isEditable: true,
        language: "javascript",
        content: `// Version comparison for the auto-updater.
exports.isNewer = function (a, b) {
  return a > b;
};
`,
      },
    ],
    tests: [
      {
        name: "double-digit segments compare numerically",
        isHidden: false,
        source: `var isNewer = require("src/release/semver").isNewer;
assert.ok(isNewer("1.10.0", "1.9.0"), "ten is greater than nine");
assert.ok(!isNewer("1.9.0", "1.10.0"));`,
      },
      {
        name: "ordinary bumps still register",
        isHidden: false,
        source: `var isNewer = require("src/release/semver").isNewer;
assert.ok(isNewer("2.0.0", "1.99.99"));
assert.ok(!isNewer("1.2.3", "1.2.3"), "equal is not newer");`,
      },
      {
        name: "missing segments count as zero",
        isHidden: true,
        source: `var isNewer = require("src/release/semver").isNewer;
assert.ok(!isNewer("2.0", "2.0.0"));
assert.ok(isNewer("2.0.1", "2.0"));`,
      },
    ],
    fixedFiles: {
      "src/release/semver.js": `// Version comparison for the auto-updater.
exports.isNewer = function (a, b) {
  var as = a.split(".");
  var bs = b.split(".");
  var len = Math.max(as.length, bs.length);
  for (var i = 0; i < len; i++) {
    var av = i < as.length ? parseInt(as[i], 10) : 0;
    var bv = i < bs.length ? parseInt(bs[i], 10) : 0;
    if (av !== bv) return av > bv;
  }
  return false;
};
`,
    },
  },

  {
    title: "The Autosave That Cut You Off",
    difficulty: "medium",
    category: "frontend",
    language: "java",
    tags: ["Debounce", "Timers"],
    description: `Inspired by document editors that save **while you're typing** — snapshotting half-finished sentences — or save constantly with no edits at all. Autosave should fire only after a quiet period follows an actual edit.

\`Autosave.java\` gets the timestamps; the logic is inverted.`,
    bugReport: `**BUG-AUTOSAVE** · Reported by: docs team

shouldSave(lastSaveMs, lastEditMs, nowMs) with a 2000ms quiet period:
- there must BE unsaved edits: lastEditMs > lastSaveMs
- and the user must have been quiet: nowMs - lastEditMs >= 2000

Observed: it saves every 2s regardless of edits, including mid-keystroke.`,
    logs: `[docs] snapshot saved mid-word: "The quarterly resul"`,
    files: [
      {
        filePath: "Autosave.java",
        isEditable: true,
        language: "java",
        content: `class Autosave {
    static final long QUIET_MS = 2000;

    static boolean shouldSave(long lastSaveMs, long lastEditMs, long nowMs) {
        return nowMs - lastSaveMs >= QUIET_MS;
    }
}`,
      },
    ],
    tests: [
      {
        name: "no edits means no save",
        isHidden: false,
        source: `                BugAssert.ok(!Autosave.shouldSave(5000L, 4000L, 99999L), "nothing changed since the last save");`,
      },
      {
        name: "typing right now blocks the save",
        isHidden: false,
        source: `                BugAssert.ok(!Autosave.shouldSave(1000L, 9500L, 10000L), "only 500ms since the last keystroke");`,
      },
      {
        name: "a quiet period after edits saves",
        isHidden: false,
        source: `                BugAssert.ok(Autosave.shouldSave(1000L, 5000L, 7000L), "2s of quiet with pending edits");`,
      },
      {
        name: "the boundary is inclusive",
        isHidden: true,
        source: `                BugAssert.ok(Autosave.shouldSave(0L, 1000L, 3000L));
                BugAssert.ok(!Autosave.shouldSave(0L, 1000L, 2999L));`,
      },
    ],
    fixedFiles: {
      "Autosave.java": `class Autosave {
    static final long QUIET_MS = 2000;

    static boolean shouldSave(long lastSaveMs, long lastEditMs, long nowMs) {
        boolean hasPendingEdits = lastEditMs > lastSaveMs;
        boolean quietLongEnough = nowMs - lastEditMs >= QUIET_MS;
        return hasPendingEdits && quietLongEnough;
    }
}`,
    },
  },

  {
    title: "The Percent That Escaped",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Encoding", "URLs"],
    description: `Inspired by the "%2520 in every URL" class of bugs that has hit search engines and CDNs alike — percent signs that aren't themselves encoded turn "50% off" links into broken requests, while everything else was handled.

\`ParamEncoder.java\` encodes a query-string value. It forgot the most important character.`,
    bugReport: `**BUG-2520** · Reported by: SEO (broken deep links in the wild)

encode(raw) — minimal table for our URLs:
- " " -> %20, "&" -> %26, "=" -> %3D, and "%" itself -> %25 (FIRST!)
- all other characters pass through

Observed: "50% off" encodes to "50%%20off" — the bare % corrupts the request.`,
    logs: `[crawler] GET /deals?q=50%%20off -> 400 Bad Request`,
    files: [
      {
        filePath: "ParamEncoder.java",
        isEditable: true,
        language: "java",
        content: `class ParamEncoder {
    static String encode(String raw) {
        return raw
            .replace(" ", "%20")
            .replace("&", "%26")
            .replace("=", "%3D");
    }
}`,
      },
    ],
    tests: [
      {
        name: "percent signs are encoded",
        isHidden: false,
        source: `                BugAssert.equal(ParamEncoder.encode("50% off"), "50%25%20off");`,
      },
      {
        name: "spaces, ampersands and equals encode",
        isHidden: false,
        source: `                BugAssert.equal(ParamEncoder.encode("a=b&c d"), "a%3Db%26c%20d");`,
      },
      {
        name: "plain text passes through",
        isHidden: false,
        source: `                BugAssert.equal(ParamEncoder.encode("hello-world_123"), "hello-world_123");`,
      },
      {
        name: "the percent escape never double-encodes the table",
        isHidden: true,
        source: `                BugAssert.equal(ParamEncoder.encode("%20"), "%2520", "a literal %20 in the input");`,
      },
    ],
    fixedFiles: {
      "ParamEncoder.java": `class ParamEncoder {
    static String encode(String raw) {
        return raw
            .replace("%", "%25")
            .replace(" ", "%20")
            .replace("&", "%26")
            .replace("=", "%3D");
    }
}`,
    },
  },

  {
    title: "Average Watch Time: Infinity",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Math", "Division"],
    description: `Inspired by every analytics dashboard that has proudly displayed "Infinity minutes" or "NaN%" on launch day, before any traffic arrived. Division needs a denominator.

\`metrics.js\` computes the overview cards.`,
    bugReport: `**BUG-INF** · Reported by: dashboards

- avgWatchMs(totalMs, viewers): 0 viewers -> 0
- clickRate(clicks, views): percentage with ONE decimal; 0 views -> 0

Observed: fresh channels show "Infinity" and "NaN%" cards.`,
    logs: `[cards] avg watch: Infinity min · CTR: NaN%`,
    files: [
      {
        filePath: "src/stats/metrics.js",
        isEditable: true,
        language: "javascript",
        content: `// Overview card metrics.
exports.avgWatchMs = function (totalMs, viewers) {
  return Math.round(totalMs / viewers);
};

exports.clickRate = function (clicks, views) {
  return Math.round((clicks / views) * 1000) / 10;
};
`,
      },
    ],
    tests: [
      {
        name: "zero viewers is zero average",
        isHidden: false,
        source: `var m = require("src/stats/metrics");
assert.equal(m.avgWatchMs(0, 0), 0);
assert.equal(m.clickRate(0, 0), 0);`,
      },
      {
        name: "real traffic computes normally",
        isHidden: false,
        source: `var m = require("src/stats/metrics");
assert.equal(m.avgWatchMs(9000, 3), 3000);
assert.equal(m.clickRate(7, 200), 3.5);`,
      },
      {
        name: "rates keep one decimal",
        isHidden: true,
        source: `var m = require("src/stats/metrics");
assert.equal(m.clickRate(1, 3), 33.3);
assert.equal(m.clickRate(2, 3), 66.7);`,
      },
    ],
    fixedFiles: {
      "src/stats/metrics.js": `// Overview card metrics.
exports.avgWatchMs = function (totalMs, viewers) {
  if (viewers <= 0) return 0;
  return Math.round(totalMs / viewers);
};

exports.clickRate = function (clicks, views) {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
};
`,
    },
  },

  {
    title: "The Cursor at the End of Time",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Pagination", "Parsing"],
    description: `Inspired by the API-pagination crashes that greet every client's FIRST request: the opaque cursor is decoded unconditionally — and the first page has no cursor at all. \`int("")\` says hello.

\`cursor.py\` encodes/decodes offset cursors of the form \`"off:<n>"\`.`,
    bugReport: `**BUG-PAGE1** · Priority: High · Reported by: API consumers

- decode(cursor): None or "" -> offset 0; "off:<n>" -> n; anything else ->
  raise ValueError
- encode(offset) -> "off:<n>"; round-trips exactly

Observed: the very first request (no cursor) throws, and junk cursors return
offset 0 silently, restarting angry clients from page one.`,
    logs: `[api] GET /items -> 500 ValueError: invalid literal for int()`,
    files: [
      {
        filePath: "src/api/cursor.py",
        isEditable: true,
        language: "python",
        content: `# Opaque pagination cursors: "off:<n>".

def encode(offset):
    return "off:" + str(offset)

def decode(cursor):
    return int(cursor.split(":")[1])
`,
      },
    ],
    tests: [
      {
        name: "the first page has no cursor",
        isHidden: false,
        source: `m = bug_require("src/api/cursor")
assert_.equal(m.decode(None), 0)
assert_.equal(m.decode(""), 0)`,
      },
      {
        name: "cursors round-trip",
        isHidden: false,
        source: `m = bug_require("src/api/cursor")
assert_.equal(m.decode(m.encode(40)), 40)
assert_.equal(m.encode(0), "off:0")`,
      },
      {
        name: "junk cursors raise instead of restarting",
        isHidden: false,
        source: `m = bug_require("src/api/cursor")
assert_.throws(lambda: m.decode("banana"))
assert_.throws(lambda: m.decode("off:xyz"))`,
      },
      {
        name: "large offsets survive",
        isHidden: true,
        source: `m = bug_require("src/api/cursor")
assert_.equal(m.decode(m.encode(123456789)), 123456789)`,
      },
    ],
    fixedFiles: {
      "src/api/cursor.py": `# Opaque pagination cursors: "off:<n>".

def encode(offset):
    return "off:" + str(offset)

def decode(cursor):
    if cursor is None or cursor == "":
        return 0
    parts = cursor.split(":")
    if len(parts) != 2 or parts[0] != "off" or not parts[1].isdigit():
        raise ValueError("invalid cursor: " + str(cursor))
    return int(parts[1])
`,
    },
  },

  {
    title: "Schrödinger's Follower Count",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Consistency", "Caching"],
    description: `Inspired by the follower counters of large social networks, which read from whichever replica answers first — so refreshing your profile makes the number bounce **down** and back up. Displayed counters should be monotonic: never show fewer than the user has already seen.

\`counter.js\` picks what to display.`,
    bugReport: `**BUG-BOUNCE** · Reported by: creator support (screenshots of "losing" followers)

nextDisplay(previousShown, freshReads):
- take the max of the fresh replica reads
- never display LESS than previousShown (replicas lag; going down is noise)
- returns the new displayed value

Observed: the counter renders whatever the slowest replica said.`,
    logs: `[profile] shown 10,204 -> refresh -> 10,197 -> refresh -> 10,205`,
    files: [
      {
        filePath: "src/social/counter.js",
        isEditable: true,
        language: "javascript",
        content: `// Chooses the follower count to display.
exports.nextDisplay = function (previousShown, freshReads) {
  return freshReads[freshReads.length - 1];
};
`,
      },
    ],
    tests: [
      {
        name: "lagging replicas never lower the number",
        isHidden: false,
        source: `var next = require("src/social/counter").nextDisplay;
assert.equal(next(10204, [10197, 10201]), 10204, "monotonic display");`,
      },
      {
        name: "genuinely higher counts show",
        isHidden: false,
        source: `var next = require("src/social/counter").nextDisplay;
assert.equal(next(10204, [10199, 10230]), 10230, "take the max read");`,
      },
      {
        name: "first render uses the best read",
        isHidden: true,
        source: `var next = require("src/social/counter").nextDisplay;
assert.equal(next(0, [5, 9, 7]), 9);`,
      },
    ],
    fixedFiles: {
      "src/social/counter.js": `// Chooses the follower count to display.
exports.nextDisplay = function (previousShown, freshReads) {
  var best = previousShown;
  for (var i = 0; i < freshReads.length; i++) {
    if (freshReads[i] > best) best = freshReads[i];
  }
  return best;
};
`,
    },
  },

  {
    title: "The Draft That Overwrote the Publish",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Sync", "Timestamps"],
    description: `Inspired by the sync-conflict horror stories of every note-taking and CMS product: an old offline draft comes back online and steamrolls the article someone published an hour ago. Last-write-wins needs to compare **timestamps**, not arrival order.

\`sync.py\` merges an incoming record with the stored one.`,
    bugReport: `**BUG-LWW** · Priority: High (lost content) · Reported by: editors

merge(saved, incoming) — both have updated_at:
- keep whichever has the NEWER updated_at
- ties keep the SAVED (server) copy

Observed: incoming always wins — a laptop that was offline all week just
replaced today's homepage with last Tuesday's.`,
    logs: `[sync] doc 41: incoming updated_at=1699000000 overwrote saved 1699600000`,
    files: [
      {
        filePath: "src/sync/sync.py",
        isEditable: true,
        language: "python",
        content: `# Last-write-wins merge of a stored and incoming record.

def merge(saved, incoming):
    return incoming
`,
      },
    ],
    tests: [
      {
        name: "an older incoming record loses",
        isHidden: false,
        source: `m = bug_require("src/sync/sync")
saved = {"body": "published", "updated_at": 200}
incoming = {"body": "stale draft", "updated_at": 100}
assert_.equal(m.merge(saved, incoming)["body"], "published")`,
      },
      {
        name: "a newer incoming record wins",
        isHidden: false,
        source: `m = bug_require("src/sync/sync")
saved = {"body": "old", "updated_at": 100}
incoming = {"body": "new edit", "updated_at": 300}
assert_.equal(m.merge(saved, incoming)["body"], "new edit")`,
      },
      {
        name: "ties keep the server copy",
        isHidden: true,
        source: `m = bug_require("src/sync/sync")
saved = {"body": "server", "updated_at": 100}
incoming = {"body": "client", "updated_at": 100}
assert_.equal(m.merge(saved, incoming)["body"], "server")`,
      },
    ],
    fixedFiles: {
      "src/sync/sync.py": `# Last-write-wins merge of a stored and incoming record.

def merge(saved, incoming):
    if incoming["updated_at"] > saved["updated_at"]:
        return incoming
    return saved
`,
    },
  },

  {
    title: "One Frame Behind Forever",
    difficulty: "hard",
    category: "frontend",
    language: "java",
    tags: ["Game Loops", "Rounding"],
    description: `Inspired by the fixed-timestep game loops described in every "Fix Your Timestep!" postmortem: the accumulator pattern must run **whole** simulation frames and carry the exact remainder. Round instead of floor, and the simulation runs frames it hasn't earned — leaving a negative time debt that compounds into stutter.

\`GameLoop.java\` computes frames-to-run from the accumulator.`,
    bugReport: `**BUG-TIMESTEP** · Reported by: engine team

framesToRun(accumulatorMs, frameMs) -> int[]{frames, remainderMs}:
- frames = floor(accumulator / frame) — only FULLY funded frames
- remainder = accumulator - frames * frame (always 0 <= r < frame)

Observed: 15ms of accumulated time runs a 16ms frame — remainder -1ms. The
debt snowballs and the camera micro-stutters forever.`,
    logs: `[loop] acc=15 frame=16 -> ran 1 frame, remainder -1`,
    files: [
      {
        filePath: "GameLoop.java",
        isEditable: true,
        language: "java",
        content: `class GameLoop {
    static int[] framesToRun(int accumulatorMs, int frameMs) {
        int frames = Math.round((float) accumulatorMs / frameMs);
        int remainder = accumulatorMs - frames * frameMs;
        return new int[] { frames, remainder };
    }
}`,
      },
    ],
    tests: [
      {
        name: "underfunded frames do not run",
        isHidden: false,
        source: `                BugAssert.equal(GameLoop.framesToRun(15, 16), new int[] { 0, 15 }, "15ms cannot fund a 16ms frame");`,
      },
      {
        name: "full frames run with exact remainder",
        isHidden: false,
        source: `                BugAssert.equal(GameLoop.framesToRun(40, 16), new int[] { 2, 8 });`,
      },
      {
        name: "exact multiples leave zero remainder",
        isHidden: false,
        source: `                BugAssert.equal(GameLoop.framesToRun(48, 16), new int[] { 3, 0 });`,
      },
      {
        name: "the remainder is never negative",
        isHidden: true,
        source: `                int[] out = GameLoop.framesToRun(1000, 16);
                BugAssert.equal(out[0], 62);
                BugAssert.equal(out[1], 8);
                BugAssert.ok(out[1] >= 0 && out[1] < 16);`,
      },
    ],
    fixedFiles: {
      "GameLoop.java": `class GameLoop {
    static int[] framesToRun(int accumulatorMs, int frameMs) {
        int frames = accumulatorMs / frameMs;
        int remainder = accumulatorMs - frames * frameMs;
        return new int[] { frames, remainder };
    }
}`,
    },
  },

];
