---
title: The interview template — the round, the file, fast I/O and what is actually judged
minutes: 14
---
Nineteen modules taught the language; this one teaches the round. A Python interview or contest problem is conducted in a fixed rhythm — clarify, example, brute force, complexity, better idea, code, test — and judged on things that are only partly about Python: whether you asked about the edge cases, whether you named the complexity before coding, whether the code you wrote can be read aloud. This lesson gives the rhythm, the file template that every judged solution starts from (fast input, `main`, the recursion limit, batched output), the cost of each line so you can defend it, and the list of what the person across the table is actually scoring.

## The rhythm of a round

1. **Restate** the problem in one sentence and confirm it. Ask the questions that change the algorithm: sizes (n up to 10⁵ or 10⁹?), value ranges, duplicates, empty input, sorted or not, what to return on ties.
2. **Work an example** by hand — the one given, then a small one you make up with an edge in it.
3. **Say the brute force** and its complexity aloud, even if you will not write it: it shows you understand the problem and gives a baseline.
4. **Find the better idea** by naming the shape (lesson 2): "this is a sliding window", "this is a frequency count then a heap", "this is a graph and BFS".
5. **State the complexity** of the plan before typing. If n is 10⁵ and the plan is O(n²), say so and keep thinking.
6. **Code** top-down: `main` reads and prints, a helper does the work, the helper's name is the idea.
7. **Test** by tracing your own example through the code, then the edges: empty, one element, all equal, the boundary.

Silence is the failure mode; narrating the steps above is most of the score.

## The file template

```python
import sys
from collections import Counter, defaultdict, deque
from functools import cache
from heapq import heappush, heappop
from bisect import bisect_left, bisect_right

def solve(nums: list[int]) -> int:
    ...

def main() -> None:
    data = sys.stdin.buffer.read().split()          # every token, once
    n = int(data[0])
    nums = list(map(int, data[1:n + 1]))
    print(solve(nums))

if __name__ == "__main__":
    sys.setrecursionlimit(1_000_000)
    main()
```

Each line has a reason you should be able to give:

- `sys.stdin.buffer.read().split()` reads the whole input as bytes and splits on whitespace: one system call, no decoding, `int(b"42")` works directly. For 10⁵ lines it is ten times faster than `input()` in a loop. When lines matter (a grid, text with spaces), use `sys.stdin.read().splitlines()` instead, or `sys.stdin.readline` for a mixed format.
- `main()` keeps the work out of module scope: locals are faster than globals (Module 19) and the function can be imported and tested.
- `sys.setrecursionlimit(1_000_000)` allows deep recursion (a DFS on 10⁵ nodes); the default 1000 raises `RecursionError` on the first tree deeper than that. On a small C stack a very deep recursion can still crash, so an iterative DFS with an explicit stack is the safer answer for the largest inputs.
- The imports are the ones you reach for without thinking; unused imports cost nothing and save a scroll.
- Output: build a list of strings and `print("\n".join(out))` or `sys.stdout.write` once. `print` per line is a system call per line.

## Reading the formats

| Format | Read with |
| --- | --- |
| `n` then `n` ints on one line | `data = read().split(); n = int(data[0]); nums = map(int, data[1:n+1])` |
| `n` lines of `a b` | tokens in pairs: `zip(it, it)` over an iterator of the tokens |
| a grid of characters | `lines = sys.stdin.read().split()` — rows have no spaces |
| lines with spaces | `sys.stdin.read().splitlines()` |
| until EOF | `for line in sys.stdin:` |
| a single line of words | `input().split()` |

`it = iter(map(int, data)); n = next(it)` then `next(it)` per value is the cleanest way to walk a token stream with a mixed layout.

## The costs, honestly

Fast I/O matters only when the input is large: for ten lines, `input()` is fine and clearer. The recursion limit matters only for recursive solutions on deep structures. `main()` matters always. The wildcard imports and one-letter names of contest code cost readability that an interviewer is scoring, so the template is a middle path: the fast lines, standard names, and a solve function whose signature says what it does.

## What is judged

- Did you clarify sizes and edges before designing?
- Did you name the brute force and its complexity?
- Did you name the shape and the data structure, and the complexity of the plan?
- Is the code readable aloud: a `solve` with a good name, helpers, no globals, no clever one-liners?
- Did you test with your own example and the edges without being asked?
- Did you handle the edge that was in the question (empty, one element, negative, duplicates)?
- Can you say what you would change for 10× the input, or for production?

Correctness is necessary and not sufficient; a working solution with none of the above scores lower than a nearly working one with all of them.

## Pitfalls

- Starting to type before restating the problem.
- `input()` in a loop over 10⁵ lines.
- Recursion on 10⁵-deep structures without raising the limit — or with it, on a machine with a small stack.
- Printing inside the loop that computes, then being unable to test the function.
- Not asking what to do on ties or empty input, then guessing wrong.
- Ending without testing an edge case.

## Key takeaways

- The rhythm: restate, example, brute force, shape, complexity, code, test — narrated aloud.
- The template: read all tokens once, `main` plus a `solve`, the recursion limit when recursing, batched output.
- Every template line has a cost and a reason; use the fast lines when the input is large and say why.
- Mixed input layouts are walked with an iterator over the tokens.
- The score is clarification, complexity, readability and testing — not just a green check.
