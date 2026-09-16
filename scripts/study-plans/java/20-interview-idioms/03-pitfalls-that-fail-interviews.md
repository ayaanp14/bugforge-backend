---
title: The pitfalls that fail interviews
minutes: 14
---
Most rejected solutions are not wrong algorithms. They are right algorithms with an `int` that overflowed, a `/` that truncated, a `==` that compared references, or a sort that hit its worst case. Interviewers know the list; this lesson is that list, each item with the one-line fix, organised so you can run it as a review pass over your own code before you say "done". Nothing here is new — every item was taught in an earlier module — but seeing them together is what turns knowledge into a reflex.

## Arithmetic

1. **`int` overflow.** `a[i] * a[j]` with values up to 10⁵ is 10¹⁰: overflow. Sums of 10⁵ values up to 10⁵: overflow. `mid = (lo + hi) / 2` with `hi` near `Integer.MAX_VALUE`: overflow — write `lo + (hi - lo) / 2` or `(lo + hi) >>> 1`. Fix: `long` for anything that multiplies or accumulates; `Math.addExact`/`multiplyExact` when you would rather throw than be silently wrong.
2. **Integer division.** `7 / 2` is `3`; `1 / 2 * x` is `0`. Make one operand a `double` when you mean a fraction. Division **truncates toward zero**: `-7 / 2` is `-3`, not `-4`; `Math.floorDiv` rounds down.
3. **`%` with negatives.** `-7 % 3` is `-1` in Java. For a non-negative remainder (hashing, circular indexes, modular arithmetic) use `Math.floorMod(-7, 3)` → `2`, or `((a % m) + m) % m`.
4. **`Math.abs(Integer.MIN_VALUE)`** is `Integer.MIN_VALUE` — still negative. Any "take the absolute value" on unconstrained input needs `long`.
5. **Floating point equality.** `0.1 + 0.2 == 0.3` is `false`. Compare with a tolerance (`Math.abs(a - b) < 1e-9`), or avoid doubles: money in `long` cents, exact fractions as numerator/denominator, `BigDecimal` when the statement demands exactness.
6. **Casting truncates.** `(int) 3.99` is `3`; `(int) -3.99` is `-3`; `(int) 1e10` saturates to `Integer.MAX_VALUE`. `Math.round` returns `long` for a `double` argument. `(int) 'a'` is `97` and `(char) ('a' + 1)` is `'b'` — `'a' + 1` alone is an `int`, `98`.
7. **Modular arithmetic under 10⁹ + 7.** Reduce after every `*`; multiply in `long`; use `floorMod` after subtraction; precompute factorials and inverses when the problem repeats them.

## Strings and characters

8. **`==` on strings.** Use `equals`. The interned-literal cases that make `==` "work" in tests will not survive input.
9. **Concatenation in a loop** is O(n²). `StringBuilder`, or `String.join`, or `Collectors.joining`.
10. **`substring` in a loop** is O(n) each (a copy since Java 7u6). Sliding-window and palindrome problems should index into the original string or a `char[]`.
11. **`split` quirks.** `"a,b,,".split(",")` drops trailing empties (`[a, b]`); `split(",", -1)` keeps them. `split(".")` splits on *any character* — the argument is a regex; `split("\\.")` or `split(Pattern.quote("."))`.
12. **Characters versus code points.** `s.length()` counts UTF-16 units; emoji are two. `s.charAt(i) - '0'` converts a digit; `Character.getNumericValue` handles more. `Character.isLetter` versus `[a-z]` — decide whether the statement means ASCII.
13. **Case.** `toLowerCase()` without a `Locale` follows the default locale (the Turkish `İ` problem); `toLowerCase(Locale.ROOT)` in anything that must be deterministic.

## Boxing and collections

