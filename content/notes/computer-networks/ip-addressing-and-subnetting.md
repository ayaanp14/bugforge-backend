---
title: IP Addressing and Subnetting
order: 4
minutes: 13
level: intermediate
updated: 2026-10-05
seo-title: IP Addressing and Subnetting with Worked Examples
description: IPv4 addresses, classes A to E, private ranges, CIDR and subnet masks, fully worked subnetting and VLSM examples, supernetting, and IPv4 vs IPv6 compared.
question: What is subnetting in computer networks?
answer: Subnetting divides one IP network into smaller networks, called subnets, by borrowing host bits for the network part of the address. A subnet mask or CIDR prefix such as /26 says how many leading bits identify the network; the remaining h bits identify hosts. Each subnet has 2^h addresses and 2^h − 2 usable hosts, because the first is the network address and the last is the broadcast address.
q: How many usable hosts are there in a /24 network?
a: 254. A /24 leaves 8 host bits, which give 2^8 = 256 addresses. The first (all host bits 0) is the network address and the last (all host bits 1) is the broadcast address, so 256 − 2 = 254 can be assigned to hosts.
q: What are the private IP address ranges?
a: RFC 1918 reserves three IPv4 blocks for private networks: 10.0.0.0/8 (10.0.0.0 to 10.255.255.255), 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16 (192.168.0.0 to 192.168.255.255). They are not routed on the public internet, so hosts using them reach it through NAT.
q: How do you find the network address from an IP address and subnet mask?
a: Do a bitwise AND of the address and the mask. For 192.168.10.150 with mask 255.255.255.192, only the last octet matters: 150 AND 192 is 10010110 AND 11000000 = 10000000 = 128, so the network address is 192.168.10.128.
q: What is CIDR notation?
a: Classless Inter-Domain Routing writes an address with a slash and the number of network bits, such as 192.168.1.0/24, instead of relying on the address class. Prefixes can be any length, so networks can be sized to need, and contiguous networks can be summarised as one route.
q: What is the difference between IPv4 and IPv6?
a: IPv4 addresses are 32 bits written in dotted decimal, giving about 4.3 billion addresses. IPv6 addresses are 128 bits written in hexadecimal groups separated by colons. IPv6 also has a fixed 40-byte header, no broadcast, no header checksum and built-in address auto-configuration.
q: Why do we subtract 2 when counting usable hosts in a subnet?
a: Two addresses in every subnet are reserved: the one with all host bits 0 names the network itself, and the one with all host bits 1 is the directed broadcast address. The exceptions are /31 point-to-point links, which use both addresses (RFC 3021), and /32, a single host route.
---

Every device on an IP network needs an address so packets can find it, and every router needs a way to tell which addresses live behind which link. An IPv4 address answers both: its leading bits name a network and its trailing bits name a host on that network. Subnetting is the skill of moving that boundary to cut one block of addresses into smaller networks, and it is the arithmetic most often asked on paper in networking interviews. This note works every number out; check them yourself as you read.

## IPv4 address structure

An IPv4 address is **32 bits**, written as four 8-bit octets in decimal separated by dots: 192.168.10.150. Each octet is 0 to 255. There are 2^32 = 4,294,967,296 possible addresses.

Converting an octet to binary uses the place values 128, 64, 32, 16, 8, 4, 2, 1:

| Decimal | Sum of place values | Binary |
| --- | --- | --- |
| 192 | 128 + 64 | 11000000 |
| 150 | 128 + 16 + 4 + 2 | 10010110 |
| 255 | all eight | 11111111 |

An address has two parts: the **network portion** (identical for every host on that network) and the **host portion** (unique per host). Where the split falls is given by the subnet mask.

## Classful addressing: classes A to E

Before 1993, the first bits of an address fixed its class and therefore its network/host split.

