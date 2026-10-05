---
title: What Happens When You Type a URL
order: 11
minutes: 12
level: intermediate
updated: 2026-10-05
seo-title: What Happens When You Type a URL in the Browser
description: The classic networking interview question answered end to end: URL parsing, caches, DNS, ARP, TCP and TLS handshakes, the HTTP request and page rendering.
question: What happens when you type a URL into a browser and press Enter?
answer: The browser parses the URL, checks its caches and resolves the host name to an IP address with DNS. It opens a TCP connection with the three-way handshake, negotiates TLS for HTTPS and sends an HTTP GET request, which routers forward hop by hop to the server or a CDN edge. The server sends back HTML, and the browser parses it, fetches the page's other resources, then lays out and paints the page.
q: Which protocols are used when you open a website?
a: DNS finds the server's IP address, ARP finds the local gateway's MAC address, TCP (or QUIC over UDP) carries the connection, TLS encrypts it, and HTTP fetches the content. Underneath, IP routes the packets across networks and Ethernet or Wi-Fi carries them over each link; DHCP gave your device its address when it joined the network.
q: Why does a website load faster the second time?
a: Much of the work is cached. The DNS answer is reused until its TTL expires, the browser may still hold an open connection so the TCP and TLS handshakes are skipped, and images, scripts and stylesheets come from the HTTP cache. Only what changed, or what the cache rules require checking, travels over the network.
q: Does the browser contact the website's server directly?
a: Often not. Many sites sit behind a content delivery network, so DNS returns the address of a nearby CDN edge server, which answers from its cache or fetches from the origin server. Inside the provider, load balancers and reverse proxies sit in front of the application servers too.
q: What happens if I type a URL without https://?
a: Many modern browsers try HTTPS first for a typed address. If the site is on the browser's HSTS list, from the preload list or a header seen on an earlier visit, the browser always upgrades to HTTPS before sending anything. Otherwise an HTTP request may be answered with a 301 redirect to the HTTPS address.
q: What is the role of a CDN when loading a website?
a: A content delivery network keeps copies of a site's content on servers in many cities. DNS or anycast routing sends each visitor to a nearby edge server, so the TCP and TLS handshakes and the download cover a short distance, and the origin server is spared most of the traffic.
---

"What happens when you type a URL and press Enter?" is the classic networking interview question because it touches every layer at once: name resolution, addressing, the transport handshake, encryption, routing, the application protocol and finally the browser. A good answer is ordered, names the protocol at each step and can go deeper wherever the interviewer pushes. This note gives the thirty-second version first, then each step in detail, with links to the notes that cover each protocol in full.

## The short answer

1. The browser **parses** what you typed into a URL: scheme, host, port, path.
2. It checks its **caches**: the page itself, an open connection to the site, the DNS answer.
3. **DNS** resolves the host name to an IP address.
4. The operating system finds the **default gateway's MAC address with ARP**, and the home router applies **NAT**.
5. A **TCP connection** opens with the three-way handshake (port 443).
6. A **TLS handshake** agrees keys and checks the server's certificate.
7. The browser sends an **HTTP GET request**.
8. **Routers** forward the packets hop by hop across the internet to the server or a CDN edge.
9. The **server side** (CDN, load balancer, web server, application, database) builds the response.
10. The browser receives the **HTML**, fetches the CSS, scripts and images it references, and **renders** the page.

## Step 1: parsing the URL

The browser first decides whether you typed an address or a search: "example.com" looks like a host, "tcp vs udp" does not and goes to the default search engine. A URL such as `https://www.example.com/products?id=7` splits into the scheme (`https`, hence default port 443), the host (`www.example.com`), the path (`/products`) and the query (`id=7`). If you typed no scheme, many modern browsers try HTTPS first. If the host is on the browser's **HSTS** list (built in, or remembered from a `Strict-Transport-Security` header on an earlier visit), the browser upgrades to HTTPS before a single packet leaves.

## Step 2: checking the caches

- **HTTP cache.** If the page is cached and still fresh under its `Cache-Control` rules, the browser can show it with no network traffic at all. If it is stale but has an `ETag`, the browser sends a conditional request and may get a short **304 Not Modified**.
- **Connection reuse.** If the browser already holds an open connection to this origin, it reuses it and skips DNS, TCP and TLS entirely.
- **DNS caches.** The browser's cache, the operating system's cache and the hosts file are checked before any query is sent.

