---
title: Comparing strings — equals, compareTo and hashCode
minutes: 12
---
Comparing strings correctly is a rite of passage: every Java programmer has shipped a `==` that worked in tests and failed with real input. This lesson makes the rules precise, and then goes further into ordering (`compareTo`), case-insensitive comparison, and the `hashCode` contract that lets strings work as map keys.

## `==` compares references

```java
String input = new Scanner(System.in).next();   // user typed "yes"
if (input == "yes") { … }                        // FALSE even when they typed yes
if (input.equals("yes")) { … }                   // correct
```

`==` on two references asks "are these the same object?" — and a string read from input, built by concatenation, or returned by most methods is a fresh object, never the pooled literal. The comparison compiles, runs, and is silently wrong.

## `equals`: content, case-sensitive

```java
"Java".equals("Java")        // true
"Java".equals("java")        // false
"Java".equals(null)          // false — never throws
"Java".equalsIgnoreCase("JAVA")   // true
```

`String.equals` checks: same object → true; not a `String` → false; different length → false; then compares character by character. It is `O(n)` in the worst case and short-circuits on the first difference. Its `null` handling is why the idiom is `"constant".equals(variable)`, or `Objects.equals(a, b)` when both may be null.

`equalsIgnoreCase` compares after folding case per character (using both `Character.toUpperCase` and `toLowerCase`, which handles most alphabets). For locale-sensitive folding — Turkish dotless i, German ß — use a `Collator`; for programming identifiers and protocol keywords, `equalsIgnoreCase` is right.

## `compareTo`: lexicographic ordering

`String implements Comparable<String>`, so strings sort naturally:

```java
"apple".compareTo("banana")   // negative (a < b)
"banana".compareTo("apple")   // positive
"apple".compareTo("apple")    // 0
"apple".compareTo("applesauce")   // negative: shorter prefix sorts first (returns -5, the length difference)
"Zebra".compareTo("apple")    // negative! 'Z' (90) < 'a' (97) — uppercase sorts before lowercase
"10".compareTo("9")           // negative: '1' < '9' — strings compare character by character, not numerically
```

The rule: compare characters at each index by their UTF-16 code unit values; at the first difference return `this.charAt(i) - other.charAt(i)`; if one is a prefix of the other return the length difference. The sign is all you should rely on — the magnitude is an implementation detail.

Consequences you must know:

- Uppercase before lowercase (ASCII order). `compareToIgnoreCase` fixes that for sorting names.
- Digits compare as characters: `"10" < "9"`. To sort numerically, parse, or use a comparator on `Integer.parseInt`.
- Accented characters sort by code point, which is rarely what a user expects; `java.text.Collator` gives locale-correct ordering.

`Collections.sort(list)` and `Arrays.sort(strings)` use `compareTo`; `list.sort(String.CASE_INSENSITIVE_ORDER)` uses the case-insensitive comparator built into `String`.

## `hashCode`: the map-key contract

```java
"hello".hashCode()      // 99162322
```

`String.hashCode()` is `s[0]*31^(n-1) + s[1]*31^(n-2) + … + s[n-1]`, computed with `int` overflow — specified in the Javadoc, so it is the same on every JVM. It is cached in the object after the first call.

The contract that every `equals` override must obey (Module 8) is visible here: two strings that are `equals` always have the same `hashCode`, which is what lets `HashMap<String, V>` find a key that was inserted as a different object with the same characters. `"hello".hashCode() == new String("hello").hashCode()` — always.

Because 31 is small and the arithmetic wraps, collisions exist (`"Aa"` and `"BB"` both hash to 2112); `HashMap` handles collisions, so this is trivia, not a problem — until someone sends a million colliding keys as a denial-of-service, which is why Java 8 turned overfull buckets into trees.

## `contentEquals`, `regionMatches`, `matches`

- `s.contentEquals(sb)` — compare a `String` with a `StringBuilder` or any `CharSequence` without converting.
- `s.regionMatches(ignoreCase, offset, other, otherOffset, len)` — compare a substring without allocating one.
- `s.matches(regex)` — full-match against a regular expression (lesson 7). `"abc".matches("a.*")` is true; note it matches the *whole* string.
- `s.startsWith(prefix)`, `s.endsWith(suffix)`, `s.contains(sub)` — the everyday tests; `contains` is `indexOf(sub) >= 0`.

## `switch` on strings

```java
switch (command) {
    case "start" -> start();
    case "stop"  -> stop();
    default      -> System.out.println("unknown: " + command);
}
```

Since Java 7, `switch` accepts a `String`. It is compiled into a `hashCode` lookup followed by an `equals` check, so it is content-based and case-sensitive, and a `null` selector throws `NullPointerException`.

## A comparison checklist

| Want | Use |
| --- | --- |
| Same characters | `a.equals(b)` |
| Same characters, any case | `a.equalsIgnoreCase(b)` |
| Either may be null | `Objects.equals(a, b)` |
| Ordering | `a.compareTo(b)`, or `String.CASE_INSENSITIVE_ORDER` |
| Locale-correct ordering | `Collator.getInstance(locale).compare(a, b)` |
| Same object | `a == b` — and ask yourself why |

## Interview angle

- *"`String s = "hi"; String t = new String("hi"); s == t`?"* False. *"`s.equals(t)`?"* True. *"`s == t.intern()`?"* True.
- *"What does `"apple".compareTo("banana")` return?"* A negative number (−1: 'a' − 'b'). Only the sign is contractual.
- *"Why must `equals` and `hashCode` agree?"* Hash-based collections find the bucket by `hashCode` and then the entry by `equals`; disagreement makes keys unfindable.
- *"Is `switch` on a string by reference?"* No — by `hashCode` then `equals`.

## Key takeaways

- `==` compares references and is wrong for strings; `equals` compares content.
- `"literal".equals(var)` and `Objects.equals` are null-safe.
- `compareTo` is character-by-character by code unit: uppercase first, digits as text.
- `hashCode` is specified, cached, and agrees with `equals` — the basis of `HashMap` keys.
- `switch` on strings is content-based and throws on `null`.
