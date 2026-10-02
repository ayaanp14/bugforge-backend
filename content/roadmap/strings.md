---
title: Strings
stage: strings
order: 1
minutes: 22
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
A **string** is an array of characters with two twists that decide how you write almost every string solution. In most languages you cannot change a string once it exists, so building one carelessly is quadratic. And every character is really a small number, so a 26-slot array can count letters faster than any hash map. Get those two ideas right and most string problems become array problems you already know how to solve.

This lesson covers how a string is stored, which languages let you modify one and how to build strings in linear time in those that do not, characters as numeric codes, and three patterns you will reuse throughout the roadmap: counting with a 26-slot array, comparing from both ends to check a palindrome, and splitting and rebuilding to reverse the words of a sentence. It finishes with the hidden costs of substrings and comparisons. Every program is shown in C++, Java, Python and JavaScript.

## How a string is stored

A string keeps its characters contiguously, in order, like an [array](/roadmap/arrays), and stores its length alongside them. So `s[i]` and the length are both O(1), and walking a string from start to end is an ordinary O(n) pass.

Each character is stored as a number, its **code**. For the characters coding problems use, the codes come from **ASCII**, and three facts about the table are worth memorising:

```text
 character:   '0' ... '9'    'A' ... 'Z'    'a' ... 'z'    ' '
 code:         48 ...  57     65 ...  90     97 ... 122     32

 s:       c     o     d     e
 index:   0     1     2     3
 code:    99   111   100   101         'c' - 'a' = 2,  'o' - 'a' = 14
```

The digits, the capital letters and the small letters each sit in an unbroken run, so subtracting the first code of a run turns a character into its position: `c - 'a'` maps 'a' to 0 and 'z' to 25, `c - '0'` turns the digit character '7' into the number 7. A small letter's code is its capital's code plus 32.

Beyond ASCII the languages differ. Java and JavaScript store strings as UTF-16 code units: almost every character is one unit, but emoji and some rarer scripts take two, so `length` counts units rather than characters. Python indexes whole characters (code points). A C++ `std::string` is a sequence of bytes, and a non-ASCII character encoded in UTF-8 takes two to four of them. Interview problems almost always say "lowercase English letters" or "printable ASCII" precisely so that none of this matters; when a problem allows any Unicode character, count with a hash map instead of a 26-slot array.

## Immutability: which strings you can change

A C++ `std::string` is **mutable**: `s[i] = 'x'` changes one character in place, and `s += c` or `s.push_back(c)` appends in amortised O(1), because the string grows like a `vector`. In Java, Python and JavaScript strings are **immutable**: no operation changes an existing string. Anything that looks like an edit, `s + c`, `s.replace(...)`, `s.toUpperCase()`, builds a brand new string and leaves the old one untouched. Python's `s[0] = 'x'` is simply an error.

Immutability is a deliberate design, not a limitation someone forgot to fix. An immutable string can be shared by any number of variables and threads with no risk that one of them changes it under the others, so identical literals can be stored once. It is also safe to use as a hash map key: a key's bucket is computed from its characters, and a key that could change after being stored would sit in the wrong bucket and never be found again. Java even caches a string's hash code, since it can never change.

So in those three languages, edit something mutable and turn it into a string once at the end:

- **Java:** `StringBuilder`, with `append`, `setCharAt`, `insert`, `reverse` and a final `toString()`. Or work on `s.toCharArray()` and finish with `new String(chars)`.
- **Python:** collect the pieces in a list and call `"".join(parts)` once; or `list(s)` to edit characters, then join.
- **JavaScript:** push the pieces into an array and call `parts.join("")` once; or `s.split("")` to edit characters, then join.

## The quadratic concatenation trap

Here is why the rule above matters. Building a string of n characters with `result = result + c` in a loop copies the whole of `result` at every step:

```text
 result = result + c, building "abcde"

 step 1:   "a"         copies 1 character
 step 2:   "ab"        copies 2
 step 3:   "abc"       copies 3
 step 4:   "abcd"      copies 4
 step 5:   "abcde"     copies 5          total: 1 + 2 + … + n = n(n + 1)/2
```

