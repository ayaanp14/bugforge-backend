---
skill: cpp
level: intermediate
---

## cpp-intermediate-051
topic: memory
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <memory>
#include <utility>

struct R {
    int id;
    explicit R(int i) : id(i) {}
    ~R() { std::cout << '~' << id << ' '; }
};

void run() {
    auto p = std::make_unique<R>(1);
    auto q = std::move(p);
    std::cout << (p ? "p " : "null ");
    q.reset(new R(2));
    std::cout << "end ";
}

int main() {
    run();
    std::cout << '\n';
}
```

- A: `null ~1 end ~2`
- B: `p ~1 end ~2`
- C: `null end ~1 ~2`
- D: `null end ~2 ~1`

> Moving a `unique_ptr` transfers ownership and is specified to leave the
> source null, so `p` tests false. `reset` takes ownership of the new object
> and destroys the one it held at once — `~1` prints before `end`. The second
> object is destroyed when `q` goes out of scope at the end of `run`.

## cpp-intermediate-052
topic: memory
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <memory>

struct Node {
    std::shared_ptr<Node> next;
    ~Node() { std::cout << "~Node "; }
};

int main() {
    {
        auto a = std::make_shared<Node>();
        auto b = std::make_shared<Node>();
        a->next = b;
        b->next = a;
        std::cout << a.use_count() << b.use_count() << ' ';
    }
    std::cout << "done\n";
}
```

- A: `22 done`
- B: `22 ~Node ~Node done`
- C: `11 ~Node ~Node done`
- D: `21 ~Node done`

> Each node is owned by a local variable and by the other node's `next`, so
> both counts are 2. When the locals go out of scope each count only drops to
> 1: the two nodes keep each other alive, neither destructor ever runs, and the
> memory leaks. Breaking the cycle with a `std::weak_ptr` for one direction
> (for example a back-pointer) fixes it.

## cpp-intermediate-053
topic: memory
answer: B

What is a real advantage of `std::make_shared<Widget>(args)` over `std::shared_ptr<Widget>(new Widget(args))`?

- A: It lets you pass a custom deleter, which the `new` form does not support.
- B: It allocates the `Widget` and its control block in a single allocation.
- C: The `Widget`'s memory is released even while `weak_ptr`s to it still exist.
- D: The pointer it returns is not reference-counted, so copies are cheaper.

> `make_shared` makes one allocation holding both the object and the reference
> counts, where the `new` form needs two — faster, and better for locality. It
> does not accept a deleter (the `new` form does). Its trade-off is the
> opposite of C: because the object shares the block with the counts, its
> memory is only released when the last `weak_ptr` is gone too (the destructor
> still runs when the last owner dies). Every `shared_ptr` is reference-counted.

## cpp-intermediate-054
topic: move-semantics
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <utility>

void sink(const std::string&) { std::cout << "copy "; }
void sink(std::string&&) { std::cout << "move "; }

template <typename T>
void relay(T&& x) { sink(std::forward<T>(x)); }

template <typename T>
void relayNoForward(T&& x) { sink(x); }

int main() {
    std::string s = "x";
    relay(s);
    relay(std::string("y"));
    relayNoForward(std::string("z"));
    std::cout << '\n';
}
```

- A: `copy move move`
- B: `move move move`
- C: `copy copy copy`
- D: `copy move copy`

> `T&&` on a deduced `T` is a forwarding reference. For the lvalue `s`, `T` is
> `std::string&` and `std::forward` yields an lvalue: copy. For the temporary,
> `T` is `std::string` and `std::forward` yields an rvalue: move. Without
> `std::forward`, `x` is a named variable — an lvalue — whatever was passed in,
> so `relayNoForward` always picks the copying overload.

## cpp-intermediate-055
topic: move-semantics
answer: A
run: cpp

In C++17, what does this program print?

```cpp
#include <iostream>

struct W {
    W() { std::cout << 'D'; }
    W(const W&) { std::cout << 'C'; }
    W(W&&) { std::cout << 'M'; }
};

W make() { return W(); }

