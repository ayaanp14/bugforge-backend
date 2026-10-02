---
skill: go
level: intermediate
---

## go-intermediate-051
topic: errors
answer: C
run: go

What does this program print?

```go
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("not found")

func find() error {
	return fmt.Errorf("user 7: %w", ErrNotFound)
}

func load() error {
	if err := find(); err != nil {
		return fmt.Errorf("load: %v", err)
	}
	return nil
}

func main() {
	e1, e2 := find(), load()
	fmt.Println(errors.Is(e1, ErrNotFound), errors.Is(e2, ErrNotFound), e2)
}
```

- A: `true true load: user 7: not found`
- B: `false false load: user 7: not found`
- C: `true false load: user 7: not found`
- D: `true false load: not found`

> `%w` wraps: the error `find` returns carries `ErrNotFound` inside it, and
> `errors.Is` unwraps the chain to find it. `%v` only formats the message, so
> `load`'s error has the same text but no chain back to `ErrNotFound`, and
> `errors.Is` reports false. The message still includes every layer's text.

## go-intermediate-052
topic: errors
answer: A
run: go

What does this program print?

```go
package main

import (
	"errors"
	"fmt"
)

type HTTPError struct{ Code int }

func (e *HTTPError) Error() string { return fmt.Sprintf("http %d", e.Code) }

func fetch() error {
	return fmt.Errorf("fetch: %w", &HTTPError{Code: 404})
}

func main() {
	err := fetch()
	var he *HTTPError
	_, direct := err.(*HTTPError)
	found := errors.As(err, &he)
	fmt.Println(direct, found, he.Code)
}
```

- A: `false true 404`
- B: `true true 404`
- C: `false false 0`
- D: It panics: `he` is still nil when `he.Code` is read.

> The error `fetch` returns is the wrapper made by `fmt.Errorf`, not the
> `*HTTPError`, so a type assertion on it fails. `errors.As` walks the wrap
> chain, finds the first error assignable to `*HTTPError`, stores it in `he`
> and returns true — which is why it takes a pointer to the target variable.

## go-intermediate-053
topic: errors
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	x := 1
	defer fmt.Println("deferred:", x)
	x = 2
	defer func() { fmt.Print("closure:", x, " ") }()
	x = 3
}
```

- A: `closure:3 deferred: 3`
- B: `deferred: 1 closure:3`
- C: `closure:2 deferred: 1`
- D: `closure:3 deferred: 1`

> Deferred calls run last-in, first-out, so the closure runs first. The
> arguments of a deferred call are evaluated when the `defer` statement runs:
> `fmt.Println` was handed the value 1 at that moment. The closure takes no
> arguments; it reads the variable `x` when it finally runs, by which time
> `x` is 3.

## go-intermediate-054
topic: errors
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func safeDiv(a, b int) (q int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
			q = -1
		}
	}()
	q = a / b
	return
}

func main() {
	q1, e1 := safeDiv(7, 2)
	q2, e2 := safeDiv(1, 0)
	fmt.Println(q1, e1, q2, e2)
}
```

- A: `3 <nil> 0 recovered: runtime error: integer divide by zero`
- B: `3 <nil> -1 recovered: runtime error: integer divide by zero`
- C: `3 <nil> -1 <nil>`
- D: It crashes with `panic: runtime error: integer divide by zero` instead.

> Integer division by zero panics at run time. The deferred function runs
> while the panic unwinds, and `recover` stops it. Because the results are
> named, the deferred function can assign them, and the function returns
> whatever they hold when the deferred calls finish: -1 and the new error. This
> is the standard way to turn a panic into an error.

## go-intermediate-055
topic: errors
answer: C

What happens when you run this program?

```go
package main

import "fmt"

func handle() {
	if r := recover(); r != nil {
		fmt.Println("recovered:", r)
	}
}

func main() {
	defer func() {
		handle()
	}()
	panic("boom")
}
```

- A: It prints `recovered: boom` and exits normally.
- B: It prints `recovered: boom`, then crashes with `panic: boom`.
- C: It crashes with `panic: boom`: here `recover` returns nil.
- D: It does not compile: `recover` must be called in a deferred literal.

