---
title: this, const member functions and chaining
minutes: 14
---
Every member function runs on behalf of one object, and two questions follow from that: how does the function name that object, and what may it do to it? The first answer is `this`. The second is `const`, which turns a member function's promise not to modify its object into something the compiler checks — and, through const objects, `const T&` parameters and const/non-const overloads, into a rule that shapes every interface you will write. This lesson settles both, adds `mutable` for the members the promise should not cover, shows why mutators that return `*this` can be chained, and ends with the question of when an operation should not be a member at all.

## What `this` is

Inside a non-static member function, `this` is a pointer to the object the function was called on. It is a keyword, not a variable you declare; its type is `Account*` in an ordinary member function of `Account` and `const Account*` in a const one. Every unqualified member name in the body is short for `this->member`, so you rarely write `this` at all:

```cpp
class Account {
    std::string owner_;
    long long balance_ = 0;
public:
    void rename(const std::string& owner) { owner_ = owner; }          // this->owner_ = owner
    void rename2(const std::string& owner_) { this->owner_ = owner_; }  // a parameter shadows the member
    const Account& self() const { return *this; }                      // the object itself
};
```

There are two occasions for writing `this` explicitly. When a parameter or local shadows a member, `this->` is the only way to name the member — the trailing-underscore convention exists so that this never happens. And when the function needs the whole object: to return it (`*this`), to pass it to another function, or to compare identity (`this == &other` in an assignment operator, Module 9). `this` is never null in a well-formed program; calling a member function through a null pointer is undefined behaviour, whatever it happens to print. Static member functions (lesson 4) have no `this`, because they are not called on an object.

## const member functions

```cpp
class Account {
    long long balance_ = 0;
public:
    long long balance() const { return balance_; }     // promises not to change *this
    void deposit(long long amount) { balance_ += amount; }
};
```

The `const` after the parameter list qualifies `this`: inside `balance()` the object is a `const Account`, every data member is read-only, and the body may call only other const member functions. Assign to `balance_` there and the message names the mechanism: "assignment of member 'balance_' in read-only object". The qualifier is part of the function's type, so a declaration and its out-of-class definition must both carry it, and `Type::name() const` is the form of the definition.

What the promise buys is on the caller's side. A `const Account`, and — far more often — a `const Account&` parameter, can call *only* const member functions:

```cpp
void print(const Account& a) {
    std::cout << a.balance() << '\n';   // fine: balance() is const
    a.deposit(5);                       // error: passing 'const Account' as 'this' argument discards qualifiers
}
```

Since `const T&` is the default way to pass anything larger than a register (Module 4, lesson 2), a member function that is not marked `const` when it could be is a member function that most of the program cannot call. Const-correctness is contagious in the useful direction (Module 6, lesson 5): mark every member function that does not modify the object `const` on the day you write it, and the compiler will tell you when a later edit breaks the promise.

## const and non-const overloads

A member function may be overloaded on the constness of the object. The standard containers do it everywhere:

```cpp
class Readings {
    std::vector<double> values_;
public:
    double& at(std::size_t i) { return values_.at(i); }               // (1) for a non-const Readings
    const double& at(std::size_t i) const { return values_.at(i); }   // (2) for a const Readings
};

Readings r;               // ... fill ...
r.at(0) = 3.5;            // (1): a reference you can assign through
const Readings& view = r;
double x = view.at(0);    // (2): read-only access
view.at(0) = 1.0;         // error: assignment of read-only location
```

Overload resolution picks (2) when the object is const and (1) otherwise — exactly the choice `std::vector::operator[]`, `front()` and `at()` make. Without (2), a `const Readings&` could not be indexed at all; without (1), nobody could write through the result. When the two bodies are identical apart from constness, the non-const one may call the const one and cast the constness off the *result* — `return const_cast<double&>(std::as_const(*this).at(i));` — which is the one respectable use of `const_cast`, because the object was never really const. C++23's "deducing this" writes the pair once; on this track's runtime it is reading only.

## mutable

