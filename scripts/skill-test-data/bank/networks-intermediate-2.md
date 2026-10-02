---
skill: networks
level: intermediate
---

## networks-intermediate-028
topic: models
answer: B, C, E, F

A TCP segment travels between two hosts through three IPv4 routers, with no NAT anywhere. Compare the frame as it leaves the sender with the frame as it reaches the receiver. Which of these fields hold different values? Select all that apply.

- A: The destination IP address
- B: The source MAC address
- C: The TTL in the IP header
- D: The TCP destination port
- E: The IP header checksum
- F: The destination MAC address

> Each router takes the packet out of the incoming frame and builds a new
> frame for the next link: the source MAC becomes its outgoing interface's
> address and the destination MAC the next hop's. So the sender's frame is
> addressed from the sender to the first router, and the frame that arrives
> is addressed from the last router to the receiver. Each router also
> decrements the TTL (here by 3 in all) and, because the TTL is part of the
> header, recomputes the IPv4 header checksum. IP addresses and ports are end
> to end: without NAT no router touches them.

## networks-intermediate-029
topic: models
answer: D

Inside a router, a memory fault flips one bit in the TCP payload of a packet after the router has checked the incoming frame's FCS and before it computes the FCS for the outgoing frame. Which check catches the error?

- A: The FCS check at the next device on the outgoing link
- B: The IPv4 header checksum, checked at the next router
- C: None of them: every check passes and the data is delivered
- D: The TCP checksum, verified by the receiving host

> The outgoing FCS is computed over bits that are already wrong, so the next
> device finds it consistent. The IPv4 header checksum covers only the header.
> The TCP checksum covers the header and the payload from end to end, and a
> single flipped bit always changes a ones'-complement sum, so the receiver
> discards the segment and the sender retransmits it. This is the end-to-end
> argument: checks on each link cannot protect data while it sits inside the
> devices between links.

## networks-intermediate-030
topic: models
answer: B

When an IPv6 router forwards a packet it decrements the Hop Limit, yet it recomputes no header checksum. Why?

- A: The Hop Limit field sits outside the part of the header the checksum covers.
- B: The IPv6 header has no checksum; errors are left to the link and transport checks.
- C: Only the destination checks the IPv6 header checksum, so routers may leave it stale.
- D: IPv6 routers forward packets as they are and never alter any header field.

> IPv6 dropped the header checksum to save work at every hop: link layers
> such as Ethernet already check each frame, and the transport checksums
> cover the addresses through a pseudo-header (which is why the UDP checksum,
> optional over IPv4, is mandatory over IPv6). D contradicts the question:
> the router does change the Hop Limit.

## networks-intermediate-031
topic: transport
answer: A

A client opens a TCP connection with initial sequence number 1000; the server's initial sequence number is 5000. After the handshake the client sends 200 bytes in one segment, then 300 bytes in a second segment. What sequence number does the second data segment carry, and what acknowledgement number does the server send once it has received both?

- A: 1201 and 1501
- B: 1200 and 1500
- C: 1201 and 1500
- D: 1201 and 500

> The SYN consumes one sequence number, so the first data byte is 1001. The
> first segment carries bytes 1001–1200, the second starts at 1201 and
> carries 1201–1500. An acknowledgement names the next byte the receiver
> expects: 1501. B forgets that the SYN uses up a number; C acknowledges the
> last byte received instead of the next one expected; D counts bytes
> received rather than giving a sequence number.

## networks-intermediate-032
topic: transport
answer: C

A sender transmits four 500-byte segments with sequence numbers 2001, 2501, 3001 and 3501. The segment starting at 2501 is lost; the other three arrive. The receiver sends an acknowledgement for each segment it receives and does not use SACK. What acknowledgement numbers does it send, in order?

- A: 2501, 3501, 4001
- B: 2500, 2500, 2500
- C: 2501, 2501, 2501
- D: 2501, 2501, 4001

