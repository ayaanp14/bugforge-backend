---
skill: go
level: intermediate
---

## go-intermediate-026
topic: maps
answer: B

What happens when you build and run this program?

```go
package main

import "fmt"

type User struct {
	Name string
	Age  int
}

func main() {
	users := map[string]User{"ann": {"Ann", 30}}
	users["ann"].Age++
	fmt.Println(users["ann"].Age)
}
```

- A: It prints `31`.
- B: It does not compile: you cannot assign to a field of a map element.
- C: It prints `30`: the index returns a copy and the increment is lost.
- D: It panics: map elements are not addressable at run time.

> Map elements are not addressable — the map may move them as it grows — so
> the compiler rejects any assignment to a field of `users["ann"]` ("cannot
> assign to struct field users["ann"].Age in map"). It is a compile-time rule,
> not a silent copy and not a run-time failure. Either read, modify and store
> back (`u := users["ann"]; u.Age++; users["ann"] = u`) or keep pointers in the
> map (`map[string]*User`).

## go-intermediate-027
topic: maps
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func fill(m map[string]int) {
	m["a"] = 1
	m = map[string]int{"b": 2}
	m["c"] = 3
}

func main() {
	m := map[string]int{}
	fill(m)
	fmt.Println(len(m), m)
}
```

- A: `0 map[]`
- B: `2 map[b:2 c:3]`
- C: `3 map[a:1 b:2 c:3]`
- D: `1 map[a:1]`

> A map value is a reference to the map's data, and the parameter is a copy of
> that reference: writing through it (`m["a"] = 1`) changes the caller's map.
> Assigning a new map to the parameter only repoints the local copy, so "b"
> and "c" go into a map the caller never sees. `fmt` prints maps with their
> keys sorted.

## go-intermediate-028
topic: maps
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Counter struct{ N int }

func main() {
	byValue := map[string]Counter{"a": {1}}
	byPointer := map[string]*Counter{"a": {1}}

	c := byValue["a"]
	c.N++
	p := byPointer["a"]
	p.N++

	fmt.Println(byValue["a"].N, byPointer["a"].N)
}
```

- A: `2 2`
- B: `1 1`
- C: `1 2`
- D: `2 1`

> Indexing a map returns a copy of the element. For `map[string]Counter` that
> copy is a whole struct, so `c.N++` changes `c` and the map still holds `N`
> = 1. For `map[string]*Counter` the copy is a pointer to the one `Counter`,
> so `p.N++` changes the value the map points at. (In a map literal whose
> element type is `*Counter`, `{1}` is short for `&Counter{1}`.) Storing
> pointers is the usual way to update elements in place; with values, read
> the element, change it and assign it back.

## go-intermediate-029
topic: maps
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	groups := map[bool][]int{}
	for _, n := range []int{1, 2, 3, 4, 5} {
		even := n%2 == 0
		groups[even] = append(groups[even], n)
	}
	v, ok := groups[true]
	counts := map[string]int{"z": 0}
	_, hasZ := counts["z"]
	_, hasY := counts["y"]
	fmt.Println(v, ok, len(groups[false]), hasZ, hasY)
}
```

- A: `[2 4] true 3 false false`
- B: `[] false 0 true false`
- C: `[2 4] true 3 true false`
- D: It panics: `groups[even]` is a nil slice the first time.

> A missing key reads as the zero value — a nil slice here — and `append` on a
> nil slice works, so storing the result back builds each group. The second
> result of the comma-ok form says whether the key is present, which is
> different from whether the value is zero: "z" is present with value 0
> (true), "y" is absent (false).

## go-intermediate-030
topic: maps
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	m := map[int]bool{1: true, 2: true, 3: true, 4: true}
	for k := range m {
		if k%2 == 0 {
			delete(m, k)
		}
	}
	fmt.Println(len(m), m)
}
```

