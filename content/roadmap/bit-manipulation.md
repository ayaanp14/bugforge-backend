---
title: Bit Manipulation
stage: bits
order: 1
minutes: 23
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
Every integer in a computer is stored as a row of **bits**, and a handful of operators work on those bits directly: AND, OR, XOR, NOT and the shifts. One such operation handles all 32 or 64 bits of a number at once, which is why bit tricks appear whenever a problem says "constant extra space", "without using + or −" or "the binary representation of n". The problems are usually short. What makes them hard is knowing five or six identities and the reason each one works, plus the traps that signs, operator precedence and each language's integer size set for you.

This lesson starts from binary and two's complement, goes through the operators and the standard tricks, proves the two that matter most, `n & (n - 1)` and XOR cancelling pairs, and ends with subsets as bitmasks and the pitfalls of each language. Every program is shown in C++, Java, Python and JavaScript.

## Binary representation

In base 10 each digit is worth ten times the digit to its right. In **binary**, base 2, each digit is a bit, 0 or 1, worth twice the bit to its right. Bits are numbered from the right starting at 0, so bit i is worth 2ⁱ:

```text
 bit position:    5    4    3    2    1    0
 worth:          32   16    8    4    2    1
 44 in binary:    1    0    1    1    0    0     32 + 8 + 4 = 44
```

Bit 0 is the **least significant bit**, and it alone decides whether a number is odd. A number is a power of two exactly when it has a single 1 bit: 1, 10, 100 and 1000 in binary are 1, 2, 4 and 8. A 1 bit is called a **set bit**, and the number of set bits is the **popcount** (or Hamming weight): 44 has three.

Fixed-width types hold a fixed number of bits. An `int` is 32 bits in Java and on every mainstream C++ compiler; a `long` in Java and a `long long` in C++ are 64. A 32-bit `int` has positions 0 to 31, and position 31 has a special job.

## Negative numbers: two's complement

Almost every machine stores signed integers in **two's complement**. The rule is short: the top bit is worth minus what it would otherwise be. In 8 bits the top bit is worth −128 instead of +128; in a 32-bit `int` it is worth −2³¹.

| Bits (8-bit) | Read as unsigned | Read as two's complement |
| --- | --- | --- |
| 00000000 | 0 | 0 |
| 00000101 | 5 | 5 |
| 01111111 | 127 | 127 |
| 10000000 | 128 | −128 |
| 11111011 | 251 | −5 |
| 11111111 | 255 | −1 |

Three consequences are worth knowing by heart:

- **To negate, invert every bit and add 1.** Adding x and `~x` puts exactly one 1 in every position with no carries, so `x + ~x` is all ones, which is −1. Rearranged, `~x` is `-x - 1`, so `-x` is `~x + 1`. Check it on the table: 5 is 00000101, inverted 11111010, plus 1 is 11111011, which is −5.
- **−1 is all ones** in every width, and the top bit of any negative number is 1.
- **The range is lopsided.** 8 bits hold −128 to 127, and a 32-bit `int` holds −2³¹ to 2³¹ − 1. Negating the smallest value overflows back to itself, which is why `Math.abs(Integer.MIN_VALUE)` in Java is still negative.

Hardware uses this scheme because ordinary binary addition then works for negative numbers with no special case: 5 + (−3) is 00000101 + 11111101 = 1 00000010, and dropping the carry out of the top leaves 00000010, which is 2. There is also only one zero, where a sign-and-size scheme would have both +0 and −0.

## The bitwise operators

Each operator works on every bit position at once; the shifts move bits between positions.

```text
 operator  name         result bit i is 1 when         example: 12 = 1100, 10 = 1010
 a & b     AND          bit i is 1 in both             1100 & 1010 = 1000 = 8
 a | b     OR           bit i is 1 in either           1100 | 1010 = 1110 = 14
 a ^ b     XOR          bit i differs between them     1100 ^ 1010 = 0110 = 6
 ~a        NOT          bit i of a is 0                ~12 = -13, since ~x = -x - 1
 a << k    left shift   bit i - k of a is 1            12 << 1 = 11000 = 24
 a >> k    right shift  bit i + k of a is 1;           12 >> 2 = 11 = 3
                        the top fills with sign bits   -12 >> 2 = -3
 a >>> k   unsigned     as >>, but the top             -12 >>> 28 = 15
           right shift  fills with 0s (Java, JS)       (on a 32-bit int)
```

