---
title: Checkpoint — I/O, files and time
minutes: 28
---
This checkpoint covers byte and character streams with charsets and the decorator stack, buffering and the fast-I/O template, `Path` arithmetic and the `Files` API, Java serialization and its knobs, CSV parsing with quotes, and `java.time` — the types, arithmetic, zones and formatting.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Why `read()` returns `int`, and what `length()` versus `getBytes(UTF_8).length` count.
- The order of the decorator stack from a raw `InputStream` to `readLine()`.
- Why `Scanner` is slow, what buffering saves, and why a program with a `PrintWriter` printed nothing.
- What `resolve` does with an absolute argument, and `normalize` versus `toRealPath`.
- Which `Files` methods return lazy streams that must be closed.
- What `serialVersionUID` and `transient` do, and why untrusted deserialisation is dangerous.
- Why `split(",")` is not a CSV parser.
- `LocalDateTime` versus `ZonedDateTime` versus `Instant`; `Period` versus `Duration`; what `Jan 31 plusMonths(1)` gives.

The programs are a log analyser that reads until end of input and measures the span with `java.time`, a hex dump of raw bytes, and a CSV-to-fixed-width report using the quote-aware parser.
