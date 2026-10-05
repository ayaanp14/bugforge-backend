---
title: Exception Handling in OOP
order: 11
minutes: 16
level: intermediate
updated: 2026-10-05
seo-title: Exception Handling in OOP: try, catch, finally, RAII
description: Exception handling in OOP: try, catch and finally, checked vs unchecked exceptions in Java, custom exception classes, RAII and try-with-resources, with code.
question: What is exception handling in object-oriented programming?
answer: Exception handling is the mechanism for reporting and recovering from errors without checking a return code after every call. Code that detects a problem throws (raises) an exception object, the call stack unwinds, and the nearest matching catch or except block handles it. Exceptions are objects in a class hierarchy, so a handler can catch one specific error or a whole family.
q: What is the difference between checked and unchecked exceptions in Java?
a: Checked exceptions, subclasses of Exception other than RuntimeException such as IOException, must be caught or declared with throws, and the compiler enforces it. Unchecked exceptions, RuntimeException and Error and their subclasses such as NullPointerException, need neither. Checked ones signal recoverable conditions; unchecked ones usually signal programming bugs.
q: What is the difference between throw and throws in Java?
a: throw is a statement that actually raises an exception object at that point: throw new IllegalArgumentException("negative"). throws is part of a method declaration that lists the checked exceptions the method may let escape, such as void read() throws IOException, so that callers know to handle them.
q: Does the finally block always execute?
a: It runs whether the try block completes normally, throws, or returns, and even if a catch block throws. It does not run if the process ends first, for example through System.exit in Java, os._exit in Python, a crash, or the process being killed, and it cannot run while the try block loops forever.
q: What is RAII in C++?
a: RAII, Resource Acquisition Is Initialization, ties a resource to an object's lifetime: the constructor acquires the resource and the destructor releases it. Because C++ runs destructors of local objects whenever a scope is left, including during exception unwinding, the resource is always released. std::unique_ptr, std::lock_guard and std::fstream all work this way.
q: What is the difference between Error and Exception in Java?
a: Both extend Throwable. An Exception signals a condition an application might reasonably catch and recover from. An Error, such as OutOfMemoryError or StackOverflowError, signals a serious problem in the runtime that ordinary code should not try to handle. Both Error and RuntimeException are unchecked.
q: What does the else block do in a Python try statement?
a: The else block runs only when the try block finished without raising an exception, and before finally. It lets you keep the try block to just the call that might fail, so a bug in the follow-up code is not accidentally caught by an except clause meant for that call.
---
Things go wrong at run time: a file is missing, an amount is negative, a balance is too low, the network drops. **Exception handling** separates the code that *detects* a problem from the code that *knows what to do about it*, which is often several calls further up. In OOP languages an exception is an ordinary object whose class says what went wrong, and exception classes form hierarchies just like any other classes — so you catch a specific error, or a whole family of them, by type. This note covers the mechanics in C++, Java and Python, Java's checked and unchecked exceptions, custom exception classes, and the techniques that guarantee clean-up: RAII, `try`-with-resources and `with`.

## How exceptions work

1. Code detects a problem and **throws** (C++, Java, JavaScript) or **raises** (Python) an exception object.
2. Normal execution stops. The runtime **unwinds the call stack**: it leaves the current function, then its caller, and so on, running clean-up code — C++ destructors, `finally` blocks, context-manager exits — on the way.
3. The first enclosing **handler** whose type matches the exception's class (or a parent class) runs, and execution continues after that handler.
4. If no handler matches, the program ends: Java and Python print a stack trace or traceback, and C++ calls `std::terminate`.

| | Return codes | Exceptions |
| --- | --- | --- |
| Can be ignored by accident | Yes, if the caller forgets to check | No, an unhandled one stops the program |
| Error path mixed with normal path | Yes, a check after every call | No, handlers sit apart |
| Carries details | A number | An object with a message, fields and a stack trace |
| Passes through intermediate functions | Each must forward it | Automatically |
| Cost | Cheap | Cheap when nothing is thrown; throwing is relatively expensive |

## try, catch and finally

| | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Raise | `throw X("msg");` | `throw new X("msg");` | `raise X("msg")` | `throw new X("msg");` |
| Handle | `catch (const X& e)` | `catch (X e)` | `except X as e:` | `catch (e)`, then test `e instanceof X` |
| Catch everything | `catch (...)` | `catch (Throwable t)`, rarely wise | `except Exception:` | `catch (e)` |
| Always runs | No `finally`: destructors (RAII) | `finally` | `finally` | `finally` |
| Runs only if nothing was raised | — | — | `else` | — |

Java (since Java 7) and Python can name several types in one handler: a multi-catch in Java, a tuple such as `except (KeyError, ValueError) as e:` in Python.

Handlers are tried **in order**, and the first one whose type matches wins, so put the most specific types first. Java refuses to compile a handler for a subclass placed after one for its parent, because it could never run; C++ compilers warn; Python silently runs the first match. In C++, always catch **by reference** (`const X&`): catching by value copies the exception and slices off any derived part.

A `finally` block runs whether the `try` completed, threw, or executed `return`. One trap: a `return` inside `finally` overrides the `try` block's return value and silently discards any exception in flight.

## Custom exception classes

Define your own exception classes when callers need to tell your errors apart from others, or when an error should carry data. Group them under one base class for your module, so a caller can catch the specific case it can fix and the whole family otherwise:

```text
BankError                     base class for every banking failure
├── InsufficientFundsError    carries the amount needed and the balance
└── AccountFrozenError
```

Inherit from the right root: `std::runtime_error` (or another `std::exception` subclass) in C++; `Exception` for a checked or `RuntimeException` for an unchecked exception in Java; `Exception` in Python, never `BaseException`. End the name in `Exception` or `Error` as the language's library does.

The program below uses that hierarchy. The first handler catches only `InsufficientFundsError` and reads its fields; the second catches any other `BankError`. The audit line is clean-up that must happen after every attempt: `finally` in Java, Python and JavaScript, and in C++ a destructor at the end of the loop body — RAII standing in for `finally`. Python's `else` holds the success message, so the `try` block contains only the call that can fail.

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

class BankError : public runtime_error {  // base of the family
public:
    using runtime_error::runtime_error;
};

class InsufficientFundsError : public BankError {
public:
    const int needed, available;  // data a handler can use
    InsufficientFundsError(int needed, int available)
        : BankError("insufficient funds"), needed(needed), available(available) {}
};

class AccountFrozenError : public BankError {
public:
    explicit AccountFrozenError(const string& id) : BankError("account " + id + " is frozen") {}
};

class Account {
    string id;
    int balance;
    bool frozen = false;
public:
    Account(string id, int balance) : id(id), balance(balance) {}
    void freeze() { frozen = true; }
    int withdraw(int amount) {
        if (frozen) throw AccountFrozenError(id);
        if (amount > balance) throw InsufficientFundsError(amount, balance);
        return balance -= amount;
    }
};

struct AuditLine {  // RAII: the destructor runs however the block is left
    int attempt;
    ~AuditLine() { cout << "audit: attempt " << attempt << " logged\n"; }
};

int main() {
    Account acct("ACC-7", 1000);
    int amounts[] = {300, 5000, 100};
    for (int i = 0; i < 3; i++) {
        if (i == 2) acct.freeze();
        AuditLine audit{i + 1};
        try {
            int left = acct.withdraw(amounts[i]);
            cout << "withdraw " << amounts[i] << ": ok, balance " << left << "\n";
        } catch (const InsufficientFundsError& e) {  // most specific first
            cout << "withdraw " << amounts[i] << ": need " << e.needed << ", have " << e.available << "\n";
        } catch (const BankError& e) {  // the rest of the family
            cout << "withdraw " << amounts[i] << ": bank error: " << e.what() << "\n";
        }
    }
    return 0;
}
```

```java
class BankError extends RuntimeException {  // unchecked base of the family
    BankError(String message) { super(message); }
}

class InsufficientFundsError extends BankError {
    final int needed, available;  // data a handler can use
    InsufficientFundsError(int needed, int available) {
        super("insufficient funds");
        this.needed = needed;
        this.available = available;
    }
}

class AccountFrozenError extends BankError {
    AccountFrozenError(String id) { super("account " + id + " is frozen"); }
}

