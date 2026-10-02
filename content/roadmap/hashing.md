---
title: Hashing: Hash Maps and Hash Sets
stage: hashing
order: 1
minutes: 13
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
Many problems come down to one question asked over and over: *have I seen this value before, and where?* Scanning the array to answer it costs O(n) each time, so asking it for every element makes the whole solution O(n²). **Hashing** answers in O(1) on average by spending memory: a **hash map** remembers each value with something about it, such as its index or a count, and a **hash set** remembers just the values.

@figure scan-vs-lookup

## Why scanning is too slow

[Two Sum](/problems/two-sum) gives you an array and a target and asks for the indices of two numbers that add up to it. Trying every pair is n(n − 1)/2 checks, about 5 × 10⁹ when n = 10⁵, against the roughly 10⁸ simple steps a judge allows in a second. Sorting and [two pointers](/roadmap/two-pointers) give O(n log n), but sorting moves the elements and the problem wants their original indices.

## The idea: remember what you have seen

Walk the array once with a map from each value seen to its index. At each number, work out the **complement** — the value that would complete the pair — and look it up:

- **It is in the map**: the pair is the stored index and the current one.
- **It is not**: store this number and its index, because a later number might need it.

Looking up *before* storing means the map only holds earlier numbers, so a number never pairs with itself: with target 14, a lone 7 must not count as 7 + 7. One lookup and one insert per element, both O(1) on average, make the search O(n) time with O(n) memory.

@walkthrough

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

Underneath every hash map and set is a **hash table**: an ordinary array of **buckets** plus a **hash function** that turns any key into a whole number, reduced to a bucket index — typically the hash modulo the number of buckets. Finding a key repeats the same calculation, so the key's own value says where to look:

@figure chaining