> TCP acknowledgements are cumulative: each names the next byte expected in
> order. After the segment at 2001 that is 2501. The segments at 3001 and 3501
> arrive after a gap; the receiver can buffer them, but its acknowledgement
> still says 2501, so they produce two duplicate ACKs. A acknowledges each
> segment on its own; B names the last byte received instead of the next one
> expected; D jumps past the hole. Note that two duplicates are one short of
> the three that trigger fast retransmit, so unless more segments follow, the
> sender recovers only when its timer expires.

## networks-intermediate-033
topic: transport
answer: D

A TCP receiver has a 32,768-byte receive buffer. It has received 20,000 bytes in order and acknowledged them, and the application has read 8,000 of those bytes so far. What receive window does it advertise? (No window scaling.)

- A: 12,768 bytes
- B: 24,768 bytes
- C: 12,000 bytes
- D: 20,768 bytes

> The window is the free space in the buffer: buffer size minus the bytes
> received but not yet read. 32,768 − (20,000 − 8,000) = 20,768. A subtracts
> everything ever received, as if the application had read nothing; B
> subtracts only what was read; C is the amount of unread data, not the free
> space.

## networks-intermediate-034
topic: transport
answer: B

A TCP connection that does not use the window-scale option has a 65,535-byte receive window. The path's round-trip time is 100 ms and its bottleneck link runs at 1 Gbit/s. Ignoring headers and losses, what is the most this connection can carry?

- A: About 655 kbit/s
- B: About 5.2 Mbit/s
- C: About 10.5 Mbit/s
- D: About 1 Gbit/s

> A sender may have at most one window of unacknowledged data outstanding,
> and acknowledgements come back once per round trip. So the rate is at most
> 65,535 × 8 bits per 0.1 s ≈ 5.24 Mbit/s, whatever the link speed. Filling
> 1 Gbit/s over 100 ms needs 12.5 MB in flight, which is what the window-scale
> option is for. A is 655 kB/s mislabelled (bytes not converted to bits);
> C uses the one-way delay of 50 ms; D ignores the window.

## networks-intermediate-035
topic: transport
answer: A

A TCP sender starts with cwnd = 1 MSS and ssthresh = 64 MSS. In slow start cwnd doubles every round trip; once it reaches ssthresh the sender switches to congestion avoidance, where cwnd grows by 1 MSS every round trip. Rounds are numbered from 1, and a round's cwnd is the window it sends with. During round 5 (cwnd = 16 MSS) a retransmission timeout occurs. Using the TCP Reno rules, what is cwnd in round 11?

- A: 10 MSS
- B: 32 MSS
- C: 13 MSS
- D: 11 MSS

> On a timeout Reno sets ssthresh to half the window (16 / 2 = 8) and cwnd to
> 1 MSS. Rounds 6, 7, 8 and 9 send 1, 2, 4 and 8; at 8 cwnd has reached
> ssthresh, so growth turns linear: 9 in round 10 and 10 in round 11. B keeps
> the old ssthresh of 64 and goes on doubling; C applies the three-duplicate-
> ACK rule (cwnd restarts at 8, not 1); D restarts at 1 in round 5 itself,
> although round 5 had already been sent with 16.

## networks-intermediate-036
topic: transport
answer: C

A TCP Reno sender has cwnd = 24 MSS, all of it in flight, when it detects a loss. With the classic Reno rules (ssthresh becomes half the data in flight), what are ssthresh and cwnd (a) after a retransmission timeout, and (b) after three duplicate ACKs, once fast recovery has ended?

- A: (a) ssthresh 12, cwnd 12; (b) ssthresh 12, cwnd 1
- B: (a) ssthresh 12, cwnd 1; (b) ssthresh 12, cwnd 1
- C: (a) ssthresh 12, cwnd 1; (b) ssthresh 12, cwnd 12
- D: (a) ssthresh 24, cwnd 1; (b) ssthresh 12, cwnd 12

> Both events halve ssthresh to 12. A timeout means nothing has been getting
> through, so Reno restarts slow start from 1 MSS. Three duplicate ACKs mean
> later segments are still arriving, so Reno retransmits the missing one at
> once (fast retransmit) and, when fast recovery ends, sets cwnd to ssthresh,
> 12, and carries on in congestion avoidance: the multiplicative decrease of
> AIMD. B is TCP Tahoe, which treats both signals like a timeout; A swaps the
> two cases; D forgets that a timeout lowers ssthresh as well.

