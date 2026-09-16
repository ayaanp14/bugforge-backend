---
title: Records — transparent immutable data
minutes: 14
---
Most classes that hold data — a point, a pair, a DTO, a parse result — need the same forty lines: private final fields, a constructor, accessors, `equals`, `hashCode`, `toString`. Java 16's **records** generate all of it from one line, and in doing so make a promise the compiler enforces: a record is a *transparent, immutable carrier of its components*. This lesson covers what a record generates, what you can customise, and the rules that keep the promise.

## Declaring a record

```java
public record Point(int x, int y) { }

Point p = new Point(3, 4);
p.x()            // 3   — accessor, named after the component (no "get")
p.y()            // 4
p.toString()     // "Point[x=3, y=4]"
p.equals(new Point(3, 4))   // true — component-wise
p.hashCode()     // combined from x and y, consistent with equals
```

The header `(int x, int y)` declares the **components**. From it the compiler generates:

- a `private final` field per component;
- a **canonical constructor** taking all components in order;
- a public accessor per component, named exactly like it;
- `equals`, `hashCode` and `toString` over all components.

Records are implicitly `final`, extend `java.lang.Record` (so cannot extend anything else), and may implement interfaces. They can be top-level, nested (implicitly static) or **local** — declared inside a method, handy for a temporary pair in an algorithm.

## What you can add

```java
public record Range(int lo, int hi) implements Comparable<Range> {

    // compact canonical constructor: validate / normalise; assignment is implicit at the end
    public Range {
        if (lo > hi) throw new IllegalArgumentException(lo + " > " + hi);
    }

    // extra constructors must delegate to the canonical one
    public Range(int single) { this(single, single); }

    // instance methods
    public int length() { return hi - lo; }
    public boolean contains(int x) { return lo <= x && x < hi; }

    // static members and factories
    public static Range empty() { return new Range(0, 0); }
    public static final Range UNIT = new Range(0, 1);

    // an accessor may be overridden (rarely wise); its signature is fixed
    @Override public int lo() { return lo; }

    @Override public int compareTo(Range o) { return Integer.compare(lo, o.lo); }
}
```

The **compact constructor** has no parameter list; it runs before the fields are assigned and may reassign the *parameters* (`lo = Math.min(lo, hi)`) to normalise them. It cannot assign `this.lo` directly — the assignment happens automatically after the body.

## What you cannot do

- **No instance fields** beyond the components. `private int cache;` in a record is a compile error. Static fields are fine.
- **No setters, no mutation** of components: the fields are final. "Modifying" means creating a new record: `new Point(p.x() + 1, p.y())` — a `withX(int)` method is the idiom if you want it.
- **No `extends`**; records may not be abstract; components cannot be `volatile`/`transient` in the usual sense.
- Accessor names are fixed to the component names; a `getX()` alongside is legal but pointless.

## Equality is by value, always

`equals` compares each component with `==` for primitives (`Double.compare` semantics for `float`/`double`) and `equals` for references. Two records with equal components are equal — which is what a data carrier should mean, and what makes records good map keys and set elements without any hand-written code. Caveat: an array component uses `Object.equals` on the array (identity), so `record Bag(int[] items)` compares arrays by reference — use a `List` instead.

## Records and collections: shallow immutability

```java
public record Team(String name, List<String> members) {
    public Team {
        members = List.copyOf(members);      // defensive, immutable copy in the compact constructor
    }
}
```

A record's *fields* are final; the *objects* they refer to are whatever they are. A `List` component can be mutated by whoever holds the list unless you copy it on the way in. `List.copyOf` produces an immutable copy (and rejects nulls); for maps `Map.copyOf`. Make this a habit for every collection or array component.

## Records as tuples and multi-value returns

```java
record MinMax(int min, int max) { }
static MinMax minMax(int[] a) { … return new MinMax(lo, hi); }
MinMax r = minMax(values);
r.min(); r.max();
```

The answer to "how do I return two values" (Module 5) is a record — named, typed, and one line to declare, even locally inside the method that needs it.

## Records with sealed interfaces

```java
sealed interface Shape permits Circle, Square { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
```

Records are the natural leaves of a sealed hierarchy (Module 9): final, immutable, with generated equality. Java 21's record patterns destructure them in a switch: `case Circle(double r) -> Math.PI * r * r`.

## Records versus classes

| Need | Use |
| --- | --- |
| Immutable data with value equality | record |
| Mutable state, identity, lifecycle | class |
| Inheritance from a class | class (records cannot extend) |
| Extra hidden state or caching fields | class (records forbid instance fields) |
| JPA entities, JavaBeans frameworks needing setters | class |
| DTOs, keys, tuples, messages, configuration values | record |

Records are not "classes with less typing"; they are a *semantic* declaration that the type is nothing but its components. If that is not true — if two instances with equal components should be distinguishable, or the state changes — it is not a record.

## Serialization, reflection and frameworks

Records serialise through their canonical constructor (safer than field-poking), and `Class.getRecordComponents()` exposes the components to frameworks. Jackson, Gson and most modern libraries support records directly. Older frameworks that require a no-arg constructor and setters do not.

## Interview angle

- *"What does a record generate?"* Final fields, canonical constructor, accessors, `equals`/`hashCode`/`toString`.
- *"Can a record have a mutable field?"* No instance fields besides the components, all final; the referenced objects may be mutable — copy them in.
- *"Can a record extend a class?"* No; it can implement interfaces.
- *"What is a compact constructor?"* The canonical constructor without a parameter list, for validation and normalisation before the implicit assignments.
- *"Are records immutable?"* Shallowly: components cannot be reassigned; deep immutability depends on the component types.

## Key takeaways

- `record Name(T a, U b)` generates fields, constructor, accessors `a()`/`b()`, and value-based `equals`/`hashCode`/`toString`.
- Customise with a compact constructor (validate, normalise), extra constructors delegating to the canonical one, methods, statics, interfaces.
- No extra instance fields, no setters, no `extends`; equality is by components — array components compare by reference.
- Copy collection components defensively (`List.copyOf`) for real immutability.
- Use records for data; classes for identity and mutation.
