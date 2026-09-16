---
title: Iterators, fail-fast behaviour and safe modification
minutes: 11
---
`ConcurrentModificationException` is the exception most Java developers meet in their first month: they remove an element from a list while looping over it. Understanding *why* it happens — the fail-fast iterator and its `modCount` — makes the fix obvious and reveals the four correct ways to modify a collection you are walking. This lesson also covers `Iterator`/`ListIterator` directly, and the map views' iteration rules.

## `Iterator`

```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    if (s.isBlank()) it.remove();          // remove the element last returned by next() — the safe way
}
```

For-each is sugar over exactly this loop (minus `remove`). `remove()` is optional (immutable collections throw `UnsupportedOperationException`), may be called once per `next()`, and throws `IllegalStateException` otherwise. `Iterator` is single-pass; `iterator()` gives a fresh one.

`ListIterator` (lists only) adds bidirectional movement (`hasPrevious`/`previous`), positional info (`nextIndex`), `set(e)` to replace the last element returned, and `add(e)` to insert at the cursor — the tool for in-place edits during a walk.

## Fail-fast: `modCount`

`ArrayList`, `HashMap`, `HashSet` and friends keep a `modCount` incremented on every **structural modification** (add, remove, clear — anything that changes size; `set` does not count). An iterator records the count when created and checks it on every `next()`; a mismatch throws `ConcurrentModificationException`:

```java
for (String s : list) {
    if (s.isBlank()) list.remove(s);      // modCount changes; the NEXT next() throws
}
```

Two facts that surprise:

- The exception comes from the *iterator*, on the *following* `next()` — so removing the second-to-last element and then ending the loop may *not* throw. The behaviour is "best-effort": never rely on it not throwing, and never rely on it throwing.
- "Concurrent" is misleading: this is single-threaded. Genuine multi-thread modification also triggers it (and worse, since the check is not synchronised); that is Module 17's problem.

Fail-fast exists so that a bug — iterating stale structure — fails loudly instead of skipping or repeating elements silently.

## The four safe ways to modify while iterating

1. **`removeIf(predicate)`** — the clearest for removals: `list.removeIf(String::isBlank)`, `map.entrySet().removeIf(e -> e.getValue() == 0)`.
2. **The iterator's own `remove()`** (or `ListIterator.set`/`add`) — the iterator updates its expected count.
3. **A backwards index loop** on a list: `for (int i = list.size() - 1; i >= 0; i--) if (…) list.remove(i);` — removing at `i` does not disturb indices below it.
4. **Collect then apply**: gather the elements to remove (or add) into a separate collection and modify after the loop — the only option when you need to *add* while iterating.

For replacements without size change: `list.set(i, x)` inside an index loop, or `replaceAll(fn)`; these are not structural and do not trip the check.

## Iterating maps safely

```java
for (Map.Entry<K, V> e : map.entrySet()) {
    e.setValue(newValue);               // fine: not structural
    map.put(e.getKey(), newValue);      // fine for an EXISTING key in HashMap (no structural change) — but do not rely on it
    map.put(newKey, v);                 // ConcurrentModificationException
    map.remove(e.getKey());             // ConcurrentModificationException
}
map.entrySet().removeIf(e -> …);       // the safe removal
map.keySet().removeIf(k -> …);
map.replaceAll((k, v) -> …);           // safe bulk replacement
```

## Fail-safe and weakly consistent iterators

The concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`, `ConcurrentLinkedQueue`) never throw `ConcurrentModificationException`: their iterators are **weakly consistent** — they reflect the state at some point during iteration and may or may not show later changes — or, for `CopyOnWriteArrayList`, iterate a snapshot. This is the right choice for multi-threaded reads with rare writes, and the wrong choice as a way to "fix" a single-threaded modification bug (use `removeIf`).

## `Iterable` and `forEach`

`Iterable.forEach(Consumer)` and `Map.forEach(BiConsumer)` are the lambda forms of iteration; they carry the same fail-fast behaviour and the same rule: do not structurally modify the collection inside the consumer. Streams over collections likewise must not modify the source (the pipeline's behaviour is then undefined).

## Iteration order recap

| Collection | Order |
| --- | --- |
| `List`, `ArrayDeque` (as queue) | index / FIFO |
| `ArrayDeque` as stack | top first |
| `LinkedHashSet`/`LinkedHashMap` | insertion (or access) |
| `TreeSet`/`TreeMap` | sorted |
| `EnumSet`/`EnumMap` | declaration order |
| `HashSet`/`HashMap` | unspecified; changes on resize |
| `PriorityQueue` | heap order — not sorted |
| `Set.of`/`Map.of` | deliberately randomised per run |

Tests that assert on the iteration order of a hash collection are flaky by construction; use ordered collections or sort before asserting.

## Interview angle

- *"What causes `ConcurrentModificationException`?"* Structural modification of a collection while an iterator over it is active, detected via `modCount`; usually single-threaded.
- *"How do you remove elements while iterating?"* `removeIf`, the iterator's `remove`, a backwards index loop, or collect-then-remove.
- *"Is fail-fast guaranteed?"* No — best-effort; it may miss a modification near the end.
- *"Which collections have fail-safe iterators?"* The concurrent ones (`ConcurrentHashMap`, `CopyOnWriteArrayList`) — weakly consistent or snapshot iterators.
- *"Does `set` trigger it?"* No — only structural (size-changing) modifications.

## Key takeaways

- For-each is an `Iterator`; `iterator.remove()` is the only removal the iterator tolerates.
- Fail-fast iterators check `modCount` on `next()` — best-effort detection of structural modification, single-threaded included.
- Modify safely with `removeIf`, the iterator, a backwards index loop, or collect-then-apply; `set`/`replaceAll`/`entry.setValue` are non-structural.
- Concurrent collections are weakly consistent instead; hash-collection order is never something to assert on.
