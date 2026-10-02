---
skill: networks
level: intermediate
---

## networks-intermediate-001
topic: ip-addressing
answer: C

A host has the address `172.16.45.200/21`. What are the network address and the broadcast address of its subnet?

- A: `172.16.45.0` and `172.16.45.255`
- B: `172.16.32.0` and `172.16.47.255`
- C: `172.16.40.0` and `172.16.47.255`
- D: `172.16.40.1` and `172.16.47.254`

> A /21 mask is 255.255.248.0: the third octet keeps 5 network bits and 3 host
> bits, so subnets step by 8 in that octet. 45 lies in the block 40–47, so the
> network is 172.16.40.0 and the broadcast (all host bits set) is
> 172.16.47.255. A treats the address as a /24; B is the /20 subnet (blocks of
> 16, here 32–47); D gives the first and last usable host addresses, not the
> network and broadcast addresses.

## networks-intermediate-002
topic: ip-addressing
answer: A

How many usable host addresses does the subnet `10.64.0.0` with mask `255.255.252.0` have, and which is its last usable host address?

- A: 1,022 hosts; the last is `10.64.3.254`
- B: 1,024 hosts; the last is `10.64.3.255`
- C: 510 hosts; the last is `10.64.1.254`
- D: 1,022 hosts; the last is `10.64.4.254`

> 255.255.252.0 is a /22: 10 host bits, 2^10 = 1,024 addresses, minus the
> network and broadcast addresses = 1,022 usable. The block spans the third
> octet 0–3, so it runs from 10.64.0.0 to 10.64.3.255 (the broadcast) and the
> last usable host is 10.64.3.254. B counts the network and broadcast as hosts;
> C is a /23; D runs into 10.64.4.x, which is already the next /22.

## networks-intermediate-003
topic: ip-addressing
answer: D

Which of these addresses is in the same subnet as `10.20.31.5/20`?

- A: `10.20.32.1`
- B: `10.20.15.250`
- C: `10.20.0.9`
- D: `10.20.16.200`

> A /20 leaves 4 network bits in the third octet, so subnets step by 16 there:
> 0–15, 16–31, 32–47, … 31 falls in 16–31, so the subnet is 10.20.16.0 to
> 10.20.31.255, and 10.20.16.200 is inside it. 10.20.32.1 is in the next
> subnet and 10.20.15.250 and 10.20.0.9 in the previous one; those two would
> share a subnet with 10.20.31.5 only under a /19 (0–31), one bit shorter.

## networks-intermediate-004
topic: ip-addressing
answer: B

`192.168.4.0/24` is to be split into equal subnets: at least six of them, each as large as possible. What prefix length do the subnets get, and how many usable hosts does each hold?

- A: /26, with 62 usable hosts each
- B: /27, with 30 usable hosts each
- C: /27, with 32 usable hosts each
- D: /29, with 6 usable hosts each

> Borrowing n host bits makes 2^n subnets. Two bits give only 4; three bits
> give 8, the fewest that reach six, so the subnets are /27 (two are spare).
> Five host bits remain: 32 addresses, of which 30 are usable once the network
> and broadcast addresses are taken out. A yields only four subnets; C forgets
> the network and broadcast addresses; D sizes each subnet for six hosts
> instead of making six subnets.

## networks-intermediate-005
topic: ip-addressing
answer: A

`192.168.50.0/24` is divided with VLSM among four LANs that need 100, 50, 20 and 2 hosts. The LANs are allocated largest first; each gets the smallest subnet that fits it, placed at the lowest free address that is a multiple of its size. Which subnet does the 20-host LAN get?

- A: `192.168.50.192/27`
- B: `192.168.50.32/27`
- C: `192.168.50.192/28`
- D: `192.168.50.160/27`

> 100 hosts need a /25 (126 usable): 192.168.50.0/25. 50 hosts need a /26 (62
> usable): .128/26. 20 hosts need a /27 (30 usable): .192/27. The 2-host link
> gets a /30 at .224. B is what allocating smallest first produces (the /30 at
> .0 pushes the /27 to .32), which is why VLSM goes largest first. C is too
> small: a /28 has only 14 usable addresses. D follows from giving the 50-host
> LAN a /27 at .128, which holds only 30 hosts.

## networks-intermediate-006
topic: ip-addressing
answer: C

