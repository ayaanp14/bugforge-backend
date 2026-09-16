---
title: break, continue, labels and return
minutes: 11
---
A loop's condition says when to stop *between* iterations. Real loops often need to stop or skip *in the middle* — a match found, a bad record to ignore, an inner loop that should end the outer one too. Java gives four tools: `break`, `continue`, labelled versions of both, and `return`. Each has a precise meaning, and using the wrong one is a common source of subtle bugs.

## `break`: leave the loop now

```java
int found = -1;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] == target) {
        found = i;
        break;          // stop scanning; the rest of the array is not examined
    }
}
```

`break` exits the **innermost** enclosing loop or `switch` immediately; execution continues with the statement after it. It is the standard way to stop a search on the first hit, and the standard way out of `while (true)`.

Inside a `switch` that is inside a loop, `break` leaves the `switch`, not the loop — a frequent surprise:

```java
while (running) {
    switch (cmd) {
        case "quit" -> { running = false; }   // break here would only leave the switch
        default -> handle(cmd);
    }
}
```

## `continue`: skip to the next iteration

```java
for (String line : lines) {
    if (line.isBlank()) continue;      // skip blank lines
    if (line.startsWith("#")) continue; // and comments
    process(line);
}
```

`continue` abandons the rest of the current iteration and goes to the next: in a `for`, the **update** runs and then the condition is checked; in a `while`, the condition is checked. It is the loop equivalent of a guard clause — filters at the top, the real work below, no nesting.

A `continue` in a `while` loop whose increment is at the *bottom* of the body skips the increment and loops forever:

```java
int i = 0;
while (i < n) {
    if (skip(i)) continue;     // i is never incremented → infinite loop
    work(i);
    i++;
}
```

This is one concrete reason to prefer `for` when there is an update step.

## Labels: breaking out of nested loops

`break` and `continue` reach only the innermost loop. To leave an outer loop from inside an inner one, label the outer loop:

```java
outer:
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        if (grid[r][c] == target) {
            System.out.println("found at " + r + "," + c);
            break outer;            // leaves BOTH loops
        }
    }
}

next:
for (int[] row : rows) {
    for (int v : row) {
        if (v < 0) continue next;   // abandon this row, go to the next
    }
    System.out.println("row is all non-negative");
}
```

A label is an identifier followed by a colon, placed before a statement (normally a loop). `break label` exits the labelled statement; `continue label` goes to the next iteration of the labelled loop. Labels are not `goto` — you can only break out of an enclosing labelled statement, never jump into one.

Labels are legitimate and clearer than a `found` flag checked in every loop condition. But if a nested loop needs one, consider extracting the inner search into a **method** and using `return` — usually the cleanest answer.

## `return`: leave the method

```java
static int indexOf(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;     // leaves the loop AND the method
    }
    return -1;
}
```

`return` inside a loop ends the whole method, loop included. For a search that lives in its own method this beats `break` plus a result variable: no flag, no state, the answer is returned where it is found. The `-1` after the loop is the "not found" path and the compiler insists on it (every path must return).

Extracting loops into small methods that `return` early is one of the highest-leverage refactorings: `findFirstNegative`, `containsDuplicate`, `allPositive` each become a five-line method with an early return instead of a flag.

## `break` in `switch` (classic form)

In the colon form, `break` ends the case; without it, execution falls through. In the arrow form there is nothing to break out of, and a `break` inside an arrow-case block that is inside a loop *does* break the loop — since there is no fall-through to stop, the `switch` is not what `break` targets… except it is: a `break` in an arrow `switch` **statement** still targets the switch. Use a labelled break or a flag when you need to leave a loop from inside any switch.

## Flags versus early exits

```java
boolean found = false;
for (int i = 0; i < n && !found; i++) {
    if (match(i)) found = true;
}
```

The flag-in-the-condition style works but spreads the exit logic across two places. `break` (or `return` from a method) says the same thing in one. Prefer the early exit; use a flag only when you need to *remember* the outcome after the loop and the loop must also finish for other reasons.

## Unreachable code

```java
for (…) {
    break;
    System.out.println("never");     // compile error: unreachable statement
}
```

Java refuses to compile statements it can prove unreachable — after `break`, `continue`, `return`, `throw`, or inside `while (false)`. (`if (false)` is exempt, for conditional compilation.) A `return` in both branches of an `if/else` followed by more code is the usual way to meet this error.

## Interview angle

- *"How do you exit two nested loops?"* A labelled `break`, or move the loops into a method and `return`.
- *"What does `break` do inside a `switch` inside a loop?"* Leaves the switch only.
- *"Difference between `break` and `continue`?"* `break` leaves the loop; `continue` skips to the next iteration.
- *"Does Java have `goto`?"* It is a reserved word but not implemented; labelled break/continue are the structured alternative.

## Key takeaways

- `break` leaves the innermost loop or switch; `continue` skips to the next iteration (running a `for`'s update).
- Labels let `break`/`continue` target an outer loop; extraction into a method with `return` is often cleaner.
- `continue` in a `while` with a bottom increment loops forever.
- The compiler rejects unreachable statements — a signal that the control flow is not what you think.
