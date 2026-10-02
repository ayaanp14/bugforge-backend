---
skill: networks
level: basic
---

## networks-basic-001
topic: models
answer: C

In the seven-layer OSI model, which layer sits directly above the network layer and directly below the session layer, and what is its job?

- A: Data link — moves frames across one link using MAC addresses
- B: Presentation — translates data formats, compresses and encrypts
- C: Transport — delivers data between processes on two hosts
- D: Physical — sends the bits as signals over the medium

> From the bottom, the OSI layers are physical (1), data link (2), network (3), transport (4), session (5), presentation (6) and application (7). Layer 4, transport, gives end-to-end delivery between processes, identified by port numbers, with reliability when the protocol (TCP) provides it. Each other option describes its own layer correctly, but none of those layers sits between network and session.

## networks-basic-002
topic: models
answer: A

A browser sends an HTTP request over TCP, IPv4 and Ethernet. Reading the frame from its front, in what order do the headers appear before the HTTP data?

- A: Ethernet header, IPv4 header, TCP header
- B: TCP header, IPv4 header, Ethernet header
- C: IPv4 header, TCP header, Ethernet header
- D: Ethernet header, TCP header, IPv4 header

> Each layer wraps what the layer above hands it. TCP puts its header in front of the HTTP data (a segment), IP puts its header in front of that (a packet), and Ethernet puts its header in front of the packet and its frame check sequence after it (a frame). So the outermost header, the first on the wire, is the one added last: Ethernet, then IPv4, then TCP. Option B is the order in which the headers were added, not the order in which they appear.

## networks-basic-003
topic: models
answer: D

In the naming most networking courses use, what is a unit of data called at the transport layer (TCP), the network layer (IP) and the data link layer (Ethernet), in that order?

- A: Frame, packet, segment
- B: Packet, segment, frame
- C: Segment, frame, packet
- D: Segment, packet, frame

> TCP's unit is a segment, IP's is a packet (some books call it a datagram) and Ethernet's is a frame; at the physical layer it is just bits. Option A is the right three names in reverse — the order you meet them when reading a frame from the outside in.

## networks-basic-004
topic: models
answer: B

A host receives an IPv4 packet. Which field tells its network layer whether to hand the payload to TCP or to UDP?

- A: The destination port number in the payload
- B: The Protocol field in the IPv4 header
- C: The EtherType field in the Ethernet header
- D: The TTL field in the IPv4 header

> Each header names what it carries, so the receiver can pass the payload up to the right protocol. The IPv4 header's Protocol field holds 6 for TCP and 17 for UDP. EtherType does the same job one layer down (IPv4, IPv6 or ARP), and the port number one layer up (which application) — the network layer cannot even find a port until it knows which transport header follows. TTL limits the packet's lifetime.

## networks-basic-005
topic: models
answer: A

The four-layer TCP/IP model (link, internet, transport and application, as RFC 1122 names them) has no session or presentation layer. Which of its layers takes over those OSI jobs?

- A: The application layer
- B: The transport layer
- C: The internet layer
- D: The link layer

> The TCP/IP application layer covers OSI layers 5, 6 and 7: an application protocol and the libraries it calls manage their own sessions and data formats (HTTP keeps a session with cookies; TLS, called by the application, does the encryption). The transport layer corresponds to OSI layer 4 only, the internet layer to layer 3, and the link layer to layers 1 and 2.

## networks-basic-006
topic: models
answer: D

A host sends an HTTP request over TCP, IPv4 and Ethernet. Which layer adds a trailer after the data as well as a header in front of it?

- A: The transport layer — TCP ends each segment with its checksum.
- B: The network layer — IPv4 ends each packet with its checksum.
- C: Every layer — each adds a header in front and a trailer behind.
- D: The data link layer — Ethernet ends each frame with a CRC.

> Ethernet appends a 4-byte frame check sequence (a CRC-32) so that the receiving interface can detect a damaged frame. TCP's checksum and IPv4's header checksum are fields inside their headers, at the front, not trailers. So only the data link layer adds both a header and a trailer.

## networks-basic-007
topic: models
answer: B, C, E

In the five-layer TCP/IP model (physical, data link, network, transport, application), which layers does a router work through when it forwards a packet addressed to some other host? Assume the router does no NAT and no filtering. Select all that apply.

- A: Transport
- B: Physical
- C: Network
- D: Application
- E: Data link

