---
title: Rate Limiting
order: 11
minutes: 6
level: intermediate
updated: 2026-10-29
seo-title: Rate Limiting in System Design, Animated
description: Rate limiting for system design interviews: token bucket, leaky bucket, fixed and sliding windows, Redis counters and 429, shown as looping animations.
question: What is rate limiting in system design?
answer: Rate limiting caps how many requests a client may make in a period, such as 100 requests a minute per API key. Requests over the limit are refused, usually with HTTP 429 Too Many Requests. It protects servers from overload and abuse, keeps one client from starving others, and is built with algorithms such as token bucket, leaky bucket, fixed window and sliding window.
q: Why do we need rate limiting?
a: Without a limit, one buggy script, scraper or attacker can send enough requests to slow or crash a service for everyone. A limit caps each client's share, protects expensive resources such as databases and paid third-party APIs, and blunts brute-force login attempts.
q: What is the difference between token bucket and leaky bucket?
a: A token bucket lets a burst through up to its capacity, then holds clients to the refill rate. A leaky bucket queues requests and sends them on at a constant rate, so the output is smooth but a burst waits or is dropped when the queue is full.
q: What is the problem with a fixed window counter?
a: Counters reset at the window edge, so a client can send the full limit at the end of one window and the full limit again at the start of the next. That lets twice the limit through within a few seconds, which a sliding window prevents.
q: How do you rate limit across many servers?
a: Keep the counters in a shared store such as Redis, so every server sees the same count for a client. An atomic increment with an expiry, or a small Lua script for token bucket, avoids two servers both admitting the last allowed request.
q: What HTTP status code is used for rate limiting?
a: 429 Too Many Requests. A good response also carries a Retry-After header saying how many seconds to wait, and many APIs send headers with the limit, the requests remaining and when the window resets, so clients can slow down before they are refused.
---

A rate limiter decides, per client, whether a request may go through now or must be refused.

## Why limit

- **Stops overload**: one client cannot use all the capacity.
- **Fairness**: every user, key or tenant gets a share.
- **Abuse and cost**: slows brute-force logins and scraping, and caps spend on paid downstream APIs.
- **Key by** user ID, API key, IP address (for anonymous traffic) or endpoint — often several limits at once.

## Token bucket

- A bucket holds up to **capacity** tokens and gains tokens at a fixed **refill rate**.
- Each request takes one token; no token → **429**.
- Allows bursts up to the capacity, then holds the client to the refill rate.
- Two numbers per client (tokens, last refill time) — cheap to store.
- The most common choice for public APIs.

@figure token-bucket

## Leaky bucket

- Requests enter a fixed-size **queue**; the server takes them out at a **constant rate**.
- A full queue drops new requests.
- Output is perfectly smooth — good for protecting a fragile downstream.
- A burst waits in line, so it adds latency, and old requests can block new ones.

@figure leaky-bucket

## Fixed window counter

- One counter per client per window (say per minute); reset when the window changes.
- Simplest to build: one atomic increment with an expiry.
- **Boundary burst**: the full limit at the end of one window plus the full limit at the start of the next.

@figure fixed-window

## Sliding window

- **Sliding log**: store each accepted request's timestamp; count those in the last window. Exact, but memory grows with the limit.
- **Sliding counter**: keep this window's and the previous window's counts and weight the previous one by how much of it still overlaps. Close to exact with two numbers.

@figure sliding-window

## Comparing them

| | Bursts | Memory per client | Accuracy |
| --- | --- | --- | --- |
| Token bucket | Up to capacity | 2 numbers | Good |
| Leaky bucket | Queued, smoothed | Queue | Good |
| Fixed window | 2× at the edge | 1 counter | Weak at edges |
| Sliding log | None | 1 timestamp per request | Exact |
| Sliding counter | Small | 2 counters | Approximate |

## Where it runs

- **API gateway or load balancer**: one place for every service, before the work starts.
- **In the service**: for limits that need business data (per plan, per tenant).
- **Distributed counters in Redis**: every server reads and writes the same count. Make the check-and-increment atomic (`INCR` plus `EXPIRE`, or a Lua script) so two servers cannot both admit the last request.
- **Fail open or closed**: if the counter store is down, decide whether to let traffic through or refuse it.

Tell the client what happened and when to retry:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{"error": "rate limit exceeded, retry in 30 seconds"}
```

## Interview questions

- **Which algorithm would you choose for a public API?** Token bucket: it allows short bursts, holds the long-run rate, and needs two numbers per client.
- **Why is a fixed window not enough?** Its reset lets up to twice the limit through around a window edge; a sliding window removes that.
- **How do you limit across ten API servers?** Shared counters in Redis with atomic updates, or a gateway that sees all traffic.
- **What does the client get when limited?** A 429 with Retry-After, so well-behaved clients back off instead of hammering.

Next: [Microservices and API Gateway](/notes/system-design/microservices-and-api-gateway) · Before this: [Message Queues](/notes/system-design/message-queues)
