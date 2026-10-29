---
title: Consistent Hashing
order: 9
minutes: 6
level: intermediate
updated: 2026-10-29
seo-title: Consistent Hashing in System Design, Animated
description: Consistent hashing for system design interviews: the hash ring, adding and removing servers, keys moved versus mod N, and virtual nodes, shown as animations.
question: What is consistent hashing?
answer: Consistent hashing places servers and keys on the same circular hash space, and stores each key on the first server clockwise from it. When a server joins or leaves, only the keys on its arc move, about 1/N of them, instead of almost every key moving as with hash mod N.
q: Why not use hash(key) mod N?
a: Because the result depends on N. When a server is added or removed, N changes and most keys map to a different server; going from 3 to 4 servers moves about three quarters of them. For a cache that means a flood of misses; for a datastore, a mass migration.
q: How does a lookup work on the ring?
a: Hash the key to a position, then find the first server position clockwise from it, wrapping past the top. Keeping server positions in a sorted array makes this one binary search, O(log S) for S points on the ring.
q: What happens when a server is added?
a: The new server takes over the arc between the previous server and itself. Only the keys on that arc move, and they all move to the new server; every other key stays where it was.
q: What are virtual nodes?
a: Each physical server is placed on the ring many times, at hash(server#0), hash(server#1) and so on. Many small arcs average out the luck of where single points land, so load is far more even, and a leaving server's keys spread over many servers instead of one neighbour.
q: Where is consistent hashing used?
a: In distributed caches and key-value stores to decide which node owns a key (Amazon's Dynamo design and Apache Cassandra use ring-based partitioning), in client-side sharding for memcached, and in load balancers that need sticky routing that survives pool changes.
---

Sharding needs a rule for which server owns a key. Consistent hashing is a rule that barely changes when the set of servers does.

## The problem with mod N

- `server = hash(key) mod N` spreads keys evenly, but **depends on N**.
- Add or remove one server and most keys get a new home.
- From 3 to 4 servers about **3 in 4 keys move** (a key stays only if `h mod 3 = h mod 4`).
- For a cache that is a stampede of misses at once.

## The hash ring

- Hash space bent into a circle (here 0–360°).
- **Servers** are hashed onto it (by address or name).
- **Keys** are hashed onto the same ring.
- A key belongs to the **first server clockwise** from it.
- Lookup: binary search over the sorted server positions.

@figure ring-lookup

## Adding a server

- The new server takes only the arc from its predecessor up to itself.
- Keys on that arc move to it; **no other key moves**.
- Expected keys moved: about **K / N**, not most of K.

@figure add-server

## Removing a server

- The server's arc joins its clockwise neighbour's.
- Only the removed server's keys move, all to that neighbour.
- mod N, by contrast, reshuffles keys that were never on it.

@figure remove-server

## Virtual nodes

- One point per server leaves arcs as uneven as the hashes fall.
- Give each server many points (`A#0`, `A#1`, …): small arcs average out.
- Bonus: a failed server's keys **scatter over many servers**, not one.
- Weighted capacity: a bigger server gets more virtual nodes.

@figure virtual-nodes

## Ring vs mod N

| | mod N | Hash ring |
| --- | --- | --- |
| Lookup | O(1) arithmetic | O(log S) binary search |
| Keys moved on a change | Most of them | About K / N |
| Balance | Even | Even with virtual nodes |
| State needed | N | Sorted server positions |

## In practice

- **Replication**: store a key on the next R distinct servers clockwise, not just the first.
- **Hot keys** are not fixed by the ring; one popular key still lands on one server.
- Alternatives with the same goal: rendezvous (highest random weight) hashing, jump consistent hash.

## Interview questions

- **Why does mod N fail when scaling?** Changing N changes almost every key's server, so data or cache entries move en masse.
- **How many keys move when a server joins the ring?** About K / N, only those on the new server's arc.
- **Why use virtual nodes?** To even out load and to spread a failed server's keys across many servers.
- **How do you find a key's server fast?** Binary search the sorted ring positions for the first one at or after the key's hash, wrapping to the start.

Next: [Message Queues](/notes/system-design/message-queues) · Before this: [CAP Theorem](/notes/system-design/cap-theorem)
