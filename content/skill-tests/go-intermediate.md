---
updated: 2026-10-03
question: What does the Go (Intermediate) skill test cover?
answer: It certifies that you can read and write Go the way it is used at work. Multiple-choice questions, most built around a short program, examine slice aliasing and append, maps, method sets and interfaces, error wrapping, defer, panic and recover, goroutines and channels, select, sync and context, and generics. Then you solve coding problems from the catalogue in Go, judged on hidden test cases with partial credit.
q: Do I need to know generics for the Go Intermediate test?
a: Yes, at a working level. You should be able to write a function with a type parameter, pick a constraint for it, say what `comparable` allows and what a `~` in a union adds, and recognise when type inference cannot work out a type argument. Generics are one topic among several, so they take a share of each paper rather than most of it.
q: Which version of Go are the questions and the judge based on?
a: Go 1.19. The questions stay away from behaviour that changed in later releases, such as the per-iteration loop variables of Go 1.22, so no answer depends on the version you use day to day. In the coding round, the built-in min and max functions and the slices and maps packages, all added in Go 1.21, are not available, so bring small helpers of your own.
q: Are the concurrency questions about timing and race conditions?
a: No question depends on how the scheduler happens to interleave goroutines. The programs pass values through channels in a fixed order or add results up after wg.Wait(), and you are asked what they print, whether they panic, or whether they deadlock. Where the language deliberately leaves a choice open, such as which ready case a select takes, the question asks what the language promises.
q: Should I take the Go Basic test first?
a: Neither level requires the other. If you are comfortable with slices, maps, structs and simple interfaces but have not yet worked with goroutines, error wrapping or generics, the [Go (Basic) test](/skill-tests/go-basic) is the better fit for now. If you already write Go at work, start here.
q: How should I practise for the coding problems in Go?
a: Solve catalogue problems in Go rather than in your strongest language, because the coding round accepts only Go. Get fluent with what a Go solution reaches for every time: sort.Slice, maps used as sets, strings.Builder, strconv conversions, slices of slices and container/heap. Pasting into the editor is switched off, so practise writing them from memory.
---

The Go (Intermediate) test is for developers who write Go for a living, or are about to. It goes past the syntax into the behaviour that decides whether Go code is correct: what `append` does when two slices share an array, whether a nil pointer stored in an `error` compares equal to `nil`, when a deferred call reads its arguments, and which channel operations block, panic or deadlock. The multiple-choice questions come first, and most of them show a short, complete program and ask what it prints, or whether it compiles at all. Coding problems follow, and you solve them in Go.

Sit it when you can read an unfamiliar Go program and say what it will do before you run it. If you are still getting used to slices, maps and methods, start with the [Go (Basic) test](/skill-tests/go-basic); neither level requires the other.

## What each topic examines

Questions are drawn evenly across the topics below, so a sitting cannot be all channels and no maps. Each bullet says what you should be able to predict or explain.

- **Types, variables and constants.** How `iota` counts through a `const` block, how constant arithmetic differs from arithmetic on sized integers at run time, integer division and remainder with negative operands, a defined type against an alias, and what `:=` declares when the name already exists in an outer scope.
- **Control flow.** `fallthrough`, labelled `break` and `continue`, what an unlabelled `break` inside a `switch` leaves, and when a `range` loop evaluates the thing it ranges over.
- **Functions and closures.** Closures that keep their own state, method values and when they bind their receiver, passing a slice to a variadic parameter with `...`, and named results with a bare `return`.
- **Arrays and slices.** Two slices over one backing array, `append` and spare capacity, the full slice expression `s[low:high:max]`, `copy`, and which bounds a slice expression is checked against. Practise on [array problems](/challenges/arrays) and read the [Arrays lesson](/roadmap/arrays).
- **Maps.** Passing a map to a function, reading from and writing to a nil map, comma-ok lookups, deleting while ranging, and updating a struct stored as a map value. See the [hash table problems](/challenges/hash-table) and the [Hashing lesson](/roadmap/hashing).
- **Strings, bytes and runes.** Byte length against rune count, what `range` yields over UTF-8, immutability, and how `strings` and `strconv` behave at the edges. See the [string problems](/challenges/strings) and the [Strings lesson](/roadmap/strings).
- **Structs and methods.** Value and pointer receivers, addressability, embedding and promotion, including what a promoted method sees when the outer type has a method of the same name, and what assigning a struct that holds a slice or a pointer copies.
- **Interfaces.** Method sets and which types satisfy an interface, nil pointers stored in interfaces, type assertions and type switches, and comparing interface values.
- **Errors, defer, panic and recover.** Wrapping with `%w` against formatting with `%v`, `errors.Is` and `errors.As`, when deferred arguments are evaluated, deferred closures and named results, and where a call to `recover` takes effect.
- **Goroutines and channels.** Unbuffered hand-offs against buffered queues, closing a channel and receiving from a closed one, `range` over a channel, directional channel types, and the deadlock the runtime reports when every goroutine is blocked.
- **sync, select and context.** `select` with `default` and with nil channels, `sync.WaitGroup`, `sync.Mutex` and `sync.Once`, and how cancellation travels between a `context` and the contexts derived from it.
- **Generics.** Type parameters and constraints, `comparable`, `~` in a union, type inference and its limits, and generic types with methods.

