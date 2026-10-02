---
title: Longest Common Subsequence and Edit Distance
stage: dp-2d
order: 2
minutes: 20
level: Intermediate
hub: dynamic-programming
practice: is-subsequence, longest-common-subsequence, delete-operation-for-two-strings, uncrossed-lines, maximum-length-of-repeated-subarray, longest-palindromic-subsequence, edit-distance, minimum-ascii-delete-sum-for-two-strings, minimum-insertion-steps-to-make-a-string-palindrome
updated: 2026-10-03
seo-title: Longest Common Subsequence (LCS) and Edit Distance
description: Learn the longest common subsequence and edit distance: the 2D DP tables, rebuilding the answer, two-row space, with code in C++, Java, Python and JavaScript.
question: What is the longest common subsequence?
answer: The longest common subsequence (LCS) of two strings is the longest sequence of characters that appears in both in the same order, though not necessarily next to each other. Dynamic programming finds it with a table where dp[i][j] is the LCS length of the first i characters of one string and the first j of the other: matching characters extend the diagonal, otherwise take the larger neighbour. It runs in O(m × n) time.
q: What is the difference between longest common subsequence and longest common substring?
a: A common subsequence may skip characters in both strings, while a common substring must be a contiguous block of both. Their tables differ in one line: when the characters differ, the subsequence table keeps the larger of its upper and left neighbours, and the substring table resets the cell to 0, because a gap breaks the substring. The substring answer is the largest cell anywhere, not the last one.
q: What is edit distance?
a: Edit distance, also called Levenshtein distance, is the fewest single-character insertions, deletions and replacements that turn one string into another. "horse" becomes "ros" in three: replace h with r, delete r, delete e. Dynamic programming computes it with a table over prefixes of the two strings in O(m × n) time.
q: How are LCS and edit distance related?
a: Both fill a table over prefixes of the two strings and look at the same three neighbours of each cell. If replacement is not allowed, the fewest insertions and deletions that turn one string into the other is m + n − 2 × LCS: keep the common subsequence, delete every other character of the first string and insert every other character of the second.
q: How can I reduce the memory used by the LCS table?
a: Each row reads only itself and the row above, so two rows of length n + 1 are enough, and putting the shorter string along the row brings the space down to O(min(m, n)). The catch is that the full table is needed to walk back and rebuild the subsequence itself; Hirschberg's algorithm recovers it in linear space with a divide-and-conquer trick.
q: How is the longest palindromic subsequence related to LCS?
a: A palindrome reads the same forwards and backwards, so a palindromic subsequence of s is also a common subsequence of s and its reverse. The length of the longest palindromic subsequence equals the LCS length of s and reverse(s). The fewest insertions that make s a palindrome is then its length minus that number.
---
Version control shows what changed between two files. A spell checker suggests the word closest to what you typed. Biologists line up two DNA strands to see how related they are. All three need the same thing: a way to compare two sequences and say what they have in common and how far apart they are. The **longest common subsequence** (LCS) measures what two strings share, and **edit distance** measures how many single-character changes separate them. Both are solved by the same kind of table, and together they are the most common two-string questions in interviews.

This lesson fills the LCS table by hand, proves its rule correct, walks back through the table to recover the subsequence, then builds edit distance on the same frame and recovers the actual edits. It covers the longest common *substring*, the two-row space saving and the family of problems that are LCS in disguise. Every program is in C++, Java, Python and JavaScript.

## Why comparing all subsequences is too slow

A **subsequence** keeps the characters in their original order but may skip any of them: "BCBA" is a subsequence of "ABCBDAB" (positions 1, 2, 3 and 5). A **common subsequence** is a subsequence of both strings. The LCS of "ABCBDAB" and "BDCABA" has length 4; "BCBA" is one of them, "BDAB" another.

The brute force lists every subsequence of the first string and checks each against the second. A string of length m has 2ᵐ subsequences, and checking one takes O(n) with two pointers. For m = 1,000, the usual interview limit, 2ᵐ is a number with 302 digits. The work has to come from somewhere smarter: the same small questions, "what is the LCS of these two prefixes?", are what the brute force keeps re-asking.

## The idea: a table over two prefixes

Work on **prefixes**: the first i characters of string a and the first j characters of string b. There are only (m + 1) × (n + 1) pairs of prefixes, and each pair's answer can be built from smaller pairs by looking at their **last characters**.

