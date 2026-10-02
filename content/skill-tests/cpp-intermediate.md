---
updated: 2026-10-03
question: What does the C++ (Intermediate) skill test cover?
answer: It examines C++ at the level production code needs: ownership with unique_ptr and shared_ptr, copy and move semantics and the rule of five, template deduction and specialisation, virtual dispatch in depth, iterator invalidation and the STL's algorithm contracts, undefined behaviour, and modern features such as lambdas, structured bindings, optional and variant. Multiple-choice questions come first, then coding problems up to medium difficulty in C++.
q: Which C++ standard does the C++ Intermediate test assume?
a: C++17. The programs are compiled as C++20 and stay within what the two standards agree on; where a rule changed between versions, the question names the standard it means. No compiler extensions are needed, and no answer depends on one compiler's quirks.
q: Are C++20 features such as concepts, ranges or coroutines on the test?
a: No. The paper stops at what C++17 and C++20 share, so concepts, ranges, coroutines, modules and `std::format` are not examined. The [C++ study plan](/study-plans/cpp) teaches concepts, ranges and `std::format` if you want them for your own work.
q: Do I have to write templates or class hierarchies in the C++ Intermediate coding problems?
a: No. The coding problems are algorithm problems: you complete one function and return its answer. Templates, ownership and class design are examined by the multiple-choice questions; in the coding section what counts is a correct, efficient algorithm, usually built on the standard containers.
q: How is this different from the Problem Solving (Intermediate) test?
a: [Problem Solving (Intermediate)](/skill-tests/dsa-intermediate) certifies algorithms and data structures in any language you choose. This test certifies C++ itself: its multiple-choice questions are about the language and its standard library, and its coding problems must be answered in C++. The two complement each other.
q: Does failing C++ Intermediate affect my C++ Basic credential?
a: No. Each test issues its own credential, so a C++ (Basic) credential you already hold is unaffected by an Intermediate sitting. The Intermediate result breaks your score down by topic, weakest first, with somewhere to practise each, and you can sit it again once the cooldown has passed.
---

A C++ compiler accepts plenty of code whose meaning it cannot guarantee, and plenty more that does something other than what it appears to do. The C++ (Intermediate) test is about the rules that tell those programs apart from correct ones: who owns an object and when it dies, what a move actually does, how the compiler deduces templates and chooses between overloads, which operations invalidate an iterator, and where the language stops making promises at all. Each question isolates one such rule in a short program or a few lines of code.

Many questions show a complete program and ask what it prints. Others ask which declarations compile, which line has undefined behaviour, or what the standard does and does not guarantee after an operation. Expect several questions where the right answer is "it does not compile" or "the behaviour is undefined": knowing when C++ refuses a program, and when it accepts one it cannot give a meaning to, is part of this level. A few questions ask you to select every correct option, scored only when the set is exact. The coding section that follows must be answered in C++.

## Who it is written for

The test is for programmers who use C++ beyond a first course: at work, in systems or game code, in competitive programming with an eye on how the standard library behaves, or before interviews where C++ is the language. It assumes the [C++ (Basic)](/skill-tests/cpp-basic) material — pointers and references, constructors and destructors, virtual functions, `const`, the common containers — and builds on it.

If you learned C++ before C++11, most of the gap is in the newer half of the language: move semantics, smart pointers, `auto` deduction, lambdas and the C++17 library types. Start there. If you came to C++ through competitive programming, expect ownership, class design and undefined behaviour to need the most work, since contest code rarely depends on them.

## Areas of the language and library

Each area is a topic on your result. The [C++ study plan](/study-plans/cpp) teaches all of them; its modules on memory and ownership, copies and moves, templates, and performance and undefined behaviour carry the most weight here.

