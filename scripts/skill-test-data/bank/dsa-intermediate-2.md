---
skill: dsa
level: intermediate
---

## dsa-intermediate-024
topic: recursion-dp
answer: A

In the edit-distance table, `dp[i][j]` is the minimum number of single-character insertions, deletions and substitutions that turn the first i characters of s into the first j characters of t. When `s[i-1] != t[j-1]`, which recurrence is correct?

- A: `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`
- B: `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1])`
- C: `dp[i][j] = 1 + dp[i-1][j-1]`
- D: `dp[i][j] = 1 + max(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`

> The last operation is one of three, each costing 1: delete s[i-1] (leaving
> `dp[i-1][j]`), insert t[j-1] (leaving `dp[i][j-1]`), or substitute s[i-1]
> by t[j-1] (leaving `dp[i-1][j-1]`); take the cheapest. B forbids
> substitution, which gives the insert/delete-only distance instead. C only
> ever substitutes, so it cannot use a deletion: for "bca" → "bc" it gives 3
> instead of 1. Taking the max (D) picks the worst option, not the best.

## dsa-intermediate-025
topic: recursion-dp
answer: A

Memoization speeds up a recursive algorithm only when the recursion keeps solving the same subproblems. For which of these does adding memoization NOT improve the asymptotic running time?

- A: Merge sort
- B: Naive recursive Fibonacci
- C: Counting monotone paths through a grid by recursion on (row, column)
- D: Edit distance by recursion on the prefix lengths (i, j)

> Merge sort's two recursive calls work on disjoint halves, and no subarray is
> ever sorted twice, so a memo table would never be hit: divide and conquer
> without overlapping subproblems. The other three revisit the same arguments
> again and again: Fibonacci drops from exponential to O(n), and the grid-path
> and edit-distance recursions drop from exponential to O(rows × columns) and
> O(m × n), one evaluation per distinct (i, j).

## dsa-intermediate-026
topic: recursion-dp
answer: D

For the longest palindromic subsequence of a string of length n, `dp[i][j]` (for i < j) is computed from `dp[i+1][j-1]`, `dp[i+1][j]` and `dp[i][j-1]`; the diagonal `dp[i][i] = 1` is filled in first. Which loop order guarantees that every value is ready before it is read?

- A: i from 0 up to n-1; inside it, j from i+1 up to n-1
- B: i from 0 up to n-1; inside it, j from n-1 down to i+1
- C: j from n-1 down to 1; inside it, i from 0 up to j-1
- D: i from n-1 down to 0; inside it, j from i+1 up to n-1

> Each cell reads row i+1, so rows must be finished from the bottom up (i
> descending), and it reads `dp[i][j-1]` to its left in the same row, so within
> a row j must ascend. D does both. A and B fill row i before row i+1 exists.
> C sweeps columns from the right, so the column j-1 that `dp[i][j-1]` lives in
> has not been filled yet. (Filling by increasing substring length also works.)

## dsa-intermediate-027
topic: recursion-dp
answer: D

A memoized function f(i, k) is defined for 0 ≤ i < n and 0 ≤ k ≤ K. Apart from its recursive calls, each evaluation runs a loop over every index from i + 1 to n − 1, doing constant work per index. With memoization, and with every state ending up evaluated, what is the total running time?

- A: Θ(n · K)
- B: Θ(n · K²)
- C: Θ(2ⁿ)
- D: Θ(n² · K)

> With memoization each of the n · (K + 1) states is evaluated once; any later
> call with the same arguments is an O(1) lookup. An evaluation at index i
> loops n − 1 − i times, which averages about n/2 over the states, so the total
> is states × work per state = Θ(n · K · n) = Θ(n² · K). Θ(n · K) counts the
> states but forgets the loop inside each one; Θ(2ⁿ) is what this kind of
> recursion can cost without the memo.

## dsa-intermediate-028
topic: greedy
answer: C

