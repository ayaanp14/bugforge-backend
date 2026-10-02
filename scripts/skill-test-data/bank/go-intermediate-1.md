---
skill: go
level: intermediate
---

## go-intermediate-001
topic: basics
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

const (
	A = iota * 10
	B
	_
	D
	E = "x"
	F
	G = iota
)

func main() {
	fmt.Println(A, B, D, F, G)
}
```

- A: `0 10 20 x 4`
- B: `0 10 30 x 6`
- C: `0 10 30 50 6`
- D: `0 10 30 x 0`

> `iota` is the index of the line within the `const` block, starting at 0, and
> it advances on every line — the blank identifier and the lines with explicit
> values included. A line with no expression repeats the previous expression's
> text: B and D repeat `iota * 10` (10 and 30, since `_` used up 20), and F
> repeats `"x"`, not the `iota` expression above it. G is the seventh line, so
> `iota` is 6 there.

## go-intermediate-002
topic: basics
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	var a int8 = 127
	a++
	var b uint8 = 0
	b--
	fmt.Println(a, b, -7/2, -7%2)
}
```

- A: `-128 255 -4 1`
- B: `127 0 -3 -1`
- C: It panics: integer overflow.
- D: `-128 255 -3 -1`

> Arithmetic on sized integers wraps silently at run time: 127 + 1 in an
> `int8` is -128, and 0 - 1 in a `uint8` is 255. Nothing panics and nothing
> saturates. Integer division truncates toward zero, so -7/2 is -3, and the
> remainder takes the sign of the dividend, so -7%2 is -1. (Floor division, as
> in Python, would give -4 and 1.)

## go-intermediate-003
topic: basics
answer: C

Which of these package-level declarations does not compile?

- A: `var a uint8 = 255 + 1 - 1`
- B: `var b = (1 << 100) >> 98`
- C: `var c int8 = -(-128)`
- D: `var d byte = 'A' + 25`

> Constant expressions are evaluated exactly, with no size limit, and only the
> final value has to fit the type it is given. `255 + 1 - 1` is 255, which fits
> a `uint8`; `(1 << 100) >> 98` is 4 (an untyped constant may be far larger
> than any machine type while it is being computed); `'A' + 25` is 90.
> `-(-128)` is 128, one more than an `int8` holds, so the compiler rejects it:
> the constant overflows `int8`.

## go-intermediate-004
topic: basics
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

var count = 10

func setup() {
	count, ok := 20, true
	if ok {
		count++
	}
	fmt.Print(count, " ")
}

func main() {
	setup()
	fmt.Println(count)
}
```

- A: `21 10`
- B: `21 21`
- C: It does not compile: no new variables on the left of `:=`.
- D: It does not compile: a local variable may not shadow a package-level one.

> `:=` reuses an existing variable only when that variable was declared in the
> same scope. The package-level `count` lives in an outer scope, so inside
> `setup` the statement declares a new local `count` (and `ok`). The local
> becomes 21 and is printed; the package variable is never touched and is
> still 10 in `main`. Shadowing is legal — `go vet`'s optional shadow check may
> warn, the compiler does not.

## go-intermediate-005
topic: basics
answer: B, C, D

```go
type Celsius float64
type Temp = float64

var f float64 = 1.5
```

Which of these declarations compile after the code above? Select all that apply.

- A: `var c Celsius = f`
- B: `var t Temp = f`
- C: `var c Celsius = 1.5`
- D: `var c Celsius = Celsius(f)`
- E: `var g float64 = Celsius(2)`

> `type Celsius float64` defines a new type: it has the same underlying type
> as `float64` but is a different type, so a `float64` value cannot be
> assigned to it (A) and a `Celsius` cannot be assigned to a `float64` (E)
> without an explicit conversion (D). `type Temp = float64` is an alias — just
> another name for `float64` — so B is a plain assignment. C works because
> `1.5` is an untyped constant, which can take any floating-point type.

## go-intermediate-006
topic: basics
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	x := 7.9
	y := -x
	fmt.Println(int(x), int(y), 7/2*2.0)
}
```

- A: `7 -7 7`
- B: `8 -8 6`
- C: `7 -7 6`
- D: `7 -8 7`

> Converting a float to an integer truncates toward zero: 7.9 becomes 7 and
> -7.9 becomes -7 (no rounding, no flooring). `7/2*2.0` is a constant
> expression evaluated left to right: `7/2` has two untyped integer operands,
> so it is integer division and gives 3; only then is it multiplied by `2.0`,
> giving 6.0, which `Println` prints as `6`.

