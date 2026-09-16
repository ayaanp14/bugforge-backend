---
title: Static fields, methods and initialisation
minutes: 13
---
`static` marks a member as belonging to the **class** rather than to any object: one copy for the whole program, reachable without an instance. Used well it gives you constants, counters, utility methods and factories. Used carelessly it gives you global mutable state, the source of some of the hardest bugs in Java programs. This lesson covers what `static` means at run time, when to use it, and the class-initialisation sequence behind it.

## Static fields

```java
public class Ticket {
    private static int nextId = 1;            // one for the class
    private final int id;                     // one per ticket

    public Ticket() {
        id = nextId++;                        // every ticket takes the next number
    }
    public static int issued() { return nextId - 1; }
}
```

There is exactly one `nextId` however many tickets exist — or none. It is created when the class is loaded and lives until the JVM exits. Access it as `Ticket.issued()` (through the class); accessing a static through an instance (`t.issued()`) compiles with a warning and misleads readers.

Legitimate static fields:

- **Constants**: `public static final int MAX = 100;` `private static final Pattern EMAIL = Pattern.compile(…);` — `static` so there is one, `final` so it never changes.
- **Caches and registries** shared by design (with care for threads — Module 17).
- **Counters** like `nextId` — and again, thread-unsafe as written; `AtomicInteger` fixes that.
- **Loggers**: `private static final Logger log = …`.

Illegitimate: anything that is really per-object state, or "global variables" reached from everywhere because passing them was inconvenient.

## Static methods

```java
public static int max(int a, int b) { return a > b ? a : b; }
public static Ticket parse(String text) { … return new Ticket(…); }
```

A static method has no `this`. It can use its parameters, static fields and other static methods; it cannot use instance members without an object. It is the right choice for:

- **Pure functions** of their arguments: `Math.abs`, `Integer.parseInt`, `Character.isDigit`, your `gcd(a, b)`.
- **Factories**: `LocalDate.of`, `List.of`, `Ticket.parse`.
- **`main`** — nothing exists yet when it starts.

If a method uses no instance state, IDEs suggest making it static; that suggestion is usually right. If it *does* use instance state, it must not be static, however tempting for calling convenience.

Static methods are **not polymorphic**: a subclass can declare a static method with the same signature, but that *hides* the parent's rather than overriding it, and the call is resolved by the reference's static type. Module 8. (`@Override` on a static method is an error.)

## Static initialiser blocks

```java
public class Config {
    private static final Map<String, String> DEFAULTS;
    static {
        Map<String, String> m = new HashMap<>();
        m.put("host", "localhost");
        m.put("port", "8080");
        DEFAULTS = Collections.unmodifiableMap(m);    // final static assigned once, here
    }
}
```

A `static { … }` block runs once, when the class is initialised, in textual order with static field initialisers. Use it when a static value needs more than an expression to build (loops, try/catch). `Map.of(…)` and `List.of(…)` make many such blocks unnecessary today.

## When a class is initialised

The JVM initialises a class **lazily**, the first time it is *actively used*: an instance is created, a static method is called, a non-constant static field is read or written, or a subclass is initialised. Loading a class (`Class.forName` without initialisation, or just referring to `Ticket.class`) does not trigger it; reading a compile-time constant (`Ticket.MAX`) does not either — the constant was inlined.

Initialisation runs the static initialisers and blocks top to bottom, exactly once, and is thread-safe (the JVM locks it). Superclasses first. If it throws, the class is marked erroneous and every later use throws `NoClassDefFoundError` — the "worked on the first request, broken forever after" symptom.

A static field initialised from another static field declared **below** it sees the default value:

```java
static int a = b + 1;    // b is still 0 here
static int b = 5;        // a is 1, not 6
```

The compiler allows this when the read goes through a method or a qualified name; declare in dependency order and the problem disappears.

## Utility classes

A class of only static methods — `Math`, `Arrays`, `Collections`, your `StringUtils`:

```java
public final class Geometry {
    private Geometry() { }                    // no instances, ever
    public static double area(double r) { return Math.PI * r * r; }
}
```

`final` and a private constructor say "do not instantiate or extend". Static imports (`import static Geometry.area`) make the calls read naturally.

## Singletons

A class with one instance, reached through a static accessor:

```java
public final class Registry {
    private static final Registry INSTANCE = new Registry();
    private Registry() { }
    public static Registry get() { return INSTANCE; }
}
```

Initialised on first use by the class-initialisation lock, so it is thread-safe without code. An `enum` with one constant is the idiom *Effective Java* prefers (serialization-safe, reflection-safe). Singletons are global state in a costume; frameworks with dependency injection largely replaced them.

## Static nested classes

`static class Node { … }` inside another class is a class that merely lives in its namespace and has no reference to an outer instance — Module 11. Very common for helper types (`Map.Entry`, list nodes).

## The costs of static state

- **Hidden dependencies**: a method that reads a static field depends on something not in its signature.
- **Testing**: static state persists between tests; resetting it is manual and fragile.
- **Concurrency**: shared without saying so; every thread sees the same field.
- **Lifetime**: a static reference keeps its object alive until the class is unloaded — static collections are the classic Java memory leak (Module 16).

The default is instance state passed explicitly; reach for `static` for constants, pure functions and factories, and be deliberate about anything mutable.

## Interview angle

- *"Can a static method be overridden?"* No — hidden, resolved statically.
- *"When does a static block run?"* Once, at class initialisation, on first active use.
- *"Can a static method access `this`?"* No.
- *"What is a static nested class?"* A nested class without an outer-instance reference.
- *"How do you implement a thread-safe singleton?"* A `static final` field initialised at class init, or an enum.

## Key takeaways

- `static` = one per class, alive for the program; access through the class name.
- Static methods have no `this`: for pure functions, factories and `main`; they hide rather than override.
- Static initialisers run once, lazily, in textual order, under a lock; failures poison the class.
- Constants, loggers, factories: yes. Mutable global state: only deliberately, with thread safety in mind.
