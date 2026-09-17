---
title: The rule of five and the rule of zero
minutes: 14
---
With moves in the language, a class has five special member functions beyond the default constructor: the destructor, the copy constructor, the copy assignment, the move constructor and the move assignment. The compiler generates each of them under rules that depend on which of the others you declared, and those rules have a consequence that surprises everyone once: writing a destructor switches the moves off. This lesson lays out the generation table, states the rule of five and the rule of zero, and gives the one-line decision for which of them a class should follow.

## The five

| Special member | Signature | Generated version does |
| --- | --- | --- |
| Destructor | `~T()` | destroys members in reverse order |
| Copy constructor | `T(const T&)` | copy-constructs each member |
| Copy assignment | `T& operator=(const T&)` | copy-assigns each member |
| Move constructor | `T(T&&) noexcept` | move-constructs each member |
| Move assignment | `T& operator=(T&&) noexcept` | move-assigns each member |

Plus the default constructor `T()`, which the compiler generates only when the class declares no constructor at all — the rule Module 8 lesson 2 gave. The generated move operations are memberwise moves: each member is moved with `std::move`, so a member that is a `std::vector` is transferred and a member that is an `int` is copied. A generated move is `noexcept` when every member's move is.

## What the compiler generates, and when

The full rule fits in four lines:

1. If you declare **nothing**, all five are generated.
2. If you declare a **move constructor or move assignment**, the copy constructor and copy assignment are **deleted**. A type that knows how to move but says nothing about copying is presumed non-copyable — `std::unique_ptr` is exactly this shape.
3. If you declare a **copy constructor, copy assignment or destructor**, the move constructor and move assignment are **not declared** at all. They are not deleted: `std::move(x)` still compiles, overload resolution finds only `const T&`, and the object is *copied*.
4. `= default` and `= delete` both count as declaring.

Rule 3 is the trap. The reasoning behind it is sound — a class that wrote a destructor or copy is managing something, and a generated memberwise move might transfer that something incorrectly — but the failure mode is silent. The class still compiles, still runs, and is slower than it looks:

```cpp
struct Logged {
    std::vector<int> data;
    ~Logged() { std::cout << "gone\n"; }     // user-declared destructor: moves are not generated
};

Logged a;
Logged b = std::move(a);      // copies data — a million ints if there are a million
```

Nothing warns. The compiler was told the class has special needs and did the conservative thing. The fix is one line, `Logged(Logged&&) = default;` together with its assignment — or, better, not writing the destructor.

The rules are why "does this class have a move constructor?" is a real interview question with a three-part answer: yes if it declares nothing or declares the moves; no if it declares any of the copy operations or the destructor and does not also default the moves.

## The rule of five

The rule of three, extended: **if a class declares any one of the five, it should consider all five.** A rule-of-three class from before C++11 is correct after C++11 — copies work, moves fall back to copies — but it leaves performance behind, because everything that could have been a move is now a copy. Adding the two move operations completes it:

```cpp
class IntBuffer {
public:
    explicit IntBuffer(std::size_t n);
    IntBuffer(const IntBuffer& other);                 // deep copy
    IntBuffer& operator=(const IntBuffer& other);      // self-safe deep copy
    IntBuffer(IntBuffer&& other) noexcept;             // steal, null the source
    IntBuffer& operator=(IntBuffer&& other) noexcept;  // release, steal, null
    ~IntBuffer();                                      // delete[]
    // ...
};
```

With copy-and-swap the count drops: a by-value `operator=(IntBuffer other)` serves both assignments, chosen by whether the argument is an lvalue (copy-constructed parameter) or an rvalue (move-constructed parameter). That version is four functions plus a `swap`.

"Consider" is deliberate. Some classes should declare the moves as `= delete` — a type that must never leave its address, such as a mutex — and some should declare the copies deleted and only the moves, like a file handle. The rule is that the decision must be made for all five, not that all five must be written.

