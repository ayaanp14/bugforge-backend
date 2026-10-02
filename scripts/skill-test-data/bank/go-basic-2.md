---
skill: go
level: basic
---

## go-basic-027
topic: slices
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	a := [3]int{1, 2, 3}
	b := a
	b[0] = 100
	s := a[:]
	s[1] = 200
	fmt.Println(a, b)
}
```

- A: `[100 200 3] [100 200 3]`
- B: `[1 2 3] [100 2 3]`
- C: `[1 200 3] [100 2 3]`
- D: `[100 200 3] [100 2 3]`

> An array is a value: `b := a` copies all three elements, so changing `b[0]` leaves `a` alone. A slice is a view of an array: `a[:]` refers to `a`'s own elements, so `s[1] = 200` changes `a`. `b` was copied before that, so it still holds 2.

## go-basic-028
topic: slices
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := make([]int, 3)
	s = append(s, 7)
	fmt.Println(len(s), s)
}
```

- A: `4 [0 0 0 7]`
- B: `1 [7]`
- C: `3 [7 0 0]`
- D: `4 [7 0 0 0]`

> `make([]int, 3)` makes a slice of length 3, already holding three zeros. `append` always adds after the last element, so 7 becomes the fourth. To start empty with room for three, write `make([]int, 0, 3)`: the length is 0 and the capacity 3.

## go-basic-029
topic: slices
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := make([]int, 5, 10)
	t := s[2:4]
	fmt.Println(len(t), cap(t))
}
```

- A: `2 2`
- B: `2 10`
- C: `3 8`
- D: `2 8`

> `s[2:4]` takes indices 2 and 3, so its length is 4 - 2 = 2 (the upper bound is excluded). Its capacity runs from index 2 to the end of the underlying array, which has room for 10 elements: 10 - 2 = 8.

## go-basic-030
topic: slices
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	nums := []int{10, 20, 30, 40, 50}
	mid := nums[1:4]
	mid[0] = 99
	fmt.Println(nums[1], len(mid), mid[len(mid)-1])
}
```

- A: `99 3 40`
- B: `20 3 40`
- C: `99 4 50`
- D: `20 4 50`

> `nums[1:4]` holds the elements at indices 1, 2 and 3, that is 20, 30 and 40: the end index is excluded, so the length is 3 and the last element is 40. Slicing copies nothing, so `mid[0]` is the same element as `nums[1]`, and setting it to 99 changes `nums` too.

## go-basic-031
topic: slices
answer: A

After `var s []int`, which statement is true?

- A: `s == nil` is true, `len(s)` is 0, and `s = append(s, 1)` works.
- B: `s == nil` is true, and `s = append(s, 1)` panics because `s` is nil.
- C: `s` is an empty slice that is not nil, so `s == nil` is false.
- D: `len(s)` panics at run time, because `s` refers to no array.

> The zero value of a slice type is `nil`: it has length 0 and capacity 0, and `len`, `cap` and `range` all work on it. `append` allocates a new array when there is no room, so appending to a nil slice is the normal way to build one. A literal such as `[]int{}` is the empty slice that is not nil.

## go-basic-032
topic: slices
answer: C

Consider these two programs, each with the usual `package main`, `import "fmt"` and `func main` around the lines shown. What happens to each?

```go
// Program 1
a := [3]int{1, 2, 3}
fmt.Println(a[3])

// Program 2
s := []int{1, 2, 3}
fmt.Println(s[3])
```

- A: Both fail to compile.
- B: Both compile, and both panic at run time.
- C: Program 1 fails to compile; program 2 compiles and panics at run time.
- D: Program 2 fails to compile; program 1 compiles and panics at run time.

> An array's length is part of its type (`[3]int`), so the compiler can see that the constant index 3 is outside 0 to 2 and rejects program 1. A slice's length is only known at run time, so program 2 compiles, and the bounds check fails when it runs: "index out of range [3] with length 3".