class Account {
    private final String id;
    private int balance;
    private boolean frozen = false;
    Account(String id, int balance) { this.id = id; this.balance = balance; }
    void freeze() { frozen = true; }
    int withdraw(int amount) {
        if (frozen) throw new AccountFrozenError(id);
        if (amount > balance) throw new InsufficientFundsError(amount, balance);
        return balance -= amount;
    }
}

public class Main {
    public static void main(String[] args) {
        Account acct = new Account("ACC-7", 1000);
        int[] amounts = {300, 5000, 100};
        for (int i = 0; i < 3; i++) {
            if (i == 2) acct.freeze();
            try {
                int left = acct.withdraw(amounts[i]);
                System.out.println("withdraw " + amounts[i] + ": ok, balance " + left);
            } catch (InsufficientFundsError e) {  // most specific first
                System.out.println("withdraw " + amounts[i] + ": need " + e.needed + ", have " + e.available);
            } catch (BankError e) {  // the rest of the family
                System.out.println("withdraw " + amounts[i] + ": bank error: " + e.getMessage());
            } finally {
                System.out.println("audit: attempt " + (i + 1) + " logged");
            }
        }
    }
}
```

```python
class BankError(Exception):  # base of the family
    pass


class InsufficientFundsError(BankError):
    def __init__(self, needed, available):
        super().__init__("insufficient funds")
        self.needed, self.available = needed, available  # data a handler can use


class AccountFrozenError(BankError):
    def __init__(self, account_id):
        super().__init__(f"account {account_id} is frozen")


class Account:
    def __init__(self, account_id, balance):
        self.id, self.balance, self.frozen = account_id, balance, False

    def withdraw(self, amount):
        if self.frozen:
            raise AccountFrozenError(self.id)
        if amount > self.balance:
            raise InsufficientFundsError(amount, self.balance)
        self.balance -= amount
        return self.balance


acct = Account("ACC-7", 1000)
for i, amount in enumerate([300, 5000, 100], start=1):
    if i == 3:
        acct.frozen = True
    try:
        left = acct.withdraw(amount)  # only the call that can fail
    except InsufficientFundsError as e:  # most specific first
        print(f"withdraw {amount}: need {e.needed}, have {e.available}")
    except BankError as e:  # the rest of the family
        print(f"withdraw {amount}: bank error: {e}")
    else:  # runs only when nothing was raised
        print(f"withdraw {amount}: ok, balance {left}")
    finally:
        print(f"audit: attempt {i} logged")
```

```javascript
class BankError extends Error {} // base of the family

class InsufficientFundsError extends BankError {
  constructor(needed, available) {
    super("insufficient funds");
    this.needed = needed; // data a handler can use
    this.available = available;
  }
}

class AccountFrozenError extends BankError {
  constructor(id) { super(`account ${id} is frozen`); }
}

class Account {
  constructor(id, balance) { this.id = id; this.balance = balance; this.frozen = false; }
  withdraw(amount) {
    if (this.frozen) throw new AccountFrozenError(this.id);
    if (amount > this.balance) throw new InsufficientFundsError(amount, this.balance);
    return (this.balance -= amount);
  }
}

const acct = new Account("ACC-7", 1000);
[300, 5000, 100].forEach((amount, i) => {
  if (i === 2) acct.frozen = true;
  try {
    console.log(`withdraw ${amount}: ok, balance ${acct.withdraw(amount)}`);
  } catch (e) { // one catch block: dispatch on the type by hand
    if (e instanceof InsufficientFundsError) console.log(`withdraw ${amount}: need ${e.needed}, have ${e.available}`);
    else if (e instanceof BankError) console.log(`withdraw ${amount}: bank error: ${e.message}`);
    else throw e; // not ours: let it propagate
  } finally {
    console.log(`audit: attempt ${i + 1} logged`);
  }
});
```

```output
withdraw 300: ok, balance 700
audit: attempt 1 logged
withdraw 5000: need 5000, have 700
audit: attempt 2 logged
withdraw 100: bank error: account ACC-7 is frozen
audit: attempt 3 logged
```

When you catch one exception and throw another, keep the original as the **cause**: `new BankError("transfer failed", e)` in Java (with a matching constructor), `raise BankError("transfer failed") from e` in Python, `std::throw_with_nested` in C++. The stack trace then shows both.

## Checked and unchecked exceptions in Java

```text
Throwable
├── Error                    serious runtime problems: OutOfMemoryError, StackOverflowError
└── Exception                checked: IOException, SQLException, ...
    └── RuntimeException     unchecked: NullPointerException, IllegalArgumentException, ...
