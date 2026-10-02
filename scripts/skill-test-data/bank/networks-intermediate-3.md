---
skill: networks
level: intermediate
---

## networks-intermediate-055
topic: application
answer: C

A resolver sends a DNS query over UDP without EDNS(0), and the full answer is larger than 512 bytes. What happens?

- A: The server splits the answer over several UDP datagrams, which the resolver puts back together.
- B: The server sends one large UDP datagram anyway, and IP fragmentation carries it across.
- C: The server sends a truncated answer with the TC flag set, and the resolver retries over TCP.
- D: The server drops the query, and the resolver gives up when its timer expires.

> Plain DNS over UDP limits a message to 512 bytes. When the answer does not
> fit, the server sends what fits (possibly nothing) with the TC (truncated)
> bit set, and the client repeats the query over TCP port 53, which has no
> such limit. EDNS(0) lets a client advertise a larger UDP buffer, which is
> how most large answers travel over UDP today. DNS has no way to spread one
> answer over several datagrams, and a server does not silently drop a valid
> query.

## networks-intermediate-056
topic: application
answer: A

A page is an HTML file plus four small images, all on one server. Count only round trips: opening a TCP connection costs one RTT and each request–response costs one RTT; ignore transmission time, DNS and TLS. How many RTTs does fetching everything take with non-persistent connections opened one at a time, and with one persistent connection without pipelining?

- A: 10 and 6
- B: 10 and 3
- C: 5 and 5
- D: 6 and 6

> Non-persistent: each of the five objects needs its own connection, one RTT
> to open it and one for the request, so 5 × 2 = 10. Persistent without
> pipelining: one RTT to open the connection, then five requests one after
> another, so 1 + 5 = 6. B is a persistent connection with pipelining (open,
> fetch the HTML, then all four images in one round trip: 3). C leaves out
> the connection set-up altogether; D charges the non-persistent case for only
> one connection.

## networks-intermediate-057
topic: application
answer: D

An HTTP/2 connection is carrying ten responses as parallel streams over one TCP connection. A TCP segment holding part of one response is lost. What happens to the other nine streams until that segment is retransmitted?

- A: They carry on; only the stream whose data was lost has to wait.
- B: The connection is reset, and the browser requests all ten again.
- C: The browser opens a new TCP connection for each of the nine.
- D: They stall too, since TCP passes nothing beyond the gap to HTTP/2.

> HTTP/2 multiplexes streams inside one TCP byte stream, and TCP delivers
> bytes to the application only in order. Bytes that arrive after the hole
> wait in the receive buffer even when they belong to other streams: TCP
> head-of-line blocking. A is what HTTP/3 achieves, because QUIC orders each
> stream separately. Nothing resets the connection or opens new ones; the
> retransmission fills the gap and everything resumes.

## networks-intermediate-058
topic: application
answer: A, C, E

Which of these are true of HTTP/3? Select all that apply.

- A: It runs over QUIC, which runs over UDP.
- B: It sends its header fields as plain text, as HTTP/1.1 does.
- C: A lost packet delays only the streams whose data the packet carried.
- D: Each request needs a transport connection of its own.
- E: A connection can survive a change of the client's IP address, since QUIC identifies it by connection IDs.

> HTTP/3 maps HTTP onto QUIC, a transport built on UDP that has TLS 1.3 built
> into its handshake. QUIC orders data per stream, so a loss holds up only
> the streams it touched, and one QUIC connection carries many streams.
> Connections are named by connection IDs rather than by the address and port
> four-tuple, so a phone moving from Wi-Fi to mobile data can keep its
> connection. Headers travel compressed in binary frames (QPACK), as with
> HTTP/2's HPACK, never as HTTP/1.1-style text.

## networks-intermediate-059
topic: application
answer: B

A browser holds a cached response with the ETag `"v7"` whose max-age has expired. To revalidate it, which request header does it send, and what does the server answer if the resource has not changed?

