---
title: Storage, cookies, history and the browser APIs worth knowing by name
minutes: 12
---
A page has several places to keep state between reloads and several ways to observe the world around it, and each has a shape that decides what it is good for: `localStorage` is a small synchronous string dictionary; cookies travel to the server with every request and carry security attributes; IndexedDB is a real asynchronous database; the History API lets a single-page app own the URL. Around them sit the observer APIs that replaced polling and scroll handlers, and workers that give the page real threads. This lesson is a working map — what each API is, its one rule, and which task it fits — with the security flags that matter on cookies.

## Web Storage: `localStorage` and `sessionStorage`

```js
localStorage.setItem("theme", "dark");            // strings only — objects become "[object Object]"
localStorage.setItem("prefs", JSON.stringify(prefs));
const prefs = JSON.parse(localStorage.getItem("prefs") ?? "{}");   // getItem → null when missing
localStorage.removeItem("theme"); localStorage.clear(); localStorage.length; localStorage.key(0);
window.addEventListener("storage", (e) => { e.key; e.oldValue; e.newValue; });   // fires in OTHER tabs of the same origin
```

Per **origin**, synchronous, ~5 MB, survives reloads and restarts (`localStorage`) or lives for one tab (`sessionStorage`). Rules: values are strings (serialise), reads block the main thread (fine for small values, not for a loop), it is readable by any script on the origin (never store secrets or tokens you would not hand to an XSS), it can be disabled or full (`setItem` throws `QuotaExceededError` — wrap in `try`), and the `storage` event is a free cross-tab channel. Good for: preferences, drafts, a small cache, the theme. Not for: large data, sensitive data, anything a server must trust.

## Cookies

```http
Set-Cookie: session=abc123; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax
```

Cookies are set by the server (or by `document.cookie = "k=v; …"` for non-HttpOnly ones) and sent automatically with matching requests — that automatic sending is both their purpose (sessions) and their risk (CSRF). The attributes:

- **`Secure`** — only over HTTPS.
- **`HttpOnly`** — invisible to `document.cookie`; the session cookie is unreadable by injected scripts. Always for session ids.
- **`SameSite`** — `Strict` (never sent on cross-site requests), `Lax` (sent on top-level navigations with safe methods, not on cross-site POSTs or subresources — the default in modern browsers), `None` (sent everywhere; requires `Secure`). `Lax`/`Strict` is the modern CSRF defence; anti-CSRF tokens remain for `None`.
- **`Path`**, **`Domain`** — which URLs and hosts receive it; a `Domain=example.com` cookie reaches subdomains.
- **`Max-Age`/`Expires`** — otherwise a session cookie deleted when the browser closes. ~4 KB each.

Reading `document.cookie` gives `"a=1; b=2"` — parse it; writing sets one cookie at a time. Cookies go with every request to the origin, so they cost bandwidth; keep them small (an id, not the data).

## IndexedDB, and the Cache API

**IndexedDB** is an asynchronous, transactional, object-store database per origin with indexes and hundreds of megabytes of room — for offline data, large caches, files. Its raw API is verbose and event-based; use a wrapper (`idb`) that promisifies it. **Cache API** (`caches.open`) stores request/response pairs and is the store service workers use for offline assets. Rule of thumb: small config → `localStorage`; structured or large data → IndexedDB; HTTP responses for offline → Cache API; everything server-side → the server.

## URL, location and history

```js
location.href; location.pathname; location.search; location.hash; location.origin;
location.assign(url); location.replace(url);            // navigate (replace: no history entry); location.reload()
history.pushState({ page: 2 }, "", "/items?page=2");    // change the URL WITHOUT a load — the SPA router primitive
history.replaceState(state, "", url);                  // rewrite the current entry
history.back(); history.forward(); history.go(-2);
window.addEventListener("popstate", (e) => render(location.pathname, e.state));   // back/forward pressed — pushState does NOT fire it
window.addEventListener("hashchange", …);              // for #-based routing
```