| Class | Leading bits | First octet | Default mask | Networks | Usable hosts each | Use |
| --- | --- | --- | --- | --- | --- | --- |
| A | 0 | 0 to 127 | 255.0.0.0 (/8) | 128 (126 usable) | 2^24 − 2 = 16,777,214 | Very large networks |
| B | 10 | 128 to 191 | 255.255.0.0 (/16) | 2^14 = 16,384 | 2^16 − 2 = 65,534 | Medium networks |
| C | 110 | 192 to 223 | 255.255.255.0 (/24) | 2^21 = 2,097,152 | 2^8 − 2 = 254 | Small networks |
| D | 1110 | 224 to 239 | none | none | none | Multicast groups |
| E | 1111 | 240 to 255 | none | none | none | Reserved, experimental |

In class A, network 0 and network 127 are reserved, which is why only 126 class A networks are usable. Classes wasted addresses badly: an organisation needing 300 hosts was too big for a class C and got a class B with 65,534 host addresses. That waste is why CIDR replaced classes.

## Special and private addresses

| Range | Purpose |
| --- | --- |
| 10.0.0.0/8 | Private (10.0.0.0 to 10.255.255.255) |
| 172.16.0.0/12 | Private (172.16.0.0 to 172.31.255.255) |
| 192.168.0.0/16 | Private (192.168.0.0 to 192.168.255.255) |
| 127.0.0.0/8 | Loopback: 127.0.0.1 means "this machine" and never leaves it |
| 169.254.0.0/16 | Link-local (APIPA): self-assigned when DHCP fails |
| 0.0.0.0 | "This host" before it has an address; 0.0.0.0/0 is the default route |
| 255.255.255.255 | Limited broadcast: every host on the local network |
| 224.0.0.0/4 | Multicast (class D) |
| 100.64.0.0/10 | Shared space for carrier-grade NAT inside ISPs |

Private addresses (RFC 1918) can be reused by any organisation because they are never routed on the public internet; a router doing [NAT](/notes/computer-networks/nat-dhcp-and-ports) translates them to a public address on the way out.

## Subnet masks and CIDR

A **subnet mask** is 32 bits with 1s for the network part and 0s for the host part. **CIDR** (Classless Inter-Domain Routing, 1993) writes the number of 1s as a prefix length: 255.255.255.192 is /26 because 11111111.11111111.11111111.11000000 has 26 ones. With h = 32 − prefix host bits:

- addresses per subnet = 2^h, usable hosts = 2^h − 2;
- borrowing s bits from the host part creates 2^s subnets;
- **block size** = 256 − (mask value in the octet where the boundary falls). Subnets start at multiples of it.

| Prefix | Mask | Host bits | Addresses | Usable hosts | Block size |
| --- | --- | --- | --- | --- | --- |
| /8 | 255.0.0.0 | 24 | 16,777,216 | 16,777,214 | 1 in octet 1 |
| /16 | 255.255.0.0 | 16 | 65,536 | 65,534 | 1 in octet 2 |
| /20 | 255.255.240.0 | 12 | 4,096 | 4,094 | 16 in octet 3 |
| /24 | 255.255.255.0 | 8 | 256 | 254 | 1 in octet 3 |
| /25 | 255.255.255.128 | 7 | 128 | 126 | 128 in octet 4 |
| /26 | 255.255.255.192 | 6 | 64 | 62 | 64 in octet 4 |
| /27 | 255.255.255.224 | 5 | 32 | 30 | 32 in octet 4 |
| /28 | 255.255.255.240 | 4 | 16 | 14 | 16 in octet 4 |
| /29 | 255.255.255.248 | 3 | 8 | 6 | 8 in octet 4 |
| /30 | 255.255.255.252 | 2 | 4 | 2 | 4 in octet 4 |

## Worked example: four subnets from 192.168.10.0/24

**Task.** Split 192.168.10.0/24 into four equal subnets and give each one's network address, host range and broadcast address.

1. Subnets needed: 4. Borrow s bits so that 2^s ≥ 4, so s = 2.
2. New prefix: 24 + 2 = /26. Mask: the last octet is 11000000 = 192, so 255.255.255.192.
3. Host bits: h = 32 − 26 = 6. Addresses per subnet 2^6 = 64; usable hosts 64 − 2 = 62.
4. Block size: 256 − 192 = 64, so the subnets start at .0, .64, .128 and .192.

