---
title: std::unique_ptr — exclusive ownership, enforced by the type
minutes: 15
---
`std::unique_ptr<T>` is the `IntBuffer` of lesson 2 written once, for every type: a small object that holds a pointer, deletes it in its destructor, and cannot be copied. That last property is the point. A raw owning pointer relies on a rule that one owner deletes; a `unique_ptr` makes a second owner a compile error. It costs nothing over the raw pointer — one word of storage with the default deleter, the same indirection — so it is the default way to hold a heap object in modern C++, and the `new`-and-remember-to-`delete` of lesson 2 becomes `std::make_unique`.

## Creating and using

```cpp
#include <memory>

auto p = std::make_unique<std::string>("hello");   // std::unique_ptr<std::string>
std::cout << *p << ' ' << p->size() << '\n';       // hello 5
if (p) std::cout << "owns something\n";            // converts to bool: non-null
```

`std::make_unique<T>(args…)` performs `new T(args…)` and wraps the result. Prefer it over `std::unique_ptr<T>(new T(…))`: it never names `new`, it cannot leak when it appears as one of several arguments to a function (an evaluation-order hazard before C++17), and `std::make_unique<T[]>(n)` value-initialises an array. `*p` and `p->` work as for a raw pointer; `p` in a condition is true when it holds an object.

When `p` goes out of scope the string is deleted. There is nothing else to write.

## Move-only

```cpp
auto a = std::make_unique<int>(1);
auto b = a;               // error: the copy constructor is deleted
auto c = std::move(a);    // ownership transfers; a is now null
std::cout << (a ? "a owns" : "a is empty") << '\n';   // a is empty
```

The copy operations are deleted, so the only way to hand the object to another `unique_ptr` is `std::move`, which leaves the source holding `nullptr` — a defined, testable state, not a valid-but-unspecified one. Module 9 explains rvalue references and what `std::move` does in general; for `unique_ptr` the contract is simple: after `std::move(a)`, `a` is null and `c` owns.

## The three escape hatches

| Call | Effect | Ownership afterwards |
| --- | --- | --- |
| `p.get()` | returns the raw pointer | still `p`'s; the raw pointer is a borrow |
| `p.release()` | returns the raw pointer and sets `p` to null | yours — you must `delete` it or hand it to another owner |
| `p.reset()` / `p.reset(q)` | deletes the current object, then holds `q` (or nothing) | `p` owns `q` |

`get()` is for calling code that takes a `T*` and does not keep it. `release()` is rare — passing to a C API that takes ownership, or re-wrapping in a different smart pointer — and a `release()` whose result is dropped is a leak. `reset()` is how you destroy early, at a point you choose rather than at the closing brace.

## Passing and returning

The parameter type is the ownership statement:

```cpp
void inspect(const Document& d);              // lends: the caller keeps owning
void annotate(Document& d);                   // lends, may modify
void maybe_use(Document* d);                  // lends, may be null
void archive(std::unique_ptr<Document> d);    // takes ownership: call with std::move
void reseat(std::unique_ptr<Document>& d);    // may replace what the caller owns (rare)

std::unique_ptr<Document> open(const std::string& path);   // factory: the caller owns the result
```

Call a sink with `archive(std::move(doc))`; afterwards `doc` is null, and the parameter inside `archive` dies at its closing brace, taking the document with it. Lend with `inspect(*doc)` or `maybe_use(doc.get())`. Return from a factory by value — `return doc;` moves automatically, and C++17 guarantees no copy — and the caller writes `auto doc = open("a.txt");`. Passing `const std::unique_ptr<T>&` to a function that merely reads the object is a common mistake: it forces the caller to own a `unique_ptr`, where `const T&` would accept any object at all.

## Arrays and custom deleters

```cpp
auto buf = std::make_unique<int[]>(n);        // n ints, zero-initialised; delete[] in the destructor
buf[3] = 7;                                   // operator[], no bounds check

std::unique_ptr<FILE, decltype(&std::fclose)> file(std::fopen("x.txt", "r"), &std::fclose);
```

The `T[]` specialisation calls `delete[]` and provides `[]` — the right tool when the size is fixed at creation and a `std::vector` would be overkill, which is rarer than it sounds; `std::vector` is usually the answer. A second template argument names a **deleter**: any callable invoked instead of `delete`, which is how a `unique_ptr` closes a `FILE*`, frees a C library handle, or returns a connection to a pool. A stateless lambda or function object as the deleter keeps the pointer one word wide; a function pointer adds a second.

## Linked structures

```cpp
struct Node {
    int value;
    std::unique_ptr<Node> next;
    Node(int v, std::unique_ptr<Node> n) : value(v), next(std::move(n)) {}
};

std::unique_ptr<Node> head;
head = std::make_unique<Node>(1, std::move(head));   // push front: the new node owns the old head

std::unique_ptr<Node> old = std::move(head);         // pop front: detach the head …
head = std::move(old->next);                         // … take its successor …
                                                     // … and old deletes the node at the brace
```

Each node owns the next, so the chain is freed by whichever `unique_ptr` holds the head. The pop is written in two steps on purpose: the tempting one-liner `head = std::move(head->next)` deletes the old node inside the assignment while still referring to a member of it, and the standard's wording for that assignment leaves the result undefined. Detach, then take.

Destroying a long chain is recursive — `head`'s destructor deletes the first node, whose `next` deletes the second, one destructor frame per node — and overflows the stack for a list of a few hundred thousand. The fix is a destructor that pops from the front in a loop until the chain is empty; the second exercise writes it.

## In containers and hierarchies

`std::vector<std::unique_ptr<Shape>>` is the standard way to own a collection of polymorphic objects (Module 10): `shapes.push_back(std::make_unique<Circle>(2.0));`, and the vector's destructor deletes every shape. A `unique_ptr` member makes a class own a heap object without writing a destructor at all — the rule of zero, Module 9 lesson 4.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::unique_ptr<T> a(raw); std::unique_ptr<T> b(raw);` | Two owners of one object: double delete. |
| Keeping `p.get()` after `p` is destroyed or reset | Dangling raw pointer. |
| `p.release();` with the result discarded | Leak — nobody deletes. |
| `f(std::unique_ptr<T>(new T), g())` in C++14 | If `g()` throws between the `new` and the wrap, a leak; `make_unique` closes the gap. |
| Using `a` after `std::move(a)` as if it still owned | It is null; `*a` is undefined behaviour. |
| `std::unique_ptr<T> p = new T;` | Does not compile: the constructor is `explicit`. Write `make_unique`. |

## Key takeaways

- `std::unique_ptr<T>` owns one heap object, deletes it in its destructor, and costs the same as a raw pointer.
- Create with `std::make_unique`; copying is a compile error; `std::move` transfers and leaves the source null.
- `get()` borrows, `release()` gives up ownership to you, `reset()` deletes now.
- By value = give (call with `std::move`); `T&`, `const T&` or `T*` = lend; factories return by value.
- `T[]` and custom deleters cover arrays and non-memory resources; a `unique_ptr` chain needs a two-step pop and an iterative destructor.
