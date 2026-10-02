---
title: Hashing: Hash Maps and Hash Sets
stage: hashing
order: 1
minutes: 22
level: Beginner
hub: hash-table
practice: jewels-and-stones, two-sum, first-unique-character-in-a-string, majority-element, isomorphic-strings, find-all-numbers-disappeared, groups-of-special-equivalent-strings, longest-consecutive-sequence, top-k-frequent-elements
updated: 2026-10-03
seo-title: Hashing in DSA: Hash Maps, Hash Sets and Collisions
description: Learn how hash maps and sets work, collisions, load factor and O(1) lookups, then counting, two-sum and grouping in C++, Java, Python and JavaScript.
question: What is hashing in data structures?
answer: Hashing turns a key into an array index with a hash function, so a hash map or hash set can store and find keys in O(1) time on average instead of scanning every element. Keys that land in the same bucket collide and are handled by chaining or open addressing, and the table grows as it fills. Hash maps power counting, the two-sum lookup and grouping.
q: What is the difference between a hash map and a hash set?
a: A hash set stores keys only and answers one question: is this key present? A hash map stores a value with each key, such as a count or an index, and answers what that value is. Both use the same hash table underneath, so both insert, find and delete in O(1) time on average.
q: Why is a hash map O(1) on average but O(n) in the worst case?
a: A good hash function spreads keys evenly over the buckets, and the table grows to keep the number of keys per bucket below a small constant, so a lookup checks only a few keys. If many keys hash to the same bucket, because the hash function is poor or the input was built to attack it, a lookup can check all n keys.
q: What is a hash collision and how is it handled?
a: A collision is two different keys landing in the same bucket. Chaining keeps a small list in each bucket and searches it, which is what C++ unordered_map and Java's HashMap do. Open addressing stores every key in the array itself and, when a slot is taken, probes other slots in a fixed order, which is what Python's dict and set do.
q: What is the load factor of a hash table?
a: The load factor is the number of stored keys divided by the number of buckets. As it rises, collisions become more common, so tables resize when it passes a threshold: 0.75 for Java's HashMap and 1.0 by default for C++ unordered_map. Resizing allocates about twice the buckets and reinserts every key, which costs O(n) but happens rarely enough to stay O(1) amortised.
q: When should I use an array instead of a hash map?
a: Use an array when the keys are small integers in a known range, such as the 26 lowercase letters, ASCII codes or values up to about 10⁶. The key is then the index: no hash to compute, no collisions, less memory per entry and a fixed iteration order. Use a hash map when keys are large, sparse, negative or not numbers at all.
q: Should I use unordered_map or map in C++?
a: Use unordered_map (HashMap in Java) when you only need lookups: O(1) on average. Use map (TreeMap in Java), a balanced search tree, when you need the keys in sorted order or the nearest key above or below a value: every operation is O(log n). Python and JavaScript have no built-in sorted map, so you sort the keys when you need order.
---
Many problems come down to one question asked over and over: *have I seen this value before, and where?* Scanning the array to answer it costs O(n) every time, and asking it once per element makes the whole solution O(n²). **Hashing** answers the same question in O(1) time on average by spending memory: a **hash map** remembers each value with something about it, such as its index or how often it appeared, and a **hash set** remembers just the values.

This lesson starts with the problem hashing was made for, Two Sum, then opens the box: how a hash table turns a key into a position, what happens when two keys collide, why lookups are O(1) on average but not always, and how each language spells it. Then come the patterns that make hashing the most used tool in interviews: counting, complement lookups, grouping by a key and sets of values seen, and the case where a plain array does the job better. Every program is shown in C++, Java, Python and JavaScript.

## Why scanning is too slow

[Two Sum](/problems/two-sum) gives you an array and a target and asks for the indices of two numbers that add up to it. The brute force tries every pair:

```text
for i in 0 .. n-1:
    for j in i+1 .. n-1:
        if nums[i] + nums[j] == target: return (i, j)
```

