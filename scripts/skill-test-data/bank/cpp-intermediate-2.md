---
skill: cpp
level: intermediate
---

## cpp-intermediate-026
topic: memory
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(n) { std::cout << '+' << name; }
    ~Tracer() { std::cout << '-' << name; }
};

void run() {
    Tracer a("a");
    {
        Tracer b("b");
        Tracer c("c");
    }
    Tracer d("d");
}

int main() {
    run();
    std::cout << '\n';
}
```

- A: `+a+b+c-b-c+d-d-a`
- B: `+a+b+c-c-b+d-a-d`
- C: `+a+b+c+d-d-c-b-a`
- D: `+a+b+c-c-b+d-d-a`

> Automatic objects are destroyed when their scope ends, in reverse order of
> construction. `b` and `c` die at the inner closing brace (`c` first), before
> `d` is even constructed; `d` and then `a` die when `run` returns. This
> deterministic timing is what makes RAII work.

## cpp-intermediate-027
topic: memory
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <utility>
#include <vector>

struct Buffer {
    std::vector<int> data;
    ~Buffer() {}
};

int main() {
    Buffer a{{1, 2, 3}};
    Buffer b = std::move(a);
    std::cout << a.data.size() << ' ' << b.data.size() << '\n';
}
```

- A: `3 3`
- B: `0 3`
- C: `3 0`
- D: It does not compile: `Buffer` has no move constructor.

> Declaring a destructor — even an empty one — stops the compiler from
> declaring an implicit move constructor and move assignment. The implicit copy
> constructor is still generated, and its `const Buffer&` parameter binds to
> the rvalue, so `std::move(a)` quietly copies: `a` keeps its three elements.
> This is the rule of five in action: drop the empty destructor (rule of zero)
> or also declare the moves `= default`.

## cpp-intermediate-028
topic: memory
answer: B, C, D

```cpp
#include <memory>

void take(std::unique_ptr<int> p);

int main() {
    auto p = std::make_unique<int>(1);
    // one of the calls below goes here
}
```

Which calls compile? Select all that apply.

- A: `take(p);`
- B: `take(std::move(p));`
- C: `take(std::make_unique<int>(2));`
- D: `take(nullptr);`
- E: `take(new int(3));`

> `unique_ptr` is move-only: A would need the deleted copy constructor. B moves
> from a named pointer explicitly and C passes a temporary, which is an rvalue,
> so both use the move constructor. `unique_ptr` has a non-explicit constructor
> from `nullptr_t`, so D compiles. The constructor from a raw pointer is
> `explicit`, so E cannot copy-initialise the parameter and does not compile —
> deliberately, so ownership of a raw pointer is never taken by accident.

## cpp-intermediate-029
topic: move-semantics
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

struct T {
    T() {}
    T(const T&) { std::cout << 'C'; }
    T(T&&) { std::cout << 'M'; }
};

int main() {
    std::vector<T> v(2);
    v.reserve(v.capacity() + 1);
    std::cout << '\n';
}
```

- A: `MM`
- B: `CC`
- C: `MC`
- D: It prints an empty line: `reserve` relocates the elements without calling any constructor.

> Asking for more than the current capacity forces a reallocation, and the two
> existing elements must be relocated. `vector` promises the strong exception
> guarantee here, so it only moves elements if the move constructor cannot
> throw (`std::move_if_noexcept`). `T`'s move constructor is not `noexcept`, so
> the elements are copied. Marking it `noexcept` would print `MM` — which is
> why move constructors should be `noexcept` whenever they can be.

## cpp-intermediate-030
topic: move-semantics
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <utility>

int main() {
    std::string s = "hello";
    std::string&& r = std::move(s);
    r += '!';
    std::cout << s.size() << ' ' << r.size() << '\n';
}
```

- A: `0 6`
- B: `5 6`
- C: `6 6`
- D: `0 0`

> `std::move` moves nothing: it is only a cast to an rvalue reference. Binding
> that result to `std::string&& r` creates another name for `s` — no string is
> constructed, so nothing is moved from. `r += '!'` therefore appends to `s`
> itself, and both report 6. A move happens only when a move constructor or
> move assignment actually runs.

