---
title: Database Sharding
order: 7
minutes: 7
level: intermediate
updated: 2026-10-29
seo-title: Database Sharding: Range vs Hash, Hot Shards, Resharding
description: Database sharding for system design interviews: range vs hash sharding, choosing a shard key, hot shards, resharding and scatter-gather queries, animated.
question: What is database sharding?
answer: Sharding splits one large dataset into smaller pieces called shards and stores each on a different database server. A shard key in every row decides which shard holds it, by range or by hash. Sharding scales writes and storage beyond one machine, at the cost of cross-shard queries, resharding work and lost single-database transactions.
q: What is the difference between sharding and replication?
a: Replication copies the same data to several machines, which adds read capacity and availability. Sharding splits different data across machines, which adds write capacity and storage. Real systems usually do both: each shard is itself a leader with followers.
q: What is the difference between range and hash sharding?
a: Range sharding gives each shard a contiguous span of keys, so range queries stay on one shard but sequential or popular keys can overload one shard. Hash sharding places a key by its hash, which spreads load evenly but scatters neighbouring keys, so range queries must ask every shard.
q: How do you choose a shard key?
a: Pick a key with many distinct values that spreads both data and traffic evenly and that most queries include, so they can be routed to one shard. A user id often works for user-centric apps; a timestamp or a country code usually does not.
q: What is a hot shard?
a: A shard that receives far more traffic than the others, from sequential keys under range sharding, a skewed key distribution or one very popular key such as a celebrity account. Fixes include hashing the key, splitting the hot range, or adding a random suffix to a hot key and reading all its parts.
q: Why is resharding hard with hash mod N?
a: The shard is hash(key) mod N, so changing N changes the answer for most keys, not just the ones the new shard should take. Moving that much data at once is slow and risky. Consistent hashing, or a fixed number of virtual partitions mapped to servers, limits how much moves.
q: What are the downsides of sharding?
a: Queries without the shard key must ask every shard, joins and transactions across shards need application logic or distributed protocols, resharding is operationally heavy, and every shard needs its own replicas and backups. It is worth it only once one machine truly cannot keep up.
---

Sharding (horizontal partitioning) splits a table's rows across several
database servers, so each holds and serves only part of the data.

## Why shard

- One server has a ceiling on storage, writes per second and memory.
- [Replication](/notes/system-design/database-replication) scales reads, not writes: every replica applies every write.
- Sharding splits the data, so writes and storage grow with the number of shards.
- Try first: indexes, caching, read replicas, a bigger machine. Sharding is the last step.

## Range vs hash sharding

- **Range**: each shard owns a span of keys (A–H, I–P, Q–Z).
  - Range queries stay on one shard; but load follows the key distribution.
- **Hash**: `shard = hash(key) mod N`.
  - Even spread; neighbouring keys scatter, so range queries ask every shard.
- **Directory**: a lookup table maps keys to shards — flexible, but the table is one more thing to keep available.

@figure range-vs-hash

## Choosing a shard key

- **High cardinality**: many distinct values to spread.
- **Even traffic**, not just even data.
- **In most queries**, so they reach one shard.
- A bad key creates a **hot shard**: sequential ids, timestamps, one celebrity user.

@figure hot-shard

## Resharding

- Shards fill up or get hot, so data must be split and moved.
- With `hash mod N`, going from N to N + 1 changes the shard of most keys.
- Fixes:
  - [Consistent hashing](/notes/system-design/consistent-hashing): only about 1/(N+1) of keys move.
  - **Many fixed partitions** (say 1,024) mapped to servers: move whole partitions, never re-hash.
- Moving data live needs double writes or a copy-then-switch cutover.

@figure resharding

## Queries across shards

- With the shard key: routed to **one shard** — cheap at any scale.
- Without it: **scatter–gather** to every shard, merged by the router; latency = the slowest shard.
- Cross-shard **joins** move to the application; denormalise data that is read together.
- Cross-shard **transactions** need two-phase commit or sagas — avoid by keeping related rows on one shard ([ACID](/notes/dbms/transactions-and-acid)).

@figure scatter-gather

| | Range | Hash |
| --- | --- | --- |
| Range queries | One shard | Every shard |
| Load spread | Follows key distribution | Even |
| Hot spots | Sequential or skewed keys | One very hot key only |
| Adding a shard | Split a range | Most keys move (mod N) |

## Interview questions

- **Sharding vs replication?** Sharding splits data to scale writes; replication copies it to scale reads and survive failures.
- **How would you shard a users table?** By hashed user id: high cardinality, even load, and most queries name the user.
- **Why not shard by created date?** Every new row lands on the latest shard — a hot shard.
- **What breaks after sharding?** Queries without the key, cross-shard joins and transactions, and resharding.

Next: [CAP Theorem](/notes/system-design/cap-theorem) · Before this: [Database Replication](/notes/system-design/database-replication)
