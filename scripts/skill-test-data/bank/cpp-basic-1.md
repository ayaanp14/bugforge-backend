---
skill: cpp
level: basic
---

## cpp-basic-001
topic: basics
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int a = 7;
    int b = 2;
    double r = a / b;
    std::cout << r << std::endl;
    return 0;
}
```

- A: `3.5`
- B: `3`
- C: `4`
- D: `3.0`

> `a / b` divides two `int`s, so it is integer division and yields 3 before the
> result is converted to `double`. Assigning to a `double` afterwards cannot
> bring the lost half back, and the stream prints the value 3.0 as `3`.
> `a / 2.0` or `static_cast<double>(a) / b` would give 3.5.

## cpp-basic-002
topic: basics
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    char c = '7';
    int n = c - '0' + 1;
    char d = c + 1;
    std::cout << n << " " << d << std::endl;
    return 0;
}
```

- A: `8 56`
- B: `56 8`
- C: `8 8`
- D: `8 71`

> The standard guarantees the digit characters `'0'`…`'9'` are consecutive, so
> `c - '0'` is the number 7 and `n` is 8. `c + 1` is the character after `'7'`,
> which is `'8'`; stored in a `char` and streamed, it prints as the character,
> not as its numeric code. Nothing here is string concatenation.

## cpp-basic-003
topic: basics
answer: A
run: cpp

What does this program print?

```cpp
#include <cstring>
#include <iostream>

int main() {
    char word[] = "code";
    std::cout << sizeof(word) << " " << std::strlen(word) << std::endl;
    return 0;
}
```

- A: `5 4`
- B: `4 4`
- C: `5 5`
- D: `8 4`

> `word` is an array, not a pointer: the literal `"code"` initialises it with
> four characters plus the terminating `'\0'`, so it holds 5 `char`s, and
> `sizeof(char)` is 1 by definition, making `sizeof(word)` 5. `strlen` counts
> the characters before the terminator: 4. A pointer's size would only appear
> if `word` had been declared as `const char*`.

## cpp-basic-004
topic: basics
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int balance = -1;
    unsigned int limit = 1;
    if (balance < limit) {
        std::cout << "less" << std::endl;
    } else {
        std::cout << "not less" << std::endl;
    }
    return 0;
}
```

- A: `less`
- B: It does not compile: an `int` cannot be compared with an `unsigned int`.
- C: The behaviour is undefined, so the output cannot be predicted.
- D: `not less`

> Comparing an `int` with an `unsigned int` converts the `int` to `unsigned`.
> Converting -1 to an unsigned type is well defined (it wraps modulo 2^n) and
> gives the largest `unsigned int` value, which is not less than 1. Compilers
> may warn about the signed/unsigned comparison, but it compiles and is not
> undefined.

## cpp-basic-005
topic: pointers-references
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int a[] = {10, 20, 30, 40, 50};
    int* p = a + 1;
    p += 2;
    std::cout << *p << " " << *(p - 2) << " " << (p - a) << std::endl;
    return 0;
}
```

- A: `30 10 2`
- B: `40 20 12`
- C: `50 30 4`
- D: `40 20 3`

> Pointer arithmetic counts elements, not bytes. `a + 1` points at `a[1]`, and
> adding 2 moves it to `a[3]`, which is 40. `p - 2` is `a[1]`, which is 20, and
> the difference of two pointers into the same array is the number of
> elements between them, 3 — never a byte count.

## cpp-basic-006
topic: pointers-references
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

int main() {
    int a = 1;
    int b = 2;
    int& r = a;
    r = b;
    b = 3;
    std::cout << a << " " << b << " " << r << std::endl;
    return 0;
}
```

- A: `2 3 2`
- B: `1 3 3`
- C: `2 3 3`
- D: `1 2 2`

> A reference is bound once, at its declaration, and can never be re-seated.
> `r = b;` therefore does not make `r` refer to `b`; it assigns `b`'s value (2)
> to `a` through the alias. Changing `b` to 3 afterwards does not touch `a`, and
> `r` still names `a`.

## cpp-basic-007
topic: pointers-references
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

void byValue(int x) { x += 10; }
void byRef(int& x) { x += 10; }
void byPtr(int* x) { *x += 10; }

int main() {
    int a = 1;
    int b = 1;
    int c = 1;
    byValue(a);
    byRef(b);
    byPtr(&c);
    std::cout << a << " " << b << " " << c << std::endl;
    return 0;
}
```

