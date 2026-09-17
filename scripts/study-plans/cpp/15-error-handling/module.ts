import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "error-handling",
  title: "Errors and exceptions",
  blurb: "throw, try and catch with the standard hierarchy and your own, the three exception-safety guarantees with RAII and noexcept, std::optional for absence, std::variant with std::visit for one-of-several, and error codes, assertions and a per-layer strategy.",
  icon: "alert",
  overview: `A function that cannot do what it was asked has to say so, and C++ gives it four ways: throw, return an \`std::optional\`, return a \`std::variant\` of value-or-reason, or return a code. None of them is "the" answer. An exception cannot be ignored and carries itself through frames that have nothing to add, but it costs microseconds and hides the failure path from the reader; a return value is visible and cheap, but a caller can forget to check it. This module is where you learn each mechanism precisely — what \`throw\` does to the stack, what \`what()\` promises, which library calls throw and which never do, what \`*opt\` on an empty optional does (not what you hope) — and then learn to choose between them by the shape of the failure rather than by habit.

The five lessons build the toolbox and then the strategy. Exceptions covers \`throw\`, handler matching, catching by \`const&\` most-derived-first, the standard hierarchy and the split between \`logic_error\` and \`runtime_error\`, your own types with data members, \`throw;\` against \`throw e;\`, and stack unwinding. Exception safety names the no-throw, strong and basic guarantees, shows RAII delivering the basic one for free and a swap delivering the strong one, and explains \`noexcept\` — the promise, the operator, and why \`std::vector\` copies a type whose move constructor is missing the word. \`std::optional\` makes absence part of the type, with \`value_or\`, the \`if (auto r = f())\` idiom and the reference it cannot hold. \`std::variant\` with \`std::visit\` is the union that remembers, with the \`overloaded\` visitor, \`std::monostate\` and a small command language. Error codes and design closes with \`errno\`, \`enum class\` codes under \`[[nodiscard]]\`, \`std::error_code\` and \`std::from_chars\`, \`std::expected\` as C++23 reading, assertions that check bugs and never input, and the rule *return values inside, throw at the boundary*.

Every exercise is a whole program that provokes a failure and handles it — an exception that escapes \`main\` is a runtime error, so each one ends with a clean exit and its own fixed text, never the library's message. You write a parser that translates \`std::stoi\`'s exceptions, a bank with a \`BankError\`/\`InsufficientFunds\` hierarchy and handlers in the only order that works, a resource guard whose acquire/release trace proves unwinding runs destructors, four instrumented types that show \`std::move_if_noexcept\` moving or copying, an optional-returning price lookup and statistics over a possibly empty range, a token stream and a turtle visited through \`overloaded\`, a calculator that returns codes, and a parse–validate–execute pipeline that reports the first layer to fail. The checkpoint's three programs — a score reader with its own hierarchy, an RPN evaluator returning a \`std::variant\`, and a key–value store whose transactions roll back through an RAII guard — draw on all of it.`,
  lessons: [
    {
      slug: "exceptions",
      file: "01-exceptions.md",
      exercises: [
        {
          title: "Safe integer parser",
          prompt: `Write a parser that never lets \`std::stoi\`'s exceptions escape. Read whitespace-separated tokens until the end of input and pass each to \`int parseInt(const std::string& text)\`, which calls \`std::stoi(text, &consumed)\` and treats a token that \`std::stoi\` only partly consumes (\`consumed != text.size()\`, as in \`12x\` or \`3.7\`) as invalid by throwing \`std::invalid_argument\` yourself.

In \`main\`, catch \`std::invalid_argument\` and \`std::out_of_range\` in separate handlers and print your own fixed words — never \`what()\`: the text of the library's exception is implementation-specific. Count how many tokens parsed.

**Input:** tokens separated by whitespace, until EOF.
**Output:** one line per token — \`<token> -> <value>\`, \`<token> -> invalid\` or \`<token> -> out of range\` — then \`parsed <k> of <n>\`.

\`\`\`text
42 -7 abc 12x 2147483648 +8
\`\`\`
prints
\`\`\`text
42 -> 42
-7 -> -7
abc -> invalid
12x -> invalid
2147483648 -> out of range
+8 -> 8
parsed 3 of 6
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

// Returns the value; lets std::stoi's std::invalid_argument and std::out_of_range
// pass through, and refuses a token that was only partly consumed.
int parseInt(const std::string& text) {
    // TODO: std::stoi(text, &consumed); throw std::invalid_argument if consumed != text.size()
    return 0;
}

int main() {
    std::string token;
    int total = 0;
    int parsed = 0;
    while (std::cin >> token) {
        ++total;
        // TODO: try parseInt; catch std::invalid_argument -> "invalid",
        //       std::out_of_range -> "out of range"; print your own text, never what()
    }
    std::cout << "parsed " << parsed << " of " << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

// Returns the value; lets std::stoi's std::invalid_argument and std::out_of_range
// pass through, and refuses a token that was only partly consumed.
int parseInt(const std::string& text) {
    std::size_t consumed = 0;
    int value = std::stoi(text, &consumed);
    if (consumed != text.size()) throw std::invalid_argument("trailing characters");
    return value;
}

int main() {
    std::string token;
    int total = 0;
    int parsed = 0;
    while (std::cin >> token) {
        ++total;
        try {
            int value = parseInt(token);
            ++parsed;
            std::cout << token << " -> " << value << '\n';
        } catch (const std::invalid_argument&) {
            std::cout << token << " -> invalid\n";
        } catch (const std::out_of_range&) {
            std::cout << token << " -> out of range\n";
        }
    }
    std::cout << "parsed " << parsed << " of " << total << '\n';
    return 0;
}
`,
          hints: [
            "The second parameter of std::stoi receives how many characters were read; a token with characters left over is not a whole number.",
            "Both handlers name a type from <stdexcept>; the order between them does not matter because neither derives from the other.",
            "Increment the success counter after parseInt returns — a throw skips the rest of the try block, so the count is only reached on success.",
          ],
          cases: [
            { stdin: "42 -7 abc 12x 2147483648 +8\n", expected: "42 -> 42\n-7 -> -7\nabc -> invalid\n12x -> invalid\n2147483648 -> out of range\n+8 -> 8\nparsed 3 of 6\n" },
            { stdin: "007 -2147483648 1e3\n", expected: "007 -> 7\n-2147483648 -> -2147483648\n1e3 -> invalid\nparsed 2 of 3\n" },
            { stdin: "- + . 0x1A 99999999999999999999\n", expected: "- -> invalid\n+ -> invalid\n. -> invalid\n0x1A -> invalid\n99999999999999999999 -> out of range\nparsed 0 of 5\n", hidden: true },
            { stdin: "\n", expected: "parsed 0 of 0\n", hidden: true },
            { stdin: "4294967295 -4294967296 3.7 1_000 0\n", expected: "4294967295 -> out of range\n-4294967296 -> out of range\n3.7 -> invalid\n1_000 -> invalid\n0 -> 0\nparsed 1 of 5\n", hidden: true },
          ],
        },
        {
          title: "A bank with its own hierarchy",
          prompt: `Write a small exception hierarchy and a bank that throws it. \`BankError\` derives from \`std::runtime_error\` and inherits its constructor; \`InsufficientFunds\` derives from \`BankError\` and carries \`needed()\` and \`available()\` as \`long long\` data members (its message can be anything). \`Bank\` keeps a \`std::map<std::string, long long>\` and has \`open\`, \`deposit\` and \`withdraw\`, each returning the account's new balance. Rules, checked in this order: a negative amount throws \`std::invalid_argument("negative amount")\`; a \`deposit\` or \`withdraw\` on an unknown account throws \`BankError("unknown account <name>")\`; a \`withdraw\` larger than the balance throws \`InsufficientFunds(amount, balance)\`. \`open\` sets the balance whether or not the account exists. Any other command word throws \`std::invalid_argument("unknown command <word>")\`.

One \`try\` per command in \`main\`, with three handlers **most derived first** — \`InsufficientFunds\`, then \`BankError\`, then \`std::invalid_argument\` — each printing the line shown below. Every message you print comes from an exception you threw yourself, so \`what()\` is safe here.

**Input:** lines of \`<command> <name> <amount>\` until EOF.
**Output:** per command, one of \`ok <name> <balance>\`, \`insufficient: need <amount>, have <balance>\`, \`bank error: <what()>\`, \`invalid: <what()>\`.

\`\`\`text
open alice 100
withdraw alice 30
withdraw alice 100
withdraw bob 5
deposit alice -5
deposit alice 10
\`\`\`
prints
\`\`\`text
ok alice 100
ok alice 70
insufficient: need 100, have 70
bank error: unknown account bob
invalid: negative amount
ok alice 80
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <stdexcept>
#include <string>

class BankError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;   // BankError("message")
};

class InsufficientFunds : public BankError {
public:
    // TODO: constructor taking (needed, available); needed() and available() accessors
    InsufficientFunds() : BankError("insufficient funds") {}
};

class Bank {
public:
    long long open(const std::string& name, long long amount) {
        // TODO
        return amount;
    }
    long long deposit(const std::string& name, long long amount) {
        // TODO
        return amount;
    }
    long long withdraw(const std::string& name, long long amount) {
        // TODO
        return amount;
    }
private:
    std::map<std::string, long long> accounts_;
};

int main() {
    Bank bank;
    std::string command, name;
    long long amount;
    while (std::cin >> command >> name >> amount) {
        // TODO: dispatch on the command inside a try; three handlers, most derived first
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <stdexcept>
#include <string>

class BankError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;   // BankError("message")
};

class InsufficientFunds : public BankError {
public:
    InsufficientFunds(long long needed, long long available)
        : BankError("insufficient funds"), needed_(needed), available_(available) {}
    long long needed() const noexcept { return needed_; }
    long long available() const noexcept { return available_; }
private:
    long long needed_;
    long long available_;
};

class Bank {
public:
    long long open(const std::string& name, long long amount) {
        checkAmount(amount);
        accounts_[name] = amount;
        return amount;
    }
    long long deposit(const std::string& name, long long amount) {
        checkAmount(amount);
        return balanceOf(name) += amount;
    }
    long long withdraw(const std::string& name, long long amount) {
        checkAmount(amount);
        long long& balance = balanceOf(name);
        if (amount > balance) throw InsufficientFunds(amount, balance);
        return balance -= amount;
    }
private:
    std::map<std::string, long long> accounts_;

    static void checkAmount(long long amount) {
        if (amount < 0) throw std::invalid_argument("negative amount");
    }
    long long& balanceOf(const std::string& name) {
        auto it = accounts_.find(name);
        if (it == accounts_.end()) throw BankError("unknown account " + name);
        return it->second;
    }
};

int main() {
    Bank bank;
    std::string command, name;
    long long amount;
    while (std::cin >> command >> name >> amount) {
        try {
            long long balance = 0;
            if (command == "open") balance = bank.open(name, amount);
            else if (command == "deposit") balance = bank.deposit(name, amount);
            else if (command == "withdraw") balance = bank.withdraw(name, amount);
            else throw std::invalid_argument("unknown command " + command);
            std::cout << "ok " << name << ' ' << balance << '\n';
        } catch (const InsufficientFunds& e) {
            std::cout << "insufficient: need " << e.needed() << ", have " << e.available() << '\n';
        } catch (const BankError& e) {
            std::cout << "bank error: " << e.what() << '\n';
        } catch (const std::invalid_argument& e) {
            std::cout << "invalid: " << e.what() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "A private helper that finds the account and throws BankError when it is missing lets deposit and withdraw share the check and return a reference to the balance.",
            "The InsufficientFunds handler must come before the BankError one — a base handler matches every derived type, and the compiler warns when a later handler can never run.",
            "The ok line prints after the call returns inside the try, so a throw skips it without any flag.",
          ],
          cases: [
            { stdin: "open alice 100\nwithdraw alice 30\nwithdraw alice 100\nwithdraw bob 5\ndeposit alice -5\ndeposit alice 10\n", expected: "ok alice 100\nok alice 70\ninsufficient: need 100, have 70\nbank error: unknown account bob\ninvalid: negative amount\nok alice 80\n" },
            { stdin: "open bob 0\nwithdraw bob 0\nwithdraw bob 1\n", expected: "ok bob 0\nok bob 0\ninsufficient: need 1, have 0\n" },
            { stdin: "withdraw x 5\ndeposit y 5\nopen y 5\ndeposit y 5\nwithdraw y 10\nwithdraw y 1\n", expected: "bank error: unknown account x\nbank error: unknown account y\nok y 5\nok y 10\nok y 0\ninsufficient: need 1, have 0\n", hidden: true },
            { stdin: "open a -1\nfreeze a 3\nopen a 7\nwithdraw a 7\nwithdraw bob -2\n", expected: "invalid: negative amount\ninvalid: unknown command freeze\nok a 7\nok a 0\ninvalid: negative amount\n", hidden: true },
            { stdin: "open big 9000000000\nwithdraw big 8999999999\n", expected: "ok big 9000000000\nok big 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstruct T {\n    const char* n;\n    ~T() { std::cout << n; }\n};\nvoid f() { T a{\"a\"}; T b{\"b\"}; throw std::runtime_error(\"x\"); }\nint main() {\n    try { f(); std::cout << \"r\"; }\n    catch (const std::exception&) { std::cout << \"c\"; }\n}\n```",
          options: ["`bac`", "`abc`", "`c`", "`rbac`"],
          answer: 0,
          explanation: "Unwinding destroys `f`'s automatics in reverse order — `b` then `a` — before the handler runs, so `ba` precedes `c`. `r` never prints: execution resumes after the whole `try`/`catch`, not at the statement after the call.",
        },
        {
          prompt: "Why is `catch (const std::exception& e)` preferred over `catch (std::exception e)`?",
          options: [
            "The reference binds to the real exception object, keeping its dynamic type; catching by value copies and slices a derived exception down to the base",
            "Catching by value is a compile error for polymorphic types",
            "The reference form is the only one that allows `throw;` inside the handler",
            "A `const&` handler also matches exceptions of unrelated types",
          ],
          answer: 0,
          explanation: "By value, a `std::out_of_range` becomes a plain `std::exception` inside the handler — compilers warn about it. `throw;` works in either form because it rethrows the original object, not the parameter; a reference handler matches exactly the same types as a value handler.",
        },
        {
          prompt: "A `try` block has `catch (const std::exception&)` first and `catch (const std::out_of_range&)` second. What happens when `v.at(9)` throws?",
          options: [
            "The `out_of_range` handler runs, because it is the more specific match",
            "The `std::exception` handler runs; the second handler can never be reached and the compiler warns",
            "Compile error: handlers must be ordered most general first",
            "Both handlers run in order",
          ],
          answer: 1,
          explanation: "Handlers are tried top to bottom and the first match wins; a base-class handler matches every derived type. GCC and Clang both warn that the later handler \"will be caught by earlier handler\". Exactly one handler ever runs.",
        },
        {
          prompt: "Which of these throws an exception?",
          options: ["`v[9]` on a `std::vector` of three elements", "`v.at(9)` on a `std::vector` of three elements", "`m[key]` on a `std::map` that has no such key", "`std::from_chars` given `\"abc\"`"],
          answer: 1,
          explanation: "`at()` checks and throws `std::out_of_range`. `operator[]` on a vector does no check — out of range is undefined behaviour — `map::operator[]` silently inserts a default, and `std::from_chars` reports through an error code and never throws.",
        },
        {
          prompt: "Inside `catch (const std::exception& e)`, what is the difference between `throw;` and `throw e;`?",
          options: [
            "None — both rethrow the same object",
            "`throw;` rethrows the original exception object with its dynamic type intact; `throw e;` throws a copy of `e`, sliced to `std::exception`",
            "`throw e;` is faster because it avoids a lookup of the current exception",
            "`throw;` is only permitted in `main`",
          ],
          answer: 1,
          explanation: "A bare `throw;` reuses the exception in flight, so an outer `catch (const std::out_of_range&)` still matches. `throw e;` copy-constructs a new object from the static type of `e`, and the derived part is gone.",
        },
        {
          prompt: "You are writing `Account::withdraw`, which fails when the balance is short. Which standard base should your exception type derive from?",
          options: [
            "`std::logic_error` — the caller should have checked the balance first",
            "`std::runtime_error` — a short balance is the state of the world at run time, not a bug in the program",
            "`std::out_of_range` — the amount is out of the balance's range",
            "`std::bad_alloc` — no funds were allocated",
          ],
          answer: 1,
          explanation: "`logic_error` means the program is wrong and a check before the call would have avoided the throw; `runtime_error` means the world refused. The lesson's rule: derive from `runtime_error` unless you mean \"this is a bug\". `out_of_range` and `bad_alloc` have fixed meanings that do not fit.",
        },
        {
          prompt: "What happens when an exception is thrown and no handler anywhere on the call stack matches it?",
          options: [
            "`main` returns 1 automatically",
            "`std::terminate` is called and the process aborts — whether destructors run first is implementation-defined",
            "The exception is discarded and execution continues after the `throw`",
            "The runtime converts it to a `std::exception` and retries the handlers",
          ],
          answer: 1,
          explanation: "An uncaught exception ends the program through `std::terminate`; the judge reports it as a runtime error. The standard does not promise unwinding before termination, so RAII cleanup is not guaranteed on that path — `main` gets no handler for free.",
        },
      ],
    },
    {
      slug: "exception-safety",
      file: "02-exception-safety.md",
      exercises: [
        {
          title: "Released on every path",
          prompt: `Prove that unwinding runs destructors, in order, before the handler. Write \`Guard\`, an RAII class whose constructor prints \`acquire <name>\` and whose destructor prints \`release <name>\` (copying deleted). Then run each job through a recursive \`run(const Job&, std::size_t i)\` that declares a \`Guard\` for resource \`i\` and recurses for \`i + 1\`, so every resource is held in its own frame. When all resources are held, the job either prints \`work <name>\` and returns, or throws \`std::runtime_error("step failed in <name>")\`. \`main\` catches per job. Do not write a \`release\` line by hand anywhere: the destructors produce every one of them, on the success path and on the exception path alike.

**Input:** \`n\`, then \`n\` lines \`<name> <k> <resource-1> … <resource-k> <ok|fail>\`.
**Output:** the acquire/work/release trace as it happens, then \`<name>: ok\` or \`<name>: failed: <what()>\` per job.

\`\`\`text
3
backup 2 db file ok
sync 1 net fail
noop 0 ok
\`\`\`
prints
\`\`\`text
acquire db
acquire file
work backup
release file
release db
backup: ok
acquire net
release net
sync: failed: step failed in sync
work noop
noop: ok
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct Job {
    std::string name;
    std::vector<std::string> resources;
    bool fails = false;
};

class Guard {
public:
    explicit Guard(std::string name) : name_(std::move(name)) {
        // TODO: print "acquire <name>"
    }
    ~Guard() {
        // TODO: print "release <name>"
    }
    Guard(const Guard&) = delete;
    Guard& operator=(const Guard&) = delete;
private:
    std::string name_;
};

void run(const Job& job, std::size_t i) {
    // TODO: when i == job.resources.size(): throw or print "work <name>";
    //       otherwise hold a Guard for resources[i] and recurse
    (void)job;
    (void)i;
}

int main() {
    int n;
    std::cin >> n;
    for (int k = 0; k < n; ++k) {
        Job job;
        int count;
        std::cin >> job.name >> count;
        for (int r = 0; r < count; ++r) {
            std::string resource;
            std::cin >> resource;
            job.resources.push_back(resource);
        }
        std::string outcome;
        std::cin >> outcome;
        job.fails = (outcome == "fail");
        // TODO: run(job, 0) inside a try; report ok or failed
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct Job {
    std::string name;
    std::vector<std::string> resources;
    bool fails = false;
};

class Guard {
public:
    explicit Guard(std::string name) : name_(std::move(name)) {
        std::cout << "acquire " << name_ << '\n';
    }
    ~Guard() {
        std::cout << "release " << name_ << '\n';
    }
    Guard(const Guard&) = delete;
    Guard& operator=(const Guard&) = delete;
private:
    std::string name_;
};

// Each resource is held in its own frame, so the unwinding has to pass
// through every one of them — and run every destructor — before main's
// handler gets control.
void run(const Job& job, std::size_t i) {
    if (i == job.resources.size()) {
        if (job.fails) throw std::runtime_error("step failed in " + job.name);
        std::cout << "work " << job.name << '\n';
        return;
    }
    Guard guard(job.resources[i]);
    run(job, i + 1);
}

int main() {
    int n;
    std::cin >> n;
    for (int k = 0; k < n; ++k) {
        Job job;
        int count;
        std::cin >> job.name >> count;
        for (int r = 0; r < count; ++r) {
            std::string resource;
            std::cin >> resource;
            job.resources.push_back(resource);
        }
        std::string outcome;
        std::cin >> outcome;
        job.fails = (outcome == "fail");
        try {
            run(job, 0);
            std::cout << job.name << ": ok\n";
        } catch (const std::runtime_error& e) {
            std::cout << job.name << ": failed: " << e.what() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "The base case of the recursion is i == resources.size(): that is where the work happens or the throw is raised.",
            "A Guard declared in a frame is destroyed when that frame is left — by return or by unwinding — so the release lines come out in reverse order without any code of yours.",
            "The ok line is inside the try after the call; the failed line is in the handler, which runs only after every frame between the throw and main has been destroyed.",
          ],
          cases: [
            { stdin: "3\nbackup 2 db file ok\nsync 1 net fail\nnoop 0 ok\n", expected: "acquire db\nacquire file\nwork backup\nrelease file\nrelease db\nbackup: ok\nacquire net\nrelease net\nsync: failed: step failed in sync\nwork noop\nnoop: ok\n" },
            { stdin: "1\ndeploy 3 lock db cache fail\n", expected: "acquire lock\nacquire db\nacquire cache\nrelease cache\nrelease db\nrelease lock\ndeploy: failed: step failed in deploy\n" },
            { stdin: "2\nx 0 fail\ny 1 a ok\n", expected: "x: failed: step failed in x\nacquire a\nwork y\nrelease a\ny: ok\n", hidden: true },
            { stdin: "1\nlong 4 a b c d ok\n", expected: "acquire a\nacquire b\nacquire c\nacquire d\nwork long\nrelease d\nrelease c\nrelease b\nrelease a\nlong: ok\n", hidden: true },
            { stdin: "2\nfirst 1 r fail\nsecond 1 r ok\n", expected: "acquire r\nrelease r\nfirst: failed: step failed in first\nacquire r\nwork second\nrelease r\nsecond: ok\n", hidden: true },
          ],
        },
        {
          title: "Moved or copied?",
          prompt: `Make the \`noexcept\` decision visible. \`Probe\` (given) records which constructor built it: \`copied\` or \`moved\`. Define four types, each holding a \`std::string label\` and a \`Probe probe\` and constructible from a string:

- \`Defaulted\` — declares no copy or move at all (rule of zero);
- \`Safe\` — a user-written copy constructor and a user-written move constructor marked \`noexcept\`, each forwarding to the members' corresponding constructor;
- \`Risky\` — the same two constructors, but the move constructor **without** \`noexcept\`;
- \`CopyOnly\` — a user-written copy constructor and no move constructor.

\`relocate<T>\` (given) builds a \`T\`, relocates it with \`T target(std::move_if_noexcept(source))\` — exactly what \`std::vector\` does to each element on reallocation — and prints \`<label>: nothrow move <yes|no>, <moved|copied>\`, the first word from \`std::is_nothrow_move_constructible_v<T>\` and the second from \`target.probe.how\`.

**Input:** \`n\`, then \`n\` lines \`<kind> <label>\` where kind is \`defaulted\`, \`safe\`, \`risky\` or \`copyonly\`.
**Output:** one line per object, then \`moved <a>, copied <b>\`.

\`\`\`text
4
defaulted d
safe s
risky r
copyonly c
\`\`\`
prints
\`\`\`text
d: nothrow move yes, moved
s: nothrow move yes, moved
r: nothrow move no, copied
c: nothrow move no, copied
moved 2, copied 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

// Records which constructor built it: the instrument every kind carries.
struct Probe {
    std::string how = "fresh";
    Probe() = default;
    Probe(const Probe&) : how("copied") {}
    Probe(Probe&&) noexcept : how("moved") {}
};

// TODO: rule of zero — no copy or move declared
struct Defaulted {
    std::string label;
    Probe probe;
    explicit Defaulted(std::string l) : label(std::move(l)) {}
};

// TODO: user-written copy constructor and noexcept move constructor
struct Safe {
    std::string label;
    Probe probe;
    explicit Safe(std::string l) : label(std::move(l)) {}
};

// TODO: the same, but the move constructor is not noexcept
struct Risky {
    std::string label;
    Probe probe;
    explicit Risky(std::string l) : label(std::move(l)) {}
};

// TODO: a copy constructor only
struct CopyOnly {
    std::string label;
    Probe probe;
    explicit CopyOnly(std::string l) : label(std::move(l)) {}
};

template <typename T>
void relocate(const std::string& label, int& moved, int& copied) {
    T source(label);
    T target(std::move_if_noexcept(source));   // what std::vector does on reallocation
    const bool nothrow = std::is_nothrow_move_constructible_v<T>;
    std::cout << label << ": nothrow move " << (nothrow ? "yes" : "no") << ", " << target.probe.how << '\n';
    if (target.probe.how == "moved") ++moved; else ++copied;
}

int main() {
    int n;
    std::cin >> n;
    int moved = 0, copied = 0;
    for (int i = 0; i < n; ++i) {
        std::string kind, label;
        std::cin >> kind >> label;
        if (kind == "defaulted") relocate<Defaulted>(label, moved, copied);
        else if (kind == "safe") relocate<Safe>(label, moved, copied);
        else if (kind == "risky") relocate<Risky>(label, moved, copied);
        else if (kind == "copyonly") relocate<CopyOnly>(label, moved, copied);
    }
    std::cout << "moved " << moved << ", copied " << copied << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

// Records which constructor built it: the instrument every kind carries.
struct Probe {
    std::string how = "fresh";
    Probe() = default;
    Probe(const Probe&) : how("copied") {}
    Probe(Probe&&) noexcept : how("moved") {}
};

// Rule of zero: the compiler writes copy and move, and the move is noexcept
// because std::string's and Probe's are.
struct Defaulted {
    std::string label;
    Probe probe;
    explicit Defaulted(std::string l) : label(std::move(l)) {}
};

// A user-written move that promises not to throw.
struct Safe {
    std::string label;
    Probe probe;
    explicit Safe(std::string l) : label(std::move(l)) {}
    Safe(const Safe& o) : label(o.label), probe(o.probe) {}
    Safe(Safe&& o) noexcept : label(std::move(o.label)), probe(std::move(o.probe)) {}
};

// The same move without the word: the library must assume it can throw.
struct Risky {
    std::string label;
    Probe probe;
    explicit Risky(std::string l) : label(std::move(l)) {}
    Risky(const Risky& o) : label(o.label), probe(o.probe) {}
    Risky(Risky&& o) : label(std::move(o.label)), probe(std::move(o.probe)) {}
};

// A copy constructor and nothing else: declaring it suppresses the implicit move.
struct CopyOnly {
    std::string label;
    Probe probe;
    explicit CopyOnly(std::string l) : label(std::move(l)) {}
    CopyOnly(const CopyOnly& o) : label(o.label), probe(o.probe) {}
};

template <typename T>
void relocate(const std::string& label, int& moved, int& copied) {
    T source(label);
    T target(std::move_if_noexcept(source));   // what std::vector does on reallocation
    const bool nothrow = std::is_nothrow_move_constructible_v<T>;
    std::cout << label << ": nothrow move " << (nothrow ? "yes" : "no") << ", " << target.probe.how << '\n';
    if (target.probe.how == "moved") ++moved; else ++copied;
}

int main() {
    int n;
    std::cin >> n;
    int moved = 0, copied = 0;
    for (int i = 0; i < n; ++i) {
        std::string kind, label;
        std::cin >> kind >> label;
        if (kind == "defaulted") relocate<Defaulted>(label, moved, copied);
        else if (kind == "safe") relocate<Safe>(label, moved, copied);
        else if (kind == "risky") relocate<Risky>(label, moved, copied);
        else if (kind == "copyonly") relocate<CopyOnly>(label, moved, copied);
    }
    std::cout << "moved " << moved << ", copied " << copied << '\n';
    return 0;
}
`,
          hints: [
            "A user-written copy or move constructor must initialise probe from the other object's probe — o.probe for a copy, std::move(o.probe) for a move — or the Probe's default constructor runs and reports fresh.",
            "std::move_if_noexcept yields an rvalue only when the type's move constructor is noexcept; otherwise it yields a const lvalue and the copy constructor is chosen.",
            "Declaring a copy constructor suppresses the implicit move constructor entirely, so CopyOnly has no move to be noexcept about — it copies.",
          ],
          cases: [
            { stdin: "4\ndefaulted d\nsafe s\nrisky r\ncopyonly c\n", expected: "d: nothrow move yes, moved\ns: nothrow move yes, moved\nr: nothrow move no, copied\nc: nothrow move no, copied\nmoved 2, copied 2\n" },
            { stdin: "2\nrisky big\nsafe big\n", expected: "big: nothrow move no, copied\nbig: nothrow move yes, moved\nmoved 1, copied 1\n" },
            { stdin: "3\ncopyonly a\ncopyonly b\ndefaulted c\n", expected: "a: nothrow move no, copied\nb: nothrow move no, copied\nc: nothrow move yes, moved\nmoved 1, copied 2\n", hidden: true },
            { stdin: "1\nrisky solo\n", expected: "solo: nothrow move no, copied\nmoved 0, copied 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which exception-safety guarantee does `std::vector::push_back` give?",
          options: ["No-throw: it never throws", "Strong: if it throws, the vector is exactly as it was before the call", "Basic: no leak, but the vector may hold a partial result", "None: a throw leaves the vector unusable"],
          answer: 1,
          explanation: "`push_back` commits or rolls back — a failed allocation or a throwing element constructor leaves the old contents intact. It can throw (`std::bad_alloc` at least), so it is not no-throw; `assign` is the example of a basic-only operation.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstruct M {\n    M() = default;\n    M(const M&) { std::cout << \"copy\"; }\n    M(M&&) { std::cout << \"move\"; }\n};\nint main() {\n    M a;\n    M b(std::move_if_noexcept(a));\n}\n```",
          options: ["`move`", "`copy`", "Nothing", "Compile error: `M` is not movable"],
          answer: 1,
          explanation: "The move constructor is user-written without `noexcept`, so `std::move_if_noexcept` yields `const M&` and the copy constructor is selected. Add `noexcept` to the move constructor and it prints `move` — this is the decision `std::vector` makes on every reallocation.",
        },
        {
          prompt: "What does `noexcept` on a function actually guarantee?",
          options: [
            "The compiler rejects any `throw` inside the function",
            "If an exception escapes the function, `std::terminate` is called — it is a promise enforced at run time, not a check at compile time",
            "The function is inlined and cannot allocate",
            "Exceptions thrown inside are converted to error codes",
          ],
          answer: 1,
          explanation: "A `throw` inside a `noexcept` function compiles; the consequence of one escaping is immediate termination with no unwinding to the caller. The specifier tells callers and the library what to rely on — nothing about inlining or allocation.",
        },
        {
          prompt: "`Inventory::load` currently clears `items_` and inserts each parsed line. Which rewrite gives the strong guarantee?",
          options: [
            "Parse everything into a temporary map, then `items_.swap(fresh)` as the last statement",
            "Wrap the loop in `try`/`catch`, log the error and return",
            "Mark `load` as `noexcept`",
            "Insert each line inside its own `try` block and skip the bad ones",
          ],
          answer: 0,
          explanation: "Do every step that can throw on a temporary; commit with an operation that cannot throw. If `parse` fails, `items_` was never touched. Logging or skipping leaves a partial update, and `noexcept` would turn the parse error into a call to `std::terminate`.",
        },
        {
          prompt: "Which of these is `noexcept` without the word being written?",
          options: ["A destructor with no explicit specifier", "A user-written move constructor", "`std::vector::at`", "Any function compiled with `-O2`"],
          answer: 0,
          explanation: "Since C++11 destructors are implicitly `noexcept` (unless a member's destructor is not), and defaulted special members inherit `noexcept` from their members. A user-written move constructor gets nothing unless you write the word; `at()` throws by design; optimisation level changes no specifier.",
        },
        {
          prompt: "A `Connection`'s cleanup can genuinely fail — the close message may not be sent. Where should that failure go?",
          options: [
            "Throw from the destructor so the owner learns of it",
            "Give the class an explicit `close()` that may throw; the destructor calls it inside `try`/`catch (...)` and never rethrows",
            "Print it from the destructor and call `std::exit`",
            "Mark the destructor `noexcept(false)` and throw only when no other exception is in flight",
          ],
          answer: 1,
          explanation: "A destructor that throws during unwinding terminates the program, and a destructor is implicitly `noexcept` anyway. `std::fstream` follows the same design: `close()` for callers who care, a swallowing destructor for everyone else. Checking for an exception in flight is fragile and still leaves the caller no way to handle the failure.",
        },
        {
          prompt: "In which situation is a return value the better choice over an exception?",
          options: [
            "A failure the caller expects often — a lookup that misses, user input that fails to parse",
            "A constructor that cannot establish its invariant",
            "A failure discovered five calls below the only code that can act on it",
            "Always — exceptions are slower than returns",
          ],
          answer: 0,
          explanation: "A throw costs a thousand times a return and belongs on the exceptional path. Constructors have no return value, and a deep chain with no channel for a code is exactly what exceptions are for — so \"always\" is wrong in both directions.",
        },
      ],
    },
    {
      slug: "optional",
      file: "03-optional.md",
      exercises: [
        {
          title: "Price lookup with value_or",
          prompt: `Write \`std::optional<int> priceOf(const std::map<std::string, int>& prices, const std::string& item)\` — the value when the item is listed, \`std::nullopt\` when it is not — and answer two kinds of query with it. \`price <item>\` prints the price or \`not listed\`, using the \`if (auto price = priceOf(...))\` idiom. \`basket <k> <item-1> … <item-k>\` adds up the prices of the listed items with \`value_or(0)\` and counts the items that are not listed.

**Input:** \`n\`, then \`n\` lines \`<item> <price>\`, then queries until EOF.
**Output:** \`<item>: <price>\` or \`<item>: not listed\` per price query; \`basket: total <sum>, missing <count>\` per basket query.

\`\`\`text
3
apple 3
pear 5
fig 12
price apple
price kiwi
basket 3 apple kiwi fig
basket 2 kiwi plum
\`\`\`
prints
\`\`\`text
apple: 3
kiwi: not listed
basket: total 15, missing 1
basket: total 0, missing 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <optional>
#include <string>

std::optional<int> priceOf(const std::map<std::string, int>& prices, const std::string& item) {
    // TODO: find, and return the value or std::nullopt
    (void)prices;
    (void)item;
    return std::nullopt;
}

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> prices;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int price;
        std::cin >> item >> price;
        prices[item] = price;
    }
    std::string query;
    while (std::cin >> query) {
        if (query == "price") {
            std::string item;
            std::cin >> item;
            // TODO: if (auto price = priceOf(prices, item)) ... else ...
        } else if (query == "basket") {
            int count;
            std::cin >> count;
            // TODO: read count items; total with value_or(0), count the missing ones
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <optional>
#include <string>

std::optional<int> priceOf(const std::map<std::string, int>& prices, const std::string& item) {
    auto it = prices.find(item);
    if (it == prices.end()) return std::nullopt;
    return it->second;
}

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> prices;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int price;
        std::cin >> item >> price;
        prices[item] = price;
    }
    std::string query;
    while (std::cin >> query) {
        if (query == "price") {
            std::string item;
            std::cin >> item;
            if (auto price = priceOf(prices, item)) {
                std::cout << item << ": " << *price << '\n';
            } else {
                std::cout << item << ": not listed\n";
            }
        } else if (query == "basket") {
            int count;
            std::cin >> count;
            long long total = 0;
            int missing = 0;
            for (int i = 0; i < count; ++i) {
                std::string item;
                std::cin >> item;
                std::optional<int> price = priceOf(prices, item);
                total += price.value_or(0);
                if (!price.has_value()) ++missing;
            }
            std::cout << "basket: total " << total << ", missing " << missing << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "map::find returns end() for a missing key — that iterator-or-end protocol is exactly the sentinel std::optional replaces; return it->second or std::nullopt.",
            "The condition of if (auto price = ...) tests engagement, so a listed item priced 0 still takes the true branch; dereference with *price inside.",
            "value_or(0) gives you the sum in one expression, but the missing count needs has_value() — a listed price of 0 and an unlisted item both contribute 0.",
          ],
          cases: [
            { stdin: "3\napple 3\npear 5\nfig 12\nprice apple\nprice kiwi\nbasket 3 apple kiwi fig\nbasket 2 kiwi plum\n", expected: "apple: 3\nkiwi: not listed\nbasket: total 15, missing 1\nbasket: total 0, missing 2\n" },
            { stdin: "1\nzero 0\nprice zero\nbasket 1 zero\n", expected: "zero: 0\nbasket: total 0, missing 0\n" },
            { stdin: "0\nprice a\nbasket 2 a b\n", expected: "a: not listed\nbasket: total 0, missing 2\n", hidden: true },
            { stdin: "2\na 5\nb 7\nbasket 0\nbasket 4 a a b c\nprice b\n", expected: "basket: total 0, missing 0\nbasket: total 17, missing 1\nb: 7\n", hidden: true },
          ],
        },
        {
          title: "Statistics that may have no answer",
          prompt: `Three functions over a \`std::vector<int>\`, each returning an \`std::optional\` because an empty range has no answer: \`std::optional<double> mean(const std::vector<int>&)\`, \`std::optional<int> maxOf(const std::vector<int>&)\` and \`std::optional<std::size_t> indexOf(const std::vector<int>&, int target)\` (the first index holding \`target\`). Return the value directly and \`std::nullopt\` for "no answer"; never use \`-1\` or \`npos\`. Accumulate the mean in \`long long\`. Print each result with the \`if (auto r = f())\` idiom.

**Input:** \`n\`, then \`n\` integers, then \`target\`.
**Output:** \`count: <n>\`, then \`mean: <x.xx>\` or \`mean: none\`, \`max: <v>\` or \`max: none\`, \`index of <target>: <i>\` or \`index of <target>: absent\`.

\`\`\`text
5
4 8 15 16 23
15
\`\`\`
prints
\`\`\`text
count: 5
mean: 13.20
max: 23
index of 15: 2
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <optional>
#include <vector>

std::optional<double> mean(const std::vector<int>& v) {
    // TODO
    (void)v;
    return std::nullopt;
}

std::optional<int> maxOf(const std::vector<int>& v) {
    // TODO
    (void)v;
    return std::nullopt;
}

std::optional<std::size_t> indexOf(const std::vector<int>& v, int target) {
    // TODO
    (void)v;
    (void)target;
    return std::nullopt;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v(n);
    for (int& x : v) std::cin >> x;
    int target;
    std::cin >> target;

    std::cout << "count: " << v.size() << '\n';
    std::cout << std::fixed << std::setprecision(2);
    // TODO: print the three results with if (auto r = ...) ... else ...
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <optional>
#include <vector>

std::optional<double> mean(const std::vector<int>& v) {
    if (v.empty()) return std::nullopt;
    long long sum = 0;
    for (int x : v) sum += x;
    return static_cast<double>(sum) / static_cast<double>(v.size());
}

std::optional<int> maxOf(const std::vector<int>& v) {
    if (v.empty()) return std::nullopt;
    int best = v[0];
    for (int x : v) {
        if (x > best) best = x;
    }
    return best;
}

std::optional<std::size_t> indexOf(const std::vector<int>& v, int target) {
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) return i;      // index 0 is a perfectly good answer
    }
    return std::nullopt;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v(n);
    for (int& x : v) std::cin >> x;
    int target;
    std::cin >> target;

    std::cout << "count: " << v.size() << '\n';
    std::cout << std::fixed << std::setprecision(2);
    if (auto m = mean(v)) std::cout << "mean: " << *m << '\n';
    else std::cout << "mean: none\n";
    if (auto m = maxOf(v)) std::cout << "max: " << *m << '\n';
    else std::cout << "max: none\n";
    if (auto i = indexOf(v, target)) std::cout << "index of " << target << ": " << *i << '\n';
    else std::cout << "index of " << target << ": absent\n";
    return 0;
}
`,
          hints: [
            "Each function starts with the empty check and returns std::nullopt; the value path returns a plain double, int or size_t, which converts to the optional.",
            "indexOf returns i as soon as it matches — an engaged optional holding 0 is true in the if, which is the whole reason not to return -1.",
            "The manipulators std::fixed and std::setprecision(2) are sticky; set them once before the mean and the integers are unaffected.",
          ],
          cases: [
            { stdin: "5\n4 8 15 16 23\n15\n", expected: "count: 5\nmean: 13.20\nmax: 23\nindex of 15: 2\n" },
            { stdin: "0\n3\n", expected: "count: 0\nmean: none\nmax: none\nindex of 3: absent\n" },
            { stdin: "3\n-5 -9 -1\n-5\n", expected: "count: 3\nmean: -5.00\nmax: -1\nindex of -5: 0\n", hidden: true },
            { stdin: "4\n2000000000 2000000000 2000000000 2000000000\n7\n", expected: "count: 4\nmean: 2000000000.00\nmax: 2000000000\nindex of 7: absent\n", hidden: true },
            { stdin: "1\n0\n0\n", expected: "count: 1\nmean: 0.00\nmax: 0\nindex of 0: 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::optional<int> o;\nstd::cout << o.value_or(7);\no = 0;\nstd::cout << (o ? \"y\" : \"n\");\n```",
          options: ["`7y`", "`7n`", "`0y`", "It throws `std::bad_optional_access`"],
          answer: 0,
          explanation: "`value_or(7)` returns the default while `o` is empty. After `o = 0` the optional is *engaged* — the condition tests engagement, not the value — so it is `true` even though the held `int` is zero. Nothing here throws.",
        },
        {
          prompt: "What does `*o` do when `o` is an empty `std::optional<int>`?",
          options: ["Throws `std::bad_optional_access`", "Undefined behaviour — no check is made", "Returns a default-constructed `int`", "Returns `std::nullopt`"],
          answer: 1,
          explanation: "`operator*` and `operator->` are unchecked, like a pointer. `value()` is the form that checks and throws. The optional never hands you a made-up `int`.",
        },
        {
          prompt: "Which statement about `o.value_or(compute())` is correct?",
          options: [
            "`compute()` is called only when `o` is empty",
            "`compute()` is always called, because it is an ordinary function argument evaluated before the call",
            "It does not compile unless `compute` returns an `std::optional`",
            "It returns a reference to the held value when `o` is engaged",
          ],
          answer: 1,
          explanation: "`value_or` is a member function, not lazy syntax: its argument is evaluated whether or not it is needed, and the result is a `T` by value. When the default is expensive, test and dereference instead.",
        },
        {
          prompt: "What is `std::optional<int&>`?",
          options: [
            "An optional reference that rebinds on assignment",
            "Ill-formed: `std::optional` cannot hold a reference; return a pointer, a `std::reference_wrapper` or an index instead",
            "Legal, but always empty",
            "Legal only when the referent outlives the optional",
          ],
          answer: 1,
          explanation: "The committee could not agree what assigning to an optional reference should mean, so the specialisation does not exist before C++26. A `T*` that may be null already is an optional reference, and `std::optional<std::reference_wrapper<T>>` spells it out when the signature must say \"optional\".",
        },
        {
          prompt: "`std::optional<int> a; std::optional<int> b = 0;` — what is `a < b`?",
          options: ["`true`: an empty optional orders before every engaged value", "`false`: empty compares as zero", "Undefined behaviour", "Compile error: an empty optional cannot be compared"],
          answer: 0,
          explanation: "Optionals compare by value with *empty* first: two empties are equal, and empty is less than any engaged value, including zero. That ordering is what lets `std::optional<int>` be a `std::map` key.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::optional<std::string> name;\nname.emplace(3, 'x');\nstd::cout << name->size();\nname.reset();\nstd::cout << name.has_value();\n```",
          options: ["`30`", "`31`", "`10`", "It throws"],
          answer: 0,
          explanation: "`emplace(3, 'x')` constructs `\"xxx\"` in place, so `size()` is 3; `reset()` returns the optional to empty and `has_value()` streams as `0`. `->` is safe here because the optional was engaged at that point.",
        },
      ],
    },
    {
      slug: "variant-and-visit",
      file: "04-variant-and-visit.md",
      exercises: [
        {
          title: "A token stream",
          prompt: `Classify a stream of tokens with \`using Token = std::variant<int, double, std::string>;\` and visit each one. \`parseToken\` (given) decides the alternative by shape: an optional sign followed by digits is an \`int\`, digits with one \`.\` is a \`double\`, anything else is a \`std::string\` (integers fit in \`int\`). Write the \`overloaded\` helper from the lesson and a single \`std::visit(overloaded{...}, token)\` with three lambdas that print the alternative's name and value, count it, and add numbers to a running \`double\` sum. Doubles print with two decimals.

**Input:** whitespace-separated tokens until EOF.
**Output:** \`int <v>\`, \`double <v>\` or \`string <v>\` per token, then \`ints <a>, doubles <b>, strings <c>, sum <s>\`.

\`\`\`text
42 -7 2.5 hello .5 3. 1e5 +8
\`\`\`
prints
\`\`\`text
int 42
int -7
double 2.50
string hello
double 0.50
double 3.00
string 1e5
int 8
ints 3, doubles 3, strings 2, sum 49.00
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iomanip>
#include <iostream>
#include <string>
#include <variant>

using Token = std::variant<int, double, std::string>;

// TODO: template <typename... Ts> struct overloaded : Ts... { using Ts::operator()...; };

// Given: classifies by shape. An optional sign, then digits with at most one
// '.', is a number; a '.' makes it a double; anything else is a word.
Token parseToken(const std::string& s) {
    std::size_t start = (s[0] == '+' || s[0] == '-') ? 1 : 0;
    bool digits = false, dot = false, ok = true;
    for (std::size_t i = start; i < s.size(); ++i) {
        if (std::isdigit(static_cast<unsigned char>(s[i]))) digits = true;
        else if (s[i] == '.' && !dot) dot = true;
        else ok = false;
    }
    if (!ok || !digits) return s;
    if (dot) return std::stod(s);
    return std::stoi(s);
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int ints = 0, doubles = 0, strings = 0;
    double sum = 0.0;
    std::string text;
    while (std::cin >> text) {
        Token token = parseToken(text);
        // TODO: std::visit(overloaded{ ... }, token);
        (void)token;
    }
    std::cout << "ints " << ints << ", doubles " << doubles << ", strings " << strings << ", sum " << sum << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iomanip>
#include <iostream>
#include <string>
#include <variant>

using Token = std::variant<int, double, std::string>;

template <typename... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

// Given: classifies by shape. An optional sign, then digits with at most one
// '.', is a number; a '.' makes it a double; anything else is a word.
Token parseToken(const std::string& s) {
    std::size_t start = (s[0] == '+' || s[0] == '-') ? 1 : 0;
    bool digits = false, dot = false, ok = true;
    for (std::size_t i = start; i < s.size(); ++i) {
        if (std::isdigit(static_cast<unsigned char>(s[i]))) digits = true;
        else if (s[i] == '.' && !dot) dot = true;
        else ok = false;
    }
    if (!ok || !digits) return s;
    if (dot) return std::stod(s);
    return std::stoi(s);
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int ints = 0, doubles = 0, strings = 0;
    double sum = 0.0;
    std::string text;
    while (std::cin >> text) {
        Token token = parseToken(text);
        std::visit(overloaded{
            [&](int i) { std::cout << "int " << i << '\n'; ++ints; sum += i; },
            [&](double d) { std::cout << "double " << d << '\n'; ++doubles; sum += d; },
            [&](const std::string& w) { std::cout << "string " << w << '\n'; ++strings; },
        }, token);
    }
    std::cout << "ints " << ints << ", doubles " << doubles << ", strings " << strings << ", sum " << sum << '\n';
    return 0;
}
`,
          hints: [
            "overloaded derives from every lambda passed to it and pulls each operator() into one overload set; C++20 deduces the template arguments from the braces.",
            "Capture the counters and the sum by reference ([&]) — the lambdas run inside the loop and must update main's variables.",
            "std::visit calls the lambda whose parameter matches the held alternative exactly; leaving one out is a compile error, which is the point.",
          ],
          cases: [
            { stdin: "42 -7 2.5 hello .5 3. 1e5 +8\n", expected: "int 42\nint -7\ndouble 2.50\nstring hello\ndouble 0.50\ndouble 3.00\nstring 1e5\nint 8\nints 3, doubles 3, strings 2, sum 49.00\n" },
            { stdin: "a b c\n", expected: "string a\nstring b\nstring c\nints 0, doubles 0, strings 3, sum 0.00\n" },
            { stdin: "-0.25 - . 1.2.3 007 +\n", expected: "double -0.25\nstring -\nstring .\nstring 1.2.3\nint 7\nstring +\nints 1, doubles 1, strings 4, sum 6.75\n", hidden: true },
            { stdin: "100 200 0.5\n", expected: "int 100\nint 200\ndouble 0.50\nints 2, doubles 1, strings 0, sum 300.50\n", hidden: true },
          ],
        },
        {
          title: "Turtle commands",
          prompt: `Model a small command language as a variant and interpret it with a stateful visitor. Define \`struct Move { int steps; }\`, \`struct Turn { bool right; }\`, \`struct Report {}\`, \`struct Unknown { std::string line; }\` and \`using Command = std::variant<Move, Turn, Report, Unknown>;\`. \`parse(line)\` turns \`move <n>\` into \`Move\`, \`turn left\`/\`turn right\` into \`Turn\`, \`report\` into \`Report\`, and any other line into \`Unknown{line}\`. \`Turtle\` is a struct with \`x\`, \`y\`, a heading (north, east, south, west; starts at \`(0, 0)\` facing north) and a step total, and one \`operator()\` overload per alternative: \`Move\` walks \`steps\` in the current heading and adds \`steps\` to the total, \`Turn\` rotates a quarter turn, \`Report\` prints \`at (<x>, <y>) facing <N|E|S|W>\`, \`Unknown\` prints \`unknown: <line>\`. Drive it with \`std::visit(turtle, parse(line))\` — pass the visitor by name so its state persists.

**Input:** one command per line until EOF.
**Output:** the report and unknown lines as they occur, then \`total <steps>\`.

\`\`\`text
move 3
turn right
move 2
report
jump 5
turn left
turn left
move 4
report
\`\`\`
prints
\`\`\`text
at (2, 3) facing E
unknown: jump 5
at (-2, 3) facing W
total 9
\`\`\``,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <variant>

struct Move { int steps; };
struct Turn { bool right; };
struct Report {};
struct Unknown { std::string line; };
using Command = std::variant<Move, Turn, Report, Unknown>;

Command parse(const std::string& line) {
    std::istringstream in(line);
    std::string word;
    in >> word;
    // TODO: move <n>, turn left|right, report; anything else is Unknown{line}
    return Unknown{line};
}

struct Turtle {
    int x = 0, y = 0;
    int heading = 0;            // 0 N, 1 E, 2 S, 3 W
    long long travelled = 0;

    // TODO: one operator() per alternative
    void operator()(const Move&) {}
    void operator()(const Turn&) {}
    void operator()(const Report&) const {}
    void operator()(const Unknown&) const {}
};

int main() {
    Turtle turtle;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::visit(turtle, parse(line));
    }
    std::cout << "total " << turtle.travelled << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <variant>

struct Move { int steps; };
struct Turn { bool right; };
struct Report {};
struct Unknown { std::string line; };
using Command = std::variant<Move, Turn, Report, Unknown>;

Command parse(const std::string& line) {
    std::istringstream in(line);
    std::string word;
    in >> word;
    if (word == "move") {
        int steps;
        if (in >> steps) return Move{steps};
    } else if (word == "turn") {
        std::string direction;
        in >> direction;
        if (direction == "left") return Turn{false};
        if (direction == "right") return Turn{true};
    } else if (word == "report") {
        return Report{};
    }
    return Unknown{line};
}

struct Turtle {
    int x = 0, y = 0;
    int heading = 0;            // 0 N, 1 E, 2 S, 3 W
    long long travelled = 0;

    void operator()(const Move& m) {
        static const int dx[4] = {0, 1, 0, -1};
        static const int dy[4] = {1, 0, -1, 0};
        x += dx[heading] * m.steps;
        y += dy[heading] * m.steps;
        travelled += m.steps;
    }
    void operator()(const Turn& t) {
        heading = (heading + (t.right ? 1 : 3)) % 4;
    }
    void operator()(const Report&) const {
        static const char* const names[4] = {"N", "E", "S", "W"};
        std::cout << "at (" << x << ", " << y << ") facing " << names[heading] << '\n';
    }
    void operator()(const Unknown& u) const {
        std::cout << "unknown: " << u.line << '\n';
    }
};

int main() {
    Turtle turtle;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::visit(turtle, parse(line));
    }
    std::cout << "total " << turtle.travelled << '\n';
    return 0;
}
`,
          hints: [
            "parse reads the first word, then whatever that word needs; if the rest does not fit (no number after move, a direction that is neither left nor right) fall through to Unknown{line}.",
            "A left turn is three right turns: heading = (heading + 3) % 4 avoids a negative remainder.",
            "std::visit forwards the visitor, so passing turtle (an lvalue) calls the operators on that object — a temporary Turtle{} would lose the state after every line.",
          ],
          cases: [
            { stdin: "move 3\nturn right\nmove 2\nreport\njump 5\nturn left\nturn left\nmove 4\nreport\n", expected: "at (2, 3) facing E\nunknown: jump 5\nat (-2, 3) facing W\ntotal 9\n" },
            { stdin: "report\nturn left\nmove 1\nreport\n", expected: "at (0, 0) facing N\nat (-1, 0) facing W\ntotal 1\n" },
            { stdin: "turn right\nturn right\nturn right\nturn right\nmove 5\nmove -2\nreport\nturn around\nmove x\nreport\n", expected: "at (0, 3) facing N\nunknown: turn around\nunknown: move x\nat (0, 3) facing N\ntotal 3\n", hidden: true },
            { stdin: "move 0\nreport\n", expected: "at (0, 0) facing N\ntotal 0\n", hidden: true },
            { stdin: "turn right\nturn right\nmove 7\nturn right\nmove 1\nreport\n", expected: "at (-1, -7) facing W\ntotal 8\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::variant<int, double, std::string> v;\nstd::cout << v.index();\nv = \"hi\";\nstd::cout << v.index();\n```",
          options: ["`02`", "`01`", "`20`", "Compile error: a `const char*` is not an alternative"],
          answer: 0,
          explanation: "A default-constructed variant holds its first alternative, `int`, at index 0. Assigning a string literal converts it to the one alternative it can become, `std::string`, at index 2 — the same overload-resolution rules as a function call.",
        },
        {
          prompt: "`v` is a `std::variant<int, double, std::string>` currently holding a string. What does `std::get<double>(v)` do?",
          options: ["Returns `0.0`", "Throws `std::bad_variant_access`", "Undefined behaviour", "Returns `nullptr`"],
          answer: 1,
          explanation: "`std::get` is checked: a mismatch throws. `std::get_if<double>(&v)` is the form that returns a pointer — `nullptr` on a mismatch — for use in an `if`. Nothing about variant access is undefined.",
        },
        {
          prompt: "What does `std::visit` guarantee that an `if`/`else` chain on `v.index()` does not?",
          options: [
            "It is faster because it skips the index check",
            "A compile error when the visitor has no overload for some alternative, so adding a type to the variant cannot be silently unhandled",
            "A run-time exception when an alternative is unhandled",
            "That the visitor is called at most once per program",
          ],
          answer: 1,
          explanation: "The visitor must accept every alternative or the call does not compile; an `if` chain simply falls off its last `else`. Both are index dispatches at run time — the difference is what the compiler checks.",
        },
        {
          prompt: "What is wrong with this visitor?\n\n```cpp\nauto w = std::visit(overloaded{\n    [](int i) { return i; },\n    [](double d) { return d; },\n    [](const std::string& s) { return s.size(); },\n}, v);\n```",
          options: [
            "Nothing — `w` becomes whichever type the held alternative produced",
            "Compile error: every overload of a visitor must return the same type, and these return `int`, `double` and `std::size_t`",
            "It compiles but `w` is always an `int`",
            "Undefined behaviour when the variant holds a string",
          ],
          answer: 1,
          explanation: "`std::visit` has one return type for all alternatives; the lambdas must agree (or convert to one type). Casting each result to a common type — `static_cast<double>` say — fixes it.",
        },
        {
          prompt: "What is `std::monostate` for?",
          options: [
            "As the first alternative it lets a variant of non-default-constructible types be default-constructed, and models \"nothing yet\"",
            "It is what `std::get` returns when the variant holds a different alternative",
            "A faster replacement for `std::any`",
            "It marks a variant as immutable",
          ],
          answer: 0,
          explanation: "A variant default-constructs its first alternative, so a variant whose first alternative cannot be default-constructed cannot be either. `std::monostate` is an empty, comparable type that goes first to say the variant holds nothing meaningful yet.",
        },
        {
          prompt: "When is `std::any` the right tool rather than `std::variant`?",
          options: [
            "Whenever the set of possible types is known in advance",
            "When the set of types is genuinely open at compile time — a plugin's opaque configuration or a scripting bridge",
            "When you need `std::visit` over many types",
            "Never — it exists only for C compatibility",
          ],
          answer: 1,
          explanation: "`std::any` cannot be visited — it does not know its own set of types — and may heap-allocate. With a known set, `std::variant` is checked and faster; with generic code, a template is. Its legitimate use is a set that is open by design.",
        },
        {
          prompt: "What does `std::get_if<int>(&v)` return?",
          options: ["A reference to the `int`, or it throws", "A pointer to the `int` if the variant holds one, otherwise `nullptr`", "An `std::optional<int>`", "`true` or `false`"],
          answer: 1,
          explanation: "`get_if` takes a pointer to the variant and answers with a pointer, which makes `if (auto* p = std::get_if<int>(&v))` the idiomatic checked access. The throwing form is `std::get`; the boolean test is `std::holds_alternative`.",
        },
      ],
    },
    {
      slug: "error-codes-and-design",
      file: "05-error-codes-and-design.md",
      exercises: [
        {
          title: "A calculator that returns codes",
          prompt: `Write a calculator whose failures are an \`enum class CalcError { Ok, DivisionByZero, UnknownOperator, Overflow };\` returned from \`[[nodiscard]] CalcError compute(int a, char op, int b, long long& out)\`. Operators are \`+ - * / %\`; compute in \`long long\`; \`/\` and \`%\` by zero are \`DivisionByZero\`; any other operator is \`UnknownOperator\`; a result outside the range of \`int\` is \`Overflow\`. \`const char* describe(CalcError)\` names each code through a \`switch\` with no \`default\`, so the compiler reports a code you forget.

**Input:** lines \`<a> <op> <b>\` until EOF; \`a\` and \`b\` fit in \`int\`.
**Output:** \`<a> <op> <b> = <result>\` on success, \`<a> <op> <b>: <description>\` otherwise, with descriptions \`division by zero\`, \`unknown operator\`, \`overflow\`.

\`\`\`text
7 + 5
9 / 0
2147483647 + 1
6 ^ 2
-7 / 2
\`\`\`
prints
\`\`\`text
7 + 5 = 12
9 / 0: division by zero
2147483647 + 1: overflow
6 ^ 2: unknown operator
-7 / 2 = -3
\`\`\``,
          starter: String.raw`#include <iostream>
#include <limits>

enum class CalcError { Ok, DivisionByZero, UnknownOperator, Overflow };

[[nodiscard]] CalcError compute(int a, char op, int b, long long& out) {
    // TODO: switch on op, compute in long long, check the int range last
    (void)a;
    (void)op;
    (void)b;
    out = 0;
    return CalcError::Ok;
}

const char* describe(CalcError e) {
    // TODO: a switch with a case per code and no default
    (void)e;
    return "unknown error";
}

int main() {
    int a, b;
    char op;
    while (std::cin >> a >> op >> b) {
        long long result = 0;
        // TODO: call compute, print the line for its code
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <limits>

enum class CalcError { Ok, DivisionByZero, UnknownOperator, Overflow };

[[nodiscard]] CalcError compute(int a, char op, int b, long long& out) {
    const long long x = a;
    const long long y = b;
    switch (op) {
        case '+': out = x + y; break;
        case '-': out = x - y; break;
        case '*': out = x * y; break;
        case '/':
            if (y == 0) return CalcError::DivisionByZero;
            out = x / y;
            break;
        case '%':
            if (y == 0) return CalcError::DivisionByZero;
            out = x % y;
            break;
        default:
            return CalcError::UnknownOperator;
    }
    if (out < std::numeric_limits<int>::min() || out > std::numeric_limits<int>::max()) return CalcError::Overflow;
    return CalcError::Ok;
}

const char* describe(CalcError e) {
    switch (e) {
        case CalcError::Ok: return "ok";
        case CalcError::DivisionByZero: return "division by zero";
        case CalcError::UnknownOperator: return "unknown operator";
        case CalcError::Overflow: return "overflow";
    }
    return "unknown error";   // unreachable while every code has a case; -Wswitch keeps it so
}

int main() {
    int a, b;
    char op;
    while (std::cin >> a >> op >> b) {
        long long result = 0;
        const CalcError error = compute(a, op, b, result);
        if (error == CalcError::Ok) {
            std::cout << a << ' ' << op << ' ' << b << " = " << result << '\n';
        } else {
            std::cout << a << ' ' << op << ' ' << b << ": " << describe(error) << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Widen both operands to long long before the arithmetic — the product of two ints always fits, and the overflow check is then an ordinary comparison against std::numeric_limits<int>.",
            "Check for a zero divisor before dividing; the range check comes after the switch so it applies to every operator, including INT_MIN / -1.",
            "The result of a [[nodiscard]] function must be used: store the code in a variable and compare it with CalcError::Ok.",
          ],
          cases: [
            { stdin: "7 + 5\n9 / 0\n2147483647 + 1\n6 ^ 2\n-7 / 2\n", expected: "7 + 5 = 12\n9 / 0: division by zero\n2147483647 + 1: overflow\n6 ^ 2: unknown operator\n-7 / 2 = -3\n" },
            { stdin: "10 % 3\n-7 % 3\n5 % 0\n", expected: "10 % 3 = 1\n-7 % 3 = -1\n5 % 0: division by zero\n" },
            { stdin: "-2147483648 / -1\n-2147483648 - 1\n46341 * 46341\n", expected: "-2147483648 / -1: overflow\n-2147483648 - 1: overflow\n46341 * 46341: overflow\n", hidden: true },
            { stdin: "46340 * 46340\n0 / 5\n1 & 1\n", expected: "46340 * 46340 = 2147395600\n0 / 5 = 0\n1 & 1: unknown operator\n", hidden: true },
            { stdin: "-9 / 2\n-2147483648 + 0\n", expected: "-9 / 2 = -4\n-2147483648 + 0 = -2147483648\n", hidden: true },
          ],
        },
        {
          title: "Parse, validate, execute",
          prompt: `Build the pipeline from the lesson and report the first layer that fails. A stock of items is loaded first; then each command line passes through three layers:

- **parse** — \`std::optional<Request> parse(const std::string& line)\`: exactly three tokens, \`<command> <item> <quantity>\`, the quantity converted with \`std::from_chars\` and consumed entirely (no \`+\`, no trailing characters). Anything else is \`std::nullopt\` → \`parse error: <line>\`.
- **validate** — \`[[nodiscard]] ValidationError validate(const Request&)\` with \`enum class ValidationError { Ok, UnknownCommand, BadQuantity }\`: the command must be \`take\` or \`add\` (checked first), the quantity must be 1–1000 → \`validate error: unknown command\` / \`validate error: bad quantity\`.
- **execute** — \`int execute(std::map<std::string, int>& stock, const Request&)\` returns the item's new quantity; \`add\` creates the item if needed; \`take\` throws \`StockError("unknown item <item>")\` (derived from \`std::runtime_error\`) when the item is not stocked and \`StockError("not enough <item>")\` when the stock is short.
- **report** — \`main\` prints \`ok <item> <quantity>\` or catches the \`StockError\` and prints \`execute error: <what()>\`.

**Input:** \`n\`, then \`n\` lines \`<item> <quantity>\`, then command lines until EOF (blank lines are skipped).
**Output:** one line per command.

\`\`\`text
2
apple 5
pear 2
take apple 3
take apple 3
take kiwi 1
add kiwi 4
take kiwi 4
grab apple 1
take apple 0
take apple
take pear x
\`\`\`
prints
\`\`\`text
ok apple 2
execute error: not enough apple
execute error: unknown item kiwi
ok kiwi 4
ok kiwi 0
validate error: unknown command
validate error: bad quantity
parse error: take apple
parse error: take pear x
\`\`\``,
          starter: String.raw`#include <charconv>
#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>

struct Request {
    std::string command;
    std::string item;
    int quantity;
};

enum class ValidationError { Ok, UnknownCommand, BadQuantity };

class StockError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

// Layer 1: text -> structure. Malformed lines are ordinary, so: optional.
std::optional<Request> parse(const std::string& line) {
    // TODO: three tokens exactly; std::from_chars on the third
    (void)line;
    return std::nullopt;
}

// Layer 2: the domain's rules. Enumerable, so: a code.
[[nodiscard]] ValidationError validate(const Request& r) {
    // TODO
    (void)r;
    return ValidationError::Ok;
}

// Layer 3: the world may refuse. Throws.
int execute(std::map<std::string, int>& stock, const Request& r) {
    // TODO
    (void)stock;
    (void)r;
    return 0;
}

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> stock;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int quantity;
        std::cin >> item >> quantity;
        stock[item] = quantity;
    }
    std::cin.ignore();
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        // TODO: parse -> validate -> execute inside a try -> report
    }
    return 0;
}
`,
          solution: String.raw`#include <charconv>
#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>

struct Request {
    std::string command;
    std::string item;
    int quantity;
};

enum class ValidationError { Ok, UnknownCommand, BadQuantity };

class StockError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

// Layer 1: text -> structure. Malformed lines are ordinary, so: optional.
std::optional<Request> parse(const std::string& line) {
    std::istringstream in(line);
    std::string command, item, number, extra;
    if (!(in >> command >> item >> number) || (in >> extra)) return std::nullopt;
    int quantity = 0;
    const char* end = number.data() + number.size();
    auto [ptr, ec] = std::from_chars(number.data(), end, quantity);
    if (ec != std::errc{} || ptr != end) return std::nullopt;
    return Request{command, item, quantity};
}

// Layer 2: the domain's rules. Enumerable, so: a code.
[[nodiscard]] ValidationError validate(const Request& r) {
    if (r.command != "take" && r.command != "add") return ValidationError::UnknownCommand;
    if (r.quantity < 1 || r.quantity > 1000) return ValidationError::BadQuantity;
    return ValidationError::Ok;
}

// Layer 3: the world may refuse. Throws.
int execute(std::map<std::string, int>& stock, const Request& r) {
    if (r.command == "add") return stock[r.item] += r.quantity;
    auto it = stock.find(r.item);
    if (it == stock.end()) throw StockError("unknown item " + r.item);
    if (it->second < r.quantity) throw StockError("not enough " + r.item);
    return it->second -= r.quantity;
}

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> stock;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int quantity;
        std::cin >> item >> quantity;
        stock[item] = quantity;
    }
    std::cin.ignore();
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        const std::optional<Request> request = parse(line);
        if (!request) {
            std::cout << "parse error: " << line << '\n';
            continue;
        }
        switch (validate(*request)) {
            case ValidationError::UnknownCommand: std::cout << "validate error: unknown command\n"; continue;
            case ValidationError::BadQuantity: std::cout << "validate error: bad quantity\n"; continue;
            case ValidationError::Ok: break;
        }
        // Layer 4: the boundary. The only place that catches.
        try {
            const int left = execute(stock, *request);
            std::cout << "ok " << request->item << ' ' << left << '\n';
        } catch (const StockError& e) {
            std::cout << "execute error: " << e.what() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Read the three tokens from an std::istringstream and then try to read a fourth — success there means the line had too many tokens.",
            "std::from_chars reports through the returned ec and ptr: success is ec == std::errc{} and ptr at the end of the token; it rejects a leading + by itself.",
            "Only execute throws, and only main catches; parse and validate answer through their return values, so each layer's failure is reported exactly once.",
          ],
          cases: [
            { stdin: "2\napple 5\npear 2\ntake apple 3\ntake apple 3\ntake kiwi 1\nadd kiwi 4\ntake kiwi 4\ngrab apple 1\ntake apple 0\ntake apple\ntake pear x\n", expected: "ok apple 2\nexecute error: not enough apple\nexecute error: unknown item kiwi\nok kiwi 4\nok kiwi 0\nvalidate error: unknown command\nvalidate error: bad quantity\nparse error: take apple\nparse error: take pear x\n" },
            { stdin: "0\nadd pen 3\ntake pen 3\ntake pen 1\n", expected: "ok pen 3\nok pen 0\nexecute error: not enough pen\n" },
            { stdin: "1\nnut 10\ntake nut 1001\nadd nut 1000\ntake nut -1\ntake nut +1\ntake nut 1 extra\ntake nut 10\n", expected: "validate error: bad quantity\nok nut 1010\nvalidate error: bad quantity\nparse error: take nut +1\nparse error: take nut 1 extra\nok nut 1000\n", hidden: true },
            { stdin: "1\nbolt 2\nspend bolt 0\ntake 5 bolt\n", expected: "validate error: unknown command\nparse error: take 5 bolt\n", hidden: true },
            { stdin: "1\nx 1\n\ntake x 1\ntake x 1\n", expected: "ok x 0\nexecute error: not enough x\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why must `errno` be set to `0` before calling `std::strtol`?",
          options: [
            "`strtol` reads it as an input parameter",
            "Library calls set `errno` on failure but never clear it, so a stale value from an earlier call would be misread as this call's failure",
            "Reading `errno` before writing it is undefined behaviour",
            "`strtol` returns `errno` as its result",
          ],
          answer: 1,
          explanation: "`errno` is a thread-local integer that only ever gets *set*. The protocol is clear, call, check — and the check must happen before any other call can overwrite it.",
        },
        {
          prompt: "What does `[[nodiscard]]` on `CalcError compute(...)` do when a caller writes `compute(a, op, b, out);` and ignores the result?",
          options: ["Makes it a compile error", "Makes the compiler emit a warning", "Forces the caller to wrap the call in `try`", "Converts the ignored code into an exception"],
          answer: 1,
          explanation: "The attribute turns a silently ignored return into a diagnostic — a warning, which `-Werror` can promote. It is the modern fix for the C weakness that a return code is optional to check.",
        },
        {
          prompt: "`std::from_chars` is given the text `12ab` and an `int`. What does it report?",
          options: [
            "`ec == std::errc::invalid_argument`",
            "`ec == std::errc{}` (success), `value == 12`, and `ptr` pointing at the `a`",
            "It throws `std::invalid_argument`",
            "`value == 0` and `ptr` at the start",
          ],
          answer: 1,
          explanation: "`from_chars` parses the longest valid prefix and never throws; `ptr` says where it stopped. \"The whole token was a number\" is the comparison `ptr == end`, which is why the exercise checks it — the parse alone does not.",
        },
        {
          prompt: "With `NDEBUG` defined, what happens to `assert(read(fd, buf, n) > 0);`?",
          options: [
            "The check is skipped but `read` still runs",
            "The entire statement is removed, so `read` is never called",
            "The assertion becomes an exception",
            "Nothing — `NDEBUG` only affects `static_assert`",
          ],
          answer: 1,
          explanation: "`assert` expands to nothing under `NDEBUG`, expression included. That is why an assertion must never carry a side effect and must never be the check that protects against bad input — in release it is not there.",
        },
        {
          prompt: "In the parse → validate → execute → report pipeline, which layer throws?",
          options: ["parse — malformed input is an error", "validate — rule violations are errors", "execute — the world refused, and the code that finds out is far below anyone who can act", "report — it is the boundary"],
          answer: 2,
          explanation: "Parse returns an `optional` because bad lines are ordinary; validate returns a code because violations are enumerable; report catches. Only execute throws, so the failure can carry context up through frames that have nothing to add.",
        },
        {
          prompt: "Which statement about `std::expected<T, E>` is correct on this track's runtime?",
          options: [
            "It is available since C++17 alongside `std::optional`",
            "It is C++23; on a C++20 compiler use `std::variant<T, E>` visited, or `std::optional<T>` beside a code",
            "It is an alias for `std::optional<T>`",
            "It is the same type as `std::error_code`",
          ],
          answer: 1,
          explanation: "`std::expected` arrived in C++23 with `value()`, `error()` and the monadic members. The runtime here is C++20, so it is reading only; the lesson names the two C++20 spellings, and the checkpoint uses the variant one.",
        },
        {
          prompt: "What is wrong with wrapping a step in `catch (...) {}`?",
          options: [
            "Nothing — it is the safe way to keep a program running",
            "It swallows every failure silently, so the next symptom appears far from the cause",
            "It does not compile outside `main`",
            "It catches only exceptions derived from `std::exception`",
          ],
          answer: 1,
          explanation: "An empty handler is a bug with permission to hide. `catch (...)` belongs at the boundary, where it reports and exits; a handler that cannot act should not exist — let the exception reach one that can.",
        },
      ],
    },
    {
      slug: "errors-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Score reader",
          prompt: `Read scores from text and translate the standard library's exceptions into your own hierarchy at the boundary. \`ScoreError\` derives from \`std::runtime_error\` and inherits its constructor; \`NotANumber\` and \`RangeError\` derive from \`ScoreError\`, each with a constructor taking the offending text and building the message \`not a number: <text>\` or \`out of range: <text>\`. \`int parseScore(const std::string& text)\` calls \`std::stoi(text, &consumed)\`: catch its \`std::invalid_argument\` and throw \`NotANumber\`, catch its \`std::out_of_range\` and throw \`RangeError\`; a token only partly consumed is also \`NotANumber\`, and a score outside 0–100 is also \`RangeError\`. The library's \`what()\` is never printed — only yours.

\`main\` reads \`n\` records and, per record, one \`try\` with a handler per derived type that prints \`<name>: <what()>\` and counts it. At the end print the average of the accepted scores to two decimals (or \`none\`) and the rejection counts.

**Input:** \`n\`, then \`n\` lines \`<name> <score-text>\`.
**Output:** \`n\` lines, then \`average: <x.xx>\` or \`average: none\`, then \`rejected: <a> not a number, <b> out of range\`.

\`\`\`text
4
ada 93
bob 9x
cy 250
dee 100
\`\`\`
prints
\`\`\`text
ada: 93
bob: not a number: 9x
cy: out of range: 250
dee: 100
average: 96.50
rejected: 1 not a number, 1 out of range
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

class ScoreError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

// TODO: NotANumber and RangeError, each constructed from the offending text
class NotANumber : public ScoreError {
public:
    using ScoreError::ScoreError;
};

class RangeError : public ScoreError {
public:
    using ScoreError::ScoreError;
};

int parseScore(const std::string& text) {
    // TODO: std::stoi inside a try; translate its exceptions; check consumed and the 0-100 range
    (void)text;
    return 0;
}

int main() {
    int n;
    std::cin >> n;
    long long sum = 0;
    int valid = 0, notNumbers = 0, outOfRange = 0;
    for (int i = 0; i < n; ++i) {
        std::string name, text;
        std::cin >> name >> text;
        // TODO: try parseScore; one handler per derived type
    }
    std::cout << std::fixed << std::setprecision(2);
    // TODO: average or none, then the rejected line
    (void)sum;
    (void)valid;
    (void)notNumbers;
    (void)outOfRange;
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

class ScoreError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

class NotANumber : public ScoreError {
public:
    explicit NotANumber(const std::string& text) : ScoreError("not a number: " + text) {}
};

class RangeError : public ScoreError {
public:
    explicit RangeError(const std::string& text) : ScoreError("out of range: " + text) {}
};

// The boundary with the standard library: its exceptions are translated here,
// so nothing above this function ever sees (or prints) the library's text.
int parseScore(const std::string& text) {
    int score = 0;
    std::size_t consumed = 0;
    try {
        score = std::stoi(text, &consumed);
    } catch (const std::invalid_argument&) {
        throw NotANumber(text);
    } catch (const std::out_of_range&) {
        throw RangeError(text);
    }
    if (consumed != text.size()) throw NotANumber(text);
    if (score < 0 || score > 100) throw RangeError(text);
    return score;
}

int main() {
    int n;
    std::cin >> n;
    long long sum = 0;
    int valid = 0, notNumbers = 0, outOfRange = 0;
    for (int i = 0; i < n; ++i) {
        std::string name, text;
        std::cin >> name >> text;
        try {
            const int score = parseScore(text);
            sum += score;
            ++valid;
            std::cout << name << ": " << score << '\n';
        } catch (const NotANumber& e) {
            ++notNumbers;
            std::cout << name << ": " << e.what() << '\n';
        } catch (const RangeError& e) {
            ++outOfRange;
            std::cout << name << ": " << e.what() << '\n';
        }
    }
    std::cout << std::fixed << std::setprecision(2);
    if (valid > 0) std::cout << "average: " << static_cast<double>(sum) / valid << '\n';
    else std::cout << "average: none\n";
    std::cout << "rejected: " << notNumbers << " not a number, " << outOfRange << " out of range\n";
    return 0;
}
`,
          hints: [
            "Throwing from inside a catch handler is how translation works: the library's exception is consumed and yours begins its own unwinding.",
            "Build the message in the constructor's initialiser list — ScoreError(\"not a number: \" + text) — so what() carries your words.",
            "NotANumber and RangeError are siblings, so their handler order does not matter; a handler for ScoreError placed first would swallow both.",
          ],
          cases: [
            { stdin: "4\nada 93\nbob 9x\ncy 250\ndee 100\n", expected: "ada: 93\nbob: not a number: 9x\ncy: out of range: 250\ndee: 100\naverage: 96.50\nrejected: 1 not a number, 1 out of range\n" },
            { stdin: "2\nx abc\ny -1\n", expected: "x: not a number: abc\ny: out of range: -1\naverage: none\nrejected: 1 not a number, 1 out of range\n" },
            { stdin: "3\na 99999999999\nb 0\nc 100\n", expected: "a: out of range: 99999999999\nb: 0\nc: 100\naverage: 50.00\nrejected: 0 not a number, 1 out of range\n", hidden: true },
            { stdin: "4\np 7.5\nq +50\nr 050\ns 1e2\n", expected: "p: not a number: 7.5\nq: 50\nr: 50\ns: not a number: 1e2\naverage: 50.00\nrejected: 2 not a number, 0 out of range\n", hidden: true },
            { stdin: "1\nonly 101\n", expected: "only: out of range: 101\naverage: none\nrejected: 0 not a number, 1 out of range\n", hidden: true },
          ],
        },
        {
          title: "RPN evaluator with a variant result",
          prompt: `Evaluate reverse-Polish expressions and return the outcome as a value: \`struct EvalError { std::string message; };\` and \`using Result = std::variant<long long, EvalError>;\`. \`Result evaluate(const std::string& line)\` splits the line into tokens; an integer (an optional \`-\` then digits, parsed with \`std::from_chars\` into an \`std::optional<long long>\`) is pushed, and \`+ - * /\` pop two operands and push the result. The first failure ends the evaluation with an \`EvalError\`: \`bad token <tok>\` for anything else, \`stack underflow\` when an operator finds fewer than two operands, \`division by zero\`, \`empty expression\` when the line has no tokens, and \`leftover operands\` when more than one value remains at the end. \`evaluate\` never throws. \`main\` prints each result with \`std::visit\` and an \`overloaded\` visitor.

**Input:** one expression per line until EOF.
**Output:** \`= <value>\` or \`error: <message>\` per line.

\`\`\`text
3 4 + 2 *
1 0 /
5 +
2 3
7
hello
\`\`\`
prints
\`\`\`text
= 14
error: division by zero
error: stack underflow
error: leftover operands
= 7
error: bad token hello
\`\`\``,
          starter: String.raw`#include <charconv>
#include <iostream>
#include <optional>
#include <sstream>
#include <string>
#include <variant>
#include <vector>

struct EvalError { std::string message; };
using Result = std::variant<long long, EvalError>;

template <typename... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

std::optional<long long> parseInt(const std::string& s) {
    // TODO: std::from_chars; the whole token must be consumed
    (void)s;
    return std::nullopt;
}

Result evaluate(const std::string& line) {
    std::istringstream in(line);
    std::vector<long long> stack;
    std::string token;
    while (in >> token) {
        // TODO: push a number, apply an operator, or return an EvalError
    }
    // TODO: empty expression / leftover operands / the value
    return EvalError{"not implemented"};
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: std::visit(overloaded{ ... }, evaluate(line));
        (void)evaluate(line);
    }
    return 0;
}
`,
          solution: String.raw`#include <charconv>
#include <iostream>
#include <optional>
#include <sstream>
#include <string>
#include <variant>
#include <vector>

struct EvalError { std::string message; };
using Result = std::variant<long long, EvalError>;

template <typename... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

std::optional<long long> parseInt(const std::string& s) {
    long long value = 0;
    const char* end = s.data() + s.size();
    auto [ptr, ec] = std::from_chars(s.data(), end, value);
    if (ec != std::errc{} || ptr != end) return std::nullopt;
    return value;
}

// Every failure is a value: the caller gets a Result either way and nothing
// unwinds through main.
Result evaluate(const std::string& line) {
    std::istringstream in(line);
    std::vector<long long> stack;
    std::string token;
    while (in >> token) {
        if (auto number = parseInt(token)) {
            stack.push_back(*number);
            continue;
        }
        if (token != "+" && token != "-" && token != "*" && token != "/") return EvalError{"bad token " + token};
        if (stack.size() < 2) return EvalError{"stack underflow"};
        const long long b = stack.back();
        stack.pop_back();
        const long long a = stack.back();
        stack.pop_back();
        if (token == "/" && b == 0) return EvalError{"division by zero"};
        long long r = 0;
        if (token == "+") r = a + b;
        else if (token == "-") r = a - b;
        else if (token == "*") r = a * b;
        else r = a / b;
        stack.push_back(r);
    }
    if (stack.empty()) return EvalError{"empty expression"};
    if (stack.size() > 1) return EvalError{"leftover operands"};
    return stack.back();
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::visit(overloaded{
            [](long long value) { std::cout << "= " << value << '\n'; },
            [](const EvalError& e) { std::cout << "error: " << e.message << '\n'; },
        }, evaluate(line));
    }
    return 0;
}
`,
          hints: [
            "A bare - is not a number — from_chars finds no digits — so it falls through to the operator branch, which is exactly right.",
            "return stack.back(); and return EvalError{...}; both convert to Result; the function never needs to spell the variant.",
            "The empty and leftover checks come after the loop; a line of only spaces yields no tokens and is an empty expression.",
          ],
          cases: [
            { stdin: "3 4 + 2 *\n1 0 /\n5 +\n2 3\n7\nhello\n", expected: "= 14\nerror: division by zero\nerror: stack underflow\nerror: leftover operands\n= 7\nerror: bad token hello\n" },
            { stdin: "\n15 7 1 1 + - / 3 * 2 1 1 + + -\n", expected: "error: empty expression\n= 5\n" },
            { stdin: "-3 -4 *\n-7 2 /\n+3 1 +\n", expected: "= 12\n= -3\nerror: bad token +3\n", hidden: true },
            { stdin: "1 2 3 + + +\n9 0 %\n1000000 1000000 *\n", expected: "error: stack underflow\nerror: bad token %\n= 1000000000000\n", hidden: true },
            { stdin: "   \n5 -\n0 5 /\n", expected: "error: empty expression\nerror: stack underflow\n= 0\n", hidden: true },
          ],
        },
        {
          title: "Transactions that roll back",
          prompt: `A key–value store (\`std::map<std::string, long long>\`) processes transaction blocks, each from a \`begin\` line to a \`commit\` or \`abort\` line. Commands inside a block: \`set <key> <value>\`, \`add <key> <value>\` (the key must exist), \`del <key>\` (the key must exist), \`get <key>\` (prints \`<key>: <value>\` or \`<key>: (none)\` through an \`std::optional\` lookup). A missing key throws \`StoreError("no key <key>")\` (derived from \`std::runtime_error\`).

Write \`Rollback\`, an RAII guard that copies the store in its constructor and, in its destructor, restores the copy unless \`commit()\` was called. Run each block's commands with one \`Rollback\` in scope; call \`commit()\` only when the block ended with \`commit\`. You write no rollback code at any call site: an \`abort\`, a thrown \`StoreError\`, and a block cut off by the end of input all restore the store because the guard's destructor runs. After each block \`main\` prints \`committed\`, \`aborted\` or \`failed: <what()>\`, then the store as \`store: k1=v1 k2=v2 …\` in key order, or \`store: (empty)\`.

**Input:** blocks as described, until EOF.
**Output:** the \`get\` lines as they happen; after each block its verdict and the store.

\`\`\`text
begin
set a 1
set b 2
commit
begin
set c 3
del zz
commit
begin
add a 10
get a
abort
begin
add b 5
get b
get q
commit
\`\`\`
prints
\`\`\`text
committed
store: a=1 b=2
failed: no key zz
store: a=1 b=2
a: 11
aborted
store: a=1 b=2
b: 7
q: (none)
committed
store: a=1 b=7
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

using Store = std::map<std::string, long long>;

class StoreError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

// Snapshots the store; restores it on every exit unless commit() was called.
class Rollback {
public:
    explicit Rollback(Store& store) : store_(store) {
        // TODO: take the snapshot
    }
    ~Rollback() {
        // TODO: restore unless committed
    }
    void commit() noexcept { committed_ = true; }
    Rollback(const Rollback&) = delete;
    Rollback& operator=(const Rollback&) = delete;
private:
    Store& store_;
    Store snapshot_;
    bool committed_ = false;
};

std::optional<long long> get(const Store& store, const std::string& key) {
    // TODO
    (void)store;
    (void)key;
    return std::nullopt;
}

void apply(Store& store, const std::string& line) {
    std::istringstream in(line);
    std::string op, key;
    in >> op >> key;
    // TODO: set / add / del / get; a missing key throws StoreError("no key <key>")
    (void)store;
}

void runBlock(Store& store, const std::vector<std::string>& block, bool commit) {
    // TODO: one Rollback in scope, apply every line, commit() if asked
    (void)store;
    (void)block;
    (void)commit;
}

void dump(const Store& store) {
    std::cout << "store:";
    if (store.empty()) std::cout << " (empty)";
    for (const auto& [key, value] : store) std::cout << ' ' << key << '=' << value;
    std::cout << '\n';
}

int main() {
    Store store;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line != "begin") continue;
        std::vector<std::string> block;
        std::string ending = "abort";        // the end of input without a verdict aborts
        while (std::getline(std::cin, line)) {
            if (line == "commit" || line == "abort") { ending = line; break; }
            block.push_back(line);
        }
        // TODO: runBlock inside a try; print the verdict; dump
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

using Store = std::map<std::string, long long>;

class StoreError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

// Snapshots the store; restores it on every exit unless commit() was called.
// The strong guarantee for a whole block, paid for with one copy of the map.
class Rollback {
public:
    explicit Rollback(Store& store) : store_(store), snapshot_(store) {}
    ~Rollback() {
        if (!committed_) store_ = std::move(snapshot_);
    }
    void commit() noexcept { committed_ = true; }
    Rollback(const Rollback&) = delete;
    Rollback& operator=(const Rollback&) = delete;
private:
    Store& store_;
    Store snapshot_;
    bool committed_ = false;
};

std::optional<long long> get(const Store& store, const std::string& key) {
    auto it = store.find(key);
    if (it == store.end()) return std::nullopt;
    return it->second;
}

Store::iterator existing(Store& store, const std::string& key) {
    auto it = store.find(key);
    if (it == store.end()) throw StoreError("no key " + key);
    return it;
}

void apply(Store& store, const std::string& line) {
    std::istringstream in(line);
    std::string op, key;
    long long value = 0;
    in >> op >> key;
    if (op == "set") {
        in >> value;
        store[key] = value;
    } else if (op == "add") {
        in >> value;
        existing(store, key)->second += value;
    } else if (op == "del") {
        store.erase(existing(store, key));
    } else if (op == "get") {
        if (auto v = get(store, key)) std::cout << key << ": " << *v << '\n';
        else std::cout << key << ": (none)\n";
    }
}

// The block's commands run under a guard; the last line decides its fate.
void runBlock(Store& store, const std::vector<std::string>& block, bool commit) {
    Rollback guard(store);
    for (const std::string& line : block) apply(store, line);
    if (commit) guard.commit();
}

void dump(const Store& store) {
    std::cout << "store:";
    if (store.empty()) std::cout << " (empty)";
    for (const auto& [key, value] : store) std::cout << ' ' << key << '=' << value;
    std::cout << '\n';
}

int main() {
    Store store;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line != "begin") continue;
        std::vector<std::string> block;
        std::string ending = "abort";        // the end of input without a verdict aborts
        while (std::getline(std::cin, line)) {
            if (line == "commit" || line == "abort") { ending = line; break; }
            block.push_back(line);
        }
        try {
            runBlock(store, block, ending == "commit");
            std::cout << (ending == "commit" ? "committed" : "aborted") << '\n';
        } catch (const StoreError& e) {
            std::cout << "failed: " << e.what() << '\n';
        }
        dump(store);
    }
    return 0;
}
`,
          hints: [
            "Initialise snapshot_ from the store in the constructor's initialiser list; the destructor's whole job is if (!committed_) store_ = std::move(snapshot_).",
            "A throw inside apply leaves runBlock before commit() is reached, so the guard's destructor restores the snapshot during unwinding — main only prints.",
            "A get inside a block sees the block's own uncommitted changes, because the map is modified in place and only restored on exit.",
          ],
          cases: [
            { stdin: "begin\nset a 1\nset b 2\ncommit\nbegin\nset c 3\ndel zz\ncommit\nbegin\nadd a 10\nget a\nabort\nbegin\nadd b 5\nget b\nget q\ncommit\n", expected: "committed\nstore: a=1 b=2\nfailed: no key zz\nstore: a=1 b=2\na: 11\naborted\nstore: a=1 b=2\nb: 7\nq: (none)\ncommitted\nstore: a=1 b=7\n" },
            { stdin: "begin\nset k 5\nadd k 5\nget k\ndel k\nget k\ncommit\n", expected: "k: 10\nk: (none)\ncommitted\nstore: (empty)\n" },
            { stdin: "begin\nset a 1\ncommit\nbegin\nset b 2\nadd c 1\nget b\ncommit\nbegin\ndel a\n", expected: "committed\nstore: a=1\nfailed: no key c\nstore: a=1\naborted\nstore: a=1\n", hidden: true },
            { stdin: "begin\nabort\nbegin\nset z -4\nset z 9\nget z\nabort\nbegin\ndel nothing\ncommit\n", expected: "aborted\nstore: (empty)\nz: 9\naborted\nstore: (empty)\nfailed: no key nothing\nstore: (empty)\n", hidden: true },
            { stdin: "begin\nset a 1\nset b 2\ncommit\nbegin\ndel a\nset c 3\ncommit\nbegin\nadd b 40\ndel c\nget c\ncommit\n", expected: "committed\nstore: a=1 b=2\ncommitted\nstore: b=2 c=3\nc: (none)\ncommitted\nstore: b=42\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstruct L {\n    char c;\n    ~L() { std::cout << c; }\n};\nvoid g() { L x{'x'}; throw 1; }\nvoid f() { L y{'y'}; g(); std::cout << 'f'; }\nint main() {\n    try { f(); } catch (int) { std::cout << 'h'; }\n    std::cout << 'e';\n}\n```",
          options: ["`xyhe`", "`yxhe`", "`xyfhe`", "`he`"],
          answer: 0,
          explanation: "Unwinding leaves `g` (destroying `x`) then `f` (destroying `y`) before the handler prints `h`; `f`'s own `'f'` is never reached. Execution then continues after the `try`/`catch` with `e`.",
        },
        {
          prompt: "Inside `catch (const std::exception& e)` the code writes `throw e;`. An outer `try` has `catch (const std::out_of_range&)` then `catch (const std::exception&)`. The original exception was a `std::out_of_range`. Which outer handler runs?",
          options: [
            "The `out_of_range` handler — the original type is preserved",
            "The `std::exception` handler — `throw e;` throws a copy sliced to the static type of `e`",
            "Neither: rethrowing from a handler is a compile error",
            "Both, in order",
          ],
          answer: 1,
          explanation: "`throw e;` copy-constructs a new `std::exception` from `e`'s static type; the derived part is gone and the `out_of_range` handler no longer matches. A bare `throw;` rethrows the original object and would reach the first handler.",
        },
        {
          prompt: "`v` is a `std::vector<int>` of three elements. Which statement is correct?",
          options: [
            "`v.at(9)` and `v[9]` both throw `std::out_of_range`",
            "`v.at(9)` throws `std::out_of_range`; `v[9]` is undefined behaviour",
            "`v.at(9)` and `v[9]` are both undefined behaviour",
            "`v[9]` throws `std::out_of_range`; `v.at(9)` is undefined behaviour",
          ],
          answer: 1,
          explanation: "Only `at()` checks. `operator[]` is the unchecked access, and out of range there is undefined behaviour — it may read garbage, crash, or be folded away by the optimiser.",
        },
        {
          prompt: "`Big` has a user-written copy constructor and a user-written move constructor without `noexcept`. What does `std::vector<Big>` do to the existing elements when it reallocates?",
          options: ["Moves them", "Copies them — `std::move_if_noexcept` falls back to the copy constructor because the move might throw", "Fails to compile", "Moves them but disables the strong guarantee for that call"],
          answer: 1,
          explanation: "To keep `push_back`'s strong guarantee, the library only moves when the move cannot throw halfway; otherwise it copies, silently and on every reallocation. Adding `noexcept` to the move constructor restores the move.",
        },
        {
          prompt: "Which expression on an empty `std::optional<int> o` throws rather than being undefined behaviour?",
          options: ["`*o`", "`o.value()`", "`o->foo()`", "`o.value_or(0)`"],
          answer: 1,
          explanation: "`value()` checks and throws `std::bad_optional_access`. `*o` and `o->` are unchecked — undefined behaviour when empty — and `value_or` never fails; it returns the default.",
        },
        {
          prompt: "When does `std::visit(visitor, v)` refuse to compile?",
          options: [
            "When the visitor lacks a callable overload for some alternative of `v`, or its overloads return incompatible types",
            "When `v` is currently empty",
            "When the visitor is a lambda instead of a struct",
            "When `v` has more than four alternatives",
          ],
          answer: 0,
          explanation: "The compile-time check is the point of `visit`: every alternative must be accepted and every branch must agree on a return type. A variant is never \"empty\" in normal use, lambdas are the usual visitors, and there is no alternative limit.",
        },
        {
          prompt: "What does `#define NDEBUG` do to `assert(f() > 0);`?",
          options: [
            "Keeps the call to `f()` but drops the check",
            "Removes the whole statement, so `f()` is never called",
            "Turns a failure into an exception instead of an abort",
            "Nothing — `NDEBUG` affects only `static_assert`",
          ],
          answer: 1,
          explanation: "`assert` expands to nothing under `NDEBUG`, expression included. An assertion with a side effect changes the program's behaviour between debug and release, which is why assertions check bugs and never do work.",
        },
        {
          prompt: "In a parse → validate → execute → report pipeline, which layer should throw?",
          options: ["parse", "validate", "execute", "report"],
          answer: 2,
          explanation: "Malformed input is ordinary, so parse returns `std::optional`; rule violations are enumerable, so validate returns a code; execute discovers that the world refused, far below anyone who can act, so it throws; report is the boundary that catches.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::map<std::string, int> m{{\"a\", 1}};\nauto get = [&](const std::string& k) -> std::optional<int> {\n    if (auto it = m.find(k); it != m.end()) return it->second;\n    return std::nullopt;\n};\nstd::cout << get(\"a\").value_or(-1) << get(\"b\").value_or(-1);\n```",
          options: ["`1-1`", "`10`", "`1` and then it throws", "Compile error: a lambda cannot return `std::optional`"],
          answer: 0,
          explanation: "`get(\"a\")` is engaged and yields 1; `get(\"b\")` is empty and `value_or` supplies the default. `value_or` never throws, and a lambda's trailing return type may be any type.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::variant<std::monostate, int, std::string> v;\nstd::cout << v.index();\nv = 5;\nstd::cout << std::holds_alternative<int>(v);\nv = std::string(\"s\");\nstd::cout << v.index();\n```",
          options: ["`012`", "`102`", "`011`", "`002`"],
          answer: 0,
          explanation: "Default construction picks the first alternative, `std::monostate`, at index 0. After `v = 5` the `int` is held, so `holds_alternative<int>` is `1`; the string is the third alternative, index 2.",
        },
        {
          prompt: "A function gives the *strong* exception guarantee when…",
          options: [
            "it cannot throw at all",
            "if it throws, the program state is exactly as it was before the call — commit or roll back",
            "if it throws, nothing leaks and every invariant holds, but the state may have changed",
            "it is declared `noexcept`",
          ],
          answer: 1,
          explanation: "Strong is the commit-or-rollback promise. \"Cannot throw\" is the no-throw guarantee, \"no leak but changed\" is the basic guarantee, and `noexcept` is a specifier, not a guarantee about state.",
        },
        {
          prompt: "Which statement rethrows the exception currently being handled, without copying or slicing it?",
          options: ["`throw;`", "`throw e;`", "`throw std::current_exception();`", "`return e;`"],
          answer: 0,
          explanation: "The operand-less `throw;` reuses the exception object in flight. `throw e;` copies from the handler's parameter and slices; `std::current_exception()` yields an `exception_ptr`, which is itself what would be thrown; `return` is not a throw.",
        },
        {
          prompt: "Which of these never throws?",
          options: ["`std::stoi(\"x\")`", "`std::from_chars(first, last, value)`", "`v.at(3)` on an empty vector", "`new int[1000000000000]`"],
          answer: 1,
          explanation: "`from_chars` reports through an `std::errc` in its result and is specified never to throw. `stoi` throws `std::invalid_argument`, `at()` throws `std::out_of_range`, and an impossible allocation throws `std::bad_alloc`.",
        },
        {
          prompt: "Why does the score reader translate `std::stoi`'s exception into its own `NotANumber` instead of printing `e.what()` from the library's exception?",
          options: [
            "Calling `what()` on a library exception is undefined behaviour",
            "The library's message text is implementation-specific, and a module boundary should hand callers a type in its own vocabulary, with context added",
            "`what()` returns a null pointer for `std::invalid_argument`",
            "`std::stoi` does not throw, so there is nothing to print",
          ],
          answer: 1,
          explanation: "`what()` for the library's own exceptions is whatever the implementation chose (libstdc++ says `stoi`, MSVC something else), so exact output cannot depend on it. Translation at the boundary also lets the caller catch `ScoreError` rather than three types from three libraries down.",
        },
      ],
    },
  ],
});
