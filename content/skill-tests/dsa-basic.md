---
updated: 2026-10-03
question: What does the Problem Solving (DSA) Basic skill test cover?
answer: It certifies the foundations of data structures and algorithms. Multiple-choice questions cover Big-O analysis, arrays and strings, hashing, linked lists, stacks and queues, sorting and binary search, recursion and memoization, and binary trees. Then you solve easy problems from the coding catalogue in any of the 13 languages the editor supports, graded on hidden test cases with partial credit.
q: Which language should I use in the coding round of the DSA Basic test?
a: The one you make the fewest mistakes in. The round accepts every language the editor offers — Python, Java, C++, JavaScript and nine more — because the test certifies problem solving rather than a language. The short programs in the multiple-choice questions are plain Python that reads like pseudocode, so you can follow them without writing Python yourself.
q: Do I need graphs or dynamic programming for the Basic test?
a: Not as theory. The multiple-choice questions go as far as binary trees and recursion with memoization; graphs, heaps, greedy proofs and table-based dynamic programming are examined at Intermediate. The easy coding problems lean on arrays, strings, hash maps, sorting, two pointers and a little arithmetic, though a problem never tells you which technique it wants.
q: How is the coding round of the DSA Basic test marked?
a: Each problem runs against hidden test cases when you press Submit, and every case your code passes earns its share of the marks, so a solution that handles most inputs still scores. Your best submission for each problem is the one that counts, so resubmitting can only help. Run checks the visible examples and scores nothing by itself.
q: Can I practise on the same kind of coding problems before the test?
a: Yes. The coding round draws easy problems from the same published catalogue you can solve any day, so easy problems there, done against a timer and without opening the editorial, are the closest rehearsal. In the test the statement shows no topic tags, so practise naming the technique yourself before you start typing.
q: Should I take the Basic test before the Intermediate one?
a: You can sit either first; neither requires the other. Basic suits someone who knows the core structures and solves easy problems reliably. If you already solve medium problems and can explain heaps, graph traversals and dynamic programming, go for Intermediate: it is the stronger credential, and it takes the Basic one's place in your avatar frame.
---

The Problem Solving (Basic) test asks two things of you, in order. First, can you reason about the core data structures on paper: say how the running time of a loop grows, what a short routine prints, and which structure suits a job and why. Second, can you turn that reasoning into code that passes a judge's hidden tests. The first half is multiple-choice questions; the second is easy problems from the coding catalogue, in whatever language you write best.

It is the right test once you have worked through arrays, hash maps, linked lists, stacks, queues and binary trees, and can solve an easy problem without looking anything up. Its questions do not cover graph algorithms, heap operations or dynamic-programming tables; those belong to the [Problem Solving (Intermediate) test](/skill-tests/dsa-intermediate).

## What the multiple-choice questions examine

Most questions show a short program in plain Python and ask what it prints or returns, or how its cost grows with the input. Others describe a structure or an algorithm and ask which statement about it holds. A few ask you to select every correct option. By topic:

- **Complexity analysis.** Give the tightest Big-O bound for loops and simple recursive functions by counting how many times the work runs, for time and for memory. [Time and Space Complexity](/roadmap/big-o-notation) covers the method.
- **Arrays and strings.** Index arithmetic without off-by-one errors, in-place updates, and the scanning patterns that replace a quadratic search with a single pass: [two pointers](/roadmap/two-pointers), [prefix sums](/roadmap/prefix-sum) and the [sliding window](/roadmap/sliding-window).
- **Hashing.** Counting and lookups with a map or a set, what a collision is and how a table resolves it, and when hashing's constant time actually holds. [Hashing: Hash Maps and Hash Sets](/roadmap/hashing).
- **Linked lists.** Following and rewiring `next` pointers: traversal, insertion, deletion, reversal, and the cost of each operation next to an array's. [Linked Lists](/roadmap/linked-list).
- **Stacks and queues.** LIFO against FIFO, the problems a stack solves naturally, and what each operation costs. [Stack](/roadmap/stack) and [Queues and Deques](/roadmap/queue).
- **Sorting and searching.** [Binary search](/roadmap/binary-search) and its boundary variants, the best and worst cases of the common sorts, and what a stable sort guarantees. [Sorting Algorithms](/roadmap/sorting-algorithms).
- **Recursion and memoization.** Base cases, tracing a call tree, and spotting the repeated subproblems a cache removes. [Recursion](/roadmap/recursion).
- **Trees and binary search trees.** The three depth-first traversal orders, insertion and search in a BST, and how a tree's shape decides its cost. [Binary Trees](/roadmap/binary-tree) and [Binary Search Tree](/roadmap/binary-search-tree).

