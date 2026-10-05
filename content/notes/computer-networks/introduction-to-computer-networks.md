---
title: Introduction to Computer Networks
order: 1
minutes: 12
level: beginner
updated: 2026-10-05
seo-title: Computer Networks Basics: Types, Topologies, Devices
description: Computer networks from the ground up: LAN, MAN and WAN, network topologies, hubs, switches and routers, circuit vs packet switching, and delays worked out.
question: What is a computer network?
answer: A computer network is a set of devices connected by communication links so they can exchange data and share resources such as files, printers and an internet connection. Networks are classed by the area they cover (PAN, LAN, MAN, WAN), by topology (bus, star, ring, mesh, tree) and by how they move data (circuit or packet switching). The internet is a network of networks.
q: What are the four types of computer network by size?
a: A PAN (personal area network) links devices around one person, such as a phone and earbuds over Bluetooth. A LAN covers a home, office or campus, a MAN covers a city, and a WAN spans countries or continents. The internet is the largest WAN.
q: Which network topology is most common today?
a: The star, in the form of switched Ethernet: every device has its own cable to a central switch. A failed cable affects only one device and devices are easy to add, though the switch itself is a single point of failure. Large networks connect several stars into a tree.
q: What is the difference between a hub, a switch and a router?
a: A hub works at the physical layer and repeats every incoming signal out of every port. A switch works at the data link layer and forwards a frame only to the port where the destination MAC address lives. A router works at the network layer and forwards packets between different networks using IP addresses.
q: What is the difference between bandwidth and throughput?
a: Bandwidth is the maximum rate a link can carry, such as 100 Mbps. Throughput is the rate actually achieved end to end, which is lower because of the slowest link on the path, congestion, protocol overhead and retransmissions.
q: Why does the internet use packet switching instead of circuit switching?
a: Computer traffic comes in bursts, so reserving a circuit for each conversation would leave most of the capacity idle. Packet switching lets many users share each link, and packets can be routed around a failed link. The cost is variable delay and possible loss, which protocols such as TCP handle.
---

A computer network is two or more devices joined by links so they can exchange data. Networks exist so that resources can be shared (one printer, one internet connection, one database for a whole office), so that people can communicate (email, video calls) and so that a service can keep running when one machine fails. Everything else in this subject, from the OSI model to TCP's handshake, is a detailed answer to one question: how does a stream of bits get from one program to another program on a different machine, correctly and quickly?

## What a network is made of

Every network, from two laptops on a Wi-Fi hotspot to the internet, has the same four ingredients:

- **Nodes.** End devices (hosts) that create or consume data, such as laptops, phones and servers, and intermediate devices that pass data along, such as switches and routers.
- **Links (transmission media).** Wired media are twisted-pair copper (Ethernet cables), coaxial cable and optical fibre. Wireless media are radio (Wi-Fi, Bluetooth, cellular), microwave and satellite.
- **Protocols.** Agreed rules for the format and order of messages and the actions taken on them. IP, TCP and HTTP are protocols. Two devices can only talk if they follow the same ones.
- **Services.** What the network offers the programs above it: delivering a web page, a file transfer or a DNS lookup.

Links also differ in direction, called the **transmission mode**:

| Mode | Direction | Example |
| --- | --- | --- |
| Simplex | One way only | Keyboard to computer, TV broadcast |
| Half-duplex | Both ways, one at a time | Walkie-talkie, classic Wi-Fi channel |
| Full-duplex | Both ways at once | Telephone call, switched Ethernet |

## Types of networks by size

Networks are named by the area they cover. The distances are typical, not hard limits.

| Type | Full name | Typical span | Typical technology | Example |
| --- | --- | --- | --- | --- |
| PAN | Personal area network | A few metres | Bluetooth, USB | Phone paired with a smartwatch |
| LAN | Local area network | A room to a campus | Ethernet, Wi-Fi | College lab, office floor |
| MAN | Metropolitan area network | A city | Fibre rings, metro Ethernet | Cable operator's city network |
| WAN | Wide area network | Countries, continents | Leased lines, MPLS, the internet | A bank linking all its branches |

A LAN is usually owned by one organisation and runs at high speed with low delay. A WAN is usually built from links rented from telecom carriers, and it is slower and costlier per bit. The **internet** is not one network: it is tens of thousands of independently run networks joined by routers and the BGP routing protocol.

## Network topologies

Topology is the layout of the links: who is connected to whom.

