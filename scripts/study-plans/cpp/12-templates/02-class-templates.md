---
title: Class templates — Stack<T>, Pair<A, B> and deduction
minutes: 14
---
`std::vector<int>` is not a class; `std::vector` is a class template and `std::vector<int>` is one class stamped out of it. Every container, smart pointer and vocabulary type in the standard library is built the same way, and writing your own is how you stop duplicating a `Stack` for `int` and another for `std::string`. This lesson covers declaring a class template, defining its members outside the class body, default template arguments, class template argument deduction (C++17), and the `typename` keyword the compiler demands when a name depends on `T`.

## Stack<T>

```cpp
#include <cstddef>
#include <stdexcept>
#include <vector>

template <typename T>
class Stack {
public:
    void push(const T& value) { items_.push_back(value); }
    void pop();                         // defined below
    const T& top() const;
    std::size_t size() const { return items_.size(); }
    bool empty() const { return items_.empty(); }

private:
    std::vector<T> items_;
};
```

`template <typename T>` in front of a class makes `T` usable anywhere inside it: as a member's type, a parameter, a return type, or an argument to another template such as `std::vector<T>`. `Stack<int>` and `Stack<std::string>` are two unrelated classes — there is no conversion between them, and a function taking `Stack<int>&` will not accept a `Stack<long>`. Inside the class body the bare name `Stack` means "the current instantiation", so a copy constructor is written `Stack(const Stack&)`, not `Stack(const Stack<T>&)`, though both are accepted.

Member functions are instantiated one by one, only when called. `Stack<Widget>` compiles even if `Widget` has no `operator<`, as long as nobody calls a member that needs it. This lazy rule is why `std::vector<T>` can offer `operator<` for every `T` and only complain when you actually compare two vectors of a type that cannot be compared.

## Members defined outside the class

The body reads better as an interface when the long members live below it:

```cpp
template <typename T>
void Stack<T>::pop() {
    if (items_.empty()) throw std::out_of_range("pop on empty stack");
    items_.pop_back();
}

template <typename T>
const T& Stack<T>::top() const {
    if (items_.empty()) throw std::out_of_range("top on empty stack");
    return items_.back();
}
```

Every out-of-class definition repeats the template header and qualifies the name with `Stack<T>::` — here the `<T>` is required, because outside the class there is no current instantiation to be implied. The definitions still belong in the header, next to the class: the compiler needs them wherever `Stack<int>::pop` is first used (lesson 1).

## Pair<A, B> and default template arguments

```cpp
template <typename A, typename B = A>
struct Pair {
    A first;
    B second;

    Pair<B, A> swapped() const { return {second, first}; }
};

Pair<int, std::string> label{1, "one"};
Pair<double> range{0.5, 2.5};             // B defaults to A: Pair<double, double>
Pair<std::string, int> back = label.swapped();
```

Two parameters, two independent types. A default template argument works like a default function argument — trailing ones only, and the caller may omit them — and it is why `std::map<std::string, int>` compiles with two arguments when the template declares four: `std::map<Key, T, Compare = std::less<Key>, Allocator = …>`. `swapped()` returns a *different instantiation* of the same template; a member of `Pair<A, B>` can name `Pair<B, A>` freely because the compiler generates it on demand.

A struct template with public members and no constructor is an aggregate, so brace initialisation fills the members in order exactly as for a plain struct (Module 8).

## Class template argument deduction (C++17)

Before C++17 every instantiation was spelled out; since then the compiler can deduce the arguments from a constructor call or an aggregate initialiser:

```cpp
Pair p{42, 2.5};                     // Pair<int, double>
std::vector v{1, 2, 3};              // std::vector<int>
std::pair q{std::string("k"), 7};    // std::pair<std::string, int>
std::lock_guard lock(mutex);         // std::lock_guard<std::mutex>
```