## go-intermediate-007
topic: control-flow
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func grade(n int) string {
	s := ""
	switch {
	case n > 90:
		s += "A"
		fallthrough
	case n > 80:
		s += "B"
	case n > 70:
		s += "C"
		fallthrough
	default:
		s += "D"
	}
	return s
}

func main() {
	fmt.Println(grade(95), grade(75), grade(50))
}
```

- A: `AB CD D`
- B: `A C D`
- C: `ABCD CD D`
- D: `AB C D`

> A Go case ends without falling through unless it ends with `fallthrough`,
> which moves into the next clause's body without testing that clause's
> condition — and goes exactly one clause further. For 95 the first case adds
> "A" and falls into the second ("B"), which stops. For 75 the third case adds
> "C" and falls into `default` ("D"). For 50 only `default` runs.

## go-intermediate-008
topic: control-flow
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	count := 0
outer:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if j > i {
				continue outer
			}
			count += 10
		}
		count++
	}
	fmt.Println(count)
}
```

- A: `10`
- B: `60`
- C: `63`
- D: `61`

> `continue outer` starts the next iteration of the outer loop at once, so the
> `count++` after the inner loop is skipped. For i = 0 the inner loop adds 10
> and then jumps; for i = 1 it adds 20 and jumps. For i = 2, j never exceeds
> i, so the inner loop adds 30 and finishes normally, and `count++` runs once:
> 10 + 20 + 30 + 1 = 61. A plain `continue` would give 63; reading it as
> `break outer` would give 10.

## go-intermediate-009
topic: control-flow
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	n := 0
	for i := 0; i < 5; i++ {
		switch {
		case i == 2:
			break
		case i == 3:
			continue
		}
		n += i
	}
	fmt.Println(n)
}
```

- A: `1`
- B: `7`
- C: `5`
- D: `10`

> Inside a `switch`, an unlabelled `break` ends the `switch`, not the loop, so
> for i = 2 the code after the switch still runs. `continue` has no meaning
> for a switch, so it applies to the enclosing `for` and skips the rest of the
> iteration for i = 3. The sum is 0 + 1 + 2 + 4 = 7. To leave the loop from
> inside the switch you need a labelled `break`.

## go-intermediate-010
topic: control-flow
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	arr := [3]int{1, 2, 3}
	sl := []int{1, 2, 3}
	sumA, sumS := 0, 0
	for i, v := range arr {
		if i == 0 {
			arr[2] = 100
		}
		sumA += v
	}
	for i, v := range sl {
		if i == 0 {
			sl[2] = 100
		}
		sumS += v
	}
	fmt.Println(sumA, sumS)
}
```

- A: `103 103`
- B: `6 103`
- C: `6 6`
- D: `103 6`

> The range expression is evaluated once, before the loop starts. For an
> array that means a copy of the whole array: the loop reads 1, 2, 3 from the
> copy, and the write to `arr[2]` is not seen (sum 6). A slice is a small
> header pointing at a shared backing array, so copying it copies only the
> header, and the loop sees the 100 written to `sl[2]` (sum 103).

## go-intermediate-011
topic: control-flow
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func check(n int) bool {
	fmt.Print(n, " ")
	return n == 2
}

func main() {
	switch {
	case check(1), check(2), check(3):
		fmt.Println("hit")
	default:
		fmt.Println("miss")
	}
}
```

- A: `1 2 hit`
- B: `1 2 3 hit`
- C: `1 2 3 miss`
- D: `2 hit`

> A switch with no expression compares each case expression with `true`. The
> expressions in a case list are tried left to right, and the first one that
> matches selects the case — the rest are never evaluated. `check(1)` prints
> and fails, `check(2)` prints and matches, so `check(3)` is never called. A
> list is "any of these", not "all of these".

## go-intermediate-012
topic: control-flow
answer: A, C, E

Which statements about Go's `switch` are true? Select all that apply.

- A: A case does not run into the next one unless it ends with `fallthrough`.
- B: `fallthrough` tests the next case's expression and enters it only if it matches.
- C: One case may list several expressions, separated by commas.
- D: `fallthrough` may be used in a type switch.
- E: A `switch` with no expression compares each case with `true`.

> Go cases break by default (A), and a case list such as `case 1, 2, 3:`
> matches any of its values (C). A missing switch expression is the same as
> `switch true` (E). `fallthrough` transfers control to the next clause's body
> unconditionally — its condition is not evaluated (B is false) — and it is not
> permitted in a type switch at all (D is false), nor in the last clause.

## go-intermediate-013
topic: functions
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func counter() func() int {
	n := 0
	return func() int {
		n++
		return n
	}
}

func main() {
	a := counter()
	b := counter()
	a()
	a()
	fmt.Println(a(), b(), a())
}
```

