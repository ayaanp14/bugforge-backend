---
skill: cpp
level: basic
---

## cpp-basic-026
topic: basics
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    std::cout << (-7 / 2) << " " << (-7 % 2) << " " << (7 % -2) << std::endl;
    return 0;
}
```

- A: `-3 -1 1`
- B: `-4 1 -1`
- C: `-3 1 1`
- D: `-4 -1 -1`

> Since C++11 integer division truncates toward zero, so -7 / 2 is -3 (not
> -4). The remainder is defined so that `(a / b) * b + a % b == a`, which gives
> it the sign of the left operand: -7 % 2 is -1 and 7 % -2 is 1. Python floors
> instead, which is where -4, 1 and -1 come from.

## cpp-basic-027
topic: basics
answer: C

Which expression evaluates to 2.5?

- A: `5 / 2`
- B: `5 / 2 * 1.0`
- C: `5.0 / 2`
- D: `static_cast<double>(5 / 2)`

> An arithmetic operator converts to `double` only when one of its own
> operands is a `double`. In `5.0 / 2` it is, so the division is done in
> floating point: 2.5. In the others `5 / 2` is evaluated first as integer
> division, giving 2, and converting that 2 to `double` afterwards (by
> multiplying by 1.0 or casting) gives 2.0.

## cpp-basic-028
topic: basics
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    double d = 9.99;
    int a = d;
    int b = static_cast<int>(-d);
    int c = static_cast<int>(d + 0.5);
    std::cout << a << " " << b << " " << c << std::endl;
    return 0;
}
```

- A: `10 -10 10`
- B: `9 -10 10`
- C: `9 -9 9`
- D: `9 -9 10`

> Converting a floating-point value to an integer discards the fractional part
> — it truncates toward zero, it does not round. 9.99 becomes 9 and -9.99
> becomes -9 (not -10, which flooring would give). Adding 0.5 first is the
> classic way to round a positive value: 10.49 truncates to 10.

## cpp-basic-029
topic: pointers-references
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int a[] = {5, 10, 15};
    int* p = a;
    int x = *p++;
    (*p)++;
    std::cout << x << " " << a[0] << " " << a[1] << " " << *p << std::endl;
    return 0;
}
```

- A: `5 7 10 7`
- B: `5 5 11 11`
- C: `10 5 11 11`
- D: `5 6 11 11`

> Postfix `++` binds tighter than unary `*`, so `*p++` is `*(p++)`: it reads
> the element `p` points to (5) and then advances the pointer to `a[1]`; the
> array is untouched. `(*p)++` increments the element itself, so `a[1]` becomes
> 11, and `p` still points at it.

## cpp-basic-030
topic: pointers-references
answer: A

Which statement about a C++ reference such as `int& r = x;` is true?

- A: It must be bound when declared and can never refer to another object.
- B: It can be declared without an initialiser and bound to an object later.
- C: Assigning another variable to it makes it refer to that variable instead.
- D: It holds its own copy of `x`'s value, taken when it was declared.

> A reference is an alias. It has to be initialised in its declaration, and it
> can never be re-seated: `r = y;` assigns `y`'s value to `x`, it does not make
> `r` refer to `y`. Reading or writing `r` reads or writes `x` itself — there is
> no separate copy.

## cpp-basic-031
topic: pointers-references
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

void swapPointers(int* x, int* y) {
    int* t = x;
    x = y;
    y = t;
}

void swapValues(int* x, int* y) {
    int t = *x;
    *x = *y;
    *y = t;
}

int main() {
    int a = 1;
    int b = 2;
    swapPointers(&a, &b);
    std::cout << a << b << " ";
    swapValues(&a, &b);
    std::cout << a << b << std::endl;
    return 0;
}
```

- A: `21 12`
- B: `12 12`
- C: `12 21`
- D: `21 21`

> The pointers themselves are passed by value. `swapPointers` only swaps its
> local copies of the two addresses, so `a` and `b` are untouched and `12` is
> printed. `swapValues` dereferences the pointers and swaps the objects they
> point to, so the second print shows `21`.

## cpp-basic-032
topic: pointers-references
answer: B

Inside `fill`, what is the type of the parameter `arr`?

```cpp
void fill(int arr[10]) {
    // ...
}
```

