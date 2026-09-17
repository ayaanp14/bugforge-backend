---
title: The memory model — where objects live and when they die
minutes: 14
---
Every object in a C++ program lives somewhere for a definite span of time, and the language tells you exactly where and exactly how long: there is no garbage collector deciding later. Module 4 lesson 6 named the four storage durations; this lesson draws the machine underneath them — the stack of frames that automatic objects live in, the heap that `new` carves blocks from, the split between a container's *handle* and its *elements* — and fixes the one rule everything else in this module rests on: an object's destructor runs at a moment you can point to in the source.

## A constructor and a destructor, minimally

Module 8 teaches classes in full. This module needs two pieces early, so here they are in the smallest form:

```cpp
#include <iostream>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(const std::string& n) : name(n) { std::cout << "ctor " << name << '\n'; }
    ~Tracer() { std::cout << "dtor " << name << '\n'; }
};
```

`Tracer(const std::string&)` is a **constructor**: the function that runs when an object is created, here copying the argument into the member through the `: name(n)` initialiser. `~Tracer()` is the **destructor**: the function that runs, without being called by anyone, at the moment the object's lifetime ends. Printing from both makes lifetimes visible, and because C++ defines the order in which destructors run, the printed sequence is not a snapshot of one compiler's mood but a fact about the program. Every exercise in this module uses a class of this shape.

## The four storage durations

| Duration | Created by | Lives until | Where |
| --- | --- | --- | --- |
| automatic | a local variable or parameter | the end of its block | the stack frame |
| static | a global, a namespace-scope variable, a function-local `static` | the program exits | a fixed data segment |
| thread | `thread_local` | the thread ends (Module 17) | per-thread storage |
| dynamic | `new` | `delete` | the heap |

Automatic and dynamic are the two the rest of the module is about. Static appears in the first exercise, because its destructor runs after `main` has returned and the ordering is worth seeing once.

## The stack: frames

A call pushes a **frame**: the parameters, every local the function declares, and the address to return to. The compiler computed the frame's size when it compiled the function, so allocating it is a subtraction from the stack pointer — effectively free — and returning pops the whole frame in one step. That is why locals cost nothing and why recursion (Module 4 lesson 4) has a depth limit: the main thread's stack is 8 MB on Linux, each frame consumes some of it, and the judge allows about 100 000 modest frames before the process dies with a segmentation fault, not an exception.

The pop is also why the address of a local is worthless after the function returns. The frame is gone, its bytes will be reused by the next call, and a pointer or reference to it *dangles* (Module 6 lesson 4). Nothing in the language stops you from returning `&local`; the compiler warns, and the behaviour is undefined.

```cpp
void demo() {
    Tracer a("a");
    {
        Tracer b("b");
    }                       // dtor b
    Tracer c("c");
}                           // dtor c, then dtor a
```

Automatic objects are destroyed at the closing brace of their block, in **reverse order of declaration**: last constructed, first destroyed. Every path out of the block counts — `return`, `break`, an exception propagating through — which is the foundation of lesson 3.

## The heap: blocks

`new` asks the process's allocator for a block big enough for the object, constructs the object in it and returns its address. The block stays until `delete` is called on that address; nothing else — not the pointer going out of scope, not the function returning — frees it. The allocator keeps free lists, headers and alignment padding, so a `new` costs tens to hundreds of instructions where a local costs none, and a program that allocates millions of small objects spends its time in the allocator rather than in its own logic. The heap is also the only place for objects whose size is known only at run time, or whose lifetime must outlast the function that created them.

Lesson 2 covers `new` and `delete` in detail. The point here is the contrast: an automatic object's end is a brace you can see; a dynamic object's end is a call somebody must remember to make.

## Handle and elements

The most useful picture in this module is a `std::vector`:

```cpp
void fill() {
    std::vector<int> v;      // the handle: three pointers, automatic, in fill's frame
    v.push_back(1);          // the elements: a heap block the handle owns
    v.push_back(2);
}                            // v's destructor frees the block
```

The variable `v` is small and lives on the stack. Its elements live in a block on the heap that `v` allocated. When `v` goes out of scope its destructor releases the block, so *you* never do. `std::string` is the same shape, with the small-string optimisation keeping short text inside the handle (Module 5 lesson 1); `std::map` is a handle plus a tree of heap nodes. Copying the handle — `auto w = v;` — allocates a second block and copies the elements: value semantics, and Module 9 shows how it is implemented.

This picture explains the invalidation rule from Module 6: `int* p = &v[0]; v.push_back(3);` may move the elements to a bigger block, after which `p` points into freed memory.

## Lifetime, precisely

An object's **lifetime** begins when its initialisation finishes and ends when its destructor begins. For an automatic object that is the declaration and the closing brace; for a dynamic object, the `new` expression and the `delete` expression; for a static, before first use and after `main` returns, statics destroyed in reverse order of their construction.

```cpp
Tracer* make() {
    Tracer local("local");
    return new Tracer("heap");   // constructed here
}                                // dtor local — the heap Tracer lives on

int main() {
    Tracer* p = make();
    delete p;                    // dtor heap — only now
    return 0;
}
```

Output: `ctor local`, `ctor heap`, `dtor local`, `dtor heap`. Remove the `delete` and the last line never prints: the object is leaked, its destructor never runs, and the program cannot tell.

## Function-local static

A `static` inside a function is constructed the first time control passes its declaration — once — and destroyed after `main` returns, after every automatic object in `main`, in reverse order relative to other statics. If control never reaches the declaration, it is never constructed and never destroyed. Declared after an automatic `a` in the same function, it prints `ctor a`, `ctor once` on the first call, and on every later call just `ctor a`; at exit its `dtor` line comes after `main`'s own locals have gone. The first exercise puts one beside automatics so the ordering is visible.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Returning `&local` or a local by reference | Dangling; reading it is undefined behaviour. |
| Holding `&v[i]` across a `push_back` | The block may move; the pointer dangles. |
| `new` because "the object must persist" | Usually a `std::vector` or a returned value does it; a `new` without a matching `delete` is a leak. |
| Expecting a `new`ed object's destructor to run | It runs only at `delete`. |
| `static` for a value each caller needs its own copy of | Every caller shares it. |

## Key takeaways

- Four storage durations: automatic (the frame), static (the program), thread, dynamic (`new` to `delete`).
- A frame is pushed on call and popped on return; addresses into it are invalid afterwards.
- Automatic objects are destroyed at the closing brace in reverse order of declaration, on every exit path.
- A container is a small handle that owns a heap block; the handle's destructor frees the elements.
- A dynamic object lives until `delete`; forgetting it leaks, and nothing warns you.
