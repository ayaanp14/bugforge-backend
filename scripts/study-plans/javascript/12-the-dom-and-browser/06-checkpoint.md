---
title: Checkpoint — The DOM and the browser
minutes: 24
---
This checkpoint covers the DOM tree and selection, attributes versus properties, `textContent` versus `innerHTML`, batching and reflow; event propagation, `target`/`currentTarget`, delegation, `preventDefault`/`stopPropagation`, custom events; `fetch` semantics, `URL`/`URLSearchParams`, timeouts with `AbortController`, CORS; Web Storage, cookies and their attributes, the History API, observers and workers; the rendering pipeline, loading path, vitals, and the XSS/CSRF defences.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module. The programs model browser mechanisms in Node — a DOM tree, an event dispatcher, a router — because the judge has no browser; the ideas are exactly the browser's.

**Before you start**, make sure you can answer:

- Attribute versus property for `value`; which content API is safe for user data; why `getElementsByClassName` bites when removing.
- The three phases; what `closest` does in a delegated handler; why `stopPropagation` is usually a smell; `passive`.
- Why a 404 does not reject; how to time out a fetch; what a CORS error means and who fixes it.
- The three cookie flags and what each defends; `pushState` versus `popstate`; when to use IndexedDB.
- Which CSS properties skip layout; `defer` versus `async`; the layered XSS defences; the CSRF defence.

The programs are a virtual-DOM differ that emits a minimal patch list, a client-side router with parameterised routes and a history stack, and a stale-while-revalidate fetch cache modelled with timers.