```

- **Checked exceptions** — `Exception` and its subclasses, except `RuntimeException`'s branch. A method that can throw one must either catch it or declare it with `throws`, and the compiler enforces this. Use them for conditions a caller can reasonably recover from: a file that does not exist, a network timeout.
- **Unchecked exceptions** — `RuntimeException`, `Error` and their subclasses. No declaration is needed. They usually signal programming mistakes (a `null` dereference, an invalid argument), which the fix is to correct, not to catch.

`throw` raises an exception; `throws` in a method signature declares which checked exceptions may escape it. An overriding method may not declare broader checked exceptions than the method it overrides. Checked exceptions are a Java feature: C++, Python, C# and Kotlin have none, and many Java libraries now prefer unchecked exceptions because checked ones do not compose well with lambdas.

The other two hierarchies, briefly. C++'s `std::exception` has `logic_error` (`invalid_argument`, `out_of_range`) for bugs and `runtime_error` for conditions found while running, plus `bad_alloc`; C++ can technically throw any type, even an `int`, but should not. Python's root is `BaseException`; `SystemExit` and `KeyboardInterrupt` derive from it directly, which is why `except Exception:` does not swallow Ctrl+C and a bare `except:` does.

## Exception safety and RAII in C++

C++ has no `finally`. Instead it guarantees that when a scope is left — normally, by `return`, or by an exception unwinding through it — the destructors of its local objects run, in reverse order of construction. **RAII (Resource Acquisition Is Initialization)** builds on that: wrap every resource in an object that acquires it in the constructor and releases it in the destructor. `std::unique_ptr` frees memory, `std::lock_guard` releases a mutex and `std::ifstream` closes a file, whatever path the code takes.

Library designers describe what a function promises if it throws with three **exception-safety guarantees**:

| Guarantee | Promise if an exception is thrown |
| --- | --- |
| No-throw (`noexcept`) | The function never throws: destructors, swaps, moves |
| Strong | The operation either completes or has no effect at all (commit or roll back) |
| Basic | No resources leak and every object is still valid, though its state may have changed |

Destructors must not throw. Since C++11 they are implicitly `noexcept`, and an exception escaping one during stack unwinding calls `std::terminate`.

## try-with-resources and with

Java and Python get deterministic clean-up through a language construct instead of destructors. Java's **try-with-resources** (Java 7) accepts objects implementing `AutoCloseable` and calls `close()` on each, in reverse order, when the block ends — before any `catch` or `finally` runs. Python's **`with` statement** calls a context manager's `__exit__` the same way. JavaScript in Node 16 has neither, so nested `try`/`finally` does the job. In every version below, both resources are closed in reverse order *before* the handler sees the exception:

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

class Resource {  // RAII: acquire in the constructor, release in the destructor
    string name;
public:
    explicit Resource(string n) : name(n) { cout << "open " << name << "\n"; }
    ~Resource() { cout << "close " << name << "\n"; }
};

int main() {
    try {
        Resource db("db");
        Resource file("file");
        cout << "working\n";
        throw runtime_error("disk full");
    } catch (const exception& e) {  // destructors already ran during unwinding
        cout << "caught: " << e.what() << "\n";
    }
    return 0;
}
```

```java
class Resource implements AutoCloseable {
    private final String name;
    Resource(String name) { this.name = name; System.out.println("open " + name); }
    @Override public void close() { System.out.println("close " + name); }
}

public class Main {
    public static void main(String[] args) {
        try (Resource db = new Resource("db"); Resource file = new Resource("file")) {
            System.out.println("working");
            throw new IllegalStateException("disk full");
        } catch (IllegalStateException e) {  // both resources are already closed
            System.out.println("caught: " + e.getMessage());
        }
    }
}
```

```python
class Resource:  # a context manager
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print(f"open {self.name}")
        return self

    def __exit__(self, exc_type, exc, tb):
        print(f"close {self.name}")
        return False  # do not swallow the exception


try:
    with Resource("db"), Resource("file"):
        print("working")
        raise RuntimeError("disk full")
except RuntimeError as e:  # both resources are already closed
    print(f"caught: {e}")
```