- A: `11 11 11`
- B: `1 11 11`
- C: `1 11 1`
- D: `1 1 11`

> `byValue` changes its own copy, so `a` stays 1. `byRef` receives an alias of
> `b` and changes `b` itself. `byPtr` receives the address of `c` and changes
> the object it points to through `*x`. Both the reference and the pointer
> reach the caller's variable; only the by-value call does not.

## cpp-basic-008
topic: pointers-references
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

void show(int n) { std::cout << "int"; }
void show(int* p) { std::cout << "pointer"; }

int main() {
    show(0);
    std::cout << " ";
    show(nullptr);
    std::cout << std::endl;
    return 0;
}
```

- A: `int int`
- B: `pointer pointer`
- C: `int pointer`
- D: It does not compile: the call `show(nullptr)` is ambiguous.

> `0` is an `int` literal: it matches `show(int)` exactly, which beats the
> conversion to a null `int*`. `nullptr` has type `std::nullptr_t`, which
> converts to any pointer type but never to `int`, so only `show(int*)` is
> viable. That is the reason `nullptr` replaced `0` and `NULL` for null
> pointers.

## cpp-basic-009
topic: classes
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Tag {
    char name;
    Tag(char n) : name(n) { std::cout << '+' << name; }
    ~Tag() { std::cout << '-' << name; }
};

int main() {
    Tag a('a');
    {
        Tag b('b');
    }
    Tag c('c');
    return 0;
}
```

- A: `+a+b+c-c-b-a`
- B: `+a+b-b+c-a-c`
- C: `+a+b-b+c-c-a`
- D: `+a+b+c-a-b-c`

> A local object is destroyed when its enclosing block ends. `b` lives in the
> inner braces, so it is destroyed before `c` is even constructed. At the end
> of `main` the remaining locals are destroyed in reverse order of
> construction: `c` first, then `a`.

## cpp-basic-010
topic: classes
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Part {
    Part(const char* label) { std::cout << label; }
};

struct Box {
    Part first;
    Part second;
    Box() : second("2"), first("1") { std::cout << "B"; }
};

int main() {
    Box box;
    std::cout << std::endl;
    return 0;
}
```

- A: `21B`
- B: `12B`
- C: `B12`
- D: `B21`

> Members are initialised in the order they are declared in the class, not the
> order they are listed in the member initialiser list, so `first` is built
> before `second`. All members are initialised before the constructor body
> runs, so `B` comes last. (Compilers warn when the list is written out of
> order, precisely because of this.)

## cpp-basic-011
topic: classes
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

class Counter {
public:
    static int total;
    int mine = 0;
    void hit() {
        total++;
        mine++;
    }
};

int Counter::total = 0;

int main() {
    Counter a;
    Counter b;
    a.hit();
    a.hit();
    b.hit();
    std::cout << a.mine << " " << b.mine << " " << Counter::total << std::endl;
    return 0;
}
```

- A: `2 1 2`
- B: `3 3 3`
- C: `2 1 1`
- D: `2 1 3`

> Each object has its own `mine`, so `a.mine` is 2 and `b.mine` is 1. A
> `static` data member belongs to the class: there is exactly one `total`,
> shared by every `Counter`, and all three calls increment it, making it 3.

## cpp-basic-012
topic: classes
answer: A

Which statement about this code is true?

```cpp
class A {
    int x;
};

struct B {
    int x;
};

int main() {
    A a;
    B b;
    a.x = 1;
    b.x = 2;
    return 0;
}
```

- A: Only `a.x = 1;` fails to compile.
- B: Both assignments compile.
- C: Only `b.x = 2;` fails to compile.
- D: Both assignments fail to compile.

> The only difference between `class` and `struct` is the default access:
> members of a `class` are `private` unless stated otherwise, members of a
> `struct` are `public`. `A::x` is private, so `main` cannot name it; `B::x` is
> public, so `b.x = 2;` is fine.

## cpp-basic-013
topic: inheritance
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Animal {
    void name() { std::cout << "animal "; }
    virtual void sound() { std::cout << "..."; }
    virtual ~Animal() {}
};

