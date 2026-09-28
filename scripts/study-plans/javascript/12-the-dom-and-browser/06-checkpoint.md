---
title: Checkpoint — The DOM and the browser
minutes: 24
seo-title: DOM and Browser APIs Quiz: Events, Fetch and CORS Practice
description: Test your browser JavaScript with 12 questions and three programs on the DOM, event propagation, fetch and CORS, cookies and storage, rendering, XSS and CSRF.
q: Why does getElementsByClassName skip elements when you remove them in a loop?
a: It returns a live `HTMLCollection` that updates as the DOM changes. Removing the element at index 0 shifts the next one into index 0 while the loop moves on to index 1, so every other element is skipped. Loop over a static `querySelectorAll` result, or copy the collection into an array first.
q: What does closest do in a delegated event handler?
a: `e.target.closest(selector)` walks up from the element the event landed on, perhaps an icon inside a button, to the nearest ancestor, or the element itself, that matches the selector. In a delegated listener it finds the item that was actually clicked, and returns `null` when the click fell between items.
q: Why is stopPropagation usually a code smell?
a: Stopping propagation to keep an outer handler from running couples the two handlers invisibly: analytics, a "click outside to close" handler or a delegated listener higher up silently never sees the event. Let events bubble and have the outer handler check `e.target` instead, for example returning early when the dialog contains it.
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
