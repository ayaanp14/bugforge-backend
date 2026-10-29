---
title: Design a URL Shortener
order: 13
minutes: 8
level: intermediate
updated: 2026-10-29
seo-title: Design a URL Shortener: System Design Case Study
description: Design a URL shortener like TinyURL, step by step: requirements, capacity estimate, base62 IDs, the write and read paths, caching and 301 vs 302 redirects.
question: How do you design a URL shortener?
answer: Generate a unique ID for each long URL, encode it in base62 to get a short code of six or seven characters, and store code and URL in a key-value store. On a read, look the code up in a cache, falling back to the database, and answer with an HTTP 301 or 302 redirect. Reads far outnumber writes, so caching and replication carry the load.
q: How long should a short code be?
a: Long enough for every URL you will ever store. With 62 characters, 6 characters give about 56.8 billion codes and 7 give about 3.5 trillion. Estimate the total rows over the system's life and pick the smallest length whose 62^n covers it, with room to spare.
q: Should I use a counter or a hash for the short code?
a: A counter encoded in base62 never collides and gives the shortest codes, but needs a distributed ID source and makes codes guessable in order. Hashing the URL and taking the first characters needs no coordination, but truncated hashes collide, so every write must check and retry.
q: Should a URL shortener use 301 or 302?
a: A 301 is permanent, so browsers and caches remember it and later clicks never reach your servers — less load but no click counts. A 302 is temporary, so every click comes back, which costs more traffic but lets you count clicks, change the target or expire the link.
q: Which database suits a URL shortener?
a: The data is one large table read by its key with no joins, so a key-value or wide-column store such as DynamoDB or Cassandra fits and shards easily. A relational database with an index on the code also works at moderate scale.
q: How do you generate unique IDs across many servers?
a: Give each server a range of IDs from a coordinator such as ZooKeeper or a database sequence, so it hands them out locally until the range runs out. Snowflake-style IDs, made of a timestamp, a machine number and a sequence, are another common choice.
---

The classic first system design question: small to state, and it touches estimation, ID generation, storage, caching and HTTP.

## Requirements

- **Functional**: shorten a long URL; redirect a short code to it; optional custom alias and expiry.
- **Non-functional**: redirects fast and highly available; codes unique and not easily guessed (if required).
- **Read-heavy**: a link is created once and opened many times.

## Capacity estimate

- State the assumptions, then derive QPS, storage and the code length.
- The figures below follow from these assumptions; change them and the numbers move.

@figure capacity

## API

```http
POST /api/shorten        {"url": "https://shop.example/item/48213"}  → 201 {"code": "2bYsMq"}
GET  /2bYsMq             → 302  Location: https://shop.example/item/48213
```

## Write path

- **Counter + base62**: a unique number per URL, encoded in 62 characters.
- No collisions by construction; the ID source must be shared or partitioned.
- Hand each server a **range of IDs** so it does not ask on every write.

@figure write-path

@figure base62

### Counter vs hash

| | Counter + base62 | Hash + truncate |
| --- | --- | --- |
| Collisions | None | Possible — check and retry |
| Coordination | Shared ID source | None |
| Same URL twice | New code each time | Same code (dedupes) |
| Guessable | Sequential unless shuffled | No |

## Read path

- Look the code up in a **cache** (Redis, memcached) first; database on a miss.
- Popular links stay hot, so most reads never reach the database.
- Unknown code → `404`; expired → `410 Gone`.

@figure read-path

## 301 vs 302

- **301 Moved Permanently**: browsers cache it; fewer requests reach you, but you lose click counts and cannot change the target.
- **302 Found**: every click comes back; analytics, edits and expiry work.
- Choose 302 when analytics matter, 301 when load matters most.

## Scaling it

- **Database**: key-value store [sharded](/notes/system-design/database-sharding) by code; [replicas](/notes/system-design/database-replication) for reads.
- **Stateless app servers** behind a [load balancer](/notes/system-design/load-balancing).
- **[Rate limiting](/notes/system-design/rate-limiting)** on `POST /shorten` against spam.
- **Analytics** off the hot path: write click events to a [queue](/notes/system-design/message-queues).

## Interview questions

- **How many characters does the code need?** Estimate total rows, then the smallest n with 62^n above it.
- **How do you avoid two servers issuing the same ID?** Pre-allocated ID ranges per server, or Snowflake-style IDs.
- **Where is the bottleneck?** Reads; a cache in front of a sharded key-value store absorbs them.
- **301 or 302?** 302 if you need click analytics or editable links; 301 to shed load.

Back to [System Design](/notes/system-design) · Before this: [Microservices and API Gateway](/notes/system-design/microservices-and-api-gateway)