- A: `If-Match: "v7"`, answered with 200 OK and the full body
- B: `If-None-Match: "v7"`, answered with 304 Not Modified and no body
- C: `If-Modified-Since: "v7"`, answered with 412 Precondition Failed
- D: `If-None-Match: "v7"`, answered with 200 OK and an empty body

> If-None-Match sends the cached validator; when it still matches, the server
> answers 304 Not Modified with no body, and the browser reuses its copy with
> refreshed freshness. If-Match is for safe updates (change this only if it is
> still "v7"), not for revalidating a cache. If-Modified-Since takes a date,
> not an ETag. A 200 with an empty body would replace the cached content with
> nothing.

## networks-intermediate-060
topic: application
answer: C

Why does HTTP/1.1 pipelining not remove head-of-line blocking?

- A: Each pipelined request still needs a TCP handshake of its own first.
- B: Pipelining is allowed only for POST requests, which servers run one at a time.
- C: Responses must come back in request order, so a slow one holds up the rest.
- D: Responses come back interleaved in frames that the client must reassemble.

> HTTP/1.1 responses carry no request identifier, so a server must return them
> in the order the requests arrived; a slow first response blocks those
> behind it even when they are ready. Browsers worked around it with several
> connections per host, and HTTP/2 added stream IDs. Pipelining reuses one
> connection, so there is no handshake per request; it is meant for idempotent
> requests such as GET, not for POST; and interleaved frames are HTTP/2's
> design, not HTTP/1.1's.

## networks-intermediate-061
topic: security
answer: A

In a TLS 1.3 connection, what encrypts the application data that the browser and the server exchange?

- A: Symmetric keys derived from an ephemeral Diffie–Hellman secret agreed in the handshake
- B: The server's public key from its certificate, for everything sent to the server
- C: The certificate authority's private key, which both sides learn during the handshake
- D: The server's private key, so that anyone holding the certificate can decrypt it

> A full TLS 1.3 handshake agrees a secret by ephemeral (EC)DHE, and both
> sides derive symmetric traffic keys from it for an AEAD cipher such as
> AES-GCM or ChaCha20-Poly1305. Public-key operations are far too slow for
> bulk data; in TLS 1.3 the certificate's key pair is used only to sign the
> handshake. A CA's private key never leaves the CA, and data encrypted with a
> private key could be read by anyone holding the matching public key.

## networks-intermediate-062
topic: security
answer: D

How does a browser decide that a server's certificate was issued by an authority it trusts?

- A: It decrypts the certificate with the server's private key, which the server sends at the end of the handshake.
- B: It checks that the certificate's public key matches the key its trust store holds for that domain.
- C: It encrypts a random value with the CA's private key and checks that the server can decrypt it.
- D: It checks each issuer's signature with that issuer's public key, up to a root in its trust store.

> An issuer signs a hash of the certificate's contents with its own private
> key. The browser checks that signature with the issuer's public key, taken
> from the intermediate certificate the server also sends, then checks the
> intermediate in the same way, until it reaches a root certificate already
> in its trust store. (It also checks the dates, the host name and
> revocation.) Trust stores hold roots, not a key per domain; a private key
> is never sent; and a browser has no CA private key to encrypt with.

## networks-intermediate-063
topic: security
answer: B

A server's certificate is public, so anyone can copy it and send it. During a TLS 1.3 handshake, what stops an attacker who presents a copied certificate from passing as that server?

- A: The certificate lists the server's IP address, and the browser refuses any other address.
- B: The server must sign the handshake with the private key matching the certificate.
- C: The certificate authority signs every handshake live, and only for the genuine server.
- D: A certificate becomes invalid once it has been presented in a single handshake.

> In the CertificateVerify message the server signs a hash of the handshake so
> far with the private key belonging to its certificate, and the browser
> checks it with the certificate's public key. Without that private key the
> attacker cannot produce the signature. Certificates name host names (an IP
> address rarely), CAs take no part in handshakes, and a certificate is reused
> for every connection until it expires.

