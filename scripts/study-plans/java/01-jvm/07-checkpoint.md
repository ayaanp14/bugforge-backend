---
title: Checkpoint — Java & the JVM
minutes: 25
seo-title: Java Basics Quiz: JVM, javac and Console I/O Practice Test
description: Test your Java fundamentals with 15 questions and two programs on the JDK, JRE and JVM, compiling and running code, packages, imports and console I/O.
q: What does `javac` produce, and what does `java` do with it?
a: `javac` compiles `.java` source files into `.class` files that contain bytecode. The `java` launcher starts a JVM, loads the named class and calls its `main` method.
q: What is the difference between ClassNotFoundException and NoClassDefFoundError?
a: `ClassNotFoundException` is a checked exception thrown when code asks for a class by name, as `Class.forName` does, and no class loader can find it. `NoClassDefFoundError` is an error thrown when a class that was present at compile time is missing at run time.
q: Why does `nextLine()` after `nextInt()` return an empty string?
a: `nextInt()` reads the number but leaves the line break after it in the input. The next `nextLine()` reads up to that line break and returns what is left of the line — nothing. Call `nextLine()` once to discard it before reading the next line.
---
This checkpoint covers the whole module: what Java is, the JDK/JRE/JVM layers, the compile-and-run pipeline, the anatomy of a program, packages and imports, and console I/O.

**How it works.** Fifteen questions and two programs. You need 70% on the questions and both programs accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `javac` produce, and what does `java` do with it?
- Which layer contains the class library — JVM, JRE or JDK?
- What is the difference between `ClassNotFoundException` and `NoClassDefFoundError`?
- Where do local variables live, and where do objects live?
- What does an `import` statement cost at run time?
- Why does `nextLine()` after `nextInt()` return an empty string?

The two programs use the I/O template from the last lesson. Read the input format carefully — most failed submissions in this checkpoint are reading problems, not logic problems.
