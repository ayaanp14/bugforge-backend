/**
 * The essentials sheet for each DSA topic hub: when the technique applies,
 * the pattern itself (with at most one short code block), what it costs,
 * the mistakes that sink a correct idea, and three problems from the hub to
 * start with, easiest first — 180–280 words of Markdown per topic. The hub
 * page (/challenges/<topic>) shows it after the topic's blurb from
 * TOPIC_HUBS (problem-topics.ts), and the same text goes into the page's
 * HTML, so a search for "sliding window pattern" or "when to use union
 * find" lands on a page that answers it.
 *
 * Why it exists: the 2026-10-01 SEO audit measured the 32 topic hubs at
 * 19% own text — one blurb paragraph above a long list of problem titles,
 * thin beside the problem pages they link to and beside every other prep
 * site. aptitude-essentials.ts fixed the same finding on the aptitude topic
 * pages the same day; this is the DSA side of it, in the same shape.
 *
 * What a sheet holds: "### " sections only (the page has its own H1 and
 * H2s) — When to reach for it (the signals in a statement), The pattern,
 * Cost, Common mistakes (real pitfalls, three or four), Start with. It adds
 * to the blurb rather than restating it, and it describes the technique,
 * not the site. Code is Python, at most twelve lines, and runs — each block
 * was executed against a brute-force reference before it went in; do the
 * same for any change. "Start with" links must be published catalogue
 * problems (scripts/catalog) that carry the hub's tag and are not a second
 * copy in PROBLEM_CANONICAL (problem-canonical.ts); a link to another hub
 * must be a TOPIC_HUBS slug, one per sheet at most. Re-check those when a
 * problem is retagged, renamed or unpublished.
 *
 * Form: the text is drawn twice — by react-markdown in the SPA and by
 * lib/markdown-html.ts at the edge — so it keeps to what the edge renderer
 * knows: paragraphs, "###", one level of "-" list, bold, inline code, site
 * links and fenced code. A bare asterisk outside code can pair with another
 * into italics there, which is why multiplication in prose is × and any
 * operator with an asterisk sits in backticks. Each sheet is a template
 * literal, so its text stays flush left (four leading spaces would make a
 * code block) and a backtick inside it is written \` — hence the escaped
 * fences. Plain British English, like the blurbs.
 *
 * Adding a topic: give it its TOPIC_HUBS entry, then its sheet here under
 * the same slug. Every slug in TOPIC_HUBS is expected to have one.
 */