## networks-intermediate-064
topic: security
answer: C

An attacker records encrypted TLS sessions with a server today and steals the server's private key a year later. Which of the recorded sessions can it now decrypt?

- A: Every recorded session, because the private key decrypts all traffic sent to the server
- B: None of them, because each session's keys were thrown away when the session ended
- C: The sessions that used RSA key exchange, where the client encrypted the pre-master secret
- D: The sessions that used ephemeral Diffie–Hellman, since the private key signed those values

> With RSA key exchange (TLS 1.2 and earlier), the client sent the pre-master
> secret encrypted with the server's long-term public key. The recording holds
> that ciphertext, so the stolen private key recovers the secret and every
> key derived from it. With ephemeral Diffie–Hellman the secret was never
> sent; the private key only signed the exchanged values, and the ephemeral
> secrets are gone: forward secrecy. B fails because discarding the session
> keys does not erase the encrypted pre-master secret from the recording. TLS
> 1.3 removed RSA key exchange for this reason.

## networks-intermediate-065
topic: security
answer: A

Before a browser can send its first HTTP request on a brand-new connection, how many round trips of set-up does it need with TCP + TLS 1.2 (full handshake), with TCP + TLS 1.3, and with HTTP/3 over QUIC? Assume no session resumption, no 0-RTT data and no TLS False Start.

- A: 3, 2 and 1
- B: 2, 1 and 1
- C: 3, 2 and 2
- D: 3, 3 and 2

> TCP's handshake costs one round trip. A full TLS 1.2 handshake adds two
> (hellos and certificate, then key exchange and Finished), so three in all.
> TLS 1.3 sends its key share in the first message and needs one, so two.
> QUIC carries the TLS 1.3 handshake in its own connection set-up, so one. B
> leaves out TCP's handshake; C counts QUIC's transport and TLS separately;
> D treats TLS 1.3 like TLS 1.2.

## networks-intermediate-066
topic: security
answer: B, E

A stateless packet filter applies these rules from top to bottom. The first rule that matches decides, and a packet that matches no rule is denied.

| # | Action | Protocol | Source | Destination | Dest. port |
| --- | --- | --- | --- | --- | --- |
| 1 | deny | TCP | any | 10.0.5.0/24 | 22 |
| 2 | permit | TCP | 192.168.1.0/24 | 10.0.5.10 | 22 |
| 3 | permit | TCP | any | 10.0.5.0/24 | 443 |

Which of these packets does it permit? Select all that apply.

- A: TCP from 192.168.1.7 to 10.0.5.10, port 22
- B: TCP from 203.0.113.9 to 10.0.5.20, port 443
- C: UDP from 192.168.1.7 to 10.0.5.10, port 443
- D: TCP from 192.168.1.7 to 10.0.6.10, port 443
- E: TCP from 192.168.1.7 to 10.0.5.10, port 443

> A matches rule 1 and is denied before rule 2 is ever read; rule 2 is
> shadowed and can never match anything, so to allow that SSH it must sit
> above rule 1. B and E match rule 3. C is UDP and rule 3 permits only TCP,
> so it falls through to the default deny. D's destination, 10.0.6.10, is
> outside 10.0.5.0/24, so it is denied as well.

## networks-intermediate-067
topic: security
answer: D

During a SYN flood, how do SYN cookies let a server keep accepting genuine connections?

- A: It puts a cookie in an HTTP header, and only clients that echo it back are accepted.
- B: It refuses a second SYN from any source address it has already seen once.
- C: It doubles the size of its queue of half-open connections each time the queue fills.
- D: It keeps no half-open state, encoding it in the SYN-ACK's sequence number instead.

