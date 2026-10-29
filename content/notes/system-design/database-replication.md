---
title: Database Replication
order: 6
minutes: 7
level: intermediate
updated: 2026-10-29
seo-title: Database Replication: Leader-Follower, Sync vs Async
description: Database replication for system design interviews: leader-follower, synchronous vs asynchronous, replication lag, read-your-writes and failover, animated.
question: What is database replication in system design?
answer: Database replication keeps copies of the same data on several machines. Usually one leader accepts writes and ships them through a log to followers, which serve reads and can take over if the leader fails. Replication adds read capacity and availability, at the cost of lag between copies and harder failure handling.
q: Why do we replicate a database?
a: For availability, so a failed machine does not take the data offline; for read scaling, since followers serve reads; and for latency, by placing a copy near users in another region. Replication does not add write capacity, because every copy still applies every write.
q: What is the difference between synchronous and asynchronous replication?
a: With synchronous replication the leader waits for a follower to confirm a write before telling the client it succeeded, so the write survives a leader crash but every write is slower. With asynchronous replication the leader answers at once and ships the write later, which is faster but can lose acknowledged writes on failover.
q: What is replication lag?
a: The delay between a write committing on the leader and a follower applying it. It is often small but grows under heavy load, long transactions or network trouble, and while it lasts a read from that follower returns old data.
q: How do you guarantee read-your-writes consistency?
a: Route a user's reads to the leader for a short window after that user writes, or remember the log position of the user's last write and only read from followers that have reached it. Other users can still read from any follower.
q: What is split brain?
a: Two nodes both believing they are the leader and both accepting writes, usually after a network partition or a failover while the old leader was only slow. Their histories diverge. Systems prevent it with a majority vote or consensus to elect a leader and by fencing the old one off.
q: What are multi-leader and leaderless replication?
a: Multi-leader lets several nodes accept writes, often one per region, and syncs them, so concurrent writes can conflict and need resolving. Leaderless systems such as Cassandra and DynamoDB-style stores write to several replicas at once and read from several, using quorums so reads overlap the latest writes.
---

Replication means keeping the same data on more than one machine, so the
database survives failures and can serve more reads.

## Leader–follower replication

- One node is the **leader** (primary); only it accepts writes.
- It records every change in a **replication log** (binlog, WAL).
- **Followers** (replicas) replay the log in order and serve **reads**.
- More followers = more read capacity — but not more write capacity.

@figure leader-follower

## Synchronous vs asynchronous

| | Synchronous | Asynchronous |
| --- | --- | --- |
| Client hears OK | After a follower confirms | After the leader commits |
| Write latency | Higher | Lower |
| Leader crash | Write is safe on a follower | Recent writes can be lost |
| A slow follower | Stalls writes | Just lags |

- **Semi-synchronous** is the common middle: wait for one follower, ship to the rest asynchronously.

@figure sync-vs-async

## Replication lag and stale reads

- Async followers trail the leader by a **lag** — milliseconds normally, longer under load.
- A read from a lagging follower returns old data: **eventual consistency**.
- The painful case: a user does not see their own write.
- Fixes:
  - **Read-your-writes**: send a user's reads to the leader for a while after they write.
  - **Position-aware reads**: read only from followers past the user's last write.
  - **Monotonic reads**: pin each user to one follower so time never goes backwards.

@figure stale-read

## Failover

- **Detect**: no heartbeat from the leader within a timeout.
- **Elect**: promote the follower with the most up-to-date log.
- **Reconfigure**: clients and other followers switch to the new leader.
- Risks:
  - **Lost writes** with async replication — the old leader's unshipped entries.
  - **Split brain**: two leaders accepting writes; prevent with a majority vote and fencing.
  - Too short a timeout fails over on a slow but healthy leader.

@figure failover

## Other topologies

- **Multi-leader**: a leader per region; writes are local, but concurrent writes conflict and need resolving.
- **Leaderless** (Dynamo-style): write to W replicas, read from R; with `W + R > N` a read overlaps the latest write.
- The trade-offs between consistency and availability are the subject of the [CAP theorem](/notes/system-design/cap-theorem).

## Interview questions

- **Does replication help write-heavy systems?** No — every replica applies every write; split the data with [sharding](/notes/system-design/database-sharding) instead.
- **A user updates their profile and sees the old one. Why?** The read hit a lagging follower; route their reads to the leader after a write.
- **Sync or async replication for payments?** At least one synchronous follower, so an acknowledged payment survives losing the leader.
- **How does failover go wrong?** Lost async writes, split brain, or flapping on a timeout that is too short.

Next: [Database Sharding](/notes/system-design/database-sharding) · Before this: [Content Delivery Networks](/notes/system-design/content-delivery-networks)
