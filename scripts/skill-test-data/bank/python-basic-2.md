---
skill: python
level: basic
---

## python-basic-026
topic: types-operators
answer: C
run: python

What does this program print?

```python
print(2 ** 3 ** 2, -2 ** 2)
```

- A: `64 4`
- B: `512 4`
- C: `512 -4`
- D: `64 -4`

> `**` groups from the right, so `2 ** 3 ** 2` is `2 ** (3 ** 2)` = `2 ** 9` =
> 512. `**` also binds more tightly than a unary minus on its left, so
> `-2 ** 2` is `-(2 ** 2)` = -4. Writing `(-2) ** 2` would give 4.

## python-basic-027
topic: types-operators
answer: A
run: python

What does this program print?

```python
a = [1, 2]
b = [1, 2]
c = a
print(a is b, a == b, a is c)
```

- A: `False True True`
- B: `True True True`
- C: `False False True`
- D: `False True False`

> `==` compares values: both lists hold 1 and 2, so it is `True`. `is` asks
> whether two names refer to the very same object: `a` and `b` are two
> separate lists that happen to be equal, while `c = a` binds a second name to
> the list `a` already refers to.

## python-basic-028
topic: types-operators
answer: D
run: python

What does this program print?

```python
print(True + True, int(3.9), int(-3.9))
```

- A: `2 4 -4`
- B: `True 3 -3`
- C: `2 3 -4`
- D: `2 3 -3`

> `bool` is a subclass of `int` with `True` equal to 1, so `True + True` is
> the integer 2. `int()` on a float truncates towards zero — it drops the
> fractional part rather than rounding or flooring — so 3.9 becomes 3 and
> -3.9 becomes -3.

## python-basic-029
topic: control-flow
answer: B
run: python

What does this program print?

```python
n = 10
steps = 0
while n > 1:
    if n % 2 == 0:
        n //= 2
    else:
        n = 3 * n + 1
    steps += 1
print(steps)
```

- A: `5`
- B: `6`
- C: `7`
- D: `8`

> The loop body runs once per change of `n`: 10 → 5 → 16 → 8 → 4 → 2 → 1 is
> six steps. When `n` reaches 1 the condition `n > 1` is false, so the loop
> stops without another pass.

## python-basic-030
topic: control-flow
answer: A
run: python

What does this program print?

```python
for i in range(5):
    pass
print(i)
```

- A: `4`
- B: `5`
- C: `0`
- D: It raises a `NameError`.

> A `for` loop does not create its own scope: the loop variable is an
> ordinary variable that still exists after the loop and keeps the last value
> assigned to it. `range(5)` ends at 4, so `i` is 4 — it never becomes 5.

## python-basic-031
topic: control-flow
answer: C
run: python

What does this program print?

```python
count = 0
for i in range(3):
    for j in range(3):
        if j == 1:
            break
        count += 1
print(count)
```

- A: `1`
- B: `6`
- C: `3`
- D: `9`

> `break` leaves only the innermost loop it is in. For each of the three
> values of `i`, the inner loop counts `j = 0` and then breaks at `j = 1`, so
> the count is 3. 1 assumes `break` also ends the outer loop; 6 treats it like
> `continue`.

## python-basic-032
topic: strings
answer: D
run: python

What does this program print?

```python
item = "pen"
price = 4.5
qty = 3
print(f"{qty} x {item} = {price * qty:.2f}")
```

- A: `3 x pen = 13.5`
- B: `qty x item = 13.50`
- C: `3 x pen = 13`
- D: `3 x pen = 13.50`

> In an f-string each `{...}` is evaluated and its value inserted. The format
> spec `.2f` means fixed-point with exactly two digits after the decimal point
> (not two significant digits), so 13.5 is shown as `13.50`.

## python-basic-033
topic: strings
answer: B
run: python

What does this program print?

```python
s = "banana"
print(s.find("an"), s.count("a"), s.replace("na", "!"))
```

- A: `2 3 ba!!`
- B: `1 3 ba!!`
- C: `1 3 ba!na`
- D: `1 2 ba!!`

> `find` returns the index where the first match starts: "an" begins at index
> 1 (b is 0). `count("a")` counts all three a's. `replace` without a count
> argument replaces every occurrence, so both "na" become "!", leaving `ba!!`.

## python-basic-034
topic: strings
answer: C

Which expression evaluates to a new string holding the characters of the string `s` in reverse order?

- A: `s.reverse()`
- B: `reversed(s)`
- C: `s[::-1]`
- D: `s[-1:0]`