## Step 3: DNS resolution

On a miss, the operating system's stub resolver asks the configured **recursive resolver** (learned from DHCP) over UDP port 53. If that resolver has nothing cached, it asks a root server, then the `.com` TLD servers, then `example.com`'s authoritative server, caches the answer for its TTL and returns, say, 203.0.113.10. The full walk-through is in [DNS](/notes/computer-networks/dns). The browser may receive both an IPv4 (A) and an IPv6 (AAAA) address and try both.

## Step 4: getting the first packet out

The host compares 203.0.113.10 with its own address and subnet mask and sees that it is on another network, so the packet must go to the **default gateway**. The host needs the gateway's MAC address; if it is not in the ARP cache, it broadcasts an ARP request and the router answers ([data link layer](/notes/computer-networks/data-link-layer)). The frame therefore carries the **router's MAC address** but the **web server's IP address**. On Wi-Fi the frame first goes to the access point, under CSMA/CA.

The home router then performs **NAT**: it rewrites the private source address and port, say 192.168.1.10:51000, to its public address and a port of its own, and records the mapping so the replies can find their way back ([NAT, DHCP and ports](/notes/computer-networks/nat-dhcp-and-ports)).

## Step 5: the TCP handshake

The browser opens a TCP connection to 203.0.113.10 port 443 from an ephemeral port: SYN, SYN-ACK, ACK. Both sides now know each other's initial sequence numbers and receive windows, at the cost of one round trip ([TCP and UDP](/notes/computer-networks/tcp-and-udp)). With HTTP/3 this step and the next merge into a single QUIC handshake over UDP.

## Step 6: the TLS handshake

In TLS 1.3, the ClientHello carries supported cipher suites, a key share and the server name (SNI); the ServerHello returns the server's key share, its **certificate** and a signature proving it holds the certificate's private key. The browser checks that the certificate chains to a trusted authority, is in date, matches www.example.com and is not revoked. Both sides derive the same symmetric keys, one round trip after the TCP handshake ([HTTP and HTTPS](/notes/computer-networks/http-and-https)). A certificate error stops the browser here with a warning page.

## Step 7: the HTTP request

```http
GET /products?id=7 HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
Accept-Encoding: gzip, br
Cookie: session=4f2a9c
```

Over HTTP/2 or HTTP/3 the same fields travel as compressed binary frames on a stream, and later requests for the page's resources are multiplexed on the same connection.

## Step 8: across the internet

The request is split into IP packets. Every router on the way decrements the packet's TTL, looks up the destination with **longest prefix match** and forwards it to the next hop; between ISPs, the routes were chosen by **BGP** ([routing](/notes/computer-networks/routing-algorithms)). At each hop the frame is rebuilt with new MAC addresses while the source and destination IP addresses stay fixed, apart from the NAT rewrite at the edge. `traceroute` shows these hops.

## Step 9: on the server side

- DNS may have pointed the browser at a **CDN edge** near you rather than the origin; the edge answers from its cache or fetches from the origin.
- A **load balancer** picks one of many servers; TLS is often terminated there, so the traffic behind it may be plain HTTP inside the data centre.
- A **reverse proxy or web server** (such as Nginx) serves static files and passes dynamic requests to the **application server**.
- The application runs the code for `/products`, reads from a **cache** or **database**, and builds the HTML or JSON.

The response comes back with a status line (200 OK, or a 301 redirect that starts another request), headers such as `Content-Type`, `Cache-Control` and `Set-Cookie`, and a body, usually compressed with gzip or Brotli.

## Step 10: rendering the page

1. The browser parses the HTML into the **DOM**, starting before the whole document has arrived.
2. On finding stylesheets, scripts and images, it requests them, reusing the connection.
3. CSS is parsed into the **CSSOM**; DOM plus CSSOM gives the **render tree** of visible elements.
4. **Layout** computes each element's size and position; **paint** fills in pixels; **compositing** assembles the layers on screen.
5. Ordinary scripts pause HTML parsing while they download and run, which is why pages mark them `defer` or `async`. JavaScript may then call APIs for more data and change the page.

## Keep-alive and closing

The connection is not closed after the page: HTTP/1.1 keeps it alive by default and HTTP/2 multiplexes everything over it, so the next click skips DNS, TCP and TLS. After an idle timeout, either side closes it with a TCP FIN exchange.

