---
title: Scope, lifetime and linkage
minutes: 14
---
Three different questions hide behind "where can I use this variable?": **scope** — in which region of the source the name is visible; **lifetime** — between which two moments the object exists; and **linkage** — whether the same name in two translation units refers to one entity or two. Beginners meet them tangled: a `static` local that remembers its value, a global that two files fight over, a function that returns a reference to something already gone. This lesson pulls the three apart, because each has its own rules and its own bugs.

## Block scope and shadowing

A name declared inside a block is visible from its declaration to the closing brace — and in nested blocks, unless an inner declaration **shadows** it:

```cpp
int x = 1;
{
    int x = 2;               // a new x; the outer one is hidden here
    std::cout << x << '\n';  // 2
}
std::cout << x << '\n';      // 1
```

Loop variables and `if`-with-initialiser variables have the scope of their statement. Shadowing is legal and occasionally intended, but a parameter shadowed by a local, or an outer `count` hidden by an inner one, is a bug waiting for a reader; `-Wshadow` reports every case.

## Lifetime: storage duration

| Storage duration | Examples | Lives from ... to |
| --- | --- | --- |
| automatic | locals, parameters | its declaration ... the end of its block |
| static | globals, namespace-scope variables, function-local `static`, string literals | before `main` (or first use) ... program exit |
| thread | `thread_local` variables | thread start ... thread end (Module 17) |
| dynamic | what `new` creates; a container's elements | `new` ... `delete` (Module 7) |

An automatic object is destroyed at its closing brace, in reverse order of declaration. Nothing about it survives — which is the rule behind the most important bug in this lesson.

## Function-local `static`

```cpp
int nextId() {
    static int counter = 0;      // initialised once, the first time control reaches this line
    return ++counter;
}

nextId();  nextId();
std::cout << nextId() << '\n';   // 3
```

The variable has **static** storage duration — it lives for the whole program — but **function** scope: nothing outside `nextId` can name it. The initialiser runs once, the first time execution reaches it, and C++11 guarantees that first run is thread-safe. It is the honest way to write a counter, an id generator or a lazily built lookup table without a global.

The cost is hidden state: the function returns different results for the same arguments, cannot be reset between tests, and is shared by every caller in the process. Use it for genuinely program-wide facts; for anything a caller might want two of, pass the state in or make it a class (Module 8).

## Globals, and why to avoid them

A variable at namespace scope — outside every function — also has static storage duration:

```cpp
int g_requests = 0;          // a global

void handle() { ++g_requests; }
```

Every function can read and write it, which is exactly the problem: reasoning about `handle()` now requires knowing every other function that touches `g_requests`, testing it requires resetting global state, and running it on two threads is a data race. Globals also initialise before `main` in an order that is unspecified *across* translation units — a global whose initialiser reads a global in another file is the "static initialisation order fiasco", and it fails only on some builds.

Constants are the exception: `constexpr double kGravity = 9.81;` at namespace scope is a global with no state. For everything else, pass parameters and return values; state that several functions share belongs in an object they are handed.

## Linkage: internal and external

A name with **external linkage** denotes the same entity in every translation unit; the linker matches them up. Functions and non-`const` globals have it by default, so two files that each define `int helper()` collide at link time — "multiple definition of `helper()`" — even if the bodies are identical. A name with **internal linkage** is private to its translation unit. Two ways to give it:

```cpp
// util.cpp
static int parsePositive(const std::string& s);   // C-style: static at namespace scope

namespace {                                       // C++ style: an anonymous namespace
    int callCount = 0;
    int parseDigits(const std::string& s) { return static_cast<int>(s.size()); }
}
```

Everything inside an anonymous namespace has internal linkage; another file may define its own `parseDigits` without conflict, and helpers that are not part of a file's interface belong there. `const` and `constexpr` variables at namespace scope are internal by default in C++ (unlike C), which is why a header of `constexpr` constants causes no multiple-definition errors.

To *use* a global defined in another file, declare it with `extern`:

```cpp
// counters.cpp
int g_requests = 0;          // the definition — exactly one across the program

// server.cpp
extern int g_requests;       // a declaration: "defined elsewhere"
```

`extern` says "this exists; do not create it here". Without it the second line would be a second definition.

## `inline` functions and variables

`inline` no longer means "please inline this call" — the optimiser decides that on its own. It means: this definition may appear in several translation units, provided they are identical, and the linker keeps one — the exemption from the one-definition rule a function defined in a header needs, since every file that includes the header gets the definition. C++17 extended it to variables:

```cpp
// config.h
inline constexpr int kMaxRetries = 3;      // one object shared by every includer
inline int roundUp(int n, int step) { return (n + step - 1) / step * step; }
```

Module 8, lesson 6 covers the header/source split this enables.

## Dangling: what lifetime means for a reference

A reference or pointer is only as alive as the object it names. When the object's lifetime ends, the reference **dangles**, and using it is undefined behaviour — often it prints the right thing in a debug build and garbage under `-O2`:

```cpp
const std::string& makeName() {
    std::string s = "temp";
    return s;                // s is destroyed on the next line; the caller receives a name for a corpse
}
```

`-Wall` reports `reference to local variable 's' returned`. The fix is to return by value — Lesson 2 showed it is free. The same rule governs a lambda that captured a local by reference and outlived it (Lesson 5) and a reference into a `std::vector` after a `push_back` reallocated it (Module 6, lesson 4); a pointer to a `static` local is *fine*, because static lifetime ends only at exit.

## The three meanings of `static`

| Where | Meaning |
| --- | --- |
| inside a function | static storage duration — one instance, initialised once, lives to exit |
| at namespace scope | internal linkage — private to this translation unit |
| inside a class | a member shared by every object of the class (Module 8, lesson 4) |

The keyword was reused rather than invented three times; read it by where it appears.

## Pitfalls

- **Expecting a function-local `static` to reset.** It never does; the second call sees what the first left.
- **A parameter shadowed by a local of the same name.** Legal, wrong, invisible without `-Wshadow`.
- **The same helper defined in two `.cpp` files.** Linker error; put helpers in anonymous namespaces.
- **Returning a reference or pointer to a local.** Undefined behaviour; return by value.
- **`static` in a header at namespace scope.** Every includer gets its own private copy — usually not what was meant; `inline` is.

## Key takeaways

- Scope is where a name is visible; lifetime is when the object exists; linkage is whether two files share the entity.
- A function-local `static` is initialised once and lives to program exit; it is a counter or a cache, not a way to pass state.
- Globals hide dependencies, break tests and race across threads; constants are the acceptable ones.
- Internal linkage (anonymous namespace or `static`) keeps helpers private to a translation unit; `extern` declares a global defined elsewhere; `inline` lets a header define a function or variable once for all includers.
- A reference outlives nothing: a returned reference to a local, a captured local, or an element of a reallocated vector is dangling.