A router must advertise `172.20.6.0/24`, `172.20.7.0/24` and `172.20.8.0/24` to a neighbour as a single route. What is the smallest single prefix that covers all three?

- A: `172.20.4.0/22`
- B: `172.20.0.0/21`
- C: `172.20.0.0/20`
- D: `172.20.6.0/22`

> Write the third octets in binary: 6 = 00000110, 7 = 00000111,
> 8 = 00001000. They agree only on the first four bits, so the summary keeps
> 16 + 4 = 20 bits: 172.20.0.0/20, which spans 172.20.0.0–172.20.15.255.
> A covers 4–7 and B covers 0–7; both miss 172.20.8.0. D is not a valid
> prefix: a /22 must start at a multiple of 4 in the third octet, and 6 is
> not. Note that the /20 also covers 0–5 and 9–15, which this router may not
> own: summarising a set that is not aligned always over-claims.

## networks-intermediate-007
topic: ip-addressing
answer: D

Two hosts behind a router doing PAT (NAT overload), `192.168.1.10` and `192.168.1.11`, each open a TCP connection from source port 50000 to the same server, `198.51.100.7` port 443. The router has one public address, `203.0.113.5`. What happens?

- A: The second connection fails, because public port 50000 is already in use.
- B: Both leave as 203.0.113.5:50000, and replies are matched by the hosts' MAC addresses.
- C: The second connection leaves with its private source address left unchanged.
- D: Both leave from 203.0.113.5, and at least one is given a different source port.

> PAT keeps a table mapping (inside address, inside port) to (public address,
> public port). Two flows that would collide on the same public port to the
> same destination cannot share it, so the router picks another public port
> for one of them; a reply's destination port then says which inside host it
> belongs to. MAC addresses do not survive past the first hop, a private
> source address is not routable on the internet, and refusing the flow would
> defeat the point of PAT.

## networks-intermediate-008
topic: ip-addressing
answer: B, D

Which of these are valid ways to write the IPv6 address `2001:0db8:0000:0000:0001:0000:0000:00a0`? "Valid" means any text form RFC 4291 accepts, not only the recommended one. Select all that apply.

- A: `2001:db8::1::a0`
- B: `2001:db8::1:0:0:a0`
- C: `2001:db8:0:0:1:0:0:a`
- D: `2001:db8:0:0:1::a0`
- E: `2001:db8::1:a0`

> Leading zeros in a group may be dropped (0db8 → db8, 00a0 → a0), trailing
> ones may not, so C's `a` means 000a. One run of all-zero groups may be
> replaced by `::`, and only one: B compresses the first run and D the second,
> and both expand to the original. A uses `::` twice, so nobody can tell how
> many zeros each stands for. E expands to 2001:db8:0:0:0:0:1:a0, a different
> address. (RFC 5952's recommended form is B: when two runs are equally long,
> compress the first.)

## networks-intermediate-009
topic: ip-addressing
answer: B

A site is assigned `2001:db8:abcd::/48` and gives each LAN a /64. How many /64 subnets can it create?

- A: 16
- B: 65,536
- C: 65,534
- D: 256

> The subnet ID is the bits between the /48 and the /64: 64 − 48 = 16 bits,
> so 2^16 = 65,536 subnets. 16 is the number of bits, not of subnets. 65,534
> wrongly applies IPv4's minus-two, which is about the network and broadcast
> addresses inside a subnet, not about subnet numbers (and IPv6 has no
> broadcast address at all). 256 is what a /56 would give.

## networks-intermediate-010
topic: ip-addressing
answer: A, E

Which statements about IPv6 on a single LAN are true? Select all that apply.

- A: Every IPv6-enabled interface has a link-local address in fe80::/10, and routers never forward packets addressed to one off the link.
- B: A host learns a neighbour's MAC address with an ARP request sent to ff:ff:ff:ff:ff:ff.
- C: The all-ones host part of a /64 is reserved as that subnet's broadcast address.
- D: A link-local address is globally unique, so hosts on other networks can reach it directly.
- E: Address resolution sends an ICMPv6 Neighbor Solicitation to the target's solicited-node multicast group.

