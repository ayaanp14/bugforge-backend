import { finish, type Frame, type Item, type LineTone, type TextTone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { gantt, lifelines, lines, message, type GanttSlot } from "./kit.js";

/**
 * HTTP and HTTPS: the note's figures
 * (content/notes/computer-networks/http-and-https.md places each with
 * "@figure <name>"). Each is built from a small model of what it shows:
 *
 *  - message-anatomy: the note's POST request and 201 response, their
 *    Content-Length headers computed from the bodies' UTF-8 bytes (42 and
 *    50, as the note says);
 *  - cookie-session: a toy server with a session store answering a login
 *    and a later request, the cookie carrying the ID between them;
 *  - multiplexing: three resources fetched over one HTTP/1.1 connection
 *    (one exchange at a time) and over one HTTP/2 connection (frames
 *    interleaved round-robin as each response becomes ready), simulated
 *    tick by tick;
 *  - tls13-handshake: the flights of TCP + TLS 1.3 + one request,
 *    alternating sides, timed at 50 ms a round trip — and the same model
 *    run for plain HTTP, TLS 1.2 and QUIC, checked against the note's
 *    round-trip table.
 */

const bytes = (s: string) => new TextEncoder().encode(s).length;

/* ── The request and the response ─────────────────────────────────── */

function anatomyCard(prefix: string, startLine: string, headers: readonly string[], body: string, o: { x: number; y: number; kind: "request" | "status" }): Item[] {
  const LH = 17;
  const texts = [startLine, ...headers, "", body];
  const tone = (i: number): TextTone => (i === 0 ? "accent" : texts[i].startsWith("Content-Length") ? "accent" : i === texts.length - 1 ? "ink" : "ink");
  const items: Item[] = lines(`${prefix}l`, texts, o.x + 10, o.y + 14, { size: 11.5, gap: LH, tone, weight: undefined });
  const w = Math.max(...texts.map((t) => t.length)) * 11.5 * 0.6 + 20;
  items.unshift({ k: "cell", id: `${prefix}card`, x: o.x, y: o.y, w: Math.ceil(w), h: texts.length * LH + 12, text: "", tone: "plain" });
  // Brackets on the left naming each part.
  const yOf = (i: number) => o.y + 14 + i * LH;
  const part = (id: string, from: number, to: number, name: string) => {
    const y1 = yOf(from) - 7;
    const y2 = yOf(to) + 7;
    const bx = o.x - 8;
    items.push({ k: "path", id: `${prefix}${id}`, pts: [[bx + 5, y1], [bx, y1], [bx, y2], [bx + 5, y2]], tone: "line", width: 1.2 });
    items.push(label(`${prefix}${id}-t`, name, bx - 6, (y1 + y2) / 2, { anchor: "end", size: 11, tone: "soft" }));
  };
  part("p0", 0, 0, o.kind === "request" ? "request line" : "status line");
  part("p1", 1, headers.length, "headers");
  part("p2", headers.length + 1, headers.length + 1, "blank line");
  part("p3", headers.length + 2, headers.length + 2, "body");
  // The body's byte count, as the bracket under it.
  const bodyY = yOf(texts.length - 1) + 12;
  items.push({ k: "span", id: `${prefix}bs`, x1: o.x + 10, x2: o.x + 10 + body.length * 11.5 * 0.6, y: bodyY + 6, label: `${bytes(body)} bytes = Content-Length`, tone: "accent", down: true });
  return items;
}

function messageAnatomy(): Walkthrough {
  const reqBody = '{"name":"Asha","email":"asha@example.com"}';
  const resBody = '{"id":43,"name":"Asha","email":"asha@example.com"}';
  if (bytes(reqBody) !== 42 || bytes(resBody) !== 50) throw new Error(`message-anatomy: bodies are ${bytes(reqBody)} and ${bytes(resBody)} bytes, the note says 42 and 50`);
  const reqHeaders = ["Host: api.example.com", "Content-Type: application/json", `Content-Length: ${bytes(reqBody)}`, "Cookie: session=4f2a9c"];
  const resHeaders = ["Location: /api/users/43", "Content-Type: application/json", `Content-Length: ${bytes(resBody)}`];
  const X = 100;
  const ends = (dir: 1 | -1): Item[] => [
    box("cl", X, 0, "client", { w: 74, h: 26, size: 12, tone: dir === 1 ? "accent" : "plain" }),
    box("sv", X + 266, 0, "server", { w: 74, h: 26, size: 12, tone: dir === -1 ? "accent" : "plain" }),
    dir === 1 ? arrow("ar", { x: X + 80, y: 13 }, { x: X + 260, y: 13 }, { tone: "accent" }) : arrow("ar", { x: X + 260, y: 13 }, { x: X + 80, y: 13 }, { tone: "accent" }),
  ];
  return finish({
    title: "Anatomy of an HTTP request and its response",
    input: "POST /api/users, answered with 201 Created",
    frames: [
      {
        caption: "The request: a request line with the method, the path and the version, then headers one per line, then a blank line, then the body. Content-Length tells the server where the body ends: these 42 bytes.",
        items: [...ends(1), ...anatomyCard("q", "POST /api/users HTTP/1.1", reqHeaders, reqBody, { x: X, y: 44, kind: "request" })],
      },
      {
        caption: "The response has the same shape with a status line in front: the version, the status code 201 and its reason phrase. Location names the user just created, and the body is 50 bytes.",
        items: [...ends(-1), ...anatomyCard("r", "HTTP/1.1 201 Created", resHeaders, resBody, { x: X, y: 44, kind: "status" })],
      },
    ],
  });
}

/* ── Cookies and a server-side session ────────────────────────────── */

function cookieSession(): Walkthrough {
  // A toy server: a login stores the user under a session ID; a later request is answered by looking the ID up.
  const store = new Map<string, string>();
  const SID = "4f2a9c";
  const login = (user: string) => {
    store.set(SID, user);
    return { status: "200 OK", setCookie: `session=${SID}` };
  };
  const cart = (cookie: string) => {
    const id = cookie.replace(/^session=/, "");
    const user = store.get(id);
    return user ? { status: "200 OK", body: `${user}'s cart` } : { status: "401 Unauthorized", body: "" };
  };
  const ok = login("Asha");
  const later = cart(ok.setCookie);
  const stranger = cart("session=000000");
  if (later.body !== "Asha's cart" || stranger.status !== "401 Unauthorized") throw new Error("cookie-session: the toy server misbehaved");

  const ROW = 44;
  const top = (r: number) => 58 + r * ROW;
  const L = lifelines("ll", ["browser", "server", "session store"], { gap: 180, w: 104, h: 28, length: 7 * ROW + 6 });
  const x = L.xOf;
  const msgs: Item[][] = [
    message("m0", x(0), x(1), top(0), "POST /login", { drop: 8 }),
    message("m1", x(1), x(2), top(1), `save ${SID} → Asha`, { drop: 8 }),
    [...message("m2", x(1), x(0), top(2), ok.status, { drop: 8, dashed: true }), label("m2b", `Set-Cookie: ${ok.setCookie}`, (x(0) + x(1)) / 2, top(2) + 20, { size: 11, tone: "accent", mono: true })],
    [...message("m3", x(0), x(1), top(3) + 10, "GET /cart", { drop: 8, tone: "accent" }), label("m3b", `Cookie: ${ok.setCookie}`, (x(0) + x(1)) / 2, top(3) + 30, { size: 11, tone: "accent", mono: true })],
    message("m4", x(1), x(2), top(4) + 16, `look up ${SID}`, { drop: 8 }),
    message("m5", x(2), x(1), top(5) + 12, "Asha", { drop: 8, dashed: true }),
    message("m6", x(1), x(0), top(6) + 8, `${later.status}: ${later.body}`, { drop: 8, dashed: true }),
  ];
  const upto = (k: number) => [...L.items, ...msgs.slice(0, k).flat()];
  const frames: Frame[] = [
    {
      caption: `The login request succeeds. The server stores the user under a random session ID, ${SID}, and sends that ID back in a Set-Cookie header; the browser files the cookie under this site.`,
      items: upto(3),
    },
    {
      caption: "Later, a completely separate request: HTTP itself remembers nothing of the login. But the browser attaches the cookie automatically to every request it sends to this site.",
      items: upto(4),
    },
    {
      caption: `The server looks the ID up, finds Asha, and answers as if the conversation had continued. A request with an unknown ID, such as session=000000, would get ${stranger.status}.`,
      items: upto(7),
    },
  ];
  return finish({ title: "How a cookie turns stateless requests into a logged-in session", input: "log in, then fetch the cart", frames });
}

/* ── HTTP/1.1 against HTTP/2 on one connection ────────────────────── */

interface Res {
  name: string;
  /** Ticks the server spends producing it. */
  work: number;
  /** Ticks its bytes take on the wire. */
  size: number;
}

const TICK_MS = 20;
const RTT = 2;
const ONE_WAY = RTT / 2;

/** HTTP/1.1, one connection, no pipelining: each request waits for the previous response to finish. What the client receives, tick by tick. */
function http11(res: readonly Res[]): { slots: GanttSlot[]; done: Record<string, number> } {
  const slots: GanttSlot[] = [];
  const done: Record<string, number> = {};
  let t = 0;
  for (const r of res) {
    const from = t + RTT + r.work;
    slots.push({ who: "wait", from: t, to: from, tone: "muted" });
    slots.push({ who: r.name, from, to: from + r.size });
    t = from + r.size;
    done[r.name] = t;
  }
  return { slots, done };
}

/** HTTP/2: every request leaves at once; the server sends one frame a tick, round-robin over the responses that are ready. */
function http2(res: readonly Res[]): { slots: GanttSlot[]; done: Record<string, number> } {
  const left = res.map((r) => r.size);
  const ready = res.map((r) => ONE_WAY + r.work);
  const slots: GanttSlot[] = [];
  const done: Record<string, number> = {};
  let last = -1;
  for (let t = 0; left.some((n) => n > 0); t++) {
    const can = res.map((_, i) => i).filter((i) => left[i] > 0 && ready[i] <= t);
    if (!can.length) continue;
    const pick = can.find((i) => i > last) ?? can[0];
    last = pick;
    left[pick]--;
    const at = t + ONE_WAY;
    slots.push({ who: res[pick].name, from: at, to: at + 1 });
    if (left[pick] === 0) done[res[pick].name] = at + 1;
  }
  // Fill the gaps before and between frames as waiting.
  const filled: GanttSlot[] = [];
  let t = 0;
  for (const s of slots) {
    if (s.from > t) filled.push({ who: "wait", from: t, to: s.from, tone: "muted" });
    filled.push(s);
    t = s.to;
  }
  return { slots: filled, done };
}

function multiplexing(): Walkthrough {
  const res: Res[] = [
    { name: "css", work: 1, size: 1 },
    { name: "js", work: 3, size: 1 },
    { name: "png", work: 1, size: 2 },
  ];
  const a = http11(res);
  const b = http2(res);
  const endA = Math.max(...Object.values(a.done));
  const endB = Math.max(...Object.values(b.done));
  if (!(endB < endA)) throw new Error("multiplexing: HTTP/2 should finish first");
  const UNIT = 28;
  const X0 = 64;
  const tone = (s: GanttSlot): GanttSlot => (s.who === "wait" ? { ...s, who: s.to - s.from >= 2 ? "wait" : "", tone: "muted" } : { ...s, tone: s.who === "js" ? "accent" : "plain" });
  const rowA = gantt("a", a.slots.map(tone), { x: X0, y: 0, unit: UNIT, h: 30, size: 11, ticks: false });
  const rowB = gantt("b", b.slots.map(tone), { x: X0, y: 64, unit: UNIT, h: 30, size: 11, ticks: false });
  const axis = (y: number): Item[] => {
    const items: Item[] = [{ k: "path", id: "ax", pts: [[X0, y], [X0 + endA * UNIT, y]], tone: "line", width: 1 }];
    for (let t = 0; t <= endA; t += 2) items.push(label(`at${t}`, `${t * TICK_MS}`, X0 + t * UNIT, y + 11, { tone: "faint", size: 10, mono: true }));
    items.push(label("ams", "ms", X0 + endA * UNIT + 8, y + 11, { anchor: "start", tone: "faint", size: 10 }));
    return items;
  };
  const head = (id: string, text: string, y: number): Item => label(id, text, X0 - 8, y + 15, { anchor: "end", size: 11.5, tone: "ink", weight: 600 });
  const frames: Frame[] = [
    {
      caption: `HTTP/1.1 on one connection: a request goes out only after the previous response has fully arrived, and each costs a round trip plus the server's time. The slow app.js holds up logo.png behind it; all three are in at ${endA * TICK_MS} ms.`,
      items: [head("ha", "HTTP/1.1", 0), ...rowA.items, ...axis(108)],
    },
    {
      caption: `HTTP/2 sends all three requests at once and interleaves the responses as frames on one connection. While app.js is still being generated, the CSS and the image flow past it, and everything is in at ${endB * TICK_MS} ms.`,
      items: [head("ha", "HTTP/1.1", 0), ...rowA.items, head("hb", "HTTP/2", 64), ...rowB.items, ...axis(108)],
    },
  ];
  // The captions' claims, checked: CSS before the JS on HTTP/2, the image held behind the JS on HTTP/1.1.
  if (!(b.done.css < b.done.js) || !(a.done.png > a.done.js)) throw new Error("multiplexing: ordering claims do not hold");
  return finish({ title: "Three files over one connection: HTTP/1.1 against HTTP/2", input: "style.css, app.js (slow to generate), logo.png; round trip 40 ms", frames });
}

/* ── The TLS 1.3 handshake ────────────────────────────────────────── */

interface Flight {
  /** "C" client to server, "S" server to client. */
  from: "C" | "S";
  msgs: string[];
  /** Encrypted under the handshake or session keys. */
  sealed?: boolean;
  /** Carries the first byte of the HTTP response. */
  response?: boolean;
  /** Which exchange this belongs to, for the round-trip brackets. */
  phase: string;
}

/** Times of each flight when flights alternate and nobody waits for anything but the other side: [depart, arrive] in ms. */
function timeFlights(flights: readonly Flight[], rttMs: number): Array<[number, number]> {
  let t = 0;
  return flights.map((f, i) => {
    if (i > 0 && flights[i - 1].from === f.from) throw new Error("tls: two flights from one side in a row");
    const at: [number, number] = [t, t + rttMs / 2];
    t += rttMs / 2;
    return at;
  });
}

const firstByte = (flights: readonly Flight[], rtt: number) => {
  const times = timeFlights(flights, rtt);
  const i = flights.findIndex((f) => f.response);
  return times[i][1];
};

const TCP: Flight[] = [
  { from: "C", msgs: ["SYN"], phase: "TCP" },
  { from: "S", msgs: ["SYN-ACK"], phase: "TCP" },
];
const SETUPS: Record<string, { flights: Flight[]; noteRtts: number }> = {
  "HTTP over TCP": { flights: [...TCP, { from: "C", msgs: ["ACK", "GET /"], phase: "HTTP" }, { from: "S", msgs: ["200 OK"], response: true, phase: "HTTP" }], noteRtts: 2 },
  "HTTPS, TLS 1.2": {
    flights: [
      ...TCP,
      { from: "C", msgs: ["ACK", "ClientHello"], phase: "TLS" },
      { from: "S", msgs: ["ServerHello", "Certificate", "ServerKeyExchange", "ServerHelloDone"], phase: "TLS" },
      { from: "C", msgs: ["ClientKeyExchange", "ChangeCipherSpec", "Finished"], phase: "TLS" },
      { from: "S", msgs: ["ChangeCipherSpec", "Finished"], phase: "TLS" },
      { from: "C", msgs: ["GET /"], sealed: true, phase: "HTTP" },
      { from: "S", msgs: ["200 OK"], sealed: true, response: true, phase: "HTTP" },
    ],
    noteRtts: 4,
  },
  "HTTPS, TLS 1.3": {
    flights: [
      ...TCP,
      { from: "C", msgs: ["ACK", "ClientHello + key share, SNI"], phase: "TLS" },
      { from: "S", msgs: ["ServerHello + key share", "{Certificate}", "{CertificateVerify}", "{Finished}"], phase: "TLS" },
      { from: "C", msgs: ["{Finished}", "{GET /}"], sealed: true, phase: "HTTP" },
      { from: "S", msgs: ["{200 OK …}"], sealed: true, response: true, phase: "HTTP" },
    ],
    noteRtts: 3,
  },
  "HTTP/3 over QUIC": {
    flights: [
      { from: "C", msgs: ["Initial: ClientHello"], phase: "QUIC" },
      { from: "S", msgs: ["ServerHello", "{Certificate, CertificateVerify, Finished}"], phase: "QUIC" },
      { from: "C", msgs: ["{Finished}", "{GET /}"], sealed: true, phase: "HTTP" },
      { from: "S", msgs: ["{200 OK}"], sealed: true, response: true, phase: "HTTP" },
    ],
    noteRtts: 2,
  },
};

function tls13Handshake(): Walkthrough {
  const RTT_MS = 50;
  for (const [name, s] of Object.entries(SETUPS)) {
    const ms = firstByte(s.flights, RTT_MS);
    if (ms !== s.noteRtts * RTT_MS) throw new Error(`tls13-handshake: ${name} takes ${ms} ms, the note's table says ${s.noteRtts} round trips`);
  }
  const flights = SETUPS["HTTPS, TLS 1.3"].flights;
  const times = timeFlights(flights, RTT_MS);
  const tls12 = firstByte(SETUPS["HTTPS, TLS 1.2"].flights, RTT_MS);

  const LANE = 250;
  const LH = 15;
  const DROP = 18;
  // Lay the flights out top to bottom: each one's text above its arrow, anchored at the sender.
  const yText: number[] = [];
  const yArrow: number[] = [];
  let y = 46;
  flights.forEach((f) => {
    yText.push(y);
    yArrow.push(y + f.msgs.length * LH + 2);
    y = yArrow[yArrow.length - 1] + DROP + 14;
  });
  const L = lifelines("ll", ["client", "server"], { gap: LANE, w: 90, h: 28, length: y - 34 });
  const flightItems = (i: number): Item[] => {
    const f = flights[i];
    const cToS = f.from === "C";
    const x1 = cToS ? L.xOf(0) : L.xOf(1);
    const x2 = cToS ? L.xOf(1) : L.xOf(0);
    const tone: LineTone = f.sealed ? "accent" : f.phase === "TCP" ? "line" : "ink";
    const items: Item[] = [{ k: "edge", id: `f${i}`, x1: x1 + (cToS ? 2 : -2), y1: yArrow[i], x2: x2 + (cToS ? -3 : 3), y2: yArrow[i] + DROP, tone, arrow: true }];
    f.msgs.forEach((m, k) =>
      items.push({ k: "text", id: `f${i}t${k}`, x: x1 + (cToS ? 10 : -10), y: yText[i] + k * LH + 4, text: m, tone: m.startsWith("{") ? "accent" : f.phase === "TCP" ? "soft" : "ink", anchor: cToS ? "start" : "end", size: 12, mono: true }),
    );
    // The client's clock when each server flight lands.
    if (!cToS) items.push(label(`f${i}ms`, `${times[i][1]} ms`, L.xOf(0) - 10, yArrow[i] + DROP, { anchor: "end", size: 11, tone: "soft", mono: true }));
    return items;
  };
  const bracket = (id: string, from: number, to: number, text: string, hot: boolean): Item[] => {
    const bx = L.xOf(1) + 54;
    const y1 = yText[from];
    const y2 = yArrow[to] + DROP;
    return [
      { k: "path", id, pts: [[bx - 5, y1], [bx, y1], [bx, y2], [bx - 5, y2]], tone: hot ? "accent" : "line", width: 1.3 },
      label(`${id}-t`, text, bx + 6, (y1 + y2) / 2, { anchor: "start", size: 11, tone: hot ? "accent" : "soft", weight: 600 }),
    ];
  };
  const shown = (n: number): Item[] => [...L.items, ...Array.from({ length: n }, (_, i) => flightItems(i)).flat()];
  const brackets = (n: number): Item[] => {
    // Round trip r is flights 2r and 2r + 1; it is bracketed once its reply is shown.
    const out: Item[] = [];
    for (let r = 0; 2 * r + 1 < n; r++) out.push(...bracket(`rt${r}`, 2 * r, 2 * r + 1, `round trip ${r + 1}`, 2 * r + 1 === n - 1));
    return out;
  };
  const frames: Frame[] = [
    {
      caption: `TCP first: SYN and SYN-ACK cost one round trip, so the client's clock reads ${times[1][1]} ms before any TLS message has been sent.`,
      items: [...shown(2), ...brackets(2)],
    },
    {
      caption: "The client's ACK goes out with the ClientHello right behind it: the versions and ciphers it supports, its Diffie-Hellman key share and the server name it wants (SNI).",
      items: [...shown(3), ...brackets(3)],
    },
    {
      caption: `The server answers with its own key share. Both sides can now compute the same secret, so everything after the ServerHello is encrypted: the certificate, a signature proving the server holds its private key, and Finished. That is round trip 2, at ${times[3][1]} ms.`,
      items: [...shown(4), ...brackets(4)],
    },
    {
      caption: "The client checks the certificate chain, dates and host name and the signature, sends its own Finished, and puts the first HTTP request on the same flight, already encrypted.",
      items: [...shown(5), ...brackets(5)],
    },
    {
      caption: `The response's first byte arrives after 3 round trips, ${times[5][1]} ms. TLS 1.2 needed a second handshake round trip, so the same request took ${tls12} ms; on a reused connection only the last round trip remains.`,
      items: [...shown(6), ...brackets(6)],
    },
  ];
  return finish({ title: "HTTPS with TLS 1.3: three round trips to the first byte", input: "a new connection, round trip 50 ms", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "message-anatomy": messageAnatomy,
  "cookie-session": cookieSession,
  multiplexing,
  "tls13-handshake": tls13Handshake,
};