The shifts are arithmetic in disguise. Shifting left by k multiplies by 2ᵏ, as long as the result still fits. Shifting right by k divides by 2ᵏ and rounds down, towards minus infinity: `-13 >> 2` is −4, while `-13 / 4` in C++ or Java truncates to −3. Plain `>>` copies the sign bit into the vacated top bits, so a negative number stays negative; it is an **arithmetic** shift. Java and JavaScript add `>>>`, a **logical** shift that fills with zeros and so reads the bits as an unsigned number. C++ has no `>>>`; shift an `unsigned` value to get the logical behaviour. Python has none either, because its integers have no fixed top for a zero to come in at.

## Why work with bits

Take [Single Number](/problems/single-number): every value in an array appears twice except one, and you must find it. The natural answer counts occurrences in a hash map. That is O(n) time, but also O(n) memory: about half a million entries for an array of a million numbers. Sorting and comparing neighbours avoids the map but costs O(n log n). The bitwise answer is one pass and one variable, because XOR cancels equal values.

The same trade appears again and again. Testing all 32 positions to count the set bits of a number takes 32 steps; clearing them one at a time takes one step per set bit. Checking whether n is a power of two by halving it until it is odd takes up to 30 halvings for an `int`; one AND does it. A set of up to 64 small items fits in one 64-bit integer, where union, intersection and membership are each a single operation instead of a loop over a boolean array. That last idea is what makes dynamic programming over subsets possible at all.

## The standard tricks

Every trick below is an operator applied with a **mask**, a number with 1s exactly where you want to act. `1 << i` is the mask with only bit i set.

- **Check bit i:** `(x >> i) & 1` is 1 when bit i is set. The shift brings bit i down to position 0, and `& 1` throws everything else away.
- **Set bit i:** `x | (1 << i)`. OR with a 1 forces that bit to 1, and OR with 0 leaves every other bit as it was.
- **Clear bit i:** `x & ~(1 << i)`. The mask `~(1 << i)` is all ones except bit i, so the AND keeps every bit but that one.
- **Toggle bit i:** `x ^ (1 << i)`. XOR with 1 flips a bit, and XOR with 0 keeps it.
- **Odd or even:** `x & 1` is the lowest bit, 1 for an odd number. It is right for negative numbers too, where `x % 2` gives −1 for odd values in C++, Java and JavaScript.
- **Clear the lowest set bit:** `x & (x - 1)`. The next section proves it.
- **Isolate the lowest set bit:** `x & -x` keeps only the lowest 1 bit, so `44 & -44` is 4.
- **Power of two:** `x > 0 && (x & (x - 1)) == 0`. A power of two has exactly one set bit, so clearing the lowest one leaves 0.
- **Swap without a temporary:** `a ^= b; b ^= a; a ^= b;`. A puzzle more than a tool: it is no faster than a temporary variable, and if both names refer to the same memory, such as `arr[i]` and `arr[j]` with i equal to j, it sets the value to zero.

## The idea: `n & (n - 1)` clears the lowest set bit

Look at what subtracting 1 does in binary. Take 44:

```text
 n           = 101100   (44)
 n - 1       = 101011   (43)   the lowest 1 becomes 0, every 0 below it becomes 1
 n & (n - 1) = 101000   (40)   the lowest set bit is gone, everything above it is kept
```

Subtracting 1 has to borrow. Bit 0 is 0, so it borrows from bit 1, which is also 0, and so on up to the lowest 1 bit. That bit becomes 0, every 0 below it becomes 1, and the bits above it are untouched. ANDing with the original n keeps the upper bits, where the two numbers agree, and clears the rest, where they disagree in every position. The result is n with exactly its lowest set bit removed.

Two tools fall straight out of it:

- **Counting set bits.** Clear the lowest set bit until n is 0 and count the steps. The loop runs once per 1 bit rather than once per bit position. This is Brian Kernighan's method.
- **The power-of-two test.** `n & (n - 1)` is 0 exactly when n had at most one set bit. Adding `n > 0` rules out 0, which has no set bits at all, and the smallest `int`, whose only set bit is the sign bit.

The walkthrough runs the count on 44, one frame per cleared bit.

@walkthrough

## Why the lowest-bit tricks work

The borrowing argument above is the proof for `n & (n - 1)`. The companion trick, `x & -x`, follows from two's complement. Since `-x` is `~x + 1`, start from `~x`: inverting x turns its trailing 0s, the ones below its lowest set bit, into 1s, and turns that lowest set bit into a 0. Adding 1 carries through those trailing 1s, turning them back into 0s, and stops at that 0, which becomes 1. So `-x` agrees with x at the lowest set bit and below, and is the exact opposite of x everywhere above it. ANDing the two keeps only the lowest set bit:

```text
 x      = 00101100   (44)
 ~x     = 11010011
 -x     = 11010100   (~x + 1: the carry stops at the lowest set bit of x)
 x & -x = 00000100   (4)
```

The two tricks split a number at the same place: `x & (x - 1)` is x without its lowest set bit, `x & -x` is that bit alone, and the two add back up to x. For 44 they are 40 and 4. Fenwick trees, also called binary indexed trees, use `x & -x` to step from one index to the next.

The popcount loop is correct because of an **invariant**: *the count so far plus the set bits still in n always equals the set bits of the original number.* Each step clears one set bit from n and adds one to the count, so the sum never changes. When n reaches 0 there is nothing left in it, and the count is the answer. The loop runs once per set bit, at most 32 times for an `int`.

### Dry run

| Step | n | n in binary | n − 1 in binary | `n & (n - 1)` | count |
| --- | --- | --- | --- | --- | --- |
| 1 | 44 | 101100 | 101011 | 101000 = 40 | 1 |
| 2 | 40 | 101000 | 100111 | 100000 = 32 | 2 |
| 3 | 32 | 100000 | 011111 | 000000 = 0 | 3 |

Three set bits, three steps. A loop over all six positions would have taken six, and a loop over every bit of an `int` would have taken 32.

## XOR: pairs cancel

XOR has four properties, each easy to check one bit at a time:

- `x ^ x` is 0: a bit XOR itself is always 0.
- `x ^ 0` is x: XOR with 0 keeps every bit.
- **Commutative:** `a ^ b` equals `b ^ a`.
- **Associative:** `(a ^ b) ^ c` equals `a ^ (b ^ c)`.

The last two mean that XORing a list of numbers gives the same result in any order. So XOR the whole array of Single Number together, and imagine regrouping the terms so that equal values sit side by side: each pair becomes 0, the zeros vanish, and the one value without a partner is all that is left. The array never needs sorting or grouping; the algebra does the grouping for you.

### Dry run

The array `[4, 1, 2, 1, 2]`, written three bits wide:

| Value | Binary | Running XOR |
| --- | --- | --- |
| start | none | 000 = 0 |
| 4 | 100 | 100 = 4 |
| 1 | 001 | 101 = 5 |
| 2 | 010 | 111 = 7 |
| 1 | 001 | 110 = 6 |
| 2 | 010 | 100 = 4 |

The running value wanders, always holding the XOR of everything seen so far, and lands on 4 once both 1s and both 2s have cancelled.

### The code

The program runs the three checks of this lesson: the single number, the popcount and the power-of-two test. The popcount of −1 shows a language difference covered below. Java and JavaScript work on 32-bit ints and the C++ version takes an `unsigned int`, so −1 has 32 set bits; Python's integers have no width, so the program cuts −1 down to its low 32 bits first.

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

A set of n elements has 2ⁿ subsets, and an n-bit number has 2ⁿ possible values. That is no coincidence. Number the elements 0 to n − 1 and let bit i of a **mask** say whether element i is in the subset. Then every mask from 0 to 2ⁿ − 1 describes a different subset, and every subset is described by exactly one mask, so counting from 0 to 2ⁿ − 1 lists each subset exactly once, with no recursion and no visited set.

