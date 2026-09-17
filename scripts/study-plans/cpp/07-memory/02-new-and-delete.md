---
title: new and delete — dynamic memory and the ownership contract
minutes: 14
---
`new` is the one expression that creates an object nothing will destroy for you, and `delete` is the promise that somebody will. Between them is a contract — exactly one piece of code owns the object and is responsible for ending it — and every memory bug in lesson 6 is a broken version of that contract. This lesson covers the two forms of `new` and `delete`, the ways a `delete` gets skipped or doubled, and why modern code writes `new` almost never: not because it is dangerous by itself, but because the bookkeeping it demands is better done by a class.

## The expressions

```cpp
int* p = new int(42);          // one int, initialised to 42
int* q = new int;              // one int, uninitialised — reading it is undefined
int* z = new int{};            // one int, value-initialised to 0
delete p;
delete q;
delete z;

double* arr = new double[n];   // n doubles, uninitialised
double* zs  = new double[n]{}; // n doubles, all 0.0
delete[] arr;                  // the array form
delete[] zs;
```

`new T(args)` allocates storage for a `T`, constructs it with `args`, and yields a `T*`. `delete p` runs the destructor of `*p`, then frees the storage. `new T[n]` constructs `n` objects in one block — `n` may be a run-time value, which is what built-in arrays could not do — and `delete[] p` destroys all `n` and frees the block. The `[]` is not decoration: the array form records the count so that every element's destructor runs, and using the wrong form is undefined behaviour, however it happens to behave today.

For class types, `new Widget(a, b)` calls the constructor and `delete` calls the destructor. For fundamental types there is no destructor, and `new int` without an initialiser leaves the bytes as they were, so `new int{}` and `new int[n]{}` are the habit worth keeping.

When there is no memory, `new` throws `std::bad_alloc` — it does not return null, unlike C's `malloc`. `new (std::nothrow) int[n]` returns `nullptr` instead, for code that must not throw. `delete nullptr` is a no-op, defined and safe.

## Ownership as a contract

A raw `T*` says nothing about who must delete it. It could point at a local, an element of a vector, a string literal, or a `new`ed object; it could be one of five copies of the same address. So the ownership has to live in a rule that the code follows:

- Exactly one owner. It holds the pointer and calls `delete` — once, on every path.
- Everyone else borrows. A borrowed pointer is used and dropped; the borrower never deletes and never keeps it past the owner's lifetime.
- A transfer of ownership is explicit: a function that takes over a pointer says so in its documentation, and a function that returns a `new`ed object says the caller now owns it.

In a function-sized program the contract is easy to keep. In a program with fifty files it is kept by putting the owning pointer inside a class whose destructor does the `delete` — lesson 3 — or inside `std::unique_ptr`, which is exactly that class written once for everyone — lesson 4.

## How a delete gets lost

A **leak** is a block whose owner has forgotten it. The four common shapes:

```cpp
void a() {
    int* p = new int[1000];
    // … no delete
}                                   // p is gone; the block is not

int b(int x) {
    int* p = new int[1000];
    if (x < 0) return -1;           // the early return skips the delete
    delete[] p;
    return 0;
}

void c() {
    int* p = new int[1000];
    risky();                        // throws: the delete below never runs
    delete[] p;
}

void d() {
    int* p = new int[10];
    p = new int[20];                // the first block's only address is overwritten
    delete[] p;
}
```

A leaked block is not a crash. The operating system reclaims everything at exit, so a short program never notices; a server that leaks a kilobyte per request notices after a week. The leak's other cost is that the destructor never runs — a file not flushed, a lock not released — which can matter far more than the bytes.

## How a delete gets doubled

```cpp
int* p = new int(1);
int* q = p;          // two copies of one address, no rule about which owns it
delete p;
delete q;            // double delete: undefined behaviour
*p = 2;              // use after free: undefined behaviour
```

Deleting twice hands the allocator a block it already has, which typically corrupts its free lists and crashes somewhere unrelated, later. Using the object after `delete` reads storage that may already belong to another object. The idiom `delete p; p = nullptr;` protects against the double delete *through `p`* — it does nothing for `q` — and hides the logic error that produced two owners. The real fix is one owner.

Mismatching the forms is the third undefined behaviour: `delete` on a `new[]` block, `delete[]` on a single object, or `free` on a `new`ed pointer. `malloc` and `free` are C's allocator, they call no constructors or destructors, and nothing from one family may be released with the other.

## A resource class that keeps the contract

Putting the pointer in a class turns the contract into code:

```cpp
class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : size_(n), data_(new int[n]{}) {}
    ~IntBuffer() { delete[] data_; }

    IntBuffer(const IntBuffer&) = delete;             // copying would make two owners
    IntBuffer& operator=(const IntBuffer&) = delete;  // Module 9 defines what a copy means

    std::size_t size() const { return size_; }
    int& at(std::size_t i) { return data_[i]; }

private:
    std::size_t size_;
    int* data_;
};
```

The constructor acquires, the destructor releases, and the two `= delete` lines stop the compiler from generating a memberwise copy that would leave two `IntBuffer`s pointing at one block — the double delete above, written for you. Every `IntBuffer` is now correct on every path out of its scope, including early returns and exceptions, because the destructor is the one piece of cleanup the language guarantees to call. `class`, `public`/`private` and `= delete` are Module 8 and Module 9 material; read them here as "the members outsiders may use" and "this operation does not exist".

## Why modern code almost never writes new

Count the `new`s in a well-written C++20 program and you find nearly none. `std::vector<T>` replaces `new T[n]` and grows as well; `std::string` replaces `new char[]`; `std::make_unique<T>()` replaces `new T` when a single object must live on the heap; `std::map` and `std::list` allocate their nodes themselves. Each of those is a class like `IntBuffer`, tested for decades, whose destructor does the `delete` at the brace. Writing `new` and `delete` by hand is for implementing such a class, and the reason to learn them is to understand what the classes do — and to read the code, still common, that predates them.

## Pitfalls

| Mistake | Consequence |
| --- | --- |
| `delete` for a `new[]` block (or the reverse) | Undefined behaviour; some destructors never run. |
| `new int[n]` then reading before writing | Uninitialised read; use `new int[n]{}`. |
| A `return` or a `throw` between `new` and `delete` | Leak — unless the pointer is in a class. |
| Two raw pointers to one block, both "owning" | Double delete. |
| Deleting a pointer to a local or to an array element | Undefined behaviour: only what `new` returned may be deleted. |
| `delete p;` and continuing to read `*p` | Use after free. |

## Key takeaways

- `new T` constructs on the heap and returns a pointer; `delete p` destroys and frees. Arrays use `new[]`/`delete[]`, and the forms must match.
- Ownership is a contract: one owner deletes once; everyone else borrows and never outlives the owner.
- Leaks come from forgotten, skipped (early return, exception) or overwritten deletes; double deletes come from two owners.
- A class whose constructor acquires and whose destructor releases keeps the contract automatically — with copying deleted or defined.
- Modern code lets `std::vector`, `std::string` and `std::make_unique` write the `new` and the `delete`.
