---
title: Defining functions — def, return and functions as values
minutes: 12
---
A function in Python is an object created by a `def` statement, bound to a name like any other value, and called with parentheses. That one sentence explains most of what surprises people later: a function can be passed to another function, stored in a list, returned from a call, given attributes, and redefined. This lesson covers the statement, what `return` does and does not do, the `None` that every function returns when it says nothing, docstrings, and the discipline — one job, no hidden state, inputs in and a result out — that makes a function worth writing.

## The statement

```python
def area(width, height):
    """Return the area of a width × height rectangle."""
    return width * height

print(area(3, 4))      # 12
```

`def` runs when the interpreter reaches it: it compiles the body, creates a function object, and binds the name `area` to it. The body does not run until the function is called. That is why a function must be defined *above* the code that calls it at module level (a call at the top of a file to a function defined below it is a `NameError`), but functions can call each other in any order as long as every `def` has executed before the first *call*.

The parameters — `width`, `height` — are local names bound to the arguments when the function is called. Everything assigned inside the body is local too, created on entry and gone on return (Module 4 lesson 3).

## return

`return expr` evaluates the expression, ends the call and hands the value back. A `return` with no expression, or falling off the end of the body, returns `None`. There is no way to return nothing at all — the caller always gets an object.

```python
def find_index(xs, target):
    for i, x in enumerate(xs):
        if x == target:
            return i          # leaves the loop and the function at once
    return -1                 # the "not found" answer; without it the caller would get None
```

Several values are returned as one tuple, and unpacked at the call site:

```python
def min_max(xs):
    return min(xs), max(xs)

lo, hi = min_max([3, 1, 4])
```

`return` inside a loop is the cleanest early exit (Module 3). `return` inside a `try` still runs the `finally` block (Module 10). And code after a `return` in the same block never runs — an unreachable line is a bug, not a comment.

## The None trap

A function that computes something but forgets to `return` it hands back `None`, and the caller's next line fails with `AttributeError: 'NoneType' object has no attribute …` or `TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'`. The same trap hides in methods that work in place: `xs.sort()`, `xs.append(x)`, `d.update(...)`, `random.shuffle(xs)` all return `None` by design, so `xs = xs.sort()` throws the list away. The rule the standard library follows — a method that mutates returns `None`; a method that builds a new object returns it — is worth adopting in your own code.

## Functions are objects

```python
def double(x):
    return 2 * x

f = double                 # another name for the same function
print(f(21))               # 42
ops = [double, str, len]   # functions in a list
print(double.__name__)     # 'double'
print(type(double))        # <class 'function'>
```

Because functions are values, they can be arguments (`sorted(words, key=len)`, `map(double, xs)`), return values (a function that builds and returns another — Module 4 lesson 3), and dictionary values (a dispatch table, Module 3). Calling is the only thing parentheses do: `double` is the function, `double(3)` is a call. Forgetting the parentheses passes the function where its result was wanted, and since a function object is truthy, `if is_ready:` is a silent bug.

## Docstrings and help

The first statement of a body, if it is a string, is the docstring; `help(area)` and editors show it, and `area.__doc__` holds it. Write it as what the function *does for the caller*, in the imperative: "Return the area…", not "This function computes…". A one-line docstring is enough for a small function; a longer one describes parameters, the return value and the exceptions raised (Module 15 covers the conventions). Type hints — `def area(width: float, height: float) -> float:` — are the other half of the contract and are covered in this module's last lesson.

## What makes a function good

- **One job.** A function that reads input, computes and prints does three, and none of them can be tested or reused alone. Read in `main`, compute in a function that takes values and returns values, print in `main`.
- **No hidden inputs.** A function that reads a global has an input its signature does not show; pass it as a parameter.
- **No surprise outputs.** A function that returns a value and also mutates its argument or prints is doing two things; pick one and say so in the name (`sort` versus `sorted`).
- **A name that says what it returns**, for functions that return: `is_prime`, `parse_line`, `best_score`. A verb for functions that act: `save`, `print_report`.

```python
def main():
    n = int(input())
    scores = [int(input()) for _ in range(n)]
    lo, hi = min_max(scores)
    print(f"{lo} {hi}")
```

That shape — `main` does I/O, helpers are pure — is how every reference solution in this track is written, and it is what makes the helpers testable in Module 18.

## Pitfalls

- Calling a function above its `def` at module level.
- `xs = xs.sort()` and other in-place methods assigned.
- A missing `return` on one path (the loop found nothing, the `else` branch was not written).
- Passing `f` where `f()` was meant.
- A helper that prints its result instead of returning it — the caller cannot use it.
- A docstring that repeats the name instead of describing the contract.

## Key takeaways

- `def` creates a function object when executed and binds a name; the body runs only when called.
- `return` ends the call with a value; no `return` means `None`; several values come back as a tuple.
- In-place methods return `None` by convention; never assign their result.
- Functions are values: pass them, store them, return them; parentheses call.
- One job, explicit inputs, a returned result, a docstring stating the contract; I/O in `main`.
