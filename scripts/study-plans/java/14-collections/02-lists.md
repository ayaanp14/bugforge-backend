---
title: Lists — ArrayList, LinkedList and the List API
minutes: 14
---
A `List` is an ordered sequence with index access and duplicates allowed — the collection you reach for first. `ArrayList` implements it on a growable array and is the right choice almost always; `LinkedList` implements it on linked nodes and is the right choice in a narrow set of cases that interviewers like to ask about. This lesson covers how each works, the full `List` API with its traps (`remove(int)` versus `remove(Object)`, `subList` views, `Arrays.asList`), and how to use lists efficiently.

## `ArrayList` internals

An `ArrayList` holds an `Object[]` and a `size`. `add(x)` writes at `size++`; when the array is full it allocates a new one 1.5× larger and copies (`Arrays.copyOf`). Amortised over many adds, each costs O(1). `get(i)` is a bounds check and an array read — O(1). `add(0, x)` or `remove(0)` shifts every element — O(n). Capacity is separate from size: `new ArrayList<>(10_000)` pre-sizes the array when the count is known and avoids the regrowth copies; `trimToSize()` releases slack.

## `LinkedList` internals

A doubly linked chain of `Node{item, prev, next}` with head and tail. `addFirst`/`addLast`/`removeFirst`/`removeLast` are O(1); `get(i)` walks from the nearer end — O(n); every node is a separate heap object (three references plus the header), so memory and cache behaviour are far worse than an array. Its one genuine advantage — O(1) insert/remove *at a position you already hold via an iterator* — is rarely needed. For a stack or queue, `ArrayDeque` beats it; for a list, `ArrayList` does. Joshua Bloch, who wrote it, has said he never uses it.

## The `List` API

```java
List<String> xs = new ArrayList<>(List.of("a", "b", "c"));
xs.add("d");                // append
xs.add(1, "z");             // insert at index (shifts)
xs.get(0);                  // "a"
xs.set(0, "A");             // replace, returns the old element
xs.remove(1);               // by INDEX: removes "z", returns it
xs.remove("d");             // by OBJECT: removes the first equal element, returns boolean
xs.indexOf("b");            // first index or -1; lastIndexOf too
xs.contains("b");           // linear scan
xs.size(); xs.isEmpty(); xs.clear();
xs.addAll(other); xs.removeAll(other); xs.retainAll(other);
xs.subList(1, 3);           // a VIEW of [1, 3)
xs.sort(null);              // natural order (Comparable); or a Comparator
xs.replaceAll(String::toUpperCase);
xs.removeIf(s -> s.isEmpty());
xs.toArray(new String[0]);  // or xs.toArray(String[]::new)
Collections.reverse(xs); Collections.shuffle(xs); Collections.swap(xs, 0, 1);
```

## The `remove` trap

```java
List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
nums.remove(1);                        // remove(int index): removes 20
nums.remove(Integer.valueOf(10));      // remove(Object): removes the element 10
nums.remove((Integer) 30);             // same, by cast
```

With `List<Integer>`, an `int` argument selects `remove(int index)` by exact match (Module 5) — passing the *value* 1 removes the element at index 1. Box explicitly to remove by value.

## `subList` is a view

```java
List<Integer> big = new ArrayList<>(List.of(1, 2, 3, 4, 5));
List<Integer> mid = big.subList(1, 4);     // [2, 3, 4], backed by big
mid.set(0, 99);                            // big is now [1, 99, 3, 4, 5]
mid.clear();                               // big is now [1, 5] — the idiom for removing a range
big.add(6);                                // structural change to big…
mid.size();                                // …invalidates mid: ConcurrentModificationException
```

`subList` shares storage with the parent. It is the efficient way to clear or operate on a range, and a trap if you keep it around while modifying the parent. Copy with `new ArrayList<>(big.subList(1, 4))` when you want independence.

## Building lists

```java
List<String> a = new ArrayList<>();                 // growable, empty
List<String> b = new ArrayList<>(existing);         // a growable COPY
List<String> c = List.of("x", "y");                 // immutable, no nulls (Java 9)
List<String> d = List.copyOf(existing);             // immutable copy (returns the same instance if already immutable)
List<String> e = Arrays.asList("x", "y");           // fixed-size VIEW over an array: set OK, add/remove throw
List<String> f = Collections.nCopies(3, "-");       // immutable [-, -, -]
List<String> g = Collections.emptyList();           // immutable, typed empty — or List.of()
List<String> h = stream.toList();                   // Java 16: unmodifiable; collect(toList()) is ArrayList in practice
```

The two traps: `List.of` throws on `null` elements and on any mutation; `Arrays.asList` is backed by the array (writes go through both ways) and throws on size changes. Wrap either in `new ArrayList<>(...)` when you need a mutable list.

## Iterating and modifying

```java
for (String s : xs) if (s.isEmpty()) xs.remove(s);          // ConcurrentModificationException (usually)
xs.removeIf(String::isEmpty);                                 // right
for (Iterator<String> it = xs.iterator(); it.hasNext(); ) { if (it.next().isEmpty()) it.remove(); }   // also right
for (int i = xs.size() - 1; i >= 0; i--) if (xs.get(i).isEmpty()) xs.remove(i);                      // backwards index loop: right
```

`ListIterator` adds `hasPrevious`/`previous`, `set`, `add` and `nextIndex` — the tool for editing a list in place while walking it.

## Equality and hashing

Two lists are `equals` when they have the same elements in the same order, whatever their classes (`new ArrayList<>(List.of(1)).equals(new LinkedList<>(List.of(1)))` is true). `hashCode` is defined from the elements, so a list can be a map key — as long as it is not mutated afterwards. Prefer immutable `List.of` for keys.

## Performance habits

- Pre-size when you know the count; avoid `add(0, x)` in loops (use `ArrayDeque` or build reversed and `Collections.reverse`).
- `contains`/`indexOf` are linear: for many membership tests, put the elements in a `HashSet`.
- Iterate `LinkedList` with for-each, never `get(i)` in a loop (O(n²)).
- `toArray(new T[0])` is as fast as pre-sizing on modern JVMs and simpler.
- `List<Integer>` boxes; for numeric bulk data use `int[]` or a primitive-specialised library.

## Interview angle

- *"When would you use `LinkedList`?"* Almost never; when you need O(1) insert/remove via an iterator in the middle, or as a `Deque` — but `ArrayDeque` is faster for that.
- *"How does `ArrayList` grow?"* By 1.5× when full, copying the array; amortised O(1) per add.
- *"`list.remove(1)` on a `List<Integer>`?"* Removes index 1 — the `int` overload wins.
- *"Is `subList` a copy?"* No — a view; structural changes to the parent invalidate it.
- *"`Arrays.asList` vs `List.of`?"* Fixed-size view over the array (writes through, allows null) vs immutable, null-hostile copy.

## Key takeaways

- `ArrayList`: array-backed, O(1) get/append, O(n) insert at front; pre-size when you can. `LinkedList`: rarely the right list.
- `remove(int)` vs `remove(Object)`; `subList` is a live view; `Arrays.asList` is fixed-size; `List.of` is immutable and rejects nulls.
- Remove during iteration with `removeIf`, an `Iterator`, or a backwards index loop.
- Lists compare and hash by contents in order.
