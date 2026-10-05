---
title: SQL vs NoSQL Databases
order: 12
minutes: 13
level: intermediate
updated: 2026-10-05
seo-title: SQL vs NoSQL: Differences, CAP Theorem and When to Use
description: SQL vs NoSQL databases compared: document, key-value, wide-column and graph stores, ACID vs BASE, the CAP theorem, replication and sharding.
question: What is the difference between SQL and NoSQL databases?
answer: SQL (relational) databases store data in tables with a fixed schema, link them with keys and joins, and give multi-row ACID transactions; MySQL and PostgreSQL are examples. NoSQL databases use other models (documents, key-value pairs, wide columns or graphs) with flexible schemas and built-in horizontal scaling, often trading joins and strict consistency for scale; MongoDB, Redis, Cassandra and Neo4j are examples.
q: What is the CAP theorem?
a: The CAP theorem says that when a network partition splits a distributed database, it must give up either consistency (every read sees the latest write) or availability (every request to a working node gets a non-error answer). Partitions cannot be ruled out, so the real choice is what a system does during one.
q: What is the difference between ACID and BASE?
a: ACID (atomicity, consistency, isolation, durability) puts correctness first: a committed transaction is complete, valid and immediately visible to all. BASE (basically available, soft state, eventually consistent) puts availability first: the system keeps answering, replicas may briefly disagree, and they converge once updates stop. Relational databases follow ACID; many distributed NoSQL stores follow BASE.
q: Is MongoDB ACID compliant?
a: Partly by default and fully when asked. A write to a single document has always been atomic. Since version 4.0 MongoDB supports multi-document ACID transactions on replica sets, and since 4.2 on sharded clusters. Its consistency guarantees also depend on the read and write concerns you choose.
q: What is the difference between sharding and replication?
a: Replication keeps copies of the same data on several nodes, for availability and to spread reads. Sharding splits the data so each node holds a different part, to spread storage and writes. Large systems use both: the data is sharded, and each shard is replicated.
q: When should you use NoSQL instead of SQL?
a: When a specific need outgrows what a relational database does comfortably: very high write volumes across many machines, data accessed as whole documents with changing fields, key lookups at very low latency, or deep relationship traversals. For structured data with transactions and integrity rules, a relational database is the usual default.
q: What is eventual consistency?
a: Eventual consistency guarantees that if no new updates are made to an item, all replicas will eventually return the same value. Until then, different replicas may answer with different versions, so a user can briefly see an old like count or a deleted comment. It is the price of staying available during failures.
---

For decades "database" meant a relational database queried with SQL. In the 2000s, web companies needed to store more data, across more machines, with less rigid structure than one relational server handled comfortably, and a family of non-relational systems grew up under the name **NoSQL** (now read as "not only SQL"). Interviewers ask about the trade-offs: when a document or key-value store beats a table, what ACID and BASE mean, and what the CAP theorem really says. This note answers those, and covers replication and sharding, the two techniques behind every distributed database.

## The relational model

A relational database stores data in **tables** with a schema declared in advance (schema-on-write). Tables are linked by keys, queries combine them with joins, constraints keep the data valid, and transactions are ACID across any number of rows and tables. MySQL, PostgreSQL, Oracle Database and SQL Server are the common ones. Its strengths are exact, flexible querying (any question the data can answer, written in SQL) and integrity. Its traditional weakness is scaling writes beyond one machine, which is possible but not built in.

The previous notes describe this model: [keys](/notes/dbms/keys-in-dbms), [normalization](/notes/dbms/normalization), [joins](/notes/dbms/sql-joins) and [transactions](/notes/dbms/transactions-and-acid).

## The NoSQL families

| Model | Data shape | Examples | Strong at | Weak at |
| --- | --- | --- | --- | --- |
| Document | JSON-like documents with nested fields | MongoDB, Couchbase, Firestore | Objects read and written whole; fields that vary | Many-to-many relationships, joins |
| Key-value | An opaque value looked up by a key | Redis, Amazon DynamoDB | Caching, sessions, counters at very low latency | Any query not by key |
| Wide-column | Rows grouped into partitions; each row's columns may differ | Apache Cassandra, HBase, ScyllaDB | Huge write volumes, time series, many data centres | Ad hoc queries; tables are designed per query |
| Graph | Nodes and edges, both with properties | Neo4j, Amazon Neptune | Relationships many hops deep | Bulk aggregation over the whole data set |

Here is the same idea, a customer and her orders, in each model:

@figure four-models

**Document** (MongoDB), as stored:

```json
{
  "_id": 101,
  "name": "Asha",
  "city": "Pune",
  "orders": [
    { "order_id": 9001, "total": 1499, "items": ["keyboard"] },
    { "order_id": 9002, "total": 299, "items": ["mouse pad", "cable"] }
  ]
}
```

Embedding is fast to read but duplicates data that other documents also need, which is denormalization with the usual update anomalies.

