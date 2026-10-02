---
updated: 2026-10-03
question: What does the Problem Solving (DSA) Intermediate skill test cover?
answer: It certifies that you can choose, justify and implement the right algorithm for a medium-sized problem. Multiple-choice questions examine binary search trees, heaps, graph algorithms, dynamic programming, greedy correctness, amortised and recursive complexity, hash-table internals and advanced searching and sorting. Then you solve medium problems from the coding catalogue in any of the 13 supported languages, judged on hidden test cases with partial credit.
q: Which algorithms should I be able to write from memory for the DSA Intermediate test?
a: Breadth-first and depth-first search, Dijkstra's algorithm with a priority queue, a topological sort, union-find, binary search over a range of candidate answers, and one- and two-dimensional dynamic-programming tables. Pasting is switched off in the coding round, so each has to come out of your head cleanly, with its boundary conditions right.
q: The code in the questions is Python. What if Python is not my language?
a: You can still read it. The programs are short and use only a handful of library helpers: heapq for a binary min-heap kept in a list, deque for a queue with fast removal at the front, bisect for binary search on a sorted list, and float("inf") as infinity. Learn what those do and the rest reads like pseudocode. The coding round accepts any language.
q: Does a correct but slow solution earn any marks?
a: Some. Every hidden case your code passes earns its share of the marks, and your best submission per problem counts, so a working brute force is worth submitting early. But the hidden cases run in large batches on a shared time budget: a run stopped for time scores nothing for the cases it had not reached, so at this level the intended complexity is part of the answer.
q: How much dynamic programming does the Intermediate test expect?
a: The classic families rather than exotic variants: subsequences, knapsack, counting paths and ways, string distances. You should be able to define a state, write its recurrence, decide which entries must be filled first, and say what the whole table costs. In the coding round, a medium problem may need a table you design yourself from the statement.
q: Is Java or C++ a safer choice than Python for the coding round?
a: Choose the language you are fluent in. The judge gives no language extra time, so Python pays its constant factor on heavy loops, but at medium level the gap between an O(n log n) and an O(n²) idea decides far more cases than the language does. Deep recursion is the one thing to plan for in Python.
---

Intermediate problem solving is less about knowing a structure and more about choosing between several, and being able to say why the choice is right. The concepts section hands you an algorithm, a recurrence or a claim about one and asks what it produces, what it costs, or whether it holds. The coding section then gives you medium problems from the catalogue, where the first idea that comes to mind is often too slow and the right one has to be found and written without help.

Sit it when a medium problem takes you one solid attempt rather than three, and when you can explain an algorithm's correctness as well as its steps. If arrays, hashing, linked lists and stacks still feel shaky, start with the [Problem Solving (Basic) test](/skill-tests/dsa-basic); neither level requires the other.

## What the concepts section asks

Questions are short and exact: a few lines of code to trace, a structure built up step by step, a recurrence to solve, or a statement about an algorithm to accept or reject. Several ask you to pick every correct option. Expect to be asked why as often as what.

