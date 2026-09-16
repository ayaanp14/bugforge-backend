---
title: Wrapper classes and autoboxing
minutes: 15
---
Every primitive has an object twin — `Integer` for `int`, `Double` for `double`, `Character` for `char`, `Boolean` for `boolean`, and `Byte`, `Short`, `Long`, `Float`. They exist so that primitives can go where only objects are allowed: collections, generics, reflection, `Object` parameters. Since Java 5 the compiler converts between the two automatically (**autoboxing** and **unboxing**), which is convenient and the source of three notorious bugs. This lesson is about using wrappers deliberately.

## What a wrapper is

```java
Integer boxed = Integer.valueOf(42);   // an object on the heap holding an int
int raw = boxed.intValue();            // back to the primitive
```

A wrapper is an **immutable** object with one field. `Integer` has no setter; "changing" one means making a new one. This is why `Integer count = 0; count++;` allocates a new `Integer` on every increment.

The wrappers also carry the static utilities you use constantly:

```java
Integer.parseInt("42")            // String → int (throws NumberFormatException)
Integer.valueOf("42")             // String → Integer
Integer.toString(42)              // int → String
Integer.toBinaryString(42)        // "101010"; also toHexString, toOctalString
Integer.MAX_VALUE, Integer.MIN_VALUE, Integer.SIZE (32), Integer.BYTES (4)
Integer.compare(a, b)             // -1 / 0 / 1, without overflow — use in comparators
Integer.bitCount(x), Integer.reverse(x), Integer.highestOneBit(x)
Character.isDigit(c), Character.isLetter(c), Character.toUpperCase(c), Character.getNumericValue(c)
Double.isNaN(d), Double.compare(a, b), Double.MAX_VALUE, Double.MIN_VALUE
Boolean.parseBoolean("true")
```

## Autoboxing and unboxing

The compiler inserts `valueOf` and `xxxValue` calls for you:

```java
Integer a = 5;              // Integer.valueOf(5)
int b = a;                  // a.intValue()
List<Integer> xs = new ArrayList<>();
xs.add(7);                  // boxes
int first = xs.get(0);      // unboxes
Integer sum = a + b;        // unbox a, add, box the result
```

This happens in assignments, method arguments, return values, arithmetic, comparisons (`<`, `>` unbox), and collections. It is invisible in the source and visible in profilers.

## Bug 1: `==` on wrappers

```java
Integer x = 127, y = 127;
System.out.println(x == y);        // true
Integer p = 128, q = 128;
System.out.println(p == q);        // false  (!)
System.out.println(p.equals(q));   // true
```

`==` on two references compares identity. `Integer.valueOf` **caches** the values −128 to 127 (and `Boolean`, `Byte`, `Character` ≤ 127, `Short`/`Long` in the same range), returning the same object each time; outside that range it allocates a new one. So `==` "works" for small numbers and fails for large ones, which is the worst kind of bug — it passes tests and fails in production with real ids.

Rules: compare wrappers with `equals` or unbox first (`x.intValue() == y.intValue()`), or better, keep them primitive. When one side is a primitive, `==` unboxes the other and compares values correctly: `Integer x = 1000; x == 1000` is `true`.

(`new Integer(5)` is deprecated for removal precisely because it always allocated, defeating the cache; never write it.)

## Bug 2: unboxing `null`

```java
Map<String, Integer> counts = new HashMap<>();
int n = counts.get("missing");     // NullPointerException — get returns null, unboxing null throws
```

Any place a wrapper is `null` and the code needs a primitive — arithmetic, comparison, a primitive parameter, a `switch`, a ternary with a primitive branch — throws `NullPointerException`. The map lookup above is the most common form. Fixes: `counts.getOrDefault("missing", 0)`, or keep an `Integer` and null-check, or `counts.merge(key, 1, Integer::sum)` for counting.

## Bug 3: performance in loops

```java
Long sum = 0L;                             // wrapper!
for (long i = 0; i < 10_000_000; i++) {
    sum += i;                              // unbox, add, box: 10 million allocations
}
```

Joshua Bloch's example from *Effective Java*: this runs roughly ten times slower than with `long sum`. Prefer primitives in fields, locals and arithmetic; box only at the boundary with a collection or API. For hot collections of numbers, use `int[]`/`long[]` or a primitive-specialised library.

## `equals` across wrapper types

```java
Integer i = 1;
Long l = 1L;
System.out.println(i.equals(l));    // false — different classes
System.out.println(i.equals(1));    // true — 1 boxes to Integer
System.out.println(l.equals(1));    // false — 1 boxes to Integer, not Long
```

`equals` requires the same wrapper class. The last line is a real trap: `map.get(1)` on a `Map<Long, …>` returns `null` because the key `Integer 1` never equals `Long 1L`. Always match the key type: `map.get(1L)`.

## `compareTo` and `Comparable`

Every wrapper implements `Comparable<Self>` — `Integer.compareTo`, `Double.compareTo` — which is what `Collections.sort` and `TreeMap` use. In a comparator, prefer the static `Integer.compare(a, b)` over `a - b`: the subtraction overflows for large values of opposite sign and returns the wrong sign.

## When wrappers are the right choice

- **Collections and generics** — `List<Integer>`, `Map<String, Double>`: no choice.
- **"Absent" values** — an `Integer` field that is `null` when unknown, where 0 would be a real value. (`Optional<Integer>` or `OptionalInt` are the modern alternatives.)
- **Reflection and frameworks** that need `Object`.

Everywhere else, primitives.

## `Number` and the hierarchy

`Integer`, `Long`, `Double`, `Float`, `Short`, `Byte` (and `BigInteger`, `BigDecimal`, `AtomicInteger`…) extend the abstract class `java.lang.Number`, which declares `intValue()`, `longValue()`, `doubleValue()`… — so a method taking `Number` accepts any of them and can convert. `Character` and `Boolean` are not `Number`s. All wrappers are `final` and immutable.

## Interview angle

- *"`Integer a = 127, b = 127; a == b`?"* True. *"With 128?"* False — the `valueOf` cache covers −128…127.
- *"What happens when you unbox null?"* `NullPointerException`.
- *"`Integer.valueOf` vs `new Integer`?"* `valueOf` uses the cache; the constructor always allocates and is deprecated.
- *"Why prefer `Integer.compare(a, b)` to `a - b`?"* Overflow.
- *"Is `Integer` mutable?"* No; all wrappers are immutable and final.

## Key takeaways

- Wrappers are immutable objects; autoboxing inserts `valueOf`/`xxxValue` calls silently.
- `==` on wrappers compares identity; the cache makes it "work" for −128…127 only. Use `equals` or primitives.
- Unboxing `null` throws — `map.get` into an `int` is the classic.
- Boxed arithmetic in loops allocates; keep primitives in hot code.
- `equals` needs the same wrapper class; `Integer 1` ≠ `Long 1L`.
