import { defineModule } from "../../dsl.js";
import { bigPairs, hammingCase, oddOneCase, pattern, subsetCase } from "./cases.js";

const TEMPLATE = String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
`;

export default defineModule(import.meta.url, {
  slug: "bit-manipulation",
  title: "Bit manipulation",
  blurb: "Set, clear, toggle and test bits, XOR's cancelling pairs, popcount, and every subset of n ≤ 20 items as a mask from 0 to 2ⁿ − 1.",
  icon: "cpu",
  overview: `An integer is a row of bits, and a row of bits is a set: bit i on means element i is in. That one view gives you O(1) set operations — set, clear, toggle, test — and a way to walk every subset of up to twenty items by counting from 0 to 2ⁿ − 1.

The module covers the five one-liners every contest solution uses, the builtins (\`__builtin_popcountll\`, \`__builtin_ctzll\`), XOR's habit of cancelling equal pairs, and the counting-per-bit trick that turns an O(n²) sum over pairs into O(30 · n). The exercises find the one unpaired value among thousands of 18-digit numbers, count the subsets that hit a target, and the checkpoint adds up the Hamming distance of every pair.`,
  lessons: [
    {
      slug: "bit-tricks-for-contests",
      file: "01-bit-tricks-for-contests.md",
      exercises: [
        {
          title: "The odd one out",
          prompt: `Every value in the list appears exactly twice — except one, which appears once. Print it.

**Constraints:** \`n\` is odd, \`1 ≤ n < 2·10⁵\`, \`1 ≤ aᵢ ≤ 10¹⁸\`. Use O(1) extra memory.

**Input:** \`n\`, then the \`n\` values.
**Output:** the value that appears once.

\`\`\`text
5
4 1 2 1 2
\`\`\`
prints
\`\`\`text
4
\`\`\``,
          starter: TEMPLATE + String.raw`    int n;
    cin >> n;
    // TODO: fold every value into one running value so that pairs cancel
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n;
    cin >> n;
    ll acc = 0;
    for (int i = 0; i < n; ++i) {
        ll x;
        cin >> x;
        acc ^= x;
    }
    cout << acc << '\n';
    return 0;
}
`,
          hints: [
            "x ^ x = 0 and x ^ 0 = x.",
            "XOR is commutative and associative, so the order of the values does not matter: every pair cancels wherever its two copies are.",
            "Values reach 10¹⁸, so the running XOR is a long long.",
          ],
          cases: [
            oddOneCase([4n, 1n, 2n, 1n, 2n], false),
            oddOneCase([1_000_000_000_000_000_000n]),
            oddOneCase([7n, 3n, 7n]),
            oddOneCase(bigPairs(1500, 123_456_789_012_345_678n)),
            oddOneCase(bigPairs(1500, 1n)),
          ],
        },
        {
          title: "Subsets that hit the target",
          prompt: `Count the subsets of the \`n\` numbers whose sum is exactly \`T\`. The empty subset has sum 0; equal numbers in different positions are different elements.

**Constraints:** \`1 ≤ n ≤ 20\`, \`1 ≤ aᵢ ≤ 10⁹\`, \`0 ≤ T ≤ 2·10¹⁰\`.

**Input:** \`n T\`, then the \`n\` numbers.
**Output:** the number of subsets.

\`\`\`text
3 11
3 5 6
\`\`\`
prints
\`\`\`text
1
\`\`\`
(only {5, 6}.)`,
          starter: TEMPLATE + String.raw`    int n;
    ll T;
    cin >> n >> T;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    // n <= 20: every mask from 0 to (1 << n) - 1 is one subset
    // TODO: for each mask, add a[i] when bit i is set; count the masks whose sum is T
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n;
    ll T;
    cin >> n >> T;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    ll count = 0;
    for (int mask = 0; mask < (1 << n); ++mask) {
        ll s = 0;
        for (int i = 0; i < n; ++i)
            if ((mask >> i) & 1) s += a[i];
        if (s == T) ++count;
    }
    cout << count << '\n';
    return 0;
}
`,
          hints: [
            "n ≤ 20 is the hint: 2²⁰ ≈ 10⁶ subsets, and 2²⁰ · 20 ≈ 2·10⁷ steps fits easily.",
            "Mask m stands for the subset { a[i] : bit i of m is 1 }; test bit i with (m >> i) & 1.",
            "Sums reach 2·10¹⁰ — long long. The empty subset (mask 0) counts when T is 0.",
          ],
          cases: [
            subsetCase([3, 5, 6], 11, false),
            subsetCase([5], 0),
            subsetCase(Array.from({ length: 20 }, () => 1), 10),
            subsetCase(Array.from({ length: 20 }, () => 1_000_000_000), 20_000_000_000),
            subsetCase(pattern(20, 7919, 13, 50).map((v) => v + 1), 200),
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which expression clears bit `i` of `x` and leaves the others alone?",
          options: ["`x | (1 << i)`", "`x & ~(1 << i)`", "`x ^ (1 << i)`", "`x >> i`"],
          answer: 1,
          explanation: "`~(1 << i)` is all ones except bit i, so AND keeps every other bit and forces bit i to 0. OR sets it, XOR toggles it (which would turn an off bit on).",
        },
        {
          prompt: "What is `x & (x - 1)` for x = 12 (binary 1100)?",
          options: ["4", "8", "11", "0"],
          answer: 1,
          explanation: "x − 1 = 1011. AND with 1100 gives 1000 = 8: the lowest set bit is cleared. Repeating it until x is 0 counts the set bits; x & (x − 1) == 0 tests for a power of two (x > 0).",
        },
        {
          prompt: "`long long x = 1 << 40;` — what goes wrong?",
          options: ["Nothing", "`1` is an int, so `1 << 40` shifts past its 32 bits — undefined behaviour — before the result is converted. Write `1LL << 40`", "It is a compile error", "It gives 2⁴⁰ − 1"],
          answer: 1,
          explanation: "The literal's type decides the shift's type. Any mask beyond bit 30 needs `1LL << i` (or `1ULL`), and `__builtin_popcountll` for 64-bit values.",
        },
        {
          prompt: "XOR of all of [6, 9, 6, 4, 9]?",
          options: ["4", "0", "6", "34"],
          answer: 0,
          explanation: "The two 6s cancel and the two 9s cancel, whatever their positions; 0 ^ 4 = 4.",
        },
      ],
    },
    {
      slug: "bit-manipulation-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Total Hamming distance",
          prompt: `The Hamming distance of two numbers is the number of bit positions where they differ — \`popcount(x ^ y)\`. Print the sum of the Hamming distances over all pairs \`i < j\`.

**Constraints:** \`1 ≤ n ≤ 2·10⁵\`, \`0 ≤ aᵢ < 2³⁰\`.

**Input:** \`n\`, then the \`n\` numbers.
**Output:** the total.

\`\`\`text
3
4 14 2
\`\`\`
prints
\`\`\`text
6
\`\`\`
(4 and 14 differ in 2 bits, 4 and 2 in 2, 14 and 2 in 2.)

Every pair is O(n²) = 2·10¹⁰ at the limits — think per bit instead.`,
          starter: TEMPLATE + String.raw`    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    // TODO: for each of the 30 bits, how many pairs differ in that bit?
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    ll total = 0;
    for (int b = 0; b < 30; ++b) {
        ll ones = 0;
        for (ll x : a) ones += (x >> b) & 1;
        total += ones * (n - ones);
    }
    cout << total << '\n';
    return 0;
}
`,
          hints: [
            "Comparing every pair is 2·10¹⁰ popcounts — too slow.",
            "Look at one bit position at a time. A pair differs there when one number has a 1 and the other a 0.",
            "With c ones at bit b, c · (n − c) pairs differ at b. Sum over the 30 bits: O(30 · n). The total reaches 3·10¹¹ — long long.",
          ],
          cases: [
            hammingCase([4, 14, 2], false),
            hammingCase([123_456]),
            hammingCase(Array.from({ length: 6000 }, (_, i) => (i % 2 ? (1 << 30) - 1 : 0))),
            hammingCase(pattern(5000, 1_000_003, 17, 1 << 30)),
            hammingCase(pattern(500, 2_654_435, 1, 1 << 30)),
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which expression tests whether bit `i` of `x` is set?",
          options: ["`x | (1 << i)`", "`(x >> i) & 1`", "`x ^ i`", "`x & i`"],
          answer: 1,
          explanation: "Shift bit i down to position 0 and mask it off: 1 when set, 0 otherwise. `x & i` tests the bits of the *number* i, not bit i.",
        },
        {
          prompt: "Which expression toggles bit `i`?",
          options: ["`x ^ (1 << i)`", "`x | (1 << i)`", "`x & (1 << i)`", "`~x`"],
          answer: 0,
          explanation: "XOR with a one-bit mask flips that bit and leaves the rest. `~x` flips every bit.",
        },
        {
          prompt: "`x & -x` for x = 40 (binary 101000) is…",
          options: ["8", "32", "40", "1"],
          answer: 0,
          explanation: "x & −x isolates the lowest set bit: 40 = 32 + 8, so 8. Fenwick trees step by exactly this amount.",
        },
        {
          prompt: "How do you test that a positive `x` is a power of two?",
          options: ["`x % 2 == 0`", "`(x & (x - 1)) == 0`", "`x >> 1 == 0`", "`__builtin_popcount(x) > 1`"],
          answer: 1,
          explanation: "A power of two has a single set bit; clearing the lowest set bit leaves 0. Even numbers like 6 fail the test, as they should.",
        },
        {
          prompt: "`__builtin_popcountll(x)` returns…",
          options: ["The number of set bits in a 64-bit x", "The position of the highest bit", "x rounded to a power of two", "The number of trailing zeros"],
          answer: 0,
          explanation: "popcount = population count, the number of 1 bits. `__builtin_ctzll` counts trailing zeros, `__builtin_clzll` leading zeros (both undefined for x = 0). C++20 also has `std::popcount` in `<bit>` for unsigned types.",
        },
        {
          prompt: "n = 20. How many masks does `for (int m = 0; m < (1 << n); ++m)` visit?",
          options: ["20", "400", "1,048,576", "2,097,152"],
          answer: 2,
          explanation: "2²⁰ = 1,048,576 — one per subset, the empty one included. With an O(n) inner loop that is about 2·10⁷ steps.",
        },
        {
          prompt: "Mask 13 (binary 1101) over a = [a0, a1, a2, a3] selects…",
          options: ["{a0, a2, a3}", "{a1, a2, a3}", "{a0, a1, a3}", "{a0, a1, a2}"],
          answer: 0,
          explanation: "13 = 8 + 4 + 1: bits 0, 2 and 3 are set, so a0, a2 and a3. Bit 0 is the rightmost digit.",
        },
        {
          prompt: "Why does XOR-ing every value find the single unpaired one?",
          options: [
            "Because XOR sorts the values",
            "XOR is commutative and associative with x ^ x = 0 and x ^ 0 = x, so every pair cancels wherever it is, leaving the single value",
            "Because the values are small",
            "It only works if the pairs are adjacent",
          ],
          answer: 1,
          explanation: "Regroup the terms so each pair sits together: each pair is 0, and 0 ^ single = single. No order is needed.",
        },
        {
          prompt: "`int` x = 5; what is `x << 1` and `x >> 1`?",
          options: ["10 and 2", "6 and 4", "10 and 3", "2 and 10"],
          answer: 0,
          explanation: "Shifting left by one doubles (101 → 1010 = 10); shifting right by one halves rounding down (101 → 10 = 2).",
        },
        {
          prompt: "The sum over all pairs of popcount(aᵢ ^ aⱼ), n = 2·10⁵ values below 2³⁰, is computed fastest by…",
          options: ["Every pair, O(n²)", "Per bit: with c ones at a bit, c · (n − c) pairs differ there — O(30 · n)", "Sorting the values", "A prefix array of popcounts"],
          answer: 1,
          explanation: "Each bit contributes independently; counting ones per bit replaces 2·10¹⁰ pair checks with 6·10⁶ steps.",
        },
        {
          prompt: "Iterating the submasks of `mask` with `for (int s = mask; s; s = (s - 1) & mask)` visits…",
          options: ["Every number below mask", "Every non-empty subset of mask's bits, each once, largest first", "Only single bits", "Every mask with the same popcount"],
          answer: 1,
          explanation: "Subtracting 1 and AND-ing with mask steps to the next smaller number made only of mask's bits. Add the empty submask 0 separately if you need it. Over all masks of n bits this totals 3ⁿ steps.",
        },
      ],
    },
  ],
});
