---
title: Strings are immutable objects
minutes: 13
---
`String` is the most used class in Java and the one with the most surprising design: a string, once created, **cannot change**. Every method that seems to modify one — `toUpperCase`, `replace`, `trim`, `+` — returns a new string and leaves the original untouched. Understanding immutability, and the *string pool* that it makes possible, is the key to everything else in this module.

## Creating strings

```java
String a = "hello";                 // a literal — the normal way
String b = new String("hello");     // a new object — almost never what you want
String c = String.valueOf(42);      // "42"
String d = Integer.toString(42);    // "42"
String e = "" + 42;                 // "42" — works, slightly wasteful
String f = new String(charArray);   // from a char[]
String g = new String(bytes, StandardCharsets.UTF_8);   // decode bytes
String h = String.join(", ", "a", "b", "c");            // "a, b, c"
String i = "ab".repeat(3);          // "ababab" (Java 11+)
```

A `String` is a class in `java.lang` — a reference type. `String s;` as a field is `null`, not `""`. The empty string `""` is a real object with length 0; the two are different, and `s.length()` on `null` throws `NullPointerException`.

## Immutability

```java
String s = "hello";
s.toUpperCase();                  // returns "HELLO" — and throws it away
System.out.println(s);            // hello

s = s.toUpperCase();              // rebinds s to the new string
System.out.println(s);            // HELLO
```

The first form is one of the most common beginner bugs: calling a method for its effect when it has none. Every `String` method returns a value you must use.

Why immutable? Four reasons the designers gave, all still valid:

1. **Safety** — a string passed to a method, stored as a map key, or used as a file name cannot be changed under you. `HashMap` keys must not change after insertion, and strings are the most common key.
2. **Sharing** — because nobody can alter a string, the same object can be safely shared everywhere it is equal: the string pool, and `substring` before Java 7 (which shared the backing array).
3. **Thread safety** — immutable objects need no locks.
4. **Cached hash code** — `hashCode()` is computed once and stored, since the value can never change. Map lookups with string keys are fast for this reason.

The cost is allocation: building a string character by character with `+` creates a new object each time. That is what `StringBuilder` is for (lesson 4).

## The string pool

```java
String a = "java";
String b = "java";
String c = new String("java");
String d = c.intern();

a == b        // true  — both literals refer to the ONE pooled "java"
a == c        // false — new String made a separate object
a.equals(c)   // true  — same characters
a == d        // true  — intern() returns the pooled instance
```

Every string **literal** in your program is put in the *string pool* (a table inside the JVM) at class-loading time, and identical literals resolve to the same object. That is why `==` sometimes "works" on strings — and why relying on it is a bug: strings built at run time (read from input, concatenated from variables, `new String(...)`) are not pooled.

```java
String x = "ja" + "va";              // compile-time constant folding → pooled, x == a is true
String y = "ja"; String z = y + "va";   // run-time concatenation → new object, z == a is false
final String w = "ja"; String v = w + "va";   // w is a constant → folded → v == a is true
```

`intern()` returns the pooled instance for any string, creating it if needed. It is used in a few memory-heavy systems to deduplicate; in ordinary code you never call it.

The rule for comparison is therefore simple and absolute: **`equals` for content, `==` only when you mean "the same object"** — which for strings is essentially never. The next lesson is entirely about this.

## Length, indexing and the basic accessors

```java
String s = "hello";
s.length()          // 5 — a method, not a field (arrays use .length without parentheses)
s.charAt(0)         // 'h'
s.charAt(5)         // StringIndexOutOfBoundsException — valid indices are 0..length-1
s.isEmpty()         // false; true for ""
s.isBlank()         // true for "", "  ", "\t\n" (Java 11+)
s.toCharArray()     // a NEW char[] copy — modifying it does not touch s
```

Iterating over characters, the two idioms:

```java
for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
}
for (char c : s.toCharArray()) { }     // simpler, but copies the array once
```

## Concatenation

`+` with a `String` operand converts the other operand with `String.valueOf` and joins. `null` becomes the four characters `"null"` — a common sight in logs. Since Java 9, `+` in a single expression compiles to an efficient `invokedynamic` call, so `a + b + c + d` is fine; `+=` **in a loop** is not, because each iteration copies the whole accumulated string (quadratic time).

```java
String csv = "";
for (String item : items) csv += item + ",";     // O(n²) — copies grow every time
```

Lesson 4 replaces this with `StringBuilder`; `String.join` and streams' `Collectors.joining` are the other answers.

## `String` is `final`

You cannot subclass `String`. Combined with immutability, this guarantees that a `String` reference *always* behaves like a string — no subclass can override `equals` or `hashCode` to lie. This is the same reason wrappers are final.

## `null` versus empty

```java
String s = null;
s.length();                  // NullPointerException
"".length();                 // 0
s == null                    // the only safe test
"x".equals(s)                // false, no exception — "constant first" idiom
Objects.equals(s, "x")       // null-safe equals
Objects.requireNonNull(s, "name must not be null");
```

Writing `"literal".equals(variable)` rather than `variable.equals("literal")` avoids a `NullPointerException` when the variable is null. It is an idiom you will see everywhere in Java code.

## Interview angle

- *"Why are strings immutable?"* Safety as keys, sharing via the pool, thread safety, cached hash.
- *"How many objects does `new String("hi")` create?"* Up to two: the pooled literal `"hi"` (if not already there) and the new object.
- *"`"a" + "b" == "ab"`?"* True — constant folding at compile time puts it in the pool.
- *"Is `String` thread-safe?"* Yes, because it is immutable.

## Key takeaways

- Strings never change; every method returns a new string — **use the return value**.
- Literals live in the pool and share one object; run-time strings do not.
- `equals` for content, never `==`.
- `length()` is a method; indices run 0…length−1.
- `+=` in a loop is quadratic — that is what `StringBuilder` fixes.
