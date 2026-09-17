---
title: Exception safety — guarantees, noexcept and RAII
minutes: 14
---
An exception that passes through a function is a return the function did not plan. What does the caller find afterwards — the old state, a new one, or half of each with a file handle leaked on the way? *Exception safety* is the discipline of answering that question for every function you write, and C++ makes the good answers cheap if you let objects own resources. This lesson settles the three guarantees, how RAII delivers the basic one for free, what `noexcept` promises and why `std::vector` reads it, why a destructor must never throw, and when a return value is the better tool.

## The three guarantees

Dave Abrahams named them while building the STL, and every standard library function documents which it gives:

| Guarantee | If the operation throws … | Examples |
| --- | --- | --- |
| **No-throw** | it cannot | destructors, `swap`, `std::move` of a well-designed type, `size()` |
| **Strong** | the state is exactly as before — commit or roll back | `std::vector::push_back`, `std::map::insert` of one element |
| **Basic** | no leak and every invariant holds, but the state may have changed | `std::vector::assign`, most multi-step updates |
| *none* | a leak, a half-built object, a broken invariant | a bug |

The order is deliberate: no-throw is strongest and rarest, basic is the floor. Consider a transfer between two ledgers:

```cpp
void transfer(Ledger& from, Ledger& to, long long amount) {
    from.withdraw(amount);   // may throw InsufficientFunds: nothing has changed yet — fine
    to.deposit(amount);      // may throw (say, an audit log allocation fails): the money has left `from`
}
```

If `deposit` throws, both ledgers are valid objects and nothing leaked — the *basic* guarantee — but the money is gone. Making it strong means doing every step that can fail before the first step that changes anything, or being able to undo.

## RAII makes the basic guarantee automatic

Stack unwinding runs destructors (lesson 1). So a resource held by an object whose destructor releases it is released on every exit path, including the ones you did not write:

```cpp
void writeReport(const std::vector<Row>& rows, std::mutex& m) {
    std::ofstream out("report.txt");            // closed by ~ofstream
    std::lock_guard<std::mutex> lock(m);        // unlocked by ~lock_guard
    auto buffer = std::make_unique<char[]>(4096);   // freed by ~unique_ptr
    for (const auto& r : rows) format(out, r, buffer.get());   // may throw: all three are still released
}
```

The raw form — `FILE* f = fopen(...)`, `m.lock()`, `new char[4096]` — leaks all three the moment `format` throws, because the `fclose`, `unlock` and `delete[]` lines are never reached. Module 7, lesson 3 introduced RAII as a lifetime tool; this is its other half. The rule: never hold a resource in a raw variable that a throw could skip. Resources belong to objects.

## No finally: the scope guard

Java and JavaScript run cleanup in `finally`. C++ deliberately has none, because a destructor generalises it — the cleanup is attached to the *thing*, not repeated at every call site. When the cleanup is a one-off action rather than a resource, wrap it in a guard:

```cpp
template <typename F>
class ScopeExit {
public:
    explicit ScopeExit(F f) : f_(std::move(f)) {}
    ~ScopeExit() { if (active_) f_(); }
    void release() noexcept { active_ = false; }   // commit: the cleanup is no longer wanted
    ScopeExit(const ScopeExit&) = delete;
    ScopeExit& operator=(const ScopeExit&) = delete;
private:
    F f_;
    bool active_ = true;
};

void update(Ledger& ledger, const Batch& batch) {
    Ledger backup = ledger;
    ScopeExit rollback([&] { ledger = std::move(backup); });   // runs on any exit ...
    for (const auto& entry : batch) ledger.apply(entry);       // ... including a throw from here
    rollback.release();                                        // ... unless every apply succeeded
}
```

Class template argument deduction names the lambda's type for you. The guard turns a basic-guarantee loop into a strong one: on a throw, the destructor restores the backup during unwinding; on success, `release()` disarms it.

## The strong guarantee: risky work first, commit last

The general recipe needs no guard at all — do everything that can throw on a temporary, then commit with operations that cannot throw:

```cpp
void Inventory::load(const std::string& path) {
    std::map<std::string, int> fresh = parse(path);   // every allocation and every parse error happens here
    items_.swap(fresh);                               // swap is no-throw: the commit cannot fail
}
```

