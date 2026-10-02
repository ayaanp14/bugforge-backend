---
title: Strings
stage: strings
order: 1
minutes: 13
level: Beginner
hub: strings
practice: reverse-string, valid-anagram, valid-palindrome, length-of-last-word, longest-common-prefix, merge-strings-alternately, is-subsequence, string-compression, longest-palindromic-substring
updated: 2026-10-03
seo-title: Strings in DSA: Immutability, Character Codes and Patterns
description: Strings for coding interviews: immutability, building in O(n), character codes, counting, palindromes and anagrams, in C++, Java, Python and JavaScript.
question: What is a string in data structures?
answer: A string is a sequence of characters stored like an array, so its length and the character at any index are O(1) to read. In Java, Python and JavaScript strings are immutable: every change creates a new string, so appending in a loop costs O(n²) unless you use a StringBuilder or join a list. Most string problems reduce to counting characters, two pointers or a sliding window.
q: Why are strings immutable in Java, Python and JavaScript?
a: An immutable string can be shared freely: many variables, threads or data structures can hold the same string without any of them changing it under the others, and identical literals can be stored once. It is also safe as a hash map key, because its hash can never change after it is stored. The cost is that every edit makes a new copy.
q: Why is string concatenation in a loop slow?
a: With immutable strings, result = result + c copies every character of result into a new string. Doing that for n characters copies 1 + 2 + … + n, about n²/2 characters, so building a 10⁵-character string this way is about 5 × 10⁹ copies. A StringBuilder, or a list joined once at the end, grows like a dynamic array and makes the whole build O(n).
q: How do I turn a letter into a number from 0 to 25?
a: Subtract the code of 'a'. In C++ and Java, c - 'a' does it directly because characters are small integers. In Python write ord(c) - ord('a'), and in JavaScript s.charCodeAt(i) - 97. It works because the lowercase letters have consecutive codes, 97 to 122, which is also why a 26-slot array can count them.
q: What is the time complexity of taking a substring?
a: Treat it as O(k) for a substring of length k, because C++ substr, Java substring, Python slicing and JavaScript slice all copy the characters into a new string. Inside a loop that adds up quickly: copying every substring of an n-character string costs O(n³). Work with start and end indices instead, or a C++17 string_view, which views without copying.
q: How do I check if two strings are anagrams?
a: Two strings are anagrams when they contain the same letters the same number of times. Count the letters of the first string in a 26-slot array, subtract the letters of the second, and check every slot is back to zero: O(n) time and O(1) extra space. Sorting both strings and comparing also works, in O(n log n).
q: Why does == not work for comparing strings in Java?
a: In Java, == on two objects asks whether they are the same object in memory, not whether they hold the same characters. Two equal strings built at run time are usually different objects, so == returns false even though they match. Use a.equals(b) to compare contents. C++, Python and JavaScript compare string contents with == or ===.
---
A **string** is an array of characters with two twists that decide how you write almost every string solution. In most languages you cannot change a string once it exists, so building one carelessly is quadratic. And every character is really a small number, so a 26-slot array can count letters faster than any hash map. Get those two ideas right and most string problems become [array](/roadmap/arrays) problems you already know how to solve.

## How a string is stored

A string keeps its characters contiguously, in order, with its length stored alongside, so `s[i]` and the length are O(1) and a walk from start to end is an ordinary O(n) pass. Each character is stored as a number, its **code**, and for the characters coding problems use the codes come from **ASCII**:

@figure char-codes

Beyond ASCII the languages differ — Java and JavaScript count UTF-16 units, Python whole characters, C++ bytes — which is why problems say "lowercase English letters". When any Unicode character is allowed, count with a hash map.

## Immutability: which strings you can change

A C++ `std::string` is **mutable**: `s[i] = 'x'` changes a character in place and `s += c` appends in amortised O(1), like a `vector`. In Java, Python and JavaScript strings are **immutable**: anything that looks like an edit — `s + c`, `replace`, `toUpperCase` — builds a new string, and Python's `s[0] = 'x'` is an error.

