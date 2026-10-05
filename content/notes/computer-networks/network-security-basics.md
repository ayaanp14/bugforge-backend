---
title: Network Security Basics
order: 12
minutes: 14
level: beginner
updated: 2026-10-05
seo-title: Network Security Basics: Encryption, Firewalls, Attacks
description: Network security basics: the CIA triad, symmetric vs asymmetric encryption, hashing, digital signatures and certificates, firewalls, VPNs and common attacks.
question: What is network security?
answer: Network security is the set of protocols, devices and practices that protect data and systems on a network from unauthorised access, alteration and disruption. Its goals are the CIA triad: confidentiality, integrity and availability. The main tools are encryption (symmetric, such as AES, and asymmetric, such as RSA), hashing, digital signatures and certificates, firewalls and VPNs, together with defences against attacks such as man-in-the-middle and DDoS.
q: What is the CIA triad in network security?
a: The CIA triad names the three goals of security. Confidentiality means only authorised parties can read the data, integrity means the data cannot be changed without detection, and availability means systems and data are reachable when needed. Encryption serves confidentiality, hashes and signatures serve integrity, and redundancy and DDoS protection serve availability.
q: What is the difference between symmetric and asymmetric encryption?
a: Symmetric encryption uses one shared secret key to encrypt and decrypt; it is fast, as in AES, but the key must be shared secretly first. Asymmetric encryption uses a key pair: a public key anyone may hold and a private key only its owner keeps. It is much slower, so it is used for key exchange and signatures, as in RSA.
q: What is the difference between encryption and hashing?
a: Encryption is reversible: with the right key, the ciphertext turns back into the original data, so it protects confidentiality. Hashing is one-way: it turns any input into a fixed-size digest that cannot be reversed, so it is used to check integrity and to store passwords. Encoding, such as Base64, is neither; anyone can reverse it.
q: What is a firewall?
a: A firewall is a device or program that allows or blocks traffic between networks according to rules. Packet-filtering firewalls check each packet's addresses, protocol and ports; stateful firewalls also track connections, so replies are allowed automatically; application-level firewalls inspect the content of protocols such as HTTP.
q: What is a man-in-the-middle attack?
a: In a man-in-the-middle attack, the attacker secretly sits between two parties, relaying and possibly altering their messages while each believes it is talking to the other. ARP spoofing on a local network and fake Wi-Fi hotspots are common ways in. TLS with proper certificate checks defeats it, because the attacker cannot prove to be the real server.
q: What is the difference between DoS and DDoS attacks?
a: A denial-of-service attack tries to make a service unavailable by exhausting its bandwidth, connections or processing. A DoS comes from one source, which can be blocked. A distributed DoS comes from thousands of machines at once, often a botnet, so blocking single addresses does not work and large-scale filtering is needed.
---

Every protocol in the earlier notes was designed for a network of trusted researchers: IP does not check source addresses, ARP believes any reply, and classic DNS and HTTP send everything in clear text. Network security adds what those protocols lack. Cryptography keeps data secret and tamper-evident, certificates prove who is on the other end, firewalls and VPNs control what may cross a boundary, and specific defences blunt specific attacks.

## The CIA triad

| Goal | Meaning | Typical threat | Protection |
| --- | --- | --- | --- |
| Confidentiality | Only authorised parties can read the data | Sniffing, stolen databases | Encryption, access control |
| Integrity | Data cannot be altered undetected | Tampering in transit, man-in-the-middle | Hashes, MACs, digital signatures |
| Availability | Systems answer when needed | DoS and DDoS, hardware failure | Redundancy, rate limiting, DDoS protection |

Three more terms are often added: **authentication** (proving who you are), **authorisation** (what you are allowed to do) and **non-repudiation** (a sender cannot later deny sending a message, provided by digital signatures).

## Symmetric encryption

One **shared secret key** both encrypts and decrypts. It is fast, often built into processor hardware, so it encrypts all bulk data. **AES** (block size 128 bits, keys of 128, 192 or 256 bits) is the standard; ChaCha20 is a fast alternative in software. **DES**, with its 56-bit key, can be brute-forced and is broken, and 3DES is deprecated.

