---
skill: cpp
level: intermediate
---

## cpp-intermediate-001
topic: memory
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <memory>

int main() {
    auto a = std::make_shared<int>(5);
    auto b = a;
    {
        auto c = b;
        std::cout << a.use_count() << ' ';
    }
    std::weak_ptr<int> w = a;
    std::cout << a.use_count() << ' ' << w.use_count() << '\n';
}
```

- A: `3 3 3`
- B: `3 2 3`
- C: `3 2 2`
- D: `2 2 2`

> Inside the block `a`, `b` and `c` share ownership, so the count is 3. When `c`
> is destroyed at the closing brace it drops to 2. A `weak_ptr` does not own the
> object — it is tracked in the control block's separate weak count — so `a`'s
> count stays 2, and `w.use_count()` reports the number of `shared_ptr` owners,
> which is also 2.

## cpp-intermediate-002
topic: memory
answer: D

A class's only data members are a `std::vector<int>` and a `std::string`. It declares no copy or move operations and no destructor. Which statement is true?

- A: It leaks unless it declares a destructor that frees the vector's buffer.
- B: Its implicit copy shares one buffer between the copies (a shallow copy).
- C: Moving it copies both members, because it declares no move constructor.
- D: Its implicit copy, move and destructor all work; it should declare none.

> This is the rule of zero. The compiler-generated special members work member
> by member: the vector's and string's own destructors free their memory, their
> own copy constructors copy deeply, and — because nothing is user-declared —
> an implicit move constructor and move assignment are generated too and move
> each member. Writing any of them by hand only risks getting them wrong.

## cpp-intermediate-003
topic: memory
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <stdexcept>

struct Guard {
    ~Guard() { std::cout << "release "; }
};

void work() {
    Guard g;
    throw std::runtime_error("boom");
    std::cout << "after ";
}

int main() {
    try {
        work();
    } catch (const std::exception&) {
        std::cout << "caught";
    }
    std::cout << '\n';
}
```

- A: `release caught`
- B: `caught release`
- C: `caught`
- D: `release after caught`

> When the exception leaves `work`, the stack is unwound before the handler
> runs: every fully constructed local, here `g`, is destroyed on the way out.
> That is the guarantee RAII relies on — a lock or file owned by a local object
> is released on the exception path too. The statement after `throw` never runs.

## cpp-intermediate-004
topic: move-semantics
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <utility>

struct S {
    S() {}
    S(const S&) { std::cout << "C"; }
    S(S&&) noexcept { std::cout << "M"; }
};

int main() {
    S a;
    S b = a;
    S c = std::move(a);
    const S d;
    S e = std::move(d);
    std::cout << '\n';
}
```

- A: `CMM`
- B: `CMC`
- C: `CCC`
- D: `MMC`

> `b` copies from an lvalue (C) and `c` moves from an rvalue (M). `std::move(d)`
> has type `const S&&`: the move constructor takes `S&&`, which cannot bind to a
> const object, so overload resolution falls back to the copy constructor,
> whose `const S&` binds to anything. Moving from a `const` object silently
> copies.

## cpp-intermediate-005
topic: move-semantics
answer: C

```cpp
std::string a = "a string long enough to live on the heap, not inline";
std::string b = std::move(a);
```

After these two lines, what does the standard guarantee about `a`?

- A: `a` is guaranteed to be empty afterwards, so `a.size()` returns 0.
- B: `a` still holds its text: a `std::string` move copies the characters.
- C: `a` is valid but unspecified: it may be assigned to or cleared.
- D: Any use of `a`, even assigning a new value, is undefined behaviour.

> The standard says a moved-from `std::string` is left in a valid but
> unspecified state. Operations without preconditions — assignment, `clear()`,
> `size()`, destruction — are fine; relying on a particular value is not.
> Implementations usually leave it empty, but that is not a guarantee, so code
> must not depend on it.

## cpp-intermediate-006
topic: move-semantics
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <utility>

void f(int&)  { std::cout << "L"; }
void f(int&&) { std::cout << "R"; }

void g(int&& x) {
    f(x);
    f(std::move(x));
}

int main() {
    int a = 1;
    f(a);
    f(2);
    g(3);
    std::cout << '\n';
}
```

