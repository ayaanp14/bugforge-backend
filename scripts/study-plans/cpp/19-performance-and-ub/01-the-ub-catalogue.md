---
title: The undefined behaviour catalogue — what the compiler is allowed to assume
minutes: 15
---
Undefined behaviour is the contract at the centre of C++: the standard lists operations it "imposes no requirements" on, and in exchange the compiler may assume they never happen. That assumption is what makes `-O2` fast — a loop over a signed index needs no wrap-around check because signed overflow *cannot* occur — and it is what makes a program with undefined behaviour unpredictable rather than merely wrong. This lesson catalogues the operations that are undefined, shows how the optimiser turns each into a deleted check, and settles the well-defined tools for detecting them: checked arithmetic, bounds checkers, sanitizers and brace-initialisation.

## Three kinds of "the standard does not say"

| Category | Meaning | Example |
| --- | --- | --- |
| Implementation-defined | The implementation chooses and documents | `sizeof(int)`, whether `char` is signed |
| Unspecified | Any of several outcomes, not necessarily consistent | the order `f(g(), h())` evaluates its arguments |
| **Undefined** | No requirements at all — anything may happen, even before the operation | signed overflow, reading past an array |

The first two are portability concerns. The third is a correctness concern: a program with undefined behaviour has no meaning, and the compiler produces whatever code follows from *assuming the undefined operation is unreachable*.

## The catalogue

**Signed integer overflow.** `INT_MAX + 1`, `INT_MIN - 1`, `INT_MIN / -1`, `INT_MIN % -1`, `100000 * 100000` in `int`. Unsigned arithmetic wraps modulo 2ⁿ by definition; signed arithmetic has no defined result at all (Module 2, lesson 2).

**Out-of-bounds access.** `a[n]` on an array of `n`, `v[v.size()]`, `*end`. The one-past-the-end pointer may be formed and compared, never dereferenced.

**Uninitialised reads.** `int x; if (x > 0)` reads an indeterminate value; the optimiser may treat `x` as whatever is convenient — sometimes as different values in two places.

**Null and dangling dereference.** `*static_cast<int*>(nullptr)`; a reference to a local after its function returned; an iterator into a `std::vector` after a `push_back` reallocated (Module 13, lesson 6); a `std::string_view` of a temporary (Module 5, lesson 6).

**Use after free and double free.** Touching memory after `delete`, deleting twice, `new[]` paired with `delete` (Module 7).

**Data races.** Two threads touching one object without synchronisation, at least one writing (Module 17, lesson 2).

**One-definition-rule violations.** Two translation units defining the same `inline` function or class differently — undefined, *no diagnostic required*: the linker keeps one.

**Strict aliasing.** Reading a `float` through an `int*` (`*reinterpret_cast<int*>(&f)`); the compiler assumes an `int*` and a `float*` never alias. Use `std::memcpy` or C++20 `std::bit_cast`.

**Unsequenced modification.** `i++ + i++` modifies `i` twice with no ordering — undefined. C++17 tightened the rules: function arguments are *indeterminately sequenced* (so `f(i++, i++)` is unspecified in order, no longer undefined) and an assignment's right side is sequenced before its left (so `a[i] = i++` is defined). Neither is code to write.

**Shifts.** `x << n` with `n` negative or at least the width of `x` is undefined in every standard. Before C++20 a left shift of a negative value, or one whose result did not fit (`1 << 31` in `int`), was undefined too; C++20 defines both modulo 2ⁿ, so `1 << 31` is now `INT_MIN`. `1 << 32` never was defined.

**Integer division by zero.** `/ 0` and `% 0`. Floating-point division by zero is *defined* — infinity or NaN.

Also on the list: modifying a string literal, writing through a `const_cast` to an object declared `const`, an infinite loop with no side effects, and using an object after its destructor ran.

## Why the optimiser "deletes your check"

Undefined behaviour reaches *backwards*: a check written before the undefined operation can be removed because of it.

```cpp
int first(int* p) {
    int v = *p;                  // dereferences p, so p cannot be null …
    if (p == nullptr) return -1; // … and this test is provably false: deleted
    return v;
}
```

The same reasoning removes an overflow test written in terms of the overflow:

```cpp
bool willOverflow(int x) {
    return x + 1 < x;            // signed overflow cannot happen, so: always false
}
```

GCC and Clang both compile `willOverflow` to `return false`. The intent is fine; the test is phrased in an operation the compiler is allowed to assume never overflows. The fix is not a flag (`-fwrapv` and `-ftrapv` are diagnostic tools, not portable semantics) — it is to test *before* the operation, in terms that are themselves defined.

## Detecting overflow in well-defined code

GCC and Clang provide checked-arithmetic builtins that compute the exact result when it fits and report when it does not, without performing the undefined operation:

```cpp
int a = 2147483647;
int result = 0;
if (__builtin_add_overflow(a, 1, &result)) std::cout << "overflow\n";
else std::cout << result << '\n';
```

`__builtin_sub_overflow` and `__builtin_mul_overflow` are its siblings; each returns `true` on overflow. The portable alternative tests against `std::numeric_limits` first:

```cpp
#include <limits>

bool checkedAdd(int a, int b, int& out) {
    constexpr int hi = std::numeric_limits<int>::max();
    constexpr int lo = std::numeric_limits<int>::min();
    if ((b > 0 && a > hi - b) || (b < 0 && a < lo - b)) return false;
    out = a + b;
    return true;
}
```

Every comparison there is on values that fit. For `int` operands a third route is to compute in `long long`, which holds any sum, difference or product of two `int`s, and compare with the `int` limits; it does not scale to `long long` operands, which is where the builtins earn their place. Division has one dangerous case besides zero — `min / -1` — tested by hand.

## Detecting out-of-bounds access

`at()` throws `std::out_of_range` (Module 15); `operator[]` checks nothing. A wrapper that returns `std::optional` reports a violation without exceptions and, by taking the index as a *signed* type, catches the negative index that would otherwise convert to a huge `std::size_t`:

```cpp
std::optional<int> get(const std::vector<int>& v, long long i) {
    if (i < 0 || i >= static_cast<long long>(v.size())) return std::nullopt;
    return v[static_cast<std::size_t>(i)];
}
```

On libstdc++, compiling with `-D_GLIBCXX_ASSERTIONS` makes `operator[]` on every container check its bounds and abort with a message — cheap enough to leave on in debug builds.

## Finding what you did not detect

- **`-Wall -Wextra`** catch the mechanical cases: a possibly uninitialised local, `size_t` compared with `int`, a constant shift that is too wide, an always-true `>= 0` on an unsigned.
- **UBSan** (`-fsanitize=undefined`) prints `runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'` with the file and line, as it happens.
- **ASan** (`-fsanitize=address`) reports out-of-bounds, use-after-free and double free with a stack trace (Module 7, lesson 6).
- **Brace-initialisation** rejects narrowing at compile time, and `int x{};` is never indeterminate.

The judge compiles with `-O2` and no sanitizer: a solution with undefined behaviour may print the right answer on your machine and a different one there, which is why nothing in this track relies on it.

## Pitfalls

| Written | What happens at `-O2` |
| --- | --- |
| `if (x + 1 < x)` | Folded to `false`; the detection never runs |
| `*p` then `if (p == nullptr)` | The null test is deleted |
| `int total;` then `total += v[i]` | Indeterminate value; any result |
| `for (std::size_t i = n - 1; i >= 0; --i)` | Wraps at 0; reads out of range |
| `1 << 32` | Undefined whatever the standard |
| Testing for overflow *after* computing it | Too late — the assumption already shaped the code |

## Key takeaways

- Undefined behaviour is an operation with no requirements; the optimiser assumes it is unreachable and reasons backwards from that.
- The catalogue: signed overflow, out-of-bounds, uninitialised reads, null and dangling dereference, use after free, data races, ODR violations, strict aliasing, unsequenced modifications, bad shifts, integer division by zero.
- Test *before* the operation, in defined terms: `__builtin_add_overflow` and friends, `std::numeric_limits` comparisons, a wider type, an index checked against `size()`.
- Take an index from input as a signed value so a negative one is reported, not converted.
- `-Wall -Wextra`, UBSan, ASan, `_GLIBCXX_ASSERTIONS` and brace-init find what your tests did not.
