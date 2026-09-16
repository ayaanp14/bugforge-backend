---
title: The collections framework — the map and how to choose
minutes: 14
---
`java.util` holds the data structures every Java program is built from: lists, sets, maps, queues. They share one design — interfaces that describe *what* a collection does, classes that decide *how*, and a small set of conventions (`equals`/`hashCode`, `Iterable`, fail-fast iterators, optional operations) that let them interoperate. This lesson is the map of the framework and the decision procedure for picking a structure; the following lessons take each family in depth.

## The hierarchy

```
Iterable<E>
└── Collection<E>            — size, isEmpty, contains, add, remove, iterator, stream, …
    ├── List<E>              — ordered by index, duplicates allowed
    │   ├── ArrayList        — growable array; the default list
    │   ├── LinkedList       — doubly linked; also a Deque
    │   └── (Vector, Stack)  — legacy, synchronised; do not use
    ├── Set<E>               — no duplicates (by equals)
    │   ├── HashSet          — hash table; no order
    │   ├── LinkedHashSet    — hash table + insertion order
    │   └── TreeSet          — red-black tree; sorted (SortedSet, NavigableSet)
    └── Queue<E>             — head-first processing
        ├── PriorityQueue    — heap; smallest first
        └── Deque<E>         — both ends
            ├── ArrayDeque   — the stack and queue of choice
            └── LinkedList

Map<K, V>                    — NOT a Collection; keys → values, unique keys
├── HashMap                  — hash table; no order
├── LinkedHashMap            — + insertion (or access) order
├── TreeMap                  — sorted by key (SortedMap, NavigableMap)
├── EnumMap                  — array indexed by enum ordinal (Module 10)
├── ConcurrentHashMap        — thread-safe (Module 17)
└── (Hashtable)              — legacy, synchronised; do not use
```

`Map` is separate from `Collection` because a map is not a bag of elements — but its **views** are collections: `keySet()` is a `Set<K>`, `values()` a `Collection<V>`, `entrySet()` a `Set<Map.Entry<K, V>>`.

## Interfaces first

Declare with the interface, construct with the class:

```java
List<String> names = new ArrayList<>();
Set<Integer> seen = new HashSet<>();
Map<String, List<Order>> byCustomer = new HashMap<>();
Deque<Character> stack = new ArrayDeque<>();
Queue<Task> queue = new ArrayDeque<>();
```

Method parameters and return types use the interfaces (`List<String>`, `Collection<? extends T>`); a public method returning `ArrayList<String>` promises an implementation detail forever. The one common exception is a private field where the concrete type's extra methods are needed (`LinkedHashMap.removeEldestEntry`, `TreeMap.firstKey`) — declare it as the narrowest interface that has them (`NavigableMap`).

## Choosing a structure

| Need | Use | Why |
| --- | --- | --- |
| A sequence, index access, appends | `ArrayList` | O(1) get/append; cache-friendly |
| A stack or queue | `ArrayDeque` | O(1) at both ends; faster than `LinkedList`, and `Stack` is legacy |
| Unique elements, fast membership | `HashSet` | O(1) contains |
| Unique, remember insertion order | `LinkedHashSet` | + predictable iteration |
| Unique, sorted, range queries | `TreeSet` | O(log n), `first`/`floor`/`subSet` |
| Key → value lookup | `HashMap` | O(1) |
| Key → value, insertion order or LRU | `LinkedHashMap` | order + `removeEldestEntry` |
| Key → value, sorted / nearest key | `TreeMap` | `floorKey`, `headMap`, ordered iteration |
| Enum keys or elements | `EnumMap` / `EnumSet` | array/bit-vector speed |
| Always-smallest-first processing | `PriorityQueue` | O(log n) insert and poll |
| Frequent inserts/removes in the middle by iterator | `LinkedList` | O(1) at the iterator — rarely the actual bottleneck |
| Shared across threads | `ConcurrentHashMap`, `CopyOnWriteArrayList`, `ConcurrentLinkedQueue` | Module 17 |

