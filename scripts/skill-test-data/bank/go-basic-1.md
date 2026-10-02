---
skill: go
level: basic
---

## go-basic-001
topic: basics
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	var count int
	var name string
	var done bool
	var ratio float64
	fmt.Printf("%d %q %t %v\n", count, name, done, ratio)
}
```

- A: `0 nil false 0`
- B: `0 "" false 0.0`
- C: `0 "" false 0`
- D: It does not compile: the variables are used before they are given a value.

> A variable declared without a value holds its type's zero value: `0` for numbers, `""` for a string, `false` for a bool. Go has no "used before assignment" error, because no variable is ever uninitialised. `%q` prints the empty string quoted as `""` (a string is never `nil`), and `%v` prints a `float64` zero as `0`, with no `.0`.

## go-basic-002
topic: basics
answer: A, C, E

Inside a function, `x := 1` has just declared `x`. Which of these lines, written next in the same block, compile? Assume every variable is used afterwards. Select all that apply.

- A: `x, y := 2, 3`
- B: `x := 2`
- C: `x = 2`
- D: `var x = 2`
- E: `y, z := x, x`

> `:=` must declare at least one new variable on its left; any others already declared in the same block are simply assigned. So A is legal (`y` is new, `x` is assigned 2) and E declares two new variables. B has no new variable on the left ("no new variables on left side of :="), and D declares `x` a second time in the same block. C is ordinary assignment. Inside an inner block, `x := 2` would compile, declaring a new `x` that shadows the outer one.

## go-basic-003
topic: basics
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

const (
	A = iota
	B
	_
	D
	E = iota * 10
	F
)

func main() {
	fmt.Println(B, D, E, F)
}
```

- A: `1 3 40 40`
- B: `1 2 30 40`
- C: `1 3 40 41`
- D: `1 3 40 50`

> `iota` is the index of the line within the `const` block, starting at 0, and the blank `_` line still takes its index. So `B` is 1, `_` is 2 and `D` is 3. `E` is on line 4, so `iota * 10` is 40. A line with no expression repeats the previous expression with its own `iota`, so `F` is `5 * 10`, which is 50, not a copy of `E`.

## go-basic-004
topic: basics
answer: A

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	items := 3
	price := 2.5
	total := items * price
	fmt.Println(total)
}
```

- A: It does not compile: `items * price` mixes `int` and `float64`.
- B: It prints `7.5`.
- C: It prints `7`, because the result is converted to `int`.
- D: It prints `6`, because `price` is converted to `int`.

> Go never converts between numeric types on its own. `items` is inferred as `int` and `price` as `float64`, and an arithmetic operator needs both operands of the same type, so the compiler reports mismatched types. Writing `float64(items) * price` makes the conversion explicit and prints `7.5`.

## go-basic-005
topic: basics
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	a, b := 7, 2
	fmt.Println(a/b, -a/b, -a%3, float64(a)/float64(b))
}
```

- A: `3 -4 2 3.5`
- B: `3 -3 -1 3.5`
- C: `3.5 -3.5 -1 3.5`
- D: `3 -3 2 3.5`