- A: `4 map[1:true 2:true 3:true 4:true]`
- B: `2 map[1:true 3:true]`
- C: `2 map[2:true 4:true]`
- D: It crashes: concurrent map iteration and map write.

> Deleting entries during a `range` over the same map is explicitly allowed:
> an entry removed before it is reached is simply not produced, and removing
> the current one is safe. Every even key is deleted when it is visited,
> whatever the iteration order. The "concurrent map iteration and map write"
> crash is for a write from another goroutine, not from the loop itself.

## go-intermediate-031
topic: maps
answer: A, C, F

Which of these types compile as the key type of a map? Select all that apply.

- A: `[2]int`
- B: `[]int`
- C: `struct{ X, Y int }`
- D: `map[string]int`
- E: `func() int`
- F: `interface{}`

> A key type must support `==`. Arrays of comparable elements and structs
> whose fields are all comparable qualify. Slices, maps and functions do not
> support `==`, so they cannot be keys. An interface type is comparable and
> compiles as a key type; the catch comes at run time — inserting a key whose
> dynamic type is not comparable (say, a slice in an `interface{}`) panics.

## go-intermediate-032
topic: strings
answer: D
run: go

What does this program print?

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	s := "héllo"
	sum := 0
	for i := range s {
		sum += i
	}
	fmt.Println(len(s), utf8.RuneCountInString(s), sum)
}
```

- A: `5 5 10`
- B: `6 5 10`
- C: `6 6 15`
- D: `6 5 13`

> `len` of a string counts bytes, and "é" is two bytes in UTF-8, so the length
> is 6 while there are 5 runes. `range` over a string steps rune by rune and
> yields each rune's starting byte index: 0, 1, 3, 4, 5 — the index jumps from
> 1 to 3 over the two-byte "é". Their sum is 13.

## go-intermediate-033
topic: strings
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := "naïve"
	r := []rune(s)
	fmt.Println(len(s), len(r), string(r[2]), s[2])
}
```

- A: `6 5 ï 195`
- B: `5 5 ï 239`
- C: `6 5 ï 239`
- D: `6 6 ï 195`

> "ï" is U+00EF, encoded in UTF-8 as the two bytes 0xC3 0xAF, so the string is
> 6 bytes and 5 runes. Converting to `[]rune` decodes it, so `r[2]` is the
> whole character. Indexing a string directly gives a byte, not a character:
> `s[2]` is the first byte of "ï", 0xC3 = 195. 239 is the code point (0xEF),
> which only the rune holds.

## go-intermediate-034
topic: strings
answer: B, C, D

`s := "hello"`. Which of these compile and leave `s` equal to `"Hello"`? Select all that apply.

- A: `s[0] = 'H'`
- B: `b := []byte(s); b[0] = 'H'; s = string(b)`
- C: `s = "H" + s[1:]`
- D: `s = strings.Replace(s, "h", "H", 1)`
- E: `p := &s[0]; *p = 'H'`

> Strings are immutable: a string's bytes cannot be assigned (A) and you
> cannot take the address of one (E) — both are compile errors. Every working
> approach builds a new string and assigns it to `s`: converting to `[]byte`
> copies the bytes into a mutable slice and converting back copies them again
> (B); concatenation (C) and `strings.Replace` (D) return new strings.

## go-intermediate-035
topic: strings
answer: C
run: go

What does this program print?

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	a := strings.Split("a,b,,c,", ",")
	b := strings.Fields("  a b   c ")
	c := strings.Split("", ",")
	fmt.Println(len(a), len(b), len(c))
}
```

- A: `3 3 0`
- B: `5 3 0`
- C: `5 3 1`
- D: `4 3 1`

> `Split` keeps empty fields: "a,b,,c," has four separators and so five parts —
> "a", "b", "", "c", "". `Fields` splits on runs of white space and drops the
> empty strings, giving three. Splitting an empty string by a non-empty
> separator returns a slice holding one empty string, not an empty slice — a
> common surprise when parsing an empty line.

## go-intermediate-036
topic: strings
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := string([]byte{'A', 0xff, 'B'})
	for _, r := range s {
		fmt.Print(r, " ")
	}
	fmt.Println(len(s))
}
```

