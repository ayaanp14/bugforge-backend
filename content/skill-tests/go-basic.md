---
updated: 2026-10-03
question: What does the Go (Basic) skill test cover?
answer: The Go a programmer knows after a few months of writing it: declarations and zero values, constants, explicit conversions, loops and switch, functions and closures, arrays, slices and maps, strings and runes, structs and methods, simple interfaces, and errors and defer. Most questions show a short program and ask what it prints or whether it compiles; the test ends with an easy coding problem solved in Go.
q: Do I need to know goroutines and channels for the Go Basic test?
a: No. Goroutines, channels, select and the sync package are examined at Intermediate, along with generics, embedding, error wrapping and panic and recover. The Basic test stays with code that runs on a single goroutine: declarations, control flow, functions, slices, maps, strings, structs, interfaces and errors as values.
q: Which Go version are the questions written for?
a: None in particular. The questions avoid behaviour that has changed between releases, such as a closure capturing a for loop variable, which changed in Go 1.22, and they do not rely on recent additions like the min and max builtins or ranging over an integer. The answers hold on any Go release from the last few years.
q: Can I use the standard library in the coding problem?
a: Yes. You write the body of the function the problem gives you, and the page reads the input and prints your result. The packages a solution usually needs are there: sort, strings, strconv, math and unicode, so sort.Ints or a strings.Builder work as usual. The newer slices and maps packages are not available, so sort with the sort package.
q: Are the questions just Go syntax trivia?
a: Very few are. Most show a complete program and ask what it prints, whether it compiles, or whether it panics, so knowing a rule is not enough: you have to apply it to the code in front of you. Every output question was checked by running the program, so the expected output is what Go really prints.
q: What should I practise if I have only written Go for a few weeks?
a: Solve easy catalogue problems in Go until slices, maps and string handling come without looking anything up, and read your programs' output closely when it surprises you. Then work through the topic list on this page and make sure you can explain each rule, not just recognise it.
---

The Go (Basic) test checks that you can read ordinary Go and say exactly what it does, and then write a short, correct solution in it. It is multiple-choice questions, then a coding problem. The questions are about the language itself rather than any framework, and most of them put a small, complete program in front of you: you say what it prints, whether it compiles at all, or whether it stops with a panic.

Go is a small language, and that makes the details matter. Many of its rules exist precisely to stop the mistakes other languages allow, such as an unused variable, an implicit conversion or a missing `break`, and the test asks about those rules the way they show up in real code.

## Who it is for

The test is pitched at someone who has written Go for a few months: a student who has used it for coursework or competitive programming, or a developer who has written a service or a command-line tool in it. You should be comfortable declaring variables, writing loops and functions, and using slices, maps and structs without looking up the syntax. You do not need to know concurrency, generics or the internals of the runtime.

If you come from Java, Python or JavaScript, expect the questions to probe exactly where Go differs: there are no exceptions, no implicit numeric conversions, no `while` keyword, no truthy values and no classes.

## What the questions examine

Every topic gets its share of each paper, so no topic can be skipped.

- **Types, variables and constants.** Zero values, `var` against `:=` and when `:=` may reuse a name, shadowing in an inner block, untyped and typed constants, `iota`, explicit conversions between numeric types, and integer division and remainder with negative numbers.
- **Control flow.** The three forms of `for`, `switch` with and without an expression, why cases do not fall through and what `fallthrough` does, what `break` inside a `switch` leaves, and `if` with a short statement.
- **Functions and closures.** Multiple and named results, variadic parameters and passing a slice with `...`, functions as values, closures that keep a variable alive, and pass-by-value with pointers when a function must change its argument.
- **Arrays and slices.** Arrays as values that copy on assignment, slices as views of an array, `len` and `cap`, `make`, `append`, `copy` and slicing `s[a:b]`. The [arrays lesson](/roadmap/arrays) and the [array problems](/challenges/arrays) are good practice.
- **Maps.** Reading a missing key, the comma-ok form, `delete`, `len`, nil maps, which types can be keys, and why iteration order is not fixed. See the [hashing lesson](/roadmap/hashing) and the [hash table problems](/challenges/hash-table).
- **Strings, bytes and runes.** `len` counts bytes, indexing gives a byte, `range` gives runes, strings cannot be changed in place, and the `strings` and `strconv` functions you use every day. The [strings lesson](/roadmap/strings) and the [string problems](/challenges/strings) exercise all of it.
- **Structs and methods.** Struct literals, copying a struct against sharing it through a pointer, value and pointer receivers, methods on non-struct types, and exported against unexported names.
- **Interfaces.** Implicit satisfaction, `fmt.Stringer`, type assertions in both forms, type switches, and the dynamic type that `%T` reports.
- **Errors and defer.** Errors as ordinary return values checked with `if err != nil`, a custom error type, the order deferred calls run in, and when their arguments are evaluated.

