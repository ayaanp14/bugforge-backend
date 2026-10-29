---
title: Microservices and API Gateway
order: 12
minutes: 7
level: intermediate
updated: 2026-10-29
seo-title: Microservices and API Gateway in System Design
description: Microservices vs monolith, the API gateway, service discovery and circuit breakers for system design interviews, each shown as a looping animation.
question: What are microservices and what does an API gateway do?
answer: Microservices split an application into small services that each own one business capability and its data, and are deployed on their own. An API gateway is the single entry point in front of them: it routes each request to the right service and handles shared concerns such as authentication, rate limiting and TLS once, at the edge.
q: What is the difference between a monolith and microservices?
a: A monolith is one codebase deployed as one unit, so any change redeploys everything but calls between modules are cheap function calls. Microservices are separate deployables talking over the network, so teams ship independently and scale parts separately, at the cost of network failures, distributed data and more operations work.
q: When should you not use microservices?
a: For a small team or a new product whose boundaries are still moving. The network calls, deployments, monitoring and data consistency work cost more than they save until the system and the organisation are large enough that one deployable slows everyone down.
q: Why use an API gateway?
a: Clients get one address instead of knowing every service, and cross-cutting work such as authentication, rate limiting, TLS termination, request logging and response aggregation is done once instead of in every service. Services can then be split or moved without changing clients.
q: What is service discovery?
a: A way for services to find each other's current addresses. Instances register with a registry such as Consul, etcd or Eureka and send heartbeats; callers look up a service by name. In Kubernetes, DNS names and Services do this for you.
q: What is a circuit breaker?
a: A wrapper around calls to a dependency that stops calling it after repeated failures. While open it fails fast instead of waiting on timeouts, then lets a probe through after a cool-down and closes again if the dependency has recovered. It stops one failing service from exhausting its callers.
q: How do microservices share data?
a: Each service owns its database and others reach that data only through its API or events. Work that spans services uses events and sagas, with compensating actions instead of one distributed transaction.
---

Microservices trade one big deployable for many small ones; the gateway, the registry and the circuit breaker are the parts that keep many small ones usable.

## Monolith vs microservices

- **Monolith**: one codebase, one deploy, in-process calls, one database.
- **Microservices**: one service per business capability, each with its own code, data and deploy.
- A change ships as its **deploy unit** — the whole app, or one service.

@figure monolith-vs-services

| | Monolith | Microservices |
| --- | --- | --- |
| Deploy | Everything at once | One service at a time |
| Scaling | Whole app | Per service |
| Calls | Function calls | Network calls that can fail |
| Data | One database, joins and transactions | Database per service, events |
| Best for | Small teams, new products | Many teams, clear boundaries |

- Start with a well-structured monolith; split along boundaries that have proven stable.

## API gateway

- One entry point for every client (web, mobile, partners).
- **Routes** by path or host: `/orders/*` → orders service.
- **Cross-cutting work once**: authentication, [rate limiting](/notes/system-design/rate-limiting), TLS, logging, CORS.
- Can **aggregate** several service calls into one response for a client.
- Run it as a redundant fleet behind a [load balancer](/notes/system-design/load-balancing) — it sits on every request path.

@figure api-gateway

## Service discovery

- Instances change address as they scale, deploy and crash.
- **Registry**: instances register and heartbeat; entries expire after a TTL.
- **Client-side**: the caller looks up the list and picks an instance.
- **Server-side**: the caller hits a load balancer that does the lookup.

@figure service-discovery

## Circuit breaker

- A slow dependency ties up its callers' threads and connections, and the failure **cascades** upward.
- **Closed**: calls pass; failures are counted.
- **Open**: calls fail fast for a cool-down.
- **Half-open**: one probe call; success closes, failure opens again.
- Pair it with **timeouts**, **retries with backoff** and a **fallback** (cached or default answer).

@figure circuit-breaker

## Communication and data

- **Synchronous**: REST or gRPC — simple, but the caller waits and shares the callee's failures.
- **Asynchronous**: events through a [message queue](/notes/system-design/message-queues) — decoupled, eventually consistent.
- **Database per service**; no reaching into another service's tables.
- Cross-service workflows use **sagas** with compensating steps.

## Interview questions

- **Would you start with microservices?** Usually not; a modular monolith first, then split where team or scaling needs prove it.
- **What does an API gateway do that a load balancer does not?** It understands requests: authentication, rate limits, routing by path, aggregation.
- **How do services find each other?** A registry with heartbeats and TTLs, or the platform's DNS, as in Kubernetes.
- **How do you stop one slow service taking down the rest?** Timeouts, a circuit breaker that fails fast, and a fallback.

Next: [Design a URL Shortener](/notes/system-design/design-a-url-shortener) · Before this: [Rate Limiting](/notes/system-design/rate-limiting)
