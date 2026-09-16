---
title: Constructors and initialisation order
minutes: 15
---
A constructor turns freshly allocated memory into a valid object. Get it right and an object can never exist in a broken state; get it wrong and every method must defend against half-built objects. This lesson covers constructor rules, overloading and chaining with `this(...)`, the exact order in which fields, initialiser blocks and constructor bodies run, and the validation that belongs there.

## Declaring a constructor

```java
public class BankAccount {
    private final String owner;
    private long balanceCents;

    public BankAccount(String owner, long openingCents) {
        if (owner == null || owner.isBlank()) throw new IllegalArgumentException("owner required");
        if (openingCents < 0) throw new IllegalArgumentException("opening balance must be >= 0");
        this.owner = owner;
        this.balanceCents = openingCents;
    }
}
```

A constructor has the class's name, no return type (not even `void`), and any access modifier. It runs once per `new`. It may throw — and *should* when its arguments cannot make a valid object; a constructor that silently accepts garbage moves the crash somewhere far away.

A `final` field must be assigned exactly once by the end of every constructor — the compiler checks — which makes `final` the tool for "set once, at construction, never changes".

## The default constructor

If you declare **no** constructor, the compiler generates a public no-argument one that does nothing beyond field initialisers. Declare *any* constructor and the default disappears — `new BankAccount()` becomes a compile error unless you add one explicitly. This surprises people who add a parameterised constructor to a class that other code creates with `new X()`.

## Overloading and chaining with `this(...)`

```java
public BankAccount(String owner) {
    this(owner, 0);            // delegate to the full constructor — must be the FIRST statement
}
public BankAccount(String owner, long openingCents) { … the real work … }
```

Constructors overload like methods and are resolved by the same rules. `this(...)` calls another constructor of the same class and **must be the first statement**; it is the idiom for defaults, and it keeps validation in one place. Chains may be several deep but must not be circular.

`super(...)` is the sibling call to the parent's constructor (Module 8); a constructor that starts with neither gets an implicit `super()`.

## Field initialisers and initialiser blocks

```java
public class Counter {
    private int count = 0;                              // field initialiser
    private final List<String> log = new ArrayList<>();  // common for collections
    private final long createdAt;

    {                                                   // instance initialiser block — rare
        createdAt = System.currentTimeMillis();
    }

    public Counter() { }
}
```

Field initialisers run for every constructor, in textual order, before the constructor body. Instance initialiser blocks are the same mechanism in block form — useful only when several constructors share setup that cannot be a field initialiser (an exception-throwing computation, a loop). Most classes use field initialisers for defaults and the constructor for arguments.

## The order, exactly

For `new Sub(...)` where `Sub extends Base` (the full picture is Module 8; here is the sequence):

1. Memory allocated; **all fields set to defaults** (0/false/null) — including the subclass's.
2. `Sub`'s constructor begins; its first statement is `super(...)` (explicit or implicit).
3. `Base`'s field initialisers and instance blocks run, in textual order.
4. `Base`'s constructor body runs.
5. `Sub`'s field initialisers and instance blocks run, in textual order.
6. `Sub`'s constructor body runs.

The consequence worth remembering: a field initialiser cannot read a field declared later (illegal forward reference), and a constructor that calls a method which a subclass overrides runs that override *before the subclass's fields are initialised* — they are still at their defaults. Calling overridable methods from constructors is a known trap (Module 8).

## Validation and invariants

An **invariant** is a condition that is always true of a valid object — balance ≥ 0, name non-blank, start ≤ end. The constructor establishes it; every mutator preserves it. Establishing it means checking arguments and throwing `IllegalArgumentException` (or `NullPointerException` via `Objects.requireNonNull`) on bad input:

```java
this.owner = Objects.requireNonNull(owner, "owner");
if (start.isAfter(end)) throw new IllegalArgumentException("start after end: " + start + " > " + end);
```

Messages should say what was wrong and what the value was. A constructor that validates is the reason the rest of the class can trust its fields.

## Defensive copies in constructors

```java
public Schedule(List<LocalDate> dates) {
    this.dates = List.copyOf(dates);       // our own immutable copy; the caller's list can change freely
}
public Scores(int[] values) {
    this.values = values.clone();
}
```

Storing a mutable argument directly aliases it (Module 6). Copy it — and *validate the copy*, not the original, so the caller cannot change it between the check and the store.

## Static factory methods instead of constructors

```java
public static BankAccount empty(String owner) { return new BankAccount(owner, 0); }
public static Color fromHex(String hex) { … }
Integer.valueOf(5); LocalDate.of(2026, 9, 16); List.of(1, 2); Optional.empty();
```

A static method that returns an instance has advantages a constructor lacks: a **name** (`fromHex` vs `fromRgb` instead of two constructors that both take ints), the freedom to **return a cached instance** (`Integer.valueOf`), to **return a subtype**, or to return an existing object. *Effective Java* item 1. Make the constructor private when factories are the intended entry point.

## Copy constructors

`public Point(Point other) { this(other.x, other.y); }` — a constructor taking an instance of the same class. Java has no built-in copy; `clone()` is a broken legacy design most codebases avoid. A copy constructor or a static `copyOf` is the idiom.

## Constructors and inheritance, briefly

Constructors are **not inherited**: a subclass must declare its own (or accept the default), and each one calls a parent constructor first. Module 8.

## Common mistakes

| Mistake | Effect |
| --- | --- |
| `public void BankAccount(...)` | A method named like the class, not a constructor; `new` still uses the default |
| Adding a constructor and forgetting `new X()` callers | They no longer compile |
| `this(...)` not first | Compile error |
| Assigning parameter to itself (`owner = owner`) | Field stays null (Module 5) |
| Storing a mutable argument without copying | Caller can mutate your state |
| Calling an overridable method in the constructor | Runs on a partially initialised subclass |

## Interview angle

- *"What happens if you declare no constructor?"* A public no-arg default is generated — until you declare any constructor.
- *"Can a constructor be private?"* Yes: singletons, factories, utility classes.
- *"Order of field initialisers and constructor body?"* Initialisers first (after the super constructor), then the body.
- *"Can a constructor return a value?"* No; it has no return type. Static factories can return anything.

## Key takeaways

- Constructors establish invariants: validate, throw on bad arguments, copy mutable inputs.
- Declaring any constructor removes the default; `this(...)` chains and must come first.
- Order: defaults → super constructor → field initialisers (textual) → constructor body.
- `final` fields are assigned exactly once by the end of construction.
- Static factories give names, caching and flexibility a constructor cannot.
