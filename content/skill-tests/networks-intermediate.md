---
updated: 2026-10-03
question: What does the Computer Networks (Intermediate) skill test cover?
answer: It examines the arithmetic and the inner workings of networking: CIDR subnetting, VLSM and route summarisation, NAT and IPv6 addressing, distance-vector and link-state routing, longest-prefix match, TCP sequence numbers, flow and congestion control, sliding-window protocols, error detection, CSMA/CD and CSMA/CA, DNS caching, HTTP/2 and HTTP/3, the TLS handshake, VLANs and Spanning Tree. Most questions give a small scenario and ask for its exact result.
q: How much arithmetic is there on the Computer Networks Intermediate test?
a: A good share of the paper. Expect to work out subnets in binary, sum link costs along a path, follow sequence numbers and congestion windows round by round, compute link utilisation and minimum frame sizes, divide a CRC and add a checksum. The numbers are chosen so that each step is short; what the questions test is knowing which formula applies and which detail it hinges on.
q: Which version of TCP congestion control do the questions assume?
a: Classic TCP Reno, and the question says so whenever it matters: slow start doubling the window each round trip up to ssthresh, linear growth after it, a timeout dropping the window to one segment, and three duplicate ACKs halving it through fast recovery. Modern defaults such as CUBIC are not examined, and Tahoe appears only as the contrast to Reno.
q: Do I need to know Cisco commands or vendor defaults?
a: No commands are asked. Where an answer depends on a default that comes from a vendor or an older standard, such as the OSPF reference bandwidth or the 802.1D Spanning Tree port costs and timers, the question gives the numbers, so you need to know how they are used rather than remember them.
q: Is IPv6 on the Intermediate test?
a: Yes. Questions cover the 128-bit address and its compression rules (dropping leading zeros, using a double colon once), counting subnets in a prefix, link-local addresses, how Neighbor Discovery replaces ARP without any broadcast, and how the IPv6 header differs from IPv4's, for example in having no checksum.
q: Should I pass the Basic networks test first?
a: It is not required, but the Intermediate paper assumes everything the Basic one examines, from the layers and devices to the three-way handshake. If network and broadcast addresses for a /24 or the job of each header are not yet automatic, the Basic test is the better place to start.
---

Computer Networks (Intermediate) examines networking the way it is worked out on paper: an address and a prefix length turned into a subnet, a routing table searched for its longest match, a TCP window followed round by round, a link's utilisation computed from its speed and delay. It assumes everything in the [Computer Networks (Basic) test](/skill-tests/networks-basic) and asks for exact results and the reasons behind them.

The questions are multiple choice, and a few ask you to select every correct option, where only the exact set scores. Most describe a small scenario: an address and its prefix length, a short forwarding table, a few routers with link costs, a sender's congestion window, a message and a CRC generator. The wrong options are what the common slips produce, so careful working matters more than speed.

## What each topic examines

The questions are spread evenly across eight topics. The [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) are the place to drill all of them.