## Worked example: the timeline of a first visit

Assume the recursive resolver already has the name cached and is 10 ms away (round trip), the server is 40 ms away (round trip), the server needs 50 ms to build the page, TLS 1.3 is used and transmission time is negligible.

| Step | Cost | Running total |
| --- | --- | --- |
| DNS query to the resolver | 1 round trip: 10 ms | 10 ms |
| TCP handshake | 1 round trip: 40 ms | 50 ms |
| TLS 1.3 handshake | 1 round trip: 40 ms | 90 ms |
| HTTP request, server work, first byte back | 40 ms + 50 ms | 180 ms |

The first byte of HTML arrives after about **180 ms**, before any CSS or images. With HTTP/3, QUIC folds the TCP and TLS round trips into one, giving 10 + 40 + 90 = **140 ms**. On a repeat visit over a kept-alive connection, only the last row remains: **90 ms**. This is why CDNs (shorter round trips), connection reuse and caching matter more for page speed than raw bandwidth.

## Which protocol does what

| Step | Protocol | TCP/IP layer | Transport and port |
| --- | --- | --- | --- |
| Get an address (when joining the network) | DHCP | Application | UDP 67 and 68 |
| Resolve the name | DNS | Application | UDP 53 |
| Find the gateway's MAC address | ARP | Link | None (EtherType 0x0806) |
| Share one public address | NAT | Internet and transport headers | Rewrites addresses and ports |
| Open the connection | TCP | Transport | TCP 443 |
| Secure it | TLS | Between transport and application | Over TCP 443 |
| Fetch the page | HTTP | Application | TCP 443 (UDP 443 for HTTP/3) |
| Route between networks | IP, with routes from BGP and OSPF | Internet | Not applicable |
| Carry each hop | Ethernet, Wi-Fi | Link | Not applicable |

## Common mistakes

- Skipping DNS, or putting it after the TCP handshake: there is nothing to connect to until the name is resolved.
- Saying the laptop ARPs for the web server: for an off-subnet destination it ARPs for its default gateway.
- Putting TLS before TCP for HTTPS over TCP: TCP connects first, then TLS runs inside it (only QUIC merges them).
- Saying the destination IP address changes at every router: only the MAC addresses change, plus NAT at the edge.
- Forgetting redirects: a 301 to the HTTPS or www address costs another full request.
- Ending at "the server sends HTML": the browser still fetches subresources and renders.

## Interview questions

**Why must DNS happen before the TCP handshake?**
TCP connects to an IP address and port, not to a name. Until DNS has turned www.example.com into an address, the operating system has nowhere to send the SYN.

**Which MAC address does the first frame from your laptop carry?**
The default gateway's. The destination is on another network, so the laptop sends the frame to its router, found through ARP, while the IP packet inside is addressed to the web server.

**What does the browser check during the TLS handshake?**
That the server's certificate chains to a trusted certificate authority, is within its validity period, names the requested host and is not revoked, and that the server proved possession of the matching private key by signing the handshake. Any failure produces a certificate warning.

**How does a CDN make this faster?**
It shortens the distance for every round trip: DNS or anycast directs the browser to a nearby edge, so the TCP, TLS and HTTP exchanges cover tens of kilometres rather than thousands, and cached content is served without contacting the origin at all.

**What happens if you type http:// for a site that uses HSTS?**
If the browser has seen the site's HSTS header before, or the site is on the built-in preload list, it rewrites the URL to https:// internally and never sends the plain HTTP request, which prevents an attacker on the network from intercepting that first request.

**How are the images and scripts on a page fetched?**
As the HTML parser finds references to them, the browser issues more HTTP requests, normally to the same or a few other origins. Over HTTP/2 or HTTP/3 they are multiplexed as parallel streams on one connection; HTTP/1.1 browsers open several connections per host instead.

**How would you debug a page that will not load?**
Work up the layers: check the device has an address (not 169.254), ping the gateway, resolve the name with `nslookup` or `dig`, test reachability with `ping` and `traceroute`, then fetch with `curl -v` to see the TLS handshake and the HTTP status. Browser developer tools show the timing of every request.

Next, read [network security basics](/notes/computer-networks/network-security-basics), and test the whole path with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic).
