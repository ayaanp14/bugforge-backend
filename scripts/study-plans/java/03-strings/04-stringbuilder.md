---
title: StringBuilder — building strings efficiently
minutes: 12
---
A `String` cannot change, so building one incrementally means copying: `s += "x"` allocates a new string holding all of `s` plus one character, every time. For ten pieces nobody notices; for a hundred thousand it is the difference between milliseconds and minutes. `StringBuilder` is the mutable buffer that fixes this — and the class every "reverse a string" and "build the output" answer uses.

## The problem, measured

```java
String s = "";
for (int i = 0; i < 100_000; i++) {
    s += i;              // copies i digits' worth of characters each time
}
```

Iteration *k* copies a string of length proportional to *k*, so the total work is 1 + 2 + … + n ≈ n²/2. At n = 100 000 that is billions of character copies and gigabytes of garbage. The same with a builder:

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100_000; i++) {
    sb.append(i);        // appends into a growable char array
}
String s = sb.toString();
```

Linear time. The builder keeps a backing array with spare capacity and doubles it when full (amortised O(1) per append).

## The API

```java
StringBuilder sb = new StringBuilder();           // capacity 16
StringBuilder sb = new StringBuilder(1024);       // pre-sized when you know roughly
StringBuilder sb = new StringBuilder("seed");

sb.append("text");            // overloaded: String, char, int, long, double, boolean, Object, char[], CharSequence
sb.append(42).append(' ').append(3.5);   // returns this — chain freely
sb.insert(0, "start ");       // insert at an index
sb.replace(0, 5, "begin");    // replace [begin, end) with a string
sb.delete(0, 6);              // remove [begin, end)
sb.deleteCharAt(sb.length() - 1);   // drop the last char — e.g. a trailing comma
sb.setCharAt(0, 'B');         // mutate one char
sb.setLength(0);              // clear (keeps capacity) — reuse the builder
sb.setLength(3);              // truncate
sb.reverse();                 // in place
sb.length(); sb.charAt(i); sb.indexOf("x"); sb.substring(1, 3);   // like String
sb.toString();                // the String — copies the used part of the buffer
sb.capacity();                // current buffer size (rarely needed)
```

`append(char)` versus `append(String)`: `sb.append('a')` and `sb.append("a")` both work; the `char` form avoids creating a string. `sb.append(c + 1)` where `c` is a `char` appends a *number* (promotion!) — write `sb.append((char) (c + 1))`.

## The idioms

**Build output once, print once** (from Module 1):

```java
StringBuilder out = new StringBuilder();
for (int i = 0; i < n; i++) out.append(values[i]).append('\n');
System.out.print(out);
```

**Join with a separator, without a trailing one:**

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < items.length; i++) {
    if (i > 0) sb.append(", ");
    sb.append(items[i]);
}
// or: String.join(", ", items)  /  StringJoiner
```

**Reverse:**

```java
String reversed = new StringBuilder(s).reverse().toString();
```

`reverse()` handles surrogate pairs correctly (an emoji stays an emoji), which a hand-written `char` loop does not.

**Palindrome check without allocating:** two indices walking inward on the string itself — no builder needed. Reach for a builder when you *produce* text, not when you *inspect* it.

**Build a string with a computed length** — `repeat` and `String.valueOf(char[])` are alternatives:

```java
String dashes = "-".repeat(40);
char[] row = new char[n]; Arrays.fill(row, '*'); String stars = new String(row);
```

## `StringBuilder` vs `StringBuffer`

`StringBuffer` is the Java 1.0 original with every method `synchronized`. `StringBuilder` (Java 5) is the same API without the locks and is what you use. The synchronisation in `StringBuffer` is nearly useless anyway — thread safety of individual appends does not make a sequence of appends atomic. The interview answer: "same API; `StringBuffer` is synchronised and slower; use `StringBuilder` unless a builder is genuinely shared across threads, which it should not be."

## `StringJoiner` and `String.join`

```java
StringJoiner sj = new StringJoiner(", ", "[", "]");
sj.add("a").add("b");
sj.toString();                         // "[a, b]"
sj.setEmptyValue("(none)");            // what toString gives with no elements
String.join("/", parts);               // a StringJoiner underneath
list.stream().collect(Collectors.joining(", "));   // the stream form (Module 15)
```

## When `+` is fine

The compiler turns `"x=" + x + ", y=" + y` into a single efficient concatenation (an `invokedynamic` call since Java 9; a `StringBuilder` chain before). A builder is not faster for one expression — it is faster for *loops* and for *conditional* building. Rules of thumb: `+` for a single expression; `StringBuilder` when appending in a loop or across several statements; `String.join`/`Collectors.joining` for joining a collection.

## Equality on builders

```java
StringBuilder a = new StringBuilder("x"), b = new StringBuilder("x");
a.equals(b)                  // false — StringBuilder does NOT override equals (identity)
a.toString().equals(b.toString())   // true
a.compareTo(b)               // 0 — Comparable since Java 11
"x".contentEquals(a)         // true
```

A `StringBuilder` as a map key or in a set is a bug: identity-based, and mutable.

## Capacity and memory

The builder grows by `(old + 1) * 2` when full. If you know the final size — building a fixed-width table, encoding a known-length message — pass it to the constructor and avoid the regrowth copies. After `toString()`, the builder still holds its buffer; drop the reference or `setLength(0)` to reuse.

## Interview angle

- *"Why is `+=` in a loop slow?"* Each concatenation copies the whole accumulated string: O(n²) total.
- *"`StringBuilder` vs `StringBuffer`?"* Same API; buffer is synchronised; builder is faster and the default.
- *"How do you reverse a string?"* `new StringBuilder(s).reverse().toString()`; mention the two-pointer `char[]` alternative and surrogate pairs if pressed.
- *"Does `StringBuilder.equals` compare contents?"* No — identity. Use `compareTo` or `toString().equals`.

## Key takeaways

- `String` concatenation in a loop is quadratic; `StringBuilder.append` is amortised linear.
- `append` returns `this` — chain; `setLength(0)` clears; `reverse()` is surrogate-safe.
- `+` in a single expression is already efficient — the builder is for loops and conditional assembly.
- `StringBuffer` is the synchronised, slower ancestor; `StringBuilder` is the one to use.
- Builders compare by identity; convert to `String` for `equals` and as map keys.
