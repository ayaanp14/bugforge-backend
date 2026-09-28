---
title: try-with-resources and AutoCloseable
minutes: 12
seo-title: Try-With-Resources in Java: AutoCloseable and Close Order
description: Java try-with-resources closes every AutoCloseable in its header on every exit path, in reverse order, keeping close failures as suppressed exceptions.
question: What is try-with-resources in Java?
answer: Try-with-resources, added in Java 7, is a `try` statement that declares resources in its header — `try (BufferedReader br = Files.newBufferedReader(path))` — and closes them automatically on every exit path, in reverse declaration order. Each resource must implement `AutoCloseable`. If both the body and `close()` throw, the body's exception propagates and the close failure is attached to it as a suppressed exception.
q: In what order does try-with-resources close resources?
a: In reverse declaration order: the last resource declared is closed first, because later resources may depend on earlier ones. If creating the second resource throws, the first one is still closed.
q: What is a suppressed exception in Java?
a: An exception thrown by `close()` while an exception from the try-with-resources body is already propagating. Instead of replacing the body's exception, it is attached to it with `addSuppressed`; `getSuppressed()` returns it, and `printStackTrace` prints it under `Suppressed:`.
q: What is the difference between AutoCloseable and Closeable?
a: `AutoCloseable` declares `void close() throws Exception` and is the type every try-with-resources resource must have. `Closeable` is its I/O subinterface, whose `close()` throws `IOException`. Use `Closeable` for I/O classes and `AutoCloseable` for everything else, such as locks or scoped state.
q: Does the catch block run before or after the resource is closed?
a: After. In a try-with-resources statement the resources are closed before any `catch` or `finally` block of the same statement runs, so a `catch` block cannot use the resource. Work that needs it open belongs in the body.
q: How do you write a class that works with try-with-resources?
a: Implement `AutoCloseable` and release the resource in `close()`. Make `close()` idempotent so a second call does nothing, declare the narrowest exception — no `throws` at all if it cannot fail — and implement it only on classes that genuinely have something to release.
---
Files, sockets, database connections and locks must be released whether or not the code using them throws. Before Java 7 that meant `finally` blocks with null checks and nested `try`s that were wrong more often than right — and when both the work and the cleanup threw, the interesting exception was lost. **try-with-resources** makes the correct pattern the short one: declare the resource in the `try` header and the compiler generates the close, in the right order, preserving every exception.

## The form

```java
try (BufferedReader br = Files.newBufferedReader(path)) {
    return br.readLine();
}                                                // br.close() is called here, always — even on return or throw
```

Any object whose type implements **`AutoCloseable`** (`void close() throws Exception`) — or its subinterface `Closeable` (`close() throws IOException`) — can be a resource. Streams, readers, writers, channels, `Scanner`, JDBC connections/statements/result sets, `ExecutorService` (Java 19+), `java.util.stream.Stream` (rarely needed) all qualify.

The resource variable is implicitly `final` and scoped to the `try` block. Since Java 9 an existing effectively-final variable can be used directly: `try (br) { … }`.

## Several resources

```java
try (InputStream in = Files.newInputStream(src);
     OutputStream out = Files.newOutputStream(dst)) {
    in.transferTo(out);
}                                                // closed in REVERSE order: out first, then in
```

Resources are separated by semicolons and closed in reverse declaration order — later resources may depend on earlier ones, so they are torn down first. If creating the second resource throws, the first is still closed.

## What it expands to

Roughly:

```java
BufferedReader br = Files.newBufferedReader(path);
Throwable primary = null;
try {
    return br.readLine();
} catch (Throwable t) {
    primary = t;
    throw t;
} finally {
    if (br != null) {
        if (primary != null) {
            try { br.close(); } catch (Throwable suppressed) { primary.addSuppressed(suppressed); }
        } else {
            br.close();
        }
    }
}
```

The two things this gets right that hand-written code got wrong: the resource is closed even if the body throws, and if **both** the body and `close()` throw, the body's exception propagates and the close exception is attached to it as a **suppressed** exception instead of replacing it.

## Suppressed exceptions

```java
try {
    …
} catch (IOException e) {
    for (Throwable s : e.getSuppressed()) log("also failed during close: " + s);
}
```

`Throwable.getSuppressed()` returns the close failures; `printStackTrace` prints them under `Suppressed:`. Nothing is lost. In the plain `finally` version the close exception would have won and the real cause vanished.

## `catch` and `finally` with resources

```java
try (Connection c = pool.get()) {
    c.execute(sql);
} catch (SQLException e) {          // runs AFTER the resource is closed
    log(e);
} finally {
    metrics.record();               // runs after close and after catch
}
```

The resource is closed **before** any `catch` or `finally` of the same statement runs. So a `catch` block cannot use the resource — it is already closed — and cleanup that must see the resource open belongs in the body.

## Writing an `AutoCloseable`

```java
public final class Timer implements AutoCloseable {
    private final long start = System.nanoTime();
    private final String label;
    public Timer(String label) { this.label = label; }
    @Override public void close() {                  // narrow the throws clause: nothing to declare
        System.out.println(label + ": " + (System.nanoTime() - start) / 1_000_000 + " ms");
    }
}

try (Timer t = new Timer("load")) {
    load();
}                                                    // prints the elapsed time whatever happens
```

Any class holding something that needs releasing — a file handle, a lock, a temporary directory, a scoped setting — should implement `AutoCloseable`. Guidelines: make `close()` **idempotent** (a second call does nothing), declare the narrowest exception (`void close()` with no `throws` if it cannot fail), and do not throw from `close()` unless the failure matters. `Closeable` is for I/O; `AutoCloseable` for everything else.

## Locks and scoped state

The pattern is not only for I/O. A lock guard:

```java
class Guard implements AutoCloseable {
    private final Lock lock;
    Guard(Lock l) { lock = l; lock.lock(); }
    public void close() { lock.unlock(); }
}
try (Guard g = new Guard(lock)) { … }
```

Or setting and restoring a thread-local, a logging context, a temporary system property — anything with a paired undo.

## What not to do

- **Do not** close a resource inside the body *and* let try-with-resources close it — double close is at best wasted, at worst an error; idempotent `close()` makes it harmless.
- **Do not** use try-with-resources for objects that must outlive the block (a connection stored in a field): the block closes it.
- **Do not** implement `AutoCloseable` on classes that have nothing to release just to allow the syntax.
- **Do not** forget it: a reader created without try-with-resources and closed in `finally` is legal and inferior. Static analysers flag "resource leak" for a reason.

## Interview angle

- *"What does try-with-resources require of the resource?"* `AutoCloseable` (or `Closeable`).
- *"In what order are multiple resources closed?"* Reverse declaration order.
- *"What happens if both the body and `close()` throw?"* The body's exception propagates; the close exception is suppressed and attached to it.
- *"Does `catch` run before or after close?"* After.
- *"Why is it better than `finally`?"* Correct in every path, shorter, and it preserves the primary exception.

## Key takeaways

- `try (R r = …) { … }` closes `r` on every exit path; resources are final and closed in reverse order.
- Body exception wins; close exceptions are *suppressed* and retrievable — nothing is lost.
- `catch`/`finally` run after the close.
- Implement `AutoCloseable` for anything with a paired release — I/O, locks, scoped state — with an idempotent `close()`.
