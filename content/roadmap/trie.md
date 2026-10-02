---
title: Trie (Prefix Tree)
stage: heaps
order: 4
minutes: 19
level: Intermediate
hub: trie
practice: longest-common-prefix, longest-word-in-dictionary, replace-words, short-encoding-of-words, maximum-xor-of-two-numbers-in-an-array, extra-characters-in-a-string, sum-of-prefix-scores-of-strings, word-search-ii
updated: 2026-10-03
seo-title: Trie Data Structure (Prefix Tree): Insert, Search, Prefix
description: Learn the trie (prefix tree): insert, search and startsWith in O(L), prefix counts, autocomplete and the XOR trie, in C++, Java, Python and JavaScript.
question: What is a trie data structure?
answer: A trie, or prefix tree, stores strings one character per level. Each node stands for a prefix, its children for the letters that can follow it, and a flag marks the nodes where a stored word ends. Words that share a beginning share its nodes, so inserting a word, looking it up or checking a prefix takes O(L) time for a word of length L, however many words are stored.
q: What is a trie used for?
a: Anything that asks about prefixes: autocomplete and search suggestions, spell checking, finding the shortest dictionary word that starts a string, and word games such as finding every dictionary word in a grid of letters. A trie over the bits of integers also answers maximum-XOR questions.
q: What is the time complexity of trie operations?
a: Insert, search and a prefix check each take O(L) for a word of length L, one step per character, no matter how many words the trie holds. Building a trie from words with S characters in total takes O(S). Listing every word with a given prefix costs O(L) to reach the prefix plus the size of the subtree below it.
q: Should I use a trie or a hash set?
a: A hash set answers "is this exact word stored?" just as fast and with less memory, so use it when that is the only question. A trie also answers prefix questions — does any word start with this, how many do, which ones — in O(L), lists words in alphabetical order, and finds every stored word that starts at a position of a text in a single walk.
q: Why does a trie need an end-of-word flag?
a: Because one word can be a prefix of another. After inserting "cart", the nodes for c, a and r exist, but "car" was never inserted; without a flag on the r node, a search could not tell the difference. The flag marks exactly the nodes where an inserted word ends.
q: How much memory does a trie use?
a: At most one node per character inserted, fewer when words share prefixes. With an array of 26 children per node, a C++ node on a 64-bit machine spends 208 bytes on pointers, most of them empty, so a million nodes can need hundreds of megabytes. A hash map of children uses memory only for the letters present, at some cost in speed.
---
Type "ca" into a search box and it suggests "car", "cart" and "cat" before you finish. A spell checker suggests words that share your misspelling's beginning. A router picks the longest address prefix it has a rule for. All of these ask the same thing of a collection of strings: **which stored words start with this?**

A hash set cannot answer that without checking every word. A **trie** — from re*trie*val, usually said "try" — arranges the words letter by letter in a tree, so that all words with the same beginning share one path and sit together in one subtree. This lesson shows how a trie is stored, the operations and their cost, counting and autocomplete, the memory it costs and when a simpler structure will do, and the binary trie behind the maximum-XOR problem. Every example is shown in C++, Java, Python and JavaScript.

## Why a hash set is not enough

A [hash set](/roadmap/hashing) of words answers "is *car* a word?" in O(L) on average, which is ideal. But "does any word start with *ca*?" has no shortcut: you compare the prefix against every stored word, O(N × L) for N words. With 100,000 words and 100,000 prefix queries of ten letters, that is up to 10¹¹ character comparisons.

Two workarounds exist, and both are worth knowing. You can put **every prefix** of every word into a hash set — that answers "does any word start with p?" but not "which ones?", and storing each prefix as its own string costs memory that grows with the square of the word length. Or you can keep the words in a **sorted list**: the words starting with p form one contiguous block, found with two [binary searches](/roadmap/binary-search). That is a fair answer when the words never change. The trie does all of it, and its cost does not depend on N at all.

| Question | Hash set of words | Sorted list | Trie |
| --- | --- | --- | --- |
| Is w a stored word? | O(L) average | O(L log N) | O(L) |
| Does any word start with p? | O(N × L) | O(L log N) | O(L) |
| How many words start with p? | O(N × L) | O(L log N) | O(L), with counts |
| Which words start with p? | O(N × L) | O(L log N) plus the output | O(L) plus the subtree |
| Insert a word | O(L) average | O(N), shifting | O(L) |

