---
title: Events — propagation, delegation and the event object
minutes: 13
---
Everything a user does reaches your code as an **event** dispatched on a DOM node and travelling through the tree — down from the document to the target (**capture**), then back up (**bubble**). Understanding that path explains delegation (one listener on a parent handling thousands of children), why `stopPropagation` is usually the wrong fix, what `target` and `currentTarget` mean, and how a framework's synthetic event system works. This lesson covers the listener API, the three phases, the event object and its defaults, delegation, custom events, and the listener-lifecycle mistakes that leak memory.

## Listening

```js
button.addEventListener("click", onClick);                       // any number of listeners per event
button.addEventListener("click", onClick, { once: true });       // auto-removed after the first call
window.addEventListener("scroll", onScroll, { passive: true });  // promise never to preventDefault → smoother scrolling
button.removeEventListener("click", onClick);                    // needs the SAME function reference — arrows inline cannot be removed
const ac = new AbortController();
el.addEventListener("input", onInput, { signal: ac.signal });    // ac.abort() removes every listener registered with the signal
el.onclick = fn;                                                 // the property form — one handler only; avoid
```

Listeners run in registration order, synchronously, before `dispatchEvent` returns. An exception in one does not stop the others (it is reported as an uncaught error). `this` inside a non-arrow listener is `currentTarget`.

## The three phases

Dispatching `click` on a `<button>` inside `<li>` inside `<ul>` inside `<body>`:

1. **Capture**: `window → document → html → body → ul → li` — listeners registered with `{ capture: true }` fire, outermost first.
2. **Target**: listeners on `button` fire (both capture and bubble ones, in registration order).
3. **Bubble**: `li → ul → body → html → document → window` — ordinary listeners fire, innermost first.

Most events bubble (`click`, `input`, `keydown`, `submit`); a few do not (`focus`/`blur` — use `focusin`/`focusout`; `load`, `scroll` on elements, `mouseenter`/`mouseleave`). `event.eventPhase` says which phase is running; `event.composedPath()` lists the route (including shadow DOM boundaries).

## The event object

```js
el.addEventListener("click", (e) => {
  e.type;            // "click"
  e.target;          // the element the event happened ON (deepest) — a <span> inside the button, perhaps
  e.currentTarget;   // the element this listener is attached to — what you usually want
  e.preventDefault();      // cancel the browser's default action: following a link, submitting a form, typing a character, checkbox toggle
  e.stopPropagation();     // no further nodes in the path receive it (listeners on THIS node still run)
  e.stopImmediatePropagation();   // not even the remaining listeners on this node
  e.defaultPrevented; e.bubbles; e.cancelable; e.timeStamp; e.isTrusted;   // isTrusted: false for synthetic dispatchEvent
  // per-type fields: e.key / e.code (keyboard), e.clientX / e.button (pointer), e.data (input), e.deltaY (wheel)
});
```

`preventDefault` and `stopPropagation` are independent: cancelling a form's submit does not stop the event bubbling, and stopping the bubble does not cancel the submit. Passive listeners cannot `preventDefault` (the call is ignored with a warning) — that promise is what lets the browser scroll before your handler runs.

## Delegation

```js
list.addEventListener("click", (e) => {
  const item = e.target.closest("[data-id]");        // walk up from the deepest element to the item container
  if (!item || !list.contains(item)) return;         // clicked between items, or outside
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "remove") remove(item.dataset.id);
});
```

One listener on the container handles every current *and future* child: no per-item wiring, no leaks when items are removed, one function to maintain. `e.target` is wherever the click landed (an icon inside a button inside the item), so `closest` climbs to the element you care about. Every framework's event system is delegation at the root plus a lookup table.

## `stopPropagation` — mostly a smell

Stopping propagation to keep an outer handler from running couples the two handlers invisibly: the outer one (analytics, a "click outside to close" handler, a delegated listener) silently never sees the event. Prefer letting events bubble and having the outer handler check `e.target` (`if (dialog.contains(e.target)) return`). Legitimate uses are rare: nested interactive components with genuinely conflicting semantics.

## Custom events

```js
const ev = new CustomEvent("cart:add", { detail: { id, qty }, bubbles: true, cancelable: true });
const notCancelled = item.dispatchEvent(ev);     // false if a listener called preventDefault
document.addEventListener("cart:add", (e) => e.detail.id);
```

Custom events decouple components: the item announces, anyone listens, nobody imports anybody. `bubbles: true` if a distant ancestor should hear it; `detail` carries the payload. In Node the same shape is `EventEmitter`/`EventTarget` (module 9).

## Input, change, keyboard, pointer

`input` fires on every keystroke/paste (value changing); `change` on commit (blur for text, immediately for checkboxes/selects). `keydown` (repeats while held, cancelable — the one for shortcuts; use `e.key` like `"Enter"`/`"a"`, `e.code` for physical position) versus `keyup`; `keypress` is deprecated. Pointer events (`pointerdown/move/up`) unify mouse, touch and pen; `click` still fires for taps and for keyboard activation of buttons (accessibility for free — do not replace buttons with divs). `submit` fires on the **form**, not the button; handle it there and call `e.preventDefault()` for JavaScript submission.

## Lifecycle and leaks

A listener keeps its closure alive, and the closure keeps whatever it references. Adding a listener on `window`/`document` from a component and never removing it leaks the component; adding a listener per render leaks n copies. Remove in teardown (frameworks' unmount hooks), or use `{ signal }` with one `AbortController` per component, or delegate to a parent that lives as long as the children. Listeners on a removed element go away with it — if nothing else references the element.

## Common mistakes

- `removeEventListener` with a fresh arrow (nothing removed).
- Using `target` where `currentTarget` was meant (the click landed on a child).
- `stopPropagation` to silence an outer handler; `preventDefault` on a passive listener.
- Listening for `submit` on the button, `change` when `input` was needed, `keypress` at all.
- Adding listeners in a loop over items instead of delegating; forgetting teardown.
- Replacing `<button>` with a `<div onclick>` and losing keyboard/AT accessibility.

## Interview angle

- *"Explain event propagation."* Capture down from `window` to the target, target phase, bubble back up; `capture: true` listens on the way down.
- *"`target` versus `currentTarget`?"* Where the event originated versus where the listener is attached.
- *"What is event delegation and why use it?"* One listener on an ancestor handling descendants via `closest`; fewer listeners, works for future children, no per-item cleanup.
- *"`preventDefault` versus `stopPropagation`?"* Cancel the browser's default action versus stop the event travelling further; independent.
- *"What does `{ passive: true }` do?"* Declares the listener will not `preventDefault`, letting the browser scroll immediately.

## Key takeaways

- `addEventListener(type, fn, { once, passive, capture, signal })`; remove with the same reference or a signal; listeners run synchronously in order.
- Capture (down) → target → bubble (up); most events bubble; `focus`/`blur` do not (`focusin`/`focusout` do).
- `target` is where it happened, `currentTarget` where you listened; `preventDefault` and `stopPropagation` are independent.
- Delegate with one ancestor listener + `closest`; avoid `stopPropagation` as coupling.
- `CustomEvent` with `detail` for component communication; `submit` on the form; `input` vs `change`; `keydown` + `e.key`.
