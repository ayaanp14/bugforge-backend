---
title: Static members — state that belongs to the class
minutes: 13
---
Every data member so far has lived inside each object: two `Account`s, two balances. Some state belongs to the *type* instead — how many objects exist, the next id to hand out, a constant every object shares, a lookup table built once. A `static` member has exactly one instance per class, held in static storage (Module 7, lesson 1) and alive for the whole program whether or not any object exists. This lesson covers static data members and the C++17 `inline` that made them painless, the copy trap that makes instance counters drift, static member functions and the named-constructor pattern they enable, constants inside classes, and the singleton — the static-member design that interviews ask about and codebases regret.

## Static data members

```cpp
class Session {
    std::string user_;
    int id_;
    inline static int alive_ = 0;      // one counter for the whole class
    inline static int nextId_ = 1;
public:
    explicit Session(std::string user) : user_(std::move(user)), id_(nextId_++) { ++alive_; }
    ~Session() { --alive_; }
    static int alive() { return alive_; }
};
```

`alive_` is not part of any `Session`; `sizeof(Session)` counts `user_` and `id_` and nothing else. There is one `alive_`, initialised before `main` starts, and every constructor and destructor touches the same one. Inside member functions it is in scope like any other member; from outside it is `Session::alive_` (or `s.alive_` through an object, which is legal and misleading — write the class name).

Before C++17 a static data member was only *declared* inside the class and had to be *defined* exactly once, in one `.cpp` file: `int Session::alive_ = 0;`. A definition in a header that two files included was a linker error (multiple definition); no definition at all was a linker error the other way (undefined reference to `Session::alive_`). `inline static` (C++17) lets the in-class declaration be the definition, the same way an inline function can be defined in a header (Module 4, lesson 6): every translation unit sees a definition and the linker keeps one. Use it for every static data member you write; the two-part form survives in code that predates 2017 and in interview questions about it.

## Instance counters, and the copy trap

The counter above has a hole. The compiler generates a copy constructor for `Session` (Module 9), and that generated constructor copies `user_` and `id_` — it does not run the body that increments `alive_`. Copy a `Session` and the count is one short; destroy both and it goes negative:

```cpp
Session a("ada");        // alive 1
Session b = a;           // generated copy: alive still 1, but two objects exist
// ... both destroyed: alive is -1
```

Two correct fixes. Either write the copy constructor and count in it too, or — for a class where copying makes no sense, which is most classes with an id — delete it: `Session(const Session&) = delete; Session& operator=(const Session&) = delete;`. The first exercise takes the second route. The trap is worth remembering beyond counters: any class whose constructor has a side effect must ask what the generated copy does.

## Static member functions

A static member function belongs to the class rather than to an object: it has no `this`, cannot touch non-static members, and is called as `Session::alive()`. It can read private static members, which is why the counter is private and published through a public static function. Three uses recur.

**Access to class-level state**, as above. **Utilities tied to the type** — `Date::isLeapYear(int)` and `Date::daysInMonth(int, int)` need no `Date` to exist and belong nowhere else. And **named constructors**: a constructor can only be called by the class's name, so two ways of building an `Angle` from a `double` cannot both be constructors. Static factory functions give each a name, and a private constructor makes them the only way in:

```cpp
#include <numbers>

class Angle {
    double degrees_;
    explicit Angle(double d) : degrees_(d) {}          // private: only the factories reach it
public:
    static Angle fromDegrees(double d) { return Angle(d); }
    static Angle fromRadians(double r) { return Angle(r * 180.0 / std::numbers::pi); }
    double degrees() const { return degrees_; }
};

Angle a = Angle::fromRadians(1.0);
```

The standard library does the same: `std::chrono::system_clock::now()` is a static member function that builds a time point, and `std::thread::hardware_concurrency()` is a static utility that needs no thread. A factory can also validate and return `std::optional<T>` (Module 15, lesson 3) instead of throwing, return a cached instance, or return a derived type (Module 10) — none of which a constructor can do.

## Constants inside classes

```cpp
class Grid {
public:
    static constexpr int kMaxSide = 1024;
    static constexpr double kEpsilon = 1e-9;
    static inline const std::string kName = "grid";   // non-literal type: inline, not constexpr
};

int side = std::min(n, Grid::kMaxSide);
```

A constant that belongs to a type is a `static constexpr` data member: usable in constant expressions (array sizes, `static_assert`, template arguments), implicitly `inline` since C++17, and named through the class. `std::string::npos` is such a constant; `std::numeric_limits<int>::max()` is the function form. Prefer `static constexpr` to a `#define` (no scope, no type) and to the pre-C++11 trick of an unscoped `enum { kMaxSide = 1024 }`. A constant of a non-literal type such as `std::string` cannot be `constexpr`; `static inline const` gives it its one definition.

## Function-local statics in members

A `static` local inside a member function (Module 4, lesson 6) is initialised once, on first use, and shared by every object — a lazily built lookup table, for instance. It behaves like a static data member with tighter scope; use it when only one function needs the value.

## Why singletons are a trap

A **singleton** is a class arranged so that exactly one instance can exist, reached through a static function:

```cpp
class Logger {
    Logger() = default;
public:
    static Logger& instance() {
        static Logger only;      // constructed on first call, destroyed at exit
        return only;
    }
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
    void log(const std::string& line);
};

Logger::instance().log("started");
```

The function-local static — the "Meyers singleton" — is the correct way to write one: construction is lazy and thread-safe since C++11, and it sidesteps the **static initialisation order fiasco**: globals in different translation units are constructed in an unspecified order, so a global that reads another global from a different file may read it before it exists. What the pattern cannot fix is the design. A singleton is a global variable with a class around it: every function that calls `Logger::instance()` has a hidden dependency its signature does not show; tests cannot substitute a fake; two of them cannot exist even when a test or a second tenant needs two; and destruction order at exit is again unspecified, so a singleton used from another object's destructor may already be gone. The alternative is almost always to construct the object once in `main` and pass a reference to whatever needs it. Interviews ask for the pattern; the answer that scores is the Meyers form *plus* why you would rather not.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `static int n;` in the class with no definition (pre-C++17 style) | Linker: undefined reference to `T::n`. Use `inline static`. |
| Defining `int T::n = 0;` in a header | Linker: multiple definition. Use `inline static`. |
| Counting in the constructor but not the copy constructor | The count drifts; delete copying or write the copy constructor. |
| Touching a non-static member from a static function | "Invalid use of member in static member function" — there is no `this`. |
| A global object that depends on a global in another file | Unspecified construction order; use a function-local static. |
| Reaching for a singleton because two functions need the same object | Pass it; the singleton hides the dependency. |

## Key takeaways

- A static data member has one instance per class, in static storage, initialised before `main`; write it `inline static` so the class body is its definition.
- A constructor's side effects are not repeated by the generated copy constructor: count in it too, or delete copying.
- Static member functions have no `this`; they hold class-level state, type utilities and named constructors (private constructor plus static factories).
- Constants belong in the class as `static constexpr` (or `static inline const` for non-literal types), named `Type::kName`.
- The Meyers function-local static is the correct singleton; the design is still a hidden global — pass the object instead.