## networks-intermediate-037
topic: transport
answer: D

A long-lived TCP Reno flow loses one segment, detected by three duplicate ACKs, each time its window reaches 20 segments; it then halves the window and grows it again by one segment per round trip. Segments are 1,500 bytes and the round-trip time is a constant 100 ms. What is its average throughput?

- A: 2.4 Mbit/s
- B: 1.2 Mbit/s
- C: 225 kbit/s
- D: 1.8 Mbit/s

> The window saws between 10 and 20 segments: 10, 11, …, 20 and back to 10.
> Its average is 15 segments, three quarters of the peak. 15 × 1,500 bytes × 8
> bits per 0.1 s = 1.8 Mbit/s. A uses the peak window of 20 and B the trough
> of 10; C is 225 kB/s, the right rate in bytes, mislabelled as bits.

## networks-intermediate-038
topic: transport
answer: A

Host A sends the first FIN to close a TCP connection with host B. B acknowledges it, finishes sending, and later sends its own FIN, which A acknowledges. Which host passes through TIME_WAIT, and for how long does it stay there?

- A: A, for twice the maximum segment lifetime (2 × MSL)
- B: B, for twice the maximum segment lifetime (2 × MSL)
- C: A, for one round-trip time
- D: Both hosts, for one maximum segment lifetime each

> The side that closes first (the active closer) enters TIME_WAIT after it
> sends the final ACK, and stays 2 × MSL. That covers two things: if the final
> ACK is lost, B retransmits its FIN and A must still be there to acknowledge
> it; and any delayed segments of this connection must die out before the
> same pair of addresses and ports can be used again. B, the passive closer,
> goes from LAST_ACK to CLOSED as soon as the final ACK arrives.

## networks-intermediate-039
topic: transport
answer: B

Host A has sent bytes with sequence numbers 1001 to 4000 and now sends a FIN. Host B acknowledges the FIN but still has data of its own to send. What acknowledgement number does B's ACK carry, and which states are the two hosts in afterwards?

- A: 4001; A in FIN_WAIT_2, B in CLOSE_WAIT
- B: 4002; A in FIN_WAIT_2, B in CLOSE_WAIT
- C: 4002; A in TIME_WAIT, B in CLOSED
- D: 4001; A in CLOSE_WAIT, B in FIN_WAIT_2

> A FIN occupies one sequence number, like a byte: here 4001, so the ACK for
> it says 4002. A has sent its FIN and had it acknowledged, so it waits in
> FIN_WAIT_2 for B's FIN. B has received a FIN, so it is in CLOSE_WAIT: the
> connection is half closed, and B may keep sending data until its
> application closes, which sends B's own FIN. A forgets that the FIN takes a
> sequence number; C describes the very end of the close; D swaps the states.

## networks-intermediate-040
topic: transport
answer: C

UDP protects its datagrams with the 16-bit Internet checksum. What is the checksum of a message made of the three 16-bit words `0x6A3C`, `0xB2E1` and `0x4F08`?

- A: `0x6C26`
- B: `0x93DA`
- C: `0x93D9`
- D: `0x6C25`

> Add the words in ones'-complement arithmetic, folding every carry out of
> bit 15 back into bit 0: 0x6A3C + 0xB2E1 = 0x11D1D, which folds to
> 0x1D1D + 1 = 0x1D1E; then 0x1D1E + 0x4F08 = 0x6C26. The checksum is the
> complement of the sum: 0x93D9. A is the sum before complementing. D drops
> the carry instead of folding it in, and B is the complement of that wrong
> sum. A receiver adds every word and the checksum and expects 0xFFFF.

## networks-intermediate-041
topic: link-layer
answer: D

A stop-and-wait protocol sends 1,000-byte frames over a 1 Mbit/s link with a one-way propagation delay of 20 ms. Ignoring the acknowledgement's transmission time and all processing delays, what fraction of the time is the sender transmitting?

- A: 40%
- B: About 28.6%
- C: 20%
- D: About 16.7%

