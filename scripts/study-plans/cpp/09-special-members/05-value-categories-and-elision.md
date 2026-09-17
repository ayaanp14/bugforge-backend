---
title: Value categories, temporaries and copy elision
minutes: 15
---
Every C++ expression has a type and a **value category**, and the category is what decides whether an initialisation copies, moves or does neither. The three categories have unlovely names — lvalue, prvalue, xvalue — but the ideas behind them are plain: does the expression name an object that persists, is it a pure value that has not been given a home yet, or is it an object whose contents may be taken? This lesson gives the taxonomy in those terms, explains when a temporary is created and when it dies, states the C++17 guarantee that a prvalue initialises its target with no copy at all, and settles the two return-statement questions every C++ interviewer asks.

## Three categories in plain terms

| Category | Meaning | Examples |
| --- | --- | --- |
| **lvalue** | names an object that outlives the expression | `a`, `*p`, `v[i]`, `s.name`, a call returning `T&` |
| **prvalue** | a pure value with no object yet | `42`, `a + b`, `Probe(3)`, a call returning `T` |
| **xvalue** | an object whose contents may be reused | `std::move(a)`, a call returning `T&&`, `Probe(3).value` |

Two groupings matter. An lvalue or xvalue has *identity* — it refers to an actual object — so together they are **glvalues**. A prvalue or xvalue may be *moved from*, so together they are **rvalues**. When lesson 3 said `T&&` binds to rvalues, it meant both kinds: a temporary from a prvalue, or an lvalue that `std::move` has turned into an xvalue.

The category is a property of the *expression*, not the variable. `Probe&& r = std::move(a);` declares `r` as an rvalue reference, but the expression `r` is an lvalue — it has a name — so `Probe b = r;` copies. That is why a forwarding function has to write `std::move(r)` again.

## Which reference binds to which

```cpp
void f(Probe& p);         // lvalues only
void g(const Probe& p);   // anything
void h(Probe&& p);        // rvalues only

Probe a(1);
f(a);  g(a);  h(std::move(a));   // h(a) does not compile: a is an lvalue
g(Probe(2));  h(Probe(2));       // f(Probe(2)) does not compile: a temporary is not an lvalue
```

With `g` and `h` both present, an rvalue argument picks `h` — the more specific match — which is how the copy constructor and move constructor are chosen. With only `g` present, an rvalue argument binds to `const Probe&` and is copied. That last case is what "declaring a copy suppresses the move" from lesson 4 looks like at the call site.

## Temporaries and their lifetime

A prvalue becomes an object — is **materialised** into a temporary — only when something needs an object: binding it to a reference, calling a member function on it, passing it to a by-reference parameter. The temporary lives until the end of the **full-expression** that created it, usually the semicolon:

```cpp
std::size_t n = (std::string("hello") + " world").size();   // the temporary string dies at the ;
```

Binding a temporary directly to a `const T&` or `T&&` local extends its lifetime to the reference's:

```cpp
const std::string& greeting = makeGreeting();   // the temporary lives as long as greeting
std::string&& owned = makeGreeting();           // same, and owned may be modified
```

Extension applies only to the direct binding. A reference obtained *through* the temporary — `const std::string& first = makePair().first;` extends, but `const char* p = makeGreeting().c_str();` leaves `p` dangling the moment the statement ends. Module 5, lesson 6 showed the same trap with `std::string_view`.

## Guaranteed copy elision

Since C++17, initialising an object from a prvalue of the same type does not copy and does not move: the prvalue's value is constructed **directly in the target**. There is no temporary to elide, which is why the standard calls this "unmaterialised value passing" rather than an optimisation.

```cpp
Probe make(int v) { return Probe(v); }       // prvalue returned

Probe a = Probe(1);        // construct #1 — one event, no copy, no move
Probe b = make(2);         // construct #2 — the object is built in b
take(Probe(3));            // construct #3 — built in the parameter
Probe c = flag ? Probe(4) : Probe(5);       // both arms are prvalues: still one construct
```

Because no copy or move is *performed*, none is *required*: a factory `static Widget create() { return Widget(...); }` works for a type whose copy and move constructors are deleted. This is what makes returning by value the right default — the call `make(2)` costs exactly one construction wherever its result ends up.

## Named return value optimisation

`return Probe(v);` is a prvalue and always elides. `return local;` is different: `local` is an lvalue with a name, and the compiler is *permitted*, not required, to build it directly in the caller's object. This is **NRVO**, named return value optimisation. Every major compiler does it whenever the function has one local that every `return` statement returns; it cannot when different paths return different locals, when the returned object is a parameter, or when the returned expression is not plain `local`.

When NRVO does not happen, the fallback is still not a copy. A `return` statement that names a local variable (or a by-value parameter) treats it as an rvalue first — **implicit move** — so the return object is move-constructed from it. Returning a parameter is the fully deterministic case: NRVO is never applied to parameters, so `Probe pass(Probe p) { return p; }` always performs exactly one move construction. In a trace, that shows as one `move` event; `return Probe(v)` shows none.

## Two rules for `return`

| You write | What happens | Verdict |
| --- | --- | --- |
| `return local;` | NRVO (usually), else implicit move | right |
| `return Probe(v);` | guaranteed elision | right |
| `return std::move(local);` | NRVO disabled; a move always | pessimisation; GCC and Clang warn with `-Wpessimizing-move` |
| `return std::move(param);` | one move, same as `return param;` | redundant; `-Wredundant-move` |
| `const Probe& f() { Probe p; return p; }` | reference to a destroyed local | undefined behaviour |

The pessimisation is the most common misuse of `std::move` in real code. `std::move(local)` is an xvalue, not a name, so it no longer qualifies for NRVO; the compiler must do the move it was previously allowed to skip. Return by value, return the name, and let the compiler choose.

## `std::move` on a `const` object copies

```cpp
const Probe k(7);
Probe m = std::move(k);       // copy #… from k: quietly
```

`std::move(k)` yields `const Probe&&`. The move constructor takes `Probe&&`, which cannot bind to a `const` object, so overload resolution falls through to `const Probe&` — the copy constructor. No error, no warning by default, just a copy where a move was intended. The same happens for a `const` *member*: a class with a `const std::string name;` can never move that member, so its generated move constructor copies it. The lesson is that `const` and moving are opposites, which is why a class's data members are almost never `const`.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `return std::move(local);` | Disables NRVO and forces a move |
| `const char* p = makeString().c_str();` | Dangling as soon as the statement ends |
| Treating a named `T&&` as an rvalue | It is an lvalue; the callee copies unless you `std::move` it again |
| `std::move` on a `const` object or member | Selects the copy constructor without a diagnostic |
| Assuming NRVO in a trace or a test | Permitted, not guaranteed; only prvalue elision and parameter returns are certain |
| Returning a reference to a local | Undefined behaviour; return by value instead |

## Key takeaways

- lvalue: has a name and persists; prvalue: a pure value not yet stored; xvalue: an object whose contents may be taken. Rvalues are prvalues and xvalues; `T&&` binds to those.
- A named rvalue reference is an lvalue; forwarding it on needs another `std::move`.
- A temporary dies at the end of its full-expression unless bound directly to a `const T&` or `T&&`, which extends it — not through a member function's return.
- C++17 guarantees that initialising from a prvalue of the same type performs no copy or move at all; return `T(...)` and the object is built in place.
- `return local;` gets NRVO or an implicit move; `return std::move(local);` gets only the move. Returning a by-value parameter is always exactly one move.
- `std::move` on a `const` object or member silently copies.
