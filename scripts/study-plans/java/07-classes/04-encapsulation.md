---
title: Encapsulation, access modifiers and immutability
minutes: 15
---
Encapsulation is the practice of keeping an object's state private and letting it change only through methods that keep it valid. It is what makes a class more than a struct: the class, not its callers, is responsible for its invariants. This lesson covers the four access levels, the getter/setter convention and its limits, and the strongest form of encapsulation — immutability — which Java rewards with thread safety and simplicity.

## The four access levels

| Modifier | Same class | Same package | Subclass (other package) | Everyone |
| --- | --- | --- | --- | --- |
| `private` | ✓ | | | |
| *(none — package-private)* | ✓ | ✓ | | |
| `protected` | ✓ | ✓ | ✓ | |
| `public` | ✓ | ✓ | ✓ | ✓ |

Rules of thumb:

- **Fields: `private`.** Always, unless it is a `public static final` constant. A public mutable field is a value nobody can validate, log, or change the representation of.
- **Methods: as narrow as works.** `public` for the API, `private` for helpers, package-private for collaboration within a package, `protected` only when subclasses genuinely need a hook.
- **Classes: `public` for the API, package-private for internals.** A top-level class can only be `public` or package-private; nested classes may use all four.

Access is checked at compile time *and* by the JVM, so a private field really is private — barring reflection, which the module system (Module 19) can also close.

`protected` is more open than it sounds: it includes the whole package, not just subclasses. And `private` is per-**class**, not per-object: `other.balance` inside `BankAccount` is legal for another `BankAccount` — which is how `equals` can compare fields.

## Getters and setters

```java
public class Person {
    private String name;
    private int age;

    public String getName() { return name; }
    public void setName(String name) { this.name = Objects.requireNonNull(name); }
    public int getAge() { return age; }
    public void setAge(int age) {
        if (age < 0 || age > 150) throw new IllegalArgumentException("age " + age);
        this.age = age;
    }
    public boolean isAdult() { return age >= 18; }     // boolean getters use "is"
}
```

The `getX`/`setX`/`isX` names are the **JavaBeans** convention, and many frameworks (serialization, templating, ORM) find properties by it, so it is worth following when a class is a data holder. But a setter for every field is *not* encapsulation — it is a public field with extra steps. Ask, for each field: does it change after construction? Who should be allowed to change it? Under what checks? Often the answer is a **behavioural** method (`deposit`, `rename`, `markPaid`) rather than a setter, and often the field is simply `final`.

A getter that returns a mutable field (a `List`, an array, a `Date`) leaks the state; return a copy or an unmodifiable view (Module 6, Module 14).

Modern Java offers `record` (Module 10) for pure data carriers — accessors without the `get` prefix, no setters, generated `equals`/`hashCode`/`toString`.

## Invariants are the point

```java
public final class Range {
    private final int lo, hi;          // invariant: lo <= hi

    public Range(int lo, int hi) {
        if (lo > hi) throw new IllegalArgumentException(lo + " > " + hi);
        this.lo = lo; this.hi = hi;
    }
    public int length() { return hi - lo; }
    public boolean contains(int x) { return lo <= x && x < hi; }
    public Range shift(int by) { return new Range(lo + by, hi + by); }    // returns a new Range
}
```

Because the fields are private and final and the only way in is a validating constructor, `length()` can never be negative and `contains` never has to check `lo <= hi`. The invariant is established once and holds forever. That is the payoff of encapsulation: the rest of the code trusts the object.

## Immutability

An object is **immutable** if its state cannot change after construction. Recipe (*Effective Java* item 17):

1. No mutators — no setters, no methods that change fields.
2. All fields `private final`.
3. The class `final` (or all constructors private with static factories), so no subclass can add mutation.
4. Mutable components are never shared: defensive copies in and out (`List.copyOf`, `clone`).
5. "Modifying" operations return a **new** instance (`shift` above, `String.toUpperCase`, `BigDecimal.add`, `LocalDate.plusDays`).

Why bother:

- **Thread safety for free** — nothing to synchronise.
- **Safe sharing** — one instance can be handed to anyone, cached, used as a map key.
- **Simplicity** — an immutable object has exactly one state to reason about; no "what if it changed between these two lines".
- **Failure atomicity** — a method that throws cannot leave the object half-modified.

The cost is allocation for every "change" — usually negligible, occasionally significant (a `String` built by `+=` — hence `StringBuilder`, the mutable companion). Design value-like types (money, points, dates, ranges, ids) immutable by default; use mutability for entities with identity and lifecycle (an account, a session, a connection).

`final` on a field is necessary but not sufficient: `private final List<String> items` can still be `items.add(x)`-ed. Immutability is about the reachable object graph, not the reference.

## Package-private and the "friend" pattern

Java has no C++ `friend`. Classes that must share internals live in the same package and use package-private members; the package is the unit of encapsulation above the class. Keep such packages small and the shared members few.

## Tell, don't ask

```java
// asking: pull the state out and decide outside
if (account.getBalance() >= amount) account.setBalance(account.getBalance() - amount);
// telling: let the object do it, keeping the invariant inside
boolean ok = account.withdraw(amount);
```

The first form spreads the rule ("balance must not go negative") across every caller; the second keeps it in one place. When you find yourself writing `get`-compute-`set`, move the computation into the class.

## Interview angle

- *"What is encapsulation?"* Private state, controlled access, invariants maintained by the class.
- *"Difference between `protected` and package-private?"* `protected` adds subclasses in other packages to package access.
- *"How do you make a class immutable?"* No setters, private final fields, final class, defensive copies, return new instances.
- *"Why are immutable objects thread-safe?"* No state changes, so no races.
- *"Is a class with getters and setters for every field encapsulated?"* Not meaningfully.

## Key takeaways

- Fields private; methods as narrow as possible; `protected` includes the package.
- Getters/setters are a convention, not a design: prefer behavioural methods and `final` fields; never leak mutable internals.
- Constructors establish invariants; mutators preserve them; callers never see a broken object.
- Immutable by default for value types: private final fields, final class, copies in and out, new instances for changes.
