---
title: The string pool, interning and the Integer cache
minutes: 13
---
Two interview questions live here, and both are really questions about the heap. *"Why is `"java" == "java"` true but `new String("java") == "java"` false?"* — the string pool. *"Why is `Integer.valueOf(127) == Integer.valueOf(127)` true but `Integer.valueOf(128) == Integer.valueOf(128)` false?"* — the Integer cache. Both are the JVM sharing immutable objects behind your back, both are invisible until you compare with `==`, and both reward knowing exactly where the line is drawn. This lesson also covers the growth rule of `StringBuilder`, because it is the same idea — memory the runtime manages for you, with behaviour you can predict.

## The string pool

Every string **literal** in a class file is interned: when the class is loaded, `"java"` becomes one `String` object in the JVM's string table, and every literal with the same characters — in this class or any other — refers to that one object.

```java
String a = "java";
String b = "java";
System.out.println(a == b);              // true — same pooled object
String c = new String("java");
System.out.println(a == c);              // false — `new` always makes a fresh object
System.out.println(a.equals(c));         // true — same characters
System.out.println(a == c.intern());     // true — intern() returns the pooled instance
```

`intern()` looks the string up in the pool, adds it if absent, and returns the pooled reference. It is how you get identity equality for strings that arrive at runtime — from a file, a socket, a `Scanner` — and it is mostly used to save memory when millions of strings have few distinct values (city names in a dataset). It is *not* a way to make `==` correct; `equals` is.

**Compile-time constant folding** extends the pool to expressions: `"ja" + "va"` is a constant expression, folded to `"java"` by `javac`, so `("ja" + "va") == "java"` is `true`. But add a variable and the concatenation happens at run time, producing a new object:

```java
String ja = "ja";
System.out.println((ja + "va") == "java");         // false — runtime concatenation
final String JA = "ja";
System.out.println((JA + "va") == "java");         // true — a final String with a constant initialiser is itself a constant
```

The pool lives in the heap (since Java 7; it was in PermGen before), so pooled strings are collectable when nothing refers to them — though literals stay reachable from their classes. Its size is a hash table tunable with `-XX:StringTableSize`.

## Why the rule matters: `==` on strings is a bug

Because pooling makes `==` *sometimes* true, code that compares strings with `==` passes its tests with literals and fails in production with input from anywhere else. The rule has no exceptions: **compare strings with `equals`** (or `equalsIgnoreCase`, or `compareTo`). Use `==` only to test for `null`, or when you have deliberately interned both sides and can prove it.

## The Integer cache

`Integer.valueOf(int)` — which autoboxing calls — returns a **cached** instance for values in `-128..127` and a new object outside that range:

```java
Integer p = 127, q = 127;   System.out.println(p == q);   // true — same cached object
Integer r = 128, s = 128;   System.out.println(r == s);   // false — two objects
System.out.println(r.equals(s));                          // true
```

The lower bound is fixed; the upper bound is guaranteed to be *at least* 127 and can be raised with `-XX:AutoBoxCacheMax=…`, so `128` giving `false` is the default HotSpot behaviour, not a language guarantee. `Long`, `Short` and `Byte` cache the same range; `Character` caches `0..127`; `Boolean` has exactly two instances; `Double` and `Float` cache nothing. `new Integer(127)` (deprecated) bypasses the cache entirely.

The lesson is identical to the string one: **compare boxed numbers with `equals` or unbox first**. `Integer` in a `List<Integer>` or a `Map<String, Integer>` is exactly where `==` sneaks in — `if (map.get(a) == map.get(b))` works for small counts and silently breaks past 127.

## Autoboxing allocates

Every boxing outside the cache is an allocation. `Integer sum = 0; for (…) sum += x;` allocates a new `Integer` per iteration (`sum + x` is an `int`, boxed back into a new object). A `Map<Integer, Integer>` counting frequencies boxes on every `merge`. It is rarely the bottleneck at interview scale and always the first thing to fix in a real hot loop: `int`/`long` locals, `int[]` arrays, `IntStream` instead of `Stream<Integer>`.

## `StringBuilder` growth

A `StringBuilder` is a resizable `byte[]` plus a count. Its default capacity is 16 (or `16 + s.length()` when built from a string). When an append needs more room than the current capacity, the array is replaced by one of capacity **`max(needed, 2 × old + 2)`** — the `+2` is a historical quirk from the days when the minimum growth had to accommodate a two-character append. So 16 → 34 → 70 → 142 → 286 → …: a doubling that makes repeated appends O(1) amortised, the same argument as `ArrayList`.

```java
StringBuilder sb = new StringBuilder();      // capacity 16
sb.append("0123456789ABCDEFG");              // 17 chars: needs 17, 2×16+2 = 34 → capacity 34
sb.append("x".repeat(40));                   // 57 chars: needs 57, 2×34+2 = 70 → capacity 70
```

`sb.capacity()` reports it; `new StringBuilder(n)` pre-sizes when you know the final length, avoiding every copy. `s += x` in a loop, by contrast, allocates a new `String` of the full length each time — O(n²) characters copied for n appends — which is why "use `StringBuilder` in loops" is on every Java checklist. The compiler does turn a *single* expression `a + b + c` into one efficient concatenation; it is the loop it cannot fix.

## Hash codes are cached too

`String.hashCode()` is computed once and stored in the object (strings are immutable, so it never changes) — which is part of why strings make excellent map keys, and why a mutable object as a key is a disaster: its hash code is cached in the *map*, in the bucket index, and a mutation leaves it in the wrong bucket forever.

## Interview angle

- *"`"a" == "a"`?"* True: literals are interned into the pool. `new String("a") == "a"` is false; `.intern()` restores identity.
- *"What does `intern()` do?"* Returns the pooled instance for that content, adding it if absent.
- *"`Integer a = 127, b = 127; a == b`? And 128?"* True for 127 (cached −128..127); false for 128 by default — always `equals`.
- *"Why `StringBuilder` in a loop?"* Concatenation copies the whole string each time (O(n²)); the builder grows geometrically and copies once per doubling.
- *"Is `"ja" + "va" == "java"`?"* True — constant folding at compile time. With a non-final variable it is false.

## Key takeaways

- Literals and compile-time constants are pooled; `new String` and runtime concatenation are not; `intern()` fetches the pooled one.
- `==` on strings is a bug by construction; `equals` always.
- `Integer.valueOf` caches −128..127 (upper bound tunable); `Boolean` two instances; `Double` none. Compare boxed values with `equals`.
- Boxing allocates; go primitive in hot code.
- `StringBuilder` grows to `max(needed, 2·old + 2)`; pre-size it when you know the length; never `+=` a string in a loop.