CTAD is all or nothing: `Pair<int> p{1, 2.5}` does not deduce `B` from the second member — it uses the default `B = A` and narrows `2.5` to `int`, which brace-init rejects. Either name every argument or none.

Two deductions surprise people. `Pair p{"k", 1}` deduces `A = const char*`, because a string literal is an array of `char` and decays to a pointer; a library can steer this with a *deduction guide* — the line `Pair(const char*, B) -> Pair<std::string, B>;` after the struct tells the compiler what to deduce for that shape, and it is how `std::pair`-like types become friendlier. And `std::vector v{3}` is a vector holding the single element `3`, because braces prefer the `initializer_list` constructor; `std::vector v(3, 0)` with parentheses is three zeros. Whenever the deduced type is not obvious from the initialiser, write it out — CTAD saves typing, not thinking.

## typename for dependent names

```cpp
template <typename C>
void print_first(const C& c) {
    typename C::value_type first = *c.begin();   // typename is required here
    std::cout << first << '\n';
}
```

`C::value_type` is a *dependent name*: what it means depends on `C`, which is unknown while the template is parsed. It might be a type (as in every container) or a static data member or a constant, and the grammar differs, so the parser assumes "not a type" unless you say `typename`. Leave it out and GCC reports `need 'typename' before 'C::value_type' because 'C' is a dependent scope`. The same logic gives the rarer `c.template get<0>()` when a dependent member is itself a template. In practice `auto first = *c.begin();` sidesteps the whole question, and most modern generic code prefers it; `typename` still appears in return types and member declarations where `auto` cannot.

## Static members and member templates

A static data member belongs to each instantiation separately: `Stack<int>::count` and `Stack<double>::count` are two variables, each initialised once. A member function can itself be a template — `template <typename U> void push_converted(const U& u) { push(static_cast<T>(u)); }` — with its own parameter deduced at the call; `std::vector::assign` and the converting constructors of `std::pair` are member templates.

## The standard library is class templates

| Template | Parameters | Deduction you have used |
| --- | --- | --- |
| `std::vector<T, Alloc>` | element, allocator (defaulted) | `std::vector v{1, 2}` |
| `std::map<K, V, Compare, Alloc>` | two named, two defaulted | — |
| `std::pair<A, B>` | two types | `std::pair{1, 2.5}` |
| `std::array<T, N>` | a type and a number (lesson 4) | `std::array a{1, 2, 3}` |
| `std::unique_ptr<T, Deleter>` | pointee, deleter (defaulted) | — |
| `std::basic_string<CharT>` | `std::string` is `basic_string<char>` | — |

An *alias template* names a shape once: `template <typename T> using Grid = std::vector<std::vector<T>>;` lets you write `Grid<int>` everywhere (Module 6 used the long form).

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Passing `Stack<int>` where `Stack<long>` is expected | Unrelated types: no conversion, compile error. |
| Out-of-class member without `template <typename T>` | `Stack` is not a class: compile error. |
| `Pair<int> p{1, 2.5}` | Partial CTAD does not exist; `B` defaults to `int` and the narrowing fails. |
| `std::vector v{3}` | One element, not three. Use parentheses for a count. |
| `Pair p{"k", 1}` | `A = const char*`, not `std::string`. |
| `C::value_type x;` without `typename` | Parsed as a non-type: compile error. |
| Member definitions in a `.cpp` | Undefined reference for every instantiation the `.cpp` never used. |

## Key takeaways

- A class template stamps out a distinct class per argument list; `Stack<int>` and `Stack<long>` are unrelated.
- Members are instantiated on first use, so a template can offer operations only some `T`s support.
- Out-of-class members repeat the template header and qualify with `Stack<T>::`; they live in the header.
- Default template arguments are trailing and explain why `std::map<K, V>` takes two arguments.
- CTAD deduces all arguments or none; watch `const char*` and `std::vector v{3}`.
- A name that depends on `T` needs `typename` to be read as a type.