Default choices: `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`. Switch only when a measured or structural need appears (order, sorting, both-ends access).

## Complexities to know cold

| Operation | ArrayList | LinkedList | HashSet/HashMap | TreeSet/TreeMap | ArrayDeque | PriorityQueue |
| --- | --- | --- | --- | --- | --- | --- |
| get(i) / by key | O(1) | O(n) | O(1) avg | O(log n) | — | — |
| add at end / put | O(1) amortised | O(1) | O(1) avg | O(log n) | O(1) | O(log n) |
| add at front | O(n) | O(1) | — | — | O(1) | — |
| remove by index / key | O(n) | O(n) to find, O(1) to unlink | O(1) avg | O(log n) | O(1) at ends | O(log n) poll |
| contains | O(n) | O(n) | O(1) avg | O(log n) | O(n) | O(n) |
| iteration order | index | index | none | sorted | FIFO/LIFO | not sorted! |

"avg" for hash structures assumes a decent `hashCode`; the worst case degrades to O(n) (or O(log n) once buckets treeify, Java 8+).

## The conventions every collection follows

- **`equals`/`hashCode` on elements** drive `contains`, `remove(Object)`, set membership and map keys — override them on element/key classes (Module 8) or use records.
- **`Iterable`** — every collection works with for-each and `forEach`; maps via their views.
- **Fail-fast iterators** — modifying a collection while iterating it (other than through the iterator) throws `ConcurrentModificationException` (lesson 7).
- **Optional operations** — immutable collections throw `UnsupportedOperationException` from `add`/`remove`; the interface documents which methods are optional.
- **Null policy** varies: `ArrayList`/`HashMap`/`HashSet` allow nulls; `TreeMap`/`TreeSet` reject null keys (cannot compare); `List.of`/`Map.of`/`ConcurrentHashMap` reject nulls entirely.
- **`toString`** prints contents (`[a, b]`, `{k=v}`) — unlike arrays.
- **`equals` between collections** is by contents: two lists with the same elements in order are equal; two sets with the same elements are equal, regardless of implementation class.

## The utility classes

`Collections` (sort, reverse, shuffle, max, min, frequency, unmodifiableX, synchronizedX, emptyX, singletonX, nCopies) and `Arrays` (asList, sort, binarySearch, fill, copyOf, stream) hold the static helpers; `List.of`, `Set.of`, `Map.of`, `List.copyOf` (Java 9–10) create immutable collections (lesson 8).

## Reading the API docs

Each interface's Javadoc specifies contracts (ordering, null policy, optional operations); each class's documents complexity and iteration order. `ArrayList`'s says "constant amortized time" for `add`; `HashMap`'s explains load factor; `TreeMap`'s says "log(n) time cost for containsKey, get, put and remove". When choosing, read the class summary — it is written to answer exactly this question.

## Interview angle

- *"`ArrayList` vs `LinkedList`?"* Array-backed O(1) index access and cache locality vs linked nodes with O(1) insert/remove at a known position; `ArrayList` wins almost always in practice.
- *"`HashMap` vs `TreeMap`?"* O(1) unordered vs O(log n) sorted with navigation methods.
- *"Why is `Map` not a `Collection`?"* It maps keys to values rather than holding elements; its views are collections.
- *"Which structures reject nulls?"* `TreeMap`/`TreeSet` (keys/elements), `List.of`/`Map.of`/`Set.of`, `ConcurrentHashMap`, `ArrayDeque`.
- *"What should you declare a variable as?"* The interface — `List`, not `ArrayList`.

## Key takeaways

- Interfaces (`List`, `Set`, `Map`, `Queue`, `Deque`) describe behaviour; classes (`ArrayList`, `HashMap`, …) decide performance and order.
- Defaults: `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`; `Linked*` for order, `Tree*` for sorting, `PriorityQueue` for smallest-first.
- Know the complexity table and the null policies.
- Elements need correct `equals`/`hashCode`; collections compare by contents and print their contents.
