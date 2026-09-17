---
title: RAII — a resource's lifetime is an object's lifetime
minutes: 15
---
C++ has no `finally`, no `using` block, no `with` statement and no garbage collector, and it needs none of them, because it has something those languages lack: a destructor that runs at a moment the compiler can see. **Resource Acquisition Is Initialisation** — RAII, an awkward name for a simple rule — says: acquire the resource in a constructor, release it in the destructor, and let the object's lifetime carry the resource's. Every path out of a scope then releases it, including the paths you did not write. This lesson shows the rule, the guarantees it rests on, the resources it is used for, and why it is the idiom that makes exceptions usable at all.

## The rule

A resource is anything that must be given back: heap memory, an open file, a mutex, a socket, a counter that must be decremented, a database transaction. Manual code acquires it, uses it, releases it — and must release it on every exit:

```cpp
bool save(const std::string& path, const std::vector<int>& data) {
    FILE* f = std::fopen(path.c_str(), "w");
    if (!f) return false;
    for (int x : data) {
        if (std::fprintf(f, "%d\n", x) < 0) { std::fclose(f); return false; }
    }
    std::fclose(f);
    return true;
}
```

Two `fclose` calls for one file, and a third would be needed if anything in the loop could throw. With RAII the release is written once, in a destructor:

```cpp
bool save(const std::string& path, const std::vector<int>& data) {
    std::ofstream out(path);            // acquires: opens the file
    if (!out) return false;
    for (int x : data) out << x << '\n';
    return static_cast<bool>(out);
}                                       // releases: out's destructor closes the file — on every path
```

`std::ofstream` is an RAII class: its constructor opens, its destructor flushes and closes. The function has no cleanup code because the cleanup is a property of the type, not of the function.

## What the language guarantees

Three rules make RAII work, and they are guarantees, not conventions:

1. **A destructor runs when an automatic object's block is left** — by falling off the end, by `return`, `break`, `continue` or `goto`, or by an exception propagating through.
2. **Destruction is in reverse order of construction.** In one block, the last declared object is destroyed first; a class's members are destroyed after its destructor body, in reverse declaration order (Module 9 lesson 2). Reverse order is what makes dependencies safe: a lock acquired after a file is released before it.
3. **During stack unwinding** — the walk from a `throw` to the `catch` that handles it — every automatic object in every frame being abandoned is destroyed before the handler runs. Module 15 covers exceptions; the fact that matters here is that RAII cleanup happens *even then*.

```cpp
struct Log {
    std::string name;
    explicit Log(std::string n) : name(std::move(n)) { std::cout << "begin " << name << '\n'; }
    ~Log() { std::cout << "end " << name << '\n'; }
};

void inner() {
    Log l("inner");
    throw std::runtime_error("boom");
}

int main() {
    try {
        Log l("outer");
        inner();
    } catch (const std::runtime_error& e) {
        std::cout << "caught " << e.what() << '\n';
    }
}
```

Output: `begin outer`, `begin inner`, `end inner`, `end outer`, `caught boom`. Both `end` lines print *before* `caught`, because unwinding runs destructors on the way to the handler. The first exercise builds a logger like this and drives it from input, exception included.

## A scope guard

Sometimes the cleanup is a piece of code rather than a resource with a class of its own. A **scope guard** holds a callable and runs it in its destructor:

```cpp
#include <functional>

class ScopeExit {
public:
    explicit ScopeExit(std::function<void()> f) : action_(std::move(f)) {}
    ~ScopeExit() { action_(); }
    ScopeExit(const ScopeExit&) = delete;
    ScopeExit& operator=(const ScopeExit&) = delete;
private:
    std::function<void()> action_;
};

void process(int& depth) {
    ++depth;
    ScopeExit restore([&] { --depth; std::cout << "restored\n"; });
    // … work that may return early or throw …
}   // restored
```

The lambda captures by reference (Module 4 lesson 5) and runs at the brace whatever happened above it. Module 12 shows the template version that avoids `std::function`; the shape is the same. Copying is deleted because a copied guard would run the action twice.

## One shape, many resources

| Resource | RAII type | Constructor | Destructor |
| --- | --- | --- | --- |
| heap memory | `std::vector`, `std::string`, `std::unique_ptr` | allocates | frees |
| a file | `std::ofstream`, `std::ifstream` | opens | flushes and closes |
| a mutex | `std::lock_guard`, `std::scoped_lock` (Module 17) | locks | unlocks |
| a counter, a nesting depth, an "in progress" flag | a small class of your own | increments, sets | decrements, clears |
| a transaction | a commit-or-rollback guard | snapshots | rolls back unless committed |
| elapsed time | a scope timer | reads the clock | prints the difference |

The last row never appears in a judged exercise — wall-clock output is not deterministic — but it is the everyday use: `Timer t("parse");` at the top of a function, and the duration prints at every exit.

## The transaction guard

A guard that undoes work unless told the work succeeded is RAII's strongest trick:

```cpp
class Transaction {
public:
    explicit Transaction(long long& balance) : balance_(balance), saved_(balance) {}
    ~Transaction() { if (!committed_) balance_ = saved_; }
    void commit() { committed_ = true; }
private:
    long long& balance_;
    long long saved_;
    bool committed_ = false;
};
```

Apply the changes, and if every step succeeded call `commit()`; any early return or exception leaves `committed_` false, and the destructor restores the snapshot. The caller writes no rollback code, and cannot forget to. The second exercise builds exactly this.

## Why there is no finally

`finally` attaches cleanup to a *block*. RAII attaches it to a *type*, and the difference is who has to remember. With `finally`, every function that opens a file must write the close; forget it once and the leak is in that function. With RAII, `std::ofstream` closes itself in every function that will ever use it, written once by the library author. RAII also composes: three resources are three declarations, destroyed in reverse order, where `finally` would be three nested `try` blocks. Stroustrup's argument was that `finally` would be used instead of RAII by people who did not yet know the better tool, and the committee has declined it every time it has been proposed.

The rule has two conditions. A destructor must not throw — an exception leaving a destructor during unwinding terminates the program (Module 15 lesson 2) — so a release that can fail reports through another channel, or swallows the failure. And a class that owns a resource must say what copying means: deleted, deep, or transferred (Module 9). Both are consequences of "the destructor is the cleanup": it must always succeed, and it must run exactly once per resource.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `ScopeExit([&] { … });` with no variable name | A temporary: constructed and destroyed on the same line, so the action runs immediately. |
| `new ScopeExit(…)` | A heap guard has no scope; the action never runs. |
| Copying a guard | The action runs twice (delete the copy operations). |
| Throwing from a destructor | `std::terminate` when it happens during unwinding. |
| A resource acquired outside any object "just this once" | The early return you add next month leaks it. |

## Key takeaways

- RAII: acquire in the constructor, release in the destructor; the object's scope is the resource's lifetime.
- Destructors run on every exit path, in reverse order of construction, and during exception unwinding before the handler.
- `std::vector`, `std::string`, `std::ofstream`, `std::lock_guard` and `std::unique_ptr` are RAII types; a scope guard makes any cleanup one.
- A commit-or-rollback guard undoes work unless `commit()` is called.
- No `finally`, because the type rather than the block owns the cleanup; destructors must not throw, and owning types must define copying.
