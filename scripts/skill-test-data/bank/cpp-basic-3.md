---
skill: cpp
level: basic
---

## cpp-basic-051
topic: basics
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    bool a = 5;
    bool b = 0.0;
    int n = a + a + b;
    std::cout << n << " " << (a == true) << std::endl;
    return 0;
}
```

- A: `10 0`
- B: `2 1`
- C: `10 1`
- D: `1 1`

> Converting any non-zero number to `bool` gives `true`, and zero (including
> 0.0) gives `false`; a `bool` holds nothing else, so `a` does not remember the
> 5. In arithmetic a `bool` is promoted to `int` (`true` is 1), so `a + a + b`
> is the `int` 2 — it is not squeezed back into a `bool`. `a == true` is true,
> which streams as `1`.

## cpp-basic-052
topic: basics
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int x = 10;
    x *= 1.5;
    int y = 7;
    y /= 2.0;
    std::cout << x << " " << y << std::endl;
    return 0;
}
```

- A: `15 3.5`
- B: `10 3`
- C: `15 4`
- D: `15 3`

> `x *= 1.5` means `x = x * 1.5`: the multiplication is done in `double`
> (15.0), and only the result is converted back to `int`, so `x` is 15 — the
> 1.5 is not truncated to 1 first. `y /= 2.0` computes 3.5 and stores it in an
> `int`, which truncates to 3. `y` is still an `int`, so 3.5 can never be
> printed.

## cpp-basic-053
topic: basics
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int x = 0;
    if (x = 5) {
        std::cout << "yes " << x << std::endl;
    } else {
        std::cout << "no " << x << std::endl;
    }
    return 0;
}
```

- A: `yes 5`
- B: `no 0`
- C: `no 5`
- D: It does not compile: an `if` condition must be a comparison.

> `=` is assignment, not comparison. `x = 5` stores 5 in `x`, and the value of
> the assignment expression is that new value, 5, which converts to `true`.
> Any expression convertible to `bool` is a valid condition; compilers only
> warn, which is why `==` typos like this survive.

## cpp-basic-054
topic: pointers-references
answer: A, C

Given `int n = 4;`, which of these leave a pointer `p` pointing at `n`? Select all that apply.

- A: `int* p = &n;`
- B: `int* p = n;`
- C: `int* p; p = &n;`
- D: `int* p = &n; p++;`

> `&n` is the address of `n`; initialising `p` with it, or assigning it later,
> both make `p` point at `n`. B does not compile: an `int` variable cannot be
> converted to a pointer. D starts at `n`, but `p++` advances the pointer by
> one `int`, so it ends up pointing one past `n`, not at it.

## cpp-basic-055
topic: pointers-references
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int a = 1;
    int b = 2;
    int* p = &a;
    int** pp = &p;
    **pp = 10;
    *pp = &b;
    *p = 20;
    std::cout << a << " " << b << std::endl;
    return 0;
}
```

- A: `20 2`
- B: `10 2`
- C: `10 20`
- D: `1 20`

> `pp` points at the pointer `p`. `**pp` goes through both levels and reaches
> `a`, setting it to 10. `*pp` is `p` itself, so `*pp = &b` re-points `p` at
> `b`. The final `*p = 20` therefore writes to `b`, not `a`.

## cpp-basic-056
topic: pointers-references
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int& larger(int& a, int& b) {
    return a > b ? a : b;
}

int main() {
    int x = 3;
    int y = 7;
    larger(x, y) = 0;
    std::cout << x << " " << y << std::endl;
    return 0;
}
```

- A: `3 0`
- B: `3 7`
- C: `0 7`
- D: It does not compile: the result of a function call cannot be assigned to.

> `larger` returns a reference to whichever argument is larger — here the
> caller's `y` itself, not a copy of its value. A function returning `int&`
> yields an lvalue, so it may appear on the left of `=`, and the assignment
> writes 0 into `y`. (Returning a reference is safe here because it refers to
> the caller's variable, not to a local.)

## cpp-basic-057
topic: classes
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Engine {
    Engine() { std::cout << "E"; }
    ~Engine() { std::cout << "e"; }
};

struct Car {
    Engine engine;
    Car() { std::cout << "C"; }
    ~Car() { std::cout << "c"; }
};

int main() {
    {
        Car car;
    }
    std::cout << std::endl;
    return 0;
}
```