That is n(n − 1)/2 pair checks, about 5 × 10⁹ when n = 10⁵, while a judge allows roughly 10⁸ simple steps a second. Sorting and then using [two pointers](/roadmap/two-pointers) brings it to O(n log n), but sorting moves the elements and the problem wants their original indices. What you really want is to stand at `nums[i]`, know that its partner must be `target − nums[i]`, and ask "is that value somewhere earlier?" without looking at every earlier element.

## The idea: remember what you have seen

Walk the array once, and keep a hash map from each value already seen to its index. At each number, work out the value that would complete the pair, the **complement**, and look it up:

- **The complement is in the map.** The pair is the stored index and the current one. Done.
- **It is not.** No earlier number pairs with this one. Store this number and its index, because a later number might need it.

The order of those two steps matters. Looking up *before* storing means the map only ever holds earlier numbers, so a number can never pair with itself: with target 14, a single 7 must not count as 7 + 7. Each step is one lookup and one insert, both O(1) on average, so the whole search is O(n) time with O(n) extra memory for the map.

@walkthrough

### Dry run

Here is the search for target 14 in `[7, 3, 9, 4, 12, 2]`:

| i | nums[i] | Complement 14 − nums[i] | In the map? | Map afterwards |
| --- | --- | --- | --- | --- |
| 0 | 7 | 7 | no, the map is empty | 7→0 |
| 1 | 3 | 11 | no | 7→0, 3→1 |
| 2 | 9 | 5 | no | 7→0, 3→1, 9→2 |
| 3 | 4 | 10 | no | adds 4→3 |
| 4 | 12 | 2 | no | adds 12→4 |
| 5 | 2 | 12 | yes, at index 4 | pair found: (4, 5) |

Six lookups instead of up to fifteen pair checks, and the gap widens with n: for 10⁵ numbers it is 10⁵ lookups against 5 × 10⁹ checks.

### The code

```cpp
#include <iostream>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

// Indices of two numbers that add up to target, or {-1, -1} if no pair does.
pair<int, int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> indexOf;                 // value -> index where it was seen
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        auto it = indexOf.find(need);                // look first: an earlier number that completes the pair?
        if (it != indexOf.end()) return {it->second, i};
        indexOf[nums[i]] = i;                        // then store, so nums[i] never pairs with itself
    }
    return {-1, -1};
}

int main() {
    vector<int> nums = {7, 3, 9, 4, 12, 2};
    for (int target : {14, 100}) {
        pair<int, int> p = twoSum(nums, target);
        if (p.first == -1) {
            cout << "Target " << target << ": no pair\n";
        } else {
            cout << "Target " << target << ": nums[" << p.first << "] + nums[" << p.second << "] = "
                 << nums[p.first] << " + " << nums[p.second] << "\n";
        }
    }
    return 0;
}
```

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    // Indices of two numbers that add up to target, or {-1, -1} if no pair does.
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> indexOf = new HashMap<>();   // value -> index where it was seen
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            Integer j = indexOf.get(need);                 // look first: an earlier number that completes the pair?
            if (j != null) return new int[] {j, i};
            indexOf.put(nums[i], i);                       // then store, so nums[i] never pairs with itself
        }
        return new int[] {-1, -1};
    }

    public static void main(String[] args) {
        int[] nums = {7, 3, 9, 4, 12, 2};
        for (int target : new int[] {14, 100}) {
            int[] p = twoSum(nums, target);
            if (p[0] == -1) {
                System.out.println("Target " + target + ": no pair");
            } else {
                System.out.println("Target " + target + ": nums[" + p[0] + "] + nums[" + p[1] + "] = "
                        + nums[p[0]] + " + " + nums[p[1]]);
            }
        }
    }
}
```

```python
def two_sum(nums, target):
    """Indices of two numbers that add up to target, or None if no pair does."""
    index_of = {}                        # value -> index where it was seen
    for i, value in enumerate(nums):
        need = target - value
        if need in index_of:             # look first: an earlier number that completes the pair?
            return index_of[need], i
        index_of[value] = i              # then store, so value never pairs with itself
    return None


nums = [7, 3, 9, 4, 12, 2]
for target in (14, 100):
    found = two_sum(nums, target)
    if found is None:
        print(f"Target {target}: no pair")
    else:
        i, j = found
        print(f"Target {target}: nums[{i}] + nums[{j}] = {nums[i]} + {nums[j]}")
