---
title: The OSI Model
order: 2
minutes: 10
level: beginner
updated: 2026-10-05
seo-title: OSI Model in Computer Networks: 7 Layers Explained
description: The seven OSI layers from application to physical: each layer's job, PDU, protocols and devices, encapsulation step by step, and a mnemonic for the order.
question: What is the OSI model in computer networks?
answer: The OSI (Open Systems Interconnection) model is a seven-layer reference model, published by ISO in 1984, that divides network communication into the Application, Presentation, Session, Transport, Network, Data Link and Physical layers. Each layer does one job, serves the layer above it and uses the layer below it, so protocols and devices can be designed, described and debugged independently.
q: What are the 7 layers of the OSI model in order?
a: From top to bottom: Application (7), Presentation (6), Session (5), Transport (4), Network (3), Data Link (2) and Physical (1). A common mnemonic from the top is "All People Seem To Need Data Processing", and from the bottom "Please Do Not Throw Sausage Pizza Away".
q: What is a PDU in the OSI model?
a: A protocol data unit is the name of the chunk of data at a given layer, including that layer's header. The transport layer's PDU is a segment (a datagram for UDP), the network layer's is a packet, the data link layer's is a frame, and the physical layer carries bits.
q: At which OSI layer does a router work?
a: A router works at layer 3, the network layer. It reads the destination IP address in each packet, looks it up in its routing table and forwards the packet towards the destination network. Switches work at layer 2 and hubs at layer 1.
q: Is the OSI model used in real networks?
a: Not as a protocol suite. The internet runs on the TCP/IP model, and the OSI protocols themselves never caught on. The OSI model survives as the shared vocabulary for teaching and troubleshooting, which is why engineers say "a layer 2 problem" or "a layer 7 load balancer".
q: Which OSI layer handles encryption?
a: In the textbook model, encryption, compression and data translation belong to the presentation layer (layer 6). Real protocols do not line up neatly: TLS sits between TCP and the application, and IPsec encrypts at the network layer.
---

The OSI model is a way of cutting the job of networking into seven smaller jobs, each handled by one layer. The International Organization for Standardization (ISO) published it in 1984 as the reference model for "open" systems that could talk to each other regardless of vendor. Its own protocols lost to TCP/IP, but its layers became the language every network engineer uses: when someone says a switch is a layer 2 device or a load balancer works at layer 7, they are using OSI numbers.

## Why networks are layered

Sending a web page involves dozens of concerns: turning text into bytes, finding the right program on the server, finding the right machine on the planet, getting a frame across one cable, and turning bits into voltages or light. Layering splits these concerns so that:

- each layer has one job and offers a **service** to the layer above it through an interface;
- a layer can change without the others noticing (Wi-Fi replaced Ethernet cables without changing HTTP);
- each layer on the sender talks logically to the **same layer** on the receiver (its peer) by adding a header the peer reads.

The rule to remember: layers 1 to 3 are present in every device along the path (hosts, switches, routers), while layers 4 to 7 are handled only by the two **end hosts**.

## The seven layers at a glance

| No. | Layer | Main job | PDU | Protocols and standards | Devices |
| --- | --- | --- | --- | --- | --- |
| 7 | Application | Network services for applications | Data (message) | HTTP, FTP, SMTP, DNS, SSH, DHCP | Gateway, layer 7 proxy |
| 6 | Presentation | Translation, encryption, compression | Data | ASCII, UTF-8, JPEG, MPEG, TLS (as usually taught) | Gateway |
| 5 | Session | Open, manage and close sessions; checkpoints | Data | NetBIOS, RPC | Gateway |
| 4 | Transport | Process-to-process delivery, reliability | Segment (TCP), datagram (UDP) | TCP, UDP, SCTP | Firewall (port rules) |
| 3 | Network | Host-to-host delivery across networks, routing | Packet | IPv4, IPv6, ICMP, IPsec, OSPF | Router, layer 3 switch |
| 2 | Data link | Node-to-node delivery on one link, framing | Frame | Ethernet, Wi-Fi (802.11), PPP, HDLC | Switch, bridge, NIC, access point |
| 1 | Physical | Bits as signals on the medium | Bits | RS-232, DSL, Ethernet and 802.11 physical layers | Hub, repeater, modem, cables |

