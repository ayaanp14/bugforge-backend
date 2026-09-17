---
title: Structs and classes — a type of your own
minutes: 13
---
Everything so far has used types the language or the standard library defined. A `struct` or `class` is a type *you* define: a bundle of named members, the functions that operate on them, and — the part that separates C++ from Java — value semantics: a `Point` is a value like an `int`, held in the variable itself, copied on assignment, destroyed with its scope. This lesson settles the difference between `struct` and `class`, how member functions are declared and defined, what an aggregate is and how C++20's designated initialisers fill one in, and when a plain struct is the right design.

## Declaring a struct

```cpp
#include <iostream>

struct Point {
    int x = 0;      // default member initialiser
    int y = 0;
    int manhattan() const { return (x < 0 ? -x : x) + (y < 0 ? -y : y); }
};   // the semicolon is part of the definition

int main() {
    Point p{3, -4};
    Point q;                       // {0, 0} from the initialisers
    std::cout << p.manhattan() << ' ' << q.x << '\n';   // 7 0
    return 0;
}
```

A struct definition names the type and lists its **members** between the braces: data members (`x`, `y`) and member functions (`manhattan`). After the definition `Point` is a type like any other — you can declare variables of it, put it in a `std::vector<Point>`, pass it by `const Point&`, return it by value. The trailing semicolon is required, and its absence produces a confusing error on the *next* declaration in the file.

Access members with `.` on an object and `->` through a pointer (Module 6, lesson 2). Inside a member function the members are simply in scope: `manhattan` reads the `x` and `y` of whichever `Point` it was called on.

## struct versus class

```cpp
class Point {
    int x;          // private by default
public:
    int getX() const { return x; }
};

struct Point2 {
    int x;          // public by default
};
```

The two keywords define the same kind of thing. There are exactly two differences: members of a `struct` are `public` until an access specifier says otherwise, members of a `class` are `private`; and a base class (Module 10) is inherited publicly by default for a `struct` and privately for a `class`. That is all — a `class` can have public data and a `struct` can have private data and member functions, and the compiler treats them identically. The choice is a signal to readers. The convention across the community, and in this track: `struct` when every member is public and any combination of values is valid — a bundle of data; `class` when the type has an invariant to protect (lesson 5) and therefore private members behind a public interface. An access specifier (`public:`, `private:`, `protected:`) applies to everything after it until the next one, and a definition may switch sections as often as it likes; the usual order is the public interface first, because that is what readers want.

## Member functions inside and outside the class

A member function can be defined in the class body, or only *declared* there and defined later under the qualified name `Type::name`:

```cpp
struct Rect {
    int w;
    int h;
    int area() const;                          // declaration
    bool isSquare() const { return w == h; }   // definition inside: implicitly inline
};

int Rect::area() const {                       // definition outside, qualified
    return w * h;
}
```

`Rect::area` says "the `area` that belongs to `Rect`", and inside its body the members are in scope exactly as they were inside the class. The outside form is what the header/source split needs (lesson 6): the class with its declarations lives in the `.h`, the bodies in the `.cpp`. A function defined inside the class body is implicitly `inline` (Module 4, lesson 6), so a header holding it can be included from many files without breaking the one-definition rule. Short one-liners belong inside; anything with a loop belongs outside, where it does not clutter the interface a reader is scanning. The `const` after the parameter list is part of the signature and must appear on both the declaration and the definition; lesson 3 explains what it promises.

## Aggregates and designated initialisers

A struct with no user-declared constructors, no private or protected non-static data members, no virtual functions and no base classes is an **aggregate**, and it can be initialised member by member with braces, in declaration order:

```cpp
struct Config {
    std::string host = "localhost";
    int port = 8080;
    bool verbose = false;
};

Config a{"example.org", 443, true};      // positional
Config b{"example.org"};                 // port and verbose keep their defaults
Config c{.port = 9000, .verbose = true}; // C++20 designated initialisers
Config d{};                              // all defaults
```

Positional aggregate initialisation fills members in order and leaves the rest to their default member initialisers (or value-initialises them — zero — when there is none). C++20's **designated initialisers** name the member: `.port = 9000` is readable at the call site and immune to a reordering of the members before it. Two rules: designators must appear in declaration order (`{.verbose = true, .port = 9000}` is an error, not a reordering), and you cannot mix designated and positional values in one list. Brace initialisation also refuses narrowing (Module 2, lesson 4): `Config{"h", 3.5}` does not compile.

An aggregate can be returned with a bare brace list — `return {host, port, false};` — which is how a function hands back several named values without a `std::pair` whose `.first` says nothing (Module 4, lesson 2).

## Default member initialisers

```cpp
struct Counter {
    int count = 0;          // every Counter starts at 0
    std::string label{};    // empty string — explicit
    double ratio;           // indeterminate unless initialised!
};
```

A default member initialiser gives the member a value whenever no constructor or brace list provides one. Without it, a member of fundamental type is left **indeterminate** by a plain `Counter c;`, and reading it is undefined behaviour — the same rule as for locals (Module 2, lesson 1). Give every fundamental member an initialiser; `= 0` or `{}` costs nothing and turns a silent garbage value into a predictable zero. Members of class type such as `std::string` construct themselves and need no help.

## Objects are values

```cpp
Point a{1, 2};
Point b = a;      // b is a copy; two objects
b.x = 10;
std::cout << a.x << '\n';   // 1
```

A struct variable *is* the object, not a handle to one. Assignment copies every member (memberwise copy — Module 9), `==` is not provided until you ask for it (`bool operator==(const Point&) const = default;` in C++20 — Module 11), and a struct passed by value is copied, which is why anything bigger than a couple of words goes by `const&`. The layout in memory is the members in declaration order, possibly with padding between them (Module 19, lesson 3); `sizeof(Point)` is 8 on this platform for two `int`s.

## When a struct is the right choice

Use a plain struct when the type is *transparent*: any values the members can hold make sense together, there is nothing to enforce, and naming the fields is the whole point — a coordinate, a configuration, a record read from a file, a pair of results returned from a function. Adding member functions that compute from the fields (`manhattan`, `area`) keeps a struct a struct. The moment one member depends on another — a `size` that must match a buffer, a `denominator` that must not be zero, a `balance` that must never go negative — the members can disagree, and the design needs private data and a constructor: the subject of the next four lessons.

## Pitfalls

- **The vexing parse.** `Point p();` declares a *function* named `p` returning `Point`. Write `Point p;` or `Point p{};`.
- **Missing semicolon** after the closing brace: the error appears on the following declaration.
- **Uninitialised members**: `Point p;` with no default member initialisers holds garbage; `Point p{};` zeroes them.
- **Designated initialisers out of order** or mixed with positional values: a compile error, not a reordering.
- **Defining a member function outside the class without `Type::`**: you have written an unrelated free function, and the member is left undefined — a linker error when it is called.
- **Forgetting `const` on the outside definition** when the declaration has it: "no declaration matches".

## Key takeaways

- `struct` and `class` differ only in default access (and default inheritance); pick by intent — `struct` for transparent data, `class` for an invariant.
- Member functions are declared in the class and defined inside (implicitly inline) or outside with `Type::name`.
- An aggregate is initialised with braces in declaration order; C++20 designated initialisers name the members, in order, without mixing.
- Give every fundamental member a default member initialiser; an unset one is indeterminate.
- Objects are values: copying makes an independent object; pass by `const&`.
