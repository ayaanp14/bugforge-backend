---
skill: networks
level: basic
---

## networks-basic-055
topic: application
answer: B, D, E

Which of these HTTP methods does the HTTP standard define as idempotent, meaning that sending the same request twice leaves the server in the same state as sending it once? Select all that apply.

- A: POST
- B: GET
- C: PATCH
- D: PUT
- E: DELETE

> GET only reads, PUT replaces the resource with the same representation each time, and DELETE leaves the resource deleted however often it is repeated (a repeat may answer 404, but the server's state is the same), so all three are idempotent. Two identical POSTs may create two orders, and PATCH is not defined as idempotent, because a patch such as "append an item" changes the result each time it is applied.

## networks-basic-056
topic: application
answer: B

A request to a website comes back with 503 Service Unavailable. What does the status code's class tell you?

- A: It is a client error; the request itself was malformed or not allowed.
- B: It is a server error; the server failed on a request that looked valid.
- C: It is a redirection; the resource has moved to another address.
- D: It is informational; the request is still being processed.

> The first digit gives the class: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error. 503 means the server is overloaded or down for maintenance — retrying later may work, while changing the request would not help.

## networks-basic-057
topic: application
answer: C

Which of these responses tells the client that its request succeeded?

- A: `301 Moved Permanently`
- B: `401 Unauthorized`
- C: `201 Created`
- D: `502 Bad Gateway`

> Every 2xx code is a success, and 201 says the request worked and created a new resource (typical after a POST). 301 is a redirection to the resource's new address, 401 is a client error (credentials missing or wrong), and 502 is a server error from a gateway or proxy that got a bad answer from the server behind it.

## networks-basic-058
topic: application
answer: A

A client gets its IP address from DHCP. In what order are the four DHCP messages exchanged?

- A: Discover, Offer, Request, Acknowledge
- B: Request, Offer, Discover, Acknowledge
- C: Discover, Request, Offer, Acknowledge
- D: Offer, Discover, Request, Acknowledge

> The client broadcasts a Discover to find servers; each server that can serve it answers with an Offer of an address; the client broadcasts a Request for the one offer it accepts (which also tells the other servers no); and the chosen server confirms with an Acknowledge, starting the lease. DORA is the usual way to remember the order.

## networks-basic-059
topic: application
answer: A

A laptop joining a network sends a DHCP Discover from source IP 0.0.0.0 to destination IP 255.255.255.255. Why those two addresses?

- A: It has no address of its own yet and does not know where any DHCP server is.
- B: 0.0.0.0 tells routers to forward the message to every DHCP server on the internet.
- C: Every DHCP server is configured with the address 255.255.255.255.
- D: It wants every host on the network to reply with a free address it could use.

> 0.0.0.0 means "this host, which has no address yet", and 255.255.255.255 is the limited broadcast, delivered to every host on the local network and never forwarded by routers. Only DHCP servers answer it. Where the server sits on another network, a router configured as a DHCP relay forwards the request on purpose.

## networks-basic-060
topic: application
answer: C

HTTP is stateless. How does a website usually keep you logged in from one request to the next?

- A: The server keeps the TCP connection open for as long as you are logged in.
- B: The server treats every request from your IP address as coming from you.
- C: The server sets a session cookie that the browser sends with each request.
- D: The browser puts your username and password in the URL of every request.

> After you log in, the server's response sets a cookie holding a hard-to-guess session identifier; the browser attaches it to every later request to that site, and the server looks it up. Connections are closed and reopened freely, many people share one public IP address behind NAT, and credentials in URLs would end up in logs and browser history.

## networks-basic-061
topic: security
answer: B

What does HTTPS give a user that plain HTTP does not?

- A: Faster page loads, because the server compresses every page it sends
- B: Encrypted traffic, and a way for the browser to check the server's identity
- C: A guarantee that the site's owner is honest and its pages are free of malware
- D: A hidden IP address, so the site cannot tell where the request came from

> HTTPS is HTTP inside TLS: the traffic is encrypted and protected against tampering, and the server proves it holds a valid certificate for the domain the browser asked for. It says nothing about whether the owner is trustworthy — a phishing site can have a valid certificate — and both ends still see each other's IP addresses. Compression has nothing to do with HTTPS.

## networks-basic-062
topic: security
answer: D

What defines symmetric-key encryption?

- A: A public key encrypts, and a different, private key decrypts.
- B: The data is encrypted twice, once by each side.
- C: No key is needed, because the algorithm itself is kept secret.
- D: The same secret key both encrypts and decrypts the data.

> In symmetric encryption (AES, for example) the sender and the receiver share one secret key, used in both directions, so the hard part is getting that key to both of them safely. Option A describes asymmetric (public-key) encryption. Modern ciphers assume the algorithm is public; all the secrecy is in the key.

## networks-basic-063
topic: security
answer: C

Ten people each want a private channel with every other one of them, using symmetric encryption with a separate shared key for each pair. How many keys are needed in all?

- A: 10
- B: 20
- C: 45
- D: 90

> Each pair needs its own key, and there are 10 × 9 / 2 = 45 pairs. 90 counts every pair twice, but A–B and B–A share one key. 20 is what public-key cryptography would need — one public and one private key per person — which is one reason it is used to set keys up.

## networks-basic-064
topic: security
answer: A

Alice wants to send Bob a message that only Bob can read, using public-key (asymmetric) encryption. Which key does she encrypt it with?

- A: Bob's public key
- B: Bob's private key
- C: Alice's private key
- D: Alice's public key

> Whatever is encrypted with Bob's public key can be decrypted only with Bob's private key, which only Bob holds. Alice cannot use Bob's private key because she does not have it, and anything encrypted with Alice's private key can be decrypted by anyone who has her public key — that is how a signature works, not how secrecy works.

## networks-basic-065
topic: security
answer: D

Bob wants to sign a document so that anyone can check that it really came from him and has not been changed. Which key does he use to create the signature?

- A: Bob's public key
- B: The reader's public key
- C: A symmetric key shared with each reader
- D: Bob's private key

> A signature is made with the signer's private key (over a hash of the document) and checked with the signer's public key, which anyone may have. Only Bob holds his private key, so a signature that verifies must be his, and any change to the document makes the check fail. A key shared with the readers would let any of them forge his signature.

## networks-basic-066
topic: security
answer: B

A firewall in front of a web server at 10.0.0.5 allows inbound TCP traffic to port 443 on that server and denies all other inbound traffic. Someone on the internet tries to open an SSH session to 10.0.0.5 on SSH's standard port. What happens?

- A: It is allowed, because the server's address is permitted.
- B: It is blocked, because SSH uses port 22, which no rule allows.
- C: It is allowed, because SSH is encrypted just as HTTPS is.
- D: It is blocked, because the firewall drops every TCP connection.

> A packet filter matches addresses, protocol and port together. The only allow rule is TCP to 10.0.0.5 on port 443; SSH's standard port is 22, so the connection falls to the deny-everything-else rule. The address alone is not enough, encryption is not a pass, and HTTPS connections on port 443 still get through.

## networks-basic-067
topic: security
answer: B

Secure protocols such as HTTPS use public-key cryptography to agree on a shared key, then encrypt the data itself with a symmetric cipher. Why not use public-key encryption for all of the data?

- A: Public-key ciphers can only encrypt text, not binary data such as images.
- B: Public-key encryption is far slower, so it is used only to set up the key.
- C: Public-key encryption only works between two hosts on the same local network.
- D: Firewalls let through only traffic that is symmetrically encrypted.

> Public-key operations are orders of magnitude slower than a symmetric cipher such as AES, but they solve what symmetric encryption cannot: agreeing on a secret key with someone you have never met, over a network others can read. So the slow part runs once and the fast part carries the data. Ciphers work on bytes of any kind, public-key cryptography works across the internet, and firewalls do not filter by cipher.

## networks-basic-068
topic: security
answer: D

On an open coffee-shop Wi-Fi network, an attacker runs a tool that captures other customers' unencrypted HTTP traffic and reads the passwords in it, without changing anything. What is this attack?

- A: Denial of service
- B: Phishing
- C: Brute-force guessing of the passwords
- D: Eavesdropping (packet sniffing)

> Capturing and reading traffic without altering it is passive eavesdropping, or sniffing; on an open network any nearby radio can pick up the frames. HTTPS defeats it, because the captured bytes are encrypted. Denial of service blocks access, phishing tricks the user into handing the password over, and brute force guesses it.

## networks-basic-069
topic: security
answer: C

A distributed denial-of-service (DDoS) attack floods a website with traffic from thousands of machines until real users cannot reach it. Which of the three classic security goals does it attack?

- A: Confidentiality
- B: Integrity
- C: Availability

> In the CIA triad, confidentiality keeps data from being read by the wrong people, integrity keeps it from being changed undetected, and availability keeps the service usable by the people entitled to it. A DDoS reads nothing and changes nothing; it denies service, so it attacks availability.

## networks-basic-070
topic: security
answer: B, D

Which of these protocols encrypt the data they carry? Select all that apply.

- A: Telnet
- B: SSH
- C: HTTP
- D: HTTPS
- E: FTP

> SSH encrypts the whole remote session, password included, and HTTPS runs HTTP inside TLS. Telnet, HTTP and plain FTP send everything, logins included, as readable text — which is why SSH replaced Telnet, and why FTP gives way to SFTP or FTPS where security matters.

## networks-basic-071
topic: devices
answer: A

A hub receives a frame on port 1. What does it do with it?

- A: Repeats it out of every other port without reading any address
- B: Sends it only out of the port where the destination MAC was last seen
- C: Reads the destination IP address and sends it toward that network
- D: Drops it unless the destination is also connected to port 1

> A hub is a physical-layer repeater with several ports: it regenerates the signal out of every other port without looking at any address, so all its ports share one collision domain. Forwarding by learned MAC address is what a switch does, and forwarding by IP address is what a router does.

## networks-basic-072
topic: devices
answer: D

A switch has just been powered on, so its MAC address table is empty. Host A on port 1 sends a frame to host B on port 3. What does the switch do?

- A: Learns B's MAC on port 3 and sends the frame only out of port 3
- B: Drops the frame because B's MAC is not yet in its table
- C: Sends an ARP request to learn which port B is connected to
- D: Learns A on port 1 and floods the frame out of every other port

> A switch learns from the source address of each frame it receives, so it now knows that A is on port 1. It has never seen B's address, so it floods the frame out of every port except the one it came in on. When B replies, the switch learns B's port, and from then on frames between A and B go only where they need to. ARP is how a host finds a MAC address for an IP address; a switch does not use it to find ports.

## networks-basic-073
topic: devices
answer: B

Twelve PCs in a small office share one hub, and the network slows down badly whenever many people use it at once. Which device, put in place of the hub, removes the collisions without changing any IP settings?

- A: A repeater
- B: A switch
- C: A router
- D: A modem

> Behind a hub all twelve PCs share one collision domain, and only one can send at a time. A switch gives each port its own collision domain (and full duplex), and it works at layer 2, so the PCs stay in the same IP network. A router would split them into separate IP networks that need new addresses, a repeater only regenerates the signal just as a hub does, and a modem connects to an ISP's line.

## networks-basic-074
topic: devices
answer: A

A switch has four PCs plugged into four of its ports and a hub plugged into a fifth port; three more PCs are plugged into the hub. There are no VLANs and no router. How many collision domains are there, and how many broadcast domains?

- A: 5 collision domains and 1 broadcast domain
- B: 7 collision domains and 1 broadcast domain
- C: 4 collision domains and 1 broadcast domain
- D: 5 collision domains and 2 broadcast domains

> Each switch port is its own collision domain: four for the PCs and one for the hub, whose three PCs all share it — 5 in all, not 7. Neither a switch nor a hub stops a broadcast, so the whole network is one broadcast domain; only a router (or VLANs) would split it.

## networks-basic-075
topic: devices
answer: C

A router has three interfaces. Interface 1 connects to switch S1, which is also cabled to switch S2. Interface 2 connects to switch S3, and interface 3 connects to switch S4. PCs are attached to all four switches, and there are no VLANs. How many broadcast domains are there?

- A: 1
- B: 2
- C: 3
- D: 4

> Switches forward broadcasts out of every port, so S1 and S2 together form one broadcast domain; routers do not forward broadcasts, so each router interface ends one. That gives three: S1 with S2, S3, and S4. Counting one per switch (4) misses that S1 and S2 are joined directly.

## networks-basic-076
topic: devices
answer: A, D, E

Which of these devices give each of their ports a separate collision domain? Select all that apply.

- A: Bridge
- B: Hub
- C: Repeater
- D: Router
- E: Switch

> Bridges and switches forward frames between ports by MAC address and buffer them, so a collision on one port never reaches another; a router separates its ports in the same way and also stops broadcasts. Hubs and repeaters copy the raw signal to every port, so everything attached to them shares one collision domain.

## networks-basic-077
topic: devices
answer: A

Hosts on 192.168.1.0/24 and hosts on 192.168.2.0/24 must exchange packets. Which device has to sit between the two networks?

- A: A router
- B: A hub
- C: A layer-2 switch
- D: A repeater

> Moving packets between different IP networks is routing, a layer-3 job: each host sends off-network traffic to its gateway, which must be a router (or a layer-3 switch, which is a router in a switch's box). A layer-2 switch forwards frames only within one network, and hubs and repeaters only copy signals.

## networks-basic-078
topic: devices
answer: C

In a star topology, every PC has its own cable to a central switch. What happens when one PC's cable is cut?

- A: Every PC loses its connection until the cable is replaced.
- B: The network splits into two halves that cannot reach each other.
- C: Only that PC loses its connection; the others carry on.
- D: Traffic reverses direction around the ring to get past the break.

> In a star each device's link is independent, so a cut cable isolates only its own PC. The weak point is the central device: if the switch fails, everyone is cut off. A break in a bus backbone is what splits a network in two, and reversing direction is how a dual ring survives a break.

## networks-basic-079
topic: devices
answer: B

Six routers are connected in a full mesh, with a direct link between every pair of them. How many links is that?

- A: 6
- B: 15
- C: 30
- D: 36

> Each of the 6 routers links to the other 5, which counts 6 × 5 = 30 link ends; every link has two ends, so there are 30 / 2 = 15 links. That quadratic growth is why full meshes are kept small. 6 links would make a ring, and 36 counts each router as linked to itself as well.

## networks-basic-080
topic: devices
answer: D

Which pairing of device and the OSI layer it mainly works at is correct?

- A: Hub — network layer
- B: Router — transport layer
- C: Repeater — data link layer
- D: Switch — data link layer

> A switch forwards frames by MAC address, which is layer 2, the data link layer. Hubs and repeaters work at layer 1, the physical layer (they copy signals and read no addresses), and routers work at layer 3, the network layer.
