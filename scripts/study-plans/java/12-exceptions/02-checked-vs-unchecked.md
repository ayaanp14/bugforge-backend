---
title: Checked versus unchecked — the rules and the judgement
minutes: 13
---
Java is almost alone among mainstream languages in having **checked exceptions**: failures the compiler forces you to acknowledge at every call site. Whether that was a good idea is a twenty-year argument; that you must understand the rules is not. This lesson covers what the compiler demands, how `throws` propagates, how to convert between the two kinds, and the guidelines the JDK and *Effective Java* use to decide which kind a new exception should be.

## The rule

If a method can throw a checked exception — one that is an `Exception` but not a `RuntimeException` — it must either **catch** it or **declare** it with `throws`:

```java
static String read(Path p) throws IOException {        // declared: the caller must deal with it
    return Files.readString(p);
}

static String readOrEmpty(Path p) {                     // caught: the caller is not bothered
    try {
        return Files.readString(p);
    } catch (IOException e) {
        return "";
    }
}

static String broken(Path p) {
    return Files.readString(p);      // compile error: unreported exception IOException; must be caught or declared to be thrown
}
```

`throws` lists checked exceptions a method may let escape; unchecked ones may be listed for documentation but need not be. A method that declares `throws Exception` forces every caller to handle `Exception` — which is why broad declarations are a smell outside `main` and test code.

## Propagation

An uncaught exception unwinds the stack: the current method ends, its caller's `catch` blocks are searched, then the caller's caller, until a handler is found or the thread dies (printing the trace). Each method on that path must have declared the checked exception. The chain of `throws` is the compile-time shadow of that run-time unwinding.

Unchecked exceptions unwind the same way — the difference is purely that the compiler does not track them.

## Overriding and `throws`

An override may throw the same, fewer or narrower checked exceptions than the overridden method — never broader or new ones (Module 8). Consequence: an interface method that declares nothing (`Runnable.run`, `Function.apply`) can never be implemented by code that lets a checked exception escape. This is the source of most friction between checked exceptions and lambdas.

## Converting checked to unchecked

When a checked exception cannot happen (a hard-coded `URI`), should not be recoverable (a config file that must exist), or must cross a boundary that does not allow it (a lambda), wrap it:

```java
try {
    return Files.readString(path);
} catch (IOException e) {
    throw new UncheckedIOException("cannot read " + path, e);     // keep the cause!
}

catch (InterruptedException e) {
    Thread.currentThread().interrupt();                            // restore the flag — special case
    throw new IllegalStateException("interrupted", e);
}
```

`UncheckedIOException` exists for exactly this; for other checked exceptions, `IllegalStateException(msg, cause)` or a custom unchecked exception. **Always pass the original as the cause** — losing it loses the real stack trace.

Converting the other way (throwing a checked exception from a place that caught an unchecked one) is rare and usually wrong.

## The `throws` clause on `main`

`public static void main(String[] args) throws Exception` is the accepted way to let everything propagate in small programs and exercises: the JVM prints the trace and exits non-zero. In real applications `main` catches, logs and exits deliberately.

## The design guideline: which kind?

The JDK's rule of thumb, refined by *Effective Java* items 70–71:

**Checked** when the condition is *expected* in a correct program and the caller can plausibly *recover*: a file that may not exist, a network that may fail, a user-entered date that may be malformed (`DateTimeParseException` is unchecked, though — the JDK is inconsistent). The compiler-enforced acknowledgement is the feature.

**Unchecked** when the condition is a *programming error* the caller cannot recover from at that point: null arguments, bad indices, illegal state, violated preconditions. Forcing every caller to `catch (NullPointerException)` would be noise; the fix is in the code, not the handler.

Modern practice leans unchecked for almost everything an application defines: frameworks (Spring, Jakarta) wrap data-access exceptions unchecked; Kotlin and Scala dropped checked exceptions entirely. The argument against checked: they leak implementation details up the stack (`throws SQLException` on a business method), they do not compose with lambdas and streams, and in practice most catch blocks just wrap and rethrow. The argument for: they document failure modes in the type system, and `IOException` genuinely should not be forgotten. A reasonable position: **use checked exceptions for recoverable conditions at API boundaries you control, unchecked for everything else, and never throw `Exception` or `Throwable`**.

## Declaring precisely

```java
void load() throws FileNotFoundException, ParseException     // specific: callers can handle each
void load() throws Exception                                  // lazy: callers learn nothing and must catch everything
```

Declare the most specific types. If a method throws three unrelated checked exceptions, consider whether it is doing three things, or whether one domain exception should wrap them.

## Checked exceptions and lambdas

```java
paths.stream().map(p -> Files.readString(p))     // compile error: IOException inside Function.apply
```

Options: catch and wrap inside the lambda (`UncheckedIOException`); a helper `static String readUnchecked(Path p)`; or a custom `ThrowingFunction` interface with an adapter. The first two are the everyday answers. Streams and checked exceptions do not mix; design library methods called from lambdas to throw unchecked.

## Interview angle

- *"What is a checked exception?"* A subclass of `Exception` but not `RuntimeException`; the compiler requires catch-or-declare.
- *"Why does `Files.readString` need a `try` but `Integer.parseInt` does not?"* `IOException` is checked; `NumberFormatException` is unchecked.
- *"How do you throw a checked exception from a lambda?"* You cannot let it escape; wrap it in an unchecked exception with the cause.
- *"When would you create a checked exception?"* For a recoverable, expected condition at an API boundary — rarely, in modern code.
- *"Can an override add `throws IOException` if the parent declares none?"* No.

## Key takeaways

- Checked = `Exception` minus `RuntimeException`; callers must catch or declare. Unchecked propagates silently.
- `throws` propagates the obligation up the call chain; overrides may narrow, never broaden.
- Wrap checked in unchecked (`UncheckedIOException`, `IllegalStateException`) at boundaries and in lambdas — always with the cause.
- Checked for recoverable, expected conditions; unchecked for programming errors — and modern code leans unchecked.
- Declare specific types; never `throws Exception` in an API.
