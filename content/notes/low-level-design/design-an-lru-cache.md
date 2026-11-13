---
title: Design an LRU Cache
order: 4
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Design an LRU Cache: LLD With Code in 4 Languages
description: Design an LRU cache with O(1) get and put: hash map plus doubly linked list, the class diagram, eviction animated, thread safety, TTL and full code.
question: How do you design an LRU cache with O(1) get and put?
answer: Combine a hash map with a doubly linked list. The list keeps entries in order of use, most recent after a head sentinel and least recent before a tail sentinel; the map takes a key straight to its list node. A get moves the node to the front, a put adds at the front, and a full cache evicts the node before the tail, all in O(1).
q: Why does an LRU cache need a doubly linked list rather than a singly linked one?
a: Moving or removing a node needs its predecessor. With a prev pointer the node found through the map unlinks itself in O(1); a singly linked list would have to walk from the head to find the predecessor, which makes every get O(n).
q: Why does each node store the key as well as the value?
a: On eviction the cache takes the last node off the list and must also delete that entry from the map. The node is all it has at that moment, so the node has to carry its key.
q: What are sentinel nodes in an LRU cache?
a: Head and tail are dummy nodes that are never removed. Every real node always has a non-null prev and next, so insert and unlink need no special cases for an empty list or for the first and last entry.
q: Can I use LinkedHashMap or OrderedDict instead?
a: In real code, yes: Java's LinkedHashMap with access order and removeEldestEntry, or Python's OrderedDict with move_to_end and popitem(last=False), give an LRU cache in a few lines. In an interview, say so, then build the map and list yourself, because that is what is being tested.
q: How do you make an LRU cache thread-safe?
a: The simplest correct answer is one lock around get and put, since even get changes the list. Higher-throughput caches split keys into shards, each with its own lock and its own LRU list, at the cost of eviction being least recent per shard rather than globally.
q: What is the difference between LRU and LFU?
a: LRU evicts the entry used longest ago; LFU evicts the entry used least often. LRU adapts quickly when the working set shifts, while LFU protects entries that are popular over time but needs counters and more bookkeeping to stay O(1).
---

A cache of fixed capacity that, when full, throws out the **least recently used** entry. It is the most common machine-coding question because it tests data-structure choice and clean classes in under an hour.

## Requirements

- `get(key)`: the value, or a miss. A hit counts as a use.
- `put(key, value)`: insert or update. An update counts as a use.
- Fixed `capacity`; when full, a new key evicts the least recently used one.
- **Both operations O(1).** This one line decides the design.
- Clarify: value type, behaviour on capacity 0, single-threaded or not.

## Hash map + doubly linked list

- **Hash map** `key → node`: finds any entry in O(1), but has no order.
- **Doubly linked list**: keeps order of use; moving or removing a known node is O(1).
- Together: the map finds the node, the list reorders it.
- **Sentinels** `head` and `tail` remove every null check at the ends.

@figure lru-classes

| Operation | Map | List |
| --- | --- | --- |
| get hit | lookup | move node to front |
| put new | insert | add at front |
| put when full | delete evicted key | remove node before tail |
| put existing | lookup | update value, move to front |

## Watch it run

Capacity 3, the same ten operations as the code below.

@figure lru-run

```game
type: pick
title: What gets evicted?
prompt: Each round starts from an empty cache. Which key does the last put evict?
? Capacity 2: put 1, put 2, put 3.
* 1
- 2
- 3
> Nothing was read, so 1, the oldest entry, is the least recently used.
? Capacity 2: put 1, put 2, get 1, put 3.
- 1
* 2
- 3
> get 1 made 1 the most recent, leaving 2 at the tail.
? Capacity 3: put 1, put 2, put 3, get 1, get 2, put 4.
- 1
- 2
* 3
> After the two gets the order is 2, 1, 3, so 3 is least recent.
? Capacity 2: put 1, put 2, put 1 again with a new value, put 3.
- 1
* 2
- 3
> Updating 1 counts as a use and moves it to the front.
? Capacity 3: put 1, put 2, put 3, get 4 (a miss), put 5.
* 1
- 3
- 4
> A miss changes nothing, so the order is still 3, 2, 1.
```

## Moving a node in O(1)

- `get` unlinks the node (2 pointer writes) and adds it after head (4 writes).
- No walk through the list, whatever its length.

@figure lru-move-to-front

## put on a full cache

@figure lru-put-sequence

- Evict **before** inserting, so the size never exceeds capacity.
- The evicted node carries its key, which is how the map entry is found.

