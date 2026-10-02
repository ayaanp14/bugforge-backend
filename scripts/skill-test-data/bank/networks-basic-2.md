---
skill: networks
level: basic
---

## networks-basic-028
topic: ip-addressing
answer: D

How long is an IPv4 address, and how long is an IPv6 address?

- A: 32 bits and 64 bits
- B: 48 bits and 128 bits
- C: 64 bits and 128 bits
- D: 32 bits and 128 bits

> IPv4 addresses are 32 bits, written as four decimal octets (192.0.2.7); IPv6 addresses are 128 bits, written as eight groups of up to four hexadecimal digits (2001:db8::7). 48 bits is the size of a MAC address, and 64 bits is the usual size of the interface part of an IPv6 address.

## networks-basic-029
topic: ip-addressing
answer: A, D

In the network 192.168.5.0/24, which of these addresses cannot be assigned to a host? Select all that apply.

- A: `192.168.5.0`
- B: `192.168.5.1`
- C: `192.168.5.128`
- D: `192.168.5.255`
- E: `192.168.5.254`

> In a /24 the last octet is the host part. All zeros (.0) is the network's own address and all ones (.255) is its broadcast address; neither can go to a host. Everything from .1 to .254 is usable, including .128 — that address is special only when the network is split into smaller subnets, which this one is not.

## networks-basic-030
topic: ip-addressing
answer: A

A server sends one stream of a live lecture, and the network delivers copies of it only to the hosts that have joined that stream's group. What kind of delivery is this?

- A: Multicast
- B: Broadcast
- C: Unicast
- D: Anycast

> Multicast sends one stream to a group address (in IPv4, 224.0.0.0 to 239.255.255.255, the old class D), and the network copies it only toward hosts that joined the group. Unicast is one sender to one receiver, broadcast goes to every host on the network whether it wants the data or not, and anycast delivers to the nearest one of several hosts that share an address.

## networks-basic-031
topic: routing
answer: B

Which part of an incoming packet does a router look up in its routing table to decide where to send the packet next?

- A: The destination MAC address
- B: The destination IP address
- C: The source IP address
- D: The destination port number

> A router forwards by destination IP address: it finds the routing-table entry that best matches that address and sends the packet to the entry's next hop or interface. The destination MAC address only brought the frame to the router itself; the source address says where the packet came from, not where it is going; and port numbers belong to the end hosts' transport layer.

## networks-basic-032
topic: routing
answer: B

A router's table holds three routes: 192.168.1.0/24 directly connected, 10.0.0.0/8 via 172.16.0.2, and 0.0.0.0/0 via 203.0.113.1. A packet arrives for 8.8.4.4. What does the router do?

- A: Drops it, because no route names 8.8.4.4
- B: Sends it to 203.0.113.1, using the default route
- C: Sends it to 172.16.0.2, the first next hop listed
- D: Floods it out of every interface except the one it came in on

> 8.8.4.4 is in neither 192.168.1.0/24 nor 10.0.0.0/8. The route 0.0.0.0/0 has a zero-length prefix, so it matches every address: it is the default route, used whenever nothing more specific matches. Without it the router would drop the packet and report Destination Unreachable; routers never flood packets the way switches flood frames.

## networks-basic-033
topic: routing
answer: A

A host sends a packet with a TTL of 64. The packet passes through 5 routers before it reaches the destination host. What TTL does it carry when the destination receives it?

- A: 59
- B: 58
- C: 64
- D: 69

> Every router that forwards the packet decrements its TTL by 1; the sending and receiving hosts do not. Five routers take it from 64 to 59. 58 counts the destination as a hop too, and the TTL never goes up on the way.

## networks-basic-034
topic: routing
answer: C

A router decrements a packet's TTL and the result is 0. What does the router do, as the IP standards require?

- A: Resets the TTL to 64 and forwards the packet
- B: Forwards it, marked so that the destination will discard it
- C: Drops it and sends ICMP Time Exceeded back to the source
- D: Sends it back to the previous router to try another path

