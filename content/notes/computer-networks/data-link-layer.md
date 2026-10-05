---
title: Data Link Layer: Framing, Error Control and MAC
order: 9
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Data Link Layer: Framing, CRC, Sliding Window, ARP
description: The data link layer explained: framing and bit stuffing, parity, checksum and a worked CRC, Hamming code, Go-Back-N and Selective Repeat, ARP and CSMA/CD.
question: What does the data link layer do in computer networks?
answer: The data link layer (layer 2) moves frames between two directly connected nodes. It packs packets into frames, adds source and destination MAC addresses, detects transmission errors with a CRC in the frame's trailer, can control the flow between sender and receiver, and decides which device may transmit on a shared medium. Ethernet, Wi-Fi and PPP are data link protocols, and switches work at this layer.
q: What is the difference between error detection and error correction?
a: Error detection only tells the receiver that a frame was damaged, using parity, a checksum or a CRC; the frame is then discarded or retransmitted. Error correction adds enough redundancy, as in Hamming codes, for the receiver to work out which bits are wrong and fix them without a retransmission.
q: What is CRC and how does it work?
a: A cyclic redundancy check treats the data bits as a polynomial and divides it, using modulo-2 arithmetic, by an agreed generator polynomial. The sender appends the remainder to the data; the receiver divides the whole frame by the same generator, and any non-zero remainder means the frame was corrupted. Ethernet uses a 32-bit CRC.
q: What is the difference between Go-Back-N and Selective Repeat?
a: Both keep a window of unacknowledged frames in flight. In Go-Back-N the receiver accepts frames only in order, so after a loss the sender resends the lost frame and every frame after it. In Selective Repeat the receiver buffers out-of-order frames and the sender resends only the frames actually lost.
q: What is ARP in networking?
a: The Address Resolution Protocol finds the MAC address that belongs to an IPv4 address on the local network. A host broadcasts "who has this IP address?", the owner replies with its MAC address, and the answer is cached. For a destination on another network, the host resolves its default gateway's MAC address instead.
q: What is the difference between CSMA/CD and CSMA/CA?
a: CSMA/CD, used by classic half-duplex Ethernet, transmits after sensing an idle medium, detects collisions while sending, and backs off and retries. CSMA/CA, used by Wi-Fi, cannot detect collisions, so it tries to avoid them with waiting gaps and random backoff before sending, and treats a missing acknowledgement as a collision.
q: What is bit stuffing?
a: Bit stuffing keeps a frame's data from imitating the flag pattern 01111110 that marks frame boundaries in HDLC-style protocols. Whenever the sender sees five consecutive 1s in the data, it inserts a 0; the receiver removes any 0 that follows five 1s. So 01111111 is sent as 011111011.
---

The physical layer moves raw bits, and bits get corrupted, collide and arrive faster than a receiver can handle. The data link layer turns that unreliable bit pipe into a service the network layer can use: frames with clear boundaries, addressed to a neighbour, checked for errors and sent only when the medium is free. Its scope is a single link, from one node to the next; the [network layer](/notes/computer-networks/routing-algorithms) strings links together into paths. This note covers each of its jobs with worked examples.

## What the data link layer does

- **Framing**: marking where each frame starts and ends.
- **Physical addressing**: source and destination MAC addresses in every frame.
- **Error control**: detecting damaged frames (CRC), and on some links retransmitting them.
- **Flow control**: not sending faster than the receiver can accept.
- **Medium access control**: deciding who transmits when many devices share a medium.

IEEE splits the layer into an upper **LLC** (logical link control) sublayer, which faces the network layer, and a lower **MAC** (media access control) sublayer, which handles addressing and medium access.

## Framing

The receiver sees a stream of bits and must find frame boundaries. Four methods:

| Method | How it works | Weakness |
| --- | --- | --- |
| Character (byte) count | A header field gives the frame's length | One corrupted count loses synchronisation for every later frame |
| Byte stuffing | A FLAG byte marks each end; a FLAG or ESC byte inside the data gets an ESC byte before it | Frames grow with special bytes; tied to 8-bit bytes |
| Bit stuffing | The flag is 01111110; after five consecutive 1s in the data, the sender inserts a 0 | A little overhead |
| Physical-layer coding violations | Uses signal patterns that never occur in data | Needs suitable line coding |

@figure framing

PPP uses byte stuffing; HDLC uses bit stuffing. Either way the receiver undoes the rule, so the data can never be mistaken for a boundary.

## Error detection

### Parity

A parity bit makes the count of 1s even (even parity) or odd. The data 1011001 has four 1s, so its even parity bit is 0 and 10110010 is sent. Single parity detects any odd number of flipped bits but misses any even number. **Two-dimensional parity** arranges data in a grid with a parity bit per row and column; it can detect all 1-, 2- and 3-bit errors and can locate and correct a single-bit error.

