/** Wave 4 — Java bugs inspired by famous real-world incidents. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE4: BugSpec[] = [

  {
    title: "The Zune Freeze",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Dates", "Leap Years"],
    description: `Inspired by December 31st, 2008 — the day every Microsoft Zune froze. The firmware's days-since-1980 conversion mishandled the **366th day of a leap year**, and the players locked up until the calendar bailed them out.

\`ZuneClock.java\` converts a day count into (year, dayOfYear). Day 366 of a leap year currently rolls into the next year.`,
    bugReport: `**BUG-Z2K8** · Priority: Critical · Reported by: everyone, on New Year's Eve

toDate(daysSince1980) — days start at 1 on Jan 1, 1980:
- toDate(1)   -> [1980, 1]
- toDate(366) -> [1980, 366]   (1980 is a leap year!)
- toDate(367) -> [1981, 1]

Observed: day 366 returns [1981, 0].`,
    logs: `[zune] boot day=10593 -> year=2009 dayOfYear=0 (expected 2008 / 366)`,
    files: [
      {
        filePath: "ZuneClock.java",
        isEditable: true,
        language: "java",
        content: `class ZuneClock {
    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    // days: 1-based count of days since Jan 1, 1980.
    static int[] toDate(int days) {
        int year = 1980;
        while (true) {
            int len = isLeap(year) ? 366 : 365;
            if (days > 365) {
                days -= len;
                year++;
            } else {
                break;
            }
        }
        return new int[] { year, days };
    }
}`,
      },
    ],
    tests: [
      {
        name: "day one is January 1st, 1980",
        isHidden: false,
        source: `                BugAssert.equal(ZuneClock.toDate(1), new int[] { 1980, 1 }, "day 1");`,
      },
      {
        name: "day 366 of a leap year stays in that year",
        isHidden: false,
        source: `                BugAssert.equal(ZuneClock.toDate(366), new int[] { 1980, 366 }, "Dec 31, 1980");`,
      },
      {
        name: "day 367 starts the next year",
        isHidden: false,
        source: `                BugAssert.equal(ZuneClock.toDate(367), new int[] { 1981, 1 });`,
      },
      {
        name: "the actual freeze day resolves correctly",
        isHidden: true,
        source: `                BugAssert.equal(ZuneClock.toDate(10593), new int[] { 2008, 366 }, "Dec 31, 2008");`,
      },
    ],
    fixedFiles: {
      "ZuneClock.java": `class ZuneClock {
    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    // days: 1-based count of days since Jan 1, 1980.
    static int[] toDate(int days) {
        int year = 1980;
        while (true) {
            int len = isLeap(year) ? 366 : 365;
            if (days > len) {
                days -= len;
                year++;
            } else {
                break;
            }
        }
        return new int[] { year, days };
    }
}`,
    },
  },

  {
    title: "248 Days to Reboot",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Counters"],
    description: `Inspired by the Boeing 787 directive ordering a power cycle at least every 248 days — the generator control units kept an internal counter in **hundredths of a second**, in a 32-bit signed integer. 2,147,483,647 centiseconds ≈ 248.55 days. Then it wraps negative.

\`Uptime.java\` does the same conversion — in \`int\`.`,
    bugReport: `**BUG-787** · Priority: Critical (airworthiness) · Reported by: systems review

centisAfterDays(days) must be exact for mission-length uptimes:
- 300 days = 2,592,000,000 centiseconds — bigger than any int.

Observed: 300 days comes back NEGATIVE, and the watchdog logic downstream
treats the system clock as corrupted.`,
    logs: `[gcu] uptime(300d) = -1702967296 centis
[gcu] watchdog: clock corruption suspected -> failsafe`,
    files: [
      {
        filePath: "Uptime.java",
        isEditable: true,
        language: "java",
        content: `class Uptime {
    static final int CENTIS_PER_DAY = 24 * 60 * 60 * 100;

    // Total centiseconds of uptime after the given whole days.
    static long centisAfterDays(int days) {
        int total = days * CENTIS_PER_DAY;
        return total;
    }

    // True once uptime exceeds the mandated safe window.
    static boolean rebootRequired(long centis) {
        return centis >= 248L * CENTIS_PER_DAY;
    }
}`,
      },
    ],
    tests: [
      {
        name: "one day converts exactly",
        isHidden: false,
        source: `                BugAssert.equal(Uptime.centisAfterDays(1), 8640000L, "one day");`,
      },
      {
        name: "248 days is still positive and precise",
        isHidden: false,
        source: `                BugAssert.equal(Uptime.centisAfterDays(248), 2142720000L);`,
      },
      {
        name: "300 days does not wrap negative",
        isHidden: false,
        source: `                BugAssert.equal(Uptime.centisAfterDays(300), 2592000000L, "beyond int range");`,
      },
      {
        name: "reboot flag trips past the window",
        isHidden: true,
        source: `                BugAssert.ok(Uptime.rebootRequired(Uptime.centisAfterDays(249)), "249 days requires reboot");
                BugAssert.ok(!Uptime.rebootRequired(Uptime.centisAfterDays(247)), "247 days is fine");`,
      },
    ],
    fixedFiles: {
      "Uptime.java": `class Uptime {
    static final int CENTIS_PER_DAY = 24 * 60 * 60 * 100;

    // Total centiseconds of uptime after the given whole days.
    static long centisAfterDays(int days) {
        long total = (long) days * CENTIS_PER_DAY;
        return total;
    }

    // True once uptime exceeds the mandated safe window.
    static boolean rebootRequired(long centis) {
        return centis >= 248L * CENTIS_PER_DAY;
    }
}`,
    },
  },

  {
    title: "Ariane's Sixteen Bits",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Casting"],
    description: `Inspired by Ariane 5's maiden flight in 1996: a 64-bit velocity value crammed into a 16-bit register overflowed 37 seconds after launch, the guidance computer shut down, and a $370M rocket self-destructed.

\`Telemetry.java\` packs sensor readings into 16-bit fields. The spec says **saturate** — the code says *cast and pray*.`,
    bugReport: `**BUG-501** · Priority: Existential · Reported by: guidance

pack16(value) rules:
- values inside [-32768, 32767] pass through exactly
- values beyond either bound SATURATE to that bound (never wrap!)

Observed: pack16(40000) returns -25536 — the vehicle thinks it reversed
direction at Mach 3.`,
    logs: `[guidance] BH=40000 packed=-25536
[guidance] attitude correction -> catastrophic`,
    files: [
      {
        filePath: "Telemetry.java",
        isEditable: true,
        language: "java",
        content: `class Telemetry {
    // Packs a horizontal-bias reading into a 16-bit field.
    static int pack16(int value) {
        return (short) value;
    }
}`,
      },
    ],
    tests: [
      {
        name: "in-range values pass through",
        isHidden: false,
        source: `                BugAssert.equal(Telemetry.pack16(1200), 1200);
                BugAssert.equal(Telemetry.pack16(-32768), -32768);`,
      },
      {
        name: "positive overflow saturates instead of wrapping",
        isHidden: false,
        source: `                BugAssert.equal(Telemetry.pack16(40000), 32767, "must clamp, not wrap");`,
      },
      {
        name: "negative overflow saturates too",
        isHidden: false,
        source: `                BugAssert.equal(Telemetry.pack16(-50000), -32768);`,
      },
      {
        name: "the exact boundaries survive",
        isHidden: true,
        source: `                BugAssert.equal(Telemetry.pack16(32767), 32767);
                BugAssert.equal(Telemetry.pack16(32768), 32767);
                BugAssert.equal(Telemetry.pack16(-32769), -32768);`,
      },
    ],
    fixedFiles: {
      "Telemetry.java": `class Telemetry {
    // Packs a horizontal-bias reading into a 16-bit field.
    static int pack16(int value) {
        if (value > Short.MAX_VALUE) return Short.MAX_VALUE;
        if (value < Short.MIN_VALUE) return Short.MIN_VALUE;
        return value;
    }
}`,
    },
  },

  {
    title: "The Year 2038 Problem",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Time", "Overflow"],
    description: `Inspired by the countdown every 32-bit Unix system is on: at 03:14:07 UTC on January 19, 2038, signed 32-bit epoch seconds wrap negative and the clock jumps to 1901.

\`Epoch.java\` schedules future timestamps. It still lives in 32 bits.`,
    bugReport: `**BUG-2038** · Reported by: infra futures team

futureTimestamp(nowSeconds, deltaSeconds) must stay exact past 2^31.
Scheduling 5 years from 2035 currently produces a NEGATIVE timestamp, and
every TTL comparison after it inverts.`,
    logs: `[sched] now=2051222400 (+5y) -> -2085744896`,
    files: [
      {
        filePath: "Epoch.java",
        isEditable: true,
        language: "java",
        content: `class Epoch {
    // Seconds since 1970 for a moment delta seconds in the future.
    static long futureTimestamp(long nowSeconds, long deltaSeconds) {
        int result = (int) (nowSeconds + deltaSeconds);
        return result;
    }
}`,
      },
    ],
    tests: [
      {
        name: "near-term scheduling is exact",
        isHidden: false,
        source: `                BugAssert.equal(Epoch.futureTimestamp(1700000000L, 86400L), 1700086400L);`,
      },
      {
        name: "crossing 2^31 stays positive",
        isHidden: false,
        source: `                BugAssert.equal(Epoch.futureTimestamp(2100000000L, 100000000L), 2200000000L);`,
      },
      {
        name: "the infamous instant itself",
        isHidden: true,
        source: `                BugAssert.equal(Epoch.futureTimestamp(2147483647L, 1L), 2147483648L, "one second past the 32-bit end of time");`,
      },
    ],
    fixedFiles: {
      "Epoch.java": `class Epoch {
    // Seconds since 1970 for a moment delta seconds in the future.
    static long futureTimestamp(long nowSeconds, long deltaSeconds) {
        return nowSeconds + deltaSeconds;
    }
}`,
    },
  },

  {
    title: "Gangnam Style Broke the Counter",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Counters"],
    description: `Inspired by 2014, when PSY's "Gangnam Style" blew past 2,147,483,647 views and YouTube publicly admitted their view counter needed an upgrade to 64 bits.

\`ViewCounter.java\` is still on the old math.`,
    bugReport: `**BUG-PSY** · Reported by: analytics

addViews(current, delta) must keep counting past Integer.MAX_VALUE.
Observed: the most-watched video on the platform reports -2,147,473,648 views.`,
    logs: `[stats] video=9bZkp7q19f0 views=-2147473648`,
    files: [
      {
        filePath: "ViewCounter.java",
        isEditable: true,
        language: "java",
        content: `class ViewCounter {
    static long addViews(long current, long delta) {
        int next = (int) current + (int) delta;
        return next;
    }
}`,
      },
    ],
    tests: [
      {
        name: "ordinary counting works",
        isHidden: false,
        source: `                BugAssert.equal(ViewCounter.addViews(1000L, 234L), 1234L);`,
      },
      {
        name: "crossing two billion keeps counting up",
        isHidden: false,
        source: `                BugAssert.equal(ViewCounter.addViews(2147483000L, 10000L), 2147493000L);`,
      },
      {
        name: "multi-billion tallies stay exact",
        isHidden: true,
        source: `                BugAssert.equal(ViewCounter.addViews(4999999999L, 1L), 5000000000L);`,
      },
    ],
    fixedFiles: {
      "ViewCounter.java": `class ViewCounter {
    static long addViews(long current, long delta) {
        return current + delta;
    }
}`,
    },
  },

  {
    title: "The Negative Shard",
    difficulty: "medium",
    category: "database",
    language: "java",
    tags: ["Hashing", "Overflow"],
    description: `Inspired by a bug that has paged on-call engineers at every large company: routing by \`Math.abs(key.hashCode()) % shards\` works for years — until a key whose hash is exactly \`Integer.MIN_VALUE\` arrives. \`Math.abs\` of that number is **still negative**, and the router indexes shard -8.

Fun fact baked into the tests: the string \`"polygenelubricants"\` hashes to exactly Integer.MIN_VALUE.`,
    bugReport: `**BUG-SHARD-8** · Priority: High · Reported by: storage on-call

shardFor(key, shardCount) must ALWAYS return a value in [0, shardCount) and be
stable per key.

Observed: ArrayIndexOutOfBoundsException: -8, once in a blue moon, always the
same mystery user.`,
    logs: `[router] key="polygenelubricants" -> shard -8 of 16`,
    files: [
      {
        filePath: "ShardRouter.java",
        isEditable: true,
        language: "java",
        content: `class ShardRouter {
    static int shardFor(String key, int shardCount) {
        return Math.abs(key.hashCode()) % shardCount;
    }
}`,
      },
    ],
    tests: [
      {
        name: "ordinary keys land in range and stay stable",
        isHidden: false,
        source: `                int a = ShardRouter.shardFor("user:42", 16);
                BugAssert.ok(a >= 0 && a < 16, "in range");
                BugAssert.equal(ShardRouter.shardFor("user:42", 16), a, "stable");`,
      },
      {
        name: "the Integer.MIN_VALUE hash routes safely",
        isHidden: false,
        source: `                int s = ShardRouter.shardFor("polygenelubricants", 16);
                BugAssert.ok(s >= 0 && s < 16, "hashCode == Integer.MIN_VALUE must still land in range, got " + s);`,
      },
      {
        name: "every shard count handles the cursed key",
        isHidden: true,
        source: `                for (int n = 2; n <= 32; n++) {
                    int s = ShardRouter.shardFor("polygenelubricants", n);
                    BugAssert.ok(s >= 0 && s < n, "shards=" + n + " got " + s);
                }`,
      },
    ],
    fixedFiles: {
      "ShardRouter.java": `class ShardRouter {
    static int shardFor(String key, int shardCount) {
        return Math.floorMod(key.hashCode(), shardCount);
    }
}`,
    },
  },

  {
    title: "The Auction That Closed Instantly",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Time", "Units"],
    description: `Inspired by the unit-mismatch outages that hit marketplaces: one side of a comparison speaks **seconds**, the other **milliseconds**, and suddenly every auction on the site is "already ended".

\`AuctionClock.java\` mixes the two.`,
    bugReport: `**BUG-SNIPE** · Priority: Critical · Reported by: marketplace

isClosed(closeAtSeconds, nowMillis) — auctions close AT the closing instant:
- 1 second before  -> open
- exactly at close -> closed
- 1 second after   -> closed

Observed: every auction reports closed the moment it is listed, because epoch
milliseconds are ~1000x larger than epoch seconds.`,
    logs: `[auction] listed at 1700000000s, closeAt=1700086400s, now=1700000000123ms -> CLOSED`,
    files: [
      {
        filePath: "AuctionClock.java",
        isEditable: true,
        language: "java",
        content: `class AuctionClock {
    static boolean isClosed(long closeAtSeconds, long nowMillis) {
        return nowMillis >= closeAtSeconds;
    }
}`,
      },
    ],
    tests: [
      {
        name: "an auction with time left is open",
        isHidden: false,
        source: `                BugAssert.ok(!AuctionClock.isClosed(1700086400L, 1700086399000L), "1s before close");`,
      },
      {
        name: "the closing instant closes it",
        isHidden: false,
        source: `                BugAssert.ok(AuctionClock.isClosed(1700086400L, 1700086400000L), "exactly at close");`,
      },
      {
        name: "after close stays closed",
        isHidden: true,
        source: `                BugAssert.ok(AuctionClock.isClosed(1700086400L, 1700086401000L));
                BugAssert.ok(!AuctionClock.isClosed(1700086400L, 1600000000000L));`,
      },
    ],
    fixedFiles: {
      "AuctionClock.java": `class AuctionClock {
    static boolean isClosed(long closeAtSeconds, long nowMillis) {
        return nowMillis >= closeAtSeconds * 1000L;
    }
}`,
    },
  },

  {
    title: "The February 29th Certificate",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Dates", "Leap Years"],
    description: `Inspired by Azure's 2012 leap-day outage: certificates minted on February 29th were given a validity of "same date next year" — a date that does not exist. Cert creation failed, and the failure cascaded into a global outage.

\`CertIssuer.java\` adds one year to an issue date. Naively.`,
    bugReport: `**BUG-0229-AZ** · Priority: Critical · Reported by: platform security

expiryDate(year, month, day) = issue date + 1 year:
- Feb 29 -> Feb 28 of the next year (clamp; next year is never leap+1)
- all other dates keep month/day

Observed: [2012, 2, 29] -> [2013, 2, 29], which downstream validation rejects,
which takes cert issuance down entirely.`,
    logs: `[pki] mint 2012-02-29 -> expiry 2013-02-29 INVALID DATE
[pki] issuance pipeline halted`,
    files: [
      {
        filePath: "CertIssuer.java",
        isEditable: true,
        language: "java",
        content: `class CertIssuer {
    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    static int[] expiryDate(int year, int month, int day) {
        return new int[] { year + 1, month, day };
    }
}`,
      },
    ],
    tests: [
      {
        name: "ordinary dates keep month and day",
        isHidden: false,
        source: `                BugAssert.equal(CertIssuer.expiryDate(2024, 7, 15), new int[] { 2025, 7, 15 });`,
      },
      {
        name: "leap day clamps to February 28th",
        isHidden: false,
        source: `                BugAssert.equal(CertIssuer.expiryDate(2012, 2, 29), new int[] { 2013, 2, 28 });`,
      },
      {
        name: "February 28th itself is untouched",
        isHidden: true,
        source: `                BugAssert.equal(CertIssuer.expiryDate(2023, 2, 28), new int[] { 2024, 2, 28 });
                BugAssert.equal(CertIssuer.expiryDate(2024, 2, 29), new int[] { 2025, 2, 28 });`,
      },
    ],
    fixedFiles: {
      "CertIssuer.java": `class CertIssuer {
    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    static int[] expiryDate(int year, int month, int day) {
        int nextYear = year + 1;
        if (month == 2 && day == 29 && !isLeap(nextYear)) {
            return new int[] { nextYear, 2, 28 };
        }
        return new int[] { nextYear, month, day };
    }
}`,
    },
  },

  {
    title: "Satoshis, Not Doubles",
    difficulty: "medium",
    category: "database",
    language: "java",
    tags: ["Floating Point", "Money"],
    description: `Inspired by the precision bugs that plague crypto exchanges: parse "0.29" of a coin through a \`double\`, multiply by 10^8, truncate — and you just destroyed one satoshi. Multiply that by a million trades a day.

\`AmountParser.java\` converts a decimal string into satoshis (8 decimal places). It must use integer math end to end.`,
    bugReport: `**BUG-1SAT** · Priority: High · Reported by: reconciliation

parseToSatoshis(amount) — up to 8 decimal places:
- "0.29"        -> 29000000
- "1"           -> 100000000
- "123.45678901"-> 12345678901

Observed: "0.29" parses to 28999999. The books never balance.`,
    logs: `[ledger] daily reconciliation drift: -412 sat`,
    files: [
      {
        filePath: "AmountParser.java",
        isEditable: true,
        language: "java",
        content: `class AmountParser {
    // Parses a decimal coin amount (max 8 dp) into satoshis.
    static long parseToSatoshis(String amount) {
        double value = Double.parseDouble(amount);
        return (long) (value * 100000000);
    }
}`,
      },
    ],
    tests: [
      {
        name: "the classic drift case is exact",
        isHidden: false,
        source: `                BugAssert.equal(AmountParser.parseToSatoshis("0.29"), 29000000L);`,
      },
      {
        name: "whole coins are exact",
        isHidden: false,
        source: `                BugAssert.equal(AmountParser.parseToSatoshis("1"), 100000000L);
                BugAssert.equal(AmountParser.parseToSatoshis("21"), 2100000000L);`,
      },
      {
        name: "full 8-decimal precision survives",
        isHidden: false,
        source: `                BugAssert.equal(AmountParser.parseToSatoshis("123.45678901"), 12345678901L);`,
      },
      {
        name: "short fractions pad correctly",
        isHidden: true,
        source: `                BugAssert.equal(AmountParser.parseToSatoshis("0.1"), 10000000L);
                BugAssert.equal(AmountParser.parseToSatoshis("0.00000001"), 1L);`,
      },
    ],
    fixedFiles: {
      "AmountParser.java": `class AmountParser {
    // Parses a decimal coin amount (max 8 dp) into satoshis.
    static long parseToSatoshis(String amount) {
        int dot = amount.indexOf('.');
        String whole = dot == -1 ? amount : amount.substring(0, dot);
        String frac = dot == -1 ? "" : amount.substring(dot + 1);
        while (frac.length() < 8) {
            frac = frac + "0";
        }
        long wholePart = Long.parseLong(whole) * 100000000L;
        long fracPart = Long.parseLong(frac);
        return wholePart + fracPart;
    }
}`,
    },
  },

  {
    title: "The Clock That Ran Backwards",
    difficulty: "hard",
    category: "database",
    language: "java",
    tags: ["IDs", "Clocks"],
    description: `Inspired by Twitter's Snowflake ID generator — and the NTP clock-rollback duplicates it explicitly guards against. IDs are (timestamp << 12) | sequence and must be **strictly increasing**; if the wall clock ever runs backwards, the generator must refuse rather than mint colliding IDs.

\`IdGen.java\` currently trusts the clock and never resets the sequence.`,
    bugReport: `**BUG-SNOW** · Priority: Critical · Reported by: storage

next(lastTimestamp, lastSeq, now):
- now < lastTimestamp        -> throw (clock moved backwards!)
- now == lastTimestamp       -> same tick: sequence + 1
- now >  lastTimestamp       -> new tick: sequence resets to 0
- returns id = now * 4096 + seq

Observed: duplicate IDs after an NTP correction, and sequences that never
reset — overflowing the 12-bit field within a busy second.`,
    logs: `[idgen] now=1699999999 < last=1700000042 -> id went BACKWARDS
[db] duplicate key: 6963200172032`,
    files: [
      {
        filePath: "IdGen.java",
        isEditable: true,
        language: "java",
        content: `class IdGen {
    // Returns { id, seqUsed } packed as long[2].
    static long[] next(long lastTimestamp, long lastSeq, long now) {
        long seq = lastSeq + 1;
        long id = now * 4096 + seq;
        return new long[] { id, seq };
    }
}`,
      },
    ],
    tests: [
      {
        name: "a new tick resets the sequence",
        isHidden: false,
        source: `                BugAssert.equal(IdGen.next(1000L, 7L, 1001L), new long[] { 1001L * 4096L, 0L });`,
      },
      {
        name: "the same tick increments the sequence",
        isHidden: false,
        source: `                BugAssert.equal(IdGen.next(1000L, 7L, 1000L), new long[] { 1000L * 4096L + 8L, 8L });`,
      },
      {
        name: "a backwards clock is refused",
        isHidden: false,
        source: `                boolean threw = false;
                try { IdGen.next(2000L, 0L, 1999L); } catch (Exception e) { threw = true; }
                BugAssert.ok(threw, "clock rollback must throw");`,
      },
      {
        name: "ids are strictly increasing across ticks",
        isHidden: true,
        source: `                long[] a = IdGen.next(500L, 3L, 500L);
                long[] b = IdGen.next(500L, a[1], 501L);
                BugAssert.ok(b[0] > a[0], "next tick id must be larger");`,
      },
    ],
    fixedFiles: {
      "IdGen.java": `class IdGen {
    // Returns { id, seqUsed } packed as long[2].
    static long[] next(long lastTimestamp, long lastSeq, long now) {
        if (now < lastTimestamp) {
            throw new IllegalStateException("clock moved backwards");
        }
        long seq = now == lastTimestamp ? lastSeq + 1 : 0;
        long id = now * 4096 + seq;
        return new long[] { id, seq };
    }
}`,
    },
  },

  {
    title: "The Midpoint That Overflowed",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Algorithms"],
    description: `Inspired by the bug that lived in the JDK's own \`Arrays.binarySearch\` for nine years: \`(low + high) / 2\` overflows when the endpoints are large, producing a negative midpoint. Joshua Bloch called it "nearly impossible to test for" — unless you test the midpoint itself.

\`Search.java\` exposes its midpoint helper. Make it overflow-proof.`,
    bugReport: `**BUG-JDK5045582** · Reported by: platform (with a famous blog post attached)

midpoint(low, high), both non-negative, low <= high:
- must equal the true mathematical midpoint, floored
- for low=2_000_000_000, high=2_100_000_000 the answer is 2_050_000_000

Observed: that call returns a negative number, and binary search dies with
ArrayIndexOutOfBoundsException on gigantic collections.`,
    logs: `[search] midpoint(2000000000, 2100000000) = -97483648`,
    files: [
      {
        filePath: "Search.java",
        isEditable: true,
        language: "java",
        content: `class Search {
    static int midpoint(int low, int high) {
        return (low + high) / 2;
    }

    static int indexOf(int[] sorted, int target) {
        int lo = 0, hi = sorted.length - 1;
        while (lo <= hi) {
            int mid = midpoint(lo, hi);
            if (sorted[mid] == target) return mid;
            if (sorted[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}`,
      },
    ],
    tests: [
      {
        name: "huge endpoints do not overflow",
        isHidden: false,
        source: `                BugAssert.equal(Search.midpoint(2000000000, 2100000000), 2050000000);`,
      },
      {
        name: "small midpoints floor correctly",
        isHidden: false,
        source: `                BugAssert.equal(Search.midpoint(0, 9), 4);
                BugAssert.equal(Search.midpoint(3, 4), 3);`,
      },
      {
        name: "binary search still finds its targets",
        isHidden: false,
        source: `                int[] arr = { 2, 5, 8, 13, 21, 34 };
                BugAssert.equal(Search.indexOf(arr, 13), 3);
                BugAssert.equal(Search.indexOf(arr, 4), -1);`,
      },
      {
        name: "the absolute worst case is exact",
        isHidden: true,
        source: `                BugAssert.equal(Search.midpoint(2147483645, 2147483647), 2147483646);`,
      },
    ],
    fixedFiles: {
      "Search.java": `class Search {
    static int midpoint(int low, int high) {
        return low + (high - low) / 2;
    }

    static int indexOf(int[] sorted, int target) {
        int lo = 0, hi = sorted.length - 1;
        while (lo <= hi) {
            int mid = midpoint(lo, hi);
            if (sorted[mid] == target) return mid;
            if (sorted[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}`,
    },
  },

  {
    title: "Sessions for Someone Else",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Strings", "Equality"],
    description: `Inspired by the session-mixup incidents that follow Java's most classic beginner-to-production bug: comparing strings with \`==\`. It works in unit tests (interned literals!), then fails in production the moment tokens arrive off the wire as fresh objects.

\`SessionStore.java\` decides whether a request's token matches the session owner.`,
    bugReport: `**BUG-EQEQ** · Priority: Critical (auth) · Reported by: security review

isOwner(sessionToken, requestToken):
- equal CONTENT means owner — regardless of object identity
- null request tokens are never the owner (and must not throw)

Observed: valid tokens read from the network are rejected (== compares
references), so a "helpful" fallback upstream started letting requests
through unchecked.`,
    logs: `[auth] token match failed for identical strings; fallback path engaged (!!)`,
    files: [
      {
        filePath: "SessionStore.java",
        isEditable: true,
        language: "java",
        content: `class SessionStore {
    static boolean isOwner(String sessionToken, String requestToken) {
        return sessionToken == requestToken;
    }
}`,
      },
    ],
    tests: [
      {
        name: "equal content from different objects matches",
        isHidden: false,
        source: `                String stored = "tok_";
                String wire = "tok";
                wire = wire + "_";
                BugAssert.ok(SessionStore.isOwner(stored, wire), "same content must match");`,
      },
      {
        name: "different tokens never match",
        isHidden: false,
        source: `                BugAssert.ok(!SessionStore.isOwner("tok_a", "tok_b"));`,
      },
      {
        name: "null request tokens are safely rejected",
        isHidden: true,
        source: `                BugAssert.ok(!SessionStore.isOwner("tok_a", null));`,
      },
    ],
    fixedFiles: {
      "SessionStore.java": `class SessionStore {
    static boolean isOwner(String sessionToken, String requestToken) {
        return sessionToken != null && sessionToken.equals(requestToken);
    }
}`,
    },
  },

];
