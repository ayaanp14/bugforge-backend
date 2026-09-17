---
title: RTTI and the vtable — how dispatch works and when to ask an object its type
minutes: 15
---
`virtual` is a promise the compiler keeps with a data structure. Knowing what it is — a table of function pointers per class and one hidden pointer per object — explains the cost of a virtual call, why a constructor's virtual calls stay in the base, and what `dynamic_cast` and `typeid` have to work with. This lesson opens that box, then covers run-time type information: casting a base pointer down safely, why the reference form throws, what `typeid` reports and must never be used to print, and the design signal a pile of `dynamic_cast`s sends. It closes with `std::variant` and `std::visit`, the alternative for a fixed set of types.

## The vtable and the vptr

The standard says only that a virtual call resolves to the dynamic type's override. Every mainstream compiler implements it the same way, and on this platform (the Itanium C++ ABI that GCC and Clang share on Linux) the layout is fixed:

- Each class with at least one virtual function gets one **vtable** — a static array of function pointers, one slot per virtual function in declaration order, filled with the addresses of *that class's* final overriders. A derived class's vtable begins with the base's slots (overridden ones replaced) and appends any new virtual functions.
- Each object of such a class carries a hidden **vptr** as its first member, pointing at its class's vtable. On this platform a vptr adds 8 bytes to every object — an `int` wrapper with one virtual function is 16 bytes, not 4.
- A virtual call `v.describe()` compiles to: load the vptr from the object, load the `describe` slot from the vtable, call through it. One indirect call.

```cpp
struct Vehicle { virtual std::string describe() const; virtual ~Vehicle(); };
struct Car : Vehicle { std::string describe() const override; };

// vtable for Vehicle: [ &Vehicle::describe, &Vehicle::~Vehicle ]
// vtable for Car:     [ &Car::describe,     &Car::~Car         ]
// v.describe()  becomes  (*(v.vptr[0]))(&v)
```

Two consequences follow. The cost of a virtual call is the indirection plus the fact that the compiler, not knowing the target, cannot inline it — a few nanoseconds, noticeable only in the innermost loop of something hot. And the constructor rule from lesson 2 has a mechanism: each constructor sets the vptr to *its own* class's vtable before running its body, so during `Vehicle`'s constructor a virtual call finds `Vehicle::describe`; `Car`'s constructor then repoints it. Destructors do the same in reverse. The vtable also holds a pointer to the class's type information, which is what the rest of this lesson uses.

## dynamic_cast

An upcast — `Derived*` to `Base*` — is implicit and always valid. A downcast goes the other way and may be wrong, because a `Base*` may point at any derived type or at a plain `Base`. `dynamic_cast` checks at run time:

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <typeinfo>

struct Node { virtual ~Node() = default; };
struct Text : Node { std::string words; };
struct Image : Node { int w = 0, h = 0; };