int main() {
    W a = make();
    W b = W();
    std::cout << '\n';
}
```

- A: `DD`
- B: `DMDM`
- C: `DMMDM`
- D: `DCDC`

> Since C++17, a prvalue is not a temporary that gets copied or moved: it
> initialises its final destination directly. `return W();` initialises the
> function's result, which initialises `a`; `W b = W();` initialises `b`. Each
> needs only the default constructor, and this is guaranteed by the language,
> not an optimisation. Without elision the same code would print `DMMDM`.

## cpp-intermediate-056
topic: move-semantics
answer: C

```cpp
std::vector<int> build() {
    std::vector<int> result(1000, 7);
    return std::move(result);
}
```

Compared with writing `return result;`, what does the `std::move` change?

- A: Nothing; the two forms are equivalent and compile to the same code.
- B: It is needed, or `result` would be copied into the return value.
- C: It rules out copy elision (NRVO) and forces a move construction instead.
- D: It returns a reference to `result`, which dangles after the function returns.

> Copy elision of a returned local (NRVO) is only allowed when the return
> expression is the plain name of the local. `std::move(result)` is a
> different expression, so the compiler must construct the return value with
> the move constructor. Plain `return result;` is never a copy either: when
> elision does not happen, a returned local is treated as an rvalue and moved
> automatically. So `return std::move(local);` can only make things worse.

## cpp-intermediate-057
topic: templates
answer: A
run: cpp

What does this program print?

```cpp
#include <cstddef>
#include <iostream>

template <typename T, std::size_t N>
std::size_t length(const T (&)[N]) { return N; }

int main() {
    int a[] = {4, 5, 6, 7};
    char s[] = "hey";
    std::cout << length(a) << ' ' << length(s) << ' ' << length("hello") << '\n';
}
```

- A: `4 4 6`
- B: `4 3 5`
- C: `4 3 6`
- D: `4 4 5`

> A reference-to-array parameter keeps the array's bound, so `N` is deduced
> from the array type. `a` is `int[4]`. A character array initialised from a
> string literal includes the terminating null, so `s` is `char[4]`, and the
> literal `"hello"` itself has type `const char[6]`.

## cpp-intermediate-058
topic: templates
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

template <typename T> void show(T)  { std::cout << "T "; }
template <typename T> void show(T*) { std::cout << "T* "; }
void show(int) { std::cout << "int "; }

int main() {
    int x = 0;
    show(x);
    show(&x);
    show(2.0);
    show<int>(x);
    std::cout << '\n';
}
```

- A: `int T* T int`
- B: `T T* T T`
- C: `int T* T T`
- D: `int T T T`

> `show(x)`: the non-template and `show<int>(T)` are both exact matches, and a
> tie goes to the non-template. `show(&x)`: both templates match exactly, and
> partial ordering prefers the more specialised `show(T*)`. `show(2.0)`: the
> template is an exact match, which beats converting `double` to `int`.
> `show<int>(x)` names template arguments explicitly, so only template
> specialisations are candidates and `show<int>(T)` is called.

## cpp-intermediate-059
topic: inheritance
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct A {
    A() { std::cout << "A"; }
    virtual ~A() { std::cout << "~A"; }
};

struct B : A {
    B() { std::cout << "B"; }
    ~B() override { std::cout << "~B"; }
};

int main() {
    A* p = new B;
    delete p;
    std::cout << '\n';
}
```

- A: `AB~A`
- B: `AB~A~B`
- C: `BA~B~A`
- D: `AB~B~A`

> Construction runs base first, then derived. Because `~A` is virtual,
> `delete` through an `A*` dispatches to `~B`, and destruction runs in reverse:
> the derived destructor body, then the base destructor. Without the virtual
> destructor, this `delete` would be undefined behaviour.

## cpp-intermediate-060
topic: inheritance
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Base {
    void print(int) { std::cout << "Base:int "; }
};

struct Derived : Base {
    void print(double) { std::cout << "Derived:double "; }
};

int main() {
    Derived d;
    d.print(1);
    static_cast<Base&>(d).print(1);
    std::cout << '\n';
}
```

