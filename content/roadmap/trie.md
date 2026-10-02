---
title: Trie (Prefix Tree)
stage: heaps
order: 4
minutes: 12
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
Type "ca" into a search box and it suggests "car", "cart" and "cat" before you finish. A spell checker suggests words that share your misspelling's beginning; a router picks the longest address prefix it has a rule for. All of these ask the same thing of a collection of strings: **which stored words start with this?** A **trie** — from re*trie*val, usually said "try" — arranges the words letter by letter in a tree, so that all words with the same beginning share one path and sit together in one subtree.

## Why a hash set is not enough

A [hash set](/roadmap/hashing) answers "is *car* a word?" in O(L) on average. But "does any word start with *ca*?" has no shortcut: the prefix must be compared with every stored word.

@figure prefix-cost

Putting **every prefix** into the set answers "does any word start with p?" but not "which ones?", at a memory cost that grows with the square of the word length. A **sorted list** keeps the words starting with p in one block, found with two [binary searches](/roadmap/binary-search) — fair when the words never change. The trie does all of it:

| Question | Hash set of words | Sorted list | Trie |
| --- | --- | --- | --- |
| Is w a stored word? | O(L) average | O(L log N) | O(L) |
| Does any word start with p? | O(N × L) | O(L log N) | O(L) |
| How many words start with p? | O(N × L) | O(L log N) | O(L), with counts |
| Which words start with p? | O(N × L) | O(L log N) plus the output | O(L) plus the subtree |
| Insert a word | O(L) average | O(N), shifting | O(L) |

## How a trie is stored

Each node **stands for a prefix**, the letters on its path from the root, and holds its **children** (one slot per next letter), an **end flag** where a stored word ends, and a **pass count** of the words with this prefix. The node never stores its string; its position spells it.

@figure stored

The **end flag** matters because a word can be the prefix of another: insert only "cart" and the nodes c, a, r exist, yet "car" was never inserted. The children can be an **array of 26**, indexed by `letter − 'a'` — one access per step, alphabetical order for free, most slots empty — or a **hash map** holding only the letters present, for any alphabet, at the cost of a hash per step.

## The operations and their cost

**Insert** walks the word's letters from the root, creating any missing child and adding one to each pass count, then sets the end flag on the last node. Every other operation is the same walk without creating anything. Each step is one child lookup, so every operation costs O(L) for a word of length L — **however many words are stored**. That independence is the trie's whole promise:

@walkthrough

**search**, **startsWith** and **countPrefix** are one walk with three different questions at the end:

@figure queries

Keeping the pass count during insert is what makes countPrefix O(L); counting on every query would cost the subtree. **Autocomplete** walks to the prefix, then lists its subtree with a [depth-first search](/roadmap/depth-first-search):

@figure autocomplete

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

The trie's most useful trick in problems is not a single lookup but a **walk alongside another string**. Stand at position i of a text and walk the trie with the text's letters: every end flag passed is a dictionary word starting at i, and a missing child means no stored word continues, so you stop. One walk finds every word starting at i, in time bounded by the longest word.

@figure text-walk

- [Replace Words](/problems/replace-words) stops at the **first** end flag: the shortest root.
- [Extra Characters in a String](/problems/extra-characters-in-a-string) and Word Break run [dynamic programming](/roadmap/dynamic-programming) over positions, with one trie walk from each.
- [Word Search II](/problems/word-search-ii) moves down the trie in step with a [backtracking](/roadmap/backtracking) search of a grid, abandoning a path the moment the trie has no child for the next letter.
- [Sum of Prefix Scores of Strings](/problems/sum-of-prefix-scores-of-strings) adds up the pass counts along each word.

## Memory, and when a set is simpler

A trie has at most one node per character inserted. But with a children array every node carries 26 references, 208 bytes in C++ on a 64-bit machine, so 100,000 ten-letter words with little sharing can need around 200 MB. The ways out: children in a **hash map**; **one flat array** of node indices, `next[node][letter]`, the contest style; or **no trie at all** — if you only ask whether whole words are present, a hash set is simpler and smaller. Reach for the trie for prefix questions, counts, listings or a walk along a text.

## The XOR trie: maximum XOR of two numbers

With the alphabet {0, 1}, a trie finds the largest a XOR b over all pairs of an array without checking every pair. Insert every number into a **binary trie**, one bit per level from the **highest** bit down; then, for each number, walk down taking the **opposite** bit whenever that child exists.

@figure xor-trie

Why is the greedy choice right? A 1 in bit b is worth 2ᵇ, more than all the lower bits together (2ᵇ − 1), so a 1 in the highest possible bit beats any combination below it — which is also why the bits must go in highest first. [Maximum XOR of Two Numbers in an Array](/problems/maximum-xor-of-two-numbers-in-an-array) is exactly this; more bit tricks are in [bit manipulation](/roadmap/bit-manipulation).

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

Every number is inserted before any search, so a walk never meets a dead end.

## Time and space complexity

| Operation | Time | Space |
| --- | --- | --- |
| insert, search, startsWith, countPrefix | O(L) for a word of length L | O(L) new nodes at most, for insert |
| Build from words with S characters in all | O(S) | O(S) nodes |
| Autocomplete a prefix | O(L) plus the size of the subtree listed | O(longest word) for the recursion |
| Maximum XOR pair of n numbers, B bits each | O(n × B) | O(n × B) nodes |

## How to recognise a trie problem

- The statement is about **prefixes**: "starts with", "is a prefix of", "shortest root", autocomplete.
- A **dictionary** must be matched against **every position** of a text, or against paths in a grid.
- You must **count** the words sharing a prefix, or sum something over all prefixes.
- The words must come out in **alphabetical order** as you build or search.
- The **maximum or minimum XOR** of a pair: a binary trie over the bits.

## Common mistakes

- **Forgetting the end flag**: without it, "car" is found after inserting only "cart". `search` checks the flag; `startsWith` does not.
- **Counting on every query** instead of keeping a pass count.
- **Assuming lower-case letters**: `c − 'a'` breaks on capitals, digits or spaces. Check the alphabet, or use a map.
- **Inserting bits lowest first**: the XOR greedy needs the highest bit decided first.
- **Creating nodes in a lookup**: only insert creates nodes; a search that does fills the trie with junk.
- **Running out of memory** with 26 references per node on a large dictionary.

## Practice in this order

1. [Longest Common Prefix](/problems/longest-common-prefix): walk down while there is exactly one child and no word ends.
2. [Longest Word in Dictionary](/problems/longest-word-in-dictionary): only paths flagged at every node count.
3. [Replace Words](/problems/replace-words): stop at the first end flag.
4. [Short Encoding of Words](/problems/short-encoding-of-words): insert the words reversed, so shared suffixes share nodes.
5. [Maximum XOR of Two Numbers in an Array](/problems/maximum-xor-of-two-numbers-in-an-array): the binary trie and its greedy walk.
6. [Extra Characters in a String](/problems/extra-characters-in-a-string): dynamic programming with a trie walk from each position.
7. [Sum of Prefix Scores of Strings](/problems/sum-of-prefix-scores-of-strings): pass counts summed along each word.
8. [Word Search II](/problems/word-search-ii): a trie steering a backtracking search through a grid.

The [trie problem list](/challenges/trie) has every trie problem in the catalogue. That completes the tree-shaped structures of this stage; the road continues with [matrices and grids](/roadmap/matrix), where the first two-dimensional walks are the same depth-first and breadth-first traversals you used on trees.