- A: `LRRR`
- B: `LRRL`
- C: `LLLR`
- D: `LRLR`

> `f(a)` passes an lvalue and `f(2)` a prvalue. Inside `g`, `x` has type
> `int&&`, but it is a named variable, and a name is always an lvalue
> expression — so `f(x)` picks `f(int&)`. Only `std::move(x)` turns it back
> into an rvalue. That is why code that takes an rvalue reference still has to
> `std::move` it onward.

## cpp-intermediate-007
topic: templates
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

template <typename T>
struct Name { static const char* get() { return "generic"; } };

template <>
struct Name<int> { static const char* get() { return "int"; } };

template <typename T>
struct Name<T*> { static const char* get() { return "pointer"; } };

int main() {
    std::cout << Name<double>::get() << ' '
              << Name<int>::get() << ' '
              << Name<int*>::get() << ' '
              << Name<const int>::get() << '\n';
}
```

- A: `generic int pointer generic`
- B: `generic int pointer int`
- C: `generic int int generic`
- D: `generic int pointer pointer`

> `Name<int>` uses the full specialisation and `Name<int*>` matches the partial
> specialisation `Name<T*>` with `T = int`. `const int` is a different type from
> `int`, so neither specialisation matches `Name<const int>` and the primary
> template is used.

## cpp-intermediate-008
topic: templates
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <type_traits>

template <typename T>
std::string describe(T v) {
    if constexpr (std::is_integral_v<T>)
        return "int:" + std::to_string(v);
    else if constexpr (std::is_floating_point_v<T>)
        return "float";
    else
        return "other:" + std::string(v);
}

int main() {
    std::cout << describe(7) << ' ' << describe(2.5) << ' '
              << describe(true) << ' ' << describe("hi") << '\n';
}
```

- A: It does not compile: `std::to_string` has no overload for `const char*`.
- B: `int:7 float int:true other:hi`
- C: `int:7 float int:1 other:hi`
- D: It does not compile: `std::string` cannot be built from a `bool`.

> With `if constexpr`, the branches not taken are discarded and never
> instantiated, so `describe<const char*>` never compiles the `std::to_string`
> call and `describe<int>` never compiles `std::string(v)`. `bool` is an
> integral type, so `describe(true)` takes the first branch, and
> `std::to_string(true)` promotes the `bool` to `int` and yields `"1"`. The
> literal `"hi"` decays to `const char*`, which takes the last branch.

## cpp-intermediate-009
topic: templates
answer: B

A team moves the member-function definitions of a class template `Stack<T>` out of `stack.h` and into `stack.cpp`, changing nothing else. `main.cpp`, which includes `stack.h` and uses `Stack<int>`, now fails to build with undefined references. Why?

- A: Class template members must be defined inside the class body, never out of line.
- B: Instantiating `Stack<int>` needs the definitions, which `main.cpp` no longer sees.
- C: The linker instantiates templates and cannot read definitions from another .cpp file.
- D: A .cpp file cannot contain template definitions, so `stack.cpp` fails to compile.

> A template is instantiated where it is used, and the compiler can only
> instantiate what it can see. `main.cpp` sees declarations only, so it emits
> calls to `Stack<int>::push` and so on, expecting them elsewhere; `stack.cpp`
> sees the definitions but never uses `Stack<int>`, so it instantiates nothing.
> Hence the link errors. The usual fix is to keep the definitions in the header
> (out-of-line definitions there are fine), or to add an explicit instantiation
> `template class Stack<int>;` to `stack.cpp`.

## cpp-intermediate-010
topic: inheritance
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Base {
    Base() { hello(); }
    virtual ~Base() = default;
    virtual void hello() const { std::cout << "Base "; }
    void call() const { hello(); }
};

struct Derived : Base {
    void hello() const override { std::cout << "Derived "; }
};