## cpp-intermediate-031
topic: move-semantics
answer: A, C

```cpp
struct Pinned {
    explicit Pinned(int v) : v(v) {}
    Pinned(const Pinned&) = delete;
    Pinned(Pinned&&) = delete;
    int v;
};
```

In C++17, which of these functions compile? Select all that apply.

- A: `Pinned f1() { return Pinned(1); }`
- B: `Pinned f2() { Pinned p(2); return p; }`
- C: `Pinned f3() { return Pinned{3}; }`
- D: `Pinned f4() { Pinned p(4); return std::move(p); }`

> Since C++17, returning a prvalue of the function's own type is guaranteed
> copy elision: the result object is initialised directly, and no copy or move
> constructor is needed at all — so A and C compile even though both are
> deleted. Returning a named local (B) is NRVO, which is allowed but not
> guaranteed, so the move constructor must still be usable, and it is deleted.
> D asks for the deleted move constructor explicitly.

## cpp-intermediate-032
topic: templates
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <type_traits>

template <typename T>
void byValue(T) { std::cout << std::is_const<T>::value; }

template <typename T>
void byRef(T&) { std::cout << std::is_const<T>::value; }

int main() {
    const int c = 1;
    int n = 2;
    byValue(c);
    byRef(c);
    byValue(n);
    byRef(n);
    std::cout << '\n';
}
```

- A: `1100`
- B: `0000`
- C: `1111`
- D: `0100`

> For a by-value parameter, deduction drops top-level `const` (and references)
> from the argument, because the function gets its own copy: `byValue(c)`
> deduces `T = int`. For a `T&` parameter the constness is part of what the
> reference refers to, so `byRef(c)` deduces `T = const int`. With the
> non-const `n`, both deduce `int`.

## cpp-intermediate-033
topic: templates
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <type_traits>

template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
std::string kind(T) { return "integral"; }

std::string kind(double) { return "double"; }

int main() {
    std::cout << kind(1) << ' ' << kind('a') << ' '
              << kind(1.5f) << ' ' << kind(2L) << '\n';
}
```

- A: `integral double double integral`
- B: `integral integral double integral`
- C: `integral integral integral integral`
- D: It does not compile: `kind(1)` is ambiguous.

> For `int`, `char` and `long`, the template deduces `T` exactly and the
> `enable_if` condition holds; an exact match beats the non-template's
> conversion to `double`, so there is no ambiguity. For `float`,
> `is_integral_v<float>` is false, `enable_if_t` names no type, and the
> substitution failure silently removes the template from the overload set
> (SFINAE) — leaving `kind(double)` via float-to-double promotion.

## cpp-intermediate-034
topic: templates
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

template <typename T>
struct Counter {
    static int count;
    Counter() { ++count; }
};

template <typename T>
int Counter<T>::count = 0;

int main() {
    Counter<int> a, b;
    Counter<double> c;
    Counter<int> d;
    std::cout << Counter<int>::count << ' ' << Counter<double>::count << '\n';
}
```

- A: `3 1`
- B: `4 4`
- C: `3 3`
- D: `4 1`

> Every specialisation of a class template is a distinct class, and each has
> its own static data members. `Counter<int>::count` counts the three
> `Counter<int>` objects; `Counter<double>::count` is a separate variable that
> counted one.

## cpp-intermediate-035
topic: inheritance
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Animal {
    virtual ~Animal() = default;
    virtual std::string sound() const { return "..."; }
};

struct Dog : Animal {
    std::string sound() const override { return "woof"; }
};

void byValue(Animal a) { std::cout << a.sound() << ' '; }
void byRef(const Animal& a) { std::cout << a.sound() << ' '; }

int main() {
    Dog d;
    byValue(d);
    byRef(d);
    std::vector<Animal> zoo{d};
    std::cout << zoo[0].sound() << '\n';
}
```

- A: `woof woof woof`
- B: `... woof woof`
- C: `... woof ...`
- D: `woof woof ...`

