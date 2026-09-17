---
title: Designing a class — headers, sources and a worked design
minutes: 15
---
A class used from more than one file has to be *declared* wherever it is used and *defined* exactly once, and C++ makes that split visible: the class goes in a header, its member functions go in a source file, and the one-definition rule polices the boundary. This lesson covers that mechanism — what belongs in `date.h` versus `date.cpp`, include guards, why `inline` matters — and then walks one design from the first question to the last: choose the representation, state the invariant, write the constructor that enforces it, keep the interface small.

## The header/source split

A header holds what every user of the class needs in order to *compile* a call: the class definition — data members included, because the compiler must know the object's size and layout to create one — plus declarations of the member functions and of any free functions that go with the type. The source file holds the bodies. Both files, and every file that uses the class, `#include` the header:

```cpp
// date.h
#pragma once
#include <string>

class Date {
public:
    Date(int year, int month, int day);            // throws std::invalid_argument
    int year() const { return y_; }                // one-liners inline in the header
    int month() const { return m_; }
    int day() const { return d_; }
    bool isLeapYear() const;
    std::string iso() const;
    static int daysInMonth(int year, int month);
private:
    int y_;
    int m_;
    int d_;     // invariant: 1 <= m_ <= 12 and 1 <= d_ <= daysInMonth(y_, m_)
};

bool operator==(const Date& a, const Date& b);
```

```cpp
// date.cpp
#include "date.h"
#include <format>
#include <stdexcept>

Date::Date(int year, int month, int day) : y_(year), m_(month), d_(day) {
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
        throw std::invalid_argument("not a calendar date");
}

bool Date::isLeapYear() const { return (y_ % 4 == 0 && y_ % 100 != 0) || y_ % 400 == 0; }

int Date::daysInMonth(int year, int month) {
    static const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    return month == 2 && leap ? 29 : days[month - 1];
}

std::string Date::iso() const { return std::format("{:04}-{:02}-{:02}", y_, m_, d_); }

bool operator==(const Date& a, const Date& b) {
    return a.year() == b.year() && a.month() == b.month() && a.day() == b.day();
}
```

`g++ -std=c++20 -c date.cpp` and `g++ -std=c++20 -c main.cpp` produce two object files the linker joins (Module 1, lesson 2). Change a body in `date.cpp` and only that file recompiles; change the header and every file that includes it does — the argument for keeping headers small and stable. The study judge compiles a single file, so the exercises keep both halves together with a comment marking where the split would fall; the habit is the same.

## Include guards and `#pragma once`

`#include` pastes the header's text into the including file. If `main.cpp` includes `date.h` and also `calendar.h`, which itself includes `date.h`, the class definition appears twice in one translation unit — "redefinition of class Date". A guard makes the second inclusion empty:

```cpp
#ifndef DATE_H
#define DATE_H
// ... the header ...
#endif
```

`#pragma once` at the top does the same in one line. It is not in the standard, but every compiler in use honours it and it cannot be broken by a guard name copied from another header; this track uses it. One form or the other is mandatory on every header you write.

## The one-definition rule and `inline`

A *declaration* may be repeated; a *definition* of a function or variable must appear exactly once in the whole program, or the linker reports "multiple definition". Class definitions are the exception: the same class may be defined in every translation unit that includes its header, provided the definitions are identical — which they are, because they came from the same file. Member functions defined *inside* the class body are implicitly `inline`, and `inline` means "one definition per translation unit is allowed; the linker keeps one". So the header may carry the one-line readers above, but `Date::iso` with its body in the header would need the `inline` keyword — or, as here, the bodies belong in the `.cpp`. `inline static` data members (lesson 4) and templates (Module 12), which must be visible wherever they are used, live in headers by the same rule.

| Goes in the header | Goes in the source file |
| --- | --- |
| The class definition, private members included | Member function bodies longer than a line |
| Trivial members defined in the body (implicitly inline) | Free functions declared in the header |
| `inline` functions and `inline static` members | Helpers nobody outside needs (in an anonymous namespace) |
| Declarations of free functions | Static data member definitions in pre-C++17 style |
| Templates and `constexpr` functions | `#include`s that only the bodies need |

Two more header rules. Include only what the declarations need, so that including your header costs the user little. And never write `using namespace std;` in a header: it silently applies to every file that includes it (Module 1, lesson 3).

## A worked design

The `Date` above was not written top-down from its member list. It came from four decisions, taken in order.

**Choose the representation.** A date can be three integers, or one — days since some epoch. Three integers make `year()`, `month()` and `iso()` trivial and make "add 90 days" a loop over month lengths; a day count makes arithmetic and ordering trivial and makes printing a conversion. Which operations dominate decides it: a calendar type that mostly prints and compares takes the three integers; a scheduling type that mostly adds intervals takes the count. Either is right, and because the members are private, the choice can change later without touching a caller.

**State the invariant.** Three integers can hold `2024-02-30`; the invariant says they never will: the month is 1–12 and the day is 1 to that month's length in that year. It is written beside the members, and it decides what the constructor must check.

**Write the constructor to enforce it.** The constructor is the only entry; it validates and throws, so an existing `Date` is a real date and `iso()` never has to ask. The check calls `daysInMonth`, a static function (lesson 4) because it needs no `Date`. Copying a `Date` cannot break the invariant, so the compiler-generated copy is right and the class follows the rule of zero (Module 9, lesson 4).

**Keep the interface small.** Three readers, `isLeapYear`, `iso`, one static helper and `==`. No `setDay` — a date is a value, and a different date is a new object. `dayOfYear` and `nextDay` (the first exercise) earn their place as derived values (lesson 5); a setter for the month would not. Everything is `const` except the constructor; `==` is a free function because it needs only the readers (lesson 3), and C++20 could default it as `bool operator==(const Date&) const = default;` — memberwise comparison, which is correct here because the members are declared in significance order (Module 11, lesson 2).

## The checklist

Every class you write from here on answers the same questions, in the same order: what is the representation; what invariant do the members obey; does the constructor establish it, and is it `explicit` where one argument would convert; is every non-mutating member `const`; what does copying mean, and is the generated copy right (Module 9); is the public interface complete and minimal; are there friends, and does each one need to be; and which of it is in the header and which in the source. A class that answers all eight cleanly is one you can hand to another programmer with the header alone. The second exercise runs the list on a `Fraction` from a blank file.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| A function body in a header without `inline` | "Multiple definition" as soon as two files include it. |
| A header without a guard | "Redefinition" when it is included twice through another header. |
| `using namespace std;` in a header | Every including file gets the pollution, and name clashes appear far from the cause. |
| Private members left out of the header "to hide them" | Cannot compile: the class definition must be complete to create an object. |
| Choosing the representation last | Every member function is written twice. |
| A setter on a value type | The invariant has a second entrance to defend. |

## Key takeaways

- The header carries the class definition (private members included), inline one-liners and declarations; the source file carries the bodies; every user includes the header.
- Guard every header (`#pragma once` or `#ifndef`); the ODR allows one definition of a function per program unless it is `inline`, and members defined in the class body are.
- Design in order: representation, invariant, a constructor that enforces it, a small `const`-correct interface.
- A value type has readers and derived operations, not setters; `==` and printing are free functions built on the readers.
- Run the eight-question checklist before declaring a class finished.