That is O(n²). For a 10⁵-character answer it is about 5 × 10⁹ character copies, far over a one-second limit, from a loop that looks linear. A builder avoids it because it is a [dynamic array](/roadmap/big-o-notation) of characters with spare capacity: each append is amortised O(1), and the single conversion at the end is O(n).

Two details trip up people who test this themselves. Java's compiler turns `a + b + c` inside one expression into a single efficient build, but a loop still creates a new string on every iteration, so the loop stays quadratic. And some runtimes soften the trap: CPython can sometimes extend a string in place when nothing else refers to it, and V8 stores concatenations as a tree of pieces. Both are implementation details that can disappear, and Python's own style guide tells you not to rely on the first one. Write the builder version and the cost is guaranteed.

## Characters are numbers

Since characters are codes, a lot of string work is arithmetic. The same operations in each language:

| Task | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Character at i | `s[i]` | `s.charAt(i)` | `s[i]` | `s[i]` |
| Letter to 0–25 | `c - 'a'` | `c - 'a'` | `ord(c) - ord('a')` | `s.charCodeAt(i) - 97` |
| 0–25 back to a letter | `char('a' + k)` | `(char) ('a' + k)` | `chr(ord('a') + k)` | `String.fromCharCode(97 + k)` |
| Letter or digit? | `isalnum((unsigned char) c)` | `Character.isLetterOrDigit(c)` | `c.isalnum()` | `/[a-z0-9]/i.test(c)` |
| Lower case | `tolower((unsigned char) c)` | `Character.toLowerCase(c)` | `c.lower()` | `c.toLowerCase()` |
| Substring from a up to b | `s.substr(a, b - a)` | `s.substring(a, b)` | `s[a:b]` | `s.slice(a, b)` |
| Compare contents | `a == b` | `a.equals(b)` | `a == b` | `a === b` |

Note the substring row: C++'s `substr` takes a start and a **length**, the others a start and an **exclusive end**. And Java's `Character.isLetterOrDigit` and Python's `isalnum` also accept letters from other alphabets, such as é; for ASCII-only input they agree with the C++ and JavaScript versions.

## Counting with a 26-slot array

Two strings are **anagrams** when they hold the same letters the same number of times: "listen" and "silent", "anagram" and "nagaram". The direct check is [Valid Anagram](/problems/valid-anagram). Sorting both strings and comparing works, in O(n log n). Counting is better: add one to a letter's slot for every letter of the first string, subtract one for every letter of the second, and the strings are anagrams exactly when every slot ends at zero. If any slot is non-zero, that letter appears more often in one string than in the other.

Why an array and not a hash map? The keys are the 26 letters, and `c - 'a'` turns each into an index from 0 to 25. Indexing an array is cheaper than hashing, there are no collisions, and the array has a fixed size whatever the input length, so the extra space is O(1). A hash map is the right tool once the alphabet is large or unknown; see [Hashing](/roadmap/hashing). Checking the lengths first is a free shortcut, since strings of different lengths can never be anagrams.

### Dry run

Only the letters that appear are shown; the other 22 slots stay at zero throughout.

| Step | e | i | l | n | s | t |
| --- | --- | --- | --- | --- | --- | --- |
| after adding "listen" | 1 | 1 | 1 | 1 | 1 | 1 |
| after subtracting "silent" | 0 | 0 | 0 | 0 | 0 | 0 |

Every slot is zero: anagrams. For "rat" and "car":

| Step | a | c | r | t |
| --- | --- | --- | --- | --- |
| after adding "rat" | 1 | 0 | 1 | 1 |
| after subtracting "car" | 0 | −1 | 0 | 1 |

The 'c' slot is −1 and the 't' slot is 1, so the strings are not anagrams.

### The code

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

The same 26-slot count answers many questions with one pass: [Ransom Note](/problems/ransom-note) checks that one string's counts cover another's, [Find All Anagrams in a String](/problems/find-all-anagrams-in-a-string) slides a window of counts along a string, and [First Unique Character in a String](/problems/first-unique-character-in-a-string) counts first and then looks for the first count of 1.

