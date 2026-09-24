/**
 * Wave 22 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE22: BugSpec[] = [

  {
    title: "The Leap Second That Went Negative",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Time", "Networking"],
    description: `Modelled on **Cloudflare's New Year's Day 2017 DNS incident**. When a leap second was inserted at midnight UTC on 1 January 2017, Cloudflare's RRDNS resolver measured a round-trip time by subtracting two readings of the wall clock. Across the leap second the result came out **negative**, and that value was passed to a random-selection routine that only accepts a positive bound. The routine panicked, and some DNS resolutions (notably for CNAME lookups) failed until the code was patched to treat negative values as zero.

This reconstruction times each upstream resolver with an injected clock and later adds random jitter bounded by the recorded RTT. A clock that steps backwards makes the recorded RTT negative, and the next selection throws.

Fix \`recordRtt\` so a backwards clock can never produce a negative round-trip time.`,
    bugReport: `**BUG-RRDNS-LEAP** · Priority: Critical · Reported by: DNS on-call

recordRtt(server, clock, send):
- reads clock.now() before and after calling send(server.name)
- the round trip is (after - before) in milliseconds, but a duration can
  never be negative: when the clock stepped backwards (leap second, NTP
  correction) the round trip is recorded as 0
- stores the value in server.rttMs and returns it

pickUpstream(servers, rand) scores every server as
rttMs + randomBelow(rttMs + 1, rand) and returns the lowest score (first
wins a tie). It must never throw for servers timed by recordRtt.

Observed: after 00:00:00 UTC a resolver was recorded with rttMs = -250 and
every later pickUpstream call threw "invalid argument to randomBelow".`,
    logs: `[rrdns] upstream=10.0.4.2 rtt=-250ms
[rrdns] panic: invalid argument to randomBelow: -249
[rrdns] SERVFAIL for 1,834 CNAME lookups in the last 60s`,
    files: [
      {
        filePath: "src/dns/upstream.js",
        isEditable: true,
        language: "javascript",
        content: `var random = require("./random");

// Times one query against a resolver and remembers the round trip.
exports.recordRtt = function (server, clock, send) {
  var start = clock.now();
  send(server.name);
  var rtt = clock.now() - start;
  server.rttMs = rtt;
  return rtt;
};

// Up to 100% random jitter, so equally fast resolvers share the load.
exports.jitteredRtt = function (server, rand) {
  return server.rttMs + random.randomBelow(server.rttMs + 1, rand);
};

// The resolver with the lowest jittered RTT wins; the first one wins a tie.
exports.pickUpstream = function (servers, rand) {
  var best = null;
  var bestScore = Infinity;
  for (var i = 0; i < servers.length; i++) {
    var score = exports.jitteredRtt(servers[i], rand);
    if (score < bestScore) {
      best = servers[i];
      bestScore = score;
    }
  }
  return best;
};
`,
      },
      {
        filePath: "src/dns/random.js",
        isEditable: false,
        language: "javascript",
        content: `/*
randomBelow(n, rand) returns an integer in [0, n). Like the Go library call
RRDNS used, it refuses a bound that is not positive instead of guessing.
rand is injected so selection is deterministic under test.
*/
exports.randomBelow = function (n, rand) {
  if (!(n > 0)) throw new Error("invalid argument to randomBelow: " + n);
  return Math.floor(rand() * n);
};
`,
      },
    ],
    tests: [
      {
        name: "a normal query records its round trip",
        isHidden: false,
        source: `var up = require("src/dns/upstream");
var readings = [1000, 1030];
var clock = { now: function () { return readings.shift(); } };
var s = { name: "a" };
assert.equal(up.recordRtt(s, clock, function () {}), 30);
assert.equal(s.rttMs, 30);`,
      },
      {
        name: "a clock that steps back across the leap second records zero",
        isHidden: false,
        source: `var up = require("src/dns/upstream");
var readings = [1483228800200, 1483228799950];
var clock = { now: function () { return readings.shift(); } };
var s = { name: "b" };
assert.equal(up.recordRtt(s, clock, function () {}), 0, "a duration is never negative");
assert.equal(s.rttMs, 0);
assert.equal(up.pickUpstream([s], function () { return 0.5; }).name, "b");`,
      },
      {
        name: "the fastest resolver wins",
        isHidden: true,
        source: `var up = require("src/dns/upstream");
var servers = [{ name: "a", rttMs: 40 }, { name: "b", rttMs: 10 }, { name: "c", rttMs: 25 }];
assert.equal(up.pickUpstream(servers, function () { return 0; }).name, "b");`,
      },
      {
        name: "a resolver timed across the step can still be chosen",
        isHidden: true,
        source: `var up = require("src/dns/upstream");
var readings = [5000, 4000];
var clock = { now: function () { return readings.shift(); } };
var slow = { name: "slow", rttMs: 20 };
var stepped = { name: "stepped" };
up.recordRtt(stepped, clock, function () {});
assert.equal(up.pickUpstream([slow, stepped], function () { return 0.99; }).name, "stepped");`,
      },
      {
        name: "send is called with the resolver name",
        isHidden: true,
        source: `var up = require("src/dns/upstream");
var readings = [0, 7];
var clock = { now: function () { return readings.shift(); } };
var seen = [];
up.recordRtt({ name: "10.0.4.2" }, clock, function (n) { seen.push(n); });
assert.equal(seen, ["10.0.4.2"]);`,
      },
    ],
    fixedFiles: {
      "src/dns/upstream.js": `var random = require("./random");

// Times one query against a resolver and remembers the round trip.
exports.recordRtt = function (server, clock, send) {
  var start = clock.now();
  send(server.name);
  var rtt = clock.now() - start;
  // The wall clock can step backwards (a leap second, an NTP correction), so
  // the difference of two readings can be negative. A duration never is, and
  // randomBelow refuses a non-positive bound: clamp at zero.
  if (rtt < 0) rtt = 0;
  server.rttMs = rtt;
  return rtt;
};

// Up to 100% random jitter, so equally fast resolvers share the load.
exports.jitteredRtt = function (server, rand) {
  return server.rttMs + random.randomBelow(server.rttMs + 1, rand);
};

// The resolver with the lowest jittered RTT wins; the first one wins a tie.
exports.pickUpstream = function (servers, rand) {
  var best = null;
  var bestScore = Infinity;
  for (var i = 0; i < servers.length; i++) {
    var score = exports.jitteredRtt(servers[i], rand);
    if (score < bestScore) {
      best = servers[i];
      bestScore = score;
    }
  }
  return best;
};
`,
    },
  },

  {
    title: "Tenths of a Second Since 2000",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Time"],
    description: `Modelled on the **loss of NASA's Deep Impact spacecraft in August 2013**. Contact was lost in August 2013 and the mission was declared over the following month. The probable cause NASA's team described was a time-keeping limit: the fault-protection software counted time in **tenths of a second since 1 January 2000**, and that count no longer fitted in 32 bits once it passed 2^32 tenths — in August 2013 — leaving the onboard computers unable to keep a sensible clock.

This reconstruction keeps the flight software's time tags in a \`long\` but still masks them to 32 bits, so the tag wraps back to a small number at the boundary and fault protection sees time run backwards.

