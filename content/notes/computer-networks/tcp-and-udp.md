---
title: TCP and UDP
order: 5
minutes: 14
level: intermediate
updated: 2026-10-05
seo-title: TCP vs UDP: Handshake, Flow and Congestion Control
description: TCP and UDP at the transport layer: ports, header fields, the three-way handshake and four-way close, sliding windows, congestion control, and TCP vs UDP.
question: What is the difference between TCP and UDP?
answer: TCP (Transmission Control Protocol) is connection-oriented and reliable: it opens a connection with a three-way handshake, numbers every byte, retransmits lost data, delivers bytes in order and controls flow and congestion. UDP (User Datagram Protocol) is connectionless and best effort: it sends independent datagrams with an 8-byte header and no guarantees, so it is lighter and faster. Web pages use TCP; DNS queries, calls and games often use UDP.
q: What is the TCP three-way handshake?
a: It is how TCP opens a connection. The client sends a SYN with its initial sequence number, the server replies with a SYN-ACK carrying its own initial sequence number and acknowledging the client's, and the client sends an ACK. Both sides then know each other's starting numbers and the connection is established.
q: Why is UDP faster than TCP?
a: UDP has no connection setup, so data goes in the very first packet, while TCP spends a round trip on the handshake. UDP also has no acknowledgements, retransmissions, ordering or congestion control slowing the sender, and its header is 8 bytes instead of TCP's 20 to 60.
q: What is the size of the TCP and UDP headers?
a: The UDP header is always 8 bytes: source port, destination port, length and checksum. The TCP header is 20 bytes without options and up to 60 bytes with them, because its 4-bit header length field counts 32-bit words, at most 15 × 4 = 60 bytes.
q: What is the difference between flow control and congestion control in TCP?
a: Flow control protects the receiver: the receiver advertises a window (rwnd) of free buffer space and the sender never has more unacknowledged data than that. Congestion control protects the network: the sender keeps its own congestion window (cwnd), grown and cut by slow start and congestion avoidance. The sender obeys the smaller of the two.
q: Which applications use TCP and which use UDP?
a: TCP carries web traffic over HTTP/1.1 and HTTP/2, email (SMTP, IMAP, POP3), file transfer (FTP), SSH and database connections, where every byte must arrive. UDP carries DNS queries, DHCP, VoIP and video calls, online games, live streaming and QUIC, the transport under HTTP/3.
---

The network layer gets a packet to the right machine; the transport layer gets the data to the right program on that machine. The internet offers two main transport protocols with opposite philosophies. TCP turns IP's unreliable packets into a reliable, ordered stream of bytes and pays for it with setup time and overhead. UDP adds almost nothing to IP and leaves reliability, if it is needed at all, to the application. Interviewers ask about both, and about the handshake and windows in detail.

## What the transport layer does

- **Process-to-process delivery** using 16-bit **port numbers** (0 to 65,535).
- **Multiplexing and demultiplexing**: many applications on one host share the network, and each arriving segment is handed to the right socket.
- In TCP only: connection setup and teardown, reliability, ordering, flow control and congestion control.

A **socket** is one endpoint: an IP address plus a port. A TCP connection is identified by four values (source IP, source port, destination IP, destination port), so one web server on port 443 can hold thousands of connections at once: each comes from a different client address or port.

| Port range | Name | Used for |
| --- | --- | --- |
| 0 to 1023 | Well-known | Standard servers: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS |
| 1024 to 49151 | Registered | Assigned applications: 3306 MySQL, 5432 PostgreSQL |
| 49152 to 65535 | Dynamic (ephemeral) | Temporary client ports, as IANA defines them; Linux uses 32768 to 60999 by default |

## The UDP datagram

UDP's header is a fixed **8 bytes**; TCP's is 20 bytes before options. Side by side:

@figure headers

| Field | Bits | Purpose |
| --- | --- | --- |
| Source port | 16 | Sender's port, so a reply can come back (0 if unused) |
| Destination port | 16 | Receiving process |
| Length | 16 | Header plus data, in bytes (at least 8) |
| Checksum | 16 | Error detection over header, data and a pseudo-header of IP addresses; optional in IPv4, mandatory in IPv6 |

That is all. No connection, no sequence numbers, no acknowledgements. Each `sendto` call produces one datagram, and the receiver gets it whole or not at all, so UDP **preserves message boundaries**. A lost or reordered datagram is the application's problem.

## The TCP segment

