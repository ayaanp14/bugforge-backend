---
title: std::optional — a value that may be absent
minutes: 13
---
Some functions sometimes have no answer: a search that finds nothing, a configuration key that was never set, an average of zero numbers. C used a *sentinel* — `-1`, `NULL`, `EOF`, `std::string::npos` — a value smuggled through the normal channel that the caller must know to check and can forget, and that some types cannot spare at all (which `int` is "no int"?). `std::optional<T>`, in `<optional>` since C++17, makes absence part of the type: it either holds a `T` or holds nothing, it says which, and the compiler makes the caller ask. This lesson settles how to build, test, read and compare one, when to return it, and the one thing it cannot hold.

## Constructing and inspecting

```cpp
#include <optional>
#include <string>

std::optional<int> a;                                  // empty
std::optional<int> b = 42;                             // holds 42
std::optional<int> c = std::nullopt;                   // empty, said explicitly
auto d = std::make_optional<std::string>("ada");      // optional<std::string> holding "ada"
std::optional<std::string> e{std::in_place, 3, 'x'};   // constructs "xxx" inside the optional, no temporary

if (b) { /* engaged */ }              // explicit operator bool
if (b.has_value()) { /* the same */ }
```

An `optional` is *engaged* when it holds a value and *empty* (or *disengaged*) otherwise. `std::nullopt` is the empty value's name, and the type is default-constructed empty, which is why a `std::optional` member needs no initialiser to be safe.

Reading the value has four spellings with three different behaviours:

| Expression | When engaged | When empty |
| --- | --- | --- |
| `*o`, `o->member` | the value | **undefined behaviour** — no check |
| `o.value()` | the value | throws `std::bad_optional_access` |
| `o.value_or(x)` | a copy of the value | `x` converted to `T` |
| `o.has_value()`, `if (o)` | `true` | `false` |

`*o` reads like a pointer and is checked like one — not at all. Use it only right after a test. `value()` is the checked form for code that would rather throw than continue. `value_or` is the everyday form when a default exists.

## Returning optional from a lookup

```cpp
#include <vector>

std::optional<std::size_t> indexOf(const std::vector<int>& v, int target) {
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) return i;       // a std::size_t converts to optional<std::size_t>
    }
    return std::nullopt;
}

int main() {
    std::vector<int> v{4, 8, 15};
    if (auto at = indexOf(v, 4)) {
        std::cout << "found at " << *at << '\n';   // found at 0
    } else {
        std::cout << "absent\n";
    }
}
```

`return i;` builds the optional from the value and `return std::nullopt;` builds the empty one; the function never spells the type twice. The `if` form is the idiom: the C++17 initialiser scopes `at` to the branches, the condition tests *engagement*, and `*at` is safe inside. Note what the condition does not test: index 0 is a perfectly good answer, and `if (auto at = ...)` is true for it, because the optional is engaged. That is the whole point — `0` and `-1` are no longer overloaded with meaning.

The same shape wraps `std::map::find`, whose iterator-or-`end()` protocol is exactly a sentinel:

```cpp
#include <map>

std::optional<std::string> get(const std::map<std::string, std::string>& cfg, const std::string& key) {
    auto it = cfg.find(key);
    if (it == cfg.end()) return std::nullopt;
    return it->second;                      // copies the mapped string into the optional
}

std::cout << get(cfg, "port").value_or("8080") << '\n';
```

## value_or, precisely

`o.value_or(x)` returns a `T` *by value* — a copy of the held value, or `x` converted to `T`. Two consequences follow. The argument is evaluated whether or not it is needed, because it is an ordinary function argument: `o.value_or(expensiveDefault())` always calls `expensiveDefault`. And for a large `T` in a hot path the copy costs; test and dereference instead. For a `std::optional<std::string>` and a literal default, `value_or("none")` is fine — the literal becomes a `std::string` only on the empty path's return.

## Modifying

```cpp
std::optional<std::string> name;
name = "ada";                 // engage by assignment
name.emplace(3, 'x');         // construct a new value in place: "xxx"
name.reset();                 // back to empty
name = std::nullopt;          // the same
if (name) *name += "!";       // modify through the dereference — only when engaged
```