- **State:** dp[i][j] is the length of the LCS of a[0..i) and b[0..j), the first i characters of a and the first j of b.
- **Transition:**
  - If a[i − 1] == b[j − 1], the last characters match: dp[i][j] = dp[i − 1][j − 1] + 1.
  - Otherwise at least one of them is not in the LCS: dp[i][j] = max(dp[i − 1][j], dp[i][j − 1]).
- **Base cases:** row 0 and column 0 are 0, since an empty prefix has nothing in common with anything.
- **Order:** row by row, left to right; each cell reads the cell above, the cell to its left and the diagonal, all filled earlier.
- **Answer:** dp[m][n], the bottom-right cell.

```text
                 j − 1            j
 i − 1   [ diagonal: match +1 ] [ up: drop a[i−1] ]
 i       [ left: drop b[j−1]  ] [ dp[i][j]          ]
```

The indices are shifted by one on purpose: dp[i][j] talks about prefixes of *length* i and j, so the characters it compares are a[i − 1] and b[j − 1]. That extra row and column of zeros means the transition never needs a special case for the first character.

## Why the recurrence is correct

There are two cases, and each needs a short argument.

**The last characters are equal.** Call the shared character c. Matching these two c's never hurts. Take any common subsequence Z of the two prefixes. If Z does not end by using both of these c's, drop Z's last character (if it has one) and append the pair of c's instead. Z's other characters were matched at earlier positions in both strings, so the result is still a common subsequence, and it is no shorter. So some LCS ends with this match, and the rest of it is a common subsequence of the two shorter prefixes, at best dp[i − 1][j − 1] long. Hence dp[i][j] = dp[i − 1][j − 1] + 1.

**The last characters differ.** An LCS cannot match a[i − 1] with b[j − 1], since they differ. So at least one of them is not the final match of the LCS, and dropping that character from its string loses nothing. The LCS is therefore the LCS of (a without its last character, b), or of (a, b without its last character), whichever is longer: max(dp[i − 1][j], dp[i][j − 1]).

Every case is covered and every option considered is real, so by induction over the table every cell is right.

### Dry run

a = "ABCBDAB" down the side, b = "BDCABA" across the top. Each row adds one character of a:

| i (a[i − 1]) | ∅ | B | D | C | A | B | A |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (∅) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 (A) | 0 | 0 | 0 | 0 | 1 | 1 | 1 |
| 2 (B) | 0 | 1 | 1 | 1 | 1 | 2 | 2 |
| 3 (C) | 0 | 1 | 1 | 2 | 2 | 2 | 2 |
| 4 (B) | 0 | 1 | 1 | 2 | 2 | 3 | 3 |
| 5 (D) | 0 | 1 | 2 | 2 | 2 | 3 | 3 |
| 6 (A) | 0 | 1 | 2 | 2 | 3 | 3 | 4 |
| 7 (B) | 0 | 1 | 2 | 2 | 3 | 4 | 4 |

Two cells worked out. Row 4, column 5 compares B with B: a match, so it is the diagonal 2 plus one, 3 ("BCB"). Row 5, column 4 compares D with A: no match, so it is the larger of the cell above (2) and the cell to the left (2), which is 2. The answer, bottom right, is 4.

### Rebuilding one LCS

The table holds lengths. To get the characters, walk back from the bottom-right cell, retracing the decision that produced each cell:

- If the characters match, that character is in the LCS: record it and move diagonally up-left.
- If not, move to whichever neighbour, up or left, holds the larger value (the one the cell copied). On a tie either is correct; this lesson moves up.
- Stop when either index reaches 0. The characters come out last first, so reverse them.

| Cell (i, j) | Compare | Move | LCS so far (backwards) |
| --- | --- | --- | --- |
| (7, 6) | B, A | up: 4 ≥ 4 | |
| (6, 6) | A, A | match | A |
| (5, 5) | D, B | up: 3 ≥ 2 | A |
| (4, 5) | B, B | match | AB |
| (3, 4) | C, A | left: 1 < 2 | AB |
| (3, 3) | C, C | match | ABC |
| (2, 2) | B, D | left: 0 < 1 | ABC |
| (2, 1) | B, B | match | ABCB |