> Sending one frame takes 8,000 bits ÷ 1 Mbit/s = 8 ms. The sender then waits
> for the frame to reach the receiver and the ACK to come back, 2 × 20 = 40 ms,
> before it can send again. Each cycle is 48 ms with 8 ms of sending:
> 8 / 48 = 1/6 ≈ 16.7%. B uses only the one-way delay (8 / 28); C leaves the
> transmission time out of the cycle (8 / 40); A compares the transmission
> time with the one-way delay alone (8 / 20).

## networks-intermediate-042
topic: link-layer
answer: B

Frames take 8 ms to transmit, and the one-way propagation delay is 20 ms; ignore the acknowledgements' transmission time and processing delays. What is the smallest sender window, in frames, that keeps the link continuously busy, and the fewest sequence-number bits Selective Repeat needs for that window?

- A: 6 frames; 3 bits
- B: 6 frames; 4 bits
- C: 4 frames; 3 bits
- D: 5 frames; 4 bits

> The first acknowledgement returns 8 + 2 × 20 = 48 ms after the first frame
> starts, and in that time the sender can transmit 48 / 8 = 6 frames, so the
> window must be 6. Selective Repeat needs a window of at most half the
> sequence space, W ≤ 2^(k−1): 3 bits allow only 4, so it needs 4 bits
> (window up to 8). A applies Go-Back-N's limit, W ≤ 2^k − 1, which 3 bits
> meet; C counts only the one-way delay; D leaves out the time the first
> frame itself takes to send.

## networks-intermediate-043
topic: link-layer
answer: A

A Go-Back-N sender uses 3-bit sequence numbers (0–7) with a window of 8. It sends frames 0 to 7; the receiver gets all eight in order, delivers them and acknowledges them, but every acknowledgement is lost. The sender times out and resends frame 0. What does the receiver do with it?

- A: It accepts the old frame 0 as the next new frame and delivers a duplicate.
- B: It recognises a duplicate, discards it and re-sends its last acknowledgement.
- C: It discards the frame, because a Go-Back-N receiver buffers out-of-order frames.
- D: It rejects the frame, because it can see that the sequence numbers have wrapped.

> After delivering 0–7, the receiver expects frame 0 of the next cycle, and
> the resent old frame 0 carries exactly that number, so it is accepted as new
> data. Nothing in the frame tells the two apart. That is why Go-Back-N's
> window must be at most 2^k − 1 = 7: after frames 0–6 the receiver would
> expect 7, and a resent 0 would be recognised as old. C is wrong twice over:
> Go-Back-N receivers keep no out-of-order frames, and frame 0 is the one it
> expects.

## networks-intermediate-044
topic: link-layer
answer: C

Go-Back-N with a window of 4 is used to send frames 0 to 7 (the sequence numbers do not wrap here). Frame 2 is lost the first time it is sent; nothing else is lost. The sender sends whenever its window allows, and frame 2's timer expires only after the acknowledgements for frames 0 and 1 have arrived and the sender has filled its window again. On a timeout it resends every outstanding frame. How many frame transmissions does it take to deliver all eight frames?

- A: 9
- B: 16
- C: 12
- D: 14

> The sender sends 0–3. The ACKs for 0 and 1 slide the window, so it sends 4
> and 5: six transmissions. Frame 2 never arrived, so the receiver discards 3,
> 4 and 5. The timeout resends everything outstanding, 2, 3, 4 and 5: ten.
> Their ACKs open the window for 6 and 7: twelve. A is Selective Repeat, which
> resends only frame 2; D resends every frame from 2 to 7, including two that
> were never sent; B sends all eight twice.

## networks-intermediate-045
topic: link-layer
answer: D

A sender protects the 6-bit message 101110 with a CRC whose generator polynomial is x³ + x + 1 (the bits 1011). What bit string does it transmit?

- A: 101110010
- B: 101110111
- C: 101110000
- D: 101110110

