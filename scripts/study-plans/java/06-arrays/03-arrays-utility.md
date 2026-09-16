---
title: The Arrays class and System.arraycopy
minutes: 13
---
Arrays themselves have one field and no useful methods. Everything you actually do with them — sort, search, fill, copy, compare, print, convert — lives in `java.util.Arrays`, a class of static helpers, plus one native method in `System`. Knowing this toolkit saves writing loops and, more importantly, saves writing *wrong* loops.

## Printing and comparing

```java
int[] a = {3, 1, 2};
Arrays.toString(a)            // "[3, 1, 2]"
Arrays.deepToString(grid)     // nested arrays
Arrays.equals(a, b)           // same length and equal elements, in order
Arrays.deepEquals(g1, g2)     // nested
Arrays.hashCode(a)            // content-based hash (for using arrays as map keys — better to avoid)
Arrays.compare(a, b)          // lexicographic, Java 9+
Arrays.mismatch(a, b)         // index of the first difference, or -1
```

`a.equals(b)` and `a.hashCode()` are `Object`'s — identity. This is why an `int[]` as a `HashMap` key never matches another array with the same contents; use a `List` or a record instead.

## Sorting

```java
Arrays.sort(a);                       // ascending, in place; primitives use dual-pivot quicksort, O(n log n)
Arrays.sort(a, 1, 4);                 // a range [from, to)
Arrays.sort(strings);                 // natural order (compareTo); objects use TimSort, stable
Arrays.sort(strings, String.CASE_INSENSITIVE_ORDER);
Arrays.sort(people, Comparator.comparing(Person::age));      // any Comparator (Module 14)
Arrays.sort(boxed, Collections.reverseOrder());              // Integer[] descending
Arrays.parallelSort(big);             // multi-threaded for large arrays
```

There is **no descending sort for a primitive array** — `Arrays.sort(int[], Comparator)` does not exist because comparators take objects. Sort ascending and read backwards, negate the values, or box to `Integer[]`. Sorting is stable for objects (equal elements keep their order) and, being in place on primitives, unstable in the sense that does not matter for values.

For a 2D array by a column: `Arrays.sort(rows, (x, y) -> Integer.compare(x[0], y[0]));` — `int[][]` is an array of objects, so a comparator applies.

## Searching

```java
int i = Arrays.binarySearch(sorted, 7);     // index, or -(insertionPoint) - 1 if absent; array MUST be sorted
```

On an unsorted array the result is meaningless. A negative return encodes where the value *would* go: `-(r + 1)` is the insertion point — useful for "first element ≥ x". For a linear search on an unsorted array there is no helper; write the loop or `Arrays.asList(objs).indexOf(x)` for object arrays.

## Filling and creating

```java
Arrays.fill(a, -1);                  // every element
Arrays.fill(a, 2, 5, 0);             // a range
Arrays.setAll(a, i -> i * i);        // compute each element from its index (Java 8+)
int[] sq = IntStream.range(0, 5).map(i -> i * i).toArray();   // 0 1 4 9 16
```

`Arrays.fill` on a 2D array fills the *outer* array with the same row reference — `Arrays.fill(grid, new int[4])` makes every row the same object. Fill each row: `for (int[] row : grid) Arrays.fill(row, -1);`.

## Copying

```java
int[] copy = Arrays.copyOf(a, a.length);      // a full copy
int[] longer = Arrays.copyOf(a, 10);          // copied and padded with zeros — how ArrayList grows
int[] part = Arrays.copyOfRange(a, 1, 3);     // [from, to)
int[] c = a.clone();                          // also a full copy
System.arraycopy(a, 0, dest, 2, 3);           // (src, srcPos, dest, destPos, length): 3 elements from a[0] into dest[2..4]
```

`System.arraycopy` is the primitive the others are built on — a native, bulk memory copy that handles overlapping ranges correctly (so `System.arraycopy(a, 0, a, 1, n - 1)` shifts right in place). It throws `ArrayIndexOutOfBoundsException` if either range is out of bounds and `ArrayStoreException` for a type mismatch. All of these are **shallow**: for object arrays they copy references.

## Converting

```java
List<Integer> list = Arrays.asList(boxed);    // FIXED-SIZE view over the array: set() works, add()/remove() throw
List<String> l2 = Arrays.asList("a", "b");    // varargs — same fixed-size view
List<Integer> real = new ArrayList<>(Arrays.asList(boxed));   // a growable copy
List<int[]> oops = Arrays.asList(intArray);   // an int[] is ONE element — primitives are not boxed
List<Integer> ok = Arrays.stream(intArray).boxed().toList();  // the right way for int[] (Java 16 toList)
Integer[] back = list.toArray(new Integer[0]);
IntStream s = Arrays.stream(a);               // sum(), max(), filter(), … (Module 15)
int sum = Arrays.stream(a).sum();
int max = Arrays.stream(a).max().getAsInt();
```

Two traps in `asList`: it is a *view* backed by the array (changes go both ways; size cannot change), and it does not box primitive arrays — `Arrays.asList(new int[]{1,2})` is a list with one element, the array. `List.of(...)` (Java 9) is the immutable alternative and rejects nulls.

## Streams over arrays (a preview)

`Arrays.stream(a)` opens the door to `sum`, `average`, `max`, `filter`, `map`, `sorted`, `distinct`, `anyMatch` — one-liners for many loop patterns. Module 15 covers streams; until then, `Arrays.stream(a).sum()` and `.max().getAsInt()` are safe to use as vocabulary.

## Utility methods you will write yourself

The JDK has no `Arrays.reverse`, `Arrays.max` for `int[]` (outside streams), `Arrays.indexOf`, `Arrays.contains` or `Arrays.swap`. They are five-line helpers; in interviews write them, in projects keep them in a small util class or use a library like Guava/Commons.

## Interview angle

- *"How do you sort an `int[]` descending?"* No comparator on primitives: sort ascending and reverse, or box.
- *"`Arrays.asList(new int[]{1,2}).size()`?"* 1.
- *"What does `Arrays.binarySearch` return when the value is absent?"* `-(insertionPoint) - 1`.
- *"Difference between `Arrays.copyOf` and `System.arraycopy`?"* `copyOf` allocates a new array of a given length; `arraycopy` copies into an existing one and can overlap.
- *"Can you `add` to `Arrays.asList`?"* No — `UnsupportedOperationException`; wrap in `new ArrayList<>(…)`.

## Key takeaways

- `Arrays.toString/equals/hashCode` for contents; the array's own methods are identity-based.
- `Arrays.sort` (no descending for primitives), `binarySearch` (sorted only, negative = insertion point), `fill`, `setAll`.
- `copyOf`/`copyOfRange`/`clone`/`System.arraycopy` — all shallow; `arraycopy` handles overlap.
- `Arrays.asList` is a fixed-size view and does not box primitives; `Arrays.stream` for `int[]`.
