---
title: The release train — what changed from Java 9 to 21
minutes: 13
---
For twenty years Java shipped a major version every three to five years, each one enormous. Since 2017 it ships **every six months**, each release small, with a **long-term-support** version every two years. Most of the language you have learned in this track — `var`, records, sealed types, text blocks, switch expressions, pattern matching — arrived on that train, and interviewers now ask "what's new in Java 17?" as routinely as they ask about `HashMap`. This lesson is the timetable: how the cadence works, what *preview* means, which versions matter, and a one-screen cheat-sheet of what landed when.

## The cadence

- A **feature release** every March and September (`Java 18`, `Java 19`, …). Each is supported for six months, until the next one.
- An **LTS** release every two years since 17 (previously three): **8**, **11**, **17**, **21**, next **25**. Vendors (Oracle, Eclipse Temurin, Amazon Corretto, Azul, Red Hat) ship security updates for LTS versions for years, which is why production runs on LTS and why "Java 17" and "Java 21" are the versions job adverts name.
- Features are developed as **JEPs** (JDK Enhancement Proposals) and often go through **preview** (complete but subject to change; needs `--enable-preview` on both `javac` and `java`) or **incubator** (an API module, `jdk.incubator.*`) before becoming final. Preview code is fine for learning and forbidden in production — it can change or vanish.
- `javac --release 17` compiles against the 17 API and rejects newer syntax, the way to guarantee your code runs on the LTS you target.

Nothing is removed lightly: deprecation for removal (`@Deprecated(forRemoval = true)`) precedes removal by at least one release, and the JVM warns at run time when you use such an API.

## The cheat-sheet

| Version | Year | Language | Library and JVM |
| --- | --- | --- | --- |
| **9** | 2017 | private interface methods; diamond with anonymous classes; `_` no longer an identifier | **modules** (JPMS), `jshell`, `List.of`/`Set.of`/`Map.of`, `Stream.takeWhile`/`dropWhile`/`iterate(seed, hasNext, next)`, `Optional.ifPresentOrElse`/`or`/`stream`, `Flow` (reactive), G1 default, compact strings |
| 10 | 2018 | **`var`** for locals | `List.copyOf`, `Collectors.toUnmodifiableList`, `Optional.orElseThrow()`, container awareness, parallel full GC for G1 |
| **11** (LTS) | 2018 | `var` in lambda parameters | **`HttpClient`**, `String.isBlank`/`strip`/`lines`/`repeat`, `Files.readString`/`writeString`, `Predicate.not`, single-file `java Hello.java`, ZGC (experimental), Epsilon GC; JavaFX and JAXB removed |
| 12 | 2019 | switch expressions (preview) | `Collectors.teeing`, `String.indent`/`transform`, Shenandoah |
| 13 | 2019 | text blocks (preview) | `String.stripIndent`, ZGC uncommit |
| 14 | 2020 | **switch expressions** (final), records (preview), pattern `instanceof` (preview) | **helpful `NullPointerException`** messages, JFR streaming; CMS removed |
| 15 | 2020 | **text blocks** (final), sealed classes (preview) | `String.formatted`, ZGC and Shenandoah production, hidden classes; Nashorn removed |
| 16 | 2021 | **records** (final), **pattern `instanceof`** (final) | `Stream.toList()`, `Stream.mapMulti`, `jpackage`, strong encapsulation of JDK internals by default, Unix-domain sockets |
| **17** (LTS) | 2021 | **sealed classes** (final), pattern matching for switch (preview) | enhanced pseudo-random generators, macOS/AArch64 port; Applet API deprecated, Security Manager deprecated |
| 18 | 2022 | — | **UTF-8 by default** (JEP 400), simple web server `jwebserver`, code snippets in Javadoc, `finalize` deprecated for removal |
| 19 | 2022 | record patterns (preview) | **virtual threads** (preview), structured concurrency (incubator), `ExecutorService` is `AutoCloseable` |
| 20 | 2023 | — | scoped values (incubator), second previews |
| **21** (LTS) | 2023 | **pattern matching for switch** (final), **record patterns** (final), unnamed patterns (preview), string templates (preview, later withdrawn), unnamed classes and instance `main` (preview) | **virtual threads** (final), **sequenced collections** (`getFirst`/`getLast`/`reversed`), generational ZGC, key encapsulation API |
| 22–24 | 2024–25 | unnamed variables `_` (final in 22), statements before `super()` (preview), primitive patterns (preview), flexible constructor bodies | `StructuredTaskScope` and scoped values (previews), Foreign Function & Memory API (final in 22), class-file API, stream gatherers (final in 24), `Security Manager` permanently disabled (24) |
| **25** (LTS) | 2025 | module import declarations, compact source files and instance `main` (final), flexible constructor bodies (final) | scoped values (final), stable values (preview), ahead-of-time cache improvements |

You do not need every row. You need: **8** (lambdas, streams, `Optional`, `java.time`), **11** (`var`, `HttpClient`, string methods), **17** (records, sealed, switch expressions, text blocks, pattern `instanceof`), **21** (pattern switch, record patterns, virtual threads, sequenced collections). Those four LTS milestones are the versions of Java you will actually be asked about.

## How to read a JEP

Each JEP page has *Summary*, *Goals*, *Non-goals*, *Motivation*, *Description*, *Alternatives* and *Risks*. The *Motivation* and *Alternatives* sections are where the design rationale lives — why records are not just data classes with less typing, why `var` was not allowed for fields — and reading two or three (JEP 395 records, JEP 409 sealed, JEP 444 virtual threads) teaches more about Java's design philosophy than any blog post.

## Choosing a version in practice

- New service, no constraints: the latest LTS (21 now, 25 soon).
- A library: compile with `--release` set to the *oldest* version you support; test on the newest.
- Legacy code on 8: the jump to 11 is the hard one (modules, removed APIs — `javax.xml.bind`, `sun.misc.Unsafe` access); 11 → 17 → 21 are mostly smooth.
- Keep preview features out of `main`; a `--enable-preview` build is fine for learning.

## Interview angle

- *"What's the release cadence and what is LTS?"* Six-monthly feature releases; LTS every two years (8, 11, 17, 21, 25) with multi-year vendor support; production runs LTS.
- *"What's new in Java 17?"* Sealed classes final; plus everything since 11: records, text blocks, switch expressions, pattern `instanceof`, helpful NPEs.
- *"What's new in Java 21?"* Pattern matching for switch and record patterns final, virtual threads, sequenced collections, generational ZGC.
- *"What is a preview feature?"* Complete but may change; needs `--enable-preview`; not for production.
- *"Which version added `var`?"* 10 for locals; 11 for lambda parameters.

## Key takeaways

- Six-month releases; LTS 8 → 11 → 17 → 21 → 25; production runs LTS.
- Preview and incubator features need `--enable-preview` and stay out of production.
- 11: `var`, `HttpClient`, string methods. 17: records, sealed, switch expressions, text blocks, pattern `instanceof`. 21: pattern switch, record patterns, virtual threads, sequenced collections.
- `--release N` pins the API and syntax you compile against.
- JEP *Motivation* sections are the best design documentation Java has.
