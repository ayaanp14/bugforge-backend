# Writing a roadmap lesson

The DSA roadmap's lessons are the tutorials behind its stages: one Markdown
file per lesson in this folder, served at `/roadmap/<file name>` to everyone
(signed in or not), indexed by search engines, and drawn with the road as its
sidebar. Files whose name starts with `_` (this one) are not lessons.
`two-pointers.md` is the reference lesson — read it before writing one.

The rules below are enforced by `src/lib/roadmap-lessons.ts` and the gate:

```
npx tsx scripts/roadmap-lessons.ts --validate --only <slug>      # structure, links, practice slugs
npx tsx scripts/roadmap-lessons.ts --run --only <slug> --workers 2   # every program on the judge
npx tsx scripts/roadmap-lessons.ts --problems "Sliding Window"   # catalogue problems with a tag
npx tsx scripts/roadmap-lessons.ts --syllabus                    # the road with its lessons
```

A lesson is done when both `--validate` and `--run` pass for it.

## Who reads it

Someone who searched "sliding window technique" or "what is a greedy
algorithm" — a student preparing for placements or a first interview, who
knows one programming language and basic loops and arrays, and has never
seen this technique. They want the idea, why it works, code they can run, and
what to practise. The page should be the best answer on the web for its
topic: clearer than the tutorial sites, with proofs of *why* where they help,
and every program actually run.

## Frontmatter

Between `---` lines, one `key: value` per line, no quotes, no line breaks
inside a value:

| Key | Rule |
| --- | --- |
| `title` | The lesson's name as the H1 shows it ("Sliding Window Technique"). Unique. |
| `stage` | The road stage key it belongs to (`scripts/roadmap-data.ts`). |
| `order` | 1, 2, 3 … within the stage. |
| `minutes` | Honest reading time: about 200 words a minute plus time for the code. |
| `level` | `Beginner`, `Intermediate` or `Advanced`. |
| `hub` | The `/challenges/<slug>` topic it practises (`TOPIC_HUBS` in `src/lib/problem-topics.ts`). Optional, but needed for `@walkthrough`. |
| `practice` | 6–9 catalogue slugs, comma-separated, easiest first. Pick them with `--problems "<Tag>"`. 3 is the minimum, 10 the maximum. |
| `updated` | Today's date, `YYYY-MM-DD`. |
| `seo-title` | ≤ 60 characters. Leads with the term people search ("Sliding Window Technique: …"). Unique across lessons. Must not read like the hub's title ("… Coding Problems"). |
| `description` | 110–158 characters. What the reader learns, naming the four languages when it fits. Unique. |
| `question` | The question the page answers ("What is the sliding window technique?"). |
| `answer` | 25–80 words (aim for 45–65), one paragraph, the direct answer a search result could quote: definition, how it works, its cost. |
| `q` / `a` | Four to eight pairs (aim for five) of real questions people ask about the topic, each answered in two to four sentences. One line each. |

## Body

Markdown after the frontmatter. At least **1,200 words of prose** (code does
not count; aim for 1,600–2,400) and at least **six `##` sections**. Never a
`# ` heading — the page has its own H1. The reference lesson's shape works for
almost every topic:

1. An opening paragraph or two (no heading): the problem the technique solves, in plain words.
2. `## Why …` — the naive approach and its cost, with a number (n = 10⁵ → 5 × 10⁹ steps).
3. `## The idea …` — the technique in one picture (a `text` fence diagram) and a short list of its rules.
4. `@walkthrough` on its own line — the hub's animated step-by-step figure. Put it right after the idea section. Only if the lesson has a `hub`.
5. `## Why it works` — the invariant or exchange argument, in plain words. This is what tutorial sites skip; do not.
6. `### Dry run` — a table tracing the example step by step.
7. `### The code` — a code group (below).
8. Variations / other shapes of the idea, each with a link to a catalogue problem that uses it.
9. `## Time and space complexity` — a table comparing approaches.
10. `## How to recognise …` — the signals in a problem statement.
11. `## Common mistakes` — four to six real pitfalls.
12. `## Practice in this order` — a numbered list of the practice problems with one line each on what it teaches, then a link to the hub (`/challenges/<hub>`).

Topics that are data structures (linked list, stack, heap, trie, graph) swap
"why it works" for "how it is stored" and "the operations and their cost";
keep the rest.

### Code groups

Every code example is the **same whole program in four languages**: four
consecutive fences, in exactly this order, then the output:

````
```cpp
…
```

```java
…
```

```python
…
```

```javascript
…
```

```output
exactly what every one of the four programs prints
```
````

- Whole programs with a `main`: the C++ includes what it uses (`<iostream>`, `<vector>`, … — not `<bits/stdc++.h>`), the Java class is `public class Main`, Python and JavaScript run top to bottom.
- No input: hard-code the example. Every program prints the same lines, character for character, and the `output` fence shows them.
- Portable features only: C++17; Java 11 (no records, text blocks, `var` is fine); Python 3.8 (no `match`, no `list[int]` annotations needed); JavaScript as Node 16 runs it (no `structuredClone`, `toSorted`, `findLast`).
- At most 90 lines each; aim for 25–60. Name things as the prose names them, comment the line that carries the idea, and keep the four programs line-for-line parallel so a reader can switch tabs and compare.
- Deterministic output: no hash-set iteration order, no floating point printed without fixed formatting, no randomness.
- Two or three groups per lesson is right: the core technique, then the main variation.
- Pseudocode, diagrams and traces go in `text` fences, which are never run.

## Style

- British English, plain and direct, like the rest of the site ("practise" the verb, "colour"). Second person. No hype, no "In this article we will", no emoji.
- Explain *why*, not just *what*: every rule the code follows should have its reason in the prose.
- Lists are one level deep (no nested bullets). Tables are fine. Bold for the term being defined.
- No bare asterisks in prose — write multiplication as × and put any operator with `*` inside backticks. Exponents: 10⁵, n², 2ⁿ, O(n log n).
- Links: catalogue problems as `/problems/<slug>`, topic hubs as `/challenges/<slug>`, other lessons as `/roadmap/<slug>`. Link each related lesson where it is first mentioned. Planned lesson slugs (link freely — the gate reports a link to one not yet written, which is fine until it is):

  big-o-notation, arrays, hashing, strings, two-pointers, sliding-window,
  prefix-sum, kadanes-algorithm, linked-list, stack, queue, monotonic-stack,
  binary-search, binary-search-on-answer, sorting-algorithms,
  greedy-algorithms, intervals, binary-tree, binary-search-tree, heap, trie,
  matrix, bit-manipulation, recursion, backtracking, graphs,
  breadth-first-search, depth-first-search, topological-sort, union-find,
  dijkstras-algorithm, minimum-spanning-tree, dynamic-programming,
  longest-increasing-subsequence, knapsack-problem, longest-common-subsequence

- Never write `__CODEXA_` anywhere.
- Facts must be true. If a claim is about complexity, it is the standard one; if it is about a library (`std::priority_queue` is a max-heap, Python's `heapq` is a min-heap), check it.