> The router receives the signal (physical), takes the frame off the link and checks it (data link), and reads the destination IP address to choose the next hop (network). It then builds a new frame for the outgoing link and sends it. The transport and application headers belong to the two end hosts; a router forwarding someone else's packet does not process them.

## networks-basic-008
topic: models
answer: B

An application hands 1,000 bytes to TCP, which sends them in one segment with a 20-byte header (no options). IP carries that segment in one IPv4 packet with a 20-byte header (no options). What is the IPv4 packet's total length?

- A: 1,020 bytes
- B: 1,040 bytes
- C: 1,000 bytes
- D: 1,058 bytes

> A packet is its own header plus everything it carries: 20 (IPv4 header) + 20 (TCP header) + 1,000 (data) = 1,040 bytes, the value in the IPv4 Total Length field. 1,020 leaves out one of the headers. 1,058 adds Ethernet's 14-byte header and 4-byte trailer, which belong to the frame, not the packet.

## networks-basic-009
topic: models
answer: C

Which pairing of protocol and OSI layer is correct?

- A: HTTP — transport layer
- B: IP — data link layer
- C: UDP — transport layer
- D: Ethernet — network layer

> UDP, like TCP, is a transport-layer protocol: it adds port numbers so data reaches the right process. HTTP is an application-layer protocol, IP is the network layer, and Ethernet covers the physical and data link layers.

## networks-basic-010
topic: models
answer: D

What is the main practical benefit of building network software in layers?

- A: Each layer encrypts the data again, so more layers mean more security.
- B: A packet can skip the network layer when its destination is close by.
- C: Header overhead disappears, because each layer reuses the header below it.
- D: A layer can be replaced (Wi-Fi for Ethernet) without touching those above.

> Each layer uses only the service of the layer below, through a fixed interface, so a layer's implementation can change without the others noticing: the same TCP and HTTP run unchanged over Ethernet, Wi-Fi or a mobile link. Layering adds headers rather than removing them, most layers do no encryption, and IP is used even to reach a host on the same LAN.

## networks-basic-011
topic: link-layer
answer: A, C, E

Which statements about an Ethernet MAC address are true? Select all that apply.

- A: It is 48 bits long, usually written as 12 hexadecimal digits.
- B: The DHCP server hands it out when the host joins the network.
- C: It addresses a frame to the next device on the same link.
- D: Routers read it to choose a path across the internet.
- E: In an address set by the maker, the first 24 bits identify the maker.

> A MAC address is 48 bits (six bytes, such as 3C:52:82:1A:7F:09), and in a manufacturer-assigned address the first three bytes are the maker's Organizationally Unique Identifier (OUI). It is used only to deliver a frame across one link. DHCP hands out IP addresses, not MAC addresses, and routers choose paths by destination IP address — they replace the MAC addresses on every hop.

## networks-basic-012
topic: link-layer
answer: B

Which destination MAC address does an Ethernet frame carry when it is meant for every device on the local network?

- A: `00:00:00:00:00:00`
- B: `FF:FF:FF:FF:FF:FF`
- C: `255.255.255.255`
- D: `01:00:5E:00:00:01`

> The all-ones MAC address is the Ethernet broadcast: every interface on the segment accepts it, and switches flood it out of every port. 255.255.255.255 is the IPv4 limited broadcast — an IP address, not a MAC address. 01:00:5E:00:00:01 is a multicast MAC address (the one the IPv4 group 224.0.0.1 maps to), accepted only by interfaces listening to that group, and all zeros is not a broadcast.

## networks-basic-013
topic: link-layer
answer: C

Host A (192.168.1.10/24) wants to send its first packet to host B (192.168.1.20/24) on the same LAN, and A's ARP cache is empty. What does A put on the wire first?

- A: An ARP request sent straight to B's MAC address, asking for B's IP address
- B: A DNS query asking the DNS server for B's MAC address
- C: An ARP request, broadcast to every host, asking who has 192.168.1.20
- D: The IP packet itself, sent to the broadcast MAC address so B receives it

> A knows B's IP address but needs B's MAC address to build the frame, and B is on A's own subnet, so A asks with ARP. The request goes to the broadcast MAC address because A cannot address B yet; only B answers, with a unicast ARP reply carrying its MAC address, which A caches and then uses for the packet. DNS maps names to IP addresses, not IP addresses to MAC addresses.

## networks-basic-014
topic: link-layer
answer: A

