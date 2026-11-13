---
title: Bit tricks for contests
minutes: 15
seo-title: Bit Manipulation Tricks for Competitive Programming in C++
description: Set, clear, toggle and test bits, cancel pairs with XOR, count bits with popcount, and enumerate every subset of n ≤ 20 items as a bitmask in C++.
question: What is a bitmask in competitive programming?
answer: A bitmask is an integer used as a set: bit i is 1 when element i is in. Setting, clearing, toggling and testing an element are single operations — x | (1 << i), x & ~(1 << i), x ^ (1 << i), (x >> i) & 1 — and counting from 0 to 2ⁿ − 1 visits every subset of n items exactly once.
q: How do I iterate over all subsets with bitmasks?
a: Loop `for (int m = 0; m < (1 << n); ++m)` and treat bit i of m as "element i is chosen", tested with `(m >> i) & 1`. That visits all 2ⁿ subsets once each, so with an O(n) body it fits for n up to about 20.
q: Why does XOR find the number that appears once?
a: XOR is commutative and associative, x ^ x = 0 and x ^ 0 = x. XOR-ing every value lets each pair cancel wherever its two copies sit, leaving only the unpaired value — in O(n) time and O(1) memory.
q: What does x & (x - 1) do?
a: It clears the lowest set bit of x. Subtracting 1 turns that bit off and every zero below it on; AND keeps only the bits both share. It counts set bits in a loop and tests for a power of two: x > 0 and x & (x − 1) == 0.
q: When do I need 1LL << i instead of 1 << i?
a: Whenever i can be 31 or more. The literal 1 is an int, so 1 << 40 shifts past its 32 bits, which is undefined behaviour, before any conversion to long long. Use 1LL << i and __builtin_popcountll for 64-bit masks.
---
An integer is a row of bits, and a row of bits is a **set**: bit i on means element i is in. Every operation on that set is one instruction.

## The five one-liners

```cpp
x |  (1 << i)        // add element i       (set bit i)
x & ~(1 << i)        // remove element i    (clear bit i)
x ^  (1 << i)        // flip element i      (toggle bit i)
(x >> i) & 1         // is i in the set?    (test bit i)
x & (x - 1)          // drop the lowest set bit
```

- Bit 0 is the rightmost. Bit i is worth 2ⁱ.
- Past bit 30, write `1LL << i`: `1 << 40` is undefined behaviour on an `int`.
- Builtins: `__builtin_popcountll(x)` counts set bits, `__builtin_ctzll(x)` counts trailing zeros (not for x = 0).
- `x & -x` keeps only the lowest set bit.

@figure mask-ops

```game
type: match
title: Operation to expression
prompt: Match what you want to do with the expression that does it.
- Set bit i => x | (1 << i)
- Clear bit i => x & ~(1 << i)
- Toggle bit i => x ^ (1 << i)
- Test bit i => (x >> i) & 1
- Keep only the lowest set bit => x & -x
- Count the set bits => __builtin_popcountll(x)
why: OR turns on, AND with a hole turns off, XOR flips, a shift and AND reads; x & -x and popcount are the two you reach for in Fenwick trees and counting.
```

## XOR cancels pairs

- `x ^ x = 0`, `x ^ 0 = x`, and the order does not matter.
- So XOR of a list where every value appears twice except one **is** that one — O(n) time, O(1) memory.
- Per-bit thinking: a pair differs in bit b when one has a 1 there and the other a 0. With c ones, that is c · (n − c) pairs — summing over bits replaces an O(n²) loop over pairs.

## Every subset is a mask

n ≤ 20 in the constraints is a hint: 2²⁰ ≈ 10⁶ subsets.

```cpp
for (int mask = 0; mask < (1 << n); ++mask) {
    ll s = 0;
    for (int i = 0; i < n; ++i)
        if ((mask >> i) & 1) s += a[i];
    // use the subset's sum s
}
```

- Counting from 0 to 2ⁿ − 1 visits every pattern of n bits once: every subset, the empty one included.
- Cost O(2ⁿ · n) ≈ 2 × 10⁷ for n = 20.

@figure subsets

## More practice

- [Single Number](/problems/single-number) — XOR the list.
- [Number of 1 Bits](/problems/number-of-1-bits) — popcount by hand.
- [Counting Bits](/problems/counting-bits) — popcount of i from i >> 1.
- [Subsets](/problems/subsets) — masks from 0 to 2ⁿ − 1.
- [Total Hamming Distance](/problems/total-hamming-distance) — count per bit.
