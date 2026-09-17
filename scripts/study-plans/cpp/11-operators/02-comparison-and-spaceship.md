---
title: Comparison and the spaceship operator
minutes: 15
---
A type that can be compared can be sorted, searched, deduplicated and used as a `std::map` key — most of the standard library opens up the moment `<` and `==` exist. Before C++20 that meant writing six operators by hand and keeping them consistent; since C++20 one line, `auto operator<=>(const T&) const = default;`, produces the whole set from the members in declaration order. This lesson settles what `==` and `<` must promise, how the *three-way comparison* `<=>` and the rewritten expressions work, which of `strong_ordering`, `weak_ordering` and `partial_ordering` a type should return, and what `std::sort` and `std::set` actually call.

## Equality

```cpp
struct Version {
    int major, minor, patch;
    bool operator==(const Version&) const = default;   // memberwise, in declaration order
};

Version a{1, 2, 3}, b{1, 2, 4};
a == b;   // false
a != b;   // true — rewritten by the compiler as !(a == b)
```

`operator==` returns `bool` and is a `const` member (or a free function with two `const&` parameters). Defaulting it compares each member with its own `==`, in the order they are declared, and stops at the first difference. C++20 also *rewrites*: `a != b` becomes `!(a == b)`, and when the operand types differ, `b == a` is tried as `a == b` reversed — so one `==` serves both directions and `!=` no longer needs writing. Equality must be an equivalence relation: reflexive, symmetric, transitive. A hand-written `==` that ignores a member (a cached hash, a timestamp) is legitimate as long as `<` ignores it too.

## Ordering before C++20

Ordered containers and `std::sort` need `<` and nothing else, and `<` must be a **strict weak ordering**: `a < a` is false, `a < b` implies `!(b < a)`, and "neither is less" is transitive. The pre-C++20 way to write it for several members is `std::tie`, which compares lexicographically:

```cpp
bool operator<(const Version& a, const Version& b) {
    return std::tie(a.major, a.minor, a.patch) < std::tie(b.major, b.minor, b.patch);
}
bool operator>(const Version& a, const Version& b)  { return b < a; }
bool operator<=(const Version& a, const Version& b) { return !(b < a); }
bool operator>=(const Version& a, const Version& b) { return !(a < b); }
```

Four functions derived from one, and `==`/`!=` separately: six operators for one idea. The classic bug is `<=` written as the comparison itself (`return a.x <= b.x;`) — not strict, so `std::sort` may read out of bounds and `std::set` cannot find what it just inserted.

## The spaceship operator

`a <=> b` asks "less, equal or greater?" once and answers with a *comparison category* value that itself compares to `0`:

```cpp
#include <compare>

struct Version {
    int major, minor, patch;
    auto operator<=>(const Version&) const = default;   // also declares operator== as defaulted
};

Version a{1, 2, 10}, b{1, 2, 9};
a < b;         // rewritten as (a <=> b) < 0    → false
a >= b;        // rewritten as (a <=> b) >= 0   → true
a == b;        // the defaulted ==, NOT <=>     → false
std::strong_ordering r = a <=> b;   // std::strong_ordering::greater
```

The compiler rewrites each of `<`, `>`, `<=` and `>=` as a call to `<=>` compared with the literal `0` (only `0` — `(a <=> b) < 1` is an error by design). A **defaulted** `<=>` compares members in declaration order and, as a courtesy, also declares a defaulted `operator==`, so one line yields all six. The order of the members is therefore the order of comparison: `major, minor, patch` sorts `1.2.9` before `1.2.10`, which a string comparison would not.

`==` is deliberately not derived from `<=>`. For a `std::string` the three-way comparison must scan the characters, while equality can reject two strings of different length instantly, so the language keeps them separate — and that has a consequence: if you write `<=>` **yourself**, you get the four relational operators and no `==`. Add `bool operator==(const T&) const = default;` (or your own) alongside, or `a == b` does not compile.

## Three orderings

