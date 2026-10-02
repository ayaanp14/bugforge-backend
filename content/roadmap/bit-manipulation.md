---
title: Bit Manipulation
stage: bits
order: 1
minutes: 13
level: Intermediate
hub: bit-manipulation
practice: number-of-1-bits, power-of-two, single-number, missing-number, hamming-distance, counting-bits, subsets, sum-of-two-integers, single-number-ii
updated: 2026-10-03
seo-title: Bit Manipulation: Operators, Tricks and Bitmasks Explained
description: Learn bit manipulation: two's complement, the bitwise operators, tricks with n & (n − 1) and XOR, and bitmask subsets, in C++, Java, Python and JavaScript.
question: What is bit manipulation in programming?
answer: Bit manipulation means working directly on the binary digits of an integer with the bitwise operators AND, OR, XOR, NOT and the shifts. Each operator acts on every bit of a machine word in one step, so questions such as whether bit i is set, whether n is a power of two or which value appears only once are answered in constant time per number, with O(1) extra space.
q: What does n & (n - 1) do?
a: It clears the lowest set bit of n. Subtracting 1 turns the lowest 1 bit into 0 and every 0 below it into 1, leaving the higher bits alone, so the AND keeps only those higher bits. It is the basis of the power-of-two test and of counting set bits in one step per 1 bit.
q: Why does XOR find the number that appears once?
a: XOR satisfies x ^ x = 0 and x ^ 0 = x, and it is commutative and associative, so the order of the values does not matter. XOR the whole array together and every pair cancels to 0, leaving only the value without a partner. It takes one pass and one variable.
q: How are negative numbers stored in binary?
a: Almost every machine uses two's complement, where the top bit of a w-bit integer is worth minus 2 to the power w − 1 instead of plus. To negate a number you invert every bit and add 1, so −1 is all ones and −x equals ~x + 1. The ordinary adder then handles negative numbers with no special cases.
q: What is the difference between >> and >>> in Java?
a: The >> operator is an arithmetic shift: it fills the vacated top bits with copies of the sign bit, so a negative number stays negative. The >>> operator is a logical shift that fills them with zeros, treating the bits as unsigned. JavaScript has the same pair; C++ has only >>, and gets the logical behaviour by shifting an unsigned type.
q: How do you generate all subsets with bitmasks?
a: Number the n elements 0 to n − 1 and count a mask from 0 to 2ⁿ − 1. Bit i of the mask says whether element i is in the subset, so every mask is a different subset and every subset appears exactly once. Testing bit i is (mask >> i) & 1, and listing everything takes O(n × 2ⁿ) time.
---
Every integer in a computer is a row of **bits**, and a handful of operators work on those bits directly: AND, OR, XOR, NOT and the shifts. One such operation handles all 32 or 64 bits at once, which is why bit tricks appear whenever a problem says "constant extra space" or "the binary representation of n". The problems are short; the hard part is five or six identities, why each works, and the traps of signs and integer sizes.

## Binary representation

In **binary** each digit is a bit, 0 or 1, worth twice the bit to its right. Bits are numbered from the right starting at 0, so bit i is worth 2ⁱ.

@figure place-values

A 1 bit is a **set bit** and their number is the **popcount**. An `int` is 32 bits in Java and mainstream C++; a `long` or `long long` is 64.

## Negative numbers: two's complement

Almost every machine stores signed integers in **two's complement**: the top bit is worth minus what it would otherwise be, −128 in 8 bits and −2³¹ in a 32-bit `int`.

@figure twos-complement

Remember three consequences: `-x` is `~x + 1`, so `~x` is `-x - 1`; −1 is all ones in every width; and the range is lopsided, so negating the smallest value overflows — `Math.abs(Integer.MIN_VALUE)` in Java is still negative.

## The bitwise operators

AND, OR and XOR work on every bit position at once; NOT flips every bit; the shifts move bits between positions.

@figure operators