- A: `Base:int Base:int`
- B: `Derived:double Base:int`
- C: `Base:int Derived:double`
- D: It does not compile: the call `d.print(1)` is ambiguous.

> Name lookup stops at the first scope that declares the name: `Derived::print`
> hides every `Base::print`, so `d.print(1)` only sees `print(double)` and
> converts 1 to `double`. Through a `Base&`, lookup starts in `Base` and finds
> `print(int)`. Adding `using Base::print;` to `Derived` would bring the base
> overload back into the overload set.

## cpp-intermediate-061
topic: inheritance
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Shape {
    virtual ~Shape() = default;
    virtual std::string name() const = 0;
};

std::string Shape::name() const { return "shape"; }

struct Circle : Shape {
    std::string name() const override { return "circle/" + Shape::name(); }
};

int main() {
    Circle c;
    const Shape& s = c;
    std::cout << s.name() << '\n';
}
```

- A: It does not compile: a pure virtual function cannot have a body.
- B: `circle`
- C: `circle/shape`
- D: `shape`

> A pure virtual function may still be defined (out of the class body). It
> keeps the class abstract and is never chosen by a virtual call, but a
> derived class can call it with a qualified name, `Shape::name()`, as a
> default implementation. The virtual call `s.name()` goes to `Circle::name`.

## cpp-intermediate-062
topic: stl-containers
answer: B
run: cpp

What does this program print?

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{2, 4, 5, 6, 8};
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] % 2 == 0) v.erase(v.begin() + i);
    }
    for (int x : v) std::cout << x << ' ';
    std::cout << '\n';
}
```

- A: `5`
- B: `4 5 8`
- C: `5 8`
- D: `4 5`

> After `erase` the following elements shift left by one, but the loop still
> increments `i`, so the element that slid into position `i` is never checked.
> Erasing 2 moves 4 into index 0, which is skipped; erasing 6 moves 8 into
> index 2, and the loop then ends. Increment only when nothing was erased, or
> use the erase–remove idiom.

## cpp-intermediate-063
topic: stl-containers
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<int, std::string> m;
    m.insert({1, "one"});
    m.insert({1, "uno"});
    m[2] = "two";
    m[2] = "dos";
    std::cout << m[1] << ' ' << m[2] << ' ' << m.size() << '\n';
}
```

- A: `uno dos 2`
- B: `one two 2`
- C: `uno two 2`
- D: `one dos 2`

> `insert` does nothing when the key already exists (it returns the existing
> element and `false`), so key 1 keeps `"one"`. `operator[]` returns a
> reference to the element, inserting it if needed, and assignment through it
> overwrites — so key 2 ends up `"dos"`. Use `insert_or_assign` to overwrite
> with insert-like syntax.

## cpp-intermediate-064
topic: stl-algorithms
answer: A
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<int, char>> v{{2, 'a'}, {1, 'b'}, {2, 'c'}, {1, 'd'}, {0, 'e'}};
    std::stable_sort(v.begin(), v.end(),
                     [](const auto& x, const auto& y) { return x.first < y.first; });
    for (const auto& p : v) std::cout << p.second;
    std::cout << '\n';
}
```

- A: `ebdac`
- B: `edbca`
- C: `ebdca`
- D: `edbac`

> The comparator looks only at `first`, so elements with equal keys are
> equivalent. `stable_sort` guarantees that equivalent elements keep their
> original relative order: among the 1s, `b` came before `d`; among the 2s,
> `a` came before `c`. `std::sort` makes no such promise.

## cpp-intermediate-065
topic: stl-algorithms
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<double> v{0.5, 1.5, 2.5};
    std::cout << std::accumulate(v.begin(), v.end(), 0) << ' '
              << std::accumulate(v.begin(), v.end(), 0.0) << '\n';
}
```

- A: `4.5 4.5`
- B: `4 4.5`
- C: `3 4.5`
- D: `3.5 4.5`

> `accumulate`'s running total has the type of the initial value. With `0` it
> is an `int`, and every partial sum is truncated as it is stored back:
> 0 + 0.5 → 0, 0 + 1.5 → 1, 1 + 2.5 → 3. Passing `0.0` keeps the total a
> `double` and gives 4.5.

## cpp-intermediate-066
topic: stl-algorithms
answer: D
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5};
    auto r = std::find(v.rbegin(), v.rend(), 2);
    std::cout << *r << ' ' << *r.base() << ' ' << (r.base() - v.begin()) << '\n';
}
```

