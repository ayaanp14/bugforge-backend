---
title: Back-of-the-Envelope Estimation
order: 14
minutes: 6
level: beginner
updated: 2026-11-14
seo-title: Back-of-the-Envelope Estimation for System Design
description: Estimate QPS, peak load, storage and bandwidth in a system design interview: powers of two, latency numbers and a worked example, animated step by step.
question: What is back-of-the-envelope estimation in system design?
answer: Back-of-the-envelope estimation is a quick calculation, from stated assumptions, of the load a system must handle — requests per second, peak traffic, storage and bandwidth. It uses rounded numbers and orders of magnitude, not precision, to decide which parts of the design are needed: a cache, replicas, sharding or a CDN.
q: How do you calculate QPS from daily active users?
a: Multiply daily active users by the requests each makes a day, then divide by 86,400, the seconds in a day. Multiply the average by a peak factor, often two to five, which you state as an assumption.
q: Why is 86,400 rounded to 100,000?
a: Dividing by 10^5 is easy in your head and keeps the answer within the same order of magnitude. The result is about 14% low, which an estimate can live with; say that you rounded.
q: How do you estimate storage for a system?
a: Multiply writes per day by the bytes each write stores and by the days you keep the data. Then multiply by the number of copies kept for durability, and add room for indexes and metadata.
q: Which latency numbers should I remember for interviews?
a: Orders of magnitude, not exact values: memory in nanoseconds, an SSD read around a hundred microseconds, a round trip inside a datacenter around half a millisecond, a disk seek in milliseconds and a cross-ocean round trip around a hundred milliseconds or more.
q: How precise does an estimate need to be?
a: Within an order of magnitude. Its job is to tell you whether one server is enough, whether reads dominate writes and whether data fits on one machine — decisions that do not change between 5,000 and 6,000 QPS.
---

An estimate turns vague scale ("lots of users") into numbers that pick the design. State assumptions, round hard, and keep the units.

## Numbers to carry

- **Seconds in a day**: 86,400 ≈ 10^5.
- **Powers of two** read as powers of ten: 2^10 ≈ a thousand (KB), 2^20 ≈ a million (MB), 2^30 ≈ a billion (GB).
- **Sizes**: a character ≈ 1 byte, an ID 8 bytes, a text row ≈ 1 KB, a photo ≈ hundreds of KB, a minute of video ≈ megabytes.

@figure powers-of-two

## Latency numbers

- Commonly quoted orders of magnitude, not benchmarks; hardware varies.
- **Memory** answers in nanoseconds.
- **SSD** reads in about a hundred microseconds.
- **Network** round trip in a datacenter: about half a millisecond.
- **Disk seek**: milliseconds. **Across an ocean**: a hundred milliseconds or more.
- So: keep hot data in memory, avoid sequential round trips, put data near users.

@figure latency-human

## The method

1. **Assume** daily active users (DAU) and actions per user. Say them out loud.
2. **Requests a day** = DAU × actions.
3. **Average QPS** = requests a day ÷ 86,400.
4. **Peak QPS** = average × a peak factor (often 2–5×).
5. **Storage** = writes a day × bytes each × days kept × copies.
6. **Bandwidth** = QPS × bytes per request, in and out.

## Worked example: a photo app

Assume 10M DAU, 50 photo views and 0.2 uploads per user a day, 500 KB a photo, a 3× peak.

@figure qps

- Reads outnumber writes about 250 to 1: design the read path first.
- About 17K reads a second at peak: several app servers and a cache.

@figure storage

- About 1 TB a day: object storage with metadata in a database.
- Copies multiply the total, so count them.

@figure bandwidth

- Outbound traffic dwarfs inbound: put a [CDN](/notes/system-design/content-delivery-networks) in front.

```game
type: pick
title: Roughly how big?
prompt: Each round is a quick estimate. Pick the order of magnitude.
? 1 million requests a day — the average requests per second?
- About 1
* About 12
- About 120
- About 1,200
> 1,000,000 ÷ 86,400 ≈ 11.6, so about 12 a second.
? 100M daily users, 10 requests each — the average QPS?
- About 1,200
* About 12,000
- About 120,000
> 10^9 requests ÷ 86,400 seconds ≈ 11,600 a second.
? 1 billion rows of 1 KB each — the storage?
- About 1 GB
* About 1 TB
- About 1 PB
> 10^9 × 10^3 bytes = 10^12 bytes, a terabyte.
? 10M uploads a day at 2 MB each, kept for a year — before copies?
- About 7 TB
- About 70 TB
* About 7 PB
> 10M × 2 MB = 20 TB a day; × 365 ≈ 7,300 TB, about 7 PB.
? 5,000 responses a second at 200 KB each — the outbound bandwidth?
- About 1 MB/s
* About 1 GB/s
- About 1 TB/s
> 5,000 × 200 KB = 1,000,000 KB a second, about 1 GB/s.
? 2^30 bytes is roughly…
- A megabyte
* A gigabyte
- A terabyte
> 2^30 = 1,073,741,824, about a billion bytes.
```

## Common mistakes

- Skipping assumptions: the interviewer cannot follow, or correct, a number with no source.
- Forgetting the peak: average load hides the evening spike.
- Mixing bits and bytes: network links are sold in bits per second.
- Chasing precision: 5,787 and 6,000 lead to the same design.
- Estimating and then ignoring the result: every number should change a box in the diagram.

## Interview questions

- **How many seconds are in a day?** 86,400 — round to 10^5 and say so.
- **How do you get peak QPS?** Average QPS times a stated peak factor, often 2–5×.
- **Why estimate storage per year?** It decides whether data fits on one machine or needs sharding and object storage.
- **Your service sends 10 GB/s. What follows?** One server's network card cannot carry it: spread it over many servers and serve static bytes from a CDN.

Next: [How to Answer a System Design Interview](/notes/system-design/system-design-interview-framework) · Before this: [Design a URL Shortener](/notes/system-design/design-a-url-shortener)
