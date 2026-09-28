---
title: Local and anonymous classes
minutes: 11
seo-title: Anonymous Class in Java: Local Classes and Effectively Final
description: A Java anonymous class declares and instantiates an unnamed subclass in one expression. Local classes, effectively final captures, and when a lambda is better.
question: What is an anonymous class in Java?
answer: An anonymous class in Java is a class with no name, declared and instantiated in one expression: `new Type() { … }` creates a subclass of a class, or an implementation of an interface, and returns one instance of it. It can override methods and add fields but has no constructor. Before lambdas it was how Java passed behaviour such as a `Comparator` or `Runnable`.
q: Why must local variables used in an anonymous class be effectively final?
a: The anonymous object may outlive the method, so Java copies each captured local into a hidden field when the object is created. A copy of a variable that could later change would be wrong, so the compiler forbids reassigning it: "local variables referenced from an inner class must be final or effectively final".
q: Can an anonymous class have a constructor?
a: No — it has no name to give a constructor. Use an instance initialiser block for set-up, and pass any arguments in the parentheses of `new Type(args) { … }`, where they go to the superclass constructor.
q: When should you use an anonymous class instead of a lambda?
a: When a lambda cannot do the job: the type has more than one abstract method, you are extending an abstract or concrete class, the object needs fields of its own, or `this` must mean the new object. For a single-method interface, prefer a lambda.
q: What is a local class in Java?
a: A local class is a named class declared inside a method or block and visible only there. It is a full class — constructors, fields, several methods — and, like an anonymous class, it can capture effectively final locals of the enclosing method.
q: What does effectively final mean in Java?
a: A variable is effectively final when it is never reassigned after initialisation, even without the `final` keyword. Only such locals may be captured by lambdas, local classes and anonymous classes; to change captured state, use a field, a one-element array or an `AtomicInteger`.
---
Two more places a class can be declared: inside a method (a **local class**) and inline at the point of use, without a name (an **anonymous class**). Both can capture variables from the surrounding method, which is where the *effectively final* rule comes from, and both were the way Java passed behaviour around before lambdas. You will read anonymous classes in every codebase older than 2014 and still write them when a lambda cannot do the job.

## Local classes

```java
static List<String> longestWords(List<String> words) {
    final int limit = 5;

    class LengthFilter {                              // visible only inside this method
        boolean keep(String w) { return w.length() > limit; }   // captures limit
    }

    LengthFilter f = new LengthFilter();
    List<String> out = new ArrayList<>();
    for (String w : words) if (f.keep(w)) out.add(w);
    return out;
}
```

A local class is declared in a block and scoped to it. It may implement interfaces and extend classes, have constructors and multiple methods — a full class, just private to the method. Declared in an instance method it is an inner class (has `Outer.this`); in a static method it has no outer instance. Local records, enums and interfaces (Java 16) are implicitly static.

Use it when a method needs a small helper type with more than one method or with state — and the type is meaningless elsewhere.

## Anonymous classes

```java
Comparator<String> byLength = new Comparator<String>() {       // declares AND instantiates a subclass of Comparator
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
};

Runnable task = new Runnable() {
    @Override public void run() { System.out.println("working"); }
};

Thread t = new Thread() {                                       // extending a CLASS anonymously
    @Override public void run() { … }
};
```

`new Type() { body }` creates a class with no name that extends `Type` (a class) or implements it (an interface), and immediately creates one instance. The body may override methods, add fields and methods (usable only inside the body — the outside knows only `Type`), and have instance initialiser blocks — but **no constructor** (there is no name to give it) and no static members except constants. Arguments in the parentheses go to the superclass constructor.

Like local classes, anonymous classes declared in instance code are inner classes with a hidden `Outer.this`; `this` inside the body refers to the anonymous instance, not the enclosing object — the main behavioural difference from lambdas.

## Capturing variables: effectively final

Both local and anonymous classes can use the enclosing method's parameters and locals — but only if those variables are **effectively final** (never reassigned after initialisation):

```java
int count = 0;
Runnable r = new Runnable() {
    public void run() { count++; }      // compile error: local variables referenced from an inner class must be final or effectively final
};
```

Why: the class instance may outlive the method (returned, stored, run on another thread), while the local lives in the method's stack frame. Java resolves this by **copying** the captured value into a hidden field of the instance at creation. A copy of a variable that could later change would be a lie, so the language forbids the change. To mutate captured state, use a field of the enclosing object, a one-element array, or `AtomicInteger`/`AtomicReference` — each an object whose *reference* is effectively final while its contents change.

Fields of the enclosing instance are not copies — they are reached through `Outer.this` — so they can be freely read and written.

## Where anonymous classes still win over lambdas

| Situation | Why a lambda cannot |
| --- | --- |
| The type has **more than one abstract method** | Lambdas need a single abstract method |
| Extending an **abstract class** or a concrete class | Lambdas only implement interfaces |
| You need **`this` to mean the new object** (call its own other methods, pass itself as a listener) | In a lambda `this` is the enclosing instance |
| You need **instance state** in the object | A lambda has no fields |
| Overriding **several** methods of an interface (`Iterator` with `hasNext`/`next`) | One method only |

`Iterator` implementations, `TimerTask`/`Thread` subclasses, `AbstractList` one-offs, and listeners with two callbacks are the everyday cases.

## Reading old code

Pre-Java-8 code passes behaviour as anonymous classes everywhere: `new Comparator<…>() { … }`, `new Runnable() { … }`, `new ActionListener() { … }`. Mentally translate each one-method anonymous class to a lambda; that is precisely what the IDE's "convert to lambda" refactoring does, and it is safe whenever the body does not use `this` or declare fields.

## Compiled form and identity

Each anonymous class becomes `Outer$1.class`, `Outer$2.class`… — one class file per occurrence, loaded at first use. `getClass().getName()` shows the `$1`; `getClass().getSimpleName()` is empty. Two anonymous instances from the same site have the same class; instances from different sites have different classes even if the bodies are identical.

## Interview angle

- *"Can an anonymous class have a constructor?"* No; use an instance initialiser block, or pass arguments to the superclass constructor.
- *"Why must captured locals be effectively final?"* They are copied into the instance; a later change would not be seen.
- *"When would you use an anonymous class instead of a lambda?"* Multiple abstract methods, abstract classes, needing `this` as the object, needing state.
- *"What is a local class?"* A named class declared inside a method, scoped to it.

## Key takeaways

- Local classes: named, method-scoped, full classes. Anonymous classes: declared and instantiated inline, extending a class or implementing an interface, no constructor.
- Both capture enclosing locals by copy — hence effectively final; enclosing fields are shared via `Outer.this`.
- In an anonymous class `this` is the anonymous object; in a lambda it is the enclosing instance.
- Prefer lambdas for single-method interfaces; anonymous classes for everything else.