> A SYN flood fills the queue of half-open connections with spoofed SYNs that
> will never complete. With SYN cookies the server stores nothing until the
> handshake completes: it derives its initial sequence number from a keyed
> hash of the addresses, ports and a time counter (plus an encoded MSS). A
> genuine client's ACK returns that number plus one, which lets the server
> check it and rebuild the connection. Spoofed sources are random, so
> refusing repeat addresses does not help; growing the queue only moves the
> memory exhaustion; and HTTP sits above the layer under attack.

## networks-intermediate-068
topic: security
answer: B

Two offices join their networks with an IPsec VPN between their gateways, using ESP in tunnel mode. What can an eavesdropper on the internet path between the gateways read?

- A: The two inner hosts' IP addresses, since ESP encrypts only the transport payload
- B: The outer header's gateway addresses, but nothing of the original packet
- C: Nothing at all, since even the outer IP header is encrypted on the way
- D: The inner packet's TCP ports, which routers need in order to forward it

> Tunnel mode encrypts the whole original packet, inner IP header included,
> inside ESP and puts a new IP header in front, addressed between the two
> gateways. That outer header has to stay readable or no router could forward
> the packet. A describes transport mode, used between two hosts, where the
> original IP header stays in the clear. Routers forward on IP addresses, not
> on ports.

## networks-intermediate-069
topic: security
answer: C

A server's certificate lists exactly one name in its Subject Alternative Name: `*.example.com`. For which host name does a browser accept it?

- A: example.com
- B: a.shop.example.com
- C: shop.example.com
- D: shop.example.org

> A wildcard stands for exactly one whole label, the leftmost one, so
> *.example.com matches shop.example.com. It does not match the bare
> example.com (there is no label for the * to stand for) or a.shop.example.com
> (two labels), and example.org is another domain. That is why certificates
> usually list both example.com and *.example.com.

## networks-intermediate-070
topic: security
answer: A

Alice and Bob run Diffie–Hellman with the public values p = 23 and g = 5. Alice's secret is 6 and Bob's is 15. What value does Alice send to Bob, and what shared secret do they both compute?

- A: Alice sends 8; the shared secret is 2
- B: Alice sends 8; the shared secret is 14
- C: Alice sends 19; the shared secret is 2
- D: Alice sends 6; the shared secret is 2

> Alice sends g^a mod p = 5^6 mod 23 = 15,625 mod 23 = 8; Bob sends
> 5^15 mod 23 = 19. Alice computes 19^6 mod 23 = 2 and Bob computes
> 8^15 mod 23 = 2: both equal 5^(6 × 15) mod 23. B multiplies the two public
> values (8 × 19 mod 23 = 14, which is g^(a + b), not g^(ab)); C is the value
> Bob sends; D has Alice send her secret, which Diffie–Hellman never does.

## networks-intermediate-071
topic: devices
answer: D

Switches run classic 802.1D Spanning Tree with the default timers: hello 2 s, max age 20 s, forward delay 15 s. A link fails elsewhere in the network, so one switch's blocked port simply stops receiving the BPDUs that kept it blocked; nothing fails on its own links. At most, how long does it take before that port forwards traffic?

- A: 2 seconds
- B: 20 seconds
- C: 30 seconds
- D: 50 seconds

> The port keeps the last BPDU it heard until that information ages out,
> which takes up to max age, 20 s. Only then does it start moving to
> forwarding, spending one forward delay listening (15 s) and another
> learning (15 s): 20 + 15 + 15 = 50 s. C is the delay when the failure is on
> the switch's own link, which it notices at once and so skips the max-age
> wait; B is the max-age wait alone; A is the hello interval. Rapid Spanning
> Tree (802.1w) was designed to cut this to a few seconds or less.

## networks-intermediate-072
topic: devices
answer: B

Hosts A and B are both connected to a hub, and the hub is connected to port 5 of a switch. The switch has learned both A and B on port 5. A sends a unicast frame to B. What does the switch do with the copy of the frame it receives?

- A: It sends the frame back out of port 5 so that B is sure to receive it.
- B: It discards the frame, since B is on the port it arrived on.
- C: It forwards the frame to the port where the default gateway is.
- D: It floods the frame out of every port except port 5.

