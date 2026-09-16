---
title: Aliasing, shallow copies and defensive copies
minutes: 12
---
Because an array variable is a reference, two variables can name one array — *aliasing* — and a "copy" can be a copy of the references rather than of the things they point to — a *shallow copy*. Most array bugs that are not off-by-one are one of these two. This lesson makes the distinction concrete and shows the defensive habits that keep other code from changing your arrays behind your back.

## Aliasing

```java
int[] a = {1, 2, 3};
int[] b = a;              // b is ANOTHER NAME for the same array
b[0] = 99;
System.out.println(a[0]); // 99
a == b                    // true
```

Assignment copies the reference. No new array exists; `a` and `b` are two arrows to one object. Passing an array to a method (Module 5), storing it in a field, or putting it in a collection all create aliases. Sometimes that is the point (a method that fills a buffer); often it is a surprise (a "saved snapshot" that changes when the original does).

## Shallow copy

```java
int[] c = a.clone();      // a NEW array with the same values
c[0] = 0;
a[0]                      // still 99 — independent
```

For an array of **primitives**, a copy of the values is a complete copy: there is nothing deeper. For an array of **references**, a copy of the values is a copy of the *references* — the elements themselves are shared:

```java
StringBuilder[] sbs = { new StringBuilder("x"), new StringBuilder("y") };
StringBuilder[] copy = sbs.clone();
copy[0].append("!");      // modifies the SAME StringBuilder that sbs[0] points to
sbs[0]                    // "x!"
copy[0] = new StringBuilder("z");   // rebinding a slot in copy does NOT affect sbs
```

`clone()`, `Arrays.copyOf`, `Arrays.copyOfRange`, `System.arraycopy` and `List.toArray` are all shallow. This is not a defect — it is what "copy the array" means — but you must know which level you copied.

## Deep copy

A deep copy duplicates the elements too. Java has no general deep-copy operation because it cannot know how deep to go or how to copy arbitrary objects; you write it for the shape you have:

```java
int[][] deep = new int[grid.length][];
for (int r = 0; r < grid.length; r++) deep[r] = grid[r].clone();

Point[] copy = new Point[pts.length];
for (int i = 0; i < pts.length; i++) copy[i] = new Point(pts[i].x, pts[i].y);   // or a copy constructor / record
```

If the elements are **immutable** (`String`, `Integer`, records with immutable fields), a shallow copy is as good as a deep one: nobody can change the shared elements, so sharing them is harmless. This is a major practical benefit of immutability and the reason `String[]` copies are never a worry.

## Defensive copies

A class that stores an array a caller handed it, or returns an internal array, has given away control of its state:

```java
public class Scores {
    private final int[] values;

    public Scores(int[] values) {
        this.values = values;              // ALIAS: the caller can change our state later
    }
    public int[] getValues() {
        return values;                     // ALIAS: any caller can change our state
    }
}
```

The fix is to copy on the way in and on the way out:

```java
    public Scores(int[] values) {
        this.values = values.clone();      // our own copy
    }
    public int[] getValues() {
        return values.clone();             // a copy they may do anything with
    }
```

*Effective Java* calls this "make defensive copies when needed" and it applies to any mutable object received or exposed — arrays, `Date`, collections, `StringBuilder`. For collections the alternative is an unmodifiable view (`Collections.unmodifiableList`, `List.copyOf`); arrays have no read-only view, so a copy is the only option. When an array is large and copies would hurt, document the aliasing explicitly and keep the class package-private.

`final int[] values` does not help: `final` freezes the reference, not the elements. `values[0] = 5` is legal on a final array.

## Returning arrays

Prefer returning a fresh array (or a `List`, or a stream) over exposing a field. Returning an **empty array** rather than `null` for "no results" lets callers loop without a null check: `return new int[0];` — the JVM shares zero-length arrays cheaply, and `EMPTY = new int[0]` as a constant is a common idiom.

## Comparing after copying

`Arrays.equals(a, a.clone())` is true; `a == a.clone()` is false. `Arrays.equals` on object arrays calls `equals` on each element pair — deep enough for strings and records, one level only for nested arrays (`deepEquals` for those).

## Where aliasing is intended

- A method that fills or sorts a caller's array in place (`Arrays.sort(a)`, `System.arraycopy`, your `reverse(a)`).
- A buffer shared between a producer and a consumer.
- A cache of rows in a jagged structure.

Name such methods so the mutation is obvious (`sortInPlace`, `fillWith`), document it, and never *also* return the array as if it were new.

## Interview angle

- *"What does `clone()` do on an array of objects?"* A new array whose slots point at the same objects.
- *"Why return `values.clone()` from a getter?"* To keep callers from mutating internal state.
- *"Does `final int[] a` prevent `a[0] = 1`?"* No.
- *"How do you deep-copy a 2D array?"* Clone each row.

## Key takeaways

- Assignment aliases; `clone`/`copyOf`/`arraycopy` make shallow copies — elements of object arrays are shared.
- Deep copies are written by hand per shape; immutable elements make shallow copies safe.
- Copy on the way in and out of a class that holds an array (`final` does not protect contents).
- Return empty arrays, not null; name in-place mutators honestly.