- A: `3 4 5`
- B: `1 1 2`
- C: `3 1 3`
- D: `3 1 4`

> Each call to `counter` creates a new variable `n`, and the returned closure
> keeps that variable alive — so `a` and `b` each have their own count. `a`
> has been called twice already, so the arguments are `a()` = 3, `b()` = 1 and
> `a()` = 4. Function calls in an argument list are evaluated left to right.

## go-intermediate-014
topic: functions
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Counter struct{ n int }

func (c Counter) Get() int { return c.n }
func (c *Counter) Inc()    { c.n++ }

func main() {
	var c Counter
	get := c.Get
	inc := c.Inc
	inc()
	inc()
	fmt.Println(get(), c.Get())
}
```

- A: `2 2`
- B: `0 0`
- C: `0 2`
- D: `2 0`

> A method value binds its receiver when the expression is evaluated. `Get`
> has a value receiver, so `c.Get` copies `c` (n = 0) into the function value
> at that moment, and `get()` keeps returning 0. `Inc` has a pointer receiver,
> so `c.Inc` binds `&c`, and both calls increment the real `c`. Calling
> `c.Get()` afresh reads the current value, 2.

## go-intermediate-015
topic: functions
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func bump(nums ...int) {
	for i := range nums {
		nums[i] *= 10
	}
}

func main() {
	s := []int{1, 2, 3}
	bump(s...)
	bump(s[0], s[1])
	fmt.Println(s)
}
```

- A: `[1 2 3]`
- B: `[10 20 30]`
- C: `[100 200 30]`
- D: It does not compile: `s...` needs a `[]interface{}`.

> Passing `s...` hands the slice itself to the variadic parameter — no new
> slice is made — so `nums` shares `s`'s backing array and the first call
> multiplies `s` in place. A call with individual arguments builds a fresh
> slice from the values, so the second call changes only that temporary slice.
> The `...` form works for any slice whose element type matches the parameter.

## go-intermediate-016
topic: functions
answer: A

Why does this program not compile?

```go
package main

import "fmt"

func main() {
	fib := func(n int) int {
		if n < 2 {
			return n
		}
		return fib(n-1) + fib(n-2)
	}
	fmt.Println(fib(10))
}
```

- A: `fib` is not in scope inside its own initialiser.
- B: Function literals cannot call themselves in Go.
- C: A closure cannot capture a variable of function type.
- D: Recursive functions must be declared at package level.

> The scope of a variable declared with `:=` begins after the end of the
> statement, so inside the function literal `fib` is undefined. Declaring the
> variable first fixes it — `var fib func(int) int`, then
> `fib = func(n int) int { … }` — and the closure then captures the variable
> and can call itself through it.

## go-intermediate-017
topic: functions
answer: B, D

```go
f := strings.ToUpper
g := strings.ToLower
```

Which of these lines compile after the declarations above? Select all that apply.

- A: `fmt.Println(f == g)`
- B: `fmt.Println(f == nil)`
- C: `m := map[func(string) string]int{}`
- D: `var hooks []func(string) string`

> Function values are not comparable: the only comparison allowed is with
> `nil` (B), so `f == g` is rejected (A). Because a map key type must be
> comparable, a function type cannot be a map key (C). Function values can be
> stored anywhere else — in variables, struct fields and slices (D).

## go-intermediate-018
topic: functions
answer: C

What happens when you build and run this program?

```go
package main

import (
	"fmt"
	"strconv"
)

func parse(s string) (n int, err error) {
	if s != "" {
		n, err := strconv.Atoi(s)
		if err != nil {
			return
		}
		fmt.Println("parsed", n)
	}
	return
}

func main() {
	fmt.Println(parse("x"))
}
```

- A: It prints `0 strconv.Atoi: parsing "x": invalid syntax`.
- B: It prints `0 <nil>`.
- C: It does not compile: the bare `return` names shadowed results.
- D: It does not compile: `n` and `err` are declared twice in one scope.

> Inside the `if` block, `:=` declares new `n` and `err` that shadow the named
> results. A bare `return` there would return the outer, untouched results —
> almost certainly a bug — so the compiler refuses it ("result parameter n not
> in scope at return"). D is wrong because the inner variables are in a new
> block, which is exactly what makes them shadows. Use `n, err = …` or
> `return n, err`.

## go-intermediate-019
topic: slices
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	a := make([]int, 3, 10)
	b := append(a, 4)
	c := append(a, 5)
	fmt.Println(b[3], c[3], len(a), len(b))
}
```

- A: `4 5 3 4`
- B: `4 5 5 5`
- C: `5 5 5 5`
- D: `5 5 3 4`

> `a` has room for 10 elements, so neither `append` allocates: both write
> index 3 of the same backing array. The second `append` overwrites the 4
> with 5, and `b` sees it. `append` never changes the length of the slice you
> pass in — `a` stays at length 3 — it returns a new header (length 4 here).

## go-intermediate-020
topic: slices
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	base := []int{1, 2, 3, 4, 5}
	x := base[1:3]
	y := base[1:3:3]
	x = append(x, 10)
	y = append(y, 20)
	fmt.Println(base, y)
}
```