> Dividing two integers gives an integer, truncated toward zero: `7/2` is 3 and `-7/2` is -3, not -4 (Go does not round down the way Python's `//` does). The remainder takes the sign of the dividend, so `-7 % 3` is -1. Only the conversion to `float64` gives `3.5`.

## go-basic-006
topic: basics
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

const a = 5
const b int = 5

func main() {
	var f float64 = 2
	fmt.Println(a*f, b*f)
}
```

- A: It prints `10 10`.
- B: It does not compile: `a*f` mixes `int` and `float64`.
- C: It does not compile: `b*f` mixes `int` and `float64`.
- D: It does not compile: both products mix `int` and `float64`.

> `a` is an untyped constant: it has no fixed type until it is used, and in `a*f` it simply becomes a `float64`, so that product is fine. `b` was declared with the type `int`, so `b*f` multiplies an `int` by a `float64`, which is a compile error. Dropping `int` from `b`'s declaration would make the program print `10 10`.

## go-basic-007
topic: basics
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	x := 10
	inner := 0
	{
		x := 20
		x += 5
		inner = x
	}
	x++
	fmt.Println(inner, x)
}
```

- A: `25 11`
- B: `25 26`
- C: `25 21`
- D: It does not compile: `x` is declared twice.

> The braces open a new block, and `x := 20` inside it declares a second variable named `x` that shadows the outer one until the closing brace. The inner `x` becomes 25 and is copied into `inner`; the outer `x` was never touched, so `x++` takes it from 10 to 11. Redeclaring a name is only an error within the same block.

## go-basic-008
topic: basics
answer: D

Which of these declarations is not allowed at package level, outside every function?

- A: `var limit = 10`
- B: `const maxSize = 64`
- C: `var hits, misses int`
- D: `count := 0`

> The short variable declaration `:=` is a statement, and statements are only allowed inside function bodies. At package level every declaration must begin with a keyword (`var`, `const`, `type` or `func`), so `count := 0` there is a syntax error ("non-declaration statement outside function body"). The other three are ordinary package-level declarations.

## go-basic-009
topic: basics
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	f := 3.99
	g := -2.5
	fmt.Println(int(f), int(g))
}
```

- A: `3 -2`
- B: `4 -3`
- C: `3 -3`
- D: `4 -2`

> Converting a floating-point value to an integer type throws the fraction away, truncating toward zero; it never rounds. So 3.99 becomes 3 and -2.5 becomes -2 (not -3, which rounding down would give). Writing the constant directly, `int(3.99)`, would not even compile, because a constant conversion must be exact.

## go-basic-010
topic: control-flow
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	n := 7
	s := ""
	switch {
	case n > 5:
		s += "B"
		fallthrough
	case n > 100:
		s += "H"
	case n > 0:
		s += "P"
	default:
		s += "D"
	}
	fmt.Println(s)
}
```

- A: `B`
- B: `BH`
- C: `BHP`
- D: `BP`

> A `switch` with no expression runs the first case whose condition is true, and in Go that case does not fall into the next one by itself. Here `n > 5` is true, so `"B"` is added, and the explicit `fallthrough` then runs the next case's body without testing its condition: `"H"` is added even though `n > 100` is false. `fallthrough` moves one case only, so `"P"` is never added.

## go-basic-011
topic: control-flow
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	count := 0
	for i := 0; i < 5; i++ {
		switch i {
		case 2:
			break
		}
		count++
	}
	fmt.Println(count)
}
```

- A: `2`
- B: `4`
- C: `5`
- D: It does not compile: `break` must be inside a loop.

> Inside a `switch`, `break` leaves the `switch`, not the loop around it. When `i` is 2 the `break` ends the switch early, which changes nothing, and `count++` still runs on all five iterations. To leave the loop from inside a switch, label the loop (`loop: for …`) and write `break loop`.

## go-basic-012
topic: control-flow
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	sum, i := 0, 0
	for i < 10 {
		i++
		if i%3 == 0 {
			continue
		}
		sum += i
	}
	fmt.Println(sum, i)
}
```

- A: `55 10`
- B: `27 9`
- C: `37 9`
- D: `37 10`

> `for` with only a condition is Go's while loop. `i` is incremented first, so the body sees 1 to 10, and the loop stops once `i` is 10. `continue` skips the multiples of 3 (3, 6 and 9), so `sum` is 55 - 18 = 37.

## go-basic-013
topic: control-flow
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	if n := len("go"); n > 5 {
		fmt.Println("long", n)
	} else if m := n * 10; m > 15 {
		fmt.Println("medium", n, m)
	} else {
		fmt.Println("short", n, m)
	}
}
```

- A: `medium 2 20`
- B: `short 2 20`
- C: `long 2`
- D: It does not compile: `n` is not visible in the `else if`.

> A variable declared in an `if` statement's short statement is in scope for the whole statement, including every `else if` and `else` branch. `len("go")` is 2, so the first condition fails; the `else if` declares `m` as 20, which is greater than 15, so the second branch prints.

## go-basic-014
topic: control-flow
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	items := 3
	if items {
		fmt.Println("have items")
	}
}
```

