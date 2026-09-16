---
title: Operators and precedence
minutes: 14
---
Java's operators are C's, with the sharp edges filed off: no pointer arithmetic, no comma operator, no implicit truthiness, and a specified evaluation order. This lesson covers each family with the details interviewers probe — short-circuiting, bitwise versus logical, the three shifts, and the precedence table you should know rather than guess.

## Arithmetic

`+ - * / %`, unary `-` and `+`, `++` and `--`. Integer versus floating behaviour was covered in the last two lessons. `+` is also string concatenation when either operand is a `String`. There is no exponent operator; `Math.pow` or a loop.

## Relational and equality

`< <= > >=` work on numeric types (and `char`). `==` and `!=` work on everything — but for **references** they compare *identity* (is it the same object?), never contents. `"hi" == "hi"` may be true (string pool) or false (built at run time); `equals` is the content comparison. Module 3 and Module 8 make this precise; for now: `==` on objects is almost always wrong unless you mean "the same object".

Comparisons produce `boolean`, and `boolean` is not a number, so `a < b < c` does not compile (the first comparison yields a `boolean`, which `<` cannot take).

## Logical: `&&`, `||`, `!` — and `&`, `|`, `^`

```java
if (list != null && !list.isEmpty()) …     // safe: right side not evaluated when left is false
if (x > 0 || expensiveCheck()) …           // expensiveCheck runs only when x <= 0
```

`&&` and `||` **short-circuit**: the right operand is evaluated only if needed. This is a correctness tool, not just an optimisation — it is what makes `obj != null && obj.method()` safe.

`&`, `|` and `^` on booleans are the *non-short-circuit* logical operators: both sides always evaluate. Use them when the right side has a side effect you want regardless (rare), or for XOR, which has no `^^` form. On integers the same three symbols are bitwise (below).

`!` negates a boolean. There is no `not` keyword.

## Bitwise and shifts

On integral types (`int`, `long`; smaller types promote to `int`):

| Op | Meaning | Example (8-bit view) |
| --- | --- | --- |
| `&` | AND | `0b1100 & 0b1010` → `0b1000` |
| `\|` | OR | `0b1100 \| 0b1010` → `0b1110` |
| `^` | XOR | `0b1100 ^ 0b1010` → `0b0110` |
| `~` | NOT (one's complement) | `~5` → `-6` (all bits flipped; `~x == -x - 1`) |
| `<<` | shift left, fill with 0 | `1 << 4` → 16 |
| `>>` | arithmetic shift right, fill with the sign bit | `-16 >> 2` → -4 |
| `>>>` | logical shift right, fill with 0 | `-16 >>> 28` → 15 |

Shift facts that come up:

- The shift distance is taken **modulo the width**: `1 << 32` is `1` (not 0) for an `int`, because 32 & 31 = 0. For `long`, modulo 64.
- `>>` keeps the sign, so it divides by 2ⁿ rounding toward negative infinity (`-7 >> 1` is `-4`, while `-7 / 2` is `-3`).
- `>>>` exists because there are no unsigned types; it treats the value as unsigned bits. `(a + b) >>> 1` is the overflow-safe midpoint.
- `x ^ x == 0`, `x ^ 0 == x`, XOR is its own inverse — the basis of "find the single number" problems and swap-without-temp (`a ^= b; b ^= a; a ^= b;` — do not use in real code).
- Masks: `flags & FLAG_X` tests, `flags | FLAG_X` sets, `flags & ~FLAG_X` clears, `flags ^ FLAG_X` toggles.
- `Integer.toBinaryString(x)`, `Integer.bitCount`, `Integer.highestOneBit`, `Integer.numberOfTrailingZeros`, `Long.reverse` — the toolkit in the wrapper classes.

## Assignment and compound assignment

`=` is an expression that yields the assigned value, so `a = b = c = 0` works (right-associative). The compound forms `+= -= *= /= %= &= |= ^= <<= >>= >>>=` include the implicit cast to the left-hand type (previous lessons). `x = x + 1` and `x += 1` and `x++` all do the same thing for an `int`; they differ for `byte`/`short`/`char` (only the last two compile without a cast).

## The ternary `?:`

```java
int max = a > b ? a : b;
String label = count == 1 ? "item" : "items";
```

The only three-operand operator. Both branches must produce compatible types, and numeric promotion applies to them: `true ? 1 : 2.0` is `1.0`, and `flag ? 'a' : 0` is a `char` because 0 is a constant that fits — but `flag ? 'a' : someInt` is an `int`. Nest it at most once; beyond that use `if`.

A famous trap:

```java
Integer x = null;
int y = flag ? x : 0;   // NullPointerException when flag is true: x is unboxed
```

And the subtler one: `Object o = true ? Integer.valueOf(1) : Double.valueOf(2.0);` prints `1.0`, because both wrapper operands are unboxed and promoted to `double`.

## `instanceof`

`obj instanceof Type` is `true` if `obj` is non-null and is a `Type` (or subtype). Since Java 16 it can bind a variable: `if (obj instanceof String s) { s.length(); }`. Module 8.

## Precedence, from tightest to loosest

| Level | Operators | Associativity |
| --- | --- | --- |
| 1 | postfix `x++ x--`, member `.`, call `()`, index `[]` | left |
| 2 | unary `++x --x +x -x ~ !`, cast `(type)` | right |
| 3 | `* / %` | left |
| 4 | `+ -` | left |
| 5 | `<< >> >>>` | left |
| 6 | `< <= > >= instanceof` | left |
| 7 | `== !=` | left |
| 8 | `&` | left |
| 9 | `^` | left |
| 10 | `\|` | left |
| 11 | `&&` | left |
| 12 | `\|\|` | left |
| 13 | `?:` | right |
| 14 | `= += -= …` | right |

The rows that cause bugs:

- **Bitwise binds looser than comparison**: `x & 1 == 1` parses as `x & (1 == 1)`, a compile error (`int & boolean`). Write `(x & 1) == 1`.
- **Shift binds looser than `+`**: `1 << 2 + 3` is `1 << 5` = 32, not 7.
- **Cast binds tighter than binary operators**: `(double) a / b` casts `a` only.
- **`&&` before `||`**: `a || b && c` is `a || (b && c)`.

When in doubt, parenthesise. Reviewers never complain about clarifying parentheses.

## Evaluation order

Operands are evaluated **left to right**, fully, before the operator applies — and this is guaranteed by the language, unlike C/C++. `f() + g()` calls `f` first. Method arguments are evaluated left to right. `a[i] = i++` stores into the *old* index. Predictable, but still write code that does not depend on it.

## Operators Java does not have

No `**`, no `<>` for not-equal, no `->` for member access (`->` is the lambda arrow), no comma operator, no `sizeof`, no pointer `*`/`&`, no operator overloading (`+` on strings is the one built-in exception). `BigInteger` arithmetic is method calls because of this.

## Interview angle

- *"Difference between `&` and `&&`?"* `&&` short-circuits; `&` evaluates both and is also bitwise on integers.
- *"`>>` vs `>>>`?"* Arithmetic (sign-filling) vs logical (zero-filling) right shift.
- *"`1 << 32` for an int?"* 1 — the distance is masked to 5 bits.
- *"Result of `~7`?"* −8.

## Key takeaways

- `&&`/`||` short-circuit; `&`/`|`/`^` do not, and double as bitwise operators.
- `>>` keeps the sign, `>>>` does not; shift distances wrap at the type's width.
- Bitwise operators bind looser than comparisons — parenthesise masks.
- `?:` unboxes and promotes both branches; a `null` wrapper there throws.
- Evaluation is strictly left to right.