Reversed: "BCBA". Breaking ties to the left would give "BDAB" instead, another LCS of the same length; an LCS is not unique, only its length is.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// dp[i][j] = length of the LCS of the first i characters of a and the first j of b.
vector<vector<int>> lcsTable(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));  // row 0, column 0: an empty prefix
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;  // match: extend the diagonal
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);           // drop one last character
        }
    }
    return dp;
}

// Walk back from the bottom-right cell to recover one LCS.
string lcsString(const string& a, const string& b, const vector<vector<int>>& dp) {
    string out;
    int i = a.size(), j = b.size();
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            out += a[i - 1];  // this character is in the LCS
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;  // the LCS survives without a[i - 1]
        } else {
            j--;  // the LCS survives without b[j - 1]
        }
    }
    reverse(out.begin(), out.end());  // collected last character first
    return out;
}

int main() {
    vector<pair<string, string>> pairs = {{"ABCBDAB", "BDCABA"}, {"AGGTAB", "GXTXAYB"}};
    for (const auto& p : pairs) {
        vector<vector<int>> dp = lcsTable(p.first, p.second);
        cout << p.first << " and " << p.second << ": length " << dp[p.first.size()][p.second.size()]
             << ", one LCS " << lcsString(p.first, p.second, dp) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // dp[i][j] = length of the LCS of the first i characters of a and the first j of b.
    static int[][] lcsTable(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];  // row 0, column 0: an empty prefix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;  // match: extend the diagonal
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);                   // drop one last character
            }
        }
        return dp;
    }

    // Walk back from the bottom-right cell to recover one LCS.
    static String lcsString(String a, String b, int[][] dp) {
        StringBuilder out = new StringBuilder();
        int i = a.length(), j = b.length();
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                out.append(a.charAt(i - 1));  // this character is in the LCS
                i--;
                j--;
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;  // the LCS survives without a[i - 1]
            } else {
                j--;  // the LCS survives without b[j - 1]
            }
        }
        return out.reverse().toString();  // collected last character first
    }

    public static void main(String[] args) {
        String[][] pairs = {{"ABCBDAB", "BDCABA"}, {"AGGTAB", "GXTXAYB"}};
        for (String[] p : pairs) {
            int[][] dp = lcsTable(p[0], p[1]);
            System.out.println(p[0] + " and " + p[1] + ": length " + dp[p[0].length()][p[1].length()]
                    + ", one LCS " + lcsString(p[0], p[1], dp));
        }
    }
}
```

```python
def lcs_table(a, b):
    """dp[i][j] = length of the LCS of the first i characters of a and the first j of b."""
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]  # row 0, column 0: an empty prefix
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1          # match: extend the diagonal
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # drop one last character
    return dp


def lcs_string(a, b, dp):
    """Walk back from the bottom-right cell to recover one LCS."""
    out = []
    i, j = len(a), len(b)
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1])  # this character is in the LCS
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1  # the LCS survives without a[i - 1]
        else:
            j -= 1  # the LCS survives without b[j - 1]
    return "".join(reversed(out))  # collected last character first


for a, b in [("ABCBDAB", "BDCABA"), ("AGGTAB", "GXTXAYB")]:
    dp = lcs_table(a, b)
    print(f"{a} and {b}: length {dp[len(a)][len(b)]}, one LCS {lcs_string(a, b, dp)}")
```

```javascript
// dp[i][j] = length of the LCS of the first i characters of a and the first j of b.
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0)); // row 0, column 0: an empty prefix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1; // match: extend the diagonal
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // drop one last character
    }
  }
  return dp;
}

// Walk back from the bottom-right cell to recover one LCS.
function lcsString(a, b, dp) {
  const out = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push(a[i - 1]); // this character is in the LCS
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--; // the LCS survives without a[i - 1]
    } else {
      j--; // the LCS survives without b[j - 1]
    }
  }
  return out.reverse().join(""); // collected last character first
}