## The rule of zero

The better rule is to never be in that position. **A class that declares none of the five** gets correct copies, correct moves and a correct destructor from its members — provided every member owns itself:

```cpp
class Document {
public:
    Document(std::string title, std::vector<std::string> lines)
        : title_(std::move(title)), lines_(std::move(lines)) {}
    // no destructor, no copy, no move: std::string and std::vector do it all
private:
    std::string title_;
    std::vector<std::string> lines_;
};
```

`Document` is copyable (both members are), movable (both members are, `noexcept`), and destroys itself. It cannot double-delete, cannot leak, cannot be shallow-copied, because there is no code in it that could get those things wrong. The same holds when a member is `std::unique_ptr`:

```cpp
class Grid {
public:
    Grid(std::size_t rows, std::size_t cols)
        : rows_(rows), cols_(cols), cells_(std::make_unique<int[]>(rows * cols)) {}
    bool empty() const { return !cells_; }
private:
    std::size_t rows_, cols_;
    std::unique_ptr<int[]> cells_;
};

Grid g(2, 3);
Grid h = std::move(g);     // moves cells_, copies rows_ and cols_; g.empty() is now true
Grid k = h;                // error: unique_ptr's copy constructor is deleted, so Grid's is too
```

The class is movable and non-copyable by construction, and the compiler says so at the point of use. Note what the moved-from `g` looks like: `rows_` and `cols_` still hold `2` and `3`, because ints copy, and `cells_` is null. A rule-of-zero class's moved-from state is the sum of its members' moved-from states, which is why `empty()` tests the pointer and not the sizes.

The name means what it says: the ideal number of special member functions in a class is zero. Ownership of raw resources belongs in small, single-purpose classes — `std::unique_ptr`, `std::vector`, a `FileHandle` you write once — and everything else composes them.

## Which rule, when

| The class... | Rule | Declare |
| --- | --- | --- |
| owns nothing directly; members are strings, vectors, smart pointers | zero | nothing |
| owns one raw resource (a `new[]` block, a file descriptor, a C handle) | five | all five, `noexcept` on the moves |
| must not be copied but may be moved | five | copies `= delete`, moves written or defaulted |
| must not be copied or moved (a mutex, a singleton) | five | copies `= delete`; the moves are then not generated, so `std::move` fails to compile too |
| is a polymorphic base | five | `virtual ~T() = default;` plus the four defaulted, usually `protected` (Module 10) |

Two habits follow. First, one raw resource per class: a class that owns two raw pointers has a copy assignment that must handle one allocation succeeding and the other failing, which is exactly the code nobody gets right. Second, `= default` is documentation: `Widget(Widget&&) = default;` in a class that needed a destructor says "I know the rule, and the memberwise move is correct here".

## Pitfalls

| Mistake | What happens |
| --- | --- |
| A destructor added for logging or debugging | The moves vanish; every `std::move` becomes a copy |
| Copy constructor written, move forgotten | Correct but slow: `std::move` and returns copy |
| Move constructor written, copies not mentioned | The copies are deleted; `T b = a;` fails to compile |
| Two raw owning pointers in one class | An assignment operator with a failure case between two allocations |
| Defaulting the moves in a class with a raw owning pointer | The memberwise move copies the pointer and leaves the source owning it too |

## Key takeaways

- Five special members: destructor, copy constructor, copy assignment, move constructor, move assignment — all generated memberwise when you declare none.
- Declaring a copy operation or a destructor stops the moves being generated; `std::move` then silently copies. Declaring a move deletes the copies.
- Rule of five: declare one, decide about all five. Rule of zero: own resources through members and declare none.
- A rule-of-zero class's moved-from state is its members' moved-from states — a `std::unique_ptr` becomes null, an `int` stays.
- Keep raw ownership in small single-resource classes and compose them; `= default` on a move documents that the memberwise version is right.
