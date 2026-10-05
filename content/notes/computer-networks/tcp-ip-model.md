---
title: The TCP/IP Model
order: 3
minutes: 9
level: beginner
updated: 2026-10-05
seo-title: TCP/IP Model: Layers, Protocols and OSI vs TCP/IP
description: The TCP/IP model's four layers and the protocols at each, how they map onto the seven OSI layers, and the OSI vs TCP/IP differences interviewers ask about.
question: What is the TCP/IP model?
answer: The TCP/IP model, also called the Internet protocol suite, is the layered architecture the internet actually runs on. RFC 1122 describes four layers: Application, Transport, Internet and Link (network access). It is named after its two core protocols, TCP and IP. Many textbooks teach a five-layer version that splits the link layer into data link and physical.
q: How many layers does the TCP/IP model have?
a: Four in the original definition (RFC 1122): Application, Transport, Internet and Link. Textbooks such as Forouzan's and Kurose and Ross's use five layers, splitting Link into Data Link and Physical. Both are correct if you say which version you mean.
q: How does the TCP/IP model map to the OSI model?
a: OSI's application, presentation and session layers merge into the TCP/IP application layer. Transport maps to transport, and the OSI network layer maps to the internet layer. The OSI data link and physical layers together form the TCP/IP link (network access) layer.
q: What is the main difference between the OSI and TCP/IP models?
a: OSI is a seven-layer reference model designed before its protocols, used today for teaching and troubleshooting. TCP/IP is a four-layer model written to describe protocols that already worked, and it is what the internet runs on. TCP/IP folds session and presentation duties into the application.
q: Which protocols work at the internet layer of the TCP/IP model?
a: IP (IPv4 and IPv6) is the core protocol, with ICMP for error reporting and diagnostics (ping), IGMP for IPv4 multicast group membership and IPsec for security. OSPF is also carried directly in IP. ARP is usually placed in the link layer because it never leaves the local network.
q: Why is it called the TCP/IP model?
a: It is named after its two most important protocols: the Transmission Control Protocol, which provides reliable byte streams between programs, and the Internet Protocol, which addresses and routes packets between networks. The suite also includes UDP, ICMP, DNS, HTTP and many others.
---

The TCP/IP model describes the protocol suite that runs the internet. It grew out of ARPANET research funded by the US Department of Defense, which is why older books call it the DoD model, and ARPANET switched over to TCP/IP on 1 January 1983. Unlike OSI, which was designed on paper first, TCP/IP was written down after the protocols already worked: RFC 1122 (1989) describes the layers that hosts implement. Interviewers ask about it mostly in comparison with [the OSI model](/notes/computer-networks/osi-model), so this note keeps both in view.

## The four layers

| Layer | Job | Key protocols | PDU |
| --- | --- | --- | --- |
| Application | Services for user programs; also the OSI session and presentation jobs | HTTP, HTTPS, DNS, SMTP, POP3, IMAP, FTP, SSH, DHCP, SNMP | Message |
| Transport | Process-to-process delivery using ports; reliability in TCP | TCP, UDP (also SCTP, QUIC over UDP) | Segment or datagram |
| Internet | Addressing and routing packets between networks | IPv4, IPv6, ICMP, IGMP, IPsec | Packet (datagram) |
| Link (network access) | Delivering frames on one local link, and the physical signalling | Ethernet, Wi-Fi, PPP, ARP | Frame |

### Application layer

Everything an application needs from the network lives here: the protocol's message format (an HTTP request, a DNS query), and any encryption, compression or session handling, which OSI would put in layers 5 and 6. TLS sits between this layer and TCP, and HTTPS is simply HTTP carried inside TLS.

### Transport layer

TCP gives a reliable, ordered, connection-oriented byte stream with flow control and congestion control. UDP gives connectionless, best-effort datagrams with almost no overhead. Both use 16-bit **port numbers** to deliver data to the right program. QUIC, which HTTP/3 uses, builds reliability on top of UDP. The details are in [TCP and UDP](/notes/computer-networks/tcp-and-udp).

### Internet layer

IP gives every interface an address and moves packets hop by hop towards the destination network. IP is **connectionless** and **best effort**: it does not promise delivery, order or freedom from duplicates; those are left to the transport layer. ICMP carries IP's error and diagnostic messages, such as "destination unreachable" and the echo request and reply that `ping` uses.

### Link layer

The link (or network access) layer moves a frame across one physical network to the next hop, using hardware addresses (MAC addresses on Ethernet and Wi-Fi). TCP/IP deliberately says little about it: IP runs over whatever link exists. ARP, which finds the MAC address for an IP address on the local network, is usually placed here.

## The five-layer version

Many Indian university syllabi and popular textbooks teach a five-layer hybrid, because it keeps the useful split between framing and signalling:

| Five-layer model | Four-layer model (RFC 1122) |
| --- | --- |
| Application | Application |
| Transport | Transport |
| Network | Internet |
| Data link | Link |
| Physical | Link |

If an interviewer asks "how many layers?", answer "four in the RFC, five in the textbook hybrid" and name them.

## How TCP/IP maps to OSI

| OSI layer | TCP/IP layer |
| --- | --- |
| 7 Application | Application |
| 6 Presentation | Application |
| 5 Session | Application |
| 4 Transport | Transport |
| 3 Network | Internet |
| 2 Data link | Link (network access) |
| 1 Physical | Link (network access) |

## Worked example: how each layer knows what is inside

A receiving host has to hand each unit to the right protocol above it. Every header carries a field that names its payload, so the host can **demultiplex** a frame step by step.

