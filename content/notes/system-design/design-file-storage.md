---
title: Design a File Storage Service (Dropbox)
order: 19
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Design Dropbox: File Storage System Design
description: Design a file storage and sync service like Dropbox: chunking, content hashing and dedup, metadata vs blob storage, delta sync, notifications and conflicts.
question: How do you design a file storage service like Dropbox?
answer: Split each file into chunks of a few megabytes and name every chunk by its content hash. Store the chunks in a blob store and each file's ordered list of hashes, with a version number, in a metadata database. A client uploads only chunks the server lacks, commits the new list, and a notification service tells the user's other devices to pull the changed chunks.
q: Why split files into chunks?
a: Chunks make large files practical. An interrupted upload resumes from the last chunk, an edit re-sends only the chunks it touched, and identical chunks across files and users are stored once. Each chunk is small enough to retry cheaply and to upload in parallel.
q: What is content-addressable storage?
a: Each chunk is stored under the hash of its own bytes, usually SHA-256. The same content always gets the same name, so storing it twice is harmless and duplicates are found by a lookup. A file then becomes an ordered list of hashes.
q: Where are file contents and metadata stored?
a: Contents go to a blob store such as Amazon S3, which is cheap, durable and scales without limit but cannot query. Metadata — users, folders, file names, versions and chunk lists — goes to a database that supports transactions and indexes, such as a sharded relational database.
q: How does a file sync across devices?
a: After a device commits a new version, the metadata service publishes a change event. Other devices hold a long poll or WebSocket open to a notification service, hear about the change, fetch the new chunk list and download only the chunks they lack.
q: How are edit conflicts handled?
a: Every commit carries the version it was based on, and the server accepts it only if that is still the current version. A device whose commit is refused keeps its edit as a conflicted copy beside the new version, so nothing is lost and the user merges them.
q: What is the difference between fixed-size and content-defined chunking?
a: Fixed-size chunking cuts every N bytes, so inserting one byte near the start shifts every later chunk and they all look new. Content-defined chunking picks cut points from the data itself with a rolling hash, so an insertion changes only the chunks around it.
---

Store files in the cloud and keep them in sync on every device: the design
turns on chunks, hashes and a clean split between bytes and metadata.

## Requirements

- **Functional**: upload, download and delete files; sync changes to every device of an account; share files and folders; keep earlier versions.
- **Non-functional**: never lose data (high durability); large files and flaky networks must work; sync in seconds; consistent view of each file's current version.
- **Read and write both matter**: unlike a URL shortener, uploads are large and frequent.

## Capacity estimate

Assumptions, not facts — say them out loud and let the interviewer change them.

| Assumption | Value | Derived | Value |
| --- | --- | --- | --- |
| Registered users | 50 million | Stored data (avg 2 GB) | 100 PB |
| Daily active users | 10 million | Uploads per second | 20M ÷ 86,400 ≈ 230/s |
| Uploads per user a day | 2 | New data a day (1 MB each) | 20 TB |
| Chunk size | 4 MB | Chunk rows to index | 100 PB ÷ 4 MB = 25 billion |

## API

```http
POST /files/upload-session          {"path": "/trip.mov", "hashes": [...]}  → 200 {"missing": ["9ae3", ...]}
PUT  /chunks/9ae3                   (raw bytes)                             → 201
POST /files/42/commit               {"baseVersion": 3, "hashes": [...]}     → 200 {"version": 4} | 409
GET  /changes?cursor=c81            (long poll)                             → 200 {"changed": [42], "cursor": "c82"}
```

## Data model

| Table | Key columns | Lives in |
| --- | --- | --- |
| `files` | file_id, owner_id, path, current_version | Metadata DB |
| `versions` | file_id, version, chunk_hashes (ordered), size, created_at | Metadata DB |
| `chunks` | hash, size, ref_count | Metadata DB |
| chunk bytes | hash → bytes | Blob store (S3-like) |

## High-level design

- **Clients** watch a sync folder, chunk and hash changed files, and talk to two paths.
- **Block service** in front of the blob store: chunk uploads and downloads, often through a [CDN](/notes/system-design/content-delivery-networks) for reads.
- **Metadata service** in front of the metadata DB: files, versions, sharing, the commit.
- **Notification service**: devices hold a long poll or WebSocket; change events reach it through a [queue](/notes/system-design/message-queues).

## Chunking and dedup

- Cut files into **chunks** (a few MB); name each by its **content hash** (SHA-256).
- Ask the server which hashes it lacks; **upload only those**.
- Identical chunks — inside a file, across versions, across users — are **stored once**.
- Uploads become **resumable** and **parallel**: one chunk is the unit of retry.

@figure chunk-dedup

## Metadata vs blob store

- **Bytes** go to a blob store: cheap, durable (replicated or erasure-coded), no queries.
- **Metadata** goes to a transactional DB: small rows, indexes, one atomic commit per version.
- Shard metadata by **owner or namespace id** so one user's folder lives together — see [database sharding](/notes/system-design/database-sharding).
- A commit names only hashes already uploaded, so readers never see a half-written file.

## Delta sync and notifications

- On an edit, re-chunk, compare hash lists and **upload only the delta**.
- Fixed-size chunks shift after an insertion; **content-defined chunking** (rolling hash) keeps the rest stable.
- The commit publishes a change; other devices are **pushed** a notice, then **pull** the chunk list and missing chunks.

@figure delta-sync

@figure sync-notify

```game
type: order
title: Follow one edit from laptop to phone
prompt: Put the steps of syncing one edited file in order.
- The laptop re-chunks the file and hashes each chunk
- It asks the server which hashes are missing
- It uploads only the missing chunks to the block store
- It commits the new chunk list to the metadata service
- The notification service tells the phone the file changed
- The phone downloads the chunks it lacks
why: Chunks are uploaded before the commit that names them, so no device ever sees a version whose bytes are missing; the phone hears last and pulls only the delta.
```

## Conflicts

- Every commit carries its **base version**; the server applies it only if base = current (compare-and-set).
- A refused device saves a **conflicted copy** and downloads the winner; the user merges.
- Automatic merging works only for formats the service understands; for arbitrary files, keep both.

@figure conflict

## Bottlenecks and trade-offs

- **Chunk size**: small chunks dedup better and retry cheaper but mean more metadata rows and requests.
- **Hot metadata shards**: a huge shared folder concentrates writes; split large namespaces.
- **Garbage collection**: delete a chunk only when no version references it (`ref_count`, or a mark-and-sweep).
- **Cross-user dedup** saves space but can reveal that someone already stored a file; per-account dedup avoids that.

## Interview questions

- **Why not store whole files?** Edits would re-upload everything, failed uploads restart, and duplicates are stored again.
- **Why keep metadata out of the blob store?** It needs transactions, indexes and listing; blob stores give durability, not queries.
- **How does a device learn about changes?** A long poll or WebSocket to a notification service, then a pull of the delta.
- **Two devices edit offline — what happens?** The first commit wins; the second fails its version check and becomes a conflicted copy.

Next: [Design a Ride-Hailing App (Uber)](/notes/system-design/design-ride-hailing) · Before this: [Design a Notification System](/notes/system-design/design-a-notification-system)