That is deliberate: an immutable string can be shared safely, and is safe as a hash map key — a key that changed after being stored would sit in the wrong bucket. So edit something mutable and make the string once: a `StringBuilder` in Java, a list and one `"".join(parts)` in Python, an array and one `parts.join("")` in JavaScript.

## The quadratic concatenation trap

Here is why that rule matters. `result = result + c` in a loop looks linear:

@figure concat-trap

A builder avoids the triangle because it is a [dynamic array](/roadmap/big-o-notation) of characters with spare capacity. Java's compiler merges `a + b + c` within one expression, but not across loop iterations; CPython and V8 sometimes soften the trap internally, but that can vanish, so write the builder.

## Characters are numbers

Since characters are codes, much of string work is arithmetic:

| Task | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Letter to 0–25 | `c - 'a'` | `c - 'a'` | `ord(c) - ord('a')` | `s.charCodeAt(i) - 97` |
| 0–25 back to a letter | `char('a' + k)` | `(char) ('a' + k)` | `chr(ord('a') + k)` | `String.fromCharCode(97 + k)` |
| Letter or digit? | `isalnum((unsigned char) c)` | `Character.isLetterOrDigit(c)` | `c.isalnum()` | `/[a-z0-9]/i.test(c)` |
| Substring from a up to b | `s.substr(a, b - a)` | `s.substring(a, b)` | `s[a:b]` | `s.slice(a, b)` |
| Compare contents | `a == b` | `a.equals(b)` | `a == b` | `a === b` |

Note the substring row: C++'s `substr` takes a start and a **length**, the others a start and an **exclusive end**.

## Counting with a 26-slot array

Two strings are **anagrams** when they hold the same letters the same number of times, like "listen" and "silent" — the check in [Valid Anagram](/problems/valid-anagram). Sorting both works in O(n log n); counting is O(n). Add one per letter of the first string, subtract one per letter of the second, and check every slot is back to zero:

@figure anagram-count

An array beats a hash map here because `c - 'a'` is already an index: nothing to hash, nothing to collide. Once the alphabet is large or unknown, use [Hashing](/roadmap/hashing).

```cpp
#include <iostream>
#include <string>
using namespace std;

// True when t uses exactly the same letters as s, each the same number of times.
// Both strings hold lowercase English letters only.
bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int count[26] = {0};
    for (char c : s) count[c - 'a']++;       // 'a' -> 0, 'b' -> 1, ..., 'z' -> 25
    for (char c : t) count[c - 'a']--;
    for (int k = 0; k < 26; k++)
        if (count[k] != 0) return false;     // this letter appears more often in one string
    return true;
}

int main() {
    string pairs[3][2] = {{"listen", "silent"}, {"anagram", "nagaram"}, {"rat", "car"}};
    for (auto& p : pairs) {
        cout << p[0] << " / " << p[1] << ": " << (isAnagram(p[0], p[1]) ? "anagrams" : "not anagrams") << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // True when t uses exactly the same letters as s, each the same number of times.
    // Both strings hold lowercase English letters only.
    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;   // 'a' -> 0, ..., 'z' -> 25
        for (int i = 0; i < t.length(); i++) count[t.charAt(i) - 'a']--;
        for (int k = 0; k < 26; k++)
            if (count[k] != 0) return false;     // this letter appears more often in one string
        return true;
    }

    public static void main(String[] args) {
        String[][] pairs = {{"listen", "silent"}, {"anagram", "nagaram"}, {"rat", "car"}};
        for (String[] p : pairs) {
            System.out.println(p[0] + " / " + p[1] + ": " + (isAnagram(p[0], p[1]) ? "anagrams" : "not anagrams"));
        }
    }
}
```

