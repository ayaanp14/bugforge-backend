---
skill: go
level: basic
---

## go-basic-053
topic: structs-methods
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Point struct {
	X, Y int
}

func main() {
	p := Point{1, 2}
	q := p
	r := &p
	q.X = 10
	r.Y = 20
	fmt.Println(p, q)
}
```

- A: `{10 20} {10 20}`
- B: `{1 2} {10 2}`
- C: `{1 20} {10 2}`
- D: `{10 20} {10 2}`

> Assigning a struct copies every field, so `q` is a separate `Point` and `q.X = 10` leaves `p` alone. `r` holds `p`'s address, and `r.Y` is shorthand for `(*r).Y`, so `r.Y = 20` changes `p` itself.

## go-basic-054
topic: structs-methods
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type User struct {
	Name string
	Age  int
}

func main() {
	u := User{Name: "Ann"}
	fmt.Printf("%v %+v\n", u, u)
}
```

- A: `{Ann 0} {Name:Ann Age:0}`
- B: `{Ann} {Name:Ann}`
- C: `{Ann 0} {Name:"Ann" Age:0}`
- D: `{"Ann" 0} {Name:Ann Age:0}`

> A field left out of a keyed struct literal holds its zero value, so `Age` is 0 and is printed like any other field. `%v` prints a struct's field values in braces; `%+v` adds each field's name. Neither puts quotes around strings; `%#v` would, printing the Go syntax `main.User{Name:"Ann", Age:0}`.

## go-basic-055
topic: structs-methods
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

type Counter struct {
	n int
}

func (c Counter) IncVal() {
	c.n++
}

func (c *Counter) IncPtr() {
	c.n++
}

func main() {
	c := Counter{}
	c.IncVal()
	c.IncPtr()
	c.IncPtr()
	c.IncVal()
	fmt.Println(c.n)
}
```

- A: `4`
- B: `0`
- C: It does not compile: `IncPtr` needs a pointer, and `c` is not one.
- D: `2`

> A method with a value receiver gets a copy of the struct, so `IncVal` increments the copy and the change is lost. A pointer receiver gets the struct's address, so `IncPtr` changes `c` itself. Calling a pointer method on an addressable variable is allowed: Go takes the address for you (`(&c).IncPtr()`). Only the two `IncPtr` calls count.

## go-basic-056
topic: structs-methods
answer: B, C, E

Given `type Point struct{ X, Y, Z int }`, which of these literals compile? Select all that apply.

- A: `Point{1, 2}`
- B: `Point{X: 1, Z: 3}`
- C: `Point{}`
- D: `Point{X: 1, 2, 3}`
- E: `Point{1, 2, 3}`

> A literal without field names must give every field, in order (E); leaving one out is "too few values" (A). With field names, any fields may be left out and take their zero values (B, and C, which is all zeros). The two styles cannot be mixed in one literal (D).

## go-basic-057
topic: structs-methods
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

type Box struct {
	W, H int
	Tag  string
}

func main() {
	b := new(Box)
	b.W = 3
	c := *b
	c.H = 4
	fmt.Println(b.W*b.H, c.W*c.H, b.Tag == "")
}
```

- A: `12 12 true`
- B: `0 12 true`
- C: `0 12 false`
- D: `0 0 true`

> `new(Box)` allocates a zero-valued `Box` and returns a pointer to it, so `b` points at `{0 0 ""}` and `b.W = 3` sets its width. `c := *b` copies the struct the pointer points at, so `c.H = 4` changes only the copy: `b`'s area is 3 * 0 and `c`'s is 3 * 4. The string field starts as `""`.

## go-basic-058
topic: structs-methods
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type Celsius float64

func (c Celsius) Fahrenheit() float64 {
	return float64(c)*9/5 + 32
}