Its weakness is **key distribution**: the two parties must already share the key secretly, and every pair of people needs its own key, **n(n − 1)/2** of them for n people.

## Asymmetric (public-key) encryption

Each party has a **key pair**. The **public key** can be published; the **private key** never leaves its owner. What one key does, only the other can undo:

- encrypt with the recipient's **public** key, and only the recipient's **private** key can decrypt (confidentiality);
- sign with your **private** key, and anyone can verify with your **public** key (authenticity).

@figure two-kinds

**RSA**, whose security rests on the difficulty of factoring a large number, and **elliptic-curve** algorithms (ECDH, ECDSA) are the common families. They are far slower than symmetric ciphers, so they are used for small jobs: agreeing keys and signing.

### Worked example: toy RSA

Real RSA uses primes hundreds of digits long; small numbers show the mechanics.

| Step | Working | Result |
| --- | --- | --- |
| Choose primes | p = 3, q = 11 | n = p × q = 33 |
| Euler's totient | φ(n) = (p − 1)(q − 1) = 2 × 10 | 20 |
| Public exponent | e = 3, since gcd(3, 20) = 1 | Public key (3, 33) |
| Private exponent | d with e × d ≡ 1 (mod 20): 3 × 7 = 21 ≡ 1 | Private key (7, 33) |
| Encrypt m = 4 | c = 4^3 mod 33 = 64 mod 33 | c = 31 |
| Decrypt c = 31 | 31 ≡ −2 (mod 33), so 31^7 ≡ (−2)^7 = −128 ≡ −128 + 4 × 33 | m = 4 |

Anyone may know (3, 33), but finding d = 7 requires φ(33), which requires factoring 33. For a 2,048-bit n, no known method can factor it in practice.

### Worked example: Diffie-Hellman key agreement

Diffie-Hellman lets two parties agree a secret over an open channel without ever sending it. Public values: prime p = 23, generator g = 5.

@figure diffie-hellman

| | Alice | Bob |
| --- | --- | --- |
| Private number | a = 6 | b = 15 |
| Sends | A = 5^6 mod 23 = 8 | B = 5^15 mod 23 = 19 |
| Computes | B^a = 19^6 mod 23 = 2 | A^b = 8^15 mod 23 = 2 |

TLS 1.3 uses the elliptic-curve version with fresh numbers for every connection (ephemeral keys), which gives **forward secrecy**.

### Symmetric vs asymmetric

| Aspect | Symmetric | Asymmetric |
| --- | --- | --- |
| Keys | One shared secret key | A public and a private key per party |
| Speed | Fast | Much slower |
| Typical key size | 128 or 256 bits (AES) | 2,048 bits or more (RSA); about 256 bits (elliptic curves) |
| Key distribution | Hard: the key must be shared secretly | Easy: public keys can be published |
| Keys for n users | n(n − 1)/2 | 2n (one pair each) |
| Used for | Bulk data | Key exchange, signatures, certificates |
| Examples | AES, ChaCha20 (DES and 3DES are legacy) | RSA, Diffie-Hellman, ECDSA, ECDH |

@figure key-count

Real systems are **hybrid**: TLS uses asymmetric cryptography to authenticate the server and agree a key, then encrypts the data with a symmetric cipher such as AES-GCM ([HTTP and HTTPS](/notes/computer-networks/http-and-https)).

## Hashing

A **cryptographic hash function** turns any input into a fixed-size **digest**. SHA-256 always outputs 256 bits (64 hexadecimal characters). A good hash is deterministic and fast, and it is:

- **preimage resistant**: given a digest, you cannot find an input that produces it;
- **second-preimage resistant**: given an input, you cannot find another with the same digest;
- **collision resistant**: you cannot find any two inputs with the same digest;
- sensitive to change: flipping one input bit changes about half the output bits (the avalanche effect).

