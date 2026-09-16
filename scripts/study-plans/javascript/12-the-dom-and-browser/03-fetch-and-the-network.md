---
title: fetch, URLs, CORS and talking to servers
minutes: 13
---
`fetch` is how a page (and, since Node 18, a server) talks HTTP: a promise of a `Response`, from which you read a body once. It looks simple and hides four decisions that every client gets wrong at least once — a 404 is **not** a rejection, a body can be read only once, requests to other origins are governed by CORS (which the browser enforces and the server configures), and nothing times out unless you make it. This lesson covers the request and response objects, error handling done right, JSON in and out, `URL`/`URLSearchParams` for building addresses, `AbortController`, CORS as a mental model, credentials and cookies, and the tools beyond `fetch` — SSE and WebSockets.

## The shape

```js
const res = await fetch("/api/users?limit=10", {
  method: "POST",                                        // GET by default
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ name }),                        // string | FormData | URLSearchParams | Blob | ArrayBuffer | ReadableStream
  signal: controller.signal,                             // cancellation / timeout
  credentials: "same-origin",                            // "include" to send cookies cross-origin (server must allow)
});
res.ok;            // status 200–299
res.status;        // 404
res.headers.get("content-type");
const data = await res.json();      // parses the body — ONCE; also .text(), .blob(), .arrayBuffer(), .formData(), res.body (a stream)
```

`fetch` **rejects only on network failure** (DNS, connection refused, CORS blocked, aborted). A 404 or 500 resolves normally with `ok: false`. Every client needs the check:

```js
async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");                       // read what the server said, if anything
    throw new HttpError(res.status, `${init?.method ?? "GET"} ${url} → ${res.status}`, detail);
  }
  return res.json();                                                       // may itself throw SyntaxError on non-JSON
}
```

The body is a stream consumed once: `await res.json()` after `await res.text()` throws `body used already`. `res.clone()` before reading if two consumers need it.

## Building URLs

```js
const url = new URL("/api/search", location.origin);            // absolute from a base; new URL("../x", base) resolves relative paths
url.searchParams.set("q", userText);                            // encoded correctly — "a b&c" → "a+b%26c"
url.searchParams.append("tag", "x"); url.searchParams.append("tag", "y");   // repeated keys
url.pathname = `/api/users/${encodeURIComponent(id)}`;          // path segments need encodeURIComponent
String(url);                                                     // "https://…/api/users/42?q=a+b%26c&tag=x&tag=y"
Object.fromEntries(new URL(location.href).searchParams);         // read the current page's query
```

Never concatenate query strings by hand; `URLSearchParams` handles encoding, repeats and ordering. Distinguish `encodeURIComponent` (a single value — encodes `/ ? & =`) from `encodeURI` (a whole URL — leaves them). Module 9 covered the same classes in Node.

## Timeouts, cancellation, retries

```js
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 8000);
try {
  return await getJson(url, { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") throw new Error(`timed out: ${url}`);
  throw err;
} finally {
  clearTimeout(timer);
}
```

`fetch` never times out by itself. Abort also when the user navigates away or types a new search (cancel the previous request so a slow old response cannot overwrite a fast new one — the *race* bug). Retry only idempotent requests (GET, PUT, DELETE with care) on network errors and 5xx/429, with backoff and jitter (module 8), honouring `Retry-After`. A 4xx is the client's fault; retrying it repeats the mistake.

## CORS, as a mental model

The **same-origin policy**: a page at `https://app.example` may read responses only from `https://app.example` (scheme + host + port). To read from `https://api.example`, the **server** must opt in with `Access-Control-Allow-Origin: https://app.example` (or `*` — never with credentials). **Simple** requests (GET/HEAD/POST with form-ish content types, no custom headers) are sent directly and the browser checks the response header. Anything else — `Content-Type: application/json`, an `Authorization` header, PUT/DELETE — triggers a **preflight** `OPTIONS` request first; the server answers with `Access-Control-Allow-Methods/Headers` (and `Max-Age` to cache it). Cookies cross-origin need `credentials: "include"` on the client and `Access-Control-Allow-Credentials: true` plus an explicit origin on the server.

Consequences: CORS is enforced by the **browser**, not by curl or Node; a "CORS error" means the *server* did not allow it (or preflight failed); the request may have reached the server even though your code cannot read the response; and CORS protects users from malicious pages, not APIs from clients — authentication does that.

## Sending data

JSON body with `Content-Type: application/json` for APIs; `FormData` (multipart, no content-type header — the browser sets the boundary) for files; `URLSearchParams` as a body for form-encoded endpoints. Responses: check `content-type` before `json()` when a server may return HTML error pages; treat a `204` as having no body. Compression, caching (`Cache-Control`, `ETag`/`If-None-Match`) and content negotiation are headers you set once and forget.

## Cookies and tokens

Session cookies set by the server with `HttpOnly` cannot be read by JavaScript (good: XSS cannot steal them) and are sent automatically same-origin; `SameSite=Lax` (default) blocks most cross-site sending — the CSRF defence. Bearer tokens in an `Authorization` header are sent by your code, work cross-origin, and must be stored somewhere JavaScript can read (memory is safest; `localStorage` is readable by any XSS). The module on storage goes further.

## Beyond request/response

- **Server-Sent Events** (`new EventSource(url)`): server → client stream of text events over one HTTP connection, auto-reconnecting; simple and firewall-friendly for feeds, progress, live updates.
- **WebSocket** (`new WebSocket(url)`): bidirectional, low-latency messages; needs its own reconnection and heartbeats; for chat, games, collaborative editing.
- **Streaming `fetch`**: `res.body.getReader()` reads chunks as they arrive — progress bars, incremental rendering.
- **`navigator.sendBeacon`**: fire-and-forget analytics that survives page unload.
- `XMLHttpRequest` is the pre-2015 API — upload progress events are its one remaining advantage.

## Common mistakes

- Treating a resolved `fetch` as success; not reading the error body.
- Reading the body twice; `res.json()` on HTML.
- Hand-built query strings; `encodeURI` for a value.
- No timeout; not aborting superseded requests (stale response wins the race).
- Retrying POSTs or 4xx; expecting CORS to be fixable from the client; `*` with credentials.
- Tokens in `localStorage` without weighing XSS; `credentials: "include"` when same-origin was enough.

## Interview angle

- *"Does `fetch` reject on a 404?"* No — only on network failure or abort; check `res.ok`.
- *"What is CORS?"* Browser-enforced relaxation of the same-origin policy: the server declares which origins may read its responses; non-simple requests preflight with OPTIONS.
- *"How do you time out a fetch?"* `AbortController` + `setTimeout(abort)`, clear in `finally`; also abort superseded requests.
- *"Why can't `res.json()` be called twice?"* The body is a one-shot stream; `clone()` first if needed.
- *"Where do you store an auth token?"* HttpOnly cookie with SameSite (not readable by JS) or in memory; `localStorage` is exposed to XSS.

## Key takeaways

- `fetch` resolves for any HTTP status; check `res.ok`, read the error body, throw a typed error; parse the body once.
- Build URLs with `URL`/`URLSearchParams`; `encodeURIComponent` for values in paths.
- Timeouts and cancellation via `AbortController`; retry only idempotent requests with backoff; abort stale requests.
- CORS is the server allowing origins, enforced by the browser; preflights for non-simple requests; credentials need explicit origins.
- SSE for server push, WebSocket for bidirectional, streaming fetch for incremental bodies.