## How the coding round works

The coding problems are easy ones from the published catalogue, chosen for your sitting, and you may answer in any of the 13 languages the editor supports. In each language the editor gives you a function to complete, with its parameters and return type already written: the input is parsed and passed in for you, and the value you return is compared with the expected answer, so there is no input reading or output formatting to get wrong. The statement is shown on its own, with no topic tags, hints or links to related problems, so recognising that a problem wants a hash map or two pointers is part of what is being tested.

Run checks your code against the visible examples. Submit runs it against the hidden cases, and each case you pass earns its share of the problem's marks; your best submission per problem stands. That makes the order of work simple: get a correct solution in, even a slower one, then improve it if time allows. A submission that does not compile scores nothing, so a plain loop that works beats a clever one that does not.

The hidden cases go further than the examples. Before you submit, ask what your code does with an empty input, a single element, all-equal values, negative numbers and the largest sizes the statement allows. Pasting into the editor is switched off, and a solution that closely matches the problem's published editorial can be flagged for review, so practise writing your own code from a blank file.

## A preparation path that fits the paper

The [DSA roadmap](/roadmap) covers this ground in order. Its Foundations tier (arrays, hashing, strings, two pointers, sliding window and prefix sums), the Stacks, Binary Search and Sorting & Greedy stages of the Core tier, and the linked-list, recursion and binary-tree lessons are the Basic syllabus; every stage has written lessons and a set of problems to clear. Topic hubs give you more of the same: [arrays](/challenges/arrays), [strings](/challenges/strings), [hash table](/challenges/hash-table), [two pointers](/challenges/two-pointers), [stack](/challenges/stack), [binary search](/challenges/binary-search), [sorting](/challenges/sorting) and [trees](/challenges/trees). For the multiple-choice style, the [Data Structures & Algorithms MCQs](/aptitude/data-structures-mcq) are a good warm-up.

Two habits matter more than the number of problems you solve. Trace by hand: take a five-element input, write down every variable after each pass of the loop, and only then read the answer. The multiple-choice half rewards exactly that care, and it is how you catch your own bugs in the coding half. And say the complexity out loud before you write code: if the plan is O(n²) and the input can be large, find the O(n) idea first.

## Where marks slip away

- **Reading the shape instead of the work.** Two nested loops are not automatically O(n²), and one loop is not automatically O(n); count what the inner work actually does each time round.
- **Tracing in your head.** A program that looks obvious is often the one with an off-by-one in its loop bound. Write the state down.
- **Half-checking a "select all" question.** Only the exact set of correct options scores, so judge every option on its own rather than stopping at the first true one.
- **Saving the submission for the end.** Partial credit is per case and the best submission counts, so an early working answer is insurance, not a commitment.
- **Picking a language for the occasion.** The coding round is not the place to try the language you mean to learn next.

## Sample question
topic: arrays-strings
answer: C
run: python

This program slides a window of `k` consecutive items along a list. What does it print?

```python
nums = [4, -1, 3, 6, -2, 5, 1]
k = 3
window = sum(nums[:k])
best, start = window, 0
for i in range(k, len(nums)):
    window += nums[i] - nums[i - k]
    if window > best:
        best, start = window, i - k + 1
print(best, start)
```

- A: `9 2`
- B: `16 4`
- C: `9 3`
- D: `9 5`

> The windows are [4, -1, 3] = 6, [-1, 3, 6] = 8, [3, 6, -2] = 7, [6, -2, 5] = 9
> and [-2, 5, 1] = 4, so the best sum is 9, in the window that starts at index
> 3. Each step adds the item entering the window and subtracts the one
> leaving it, which is why the whole scan is O(n) rather than O(n · k).
> Forgetting the subtraction lets the window grow to the whole list and gives
> 16; `i - k` is one too small for the start, and `i` is the index of the item
> that just entered, the window's end.
