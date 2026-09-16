---
title: From source to running program
minutes: 14
---
You will spend most of this track inside an editor with a Run button, but the button hides four steps you should be able to perform by hand and explain in an interview: write, compile, package, run. This lesson walks the whole pipeline on the command line.

## Step 1 — a source file

```java
// Hello.java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello from " + System.getProperty("java.version"));
    }
}
```

Rules the compiler enforces about files:

- A source file may contain **at most one `public` top-level class**, and the file must be named after it: `Hello.java`.
- It may contain other, non-public top-level classes; each becomes its own `.class` file.
- The file is UTF-8 by default since Java 18 (earlier, the platform encoding — a classic source of mojibake on Windows).

## Step 2 — compile with `javac`

```
$ javac Hello.java
$ ls
Hello.class  Hello.java
```

`javac` parses the source, checks every type, resolves every name, and writes **bytecode** into `Hello.class`. A compile error stops here, with a file name, a line number, a caret under the problem, and a message:

```
Hello.java:4: error: ';' expected
        System.out.println("Hello")
                                   ^
1 error
```

Learn to read these top to bottom: the *first* error is the real one; later ones are often the compiler recovering badly from it.

Useful flags:

| Flag | Meaning |
| --- | --- |
| `-d out` | Put `.class` files in `out/` (keeps the tree clean) |
| `-cp lib.jar` | Where to find other classes you depend on (the *classpath*) |
| `--release 17` | Compile for Java 17: refuses newer APIs and language features |
| `-Xlint:all` | Turn on every warning — do this |
| `-g` | Include debugging info (line numbers, local variable names) |

## Step 3 — run with `java`

```
$ java Hello
Hello from 18.0.2
```

Note: `java Hello`, not `java Hello.class`. You name the **class**, and the launcher finds `Hello.class` on the classpath (the current directory by default), loads it, verifies it, and calls `public static void main(String[])`. If that method is missing you get:

```
Error: Main method not found in class Hello, please define the main method as:
   public static void main(String[] args)
```

Arguments after the class name arrive in `args`:

```
$ java Hello one "two words" 3
```

gives `args = {"one", "two words", "3"}` — all strings; convert with `Integer.parseInt` when you need a number.

### The single-file shortcut (Java 11+)

```
$ java Hello.java
```

compiles in memory and runs in one step. Handy for experiments; not a substitute for a build in real projects, because nothing is written to disk and only the one file is compiled.

### `jshell`

```
$ jshell
jshell> int x = 40;
jshell> x + 2
$2 ==> 42
```

The REPL lets you try an expression without a class or a `main`. Use it constantly while learning.

## Step 4 — package into a JAR

Real programs have many classes. A **JAR** (Java ARchive) is a zip file of `.class` files plus a manifest:

```
$ javac -d out src/com/example/*.java
$ jar --create --file app.jar --main-class com.example.Main -C out .
$ java -jar app.jar
```

`--main-class` writes `Main-Class:` into `META-INF/MANIFEST.MF`, which is how `java -jar` knows where to start. Libraries are JARs without a main class; you put them on the classpath.

## The classpath, demystified

The **classpath** is the list of places the JVM searches for classes: directories and JAR files, separated by `:` on Unix and `;` on Windows.

```
$ java -cp out:lib/gson.jar com.example.Main
```

Three things go wrong with it constantly:

1. **`ClassNotFoundException`** — a class was asked for by name at run time (reflection, `Class.forName`) and is not on the classpath.
2. **`NoClassDefFoundError`** — the class *was* there at compile time and is not there now, or its static initialiser threw the first time it was loaded. This is an `Error`, not an `Exception`, and it is the one people search for most.
3. **Wrong version on the classpath** — two JARs contain the same class; whichever comes first wins, silently.

Build tools (Maven, Gradle) exist largely to compute this list for you. Under the hood they still call `javac` and `java` with a very long `-cp`.

## What is in a `.class` file

```
$ javap -c -p Hello
Compiled from "Hello.java"
public class Hello {
  public Hello();
    Code:
       0: aload_0
       1: invokespecial #1   // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: getstatic     #7   // Field java/lang/System.out:Ljava/io/PrintStream;
       3: ldc           #13  // String Hello
       5: invokevirtual #15  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
       8: return
}
```

Two things to notice. First, a **default constructor** `Hello()` was generated because you wrote none — it calls `Object`'s constructor. Second, `main` is four instructions: push `System.out`, push the string constant, call `println` (a *virtual* call, resolved by the receiver's runtime class), return. When Module 8 talks about dynamic dispatch, this is the instruction it is talking about.

## Run-time flags you will actually use

```
$ java -Xmx512m -Xss1m -ea Hello
```

- `-Xmx` — maximum heap size. Too small → `OutOfMemoryError: Java heap space`.
- `-Xss` — thread stack size. Deep recursion → `StackOverflowError`; raising this is a band-aid, fixing the recursion is the cure.
- `-ea` — enable `assert` statements (they are **off by default**, a trap covered in Module 12).
- `-D name=value` — set a system property, read with `System.getProperty("name")`.

## Interview angle

- *"What does `javac` produce?"* Bytecode in `.class` files, one per class (including nested classes: `Outer$Inner.class`).
- *"Why can't I run `java Hello.class`?"* The launcher takes a class name and searches the classpath; the `.class` suffix makes it look for a class literally named `Hello.class`.
- *"`ClassNotFoundException` vs `NoClassDefFoundError`?"* The first is a checked exception from an explicit lookup by name; the second is an error when a class present at compile time is missing (or failed to initialise) at run time.

## Key takeaways

- `javac` → `.class` (bytecode); `java` → loads and runs by **class name**.
- The **classpath** is where classes are found; most "it worked on my machine" problems are classpath problems.
- A JAR is a zip with a manifest; `Main-Class` makes it runnable.
- `javap -c` shows the bytecode — use it to check your mental model.
