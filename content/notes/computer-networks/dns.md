---
title: Domain Name System (DNS)
order: 6
minutes: 10
level: beginner
updated: 2026-10-05
seo-title: DNS in Computer Networks: How Name Resolution Works
description: How DNS turns names into IP addresses: the root, TLD and authoritative hierarchy, recursive and iterative lookups step by step, record types, caching and TTL.
question: What is DNS and how does it work?
answer: DNS (Domain Name System) is the internet's distributed directory that translates domain names such as www.example.com into IP addresses. Your computer asks a recursive resolver, which asks a root server, then the top-level domain's servers, then the domain's authoritative server, and caches the answer for its TTL. DNS normally runs over UDP port 53, switching to TCP for large answers and zone transfers.
q: What is the difference between recursive and iterative DNS queries?
a: In a recursive query the server asked must return the final answer, chasing it down itself; your computer sends this kind to its resolver. In an iterative query the server replies with the best it knows, often a referral to other servers, and the asker continues; resolvers query root, TLD and authoritative servers this way.
q: What is the difference between an A record and a CNAME record?
a: An A record maps a name directly to an IPv4 address. A CNAME record says a name is an alias for another name, so the resolver must then look up the target's A or AAAA record. A name that has a CNAME cannot have any other records, so a CNAME cannot sit at a zone's apex.
q: What is TTL in DNS?
a: TTL (time to live) is the number of seconds a resolver may cache a record before asking again. A TTL of 3600 means an answer can be reused for up to an hour. Long TTLs cut lookup traffic and delay; short TTLs let changes, such as a new server address, take effect sooner.
q: How many DNS root servers are there?
a: There are 13 named root server identities, a.root-servers.net to m.root-servers.net, run by 12 independent organisations. Each identity is served from many machines around the world using anycast, so the 13 names stand for far more than 13 physical servers.
q: What is a reverse DNS lookup?
a: It finds the name for an IP address using a PTR record. The address's octets are reversed under in-addr.arpa, so 203.0.113.10 is looked up as 10.113.0.203.in-addr.arpa. Mail servers use reverse lookups to judge senders, and logs use them to show readable host names.
---

Computers route packets by IP address, but people remember names. DNS is the system that maps one to the other, and it runs every time you open a website, send an email or call an API. In the early ARPANET, every host downloaded one shared file of names and addresses; that stopped scaling, and DNS replaced it in the 1980s with a distributed, hierarchical, cached database (its core specification is RFC 1034 and 1035, from 1987). No single server knows every name, yet any name can be found in a handful of queries.

## Why DNS is distributed

DNS does more than turn names into addresses. It also gives one server many names (aliases), tells senders where to deliver a domain's email (MX records), spreads load by returning different addresses to different clients, and holds verification text for services. A single central database would be a single point of failure, a traffic bottleneck and an administrative nightmare. So DNS splits the namespace into **zones**, each managed by its owner's **authoritative name servers**, and lets everyone **cache** answers.

## The DNS hierarchy

Names form a tree read from right to left. A fully qualified domain name (FQDN) ends with a dot for the root: `www.example.com.`

@figure hierarchy

| Level | Example | Who runs its servers |
| --- | --- | --- |
| Root | `.` (the empty label) | 12 organisations run the 13 root server identities, A to M |
| Top-level domain (TLD) | `com`, `org`, `in`, `uk` | Registry operators; `in` is India's country-code TLD |
| Second-level domain | `example.com` | The domain owner, usually through a DNS hosting provider |
| Subdomain (host) | `www.example.com`, `mail.example.com` | The domain owner |

TLDs are generic (gTLDs: `.com`, `.org`, `.net`, and newer ones such as `.app`) or country-code (ccTLDs: `.in`, `.jp`, `.uk`). Each level **delegates** the level below it: the root zone lists the name servers for `com`, the `com` zone lists the name servers for `example.com`, and `example.com`'s own servers hold its records. Each root identity is served from many places at once through **anycast**, where the same IP address is announced from many sites and routing picks the nearest.

## Who takes part in a lookup

