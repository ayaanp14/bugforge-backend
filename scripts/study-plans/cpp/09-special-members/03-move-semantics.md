---
title: Move semantics — rvalue references, std::move and noexcept
minutes: 15
---
A copy duplicates a value; a move *transfers* it, leaving the source empty but valid. C++11 added moves because copying was the wrong default for the most common thing programs do with big objects — build one in a function and hand it back — and because a temporary that is about to die has nothing to lose by giving its contents away. This lesson explains what an rvalue reference binds to, why `std::move` moves nothing, how to write a move constructor and move assignment, what state a moved-from object is allowed to be in, and why `noexcept` on a move is the difference between `std::vector` moving your elements and copying them.

## Why moves exist

```cpp
std::vector<int> primesBelow(int n);          // builds a million-element vector

std::vector<int> primes = primesBelow(1'000'000);
```

Before C++11, initialising `primes` from the returned vector meant copying a million ints and freeing the original — a full allocation and a full loop, to end up with exactly what the function already had. The same waste happened whenever a temporary was passed to a function or inserted into a container. A **move** replaces that with three pointer assignments: the new vector takes the old one's buffer, and the old one is left pointing at nothing. The value is transferred, not duplicated, and the cost is constant whatever the size.

The language needed two things to make this safe: a way to tell that the source is expendable, and a way for a class to say what "transfer" means for it. The first is the rvalue reference; the second is the move constructor and move assignment.

## Rvalue references

An **lvalue** is an expression that names an object — a variable, `*p`, `v[i]`. An **rvalue** is an expression whose object is a temporary or is otherwise about to be discarded — `Probe(3)`, `a + b`, a function call returning by value. Lesson 5 gives the full taxonomy; this is enough for now.

`T&` binds only to lvalues, `const T&` binds to anything, and the new reference type `T&&` — an **rvalue reference** — binds only to rvalues:

```cpp
void take(const Probe& p);   // #1: anything
void take(Probe&& p);        // #2: rvalues only

Probe a(1);
take(a);            // #1: a is an lvalue
take(Probe(2));     // #2: the temporary is an rvalue — and #2 is the better match
```

Overload resolution prefers `T&&` for an rvalue, which is the whole mechanism: a function that receives a `Probe&&` knows the argument will not be used again by the caller, so it may take the contents. Inside `take`, though, the *name* `p` is an lvalue — it has a name — so passing it on requires `std::move(p)` again. A named rvalue reference is an lvalue.

## `std::move` is a cast

```cpp
Probe a(1);
Probe b = std::move(a);      // move construction: a's contents are now in b
```

`std::move` moves nothing. It is `static_cast<T&&>(x)`: it takes an lvalue and returns an rvalue reference to the same object, which makes overload resolution pick the move constructor instead of the copy constructor. The move happens inside that constructor, or not at all — for a type with no move constructor, `std::move` selects the copy constructor and silently copies (lesson 4). After the line, `a` still exists and will still be destroyed at the end of its scope; what it contains is up to the class. The name `std::move` is the standard's most-criticised piece of naming; read it as "may be moved from".

## The move constructor and move assignment

For `IntBuffer` from lesson 2, a move steals the pointer and leaves the source owning nothing:

```cpp
IntBuffer(IntBuffer&& other) noexcept
    : data_(other.data_), size_(other.size_) {
    other.data_ = nullptr;      // the source must not delete what we now own
    other.size_ = 0;
}

IntBuffer& operator=(IntBuffer&& other) noexcept {
    if (this == &other) return *this;
    delete[] data_;             // release what we hold
    data_ = other.data_;        // take theirs
    size_ = other.size_;
    other.data_ = nullptr;
    other.size_ = 0;
    return *this;
}
```

Three points. The parameter is `IntBuffer&&`, not `const IntBuffer&&` — moving *modifies* the source, so it cannot be `const`. The source is left in a state its destructor accepts: `delete[] nullptr` is a no-op, and `size_ == 0` keeps `size()` honest. And both are `noexcept`: pointer assignments cannot throw, and saying so matters more than any other `noexcept` in the class (below). `std::exchange(other.data_, nullptr)` from `<utility>` is the idiomatic one-liner for "take the value and leave this behind".

The self-check in the move assignment is cheap insurance: `a = std::move(a)` is rare but legal, and without the check the object would delete its block and then adopt the same, now dangling, pointer.

## The moved-from state

After a move, the source is **valid but unspecified**: it is a real object on which every operation without preconditions must still work — destroying it, assigning to it, calling `size()` or `empty()` — but what those calls return is up to the class. For your own types, say what it is: "a moved-from `IntBuffer` has size 0". For the standard library the answer differs by type:

| Type | After `T b = std::move(a);` |
| --- | --- |
| `std::vector` | `a` is guaranteed empty |
| `std::unique_ptr` | `a` is guaranteed null |
| `std::string` | valid but unspecified — usually empty, never rely on it |
| `int`, pointers | unchanged: built-in types copy |

The safe pattern is to not read a moved-from object at all until it has been given a new value. `a = std::vector<int>{}` or `a.clear()` afterwards is fine; `std::cout << a.size()` after moving a `std::string` is a bug that happens to print `0` on most compilers. Note too that `std::move` the *cast* is different from `std::move` the *algorithm* in `<algorithm>`, which moves elements one by one from a range and leaves the source container the same size with moved-from elements inside it.

## `noexcept` on moves, and why `std::vector` cares

When a `std::vector<T>` grows, it allocates a bigger block and transfers every element across. Moving them is cheap, but if a move constructor could throw halfway through, the vector would have some elements in the new block, some in the old, and no way to restore either — it would lose the *strong exception guarantee* that its `push_back` promises. So the vector asks: is `T`'s move constructor `noexcept`? If yes, it moves. If not, it **copies** every element, silently, on every reallocation. The check is `std::move_if_noexcept`, and the outcome for a class with a throwing (or merely unmarked) move constructor is that it is copied in the one place moves matter most.

Mark move operations `noexcept` whenever they only shuffle pointers and integers, which is nearly always. The standard containers' own moves are `noexcept`, so a rule-of-zero class built from them gets a `noexcept` move for free.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Using a moved-from `std::string` | Valid but unspecified: reading it is a bug that usually looks fine |
| Forgetting to null the source's pointer | Two owners again; the source's destructor frees the block you now hold |
| `const T&&` parameter | Cannot modify the source, so it cannot move; falls back to copying |
| Move operations without `noexcept` | `std::vector` copies your elements on every reallocation |
| Passing a named `T&&` on without `std::move` | It is an lvalue; the callee copies |
| `std::move` on something you use afterwards | The later use reads a transferred-from object |

## Key takeaways

- A move transfers a value in constant time and leaves the source valid but empty; it exists so returning, passing and inserting big objects is cheap.
- `T&&` binds only to rvalues; overload resolution picks it over `const T&` for temporaries and for anything wrapped in `std::move`.
- `std::move` is a cast to `T&&`; it moves nothing itself and, for a type without a move constructor, copies.
- A move constructor steals the members and nulls the source; move assignment releases its own first, then steals; both are `noexcept`.
- The moved-from state is valid but unspecified — define it for your types, trust `empty()` for `std::vector`, do not read a moved-from `std::string`.
- Without `noexcept` on the move constructor, `std::vector` copies elements when it reallocates.