- A: It prints `have items`, because a non-zero number counts as true.
- B: It prints nothing, because only `1` counts as true.
- C: It does not compile: the condition must be a `bool`.
- D: It panics at run time: an `int` is not a `bool`.

> Go has no "truthy" values. The condition of an `if` (or `for`) must be of type `bool`, so `if items` is rejected by the compiler ("non-boolean condition in if statement"). Write `if items > 0` instead.

## go-basic-015
topic: control-flow
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	day := 5
	switch day {
	case 1, 2, 3, 4, 5:
		fmt.Println("weekday")
	case 5, 6, 7:
		fmt.Println("weekend")
	}
}
```

- A: It prints `weekday`, because the first matching case wins.
- B: It prints `weekend`, because the last matching case wins.
- C: It prints `weekday` and then `weekend`.
- D: It does not compile: the value `5` appears in two cases.

> In an expression `switch`, two cases may not list the same constant value: the compiler reports a duplicate case. If the program did compile, the first matching case would run and only that one, since Go cases do not fall through. Remove `5` from one of the lists to fix it.

## go-basic-016
topic: control-flow
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	nums := []int{3, 5, 7}
	total := 0
	for i := range nums {
		total += i
	}
	fmt.Println(total)
}
```

- A: `15`
- B: `3`
- C: `6`
- D: It does not compile: `range` needs both an index and a value.

> Ranging over a slice with one variable gives the index, not the element. The loop adds 0 + 1 + 2 = 3. To get the elements, write `for _, v := range nums`, which would give 15.

## go-basic-017
topic: control-flow
answer: B, D, F

Assume `n` is an `int` variable and `s` is a `[]int`. Which of these are valid Go loops? Select all that apply.

- A: `while n > 0 { n-- }`
- B: `for n > 0 { n-- }`
- C: `do { n-- } while n > 0`
- D: `for range s { n++ }`
- E: `for (i := 0; i < n; i++) { }`
- F: `for i := 0; i < n; i++ { }`

> Go has one loop keyword, `for`, used three ways: with a condition only (B, Go's while loop), with init, condition and post statements (F), and with `range` (D, where both loop variables may be left out). There is no `while` (A) or `do … while` (C), and the three-part header is not written in parentheses (E).

## go-basic-018
topic: functions
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func stats(nums []int) (count, total int) {
	for _, n := range nums {
		if n < 0 {
			continue
		}
		count++
		total += n
	}
	return
}

func main() {
	c, t := stats([]int{4, -1, 6, 0})
	fmt.Println(c, t)
}
```

- A: `2 10`
- B: `3 10`
- C: `4 9`
- D: `0 0`

> Named results are ordinary variables that start at their zero values, and a bare `return` returns their current values, not zeros. The loop skips only the negative number, so 4, 6 and 0 are counted: `count` is 3 and `total` is 10. Zero is not negative, so it is counted.

## go-basic-019
topic: functions
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func total(base int, extra ...int) int {
	for _, e := range extra {
		base += e
	}
	return base
}

func main() {
	more := []int{3, 4}
	fmt.Println(total(1), total(1, 2), total(1, more...))
}
```

- A: `1 3 8`
- B: `1 3 7`
- C: It does not compile: `total(1)` passes nothing for `extra`.
- D: It does not compile: a slice cannot be passed to `extra`.

> A variadic parameter accepts zero or more values, so `total(1)` is legal and `extra` is simply empty: the result is 1. `total(1, 2)` gives 3. `more...` passes the slice itself as `extra`, so the result is 1 + 3 + 4 = 8.

## go-basic-020
topic: functions
answer: D

Given this function and slice, which call does not compile?

```go
func join(sep string, parts ...string) string {
	return strings.Join(parts, sep)
}

words := []string{"a", "b"}
```

- A: `join(",")`
- B: `join(",", words...)`
- C: `join(words[0], words[1:]...)`
- D: `join(",", "x", words...)`

> A slice followed by `...` must be the only argument given for the variadic parameter; it cannot be mixed with individual values. A passes no parts, B passes `words` as `parts`, and C passes `"a"` as `sep` and the slice `["b"]` as `parts`. D tries to give `"x"` and the slice together, which the compiler rejects; `append([]string{"x"}, words...)` would build one slice first.

## go-basic-021
topic: functions
answer: C
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
	fmt.Println(a(), b())
}
```

- A: `3 3`
- B: `1 1`
- C: `3 1`
- D: `2 1`

> Each call to `counter` creates a new variable `n` and returns a closure that keeps that variable alive. `a` has been called twice before the third call returns 3; `b` has its own `n`, so its first call returns 1. The two counters share nothing.

## go-basic-022
topic: functions
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	x := 1
	add := func(d int) {
		x += d
	}
	add(2)
	x *= 10
	add(5)
	fmt.Println(x)
}
```