for (const [a, b] of [
  ["ABCBDAB", "BDCABA"],
  ["AGGTAB", "GXTXAYB"],
]) {
  const dp = lcsTable(a, b);
  console.log(`${a} and ${b}: length ${dp[a.length][b.length]}, one LCS ${lcsString(a, b, dp)}`);
}
```

```output
ABCBDAB and BDCABA: length 4, one LCS BCBA
AGGTAB and GXTXAYB: length 4, one LCS GTAB
```

## Edit distance

**Edit distance**, or **Levenshtein distance**, is the fewest single-character operations that turn string a into string b, where an operation is one of:

- **insert** a character,
- **delete** a character,
- **replace** a character with another.

"horse" becomes "ros" in three: replace h with r (rorse), delete r (rose), delete e (ros). No two operations can do it, so the distance is 3. The table has the same shape as the LCS table:

- **State:** dp[i][j] is the fewest operations that turn a[0..i) into b[0..j).
- **Base cases:** dp[i][0] = i, since turning i characters into nothing takes i deletions, and dp[0][j] = j, since building j characters from nothing takes j insertions. Unlike the LCS table, row 0 and column 0 are not zeros.
- **Transition:** if a[i − 1] == b[j − 1], the last characters already agree and cost nothing: dp[i][j] = dp[i − 1][j − 1]. Otherwise dp[i][j] = 1 + the smallest of:
  - dp[i − 1][j − 1]: **replace** a[i − 1] with b[j − 1], then fix the shorter prefixes;
  - dp[i − 1][j]: **delete** a[i − 1], then turn the rest of a into all of b;
  - dp[i][j − 1]: turn all of a into b without its last character, then **insert** b[j − 1].
- **Answer:** dp[m][n].

### Why those three cases are all of them

Write the two strings one above the other, with gaps, so that every operation is one column: a character over the same character is a match, over a different character a replacement, over a gap a deletion, and a gap over a character an insertion. The cost of an edit sequence is the number of columns that are not matches. Now look at the **last column** of the cheapest alignment. It is either a[i − 1] over b[j − 1] (a match or a replacement), a[i − 1] over a gap (a deletion), or a gap over b[j − 1] (an insertion). The columns before it are an alignment of the shorter prefixes, and they must be the cheapest one, or the whole would not be cheapest. Those three possibilities are exactly the three neighbours the transition reads.

Taking the free diagonal whenever the characters match is safe for a similar reason: neighbouring cells of this table never differ by more than 1, so dp[i − 1][j − 1] is never worse than 1 + dp[i − 1][j] or 1 + dp[i][j − 1].

### Dry run

a = "horse" down the side, b = "ros" across the top:

| i (a[i − 1]) | ∅ | r | o | s |
| --- | --- | --- | --- | --- |
| 0 (∅) | 0 | 1 | 2 | 3 |
| 1 (h) | 1 | 1 | 2 | 3 |
| 2 (o) | 2 | 2 | 1 | 2 |
| 3 (r) | 3 | 2 | 2 | 2 |
| 4 (s) | 4 | 3 | 3 | 2 |
| 5 (e) | 5 | 4 | 4 | 3 |

- Row 1, column 1: h against r differ, so 1 + min(replace 0, delete 1, insert 1) = 1.
- Row 2, column 2: o against o match, so copy the diagonal: 1.
- Row 3, column 2: r against o differ, so 1 + min(replace 2, delete 1, insert 2) = 2. The best move is deleting the r.
- Row 5, column 3: e against s differ, so 1 + min(replace 3, delete 2, insert 4) = 3.

The answer is 3. Walking back exactly as for the LCS, choosing at each cell an option that produced its value, recovers the edits: at (5, 3) a deletion of e, at (4, 3) a free match of s, at (3, 2) a deletion of r, at (2, 2) a free match of o, at (1, 1) a replacement of h with r. Read forwards, that is the three-step answer above.

### The code

The program prints the distance and then each edit with the string it produces. After walking back to cell (i, j), the text is the first j characters of b followed by the unprocessed tail of a, which is how each intermediate string is printed without simulating anything.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// dp[i][j] = fewest edits that turn the first i characters of a into the first j of b.
vector<vector<int>> editTable(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 0; i <= m; i++) dp[i][0] = i;  // delete all i characters
    for (int j = 0; j <= n; j++) dp[0][j] = j;  // insert all j characters
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1];  // last characters agree: free
            else dp[i][j] = 1 + min({dp[i - 1][j - 1],              // replace
                                     dp[i - 1][j],                  // delete a[i - 1]
                                     dp[i][j - 1]});                // insert b[j - 1]
        }
    }
    return dp;
}

void showEdits(const string& a, const string& b) {
    vector<vector<int>> dp = editTable(a, b);
    vector<string> steps;  // collected backwards, last edit first
    int i = a.size(), j = b.size();
    while (i > 0 || j > 0) {
        string now = b.substr(0, j) + a.substr(i);  // the text once this cell's edit is done
        if (i > 0 && j > 0 && a[i - 1] == b[j - 1]) {
            i--; j--;  // a match: no edit
        } else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) {
            steps.push_back("replace " + string(1, a[i - 1]) + " with " + string(1, b[j - 1]) + ": " + now);
            i--; j--;
        } else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) {
            steps.push_back("delete " + string(1, a[i - 1]) + ": " + now);
            i--;
        } else {
            steps.push_back("insert " + string(1, b[j - 1]) + ": " + now);
            j--;
        }
    }
    cout << a << " -> " << b << ": " << dp[a.size()][b.size()] << " edits\n";
    for (int k = (int)steps.size() - 1; k >= 0; k--) cout << "  " << steps[k] << "\n";
}

int main() {
    showEdits("horse", "ros");
    showEdits("kitten", "sitting");
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // dp[i][j] = fewest edits that turn the first i characters of a into the first j of b.
    static int[][] editTable(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;  // delete all i characters
        for (int j = 0; j <= n; j++) dp[0][j] = j;  // insert all j characters
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];  // last characters agree: free
                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],                      // replace
                        Math.min(dp[i - 1][j],                                     // delete a[i - 1]
                                 dp[i][j - 1]));                                   // insert b[j - 1]
            }
        }
        return dp;
    }

    static void showEdits(String a, String b) {
        int[][] dp = editTable(a, b);
        List<String> steps = new ArrayList<>();  // collected backwards, last edit first
        int i = a.length(), j = b.length();
        while (i > 0 || j > 0) {
            String now = b.substring(0, j) + a.substring(i);  // the text once this cell's edit is done
            if (i > 0 && j > 0 && a.charAt(i - 1) == b.charAt(j - 1)) {
                i--; j--;  // a match: no edit
            } else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) {
                steps.add("replace " + a.charAt(i - 1) + " with " + b.charAt(j - 1) + ": " + now);
                i--; j--;
            } else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) {
                steps.add("delete " + a.charAt(i - 1) + ": " + now);
                i--;
            } else {
                steps.add("insert " + b.charAt(j - 1) + ": " + now);
                j--;
            }
        }
        System.out.println(a + " -> " + b + ": " + dp[a.length()][b.length()] + " edits");
        for (int k = steps.size() - 1; k >= 0; k--) System.out.println("  " + steps.get(k));
    }

    public static void main(String[] args) {
        showEdits("horse", "ros");
        showEdits("kitten", "sitting");
    }
}
```

