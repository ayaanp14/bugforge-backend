---
title: JDK, JRE and JVM — the three layers
minutes: 14
---
Three acronyms come up in every Java interview, and candidates routinely get them tangled. They are nested layers, each containing the one below it. Get the picture right once and you will never confuse them again.

```
┌──────────────────────────────────────────────┐
│ JDK  — Java Development Kit                  │
│  javac, jar, javadoc, jshell, jdb, jlink …   │
│ ┌──────────────────────────────────────────┐ │
│ │ JRE — Java Runtime Environment           │ │
│ │  class library (java.base, java.sql …)   │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ JVM — Java Virtual Machine           │ │ │
│ │ │  class loader · verifier ·           │ │ │
│ │ │  interpreter · JIT · GC              │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## The JVM: an abstract machine made real

The **Java Virtual Machine** is a *specification* — a document describing an abstract stack-based computer: its instruction set (bytecode), its memory areas, how classes are loaded and verified, how threads and exceptions behave. HotSpot (the JVM inside OpenJDK), OpenJ9 (Eclipse), GraalVM and Android's ART are *implementations* of that specification.

What the JVM does when you run `java Greeter`:

1. **Class loading.** It finds `Greeter.class`, reads it, and creates an internal representation. Classes are loaded *lazily* — the first time they are needed — by a chain of class loaders (bootstrap → platform → application). You will meet this again when a `ClassNotFoundException` or `NoClassDefFoundError` appears.
2. **Verification.** Before running any bytecode, the JVM checks it is well-formed: stack heights are consistent, types line up, jumps land on instructions, private members are not touched from outside. This is why a hand-crafted malicious `.class` file cannot corrupt the machine.
3. **Linking and initialisation.** Static fields get their defaults, then static initialisers run — in the order they appear — the first time the class is actively used.
4. **Execution.** The interpreter walks the bytecode. The JIT compiles hot methods to native code. The garbage collector reclaims objects no longer reachable.

The JVM knows nothing about the Java *language*. It executes bytecode, and any language that compiles to bytecode — Kotlin, Scala, Groovy, Clojure — runs on it. This is why "JVM languages" is a category.

## The JRE: JVM plus the library

The **Java Runtime Environment** is what you need to *run* Java programs: the JVM plus the class library — `java.lang`, `java.util`, `java.io`, `java.net` and hundreds of other packages. `String`, `ArrayList`, `HashMap`, `Thread` all live here. Without the library the JVM could run bytecode but there would be nothing to call.

Historically the JRE was a separate download for end users who only ran Java applications. Since Java 11 Oracle stopped shipping a standalone JRE; instead `jlink` lets you build a *custom* runtime containing only the modules your application needs. In practice, today you install a JDK, and "the JRE" means the runtime part of it.

## The JDK: everything a developer needs

The **Java Development Kit** is the JRE plus the tools:

| Tool | What it does |
| --- | --- |
| `javac` | Compiles `.java` to `.class` |
| `java` | Launches the JVM and runs a class or a JAR |
| `jar` | Packages classes and resources into a `.jar` archive (a zip with a manifest) |
| `javadoc` | Generates HTML API documentation from `/** … */` comments |
| `jshell` | An interactive REPL (Java 9+) — try expressions without writing a class |
| `jdb` | The command-line debugger |
| `jlink` | Assembles a trimmed runtime image |
| `jpackage` | Builds a native installer (Java 16+) |
| `javap` | Disassembles a `.class` file so you can read the bytecode |

Try `javap -c Greeter` after compiling the program from the last lesson; seeing `invokevirtual` and `getstatic` for the first time makes the "bytecode" idea concrete.

## Where the JVM keeps things: the run-time data areas

The specification names several memory regions. You will study them deeply in the Memory module; for now, the map:

- **Method area** (in HotSpot, *Metaspace*): class metadata — bytecode, constant pools, field and method tables. One per JVM.
- **Heap**: every object and array ever created with `new`. One per JVM, shared by all threads, managed by the garbage collector.
- **JVM stacks**: one per thread. Each method call pushes a *frame* holding its local variables and operand stack; return pops it. Local primitives and *references* live here. Objects never do.
- **PC register**: per thread, the address of the instruction being executed.
- **Native method stacks**: for code called through JNI.

The single most useful mental model in Java: **local variables live on the thread's stack; objects live on the heap; a variable of a class type holds a reference (an address) to an object, not the object itself.** Module 5 (pass-by-value) and Module 16 (memory) both rest on this sentence.

## How a version is named

Run `java -version` and you see something like:

```
openjdk version "18.0.2" 2022-07-19
OpenJDK Runtime Environment (build 18.0.2+9-61)
OpenJDK 64-Bit Server VM (build 18.0.2+9-61, mixed mode, sharing)
```

Three lines, three layers: the *version* of the platform, the *runtime environment* build, and the *VM* — with `mixed mode` telling you it interprets and JIT-compiles (as opposed to `-Xint`, interpreter only), and `sharing` that class data sharing is on, a start-up optimisation that maps pre-parsed core classes from an archive.

## Interview angle

- *"Is the JVM platform independent?"* No — the JVM is platform **dependent** (there is one build per OS and CPU); it is what makes **bytecode** platform independent.
- *"Can you run a Java program with only a JRE?"* Yes, if it is already compiled. You need the JDK to compile.
- *"What is the difference between JIT and AOT?"* JIT compiles at run time using observed behaviour; AOT (ahead-of-time, e.g. GraalVM native-image) compiles before running, trading peak optimisation for instant start-up.
- *"Why is Java slow to start but fast at steady state?"* Class loading and interpretation up front; JIT-compiled native code once hot.

## Key takeaways

- **JVM** runs bytecode; **JRE** = JVM + class library; **JDK** = JRE + developer tools.
- The JVM is a specification with several implementations; HotSpot is the one in OpenJDK.
- Class loading is lazy and verified; execution is interpreted first, JIT-compiled when hot.
- Locals and references live on the thread stack; objects live on the shared heap.
