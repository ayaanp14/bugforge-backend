---
title: Scalability
order: 2
minutes: 7
level: beginner
updated: 2026-10-29
seo-title: Scalability in System Design: Vertical vs Horizontal
description: Scalability for system design interviews: vertical vs horizontal scaling, stateless servers, latency vs throughput and moving bottlenecks, each animated.
question: What is scalability in system design?
answer: Scalability is a system's ability to handle more load — users, requests or data — by adding resources, without a redesign and without performance falling apart. You scale vertically by buying a bigger machine or horizontally by adding more machines, which works best when servers are stateless and the data tier is planned for growth.
q: What is the difference between vertical and horizontal scaling?
a: Vertical scaling (scaling up) moves the work to a bigger machine with more CPU, memory or disk; it is simple but has a hard ceiling and leaves one point of failure. Horizontal scaling (scaling out) adds more machines behind a load balancer; it has no fixed ceiling and survives a machine dying, but needs stateless servers and distributed data.
q: What is a stateless server?
a: A stateless server keeps no client data between requests in its own memory. Sessions, carts and uploads live in a shared store such as Redis or a database, so any server can answer any request, servers can be added or removed freely, and a crash loses nothing.
q: What is the difference between latency and throughput?
a: Latency is how long one request takes, measured in milliseconds. Throughput is how many requests the system completes per second. They are linked: as throughput approaches capacity, requests queue and latency climbs sharply, so systems run with headroom.
q: Why do we look at p99 latency instead of the average?
a: The average hides the slow tail. The 99th percentile is the time within which 99% of requests finish, so it shows what the slowest one in a hundred users experiences — and a page that makes many calls hits some tail request on most loads.
q: What is a bottleneck in system design?
a: A bottleneck is the component that reaches its limit first and so caps the whole system's throughput. Scaling anything else does not help. Fixing one usually moves the bottleneck elsewhere — often from the app tier to the database.
---

Scalability is handling more load by adding resources, without rewriting the system.

## Scale up or scale out

- **Vertical (scale up)**: a bigger machine — more CPU, RAM, faster disk.
  - Simple: no code changes, no distributed problems.
  - A hard ceiling, cost rises steeply near the top, still one point of failure.
- **Horizontal (scale out)**: more machines behind a [load balancer](/notes/system-design/load-balancing).
  - No fixed ceiling; one machine failing loses a fraction of capacity.
  - Needs stateless servers and a data tier that can be split.
- Real systems do both: scale up until it gets expensive, then scale out.

@figure up-vs-out

## Stateless servers

- **Stateful**: the session lives in one server's memory — clients must stick to it, and a crash logs them out.
- **Stateless**: every request carries what is needed (a token) or the server reads shared state (Redis, a database).
- Stateless servers make scale-out trivial: add, remove or replace any server at any time.
- The state still exists; it moved to a store built to be shared and replicated.

@figure stateful-vs-stateless

## Latency vs throughput

- **Latency**: time for one request (ms). Watch **p95/p99**, not just the average.
- **Throughput**: requests completed per second.
- Near capacity, requests wait in queues: throughput flattens while latency shoots up.
- Rule of thumb: plan for peak load with headroom (many teams target well under full utilisation).

@figure latency-throughput

## Bottlenecks move

- The bottleneck is whichever component saturates first; nothing else matters until it is fixed.
- Stateless app servers scale out easily, so the **database** is usually next.
- Ways to relieve the data tier:
  - [Caching](/notes/system-design/caching) for repeated reads.
  - [Read replicas](/notes/system-design/database-replication) for read-heavy load.
  - [Sharding](/notes/system-design/database-sharding) when writes or data outgrow one machine.
  - [Queues](/notes/system-design/message-queues) to absorb bursts and move slow work off the request path.

@figure bottleneck

## Comparison

| | Vertical | Horizontal |
| --- | --- | --- |
| How | Bigger machine | More machines |
| Ceiling | The largest machine | Practically none |
| Failure | One box down = outage | One box down = less capacity |
| Complexity | Low | Load balancing, shared state, distributed data |
| Typical fit | Early stage, databases | Stateless web/app tiers |

## Interview questions

- **How would you scale a web app from one server?** Separate the database, make app servers stateless, add a load balancer and more servers, then cache, add read replicas and shard.
- **Why not always scale vertically?** There is a largest machine, the price climbs steeply, and one machine is a single point of failure.
- **Where do sessions go in a scaled-out system?** In a shared store such as Redis, or in a signed token the client sends with each request.
- **Your p99 latency spiked but average CPU is low — what do you check?** A saturated dependency (database, lock, connection pool), queueing, garbage collection pauses or one slow instance.

Next: [Load Balancing](/notes/system-design/load-balancing) · Before this: [Introduction to System Design](/notes/system-design/introduction-to-system-design)