- A: `CEce`
- B: `ECce`
- C: `ECec`
- D: `CEec`

> Members are fully constructed before the body of the class's constructor
> runs, so `Engine()` prints before `Car()`. Destruction mirrors it: the body
> of `~Car` runs first, and the members are destroyed after it, so `c` comes
> before `e`.

## cpp-basic-058
topic: classes
answer: C

Which member function fails to compile, and why?

```cpp
class Config {
    int level = 1;
    static int count;
public:
    static int a() { return count; }
    static int b() { return level; }
    int c() const { return count + level; }
};

int Config::count = 0;
```

- A: `a`, because a static function is not allowed to read a static member.
- B: `c`, because a non-static function is not allowed to read a static member.
- C: `b`, because a static function has no `this` to read `level` from.
- D: `c`, because a `const` function is not allowed to read a static member.

> A static member function is not called on an object, so it has no `this`
> and no object whose `level` it could read. It can use static members such
> as `count` freely. Ordinary member functions — `const` or not — can read both
> static and non-static members.

## cpp-basic-059
topic: classes
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Note {
    Note() { std::cout << "N"; }
    Note(const Note&) { std::cout << "C"; }
    ~Note() { std::cout << "D"; }
};

void take(Note n) {}
void look(const Note& n) {}

int main() {
    Note a;
    take(a);
    look(a);
    std::cout << "|";
    return 0;
}
```

- A: `NCDCD|D`
- B: `N|D`
- C: `NC|DD`
- D: `NCD|D`

> `a` is default-constructed: `N`. Passing it by value copy-constructs the
> parameter `n` (`C`), and that copy is destroyed by the time the call
> statement `take(a);` is finished (`D`). A `const` reference binds to `a`
> itself, so `look` copies nothing. `a` is destroyed when `main` returns,
> after the `|`.

## cpp-basic-060
topic: inheritance
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Report {
    void print() { std::cout << header() << "-" << body() << std::endl; }
    virtual const char* header() { return "R"; }
    const char* body() { return "r"; }
    virtual ~Report() {}
};

struct Sales : Report {
    const char* header() override { return "S"; }
    const char* body() { return "s"; }
};

int main() {
    Sales s;
    s.print();
    return 0;
}
```

- A: `S-r`
- B: `S-s`
- C: `R-r`
- D: `R-s`

> `print` is `Report`'s function, so inside it the calls go through a
> `Report*` (`this`). `header` is virtual, so the call dispatches on the real
> object, a `Sales`, and returns `"S"`. `body` is not virtual, so the call is
> bound at compile time to `Report::body`; `Sales::body` only hides it for
> calls made directly on a `Sales`.

## cpp-basic-061
topic: inheritance
answer: B, C

Which members of `Base` can the body of `Derived::sum` use? Select all that apply.

```cpp
class Base {
private:
    int secret = 1;
protected:
    int shared = 2;
public:
    int open = 3;
};

class Derived : public Base {
public:
    int sum();
};
```

- A: `secret`
- B: `shared`
- C: `open`
- D: `Base::secret`

> `private` members are accessible only inside `Base` itself (and its
> friends), never in a derived class — and qualifying the name as
> `Base::secret` does not change its access. `protected` members exist for
> exactly this case: derived classes may use them, outside code may not.
> `public` members are usable everywhere.

## cpp-basic-062
topic: inheritance
answer: B

What happens when this code is compiled?

```cpp
struct Shape {
    int sides;
    Shape(int n) : sides(n) {}
};

struct Square : Shape {
    Square() { sides = 4; }
};

int main() {
    Square s;
    return 0;
}
```

- A: It compiles, and `s.sides` is 4.
- B: It does not compile, because `Shape` has no default constructor.
- C: It compiles; `Shape` sets `sides` to 0, then `Square` sets it to 4.
- D: It does not compile, because `Square` cannot assign to a `Shape` member.

> The base part is constructed before the derived constructor's body runs.
> `Square()` does not name a base constructor in its initialiser list, so the
> compiler tries `Shape()`, which does not exist because `Shape` declares
> `Shape(int)`. The fix is `Square() : Shape(4) {}`. Assigning to the public
> inherited member `sides` would itself be fine.

