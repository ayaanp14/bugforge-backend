---
title: Overloading and how the compiler picks
minutes: 14
---
Two methods with the same name and different parameter lists are **overloads**. `System.out.println` has ten of them; `Math.max` has four; you will write your own to offer convenient variants of one operation. The compiler chooses among them at **compile time** by a three-phase rule that is precise, occasionally surprising, and a favourite interview topic.

## What can be overloaded

```java
static int    max(int a, int b)
static long   max(long a, long b)
static double max(double a, double b)
static int    max(int a, int b, int c)
```

Overloads differ in the **number or types of parameters** (the signature). They may not differ *only* in return type — `int f()` and `long f()` in one class is an error, because a call `f()` could not choose. Parameter names are irrelevant. Overloads may have different return types, modifiers and exceptions, as long as the parameter lists differ.

Overloading is resolved **statically**: the compiler looks at the declared types of the argument expressions, not what they hold at run time. That is the crucial difference from **overriding** (Module 8), which is resolved at run time by the receiver's actual class.

## The three phases

Given a call, the compiler finds the applicable overloads in three phases and stops at the first phase that finds any:

1. **Exact match or primitive widening / reference subtyping** — no boxing, no varargs.
2. **With boxing/unboxing** allowed.
3. **With varargs** allowed.

Within a phase, the **most specific** method wins (an `int` parameter is more specific than `long`, `String` more specific than `Object`). If two are equally specific, the call is *ambiguous* and fails to compile.

```java
static void f(long x)      { System.out.println("long"); }
static void f(Integer x)   { System.out.println("Integer"); }
static void f(Object x)    { System.out.println("Object"); }
static void f(int... x)    { System.out.println("varargs"); }

f(5);       // "long"    — phase 1: int widens to long; boxing (Integer) is phase 2
```

Widening beats boxing. Remove `f(long)` and the answer becomes `"Integer"` (phase 2, boxing, and `Integer` is more specific than `Object`). Remove that too and it is `"Object"` (still phase 2: box to `Integer`, then subtype to `Object`). Only with all three gone does varargs win.

## Widening preferences

Among primitives, the compiler picks the *smallest* widening: with `f(long)`, `f(float)` and `f(double)` available, `f(5)` calls `f(long)`. `char` widens to `int` before anything else: `f('a')` with `f(int)` and `f(long)` calls `f(int)`.

`byte`/`short`/`char` never *narrow* to match: `f((short) 1)` cannot call `f(byte)`.

## Reference types: most specific wins

```java
static void g(Object o)  { … "Object" }
static void g(String s)  { … "String" }

g("hi");            // "String" — more specific
g(null);            // "String" — null converts to any reference; String is more specific than Object
Object o = "hi";
g(o);               // "Object" — the DECLARED type of o is Object; resolution is static
```

The last line is the one to remember: the argument's *static type* decides, not the object inside. And `g(null)` with `g(String)` and `g(Integer)` is **ambiguous** — neither is more specific than the other — and fails to compile; cast the null: `g((String) null)`.

## Boxing pitfalls

```java
static void h(long x)   { … }
static void h(Integer x){ … }
Integer boxed = 5;
h(boxed);           // "Integer" — exact match in phase 1 (no conversion needed)
h(5);               // "long"    — widening (phase 1) beats boxing (phase 2)
```

A related classic: `List<Integer> list; list.remove(1)` calls `remove(int index)` — removing the element at index 1 — not `remove(Object o)`, because the exact primitive match wins. To remove the *value* 1: `list.remove(Integer.valueOf(1))`.

## Overloading and `null`

`System.out.println(null)` is ambiguous (`char[]` and `String` both apply). `println((Object) null)` compiles. Passing bare `null` to an overloaded method is a smell for this reason.

## Overloading versus defaults

Java has no default parameter values. Overloads *are* the way to offer defaults: the short version calls the full one.

```java
void connect(String host)            { connect(host, 80, 30_000); }
void connect(String host, int port)  { connect(host, port, 30_000); }
void connect(String host, int port, int timeoutMs) { … the real work … }
```

One implementation, several entry points. This "telescoping" pattern is standard; beyond three or four parameters, a builder (Module 7) reads better.

## Overloads and constructors

Constructors overload the same way, and `this(...)` chains them (Module 7). The same resolution rules apply to `new Foo(5)`.

## Guidelines

- Overloads should do the **same thing** for different inputs. `add(int)` and `add(String)` doing unrelated work is a naming failure.
- Avoid overloads whose parameters differ only by boxing or widening (`f(int)` vs `f(Integer)`, `f(long)` vs `f(int)`) — callers cannot predict which they get. `Math.max`'s four are fine because they behave identically.
- Avoid overloads that both accept `null`-able reference types at the same position.
- Never rely on varargs to disambiguate.
- `@Override`-style safety does not exist for overloads: a typo in a parameter type silently creates a new overload instead of an error. Tests catch it; the compiler does not.

## Interview angle

- *"Can methods be overloaded by return type?"* No.
- *"`f(5)` with `f(long)` and `f(Integer)` — which runs?"* `f(long)`: widening before boxing.
- *"Is overloading resolved at compile time or run time?"* Compile time, from the arguments' declared types.
- *"`list.remove(1)` on a `List<Integer>`?"* Removes index 1 — exact match on `int`.
- *"What does `g(null)` do with `g(String)` and `g(Object)`?"* Calls `g(String)`, the more specific.

## Key takeaways

- Overloads differ in parameter lists; return type alone does not count.
- Resolution is static (declared types) in three phases: widening/subtyping → boxing → varargs; most specific wins; ties are errors.
- Widening beats boxing beats varargs; `String` beats `Object`; `null` picks the most specific reference overload or is ambiguous.
- Use overloads for defaults and same-behaviour variants; avoid boxing-only differences.
