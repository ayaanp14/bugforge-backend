---
title: NAT, DHCP and Ports
order: 10
minutes: 11
level: beginner
updated: 2026-10-05
seo-title: NAT, DHCP and Port Numbers in Computer Networks
description: Well-known port numbers, sockets, how NAT and PAT translate private addresses with a worked translation table, DHCP's DORA process step by step, and APIPA.
question: What is NAT and why is it used?
answer: NAT (Network Address Translation) lets many devices with private IP addresses share one or a few public addresses. A NAT router rewrites the source address, and in PAT also the source port, of every outgoing packet and records the change in a translation table, so replies can be sent back to the right device. It conserves scarce IPv4 addresses and hides the inside network's layout.
q: What are well-known port numbers?
a: Ports 0 to 1023 are the well-known ports, assigned by IANA to standard services: 22 for SSH, 25 for SMTP, 53 for DNS, 80 for HTTP and 443 for HTTPS, among others. On Unix-like systems a program usually needs administrator rights to listen on one of them.
q: What is the difference between NAT and PAT?
a: Basic NAT maps private addresses to public addresses one to one, so it needs as many public addresses as there are simultaneous inside hosts. PAT (port address translation, also called NAPT or NAT overload) maps many private addresses to one public address and tells the connections apart by giving each its own public port.
q: What is the DORA process in DHCP?
a: DORA is the four-message exchange by which a client gets an address: Discover (the client broadcasts to find servers), Offer (a server proposes an address and settings), Request (the client broadcasts which offer it accepts) and Acknowledge (the server confirms the lease). The client then configures the address for the lease time.
q: Which ports does DHCP use?
a: DHCP runs over UDP. Servers listen on port 67 and clients on port 68. A client with no address yet sends from 0.0.0.0 port 68 to the broadcast address 255.255.255.255 port 67.
q: What is a socket in networking?
a: A socket is one endpoint of a network conversation, identified by an IP address and a port number together with the protocol. A TCP connection is the pair of sockets at its two ends, so it is uniquely identified by source address, source port, destination address and destination port.
q: What does a 169.254.x.x IP address mean?
a: It is a link-local address the device gave itself through APIPA because no DHCP server answered. It can talk only to other devices on the same local link that also use such addresses and has no default gateway, so seeing it usually means DHCP has failed.
---

Three everyday mechanisms sit between an IP address and a working application. Port numbers tell a host which program a packet is for. DHCP hands a new device its address, gateway and DNS servers the moment it joins a network. NAT lets a whole home or office share one public IPv4 address. All three appear in every "how does the internet work" interview and in any real troubleshooting session, so this note works through each with concrete numbers.

## Port numbers

An IP address identifies a host; a **port number** (16 bits, 0 to 65,535) identifies a process on that host. Servers listen on fixed, published ports so clients know where to connect; clients use a temporary **ephemeral port** chosen by their operating system for each connection.

| Range | Name | Examples |
| --- | --- | --- |
| 0 to 1023 | Well-known (system) ports | 22, 53, 80, 443 |
| 1024 to 49151 | Registered ports | 3306, 5432, 8080 |
| 49152 to 65535 | Dynamic or private (ephemeral) ports | Client source ports, as IANA defines them; Linux uses 32768 to 60999 by default |

### The ports worth memorising

| Port | Protocol | Transport | Used for |
| --- | --- | --- | --- |
| 20, 21 | FTP | TCP | File transfer: 21 for commands, 20 for data in active mode |
| 22 | SSH (also SFTP and SCP) | TCP | Encrypted remote login and file copy |
| 23 | Telnet | TCP | Unencrypted remote login (avoid) |
| 25 | SMTP | TCP | Mail transfer between servers |
| 53 | DNS | UDP and TCP | Name resolution |
| 67, 68 | DHCP | UDP | 67 server, 68 client |
| 69 | TFTP | UDP | Trivial file transfer, used for network booting |
| 80 | HTTP | TCP | Web |
| 110 | POP3 | TCP | Downloading mail |
| 123 | NTP | UDP | Clock synchronisation |
| 143 | IMAP | TCP | Reading mail kept on the server |
| 161, 162 | SNMP | UDP | Network management; 162 receives traps |
| 443 | HTTPS | TCP (UDP for HTTP/3) | Secure web |
| 587 | SMTP submission | TCP | Mail clients sending mail |
| 993, 995 | IMAPS, POP3S | TCP | IMAP and POP3 over TLS |
| 3306 | MySQL | TCP | Database |
| 3389 | RDP | TCP | Windows Remote Desktop |
| 5432 | PostgreSQL | TCP | Database |
| 6379 | Redis | TCP | In-memory data store |
| 8080 | HTTP alternate | TCP | Development servers and proxies |