## Code

```cpp
#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

struct Node {
    int key;
    string value;
    Node* prev = nullptr;
    Node* next = nullptr;
    Node(int k, string v) : key(k), value(v) {}
};

class LRUCache {
    int capacity;
    unordered_map<int, Node*> map;
    Node* head = new Node(0, "");  // sentinels: no null checks at the ends
    Node* tail = new Node(0, "");

    void unlink(Node* n) { n->prev->next = n->next; n->next->prev = n->prev; }
    void addFirst(Node* n) {
        n->prev = head; n->next = head->next;
        head->next->prev = n; head->next = n;
    }

public:
    explicit LRUCache(int cap) : capacity(cap) { head->next = tail; tail->prev = head; }

    // Returns false on a miss.
    bool get(int key, string& out) {
        auto it = map.find(key);
        if (it == map.end()) return false;
        unlink(it->second); addFirst(it->second);
        out = it->second->value;
        return true;
    }

    // Returns the evicted key, or -1.
    int put(int key, const string& value) {
        auto it = map.find(key);
        if (it != map.end()) {
            it->second->value = value;
            unlink(it->second); addFirst(it->second);
            return -1;
        }
        int evicted = -1;
        if ((int)map.size() == capacity) {
            Node* last = tail->prev;
            unlink(last); map.erase(last->key);
            evicted = last->key;
            delete last;
        }
        Node* n = new Node(key, value);
        addFirst(n); map[key] = n;
        return evicted;
    }

    void printOrder() {
        cout << "order (most to least recent):";
        for (Node* n = head->next; n != tail; n = n->next) cout << " " << n->key;
        cout << "\n";
    }
};

int main() {
    LRUCache cache(3);
    auto put = [&](int k, string v) {
        int e = cache.put(k, v);
        cout << "put(" << k << ", " << v << ")";
        if (e != -1) cout << " evicts " << e;
        cout << "\n";
    };
    auto get = [&](int k) {
        string v;
        cout << "get(" << k << ") = " << (cache.get(k, v) ? v : "miss") << "\n";
    };
    put(1, "A"); put(2, "B"); put(3, "C"); get(1); put(4, "D");
    get(2); get(3); put(1, "Z"); put(5, "E"); get(4);
    cache.printOrder();
}
```

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    static class Node {
        int key;
        String value;
        Node prev, next;
        Node(int key, String value) { this.key = key; this.value = value; }
    }
    static class LRUCache {
        private final int capacity;
        private final Map<Integer, Node> map = new HashMap<>();
        private final Node head = new Node(0, null), tail = new Node(0, null); // sentinels

        LRUCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }

        private void addFirst(Node n) {
            n.prev = head; n.next = head.next;
            head.next.prev = n; head.next = n;
        }

        /** Returns null on a miss. */
        String get(int key) {
            Node n = map.get(key);
            if (n == null) return null;
            unlink(n); addFirst(n);
            return n.value;
        }

        /** Returns the evicted key, or null. */
        Integer put(int key, String value) {
            Node n = map.get(key);
            if (n != null) {
                n.value = value;
                unlink(n); addFirst(n);
                return null;
            }
            Integer evicted = null;
            if (map.size() == capacity) {
                Node last = tail.prev;
                unlink(last); map.remove(last.key);
                evicted = last.key;
            }
            n = new Node(key, value);
            addFirst(n); map.put(key, n);
            return evicted;
        }

        String order() {
            StringBuilder sb = new StringBuilder("order (most to least recent):");
            for (Node n = head.next; n != tail; n = n.next) sb.append(" ").append(n.key);
            return sb.toString();
        }
    }

    static LRUCache cache = new LRUCache(3);

    static void put(int k, String v) {
        Integer e = cache.put(k, v);
        System.out.println("put(" + k + ", " + v + ")" + (e != null ? " evicts " + e : ""));
    }

    static void get(int k) {
        String v = cache.get(k);
        System.out.println("get(" + k + ") = " + (v != null ? v : "miss"));
    }

    public static void main(String[] args) {
        put(1, "A"); put(2, "B"); put(3, "C"); get(1); put(4, "D");
        get(2); get(3); put(1, "Z"); put(5, "E"); get(4);
        System.out.println(cache.order());
    }
}
```

```python
class Node:
    def __init__(self, key, value):
        self.key, self.value = key, value
        self.prev = self.next = None


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.map = {}
        self.head, self.tail = Node(0, None), Node(0, None)  # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _add_first(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        """Returns None on a miss."""
        n = self.map.get(key)
        if n is None:
            return None
        self._unlink(n)
        self._add_first(n)
        return n.value

    def put(self, key, value):
        """Returns the evicted key, or None."""
        n = self.map.get(key)
        if n is not None:
            n.value = value
            self._unlink(n)
            self._add_first(n)
            return None
        evicted = None
        if len(self.map) == self.capacity:
            last = self.tail.prev
            self._unlink(last)
            del self.map[last.key]
            evicted = last.key
        n = Node(key, value)
        self._add_first(n)
        self.map[key] = n
        return evicted

    def order(self):
        keys, n = [], self.head.next
        while n is not self.tail:
            keys.append(str(n.key))
            n = n.next
        return "order (most to least recent): " + " ".join(keys)