- A: `int[10]`, an array holding a copy of the caller's ten elements.
- B: `int*`, a pointer to the first element of the caller's array.
- C: `int[10]`, the caller's own array passed by reference.
- D: `const int*`, a pointer that cannot modify the caller's elements.

> A function parameter declared as an array is adjusted to a pointer:
> `int arr[10]` means exactly `int* arr`, and the 10 is ignored. The caller's array
> decays to a pointer to its first element, so writes through `arr` change the
> caller's array, and `sizeof(arr)` inside `fill` is the size of a pointer.

## cpp-basic-033
topic: classes
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Widget {
    static int made;
    Widget() { made++; }
};

int Widget::made = 0;

void use(Widget w) {}

int main() {
    Widget a;
    Widget b = a;
    use(a);
    Widget c;
    std::cout << Widget::made << std::endl;
    return 0;
}
```

- A: `4`
- B: `3`
- C: `1`
- D: `2`

> Only `a` and `c` are default-constructed. `b` and the by-value parameter `w`
> are copies of `a`, and a copy is made by the copy constructor — here the one
> the compiler generates, which copies members and never runs `Widget()`. Four
> objects exist in total, but only two constructions incremented `made`.

## cpp-basic-034
topic: classes
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

class Total {
    int sum = 0;
public:
    Total& add(int n) {
        sum += n;
        return *this;
    }
    Total addCopy(int n) {
        sum += n;
        return *this;
    }
    int value() const { return sum; }
};

int main() {
    Total t;
    t.add(1).add(2);
    t.addCopy(10).addCopy(100);
    std::cout << t.value() << std::endl;
    return 0;
}
```

- A: `13`
- B: `113`
- C: `3`
- D: `103`

> `add` returns `*this` by reference, so the chained call works on `t` again:
> `sum` becomes 3. `addCopy` is called on `t` first, making `sum` 13, but it
> returns `*this` by value — a copy — so the second `addCopy(100)` changes that
> temporary copy, not `t`.

## cpp-basic-035
topic: classes
answer: B

Which statement about this code is true?

```cpp
class Point {
public:
    int x;
    int y;
    Point(int a, int b) : x(a), y(b) {}
};

int main() {
    Point p;
    Point q(1, 2);
    return 0;
}
```

- A: It compiles, and `p.x` and `p.y` are both 0.
- B: `Point p;` does not compile, because `Point` has no default constructor.
- C: It compiles, but `p.x` and `p.y` hold indeterminate values.
- D: It does not compile, because `x` and `y` must be set in the constructor body.

> The compiler generates a default constructor only for a class that declares
> no constructors at all. Declaring `Point(int, int)` suppresses it, so
> `Point p;` has no constructor to call. Adding `Point() = default;` (or default
> arguments) would fix it. The member initialiser list is a perfectly good
> place to set `x` and `y`.

## cpp-basic-036
topic: inheritance
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Base {
    virtual const char* who() const { return "base"; }
    virtual ~Base() {}
};

struct Derived : Base {
    const char* who() const override { return "derived"; }
};

void byValue(Base b) { std::cout << b.who() << " "; }
void byRef(const Base& b) { std::cout << b.who(); }

int main() {
    Derived d;
    byValue(d);
    byRef(d);
    std::cout << std::endl;
    return 0;
}
```

- A: `derived derived`
- B: `base base`
- C: `base derived`
- D: `derived base`

> Passing a `Derived` to a `Base` parameter by value copies only its `Base`
> part into a new `Base` object — it is sliced — so `b` really is a `Base`, and
> the virtual call runs `Base::who`. A reference binds to the original object,
> whose dynamic type is `Derived`, so virtual dispatch reaches `Derived::who`.

## cpp-basic-037
topic: inheritance
answer: D

What is wrong with this program?

```cpp
#include <string>

struct Base {
    ~Base() {}
};

struct Derived : Base {
    std::string name = "report";
    ~Derived() {}
};

