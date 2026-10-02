---
title: Longest Common Subsequence and Edit Distance
stage: dp-2d
order: 2
minutes: 13
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
Version control shows what changed between two files, a spell checker suggests the closest word, and biologists line up DNA strands: all three compare two sequences. The **longest common subsequence** (LCS) measures what two strings share, and **edit distance** measures how many single-character changes separate them. Both are solved by the same kind of table, and together they are the most common two-string questions in interviews.

## Why comparing all subsequences is too slow

A **subsequence** keeps the characters in their original order but may skip any of them, and a **common subsequence** is a subsequence of both strings. Drawn as lines between equal letters, the idea is easy to see:

@figure lines

The brute force lists every subsequence of the first string and checks each against the second. A string of length m has 2ᵐ subsequences: for m = 1,000, the usual interview limit, that is a number with 302 digits. A plain recursion over the last letters is no better, because it asks the same small questions again and again:

@figure repeats

## The idea: a table over two prefixes

Work on **prefixes**, the first i characters of a and the first j of b: only (m + 1) × (n + 1) pairs, each built from smaller pairs by looking at their **last characters**.

- **State:** dp[i][j] is the LCS length of a[0..i) and b[0..j).
- **Transition:** if a[i − 1] == b[j − 1], dp[i][j] = dp[i − 1][j − 1] + 1; otherwise dp[i][j] = max(dp[i − 1][j], dp[i][j − 1]).
- **Base cases:** row 0 and column 0 are 0: an empty prefix shares nothing.
- **Answer:** dp[m][n], the bottom-right cell.

The indices are shifted by one on purpose: dp[i][j] is about prefixes of *length* i and j, so it compares a[i − 1] and b[j − 1].

@figure lcs-table

## Why the recurrence is correct

There are two cases, and each needs a short argument. When the last letters are equal, matching them never hurts. When they differ, they cannot both be in the LCS, so one can be dropped:

@figure why-last

Every case is covered and every option the transition considers is a real common subsequence, so by induction over the table every cell is right. Note that a match extends the **diagonal** only: max(up, left) + 1 would count a letter twice.

### The code

The function returns one LCS, rebuilt by the walk back in the animation.

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

**Edit distance**, or **Levenshtein distance**, is the fewest single-character operations that turn string a into string b, where an operation is to **insert**, **delete** or **replace** one character. "horse" becomes "ros" in three: replace h with r, delete r, delete e. The table has the same shape as the LCS table:

- **State:** dp[i][j] is the fewest operations that turn a[0..i) into b[0..j).
- **Base cases:** dp[i][0] = i deletions and dp[0][j] = j insertions. Unlike the LCS table, the borders are not zeros.
- **Transition:** if a[i − 1] == b[j − 1], the cell copies the diagonal for free; otherwise it is 1 + the smallest of the diagonal (replace), the cell above (delete a[i − 1]) and the cell to the left (insert b[j − 1]).

@figure edit-table

### Why those three cases are all of them

Write the strings one above the other with gaps, so that every operation is one column. The cheapest alignment's last column can only be one of three kinds, and each kind is one neighbour:

@figure alignment

Taking the free diagonal whenever the letters match is safe too: neighbouring cells of this table never differ by more than 1, so dp[i − 1][j − 1] is never worse than 1 + dp[i − 1][j] or 1 + dp[i][j − 1].

### The code

The program prints the distance and each edit with the string it produces: after walking back to cell (i, j), the text is the first j letters of b followed by the unprocessed tail of a.

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

A **substring** is contiguous: no gaps. Its table changes one rule and the place of the answer:

@figure substring

A substring ending at these two positions must include both letters, so a mismatch means no common substring ends there at all; a subsequence may skip a letter, which is why the LCS table may inherit max(up, left). [Maximum Length of Repeated Subarray](/problems/maximum-length-of-repeated-subarray) is exactly this problem on two integer arrays.

## Two rows are enough

Every cell reads only the row above and the cell to its left, so two rows, `prev` and `cur`, can replace the table:

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

With the shorter string along the row that is O(min(m, n)) space. The price is the walk back, which needs the full table; Hirschberg's algorithm recovers the subsequence in linear space with divide and conquer. The same idea shrinks the [0/1 knapsack](/roadmap/knapsack-problem) table to one row.