> `recover` stops a panic only when it is called directly by a deferred
> function. Here the deferred function is the literal, and `handle` is one call
> deeper, so its `recover` returns nil and the panic carries on to crash the
> program. `defer handle()` would work, because then `handle` itself is the
> deferred function. `recover` may appear in any function, so it compiles.

## go-intermediate-056
topic: errors
answer: A

What happens when you run this program?

```go
package main

import "fmt"

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recovered:", r)
		}
	}()
	done := make(chan bool)
	go func() {
		panic("worker failed")
	}()
	<-done
}
```

- A: The whole program crashes with `panic: worker failed`.
- B: main's deferred `recover` catches it and prints `recovered: worker failed`.
- C: The goroutine dies quietly, and main then deadlocks on `<-done`.
- D: It does not compile: `recover` cannot see another goroutine's panic.

> A panic unwinds only the goroutine it happens in, running that goroutine's
> deferred calls. Nothing in the worker recovers, so when it reaches the top of
> its stack the runtime ends the entire program — main's deferred `recover` is
> never consulted. Every goroutine that can panic needs its own deferred
> `recover` if the program must survive it.

## go-intermediate-057
topic: goroutines-channels
answer: A, C, D

Which of these channel operations panic? Select all that apply.

- A: Sending on a closed channel.
- B: Receiving from a closed channel.
- C: Closing a nil channel.
- D: Closing a channel that is already closed.
- E: Receiving from a nil channel.

> Sending on a closed channel, closing a nil channel and closing a channel
> twice all panic. Receiving from a closed channel never blocks and never
> panics: it returns any buffered values, then the zero value with `ok` false.
> Sending to or receiving from a nil channel blocks for ever — which, with no
> other goroutine able to run, ends in the deadlock error, not a panic.

## go-intermediate-058
topic: goroutines-channels
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 3)
	ch <- 10
	ch <- 20
	close(ch)
	a := <-ch
	b, ok1 := <-ch
	c, ok2 := <-ch
	fmt.Println(a, b, ok1, c, ok2, len(ch))
}
```

- A: `10 20 false 0 false 0`
- B: `10 20 true 0 false 0`
- C: `10 20 true 20 false 0`
- D: It panics: receive from a closed channel.

> Closing a channel does not discard what is buffered in it. Receives return
> the buffered values in order, with `ok` true, even after `close`. Only when
> the buffer is empty do receives return the zero value with `ok` false —
> immediately, as many times as you ask.

## go-intermediate-059
topic: goroutines-channels
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

func gen(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			out <- n * n
		}
	}()
	return out
}

func double(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for v := range in {
			out <- v * 2
		}
	}()
	return out
}

func main() {
	for v := range double(gen(1, 2, 3)) {
		fmt.Print(v, " ")
	}
	fmt.Println()
}
```

- A: `1 4 9`
- B: `2 4 6`
- C: It deadlocks: the `range` over a channel never ends.
- D: `2 8 18`

> Each stage squares or doubles the values in order — one sender per
> unbuffered channel keeps the order — so the output is 1², 2², 3² doubled:
> 2, 8, 18. A `range` over a channel ends when the channel is closed and
> drained; each stage closes its output (`defer close(out)`) when its input
> runs out, so the end propagates down the pipeline and `main`'s loop finishes.

## go-intermediate-060
topic: goroutines-channels
answer: B

What happens when you run this program?

```go
package main

import "fmt"

func main() {
	ch := make(chan int)
	go func() {
		for i := 0; i < 3; i++ {
			ch <- i
		}
	}()
	for v := range ch {
		fmt.Print(v, " ")
	}
	fmt.Println("done")
}
```

- A: It prints `0 1 2 done`.
- B: It prints `0 1 2`, then fails: all goroutines are asleep - deadlock!
- C: It prints `0 1 2`, then hangs for ever with no error.
- D: It prints `done` at once: the loop ends when the goroutine returns.

> `range` over a channel keeps receiving until the channel is closed, and
> nobody closes `ch`. After the third value the sender returns, and `main`
> blocks waiting for a fourth. With every goroutine blocked, the runtime stops
> the program with "fatal error: all goroutines are asleep - deadlock!" rather
> than hanging. The sender should `close(ch)` when it is done.