- A: `2 2 1`
- B: `2 3 1`
- C: `2 2 2`
- D: `2 3 2`

> `r` refers to the element 2 (index 1). A reverse iterator's `base()` is the
> forward iterator one position after the element it refers to — index 2,
> which holds 3. That off-by-one is why erasing through a reverse iterator is
> written `v.erase(std::next(r).base())`.

## cpp-intermediate-067
topic: undefined-behaviour
answer: C

```cpp
std::vector<int> v{1, 2, 3};
for (int x : v) {
    if (x == 2) v.push_back(4);
}
```

What does the standard say about this loop?

- A: It appends one `4`, and the loop then visits that `4` as well.
- B: It appends one `4`; the loop's end was fixed at the start, so the `4` is skipped.
- C: It is undefined behaviour: `push_back` invalidates the loop's hidden iterators.
- D: It does not compile: a range-`for` makes `v` const inside its body.

> A range-`for` keeps a begin and an end iterator for `v`. `push_back` always
> invalidates the past-the-end iterator, and when it reallocates (as it
> typically does when a vector built from three values grows) it invalidates
> every iterator. Either way the loop goes on to compare or dereference invalid
> iterators, which is undefined behaviour. Collect the new elements
> separately, or loop by index over a size you fix beforehand.

## cpp-intermediate-068
topic: undefined-behaviour
answer: A

```cpp
#include <iostream>
#include <string>
#include <string_view>

std::string greeting() { return "hello, world"; }

int main() {
    std::string_view a = greeting();
    std::string b = greeting();
    std::string_view c = b;
    const std::string& d = greeting();
    std::cout << a << c << d << '\n';
}
```

Which variable is read with undefined behaviour on the last line?

- A: `a`
- B: `b`
- C: `c`
- D: `d`

> A `string_view` does not own characters; it points into someone else's
> buffer. `a` views the temporary `std::string` returned by `greeting()`, which
> is destroyed at the end of that declaration, so `a` dangles. `c` views `b`,
> which is still alive. `d` binds the temporary directly to a const reference,
> which extends its lifetime to that of `d`.

## cpp-intermediate-069
topic: modern
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int x = 10;
    const int& cr = x;
    auto a = cr;
    auto& b = cr;
    decltype(auto) c = cr;
    a = 20;
    x = 30;
    std::cout << a << ' ' << b << ' ' << c << '\n';
}
```

- A: `30 30 30`
- B: `20 30 10`
- C: It does not compile: `a` is deduced as `const int`, so `a = 20` fails.
- D: `20 30 30`

> Plain `auto` deduces like a by-value template parameter: it drops the
> reference and the top-level `const`, so `a` is an independent `int` copy.
> `auto&` keeps the `const` and gives `const int&` referring to `x`, and
> `decltype(auto)` takes the declared type of `cr`, `const int&`, exactly. So
> `b` and `c` both see `x = 30`.

## cpp-intermediate-070
topic: modern
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>
#include <variant>

int main() {
    std::variant<int, std::string> v = 7;
    std::cout << v.index() << ' ';
    v = std::string("abc");
    std::cout << v.index() << ' ' << std::holds_alternative<int>(v) << ' ';
    try {
        std::cout << std::get<int>(v);
    } catch (const std::bad_variant_access&) {
        std::cout << "bad";
    }
    std::cout << '\n';
}
```

- A: `0 1 0 0`
- B: `0 1 1 bad`
- C: `0 1 0 bad`
- D: `1 2 0 bad`

> `index()` is the zero-based position of the active alternative: `int` is 0,
> `std::string` is 1. Assigning a string switches the active alternative, so
> `holds_alternative<int>` is false. `std::get<int>` on a variant that does
> not hold an `int` throws `std::bad_variant_access` rather than returning a
> default value.

