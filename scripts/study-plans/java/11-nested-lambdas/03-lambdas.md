---
title: Lambda expressions
minutes: 15
---
A lambda expression is an anonymous function: parameters, an arrow, a body. Its type is whatever functional interface the context expects, and it compiles to something lighter than an anonymous class. Lambdas are the syntax behind streams, comparators, executors, callbacks and most Java written since 2014. This lesson covers every form of the syntax, how the compiler assigns a type, what `this` and captured variables mean inside one, and the rules for keeping lambdas readable.

## Syntax

```java
() -> 42                                  // no parameters, expression body
x -> x * 2                                // one parameter, parentheses optional
(x, y) -> x + y                           // two parameters
(int x, int y) -> x + y                   // explicit types (all or none)
(var x, var y) -> x + y                   // var for all (Java 11) — lets you add annotations
s -> { return s.length(); }               // block body with return
s -> { System.out.println(s); }           // block body, void
(a, b) -> {                               // multi-statement block
    int diff = a.length() - b.length();
    return diff != 0 ? diff : a.compareTo(b);
}
```

An **expression body** yields its value (or is a `void` statement expression like a method call). A **block body** needs `return` for a value. Parameter types are usually inferred; write them when inference fails or for clarity. The parameter names must not clash with locals in the enclosing scope — lambda parameters are *not* a new scope for shadowing (unlike anonymous class methods).

## Target typing

A lambda has no type of its own. The compiler takes the **target type** from the context — an assignment, a method parameter, a return statement, a cast — finds the functional interface's single abstract method, and checks the lambda against it:

```java
Function<String, Integer> len = s -> s.length();          // target: Function<String,Integer>; SAM: Integer apply(String)
Predicate<String> empty = s -> s.isEmpty();               // same lambda shape, different interface → a different object type
Runnable r = () -> System.out.println("hi");              // target from the declaration
list.sort((a, b) -> a.compareTo(b));                      // target from the parameter type Comparator<? super String>
return x -> x + 1;                                        // target from the method's return type
Object o = (Runnable) () -> {};                           // a cast supplies the target when nothing else does
Object bad = () -> {};                                    // compile error: Object is not a functional interface
```

The same text can become a `Callable<Integer>` or a `Supplier<Integer>` depending on where it appears; ambiguity between overloads (`submit(Runnable)` vs `submit(Callable)`) is resolved by whether the body returns a value — and sometimes needs a cast to settle.

## Captures and effectively final

```java
int base = 10;
Function<Integer, Integer> addBase = x -> x + base;      // captures base
base = 20;                                                // compile error at the lambda: base must be effectively final
```

Same rule as anonymous classes, same reason: captured locals are copied. Fields, `this`, and the contents of captured objects (arrays, lists, atomics) can be read and written freely. The idiom for a counter inside a lambda is `int[] count = {0}; … count[0]++` or an `AtomicInteger` — but if you find yourself doing that in a stream, the stream is probably the wrong tool (streams want stateless lambdas).

## `this` inside a lambda

```java
public class Greeter {
    private String name = "outer";
    void run() {
        Runnable lambda = () -> System.out.println(this.name);            // "outer": this is the Greeter
        Runnable anon = new Runnable() {
            String name = "anon";
            public void run() { System.out.println(this.name); }          // "anon": this is the anonymous object
        };
    }
}
```

A lambda introduces **no new `this`**; it is lexically part of the enclosing method. This is the single most important behavioural difference from anonymous classes, and it is what makes lambdas natural for callbacks that touch the enclosing object.

## How lambdas compile

Not to a class file per lambda. `javac` emits a private synthetic method holding the body and an `invokedynamic` instruction; on first execution the JVM's `LambdaMetafactory` spins a small class implementing the interface. Non-capturing lambdas are typically a single shared instance; capturing ones allocate per evaluation. Practical consequences: lambdas start cheaper than anonymous classes, do not pollute the class file list, and their `toString`/`getClass` are unreadable (`Main$$Lambda$14/0x…`).

## Exceptions in lambdas

A lambda may throw only what its target method declares. `Runnable.run` and `Function.apply` declare nothing, so a checked exception inside must be caught in the body (or wrapped in an unchecked one). `Callable.call() throws Exception` accepts anything. This is the reason many stream pipelines have a `try/catch` inside a `map` or a small helper that rethrows as unchecked (Module 12).

## Readability rules

- **One line if possible.** A lambda longer than three lines wants to be a named method (`this::process`) — the name documents it, and it can be tested.
- **Descriptive parameter names** in longer lambdas (`(order, line) ->`), single letters in trivial ones (`x -> x * 2`).
- **No side effects in stream lambdas**; use them in `forEach` only.
- **Prefer method references** when the lambda only calls one method (next lesson).
- **Do not overload methods on functional interfaces with the same arity** (`f(Runnable)` and `f(Callable)`): callers need casts.

## Lambdas versus anonymous classes, summarised

| | Lambda | Anonymous class |
| --- | --- | --- |
| Implements | one abstract method of an interface | any class or interface, any number of methods |
| `this` | enclosing instance | the anonymous object |
| State | none (captures only) | fields allowed |
| Cost | invokedynamic; shared if non-capturing | a class file and an object per creation |
| Shadowing params | not allowed | allowed |

## Interview angle

- *"What is the type of a lambda?"* Whatever functional interface the context requires — it has no intrinsic type.
- *"What does `this` refer to inside a lambda?"* The enclosing instance.
- *"Can a lambda modify a captured local?"* No; it must be effectively final. Use a field or a holder object.
- *"Are lambdas compiled to anonymous classes?"* No — `invokedynamic` and a runtime-generated class; non-capturing ones are shared.
- *"Can a lambda throw a checked exception?"* Only if the functional interface's method declares it.

## Key takeaways

- `(params) -> expression | { block }`; types inferred from the target functional interface.
- Captured locals must be effectively final; `this` is the enclosing object, not the lambda.
- Checked exceptions inside need the SAM to declare them or a catch in the body.
- Keep lambdas short and stateless; extract longer ones into named methods.