- A: `65 255 66 3`
- B: `65 65533 66 3`
- C: `65 66 2`
- D: It panics: the string is not valid UTF-8.

> A Go string may hold any bytes; nothing checks them on conversion. When
> `range` decodes a byte that is not valid UTF-8, it yields
> `utf8.RuneError` (U+FFFD, 65533) for that one byte and moves on — it neither
> panics nor skips it. `len` still counts the three bytes.

## go-intermediate-037
topic: strings
answer: B, D, E

Which of these expressions evaluate to the string `"65"`? Select all that apply.

- A: `string(rune(65))`
- B: `strconv.Itoa(65)`
- C: `string(byte(65))`
- D: `fmt.Sprint(65)`
- E: `strconv.FormatInt(65, 10)`

> Converting an integer type to `string` does not format the number; it
> treats the value as a code point, so both A and C give "A". Formatting a
> number as decimal text is `strconv.Itoa`, `strconv.FormatInt` with base 10,
> or `fmt.Sprint`.

## go-intermediate-038
topic: structs-methods
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type Account struct{ balance int }

func (a Account) DepositV(n int)  { a.balance += n }
func (a *Account) DepositP(n int) { a.balance += n }

func main() {
	var acc Account
	acc.DepositV(10)
	acc.DepositP(5)
	p := &acc
	p.DepositV(100)
	p.DepositP(1)
	fmt.Println(acc.balance)
}
```

- A: `6`
- B: `16`
- C: `106`
- D: `116`

> A value receiver works on a copy, so `DepositV` changes nothing the caller
> can see — whether it is called on the value or through a pointer (Go
> dereferences `p` and copies `*p`). A pointer receiver changes the original,
> and `acc.DepositP(5)` is legal because `acc` is addressable: Go takes
> `&acc` for you. Only the 5 and the 1 stick.

## go-intermediate-039
topic: structs-methods
answer: A, C, E

```go
type Counter struct{ n int }

func (c *Counter) Inc() { c.n++ }

var c Counter
arr := [2]Counter{}
s := []Counter{{}}
m := map[string]Counter{"a": {}}
```

Which of these calls compile? Select all that apply.

- A: `c.Inc()`
- B: `m["a"].Inc()`
- C: `s[0].Inc()`
- D: `Counter{}.Inc()`
- E: `arr[1].Inc()`

> Calling a pointer method on a value needs the value to be addressable, so
> that Go can take its address. Variables (A), elements of an addressable
> array (E) and slice elements (C) are addressable. A map element is not (B),
> and neither is a composite literal used directly as a value (D) — the
> compiler reports "cannot call pointer method Inc on Counter".

## go-intermediate-040
topic: structs-methods
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

type Left struct{ X int }
type Right struct{ X int }

type Pair struct {
	Left
	Right
}

func main() {
	p := Pair{Left{1}, Right{2}}
	fmt.Println(p.X)
}
```

- A: It prints `1`: the first embedded field wins.
- B: It prints `2`: the last embedded field wins.
- C: It prints `0`: neither promoted field is used.
- D: It does not compile: `p.X` is an ambiguous selector.

> Fields of embedded structs are promoted, but when two of them at the same
> depth have the same name, neither is promoted and using the short name is a
> compile error ("ambiguous selector p.X"). Declaring `Pair` is fine; only the
> ambiguous use fails. Name the path instead: `p.Left.X` or `p.Right.X`. A
> field declared directly in `Pair` would sit at a shallower depth and win.

## go-intermediate-041
topic: structs-methods
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Animal struct{}

func (Animal) Sound() string   { return "..." }
func (a Animal) Speak() string { return "says " + a.Sound() }

