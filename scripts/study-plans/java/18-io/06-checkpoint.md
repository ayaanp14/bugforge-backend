---
title: Checkpoint — I/O, files and time
minutes: 28
seo-title: Java I/O Quiz: Streams, Files and java.time Practice Test
description: Test Java I/O with 15 questions and three programs on streams and charsets, fast input, Path and Files, serialization, CSV parsing and the java.time API.
q: What is the decorator stack from a raw InputStream to readLine()?
a: A `FileInputStream` or `System.in` supplies bytes, an `InputStreamReader` decodes them into characters with a charset, and a `BufferedReader` batches the reads and adds `readLine()`. `Files.newBufferedReader(path)` builds the same stack, with UTF-8, in one call.
q: Which Java Files methods return lazy streams that must be closed?
a: `Files.lines`, `Files.list`, `Files.walk` and `Files.find` return streams backed by an open file or directory handle, so each one belongs in a try-with-resources block.
q: Why is split(",") not a CSV parser?
a: A quoted CSV field may itself contain commas, doubled quotes or line breaks, and `split(",")` cuts it in the wrong places. A correct parser tracks whether it is inside quotes and treats a doubled quote as an escaped one.
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