## cpp-basic-063
topic: stl-containers
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

int main() {
    std::string s = "banana";
    bool missing = s.find("x") == std::string::npos;
    std::cout << s.find("an") << " " << s.rfind("an") << " " << missing << std::endl;
    return 0;
}
```

- A: `2 4 1`
- B: `1 1 1`
- C: `1 3 1`
- D: `1 3 0`

> `find` returns the 0-based index of the first occurrence (`b-an-ana`: 1) and
> `rfind` the index of the last (`ban-an-a`: 3). When the text is absent, both
> return the special value `std::string::npos`, so the comparison is `true`,
> printed as `1`.

## cpp-basic-064
topic: stl-containers
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{10, 20, 30, 40};
    v.erase(v.begin() + 1);
    v.insert(v.begin(), 5);
    std::cout << v.size() << " " << v[1] << " " << v[2] << std::endl;
    return 0;
}
```

- A: `4 20 30`
- B: `5 10 20`
- C: `3 30 40`
- D: `4 10 30`

> `v.begin() + 1` refers to the element at index 1, so `erase` removes 20 and
> shifts the rest down: {10, 30, 40}. `insert` puts 5 before the given
> position, shifting everything up rather than overwriting: {5, 10, 30, 40}.

## cpp-basic-065
topic: stl-containers
answer: B

You need to store words so that each word is kept only once and iterating gives them in sorted order, with no extra code. Which container does this?

- A: `std::vector<std::string>`
- B: `std::set<std::string>`
- C: `std::unordered_set<std::string>`
- D: `std::multiset<std::string>`

> `std::set` ignores an insert of a value it already holds and always iterates
> in ascending order. `std::unordered_set` also keeps values unique but
> iterates in no particular order; `std::multiset` is sorted but keeps
> duplicates; a `vector` does neither by itself.

## cpp-basic-066
topic: stl-algorithms
answer: A
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{4, 9, 2, 9, 1};
    auto it = std::max_element(v.begin(), v.end());
    std::cout << *it << " " << (it - v.begin()) << std::endl;
    return 0;
}
```

- A: `9 1`
- B: `9 3`
- C: `9 2`
- D: `1 4`

> `std::max_element` returns an iterator (not the value) to the largest
> element; when several elements tie for largest, it returns the first of
> them. Dereferencing gives 9, and subtracting `begin()` gives its 0-based
> index, 1.

## cpp-basic-067
topic: stl-algorithms
answer: C
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words{"pear", "fig", "apple", "banana"};
    std::sort(words.begin(), words.end());
    std::cout << words.front() << " " << words.back() << std::endl;
    return 0;
}
```

- A: `fig banana`
- B: `pear banana`
- C: `apple pear`
- D: `pear apple`

> With no comparator, `std::sort` orders with `<`, which for `std::string` is
> lexicographic (dictionary) order, not length: apple, banana, fig, pear. It
> sorts ascending, so `front()` is the smallest and `back()` the largest.

## cpp-basic-068
topic: stl-algorithms
answer: D

Given `int a[5] = {4, 2, 5, 1, 3};`, which call sorts all five elements?

- A: `std::sort(a, a + 4);`
- B: `std::sort(a[0], a[4]);`
- C: `std::sort(&a[0], &a[4]);`
- D: `std::sort(a, a + 5);`

> Pointers into an array work as iterators, and algorithms take half-open
> ranges `[first, last)`: `last` must be one past the final element, which is
> `a + 5`. A and C both stop at `a[4]` and leave the last element out of the
> sort. B passes two `int` values, which are not iterators, so it does not
> compile.

## cpp-basic-069
topic: const-correctness
answer: A

This code does not compile. Why?

```cpp
#include <iostream>

class Timer {
    int ticks = 0;
public:
    int read() { return ticks; }
};

void show(const Timer& t) {
    std::cout << t.read() << std::endl;
}
```

- A: `read` is not marked `const`, so it cannot be called on a `const Timer`.
- B: `ticks` is private, so `show` cannot call `read`, which returns it.
- C: A `const` reference cannot be used to call any member function at all.
- D: `read` returns `ticks` by value, which a `const` object does not allow.

