---
title: What Java is, and why it looks the way it does
minutes: 12
---
Java is a **statically typed, class-based, compiled-then-interpreted** language that runs on a virtual machine. Every one of those words is a design decision, and understanding the decisions is what separates someone who *uses* Java from someone who *understands* it. This lesson is the map; the rest of the track fills in the territory.

## Where it came from

Java was designed at Sun Microsystems in the early 1990s by a team led by James Gosling. The original target was consumer electronics — set-top boxes — where the hardware kept changing and C++ programs had to be recompiled for every chip. The team's answer was to compile to an *intermediate* form once and let a small program on each device (the **virtual machine**) run it. That idea, sold with the slogan "write once, run anywhere", became Java 1.0 in 1996.

Three properties were baked in from the start and still define the language:

1. **Portability through bytecode.** You compile `.java` source to `.class` files containing *bytecode* — instructions for the Java Virtual Machine, not for any real CPU. The JVM for your operating system executes them. The same `.class` file runs on Windows, Linux, macOS and Android-adjacent runtimes.
2. **Safety through the runtime.** There is no pointer arithmetic, array bounds are always checked, memory is reclaimed by a garbage collector rather than by hand, and every cast is verified. A Java program can crash with an exception; it cannot silently corrupt memory the way a C program can.
3. **Objects everywhere (almost).** Code lives in classes. The exceptions are the eight primitive types (`int`, `double`, `boolean`, …), kept for speed — a decision you will feel in Module 2 and again when you meet autoboxing.

## The shape of a Java program

Here is a complete program:

```java
public class Greeter {
    public static void main(String[] args) {
        String name = args.length > 0 ? args[0] : "world";
        System.out.println("Hello, " + name + "!");
    }
}
```

Read it as the JVM reads it. `public class Greeter` declares a type. Inside, `main` is the method the JVM looks for when you run the class — `public` so the launcher can reach it, `static` so it can run before any object exists, `void` because the launcher ignores return values, and `String[] args` because command-line arguments arrive as an array of strings. `System.out.println` is a method call on a *static field* (`out`) of the class `System`, which lives in `java.lang`, the one package imported automatically.

Every statement ends in a semicolon, every block is delimited with braces, and the compiler will not let you run a program with a type error in it. That last property — errors at compile time rather than at 3 a.m. in production — is the argument for static typing, and Java takes it further than most: variables have declared types, method parameters have declared types, and a value of one type does not become another without an explicit conversion.

## Compiled *and* interpreted

People argue about whether Java is compiled or interpreted. It is both, in two stages:

- `javac` compiles source to bytecode. This is a real compiler: it checks types, resolves names, and rejects programs that do not make sense. But the output is not machine code.
- The JVM loads bytecode and initially *interprets* it. As it notices which methods run hot, the **JIT (just-in-time) compiler** translates those to native machine code, optimised using facts it observed at run time (which branch is usually taken, which class is actually behind an interface). A long-running Java server is, after warm-up, executing native code that was tuned for the workload it actually sees.

This is why Java benchmarks are often quoted "after warm-up", and why a short script in Java feels slow to start (class loading + interpretation) while a server that has run for an hour is very fast.

## Editions, versions, and what "Java 17" means

You will see "Java SE", "Java EE"/"Jakarta EE", and "Java ME". **SE (Standard Edition)** is the language plus the core library — what this track teaches. EE was a set of enterprise APIs on top of it (servlets, persistence), now maintained as Jakarta EE. ME was for tiny devices and is effectively historical.

Versions: after Java 8 (2014) the numbering jumped — 9, 10, 11 … — and since 2018 a new version ships **every six months**, with a **Long-Term Support (LTS)** release every two years. The LTS releases that matter today are **8, 11, 17 and 21**. Companies run LTS versions in production; the ones in between are where features are previewed. When a job posting says "Java 17", it means the language features up to 17 (records, sealed classes, text blocks, pattern matching for `instanceof`) and the library that shipped with it.

The exercises in this track compile on **OpenJDK 18** (on the runner behind the editor), so everything through Java 17 is fair game; the Modern Java module flags the handful of Java 21 additions that are not.

## OpenJDK, Oracle JDK, and the rest

"Java" the platform is specified by the **Java Community Process** and implemented by **OpenJDK**, an open-source project. Oracle, Amazon (Corretto), Eclipse (Temurin), Microsoft, Red Hat and others build and distribute JDKs from that same source. For learning and for almost all production use, any of them is fine — they pass the same compatibility tests. The differences are support contracts and update cadence, not language behaviour.

## What Java is used for

Knowing the ecosystem tells you which parts of the language are worth deep study:

- **Backend services** (Spring Boot, Jakarta EE, Micronaut, Quarkus) — the largest employer of Java developers. Heavy on collections, generics, exceptions, concurrency, and the I/O stack.
- **Android** — the app framework is written against Java APIs (Kotlin now dominates new code, but the runtime, libraries and most existing apps are Java).
- **Big data** (Hadoop, Spark, Kafka, Elasticsearch) — written in Java or Scala, run on the JVM.
- **Desktop and tools** — IntelliJ IDEA, Eclipse, and a great deal of internal enterprise software.

Every one of those depends on the same core: the type system, the object model, the collections framework, and the JVM's memory and threading model. That core is exactly this track.

## Pitfalls worth knowing on day one

- **Java is not JavaScript.** The names are a 1995 marketing accident. The languages share C-style syntax and nothing else of importance.
- **A file's public class must match the file name.** `public class Greeter` must live in `Greeter.java`. The compiler enforces it.
- **Case matters everywhere.** `String` is a class; `string` is a compile error. `main` is the entry point; `Main` is a class name.
- **Whitespace does not matter, but braces do.** Indentation is for humans. The compiler reads only braces and semicolons.

## Key takeaways

- Java compiles to **bytecode**, which the **JVM** interprets and then JIT-compiles to native code.
- The language is **statically typed** and **class-based**; almost everything is an object, except the eight primitives.
- **LTS versions** (8, 11, 17, 21) are what production runs; this track targets the Java 17 feature set.
- OpenJDK is the reference implementation; vendor builds differ in support, not behaviour.
