---
title: Server and network performance — latency budgets, percentiles, caching and the event loop under load
minutes: 13
---
A Node service is slow for reasons that rarely appear in a CPU profile: it waits — on a database 500 ms away, on ten sequential awaits that could be one, on a connection pool that is full, on a cold cache. The unit of performance here is **latency at the percentile users feel**, not CPU time, and the levers are round trips, caching, concurrency, and keeping the event loop free. This lesson covers how to think in latency budgets, why p99 matters more than the average, the round-trip arithmetic behind "count your awaits", caching layers and their invalidation, pools and backpressure, event-loop lag as the health metric of a Node process, and how to load-test before users do.

## Latency budgets and percentiles

Decide what "fast" means as a number with a percentile: *p95 of `/api/dashboard` under 300 ms*. **Percentiles**: p50 is the typical request, p95 the slow-but-common, p99 the tail. Averages are useless — a mean of 120 ms can hide 5% of requests at 3 s, which is 5% of users refreshing. Tails compound: a page making 10 parallel calls sees the *max* of 10 draws, so its p50 is roughly the calls' p93. Budget the tail: if the target is 300 ms and the database round trip is 50 ms, sequential calls are capped at five before there is nothing left for the rest.

## Round trips: count the awaits

```js
const user = await db.user(id);              // 50 ms to the database
const team = await db.team(user.teamId);     // another 50 — dependent, unavoidable
const [posts, badges] = await Promise.all([db.posts(id), db.badges(id)]);   // independent: one round trip, not two
```

In a topology where the database is far away (this repository's API is in Singapore, its MySQL in Phoenix — about 500 ms per round trip), the number of **sequential** awaits *is* the response time. Levers: run independent queries concurrently (`Promise.all`); replace N queries with one (`WHERE id IN (...)`, a join, a batch endpoint — the **N+1** problem is a loop of awaits); fetch only needed columns; cache composed payloads; move the compute next to the data (co-location is the biggest lever of all). The same arithmetic applies to a browser calling an API: waterfalls of dependent fetches are the classic slow page.

## Caching layers

A cache turns a slow, repeated read into a fast one at the price of **staleness** and **invalidation**:

- **In-process (L1)**: a bounded `Map`/LRU with a TTL — microseconds, per instance, lost on restart, inconsistent across instances.
- **Shared (L2)**: Redis/Memcached — a network hop (often 1–300 ms depending on where it is), shared by all instances.
- **HTTP**: `Cache-Control`, `ETag`/`If-None-Match`, CDNs — the fastest cache is the one in the browser or at the edge that never reaches you.

Patterns: **cache-aside** (check, miss → load → store), **stale-while-revalidate** (serve stale immediately, refresh in the background — module 12's checkpoint), **single-flight** (one loader per key at a time so a cache miss under load does not stampede the database — cache the promise, module 8), **write-through/invalidate-on-write** (delete or update the key when the data changes; broadcast the invalidation to other instances). Cache **composed payloads** (the dashboard object) rather than individual rows: one hit saves ten queries, and invalidation has one key. Namespace keys by environment/database so a local process pointed at a shared Redis cannot feed production its data — this repository learned that one the hard way.

## Pools and backpressure

A database allows N connections; a **pool** hands them out and queues callers beyond that. A slow query holds a connection; under load the queue grows and every request waits — latency climbs before CPU does. Size pools to the database's limit divided by your instance count, keep queries short, and add timeouts so a stuck connection is reclaimed. **Backpressure** is the same idea for streams (module 9) and for producers of any kind: when the consumer cannot keep up, slow the producer (bounded queues, `write()` returning false, `Promise` pools with a limit — module 8) rather than buffering without bound until memory runs out. Rate limiting (this repository's `middleware/rate-limit.ts`) is backpressure at the edge.

## The event loop under load

Node handles thousands of concurrent connections with one thread *only while that thread is free*. Any synchronous work — JSON parsing a 5 MB body, a regex with catastrophic backtracking (module 10), synchronous `fs`, a tight loop — blocks every other request for its duration. **Event-loop lag** (how late timers fire: `perf_hooks.monitorEventLoopDelay()`, or a `setInterval` that measures its own drift) is the single best health metric of a Node process: p99 lag over ~50–100 ms means requests are queuing behind CPU work. Fixes: move CPU work to workers, stream large bodies, cap body sizes (`express.json({ limit })`), and never `readFileSync` in a request handler. `cluster`/multiple processes use the other cores; each is still one loop.

## Payloads and the wire

Compress responses (`compression` middleware, Brotli/gzip — text shrinks 5–10×); send only needed fields; paginate lists (cursor-based for large tables); stream large responses; keep connections alive (HTTP keep-alive / HTTP/2 multiplexing); set cache headers; put static assets on a CDN with immutable hashed names (module 14). On the browser side, the order of requests (critical first), preloading, and avoiding request waterfalls decide the perceived speed more than any server optimisation.

## Load testing

Before users do: `autocannon`/`k6`/`wrk` against a staging environment with production-like data, ramping concurrency while watching p50/p95/p99, error rate, event-loop lag, pool queue length and memory. Find the **knee** — the concurrency where latency starts climbing — and the failure mode past it (timeouts? memory? pool exhaustion?). Then fix the first bottleneck and repeat; the knee moves. A load test that only reports requests-per-second at a fixed concurrency tells you little.

## Observability

Record per-request duration, route, status and the time spent in each dependency (database, cache, external API); export histograms; alert on p99 and error rate per route; correlate deploys with regressions. Structured logs with a request id let you follow one slow request across services. This is the production half of "measure first" — laboratory profiles find CPU hot spots; only production telemetry finds the slow database, the cold cache and the queueing pool.

## Common mistakes

- Sequential awaits for independent work; N+1 queries; fetching whole rows and whole tables.
- Unbounded or un-namespaced caches; cache stampedes on miss; caching rows instead of payloads.
- Synchronous CPU work or `fs` in request handlers; huge bodies parsed in memory.
- Pool sizes larger than the database allows (times the instance count); no query timeouts.
- Reporting averages; load testing without percentiles or lag; optimising CPU when the profile is 95% waiting.

## Interview angle

- *"Why p99 and not the average?"* Tails are where users suffer and where fan-out compounds; averages hide both the typical case and the tail.
- *"What is the N+1 problem?"* A query per item in a loop — n round trips instead of one batch query; fix with `IN`/joins or a batch endpoint.
- *"How do you keep a Node server responsive?"* Keep the loop free: workers for CPU, streams for large data, body limits, no sync I/O; watch event-loop lag.
- *"Cache-aside versus stale-while-revalidate?"* Miss → load → store versus serve stale now and refresh in the background; single-flight prevents stampedes.
- *"What is backpressure on a server?"* Bounded queues and pools that slow producers when consumers cannot keep up, instead of buffering until memory runs out.

## Key takeaways

- Set latency budgets at percentiles; tails compound under fan-out; averages hide everything.
- Response time ≈ sequential round trips: `Promise.all` independent work, batch N+1, cache composed payloads, co-locate.
- Caches: L1 bounded + L2 shared + HTTP; cache-aside, SWR, single-flight; invalidate on write; namespace keys.
- Pools and bounded queues are backpressure; event-loop lag is the health metric; CPU work leaves the loop.
- Compress, paginate, stream, keep-alive; load-test to the knee with percentiles; observe per route in production.