> Copying a `Dog` into an `Animal` object slices it: only the `Animal` part is
> copied, and the new object's dynamic type is `Animal`. That happens for the
> by-value parameter and for the `vector<Animal>` element. Only the reference
> keeps referring to the original `Dog`, so only it dispatches to `Dog::sound`.
> Polymorphic objects are stored by pointer or reference
> (`vector<unique_ptr<Animal>>`), never by value.

## cpp-intermediate-036
topic: inheritance
answer: B

```cpp
struct Shape {
    virtual ~Shape() = default;
    virtual double area() const = 0;
};
```

Which statement is true?

- A: `Shape s;` compiles, and calling `s.area()` throws at run time.
- B: A subclass of `Shape` that does not override `area()` is also abstract.
- C: `Shape* p = nullptr;` is an error: no pointer to an abstract class may exist.
- D: Every derived class must override `area()`, or the program fails to compile.

> A class with a pure virtual function is abstract: you cannot create an object
> of it, so `Shape s;` is a compile error. A derived class that leaves `area()`
> unoverridden inherits the pure virtual function and is abstract too — that is
> legal, as long as no one tries to instantiate it, so D is wrong. Pointers and
> references to abstract classes are fine; they are how the class is used.

## cpp-intermediate-037
topic: inheritance
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Base { int hits = 0; };
struct Left : virtual Base {};
struct Right : virtual Base {};
struct Both : Left, Right {};

int main() {
    Both b;
    b.Left::hits += 1;
    b.Right::hits += 2;
    std::cout << b.Left::hits << ' ' << b.Right::hits << '\n';
}
```

- A: `3 3`
- B: `1 2`
- C: It does not compile: `hits` is ambiguous in `Both`.
- D: It does not compile: `Both` must construct the virtual base `Base` itself.

> With virtual inheritance, `Left` and `Right` share a single `Base`
> subobject inside `Both`, so both qualified names refer to the same `hits`,
> which ends up 3. Without `virtual` there would be two copies and it would
> print `1 2`. The qualified names compile either way, and the most-derived
> class constructs the virtual base implicitly with its default constructor.

## cpp-intermediate-038
topic: stl-containers
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a;
    a.reserve(5);
    a.push_back(1);

    std::vector<int> b;
    b.resize(5);
    b.push_back(1);

    std::cout << a.size() << ' ' << b.size() << ' ' << b[0] << '\n';
}
```

- A: `1 5 1`
- B: `6 6 0`
- C: `1 6 1`
- D: `1 6 0`

> `reserve` only allocates capacity; the size stays 0, so after one
> `push_back` it is 1. `resize(5)` creates five value-initialised elements
> (zeros), and `push_back` appends a sixth after them — `b[0]` is still 0. A
> common bug is calling `resize` where `reserve` was meant and then
> `push_back`ing.

## cpp-intermediate-039
topic: stl-containers
answer: A, D, E

Which operations may invalidate an iterator that points to some other, untouched element of the same container? Select all that apply.

- A: `std::vector<int>::push_back`
- B: `std::list<int>::push_back`
- C: `std::map<int, int>::insert`
- D: `std::deque<int>::push_back`
- E: `std::unordered_map<int, int>::insert`

> A `vector` that reallocates invalidates every iterator. Inserting at either
> end of a `deque` invalidates all its iterators (though not references to
> elements). An insert into an `unordered_map` that triggers a rehash
> invalidates all iterators. Node-based `list` and `map` never invalidate
> iterators to other elements on insertion.

## cpp-intermediate-040
topic: stl-containers
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <iterator>
#include <list>

int main() {
    std::list<int> l{1, 2, 3};
    auto it = std::next(l.begin());
    l.push_front(0);
    l.insert(it, 9);
    l.erase(l.begin());
    for (int x : l) std::cout << x;
    std::cout << ' ' << *it << '\n';
}
```

- A: `1293 2`
- B: `1923 9`
- C: `1923 2`
- D: `0192 3`

> `it` points at the node holding 2, and list iterators stay valid through
> insertions and through erasure of other elements. `push_front(0)` gives
> `0 1 2 3`; `insert(it, 9)` inserts before `it`, giving `0 1 9 2 3`; erasing
> the first node leaves `1 9 2 3`. `it` still points at 2.

## cpp-intermediate-041
topic: stl-algorithms
answer: B
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 1, 2, 1, 1, 3, 3, 2};
    v.erase(std::unique(v.begin(), v.end()), v.end());
    for (int x : v) std::cout << x;
    std::cout << '\n';
}
```

