---
title: Copy semantics — what a copy is, and when the default one is wrong
minutes: 14
---
C++ has value semantics: `Probe b = a;` makes a second, independent object, not a second name for the first as it would in Java. That is what lets a class own memory, a file or a lock and clean it up when it dies — and it means every class must answer a question Java classes never face: *what does it mean to copy one of these?* The compiler answers memberwise, and its answer is right for most classes and catastrophically wrong for the rest. This lesson settles which copy operations exist, what the generated ones do, when you must write your own, and how to say "this type cannot be copied at all".

## Two operations, not one

Copying happens in two different situations, and C++ gives each its own special member function:

```cpp
Probe a(1);
Probe b = a;      // copy construction: b did not exist; it is built from a
Probe c{a};       // copy construction, brace form
b = c;            // copy assignment: b already exists; its value is replaced
```

The **copy constructor** is `Probe(const Probe& other)`. It takes the source by `const` reference — by value would need a copy to make the copy, and the compiler rejects that recursion. The **copy assignment operator** is `Probe& operator=(const Probe& other)`; it returns `*this` so that `a = b = c` chains. Construction starts from raw storage; assignment starts from an object that already holds a value, which it has to give up cleanly — which is why every hand-written assignment is harder than the matching constructor.

## What the compiler generates

Declare neither and the compiler generates both, **memberwise**: the copy constructor copy-constructs each member from the source's member, in declaration order; the copy assignment copy-assigns each member, in declaration order. Base classes come first (Module 10). For a class made of well-behaved members, that is exactly right:

```cpp
struct Employee {
    std::string name;
    std::vector<int> ratings;
    int grade{};
};

Employee e1{"Ada", {5, 4, 5}, 3};
Employee e2 = e1;       // copies name (its own characters), ratings (its own elements), grade
e2.ratings.push_back(1);
std::cout << e1.ratings.size() << '\n';   // 3 — e1 is untouched
```

`std::string` and `std::vector` know how to copy themselves — each allocates its own storage and copies the contents — so a struct built from them gets a deep copy for free. This is the first half of the *rule of zero* (lesson 4): when every member manages itself, the class needs no copy code at all. One property of the generated assignment is worth knowing now: it does not check for self-assignment. `e1 = e1` copy-assigns each member to itself — harmless for standard types, merely wasteful.

## Deep versus shallow

The memberwise rule copies *members*, and a pointer member is a pointer. Copying it produces a second pointer to the same object — a **shallow** copy. Whether that is a bug depends on what the pointer means. A non-owning pointer (a cursor into a vector someone else owns) is a name for something elsewhere, and two names for the same thing is exactly what a copy should give. The trouble starts when the pointer *owns* what it points to:

```cpp
struct Buffer {
    int* data;
    std::size_t size;
    explicit Buffer(std::size_t n) : data(new int[n]()), size(n) {}
    ~Buffer() { delete[] data; }
};

void demo() {
    Buffer a(4);
    Buffer b = a;     // generated: b.data == a.data
}                     // b's destructor deletes the block; a's destructor deletes it again
```

Two objects each believe they own one block. The second `delete[]` is undefined behaviour — a crash if you are lucky, silent heap corruption if you are not — and before that, every write through `b.data` shows up in `a`. The generated copy is wrong because the class holds a resource whose meaning the compiler cannot see. An owning raw pointer is the signal: a class that has one needs hand-written copy operations, or (usually better) a member such as `std::vector` or `std::unique_ptr` that already knows how to copy itself.

## Writing a deep copy

The copy constructor allocates its own block and copies the elements:

```cpp
Buffer(const Buffer& other)
    : data(new int[other.size]), size(other.size) {
    std::copy_n(other.data, size, data);
}
```

The copy assignment has three extra things to get right. It must release the storage it already holds; it must not release it *before* the copy succeeds — `new` can throw, and an object whose pointer has been deleted but not replaced is a time bomb; and it must survive being assigned to itself:

```cpp
Buffer& operator=(const Buffer& other) {
    if (this == &other) return *this;          // self-assignment guard
    int* fresh = new int[other.size];          // acquire first
    std::copy_n(other.data, other.size, fresh);
    delete[] data;                             // release old only after success
    data = fresh;
    size = other.size;
    return *this;
}
```

Acquire, copy, then release: the old state stays intact until the new state exists, which is the *strong exception guarantee* (Module 15) falling out of plain ordering.

## Self-assignment is not hypothetical

`a = a` looks like a line nobody writes. It arrives through aliases: `v[i] = v[j]` when `i == j`, `*p = *q` when both point at the same object. An assignment that does `delete[] data` and then reads `other.data` — the same pointer — copies from freed memory. The guard `if (this == &other)` compares addresses, the only reliable test of identity. The copy-and-swap idiom (lesson 2) makes the guard unnecessary by never touching `other` after the copy.

## Making a type non-copyable

Some objects have no sensible copy: a lock that is held, an open socket, a `std::thread`, a `std::unique_ptr`. The type says so by deleting the operations:

```cpp
class Connection {
public:
    Connection(const Connection&) = delete;
    Connection& operator=(const Connection&) = delete;
};
Connection c2 = c1;   // error: use of deleted function 'Connection::Connection(const Connection&)'
```

`= delete` declares the function and forbids calling it, so the mistake is a clear compile-time message rather than a silent shallow copy. Deleting the copy constructor also leaves the class unmovable unless you say otherwise — declaring any copy operation suppresses the implicit move operations, a rule lesson 4 lays out in full. Non-copyable types can still be passed by reference, returned from factories, and held in containers once they are movable.

## Seeing copies happen

The rest of this module relies on one tool: a class that reports its own special member functions. Give each object an id from a counter and print what happens to it:

```cpp
struct Probe {
    static inline int next = 1;
    int id;
    int value;
    explicit Probe(int v) : id(next++), value(v) { std::cout << "construct #" << id << '=' << value << '\n'; }
    Probe(const Probe& o) : id(next++), value(o.value) { std::cout << "copy #" << id << " from #" << o.id << '\n'; }
    Probe& operator=(const Probe& o) {
        if (this == &o) { std::cout << "self-assign #" << id << '\n'; return *this; }
        value = o.value;
        std::cout << "copy-assign #" << id << " from #" << o.id << '\n';
        return *this;
    }
    ~Probe() { std::cout << "destroy #" << id << '\n'; }
};
```

The id is the object's *identity*, the value is its *value*, and the two events differ exactly there: copy construction creates a new identity holding an old value; assignment keeps an identity and replaces its value. When the trace surprises you, the surprise is the lesson.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Generated copy of a class with an owning raw pointer | Two owners, one block: double delete, and writes through one visible in the other |
| `Probe(Probe other)` as the copy constructor | Rejected: a by-value parameter would need the copy constructor to exist already |
| `void operator=(const Probe&)` | Compiles, but `a = b = c` no longer does; return `Probe&` |
| Assignment that deletes before copying | Self-assignment copies from freed memory; a throwing `new` leaves a dangling pointer |
| Trusting the generated assignment to skip self-assignment | It assigns every member to itself — fine for `std::string`, fatal for a raw owner |

## Key takeaways

- Copy construction builds a new object from an old one; copy assignment replaces the value of an existing one. They are separate functions with separate rules.
- The generated versions are memberwise, in declaration order, and correct whenever every member copies itself correctly.
- A member that owns through a raw pointer makes the memberwise copy shallow and wrong — write the copy yourself, or own through `std::vector`/`std::unique_ptr` instead.
- Hand-written assignment must guard against self-assignment and acquire before it releases.
- `= delete` on the copy pair makes a type non-copyable with a clear error; it also suppresses implicit moves.
- An instrumented class with ids shows identity and value separately — read its trace before you trust your intuition.
