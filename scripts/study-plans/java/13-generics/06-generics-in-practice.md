---
title: Generics in practice — idioms and error messages
minutes: 12
---
The previous lessons gave the rules; this one is the everyday texture: the idioms experienced Java code uses with generics, the compiler messages you will actually see and what each means, and the judgement calls — when to make something generic, when not to, how much wildcard is too much.

## Idioms

**Generic value containers.** `Optional<T>`, `Pair<A, B>` (a record), `Result<T>` (a sealed interface with `Ok<T>`/`Err<T>` records) — small generic types that carry a value with a meaning. Records make these one-liners: `record Pair<A, B>(A first, B second) {}`.

**Generic utility methods** on a `final` class with a private constructor:

```java
public final class Lists {
    private Lists() {}
    public static <T> List<T> reversed(List<T> xs) { … }
    public static <T, R> List<R> map(List<T> xs, Function<? super T, ? extends R> f) { … }
    public static <T extends Comparable<? super T>> T max(Collection<? extends T> xs) { … }
}
```

**Typed empty results**: `List.of()`, `Collections.emptyList()`, `Optional.empty()` infer their type from the target; return them instead of `null`.

**Comparator building** relies entirely on generic inference:

```java
Comparator<Person> byAge = Comparator.comparingInt(Person::age);
Comparator<Person> byName = Comparator.comparing(Person::lastName, String.CASE_INSENSITIVE_ORDER);
people.sort(byAge.thenComparing(byName).reversed());
```

When inference fails in a chain (`Comparator.comparing(Person::lastName).thenComparing(…)` complaining that `Object` has no `lastName`), give the first lambda an explicit parameter type: `Comparator.comparing((Person p) -> p.lastName())`. The chain's first call has no target type to infer from.

**Class tokens for run-time types**: `Class<T>` parameters (`Enum.valueOf(Day.class, s)`, `EnumMap`, `fromJson(text, User.class)`).

**Bounded generic algorithms**: `<T extends Comparable<? super T>>` on anything that orders; `<T extends Number>` on anything that computes.

## The compiler messages, decoded

| Message | Meaning | Fix |
| --- | --- | --- |
| `incompatible types: List<Integer> cannot be converted to List<Number>` | Invariance | Use `List<? extends Number>` in the parameter |
| `unchecked call to add(E) as a member of the raw type List` | A raw type is in use | Add the type arguments |
| `unchecked cast` | `(List<String>) obj` — cannot be verified | Restructure; or contain with `@SuppressWarnings("unchecked")` and a justification |
| `generic array creation` | `new T[n]` / `new List<String>[n]` | `Object[]` with cast, `Array.newInstance`, or a `List` |
| `non-static type variable T cannot be referenced from a static context` | Class parameter used in a static member | Declare `<T>` on the static method |
| `inference variable T has incompatible bounds` | Arguments imply conflicting `T`s | Check the argument types; add a witness `Util.<String>f(…)` |
| `name clash: f(List<String>) and f(List<Integer>) have the same erasure` | Overloading on type arguments | Rename one |
| `capture#1 of ? extends Number` in a message | You tried to write into a `? extends` list | Use `? super`, a plain `T`, or a capture helper |
| `possible heap pollution from parameterized vararg type` | Generic varargs | `@SafeVarargs` if the array is only read |
| `cannot select from a type variable` (`T.class`, `T.CONSTANT`) | No static access through `T` | Pass a `Class<T>` |

Each message points at one rule from earlier lessons; recognising which one is most of the debugging.

## `@SuppressWarnings("unchecked")` — the discipline

Unchecked warnings are the compiler admitting it cannot verify safety. Rules for suppressing:

1. Prove to yourself the code is safe (usually: the only writes are typed).
2. Suppress on the **smallest** element — a local variable declaration or a single method, never a class.
3. Comment why it is safe.

```java
@SuppressWarnings("unchecked")
T item = (T) items[--size];     // safe: only push(T) stores into items
```

Unexplained suppressions are where heap pollution hides.

## How generic to be

- **Make it generic** when the same code would otherwise be duplicated per type, or when the element type is part of the contract (`Repository<T>`, `Cache<K, V>`, `Result<T>`).
- **Do not** make a class generic to look sophisticated: a `Config<T>` where `T` is always `String` is noise.
- **Wildcards** on public parameters where callers benefit (`Collection<? extends T>`); not on locals, fields or returns.
- **Bounds** only when the body needs the bound's methods.
- **A single type parameter** covers most cases; three or more suggests a missing abstraction.

## Generics and collections, together

The collections module (next) is generics in daily use: `Map<String, List<Order>>`, `Set<? extends Shape>`, `Deque<Character>`, `Comparator<? super T>`. The idioms there — `computeIfAbsent(k, key -> new ArrayList<>())`, `List.copyOf`, `Collections.unmodifiableList` — all depend on inference working as this module described.

## Generics and lambdas, together

Functional interfaces are generic (`Function<T, R>`), so every lambda's type is a parameterised type inferred from context. When a stream pipeline's types go wrong, the first `map` is usually where inference lost the thread; typing the lambda parameter (`(String s) -> …`) restores it.

## A worked example: a generic bounded cache

```java
public final class LruCache<K, V> {
    private final LinkedHashMap<K, V> map;
    public LruCache(int capacity) {
        map = new LinkedHashMap<>(16, 0.75f, true) {          // access-order
            @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
        };
    }
    public V get(K key) { return map.get(key); }
    public void put(K key, V value) { map.put(key, value); }
    public V computeIfAbsent(K key, Function<? super K, ? extends V> loader) { return map.computeIfAbsent(key, loader); }
}
```

Two class parameters, an anonymous subclass that sees them (it is an inner class), and a PECS-correct `Function<? super K, ? extends V>` on the one public method that takes a function. This is what "generics in practice" looks like: a few lines, all of them mechanical once the rules are known.

## Interview angle

- *"How do you handle an unchecked cast you cannot avoid?"* Prove it safe, suppress on the smallest scope, comment the reason.
- *"Why does `Comparator.comparing(Person::name).thenComparing(…)` sometimes fail to compile?"* The first call has no target type; give the lambda an explicit parameter type.
- *"When would you not use generics?"* When the type is always the same, or when the parameter would not be used in the body.
- *"What does `capture of ?` mean in an error?"* You tried to write to a wildcard-typed collection; use `super` or a helper.

## Key takeaways

- Idioms: generic records for values, static utility methods with bounds and PECS, typed empties, class tokens, comparator chains.
- Learn the error messages — each maps to one rule (invariance, erasure, statics, inference).
- Suppress unchecked warnings narrowly, with proof and a comment.
- Be as generic as the contract requires and no more; wildcards on API parameters only.