To choose as many pairwise non-overlapping intervals as possible, a greedy algorithm sorts the intervals by some rule and then takes each one that does not overlap those already taken. Which rule makes the result optimal for every input?

- A: By start time, earliest first
- B: By length, shortest first
- C: By end time, earliest first
- D: By how many other intervals each one overlaps, fewest first

> Taking the interval that ends first leaves the most room for the rest, and
> an exchange argument shows it never hurts: any optimal solution's first
> interval can be replaced by the earliest-ending one. Earliest start fails on
> [0, 10), [1, 2), [3, 4): it takes the long one and gets 1 instead of 2.
> Shortest first fails on [0, 5), [4, 7), [6, 11): the short middle interval
> blocks both others. Fewest overlaps also fails, on a larger input where an
> interval with only two conflicts knocks out two members of the only maximum
> set.

## dsa-intermediate-029
topic: greedy
answer: B
run: python

This program counts coins for the amount 6 twice: greedily (largest coin first) and with dynamic programming. What does it print?

```python
coins = [1, 3, 4]
amount = 6

greedy, left = 0, amount
for c in sorted(coins, reverse=True):
    greedy += left // c
    left %= c

INF = float("inf")
best = [0] + [INF] * amount
for a in range(1, amount + 1):
    for c in coins:
        if c <= a and best[a - c] + 1 < best[a]:
            best[a] = best[a - c] + 1
print(greedy, best[amount])
```

- A: `2 2`
- B: `3 2`
- C: `3 3`
- D: `2 3`

> Greedy takes a 4, then cannot use a 3 for the remaining 2, so it takes two
> 1s: 3 coins. The DP considers every last coin and finds 3 + 3: 2 coins. With
> the coin system {1, 3, 4} the largest-coin-first rule is not optimal, so the
> two counts differ; the DP is always right, the greedy only for some coin
> systems.

## dsa-intermediate-030
topic: greedy
answer: B

For which coin system does "always take the largest coin that fits" give the minimum number of coins for every amount?

- A: {1, 6, 10}
- B: {1, 2, 5, 10}
- C: {1, 4, 5}
- D: {1, 5, 10, 20, 25}

> {1, 2, 5, 10} is canonical: an optimal answer never holds two 1s (use a 2),
> three 2s (5 + 1), two 2s and a 1 (a 5) or two 5s (a 10), so its coins below
> 10 total at most 9 and its coins below 5 at most 4. It therefore uses exactly
> as many 10s, 5s and 2s as the greedy does. Each other system has a
> counterexample: {1, 6, 10} on 12 (6 + 6 beats 10 + 1 + 1), {1, 4, 5} on 8
> (4 + 4 beats 5 + 1 + 1 + 1), and {1, 5, 10, 20, 25} on 40 (20 + 20 beats
> 25 + 10 + 5). Adding a coin can break a system that was canonical without
> it. For an arbitrary coin system you need the DP.

## dsa-intermediate-031
topic: greedy
answer: A, C, E

For which of these problems does the greedy strategy described always give an optimal answer? Select all that apply.

- A: Fractional knapsack: take items in decreasing value-per-weight order, splitting the last one to fill the bag
- B: 0/1 knapsack: take whole items in decreasing value-per-weight order while they still fit
- C: Optimal prefix code: repeatedly merge the two least frequent symbols (Huffman coding)
- D: Fewest coins for any coin system: always take the largest coin that fits
- E: Minimum spanning tree: repeatedly add the cheapest edge that does not form a cycle

> Fractional knapsack, Huffman coding and Kruskal's algorithm all have
> exchange-argument proofs: swapping the greedy choice into any optimal
> solution never makes it worse. In fractional knapsack any capacity not spent
> on the best ratio can be moved to it. 0/1 knapsack breaks because items
> cannot be split: capacity 10 with items (weight 6, value 7), (5, 5), (5, 5) —
> the best ratio takes the 6 for value 7, while the two 5s give 10. The coin
> rule fails for {1, 3, 4} at amount 6.