A hash function must be **deterministic** and should **spread** keys evenly. Strings mix every character (Java's `String.hashCode` uses powers of 31), so hashing a string of length k costs O(k).

## Collisions: chaining and open addressing

There are far more possible keys than buckets, so **collisions** are certain. **Separate chaining**, drawn above, keeps a list per bucket; C++'s `unordered_map` and Java's `HashMap` work this way (Java turns a bucket of more than eight entries into a small tree). **Open addressing** keeps every key in the array and probes for a free slot; Python's `dict` and `set` do this, with a more scattered probe order than the linear one here:

@figure open-addressing

## Why lookups are O(1) on average

Either way, a lookup only compares the key with the few keys sharing its bucket or probe path. The design question is how to keep that number small, and the answer is the **load factor**:

@figure resize

In an interview, say "O(1) on average". When you need the keys in order, C++'s `map` and Java's `TreeMap` are balanced search trees: O(log n) per operation, but sorted, with the nearest key above or below any value.

## Hash maps and hash sets in each language

| Task | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Map, set | `unordered_map`, `unordered_set` | `HashMap`, `HashSet` | `dict`, `set` | `Map`, `Set` |
| Insert or update | `m[k] = v` | `m.put(k, v)` | `m[k] = v` | `m.set(k, v)` |
| Is the key there? | `m.count(k)` | `m.containsKey(k)` | `k in m` | `m.has(k)` |
| Value or a default | `m.count(k) ? m[k] : 0` | `m.getOrDefault(k, 0)` | `m.get(k, 0)` | `m.get(k) ?? 0` |
| Remove | `m.erase(k)` | `m.remove(k)` | `del m[k]` | `m.delete(k)` |

The traps: in C++, reading `m[k]` for a missing key **inserts** it; in Java, unboxing the `null` that `get` returns throws; Python lists cannot be keys; a plain JavaScript object turns every key into a string, so prefer `Map`. And never rely on **iteration order** — sort before printing, as the grouping program below does.

## Pattern: counting how often each value appears

The most common use of a hash map is a **frequency count**: one pass of `count[x] += 1`, then answer from the counts. [Majority Element](/problems/majority-element) wants a count above n/2; [First Unique Character in a String](/problems/first-unique-character-in-a-string) counts, then walks the string again so the original order decides.

## Pattern: grouping by a key

To put items into groups, choose a **canonical key** that every member of a group shares and no outsider has, and keep a map from key to members:

@figure group-anagrams

The same idea groups strings that are equal after some allowed change, as in [Groups of Special-Equivalent Strings](/problems/groups-of-special-equivalent-strings).

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

When you need presence and nothing else, use a hash set. [Contains Duplicate](/problems/contains-duplicate) stops the moment a value is already in the set; [Jewels and Stones](/problems/jewels-and-stones) makes checking each stone O(1). The cleverest use in this stage is [Longest Consecutive Sequence](/problems/longest-consecutive-sequence), in O(n) despite a loop inside a loop:

@figure consecutive

A map in each direction solves mapping problems: [Isomorphic Strings](/problems/isomorphic-strings) needs every character to map to exactly one other *and* no two to map to the same one, so it keeps both maps and fails on the first contradiction.

## When an array beats a hash map

If the keys are **small integers in a known range**, the key itself is the index — 26 slots for lowercase letters, `count[c - 'a']++` — with no hash, no collisions and a fixed order. [Find All Numbers Disappeared in an Array](/problems/find-all-numbers-disappeared) even uses the input as its own table, negating index v − 1 to mark v as seen. Large, negative or non-numeric keys still need a hash map; the [Strings](/roadmap/strings) lesson uses the 26-slot count throughout.

## Time and space complexity

| Operation or approach | Time | Extra space |
| --- | --- | --- |
| Hash map or set: insert, find, delete | O(1) average, O(n) worst | O(n) |
| Tree map or set: insert, find, delete | O(log n) | O(n) |
| Two Sum, every pair | O(n²) | O(1) |
| Two Sum, sort and two pointers | O(n log n) | O(n) for the indices |
| Two Sum, hash map | O(n) | O(n) |
| Group anagrams, sorted-letter keys | O(n × k log k) | O(n × k) |

Hashing nearly always trades O(n) memory for a factor of n in time — a good trade when memory is measured in megabytes.

## How to recognise a hashing problem

- **"Find two elements that…"** in an unsorted array, especially by index: a complement lookup.
- **"How many times", "most frequent", "first non-repeating"**: a frequency count.
- **"Group", "anagram", "same pattern"**: a canonical key and a map of lists.
- **"Contains", "duplicate", "missing"**: a hash set, or an array for small values.
- **A brute force asking "is X in the array?" inside a loop**: replace the search with a lookup.
- **A subarray sum equals k**: prefix sums in a hash map, built up in [prefix sums](/roadmap/prefix-sum).

## Common mistakes

- **Storing before looking.** In Two Sum, inserting first lets a number pair with itself.
- **Relying on iteration order.** Sort when the output must be ordered.
- **Creating keys by reading them.** In C++, `if (m[k] > 0)` inserts k; use `count` or `find`.
- **Identity-compared keys.** Java and JavaScript arrays with equal contents are different keys; convert to a string.
- **Long keys.** Hashing a string of length k is O(k), so a map keyed on long substrings is not O(1) per operation.
- **A map where an array would do.** For 26 letters, an array is simpler and faster.

## Practice in this order

1. [Jewels and Stones](/problems/jewels-and-stones): a set instead of a scan.
2. [Two Sum](/problems/two-sum): the complement lookup.
3. [First Unique Character in a String](/problems/first-unique-character-in-a-string): count, then a second pass.
4. [Majority Element](/problems/majority-element): a frequency count.
5. [Isomorphic Strings](/problems/isomorphic-strings): a map each way.
6. [Find All Numbers Disappeared in an Array](/problems/find-all-numbers-disappeared): the input as its own table.
7. [Groups of Special-Equivalent Strings](/problems/groups-of-special-equivalent-strings): a canonical key.
8. [Longest Consecutive Sequence](/problems/longest-consecutive-sequence): the start-of-a-run rule.
9. [Top K Frequent Elements](/problems/top-k-frequent-elements): counts, then buckets.

Every hashing problem in the catalogue is on the [hash table problem list](/challenges/hash-table). When the first six feel routine, move on to [Strings](/roadmap/strings).
