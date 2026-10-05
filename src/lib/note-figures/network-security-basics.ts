import { finish, ring, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";

/**
 * Network Security Basics: the note's figures
 * (content/notes/computer-networks/network-security-basics.md places each
 * with "@figure <name>"). The cryptography is real arithmetic on the
 * note's toy numbers, run here:
 *
 *  - two-kinds: a message of 4 sent with a shared XOR key, then with the
 *    note's toy RSA key pair (n = 33, e = 3, d = 7; 4 → 31 → 4);
 *  - key-count: the keys five people need each way, counted from the
 *    pairs, and the same formulas at 100 people (4,950 against 200);
 *  - diffie-hellman: p = 23, g = 5, secrets 6 and 15, every power computed
 *    by modular exponentiation and both sides' results compared;
 *  - digital-signature: a toy hash signed with the toy RSA private key,
 *    verified with the public key, and a tampered message failing;
 *  - firewall-rules: four packets checked against the note's rule table,
 *    first match wins, CIDR matching done on the addresses;
 *  - mitm: an attacker in the middle presenting its own certificate, the
 *    client's chain check against its trust store refusing it.
 */

/** Modular exponentiation by squaring (exact for these small numbers). */
function modPow(base: number, exp: number, mod: number): number {
  let r = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) r = (r * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return r;
}

const RSA = { n: 33, e: 3, d: 7 };

/* ── Symmetric and asymmetric, side by side ───────────────────────── */

function twoKinds(): Walkthrough {
  const m = 4;
  const K = 0b1011;
  const c1 = m ^ K;
  const back1 = c1 ^ K;
  const c2 = modPow(m, RSA.e, RSA.n);
  const back2 = modPow(c2, RSA.d, RSA.n);
  if (back1 !== m || c2 !== 31 || back2 !== m) throw new Error(`two-kinds: ${m} → ${c2} → ${back2}, the note says 4 → 31 → 4`);
  const bin = (v: number) => v.toString(2).padStart(4, "0");

  const BW = 80;
  const KW = 112;
  const flow = (o: { c: string; enc: string; dec: string; encKey: string; decKey: string; same: boolean; mText: string }): Item[] => {
    const xs = [0, 98, 196, 294, 392];
    const items: Item[] = [
      label("al", "Alice", BW / 2, -16, { size: 12, tone: "ink", weight: 600 }),
      label("bo", "Bob", xs[4] + BW / 2, -16, { size: 12, tone: "ink", weight: 600 }),
      box("m1", xs[0], 0, o.mText, { w: BW, h: 32, size: 12 }),
      box("en", xs[1], 0, o.enc, { w: BW, h: 32, size: 11.5, tone: "accent" }),
      box("cc", xs[2], 0, o.c, { w: BW, h: 32, size: 12, tone: "muted" }),
      box("de", xs[3], 0, o.dec, { w: BW, h: 32, size: 11.5, tone: "accent" }),
      box("m2", xs[4], 0, o.mText, { w: BW, h: 32, size: 12, tone: "strong" }),
      label("ev", "Eve on the wire sees only this", xs[2] + BW / 2, 46, { size: 11, tone: "error" }),
      box("k1", xs[1] + BW / 2 - KW / 2, 74, o.encKey, { w: KW, h: 30, size: 11, tone: o.same ? "strong" : "plain" }),
      box("k2", xs[3] + BW / 2 - KW / 2, 74, o.decKey, { w: KW, h: 30, size: 11, tone: "strong" }),
      arrow("u1", { x: xs[1] + BW / 2, y: 72 }, { x: xs[1] + BW / 2, y: 35 }, { tone: "ink" }),
      arrow("u2", { x: xs[3] + BW / 2, y: 72 }, { x: xs[3] + BW / 2, y: 35 }, { tone: "ink" }),
    ];
    for (let i = 0; i < 4; i++) items.push(arrow(`f${i}`, { x: xs[i] + BW + 2, y: 16 }, { x: xs[i + 1] - 3, y: 16 }, { tone: "ink" }));
    items.push(label("kn", o.same ? "the same secret key on both sides" : "Bob's public key encrypts; only his private key decrypts", (xs[1] + xs[3] + BW) / 2, 122, { size: 11, tone: "soft" }));
    return items;
  };
  return finish({
    title: "Symmetric and asymmetric encryption: who holds which key",
    input: `message m = ${m}; shared key ${bin(K)}; Bob's RSA keys (${RSA.e}, ${RSA.n}) and (${RSA.d}, ${RSA.n})`,
    frames: [
      {
        caption: `Symmetric: Alice and Bob share one secret key. A toy XOR cipher turns ${bin(m)} into ${bin(c1)} and the same key turns it back. Fast, but the key had to reach Bob secretly first.`,
        items: flow({ c: bin(c1), enc: "XOR key", dec: "XOR key", encKey: `key ${bin(K)}`, decKey: `key ${bin(K)}`, same: true, mText: bin(m) }),
      },
      {
        caption: `Asymmetric: Alice encrypts with Bob's public key, ${m}^${RSA.e} mod ${RSA.n} = ${c2}. Only Bob's private key undoes it: ${c2}^${RSA.d} mod ${RSA.n} = ${back2}. The public key could have been printed in a newspaper.`,
        items: flow({ c: String(c2), enc: `m^${RSA.e} mod ${RSA.n}`, dec: `c^${RSA.d} mod ${RSA.n}`, encKey: `public (${RSA.e}, ${RSA.n})`, decKey: `private (${RSA.d}, ${RSA.n})`, same: false, mText: String(m) }),
      },
    ],
  });
}

/* ── How many keys ────────────────────────────────────────────────── */

function keyCount(): Walkthrough {
  const people = ["A", "B", "C", "D", "E"];
  const n = people.length;
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const sym = (k: number) => (k * (k - 1)) / 2;
  const asym = (k: number) => 2 * k;
  if (pairs.length !== sym(n) || sym(100) !== 4950 || asym(100) !== 200) throw new Error("key-count: counts disagree with the formulas");
  const R = 16;
  const left = ring(n, 0, 0, 74);
  const right = ring(n, 250, 0, 74);
  const items: Item[] = [
    label("lt", `symmetric: ${pairs.length} shared keys`, 0, -128, { size: 12, tone: "ink", weight: 600 }),
    label("rt", `asymmetric: ${n} key pairs`, 250, -128, { size: 12, tone: "ink", weight: 600 }),
  ];
  pairs.forEach(([a, b], i) => items.push({ k: "edge", id: `p${i}`, x1: left[a].x, y1: left[a].y, x2: left[b].x, y2: left[b].y, tone: "accent" }));
  people.forEach((p, i) => items.push({ k: "node", id: `l${i}`, x: left[i].x, y: left[i].y, r: R, text: p, tone: "plain" }));
  people.forEach((p, i) => {
    items.push({ k: "node", id: `r${i}`, x: right[i].x, y: right[i].y, r: R, text: p, tone: "plain" });
    // Each person's pair: a public key (published) and a private one (kept).
    const out = { x: right[i].x - 250, y: right[i].y };
    const len = Math.hypot(out.x, out.y) || 1;
    const kx = right[i].x + (out.x / len) * 30;
    const ky = right[i].y + (out.y / len) * 30;
    items.push(box(`kp${i}`, kx - 9, ky - 9, "", { w: 8, h: 18, tone: "accent" }), box(`ks${i}`, kx + 1, ky - 9, "", { w: 8, h: 18, tone: "strong" }));
  });
  items.push(label("lk", "every pair needs its own key", 0, 104, { size: 11, tone: "soft" }));
  items.push(label("rk", "each: a public key (light) and a private one", 250, 104, { size: 11, tone: "soft" }));
  return finish({
    title: "Keys needed for private conversations between n people",
    input: `n = ${n}, then n = 100`,
    frames: [
      {
        caption: `With symmetric keys every pair of the ${n} people needs its own secret: n(n − 1)/2 = ${pairs.length}. With key pairs each person needs one, ${asym(n)} keys in all. At 100 people that is ${sym(100).toLocaleString("en-GB")} shared keys against ${asym(100)}.`,
        items,
      },
    ],
  });
}

/* ── Diffie-Hellman ───────────────────────────────────────────────── */

function diffieHellman(): Walkthrough {
  const p = 23;
  const g = 5;
  const a = 6;
  const b = 15;
  const A = modPow(g, a, p);
  const B = modPow(g, b, p);
  const sA = modPow(B, a, p);
  const sB = modPow(A, b, p);
  if (A !== 8 || B !== 19 || sA !== 2 || sB !== 2) throw new Error(`diffie-hellman: A ${A}, B ${B}, secrets ${sA} and ${sB}; the note says 8, 19, 2, 2`);
  // Eve's problem: which exponent gives 8? She must search; at this size she finds it, at 2,048 bits she cannot.
  const logs = Array.from({ length: p - 1 }, (_, k) => k).filter((k) => modPow(g, k, p) === A);

  const CW = 150;
  const AX = 0;
  const BX = 340;
  const MID = (AX + CW + BX) / 2;
  const col = (id: string, x: number, title: string, rows: Array<[string, Tone]>): Item[] => [
    label(`${id}h`, title, x + CW / 2, -16, { size: 12, tone: "ink", weight: 600 }),
    ...rows.map(([t, tone], i) => box(`${id}${i}`, x, i * 40, t, { w: CW, h: 32, size: 11.5, tone })),
  ];
  // Eve is not a party: she listens to the channel between them, so she sits under it.
  const eve = (text: string, tone: Tone): Item[] => [
    label("eh", "Eve, listening", MID, 150, { size: 11.5, tone: "error", weight: 600 }),
    box("ev", MID - 85, 162, text, { w: 170, h: 30, size: 11, tone }),
  ];
  const pub = (hot: boolean): Array<[string, Tone]> => [[`p = ${p}, g = ${g}`, hot ? "accent" : "plain"]];
  const sent = (hot: boolean): Item[] => [
    arrow("x1", { x: AX + CW + 4, y: 90 }, { x: BX - 4, y: 90 }, { tone: hot ? "accent" : "line" }),
    label("x1t", `A = ${A}`, MID, 80, { size: 11.5, tone: hot ? "accent" : "soft", mono: true }),
    arrow("x2", { x: BX - 4, y: 104 }, { x: AX + CW + 4, y: 104 }, { tone: hot ? "accent" : "line" }),
    label("x2t", `B = ${B}`, MID, 116, { size: 11.5, tone: hot ? "accent" : "soft", mono: true }),
  ];
  const frames: Frame[] = [];
  frames.push({
    caption: `Alice and Bob agree in public on a prime p = ${p} and a generator g = ${g}. Anyone listening, Eve included, knows both.`,
    items: [...col("a", AX, "Alice", pub(true)), ...col("b", BX, "Bob", pub(true)), ...eve(`hears p = ${p}, g = ${g}`, "plain")],
  });
  frames.push({
    caption: `Each picks a private number and never sends it: Alice ${a}, Bob ${b}. Each raises g to it: Alice gets ${g}^${a} mod ${p} = ${A}, Bob ${g}^${b} mod ${p} = ${B}.`,
    items: [
      ...col("a", AX, "Alice", [...pub(false), [`secret a = ${a}`, "error"], [`A = ${g}^${a} mod ${p} = ${A}`, "accent"]]),
      ...col("b", BX, "Bob", [...pub(false), [`secret b = ${b}`, "error"], [`B = ${g}^${b} mod ${p} = ${B}`, "accent"]]),
      ...eve(`hears p = ${p}, g = ${g}`, "plain"),
    ],
  });
  frames.push({
    caption: `They swap A = ${A} and B = ${B} in the open. Eve now holds ${p}, ${g}, ${A} and ${B}, but turning ${A} back into ${a} means solving a discrete logarithm, which is infeasible for real key sizes.`,
    items: [
      ...col("a", AX, "Alice", [...pub(false), [`secret a = ${a}`, "error"], [`A = ${A}`, "plain"]]),
      ...col("b", BX, "Bob", [...pub(false), [`secret b = ${b}`, "error"], [`B = ${B}`, "plain"]]),
      ...sent(true),
      ...eve(`hears ${p}, ${g}, ${A} and ${B}`, "plain"),
    ],
  });
  frames.push({
    caption: `Alice computes ${B}^${a} mod ${p} = ${sA} and Bob ${A}^${b} mod ${p} = ${sB}: the same number, since both equal ${g}^(${a} × ${b}) mod ${p}. The shared secret ${sA} never crossed the network.`,
    items: [
      ...col("a", AX, "Alice", [...pub(false), [`secret a = ${a}`, "error"], [`A = ${A}`, "plain"], [`${B}^${a} mod ${p} = ${sA}`, "strong"]]),
      ...col("b", BX, "Bob", [...pub(false), [`secret b = ${b}`, "error"], [`B = ${B}`, "plain"], [`${A}^${b} mod ${p} = ${sB}`, "strong"]]),
      ...sent(false),
      ...eve("no way to the secret", "muted"),
    ],
  });
  if (!logs.includes(a)) throw new Error("diffie-hellman: the secret is not a logarithm of A");
  return finish({ title: "Diffie-Hellman: agreeing a secret in public", input: `p = ${p}, g = ${g}, Alice's secret ${a}, Bob's secret ${b}`, frames });
}

/* ── Digital signature ────────────────────────────────────────────── */

/** A toy hash for the figure: the sum of the character codes mod n. Real systems use SHA-256; the flow is the same. */
const toyHash = (s: string) => [...s].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % RSA.n;

function digitalSignature(): Walkthrough {
  const msg = "PAY 50";
  const forged = "PAY 90";
  const h = toyHash(msg);
  const sig = modPow(h, RSA.d, RSA.n);
  const check = modPow(sig, RSA.e, RSA.n);
  const h2 = toyHash(forged);
  if (check !== h) throw new Error("digital-signature: the signature does not verify");
  if (h2 === h) throw new Error("digital-signature: the tampered message hashes the same");

  const BW = 112;
  const row = (id: string, y: number, cells: Array<[string, Tone]>, xs: number[]): Item[] => {
    const items: Item[] = [];
    cells.forEach(([t, tone], i) => {
      items.push(box(`${id}${i}`, xs[i], y, t, { w: BW, h: 32, size: 11.5, tone }));
      if (i < cells.length - 1) items.push(arrow(`${id}a${i}`, { x: xs[i] + BW + 2, y: y + 16 }, { x: xs[i + 1] - 3, y: y + 16 }, { tone: "ink" }));
    });
    return items;
  };
  const xs = [0, 140, 280, 420].map((x) => x * 0.92);
  const sender = (hot: boolean): Item[] => [
    label("sl", "sender (holds the private key)", 0, -14, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }),
    ...row("s", 0, [[`"${msg}"`, "plain"], [`hash = ${h}`, hot ? "accent" : "plain"], [`${h}^${RSA.d} mod ${RSA.n}`, hot ? "accent" : "plain"], [`signature ${sig}`, "strong"]], xs),
  ];
  const receiver = (m: string, ok: boolean): Item[] => {
    const hm = toyHash(m);
    return [
      label("rl", "receiver (uses the public key)", 0, 66, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }),
      ...row("r", 80, [[`"${m}"`, ok ? "plain" : "error"], [`hash = ${hm}`, ok ? "accent" : "error"]], xs),
      ...row("v", 128, [[`signature ${sig}`, "plain"], [`${sig}^${RSA.e} mod ${RSA.n} = ${check}`, "accent"]], xs),
      box("cmp", xs[2] + 20, 104, ok ? `${hm} = ${check}: valid` : `${hm} ≠ ${check}: invalid`, { w: BW + 30, h: 32, size: 11.5, tone: ok ? "strong" : "error" }),
      arrow("c1", { x: xs[1] + BW + 2, y: 96 }, { x: xs[2] + 17, y: 116 }, { tone: "ink" }),
      arrow("c2", { x: xs[1] + BW + 2, y: 144 }, { x: xs[2] + 17, y: 128 }, { tone: "ink" }),
    ];
  };
  return finish({
    title: "A digital signature: sign the hash with the private key, verify with the public",
    input: `message "${msg}", toy hash = sum of character codes mod ${RSA.n}, RSA keys (${RSA.e}, ${RSA.n}) and (${RSA.d}, ${RSA.n})`,
    frames: [
      {
        caption: `The sender hashes "${msg}" to ${h} and raises it to the private exponent: ${h}^${RSA.d} mod ${RSA.n} = ${sig}. The signature travels with the message, which stays perfectly readable.`,
        items: sender(true),
      },
      {
        caption: `The receiver hashes the message itself and raises the signature to the public exponent: ${sig}^${RSA.e} mod ${RSA.n} = ${check}. The two match, so the message is unchanged and only the private key's holder could have signed it.`,
        items: [...sender(false), ...receiver(msg, true)],
      },
      {
        caption: `Change the message to "${forged}" on the way and its hash becomes ${h2}, while the signature still opens to ${check}. They differ, so the forgery is caught; making a new signature would need the private key.`,
        items: [...sender(false), ...receiver(forged, false)],
      },
    ],
  });
}