MD5 and SHA-1 have practical collision attacks and must not be used for security; SHA-256 and SHA-3 are current. **Passwords** are stored as the output of a deliberately slow, **salted** function such as bcrypt, scrypt or Argon2: the random salt per user means identical passwords get different hashes and precomputed tables are useless. An **HMAC** mixes a secret key into a hash, so the receiver can check both integrity and that the sender knew the key.

| Aspect | Encoding (Base64) | Encryption (AES) | Hashing (SHA-256) |
| --- | --- | --- | --- |
| Purpose | Represent data safely in another format | Confidentiality | Integrity, fingerprints, password storage |
| Reversible | Yes, by anyone | Yes, with the key | No |
| Uses a key | No | Yes | No (HMAC adds one) |
| Output size | Grows with the input | About the input's size | Fixed |

## Digital signatures and certificates

A **digital signature** is a value computed over the message's hash with the sender's **private key**, which anyone can check with the sender's **public key**:

@figure digital-signature

A valid signature proves **integrity** (any change breaks it), **authenticity** (only the private key holder could make it) and **non-repudiation**. It does not hide the message.

But how do you know a public key really belongs to example.com? A **digital certificate** (X.509) binds a public key to a name, and a **certificate authority (CA)** signs it. Browsers and operating systems ship a trust store of **root CA** certificates; a site's certificate is signed by an **intermediate CA**, which is signed by a root, forming a **chain of trust**. A client checks each signature up the chain, the validity dates, that the certificate's names include the host, and that it is not revoked (through CRLs or OCSP).

## Firewalls

A firewall enforces rules about what traffic may cross a boundary.

| Type | Looks at | Layer | Strength | Weakness |
| --- | --- | --- | --- | --- |
| Packet filtering (stateless) | Each packet's addresses, protocol, ports and flags | 3 and 4 | Fast and simple | No memory of connections, so return traffic needs broad rules |
| Stateful inspection | Headers plus a table of open connections | 3 and 4 | Allows replies to inside-initiated connections and blocks unsolicited packets | The connection table can be flooded |
| Application-level gateway (proxy) | The content of HTTP, DNS, SMTP and so on | 7 | Understands protocols; can filter URLs and content | Slower; needs support per protocol |

**Next-generation firewalls** combine stateful filtering with application identification and intrusion prevention, and a **web application firewall (WAF)** sits in front of a website to block attacks such as SQL injection and cross-site scripting. Rules are checked top to bottom and the first match wins:

| Rule | Action | Protocol | Source | Destination | Port |
| --- | --- | --- | --- | --- | --- |
| 1 | Allow | TCP | Any | 203.0.113.10 | 443 |
| 2 | Allow | TCP | 10.0.0.0/8 | 203.0.113.10 | 22 |
| 3 | Deny | Any | Any | Any | Any |

@figure firewall-rules

## VPNs

A **virtual private network** carries traffic through an encrypted **tunnel** across an untrusted network, so a remote laptop (**remote-access VPN**) or a whole branch office (**site-to-site VPN**) behaves as if it were on the private network. Common protocols are **IPsec** at the network layer, TLS-based VPNs, and WireGuard. IPsec's ESP protocol provides encryption and integrity (its AH protocol provides integrity only), in **transport mode**, which protects the payload of the original packet, or **tunnel mode**, which wraps the entire original packet inside a new one, as gateways do. A VPN hides traffic from the local network and the ISP, but the VPN operator can see it, and it does not stop malware or phishing.

## Common attacks and defences

The attack that certificates exist to defeat is the **man in the middle**:

@figure mitm

