---
title: Variables, constants and var
minutes: 12
---
A variable is a named slot with a declared type. Java has four kinds — local variables, parameters, instance fields and static fields — and they differ in where they live, when they get a default, and how long they last. This lesson also covers `final`, the difference between a constant and a merely-final variable, and the `var` keyword that Java 10 added.

## Declaring and initialising

```java
int count;              // declared, not initialised
int total = 0;          // declared and initialised
int a = 1, b = 2, c;    // several in one statement — legal, discouraged
final double TAX = 0.18;
```

The type comes first, then the name, then optionally `= value`. The type is fixed for the variable's life: `count = "seven";` is a compile error. You can declare a variable anywhere a statement can appear, and the style since Java 1.0 has been to declare each variable as close as possible to its first use, not at the top of the method.

## The four kinds

| Kind | Declared | Lives | Default value? | Lifetime |
| --- | --- | --- | --- | --- |
| **Local** | inside a method/block | the thread's stack frame | **no** — must assign before read | until the block ends |
| **Parameter** | in a method signature | the stack frame | assigned by the caller | the call |
| **Instance field** | in a class, no `static` | inside each object on the heap | yes (0 / false / null) | the object's life |
| **Static field** | in a class, `static` | once per class, in the method area | yes | the class's life (the JVM's) |

```java
public class Counter {
    private static int created = 0;   // static field: one for the class
    private int value;                // instance field: one per Counter, starts at 0

    public void increment(int by) {   // parameter
        int next = value + by;        // local
        value = next;
        created++;
    }
}
```

## Definite assignment

The compiler proves that every local variable is assigned on every path before it is read:

```java
int x;
if (flag) x = 1;
System.out.println(x);     // error: variable x might not have been initialized
```

Add an `else` or an initial value. This is not paranoia: uninitialised memory reads are a top source of C bugs, and Java removes the whole class of them at compile time. The rule is called *definite assignment* and it is flow-sensitive — the compiler tracks branches and loops.

## `final`: assign exactly once

```java
final int limit = 10;
limit = 11;                 // error: cannot assign a value to final variable

final List<String> names = new ArrayList<>();
names.add("Ada");           // fine! the *reference* is final, the object is not
```

`final` on a variable means the variable is assigned once. It says **nothing** about the object it refers to. A `final List` can still be added to; a `final int[]` can still have elements changed. Immutability of the *object* is a property of the class (Module 7), not of the variable.

A blank final can be assigned later, once, as long as definite assignment can prove it:

```java
final int sign;
if (n < 0) sign = -1; else sign = 1;
```

Marking locals and parameters `final` is a style some teams use; the compiler does not care, except in one place: a local captured by a lambda or anonymous class must be *effectively final* (Module 11).

## Constants

A **constant** is a `static final` field with a compile-time constant value:

```java
public static final int MAX_RETRIES = 3;
public static final String GREETING = "Hello";
```

Naming: UPPER_SNAKE_CASE. Two technical consequences:

1. The compiler **inlines** constant values into every class that uses them. If `Config.MAX_RETRIES` is a constant and you change it in `Config` without recompiling the classes that use it, they keep the old value. This is real and bites in libraries.
2. A `static final` whose value is not a compile-time constant (`static final List<String> NAMES = List.of(...)`) is not inlined; it is initialised once when the class loads.

`Math.PI`, `Integer.MAX_VALUE`, `Long.MIN_VALUE` are the constants you will use most.

## `var`: local type inference (Java 10+)

```java
var count = 0;                            // int
var names = new ArrayList<String>();      // ArrayList<String>
var reader = new BufferedReader(new InputStreamReader(System.in));
```

`var` tells the compiler to infer the type from the initialiser. It is **still static typing** — `count = "x"` is still an error — and it applies only to local variables with an initialiser (and `for` loop variables, and `try`-with-resources). Not allowed: fields, parameters, return types, `var x;` with no initialiser, `var x = null;`, or `var` with an array initialiser `{1, 2}`.

Use it when the type is obvious from the right-hand side (`new ArrayList<String>()`) or long and unhelpful. Avoid it when the type carries information: `var result = service.compute();` hides what `result` is. `var` is a *reserved type name*, not a keyword, so old code with a variable named `var` still compiles.

## Scope and shadowing

```java
int i = 0;
for (int i = 0; i < 3; i++) { }     // error: variable i is already defined
```

A local variable's scope is its block. You cannot declare a local that shadows another local in an enclosing block of the same method. You **can** shadow a field with a local or parameter — and it is the source of one of the most common beginner bugs:

```java
public class Point {
    private int x;
    public Point(int x) {
        x = x;          // assigns the parameter to itself; the field stays 0
    }
}
```

`this.x = x;` is the fix. IDEs warn about self-assignment; the compiler does not.

## Naming

Lower camel case, descriptive: `elapsedMillis`, `isEmpty`, `userCount`. Single letters are fine for loop indices (`i`, `j`) and mathematical variables (`x`, `n`). Never `$` or `_` alone (`_` is a keyword since Java 9). Constants upper snake. A variable's name should say what it holds; its type says what it can do.

## Key takeaways

- Locals have no default and must be definitely assigned before use; fields default to zero/false/null.
- `final` = assigned once. It freezes the variable, never the object.
- Constants (`static final` with a constant value) are inlined by the compiler.
- `var` infers a local's type from its initialiser; the type is still fixed and checked.
- Shadowing a field with a parameter is legal and a trap; `this.field = param`.