- A: `10`
- B: `8`
- C: `30`
- D: `35`

> A closure captures the variable itself, not a copy of its value. `add(2)` makes `x` 3, `x *= 10` makes it 30, and `add(5)` reads that 30 and makes it 35. If the closure had copied `x` when it was created, the outer `x` would end as 10.

## go-basic-023
topic: functions
answer: B

You want a function that can be called both as `greet()` and as `greet("Ann")`. Which way of writing it does Go accept?

- A: `func greet(name string = "")`
- B: `func greet(names ...string)`
- C: `func greet()` and `func greet(name string)`, both in one package
- D: `func greet(name ?string)`

> Go has no default parameter values (A is a syntax error), no overloading (two functions named `greet` in one package is "greet redeclared"), and no optional-parameter syntax (D). A variadic parameter accepts zero or more arguments, so `greet()` and `greet("Ann")` both call the one function in B.

## go-basic-024
topic: functions
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func bump(n int, arr [2]int, s []int) {
	n++
	arr[0]++
	s[0]++
}

func main() {
	n := 1
	arr := [2]int{1, 1}
	s := []int{1, 1}
	bump(n, arr, s)
	fmt.Println(n, arr[0], s[0])
}
```

- A: `2 2 2`
- B: `1 2 2`
- C: `1 1 2`
- D: `1 1 1`

> Every argument is passed by value. The `int` is copied, and so is the array: an array is a value, so `bump` changes its own copy of all its elements. A slice value is also copied, but the copy refers to the same underlying array, so `s[0]++` is visible to the caller.

## go-basic-025
topic: functions
answer: A, C, D

Given `func pair() (int, string) { return 1, "x" }`, which of these statements compile? Assume any variable declared is used afterwards. Select all that apply.

- A: `a, b := pair()`
- B: `a := pair()`
- C: `fmt.Println(pair())`
- D: `a, _ := pair()`
- E: `fmt.Println("got", pair())`

> A call that returns two values must be assigned to two operands, and `_` discards one (A, D); B is an assignment mismatch. A multi-value call may also be the only argument of another call, which then receives both values, so C prints `1 x`. Mixed with other arguments, as in E, it is a "multiple-value in single-value context" error.

## go-basic-026
topic: functions
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func double(p *int) {
	*p *= 2
}

func main() {
	x := 5
	double(&x)
	p := &x
	*p += 1
	fmt.Println(x, *p == x)
}
```

- A: `6 true`
- B: `11 true`
- C: `10 true`
- D: `11 false`

> `&x` is the address of `x`, and `*p` is the variable a pointer points at. `double` receives a copy of the address, but through it changes `x` itself to 10. `p` points at `x` too, so `*p += 1` makes `x` 11, and `*p == x` compares a value with itself.
