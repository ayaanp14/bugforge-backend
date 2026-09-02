/** Wave 5 — Python bugs inspired by famous real-world incidents. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE5: BugSpec[] = [

  {
    title: "The Metric Mars Mission",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Units", "Conversion"],
    description: `Inspired by the Mars Climate Orbiter, lost in 1999 because one team produced thruster data in **pound-force seconds** and the other consumed it as **newton seconds**. No conversion, no Mars.

\`thrust.py\` ingests ground-software impulse readings (lbf·s) for the navigation stack (N·s). It currently forwards the raw number.`,
    bugReport: `**BUG-MCO-99** · Priority: $327M · Reported by: nav team

to_newton_seconds(lbf_s) must convert using 1 lbf = 4.448222 N and round to
3 decimal places.

Observed: the value passes through unconverted — every burn is ~4.45x weaker
than commanded, and the trajectory sinks into the atmosphere.`,
    logs: `[nav] AMD file impulse=100 -> burn planned with 100 N·s (expected 444.822)`,
    files: [
      {
        filePath: "src/nav/thrust.py",
        isEditable: true,
        language: "python",
        content: `# Converts ground-software impulse (pound-force seconds) to newton seconds.

LBF_TO_N = 4.448222

def to_newton_seconds(lbf_s):
    return lbf_s
`,
      },
    ],
    tests: [
      {
        name: "the conversion factor is applied",
        isHidden: false,
        source: `m = bug_require("src/nav/thrust")
assert_.equal(m.to_newton_seconds(100), 444.822)`,
      },
      {
        name: "unit impulse converts exactly",
        isHidden: false,
        source: `m = bug_require("src/nav/thrust")
assert_.equal(m.to_newton_seconds(1), 4.448)`,
      },
      {
        name: "zero stays zero",
        isHidden: true,
        source: `m = bug_require("src/nav/thrust")
assert_.equal(m.to_newton_seconds(0), 0.0)
assert_.equal(m.to_newton_seconds(2.5), 11.121)`,
      },
    ],
    fixedFiles: {
      "src/nav/thrust.py": `# Converts ground-software impulse (pound-force seconds) to newton seconds.

LBF_TO_N = 4.448222

def to_newton_seconds(lbf_s):
    return round(lbf_s * LBF_TO_N, 3)
`,
    },
  },

  {
    title: "The Patriot's Drifting Clock",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Floating Point", "Time"],
    description: `Inspired by the 1991 Patriot missile failure at Dhahran: the system clock counted tenths of a second, and converting ticks to seconds through binary floating point drifted ~0.34s after 100 hours — enough to miss an incoming Scud entirely.

\`intercept.py\` decides when the tracking window opens. Keep the math in **ticks** (integers); the shipped code converts to float seconds and compares with \`==\`.`,
    bugReport: `**BUG-DHAHRAN** · Priority: Critical · Reported by: range safety

window_open(start_ticks, now_ticks, window_seconds) — ticks are tenths:
- True once at least window_seconds have elapsed, forever after
- exact integer arithmetic: (now - start) ticks vs window_seconds * 10

Observed: after 100 hours of uptime (3,600,000 ticks) the float conversion
yields 360000.00000000006 seconds, the equality check misses, and the window
NEVER opens.`,
    logs: `[track] uptime=100h window=360000s open=False (forever)`,
    files: [
      {
        filePath: "src/defense/intercept.py",
        isEditable: true,
        language: "python",
        content: `# Opens the tracking window once enough time has elapsed.
# Ticks are tenths of a second.

def window_open(start_ticks, now_ticks, window_seconds):
    elapsed_seconds = (now_ticks - start_ticks) * 0.1
    return elapsed_seconds == window_seconds
`,
      },
    ],
    tests: [
      {
        name: "the window opens exactly on time",
        isHidden: false,
        source: `m = bug_require("src/defense/intercept")
assert_.ok(m.window_open(0, 3600000, 360000), "100 hours later, on the tick")`,
      },
      {
        name: "the window stays open afterwards",
        isHidden: false,
        source: `m = bug_require("src/defense/intercept")
assert_.ok(m.window_open(0, 3600010, 360000), "one second past must still be open")`,
      },
      {
        name: "too early stays closed",
        isHidden: false,
        source: `m = bug_require("src/defense/intercept")
assert_.ok(not m.window_open(0, 3599999, 360000))`,
      },
      {
        name: "short windows behave identically",
        isHidden: true,
        source: `m = bug_require("src/defense/intercept")
assert_.ok(m.window_open(100, 130, 3))
assert_.ok(not m.window_open(100, 129, 3))`,
      },
    ],
    fixedFiles: {
      "src/defense/intercept.py": `# Opens the tracking window once enough time has elapsed.
# Ticks are tenths of a second.

def window_open(start_ticks, now_ticks, window_seconds):
    elapsed_ticks = now_ticks - start_ticks
    return elapsed_ticks >= window_seconds * 10
`,
    },
  },

  {
    title: "The 1900 Leap Year Lie",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Dates", "Leap Years"],
    description: `Inspired by the most famous deliberate bug in software: spreadsheets treat **1900 as a leap year** (inherited from Lotus 1-2-3 and kept by Excel for compatibility). Your date library copied the naive rule.

\`calendar_rules.py\` — the Gregorian rule has three clauses, not one.`,
    bugReport: `**BUG-FEB29-1900** · Reported by: reporting pipeline

is_leap(year): divisible by 4, EXCEPT centuries, UNLESS divisible by 400.
- 1900 -> False (a century, not divisible by 400)
- 2000 -> True
- 1996 -> True

Observed: every date after 1900-02-28 in imported sheets is shifted one day.`,
    logs: `[import] serial 60 -> 1900-02-29 (a date that never existed)`,
    files: [
      {
        filePath: "src/dates/calendar_rules.py",
        isEditable: true,
        language: "python",
        content: `# Gregorian leap-year rule.

def is_leap(year):
    return year % 4 == 0
`,
      },
    ],
    tests: [
      {
        name: "1900 was not a leap year",
        isHidden: false,
        source: `m = bug_require("src/dates/calendar_rules")
assert_.ok(not m.is_leap(1900), "century rule")`,
      },
      {
        name: "2000 was a leap year",
        isHidden: false,
        source: `m = bug_require("src/dates/calendar_rules")
assert_.ok(m.is_leap(2000), "divisible by 400")`,
      },
      {
        name: "ordinary leap years still work",
        isHidden: false,
        source: `m = bug_require("src/dates/calendar_rules")
assert_.ok(m.is_leap(1996))
assert_.ok(not m.is_leap(1999))`,
      },
      {
        name: "the next century behaves",
        isHidden: true,
        source: `m = bug_require("src/dates/calendar_rules")
assert_.ok(not m.is_leap(2100))
assert_.ok(m.is_leap(2400))`,
      },
    ],
    fixedFiles: {
      "src/dates/calendar_rules.py": `# Gregorian leap-year rule.

def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
`,
    },
  },

  {
    title: "The Alarm That Slept In",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Time", "Modulo"],
    description: `Inspired by the iPhone alarm bugs that made global news two New Years in a row — recurring alarms simply didn't fire when the date math wrapped wrong.

\`alarm.py\`: given the current time and a daily alarm time, return the minutes until it next fires. An alarm set for *right now* fires **now** (0 minutes).`,
    bugReport: `**BUG-0700** · Priority: Everyone overslept · Reported by: the internet

minutes_until(now_h, now_m, alarm_h, alarm_m):
- alarm later today -> simple difference
- alarm earlier than now -> wraps to tomorrow
- alarm exactly now -> 0

Observed: alarms earlier in the day return NEGATIVE minutes, and the
scheduler treats negatives as "never".`,
    logs: `[alarm] now=23:30 alarm=07:00 -> -990 minutes -> skipped`,
    files: [
      {
        filePath: "src/clock/alarm.py",
        isEditable: true,
        language: "python",
        content: `# Minutes until the daily alarm next fires.

def minutes_until(now_h, now_m, alarm_h, alarm_m):
    now = now_h * 60 + now_m
    alarm = alarm_h * 60 + alarm_m
    return alarm - now
`,
      },
    ],
    tests: [
      {
        name: "an alarm later today is a simple difference",
        isHidden: false,
        source: `m = bug_require("src/clock/alarm")
assert_.equal(m.minutes_until(6, 30, 7, 0), 30)`,
      },
      {
        name: "an alarm earlier than now wraps to tomorrow",
        isHidden: false,
        source: `m = bug_require("src/clock/alarm")
assert_.equal(m.minutes_until(23, 30, 7, 0), 450, "7.5 hours to 07:00")`,
      },
      {
        name: "an alarm for right now fires now",
        isHidden: false,
        source: `m = bug_require("src/clock/alarm")
assert_.equal(m.minutes_until(7, 0, 7, 0), 0)`,
      },
      {
        name: "midnight edges wrap cleanly",
        isHidden: true,
        source: `m = bug_require("src/clock/alarm")
assert_.equal(m.minutes_until(23, 59, 0, 0), 1)
assert_.equal(m.minutes_until(0, 0, 23, 59), 1439)`,
      },
    ],
    fixedFiles: {
      "src/clock/alarm.py": `# Minutes until the daily alarm next fires.

def minutes_until(now_h, now_m, alarm_h, alarm_m):
    now = now_h * 60 + now_m
    alarm = alarm_h * 60 + alarm_m
    return (alarm - now) % 1440
`,
    },
  },

  {
    title: "Two Digits Too Few",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Parsing", "Y2K"],
    description: `Inspired by Y2K — billions were spent because "99" meant 1999 but "00" meant… 1900? Legacy feeds still send two-digit years, and the agreed pivot rule is: **below 30 → 2000s, otherwise 1900s**.

\`years.py\` still lives in the 20th century.`,
    bugReport: `**BUG-Y2K** · Reported by: partner integrations

parse_year(two_digits):
- "99" -> 1999
- "23" -> 2023
- "00" -> 2000
- "30" -> 1930  (the pivot)

Observed: everything gets 1900 added — customers born in "05" are 120 years
old and the compliance system keeps flagging them as deceased.`,
    logs: `[kyc] dob year "05" -> 1905 -> age 121 -> auto-flag`,
    files: [
      {
        filePath: "src/legacy/years.py",
        isEditable: true,
        language: "python",
        content: `# Expands a two-digit year from legacy feeds.

PIVOT = 30

def parse_year(two_digits):
    return 1900 + int(two_digits)
`,
      },
    ],
    tests: [
      {
        name: "high two-digits stay in the 1900s",
        isHidden: false,
        source: `m = bug_require("src/legacy/years")
assert_.equal(m.parse_year("99"), 1999)`,
      },
      {
        name: "low two-digits land in the 2000s",
        isHidden: false,
        source: `m = bug_require("src/legacy/years")
assert_.equal(m.parse_year("23"), 2023)
assert_.equal(m.parse_year("00"), 2000)`,
      },
      {
        name: "the pivot boundary is exact",
        isHidden: true,
        source: `m = bug_require("src/legacy/years")
assert_.equal(m.parse_year("29"), 2029)
assert_.equal(m.parse_year("30"), 1930)`,
      },
    ],
    fixedFiles: {
      "src/legacy/years.py": `# Expands a two-digit year from legacy feeds.

PIVOT = 30

def parse_year(two_digits):
    value = int(two_digits)
    if value < PIVOT:
        return 2000 + value
    return 1900 + value
`,
    },
  },

  {
    title: "The Index That Rounded Itself Poor",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Floating Point", "Rounding"],
    description: `Inspired by the Vancouver Stock Exchange index, which **truncated** to three decimals after every single trade in 1982 — and quietly lost half its value in 22 months while the market went up.

\`index_calc.py\` applies deltas to the index. Precision must be kept in full and rounded **only for display**.`,
    bugReport: `**BUG-VSE-1982** · Priority: High · Reported by: quant desk

- apply_deltas(start, deltas): accumulate at FULL precision
- display(value): round (not truncate!) to 3 decimals, only here

Observed: truncation inside the loop bleeds value on every update.
Five +0.0006 ticks from 1000.0 should display 1000.003 — we show 1000.0.`,
    logs: `[index] 22 months of drift: computed 524.811, true value 1098.892`,
    files: [
      {
        filePath: "src/market/index_calc.py",
        isEditable: true,
        language: "python",
        content: `# Maintains the exchange index.

def apply_deltas(start, deltas):
    value = start
    for d in deltas:
        value = int((value + d) * 1000) / 1000
    return value

def display(value):
    return int(value * 1000) / 1000
`,
      },
    ],
    tests: [
      {
        name: "tiny ticks accumulate at full precision",
        isHidden: false,
        source: `m = bug_require("src/market/index_calc")
v = m.apply_deltas(1000.0, [0.0006, 0.0006, 0.0006, 0.0006, 0.0006])
assert_.equal(m.display(v), 1000.003)`,
      },
      {
        name: "display rounds instead of truncating",
        isHidden: false,
        source: `m = bug_require("src/market/index_calc")
assert_.equal(m.display(999.9996), 1000.0)`,
      },
      {
        name: "plain arithmetic still works",
        isHidden: false,
        source: `m = bug_require("src/market/index_calc")
v = m.apply_deltas(500.0, [10.0, -3.5])
assert_.equal(m.display(v), 506.5)`,
      },
      {
        name: "many micro-ticks do not bleed value",
        isHidden: true,
        source: `m = bug_require("src/market/index_calc")
v = m.apply_deltas(100.0, [0.0004] * 10)
assert_.equal(m.display(v), 100.004)`,
      },
    ],
    fixedFiles: {
      "src/market/index_calc.py": `# Maintains the exchange index.

def apply_deltas(start, deltas):
    value = start
    for d in deltas:
        value = value + d
    return value

def display(value):
    return round(value * 1000) / 1000
`,
    },
  },

  {
    title: "Half an Emoji in the Username",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Unicode", "Encoding"],
    description: `Inspired by MySQL's legendary \`utf8\`-that-isn't (3 bytes max — real UTF-8 needs \`utf8mb4\`), and the truncation bugs that slice multi-byte characters in half on the way into a column.

\`truncate.py\` fits a username into a byte budget. It must never split a character.`,
    bugReport: `**BUG-MB4** · Priority: High · Reported by: storage

fit_bytes(text, max_bytes):
- the UTF-8 encoding of the result is at most max_bytes long
- characters are kept whole — a 4-byte emoji that doesn't fit is dropped
- keep the longest valid prefix

Observed: slicing by characters overflows the byte budget, and the write path
then hard-truncates mid-emoji, corrupting the row.`,
    logs: `[db] value for column 'display_name' exceeds byte limit; hard-truncated
[render] username shows U+FFFD replacement character`,
    files: [
      {
        filePath: "src/db/truncate.py",
        isEditable: true,
        language: "python",
        content: `# Fits text into a UTF-8 byte budget without corrupting characters.

def fit_bytes(text, max_bytes):
    return text[:max_bytes]
`,
      },
    ],
    tests: [
      {
        name: "ascii within budget is untouched",
        isHidden: false,
        source: `m = bug_require("src/db/truncate")
assert_.equal(m.fit_bytes("hello", 10), "hello")`,
      },
      {
        name: "the result never exceeds the byte budget",
        isHidden: false,
        source: `m = bug_require("src/db/truncate")
out = m.fit_bytes("hi🙂", 5)
assert_.ok(len(out.encode("utf-8")) <= 5, "budget is bytes, not characters")
assert_.equal(out, "hi", "the 4-byte emoji cannot fit in the remaining 3 bytes")`,
      },
      {
        name: "multi-byte characters are kept whole",
        isHidden: false,
        source: `m = bug_require("src/db/truncate")
assert_.equal(m.fit_bytes("héllo", 5), "héll", "é costs two bytes")`,
      },
      {
        name: "an emoji that exactly fits survives",
        isHidden: true,
        source: `m = bug_require("src/db/truncate")
assert_.equal(m.fit_bytes("a🙂b", 5), "a🙂")
assert_.equal(m.fit_bytes("🙂🙂", 8), "🙂🙂")`,
      },
    ],
    fixedFiles: {
      "src/db/truncate.py": `# Fits text into a UTF-8 byte budget without corrupting characters.

def fit_bytes(text, max_bytes):
    out = []
    used = 0
    for ch in text:
        size = len(ch.encode("utf-8"))
        if used + size > max_bytes:
            break
        out.append(ch)
        used += size
    return "".join(out)
`,
    },
  },

  {
    title: "Noon in Which Timezone?",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Timezones", "Parsing"],
    description: `Inspired by the countless "meeting at noon" disasters of naive timestamp handling. Feeds send wall-clock times WITH their UTC offset — and the parser throws the offset away, so 12:00 in Mumbai and 12:00 in New York collide.

\`clocktime.py\` normalises "HH:MM±OH:OM" to minutes-since-midnight **UTC**.`,
    bugReport: `**BUG-TZ-NAIVE** · Priority: High · Reported by: scheduling

to_utc_minutes(stamp):
- "12:00+05:30" -> 390    (12:00 IST is 06:30 UTC)
- "09:00-04:00" -> 780    (09:00 EDT is 13:00 UTC)
- wrap into [0, 1440)

Observed: the offset part is ignored entirely.`,
    logs: `[sched] "12:00+05:30" == "12:00-04:00" -> double-booked room`,
    files: [
      {
        filePath: "src/time/clocktime.py",
        isEditable: true,
        language: "python",
        content: `# Normalises "HH:MM+OH:OM" (or -OH:OM) to minutes since midnight UTC.

def to_utc_minutes(stamp):
    hh = int(stamp[0:2])
    mm = int(stamp[3:5])
    return hh * 60 + mm
`,
      },
    ],
    tests: [
      {
        name: "positive offsets subtract",
        isHidden: false,
        source: `m = bug_require("src/time/clocktime")
assert_.equal(m.to_utc_minutes("12:00+05:30"), 390)`,
      },
      {
        name: "negative offsets add",
        isHidden: false,
        source: `m = bug_require("src/time/clocktime")
assert_.equal(m.to_utc_minutes("09:00-04:00"), 780)`,
      },
      {
        name: "wrapping past midnight stays in range",
        isHidden: false,
        source: `m = bug_require("src/time/clocktime")
assert_.equal(m.to_utc_minutes("00:15+01:00"), 1395)`,
      },
      {
        name: "UTC itself is identity",
        isHidden: true,
        source: `m = bug_require("src/time/clocktime")
assert_.equal(m.to_utc_minutes("23:59+00:00"), 1439)
assert_.equal(m.to_utc_minutes("22:00-03:30"), 90)`,
      },
    ],
    fixedFiles: {
      "src/time/clocktime.py": `# Normalises "HH:MM+OH:OM" (or -OH:OM) to minutes since midnight UTC.

def to_utc_minutes(stamp):
    hh = int(stamp[0:2])
    mm = int(stamp[3:5])
    sign = 1 if stamp[5] == "+" else -1
    oh = int(stamp[6:8])
    om = int(stamp[9:11])
    offset = sign * (oh * 60 + om)
    return (hh * 60 + mm - offset) % 1440
`,
    },
  },

  {
    title: "The Ledger That Leaked Cents",
    difficulty: "easy",
    category: "database",
    language: "python",
    tags: ["Floating Point", "Money"],
    description: `Inspired by every audit that ever found the books off by a few cents — because prices took a round-trip through binary floating point. \`19.99 * 100\` is \`1998.9999…\`, and \`int()\` finishes the crime.

\`prices.py\` parses price strings into integer cents. No floats allowed anywhere.`,
    bugReport: `**BUG-1CENT** · Priority: High · Reported by: finance close

parse_cents(price) — strings with exactly 0–2 decimals:
- "19.99" -> 1999
- "0.29"  -> 29
- "5"     -> 500
- "7.5"   -> 750

Observed: "19.99" parses to 1998. Every 19.99 sale leaks a cent.`,
    logs: `[close] ledger drift this quarter: -$142.17`,
    files: [
      {
        filePath: "src/fin/prices.py",
        isEditable: true,
        language: "python",
        content: `# Parses a price string into integer cents.

def parse_cents(price):
    return int(float(price) * 100)
`,
      },
    ],
    tests: [
      {
        name: "the classic 19.99 is exact",
        isHidden: false,
        source: `m = bug_require("src/fin/prices")
assert_.equal(m.parse_cents("19.99"), 1999)`,
      },
      {
        name: "sub-dollar prices are exact",
        isHidden: false,
        source: `m = bug_require("src/fin/prices")
assert_.equal(m.parse_cents("0.29"), 29)`,
      },
      {
        name: "whole and single-decimal prices pad",
        isHidden: false,
        source: `m = bug_require("src/fin/prices")
assert_.equal(m.parse_cents("5"), 500)
assert_.equal(m.parse_cents("7.5"), 750)`,
      },
      {
        name: "large totals stay exact",
        isHidden: true,
        source: `m = bug_require("src/fin/prices")
assert_.equal(m.parse_cents("1049.95"), 104995)
assert_.equal(m.parse_cents("0.07"), 7)`,
      },
    ],
    fixedFiles: {
      "src/fin/prices.py": `# Parses a price string into integer cents.

def parse_cents(price):
    if "." in price:
        whole, frac = price.split(".")
    else:
        whole, frac = price, ""
    while len(frac) < 2:
        frac = frac + "0"
    return int(whole) * 100 + int(frac)
`,
    },
  },

  {
    title: "The Missing Table Rows",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Lookup Tables", "Null Safety"],
    description: `Inspired by the 1994 Pentium FDIV bug: five entries missing from a division lookup table inside the chip, wrong answers on rare inputs, a $475M recall. The table here is locked — some entries really are missing. The lookup path must **fall back to real division** when it hits a hole.

Fix \`fastdiv.py\`.`,
    bugReport: `**BUG-FDIV** · Priority: Recall-grade · Reported by: verification

estimate(a, d) — divide a by digit d (1..9) using the reciprocal table:
- table hit -> round(a * reciprocal, 6)
- table hole (None) -> round(a / d, 6) fallback

Observed: dividing by 7 crashes with a TypeError — exactly the class of rare
input the table forgot.`,
    logs: `[calc] 4195835 / 3145727 path -> TypeError: unsupported operand`,
    files: [
      {
        filePath: "src/chip/table.py",
        isEditable: false,
        language: "python",
        content: `# Reciprocal lookup table burned into silicon. Some rows never made it.
# DO NOT EDIT.
RECIPROCALS = {
    1: 1.0,
    2: 0.5,
    3: None,
    4: 0.25,
    5: 0.2,
    6: None,
    7: None,
    8: 0.125,
    9: None,
}
`,
      },
      {
        filePath: "src/chip/fastdiv.py",
        isEditable: true,
        language: "python",
        content: `table = bug_require("./table")

def estimate(a, d):
    return round(a * table.RECIPROCALS[d], 6)
`,
      },
    ],
    tests: [
      {
        name: "table hits divide fast and exact",
        isHidden: false,
        source: `m = bug_require("src/chip/fastdiv")
assert_.equal(m.estimate(10, 2), 5.0)
assert_.equal(m.estimate(3, 8), 0.375)`,
      },
      {
        name: "a table hole falls back to real division",
        isHidden: false,
        source: `m = bug_require("src/chip/fastdiv")
assert_.equal(m.estimate(10, 7), 1.428571)`,
      },
      {
        name: "all holes are covered",
        isHidden: true,
        source: `m = bug_require("src/chip/fastdiv")
assert_.equal(m.estimate(1, 3), 0.333333)
assert_.equal(m.estimate(2, 6), 0.333333)
assert_.equal(m.estimate(1, 9), 0.111111)`,
      },
    ],
    fixedFiles: {
      "src/chip/fastdiv.py": `table = bug_require("./table")

def estimate(a, d):
    r = table.RECIPROCALS[d]
    if r is None:
        return round(a / d, 6)
    return round(a * r, 6)
`,
    },
  },

  {
    title: "The Streak That Died at Midnight",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Time", "Timezones"],
    description: `Inspired by the streak-loss support tickets every habit app drowns in. Two bugs conspire: the "did they practice yesterday?" check is off by one, and the local-day computation ignores the user's timezone, so evening sessions land on the wrong day.

\`streak.py\` — days are integer day-numbers; offsets are minutes east of UTC.`,
    bugReport: `**BUG-STREAK** · Priority: High (App Store reviews) · Reported by: growth

- local_day(epoch_seconds, offset_minutes) = the user's local day number
- is_alive(last_practice_day, today) — alive if last practice was today OR
  yesterday

Observed: practicing twice in one day KILLS the streak, and a 22:13 UTC
session for a UTC+2 user is credited to the previous local day.`,
    logs: `[streak] user practiced today -> streak reset (?!)
[streak] 22:13Z @ UTC+2 -> counted for yesterday`,
    files: [
      {
        filePath: "src/habit/streak.py",
        isEditable: true,
        language: "python",
        content: `SECONDS_PER_DAY = 86400

def local_day(epoch_seconds, offset_minutes):
    return epoch_seconds // SECONDS_PER_DAY

def is_alive(last_practice_day, today):
    return 0 < today - last_practice_day < 2
`,
      },
    ],
    tests: [
      {
        name: "practicing today keeps the streak",
        isHidden: false,
        source: `m = bug_require("src/habit/streak")
assert_.ok(m.is_alive(19676, 19676), "same-day practice is alive")`,
      },
      {
        name: "yesterday keeps it, two days ago kills it",
        isHidden: false,
        source: `m = bug_require("src/habit/streak")
assert_.ok(m.is_alive(19675, 19676))
assert_.ok(not m.is_alive(19674, 19676))`,
      },
      {
        name: "the local day respects the offset",
        isHidden: false,
        source: `m = bug_require("src/habit/streak")
assert_.equal(m.local_day(1700000000, 120), 19676, "22:13 UTC is past midnight at UTC+2")
assert_.equal(m.local_day(1700000000, 0), 19675)`,
      },
      {
        name: "negative offsets shift the other way",
        isHidden: true,
        source: `m = bug_require("src/habit/streak")
assert_.equal(m.local_day(1700000000, -600), 19675)
assert_.equal(m.local_day(1699920000, -60), 19674, "00:00 UTC is still yesterday at UTC-1")`,
      },
    ],
    fixedFiles: {
      "src/habit/streak.py": `SECONDS_PER_DAY = 86400

def local_day(epoch_seconds, offset_minutes):
    return (epoch_seconds + offset_minutes * 60) // SECONDS_PER_DAY

def is_alive(last_practice_day, today):
    return 0 <= today - last_practice_day <= 1
`,
    },
  },

  {
    title: "The Backup That Backed Up Nothing",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Backups", "Validation"],
    description: `Inspired by GitLab's 2017 database incident, where — mid-recovery — the team discovered that of five backup mechanisms, the ones they reached for first were empty. Restore tooling must pick a candidate that is **verified and non-empty**, and prefer the newest.

\`restore.py\` currently grabs whatever is listed first.`,
    bugReport: `**BUG-GL-2017** · Priority: Existential · Reported by: incident retro

choose_source(candidates) — each {name, size_bytes, verified, created_at}:
- eligible = verified AND size_bytes > 0
- pick the eligible candidate with the LARGEST created_at
- none eligible -> raise ValueError (loudly, before deleting anything!)

Observed: the tool picked an unverified, zero-byte snapshot and reported
success.`,
    logs: `[restore] using "s3-sync" (0 bytes, unverified)
[restore] restore completed in 0.4s   <- of course it did`,
    files: [
      {
        filePath: "src/backup/restore.py",
        isEditable: true,
        language: "python",
        content: `# Picks which backup to restore from.

def choose_source(candidates):
    return candidates[0]
`,
      },
    ],
    tests: [
      {
        name: "empty snapshots are never chosen",
        isHidden: false,
        source: `m = bug_require("src/backup/restore")
picked = m.choose_source([
    {"name": "s3-sync", "size_bytes": 0, "verified": False, "created_at": 500},
    {"name": "pg-dump", "size_bytes": 900, "verified": True, "created_at": 400},
])
assert_.equal(picked["name"], "pg-dump")`,
      },
      {
        name: "the newest verified backup wins",
        isHidden: false,
        source: `m = bug_require("src/backup/restore")
picked = m.choose_source([
    {"name": "old", "size_bytes": 100, "verified": True, "created_at": 100},
    {"name": "new", "size_bytes": 100, "verified": True, "created_at": 300},
    {"name": "mid", "size_bytes": 100, "verified": True, "created_at": 200},
])
assert_.equal(picked["name"], "new")`,
      },
      {
        name: "no eligible backup raises loudly",
        isHidden: false,
        source: `m = bug_require("src/backup/restore")
assert_.throws(lambda: m.choose_source([
    {"name": "a", "size_bytes": 0, "verified": True, "created_at": 100},
    {"name": "b", "size_bytes": 100, "verified": False, "created_at": 200},
]), "must refuse rather than fake a restore")`,
      },
      {
        name: "unverified newest never beats verified older",
        isHidden: true,
        source: `m = bug_require("src/backup/restore")
picked = m.choose_source([
    {"name": "shiny", "size_bytes": 999, "verified": False, "created_at": 900},
    {"name": "solid", "size_bytes": 500, "verified": True, "created_at": 100},
])
assert_.equal(picked["name"], "solid")`,
      },
    ],
    fixedFiles: {
      "src/backup/restore.py": `# Picks which backup to restore from.

def choose_source(candidates):
    eligible = [c for c in candidates if c["verified"] and c["size_bytes"] > 0]
    if not eligible:
        raise ValueError("no verified non-empty backup available")
    best = eligible[0]
    for c in eligible[1:]:
        if c["created_at"] > best["created_at"]:
            best = c
    return best
`,
    },
  },

];
