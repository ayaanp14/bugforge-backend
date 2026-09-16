---
title: Overriding — the rules and the traps
minutes: 14
---
A subclass **overrides** a parent method by declaring one with the same signature; calls on the object then run the subclass version, whatever the reference's declared type. The rules for a valid override are exact — the compiler enforces some and warns about none of the rest — and the difference between overriding and *hiding* is a reliable interview question. This lesson is the checklist.

## The rules of a valid override

Given `class Sub extends Base` and a method `m` in `Base`:

| Rule | Detail |
| --- | --- |
| **Same name and parameter types** | Exactly. Different parameters = an *overload*, not an override. |
| **Return type** | Same, or a **subtype** for reference returns (covariant return: `Base.copy()` returns `Base`, `Sub.copy()` may return `Sub`). Primitive returns must match exactly. |
| **Access** | Not more restrictive. `public` in the parent must stay `public`; `protected` may become `public`. |
| **Checked exceptions** | May throw fewer or narrower checked exceptions, never new or broader ones (Module 12). Unchecked ones are free. |
| **Not `final`**, **not `static`**, **not `private`** | A `final` method cannot be overridden; a `static` one is hidden, not overridden; a `private` one is invisible, so a same-named method in the subclass is unrelated. |
| **Instance ↔ instance** | An instance method cannot override a static one or vice versa. |

```java
class Base {
    protected Object make() throws IOException { … }
}
class Sub extends Base {
    @Override
    public String make() { … }        // valid: wider access, covariant return, fewer exceptions
}
```

## `@Override`

Always annotate an override. The annotation asks the compiler to *verify* the method overrides something; a typo in the name (`tostring`), a wrong parameter type (`equals(Point p)` instead of `equals(Object o)`), or a `final` parent method then fails to compile instead of silently creating a new method that nobody calls. `equals(Point)` is the classic: it compiles, `HashSet` never calls it, and the bug appears months later.

## Calling the parent version

```java
@Override
public String toString() {
    return super.toString() + "[extra]";
}
```

`super.m()` invokes the parent's implementation on the same object. Common in `toString`, in `equals` for subclasses that add fields, and in hook methods that extend rather than replace behaviour.

## Overriding versus overloading

```java
class Printer {
    void print(Object o) { System.out.println("object"); }
}
class FancyPrinter extends Printer {
    void print(String s) { System.out.println("string"); }      // OVERLOAD — different parameter type
    @Override void print(Object o) { System.out.println("fancy object"); }   // OVERRIDE
}

Printer p = new FancyPrinter();
p.print("hi");        // "fancy object" — the reference type Printer has only print(Object); that is chosen at compile time
                      //                  and then dispatched to FancyPrinter's override at run time
((FancyPrinter) p).print("hi");   // "string" — now the overload set includes print(String)
```

Two decisions happen: the **compiler** picks the overload from the reference's static type (Module 5); the **JVM** picks the override from the object's runtime class. Keep both in mind when a call does something unexpected.

## Static methods are hidden, not overridden

```java
class A { static String who() { return "A"; } }
class B extends A { static String who() { return "B"; } }

A ref = new B();
ref.who();        // "A" — resolved by the STATIC type; static methods do not dispatch
B.who();          // "B"
```

`B.who` *hides* `A.who`. There is no polymorphism for statics; calling them through an instance reference is legal and misleading, which is why style checkers reject it. `@Override` on a static method is a compile error — the compiler's way of saying so.

## Fields are hidden too

```java
class A { String name = "A"; }
class B extends A { String name = "B"; }
A a = new B();
a.name             // "A" — fields are resolved by static type, never overridden
((B) a).name       // "B"
```

An object of class `B` has *two* `name` fields. This is confusing enough that redeclaring a parent's field is treated as a bug. Fields are private; behaviour is overridden through methods.

## Overriding `Object` methods

`toString`, `equals`, `hashCode` are the three every class overrides eventually (lesson 4). `equals` **must** take `Object` — `public boolean equals(Object o)` — or it is an overload that collections ignore. `clone` and `finalize` are legacy; do not override them.

## Calling overridable methods from constructors

```java
class Base {
    Base() { init(); }                 // calls the override before Sub's fields exist
    void init() { }
}
class Sub extends Base {
    private final List<String> items = new ArrayList<>();
    @Override void init() { items.add("x"); }    // NullPointerException: items is still null here
}
```

The parent constructor runs before the subclass's field initialisers (Module 7), so an override invoked from it sees default field values. Rule: constructors call only `private`, `static` or `final` methods. Frameworks that need post-construction hooks provide an explicit `init()` called after `new`.

## Covariant returns and fluent APIs

```java
class Builder { Builder name(String n) { …; return this; } }
class FancyBuilder extends Builder {
    @Override FancyBuilder name(String n) { super.name(n); return this; }   // covariant: callers keep the Fancy type
    FancyBuilder colour(String c) { … }
}
new FancyBuilder().name("x").colour("red");    // compiles only because name() returns FancyBuilder
```

Covariant returns exist for exactly this — and for `clone()` returning the precise type.

## Exceptions in overrides

If `Base.load() throws IOException`, `Sub.load()` may throw `IOException`, a subclass of it, or nothing — but not `Exception` or `SQLException`. Callers holding a `Base` reference catch `IOException`; a broader exception would escape their handlers. Unchecked exceptions are not part of the signature and may be added freely.

## Interview angle

- *"Can you override a static method?"* No — hiding. *"A private one?"* No — invisible. *"A final one?"* No.
- *"Can an override return a different type?"* A subtype of the parent's reference return type.
- *"Why must `equals` take `Object`?"* Otherwise it overloads instead of overriding and collections do not call it.
- *"Can an override be more restrictive?"* No: access may widen, never narrow.
- *"What does `@Override` do at run time?"* Nothing; it is a compile-time check.

## Key takeaways

- Same signature, compatible (covariant) return, no narrower access, no broader checked exceptions; not for `static`, `private` or `final` methods.
- Always `@Override`; `equals(Object)`, not `equals(MyType)`.
- Overloads are chosen by the compiler from the static type; overrides by the JVM from the runtime class.
- Static methods and fields are hidden, not overridden — resolved by reference type.
- Never call overridable methods from a constructor.