A laptop with address 192.168.1.25/24 and default gateway 192.168.1.1 sends a packet to 8.8.8.8. As the frame leaves the laptop, what are its destination IP address and destination MAC address?

- A: IP 8.8.8.8, and the gateway's MAC address
- B: IP 8.8.8.8, and the MAC address of the 8.8.8.8 server
- C: IP 192.168.1.1, and the gateway's MAC address
- D: IP 192.168.1.1, and the MAC address of the 8.8.8.8 server

> 8.8.8.8 is not in 192.168.1.0/24, so the laptop hands the packet to its gateway: it ARPs for 192.168.1.1 and puts the gateway's MAC address in the frame. The IP header still names the real destination, 8.8.8.8, which the routers use all the way there. The laptop can never learn a remote server's MAC address — ARP works only on the local link.

## networks-basic-015
topic: link-layer
answer: B

A packet travels from host X through two routers to host Y, and no NAT is involved. Which statement about its addresses is true?

- A: The IP and MAC addresses both stay the same on every link.
- B: The IP addresses stay the same; the MAC addresses change on every link.
- C: The MAC addresses stay the same; the IP addresses change at every router.
- D: The IP and MAC addresses are both rewritten by every router.

> IP addresses are end to end: they name the original sender and the final destination, and routers forward by them without changing them. MAC addresses reach across one link only, so each router strips the incoming frame and builds a new one, with its outgoing interface's MAC address as the source and the next hop's as the destination. With three links here, the packet travels in three different frames.

## networks-basic-016
topic: link-layer
answer: C

An Ethernet interface receives a frame whose frame check sequence does not match the frame's contents. What does it do?

- A: Corrects the damaged bits using the CRC and passes the frame up
- B: Sends a negative acknowledgement asking the sender to retransmit it
- C: Discards the frame, leaving any recovery to a higher layer
- D: Passes the frame up to IP, marked as damaged, so IP can decide

> Ethernet's CRC detects errors but cannot locate or correct them, and Ethernet has no acknowledgements or retransmission, so the damaged frame is dropped. If the data was part of a TCP stream, the missing segment is never acknowledged and the TCP sender retransmits it; over UDP the data is simply lost.

## networks-basic-017
topic: link-layer
answer: A

On a shared, half-duplex Ethernet segment that uses CSMA/CD, what does a station do when it detects a collision while sending?

- A: Stops, sends a jam signal, waits a random backoff time, then tries again
- B: Finishes the frame, then waits for the receiver to acknowledge it
- C: Stops, and waits until a token reaches it before trying again
- D: Stops, waits a fixed time that is the same for every station, then resends

> The jam signal makes sure every station notices the collision. Each one then waits a random number of slot times (binary exponential backoff, with a wider range after each repeated collision), so they are unlikely to collide again. A fixed, equal wait would make them collide again at once, and tokens belong to token-passing networks. Full-duplex switched Ethernet has no collisions and does not use CSMA/CD at all.

## networks-basic-018
topic: link-layer
answer: D

A desktop reports "Network cable unplugged", and the link light on its network port is off. At which OSI layer is the fault?

- A: Network
- B: Data link
- C: Transport
- D: Physical

> With no link light, the interface sees no signal on the cable at all: a missing or broken cable, a dead port, or a switch that is switched off. That is the physical layer, layer 1. Nothing above it — frames, IP, TCP — can work until there is a signal.

## networks-basic-019
topic: link-layer
answer: A

Why does Wi-Fi (IEEE 802.11) use collision avoidance (CSMA/CA) instead of the collision detection that classic shared Ethernet used?

- A: A radio cannot reliably hear a collision while it is transmitting.
- B: Wi-Fi frames carry no checksum, so a collision cannot be noticed.
- C: Wi-Fi stations always send and receive at the same time on one channel.
- D: Wi-Fi passes a token, so two stations can never send at once.

> A station's own transmission is far stronger at its antenna than any other signal, and a hidden station out of its range may be sending to the same access point, so it cannot detect a collision as it happens. Instead it waits a random backoff before sending and relies on an acknowledgement for each frame. 802.11 frames do carry a frame check sequence, a station cannot send and receive at once on its channel, and there is no token.

## networks-basic-020
topic: link-layer
answer: C

Which job belongs to the data link layer?

- A: Choosing the route to a host on another network
- B: Giving each application on a host its own port number
- C: Framing data for the next device on the same link
- D: Turning each bit into a voltage, light or radio signal