## go-intermediate-061
topic: goroutines-channels
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	ping := make(chan string)
	pong := make(chan string)
	go func() {
		for msg := range ping {
			pong <- msg + "!"
		}
		close(pong)
	}()
	var out []string
	for _, w := range []string{"a", "b", "c"} {
		ping <- w
		out = append(out, <-pong)
	}
	close(ping)
	_, ok := <-pong
	fmt.Println(out, ok)
}
```

- A: `[a! b! c!] true`
- B: `[a b c] false`
- C: `[a! b! c!] false`
- D: It deadlocks: the goroutine is still blocked when `ping` is closed.

> Unbuffered channels make each exchange a hand-off: `main` sends a word, the
> goroutine receives it and sends the reply, and `main` receives that before
> sending the next word, so the replies arrive in order. After `close(ping)`
> the goroutine's `range` ends, it closes `pong`, and the final receive returns
> the zero value with `ok` false.

## go-intermediate-062
topic: goroutines-channels
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	ch := make(chan string, 3)
	ch <- "x"
	ch <- "y"
	before := len(ch)
	<-ch
	ch <- "z"
	first := <-ch
	fmt.Println(before, cap(ch), len(ch), first)
}
```

- A: `2 3 1 y`
- B: `2 3 1 z`
- C: `2 3 2 y`
- D: `2 3 1 x`

> A buffered channel is a FIFO queue: `len` is how many values are waiting,
> `cap` the buffer size. Sends below capacity do not block. The first receive
> takes "x", "z" joins behind "y", so the next receive gets "y" and leaves one
> value ("z") in the buffer.

## go-intermediate-063
topic: goroutines-channels
answer: B, C, E

```go
func producer(out chan<- int) {
	// ...
}
```

Which of these compile? Select all that apply.

- A: `v := <-out` inside `producer`
- B: `out <- 1` inside `producer`
- C: `producer(make(chan int))`
- D: `producer(in)`, where `in` has type `<-chan int`
- E: `close(out)` inside `producer`

> `chan<- int` is send-only: sending compiles, receiving does not. Closing is
> allowed on a send-only channel — closing is the sender's job — and it is the
> receive-only `<-chan` that cannot be closed. A bidirectional `chan int`
> converts implicitly to either direction, but a receive-only channel can never
> become a send-only one.

## go-intermediate-064
topic: sync
answer: D
run: go

What does this program print?

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var (
		once  sync.Once
		mu    sync.Mutex
		wg    sync.WaitGroup
		inits int
		calls int
	)
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			once.Do(func() { inits++ })
			mu.Lock()
			calls++
			mu.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println(inits, calls)
}
```

- A: `5 5`
- B: `1 1`
- C: `0 5`
- D: `1 5`

> `once.Do` runs its function exactly once however many goroutines call it,
> and every caller waits until that first call has finished. The mutex makes
> the five increments of `calls` safe. `wg.Add(1)` runs before each goroutine
> starts and `wg.Wait()` blocks until all five have called `Done`, so both
> counts are final when they are printed.

## go-intermediate-065
topic: sync
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 1)
	sent := 0
	for i := 0; i < 3; i++ {
		select {
		case ch <- i:
			sent++
		default:
		}
	}
	v := -1
	select {
	case v = <-ch:
	default:
	}
	fmt.Println(sent, v)
}
```

- A: `3 2`
- B: `1 2`
- C: `1 0`
- D: It deadlocks on the second send.

> A `select` with a `default` never blocks: if no case can proceed, `default`
> runs. The buffer holds one value, so the first send (0) succeeds and the next
> two find it full and fall to `default` — those values are dropped, not
> queued. The final `select` receives the 0 that is waiting.

## go-intermediate-066
topic: sync
answer: B
run: go

What does this program print?

```go
package main

import (
	"context"
	"errors"
	"fmt"
)

func main() {
	parent, cancel := context.WithCancel(context.Background())
	child, cancelChild := context.WithCancel(parent)
	defer cancelChild()
	before := child.Err() == nil
	cancel()
	<-child.Done()
	fmt.Println(before, child.Err(), errors.Is(child.Err(), context.Canceled))
}
```

- A: `true <nil> false`
- B: `true context canceled true`
- C: `false context canceled true`
- D: It blocks for ever: cancelling a parent leaves the child open.