- A: `123`
- B: `12132`
- C: `1213`
- D: `1232`

> `std::unique` only collapses runs of consecutive equal elements; it does not
> look for duplicates across the whole range. Here the runs are `1 1`, `2`,
> `1 1`, `3 3`, `2`, giving `1 2 1 3 2`. To remove all duplicates, sort first
> (or use a set).

## cpp-intermediate-042
topic: stl-algorithms
answer: D

```cpp
std::list<int> l{3, 1, 2};
std::sort(l.begin(), l.end());
```

What happens?

- A: It sorts the list in O(n log n), like any other container.
- B: It compiles, but sorting invalidates the list's iterators: undefined behaviour.
- C: It sorts the list, but in O(n²) because list iterators cannot jump.
- D: It does not compile: `std::sort` needs random-access iterators.

> `std::sort` requires random-access iterators (it computes distances and jumps
> to midpoints), and `std::list` provides only bidirectional iterators, so the
> call fails to compile. `std::list` has its own member `l.sort()`, a stable
> merge sort that relinks nodes instead of moving values.

## cpp-intermediate-043
topic: undefined-behaviour
answer: C

```cpp
std::vector<int> v(3);
v[3] = 1;      // line 1
v.at(3) = 1;   // line 2
```

Taking each line on its own, which statement is correct?

- A: Both lines throw `std::out_of_range`.
- B: Line 1 grows the vector to four elements; line 2 throws `std::out_of_range`.
- C: Line 1 is undefined behaviour; line 2 throws `std::out_of_range`.
- D: Both lines are undefined behaviour; neither index is checked.

> `operator[]` does no bounds checking: indexing one past the end writes
> outside the elements and is undefined behaviour — it may appear to work,
> corrupt the heap, or crash. `at()` checks the index and throws
> `std::out_of_range`. Neither ever grows the vector.

## cpp-intermediate-044
topic: undefined-behaviour
answer: D

Each snippet runs on its own inside `main`. Which one has undefined behaviour?

- A: `std::string a = "x"; std::string b = std::move(a); a = "y"; std::cout << a;`
- B: `auto p = std::make_unique<int>(1); auto q = std::move(p); std::cout << (p == nullptr);`
- C: `std::vector<int> v{1}; auto w = std::move(v); v.clear(); std::cout << v.size();`
- D: `auto p = std::make_unique<int>(1); int* r = p.get(); p.reset(); std::cout << *r;`

> Using a moved-from object is not undefined in itself: A assigns a new value
> first, B relies on the documented state of a moved-from `unique_ptr` (null),
> and C calls `clear()`, which has no preconditions, before reading the size.
> In D, `reset()` deletes the `int`, and `r` — a non-owning copy of the
> pointer — is then dereferenced: a use after free.

## cpp-intermediate-045
topic: undefined-behaviour
answer: B

```cpp
#include <vector>

struct Base { ~Base() {} };
struct Derived : Base { std::vector<int> data{1, 2, 3}; };

int main() {
    Base* p = new Derived;
    delete p;
}
```

What does the standard say about `delete p`?

- A: Only `~Base` runs, so `data` leaks; a leak, but otherwise well defined.
- B: It is undefined behaviour, because `Base` has no virtual destructor.
- C: It does not compile: deleting through a `Base*` needs a virtual destructor.
- D: Both destructors run, because `delete` uses the object's dynamic type.

> Deleting an object through a pointer to a base class whose destructor is not
> virtual is undefined behaviour — the standard does not merely promise a leak.
> It compiles (compilers may warn), and in practice usually only `~Base` runs,
> but nothing is guaranteed. A base class meant to be deleted polymorphically
> needs `virtual ~Base()`.