Shifting left by k multiplies by 2ᵏ while the result fits; shifting right divides by 2ᵏ, rounding down. Plain `>>` is an **arithmetic** shift that copies the sign bit in; `>>>` in Java and JavaScript is a **logical** shift that brings in zeros, which C++ gets by shifting an `unsigned` value.

## Why work with bits

In [Single Number](/problems/single-number) every value appears twice except one. A hash map of counts is O(n) time and O(n) memory — half a million entries for a million numbers. The bitwise answer is one pass and one variable, and the same trade recurs: one step per set bit instead of 32 position tests, one AND instead of 30 halvings.

## The standard tricks

Each trick applies an operator with a **mask**, a number with 1s where you want to act; `1 << i` has only bit i set.

- **Check bit i:** `(x >> i) & 1`.
- **Set bit i:** `x | (1 << i)`; **clear it:** `x & ~(1 << i)`; **toggle it:** `x ^ (1 << i)`.
- **Odd or even:** `x & 1`, right for negative numbers too, where `x % 2` gives −1.
- **Clear the lowest set bit:** `x & (x - 1)`; **isolate it:** `x & -x`.
- **Power of two:** `x > 0 && (x & (x - 1)) == 0`.

## The idea: `n & (n - 1)` clears the lowest set bit

Subtracting 1 borrows from the lowest 1 bit, flipping it and every 0 below it; ANDing with n then clears exactly that bit. Two tools fall out of it:

- **Counting set bits** (Brian Kernighan's method): clear the lowest set bit until n is 0 and count the steps — once per 1 bit, not once per position.
- **The power-of-two test**: `n & (n - 1)` is 0 exactly when n had at most one set bit; `n > 0` rules out 0 and the smallest `int`.

@walkthrough

## Why the lowest-bit tricks work

The borrow is the proof for `n & (n - 1)`. Its companion `x & -x` comes from two's complement: adding the 1 in `~x + 1` carries through the inverted trailing zeros and stops exactly at the lowest set bit.

@figure lowest-bit

The popcount loop is correct because of an **invariant**: *the count so far plus the set bits still in n equals the set bits of the original number.* Each step moves one bit from n to the count, so when n is 0 the count is the answer — at most 32 steps for an `int`.

## XOR: pairs cancel

XOR has four properties, each easy to check one bit at a time: `x ^ x` is 0, `x ^ 0` is x, and it is **commutative** and **associative**. The last two mean any order of the same values gives the same result, so XOR the whole array and every pair cancels, whatever the order.

@figure xor-cancel

### The code

The program runs the single number, the popcount and the power-of-two test. The popcount of −1 shows a language difference: Java and JavaScript work on 32-bit ints and C++ takes an `unsigned int`, so −1 has 32 set bits; Python's integers have no width, so it cuts −1 to its low 32 bits first.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// XOR of everything: each pair cancels (x ^ x = 0) and the single value is left (x ^ 0 = x).
int singleNumber(const vector<int>& nums) {
    int result = 0;
    for (int x : nums) result ^= x;
    return result;
}

// One step per set bit: n & (n - 1) clears the lowest one.
// Unsigned, so n - 1 is defined for every bit pattern, the sign bit included.
int popcount(unsigned int n) {
    int count = 0;
    while (n != 0) {
        n &= n - 1;
        count++;
    }
    return count;
}

// A power of two has exactly one set bit, and n & (n - 1) clears it.
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

string toBinary(unsigned int n) {
    string s = n == 0 ? "0" : "";
    for (; n > 0; n >>= 1) s = char('0' + (n & 1)) + s;
    return s;
}

int main() {
    vector<int> nums = {4, 1, 2, 1, 2};
    cout << "Single number in [4, 1, 2, 1, 2]: " << singleNumber(nums) << "\n";
    cout << "Set bits in 44 (" << toBinary(44) << "): " << popcount(44) << "\n";
    cout << "Set bits in -1 as a 32-bit int: " << popcount((unsigned int)-1) << "\n";
    for (int n : {16, 24, 0}) {
        cout << "Is " << n << " a power of two? " << (isPowerOfTwo(n) ? "yes" : "no") << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // XOR of everything: each pair cancels (x ^ x = 0) and the single value is left (x ^ 0 = x).
    static int singleNumber(int[] nums) {
        int result = 0;
        for (int x : nums) result ^= x;
        return result;
    }

    // One step per set bit: n & (n - 1) clears the lowest one.
    // Java's int arithmetic wraps, so a negative n works too.
    static int popcount(int n) {
        int count = 0;
        while (n != 0) {
            n &= n - 1;
            count++;
        }
        return count;
    }

    // A power of two has exactly one set bit, and n & (n - 1) clears it.
    static boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    public static void main(String[] args) {
        int[] nums = {4, 1, 2, 1, 2};
        System.out.println("Single number in [4, 1, 2, 1, 2]: " + singleNumber(nums));
        System.out.println("Set bits in 44 (" + Integer.toBinaryString(44) + "): " + popcount(44));
        System.out.println("Set bits in -1 as a 32-bit int: " + popcount(-1));
        for (int n : new int[] {16, 24, 0}) {
            System.out.println("Is " + n + " a power of two? " + (isPowerOfTwo(n) ? "yes" : "no"));
        }
    }
}
```

```python
def single_number(nums):
    """XOR of everything: each pair cancels (x ^ x = 0) and the single value is left (x ^ 0 = x)."""
    result = 0
    for x in nums:
        result ^= x
    return result


def popcount(n):
    """One step per set bit: n & (n - 1) clears the lowest one.
    n must not be negative: a negative Python int has endless 1 bits."""
    count = 0
    while n != 0:
        n &= n - 1
        count += 1
    return count


def is_power_of_two(n):
    """A power of two has exactly one set bit, and n & (n - 1) clears it."""
    return n > 0 and (n & (n - 1)) == 0


nums = [4, 1, 2, 1, 2]
print("Single number in [4, 1, 2, 1, 2]:", single_number(nums))
print(f"Set bits in 44 ({44:b}):", popcount(44))
print("Set bits in -1 as a 32-bit int:", popcount(-1 & 0xFFFFFFFF))  # keep the low 32 bits
for n in (16, 24, 0):
    print(f"Is {n} a power of two?", "yes" if is_power_of_two(n) else "no")
```

```javascript
// XOR of everything: each pair cancels (x ^ x = 0) and the single value is left (x ^ 0 = x).
function singleNumber(nums) {
  let result = 0;
  for (const x of nums) result ^= x;
  return result;
}

// One step per set bit: n & (n - 1) clears the lowest one.
// JavaScript's bitwise operators work on 32-bit ints, so a negative n works too.
function popcount(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}

// A power of two has exactly one set bit, and n & (n - 1) clears it.
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

const nums = [4, 1, 2, 1, 2];
console.log(`Single number in [4, 1, 2, 1, 2]: ${singleNumber(nums)}`);
console.log(`Set bits in 44 (${(44).toString(2)}): ${popcount(44)}`);
console.log(`Set bits in -1 as a 32-bit int: ${popcount(-1)}`);
for (const n of [16, 24, 0]) {
  console.log(`Is ${n} a power of two? ${isPowerOfTwo(n) ? "yes" : "no"}`);
}
```

```output
Single number in [4, 1, 2, 1, 2]: 4
Set bits in 44 (101100): 3
Set bits in -1 as a 32-bit int: 32
Is 16 a power of two? yes
Is 24 a power of two? no
Is 0 a power of two? no
```

## Subsets as bitmasks

A set of n elements has 2ⁿ subsets, and an n-bit number has 2ⁿ values. Let bit i of a **mask** say whether element i is in, and counting from 0 to 2ⁿ − 1 lists every subset exactly once.

@figure subset-masks

That is O(n × 2ⁿ): fine to about n = 20, a million masks, and hopeless far beyond. A mask is also a compact set — union `a | b`, intersection `a & b`, size its popcount — which is why masks are the state of [dynamic programming](/roadmap/dynamic-programming) over subsets. The masks come out in counting order; [Subsets](/problems/subsets) on this site wants a depth-first order, so sort the result or build the subsets recursively with [backtracking](/roadmap/backtracking).

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// The subset a mask stands for: nums[i] is in it exactly when bit i of the mask is set.
vector<int> subsetOf(const vector<int>& nums, int mask) {
    vector<int> subset;
    for (int i = 0; i < (int)nums.size(); i++)
        if ((mask >> i) & 1) subset.push_back(nums[i]);  // is bit i set?
    return subset;
}

// The mask as n binary digits, bit n - 1 first and bit 0 last.
string bits(int mask, int n) {
    string s;
    for (int i = n - 1; i >= 0; i--) s += char('0' + ((mask >> i) & 1));
    return s;
}

int main() {
    vector<int> nums = {1, 2, 3};
    int n = (int)nums.size();
    for (int mask = 0; mask < (1 << n); mask++) {  // 2^n masks, one per subset
        vector<int> subset = subsetOf(nums, mask);
        cout << "mask " << bits(mask, n) << " -> [";
        for (int k = 0; k < (int)subset.size(); k++) cout << (k ? ", " : "") << subset[k];
        cout << "]\n";
    }
    cout << (1 << n) << " subsets of " << n << " elements\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // The subset a mask stands for: nums[i] is in it exactly when bit i of the mask is set.
    static List<Integer> subsetOf(int[] nums, int mask) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < nums.length; i++)
            if (((mask >> i) & 1) == 1) subset.add(nums[i]); // is bit i set?
        return subset;
    }

    // The mask as n binary digits, bit n - 1 first and bit 0 last.
    static String bits(int mask, int n) {
        StringBuilder s = new StringBuilder();
        for (int i = n - 1; i >= 0; i--) s.append((mask >> i) & 1);
        return s.toString();
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        int n = nums.length;
        for (int mask = 0; mask < (1 << n); mask++) { // 2^n masks, one per subset
            System.out.println("mask " + bits(mask, n) + " -> " + subsetOf(nums, mask));
        }
        System.out.println((1 << n) + " subsets of " + n + " elements");
    }
}
```

```python
def subset_of(nums, mask):
    """The subset a mask stands for: nums[i] is in it exactly when bit i of the mask is set."""
    return [nums[i] for i in range(len(nums)) if (mask >> i) & 1]  # is bit i set?


def bits(mask, n):
    """The mask as n binary digits, bit n - 1 first and bit 0 last."""
    return "".join(str((mask >> i) & 1) for i in range(n - 1, -1, -1))


nums = [1, 2, 3]
n = len(nums)
for mask in range(1 << n):  # 2^n masks, one per subset
    print(f"mask {bits(mask, n)} -> {subset_of(nums, mask)}")
print(f"{1 << n} subsets of {n} elements")
```

```javascript
// The subset a mask stands for: nums[i] is in it exactly when bit i of the mask is set.
function subsetOf(nums, mask) {
  const subset = [];
  for (let i = 0; i < nums.length; i++) {
    if ((mask >> i) & 1) subset.push(nums[i]); // is bit i set?
  }
  return subset;
}

// The mask as n binary digits, bit n - 1 first and bit 0 last.
function bits(mask, n) {
  let s = "";
  for (let i = n - 1; i >= 0; i--) s += (mask >> i) & 1;
  return s;
}

const nums = [1, 2, 3];
const n = nums.length;
for (let mask = 0; mask < (1 << n); mask++) {
  // 2^n masks, one per subset
  console.log(`mask ${bits(mask, n)} -> [${subsetOf(nums, mask).join(", ")}]`);
}
console.log(`${1 << n} subsets of ${n} elements`);
```

```output
mask 000 -> []
mask 001 -> [1]
mask 010 -> [2]
mask 011 -> [1, 2]
mask 100 -> [3]
mask 101 -> [1, 3]
mask 110 -> [2, 3]
mask 111 -> [1, 2, 3]
8 subsets of 3 elements
```

## Other problems built from the same moves

- [Missing Number](/problems/missing-number): XOR every index with every value; the present numbers cancel and the missing one remains.
- [Hamming Distance](/problems/hamming-distance): the popcount of `x ^ y`.
- [Counting Bits](/problems/counting-bits): `bits[i] = bits[i >> 1] + (i & 1)`.
- [Sum of Two Integers](/problems/sum-of-two-integers): `a ^ b` is the sum without carries, `(a & b) << 1` the carries; repeat.

## Language pitfalls

- **Python integers are unbounded.** A negative number acts as if it had endless 1 bits in front, so `n & (n - 1)` never reaches 0; mask with `n & 0xFFFFFFFF` when the problem means 32 bits.
- **JavaScript works on 32-bit signed integers.** `1 << 31` is negative and bits from 32 up are lost; `x >>> 0` reads the bits as unsigned.
- **Shift counts wrap in Java and JavaScript**, so `1 << 40` is 256; write `1L << 40`. In C++ an oversized shift is undefined — use `1LL << k`.
- **Precedence**: `==` binds tighter than `&` in C++, Java and JavaScript. Write `(x & 1) == 0`.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Count set bits | test every position | O(w), w = 32 or 64 | O(1) |
| Count set bits | clear the lowest set bit until 0 | O(set bits) | O(1) |
| Power of two | `n & (n - 1)` | O(1) | O(1) |
| Single number | hash map of counts | O(n) | O(n) |
| Single number | XOR everything | O(n) | O(1) |
| All subsets | masks 0 to 2ⁿ − 1 | O(n × 2ⁿ) | O(n) |

A bitwise operation is O(1) because the integer has a fixed width; Python's unbounded integers behave the same up to 64 bits.

## How to recognise a bit manipulation problem

- It mentions the **binary representation**, set bits, flipping bits or a power of two.
- Values come in **pairs except one** and O(1) space is required: XOR.
- It **forbids arithmetic operators**: build them from XOR, AND and shifts.
- The input is **small, about n ≤ 20**, and the question is about choosing a subset: enumerate masks.
- It asks for a **maximum XOR**: decide bit by bit from the top, usually with a [trie](/roadmap/trie).

## Common mistakes

- **Testing a bit against 1**: `(x & (1 << i)) == 1` is true only for bit 0; compare with 0.
- **No `n > 0` in the power-of-two test**: 0 and the smallest `int` pass.
- **Shifting a negative number right in a loop**: `>>` keeps filling with 1s, so the loop never ends.
- **XOR when values are not in pairs**: with triples, count bits modulo 3.
- **Missing parentheses** around a bitwise expression inside a comparison.

## Practice in this order

1. [Number of 1 Bits](/problems/number-of-1-bits): the popcount loop.
2. [Power of Two](/problems/power-of-two): the one-line test.
3. [Single Number](/problems/single-number): XOR cancels pairs.
4. [Missing Number](/problems/missing-number): indices against values.
5. [Hamming Distance](/problems/hamming-distance): popcount of `x ^ y`.
6. [Counting Bits](/problems/counting-bits): a recurrence on `i >> 1`.
7. [Subsets](/problems/subsets): every mask.
8. [Sum of Two Integers](/problems/sum-of-two-integers): addition from XOR.
9. [Single Number II](/problems/single-number-ii): values in threes, so count each bit modulo 3.

The [bit manipulation problem list](/challenges/bit-manipulation) has every bit problem in the catalogue, from easy to hard. When the first six feel routine, the next stage is [recursion](/roadmap/recursion) and backtracking, where the subsets you just listed with masks are built one choice at a time.
