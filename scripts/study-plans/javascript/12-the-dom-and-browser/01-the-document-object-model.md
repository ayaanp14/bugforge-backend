---
title: The DOM — the tree behind the page, and how to change it safely
minutes: 13
---
The browser parses HTML into a tree of objects — the **Document Object Model** — and hands JavaScript a live handle to it: `document`. Everything a page does after it loads is a DOM operation: find a node, read or change it, create or remove one, and let the browser repaint. The API is large but shaped by a few ideas — nodes versus elements, attributes versus properties, live versus static collections, and the one method (`innerHTML`) that is both the most convenient and the most dangerous. This lesson covers the tree, selection, reading and writing, creation and removal, the reflow cost model, and the escaping rule that keeps user data from becoming code.

## Nodes and elements

Every part of the document is a `Node`: elements (`<div>`), text nodes (the words between tags — whitespace included), comments, and the document itself. **Elements** are the nodes with tags, attributes and children; the text inside them is a separate child node. `Node.nodeType` (1 element, 3 text, 9 document), `parentNode`, `childNodes` (all nodes) versus `children` (elements only), `firstElementChild`, `nextElementSibling`. Most code works at the element level and treats text as a property of its parent (`textContent`).

## Selecting

```js
document.getElementById("app");                        // fastest for ids
document.querySelector("#app .item.active");           // first match of any CSS selector, or null
document.querySelectorAll("li[data-id]");              // ALL matches — a static NodeList (a snapshot)
element.querySelector("…");                            // scoped to that subtree
element.closest("[data-action]");                      // nearest ancestor (or self) matching — the delegation primitive
element.matches(".item");                              // does this element match?
document.getElementsByClassName("x");                  // a LIVE HTMLCollection — changes as the DOM does
```

`querySelectorAll` returns a **static** `NodeList`: iterable with `for…of`/`forEach`, spread to an array for `map`. `getElementsBy*` return **live** collections — iterate them while removing elements and you skip every other one (the classic bug). Selectors are the CSS engine's: attribute selectors, `:not()`, `:nth-child`, `>` child and descendant combinators all work.

## Reading and writing content

```js
el.textContent;                 // all text of the subtree, no markup; setting it REPLACES children with one text node — safe for untrusted data
el.innerText;                   // rendered text only (respects CSS display/visibility); slower — forces layout
el.innerHTML;                   // the markup; setting it PARSES the string as HTML — never with untrusted data
el.insertAdjacentHTML("beforeend", html);   // parse and insert without replacing existing children
```

Rule: **`textContent` for data, `innerHTML` only for markup you built from trusted parts**. `el.innerHTML = "<b>" + userName + "</b>"` is an XSS vulnerability the moment `userName` contains `<img src=x onerror=…>`. If you must build markup from data, escape it (`& < > " '` → entities) or build elements with `createElement` and set `textContent`.

## Attributes versus properties

```html
<input id="q" value="initial" class="wide" data-user-id="42">
```

```js
q.getAttribute("value");   // "initial" — the HTML attribute, what was in the markup (and what you set with setAttribute)
q.value;                   // the current value the user typed — a PROPERTY of the element object
q.value = "x";             // changes what is shown; the attribute stays "initial"
q.className;               // "wide"         q.classList.add("active"); q.classList.toggle("open", isOpen); q.classList.contains("x")
q.dataset.userId;          // "42" — data-* attributes, kebab-case → camelCase, always strings
q.hidden = true;           // boolean property ↔ the `hidden` attribute; el.disabled, el.checked likewise
q.style.backgroundColor = "red";   // inline style — prefer classes; getComputedStyle(q).color reads the final value
```

Attributes are strings in the markup; properties are the live object's state. For most attributes they reflect each other (`id`, `class`↔`className`, `href`, `disabled`), but `value` and `checked` split into "default" (attribute) and "current" (property) after user interaction — the source of "why does getAttribute return the old value". Use properties in code; use `setAttribute` for custom or ARIA attributes.

## Creating, inserting, removing

```js
const li = document.createElement("li");
li.textContent = item.name;
li.dataset.id = item.id;
li.append(icon, " ", label);                 // append: several nodes and strings; appendChild: one node
list.prepend(li);  li.before(x);  li.after(y);  li.replaceWith(z);  li.remove();
list.insertBefore(li, list.firstChild);       // the older API
const clone = template.content.cloneNode(true);   // <template> + cloneNode for repeated markup

const frag = document.createDocumentFragment();   // build off-screen, insert once
for (const item of items) frag.append(renderItem(item));
list.replaceChildren(frag);                       // one DOM mutation instead of n
```

Inserting a node that is already in the document **moves** it. Removing a node leaves it in memory as long as you hold a reference (and its listeners with it).

## Reflow, repaint, and batching

Changing geometry (size, position, font, adding elements) makes the browser recompute layout (**reflow**); changing colours only repaints; transforms and opacity can be composited without either. Reading a layout property (`offsetHeight`, `getBoundingClientRect()`, `getComputedStyle`) after a write forces a synchronous reflow so the read is accurate — a loop that writes then reads per item ("layout thrashing") reflows n times. Batch: read everything first, then write everything; build in a fragment and insert once; toggle a class instead of setting several styles; use `requestAnimationFrame` for visual updates so they land once per frame. Frameworks' virtual DOMs exist to do this batching for you.

## Forms

`form.elements.name`, `input.value` (always a string — convert), `checkbox.checked`, `select.value`/`selectedOptions`, `input.valueAsNumber`/`valueAsDate`, `new FormData(form)` for all fields at once (`Object.fromEntries(new FormData(form))`), `form.requestSubmit()`, and the constraint API (`input.validity`, `required`, `pattern`, `setCustomValidity`) for validation the browser renders. Always validate again on the server.

## Common mistakes

- `innerHTML` with user data (XSS); `innerText` in loops (forces layout).
- Iterating a live `getElementsByClassName` collection while removing elements.
- Reading `getAttribute("value")` for the current input value; setting `style` in loops instead of a class.
- One DOM insertion per item instead of a fragment; write-read-write-read layout thrashing.
- Forgetting that `querySelector` returns `null` (then `.textContent` throws).
- Holding references to removed nodes (and their listeners) forever.

## Interview angle

- *"Attribute versus property?"* Markup string versus live object state; `value`/`checked` diverge after user input.
- *"`textContent` versus `innerHTML` versus `innerText`?"* Text (safe) versus parsed markup (XSS risk) versus rendered text (layout cost).
- *"Live versus static collections?"* `getElementsBy*` update as the DOM changes; `querySelectorAll` is a snapshot.
- *"What is reflow and how do you minimise it?"* Layout recomputation after geometry changes; batch writes, avoid interleaved reads, use fragments and classes.
- *"How do you safely render user input?"* `textContent`, or escape entities before any `innerHTML`.

## Key takeaways

- The DOM is a tree of nodes; elements have attributes, children and properties; text is a child node.
- `querySelector(All)` for selection (static), `closest`/`matches` for delegation; beware live collections.
- `textContent` for data, `innerHTML` only for trusted markup; properties over attributes in code; `dataset` for data-*.
- Create with `createElement`/`append`, batch with fragments and `replaceChildren`, read layout before writing.
- Forms: `value` is a string, `FormData` for the whole form, browser validation plus server validation.
