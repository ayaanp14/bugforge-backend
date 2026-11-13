---
title: Design a News Feed
order: 17
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Design a News Feed: Fan-out on Write vs Read
description: Design a news feed like Twitter or Instagram: fan-out on write vs read, the hybrid for celebrity accounts, feed caches and cursor pagination, each animated.
question: How do you design a news feed system?
answer: Store posts once, then build each user's feed either at post time (fan-out on write: push the post id into every follower's cached feed) or at read time (fan-out on read: pull and merge followed accounts' posts). Large systems mix both: push for ordinary accounts, pull for celebrities, merge at read time, and page the result with cursors.
q: What is fan-out on write?
a: When someone posts, a worker pushes the post's id into the cached feed of every follower. Reading a feed is then a single fast cache read, but one post costs one write per follower, which is expensive for accounts with millions of followers.
q: What is fan-out on read?
a: Nothing is precomputed. When a user opens the feed, the service fetches the recent posts of everyone they follow and merges them by time or rank. Posting is cheap, but every feed load does many queries, which is slow for users who follow thousands of accounts.
q: How do you handle celebrities with millions of followers?
a: Use the hybrid model. Accounts above a follower threshold are not fanned out; their posts are stored once and pulled at read time, then merged with the reader's precomputed feed. Writes stay bounded and each read adds only a few lookups.
q: Why use cursor pagination for a feed instead of offset?
a: New posts keep arriving at the top, so an offset shifts under the reader and repeats or skips posts. A cursor says continue after the last post I saw, which stays correct as the list changes and uses an index seek instead of skipping rows.
q: Where are feeds stored?
a: Usually as short lists of post ids in an in-memory store such as Redis, a few hundred per user, with post bodies fetched separately from a post cache or database. Inactive users' feeds can be dropped and rebuilt on their next visit.
---

A news feed is the list of recent posts from the accounts you follow. The design problem is when to do the work of building it: when someone posts, or when someone reads.

## Requirements

- **Functional**: post text/media; follow accounts; see a feed of followed accounts' posts, newest or ranked first; scroll for more.
- **Non-functional**: the feed loads fast (aim for a few hundred ms); a post may take seconds to appear (eventual consistency is fine); highly available.
- **Read-heavy**: feeds are read far more often than posts are written.

## Capacity estimate

Assumptions: 200 million daily users, each opens the feed 10 times and posts 0.5 times a day, 200 followers on average.

| Quantity | Working | Result |
| --- | --- | --- |
| Feed reads / s | 200 M × 10 ÷ 86,400 | ≈ 23,000 |
| Posts / s | 200 M × 0.5 ÷ 86,400 | ≈ 1,157 |
| Fan-out writes / s | 1,157 × 200 | ≈ 231,000 |
| Feed cache | 200 M × 500 ids × 8 B | 800 GB |

- Fan-out multiplies writes by the follower count; that number drives the whole design.

## API

```http
POST /v1/posts                       {"text": "..."}  → 201 {"id": "p9"}
GET  /v1/feed?limit=20               → {"posts": [...], "nextCursor": "p18"}
GET  /v1/feed?limit=20&cursor=p18    → the next page, older than p18
```

## Data model

| Store | Key | Holds |
| --- | --- | --- |
| posts | postId | authorId, body, createdAt |
| follows | (followerId, followeeId) | both directions indexed |
| feed cache | userId | newest ~500 post ids |
| post cache | postId | hydrated post for display |

## Fan-out on write (push)

- At post time, a worker copies the post id into each follower's feed cache.
- Read = one cache read. Cost = one write per follower.

@figure fan-out-write

## Fan-out on read (pull)

- At read time, fetch each followee's recent posts and merge.
- Posting is free; reading is slow for users following thousands.

@figure fan-out-read

| | Push (on write) | Pull (on read) |
| --- | --- | --- |
| Read latency | Low | High |
| Write cost | × followers | One write |
| Celebrity post | Millions of writes | Cheap |
| Inactive users | Wasted writes | Nothing wasted |

## The hybrid for celebrities

- Push for ordinary accounts; above a follower threshold, store once and pull.
- The reader's feed = cached ids + a few celebrity pulls, merged.

@figure hybrid

```game
type: pick
title: Push or pull?
prompt: For each case, choose how the feed should get the post.
? An account with 300 followers posts.
* Fan-out on write
- Fan-out on read
> Three hundred cache writes are cheap, and every follower then reads a ready feed.
? An account with 50 million followers posts.
- Fan-out on write
* Fan-out on read
> Fifty million writes for one post would swamp the workers; pull it at read time instead.
? A user who has not opened the app in a year.
- Keep pushing into their feed
* Skip them and rebuild on their next visit
> Writes to a feed nobody reads are waste; rebuild it by pulling when they return.
? The feed must load in under 200 ms for a typical user.
* Read a precomputed feed
- Merge every followee's posts on each request
> A single cache read is fast; merging hundreds of followees per request is not.
```

## Ranking and pagination

- **Ranking**: take a few hundred candidates, score them (recency, affinity, engagement), return the top. Plain time order is the baseline.
- **Cursor pagination**: "older than the last post I saw", never `OFFSET`.

@figure cursor

## Bottlenecks and trade-offs

- **Fan-out lag**: a [queue](/notes/system-design/message-queues) absorbs bursts; posts appear after seconds, not instantly.
- **Hot feed caches**: shard by user id with [consistent hashing](/notes/system-design/consistent-hashing).
- **Posts table**: [shard](/notes/system-design/database-sharding) by author; [cache](/notes/system-design/caching) hot posts.
- **Deletes and unfollows** leave stale ids in caches; filter at read time.

## Interview questions

- **Push or pull?** Push for most users, pull for celebrities: the hybrid.
- **What goes in the feed cache?** Post ids, not bodies, so an edit changes one record.
- **Why cursors?** Offsets repeat or skip posts as new ones arrive.
- **How do you rank?** Score a candidate set by recency and engagement; time order is the fallback.

Next: [Design a Notification System](/notes/system-design/design-a-notification-system) · Before this: [Design a Chat App (WhatsApp)](/notes/system-design/design-a-chat-app)
