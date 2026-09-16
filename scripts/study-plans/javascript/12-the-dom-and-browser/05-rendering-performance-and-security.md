---
title: Rendering performance and front-end security — the two things a page must not get wrong
minutes: 13
---
A page can be correct and still fail its users in two ways: it can be **slow** — janky scrolling, a spinner over a white screen, an input that lags behind the keyboard — or it can be **unsafe** — a comment field that runs someone else's script in your users' sessions. Both have well-understood causes and defences. This lesson covers how the browser turns DOM and CSS into pixels and what makes that expensive; the loading path from HTML to interactive; the measurement tools and the vitals; then the front-end threat model: XSS and its defences (escaping, `textContent`, sanitisers, CSP), CSRF and `SameSite`, clickjacking, open redirects, third-party scripts and dependency risk.

## From DOM to pixels

The browser builds the DOM and CSSOM, combines them into a **render tree**, computes **layout** (geometry: where everything is and how big), **paints** (draws pixels into layers), then **composites** the layers onto the screen. JavaScript can dirty any stage: changing text or a class → style recalculation → layout → paint → composite; changing only `transform`/`opacity` on a promoted layer → composite only (cheap — this is why animations use those two properties). Layout is proportional to the affected subtree; a change to `font-size` on `body` relays out everything. `requestAnimationFrame` batches your visual writes to just before the next frame; the frame budget at 60 Hz is **16.7 ms** for everything — your JavaScript, style, layout, paint. A 30 ms handler drops frames.

**Layout thrashing** (module lesson 1): interleaved reads (`offsetHeight`, `getBoundingClientRect`) and writes force synchronous layout per iteration. Read first, then write; or use `IntersectionObserver`/`ResizeObserver` instead of measuring in scroll handlers.

## The loading path

HTML streams in and parses; a `<script>` without `defer`/`async` **blocks parsing** until it downloads and runs (put scripts at the end or use `defer`, which runs in order after parsing; `async` runs as soon as downloaded, unordered — for independent scripts like analytics); CSS in `<head>` blocks rendering until loaded (critical CSS inline, the rest deferred); fonts can block text (`font-display: swap`); images without dimensions cause layout shifts (set `width`/`height` or `aspect-ratio`). Code splitting (dynamic `import()` per route), lazy-loading images (`loading="lazy"`), preloading the critical request (`<link rel="preload">`), compression and caching headers, and shipping less JavaScript are the levers — the last one dwarfs the rest.

## Measuring

Core Web Vitals name what users feel: **LCP** (Largest Contentful Paint — when the main content shows, target < 2.5 s), **INP** (Interaction to Next Paint — input responsiveness, < 200 ms), **CLS** (Cumulative Layout Shift — things jumping, < 0.1). DevTools' Performance panel shows the frame timeline (long tasks > 50 ms block input); Lighthouse audits the loading path; `PerformanceObserver` reports vitals from real users (RUM). Measure before optimising; the profile usually points at one or two culprits — a large bundle, a synchronous layout loop, an unbatched render.

## Rendering strategies

Manual DOM updates get slow to *write correctly* long before they get slow to *run*; a **virtual DOM** (React) or **fine-grained reactivity** (Solid, Vue, Svelte) exists to keep UI = f(state) while batching writes and updating only what changed. A virtual DOM diff compares two trees and emits patches (props changed, children inserted/removed/moved — keys make moves cheap). Server rendering (SSR) and static generation send HTML first so LCP does not wait for JavaScript; hydration then attaches behaviour. The trade-offs are the frameworks' whole subject; the principle is constant: batch, diff, and touch the real DOM as little as possible.

## XSS — the front-end vulnerability

Cross-site scripting: attacker-controlled text is rendered as **markup**, so their `<script>` or `onerror=` runs with your users' cookies, storage and API access. Sources: `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` with data, `javascript:` and `data:` URLs in `href`/`src`, `eval`/`new Function` on data, unsanitised markdown, server templates without auto-escaping. Defences, in layers:

