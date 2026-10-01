---
skill: python
level: basic
---

## python-basic-001
topic: types-operators
answer: B
run: python

What does this program print?

```python
print(-7 // 2, -7 % 2)
```

- A: `-3 -1`
- B: `-4 1`
- C: `-3 1`
- D: `-4 -1`

> `//` is floor division: it rounds towards negative infinity, so -3.5 becomes
> -4, not -3. `%` is defined so that `(a // b) * b + a % b == a`, which makes
> the remainder take the sign of the divisor: -7 - (2 * -4) = 1.

## python-basic-002
topic: types-operators
answer: C
run: python

What does this program print?

```python
a = 10 / 5
b = 10 // 5
print(a, b)
```

- A: `2 2`
- B: `2.0 2.0`
- C: `2.0 2`
- D: `2 2.0`

> In Python 3, `/` is true division and always returns a `float`, even when
> the result is a whole number, so `a` is `2.0`. `//` on two `int`s returns an
> `int`, so `b` is `2`.

## python-basic-003
topic: types-operators
answer: B, D, E

Which of these values are falsy, i.e. treated as false by an `if` statement? Select all that apply.

- A: `" "`
- B: `0.0`
- C: `"False"`
- D: `[]`
- E: `None`

> Zero of any numeric type (`0.0`), empty containers (`[]`) and `None` are
> falsy. A string is falsy only when it is empty: `" "` holds a space and
> `"False"` holds five letters, so both are truthy — the text of a string is
> never inspected.

## python-basic-004
topic: control-flow
answer: A
run: python

What does this program print?

```python
total = 0
for n in range(1, 10):
    if n % 3 == 0:
        continue
    if n > 7:
        break
    total += n
print(total)
```

- A: `19`
- B: `27`
- C: `28`
- D: `3`

> `continue` skips the rest of the body for 3 and 6 but keeps looping; `break`
> leaves the loop when n reaches 8. So the sum is 1 + 2 + 4 + 5 + 7 = 19.
> 27 ignores the `break`, 28 ignores the `continue`, and 3 treats `continue`
> as if it ended the loop.

## python-basic-005
topic: control-flow
answer: D
run: python

What does this program print?

```python
for n in [3, 5, 8, 9]:
    if n % 2 == 0:
        print(n, end=" ")
        break
else:
    print("odd", end=" ")
print("done")
```

- A: `8 odd done`
- B: `odd done`
- C: `done`
- D: `8 done`

> The `else` of a `for` loop runs only when the loop finishes without hitting
> `break`. Here 8 is even, so the loop prints `8 ` and breaks, the `else`
> block is skipped, and the final `print` adds `done`.

## python-basic-006
topic: control-flow
answer: B

Which call to `range` produces exactly the numbers 10, 7, 4, 1, in that order?

- A: `range(10, 1, -3)`
- B: `range(10, 0, -3)`
- C: `range(10, 1, 3)`
- D: `range(1, 10, 3)`

> The stop value is never included. `range(10, 0, -3)` counts down while the
> value is greater than 0: 10, 7, 4, 1. `range(10, 1, -3)` stops before 1, so
> it gives only 10, 7, 4. A positive step from 10 to 1 gives nothing, and
> `range(1, 10, 3)` counts up: 1, 4, 7.

## python-basic-007
topic: strings
answer: D
run: python

What does this program print?

```python
s = "python"
print(s[1:4], s[-2:], s[::2])
```

- A: `ytho on pto`
- B: `yth on yhn`
- C: `yth n pto`
- D: `yth on pto`

> A slice includes its start and excludes its stop: `s[1:4]` is indices 1, 2,
> 3, i.e. `yth`. `s[-2:]` is the last two characters, `on`. `s[::2]` takes
> every second character from index 0: p, t, o.

## python-basic-008
topic: strings
answer: A

What happens when this program runs?

```python
s = "hello"
s[0] = "J"
print(s)
```

- A: It raises a `TypeError`.
- B: It prints `Jello`.
- C: It prints `hello`.
- D: It raises an `IndexError`.

> Strings are immutable: `str` does not support item assignment, so the
> second line raises `TypeError: 'str' object does not support item
> assignment` and the `print` is never reached. Index 0 exists, so it is not
> an `IndexError`. To change a letter you build a new string, e.g.
> `"J" + s[1:]`.

## python-basic-009
topic: strings
answer: C
run: python

What does this program print?

```python
s = "  Data,Science  "
print(s.strip().lower().split(","))
```

- A: `('data', 'science')`
- B: `['data,science']`
- C: `['data', 'science']`
- D: `['data', ',', 'science']`

