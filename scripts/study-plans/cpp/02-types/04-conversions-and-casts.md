---
title: Conversions and casts
minutes: 14
---
C++ converts between types constantly and silently. Every mixed-type expression, every argument passed to a differently typed parameter, every `if` on a number is a conversion. Most are harmless promotions; a handful lose information, and two of those — narrowing a floating value to an integer, and mixing signed with unsigned — are behind a large share of real bugs. This lesson lists the implicit conversions and what each does to a value, shows how brace-initialisation refuses the lossy ones, and explains the four named casts and why the C-style cast has no place in new code.

## Where implicit conversions happen

```cpp
double half = 1 / 2;          // 0.0: the int division happens first, then 0 converts to double
int n = 2.9;                  // 2: truncated, no warning under -Wall
if (n) { }                    // n converts to bool
void f(long long x);
f(n);                         // n widens to long long — a promotion, value preserved
```

Initialisation and assignment, the operands of an operator, arguments, return values and conditions are all conversion sites. A **promotion** goes to a wider type and preserves the value; a **conversion** may not. The compiler reports neither unless you ask (`-Wconversion` is not part of `-Wall`).

## Narrowing conversions

| Written | Stored | Why |
| --- | --- | --- |
| `int i = 3.99;` | `3` | floating → integer truncates toward zero |
| `int i = 3e10;` | undefined | out of range for `int` |
| `unsigned u = -1;` | `4294967295` | signed → unsigned is modular, always defined |
| `int k = 3000000000LL;` | `-1294967296` | wider → narrower keeps the low bits (modular since C++20) |
| `char c = 300;` | `44` | 300 mod 256 |
| `float f = 16777217;` | `16777216.0f` | integer → float rounds to the nearest representable |
| `bool b = 0.1;` | `true` | anything non-zero |

Only one row is undefined behaviour — a floating value that does not fit the target integer — but every row loses something. Braces make the compiler say so:

```cpp
int i{3.99};       // error: narrowing conversion of '3.99' from 'double' to 'int'
unsigned u{-1};    // error
char c{300};       // error
char d{65};        // fine: a constant that fits is not narrowing
long long big = 5;
int j{big};        // error: a run-time long long might not fit, even though this one does
```

When you *want* the conversion, say so with `static_cast`; the reader then knows the loss was considered and `-Wall` stops second-guessing you.

## bool

Zero and null are `false`; everything else is `true`. `if (x = 5)` compiles — assignment, then the 5 converts to `true` — which is why `-Wall` warns about an assignment used as a condition and why some people write `5 == x`. Going the other way, `true` is `1` in arithmetic and `false` is `0`; `std::cout << std::boolalpha` prints the words instead.

## char and int

A `char` in arithmetic becomes an `int`, which is the whole basis of text processing by hand:

```cpp
char c = 'q';
int code = c;                            // 113
int digit = '7' - '0';                   // 7
char next = static_cast<char>(c + 1);    // 'r' — c + 1 is an int and must be narrowed back on purpose
bool lower = c >= 'a' && c <= 'z';
```

Because `char` is signed here, a byte ≥ 128 is a negative `int`; before passing one to `<cctype>` or using it as an index, convert through `unsigned char` (Module 5 makes this a habit).

## Signed and unsigned

`int` → `unsigned` wraps modulo 2³², and since C++20 so does the reverse. The trouble is not the conversion itself but that it happens *inside comparisons* without asking:

```cpp
unsigned count = 3;
int delta = -5;
std::cout << count + delta << '\n';   // 4294967294 — delta became unsigned
std::cout << (delta < count) << '\n'; // 0 — "-5 < 3" is false, because -5 became 4294967291
```

The usual arithmetic conversions (lesson 2) convert the signed operand, and `-Wall` warns with `-Wsign-compare`. The classic sighting is `for (int i = 0; i < v.size(); ++i)`. Fixes, in order of preference:

```cpp
for (std::size_t i = 0; i < v.size(); ++i)   // match the type
for (int i = 0; i < std::ssize(v); ++i)      // C++20: a signed size
std::cmp_less(delta, count)                  // C++20 <utility>: compares mathematical values — true
std::in_range<int>(someUnsigned)             // does the value fit the target type?
```

`std::cmp_equal`, `cmp_not_equal`, `cmp_less`, `cmp_greater`, `cmp_less_equal` and `cmp_greater_equal` are the whole family. Casting the unsigned side to `long long` also works when it is known to fit.

## Floating to integer

`static_cast<int>(2.9)` is `2` and `static_cast<int>(-2.9)` is `-2` — truncation toward zero, the same as `std::trunc`. If the truncated value does not fit the target, the behaviour is undefined, so `static_cast<int>(1e10)` is not "some big number", it is a bug. Range-check first, use `std::llround` when rounding is wanted, and reach for `long long` when the magnitude is uncertain.

## The four casts

```cpp
double ratio = static_cast<double>(hits) / total;              // numeric; forces floating division
auto level = static_cast<Level>(2);                            // int → enum (lesson 6)
const unsigned char* bytes = reinterpret_cast<const unsigned char*>(&ratio);   // view the object's bytes
void legacyPrint(char* text);
legacyPrint(const_cast<char*>(name.c_str()));                  // only if legacyPrint really does not write
```

- `static_cast` is the everyday cast: every numeric conversion, enum ↔ integer, `void*` → `T*`, and up or down a class hierarchy without a run-time check. If a conversion is *plausible*, `static_cast` does it.
- `reinterpret_cast` reinterprets the bits of a pointer or an integer as another pointer type. It is for byte-level I/O (Module 18) and talking to hardware; almost every other use is undefined behaviour. For *values* — the bits of a `float` as a `uint32_t` — use `std::bit_cast`.
- `const_cast` adds or removes `const`. Removing it to call a badly declared legacy function is legitimate; writing through the result to an object that was born `const` is undefined behaviour.
- `dynamic_cast` is a checked cast down a polymorphic hierarchy, in Module 10.

Each cast does one thing, is easy to search for, and refuses conversions outside its job.

## Why not `(int)x`

A C-style cast `(T)x` — and its functional twin `T(x)` — tries `const_cast`, then `static_cast`, then `static_cast` plus `const_cast`, then `reinterpret_cast`, and silently uses the first that compiles. `(int)somePointer`, `(char*)someConstString` and `(Base*)unrelatedPointer` all compile and all mean something different from what a reader expects. It cannot be grepped for, and it keeps compiling when the types around it change into something the cast should have refused. Treat one in new code as a review comment waiting to happen.

## Pitfalls

- `double avg = sum / n;` with integer operands: the division is integral before the conversion. Cast one operand first.
- `long long area = width * height;` where both are `int`: the product overflows in `int` before the widening. Cast one operand first.
- `if (index < v.size())` with a negative `index`: the comparison is unsigned and the bounds check passes.
- `static_cast<int>(hugeDouble)` is undefined, not saturated.
- `(int)x` where `x` turns out to be a pointer.

## Key takeaways

- Conversions happen at every assignment, operand, argument, return and condition; promotions preserve values, conversions may not, and `-Wall` stays quiet.
- Brace-initialisation rejects narrowing; `int x{3.7}` and `unsigned u{-1}` are compile errors.
- Mixed signed/unsigned expressions convert the signed side; use matching types, `std::ssize`, or `std::cmp_less` and friends.
- Floating → integer truncates toward zero and is undefined when out of range.
- `static_cast` for value conversions, `reinterpret_cast` for bytes and hardware, `const_cast` for legacy signatures, `std::bit_cast` for bit views; never a C-style cast.
