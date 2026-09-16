---
title: The Object class — equals, hashCode and toString
minutes: 16
---
Every class inherits eleven methods from `java.lang.Object`. Three of them — `equals`, `hashCode` and `toString` — define how your objects compare, hash and print, and every collection, every map and every log line depends on them. Their default implementations are identity-based; the moment a class is a *value*, you override them together, according to a contract the whole library assumes. This lesson is that contract and the correct way to meet it.

## What `Object` provides

| Method | Default behaviour |
| --- | --- |
| `equals(Object)` | `this == o` — identity |
| `hashCode()` | A number derived from the object's identity (not the address, but stable for its life) |
| `toString()` | `getClass().getName() + "@" + Integer.toHexString(hashCode())` |
| `getClass()` | The runtime `Class` object — final, cannot be overridden |
| `clone()` | Shallow field copy, `protected`, needs `Cloneable` — legacy, avoid |
| `finalize()` | Deprecated for removal |
| `wait`, `notify`, `notifyAll` | Thread coordination — Module 17, final |

## The `equals` contract

For any non-null references `x`, `y`, `z`:

- **Reflexive**: `x.equals(x)` is true.
- **Symmetric**: `x.equals(y)` ⇔ `y.equals(x)`.
- **Transitive**: `x.equals(y)` and `y.equals(z)` ⇒ `x.equals(z)`.
- **Consistent**: repeated calls give the same result while the objects are unchanged.
- **`x.equals(null)`** is false — never throws.

And the bridge to hashing: **equal objects must have equal hash codes**. (Unequal objects may share a hash code; that is a collision, and allowed.)

## The canonical `equals`

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;                          // fast path, and reflexivity
    if (o == null || getClass() != o.getClass()) return false;   // type check
    Point other = (Point) o;
    return x == other.x && y == other.y;                 // field comparison
}
```

Line by line:

- The parameter is **`Object`**. `equals(Point p)` is an overload that `HashSet`, `List.contains` and `Objects.equals` never call.
- `getClass() != o.getClass()` makes `equals` false across different classes, including subclasses — which keeps symmetry when a subclass adds fields. The alternative `o instanceof Point` lets subclasses be equal to parents and needs care (a `ColorPoint` equal to a `Point` but not vice versa violates symmetry). Use `instanceof` only when subclasses add no state or when the class is `final`.
- Compare primitives with `==`, `double`/`float` with `Double.compare(a, b) == 0` (handles NaN and −0.0), references with `Objects.equals(a, b)` (null-safe), arrays with `Arrays.equals`.

## The matching `hashCode`

```java
@Override
public int hashCode() {
    return Objects.hash(x, y);              // combines the same fields equals uses
}
```

`Objects.hash(...)` boxes and builds an array — fine for most classes. For hot paths, the hand-rolled form:

```java
int h = Integer.hashCode(x);
h = 31 * h + Integer.hashCode(y);
h = 31 * h + (name == null ? 0 : name.hashCode());
return h;
```

Rules: use exactly the fields `equals` uses (a subset is legal; a superset breaks the contract); never use a field that is mutable if the object will be a map key; a constant `hashCode` is *legal* and turns every `HashMap` into a linked list.

## Why the contract matters: `HashMap`

`map.put(key, v)` computes `key.hashCode()`, picks a bucket, and stores the entry. `map.get(k2)` computes `k2.hashCode()`, goes to *that* bucket, and compares with `equals`. If `k2.equals(key)` but their hash codes differ, the lookup searches the wrong bucket and finds nothing. Override `equals` without `hashCode` and your objects vanish from hash-based collections — a bug that appears as "contains returned false for something I just added". `HashSet`, `HashMap`, `Hashtable`, `ConcurrentHashMap` and `LinkedHashMap` all depend on it.

Mutating a key after insertion is the other classic: the entry sits in the bucket computed from the *old* hash. Keys should be immutable.

## `toString`

Covered in Module 7: override it early, include identifying fields, keep it single-line, never rely on parsing it. Records generate `Point[x=1, y=2]`; IDEs generate the same shape. `Objects.toString(o, "default")` is the null-safe helper.

## Records do all three

```java
record Point(int x, int y) { }
```

A record (Module 10) generates `equals`, `hashCode` and `toString` over its components, correctly, with `Double.compare` semantics for doubles and `Arrays`-unaware equality for array components (a reason not to put arrays in records). For value classes, records are the modern answer; the hand-written form above is for classes that cannot be records.

## `getClass` and class literals

`obj.getClass()` returns the runtime `Class<?>`; `Point.class` is the compile-time literal for the same object. `getClass().getSimpleName()` is handy in `toString`. `getClass() == Point.class` is an exact-class test; `instanceof` includes subclasses.

## `clone` — why you avoid it

`Object.clone()` is `protected`, performs a shallow copy, and throws `CloneNotSupportedException` unless the class implements the marker interface `Cloneable` — an API that fights the language (no constructor runs, `final` fields cannot be deep-copied). Arrays are the one place `clone()` is idiomatic. For everything else, a **copy constructor** or a static `copyOf` factory.

## Common mistakes

| Mistake | Consequence |
| --- | --- |
| `equals(Point)` instead of `equals(Object)` | Overload; collections use identity |
| `equals` without `hashCode` | Lost in hash-based collections |
| `hashCode` using fields `equals` ignores | Equal objects, different hashes |
| Comparing doubles with `==` | `NaN != NaN`; `0.0 == -0.0` differs from `Double.compare` |
| `instanceof` in `equals` with a stateful subclass | Broken symmetry |
| Mutable key fields | Entries become unreachable after mutation |
| `equals` that throws on null | Violates the contract; `Objects.equals` avoids it |

## Interview angle

- *"What is the `equals`/`hashCode` contract?"* Equal objects must have equal hash codes; `equals` is reflexive, symmetric, transitive, consistent, false for null.
- *"What happens if you override `equals` only?"* Hash-based collections fail to find your objects.
- *"Can two unequal objects have the same `hashCode`?"* Yes — a collision.
- *"`getClass()` or `instanceof` in `equals`?"* `getClass()` for strict symmetry with subclasses; `instanceof` for final classes or stateless subclasses.
- *"Why are strings good map keys?"* Immutable, with cached, content-based hash codes.

## Key takeaways

- Override `equals(Object)`, `hashCode` and `toString` together for value-like classes; records do it for you.
- `equals`: identity fast path, null/type check, field comparison with `==`/`Double.compare`/`Objects.equals`.
- `hashCode` from the same fields (`Objects.hash`); equal ⇒ same hash, always.
- Keys must be immutable; a mutated key is a lost entry.
- Avoid `clone`; write copy constructors.