1. **Render text as text**: `textContent`, `createElement` + properties, framework bindings (React escapes `{value}`; `dangerouslySetInnerHTML` is the escape hatch with the warning in its name).
2. **Escape** at the point of insertion when markup is unavoidable: `& < > " '` → entities — context-aware (attribute, URL and script contexts differ).
3. **Sanitise** untrusted HTML that must stay HTML (user-authored rich text) with an allow-list library (DOMPurify) — never a hand-written regex.
4. **Content Security Policy** header: `script-src 'self'` (no inline scripts, no `eval`, only your origin) turns most XSS into a blocked-script console message; nonces/hashes for necessary inline scripts; `object-src 'none'`; report violations.
5. **HttpOnly** session cookies so a successful XSS cannot exfiltrate the session; tokens in memory rather than storage.

## CSRF, clickjacking, redirects

**CSRF**: a malicious page makes the user's browser send a request to your site, with the user's cookies attached automatically. Defences: `SameSite=Lax/Strict` cookies (blocks the cross-site POST), anti-CSRF tokens in forms/headers for legacy cases, checking `Origin`/`Sec-Fetch-Site` headers, and never performing state changes on GET. **Clickjacking**: your page framed invisibly over a decoy so clicks land on your buttons — `Content-Security-Policy: frame-ancestors 'none'` (or `X-Frame-Options`). **Open redirects**: `?next=https://evil` after login — allow only relative paths or an allow-list. `target="_blank"` links get `rel="noopener"` by default now; add `noreferrer` when the destination should not learn the referrer.

## Third parties and dependencies

Every `<script src="https://cdn…">` runs with full page privileges; a compromised CDN or tag manager is a total compromise. Pin with Subresource Integrity (`integrity="sha384-…"`), self-host where possible, limit with CSP, and audit the npm tree (module 9) — a front-end bundle is as much other people's code as a server. Store nothing in the page a script should not read.

## Common mistakes

- Animating `top`/`left`/`width` instead of `transform`; measuring layout inside scroll handlers.
- Blocking `<script>` tags in `<head>`; images without dimensions (CLS); one giant bundle.
- `innerHTML` with any user-influenced string; sanitising with a regex; `href` from data without a scheme allow-list.
- No CSP, or a CSP with `'unsafe-inline'` that defends nothing; session cookies without `HttpOnly`/`SameSite`.
- State-changing GET endpoints; `next=` redirects without validation; third-party scripts without SRI.

## Interview angle

- *"What happens between a DOM change and pixels?"* Style → layout → paint → composite; `transform`/`opacity` skip layout and paint.
- *"`defer` versus `async`?"* Both download in parallel; `defer` runs in order after parsing, `async` as soon as it arrives, unordered.
- *"What is XSS and how do you prevent it?"* Untrusted text rendered as markup; render as text, escape, sanitise with an allow-list, CSP, HttpOnly cookies.
- *"What is CSRF and the modern defence?"* Cross-site requests riding the user's cookies; `SameSite` cookies plus tokens where needed; no state changes on GET.
- *"Name the Core Web Vitals."* LCP (loading), INP (responsiveness), CLS (visual stability).

## Key takeaways

- Style → layout → paint → composite; batch writes, avoid read/write interleaving, animate `transform`/`opacity`, stay inside the 16.7 ms frame.
- Loading: `defer` scripts, critical CSS, image dimensions, code splitting, less JavaScript; measure LCP/INP/CLS.
- XSS: text as text, escape, sanitise with an allow-list, CSP without `'unsafe-inline'`, HttpOnly cookies.
- CSRF: `SameSite` cookies and tokens, no GET mutations; `frame-ancestors` against clickjacking; validate redirects.
- Third-party scripts are full-privilege code: SRI, self-host, CSP, audit.
