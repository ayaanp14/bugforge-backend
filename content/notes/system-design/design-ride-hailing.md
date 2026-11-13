---
title: Design a Ride-Hailing App (Uber)
order: 20
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Design Uber: Ride-Hailing System Design
description: Design a ride-hailing app like Uber: driver location updates, geohash and quadtree indexes for nearby drivers, dispatch and the trip state machine.
question: How do you design a ride-hailing app like Uber?
answer: Drivers send their location every few seconds to a location service that keeps only the latest position in memory, indexed by a geospatial grid such as geohash cells. A ride request searches the rider's cell and its neighbours, ranks nearby drivers by ETA and offers the trip to one driver at a time. The trip then moves through a state machine stored in a database.
q: How often should drivers send their location?
a: Every few seconds is the usual trade-off — often about 4 seconds while online. More often gives fresher positions but multiplies write traffic and battery use; less often makes matching pick drivers who have already moved away.
q: What is a geohash?
a: A geohash encodes a latitude and longitude as a short string by repeatedly halving the map, alternating longitude and latitude, one bit per halving, five bits per base-32 character. Nearby points usually share a prefix, so a grid cell is a key you can index and look up.
q: Geohash or quadtree for finding nearby drivers?
a: A geohash grid is fixed and simple: cells are keys in a hash map or Redis, and updates are cheap. A quadtree splits busy areas into smaller cells and leaves empty areas large, which adapts to density but must be rebalanced as drivers move. Many designs start with a fixed grid.
q: Why search neighbouring cells as well as the rider's cell?
a: A driver just across a cell border can be closer than a driver in the far corner of the rider's own cell. Reading the eight neighbours covers every point within one cell width; if too few drivers are found, the search widens ring by ring.
q: How do you stop two riders getting the same driver?
a: Offer a trip to one driver at a time and lock that driver while the offer is open, with an expiry so a lost phone cannot hold the lock. The final assignment is a conditional write that succeeds only if the driver is still available.
q: Why model a trip as a state machine?
a: A trip passes through fixed states — requested, matched, arrived, in trip, completed or cancelled — and events from two apps arrive out of order or twice. Allowing only listed transitions, each written conditionally on the current state, rejects impossible events and makes retries safe.
---

Match riders with nearby drivers in seconds: the design is a stream of
location writes, a geospatial index and a careful dispatch loop.

## Requirements

- **Functional**: riders request a ride and see nearby drivers; drivers go online and share location; match, track the trip live, compute the fare, pay.
- **Non-functional**: matching in a few seconds; live positions; a driver never assigned twice; highly available in every city.
- **Write-heavy**: location updates dwarf every other request.

## Capacity estimate

Assumptions, not facts — the point is the shape of the load.

| Assumption | Value | Derived | Value |
| --- | --- | --- | --- |
| Drivers online at peak | 1 million | Location writes | 1M ÷ 4 s = 250,000/s |
| Update interval | 4 s | Inbound bandwidth | 250,000 × 100 B = 25 MB/s |
| Bytes per update | 100 | Latest positions in memory | 1M × 100 B = 100 MB |
| Trips a day | 10 million | Trip requests | 10M ÷ 86,400 ≈ 116/s |

## API

```http
POST /drivers/location     {"lat": 12.9716, "lng": 77.5946, "ts": 1731571200}   → 204
POST /rides                {"pickup": {...}, "drop": {...}}                    → 201 {"rideId": "r81", "state": "Requested"}
POST /rides/r81/events     {"event": "arrive"}                                 → 200 | 409
WS   /rides/r81/track      (driver position and state pushed to the rider)
```

## Data model

| Store | Holds | Why there |
| --- | --- | --- |
| In-memory geo index (Redis-like) | driver → latest position and cell; cell → drivers | 250k writes/s, only the latest matters |
| Trips DB | trip_id, rider, driver, state, pickup, drop, fare, timestamps | Durable, transactional state |
| Location history (log or time-series) | driver, position, ts | Route replay and fares, off the hot path |

## High-level design

- **Location service** takes driver updates (often over a WebSocket) and writes the geo index.
- **Matching service** finds candidates, ranks them by ETA, runs dispatch.
- **Trip service** owns the state machine and the trips DB; fares and payments follow completion.
- Updates are also appended to a [queue](/notes/system-design/message-queues) for history and analytics.

## Location updates and the geospatial index

- Keep **only the latest** position per driver in memory; history goes to a log.
- Index positions by **cell**: a geohash prefix, a fixed grid, or a quadtree.
- A geohash halves the map, alternating longitude and latitude, one bit per halving.
- Most updates stay in the same cell; only a **cell change** touches the index.
- Partition the index **by region** — cities are independent — see [database sharding](/notes/system-design/database-sharding).

@figure geohash

## Finding nearby drivers

- Compute the rider's cell; read it **and its 8 neighbours**.
- Rank only those candidates by distance, then by **road ETA**.
- Too few drivers? **Widen the ring** of cells and search again.
- **Quadtree** instead: small cells where drivers are dense, large where sparse.

@figure nearby

## Matching and dispatch

- Offer to **one driver at a time**, nearest first, with a short timeout.
- **Lock** the offered driver (a key with an expiry), so no other request can take it.
- A timeout or decline releases the lock and moves to the next candidate.
- Assign with a **conditional write**: succeeds only if the driver is still free.

@figure dispatch

## Trip state machine

- States: Requested → Matched → Arrived → In trip → Completed; Cancelled from the early states.
- Each event applies only from its listed state: `UPDATE … WHERE state = 'Matched'`.
- Duplicate or late events (retries, two apps) are rejected, not double-applied.

@figure trip-states

```game
type: order
title: Put a trip's states in order
prompt: Order the states a completed trip passes through.
- Requested
- Matched
- Arrived
- In trip
- Completed
why: A rider requests, a driver accepts (Matched), reaches the pickup (Arrived), starts the ride and ends it; Cancelled is only reachable before the ride starts.
```

## Bottlenecks and trade-offs

- **Update interval**: fresher positions cost writes and battery.
- **Hot cells**: an airport or stadium overloads one cell; split it finer (quadtree) or shard by cell.
- **Straight-line vs ETA**: distance is cheap; road ETA is right but needs a routing service.
- **Region failure**: run each region independently; a matching outage must not lose trip state.

## Interview questions

- **Why not store every location in SQL?** 250k writes a second of which only the latest matters belong in memory; history goes to a log.
- **How do you find nearby drivers fast?** Geohash or grid cells: read the rider's cell and its neighbours, rank only those.
- **How do you avoid double booking a driver?** One offer at a time, an expiring lock, and a conditional assignment write.
- **How do you handle duplicate trip events?** A state machine whose transitions are conditional on the current state.

Next: [Design a Web Crawler](/notes/system-design/design-a-web-crawler) · Before this: [Design a File Storage Service (Dropbox)](/notes/system-design/design-file-storage)