**Key-value** (Redis): the database knows only keys. Values can be strings, or in Redis's case lists, hashes and sorted sets, and keys can expire.

```text
SET cart:101 "{\"items\": 3, \"total\": 1798}" EX 3600
GET cart:101
```

**Wide-column** (Cassandra): you design one table per query. Here the **partition key** `customer_id` decides which nodes store the rows, and the **clustering columns** keep each customer's orders sorted newest first inside the partition.

```text
CREATE TABLE orders_by_customer (
  customer_id int,
  order_date  date,
  order_id    int,
  total       int,
  PRIMARY KEY ((customer_id), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC, order_id DESC);
```

**Graph** (Neo4j, Cypher query language): relationships are stored as edges, so "what did Asha's friends buy?" is a traversal, not a chain of joins.

```text
MATCH (a:Customer {name: 'Asha'})-[:FRIEND]->(f)-[:BOUGHT]->(p:Product)
RETURN DISTINCT p.name
```

## SQL vs NoSQL

| Aspect | SQL (relational) | NoSQL |
| --- | --- | --- |
| Data model | Tables of rows and columns | Documents, key-value pairs, wide columns or graphs |
| Schema | Declared up front, enforced on write | Flexible; often interpreted on read |
| Query language | SQL, standardized | Per product: MongoDB queries, CQL, Cypher, key commands |
| Relationships | Foreign keys and joins | Embedding, duplication, or graph edges |
| Transactions | ACID across rows and tables | Varies: single-record atomicity always; multi-record in some |
| Consistency | Strong on a single server | Often tunable; eventual consistency is common on replicas |
| Scaling | Vertical first; read replicas; sharding with extra tooling | Horizontal sharding built in |
| Fits | Structured data with integrity rules: payments, orders, inventory | Scale or flexibility needs: caches, feeds, sensor data, catalogues |

The line has blurred. PostgreSQL and MySQL store and index JSON; MongoDB has multi-document transactions; Cassandra speaks the SQL-like CQL; and distributed SQL databases such as Google Spanner, CockroachDB and TiDB scale horizontally with ACID transactions. Choose by the workload, not the label.

## ACID vs BASE

[ACID](/notes/dbms/transactions-and-acid) puts correctness first. **BASE** describes many distributed NoSQL stores:

- **Basically available**: the system answers every request, even during failures, possibly with stale data.
- **Soft state**: the state can change without new input, as replicas exchange updates.
- **Eventually consistent**: if updates stop, all replicas converge to the same value.

| Aspect | ACID | BASE |
| --- | --- | --- |
| Priority | Correctness | Availability |
| After a write | Every reader sees it once committed | Some readers may briefly see the old value |
| During a failure | May refuse requests rather than be wrong | Keeps answering, may be stale |
| Typical home | Relational databases | Dynamo-style stores, caches, many NoSQL systems |
| Good for | Money, stock levels, bookings | Likes, view counts, feeds, recommendations |

## The CAP theorem

Eric Brewer conjectured it in 2000, and Seth Gilbert and Nancy Lynch proved it in 2002. Its three properties have precise meanings:

- **Consistency (C)**: every read returns the most recent write or an error, as if there were one copy of the data (linearizability).
- **Availability (A)**: every request received by a non-failing node gets a non-error response.
- **Partition tolerance (P)**: the system keeps operating when the network drops messages between nodes.

**The theorem: if a network partition occurs, a distributed system must choose between consistency and availability.** It cannot guarantee both while nodes cannot talk to each other.

@figure partition

The popular "pick any two of three" is misleading. Partitions are not optional in a distributed system, so you cannot "choose CA" by giving up P; a CA system is simply one that is not distributed, such as a single database server. When there is no partition, a system can be both consistent and available. The PACELC refinement (Daniel Abadi, 2012) adds the everyday trade-off: if there is a **P**artition, choose **A** or **C**; **E**lse, choose lower **L**atency or **C**onsistency.

Many databases are tunable, so classify a configuration rather than a product. Cassandra with consistency level ONE behaves as AP; with QUORUM reads and writes it leans towards consistency. MongoDB with majority read and write concerns behaves as CP. Also note that **CAP's C is not ACID's C**: ACID's consistency means constraints hold, while CAP's means replicas agree.

## Replication

**Replication** keeps copies of the same data on several nodes, for fault tolerance and to spread reads.

- **Leader-follower** (primary-replica): all writes go to the leader, which streams changes to followers; reads may go to any. MySQL replication, PostgreSQL streaming replication and MongoDB replica sets work this way.
- **Synchronous or asynchronous**: a synchronous leader waits for a follower to confirm each write, so failover loses nothing but writes are slower; an asynchronous one does not wait, so followers lag and a failover can lose the latest writes.
- **Replication lag** can break read-your-writes: a user's next read, served by a follower that is behind, may not show her own change.
- **Multi-leader** accepts writes in several places (for example one leader per data centre) and must resolve conflicting writes.
- **Leaderless** (Dynamo-style, as in Cassandra): a client writes to W of the N replicas and reads from R of them. If R + W > N, every read set overlaps every write set.

