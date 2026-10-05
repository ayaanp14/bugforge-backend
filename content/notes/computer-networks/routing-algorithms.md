---
title: Routing and Routing Protocols
order: 8
minutes: 14
level: intermediate
updated: 2026-10-05
seo-title: Routing Algorithms: Distance Vector, Link State, OSPF
description: How routers choose paths: routing tables, longest prefix match, static vs dynamic routing, distance vector and link state worked out, and RIP vs OSPF vs BGP.
question: What is routing in computer networks?
answer: Routing is how a network decides the path packets take from one network to another. Routers build routing tables, either configured by hand (static routing) or learned from routing protocols (dynamic routing), and forward each packet to the next hop of the entry with the longest matching prefix. Distance vector protocols such as RIP use the Bellman-Ford algorithm; link state protocols such as OSPF use Dijkstra's algorithm.
q: What is the difference between routing and forwarding?
a: Routing is the network-wide process of computing paths and filling the routing table, done by routing protocols in the router's control plane whenever the topology changes. Forwarding is the per-packet action of looking up the destination and moving the packet to the right output interface, done in nanoseconds in the data plane.
q: What is the difference between distance vector and link state routing?
a: In distance vector routing each router shares its table of distances only with its neighbours and computes routes with Bellman-Ford, so it knows distances but not the topology. In link state routing each router floods the state of its own links to all routers, builds the full map and runs Dijkstra. Link state converges faster and avoids count-to-infinity.
q: What is the count-to-infinity problem?
a: When a link fails in a distance vector network, routers can keep learning stale routes to the lost destination from each other, each time adding the link cost, so the distance creeps upwards one exchange at a time until it reaches the protocol's infinity. RIP caps this at 16. Split horizon and poison reverse prevent it between two routers.
q: What is longest prefix matching?
a: When several routing table entries match a destination address, the router uses the most specific one, with the longest prefix. For 10.1.2.5, an entry for 10.1.2.0/24 beats 10.1.0.0/16, which beats 10.0.0.0/8, and the default route 0.0.0.0/0 is used only when nothing else matches.
q: What is an autonomous system in networking?
a: An autonomous system is a network, or group of networks, run by one organisation with a single routing policy, such as an ISP, a cloud provider or a large university. It is identified by an AS number. Interior protocols like OSPF route inside one; BGP routes between them.
q: What is the difference between RIP, OSPF and BGP?
a: RIP is a distance vector interior protocol using hop count, limited to 15 hops. OSPF is a link state interior protocol using bandwidth-based costs, Dijkstra and areas, and it converges quickly. BGP is a path vector exterior protocol that connects autonomous systems across the internet and chooses routes by policy rather than shortest distance.
---

A packet crossing the internet passes through a dozen or more routers, and each one makes a decision on its own: which neighbour should get this packet next? Routing is how those decisions are prepared. Routers run algorithms that learn the network's shape, compute good paths and write the results into routing tables; forwarding then uses those tables, packet by packet. This note covers the table itself, the two families of routing algorithm with worked examples, and the three protocols interviewers name: RIP, OSPF and BGP.

## Routing vs forwarding

| Aspect | Routing | Forwarding |
| --- | --- | --- |
| Question answered | What is the best path to each network? | Which interface should this packet leave on? |
| Scope | Network-wide, using information from other routers | Local to one router |
| Done by | Routing protocols (control plane) | Hardware or fast software (data plane) |
| How often | On topology changes and periodic updates | For every packet |
| Output | The routing (and forwarding) table | A packet sent to the next hop |

## The routing table and longest prefix match

Each entry says: for destinations in this prefix, send to this next hop through this interface. A router may hold overlapping entries and picks the **longest matching prefix**, the most specific route.

| Prefix | Next hop | Interface |
| --- | --- | --- |
| 10.0.0.0/8 | 192.168.1.2 | eth1 |
| 10.1.0.0/16 | 192.168.2.2 | eth2 |
| 10.1.2.0/24 | 192.168.3.2 | eth3 |
| 0.0.0.0/0 (default route) | 203.0.113.1 | eth0 |

@figure longest-prefix

The **default route** (0.0.0.0/0) matches everything with a prefix length of zero, so it is used only when nothing more specific matches. A home router's table is little more than its LAN plus a default route to the ISP. The prefixes themselves come from [IP addressing and subnetting](/notes/computer-networks/ip-addressing-and-subnetting).