struct Dog : Animal {
    void name() { std::cout << "dog "; }
    void sound() override { std::cout << "woof"; }
};

int main() {
    Dog d;
    Animal* p = &d;
    p->name();
    p->sound();
    std::cout << std::endl;
    return 0;
}
```

- A: `dog woof`
- B: `animal ...`
- C: `dog ...`
- D: `animal woof`

> A call through a base pointer is resolved by the pointer's static type unless
> the function is `virtual`. `name` is not virtual, so `p->name()` calls
> `Animal::name`. `sound` is virtual, so `p->sound()` dispatches on the actual
> object, a `Dog`, and calls `Dog::sound`.

## cpp-basic-014
topic: inheritance
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Base {
    Base() { std::cout << "B"; }
    ~Base() { std::cout << "~B"; }
};

struct Derived : Base {
    Derived() { std::cout << "D"; }
    ~Derived() { std::cout << "~D"; }
};

int main() {
    {
        Derived d;
    }
    std::cout << std::endl;
    return 0;
}
```

- A: `BD~D~B`
- B: `DB~D~B`
- C: `BD~B~D`
- D: `DB~B~D`

> A derived object is built from the base up: the `Base` part is constructed
> before the `Derived` constructor body runs. Destruction is the exact reverse:
> `~Derived` runs first, then `~Base`. The inner braces end `d`'s lifetime
> before the newline is printed.

## cpp-basic-015
topic: inheritance
answer: C

What happens when this code is compiled?

```cpp
struct Shape {
    virtual double area() const { return 0; }
    virtual ~Shape() {}
};

struct Square : Shape {
    double side = 2;
    double area() override { return side * side; }
};
```

- A: It compiles, and `Square::area` overrides `Shape::area`.
- B: It compiles, but `Square::area` hides `Shape::area` instead of overriding it.
- C: It does not compile: `Square::area` does not override anything.
- D: It does not compile, because a `virtual` function cannot be `const`.

> To override, the signature must match, and `const` is part of a member
> function's signature: `Shape::area` is `const`, `Square::area` is not, so it
> is a different function. Without `override` that would compile silently and
> merely hide the base version (option B's situation); with `override` the
> compiler is told it must override something, and reports an error.

## cpp-basic-016
topic: stl-containers
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a(3, 7);
    std::vector<int> b{3, 7};
    std::cout << a.size() << " " << b.size() << std::endl;
    return 0;
}
```

- A: `3 3`
- B: `3 2`
- C: `2 2`
- D: `2 3`

> Parentheses call the (count, value) constructor: `a` holds three 7s. Braces
> prefer the `std::initializer_list` constructor whenever one fits: `b` holds
> the two elements 3 and 7.

## cpp-basic-017
topic: stl-containers
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> stock;
    stock["pear"] = 3;
    stock["apple"] = 5;
    stock["fig"] = 1;
    stock["apple"] = 2;
    for (const auto& item : stock) {
        std::cout << item.first[0] << item.second;
    }
    std::cout << std::endl;
    return 0;
}
```

- A: `p3a5f1a2`
- B: `p3a2f1`
- C: `a5f1p3`
- D: `a2f1p3`

> A `std::map` keeps one entry per key and iterates in ascending key order —
> here alphabetical: apple, fig, pear — regardless of insertion order. The
> second `stock["apple"] = 2` does not add an entry; it overwrites the value of
> the existing one.

## cpp-basic-018
topic: stl-containers
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

int main() {
    std::string s = "certify";
    std::string t = s.substr(2, 3);
    s += "!";
    std::cout << t << " " << s.size() << std::endl;
    return 0;
}
```

- A: `r 8`
- B: `ert 8`
- C: `rti 8`
- D: `rti 7`

> `substr(pos, len)` takes a starting index (0-based) and a length, not an end
> index: from index 2 (`r`), three characters, giving `"rti"`. `t` is an
> independent copy, and appending `"!"` makes `s` eight characters long.

## cpp-basic-019
topic: stl-algorithms
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<double> prices{1.5, 2.5, 3.5};
    double total = std::accumulate(prices.begin(), prices.end(), 0);
    std::cout << total << std::endl;
    return 0;
}
```

- A: `6`
- B: `7.5`
- C: `7`
- D: `8`

