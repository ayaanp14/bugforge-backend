---
title: Checkpoint — LRU cache
minutes: 30
seo-title: LRU Cache Quiz: Eviction Order, Sentinels and LinkedHashMap
description: Practise LRU cache design: ten questions on eviction order, sentinel nodes, expiry and thread safety, plus a Java cache with peek and hit statistics to code.
q: What separates an LRU cache from a FIFO cache in a test?
a: A read. In an LRU cache a get moves the key to the front, so it survives the next eviction; a FIFO cache evicts by insertion order whatever was read. Put two keys, get the first, put a third: LRU evicts the second key, FIFO the first.
q: Should a peek count as a use in an LRU cache?
a: No. A peek, a debug listing or a monitoring read inspects the cache without the application using the entry, so it must not move the node; otherwise looking at the cache changes which key is evicted next.
---
This checkpoint covers the module: the map-of-nodes plus doubly linked list design, sentinels, eviction order, expiry on a logical clock, and the questions an interviewer asks next (LinkedHashMap, thread safety, LFU).

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module.

**The program** adds three things to the cache you built: `DEL`, a `PEEK` that must not count as a use, and hit, miss and eviction counters. Before you code, decide for each command:

- Does it move the node? Does it change the size?
- Which counter, if any, does it touch?

Hidden cases peek at the key that is about to be evicted, delete a key so the next put needs no eviction, and run a capacity of one.