### Checksum

The sender adds the data words in one's complement arithmetic (a carry out of the top is wrapped round and added back) and sends the complement of the sum. Take 4-bit words 7, 11, 12, 0 and 6:

| Step | Working | Result |
| --- | --- | --- |
| Plain sum | 7 + 11 + 12 + 0 + 6 | 36 = 100100 in binary |
| Wrap the carry | 0100 + 10 = 0110 | 6 |
| Checksum | Complement of 0110 | 1001 = 9 |
| Receiver's sum | 7 + 11 + 12 + 0 + 6 + 9 = 45 = 101101; wrap: 1101 + 10 | 1111 = 15 |
| Receiver's check | Complement of 1111 | 0000, so no error detected |

The Internet checksum used by IP, TCP and UDP is the same idea with 16-bit words. It is cheap but weak: swapping two words leaves the sum unchanged.

### Cyclic redundancy check (CRC)

CRC treats bits as polynomial coefficients (1011 is x^3 + x + 1) and uses **modulo-2 division**, where subtraction is XOR and there are no carries. With a generator of degree r (r + 1 bits):

1. Append r zeros to the data.
2. Divide by the generator using XOR; the remainder has r bits.
3. Replace the appended zeros with the remainder and send this **codeword**.
4. The receiver divides the codeword by the same generator; a remainder of zero means no error was detected.

**Worked example.** Data 11010110, generator 1011 (degree 3), so three zeros are appended.

@figure crc-division

The remainder is **111**, so the codeword is **11010110111**. Dividing 11010110111 by 1011 leaves 000, so the receiver accepts it. If the fourth bit flips in transit (11000110111), the remainder is 001, not zero, and the error is detected. The program below runs the same division.

```cpp
#include <iostream>
#include <string>
using namespace std;

string remainderOf(string work, const string& generator) {
    size_t n = generator.size() - 1;
    for (size_t i = 0; i + n < work.size(); i++) {
        if (work[i] == '1') {
            for (size_t j = 0; j < generator.size(); j++)
                work[i + j] = work[i + j] == generator[j] ? '0' : '1';
        }
    }
    return work.substr(work.size() - n);
}

int main() {
    string data = "11010110", generator = "1011";
    string remainder = remainderOf(data + string(generator.size() - 1, '0'), generator);
    string codeword = data + remainder;
    string corrupted = codeword;
    corrupted[3] = corrupted[3] == '0' ? '1' : '0';
    cout << "data       " << data << "\n";
    cout << "generator  " << generator << "\n";
    cout << "remainder  " << remainder << "\n";
    cout << "codeword   " << codeword << "\n";
    cout << "check      " << remainderOf(codeword, generator) << "\n";
    cout << "corrupted  " << corrupted << " -> " << remainderOf(corrupted, generator) << "\n";
    return 0;
}
```

```java
public class Main {
    static String remainderOf(String dividend, String generator) {
        char[] work = dividend.toCharArray();
        int n = generator.length() - 1;
        for (int i = 0; i + n < work.length; i++) {
            if (work[i] == '1') {
                for (int j = 0; j < generator.length(); j++)
                    work[i + j] = work[i + j] == generator.charAt(j) ? '0' : '1';
            }
        }
        return new String(work, work.length - n, n);
    }

    public static void main(String[] args) {
        String data = "11010110", generator = "1011";
        String remainder = remainderOf(data + "0".repeat(generator.length() - 1), generator);
        String codeword = data + remainder;
        char[] bits = codeword.toCharArray();
        bits[3] = bits[3] == '0' ? '1' : '0';
        String corrupted = new String(bits);
        System.out.println("data       " + data);
        System.out.println("generator  " + generator);
        System.out.println("remainder  " + remainder);
        System.out.println("codeword   " + codeword);
        System.out.println("check      " + remainderOf(codeword, generator));
        System.out.println("corrupted  " + corrupted + " -> " + remainderOf(corrupted, generator));
    }
}
```

```python
def remainder_of(dividend, generator):
    work = list(dividend)
    n = len(generator) - 1
    for i in range(len(work) - n):
        if work[i] == "1":
            for j, g in enumerate(generator):
                work[i + j] = "0" if work[i + j] == g else "1"
    return "".join(work[-n:])


data, generator = "11010110", "1011"
remainder = remainder_of(data + "0" * (len(generator) - 1), generator)
codeword = data + remainder
corrupted = codeword[:3] + ("1" if codeword[3] == "0" else "0") + codeword[4:]
print("data       " + data)
print("generator  " + generator)
print("remainder  " + remainder)
print("codeword   " + codeword)
print("check      " + remainder_of(codeword, generator))
print("corrupted  " + corrupted + " -> " + remainder_of(corrupted, generator))
```