func main() {
	fmt.Println(Celsius(100).Fahrenheit(), Celsius(-40).Fahrenheit())
}
```

- A: `212 -40`
- B: `212.0 -40.0`
- C: It does not compile: methods can only be declared on struct types.
- D: It does not compile: `Celsius(100)` is a conversion, so it has no methods.

> A method can be declared on any named type defined in the same package, not only on structs, so `Celsius` (based on `float64`) can have one. `Celsius(100)` is a value of that type, and calling a method on it is fine. `Println` prints a `float64` with no trailing `.0`, so the results print as `212` and `-40`.

## go-basic-059
topic: structs-methods
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

type Order struct {
	ID    int
	Items []string
}

func main() {
	a := Order{1, nil}
	b := Order{1, nil}
	fmt.Println(a == b)
}
```

- A: It prints `true`.
- B: It prints `false`.
- C: It does not compile: a struct with a slice field is not comparable.
- D: It panics at run time when it reaches the slice field.

> Two structs can be compared with `==` only if every field's type is comparable. A slice is not, so a struct containing one cannot be compared, and the compiler rejects `a == b`. Without the `Items` field the program would print `true`, since structs compare field by field.

## go-basic-060
topic: structs-methods
answer: B

A package named `shop` declares this type:

```go
type Item struct {
	Name  string
	price int
}
```

Code in package `main` imports `shop`. Which statement is true?

- A: It can read and set both `Name` and `price`.
- B: It can use `Name`, but `price` is only reachable inside `shop`.
- C: It can use neither field, because struct fields are private by default.
- D: It can read `price`, but it cannot set it.

> Visibility outside a package depends only on the first letter of a name. `Name` starts with an upper-case letter, so it is exported; `price` starts with a lower-case letter, so it is unexported and cannot be read or set from any other package. The same rule applies to types, functions, methods and constants.

## go-basic-061
topic: interfaces
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

type Shape interface {
	Area() float64
}

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

type Square struct{ S float64 }

func (s Square) Area() float64 { return s.S * s.S }

func main() {
	shapes := []Shape{Rect{2, 3}, Square{4}}
	total := 0.0
	for _, s := range shapes {
		total += s.Area()
	}
	fmt.Println(total)
}
```

- A: `22.0`
- B: It does not compile: neither type declares that it implements `Shape`.
- C: It does not compile: a slice cannot hold values of two different types.
- D: `22`

> A type satisfies an interface simply by having its methods; there is no `implements` keyword. `Rect` and `Square` both have `Area() float64`, so both can be stored in a `[]Shape`, and each call runs the right method: 6 + 16 = 22. `Println` prints the `float64` 22 without a `.0`.

## go-basic-062
topic: interfaces
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type Level int

func (l Level) String() string {
	switch l {
	case 0:
		return "low"
	case 1:
		return "mid"
	}
	return "high"
}

func main() {
	fmt.Println(Level(1), Level(5), int(Level(1)))
}
```

- A: `mid high 1`
- B: `1 5 1`
- C: `mid high mid`
- D: `mid 5 1`

> `Level` has a `String() string` method, so it satisfies `fmt.Stringer`, and `fmt` calls that method when it prints a `Level`: 1 gives `"mid"` and 5 falls through to `"high"`. `int(Level(1))` is a plain `int`, which has no methods, so it prints as the number 1.

## go-basic-063
topic: interfaces
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	var v interface{} = 42
	s, ok := v.(string)
	n, ok2 := v.(int)
	fmt.Printf("%q %v %d %v\n", s, ok, n, ok2)
}
```

- A: `"42" true 42 true`
- B: `"" false 0 true`
- C: `"" false 42 true`
- D: It panics: `v` does not hold a string.

> The two-result form of a type assertion never panics. When the interface holds the asserted type, it gives the value and `true` (`42`, `true`); when it does not, it gives the type's zero value and `false` (`""`, `false`). There is no conversion: the `int` 42 does not become the string `"42"`.

## go-basic-064
topic: interfaces
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func describe(v interface{}) string {
	switch x := v.(type) {
	case int:
		return fmt.Sprintf("int:%d", x*2)
	case string:
		return "str:" + x
	default:
		return "other"
	}
}

func main() {
	fmt.Println(describe(21), describe("go"), describe(1.5))
}
```