```

```javascript
// Indices of two numbers that add up to target, or null if no pair does.
function twoSum(nums, target) {
  const indexOf = new Map(); // value -> index where it was seen
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (indexOf.has(need)) return [indexOf.get(need), i]; // look first: an earlier number that completes the pair?
    indexOf.set(nums[i], i); // then store, so nums[i] never pairs with itself
  }
  return null;
}

const nums = [7, 3, 9, 4, 12, 2];
for (const target of [14, 100]) {
  const found = twoSum(nums, target);
  if (found === null) {
    console.log(`Target ${target}: no pair`);
  } else {
    const [i, j] = found;
    console.log(`Target ${target}: nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]}`);
  }
}
```

```output
Target 14: nums[4] + nums[5] = 12 + 2
Target 100: no pair
```

## How a hash table is stored

Underneath every hash map and hash set is a **hash table**: an ordinary array of slots, called **buckets**, plus a **hash function** that turns any key into a whole number. The table reduces that number to a bucket index, typically the hash modulo the number of buckets, and keeps the key there. Finding the key later repeats the same calculation and goes straight to the same bucket. That is the trick: the key's own value tells you where to look, so you never search the whole table.

A hash function has to meet two demands. It must be **deterministic**, giving equal keys equal hashes every time, or a key could never be found again. And it should **spread** different keys evenly over the buckets. For integers a language can use the value itself; for strings it mixes every character, as Java's `String.hashCode` does with s[0] × 31ⁿ⁻¹ + s[1] × 31ⁿ⁻² + … + s[n − 1]. Hashing a string therefore costs O(k) for a string of length k, which matters when the keys are long.

Here are five keys placed in a table of 8 buckets, using key mod 8 as the bucket:

```text
 keys: 12, 7, 20, 33, 15             bucket = key mod 8

 bucket 0: -
 bucket 1: 33
 bucket 2: -
 bucket 3: -
 bucket 4: 12 -> 20                  12 and 20 both leave remainder 4: a collision
 bucket 5: -
 bucket 6: -
 bucket 7: 7 -> 15                   7 and 15 collide too
