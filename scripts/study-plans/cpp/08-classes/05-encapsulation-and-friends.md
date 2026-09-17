---
title: Encapsulation and friends — the interface a class publishes
minutes: 14
---
A class earns its `private` section by having something to protect. That something is an **invariant**: a statement about the members that is true of every object between operations — the denominator is never zero, the size never exceeds the capacity, the vector is sorted. Public data cannot keep such a promise, because any line of the program can break it. This lesson makes the case for private data precisely, sorts the accessors that earn their place from the ones that merely re-publish the members, introduces `friend` for the few operations that genuinely need private access from outside, previews `operator<<` as the commonest friend, and ends with the question every class should answer: what interface does it publish?

## Invariants

```cpp
class Fraction {
    long long num_;
    long long den_;   // invariant: den_ > 0 and gcd(|num_|, den_) == 1
public:
    Fraction(long long n, long long d);              // establishes it (throws on d == 0)
    Fraction add(const Fraction& o) const;           // preserves it: returns a normalised result
    long long denominator() const { return den_; }   // may assume it
};
```

The invariant is a contract between the constructor, the mutators and the readers. The **constructor establishes** it — an object that exists is valid (lesson 2). Every **public mutator preserves** it: it may leave the object in any state that satisfies the invariant, and in no other. Every **reader may assume** it: `add` divides by `den_` without checking for zero, because zero is impossible. That last part is the payoff. Without the invariant, every function that touches a `Fraction` defends against a zero denominator forever; with it, one check in the constructor covers the program.

Write the invariant down, as a comment beside the private members. If you cannot state one, the type has no reason to hide its data — it is a struct (lesson 1), and pretending otherwise adds ceremony without protection.

## Why data is private

Privacy is not secrecy: the private section sits in the header for anyone to read. It is *control*. Every write to the members goes through code the class author wrote, so the invariant can be checked at each write, and the representation can change without touching any caller. A `Fraction` stored as two `long long`s today could become a fixed-point number tomorrow, and `add`'s callers would never know.

```cpp
struct Percentage { int value; };          // anyone can write p.value = 250

class Percentage {
    int value_;                            // invariant: 0 <= value_ <= 100
public:
    explicit Percentage(int v);            // the only way in, and it checks
    int value() const { return value_; }
};
```

The class version is four lines longer and infinitely more trustworthy: a `Percentage` that exists is between 0 and 100, wherever it came from and however many functions have handled it since.

## Accessors that earn their place — and the ones that do not

The reflex "make the data private and add `getX()` and `setX()` for every member" produces a struct with extra steps: every member can still be set to anything, and now it takes a function call. An accessor earns its place when it does something the bare member cannot:

| Accessor | Verdict |
| --- | --- |
| `void setBalance(long long b)` on an `Account` | Does not earn it: bypasses every rule about deposits and withdrawals. |
| `bool withdraw(long long amount)` | Earns it: checks funds, preserves `balance_ >= 0`, reports refusal. |
| `int getYear() const` on a `Date` | Fine as a reader — but name it `year()`; the `get` prefix says nothing. |
| `int dayOfYear() const` | Earns it: a derived value computed from the representation. |
| `std::vector<int>& items()` (non-const reference) | Breaks encapsulation: the caller can now edit the vector behind the invariant's back. |
| `const std::vector<int>& items() const` | Acceptable for reading a large member without copying it. |

Two rules fall out. Readers return by value for small types and by `const T&` for large ones — never a non-const reference or pointer to private state, which is a public member with more syntax. And mutators are *operations*, named for what they do to the object (`deposit`, `withdraw`, `normalise`), not for the member they happen to change. A class whose public functions are all `getX`/`setX` pairs has not found its operations yet.

## friend functions

Occasionally the right function cannot be a member and still needs private access. `friend` grants it, one function at a time:

```cpp
class Account {
    long long balance_;
public:
    explicit Account(long long opening) : balance_(opening) {}
    friend bool transfer(Account& from, Account& to, long long amount);   // a declaration, not a member
};

bool transfer(Account& from, Account& to, long long amount) {             // an ordinary free function
    if (amount <= 0 || from.balance_ < amount) return false;
    from.balance_ -= amount;      // allowed: transfer is a friend
    to.balance_ += amount;
    return true;
}
```

`transfer` acts on two accounts symmetrically and must change both or neither. As a member it would be lopsided — `from.transferTo(to, n)` — and the free function says what it is. The `friend` line inside the class does not make the function a member: it has no `this`, it is called as `transfer(a, b, 5)`, and its definition carries no `Account::`. Friendship has three properties worth memorising. It is **granted, not taken**: the class names its friends; a function cannot declare itself one. It is **not transitive**: a friend of `Account` gets no access to the private parts of `Account`'s members. And it is **not inherited** (Module 10). Use it sparingly — every friend is one more function that can break the invariant, and the count of such functions is the measure of how encapsulated a class really is.

## friend classes

`friend class Auditor;` inside `Account` lets every member function of `Auditor` read and write `Account`'s private members. This is for pairs designed together — a container and its iterator, a builder and the object it assembles, a test fixture and the class under test. A friend class is a statement that the two are one design in two types; if that is not true, the friendship is a shortcut around an interface that should exist. The second exercise pairs an `Account` with an `Auditor` that reads a counter no public function exposes.

## `operator<<` as a friend

The commonest friend in real code prints an object to a stream:

```cpp
class Money {
    long long cents_;
public:
    explicit Money(long long cents) : cents_(cents) {}
    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        return os << m.cents_ / 100 << '.' << (m.cents_ % 100 < 10 ? "0" : "") << m.cents_ % 100;
    }
};

std::cout << Money{1234} << '\n';    // 12.34
```

It cannot be a member of `Money`, because the left operand of `<<` is the stream, and a member `Money::operator<<` would put the `Money` on the left. Defined inside the class body with `friend`, it is a free function with access to `cents_` that the compiler finds through the `Money` argument. Module 11, lesson 3 covers stream operators properly — returning the stream, respecting its formatting state, reading a value back with `>>`; this is the shape to recognise, and the first exercise uses it.

## The interface a class publishes

The public section is the class's contract with the rest of the program. It should be **complete** — everything a caller legitimately needs is possible through it — and **minimal** — nothing that could be written from the other public functions (lesson 3's rule), no accessor added "in case", no mutator that merely sets a member. Put it first in the class body, because it is what readers come for; put the private data last, with its invariant in a comment. Then count: how many functions can modify the private members? Constructors, mutators, friends. That number is the surface across which the invariant can be broken, and a good class keeps it small.

## Pitfalls

- **Public data with an invariant** — a `size_` anyone can set past the buffer's end.
- **A setter for every member** — the invariant is unenforceable and the class is a verbose struct.
- **Returning a non-const reference or pointer to a private member** — encapsulation in name only.
- **Making a function a friend because it was convenient** — check whether the public interface already suffices.
- **Assuming friendship is mutual or transitive** — `Auditor` being a friend of `Account` gives `Account` nothing, and `Auditor`'s own friends nothing.
- **`operator<<` as a member** — the operands are the wrong way round; it must be a free function.

## Key takeaways

- An invariant is what makes private data worth it: the constructor establishes it, mutators preserve it, readers assume it. Write it down.
- Accessors earn their place by validating, deriving or protecting the representation; `getX`/`setX` for every member is a struct in disguise.
- Never return a non-const reference or pointer to private state.
- `friend` grants one function or class private access; it is granted by the class, not transitive, not inherited — and every friend widens the surface that can break the invariant.
- `operator<<` is the archetypal friend: it must be a free function because the stream is the left operand.
- Publish an interface that is complete and minimal; the private section, with its invariant, comes last.