int main() {
    Derived d;
    d.call();
    std::cout << '\n';
}
```

- A: `Derived Derived`
- B: `Base Base`
- C: `Derived Base`
- D: `Base Derived`

> While `Base`'s constructor runs, the object is still only a `Base` — the
> `Derived` part has not been constructed yet — so a virtual call there
> dispatches to `Base::hello`. Once construction is complete, `d.call()` calls
> `hello()` through the fully built object and gets `Derived::hello`.

## cpp-intermediate-011
topic: inheritance
answer: A, C

```cpp
struct Base {
    virtual ~Base() = default;
    virtual void f(int) const;
};

struct Derived : Base {
    // one of the declarations below goes here
};
```

Which declarations, placed in `Derived`, compile? Select all that apply.

- A: `void f(int) const override;`
- B: `void f(int) override;`
- C: `void f(int) const final;`
- D: `void f(long) const override;`
- E: `int f(int) const override;`

> To override, the function must match the base's parameters and
> cv-qualification. A does. C does too: it overrides `Base::f`, so it is
> virtual, and `final` only forbids further overriding. B drops the `const` and
> D changes the parameter type, so neither overrides anything and `override`
> makes that an error. E has the same signature, so it does override — but with
> a return type that is neither the same nor covariant, which is ill-formed.

## cpp-intermediate-012
topic: inheritance
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Base {
    virtual ~Base() = default;
    virtual void greet(const std::string& who = "base") const {
        std::cout << "Base:" << who;
    }
};

struct Derived : Base {
    void greet(const std::string& who = "derived") const override {
        std::cout << "Derived:" << who;
    }
};

int main() {
    Derived d;
    const Base& b = d;
    b.greet();
    std::cout << '\n';
}
```

- A: `Derived:derived`
- B: `Derived:base`
- C: `Base:base`
- D: `Base:derived`

> The function body is chosen at run time from the dynamic type (`Derived`), but
> default arguments are filled in at compile time from the static type of the
> expression — here `const Base&`, whose default is `"base"`. That mismatch is
> why redefining a default argument in an override is a well-known trap.

## cpp-intermediate-013
topic: stl-containers
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m{{"a", 1}};
    if (m["b"] == 0) std::cout << "zero ";
    std::size_t before = m.size();
    std::size_t found = m.count("c");
    std::cout << before << ' ' << found << ' ' << m.size() << '\n';
}
```

- A: `zero 1 0 1`
- B: `zero 2 0 3`
- C: `zero 2 0 2`
- D: `zero 1 0 2`

> `map::operator[]` inserts a value-initialised element (`0` for `int`) when the
> key is missing, so merely reading `m["b"]` adds `"b"` and the size becomes 2.
> `count` (like `find`) only looks, so checking for `"c"` inserts nothing. Use
> `find`, `count` or `contains` to test for a key without inserting it.

## cpp-intermediate-014
topic: stl-containers
answer: D

```cpp
std::vector<int> v(10);
auto it = v.begin() + 2;
v.push_back(42);
```

After the `push_back`, when may `it` still be used?

- A: Never: `push_back` invalidates every iterator into the vector.
- B: Always: `push_back` only changes the end of the vector.
- C: Only after first checking that `it` is not equal to `v.end()`.
- D: Only if `v.size()` was less than `v.capacity()` before the call.

> If the vector was full, `push_back` reallocates and every iterator, pointer
> and reference into it is invalidated. If there was spare capacity, no
> reallocation happens and only the past-the-end iterator is invalidated, so
> `it`, which points before the insertion point, stays valid. Comparing an
> invalid iterator with `end()` does not make it valid again.

## cpp-intermediate-015
topic: stl-containers
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

struct P {
    P(int, int) { std::cout << "ctor "; }
    P(const P&) { std::cout << "copy "; }
    P(P&&) noexcept { std::cout << "move "; }
};

int main() {
    std::vector<P> v;
    v.reserve(4);
    v.push_back(P(1, 2));
    v.emplace_back(3, 4);
    std::cout << '\n';
}
```

- A: `ctor move ctor`
- B: `ctor ctor`
- C: `ctor copy ctor`
- D: `ctor move ctor move`