| Field | Bits | Purpose |
| --- | --- | --- |
| Source port, destination port | 16 each | The two processes |
| Sequence number | 32 | Number of the first data byte in this segment (on a SYN, the initial sequence number) |
| Acknowledgement number | 32 | The next byte the sender of this segment expects to receive; valid when ACK is set |
| Header length | 4 | Header size in 32-bit words: 5 to 15, so 20 to 60 bytes |
| Reserved and flags | 12 | URG, ACK, PSH, RST, SYN, FIN, plus ECE and CWR for congestion notification |
| Window size | 16 | rwnd: how many more bytes the receiver can accept |
| Checksum | 16 | Error detection, mandatory |
| Urgent pointer | 16 | End of urgent data when URG is set (rarely used) |
| Options | 0 to 320 | MSS, window scaling, selective acknowledgement (SACK), timestamps |

The flags that matter most: **SYN** opens a connection, **ACK** says the acknowledgement number is valid, **FIN** says "I have no more data", **RST** aborts a connection at once, and **PSH** asks the receiver to pass data to the application without waiting. TCP numbers **bytes, not segments**, and SYN and FIN each consume one sequence number.

## Opening a connection: the three-way handshake

Suppose the client picks an initial sequence number (ISN) of 100 and the server picks 300. Real ISNs are unpredictable 32-bit values, chosen so old or forged segments are unlikely to fit.

@figure handshake

In short: SYN (seq = 100), SYN-ACK (seq = 300, ack = 101), ACK (seq = 101, ack = 301).

Three messages are the minimum because **each side must announce its own ISN and hear it acknowledged**. With only two, the server could never be sure the client received its ISN, and an old duplicate SYN arriving late could open a connection nobody asked for.

## Closing a connection: the four-way termination

TCP is full-duplex, so each direction is closed separately with its own FIN. Between the two FINs one direction is closed while the other may still carry data: a **half-close**. Suppose the client's next sequence number is 500, the server's is 800, and the server has no more data to send.

@figure teardown

The side that closes first waits in **TIME_WAIT** for twice the maximum segment lifetime (2 × MSL; Linux uses a fixed 60 seconds): if its last ACK is lost, the server will resend its FIN and the client must still be there to answer, and delayed segments of this connection must die out before the same four values are reused.

## Reliability: sequence numbers, ACKs and retransmission

TCP's acknowledgements are **cumulative**: "ack = 1,101" means "I have every byte before 1,101". Take the connection above, where the client's data starts at byte 101, and send five segments of 1,000 bytes. Segment 2 is lost.

@figure retransmit

The sender learns of the loss in one of two ways:

- **Timeout.** Each unacknowledged segment has a retransmission timer (RTO), computed from a smoothed RTT estimate plus a margin for its variation. When it expires, the segment is resent and the RTO doubles.
- **Fast retransmit.** Three duplicate ACKs strongly suggest one segment was lost while later ones arrived, so the sender resends it at once without waiting for the timer, as above.

Once the gap is filled the receiver acknowledges 5,101 in one go, because bytes 2,101 to 5,100 were already buffered. With the **SACK** option, the receiver can also say exactly which blocks it holds, so only missing data is resent.

## Flow control: the sliding window

The receiver has a finite buffer. In every segment it advertises **rwnd**, the free space left, and the sender keeps the bytes sent-but-unacknowledged at or below it. When rwnd is 0 the sender stops and probes with small segments on the **persist timer**. Number the bytes from 1 for simplicity and take a 4,000-byte buffer with a 1,000-byte maximum segment size (MSS):

@figure flow

The window "slides" forward as acknowledgements arrive. The 16-bit field caps rwnd at 65,535 bytes, so fast long links use the **window scale** option to multiply it.

## Congestion control

Flow control protects the receiver; **congestion control** protects the network. The sender keeps a **congestion window (cwnd)** and may have at most min(rwnd, cwnd) bytes in flight. The classic algorithm (TCP Reno, the textbook model) has these parts:

- **Slow start.** cwnd starts small (1 MSS in the textbook; modern stacks such as Linux start at 10 MSS) and grows by 1 MSS for every ACK, so it **doubles every RTT**, until it reaches the slow-start threshold **ssthresh**.
- **Congestion avoidance.** Above ssthresh, cwnd grows by about **1 MSS per RTT** (additive increase).
- **On a timeout**: ssthresh = cwnd / 2, cwnd = 1 MSS, and slow start begins again (both Tahoe and Reno).
- **On three duplicate ACKs**: fast retransmit the lost segment; Reno then sets ssthresh = cwnd / 2 and continues from cwnd = ssthresh (**fast recovery**), skipping slow start. Tahoe drops cwnd to 1 MSS instead.

### Worked example

Initial ssthresh = 16 MSS, cwnd starts at 1 MSS, and a timeout happens in round 9.

| RTT round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cwnd (MSS) | 1 | 2 | 4 | 8 | 16 | 17 | 18 | 19 | 20 | 1 | 2 | 4 | 8 | 10 | 11 | 12 |

