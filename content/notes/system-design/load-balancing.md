---
title: Load Balancing
order: 3
minutes: 6
level: beginner
updated: 2026-10-29
seo-title: Load Balancing in System Design, Animated
description: Load balancing for system design interviews: round robin, least connections, IP hash and health checks, each shown as a looping animation with key points.
question: What is load balancing in system design?
answer: Load balancing spreads incoming requests across several servers so no single server is overloaded and a failed server stops receiving traffic. A load balancer sits between clients and servers, picks a server for each request with an algorithm such as round robin, least connections or IP hash, and runs health checks to route around failures.
q: Why do we need a load balancer?
a: One server has a ceiling on requests per second and is a single point of failure. A load balancer lets you add servers behind one address, spreads the work across them and stops sending traffic to a server that fails its health checks.
q: What is the difference between round robin and least connections?
a: Round robin hands requests out in a fixed order and ignores how busy each server is. Least connections counts each server's open connections and picks the fewest, so it copes better when some requests take much longer than others.
q: What is the difference between an L4 and an L7 load balancer?
a: An L4 balancer routes on IP addresses and ports without reading the request, so it is fast and protocol-agnostic. An L7 balancer reads HTTP — paths, headers, cookies — so it can route /api and /images to different pools, terminate TLS and rewrite requests, at more cost per request.
q: Is the load balancer itself a single point of failure?
a: It would be if there were only one. In practice balancers run as a pair or a fleet — active-passive with a floating IP, or several behind DNS — and managed balancers such as AWS ELB are redundant by design.
q: What are sticky sessions?
a: Sticky sessions send every request from one user to the same server, by a cookie or by hashing the client's IP. They help when sessions live in a server's memory, but they unbalance load and lose sessions when that server goes away; storing sessions in Redis avoids both.
---

A load balancer is the front door of a scaled system: clients talk to one
address, and it decides which server answers each request.

## What a load balancer does

- **Spreads load** across a pool of identical servers.
- **Hides failures**: health checks take a broken server out of rotation.
- **Enables horizontal scaling**: add a server to the pool, no client changes.
- **Optional extras (L7)**: TLS termination, path-based routing, compression.

## Algorithms

### Round robin

- Servers take requests in a fixed order: S1, S2, S3, S1 …
- Zero state, zero cost — but blind to how busy a server is.
- **Weighted round robin**: a bigger server gets more turns.

@figure round-robin

### Least connections

- Counts open connections per server; the next request goes to the fewest.
- Best when request durations vary (uploads, websockets, slow queries).

@figure least-connections

### IP hash (sticky routing)

- `server = hash(client IP) mod N` — the same client lands on the same server.
- Useful when session state lives in server memory.
- Changing N remaps most clients — see [consistent hashing](/notes/system-design/consistent-hashing).

@figure ip-hash

## Health checks

- The balancer polls an endpoint such as `/health` every few seconds.
- **Fall threshold**: out of rotation after N misses in a row (not one blip).
- **Rise threshold**: back in after N passes in a row.
- Users never see the dead server's errors.

@figure health-checks

## L4 vs L7

| | L4 (transport) | L7 (application) |
| --- | --- | --- |
| Reads | IP, port | URL, headers, cookies |
| Speed | Faster | Slower per request |
| Routing | Per connection | Per request, by path or header |
| TLS | Passes through | Can terminate |
| Examples | AWS NLB, LVS | Nginx, HAProxy, AWS ALB |

## Interview questions

- **Where does a load balancer sit?** Between clients and app servers, and often again between app servers and internal services.
- **Which algorithm would you pick?** Round robin for short, uniform requests; least connections when durations vary; hashing when a client must stick to a server.
- **How do you avoid the balancer being a single point of failure?** Run two or more (active-passive with a floating IP, or several behind DNS).
- **Why keep servers stateless?** Any server can take any request, so the balancer is free to choose and a lost server loses no sessions.

Next: [Caching](/notes/system-design/caching) · Before this: [Scalability](/notes/system-design/scalability)