| Category | Meaning | Examples | Converts to |
| --- | --- | --- | --- |
| `std::strong_ordering` | Equal values are substitutable | `int`, `std::string`, a defaulted `Version` | weak, partial |
| `std::weak_ordering` | Equivalent but distinguishable | Case-insensitive names, a struct with a member `<=>` ignores | partial |
| `std::partial_ordering` | Some pairs are `unordered` | `double` (NaN), a struct with a `double` member | — |

`auto` as the return type of a defaulted `<=>` deduces the *weakest* category among the members, so adding one `double` field turns a `strong_ordering` type into a `partial_ordering` one — and `a < b` becomes `false` in both directions for a NaN. Declaring the return type as `std::strong_ordering` instead makes the defaulted operator *deleted* when a member cannot supply that category, so the first comparison fails to compile — which is the check you want. Stronger categories convert implicitly to weaker ones: a function returning `std::weak_ordering` may `return x.size() <=> y.size();` even though that expression is strong.

## Writing `<=>` by hand

Default when the members in declaration order *are* the ordering. Otherwise compose it: compare the most significant key, return if decided, fall through to the next:

```cpp
struct Date {
    int y, m, d;
    std::strong_ordering operator<=>(const Date& o) const {
        if (auto c = y <=> o.y; c != 0) return c;
        if (auto c = m <=> o.m; c != 0) return c;
        return d <=> o.d;
    }
    bool operator==(const Date&) const = default;   // must be declared: a user-provided <=> gives no ==
};
```

A case-insensitive `Tag` compares lower-cased characters and returns `std::weak_ordering`, because `"Apple"` and `"apple"` are *equivalent* — neither is less — yet remain distinguishable objects; its `==` must agree, and `(*this <=> o) == 0` is the simplest way to guarantee that. Keep the two consistent: a `std::set` that finds an element by `<` and a `std::find` that finds it by `==` must agree about which elements are the same.

## Sort, set and map

```cpp
std::vector<Version> v = {{1, 2, 10}, {1, 2, 9}, {2, 0, 0}};
std::sort(v.begin(), v.end());        // uses operator<  → (v[i] <=> v[j]) < 0
std::set<Version> distinct(v.begin(), v.end());
std::map<Version, std::string> notes; // keys ordered by the same <
distinct.contains(Version{1, 2, 9});  // found by "neither is less", not by ==
```

Every ordered facility in the library — `std::sort`, `std::set`, `std::map`, `std::lower_bound`, `std::min` — is written in terms of `<` alone, through the default comparator `std::less<T>`. A defaulted `<=>` supplies that `<` and nothing more is needed. Two keys are the *same* key for a `std::set` when `!(a < b) && !(b < a)`, so a `Tag` with a case-insensitive ordering deduplicates spellings that differ only in case, keeping the one inserted first. When the natural order is not the one a particular container needs, pass a comparator instead of changing `<` (lesson 4).

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `<=` or `>=` used as the sort order | Not strict: `std::sort` is undefined behaviour, `std::set` loses elements |
| Hand-written `<=>`, no `==` | `a == b` and `a != b` do not compile |
| Members declared in the wrong order, `<=>` defaulted | Sorts by the wrong key first |
| `double` member, `auto` return | `partial_ordering`; NaN compares neither less nor greater |
| `(a <=> b) < 1` | Compile error: an ordering compares only with the literal `0` |
| Forgetting `#include <compare>` | The category types are undeclared |
| `==` and `<` that disagree | `std::set` and `std::find` see different duplicates |

## Key takeaways

- `operator==` is enough for `!=` (rewritten) and, when defaulted, compares members in declaration order.
- `auto operator<=>(const T&) const = default;` gives `<`, `>`, `<=`, `>=` **and** `==`; a hand-written `<=>` gives the four relations only — add `==` yourself.
- The result compares with `0`: `a < b` is `(a <=> b) < 0`.
- `strong_ordering` for substitutable values, `weak_ordering` for equivalent-but-distinguishable, `partial_ordering` when some pairs are unordered (`double`).
- `std::sort`, `std::set` and `std::map` use only `<`; a strict weak ordering is the contract, and "same key" means neither is less.
- Compose a custom `<=>` key by key with `if (auto c = x <=> o.x; c != 0) return c;`.
