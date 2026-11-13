import { defineModule, type QuizSeed } from "../../dsl.js";
import { ACTIVITY_CASES, PLATFORM_CASES, TASK_CASES } from "./cases.js";

/** Questions are written with the right option first; rotate each one so the key lands in varied positions. */
const spread = (qs: QuizSeed[]): QuizSeed[] =>
  qs.map((q, i) => {
    const r = (i * 3 + 2) % q.options.length;
    return { ...q, options: [...q.options.slice(r), ...q.options.slice(0, r)], answer: (q.answer - r + q.options.length) % q.options.length };
  });

export default defineModule(import.meta.url, {
  slug: "greedy",
  title: "Greedy algorithms and exchange proofs",
  blurb: "Sort, sweep, commit: activity selection by earliest finish, event sweeps for platforms and rooms, ordering by an exchange argument — and the counterexamples that send a problem to DP instead.",
  icon: "list",
  overview: `A greedy algorithm makes the locally best choice and never revisits it, which usually means one sort and one sweep — the fastest solution a problem can have. It is also the easiest to get wrong: "earliest start", "shortest first" and "largest coin first" all sound right and all fail. This module teaches the habit that separates a lucky greedy from a correct one: guess a rule, hunt for a small counterexample, then prove it with an **exchange argument** — swap one choice of an optimal answer for the greedy's and show nothing got worse.

The lesson plays the exchange argument out on activity selection, frame by frame, then covers the rules that fail (and why coin change needs DP) and the sweep family: events sorted with a deliberate tie order. The exercises are activity selection and minimum platforms at 2 500 intervals with times up to 10⁹. The timed checkpoint orders tasks to maximise deadline minus finish time, where the proof decides the sort key and the total needs \`long long\`.`,
  lessons: [
    {
      slug: "exchange-arguments",
      file: "01-exchange-arguments.md",
      exercises: [
        {
          title: "Activity selection",
          prompt: `You are given \`n\` activities, each a half-open interval \`[s, e)\`. Choose as many as possible so that no two overlap. An activity that starts exactly when another ends does **not** overlap it. Print the largest number you can choose.

**Input:** \`n\` (\`1 ≤ n ≤ 2·10^5\`), then \`n\` lines \`s e\` (\`0 ≤ s < e ≤ 10^9\`).
**Output:** one integer.

\`\`\`text
11
1 4
3 5
0 6
5 7
3 9
5 9
6 10
8 11
8 12
2 14
12 16
\`\`\`
prints
\`\`\`text
4
\`\`\`

For example \`[1,4)\`, \`[5,7)\`, \`[8,11)\`, \`[12,16)\`.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, ll>> iv(n);   // {start, end}
    for (auto& [s, e] : iv) cin >> s >> e;
    // TODO: sort by end time
    // TODO: sweep, taking each activity that starts at or after the end of the last one taken
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, ll>> iv(n);   // {start, end}
    for (auto& [s, e] : iv) cin >> s >> e;

    // Earliest finish first: it leaves the most room for the rest (exchange argument).
    sort(iv.begin(), iv.end(), [](const auto& a, const auto& b) {
        return a.second != b.second ? a.second < b.second : a.first < b.first;
    });
    ll freeAt = LLONG_MIN;
    int taken = 0;
    for (const auto& [s, e] : iv) {
        if (s >= freeAt) {
            ++taken;
            freeAt = e;
        }
    }
    cout << taken << '\n';
    return 0;
}
`,
          hints: [
            "Which activity should certainly be in some optimal answer? Think about the one that frees the room soonest.",
            "Sort by end time. Keep the end of the last activity you took; take the next one whose start is at least that.",
            "Touching is allowed, so the test is s >= lastEnd, not s > lastEnd.",
          ],
          cases: ACTIVITY_CASES,
        },
        {
          title: "Minimum platforms",
          prompt: `\`n\` trains use a station. Train \`i\` occupies a platform from its arrival \`a_i\` to its departure \`d_i\`, **both inclusive** — so a train arriving at the very moment another departs needs a different platform. Print the minimum number of platforms the station needs.

**Input:** \`n\` (\`1 ≤ n ≤ 2·10^5\`), then \`n\` lines \`a d\` (\`0 ≤ a ≤ d ≤ 10^9\`).
**Output:** one integer.

\`\`\`text
6
900 910
940 1200
950 1120
1100 1130
1500 1900
1800 2000
\`\`\`
prints
\`\`\`text
3
\`\`\`

From 1100 to 1120 the trains arriving at 940, 950 and 1100 are all in.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, int>> events;   // {time, 0 = arrival / 1 = departure}
    for (int i = 0; i < n; ++i) {
        ll a, d;
        cin >> a >> d;
        // TODO: add an arrival event and a departure event
    }
    // TODO: sort so that at equal times arrivals come before departures, then sweep a counter
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, int>> events;   // {time, 0 = arrival / 1 = departure}
    events.reserve(2 * n);
    for (int i = 0; i < n; ++i) {
        ll a, d;
        cin >> a >> d;
        events.push_back({a, 0});
        events.push_back({d, 1});
    }
    // Times are inclusive, so at a tie the arrival must be counted before the
    // departure frees its platform: pair ordering puts 0 before 1.
    sort(events.begin(), events.end());
    int here = 0, most = 0;
    for (const auto& [t, kind] : events) {
        if (kind == 0) most = max(most, ++here);
        else --here;
    }
    cout << most << '\n';
    return 0;
}
`,
          hints: [
            "The answer is the largest number of trains in the station at one moment.",
            "Turn each train into two events, +1 at arrival and -1 at departure, sort them by time and keep a running count.",
            "Ties decide the answer: with inclusive times, process arrivals before departures at the same moment. Encoding arrival as 0 and departure as 1 makes pair sorting do it.",
          ],
          cases: PLATFORM_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "In the exchange argument for activity selection, why can the greedy's first activity replace an optimal schedule's first activity?",
          options: [
            "It ends no later than any activity, so it cannot overlap the optimal schedule's second one",
            "It starts earliest, so it is always in every optimal schedule",
            "It is the shortest activity",
            "Every optimal schedule already contains it",
          ],
          answer: 0,
          explanation: "The greedy's pick has the earliest end of all activities. The optimal schedule's second activity starts after its first ends, which is no earlier than the greedy's end, so the swap leaves a valid schedule of the same size. The greedy pick need not be in every optimum — only swappable into one.",
        },
        {
          prompt: "Coins {1, 3, 4}, amount 6. How many coins does largest-coin-first use, and what is the optimum?",
          options: ["3 coins; the optimum is 2", "2 coins; the optimum is 2", "3 coins; the optimum is 3", "4 coins; the optimum is 2"],
          answer: 0,
          explanation: "Greedy takes 4, then 1, then 1: three coins. 3 + 3 uses two. Coin systems like {1, 5, 10, 25} happen to be greedy-safe, but an arbitrary one needs a DP over amounts.",
        },
        {
          prompt: "Arrival and departure times are inclusive. One train departs at 10 and another arrives at 10. In the event sweep, which order at time 10 gives the right answer?",
          options: [
            "Arrival before departure",
            "Departure before arrival",
            "Either order gives the same answer",
            "Merge them into one event",
          ],
          answer: 0,
          explanation: "With inclusive times both trains are present at 10, so the arrival must be counted before the departure frees its platform. With half-open times the opposite order would be right — the tie rule follows the statement.",
        },
        {
          prompt: "Which greedy rule for picking the most non-overlapping intervals is correct?",
          options: ["Earliest end time first", "Earliest start time first", "Shortest interval first", "Fewest overlaps first, without recomputing"],
          answer: 0,
          explanation: "Earliest end is the one with an exchange proof. Earliest start fails on one long interval that starts first; shortest first fails when a short interval overlaps two compatible ones.",
        },
      ]),
    },
    {
      slug: "greedy-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Tasks and deadlines",
          prompt: `You must do \`n\` tasks one after another, starting at time 0, in any order you choose. Task \`i\` takes \`a_i\` units of time and has deadline \`d_i\`. If it finishes at time \`f\`, you earn \`d_i − f\` points — negative when it is late. Print the largest total you can earn.

**Input:** \`n\` (\`1 ≤ n ≤ 2·10^5\`), then \`n\` lines \`a d\` (\`1 ≤ a, d ≤ 10^6\`).
**Output:** one integer (possibly negative).

\`\`\`text
3
6 10
8 15
5 12
\`\`\`
prints
\`\`\`text
2
\`\`\`

The order 5, 6, 8 finishes at 5, 11, 19 and earns 7 − 1 − 4 = 2. Finish times add up past 10¹¹ on the hidden cases.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, ll>> t(n);   // {duration, deadline}
    for (auto& [a, d] : t) cin >> a >> d;
    // TODO: the total is sum(d) - sum(finish times); choose the order that makes the finish times smallest
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<ll, ll>> t(n);   // {duration, deadline}
    for (auto& [a, d] : t) cin >> a >> d;

    // sum(d) is the same in every order; sum(finish) is smallest with the
    // shortest task first (swapping an adjacent longer-then-shorter pair
    // lowers it), so sort by duration.
    sort(t.begin(), t.end());
    ll now = 0, total = 0;
    for (const auto& [a, d] : t) {
        now += a;
        total += d - now;
    }
    cout << total << '\n';
    return 0;
}
`,
          hints: [
            "Write the total as sum of deadlines minus sum of finish times. Which part depends on the order?",
            "Swap two adjacent tasks where the longer one goes first. What happens to the sum of their finish times?",
            "Sort by duration ascending and accumulate in long long: the finish times can sum to around 10^11 and beyond.",
          ],
          cases: TASK_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "What does an exchange argument show?",
          options: [
            "That an optimal solution can be changed into the greedy's solution without getting worse",
            "That the greedy is faster than dynamic programming",
            "That every solution is optimal",
            "That the input can be sorted in O(n log n)",
          ],
          answer: 0,
          explanation: "Swap the optimal solution's choices for the greedy's one at a time, each swap keeping it valid and no worse. At the end it is the greedy's solution, which is therefore optimal.",
        },
        {
          prompt: "Tasks and deadlines: why does the order of the deadlines not matter?",
          options: [
            "Every task's deadline is added exactly once whatever the order",
            "Because deadlines are sorted in the input",
            "Because late tasks earn nothing",
            "It does matter — sort by deadline",
          ],
          answer: 0,
          explanation: "The total is Σ d_i − Σ f_i. Σ d_i is a constant; only the finish times depend on the order, and they are smallest with the shortest tasks first.",
        },
        {
          prompt: "Two adjacent tasks with durations 5 then 2, starting at time T. Swapping them to 2 then 5 changes the sum of their two finish times by how much?",
          options: ["It drops by 3", "It drops by 7", "It rises by 3", "It does not change"],
          answer: 0,
          explanation: "5 then 2: finishes T+5 and T+7, sum 2T+12. 2 then 5: T+2 and T+7, sum 2T+9. The later task finishes at T+7 either way; the first finishes 3 earlier.",
        },
        {
          prompt: "Which problem is solved by a greedy algorithm?",
          options: [
            "Fractional knapsack",
            "0/1 knapsack",
            "Coin change with arbitrary coin values",
            "Longest increasing subsequence by always extending the last element",
          ],
          answer: 0,
          explanation: "When items can be cut, taking the best value per unit weight first is optimal. 0/1 knapsack and arbitrary coin change need DP.",
        },
        {
          prompt: "What is the cheapest way to test a greedy rule before a contest submission?",
          options: [
            "Compare it with a brute force on many small random inputs",
            "Submit it and read the verdict",
            "Check it on the sample only",
            "Measure its running time",
          ],
          answer: 0,
          explanation: "A brute force over every subset or order is easy to write for n ≤ 8 and finds a counterexample in seconds if the rule is wrong — far cheaper than a wrong-answer penalty.",
        },
        {
          prompt: "Activity selection: intervals `[1,3)`, `[3,5)`, `[2,4)`. How many can be chosen?",
          options: ["2", "1", "3", "0"],
          answer: 0,
          explanation: "Sorted by end: [1,3), [2,4), [3,5). Take [1,3); [2,4) starts at 2 < 3, skip; [3,5) starts at 3 ≥ 3, take. Touching is allowed, so 2.",
        },
        {
          prompt: "What is the time complexity of the minimum-platforms event sweep for n trains?",
          options: ["O(n log n)", "O(n)", "O(n²)", "O(T) where T is the largest time"],
          answer: 0,
          explanation: "Sorting the 2n events dominates; the sweep itself is O(n). A per-moment array would be O(T), and T reaches 10^9.",
        },
        {
          prompt: "Arrival/departure intervals are half-open `[a, d)`: a train leaving at 10 frees its platform for one arriving at 10. At a tie, which event goes first?",
          options: ["The departure", "The arrival", "It does not matter", "Whichever train has the smaller index"],
          answer: 0,
          explanation: "Half-open means the leaving train is gone at 10, so its −1 must be counted before the arriving train's +1. The inclusive version of the exercise needs the opposite order.",
        },
        {
          prompt: "Why does the tasks-and-deadlines total need `long long`?",
          options: [
            "Finish times are summed over up to 2·10^5 tasks, each up to about 2·10^11",
            "Deadlines can be negative",
            "Because sort requires 64-bit keys",
            "It does not; int is enough",
          ],
          answer: 0,
          explanation: "The last task finishes at up to 2·10^5 × 10^6 = 2·10^11, and the total subtracts many such finish times. int overflows long before.",
        },
        {
          prompt: "Your greedy passes the samples but you cannot find an exchange argument, and a brute force finds a counterexample with 4 items. What next?",
          options: [
            "Look for a dynamic programming formulation",
            "Submit anyway",
            "Sort in the opposite order",
            "Add a special case for 4 items",
          ],
          answer: 0,
          explanation: "A counterexample means the local choice can rule out a better combination. That is the signal to keep more state — a DP over prefixes, capacities or amounts.",
        },
      ]),
    },
  ],
});
