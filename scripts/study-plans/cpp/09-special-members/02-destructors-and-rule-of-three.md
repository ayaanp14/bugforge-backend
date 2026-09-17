---
title: Destructors and the rule of three
minutes: 14
---
A destructor is the other half of ownership. The constructor acquires; the destructor releases; and because C++ runs the destructor at a moment the language defines exactly — not "eventually", as a garbage collector would — a class can hold a heap block, a file or a lock with the certainty that it will be given back. This lesson pins down when destructors run and in what order, states the rule of three and why the three functions travel together, builds an owning buffer class that gets every case right, and finishes with the copy-and-swap idiom that makes assignment correct by construction.

## The destructor

```cpp
class Buffer {
public:
    explicit Buffer(std::size_t n) : data_(new int[n]()), size_(n) {}
    ~Buffer() { delete[] data_; }      // no parameters, no return type, one per class
private:
    int* data_;
    std::size_t size_;
};
```

`~Buffer()` runs when the object's lifetime ends: a local at the closing brace of its block, a member when its enclosing object is destroyed, an element when the container erases it or dies, a heap object at `delete`, a temporary at the end of the full-expression that created it (lesson 5). You never call it by name in ordinary code. The compiler generates an empty one when you declare none, and it destroys the members either way — the body you write runs *before* the members go, so a destructor body may still use them.

Destructors are implicitly `noexcept`: an exception escaping one calls `std::terminate`, and there is no sensible alternative, because a destructor running during stack unwinding (Module 15) would otherwise have two exceptions in flight. Release resources, log if you must, but never throw from a destructor.

## The order things die

Automatic objects are destroyed in **reverse order of construction**: the last declared is the first destroyed. Members are destroyed after the destructor body, in reverse declaration order. Bases go after the derived part (Module 10). With the `Probe` class from lesson 1:

```cpp
{
    Probe a(1);            // construct #1
    Probe b(2);            // construct #2
    Probe c = a;           // copy #3 from #1
}                          // destroy #3, destroy #2, destroy #1
```

The rule is what makes RAII compose (Module 7, lesson 3): an object declared later may depend on one declared earlier — a lock guard on its mutex, a parser on its file — and the dependant is always gone before the thing it depends on. Container elements are the exception worth remembering: `std::vector` destroys its elements in an order the standard does not specify, so a program that must observe element destruction order should `pop_back()` them itself.

## The rule of three

If a class needs a user-written **destructor**, **copy constructor** or **copy assignment operator**, it almost certainly needs all three. The reasoning is one step long: you wrote a destructor because the class owns something the members do not know how to release; the very same something is what the generated copy operations do not know how to duplicate. `Buffer` above compiles with the generated copies and double-deletes on the first copy, exactly as lesson 1 showed. The rule is a heuristic with the force of a law: a class that declares one of the three and not the others is a bug report waiting to be filed.

The converse is the more useful direction. A class with no destructor of its own — because every member is a `std::string`, a `std::vector`, a `std::unique_ptr` — needs no copy operations either. That is the rule of zero, lesson 4.

## An owning buffer, done right

```cpp
#include <algorithm>
#include <cstddef>
#include <utility>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {}

    IntBuffer(const IntBuffer& other)
        : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
    }

    IntBuffer& operator=(const IntBuffer& other) {
        if (this == &other) return *this;
        int* fresh = new int[other.size_];
        std::copy_n(other.data_, other.size_, fresh);
        delete[] data_;
        data_ = fresh;
        size_ = other.size_;
        return *this;
    }

    ~IntBuffer() { delete[] data_; }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

private:
    int* data_;
    std::size_t size_;
};
```

Read the four functions as one contract. The constructor establishes the invariant: `data_` points to `size_` ints this object owns (`new int[n]()` value-initialises them to zero). The copy constructor establishes the same invariant for a new object from an existing one. The assignment operator takes an existing object from one valid state to another without ever being in an invalid one: self-check, acquire, copy, release, commit. The destructor ends the invariant. `delete[]` matches `new[]`; mixing the array and scalar forms is undefined behaviour (Module 7, lesson 2). `new int[0]` is legal and returns a unique pointer you must still `delete[]`, so a zero-size buffer needs no special case. The two `operator[]` overloads are Module 8 material; the `const` one is what lets a `const IntBuffer&` parameter be read.

## Copy-and-swap

The assignment operator above is correct, and it is also the function every reviewer reads twice. The **copy-and-swap idiom** gets the same result from two functions that are each trivially right:

```cpp
class IntBuffer {
public:
    // constructor, copy constructor and destructor as before

    friend void swap(IntBuffer& a, IntBuffer& b) noexcept {
        std::swap(a.data_, b.data_);
        std::swap(a.size_, b.size_);
    }

    IntBuffer& operator=(IntBuffer other) {   // by value: the copy has already happened
        swap(*this, other);
        return *this;
    }
    // ...
};
```

The parameter is taken **by value**, so by the time the body runs the copy constructor has already built `other` as a complete, independent copy of the source. The body swaps the two pointers and sizes: `*this` now owns the new block, `other` owns the old one, and when `other` goes out of scope at the end of the function its destructor releases the old block. Nothing is deleted before the copy exists, so a throwing `new` leaves `*this` untouched — the strong guarantee for free. Self-assignment needs no guard: `a = a` copies `a` into `other`, swaps, and destroys the copy, leaving `a` with its own contents in a different block. And the same operator serves as the *move* assignment once the class has a move constructor (lesson 3): pass an rvalue and `other` is move-constructed instead of copied.

The `swap` is a `friend` defined inside the class so that unqualified `swap(x, y)` finds it (Module 8, lesson 5) and `noexcept` because swapping two pointers and two integers cannot fail. The cost of the idiom is that every assignment allocates, even when the target's block is already the right size; for most classes that is invisible, and for the one class where it is not, the explicit version above is the alternative.

## The destructor and `= default`

Writing `~Widget() = default;` says "the generated one, on purpose" — useful when a class is a polymorphic base and needs `virtual ~Widget() = default;` so that `delete` through a base pointer runs the derived destructor (Module 10, lesson 4). Even a defaulted destructor is *user-declared* for the generation rules in lesson 4: it switches the implicit move operations off. A class with no reason to declare a destructor should not, not even to log.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Destructor without the copy pair | Every copy double-deletes; the rule of three exists for this |
| `delete` for a `new[]` block | Undefined behaviour; match the forms |
| Throwing from a destructor | `std::terminate`, immediately if the stack is already unwinding |
| Assignment that releases before it copies | Self-assignment reads freed memory; a throw leaves a dangling pointer |
| Declaring a destructor "just to log" | Silently disables the implicit move operations (lesson 4) |

## Key takeaways

- A destructor runs at a defined moment — scope exit, `delete`, container erase, end of a temporary's full-expression — and must not throw.
- Locals die in reverse order of construction; members die after the destructor body, in reverse declaration order.
- Rule of three: a user-written destructor, copy constructor or copy assignment means the class owns something, and all three must know about it.
- The hand-written assignment is: self-check, acquire, copy, release, commit — never release first.
- Copy-and-swap builds assignment from the copy constructor, a `noexcept` friend `swap` and the destructor; it is self-assignment safe and strongly exception safe with no guard at all.
- Do not declare a destructor you do not need; it changes what the compiler generates.