> The generator has degree 3, so append three 0s and divide 101110000 by
> 1011 using XOR (modulo-2) subtraction. The remainder is 110, and it replaces
> the appended zeros: 101110110, which leaves remainder 0 when divided by
> 1011, as the receiver checks. A divides the message without appending
> zeros first (remainder 010); B appends four zeros, one per generator bit,
> instead of three (remainder 111); C sends the padded message without putting
> the remainder in.

## networks-intermediate-046
topic: link-layer
answer: B

A code has four codewords: 00000000, 00011111, 11100011 and 11111100. What is its minimum Hamming distance, and how many bit errors in a codeword can it always detect and always correct?

- A: Distance 5; detects 5 errors, corrects 2
- B: Distance 5; detects 4 errors, corrects 2
- C: Distance 6; detects 5 errors, corrects 2
- D: Distance 5; detects 2 errors, corrects 4

> The six pairwise distances are 5, 5, 6, 6, 5 and 5, so the minimum distance
> d is 5. Up to d − 1 = 4 flipped bits can never turn one codeword into
> another, so they are always detected; 5 flips can, so A is wrong. Correction
> picks the nearest codeword, which is safe up to ⌊(d − 1) / 2⌋ = 2 errors.
> C uses the largest distance instead of the smallest; D swaps the two counts.

## networks-intermediate-047
topic: link-layer
answer: D

A block of data bits is protected by two-dimensional even parity: one parity bit for every row and one for every column. The parity bits themselves arrive intact; only data bits are flipped. Which error pattern can go undetected?

- A: A single flipped bit anywhere in the block
- B: Two flipped bits that lie in the same row
- C: Any three flipped bits, wherever they are
- D: Four flipped bits on a rectangle's corners

> A row or column check fails exactly when it holds an odd number of flipped
> bits. One flip upsets its row and its column. Two flips in one row leave
> that row even but upset two columns. Three flips can never pass: the rows'
> flip counts add up to 3, an odd number, so some row holds an odd count. Four
> flips at the corners of a rectangle put two in each of two rows and two in
> each of two columns, so every check passes.

## networks-intermediate-048
topic: link-layer
answer: A

A CSMA/CD network runs at 100 Mbit/s over a 1 km cable, and signals travel at 2 × 10⁸ m/s. Ignoring repeaters and the jam signal, what is the minimum frame length that guarantees the sender is still transmitting when news of any collision reaches it?

- A: 1,000 bits
- B: 500 bits
- C: 512 bits
- D: 2,000 bits

> The one-way propagation time is 1,000 m ÷ 2 × 10⁸ m/s = 5 µs. In the worst
> case the other station starts just as the first signal reaches it, at the
> far end, and the collision takes another 5 µs to travel back, so the sender
> must still be sending 10 µs after it starts. At 100 Mbit/s that is 1,000
> bits (125 bytes). B allows for only the one-way trip; C quotes classic
> Ethernet's 512 bits, which comes from its own speed and cable length; D
> doubles the round trip.

## networks-intermediate-049
topic: link-layer
answer: B, C, E

Which statements about how 802.11 Wi-Fi's CSMA/CA works, compared with Ethernet's CSMA/CD, are true? Select all that apply.

- A: A Wi-Fi sender aborts its frame and sends a jam signal as soon as it detects a collision.
- B: The receiver sends its ACK after only a short interframe space (SIFS), shorter than the DIFS other stations must wait.
- C: Every unicast data frame is acknowledged, and a missing ACK makes the sender retry after a backoff from a larger window.
- D: CSMA/CA requires a minimum frame size so that collisions are seen before a frame ends.
- E: With RTS/CTS, a hidden terminal learns from the receiver's CTS how long to stay silent, through its NAV.

> A radio cannot hear a collision while it transmits, and a collision can
> happen at the receiver between two senders that cannot hear each other, so
> Wi-Fi avoids collisions instead of detecting them. A station waits for the
> medium to be idle for DIFS plus a random backoff; the receiver answers
> after the shorter SIFS, so its ACK always wins the medium; a missing ACK is
> the only sign of a collision, and each failed try widens the backoff
> window. RTS and CTS carry the exchange's duration, which every station that
> hears either one stores in its network allocation vector (NAV) and stays
> quiet for. Jam signals and a minimum frame size belong to CSMA/CD.