Three kinds of delivery sit at three layers, and interviewers like the distinction:

| Layer | Delivery | Address used |
| --- | --- | --- |
| Data link | Hop to hop (one link) | MAC address, 48 bits |
| Network | Host to host (source to destination machine) | IP address |
| Transport | Process to process (program to program) | Port number, 16 bits |

## What each layer does

### Layer 7: Application

The layer closest to the user. It provides network services to applications: fetching web pages (HTTP), sending email (SMTP) and reading it (POP3, IMAP), transferring files (FTP), resolving names (DNS) and remote login (SSH, Telnet). The browser itself is not layer 7; the protocol it speaks is.

### Layer 6: Presentation

Makes sure the receiver can understand the data. Its three classic jobs are **translation** (between character sets and data formats, such as ASCII and EBCDIC), **encryption and decryption**, and **compression**. File formats such as JPEG and MPEG are usually listed here.

### Layer 5: Session

Opens, maintains and closes a dialogue (session) between two applications. It provides **dialogue control** (who may send, and whether both can send at once) and **synchronisation**: checkpoints inserted into a long transfer so that, after a failure, it resumes from the last checkpoint instead of from the start. NetBIOS and RPC are the usual examples.

### Layer 4: Transport

Delivers data from a process on one host to a process on another, using **port numbers** to pick the program (port 443 for HTTPS). It splits a message into segments and reassembles them (**segmentation**), and, in TCP, provides connection setup, end-to-end **error control** (acknowledgements and retransmission) and **flow control** (not overrunning the receiver). UDP offers the same port-based delivery without the reliability. See [TCP and UDP](/notes/computer-networks/tcp-and-udp).

### Layer 3: Network

Moves packets from the source host to the destination host, possibly across many networks. Its jobs are **logical addressing** (IP addresses), **routing** (choosing the path) and forwarding, and in IPv4, **fragmentation** of packets too big for a link. ICMP, used by `ping` and `traceroute`, reports errors at this layer.

### Layer 2: Data link

Moves a frame across a single link, from one node to the next. It does **framing** (marking where a frame starts and ends), **physical addressing** with MAC addresses, **error detection** with a CRC in the frame's trailer, **flow control** between neighbours and **medium access control** when many devices share a medium. It is split into two sublayers: **LLC** (logical link control, the interface to layer 3) and **MAC** (media access control, the interface to layer 1).

### Layer 1: Physical

Transmits raw bits over the medium. It defines connectors and cables, voltage levels or light pulses, how bits are encoded as signals, the bit rate, bit synchronisation, and whether the link is simplex, half-duplex or full-duplex. It does not know what the bits mean.

## Encapsulation and decapsulation

On the way down, each layer takes the unit from the layer above as its **payload** and adds its own **header** (the data link layer also adds a **trailer**, the frame check sequence). This is **encapsulation**. On the way up at the receiver, each layer reads and removes its own header and passes the payload up. This is **decapsulation**.

```text
Layer 7-5  data      [ HTTP request ]
Layer 4    segment   [ TCP header | HTTP request ]
Layer 3    packet    [ IP header | TCP header | HTTP request ]
Layer 2    frame     [ Eth header | IP header | TCP header | HTTP request | FCS ]
Layer 1    bits      1011000101101110...
```

### Worked example: one full-size Ethernet frame

A host sends 1,460 bytes of application data over Ethernet with no IP or TCP options.