| Subnet | Network address | First host | Last host | Broadcast | Usable hosts |
| --- | --- | --- | --- | --- | --- |
| 1 | 192.168.10.0/26 | 192.168.10.1 | 192.168.10.62 | 192.168.10.63 | 62 |
| 2 | 192.168.10.64/26 | 192.168.10.65 | 192.168.10.126 | 192.168.10.127 | 62 |
| 3 | 192.168.10.128/26 | 192.168.10.129 | 192.168.10.190 | 192.168.10.191 | 62 |
| 4 | 192.168.10.192/26 | 192.168.10.193 | 192.168.10.254 | 192.168.10.255 | 62 |

Check: each broadcast is one less than the next network address, and 4 × 64 = 256 covers the whole /24.

### Which subnet does 192.168.10.150/26 belong to?

AND the address with the mask; only the last octet changes.

| | Dotted decimal | Last octet in binary |
| --- | --- | --- |
| Address | 192.168.10.150 | 10010110 |
| Mask | 255.255.255.192 | 11000000 |
| Address AND mask = network | 192.168.10.128 | 10000000 |
| Host bits all 1 = broadcast | 192.168.10.191 | 10111111 |

So the host is in subnet 3: hosts .129 to .190, broadcast .191. The shortcut gives the same answer: 150 lies between the block starts 128 and 192, so the network is .128.

### A prefix off the octet boundary: 172.16.45.200/20

1. /20 means the boundary falls inside the third octet: 20 = 8 + 8 + 4, so the third octet of the mask is 11110000 = 240. Mask: 255.255.240.0.
2. Block size in the third octet: 256 − 240 = 16. Blocks start at 0, 16, 32, 48 …
3. The third octet 45 lies in the block 32 to 47 (in binary, 00101101 AND 11110000 = 00100000 = 32).
4. Network 172.16.32.0, broadcast 172.16.47.255 (third octet 47, fourth octet all 1s).
5. First host 172.16.32.1, last host 172.16.47.254, usable hosts 2^12 − 2 = 4,094.

### The same calculation as a program

The program converts the address to a 32-bit number, builds the mask from the prefix, and gets the network with AND and the broadcast with OR of the inverted mask.

```cpp
#include <cstdint>
#include <cstdio>
#include <string>

uint64_t toInt(const std::string& ip) {
    uint64_t n = 0, part = 0;
    for (char c : ip + ".") {
        if (c == '.') { n = (n << 8) | part; part = 0; }
        else part = part * 10 + (c - '0');
    }
    return n;
}

std::string toIp(uint64_t n) {
    return std::to_string((n >> 24) & 255) + "." + std::to_string((n >> 16) & 255) + "." +
           std::to_string((n >> 8) & 255) + "." + std::to_string(n & 255);
}

void describe(const std::string& cidr) {
    size_t slash = cidr.find('/');
    int prefix = std::stoi(cidr.substr(slash + 1));
    uint64_t mask = (0xFFFFFFFFull << (32 - prefix)) & 0xFFFFFFFFull;
    uint64_t network = toInt(cidr.substr(0, slash)) & mask;
    uint64_t broadcast = network | (~mask & 0xFFFFFFFFull);
    std::string rows[6][2] = {
        {"mask", toIp(mask)},
        {"network", toIp(network)},
        {"broadcast", toIp(broadcast)},
        {"first host", toIp(network + 1)},
        {"last host", toIp(broadcast - 1)},
        {"hosts", std::to_string((1ull << (32 - prefix)) - 2)},
    };
    std::printf("%s\n", cidr.c_str());
    for (auto& row : rows) std::printf("  %-11s%s\n", row[0].c_str(), row[1].c_str());
}

int main() {
    describe("192.168.10.150/26");
    describe("172.16.45.200/20");
    return 0;
}
```