## go-basic-033
topic: slices
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	src := []int{1, 2, 3, 4}
	dst := make([]int, 2)
	n := copy(dst, src)
	fmt.Println(n, dst)
}
```

- A: `4 [1 2 3 4]`
- B: `2 [1 2]`
- C: `2 [3 4]`
- D: `2 [0 0]`

> `copy(dst, src)` copies from the second argument into the first, and only as many elements as the shorter of the two holds; it never grows `dst`. `dst` has length 2, so the first two elements are copied and `copy` returns 2. Swapping the arguments by mistake would copy `dst`'s zeros into `src` instead.

## go-basic-034
topic: slices
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	nums := []int{1, 2}
	append(nums, 3)
	fmt.Println(nums)
}
```

- A: It prints `[1 2 3]`.
- B: It prints `[1 2]`.
- C: It panics at run time: `nums` has no spare capacity.
- D: It does not compile: the result of `append` must be used.

> `append` returns the updated slice; it cannot change the length of the slice variable you pass in, because that variable holds a copy of the slice header. Calling it as a statement and discarding the result is a compile error ("is not used"). The idiom is `nums = append(nums, 3)`.

## go-basic-035
topic: slices
answer: B, D, E

Which of these comparisons compile, each written as `fmt.Println(<comparison>)`? Select all that apply.

- A: `[]int{1, 2} == []int{1, 2}`
- B: `[2]int{1, 2} == [2]int{1, 2}`
- C: `[3]int{} == [2]int{}`
- D: `[]int(nil) == nil`
- E: `len([3]int{}) == 3`

> Arrays are comparable with `==` when their element type is, and two arrays are equal when every element is (B). Slices are not comparable at all, except with `nil` (A fails, D compiles). `[3]int` and `[2]int` are different types, because the length is part of an array's type, so C does not compile. E compares two integers.

## go-basic-036
topic: maps
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	ages := map[string]int{"ana": 30, "ben": 0}
	a := ages["cal"]
	b, ok1 := ages["ben"]
	_, ok2 := ages["cal"]
	fmt.Println(a, b, ok1, ok2)
}
```

- A: `0 0 false false`
- B: `0 0 true false`
- C: `-1 0 true false`
- D: It panics: `"cal"` is not in the map.

> Reading a key that is not in a map returns the value type's zero value, here 0; it never panics. That is why a stored 0 and a missing key look the same, and the comma-ok form tells them apart: `ok1` is true because `"ben"` is present (with the value 0), and `ok2` is false because `"cal"` is not.

## go-basic-037
topic: maps
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	counts := map[string]int{}
	for _, w := range []string{"go", "is", "go", "fun", "go"} {
		counts[w]++
	}
	fmt.Println(counts["go"], counts["fun"], len(counts))
}
```

- A: `3 1 5`
- B: `1 1 3`
- C: `3 1 3`
- D: It panics: `counts[w]++` reads a key that is not there yet.

> `counts[w]++` reads the current value (the zero value 0 for a new key) and stores it plus one, so counting words needs no check for a missing key. `"go"` appears three times and `"fun"` once. `len` counts distinct keys, and there are three: `go`, `is` and `fun`.

## go-basic-038
topic: maps
answer: A

What happens when you run this program?

```go
package main

import "fmt"

func main() {
	var m map[string]int
	fmt.Println(m["x"], len(m))
	m["x"] = 1
	fmt.Println(m["x"])
}
```

- A: It prints `0 0`, then panics on the assignment to the nil map.
- B: It prints `0 0` and then `1`.
- C: It panics on the first `Println`: a nil map cannot be read.
- D: It does not compile: `m` is used before it is initialised.

> A map declared with `var` and no value is `nil`. Reading from a nil map behaves like reading from an empty one, so the first line prints `0 0`. Writing to it panics with "assignment to entry in nil map". Create the map first with `make(map[string]int)` or a literal such as `map[string]int{}`.