## How a trie is stored

A trie is a tree in which **each node stands for a prefix**: the letters on the edges from the root down to it. The root stands for the empty prefix. Each node holds three things:

- **children**: one slot per possible next letter, leading to the node for the prefix one letter longer;
- **an end flag**: whether a stored word ends exactly here;
- **a pass count**: how many stored words pass through this node — that is, how many words have this prefix.

Here is the trie for car, cat, cart and dog:

```text
                 (root)
                /      \
              c 3       d 1
              |         |
              a 3       o 1
            /    \      |
         r* 2    t* 1   g* 1
          |
         t* 1

   letter = the edge into the node, number = pass count, * = a word ends here
```

The node never stores its string; its position spells it. car, cat and cart share the nodes for c and a, which is where a trie's speed and its memory savings both come from.

The **end flag** is essential because words can be prefixes of other words. Insert only "cart" and the nodes c, a, r all exist, yet "car" was never inserted. Without the flag, a search for "car" would succeed wrongly. The flag on r says that a word ends there; a node without it is only a passage to longer words.

There are two common ways to hold the children:

- **An array of 26**, indexed by `letter − 'a'`. Finding a child is one array access, and visiting the children in index order visits them alphabetically. The price is 26 slots per node, most of them empty.
- **A hash map** from letter to child, or a Python `dict`. It stores only the letters present and works for any alphabet — capitals, digits, Unicode — at the cost of a hash per step.

## The operations and their cost

- **insert(word)**: start at the root. For each letter, create the child if it is missing, move to it and add one to its pass count. At the last letter, set the end flag.
- **search(word)**: walk the word's letters from the root. If a child is missing, the word is not stored. If the walk completes, the answer is the end flag of the node reached — the path existing is not enough.
- **startsWith(prefix)**: the same walk, but if it completes the answer is yes, flag or not, because some word continues through that node.
- **countPrefix(prefix)**: the same walk, returning the pass count of the node reached, or 0 if the walk fails. Updating the counts during insert is what makes this O(L); counting the words below the node on every query would cost the size of the subtree.
- **autocomplete(prefix)**: walk to the prefix's node, then visit its whole subtree with a [depth-first search](/roadmap/depth-first-search), writing out every word whose end flag you pass. Visiting the children from a to z produces the words in alphabetical order.

Each step of a walk is one child lookup, constant time with an array, so every operation costs O(L) for a word or prefix of length L — independent of how many words are stored. That independence is the trie's whole promise. Autocomplete adds the size of the subtree it lists, which is unavoidable: the matches have to be written out.

The figure builds the trie for car, cat, cart and dog one word at a time, then answers a prefix query for "ca".

@walkthrough

### Dry run

Inserting the four words:

| Word | Nodes already there | Nodes created | Pass counts afterwards | End flag set on |
| --- | --- | --- | --- | --- |
| car | none | c, ca, car | c 1, ca 1, car 1 | car |
| cat | c, ca | cat | c 2, ca 2, cat 1 | cat |
| cart | c, ca, car | cart | c 3, ca 3, car 2, cart 1 | cart |
| dog | none | d, do, dog | d 1, do 1, dog 1 | dog |

Then the queries:

| Query | Walk | search | startsWith | countPrefix |
| --- | --- | --- | --- | --- |
| "car" | c, a, r | true: r is flagged | true | 2 (car, cart) |
| "ca" | c, a | false: a is not flagged | true | 3 |
| "cab" | c, a, then no b | false | false | 0 |
| "d" | d | false | true | 1 |

### The code

A trie with a children array of 26, an end flag and a pass count, offering insert, search, startsWith, countPrefix and autocomplete:

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct TrieNode {
    TrieNode* next[26] = {};                      // one slot per letter; null when absent
    bool isEnd = false;                           // a stored word ends here
    int pass = 0;                                 // how many stored words pass through
};

class Trie {
    TrieNode root;

    void collect(TrieNode* node, string& word, vector<string>& out) {
        if (node->isEnd) out.push_back(word);
        for (int i = 0; i < 26; i++) {
            if (!node->next[i]) continue;
            word.push_back('a' + i);              // children in a..z order: words come out sorted
            collect(node->next[i], word, out);
            word.pop_back();
        }
    }

public:
    void insert(const string& word) {
        TrieNode* node = &root;
        for (char c : word) {
            if (!node->next[c - 'a']) node->next[c - 'a'] = new TrieNode();
            node = node->next[c - 'a'];
            node->pass++;                         // one more word has this prefix
        }
        node->isEnd = true;
    }