- **OSI and TCP/IP models.** How the layers interact rather than what they are called: header overhead and goodput on a real link, the MSS for a given MTU over IPv4 and IPv6, IPv4 fragmentation and its offset field, path MTU discovery, which fields every router rewrites, which checksum catches which error, and how each routing protocol carries its messages.
- **Physical and data link layers.** Stop-and-wait and sliding-window utilisation, the window needed to keep a link busy, the sequence-number limits of Go-Back-N and Selective Repeat, CRC division, Hamming distance and what a code can detect and correct, two-dimensional parity, the minimum frame size for CSMA/CD, exponential backoff, and how CSMA/CA avoids collisions.
- **IP addressing.** Network and broadcast addresses for any prefix length, host counts, splitting a block into subnets, VLSM allocation, route summarisation, PAT, and IPv6 compression, subnetting and link-local addresses. If binary still feels slow, the [bit manipulation lesson](/roadmap/bit-manipulation) is good practice for reading masks.
- **Routing.** Longest-prefix match, the distance-vector update and count to infinity, split horizon and poison reverse, link-state flooding and [Dijkstra's algorithm](/roadmap/dijkstras-algorithm) on a small graph, the difference between a next hop and a predecessor, and how RIP, OSPF and BGP choose routes. The [shortest-path problems](/challenges/shortest-path) are the same algorithm in code.
- **TCP and UDP.** Sequence and acknowledgement numbers across an exchange, cumulative ACKs after a loss, the receive window, window-limited throughput, slow start and congestion avoidance under Reno, the sawtooth's average rate, teardown states, TIME_WAIT, and the Internet checksum.
- **Application protocols.** DNS caching and TTLs, reverse lookups, MX preference, why a zone apex cannot be a CNAME, DNS over TCP, round trips for persistent and non-persistent HTTP, conditional requests, and head-of-line blocking in HTTP/1.1, HTTP/2 and HTTP/3.
- **Network security.** What encrypts what in TLS 1.3, how a certificate chain is checked, how a server proves it owns its certificate, forward secrecy, handshake round trips, wildcard certificates, Diffie–Hellman with small numbers, rule order in a packet filter, SYN cookies and IPsec tunnel mode.
- **Devices and topologies.** VLANs and broadcast domains, 802.1Q trunks and the native VLAN, routing between VLANs, Spanning Tree root election, root ports and convergence time, broadcast storms, and the delay a store-and-forward switch adds.

## The conventions questions state

Several of these results depend on a convention, and a question always names the one it uses. A subnet's usable hosts exclude its network and broadcast addresses. Utilisation questions say whether the acknowledgement's transmission time and processing delays count (usually they do not). Congestion-window questions number the rounds and give the starting window and threshold. OSPF costs come with the reference bandwidth, and Spanning Tree questions give the port costs and timers. Error-detection questions say which bits may be corrupted and which arrive intact. Read that sentence of each question twice: it is usually where the answer turns.

## How to prepare

Work the arithmetic by hand until each kind is routine. Take a few addresses with prefixes between /19 and /30 and write out the network, broadcast and host range; then split a /24 for four LANs of different sizes, largest first. Trace Dijkstra on a six-node graph and write down the order in which nodes are fixed. Follow a TCP sender from a window of one segment through slow start, a timeout and congestion avoidance, writing the window for every round. Divide a short message by a CRC generator, and add three 16-bit words as the Internet checksum does.

Then connect the numbers to what you can observe. Running `ip addr` or `ipconfig` shows a real prefix; `dig` shows TTLs counting down in a resolver's cache; a browser's developer tools show whether a page loaded over HTTP/1.1, HTTP/2 or HTTP/3; and a packet capture of one download shows sequence numbers, acknowledgements and the advertised window moving together.

## Where candidates lose marks

- Forgetting that a SYN and a FIN each consume one sequence number, or giving the last byte received where an acknowledgement names the next byte expected.
- Treating a timeout and three duplicate ACKs alike. Under Reno only the timeout drops the window to one segment.
- Summarising or subnetting on a boundary that is not a multiple of the block size.
- Using the one-way propagation delay where a round trip is needed, in utilisation and in minimum frame size.
- Naming the router just before the destination as the next hop.
- Assuming the public key encrypts the data in TLS. It authenticates; symmetric keys from the key exchange carry the traffic.

## Sample question
topic: transport
answer: B

A TCP sender's congestion window is 12 segments, and the receiver has just advertised a receive window of 8 segments. All segments are full-sized and nothing is in flight yet. How many segments can the sender transmit before it must wait for an acknowledgement?

- A: 4
- B: 8
- C: 12
- D: 20

> A TCP sender may have at most the smaller of the two windows unacknowledged: min(cwnd, rwnd) = min(12, 8) = 8. The congestion window is the sender's estimate of what the network can carry, and the receive window is the space left in the receiver's buffer, so both limits apply at once. 12 ignores flow control, 20 adds the two windows together, and 4 subtracts one from the other.