## dsa-intermediate-032
topic: greedy
answer: B

Four jobs with durations 4, 2, 7 and 1 run one at a time on a single machine, all available at time 0. A job's completion time is the moment it finishes. What is the smallest possible sum of the four completion times?

- A: 14
- B: 25
- C: 37
- D: 45

> Run the shortest job first: 1, 2, 4, 7 finish at 1, 3, 7 and 14, which sum to
> 25. A job's duration is added to the completion time of itself and of every
> job after it, so the short ones belong in front (swapping any longer job ahead
> of a shorter one only raises the sum). 14 is when the last job finishes,
> whatever the order; 37 is the order as listed (4, 6, 13, 14), and 45 is
> longest first (7, 11, 13, 14).

## dsa-intermediate-033
topic: complexity
answer: D

A dynamic array starts empty. Whenever it is full, it allocates a new buffer 100 slots larger and copies every element across. What is the total cost of n appends?

- A: Θ(n)
- B: Θ(n log n)
- C: Θ(n√n)
- D: Θ(n²)

> Copies happen at sizes 100, 200, 300, … up to n, and the copy at size 100k
> moves 100k elements, so the total is 100 · (1 + 2 + … + n/100), roughly
> n²/200: Θ(n²), or Θ(n) per append on average. Growing by a constant only
> divides the cost by that constant. Growing by a constant *factor* (doubling)
> is what makes the copies sum to less than 2n, Θ(n) in total and O(1)
> amortized per append.

## dsa-intermediate-034
topic: complexity
answer: A
run: python

This program simulates appending 17 elements to a dynamic array that starts with capacity 1 and doubles when it is full, counting the elements copied. What does it print?

```python
capacity, size, copies = 1, 0, 0
for _ in range(17):
    if size == capacity:
        copies += size
        capacity *= 2
    size += 1
print(copies, capacity)
```

- A: `31 32`
- B: `16 32`
- C: `136 32`
- D: `31 16`

> The array is full, and copies all its elements, when the size reaches 1, 2,
> 4, 8 and 16, so 1 + 2 + 4 + 8 + 16 = 31 copies, and the capacity ends at 32.
> 31 copies for 17 appends: with doubling, the copies always total less than
> twice the number of appends, which is why an append is O(1) amortized. 136
> (1 + 2 + … + 16) is what copying on every append would cost.

## dsa-intermediate-035
topic: complexity
answer: A, D

Which of these recurrences solve to Θ(n log n)? Select all that apply.

- A: T(n) = 2T(n/2) + n
- B: T(n) = T(n/2) + n
- C: T(n) = 4T(n/2) + n
- D: T(n) = 3T(n/3) + n
- E: T(n) = 2T(n/2) + 1

> Compare f(n) with n^(log_b a). A and D: log_2 2 = log_3 3 = 1, so f(n) = n
> matches n¹ and the master theorem's balanced case gives Θ(n log n): every
> level of the recursion tree costs n, and there are log n levels. B: n⁰ = 1,
> the root's n dominates, Θ(n). C: n^(log_2 4) = n² dominates, Θ(n²). E: n¹
> dominates the constant work, Θ(n).

## dsa-intermediate-036
topic: complexity
answer: C

A hash table resolves collisions by separate chaining, each bucket an unsorted linked list, and holds n keys. What is the worst-case time of a single lookup?

- A: Θ(1)
- B: Θ(log n)
- C: Θ(n)
- D: Θ(n log n)

> Nothing stops every key from hashing to the same bucket (a poor hash
> function, or keys chosen by an adversary), and then a lookup walks a list of
> n keys. Θ(1) is the *expected* time under uniform hashing with a bounded load
> factor, not the worst case. Θ(log n) needs something extra, such as storing
> long buckets as balanced trees, which the question rules out.