```java
public class Main {
    static long toLong(String ip) {
        long n = 0;
        for (String part : ip.split("[.]")) n = (n << 8) | Long.parseLong(part);
        return n;
    }

    static String toIp(long n) {
        return ((n >> 24) & 255) + "." + ((n >> 16) & 255) + "." + ((n >> 8) & 255) + "." + (n & 255);
    }

    static void describe(String cidr) {
        String[] parts = cidr.split("/");
        int prefix = Integer.parseInt(parts[1]);
        long mask = (0xFFFFFFFFL << (32 - prefix)) & 0xFFFFFFFFL;
        long network = toLong(parts[0]) & mask;
        long broadcast = network | (~mask & 0xFFFFFFFFL);
        String[][] rows = {
            {"mask", toIp(mask)},
            {"network", toIp(network)},
            {"broadcast", toIp(broadcast)},
            {"first host", toIp(network + 1)},
            {"last host", toIp(broadcast - 1)},
            {"hosts", String.valueOf((1L << (32 - prefix)) - 2)},
        };
        System.out.println(cidr);
        for (String[] row : rows) System.out.println(String.format("  %-11s%s", row[0], row[1]));
    }

    public static void main(String[] args) {
        describe("192.168.10.150/26");
        describe("172.16.45.200/20");
    }
}
```

```python
def to_int(ip):
    a, b, c, d = (int(x) for x in ip.split("."))
    return (a << 24) | (b << 16) | (c << 8) | d


def to_ip(n):
    return ".".join(str((n >> shift) & 255) for shift in (24, 16, 8, 0))


def describe(cidr):
    ip, prefix = cidr.split("/")
    prefix = int(prefix)
    mask = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF
    network = to_int(ip) & mask
    broadcast = network | (~mask & 0xFFFFFFFF)
    rows = [
        ("mask", to_ip(mask)),
        ("network", to_ip(network)),
        ("broadcast", to_ip(broadcast)),
        ("first host", to_ip(network + 1)),
        ("last host", to_ip(broadcast - 1)),
        ("hosts", 2 ** (32 - prefix) - 2),
    ]
    print(cidr)
    for label, value in rows:
        print(f"  {label:<11}{value}")


for cidr in ["192.168.10.150/26", "172.16.45.200/20"]:
    describe(cidr)
```

```javascript
function toInt(ip) {
  return ip.split(".").reduce((n, part) => ((n << 8) | Number(part)) >>> 0, 0);
}

function toIp(n) {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 255).join(".");
}

function describe(cidr) {
  const [ip, bits] = cidr.split("/");
  const prefix = Number(bits);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (toInt(ip) & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const rows = [
    ["mask", toIp(mask)],
    ["network", toIp(network)],
    ["broadcast", toIp(broadcast)],
    ["first host", toIp(network + 1)],
    ["last host", toIp(broadcast - 1)],
    ["hosts", 2 ** (32 - prefix) - 2],
  ];
  console.log(cidr);
  for (const [label, value] of rows) console.log("  " + label.padEnd(11) + value);
}

for (const cidr of ["192.168.10.150/26", "172.16.45.200/20"]) describe(cidr);
```

```output
192.168.10.150/26
  mask       255.255.255.192
  network    192.168.10.128
  broadcast  192.168.10.191
  first host 192.168.10.129
  last host  192.168.10.190
  hosts      62
172.16.45.200/20
  mask       255.255.240.0
  network    172.16.32.0
  broadcast  172.16.47.255
  first host 172.16.32.1
  last host  172.16.47.254
  hosts      4094
```

## VLSM: subnets of different sizes

Equal subnets waste addresses when needs differ. **Variable Length Subnet Masking** gives each subnet the smallest prefix that fits, allocating the **largest first** so every block stays aligned.

**Task.** From 192.168.10.0/24, serve a LAN of 100 hosts, a LAN of 50, a LAN of 20 and a point-to-point router link needing 2.

| Need | Smallest fit | Prefix | Network | Usable range | Broadcast |
| --- | --- | --- | --- | --- | --- |
| 100 hosts | 2^7 − 2 = 126 | /25 | 192.168.10.0 | .1 to .126 | .127 |
| 50 hosts | 2^6 − 2 = 62 | /26 | 192.168.10.128 | .129 to .190 | .191 |
| 20 hosts | 2^5 − 2 = 30 | /27 | 192.168.10.192 | .193 to .222 | .223 |
| 2 hosts | 2^2 − 2 = 2 | /30 | 192.168.10.224 | .225 to .226 | .227 |

Addresses 192.168.10.228 to .255 stay free for later. With equal /26 subnets, the 100-host LAN would not have fitted at all.

## Supernetting (route aggregation)