Assignment through `*name` on an empty optional is undefined behaviour like any other dereference; `emplace` and `=` are how an empty one becomes engaged.

## Comparing

Optionals compare by value, with *empty* ordered before every engaged value and two empties equal:

```cpp
std::optional<int> none, zero = 0, five = 5;
none == zero;          // false
none < zero;           // true: empty sorts first
zero < five;           // true: compares the values
five == 5;             // true: compares with a plain T
none == 5;             // false, not an error
none == std::nullopt;  // true
```

That ordering makes `std::optional<int>` usable as a `std::map` key or in `std::sort`, and C++20 adds `<=>` so `std::optional<T>` orders whenever `T` does.

## optional<T&> does not exist

`std::optional<int&>` is ill-formed. The committee could not agree what `o = x` should mean for a reference — rebind to `x`, or assign through to the referent — so the type was left out (C++26 finally adds it, with rebinding). Until then, when a function may or may not return a reference to something the caller owns:

- return `T*` — a pointer that may be `nullptr` *is* an optional reference, and Module 6 said so;
- return `std::optional<std::reference_wrapper<T>>` and read it with `->get()`;
- return an index or an iterator, and let the caller subscript.

The first is idiomatic; the second appears in code that wants "optional" in the signature.

## Layout and cost

The `T` lives inside the optional object — no heap — followed by a `bool`, padded to `T`'s alignment. So `std::optional<int>` is bigger than an `int`, copying one copies the `T`, and returning one by value is as cheap as returning the `T`. `emplace` and `std::in_place` avoid a temporary when construction is expensive. A `std::optional<std::unique_ptr<T>>` is redundant — the pointer already has a null state — and `std::optional<bool>` is legal but three-valued (`true`, `false`, empty), which readers reliably misread; a small `enum class` says more.

## Monadic operations (C++23, reading only)

C++23 adds three members that chain without an `if` ladder: `and_then(f)` calls `f` with the value and expects `f` to return another optional; `transform(f)` wraps `f`'s plain result in an optional; `or_else(f)` runs `f` when empty.

```cpp
int next = get(cfg, "port")             // optional<std::string>
    .and_then(parseInt)                 // optional<int>: parseInt returns std::optional<int>
    .transform([](int p) { return p + 1; })
    .value_or(8081);
```

This track's runtime is C++20 and does not have them; write the two `if`s. Knowing the names matters because the same three operations exist on `std::expected` (lesson 5) and in every language with a maybe type.

## optional, pointer or exception?

| Return | When |
| --- | --- |
| `std::optional<T>` | absence is normal and the caller decides; `T` is a value |
| `T*` | the thing lives elsewhere and may be absent; the caller must not own it |
| throw | absence is a violated precondition or a failure the caller cannot fix |
| `std::variant<T, Error>` / `std::expected` | the caller needs to know *why* (lessons 4 and 5) |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `*o` or `o->x` on an empty optional | Undefined behaviour — not a throw |
| Expecting `value()` to be free | It checks and can throw `std::bad_optional_access` |
| `o.value_or(compute())` | `compute()` runs even when `o` is engaged |
| `if (opt)` meaning "value is non-zero" | It means "engaged"; `optional<int>` holding 0 is `true` |
| `std::optional<T&>` | Compile error; return `T*` or `reference_wrapper` |
| `std::optional<bool>` for a flag | Three states; use an enum |

## Key takeaways

- `std::optional<T>` holds a `T` or nothing, in place, and says which through `has_value()`/`if (o)`.
- `*o` is unchecked (UB when empty), `value()` throws, `value_or(x)` returns a `T` by value and evaluates `x` eagerly.
- Return an optional from a lookup: `return value;` engages, `return std::nullopt;` empties; test with `if (auto r = f())`.
- Empty sorts before every value and equals only empty; `o == 5` compares with the held value.
- `optional<T&>` does not exist: return a pointer, a `reference_wrapper` or an index.
- `and_then`/`transform`/`or_else` are C++23 — on this runtime, write the `if`.