int main() {
    Base* p = new Derived;
    delete p;
    return 0;
}
```

- A: Nothing: `delete` always runs the real type's destructor.
- B: It does not compile: a `Derived*` needs a cast to become a `Base*`.
- C: Nothing: `~Derived` is skipped, but `name` is still destroyed.
- D: It is undefined behaviour, because `~Base` is not `virtual`.

> Deleting an object through a pointer to its base class is only defined when
> the base class's destructor is `virtual`; otherwise the behaviour is
> undefined (in practice `~Derived` and the destruction of `name` are usually
> skipped, leaking the string). The conversion from `Derived*` to `Base*` is
> implicit. Declaring `virtual ~Base() {}` fixes it.

## cpp-basic-038
topic: inheritance
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

class Account {
protected:
    int balance = 100;
public:
    virtual int fee() const { return 5; }
    virtual ~Account() {}
};

class Premium : public Account {
public:
    int fee() const override { return Account::fee() - 3; }
    int left() const { return balance - fee(); }
};

int main() {
    Premium p;
    Account& a = p;
    std::cout << a.fee() << " " << p.left() << std::endl;
    return 0;
}
```

- A: `5 95`
- B: `2 98`
- C: `2 95`
- D: `5 98`

> `a` refers to a `Premium`, so the virtual call `a.fee()` runs `Premium::fee`.
> Inside it, the qualified call `Account::fee()` deliberately skips virtual
> dispatch and runs the base version, 5, so the fee is 2. `left` may read the
> `protected` member `balance` because it is a member of a derived class: 100 -
> 2 = 98.

## cpp-basic-039
topic: stl-containers
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> ages;
    ages["ann"] = 30;
    int a = ages.count("bob");
    int b = ages["cat"];
    std::cout << a << " " << b << " " << ages.size() << std::endl;
    return 0;
}
```

- A: `0 0 1`
- B: `0 0 3`
- C: `0 0 2`
- D: It throws `std::out_of_range`.

> `count` only looks: "bob" is absent, so it returns 0 and adds nothing.
> `operator[]` on a missing key inserts it with a value-initialised value (0
> for `int`) and returns that, so reading `ages["cat"]` grows the map to two
> entries. It is `at()` that throws for a missing key.

## cpp-basic-040
topic: stl-containers
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <set>

int main() {
    std::set<int> s{5, 1, 4, 1, 5, 9};
    s.insert(4);
    std::cout << s.size() << " " << *s.begin() << " " << *s.rbegin() << std::endl;
    return 0;
}
```

- A: `4 1 9`
- B: `7 5 4`
- C: `4 5 9`
- D: `7 1 9`

> A `std::set` stores each value once and keeps them sorted. The duplicate 1
> and 5 in the list, and the second 4, are ignored, leaving {1, 4, 5, 9}:
> four elements, the smallest first (`begin`) and the largest last (`rbegin`).

## cpp-basic-041
topic: stl-containers
answer: D

Given `std::vector<int> v{1, 2, 3};`, what does `v.at(3)` do?

- A: It returns 0, the value-initialised default for a missing element.
- B: It is undefined behaviour, exactly like `v[3]`.
- C: It grows the vector to four elements and returns the new one.
- D: It throws a `std::out_of_range` exception.

> The valid indices are 0, 1 and 2. `at()` checks the index and throws
> `std::out_of_range` when it is not less than `size()`. `operator[]` does not
> check, so `v[3]` would be undefined behaviour. Neither one grows the vector —
> that is `std::map::operator[]`'s behaviour, not `vector`'s.

## cpp-basic-042
topic: stl-containers
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    v.reserve(10);
    v.push_back(4);
    v.push_back(7);
    v.push_back(9);
    v.pop_back();
    std::cout << v.size() << " " << v.back() << " " << v.front() << std::endl;
    return 0;
}
```

- A: `2 7 4`
- B: `10 7 4`
- C: `2 9 7`
- D: `3 9 4`

> `reserve` sets aside capacity but adds no elements, so it does not change
> `size()`. Three `push_back`s give {4, 7, 9}; `pop_back` removes the last
> element, leaving {4, 7}: size 2, `back()` 7, `front()` 4.

## cpp-basic-043
topic: stl-algorithms
answer: B
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{3, 1, 4, 1, 5};
    std::sort(v.begin(), v.end(), std::greater<int>());
    std::reverse(v.begin(), v.begin() + 2);
    for (int x : v) {
        std::cout << x;
    }
    std::cout << std::endl;
    return 0;
}
```

- A: `54311`
- B: `45311`
- C: `11345`
- D: `34511`

> With `std::greater<int>()` as the comparator, `sort` orders largest first:
> 5 4 3 1 1. Iterator ranges are half-open, so `[begin, begin + 2)` covers only
> the first two elements, and reversing them gives 4 5 3 1 1.

