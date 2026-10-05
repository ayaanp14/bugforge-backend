---
title: HTTP and HTTPS
order: 7
minutes: 13
level: beginner
updated: 2026-10-05
seo-title: HTTP vs HTTPS: Methods, Status Codes and TLS Handshake
description: How HTTP works: requests and responses, methods, status codes, headers, cookies and sessions, HTTP/1.1 vs HTTP/2 vs HTTP/3, and how HTTPS adds TLS on top.
question: What is the difference between HTTP and HTTPS?
answer: HTTP (Hypertext Transfer Protocol) is the stateless request-response protocol that browsers, apps and servers use to exchange web pages and API data, by default on TCP port 80. HTTPS is the same HTTP carried inside a TLS-encrypted connection, by default on port 443. TLS adds encryption, integrity checking and server authentication through certificates, so an eavesdropper on the network can neither read nor silently change the traffic.
q: What does it mean that HTTP is stateless?
a: Each request is handled on its own; the server keeps no memory of earlier requests from the same client as part of the protocol. Applications add state on top, usually with a cookie that carries a session ID or a signed token, which the browser sends back with every request.
q: What is the difference between GET and POST?
a: GET reads a resource; its parameters travel in the URL's query string, and it is safe and idempotent, so it can be cached, bookmarked and retried. POST sends data in the request body to create something or trigger processing; it is neither safe nor idempotent, so repeating it may create a duplicate.
q: What is the difference between 401 and 403 status codes?
a: 401 Unauthorized means the request lacks valid authentication: the client has not proved who it is, or its credentials are wrong or expired. 403 Forbidden means the server knows who the client is, or does not need to, but refuses access anyway. Logging in can fix a 401 but not a 403.
q: What is the difference between HTTP/1.1, HTTP/2 and HTTP/3?
a: HTTP/1.1 is text-based and handles one request at a time per TCP connection. HTTP/2 uses binary frames to multiplex many requests over one TCP connection and compresses headers. HTTP/3 runs over QUIC on UDP, so one lost packet no longer stalls every stream, and its handshake includes TLS 1.3.
q: Is HTTPS slower than HTTP?
a: Only slightly, at connection setup: TLS 1.3 adds one round trip (TLS 1.2 added two), and resumed sessions can skip most of it. Once connected, symmetric encryption is cheap on modern processors. Browsers also allow HTTP/2 and HTTP/3 only over encrypted connections, so HTTPS sites are often faster overall.
q: What is the difference between PUT and PATCH?
a: PUT replaces the whole resource at a URL with the body sent, and repeating it gives the same result, so it is idempotent. PATCH applies a partial change, such as updating one field; it is not guaranteed to be idempotent, because a patch like "add 1 to the counter" changes the result each time.
---

HTTP is the protocol of the web: every page, image, script and API call your browser makes is an HTTP request answered by an HTTP response. It is simple on purpose (text messages in its classic form, one request and one response) and stateless, which is what lets it scale to billions of users. HTTPS is not a different protocol; it is HTTP sent through an encrypted TLS tunnel. This note covers the message format, methods, status codes, state, the three HTTP versions and the TLS handshake.

## How HTTP works

HTTP is a **client-server, request-response** protocol at the application layer. The client (a browser, an app, `curl`) opens a connection to the server, sends a request and reads the response. HTTP/1.1 and HTTP/2 run over TCP; HTTP/3 runs over QUIC on UDP. The resource is named by a URL:

| Part of `https://www.example.com:443/search?q=tcp#results` | Value | Purpose |
| --- | --- | --- |
| Scheme | `https` | Protocol, and so the default port (80 for http, 443 for https) |
| Host | `www.example.com` | Resolved by [DNS](/notes/computer-networks/dns) to an IP address |
| Port | `443` | Usually left out when it is the default |
| Path | `/search` | Which resource on the server |
| Query | `q=tcp` | Parameters as key=value pairs |
| Fragment | `results` | A position inside the page; never sent to the server |

## The request and the response

A request has a **request line** (method, path, version), **headers**, a blank line and an optional **body**. A response has the same shape with a **status line** (version, status code, reason phrase) in front.

@figure message-anatomy

`Content-Length` is the body's size in bytes, which is how the reader knows where the body ends. In HTTP/2 and HTTP/3 the same fields travel as binary frames, but the meaning is identical.

## HTTP methods

A method is **safe** if it does not change server state, and **idempotent** if sending it once or many times leaves the server in the same state.

| Method | Purpose | Safe | Idempotent | Body |
| --- | --- | --- | --- | --- |
| GET | Read a resource | Yes | Yes | No |
| HEAD | Like GET, but headers only | Yes | Yes | No |
| OPTIONS | Ask what the server allows (used by CORS preflight) | Yes | Yes | Rarely |
| POST | Create a resource or trigger processing | No | No | Yes |
| PUT | Create or fully replace the resource at this URL | No | Yes | Yes |
| PATCH | Change part of a resource | No | Not guaranteed | Yes |
| DELETE | Remove a resource | No | Yes | Rarely |