## go-basic-039
topic: maps
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	m := map[int]string{1: "a", 2: "b", 3: "c"}
	delete(m, 2)
	delete(m, 7)
	m[4] = "d"
	_, has2 := m[2]
	fmt.Println(len(m), has2)
}
```

- A: `4 false`
- B: `3 true`
- C: It panics: key `7` is not in the map.
- D: `3 false`

> `delete` removes a key if it is there and does nothing if it is not, so `delete(m, 7)` is safe. After removing 2 and adding 4, the keys are 1, 3 and 4: the length is 3, and the comma-ok lookup reports that 2 is gone.

## go-basic-040
topic: maps
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func addOne(m map[string]int) {
	m["k"]++
}

func reset(m map[string]int) {
	m = map[string]int{}
}

func main() {
	m := map[string]int{"k": 1}
	addOne(m)
	reset(m)
	fmt.Println(m["k"], len(m))
}
```

- A: `1 1`
- B: `2 1`
- C: `0 0`
- D: `2 0`

> A map value is a reference to the map's data, so a function given the map can change its entries: `addOne` makes `"k"` 2 in the caller's map. But the parameter itself is a copy, so `reset` only points its own `m` at a new, empty map; the caller's map is untouched and still has one key.

## go-basic-041
topic: maps
answer: C

Which of these map types does not compile?

- A: `map[[2]int]bool`
- B: `map[struct{ x, y int }]bool`
- C: `map[[]int]bool`
- D: `map[bool]string`

> A map key type must be comparable with `==`. Slices, maps and functions are not, so `[]int` cannot be a key ("invalid map key type"). Arrays and structs are comparable when their elements and fields are, so `[2]int` and a struct of two ints are fine keys, as is `bool`.

## go-basic-042
topic: maps
answer: A
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
	fmt.Println(groups[true], groups[false], len(groups))
}
```

- A: `[2 4] [1 3 5] 2`
- B: `[2 4] [1 3 5] 5`
- C: `[4] [5] 2`
- D: It panics: `append` is given a key that is not in the map.

> A missing key reads as the zero value of `[]int`, which is a nil slice, and `append` works on a nil slice. Storing the result back under the key keeps each group growing. The map has only two keys, `true` and `false`, so its length is 2.

## go-basic-043
topic: maps
answer: D

What does this program print?

```go
package main

import "fmt"

func main() {
	m := map[string]int{"a": 1, "b": 2, "c": 3}
	for k := range m {
		fmt.Print(k)
	}
	fmt.Println()
}
```

- A: Always `abc`, because a map keeps its keys sorted.
- B: Always `abc`, because a map keeps its keys in insertion order.
- C: Always `cba`, because the newest key comes first.
- D: The three keys, in an order that can change from one run to the next.

> The iteration order of a map is not specified, and the Go runtime deliberately varies it, so the same program can print `bca` one time and `abc` the next. When the order matters, collect the keys into a slice and sort it (`sort.Strings`) before ranging. (Printing the whole map with `fmt.Println(m)` is the exception: `fmt` sorts the keys.)

## go-basic-044
topic: strings
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := "café"
	fmt.Println(len(s), len([]rune(s)))
}
```

- A: `4 4`
- B: `5 4`
- C: `5 5`
- D: `4 5`

> A Go string is a sequence of bytes, usually UTF-8, and `len` counts bytes. `c`, `a` and `f` take one byte each, and `é` takes two, so `len(s)` is 5. Converting to `[]rune` decodes the UTF-8 into code points, of which there are 4.

## go-basic-045
topic: strings
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := "aéb"
	idx := ""
	for i := range s {
		idx += fmt.Sprint(i)
	}
	fmt.Println(idx)
}
```

- A: `013`
- B: `0123`
- C: `012`
- D: `123`

> `range` over a string steps through it one rune (code point) at a time, and the index it gives is the byte offset where that rune starts. `a` starts at byte 0, `é` at byte 1 and takes two bytes, so `b` starts at byte 3. There are three iterations, not four.

## go-basic-046
topic: strings
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := "Go"
	fmt.Println(s[0], string(s[1]), s[0] == 'G')
}
```

