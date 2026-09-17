---
title: std::shared_ptr and std::weak_ptr — counted ownership and its cycles
minutes: 15
---
Sometimes an object has no single owner: a cache entry used by several requests, a node in a graph reached from two parents, a callback that must outlive the code that registered it. `std::shared_ptr<T>` handles that with a **reference count**: every copy of the pointer is one owner, the count rises and falls as copies are made and destroyed, and the object is deleted when the last owner goes. It is the smart pointer beginners reach for first and experts reach for last, because counting has a cost, back-pointers need an escape from the count, and most objects that seem shared turn out to have an owner after all. This lesson covers the machinery, the cycle that leaks, `std::weak_ptr`, and when shared ownership is actually the right answer.

## The control block

```cpp
#include <memory>

auto a = std::make_shared<std::string>("shared");   // count 1
{
    auto b = a;                                       // count 2: a copy is a new owner
    std::cout << a.use_count() << '\n';               // 2
}                                                     // b destroyed: count 1
std::cout << a.use_count() << '\n';                   // 1
a.reset();                                            // count 0: the string is deleted now
```

A `shared_ptr` is two pointers wide: one to the object, one to a **control block** that holds the strong count, the weak count and the deleter. `std::make_shared<T>(args…)` allocates the object and the control block in a single allocation, which is faster and keeps them adjacent; `std::shared_ptr<T>(new T)` makes two allocations and, like its `unique_ptr` cousin, should not appear in modern code. Copying increments the strong count, destroying a copy decrements it, and when it reaches zero the object is destroyed — at that moment, deterministically, inside whichever `shared_ptr`'s destructor or `reset()` made the final decrement.

`use_count()` reports the strong count. In a single-threaded program it is exact, which is why the exercises print it; in a multithreaded one it is a snapshot. The increments themselves are atomic (Module 17), so copying a `shared_ptr` costs a synchronised read-modify-write — many times an ordinary increment — and passing one by value through ten function calls pays that ten times for no reason.

## Passing a shared_ptr

The rule from lesson 4 carries over. A function that merely uses the object takes `const T&` or `T*`; only a function that will *keep* an owner — store it in a member, a container, a callback — takes `std::shared_ptr<T>` by value, and the caller pays one increment for the copy that is then kept. Passing `const std::shared_ptr<T>&` is a half-measure: it avoids the increment but still demands that the caller own a `shared_ptr`.

## The cycle that leaks

```cpp
struct Node {
    std::shared_ptr<Node> other;
    ~Node() { std::cout << "destroyed\n"; }
};

int main() {
    auto x = std::make_shared<Node>();
    auto y = std::make_shared<Node>();
    x->other = y;        // y's count: 2
    y->other = x;        // x's count: 2
}                        // x and y go out of scope: both counts drop to 1. Nothing prints.
```

Each node is kept alive by the other. After `main`'s two variables die, each object still has one owner — the other object — and neither count reaches zero. Reference counting cannot collect cycles; a tracing garbage collector can, and this is the one place C++'s model is weaker. Every parent-and-children, doubly linked, observer-and-subject structure built with `shared_ptr` in both directions has this leak.

## weak_ptr: a pointer that does not own

```cpp
struct Album;
struct Track {
    std::string title;
    std::weak_ptr<Album> album;                  // back-pointer: does not keep the album alive
};
struct Album {
    std::string title;
    std::vector<std::shared_ptr<Track>> tracks;  // the album owns its tracks
};

auto album = std::make_shared<Album>();
auto t = std::make_shared<Track>();
t->album = album;                                // weak: album.use_count() stays 1
album->tracks.push_back(t);

if (auto a = t->album.lock()) {                  // lock(): a shared_ptr, or empty if the album is gone
    std::cout << a->title << ' ' << a.use_count() << '\n';   // 2 while a exists
}
album.reset();                                   // the album and its tracks vector die; t still holds one track
std::cout << t->album.expired() << '\n';         // 1 (true)
```

A `std::weak_ptr<T>` observes an object owned by `shared_ptr`s without counting as an owner: it holds the control block (bumping the weak count, which keeps only the block alive) and can tell whether the object still exists. `expired()` answers yes or no; `lock()` returns a `shared_ptr` that owns the object for as long as you hold it, or an empty one if the object is gone — and `lock()` is the one to use, because between an `expired()` check and the access that follows the object could die. Ownership points one way (album to tracks), observation points back (track to album), and the cycle is broken.

The same shape handles caches (the cache holds `weak_ptr`s and hands out `shared_ptr`s; entries die when unused) and observer lists (the subject holds `weak_ptr`s to listeners that may have been destroyed — the second exercise).

## enable_shared_from_this, in brief

A member function that needs a `shared_ptr` to its own object must not write `std::shared_ptr<T>(this)` — that creates a *second* control block for the same object, and the object is deleted twice. Deriving from `std::enable_shared_from_this<T>` gives the class a `shared_from_this()` that returns a `shared_ptr` sharing the existing control block. It works only on an object already owned by a `shared_ptr`, so never inside a constructor. Module 10 covers the inheritance it relies on.

## When shared ownership is right

Rarely, and specifically:

- The object genuinely has several owners of independent lifetimes — a cached resource, a graph node with several parents, an immutable configuration snapshot handed to many threads.
- A callback or an asynchronous task must keep its target alive until it runs.
- The lifetime cannot be tied to any one scope.

"I am not sure who should own it" is not on the list; it is the smell that `shared_ptr` is being used to avoid a design decision. The default is a value; a `unique_ptr` when the object must live on the heap; a `shared_ptr` when one of the reasons above applies; a raw pointer or reference for every non-owning use in between. C++20 added `std::shared_ptr<T[]>` for shared arrays; a `std::vector` inside a `shared_ptr` is usually clearer.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::shared_ptr<T> a(raw); std::shared_ptr<T> b(raw);` | Two control blocks: double delete. |
| Cycles of `shared_ptr` | Leak; use `weak_ptr` for the back edge. |
| Dereferencing `lock()` without testing it | It may be empty; test the result. |
| `shared_ptr` by value everywhere | Atomic churn; pass `const T&` to code that merely uses the object. |
| `std::shared_ptr<T>(this)` inside a member | A second control block; use `enable_shared_from_this`. |
| Assuming the count makes the object thread-safe | Only the count is atomic; the object needs its own lock. |

## Key takeaways

- `shared_ptr` owns through a control block: copies increment, destruction decrements, zero deletes; `make_shared` allocates both at once.
- `use_count()` is exact in one thread; copying costs an atomic increment — pass `const T&` to functions that merely use the object.
- Two `shared_ptr`s pointing at each other never reach zero: a cycle leaks.
- `weak_ptr` observes without owning; `lock()` gives a temporary `shared_ptr` or an empty one; `expired()` asks whether the object is gone.
- Prefer values and `unique_ptr`; use `shared_ptr` only when several owners with independent lifetimes truly exist.
