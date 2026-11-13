---
title: Design a Web Crawler
order: 21
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Design a Web Crawler: System Design Case Study
description: Design a web crawler step by step: the URL frontier, BFS over links, per-host politeness, robots.txt, URL and content dedup, and distributed fetchers.
question: How do you design a web crawler?
answer: Start from seed URLs in a frontier queue. Fetchers take URLs from it, download each page, store it, extract its links, normalise them and add the unseen ones back to the frontier, crawling the link graph breadth first. Per-host queues keep the crawler polite, robots.txt decides what may be fetched, and URL and content hashes stop the same page being crawled twice.
q: Why does a crawler use BFS rather than DFS?
a: Breadth-first search reaches the pages closest to the seeds first, which tend to be the most important ones, and spreads requests across many sites. Depth-first search follows one site's links deeper and deeper, can fall into endless generated pages, and keeps hammering one host.
q: What is a URL frontier?
a: The frontier is the queue of URLs still to fetch. In a real crawler it has two parts: front queues that order URLs by priority, and back queues, one per host, that enforce politeness by letting a host be fetched only after its delay has passed.
q: What is politeness in a web crawler?
a: Politeness means never overloading a website: at most one connection per host at a time and a delay between requests to it, plus obeying robots.txt. It is enforced by giving each host its own queue and a next-allowed time.
q: How does a crawler avoid crawling the same page twice?
a: It normalises every URL — lower-case host, no fragment, no tracking parameters — and checks it against a seen-set before fetching. After fetching, it hashes the page content and checks that against a second set, which catches mirrors and duplicate pages under different URLs.
q: What is a crawler trap?
a: A crawler trap is a site that generates endless distinct URLs, such as a calendar with a next-month link forever or session ids in every link. Crawlers defend with limits on URL length, path depth and pages per host, and by spotting repeating path patterns.
q: How do you distribute a crawler across many machines?
a: Partition the frontier by host, for example with consistent hashing on the hostname, so each host's URLs and politeness state live on one worker. Workers send discovered URLs for other hosts to the worker that owns them.
---

Crawl billions of pages without crawling any twice or overloading any site:
a queue, two seen-sets and a lot of politeness.

## Requirements

- **Functional**: from seed URLs, fetch pages, store them, extract links, keep crawling; recrawl pages that change.
- **Non-functional**: scale to billions of pages; **polite** to every host; robust to bad HTML, slow servers and traps; extensible (new content types).
- **Out of scope** unless asked: ranking and the search index itself.

## Capacity estimate

Assumptions, not facts — state them, then derive.

| Assumption | Value | Derived | Value |
| --- | --- | --- | --- |
| Pages a month | 1 billion | Fetches per second | 1B ÷ 2.592M s ≈ 386/s |
| Average page size | 100 KB | Storage a month | 100 TB |
| URLs ever seen | 10 billion | URL seen-set (8-byte hashes) | 80 GB |

## API

A crawler has no public API; its workers share internal calls like these:

```text
frontier.next(worker)           → url            (a host whose delay has passed)
frontier.add(urls)              → enqueued only the unseen ones
fetch(url)                      → status, headers, body
store.put(urlHash, body, meta)  → saved for the indexer
```

## Data model

| Store | Key → value | Notes |
| --- | --- | --- |
| Frontier | host → queue of URLs, next-allowed time | Mostly on disk, head in memory |
| URL seen-set | hash(normalised URL) → seen | Hash set or Bloom filter |
| Content seen-set | hash(body) → URL | Exact duplicates |
| Page store | URL hash → body, fetched_at | Blob store |
| robots cache | host → rules, fetched_at | Refresh about daily |

## High-level design

- **Frontier** hands out URLs; **fetchers** download them (with their own DNS cache).
- **Parser** extracts links; **URL filter** normalises, applies robots.txt and dedups.
- **Content dedup** hashes each body; new pages go to the **page store** for indexing.

## BFS over the link graph

- The web is a graph: pages are nodes, links are edges.
- Crawl **breadth first** from seeds: a FIFO frontier and a **seen-set**.
- A page linked many times is still fetched once.

@figure bfs

## The frontier and politeness

- **Front queues** order URLs by priority (importance, freshness).
- **Back queues**, one per host, each with a **next-allowed time**.
- At most one fetch per host per delay; the fetcher picks a ready host.

@figure politeness

## robots.txt

- Fetch each host's `robots.txt` before crawling it; cache it (about a day).
- The **longest matching rule** wins; Allow wins a tie; no match means allowed.
- It is a request, not access control: a polite crawler obeys it.

@figure robots

## Dedup: URLs and content

- **Normalise** URLs: lower-case host, drop `#fragment`, drop tracking parameters.
- Check the **URL seen-set** before fetching; a **Bloom filter** saves memory but allows rare false "seen".
- Hash the **content** after fetching: mirrors and duplicate pages are dropped.
- Near-duplicates need a **similarity hash** (SimHash), not an exact one.

@figure dedup

```game
type: pick
title: Which part of the crawler handles it?
prompt: Each round is a crawling problem. Pick the part of the design that solves it.
? A small site gets twenty requests a second from your crawler.
* Per-host queues with a delay
- A bigger content seen-set
- More fetcher machines
> A host's own queue and next-allowed time cap how often it is hit, however many workers you run.
? The same article is linked with ?utm_source=mail and ?utm_source=feed.
* URL normalisation before the seen-set
- robots.txt
- BFS order
> Dropping tracking parameters turns both links into one URL, so the second is never fetched.
? news.example and m.news.example serve identical pages.
- URL normalisation
* A content hash seen-set
- Per-host queues
> The URLs differ, so only hashing the fetched bodies reveals the duplicate.
? A calendar page links to next month, forever.
- A Bloom filter
* Limits on depth and pages per host
- Content hashing
> Each month's page is new and different, so only crawl limits stop the trap.
? The site asks crawlers to stay out of /cart.
* robots.txt rules
- Content hashing
- Per-host queues
> A Disallow rule in robots.txt names the paths a polite crawler skips.
```

## Distributed crawling

- Partition the frontier **by host** with [consistent hashing](/notes/system-design/consistent-hashing): one worker owns a host's queue and politeness.
- Workers forward discovered URLs to the owning worker; the seen-sets are sharded by hash.
- Checkpoint the frontier so a crashed worker resumes, not restarts.

## Bottlenecks and trade-offs

- **DNS** lookups are slow: cache them per worker.
- **Freshness vs coverage**: recrawl changing pages more often, at the cost of new ones.
- **Bloom filter vs exact set**: memory against occasionally skipping a page never fetched.
- **Traps and spam**: cap URL length, depth and pages per host.

## Interview questions

- **BFS or DFS?** BFS: important pages first, load spread across hosts, no endless dives.
- **How do you stay polite?** Per-host queues with a delay, one connection per host, robots.txt obeyed.
- **How do you avoid duplicates?** Normalised URL seen-set before fetching, content hash after.
- **How do you scale out?** Shard the frontier by host so each host's politeness lives on one worker.

Next: [Design Search Autocomplete](/notes/system-design/design-search-autocomplete) · Before this: [Design a Ride-Hailing App (Uber)](/notes/system-design/design-ride-hailing)