The last five are registered rather than well-known ports, listed because they come up constantly in backend and placement interviews.

## Sockets

A **socket** is an endpoint: protocol plus IP address plus port. A TCP connection is identified by its two endpoints, the **4-tuple** (source IP, source port, destination IP, destination port), or the 5-tuple if the protocol is counted. That is why one server port can carry thousands of connections: every client brings a different address or source port.

The server side of a TCP socket in C (display only):

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);           /* a TCP socket */
struct sockaddr_in addr = {0};
addr.sin_family = AF_INET;
addr.sin_port = htons(8080);                         /* port in network byte order */
addr.sin_addr.s_addr = htonl(INADDR_ANY);            /* every local interface */
bind(fd, (struct sockaddr *)&addr, sizeof addr);     /* claim port 8080 */
listen(fd, 16);                                      /* queue up to 16 pending connections */
int conn = accept(fd, NULL, NULL);                   /* a new socket for this client */
```

The client calls `socket` and then `connect` with the server's address and port; its operating system picks the ephemeral source port. `accept` returns a **new socket** for each client, all sharing the server's port 8080 but each with its own 4-tuple, while the listening socket keeps waiting for more.

## NAT: network address translation

IPv4 has about 4.3 billion addresses, far fewer than the devices that use them. NAT lets an entire private network (addresses from 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16, see [IP addressing](/notes/computer-networks/ip-addressing-and-subnetting)) reach the internet through one public address. The NAT router rewrites addresses on the way out, remembers each rewrite, and reverses it for the replies.

| Type | Mapping | Typical use |
| --- | --- | --- |
| Static NAT | One private address to one public address, permanently | A server inside that must be reachable from outside |
| Dynamic NAT | Private addresses to a pool of public addresses, on demand | Rare today; hosts are refused when the pool runs out |
| PAT (NAPT, "NAT overload") | Many private addresses to one public address, distinguished by port | Almost every home and office router |

### Worked example: a PAT translation table

A home network uses 192.168.1.0/24 and the router's public address is 203.0.113.5. Three connections leave the network:

| Inside source (private) | Translated source (public) | Destination |
| --- | --- | --- |
| 192.168.1.10:51000 | 203.0.113.5:40001 | 198.51.100.20:443 |
| 192.168.1.11:51000 | 203.0.113.5:40002 | 198.51.100.20:443 |
| 192.168.1.10:51001 | 203.0.113.5:40003 | 198.51.100.30:80 |

Two laptops happened to pick the same source port, 51000, for the same server; the router gives them different public ports (40001 and 40002), so their replies cannot be confused. How the public port is chosen varies by router: many keep the original port when it is free.

Now a reply arrives from 198.51.100.20:443 addressed to 203.0.113.5:40002. The router finds 40002 in its table, rewrites the destination to **192.168.1.11:51000** and forwards it. A packet that arrives for 203.0.113.5:50000, which matches no entry, is **dropped**. Every rewrite also means updating the IP header checksum and the TCP or UDP checksum, because both cover the addresses.

**Port forwarding** is a static entry added by hand so that inbound traffic works: "send anything arriving on public port 8443 to 192.168.1.50:443" lets a server inside be reached from outside.

### What NAT breaks

- **End-to-end reachability**: hosts behind NAT cannot accept unsolicited connections without port forwarding. Peer-to-peer applications and video calls use NAT traversal tricks (STUN, hole punching, or relaying through TURN servers).
- **Protocols that carry addresses inside their data**, such as active-mode FTP and SIP, need an application layer gateway in the router to rewrite those too.
- **State**: the router keeps an entry per connection and silently drops idle ones after a timeout.
- **Attribution**: with carrier-grade NAT, thousands of customers share one ISP address, so a public address alone no longer identifies a user.

IPv6 has enough addresses that NAT is unnecessary; firewalls, not address translation, then provide the protection.

## DHCP: Dynamic Host Configuration Protocol

DHCP gives a device everything it needs to join an IP network: an **IP address**, the **subnet mask**, the **default gateway**, the **DNS servers** and a **lease time**, plus optional settings such as the domain name. It runs over UDP, servers on port 67 and clients on port 68.

### The DORA exchange

A laptop with no address joins a network whose DHCP server is 192.168.1.1:

1. **Discover.** The client broadcasts from 0.0.0.0:68 to 255.255.255.255:67, including its MAC address: "Is there a DHCP server?"
2. **Offer.** Each server that hears it offers an address, say 192.168.1.23 with mask 255.255.255.0, gateway 192.168.1.1, DNS servers and a 24-hour lease. The server reserves the address meanwhile.
3. **Request.** The client **broadcasts** a request for the offer it chose, naming that server. It broadcasts rather than unicasts so that any other server that made an offer learns it was declined and can release its reserved address.
4. **Acknowledge.** The chosen server confirms with a DHCPACK. The client often probes the address with ARP first; if another host answers, it sends DHCPDECLINE and starts again. Otherwise it configures the address.

| Message | From and to | Purpose |
| --- | --- | --- |
| DHCPDISCOVER | Client, broadcast | Find servers |
| DHCPOFFER | Server to client | Propose an address and settings |
| DHCPREQUEST | Client, broadcast | Accept one offer (also used to renew) |
| DHCPACK | Server to client | Confirm the lease |
| DHCPNAK | Server to client | Refuse, for example after the client moved subnets |
| DHCPRELEASE | Client to server | Give the address back early |
| DHCPDECLINE | Client to server | The offered address is already in use |

**Leases and renewal.** At T1, by default half the lease, the client sends a unicast DHCPREQUEST to its server to renew. If that fails, at T2, by default 87.5 per cent, it broadcasts the request to any server (rebinding). If the lease expires, it must stop using the address. For a 24-hour lease, T1 falls at 12 hours and T2 at 21 hours.

**Relay agents.** Broadcasts do not cross routers, so a network with one central DHCP server needs a **relay agent** on each subnet's router (on Cisco, the `ip helper-address` command). The relay forwards the client's broadcasts to the server as unicast and records its own interface address, which tells the server which subnet's pool to allocate from.

## APIPA: when DHCP fails

If no DHCP server answers, Windows and many other systems give themselves a **link-local** address from 169.254.0.0/16 (the usable range is 169.254.1.0 to 169.254.254.255), after checking with ARP that no neighbour already uses it. This is **APIPA** (Automatic Private IP Addressing). The host can talk to other link-local hosts on the same network segment but has no gateway, so it cannot reach the internet, and it keeps retrying DHCP in the background. In troubleshooting, a 169.254 address almost always means "the DHCP server is unreachable".

## Common mistakes

- Swapping DHCP's ports: the server listens on 67 and the client on 68.
- Saying the DHCP Request is unicast during DORA: it is broadcast, so the other servers can withdraw their offers.
- Treating NAT as a firewall feature by design: dropping unsolicited packets is a side effect of having no table entry, not a security policy.
- Saying a server needs a new port per client: every connection shares the listening port and differs in the client's address or port.
- Thinking APIPA hosts can reach the internet: they have no gateway and are limited to the local link.
- Calling 3306 or 8080 well-known ports: they are registered ports.

## Interview questions

**What is the difference between a port and a socket?**
A port is just a 16-bit number identifying a service on a host. A socket is a full endpoint, an IP address plus a port for a given protocol, and a TCP connection is defined by the pair of sockets at its two ends.

**How does PAT let fifty devices share one public IP address?**
The router rewrites each outgoing packet's private source address and port to its public address and a unique public port, and stores the mapping. Replies arrive at that public port, and the router uses the table to restore the original private address and port.

**Why is the DHCP Request message broadcast?**
Several servers may have made offers and reserved addresses for the client. Broadcasting the request, with the chosen server's identifier in it, tells every server at once which offer was accepted, so the others can return their reserved addresses to the pool.

**How does a host on a subnet without a DHCP server still get an address?**
A DHCP relay agent, usually configured on the subnet's router, picks up the client's broadcasts and forwards them as unicast to the central server. It adds its own interface address so the server allocates from the right subnet's pool.

**What happens when a DHCP lease expires?**
Before that point the client tries to renew at T1 (half the lease) with its own server and at T2 (87.5 per cent) with any server. If neither succeeds before expiry, the client must stop using the address and start again with a Discover.

**Can two programs listen on the same port at the same time?**
Normally no: binding a second socket to the same protocol, address and port fails with "address already in use". TCP port 53 and UDP port 53 are different sockets, so a DNS server uses both, and options such as Linux's SO_REUSEPORT let cooperating processes share one port.

**Why does NAT cause trouble for peer-to-peer applications?**
Each peer is behind its own NAT with no public port open for unsolicited packets, so neither can simply connect to the other. Applications learn their public address and port with STUN, try to open matching mappings from both sides at once (hole punching), and fall back to relaying through a TURN server.

Next, read [what happens when you type a URL](/notes/computer-networks/what-happens-when-you-type-a-url), and test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
