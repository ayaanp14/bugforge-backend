---
title: Branching — if, else and the conditional operator
minutes: 13
---
Every program that does more than evaluate one formula has to decide, and in C++ deciding means `if`. The statement looks exactly like C's and Java's, which is the problem: the condition is *converted* to `bool` rather than required to be one, a chain such as `a < b < c` compiles and means something else, `if` can carry its own initialiser since C++17, and the conditional operator has type rules of its own. This lesson settles how a condition is evaluated, how branches nest, and how `&&` and `||` make an expression safe to evaluate at all.

## if, else if, else

```cpp
#include <iostream>

int main() {
    int score;
    std::cin >> score;
    if (score >= 90) {
        std::cout << "A\n";
    } else if (score >= 80) {
        std::cout << "B\n";
    } else if (score >= 70) {
        std::cout << "C\n";
    } else {
        std::cout << "below C\n";
    }
    return 0;
}
```

The branches are tested top to bottom and the first true one runs; nothing after it is considered, which is why the chain can test `>= 80` without also saying `< 90`. `else if` is not a keyword pair — it is an `else` whose statement happens to be another `if` — so a chain is really a nest that the indentation flattens.

Braces are optional around a single statement and you should write them anyway. The famous reason is Apple's 2014 `goto fail` bug: a duplicated line after an unbraced `if` ran unconditionally and skipped a certificate check for every user of the library. The everyday reason is the dangling `else`:

```cpp
if (a > 0)
    if (b > 0)
        std::cout << "both positive\n";
else
    std::cout << "a is not positive\n";   // actually belongs to `if (b > 0)`
```

An `else` binds to the nearest `if` that does not yet have one, whatever the indentation says. Braces make your intent the compiler's reading.

## The condition is converted, not checked

Java requires a `boolean` in an `if`; C++ takes any expression that converts to `bool`. Arithmetic values convert with zero meaning `false` and everything else `true`; pointers convert with `nullptr` meaning `false`; a stream such as `std::cin` converts through its `explicit operator bool`, which is why `if (std::cin >> x)` reads as "if the read succeeded". So these are all legal:

```cpp
int count = 3;
if (count) { /* count != 0 */ }
const char* p = nullptr;
if (!p) { /* p == nullptr */ }
if (std::cin >> count) { /* a number was read */ }
```

Conventional style spells the comparison out for numbers (`count != 0`) and leaves the shorthand for pointers and streams, where "is there one?" is what the code means.

The conversion has a dark side. `if (n = 5)` is an assignment whose value is 5, converts to `true`, compiles, and runs the branch every time. GCC and Clang warn under `-Wall` ("suggest parentheses around assignment used as truth value"). The same rules are why `if (score >= 90);` — note the semicolon — is a complete, empty `if` followed by a block that runs unconditionally.

## Comparison chains that lie

```cpp
int x = 15;
if (0 < x < 10) std::cout << "single digit\n";   // prints it — for every x
```

There is no chained comparison in C++. `0 < x < 10` parses as `(0 < x) < 10`; the inner comparison yields a `bool`, the `bool` promotes to `int` (`0` or `1`), and both are less than 10. The compiler sees nothing wrong with the types (GCC's `-Wparentheses` does flag this particular shape, but not `x == 1 || 2`, which is always true for the same reason: `2` converts to `true` on its own). Write what you mean:

```cpp
if (0 < x && x < 10) { /* … */ }
if (x == 1 || x == 2) { /* … */ }
```

## if with an initialiser (C++17)

A variable that exists only to be tested can be declared in the `if` itself:

```cpp
std::map<std::string, int> stock{{"apple", 4}};

if (auto it = stock.find("apple"); it != stock.end()) {
    it->second -= 1;
} else {
    std::cout << "not stocked\n";
}
// `it` no longer exists here
```

The initialiser runs first, the condition is tested, and the variable is in scope in both branches and nowhere after them. Before C++17 `it` had to be declared in the enclosing scope, where it lingered for the rest of the function. The form also removes the temptation to look up twice — `if (stock.count(k)) use(stock[k])` searches the map twice; this searches once. `switch` accepts the same syntax (next lesson).

## The conditional operator

`cond ? a : b` is an *expression*: it produces a value, so it can sit inside another expression or initialise a variable, which an `if` statement cannot do.

```cpp
const int larger = a > b ? a : b;
const char* unit = count == 1 ? "item" : "items";
std::cout << count << ' ' << unit << '\n';
```

The first line is the idiom's real justification: `larger` is `const`, which an `if` cannot manage without a mutable variable assigned in each branch. Two rules follow from it being an expression. First, both arms are converted to one common type — `flag ? 1 : 2.5` has type `double`, so the `1` becomes `1.0`. Second, precedence: `?:` binds more loosely than almost everything, so `std::cout << n == 1 ? "one" : "many"` parses as `(std::cout << n) == 1 …` and does not compile; put the whole conditional in parentheses when it is an operand of `<<`. Nested conditionals are legal and unreadable; at two levels, switch to an `if` chain.

## Short-circuit evaluation as a guard

`&&` evaluates its left operand and stops if it is `false`; `||` stops if the left operand is `true`. The right operand is not evaluated at all — it is not merely ignored — which makes the left operand a guard for the right one:

```cpp
if (i < v.size() && v[i] == target) { /* v[i] is never read out of range */ }
if (p != nullptr && p->ready) { /* p is never dereferenced when null */ }
if (line.empty() || line[0] == '#') continue;   // line[0] only when there is one
```

Order matters: swap the operands and the guard runs after the thing it was guarding. The bitwise `&` and `|` always evaluate both sides, so `i < v.size() & v[i] == target` reads out of range. The same rule puts cheap tests before expensive ones: `if (cache.contains(k) || slowLookup(k))` calls `slowLookup` only on a miss.

## What goes wrong

| Mistake | What happens |
| --- | --- |
| `if (x = 5)` | Assigns, then tests 5: always true. `-Wall` warns. |
| `if (0 < x < 10)` | `(0 < x)` is 0 or 1, both `< 10`: always true. |
| `if (x == 1 \|\| 2)` | `2` is true on its own: always true. |
| `if (cond);` | Empty statement; the block below runs unconditionally. |
| Unbraced nested `if` with `else` | The `else` binds to the inner `if`. |
| `if (s == "yes")` with `const char* s` | Compares two addresses, not the text (`std::string` compares content). |
| `if (d == 0.1)` with `double d` | Representation error (Module 2, lesson 3); compare with a tolerance. |

## Key takeaways

- A condition is converted to `bool`: zero and `nullptr` are false, a stream is true when its last operation succeeded.
- `a < b < c` compiles and is wrong; combine comparisons with `&&` and `||`.
- `if (init; cond)` scopes a variable to the branches — use it for lookups.
- `?:` is an expression with a common type; parenthesise it inside `<<`.
- `&&` and `||` stop early, so the left operand can make the right one safe to evaluate; `&` and `|` do not.
- Always brace; `else` binds to the nearest unmatched `if`.