export const TOPIC_ESSENTIALS: Readonly<Record<string, string>> = {
  "arrays": `### When to reach for it

The input is a list of numbers and the question is about positions, order or aggregates: the best pair of days, an element's neighbours, a value's frequency, a rearrangement that must happen in place. With \`n\` up to 10⁵, comparing every pair is about 5 × 10⁹ steps, so the answer must come from one or two passes. "In place" or "O(1) extra space" means the array itself must hold the working state.

### The pattern

Most array solutions are a single pass that carries a little state: the smallest value so far, a write index, a running total. Ask what you need to know about everything before index \`i\` to answer for \`i\`, keep exactly that, and update it in constant time. When the answer at \`i\` depends on both sides, a pass from the left and a pass from the right usually suffice — the idea behind [Prefix Sum](/challenges/prefix-sum).

\`\`\`python
def max_profit(prices):
    best, low = 0, float("inf")
    for p in prices:
        low = min(low, p)           # cheapest day so far
        best = max(best, p - low)   # sell today
    return best
\`\`\`

### Cost

One pass is O(n) time. The carried state is O(1) space, or O(n) when you keep a prefix or suffix array. Sorting first costs O(n log n) and usually reorders the caller's array.

### Common mistakes

- Reading \`nums[i + 1]\` or \`nums[i - 1]\` without guarding the ends.
- Removing elements while looping by index, which skips the element that slides into the gap.
- Starting a running maximum at 0 when every value can be negative.
- Returning a new array when the problem wants the input modified and a length returned.

### Start with

- [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): one pass with a running minimum.
- [Move Zeroes](/problems/move-zeroes): a write index, in place.
- [Product of Array Except Self](/problems/product-of-array-except-self): a left pass and a right pass.`,
  "strings": `### When to reach for it

The input is text and the question is about its characters: is one string a rearrangement, prefix or subsequence of another; which piece is the longest with some property; how should it be parsed, encoded or compressed. Read the stated alphabet. "Lowercase English letters" means a 26-slot count array will do the job of a hash map. "The longest substring such that…" is usually a [Sliding Window](/challenges/sliding-window) question.

### The pattern

Treat the string as a read-only array. Compare by counts when order does not matter (anagrams), by aligned indices when it does (prefixes, palindromes), and by one pointer per string when one must appear inside the other in order (subsequences). Collect output in a list and join it once at the end, rather than adding to a string inside the loop.

\`\`\`python
def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = [0] * 26
    for a, b in zip(s, t):
        count[ord(a) - ord("a")] += 1
        count[ord(b) - ord("a")] -= 1
    return all(c == 0 for c in count)
\`\`\`

### Cost

A scan is O(n). Strings are immutable in Java, Python, JavaScript and C#, so \`s = s + c\` in a loop can copy the whole string each time and cost O(n²); taking a substring is usually a copy too, so slicing inside a loop is not free.

### Common mistakes

- Off-by-one on substring bounds: most libraries take \`[start, end)\`, end exclusive.
- Comparing strings with \`==\` in Java, which compares references, not contents — use \`equals\`.
- Trying to change a character in place in Python or Java; convert to a list or a \`char[]\` first.
- Assuming lowercase letters when the constraints allow digits, spaces or upper case.

### Start with

- [Longest Common Prefix](/problems/longest-common-prefix): aligned indices across several strings.
- [Valid Anagram](/problems/valid-anagram): counting over a fixed alphabet.
- [String to Integer (atoi)](/problems/string-to-integer-atoi): careful parsing, signs and overflow.`,
  "math": `### When to reach for it

Numbers too large to loop up to (\`n\` up to 10⁹ or beyond), questions about digits, remainders or parity, and an operation repeated so often that it must settle into a pattern. If the brute force is "simulate a billion steps", the intended answer is a formula, a cycle or an invariant.

### The pattern

Work the small cases by hand and tabulate them; the rule often shows within the first half-dozen. Take digits off an integer with \`n % 10\` and \`n // 10\` rather than converting to a string, which keeps sign and overflow handling explicit. Check a result against the type's limit before the operation that could exceed it, not after.

\`\`\`python
def reverse(x):                     # 32-bit signed result, or 0
    LIMIT = 2**31 - 1
    sign, x, out = (-1 if x < 0 else 1), abs(x), 0
    while x:
        x, d = divmod(x, 10)
        if out > (LIMIT - d) // 10:  # out * 10 + d would overflow
            return 0
        out = out * 10 + d
    return sign * out
\`\`\`

### Cost

A digit loop is O(log n), trial division up to √n is O(√n), and a closed form is O(1). That gap is the point: for n = 10¹² a loop to n never finishes, while a loop to √n is a million steps.

### Common mistakes

- Overflow in a 32-bit \`int\`: \`a * b\` or \`a + b\` can pass 2³¹ − 1 long before the final answer does. Widen to 64 bits first.
- Division and remainder with negatives: in Java and C++ \`-7 / 2\` is \`-3\` and \`-7 % 2\` is \`-1\` (JavaScript's \`%\` agrees); in Python \`-7 // 2\` is \`-4\` and \`-7 % 2\` is \`1\`.
- Using floating point for an integer question: \`sqrt\` or \`pow\` can return 2.9999… for an exact square, so confirm with integer arithmetic.
- Forgetting 0, 1 and negative inputs, which most formulas treat specially.

### Start with

- [Palindrome Number](/problems/palindrome-number): digits without a string.
- [Plus One](/problems/plus-one): carrying through a number held as digits.
- [Reverse Integer](/problems/reverse-integer): the overflow check before it happens.`,
  "hash-table": `### When to reach for it

The brute force has a nested loop whose inner loop only searches — for a complement, a duplicate, an earlier index, an equal key. Replace that search with a lookup. Other signals: "group by", "first unique", "how many times", or a need to remember where a value was last seen.

### The pattern

Decide what the key is and what the value records. For pairing, check for the partner before storing the current element, so nothing pairs with itself. For grouping, compute a canonical key — a word's sorted letters, or its tuple of letter counts — and append to that key's list. Plain tallies have their own page: [Counting](/challenges/counting).

\`\`\`python
def two_sum(nums, target):
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
\`\`\`

### Cost

Expected O(1) per insert and lookup, so a pass is O(n) time and up to O(n) space. Two caveats: hashing a string key costs O(length), and many colliding keys make each operation linear — adversarial inputs can do that to C++'s \`unordered_map\`. Iteration order is not guaranteed by Java's \`HashMap\` or C++'s \`unordered_map\`; Python's \`dict\` and JavaScript's \`Map\` keep insertion order.

### Common mistakes

- Storing before checking, so \`x + x == target\` finds the element itself.
- Using an array as a key: Python refuses a list, and Java hashes an \`int[]\` by identity, so two equal arrays miss each other. Use a tuple or a string.
- A map where keys are small integers or lowercase letters; a plain array is faster.
- Relying on the iteration order of a map that does not promise one.

### Start with

- [Two Sum](/problems/two-sum): the complement lookup in its simplest form.
- [Contains Duplicate](/problems/contains-duplicate): a set as the "seen before" test.
- [Longest Consecutive Sequence](/problems/longest-consecutive-sequence): O(n) where sorting would be O(n log n).`,
  "dynamic-programming": `### When to reach for it

The question asks for a count of ways, a minimum or maximum cost, or whether something is achievable — and a choice made now changes what is possible later. If a brute-force recursion would solve the same subproblem many times (the same index, the same remaining amount, the same pair of prefixes), the subproblems overlap and DP applies. "Return every way" is different: listing answers is [Backtracking](/challenges/backtracking).

### The pattern

Write the recursion first, over a small state: \`f(i)\` for the best answer on the first \`i\` items, \`f(i, j)\` for two prefixes, \`f(a)\` for a remaining amount. Base cases are the states you can answer without recursing. Then memoise it (top-down) or fill a table in an order where every dependency is computed before it is read (bottom-up).

\`\`\`python
def coin_change(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount       # dp[a] = fewest coins making a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] <= amount else -1
\`\`\`

### Cost

States × work per state for time, and the number of states for space — often cut to one or two rows, because a row reads only the one before it. Coin change above is O(amount × coins) time and O(amount) space.

### Common mistakes

- A state that leaves out something the future depends on, such as whether you hold a stock or how many transactions remain.
- Filling cells in an order that reads one not yet computed.
- In counting problems, swapping the loops: coins outside counts combinations, amounts outside counts ordered sequences.
- Using 0 to mean "impossible" in a minimisation, or recursing without a memo and paying exponential time.

### Start with

- [Climbing Stairs](/problems/climbing-stairs): a one-dimensional recurrence.
- [House Robber](/problems/house-robber): a take-or-skip choice at each index.
- [Coin Change](/problems/coin-change): a table indexed by remaining amount.`,
  "sorting": `### When to reach for it

The answer would not change if the input were shuffled — the question is about a collection of values, not their positions — and the brute force compares every pair. "Closest", "minimum difference", "assign each … to a …", "merge the overlapping" and "largest arrangement" all point at sorting first. If the output needs original positions, sort indices or (value, index) pairs instead of the values.

### The pattern

Sort once, then scan. A custom comparator must define a consistent order: negative, zero or positive, never a bare boolean, with ties broken explicitly when the output must be deterministic. When a key is costly to compute, compute it once per element rather than inside every comparison.

\`\`\`python
from functools import cmp_to_key

def largest_number(nums):           # a before b when a+b > b+a
    s = [str(n) for n in nums]
    s.sort(key=cmp_to_key(lambda a, b: (b + a > a + b) - (b + a < a + b)))
    out = "".join(s)
    return "0" if out[0] == "0" else out
\`\`\`

### Cost

Comparison sorts take O(n log n), and no comparison sort can do better in the worst case. Library sorts in Python, Java (for objects) and JavaScript are stable; C++'s \`std::sort\` is not, so use \`std::stable_sort\` when equal keys must keep their order.

### Common mistakes

- A comparator written as \`a - b\` overflows on large \`int\` values in Java or C++; use \`Integer.compare(a, b)\`.
- JavaScript's default \`sort()\` compares as strings, so \`[10, 9, 1]\` sorts to \`[1, 10, 9]\`; pass \`(a, b) => a - b\`.
- An inconsistent comparator such as JavaScript's \`(a, b) => a > b\`, which never returns a negative and gives an engine-dependent order.
- Sorting the input in place when a later step needs the original order.

### Start with

- [Contains Duplicate](/problems/contains-duplicate): equal values end up adjacent.
- [Merge Intervals](/problems/merge-intervals): sort by start, then one sweep.
- [Largest Number](/problems/largest-number): a custom comparator decides everything.`,
  "greedy": `### When to reach for it

An optimisation over a sequence of choices with an obvious local rule — the interval that ends earliest, the farthest reachable index, the smallest item that still fits — and an input size (10⁵ or more) that rules out a table over every state. The first line of the solution is usually a sort by the key the rule uses.

### The pattern

State the rule, then try to break it before coding: hunt for a small input where the local choice blocks a better total. If you cannot, sketch the exchange argument — take any optimal solution, swap its first choice for the greedy one, and show the result is no worse. The code is then one pass that commits to each choice and never looks back.

\`\`\`python
def can_jump(nums):
    reach = 0                       # farthest index reachable so far
    for i, step in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + step)
    return True
\`\`\`

### Cost

Usually O(n log n) for the sort plus O(n) for the pass, with O(1) extra space; rules that keep the best few candidates in a heap stay at O(n log n).

### Common mistakes

- Trusting a rule because it passes the examples. Coins {1, 3, 4} making 6: largest-first gives 4 + 1 + 1, but 3 + 3 needs only two coins — that problem is DP.
- Sorting by the wrong key: selecting the most non-overlapping intervals needs end times, not start times or lengths.
- Ties the proof never considered.
- Committing for good to a choice the problem lets you revise; keep the candidates in a heap and swap the worst one out instead.

### Start with

- [Assign Cookies](/problems/assign-cookies): sort both sides, match the smallest that fits.
- [Jump Game](/problems/jump-game): the farthest reach as the only state.
- [Gas Station](/problems/gas-station): a rule that needs its proof to be believed.`,
  "two-pointers": `### When to reach for it

Sorted input (or input you may sort) and a question about pairs or triples with a target sum or difference; an in-place rewrite whose result is no longer than the input; two sequences to merge or compare in order; a palindrome check. In each, one comparison rules out a candidate for good, which is what lets two indices replace a nested loop.

### The pattern

From opposite ends, \`lo = 0\` and \`hi = n − 1\`: if the pair is too small, move \`lo\` right; if too big, move \`hi\` left. Each move discards every pair the moved pointer could still have made. In the same direction, a read pointer visits every element and a write pointer marks the end of the part being kept. When the pointers bound a range whose contents matter, it has become a [Sliding Window](/challenges/sliding-window).

\`\`\`python
def remove_duplicates(nums):        # nums is sorted
    write = 1 if nums else 0
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write
\`\`\`

### Cost

O(n) time after any sort and O(1) extra space. 3Sum is an outer loop around a two-pointer pass: O(n²), against O(n³) for three nested loops.

### Common mistakes

- Opposite-end pointers on unsorted input, where a move no longer discards anything.
- \`while lo <= hi\` when a pair needs two distinct elements; use \`lo < hi\`.
- Skipping duplicates for one pointer only in 3Sum, so the same triple is reported twice.
- Moving both pointers when the comparison justified moving one.

### Start with

- [Valid Palindrome](/problems/valid-palindrome): two ends meeting in the middle.
- [Container With Most Water](/problems/container-with-most-water): why moving the shorter side is safe.
- [3Sum](/problems/3sum): sort, fix one, two pointers for the rest.`,
  "matrix": `### When to reach for it

The input is \`m × n\` rows and columns: an image, a game board, a map of land and water, a table sorted along its rows and columns. The question picks the tool. Transforming the whole grid (rotate, transpose, spiral order) is index arithmetic. Anything about connected regions or the fewest moves between cells is a graph search with cells as nodes — see [Breadth-First Search](/challenges/breadth-first-search).

### The pattern

Name the dimensions once, \`rows = len(grid)\` and \`cols = len(grid[0])\`, and walk neighbours with a list of directions rather than four copied blocks. A 90° clockwise rotation is a transpose followed by reversing each row. To mark cells in place, borrow spare state from the grid itself — the first row and column, or a value outside the input's range — instead of allocating a second grid.

\`\`\`python
DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1)]

def neighbours(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            yield nr, nc
\`\`\`

### Cost

Visiting every cell is O(m × n), the floor for most matrix questions. A matrix sorted along rows and columns can be searched in O(m + n) by starting at a corner. In-place transforms use O(1) extra space.

### Common mistakes

- Mixing up rows and columns: \`grid[r][c]\` is row \`r\`, column \`c\`, and naming them \`x\` and \`y\` invites \`grid[x][y]\` slips.
- Assuming a square grid, so code that works for \`n × n\` breaks on \`m × n\`.
- Overwriting a cell whose original value a later step still needs (Game of Life, Set Matrix Zeroes).
- Building rows with \`[[0] * n] * m\` in Python, which makes every row the same list.

### Start with

- [Transpose Matrix](/problems/transpose-matrix): rows become columns.
- [Spiral Matrix](/problems/spiral-matrix): four shrinking boundaries.
- [Rotate Image](/problems/rotate-image): an in-place transform built from two simpler ones.`,
  "stack": `### When to reach for it

Nested structure — brackets, tags, encodings like \`3[a2[c]]\`; a symbol that cancels the most recent unmatched one (a backspace, a closing bracket, two colliding asteroids); an expression to evaluate; a recursion you want to run as a loop. The test is whether the item you need next is always the most recent one not yet dealt with.

### The pattern

Scan left to right. Push whatever is waiting for a partner; when the current element resolves the top, pop and combine. Whatever is left at the end is unmatched. In reverse Polish notation, numbers are pushed and each operator pops two operands and pushes the result. When the stack must stay in sorted order to answer "next greater" questions, it is a [Monotonic Stack](/challenges/monotonic-stack).

\`\`\`python
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
\`\`\`

### Cost

Each element is pushed and popped at most once: O(n) time and, in the worst case (all openers), O(n) space.

### Common mistakes

- Popping or peeking an empty stack; check before every pop.
- Declaring success after the scan without checking that the stack is empty.
- Operand order for \`-\` and \`/\`: the first pop is the right-hand operand, so pop \`b\`, then \`a\`, and push \`a - b\`.
- Integer division that must truncate towards zero: Python's \`//\` floors, so \`-7 // 2\` is \`-4\`; use \`int(a / b)\`.

### Start with

- [Valid Parentheses](/problems/valid-parentheses): push openers, pop on closers.
- [Evaluate Reverse Polish Notation](/problems/evaluate-reverse-polish-notation): a stack of operands.
- [Decode String](/problems/decode-string): a stack of partial strings for nested repeats.`,
  "simulation": `### When to reach for it

The statement describes a process step by step — a robot's moves, a game's turns, rounds of an operation on an array — and the limits make running it affordable: steps × cost per step should stay within about 10⁷–10⁸ simple operations. If the number of steps is huge (10⁹ rounds), the state must repeat or follow a formula; find that instead of running every step.

### The pattern

Write down the full state first, every variable that changes between steps, then a function from one state to the next. When all cells or players update "at the same time", compute the new state from an untouched copy of the old one, or encode old and new together in each cell. Keep each rule on its own line, in the statement's order.

\`\`\`python
def life_step(board):
    R, C = len(board), len(board[0])
    old = [row[:] for row in board]     # read the old, write the new
    for r in range(R):
        for c in range(C):
            live = sum(old[i][j]
                       for i in range(max(0, r - 1), min(R, r + 2))
                       for j in range(max(0, c - 1), min(C, c + 2))) - old[r][c]
            board[r][c] = int(live == 3 or (live == 2 and old[r][c] == 1))
\`\`\`

### Cost

Steps × cost per step. Copying the state each step adds O(size) space; encoding both values in one cell (say, 2 for "alive, about to die") removes it.

### Common mistakes

- Updating in place when the rules are simultaneous, so later cells see half-updated neighbours.
- Applying rules in a different order from the statement, or one rule twice in a step.
- An off-by-one in the number of rounds — whether the initial state counts as round 0.
- Running 10⁹ steps of a state that repeats; detect the cycle and skip ahead.

### Start with

- [Baseball Game](/problems/baseball-game): one record, one rule per operation.
- [Spiral Matrix](/problems/spiral-matrix): a walk whose turning rule needs care.
- [Game of Life](/problems/game-of-life): a simultaneous update over a grid.`,
  "bit-manipulation": `### When to reach for it

Values that fit a machine word with a question about their binary form; "every element appears twice except one"; a set of at most about 20 items whose subsets must all be tried (2²⁰ is about a million); flags packed into one integer; "add without the \`+\` and \`-\` operators".

### The pattern

A handful of identities do most of the work. \`x & (x - 1)\` clears the lowest set bit and \`x & -x\` isolates it; \`x ^ x\` is 0 and \`x ^ 0\` is \`x\`; \`(x >> i) & 1\` reads bit \`i\` and \`x | (1 << i)\` sets it. XOR over a list cancels every value that appears an even number of times. Masks from 0 to \`(1 << n) - 1\` enumerate every subset of \`n\` items, bit \`i\` saying whether item \`i\` is in.

\`\`\`python
def count_bits(n):                  # set bits of every value 0..n
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i & (i - 1)] + 1
    return ans
\`\`\`

### Cost

Bitwise operations are O(1) on a machine word; looping over bits is O(word size), and enumerating subsets is O(2ⁿ × n).

### Common mistakes

- Precedence: in C, C++, Java and JavaScript, \`==\` binds tighter than \`&\`, so \`x & 1 == 0\` does not test the low bit. Parenthesise every bitwise expression.
- Shifting negatives: \`>>\` keeps the sign in Java and JavaScript; \`>>>\` shifts in zeros. Python integers are unbounded, so mask with \`& 0xFFFFFFFF\` to imitate 32 bits.
- JavaScript's bitwise operators work on 32-bit signed values, so \`1 << 31\` is negative.
- \`1 << 40\` overflows a 32-bit \`int\` in Java or C++; write \`1L << 40\` or \`1LL << 40\`.

### Start with

- [Single Number](/problems/single-number): XOR cancels the pairs.
- [Counting Bits](/problems/counting-bits): popcounts built from smaller ones.
- [Single Number II](/problems/single-number-ii): counting bits modulo 3.`,
  "breadth-first-search": `### When to reach for it

"The minimum number of moves, steps or transformations" where every move costs the same; something spreading from several sources at once (fire, infection, the distance to the nearest exit); and nodes that are generated rather than given — words one letter apart, lock combinations, board states. Once edges carry different weights, BFS stops giving shortest paths: use Dijkstra's algorithm, or a deque-based 0-1 BFS when the weights are only 0 and 1.

### The pattern

Put the start, or every source, in a queue and mark it seen. Pop a node and push each unseen neighbour, marking it the moment it is pushed. Distances fall out of the order: everything at distance d leaves the queue before anything at d + 1. Graphs given as edges need an adjacency list first — see [Graph](/challenges/graph).

\`\`\`python
from collections import deque

def bfs(start, neighbours):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt in neighbours(node):
            if nxt not in dist:     # mark on push, not on pop
                dist[nxt] = dist[node] + 1
                queue.append(nxt)
    return dist
\`\`\`

### Cost

O(V + E) time and O(V) space; on an \`m × n\` grid with four moves per cell, O(m × n).

### Common mistakes

- Marking a node when it is popped instead of when it is pushed, so it enters the queue many times.
- Using \`list.pop(0)\` in Python or \`shift()\` in JavaScript as the dequeue, which can cost O(n) per pop; use a \`deque\` or a head index.
- Running a multi-source problem once per source instead of seeding the queue with all of them.
- Counting the start as step 1 instead of step 0.

### Start with

- [Flood Fill](/problems/flood-fill): reachability on a grid.
- [Rotting Oranges](/problems/rotting-oranges): many sources, counted in layers.
- [Shortest Path in Binary Matrix](/problems/shortest-path-in-binary-matrix): fewest moves with eight directions.`,
  "binary-search": `### When to reach for it

Sorted input, or sorted with a twist (rotated, rising then falling); the first or last position of something; and the less obvious case — "the minimum capacity, speed or time such that …", where any guess above the answer also works. Large bounds (answers up to 10⁹) together with a cheap feasibility check are the giveaway.

### The pattern

Search for a boundary, not a value: the first \`x\` where \`ok(x)\` is true, given that \`ok\` is false up to some point and true from then on. Keep the invariant that the answer lies in \`[lo, hi]\`, and discard the half that cannot hold it. The template below assumes \`ok(hi)\` is true; start \`hi\` at a value known to work.

\`\`\`python
def first_true(lo, hi, ok):         # smallest x in [lo, hi] with ok(x)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid                # mid may be the answer
        else:
            lo = mid + 1            # mid is not
    return lo
\`\`\`

### Cost

O(log n) iterations. Searching an answer range of size R with an O(n) feasibility check costs O(n log R) — about 30 checks for R = 10⁹.

### Common mistakes

- \`mid = (lo + hi) / 2\` overflowing when \`lo + hi\` passes 2³¹ − 1 in Java or C++; write \`lo + (hi - lo) / 2\`.
- An endless loop: \`lo = mid\` with a mid rounded down never shrinks a two-element range, so that variant needs \`mid = (lo + hi + 1) / 2\`.
- Mixing closed \`[lo, hi]\` and half-open \`[lo, hi)\` conventions inside one loop.
- Binary searching a predicate that is not monotone, where halving throws the answer away.

### Start with

- [Binary Search](/problems/binary-search): the plain sorted-array search.
- [Search in Rotated Sorted Array](/problems/search-in-rotated-sorted-array): deciding which half is sorted.
- [Koko Eating Bananas](/problems/koko-eating-bananas): searching over the answer.`,
  "depth-first-search": `### When to reach for it

Reachability, connected regions and properties of whole paths: count the islands, measure a region, decide whether a path exists, find a cycle in a directed graph. DFS does not give shortest paths in an unweighted graph, but it needs less bookkeeping than BFS, and its finishing order is what cycle detection and topological sorting rely on.

### The pattern

Mark the node, then recurse into each unmarked neighbour. On a grid that may be modified, marking can mean overwriting the cell, land becoming water. Directed cycle detection needs three states, not two: unvisited, on the current path, and finished — reaching a node that is still on the current path closes a cycle.

\`\`\`python
def count_islands(grid):
    rows, cols = len(grid), len(grid[0])
    def sink(r, c):                 # 1 if (r, c) was unvisited land
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != 1:
            return 0
        grid[r][c] = 0              # mark before recursing
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sink(r + dr, c + dc)
        return 1
    return sum(sink(r, c) for r in range(rows) for c in range(cols))
\`\`\`

### Cost

O(V + E) time. Space is the recursion depth, up to O(V) — a million frames on a 1000 × 1000 grid of land.

### Common mistakes

- Overflowing the call stack: Python stops at 1,000 frames by default, and other languages at whatever stack the process has. Use an explicit stack when depth can reach the input size.
- Marking a node after the recursive calls instead of before, so two paths enter it.
- One visited set for directed cycle detection, which mistakes a node finished on another branch for a cycle.
- Forgetting to unmark when the question is about paths rather than reachability — that is [Backtracking](/challenges/backtracking).

### Start with

- [Flood Fill](/problems/flood-fill): one region from one cell.
- [Number of Islands](/problems/number-of-islands): one search per unvisited region.
- [Number of Provinces](/problems/number-of-provinces): components from an adjacency matrix.`,
  "graph": `### When to reach for it

Anything with pairwise relationships — roads between cities, prerequisites, friendships, trust, network links — even when the word "graph" never appears. Inputs usually arrive as an edge list (\`[[u, v], …]\`) or an adjacency matrix. Before writing anything, settle three things: are edges directed, do they carry weights, and are nodes numbered from 0 or from 1?

### The pattern

Convert to an adjacency list, then choose the traversal: [Breadth-First Search](/challenges/breadth-first-search) for the fewest edges, depth-first search for reachability and structure, union-find when edges arrive one at a time and only connectivity matters. Some questions need no traversal at all: in Find the Town Judge, the judge is the node with in-degree n − 1 and out-degree 0.

\`\`\`python
def build(n, edges, directed=False):
    adj = [[] for _ in range(n)]    # nodes 0..n-1
    for u, v in edges:
        adj[u].append(v)
        if not directed:
            adj[v].append(u)
    return adj
\`\`\`

### Cost

An adjacency list takes O(V + E) space and a full traversal O(V + E) time. An adjacency matrix takes O(V²) space and makes every traversal O(V²); it pays off only for dense graphs or constant-time edge checks.

### Common mistakes

- Adding an undirected edge in one direction only.
- Missing isolated nodes: loop over \`range(n)\`, not over the nodes that appear in edges, when counting components.
- Undirected cycle detection that treats the edge back to the parent as a cycle.
- Traversing from node 0 and assuming that reaches the whole graph.

### Start with

- [Find the Town Judge](/problems/find-the-town-judge): degrees instead of a traversal.
- [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): build the list, then search.
- [Is Graph Bipartite?](/problems/is-graph-bipartite): two-colouring every component.`,
  "counting": `### When to reach for it

"How many pairs", "most frequent", "can these letters build that word", "make every count equal", "the first value that appears once". If the answer depends only on how often each value occurs, not where, discard the positions and count. If it asks for pairs of equal values, arithmetic on the counts replaces the pair loop. The same tally keyed by anything other than small integers is a [Hash Table](/challenges/hash-table).

### The pattern

Build the tally in one pass, then reason about the counts. A value seen c times forms c × (c − 1) ÷ 2 equal pairs; counting as you go — adding the current count before incrementing it — gives the same total in a single pass. "Can A be built from B" is a check that every count in A is at most the matching count in B.

\`\`\`python
def num_identical_pairs(nums):
    seen, pairs = {}, 0
    for x in nums:
        pairs += seen.get(x, 0)     # x pairs with every earlier copy
        seen[x] = seen.get(x, 0) + 1
    return pairs
\`\`\`

### Cost

O(n) time. Space is O(k) for k distinct values, which is O(1) for a fixed alphabet such as the 26 lowercase letters.

### Common mistakes

- Counting ordered pairs when the question wants unordered ones, or the reverse — a factor of two either way.
- Overflow: 10⁵ equal values form about 5 × 10⁹ pairs, beyond a 32-bit \`int\`.
- Recounting from scratch for every query when the tally can be updated one element at a time.
- Checking only the letters of one word when both words' counts matter.

### Start with

- [Number of Good Pairs](/problems/number-of-good-pairs): pairs from counts.
- [Ransom Note](/problems/ransom-note): one tally checked against another.
- [Task Scheduler](/problems/task-scheduler): the most frequent count decides the answer.`,
  "heap": `### When to reach for it

"The k largest, smallest, closest or most frequent"; "repeatedly take the best remaining item" — the two heaviest stones, the cheapest next edge, the meeting that ends first; merging k sorted lists; the median of a stream. If the alternative is to sort, take one item, change the data and sort again, a heap does each round in O(log n).

### The pattern

For the k largest, keep a min-heap of at most k items: push each new item and pop the smallest whenever the size passes k. The heap then holds the k largest, and its top is the k-th largest. For best-first processing, push candidates as they become available and pop the best. Check which end your library hands back: Python's \`heapq\` and Java's \`PriorityQueue\` give the smallest, C++'s \`priority_queue\` the largest.

\`\`\`python
import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)     # drop the smallest
    return heap[0]
\`\`\`

### Cost

Push and pop are O(log size). A heap capped at k over n items costs O(n log k) time and O(k) space. Building a heap from a whole array at once (\`heapify\`) is O(n).

### Common mistakes

- Heaping all n items to read the top k: correct, but O(n log n) time and O(n) space.
- Negating keys to get a max-heap and forgetting to negate them back.
- Pushing tuples whose second element cannot be compared: Python compares it when the first ties, so add a counter in between.
- Expecting the heap's array to be sorted; only its top is guaranteed.

### Start with

- [Last Stone Weight](/problems/last-stone-weight): take the two largest, push back the rest.
- [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): a heap capped at k.
- [Top K Frequent Elements](/problems/top-k-frequent-elements): counts first, then a heap over them.`,
  "prefix-sum": `### When to reach for it

Many sum queries over ranges of an array that does not change; "subarrays whose sum equals, or is divisible by, k" when values can be negative, which breaks a [Sliding Window](/challenges/sliding-window); "the index where the left and right sums balance"; many range updates applied at once, which is the difference array, the prefix sum run backwards.

### The pattern

Define \`pre[0] = 0\` and \`pre[i + 1] = pre[i] + nums[i]\`; the sum of \`nums[l..r]\` is then \`pre[r + 1] - pre[l]\`. To count subarrays that sum to k in one pass, keep a map from each prefix total to how often it has occurred: a subarray ending at the current index sums to k exactly when an earlier prefix equals the current total minus k.

\`\`\`python
def subarray_sum(nums, k):
    seen = {0: 1}                   # the empty prefix
    total = count = 0
    for x in nums:
        total += x
        count += seen.get(total - k, 0)
        seen[total] = seen.get(total, 0) + 1
    return count
\`\`\`

### Cost

O(n) to build and O(1) per range query. The two-dimensional table costs O(m × n) to build and answers the sum of any rectangle with four lookups.

### Common mistakes

- Leaving out the empty prefix (\`{0: 1}\`), which misses every subarray that starts at index 0.
- An off-by-one between \`pre[r] - pre[l]\` and \`pre[r + 1] - pre[l]\`; settle the convention once and keep it.
- Recording the current total before looking it up, which counts the empty subarray when k is 0.
- Overflow: 10⁵ values up to 10⁹ sum to 10¹⁴, which needs 64-bit integers.

### Start with

- [Running Sum of 1d Array](/problems/running-sum-of-1d-array): the prefix array itself.
- [Find Pivot Index](/problems/find-pivot-index): the left sum compared with the total.
- [Subarray Sum Equals K](/problems/subarray-sum-equals-k): prefix totals in a hash map.`,
  "sliding-window": `### When to reach for it

A contiguous subarray or substring with a condition on its contents that behaves monotonically: if a window is valid, so is every window inside it (for "longest") or every window around it (for "shortest"). "At most k distinct", "no repeated character", "sum at least the target, all values positive" and "every window of size k" all qualify. With negative numbers a sum condition is not monotone; use a [Prefix Sum](/challenges/prefix-sum) instead.

### The pattern

Advance \`right\` one step at a time and add its element to the window's counters. While the window breaks the condition, remove \`nums[left]\` and advance \`left\`. Once it is valid again, \`[left, right]\` is the longest valid window ending at \`right\`. In the code below the left edge jumps straight past the earlier copy instead of stepping.

\`\`\`python
def longest_unique(s):
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if last.get(ch, -1) >= left:    # a repeat inside the window
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
\`\`\`

### Cost

Each index enters and leaves the window at most once: O(n) time, with O(k) space for counters over k distinct values.

### Common mistakes

- Window length off by one: \`[left, right]\` inclusive holds \`right - left + 1\` elements.
- Recording the answer at the wrong moment: for "longest", after the window is valid again; for "shortest", inside the shrinking loop, while it is still valid.
- Leaving zero counts in a map and then using the map's size as the number of distinct values.
- Shrinking a window on sums that can go negative.

### Start with

- [Maximum Sum Subarray of Size K](/problems/maximum-sum-subarray-of-size-k): a fixed-size window.
- [Longest Substring Without Repeating Characters](/problems/longest-substring-without-repeating-characters): a variable window, longest.
- [Minimum Window Substring](/problems/minimum-window-substring): a variable window, shortest, with counters.`,
  "union-find": `### When to reach for it

Connectivity that only grows: edges are added and never removed, and the questions are "are these two connected?", "how many groups are there?", "which edge first joins two nodes that were already connected?". It also fits offline problems — sort edges or queries by weight and union as the threshold rises, as in Kruskal's minimum spanning tree. It cannot split a group, and it gives neither paths nor distances.

### The pattern

Every node points to a parent; a root points to itself and names its group. \`find\` follows parents to the root, shortening the path as it goes; \`union\` hangs the smaller tree's root under the larger one's.

\`\`\`python
def find(parent, x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(parent, size, a, b):
    ra, rb = find(parent, a), find(parent, b)
    if ra == rb: return False           # already joined: this edge closes a cycle
    if size[ra] < size[rb]: ra, rb = rb, ra
    parent[rb], size[ra] = ra, size[ra] + size[rb]
    return True
\`\`\`

### Cost

With path compression (or halving) and union by size, m operations take O(m α(n)), where α, the inverse Ackermann function, is at most 4 for any input that fits in memory. Space is O(n). Without either, a chain can form and each \`find\` degrades to O(n).

### Common mistakes

- Comparing \`parent[a] == parent[b]\` instead of \`find(a) == find(b)\`.
- Counting groups as the distinct values in \`parent\` without calling \`find\` on each node first.
- Decrementing the component count on every union call, rather than only when two different roots merge.
- Mapping non-integer keys (emails, coordinates) to indices inconsistently.

### Start with

- [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): union every edge, then one \`find\`.
- [Number of Provinces](/problems/number-of-provinces): counting the groups.
- [Redundant Connection](/problems/redundant-connection): the first union that fails.`,
  "monotonic-stack": `### When to reach for it

For every element, the nearest greater or smaller element to its left or right: the next warmer day, the next cheaper price, how far each histogram bar can stretch. Also sums over every subarray's minimum or maximum: each element's share is bounded by its nearest smaller (or larger) neighbours. And "remove k digits to make the smallest number", where a digit goes as soon as a smaller one follows.

### The pattern

Store indices, not values, so distances and widths are at hand. Scan; while the current element beats the one on top, pop it — the current element is that index's answer. Then push the current index. Indices still on the stack at the end have no answer. Popping smaller values leaves a decreasing stack and finds the next greater; popping larger values finds the next smaller. The plain push-and-pop patterns are on [Stack](/challenges/stack).

\`\`\`python
def daily_temperatures(t):
    ans, stack = [0] * len(t), []    # stack: indices, temperatures falling
    for i, x in enumerate(t):
        while stack and t[stack[-1]] < x:
            j = stack.pop()
            ans[j] = i - j          # day i is j's next warmer day
        stack.append(i)
    return ans
\`\`\`

### Cost

Each index is pushed once and popped at most once, so the nested loop is O(n) overall, with O(n) space.

### Common mistakes

- \`<\` against \`<=\` in the pop condition decides how equal values are treated; in subarray-minimum sums, use strict on one side and non-strict on the other, or equal minima are counted twice.
- Pushing values when the answer is a distance or a width.
- Forgetting what is left on the stack; in Largest Rectangle in Histogram a final zero-height bar flushes it.
- Circular input: loop over 2n indices using \`i % n\`, pushing only during the first n.

### Start with

- [Final Prices With a Special Discount in a Shop](/problems/final-prices-with-a-special-discount-in-a-shop): the next smaller-or-equal price.
- [Daily Temperatures](/problems/daily-temperatures): the next greater, as a distance.
- [Largest Rectangle in Histogram](/problems/largest-rectangle-in-histogram): smaller neighbours on both sides.`,
  "backtracking": `### When to reach for it

"Return all" — every permutation, subset, combination, partition, placement or path — or "does any arrangement exist" when no polynomial structure is in sight. Small limits give it away: n up to about 10–20, a 9 × 9 board, a word of length 15. If the question wants only how many, or the best one, first check whether [Dynamic Programming](/challenges/dynamic-programming) can count them without listing them.

### The pattern

A recursive function holds a partial solution. At each level, loop over the choices still allowed; for each, apply it, recurse, then undo it exactly. Record a copy whenever the partial solution is complete. Prune a branch the moment it cannot succeed — a running sum already past the target, a square already attacked.

\`\`\`python
def subsets(nums):
    out, path = [], []
    def go(start):
        out.append(path[:])         # a copy, not the live list
        for i in range(start, len(nums)):
            path.append(nums[i])
            go(i + 1)
            path.pop()              # undo
    go(0)
    return out
\`\`\`

### Cost

Proportional to the nodes in the search tree: O(2ⁿ × n) for subsets and O(n! × n) for permutations, the factor n being the copy of each answer. Pruning cuts the constant, rarely the bound.

### Common mistakes

- Appending the live \`path\` instead of a copy, so every recorded answer ends up empty.
- Forgetting to undo a choice, or a visited mark on a board, which leaks into sibling branches.
- Duplicate answers from duplicate inputs: sort first, then skip \`nums[i] == nums[i - 1]\` when \`i > start\`.
- Recursing with \`i + 1\` where an item may be reused; Combination Sum recurses with \`i\`.

### Start with

- [Subsets](/problems/subsets): choose or skip each item.
- [Permutations](/problems/permutations): every order, with a used mark.
- [Combination Sum](/problems/combination-sum): reuse allowed, pruned by the running sum.`,
  "intervals": `### When to reach for it

Pairs \`[start, end]\` on a line — meetings, bookings, ranges of numbers, balloon spans, video clips — and a question about how they overlap: merge them, find the most that overlap at one point, remove the fewest so the rest are disjoint, or cover a range with as few as possible.

### The pattern

Two sort orders answer most of these. Sort by start to merge: keep the last merged interval and either extend its end or begin a new one. Sort by end to keep the most non-overlapping intervals: take each one that starts after the last one taken has ended. For the maximum overlap, sweep events — +1 at every start, −1 at every end — and when a start and an end share a coordinate, process the end first if touching intervals do not overlap.

\`\`\`python
def merge(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:  # overlaps, or touches, the last one
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
\`\`\`

### Cost

O(n log n) for the sort and O(n) for the sweep. The event sweep sorts 2n events, still O(n log n); with small integer coordinates a difference array makes it O(n + range).

### Common mistakes

- Not deciding whether touching intervals such as \`[1, 2]\` and \`[2, 3]\` overlap: the statement decides, and the comparison must be \`<=\` or \`<\` to match.
- Setting the merged end to \`e\` instead of \`max(end, e)\`, which breaks when one interval contains the next.
- Sorting by start for the greedy selection, which needs end times.
- Mutating intervals the caller still holds.

### Start with

- [Meeting Rooms](/problems/meeting-rooms): sort, then compare neighbours.
- [Merge Intervals](/problems/merge-intervals): the sort-and-extend sweep.
- [Meeting Rooms II](/problems/meeting-rooms-ii): the most overlapping at any moment.`,
  "number-theory": `### When to reach for it

Statements about divisors, multiples, primes, coprime pairs or least common multiples, and any answer requested "modulo 10⁹ + 7". Also sequences that repeat with a period, such as the k-th number divisible by a or b, or an answer that depends only on n modulo something.

### The pattern

Euclid's algorithm gives \`gcd(a, b) = gcd(b, a % b)\`, and \`lcm(a, b) = a / gcd(a, b) × b\` — dividing first keeps the intermediate value small. Divisors come in pairs \`(d, n / d)\`, so trial division only has to reach √n. To test many numbers for primality, sieve once up to the largest. Under a modulus, reduce after every addition and multiplication; division needs a modular inverse instead.

\`\`\`python
def sieve(n):                       # is_prime[i] for 0 <= i <= n, n >= 1
    is_prime = [False, False] + [True] * (n - 1)
    p = 2
    while p * p <= n:
        if is_prime[p]:
            for m in range(p * p, n + 1, p):
                is_prime[m] = False
        p += 1
    return is_prime
\`\`\`

### Cost

Euclid's algorithm is O(log min(a, b)); trial division is O(√n); the sieve is O(n log log n) time and O(n) space; fast modular exponentiation is O(log e) for exponent e.

### Common mistakes

- Computing \`a * b / gcd\` and overflowing where \`a / gcd * b\` would not.
- Reducing modulo only at the end, after an intermediate product has already overflowed (in Python it is correct, just slow).
- A negative remainder after subtraction in Java, C++ or JavaScript; write \`((a - b) % m + m) % m\`.
- Counting √n twice when listing the divisor pairs of a perfect square.

### Start with

- [Find Greatest Common Divisor of Array](/problems/find-greatest-common-divisor-of-array): Euclid's algorithm.
- [Prime Factorisation](/problems/prime-factors): trial division up to √n.
- [The kth Factor of n](/problems/the-kth-factor-of-n): divisor pairs in order.`,
  "counting-sort": `### When to reach for it

The constraints bound the values tightly — \`0 <= nums[i] <= 1000\`, lowercase letters, heights up to 100, scores capped at n — and the task needs sorted order or ranks. When the value range k is no larger than about n, counting beats comparison sorting; when k dwarfs n (values up to 10⁹), it does not.

### The pattern

Count each value into an array indexed by the value, then either write the values back in order or turn the counts into running totals. After the running sum, \`count[v]\` is the number of elements less than or equal to v, which hands every element its rank directly. To sort records stably by a small key, compute the running totals and place records from the back of the input, each at its key's next free slot counting down.

\`\`\`python
def counting_sort(nums, max_value):    # 0 <= x <= max_value
    count = [0] * (max_value + 1)
    for x in nums:
        count[x] += 1
    out = []
    for v, c in enumerate(count):
        out.extend([v] * c)
    return out
\`\`\`

### Cost

O(n + k) time and O(k) extra space for values in \`[0, k]\`. H-Index uses the same idea with values capped at n, because a citation count above n counts the same as n.

### Common mistakes

- Allocating \`max_value + 1\` slots when values can be negative; shift every value by the minimum first.
- Using it when k is far larger than n, so the count array dominates both time and memory.
- An off-by-one between "less than" and "less than or equal" when reading ranks from the running totals.
- Placing records front to back against running totals that point at each key's last slot, which reverses equal keys and loses stability.

### Start with

- [Height Checker](/problems/height-checker): sorted order from counts.
- [Relative Sort Array](/problems/relative-sort-array): counts written back in a custom order.
- [H-Index](/problems/h-index): counting with the values capped at n.`,
  "divide-and-conquer": `### When to reach for it

A question about pairs \`(i, j)\` with \`i < j\` that a nested loop answers in O(n²) — count the inversions, the pairs with \`nums[i] > 2 * nums[j]\`, the smaller elements to the right of each — where splitting the array lets each half be sorted and the pairs that cross the split be counted in a linear merge. Also searches that can throw away half, or a quadrant, at every step.

### The pattern

Recurse on each half, then combine. In the merge-sort family both halves come back sorted, so for each element of the left half the cross pairs it forms are counted by a pointer that only ever moves forward through the right half — before or during the merge, while each element's side is still known.

\`\`\`python
def sort_count(a):                  # (sorted copy of a, inversion count)
    if len(a) <= 1: return a, 0
    h = len(a) // 2
    (left, x), (right, y) = sort_count(a[:h]), sort_count(a[h:])
    merged, inv, j = [], x + y, 0
    for v in left:
        while j < len(right) and right[j] < v:
            merged.append(right[j])
            j += 1
        inv += j                    # right[:j] are all smaller than v
        merged.append(v)
    return merged + right[j:], inv
\`\`\`

### Cost

The recurrence T(n) = 2T(n/2) + O(n) solves to O(n log n), with recursion O(log n) deep and O(n) for the merge buffers. A combine step that sorts instead of merging costs O(n log n) per level, making the whole O(n log² n).

### Common mistakes

- Counting cross pairs after the merge, when it is no longer known which side an element came from.
- Using \`<=\` where the pair condition is strict, which counts equal elements as inversions.
- Overflow: n = 10⁵ allows about 5 × 10⁹ inversions, beyond a 32-bit \`int\`.
- A split that does not shrink the range, which recurses until the stack runs out.

### Start with

- [Sort an Array](/problems/sort-an-array): merge sort written by hand.
- [Count Inversions](/problems/count-inversions): counting while merging.
- [Reverse Pairs](/problems/reverse-pairs): a cross-pair condition that differs from the merge order.`,
  "game-theory": `### When to reach for it

"Both players play optimally", "Alice moves first", "return true if the first player wins", "the most the first player can score". Two families recur: win-or-lose games over a position (take one to three stones, replace n by n − x for a divisor x), and score games where players take from the ends of a row or the front of a pile.

### The pattern

For win-or-lose games, compute \`win[p]\` for small positions bottom-up; the table often exposes a rule that replaces it — in Nim with moves of one to three stones, a multiple of 4 loses. For score games, track one difference instead of two scores: \`best(i, j)\` is the most the player to move can finish ahead on \`nums[i..j]\`, and each choice subtracts the opponent's best on what remains.

\`\`\`python
from functools import lru_cache

def first_player_wins(nums):        # Predict the Winner: a tie wins
    @lru_cache(None)
    def best(i, j):                 # mover's lead over nums[i..j]
        if i > j:
            return 0
        return max(nums[i] - best(i + 1, j), nums[j] - best(i, j - 1))
    return best(0, len(nums) - 1) >= 0
\`\`\`

### Cost

Positions × moves per position: O(n²) for the interval games above and O(n × moves) for single-pile games. A rule, once proved, is O(1).

### Common mistakes

- Playing both sides greedily: taking the larger end every turn is not optimal play.
- Keeping both scores in the state instead of their difference, which multiplies the number of states.
- Misreading ties: check whether a draw counts as a win for the first player.
- Trusting a pattern spotted in three or four small cases without checking more, or proving it.

### Start with

- [Nim Game](/problems/nim-game): a table that collapses to one rule.
- [Divisor Game](/problems/divisor-game): parity decides it.
- [Predict the Winner](/problems/predict-the-winner): a score difference over an interval.`,
  "queue": `### When to reach for it

Items served in arrival order, some sent back to the end — a ticket line, round-robin turns, cards dealt with the next one moved to the bottom, senators who each act in turn. Whenever the statement says "goes to the back of the line", model it with a queue. A double-ended queue opens the other end as well, which is what the sliding-window maximum and 0-1 BFS need.

### The pattern

Load the initial order, then loop: take from the front, apply the rule, and put the item at the back if it is still in play. When the loop would run too long, find the arithmetic the queue performs. In Time Needed to Buy Tickets, everyone up to position k buys at most \`tickets[k]\` tickets before k is done and everyone behind at most \`tickets[k] - 1\`, so one pass of \`min\` gives the answer.

\`\`\`python
from collections import deque

def deck_revealed_increasing(deck):
    order = deque(range(len(deck)))     # positions, in reveal order
    out = [0] * len(deck)
    for card in sorted(deck):
        out[order.popleft()] = card
        if order:
            order.append(order.popleft())  # next card goes to the bottom
    return out
\`\`\`

### Cost

O(1) per enqueue and dequeue on a real queue, so a simulation costs O(number of operations); a circular buffer of fixed capacity uses O(capacity) space.

### Common mistakes

- Dequeuing with \`list.pop(0)\` in Python or \`shift()\` in JavaScript, which can cost O(n) each time.
- In a circular buffer, confusing full with empty when \`head == tail\`; keep a count, or leave one slot unused.
- Simulating every round when the counts are large, instead of computing the rounds directly.
- Re-queueing an item after its last action.

### Start with

- [Time Needed to Buy Tickets](/problems/time-needed-to-buy-tickets): a queue, then the arithmetic behind it.
- [Reveal Cards In Increasing Order](/problems/reveal-cards-in-increasing-order): simulating positions, not cards.
- [Dota2 Senate](/problems/dota2-senate): two queues taking turns.`,
  "recursion": `### When to reach for it

The problem is defined by a smaller copy of itself: nested structure (\`3[a2[c]]\`), a value given by a recurrence (Fibonacci, powers), a number reduced by a fixed step (is n a power of three? Divide by 3 and ask again), a choice repeated at every position. If you can say "the answer for n is built from the answer for something smaller", that sentence is the function.

### The pattern

Trust the recursive call: assume it returns the right answer for the smaller input and write only how to build this answer from it. Then check that the base case catches every input the step can reach — including 0, 1, the empty input and negatives. If the same arguments come back again and again, memoise.

\`\`\`python
def power(x, n):                    # x to the n, n >= 0, in O(log n) calls
    if n == 0:
        return 1
    half = power(x, n // 2)
    return half * half if n % 2 == 0 else half * half * x
\`\`\`

### Cost

Time is the number of calls times the work per call. Space is the maximum depth, since every pending call holds a stack frame. Naive Fibonacci makes O(φⁿ) calls, about 1.6ⁿ; memoised, it makes O(n).

### Common mistakes

- A base case some inputs step past: \`n == 0\` when n can be negative, or a step of 2 that jumps over it.
- Making the same call twice, as in \`power(x, n // 2) * power(x, n // 2)\`, which turns O(log n) calls into O(n).
- Running out of stack: Python stops at 1,000 frames by default, so recursion over a 10⁵-long input needs a loop or an explicit stack.
- Slicing or concatenating at every level, a hidden O(n) per call.

### Start with

- [Power of Three](/problems/power-of-three): one step towards the base case.
- [Fibonacci Number](/problems/fibonacci-number): two calls, and why memoising matters.
- [Decode String](/problems/decode-string): recursion that mirrors the nesting.`,
  "topological-sort": `### When to reach for it

"Prerequisites", "dependencies", "must come before", "an order in which to run the tasks", "can all the courses be finished" — a directed graph where you need an order consistent with every edge, or proof that none exists. Also dynamic programming over a directed acyclic graph: the longest path, the number of routes, or the earliest round each task can run, each computed in topological order.

### The pattern

Kahn's algorithm suits most of these. Count in-degrees, start with every node of in-degree 0, and repeatedly take one, append it to the order and decrement its neighbours' in-degrees, adding any that reach 0. If the order ends with fewer than n nodes, the rest lie on a cycle or behind one. Taking the ready nodes one layer at a time gives the fewest rounds when independent tasks can run together.

\`\`\`python
def topo_order(n, edges):           # edge (a, b): a must come before b
    adj, indeg = [[] for _ in range(n)], [0] * n
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1
    order = [i for i in range(n) if indeg[i] == 0]
    for u in order:                 # the list grows as nodes are freed
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                order.append(v)
    return order if len(order) == n else []     # [] means a cycle
\`\`\`

### Cost

O(V + E) time and space, for Kahn's algorithm and for the depth-first version alike.

### Common mistakes

- Edge direction: in Course Schedule, \`[a, b]\` means b is taken before a; building it the other way round still finds cycles but gives the order reversed.
- Starting from one node of in-degree 0 instead of all of them.
- In the depth-first version, a single visited set, which cannot tell a back edge (a cycle) from a finished node.
- Assuming the order is unique; when the smallest order in dictionary order is wanted, use a heap in place of the queue.

### Start with

- [Course Schedule](/problems/course-schedule): does any order exist?
- [Course Schedule II](/problems/course-schedule-ii): return one.
- [Parallel Courses](/problems/parallel-courses): the order, one layer per semester.`,
  "enumeration": `### When to reach for it

The limits are small enough to count the work in advance: n ≤ 100 allows every triple (about 1.6 × 10⁵ for n = 100), n ≤ 20 every subset (about a million), and values up to 10⁴ allow trying every candidate answer. "Count the triplets that satisfy…", "how many integers in \`[low, high]\` are symmetric" and "can these digits be rearranged into a power of two" are meant to be enumerated — over the right set.

### The pattern

Estimate first: candidates × cost of checking each should stay around 10⁷–10⁸ simple steps. Then choose what to enumerate, usually the smaller side. Reordered Power of 2 does not try the orderings of n's digits (up to 10! ≈ 3.6 million); it compares digit counts with the 31 powers of two below 2³¹. Generate each candidate once: start \`j\` at \`i + 1\`, not at 0.

\`\`\`python
from collections import Counter

def reordered_power_of_2(n):
    digits = Counter(str(n))
    return any(Counter(str(1 << k)) == digits for k in range(31))
\`\`\`

### Cost

Exactly the number of candidates times the cost of each check: O(n³) for triples, O(2ⁿ × n) for subsets, O(range × digits) for a numeric range. An early exit improves the constant; choosing what to enumerate changes the bound.

### Common mistakes

- Counting one combination several times by starting every loop at index 0.
- Enumerating the larger of two equivalent sets, such as the digit orderings rather than the targets.
- Skipping the estimate: with n = 10⁴, an O(n³) loop is 10¹² steps.
- An off-by-one at either end of an inclusive range \`[low, high]\`.

### Start with

- [Count Good Triplets](/problems/count-good-triplets): every triple, checked directly.
- [Count Square Sum Triples](/problems/count-square-sum-triples): enumerating two values, deriving the third.
- [Reordered Power of 2](/problems/reordered-power-of-2): enumerating the targets instead.`,
  "combinatorics": `### When to reach for it

"How many ways", "how many distinct arrangements", and nearly always "modulo 10⁹ + 7": far too many to list, so the count comes from a formula or a recurrence. Independent choices multiply; positions picked from a set are a binomial coefficient; a bag of items put in order is a multinomial.

### The pattern

Match the objects one to one with something standard. A right-or-down path through an m × n grid is a sequence of m − 1 downs and n − 1 rights: C(m + n − 2, m − 1) paths. A word's orderings are n! divided by the factorial of each letter's count. Under a prime modulus p, divide by multiplying with the inverse \`pow(x, p - 2, p)\` (Fermat's little theorem). Failing a formula, a [Dynamic Programming](/challenges/dynamic-programming) recurrence counts.

\`\`\`python
def make_choose(n, mod=10**9 + 7):  # C(a, b) % mod for 0 <= a <= n, mod prime
    fact = [1] * (n + 1)
    for i in range(1, n + 1):
        fact[i] = fact[i - 1] * i % mod
    inv = [1] * (n + 1)
    inv[n] = pow(fact[n], mod - 2, mod)     # Fermat: x^(p-2) is 1/x mod p
    for i in range(n, 0, -1):
        inv[i - 1] = inv[i] * i % mod
    def choose(a, b):
        return 0 if b < 0 or b > a else fact[a] * inv[b] % mod * inv[a - b] % mod
    return choose
\`\`\`

### Cost

O(n) to build the tables, then O(1) per binomial. Pascal's rule — each entry the sum of the two above it — fills an O(n × k) table with no division, for a non-prime modulus.

### Common mistakes

- Dividing after reducing: \`(a % p) / b\` is not \`(a / b) % p\`; multiply by the inverse.
- Overflow: two residues below 10⁹ + 7 multiply to about 10¹⁸, beyond 32 bits. Reduce after every product.
- Counting one arrangement twice: ordered where the question is unordered, or identical items treated as distinct.
- Off-by-one formulas (m − 1 moves down, not m); check each against brute force on tiny inputs.

### Start with

- [Sum of All Subset XOR Totals](/problems/sum-of-all-subset-xor-totals): a bit set in any element is set in half the subset XORs.
- [Unique Paths](/problems/unique-paths): a path as a choice of positions.
- [Count Anagrams](/problems/count-anagrams): factorials over repeated letters, modulo a prime.`,
  "brainteaser": `### When to reach for it

The brute force simulates n rounds or sums over every pair or triple, n reaches 10⁵ or 10⁹, and yet the problem is too plain to want a data structure. Odd operations ("replace \`nums[i]\` with \`nums[i] AND (nums[i] XOR x)\`"), rounds of toggles and games with perfect play are typical; games have their own page, [Game Theory](/challenges/game-theory).

### The pattern

Write the brute force, run it for n from 1 to 20, and study the table. Then ask what the operation cannot change — a parity, a bit that can only be cleared, a total — or how often each element contributes. In Bulb Switcher, bulb i is toggled once per divisor of i; divisors pair up as d and i ÷ d except a square root, so only perfect squares stay on: ⌊√n⌋ of them.

\`\`\`python
from math import isqrt

def bulbs_on_brute(n):              # the simulation, for small n
    on = [False] * (n + 1)
    for step in range(1, n + 1):
        for i in range(step, n + 1, step):
            on[i] = not on[i]
    return sum(on)

def bulbs_on(n):                    # odd number of divisors: perfect squares
    return isqrt(n)
\`\`\`

### Cost

The observation turns O(n²) or O(n × rounds) into O(n) or O(1). The brute force runs only on small cases: its job is to find the pattern and check it.

### Common mistakes

- Trusting a pattern seen in four or five cases; compare the formula with the simulation on twenty.
- \`int(sqrt(n))\` can be off by one for large n; use an integer square root such as Python's \`isqrt\`.
- Edge cases the formula treats differently: n = 0, n = 1, an empty array.
- In XORs over all pairs, reasoning about values instead of how often each appears; XOR keeps only each count's parity.

### Start with

- [Nim Game](/problems/nim-game): a multiple of 4 always loses.
- [Bulb Switcher](/problems/bulb-switcher): counting divisors without counting them.
- [Bitwise XOR of All Pairings](/problems/bitwise-xor-of-all-pairings): how often each value enters the total.`,
  "geometry": `### When to reach for it

Points as \`[x, y]\`, circles as \`[x, y, r]\`, rectangles or heights on a grid, with a question about collinearity, distance, area or containment. Integer coordinates, up to 10⁴ or 10⁹, say that the exact answer needs no floating point.

### The pattern

Replace division and square roots with multiplication. Three points are collinear when the cross product of \`b - a\` and \`c - a\` is zero — no slope, no vertical special case — and its sign tells a left turn from a right. Compare distances by their squares: dx² + dy² ranks points as the distance does, and a point is inside or on a circle when dx² + dy² ≤ r². To group points by slope, reduce the direction by its gcd, fix its sign and use it as a [Hash Table](/challenges/hash-table) key.

\`\`\`python
from math import gcd

def cross(o, a, b):                 # > 0 left turn, < 0 right turn, 0 collinear
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def direction(p, q):                # slope from p to q as an exact key, p != q
    dx, dy = q[0] - p[0], q[1] - p[1]
    g = gcd(dx, dy)
    dx, dy = dx // g, dy // g
    if dx < 0 or (dx == 0 and dy < 0):
        dx, dy = -dx, -dy           # one sign, so p→q and q→p agree
    return dx, dy
\`\`\`

### Cost

Every pair of points is O(n²); with a map of directions per anchor point, Max Points on a Line is O(n²) time and O(n) space.

### Common mistakes

- Floating-point slopes: \`dy / dx\` fails on vertical lines, close slopes can round alike, and Java's \`Double\` keys tell 0.0 from −0.0.
- Overflow: with coordinates up to 10⁹, a cross product or squared distance reaches about 10¹⁸; use 64-bit integers.
- Duplicate points have no direction between them; count them apart and add them to every line through that point.
- Reading "inside or on" as \`<\`: a point on the boundary satisfies \`<=\`.

### Start with

- [Check If It Is a Straight Line](/problems/check-if-it-is-a-straight-line): one cross product per point.
- [K Closest Points to Origin](/problems/k-closest-points-to-origin): ranking by squared distance.
- [Max Points on a Line](/problems/max-points-on-a-line): exact slopes as hash keys.`,
  "rolling-hash": `### When to reach for it

Many substring comparisons: every window of length m against a pattern, every window of one array against every window of another, every prefix against the suffix of the same length. "The longest repeated" or "the longest common" piece adds a [Binary Search](/challenges/binary-search) on the length, since a repeat of length L contains repeats of every shorter length.

### The pattern

Read a window as the digits of a number in base B, modulo a large prime M. To slide one step, subtract the outgoing character times Bᵐ⁻¹, multiply by B, add the incoming character and reduce. Equal windows always hash alike and unequal ones rarely do, so on a match compare the characters, or keep two hashes with different moduli. Prefix hashes give any substring's hash in O(1).

\`\`\`python
def find_all(text, pattern, B=256, M=(1 << 61) - 1):
    m, hp, hw = len(pattern), 0, 0
    top = pow(B, m - 1, M)              # weight of the outgoing character
    for a, b in zip(pattern, text):
        hp, hw = (hp * B + ord(a)) % M, (hw * B + ord(b)) % M
    out = []
    for i in range(len(text) - m + 1):
        if hw == hp and text[i:i + m] == pattern:   # confirm: hashes collide
            out.append(i)
        if i + m < len(text):
            hw = ((hw - ord(text[i]) * top) * B + ord(text[i + m])) % M
    return out
\`\`\`

### Cost

O(n + m) time and O(1) extra space, plus O(m) per confirmation — O(n × m) on \`aaaa…a\`, where every window matches; two hashes and no confirming stay linear at a tiny risk.

### Common mistakes

- One small modulus: 10⁵ window hashes modulo about 10⁹ in a set give about n² ÷ 2M ≈ 5 false matches.
- A negative value after removing the outgoing character in Java, C++ or JavaScript; add M before the remainder.
- Overflow: with M near 10⁹ and a small base, \`hash * B\` fits even JavaScript's 2⁵³; M = 2⁶¹ − 1 needs 128-bit products.
- Weighting the outgoing character by Bᵐ instead of Bᵐ⁻¹.

### Start with

- [Maximum Length of Repeated Subarray](/problems/maximum-length-of-repeated-subarray): window hashes plus a binary search on length.
- [String Matching: All Occurrences](/problems/string-matching-all-occurrences): Rabin–Karp, overlaps included.
- [Longest Happy Prefix](/problems/longest-happy-prefix): prefix and suffix hashes grown together.`,
  "quickselect": `### When to reach for it

"The k-th largest", "the k-th smallest", "the median", "the k closest": one position of the sorted order, or the items below it, but not the order itself. Sorting costs O(n log n), a [Heap](/challenges/heap) capped at k O(n log k), and quickselect O(n) on average.

### The pattern

Pick a random pivot and split the values into below, equal and above. If position k falls among the equal ones, the pivot is the answer; otherwise continue in the side that holds k, shifting k when it is the upper side. The k-th largest is position n − k + 1 in ascending order. In-place versions, with Lomuto's or Hoare's partition, narrow a \`[lo, hi]\` range instead of building lists.

\`\`\`python
import random

def kth_smallest(nums, k):          # k is 1-based; average O(n)
    pivot = random.choice(nums)
    lo = [x for x in nums if x < pivot]
    hi = [x for x in nums if x > pivot]
    if k <= len(lo):
        return kth_smallest(lo, k)
    if k > len(nums) - len(hi):
        return kth_smallest(hi, k - (len(nums) - len(hi)))
    return pivot                    # every copy of pivot sits between lo and hi
\`\`\`

### Cost

About n + n/2 + n/4 + … ≈ 2n steps: O(n) on average, O(n²) when every pivot is an extreme. The lists above take O(n) extra space; in place it is O(1). Median of medians guarantees O(n) but is slower in practice.

### Common mistakes

- Always pivoting on the first or last element, so already-sorted input costs O(n²).
- A two-way partition, such as Lomuto's, on many equal values: an array of identical numbers shrinks by one element per round.
- Mixing up 1-based k, a 0-based index, and largest with smallest.
- Expecting the k low items to come out sorted; K Closest Points to Origin has to sort them afterwards.

### Start with

- [Kth Smallest Element](/problems/kth-smallest-element): the select itself, on distinct values.
- [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): duplicates, and counting from the other end.
- [K Closest Points to Origin](/problems/k-closest-points-to-origin): selecting by squared distance, then sorting the k.`,
  "string-matching": `### When to reach for it

"Find every occurrence", "is goal a rotation of s", "is s made of copies of one block". Checking each start position letter by letter is O(n × m): fine for short strings, too slow when the text runs to 10⁵ and the pattern is long or mostly one letter.

### The pattern

Reduce first. \`goal\` is a rotation of \`s\` exactly when the lengths match and \`goal\` occurs in \`s + s\`; \`s\` repeats a shorter block exactly when it occurs in \`s + s\` without its first and last characters. Then search in linear time. The Z-function gives each position's longest match with the string's start; over \`pattern + text\`, a text position whose value reaches the pattern's length starts a match. [KMP](/challenges/kmp) builds a border table instead.

\`\`\`python
def find_all(text, pattern):        # every start index, overlaps included
    s, m = pattern + text, len(pattern)
    n = len(s)
    z, l, r = [0] * n, 0, 0         # z[i]: common prefix of s and s[i:]
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return [i - m for i in range(m, n) if z[i] >= m]
\`\`\`

### Cost

The Z-function and KMP take O(n + m) time and space, Rabin–Karp the same on average. A library search is not guaranteed linear: Java's \`indexOf\` is naive, O(n × m) at worst.

### Common mistakes

- Missing overlapping matches by resuming at i + m after a match at i, not i + 1.
- Skipping the length check in the rotation test: "ab" occurs in "abcabc" but is not a rotation of "abc".
- Joining pattern and text with a separator that can occur in the input, so a match spans the join.
- Comparing \`text[i:i + m] == pattern\` at every position: a hidden O(m) copy per step.

### Start with

- [Rotate String](/problems/rotate-string): a rotation is a substring of \`s + s\`.
- [Repeated Substring Pattern](/problems/repeated-substring-pattern): \`s\` inside \`s + s\` with its ends trimmed.
- [String Matching: All Occurrences](/problems/string-matching-all-occurrences): every overlapping match in linear time.`,
  "bucket-sort": `### When to reach for it

Ordering by a key whose range is small and known: a frequency (1 to n), a score out of 100, a character. "Top k frequent" and "sort by frequency" are the interview forms; the textbook one spreads evenly distributed real numbers into equal slices of their range. For keys up to 10⁹ and a small n, a comparison sort or a heap is simpler.

### The pattern

Count, then make one list per possible key — for frequencies, indices 0 to n — and append each value to its count's list. Reading from the top index down gives the most frequent first; take the first k. A tie rule such as "smaller value first" needs each bucket sorted, or the values appended in that order. One bucket per small integer value is [Counting Sort](/challenges/counting-sort).

\`\`\`python
from collections import Counter

def top_k_frequent(nums, k):        # most frequent first; ties in any order
    count = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]    # index = frequency
    for x, c in count.items():
        buckets[c].append(x)
    out = []
    for f in range(len(nums), 0, -1):   # highest frequency first
        out.extend(buckets[f])
    return out[:k]
\`\`\`

### Cost

Counting, filling and reading are each O(n): O(n) time and space, against O(n log n) for sorting by count and O(n log k) for a heap. The textbook version averages O(n) but degrades to sorting one crowded bucket.

### Common mistakes

- Sizing the buckets by the number of distinct values rather than n + 1, when one value can make up the whole input.
- Bucketing by value instead of by count, which needs a slot for every possible value.
- Reading the buckets from index 0, least frequent first.
- Ignoring the tie rule, which Top K Frequent Elements and Sort Characters By Frequency both state.

### Start with

- [Top K Frequent Elements](/problems/top-k-frequent-elements): buckets indexed by count, read from the top.
- [Sort Characters By Frequency](/problems/sort-characters-by-frequency): the same buckets, each character repeated by its count.`,
  "kmp": `### When to reach for it

A pattern in a long text where the naive scan could reach O(n × m) — and, more often in interviews, a question about borders, prefixes that are also suffixes: "the longest happy prefix", "the shortest palindrome by adding characters in front", "the smallest period", "is s one block repeated".

### The pattern

\`pi[i]\` is the length of the longest proper prefix of \`s[:i + 1]\` that is also its suffix. Build it left to right: extend the previous border by one character, or on a mismatch fall back to the border's border, \`k = pi[k - 1]\`, until it extends or reaches 0. To search, run it over \`pattern + "#" + text\`: a value equal to the pattern's length ends a match. For Shortest Palindrome, the last value over \`s + "#" + s[::-1]\` is the longest palindromic prefix. The smallest period is \`n - pi[n - 1]\`.

\`\`\`python
def prefix_function(s):             # pi[i]: longest proper border of s[:i + 1]
    pi = [0] * len(s)
    for i in range(1, len(s)):
        k = pi[i - 1]               # the border we try to extend
        while k and s[i] != s[k]:
            k = pi[k - 1]           # fall back to the border's border
        if s[i] == s[k]:
            k += 1
        pi[i] = k
    return pi
\`\`\`

### Cost

O(n) time and space: k rises by at most one per character, so the fallbacks total at most n. A search is O(n + m), with O(m) space if the text streams against the pattern's table.

### Common mistakes

- Counting the whole string as its own border; borders are proper, so \`pi[0]\` is 0.
- Falling back to \`pi[k]\` instead of \`pi[k - 1]\`; the length-k prefix's border sits at its last index.
- A separator that can occur in the input, so a border runs across the join.
- Resetting to 0 on a mismatch instead of falling back: it misses \`aab\` in \`aaab\`.

### Start with

- [Longest Happy Prefix](/problems/longest-happy-prefix): the table's last value.
- [Shortest Palindrome](/problems/shortest-palindrome): a border of the string joined to its reverse.`,
  "merge-sort": `### When to reach for it

A sort that must be O(n log n) on every input, or stable, or on a linked list, or on data too large for memory. Above all here: counting pairs i < j whose values satisfy an order condition — inversions, \`nums[i] > 2 * nums[j]\`, earlier values that are smaller — where brute force is O(n²) and n reaches 10⁵.

### The pattern

Split in half, sort each half recursively, and merge with two pointers that take the smaller head. With both halves sorted, every cross pair has its left element earlier in the array, and a pointer moving only forward through the right half counts them for every left element in one pass; pairs inside a half were counted lower down. Count before merging when the condition differs from the merge's comparison, as in Reverse Pairs. A [Binary Indexed Tree](/challenges/binary-indexed-tree) counts the same pairs one insertion at a time.

\`\`\`python
from heapq import merge

def reverse_pairs(nums):            # pairs i < j with nums[i] > 2 * nums[j]
    def go(a):                      # (a sorted, pairs inside a)
        if len(a) <= 1: return a, 0
        (L, x), (R, y) = go(a[:len(a) // 2]), go(a[len(a) // 2:])
        count, j = x + y, 0
        for v in L:                 # both halves sorted: j only moves forward
            while j < len(R) and v > 2 * R[j]: j += 1
            count += j
        return list(merge(L, R)), count     # the linear merge
    return go(nums)[1]
\`\`\`

### Cost

T(n) = 2T(n/2) + O(n): O(n log n) on every input, O(n) extra space, recursion O(log n) deep. Linked lists merge by relinking, with no buffer.

### Common mistakes

- Taking from the right half on a tie (\`<\` instead of \`<=\`), which makes the sort unstable.
- Counting cross pairs after the merge, when an element's half is no longer known.
- Overflow: \`2 * nums[j]\` passes 2³¹ − 1 when values reach 10⁹; compute it in 64 bits.
- With an inclusive \`hi\`, recursing on \`[lo, mid]\` and \`[mid, hi]\`: a two-element range never shrinks.

### Start with

- [Reverse Pairs](/problems/reverse-pairs): a cross-pair count taken before each merge.
- [Create Sorted Array Through Instructions](/problems/create-sorted-array-through-instructions): for each value, the earlier values smaller and larger.`,
  "sieve-of-eratosthenes": `### When to reach for it

Primality or factors for many numbers below a bound you can allocate: count the primes below n, factorise every element of an array with values up to 10⁶. Trial division costs O(√n) a number, O(n√n) for all; one sieve answers them all. For a single number, or values up to 10¹², trial division is the tool — see [Number Theory](/challenges/number-theory).

### The pattern

Mark every number from 2 up as prime. For each still-marked p with p × p ≤ n, cross out p², p² + p, p² + 2p and so on; a smaller multiple k × p with k < p has a smaller prime factor and is already crossed out. Record the first prime to reach each number and the sieve also factorises: divide x by its smallest prime factor until 1 is left, O(log x) steps. A number is prime when it is its own smallest factor.

\`\`\`python
def smallest_prime_factors(n):      # spf[x] for x <= n; spf[x] == x means prime
    spf = list(range(n + 1))
    p = 2
    while p * p <= n:
        if spf[p] == p:             # nothing smaller divides p, so p is prime
            for m in range(p * p, n + 1, p):
                if spf[m] == m:     # first prime to reach m is its smallest
                    spf[m] = p
        p += 1
    return spf
\`\`\`

### Cost

O(n log log n) time — the crossings sum to n/2 + n/3 + n/5 + …, about n × ln ln n — and O(n) memory: ten million flags are 10 MB as bytes, about 80 MB as a Python list.

### Common mistakes

- Stopping the outer loop before √n: \`range(2, int(sqrt(n)))\` leaves 49 marked prime when n = 49. The bound is p × p ≤ n, inclusive.
- Allocating n flags, then clearing \`is_prime[0]\` and \`is_prime[1]\`, which fails when n is 0 or 1 — Count Primes allows both.
- Crossing out the multiples of every p, not only the primes: still correct, but O(n log n).
- Counting 0 and 1 as primes because they were never cleared.

### Start with

- [Count Primes](/problems/count-primes): the sieve itself, counted strictly below n.`,
  "suffix-array": `### When to reach for it

Many questions about one string's substrings: the longest one that repeats, how many are distinct, the longest common substring of two strings, or comparing two substrings over and over inside a loop. Sorted suffixes put each substring beside its other occurrences.

### The pattern

The suffix array lists the suffix starts in sorted order; its inverse, \`rank[i]\`, says where suffix i landed. Prefix doubling sorts by the first 1, 2, 4, 8 … characters, each round sorting pairs of the previous ranks. Kasai's algorithm then fills the LCP array, the common prefix of each pair of neighbours, in O(n). Equal-length substrings at i and j are equal when their suffixes' LCP reaches the length, and otherwise ordered as \`rank[i]\` and \`rank[j]\`. For a few thousand characters, \`lcp[i][j] = lcp[i + 1][j + 1] + 1\` when \`s[i] == s[j]\` does the same with less code.

\`\`\`python
def suffix_array(s):                # starts of the suffixes, in sorted order
    n, k = len(s), 1
    rank, sa = [ord(c) for c in s], list(range(n))
    while True:
        key = lambda i: (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)            # by the first 2k characters
        new = [0] * n
        for a, b in zip(sa, sa[1:]):
            new[b] = new[a] + (key(a) != key(b))
        rank, k = new, 2 * k
        if not n or rank[sa[-1]] == n - 1:  # every rank distinct: sorted
            return sa
\`\`\`

### Cost

Prefix doubling with a comparison sort is O(n log² n); radix-sorting the pairs gives O(n log n), and SA-IS O(n). Kasai is O(n). Space is O(n), against O(n²) for the quadratic table.

### Common mistakes

- Sorting the suffixes as strings, \`sorted(range(n), key=lambda i: s[i:])\`, which copies O(n²) characters.
- Ranking a suffix that has run out of characters after one that continues; the empty remainder sorts first — the \`-1\` in the key.
- Reading the LCP of two arbitrary suffixes from one entry; it is the LCP array's minimum between their ranks.
- Stopping the doubling after a fixed number of rounds, not when every rank is distinct.

### Start with

- [Number of Ways to Separate Numbers](/problems/number-of-ways-to-separate-numbers): an O(1) comparison of equal-length substrings inside a dynamic programming table.`,
  "trie": `### When to reach for it

Many words and questions about their prefixes: does any stored word start with this, which root is the shortest prefix of this word, is every prefix of a word also a word. A whole-word lookup is a [Hash Table](/challenges/hash-table) job. Built over bits, highest first, a trie also finds the largest XOR of two numbers.

### The pattern

Each node maps a character to a child and flags where a word ends. Insert walks the word, creating missing children, and flags the last node; search walks the same way and fails at the first missing child. Every node passed spells a prefix of the word, so the first flagged one is its shortest stored prefix.

\`\`\`python
def insert(trie, word):
    node = trie
    for ch in word:
        node = node.setdefault(ch, {})  # the child, created if missing
    node["$"] = True                    # a word ends here

def shortest_root(trie, word):          # shortest stored prefix, or None
    node = trie
    for i, ch in enumerate(word):
        node = node.get(ch, {})         # {} once the path runs out
        if "$" in node: return word[:i + 1]
    return None
\`\`\`

### Cost

O(L) per insert or search for a word of length L, however many words are stored, and at most one node per character inserted. A 26-slot array per node is faster than a dictionary and far larger.

### Common mistakes

- Taking a path for a word: "app" lies on the path of "apple" but is stored only if its node is flagged.
- Checking the flag only at the end of the word, which misses every shorter root.
- 26-slot arrays for 10⁵ words of length 100: up to 2.6 × 10⁸ slots.
- Building a bit trie lowest bit first, when the highest differing bit decides an XOR.

### Start with

- [Replace Words](/problems/replace-words): the shortest stored prefix of each word.
- [Longest Word in Dictionary](/problems/longest-word-in-dictionary): a word whose every prefix is flagged.
- [Maximum XOR of Two Numbers in an Array](/problems/maximum-xor-of-two-numbers-in-an-array): a trie over bits, greedy from the top.`,
  "trees": `### When to reach for it

"n nodes and n − 1 edges", "rooted at node 0", "\`manager[i]\` is the manager of i", "the subtree of node i". With one path between any two nodes there is no route to choose and nothing to mark visited but the parent. Most questions are a value flowing down from the root (an arrival time, a depth) or a summary flowing up from the leaves (a subtree's size or label counts).

### The pattern

Build an adjacency list and run a [Depth-First Search](/challenges/depth-first-search) from the root, passing the parent so the walk never climbs back up. Values flowing down travel as arguments; values flowing up are combined after the children return.

\`\`\`python
def subtree_sizes(n, edges):            # tree rooted at node 0
    adj, size = [[] for _ in range(n)], [1] * n
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    def walk(u, parent):
        for v in adj[u]:
            if v != parent:             # never back up the edge just used
                walk(v, u)
                size[u] += size[v]      # v's subtree is complete by now
    walk(0, -1)
    return size
\`\`\`

### Cost

O(n) time and space, since a tree has n − 1 edges. The recursion is as deep as the tree is tall, n − 1 for a path. A parent array is the same tree: u's children are the i with \`parent[i] == u\`.

### Common mistakes

- Walking back to the parent: each undirected edge is stored both ways, so the recursion never ends.
- Recursing 10⁵ levels in Python (default limit 1,000 frames); process a breadth-first order in reverse instead, children before parents.
- Assuming an edge \`[u, v]\` names the parent first; root the tree yourself.
- Forgetting the one-node tree, whose edge list is empty.

### Start with

- [Reachable Nodes With Restrictions](/problems/reachable-nodes-with-restrictions): one walk that refuses some nodes.
- [Time Needed to Inform All Employees](/problems/time-needed-to-inform-all-employees): a time passed down a manager array.
- [Minimum Fuel Cost to Report to the Capital](/problems/minimum-fuel-cost-to-report-to-the-capital): subtree sizes decide the cars on each road.`,
  "segment-tree": `### When to reach for it

An array that changes while range questions arrive: the sum, minimum or OR of \`nums[l..r]\` between updates, 10⁵ of each. Prefix sums answer a range in O(1) but take O(n) per update; a segment tree does both in O(log n). Indexed by value, it counts the inserted values below x. For prefix sums alone, a [Binary Indexed Tree](/challenges/binary-indexed-tree) is shorter.

### The pattern

Iteratively, the values sit at \`tree[n:]\` and node \`i\` combines children \`2i\` and \`2i + 1\`. An update changes a leaf and every ancestor: a sum adds the delta, a minimum or OR recomputes each from its two children. A query on \`[l, r)\` climbs from both ends; at an odd end, the node just inside lies in the range but its parent does not, so it is added alone.

\`\`\`python
def add(tree, n, i, delta):             # nums[i] += delta; nums[i] is tree[n + i]
    i += n
    while i:
        tree[i] += delta                # the leaf, then every ancestor
        i //= 2

def range_sum(tree, n, l, r):           # sum of nums[l:r]
    total, l, r = 0, l + n, r + n
    while l < r:
        total += (tree[l] if l % 2 else 0) + (tree[r - 1] if r % 2 else 0)
        l, r = (l + 1) // 2, r // 2
    return total
\`\`\`

### Cost

O(log n) per update and per query, in 2n cells. Building is O(n): fill the leaves, then each node from its children, \`n - 1\` down to 1. The recursive form extends to range updates (lazy propagation) but needs up to 4n cells.

### Common mistakes

- Sizing a recursive tree at 2n cells: unless n is a power of two it needs up to 4n.
- Mixing half-open \`[l, r)\` and closed \`[l, r]\` ranges.
- Storing something two halves cannot be combined into, such as a count of distinct values.
- Indexing by value when values reach 10⁹; compress them to ranks first.

### Start with

- [Create Sorted Array Through Instructions](/problems/create-sorted-array-through-instructions): counts indexed by value, two range sums per insertion.
- [Find Subarray With Bitwise OR Closest to K](/problems/find-subarray-with-bitwise-or-closest-to-k): a range OR, binary searched from each left end.`,
  "binary-indexed-tree": `### When to reach for it

Counting pairs \`i < j\` by value — inversions, smaller elements after each one, reverse pairs, range sums within bounds — when n reaches 10⁵ and the pair loop is O(n²). Also running totals under single-element changes, or an item's position in a list being rearranged. It needs an inverse, as sums and XOR have; for range minimums use a [Segment Tree](/challenges/segment-tree).

### The pattern

Positions start at 1. Cell \`i\` holds the sum of the last \`i & -i\` values up to position \`i\`, so \`add\` climbs by adding the lowest set bit and \`prefix\` descends by clearing it. For inversions, compress the values to ranks 1 to m and scan: the earlier values greater than x number \`seen - prefix(tree, rank[x])\`; then call \`add(tree, rank[x], 1)\`.

\`\`\`python
def add(tree, i, delta):                # tree[0] is unused; i starts at 1
    while i < len(tree):
        tree[i] += delta
        i += i & -i                     # climb: add the lowest set bit

def prefix(tree, i):                    # sum of positions 1..i
    total = 0
    while i > 0:
        total += tree[i]
        i -= i & -i                     # descend: clear the lowest set bit
    return total
\`\`\`

### Cost

O(log n) per \`add\` and per \`prefix\`, with n + 1 cells of memory. Counting pairs over n elements is O(n log n), including the sort that compresses the values. Any range sum is \`prefix(r) - prefix(l - 1)\`.

### Common mistakes

- Using position 0: \`0 & -0\` is 0, so \`add\` loops for ever. Shift every position up by one.
- Skipping coordinate compression when values are negative or reach 10⁹.
- \`prefix(rank)\` where \`prefix(rank - 1)\` was meant; that choice decides whether equal values count.
- Reading \`tree[i]\` as the value at i; that is \`prefix(i) - prefix(i - 1)\`.

### Start with

- [Count Inversions](/problems/count-inversions): ranks and prefix counts in one scan.
- [Queries on a Permutation With Key](/problems/queries-on-a-permutation-with-key): positions that shift as items move to the front.
- [Count of Smaller Numbers After Self](/problems/count-of-smaller-numbers-after-self): the same count, scanning from the right.`,
  "ordered-set": `### When to reach for it

A collection that changes while you ask about its order: the smallest free chair, the smallest value at least \`arr[i]\` to its right, the maximum and minimum after each change. A [Heap](/challenges/heap) suffices when only one end matters; an ordered set also removes any element and finds ceilings (the first value at least x) and floors (the last value at most x).

### The pattern

Java's \`TreeSet\` and \`TreeMap\` (\`ceiling\`, \`floor\`, \`higher\`, \`lower\`, \`pollFirst\`) and C++'s \`std::set\` and \`std::map\` (\`lower_bound\`, \`upper_bound\`) are balanced search trees. Python has none built in; a list kept sorted with \`bisect\` does the lookups. Scanning from the right, querying before inserting, gives each index its ceiling among the elements after it.

\`\`\`python
from bisect import bisect_left, insort

def odd_jumps(arr):                     # the j > i with the smallest arr[j] >= arr[i]
    right, out = [], [-1] * len(arr)    # right: sorted (value, index) pairs after i
    for i in range(len(arr) - 1, -1, -1):
        k = bisect_left(right, (arr[i], i))     # equal values: the smaller index
        if k < len(right):
            out[i] = right[k][1]
        insort(right, (arr[i], i))
    return out
\`\`\`

### Cost

A balanced tree inserts, removes and finds a ceiling or floor in O(log n). A sorted Python list finds in O(log n) but inserts in O(n) as elements shift: fine for tens of thousands, and \`sortedcontainers\` goes further.

### Common mistakes

- Repeated values in a \`TreeSet\` or \`std::set\`, which keep one copy; use a \`TreeMap\` of counts or a \`std::multiset\`.
- Erasing a value from a \`std::multiset\`, which removes every copy; erase the one iterator \`find\` returns.
- \`ceiling(x)\` may return x itself, \`higher(x)\` never does; "at least" or "greater than" decides.
- No element qualifying: Java gives \`null\`, C++ \`end()\`, \`bisect\` the list's length.

### Start with

- [The Number of the Smallest Unoccupied Chair](/problems/the-number-of-the-smallest-unoccupied-chair): the smallest free chair as friends come and go.
- [132 Pattern](/problems/132-pattern): the smallest value on the right above the minimum on the left.
- [Odd Even Jump](/problems/odd-even-jump): ceilings and floors, scanning from the right.`,
  "monotonic-queue": `### When to reach for it

The maximum or minimum of a window sliding forward: of every window of size k, of \`dp[j]\` over the last k positions, of prefix sums in the shortest subarray reaching k with negatives allowed. It is a [Monotonic Stack](/challenges/monotonic-stack) with a second exit at the front for old indices. If elements leave out of order, use a heap with lazy deletion.

### The pattern

Keep indices whose values decrease from front to back (for a maximum). Before pushing \`i\`, pop from the back every index whose value is no larger: \`i\` is newer and at least as large, so it outlasts them. Drop the front once it leaves the window; the front is the window's answer. In a DP, expire, read the front for \`dp[i]\`, then push.

\`\`\`python
from collections import deque

def max_sliding_window(nums, k):
    dq, out = deque(), []               # indices; their values decrease
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                    # beaten by a newer, larger value
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()                # fell out of the window
        if i >= k - 1: out.append(nums[dq[0]])
    return out
\`\`\`

### Cost

Each index is pushed and popped at most once: O(n) time and O(k) space, against O(n log n) for a heap of \`(value, index)\` pairs.

### Common mistakes

- Storing values, not indices, so there is no telling when the front expired.
- An off-by-one in the bound: the window of size k ending at \`i\` starts at \`i - k + 1\`.
- In a DP, pushing \`i\` before reading the front, so \`dp[i]\` is computed from itself.
- In Shortest Subarray with Sum at Least K, popping the front only on expiry; it also leaves once it meets the sum, as later ends only lengthen that subarray.

### Start with

- [Sliding Window Maximum](/problems/sliding-window-maximum): the plain decreasing deque.
- [Constrained Subsequence Sum](/problems/constrained-subsequence-sum): the best \`dp[j]\` among the last k positions.
- [Shortest Subarray with Sum at Least K](/problems/shortest-subarray-with-sum-at-least-k): an increasing deque of prefix sums, popped from both ends.`,
  "memoization": `### When to reach for it

A recursion that is correct but slow because the same arguments keep coming back: a Fibonacci-like recurrence, the paths onward from each cell, Collatz step counts shared by many starting values. The arguments that change are the state; if the distinct states fit in memory, cache each answer. A cache also spares you the filling order a bottom-up table needs — that form is on [Dynamic Programming](/challenges/dynamic-programming).

### The pattern

Write the recursion with its base cases, make sure everything the result depends on is an argument, then cache: Python's \`functools.cache\` does it in one line; elsewhere use a hash map keyed by the arguments, or an array holding a sentinel such as −1.

\`\`\`python
from functools import cache

def count_increasing_paths(grid):       # strictly increasing paths, any length
    m, n = len(grid), len(grid[0])
    @cache
    def paths_from(r, c):               # the cell alone, plus every way onward
        total = 1
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > grid[r][c]:
                total += paths_from(nr, nc)
        return total
    return sum(paths_from(r, c) for r in range(m) for c in range(n))
\`\`\`

### Cost

Distinct states × work per state, plus a cache entry per state: O(m × n) above. The first call can recurse as deep as the longest chain of states, past Python's 1,000-frame default on large inputs.

### Common mistakes

- Depending on state outside the arguments — a visited set, a running total — so a cached answer is reused where it no longer holds.
- A mutable argument as the key: Python refuses a list. Pass indices or tuples.
- A memo kept in a global or a class field and not cleared between test cases.
- Caching a recursion whose arguments rarely repeat, which spends memory for nothing.

### Start with

- [Climbing Stairs](/problems/climbing-stairs): the recursion that is exponential without a cache.
- [Sort Integers by The Power Value](/problems/sort-integers-by-the-power-value): one cache shared by every starting value.
- [Number of Increasing Paths in a Grid](/problems/number-of-increasing-paths-in-a-grid): a memo where a table's order would be awkward.`,
  "bitmask": `### When to reach for it

One dimension is tiny — up to 20 tasks, nodes or slots, the ten primes below 30, a grid five cells wide — and what matters is which items are used, not their order: "assign every task", "visit every node". 2²⁰ is about a million states; much beyond 20 items, look elsewhere.

### The pattern

Let \`dp[mask]\` be the best result using exactly the items in \`mask\`. A transition adds an item (\`mask | (1 << i)\`) or a submask; increasing \`mask\` order works, as setting a bit makes the number larger. A walk through every node must also know where it is: the state is (mask, last item). Bit basics are on [Bit Manipulation](/challenges/bit-manipulation).

\`\`\`python
def min_sessions(tasks, limit):         # fewest sessions of at most limit hours
    n = len(tasks)
    best = [(n + 1, 0)] * (1 << n)      # best[mask]: (sessions, hours in the last one)
    best[0] = (1, 0)
    for mask in range(1 << n):
        s, used = best[mask]
        for i, t in enumerate(tasks):
            if not mask & (1 << i):     # task i is not done yet
                nxt = (s, used + t) if used + t <= limit else (s + 1, t)
                best[mask | (1 << i)] = min(best[mask | (1 << i)], nxt)
    return best[-1][0]
\`\`\`

### Cost

O(2ⁿ × n) time and O(2ⁿ) space when each transition adds one item. Looping over every submask of every mask is O(3ⁿ), about 1.4 × 10⁷ for n = 15. A last item in the state multiplies both by n.

### Common mistakes

- A state missing what the future needs: a walk through every node needs the current node too.
- Starting entries at 0 in a minimisation, so impossible subsets look free; start at infinity.
- The submask loop \`sub = (sub - 1) & mask\` ends at 0: handle the empty submask apart, or it is skipped or never stops.
- One bit per slot when a slot holds two items; use two bits, or base 3.

### Start with

- [Minimum Number of Work Sessions to Finish the Tasks](/problems/minimum-number-of-work-sessions-to-finish-the-tasks): a pair of numbers per subset.
- [Shortest Path Visiting All Nodes](/problems/shortest-path-visiting-all-nodes): breadth-first search over (node, visited set).
- [Count the Number of Square-Free Subsets](/problems/count-the-number-of-square-free-subsets): a mask over the ten primes below 30.`,
  "digit-dp": `### When to reach for it

"How many integers from 1 to n" (or in \`[low, high]\`) have a property of their digits: contain a 7, repeat no digit, have a digit sum divisible by k — or how often digit d is written. With n up to 10¹⁸ testing each is hopeless, but n has at most 19 digits. A range is \`count(high) - count(low - 1)\`.

### The pattern

It is [Dynamic Programming](/challenges/dynamic-programming) over the digits of n, chosen from the most significant end. The state is the position, a tight flag — true while every digit so far equals n's, so the next may not exceed n's digit there — and whatever the property needs: a count, a sum modulo k, a mask of digits used, whether the number has started. Memoise on that state.

\`\`\`python
from functools import cache

def count_digit_one(n):                 # 1s written across 0..n
    s = str(n)
    @cache
    def go(i, tight, ones):             # s[:i] decided; tight: equal to n so far
        if i == len(s):
            return ones
        top = int(s[i]) if tight else 9
        return sum(go(i + 1, tight and d == top, ones + (d == 1)) for d in range(top + 1))
    return go(0, True, 0)
\`\`\`

### Cost

States × choices: positions × 2 for the flag × the property's own range, with up to 10 digits tried from each state. Counting ones up to 10⁹ takes a few hundred states and a few thousand steps; looping over the numbers takes a billion.

### Common mistakes

- Letting the next digit run to 9 while the prefix is still tight, which counts numbers above n.
- Leading zeros: 007 is 7, so for "no repeated digit" its zeros must not count; carry a started flag.
- \`count(high) - count(low)\` for an inclusive range, which drops \`low\` itself.
- A memo array shared across different n: tight states depend on n's digits, so clear it, or cache only the states that are not tight.

### Start with

- [Number of Digit One](/problems/number-of-digit-one): the tight flag and a running count.`,
  "shortest-path": `### When to reach for it

Weighted edges and the cheapest route: a signal reaching every node, the cheapest flight, the fewest obstacles removed. The weights choose the algorithm. All equal: [Breadth-First Search](/challenges/breadth-first-search). Only 0 and 1: a deque, 0-cost moves pushed at the front. Non-negative: Dijkstra. Negative, or a cap on edges: Bellman–Ford. All pairs on a few hundred nodes: Floyd–Warshall.

### The pattern

Dijkstra keeps a heap of \`(distance, node)\` pairs. Pop the smallest, skip it if stale (larger than the distance recorded), and otherwise relax each outgoing edge, pushing any neighbour whose distance improves. A node's distance is final when first popped, which needs every weight to be non-negative.

\`\`\`python
import heapq

def dijkstra(adj, src):                 # adj[u] = [(v, w), ...] with w >= 0
    dist, heap = {src: 0}, [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue        # a stale entry
        for v, w in adj[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist
\`\`\`

### Cost

Dijkstra with a binary heap is O((V + E) log V) time and O(V + E) space. 0-1 BFS is O(V + E). Bellman–Ford is O(V × E), or O(k × E) for k rounds. Floyd–Warshall is O(V³).

### Common mistakes

- Dijkstra with a negative edge, after which a popped distance is no longer final.
- Marking a node done when it is first pushed, as BFS does; a cheaper route to it can turn up later.
- "At most k stops" by Dijkstra on distance alone, which discards a dearer route with stops to spare; run k + 1 Bellman–Ford rounds, each reading the previous round's copy.
- \`INT_MAX\` as infinity plus a weight, which overflows in Java or C++.

### Start with

- [Network Delay Time](/problems/network-delay-time): Dijkstra from one source, then the largest distance.
- [Cheapest Flights Within K Stops](/problems/cheapest-flights-within-k-stops): a cap on edges, in Bellman–Ford rounds.
- [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner): 0-1 BFS on a grid.`,
  "minimum-spanning-tree": `### When to reach for it

"Connect all the points, cities or computers at minimum total cost", any two linkable at a known price. The answer is a tree of n − 1 links. It is not a shortest-path question: it minimises total weight, not any distance between two nodes. Edges may be listed, or implicit: every pair of points, priced by distance.

### The pattern

Kruskal sorts the edges by weight and keeps each one whose ends are still in different components, tracked by [Union Find](/challenges/union-find), until n − 1 are kept. Prim grows one tree from any node: it keeps each outside node's cheapest link into the tree, adds the cheapest such node and updates the rest. On a complete graph, Prim with a plain array never builds the edges.

\`\`\`python
def min_cost_connect(points):           # Prim on the complete graph, O(n²)
    n, total = len(points), 0
    cost = [0] + [float("inf")] * (n - 1)   # cheapest link from each node into the tree
    done = [False] * n
    for _ in range(n):
        u = min((cost[i], i) for i in range(n) if not done[i])[1]
        done[u], total = True, total + cost[u]
        x, y = points[u]
        for v, (px, py) in enumerate(points):
            if not done[v]:
                cost[v] = min(cost[v], abs(px - x) + abs(py - y))
    return total
\`\`\`

### Cost

Kruskal is O(E log E) for the sort plus near-constant union-find work per edge. Prim with a heap is O(E log V). Prim with an array, as above, is O(V²): the better choice when every pair is an edge, since E is then about V² ÷ 2.

### Common mistakes

- Summing Dijkstra's tree: the shortest paths from one node rarely form the cheapest tree overall.
- Adding an edge in Kruskal without checking that its ends are in different components, which closes a cycle.
- Building and sorting all n(n − 1) ÷ 2 pairs of a dense graph, which the array version of Prim never needs.
- Assuming connectivity: fewer than n − 1 edges taken means there is no spanning tree.

### Start with

- [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points): a complete graph priced by Manhattan distance.`,
  "biconnected-component": `### When to reach for it

"Which connections are critical", "which single server, road or cell disconnects the rest if it fails", "the fewest removals that split the network" — single points of failure in an undirected graph. Removing each edge in turn and re-testing connectivity costs O(E × (V + E)); one depth-first search with low-link values finds every bridge and articulation point in O(V + E).

### The pattern

Number the nodes in the order a [Depth-First Search](/challenges/depth-first-search) discovers them (\`disc\`); \`low[u]\` is the smallest number u's subtree reaches by tree edges down, then one other edge up. After child v returns, u–v is a bridge if \`low[v] > disc[u]\`, and u an articulation point if \`low[v] >= disc[u]\`. Non-tree edges join a node to an ancestor or descendant, so depth can serve as \`disc\`.

\`\`\`python
def critical_connections(adj):          # connected, undirected, no repeated edges
    disc, low, out = [-1] * len(adj), [0] * len(adj), []
    def dfs(u, parent, depth):
        disc[u] = low[u] = depth
        for v in adj[u]:
            if disc[v] == -1:
                dfs(v, u, depth + 1)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]: out.append([u, v])
            elif v != parent: low[u] = min(low[u], disc[v])
    dfs(0, -1, 0)
    return out
\`\`\`

### Cost

O(V + E) time and space for the one search, against O(E × (V + E)) for removing each edge and re-checking.

### Common mistakes

- Skipping the parent by node when edges repeat: two edges between u and v are never a bridge, so skip only the edge you arrived by, by its index.
- Swapping the two conditions: \`>\` for bridges, \`>=\` for articulation points.
- Applying \`low[v] >= disc[u]\` to the root, where it always holds; the root is an articulation point only with two or more children in the search tree.
- Recursing 10⁵ levels deep in Python; write the search with an explicit stack.

### Start with

- [Critical Connections in a Network](/problems/critical-connections-in-a-network): every bridge, from one search.
- [Minimum Number of Days to Disconnect Island](/problems/minimum-number-of-days-to-disconnect-island): a whole island needs at most 2 days, and an articulation point makes it 1.`,
};
