---
title: CAP Theorem
order: 8
minutes: 7
level: intermediate
updated: 2026-10-29
seo-title: CAP Theorem in System Design, Animated
description: The CAP theorem for system design interviews: CP vs AP during a network partition, eventual consistency, quorums (R + W > N) and PACELC, shown as animations.
question: What is the CAP theorem?
answer: The CAP theorem says that when a network partition splits a distributed system, each side must choose between consistency (every read sees the latest write, or fails) and availability (every request gets an answer, possibly stale). Partitions cannot be ruled out, so the real choice is what to give up while one lasts.
q: Is CAP really "pick two of three"?
a: Not in practice. Partition tolerance is not optional, because networks do drop and delay messages. The choice only bites during a partition: refuse some requests to stay consistent (CP) or answer them all and accept stale or conflicting data (AP). With no partition, a system can offer both.
q: What does consistency mean in CAP?
a: Linearizability: every read returns the most recent completed write, as if there were one copy of the data. It is a stronger and different idea from the C in ACID, which is about a transaction keeping the database's rules intact.
q: What is the difference between a CP and an AP system?
a: During a partition a CP system refuses requests on the side that cannot reach a majority, so it never returns stale data. An AP system answers on every side, so it stays up but may return stale values and must reconcile conflicting writes once the partition heals.
q: What is eventual consistency?
a: A guarantee that if writes stop, every replica eventually holds the same value. Replicas may disagree for a while, especially after a partition, and converge through anti-entropy, read repair or hinted handoff, with a rule such as last-write-wins or a CRDT merge for conflicts.
q: How do quorums relate to CAP?
a: With N replicas, writes wait for W acknowledgements and reads ask R replicas. If R + W > N every read set overlaps the last write set, so reads see the latest write. Requiring quorums makes a minority side unable to answer, which is a CP choice.
q: What is PACELC?
a: An extension of CAP: if there is a Partition, choose Availability or Consistency; Else, in normal running, choose Latency or Consistency. Even without failures, waiting for more replicas to confirm makes every request slower, so systems trade latency for consistency all the time.
---

CAP is about one moment: the network has split, and a replica cannot reach its peers. What should it do with the request in front of it?

## The three letters

- **Consistency (C)**: every read sees the latest write, as if there were one copy. If that cannot be guaranteed, the request fails.
- **Availability (A)**: every request to a working node gets an answer, not an error.
- **Partition tolerance (P)**: the system keeps running when messages between nodes are lost or delayed.
- **Partitions are not optional.** Cables, switches and cloud zones fail, so "CA" is not a real option for a distributed system. The choice is C or A *while a partition lasts*.

## CP: refuse rather than be wrong

- Requests need a majority of replicas (2 of 3 here).
- The majority side keeps working; the cut-off side refuses reads and writes.
- No client ever sees stale data, but some clients get errors.
- Typical of systems built on consensus (Raft, Paxos), such as etcd and ZooKeeper.

@figure cp-partition

## AP: answer, even if stale

- Every replica answers from what it has.
- Both sides can accept writes, so their copies **diverge**.
- Fits data where a stale answer costs little: likes, carts, feeds, DNS.

@figure ap-partition

## After the partition: eventual consistency

- When the link heals, replicas compare versions (anti-entropy, read repair).
- A conflict rule picks the winner. **Last-write-wins** is simple but silently drops a write; vector clocks or **CRDTs** keep or merge both.
- If writes stop, all replicas end up equal: **eventual consistency**.

@figure heal

## Quorums: tuning between the two

- N replicas; a write waits for **W** acknowledgements; a read asks **R** replicas.
- **R + W > N** means every read overlaps the latest write.
- Small R and W are fast and available but can read stale data.
- Common setting: N = 3, R = 2, W = 2.

@figure quorum

## CP vs AP at a glance

| | CP | AP |
| --- | --- | --- |
| During a partition | Minority side refuses | Every side answers |
| Reads | Always the latest | May be stale |
| Writes | Only with a majority | Anywhere, may conflict |
| After healing | Nothing to merge | Reconcile conflicts |
| Good for | Locks, config, balances | Feeds, carts, counters |

## PACELC

- **P**artition → **A** or **C**; **E**lse → **L**atency or **C**onsistency.
- Without failures, waiting for more replicas still costs time on every request.
- Many databases let you choose per request (for example a read at quorum versus a read from one replica).

## Interview questions

- **Why not choose CA?** A distributed system cannot rule out partitions, so it must decide what to do when one happens.
- **Would you pick CP or AP for a bank balance?** CP: refusing a transfer briefly is better than allowing a double spend.
- **And for a social feed?** AP: a slightly old feed is fine; being down is not.
- **How do quorums give strong reads?** With R + W > N, any read set shares a replica with the last write set.
- **What does last-write-wins lose?** A concurrent write with an older timestamp is discarded without any error.

Next: [Consistent Hashing](/notes/system-design/consistent-hashing) · Before this: [Database Sharding](/notes/system-design/database-sharding)
