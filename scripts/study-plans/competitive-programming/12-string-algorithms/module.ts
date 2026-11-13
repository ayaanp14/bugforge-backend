import { defineModule } from "../../dsl.js";
import { BORDER_CASES, DISTINCT_CASES, OCCURRENCE_CASES } from "./cases.js";

export default defineModule(import.meta.url, {
  slug: "string-algorithms",
  title: "String algorithms: KMP, Z and hashing",
  blurb: "Linear-time matching with the KMP prefix function and the Z-function, borders and periods, and O(1) substring comparison with a double rolling hash.",
  icon: "text",
  overview: `Trying every start of a pattern in a text costs O(n · m), which is billions of steps at contest sizes. The algorithms in this module never re-read a character they already understand.

The **prefix function** records, for every prefix of a string, its longest border — a prefix that is also a suffix — and the **KMP** search uses it to fall back without moving backwards in the text. The **Z-function** records how far each position matches the string's own prefix, reusing a box of known matches; on \`pattern + '#' + text\` it finds every occurrence too. A **rolling hash** turns any substring into a number in O(1), so equality, distinctness and "longest repeated" questions become sorting and comparing — with two moduli so that collisions do not decide the answer.

The exercises are every occurrence of a pattern with KMP and the number of distinct substrings of a given length with a double hash. The timed checkpoint finds a string's longest border, smallest period and repeat count.`,
  lessons: [
    {
      slug: "kmp-z-function-and-hashing",
      file: "01-kmp-z-function-and-hashing.md",
      exercises: [
        {
          title: "Every occurrence of a pattern",
          prompt: `Read a text \`t\` and a pattern \`p\` (lowercase letters, one per line). Print the number of positions where \`p\` occurs in \`t\` — overlapping occurrences count — and, if there is at least one, a second line with the 1-based start positions in increasing order.

Use **KMP**: build the prefix function of \`p\`, then scan \`t\` once. O(|t| + |p|).

**Constraints:** \`1 ≤ |t|, |p| ≤ 10^6\` (the pattern may be longer than the text).
**Output:** the count, then the positions (no second line when the count is 0).

\`\`\`text
abababcabab
abab
\`\`\`
prints
\`\`\`text
3
1 3 8
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<int> prefixFunction(const string& s) {
    vector<int> pi(s.size(), 0);
    // TODO: for each i, extend the previous border or fall back through pi
    return pi;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string t, p;
    cin >> t >> p;
    // TODO: scan t keeping j = characters of p matched; at j == |p| record i - |p| + 2
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<int> prefixFunction(const string& s) {
    vector<int> pi(s.size(), 0);
    for (size_t i = 1; i < s.size(); ++i) {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j]) j = pi[j - 1];
        if (s[i] == s[j]) ++j;
        pi[i] = j;
    }
    return pi;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string t, p;
    cin >> t >> p;
    const int n = static_cast<int>(t.size()), m = static_cast<int>(p.size());
    vector<int> pi = prefixFunction(p), found;
    int j = 0;
    for (int i = 0; i < n; ++i) {
        while (j > 0 && t[i] != p[j]) j = pi[j - 1];
        if (t[i] == p[j]) ++j;
        if (j == m) {
            found.push_back(i - m + 2);   // 1-based start
            j = pi[m - 1];                // keep the border: occurrences may overlap
        }
    }
    cout << found.size() << '\n';
    for (size_t k = 0; k < found.size(); ++k) cout << found[k] << (k + 1 == found.size() ? '\n' : ' ');
    return 0;
}
`,
          hints: [
            "pi[i] is the longest proper border of p[0..i]. Build it by trying j = pi[i − 1], falling back j = pi[j − 1] while the next characters differ.",
            "The search is the same loop over t: j counts matched pattern characters, a mismatch falls back through pi, the text index never decreases.",
            "After a full match set j = pi[m − 1], not 0 — that keeps overlapping occurrences such as \"aaa\" in \"aaaa\". A pattern longer than the text simply never reaches j == m.",
          ],
          cases: OCCURRENCE_CASES,
        },
        {
          title: "Distinct substrings of each length",
          prompt: `Read a string \`s\` of lowercase letters, then \`q\` lengths. For each length \`L\`, print how many **distinct** substrings of length \`L\` the string has.

Hash every window of length \`L\` in O(1) with a **double rolling hash** (two moduli, fixed bases), sort the hashes and count the distinct ones: O(n log n) per query.

**Constraints:** \`1 ≤ |s| ≤ 2 × 10^5\`, \`1 ≤ q ≤ 10\`, \`1 ≤ L ≤ |s|\`.
**Input:** \`s\`, then \`q\`, then the \`q\` lengths.
**Output:** one count per line.

\`\`\`text
abab
4
1 2 3 4
\`\`\`
prints \`2\`, \`2\`, \`2\`, \`1\` — {a, b}, {ab, ba}, {aba, bab}, {abab}.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll M1 = 1'000'000'007, M2 = 1'000'000'009, B1 = 131, B2 = 137;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    int q;
    cin >> s >> q;
    const int n = static_cast<int>(s.size());
    // TODO: prefix hashes h1, h2 (size n + 1) and powers p1, p2
    // TODO: for each L: hash every window [i, i + L), combine the two halves into one 64-bit key,
    //       sort, count distinct keys
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll M1 = 1'000'000'007, M2 = 1'000'000'009, B1 = 131, B2 = 137;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    int q;
    cin >> s >> q;
    const int n = static_cast<int>(s.size());
    vector<ll> h1(n + 1, 0), h2(n + 1, 0), p1(n + 1, 1), p2(n + 1, 1);
    for (int i = 0; i < n; ++i) {
        ll c = s[i] - 'a' + 1;
        h1[i + 1] = (h1[i] * B1 + c) % M1;
        h2[i + 1] = (h2[i] * B2 + c) % M2;
        p1[i + 1] = p1[i] * B1 % M1;
        p2[i + 1] = p2[i] * B2 % M2;
    }
    auto get = [&](const vector<ll>& h, const vector<ll>& p, ll mod, int l, int r) {
        return ((h[r] - h[l] * p[r - l]) % mod + mod) % mod;
    };
    while (q--) {
        int L;
        cin >> L;
        vector<unsigned long long> keys;
        keys.reserve(n - L + 1);
        for (int i = 0; i + L <= n; ++i) {
            unsigned long long a = static_cast<unsigned long long>(get(h1, p1, M1, i, i + L));
            unsigned long long b = static_cast<unsigned long long>(get(h2, p2, M2, i, i + L));
            keys.push_back(a << 32 | b);   // both halves are below 2^30
        }
        sort(keys.begin(), keys.end());
        cout << unique(keys.begin(), keys.end()) - keys.begin() << '\n';
    }
    return 0;
}
`,
          hints: [
            "Map letters to 1..26, not 0..25: with 'a' = 0, \"a\" and \"aa\" would hash alike under a prefix scheme.",
            "hash(l, r) = h[r] − h[l] · B^(r − l), reduced mod p and made non-negative. Every product stays below 10^9 · 10^9 < 9.2 × 10^18, so long long is enough.",
            "Pack the two hashes into one unsigned 64-bit key (a << 32 | b): sorting and unique then work on plain integers.",
          ],
          cases: DISTINCT_CASES,
        },
      ],
      quiz: [
        {
          prompt: "What is the prefix function of `aabaaab`?",
          options: ["`0 1 0 1 2 2 3`", "`0 1 0 1 2 3 3`", "`0 0 1 0 1 2 3`", "`1 2 0 1 2 2 3`"],
          answer: 0,
          explanation: "a → 0; aa → 1 (\"a\"); aab → 0; aaba → 1; aabaa → 2 (\"aa\"); aabaaa → 2 (\"aa\": \"aab\" ≠ \"aaa\"); aabaaab → 3 (\"aab\").",
        },
        {
          prompt: "In KMP, why does the text index never move backwards?",
          options: [
            "On a mismatch the pattern is shifted by falling back to a border, and the border's characters are already known to match the text",
            "Because the pattern is reversed first",
            "Because every mismatch restarts the pattern at index 0",
            "It does move back, by pi[j] characters",
          ],
          answer: 0,
          explanation: "The last j text characters equal p[0..j); its longest border p[0..pi[j−1]) therefore also matches the text's last characters, so matching resumes from there without re-reading anything. The pointer into the text only increases — n steps, plus amortised fallbacks.",
        },
        {
          prompt: "The Z-function is at `i` inside the box `[l, r)` with `z[i − l] = 5` and `r − i = 3`. Where does `z[i]` start?",
          options: ["At 3, then extends by comparing characters from position r", "At 5, final", "At 0", "At 8"],
          answer: 0,
          explanation: "Inside the box s[i..r) equals s[i−l..r−l), so z[i] ≥ min(z[i − l], r − i) = 3. Beyond r nothing is known, so the comparison resumes there — that is how each character past r is compared once.",
        },
        {
          prompt: "Why do contest solutions hash with **two** moduli (or a 64-bit one)?",
          options: [
            "With one ~10^9 modulus and ~10^5 substrings, a collision among them is likely by the birthday bound, and fixed bases can be attacked",
            "Because one modulus overflows `long long`",
            "Two moduli make the hash computation faster",
            "To handle uppercase letters",
          ],
          answer: 0,
          explanation: "10^5 values give about 5 × 10^9 pairs against 10^9 hash values — a collision is expected. Two independent moduli push the chance per pair to about 10^-18.",
        },
      ],
    },
    {
      slug: "string-algorithms-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 60,
      exercises: [
        {
          title: "Border, period and repeats",
          prompt: `Read a string \`s\` of lowercase letters (length \`n\`). Print one line:

\`border=<b> period=<p> repeats=<r>\`

- \`b\` — the length of the longest **proper** prefix of \`s\` that is also its suffix;
- \`p = n − b\` — the smallest period (\`s[i] = s[i + p]\` for every valid \`i\`);
- \`r = n / p\` when \`p\` divides \`n\` (then \`s\` is \`r\` copies of its first \`p\` letters), otherwise \`1\`.

Use the **prefix function**: \`b = pi[n − 1]\`. O(n).

**Constraints:** \`1 ≤ n ≤ 10^6\`.

\`\`\`text
abcabcabc
\`\`\`
prints \`border=6 period=3 repeats=3\`; \`aabaa\` prints \`border=2 period=3 repeats=1\`.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    cin >> s;
    // TODO: the prefix function; b = pi[n - 1]; p = n - b; repeats = n / p if p divides n, else 1
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    cin >> s;
    const int n = static_cast<int>(s.size());
    vector<int> pi(n, 0);
    for (int i = 1; i < n; ++i) {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j]) j = pi[j - 1];
        if (s[i] == s[j]) ++j;
        pi[i] = j;
    }
    int b = pi[n - 1];
    int p = n - b;
    int repeats = n % p == 0 ? n / p : 1;
    cout << "border=" << b << " period=" << p << " repeats=" << repeats << '\n';
    return 0;
}
`,
          hints: [
            "The longest proper border is the last value of the prefix function; a one-letter string has border 0.",
            "If s has a border of length b, then s[i] = s[i + n − b] for every i: the smallest period is n − pi[n − 1].",
            "The period divides n exactly when s is a whole number of copies: \"abab\" has p = 2 and 2 copies, \"aabaa\" has p = 3, which does not divide 5.",
          ],
          cases: BORDER_CASES,
        },
      ],
      quiz: [
        {
          prompt: "What is `pi` for `abab`?",
          options: ["`0 0 1 2`", "`0 1 2 3`", "`0 0 0 2`", "`1 1 2 2`"],
          answer: 0,
          explanation: "a → 0, ab → 0, aba → 1 (\"a\"), abab → 2 (\"ab\"). A border must be proper, so pi[0] is always 0.",
        },
        {
          prompt: "KMP has just found a full match (j = m). What happens to j?",
          options: ["`j = pi[m - 1]`", "`j = 0`", "`j = m - 1`", "The search stops"],
          answer: 0,
          explanation: "Falling back to the pattern's longest border keeps the characters that can start the next, possibly overlapping, occurrence. Resetting to 0 would miss \"aa\" at position 2 of \"aaa\".",
        },
        {
          prompt: "Overall time of KMP matching for text length n and pattern length m?",
          options: ["O(n + m)", "O(n · m)", "O(n log m)", "O(m²) + O(n)"],
          answer: 0,
          explanation: "Building pi is O(m) and the scan is O(n): j rises by at most 1 per character and each fallback lowers it, so the total number of fallbacks is bounded by the number of rises.",
        },
        {
          prompt: "To find pattern `p` in text `t` with the Z-function, you compute Z of…",
          options: ["`p + '#' + t`, and report each i with `z[i] == |p|`", "`t + p`", "`p` alone, then compare with `t`", "`t` reversed"],
          answer: 0,
          explanation: "The separator, a character in neither string, caps every z value at |p|, so z[i] = |p| means p starts at position i − |p| − 1 of t.",
        },
        {
          prompt: "What is `z[0]` usually defined as?",
          options: ["0 (or n by convention) — the whole string trivially matches itself, so it carries no information", "1", "Always n − 1", "Undefined behaviour"],
          answer: 0,
          explanation: "Most implementations leave z[0] = 0 and loop from i = 1; some set it to n. Either way it is never used for matching.",
        },
        {
          prompt: "Prefix hashes `h[i+1] = h[i]·B + s[i] (mod p)`. The hash of `s[l..r)` is…",
          options: ["`h[r] - h[l] · B^(r-l)` mod p", "`h[r] - h[l]` mod p", "`h[r] / h[l]`", "`h[r-l]`"],
          answer: 0,
          explanation: "h[r] holds h[l] shifted left by r − l digits plus the substring's own value; subtract the shifted h[l]. Plain h[r] − h[l] mixes in positional weights.",
        },
        {
          prompt: "Why map letters to 1..26 rather than 0..25 for a polynomial hash?",
          options: [
            "With a = 0 and b = 1, \"b\" and \"ab\" both hash to 1 — leading zeros vanish",
            "Because 0 is not a valid `char`",
            "It makes the modulus prime",
            "It does not matter",
          ],
          answer: 0,
          explanation: "A polynomial hash reads the string as a number in base B; a zero digit at the front adds nothing, so strings differing only by leading 'a's collide every time.",
        },
        {
          prompt: "The smallest period of `abcabcab`?",
          options: ["3", "8", "5", "2"],
          answer: 0,
          explanation: "pi[7] = 5 (\"abcab\"), so p = 8 − 5 = 3. 3 does not divide 8, so the string is not a whole number of copies — but s[i] = s[i + 3] still holds throughout.",
        },
        {
          prompt: "On a hash hit for two substrings of equal length, how do you make the answer certain?",
          options: ["Compare the substrings character by character", "Hash them again with the same base", "Trust the hash — collisions cannot happen", "Compare their lengths"],
          answer: 0,
          explanation: "Equal strings always hash equal; unequal strings rarely do. A direct comparison on the hits removes the doubt, and it is cheap when hits are few.",
        },
        {
          prompt: "Which question is answered most directly by the Z-function rather than the prefix function?",
          options: [
            "For every i, how long the string's prefix that starts again at i is",
            "The longest border of the whole string",
            "The number of distinct substrings",
            "The lexicographically smallest rotation",
          ],
          answer: 0,
          explanation: "That is the definition of z[i]. The longest border is pi[n − 1]; distinct substrings need hashing or suffix structures.",
        },
      ],
    },
  ],
});