Fix \`SpacecraftClock\` so time tags keep counting past 2^32 tenths.`,
    bugReport: `**BUG-DI-2013** · Priority: Critical · Reported by: mission operations

SpacecraftClock:
- toTag(secondsSince2000) returns tenths of a second since
  2000-01-01T00:00:00 — exactly secondsSince2000 * 10, for any mission time
  representable in a long (no wrap at 2^32 = 4,294,967,296 tenths)
- toSeconds(tag) is the inverse (tag / 10)
- elapsedTenths(earlier, later) is later - earlier

FaultProtection.check(previous, current) (locked) resets the computer when
time goes backwards or jumps more than a day between readings.

Observed: two readings one second apart, straddling 429,496,729.6 s after
2000 (August 2013), produce tags 4294967290 and 4 — fault protection
resets, and keeps resetting.`,
    logs: `[fp] tag prev=4294967290 cur=4 step=-4294967286
[fp] CLOCK_FAULT_RESET (1 of n)
[fp] CLOCK_FAULT_RESET (2 of n)`,
    files: [
      {
        filePath: "src/clock/SpacecraftClock.java",
        isEditable: true,
        language: "java",
        content: `class SpacecraftClock {
    // Time tags count tenths of a second since 2000-01-01T00:00:00, stored in
    // the 32-bit field the flight software was specified with.
    static final long TAG_MASK = 0xFFFFFFFFL;

    static long toTag(long secondsSince2000) {
        return (secondsSince2000 * 10) & TAG_MASK;
    }

    static long toSeconds(long tag) {
        return tag / 10;
    }

    static long elapsedTenths(long earlierTag, long laterTag) {
        return laterTag - earlierTag;
    }
}
`,
      },
      {
        filePath: "src/clock/FaultProtection.java",
        isEditable: false,
        language: "java",
        content: `class FaultProtection {
    // A time tag that goes backwards, or jumps more than a day between two
    // consecutive readings, is treated as a clock fault and resets the
    // computer.
    static final long MAX_STEP_TENTHS = 864000L;

    static String check(long previousTag, long currentTag) {
        long step = SpacecraftClock.elapsedTenths(previousTag, currentTag);
        if (step < 0 || step > MAX_STEP_TENTHS) return "CLOCK_FAULT_RESET";
        return "NOMINAL";
    }
}
`,
      },
    ],
    tests: [
      {
        name: "an early mission time converts to tenths",
        isHidden: false,
        source: `BugAssert.equal(SpacecraftClock.toTag(86400L), 864000L, "one day");`,
      },
      {
        name: "the August 2013 boundary does not reset the computer",
        isHidden: false,
        source: `long before = SpacecraftClock.toTag(429496729L);
long after = SpacecraftClock.toTag(429496730L);
BugAssert.equal(FaultProtection.check(before, after), "NOMINAL", "one second across 2^32 tenths");`,
      },
      {
        name: "tags past 2^32 tenths keep counting",
        isHidden: true,
        source: `BugAssert.equal(SpacecraftClock.toTag(429496730L), 4294967300L);
BugAssert.equal(SpacecraftClock.elapsedTenths(SpacecraftClock.toTag(429496729L), SpacecraftClock.toTag(429496731L)), 20L);`,
      },
      {
        name: "a time years after the boundary round-trips",
        isHidden: true,
        source: `BugAssert.equal(SpacecraftClock.toSeconds(SpacecraftClock.toTag(500000000L)), 500000000L);`,
      },
      {
        name: "a genuine backwards step is still a fault",
        isHidden: true,
        source: `BugAssert.equal(FaultProtection.check(SpacecraftClock.toTag(1000L), SpacecraftClock.toTag(999L)), "CLOCK_FAULT_RESET");`,
      },
    ],
    fixedFiles: {
      "src/clock/SpacecraftClock.java": `class SpacecraftClock {
    // Time tags count tenths of a second since 2000-01-01T00:00:00. A 32-bit
    // count of tenths runs out 429,496,729.6 s after the epoch (August 2013),
    // well inside a mission's life, so tags use all 64 bits of the long and
    // are never masked: the count keeps rising instead of wrapping to zero.
    static long toTag(long secondsSince2000) {
        return secondsSince2000 * 10;
    }

    static long toSeconds(long tag) {
        return tag / 10;
    }

    static long elapsedTenths(long earlierTag, long laterTag) {
        return laterTag - earlierTag;
    }
}
`,
    },
  },

  {
    title: "The Move That Quartered Crits",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Game Logic", "Bitwise"],
    description: `Modelled on the **Focus Energy bug in Pokémon Red and Blue** (1996). The move was meant to raise the user's chance of landing a critical hit, but the game code shifted the critical-hit value the wrong way, so using it actually **made critical hits less likely**. The bug shipped in the Generation I games.

This battle engine computes a critical-hit threshold from the attacker's base speed. Its Focus Energy branch shifts in the wrong direction.

Fix \`critThreshold\` so Focus Energy raises the threshold.`,
    bugReport: `**BUG-FOCUS** · Priority: Medium · Reported by: competitive players

critThreshold(baseSpeed, focused):
- the threshold starts at floor(baseSpeed / 2)
- Focus Energy (focused = true) multiplies it by 4 (shift LEFT by
  rules.FOCUS_SHIFT)
- the result is capped at rules.MAX_THRESHOLD (255)

isCritical(baseSpeed, focused, roll) is true when roll (0-255) < threshold.

Observed: a base-speed-100 attacker has threshold 50 normally but 12 after
using Focus Energy.`,
    logs: `[battle] crit threshold speed=100 focused=false -> 50
[battle] crit threshold speed=100 focused=true -> 12`,
    files: [
      {
        filePath: "src/battle/critical.js",
        isEditable: true,
        language: "javascript",
        content: `var rules = require("./rules");

exports.critThreshold = function (baseSpeed, focused) {
  var threshold = Math.floor(baseSpeed / 2);
  if (focused) threshold = threshold >> rules.FOCUS_SHIFT;
  return Math.min(threshold, rules.MAX_THRESHOLD);
};

exports.isCritical = function (baseSpeed, focused, roll) {
  return roll < exports.critThreshold(baseSpeed, focused);
};
`,
      },
      {
        filePath: "src/battle/rules.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Battle constants. The random roll for a critical hit is one byte (0-255),
so no threshold may exceed 255.
*/
exports.FOCUS_SHIFT = 2;
exports.MAX_THRESHOLD = 255;
`,
      },
    ],
    tests: [
      {
        name: "an unfocused attacker uses half its base speed",
        isHidden: false,
        source: `var c = require("src/battle/critical");
assert.equal(c.critThreshold(100, false), 50);
assert.equal(c.critThreshold(45, false), 22);`,
      },
      {
        name: "Focus Energy raises the threshold",
        isHidden: false,
        source: `var c = require("src/battle/critical");
assert.equal(c.critThreshold(100, true), 200, "4x, not a quarter");`,
      },
      {
        name: "the focused threshold is capped at 255",
        isHidden: true,
        source: `var c = require("src/battle/critical");
assert.equal(c.critThreshold(150, true), 255);`,
      },
      {
        name: "a focused roll that would miss unfocused now crits",
        isHidden: true,
        source: `var c = require("src/battle/critical");
assert.equal(c.isCritical(100, false, 120), false);
assert.equal(c.isCritical(100, true, 120), true);
assert.equal(c.isCritical(100, true, 200), false, "roll must be strictly below");`,
      },
    ],
    fixedFiles: {
      "src/battle/critical.js": `var rules = require("./rules");

exports.critThreshold = function (baseSpeed, focused) {
  var threshold = Math.floor(baseSpeed / 2);
  // Focus Energy must make crits more likely: shift left (x4). Shifting right
  // divided the threshold by four -- the Generation I behaviour.
  if (focused) threshold = threshold << rules.FOCUS_SHIFT;
  return Math.min(threshold, rules.MAX_THRESHOLD);
};

exports.isCritical = function (baseSpeed, focused, roll) {
  return roll < exports.critThreshold(baseSpeed, focused);
};
`,
    },
  },

  {
    title: "Two Billion Events and One More",
    difficulty: "easy",
    category: "database",
    language: "java",
    tags: ["Overflow", "SQL", "Limits"],
    description: `Modelled on the **Basecamp 3 outage of November 2018**. The primary key of the events table — a row is written for nearly every action in the product — was a signed 32-bit integer. When the ids reached **2,147,483,647**, the database refused new rows, and Basecamp 3 was effectively read-only for hours while the column was migrated to a 64-bit type.

In this reconstruction \`EventsSchema\` chooses the id column type and the threshold at which the capacity monitor pages someone. The locked \`EventsTable\` rejects an insert once the column's maximum is reached.

Fix \`EventsSchema\` so the table keeps accepting events and the monitor warns well before any ceiling.`,
    bugReport: `**BUG-BC3-IDS** · Priority: Critical · Reported by: ops

EventsSchema:
- idColumn() is the type of events.id; it must be a 64-bit column
  (IdColumn.BIGINT) so inserts continue past 2,147,483,647
- nearCapacity(lastId, column) must page when the column is at least 90%
  used: true when lastId >= column.maxValue - column.maxValue / 10
  (integer division), false below that

Observed: insert after id 2147483647 throws "Out of range value for column
'id' (INT)"; the capacity monitor never fired before that moment.`,
    logs: `[db] INSERT INTO events ... -> Out of range value for column 'id' (INT)
[app] 500 on every write since 2147483647
[monitor] events.id capacity check: OK`,
    files: [
      {
        filePath: "src/db/EventsSchema.java",
        isEditable: true,
        language: "java",
        content: `class EventsSchema {
    // events.id -- a row is appended for nearly every action in the product.
    static IdColumn idColumn() {
        return IdColumn.INT;
    }

    // Paging threshold for the id-capacity monitor.
    static boolean nearCapacity(long lastId, IdColumn column) {
        return lastId >= column.maxValue;
    }
}
`,
      },
      {
        filePath: "src/db/IdColumn.java",
        isEditable: false,
        language: "java",
        content: `class IdColumn {
    static final IdColumn INT = new IdColumn("INT", 2147483647L);
    static final IdColumn BIGINT = new IdColumn("BIGINT", 9223372036854775807L);

    final String type;
    final long maxValue;

    IdColumn(String type, long maxValue) {
        this.type = type;
        this.maxValue = maxValue;
    }
}
`,
      },
      {
        filePath: "src/db/EventsTable.java",
        isEditable: false,
        language: "java",
        content: `class EventsTable {
    private final IdColumn column;
    private long lastId;

    EventsTable(long lastId) {
        this.column = EventsSchema.idColumn();
        this.lastId = lastId;
    }

    long insert() {
        if (lastId >= column.maxValue) {
            throw new IllegalStateException("Out of range value for column 'id' (" + column.type + ")");
        }
        lastId = lastId + 1;
        return lastId;
    }

    boolean alerting() {
        return EventsSchema.nearCapacity(lastId, column);
    }
}
`,
      },
    ],
    tests: [
      {
        name: "the last int-sized id can still be written",
        isHidden: false,
        source: `EventsTable t = new EventsTable(2147483646L);
BugAssert.equal(t.insert(), 2147483647L);`,
      },
      {
        name: "inserts continue past 2,147,483,647",
        isHidden: false,
        source: `EventsTable t = new EventsTable(2147483647L);
BugAssert.equal(t.insert(), 2147483648L, "the next event id");
BugAssert.equal(t.insert(), 2147483649L);`,
      },
      {
        name: "the monitor pages at 90% of an int column",
        isHidden: true,
        source: `BugAssert.equal(EventsSchema.nearCapacity(1932735283L, IdColumn.INT), true, "exactly 90%");
BugAssert.equal(EventsSchema.nearCapacity(1932735282L, IdColumn.INT), false, "just below");
BugAssert.equal(EventsSchema.nearCapacity(2100000000L, IdColumn.INT), true);`,
      },
      {
        name: "the id column is 64-bit",
        isHidden: true,
        source: `BugAssert.equal(EventsSchema.idColumn().type, "BIGINT");
BugAssert.equal(new EventsTable(2100000000L).alerting(), false, "plenty of room in a bigint");`,
      },
      {
        name: "a bigint column also warns at 90%",
        isHidden: true,
        source: `long max = IdColumn.BIGINT.maxValue;
BugAssert.equal(EventsSchema.nearCapacity(max - max / 10, IdColumn.BIGINT), true);
BugAssert.equal(EventsSchema.nearCapacity(max / 2, IdColumn.BIGINT), false);`,
      },
    ],
    fixedFiles: {
      "src/db/EventsSchema.java": `class EventsSchema {
    // events.id -- a row is appended for nearly every action in the product,
    // so a signed 32-bit key (2,147,483,647 rows) is a matter of time, not
    // of if. 64-bit ids never run out at any realistic write rate.
    static IdColumn idColumn() {
        return IdColumn.BIGINT;
    }

    // Page while there is still room to migrate: at 90% used, not at 100%,
    // when writes are already failing. maxValue / 10 keeps the arithmetic
    // inside a long for BIGINT too.
    static boolean nearCapacity(long lastId, IdColumn column) {
        return lastId >= column.maxValue - column.maxValue / 10;
    }
}
`,
    },
  },

  {
    title: "The Backup That Deleted the Primary",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Replication", "State"],
    description: `Modelled on the **FAA NOTAM system outage of 11 January 2023**. The FAA's preliminary review found that contract personnel **unintentionally deleted files while working to correct synchronisation** between the live primary database and a backup database. The NOTAM system, which publishes notices to pilots, failed, and the FAA halted departures nationwide on the morning of 11 January.

This reconstruction's \`synchronise\` is meant to make the backup match the primary. Instead it mirrors differences in the wrong direction — deleting from the primary whatever the backup lacks — and nothing stops it removing files the service cannot run without.

Fix \`synchronise\` so the primary is the source of truth and required files are never deleted.`,
    bugReport: `**BUG-NOTAM-SYNC** · Priority: Critical · Reported by: NOTAM operations

synchronise(primary, backup) — each database is an object mapping file name
to contents; the call updates \`backup\` in place:
- the primary is the source of truth and is NEVER modified
- every primary file is copied to the backup (added, or overwritten when
  the contents differ)
- a backup file the primary does not have is deleted from the backup,
  unless its name is in REQUIRED_FILES (src/notam/required.js) — those are
  never deleted from either database
- returns { deleted: [...] }, the names removed from the backup, sorted

Observed: after a sync run, files that existed only on the primary were
gone from the primary.`,
    logs: `[sync] primary=412 files backup=398 files
[sync] removed 14 files from primary
[notam] startup failed: notam-index.dat missing`,
    files: [
      {
        filePath: "src/notam/sync.js",
        isEditable: true,
        language: "javascript",
        content: `var REQUIRED = require("./required").REQUIRED_FILES;

// Brings the two databases back into step after they drifted apart.
// Each database is a map of file name -> contents.
exports.synchronise = function (primary, backup) {
  var deleted = [];
  Object.keys(primary).forEach(function (name) {
    if (!Object.prototype.hasOwnProperty.call(backup, name)) {
      delete primary[name];
      deleted.push(name);
    }
  });
  Object.keys(primary).forEach(function (name) {
    backup[name] = primary[name];
  });
  deleted.sort();
  return { deleted: deleted };
};
`,
      },
      {
        filePath: "src/notam/required.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Files the NOTAM service cannot start without.
*/
exports.REQUIRED_FILES = ["notam-index.dat", "airport-codes.dat"];
`,
      },
    ],
    tests: [
      {
        name: "a changed file is copied to the backup",
        isHidden: false,
        source: `var sync = require("src/notam/sync");
function snap(o) { return Object.keys(o).sort().map(function (k) { return k + "=" + o[k]; }); }
var primary = { "a.dat": "v2" };
var backup = { "a.dat": "v1" };
assert.equal(sync.synchronise(primary, backup), { deleted: [] });
assert.equal(snap(backup), ["a.dat=v2"]);`,
      },
      {
        name: "a file only the primary has is copied, not deleted",
        isHidden: false,
        source: `var sync = require("src/notam/sync");
function snap(o) { return Object.keys(o).sort().map(function (k) { return k + "=" + o[k]; }); }
var primary = { "notam-index.dat": "i1", "new.dat": "n" };
var backup = { "notam-index.dat": "i0" };
sync.synchronise(primary, backup);
assert.equal(snap(primary), ["new.dat=n", "notam-index.dat=i1"], "the primary is never modified");
assert.equal(snap(backup), ["new.dat=n", "notam-index.dat=i1"]);`,
      },
      {
        name: "stale backup files are removed from the backup only",
        isHidden: true,
        source: `var sync = require("src/notam/sync");
function snap(o) { return Object.keys(o).sort().map(function (k) { return k + "=" + o[k]; }); }
var primary = { "a.dat": "1" };
var backup = { "old.dat": "x", "a.dat": "1", "gone.dat": "y" };
assert.equal(sync.synchronise(primary, backup), { deleted: ["gone.dat", "old.dat"] });
assert.equal(snap(backup), ["a.dat=1"]);
assert.equal(snap(primary), ["a.dat=1"]);`,
      },
      {
        name: "a required file is never deleted",
        isHidden: true,
        source: `var sync = require("src/notam/sync");
function snap(o) { return Object.keys(o).sort().map(function (k) { return k + "=" + o[k]; }); }
var primary = { "a.dat": "1" };
var backup = { "a.dat": "1", "airport-codes.dat": "c" };
assert.equal(sync.synchronise(primary, backup), { deleted: [] });
assert.equal(snap(backup), ["a.dat=1", "airport-codes.dat=c"]);`,
      },
      {
        name: "an empty backup is filled without touching the primary",
        isHidden: true,
        source: `var sync = require("src/notam/sync");
function snap(o) { return Object.keys(o).sort().map(function (k) { return k + "=" + o[k]; }); }
var primary = { "x.dat": "1", "notam-index.dat": "i" };
var backup = {};
assert.equal(sync.synchronise(primary, backup), { deleted: [] });
assert.equal(snap(primary), ["notam-index.dat=i", "x.dat=1"]);
assert.equal(snap(backup), ["notam-index.dat=i", "x.dat=1"]);`,
      },
    ],
    fixedFiles: {
      "src/notam/sync.js": `var REQUIRED = require("./required").REQUIRED_FILES;

// Brings the two databases back into step after they drifted apart.
// Each database is a map of file name -> contents.
exports.synchronise = function (primary, backup) {
  var deleted = [];
  // The primary is the source of truth: copy it onto the backup and never
  // write to it. Mirroring the backup's gaps onto the primary is how live
  // files got deleted.
  Object.keys(primary).forEach(function (name) {
    backup[name] = primary[name];
  });
  // Only the backup loses files, and never one the service needs to start.
  Object.keys(backup).forEach(function (name) {
    if (Object.prototype.hasOwnProperty.call(primary, name)) return;
    if (REQUIRED.indexOf(name) !== -1) return;
    delete backup[name];
    deleted.push(name);
  });
  deleted.sort();
  return { deleted: deleted };
};
`,
    },
  },

  {
    title: "The Term That Matched Every Route",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Config"],
    description: `Modelled on **Cloudflare's backbone outage of 17 July 2020**. While relieving congestion on part of its private backbone, an engineer edited the routing policy on a router in **Atlanta**. The edit left a policy term without the prefix-list condition that limited it to the site's own local routes, so the term applied to **every** route: the router advertised all of them with a high preference and pulled backbone traffic towards Atlanta instead of away from it, overloading it. Cloudflare's post-mortem describes a sharp drop in traffic across much of its network for roughly half an hour.

In this reconstruction the policy evaluator treats a term with no prefix condition as matching everything — exactly the behaviour that turned one edit into a network-wide event.

Fix \`applyPolicy\` so a term without a prefix condition fails closed instead of matching every route.`,
    bugReport: `**BUG-BACKBONE-ATL** · Priority: Critical · Reported by: network engineering

applyPolicy(routes, terms) — routes are { prefix }, terms are
{ name, prefixes, localPref }, evaluated in order:
- a term matches a route only when route.prefix is in term.prefixes
- a term whose \`prefixes\` is missing or empty matches NO route (fail
  closed); its name is reported in \`skipped\` (policy order, once each)
- the first matching term sets localPref; a route no term matches gets
  DEFAULT_LOCAL_PREF (100)
- returns { routes: [{ prefix, localPref }, ...] in input order, skipped }

Observed: after the "site-local" term lost its prefix list, every route on
the router was exported with localPref 200.`,
    logs: `[policy] term site-local: condition inactive
[bgp] exporting 1 of 1 terms -> 100% of routes localPref=200
[backbone] atl01 ingress 4x capacity, dropping`,
    files: [
      {
        filePath: "src/backbone/policy.js",
        isEditable: true,
        language: "javascript",
        content: `var DEFAULT_LOCAL_PREF = require("./defaults").DEFAULT_LOCAL_PREF;

function termMatches(term, route) {
  if (!term.prefixes || term.prefixes.length === 0) return true;
  return term.prefixes.indexOf(route.prefix) !== -1;
}

// Applies an ordered export policy to the routes a router advertises.
exports.applyPolicy = function (routes, terms) {
  var skipped = [];
  var out = routes.map(function (route) {
    for (var i = 0; i < terms.length; i++) {
      if (termMatches(terms[i], route)) {
        return { prefix: route.prefix, localPref: terms[i].localPref };
      }
    }
    return { prefix: route.prefix, localPref: DEFAULT_LOCAL_PREF };
  });
  return { routes: out, skipped: skipped };
};
`,
      },
      {
        filePath: "src/backbone/defaults.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Routes nobody has an opinion about are exported at the default preference.
A higher localPref attracts traffic towards the router that sets it.
*/
exports.DEFAULT_LOCAL_PREF = 100;
`,
      },
    ],
    tests: [
      {
        name: "a scoped term only touches its own prefixes",
        isHidden: false,
        source: `var p = require("src/backbone/policy");
var terms = [{ name: "site-local", prefixes: ["10.1.0.0/16"], localPref: 200 }];
var r = p.applyPolicy([{ prefix: "10.1.0.0/16" }, { prefix: "10.2.0.0/16" }], terms);
assert.equal(r, { routes: [{ prefix: "10.1.0.0/16", localPref: 200 }, { prefix: "10.2.0.0/16", localPref: 100 }], skipped: [] });`,
      },
      {
        name: "a term that lost its prefix condition matches nothing",
        isHidden: false,
        source: `var p = require("src/backbone/policy");
var terms = [{ name: "site-local", localPref: 200 }];
var r = p.applyPolicy([{ prefix: "10.1.0.0/16" }, { prefix: "10.2.0.0/16" }], terms);
assert.equal(r, { routes: [{ prefix: "10.1.0.0/16", localPref: 100 }, { prefix: "10.2.0.0/16", localPref: 100 }], skipped: ["site-local"] });`,
      },
      {
        name: "an empty prefix list also fails closed",
        isHidden: true,
        source: `var p = require("src/backbone/policy");
var r = p.applyPolicy([{ prefix: "a" }], [{ name: "t", prefixes: [], localPref: 300 }]);
assert.equal(r, { routes: [{ prefix: "a", localPref: 100 }], skipped: ["t"] });`,
      },
      {
        name: "a broken term does not swallow later terms",
        isHidden: true,
        source: `var p = require("src/backbone/policy");
var terms = [
  { name: "broken", localPref: 300 },
  { name: "edge", prefixes: ["p2"], localPref: 150 },
  { name: "late", prefixes: ["p2", "p3"], localPref: 250 }
];
var r = p.applyPolicy([{ prefix: "p1" }, { prefix: "p2" }, { prefix: "p3" }], terms);
assert.equal(r, { routes: [{ prefix: "p1", localPref: 100 }, { prefix: "p2", localPref: 150 }, { prefix: "p3", localPref: 250 }], skipped: ["broken"] });`,
      },
      {
        name: "skipped names each broken term once, in policy order",
        isHidden: true,
        source: `var p = require("src/backbone/policy");
var terms = [{ name: "b", prefixes: [], localPref: 1 }, { name: "ok", prefixes: ["x"], localPref: 2 }, { name: "a", localPref: 3 }];
var r = p.applyPolicy([{ prefix: "x" }, { prefix: "y" }], terms);
assert.equal(r.skipped, ["b", "a"]);
assert.equal(r.routes, [{ prefix: "x", localPref: 2 }, { prefix: "y", localPref: 100 }]);`,
      },
    ],
    fixedFiles: {
      "src/backbone/policy.js": `var DEFAULT_LOCAL_PREF = require("./defaults").DEFAULT_LOCAL_PREF;

// A term with no prefix condition is a broken term, not a wildcard. Treating
// "no condition" as "match everything" is how a single edit in Atlanta
// attracted the whole backbone: fail closed and report it instead.
function hasCondition(term) {
  return !!term.prefixes && term.prefixes.length > 0;
}

function termMatches(term, route) {
  if (!hasCondition(term)) return false;
  return term.prefixes.indexOf(route.prefix) !== -1;
}

// Applies an ordered export policy to the routes a router advertises.
exports.applyPolicy = function (routes, terms) {
  var skipped = [];
  terms.forEach(function (term) {
    if (!hasCondition(term)) skipped.push(term.name);
  });
  var out = routes.map(function (route) {
    for (var i = 0; i < terms.length; i++) {
      if (termMatches(terms[i], route)) {
        return { prefix: route.prefix, localPref: terms[i].localPref };
      }
    }
    return { prefix: route.prefix, localPref: DEFAULT_LOCAL_PREF };
  });
  return { routes: out, skipped: skipped };
};
`,
    },
  },

  {
    title: "The Storage Certificate That Lapsed",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Time", "Overflow", "Security"],
    description: `Modelled on the **Windows Azure Storage outage of 22 February 2013**. The SSL certificate used for HTTPS traffic to Azure Storage **expired**, and HTTPS requests to storage failed worldwide for many hours, taking services that depended on storage down with them. HTTP traffic was unaffected; the fix was deploying a renewed certificate.

This reconstruction is a certificate monitor that is supposed to flag any certificate within 30 days of expiry. It compares a remaining time in milliseconds with a window computed in seconds, so it only notices a certificate in the last three-quarters of an hour of its life — or once it has already expired.

Fix \`CertMonitor\` so certificates are flagged for renewal a full 30 days ahead.`,
    bugReport: `**BUG-WAS-CERT** · Priority: Critical · Reported by: storage front-end on-call

CertMonitor.status(cert, nowMillis), all times in epoch milliseconds:
- "EXPIRED" when nowMillis >= cert.notAfterMillis
- "RENEW" when the time remaining (notAfterMillis - nowMillis) is at most
  RENEW_WINDOW_DAYS (30) days
- "OK" otherwise

dueForRenewal(certs, nowMillis) returns the hosts of every certificate that
is not "OK", sorted alphabetically.

Observed: a certificate with 10 days left reported "OK" every day until it
reported "EXPIRED".`,
    logs: `[certmon] *.blob.core.windows.net remaining=864000000ms status=OK
[certmon] *.blob.core.windows.net remaining=0ms status=EXPIRED
[fe] TLS handshake failed: certificate has expired`,
    files: [
      {
        filePath: "src/tls/CertMonitor.java",
        isEditable: true,
        language: "java",
        content: `class CertMonitor {
    static final int RENEW_WINDOW_DAYS = 30;

    static String status(Certificate cert, long nowMillis) {
        long remaining = cert.notAfterMillis - nowMillis;
        if (remaining <= 0) return "EXPIRED";
        if (remaining <= RENEW_WINDOW_DAYS * 24 * 60 * 60) return "RENEW";
        return "OK";
    }

    static List<String> dueForRenewal(List<Certificate> certs, long nowMillis) {
        List<String> hosts = new ArrayList<>();
        for (Certificate c : certs) {
            if (!status(c, nowMillis).equals("OK")) hosts.add(c.host);
        }
        Collections.sort(hosts);
        return hosts;
    }
}
`,
      },
      {
        filePath: "src/tls/Certificate.java",
        isEditable: false,
        language: "java",
        content: `class Certificate {
    final String host;
    final long notBeforeMillis;
    final long notAfterMillis;

    Certificate(String host, long notBeforeMillis, long notAfterMillis) {
        this.host = host;
        this.notBeforeMillis = notBeforeMillis;
        this.notAfterMillis = notAfterMillis;
    }
}
`,
      },
    ],
    tests: [
      {
        name: "a certificate with a year left is OK",
        isHidden: false,
        source: `long day = 86400000L;
long now = 1361491200000L;
BugAssert.equal(CertMonitor.status(new Certificate("blob", now - day, now + 400 * day), now), "OK");`,
      },
      {
        name: "ten days before expiry the monitor asks for renewal",
        isHidden: false,
        source: `long day = 86400000L;
long now = 1361491200000L;
BugAssert.equal(CertMonitor.status(new Certificate("blob", now - 300 * day, now + 10 * day), now), "RENEW");`,
      },
      {
        name: "the window edges are exact",
        isHidden: true,
        source: `long day = 86400000L;
long now = 1361491200000L;
BugAssert.equal(CertMonitor.status(new Certificate("a", 0L, now + 30 * day), now), "RENEW", "exactly 30 days");
BugAssert.equal(CertMonitor.status(new Certificate("a", 0L, now + 30 * day + 1), now), "OK", "30 days and 1 ms");
BugAssert.equal(CertMonitor.status(new Certificate("a", 0L, now), now), "EXPIRED", "at notAfter");`,
      },
      {
        name: "dueForRenewal lists expiring and expired hosts",
        isHidden: true,
        source: `long day = 86400000L;
long now = 1361491200000L;
List<Certificate> certs = new ArrayList<>();
certs.add(new Certificate("table", 0L, now + 90 * day));
certs.add(new Certificate("queue", 0L, now - day));
certs.add(new Certificate("blob", 0L, now + 5 * day));
BugAssert.equal(CertMonitor.dueForRenewal(certs, now), Arrays.asList("blob", "queue"));`,
      },
    ],
    fixedFiles: {
      "src/tls/CertMonitor.java": `class CertMonitor {
    static final int RENEW_WINDOW_DAYS = 30;

    // The window must be in the same unit as the timestamps (milliseconds),
    // and computed in long arithmetic: 30 days of milliseconds is
    // 2,592,000,000, which overflows an int and would go negative.
    static final long RENEW_WINDOW_MILLIS = RENEW_WINDOW_DAYS * 24L * 60 * 60 * 1000;

    static String status(Certificate cert, long nowMillis) {
        long remaining = cert.notAfterMillis - nowMillis;
        if (remaining <= 0) return "EXPIRED";
        if (remaining <= RENEW_WINDOW_MILLIS) return "RENEW";
        return "OK";
    }

    static List<String> dueForRenewal(List<Certificate> certs, long nowMillis) {
        List<String> hosts = new ArrayList<>();
        for (Certificate c : certs) {
            if (!status(c, nowMillis).equals("OK")) hosts.add(c.host);
        }
        Collections.sort(hosts);
        return hosts;
    }
}
`,
    },
  },

  {
    title: "Any Email You Asked For",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on the **Sign in with Apple vulnerability reported by Bhavuk Jain in 2020**. During sign-in, the client could ask Apple's server for an identity token for a given email address, and the server issued a validly signed token **for whatever email was requested** without checking that it belonged to the signed-in Apple ID. Third-party apps that trusted the token's email could have been signed in to the wrong account. Apple fixed the check on its servers and paid a $100,000 bounty.

This reconstruction's token endpoint takes the email from the client's request when one is present.

Fix \`issueToken\` so the token's email always belongs to the authenticated account.`,
    bugReport: `**BUG-SIWA-EMAIL** · Priority: Critical · Reported by: security

issueToken(session, request) — session.account = { id, email, relayEmail }
(relayEmail is the account's private relay address), request =
{ clientId, email? }:
- no signed-in account (session or session.account missing) -> throw
- request.email absent -> the token's email is account.email
- request.email present -> allowed ONLY if it is account.email or
  account.relayEmail (the user choosing to hide their address); any other
  value -> throw, and no token is signed
- returns signer.sign({ sub: account.id, aud: request.clientId, email })

Observed: a signed-in user asked for a token with someone else's address in
request.email and received a valid token carrying that address.`,
    logs: `[idp] token issued sub=001234 email=victim@example.com (account email=user@example.com)`,
    files: [
      {
        filePath: "src/idp/tokens.js",
        isEditable: true,
        language: "javascript",
        content: `var signer = require("./signer");

// Issues the identity token handed back to a third-party app after the user
// signs in. session.account = { id, email, relayEmail }.
exports.issueToken = function (session, request) {
  var account = session.account;
  var email = request.email || account.email;
  return signer.sign({ sub: account.id, aud: request.clientId, email: email });
};
`,
      },
      {
        filePath: "src/idp/signer.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Stand-in for the real ES256 signer: whatever claims it is given come back
signed, so every check has to happen before this call.
*/
exports.sign = function (claims) {
  return { claims: claims, signature: "sig:" + claims.sub + ":" + claims.aud + ":" + claims.email };
};
`,
      },
    ],
    tests: [
      {
        name: "with no email requested the account's address is used",
        isHidden: false,
        source: `var t = require("src/idp/tokens");
var session = { account: { id: "001234", email: "user@example.com", relayEmail: "x1@relay.example" } };
var tok = t.issueToken(session, { clientId: "com.app" });
assert.equal(tok.claims, { sub: "001234", aud: "com.app", email: "user@example.com" });`,
      },
      {
        name: "an address the account does not own is refused",
        isHidden: false,
        source: `var t = require("src/idp/tokens");
var session = { account: { id: "001234", email: "user@example.com", relayEmail: "x1@relay.example" } };
assert.throws(function () { t.issueToken(session, { clientId: "com.app", email: "victim@example.com" }); }, "no token for another person's email");`,
      },
      {
        name: "the account's relay address may be chosen",
        isHidden: true,
        source: `var t = require("src/idp/tokens");
var session = { account: { id: "001234", email: "user@example.com", relayEmail: "x1@relay.example" } };
var tok = t.issueToken(session, { clientId: "com.app", email: "x1@relay.example" });
assert.equal(tok.claims, { sub: "001234", aud: "com.app", email: "x1@relay.example" });`,
      },
      {
        name: "another account's relay address is refused too",
        isHidden: true,
        source: `var t = require("src/idp/tokens");
var session = { account: { id: "001234", email: "user@example.com", relayEmail: "x1@relay.example" } };
assert.throws(function () { t.issueToken(session, { clientId: "com.app", email: "zz9@relay.example" }); });`,
      },
      {
        name: "no signed-in account, no token",
        isHidden: true,
        source: `var t = require("src/idp/tokens");
assert.throws(function () { t.issueToken({}, { clientId: "com.app", email: "user@example.com" }); });
assert.throws(function () { t.issueToken(null, { clientId: "com.app" }); });`,
      },
    ],
    fixedFiles: {
      "src/idp/tokens.js": `var signer = require("./signer");

// Issues the identity token handed back to a third-party app after the user
// signs in. session.account = { id, email, relayEmail }.
exports.issueToken = function (session, request) {
  if (!session || !session.account) throw new Error("not signed in");
  var account = session.account;
  var email = account.email;
  if (request.email) {
    // The signer vouches for whatever it is given, so the email must come
    // from the authenticated account: the user may pick between their own
    // real and relay addresses, never supply an arbitrary one.
    if (request.email !== account.email && request.email !== account.relayEmail) {
      throw new Error("email does not belong to the signed-in account");
    }
    email = request.email;
  }
  return signer.sign({ sub: account.id, aud: request.clientId, email: email });
};
`,
    },
  },

  {
    title: "The Track That Forgot Its Past",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["State", "Safety"],
    description: `Modelled on the **Uber ATG test-vehicle crash in Tempe, Arizona, March 2018**. The NTSB's investigation found that the automated driving system detected the pedestrian several seconds before impact but **repeatedly changed its classification** of her — between vehicle, bicycle and "other". Each time the classification changed, the system did not use the object's previous tracking history, so it could not form a path prediction for her in time.

This reconstruction's tracker starts a fresh, empty history whenever an object's label changes, even though it is the same track id. An object that keeps being relabelled never accumulates the two observations a motion estimate needs.

Fix \`Tracker\` so an object's history survives reclassification.`,
    bugReport: `**BUG-TRACK-HIST** · Priority: Critical (safety) · Reported by: perception review

Tracker, per track_id:
- observe(track_id, label, t, x, y) appends (t, x, y) to that track's
  history and sets its label to the latest one. A change of label is a
  reclassification of the SAME object: the history is kept.
- label(track_id) -> the latest label, or None for an unknown id
- predict(track_id, dt) -> [x, y] extrapolated dt seconds past the last
  observation using motion.velocity(history) (first to last observation),
  each coordinate rounded to 3 places; None for an unknown id or when
  velocity is None (fewer than two observations)
- tracks are independent: nothing about one id affects another

Observed: a pedestrian observed for three frames as vehicle, bicycle, other
has no prediction at all.`,
    logs: `[perception] track 17 label vehicle -> bicycle (history reset)
[perception] track 17 label bicycle -> other (history reset)
[planner] track 17: no predicted path`,
    files: [
      {
        filePath: "src/perception/tracker.py",
        isEditable: true,
        language: "python",
        content: `motion = bug_require("./motion.py")


class Tracker:
    def __init__(self):
        self.tracks = {}

    def observe(self, track_id, label, t, x, y):
        track = self.tracks.get(track_id)
        if track is None or track["label"] != label:
            track = {"label": label, "history": []}
            self.tracks[track_id] = track
        track["history"].append((t, x, y))

    def label(self, track_id):
        track = self.tracks.get(track_id)
        return track["label"] if track else None

    def predict(self, track_id, dt):
        track = self.tracks.get(track_id)
        if track is None:
            return None
        v = motion.velocity(track["history"])
        if v is None:
            return None
        t, x, y = track["history"][-1]
        return [round(x + v[0] * dt, 3), round(y + v[1] * dt, 3)]
`,
      },
      {
        filePath: "src/perception/motion.py",
        isEditable: false,
        language: "python",
        content: `# Motion estimate for one object from its (t, x, y) observations: the
# average velocity between the first and the last observation.


def velocity(history):
    if len(history) < 2:
        return None
    t0, x0, y0 = history[0]
    t1, x1, y1 = history[-1]
    if t1 == t0:
        return None
    return [(x1 - x0) / (t1 - t0), (y1 - y0) / (t1 - t0)]
`,
      },
    ],
    tests: [
      {
        name: "a steadily labelled object gets a prediction",
        isHidden: false,
        source: `Tracker = bug_require("src/perception/tracker.py").Tracker
tr = Tracker()
tr.observe(1, "vehicle", 0, 0, 0)
tr.observe(1, "vehicle", 2, 4, 2)
assert_.equal(tr.predict(1, 1), [6.0, 3.0])`,
      },
      {
        name: "reclassification keeps the history",
        isHidden: false,
        source: `Tracker = bug_require("src/perception/tracker.py").Tracker
tr = Tracker()
tr.observe(17, "vehicle", 0, 0, 10)
tr.observe(17, "bicycle", 1, 0, 8)
tr.observe(17, "other", 2, 0, 6)
assert_.equal(tr.predict(17, 3), [0.0, 0.0], "moving 2 m/s towards the lane")
assert_.equal(tr.label(17), "other")`,
      },
      {
        name: "a single observation cannot be extrapolated",
        isHidden: true,
        source: `Tracker = bug_require("src/perception/tracker.py").Tracker
tr = Tracker()
tr.observe(3, "other", 0, 1, 1)
assert_.equal(tr.predict(3, 1), None)
assert_.equal(tr.predict(99, 1), None)
assert_.equal(tr.label(99), None)`,
      },
      {
        name: "tracks stay independent",
        isHidden: true,
        source: `Tracker = bug_require("src/perception/tracker.py").Tracker
tr = Tracker()
tr.observe(1, "vehicle", 0, 0, 0)
tr.observe(2, "bicycle", 0, 10, 10)
tr.observe(1, "bicycle", 1, 1, 0)
tr.observe(2, "vehicle", 1, 10, 12)
tr.observe(1, "other", 2, 2, 0)
assert_.equal(tr.predict(1, 1), [3.0, 0.0])
assert_.equal(tr.predict(2, 1), [10.0, 14.0])
assert_.equal(tr.label(2), "vehicle")`,
      },
      {
        name: "the whole history is used after flip-flopping labels",
        isHidden: true,
        source: `Tracker = bug_require("src/perception/tracker.py").Tracker
tr = Tracker()
labels = ["vehicle", "other", "vehicle", "bicycle", "other"]
for i in range(5):
    tr.observe(5, labels[i], i, i * 3, 20 - i)
assert_.equal(tr.predict(5, 0), [12.0, 16.0])
assert_.equal(tr.predict(5, 2), [18.0, 14.0])`,
      },
    ],
    fixedFiles: {
      "src/perception/tracker.py": `motion = bug_require("./motion.py")


class Tracker:
    def __init__(self):
        self.tracks = {}

    def observe(self, track_id, label, t, x, y):
        track = self.tracks.get(track_id)
        if track is None:
            track = {"label": label, "history": []}
            self.tracks[track_id] = track
        # A new label is a reclassification of the same object, not a new
        # object. Discarding the history on every relabel meant an object
        # that kept being reclassified never had enough history for a path
        # prediction -- keep it and just update the label.
        track["label"] = label
        track["history"].append((t, x, y))

    def label(self, track_id):
        track = self.tracks.get(track_id)
        return track["label"] if track else None

    def predict(self, track_id, dt):
        track = self.tracks.get(track_id)
        if track is None:
            return None
        v = motion.velocity(track["history"])
        if v is None:
            return None
        t, x, y = track["history"][-1]
        return [round(x + v[0] * dt, 3), round(y + v[1] * dt, 3)]
`,
    },
  },

  {
    title: "The Reject Term Moved to the Top",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Config"],
    description: `Modelled on **Cloudflare's outage of 21 June 2022**. A change to the network configuration in **19 of its data centres** — locations that carry a large share of its traffic — **reordered the terms** of the BGP policies that decide which IP prefixes are advertised. After the reorder, a term that rejects prefixes came before the terms that accept the sites' own prefixes, so a critical subset of prefixes was withdrawn and those data centres became unreachable until the change was reverted.

This reconstruction's \`normalise\` rewrites a policy into a house layout before deployment by grouping all reject terms first — including the catch-all reject that must always be last — and \`deploy\` pushes the result with no check on what it stops advertising.

Fix the ordering, and make \`deploy\` refuse a policy that would withdraw a critical prefix.`,
    bugReport: `**BUG-MCP-ORDER** · Priority: Critical · Reported by: network engineering

Policies are ordered term lists evaluated by evaluate() (locked): the first
matching term decides; unmatched prefixes are rejected.

normalise(terms) -> a NEW array (the input is never modified):
- every term keeps its position relative to the others, except catch-all
  terms (matchAll: true), which move to the end, keeping their own
  relative order

withdrawn(terms, critical) -> the prefixes of \`critical\`, in input order,
that the policy would not accept.

deploy(terms, critical):
- normalises the policy
- if withdrawn(normalised, critical) is non-empty, throws an Error and
  deploys nothing
- otherwise returns the normalised policy

Observed: after normalise the catch-all reject was the first term, every
site prefix was withdrawn, and deploy pushed it anyway.`,
    logs: `[policy] normalise: 3 reject terms moved ahead of 4 accept terms
[bgp] withdrawing 214 prefixes from 19 sites
[deploy] policy pushed to 19 sites (no pre-deploy checks configured)`,
    files: [
      {
        filePath: "src/bgp/policy.js",
        isEditable: true,
        language: "javascript",
        content: `var evaluate = require("./evaluate").evaluate;

// Rewrites a policy into the house layout before it is pushed to the data
// centres. Returns a new array; the input is left alone.
exports.normalise = function (terms) {
  var rejects = terms.filter(function (t) { return t.action === "reject"; });
  var others = terms.filter(function (t) { return t.action !== "reject"; });
  return rejects.concat(others);
};

// The prefixes from critical that this policy would stop advertising.
exports.withdrawn = function (terms, critical) {
  return critical.filter(function (prefix) { return evaluate(terms, prefix) !== "accept"; });
};

// Normalises and returns the policy that will be deployed.
exports.deploy = function (terms, critical) {
  return exports.normalise(terms);
};
`,
      },
      {
        filePath: "src/bgp/evaluate.js",
        isEditable: false,
        language: "javascript",
        content: `/*
An export policy is an ordered list of terms. The first term that matches a
prefix decides it; a prefix that no term matches is rejected.
  { name, action: "accept" | "reject", prefixes: [...] }
  { name, action, matchAll: true }   -- a catch-all
*/
exports.evaluate = function (terms, prefix) {
  for (var i = 0; i < terms.length; i++) {
    var t = terms[i];
    if (t.matchAll || (t.prefixes && t.prefixes.indexOf(prefix) !== -1)) return t.action;
  }
  return "reject";
};
`,
      },
    ],
    tests: [
      {
        name: "withdrawn reports what a policy would not advertise",
        isHidden: false,
        source: `var p = require("src/bgp/policy");
var terms = [
  { name: "site", action: "accept", prefixes: ["a", "b"] },
  { name: "reject-rest", action: "reject", matchAll: true }
];
assert.equal(p.withdrawn(terms, ["a", "c", "b"]), ["c"]);`,
      },
      {
        name: "normalising a site policy keeps the site advertised",
        isHidden: false,
        source: `var p = require("src/bgp/policy");
var evaluate = require("src/bgp/evaluate").evaluate;
var terms = [
  { name: "site", action: "accept", prefixes: ["a", "b"] },
  { name: "reject-rest", action: "reject", matchAll: true }
];
var out = p.normalise(terms);
assert.equal(evaluate(out, "a"), "accept");
assert.equal(evaluate(out, "b"), "accept");
assert.equal(evaluate(out, "z"), "reject");`,
      },
      {
        name: "catch-alls move to the end, everything else keeps its order",
        isHidden: true,
        source: `var p = require("src/bgp/policy");
var terms = [
  { name: "reject-rest", action: "reject", matchAll: true },
  { name: "site", action: "accept", prefixes: ["a"] },
  { name: "bogons", action: "reject", prefixes: ["z"] },
  { name: "anycast", action: "accept", prefixes: ["z", "q"] },
  { name: "accept-rest", action: "accept", matchAll: true }
];
assert.equal(p.normalise(terms).map(function (t) { return t.name; }), ["site", "bogons", "anycast", "reject-rest", "accept-rest"]);`,
      },
      {
        name: "deploy refuses a policy that withdraws a critical prefix",
        isHidden: true,
        source: `var p = require("src/bgp/policy");
var terms = [
  { name: "maintenance", action: "reject", prefixes: ["a"] },
  { name: "site", action: "accept", prefixes: ["a", "b"] },
  { name: "reject-rest", action: "reject", matchAll: true }
];
assert.throws(function () { p.deploy(terms, ["a", "b"]); }, "a would be withdrawn");`,
      },
      {
        name: "deploy returns the normalised policy when it is safe",
        isHidden: true,
        source: `var p = require("src/bgp/policy");
var terms = [
  { name: "reject-rest", action: "reject", matchAll: true },
  { name: "site", action: "accept", prefixes: ["a", "b"] }
];
var before = terms.map(function (t) { return t.name; });
assert.equal(p.deploy(terms, ["a", "b"]).map(function (t) { return t.name; }), ["site", "reject-rest"]);
assert.equal(terms.map(function (t) { return t.name; }), before, "input untouched");`,
      },
    ],
    fixedFiles: {
      "src/bgp/policy.js": `var evaluate = require("./evaluate").evaluate;

// Rewrites a policy into the house layout before it is pushed to the data
// centres. Returns a new array; the input is left alone.
// Order is meaning in a first-match policy: grouping rejects first put the
// catch-all reject ahead of every accept and withdrew the sites' prefixes.
// The only move allowed is catch-alls to the end, where they belong.
exports.normalise = function (terms) {
  var specific = terms.filter(function (t) { return !t.matchAll; });
  var catchAll = terms.filter(function (t) { return !!t.matchAll; });
  return specific.concat(catchAll);
};

// The prefixes from critical that this policy would stop advertising.
exports.withdrawn = function (terms, critical) {
  return critical.filter(function (prefix) { return evaluate(terms, prefix) !== "accept"; });
};

// Normalises the policy and refuses to deploy one that would stop
// advertising a critical prefix -- a reorder must never be the thing that
// takes a site off the internet.
exports.deploy = function (terms, critical) {
  var out = exports.normalise(terms);
  var lost = exports.withdrawn(out, critical);
  if (lost.length > 0) throw new Error("policy would withdraw critical prefixes: " + lost.join(", "));
  return out;
};
`,
    },
  },

  {
    title: "The Request With Too Many Parameters",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Security", "Parsing", "Limits"],
    description: `Modelled on the **hash-collision denial-of-service advisory of December 2011** (oCERT-2011-003), presented by Alexander Klink and Julian Wälde at the 28th Chaos Communication Congress. The hash tables that web platforms — PHP, Java application servers, Python, ASP.NET and others — used to hold request parameters could be pushed into their worst case by a request carrying very many parameters, so parsing a single POST body could tie up a CPU for a long time. Among the mitigations, PHP 5.3.9 added **\`max_input_vars\`** (default 1000) and Tomcat added a maximum parameter count: stop accepting parameters past a cap.

This reconstruction's form parser has a \`maxParams\` argument but never enforces it.

Fix \`FormParser.parse\` so a body with more parameters than the cap is rejected, while normal parsing stays exactly as it is.`,
    bugReport: `**BUG-HASHDOS** · Priority: High · Reported by: platform security

FormParser.parse(body, maxParams) -> LinkedHashMap in first-seen order:
- the body is split on "&"; empty segments are ignored and do not count
- each segment splits at its FIRST "=": key before, value after (the value
  may itself contain "="); a segment with no "=" is a key with value ""
- a repeated key overwrites the earlier value but still counts as a
  parameter
- if the number of counted parameters exceeds maxParams, throw
  TooManyParametersException (the whole request is refused; exactly
  maxParams parameters is fine)
- parse(body) uses Limits.MAX_INPUT_VARS (1000)

Observed: a body with 200,000 parameters was parsed in full.`,
    logs: `[http] POST /login body=4.1MB params=200000
[http] worker 7 busy for 94s parsing form body`,
    files: [
      {
        filePath: "src/http/FormParser.java",
        isEditable: true,
        language: "java",
        content: `class FormParser {
    // Parses an application/x-www-form-urlencoded body (this service does no
    // percent-decoding). Later duplicates overwrite earlier ones.
    static Map<String, String> parse(String body, int maxParams) {
        Map<String, String> params = new LinkedHashMap<>();
        for (String pair : body.split("&")) {
            if (pair.isEmpty()) continue;
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            String value = eq < 0 ? "" : pair.substring(eq + 1);
            params.put(key, value);
        }
        return params;
    }

    static Map<String, String> parse(String body) {
        return parse(body, Limits.MAX_INPUT_VARS);
    }
}
`,
      },
      {
        filePath: "src/http/Limits.java",
        isEditable: false,
        language: "java",
        content: `class Limits {
    // Same default as PHP's max_input_vars.
    static final int MAX_INPUT_VARS = 1000;
}

class TooManyParametersException extends RuntimeException {
    TooManyParametersException(int limit) {
        super("request has more than " + limit + " parameters");
    }
}
`,
      },
    ],
    tests: [
      {
        name: "a normal form parses",
        isHidden: false,
        source: `Map<String, String> m = FormParser.parse("user=kai&remember=1", 10);
BugAssert.equal(m.toString(), "{user=kai, remember=1}");`,
      },
      {
        name: "a body over the cap is refused",
        isHidden: false,
        source: `StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1001; i++) { if (i > 0) sb.append('&'); sb.append("k").append(i).append("=1"); }
boolean refused = false;
try { FormParser.parse(sb.toString(), 1000); } catch (TooManyParametersException ex) { refused = true; }
BugAssert.ok(refused, "1001 parameters with a cap of 1000");`,
      },
      {
        name: "exactly the cap is accepted, and parse(body) uses 1000",
        isHidden: true,
        source: `StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) { if (i > 0) sb.append('&'); sb.append("k").append(i).append("=1"); }
BugAssert.equal(FormParser.parse(sb.toString(), 1000).size(), 1000);
BugAssert.equal(FormParser.parse(sb.toString()).size(), 1000);
boolean refused = false;
try { FormParser.parse(sb.toString() + "&extra=1"); } catch (TooManyParametersException ex) { refused = true; }
BugAssert.ok(refused, "default cap");`,
      },
      {
        name: "empty segments, bare keys and '=' in values",
        isHidden: true,
        source: `BugAssert.equal(FormParser.parse("a=1&&flag&b=x=y&", 3).toString(), "{a=1, flag=, b=x=y}");
boolean refused = false;
try { FormParser.parse("a=1&&flag&b=x=y&", 2); } catch (TooManyParametersException ex) { refused = true; }
BugAssert.ok(refused, "three real parameters, cap two");`,
      },
      {
        name: "repeated keys still count",
        isHidden: true,
        source: `BugAssert.equal(FormParser.parse("a=1&a=2&a=3", 3).toString(), "{a=3}");
boolean refused = false;
try { FormParser.parse("a=1&a=2&a=3", 2); } catch (TooManyParametersException ex) { refused = true; }
BugAssert.ok(refused, "duplicates are parameters too");`,
      },
    ],
    fixedFiles: {
      "src/http/FormParser.java": `class FormParser {
    // Parses an application/x-www-form-urlencoded body (this service does no
    // percent-decoding). Later duplicates overwrite earlier ones.
    static Map<String, String> parse(String body, int maxParams) {
        Map<String, String> params = new LinkedHashMap<>();
        int count = 0;
        for (String pair : body.split("&")) {
            if (pair.isEmpty()) continue;
            // Count before inserting: a request with an unbounded number of
            // parameters is an unbounded amount of hash-table work, and with
            // colliding keys each insert gets slower. Refuse at the cap (as
            // PHP's max_input_vars does) instead of parsing it all.
            count++;
            if (count > maxParams) throw new TooManyParametersException(maxParams);
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            String value = eq < 0 ? "" : pair.substring(eq + 1);
            params.put(key, value);
        }
        return params;
    }

    static Map<String, String> parse(String body) {
        return parse(body, Limits.MAX_INPUT_VARS);
    }
}
`,
    },
  },

  {
    title: "The Email Claim Anyone Could Set",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on **"nOAuth"**, disclosed by Descope in June 2023. In Microsoft Azure AD (now Entra ID), the \`email\` claim of a multi-tenant app's sign-in token is a mutable, unverified attribute that an administrator of *any* tenant can set. Apps that used that claim to find or merge user accounts could therefore sign someone into another person's account. Microsoft's guidance is to identify users by the immutable **\`oid\`** (object id) together with **\`tid\`** (tenant id), never by email.

This reconstruction's \`signIn\` looks users up by the token's email and links the account to whichever tenant presented it.

Fix \`signIn\` so accounts are keyed on \`tid\` + \`oid\`.`,
    bugReport: `**BUG-NOAUTH** · Priority: Critical · Reported by: security

signIn(store, claims) — claims come from a signature-verified ID token:
{ tid, oid, email }. The account key is tid + "/" + oid.
- tid or oid missing/empty -> throw
- a user whose azureKey equals the key -> return that user (whatever the
  email claim says now; the stored user is not modified)
- otherwise create a NEW user with store.add(claims.email, key) and return
  it. Never attach the identity to an existing user because the email
  matches — not even an account that has no azureKey yet.

Observed: a user from another tenant whose email claim was set to an
existing customer's address was signed in as that customer.`,
    logs: `[sso] sign-in tid=2f9c… oid=a71e… email=ana@corp.example -> user u1
[sso] user u1 azureKey changed 7b20…/0c4d… -> 2f9c…/a71e…`,
    files: [
      {
        filePath: "src/sso/link.js",
        isEditable: true,
        language: "javascript",
        content: `// Signs a user in from a verified Microsoft identity platform ID token.
// claims = { tid, oid, email }
exports.signIn = function (store, claims) {
  var user = store.find(function (u) { return u.email === claims.email; });
  if (user) {
    user.azureKey = claims.tid + "/" + claims.oid;
    return user;
  }
  return store.add(claims.email, claims.tid + "/" + claims.oid);
};
`,
      },
      {
        filePath: "src/sso/users.js",
        isEditable: false,
        language: "javascript",
        content: `/*
In-memory user store. A user is { id, email, azureKey }; azureKey is
"<tid>/<oid>" once the account signs in with Microsoft, null for accounts
created with a password.
*/
exports.createStore = function (users) {
  var rows = users.slice();
  var nextId = rows.length + 1;
  return {
    find: function (pred) {
      for (var i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i];
      return null;
    },
    add: function (email, azureKey) {
      var u = { id: "u" + nextId, email: email, azureKey: azureKey };
      nextId++;
      rows.push(u);
      return u;
    },
    all: function () { return rows; }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "a returning user reaches their own account",
        isHidden: false,
        source: `var link = require("src/sso/link");
var store = require("src/sso/users").createStore([{ id: "u1", email: "ana@corp.example", azureKey: "t1/o1" }]);
assert.equal(link.signIn(store, { tid: "t1", oid: "o1", email: "ana@corp.example" }).id, "u1");`,
      },
      {
        name: "another tenant claiming the same email gets its own account",
        isHidden: false,
        source: `var link = require("src/sso/link");
var store = require("src/sso/users").createStore([{ id: "u1", email: "ana@corp.example", azureKey: "t1/o1" }]);
var u = link.signIn(store, { tid: "t2", oid: "o9", email: "ana@corp.example" });
assert.ok(u.id !== "u1", "must not be Ana's account");
assert.equal(store.find(function (x) { return x.id === "u1"; }).azureKey, "t1/o1", "Ana's link untouched");`,
      },
      {
        name: "a changed email still resolves to the same account",
        isHidden: true,
        source: `var link = require("src/sso/link");
var store = require("src/sso/users").createStore([{ id: "u1", email: "ana@corp.example", azureKey: "t1/o1" }]);
var u = link.signIn(store, { tid: "t1", oid: "o1", email: "ana.new@corp.example" });
assert.equal(u, { id: "u1", email: "ana@corp.example", azureKey: "t1/o1" });
assert.equal(store.all().length, 1);`,
      },
      {
        name: "a password account is not linked by email",
        isHidden: true,
        source: `var link = require("src/sso/link");
var store = require("src/sso/users").createStore([{ id: "u1", email: "bo@corp.example", azureKey: null }]);
var u = link.signIn(store, { tid: "t3", oid: "o3", email: "bo@corp.example" });
assert.equal(u, { id: "u2", email: "bo@corp.example", azureKey: "t3/o3" });
assert.equal(store.find(function (x) { return x.id === "u1"; }).azureKey, null);`,
      },
      {
        name: "a token without tid or oid is refused",
        isHidden: true,
        source: `var link = require("src/sso/link");
var store = require("src/sso/users").createStore([]);
assert.throws(function () { link.signIn(store, { tid: "t1", email: "x@corp.example" }); });
assert.throws(function () { link.signIn(store, { oid: "o1", email: "x@corp.example" }); });
assert.equal(store.all().length, 0);`,
      },
    ],
    fixedFiles: {
      "src/sso/link.js": `// Signs a user in from a verified Microsoft identity platform ID token.
// claims = { tid, oid, email }
exports.signIn = function (store, claims) {
  // The email claim is mutable and, in a multi-tenant app, set by whichever
  // tenant's admin issued it -- it identifies nobody. The object id within
  // its tenant is immutable, so tid + oid is the only account key.
  if (!claims.tid || !claims.oid) throw new Error("token has no tid/oid");
  var key = claims.tid + "/" + claims.oid;
  var user = store.find(function (u) { return u.azureKey === key; });
  if (user) return user;
  // Never merge into an existing account on a matching email.
  return store.add(claims.email, key);
};
`,
    },
  },

  {
    title: "Drill or Live, Same Prompt",
    difficulty: "hard",
    category: "frontend",
    language: "javascript",
    tags: ["UX", "Validation", "State"],
    description: `Modelled on the **Hawaii false missile alert of 13 January 2018**. During a shift-change drill at the Hawaii Emergency Management Agency, a live ballistic missile alert was sent to phones, TV and radio across the state; a correction took 38 minutes. The FCC's investigation found, among other failures, that the alert software offered drill and live templates side by side and asked the **same confirmation question for both**, and that nothing required a second person before a live alert went out.

This reconstruction's alert console asks one generic question for every template and sends a live alert on the same "yes" as a drill.

Fix \`prepare\` and \`send\` so a live alert has its own confirmation and a second approver.`,
    bugReport: `**BUG-HI-EMA** · Priority: Critical · Reported by: agency review

prepare(templateId, operator) -> { templateId, operator, prompt,
requiresApprover }; an unknown templateId throws.
- drill template (live: false): prompt = PROMPTS.DRILL,
  requiresApprover = false
- live template (live: true): prompt = PROMPTS.LIVE, requiresApprover = true

send(pending, input), input = { typed, approver }; returns
{ sent, channel } — decided from the TEMPLATE's live flag, never trusting
fields of \`pending\` other than templateId and operator:
- drill: sent when typed === "yes" -> { sent: true, channel: "drill" }
- live: sent ONLY when typed === "LIVE" AND approver is a non-empty string
  different from pending.operator -> { sent: true, channel: "public" }
- anything else -> { sent: false, channel: null }

Observed: the live template showed the same "Are you sure…" prompt as the
drill, and "yes" from a single operator broadcast it to the public.`,
    logs: `[console] op=E1 selected PACOM-CDW prompt="Are you sure that you want to send this Alert?"
[console] op=E1 confirmed "yes" -> channel=public
[console] correction issued +38m`,
    files: [
      {
        filePath: "src/alerts/console.js",
        isEditable: true,
        language: "javascript",
        content: `var templates = require("./templates");

function findTemplate(id) {
  for (var i = 0; i < templates.TEMPLATES.length; i++) {
    if (templates.TEMPLATES[i].id === id) return templates.TEMPLATES[i];
  }
  throw new Error("unknown template " + id);
}

// Step 1: the operator picks a template from the menu.
exports.prepare = function (templateId, operator) {
  var t = findTemplate(templateId);
  return {
    templateId: t.id,
    operator: operator,
    prompt: "Are you sure that you want to send this Alert?",
    requiresApprover: false
  };
};

// Step 2: the operator answers the prompt.
exports.send = function (pending, input) {
  var t = findTemplate(pending.templateId);
  if (input.typed !== "yes") return { sent: false, channel: null };
  return { sent: true, channel: t.live ? "public" : "drill" };
};
`,
      },
      {
        filePath: "src/alerts/templates.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Templates in the operator's menu. The drill and live versions of the same
alert sit next to each other.
*/
exports.TEMPLATES = [
  { id: "DRILL-PACOM-CDW", live: false, text: "EXERCISE EXERCISE EXERCISE - missile alert drill" },
  { id: "PACOM-CDW", live: true, text: "Missile threat alert - seek shelter" },
  { id: "DRILL-TSUNAMI", live: false, text: "EXERCISE - tsunami warning drill" }
];

exports.PROMPTS = {
  DRILL: "Send DRILL alert? Nothing is broadcast to the public. Type yes to confirm.",
  LIVE: "LIVE ALERT: this will be broadcast to the public. Type LIVE to confirm. A second approver is required."
};
`,
      },
    ],
    tests: [
      {
        name: "a drill goes out on yes",
        isHidden: false,
        source: `var c = require("src/alerts/console");
var p = c.prepare("DRILL-PACOM-CDW", "E1");
assert.equal(c.send(p, { typed: "yes" }), { sent: true, channel: "drill" });
assert.equal(c.send(p, { typed: "no" }), { sent: false, channel: null });`,
      },
      {
        name: "a live alert gets its own prompt and needs an approver",
        isHidden: false,
        source: `var c = require("src/alerts/console");
var PROMPTS = require("src/alerts/templates").PROMPTS;
assert.equal(c.prepare("PACOM-CDW", "E1"), { templateId: "PACOM-CDW", operator: "E1", prompt: PROMPTS.LIVE, requiresApprover: true });`,
      },
      {
        name: "yes is not enough for a live alert",
        isHidden: true,
        source: `var c = require("src/alerts/console");
var p = c.prepare("PACOM-CDW", "E1");
assert.equal(c.send(p, { typed: "yes", approver: "S2" }), { sent: false, channel: null });`,
      },
      {
        name: "a live alert needs a different second person",
        isHidden: true,
        source: `var c = require("src/alerts/console");
var p = c.prepare("PACOM-CDW", "E1");
assert.equal(c.send(p, { typed: "LIVE" }), { sent: false, channel: null }, "no approver");
assert.equal(c.send(p, { typed: "LIVE", approver: "" }), { sent: false, channel: null }, "empty approver");
assert.equal(c.send(p, { typed: "LIVE", approver: "E1" }), { sent: false, channel: null }, "self-approval");
assert.equal(c.send(p, { typed: "LIVE", approver: "S2" }), { sent: true, channel: "public" });`,
      },
      {
        name: "send decides from the template, not the pending object",
        isHidden: true,
        source: `var c = require("src/alerts/console");
var forged = { templateId: "PACOM-CDW", operator: "E1", prompt: "x", requiresApprover: false };
assert.equal(c.send(forged, { typed: "yes" }), { sent: false, channel: null });
var PROMPTS = require("src/alerts/templates").PROMPTS;
assert.equal(c.prepare("DRILL-TSUNAMI", "E1"), { templateId: "DRILL-TSUNAMI", operator: "E1", prompt: PROMPTS.DRILL, requiresApprover: false });
assert.throws(function () { c.prepare("NOPE", "E1"); });`,
      },
    ],
    fixedFiles: {
      "src/alerts/console.js": `var templates = require("./templates");

function findTemplate(id) {
  for (var i = 0; i < templates.TEMPLATES.length; i++) {
    if (templates.TEMPLATES[i].id === id) return templates.TEMPLATES[i];
  }
  throw new Error("unknown template " + id);
}

// Step 1: the operator picks a template from the menu.
// Drill and live sit next to each other in the menu, so the confirmation is
// the last chance to notice which one was picked: it must say which it is,
// and a live alert must ask for more than a reflexive "yes".
exports.prepare = function (templateId, operator) {
  var t = findTemplate(templateId);
  return {
    templateId: t.id,
    operator: operator,
    prompt: t.live ? templates.PROMPTS.LIVE : templates.PROMPTS.DRILL,
    requiresApprover: t.live
  };
};

// Step 2: the operator answers the prompt. The template decides the rules,
// not the pending object: a live alert needs "LIVE" typed out and a second
// person who is not the operator.
exports.send = function (pending, input) {
  var t = findTemplate(pending.templateId);
  if (!t.live) {
    if (input.typed !== "yes") return { sent: false, channel: null };
    return { sent: true, channel: "drill" };
  }
  var approver = input.approver;
  var approved = typeof approver === "string" && approver.length > 0 && approver !== pending.operator;
  if (input.typed !== "LIVE" || !approved) return { sent: false, channel: null };
  return { sent: true, channel: "public" };
};
`,
    },
  },

  {
    title: "The Block Only Half the Network Accepted",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Consensus", "Limits"],
    description: `Modelled on the **Bitcoin chain fork of 11 March 2013**, documented in **BIP 50**. Version 0.8 had moved block storage from BerkeleyDB to LevelDB. A large block mined by a 0.8 node needed more database locks than 0.7 nodes' BerkeleyDB configuration allowed, so 0.7 nodes **rejected** a block that 0.8 nodes **accepted**, and the chain split in two. The fork was resolved within hours when miners moved back to 0.7-compatible software so the 0.7 side became the longest chain. The limit had never been a written rule — it was an accident of one version's storage layer — and BIP 50 records how later releases enforced a compatible limit explicitly for a period.

This reconstruction has two validators. The 0.7 one lets its local database lock limit decide whether a block is valid; the 0.8 one applies no limit at all.

Fix the validators so both apply the same explicit rule and can never disagree.`,
    bugReport: `**BUG-BIP50** · Priority: Critical (consensus) · Reported by: core developers

A block is valid iff rules.structurally_valid(block) AND
rules.locks_needed(block) <= rules.MAX_BLOCK_LOCKS (10000, inclusive).

- validate_v07(block, db_lock_limit) and validate_v08(block) must both
  return exactly that verdict. db_lock_limit is a node's local storage
  tuning; it must NOT influence validity.
- chain_splits(blocks, db_lock_limit) -> hashes of the blocks on which the
  two versions disagree, in input order (after the fix: always []).

Observed: a block needing 5,998 locks was accepted by 0.8 nodes and
rejected by 0.7 nodes configured with 5,000 locks; a block needing 10,001
locks is accepted by 0.8.`,
    logs: `[v0.7] block 0000…a1f2 rejected: database lock limit exceeded
[v0.8] block 0000…a1f2 accepted height=225430
[net] two chains: 0.8 tip=225431, 0.7 tip=225429`,
    files: [
      {
        filePath: "src/chain/validators.py",
        isEditable: true,
        language: "python",
        content: `rules = bug_require("./rules.py")


def validate_v07(block, db_lock_limit):
    # 0.7 connects blocks through its local database; an update that needs
    # more locks than the database is configured for fails.
    if not rules.structurally_valid(block):
        return False
    if rules.locks_needed(block) > db_lock_limit:
        return False
    return True


def validate_v08(block):
    return rules.structurally_valid(block)


def chain_splits(blocks, db_lock_limit):
    return [b["hash"] for b in blocks
            if validate_v07(b, db_lock_limit) != validate_v08(b)]
`,
      },
      {
        filePath: "src/chain/rules.py",
        isEditable: false,
        language: "python",
        content: `# Consensus rules every node must apply identically.
# A block is {"hash": str, "txs": [{"inputs": int, "coinbase": bool}, ...]}.

MAX_BLOCK_LOCKS = 10000


def locks_needed(block):
    # Database locks needed to connect the block: one per transaction plus
    # one per input it spends.
    total = 0
    for tx in block["txs"]:
        total += tx["inputs"] + 1
    return total


def structurally_valid(block):
    txs = block.get("txs") or []
    if not txs:
        return False
    if not txs[0].get("coinbase"):
        return False
    for tx in txs[1:]:
        if tx.get("coinbase"):
            return False
    return True
`,
      },
    ],
    tests: [
      {
        name: "a small block is valid everywhere",
        isHidden: false,
        source: `v = bug_require("src/chain/validators.py")
b = {"hash": "b1", "txs": [{"inputs": 0, "coinbase": True}, {"inputs": 2, "coinbase": False}]}
assert_.equal(v.validate_v07(b, 5000), True)
assert_.equal(v.validate_v08(b), True)`,
      },
      {
        name: "a big but legal block is accepted by both versions",
        isHidden: false,
        source: `v = bug_require("src/chain/validators.py")
b = {"hash": "big", "txs": [{"inputs": 0, "coinbase": True}] + [{"inputs": 2, "coinbase": False} for _ in range(1999)]}
assert_.equal(v.validate_v07(b, 5000), True, "5998 locks is under the consensus limit")
assert_.equal(v.validate_v08(b), True)
assert_.equal(v.chain_splits([b], 5000), [])`,
      },
      {
        name: "a block over the explicit limit is rejected by both",
        isHidden: true,
        source: `v = bug_require("src/chain/validators.py")
over = {"hash": "over", "txs": [{"inputs": 0, "coinbase": True}] + [{"inputs": 3, "coinbase": False} for _ in range(2500)]}
edge = {"hash": "edge", "txs": [{"inputs": 0, "coinbase": True}] + [{"inputs": 2, "coinbase": False} for _ in range(3333)]}
assert_.equal(v.validate_v08(over), False, "10001 locks")
assert_.equal(v.validate_v07(over, 10 ** 9), False, "a roomy database does not make it valid")
assert_.equal(v.validate_v08(edge), True, "exactly 10000 locks")
assert_.equal(v.validate_v07(edge, 100), True)`,
      },
      {
        name: "structurally invalid blocks are rejected by both",
        isHidden: true,
        source: `v = bug_require("src/chain/validators.py")
bad = [
    {"hash": "empty", "txs": []},
    {"hash": "nocb", "txs": [{"inputs": 1, "coinbase": False}]},
    {"hash": "twocb", "txs": [{"inputs": 0, "coinbase": True}, {"inputs": 0, "coinbase": True}]},
]
for b in bad:
    assert_.equal(v.validate_v07(b, 5000), False, b["hash"])
    assert_.equal(v.validate_v08(b), False, b["hash"])`,
      },
      {
        name: "the two versions never disagree",
        isHidden: true,
        source: `v = bug_require("src/chain/validators.py")
def blk(h, n, inputs):
    return {"hash": h, "txs": [{"inputs": 0, "coinbase": True}] + [{"inputs": inputs, "coinbase": False} for _ in range(n)]}
blocks = [blk("a", 10, 1), blk("b", 1999, 2), blk("c", 2500, 3), blk("d", 3333, 2)]
assert_.equal(v.chain_splits(blocks, 1), [])
assert_.equal(v.chain_splits(blocks, 5000), [])
assert_.equal(v.chain_splits(blocks, 10 ** 9), [])`,
      },
    ],
    fixedFiles: {
      "src/chain/validators.py": `rules = bug_require("./rules.py")


def _consensus_valid(block):
    # Validity is a network-wide rule, so it lives in one place and is stated
    # explicitly. A limit that only exists because of how one version stores
    # blocks (0.7's database locks) splits the chain the day a block crosses
    # it; a limit that one version forgets (0.8) does the same.
    if not rules.structurally_valid(block):
        return False
    return rules.locks_needed(block) <= rules.MAX_BLOCK_LOCKS


def validate_v07(block, db_lock_limit):
    # db_lock_limit is local storage tuning; it never decides validity.
    return _consensus_valid(block)


def validate_v08(block):
    return _consensus_valid(block)


def chain_splits(blocks, db_lock_limit):
    return [b["hash"] for b in blocks
            if validate_v07(b, db_lock_limit) != validate_v08(b)]
`,
    },
  },

  {
    title: "Twelve Dollars for Google.com",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Validation", "Parsing"],
    description: `Modelled on **google.com being bought through Google Domains in September 2015**. Sanmay Ved, a former Google employee, found google.com listed as available in Google Domains and bought it for **$12**; the purchase went through, and he briefly received the domain's webmaster messages before Google cancelled the order about a minute later and rewarded him through its bug bounty programme. Google did not publish the root cause.

This reconstruction plants one plausible mechanism — not Google's actual code: the availability check reads the registry record's EPP statuses and treats a domain as taken only when it carries the \`ok\` status. A heavily protected domain carries lock statuses instead of \`ok\`, so it shows as available.

Fix \`is_available\` so any registered domain is reported as taken.`,
    bugReport: `**BUG-GDOMAINS** · Priority: Critical · Reported by: registrar review

is_available(name, registry):
- the name is normalised first: surrounding whitespace stripped, lowercased,
  one trailing "." removed; the registry is queried with the normalised name
- True ONLY when registry.lookup(...) returns None (no record)
- any record means the domain is registered and NOT available, whatever its
  statuses: "ok", lock statuses such as "clientTransferProhibited",
  "pendingDelete", or an empty list

Observed: google.com (statuses clientDeleteProhibited,
clientTransferProhibited, clientUpdateProhibited, serverDeleteProhibited,
serverTransferProhibited, serverUpdateProhibited) was offered for $12.`,
    logs: `[search] google.com statuses=[clientDeleteProhibited, clientTransferProhibited, ...] -> available
[cart] google.com added, price=12.00 USD
[order] completed`,
    files: [
      {
        filePath: "src/registrar/availability.py",
        isEditable: true,
        language: "python",
        content: `def normalise(name):
    name = name.strip().lower()
    if name.endswith("."):
        name = name[:-1]
    return name


def is_available(name, registry):
    record = registry.lookup(normalise(name))
    if record is None:
        return True
    return "ok" not in record["statuses"]
`,
      },
      {
        filePath: "src/registrar/registry.py",
        isEditable: false,
        language: "python",
        content: `# Stand-in for the registry lookup. lookup(name) returns None when the name
# is not registered, otherwise {"name": ..., "statuses": [...]}.
# Statuses are EPP codes. "ok" means a domain has no restrictions and no
# pending operations; a domain carrying locks such as
# "clientTransferProhibited" does not carry "ok" as well.


class Registry:
    def __init__(self, records):
        self.records = records
        self.queries = []

    def lookup(self, name):
        self.queries.append(name)
        return self.records.get(name)
`,
      },
    ],
    tests: [
      {
        name: "unregistered is available, a plain registration is not",
        isHidden: false,
        source: `a = bug_require("src/registrar/availability.py")
Registry = bug_require("src/registrar/registry.py").Registry
reg = Registry({"example.com": {"name": "example.com", "statuses": ["ok"]}})
assert_.equal(a.is_available("fresh-idea.com", reg), True)
assert_.equal(a.is_available("example.com", reg), False)`,
      },
      {
        name: "a locked domain is not available",
        isHidden: false,
        source: `a = bug_require("src/registrar/availability.py")
Registry = bug_require("src/registrar/registry.py").Registry
locks = ["clientDeleteProhibited", "clientTransferProhibited", "clientUpdateProhibited",
         "serverDeleteProhibited", "serverTransferProhibited", "serverUpdateProhibited"]
reg = Registry({"google.com": {"name": "google.com", "statuses": locks}})
assert_.equal(a.is_available("google.com", reg), False)`,
      },
      {
        name: "names are normalised before the lookup",
        isHidden: true,
        source: `a = bug_require("src/registrar/availability.py")
Registry = bug_require("src/registrar/registry.py").Registry
reg = Registry({"google.com": {"name": "google.com", "statuses": ["serverTransferProhibited"]}})
assert_.equal(a.is_available("  Google.COM. ", reg), False)
assert_.equal(reg.queries, ["google.com"])`,
      },
      {
        name: "every kind of record means taken",
        isHidden: true,
        source: `a = bug_require("src/registrar/availability.py")
Registry = bug_require("src/registrar/registry.py").Registry
reg = Registry({
    "empty.com": {"name": "empty.com", "statuses": []},
    "dying.com": {"name": "dying.com", "statuses": ["pendingDelete"]},
    "held.com": {"name": "held.com", "statuses": ["clientHold"]},
})
assert_.equal(a.is_available("empty.com", reg), False)
assert_.equal(a.is_available("dying.com", reg), False)
assert_.equal(a.is_available("held.com", reg), False)
assert_.equal(a.is_available("free.com", reg), True)`,
      },
    ],
    fixedFiles: {
      "src/registrar/availability.py": `def normalise(name):
    name = name.strip().lower()
    if name.endswith("."):
        name = name[:-1]
    return name


def is_available(name, registry):
    record = registry.lookup(normalise(name))
    # Availability is the absence of a record, full stop. Reading statuses
    # to decide it inverts the meaning of EPP's "ok": the most protected
    # domains carry lock statuses instead of "ok" and looked unregistered.
    return record is None
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE22_ORIGINS: Record<string, string> = {
  "The Leap Second That Went Negative": "Cloudflare · 2017 leap second",
  "Tenths of a Second Since 2000": "NASA Deep Impact · 2013",
  "The Move That Quartered Crits": "Pokémon Red/Blue · 1996",
  "Two Billion Events and One More": "Basecamp · 2018",
  "The Backup That Deleted the Primary": "FAA NOTAM · 2023",
  "The Term That Matched Every Route": "Cloudflare · 2020 backbone",
  "The Storage Certificate That Lapsed": "Microsoft Azure · 2013",
  "Any Email You Asked For": "Sign in with Apple · 2020",
  "The Track That Forgot Its Past": "Uber ATG · 2018",
  "The Reject Term Moved to the Top": "Cloudflare · 2022",
  "The Request With Too Many Parameters": "Hash-collision DoS · oCERT-2011-003",
  "The Email Claim Anyone Could Set": "Azure AD nOAuth · 2023",
  "Drill or Live, Same Prompt": "Hawaii EMA · 2018",
  "The Block Only Half the Network Accepted": "Bitcoin · BIP 50",
  "Twelve Dollars for Google.com": "Google Domains · 2015",
};
