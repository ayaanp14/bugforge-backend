---
title: KMP, the Z-function and rolling hashes
minutes: 16
seo-title: KMP, Z Algorithm and Rolling Hash in C++ for String Matching
description: Find every occurrence of a pattern in O(n + m) with the KMP prefix function or the Z-function, and compare substrings in O(1) with a double rolling hash in C++.
question: How does the KMP algorithm work?
answer: The Knuth–Morris–Pratt (KMP) algorithm finds every occurrence of a pattern in a text in O(n + m). It first builds the prefix function: pi[i] is the length of the longest proper prefix of the pattern that is also a suffix of its first i + 1 characters. On a mismatch the match length falls back to pi[j − 1] instead of restarting, so the text pointer never moves backwards.
q: What is the prefix function in KMP?
a: For a string s, pi[i] is the length of the longest proper prefix of s[0..i] that is also a suffix of it. For "abab" it is 0, 0, 1, 2. It is built in O(n) by extending the previous border when the next characters match and falling back through pi otherwise. The last value is the string's longest border.
q: What is the Z-function?
a: z[i] is the length of the longest common prefix of the string and its suffix starting at i. The Z algorithm computes it in O(n) by keeping the box [l, r) — the rightmost match found so far — and starting each z[i] inside the box from z[i − l], extending by direct comparison only past r. To find a pattern, compute Z of pattern + '#' + text.
q: How does a rolling hash compare substrings?
a: Store prefix hashes h[i] = s[0]·B^(i−1) + … + s[i−1] mod p and the powers of B. The hash of s[l..r) is h[r] − h[l]·B^(r−l) mod p, so any two substrings compare in O(1) after O(n) preparation. Two different moduli make an accidental collision vanishingly unlikely; on a hash hit, an exact comparison removes it entirely.
q: KMP vs Z-function — which should I use?
a: Both find all occurrences in O(n + m) and either can answer border and period questions. Use KMP when the pattern is fixed and the text streams past, since it needs only the pattern's table. Use Z when you want, for every position, how far the string matches its own prefix — the concatenation trick makes matching a one-liner.
---
Searching a pattern of length m in a text of length n by trying every start is O(n · m) — 2.5 × 10⁹ when both are 5 × 10⁴. Three tools do it in O(n + m) by never re-reading what is already known.

## The prefix function and KMP

- `pi[i]` = the length of the longest proper prefix of `s[0..i]` that is also its suffix (its **border**).
- Build it in O(m): try to extend the previous border; on a mismatch fall back to `pi[j − 1]` and try again.
- Match the same way: `j` characters of the pattern are matched; on a mismatch `j = pi[j − 1]`; at `j = m` record a match and fall back to `pi[m − 1]`.
- The text index only moves forward, so the whole search is O(n + m).

@figure kmp

```cpp
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
```

## The Z-function

- `z[i]` = the length of the longest common prefix of `s` and `s[i..]`.
- Keep the box `[l, r)`: the rightmost segment known to equal a prefix. Inside it, `z[i]` starts at `min(r − i, z[i − l])` for free; only characters past `r` are compared.
- To find a pattern, run Z on `pattern + '#' + text`: every `z[i] = m` is an occurrence.

@figure z-box

## Rolling hashes

- Prefix hashes `h[i+1] = h[i] · B + s[i] (mod p)` and powers `B^k`.
- `hash(l, r) = h[r] − h[l] · B^(r−l)`: any substring in O(1), so "are these equal?" is O(1).
- One 32-bit modulus collides often enough to fail anti-hash tests; use **two** moduli with fixed bases (or compare the strings when the hashes agree).
- Hashing answers what KMP cannot directly: distinct substrings, the longest repeated substring with binary search, palindromes by comparing with the reversed string.

```game
type: pick
title: Which string tool?
prompt: Pick the tool that answers it in about O(n) or O(n log n).
? Every position where "abaab" occurs in a 10^6-character text.
* KMP or the Z-function
- A rolling hash with one 32-bit modulus
- std::string::find in a loop
> Both run in O(n + m); find restarts and can degrade to O(n · m).
? The longest proper prefix of s that is also its suffix.
* The last value of the prefix function
- Sorting the suffixes
> pi[n − 1] is exactly the longest border.
? How many distinct substrings of length L does s have?
* Double hash every window, sort, count unique
- KMP with each window as the pattern
> n windows hashed in O(1) each, then a sort: O(n log n).
? The length of the longest prefix of s that starts again at each position i.
* The Z-function
- The prefix function
> That is the definition of z[i].
```

## More practice

- [Find the Index of the First Occurrence in a String](/problems/find-first-occurrence-in-string)
- [String Matching: All Occurrences](/problems/string-matching-all-occurrences)
- [Longest Happy Prefix](/problems/longest-happy-prefix)
- [Shortest Palindrome](/problems/shortest-palindrome)
- [Repeated String Match](/problems/repeated-string-match)