> The hub has already repeated the frame to B. The switch's table says B is
> reached through port 5, the port the frame came in on, so it filters
> (drops) the frame. Sending it back would put a duplicate on the hub's
> segment; flooding is only for unknown destinations; and a switch forwards
> by MAC address, knowing nothing of gateways.

## networks-intermediate-073
topic: devices
answer: B

A single 24-port switch has its ports split into three VLANs (10, 20 and 30). A router is attached to the switch by one 802.1Q trunk with one subinterface per VLAN, and has no other interfaces in use. How many broadcast domains are there?

- A: 1
- B: 3
- C: 4
- D: 24

> Each VLAN is its own broadcast domain: a broadcast in VLAN 10 reaches only
> VLAN 10's ports and the router's VLAN 10 subinterface, and routers do not
> forward broadcasts. That makes three. A ignores the VLANs; C counts the
> trunk as a fourth, but the trunk only carries the three VLANs' frames,
> tagged; D counts collision domains, one per switch port.

## networks-intermediate-074
topic: devices
answer: A

On an 802.1Q trunk, how are the frames of the native VLAN carried, and what happens if the two ends are configured with different native VLANs?

- A: They cross untagged, and the far end puts them into its own native VLAN.
- B: They carry a tag with VLAN ID 0, and the far end drops any it does not expect.
- C: They are tagged like every other VLAN, so a mismatch has no effect on them.
- D: They are not allowed on a trunk at all; only tagged frames may cross it.

> An 802.1Q trunk tags every VLAN's frames with a 4-byte tag holding a 12-bit
> VLAN ID, except the native VLAN's, which cross untagged. A receiver assigns
> every untagged frame to its own native VLAN, so if the ends disagree,
> frames from VLAN 1 on one side land in, say, VLAN 99 on the other: traffic
> leaks between two VLANs without any error. VLAN ID 0 marks a frame that
> carries only a priority, not a VLAN.

## networks-intermediate-075
topic: devices
answer: C

Host X (VLAN 10, `10.0.10.5/24`) and host Y (VLAN 20, `10.0.20.5/24`) are plugged into the same switch. For X to ping Y, what is needed?

- A: Nothing more, because a switch forwards frames between any two of its ports
- B: A trunk link configured between X's access port and Y's access port
- C: A router or Layer 3 switch with an interface in each VLAN as the gateway
- D: The same subnet mask on both hosts, so that each one sees the other as local

> A VLAN is a separate broadcast domain: the switch never forwards a frame
> from VLAN 10 into VLAN 20. X and Y are also in different subnets, so X sends
> the packet to its default gateway in any case. Something must route between
> the VLANs: a router (often one trunk with a subinterface per VLAN) or a
> Layer 3 switch with a virtual interface per VLAN. A trunk joins two
> switches, or a switch and a router, and carries VLANs side by side without
> joining them; and both hosts already have a /24 mask, but their subnets
> still differ.

## networks-intermediate-076
topic: devices
answer: D

Four switches run 802.1D Spanning Tree with these bridge priorities and MAC addresses:

| Switch | Bridge priority | MAC address |
| --- | --- | --- |
| S1 | 32768 | 00:00:0c:00:00:01 |
| S2 | 32768 | 00:00:0c:00:00:0a |
| S3 | 61440 | 00:00:0c:00:00:00 |
| S4 | 28672 | 00:00:0c:00:00:ff |

Which switch becomes the root bridge?

- A: S1
- B: S2
- C: S3
- D: S4

> The root is the switch with the lowest bridge ID, which is the priority
> followed by the MAC address, so the priority is compared first and the MAC
> only breaks ties. S4's 28672 is the lowest priority, so it wins despite
> having the highest MAC. S3 has the lowest MAC but the highest priority
> value; S1 would win only if every switch kept the default 32768. A lower
> number is the better one throughout.