```python
def edit_table(a, b):
    """dp[i][j] = fewest edits that turn the first i characters of a into the first j of b."""
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i  # delete all i characters
    for j in range(n + 1):
        dp[0][j] = j  # insert all j characters
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]  # last characters agree: free
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1],  # replace
                                   dp[i - 1][j],      # delete a[i - 1]
                                   dp[i][j - 1])      # insert b[j - 1]
    return dp


def show_edits(a, b):
    dp = edit_table(a, b)
    steps = []  # collected backwards, last edit first
    i, j = len(a), len(b)
    while i > 0 or j > 0:
        now = b[:j] + a[i:]  # the text once this cell's edit is done
        if i > 0 and j > 0 and a[i - 1] == b[j - 1]:
            i, j = i - 1, j - 1  # a match: no edit
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            steps.append(f"replace {a[i - 1]} with {b[j - 1]}: {now}")
            i, j = i - 1, j - 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            steps.append(f"delete {a[i - 1]}: {now}")
            i -= 1
        else:
            steps.append(f"insert {b[j - 1]}: {now}")
            j -= 1
    print(f"{a} -> {b}: {dp[len(a)][len(b)]} edits")
    for step in reversed(steps):
        print("  " + step)


show_edits("horse", "ros")
show_edits("kitten", "sitting")
```

```javascript
// dp[i][j] = fewest edits that turn the first i characters of a into the first j of b.
function editTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i; // delete all i characters
  for (let j = 0; j <= n; j++) dp[0][j] = j; // insert all j characters
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]; // last characters agree: free
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]); // replace, delete, insert
    }
  }
  return dp;
}

function showEdits(a, b) {
  const dp = editTable(a, b);
  const steps = []; // collected backwards, last edit first
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    const now = b.slice(0, j) + a.slice(i); // the text once this cell's edit is done
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      i--; // a match: no edit
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      steps.push(`replace ${a[i - 1]} with ${b[j - 1]}: ${now}`);
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      steps.push(`delete ${a[i - 1]}: ${now}`);
      i--;
    } else {
      steps.push(`insert ${b[j - 1]}: ${now}`);
      j--;
    }
  }
  console.log(`${a} -> ${b}: ${dp[a.length][b.length]} edits`);
  for (let k = steps.length - 1; k >= 0; k--) console.log(`  ${steps[k]}`);
}

showEdits("horse", "ros");
showEdits("kitten", "sitting");
```

