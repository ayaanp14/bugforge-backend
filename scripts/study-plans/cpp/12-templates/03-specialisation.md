---
title: Specialisation — when one type needs its own version
minutes: 13
---
A template is a rule that applies to every type; a specialisation is the exception written next to it. `std::vector<bool>` packs bits where every other `std::vector<T>` stores elements, `std::hash<std::string>` hashes characters where the primary template has no body at all, and every `std::is_integral<T>` is a specialisation that says `true` for a handful of types. This lesson covers full specialisation (one exact type, such as `const char*` or `bool`), partial specialisation (a pattern, such as every pointer or every `std::pair<T, T>`), the traits style that the next lessons build on, and the reason a function template is overloaded rather than specialised.

## Full specialisation

```cpp
#include <iostream>
#include <string>

template <typename T>
struct Describe {                                   // the primary template
    static void print(const T& v) { std::cout << "[value] " << v << '\n'; }
};

template <>                                         // no parameters left to declare
struct Describe<bool> {
    static void print(bool v) { std::cout << "[bool] " << (v ? "true" : "false") << '\n'; }
};

template <>
struct Describe<const char*> {
    static void print(const char* v) { std::cout << "[C string] \"" << v << "\"\n"; }
};

template <>
struct Describe<std::string> {
    static void print(const std::string& v) { std::cout << "[string] \"" << v << "\"\n"; }
};
```

`template <>` with an empty parameter list followed by the name with its arguments filled in — `Describe<bool>` — declares an *explicit* (full) specialisation. When the compiler needs `Describe<bool>` it uses that class and never instantiates the primary for `bool`. The specialisation is a separate class: it inherits nothing from the primary, so if the primary has five members and the specialisation defines two, the other three do not exist for `bool`. Keep the interface the same on purpose; the compiler does not make you.

A specialisation must be declared before the first use that would instantiate the primary. Use `Describe<bool>` on line 10 and specialise it on line 30 and GCC stops with `specialization of 'Describe<bool>' after instantiation`. Headers put the specialisations right after the primary for this reason.

You can also specialise a single member instead of the whole class — `template <> void Describe<int>::print(const int& v) { … }` — which keeps every other member from the primary. It is the neater choice when only one function differs.

## Partial specialisation

A full specialisation names one type; a partial specialisation names a *pattern* and stays a template:

```cpp
#include <utility>
#include <vector>

template <typename T>
struct Describe<T*> {                               // every pointer type
    static void print(T* p) {
        std::cout << "[pointer to] ";
        if (p) Describe<T>::print(*p);
        else std::cout << "null\n";
    }
};

template <typename T>
struct Describe<std::vector<T>> {                   // every vector, of anything
    static void print(const std::vector<T>& v) {
        std::cout << "[vector of " << v.size() << "]\n";
        for (const T& item : v) Describe<T>::print(item);
    }
};

template <typename A, typename B>
struct Describe<std::pair<A, B>> {                  // any pair
    static void print(const std::pair<A, B>& p) { std::cout << "[pair]\n"; }
};

template <typename T>
struct Describe<std::pair<T, T>> {                  // both halves the same type
    static void print(const std::pair<T, T>& p) { std::cout << "[homogeneous pair]\n"; }
};
```

The parameter list after `template` is whatever is still free — `T` for pointers, `A` and `B` for a general pair — and the argument list after the name is the pattern to match. `Describe<int*>` matches `Describe<T*>` with `T = int`; `Describe<std::vector<std::string>>` matches the vector pattern and recurses into `Describe<std::string>`, which is the full specialisation above. Because the recursion goes through the template again, `Describe<std::vector<std::vector<int>>>` works with no further code.

When several partial specialisations match, the compiler picks the *most specialised* — the one whose pattern could be matched by the other but not the reverse. `std::pair<int, int>` matches both pair patterns; `pair<T, T>` is more specialised than `pair<A, B>` (every `pair<T, T>` is a `pair<A, B>`, not vice versa), so it wins. Two patterns where neither is more specialised make the use ambiguous and the compiler says so. The library uses this machinery in `std::unique_ptr<T[]>`, a partial specialisation for arrays that adds `operator[]` and calls `delete[]`.