```javascript
function remainderOf(dividend, generator) {
  const work = dividend.split("");
  const n = generator.length - 1;
  for (let i = 0; i + n < work.length; i++) {
    if (work[i] === "1") {
      for (let j = 0; j < generator.length; j++) work[i + j] = work[i + j] === generator[j] ? "0" : "1";
    }
  }
  return work.slice(work.length - n).join("");
}

const data = "11010110";
const generator = "1011";
const remainder = remainderOf(data + "0".repeat(generator.length - 1), generator);
const codeword = data + remainder;
const corrupted = codeword.slice(0, 3) + (codeword[3] === "0" ? "1" : "0") + codeword.slice(4);
console.log("data       " + data);
console.log("generator  " + generator);
console.log("remainder  " + remainder);
console.log("codeword   " + codeword);
console.log("check      " + remainderOf(codeword, generator));
console.log("corrupted  " + corrupted + " -> " + remainderOf(corrupted, generator));
```

```output
data       11010110
generator  1011
remainder  111
codeword   11010110111
check      000
corrupted  11000110111 -> 001
```

A generator of degree r with a non-zero constant term detects every burst error of length r or less, and one with x + 1 as a factor detects every odd number of bit errors. Longer bursts slip through only with probability about 2^−r, which is why Ethernet's 32-bit CRC is so strong.

## Error correction: Hamming code

To correct one bit among m data bits, r check bits are needed with **2^r ≥ m + r + 1**. For m = 4 that gives r = 3, the Hamming(7,4) code. Check bits sit at the positions that are powers of 2 (1, 2, 4); check bit p covers every position whose binary number has that bit set.

**Encode 1011 with even parity, then correct an error.**

@figure hamming

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Role | p1 | p2 | d1 | p4 | d2 | d3 | d4 |
| Bit | 0 | 1 | 1 | 0 | 0 | 1 | 1 |

The codeword is **0110011**. If 0110001 arrives instead, the rechecks give c1 = 0, c2 = 1 and c4 = 1, and c4 c2 c1 = 110 = **6** is the position to flip back. Hamming(7,4) has a minimum distance of 3, so it corrects one error or detects two (detecting d errors needs distance d + 1; correcting t needs 2t + 1).

## Flow control: stop-and-wait and sliding windows

With **stop-and-wait**, the sender sends one frame and waits for its acknowledgement (ARQ, automatic repeat request, resends on timeout). With transmission time Tt and propagation delay Tp, its efficiency is Tt / (Tt + 2Tp) = 1 / (1 + 2a), where a = Tp / Tt.

**Worked example.** 1,000-bit frames on a 1 Mbps link give Tt = 1 ms; with Tp = 10 ms, a = 10 and efficiency = 1 / 21, about 4.8 per cent. A sliding window of N frames gives N / (1 + 2a), so 21 frames in flight keep the link fully busy. With m-bit sequence numbers, Go-Back-N allows a window of at most 2^m − 1, so it needs m = 5 (window up to 31); Selective Repeat allows at most 2^(m−1), so it needs m = 6 (window up to 32).

| Aspect | Stop-and-wait | Go-Back-N | Selective Repeat |
| --- | --- | --- | --- |
| Sender window | 1 | Up to 2^m − 1 | Up to 2^(m−1) |
| Receiver window | 1 | 1 | Same as the sender's |
| Out-of-order frames | Not applicable | Discarded | Buffered |
| After a lost frame | Resend it | Resend it and every frame sent after it | Resend only that frame |
| Acknowledgements | One per frame | Cumulative | Individual, often with NAKs |
| Efficiency | Low on long links | High, but errors waste bandwidth | Highest |
| Complexity | Lowest | Moderate | Highest (buffering and reordering) |

@figure arq-loss

Stop-and-wait needs just 1-bit sequence numbers (0 and 1), so it is also called the alternating bit protocol.

## MAC addresses and ARP

A **MAC address** is 48 bits, written as six hexadecimal bytes such as 00:1A:2B:3C:4D:5E. The first three bytes are the manufacturer's **OUI** (organisationally unique identifier). FF:FF:FF:FF:FF:FF is the broadcast address. MAC addresses are flat and identify an interface on its local link; IP addresses are hierarchical and identify where it sits in the internet.

**ARP** maps an IPv4 address to a MAC address on the local network. When 192.168.1.10 wants to send to 192.168.1.20:

1. It checks its ARP cache; on a miss it broadcasts a request to FF:FF:FF:FF:FF:FF: "Who has 192.168.1.20? Tell 192.168.1.10", including its own MAC address.
2. Only 192.168.1.20 replies, with a unicast frame carrying its MAC address.
3. The sender caches the answer for a few minutes and sends its frame.