## Static vs dynamic routing

| Aspect | Static routing | Dynamic routing |
| --- | --- | --- |
| How routes are made | Typed in by an administrator | Learned and updated by a routing protocol |
| Reaction to failure | None until someone edits the table | Automatic rerouting |
| Overhead | No protocol traffic or CPU | Update messages, CPU and memory |
| Scales to | Small, stable networks; default routes; stub networks | Large or changing networks |
| Security | Nothing to spoof | Protocol messages must be authenticated |

On Cisco routers, when two sources offer a route to the **same prefix**, the one with the lower **administrative distance** wins: directly connected 0, static 1, eBGP 20, OSPF 110, RIP 120. The prefix length is compared first, so a more specific route always beats a more trusted but shorter one.

## Distance vector routing (Bellman-Ford)

Each router keeps a **distance vector**: its best-known cost to every destination and the next hop for it. Periodically, and whenever something changes, it sends this vector to its **neighbours only**. On receiving vectors, router x recomputes, for every destination y:

D(x, y) = min over each neighbour v of [ cost(x, v) + D(v, y) ]

This is the Bellman-Ford equation, run in a distributed way: no router ever sees the whole map.

### Worked example

Four routers with these link costs: A–B 2, A–C 5, B–C 1, C–D 2. In each round, every router recomputes its vector from its neighbours' vectors of the round before.

@figure distance-vector

A's vector as the rounds go by, the numbers to write on paper:

| A's route to | Round 0 | Round 1 | Round 2 |
| --- | --- | --- | --- |
| B | 2 via B | min(2 + 0, 5 + 1) = 2 via B | 2 via B |
| C | 5 via C | min(2 + 1, 5 + 0) = 3 via B | 3 via B |
| D | ∞ | min(2 + ∞, 5 + 2) = 7 via C | min(2 + 3, 5 + 2) = 5 via B |

A third round changes nothing: the network has **converged**. Notice that A's best route to D needed two rounds, because B had to learn D before it could tell A.

### The count-to-infinity problem

Good news travels fast in distance vector routing; bad news travels slowly. Take a line A–B–C with every link cost 1, and let the B–C link fail.

@figure count-to-infinity

B believes A's advertisement, not knowing that A's route goes through B itself, and the two count upwards until the cost reaches "infinity", which RIP defines as **16**. The fixes:

- **Split horizon**: never advertise a route back to the neighbour you learned it from. A would not tell B about C at all.
- **Poison reverse**: advertise it back, but with cost ∞, so B knows at once that A has no independent path.
- **Hold-down timers** ignore new information about a failed route for a while, and **triggered updates** send bad news immediately instead of waiting for the next periodic update.

Split horizon fixes two-router loops but not every loop among three or more routers; the hop limit is the final backstop.

## Link state routing (Dijkstra)

In link state routing each router:

1. discovers its neighbours (with hello messages) and measures the cost of each link;
2. builds a **link state advertisement (LSA)** describing its own links;
3. **floods** the LSA to every router in the area, so all routers hold an identical **link state database**, a full map;
4. runs **Dijkstra's shortest path first** algorithm with itself as the source and installs the resulting next hops.

### Worked example

Five routers with these link costs: A–B 4, A–C 2, B–C 1, B–D 5, C–D 8, C–E 10, D–E 2. Router A runs Dijkstra: at each step it settles the unsettled node with the smallest tentative distance and relaxes that node's links. On paper, write one row per step: the node settled, then every other node's current distance and predecessor.

@figure dijkstra

A's routing table:

| Destination | Cost | Shortest path | Next hop |
| --- | --- | --- | --- |
| B | 3 | A, C, B | C |
| C | 2 | A, C | C |
| D | 8 | A, C, B, D | C |
| E | 10 | A, C, B, D, E | C |