The `fmt` verbs appear throughout: `%v`, `%+v`, `%d`, `%s`, `%q` and `%T`.

## The coding problem

After the questions comes one easy problem from the [problem catalogue](/challenges), answered in Go. You fill in the body of a function whose signature is given, such as one that takes a `[]int` and returns an `int`; the page reads the input, calls your function and prints the result, so there is no input parsing to write. Run checks the visible cases, and Submit runs the hidden ones, with credit for each case passed.

Easy problems usually come down to one pass over a slice, a map used as a counter, or a [two-pointer](/roadmap/two-pointers) walk over a sorted slice. The usual Go habits apply: return a slice rather than printing it, remember that a function gets a copy of an array, and use `sort.Ints` or `sort.Slice` when you need order.

## How to prepare

- Solve a few easy catalogue problems in Go, so that the coding round is about the problem and not about syntax.
- Write and run small programs for every rule you are not sure of. A two-line program settles most doubts faster than a search.
- For each topic above, explain the rule to yourself out loud: why `append` must be assigned, why a nil map can be read but not written, why a value receiver cannot change its struct.
- Practise reading code slowly. Many questions turn on one detail, such as an index range that excludes its end or a variable declared again in an inner block.
- Revise the general [programming fundamentals](/aptitude/programming-fundamentals) questions if output prediction is new to you.

## What trips people up

The marks that go are rarely about obscure features. They go on Go's deliberate differences from other languages: expecting an `int` variable and a `float64` to mix in arithmetic, expecting a `switch` case to fall into the next one, forgetting that `range` over a string steps through runes while `len` counts bytes, or assuming that an unused variable is only a warning. Many candidates also mix up what is copied and what is shared: assigning an array or a struct copies it, while a slice or a map passed to a function still refers to the same data.

Read each option to the end, too. Several questions offer "It does not compile" or "It panics at run time" alongside output that looks plausible, and only one of them is right.

## What changes at Intermediate

The [Go (Intermediate)](/skill-tests/go-intermediate) test assumes everything here and moves on to the language as production code uses it: how `append` can make two slices share an array, method sets and which types satisfy an interface, nil interfaces, struct embedding, wrapping and unwrapping errors, panic and recover, goroutines and channels, `select`, the `sync` package and generics. Its coding section adds a problem of medium difficulty.

## Sample question
topic: slices
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	stack := []int{}
	for _, n := range []int{4, 8, 15} {
		stack = append(stack, n)
	}
	top := stack[len(stack)-1]
	stack = stack[:len(stack)-1]
	fmt.Println(top, len(stack), stack)
}
```

- A: `4 2 [8 15]`
- B: `15 3 [4 8 15]`
- C: `15 2 [4 8]`
- D: `8 2 [4 8]`

> `append` adds each value at the end, so the last one pushed, 15, sits at index `len(stack)-1`. Reslicing with `stack[:len(stack)-1]` keeps indices 0 and 1 only, because the end index is excluded, so the slice loses its last element. That is how a slice serves as a stack in Go: push with `append`, pop by reading the last element and reslicing.