- **Stub resolver**: the small DNS client in your operating system. It asks one question and expects a final answer.
- **Recursive resolver**: the server that does the work, run by your ISP, your company or a public service such as 8.8.8.8 or 1.1.1.1. Its address usually arrives through DHCP.
- **Root, TLD and authoritative servers**: each answers only for its own part of the tree.

## Worked example: resolving www.example.com

Assume every cache is empty and the website's address is 203.0.113.10. The browser checks its own cache, then the operating system its cache and the hosts file; all miss, so the stub resolver asks the recursive resolver. A server that does not hold the answer returns a **referral**: the NS records of the servers one level down, plus their IP addresses (called **glue**) so the resolver can reach them.

@figure resolution

| Step | From | To | Reply |
| --- | --- | --- | --- |
| 1 | Browser | Browser and OS caches, hosts file | Miss |
| 2 | Stub resolver | Recursive resolver | Final answer, after steps 3 to 5 |
| 3 | Recursive resolver | Root server | Referral to the `com` servers |
| 4 | Recursive resolver | `com` TLD server | Referral to the `example.com` servers |
| 5 | Recursive resolver | `example.com` authoritative server | A record: 203.0.113.10, TTL 3600 |
| 6 | Recursive resolver | Stub resolver | The answer; both cache it |

Many resolvers send each server only the part of the name it needs (QNAME minimisation), so the root sees "com" rather than the full name.

## Recursive vs iterative queries

| Aspect | Recursive query | Iterative query |
| --- | --- | --- |
| Promise | The server must return the final answer or an error | The server returns the best it has, often a referral |
| Who chases referrals | The server that was asked | The asker |
| Typical pair | Stub resolver to recursive resolver | Recursive resolver to root, TLD and authoritative servers |
| Load on the server asked | Higher | Lower |
| Header flag | RD (recursion desired) set | Referral returned without recursion |

@figure query-kinds

Root and TLD servers never resolve recursively; they would be overwhelmed.

## DNS record types

| Type | Maps | Example |
| --- | --- | --- |
| A | Name to IPv4 address | `www.example.com. A 203.0.113.10` |
| AAAA | Name to IPv6 address | `www.example.com. AAAA 2001:db8::10` |
| CNAME | Alias to canonical name | `blog.example.com. CNAME www.example.com.` |
| MX | Domain to mail server, with a preference (lower is preferred) | `example.com. MX 10 mail.example.com.` |
| NS | Zone to its authoritative name servers | `example.com. NS ns1.example.com.` |
| TXT | Name to free text: SPF, DKIM, site verification | `example.com. TXT "v=spf1 mx -all"` |
| PTR | Address to name, for reverse lookups | `10.113.0.203.in-addr.arpa. PTR www.example.com.` |
| SOA | The zone's administrative data | Primary server, admin mailbox, serial, timers, negative-cache TTL |

Two rules catch people out. A name with a CNAME may have no other records, so the zone apex (`example.com` itself, which must have SOA and NS) cannot be a CNAME. And MX and NS records must point to names with address records, not to aliases. Other types you may meet are SRV (the host and port of a service) and CAA (which certificate authorities may issue for the domain).

### A small zone file

```text
$TTL 3600
example.com.  IN SOA   ns1.example.com. admin.example.com. (
                       2026100501 ; serial
                       7200       ; refresh
                       900        ; retry
                       1209600    ; expire
                       300 )      ; negative-caching TTL
example.com.  IN NS    ns1.example.com.
example.com.  IN NS    ns2.example.com.
example.com.  IN MX    10 mail.example.com.
www           IN A     203.0.113.10
www           IN AAAA  2001:db8::10
blog          IN CNAME www.example.com.
mail          IN A     203.0.113.25
ns1           IN A     203.0.113.53
ns2           IN A     198.51.100.53
```

In the SOA, `admin.example.com.` is the mailbox admin@example.com. Secondary servers copy the zone from the primary and use the **serial** to tell whether it changed; the refresh, retry and expire timers (in seconds) govern how often they check.

## Caching and TTL