> TTL exists so that a packet caught in a routing loop dies instead of circling for ever. When it reaches 0 the router drops the packet and tells the sender with an ICMP Time Exceeded message. Resetting the TTL would defeat its purpose, and IP has no mechanism for handing a packet back to try another path.

## networks-basic-035
topic: routing
answer: D

How does traceroute discover the routers on the path to a destination?

- A: It asks each router on the path for its routing table and follows the next hops.
- B: Every IP packet records the routers it crosses, and traceroute reads that list.
- C: It sends one probe, and the destination replies with the routers the probe crossed.
- D: It sends probes with TTL 1, 2, 3 and so on; each router where one expires replies.

> A probe with TTL 1 expires at the first router, which drops it and sends back ICMP Time Exceeded, revealing its address. A probe with TTL 2 expires at the second router, and so on, until a probe reaches the destination, which answers differently (an Echo Reply, or Port Unreachable for UDP probes). Ordinary IP packets carry no list of routers, and routers do not hand their routing tables to hosts.

## networks-basic-036
topic: routing
answer: D

Which protocol and messages does the ping command use?

- A: TCP SYN and SYN-ACK segments to port 80
- B: ARP Request and ARP Reply
- C: UDP datagrams to port 53
- D: ICMP Echo Request and Echo Reply

> ping sends ICMP Echo Request messages and times the Echo Replies that come back, reporting round-trip time and loss. ICMP is carried directly in IP, with no TCP or UDP and no port numbers. ARP only resolves addresses on the local link; ping may trigger an ARP exchange first, but that is not the ping itself.

## networks-basic-037
topic: routing
answer: C

A user runs `ping 127.0.0.1` and gets replies, but a ping to the default gateway times out. What does the successful ping to 127.0.0.1 show?

- A: The network cable and the switch port it plugs into are working.
- B: The default gateway's address is set correctly and is reachable.
- C: The host's own TCP/IP stack works; the packets never left it.
- D: The DNS server is reachable and is resolving names correctly.

> 127.0.0.1 is the loopback address (all of 127.0.0.0/8 is loopback): packets sent to it are turned around inside the host's own IP stack and never reach the network card. So a reply proves the stack is working and nothing more; the cable, the switch and the gateway are the next things to check. No name was looked up, so DNS played no part.

## networks-basic-038
topic: routing
answer: B

Which statement correctly describes static routing?

- A: Routers learn routes from each other and reroute around a failed link by themselves.
- B: An administrator enters the routes, and routers find no new path when a link fails.
- C: Every packet is flooded over all links so that at least one copy arrives.
- D: Routes are learned from the source MAC addresses seen in incoming frames.

> A static route is typed in by hand and stays as entered. Routers do not exchange static routes, so when a link fails nothing finds an alternative path unless an administrator has configured one in advance or changes the routes. Option A describes dynamic routing (RIP, OSPF, BGP); option D is how a switch fills its MAC address table, not how a router learns routes.

## networks-basic-039
topic: routing
answer: A

A router has two routes: 10.0.0.0/8 via router P, and 10.1.0.0/16 via router Q. A packet arrives for 10.1.2.3, which both routes match. Where does the router send it?

- A: To Q, because its route is more specific
- B: To P, because its route was entered first
- C: To P, because its route covers more addresses
- D: To both P and Q, one copy each

> When several routes match, a router uses the most specific one, the longest prefix. 10.1.0.0/16 matches the first 16 bits of 10.1.2.3 and 10.0.0.0/8 only the first 8, so the packet goes to Q. The /8 route still carries every other 10.x.x.x address. The order in which routes were entered does not matter, and a router sends one copy of a unicast packet.

## networks-basic-040
topic: routing
answer: A

Which routing protocol do internet service providers use to exchange routes between their networks (autonomous systems)?

- A: BGP
- B: OSPF
- C: RIP
- D: ICMP

> BGP (Border Gateway Protocol) is the exterior gateway protocol that carries routes between autonomous systems, and so holds the internet's routing together. OSPF and RIP are interior protocols, run inside one organisation's network. ICMP carries error and diagnostic messages (ping, Time Exceeded); it does not exchange routes.