- A: `int:42 str:go other`
- B: `int:21 str:go other`
- C: `int:42 str:go int:3`
- D: It does not compile: `x` has a different type in each case.

> In a type switch, `x` takes the matched type inside each case: an `int` in the first (so `x*2` is 42) and a `string` in the second. `1.5` is a `float64`, which matches neither case, and nothing converts it, so it reaches `default`.

## go-basic-065
topic: interfaces
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

type Speaker interface {
	Speak() string
	Volume() int
}

type Dog struct{}

func (Dog) Speak() string { return "woof" }

func main() {
	var s Speaker = Dog{}
	fmt.Println(s.Speak())
}
```

- A: It prints `woof`, because `Volume` is only needed when it is called.
- B: It prints `woof`, and `s.Volume()` would return 0 if it were called.
- C: It does not compile: `Dog` has no `Volume` method, so it is not a `Speaker`.
- D: It does not compile: `Dog` must declare that it implements `Speaker`.

> A type satisfies an interface only if it has every method in the interface's method set. `Dog` has `Speak` but not `Volume`, so assigning `Dog{}` to a `Speaker` is a compile error ("missing method Volume"). No declaration of intent is needed: adding a `Volume() int` method to `Dog` is enough.

## go-basic-066
topic: interfaces
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	var x interface{} = 3
	var y interface{} = "3"
	var z interface{} = 3.0
	fmt.Printf("%T %T %T\n", x, y, z)
}
```

- A: `interface {} interface {} interface {}`
- B: `int string float64`
- C: `int string float32`
- D: `int64 string float64`

> `%T` prints the dynamic type of the value stored in the interface, not the interface type. An untyped constant stored in an interface takes its default type: `int` for an integer constant, `float64` for a floating-point one, and `string` for a string.

## go-basic-067
topic: interfaces
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	var v interface{} = "7"
	n := v.(int)
	fmt.Println(n + 1)
}
```

- A: It prints `8`.
- B: It prints `1`, because the failed assertion leaves `n` at zero.
- C: It does not compile: `v` holds a string, not an `int`.
- D: It panics at run time: the interface holds a `string`, not an `int`.

> The compiler only knows that `v` is an `interface{}`, so any type assertion on it compiles. The single-result form checks the dynamic type when it runs and panics if it does not match ("interface conversion: interface {} is string, not int"). The two-result form `n, ok := v.(int)` would set `n` to 0 and `ok` to false instead.

## go-basic-068
topic: errors
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

var trace string

func step(s string) {
	trace += s
}

func run() {
	defer step("1")
	defer step("2")
	step("3")
}

func main() {
	run()
	step("4")
	fmt.Println(trace)
}
```

- A: `3124`
- B: `3214`
- C: `1234`
- D: `3421`

> A deferred call runs when the function that deferred it returns, not when `main` ends, and deferred calls run in last-in, first-out order. So `run` adds `"3"`, then on returning runs `step("2")` and then `step("1")`. Only after `run` has returned does `main` add `"4"`.

## go-basic-069
topic: errors
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

var out string

func record(n int) {
	out += fmt.Sprint(n)
}

func work() {
	x := 1
	defer record(x)
	x = 5
	record(x)
}

func main() {
	work()
	fmt.Println(out)
}
```

- A: `55`
- B: `15`
- C: `51`
- D: `5`

> The arguments of a deferred call are evaluated when the `defer` statement runs, even though the call itself waits until the function returns. `record(x)` is deferred with `x` equal to 1, so it records 1 later. The direct call records 5 first, giving `"51"`.

## go-basic-070
topic: errors
answer: A
run: go

What does this program print?

```go
package main

import (
	"fmt"
	"strconv"
)

func sumAll(xs []string) (int, error) {
	total := 0
	for _, x := range xs {
		n, err := strconv.Atoi(x)
		if err != nil {
			return total, err
		}
		total += n
	}
	return total, nil
}