> A slice with step -1 walks the string backwards and returns a `str`.
> Strings have no `reverse()` method (that is a list method), so A raises an
> `AttributeError`. `reversed(s)` returns an iterator, not a string — you
> would need `"".join(reversed(s))`. `s[-1:0]` has the default step of +1, so
> it is empty.

## python-basic-035
topic: lists-tuples
answer: A
run: python

What does this program print?

```python
nums = [10, 20, 30, 40, 50]
print(nums[-1], nums[1:-1], nums[::-2])
```

- A: `50 [20, 30, 40] [50, 30, 10]`
- B: `50 [20, 30, 40, 50] [50, 30, 10]`
- C: `40 [20, 30, 40] [50, 30, 10]`
- D: `50 [20, 30, 40] [10, 30, 50]`

> Index -1 is the last item, 50. The slice `1:-1` starts at index 1 and stops
> before the last item. A step of -2 starts from the end and takes every
> second item going backwards: 50, 30, 10.

## python-basic-036
topic: lists-tuples
answer: B
run: python

What does this program print?

```python
grid = [[0] * 3] * 2
grid[0][0] = 1
print(grid)
```

- A: `[[1, 0, 0], [0, 0, 0]]`
- B: `[[1, 0, 0], [1, 0, 0]]`
- C: `[[1, 1, 1], [0, 0, 0]]`
- D: `[[1, 1, 1], [1, 1, 1]]`

> Multiplying a list copies references, not objects. `[0] * 3` is one inner
> list, and `* 2` makes an outer list holding that same inner list twice, so a
> change through `grid[0]` shows in `grid[1]` too. Inside the inner list the
> slots are separate, so only position 0 changes.

## python-basic-037
topic: lists-tuples
answer: D
run: python

What does this program print?

```python
nums = [3, 1, 2]
result = nums.sort()
print(result, nums)
```

- A: `[1, 2, 3] [3, 1, 2]`
- B: `[1, 2, 3] [1, 2, 3]`
- C: `None [3, 1, 2]`
- D: `None [1, 2, 3]`

> `list.sort()` sorts the list in place and returns `None`, so `result` is
> `None` and `nums` itself is now sorted. `sorted(nums)` is the function that
> returns a new sorted list and leaves the original alone.

## python-basic-038
topic: dicts-sets
answer: D
run: python

What does this program print?

```python
ages = {"ana": 30, "ben": 25}
print("ana" in ages, 30 in ages, 25 in ages.values())
```

- A: `True True True`
- B: `False False True`
- C: `True True False`
- D: `True False True`

> `in` on a dictionary tests its keys only, so `"ana" in ages` is `True` and
> `30 in ages` is `False` even though 30 is one of the values. To search the
> values you ask `ages.values()`, which does contain 25.

## python-basic-039
topic: dicts-sets
answer: A
run: python

What does this program print?

```python
nums = [3, 1, 3, 2, 1]
unique = set(nums)
unique.add(2)
unique.add(4)
print(len(unique), 3 in unique)
```

- A: `4 True`
- B: `6 True`
- C: `5 True`
- D: `4 False`

> A set keeps one copy of each value, so `set(nums)` is `{1, 2, 3}`. Adding 2
> again changes nothing; adding 4 makes four elements. 3 is still a member.

## python-basic-040
topic: dicts-sets
answer: A, C, D

Which of these can be used as a dictionary key? Select all that apply.

- A: `(1, 2)`
- B: `[1, 2]`
- C: `"id"`
- D: `3.5`
- E: `{1, 2}`

> A key must be hashable. Immutable built-ins — strings, numbers, and tuples
> whose items are themselves hashable — are. Lists and sets are mutable and
> unhashable, so using one as a key raises `TypeError: unhashable type`.

## python-basic-041
topic: functions
answer: C
run: python

What does this program print?

```python
def show(first, *rest):
    print(first, rest)

show(1, 2, 3)
```

- A: `1 [2, 3]`
- B: `1 2 3`
- C: `1 (2, 3)`
- D: `(1, 2, 3) ()`

> The first positional argument fills `first`; `*rest` collects every extra
> positional argument into a tuple (a parameter declared with `*` is always a
> tuple, even when it holds one value or none).

## python-basic-042
topic: functions
answer: B
run: python

What does this program print?

```python
def add(item, bag=[]):
    bag.append(item)
    return bag

first = add(1)
second = add(2)
print(first, second)
```

- A: `[1] [2]`
- B: `[1, 2] [1, 2]`
- C: `[1] [1, 2]`
- D: `[1, 2] [2]`

