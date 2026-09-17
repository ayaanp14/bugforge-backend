---
title: Lambdas — a first look
minutes: 14
---
Some functions are too small and too local to deserve a name at the top of the file: the comparison that sorts these words by length, the test that counts the values above this threshold. A **lambda expression** writes such a function in place, right where it is used, and can carry values from the surrounding scope into its body. This lesson settles the syntax, what a lambda actually is, capturing by value and by reference, `mutable`, return-type deduction, generic lambdas with `auto` parameters, and how a lambda travels into `std::sort` and `std::count_if`. Module 14, lesson 4 goes deeper — capture defaults, `std::function`, recursive lambdas — once the algorithm library is in play.

## A function without a name

```cpp
auto square = [](int x) { return x * x; };
std::cout << square(7) << '\n';      // 49
```

The shape is `[captures](parameters) -> return_type { body }`. The square brackets introduce the lambda and list what it captures (nothing here). The parameters and body are those of any function. The return type is usually omitted: the compiler deduces it from the `return` statements, which must all agree — write `-> double` when a body returns `1` on one path and `x / 2.0` on another, or when you want the conversion to be explicit.

A lambda expression creates an object — a **closure** — of a type the compiler invents on the spot, with an `operator()` whose body is yours. No two lambdas have the same type, and the type has no name, which is why `auto` is how a lambda is stored. Calling it is calling any function object: `square(7)`.

## Passing a lambda to an algorithm

The usual reason to write one is that a standard algorithm wants a callable:

```cpp
#include <algorithm>
#include <string>
#include <vector>

std::vector<std::string> words = {"fig", "banana", "kiwi", "apple"};

std::sort(words.begin(), words.end(), [](const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return a.size() < b.size();   // shorter first...
    return a < b;                                            // ...then alphabetical
});

auto longWords = std::count_if(words.begin(), words.end(), [](const std::string& w) {
    return w.size() > 4;
});
```

`std::sort` takes a comparator answering "does `a` go before `b`?" and requires a **strict weak ordering**: `<`-like, never `<=`-like. A comparator that returns `true` for equal elements breaks the sort — undefined behaviour, and on some inputs a crash. `std::count_if` takes a **predicate**, a callable returning `bool`. The parameters of the lambda take `const std::string&` for the same reason a function would: no copy per comparison.

## Captures

A lambda's body sees its own parameters and anything with static lifetime. To use a local variable of the enclosing function it must **capture** it:

```cpp
int threshold = 10;
long long sum = 0;

auto above = [threshold](int x) { return x > threshold; };   // by value: a copy inside the closure
auto add   = [&sum](int x) { sum += x; };                    // by reference: the closure aliases sum

for (int x : values) if (above(x)) add(x);
```

`[threshold]` copies the variable *into* the closure at the moment the lambda is created; `[&sum]` stores a reference to the caller's variable. The difference is the same value-versus-reference distinction as parameters, with one twist that catches everyone once — a by-value capture is taken when the lambda is **created**, not when it is called:

```cpp
int n = 1;
auto f = [n] { return n; };     // copies 1 now
n = 2;
std::cout << f() << '\n';       // 1
```

Several captures are listed with commas: `[threshold, &sum]`. The defaults `[=]` (everything used, by value) and `[&]` (everything used, by reference) exist and Module 14 explains when they are safe; until then list captures by name, so the reader sees what the lambda depends on.

A reference capture must not outlive the variable it names. Returning a lambda that captured a local by `&`, or storing it somewhere that runs after the enclosing function returned, leaves a dangling reference — the same undefined behaviour as any other reference to a dead object (Lesson 6).

## `mutable`

The copies a lambda holds are `const` inside the body. Trying to change one is an error — "increment of read-only variable" — because the closure's `operator()` is a `const` member function by default. `mutable` lifts that:

```cpp
int line = 0;
auto nextLine = [line]() mutable { return ++line; };

nextLine(); nextLine();
std::cout << nextLine() << '\n';   // 3
std::cout << line << '\n';         // 0 — the lambda changed its own copy
```

The state lives in the closure object; each call sees what the previous one left. Copying the lambda copies its state. The same can be written with an **init-capture** that creates the variable inside the brackets — `[count = 0]() mutable { return ++count; }` — when there is no outer variable to copy from. A `mutable` lambda is a small stateful object; when the state grows past a counter, a class (Module 8) says the same thing more clearly.

## Generic lambdas

Since C++14 a parameter may be `auto`, and the lambda then works for any type that supports the body:

```cpp
auto add = [](auto a, auto b) { return a + b; };
add(1, 2);                                   // 3
add(1.5, 2.25);                              // 3.75
add(std::string("ab"), std::string("c"));    // "abc"
```

Under the hood the closure's `operator()` is a template, instantiated per argument-type combination — Module 12 shows the mechanism. Generic lambdas are what you reach for when an algorithm's element type is long to spell or you want one comparator for several containers.

## Storing and passing lambdas

- **`auto`** holds a lambda by its exact type — free, and the form to use inside a function.
- **A template parameter** takes any callable: `template <typename F> void forEachLine(F f)`; the algorithms are written this way.
- **A function pointer** can hold a lambda that captures nothing: `int (*fp)(int) = [](int x) { return x + 1; };` — useful for C APIs.
- **`std::function<int(int)>`** holds any callable with that signature, captures and all, at the cost of an allocation and an indirect call. It is the type for "a callback stored in a struct" and the subject of Module 14, lesson 4.

## When to use a lambda, and when a function

A lambda is right when the behaviour is used once, belongs beside the code that uses it, or needs local state from the enclosing scope. A named function is right when the behaviour is reused, is long enough to want its own tests, or is the kind of thing a reader would search for by name. A lambda longer than about ten lines is a named function that has not been extracted yet.

## Pitfalls

- **Capturing by reference and outliving the variable.** Dangling, undefined behaviour, and the compiler rarely notices.
- **Capturing by value and expecting later changes to show.** The copy is taken at creation.
- **Modifying a value capture without `mutable`.** Compile error, with a message that mentions a read-only variable.
- **A comparator with `<=`.** Violates strict weak ordering; `std::sort` may run off the end of the range.
- **Inconsistent return types.** `return 1;` on one path and `return 2.5;` on another is an error; add `-> double`.
- **`[=]` copying a large container silently.** Name the captures until Module 14.

## Key takeaways

- `[captures](params) { body }` creates a closure object with a unique type; store it in `auto`.
- Capture by value copies at creation; capture by reference aliases and must not outlive the variable.
- `mutable` lets a lambda change its own copies; the state persists between calls and copies with the lambda.
- `std::sort` needs a strict-weak-ordering comparator, `std::count_if` a predicate; both take the lambda directly.
- `auto` parameters make a lambda generic; `std::function` stores any callable, at a cost — Module 14 takes both further.