If `parse` throws, `items_` was never touched. Copy-and-swap assignment (Module 9, lesson 2) is this recipe applied to `operator=`. The price is a temporary — a full copy for a large object — which is why the standard library gives the strong guarantee where it is cheap and documents basic where it is not. Say which you give in the function's comment.

## noexcept

`void f() noexcept;` declares that `f` will not let an exception escape. It is a promise, not a check: the compiler will happily compile a `throw` inside `f`, and when one gets out, `std::terminate` is called with no unwinding to the caller. The specifier can be conditional — `noexcept(std::is_nothrow_move_constructible_v<T>)` — and the operator form `noexcept(expr)` asks whether an expression could throw without evaluating it: `noexcept(v.at(0))` is `false`, `noexcept(v.size())` is `true`.

Some functions are `noexcept` without saying so. Destructors are implicitly `noexcept` unless a member's destructor is not; defaulted special members (Module 9, lesson 4) are `noexcept` when every member's corresponding operation is. So a class whose members are `std::string` and `std::vector` gets a `noexcept` defaulted move for free, and a class with a user-written move constructor gets nothing unless you write the word.

## Why std::vector reads noexcept

When a vector grows, it must relocate every existing element into the new buffer. Moving them is fast, but if a move throws halfway, the old buffer is already partly gutted and the strong guarantee `push_back` promises is impossible. Copying is safe — the old buffer stays intact until the last copy succeeds — but slow. The library resolves this with `std::move_if_noexcept(elem)`, which yields `T&&` when `T`'s move constructor is `noexcept` (or `T` has no copy constructor at all) and `const T&` otherwise. So a type whose move constructor is `noexcept` is moved; a type whose move constructor may throw is *copied* on every reallocation, silently, forever. Declare move constructors and move assignment `noexcept`. The instrumented exercise makes the decision visible.

## Never throw from a destructor

Destructors run during unwinding. If one throws while an exception is already in flight, two exceptions exist at once and `std::terminate` is called — there is no way to handle both. Since C++11 destructors are implicitly `noexcept`, so a throwing destructor terminates even outside unwinding. The design consequence: a cleanup that can genuinely fail — flushing a file, committing a database transaction — gets an explicit member function that may throw, and the destructor calls a swallowing version:

```cpp
class Connection {
public:
    void close() { if (open_) { open_ = false; sendClose(); } }   // may throw: callers who care call this
    ~Connection() {
        try { close(); } catch (...) { /* log at most; never rethrow */ }
    }
private:
    bool open_ = true;
    void sendClose();
};
```

`std::fstream` does the same: its destructor closes and swallows any failure, and a program that needs to know calls `close()` and checks the stream.

## Exceptions or return values?

| Situation | Prefer |
| --- | --- |
| The caller expects the failure often — a lookup miss, user input that fails to parse | a return value: `std::optional` or an error code (lessons 3 and 5) |
| The failure is rare and the immediate caller cannot fix it | an exception |
| A constructor cannot establish its invariant | an exception — constructors have no return value |
| Operators, callbacks, deep call chains with no channel for a code | an exception |
| A hot loop, or a codebase built with `-fno-exceptions` | a return value |
| Destructors, `swap`, moves | neither — they must not fail |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `new`/`lock()`/`fopen` in a raw variable | Leaked on any throw before the release line |
| A user-written move constructor without `noexcept` | `std::vector` copies on every reallocation |
| A destructor that throws | `std::terminate`, immediately |
| Changing state before the last step that can throw | Basic guarantee where the caller assumed strong |
| Marking a function `noexcept` that calls `at()` or allocates | A throw terminates instead of propagating |

## Key takeaways

- No-throw, strong, basic: know which one each function gives and say so.
- RAII plus unwinding gives the basic guarantee for free; a raw resource in a local is a leak waiting for a throw.
- Strong guarantee recipe: do the throwing work on a temporary, commit with `swap` or a move; a scope guard undoes on failure.
- `noexcept` is a promise enforced by `std::terminate`; destructors have it implicitly.
- `std::vector` moves on reallocation only when the move is `noexcept` — write the word on every move constructor.
- Never let a destructor throw; give failing cleanup an explicit `close()`.
