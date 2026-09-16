---
title: Enums with fields, constructors and behaviour
minutes: 14
---
An enum is a class, so its constants can carry data and its type can have methods. That turns a bare list of names into a table of related facts — a planet's mass, a currency's symbol, an operation's implementation — that lives with the type instead of in parallel arrays or `switch` statements scattered through the code. This lesson covers enum fields and constructors, per-constant behaviour, enums implementing interfaces, and the lookup patterns you will write for every enum that maps to external codes.

## Fields and constructors

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    EARTH  (5.976e+24, 6.37814e6),
    JUPITER(1.9e+27,   7.1492e7);

    private final double mass;      // kg
    private final double radius;    // m

    Planet(double mass, double radius) {        // implicitly private; no access modifier allowed but private
        this.mass = mass;
        this.radius = radius;
    }

    public double surfaceGravity() { return 6.67300E-11 * mass / (radius * radius); }
    public double mass() { return mass; }
}

Planet.EARTH.surfaceGravity();       // 9.8
```

Each constant is created by calling the constructor with its arguments, at class initialisation, in declaration order. Rules:

- The constant list comes **first** and ends with a semicolon when anything follows.
- Constructors are implicitly `private`; you cannot call them, only the constant declarations do.
- Fields should be `final`: an enum with mutable fields is a global variable with several names — legal, and almost always a mistake.
- Static fields are not accessible from the constructor (they may not be initialised yet, since constants are created first); compute lookup tables in a static block after the constants exist.

## Methods and overriding `toString`

```java
public enum Level {
    LOW("low"), MEDIUM("medium"), HIGH("high");
    private final String label;
    Level(String label) { this.label = label; }
    @Override public String toString() { return label; }
    public boolean atLeast(Level other) { return compareTo(other) >= 0; }
}
```

`toString` is for display; `name()` stays the identifier (`"LOW"`) and is `final`. Business methods using `ordinal`-based `compareTo` are fine when declaration order is meaningful and documented.

## Per-constant behaviour

When each constant needs a different *implementation*, two styles:

**Constant-specific class bodies** — each constant overrides an abstract method:

```java
public enum Operation {
    ADD("+") { public int apply(int a, int b) { return a + b; } },
    SUB("-") { public int apply(int a, int b) { return a - b; } },
    MUL("*") { public int apply(int a, int b) { return a * b; } };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }
    public abstract int apply(int a, int b);
    public String symbol() { return symbol; }
}
Operation.MUL.apply(6, 7);       // 42
```

Each constant with a body is an anonymous subclass (the enum is then not `final`, and `getClass()` differs from `getDeclaringClass()`). The compiler forces every constant to implement the abstract method — adding `DIV` without `apply` is an error.

**A functional field** — pass the behaviour as a lambda:

```java
public enum Operation {
    ADD("+", (a, b) -> a + b),
    SUB("-", (a, b) -> a - b),
    MUL("*", (a, b) -> a * b);

    private final String symbol;
    private final IntBinaryOperator op;
    Operation(String symbol, IntBinaryOperator op) { this.symbol = symbol; this.op = op; }
    public int apply(int a, int b) { return op.applyAsInt(a, b); }
}
```

Shorter, and the preferred modern form. Either beats a `switch (this)` inside the method, which must be edited for every new constant and cannot be checked for completeness.

## Enums implementing interfaces

```java
public interface Shape { double area(); }
public enum UnitShape implements Shape {
    SQUARE { public double area() { return 1; } },
    CIRCLE { public double area() { return Math.PI; } };
}
```

An enum cannot extend a class but can implement any number of interfaces. This lets enums plug into polymorphic code and, for sealed interfaces, serve as fixed-instance variants alongside records.

## Lookup by code

Enums frequently correspond to external codes — database values, protocol bytes, user strings. `valueOf` handles only the exact constant name; write a lookup for everything else:

```java
public enum Status {
    ACTIVE("A"), SUSPENDED("S"), CLOSED("C");

    private final String code;
    Status(String code) { this.code = code; }
    public String code() { return code; }

    private static final Map<String, Status> BY_CODE = new HashMap<>();
    static {
        for (Status s : values()) BY_CODE.put(s.code, s);       // built once, after the constants exist
    }
    public static Status fromCode(String code) {
        Status s = BY_CODE.get(code);
        if (s == null) throw new IllegalArgumentException("unknown status code: " + code);
        return s;
    }
    public static Optional<Status> tryFromCode(String code) { return Optional.ofNullable(BY_CODE.get(code)); }
}
```

The static block runs after all constants are constructed (the constants are the first static initialisers), so `values()` is complete. A `Map` beats a linear scan for more than a handful of constants; `Arrays.stream(values()).filter(…).findFirst()` is fine for small enums.

## Enums and `switch`, revisited

With behaviour on the enum, most `switch (status)` blocks elsewhere in the code become `status.method()` calls — polymorphism instead of dispatch tables. Keep `switch` for logic that belongs to the *caller* (a UI deciding colours), and put logic that belongs to the *concept* on the enum.

## Initialisation order pitfalls

```java
enum Bad {
    A, B;
    private static int count = 0;
    Bad() { count++; }          // compile error: illegal reference to static field from initializer
}
```

Constants are constructed before other static fields are initialised, so constructors cannot touch static fields. Count in a static block instead, or use `values().length`.

## `EnumSet` and `EnumMap` preview

Collections of enums should be `EnumSet` (a bit set) and `EnumMap` (an array indexed by ordinal) — orders of magnitude cheaper than `HashSet`/`HashMap` and iterating in declaration order. Next lesson.

## Interview angle

- *"Can an enum have a constructor?"* Yes, implicitly private, run once per constant at class initialisation.
- *"How do you give each constant different behaviour?"* Abstract method with constant-specific bodies, or a functional-interface field.
- *"Why can't an enum constructor read a static field?"* Constants initialise first; the static field would still be default.
- *"How do you map a database code to an enum?"* A static `Map<String, Enum>` built in a static block, with a `fromCode` factory.
- *"Can an enum implement an interface?"* Yes — any number.

## Key takeaways

- Constants first, then `final` fields, a private constructor and methods; each constant is built with its arguments.
- Per-constant behaviour: an abstract method overridden per constant, or a lambda-typed field — not a `switch (this)`.
- Enums implement interfaces and plug into polymorphic code.
- Lookup by external code through a static map built in a static block; keep `name()` for persistence.
- Constructors run before other statics — compute tables afterwards.