Idempotence is about state, not the response: a second DELETE of the same item may return 404, but the server is in the same state as after the first. This is why clients and proxies may retry idempotent requests after a network failure but must not blindly retry a POST.

## Status codes

| Class | Meaning | Common codes |
| --- | --- | --- |
| 1xx | Informational | 100 Continue, 101 Switching Protocols (WebSocket upgrade) |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved Permanently, 302 Found, 304 Not Modified, 307 Temporary Redirect, 308 Permanent Redirect |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 405 Method Not Allowed, 409 Conflict, 429 Too Many Requests |
| 5xx | Server error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout |

The pairs interviewers ask about:

- **401 vs 403**: 401 means "authenticate first"; 403 means "you are known, and still not allowed".
- **301 vs 302**: 301 is permanent (browsers and search engines remember the new URL), 302 is temporary. 307 and 308 are their counterparts that **forbid changing the method**, so a redirected POST stays a POST.
- **502 vs 504**: both come from a gateway or proxy; 502 means the upstream server sent an invalid response, 504 means it did not answer in time.
- **304 Not Modified**: the client's cached copy is still valid, so no body is sent.

## Headers

| Header | Sent in | Meaning |
| --- | --- | --- |
| Host | Request | Which website on this IP address; mandatory in HTTP/1.1 |
| User-Agent | Request | The client software |
| Accept, Accept-Encoding | Request | Formats and compressions (gzip, br) the client can take |
| Authorization | Request | Credentials, such as `Bearer` followed by a token |
| Content-Type, Content-Length | Both | The body's format and size |
| Cookie, Set-Cookie | Request, response | Carry state; see below |
| Cache-Control | Both | Caching rules: `max-age=600`, `no-store` |
| ETag, If-None-Match | Response, request | A version tag; if it still matches, the server answers 304 |
| Location | Response | Where a redirect points, or the URL of a created resource |
| Connection: keep-alive | Both (HTTP/1.x) | Reuse the TCP connection for more requests |

## Statelessness, cookies and sessions

HTTP itself remembers nothing between requests. To keep a user logged in, the server sends a cookie, and the browser returns it on every later request to that site.

@figure cookie-session

A real `Set-Cookie` header also carries attributes that limit where and how the cookie travels:

```http
Set-Cookie: session=4f2a9c; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax
```

| Attribute | Effect |
| --- | --- |
| Max-Age or Expires | How long the cookie lives; without either, it is deleted when the browser closes |
| Domain, Path | Which hosts and paths receive it |
| Secure | Sent only over HTTPS |
| HttpOnly | Hidden from JavaScript, which limits theft through cross-site scripting |
| SameSite | Strict, Lax or None: whether it is sent on cross-site requests, a defence against cross-site request forgery |

With a **server-side session**, as in the figure, the cookie holds only a random ID and the server keeps the user's data in memory, a database or a cache such as Redis. With **token-based** authentication, the client holds a signed token (such as a JWT) carrying the user's identity, and the server only verifies the signature. Sessions are easy to revoke; tokens need no lookup but are harder to cancel before they expire.

## HTTP/1.1 vs HTTP/2 vs HTTP/3

| Aspect | HTTP/1.1 (1997) | HTTP/2 (2015) | HTTP/3 (2022) |
| --- | --- | --- | --- |
| Transport | TCP | TCP, with TLS in practice | QUIC over UDP |
| Format | Text | Binary frames | Binary frames |
| Concurrency | One request at a time per connection; browsers open about six connections per host | Many streams multiplexed on one connection | Many independent streams on one connection |
| Header compression | None | HPACK | QPACK |
| Head-of-line blocking | At the HTTP level | Fixed at the HTTP level, but one lost TCP packet stalls all streams | Removed: a loss stalls only its own stream |
| Connection setup | TCP, then TLS | TCP, then TLS | QUIC and TLS 1.3 together in one round trip |

@figure multiplexing

HTTP/1.0 (1996) opened a new connection for every request. HTTP/1.1 made **persistent connections** the default and added the mandatory Host header (so many sites can share one IP address) and chunked transfer. Its pipelining feature allowed several requests in a row, but responses had to come back in order and browsers left it switched off. HTTP/2's server push was later dropped by browsers. HTTP/3 also survives a change of network, such as Wi-Fi to mobile data, because QUIC identifies a connection by an ID rather than by IP addresses and ports.

## HTTPS and the TLS handshake

HTTPS gives three guarantees: **confidentiality** (nobody on the path can read the data), **integrity** (any change is detected) and **authentication** (a certificate proves the server owns the domain). TLS 1.3 sets all three up in one round trip after TCP's:

@figure tls13-handshake

The two **key shares** are the halves of an ephemeral Diffie-Hellman exchange: each side combines its own private value with the other's share and arrives at the **same shared secret**, from which both derive the session keys, without the secret ever crossing the network. The **certificate check** is what stops an impostor: the chain must lead to a certificate authority the client trusts, the dates must be valid, the names must cover the requested host and it must not be revoked, and the CertificateVerify signature proves the server holds the matching private key. Application data then flows under a fast symmetric cipher such as AES-GCM or ChaCha20-Poly1305.