> A context's `Err` is nil until it is done. Cancellation flows down the tree:
> cancelling `parent` cancels every context derived from it, so the child's
> `Done` channel is closed and the receive returns at once. The child's `Err`
> is then `context.Canceled`, whose message is "context canceled". Calling
> `cancelChild` as well (here, deferred) is still required to release it.

## go-intermediate-067
topic: sync
answer: A
run: go

What does this program print?

```go
package main

import "fmt"

func main() {
	a := make(chan int, 2)
	b := make(chan int, 1)
	a <- 1
	a <- 2
	b <- 10
	close(a)
	close(b)

	count, sum := 0, 0
	for a != nil || b != nil {
		select {
		case v, ok := <-a:
			if !ok {
				a = nil
				continue
			}
			count++
			sum += v
		case v, ok := <-b:
			if !ok {
				b = nil
				continue
			}
			count++
			sum += v
		}
	}
	fmt.Println(count, sum)
}
```

- A: `3 13`
- B: `2 3`
- C: It loops for ever: a closed channel is always ready.
- D: It deadlocks: a `select` on two nil channels blocks.

> The order of the receives is random, but the totals are not: every value is
> received once. When a channel reports closed, the loop sets its variable to
> nil, and a nil channel's case is never ready, so `select` stops choosing it.
> Without that step the closed channel would win the `select` again and again.
> Once both are nil the loop condition is false, so the `select` never runs on
> two nil channels.

## go-intermediate-068
topic: sync
answer: D

```go
a := make(chan string, 1)
b := make(chan string, 1)
a <- "a"
b <- "b"
select {
case v := <-a:
	fmt.Println(v)
case v := <-b:
	fmt.Println(v)
default:
	fmt.Println("none")
}
```

What does this code print?

- A: Always `a`: the first ready case is taken.
- B: Always `none`: `default` runs whenever it is present.
- C: `a`, then `b`: every ready case runs once, in order.
- D: `a` or `b`: one ready case is chosen at random.

> When more than one case of a `select` can proceed, one of them is chosen by
> a uniform pseudo-random selection — the order the cases are written in
> carries no priority, so code must not rely on it. `default` runs only when no
> case is ready, and a `select` runs exactly one case.

## go-intermediate-069
topic: sync
answer: C

What happens when you run this program?

```go
package main

import (
	"fmt"
	"sync"
)

type Cache struct {
	mu   sync.Mutex
	data map[string]int
}

func (c *Cache) Get(k string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.data[k]
}

func (c *Cache) GetOrZero(k string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, ok := c.data[k]; !ok {
		return 0
	}
	return c.Get(k)
}

func main() {
	c := &Cache{data: map[string]int{"a": 1}}
	fmt.Println(c.GetOrZero("b"))
	fmt.Println(c.GetOrZero("a"))
}
```

- A: It prints `0` and then `1`.
- B: It deadlocks before printing anything.
- C: It prints `0`, then fails: all goroutines are asleep - deadlock!
- D: It prints `0`, then panics: sync: unlock of unlocked mutex.

> `sync.Mutex` is not reentrant: a goroutine that holds the lock and calls
> `Lock` again blocks, waiting for itself. For "b" the method returns before
> calling `Get`, so the first line prints 0. For "a", `GetOrZero` holds the
> lock and calls `Get`, which blocks for ever; with no other goroutine to wake
> it, the runtime reports the deadlock. Locked helpers usually come in pairs:
> one that locks and one that assumes the lock is held.

## go-intermediate-070
topic: generics
answer: B
run: go

What does this program print?

```go
package main

import "fmt"

type Number interface {
	~int | ~float64
}

func Sum[T Number](xs []T) T {
	var s T
	for _, x := range xs {
		s += x
	}
	return s
}

type Score int

func main() {
	scores := []Score{3, 4, 5}
	fmt.Println(Sum(scores), Sum([]float64{1.5, 2}))
}
```

- A: It does not compile: `T` cannot be inferred from `[]Score`.
- B: `12 3.5`
- C: `12 3`
- D: It does not compile: `Score` is not `int`, so it is not a `Number`.

> `~int` means "every type whose underlying type is `int`", so the defined
> type `Score` is in `Number`'s type set — without the tilde it would not be.
> `T` is inferred from the argument (`Score`, then `float64`), and `+=` is
> allowed because every type in the set supports `+`. `var s T` starts at
> the zero value of whichever type `T` is.