```text
 nums = [1, 2, 3]       bit 2: is 3 in?   bit 1: is 2 in?   bit 0: is 1 in?
 mask 5 = 101                 yes               no                yes        ->  [1, 3]
```

Inside the loop, `(mask >> i) & 1` tests whether element i is in. The cost is O(n × 2ⁿ): 2ⁿ masks and n bit tests for each. That is fine up to about n = 20, where 2²⁰ is about a million masks, and hopeless far beyond it. A mask is also a compact set you can store, compare and use as an array index: union is `a | b`, intersection `a & b`, difference `a & ~b`, and the size is the popcount. That is why bitmasks are the state of [dynamic programming](/roadmap/dynamic-programming) over subsets, and of breadth-first searches that must remember which keys or places have been collected.

The masks come out in binary counting order. [Subsets](/problems/subsets) on this site asks for a different, depth-first order, so either sort what the masks produce or generate the subsets recursively, as [backtracking](/roadmap/backtracking) does.

### The code

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

- [Missing Number](/problems/missing-number): XOR every index from 0 to n with every value. Each number that is present appears twice, once as an index and once as a value, and cancels; the missing one appears only as an index and is what remains.
- [Hamming Distance](/problems/hamming-distance): `x ^ y` has a 1 exactly where x and y differ, so the answer is the popcount of `x ^ y`.
- [Counting Bits](/problems/counting-bits): the popcount of every number from 0 to n in O(n). `i >> 1` is i without its last bit, so `bits[i] = bits[i >> 1] + (i & 1)`, a one-line recurrence.
- [Sum of Two Integers](/problems/sum-of-two-integers): `a ^ b` is the sum with the carries ignored, and `(a & b) << 1` is the carries. Add those two the same way until no carry is left. In Python the carries never fall off the top of an unbounded integer, so the loop must mask to 32 bits.
- [Single Number II](/problems/single-number-ii): every value appears three times except one, so XOR no longer cancels. Count how many numbers have each bit set instead; wherever the count is not a multiple of 3, the single number has that bit.
- [Power of Four](/problems/power-of-four): a power of two whose one set bit is in an even position. `n & 0x55555555` checks the position, because 0x55555555 has 1s in exactly the even positions.

## Language pitfalls

The operators are the same in all four languages; the integers they act on are not.

- **Python integers are unbounded.** There is no overflow and no fixed width, and a negative number behaves as if it had infinitely many 1 bits in front. `~5` is still −6, but `bin(-5)` is `'-0b101'`, not a 32-bit pattern, and `n & (n - 1)` on a negative n never reaches 0, so a popcount loop runs forever. When a problem means 32-bit behaviour, mask with `n & 0xFFFFFFFF` first. To count bits, `bin(n).count("1")` works on any Python 3, and Python 3.10 added `n.bit_count()`.
- **JavaScript works on 32-bit signed integers.** Numbers are 64-bit floats, and every bitwise operator first converts its operands to a 32-bit int. So `1 << 31` is −2147483648, every bit from 32 upwards is lost, and a loop such as `mask < (1 << n)` silently runs zero times once n reaches 31. `x >>> 0` reads the same 32 bits as unsigned, and `BigInt` is the way out when you need wider masks.
- **Shift counts wrap in Java and JavaScript.** For a 32-bit int only the low five bits of the count are used, so `1 << 40` is `1 << 8`, which is 256. In Java write `1L << 40` to shift a `long`. In C++, shifting by the type's width or more is undefined behaviour; use `1LL << k` whenever k can reach 31.
- **Signed overflow in C++ is undefined.** `n - 1` when n is the smallest `int` is undefined behaviour, which is why the popcount above takes an `unsigned int`, whose arithmetic is defined to wrap.
- **Operator precedence.** In C++, Java and JavaScript, `==` binds tighter than `&`, `|` and `^`. So `x & 1 == 0` means `x & (1 == 0)`: C++ and JavaScript quietly compute 0, and Java refuses to compile it. Python is the exception, with `&` binding tighter than `==`. Write `(x & 1) == 0` everywhere and the question never comes up.
- **Built-in popcounts.** C++ has `__builtin_popcount` in GCC and Clang, `std::bitset<32>(x).count()` everywhere and `std::popcount` from C++20. Java has `Integer.bitCount` and `Long.bitCount`. JavaScript has none, so write the loop.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Count set bits | test every bit position | O(w), w = 32 or 64 | O(1) |
| Count set bits | clear the lowest set bit until 0 | O(number of set bits) | O(1) |
| Power of two | halve while even | O(log n) | O(1) |
| Power of two | `n > 0` and `(n & (n - 1)) == 0` | O(1) | O(1) |
| Single number | hash map of counts | O(n) | O(n) |
| Single number | sort, compare neighbours | O(n log n) | O(1) to O(n) |
| Single number | XOR everything | O(n) | O(1) |
| Popcount of 0 to n | `bits[i >> 1] + (i & 1)` | O(n) | O(n) for the output |
| All subsets | masks 0 to 2ⁿ − 1 | O(n × 2ⁿ) | O(n) besides the output |