14. **`==` on `Integer`/`Long`.** Cached to 127 and not beyond — `map.get(a) == map.get(b)` lies past 127. `equals`, or unbox to `int`.
15. **`Arrays.asList(int[])`** gives a `List<int[]>` with one element — the array. Box first, or `Arrays.stream(a).boxed().toList()`.
16. **`list.remove(int)` versus `remove(Object)`** on a `List<Integer>`: `remove(2)` removes *index* 2. `remove(Integer.valueOf(2))` for the value.
17. **Modifying while iterating** → `ConcurrentModificationException`. Use the iterator's `remove`, `removeIf`, or collect first then remove.
18. **Mutable keys** in a `HashMap`/`HashSet` (previous lesson): unreachable entries.
19. **`Arrays.sort(int[])` worst case.** Dual-pivot quicksort on primitives is O(n²) on adversarial input, and judges have anti-quicksort tests. Shuffle first, or sort `Integer[]`/a `List` (TimSort, guaranteed n log n), or use counting/radix when values are bounded.
20. **`PriorityQueue` iteration is not sorted.** Only `peek`/`poll` give order; to print sorted, poll repeatedly or sort separately.
21. **`HashMap` iteration order is arbitrary** and can differ between runs and versions; never rely on it for output. `TreeMap` or `LinkedHashMap`, or sort the keys.
22. **`Collections.unmodifiableList` is a view** over the original; `List.copyOf` is a snapshot.
23. **`subList`, `Arrays.asList`, `keySet`, `values`** are views: changes propagate, and structural changes to the parent invalidate `subList`.

## Control flow and recursion

24. **Recursion depth.** Java's default stack handles roughly 10⁴–2 × 10⁴ frames; a DFS on a path graph of 10⁵ nodes overflows. Convert to iteration with an explicit stack, or run the recursion in a `new Thread(null, runnable, "dfs", 1 << 26)` with a bigger stack.
25. **`switch` fall-through** in the old form; missing `break` merges cases. Use arrow cases.
26. **Off-by-one.** `for (i = 0; i <= n; i++)` with an array of `n`; `substring(i, j)` is end-exclusive; `Arrays.fill`/`copyOfRange` are `[from, to)`.
27. **Uninitialised `Integer.MIN_VALUE`/`MAX_VALUE` sentinels** when the answer can legitimately equal them; use `long` sentinels or a boolean `found`.
28. **Returning inside `try` with a `finally` that also returns** — the `finally` wins and swallows the exception. Never `return` from `finally`.

## Reading and output

29. **`Scanner.nextInt()` then `nextLine()`** returns the rest of the current line (`""`). Consume the newline, or use the reader template.
30. **Forgetting `flush()`**, trailing debugging prints, printing with the wrong locale — the output half of the earlier lesson.

## How to use this list

Before submitting, scan your code once for each group heading: *arithmetic* (any `int` that grows? any `/` or `%` with negatives?), *strings* (`==`? concatenation in a loop? `split` on a regex character?), *collections* (boxed `==`? sorting a primitive array on adversarial input? iteration order?), *recursion* (depth?), *I/O* (flush?). Thirty seconds, and it catches the majority of "correct but rejected" submissions. In an interview, doing it aloud — "let me check for overflow: the sum is at most 10¹⁰, so `long`" — is the visible carefulness that gets people hired.

## Interview angle

- *"Why did `-7 % 3` give `-1`?"* Java's `%` takes the sign of the dividend; `Math.floorMod` for a non-negative result.
- *"Is `Integer a = 1000, b = 1000; a == b` true?"* No — outside the cache; `equals`.
- *"Why is `Arrays.sort(int[])` dangerous on a judge?"* Quicksort worst case on crafted input; shuffle or sort objects.
- *"What does `\"a.b\".split(\".\")` return?"* An empty array — `.` is a regex wildcard; escape it.
- *"How do you avoid `StackOverflowError` in a deep DFS?"* Iterate with an explicit stack, or a thread with a larger stack.

## Key takeaways

- Arithmetic: `long`, `floorMod`/`floorDiv`, `lo + (hi - lo) / 2`, tolerance for doubles, `abs(MIN_VALUE)`.
- Strings: `equals`, `StringBuilder`, no `substring` in loops, `split` is a regex with dropped trailing empties.
- Collections: boxed `==`, `remove(int)`, CME, mutable keys, `Arrays.sort(int[])` worst case, unordered `HashMap`, views.
- Recursion depth and `finally` returns; `Scanner` newline; `flush`.
- Run the list as a thirty-second review pass, out loud.