| Header | Field | Value | Meaning |
| --- | --- | --- | --- |
| Ethernet | EtherType | 0x0800 | The payload is an IPv4 packet |
| Ethernet | EtherType | 0x86DD | The payload is an IPv6 packet |
| Ethernet | EtherType | 0x0806 | The payload is an ARP message |
| IPv4 | Protocol | 6 | The payload is a TCP segment |
| IPv4 | Protocol | 17 | The payload is a UDP datagram |
| IPv4 | Protocol | 1 | The payload is an ICMP message |
| TCP | Destination port | 443 | Deliver to the HTTPS server process |
| UDP | Destination port | 53 | Deliver to the DNS server process |

So a frame with EtherType 0x0800, IP protocol 6 and destination port 443 is an HTTPS request: the link layer passes it to IPv4, IPv4 passes it to TCP, and TCP passes the bytes to the process listening on port 443. (In IPv6 the same job is done by the Next Header field.)

## Where the tricky protocols sit

Some protocols do a lower layer's job but are carried as application data. Interviewers use them to check that you know the difference between a protocol's purpose and its position.

| Protocol | Purpose | Carried in | TCP/IP layer |
| --- | --- | --- | --- |
| ARP | Finds a MAC address for an IP address | Ethernet frame directly | Link |
| ICMP | Errors and diagnostics for IP | IP packet (protocol 1) | Internet |
| OSPF | Routing inside one network | IP packet (protocol 89) | Internet |
| RIP | Routing inside one network | UDP port 520 | Application |
| BGP | Routing between networks | TCP port 179 | Application |
| DHCP | Assigning IP addresses | UDP ports 67 and 68 | Application |
| DNS | Translating names to addresses | UDP (and TCP) port 53 | Application |
| TLS | Encrypting application data | TCP | Between transport and application |

## OSI vs TCP/IP

| Aspect | OSI model | TCP/IP model |
| --- | --- | --- |
| Developed by | ISO, published 1984 | DARPA research (ARPANET), standardised by the IETF in RFCs |
| Number of layers | 7 | 4 (5 in the textbook hybrid) |
| How it was built | Model first, protocols designed to fit it | Protocols first, model written to describe them |
| Session and presentation | Separate layers | Handled inside the application layer |
| Network layer service | Connection-oriented and connectionless | Connectionless only (IP) |
| Transport layer service | Connection-oriented only | Both: TCP (connection-oriented) and UDP (connectionless) |
| Service, interface, protocol | Clearly separated concepts | Less clearly separated |
| Use today | Reference model for teaching and troubleshooting | The protocols the internet runs on |

The two service rows follow Tanenbaum's comparison and are a frequent written-exam question: OSI offers both kinds of service at the network layer but only connection-oriented service at the transport layer; TCP/IP is the other way round.

## Common mistakes

- Saying TCP/IP has exactly five layers without qualification: the RFC model has four; five is the textbook hybrid.
- Calling the TCP/IP internet layer "the network layer of TCP/IP" and then putting ARP in it: ARP is usually a link-layer protocol.
- Forgetting that session and presentation duties still exist in TCP/IP: they are done by the application or by TLS.
- Saying IP is reliable: IP is best effort; reliability comes from TCP or from the application.
- Classifying RIP and BGP by purpose rather than position: both are routing protocols carried as application data (UDP and TCP).
- Thinking HTTP/3 means "no transport layer": it runs over QUIC, which runs over UDP.

## Interview questions

**What are the layers of the TCP/IP model and what does each do?**
Application (protocols programs use, such as HTTP and DNS), Transport (process-to-process delivery with TCP or UDP), Internet (addressing and routing packets with IP) and Link (moving frames across the local network, such as Ethernet or Wi-Fi). Mention the five-layer variant if the interviewer seems to expect it.

**How is the TCP/IP model different from the OSI model?**
TCP/IP has four layers and was written to describe working protocols; OSI has seven and was designed before its protocols. TCP/IP merges session and presentation into the application layer, offers only connectionless service at the internet layer and both kinds at the transport layer, and is the model the internet actually uses.

**Why did TCP/IP win over the OSI protocols?**
It was already running on ARPANET and was freely included in widely used operating systems such as BSD Unix, while the OSI protocols arrived later and were complex to implement. A working, free, good-enough implementation won adoption first.

**Is IP connection-oriented? What does "best effort" mean?**
No. IP is connectionless: every packet is routed independently with no setup. Best effort means IP tries to deliver each packet but promises nothing about delivery, order, delay or duplication; TCP adds those guarantees where an application needs them.

**At which layer does ICMP work, given that it is carried inside IP?**
At the internet layer. ICMP messages are encapsulated in IP packets (protocol number 1), but ICMP exists only to serve IP, reporting errors such as unreachable destinations and expired TTLs, so it is treated as part of the internet layer.

**How does a host know which protocol to hand a received packet to?**
Each header names its payload: Ethernet's EtherType (0x0800 for IPv4), IP's Protocol field (6 for TCP, 17 for UDP) and the transport header's destination port (443 for HTTPS). The host demultiplexes upwards using these fields.

**Where does DNS sit, and which transport does it use?**
DNS is an application-layer protocol. It normally uses UDP port 53 for queries, and TCP port 53 for zone transfers and for answers too large for UDP. See [DNS](/notes/computer-networks/dns).

Next, read [IP addressing and subnetting](/notes/computer-networks/ip-addressing-and-subnetting), and test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
