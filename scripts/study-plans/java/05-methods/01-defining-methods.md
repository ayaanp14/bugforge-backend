---
title: Defining and calling methods
minutes: 13
---
A method is a named block of code with inputs and, optionally, an output. Every line of Java you run lives in one. This lesson covers the anatomy of a method declaration, the difference between `static` and instance methods (the single most common compile error for beginners), how calls work, and the conventions that make a method good rather than merely legal.

## Anatomy

```java
public static long factorial(int n) {
    long result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}
```

| Part | Here | Meaning |
| --- | --- | --- |
| Access modifier | `public` | Who may call it (`public`, `protected`, package-private, `private`) |
| `static` | `static` | Belongs to the class, not to an object |
| Return type | `long` | The type of the value handed back; `void` for none |
| Name | `factorial` | lowerCamelCase, a verb or verb phrase |
| Parameters | `(int n)` | Typed, comma-separated; the *formal* parameters |
| Body | `{ … }` | Statements; a non-`void` method must `return` a value on every path |

The **signature** is the name plus the parameter types — `factorial(int)`. The return type and parameter *names* are not part of it, which matters for overloading (lesson 3). Two methods in one class cannot have the same signature.

Optional extras: `throws IOException` after the parameters (Module 12), type parameters `<T>` before the return type (Module 13), `final`/`abstract`/`synchronized` modifiers (later modules), and annotations like `@Override` above.

## Calling

```java
long f = factorial(5);              // same class, static: just the name
long g = Main.factorial(5);         // qualified with the class
int len = "hello".length();         // instance method: on an object
double r = Math.sqrt(2.0);          // static method of another class
```

The *arguments* (`5`) are evaluated left to right and copied into the parameters. A call to a non-`void` method is an expression with a value; you may ignore the value (`list.add(x);` returns a `boolean` nobody reads), which is fine for methods with side effects and a bug for pure ones (`s.trim();`).

## `static` versus instance

```java
public class Counter {
    private int count;                        // instance field

    public void increment() { count++; }      // instance method: needs a Counter
    public int get() { return count; }

    public static Counter zero() { return new Counter(); }   // static: no Counter needed
}

Counter c = Counter.zero();    // static call on the class
c.increment();                 // instance call on an object
c.get();                       // 1
```

A **static** method belongs to the class. It has no `this`, so it cannot touch instance fields or call instance methods without an object. An **instance** method runs against a particular object (`c`), whose fields it reads through `this`. The error every beginner meets:

```
error: non-static method increment() cannot be referenced from a static context
```

means you called an instance method from `main` (which is static) without an object. Either create an object (`new Counter().increment()`), or make the method static if it does not use instance state. Utility methods that only transform their arguments — `Math.max`, `Integer.parseInt`, your `isPalindrome(String)` — should be static. Behaviour that depends on an object's state should be an instance method on that object (Module 7).

## Return

```java
static int sign(int x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;                 // without this line: "missing return statement"
}

static void log(String msg) {
    if (msg == null) return;  // void methods may return early with a bare return
    System.out.println(msg);
}
```

A non-`void` method must return on every path; the compiler checks. `return` ends the method immediately — code after it in the same block is unreachable. A method returns exactly one value; to return two, return an object (a record — Module 10 — or a small class), an array, or design it as two methods.

## Parameters

Parameters are local variables initialised by the caller. Reassigning a parameter inside the method is legal (`n = n * 2`) but changes only the local copy — the caller's variable is untouched (next lesson). Declaring parameters `final` documents that you will not reassign them.

A method with no parameters still needs the parentheses: `int size()`. Calling it also needs them: `list.size()`, not `list.size` (that would be a field access).

## Naming and size

- Verbs for actions (`compute`, `send`, `parse`), `is`/`has`/`can` for booleans, `get`/`set` for accessors, `to` for conversions (`toString`, `toList`).
- One job per method. If you need "and" to describe it, split it.
- Short: a method that fits on a screen is one a reviewer can hold in their head. Extract helpers freely — a call costs nothing after the JIT inlines it.
- Parameters: three or fewer is comfortable; more suggests a parameter object.

## Methods that call methods

```java
static boolean isValid(String input) {
    return isNonEmpty(input) && isNumeric(input) && inRange(Integer.parseInt(input));
}
```

Composition is the point. Small, well-named methods make the top-level one read like a sentence, and each helper can be tested alone. In interviews, writing `isValid` first and filling in helpers after is a strong way to structure a solution.

## The call stack

Each call pushes a **frame** holding the method's parameters and locals; `return` pops it. Frames live on the thread's stack, which is why locals vanish when a method ends and why deep recursion overflows it (lesson 5). A stack trace (`at Main.factorial(Main.java:12)`) is a printout of these frames, innermost first — read the top lines to find where an exception was thrown, then down to see who called it.

## Interview angle

- *"What is a method signature?"* Name plus parameter types — not the return type.
- *"Can a static method access an instance variable?"* Not without an object reference; there is no `this`.
- *"Why is `main` static?"* The JVM calls it before any object of the class exists.
- *"Can you return multiple values?"* Not directly — return a record/object/array.

## Key takeaways

- A method is `modifiers returnType name(params) { body }`; its signature is name + parameter types.
- `static` = belongs to the class, no `this`; instance = runs on an object. "Non-static from static context" means you forgot the object.
- Non-void methods return on every path; `return` ends the method.
- Small, verb-named, single-purpose methods composed together.