- A: `[1 2 3 10 5] [2 3 20]`
- B: `[1 2 3 20 5] [2 3 20]`
- C: `[1 2 3 4 5] [2 3 20]`
- D: `[1 2 3 10 20] [2 3 20]`

> `x` is `[2 3]` with capacity 4 (it can see up to the end of `base`), so the
> append writes 10 into `base[3]`. The full slice expression `base[1:3:3]`
> caps `y`'s capacity at 2, so appending to `y` cannot fit and copies into a
> new array — `base` is left alone. Limiting capacity this way is how you hand
> out a sub-slice that a caller's `append` cannot scribble past.

## go-intermediate-021
topic: slices
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := []int{1, 2, 3, 4, 5}
	n := copy(s[1:], s)
	fmt.Println(n, s)
}
```

- A: `5 [1 1 2 3 4]`
- B: `4 [1 1 1 1 1]`
- C: `4 [1 1 2 3 4]`
- D: `4 [2 3 4 5 5]`

> `copy` copies `min(len(dst), len(src))` elements — the destination
> `s[1:]` has length 4 — and returns that number. Source and destination may
> overlap, and `copy` handles it as if through a temporary buffer, so the
> result is the original 1, 2, 3, 4 shifted one place right, not a smear of
> 1s from an element-by-element forward copy.

## go-intermediate-022
topic: slices
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func add(s []int) {
	s = append(s, 4)
	s[0] = 100
}

func main() {
	s := make([]int, 3, 4)
	add(s)
	fmt.Println(s, len(s), s[:4][3])
}
```

- A: `[100 0 0 4] 4 4`
- B: `[0 0 0] 3 0`
- C: `[100 0 0] 3 0`
- D: `[100 0 0] 3 4`

> `add` receives a copy of the slice header that points at the caller's array.
> There is spare capacity, so `append` writes 4 into index 3 of that array and
> `s[0] = 100` writes through the same array. But the caller's header still
> says length 3, so it prints `[100 0 0]`; re-slicing up to the capacity with
> `s[:4]` reveals the 4 sitting in the shared array.

## go-intermediate-023
topic: slices
answer: B, E

`s := make([]int, 2, 5)`. Which of these expressions panic at run time? Select all that apply.

- A: `s[1:4]`
- B: `s[3]`
- C: `s[:5]`
- D: `s[2:2:5]`
- E: `s[4:]`

> Indexing is checked against the length: `s[3]` panics with index out of
> range, because the length is 2. Slicing is checked against the capacity, so
> `s[1:4]`, `s[:5]` and `s[2:2:5]` are all fine — re-slicing can reach
> elements beyond the length. `s[4:]` panics because an omitted high bound
> means `len(s)`, so it is `s[4:2]`, and the low bound may not exceed the
> high one.

## go-intermediate-024
topic: slices
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	grid := [2][2]int{{1, 2}, {3, 4}}
	g2 := grid
	g2[0][0] = 9

	rows := [][]int{{1, 2}, {3, 4}}
	r2 := make([][]int, len(rows))
	copy(r2, rows)
	r2[0][0] = 9

	fmt.Println(grid[0][0], rows[0][0])
}
```

- A: `9 9`
- B: `1 9`
- C: `1 1`
- D: `9 1`

> Arrays are values: assigning `grid` copies every element, including the
> inner arrays, so `g2` is fully independent. A `[][]int` is a slice of slice
> headers, and `copy` copies those headers — `r2[0]` and `rows[0]` point at the
> same inner array, so the write shows through. A deep copy of a slice of
> slices needs a `copy` per row.

## go-intermediate-025
topic: slices
answer: B, D

```go
s := make([]int, 0, 2)
t := append(s, 1, 2, 3)
```

Which of these does the language specification guarantee? Select all that apply.

- A: `cap(t)` is exactly 4.
- B: `len(t)` is 3.
- C: `t` shares its backing array with `s`.
- D: `cap(t)` is at least 3.

> The specification says that when the capacity is too small, `append`
> allocates a new, sufficiently large array — so `t` holds 3 elements (B) in a
> new array (C is false) whose capacity is at least its length (D). How much
> larger it grows is up to the implementation and has changed between Go
> releases; code must never depend on an exact capacity after a growth (A).
