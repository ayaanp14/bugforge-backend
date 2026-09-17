---
title: Overloading rules — members, free functions and the compound-first idiom
minutes: 14
---
`a + b` means addition for `int`, `double` and `std::string`, and C++ lets it mean addition for your `Fraction`, `Money` or `Vec2` too: `total += price * qty` instead of `total.add(price.times(qty))`. The mechanism is only a function with a strange name, but the rules about *which* operators, *where* the function lives and *what* it returns decide whether the result reads like arithmetic or like a trap. This lesson settles those rules and the one idiom — compound first, binary from compound — that produces a consistent set every time.

## What an overloaded operator is

```cpp
struct Vec2 {
    double x = 0;
    double y = 0;
};

Vec2 operator+(const Vec2& a, const Vec2& b) {
    return Vec2{a.x + b.x, a.y + b.y};
}

Vec2 p{1, 2}, q{3, 4};
Vec2 r = p + q;             // the compiler rewrites this as operator+(p, q)
Vec2 s = operator+(p, q);   // legal, and exactly the same call
```

An expression `p + q` where at least one operand has class or enumeration type is looked up as a call to a function named `operator+`. Nothing else changes: precedence, associativity and arity are fixed by the grammar, so `a + b * c` still multiplies first however you define `*`, and you cannot invent `**` or give `+` three operands. Nor can you redefine an operator on built-in types alone — `int operator+(int, int)` is an error.

Almost every operator can be overloaded: the arithmetic and bitwise set, the comparisons, `<<` and `>>`, `[]`, `()`, `->`, `=`, the compound assignments, `++`/`--`, `!`, `,` and the conversion operators (lesson 5). Five cannot: `.`, `.*`, `::`, `?:` and `sizeof`. Three that *can* be overloaded should not be — `&&`, `||` and `,` — because an overloaded version is an ordinary function call: both operands are always evaluated, and the short-circuit guarantee is gone.

## Member or free function

An operator can be a member, in which case the left operand is `*this` and the parameter list holds only the right one, or a free function taking both operands:

```cpp
class Money {
public:
    explicit Money(long long cents) : cents_(cents) {}
    long long cents() const { return cents_; }
    Money& operator+=(const Money& o) { cents_ += o.cents_; return *this; }   // member: mutates *this
    friend Money operator+(Money a, const Money& b) { return a += b; }        // hidden friend: a free function
private:
    long long cents_;
};

Money operator*(const Money& m, long long k) { return Money(m.cents() * k); }
Money operator*(long long k, const Money& m) { return m * k; }                // 3 * price needs a free function
```

The choice is not taste. Four operators **must** be members: `=`, `[]`, `()` and `->` (and the conversion operators). Everything that mutates its left operand — the compound assignments, `++`, `--` — is naturally a member too. Symmetric binary operators — `+`, `-`, `*`, `==`, `<`, `<<` — belong outside the class, for one concrete reason: a member operator's left operand is never subject to implicit conversion. With `Money::operator*(long long)` as a member, `price * 3` compiles and `3 * price` does not, because `3` is an `int` and there is no `int::operator*`. A free function treats both sides alike. In `std::cout << m` the left operand is a `std::ostream`, a class you cannot add members to, so `operator<<` is always free (lesson 3).

A free operator that needs private members is declared `friend` inside the class, and defining it there — as `operator+` above — gives the *hidden friend* idiom: a non-member (`*this` does not exist inside it) that is found only when an argument is a `Money`, which keeps it out of unrelated overload sets and error messages. It is the modern default for a class's binary operators.

## Compound first, binary from compound

Write `+=` as the member that does the work; write `+` as a free function that copies its left operand, applies `+=` and returns the copy:

```cpp
Vec2& Vec2::operator+=(const Vec2& o) { x += o.x; y += o.y; return *this; }
Vec2& Vec2::operator*=(double k)      { x *= k;   y *= k;   return *this; }

Vec2 operator+(Vec2 a, const Vec2& b) { return a += b; }   // a is the copy; += returns it by reference
Vec2 operator*(Vec2 v, double k)      { return v *= k; }
Vec2 operator*(double k, Vec2 v)      { return v *= k; }
```

Taking the left operand **by value** is deliberate: the operator needs a copy to modify anyway, and a by-value parameter lets the compiler build that copy straight from a temporary, so `(a + b) + c` moves the intermediate rather than copying it. The idiom guarantees `a + b` and `a += b` can never disagree — there is one implementation — and the same shape serves `-`, `*`, `/`, `%` and the bitwise pairs.

## Unary operators and increment

Unary minus, `!` and `~` take no parameter as members (`Money operator-() const`) or one as free functions, return a new value and leave the operand alone. Increment and decrement come in two spellings that the language tells apart by a dummy parameter:

```cpp
class Counter {
public:
    Counter& operator++()   { ++n_; return *this; }                       // prefix:  ++c, returns the updated object
    Counter operator++(int) { Counter old = *this; ++*this; return old; } // postfix: c++, returns the OLD value
    int value() const { return n_; }
private:
    int n_ = 0;
};
```

The `int` is never used; it exists so the two overloads have different signatures. Prefix returns a reference to the object; postfix must return the previous value, which costs a copy — the reason `++it` is preferred over `it++` in loops. Implement postfix through prefix so the two cannot drift.

## Return types

| Operator | Return | Why |
| --- | --- | --- |
| `+ - * / %`, unary `-` | by value | A new value; the operands are untouched |
| `==`, `<` | `bool` | A comparison, not a value of the type |
| `+= -= *= /=`, `=`, prefix `++` | `T&` (`*this`) | The same object, updated; chains like the built-ins |
| postfix `++`/`--` | `T` by value | The old value exists nowhere else |
| `<<` on a stream | `std::ostream&` | So `os << a << b` chains |
| `[]` | `T&` / `const T&` | The element itself, assignable (lesson 4) |

Never return a reference to a local — it dangles the moment the function returns (Module 6, lesson 4). Mark every operator that does not modify `*this` as `const`, or it cannot be used on a `const Money` or through a `const&` parameter.

## Do as the ints do

The reader of `a + b` brings expectations from the built-in types, and an overload that violates them is worse than a named function. `+` adds and does not mutate; `==` is symmetric and agrees with `!=`; `<` is a strict order consistent with `==` (lesson 2); `+=` does what `+` then `=` would do. A `Matrix` whose `*` is element-wise, a `String` whose `-` removes a substring — each compiles, and each costs every future reader a trip to the definition. The standard library breaks the rule once, deliberately: `std::filesystem::path` defines `/` as join because `dir / "file.txt"` reads like a path. If your overload needs a comment to say what it does, write a named function.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `operator*` as a member, then `2 * v` | No conversion on a member's left operand: no match |
| `+` written independently of `+=` | The two drift; one gets fixed, the other does not |
| `operator+=` returning `void` or by value | `a += b += c` fails, or copies |
| Postfix `++` implemented as prefix | `c++` yields the new value; loops off by one |
| No `const` on `operator==` or `operator-()` | Cannot be used on `const` objects or `const&` parameters |
| `friend` operator declared but never defined | Linker error: undefined reference |

## Key takeaways

- An overloaded operator is a function named `operator@`; precedence, arity and the built-in meanings are untouchable.
- `=`, `[]`, `()`, `->` and conversions must be members; symmetric binary operators should be free functions (hidden friends), so conversions apply to both operands.
- Write `+=` as the member that works, and `+` as a one-line free function taking its left operand by value and returning `a += b`.
- Prefix `++` returns `T&`; postfix takes a dummy `int` and returns the old value — implement it via prefix.
- Return by value for results, `*this` by reference for assignments; mark non-mutating operators `const`.
- Do as the ints do: an operator that needs a comment should be a named function.