```javascript
class Resource {
  constructor(name) { this.name = name; console.log(`open ${name}`); }
  close() { console.log(`close ${this.name}`); }
}

try {
  const db = new Resource("db");
  try {
    const file = new Resource("file");
    try {
      console.log("working");
      throw new Error("disk full");
    } finally {
      file.close();
    }
  } finally {
    db.close();
  }
} catch (e) { // both resources are already closed
  console.log(`caught: ${e.message}`);
}
```

```output
open db
open file
working
close file
close db
caught: disk full
```

If `close()` itself throws while another exception is already propagating, Java keeps the original as the main exception and attaches the second with `addSuppressed`; you can read it back with `getSuppressed()`.

## Best practices

- Throw exceptions for exceptional conditions, not for ordinary control flow such as ending a loop.
- Catch only what you can handle, at the level that knows what to do; let the rest propagate.
- Never swallow an exception with an empty handler; at the very least log it with its stack trace.
- Throw specific types, and give messages that name the bad value: "amount -50 must be positive".
- Release resources with RAII, try-with-resources or `with`, never by hoping a later line runs.
- Validate arguments early and fail fast, so the exception is thrown near the bug rather than far from it.

## Common mistakes

- Catching a parent type before a child type, so the specific handler never runs.
- Catching C++ exceptions by value, which copies and slices them.
- Writing `except:` or `catch (Throwable t)`, which also swallows interrupts and fatal errors.
- Putting `return` in a `finally` block, which hides the exception that was in flight.
- Letting an exception escape a C++ destructor.
- Wrapping a large block in one `try` so an unrelated bug is caught by a handler meant for one call.

## Interview questions

**What happens when an exception is thrown inside a constructor?**
The object is never created, so nothing receives a reference to it. In C++ its destructor does not run, but the members and base classes that were already fully constructed are destroyed — which is why owning members should be RAII types rather than raw pointers. In Java and Python the partly built object simply becomes garbage.

**Why should C++ destructors not throw?**
Destructors run during stack unwinding. If one throws while another exception is already propagating, the program has two active exceptions and C++ calls `std::terminate`. Since C++11 destructors are `noexcept` by default, so a throw escaping one terminates the program even outside unwinding.

**When should you use checked exceptions and when unchecked?**
Use checked exceptions for conditions a caller can reasonably anticipate and recover from, where forcing them to decide is helpful — a missing file, a failed connection. Use unchecked exceptions for programming errors and violated preconditions, where the right response is fixing the code. Many modern APIs lean towards unchecked exceptions to keep signatures and lambdas simple.

**Can you catch multiple exceptions in one block?**
Yes. Java 7 added multi-catch, which lists the types separated by a vertical bar, as long as none is a subclass of another. Python takes a tuple: `except (KeyError, ValueError) as e:`. C++ has no direct form; catch a common base class by reference, or write separate handlers.

**What are suppressed exceptions in Java?**
When try-with-resources closes a resource and `close()` throws while an exception from the `try` block is already propagating, the closing exception is not allowed to replace the original. It is attached to the original with `addSuppressed`, and the caller can inspect it with `getSuppressed()`.

**What is the difference between EAFP and LBYL?**
LBYL — look before you leap — checks conditions first: `if key in d: value = d[key]`. EAFP — easier to ask forgiveness than permission — tries the operation and handles the exception: `try: value = d[key]` then `except KeyError:`. Python favours EAFP, which also avoids races where the condition changes between the check and the use.

**Is catching Exception or Throwable a good idea?**
Only at the outermost level of a program or thread, to log the failure and keep a server running or exit cleanly. Lower down it hides bugs and catches things you cannot handle, such as `OutOfMemoryError` when catching `Throwable`, or `KeyboardInterrupt` with a bare `except:` in Python.

**How does an exception differ from an error code in OOP design?**
An exception cannot be silently ignored, carries a typed object with data and a stack trace, and passes through intermediate functions without any code in them. An error code is cheaper and explicit in the signature but must be checked after every call. Exceptions suit rare failures; return values, or result and optional types, suit expected outcomes like "not found".

This is the last note in the OOP series. Go back to the [Introduction to Object-Oriented Programming](/notes/oop/introduction-to-oop) for a recap, then take the [OOP Intermediate skill test](/skill-tests/oop-intermediate).
