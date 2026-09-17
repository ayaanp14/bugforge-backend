---
title: Lambdas in depth — captures, closures, std::function and recursion
minutes: 15
---
Module 4, lesson 5 introduced the lambda as a function written in place. This lesson takes the lid off: a lambda is an object of a compiler-generated class, its captures are that object's data members, and once you see that, every rule follows — why `[&]` dangles, why `mutable` exists and what copying a lambda copies, why `std::function` costs something `auto` does not, and how a lambda calls itself. The exercises build a counter that owns its state through an init-capture and a command table of `std::function` values.

## What a lambda really is

```cpp
int limit = 10;
auto below = [limit](int x) { return x < limit; };
```

The compiler turns that into roughly:

```cpp
struct Lambda7 {
    int limit;                                    // one member per capture
    bool operator()(int x) const { return x < limit; }
};
auto below = Lambda7{limit};
```

The **closure type** is unique to that lambda expression — two textually identical lambdas have two different types — which is why the variable must be `auto` (or a template parameter), why `decltype(cmp)` is how you name the type, and why a captureless lambda converts to a plain function pointer but a capturing one cannot. Calling the lambda calls `operator()`, which is `const` by default: a by-value capture is read-only inside the body unless the lambda is `mutable`. A captureless lambda has no members at all, and the compiler inlines its call into the algorithm as if you had written the loop body.

## Capture defaults

| Capture | Meaning |
| --- | --- |
| `[]` | nothing — only parameters and globals are visible |
| `[x]`, `[&x]` | `x` by copy, `x` by reference |
| `[=]` | everything the body uses, by copy |
| `[&]` | everything the body uses, by reference |
| `[=, &total]` | by copy, except `total` by reference |
| `[&, x]` | by reference, except `x` by copy |
| `[this]`, `[*this]` | the enclosing object by pointer, by copy (C++17) |

A default captures only the variables the body actually names, so `[=]` in a function with twenty locals copies the two it uses. Capture by reference is right when the lambda is called before the scope ends — a comparator passed to `std::sort`, a predicate to `count_if`, a body handed to `std::for_each`. Capture by copy is mandatory when the lambda **outlives the scope**: it is returned, stored in a container or a member, or handed to a thread (Module 17). A `[&]` lambda returned from a function refers to locals that no longer exist, and calling it is undefined behaviour with no diagnostic:

```cpp
auto makeGreeter(std::string name) {
    return [&]() { return "hello " + name; };   // dangling: name dies with the call
}
```

The fix is `[name]`, or `[name = std::move(name)]` to avoid the copy.

## Init-captures

```cpp
auto counter = [n = 0]() mutable { return ++n; };
auto owner   = [buf = std::move(bigVector)]() { return buf.size(); };
auto scaled  = [k = factor * 2](int x) { return x * k; };
```

An init-capture `[name = expression]` declares a new member initialised from any expression: a fresh variable the closure owns (`n = 0`), a moved-in resource (a `std::unique_ptr` or a large vector that would otherwise be copied), or a precomputed value. It is how a lambda carries state without a surrounding class, and the only way to move something into a closure. A closure holding a move-only member is itself move-only: it works with `auto` and templates but cannot be stored in a `std::function`, which requires a copyable callable (C++23 adds `std::move_only_function` — reading only on this runtime).

## `mutable`, and what copying copies

```cpp
auto next = [n = 0]() mutable { return ++n; };
auto other = next;                                // a copy of the closure, with its own n
next(); next();
std::cout << next() << ' ' << other() << '\n';    // 3 1
```

`mutable` removes the `const` from `operator()` so by-value captures can change. The state lives in the object, and copying the object copies the state: `other` starts where `next` was at the moment of the copy and moves independently. Passing a `mutable` lambda by value to an algorithm passes a copy, so the caller's counter never advances — which is why `std::for_each` returns its function object. The captured variable itself is never touched: `int x = 1; auto f = [x]() mutable { return ++x; };` leaves the outer `x` at 1 however often `f` runs.

## Capturing `this`

Inside a member function `[this]` captures the object's address, so the body can name members directly; `[*this]` copies the whole object into the closure. The pointer is cheap and dangles when the object is destroyed before the lambda runs — a callback registered by a member function and fired after the object died. C++20 deprecated the implicit `this` that `[=]` used to include: write `[=, this]` or `[=, *this]` and say which you mean.

## Generic lambdas and immediately invoked lambdas