> Through a `const Timer&`, only `const` member functions may be called, and
> `read` was not declared `const` even though it changes nothing. Writing
> `int read() const { return ticks; }` fixes it. `read` is public, so its use
> of the private `ticks` is not `show`'s concern, and returning a copy is fine.

## cpp-basic-070
topic: const-correctness
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    const int limit = 10;
    int copy = limit;
    copy += 5;
    const int* p = &limit;
    int other = 3;
    p = &other;
    std::cout << copy << " " << *p << std::endl;
    return 0;
}
```

- A: `15 10`
- B: `15 3`
- C: `10 3`
- D: It does not compile.

> `copy` is a separate, non-const `int` that merely starts with `limit`'s
> value, so it can be changed. `p` is a pointer to `const int`: the `int`
> cannot be modified through it, but the pointer itself is not `const`, so it
> may be re-pointed — and a `const int*` may point at a non-const `int`.

## cpp-basic-071
topic: const-correctness
answer: C

Given the declarations below, which statement fails to compile?

```cpp
int n = 4;
const int k = 7;
```

- A: `const int m = n;`
- B: `int x = k;`
- C: `int* p = &k;`
- D: `const int* q = &n;`

> `&k` has type `const int*`. Converting it to `int*` would drop the `const`
> and allow writing to `k` through `p`, so it is refused. Initialising a
> `const` from a non-const value (A) and copying a `const`'s value into a
> plain `int` (B) are fine, and adding `const` to the pointed-to type (D) is
> always allowed.

## cpp-basic-072
topic: memory
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <memory>

struct File {
    File() { std::cout << "open "; }
    ~File() { std::cout << "close "; }
};

int main() {
    {
        std::unique_ptr<File> f = std::make_unique<File>();
        std::cout << "use ";
    }
    std::cout << "done" << std::endl;
    return 0;
}
```

- A: `open use done`
- B: `open use done close`
- C: `open close use done`
- D: `open use close done`

> A `std::unique_ptr` owns the heap object and deletes it in its own
> destructor. `f` is a local, so it is destroyed at the closing brace of its
> block, and that destroys the `File` — before `done` is printed. This is
> RAII: no explicit `delete`, and no leak.

## cpp-basic-073
topic: memory
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int* make(int v) {
    int* p = new int(v);
    return p;
}

int main() {
    int* a = make(5);
    int* b = make(7);
    *a += *b;
    std::cout << *a << " " << *b << std::endl;
    delete a;
    delete b;
    return 0;
}
```

- A: `12 7`
- B: `5 7`
- C: `12 12`
- D: The behaviour is undefined: each `int` is destroyed when `make` returns.

> Only the local pointer `p` dies when `make` returns. The `int` it points to
> was created with `new`, so it lives on the heap until `delete` — returning
> its address is safe, unlike returning the address of a local variable. `a`
> and `b` point at two separate `int`s, so only the first becomes 12.

## cpp-basic-074
topic: memory
answer: B

What does `int* p = new int(5);` create?

- A: An array of five `int`s on the heap, all set to 0.
- B: One `int` on the heap, initialised to 5.
- C: An array of five `int`s on the heap, left uninitialised.
- D: One `int` on the stack, initialised to 5.

> Parentheses after the type give an initial value; square brackets give an
> element count. `new int(5)` allocates a single `int` with the value 5 (to be
> released with `delete p;`), whereas `new int[5]` would allocate five
> uninitialised `int`s (released with `delete[]`). `new` always allocates
> dynamic (heap) storage; only the pointer `p` is a local.

## cpp-basic-075
topic: modern
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    auto a = v;
    auto& b = v;
    a.push_back(4);
    a.push_back(6);
    b.push_back(5);
    std::cout << v.size() << " " << a.size() << std::endl;
    return 0;
}
```

- A: `6 6`
- B: `3 5`
- C: `4 5`
- D: `5 4`

> Plain `auto` deduces a value type, so `a` is a new `std::vector<int>` — a
> full copy of `v`. `auto&` deduces a reference, so `b` is another name for
> `v`. The two pushes on `a` leave `v` alone (`a` has 5 elements), and the push
> through `b` grows `v` to 4.