Sometimes a const member function must change a member that is not part of the object's *logical* value: a cache of an expensive result, a count of how often the object was read, a mutex that must be locked even to read (Module 17). `mutable` exempts a member from the const promise:

```cpp
class Stats {
    std::vector<double> values_;
    mutable double cachedMean_ = 0;
    mutable bool cacheValid_ = false;
public:
    void add(double v) { values_.push_back(v); cacheValid_ = false; }
    double mean() const {
        if (!cacheValid_) {
            double sum = 0;
            for (double v : values_) sum += v;
            cachedMean_ = values_.empty() ? 0 : sum / static_cast<double>(values_.size());
            cacheValid_ = true;     // allowed: the member is mutable
        }
        return cachedMean_;
    }
};
```

`mean()` is const from the caller's point of view — calling it twice gives the same answer and changes nothing observable — even though the second call skips the loop. That is the test: a `mutable` member is one whose changes are invisible through the interface. A `mutable` member that *is* part of the value is a lie about constness, and the compiler cannot catch it. The first exercise builds exactly this cache and counts how often it is rebuilt.

## Returning `*this` for chaining

A mutator that returns a reference to its own object lets calls be strung together:

```cpp
class Query {
    std::string table_, where_;
    int limit_ = 0;
public:
    Query& from(std::string t) { table_ = std::move(t); return *this; }
    Query& where(std::string w) { where_ = std::move(w); return *this; }
    Query& limit(int n) { limit_ = n; return *this; }
    std::string text() const;
};

std::string sql = Query{}.from("users").where("age > 18").limit(10).text();
```

`from` returns `*this` — the object itself, by reference — so `.where(...)` is called on the same `Query`, and so on down the line. This is how `std::string::append`, `std::ostream::operator<<` and every builder-style interface work. The return type must be `Query&`, not `Query`: returning by value would hand the next call a *copy*, the chain would modify the copy, and the original would be untouched — a bug that compiles cleanly and is found only by printing. A const member that returns the object returns `const Query&`.

## Member function or free function?

Not every operation on a class should be a member. A member can see the private state and is the natural home for anything that modifies the object or reads a representation detail. But an operation that can be written entirely in terms of the public interface — `isEmpty()` when there is a `size()`, a `print()` that only calls accessors — gains nothing from being a member and costs something: one more function that could break the invariant (lesson 5), one more thing to rewrite if the representation changes. Scott Meyers's rule: **prefer non-member non-friend functions** whenever the public interface suffices, because they *increase* encapsulation — fewer functions touch the private data. Symmetric binary operations (`==`, `+`, `<`) are free functions for a second reason: a member `a.equals(b)` converts only `b` (Module 11, lesson 1). An operation that needs private access to two objects at once (`transfer`) is a free function declared `friend` (lesson 5). Keep as members what needs private access to one object; put everything else beside the class, in the same header and namespace.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Forgetting `const` on a getter | Every `const T&` parameter and const object in the program cannot call it. |
| `const` on the declaration but not the definition (or vice versa) | "No declaration matches" — the qualifier is part of the signature. |
| A chaining mutator returning `T` instead of `T&` | The chain modifies temporaries; the original is unchanged. |
| A `mutable` member that is part of the logical value | The const promise is a lie; callers see a "const" object change. |
| `const_cast` to modify a genuinely const object | Undefined behaviour; the cast is only for a non-const object seen through a const reference. |
| Calling a member function through a null pointer | Undefined behaviour, even if the function never touches a member. |

## Key takeaways

- `this` is a pointer to the object a member function was called on; `*this` is the object, and `this->m` is the explicit form of a member name.
- A `const` member function promises not to modify the object and is the only kind a const object or a `const T&` can call — mark every non-mutating member `const`.
- Overload on constness (`T& at()` / `const T& at() const`) so const and non-const objects each get the right access.
- `mutable` exempts a member from the promise; use it for caches and counters that are not part of the logical value.
- Mutators that return `T&` and `return *this;` chain; returning by value silently breaks the chain.
- Prefer a non-member non-friend function whenever the public interface suffices.