```cpp
auto printAll = [](const auto& c) { for (const auto& x : c) std::cout << x << ' '; };
auto sum = []<typename T>(const std::vector<T>& v) { return std::accumulate(v.begin(), v.end(), T{}); };

const std::vector<int> table = [] {
    std::vector<int> t(10);
    std::iota(t.begin(), t.end(), 1);
    return t;
}();
```

An `auto` parameter makes `operator()` a template — one lambda for every element type, the same generic comparator for a `std::vector<int>` and a `std::vector<std::string>`. C++20 adds the explicit template form `[]<typename T>(…)` for when you need the type by name. An **immediately invoked** lambda — defined and called in one expression — initialises a `const` variable that takes several statements to compute, keeping it `const` where an `if`/`else` assignment could not.

## `std::function`

```cpp
#include <functional>

std::function<long long(long long, long long)> op = [](long long a, long long b) { return a + b; };
op = std::multiplies<>{};                          // any callable with that call signature
std::map<std::string, std::function<void()>> commands;
```

Every lambda is its own type, so a container cannot hold "some lambdas" — but it can hold `std::function<R(Args...)>`, a **type-erasing** wrapper that stores any callable with a compatible signature: a capturing lambda, a function pointer, a functor. That flexibility has a price: the wrapper is a few pointers wide, a callable too large for its small internal buffer is allocated on the heap, every call goes through an indirect jump the optimiser cannot inline, and copying it copies the stored callable. Calling an empty `std::function` throws `std::bad_function_call`. Use it for what it is for — dispatch tables, callbacks stored in objects, plug-in points chosen at run time — and use `auto` or a template parameter when the callable is passed straight down and called: `std::sort(…, cmp)` takes the comparator by template and pays nothing.

## Recursive lambdas

```cpp
std::function<long long(int)> fact = [&fact](int n) -> long long {
    return n <= 1 ? 1 : n * fact(n - 1);
};

auto fib = [](auto&& self, int n) -> long long {
    return n < 2 ? n : self(self, n - 1) + self(self, n - 2);
};
std::cout << fib(fib, 30) << '\n';                 // 832040
```

`auto f = [&f](…)` fails to compile — `f` is used in its own initialiser before its type has been deduced. Two idioms work. Naming the variable `std::function` gives it a type before the body, at the cost of a `std::function` call per level. A generic lambda that receives *itself* as its first parameter recurses through `self(self, …)` with no wrapper and no overhead; the explicit return type is required because the body refers to the call before deduction could finish. C++23 makes the second idiom official as `[](this auto self, int n)` — "deducing `this`" — which this runtime does not compile.

## Lambdas as comparators in containers

```cpp
auto byLength = [](const std::string& a, const std::string& b) {
    return a.size() != b.size() ? a.size() < b.size() : a < b;
};
std::set<std::string, decltype(byLength)> words(byLength);   // pass the object
std::set<std::string, decltype(byLength)> more;              // C++20: a captureless closure default-constructs

auto cmp = [](int a, int b) { return a > b; };               // a min-heap: the smallest on top
std::priority_queue<int, std::vector<int>, decltype(cmp)> pq(cmp);
```

A container's comparator is a template parameter, so a lambda's type is named with `decltype`. Before C++20 the object had to be handed to the constructor; since C++20 a captureless closure type is default-constructible, so the container can create its own. A lambda with captures still needs the constructor argument, and a `std::function` comparator would pay the indirect call on every comparison — the case where a small functor class (Module 11, lesson 4) is the better tool.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Returning or storing a `[&]` lambda | Dangling references: undefined behaviour when it is called |
| `++x` in a non-`mutable` lambda that captured `x` by value | Compile error: `operator()` is `const` |
| Expecting a `mutable` lambda's state to reach the caller | The algorithm got a copy; the original is untouched |
| `[=]` that uses members, in C++20 | Deprecated implicit `this`; write `[=, this]` |
| `std::function` in a tight loop | Indirect call, no inlining — prefer `auto` or a template |
| `auto f = [&f]…` | `f` used before deduction; use `std::function` or the `self` idiom |

## Key takeaways

- A lambda is an object of a unique closure type; captures are its members and the call is `operator()`, `const` unless `mutable`.
- `[&]` only for lambdas called before the scope ends; `[=]` or init-captures for anything that outlives it.
- Init-captures own state and move resources in; a copy of the closure is an independent copy of that state.
- `std::function` erases the type for storage and dispatch and costs an indirect call; `auto`/templates when the callable is only passed and called.
- Recursion: a `std::function` named before its body, or a generic lambda that receives itself.
- Name a lambda's type with `decltype` for containers; captureless ones default-construct since C++20.