    // Follows the prefix from the root; null if some letter is missing.
    TrieNode* walk(const string& prefix) {
        TrieNode* node = &root;
        for (char c : prefix) {
            node = node->next[c - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }

    bool search(const string& word) { TrieNode* n = walk(word); return n && n->isEnd; }
    bool startsWith(const string& prefix) { return walk(prefix) != nullptr; }
    int countPrefix(const string& prefix) { TrieNode* n = walk(prefix); return n ? n->pass : 0; }

    vector<string> autocomplete(const string& prefix) {
        vector<string> out;
        string word = prefix;
        TrieNode* n = walk(prefix);
        if (n) collect(n, word, out);
        return out;
    }
};

int main() {
    Trie trie;
    for (string w : {"car", "cat", "cart", "dog"}) trie.insert(w);
    cout << boolalpha;
    cout << "search(car): " << trie.search("car") << "\n";
    cout << "search(ca): " << trie.search("ca") << "\n";
    cout << "startsWith(ca): " << trie.startsWith("ca") << "\n";
    cout << "startsWith(cab): " << trie.startsWith("cab") << "\n";
    for (string p : {"ca", "car", "d", "x"}) cout << "countPrefix(" << p << "): " << trie.countPrefix(p) << "\n";
    cout << "autocomplete(ca):";
    for (const string& w : trie.autocomplete("ca")) cout << " " << w;
    cout << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class TrieNode {
        TrieNode[] next = new TrieNode[26];       // one slot per letter; null when absent
        boolean isEnd;                            // a stored word ends here
        int pass;                                 // how many stored words pass through
    }

    static class Trie {
        final TrieNode root = new TrieNode();

        void collect(TrieNode node, StringBuilder word, List<String> out) {
            if (node.isEnd) out.add(word.toString());
            for (int i = 0; i < 26; i++) {
                if (node.next[i] == null) continue;
                word.append((char) ('a' + i));    // children in a..z order: words come out sorted
                collect(node.next[i], word, out);
                word.deleteCharAt(word.length() - 1);
            }
        }

        void insert(String word) {
            TrieNode node = root;
            for (char c : word.toCharArray()) {
                if (node.next[c - 'a'] == null) node.next[c - 'a'] = new TrieNode();
                node = node.next[c - 'a'];
                node.pass++;                      // one more word has this prefix
            }
            node.isEnd = true;
        }

        // Follows the prefix from the root; null if some letter is missing.
        TrieNode walk(String prefix) {
            TrieNode node = root;
            for (char c : prefix.toCharArray()) {
                node = node.next[c - 'a'];
                if (node == null) return null;
            }
            return node;
        }

        boolean search(String word) { TrieNode n = walk(word); return n != null && n.isEnd; }
        boolean startsWith(String prefix) { return walk(prefix) != null; }
        int countPrefix(String prefix) { TrieNode n = walk(prefix); return n == null ? 0 : n.pass; }

        List<String> autocomplete(String prefix) {
            List<String> out = new ArrayList<>();
            TrieNode n = walk(prefix);
            if (n != null) collect(n, new StringBuilder(prefix), out);
            return out;
        }
    }

    public static void main(String[] args) {
        Trie trie = new Trie();
        for (String w : new String[] {"car", "cat", "cart", "dog"}) trie.insert(w);
        System.out.println("search(car): " + trie.search("car"));
        System.out.println("search(ca): " + trie.search("ca"));
        System.out.println("startsWith(ca): " + trie.startsWith("ca"));
        System.out.println("startsWith(cab): " + trie.startsWith("cab"));
        for (String p : new String[] {"ca", "car", "d", "x"}) System.out.println("countPrefix(" + p + "): " + trie.countPrefix(p));
        System.out.println("autocomplete(ca): " + String.join(" ", trie.autocomplete("ca")));
    }
}
```

```python
class TrieNode:
    def __init__(self):
        self.next = [None] * 26                   # one slot per letter; None when absent
        self.is_end = False                       # a stored word ends here
        self.passes = 0                           # how many stored words pass through


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def _collect(self, node, word, out):
        if node.is_end:
            out.append("".join(word))
        for i in range(26):
            if node.next[i] is not None:
                word.append(chr(ord("a") + i))    # children in a..z order: words come out sorted
                self._collect(node.next[i], word, out)
                word.pop()

    def insert(self, word):
        node = self.root
        for ch in word:
            i = ord(ch) - ord("a")
            if node.next[i] is None:
                node.next[i] = TrieNode()
            node = node.next[i]
            node.passes += 1                      # one more word has this prefix
        node.is_end = True

    def walk(self, prefix):
        """Follow the prefix from the root; None if some letter is missing."""
        node = self.root
        for ch in prefix:
            node = node.next[ord(ch) - ord("a")]
            if node is None:
                return None
        return node

    def search(self, word):
        node = self.walk(word)
        return node is not None and node.is_end

    def starts_with(self, prefix):
        return self.walk(prefix) is not None

    def count_prefix(self, prefix):
        node = self.walk(prefix)
        return 0 if node is None else node.passes

    def autocomplete(self, prefix):
        out = []
        node = self.walk(prefix)
        if node is not None:
            self._collect(node, list(prefix), out)
        return out


def text(flag):
    return "true" if flag else "false"


trie = Trie()
for w in ["car", "cat", "cart", "dog"]:
    trie.insert(w)
print("search(car):", text(trie.search("car")))
print("search(ca):", text(trie.search("ca")))
print("startsWith(ca):", text(trie.starts_with("ca")))
print("startsWith(cab):", text(trie.starts_with("cab")))
for p in ["ca", "car", "d", "x"]:
    print(f"countPrefix({p}):", trie.count_prefix(p))
print("autocomplete(ca):", *trie.autocomplete("ca"))
```

```javascript
class TrieNode {
  constructor() {
    this.next = new Array(26).fill(null); // one slot per letter; null when absent
    this.isEnd = false; // a stored word ends here
    this.pass = 0; // how many stored words pass through
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  collect(node, word, out) {
    if (node.isEnd) out.push(word);
    for (let i = 0; i < 26; i++) {
      // children in a..z order: words come out sorted
      if (node.next[i] !== null) this.collect(node.next[i], word + String.fromCharCode(97 + i), out);
    }
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      const i = ch.charCodeAt(0) - 97;
      if (node.next[i] === null) node.next[i] = new TrieNode();
      node = node.next[i];
      node.pass++; // one more word has this prefix
    }
    node.isEnd = true;
  }

  // Follows the prefix from the root; null if some letter is missing.
  walk(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node.next[ch.charCodeAt(0) - 97];
      if (node === null) return null;
    }
    return node;
  }

  search(word) { const n = this.walk(word); return n !== null && n.isEnd; }
  startsWith(prefix) { return this.walk(prefix) !== null; }
  countPrefix(prefix) { const n = this.walk(prefix); return n === null ? 0 : n.pass; }

  autocomplete(prefix) {
    const out = [];
    const n = this.walk(prefix);
    if (n !== null) this.collect(n, prefix, out);
    return out;
  }
}

const trie = new Trie();
for (const w of ["car", "cat", "cart", "dog"]) trie.insert(w);
console.log(`search(car): ${trie.search("car")}`);
console.log(`search(ca): ${trie.search("ca")}`);
console.log(`startsWith(ca): ${trie.startsWith("ca")}`);
console.log(`startsWith(cab): ${trie.startsWith("cab")}`);
for (const p of ["ca", "car", "d", "x"]) console.log(`countPrefix(${p}): ${trie.countPrefix(p)}`);
console.log(`autocomplete(ca): ${trie.autocomplete("ca").join(" ")}`);
```

```output
search(car): true
search(ca): false
startsWith(ca): true
startsWith(cab): false
countPrefix(ca): 3
countPrefix(car): 2
countPrefix(d): 1
countPrefix(x): 0
autocomplete(ca): car cart cat
```

## Walking the trie along a text

The trie's most useful trick in problems is not a single lookup but a **walk alongside another string**. Stand at position i of a text and walk the trie with the text's letters, i, i + 1, i + 2 and so on. Every node with an end flag that you pass is a dictionary word starting at position i, and the moment a child is missing you can stop, because no stored word continues that way. One walk finds every dictionary word that starts at i, in time bounded by the longest word, instead of one hash lookup per possible length.

- [Replace Words](/problems/replace-words) walks each word of a sentence and stops at the **first** end flag: the shortest root.
- [Extra Characters in a String](/problems/extra-characters-in-a-string) and Word Break run [dynamic programming](/roadmap/dynamic-programming) over positions, and from each position one trie walk lists every word that could be placed there.
- [Word Search II](/problems/word-search-ii) runs a [backtracking](/roadmap/backtracking) search over a grid of letters and moves down the trie in step with it, abandoning a path the moment the trie has no child for the next letter. That pruning is the difference between checking each dictionary word separately and checking them all at once.
- [Sum of Prefix Scores of Strings](/problems/sum-of-prefix-scores-of-strings) is the pass count again: walk each word and add up the counts along its path.

## Memory, and when a set is simpler

A trie has at most one node per character inserted, plus the root; shared prefixes make it fewer. But with a children array, every node carries 26 references whether it uses them or not: 26 pointers of 8 bytes, 208 bytes per node in C++ on a 64-bit machine, before anything else. A dictionary of 100,000 ten-letter words with little sharing can need close to a million nodes, around 200 MB — more than many judges allow. Three ways out:

- **Children in a hash map** (a `dict` in Python, `HashMap` in Java, `unordered_map` or a small sorted vector in C++): memory only for the letters present, at the cost of a hash per step.
- **One big array of nodes** (`next[node][letter]` holding node indices), the usual contest style: no per-object overhead, and ints instead of references.
- **No trie at all**, when the question allows it. [Longest Word in Dictionary](/problems/longest-word-in-dictionary) can be solved by sorting the words and keeping a word whenever the word without its last letter is already kept — a hash set does the job. If you only ever ask whether a whole word is present, a hash set is simpler and smaller. Reach for the trie when you have many prefix questions, need counts or listings, or walk alongside a text.

## The XOR trie: maximum XOR of two numbers

The same structure works on any alphabet, and with the alphabet {0, 1} it solves a famous problem: given an array, find the largest value of a XOR b over all pairs. Checking every pair is O(n²). Instead, insert every number into a **binary trie**, one bit per level, from the **highest bit** down. Then, for each number x, walk from the root trying to make each bit of the XOR a 1: at every level, take the child holding the **opposite** of x's bit if it exists, and the same bit only if it does not.

Why is that greedy choice right? A 1 in bit b is worth 2ᵇ, which is more than all the lower bits put together (2ᵇ − 1). So getting a 1 in the highest possible bit beats any combination of lower bits, and deciding the bits from the top down, each time taking the opposite bit when available, can never be improved by a different choice lower down. That is also why the bits must be inserted highest first.

### Dry run

With the numbers 3, 10, 5, 25, 2 and 8, five bits are enough (25 = 11001₂). Searching for the best partner of 5 = 00101₂:

| Bit | Bit of 5 | Wanted | Numbers still on the path | Taken | XOR bit |
| --- | --- | --- | --- | --- | --- |
| 4 | 0 | 1 | 25, the only one with bit 4 set | 1 | 1 |
| 3 | 0 | 1 | 25 | 1 | 1 |
| 2 | 1 | 0 | 25 | 0 | 1 |
| 1 | 0 | 1 | 25 has a 0 here, no choice | 0 | 0 |
| 0 | 1 | 0 | 25 has a 1 here, no choice | 1 | 0 |

The XOR is 11100₂ = 28, and no pair does better. Each number costs one walk of 31 levels for 32-bit non-negative integers, so the whole search is O(31 × n) instead of O(n²). [Maximum XOR of Two Numbers in an Array](/problems/maximum-xor-of-two-numbers-in-an-array) is exactly this; more on the bit tricks themselves in [bit manipulation](/roadmap/bit-manipulation).

```cpp
#include <iostream>
#include <vector>
using namespace std;

const int HIGH_BIT = 30;                          // non-negative ints fit in bits 30..0

struct BitNode {
    BitNode* child[2] = {nullptr, nullptr};
    int value = 0;                                // the number whose path ends here
};

void insert(BitNode* root, int x) {
    BitNode* node = root;
    for (int b = HIGH_BIT; b >= 0; b--) {         // highest bit first
        int bit = (x >> b) & 1;
        if (!node->child[bit]) node->child[bit] = new BitNode();
        node = node->child[bit];
    }
    node->value = x;
}

// The stored number whose XOR with x is largest.
int bestPartner(BitNode* root, int x) {
    BitNode* node = root;
    for (int b = HIGH_BIT; b >= 0; b--) {
        int bit = (x >> b) & 1;
        if (node->child[1 - bit]) node = node->child[1 - bit];  // opposite bit: a 1 in the XOR
        else node = node->child[bit];
    }
    return node->value;
}

int main() {
    vector<int> nums = {3, 10, 5, 25, 2, 8};
    BitNode* root = new BitNode();
    for (int x : nums) insert(root, x);
    int best = -1, a = 0, b = 0;
    for (int x : nums) {
        int y = bestPartner(root, x);
        if ((x ^ y) > best) { best = x ^ y; a = x; b = y; }
    }
    cout << "Numbers:";
    for (int x : nums) cout << " " << x;
    cout << "\n";
    cout << "Maximum XOR: " << a << " XOR " << b << " = " << best << "\n";
    return 0;
}
```

```java
public class Main {
    static final int HIGH_BIT = 30;               // non-negative ints fit in bits 30..0

