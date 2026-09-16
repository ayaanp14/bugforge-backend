---
title: The template — running a JavaScript coding round from your side of the table
minutes: 12
---
A coding interview is a forty-five-minute conversation with a program in the middle, and most of it is lost before the first line of code: on a problem misread, an edge case never asked about, a brute force never stated, or a solution typed in silence. This lesson is the template that senior candidates follow without thinking — restate, probe, plan, code aloud, trace, analyse — and the JavaScript-specific decisions you should make before the interviewer has to ask. Nothing here is a trick; it is the order of operations that makes the rest of this module usable under pressure.

## The six steps

1. **Restate** the problem in one sentence in your own words, including the return type. "Given an array of integers and a target, return the indices of the two numbers that sum to it — one answer guaranteed." This catches misreadings immediately and shows you separate the *what* from the *how*.
2. **Probe** — ask the questions that change the solution: input size (does an O(n²) pass?), value ranges (negatives? duplicates? overflow beyond 2⁵³?), empty and single-element inputs, whether the input can be mutated, whether the output order matters, what to return when there is no answer (`-1`, `null`, an empty array, throw?), and — for strings — case, whitespace and Unicode. Write the answers down as **examples**: a normal case, an edge case, and one you expect to trip a naive solution.
3. **Plan aloud** — state the brute force and its complexity first, even when you already see something better ("brute force is every pair, O(n²) time, O(1) space"). Then improve it: what repeated work is there? What data structure removes it? Name the target complexity before coding. If you cannot see an improvement, say what you would try and pick the brute force — a working O(n²) beats a broken O(n).
4. **Code aloud** — narrate the intent of each block, not each character ("I'll count frequencies in a Map, then walk the string once more"). Write helpers as you need them; leave `// TODO` for validation you will return to; do not pause to golf.
5. **Trace** — before declaring done, run your second example through the code line by line with real values in a comment or on the whiteboard. This is where off-by-ones, wrong initial values and a `<` that should be `<=` surface; finding them yourself is worth more than never making them.
6. **Analyse** — time and space, with a sentence of justification ("one pass, constant work per element; the Map holds up to n entries"). Then offer the follow-ups you can see: streaming input, memory limits, concurrency, what changes if the array is sorted.

## Choices to make before you are asked

- **`Map` over an object** for counting or lookup keyed by data: keys keep their type (`1` and `"1"` differ), there is no prototype to collide with, `size` is free, insertion order is preserved. `Set` for membership.
- **Sorting numbers** needs a comparator — `[10, 9, 1].sort()` gives `[1, 10, 9]`. `arr.sort((a, b) => a - b)`, and `localeCompare` for strings when the order must be human.
- **Queues** are an index pointer over an array or two stacks — never `shift()` in a loop (O(n) each; module 15).
- **Strings** are immutable; build output in an array and `join`. Iterate with `for…of` or `[...s]` to get code points, not UTF-16 halves (module 10). Say which one you mean when the problem involves "characters".
- **Integers** are safe to 2⁵³; sums of large arrays, factorials and hashes need `BigInt` or modular arithmetic. Bitwise operators truncate to 32 bits — say so if you use them.
- **Grid and matrix**: `Array.from({ length: rows }, () => Array(cols).fill(0))` — never `Array(rows).fill([])` (one shared row).
- **Recursion** depth is ~10⁴ frames; a DFS over a 10⁶-node graph needs an explicit stack.
- **Mutation**: ask whether you may mutate the input; if not, copy once (`[...arr]`) and say why.
- **Output**: match the requested shape exactly — indices versus values, sorted or not, a string versus an array of strings.

## Templates worth having memorised

```js
// Frequency count
const freq = new Map();
for (const x of items) freq.set(x, (freq.get(x) ?? 0) + 1);

// Two pointers on a sorted array
let lo = 0, hi = arr.length - 1;
while (lo < hi) { const s = arr[lo] + arr[hi]; if (s === target) …; else if (s < target) lo++; else hi--; }

// Sliding window
for (let right = 0, left = 0; right < s.length; right++) {
  add(s[right]);
  while (windowInvalid()) remove(s[left++]);
  best = Math.max(best, right - left + 1);
}

// BFS with an index-pointer queue
const queue = [start]; const seen = new Set([key(start)]);
for (let i = 0; i < queue.length; i++) { const cur = queue[i]; for (const next of neighbours(cur)) if (!seen.has(key(next))) { seen.add(key(next)); queue.push(next); } }

// Memoised recursion
const memo = new Map();
const f = (n) => { if (n < 2) return n; if (memo.has(n)) return memo.get(n); const v = f(n - 1) + f(n - 2); memo.set(n, v); return v; };
```

Each is a shape you fill in, not a solution; the value is that you never spend interview minutes remembering how a sliding window shrinks.

## When stuck

Say so, and say what you know: "I can do this in O(n²); I suspect a hash map removes the inner loop but I'm not sure what to key it on." Then try the standard moves: sort the input and see what becomes easy; walk a small example by hand and watch what you compute repeatedly; think of the problem in reverse; consider what the answer looks like for n = 1 and how it grows. Interviewers give hints to candidates who expose their reasoning; they cannot help a silent one.

## Testing without a runner

You will usually not have a test framework. Write a tiny table at the bottom — `[[input, expected], …]` — and a loop that prints `ok`/`FAIL` with the actual value. Include the edge cases you asked about: empty, single element, all equal, negative, the maximum size you discussed. If you can run code, run it; if you cannot, trace the table by hand. Either way the interviewer sees that testing is part of your definition of done.

## Common mistakes

- Coding before restating; solving the problem you assumed rather than the one posed.
- Skipping the brute force — then having no fallback when the clever idea stalls.
- Typing in silence; abandoning a working approach for an unfinished better one with five minutes left.
- `sort()` without a comparator; `shift()` queues; `Array(n).fill([])`; string indexing where code points matter.
- Declaring done without tracing an example; forgetting to state complexity.

## What the interviewer is listening for

- Whether you separate understanding from solving, and check both.
- Whether you can name the brute force and *why* the better solution is better.
- Whether you know the language: the right structure, the right comparator, the right iteration.
- Whether you test your own code before being asked.
- Whether you communicate under uncertainty — thinking aloud, asking for hints well.

## Key takeaways

- Restate → probe → plan (brute force first) → code aloud → trace → analyse.
- Decide before asked: `Map`/`Set`, numeric comparators, index-pointer queues, code-point iteration, `BigInt` for big sums, `Array.from` grids.
- Keep the five template shapes ready: frequency count, two pointers, sliding window, BFS, memoised recursion.
- When stuck, expose your reasoning and try the standard moves; a working brute force beats a broken optimum.
- Test with a small table of cases including every edge you asked about.