```

## Collisions: chaining and open addressing

There are far more possible keys than buckets, so two different keys will sometimes land in the same bucket. That is a **collision**, and every hash table needs a policy for it. There are two classic ones.

- **Separate chaining.** Each bucket holds a small list of the keys that landed there, as drawn above. A lookup goes to the bucket and compares the key with each entry in its list. C++'s `unordered_map` and Java's `HashMap` work this way; since Java 8, a bucket that grows past eight entries is turned into a small balanced tree, so even a crowded bucket costs O(log n).
- **Open addressing.** Every key lives in the array itself. If its bucket is taken, the table probes other slots in a fixed order until it finds a free one; a lookup follows the same order until it finds the key or an empty slot. With **linear probing**, the simplest order, 20 would go to bucket 5 because 4 is taken, and 15 would wrap around from the full bucket 7 to bucket 0. Python's `dict` and `set` use open addressing with a more scattered probe order.

Either way, a lookup compares the key against only the few keys that share its bucket or probe path. The design question is how to keep that number small.

## Why lookups are O(1) on average

The **load factor** is the number of stored keys divided by the number of buckets. With a hash function that spreads keys well and a load factor below a constant, the expected number of keys a lookup examines is a constant too, which is where O(1) comes from. To keep it there, a table **resizes** when the load factor passes a threshold, 0.75 for Java's `HashMap`, 1.0 by default for C++'s `unordered_map` and about two-thirds for Python's `dict`. Resizing allocates roughly twice as many buckets and reinserts every key, since each key's bucket depends on the bucket count. One resize costs O(n), but like a growing dynamic array it happens so rarely that n inserts still cost O(n) in total: amortised O(1) each. The [Big-O lesson](/roadmap/big-o-notation) shows the same argument for arrays.

The guarantee is about the **average**, though, and it rests on the hash function spreading the keys. If every key landed in one bucket, a lookup would check all n of them, and n inserts would cost O(n²). That does not happen by accident with the built-in hashes, but it can happen on purpose: competitive-programming judges have tests built to collide with the default integer hash of C++'s `unordered_map`, which is why experienced contestants pass it a randomised hash. In an interview, say "O(1) on average" and you are giving the expected answer.

Ordered alternatives exist when you need them. C++'s `map` and `set` and Java's `TreeMap` and `TreeSet` are balanced search trees: O(log n) per operation instead of O(1), but they keep the keys sorted and can find the nearest key above or below any value.

## Hash maps and hash sets in each language

| Task | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Map, set | `unordered_map`, `unordered_set` | `HashMap`, `HashSet` | `dict`, `set` | `Map`, `Set` |
| Insert or update | `m[k] = v` | `m.put(k, v)` | `m[k] = v` | `m.set(k, v)` |
| Is the key there? | `m.count(k)` | `m.containsKey(k)` | `k in m` | `m.has(k)` |
| Value or a default | `m.count(k) ? m[k] : 0` | `m.getOrDefault(k, 0)` | `m.get(k, 0)` | `m.get(k) ?? 0` |
| Count one more | `cnt[x]++` | `cnt.merge(x, 1, Integer::sum)` | `cnt[x] = cnt.get(x, 0) + 1` | `cnt.set(x, (cnt.get(x) ?? 0) + 1)` |
| Remove | `m.erase(k)` | `m.remove(k)` | `del m[k]` | `m.delete(k)` |
| Add to a set | `s.insert(x)` | `s.add(x)` | `s.add(x)` | `s.add(x)` |
| Size | `m.size()` | `m.size()` | `len(m)` | `m.size` |

Each language has a trap worth knowing before an interview. In C++, reading `m[k]` for a missing key **inserts** it with a default value, so use `find` or `count` to test for a key without creating it. In Java, `m.get(k)` returns `null` for a missing key, and unboxing that `null` into an `int` throws `NullPointerException`; a custom key class needs `equals` and `hashCode` overridden together. In Python, `m[k]` raises `KeyError` for a missing key, and lists cannot be keys because they can change, so use a tuple or a string. In JavaScript, prefer `Map` to a plain object: an object turns every key into a string, so `1` and `"1"` are the same key, and it inherits keys such as `constructor`. A `Map` compares arrays and objects by identity, not contents, so to key on contents build a string such as the sorted letters.

**Iteration order** is the last trap. C++'s `unordered_map`, Java's `HashMap` and `HashSet` and Python's `set` promise no order at all, and Python even randomises string hashes in every run of a program. Python's `dict` and JavaScript's `Map` and `Set` do keep insertion order, but code that has to print the same thing in every language should sort before printing, as the grouping program below does.

## Pattern: counting how often each value appears

The most common use of a hash map is a **frequency count**: one pass with `count[x] += 1` for every element, then answer questions from the counts. [Majority Element](/problems/majority-element) looks for the count above n/2. [First Unique Character in a String](/problems/first-unique-character-in-a-string) counts every character in one pass, then walks the string again and returns the first character with count 1; the second pass is what preserves the original order. [Top K Frequent Elements](/problems/top-k-frequent-elements) counts first and then picks the k largest counts, with a heap or with buckets indexed by count. Checking whether two strings are anagrams is comparing their two counts.

## Pattern: grouping by a key

To put items into groups, decide on a **canonical key**: something every member of a group shares and no outsider has. Then keep a map from key to the list of members. For anagrams, words made of the same letters, the key can be the word's letters in sorted order: "eat", "tea" and "ate" all become "aet".

| Word | Key (sorted letters) | The group for that key afterwards |
| --- | --- | --- |
| eat | aet | eat |
| tea | aet | eat, tea |
| tan | ant | tan |
| ate | aet | eat, tea, ate |
| nat | ant | tan, nat |
| bat | abt | bat |

Sorting each word costs O(k log k) for words of length k. A key built from the 26 letter counts, such as "1,0,0,…", costs O(k) instead, which helps when words are long. The same idea groups strings that are equal after some allowed change, as in [Groups of Special-Equivalent Strings](/problems/groups-of-special-equivalent-strings).

### The code

Because hash-map order differs between languages, the program sorts each group and then the groups before printing.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

// Groups words that are anagrams of each other.
vector<vector<string>> groupAnagrams(const vector<string>& words) {
    unordered_map<string, vector<string>> groups;    // sorted letters -> the words that have them
    for (const string& word : words) {
        string key = word;
        sort(key.begin(), key.end());                // anagrams share the same sorted letters
        groups[key].push_back(word);
    }
    vector<vector<string>> result;
    for (auto& entry : groups) result.push_back(entry.second);
    return result;
}

int main() {
    vector<string> words = {"eat", "tea", "tan", "ate", "nat", "bat"};
    vector<vector<string>> groups = groupAnagrams(words);
    vector<string> lines;
    for (vector<string>& group : groups) {
        sort(group.begin(), group.end());
        string line;
        for (const string& word : group) line += (line.empty() ? "" : " ") + word;
        lines.push_back(line);
    }
    sort(lines.begin(), lines.end());                // hash-map order is not fixed: sort to print
    for (const string& line : lines) cout << line << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    // Groups words that are anagrams of each other.
    static List<List<String>> groupAnagrams(String[] words) {
        Map<String, List<String>> groups = new HashMap<>();   // sorted letters -> the words that have them
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            String key = new String(letters);                  // anagrams share the same sorted letters
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }
        return new ArrayList<>(groups.values());
    }

    public static void main(String[] args) {
        String[] words = {"eat", "tea", "tan", "ate", "nat", "bat"};
        List<String> lines = new ArrayList<>();
        for (List<String> group : groupAnagrams(words)) {
            Collections.sort(group);
            lines.add(String.join(" ", group));
        }
        Collections.sort(lines);                               // hash-map order is not fixed: sort to print
        for (String line : lines) System.out.println(line);
    }
}
```