> Each method returns a new string and the calls run left to right: `strip()`
> removes the outer spaces, `lower()` lower-cases the result, and
> `split(",")` cuts it at the comma. The separator itself is dropped, and
> `split` always returns a list, not a tuple.

## python-basic-010
topic: lists-tuples
answer: D
run: python

What does this program print?

```python
a = [1, 2, 3]
b = a
b.append(4)
c = a[:]
c.append(5)
print(len(a), len(b), len(c))
```

- A: `3 4 5`
- B: `3 4 4`
- C: `5 5 5`
- D: `4 4 5`

> `b = a` does not copy: both names refer to the same list, so appending 4
> through `b` changes `a` too (length 4 each). `a[:]` makes a new list holding
> the four items, so appending 5 to `c` leaves `a` and `b` alone.

## python-basic-011
topic: lists-tuples
answer: A
run: python

What does this program print?

```python
x = [1, 2]
x.append([3, 4])
x.extend([5, 6])
print(len(x), x[2])
```

- A: `5 [3, 4]`
- B: `6 3`
- C: `4 [3, 4]`
- D: `5 3`

> `append` adds its argument as one element, so the list `[3, 4]` becomes a
> single item at index 2. `extend` adds each element of its argument
> separately. The list is `[1, 2, [3, 4], 5, 6]`: five items.

## python-basic-012
topic: lists-tuples
answer: C

Which expression evaluates to a tuple containing exactly one element, the integer `5`?

- A: `(5)`
- B: `tuple(5)`
- C: `(5,)`
- D: `[5]`

> It is the comma that makes a tuple. `(5)` is just the integer 5 in
> parentheses. `tuple(5)` raises a `TypeError` because `tuple()` needs an
> iterable and an `int` is not one. `[5]` is a list.

## python-basic-013
topic: lists-tuples
answer: B
run: python

What does this program print?

```python
first, *rest = [10, 20, 30, 40]
print(first, rest)
```

- A: `10 (20, 30, 40)`
- B: `10 [20, 30, 40]`
- C: `10 20`
- D: `[10] [20, 30, 40]`

> In an unpacking assignment the starred name collects every value not taken
> by the other names, and it is always a list, whatever was unpacked. `first`
> gets the single value 10.

## python-basic-014
topic: dicts-sets
answer: A
run: python

What does this program print?

```python
stock = {"apple": 3, "pear": 0}
print(stock.get("pear", 5), stock.get("plum"), stock.get("plum", 1))
```

- A: `0 None 1`
- B: `5 None 1`
- C: `0 0 1`
- D: It raises a `KeyError`.

> `get` returns the stored value when the key exists — `"pear"` maps to 0, and
> a falsy value is still a value, so the default 5 is not used. For a missing
> key it returns the default, which is `None` when none is given. `get` never
> raises `KeyError`; only `stock["plum"]` would.

## python-basic-015
topic: dicts-sets
answer: D
run: python

What does this program print?

```python
d = {}
d["b"] = 1
d["a"] = 2
d["c"] = 3
d["b"] = 4
print(list(d))
```

- A: `['a', 'b', 'c']`
- B: `['a', 'c', 'b']`
- C: `[4, 2, 3]`
- D: `['b', 'a', 'c']`

> Dictionaries keep keys in insertion order (guaranteed since Python 3.7) and
> are not sorted. Assigning to a key that already exists changes its value
> but not its position, so `"b"` stays first. `list(d)` lists the keys, not
> the values.

## python-basic-016
topic: dicts-sets
answer: C

Given `a = {1, 2, 3, 4}` and `b = {3, 4, 5}`, which expression evaluates to `{1, 2, 5}`?

- A: `a & b`
- B: `a | b`
- C: `a ^ b`
- D: `a - b`

> `^` is the symmetric difference: the elements in exactly one of the two
> sets, here 1, 2 and 5. `a & b` is the intersection `{3, 4}`, `a | b` the
> union `{1, 2, 3, 4, 5}`, and `a - b` only what `a` has that `b` lacks,
> `{1, 2}`.

## python-basic-017
topic: functions
answer: B
run: python

What does this program print?

```python
def add_tax(price, rate=0.5):
    total = price + price * rate

print(add_tax(10))
```

- A: `15.0`
- B: `None`
- C: `15`
- D: It prints an empty line.

> The function computes `total` but never returns it. A function that ends
> without a `return` statement returns `None`, and `print(None)` prints the
> word `None`.

## python-basic-018
topic: functions
answer: A
run: python