- **Trees and binary search trees.** Insertion, deletion, search and validation in a BST, traversals by depth and by level, and what keeps a tree shallow or lets it degrade. [Binary Trees](/roadmap/binary-tree) and [Binary Search Tree](/roadmap/binary-search-tree).
- **Heaps.** How a binary heap lives in an array and restores its order, what each operation costs, and the problems a priority queue makes easy, such as top-k and merging sorted streams. [Heaps and Priority Queues](/roadmap/heap).
- **Graphs.** What [breadth-first](/roadmap/breadth-first-search) and [depth-first search](/roadmap/depth-first-search) each guarantee, shortest paths with and without weights ([Dijkstra's Algorithm](/roadmap/dijkstras-algorithm)), ordering tasks under dependencies ([Topological Sort](/roadmap/topological-sort)), connectivity with [Union-Find](/roadmap/union-find), and [minimum spanning trees](/roadmap/minimum-spanning-tree).
- **Recursion and dynamic programming.** Turning a recursion into a table: the state, what each entry depends on, and what the whole computation costs, across the sequence, [knapsack](/roadmap/knapsack-problem) and counting families. [Dynamic Programming](/roadmap/dynamic-programming), [Longest Common Subsequence](/roadmap/longest-common-subsequence) and [Longest Increasing Subsequence](/roadmap/longest-increasing-subsequence).
- **Greedy algorithms.** When the locally best choice is provably optimal, how an exchange argument shows it, and how to find the input that breaks a plausible rule. [Greedy Algorithms](/roadmap/greedy-algorithms).
- **Complexity.** Amortised cost, the recurrences of divide-and-conquer algorithms, and the lower bounds that say an algorithm cannot be beaten. [Time and Space Complexity](/roadmap/big-o-notation).
- **Hashing.** What happens inside a hash table as it fills, and how chaining and open addressing behave differently. [Hashing](/roadmap/hashing).
- **Sorting and searching.** Binary search beyond a sorted array ([Binary Search on the Answer](/roadmap/binary-search-on-answer)), selection without a full sort, stability, and the sorts that beat O(n log n) on special keys. [Sorting Algorithms](/roadmap/sorting-algorithms).

## Medium problems under the clock

The coding problems are medium ones from the published catalogue, chosen for your sitting, and you may answer in any of the 13 languages the editor offers. A medium problem usually joins two ideas: sort and then sweep, search a grid breadth-first, binary-search an answer with a greedy check inside, or fill a table over prefixes. The statement carries no topic tags and no hints, so naming the technique is the first part of the work. As in the practice workbench, you complete a function whose signature is given and return the answer; the judge supplies the input.

Spend the first minutes on a plan. Read the input limits, decide what complexity they allow, and write the approach as two or three comments before any code. Then get a correct version submitted, because each hidden case you pass earns its share and your best submission per problem stands; improve it afterwards if time allows. Keep in mind that the hidden cases run in large batches, each on one time budget: a solution that is far too slow can be stopped part-way through, and every case it had not reached scores nothing.

Expect the hidden cases to probe what easy problems forgive: graphs that are disconnected or contain cycles, repeated keys and ties, empty ranges, and chains long enough to overflow a deep recursion. In Python the default recursion limit is about a thousand frames, so a depth-first search over a long path is safer with an explicit stack. Pasting into the editor is switched off, and code that closely matches the problem's published editorial can be flagged for review.

## A study plan built on the roadmap

The [DSA roadmap](/roadmap) teaches this level in its later stages: Heaps, Intervals and Sorting & Greedy in the Core tier, the two graph stages in the Advanced tier, and Dynamic Programming I and II in Mastery. Each stage has written lessons, problems to clear, and a chest at the end of its tier. For more practice on one technique, the topic hubs order their problems from easy to hard: [heap](/challenges/heap), [graph](/challenges/graph), [breadth-first search](/challenges/breadth-first-search), [depth-first search](/challenges/depth-first-search), [shortest path](/challenges/shortest-path), [topological sort](/challenges/topological-sort), [union-find](/challenges/union-find), [minimum spanning tree](/challenges/minimum-spanning-tree), [dynamic programming](/challenges/dynamic-programming), [memoization](/challenges/memoization), [greedy](/challenges/greedy), [intervals](/challenges/intervals) and [binary search](/challenges/binary-search).

Two habits turn practice into the kind of understanding the concepts section examines. After each medium problem you solve, write one sentence on why the approach is correct (the invariant, the exchange argument or the recurrence) and one on its running time. And for each algorithm you learn, find out what kind of input it was not built for; knowing where a technique stops working is half of knowing when to reach for it.

## Sample question
topic: trees
answer: B
run: python

`height` returns the number of nodes on the longest downward path from a node and records something else along the way. What does this program print?

```python
class Node:
    def __init__(self, name, left=None, right=None):
        self.name, self.left, self.right = name, left, right

root = Node("A",
            Node("B",
                 Node("D", Node("F", Node("G"))),
                 Node("E", None, Node("H", None, Node("I")))),
            Node("C"))

best = 0

def height(node):
    global best
    if node is None:
        return 0
    left = height(node.left)
    right = height(node.right)
    best = max(best, left + right)
    return 1 + max(left, right)

height(root)
print(best)
```

- A: `5`
- B: `6`
- C: `7`
- D: `4`

> At each node, `left + right` is the number of edges on the longest path that
> bends there, and `best` keeps the largest: the tree's diameter. The longest
> path is G–F–D–B–E–H–I, six edges, and it bends at B, not at the root. 5 is
> the longest path through the root (B's height 4 plus C's height 1), the
> answer you get by checking only the root. 7 counts the nodes on the path
> instead of its edges, and 4 is the root's height in edges. Returning one
> value while recording another is the pattern behind most tree problems of
> this kind; the whole walk is O(n).