| Attack | How it works | Defences |
| --- | --- | --- |
| Man-in-the-middle | The attacker relays and alters traffic between two parties, through ARP spoofing, a rogue Wi-Fi hotspot or DNS spoofing | TLS with certificate checks, HSTS, a VPN on untrusted Wi-Fi, dynamic ARP inspection |
| DoS | One source exhausts bandwidth, connection tables or CPU, as in a TCP SYN flood | Rate limiting, SYN cookies, firewall rules |
| DDoS | Many machines, often a botnet, attack at once; amplification sends small spoofed requests to open DNS or NTP servers, whose larger replies hit the victim | CDN and scrubbing services, anycast, upstream filtering, closing open resolvers |
| Phishing | Fake emails or sites trick people into handing over credentials or running malware | Training, mail filtering, SPF, DKIM and DMARC, multi-factor authentication, hardware security keys |
| Spoofing | Forging a source identity: IP, ARP, DNS (cache poisoning) or email sender | Ingress filtering by ISPs, dynamic ARP inspection, DNSSEC, SPF, DKIM and DMARC |
| Sniffing | Capturing packets on a shared medium or a compromised network | Encrypting everything (TLS, SSH, VPN), WPA2 or WPA3 on Wi-Fi, switch port security |
| Replay | Recording a valid message and sending it again later | Nonces, timestamps and sequence numbers |

The SYN flood and SYN cookies are explained in [TCP and UDP](/notes/computer-networks/tcp-and-udp), and DNS cache poisoning in [DNS](/notes/computer-networks/dns).

## Common mistakes

- Saying hashing is encryption: a hash cannot be decrypted; it is one-way.
- Saying a digital signature encrypts the message: it proves who sent it and that it is unchanged, but the message stays readable.
- Mixing up which key does what: encrypt with the recipient's public key; sign with your own private key.
- Treating Base64 as security: it is encoding, reversible by anyone.
- Storing passwords with plain SHA-256: use a salted, deliberately slow function such as bcrypt or Argon2.
- Believing HTTPS or a VPN stops phishing: they protect the channel, not a user who types a password into the wrong site.

## Interview questions

**Why does TLS use both asymmetric and symmetric encryption?**
Asymmetric cryptography solves key distribution and proves identity, but it is far too slow for bulk data. So TLS uses it only to authenticate the server and agree a shared key, then encrypts the actual traffic with a fast symmetric cipher such as AES.

**How many keys do 100 users need with symmetric and with asymmetric encryption?**
Symmetric: one per pair, 100 × 99 / 2 = 4,950 keys. Asymmetric: one key pair per user, 200 keys, since anyone can encrypt to a user with that user's single public key.

**Why should passwords be hashed with a salt rather than encrypted?**
A server never needs to recover a password, only to check one, so a one-way hash is enough, and there is no decryption key to steal. A unique random salt makes identical passwords hash differently and defeats precomputed tables, and a slow function makes guessing expensive.

**How does a digital signature provide non-repudiation?**
Only the holder of the private key could have produced a signature that the matching public key verifies. If the public key is bound to a person or company by a certificate, the signer cannot credibly deny having signed, unless the private key was stolen.

**What is the difference between a stateless and a stateful firewall?**
A stateless firewall judges every packet alone by its header fields, so replies need their own broad rules. A stateful firewall tracks connections, automatically allows the replies to connections started from inside, and drops packets that belong to no known connection.

**How does HTTPS stop a man-in-the-middle attack?**
The attacker can intercept the connection but cannot present a valid certificate for the real domain signed by a trusted CA, nor sign the handshake with the real server's private key. The browser's certificate check fails and it refuses to continue. Users clicking through certificate warnings is how such attacks still succeed.

**What is a DDoS amplification attack?**
The attacker sends small requests to open servers, such as DNS resolvers, with the victim's address forged as the source. The servers send much larger replies to the victim, multiplying the attacker's bandwidth. Defences include ISPs filtering spoofed source addresses, closing open resolvers and absorbing traffic with large scrubbing networks.

**What is the difference between IPsec transport mode and tunnel mode?**
Transport mode protects only the payload and keeps the original IP header, used between two hosts. Tunnel mode encrypts the whole original packet, header included, and puts it inside a new packet between two gateways, which is how site-to-site VPNs work.

That completes the [Computer Networks notes](/notes/computer-networks). Test yourself with the [Computer Networks (Basic) skill test](/skill-tests/networks-basic), then the [Computer Networks (Intermediate) skill test](/skill-tests/networks-intermediate).
