---
title: Recursion — base cases, the call stack and memoisation
minutes: 15
---
A function may call itself. Used well, recursion turns a problem into a smaller copy of the same problem plus one step of work, and the code reads like the definition — a factorial, a tree walk, a flood fill, a permutation generator. Used carelessly, it is a stack overflow or an exponential run time. This lesson settles what every recursive function needs, what the call stack does and how deep it may go, when a loop is the better form, how a memo turns an exponential recursion into a linear one, and the recursion shapes interviews ask for.

## The two cases

```cpp
long long factorial(int n) {
    if (n <= 1) return 1;                // base case: an answer with no further calls
    return n * factorial(n - 1);         // recursive case: a smaller problem, plus one step
}
```

Every recursive function has a **base case** — an input answered directly — and a **recursive case** that calls the function on an input strictly closer to the base. Miss either and the recursion never ends. The base case here is `n <= 1` rather than `n == 1` so that `factorial(0)` and a negative `n` both stop instead of running away towards `INT_MIN`.

The recursive call is an ordinary call. `factorial(4)` evaluates `4 * factorial(3)`, which waits for `factorial(3)`, which waits for `factorial(2)`, and so on down to `factorial(1)`; the products are then computed on the way back up:

```text
factorial(4)
  factorial(3)
    factorial(2)
      factorial(1) -> 1
    -> 2 * 1 = 2
  -> 3 * 2 = 6
-> 4 * 6 = 24
```

## The call stack

Each call gets a **frame**: its parameters, its local variables and the address to return to, pushed on the stack and popped on return (Module 7, lesson 1 draws the picture). In the trace above four frames of `factorial` exist at once, each with its own `n` — that is why recursion works, and it is what limits it.

The stack is finite — 8 MB on the judge and on a typical Linux machine; a frame for a small function is a few dozen bytes, so a hundred thousand frames is fine and a hundred million is not. Overflowing it is not an exception you can catch — the process dies with a segmentation fault. You get there by a missing or unreachable base case (infinite recursion), which is a bug, or by a correct recursion on an input too large for it (a list of ten million nodes walked recursively), which is a signal to write a loop.

## Recursive or iterative?

Any recursion can be rewritten as a loop, sometimes with an explicit stack of your own. For **linear** problems — sum a range, count digits, compute a factorial or a Fibonacci number — the loop (`for (int i = 2; i <= n; ++i) result *= i;`) is shorter, faster and cannot overflow the stack.

Recursion earns its place on **branching** problems, where each call spawns several: walking a tree or directory, generating permutations and subsets, flood-filling a region, divide and conquer (merge sort, binary search), parsing nested expressions. There a loop needs an explicit stack that reproduces what the call stack gave you for free.

## Exponential blow-up and memoisation

```cpp
long long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
```

This is a correct definition and a terrible program. `fib(n)` calls `fib(n - 1)` and `fib(n - 2)`, each of which repeats most of the other's work; the number of calls is 2 × fib(n + 1) − 1, so `fib(40)` makes over 330 million calls and `fib(50)` would take hours — the same subproblems computed again and again.

**Memoisation** stores each result the first time it is computed:

```cpp
long long fib(int n, std::vector<long long>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];          // already known
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return memo[n];
}

std::vector<long long> memo(91, -1);            // fib(90) is the largest that fits a long long
std::cout << fib(90, memo) << '\n';
```

Now every `n` is computed once: linear time, `n` frames deep at most. The memo is passed by reference — by value it would be copied on every call and the results written into a copy that is thrown away. A `std::vector` is the memo when the argument is a small non-negative integer; when the argument space is sparse, negative, or a pair of numbers, use `std::map<Key, long long>` (Module 13, lesson 4) with the same look-up-else-compute-and-store shape. Filling the table bottom-up with a loop is the same idea under the name dynamic programming.

## Tail calls

A call in **tail position** is the last thing the function does, with nothing left to compute afterwards:

```cpp
long long sumTo(int n, long long acc) {
    if (n == 0) return acc;
    return sumTo(n - 1, acc + n);        // tail call: nothing to do after it returns
}
```

A compiler *may* turn this into a jump that reuses the frame, and GCC and Clang at `-O2` often do; the C++ standard does not require it, and a debug build will not do it. A recursion that only works because the optimiser removed the frames is a stack overflow waiting for a different flag. Write the loop.

## Recursion over a structure

The shapes worth knowing by heart:

**A number's digits.** `digitSum(n)` is `n % 10 + digitSum(n / 10)`, with base case `n == 0`.

**Permutations, by swapping into position.** Fix the character at position `k` by trying each of the remaining ones there, recurse on `k + 1`, then swap back so the next choice starts from the same state:

```cpp
void permute(std::string& s, std::size_t k, std::vector<std::string>& out) {
    if (k == s.size()) { out.push_back(s); return; }
    for (std::size_t i = k; i < s.size(); ++i) {
        std::swap(s[k], s[i]);
        permute(s, k + 1, out);
        std::swap(s[k], s[i]);           // undo, or the later iterations see a scrambled s
    }
}
```

**Flood fill on a grid.** Count the cells of a region by marking the current cell and adding the results of the four neighbours; bounds and "already visited" are the base cases:

```cpp
int fill(std::vector<std::string>& g, int r, int c) {
    if (r < 0 || c < 0 || r >= static_cast<int>(g.size()) || c >= static_cast<int>(g[0].size())) return 0;
    if (g[r][c] != '.') return 0;        // wall, or already filled
    g[r][c] = '#';                       // mark BEFORE recursing
    return 1 + fill(g, r + 1, c) + fill(g, r - 1, c) + fill(g, r, c + 1) + fill(g, r, c - 1);
}
```

The depth of a flood fill is the size of the region in the worst case (a snake-shaped corridor), so a 1 000 × 1 000 open grid can reach a million frames — an explicit queue (breadth-first search, Module 13, lesson 3) is the production form. On a 30 × 30 grid the recursion is exactly right.

## Pitfalls

- **No base case, or one the input never reaches** — `factorial(-1)` with `n == 0` as the only stop. Segmentation fault.
- **Marking after recursing** in a fill or a graph walk: the neighbour visits you back before you are marked, forever.
- **Overflow, not recursion, is the limit.** `factorial(21)` and `fib(93)` overflow `long long` long before the stack runs out; signed overflow is undefined behaviour, not a wrong answer you can detect afterwards.
- **The memo passed by value.** It compiles, it runs, it is exponential again — and slower than before, because now it copies a vector per call.

## Key takeaways

- A recursive function needs a base case and a recursive case that moves strictly towards it.
- Each call is a frame on a finite stack; a missing base case or a too-deep linear recursion is a crash, not an exception.
- Loops for linear problems; recursion for branching ones — trees, permutations, fills, divide and conquer.
- Memoise overlapping subproblems with a `std::vector` (dense integer keys) or `std::map` (sparse or composite keys), passed by reference.
- Tail-call elimination is an optimisation, not a guarantee; never let correctness depend on it.