## cpp-intermediate-046
topic: modern
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int n = 0;
    auto counter = [n]() mutable { return ++n; };
    counter();
    counter();
    auto copy = counter;
    int first = counter();
    int second = copy();
    std::cout << first << ' ' << second << ' ' << n << '\n';
}
```

- A: `3 3 0`
- B: `3 1 0`
- C: `3 4 0`
- D: `3 3 3`

> `mutable` lets the lambda modify its own copy of `n`, which lives in the
> closure object and persists between calls: after two calls it holds 2.
> Copying the closure copies that state, so `counter` and `copy` each go on
> from 2 to 3 independently. The outer `n` was captured by value and is never
> touched.

## cpp-intermediate-047
topic: modern
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <optional>
#include <string>

std::optional<int> parse(const std::string& s) {
    if (s.empty()) return std::nullopt;
    return std::stoi(s);
}

int main() {
    std::optional<int> a = parse("42");
    std::optional<int> b = parse("");
    std::optional<int> z = parse("0");
    std::cout << a.value_or(-1) << ' ' << b.value_or(-1) << ' '
              << (z ? "set" : "empty") << '\n';
}
```

- A: `42 -1 empty`
- B: `42 0 set`
- C: `42 -1 set`
- D: `42 0 empty`

> `value_or` returns the contained value or the fallback, so the empty `b`
> gives -1. An `optional` converts to `bool` according to whether it holds a
> value, not according to the value itself: `z` holds 0, so it is engaged and
> tests true. Writing `if (z)` when `if (*z)` was meant (or the reverse) is a
> classic `optional<int>` bug.

## cpp-intermediate-048
topic: modern
answer: A

```cpp
auto a = {1, 2};
auto b{3};
```

In C++17 (with `<initializer_list>` included), what are the types of `a` and `b`?

- A: `a` is `std::initializer_list<int>`; `b` is `int`.
- B: `a` and `b` are both `std::initializer_list<int>`.
- C: `a` is `std::vector<int>`; `b` is `int`.
- D: `a` is `int[2]`; `b` is `std::initializer_list<int>`.

> `auto` with copy-list-initialisation (`= {…}`) deduces
> `std::initializer_list<T>`. Direct-list-initialisation with a single element
> (`auto b{3}`) deduces the element type, `int`, since C++17 (N3922, which
> compilers also apply to C++14); originally it too gave an `initializer_list`.
> `auto` never deduces a container or an array from a braced list.

## cpp-intermediate-049
topic: const-correctness
answer: D

```cpp
void bump(const int& r) { const_cast<int&>(r) += 1; }

int main() {
    int a = 1;
    const int b = 1;
    bump(a);
    bump(b);
}
```

Which statement is correct?

- A: Both calls are fine: `const_cast` removes the `const`, so the write is allowed.
- B: Both calls are undefined behaviour: writing through a `const_cast` is never allowed.
- C: Neither call compiles: `const_cast` cannot turn a `const int&` into an `int&`.
- D: `bump(a)` is well defined; `bump(b)` is undefined, because `b` is a `const` object.

> `const_cast` may remove `const` from a reference or pointer, and writing
> through the result is fine when the object it refers to was not itself
> defined `const` — as with `a`, which only reached `bump` through a
> const reference. Modifying an object that was defined `const`, like `b`, is
> undefined behaviour no matter how the `const` was cast away.

## cpp-intermediate-050
topic: classes
answer: B

```cpp
struct Meters {
    explicit Meters(double v) : value(v) {}
    double value;
};

void walk(Meters m);
```

Which line compiles?

- A: `walk(5.0);`
- B: `walk(Meters{5.0});`
- C: `Meters m = 5.0;`
- D: `walk({5.0});`

> An `explicit` constructor is not used for implicit conversions or
> copy-initialisation. Passing `5.0` to a `Meters` parameter (A) and
> `Meters m = 5.0` (C) are copy-initialisation, and `walk({5.0})` (D) is
> copy-list-initialisation, which is ill-formed when it selects an explicit
> constructor. Only B names the type and constructs it directly.