> IPv6 has no broadcast. Neighbor Discovery (ICMPv6) replaces ARP, and a
> Neighbor Solicitation goes to the solicited-node multicast group built from
> the target's last 24 bits (ff02::1:ffXX:XXXX), so only the few hosts in that
> group process it instead of every host on the LAN. Every IPv6 interface must
> have a link-local address, used for Neighbor Discovery and routing protocols,
> and routers must not forward link-local traffic to other links. Link-local
> addresses are only unique on their own link (fe80::1 is common), which is
> why using one needs a zone, as in fe80::1%eth0. No IPv6 address is a
> subnet's broadcast address.

## networks-intermediate-011
topic: routing
answer: A

A router has this forwarding table:

| Prefix | Interface |
| --- | --- |
| 0.0.0.0/0 | eth0 |
| 10.0.0.0/8 | eth1 |
| 10.1.0.0/16 | eth2 |
| 10.1.64.0/18 | eth3 |
| 10.1.96.0/19 | eth4 |

Using longest-prefix match, out of which interfaces does it send packets to `10.1.100.5`, `10.1.130.9` and `10.2.0.1`, in that order?

- A: eth4, eth2, eth1
- B: eth3, eth2, eth1
- C: eth4, eth3, eth1
- D: eth4, eth2, eth0

> 10.1.64.0/18 covers third octets 64–127 and 10.1.96.0/19 covers 96–127.
> 10.1.100.5 matches /0, /8, /16, /18 and /19; the longest is the /19, so
> eth4. 10.1.130.9 is outside 64–127, so the longest match is the /16: eth2.
> 10.2.0.1 matches only the /8 and the default route, so eth1. B stops at the
> /18 although a longer prefix matches; C stretches the /18 past 127; D
> misses that 10.2.0.1 is inside 10.0.0.0/8 and falls to the default route.

## networks-intermediate-012
topic: routing
answer: D

Router A runs a distance-vector protocol. Its link to neighbour B costs 2 and its link to neighbour C costs 5. The latest vectors are: B reaches D at cost 7 and E at cost 1; C reaches D at cost 3 and E at cost 4. What routes does A compute to D and to E?

- A: D at cost 3 via C; E at cost 1 via B
- B: D at cost 9 via B; E at cost 3 via B
- C: D at cost 8 via C; E at cost 9 via C
- D: D at cost 8 via C; E at cost 3 via B

> Bellman–Ford: A's cost to a destination is the minimum, over its
> neighbours, of the link cost to the neighbour plus the neighbour's
> advertised cost. To D: via B 2 + 7 = 9, via C 5 + 3 = 8, so 8 via C. To E:
> via B 2 + 1 = 3, via C 5 + 4 = 9, so 3 via B. A leaves out A's own link
> costs; B sends everything to the nearest neighbour; C uses one next hop for
> every destination, though each destination is chosen on its own.

## networks-intermediate-013
topic: routing
answer: B

Three routers run RIP in a line, A — B — C, every link with cost 1, and split horizon is turned off. A's route to C is 2 hops via B. The link B–C fails, and before B can tell A, B receives A's regular update, which still advertises C at 2 hops. What does B do, and how does it end?

- A: B ignores A's update, because A learned its route to C from B in the first place.
- B: B records C at 3 hops via A; then both keep raising the count until it reaches 16.
- C: B records C at 2 hops via A; the route then stays at 2 and packets loop for good.
- D: B records C at 3 hops via A; A then sees its own address in the path and drops it.

> Without split horizon, B cannot know that A's route to C runs through B
> itself. It takes A's 2 plus the link's 1 and records C at 3 via A. A then
> recomputes via B: 3 + 1 = 4; B answers with 5; and so on: count to
> infinity, with packets for C bouncing between A and B, until the metric
> reaches 16, RIP's "unreachable". A is roughly what split horizon prevents,
> but split horizon works at the sender (A would leave C out of its update to
> B) and it is off here; C forgets to add the link cost; D describes a
> path-vector protocol such as BGP, and RIP carries no path.

## networks-intermediate-014
topic: routing
answer: C

In the line of routers A — B — C, A's route to C goes through B. What does A say about C in the updates it sends to B, with plain split horizon and with split horizon with poison reverse?

- A: Split horizon: C at metric 16; poison reverse: C left out
- B: Split horizon: C at 2 hops; poison reverse: C at 3 hops
- C: Split horizon: C left out; poison reverse: C at metric 16
- D: Split horizon: C left out; poison reverse: C left out of every update A sends

