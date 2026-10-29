---
title: Content Delivery Networks (CDN)
order: 5
minutes: 6
level: beginner
updated: 2026-10-29
seo-title: CDN in System Design: Edges, TTLs and Origin Pull
description: How a CDN works for system design interviews: edge servers, origin pull, TTL and revalidation, push vs pull and cache keys, with looping animations.
question: What is a CDN in system design?
answer: A content delivery network is a fleet of edge servers spread across many regions that cache copies of a site's content close to users. A user's request goes to a nearby edge instead of the distant origin, which cuts round-trip latency, absorbs traffic the origin would otherwise serve and keeps working when one location fails.
q: How does a CDN reduce latency?
a: Every round trip costs time proportional to distance, and a first HTTPS request needs several of them. An edge a few hundred kilometres away answers the handshakes and serves the cached file, so the user never waits on a round trip to the far origin.
q: What is the difference between a push CDN and a pull CDN?
a: A pull CDN fetches a file from the origin the first time an edge is asked for it and caches it from then on. A push CDN has you upload content to the CDN ahead of time. Pull needs no upload step; push suits large files that change rarely and must never miss.
q: What happens when the TTL of a cached file expires?
a: The edge does not throw the copy away. It revalidates: it asks the origin with If-None-Match or If-Modified-Since, and the origin answers 304 Not Modified with no body if nothing changed, or 200 with the new file if it did.
q: How do you update a file that a CDN has cached?
a: Either purge it through the CDN's invalidation API, which takes effect across edges after a short delay, or give each version a new URL such as app.3f9c2.js. Versioned URLs let you cache for a year and change instantly, because a new name is a new cache key.
q: Can a CDN cache dynamic or personalised pages?
a: Shared responses can be cached for seconds, which still absorbs bursts. Anything personal must be marked private or no-store so an edge never serves one user's page to another. CDNs still help dynamic traffic by terminating TLS near the user and keeping warm connections to the origin.
---

A CDN is a cache that sits in many places at once: copies of your content live
on edge servers close to your users.

## What a CDN does

- **Cuts latency**: requests travel to a nearby edge, not across the world.
- **Offloads the origin**: most requests are answered from edge caches.
- **Absorbs spikes and attacks**: a large, spread-out fleet soaks up load.
- **Serves static assets best**: images, video, CSS, JS, downloads.

Distance sets a floor that no server tuning removes:

@figure edge-vs-origin

## How an edge fills: origin pull

- The first request for a file at an edge is a **miss**; the edge fetches it from the origin.
- The edge stores the copy for as long as `Cache-Control` allows.
- Later requests to that edge are **hits** and never reach the origin.
- Each edge fills on its own, so the origin sees roughly one miss per edge per file.

@figure origin-pull

## Freshness: TTL and revalidation

- `Cache-Control: max-age=60` makes a copy **fresh** for 60 seconds.
- A fresh copy is served without asking the origin — even if the origin changed.
- An expired copy is **revalidated** with `If-None-Match: <ETag>`:
  - unchanged → `304 Not Modified`, no body, fresh again;
  - changed → `200` with the new file.
- The TTL is the trade-off: longer means fewer origin trips but staler content.

@figure ttl-revalidation

## Cache keys and invalidation

- The edge looks copies up by a **cache key**, by default roughly host + path + query.
- Two URLs for the same bytes are two keys — and two origin fetches.
- Keep only what changes the response in the key: drop tracking parameters, sort the rest.
- To change a cached file:
  - **Versioned URLs** (`app.3f9c2.js`): a new name is a new key; cache old names for a year.
  - **Purge** through the CDN's API: works for fixed URLs, but takes time to reach every edge.

@figure cache-key

## Push vs pull

| | Pull CDN | Push CDN |
| --- | --- | --- |
| How content arrives | Edge fetches on first miss | You upload ahead of time |
| First request | Slower (a miss) | Fast |
| Effort | Point the CDN at the origin | Manage uploads and deletes |
| Fits | Most websites, changing assets | Large, rarely changing files |

- Never cache personal responses on a shared edge: send `Cache-Control: private` or `no-store`.
- DNS or anycast routing sends each user to a nearby edge — see [DNS](/notes/computer-networks/dns).

## Interview questions

- **What would you put on a CDN?** Static assets and media; shared API responses only with short TTLs.
- **How do you deploy a new version of a cached file?** Use content-hashed file names so a deploy changes the URL; purge only what has a fixed URL.
- **What is a cache hit ratio and why does it matter?** The share of requests answered at the edge; every miss is origin load and a slow response.
- **Why did users still see the old file after a deploy?** It was fresh by its TTL at the edges (and maybe in browsers); purge it or version the URL.

Next: [Database Replication](/notes/system-design/database-replication) · Before this: [Caching](/notes/system-design/caching)