@figure replication

The quorum rule of leaderless stores, checked over every possible read:

@figure quorum

## Sharding

**Sharding** (horizontal partitioning) splits the rows of one data set across nodes by a **shard key**, so each node stores and serves only its part. It spreads data volume and write load, which replication alone cannot.

| Strategy | How rows are placed | Strength | Weakness |
| --- | --- | --- | --- |
| Range | Contiguous key ranges per shard (A–F, G–M, …) | Range queries stay on one shard | Hot spots: new time-ordered keys all hit the last shard |
| Hash | hash(key) decides the shard; consistent hashing limits movement when nodes change | Even spread | Range queries visit every shard |
| Directory | A lookup table maps keys to shards | Full control over placement | The lookup service is one more dependency |

@figure sharding

A good shard key has many distinct values, spreads reads and writes evenly, and keeps data that is queried together on one shard. The costs are real: joins and transactions across shards are slow or unsupported, and rebalancing moves data while the system runs. Relational databases can be sharded too, with tools such as Vitess for MySQL and Citus for PostgreSQL. **Vertical scaling** (a bigger machine) is simpler and should usually come first; **horizontal scaling** (more machines) is what sharding enables.

## When to choose which

| Workload | Good fit | Why |
| --- | --- | --- |
| Payments, orders, bookings, inventory | Relational | Multi-row ACID transactions and constraints |
| Product catalogue with varying attributes | Document, or relational with a JSON column | Each product carries different fields |
| Sessions, caches, rate limits, leaderboards | Key-value (Redis) | Very fast key lookups, expiry, sorted sets |
| Sensor readings, event logs, messages at high volume | Wide-column (Cassandra) | High write throughput, partitioned by device and time |
| Social connections, recommendations, fraud rings | Graph (Neo4j) | Queries that follow relationships many hops |
| Reports across all the data | Relational or a data warehouse | SQL aggregation and joins |

Many systems use several stores at once (polyglot persistence): a relational database as the source of truth for accounts and orders, Redis in front of it as a cache, perhaps a search engine beside it. The practical default is a relational database until a measured need points elsewhere.

## Common mistakes

- Reading CAP as "pick two of three": partitions are unavoidable, so the choice is C or A during a partition.
- Equating CAP's consistency with ACID's consistency.
- Saying NoSQL databases have no transactions: many offer single-record atomicity, and some offer multi-record ACID transactions.
- Saying SQL databases cannot scale horizontally: replicas, sharding tools and distributed SQL all exist.
- Confusing replication with sharding: copies of the same data versus different parts of the data.
- Choosing NoSQL for "flexible schema" and then needing joins and integrity everywhere.

## Interview questions

**What does NoSQL stand for, and what are its main types?** It is now read as "not only SQL", a name for non-relational databases. The main types are document, key-value, wide-column and graph stores.

**State the CAP theorem correctly.** In the presence of a network partition, a distributed system cannot be both consistent (linearizable) and available. It must refuse some requests to stay consistent, or answer them with possibly stale data to stay available.

**Is Cassandra CP or AP?** It is usually described as AP, because it keeps accepting reads and writes during partitions and converges later. But consistency is tunable per query, and QUORUM reads with QUORUM writes give much stronger guarantees, so it depends on configuration.

**What is the difference between vertical and horizontal scaling?** Vertical scaling adds CPU, memory or disk to one machine; it is simple but bounded and keeps one point of failure. Horizontal scaling adds machines and spreads data and load across them through replication and sharding.

**How do you choose a shard key?** Pick a column with many distinct values and even access, used by most queries to find data, so that each query hits one shard and no shard runs hot. User id is a common choice; a timestamp alone is a classic hot-spot mistake.

**What is R + W > N in leaderless replication?** With N replicas, a write waits for W acknowledgements and a read queries R replicas. If R + W > N the two sets must share at least one replica, so a read sees the latest acknowledged write.

**Would you store a bank's transactions in MongoDB or MySQL?** In a relational database such as MySQL or PostgreSQL by default, because transfers need multi-row ACID transactions, constraints and strong consistency. A document store could work with multi-document transactions, but it gives up the strengths it is chosen for.

**Why might a social network use a graph database?** Queries such as friends of friends or people you may know follow edges several hops deep. A graph database stores the edges directly, so each hop is a pointer lookup, whereas a relational database needs one self-join per hop.

You have reached the end of the DBMS notes. Go back to the start with [Introduction to DBMS](/notes/dbms/introduction-to-dbms), browse the [DBMS notes](/notes/dbms), or test yourself with the [SQL (Basic)](/skill-tests/sql-basic) and [SQL (Intermediate)](/skill-tests/sql-intermediate) skill tests.
