---
title: java.time — dates, times, zones and durations
minutes: 15
---
Dates are where careful programmers become humble. Months are zero-based in the old API, a day is not always 24 hours, "next month" from January 31 has no obvious answer, and the same instant is Tuesday in Tokyo and Monday in Toronto. `java.time` (Java 8, from Joda-Time's author) gets this right by refusing to blur the distinctions: an **instant** on the timeline, a **local** date or time with no zone, a **zoned** date-time, and two kinds of amount — **`Duration`** (seconds) and **`Period`** (years/months/days). Every type is immutable and thread-safe. This lesson is the map of those types, the arithmetic and formatting you do daily, and the legacy classes you must recognise and avoid.

## The types, and which question each answers

| Type | Answers | Example |
| --- | --- | --- |
| `Instant` | *when*, on the machine timeline (UTC, nanoseconds since 1970) | `2024-03-01T04:45:00Z` — timestamps, logs, `System.currentTimeMillis()` |
| `LocalDate` | a calendar date, no time, no zone | `2024-03-01` — birthdays, due dates |
| `LocalTime` | a wall-clock time, no date, no zone | `09:30` — opening hours |
| `LocalDateTime` | date + time, **no zone** — ambiguous as an instant | `2024-03-01T09:30` — a meeting "at 9:30" before you know where |
| `ZonedDateTime` | date + time + zone rules | `2024-03-01T09:30+05:30[Asia/Kolkata]` — the meeting, scheduled |
| `OffsetDateTime` | date + time + fixed offset (no DST rules) | `2024-03-01T09:30+05:30` — what databases and APIs exchange |
| `ZoneId` / `ZoneOffset` | a region's rules / a fixed offset | `Asia/Kolkata`, `+05:30` |
| `Duration` | an amount of time in seconds/nanos | `PT2H30M` — timeouts, elapsed time |
| `Period` | an amount of calendar time in years/months/days | `P1Y2M3D` — "in 3 months" |
| `Year`, `YearMonth`, `MonthDay`, `DayOfWeek`, `Month` | the partials | `2024-03`, `--12-25`, `FRIDAY` |

The discipline: use the *narrowest* type that answers the question. A birthday is a `LocalDate`; storing it as a `Date` at midnight in the server's zone is how people are born a day early in another country.

## Creating and parsing

```java
LocalDate d = LocalDate.of(2024, 3, 1);                 // months are 1-based, at last; Month.MARCH also works
LocalDate parsed = LocalDate.parse("2024-03-01");        // ISO-8601 by default
LocalTime t = LocalTime.parse("09:30");
LocalDateTime ldt = LocalDateTime.of(d, t);
ZonedDateTime z = ldt.atZone(ZoneId.of("Asia/Kolkata"));
Instant now = Instant.now();                             // or Instant.ofEpochMilli(ms)
LocalDate today = LocalDate.now(ZoneId.of("Europe/Berlin"));   // "today" depends on where — say where
```

Every `now()` takes an optional `Clock`; pass a fixed one in tests (`Clock.fixed(instant, zone)`) so code that depends on "now" becomes testable. Parsing a bad string throws `DateTimeParseException` with the index of the problem.

## Arithmetic

```java
d.plusDays(30); d.minusWeeks(2); d.plusMonths(1);       // 2024-01-31 plusMonths(1) → 2024-02-29: clamped to the month's last day
d.withDayOfMonth(1); d.with(TemporalAdjusters.lastDayOfMonth()); d.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
d.getDayOfWeek(); d.getDayOfYear(); d.isLeapYear(); d.lengthOfMonth();
d.isBefore(other); d.isAfter(other); d.compareTo(other);
ChronoUnit.DAYS.between(d1, d2);                         // signed; d2 - d1
Period.between(d1, d2);                                  // P0Y1M3D style: years, months, days
Duration.between(t1, t2);                                // for times/instants: PT1H15M
Duration.ofMinutes(90).toHours();                        // 1 — truncates; toMinutes() → 90
```

Month arithmetic **clamps** rather than overflows: March 31 minus a month is February 29 (or 28), and `plusMonths(1).plusMonths(1)` can differ from `plusMonths(2)` for that reason. `Period` and `Duration` are different things: adding `Period.ofDays(1)` to a `ZonedDateTime` across a DST change moves the wall clock by one day (23 or 25 hours); adding `Duration.ofHours(24)` moves exactly 24 hours and lands at a different wall-clock time. Choose the one that matches the sentence a human would say.

## Zones and conversions

```java
ZonedDateTime kolkata = ZonedDateTime.of(LocalDateTime.of(2024, 3, 1, 9, 30), ZoneId.of("Asia/Kolkata"));
ZonedDateTime newYork = kolkata.withZoneSameInstant(ZoneId.of("America/New_York"));   // 2024-02-29T23:00-05:00 — same moment
ZonedDateTime sameWall = kolkata.withZoneSameLocal(ZoneId.of("America/New_York"));    // 09:30 in New York — a different moment
Instant instant = kolkata.toInstant();
LocalDate localDate = instant.atZone(ZoneId.of("UTC")).toLocalDate();
```

`withZoneSameInstant` is the conversion you almost always mean. Zone rules (including DST history and future changes) come from the JDK's copy of the IANA tz database, updated with the JDK — a fixed date in the past converts deterministically; a date years ahead may shift if a government changes its rules. Use region ids (`Asia/Kolkata`), not abbreviations (`IST` is India, Ireland and Israel).

## Formatting

```java
DateTimeFormatter f = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm", Locale.ENGLISH);
f.format(kolkata);                                      // "Fri, 01 Mar 2024 09:30"
DateTimeFormatter.ISO_LOCAL_DATE.format(d);              // 2024-03-01
LocalDate.parse("01/03/2024", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
```

Pattern letters: `y` year, `M` month (`MM` 03, `MMM` Mar, `MMMM` March), `d` day, `E` weekday, `H` hour 0–23, `h` hour 1–12 with `a` AM/PM, `m` minute, `s` second, `S` fraction, `z`/`Z`/`X` zone and offset forms. Always pass a `Locale` when the output contains names — the judge, the server and the user may not agree on the default. `DateTimeFormatter` is immutable and thread-safe, unlike `SimpleDateFormat`, which was neither and caused a generation of production bugs when shared as a static field.

## The legacy classes: recognise, convert, avoid

`java.util.Date` is an instant with a misleading name and mutable state; `Calendar` has zero-based months and mutable everything; `SimpleDateFormat` is not thread-safe; `java.sql.Date` extends `Date` and throws on `getHours`. Convert at the boundary — `date.toInstant()`, `Date.from(instant)`, `Timestamp.toLocalDateTime()` — and keep `java.time` inside. JDBC 4.2 maps `LocalDate`/`LocalDateTime`/`OffsetDateTime` directly, so even the database boundary no longer needs `Date`.

## Interview angle

- *"`LocalDateTime` versus `ZonedDateTime` versus `Instant`?"* Wall-clock without zone (ambiguous as a moment); wall-clock with zone rules; a point on the UTC timeline.
- *"`Period` versus `Duration`?"* Calendar amounts (years, months, days) versus exact seconds; they differ across DST.
- *"What does `Jan 31 plusMonths(1)` give?"* `Feb 28/29` — clamped to the last valid day.
- *"Why replace `SimpleDateFormat`?"* Not thread-safe and mutable; `DateTimeFormatter` is immutable and shareable.
- *"How do you make time-dependent code testable?"* Inject a `Clock`; call `now(clock)`.

## Key takeaways

- Instant for *when*, Local* for calendar/wall-clock without zone, Zoned/Offset when the zone is known; narrowest type that fits.
- `plus`/`minus`/`with`/`TemporalAdjusters`; `ChronoUnit.between` for counts; month arithmetic clamps.
- `Period` (calendar) ≠ `Duration` (exact); `withZoneSameInstant` converts; use IANA region ids.
- `DateTimeFormatter` with an explicit `Locale`; ISO formats are the defaults for `parse`/`toString`.
- Legacy `Date`/`Calendar`/`SimpleDateFormat`: convert at the boundary and never let them in.