## networks-intermediate-077
topic: devices
answer: C

Switch R is the Spanning Tree root bridge. Switch B has two uplinks: a 100 Mbit/s link straight to R, and a 1 Gbit/s link to switch A, which is joined to R by another 1 Gbit/s link. With the 802.1D port costs of 19 for 100 Mbit/s and 4 for 1 Gbit/s, which port does B choose as its root port, and which port ends up blocking?

- A: B's port toward R is its root port; B's port toward A blocks.
- B: B's port toward R is its root port; R's port toward B blocks.
- C: B's port toward A is its root port; B's port toward R blocks.
- D: B's port toward A is its root port; R's port toward B blocks.

> B's cost to the root is 19 over the direct link and 4 + 4 = 8 through A, so
> its root port is the one toward A. On the R–B link, R's port is designated,
> as every port of the root bridge is here, so B's port on that link is
> neither root nor designated and blocks. On the A–B link, A (cost 4 to the
> root) is designated and B's end is its root port. A and B choose by hop
> count; B and D block a port of the root bridge.

## networks-intermediate-078
topic: devices
answer: B, D

Two switches are joined by two parallel links, and Spanning Tree is turned off on both. A host sends one broadcast frame. Which of these follow? Select all that apply.

- A: Each switch forwards the broadcast once, then recognises and drops the copies that come back.
- B: Copies of the broadcast keep circulating, because an Ethernet frame carries no TTL.
- C: The frame is discarded automatically after it has crossed 16 switches.
- D: The switches' MAC tables keep changing as the host's address appears on different ports.
- E: Traffic is shared evenly over the two links with no ill effects.

> Each switch floods the broadcast out of every other port, including the
> second link, so copies go round the loop in both directions, multiplying
> with every extra path. Nothing stops them: Ethernet has no TTL and a switch
> keeps no memory of frames it has forwarded. The copies arrive carrying the
> host's source address on different ports, so the MAC tables flap. This
> broadcast storm is what Spanning Tree prevents by blocking one of the links.

## networks-intermediate-079
topic: devices
answer: A

Host X sends a 1,500-byte frame to host Y through two store-and-forward switches (X–S1–S2–Y), and every link runs at 1 Gbit/s. Ignoring propagation, queuing and processing delays, how long is it from the moment X starts sending until Y has received the whole frame?

- A: 36 µs
- B: 24 µs
- C: 12 µs
- D: 4.5 µs

> Putting the frame on one link takes 1,500 × 8 bits ÷ 1 Gbit/s = 12 µs. A
> store-and-forward switch must receive the whole frame (to check its FCS)
> before it starts sending it on, so the three links are crossed one after
> another: 3 × 12 = 36 µs. B counts the two switches instead of the three
> links; C is roughly what cut-through switching would give, starting to
> forward as soon as the destination address is read; D forgets to convert
> bytes to bits.

## networks-intermediate-080
topic: devices
answer: B

Hosts in VLAN 10 and VLAN 20 hang off one access switch, and routing between the VLANs is done by a router attached to that switch by a single 802.1Q trunk (router on a stick). When a host in VLAN 10 sends a packet to a host in VLAN 20, how does the packet use the trunk?

- A: It crosses once, tagged 10, and the switch then moves it into VLAN 20.
- B: It crosses twice: tagged 10 on the way to the router, tagged 20 on the way back.
- C: It crosses twice, tagged 10 in both directions, since tags are never rewritten.
- D: It crosses twice, untagged both ways, since the router reads only the IP header.

> The switch cannot move a frame between VLANs, so the frame goes up the
> trunk tagged 10 to the router's VLAN 10 subinterface. The router routes the
> packet, builds a new frame with new MAC addresses and a decremented TTL,
> and sends it out of its VLAN 20 subinterface, back down the same trunk
> tagged 20. The trunk therefore carries the traffic twice, one reason busy
> networks route between VLANs on a Layer 3 switch instead.