## cpp-basic-044
topic: stl-algorithms
answer: C

`v` is a non-empty `std::vector<int>`. Which loop prints every element once, in order, without undefined behaviour?

- A: `for (auto it = v.begin(); it <= v.end(); ++it) std::cout << *it;`
- B: `for (auto it = v.begin(); it != v.end(); ++it) std::cout << it;`
- C: `for (auto it = v.begin(); it != v.end(); ++it) std::cout << *it;`
- D: `for (auto it = v.end(); it != v.begin(); --it) std::cout << *it;`

> `end()` is one past the last element and must never be dereferenced. A runs
> one step too far and dereferences `end()`. B streams the iterator itself,
> not the element it refers to. D starts by dereferencing `end()`, never
> reaches the first element, and goes backwards anyway.

## cpp-basic-045
topic: const-correctness
answer: A, C

Which of these declarations are valid standard C++? Select all that apply.

- A: `const int& a = 5;`
- B: `int& b = 5;`
- C: `const std::string& c = "hi";`
- D: `std::string& d = std::string("hi");`

> A `const` lvalue reference may bind to a temporary — the literal 5, or the
> `std::string` built from `"hi"` — and the temporary then lives as long as the
> reference. A non-const lvalue reference may only bind to an lvalue, so
> binding one to the literal 5 or to the temporary `std::string("hi")` is
> ill-formed.

## cpp-basic-046
topic: const-correctness
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int x = 5;
    const int& r = x;
    const int* p = &x;
    x = 8;
    std::cout << r << " " << *p << std::endl;
    return 0;
}
```

- A: `5 5`
- B: `5 8`
- C: `8 5`
- D: `8 8`

> `const` on a reference or on a pointed-to type only means the object cannot
> be changed through that reference or pointer. It does not take a snapshot,
> and it does not make `x` const: `x` can still be assigned directly, and both
> `r` and `*p` read the current value, 8.

## cpp-basic-047
topic: memory
answer: B

Which statement correctly releases the memory allocated here?

```cpp
int* scores = new int[5];
```

- A: `delete scores;`
- B: `delete[] scores;`
- C: `free(scores);`
- D: None is needed; it is released when `scores` goes out of scope.

> Memory from `new[]` must be released with `delete[]`; plain `delete` on it is
> undefined behaviour, and so is `free`, which belongs with `malloc`. The
> pointer `scores` is an ordinary local, so it going out of scope releases
> nothing — the array would leak.

## cpp-basic-048
topic: memory
answer: A

What is true about this program?

```cpp
#include <iostream>

int* make() {
    int value = 42;
    return &value;
}

int main() {
    int* p = make();
    std::cout << *p << std::endl;
    return 0;
}
```

- A: It has undefined behaviour: `value` is gone when `*p` is read.
- B: It prints `42`: the returned pointer keeps `value` alive.
- C: It does not compile: a function cannot return the address of a local.
- D: It prints `0`: a local's memory is zeroed when the function returns.

> `value` is an automatic (stack) variable, so its lifetime ends when `make`
> returns, and `p` is left dangling. Reading through it is undefined
> behaviour — it may even happen to print 42. Compilers usually warn here, but
> the code is not ill-formed. To outlive the call, return the value itself.

## cpp-basic-049
topic: modern
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    auto a = 7 / 2;
    auto b = 7 / 2.0;
    auto c = (a == 3);
    std::cout << a << " " << b << " " << c << std::endl;
    return 0;
}
```

- A: `3.5 3.5 1`
- B: `3 3.5 true`
- C: `3 3 1`
- D: `3 3.5 1`

> `auto` takes the type of the initialiser. `7 / 2` is an `int` expression (3);
> `7 / 2.0` is a `double` (3.5); a comparison is a `bool`. Without
> `std::boolalpha`, a `bool` streams as `1` or `0`.

## cpp-basic-050
topic: modern
answer: C

Which of these declarations fails to compile?

- A: `int a = 3.7;`
- B: `int b(3.7);`
- C: `int c{3.7};`
- D: `double d{3};`

> Brace initialisation forbids narrowing conversions, and `double` to `int`
> loses the fraction, so `int c{3.7};` is an error. The `=` and `()` forms
> allow it (silently truncating to 3, perhaps with a warning). `double d{3};`
> is fine: the constant 3 converts to `double` exactly, so it is not narrowing.