```output
horse -> ros: 3 edits
  replace h with r: rorse
  delete r: rose
  delete e: ros
kitten -> sitting: 3 edits
  replace k with s: sitten
  replace e with i: sittin
  insert g: sitting
```

## Longest common substring: one line changes

A **substring** is contiguous: no gaps. The longest common substring of "XABCY" and "ZABCW" is "ABC". The table looks almost the same, but the state changes in a way that matters:

- **State:** dp[i][j] is the length of the longest common substring that **ends exactly** at a[i − 1] and b[j − 1]; in other words, the longest common suffix of the two prefixes.
- **Transition:** if the characters match, dp[i][j] = dp[i − 1][j − 1] + 1. If they differ, dp[i][j] = **0**.
- **Answer:** the **largest cell anywhere** in the table, not the bottom-right one.

```text
         Z  A  B  C  W
     X   0  0  0  0  0
     A   0  1  0  0  0
     B   0  0  2  0  0
     C   0  0  0  3  0          longest common substring: 3, "ABC"
     Y   0  0  0  0  0
```

The reason for the reset is the definition. A substring that ends at these two positions must include both of these characters, so a mismatch means no common substring ends here at all. The LCS table is allowed to inherit max(up, left) because a subsequence may skip a character; a substring may not. Matches show up as runs along diagonals. [Maximum Length of Repeated Subarray](/problems/maximum-length-of-repeated-subarray) is exactly this problem on two integer arrays.

## Two rows are enough

Every cell of the LCS and edit distance tables reads only the row above and the cell to its left. So the table can be replaced by two rows, `prev` and `cur`, swapped after each row:

```text
prev = [0] * (n + 1)                  # row i − 1
for i in 1..m:
    cur = [0] * (n + 1)               # for edit distance: cur[0] = i
    for j in 1..n:
        if a[i-1] == b[j-1]: cur[j] = prev[j-1] + 1
        else:                cur[j] = max(prev[j], cur[j-1])
    prev = cur
answer = prev[n]
```

That is O(n) space, and if you make the shorter string the one along the row, O(min(m, n)). A single row also works if you save the diagonal value in a variable before overwriting it. The price is that the walk back needs the full table, so this saving is for when only the length or the distance is wanted. When the subsequence itself is needed in linear space, Hirschberg's algorithm combines this two-row pass with divide and conquer. The same row-saving idea is what shrinks the [0/1 knapsack](/roadmap/knapsack-problem) table to one row.

## Problems that are LCS in disguise

- **Fewest deletions to make two strings equal.** Keep the LCS and delete everything else from both: m + n − 2 × LCS. This is [Delete Operation for Two Strings](/problems/delete-operation-for-two-strings), and it is also edit distance without the replace operation. [Minimum ASCII Delete Sum for Two Strings](/problems/minimum-ascii-delete-sum-for-two-strings) weights each deleted character by its character code, so the table minimises a cost instead of maximising a length.
- **Shortest common supersequence.** The shortest string that has both a and b as subsequences writes each LCS character once and every other character of both strings once: length m + n − LCS. For "ABCBDAB" and "BDCABA" that is 7 + 6 − 4 = 9.
- **Longest palindromic subsequence.** A palindromic subsequence of s reads the same backwards, so it is a common subsequence of s and reverse(s), and the LPS length equals that LCS length. See [Longest Palindromic Subsequence](/problems/longest-palindromic-subsequence). The fewest insertions that make s a palindrome is then n minus the LPS length: [Minimum Insertion Steps to Make a String Palindrome](/problems/minimum-insertion-steps-to-make-a-string-palindrome).
- **LCS on numbers.** [Uncrossed Lines](/problems/uncrossed-lines) draws lines between equal numbers of two arrays without crossings; lines that do not cross are a common subsequence, so it is the LCS table unchanged.
- **Counting instead of maximising.** [Distinct Subsequences](/problems/distinct-subsequences) counts the ways b appears as a subsequence of a, adding the diagonal on a match instead of taking a maximum.
- **Is one string inside the other?** [Is Subsequence](/problems/is-subsequence) is LCS(s, t) = len(s), but [two pointers](/roadmap/two-pointers) answer it in O(m + n) without a table.
- **Prefix tables with other rules.** Interleaving two strings, wildcard matching and [Regular Expression Matching](/problems/regular-expression-matching) all fill a table over prefixes of two strings; only the transition changes.