## Palindromes: compare from both ends

A **palindrome** reads the same forwards and backwards. [Valid Palindrome](/problems/valid-palindrome) adds the real-world twist: ignore capital letters and anything that is not a letter or digit, so "A man, a plan, a canal: Panama" counts. The obvious solution builds a cleaned, lower-cased copy, reverses it and compares the two: correct, but O(n) extra memory for two new strings.

Instead, put one pointer at each end and walk them towards each other, comparing as you go:

- **The left character is not a letter or digit.** Skip it: move `left` one step right.
- **The right character is not a letter or digit.** Skip it: move `right` one step left.
- **Both are letters or digits.** Compare them in lower case. Different means not a palindrome; equal means move both pointers inwards.

Stop when the pointers meet. This is the opposite-ends form of [two pointers](/roadmap/two-pointers) and needs no copy at all.

@walkthrough

## Why skipping is safe

Picture the cleaned string, the letters and digits only, in lower case. It is a palindrome when its first character equals its last, its second equals its second-to-last, and so on inwards. The two pointers produce exactly those pairs: skipping the punctuation from each end means the next pair compared is the next pair of letters or digits from the outside in. The invariant is that **every letter or digit outside the range from `left` to `right` has been matched with its mirror image**. It holds at the start, when nothing is outside the range; every step keeps it; and when the pointers meet, every pair has matched, so the string is a palindrome. A single mismatch settles the answer at once.

Each step moves at least one pointer inwards and neither ever moves back, so the loop runs at most n times: O(n) time and O(1) extra space.

### Dry run

The check on `"Don't nod."`, whose characters are at indexes 0 to 9:

| Step | left | s[left] | right | s[right] | Action |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | D | 9 | . | the full stop is skipped: right becomes 8 |
| 2 | 0 | D | 8 | d | 'd' equals 'd' in lower case: move both |
| 3 | 1 | o | 7 | o | equal: move both |
| 4 | 2 | n | 6 | n | equal: move both |
| 5 | 3 | ' | 5 | (space) | the apostrophe is skipped: left becomes 4 |
| 6 | 4 | t | 5 | (space) | the space is skipped: right becomes 4 |
| 7 | 4 | t | 4 | t | the pointers have met: a palindrome |

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

The same both-ends comparison drives [Valid Palindrome II](/problems/valid-palindrome-ii), where one deletion is allowed: at the first mismatch, try skipping either character and check the rest. [Longest Palindromic Substring](/problems/longest-palindromic-substring) turns it inside out and expands outwards from each of the 2n − 1 possible centres, which is O(n²).

## Building a new string: reversing the words

Many problems produce a new string, and this is where the builder rule pays off. [Reverse Words in a String](/problems/reverse-words-in-a-string) turns `"  the sky   is blue  "` into `"blue is sky the"`: words in reverse order, separated by single spaces, with no spaces at either end. The clean approach has three steps, each O(n):

- **Split** the string into words, treating any run of spaces as one separator. C++'s `>>` skips whitespace; Java's `s.trim().split("\\s+")` and JavaScript's `s.trim().split(/\s+/)` split on runs after trimming the ends; Python's `s.split()` with no argument does all of it.
- **Reverse** the list of words.
- **Join** them with single spaces, once: `StringBuilder` in Java, `join` in Python and JavaScript, `+=` on a mutable `std::string` in C++.

In C++, where strings are mutable, there is also an in-place version with O(1) extra space: reverse the whole string, then reverse each word back, then squeeze out the extra spaces with a write index. [Reverse Words in a String III](/problems/reverse-words-in-a-string-iii) is the second half of that on its own.

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

A few string operations look like one step and are not:

- **Substrings copy.** `substr`, `substring`, slicing and `slice` all create a new string, so treat each as O(k) for length k. A string of length n has n(n + 1)/2 substrings, and copying all of them costs O(n³). Keep start and end indexes instead, or use a C++17 `string_view`, which looks at part of a string without copying it.
- **Equality compares character by character.** Two strings of length n can take O(n) to compare. Strings of different lengths are rejected at once, which is why comparing the lengths first is a cheap shortcut in your own code too.
- **Ordering is by character codes.** Strings compare at the first position where they differ, and a prefix comes before any longer string that starts with it, so "app" < "apple". Because 'Z' is 90 and 'a' is 97, every capital letter sorts before every small one: "Zebra" < "apple".
- **Searching for a pattern** with `find`, `indexOf` or `in` takes up to O(n × m) for a text of length n and a pattern of length m in a simple implementation. Algorithms such as KMP guarantee O(n + m); they are on the [string matching](/challenges/string-matching) list.
- **Splitting and joining** build new strings: O(n) each, fine once, costly inside a loop.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Build a string of n characters | `result = result + c` with immutable strings | O(n²) | O(n) |
| Build a string of n characters | builder, or a list joined once | O(n) | O(n) |
| Anagram check | sort both strings and compare | O(n log n) | O(n) |
| Anagram check | 26-slot count | O(n) | O(1) |
| Palindrome check | cleaned, reversed copy | O(n) | O(n) |
| Palindrome check | two pointers from both ends | O(n) | O(1) |
| Reverse the words | split, reverse, join | O(n) | O(n) |

## How to recognise the pattern

Read the statement, and the constraints, for these signals:

- **"Anagram", "permutation of", "same characters", "can be formed from"**: counts, compared or subtracted.
- **"Lowercase English letters"** in the constraints: a 26-slot array will do instead of a hash map.
- **"Palindrome"**: two pointers from both ends, or expanding from each centre for the longest one.
- **"Substring" with a condition** (longest without repeats, smallest containing all of these): a [sliding window](/roadmap/sliding-window).
- **"Subsequence"**: two pointers across two strings, as in [Is Subsequence](/problems/is-subsequence), or [dynamic programming](/roadmap/dynamic-programming) for the longest common one.
- **"Common prefix"** of several strings: compare column by column, as in [Longest Common Prefix](/problems/longest-common-prefix); many prefix queries call for a [trie](/roadmap/trie).
- **The answer is a new string**: a builder, never repeated concatenation.

## Common mistakes

- **Concatenating in a loop.** `result += c` on an immutable string is O(n²). Use `StringBuilder`, or a list and one `join`.
- **Comparing Java strings with `==`.** It compares object identity. Use `equals`.
- **Forgetting to normalise.** "Racecar" is a palindrome only once case is ignored. Decide up front what to do with case, spaces and punctuation, and follow the statement.
- **Indexing a 26-slot array with a character that is not a small letter.** `'A' - 'a'` and `' ' - 'a'` are negative. Check the constraints, or use a 128-slot array or a map.
- **Mixing up substring arguments.** C++'s `substr(pos, len)` takes a length; Java's `substring`, Python's slice and JavaScript's `slice` take an exclusive end.
- **Character arithmetic surprises.** In Java `'a' + 1` is the int 98; cast with `(char)` to get 'b'. In C++, pass `(unsigned char) c` to `isalnum` and `tolower`, since a negative `char` is undefined behaviour.

## Practice in this order

Start with single-pass scans and counts, then move to the problems where the string is rebuilt or searched:

1. [Reverse String](/problems/reverse-string): swap from both ends, in place.
2. [Valid Anagram](/problems/valid-anagram): the 26-slot count from this lesson.
3. [Valid Palindrome](/problems/valid-palindrome): skip, lower-case, compare from both ends.
4. [Length of Last Word](/problems/length-of-last-word): scan from the end, skipping trailing spaces.
5. [Longest Common Prefix](/problems/longest-common-prefix): compare the strings column by column.
6. [Merge Strings Alternately](/problems/merge-strings-alternately): build a new string with a builder.
7. [Is Subsequence](/problems/is-subsequence): one pointer in each string.
8. [String Compression](/problems/string-compression): a read pointer and a write pointer, writing counts as digits.
9. [Longest Palindromic Substring](/problems/longest-palindromic-substring): expand around every centre.

The [string problem list](/challenges/strings) has every string problem in the catalogue, from easy to hard. When the first six feel routine, move on to the next stage of the roadmap: [Two Pointers](/roadmap/two-pointers).
