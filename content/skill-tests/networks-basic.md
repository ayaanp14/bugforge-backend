---
updated: 2026-10-03
question: What does the Computer Networks (Basic) skill test cover?
answer: It covers how data crosses a network: the OSI and TCP/IP layers and encapsulation, MAC addresses and ARP, IPv4 addresses with /24 and /16 masks and the private ranges, what hubs, switches and routers do, TCP against UDP and the three-way handshake, DNS, DHCP and HTTP, the well-known ports, and introductory security such as HTTPS, firewalls and public-key encryption.
q: Does the Computer Networks Basic test use the OSI model or the TCP/IP model?
a: Both. Questions about what a layer does use the seven-layer OSI model. When a question uses TCP/IP it names the version it means: the four-layer model of RFC 1122 (link, internet, transport, application) or the five-layer textbook model that keeps physical and data link apart. Knowing a different layer count from the one your course taught will not cost you a mark.
q: Do I need to memorise port numbers for the networks test?
a: Yes, the common well-known ones: HTTP 80, HTTPS 443, DNS 53, SSH 22, Telnet 23, SMTP 25 and FTP 20 and 21, and whether each protocol runs over TCP or UDP. Knowing why DNS lookups and DHCP use UDP matters more than a long list of rare ports.
q: Is subnetting on the Basic test?
a: Only its foundations: reading an address with a /24 or /16 mask, finding the network and broadcast addresses, counting the usable hosts, and recognising the classful and private ranges. Splitting a network into smaller subnets, variable-length masks and CIDR arithmetic belong to the Intermediate test.
q: Is there any coding in the Computer Networks test?
a: No. Every question is multiple choice, and a few ask you to select every correct option, where only the exact set scores. Many questions describe a small scenario — two addresses and a mask, a routing table, a handful of connected devices — and ask what happens next or how many there are.
q: Should I take the Operating Systems test or the networks test first?
a: The two are independent, so the order is up to you, and they suit being prepared side by side: the [Operating Systems (Basic)](/skill-tests/os-basic) test covers processes, scheduling, memory and files at the same level as this one.
---

The Computer Networks (Basic) test checks that you understand how data gets from a program on one machine to a program on another: how the layers wrap it and unwrap it, how the addresses at each layer find the next device and then the final host, what each box on the way does with it, and how the protocols at the top — DNS, DHCP, HTTP — rely on the transport below them.

It is the material a first course in computer networks covers, examined by asking what happens rather than what an acronym stands for. You should be able to look at an address and a mask and say where the first frame goes, read a short routing table and pick the next hop, or count the collision domains in a small office network drawn in a sentence.

## What each topic examines

The questions are spread evenly across eight topics. The [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) are the place to practise all of them.

- **OSI and TCP/IP models.** Name the seven OSI layers in order and say what each one does, and map them onto the four-layer TCP/IP model. Follow encapsulation: which header comes first on the wire, what a segment, a packet and a frame are, and how a packet's length follows from its headers.
- **Physical and data link layers.** What a MAC address is and how ARP finds one, what an interface does with a damaged frame, why classic shared Ethernet detected collisions while Wi-Fi avoids them, and how a broadcast frame is addressed.
- **IP addressing.** The structure of an IPv4 address, the old classes and their default masks, the private ranges, loopback and link-local addresses, the network and broadcast addresses of a /24 or /16 network, how many hosts it holds, and the difference between unicast, broadcast and multicast.
- **Routing.** How a router picks the next hop from its table, what a default route is, which route wins when two match, what TTL is for and what happens when it runs out, how ping and traceroute use ICMP, static against dynamic routing, and what BGP is for.
- **TCP and UDP.** Connection-oriented against connectionless delivery, which applications use which and why, the three-way handshake with its sequence and acknowledgement numbers, how port numbers in a reply mirror the request, how TCP notices loss, and how a connection is closed or refused.
- **Application protocols.** The well-known ports, the steps of a DNS lookup and the common record types, DHCP's four messages, HTTP methods and status-code classes, and how a site keeps you logged in when HTTP itself remembers nothing.
- **Network security.** What HTTPS adds over HTTP and what it does not promise, symmetric against asymmetric keys, which key encrypts a message and which one signs it, what a packet-filtering firewall decides on, and which security goal a common attack works against.
- **Devices and topologies.** Hubs, switches and routers and the layer each works at, how a switch learns where hosts are, counting collision and broadcast domains, and what the star, bus, ring and mesh layouts trade against each other.