    static class BitNode {
        BitNode[] child = new BitNode[2];
        int value;                                // the number whose path ends here
    }

    static void insert(BitNode root, int x) {
        BitNode node = root;
        for (int b = HIGH_BIT; b >= 0; b--) {     // highest bit first
            int bit = (x >> b) & 1;
            if (node.child[bit] == null) node.child[bit] = new BitNode();
            node = node.child[bit];
        }
        node.value = x;
    }

    // The stored number whose XOR with x is largest.
    static int bestPartner(BitNode root, int x) {
        BitNode node = root;
        for (int b = HIGH_BIT; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (node.child[1 - bit] != null) node = node.child[1 - bit];  // opposite bit: a 1 in the XOR
            else node = node.child[bit];
        }
        return node.value;
    }

    public static void main(String[] args) {
        int[] nums = {3, 10, 5, 25, 2, 8};
        BitNode root = new BitNode();
        for (int x : nums) insert(root, x);
        int best = -1, a = 0, b = 0;
        for (int x : nums) {
            int y = bestPartner(root, x);
            if ((x ^ y) > best) { best = x ^ y; a = x; b = y; }
        }
        StringBuilder line = new StringBuilder("Numbers:");
        for (int x : nums) line.append(" ").append(x);
        System.out.println(line);
        System.out.println("Maximum XOR: " + a + " XOR " + b + " = " + best);
    }
}
```

```python
HIGH_BIT = 30                                     # non-negative ints fit in bits 30..0


class BitNode:
    def __init__(self):
        self.child = [None, None]
        self.value = 0                            # the number whose path ends here


def insert(root, x):
    node = root
    for b in range(HIGH_BIT, -1, -1):             # highest bit first
        bit = (x >> b) & 1
        if node.child[bit] is None:
            node.child[bit] = BitNode()
        node = node.child[bit]
    node.value = x


def best_partner(root, x):
    """The stored number whose XOR with x is largest."""
    node = root
    for b in range(HIGH_BIT, -1, -1):
        bit = (x >> b) & 1
        if node.child[1 - bit] is not None:
            node = node.child[1 - bit]            # opposite bit: a 1 in the XOR
        else:
            node = node.child[bit]
    return node.value


nums = [3, 10, 5, 25, 2, 8]
root = BitNode()
for x in nums:
    insert(root, x)
best, a, b = -1, 0, 0
for x in nums:
    y = best_partner(root, x)
    if x ^ y > best:
        best, a, b = x ^ y, x, y
print("Numbers:", *nums)
print(f"Maximum XOR: {a} XOR {b} = {best}")
```

```javascript
const HIGH_BIT = 30; // non-negative ints fit in bits 30..0

class BitNode {
  constructor() {
    this.child = [null, null];
    this.value = 0; // the number whose path ends here
  }
}

function insert(root, x) {
  let node = root;
  for (let b = HIGH_BIT; b >= 0; b--) { // highest bit first
    const bit = (x >> b) & 1;
    if (node.child[bit] === null) node.child[bit] = new BitNode();
    node = node.child[bit];
  }
  node.value = x;
}

// The stored number whose XOR with x is largest.
function bestPartner(root, x) {
  let node = root;
  for (let b = HIGH_BIT; b >= 0; b--) {
    const bit = (x >> b) & 1;
    if (node.child[1 - bit] !== null) node = node.child[1 - bit]; // opposite bit: a 1 in the XOR
    else node = node.child[bit];
  }
  return node.value;
}

const nums = [3, 10, 5, 25, 2, 8];
const root = new BitNode();
for (const x of nums) insert(root, x);
let best = -1, a = 0, b = 0;
for (const x of nums) {
  const y = bestPartner(root, x);
  if ((x ^ y) > best) { best = x ^ y; a = x; b = y; }
}
console.log(`Numbers: ${nums.join(" ")}`);
console.log(`Maximum XOR: ${a} XOR ${b} = ${best}`);
```

```output
Numbers: 3 10 5 25 2 8
Maximum XOR: 5 XOR 25 = 28
```

Because every number is inserted before any search, each search always finds at least the number itself, so it never walks into a missing child. Problems that add a condition — the partner must be at most some limit, or close in value — sort the queries and insert numbers as the limit allows, or keep counts in the nodes so numbers can be removed again.

## Time and space complexity

| Operation | Time | Space |
| --- | --- | --- |
| insert, search, startsWith, countPrefix | O(L) for a word of length L | O(L) new nodes at most, for insert |
| Build from words with S characters in all | O(S) | O(S) nodes |
| Autocomplete a prefix | O(L) plus the size of the subtree listed | O(longest word) for the recursion |
| Maximum XOR pair of n numbers, B bits each | O(n × B) | O(n × B) nodes |
| Memory per node | | 26 references with an array; only the letters present with a map |

Compare the first row with a hash set: the same O(L), but the trie also answers every prefix question in that time, and the cost never depends on how many words are stored.

## How to recognise a trie problem

- The statement is about **prefixes**: "starts with", "is a prefix of", "shortest root", search suggestions or autocomplete.
- A **dictionary of words** must be matched against **every position** of a text, or against paths in a grid.
- You must **count** how many words share a prefix, or sum something over all prefixes.
- The words must come out in **alphabetical order** while you build or search.
- The question asks for the **maximum or minimum XOR** of a pair, or of a value with an element below a limit — a binary trie over the bits.

## Common mistakes

- **Forgetting the end flag.** Without it, "car" is found after inserting only "cart". `search` must check the flag; `startsWith` must not.
- **Counting on every query.** Counting the words below a node by walking its subtree costs the subtree's size each time. Keep a pass count and update it during insert.
- **Assuming lower-case letters.** `c − 'a'` with an array of 26 breaks on a capital letter, a digit or a space. Check the alphabet in the constraints and size the array, or use a map.
- **Inserting bits lowest first.** The XOR greedy only works when the highest bit is decided first. Insert and search from the top bit down, and use enough bits for the largest value.
- **Creating nodes in a lookup.** A search that creates missing children "on the way" fills the trie with junk and breaks the counts. Only insert creates nodes.
- **Running out of memory.** A node object with 26 references per character can exhaust the limit on large dictionaries. Use a map, or one flat array of indices.

## Practice in this order

1. [Longest Common Prefix](/problems/longest-common-prefix): insert every word, then walk down while there is exactly one child and no word ends.
2. [Longest Word in Dictionary](/problems/longest-word-in-dictionary): only paths whose every node is flagged count; compare with the sorted hash-set solution.
3. [Replace Words](/problems/replace-words): walk each word and stop at the first end flag.
4. [Short Encoding of Words](/problems/short-encoding-of-words): insert the words reversed, so shared suffixes share nodes, and count the leaves.
5. [Maximum XOR of Two Numbers in an Array](/problems/maximum-xor-of-two-numbers-in-an-array): the binary trie and its greedy walk.
6. [Extra Characters in a String](/problems/extra-characters-in-a-string): dynamic programming over positions with a trie walk from each one.
7. [Sum of Prefix Scores of Strings](/problems/sum-of-prefix-scores-of-strings): pass counts summed along each word.
8. [Word Search II](/problems/word-search-ii): a trie steering a backtracking search through a grid.

The [trie problem list](/challenges/trie) has every trie problem in the catalogue. That completes the tree-shaped structures of this stage; the road continues with [matrices and grids](/roadmap/matrix), where the first two-dimensional walks are the same depth-first and breadth-first traversals you used on trees.
