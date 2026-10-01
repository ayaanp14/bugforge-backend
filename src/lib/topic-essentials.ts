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
};
