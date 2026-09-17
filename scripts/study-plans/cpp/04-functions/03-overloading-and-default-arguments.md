---
title: Overloading and default arguments
minutes: 13
---
Two functions may share a name if their parameter lists differ; a parameter may have a value the caller can leave out. Both features exist to make call sites read naturally — `area(4)`, `area(3, 5)`, `frame("hi")` — and both have rules that surprise people who have only seen them work. This lesson settles how the compiler picks an overload (and when it refuses to), the string and pointer cases that pick the wrong one, where a default argument may be written, and when each feature is the clearer choice.

## What overloading is

```cpp
long long area(long long side);                     // a square
long long area(long long width, long long height);  // a rectangle
double area(double radius);                         // a circle
```

Three functions, one name, told apart by their **signatures** — the parameter count and types. The return type plays no part: `int f()` and `double f()` in the same scope is an error, "ambiguating new declaration", because a call `f();` could not choose between them.

Overloading exists so that one *idea* gets one name. `std::to_string` has nine overloads, `std::abs` has one per numeric type, `std::sort` has two — with and without a comparator. A good overload set does the same thing for every parameter list; a set whose members do different things is a naming problem dressed as a language feature.

## How the compiler chooses

At a call, the compiler collects every function with that name that is visible (the **candidates**), discards the ones the arguments cannot be converted to (leaving the **viable** ones), and ranks the survivors by how good the conversion for each argument is:

1. **Exact match** — the argument's type, or a trivial adjustment (adding `const` to what a reference names, array to pointer).
2. **Promotion** — `char`, `short`, `bool` and small enums to `int`; `float` to `double`.
3. **Standard conversion** — any other built-in conversion: `int` to `double`, `double` to `int`, `long` to `int`, integer to `bool`, a pointer to `bool`, `nullptr` to a pointer.
4. **User-defined conversion** — a constructor or conversion operator, such as `const char*` to `std::string`.

The best viable function must be strictly better on at least one argument and no worse on the rest. If two tie, the call is **ambiguous** and does not compile — the compiler will not guess.

```cpp
void f(int);
void f(double);

f(3);      // int: exact
f(3.0);    // double: exact
f(3.0f);   // double: float to double is a promotion, float to int a conversion
f('a');    // int: char to int is a promotion
f(3L);     // error: long to int and long to double are both conversions — ambiguous
```

The last line is the one to remember. With the `area` set above, `area(4)` is ambiguous for the same reason: `int` to `long long` and `int` to `double` are both standard conversions of the same rank. Give the variable the exact type (`long long side = 4;`) or add an `int` overload, but do not rely on the compiler "obviously" preferring the integer one — it does not.

## The string and pointer traps

```cpp
void show(const std::string& s);
void show(bool b);

show("hello");     // calls show(bool)
```

`"hello"` is a `const char[6]`. Decaying to `const char*` and then to `bool` is a *standard* conversion; building a `std::string` is a *user-defined* one; the standard conversion wins. The cure is an overload that is exact for a literal — `void show(const char* s)` — or a `std::string_view` parameter, which a literal converts to cheaply (Module 5, lesson 6). The same rank rule makes `f(0)` prefer `f(int)` over `f(const char*)`, and it is why `nullptr` exists: `nullptr` converts to any pointer and never to an integer, so `f(nullptr)` picks the pointer overload unambiguously where `f(NULL)` could not.

Signed and unsigned bite the same way: with `g(int)` and `g(unsigned)`, `g(v.size())` passes an `unsigned long`, whose conversions to `unsigned` and to `int` rank equally — ambiguous. Keep overload sets small and their parameter types far apart.

## Default arguments

```cpp
std::string frame(const std::string& text, char border = '*', int padding = 1);

frame("hi");            // * hi *
frame("hi", '#');       // # hi #
frame("hi", '#', 3);    // ### hi ###
```

A default is a value the compiler inserts at the call when the argument is missing. The rules:

- **Trailing only.** Once a parameter has a default, every parameter after it must have one. `f(int a = 1, int b)` is an error, and there is no way to "skip" the middle argument at a call.
- **Specified once, on the first declaration the caller sees.** Write it on the prototype; write the definition *without* it. Repeating it on the definition is an error ("default argument given for parameter 2 after previous specification"), and putting it only on a definition that comes after the calls means the calls never saw it.
- **Evaluated at each call, in the caller's scope.** A default may be an expression — `int retries = maxRetries()` — and it is re-evaluated every time it is used.
- **Bound at compile time by the static type.** With virtual functions (Module 10, lesson 2) the default from the *base* declaration is used even when the derived override runs — one of the reasons to keep defaults out of virtual functions.

A default is not part of the signature. `frame(const std::string&, char, int)` is the one function whether the caller supplied one, two or three arguments.

## Overloading versus defaults

Use a **default** when the parameter is genuinely optional and the behaviour with and without it is the same function: a separator, a padding width, a log level. Use **overloads** when the parameter *types* differ, when the behaviours differ enough that one body would be full of `if (hasValue)`, or when the "optional" argument changes the return type.

```cpp
void log(const std::string& msg, int level = 1);               // one function, one behaviour
std::string describe(int v);
std::string describe(double v);                                // overloads: the type is the difference
```

When both would work, the default is simpler — one definition, one place to maintain — and the overload is more flexible. The wrong choice is neither; it is a single function with a flag parameter whose two halves share nothing.

## What counts as a different signature

| Differs in | Makes an overload? |
| --- | --- |
| number of parameters | yes |
| parameter types (`int` vs `double`, `int&` vs `int`) | yes |
| `const` on what a pointer or reference names (`const T&` vs `T&`) | yes |
| return type | no — error |
| parameter names | no — same function |
| top-level `const` on a by-value parameter (`int` vs `const int`) | no — same function |
| default arguments | no — same function |

## Pitfalls

- **Ambiguity you did not expect.** Mixed integer widths and mixed integer/floating overloads are the usual cause; the fix is an exact-type variable or an added overload, not a cast at every call.
- **`show("literal")` reaching a `bool` overload.** Add a `const char*` overload or take `std::string_view`.
- **Default on the definition, prototype without it.** Legal only if no call comes before the definition — and the day someone reorders the file, the calls stop compiling.
- **Overloads differing only in top-level `const`.** `void f(int)` and `void f(const int)` are a redefinition error, not two functions.

## Key takeaways

- Overloads share a name and differ in parameter count or types; the return type never distinguishes them.
- Resolution ranks exact match, promotion, standard conversion, then user-defined conversion; a tie is a compile error, and `int` versus `long long`/`double` overloads tie constantly.
- A string literal is a pointer: it prefers `bool` over `std::string`. Use `nullptr`, not `0`, for pointer overloads.
- Default arguments are trailing, written once on the first declaration, and evaluated at every call.
- Defaults for an optional value of the same kind; overloads when the types or behaviours differ.