> Split horizon never advertises a route back out of the interface it was
> learned on, so A's update to B simply omits C. Poison reverse advertises it
> on that interface explicitly as unreachable (16 in RIP), which B can act on
> at once instead of waiting for the route to time out. A has them the wrong
> way round; B is neither; D over-applies the rule, since A still tells its
> other neighbours about C. Neither fix stops loops that run through three or
> more routers; hold-down timers or a path-vector protocol are needed for
> that.

## networks-intermediate-015
topic: routing
answer: C

A link-state router A runs Dijkstra's algorithm over this topology. Links are bidirectional with the same cost both ways.

| Link | Cost |
| --- | --- |
| A–B | 4 |
| A–C | 1 |
| B–C | 2 |
| B–D | 1 |
| C–D | 5 |
| C–E | 8 |
| D–E | 3 |

What is A's least-cost path to E?

- A: Cost 9, along A–C–E
- B: Cost 8, along A–B–D–E
- C: Cost 7, along A–C–B–D–E
- D: Cost 9, along A–C–D–E

> Nodes become permanent in order of distance: A 0; C 1; B 3 (via C, cheaper
> than the direct 4); D 4 (via B, against 1 + 5 = 6 via C); E 7 (via D,
> against 1 + 8 = 9 via C). The path is A–C–B–D–E at cost 7. A takes the
> fewest hops; B uses the direct A–B link (4) instead of A–C–B (3); D goes
> through the expensive C–D link.

## networks-intermediate-016
topic: routing
answer: A

In a link-state protocol such as OSPF, what does each router send, and how are routes computed?

- A: It floods its own links and their costs to every router in the area, and each router runs Dijkstra on the full map.
- B: It sends its whole routing table to its neighbours, which add the link cost and keep the cheapest route to each place.
- C: It sends its own links only to its neighbours, and the router with the lowest ID computes routes for the whole area.
- D: It floods its whole routing table to every router, and each picks the next hop that is advertised the most often.

> In link state, every router describes only its own links (OSPF's link-state
> advertisements) and floods that description to every router in the area.
> Each router ends up with the same database, the map, and runs Dijkstra
> (shortest path first) from itself. B is distance vector, as in RIP. C is not
> OSPF: its designated router on a shared segment only cuts down flooding and
> computes nobody else's routes. D describes no real protocol.

## networks-intermediate-017
topic: routing
answer: A, C, E

Which statements about RIP, OSPF and BGP are true? Select all that apply.

- A: RIP's metric is the hop count, and a route of 16 hops means unreachable.
- B: RIP is an exterior gateway protocol, used between autonomous systems.
- C: OSPF is a link-state interior protocol whose cost is usually derived from interface bandwidth.
- D: OSPF routers send their full routing tables to their neighbours every 30 seconds.
- E: BGP is a path-vector protocol used between autonomous systems, and each route lists the ASes it crossed.

> RIP and OSPF are interior gateway protocols, run inside one autonomous
> system: RIP is distance vector with a hop-count metric (15 is the longest
> usable route, 16 means unreachable), and OSPF is link state with a cost per
> link, by default the reference bandwidth divided by the interface
> bandwidth. BGP is the exterior protocol between autonomous systems; its
> routes carry an AS_PATH and are chosen by policy. B is wrong because RIP is
> interior; D describes RIP's periodic full-table updates, not OSPF, which
> floods link-state changes and refreshes them only every 30 minutes.

## networks-intermediate-018
topic: routing
answer: D

Router R1 can reach R4 two ways: over three 100 Mbit/s links (R1–R2, R2–R3, R3–R4), or over one direct 10 Mbit/s link (R1–R4). Which path does RIP choose, and which does OSPF choose with the common reference bandwidth of 100 Mbit/s (link cost = 100 Mbit/s ÷ link bandwidth)?

- A: RIP: through R2 and R3; OSPF: the direct link
- B: RIP: the direct link; OSPF: the direct link
- C: RIP: through R2 and R3; OSPF: through R2 and R3
- D: RIP: the direct link; OSPF: through R2 and R3

> RIP counts hops: 1 for the direct link against 3, so it takes the slow
> direct link. OSPF adds link costs: each 100 Mbit/s link costs 100 ÷ 100 = 1,
> so the three-link path costs 3, while the 10 Mbit/s link costs
> 100 ÷ 10 = 10. OSPF therefore goes through R2 and R3. This is the classic
> weakness of a hop-count metric on links of mixed speeds.