```python
def group_anagrams(words):
    """Group words that are anagrams of each other."""
    groups = {}                                  # sorted letters -> the words that have them
    for word in words:
        key = "".join(sorted(word))              # anagrams share the same sorted letters
        groups.setdefault(key, []).append(word)
    return list(groups.values())


words = ["eat", "tea", "tan", "ate", "nat", "bat"]
lines = [" ".join(sorted(group)) for group in group_anagrams(words)]
lines.sort()                                     # hash-map order is not fixed: sort to print
for line in lines:
    print(line)
```

```javascript
// Groups words that are anagrams of each other.
function groupAnagrams(words) {
  const groups = new Map(); // sorted letters -> the words that have them
  for (const word of words) {
    const key = word.split("").sort().join(""); // anagrams share the same sorted letters
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}

const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
const lines = groupAnagrams(words).map((group) => group.sort().join(" "));
lines.sort(); // hash-map order is not fixed: sort to print
for (const line of lines) console.log(line);
```

```output
ate eat tea
bat
nat tan
```

## Pattern: a set of values seen

When you need presence and nothing else, use a hash set. Removing duplicates is putting everything in a set. [Contains Duplicate](/problems/contains-duplicate) adds each value and stops the moment one is already there. [Jewels and Stones](/problems/jewels-and-stones) puts the jewel types in a set so that checking each stone is O(1) rather than a scan of the jewels.

The cleverest use in this stage is [Longest Consecutive Sequence](/problems/longest-consecutive-sequence): the length of the longest run of consecutive integers, in any order, in O(n). Put every value in a set. Then start counting only from values x where x − 1 is **not** in the set, because only those can begin a run, and walk x + 1, x + 2, … while they are present. Every value is touched at most twice, once by the outer loop and once by the walk of the run that contains it, so the total is O(n) even though there is a loop inside a loop. Without the "only from a start" rule, the same code is O(n²).

A map with two directions solves mapping problems. [Isomorphic Strings](/problems/isomorphic-strings) needs every character of one string to map to exactly one character of the other, *and* no two characters to map to the same one, so it keeps a map each way and fails on the first contradiction.

## When an array beats a hash map