The [longest increasing subsequence](/roadmap/longest-increasing-subsequence) is related too: the strictly increasing LIS of an array equals the LCS of that array with its sorted, de-duplicated copy.

## Time and space complexity

| Problem | Time | Space, full table | Space, two rows |
| --- | --- | --- | --- |
| LCS by trying every subsequence | O(2ᵐ × n) | O(m) | — |
| Longest common subsequence | O(m × n) | O(m × n) | O(min(m, n)) |
| Edit distance | O(m × n) | O(m × n) | O(min(m, n)) |
| Longest common substring | O(m × n) | O(m × n) | O(min(m, n)) |
| Rebuilding the LCS or the edits | O(m + n) extra | needs the full table | — |

Each cell does constant work, so the tables cost m × n steps. With two strings of 1,000 characters that is a million cells, fast in any language. With 10⁵ characters each it is 10¹⁰ cells, too slow, and the full table of 4-byte integers would need 40 GB, which is why big inputs need either the two-row version or a different algorithm.

## How to recognise a two-string DP

- The input is **two strings or two arrays**, and the question is about what they share or how to turn one into the other.
- The words **subsequence**, **common**, **convert**, **transform**, **minimum operations**, **insert, delete or replace**, **align**.
- A single string compared with its own **reverse**: palindromic subsequences.
- The answer for two strings can be built from the answers for the same strings with **the last character removed** from one or both.
- Lengths up to a few thousand each, small enough that m × n cells fit in time and memory.

If the question is about a **contiguous** match, it is the substring version, with the reset to 0. If only one string is involved and the question is about its own pieces, an interval DP over i and j within that string may fit better.

## Common mistakes

- **Mixing up the indices.** dp[i][j] describes prefixes of length i and j, so it compares a[i − 1] and b[j − 1]. Comparing a[i] and b[j] skips the first characters and reads past the end.
- **Zero borders in edit distance.** The first row and column are 0, 1, 2, 3, …, not zeros: an empty string is that many edits away from a prefix.
- **Using max(up, left) + 1 on a match.** It looks harmless but counts a character twice: for "AA" and "A" it gives 2. A match extends the **diagonal** only.
- **Using the subsequence rule for a substring.** Inheriting max(up, left) after a mismatch lets gaps in; the substring table must reset to 0, and its answer is the largest cell anywhere.
- **Walking back through a two-row table.** The rows needed for the walk back have been overwritten; keep the full table when the subsequence or the edits are wanted.
- **Expecting a unique answer.** Several subsequences can share the longest length, and different tie-breaks in the walk back return different ones. Judges that accept any valid answer are fine; be careful when comparing outputs by hand.

## Practice in this order

1. [Is Subsequence](/problems/is-subsequence): the one-string check, with two pointers or with the table.
2. [Longest Common Subsequence](/problems/longest-common-subsequence): the table from this lesson.
3. [Delete Operation for Two Strings](/problems/delete-operation-for-two-strings): m + n − 2 × LCS.
4. [Uncrossed Lines](/problems/uncrossed-lines): the same table on integer arrays.
5. [Maximum Length of Repeated Subarray](/problems/maximum-length-of-repeated-subarray): the substring version with the reset to 0.
6. [Longest Palindromic Subsequence](/problems/longest-palindromic-subsequence): LCS with the reversed string.
7. [Edit Distance](/problems/edit-distance): three operations, borders of 0, 1, 2, …
8. [Minimum ASCII Delete Sum for Two Strings](/problems/minimum-ascii-delete-sum-for-two-strings): a weighted cost in the same table.
9. [Minimum Insertion Steps to Make a String Palindrome](/problems/minimum-insertion-steps-to-make-a-string-palindrome): length minus the longest palindromic subsequence.

The [dynamic programming problem list](/challenges/dynamic-programming) has every DP problem in the catalogue. The rest of this stage of the road applies the same prefix-table thinking to grids and palindromes.