## Problems that are LCS in disguise

- **Fewest deletions to make two strings equal.** Keep the LCS and delete the rest: m + n − 2 × LCS, as in [Delete Operation for Two Strings](/problems/delete-operation-for-two-strings); [Minimum ASCII Delete Sum for Two Strings](/problems/minimum-ascii-delete-sum-for-two-strings) weights each letter by its code.
- **Shortest common supersequence.** Write each LCS letter once and every other letter of both strings once: m + n − LCS.
- **Longest palindromic subsequence.** The LCS of s and reverse(s): [Longest Palindromic Subsequence](/problems/longest-palindromic-subsequence). n minus it is the fewest insertions that make s a palindrome.
- **LCS on numbers.** [Uncrossed Lines](/problems/uncrossed-lines) is the first figure of this lesson, literally: the LCS table unchanged.
- **Counting instead of maximising.** [Distinct Subsequences](/problems/distinct-subsequences) adds the diagonal on a match instead of taking a maximum.
- **Is one string inside the other?** [Is Subsequence](/problems/is-subsequence) is LCS(s, t) = len(s), but [two pointers](/roadmap/two-pointers) answer it in O(m + n) without a table.

[Regular Expression Matching](/problems/regular-expression-matching) and wildcard matching fill the same prefix table with other rules, and the [longest increasing subsequence](/roadmap/longest-increasing-subsequence) is the LCS of an array with its sorted, de-duplicated copy.

## Time and space complexity

| Problem | Time | Space, full table | Space, two rows |
| --- | --- | --- | --- |
| LCS by trying every subsequence | O(2ᵐ × n) | O(m) | — |
| Longest common subsequence | O(m × n) | O(m × n) | O(min(m, n)) |
| Edit distance | O(m × n) | O(m × n) | O(min(m, n)) |
| Longest common substring | O(m × n) | O(m × n) | O(min(m, n)) |

Two strings of 1,000 characters make a million cells, fast in any language; two of 10⁵ make 10¹⁰, too slow, and a full table of 4-byte integers would need 40 GB.

## How to recognise a two-string DP

- The input is **two strings or two arrays**, and the question is what they share or how to turn one into the other.
- The words **subsequence**, **common**, **convert**, **minimum operations**, **insert, delete or replace**, **align**.
- A single string compared with its own **reverse**: palindromic subsequences.
- Lengths up to a few thousand each, small enough for m × n cells.

## Common mistakes

- **Mixing up the indices.** dp[i][j] compares a[i − 1] and b[j − 1]; comparing a[i] and b[j] skips the first letters and reads past the end.
- **Zero borders in edit distance.** The first row and column are 0, 1, 2, 3, …
- **max(up, left) + 1 on a match.** It counts a letter twice: for "AA" and "A" it gives 2.
- **The subsequence rule for a substring.** The substring table must reset to 0, and its answer is the largest cell anywhere.
- **Walking back through a two-row table.** The rows it needs are gone; keep the full table when the letters or the edits are wanted.

## Practice in this order

1. [Is Subsequence](/problems/is-subsequence): one string inside another, with two pointers or the table.
2. [Longest Common Subsequence](/problems/longest-common-subsequence): the table from this lesson.
3. [Delete Operation for Two Strings](/problems/delete-operation-for-two-strings): m + n − 2 × LCS.
4. [Uncrossed Lines](/problems/uncrossed-lines): the same table on integer arrays.
5. [Maximum Length of Repeated Subarray](/problems/maximum-length-of-repeated-subarray): the substring version.
6. [Longest Palindromic Subsequence](/problems/longest-palindromic-subsequence): LCS with the reversed string.
7. [Edit Distance](/problems/edit-distance): three operations, borders of 0, 1, 2, …
8. [Minimum ASCII Delete Sum for Two Strings](/problems/minimum-ascii-delete-sum-for-two-strings): a weighted cost in the same table.
9. [Minimum Insertion Steps to Make a String Palindrome](/problems/minimum-insertion-steps-to-make-a-string-palindrome): length minus the longest palindromic subsequence.

The [dynamic programming problem list](/challenges/dynamic-programming) has every DP problem in the catalogue. The rest of this stage of the road applies the same prefix-table thinking to grids and palindromes.
