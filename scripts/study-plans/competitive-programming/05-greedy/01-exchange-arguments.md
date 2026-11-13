---
title: Greedy algorithms — choose, then prove by exchange
minutes: 14
seo-title: Greedy Algorithms and the Exchange Argument Proof
description: A greedy algorithm commits to the locally best choice. How to prove one with an exchange argument, activity selection by earliest finish, and when greedy fails.
question: What is an exchange argument in a greedy algorithm proof?
answer: An exchange argument proves a greedy algorithm optimal by taking any optimal solution and swapping its choices, one at a time, for the greedy's choices without making it worse. When the optimal solution has been turned into the greedy's solution and never lost value, the greedy's answer must be optimal too. It is the standard way to justify a sort-then-sweep greedy.
q: How do I know if a greedy algorithm is correct?
a: Try to prove it with an exchange argument, and try to break it with small counterexamples first. Brute-force every answer for inputs of five or six items and compare with the greedy. If a counterexample appears, the problem probably needs dynamic programming instead.
q: Why sort activities by end time and not by start time?
a: Taking the activity that finishes first leaves the most room for everything after it. Sorting by start fails on one long activity that starts first and blocks several short ones; sorting by length fails on a short activity that overlaps two others that would both fit.
q: When does a greedy algorithm fail?
a: When a locally best choice can rule out a better combination later. Coin change with coins 1, 3 and 4 and target 6 is the classic case: greedy takes 4 + 1 + 1, three coins, while 3 + 3 uses two. 0/1 knapsack fails the same way.
q: What is the time complexity of activity selection?
a: O(n log n) for the sort plus O(n) for one sweep over the sorted activities. The sweep keeps only the end time of the last activity taken.
---
A greedy algorithm makes the choice that looks best right now and never takes it back. It is the fastest kind of solution — usually a sort and one sweep — and the riskiest, because a plausible rule is often wrong. In a contest you want both halves: the rule, and a reason to believe it.

## The recipe

1. **Guess a rule** for the next choice: earliest end, smallest weight, largest ratio.
2. **Hunt for a counterexample** on tiny inputs — on paper, or with a brute force over every subset.
3. **Prove it with an exchange**: take any optimal answer, swap one of its choices for the greedy's, and show nothing got worse.
4. **Implement**: sort by the rule, sweep once. O(n log n).

## Activity selection, proved

Choose the most activities `[start, end)` with no two overlapping. The rule: **always take the one that finishes first** among those starting after the last one taken.

@figure exchange

Why the swap is safe: the greedy's first pick ends no later than *any* activity, so putting it in place of O's first one cannot collide with O's second. Repeat for each position and O becomes the greedy's answer without shrinking.

```cpp
sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a.second < b.second; });
ll freeAt = LLONG_MIN;
int taken = 0;
for (auto [s, e] : iv)
    if (s >= freeAt) { ++taken; freeAt = e; }
```

## Rules that look right and are not

- **Earliest start**: one long activity starting at 0 blocks everything.
- **Shortest first**: a short activity overlapping two compatible ones costs you one.
- **Largest coin first**: coins {1, 3, 4}, target 6 → greedy 4+1+1, best 3+3.

The fix for coin change and 0/1 knapsack is dynamic programming. The fractional knapsack *is* greedy (best value per kilogram first).

## The sweep family

Many interval problems are one sort plus one sweep over **events**:

- **Minimum platforms / meeting rooms**: turn each interval into +1 at its start and −1 at its end, sort the events, track the running count's maximum. Decide the tie order deliberately — does a train arriving at 10:00 need a fresh platform if another leaves at 10:00?
- **Order by a key that the exchange argument picks**: sort tasks by duration to maximise "deadline − finish time", because swapping two adjacent tasks out of that order never helps.

```game
type: pick
title: Greedy or not?
prompt: For each problem, pick the approach that is actually correct.
? Most non-overlapping meetings in one room.
* Sort by end time, take each that starts after the last taken
- Sort by start time, take each that fits
- Sort by length, take each that fits
> Earliest finish leaves the most room; the exchange argument proves it.
? Fewest coins for 6 with coins {1, 3, 4}.
- Greedy, largest coin first
* Dynamic programming over amounts
> Greedy gives 4+1+1. The optimum is 3+3, which only a DP over amounts finds.
? Fill a knapsack when items can be cut into fractions.
* Greedy by value per unit weight
- Dynamic programming over capacity
> Fractions remove the all-or-nothing choice, so the best ratio first is optimal.
? Platforms needed for trains given arrival and departure times.
* Sort all arrivals and departures as events and sweep a counter
- Sort trains by departure and count non-overlapping ones
> The answer is the most trains present at once: the running count's maximum.
? Do every task in some order; reward is deadline minus finish time. Maximise the total.
* Shortest duration first
- Earliest deadline first
- Largest deadline first
> Deadlines add up the same in any order; only the finish times change, and they sum smallest when short tasks go first.
```

## More practice

- [Non-overlapping Intervals](/problems/non-overlapping-intervals) — activity selection, counted the other way.
- [Minimum Number of Arrows to Burst Balloons](/problems/minimum-number-of-arrows-to-burst-balloons) — earliest end again.
- [Minimum Number of Platforms](/problems/minimum-number-of-platforms) — the event sweep.
- [Assign Cookies](/problems/assign-cookies) — sort both sides, match greedily.
- [Gas Station](/problems/gas-station) — a greedy with a one-line proof.