> The data link layer packages a packet into a frame, addresses it by MAC address to the next device on the same link, and checks it for errors on arrival. Choosing a path across networks is the network layer's job, port numbers are the transport layer's, and turning bits into signals is the physical layer's.

## networks-basic-021
topic: ip-addressing
answer: D

Which of these addresses is in one of the private IPv4 ranges set aside by RFC 1918?

- A: `172.32.10.5`
- B: `192.169.1.1`
- C: `11.0.0.1`
- D: `172.20.10.5`

> The private ranges are 10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16. 172.20.10.5 falls in the middle one. 172.32.10.5 is just past that range's end, 192.169.1.1 is outside 192.168.x.x, and 11.0.0.1 is outside 10.x.x.x — all three are public addresses.

## networks-basic-022
topic: ip-addressing
answer: B

Under the old classful scheme, which class does 191.200.4.1 belong to, and what was that class's default mask?

- A: Class A, 255.0.0.0
- B: Class B, 255.255.0.0
- C: Class C, 255.255.255.0
- D: Class B, 255.255.255.0

> The class comes from the first octet: 1 to 126 class A, 128 to 191 class B, 192 to 223 class C, 224 to 239 class D (multicast). 191 is the last class B value, and class B's default mask is 255.255.0.0 (/16): two octets of network, two of host. 255.255.255.0 was class C's default.

## networks-basic-023
topic: ip-addressing
answer: D

How many addresses in 192.168.10.0/24 can be assigned to hosts?

- A: 256
- B: 255
- C: 253
- D: 254

> /24 leaves 32 − 24 = 8 host bits, which make 2^8 = 256 addresses. The first (192.168.10.0, all host bits 0) names the network and the last (192.168.10.255, all host bits 1) is its broadcast address, so 256 − 2 = 254 can go to hosts. The router's address is one of those 254, not a further reservation.

## networks-basic-024
topic: ip-addressing
answer: A

A network is 172.16.0.0/16. How many usable host addresses does it have?

- A: 65,534
- B: 65,536
- C: 65,535
- D: 254

> /16 leaves 16 host bits: 2^16 = 65,536 addresses, minus the network address (172.16.0.0) and the broadcast address (172.16.255.255), gives 65,534. 254 is the count for a /24.

## networks-basic-025
topic: ip-addressing
answer: B

A host has the address 10.1.5.77 with mask 255.255.255.0. What are its network address and its network's broadcast address?

- A: `10.0.0.0` and `10.255.255.255`
- B: `10.1.5.0` and `10.1.5.255`
- C: `10.1.5.1` and `10.1.5.254`
- D: `10.1.0.0` and `10.1.255.255`

> The mask keeps the first three octets as the network part, so the network is 10.1.5.0 (host bits all 0) and the broadcast is 10.1.5.255 (host bits all 1). Option A applies the classful class A mask, which the configured mask overrides; option C gives the first and last usable host addresses; option D is what a /16 mask would give.

## networks-basic-026
topic: ip-addressing
answer: C

Host A is 192.168.1.10/24 with default gateway 192.168.1.1. It sends a packet to host B at 192.168.2.10. What does A do with the packet?

- A: ARPs for 192.168.2.10 and sends the frame straight to B
- B: Drops it, because private addresses cannot be routed
- C: Sends it to the default gateway, as B is on another network
- D: Broadcasts it to every host on the LAN so that B can pick it up

> A applies its own /24 mask to both addresses: its network is 192.168.1.0 and B's address falls in 192.168.2.0. They differ, so B is not on A's link, and A hands the packet to the gateway (ARPing for 192.168.1.1, not for B). Private addresses are routed normally inside an organisation's own network; they are only kept off the public internet.

## networks-basic-027
topic: ip-addressing
answer: C

A laptop set to obtain its IP address automatically shows the address 169.254.37.12. What does this tell you?

- A: It got its address from the DHCP server of a guest network.
- B: It is the loopback address the laptop uses to talk to itself.
- C: No DHCP server answered, so it gave itself a link-local address.
- D: Its ISP assigned it a public address for direct internet access.

> 169.254.0.0/16 is the IPv4 link-local range. A host that asks for a DHCP lease and gets no answer can pick an address there by itself (Windows calls this APIPA), which lets it reach only other hosts on the same link, with no gateway. The usual cause is a DHCP server that is down or unreachable. Loopback is 127.0.0.0/8, and 169.254 addresses are never handed out by DHCP or routed on the internet.
