---
title: Modules, jshell and the modern toolchain
minutes: 13
---
Java 9's biggest change was not a language feature but the **module system** (JPMS), which split the JDK itself into ~70 modules and lets applications declare what they export and require. Most application code still runs on the classpath and never writes a `module-info.java`, yet the module system shapes everything around it: which JDK internals you may touch, why `--add-opens` flags appear in build files, and how `jlink` produces a 40 MB runtime instead of a 300 MB one. Alongside it came a modern toolchain — `jshell` for trying things, single-file execution, `jpackage` for installers, JFR for production profiling. This lesson is the map of that tooling, and the module rules you need to explain in an interview.

## The module system in one page

A **module** is a named set of packages with an explicit boundary, declared in `module-info.java` at the root of its source tree:

```java
module com.shop.inventory {
    requires java.sql;                          // I use this module's exported packages
    requires transitive com.shop.model;         // and whoever requires me can see this one too
    exports com.shop.inventory.api;             // only this package is visible to other modules
    exports com.shop.inventory.spi to com.shop.plugins;   // qualified export
    opens com.shop.inventory.entity;            // reflective access (for frameworks) to this package
    uses com.shop.inventory.spi.Pricing;        // ServiceLoader consumer
    provides com.shop.inventory.spi.Pricing with com.shop.inventory.DefaultPricing;
}
```

**Readability**: module A can use a type in module B only if A `requires` B (directly, or via a `requires transitive` chain) *and* B `exports` the type's package. **Strong encapsulation**: a package that is not exported is invisible — not even reflection can reach it without `opens`. That is why `sun.misc.Unsafe` tricks and `setAccessible` on JDK internals stopped working (fully enforced in 16), and why frameworks need `--add-opens java.base/java.lang=ALL-UNNAMED` when they insist. `java.base` is required implicitly by every module. The **unnamed module** is the classpath: everything on it reads all modules and exports everything, so legacy code runs unchanged.

Why bother: reliable configuration (missing modules fail at start-up, not at first use), encapsulation of internals, and **`jlink`** — assemble a custom runtime image containing only the modules your application needs: `jlink --add-modules java.base,java.sql --output runtime` yields a small, fast-starting JRE for a container. `jdeps --list-deps app.jar` tells you which modules a jar needs. Automatic modules (a plain jar on the module path, named after its file) bridge unmodularised libraries.

Practical advice: modularise libraries and the JDK; leave most applications on the classpath unless you need `jlink`. Know the vocabulary — `requires`, `exports`, `opens`, `transitive`, unnamed module, split packages (two modules with the same package is an error) — because build errors and framework documentation assume it.

## `jshell`: a REPL for Java

`jshell` (9) is an interactive shell: type expressions and see results without a class or a `main`.

```
jshell> var xs = List.of(3, 1, 2)
xs ==> [3, 1, 2]
jshell> xs.stream().sorted().toList()
$2 ==> [1, 2, 3]
jshell> /methods
jshell> /open Util.java
```

Use it to check an API's behaviour, try a regex, or verify what `Integer.valueOf(128) == Integer.valueOf(128)` prints before saying it in an interview. Semicolons are optional at the top level; `/vars`, `/list`, `/edit` and tab completion are the commands you need.

## Running without a build: single-file and beyond

- **Single-file source launch** (11): `java Hello.java` compiles in memory and runs. Scripts and interview take-home tasks stop needing a project.
- **Shebang files** (11): put `#!/usr/bin/java --source 21` at the top and `chmod +x` — a Java script.
- **Multi-file source launch** (22) extends this to a directory of sources.
- **Unnamed classes and instance `main`** (preview 21, final 25 as *compact source files*): `void main() { System.out.println("hi"); }` is a complete program — the on-ramp for beginners that removes `public static void main(String[] args)` and `class` from the first lesson.

## The command-line tools

| Tool | Does |
| --- | --- |
| `javac --release N` | compile against exactly JDK N's API and syntax |
| `java -XX:+PrintFlagsFinal`, `-Xlog:gc`, `-XX:+HeapDumpOnOutOfMemoryError` | the runtime flags from the memory module |
| `jar`, `jar --describe-module` | package; inspect a modular jar |
| `jdeps` | dependency analysis: which modules and, with `--jdk-internals`, which forbidden internals a jar uses |
| `jlink` | custom runtime image |
| `jpackage` (16) | native installers (`.msi`, `.dmg`, `.deb`) bundling your app and a runtime |
| `jcmd`, `jstack`, `jmap`, `jstat`, `jinfo` | live diagnostics: thread dumps, heap dumps, GC stats |
| `jfr` + JDK Mission Control | Flight Recorder: always-on low-overhead production profiling (`-XX:StartFlightRecording`) |
| `jwebserver` (18) | a static file server for local testing |
| `javadoc`, with `{@snippet}` (18) | documentation with compiled, validated code examples |

## Build tools and libraries, briefly

You will build with **Maven** (`pom.xml`, convention over configuration, the default in most companies) or **Gradle** (Kotlin/Groovy DSL, faster incremental builds, Android). Both resolve dependencies from Maven Central, run tests (JUnit 5 is the standard), and apply `--release`. For measurement, **JMH** is the benchmark harness (the memory module explained why nothing else is trustworthy). For quality gates: `-Xlint:all`, Error Prone or SpotBugs, and `jdeps --jdk-internals` in CI to catch reliance on internals before a JDK upgrade does.

## Upgrading a JDK: what actually breaks

From 8 to 11+: removed `javax.xml.bind`/`javax.activation`/CORBA (add dependencies), illegal reflective access to internals (find with `--illegal-access=warn` on 11–15, then fix or `--add-opens`), tools that parsed the version string as `1.8`. From 11 to 17: strong encapsulation enforced, `SecurityManager` deprecated, some `sun.*` APIs gone. From 17 to 21: little; check libraries for `synchronized`-heavy code if you adopt virtual threads. The habit that makes upgrades cheap is to compile with `--release` and run `jdeps --jdk-internals` regularly.

## Interview angle

- *"What is the Java module system?"* Named modules with explicit `requires`/`exports`; strong encapsulation of non-exported packages; reliable configuration; enables `jlink`.
- *"`requires` versus `requires transitive`?"* Transitive re-exports the dependency to whoever requires you.
- *"What is the unnamed module?"* The classpath: reads everything, exports everything — how legacy code keeps running.
- *"Why do frameworks need `--add-opens`?"* To reflect into packages that a module does not `opens`; strong encapsulation is enforced since 16.
- *"What is `jshell` for?"* A REPL to try API calls and expressions instantly.

## Key takeaways

- `module-info.java`: `requires`, `requires transitive`, `exports`, `exports … to`, `opens`, `uses`/`provides`; readability + exports = accessibility.
- Strong encapsulation broke `sun.*` hacks; `--add-opens` is the escape hatch, `jdeps --jdk-internals` the detector.
- `jlink` builds small runtimes; `jpackage` builds installers; most apps stay on the classpath (the unnamed module).
- `jshell` to try things; `java File.java` to run one file; instance `main` for the smallest program.
- `--release N`, JFR, `jcmd` family, Maven/Gradle, JUnit 5, JMH: the toolchain a modern Java developer is assumed to know.