If the keys are **small integers in a known range**, you do not need hashing at all: the key itself is the index. Counting lowercase letters needs 26 slots, `count[c - 'a']++`; ASCII characters need 128; values known to be between 0 and 10⁶ need an array of 10⁶ + 1. An array has no hash to compute, no collisions, no boxed integers and a fixed order, so it is faster by a constant factor and simpler to print. [Find All Numbers Disappeared in an Array](/problems/find-all-numbers-disappeared) goes one step further and uses the input array itself as the table, marking value v as seen by negating the entry at index v − 1, which brings the extra space down to O(1).

The array wins only while the range is small and dense. Values up to 10⁹, negative values, strings and pairs all call for a hash map. The [Strings](/roadmap/strings) lesson uses the 26-slot count throughout.

## Time and space complexity

| Operation or approach | Time | Extra space |
| --- | --- | --- |
| Hash map or set: insert, find, delete | O(1) average, O(n) worst | O(n) for n keys |
| Tree map or set (`map`, `TreeMap`): insert, find, delete | O(log n) | O(n) |
| Two Sum by checking every pair | O(n²) | O(1) |
| Two Sum by sorting and two pointers | O(n log n) | O(n) to keep the indices |
| Two Sum with a hash map | O(n) | O(n) |
| Group anagrams of n words of length k, sorted-letter keys | O(n × k log k) | O(n × k) |
| Counting letters in a 26-slot array | O(n) | O(1) |

Hashing almost always trades O(n) memory for removing a factor of n from the time. That is a good trade when n is 10⁵ and memory is measured in megabytes, which is nearly always.

## How to recognise a hashing problem

Read the statement for these signals:

- **"Find two elements that…"** in an unsorted array, especially when the answer is their indices: a complement lookup.
- **"How many times", "most frequent", "unique", "first non-repeating"**: a frequency count.
- **"Group", "anagram", "same pattern"**: a canonical key and a map of lists.
- **"Contains", "duplicate", "already seen", "missing"**: a hash set, or an array if the values are small.
- **The brute force asks "is X somewhere in the array?" inside a loop.** Replace the inner search with a lookup.
- **A subarray sum equals k.** Prefix sums stored in a hash map, which the [prefix sums](/roadmap/prefix-sum) lesson builds up to.

## Common mistakes

- **Storing before looking.** In Two Sum, inserting `nums[i]` before checking its complement lets a number pair with itself.
- **Relying on iteration order.** A `HashMap` or `unordered_map` can return keys in any order, and the order can change between runs and versions. Sort when the output must be ordered.
- **Creating keys by reading them.** In C++, `if (m[k] > 0)` inserts k. Test with `count` or `find`.
- **Using a mutable or identity-compared key.** Python lists cannot be keys; Java arrays and JavaScript arrays are compared by identity, so two arrays with the same contents are different keys. Convert to a string or tuple.
- **Forgetting the cost of hashing long keys.** Hashing a string of length k is O(k), so a map keyed on substrings of length up to n is not O(1) per operation.
- **Reaching for a map when an array would do.** For 26 letters or values up to 10⁶, an array is simpler and faster.

## Practice in this order

Start with plain lookups and counts, then move to the problems where the key or the rule has to be designed:

1. [Jewels and Stones](/problems/jewels-and-stones): a set turns a scan into a lookup.
2. [Two Sum](/problems/two-sum): the complement lookup from this lesson.
3. [First Unique Character in a String](/problems/first-unique-character-in-a-string): count, then a second pass in order.
4. [Majority Element](/problems/majority-element): a frequency count, then a constant-space follow-up.
5. [Isomorphic Strings](/problems/isomorphic-strings): a map in each direction.
6. [Find All Numbers Disappeared in an Array](/problems/find-all-numbers-disappeared): a set, then the input as its own table.
7. [Groups of Special-Equivalent Strings](/problems/groups-of-special-equivalent-strings): designing a canonical key.
8. [Longest Consecutive Sequence](/problems/longest-consecutive-sequence): a set and the "only start at a start" rule.
9. [Top K Frequent Elements](/problems/top-k-frequent-elements): counts, then buckets by count.

The [hash table problem list](/challenges/hash-table) has every hashing problem in the catalogue, from easy to hard. When the first six feel routine, move on to the next stage of the roadmap: [Strings](/roadmap/strings).