> A default value is created once, when the `def` runs, not on every call. Both
> calls without `bag` append to the same list and return it, so `first` and
> `second` are the same object, now `[1, 2]`. The usual fix is `bag=None` and
> `if bag is None: bag = []` inside the function.

## python-basic-043
topic: functions
answer: A

Which of these function headers makes Python reject the file with a `SyntaxError`? Each would be followed by an indented body.

- A: `def f(a=1, b):`
- B: `def f(a, b=1):`
- C: `def f(*args, b):`
- D: `def f(a, *args, b=2):`

> A parameter without a default may not follow one with a default, because a
> positional call could never reach it. B is the normal order. C and D are
> valid: a parameter after `*args` can only be passed by keyword, so it may
> lack a default (C) or have one (D).

## python-basic-044
topic: functions
answer: B
run: python

What does this program print?

```python
def stats(nums):
    return min(nums), max(nums)

low, high = stats([4, 9, 1])
result = stats([5])
print(low, high, result)
```

- A: `1 9 [5, 5]`
- B: `1 9 (5, 5)`
- C: `1 9 5`
- D: `4 9 (5, 5)`

> `return a, b` returns one tuple. Unpacking it into two names gives `low = 1`
> and `high = 9`; assigning it to one name keeps the tuple, `(5, 5)`, since
> the min and max of `[5]` are both 5.

## python-basic-045
topic: comprehensions
answer: C
run: python

What does this program print?

```python
print([x if x > 2 else 0 for x in range(5)])
```

- A: `[3, 4]`
- B: `[0, 0, 3, 4]`
- C: `[0, 0, 0, 3, 4]`
- D: `[0, 1, 2, 0, 0]`

> An `if ... else` before the `for` is a conditional expression that chooses
> the value for every element — it filters nothing. All five values 0–4 are
> kept; those not greater than 2 become 0. Only an `if` after the `for` would
> drop items.

## python-basic-046
topic: comprehensions
answer: D

Which expression evaluates to `{1: 1, 2: 4, 3: 9}`?

- A: `{n, n * n for n in range(1, 4)}`
- B: `[n: n * n for n in range(1, 4)]`
- C: `{n: n * n for n in range(3)}`
- D: `{n: n * n for n in range(1, 4)}`

> A dict comprehension uses braces and a `key: value` pair. A, with a comma
> instead of a colon, and B, with brackets around a colon, are both
> `SyntaxError`s. C is a valid dict comprehension, but `range(3)` is 0, 1, 2,
> so it gives `{0: 0, 1: 1, 2: 4}`.

## python-basic-047
topic: oop
answer: B
run: python

What does this program print?

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
q = p
q.x = 10
print(p.x, q.x)
```

- A: `1 10`
- B: `10 10`
- C: `10 1`
- D: `1 1`

> Assignment never copies an object. `q = p` makes `q` a second name for the
> one `Point` that was created, so setting `q.x` changes the attribute that
> `p.x` reads too.

## python-basic-048
topic: oop
answer: D

A class defines the method `def scale(self, factor):`. During the call `obj.scale(5)`, what is `self` inside the method?

- A: The class of `obj`, passed in automatically
- B: The value `5`, the first argument written in the call
- C: A copy of `obj` made for the duration of the call
- D: The object `obj` itself, passed in automatically

> Calling a method on an instance passes that instance as the first argument:
> `obj.scale(5)` runs `scale(obj, 5)`. So `self` is `obj` — not a copy, which
> is why changes made through `self` last after the call — and `factor` is 5.

## python-basic-049
topic: exceptions
answer: A
run: python

What does this program print?

```python
def parse(text):
    try:
        value = int(text)
    except ValueError:
        return "bad"
    else:
        return value * 2

print(parse("21"), parse("x"))
```

- A: `42 bad`
- B: `2121 bad`
- C: `None bad`
- D: `42 None`

> The `else` block of a `try` runs only when the `try` block raised nothing.
> `int("21")` succeeds, so `else` returns 21 * 2 = 42 (an `int`, not the string
> repeated). `int("x")` raises `ValueError`, so the `except` block returns
> `"bad"`.

## python-basic-050
topic: exceptions
answer: C
run: python

What does this program print?

```python
try:
    nums = [1, 2, 3]
    print(nums[3])
except KeyError:
    print("key")
except (IndexError, TypeError):
    print("index or type")
except Exception:
    print("other")
```

- A: `key`
- B: `other`
- C: `index or type`
- D: It stops with an `IndexError`.

> `nums[3]` is past the end of a three-item list, which raises `IndexError`.
> The `except` clauses are tried in order and only the first match runs: a
> tuple matches if the exception is any of its types. The later
> `except Exception` would also match, but it is never reached.