## networks-intermediate-019
topic: routing
answer: B

A BGP router in AS 65010 receives an UPDATE from an external peer for `198.51.100.0/24` with the AS_PATH `65020 65030 65010 65040`. What does it do with this route?

- A: Accepts it and prepends 65010 before passing it on
- B: Rejects it, because its own AS is already in the path
- C: Accepts it, comparing it with a path length of 4
- D: Accepts it, but advertises it only to internal peers

> The AS_PATH is BGP's loop detection: if a route's path already contains the
> receiving router's own AS number, the route has passed through this AS
> before, and accepting it would build a loop, so it is discarded. Path length
> matters only when choosing between acceptable routes, and limiting a route
> to internal peers does not make a looped route acceptable.

## networks-intermediate-020
topic: routing
answer: C

Router R1 runs Dijkstra's algorithm over this topology. Links are bidirectional with the same cost both ways.

| Link | Cost |
| --- | --- |
| R1–R2 | 1 |
| R1–R3 | 4 |
| R2–R3 | 1 |
| R2–R4 | 6 |
| R3–R4 | 2 |

What next hop and total cost does R1 install in its forwarding table for R4?

- A: Next hop R3, cost 6
- B: Next hop R2, cost 7
- C: Next hop R2, cost 4
- D: Next hop R3, cost 4

> R2 is at 1. R3 is at min(4, 1 + 1) = 2, via R2. R4 is at
> min(1 + 6, 2 + 2, 4 + 2) = 4, along R1–R2–R3–R4. The forwarding table needs
> the next hop, the first router on that path, which is R2. D has the right
> cost but names R3, the router just before R4, which is the predecessor
> Dijkstra records, not the next hop. A uses the direct R1–R3 link and B uses
> R2's direct link to R4.

## networks-intermediate-021
topic: models
answer: A

A host streams a large file over one TCP connection on a full-duplex 100 Mbit/s Ethernet link with an MTU of 1,500 bytes. Every segment is full-sized, with no IP or TCP options. On the wire each frame also costs its Ethernet header (14 bytes), FCS (4), preamble and start delimiter (8) and the minimum interframe gap (12). What is the most application data per second the link can carry in that direction?

- A: About 94.9 Mbit/s
- B: About 96.2 Mbit/s
- C: About 97.5 Mbit/s
- D: 100 Mbit/s

> Each frame carries 1,460 bytes of data (1,500 − 20 IP − 20 TCP) but
> occupies 1,500 + 14 + 4 + 8 + 12 = 1,538 byte-times on the wire, so the
> goodput is 100 × 1,460 / 1,538 ≈ 94.9 Mbit/s. (The ACKs travel the other
> way on a full-duplex link and take nothing from this direction.) B leaves
> out the preamble and gap (1,460 / 1,518); C counts the IP and TCP headers as
> data (1,500 / 1,538); D ignores every header.

## networks-intermediate-022
topic: models
answer: B

A host sits on an Ethernet link with an MTU of 1,500 bytes. With no IP or TCP options, what maximum segment size (MSS) does it advertise for a TCP connection over IPv4, and over IPv6?

- A: 1,460 over IPv4; 1,460 over IPv6
- B: 1,460 over IPv4; 1,440 over IPv6
- C: 1,480 over IPv4; 1,460 over IPv6
- D: 1,442 over IPv4; 1,422 over IPv6

> The MSS is the TCP payload that fits in one IP packet: MTU − IP header − TCP
> header. IPv4: 1,500 − 20 − 20 = 1,460. IPv6's base header is a fixed 40
> bytes: 1,500 − 40 − 20 = 1,440. A ignores the larger IPv6 header; C
> subtracts only the IP header; D also subtracts the 18 bytes of Ethernet
> header and FCS, which the MTU does not include.

## networks-intermediate-023
topic: models
answer: D

An IPv4 datagram of 3,000 bytes (a 20-byte header and 2,980 bytes of data) must cross a link whose MTU is 1,200 bytes. The router splits it into as few fragments as possible, each with a 20-byte header. What Fragment Offset values do the fragments carry, in order?

- A: 0, 1176, 2352
- B: 0, 148, 296
- C: 0, 1180, 2360
- D: 0, 147, 294

