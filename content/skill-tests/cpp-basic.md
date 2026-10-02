---
updated: 2026-10-03
question: What does the C++ (Basic) skill test cover?
answer: It checks the C++ a programmer needs before anything advanced: integer and floating-point arithmetic, pointers and references, constructors, destructors and object lifetime, inheritance and virtual functions, const, dynamic memory and std::unique_ptr, and the everyday STL containers and algorithms. Most questions show a short program and ask what it prints; then you solve a coding problem in C++.
q: Which C++ standard does the C++ Basic test assume?
a: Modern C++, from C++11 on: `auto`, range-based `for` loops, `nullptr`, brace initialisation, `override` and `std::unique_ptr` all appear. The programs stay within what C++17 and C++20 agree on, so a compiler set to either standard gives the same answers, and nothing depends on a compiler extension.
q: Do I need to know templates for the C++ Basic test?
a: You need to read template types such as `std::vector<int>` and `std::map<std::string, int>`, because the standard library is written in them. Writing templates of your own, specialisation and deduction rules are examined on the [C++ (Intermediate)](/skill-tests/cpp-intermediate) test, not here.
q: I know C. Is that enough for the C++ Basic test?
a: It covers the arithmetic and some of the pointer questions, but most of the paper is about what C does not have: references, classes with constructors and destructors, inheritance, `const` member functions and the standard library. C has a credential of its own: [C (Basic)](/skill-tests/c-basic).
q: Can I use the standard library in the C++ Basic coding problem?
a: Yes. The whole standard library is included for you and `using namespace std;` is in effect, so `vector`, `string`, `unordered_map` and the algorithms are all there. You complete the one function the editor shows and return its answer; the judge calls it once for each test case.
q: Does the C++ Basic test ask about smart pointers?
a: Only `std::unique_ptr`, as the simplest way to have an object deleted automatically when its owner goes out of scope. Shared ownership with `std::shared_ptr` and `std::weak_ptr`, reference counts and move-only types are Intermediate material.
---

C++ hands you decisions that other languages make for you: whether a value is copied or shared, where an object lives, and when it is destroyed. The C++ (Basic) test checks that you understand those decisions as they appear in small, complete programs — the kind you write in a first course or while practising problems — and that you can then write a correct solution in C++.

Most multiple-choice questions show a short program, `#include` lines and `main` included, and ask what it prints. Others show a few lines and ask whether they compile, or which of several statements does a particular job. A few ask you to select every correct option, and only the exact set scores. After that, the coding section gives you a problem to solve in C++, judged on hidden test cases.

## Who Basic suits

Sit Basic if you have written C++ for a few months and use `std::vector` and `std::string` without looking anything up, can write a class with a constructor, and know when a function receives a copy and when it receives the caller's object. That is typically where a first C++ course, or a few months of solving practice problems in C++, leaves you. If you already write your own templates, think in terms of ownership and moves, and can name the common kinds of undefined behaviour, the [C++ (Intermediate)](/skill-tests/cpp-intermediate) test will tell you more.

Coming from C? The arithmetic and pointer questions will feel familiar, but most of the paper is about what C does not have — references, classes, inheritance, `const` member functions and the standard library — so spend your preparation there.

## The paper, topic by topic

Each topic appears on your result by name, with a link to practise it. The [C++ study plan](/study-plans/cpp) teaches every one of them.

- **Types and basics.** Integer and floating-point arithmetic and the conversions between them, what is lost when a value changes type, integer division and remainder, signed and unsigned values in one expression, and `char` and `bool` behaving as small integers.
- **Pointers and references.** Taking addresses and dereferencing, pointer arithmetic over an array, pointers to pointers, references as aliases, the three ways to pass an argument, and `nullptr`.
- **Classes and constructors.** Constructors and member initialiser lists, when the compiler provides a constructor and when it does not, copying, `static` members, `public` and `private`, and exactly when each object is destroyed.
- **Inheritance and virtual functions.** The order of construction and destruction in a hierarchy, `virtual` and `override`, calls through base-class pointers and references, `protected` access, and object slicing.
- **`const` and references.** A pointer to `const` versus a `const` pointer, `const` objects and `const` member functions, and what a `const` reference is allowed to bind to.
- **Memory and RAII.** `new` and `delete` and their array forms, leaks and dangling pointers, and `std::unique_ptr` as the way to have an object released automatically at the end of a scope.
- **STL containers.** `vector`, `string`, `map` and `set`: building them, inserting, erasing and looking up, which order each keeps its elements in, and checked versus unchecked element access.
- **STL algorithms and iterators.** `sort`, `find`, `accumulate`, `max_element` and their relatives, half-open iterator ranges, and what `end()` refers to.
- **Modern C++.** `auto`, range-based `for` loops by value and by reference, and brace initialisation.

## Small programs, compiled and compared

Test rules rather than rereading them. Write a ten-line program that tests one rule, predict its output, compile it and compare. Two habits make this faster. Give a throwaway class a constructor and a destructor that each print a letter, and you can watch every object's lifetime as the program runs. And compile with warnings switched on (`-Wall -Wextra`): many classic C++ mistakes are ones a compiler warns about but still accepts, and a warning you have seen once is a trap you will recognise on the page.

The [C++ study plan](/study-plans/cpp) modules that match this test are Fundamental types; Arrays, pointers and references; Memory, ownership and RAII; Classes and objects; Inheritance and polymorphism; STL containers; and Algorithms and lambdas. Their exercises compile and run on a judge, which makes them the same kind of practice as the test.

For the coding section, solve easy problems in C++ from [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Sorting](/challenges/sorting), with the roadmap lessons on [arrays](/roadmap/arrays) and [sorting algorithms](/roadmap/sorting-algorithms) for the techniques behind them. In the sitting, the whole standard library is already included and you complete a single function: array arguments arrive as references to `vector`s, and you return the answer instead of printing it. Use `long long` for a running total that can outgrow `int`. Pasting is off during a sitting, so practise typing solutions from an empty function. Run checks the visible examples, and Submit scores every hidden case, with partial credit for each one passed.

## Beyond Basic

Basic stops short of three subjects the [C++ (Intermediate)](/skill-tests/cpp-intermediate) test treats as topics of their own: templates you write yourself, move semantics, and undefined behaviour. Basic still expects you to notice when a beginner's program has gone wrong — a few right answers here are "it does not compile" or "the behaviour is undefined" — but Intermediate asks why, and adds shared ownership with `std::shared_ptr`, iterator invalidation, the rules the STL sets for comparators, and newer parts of the language such as lambdas, `std::optional` and structured bindings. Its coding section reaches medium difficulty.

## Sample question
topic: classes
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
struct Server {
    int port = 80;
    int backlog = 16;
    Server() {}
    Server(int p) : port(p) {}
};
int main() {
    Server a;
    Server b(8080);
    std::cout << a.port << " " << a.backlog << " " << b.port << " " << b.backlog << std::endl;
    return 0;
}
```

- A: `80 16 8080 0`
- B: `80 16 80 16`
- C: It does not compile: `port` would be initialised twice.
- D: `80 16 8080 16`

> A default member initialiser such as `= 80` is the value a member gets from
> any constructor that does not initialise that member itself. `Server()`
> mentions neither member, so `a` gets both defaults. `Server(int)` initialises
> `port` in its member initialiser list, which replaces the default for `port`
> — the default is not applied first and then overwritten, so nothing is
> initialised twice — while `backlog`, which the list leaves out, still gets 16.
> A member with no default and no entry in the list would be left
> uninitialised, not set to 0.