> `std::accumulate` keeps its running total in the type of the initial value.
> `0` is an `int`, so after each addition the result is converted back to
> `int`: 0 + 1.5 becomes 1, 1 + 2.5 becomes 3, 3 + 3.5 becomes 6. Passing `0.0`
> as the initial value would give 7.5.

## cpp-basic-020
topic: stl-algorithms
answer: B
run: cpp

What does this program print?

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{4, 8, 15, 16, 23};
    auto hit = std::find(v.begin(), v.end(), 16);
    auto miss = std::find(v.begin(), v.end(), 42);
    std::cout << (hit - v.begin()) << " " << (miss == v.end()) << std::endl;
    return 0;
}
```

- A: `4 1`
- B: `3 1`
- C: `3 0`
- D: `3 -1`

> `std::find` returns an iterator to the first match; subtracting `begin()`
> gives its 0-based index, 3. When nothing matches it returns the end iterator
> it was given, so `miss == v.end()` is `true`, which streams as `1`. It never
> returns -1.

## cpp-basic-021
topic: const-correctness
answer: A, D

Given these declarations, which of the statements below compile? Select all that apply.

```cpp
int a = 1;
int b = 2;
const int* p = &a;
int* const q = &a;
```

- A: `p = &b;`
- B: `*p = 5;`
- C: `q = &b;`
- D: `*q = 5;`

> Read the declaration from the name outwards. `p` is a (non-const) pointer to
> a `const int`: it may be pointed elsewhere, but the `int` cannot be changed
> through it. `q` is a `const` pointer to a (non-const) `int`: the pointer
> itself is fixed, but the `int` it points to can be modified.

## cpp-basic-022
topic: const-correctness
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Box {
    int v;
    Box() : v(1) {}
    int get() { return v + 10; }
    int get() const { return v + 20; }
};

int main() {
    Box b;
    const Box c;
    const Box& r = b;
    std::cout << b.get() << " " << c.get() << " " << r.get() << std::endl;
    return 0;
}
```

- A: `11 11 11`
- B: `11 21 11`
- C: `21 21 21`
- D: `11 21 21`

> Member functions can be overloaded on `const`. A non-const object picks the
> non-const `get`; a const object, or any access through a `const` reference,
> can only call the `const` version. `r` refers to the non-const `b`, but the
> call is chosen by the type of the expression `r`, which is `const Box`.

## cpp-basic-023
topic: const-correctness
answer: B

What happens when this class is compiled?

```cpp
class Account {
    int balance = 0;
public:
    int peek() const { return balance; }
    void add(int n) const { balance += n; }
};
```

- A: It compiles, and `add` changes `balance` as written.
- B: It does not compile, because `add` is `const` but modifies a member.
- C: It compiles, but `add` changes a copy of `balance`, not the member.
- D: It does not compile, because `peek` returns a member from a `const` function.

> Inside a `const` member function, `this` points to a `const Account`, so every
> data member is read-only there. `peek` only reads `balance` and returns a
> copy, which is fine; `add` assigns to it, which is a compile error. The fix is
> to drop `const` from `add`.

## cpp-basic-024
topic: memory
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Res {
    char tag;
    Res(char t) : tag(t) {}
    ~Res() { std::cout << tag; }
};

int main() {
    {
        Res a('a');
        Res* b = new Res('b');
        Res* c = new Res('c');
        delete c;
    }
    std::cout << "!" << std::endl;
    return 0;
}
```

- A: `cba!`
- B: `ca!b`
- C: `ca!`
- D: `cab!`

> `delete c` destroys the object `c` points to immediately, printing `c`. At
> the closing brace only the automatic object `a` is destroyed. `b` and `c` are
> just pointers going out of scope: the heap object `b` points to is never
> deleted, so its destructor never runs — not at the brace, and not at
> program exit. It leaks.

## cpp-basic-025
topic: modern
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    for (auto x : v) {
        x *= 10;
    }
    for (auto& y : v) {
        y += 1;
    }
    std::cout << v[0] << " " << v[1] << " " << v[2] << std::endl;
    return 0;
}
```

- A: `2 3 4`
- B: `11 21 31`
- C: `10 20 30`
- D: `1 2 3`

> `auto x` copies each element, so the first loop multiplies copies and leaves
> the vector unchanged. `auto& y` binds a reference to each element, so the
> second loop modifies the vector itself.
