---
title: When not to inherit — composition, Liskov and final
minutes: 13
---
Inheritance is the most overused feature in object-oriented languages. It is easy to reach for because it saves typing, and it creates the tightest coupling Java offers: a subclass depends on the parent's *implementation*, not just its API, and every change to the parent risks breaking it. This lesson gives you the tests for when inheritance is right, the pattern to use when it is not, and the tools — `final` and `sealed` — for controlling who may extend what.

## The is-a test, taken seriously

`extends` should mean the subclass **is** a parent, in every context the parent is used. The **Liskov substitution principle** makes this precise: any code correct for the parent must stay correct when handed a subclass. Violations are subtle:

```java
class Rectangle { void setWidth(int w); void setHeight(int h); int area(); }
class Square extends Rectangle {          // a square IS a rectangle, mathematically…
    @Override void setWidth(int w)  { super.setWidth(w); super.setHeight(w); }
    @Override void setHeight(int h) { super.setWidth(h); super.setHeight(h); }
}
Rectangle r = new Square();
r.setWidth(5); r.setHeight(3);
r.area();       // 9 — code that assumed width and height are independent is now wrong
```

The subclass kept the *signatures* and broke the *contract*. Substitutability is about behaviour: preconditions no stronger, postconditions no weaker, invariants preserved. If a subclass must throw `UnsupportedOperationException` from an inherited method, or narrow what the parent accepted, it is not a subtype.

## The fragile base class problem

```java
class InstrumentedSet<E> extends HashSet<E> {
    private int added = 0;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) { added += c.size(); return super.addAll(c); }
}
new InstrumentedSet<String>().addAll(List.of("a", "b", "c"));   // added == 6
```

`HashSet.addAll` calls `add` for each element internally, so the count doubles. The subclass depended on a detail of the parent's implementation that the parent never promised — and if a JDK update changed `addAll`, the subclass would break or silently change behaviour. This is *Effective Java* item 18: inheritance across package boundaries is fragile because the subclass sees the parent's method calls as part of its contract.

## Composition: the robust alternative

```java
class InstrumentedSet<E> {
    private final Set<E> inner;          // HAS a set
    private int added = 0;
    InstrumentedSet(Set<E> inner) { this.inner = inner; }

    public boolean add(E e) { added++; return inner.add(e); }
    public boolean addAll(Collection<? extends E> c) {
        int before = inner.size();
        boolean changed = inner.addAll(c);
        added += inner.size() - before;
        return changed;
    }
    public int added() { return added; }
    // forward the rest of the Set methods as needed…
}
```

The wrapper *holds* a set and forwards calls. It depends only on `Set`'s public contract; it can wrap *any* `Set` implementation; and no internal self-call of the wrapped object can reach it. The cost is the forwarding boilerplate (an `AbstractSet`-style forwarding class, or an IDE's "delegate methods", absorbs it). This is the **decorator** pattern; `Collections.unmodifiableSet`, `BufferedReader` wrapping a `Reader`, and `synchronizedList` are all composition.

Rule of thumb: extend only when there is a genuine is-a *and* the parent was **designed for extension** (documented hooks, protected methods, no self-use surprises). Otherwise compose.

## Designing for extension — or forbidding it

If a class is meant to be extended, its author must document which methods call which (`addAll` calls `add`), provide protected hooks deliberately, avoid calling overridable methods from constructors, and test with actual subclasses. That is real work, so the default for classes not designed for it is to **prohibit** extension:

- `final class` — no subclasses. Values, utility classes, security-sensitive types.
- `final` methods — subclasses exist but this step is fixed (template skeletons).
- Private constructors with static factories — extension impossible without a callable constructor.

`String`, `Integer`, `LocalDate` and every record are final; `HashMap` is not, and the JDK carries the burden of documenting its self-use.

## Sealed classes (Java 17)

Between "anyone may extend" and "no one may" sits **sealed**: a class or interface that names exactly which types may extend it.

```java
public sealed abstract class Shape permits Circle, Square, Triangle { … }
public final class Circle extends Shape { … }
public final class Square extends Shape { … }
public non-sealed class Triangle extends Shape { … }    // this branch is open again
```

Each permitted subclass must be `final`, `sealed` or `non-sealed`, and must be in the same module (or package, if unnamed). The payoff: the compiler *knows* the complete set of subtypes, so a `switch` over a `Shape` with pattern matching (Java 21) is exhaustive without a `default`, and adding a fourth shape is a compile error at every such switch — the same safety enums give, for class hierarchies. Sealed types model closed sets of variants (AST nodes, states, results); Module 9 covers sealed *interfaces*, the more common form.

## Inheritance done right

Inheritance is not evil; it is specific. Good uses:

- **A genuine is-a with shared state and a template**: `Shape`/`Circle`, `AbstractList`/`ArrayList`, `Exception` hierarchies (`IOException extends Exception`).
- **Frameworks designed for it**: `HttpServlet.doGet`, JUnit base classes (historically), `Thread` (though `Runnable` composition is preferred).
- **Sealed hierarchies** modelling closed variant sets.

Warning signs: a subclass overriding most parent methods; a subclass that needs a parent's private field; `super` calls whose omission changes behaviour mysteriously; subclasses of classes you do not control; class names that are adjectives on the parent (`FastList`, `BetterMap`).

## A decision procedure

1. Is it truly *is-a*, substitutable everywhere the parent is used? No → compose.
2. Do you control the parent, or is it documented for extension? No → compose.
3. Do you need to reuse the parent's *implementation* only, not be its *type*? Yes → compose (or a private static helper).
4. Is the set of subtypes closed and known? Yes → sealed.
5. Is the class a value or utility? Yes → `final`.

## Interview angle

- *"Composition vs inheritance?"* Has-a vs is-a; composition depends on the public contract only, can wrap any implementation, and avoids the fragile base class problem.
- *"What is the Liskov substitution principle?"* Subtypes must be usable wherever the supertype is, without breaking correctness — behaviour, not just signatures.
- *"Why make a class `final`?"* It was not designed for extension; values must stay immutable; security.
- *"What does `sealed` add?"* A closed, compiler-known set of subtypes — exhaustive switches, safe modelling of variants.
- *"Give an example of the fragile base class problem."* `HashSet.addAll` calling `add` and double-counting in a subclass.

## Key takeaways

- `extends` only for a real is-a that is substitutable in behaviour, with a parent designed for extension.
- Composition (wrap and forward) depends only on public contracts and avoids fragile-base-class breakage.
- `final` by default for classes not designed for extension; `final` methods for fixed template steps.
- `sealed … permits` models closed sets of subtypes with compiler-checked exhaustiveness.