void inspect(const Node& n) {
    if (const auto* t = dynamic_cast<const Text*>(&n)) {
        std::cout << "text with " << t->words.size() << " chars\n";
    } else if (const auto* i = dynamic_cast<const Image*>(&n)) {
        std::cout << "image " << i->w << 'x' << i->h << '\n';
    } else {
        std::cout << "some other node\n";
    }
}
```

On a pointer, `dynamic_cast<T*>(p)` yields `p` converted to `T*` when the object really is a `T` (or something derived from `T`), and **`nullptr`** otherwise; the `if (auto* t = …)` shape tests and binds in one line. On a reference there is no null reference to return, so `dynamic_cast<T&>(r)` **throws `std::bad_cast`** on failure — use it when a failure is a bug the caller cannot handle, and the pointer form when either outcome is expected. Both require the source type to be *polymorphic* — at least one virtual function — because the check reads the vtable; on a class without one the cast is a compile error (`source type is not polymorphic`). The check walks the type-information graph and costs more than a virtual call, and it is the one cast that can cross a hierarchy sideways, from one interface to another the same object implements.

`static_cast<Derived*>(basePtr)` performs the same conversion with no check: fast, and undefined behaviour when the object is not a `Derived`. Use it only where the type is already known — right after a `dynamic_cast` that succeeded, or in a closed piece of code that created the object a line earlier.

## typeid

`typeid(expr)` yields a `const std::type_info&` (header `<typeinfo>`) describing the *dynamic* type when the expression is a polymorphic class type, and the static type otherwise:

```cpp
std::unique_ptr<Node> n = std::make_unique<Image>();
std::cout << (typeid(*n) == typeid(Image)) << '\n';     // 1
std::cout << (typeid(n) == typeid(Image)) << '\n';      // 0: the static type of n is unique_ptr<Node>
```

`type_info` objects compare with `==` and can key a map through `std::type_index`. They also carry a `name()`, and that string is the one thing not to print: it is implementation-specific and on this platform mangled — `5Image`, `St6vectorIiSaIiEE` — so any output that includes it is unportable and, for a judge, wrong. Print your own tag from a virtual `name()` function instead. `typeid` is rarer than `dynamic_cast` in application code; its natural home is an exact-type check such as "these two objects are the same concrete type" inside an `operator==`.

The two facilities together are *run-time type information* (RTTI). Some code bases compile with `-fno-rtti` to save the type-info tables — game engines, embedded targets — and there `dynamic_cast` and `typeid` are unavailable. The study judge has RTTI on.

## The smell

```cpp
double area(const Shape& s) {
    if (auto* c = dynamic_cast<const Circle*>(&s)) return 3.14159 * c->r * c->r;
    if (auto* r = dynamic_cast<const Rect*>(&s)) return r->w * r->h;
    return 0;
}
```

This works and is wrong. Every new shape requires finding and editing this function — and every other function shaped like it — and forgetting one produces a silent `0`. The chain is a virtual function that has not been written: `virtual double area() const = 0;` puts each formula next to its representation and makes the compiler enforce that new shapes supply one. Tell the object what to do; do not ask it what it is. The legitimate uses of `dynamic_cast` are narrow: a genuinely optional capability (`if (auto* r = dynamic_cast<Resizable*>(w)) r->resize();`), a single special case at a system boundary, or a census over a closed set where adding an `isImage()` to the interface would be worse than the cast.

## The closed-set alternative: std::variant

When the set of types is fixed and known up front, C++17 offers a different tool:

```cpp
#include <variant>

struct Circle { double r; double area() const { return 3.14159 * r * r; } };
struct Rect   { double w, h; double area() const { return w * h; } };
using Shape = std::variant<Circle, Rect>;

double area(const Shape& s) {
    return std::visit([](const auto& shape) { return shape.area(); }, s);
}
```

A `std::variant<Circle, Rect>` holds exactly one of its alternatives, by value — no base class, no vptr, no heap, and `std::vector<Shape>` is a plain contiguous vector. `std::visit` calls the function with whichever alternative is present; a generic lambda covers every alternative that shares a member name, and a visitor with one overload per type is checked at compile time for completeness — leaving a type out is an error, not a silent `0`. `std::holds_alternative<Circle>(s)` and `s.index()` ask the type question directly, which is fine here because the set is closed by construction.

| | Virtual functions | `std::variant` + `std::visit` |
| --- | --- | --- |
| Set of types | Open: anyone can derive | Closed: listed in the type |
| Set of operations | Fixed by the base interface | Open: any visitor |
| Storage | Heap objects behind pointers | Values, inline |
| Adding a type | Write a class; nothing else changes | Edit the variant and every visitor |
| Adding an operation | Edit every class | Write one visitor |

Choose by which axis is open. A plugin system needs virtual functions; an expression tree with five node kinds and thirty passes over them is a variant. Module 15, lesson 4 covers `variant` in full.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `dynamic_cast` on a class with no virtual functions | Compile error; give the base a virtual destructor. |
| Ignoring the null from a pointer `dynamic_cast` | Null dereference — undefined behaviour. |
| `dynamic_cast<T&>` where failure is possible and uncaught | `std::bad_cast` propagates and terminates the program. |
| Printing `typeid(x).name()` | Mangled, compiler-specific text. |
| A chain of casts where a virtual function belongs | Every new type breaks it silently. |
| `static_cast` down to the wrong type | No check; undefined behaviour. |

## Key takeaways

- A virtual call is one indirect call through the class's vtable; each polymorphic object carries a vptr (8 bytes on this platform) that constructors set stage by stage.
- `dynamic_cast<T*>` returns `nullptr` on failure; `dynamic_cast<T&>` throws `std::bad_cast`; both need a polymorphic source type.
- `typeid(*p)` names the dynamic type; compare `type_info` objects, never print `name()`.
- A chain of `dynamic_cast`s is a virtual function waiting to be written; keep casts for optional capabilities and closed-set censuses.
- `std::variant` + `std::visit` is the value-semantics alternative for a closed set of types with open operations.