## networks-intermediate-050
topic: link-layer
answer: C

Classic 10 Mbit/s Ethernet uses binary exponential backoff with a slot time of 512 bit times. After a frame's third collision in a row, what is the longest a station can wait before its next attempt?

- A: 153.6 µs
- B: 409.6 µs
- C: 358.4 µs
- D: 2.87 ms

> After the nth collision the station picks K at random from 0 to 2^n − 1
> (n capped at 10) and waits K slots. After the third, K is at most 7. A slot
> is 512 bits ÷ 10 Mbit/s = 51.2 µs, so the longest wait is 7 × 51.2 =
> 358.4 µs. A uses the range after the second collision (K ≤ 3); B lets K
> reach 8; D takes the slot as 512 bytes instead of 512 bits.

## networks-intermediate-051
topic: application
answer: B

A recursive resolver caches the A record for shop.example.com at 10:00:00; the record's TTL is 3,600 seconds. At 10:20:00 the zone's owner changes the record to a new address and lowers its TTL to 60 seconds. If the resolver honours TTLs and does not evict the entry early, until when can its clients still be given the old address?

- A: 10:21:00
- B: 11:00:00
- C: 10:20:00
- D: 11:20:00

> A cache keeps a record for the TTL that came with it. The resolver fetched
> the old record with a TTL of 3,600 s, so it may serve it until 11:00:00; the
> new TTL arrives only with the new record, after that. Nothing pushes
> changes into caches. That is why operators lower a TTL at least one old
> TTL before changing an address. A applies the new TTL to an entry that
> never saw it; C assumes the change reaches caches at once; D counts the hour
> from the change.

## networks-intermediate-052
topic: application
answer: A

Which DNS query finds the host name registered for the IPv4 address `192.0.2.25`?

- A: A PTR query for 25.2.0.192.in-addr.arpa
- B: A PTR query for 192.0.2.25.in-addr.arpa
- C: An A query for 25.2.0.192.in-addr.arpa
- D: A CNAME query for 192.0.2.25.in-addr.arpa

> Reverse lookups ask for a PTR record under in-addr.arpa, with the address's
> octets reversed. DNS names run from most specific to least, while IP
> addresses run the other way; reversing them lets 2.0.192.in-addr.arpa be
> delegated to whoever holds 192.0.2.0/24. An A query asks for an address,
> the opposite of what is wanted, and a CNAME is an alias, not a host name
> for an address.

## networks-intermediate-053
topic: application
answer: D

The owner of example.com wants the bare name example.com to be a CNAME pointing to a hosting provider's name. Why does standard DNS not allow it?

- A: A CNAME may only point to a name inside the same zone as the CNAME itself.
- B: A CNAME's target has to be written as an IP address rather than a host name.
- C: A CNAME is allowed only on names that are made of three or more labels.
- D: The apex must hold SOA and NS, and a CNAME cannot share a name with them.

> A name that has a CNAME may have no other records, because a resolver that
> finds the CNAME follows it for every record type. The zone apex always
> holds the zone's SOA and NS records, so it cannot also be a CNAME.
> Providers work around this with ALIAS or ANAME records or "CNAME
> flattening", which look up the target themselves and serve plain A and
> AAAA records. A CNAME can point into any zone, its target is a name (an IP
> address belongs in an A record), and no rule counts labels.

## networks-intermediate-054
topic: application
answer: C

The domain example.org publishes three MX records: preference 20 for mx2.example.org, preference 10 for mx1.example.org and preference 30 for backup.example.net. mx1 is unreachable. Where does a sending mail server try next?

- A: backup.example.net, since the highest preference value comes first
- B: Nowhere: it queues the message until mx1 can be reached again
- C: mx2.example.org, the lowest preference value after mx1
- D: mx2 and backup together, so that at least one copy arrives

> Senders try MX hosts in order of preference value, lowest first: mx1 (10),
> then mx2 (20), then backup (30). With mx1 down it moves on to mx2, and
> queues for a later retry only if every MX host fails. A reads the numbers
> the wrong way round, and a message is delivered once, not to several hosts.