## How the questions are written

Many questions give you a small situation and ask for its exact result: a few addresses and a mask, a short routing table, a handful of devices cabled together, the first segments of a connection. Each has one right answer that you can work out on paper, and the wrong options are the answers that the common slips produce, so a near miss in your working will usually be among them.

The rest ask how a mechanism works and why, at the level of a sentence you could say aloud in an interview: what a device does with a frame it cannot place, why one protocol suits a job better than another, what a message is for. Where textbooks disagree on a name — how many layers TCP/IP has, whether IP's unit is a packet or a datagram — the question either names its convention or asks about the mechanism instead, so the label you learned does not decide the mark.

## How to prepare

Start with one journey and learn it until you can tell it without notes: a laptop that has just joined a network opens a web page. It gets an address from DHCP, looks up the server's name in DNS, uses ARP to find its gateway's MAC address, opens a TCP connection with the three-way handshake, sends an HTTP request, and the packets cross routers that rewrite the MAC addresses but leave the IP addresses alone. Much of the paper is a close look at one step of that story.

Then practise the arithmetic by hand until it is quick. Write an address in binary, apply a /24 or /16 mask, and read off the network address, the broadcast address and the host count. Do the same for TTLs and for the acknowledgement number at each step of a handshake.

Finally, watch a real network. `ipconfig` or `ip addr` shows your address, mask and gateway; `arp -a` shows the MAC addresses your machine has learned; `ping` and `traceroute` (`tracert` on Windows) show ICMP at work; `nslookup` or `dig` shows DNS answers and record types; and a browser's developer tools list every HTTP request with its method and status code. Seeing these once makes the questions about them concrete.

## Where candidates lose marks

- Treating MAC and IP addresses alike. MAC addresses reach one link and are replaced at every router; IP addresses name the two ends and survive the whole path (without NAT).
- Deciding "same network" by eye. A host sends to its gateway whenever the destination is outside its own network, and only the mask decides that, however similar the two addresses look.
- Mixing up the devices. A hub shares one collision domain among all its ports, a switch gives every port its own but passes broadcasts on, and only a router stops broadcasts.
- Skimming TCP's details. Know what the sequence and acknowledgement numbers count during the handshake, which ports a reply carries, and the difference between closing a connection and refusing one.
- Reversing the keys. Be certain which key keeps a message secret and which one makes a signature, and what the padlock in a browser does and does not promise.

## What changes at Intermediate

The [Computer Networks (Intermediate)](/skill-tests/networks-intermediate) test assumes everything here and adds the exact arithmetic and the protocols' inner workings: splitting a network into subnets and CIDR blocks, distance-vector and link-state routing (a link-state router runs [Dijkstra's algorithm](/roadmap/dijkstras-algorithm) over its map of the network), TCP's flow and congestion control, sliding-window protocols, error-detection computations and the TLS handshake. If the scenarios here feel easy, that is the next step; the [skill tests index](/skill-tests) lists the other fundamentals tests.

## Sample question
topic: application
answer: B

You type `https://www.example.com` into the browser on a laptop that already has an IP address but has nothing cached, and the browser will use HTTP/1.1 over TCP. In what order do these four things happen?

- A: TCP handshake with the server, DNS lookup, TLS handshake, HTTP GET request
- B: DNS lookup, TCP handshake with the server, TLS handshake, HTTP GET request
- C: DNS lookup, TLS handshake, TCP handshake with the server, HTTP GET request
- D: DNS lookup, HTTP GET request, TCP handshake with the server, TLS handshake

> The browser needs the server's IP address before it can open a connection, so the DNS lookup comes first. TLS runs on top of the TCP connection, so the TCP handshake must finish before the TLS handshake starts, and the HTTP request is sent only after TLS has agreed its keys — over HTTPS every byte of HTTP is encrypted. Before any of this the laptop may also use ARP to find its gateway's MAC address, but that happens below these four steps.