What does this program print?

```python
def describe(a, b=2, c=3):
    return a * 100 + b * 10 + c

print(describe(1, c=5), describe(4, 5))
```

- A: `125 453`
- B: `153 453`
- C: `125 425`
- D: `153 425`

> A keyword argument goes to the parameter it names, so `describe(1, c=5)` is
> a=1, b=2 (default), c=5: 125. Positional arguments fill parameters left to
> right, so `describe(4, 5)` is a=4, b=5, c=3 (default): 453.

## python-basic-019
topic: functions
answer: D

Given the definition below, which call is an error?

```python
def f(a, b, c=0):
    return a + b + c
```

- A: `f(1, 2)`
- B: `f(1, b=2)`
- C: `f(1, 2, c=3)`
- D: `f(a=1, 2)`

> A positional argument may not follow a keyword argument in a call, so
> `f(a=1, 2)` is a `SyntaxError`. The others are fine: `c` has a default, and
> passing `b` by keyword after a positional `a` is allowed.

## python-basic-020
topic: comprehensions
answer: C
run: python

What does this program print?

```python
nums = [1, 2, 3, 4, 5, 6]
print([n * n for n in nums if n % 2 == 0])
```

- A: `[1, 9, 25]`
- B: `[2, 4, 6]`
- C: `[4, 16, 36]`
- D: `[1, 4, 9, 16, 25, 36]`

> The `if` clause keeps only the even numbers 2, 4 and 6, and the expression
> before `for` squares each one that is kept.

## python-basic-021
topic: comprehensions
answer: B
run: python

What does this program print?

```python
words = ["hi", "hey", "yo"]
print({w: len(w) for w in words})
```

- A: `{2: 'yo', 3: 'hey'}`
- B: `{'hi': 2, 'hey': 3, 'yo': 2}`
- C: `[('hi', 2), ('hey', 3), ('yo', 2)]`
- D: `{'hi': 2, 'yo': 2, 'hey': 3}`

> A dict comprehension builds `key: value` pairs, here each word mapped to its
> length. Two keys may share a value, and the dict keeps the order the keys
> were inserted in — the order of `words`, not sorted by value.

## python-basic-022
topic: oop
answer: D
run: python

What does this program print?

```python
class Counter:
    def __init__(self, start):
        self.count = start

    def tick(self):
        self.count += 1
        return self.count

a = Counter(5)
b = Counter(5)
a.tick()
a.tick()
print(a.count, b.tick())
```

- A: `7 8`
- B: `6 6`
- C: `5 6`
- D: `7 6`

> `self.count` is an instance attribute: each object made by `Counter(5)` has
> its own. Ticking `a` twice takes it to 7 and does not touch `b`, whose one
> tick takes it from 5 to 6.

## python-basic-023
topic: oop
answer: A

What happens when this program runs?

```python
class Dog:
    def __init__(self, name):
        self.name = name

    def speak():
        return "Woof"

d = Dog("Rex")
print(d.speak())
```

- A: It raises a `TypeError`.
- B: It prints `Woof`.
- C: It raises an `AttributeError`.
- D: It raises a `NameError`.

> Calling a method through an instance passes the instance as the first
> argument, so `d.speak()` calls `speak(d)`. `speak` was defined with no
> parameters, so Python raises `TypeError: speak() takes 0 positional
> arguments but 1 was given`. The method exists, so it is not an
> `AttributeError`.

## python-basic-024
topic: exceptions
answer: C
run: python

What does this program print?

```python
try:
    n = int("12a")
    print("ok", end=" ")
except ValueError:
    print("bad", end=" ")
finally:
    print("end")
```

- A: `ok bad end`
- B: `bad`
- C: `bad end`
- D: `ok end`

> `int("12a")` raises `ValueError`, so the rest of the `try` block (the `ok`
> print) is skipped and the matching `except` runs. `finally` runs whether or
> not an exception happened, so `end` follows.

## python-basic-025
topic: exceptions
answer: A, C

Which of these expressions raise a `TypeError`? Select all that apply.

- A: `"3" + 3`
- B: `int("3.5")`
- C: `len(5)`
- D: `[1, 2][2]`
- E: `"abc" * 2`

> `"3" + 3` mixes `str` and `int`, which `+` does not allow, and `len(5)` asks
> for the length of an `int`, which has none: both are `TypeError`.
> `int("3.5")` has the right type but a value `int` cannot parse
> (`ValueError`), `[1, 2][2]` is past the end (`IndexError`), and
> `"abc" * 2` is valid — it gives `"abcabc"`.