> `push_back(P(1, 2))` first constructs a temporary, then moves it into the
> vector's storage (the rvalue overload of `push_back`). `emplace_back(3, 4)`
> forwards the arguments and constructs the element in place, so only the
> constructor runs. `reserve(4)` guarantees no reallocation moves elements
> around in between.

## cpp-intermediate-016
topic: stl-algorithms
answer: B
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 2, 4};
    auto newEnd = std::remove(v.begin(), v.end(), 2);
    std::cout << v.size() << ' ' << (newEnd - v.begin()) << ' ';
    v.erase(newEnd, v.end());
    for (int x : v) std::cout << x;
    std::cout << '\n';
}
```

- A: `3 3 134`
- B: `5 3 134`
- C: `5 5 134`
- D: `3 5 134`

> `std::remove` cannot change a container's size — it only sees iterators. It
> shifts the kept elements to the front and returns the new logical end, so the
> size is still 5 while the kept range has 3 elements. The `erase` call is what
> actually shrinks the vector: the erase–remove idiom.

## cpp-intermediate-017
topic: stl-algorithms
answer: C
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 3, 3, 3, 5, 7};
    auto lo = std::lower_bound(v.begin(), v.end(), 3) - v.begin();
    auto hi = std::upper_bound(v.begin(), v.end(), 3) - v.begin();
    auto at = std::lower_bound(v.begin(), v.end(), 4) - v.begin();
    std::cout << lo << ' ' << hi << ' ' << at << '\n';
}
```

- A: `1 3 4`
- B: `1 4 3`
- C: `1 4 4`
- D: `2 4 4`

> `lower_bound` returns the first element not less than the value (the first
> `3`, index 1); `upper_bound` returns the first element greater than it (the
> `5`, index 4), so `[lo, hi)` is exactly the run of `3`s. For a missing value
> such as 4, `lower_bound` returns the position where it would be inserted —
> also index 4.

## cpp-intermediate-018
topic: stl-algorithms
answer: A

```cpp
std::sort(v.begin(), v.end(), [](int a, int b) { return a <= b; });
```

`v` contains many repeated values. What is wrong with this call?

- A: `<=` is not a strict weak ordering, so the behaviour is undefined.
- B: Nothing: `<=` sorts ascending exactly like `<`, just with more swaps.
- C: It sorts descending, because equal neighbours keep being swapped.
- D: It does not compile: a comparator must return `int`, not `bool`.

> A comparator for `std::sort` must be a strict weak ordering; in particular
> `comp(a, a)` must be false. `<=` says every element precedes itself, which
> breaks the precondition, and the behaviour is undefined — real
> implementations can run past the end of the range when equal elements are
> present. Use `<` (or `>` for descending).

## cpp-intermediate-019
topic: undefined-behaviour
answer: A

```cpp
#include <iostream>
#include <string>

const std::string& pick(const std::string& s) { return s; }
std::string global = "g";

int main() {
    // r is defined here by one of the options
    std::cout << r;
}
```

Which definition of `r`, placed at the comment, makes `std::cout << r;` undefined behaviour?

- A: `const std::string& r = pick(std::string("a"));`
- B: `const std::string& r = std::string("a") + "b";`
- C: `const std::string& r = pick(global);`
- D: `std::string r = pick(std::string("a"));`

> A temporary bound to a function's reference parameter lives only until the
> end of the full-expression containing the call. In A, `pick` returns a
> reference to that temporary and `r` keeps it after the temporary is
> destroyed, so `r` dangles. Lifetime extension applies only when a temporary
> is bound directly to a local reference, as in B — never through a function's
> return value. C refers to a global, and D copies the string into `r` while
> the temporary is still alive.

## cpp-intermediate-020
topic: undefined-behaviour
answer: A, C

Assume a 32-bit `int`. Given

```cpp
int a = INT_MAX, b = INT_MIN, m = -1;
unsigned u = UINT_MAX;
```

which expressions have undefined behaviour when evaluated? Select all that apply.

- A: `a + 1`
- B: `u + 1`
- C: `b / m`
- D: `static_cast<long long>(a) + 1`
- E: `a + b`