type Dog struct{ Animal }

func (Dog) Sound() string { return "woof" }

func main() {
	d := Dog{}
	fmt.Println(d.Sound(), "|", d.Speak())
}
```

- A: `woof | says woof`
- B: `... | says ...`
- C: `woof | says ...`
- D: It does not compile: `Dog` has two `Sound` methods.

> `Dog`'s own `Sound` shadows the promoted one, so `d.Sound()` is "woof". But
> `d.Speak()` is `Animal.Speak` called on the embedded `Animal` value, and
> inside it `a.Sound()` is `Animal.Sound` — embedding is not inheritance, and
> there is no virtual dispatch back to the outer type. To get "says woof",
> `Speak` would have to call `Sound` through an interface.

## go-intermediate-042
topic: structs-methods
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

type Config struct {
	Name string
	Tags []string
	Port *int
}

func main() {
	port := 80
	a := Config{Name: "a", Tags: []string{"x"}, Port: &port}
	b := a
	b.Name = "b"
	b.Tags[0] = "y"
	*b.Port = 8080
	fmt.Println(a.Name, a.Tags[0], *a.Port)
}
```

- A: `b y 8080`
- B: `a y 8080`
- C: `a x 80`
- D: `a x 8080`

> Assigning a struct copies each field, and the copy is shallow. `Name` is
> copied, so changing `b.Name` leaves `a` alone. `Tags` is a slice header and
> `Port` a pointer: the copies point at the same backing array and the same
> `int`, so writes through `b` show up in `a`. A real deep copy has to clone
> the slice and the pointed-to value by hand.

## go-intermediate-043
topic: structs-methods
answer: B, D

```go
type IntList []int
type Point struct{ X, Y int }
```

In the same package as the types above, which of these method declarations compile? Select all that apply.

- A: `func (n int) Double() int { return n * 2 }`
- B: `func (l IntList) Sum() int { return len(l) }`
- C: `func (pp **Point) Reset() { *pp = nil }`
- D: `func (p *Point) Move(dx int) { p.X += dx }`
- E: `func (d time.Duration) Days() float64 { return d.Hours() / 24 }`

> A receiver's base type must be a defined type declared in the same package,
> used as `T` or `*T`. `IntList` and `*Point` qualify — any defined type can
> have methods, slices included. `int` and `time.Duration` are declared
> elsewhere ("cannot define new methods on non-local type"), and `**Point` is
> not a valid receiver: only one level of pointer is allowed.

## go-intermediate-044
topic: interfaces
answer: A, B, D

```go
type Namer interface{ Name() string }
type Renamer interface{ Rename(string) }

type User struct{ name string }

func (u User) Name() string      { return u.name }
func (u *User) Rename(n string) { u.name = n }
```

Which of these declarations compile? Select all that apply.

- A: `var a Namer = User{}`
- B: `var b Namer = &User{}`
- C: `var c Renamer = User{}`
- D: `var d Renamer = &User{}`

> The method set of `User` holds only the value-receiver methods (`Name`); the
> method set of `*User` holds both. So `User` satisfies `Namer`, `*User`
> satisfies both interfaces, and a `User` value does not satisfy `Renamer`
> ("Rename method has pointer receiver"). The rule exists because a value
> stored in an interface is not addressable, so a pointer method could not be
> called on it.

## go-intermediate-045
topic: interfaces
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type MyErr struct{}

func (*MyErr) Error() string { return "boom" }

func check(fail bool) error {
	var e *MyErr
	if fail {
		e = &MyErr{}
	}
	return e
}

