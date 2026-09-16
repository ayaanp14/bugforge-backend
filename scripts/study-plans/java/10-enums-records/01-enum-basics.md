---
title: Enums — a fixed set of named instances
minutes: 13
---
Before enums, a "day of the week" was `int DAY_MONDAY = 1` and nothing stopped you passing `7` or `42`. A Java `enum` is a class with a **fixed set of instances** created by the JVM, each a named constant, type-safe and comparable. Every enum you write is a full class — the next lesson adds fields and methods — but even the plain form solves most "a value from a known set" problems. This lesson is the plain form and the machinery every enum gets for free.

## Declaring

```java
public enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }

Day d = Day.FRIDAY;
Day bad = new Day();          // compile error: enum types may not be instantiated
```

`Day` is a class that extends `java.lang.Enum<Day>` implicitly; the seven constants are its only instances, `public static final`, created once when the class initialises. Constant names are UPPER_SNAKE_CASE. An enum can be top-level or nested (implicitly static). It is implicitly `final` — unless constants have bodies (next lesson) — and cannot extend another class (it already extends `Enum`), though it may implement interfaces.

## What every enum has

```java
Day.values()                  // Day[] of all constants, in declaration order — a fresh array each call
Day.valueOf("FRIDAY")         // FRIDAY; throws IllegalArgumentException for "friday" or "Fri"
d.name()                      // "FRIDAY" — the identifier, exactly
d.ordinal()                   // 4 — position in declaration order, zero-based
d.toString()                  // "FRIDAY" by default; overridable
d.compareTo(Day.MONDAY)       // positive — by ordinal; enums are Comparable in declaration order
d == Day.FRIDAY               // true — the idiomatic comparison
d.equals(Day.FRIDAY)          // also true; == is preferred (null-safe, compile-checked)
d.getDeclaringClass()         // Day.class
Enum.valueOf(Day.class, "MONDAY")   // the generic form
```

`==` is correct for enums because each constant is a single instance: no `equals` override to forget, no `NullPointerException` when the left side is null, and a type error if you compare against a different enum. Do not write `d.equals(…)` out of string habit.

## Enums in `switch`

```java
String kind = switch (d) {
    case SATURDAY, SUNDAY -> "weekend";
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "weekday";
};                               // exhaustive over the enum: no default needed
```

Case labels are the bare constant names (`SATURDAY`, not `Day.SATURDAY`). A switch **expression** covering every constant needs no `default`, and then *adding a constant breaks the compile* at every such switch — the safety that makes enums better than integer codes. A switch **statement** does not check exhaustiveness; a `null` selector throws `NullPointerException` in both.

## Parsing and printing

`valueOf` is exact and case-sensitive. For user input, normalise first (`Day.valueOf(s.trim().toUpperCase(Locale.ROOT))`) and catch `IllegalArgumentException`, or write a lenient static lookup (next lesson). Never rely on `ordinal()` for persistence — reordering the constants changes every stored number. Store `name()`, and make renaming a constant a deliberate migration.

## Comparing and sorting

Enums sort by ordinal — declaration order — with `compareTo`, `Collections.sort`, `TreeSet`. Declare constants in the order that makes sense as a ranking (`LOW, MEDIUM, HIGH`) and `compareTo` becomes meaningful. `Comparator.comparing(Enum::name)` sorts alphabetically if needed.

## Iterating

```java
for (Day d : Day.values()) { … }
Arrays.stream(Day.values()).filter(…)
EnumSet.allOf(Day.class)         // a Set view, faster than the array for membership tests (lesson 3)
```

`values()` clones the internal array each call — cheap for seven constants, but hoist it out of a hot loop or use `EnumSet`.

## Enums are singletons — properly

Each constant is exactly one object per JVM (per class loader). The JVM guarantees this through serialization (`readResolve` is built in) and reflection (`Constructor.newInstance` refuses enums). That makes a one-constant enum the most robust singleton in Java:

```java
public enum Registry {
    INSTANCE;
    private final Map<String, Object> entries = new HashMap<>();
    public void put(String k, Object v) { entries.put(k, v); }
}
Registry.INSTANCE.put("x", 1);
```

## Type safety versus constants

```java
static final int RED = 0, GREEN = 1;
paint(2);                        // compiles; meaningless

enum Color { RED, GREEN }
paint(Color.BLUE);               // compile error: no such constant
paint(2);                        // compile error: int is not a Color
```

The compiler knows the complete set, checks every use, and the debugger shows `GREEN` instead of `1`. Use enums for anything that is "one of a known set": states, kinds, levels, units, commands, directions.

## Common mistakes

| Mistake | Effect |
| --- | --- |
| `Day.valueOf("friday")` | `IllegalArgumentException` — exact name required |
| Persisting `ordinal()` | Silent corruption after reordering |
| `switch` on a null enum | `NullPointerException` |
| `case Day.MONDAY:` | Compile error — unqualified names only (Java 21 relaxes this) |
| Comparing enums from different types with `==` | Compile error — a feature |
| Mutable static state in an enum | Global mutable state with a nice name |

## Interview angle

- *"Can an enum extend a class?"* No — it already extends `Enum`; it can implement interfaces.
- *"`==` or `equals` for enums?"* `==`: single instances, null-safe, type-checked.
- *"What does `ordinal()` return and should you store it?"* Declaration index; no — store `name()`.
- *"Why is an enum a good singleton?"* One instance guaranteed by the JVM, serialization- and reflection-safe.
- *"Is a switch over an enum exhaustive without `default`?"* A switch *expression* covering all constants is; a statement is not checked.

## Key takeaways

- An enum is a class with a fixed set of named, singleton instances; compare with `==`.
- Free machinery: `values()`, `valueOf`, `name()`, `ordinal()`, `compareTo` by declaration order, `toString`.
- Switch expressions over all constants need no `default` and break on new constants — the point.
- Store `name()`, never `ordinal()`; `valueOf` is exact and throws.