> Signed integer overflow is undefined: `a + 1` exceeds `INT_MAX`, and
> `INT_MIN / -1` would be 2147483648, which `int` cannot represent (on x86 it
> typically traps). Unsigned arithmetic is defined to wrap modulo 2^32, so
> `u + 1` is 0. D is computed in `long long`, where the result fits, and
> `INT_MAX + INT_MIN` is -1.

## cpp-intermediate-021
topic: undefined-behaviour
answer: B

```cpp
#include <iostream>
#include <thread>

int counter = 0;

void work() {
    for (int i = 0; i < 100000; ++i) ++counter;
}

int main() {
    std::thread t1(work), t2(work);
    t1.join();
    t2.join();
    std::cout << counter << '\n';
}
```

According to the C++ standard, which statement about this program is true?

- A: It always prints `200000`: `++counter` is a single machine instruction.
- B: Unsynchronised writes from two threads: a data race, undefined behaviour.
- C: It prints a value from `100000` to `200000`, depending on the interleaving.
- D: It does not compile: a global cannot be written from two threads at once.

> Two threads access the same non-atomic object and at least one writes, with
> no synchronisation between them: that is a data race, and a data race is
> undefined behaviour — not merely a "random" result. (In practice lost updates
> can even push the total below 100000.) Making `counter` a
> `std::atomic<int>`, or guarding it with a mutex, makes the program correct
> and it then prints 200000.

## cpp-intermediate-022
topic: modern
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int x = 1;
    auto byValue = [x] { return x; };
    auto byRef = [&x] { return x; };
    x = 5;
    std::cout << byValue() << ' ' << byRef() << '\n';
}
```

- A: `5 5`
- B: `1 5`
- C: `1 1`
- D: `5 1`

> A by-value capture copies `x` into the closure when the lambda is created, so
> `byValue` keeps returning 1. A by-reference capture refers to the variable
> itself and sees its value at the time of the call, 5.

## cpp-intermediate-023
topic: modern
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <utility>

int main() {
    std::pair<int, int> p{1, 2};
    auto [a, b] = p;
    auto& [c, d] = p;
    a = 10;
    c = 20;
    d += b;
    std::cout << p.first << ' ' << p.second << '\n';
}
```

- A: `10 4`
- B: `20 2`
- C: `10 2`
- D: `20 4`

> `auto [a, b] = p` binds the names to the members of a hidden copy of `p`, so
> assigning to `a` leaves `p` alone. `auto& [c, d] = p` binds to `p` itself, so
> `c = 20` sets `p.first`, and `d += b` adds 2 (from the copy) to `p.second`.

## cpp-intermediate-024
topic: modern
answer: D

```cpp
constexpr int square(int x) { return x * x; }
```

Which statement about `square` is true in C++17?

- A: Every call is evaluated at compile time, even `square(n)` with a runtime `n`.
- B: It cannot be called with an argument whose value is only known at run time.
- C: Its body may not contain loops or local variables, because it is `constexpr`.
- D: `square(3)` can size an array; with a runtime `n`, `square(n)` runs normally.

> A `constexpr` function may be evaluated at compile time when it is used where
> a constant expression is required and its arguments are constant
> expressions — so `int arr[square(3)];` or `std::array<int, square(3)>` work.
> Called with a runtime value it is an ordinary function call. The "single
> return statement" restriction was C++11's; since C++14 loops and local
> variables are allowed.

## cpp-intermediate-025
topic: const-correctness
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Box {
    int v = 1;
    int& get() { std::cout << "mut "; return v; }
    const int& get() const { std::cout << "const "; return v; }
};

int main() {
    Box b;
    const Box cb{};
    b.get();
    cb.get();
    const Box& r = b;
    r.get();
    std::cout << '\n';
}
```

- A: `mut const mut`
- B: `mut mut mut`
- C: `mut const const`
- D: `const const const`

> The overload is chosen by the constness of the expression the member is
> called on, not of the underlying object. `b` is non-const, so the non-const
> `get` wins; `cb` is const, so only the const overload is viable; and `r` is a
> reference to const, so it also calls the const overload even though it
> refers to the non-const `b`.
