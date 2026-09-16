---
title: Wildcards and PECS
minutes: 15
---
`List<Integer>` is not a `List<Number>`, even though `Integer` is a `Number`. That single fact — generics are **invariant** — is why wildcards exist: `List<? extends Number>` is a list of *some* subtype of `Number`, `List<? super Integer>` a list of *some* supertype. Which one to use is decided by whether you read from or write to the list, and the mnemonic **PECS** — Producer Extends, Consumer Super — makes it mechanical. This lesson covers the three wildcard forms, why invariance is necessary, and how to write flexible signatures like the JDK's.

## Invariance, and why

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;              // compile error: incompatible types
```

Suppose it were allowed. Then `nums.add(3.14)` would put a `Double` into a list that `ints` still sees as `List<Integer>`, and `Integer i = ints.get(0)` would explode. Arrays permit exactly this (`Number[] n = new Integer[1]; n[0] = 3.14;` → `ArrayStoreException` at run time); generics were designed to catch it at compile time, and invariance is the price.

But some code genuinely does not care which subtype: a method that *sums* a list of numbers only reads them. Wildcards express that.

## `? extends T` — a producer you can read from

```java
static double sum(List<? extends Number> xs) {
    double s = 0;
    for (Number n : xs) s += n.doubleValue();       // reading gives a Number — safe whatever the actual type
    return s;
}
sum(List.of(1, 2));          // List<Integer>  ✓
sum(List.of(1.5));           // List<Double>   ✓

List<? extends Number> ns = new ArrayList<Integer>();
ns.add(1);                   // compile error: what if ns is really a List<Double>?
ns.add(null);                // the only thing you may add
Number n = ns.get(0);        // reading is fine
```

`List<? extends Number>` is a list whose element type is `Number` or some unknown subtype. You can **get** elements (as `Number`) but **cannot add** anything except `null`, because the compiler does not know which subtype the list really holds. It is a *producer* of `Number`s.

## `? super T` — a consumer you can write to

```java
static void fillWithZeros(List<? super Integer> xs, int n) {
    for (int i = 0; i < n; i++) xs.add(0);          // adding an Integer is safe: the list holds Integer or a supertype
}
fillWithZeros(new ArrayList<Integer>(), 3);      // ✓
fillWithZeros(new ArrayList<Number>(), 3);       // ✓
fillWithZeros(new ArrayList<Object>(), 3);       // ✓

List<? super Integer> xs = new ArrayList<Number>();
Object o = xs.get(0);        // reading gives only Object — could be a Number, could be anything above
```

`List<? super Integer>` holds `Integer` or some unknown supertype. You can **add** `Integer`s (they fit whatever the actual type is) but reads come back as `Object`. It is a *consumer* of `Integer`s.

## PECS

**Producer → `extends`; Consumer → `super`.** Decide by what the *method* does with the parameter:

```java
public static <T> void copy(List<? super T> dest, List<? extends T> src) {    // JDK Collections.copy
    for (T t : src) dest.add(t);                    // src produces Ts, dest consumes them
}
public static <T extends Comparable<? super T>> void sort(List<T> list)     // T compares against a supertype's Comparable
public static <T> T max(Collection<? extends T> coll, Comparator<? super T> comp)
Stream<R> map(Function<? super T, ? extends R> mapper)                        // takes T (consumes) → yields R (produces)
```

If a parameter is *both* read and written (a list you sort in place), use a plain type parameter `List<T>` — no wildcard. Return types rarely use wildcards: `List<? extends Number>` as a return forces every caller to deal with the wildcard.

## Unbounded `?`

```java
static void printAll(List<?> xs) {
    for (Object o : xs) System.out.println(o);      // reads as Object; cannot add (except null)
}
static int size(Collection<?> c) { return c.size(); }
if (obj instanceof List<?> list) …                  // the only generic form instanceof allows
```

`List<?>` is "a list of something": use it when the element type is irrelevant to the method (size, printing, clearing) or when you must name a generic type without committing (`Class<?>`, `List<?>` in `instanceof`). `List<?>` is *not* `List<Object>` — the latter accepts only actual `List<Object>` arguments; the former accepts any list.

## Wildcard capture

```java
static void swapFirstTwo(List<?> list) {
    swapHelper(list);                                // the compiler CAPTURES ? as a fresh T
}
private static <T> void swapHelper(List<T> list) {   // now we can read and write T
    T tmp = list.get(0);
    list.set(0, list.get(1));
    list.set(1, tmp);
}
```

A method taking `List<?>` cannot write to it — but it can delegate to a generic helper, and the compiler *captures* the unknown type as a named parameter for that call. "Capture of ?" in error messages refers to this; the helper pattern is the standard resolution.

## Reading JDK signatures now

`Collections.max`: `<T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll)` — a collection producing `T`s (so `extends`), where `T` is comparable to itself or an ancestor (so `super`). Every wildcard in the JDK follows PECS; once you see the pattern, the signatures read themselves.

## When to skip wildcards

- Local variables: `List<Integer> xs`, never `List<? extends Integer> xs`.
- Return types: concrete.
- Parameters you both read and write: `List<T>`.
- Simple private helpers where flexibility buys nothing.

Wildcards belong on **public API parameters** where callers might reasonably pass a `List<Integer>` to a method conceptually about `Number`s.

## Interview angle

- *"Why isn't `List<Integer>` a `List<Number>`?"* Invariance: otherwise you could add a `Double` through the `Number` view.
- *"Difference between `List<?>` and `List<Object>`?"* `List<?>` accepts any list and allows only reads as `Object`; `List<Object>` accepts only lists declared as `List<Object>`.
- *"What is PECS?"* Producer `extends`, consumer `super` — choose the wildcard by whether you read from or write to the parameter.
- *"Can you add to a `List<? extends Number>`?"* Only `null`.
- *"What is wildcard capture?"* The compiler naming an unknown `?` as a fresh type parameter for a generic helper call.

## Key takeaways

- Generics are invariant; wildcards add controlled variance.
- `? extends T`: read as `T`, cannot add — producers. `? super T`: add `T`, read as `Object` — consumers. PECS.
- `?` alone when the element type does not matter; it is not `Object`.
- Wildcards on API parameters; plain parameters for read-and-write and for locals/returns.
- Capture unknowns with a generic helper when you need to write.