> A fragment can carry at most 1,200 − 20 = 1,180 data bytes, but every
> fragment except the last must carry a multiple of 8, because the offset
> field counts 8-byte units: so 1,176. The data splits as 1,176 + 1,176 + 628,
> at byte offsets 0, 1,176 and 2,352, which the header records as 0, 147 and
> 294. The last fragment is 648 bytes long and has More Fragments = 0. A gives
> the offsets in bytes; C uses 1,180 without rounding, also in bytes; B rounds
> up to 1,184 bytes (148 units), which would make a 1,204-byte fragment, over
> the MTU.

## networks-intermediate-024
topic: models
answer: C

A NAT router rewrites the source IPv4 address of an outgoing TCP segment and changes nothing else. Which checksums must it update?

- A: Only the IPv4 header checksum, since the address sits in the IP header
- B: Neither of them, since the receiving host recomputes checksums that NAT breaks
- C: Both of them, since the TCP checksum also covers the IP addresses
- D: Only the TCP checksum, since routers do not check the IPv4 header checksum

> The IPv4 header checksum covers the header, which holds the address. The
> TCP checksum covers the segment plus a pseudo-header made of the source and
> destination IP addresses, the protocol number and the length, so changing an
> address breaks it too, and the receiver would discard the segment. NAT
> therefore patches both (incrementally, without re-reading the payload),
> and UDP's checksum likewise. A layer-3 device having to edit a layer-4
> field is why NAT is called a layering violation. Every router does verify
> the IPv4 header checksum, and receivers verify checksums rather than repair
> them.

## networks-intermediate-025
topic: models
answer: A

A host sends 1,500-byte IPv4 packets with the Don't Fragment bit set. A router on the path must forward them over a link whose MTU is 1,400 bytes. What does the router do?

- A: It drops each packet and returns an ICMP error that gives the 1,400-byte MTU.
- B: It fragments each packet anyway, since the DF bit is only a hint to routers.
- C: It cuts each packet to 1,400 bytes and lets the receiver's TCP ask for the rest.
- D: It forwards each packet whole, and the next link layer splits it into frames.

> DF forbids fragmentation, so the router discards the packet and returns
> ICMP Destination Unreachable, code 4 (fragmentation needed and DF set),
> carrying the next-hop MTU. The sender lowers its packet size and retries:
> this is path MTU discovery. If a firewall drops that ICMP message, the
> sender never learns, and large packets vanish while small ones get through:
> a PMTUD black hole. DF is not advisory, IP never truncates a packet, and an
> Ethernet link cannot carry a packet larger than its MTU.

## networks-intermediate-026
topic: models
answer: B

A host receives an Ethernet II frame carrying a TCP segment over IPv4. Which pair of header values tells it to hand the frame's payload to IPv4, and then IPv4's payload to TCP?

- A: EtherType 0x0806, then IP Protocol 6
- B: EtherType 0x0800, then IP Protocol 6
- C: EtherType 0x0800, then IP Protocol 17
- D: EtherType 0x86DD, then IP Protocol 6

> Each header names the protocol inside it. EtherType 0x0800 is IPv4 (0x0806
> is ARP, 0x86DD is IPv6), and the IPv4 Protocol field 6 is TCP (17 is UDP,
> 1 is ICMP). TCP then uses the destination port, together with the
> addresses, to find the socket.

## networks-intermediate-027
topic: models
answer: B, C, E

Which of these statements about how routing protocols carry their own messages are true? Select all that apply.

- A: OSPF runs over TCP, so that its link-state updates arrive in order.
- B: OSPF runs directly over IP, as protocol 89, and acknowledges its own link-state updates.
- C: BGP runs over TCP, on port 179, and relies on it for reliable, ordered delivery of updates.
- D: BGP runs over UDP and resends its whole table every 30 seconds.
- E: RIP runs over UDP, on port 520, and resends its full table periodically, so a lost update is replaced by the next.

> The three sit at different layers. OSPF has no transport protocol under it:
> its packets go straight into IP (protocol 89), so OSPF acknowledges and
> retransmits its own link-state updates. BGP opens a TCP connection (port
> 179) to each peer and lets TCP handle reliability, so it sends a full table
> only once and then only changes. RIP sends UDP datagrams to port 520 and
> needs no acknowledgements because it repeats its whole table every 30
> seconds.