## go-intermediate-071
topic: generics
answer: A, C, E

```go
type Int interface{ int | int64 }

func Double[T Int](x T) T { return x * 2 }

type ID int
```

Which of these calls compile? Select all that apply.

- A: `Double(5)`
- B: `Double(ID(5))`
- C: `Double[int64](5)`
- D: `Double(5.0)`
- E: `Double(int64(5))`

> With only untyped constant arguments, `T` is inferred as the constant's
> default type: `int` for `5` (A compiles) and `float64` for `5.0`, which is
> not in the type set (D fails). Explicit instantiation (C) and a typed
> argument (E) are fine. `ID` has underlying type `int`, but the set lists
> `int` itself, not `~int`, so `ID` does not satisfy `Int` (B).

## go-intermediate-072
topic: generics
answer: A

```go
func Max[T comparable](a, b T) T {
	if a > b {
		return a
	}
	return b
}
```

This does not compile. Which constraint, written in place of `comparable`, makes `Max(3, 7)`, `Max(2.5, 1.0)` and `Max("a", "b")` all compile?

- A: `interface{ ~int | ~float64 | ~string }`
- B: `any`
- C: `interface{ comparable; ~int | ~float64 }`
- D: `fmt.Stringer`

> An operator is allowed on a type parameter only if every type in the
> constraint's type set supports it. `comparable` guarantees `==` and `!=`,
> not `<` or `>`; `any` and `fmt.Stringer` guarantee no ordering at all (and
> `int` is not a `Stringer`). A union of ordered types allows `>` and covers
> all three calls; C would also allow `>` but leaves out `string`.

## go-intermediate-073
topic: generics
answer: D
run: go

What does this program print?

```go
package main

import "fmt"

type Stack[T any] struct{ items []T }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	v := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return v, true
}

func main() {
	var s Stack[string]
	s.Push("a")
	s.Push("b")
	x, _ := s.Pop()
	s.Pop()
	y, ok := s.Pop()
	fmt.Printf("%s %q %v\n", x, y, ok)
}
```

- A: `a "" false`
- B: `b "a" true`
- C: `b <nil> false`
- D: `b "" false`

> The stack pops the last value pushed, so `x` is "b", and the second `Pop`
> removes "a". The third finds the stack empty and returns `var zero T` — for
> `T = string` that is the empty string, which `%q` prints as `""`. A type
> parameter's zero value is the zero value of the type it is instantiated
> with, never `nil` for a string.

## go-intermediate-074
topic: generics
answer: C
run: go

What does this program print?

```go
package main

import "fmt"

type Set[T comparable] map[T]struct{}

func (s Set[T]) Add(vs ...T) {
	for _, v := range vs {
		s[v] = struct{}{}
	}
}

func main() {
	s := Set[int]{}
	s.Add(3, 1, 3, 2, 1)
	fmt.Println(len(s), s)
}
```

- A: `5 map[1:{} 2:{} 3:{}]`
- B: `3 map[3:{} 1:{} 2:{}]`
- C: `3 map[1:{} 2:{} 3:{}]`
- D: It does not compile: methods cannot be declared on a map type.

> A generic defined type can be a map, and it can have methods like any other
> defined type. The `comparable` constraint is what lets `T` be a map key.
> Duplicate keys overwrite each other, leaving three; an empty struct takes no
> space and prints as `{}`. `fmt` prints map keys in sorted order, not
> insertion order.

## go-intermediate-075
topic: generics
answer: B

In Go 1.19, which of these declarations does not compile? (Bodies are left out; assume `Stack[T any]` is a generic struct type.)

- A: `func Map[T, U any](s []T, f func(T) U) []U`
- B: `func (s *Stack[T]) Map[U any](f func(T) U) *Stack[U]`
- C: `type Pair[K comparable, V any] struct{ Key K; Val V; Next *Pair[K, V] }`
- D: `type Set[T comparable] map[T]struct{}`

> Methods cannot declare type parameters of their own ("method must have no
> type parameters"); a method may use only the type parameters of its
> receiver's type. A transformation that needs a
> new type `U` has to be a top-level generic function, like A. Generic structs
> may refer to themselves with the same type arguments (C), and a generic type
> may have any underlying type, maps included (D).