## cpp-intermediate-071
topic: modern
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <memory>
#include <utility>

int main() {
    auto p = std::make_unique<int>(7);
    auto f = [q = std::move(p)] { return *q * 2; };
    std::cout << f() << ' ' << (p == nullptr) << '\n';
}
```

- A: `14 1`
- B: `14 0`
- C: `7 1`
- D: It does not compile: a lambda cannot capture a move-only type.

> An init-capture (C++14) declares a new member of the closure and initialises
> it from any expression — here by moving the `unique_ptr` in. The lambda now
> owns the `int` (the closure itself becomes move-only), and `p` is left null,
> as a moved-from `unique_ptr` always is.

## cpp-intermediate-072
topic: const-correctness
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

class Stats {
    std::vector<int> data{3, 1, 2};
    mutable int calls = 0;
public:
    int sum() const {
        ++calls;
        int s = 0;
        for (int x : data) s += x;
        return s;
    }
    int callCount() const { return calls; }
};

int main() {
    const Stats s{};
    s.sum();
    s.sum();
    int total = s.sum();
    std::cout << total << ' ' << s.callCount() << '\n';
}
```

- A: `6 3`
- B: It does not compile: `sum()` modifies a member inside a `const` function.
- C: `6 0`
- D: `6 2`

> A `mutable` member may be modified even through a `const` object or inside a
> `const` member function. It is meant for state that is not part of the
> object's observable value — counters, caches, mutexes — so `sum()` can stay
> `const` while recording that it was called. Three calls leave `calls` at 3.

## cpp-intermediate-073
topic: const-correctness
answer: B, D

```cpp
#include <cstddef>
#include <vector>

class Account {
    int balance = 0;
    std::vector<int> log;
public:
    // one of the member functions below goes here
};
```

Which member function definitions compile when placed in `Account`? Select all that apply.

- A: `int& balanceRef() const { return balance; }`
- B: `const int& balanceRef() const { return balance; }`
- C: `void record(int x) const { log.push_back(x); }`
- D: `std::size_t entries() const { return log.size(); }`
- E: `int* raw() const { return &balance; }`

> Inside a `const` member function, `this` points to a const object, so
> `balance` is a `const int` and `log` a `const std::vector<int>`. A cannot
> bind an `int&` to a `const int`, and E cannot convert `const int*` to
> `int*`. C calls the non-const `push_back` on a const vector. B returns a
> const reference, and D calls the const member `size()`, so both compile.

## cpp-intermediate-074
topic: classes
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Counter {
    int n = 0;
    Counter& operator++() { ++n; return *this; }
    Counter operator++(int) { Counter old = *this; ++n; return old; }
};

int main() {
    Counter c;
    Counter a = c++;
    Counter b = ++c;
    std::cout << a.n << ' ' << b.n << ' ' << c.n << '\n';
}
```

- A: `1 2 2`
- B: `0 2 2`
- C: `0 1 2`
- D: `1 1 2`

> The `int` parameter marks the postfix form, which by convention returns a
> copy of the old value: `a` gets the state before the increment, 0, while `c`
> becomes 1. The prefix form increments first and returns the object itself,
> so `b` copies `c` at 2.

## cpp-intermediate-075
topic: classes
answer: B

```cpp
#include <string>

class Widget {
public:
    Widget(const Widget& other);
    // no other special member function is declared
private:
    std::string name;
};
```

Which special member functions does the compiler still declare implicitly for `Widget`?

- A: The default constructor, the copy assignment operator and the destructor
- B: The copy assignment operator and the destructor only
- C: The default constructor, both move operations, copy assignment and the destructor
- D: The move constructor, the move assignment operator and the destructor

> Declaring any constructor, a copy constructor included, suppresses the
> implicit default constructor. A user-declared copy constructor also
> suppresses the implicit move constructor and move assignment (moves of a
> `Widget` will copy). The copy assignment operator is still implicitly
> declared — deprecated in this situation, but present — and so is the
> destructor.
