---
title: Loops — while, do-while, for and for-each
minutes: 14
---
Java has four loop forms and they are not interchangeable: each states something different about *what is known before the loop starts*. Choosing the right one is half of writing a clear loop; the other half is getting the boundaries right, which is where the off-by-one errors live. This lesson covers all four, the scope rules, and the boundary habits that eliminate the classic bugs.

## `while`: repeat while a condition holds

```java
int n = 27, steps = 0;
while (n != 1) {
    n = (n % 2 == 0) ? n / 2 : 3 * n + 1;
    steps++;
}
```

The condition is checked **before** each iteration, so the body may run zero times. Use `while` when you do not know how many iterations there will be — reading until end of input, converging on a value, draining a queue. Something in the body must eventually make the condition false, or you have an infinite loop; `while (true)` with a `break` inside is the accepted way to write "loop until something happens in the middle".

## `do … while`: at least once

```java
String answer;
do {
    answer = prompt("Continue? (y/n)");
} while (!answer.equals("y") && !answer.equals("n"));
```

The condition is checked **after** the body, so the body runs at least once — right for "ask, then check, repeat if bad". Note the semicolon after the `while`. Rarely needed; when you reach for it, you usually mean "do the thing once, then `while`" and this is exactly that.

## `for`: counted iteration

```java
for (int i = 0; i < n; i++) {
    …
}
```

Three parts in the header, all optional: **initialiser** (runs once), **condition** (checked before each iteration), **update** (runs after each iteration). `for (;;)` is an infinite loop. The loop variable is scoped to the loop — `i` does not exist after the closing brace, which is why you can write `for (int i …)` twice in a row.

The idiom for indices is `0` to `< n`, never `<= n - 1` or `1 … n` — matching Java's zero-based, half-open convention everywhere. Counting down: `for (int i = n - 1; i >= 0; i--)`. Stepping: `for (int i = 0; i < n; i += 2)`. Two variables: `for (int i = 0, j = n - 1; i < j; i++, j--)` — the comma is allowed only in the init and update parts.

A `for` header can express things a `while` needs three lines for, but the reverse is also true — a `for` whose body modifies `i` is a `while` in disguise and should be written as one.

## Enhanced `for` (for-each)

```java
for (String name : names) {          // any Iterable, or an array
    System.out.println(name);
}
for (int v : new int[] {3, 1, 2}) { sum += v; }
for (char c : s.toCharArray()) { … }
for (Map.Entry<String, Integer> e : map.entrySet()) { … }
```

Reads every element in order, with no index and no way to go wrong on bounds. Use it whenever you do not need the index. Limitations you must know:

- **No index.** If you need `i`, use a classic `for` (or keep a counter).
- **Assigning to the loop variable does not change the collection.** `for (int v : arr) v = 0;` leaves `arr` untouched — `v` is a copy of each element.
- **You cannot remove from a collection you are iterating** — `list.remove(x)` inside a for-each over `list` throws `ConcurrentModificationException` (usually on the *next* iteration). Use an `Iterator` with `it.remove()`, or `removeIf` (Module 14).
- The loop variable is fresh each iteration; it can be declared `final` and captured by a lambda.

## Boundaries: the off-by-one family

Almost every loop bug is a boundary:

```java
for (int i = 0; i <= arr.length; i++)  arr[i]   // ArrayIndexOutOfBounds at i == length
for (int i = 1; i < arr.length; i++)   arr[i]   // skips element 0
for (int i = 0; i < s.length() - 1; i++) …      // skips the last char — sometimes intended (pairs)
while (i < n) { … }  vs  while (i <= n) { … }   // runs n vs n + 1 times
```

Habits that prevent them:

1. Half-open ranges: start inclusive, end exclusive, `< end`. The count is `end - start`.
2. Test the loop on the smallest inputs by hand: `n = 0`, `n = 1`, `n = 2`.
3. When comparing neighbours (`arr[i]` and `arr[i + 1]`), stop at `i < length - 1`; when the loop touches `arr[i - 1]`, start at `1`.
4. Never modify the loop variable inside a `for` body; if you must skip, use `continue`.

## Loop variable scope and lifetime

```java
for (int i = 0; i < 3; i++) { }
System.out.println(i);           // compile error: i is out of scope

int i;
for (i = 0; i < 3; i++) { }
System.out.println(i);           // 3 — declared outside, survives
```

Declare the variable in the header unless you need its final value afterwards (searching for an index, for instance). A variable declared **inside** the body is created fresh each iteration — a new `int` or a new reference — which matters for lambdas and for objects: `List<int[]> rows` filled with a `new int[3]` created *inside* the loop holds distinct arrays; created *outside*, every entry is the same array.

## Nested loops

```java
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        grid[r][c] = r * cols + c;
    }
}
```

Two loops give `rows × cols` iterations — quadratic when both are `n`. Name the variables for what they index (`r`/`c`, `i`/`j` for generic pairs) and keep the inner body short. Leaving a nested loop early needs a labelled `break` (next lesson) or a flag.

## Infinite loops and termination

`while (true)`, `for (;;)` and a `for` whose update never reaches the condition are legitimate when a `break` or `return` inside ends them; a loop with *no* exit is a bug, and one with an exit that is never reached is a bug the tests may not catch. For `double` counters, the loop may never hit the exact stopping value — count with an `int` and compute the double (Module 2).

## Performance notes

- Hoist invariants: computing `list.size()` in the condition is fine (it is O(1)) but calling a method that scans the collection each iteration is not.
- `for (int i = 0; i < arr.length; i++)` over an array is as fast as it gets; the JIT removes bounds checks it can prove safe.
- For-each over an `ArrayList` uses an `Iterator` — negligible cost. Over a `LinkedList`, for-each is O(n) while indexed `get(i)` is O(n²) — always for-each there.

## Interview angle

- *"Difference between `while` and `do-while`?"* Condition before vs after; `do` runs at least once.
- *"Can you modify a list inside a for-each?"* Not structurally — `ConcurrentModificationException`. Use an iterator's `remove`, `removeIf`, or a classic index loop going backwards.
- *"What is the scope of a `for` loop variable?"* The loop; it is gone after the closing brace.
- *"How many times does `for (int i = 0; i <= n; i++)` run?"* `n + 1`.

## Key takeaways

- `while` for unknown counts (checked first), `do-while` for at-least-once, `for` for counted loops, for-each for "every element".
- Half-open ranges (`0` to `< n`) and testing `n = 0, 1, 2` by hand kill off-by-one errors.
- The `for` variable lives only in the loop; body variables are fresh each iteration.
- For-each gives copies of elements and forbids structural modification.