| Layer | Adds | Size so far |
| --- | --- | --- |
| Application data | none | 1,460 bytes |
| Transport (TCP) | 20-byte header | 1,480-byte segment |
| Network (IPv4) | 20-byte header | 1,500-byte packet (Ethernet's MTU) |
| Data link (Ethernet) | 14-byte header and 4-byte FCS | 1,518-byte frame |

So 1,460 of 1,518 bytes, about 96.2 per cent, is the user's data. This is also why the usual TCP maximum segment size on Ethernet is 1,460 bytes: 1,500 − 20 − 20.

### What changes at each hop

When this frame reaches a router, the router decapsulates up to layer 3, reads the destination IP address, picks the next hop and encapsulates the packet in a **new frame** with new source and destination MAC addresses for the next link. It also decrements the IP **TTL** field and updates the header checksum. So the **MAC addresses change at every hop, while the source and destination IP addresses stay the same end to end** (unless a NAT device rewrites them, as covered in [NAT, DHCP and ports](/notes/computer-networks/nat-dhcp-and-ports)).

## A mnemonic for the order

| Direction | Mnemonic | Layers |
| --- | --- | --- |
| Top to bottom (7 to 1) | All People Seem To Need Data Processing | Application, Presentation, Session, Transport, Network, Data link, Physical |
| Bottom to top (1 to 7) | Please Do Not Throw Sausage Pizza Away | Physical, Data link, Network, Transport, Session, Presentation, Application |

## Common mistakes

- Calling the transport PDU a packet: it is a segment (TCP) or datagram (UDP); the packet is layer 3.
- Saying MAC addresses travel end to end: they are rewritten at every router; IP addresses are the end-to-end ones.
- Putting the browser or email client at layer 7: the application layer is the protocol (HTTP, SMTP), not the program.
- Listing the layers out of order, especially swapping session and presentation: 5 is session, 6 is presentation.
- Saying the internet runs on OSI: it runs on TCP/IP, and OSI is the reference model used to describe it.
- Forgetting the data link trailer: encapsulation adds headers at every layer, plus the FCS trailer at layer 2.

## Interview questions

**Why is network communication divided into layers?**
Layering breaks a complex problem into smaller jobs with clear interfaces. Each layer can be implemented and replaced independently, as long as it offers the same service to the layer above, and troubleshooting can proceed layer by layer.

**What is the difference between the data link layer and the network layer?**
The data link layer delivers frames across one link between neighbouring nodes using MAC addresses. The network layer delivers packets from the source host to the destination host across many links, using IP addresses and routing.

**Which layer does a switch work at, and which does a router?**
A switch works at layer 2: it forwards frames using MAC addresses. A router works at layer 3: it forwards packets between networks using IP addresses. Layer 3 switches combine both.

**Which OSI layer uses port numbers, and why are they needed?**
The transport layer. An IP address only identifies a host; the port number identifies the process on that host, so a server can run a web server on port 443 and an SSH server on port 22 at the same address.

**What happens to the IP and MAC addresses as a packet crosses three routers?**
The source and destination IP addresses stay the same all the way (barring NAT). The MAC addresses are replaced at every hop, because each router builds a new frame addressed to the next device on the next link.

**What does the session layer do? Give an example.**
It sets up, manages and ends sessions between applications, controls whose turn it is to send and adds checkpoints so a long transfer can resume after a failure. RPC and NetBIOS sessions are textbook examples; in TCP/IP these duties live inside applications.

**Name the two sublayers of the data link layer.**
LLC (logical link control), which interfaces with the network layer and can provide flow and error control, and MAC (media access control), which handles addressing and decides who may use a shared medium, for example with CSMA/CD.

**Where does TLS fit in the OSI model?**
It does not map cleanly. It runs on top of TCP and below HTTP, and its jobs (encryption, authentication) are presentation-layer jobs in the textbook, so it is usually taught at layer 6, sometimes at layer 5 or 4. Say that it sits between the transport and application layers.

Next, read [the TCP/IP model](/notes/computer-networks/tcp-ip-model), and test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
