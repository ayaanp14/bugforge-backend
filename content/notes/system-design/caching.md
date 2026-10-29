---
title: Caching
order: 4
minutes: 7
level: beginner
updated: 2026-10-29
seo-title: Caching in System Design: Cache-Aside, LRU and TTL
description: Caching for system design interviews: cache-aside, LRU eviction, write-through vs write-back vs write-around, TTL and hit ratio, each shown as an animation.
question: What is caching in system design?
answer: Caching keeps copies of frequently read data in a fast store, usually memory, so most reads skip the slow source such as a database. It cuts latency and load, but adds the work of keeping copies fresh: choosing a read and write policy, an eviction policy such as LRU, and a TTL that bounds how stale a copy can be.
q: What is the cache-aside pattern?
a: In cache-aside (lazy loading) the application checks the cache first. On a hit it returns the cached value; on a miss it reads the database, stores the result in the cache and returns it. Only data that is actually read gets cached, and a cache failure just means slower reads.
q: How does an LRU cache work?
a: An LRU (least recently used) cache keeps entries in order of last access. A hit moves the entry to the most-recent end; a miss on a full cache evicts the entry at the least-recent end. A hash map plus a doubly linked list gives O(1) get and put.
q: What is the difference between write-through and write-back?
a: Write-through writes to the cache and the database before acknowledging, so both always agree but writes are slower. Write-back writes only the cache and acknowledges at once, flushing to the database later; writes are fast, but data not yet flushed is lost if the cache node fails.
q: What is a cache hit ratio?
a: The hit ratio is hits divided by total lookups. It decides how much a cache helps: average read time is roughly hit ratio × cache time + miss ratio × (cache time + database time), so moving from a 90% to a 99% hit ratio cuts database reads tenfold.
q: What is cache invalidation and why is it hard?
a: Invalidation is removing or updating a cached copy when the source changes. It is hard because the cache and the database are separate systems: a write and a concurrent read can race and leave an old value cached. TTLs, deleting on write and versioned keys limit the damage.
q: What is a cache stampede?
a: A stampede (thundering herd) happens when a popular key expires and many requests miss at once, all hitting the database together. Fixes include letting one request refill while others wait (request coalescing), refreshing before expiry, and adding random jitter to TTLs.
---

A cache keeps hot data close and fast, so most reads never reach the slow store behind it.

## Where caches live

- **Client**: browser cache, HTTP `Cache-Control` headers.
- **Edge**: a [CDN](/notes/system-design/content-delivery-networks) for static files and cacheable responses.
- **Application**: an in-process map (fastest, but per server).
- **Distributed**: Redis or Memcached shared by every app server.
- **Database**: its own buffer pool and query caches.

## Cache-aside (lazy loading)

- Read: cache → on a miss, database → fill the cache → return.
- Write: update the database, then **delete** the cached key (the next read refills it).
- Only what is read gets cached; a cache outage means slower, not broken.
- The most common pattern for read-heavy services.

@figure cache-aside

## Eviction: LRU

- Memory is finite; when full, something must go.
- **LRU**: evict the least recently used — recent use predicts reuse.
- O(1) with a hash map + doubly linked list.
- Others: **LFU** (least frequently used), **FIFO**, random; Redis offers approximate LRU and LFU.

@figure lru

## Write policies

| | Write-through | Write-back | Write-around |
| --- | --- | --- | --- |
| Write goes to | Cache and database | Cache only, flushed later | Database only |
| Write speed | Slower | Fastest | Database speed |
| Risk | None extra | Loses unflushed writes | First read after a write misses |
| Good for | Read-after-write data | Write-heavy, loss-tolerant | Data rarely re-read |

@figure write-policies

## TTL and staleness

- A **TTL** expires an entry after a fixed time, so a stale copy cannot live forever.
- Short TTL: fresher data, more misses. Long TTL: more hits, staler data.
- TTL bounds staleness; delete-on-write removes most of it.
- Add random jitter to TTLs so popular keys do not all expire together.

@figure ttl

## Hit ratio and pitfalls

- **Hit ratio** = hits ÷ lookups; average read ≈ hit × cache time + miss × (cache + database time).
- **Stampede**: a hot key expires and every request misses at once — refill once, others wait.
- **Penetration**: requests for keys that never exist always miss — cache the "not found".
- **Hot key**: one key overloads one cache node — replicate it or keep a local copy.
- Size the cache for the **working set**, not the whole dataset.

## Interview questions

- **What would you cache?** Data read far more often than written and tolerant of brief staleness: profiles, product pages, computed feeds.
- **Why delete the key on write instead of updating it?** Two concurrent updates can write the cache in the wrong order; a delete just forces the next read to fetch the truth.
- **Redis or Memcached?** Memcached is a simple multithreaded key-value cache; Redis adds data structures, persistence, replication and pub/sub.
- **How do you scale a cache across nodes?** Partition keys with [consistent hashing](/notes/system-design/consistent-hashing), so adding a node moves only a fraction of keys.

Next: [Content Delivery Networks](/notes/system-design/content-delivery-networks) · Before this: [Load Balancing](/notes/system-design/load-balancing)