A client-side router is: intercept link clicks (same-origin, no modifier keys) → `pushState` → render; listen to `popstate` → render. The server must serve the app shell for every route (or the deep link 404s on refresh). `state` is stored with the entry (structured-clone-able, small). Scroll restoration and focus management are the router's job too.

## Observers

- **`IntersectionObserver`** — "is this element visible / near the viewport?" without scroll handlers: lazy-load images, infinite scroll, analytics impressions. Callback with entries and `isIntersecting`; thresholds; `rootMargin` to prefetch early.
- **`ResizeObserver`** — element size changes (not just window resize): responsive components, canvas sizing.
- **`MutationObserver`** — DOM changes (children, attributes, text) — for integrating with code that mutates the DOM outside your control; batched, asynchronous.
- **`PerformanceObserver`** — long tasks, layout shifts, paint timings (Core Web Vitals).

Observers are asynchronous and batched; they replace polling and per-event handlers with something the browser can schedule efficiently.

## Timing and frames

`requestAnimationFrame(cb)` runs before the next paint — for visual updates and measuring; `requestIdleCallback` when the browser is idle — for non-urgent work; `setTimeout`/`setInterval` as in Node but clamped in background tabs; `performance.now()` monotonic time; `performance.mark/measure` for custom timing; `document.visibilityState` + `visibilitychange` to pause work in hidden tabs.

## Workers and the rest

**Web Workers** run scripts on another thread with message passing (`postMessage`/`onmessage`, structured clone or transfer) — for CPU-heavy work (parsing, image processing, crypto) so the UI stays responsive; no DOM access. **Service Workers** are a network proxy for the origin: offline caching, push notifications, background sync — the base of PWAs. Others to recognise: `navigator.clipboard` (async, permission-gated), `Notification` (permission), `Geolocation`, `matchMedia` (media queries in JS), `Blob`/`File`/`FileReader`/`URL.createObjectURL`, `structuredClone`, `BroadcastChannel` (cross-tab messaging without storage), `Intl` (module 10), Canvas/WebGL/WebAudio, `crypto.subtle`. Each is permission- and feature-detected: `if ("clipboard" in navigator)`.

## Common mistakes

- Objects into `localStorage` without `JSON.stringify`; no `try` around `setItem`; secrets in storage.
- Session cookies without `HttpOnly`/`Secure`/`SameSite`; `SameSite=None` without `Secure`.
- Expecting `popstate` after your own `pushState`; SPA routes that 404 on refresh because the server does not serve the shell.
- Scroll handlers for visibility instead of `IntersectionObserver`; `setInterval` polling for DOM changes instead of `MutationObserver`.
- Heavy computation on the main thread when a worker was available.

## Interview angle

- *"`localStorage` versus cookies?"* Client-only string store, not sent to the server, readable by any script; cookies travel with requests, carry security attributes, are the session mechanism.
- *"What do `HttpOnly`, `Secure` and `SameSite` do?"* Hide from JavaScript; HTTPS only; restrict cross-site sending (CSRF defence).
- *"How does a single-page router change the URL?"* `history.pushState` + render; `popstate` for back/forward; server serves the shell for all routes.
- *"How would you lazy-load images?"* `IntersectionObserver` with a `rootMargin`, or `loading="lazy"`.
- *"When do you use a Web Worker?"* CPU-bound work that would block the UI thread; communicate by messages.

## Key takeaways

- Web Storage: per-origin, synchronous, strings, ~5 MB, readable by XSS; `storage` event across tabs; `try` around writes.
- Cookies: sent automatically; `Secure` + `HttpOnly` + `SameSite=Lax/Strict` for sessions; small.
- IndexedDB for structured/large data (use a wrapper); Cache API for offline responses.
- `pushState`/`popstate` are the SPA router; the server must serve the shell everywhere.
- Observers (Intersection/Resize/Mutation/Performance) over polling; `requestAnimationFrame` for visuals; workers for CPU work.