- A: `71 o true`
- B: `G o true`
- C: `71 111 true`
- D: `G o false`

> Indexing a string gives a `byte` (a `uint8`), and `Println` prints a byte as a number: `'G'` is 71. Converting a byte to `string` gives the one-character string, so `string(s[1])` prints `o`. The comparison with the rune constant `'G'` is between equal numbers, so it is true.

## go-basic-047
topic: strings
answer: D

What happens when you build and run this program?

```go
package main

import "fmt"

func main() {
	s := "hello"
	s[0] = 'j'
	fmt.Println(s)
}
```

- A: It prints `jello`.
- B: It prints `hello`, because the assignment changes a copy.
- C: It panics at run time, because strings are read-only.
- D: It does not compile: a byte of a string cannot be assigned.

> Strings are immutable, and the compiler enforces it: `s[0]` can be read but not assigned. To change a character, convert to a byte slice, change it and convert back: `b := []byte(s); b[0] = 'j'; s = string(b)`. Assigning a whole new string to `s` is always allowed.

## go-basic-048
topic: strings
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	r := 'A'
	fmt.Printf("%q %v %c %T\n", r, r, r+1, r)
}
```

- A: `'A' A B rune`
- B: `'A' 65 B int32`
- C: `"A" 65 B int32`
- D: `'A' 65 66 int32`

> A rune literal such as `'A'` has the type `rune`, which is another name for `int32`, so `%T` prints `int32` and `%v` prints the number 65. `%q` prints a rune as a single-quoted character literal, and `%c` prints the character for a code point, so `r+1` (66) prints as `B`.

## go-basic-049
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
	parts := strings.Split("a,b,,c", ",")
	fmt.Println(len(parts), strings.Join(parts, "-"))
}
```

- A: `3 a-b-c`
- B: `4 a-b-c`
- C: `4 a-b--c`
- D: `3 a-b--c`

> `strings.Split` cuts at every separator and keeps what lies between, including the empty string between the two adjacent commas, so there are four parts: `"a"`, `"b"`, `""` and `"c"`. `Join` puts `"-"` between every pair of parts, empty ones included. (`strings.Fields` is the function that drops empty pieces, but it splits on spaces.)

## go-basic-050
topic: strings
answer: C

You have `n := 65` (an `int`) and want the string `"65"`. Which expression gives it?

- A: `string(n)`
- B: `string(rune(n))`
- C: `strconv.Itoa(n)`
- D: `string([]byte{byte(n)})`

> Converting an integer to `string` treats it as a code point, not as a number to write out in digits: A, B and D all give `"A"`, the character with code 65. `strconv.Itoa` (or `fmt.Sprint(n)`) formats the number in decimal. `go vet` warns about A for exactly this reason.

## go-basic-051
topic: strings
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	s := "cat"
	b := []byte(s)
	b[0] = 'b'
	fmt.Println(s, string(b))
}
```

- A: `bat bat`
- B: `cat bat`
- C: `cat cat`
- D: It does not compile: `'b'` is a rune, not a byte.

> Converting a string to `[]byte` copies its bytes into a new, mutable slice, so changing `b` cannot affect `s`. `'b'` is an untyped rune constant, and a constant that fits in a byte can be assigned to one, so the program compiles.

## go-basic-052
topic: strings
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	fmt.Println("Zebra" < "apple", "go" < "golang", "b" > "abc")
}
```

- A: `false true true`
- B: `false true false`
- C: `true false true`
- D: `true true true`

> Strings compare byte by byte. Upper-case letters come before lower-case ones in ASCII (`'Z'` is 90, `'a'` is 97), so `"Zebra"` sorts first. A string that is a prefix of another is the smaller one, and `"b"` beats `"abc"` at the very first byte; length only matters after a common prefix.
