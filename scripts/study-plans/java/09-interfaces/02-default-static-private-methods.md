---
title: Default, static and private interface methods
minutes: 13
seo-title: Default Methods in Java Interfaces: Static and Private Methods
description: Java 8 default methods give interfaces inherited bodies. How clashing defaults are resolved with X.super.m(), plus static and Java 9 private interface methods.
question: What is a default method in Java?
answer: A default method in Java is an interface method with a body, marked `default`, that every implementing class inherits unless it overrides it. Java 8 added them so published interfaces could grow — `Collection.stream()`, `Iterable.forEach` and `List.sort` arrived without breaking existing classes. A default can call the interface's abstract methods but cannot use instance fields, since interfaces have none.
q: What happens when a class implements two interfaces with the same default method?
a: It fails to compile unless the class overrides the method and chooses, for example by calling `Swimmer.super.move()`. Before that rule applies, a method defined in the class or a superclass always wins, and a more specific interface wins over the one it extends.
q: Why were default methods added to Java?
a: To evolve interfaces without breaking their implementations. Adding an abstract method to a published interface breaks every implementing class, so Java 8 added `stream()`, `forEach`, `sort` and similar methods to the collection interfaces as defaults that existing classes inherit unchanged.
q: Are static interface methods inherited in Java?
a: No. A static interface method is called on the interface name, as in `Comparator.comparing` or `List.of`, and implementing classes do not inherit it — `Bot.notNull()` does not compile even when `Bot` implements the interface that declares `notNull()`.
q: What are private methods in interfaces for?
a: Since Java 9, `private` and `private static` interface methods let several default methods share helper code without making that helper part of the interface's public API. They must have a body and cannot be called from outside the interface.
q: Can an interface provide a default toString or equals in Java?
a: No — a `default` method that overrides a public `Object` method is a compile error, because a method inherited from a class always wins over an interface default. An interface may still declare `equals` abstractly to document its contract, as `List` and `Set` do.
---
Until Java 8 an interface was pure signatures. Then `default` methods gave interfaces bodies, static methods gave them utilities, and Java 9 added private helpers. The change was made so the collections could gain `stream()`, `forEach` and `sort` without breaking existing implementations — and it changed how interfaces are designed. This lesson covers the three kinds of concrete interface method and the one genuinely tricky rule: what happens when two defaults collide.

## Default methods

```java
public interface Greeter {
    String name();                                     // abstract

    default String greet() {                           // concrete, inherited by implementors
        return "Hello, " + name() + "!";
    }
}

public class Bot implements Greeter {
    public String name() { return "bot"; }             // greet() comes for free
}

public class LoudBot implements Greeter {
    public String name() { return "LOUDBOT"; }
    @Override public String greet() { return Greeter.super.greet().toUpperCase(); }   // override, and call the default
}
```

A `default` method has a body and is inherited by every implementing class that does not override it. It can call the interface's abstract methods — the template-method idea, but without state. `Greeter.super.greet()` is the syntax for reaching the interface's default from an override.

What defaults are for:

- **Evolving published interfaces**: `Collection.stream()`, `Iterable.forEach(Consumer)`, `List.sort(Comparator)`, `Map.getOrDefault`, `Map.computeIfAbsent`, `Comparator.reversed()` — all added in Java 8 as defaults so existing classes kept compiling.
- **Convenience methods derived from the abstract ones**: `Comparator.thenComparing`, `Predicate.and/or/negate`, `Function.andThen`.
- **Optional operations with a sensible default**: `Iterator.remove()` defaults to throwing `UnsupportedOperationException`.

What they are not for: state. An interface still has no instance fields, so a default method can only compute from the abstract methods it calls. If shared code needs fields, that is an abstract class.

## The diamond: resolving conflicts

Because a class can implement several interfaces, two can supply defaults with the same signature. Three rules resolve every case:

1. **A class wins over an interface.** If the class (or a superclass) defines the method, that is used; defaults are ignored. `Object`'s methods therefore can never be defaulted (`default String toString()` in an interface is a compile error).
2. **A more specific interface wins.** If `B extends A` and both define `default m()`, a class implementing both gets `B.m()`.
3. **Otherwise the class must override** and choose explicitly:

```java
interface Swimmer { default String move() { return "swim"; } }
interface Flyer   { default String move() { return "fly"; } }

class Duck implements Swimmer, Flyer {
    @Override public String move() {
        return Swimmer.super.move() + " and " + Flyer.super.move();   // pick, combine, or write anew
    }
}
```

Without the override, `class Duck implements Swimmer, Flyer` fails: "types Swimmer and Flyer are incompatible; class Duck inherits unrelated defaults for move()". The compiler never guesses.

## Static methods in interfaces

```java
public interface Validator<T> {
    boolean isValid(T value);

    static <T> Validator<T> notNull() { return v -> v != null; }         // factory
    static <T> Validator<T> all(List<Validator<T>> vs) { … }
}
Validator<String> v = Validator.notNull();
```

Static interface methods are called on the interface name (`Validator.notNull()`), never on an instance and — unlike class statics — **not inherited** by implementing classes (`Bot.notNull()` does not compile). They exist for factories and utilities that belong with the type: `Comparator.comparing`, `List.of`, `Map.entry`, `Predicate.not`, `Function.identity`.

## Private interface methods (Java 9)

```java
public interface Logger {
    void write(String line);
    default void info(String msg)  { write(format("INFO", msg)); }
    default void error(String msg) { write(format("ERROR", msg)); }
    private String format(String level, String msg) {                     // shared by the defaults, hidden from implementors
        return "[" + level + "] " + msg;
    }
}
```

`private` (and `private static`) interface methods let default methods share code without exposing helper methods as part of the interface's API. They cannot be abstract and cannot be called from outside the interface.

## Interfaces versus abstract classes, revisited

With defaults, interfaces can do most of what abstract classes do — except hold state, declare constructors, and have non-public members. The guidance:

- Interface with defaults when the shared code is a *derivation* of the abstract methods (`Comparator.reversed`).
- Abstract class when the shared code needs *fields* (a counter, a cache, a buffer) or a controlled constructor.
- Both together (an interface plus an `AbstractX` skeleton) for library types others implement.

## Defaults and `equals`/`hashCode`

An interface can *declare* `boolean equals(Object o)` abstractly to document a contract (`List` and `Set` do), but cannot provide a default for it — rule 1 above, since every class inherits `Object.equals`. Equality stays the class's responsibility.

## Design cautions

- A default method is part of the API forever; changing its behaviour changes every implementor that did not override it.
- Defaults that call other defaults form dependency chains implementors cannot see; document which defaults call which (the fragile base class problem, interface edition).
- Do not add defaults merely to save typing in one implementation — that is what an abstract class or a helper is for.

## Interview angle

- *"Why were default methods added?"* To evolve interfaces (collections gained `stream`) without breaking implementations.
- *"Two interfaces, same default — what happens?"* Compile error unless the class overrides and picks with `X.super.m()`.
- *"Can an interface define `toString` as a default?"* No — class methods (`Object`'s) always win.
- *"Are static interface methods inherited?"* No; call them on the interface.
- *"What are private interface methods for?"* Sharing code among defaults without exposing it.

## Key takeaways

- `default` methods give interfaces inherited bodies computed from their abstract methods; no state.
- Conflict resolution: class beats interface; more specific interface beats less; otherwise the class must override (`Iface.super.m()`).
- `static` interface methods are factories/utilities on the interface name, not inherited.
- `private` interface methods share code between defaults.
- Interfaces still cannot hold fields or constructors — that remains the abstract class's job.
