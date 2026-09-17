---
title: switch — labels, fallthrough and what to switch on
minutes: 13
---
A `switch` compares one integral value against a set of constants and jumps straight to the matching label. That is a different thing from an `if` chain, not a shorthand for one: the compiler may turn it into a jump table or a binary search, the labels must be compile-time constants, and control *falls through* from one label to the next unless you stop it. Every one of those properties is a feature when the switch is written for it and a bug when it is not. This lesson covers the anatomy, fallthrough, variables declared inside cases, and what to do instead of switching on a string.

## Anatomy

```cpp
#include <iostream>

int main() {
    char op;
    int a, b;
    std::cin >> a >> op >> b;
    switch (op) {
        case '+': std::cout << a + b << '\n'; break;
        case '-': std::cout << a - b << '\n'; break;
        case '*': std::cout << a * b << '\n'; break;
        case '/':
            if (b == 0) {
                std::cout << "division by zero\n";
            } else {
                std::cout << a / b << '\n';
            }
            break;
        default:
            std::cout << "unknown operator " << op << '\n';
            break;
    }
    return 0;
}
```

The controlling expression must have an integral or enumeration type — `int`, `char`, `long long`, `bool` (pointless), an `enum` or `enum class`, or a class type convertible to one of those. `double` is rejected, and so is `std::string`. Each `case` label is a constant expression of that type: a literal, a `constexpr` variable, an enumerator, `'a' + 1`. Two labels with the same value are a compile error. `default` catches everything else and may appear anywhere, though convention puts it last.

`break` leaves the switch. Without it, execution continues into the statements under the next label — the switch is a list of labelled statements with one entry point per label, not a set of separate blocks.

## Fallthrough, intended and accidental

Empty labels stacked on one body are the legitimate use of fallthrough and need no annotation:

```cpp
switch (c) {
    case 'a': case 'e': case 'i': case 'o': case 'u':
        ++vowels;
        break;
    case ' ': case '\t':
        ++blanks;
        break;
    default:
        ++others;
        break;
}
```

A body that runs and then continues into the next body is where the bugs live — a forgotten `break` after `case 1:` silently adds case 2's work to case 1. GCC and Clang warn (`-Wimplicit-fallthrough`, part of `-Wextra`). When the fallthrough is what you want, say so with the C++17 attribute:

```cpp
switch (level) {
    case 3:
        std::cout << "delete ";
        [[fallthrough]];
    case 2:
        std::cout << "write ";
        [[fallthrough]];
    case 1:
        std::cout << "read\n";
        break;
    default:
        std::cout << "no access\n";
        break;
}
```

`[[fallthrough]];` is a statement with no run-time effect: it documents the intent and tells the compiler not to warn, which a comment cannot do. Level 3 prints all three words — the ladder accumulates.

## Enums and the missing default

Switching on a scoped enum is the most common use in modern code, and it comes with a compiler check worth keeping:

```cpp
enum class Shape { Circle, Square, Triangle };

int sides(Shape s) {
    switch (s) {
        case Shape::Circle: return 0;
        case Shape::Square: return 4;
        case Shape::Triangle: return 3;
    }
    return -1;   // reached only for a value that is none of the enumerators
}
```

With no `default`, `-Wswitch` (in `-Wall`) warns when an enumerator is not handled — so adding `Shape::Hexagon` later produces a warning at every switch that forgot it. Write a `default` and the check is gone. The price is the line after the switch: an `enum class` can hold a value that is none of its enumerators (`static_cast<Shape>(7)`), the compiler knows it, and a function without the trailing `return` "may reach the end of a non-void function". Handle every enumerator, omit `default`, keep the fallback after the switch.

## Declaring a variable inside a case

```cpp
switch (n) {                      // does not compile
    case 1:
        int doubled = n * 2;      // error: jump to case label crosses initialization
        std::cout << doubled;
        break;
    case 2:
        std::cout << n;
        break;
}
```

Every label is inside one scope — the switch body — so `doubled` is in scope at `case 2` as well, but jumping to `case 2` skips its initialisation. C++ forbids jumping past the initialisation of a variable, and the compiler says so. The fix is a block per case:

```cpp
switch (n) {
    case 1: {
        int doubled = n * 2;
        std::cout << doubled;
        break;
    }
    case 2:
        std::cout << n;
        break;
}
```

Now `doubled` belongs to the block and no label can jump into it. The rule covers anything with an initialiser, including `std::string s;` (a constructor counts); a bare `int x;` would be allowed, and reading it would be undefined behaviour — brace the case instead.

## No strings in a switch

`switch (command)` with `std::string command` does not compile: the labels must be constant expressions, and comparing strings is a run-time operation on text that lives on the heap. Three honest options:

1. **An `if` chain** — `if (cmd == "add") … else if (cmd == "sub") …`. Fine for a handful of words.
2. **Map the word to an enum, then switch** — an `if` chain (or a `std::map<std::string, Cmd>`) does the string work once, and the `switch` on the enum gets the exhaustiveness check and the jump table:

```cpp
enum class Cmd { Add, Sub, Show, Unknown };

Cmd cmd = Cmd::Unknown;
if (word == "add") cmd = Cmd::Add;
else if (word == "sub") cmd = Cmd::Sub;
else if (word == "show") cmd = Cmd::Show;

switch (cmd) {
    case Cmd::Add: /* … */ break;
    case Cmd::Sub: /* … */ break;
    case Cmd::Show: /* … */ break;
    case Cmd::Unknown: std::cout << "unknown: " << word << '\n'; break;
}
```

3. **Switch on a character** when the vocabulary is single letters (`case 'q':`) — the shape of most menu loops.

You will meet code that switches on a `constexpr` hash of the string: it compiles, it is fast, and two words can hash to the same label without the compiler noticing. Leave it where you found it.

## switch with an initialiser (C++17)

Like `if`, `switch` can declare a variable scoped to itself:

```cpp
switch (const int code = status(); code) {
    case 0: std::cout << "ok\n"; break;
    case 1: std::cout << "retry\n"; break;
    default: std::cout << "failed with " << code << '\n'; break;
}
```

`code` is visible in every case and gone afterwards. It is most useful when the `default` branch wants to print the value that matched nothing.

## switch or if?

| Use `switch` when | Use `if` when |
| --- | --- |
| one integral or enum value is compared against constants | the tests are ranges (`score >= 90`) or compound (`a && b`) |
| several values share one body (stacked labels) | the value is a `double`, a `std::string` or a pointer |
| you want `-Wswitch` to catch a missing enumerator | the branches test different variables |

## What goes wrong

- A missing `break` runs the next case's body too. Compile with `-Wextra`; write `[[fallthrough]]` when you mean it.
- `break` inside a `switch` inside a loop leaves the switch, not the loop. Use a flag or restructure — the command-interpreter exercise makes you.
- Duplicate case values and non-constant labels (`case n:`) are compile errors.
- `case 1 ... 5:` is a GCC extension; it will not compile on other compilers. Use an `if` for ranges.
- A `default` on an enum switch hides the missing-enumerator warning.

## Key takeaways

- `switch` dispatches on one integral or enum value to constant labels; `break` ends a case, and without it control falls through.
- Stack empty labels freely; mark a body-to-body fallthrough with `[[fallthrough]];`.
- A variable initialised inside a case needs braces around the case.
- Strings cannot be switched on: map them to an enum first, or use an `if` chain.
- Handle every enumerator and omit `default` so the compiler warns when the enum grows.