## Traits: specialisation as a lookup table

```cpp
template <typename T> struct TypeName { static constexpr const char* value = "unknown"; };
template <> struct TypeName<int>         { static constexpr const char* value = "int"; };
template <> struct TypeName<double>      { static constexpr const char* value = "double"; };
template <> struct TypeName<std::string> { static constexpr const char* value = "std::string"; };

template <typename T>
constexpr const char* type_name_v = TypeName<T>::value;     // a variable template

std::cout << type_name_v<double> << '\n';                    // double
```

A *trait* is a class template whose members are compile-time facts about `T`, filled in by specialisation. The whole of `<type_traits>` (lesson 6) is this pattern: `std::is_integral<T>` derives from `std::false_type`, and specialisations for `int`, `long`, `char`, `bool` and their relatives derive from `std::true_type`; `std::is_pointer<T*>` is a partial specialisation. The `_v` variable template is the C++17 convenience so you write `std::is_integral_v<T>` instead of `std::is_integral<T>::value`.

Why a trait instead of `typeid(T).name()`? Because `name()` returns the *mangled* name — GCC and Clang print `i` for `int` and `PKc` for `const char*`, MSVC prints something else again — and it is never a string you want in output. A trait gives you the words you chose.

## Function templates: overload, do not specialise

A function template can be fully specialised, but never partially:

```cpp
template <typename T> void show(const T& v) { std::cout << v << '\n'; }

template <typename T> void show<std::vector<T>>(const std::vector<T>& v);   // error: function templates
                                                                            // do not partially specialise
template <typename T> void show(const std::vector<T>& v);                   // a second template: legal, an overload

template <> void show<const char*>(const char* const& v);     // legal full specialisation, but a trap
void show(const char* v);                                     // the overload: what you want
```

The trap is that a full specialisation does not take part in overload resolution. The compiler first picks the best *primary* template or non-template for the call; only if the chosen primary has a matching specialisation is that used. The classic demonstration: `template <class T> void f(T);` specialised as `template <> void f(int*);` and then a second template `template <class T> void f(T*);` added later. `f(p)` with an `int*` chooses the second primary, because `T*` is the better match, and the specialisation of the first is never considered. An ordinary overload `void f(int*)` would have won outright. Overloads are the tool for functions; specialisation is the tool for class templates.

## Where each tool fits

| Need | Tool |
| --- | --- |
| A different representation for one type (`std::vector<bool>`) | Full specialisation of the class |
| Extra members for a family of types (`unique_ptr<T[]>`) | Partial specialisation |
| A compile-time fact per type (`is_integral`, `TypeName`) | Trait: primary default plus specialisations |
| One function that treats one type differently | A non-template overload |
| A few lines that differ inside one body | `if constexpr` (lesson 6) |
| "Only types that can do X" | A concept (lesson 5) |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Specialising after the first use | `specialization … after instantiation` error. |
| Expecting the full specialisation to keep the primary's members | It has only what it declares. |
| `template <typename T> void f<T*>(T*)` | Partial specialisation of a function: syntax error. Write an overload. |
| Relying on `template <> void f<int*>(int*)` to win | It is not an overload candidate; a better-matching primary hides it. |
| Two partial specialisations, neither more specialised | Ambiguous instantiation error at the use. |
| Printing `typeid(T).name()` | Mangled, compiler-specific text. |
| `template <> struct TypeName { … }` (arguments missing) | Not a specialisation; redefinition error. |

## Key takeaways

- `template <> struct X<Type>` replaces the primary for exactly that type; it inherits none of its members.
- `template <typename T> struct X<T*>` matches a pattern and stays a template; the most specialised match wins.
- Traits are class templates whose specialisations record a fact per type; `<type_traits>` is built this way.
- Declare specialisations before the first use, in the header, next to the primary.
- Function templates do not partially specialise, and a full specialisation is not an overload candidate: overload instead.
- Use your own tag strings, never `typeid(T).name()`, for anything printed.