- **Memory and RAII.** Ownership with `std::unique_ptr` and `std::shared_ptr`, reference counts and `std::weak_ptr`, `std::make_shared`, what RAII guarantees when an exception unwinds the stack, and the rule of zero.
- **Move semantics.** Value categories, rvalue references, what `std::move` and `std::forward` really do, when a move happens and when a copy happens instead, `noexcept` move constructors, and copy elision.
- **Templates.** Argument deduction, full and partial specialisation, `if constexpr`, `std::enable_if` and SFINAE, how function templates compete with ordinary overloads, and why template code lives in headers.
- **Inheritance and virtual functions.** What virtual dispatch does and does not reach, how `override` and `final` are checked, abstract classes and pure virtual functions, name hiding, multiple and virtual inheritance, and virtual destructors.
- **STL containers.** Which operations invalidate iterators, pointers and references in each container, `emplace` versus `push`, `reserve` versus `resize`, and how `std::map` behaves on lookup and insertion.
- **STL algorithms and iterators.** The contracts behind the algorithms: half-open ranges, iterator categories, strict weak ordering, stable and unstable sorting, binary search on a sorted range, algorithms that rearrange elements rather than erase them, and reverse iterators.
- **Undefined behaviour.** Recognising the common sources — lifetimes that end too early, out-of-range access, signed overflow, invalidated iterators, unsynchronised access from two threads — and telling them apart from results that are merely unspecified.
- **Modern C++.** Lambda captures, `mutable` lambdas and init-captures, structured bindings, `auto` and `decltype(auto)` deduction, `constexpr` functions, `std::optional` and `std::variant`.
- **`const` and references.** Overloading on `const`, `mutable` members, and `const_cast`.
- **Classes.** `explicit` constructors, operator overloading conventions, and which special member functions the compiler declares for you.

## Making the compiler show you the rules

Almost every rule above can be checked on your own machine in a few minutes, and checking is what turns a rule you half-remember into one you can apply under time.

- **Instrument a class.** Give a throwaway type a default constructor, copy and move constructors, both assignment operators and a destructor, each printing one letter. Put it in a `std::vector`, pass it to functions, return it, capture it in a lambda: the output shows which special member ran, and when.
- **Turn the checkers on.** Compile with `-Wall -Wextra`, and on GCC or Clang add `-fsanitize=address,undefined`. Undefined behaviour often looks fine when the program runs; the sanitizers report it at the line where it happens.
- **Ask the compiler what it deduced.** Inside a template, `static_assert(std::is_same_v<T, int>);` fails with a message naming the type `T` really became — quicker than reasoning about deduction from memory.
- **Compare standards.** When a rule might have changed between versions, compile the same snippet with `-std=c++14` and `-std=c++17`; a new error or a different output is the change.

The study plan's modules Memory, ownership and RAII; Copies, moves and the rule of five; Templates and generic programming; STL containers; Algorithms and lambdas; Modern C++; and Performance and undefined behaviour line up with the topics above, and their exercises run on a judge.

## The coding section: algorithms in C++

The coding section draws from the problem catalogue at easy and medium difficulty, and at medium the algorithm matters as much as the code: Submit runs every hidden case, so an approach that is only fast enough for the visible examples can still lose marks. Review costs with the [Big-O notation](/roadmap/big-o-notation) lesson and practise the patterns medium problems lean on — [binary search](/roadmap/binary-search), [heaps](/roadmap/heap), [prefix sums](/roadmap/prefix-sum) and [hashing](/roadmap/hashing) — with problems from [Binary search](/challenges/binary-search), [Heap](/challenges/heap) and [Hash table](/challenges/hash-table).

In C++ the standard library does most of the heavy lifting: `std::sort` with a comparator, `std::unordered_map` for counting, `std::priority_queue` for repeated minimums, `std::lower_bound` on sorted data. The whole library is already included and you complete one function that returns its answer. Pasting is off during a sitting; your best submission for each problem counts, with partial credit for every hidden case it passes.

## Sample question
topic: templates
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>
int main() {
    std::vector v{4, 5, 6};
    std::vector w{v};
    std::vector x{v, v};
    std::cout << v.size() << ' ' << w.size() << ' ' << x.size() << '\n';
}
```

- A: `3 3 2`
- B: `3 1 2`
- C: `3 3 6`
- D: It does not compile: the element type of `w` cannot be deduced.

> Class template argument deduction (C++17) works out the template arguments
> from the initialiser: `std::vector v{4, 5, 6}` is a `std::vector<int>`.
> Braces normally favour the `std::initializer_list` constructor, but a braced
> list holding a single element that is itself a `std::vector` is a special
> case: deduction prefers a copy, so `w` is a `std::vector<int>` with `v`'s
> three elements. With two elements that rule does not apply, and `x` is a
> `std::vector<std::vector<int>>` holding two copies of `v`. Writing the type
> out, as in `std::vector<std::vector<int>> w{v};`, gives the one-element
> vector of vectors.
