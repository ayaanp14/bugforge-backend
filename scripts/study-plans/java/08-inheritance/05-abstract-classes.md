---
title: Abstract classes and the template method
minutes: 12
---
Sometimes a parent class knows *that* something must be done but not *how*: every shape has an area, every report has a body, every account settles at month end — but only the concrete kind knows the formula. An **abstract class** declares those methods without bodies and forbids creating instances of itself, leaving subclasses to fill in the blanks. This lesson covers the rules, the template-method pattern that abstract classes exist for, and how to choose between an abstract class and an interface.

## Declaring one

```java
public abstract class Shape {
    private final String name;

    protected Shape(String name) { this.name = name; }

    public abstract double area();                    // no body: subclasses MUST implement
    public abstract double perimeter();

    public String describe() {                        // concrete: shared by all shapes
        return String.format("%s with area %.2f", name, area());
    }
}

public class Circle extends Shape {
    private final double r;
    public Circle(double r) { super("circle"); this.r = r; }
    @Override public double area()      { return Math.PI * r * r; }
    @Override public double perimeter() { return 2 * Math.PI * r; }
}
```

Rules:

- A class with any abstract method must be declared `abstract`; an abstract class may also have none (abstract only to prevent instantiation).
- `new Shape("x")` is a compile error: abstract classes cannot be instantiated. `Shape s = new Circle(1)` is fine — the *type* is usable.
- A concrete subclass must implement **every** inherited abstract method, or be abstract itself.
- Abstract classes can have constructors (called via `super`), fields, concrete methods, static members, `private` members — everything a class can, minus instantiation.
- Abstract methods cannot be `private`, `static` or `final` — each would make overriding impossible.

`describe()` calls `area()`, which does not exist yet in `Shape`. That is the trick: the parent writes an algorithm in terms of operations it leaves abstract, and dynamic dispatch fills them in at run time.

## The template method pattern

```java
public abstract class Report {
    public final String render() {                    // the fixed skeleton — final so it stays fixed
        StringBuilder sb = new StringBuilder();
        sb.append(header());
        sb.append(body());
        sb.append(footer());
        return sb.toString();
    }
    protected String header() { return "== " + title() + " ==\n"; }   // default, overridable
    protected String footer() { return "\n-- end --\n"; }
    protected abstract String title();                // required
    protected abstract String body();                 // required
}
```

`render()` is the **template**: the steps and their order are fixed; some steps have defaults (*hooks*), some must be supplied. Subclasses customise by overriding the pieces, never the skeleton. This is the primary use of abstract classes — sharing an algorithm's structure while varying its parts — and it appears throughout the JDK (`AbstractList` implements `contains`, `indexOf`, iteration and more on top of two abstract methods, `get(int)` and `size()`).

## Partial implementations

`AbstractList`, `AbstractMap`, `AbstractSet` show the other face: skeletal implementations of an interface that turn "implement 25 methods" into "implement 2". If you write an interface others will implement, providing an `AbstractX` next to it is a kindness (Module 9 covers when default methods do this job instead).

## Abstract class or interface?

| | Abstract class | Interface |
| --- | --- | --- |
| Fields / state | Yes, including private | Only constants |
| Constructors | Yes | No |
| Multiple inheritance | No — one parent | Yes — implement many |
| Method bodies | Yes | Default/static/private methods (Java 8+), no state |
| Access levels | All | Public (and private helpers) |
| Says | "is a kind of" with shared implementation | "can do" — a capability |

Choose an **abstract class** when subclasses share *state* and *code* and are conceptually variants of one thing (kinds of `Shape`, kinds of `Report`). Choose an **interface** when unrelated classes should share a *capability* (`Comparable`, `Runnable`, `Closeable`) or when you need multiple types on one class. Frequently both: an interface for the type, an abstract class as a convenient partial implementation (`List` + `AbstractList`).

Since Java 8 interfaces with default methods cover many cases that once needed abstract classes; the remaining distinctive power of an abstract class is **state plus constructors** — a template that owns fields.

## Abstract classes and constructors

`Shape`'s constructor runs when a `Circle` is built (`super("circle")`). Abstract-class constructors exist to initialise the shared fields; they are usually `protected`, since only subclasses call them. The same warning as always: do not call abstract methods from the constructor — the subclass has not initialised its fields yet.

## Abstract classes in APIs

Marking a class abstract is a commitment: it cannot be instantiated, so callers need a concrete subclass or a factory. Pairing an abstract class with static factories (`Shape.circle(1.0)`) hides the subclass names entirely and lets the implementation change later. `Calendar.getInstance()`, `NumberFormat.getInstance()` are this shape in the JDK.

## Interview angle

- *"Can an abstract class have a constructor?"* Yes — called by subclass constructors to set shared state.
- *"Can it have no abstract methods?"* Yes; then `abstract` only prevents instantiation.
- *"Can an abstract method be static?"* No — nothing could override it.
- *"Abstract class vs interface?"* State and constructors vs multiple inheritance and capabilities.
- *"What is the template method pattern?"* A final skeleton method calling abstract/hook steps that subclasses supply.

## Key takeaways

- `abstract` methods have no body; `abstract` classes cannot be instantiated; concrete subclasses must implement every abstract method.
- Abstract classes carry state, constructors and concrete code — the vehicle for the template method pattern.
- Fix the skeleton (`final`), vary the steps (abstract and hook methods).
- Shared state and implementation → abstract class; capability across unrelated types → interface; often both.
