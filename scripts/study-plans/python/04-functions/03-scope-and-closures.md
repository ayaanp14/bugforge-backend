---
title: Scope and closures — LEGB, global, nonlocal and late binding
minutes: 15
---
Where does a name come from? Python answers with one rule — **LEGB**: local, enclosing, global, built-in — and one twist: *assignment* anywhere in a function makes the name local to the whole function, even on lines before the assignment. That twist produces `UnboundLocalError`, the `global` and `nonlocal` keywords exist to override it, and closures — functions that remember the enclosing scope they were created in — follow from the same rule. This lesson fixes the rule, the two keywords, the closure mechanism, and the late-binding behaviour that surprises everyone who builds functions in a loop.

## The four scopes

```python
import builtins          # B: built-in — len, print, range, ValueError

counter = 0              # G: module (global) scope

def outer():
    factor = 10          # E: enclosing scope, from inner's point of view
    def inner(x):
        y = x * factor   # L: local — x, y
        return y
    return inner
```

A name is looked up innermost-first: local, then any enclosing function scopes, then the module, then built-ins; the first hit wins. That order is why a local `list = []` hides the built-in for the rest of the function, and why `print` works in every function without an import. Classes have their own scope rules (Module 8); comprehensions have their own local scope (Module 6), which is why the loop variable of a comprehension does not leak.

## Assignment makes a name local

The compiler decides a name's scope by scanning the *whole* function body: if the name is assigned anywhere in it — by `=`, `+=`, `for`, `import`, `def`, `with … as`, `except … as` — it is local everywhere in that function.

```python
count = 0

def bump():
    count += 1        # UnboundLocalError: cannot access local variable 'count'
                      # where it is not associated with a value
```

`count += 1` is an assignment, so `count` is local to `bump`, and reading it before assigning is an error — the global is not consulted at all. Reading without assigning is fine:

```python
def show():
    print(count)      # reads the global: 0
```

This is the rule to internalise: a function can *read* outer names freely; the moment it *assigns* one, that name is a new local unless declared otherwise.

## global and nonlocal

`global name` declares that assignments inside the function bind the *module-level* name; `nonlocal name` declares they bind the name in the nearest *enclosing function* scope.

```python
count = 0

def bump():
    global count
    count += 1

def make_counter():
    n = 0
    def step():
        nonlocal n
        n += 1
        return n
    return step
```

`nonlocal` needs an existing binding in an enclosing function (not the module); `global` creates the module name if it does not exist. Both are rare in good code: a function that needs `global` to assign is usually a function that should return a value, or a piece of state that should be an object's attribute. `nonlocal` has one legitimate home — a closure that keeps a counter or accumulator — and `make_counter` above is that case.

## Closures

A closure is a function that refers to names from an enclosing function scope and keeps them alive after that scope has returned:

```python
def multiplier(factor):
    def multiply(x):
        return x * factor
    return multiply

double = multiplier(2)
triple = multiplier(3)
print(double(5), triple(5))     # 10 15
```

Each call to `multiplier` creates a new `factor` and a new `multiply` that closes over it. The captured names live in *cells* (`double.__closure__` shows them), and the closure reads the cell's *current* value each time it runs — the variable is captured, not its value at creation. That is the mechanism behind the next section, and behind decorators (Module 16), callbacks, and `functools.partial`.

## Late binding in loops

```python
adders = []
for i in range(3):
    adders.append(lambda x: x + i)

print([f(10) for f in adders])    # [12, 12, 12] — not [10, 11, 12]
```

All three lambdas close over the *same* `i`, and by the time any of them is called the loop has finished and `i` is `2`. The fixes bind the value at creation time:

```python
adders.append(lambda x, i=i: x + i)              # default argument: evaluated now
adders.append(functools.partial(lambda x, i: x + i, i=i))
adders = [multiplier_adder(i) for i in range(3)]  # a factory function: a fresh scope per call
```

The default-argument trick is the shortest and the most common; the factory is the clearest. The same trap appears with callbacks registered in a loop and with generators created in a loop (Module 11).

## The module scope and main

A script's top-level names are globals for every function in that file, which is exactly why work belongs in `main()`: names created inside `main` are locals, invisible to helpers, and a helper that accidentally uses one fails loudly instead of silently reading the wrong thing. Constants (`MAX_SIZE = 100`) at module level are the one kind of global a function may read without apology.

`globals()` and `locals()` return the current scope's names as a dict — useful for inspection, never for assignment. `del name` unbinds a local or global.

## Pitfalls

- `x += 1` in a function that meant to update a module-level `x` — `UnboundLocalError`; declare `global` or, better, return the new value.
- A closure in a loop capturing the loop variable — late binding; bind with a default argument.
- Shadowing a built-in or an outer name and reading the wrong one later.
- `nonlocal` for a name at module level (a `SyntaxError`); that is `global`.
- Relying on a global for state that should be passed in or held by an object.
- Expecting a comprehension's loop variable to be visible afterwards (it is not; a `for` loop's is).

## Key takeaways

- Names are resolved local → enclosing → global → built-in; first match wins.
- Assigning a name anywhere in a function makes it local for the whole function; reading before that assignment is `UnboundLocalError`.
- `global` binds the module name, `nonlocal` the enclosing function's; both are rare and `nonlocal` counters are the legitimate case.
- A closure captures variables, not values, and reads them when called.
- Functions built in a loop see the loop variable's final value; bind it with `i=i` or a factory.