## dsa-intermediate-037
topic: complexity
answer: A

The decision-tree argument gives a lower bound on the number of comparisons any comparison sort must make in the worst case. For n = 5 distinct elements, what bound does it give?

- A: 7
- B: 10
- C: 12
- D: 120

> A comparison sort is a binary decision tree whose leaves must cover all
> 5! = 120 possible orderings, and a binary tree of height h has at most 2^h
> leaves. 2^6 = 64 is too few and 2^7 = 128 is enough, so some input needs at
> least ⌈log₂ 120⌉ = 7 comparisons (and 7 are in fact achievable for five
> elements). 120 is the number of leaves, not the height; 10 is what a
> quadratic sort such as selection sort spends; 12 is n log₂ n rounded up, an
> asymptotic estimate rather than the bound.

## dsa-intermediate-038
topic: complexity
answer: B

What is the running time of this loop nest as a function of n?

```python
count = 0
for i in range(1, n + 1):
    j = i
    while j <= n:
        count += 1
        j += i
```

- A: Θ(n)
- B: Θ(n log n)
- C: Θ(n√n)
- D: Θ(n²)

> For each i the inner loop steps through i, 2i, 3i, … up to n, about n/i
> times. The total is n/1 + n/2 + … + n/n = n · H(n), and the harmonic number
> H(n) grows like ln n, so the nest is Θ(n log n) (for n = 1000 it runs 7,069
> times). It would be Θ(n²) if the inner loop stepped by 1; the shrinking
> inner loop is what saves the factor.

## dsa-intermediate-039
topic: hashing
answer: C

A hash table with separate chaining has 1,000 buckets and holds 3,000 keys. Assuming simple uniform hashing, how many keys does an unsuccessful search (for a key that is not in the table) compare against, on average?

- A: About 1
- B: About 1.5
- C: About 3
- D: About 1,500

> The expected chain length is the load factor α = n/m = 3,000 / 1,000 = 3,
> and a search for an absent key must walk its bucket's whole chain to be sure,
> so it makes about 3 comparisons: Θ(1 + α). "About 1" is the hash-tables-are-
> O(1) reflex, which forgets the load factor; "about 1.5" assumes the search
> stops halfway down the chain, which only a search that finds its key can do;
> 1,500 is a linear scan of half the keys.

## dsa-intermediate-040
topic: hashing
answer: A, B

Which of these statements are true of a hash table that resolves collisions by linear probing (open addressing)? Select all that apply.

- A: The load factor n/m can never exceed 1.
- B: Keys with different home slots can end up competing for the same run of occupied slots.
- C: Each slot holds a linked list of all the keys that hash to it.
- D: The expected number of probes per search stays below a fixed constant as the load factor approaches 1.

> Open addressing stores every key in the table itself, so it can never hold
> more keys than slots. Under linear probing a key whose home slot is taken
> moves to the next free one, so keys from neighbouring home slots pile into
> the same runs (primary clustering). Linked lists per slot describe separate
> chaining, not probing. As α approaches 1 the expected probes for an
> unsuccessful search grow like 1/(1 − α)², without bound, which is why such
> tables resize well before they are full.

## dsa-intermediate-041
topic: hashing
answer: A
run: python

This hash table uses linear probing and deletes a key by simply emptying its slot. What does the program print?

```python
M = 7
table = [None] * M

def insert(k):
    i = k % M
    while table[i] is not None:
        i = (i + 1) % M
    table[i] = k

def search(k):
    i = k % M
    while table[i] is not None:
        if table[i] == k:
            return True
        i = (i + 1) % M
    return False

def delete(k):
    i = k % M
    while table[i] is not None:
        if table[i] == k:
            table[i] = None
            return
        i = (i + 1) % M

for k in [10, 17, 3, 24, 12]:
    insert(k)
delete(17)
print(search(3), search(12), search(24))
```

- A: `False True False`
- B: `True True True`
- C: `False False False`
- D: `True True False`