func main() {
	t, err := sumAll([]string{"4", "5", "x", "6"})
	fmt.Println(t, err != nil)
}
```

- A: `9 true`
- B: `15 true`
- C: `0 true`
- D: `15 false`

> `strconv.Atoi` reports failure by returning a non-nil error, not by panicking. The loop adds 4 and 5, then `"x"` fails to parse, and the function returns at once with the total so far (9) and that error. `"6"` is never reached.

## go-basic-071
topic: errors
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

type NotFound struct {
	Key string
}

func (e NotFound) Error() string {
	return "missing " + e.Key
}

func find(m map[string]int, k string) (int, error) {
	v, ok := m[k]
	if !ok {
		return 0, NotFound{k}
	}
	return v, nil
}

func main() {
	_, err := find(map[string]int{"a": 1}, "b")
	v, err2 := find(map[string]int{"a": 1}, "a")
	fmt.Println(err, v, err2)
}
```

- A: `{b} 1 <nil>`
- B: `missing b 1 nil`
- C: `missing b 0 <nil>`
- D: `missing b 1 <nil>`

> `error` is an interface with one method, `Error() string`, so any type with that method can be returned as an error. When `fmt` prints an error it calls `Error()`, giving `missing b`. The successful lookup returns 1 and a nil error, which `fmt` prints as `<nil>`.

## go-basic-072
topic: errors
answer: A

By Go convention, how does a function that can fail report the failure to its caller?

- A: It returns an `error` as its last result, `nil` on success.
- B: It returns an `error` as its first result, `nil` on success.
- C: It throws an exception, which the caller catches with `try`.
- D: It sets a package-level error variable for the caller to check.

> Errors in Go are ordinary values. A function that can fail returns an `error` as its last result (`func Open(name string) (*File, error)`), and the caller checks `if err != nil` straight after the call. Go has no exceptions and no `try`; `panic` is kept for bugs and situations a program cannot recover from.

## go-basic-073
topic: errors
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

func div(a, b int) int {
	return a / b
}

func main() {
	fmt.Println(div(1, 0))
}
```

- A: It prints `0`.
- B: It prints `+Inf`.
- C: It panics at run time: integer divide by zero.
- D: It does not compile: the program divides by zero.

> Integer division by zero panics at run time ("integer divide by zero"). The compiler only rejects a division whose divisor is the constant zero, such as `1 / 0`; here `b` is a parameter, so the program compiles. Floating-point division by zero is different: it gives `+Inf`.

## go-basic-074
topic: errors
answer: B

What happens when you build and run this program?

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	n, err := strconv.Atoi("5")
	fmt.Println(n)
}
```

- A: It prints `5`.
- B: It does not compile: `err` is declared and not used.
- C: It prints `5 <nil>`.
- D: It panics at run time, because the error is never checked.

> A local variable that is declared and never used is a compile error in Go, and `err` is never read here. Either check it (`if err != nil { … }`) or discard it explicitly with the blank identifier: `n, _ := strconv.Atoi("5")`.

## go-basic-075
topic: errors
answer: D
run: go

What does this program print?

```go
package main

import (
	"errors"
	"fmt"
	"strings"
)

var steps []string

func load(name string) error {
	steps = append(steps, "open")
	defer func() {
		steps = append(steps, "close")
	}()
	if name == "" {
		return errors.New("no name")
	}
	steps = append(steps, "read")
	return nil
}

func main() {
	err1 := load("a.txt")
	err2 := load("")
	fmt.Println(strings.Join(steps, ","), err1, err2)
}
```

- A: `open,read,close,open <nil> no name`
- B: `open,close,read,open,close <nil> no name`
- C: `open,read,close,open,close nil no name`
- D: `open,read,close,open,close <nil> no name`

> A deferred call runs however the function returns, including an early `return` with an error, which is why cleanup is deferred right after the resource is acquired. Each `load` adds `"close"` last; the second returns before `"read"`. A nil error prints as `<nil>`, and an `errors.New` error prints its message.
