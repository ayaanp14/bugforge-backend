---
title: DP optimisations — prefix sums, a monotonic deque and bitmasks
minutes: 16
seo-title: DP Optimization Techniques in C++: Prefix Sums, Deque, Bitmask
description: Speed up a DP transition: prefix sums for range sums of the previous row, a monotonic deque for a sliding-window maximum, and bitmask DP for subsets.
question: How do you optimise a dynamic programming solution?
answer: Look at the transition, not the states. When each state sums a contiguous range of the previous row, keep prefix sums of that row and read the range in O(1). When it takes the maximum over a sliding window, keep a monotonic deque of candidates. Both remove a factor of k from O(n·k). For exponential problems on n ≤ 20, a bitmask indexes the subsets.
q: What is a monotonic deque in dynamic programming?
a: A deque of indices whose dp values decrease from front to back. Before pushing index i, pop every back entry with a value no larger than dp[i] — it can never be the maximum again — and pop the front when it leaves the window. The front is then the window's maximum, and each index is pushed and popped once, O(n) in all.
q: How do prefix sums speed up a DP transition?
a: If dp[i][k] = dp[i−1][k−c] + … + dp[i−1][k], the sum over a contiguous range of the previous row, build prefix sums P of that row once and read the range as P[k+1] − P[k−c]. The transition drops from O(c) to O(1), so the table costs O(n·K) instead of O(n·K·c). Take the difference modulo the prime, plus the prime.
q: What is bitmask DP?
a: Dynamic programming whose state includes a subset of up to about 20 items stored as the bits of an integer: bit j set means item j is used. The travelling-salesman DP dp[mask][v], the cheapest path visiting exactly mask and ending at v, has 2^n · n states and n transitions each — O(2^n · n²), which is about 600,000 steps at n = 12.
q: When is bitmask DP feasible?
a: When the set being chosen from has at most about 20 elements. 2^20 is about 10^6 masks; times n states per mask and n transitions, n ≤ 16 to 18 is the usual ceiling for O(2^n · n²), and n ≤ 20 to 22 for O(2^n · n).
---
A DP is states × transition cost. The states are usually fixed by the problem; the transition is where the speed hides. If one state reads a whole window of earlier states, the loop is O(n · k) — and 10⁵ × 10⁵ does not fit.

## Prefix sums: a range of the previous row in O(1)

Count the ways to share K sweets between n children when child i takes 0..cᵢ:

- `dp[i][k] = dp[i−1][k−cᵢ] + … + dp[i−1][k]` — a contiguous range of the previous row.
- Build prefix sums `P` of row i−1 once, then `dp[i][k] = P[k+1] − P[max(0, k−cᵢ)]`.
- O(n · K · c) becomes O(n · K). Under a modulus, add the prime before taking `%`.

@figure prefix-sums

## A monotonic deque: the maximum of a sliding window

Jump through an array, at most k cells at a time, maximising the sum of the cells you land on: `dp[i] = a[i] + max(dp[i−k..i−1])`.

- Keep a deque of indices whose dp values **decrease** from front to back.
- Pop the front when it falls out of the window; read the maximum there.
- Before pushing i, pop every back index with `dp ≤ dp[i]`: it is older *and* no better, so it can never win again.
- Each index enters and leaves once: O(n) instead of O(n · k).

@figure deque

```cpp
deque<int> dq{0};
for (int i = 1; i < n; ++i) {
    while (dq.front() < i - k) dq.pop_front();       // left the window
    dp[i] = a[i] + dp[dq.front()];                    // the window's best
    while (!dq.empty() && dp[dq.back()] <= dp[i]) dq.pop_back();
    dq.push_back(i);
}
```

## Bitmasks: DP over subsets

When n ≤ 20, a subset fits in an `int`: bit j set means item j is taken.

- `dp[mask][v]` = cheapest path that has visited exactly `mask` and stands at `v`.
- Transition: for each `u` not in `mask`, relax `dp[mask | 1 << u][u]`.
- 2ⁿ · n states, n moves each: O(2ⁿ · n²) — 600 000 steps at n = 12, 8.5 × 10⁷ at n = 18.

```game
type: match
title: Transition shape to speed-up
prompt: Match each transition to the trick that makes it fast.
- dp[i][k] sums dp[i−1][k−c..k] => prefix sums of the previous row
- dp[i] = a[i] + max of the last k dp values => monotonic deque
- the state is which of 12 cities are visited => bitmask over subsets
- dp[i] needs the minimum dp[j] for all j < i => a running minimum
```

## More practice

- [Sliding Window Maximum](/problems/sliding-window-maximum)
- [Jump Game VI](/problems/jump-game-vi)
- [Constrained Subsequence Sum](/problems/constrained-subsequence-sum)
- [Number of Dice Rolls With Target Sum](/problems/number-of-dice-rolls-with-target-sum)
- [Shortest Path Visiting All Nodes](/problems/shortest-path-visiting-all-nodes)
