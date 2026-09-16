---
title: Immutable collections and the utility toolkit
minutes: 12
---
Most collections a program creates are never modified after being built — a set of allowed values, a map of configuration, the result of a query. Making them **immutable** turns that intention into a guarantee: no accidental `add`, safe sharing across threads, safe use as keys, and a clear API contract ("this list will not change under you"). Java offers three mechanisms with different semantics, plus a toolkit of utility methods in `Collections` and `Arrays` that this lesson gathers in one place.

## The three kinds of "unmodifiable"

| Mechanism | What it is | Nulls | Notes |
| --- | --- | --- | --- |
| `List.of`, `Set.of`, `Map.of`, `Map.ofEntries` (Java 9) | A new, truly immutable collection | rejected | `Set.of`/`Map.of` reject duplicate keys; iteration order randomised |
| `List.copyOf`, `Set.copyOf`, `Map.copyOf` (Java 10) | An immutable *copy* of a collection | rejected | Returns the same instance if the source is already one of these |
| `Collections.unmodifiableList/Set/Map(x)` | A read-only **view** of a live collection | allowed | Changes to `x` show through the view |
| `Stream.toList()` (Java 16) | An unmodifiable list | allowed | vs `collect(toList())`, which is mutable in practice but unspecified |
| `Arrays.asList(arr)` | A fixed-size view over an array | allowed | `set` works (writes to the array); `add`/`remove` throw |

All of them throw `UnsupportedOperationException` from mutators; the type is still `List`/`Set`/`Map`, so the compiler cannot warn you — read the source of a collection before assuming you may modify it, and prefer to return immutable collections from APIs so callers cannot corrupt your state.

## Choosing

- Building a constant: `List.of(...)`, `Set.of(...)`, `Map.of(...)` (up to ten pairs; `Map.ofEntries(Map.entry(k, v), …)` beyond).
- Returning a snapshot of internal state: `List.copyOf(items)` — cheap when items is already immutable, safe otherwise.
- Exposing internal state as read-only without copying (large, frequently read): `Collections.unmodifiableList(items)` — remember the caller sees later changes.
- Need nulls in an immutable collection: `Collections.unmodifiableList(new ArrayList<>(withNulls))`.

## Shallow, again

Immutable collections hold *references*; the elements are as mutable as they were. `List.of(new StringBuilder())` is an immutable list of one mutable builder. Immutable elements (strings, records, numbers) make the whole structure immutable in practice.

## The `Collections` toolkit

```java
Collections.sort(list); Collections.sort(list, cmp);
Collections.reverse(list); Collections.shuffle(list); Collections.shuffle(list, new Random(42));
Collections.swap(list, i, j); Collections.rotate(list, k);
Collections.max(coll); Collections.min(coll); Collections.max(coll, cmp);
Collections.frequency(coll, x);          // how many equal to x
Collections.disjoint(a, b);              // no elements in common?
Collections.nCopies(n, x);               // immutable list of n copies
Collections.fill(list, x);               // overwrite every element
Collections.addAll(coll, a, b, c);       // varargs add
Collections.emptyList(); emptySet(); emptyMap();           // typed immutable empties (List.of() etc. today)
Collections.singletonList(x); singleton(x); singletonMap(k, v);   // immutable one-element
Collections.unmodifiableList(x); …Set; …Map; …Collection;
Collections.synchronizedList(x); …Map;   // coarse-locked wrappers (Module 17 — prefer concurrent collections)
Collections.binarySearch(sortedList, key);
Collections.reverseOrder(); reverseOrder(cmp);
```

`Collections.emptyList()` returns one shared immutable instance — the idiomatic "nothing" return before `List.of()` existed; both are fine. `singletonList` remains useful for passing one element to an API that wants a list without allocating an `ArrayList`.

## The `Arrays` bridge

`Arrays.asList(T...)` (fixed-size view), `Arrays.stream(array)`, `Arrays.sort`, `Arrays.fill`, `Arrays.copyOf`, `Arrays.equals`, `Arrays.hashCode`, `Arrays.toString` — Module 6. `list.toArray(new T[0])` / `toArray(T[]::new)` go the other way; `Arrays.asList(intArray)` does not box (one element).

## Collection equality and hashing

`List.equals`: same elements in order, any implementations. `Set.equals`: same elements, any implementations. `Map.equals`: same entries. `hashCode` follows: `List` from elements in order, `Set` as the sum of element hashes, `Map` as the sum of entry hashes. So `List.of(1, 2).equals(Arrays.asList(1, 2))` is true, `Set.of(1, 2).equals(new TreeSet<>(List.of(2, 1)))` is true, and collections can be map keys — if they are immutable.

## Copies and defensive copies

```java
List<String> mutableCopy = new ArrayList<>(source);          // independent, growable
List<String> frozen = List.copyOf(source);                   // independent, immutable, no nulls
Map<K, V> mapCopy = new HashMap<>(source);
```

A constructor or setter that receives a collection and stores it should copy it (`List.copyOf` when nulls are impossible); a getter that returns internal state should return a copy or an unmodifiable view (Module 7). "Whose list is this?" is the question; copying at boundaries is the answer.

## Wrappers and views, summarised

Views are cheap and live: `subList`, `keySet`/`values`/`entrySet`, `headMap`/`tailSet`, `unmodifiableX`, `Arrays.asList`, `descendingMap`. Copies are independent: constructors (`new ArrayList<>(x)`), `copyOf`, `clone`, `toArray`, `stream().toList()`. Knowing which you hold is what prevents both aliasing bugs and needless copying.

## Interview angle

- *"`List.of` vs `Arrays.asList` vs `Collections.unmodifiableList`?"* Immutable null-hostile copy / fixed-size array view / read-only view of a live collection.
- *"How do you return internal state safely?"* `List.copyOf` or an unmodifiable view.
- *"Is an immutable list deeply immutable?"* No — elements may still be mutable.
- *"What does `Collections.emptyList()` return?"* A shared immutable empty list; `List.of()` is the modern equivalent.
- *"Can two different implementations be equal?"* Yes — `List`/`Set`/`Map` equality is by contents.

## Key takeaways

- `List.of`/`Set.of`/`Map.of` and `copyOf`: immutable, no nulls. `Collections.unmodifiableX`: a read-only view. `Arrays.asList`: fixed-size, writes through.
- Return immutable snapshots or views from APIs; copy on the way in.
- Immutability is shallow — prefer immutable elements.
- `Collections` holds the algorithms (sort, reverse, shuffle, max, frequency, nCopies…); `Arrays` bridges arrays.
- Collections compare and hash by contents across implementations.
