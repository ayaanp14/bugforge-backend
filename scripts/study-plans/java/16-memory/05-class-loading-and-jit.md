---
title: Class loading, initialisation order and the JIT
minutes: 15
---
Two more things the runtime does behind your back. **Class loading** brings a `.class` file into the JVM the first time it is needed, through a chain of loaders that decides which version of a class you get and when its `static` initialisers run — the mechanics behind `ClassNotFoundException`, `NoClassDefFoundError`, the lazy singleton idiom, and every "why did my static block run *there*?" surprise. **Just-in-time compilation** turns hot bytecode into machine code while the program runs, which is why Java is fast after warming up, why microbenchmarks lie, and why a method that "does nothing" can take zero time. Both are asked about; both are simpler than their reputations.

## Loading, linking, initialising

A class goes through three phases, lazily, the first time the program touches it:

1. **Loading** — a class loader finds the bytes (from a jar, a directory, the network, or generated in memory) and creates the `Class` object. Nothing runs yet.
2. **Linking** — *verification* (the bytecode is well-formed and type-safe: this is the sandbox), *preparation* (static fields get their default zero values), and lazy *resolution* of symbolic references to other classes.
3. **Initialisation** — the static initialisers run: `static` field initialisers and `static { }` blocks, in textual order, exactly once, under a lock so that two threads racing to use the class both see a fully initialised one.

Initialisation is triggered by the *first active use*: `new`, a static method call, a non-constant static field access, `Class.forName`, or initialising a subclass (the superclass initialises first). It is **not** triggered by referring to a compile-time constant (`Foo.MAX` where `MAX` is `static final int MAX = 10` is inlined by `javac`) nor by `Foo.class` or declaring a variable of the type.

```java
class Config {
    static final int PORT = 8080;                 // a constant: using it does not initialise Config
    static { System.out.println("Config loaded"); }
}
int p = Config.PORT;          // prints nothing
Config c = null;              // prints nothing
new Config();                 // prints "Config loaded"
```

## The order, spelled out

For `new Child()` where `Child extends Parent`, the first time:

1. `Parent` static field initialisers and static blocks, textual order.
2. `Child` static field initialisers and static blocks.
3. Then, for every `new`: `Parent` instance field initialisers and instance `{ }` blocks, then the `Parent` constructor body; then `Child` instance initialisers, then the `Child` constructor body.

Static parts once per class, top of the hierarchy first; instance parts per object, parent first. A constructor's implicit `super()` is what makes step 3 happen in that order, and calling an overridable method from a parent constructor sees the child's fields *still at their defaults* — the classic trap from the inheritance module, now explained by the order above.

## The lazy-holder idiom

Because initialisation is lazy, once-only and thread-safe by specification, it is the cleanest way to build a lazily created singleton with no locks in your own code:

```java
class Registry {
    private Registry() {}
    private static class Holder { static final Registry INSTANCE = new Registry(); }
    static Registry get() { return Holder.INSTANCE; }   // Holder initialises on first call, exactly once
}
```

No `synchronized`, no `volatile`, no double-checked locking; the JVM's class-initialisation lock does the work. Enums get the same guarantee for free, which is why "an enum with one constant" is the other standard singleton.

## The class-loader hierarchy

Loaders form a parent chain and use **parent-first delegation**: asked for a class, a loader first asks its parent; only if the whole chain above fails does it look itself.

- **Bootstrap** loader (native, shown as `null`) — the core modules: `java.base` (`java.lang`, `java.util`, …).
- **Platform** loader — the rest of the JDK modules (`java.sql`, `java.xml`, …).
- **Application** (system) loader — your classpath / module path.
- Custom loaders — application servers, plugin systems, IDEs; each web app in Tomcat has its own, so two apps can ship different versions of the same library.

Delegation is why you cannot replace `java.lang.String` by putting your own on the classpath — the bootstrap loader answers first — and why a class is identified by *loader plus name*: the same `.class` loaded by two loaders is two different classes, and casting between them fails with a bewildering `ClassCastException: com.x.Foo cannot be cast to com.x.Foo`.

## `ClassNotFoundException` versus `NoClassDefFoundError`

- **`ClassNotFoundException`** — a checked exception from an explicit lookup by name (`Class.forName("com.mysql.Driver")`, `loader.loadClass`) that found nothing. Usually a missing jar or a typo in a string.
- **`NoClassDefFoundError`** — an `Error` when the JVM itself needs a class that was present at compile time and is missing at run time — or, the sneaky case, was found but its **static initialiser threw**: the first attempt raises `ExceptionInInitializerError`, and every later use of the class fails with `NoClassDefFoundError: Could not initialize class X`. When you see the second message, look for the first.

## The JIT: interpreted, then compiled

`javac` produces bytecode; the JVM starts by **interpreting** it. HotSpot counts invocations and loop iterations, and when a method gets hot it is compiled to native code — first by **C1** (fast compile, modest optimisation), then, if it stays hot, by **C2** (slow compile, aggressive optimisation). This **tiered compilation** gives quick start-up and peak speed. Compiled code is kept in the *code cache*; `-XX:+PrintCompilation` shows it happening.

What C2 does is why "Java is slow" stopped being true around 2005:

- **Inlining** — small methods (getters, lambdas, `Integer.intValue`) are copied into the caller; the call vanishes. This is what makes streams as fast as loops when warm.
- **Escape analysis** — an object that provably never leaves the method may be allocated on the stack or dissolved into locals (*scalar replacement*); short-lived `Point`s and iterators often cost nothing.
- **Speculative optimisation** — if a call site has only ever seen one class, compile a direct call with a *guard*; if a new class shows up, **deoptimise** back to the interpreter and recompile. Virtual calls in Java are usually as cheap as static ones for this reason.
- **Loop unrolling, bounds-check elimination, dead-code elimination** — a benchmark whose result is never used may be optimised to nothing, taking 0 ns and proving nothing.

## Why microbenchmarks lie, and what to do

Time a method once with `System.nanoTime()` and you measure the interpreter, class loading and a cold cache. Time it in a loop and the JIT compiles it half-way through, or removes it because the result is unused. Use **JMH** (the OpenJDK harness): it warms up, runs many forks, prevents dead-code elimination with `Blackhole`, and reports a distribution, not a number. In an interview, the sentence "I would measure that with JMH after warm-up" earns more than any guess about which of two snippets is faster.

## Interview angle

- *"When does a static block run?"* At class initialisation — first active use (`new`, static method, non-constant static field), once, thread-safely; not for constants or `Foo.class`.
- *"Order for `new Child()`?"* Parent statics, Child statics (once); then Parent instance init + constructor, Child instance init + constructor.
- *"How does class loading work?"* Bootstrap → platform → application loaders, parent-first delegation; identity is loader + name.
- *"`ClassNotFoundException` versus `NoClassDefFoundError`?"* Explicit lookup failed versus the JVM needing a class that is missing or failed to initialise.
- *"What does the JIT do?"* Interprets first, compiles hot code with C1 then C2; inlining, escape analysis, speculative optimisation with deoptimisation.

## Key takeaways

- Load → link (verify, prepare, resolve) → initialise; initialisation is lazy, once, thread-safe, triggered by first active use.
- Statics top-down once; per object, parent init + constructor before child. The holder idiom rides on this.
- Parent-first delegation; a class is (loader, name); core classes cannot be shadowed.
- `NoClassDefFoundError: Could not initialize class` means a static initialiser threw earlier.
- Tiered JIT: interpreter → C1 → C2; inlining and escape analysis make abstractions free once warm; benchmark with JMH.
