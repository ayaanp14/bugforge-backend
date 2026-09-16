---
title: The exception hierarchy and how to read a stack trace
minutes: 13
---
When something goes wrong at run time — an index out of range, a file missing, a null dereferenced — Java creates an **exception object** describing the failure and unwinds the call stack until something catches it. Every exception is an instance of a class in one hierarchy rooted at `Throwable`, and where a class sits in that hierarchy decides whether the compiler forces you to handle it. This lesson is the map of that hierarchy, the exceptions you will meet daily, and how to read the stack trace you get when one escapes.

## The hierarchy

```
Throwable
├── Error                       — the JVM is in trouble; do not catch
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   ├── NoClassDefFoundError
│   └── AssertionError
└── Exception                   — something a program might recover from
    ├── IOException             — CHECKED: must be declared or caught
    │   ├── FileNotFoundException
    │   └── UncheckedIOException (RuntimeException, despite the name's neighbourhood)
    ├── SQLException             — checked
    ├── InterruptedException     — checked
    ├── ReflectiveOperationException (ClassNotFoundException, …) — checked
    └── RuntimeException         — UNCHECKED: may be thrown anywhere without declaration
        ├── NullPointerException
        ├── IllegalArgumentException
        │   └── NumberFormatException
        ├── IllegalStateException
        ├── IndexOutOfBoundsException
        │   ├── ArrayIndexOutOfBoundsException
        │   └── StringIndexOutOfBoundsException
        ├── ArithmeticException
        ├── ClassCastException
        ├── UnsupportedOperationException
        ├── ConcurrentModificationException
        ├── NoSuchElementException
        └── DateTimeException
```

Three tiers to remember:

- **`Error`**: the JVM or the platform failed — memory exhausted, stack blown, a class missing at load time. Programs should not catch these (what would you do?), and catching `Throwable` to "be safe" swallows them.
- **Checked exceptions** (`Exception` and subclasses that are *not* `RuntimeException`): conditions a correct program should anticipate — a file may be absent, a network may drop. The compiler forces every caller to catch or declare them.
- **Unchecked exceptions** (`RuntimeException` and subclasses): programming errors and precondition violations — null where an object was required, an index past the end, an argument out of range. No declaration required; they propagate freely.

The next lesson is about the checked/unchecked decision; here, the key is that the *class* of an exception is the *category* of failure.

## What an exception carries

```java
Throwable t;
t.getMessage()        // the detail message given at construction, or null
t.getCause()          // the exception that caused this one, or null (chaining — lesson 5)
t.getStackTrace()     // StackTraceElement[] — the frames at the point of creation
t.printStackTrace()   // to System.err; loggers do this properly
t.getSuppressed()     // exceptions suppressed during try-with-resources cleanup (lesson 4)
t.toString()          // "java.lang.IllegalArgumentException: the message"
```

The stack trace is captured **when the object is constructed** — not when it is thrown. That is why `new Exception()` is expensive (filling the trace walks the stack) and why creating exceptions for control flow is slow (lesson 6).

## Reading a stack trace

```
Exception in thread "main" java.lang.NumberFormatException: For input string: "4.2"
    at java.base/java.lang.NumberFormatException.forInputString(NumberFormatException.java:67)
    at java.base/java.lang.Integer.parseInt(Integer.java:661)
    at java.base/java.lang.Integer.parseInt(Integer.java:777)
    at com.example.Parser.readAge(Parser.java:42)
    at com.example.Parser.parse(Parser.java:18)
    at com.example.Main.main(Main.java:9)
```

Read it this way:

1. **The first line**: the thread, the exception class, the message. Here the message tells you the bad input exactly.
2. **The frames, top to bottom**: innermost first. The top frames are usually library code that *detected* the problem; scan down to the first frame in **your** package — `Parser.readAge(Parser.java:42)` — that is where to look. The frames below show how execution got there.
3. **`Caused by:`** sections (chained exceptions) follow, each with its own trace, and `... 12 more` means frames identical to the enclosing trace were omitted.

A stack trace is a gift: it names the exact line. Learn to jump to the first frame of your own code rather than reading from the top.

## The common unchecked exceptions, and what they mean

| Exception | What it says about your code |
| --- | --- |
| `NullPointerException` | A null reference was dereferenced. Since Java 14 the message says *which* one: `Cannot invoke "String.length()" because "name" is null`. |
| `ArrayIndexOutOfBoundsException` | An index outside `0..length-1`; the message gives index and length. |
| `StringIndexOutOfBoundsException` | `charAt`/`substring` out of range. |
| `IllegalArgumentException` | A method received an argument it cannot accept — thrown by *you* in validation. |
| `IllegalStateException` | The object was not in a state that allows the call (`Iterator.remove` twice, a closed stream). |
| `NumberFormatException` | `parseInt`/`parseDouble` on non-numeric text. |
| `ArithmeticException` | Integer division by zero; `BigDecimal` non-terminating division. |
| `ClassCastException` | A downcast to a class the object is not. |
| `UnsupportedOperationException` | An optional operation not supported by this implementation (`List.of(…).add`). |
| `ConcurrentModificationException` | A collection was modified during iteration. |
| `NoSuchElementException` | `next()` past the end, `Optional.get()` on empty, `Scanner` with no token. |

Most of these mean **a bug in the calling code**, not a condition to catch: fix the null, the index, the argument. The exception is the diagnosis.

## `Throwable` versus `Exception` versus `RuntimeException` in a `catch`

`catch (Exception e)` catches every checked and unchecked exception but not `Error`s; `catch (RuntimeException e)` only unchecked; `catch (Throwable t)` everything including `OutOfMemoryError`. The last belongs only at the very top of a thread (a framework's request loop) where the intent is to log and keep the process alive — and even there, `Error`s are usually rethrown.

## Exceptions are objects

You can store them, pass them, inspect them, and construct them without throwing. `throw` needs a `Throwable` expression: `throw new IllegalStateException("closed")`. The `throw` statement ends the method's normal execution immediately; code after it in the block is unreachable.

## Interview angle

- *"Difference between `Error` and `Exception`?"* `Error`s are JVM-level failures you do not catch; `Exception`s are conditions a program may handle.
- *"Checked vs unchecked — which classes?"* Unchecked = `RuntimeException` and its subclasses (and `Error`s); everything else under `Exception` is checked.
- *"Is `NullPointerException` checked?"* No — it extends `RuntimeException`.
- *"When is the stack trace captured?"* At construction, in `Throwable`'s constructor.
- *"What does `... 12 more` mean?"* Frames shared with the enclosing trace were elided.

## Key takeaways

- `Throwable` → `Error` (do not catch) and `Exception` → checked (compiler-enforced) vs `RuntimeException` (unchecked).
- Unchecked exceptions usually mean a bug: fix the cause rather than catching.
- Read a stack trace by finding the first frame in your own code; the message often names the bad value.
- An exception is an object with a message, a cause and a trace captured at construction.