| Topology | Layout | Advantages | Disadvantages |
| --- | --- | --- | --- |
| Bus | Every device taps one shared cable (backbone) with terminators at both ends | Cheap, little cable | A break in the backbone stops everything; collisions grow with devices; hard to troubleshoot |
| Star | Every device has its own link to a central hub or switch | Easy to add devices; one bad cable affects one device; easy to manage | The centre is a single point of failure; more cable than a bus |
| Ring | Each device connects to the next, forming a closed loop; data travels in one direction, often with a token | Orderly access, no collisions with token passing | One break stops the ring (unless it is a dual ring); adding a device disturbs the ring |
| Mesh | Devices connect directly to many (partial) or all (full) other devices | Very reliable, many paths; no shared link | Expensive: many links and ports |
| Tree | A hierarchy of stars connected to a root | Scales well, easy to segment | A failure near the root cuts off whole branches |
| Hybrid | Any mix of the above | Fits real buildings | Design and management are more complex |

**Full mesh arithmetic.** In a full mesh of n devices every pair has its own link, so the number of links is n(n − 1)/2 and each device needs n − 1 ports. For 5 devices that is 5 × 4 / 2 = 10 links and 4 ports per device; for 10 devices it is already 45 links. This is why full mesh is used only where reliability justifies the cost, such as between core routers.

## Network devices and the layer they work at

The layer numbers refer to the OSI model, covered in the [next note](/notes/computer-networks/osi-model).

| Device | OSI layer | What it does |
| --- | --- | --- |
| Repeater | 1, Physical | Regenerates a weakened signal so it can travel further |
| Hub | 1, Physical | A multiport repeater: copies every incoming signal to every other port |
| Modem | 1, Physical | Modulates digital data onto an analogue carrier and demodulates it back (DSL, cable) |
| Bridge | 2, Data link | Joins two LAN segments and forwards a frame only if its destination MAC address is on the other side |
| Switch | 2, Data link | A multiport bridge: learns which MAC address is on which port and forwards each frame only there |
| Access point | 2, Data link | Connects wireless devices to a wired LAN |
| Router | 3, Network | Forwards packets between different networks using IP addresses and a routing table |
| Gateway | Any, often up to 7 | Connects networks that use different protocols and translates between them |

Two clarifications interviewers check. A **layer 3 switch** also routes between VLANs, so "switch = layer 2" is the textbook default, not a law. And in everyday use, the **default gateway** on your laptop simply means the router that leads out of your network.

### Hub vs switch vs router: collision and broadcast domains

A **collision domain** is the part of a network where two simultaneous transmissions collide. A **broadcast domain** is the set of devices that receive a broadcast frame.

| Device | Collision domains | Broadcast domains |
| --- | --- | --- |
| 8-port hub | 1 (all ports share it) | 1 |
| 24-port switch | 24 (one per port) | 1 (unless VLANs split it) |
| Router with 3 interfaces | 3 | 3 (routers do not forward broadcasts) |

So switches break up collision domains and routers break up broadcast domains.

## Circuit switching vs packet switching

**Circuit switching** sets up a dedicated path with reserved capacity before any data flows, keeps it for the whole conversation and then tears it down. The classic telephone network works this way. **Packet switching** splits data into packets, each carrying the destination address; every router stores a packet, looks at the address and forwards it (store and forward). Packets from many users share every link. The internet works this way. (A third, older scheme, **message switching**, stores and forwards whole messages.)

| Aspect | Circuit switching | Packet switching |
| --- | --- | --- |
| Path | Dedicated, set up before data flows | No reservation; each packet forwarded on its own |
| Setup phase | Needed (call setup) | Not needed for datagrams |
| Capacity use | Reserved even when idle | Shared on demand, efficient for bursty traffic |
| Delay | Constant once connected | Variable, because of queuing at routers |
| Order of arrival | Always in order | Packets may arrive out of order |
| On link failure | The call drops | Packets can be rerouted |
| Example | Traditional telephone calls | The internet (IP) |

## Bandwidth, latency and throughput

- **Bandwidth** is a link's capacity in bits per second (bps). A "100 Mbps" link can carry at most 100 million bits each second.
- **Latency** is the time a message takes to get from source to destination. The **round-trip time (RTT)** is the time to go there and back.
- **Throughput** is the rate actually achieved end to end. It is limited by the slowest link on the path (the bottleneck): a server on a 1 Gbps link sending to a phone on a 20 Mbps connection gets at most 20 Mbps.

The delay a packet sees at each hop has four parts:

| Delay | Formula | Depends on |
| --- | --- | --- |
| Transmission | L / R (packet size in bits ÷ link rate) | Packet size and bandwidth |
| Propagation | d / s (distance ÷ signal speed) | Distance and medium, not bandwidth |
| Queuing | Varies | How busy the router's output link is |
| Processing | Usually microseconds | Router speed (header check, table lookup) |

