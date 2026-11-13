---
title: LRU cache
minutes: 12
seo-title: LRU Cache in Java: HashMap Plus Doubly Linked List Design
description: Code an LRU cache in Java with O(1) get and put: a HashMap of nodes, a doubly linked list with sentinels, tail eviction and TTL on a logical clock.
question: How do you implement an LRU cache in Java?
answer: Keep a `HashMap` from key to node and a doubly linked list of those nodes in order of use, with head and tail sentinels. `get` finds the node through the map and moves it after the head; `put` adds a new node there and, when the cache is full, removes the node before the tail and its map entry. Both run in O(1).
q: Can I use LinkedHashMap for an LRU cache in Java?
a: Yes: `new LinkedHashMap<>(16, 0.75f, true)` keeps entries in access order, and overriding `removeEldestEntry` to return `size() > capacity` evicts the least recent one. In a machine-coding round, mention it and then build the map and list yourself, because that is what is being tested.
q: Does a get on a missing key change the LRU order?
a: No. A miss touches no node, so the order of use is unchanged. Only a hit, or a put of a key, makes that key the most recent; a read that must not count, such as a peek or a debug listing, should walk the list without moving anything.
q: How do you add TTL expiry to an LRU cache?
a: Store an expiry time on each node and read time from a clock you pass in, not the system clock, so tests are repeatable. A read of an expired entry removes it and reports a miss, and a put into a full cache drops expired entries before it evicts a live one.
q: Why does each node store its key?
a: Eviction starts from the list: the node before the tail is removed, and the cache must then delete its map entry. The node is all it holds at that moment, so the node must carry the key.
---
The most asked machine-coding problem, because one line of the brief decides the design: **get and put in O(1)**. The full treatment, with the code in four languages, is the note [Design an LRU Cache](/notes/low-level-design/design-an-lru-cache); this lesson is what you need to code it in twenty minutes.

## Two structures, one object

- A `HashMap<String, Node>` finds any entry in O(1) but keeps no order.
- A **doubly linked list** keeps the order of use: most recent after `head`, least recent before `tail`. Unlinking a node you already hold is O(1) because it knows its `prev`.
- The map's values *are* the list's nodes, so a lookup lands on the node to move.
- `head` and `tail` are **sentinels**: never removed, so insert and unlink need no null checks.

@figure lru-classes

## Watch the order move

Capacity 3. A hit moves its node to the front; a put on a full cache evicts from the back.

@figure lru-run

- `get` = map lookup + `unlink` + `addFirst`.
- `put` of a new key into a full cache: unlink `tail.prev`, delete *its key* from the map, then add the new node. Evict first, so the size never passes capacity.
- `put` of an existing key updates the value and counts as a use.
- A **miss changes nothing**.

```game
type: pick
title: Which key goes?
prompt: Each round starts from an empty cache. Which key does the last PUT evict?
? Capacity 2: PUT a, PUT b, GET a, PUT c.
- a
* b
- c
> GET a made a the most recent, so b is at the tail.
? Capacity 2: PUT a, PUT b, PUT a (new value), PUT c.
- a
* b
- nothing
> Updating a counts as a use and moves it to the front.
? Capacity 2: PUT a, PUT b, GET z (a miss), PUT c.
* a
- b
- z
> A miss touches no node, so the order is still b, a.
? Capacity 3: PUT a, PUT b, PUT c, GET a, GET b, PUT d.
- a
- b
* c
> After the two gets the order is b, a, c, so c is least recent.
```

## Time without a clock

The second program adds **expiry**. Never call `System.currentTimeMillis()` in a design you must test: keep a logical `now` that a `TICK` command advances, store `expiresAt` on each node, and treat an entry as gone once `now >= expiresAt`.

- A `GET` of an expired entry removes it and says so.
- A `PUT` into a full cache drops expired entries **before** evicting a live one: an expired entry is worth nothing.

## The traps

- A **singly** linked list: unlinking needs the predecessor, so every `get` walks the list.
- Forgetting the key in the node: eviction cannot find the map entry to delete.
- Printing from a `HashMap`: list the order by walking the linked list from `head`.
