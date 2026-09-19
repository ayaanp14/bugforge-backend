---
title: Dates and times — datetime, timedelta and zoneinfo
minutes: 14
---
Dates are where programs go wrong quietly: a month with 30 days, a year that is not a leap year, a clock that jumps an hour, a timestamp that is in one zone on the server and another in the browser. The `datetime` module handles the calendar arithmetic correctly if you use its types rather than strings and integers, and `zoneinfo` (3.9) gives it real time zones from the IANA database. This lesson covers `date`, `time`, `datetime` and `timedelta`, parsing and formatting with `strptime`/`strftime` and the ISO methods, arithmetic and comparison, naive versus aware datetimes, converting between zones, and the rule that keeps a system sane: store UTC, display local.

## The types

```python
from datetime import date, time, datetime, timedelta

d = date(2024, 5, 1)                 # a calendar date
t = time(9, 30)                      # a wall-clock time, no date
dt = datetime(2024, 5, 1, 9, 30)     # both
delta = timedelta(days=3, hours=4)   # a duration

d.year, d.month, d.day, d.weekday()  # 2024 5 1 2   (Monday is 0; isoweekday() has Monday as 1)
dt.date(), dt.time()                 # split
datetime.combine(d, t)               # join
d.replace(year=2025)                 # a new date with one field changed — dates are immutable
date.today(), datetime.now()         # the clock — never in a judged program (nondeterministic)
```

`timedelta` stores days, seconds and microseconds; it has no months or years because those are not fixed lengths. `delta.total_seconds()` converts; `delta.days` is the whole-day part.

## Arithmetic and comparison

```python
d + timedelta(days=30)               # 2024-05-31 — calendar-correct across month ends and leap years
date(2024, 3, 1) - date(2024, 2, 1)  # timedelta(days=29): 2024 is a leap year
dt2 - dt1                            # a timedelta; (dt2 - dt1).total_seconds()
d1 < d2, d1 == d2                    # compare directly
timedelta(hours=36) // timedelta(hours=1)    # 36 — how many hours
sorted(dates)                        # chronological
min(dates), max(dates)
```

Adding a month is not a `timedelta` operation. The honest options: `replace(month=…)` with the day clipped by hand, or the third-party `dateutil.relativedelta`. Next-day and end-of-month logic is `timedelta(days=1)` and `replace(day=1) + timedelta(days=32)` then `replace(day=1) - timedelta(days=1)` — or `calendar.monthrange(year, month)[1]` for the length of a month.

## Formatting and parsing

```python
dt.isoformat()                                 # '2024-05-01T09:30:00'
d.isoformat()                                  # '2024-05-01'
datetime.fromisoformat("2024-05-01T09:30:00")  # parses ISO 8601 (3.11 accepts most variants, including a Z suffix)
date.fromisoformat("2024-05-01")

dt.strftime("%d/%m/%Y %H:%M")                  # '01/05/2024 09:30'
datetime.strptime("01/05/2024 09:30", "%d/%m/%Y %H:%M")
dt.strftime("%A %d %B %Y")                     # 'Wednesday 01 May 2024' (English names in the C locale)
f"{dt:%Y-%m-%d}"                               # format specs work in f-strings
```

The ISO methods are the right default: unambiguous, sortable as strings, zone-capable. `strftime`/`strptime` use the C directives — `%Y` year, `%m` month, `%d` day, `%H` hour (24), `%M` minute, `%S` second, `%f` microseconds, `%z` offset, `%Z` zone name, `%a`/`%A` weekday, `%b`/`%B` month name, `%j` day of year, `%U`/`%W` week — and `strptime` raises `ValueError` on a mismatch, which is the validation. Weekday and month *names* depend on the locale; the judge and most servers run in the C locale, where they are English.

## Naive and aware

A **naive** datetime has no zone; it is a wall-clock reading with no claim about where. An **aware** one carries a `tzinfo` and represents an actual instant. The two do not mix: comparing or subtracting a naive and an aware datetime raises `TypeError`.

```python
from zoneinfo import ZoneInfo
from datetime import timezone

utc = datetime(2024, 5, 1, 4, 0, tzinfo=timezone.utc)
kolkata = utc.astimezone(ZoneInfo("Asia/Kolkata"))    # 2024-05-01 09:30+05:30
kolkata.isoformat()                                   # '2024-05-01T09:30:00+05:30'
local = datetime(2024, 5, 1, 9, 30, tzinfo=ZoneInfo("Asia/Kolkata"))
local.astimezone(timezone.utc)                        # back to 04:00+00:00
local.utcoffset()                                     # timedelta(seconds=19800)
naive.replace(tzinfo=ZoneInfo("Europe/London"))       # *attach* a zone to a naive reading (no conversion)
```

`astimezone` converts an instant between zones; `replace(tzinfo=…)` asserts which zone a naive reading was in — different operations, easily confused. `ZoneInfo` handles daylight-saving rules from the IANA database (`Europe/London` is +01:00 in summer and +00:00 in winter); a fixed `timezone(timedelta(hours=5, minutes=30))` does not, and is only right for zones without DST. The `utcnow()` and `utcfromtimestamp()` functions are deprecated because they return naive values; use `datetime.now(timezone.utc)`.

## Timestamps

```python
dt.timestamp()                                  # seconds since the epoch, float (aware: exact; naive: assumed local)
datetime.fromtimestamp(1714536000, tz=timezone.utc)
```

A Unix timestamp is an instant; converting it to a datetime without a `tz` uses the machine's local zone, which is the classic source of off-by-hours bugs. Always pass `tz=`.

## The rule

Store and compute in UTC (aware, `timezone.utc`); convert to a user's zone with `astimezone` only to display; parse user input in the user's zone and convert to UTC immediately. Keep durations as `timedelta`, never as floats of hours. And keep the clock out of the logic: a function that takes `now` as a parameter can be tested with a fixed value (Module 18), while one that calls `datetime.now()` inside cannot.

## Pitfalls

- Adding "a month" as 30 days.
- Comparing naive with aware (`TypeError`), or a naive `utcnow()` with an aware value.
- `replace(tzinfo=…)` where `astimezone` was meant (it relabels; it does not convert).
- `fromtimestamp` without `tz`.
- Fixed offsets for zones that observe daylight saving.
- Calling `now()` inside logic that should be testable or judged.

## Key takeaways

- `date`, `time`, `datetime`, `timedelta`: immutable, comparable, with calendar-correct arithmetic; no month/year deltas.
- ISO methods for storage and exchange; `strftime`/`strptime` for human formats, with `ValueError` as validation.
- Aware datetimes carry a zone and are instants; naive ones are readings; never mix them.
- `ZoneInfo("Asia/Kolkata")` for real zones with DST; `astimezone` converts, `replace(tzinfo=)` labels; `timestamp()` and `fromtimestamp(ts, tz=)` for epoch seconds.
- Store UTC, display local, pass `now` in as a parameter.