Signals travel at about 2 × 10^8 m/s in copper and fibre, roughly two-thirds of the speed of light in a vacuum.

## Worked example: transmission and propagation delay

A host sends one 1,000-byte packet over a single 10 Mbps link that is 2,000 km long. Take the signal speed as 2 × 10^8 m/s and ignore queuing and processing.

| Step | Working | Result |
| --- | --- | --- |
| Packet size in bits | 1,000 × 8 | L = 8,000 bits |
| Transmission delay | 8,000 ÷ (10 × 10^6) | 0.0008 s = 0.8 ms |
| Propagation delay | (2,000 × 10^3 m) ÷ (2 × 10^8 m/s) | 0.01 s = 10 ms |
| Total one-way delay | 0.8 ms + 10 ms | 10.8 ms |
| Bandwidth-delay product | 10^7 bps × 0.01 s | 100,000 bits = 12,500 bytes |

The bandwidth-delay product is how many bits are "on the wire" at once: 12.5 packets of this size fit in the link before the first one arrives. Protocols that wait for an acknowledgement after every packet waste most of such a link, which is why TCP keeps a window of many packets in flight.

Now send a 1 MB file (8 × 10^6 bits) over the same link. Transmission delay becomes 8 × 10^6 ÷ 10^7 = 0.8 s, while propagation stays 10 ms, so the total is 0.81 s. Small messages are dominated by latency; big transfers are dominated by bandwidth. Doubling the bandwidth would halve the file's time but would not change the 10 ms propagation delay at all.

If the path had a router in the middle (two links, each 10 Mbps and 1,000 km), store and forward means the router must receive the whole packet before sending it on, so the transmission delay is paid twice: 2 × 0.8 ms + 2 × 5 ms = 11.6 ms.

## Common mistakes

- Saying a switch sends frames to all ports: it floods only unknown or broadcast destinations; known MAC addresses go to one port.
- Mixing up transmission delay (depends on packet size and bandwidth) with propagation delay (depends on distance and medium).
- Writing that more bandwidth reduces latency for a small packet: it shrinks only the transmission part.
- Calling the internet a WAN owned by someone: it is a network of independently run networks.
- Giving full-mesh links as n(n − 1): each link joins two devices, so divide by 2.
- Placing a router at layer 2 or a hub at layer 2: a hub is layer 1, a router is layer 3.

## Interview questions

**What is the difference between a hub and a switch?**
A hub is a layer 1 device that repeats every signal to every port, so all ports share one collision domain and the bandwidth. A switch is a layer 2 device that learns MAC addresses and forwards each frame only to the destination's port, giving each port its own collision domain and allowing full-duplex links.

**How many collision and broadcast domains does a 24-port switch create?**
Twenty-four collision domains, one per port, and one broadcast domain, because a switch forwards broadcasts out of every port. Configuring VLANs splits the broadcast domain; only a router (or a layer 3 switch) forwards between them.

**Why is the star topology preferred over the bus for LANs?**
In a star, each device has its own cable to the switch, so a faulty cable or device affects only that device and faults are easy to find. In a bus, one break in the shared backbone stops the whole network and every device competes for the same medium.

**How many links does a full mesh of n devices need?**
n(n − 1)/2 links, with n − 1 ports on every device. Six devices need 15 links. The cost grows with the square of n, so full mesh is kept for small sets of critical nodes.

**What is the difference between latency and bandwidth?**
Bandwidth is how many bits per second a link can carry; latency is how long a bit takes to arrive. A satellite link can have high bandwidth and high latency at the same time. For a small request, such as a DNS lookup, latency matters far more than bandwidth.

**Does the internet use circuit switching or packet switching, and why?**
Packet switching. Data traffic is bursty, so sharing links among many users is far more efficient than reserving capacity per conversation, and packets can be rerouted around failures. The price is variable delay and occasional loss, which the transport layer handles.

**What is a gateway, and how is it different from a router?**
A gateway connects networks that use different protocols and translates between them, and it can work at any layer up to the application layer. A router forwards packets between networks that all speak IP. In daily use, "default gateway" just means the router a host sends off-network traffic to.

**What is the bandwidth-delay product and why does it matter?**
It is bandwidth multiplied by the one-way propagation delay: the number of bits in flight on the link. A sender must be allowed at least that much unacknowledged data (TCP's window) to keep the link busy; otherwise it sits idle waiting for acknowledgements.

Next, read [the OSI model](/notes/computer-networks/osi-model), and test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