> 10, 17, 3 and 24 all hash to 3 and fill slots 3, 4, 5 and 6; 12 hashes to 5,
> finds 5 and 6 taken and wraps to slot 0. Deleting 17 empties slot 4. A search
> for 3 or 24 starts at slot 3, sees 10, then hits the empty slot 4 and stops:
> False, although both keys are still in the table. A search for 12 starts at
> slot 5 and never crosses slot 4: True. This is why open addressing deletes
> with a tombstone that searches step over instead of an empty slot.

## dsa-intermediate-042
topic: sorting-searching
answer: C
run: python

This program binary-searches for the smallest ship capacity that delivers the packages, in the given order, within D days. What does it print?

```python
def days_needed(weights, cap):
    days, load = 1, 0
    for w in weights:
        if load + w > cap:
            days += 1
            load = 0
        load += w
    return days

weights = [4, 8, 2, 6, 3, 5]
D = 3
lo, hi = max(weights), sum(weights)
while lo < hi:
    mid = (lo + hi) // 2
    if days_needed(weights, mid) <= D:
        hi = mid
    else:
        lo = mid + 1
print(lo)
```

- A: `10`
- B: `11`
- C: `12`
- D: `14`

> Feasibility is monotone (if a capacity works, every larger one does), so the
> search narrows [8, 28] to the smallest capacity that fits in 3 days. 12
> works: [4, 8], [2, 6, 3], [5]. 11 needs 4 days: [4], [8, 2], [6, 3], [5].
> 10 is ⌈28 / 3⌉, the capacity if the load could be split evenly, but packages
> cannot be split or reordered; 14 is half the total, larger than needed.

## dsa-intermediate-043
topic: sorting-searching
answer: D

Quickselect always uses the last element of the current range as its pivot (Lomuto partition). It is asked for the smallest element (k = 1) of an array of n distinct values that is already sorted in increasing order. How long does it take?

- A: Θ(log n)
- B: Θ(n)
- C: Θ(n log n)
- D: Θ(n²)

> On sorted input the last element is the largest, so every partition of a
> range of m elements does m − 1 comparisons and removes only the pivot, and
> the search continues on the other m − 1 elements. The total is
> (n − 1) + (n − 2) + … + 1 = Θ(n²). Quickselect's Θ(n) is its *expected* time
> with a random pivot (a median-of-medians pivot makes Θ(n) the worst case
> too); it never needs n log n because it recurses into one side only.

## dsa-intermediate-044
topic: sorting-searching
answer: C

Which of these sorting algorithms is NOT stable as it is usually implemented?

- A: Insertion sort
- B: Merge sort
- C: Heapsort
- D: Counting sort

> Heapsort repeatedly swaps the root with the last element of the heap, which
> carries elements past others with equal keys: sorting (2, a), (2, b), (1, c)
> by the number gives (1, c), (2, b), (2, a), reversing the two 2s. Insertion
> sort shifts an element only past strictly larger ones; merge sort takes from
> the left half on ties; counting sort places elements from the right end of
> the input using cumulative counts. All three keep equal keys in their
> original order, which is what radix sort relies on.

## dsa-intermediate-045
topic: sorting-searching
answer: D

Counting sort runs in O(n + k) time and space, where k is the number of possible key values. For which input is it the best fit?

- A: 1,000 arbitrary 64-bit integers
- B: 1,000,000 strings of arbitrary length
- C: 10,000 floating-point numbers spread uniformly over [0, 1)
- D: 1,000,000 exam scores, each an integer from 0 to 100

> Counting sort needs small integer keys: with 101 possible scores, k is tiny
> next to n and the sort is linear, beating any comparison sort's Ω(n log n).
> For 64-bit integers k is 2^64, far too large for a count array (radix sort
> would fit). Strings of arbitrary length are not a small key range, and real
> numbers in [0, 1) are not integers at all (bucket sort suits them).