```python
def is_anagram(s, t):
    """True when t uses exactly the same letters as s, each the same number of times.
    Both strings hold lowercase English letters only."""
    if len(s) != len(t):
        return False
    count = [0] * 26
    for c in s:
        count[ord(c) - ord("a")] += 1       # 'a' -> 0, 'b' -> 1, ..., 'z' -> 25
    for c in t:
        count[ord(c) - ord("a")] -= 1
    for k in range(26):
        if count[k] != 0:                   # this letter appears more often in one string
            return False
    return True


pairs = [("listen", "silent"), ("anagram", "nagaram"), ("rat", "car")]
for s, t in pairs:
    print(f"{s} / {t}: {'anagrams' if is_anagram(s, t) else 'not anagrams'}")
```

```javascript
// True when t uses exactly the same letters as s, each the same number of times.
// Both strings hold lowercase English letters only.
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const A = "a".charCodeAt(0);
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - A]++; // 'a' -> 0, ..., 'z' -> 25
  for (let i = 0; i < t.length; i++) count[t.charCodeAt(i) - A]--;
  for (let k = 0; k < 26; k++) {
    if (count[k] !== 0) return false; // this letter appears more often in one string
  }
  return true;
}

const pairs = [
  ["listen", "silent"],
  ["anagram", "nagaram"],
  ["rat", "car"],
];
for (const [s, t] of pairs) {
  console.log(`${s} / ${t}: ${isAnagram(s, t) ? "anagrams" : "not anagrams"}`);
}
```

```output
listen / silent: anagrams
anagram / nagaram: anagrams
rat / car: not anagrams
```

The same count answers many questions in one pass: [Ransom Note](/problems/ransom-note) checks that one string's counts cover another's, [Find All Anagrams in a String](/problems/find-all-anagrams-in-a-string) slides a window of counts along a string, and [First Unique Character in a String](/problems/first-unique-character-in-a-string) counts and then looks for the first count of 1.

## Palindromes: compare from both ends

A **palindrome** reads the same both ways; [Valid Palindrome](/problems/valid-palindrome) also ignores case and anything that is not a letter or digit. A cleaned, reversed copy costs O(n) memory. Instead, walk a pointer in from each end:

- **The left character is not a letter or digit**: move `left` right.
- **The right character is not a letter or digit**: move `right` left.
- **Both are**: compare them in lower case. Different means false; equal means move both inwards.

This is the opposite-ends form of [two pointers](/roadmap/two-pointers), with no copy at all.

@walkthrough

## Why skipping is safe

Picture the cleaned string — letters and digits only, lower-cased. It is a palindrome when each character equals its mirror image, and skipping punctuation from both ends makes the pointers meet exactly those pairs, from the outside in:

@figure mirror-pairs

The invariant: **every letter or digit outside `left`..`right` has matched its mirror image**. It holds at the start, each step keeps it, and when the pointers meet every pair has matched. Neither pointer ever moves back, so the loop runs at most n times: O(n) time and O(1) extra space.

### The code

```cpp
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

// True when s reads the same both ways, ignoring case and anything
// that is not a letter or a digit.
bool isPalindrome(const string& s) {
    int left = 0, right = (int)s.size() - 1;
    while (left < right) {
        if (!isalnum((unsigned char)s[left])) { left++; continue; }     // skip spaces and punctuation
        if (!isalnum((unsigned char)s[right])) { right--; continue; }
        if (tolower((unsigned char)s[left]) != tolower((unsigned char)s[right])) return false;
        left++;                                                         // this pair matches: move inwards
        right--;
    }
    return true;
}

int main() {
    string examples[] = {"Don't nod.", "A man, a plan, a canal: Panama", "race a car"};
    for (const string& s : examples) {
        cout << "\"" << s << "\": " << (isPalindrome(s) ? "palindrome" : "not a palindrome") << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // True when s reads the same both ways, ignoring case and anything
    // that is not a letter or a digit.
    static boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (!Character.isLetterOrDigit(s.charAt(left))) { left++; continue; }    // skip spaces and punctuation
            if (!Character.isLetterOrDigit(s.charAt(right))) { right--; continue; }
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) return false;
            left++;                                                                  // this pair matches: move inwards
            right--;
        }
        return true;
    }

    public static void main(String[] args) {
        String[] examples = {"Don't nod.", "A man, a plan, a canal: Panama", "race a car"};
        for (String s : examples) {
            System.out.println("\"" + s + "\": " + (isPalindrome(s) ? "palindrome" : "not a palindrome"));
        }
    }
}
```