One honest caveat: a bitwise operation is O(1) because the integer has a fixed width. Python's integers grow as needed, so an operation costs time in proportion to the number's length; for anything that fits in 64 bits that is still effectively constant.

## How to recognise a bit manipulation problem

Read the statement for these signals:

- It mentions the **binary representation**, set bits, flipping bits, Hamming distance or a power of two (or four).
- Values come in **pairs except one**, and O(1) extra space is required. Think XOR.
- It **forbids arithmetic operators** ("without using + or −") or asks you to implement them. Build the operation from XOR, AND and shifts.
- The input is **small, about n ≤ 20**, and the question is about choosing a subset or an assignment. Enumerate masks, or use them as the state of a search.
- It asks for the **maximum XOR** of pairs or subarrays. Decide the answer bit by bit from the top, usually with a [trie](/roadmap/trie) of the numbers' bits.

## Common mistakes

- **Testing a bit against 1.** `(x & (1 << i)) == 1` is true only for bit 0, because the AND leaves the bit in place, where it is worth 2ⁱ. Compare with 0 instead, or shift first: `(x >> i) & 1`.
- **Forgetting `n > 0` in the power-of-two test.** Without it, 0 passes, since it has no set bit to clear, and so does the smallest `int`, whose only set bit is the sign bit.
- **Shifting a negative number right in a loop.** `while (n != 0) n >>= 1;` never ends for a negative n in C++, Java or JavaScript, because the arithmetic shift keeps filling the top with 1s. Use `>>>` in Java and JavaScript, or an unsigned type in C++.
- **Counting positions from the wrong end.** Bit 0 is the rightmost bit, worth 1. Problems that say "the i-th bit" nearly always mean this, even though a number printed in binary shows its highest bit first.
- **Reaching for XOR when values do not come in pairs.** XOR cancels values that appear an even number of times. With triples, as in Single Number II, count each bit modulo 3 instead.
- **Dropping the parentheses.** `x & 1 == 0`, `a ^ b > 0` and `mask | bit == mask` all parse the wrong way in C++, Java and JavaScript. Bracket every bitwise expression that sits inside a comparison.

## Practice in this order

Start with the identities on their own, then the problems where you have to see which identity applies:

1. [Number of 1 Bits](/problems/number-of-1-bits): the popcount loop with `n & (n - 1)`.
2. [Power of Two](/problems/power-of-two): the one-line test, including 0 and negative numbers.
3. [Single Number](/problems/single-number): XOR cancels pairs.
4. [Missing Number](/problems/missing-number): XOR the indices against the values.
5. [Hamming Distance](/problems/hamming-distance): the popcount of `x ^ y`.
6. [Counting Bits](/problems/counting-bits): a recurrence on `i >> 1`.
7. [Subsets](/problems/subsets): every mask from 0 to 2ⁿ − 1, then the order the problem asks for.
8. [Sum of Two Integers](/problems/sum-of-two-integers): addition rebuilt from XOR and the carries.
9. [Single Number II](/problems/single-number-ii): bit counts modulo 3.

The [bit manipulation problem list](/challenges/bit-manipulation) has every bit problem in the catalogue, from easy to hard. When the first six feel routine, the next stage of the roadmap is recursion and backtracking, where the subsets you just listed with masks are built one choice at a time.