Every next hop is C, and the direct A–B link (cost 4) is not used at all. The algorithm itself is covered in depth in the [Dijkstra's algorithm lesson](/roadmap/dijkstras-algorithm).

## Distance vector vs link state

| Aspect | Distance vector | Link state |
| --- | --- | --- |
| What a router knows | Distances via its neighbours | The whole topology |
| What it sends | Its entire distance vector | LSAs about its own links |
| Sent to | Neighbours only | Every router in the area (flooding) |
| Algorithm | Bellman-Ford, distributed | Dijkstra, run locally |
| Convergence | Slow; count-to-infinity possible | Fast; no count-to-infinity |
| CPU and memory | Low | Higher (database plus SPF runs) |
| Examples | RIP | OSPF, IS-IS |

## Interior and exterior gateway protocols

The internet is made of **autonomous systems (ASes)**: networks run by one organisation under one routing policy, each with an AS number. Routing works at two levels:

- **Interior gateway protocols (IGPs)** route inside one AS and look for the best path by a metric: RIP, OSPF, IS-IS and Cisco's EIGRP.
- **Exterior gateway protocols** route between ASes. The only one in use is **BGP** (version 4). It is a **path vector** protocol: each route carries the list of ASes it has passed through, so a router that sees its own AS number in the list rejects the route, which prevents loops. Routes are chosen by **policy** (business relationships, preferences) rather than by shortest distance. BGP between ASes is eBGP; BGP carrying those routes inside one AS is iBGP.

## RIP vs OSPF vs BGP

| Aspect | RIP | OSPF | BGP |
| --- | --- | --- | --- |
| Type | Distance vector | Link state | Path vector |
| Used | Inside an AS | Inside an AS | Between ASes |
| Metric | Hop count | Cost, usually from bandwidth (Cisco: 100 Mbps ÷ link bandwidth) | Policy and path attributes, such as AS path length |
| Limit | 15 hops; 16 means unreachable | No hop limit | No hop limit |
| Updates | Whole table every 30 seconds | Triggered LSAs, refreshed every 30 minutes | Incremental changes only |
| Carried over | UDP port 520 | IP directly, protocol number 89 | TCP port 179 |
| Convergence | Slow | Fast | Deliberately conservative |
| Hierarchy | Flat | Areas joined to backbone area 0 | Autonomous systems |
| Typical use | Small networks and labs | Enterprise and ISP internals | The internet's backbone, multi-homed sites |

OSPF's **areas** keep flooding and Dijkstra runs local: routers in one area hold the full map only of that area, plus summaries of the others through the backbone.

## Common mistakes

- Choosing a route by administrative distance before prefix length: the longest prefix is compared first.
- Saying distance vector routers know the topology: they know only distances and next hops.
- Saying RIP's limit is 16 hops: 15 is the maximum usable; 16 means unreachable.
- Calling BGP a distance vector protocol: it is path vector, and it chooses by policy.
- In Dijkstra, settling a node before it has the smallest tentative distance, or forgetting to update a neighbour that improves.
- Assuming split horizon prevents every routing loop: it fixes only loops between two routers.

## Interview questions

**How does a router choose between overlapping routes to a destination?**
First by longest prefix match: the most specific matching entry wins. If two sources offer the same prefix, the lower administrative distance wins (on Cisco, static 1 beats OSPF 110, which beats RIP 120). Within one protocol, the lower metric wins.

**Explain count-to-infinity and how split horizon helps.**
After a link fails, two distance vector routers can each believe the other still has a path, and they raise their costs by one link at a time until they hit the protocol's infinity. Split horizon stops a router from advertising a route back to the neighbour it learned it from, which removes the false path between two routers.

**Why does OSPF converge faster than RIP?**
OSPF floods link changes to every router at once and each router recomputes its paths from a complete map, so news spreads in one flooding wave. RIP passes changes only between neighbours, often on a 30-second timer, and can count to infinity before settling.

**Why does OSPF divide a network into areas?**
In a large network, flooding every change everywhere and rerunning Dijkstra on a huge map costs bandwidth, memory and CPU. Areas confine detailed link state to each area and exchange only summaries through backbone area 0, which keeps databases small and contains instability.

**What is BGP, and why is it called a path vector protocol?**
BGP is the protocol autonomous systems use to exchange reachability across the internet. Each advertisement carries the full list of ASes on the path, which lets routers detect loops and apply policies, such as preferring a customer's routes or avoiding a particular network.

**Why does RIP limit paths to 15 hops?**
To bound count-to-infinity: with 16 defined as unreachable, a counting loop ends after a limited number of exchanges. The cost is that RIP cannot serve networks wider than 15 hops, one reason larger networks use OSPF.

**What is a default route, and when is it used?**
A default route, 0.0.0.0/0, matches every destination with the shortest possible prefix, so it is used only when no more specific route matches. Edge networks use it to send all internet-bound traffic to their ISP without holding the full internet routing table.

Next, read [the data link layer](/notes/computer-networks/data-link-layer), and test the algorithms with the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