## networks-basic-041
topic: transport
answer: B

Which statement about UDP is true?

- A: It sets up a connection with a handshake before sending any data.
- B: It sends each datagram alone, with no delivery or order guarantee.
- C: It retransmits a datagram when no acknowledgement arrives in time.
- D: It delivers data to the application in the order it was sent.

> UDP adds only ports, a length and a checksum to the data: no connection, no acknowledgements, no retransmission and no reordering. A datagram may be lost, duplicated or arrive out of order, and the application must cope. Handshakes, retransmission and in-order delivery are TCP's.

## networks-basic-042
topic: transport
answer: B, D

Which of these normally run over UDP? Select all that apply.

- A: An SSH login to a remote server
- B: A DNS lookup of a website's address
- C: A browser loading a page over HTTP/1.1
- D: A DHCP client asking for an IP address
- E: A mail client sending a message over SMTP

> An ordinary DNS query and its answer each fit in one UDP datagram (port 53; DNS falls back to TCP for large answers and zone transfers), and DHCP uses UDP ports 67 and 68, since a client with no address yet cannot hold a TCP connection. SSH, HTTP/1.1 and SMTP all need a reliable byte stream and run over TCP.

## networks-basic-043
topic: transport
answer: D

A client sends a TCP SYN to port 8080 on a server where no program is listening on that port, and no firewall is in the way. What does the server's TCP send back?

- A: A SYN-ACK, and the connection waits for a program to start listening
- B: An ICMP Port Unreachable message
- C: Nothing; the client's SYN simply times out
- D: A segment with the RST flag set, refusing the connection

> TCP answers a SYN for a port with no listener with a reset (RST), and the client reports "connection refused" at once. ICMP Port Unreachable is the answer to a UDP datagram sent to a closed port. A silent timeout is what a client sees when a firewall drops the SYN, which the question rules out.

## networks-basic-044
topic: transport
answer: C

A client opens a TCP connection with a SYN whose sequence number is 1000. The server answers with a SYN-ACK whose own sequence number is 5000. What acknowledgement number does the SYN-ACK carry?

- A: 1000
- B: 5000
- C: 1001
- D: 5001

> An acknowledgement number is the next sequence number the sender of the ACK expects to receive. The SYN occupies one sequence number (1000) even though it carries no data, so the server expects 1001 next. The client's final ACK will in turn carry the acknowledgement number 5001.

## networks-basic-045
topic: transport
answer: C

A client's SYN goes from 192.168.1.5, port 51034, to a web server at 93.184.216.34, port 443. Which ports does the server's SYN-ACK carry?

- A: Source 51034, destination 443
- B: Source 443, destination 443
- C: Source 443, destination 51034
- D: Source 80, destination 51034

> A reply swaps the two ends: it comes from the port the client connected to (443) and goes to the port the client sent from (51034), an ephemeral port the client's operating system picked for this connection. Port 80 is plain HTTP, which this connection is not using.

## networks-basic-046
topic: transport
answer: D

A laptop runs a browser and an email client at the same time, and both receive data at the laptop's single IP address. What lets the laptop's transport layer hand each arriving segment to the right program?

- A: The destination MAC address in each frame
- B: The TTL value in each packet
- C: The sequence number in each segment
- D: The destination port in each segment

> Each program's connections are bound to their own ports, so the destination port (together with the addresses and the source port that identify a TCP connection) decides which socket, and so which program, receives the data. The MAC and IP addresses only get the data to the laptop; the TTL limits a packet's lifetime; sequence numbers order the bytes within one connection.

## networks-basic-047
topic: transport
answer: A

Which of these is how a TCP sender learns that a segment it sent was lost?

- A: No acknowledgement for it arrives before its retransmission timer expires.
- B: The router that dropped it sends the sender a TCP reset.
- C: The receiver's network card asks for it again using the Ethernet checksum.
- D: The IP layer reports the loss through the packet's TTL field.

