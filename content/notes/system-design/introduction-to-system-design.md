---
title: Introduction to System Design
order: 1
minutes: 7
level: beginner
updated: 2026-10-29
seo-title: Introduction to System Design: Requirements to Estimates
description: System design basics for interviews: a request's life, HLD vs LLD, functional vs non-functional requirements, back-of-the-envelope estimates and latency.
question: What is system design?
answer: System design is deciding how the parts of a software system fit together to meet its requirements: which components exist, how requests flow between them, where data lives and how the whole stays fast and available as load grows. Interviews test it by asking you to design a real product end to end.
q: What is the difference between HLD and LLD?
a: High-level design (HLD) is the architecture: the components, how they talk, where data is stored and how it scales. Low-level design (LLD) is inside one component: classes, interfaces, database schemas and algorithms. System design interviews are mostly HLD; machine-coding rounds are LLD.
q: What are functional and non-functional requirements?
a: Functional requirements say what the system does, such as shortening a URL or sending a message. Non-functional requirements say how well it does it: latency, availability, throughput, durability, consistency and cost. The non-functional ones usually decide the architecture.
q: How do you calculate QPS in a system design interview?
a: Multiply daily active users by requests per user per day, then divide by 86,400 seconds in a day for the average. Multiply by a peak factor, often two to five times, for the load you must actually handle. Round freely; the order of magnitude is what matters.
q: How do I start a system design interview?
a: Clarify requirements first: the features in scope, the users and scale, and the non-functional targets. Then estimate load and storage, sketch a high-level design, go deep on one or two components, and finish with bottlenecks and trade-offs.
q: Why do latency numbers matter in system design?
a: They tell you where time goes. Memory is nanoseconds, a disk or network round trip is micro- to milliseconds, and a cross-ocean round trip is about a hundred milliseconds or more. Knowing that gap explains why designs cache, batch and avoid round trips.
---

System design is choosing the parts of a system and how they work together, so it meets its requirements at the scale it must serve.

## A request's life

- **DNS** turns a name into an IP address (cached by browser and OS).
- The **app server** runs the logic; it should keep no state of its own.
- The **database** holds the state; it is usually the hardest part to scale.
- Every arrow is a **network round trip** — each costs time.
- Real systems add pieces on this path: a [load balancer](/notes/system-design/load-balancing), a [cache](/notes/system-design/caching), a [CDN](/notes/system-design/content-delivery-networks).

@figure request-life

## HLD vs LLD

| | High-level design (HLD) | Low-level design (LLD) |
| --- | --- | --- |
| Scope | The whole system | One component |
| Artefacts | Boxes and arrows, data flow | Classes, interfaces, schemas |
| Questions | Where does data live? How does it scale? | Which class owns this? Which pattern? |
| Interview | "Design a URL shortener" | "Design a parking lot's classes" |

## Requirements come first

- **Functional**: what the system does — features, inputs, outputs.
- **Non-functional**: how well — latency, availability, throughput, durability, consistency, cost.
- Ask about both before drawing anything; agree what is out of scope.
- Non-functional targets pick the architecture: a 99.99% target needs redundancy everywhere, a 10 ms target needs caching.

@figure requirements

## Back-of-the-envelope estimation

- **QPS** = daily users × requests per user ÷ 86,400 seconds.
- **Peak** = average × a peak factor (often 2–5×; state your assumption).
- **Storage** = writes per day × bytes per write × days kept.
- Also worth a line: read/write ratio, bandwidth (QPS × response size), memory for a cache of the hot set.
- Round to friendly numbers: 86,400 ≈ 100,000 is fine for an order of magnitude.

@figure estimate

## Latency numbers worth knowing

- Approximate orders of magnitude, not benchmarks — hardware varies.
- Memory: nanoseconds. SSD: around a hundred microseconds. Same-datacenter round trip: around half a millisecond.
- Spinning-disk seek: milliseconds. Cross-ocean round trip: about a hundred milliseconds or more.
- Lessons: keep hot data in memory, read sequentially, batch work, and put data near users.

@figure latency-ladder

## A framework for the interview

1. **Clarify** requirements, users and scale (5 minutes).
2. **Estimate** QPS, storage and bandwidth.
3. **Sketch** the high-level design: clients, services, data stores.
4. **Deep dive** into one or two components the interviewer cares about.
5. **Wrap up** with bottlenecks, failure modes and trade-offs.

## Interview questions

- **What do you ask first?** The features in scope, who the users are, the scale, and the latency and availability targets.
- **How many seconds are in a day?** 86,400 — round to 100,000 for quick estimates.
- **Why is the database usually the bottleneck?** App servers are stateless and easy to add; the data has to stay correct in one place, which is harder to split.
- **What is the difference between availability and durability?** Availability is whether the system answers right now; durability is whether stored data survives failures.

Next: [Scalability](/notes/system-design/scalability)