```python
def is_palindrome(s):
    """True when s reads the same both ways, ignoring case and anything
    that is not a letter or a digit."""
    left, right = 0, len(s) - 1
    while left < right:
        if not s[left].isalnum():        # skip spaces and punctuation
            left += 1
            continue
        if not s[right].isalnum():
            right -= 1
            continue
        if s[left].lower() != s[right].lower():
            return False
        left += 1                        # this pair matches: move inwards
        right -= 1
    return True


examples = ["Don't nod.", "A man, a plan, a canal: Panama", "race a car"]
for s in examples:
    verdict = "palindrome" if is_palindrome(s) else "not a palindrome"
    print(f'"{s}": {verdict}')
```

```javascript
// True when s reads the same both ways, ignoring case and anything
// that is not a letter or a digit.
const isAlnum = (c) => /[a-z0-9]/i.test(c);

function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (!isAlnum(s[left])) {
      left++; // skip spaces and punctuation
      continue;
    }
    if (!isAlnum(s[right])) {
      right--;
      continue;
    }
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++; // this pair matches: move inwards
    right--;
  }
  return true;
}

const examples = ["Don't nod.", "A man, a plan, a canal: Panama", "race a car"];
for (const s of examples) {
  console.log(`"${s}": ${isPalindrome(s) ? "palindrome" : "not a palindrome"}`);
}
```

```output
"Don't nod.": palindrome
"A man, a plan, a canal: Panama": palindrome
"race a car": not a palindrome
```

[Valid Palindrome II](/problems/valid-palindrome-ii) allows one deletion: at the first mismatch, try skipping either character. [Longest Palindromic Substring](/problems/longest-palindromic-substring) turns the check inside out and expands from each of the 2n − 1 centres, O(n²).

## Building a new string: reversing the words

Many problems produce a new string, and this is where the builder rule pays off. [Reverse Words in a String](/problems/reverse-words-in-a-string) turns `"  the sky   is blue  "` into `"blue is sky the"` in three O(n) steps:

@figure reverse-words

In C++, where strings are mutable, there is also an in-place version with O(1) extra space: reverse the whole string, reverse each word back, then squeeze out extra spaces with a write index. [Reverse Words in a String III](/problems/reverse-words-in-a-string-iii) is the middle step on its own.

### The code

The program prints each result between brackets, so stray spaces would show.

```cpp
#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

// The words of s in reverse order, separated by single spaces.
string reverseWords(const string& s) {
    istringstream in(s);
    vector<string> words;
    string word;
    while (in >> word) words.push_back(word);       // >> skips any run of spaces
    reverse(words.begin(), words.end());
    string result;                                  // std::string is mutable: += is amortised O(1)
    for (const string& w : words) {
        if (!result.empty()) result += ' ';
        result += w;
    }
    return result;
}

int main() {
    string examples[] = {"  the sky   is blue  ", "a good   example"};
    for (const string& s : examples) cout << "[" << reverseWords(s) << "]\n";
    return 0;
}
```

```java
import java.util.Arrays;
import java.util.Collections;

public class Main {
    // The words of s in reverse order, separated by single spaces.
    static String reverseWords(String s) {
        String[] words = s.trim().split("\\s+");        // split on runs of spaces
        Collections.reverse(Arrays.asList(words));      // reverses the array through a list view
        StringBuilder result = new StringBuilder();     // String is immutable: build with a StringBuilder
        for (String w : words) {
            if (result.length() > 0) result.append(' ');
            result.append(w);
        }
        return result.toString();
    }

    public static void main(String[] args) {
        String[] examples = {"  the sky   is blue  ", "a good   example"};
        for (String s : examples) System.out.println("[" + reverseWords(s) + "]");
    }
}
```

