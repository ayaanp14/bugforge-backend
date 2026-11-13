---
title: Design Search Autocomplete (Typeahead)
order: 22
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Design Search Autocomplete (Typeahead System Design)
description: Design a search autocomplete system: a trie with top-k suggestions per prefix, ranking by frequency, the offline rebuild pipeline, caching and sharding.
question: How do you design a search autocomplete system?
answer: Store popular queries in a trie and keep, at every prefix node, the top few queries below it ranked by frequency. A keystroke walks one node down and returns that stored list. An offline pipeline aggregates query logs, rebuilds the trie periodically and swaps it onto replicated, cached servers, sharded by prefix when it outgrows one machine.
q: What data structure is used for autocomplete?
a: A trie (prefix tree): each node is one character, so every query sharing a prefix shares the path to it. Storing the top suggestions at each node turns a lookup into a walk of the prefix's length plus one read.
q: Why store the top-k suggestions at every trie node?
a: Without them, a short prefix like "t" would need a scan of its whole subtree on every keystroke. Precomputing the lists offline costs memory but makes each lookup fast and predictable.
q: How are autocomplete suggestions ranked?
a: Commonly by how often the query was searched over a recent window, often weighted towards recent days. Real systems add signals such as personal history, location and freshness, and filter out unsafe or unwanted queries.
q: How often is the autocomplete trie updated?
a: It is usually rebuilt periodically from aggregated logs — hourly, daily or weekly depending on how fresh suggestions must be — rather than updated on every search. Trending topics can be handled by a smaller, faster path.
q: How do you scale an autocomplete service?
a: Replicate the trie for read throughput, cache responses for popular prefixes at the edge or in the browser, and shard by prefix when the trie no longer fits one machine, splitting busy prefixes further so shards carry similar load.
---

Autocomplete suggests whole queries while the user types. It is read-heavy, latency-critical (every keystroke) and tolerant of slightly stale results.

## Requirements

- **Functional**: given a prefix, return the top 5–10 queries; ranked by popularity.
- **Non-functional**: fast enough to keep up with typing, so the latency target is agreed up front; highly available; suggestions may lag new trends a little.
- **Scale**: one request per keystroke, so several requests per search — estimate it with [back-of-the-envelope numbers](/notes/system-design/back-of-the-envelope-estimation).

## The trie

- One node per character; queries sharing a prefix share its path.
- A node that ends a query keeps its **count** (how often it was searched).

@figure build

## Top k at every node

- Each node stores its **top k queries** below it.
- Built bottom-up: a node merges its own query with its children's lists.
- Costs memory; buys a lookup with no subtree scan.

@figure top-k

## Serving a keystroke

- Walk one node per typed character, return the stored list.
- Cost grows with the prefix length, not with how many queries it matches.
- Debounce in the client, and cache short prefixes — they are the hottest.

@figure lookup

## Data collection and rebuild

- Every search is **logged**, off the serving path.
- An **aggregator** counts queries per window; old windows may weigh less.
- A **builder** makes a new trie periodically; replicas swap to it one at a time.
- The serving trie is **read-only**: no locks on the hot path.

@figure pipeline

```game
type: pick
title: Autocomplete design choices
prompt: Each round is a design decision. Pick the better option.
? Where are the top-k lists computed?
* Offline, when the trie is built
- At query time, by scanning the subtree
> Building them once keeps every keystroke a short walk plus one read.
? A search happens. When does its count update the trie?
- Immediately, in the serving trie
* In the next periodic rebuild from the logs
> Writing on every search would contend with reads; suggestions can lag slightly.
? The trie no longer fits on one server.
* Shard by prefix, splitting busy prefixes further
- Shard by the first letter only, a–z on 26 servers
> Letters are uneven; splitting by measured load keeps shards balanced.
? Users type "a" thousands of times a second.
* Cache the answers for short prefixes
- Add an index on the queries table
> Short prefixes are few and hot, so cached responses absorb them.
? A query is offensive. How do you keep it out?
- Rebuild the trie from scratch now
* Filter it through a blocklist before serving and in the next build
> A filter acts at once; the rebuild removes it for good.
```

## Scaling it

- **Replicas** of the trie for read throughput; a [load balancer](/notes/system-design/load-balancing) in front.
- **Caching**: browser and [CDN](/notes/system-design/content-delivery-networks) for popular prefixes, a [cache](/notes/system-design/caching) beside the service.
- **Sharding by prefix**: ranges like `a–ap`, `aq–c`, sized by traffic, not by letter.
- **Filtering**: a blocklist for unsafe queries, applied before results leave.
- **Personal or trending results**: blended from a smaller, faster path.

## Interview questions

- **Why a trie and not a database LIKE query?** A `LIKE 'pre%'` query ranks matches on every request; a trie with stored top k answers in a walk and a read.
- **How do you rank suggestions?** By search frequency over a recent window, then adjusted by freshness, personalisation and filters.
- **How do new trends appear?** At the next rebuild; for faster trends, a short-window counter blended into the results.
- **How do you shard?** By prefix range, with busy prefixes split further so each shard has similar traffic.

Next: back to [System Design](/notes/system-design) · Before this: [Design a Web Crawler](/notes/system-design/design-a-web-crawler)