func main() {
	var p *MyErr
	var err error = p
	fmt.Println(p == nil, err == nil, check(false) == nil)
}
```

- A: `true false false`
- B: `true true true`
- C: `true true false`
- D: `false false false`

> An interface value is a pair: a dynamic type and a value. It equals `nil`
> only when both are absent. Storing a nil `*MyErr` in an `error` gives the
> pair (`*MyErr`, nil), which is not a nil interface — so both `err` and the
> result of `check(false)` compare unequal to `nil`, and a caller's
> `if err != nil` fires. Return a literal `nil` on the success path instead.

## go-intermediate-046
topic: interfaces
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func describe(v interface{}) string {
	switch x := v.(type) {
	case int, int64:
		return fmt.Sprintf("num:%v", x)
	case string:
		return "str:" + x
	case nil:
		return "nil"
	default:
		return fmt.Sprintf("other:%T", x)
	}
}

func main() {
	var s []int
	fmt.Println(describe(int64(3)), describe(nil), describe(3.5), describe(s))
}
```

- A: `num:3 nil other:float64 nil`
- B: `num:3 other:<nil> other:float64 nil`
- C: It does not compile: `x` has no single type in `case int, int64`.
- D: `num:3 nil other:float64 other:[]int`

> In a case that lists one type, `x` has that type; in a case that lists
> several, `x` keeps the interface type — which still compiles, and `%v`
> prints the 3. `case nil` matches only a nil interface. A nil slice passed as
> `interface{}` is a non-nil interface holding (`[]int`, nil), so it reaches
> `default`, where `%T` reports `[]int`.

## go-intermediate-047
topic: interfaces
answer: C

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	var v interface{} = "42"
	n, ok := v.(int)
	fmt.Println(n, ok)
	fmt.Println(v.(int) + 1)
}
```

- A: It prints `0 false`, then `1`.
- B: It prints `42 true`, then `43`.
- C: It prints `0 false`, then panics: interface conversion.
- D: It does not compile: a string can never be asserted to `int`.

> The comma-ok form of a type assertion never panics: on a mismatch it gives
> the zero value and false. The single-value form panics when the dynamic type
> is wrong ("interface conversion: interface {} is string, not int"). It
> compiles because the static type is `interface{}`, which could hold an
> `int`; a type assertion never converts a string to a number.

## go-intermediate-048
topic: interfaces
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

type Point struct{ X, Y int }

func (p *Point) String() string { return fmt.Sprintf("(%d,%d)", p.X, p.Y) }

func main() {
	p := Point{1, 2}
	fmt.Println(p, &p)
}
```

- A: `{1 2} (1,2)`
- B: `(1,2) (1,2)`
- C: `{1 2} &{1 2}`
- D: `(1,2) &{1 2}`

> `fmt` uses `String()` only when the value it receives implements
> `fmt.Stringer`. `String` has a pointer receiver, so only `*Point` has it in
> its method set: the `Point` value is printed with the default struct format,
> and the pointer is printed through `String`. Giving `String` a value
> receiver would make both print `(1,2)`.

## go-intermediate-049
topic: interfaces
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	var a interface{} = 3
	var b interface{} = int64(3)
	var c interface{} = 3
	fmt.Println(a == b, a == c, a == 3)
}
```

- A: `true true true`
- B: `false true true`
- C: `false true false`
- D: `false false true`

> Two interface values are equal when their dynamic types are identical and
> their values are equal. `a` holds an `int` and `b` an `int64`, so they differ
> even though both are 3. In `a == 3` the untyped constant is converted to the
> interface type with its default type, `int`, so it matches `a`.

## go-intermediate-050
topic: interfaces
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	var x interface{} = []int{1}
	var y interface{} = []int{1}
	fmt.Println(x == y)
}
```

- A: It prints `true`.
- B: It prints `false`: the slices are different values.
- C: It does not compile: slices cannot be compared with `==`.
- D: It panics: comparing uncomparable type `[]int`.

> Interface values are always comparable at compile time, so `x == y` builds.
> At run time the comparison looks at the dynamic types; both are `[]int`, and
> because slices have no `==`, the runtime panics with "comparing uncomparable
> type []int". The same panic hits a map with interface keys when such a value
> is used as a key.