## How the questions are written

Most questions show a complete program, `package main` and all, and ask for its output, which was checked by running it on Go 1.19. Nothing depends on what varies from run to run: no question prints a map in iteration order, relies on a scheduling race, or asks for a slice's exact capacity after `append` has grown it, because the language does not fix any of those. Concurrent programs print one determined result, with values passed through channels in a set order or summed after `wg.Wait()`.

"It does not compile", "It panics" and the runtime's "fatal error: all goroutines are asleep - deadlock!" appear among the options as real answers, not filler. You need to know which mistakes the compiler catches, which survive until run time, and what the runtime does with each, because a wrong program in Go fails in one of those three ways and the questions ask which. A few questions ask you to select every correct option, and only the exact set scores.

## The coding problems

The coding problems come from the published catalogue and must be answered in Go. As in the practice workbench, you complete a function whose signature is given and return the answer; the judge supplies the input and runs hidden cases, each case you pass earns its share of the marks, and your best submission per problem stands.

Write for Go 1.19. There are no built-in `min` and `max` functions and no `slices` or `maps` packages, so sort with `sort.Ints`, `sort.Strings` or `sort.Slice`, and keep a two-line `max` helper in your head. A priority queue in Go means implementing `container/heap`'s five methods on your own type, which is slow to work out under a clock if you have never done it. Build long output with `strings.Builder` rather than `+=` in a loop. `int` is 64 bits on the judge, so most sums are safe, but a product of two large values can still overflow, and Go wraps it without any error.

## How to prepare

Predict, then run. For each behaviour in the list above, write a ten-line program, decide what it will print, and only then run it. Most of the surprises in Go come from a handful of rules (slices share arrays, assignment copies, an interface carries a type as well as a value), and seeing each rule break your prediction once is how it sticks.

Solve problems in Go, not in your strongest language. The [challenge catalogue](/challenges) takes a Go solution for every problem; the topic hubs order their problems from easy to hard, and a good spread for Go practice is [two pointers](/challenges/two-pointers), [sliding window](/challenges/sliding-window), [stack](/challenges/stack), [heap](/challenges/heap) and [breadth-first search](/challenges/breadth-first-search). The [DSA roadmap](/roadmap) teaches the techniques behind them, with lessons such as [Two Pointers](/roadmap/two-pointers), [Sliding Window](/roadmap/sliding-window) and [Heaps and Priority Queues](/roadmap/heap).

Concurrency has no problem set, so build the shapes yourself: a pipeline of stages joined by channels, a worker pool that waits on a `sync.WaitGroup`, a loop that stops when a `context` is cancelled, and a `select` that drains two channels until both are closed. Run them with the race detector (`go run -race`), and try the broken versions too: forget a `close`, pass a `WaitGroup` by value, lock a mutex twice. Knowing what each failure looks like is part of what the test examines.

## Sample question
topic: structs-methods
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Item struct {
	Name string
	Qty  int
}

func (it *Item) Restock(n int) { it.Qty += n }

func main() {
	items := []Item{{"pen", 1}, {"cup", 2}}
	for _, it := range items {
		it.Restock(10)
	}
	for i := range items {
		items[i].Restock(1)
	}
	fmt.Println(items)
}
```

- A: `[{pen 12} {cup 13}]`
- B: `[{pen 1} {cup 2}]`
- C: `[{pen 2} {cup 3}]`
- D: It does not compile: `Restock` needs a pointer, and `it` is a value.

> `range` copies each element into the loop variable. `it.Restock(10)` is legal
> because `it` is an addressable variable, so Go passes `&it` — the address of
> the copy — and the 10 is added to the copy and then thrown away. `items[i]`
> names the element in the slice itself, so `items[i].Restock(1)` changes the
> slice. To modify elements while ranging, index the slice or keep pointers in
> it (`[]*Item`).