> TCP infers loss from acknowledgements: when the timer for an unacknowledged segment expires, the sender retransmits it (it also retransmits early after several duplicate acknowledgements). Routers do not send TCP resets for packets they drop, Ethernet never asks for a retransmission, and the TTL only limits how long a packet can live.

## networks-basic-048
topic: transport
answer: B

Why do live voice and video calls usually send their media over UDP rather than TCP?

- A: UDP encrypts the media itself, while TCP sends it as plain text.
- B: Late, resent audio is useless live, and UDP never waits for it.
- C: UDP guarantees that every packet arrives, which TCP does not.
- D: UDP packets take a shorter route through the network than TCP.

> Over TCP, one lost segment holds back everything after it until the retransmission arrives, which a caller hears as a freeze. In a live call it is better to skip the lost fragment of audio and play the next one, so the media goes over UDP (usually as RTP). Neither protocol encrypts anything by itself, UDP guarantees nothing, and routing does not depend on the transport protocol.

## networks-basic-049
topic: transport
answer: D

Which TCP flag does one side send to say that it has finished sending and wants to close the connection in the normal, orderly way?

- A: SYN
- B: RST
- C: PSH
- D: FIN

> FIN closes one direction: each side sends a FIN when it has nothing more to send, and the other side acknowledges it. RST aborts the connection at once, discarding anything in flight; SYN opens a connection; PSH asks the receiver to pass buffered data to the application promptly.

## networks-basic-050
topic: transport
answer: A, C, E

Which of these does TCP provide that UDP does not? Select all that apply.

- A: Delivery of the data in the order it was sent
- B: Port numbers to identify the sending and receiving programs
- C: Retransmission of data that was lost
- D: A checksum over the header and the data
- E: A connection set up before any data flows

> Ordering, retransmission and connection setup are TCP's own, built from sequence numbers, acknowledgements and the three-way handshake. Port numbers and a checksum are in both headers: UDP's 8-byte header is exactly source port, destination port, length and checksum.

## networks-basic-051
topic: application
answer: A

Which pairing of protocol and default port is correct?

- A: SSH — port 22
- B: SMTP — port 110
- C: DNS — port 25
- D: HTTPS — port 8080

> SSH listens on port 22. SMTP uses port 25 (110 is POP3, for retrieving mail), DNS uses port 53, and HTTPS uses port 443; 8080 is a common alternative port for HTTP servers, not the standard HTTPS port.

## networks-basic-052
topic: application
answer: B

FTP uses two connections. To which well-known server port does the client connect for the control connection, which carries commands such as USER and RETR?

- A: 20
- B: 21
- C: 22
- D: 23

> The control connection goes to port 21 and stays open for the session. Files and directory listings travel over a separate data connection — from server port 20 in active mode, or to a port the server names in passive mode. Port 22 is SSH and port 23 is Telnet.

## networks-basic-053
topic: application
answer: C

A laptop looks up www.example.com. The laptop's cache and its recursive resolver's cache are both empty. In what order does the recursive resolver ask servers?

- A: The .com server, then a root server, then example.com's authoritative server
- B: example.com's authoritative server, then the .com server, then a root server
- C: A root server, then the .com server, then example.com's authoritative server
- D: A root server, then example.com's authoritative server, then the .com server

> Resolution walks down the name from the right. A root server refers the resolver to the .com servers; a .com server refers it to example.com's authoritative name servers; one of those gives the address of www.example.com. The resolver returns that to the laptop and caches every answer for its TTL, so later lookups skip steps.

## networks-basic-054
topic: application
answer: D

A mail server has a message for priya@example.com. Which DNS record type does it look up to find the server that accepts mail for example.com?

- A: A
- B: CNAME
- C: PTR
- D: MX

> An MX (mail exchanger) record names the host that receives mail for a domain, with a preference number when there are several. The sender then looks up that host's A or AAAA record to get its address. An A record maps a name to an IPv4 address, CNAME makes one name an alias of another, and PTR maps an address back to a name.