Every record carries a **TTL** in seconds. The recursive resolver, the operating system and the browser may reuse an answer until its TTL runs out, and a cached referral lets the resolver skip the levels above it.

@figure caching

With TTL 3600, a change to www's address can take up to an hour to reach users whose resolvers cached the old one. What people call "DNS propagation" is just caches expiring. Before moving a site to a new server, administrators lower the TTL (say, to 300 seconds) a day ahead, so the switch takes effect within minutes.

Failures are cached too: a "no such domain" answer (NXDOMAIN) is kept for the negative-caching time in the zone's SOA, so a typo does not hit the authoritative servers on every retry.

## DNS over UDP and TCP, port 53

- **Queries and answers** normally use **UDP port 53**: one small datagram each way, no handshake. The client retries if no answer arrives.
- Classic DNS limited UDP answers to **512 bytes**. A larger answer comes back truncated (the **TC** flag set) and the client repeats the query over **TCP port 53**. The EDNS(0) extension lets UDP carry larger answers.
- **Zone transfers** from a primary to a secondary server (AXFR for the whole zone, IXFR for changes) use **TCP port 53**.
- Encrypted variants hide queries from on-path observers: DNS over TLS (TCP 853) and DNS over HTTPS (port 443).

```bash
nslookup www.example.com      # quick answer from your configured resolver
dig www.example.com A         # full answer with TTL and header flags
dig +trace www.example.com    # follow the referrals from the root yourself
dig -x 203.0.113.10           # reverse lookup (PTR)
```

Classic DNS answers are not authenticated, which allows **cache poisoning**: an attacker races the real answer with a forged one so the resolver caches a wrong address. Random query IDs and source ports make guessing hard, and **DNSSEC** lets resolvers verify records with digital signatures. See [network security basics](/notes/computer-networks/network-security-basics).

## Common mistakes

- Saying the root servers know every domain's address: they only refer resolvers to the TLD servers.
- Mixing up who sends which query: the stub's query is recursive, the resolver's queries are iterative.
- Saying DNS uses only UDP: TCP is used for zone transfers and truncated answers.
- Putting a CNAME at the zone apex or pointing an MX record at a CNAME.
- Thinking a DNS change "propagates" by being pushed: old answers simply live in caches until their TTL expires.
- Reading MX preference backwards: the lowest number is tried first.

## Interview questions

**Walk me through what happens when a domain name is resolved.**
The browser and OS caches are checked first. On a miss, the stub resolver asks the recursive resolver, which asks a root server (referral to the TLD servers), a TLD server (referral to the domain's authoritative servers) and finally an authoritative server, which returns the record. Every party caches the answer for its TTL.

**What is the difference between an authoritative server and a recursive resolver?**
An authoritative server holds the original records for a zone and answers only for that zone. A recursive resolver holds no zones of its own; it finds answers on behalf of clients by following referrals, and caches what it learns.

**Why can a DNS change take hours to show up?**
Resolvers and clients keep cached copies of the old record until its TTL expires. If the TTL was a day, some users keep seeing the old address for up to a day. Lowering the TTL before a planned change shortens that window.

**What is an MX record, and what does its preference number do?**
An MX record names the mail server that accepts email for a domain. A domain can list several; senders try the one with the lowest preference number first and fall back to higher numbers if it is unreachable.

**When does DNS use TCP instead of UDP?**
For zone transfers between primary and secondary servers, and when an answer is too large for a UDP response: the server sets the truncation flag and the client repeats the query over TCP. DNS over TLS also runs on TCP.

**What is a reverse DNS lookup, and where is it used?**
It maps an IP address back to a name through a PTR record under in-addr.arpa (ip6.arpa for IPv6). Mail servers check that a sending server's address has a sensible reverse name, and logging and diagnostic tools show names instead of numbers.

**What is DNS cache poisoning, and how is it prevented?**
It is tricking a resolver into caching a forged record, so its users are sent to an attacker's address. Defences include randomised query IDs and source ports, which make forged replies hard to match, and DNSSEC, which signs records so resolvers can verify them.

Next, read [HTTP and HTTPS](/notes/computer-networks/http-and-https), and test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