If the destination is on another network (say 8.8.8.8), the host never ARPs for it: it ARPs for its **default gateway** and sends the frame to the router's MAC address, with the IP packet still addressed to 8.8.8.8. A **gratuitous ARP** announces a host's own mapping, to detect duplicate addresses or update caches after a failover.

## The Ethernet frame

@figure ethernet-frame

The preamble and start frame delimiter (SFD) only synchronise the receiver. EtherType names the payload (0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP), and a frame runs from **64 to 1,518 bytes**; a payload shorter than 46 bytes is padded.

## Medium access: CSMA/CD vs CSMA/CA

**CSMA/CD** (carrier sense multiple access with collision detection) was classic half-duplex Ethernet's method: listen until the cable is idle, transmit while listening, and on a collision stop, send a jam signal and back off. After the n-th collision, a station waits K slot times (512 bit times), with K picked at random from 0 to 2^min(n, 10) − 1, and it gives up after 16 attempts. A sender must still be transmitting when news of a collision returns, so Tt ≥ 2Tp and the minimum frame is L = 2 × Tp × R: with Tp = 25.6 µs at 10 Mbps, L = 512 bits = 64 bytes.

@figure collision-window

Full-duplex switched Ethernet has no collisions, so CSMA/CD is unused there.

**CSMA/CA** (collision avoidance) is Wi-Fi's method. A radio cannot hear others while transmitting, and two stations may each hear the access point but not each other (the hidden terminal problem), so collisions cannot be detected. A station waits for the medium to be idle for a gap called DIFS plus a random backoff, then sends; the receiver acknowledges after a shorter gap (SIFS). No acknowledgement means a collision, so the station doubles its backoff range and retries. An optional RTS/CTS exchange reserves the medium first.

| Aspect | CSMA/CD | CSMA/CA |
| --- | --- | --- |
| Used by | Classic half-duplex Ethernet | Wi-Fi (802.11) |
| Strategy | Detect collisions and recover | Avoid collisions before sending |
| Collision detection | Listens while transmitting | Not possible; a missing ACK implies one |
| Layer 2 ACKs | None | Every unicast frame |
| Backoff | After a collision | Before sending and after a failure |
| Extras | Jam signal, 64-byte minimum frame | Inter-frame gaps, optional RTS/CTS |

## Common mistakes

- In CRC, forgetting to append r zeros (r = generator bits − 1), or subtracting with borrows instead of XOR.
- Saying parity detects all errors: it misses every even number of flipped bits.
- Giving Go-Back-N and Selective Repeat the same window limit: 2^m − 1 versus 2^(m−1).
- ARPing for a remote host's IP address: the host resolves its gateway's MAC address.
- Counting the preamble in Ethernet's 64-byte minimum frame.
- Saying Wi-Fi uses CSMA/CD.

## Interview questions

**Why does the receiver get a zero remainder when it divides a CRC codeword?**
The sender appended the remainder of dividing the shifted data by the generator. In modulo-2 arithmetic adding and subtracting are both XOR, so the codeword equals the shifted data minus its remainder, an exact multiple of the generator. Any error that is not itself a multiple of the generator leaves a non-zero remainder.

**How many check bits does a Hamming code need for 7 data bits?**
Four, because the smallest r with 2^r ≥ 7 + r + 1 is 4 (16 ≥ 12, while 8 is less than 11). The code is Hamming(11,7), with check bits at positions 1, 2, 4 and 8.

**Why must Selective Repeat's window be at most half the sequence space?**
If the window were larger, after a batch of lost acknowledgements the receiver could not tell retransmitted old frames from new frames that reuse the same sequence numbers. Keeping the window at 2^(m−1) makes the old and new windows never overlap.

**What is the minimum frame size in Ethernet, and why?**
64 bytes, from destination address to FCS. With CSMA/CD a station must still be transmitting when a collision from the far end of the longest allowed cable comes back, so a frame must last at least one round-trip time: 512 bit times at 10 Mbps.

**What does a switch do with a frame for an unknown MAC address?**
It floods the frame out of every port except the one it arrived on. It learns addresses by recording the source MAC address of every frame against its incoming port, so once the destination replies, later frames go only to the right port.

**Why can't Wi-Fi use collision detection?**
A transmitting radio's own signal drowns out anything it might hear, and with hidden terminals the colliding station may be out of range entirely. So Wi-Fi avoids collisions with waiting gaps, random backoff and optional RTS/CTS, and uses acknowledgements to discover failures.

Next, read [NAT, DHCP and ports](/notes/computer-networks/nat-dhcp-and-ports), and test the arithmetic with the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