Supernetting is the reverse: combining contiguous networks into one shorter prefix so a router advertises one route instead of many. The four networks 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24 and 192.168.3.0/24 have third octets 000000**00**, 000000**01**, 000000**10** and 000000**11**: the first 22 bits are shared, so they summarise as **192.168.0.0/22**. The networks must be contiguous, their count must be a power of 2, and the first network must start on a multiple of the block (here the third octet 0 is a multiple of 4). 192.168.1.0 to 192.168.4.0 cannot form one /22, because 1 is not a multiple of 4.

## IPv4 vs IPv6

IPv4's 4.3 billion addresses ran out (IANA handed out its last free /8 blocks in 2011), and NAT has stretched them since. IPv6 is the long-term fix.

| Aspect | IPv4 | IPv6 |
| --- | --- | --- |
| Address length | 32 bits | 128 bits |
| Address space | 2^32, about 4.3 × 10^9 | 2^128, about 3.4 × 10^38 |
| Notation | Dotted decimal: 192.168.1.10 | Eight hex groups with colons: 2001:db8::1 |
| Header | 20 to 60 bytes, with options | 40 bytes fixed, plus chained extension headers |
| Header checksum | Yes | No |
| Fragmentation | Sender and routers | Sender only |
| Broadcast | Yes | No: multicast and anycast instead |
| Configuration | Manual or DHCP | SLAAC auto-configuration, DHCPv6 or manual |
| Finding a MAC address | ARP | Neighbour Discovery (ICMPv6) |
| Loopback | 127.0.0.1 | ::1 |

IPv6 shortening rules: drop leading zeros in each group, then replace **one** run of all-zero groups with `::`. So 2001:0db8:0000:0000:0000:0000:0000:0001 becomes 2001:db8:0:0:0:0:0:1 and then 2001:db8::1. Using `::` twice would make the address ambiguous.

## Common mistakes

- Using 2^h for usable hosts: subtract 2 (network and broadcast), except on /31 and /32.
- Treating a host address as a network address: 192.168.10.100/26 is a host in 192.168.10.64/26, not a network.
- Mixing the old rule of 2^s − 2 subnets (no "subnet zero") with the modern 2^s; say which you use.
- Calling 172.32.0.1 private: the 172.16.0.0/12 range ends at 172.31.255.255.
- Forgetting VLSM order: allocate the largest subnet first, or blocks end up misaligned.
- Writing `::` twice in an IPv6 address.

## Interview questions

**Find the network, broadcast and host range of 192.168.1.77/27.**
/27 leaves 5 host bits, so the block size is 32 and subnets start at .0, .32, .64, .96. 77 lies between 64 and 95, so the network is 192.168.1.64, the broadcast 192.168.1.95, and hosts .65 to .94, which is 30 usable addresses.

**How many subnets and hosts per subnet do you get by dividing a /24 into /28s?**
Four bits are borrowed, giving 2^4 = 16 subnets. Each has 4 host bits: 16 addresses and 14 usable hosts.

**Why was CIDR introduced?**
Classful addressing wasted addresses (class B was too big for most and class C too small) and filled routing tables with one entry per class C network. CIDR allows any prefix length and lets contiguous blocks be advertised as one aggregate route.

**What is the difference between a public and a private IP address?**
A public address is globally unique and routable on the internet. A private address (10/8, 172.16/12, 192.168/16) is reused inside many organisations and is not routed publicly, so traffic to the internet passes through NAT, which swaps it for a public address.

**What is 127.0.0.1 used for?**
It is the loopback address: packets sent to it never leave the machine. It is used to test the local TCP/IP stack and to reach services running on the same computer, such as a development server on localhost.

**Which prefix would you use on a point-to-point link between two routers?**
Traditionally a /30, which has exactly two usable addresses. RFC 3021 also allows a /31 on point-to-point links, using both addresses since no broadcast is needed, which saves address space.

**How do you shorten an IPv6 address?**
Remove leading zeros in each 16-bit group, then replace the longest single run of consecutive zero groups with `::`, once per address. Each group is four hexadecimal digits, eight groups in all.

Next, read [TCP and UDP](/notes/computer-networks/tcp-and-udp), and test your subnetting with the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