```python
def reverse_words(s):
    """The words of s in reverse order, separated by single spaces."""
    words = s.split()                # no argument: splits on runs of spaces, drops empty pieces
    words.reverse()
    return " ".join(words)           # str is immutable: collect the pieces, join once


examples = ["  the sky   is blue  ", "a good   example"]
for s in examples:
    print(f"[{reverse_words(s)}]")
```

```javascript
// The words of s in reverse order, separated by single spaces.
function reverseWords(s) {
  const words = s.trim().split(/\s+/); // split on runs of spaces
  words.reverse();
  return words.join(" "); // strings are immutable: collect the pieces, join once
}

const examples = ["  the sky   is blue  ", "a good   example"];
for (const s of examples) console.log(`[${reverseWords(s)}]`);
```

```output
[blue is sky the]
[example good a]
```

## Substrings, comparisons and other hidden costs

- **Substrings copy.** `substr`, `substring`, slicing and `slice` are O(k) for length k; copying all n(n + 1)/2 substrings is O(n³). Keep start and end indexes, or a C++17 `string_view`.
- **Equality compares character by character**: O(n), though different lengths are rejected at once.
- **Ordering is by codes.** "app" < "apple", and every capital sorts before every small letter: "Zebra" < "apple".
- **Pattern search** with `find`, `indexOf` or `in` can take O(n × m); KMP guarantees O(n + m) — see the [string matching](/challenges/string-matching) list.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Build a string of n characters | `result = result + c` (immutable) | O(n²) | O(n) |
| Build a string of n characters | builder, or a list joined once | O(n) | O(n) |
| Anagram check | sort both and compare | O(n log n) | O(n) |
| Anagram check | 26-slot count | O(n) | O(1) |
| Palindrome check | cleaned, reversed copy | O(n) | O(n) |
| Palindrome check | two pointers from both ends | O(n) | O(1) |
| Reverse the words | split, reverse, join | O(n) | O(n) |

## How to recognise the pattern

- **"Anagram", "permutation of", "can be formed from"**: counts, compared or subtracted.
- **"Lowercase English letters"** in the constraints: a 26-slot array instead of a hash map.
- **"Palindrome"**: two pointers from both ends, or expanding from each centre.
- **"Substring" with a condition**: a [sliding window](/roadmap/sliding-window).
- **"Subsequence"**: two pointers across two strings, as in [Is Subsequence](/problems/is-subsequence), or [dynamic programming](/roadmap/dynamic-programming).
- **"Common prefix"**: compare column by column, as in [Longest Common Prefix](/problems/longest-common-prefix), or a [trie](/roadmap/trie) for many queries.
- **The answer is a new string**: a builder, never repeated concatenation.

## Common mistakes

- **Concatenating in a loop.** `result += c` on an immutable string is O(n²).
- **Comparing Java strings with `==`.** It compares identity; use `equals`.
- **Forgetting to normalise.** "Racecar" is a palindrome only once case is ignored.
- **Indexing the 26-slot array with a non-letter.** `'A' - 'a'` and `' ' - 'a'` are negative; use 128 slots or a map.
- **Character arithmetic surprises.** In Java `'a' + 1` is the int 98; cast with `(char)`. In C++, pass `(unsigned char) c` to `isalnum` and `tolower`.

## Practice in this order

1. [Reverse String](/problems/reverse-string): swap from both ends, in place.
2. [Valid Anagram](/problems/valid-anagram): the 26-slot count.
3. [Valid Palindrome](/problems/valid-palindrome): skip, lower-case, compare from both ends.
4. [Length of Last Word](/problems/length-of-last-word): scan from the end.
5. [Longest Common Prefix](/problems/longest-common-prefix): compare column by column.
6. [Merge Strings Alternately](/problems/merge-strings-alternately): build with a builder.
7. [Is Subsequence](/problems/is-subsequence): one pointer in each string.
8. [String Compression](/problems/string-compression): read and write pointers, counts as digits.
9. [Longest Palindromic Substring](/problems/longest-palindromic-substring): expand around every centre.

Every string problem in the catalogue is on the [string problem list](/challenges/strings). When the first six feel routine, move on to [Two Pointers](/roadmap/two-pointers).