TLS 1.2 needed two round trips and also allowed **RSA key exchange**, where the client encrypts a secret with the server's public key. That lacks **forward secrecy**: anyone who later steals the server's private key can decrypt recorded traffic. TLS 1.3 removed it; every key exchange is ephemeral. Asymmetric cryptography is used only to agree keys and prove identity, because it is far slower than symmetric encryption; see [network security basics](/notes/computer-networks/network-security-basics).

### Worked example: round trips before the first response byte

Take a round-trip time of 50 ms and ignore DNS and server processing time.

| Setup | Round trips | Time |
| --- | --- | --- |
| HTTP over TCP | 1 (TCP handshake) + 1 (request and response) = 2 | 100 ms |
| HTTPS, TLS 1.2 | 1 (TCP) + 2 (TLS) + 1 (request) = 4 | 200 ms |
| HTTPS, TLS 1.3 | 1 (TCP) + 1 (TLS) + 1 (request) = 3 | 150 ms |
| HTTP/3 over QUIC | 1 (QUIC with TLS) + 1 (request) = 2 | 100 ms |

On a reused connection only the last round trip remains, which is why keep-alive and connection reuse matter so much.

HTTPS does **not** hide everything: the IP addresses, the timing and size of traffic, the DNS lookup and normally the server name in the ClientHello (unless Encrypted Client Hello is used) are visible. The path, query string, headers, cookies and body are encrypted.

## REST basics

REST (Representational State Transfer) is a style for designing APIs on top of HTTP: **resources** are named by URLs (nouns), HTTP **methods** are the verbs, each request carries everything needed to process it (**stateless**), and resources are transferred as representations, usually JSON.

| Action | Request | Typical success response |
| --- | --- | --- |
| List users | GET /users | 200 OK |
| Read one user | GET /users/42 | 200 OK (404 if absent) |
| Create a user | POST /users | 201 Created, with Location: /users/43 |
| Replace a user | PUT /users/42 | 200 OK or 204 No Content |
| Change one field | PATCH /users/42 | 200 OK |
| Delete a user | DELETE /users/42 | 204 No Content |

## Common mistakes

- Saying GET is secure because parameters are "hidden" in POST: both are readable over HTTP and both are encrypted over HTTPS; GET parameters do end up in logs and history.
- Calling PATCH idempotent by definition: only GET, HEAD, OPTIONS, PUT and DELETE (and TRACE) are.
- Treating 401 and 403 as the same.
- Saying HTTPS encrypts the domain name: DNS and SNI normally reveal it.
- Saying HTTP/2 removed head-of-line blocking completely: it remains at the TCP level; HTTP/3 removes it.
- Describing the TLS handshake as "the client encrypts the data with the server's public key": the public key authenticates and helps agree a symmetric key; the data is encrypted symmetrically.

## Interview questions

**What is idempotency, and which HTTP methods are idempotent?**
A request is idempotent if repeating it leaves the server in the same state as sending it once. GET, HEAD, OPTIONS, PUT and DELETE are idempotent; POST is not, and PATCH is not guaranteed to be. It matters because idempotent requests can be retried safely after a timeout.

**How do cookies make a stateless protocol stateful?**
The server sends a Set-Cookie header with an identifier, and the browser automatically includes it in every later request to that site. The server uses the identifier to look up the session, so a sequence of independent requests behaves like one logged-in conversation.

**What did HTTP/2 improve over HTTP/1.1?**
It replaced text with binary framing and multiplexes many concurrent streams over a single TCP connection, so one slow response no longer blocks the others at the HTTP level and browsers need fewer connections. It also compresses headers with HPACK, saving bytes on repeated headers such as cookies.

**Why does HTTP/3 run on UDP?**
TCP delivers bytes strictly in order, so a single lost packet stalls every HTTP/2 stream sharing the connection. QUIC, built on UDP, implements reliability per stream, so a loss affects only its own stream. It also merges the transport and TLS handshakes and can move a connection between networks.

**Explain the TLS handshake.**
The client and server exchange supported versions, random numbers and Diffie-Hellman key shares, and both compute the same secret from which session keys are derived. The server proves its identity with its certificate and a signature made with the matching private key, both sides confirm the handshake with Finished messages, and the data then flows under symmetric encryption.

**What does a certificate prove, and how does a browser check it?**
It binds a public key to a domain name, signed by a certificate authority. The browser follows the chain of signatures up to a root certificate in its trust store, checks the validity dates, checks that the certificate's names match the host and checks revocation; then the server must prove it holds the private key.

**What is the difference between 502 and 504?**
Both are returned by a gateway, proxy or load balancer. 502 Bad Gateway means the upstream server returned an invalid or broken response; 504 Gateway Timeout means the upstream server did not respond within the proxy's time limit.

Next, read [routing and routing protocols](/notes/computer-networks/routing-algorithms), and test yourself with the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