/* ── Firewall rules, first match wins ─────────────────────────────── */

const ipNum = (s: string) => s.split(".").reduce((a, o) => a * 256 + Number(o), 0);
const inCidr = (addr: string, cidr: string) => {
  if (cidr === "any") return true;
  const [net, len] = cidr.includes("/") ? cidr.split("/") : [cidr, "32"];
  const bits = Number(len);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((ipNum(addr) & mask) >>> 0) === ((ipNum(net) & mask) >>> 0);
};

function firewallRules(): Walkthrough {
  const rules = [
    { n: 1, action: "allow", proto: "TCP", src: "any", dst: "203.0.113.10", port: "443" },
    { n: 2, action: "allow", proto: "TCP", src: "10.0.0.0/8", dst: "203.0.113.10", port: "22" },
    { n: 3, action: "deny", proto: "any", src: "any", dst: "any", port: "any" },
  ];
  const packets = [
    { proto: "TCP", src: "198.51.100.7", dst: "203.0.113.10", port: 443 },
    { proto: "TCP", src: "10.4.2.9", dst: "203.0.113.10", port: 22 },
    { proto: "TCP", src: "198.51.100.7", dst: "203.0.113.10", port: 22 },
  ];
  const fits = (r: (typeof rules)[number], p: (typeof packets)[number]) => (r.proto === "any" || r.proto === p.proto) && inCidr(p.src, r.src) && inCidr(p.dst, r.dst) && (r.port === "any" || Number(r.port) === p.port);
  const why = (r: (typeof rules)[number], p: (typeof packets)[number]) => (r.proto !== "any" && r.proto !== p.proto ? "protocol" : !inCidr(p.src, r.src) ? "source" : !inCidr(p.dst, r.dst) ? "destination" : "port");
  const W = [34, 58, 50, 96, 106, 48];
  const head = ["#", "action", "proto", "source", "destination", "port"];
  const TY = 74;
  const frames: Frame[] = packets.map((p, k) => {
    const hit = rules.findIndex((r) => fits(r, p));
    const items: Item[] = [
      label("pl", "packet", 0, 0, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }),
      box("pk", 0, 12, `${p.proto} ${p.src} → ${p.dst}:${p.port}`, { w: 320, h: 30, size: 12, tone: "accent" }),
    ];
    let x = 0;
    head.forEach((h, c) => {
      items.push(label(`h${c}`, h, x + W[c] / 2, TY - 12, { size: 11, tone: "faint" }));
      x += W[c] + 4;
    });
    rules.forEach((r, i) => {
      const tone: Tone = i < hit ? "muted" : i === hit ? (r.action === "allow" ? "strong" : "error") : "plain";
      let cx = 0;
      [String(r.n), r.action, r.proto, r.src, r.dst, r.port].forEach((t, c) => {
        items.push(box(`r${i}-${c}`, cx, TY + i * 34, t, { w: W[c], h: 30, size: 11.5, tone }));
        cx += W[c] + 4;
      });
      const note = i < hit ? `no: ${why(r, p)}` : i === hit ? `match: ${r.action}` : "not checked";
      items.push(label(`n${i}`, note, cx + 4, TY + i * 34 + 15, { anchor: "start", size: 11, tone: i === hit ? (r.action === "allow" ? "accent" : "error") : "faint" }));
    });
    const r = rules[hit];
    const skipped = rules.slice(0, hit).map((q) => `rule ${q.n} (wrong ${why(q, p)})`);
    const caption =
      hit === 0
        ? `HTTPS to the web server from anywhere: rule 1 matches at once and the packet is allowed. The rules below it are never looked at.`
        : r.action === "allow"
          ? `SSH from ${p.src}, an internal address: ${skipped.join(" and ")} does not match, but rule ${r.n} does, because ${p.src} is inside ${r.src}. Allowed.`
          : `SSH from outside, ${p.src}: ${skipped.join(" and ")} do not match, so it falls through to rule ${r.n}, the default deny. Dropped.`;
    if (k === 2 && r.action !== "deny") throw new Error("firewall-rules: outside SSH was allowed");
    return { caption, items };
  });
  return finish({ title: "A firewall checks its rules top to bottom: the first match wins", input: "the rule table below; three packets to the web server 203.0.113.10", frames });
}