cache = LRUCache(3)


def put(k, v):
    e = cache.put(k, v)
    print(f"put({k}, {v})" + (f" evicts {e}" if e is not None else ""))


def get(k):
    v = cache.get(k)
    print(f"get({k}) = {v if v is not None else 'miss'}")


put(1, "A"); put(2, "B"); put(3, "C"); get(1); put(4, "D")
get(2); get(3); put(1, "Z"); put(5, "E"); get(4)
print(cache.order())
```

```javascript
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new Node(0, null); // sentinels
    this.tail = new Node(0, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  unlink(n) {
    n.prev.next = n.next; n.next.prev = n.prev;
  }

  addFirst(n) {
    n.prev = this.head;
    n.next = this.head.next;
    this.head.next.prev = n;
    this.head.next = n;
  }

  /** Returns null on a miss. */
  get(key) {
    const n = this.map.get(key);
    if (!n) return null;
    this.unlink(n);
    this.addFirst(n);
    return n.value;
  }

  /** Returns the evicted key, or null. */
  put(key, value) {
    let n = this.map.get(key);
    if (n) {
      n.value = value;
      this.unlink(n);
      this.addFirst(n);
      return null;
    }
    let evicted = null;
    if (this.map.size === this.capacity) {
      const last = this.tail.prev;
      this.unlink(last);
      this.map.delete(last.key);
      evicted = last.key;
    }
    n = new Node(key, value);
    this.addFirst(n);
    this.map.set(key, n);
    return evicted;
  }

  order() {
    const keys = [];
    for (let n = this.head.next; n !== this.tail; n = n.next) keys.push(n.key);
    return "order (most to least recent): " + keys.join(" ");
  }
}

const cache = new LRUCache(3);
const put = (k, v) => {
  const e = cache.put(k, v);
  console.log(`put(${k}, ${v})` + (e !== null ? ` evicts ${e}` : ""));
};
const get = (k) => {
  const v = cache.get(k);
  console.log(`get(${k}) = ${v !== null ? v : "miss"}`);
};

put(1, "A"); put(2, "B"); put(3, "C"); get(1); put(4, "D");
get(2); get(3); put(1, "Z"); put(5, "E"); get(4);
console.log(cache.order());
```

```output
put(1, A)
put(2, B)
put(3, C)
get(1) = A
put(4, D) evicts 2
get(2) = miss
get(3) = C
put(1, Z)
put(5, E) evicts 4
get(4) = miss
order (most to least recent): 5 1 3
```

## Extensions

- **Thread safety**: even `get` writes (it reorders), so a read-write lock does not help; use one mutex around both, or shard keys across several locked LRUs.
- **TTL**: store an expiry time in each node; `get` treats an expired node as a miss and removes it. Lazy expiry costs nothing extra; a background sweep frees memory sooner.
- **Eviction policy as a Strategy**: put LRU behind an `EvictionPolicy` interface so LFU or FIFO is a new class ([design patterns](/notes/oop/design-patterns)).
- **Library shortcut**: `LinkedHashMap` (Java) and `OrderedDict` (Python) already do this; mention them, then build it.

## Interview questions

- **Why not a heap of timestamps?** Updating a node's position is O(log n), not O(1).
- **Why sentinels?** Insert and unlink never meet a null, so there are no edge cases.
- **What breaks with a singly linked list?** Unlinking needs the previous node, which costs a walk.
- **How do you test it?** Capacity 1, updating an existing key, a miss, and evicting right after a get.

Practise it: [LRU Cache](/problems/lru-cache).

Next: [Design a Parking Lot](/notes/low-level-design/design-a-parking-lot) · Before this: [Design Patterns in LLD](/notes/low-level-design/design-patterns-in-lld)