The timeout at cwnd = 20 sets ssthresh = 10 and cwnd = 1, and the second slow start **stops at the new threshold**: 10 in round 14, not 16. Three duplicate ACKs instead would have let Reno continue from cwnd = 10 in round 10.

@figure cwnd

This sawtooth is called **AIMD** (additive increase, multiplicative decrease). Linux's default algorithm today is CUBIC, which grows cwnd as a cubic function of time since the last loss, but interview questions use the Reno model above.

## TCP vs UDP

| Aspect | TCP | UDP |
| --- | --- | --- |
| Connection | Connection-oriented, three-way handshake | Connectionless |
| Reliability | Acknowledgements and retransmission | Best effort; data may be lost |
| Ordering | Delivered in order | No ordering |
| Data model | Byte stream, no message boundaries | Datagrams, boundaries preserved |
| Header | 20 to 60 bytes | 8 bytes |
| Flow and congestion control | Yes | No |
| First data | After one round trip of handshake | In the first packet |
| Broadcast and multicast | No, one-to-one only | Supported |
| Typical uses | Web (HTTP/1.1, HTTP/2), email, file transfer, SSH, databases | DNS, DHCP, VoIP, video calls, games, streaming, QUIC (HTTP/3) |

| Application | Protocol | Transport and port |
| --- | --- | --- |
| Web | HTTP, HTTPS | TCP 80, TCP 443 (HTTP/3: UDP 443) |
| Email | SMTP, IMAP, POP3 | TCP 25, 143, 110 |
| Remote login | SSH | TCP 22 |
| Name lookup | DNS | UDP 53 (TCP 53 for large answers and zone transfers) |
| Address assignment | DHCP | UDP 67 (server), 68 (client) |
| Network management | SNMP | UDP 161 |
| Voice and video calls | RTP | UDP, ports chosen per call |

Real-time media prefers UDP because a late packet is useless: replaying a lost 20 ms of audio after a retransmission would only add delay.

## Common mistakes

- Saying the acknowledgement number is the sequence number received: it is the **next byte expected**.
- Forgetting that SYN and FIN each consume one sequence number (ISN 100 is acknowledged with 101).
- Claiming UDP has no checksum: it has one, optional only in IPv4.
- Confusing flow control (receiver's buffer, rwnd) with congestion control (the network, cwnd).
- Saying TCP preserves message boundaries: two writes of 100 bytes may arrive as one read of 200.
- Letting slow start overshoot ssthresh after a timeout: cwnd stops at the threshold, then grows linearly.

## Interview questions

**Why is the TCP handshake three-way and not two-way?**
Both sides must announce an initial sequence number and receive an acknowledgement for it. Two messages acknowledge only the client's number, leaving the server unsure the client received its own; the third message closes that gap and protects against old duplicate SYNs opening stale connections.

**What happens if the final ACK of the handshake is lost?**
The server stays in SYN_RECEIVED and retransmits its SYN-ACK after a timeout; the client answers with another ACK. If the client has already started sending data, the server accepts it, since every data segment also carries the acknowledgement it was waiting for.

**What is TIME_WAIT, and why does it last 2 × MSL?**
It is the state the side that closes first enters after sending the final ACK. Waiting two maximum segment lifetimes lets it re-acknowledge a retransmitted FIN if its last ACK was lost, and lets stray segments of the old connection expire before the same address and port pair is reused.

**What is a SYN flood, and how do SYN cookies help?**
An attacker sends many SYNs, often from spoofed addresses, and never completes the handshake, filling the server's queue of half-open connections. With SYN cookies, the server keeps no state for a SYN; it encodes the connection details in its own ISN and rebuilds them only when a valid final ACK returns.

**What triggers fast retransmit?**
Three duplicate ACKs for the same number. They mean later segments are arriving while one is missing, so the sender resends that segment immediately rather than waiting for the retransmission timer.

**Why does DNS use UDP?**
A query and its answer usually fit in one small datagram each, so a TCP handshake would double the time for little benefit. The resolver simply retries on loss. DNS switches to TCP when an answer is too large or for zone transfers.

**Can two clients connect to the same server port at the same time?**
Yes. A TCP connection is identified by source IP, source port, destination IP and destination port. Clients differ in address or source port, so thousands of connections can share the server's port 443.

**How is the amount of data a TCP sender may have in flight decided?**
It is the minimum of the receiver's advertised window (rwnd, flow control) and the sender's congestion window (cwnd, congestion control). Whichever is smaller limits the sender.

Next, read [DNS](/notes/computer-networks/dns), and test the handshakes and windows with the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