/* ── Man in the middle ────────────────────────────────────────────── */

function mitm(): Walkthrough {
  const trustStore = new Set(["Example Root CA", "Other Root CA"]);
  const host = "example.com";
  const certs = {
    real: { subject: host, issuer: "Example Root CA" },
    fake: { subject: host, issuer: "Mallory's CA" },
  };
  const verify = (c: { subject: string; issuer: string }, want: string) => (c.subject !== want ? "wrong name" : !trustStore.has(c.issuer) ? "untrusted issuer" : "ok");
  if (verify(certs.real, host) !== "ok" || verify(certs.fake, host) !== "untrusted issuer") throw new Error("mitm: the certificate checks disagree");

  const ROW = 40;
  const L = lifelines("ll", ["client", "attacker", "real server"], { gap: 180, w: 104, h: 28, length: 5 * ROW + 20 });
  const x = L.xOf;
  const y = (r: number) => 54 + r * ROW;
  const steps: Item[][] = [
    [...message("m0", x(0), x(1), y(0), "ClientHello for example.com", { drop: 6 }), label("m0b", "(ARP spoofing put the attacker here)", (x(0) + x(1)) / 2, y(0) + 20, { size: 10.5, tone: "error" })],
    message("m1", x(1), x(2), y(1) + 8, "ClientHello (its own)", { drop: 6 }),
    message("m2", x(2), x(1), y(2) + 8, `cert: ${certs.real.issuer}`, { drop: 6, dashed: true }),
    message("m3", x(1), x(0), y(3) + 8, `cert: ${certs.fake.issuer}`, { drop: 6, dashed: true, tone: "error" }),
  ];
  const verdict = (shown: boolean): Item[] =>
    shown
      ? [box("vd", x(0) - 56, y(4) + 8, `check: ${verify(certs.fake, host)}`, { w: 168, h: 30, size: 11.5, tone: "error" }), label("ab", "connection aborted", x(0) + 30, y(4) + 52, { size: 11.5, tone: "error", weight: 600 })]
      : [];
  const upto = (k: number, end = false) => [...L.items, ...steps.slice(0, k).flat(), ...verdict(end)];
  return finish({
    title: "A man in the middle against TLS, and the certificate check that stops it",
    input: "a client on spoofed Wi-Fi connecting to example.com",
    frames: [
      {
        caption: "After ARP spoofing on the local network, the client's packets for example.com reach the attacker first. The attacker accepts the connection, hoping to sit in the middle and read everything.",
        items: upto(1),
      },
      {
        caption: "To relay, the attacker opens its own connection to the real server and gets the real certificate. It cannot reuse that certificate towards the client: it lacks the matching private key to sign the handshake.",
        items: upto(3),
      },
      {
        caption: `So it presents a certificate for ${host} that it made itself, signed by its own CA. The client finds no chain from that issuer to any root in its trust store, so the check fails and it aborts before sending any data.`,
        items: upto(4, true),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "two-kinds": twoKinds,
  "key-count": keyCount,
  "diffie-hellman": diffieHellman,
  "digital-signature": digitalSignature,
  "firewall-rules": firewallRules,
  mitm,
};
