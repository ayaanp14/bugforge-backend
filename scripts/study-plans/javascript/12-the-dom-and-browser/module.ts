import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "the-dom-and-browser",
  title: "The DOM and the browser",
  blurb: "The DOM tree, selection, attributes versus properties and safe content; event propagation and delegation; fetch, URLs, CORS and timeouts; storage, cookies, history and observers; the rendering pipeline, loading path, vitals, XSS and CSRF.",
  icon: "generic",
  overview: `In the browser, JavaScript's job is to read and change a tree the user is looking at, respond to what they do, talk to servers, and remember things between visits — while staying fast enough that nothing feels slow and careful enough that nobody else's script ever runs in your users' sessions. This module is the platform side of front-end work: the APIs, the rules behind them, and the two failure modes (slow and unsafe) with their causes and defences.

The DOM lesson covers the tree, selection, attributes versus properties, \`textContent\` versus \`innerHTML\`, and the reflow cost model. Events explains capture, target and bubble, \`target\` versus \`currentTarget\`, delegation with \`closest\`, and why \`stopPropagation\` is usually a coupling smell. The network lesson treats \`fetch\` honestly — a 404 resolves, bodies read once, nothing times out by itself, CORS is the server's decision enforced by the browser. Storage and history cover \`localStorage\`, the cookie flags that defend sessions, the History API behind every single-page router, and the observer APIs that replaced polling. The last lesson is rendering performance (style → layout → paint → composite, the loading path, the vitals) and the front-end threat model: XSS in layers, CSRF and \`SameSite\`, clickjacking, third-party scripts.

The judge has no browser, so the exercises model the mechanisms in Node with exactly the browser's rules: a selector engine over a tree, an input element with the dirty-value flag, a three-phase event dispatcher, delegation with \`closest\`, a \`fetch\` client with timeouts and an error body, real \`URL\`/\`URLSearchParams\`, a Web Storage model with quota and cross-tab events, a cookie jar that applies \`Secure\`/\`SameSite\`/\`Path\`, a layout-thrash counter, an HTML sanitiser plus a CSP checker — and then a virtual-DOM differ, a client-side router with a history stack, and a stale-while-revalidate cache.`,
  lessons: [
    {
      slug: "the-document-object-model",
      file: "01-the-document-object-model.md",
      exercises: [
        {
          title: "A selector engine over a tree",
          prompt: `The starter parses an indented outline (\`tag#id.class.class text…\`, two spaces per level) into a tree with \`tag\`, \`id\`, \`classes\`, \`text\`, \`children\` and \`parent\`. Implement \`matches(node, simple)\` for compound simple selectors (\`li\`, \`#app\`, \`.item.active\`, \`li.item\`), \`querySelectorAll(scope, selector)\` with the **descendant combinator** (space-separated parts, each matching a descendant of a previous match, no duplicates, document order), \`textContent(node)\` (own text and descendants' text joined by single spaces), and \`closest(node, selector)\` (nearest ancestor-or-self). After \`---\`: \`qsa <selector>\` prints \`qsa <selector>: <count> -> <tag#id.classes, …>\` (or \`-\`); \`text <selector>\` prints the JSON textContent of the first match (or \`null\`); \`closest <start-selector> <selector>\` prints the match or \`null\`.

Example (excerpt) for a shop page:
\`\`\`
qsa li: 2 -> li.item.active, li.item
qsa ul span: 1 -> span.badge
qsa .missing: 0 -> -
text ul: "Pen Ink new"
closest .badge .item: li.item
\`\`\``,
          starterFile: "code/dom-tree-model.starter.js",
          solutionFile: "code/dom-tree-model.solution.js",
          hints: ["A generator function* descendants(node) that yields children recursively makes querySelectorAll a loop over parts.", "closest walks node.parent while the node has a parent (skip the synthetic document root)."],
          cases: [
            { stdin: "div#app.main\n  h1 Shop\n  ul.list\n    li.item.active Pen\n    li.item Ink\n      span.badge new\n  p.note Free shipping\n---\nqsa li\nqsa .item.active\nqsa ul span\nqsa #app p\nqsa .missing\ntext ul\ntext li.active\nclosest .badge .item\nclosest .badge #app\n", expected: "qsa li: 2 -> li.item.active, li.item\nqsa .item.active: 1 -> li.item.active\nqsa ul span: 1 -> span.badge\nqsa #app p: 1 -> p.note\nqsa .missing: 0 -> -\ntext ul: \"Pen Ink new\"\ntext li.active: \"Pen\"\nclosest .badge .item: li.item\nclosest .badge #app: div#app.main\n" },
            { stdin: "section#s\n  p Hello\n---\nqsa p\ntext #s\nclosest p ul\n", expected: "qsa p: 1 -> p\ntext #s: \"Hello\"\nclosest p ul: null\n", hidden: true },
          ],
        },
        {
          title: "Attribute, property and the dirty-value flag",
          prompt: `Model an \`<input>\`: an \`attributes\` map plus live properties \`value\`, \`checked\`, \`className\`, \`dataset\`, and a \`dirty\` flag. Commands: \`setAttr <name> <value>\` sets the attribute — and, for \`value\`, updates the property **only while the user has not typed**; \`type <text>\` is a user edit (property only, sets \`dirty\`); \`setProp <name> <value>\` sets a property (\`checked\` as boolean; \`value\` also marks dirty); \`addClass\`/\`removeClass\`/\`toggleClass\` maintain \`className\` and the \`class\` attribute together; \`data <kebab-name> <value>\` sets \`data-*\` and the camelCase \`dataset\` key; \`get\` prints three lines: \`value: attr=<JSON|null> prop=<JSON> dirty=<bool>\`, \`class: attr=<JSON|null> className=<JSON> list=<JSON>\`, \`dataset=<JSON> checked=<bool>\`.

Example: \`setAttr value initial\`, \`get\`, \`type hello\`, \`setAttr value later\`, \`get\` →
\`\`\`
value: attr="initial" prop="initial" dirty=false
…
value: attr="later" prop="hello" dirty=true
\`\`\`
Once the user has typed, the attribute no longer drives the property — exactly the real DOM's behaviour and the reason \`getAttribute("value")\` is the wrong way to read an input.`,
          starterFile: "code/attributes-vs-properties.starter.js",
          solutionFile: "code/attributes-vs-properties.solution.js",
          hints: ["setAttribute(\"value\") assigns the property only if !dirty; type sets dirty = true.", "kebab to camel: s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())."],
          cases: [
            { stdin: "setAttr value initial\nget\ntype hello\nsetAttr value later\nget\nsetAttr class wide\naddClass active\ntoggleClass active\naddClass open\ndata user-id 42\nsetProp checked true\nget\n", expected: "value: attr=\"initial\" prop=\"initial\" dirty=false\nclass: attr=null className=\"\" list=[]\ndataset={} checked=false\nvalue: attr=\"later\" prop=\"hello\" dirty=true\nclass: attr=null className=\"\" list=[]\ndataset={} checked=false\nvalue: attr=\"later\" prop=\"hello\" dirty=true\nclass: attr=\"wide open\" className=\"wide open\" list=[\"wide\",\"open\"]\ndataset={\"userId\":\"42\"} checked=true\n" },
            { stdin: "setProp value typed\nsetAttr value fromServer\nget\n", expected: "value: attr=\"fromServer\" prop=\"typed\" dirty=true\nclass: attr=null className=\"\" list=[]\ndataset={} checked=false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "After the user types in an input, `input.getAttribute(\"value\")` returns…",
          options: ["What they typed", "The original markup value — the attribute is the default; the live text is the `value` **property**", "`null`", "An error"],
          answer: 1,
          explanation: "`value` and `checked` diverge into default (attribute) and current (property) once the user interacts.",
        },
        {
          prompt: "Rendering a user's comment with `el.innerHTML = comment`…",
          options: ["Is fine", "Is an XSS vulnerability — the string is parsed as HTML; use `textContent` or escape", "Is faster", "Strips scripts automatically"],
          answer: 1,
          explanation: "`<img src=x onerror=…>` runs the moment it is inserted.",
        },
        {
          prompt: "Removing elements while looping over `document.getElementsByClassName(\"x\")`…",
          options: ["Works", "Skips elements — the collection is live and shrinks under the loop; use `querySelectorAll` (static) or iterate a copy", "Throws", "Is faster"],
          answer: 1,
          explanation: "`querySelectorAll` returns a snapshot.",
        },
        {
          prompt: "Reading `el.offsetHeight` after changing a style, inside a loop over many elements…",
          options: ["Is free", "Forces a synchronous reflow per iteration (layout thrashing) — read everything first, then write", "Is cached", "Only repaints"],
          answer: 1,
          explanation: "Fragments and `requestAnimationFrame` batch writes.",
        },
        {
          prompt: "`data-user-id=\"42\"` is read in JavaScript as…",
          options: ["`el.dataset[\"user-id\"]`", "`el.dataset.userId` — kebab-case maps to camelCase; the value is a string", "`el.userId`", "`el.getAttribute(\"userId\")`"],
          answer: 1,
          explanation: "`getAttribute(\"data-user-id\")` also works.",
        },
      ],
    },
    {
      slug: "events",
      file: "02-events.md",
      exercises: [
        {
          title: "A three-phase event dispatcher",
          prompt: `Lines containing \`>\` declare node paths (\`document > body > ul#list > li#a > button#b\`; a node's name is its id, or its tag when it has none). \`on <node> <type> <capture|bubble> <label> [stop|stopImmediate|prevent]\` registers a listener. \`dispatch <node> <type>\` runs the three phases: **capture** from the root down to the target's parent (capture listeners only), **target** (capture-registered listeners first, then bubble-registered — the modern spec), **bubble** from the parent up to the root (bubble listeners). Each invoked listener prints \`<label> @<currentTarget> target=<target> phase=<capture|target|bubble>\`; \`stop\` stops further **nodes**, \`stopImmediate\` also the remaining listeners on the same node, \`prevent\` sets the flag. After dispatch print \`dispatch <type> on <node>: defaultPrevented=<bool>\`.

Example (excerpt): listeners on document (capture), list (bubble and capture), a (bubble), b (bubble with prevent, capture) →
\`\`\`
doc-capture @document target=b phase=capture
list-capture @list target=b phase=capture
b-capture @b target=b phase=target
b-bubble @b target=b phase=target
a-bubble @a target=b phase=bubble
list-bubble @list target=b phase=bubble
dispatch click on b: defaultPrevented=true
\`\`\``,
          starterFile: "code/event-propagation.starter.js",
          solutionFile: "code/event-propagation.solution.js",
          hints: ["Build the path from the target's parent to the root, then walk it forward for capture and reversed for bubble.", "stopPropagation prevents the next node's listeners but not the remaining listeners on the current node; stopImmediatePropagation prevents both."],
          cases: [
            { stdin: "document > body > ul#list > li#a > button#b\non document click capture doc-capture\non list click bubble list-bubble\non list click capture list-capture\non a click bubble a-bubble\non b click bubble b-bubble prevent\non b click capture b-capture\ndispatch b click\n", expected: "doc-capture @document target=b phase=capture\nlist-capture @list target=b phase=capture\nb-capture @b target=b phase=target\nb-bubble @b target=b phase=target\na-bubble @a target=b phase=bubble\nlist-bubble @list target=b phase=bubble\ndispatch click on b: defaultPrevented=true\n" },
            { stdin: "document > body > div#panel > button#ok\non panel click bubble panel-bubble\non ok click bubble ok-first stop\non ok click bubble ok-second\non body click capture body-capture\ndispatch ok click\ndispatch panel click\n", expected: "body-capture @body target=ok phase=capture\nok-first @ok target=ok phase=target\nok-second @ok target=ok phase=target\ndispatch click on ok: defaultPrevented=false\nbody-capture @body target=panel phase=capture\npanel-bubble @panel target=panel phase=target\ndispatch click on panel: defaultPrevented=false\n", hidden: true },
            { stdin: "document > body > div#x\non x click bubble first stopImmediate\non x click bubble second\non body click bubble body\ndispatch x click\n", expected: "first @x target=x phase=target\ndispatch click on x: defaultPrevented=false\n", hidden: true },
          ],
        },
        {
          title: "Delegation with closest",
          prompt: `A container holds items (\`add <id> [action]\`, \`remove <id>\`). Register **one** delegated click listener on the container and one \`once\` listener that prints \`first click on the container!\`. A click arrives as a target path such as \`item3.label\` (a child inside item 3), \`item2\`, or \`gap\` (between items); the delegated listener resolves the item the way \`e.target.closest("[data-id]")\` would (the first segment), prints \`click <path>: <action or select> on <id>\` or \`click <path>: ignored (no item)\`, and counts handled actions. Finish with \`listenersAdded=<n> active=<n> items=<n> handled=<JSON sorted by action>\`.

Example: \`add item1 open\`, \`add item2\`, \`click item1.icon\`, \`click item2\`, \`click gap\`, \`add item3 delete\`, \`click item3.label\`, \`remove item1\`, \`click item1\` →
\`\`\`
click item1.icon: open on item1
first click on the container!
click item2: select on item2
click gap: ignored (no item)
click item3.label: delete on item3
click item1: ignored (no item)
listenersAdded=2 active=1 items=2 handled={"delete":1,"open":1,"select":1}
\`\`\`
Items added after the listener was registered still work; the removed one is simply not found.`,
          starterFile: "code/event-delegation.starter.js",
          solutionFile: "code/event-delegation.solution.js",
          hints: ["Iterate a copy of the listener list when dispatching so a once listener can remove itself safely.", "The item lookup is just items.get(path.split(\".\")[0]) — that is what closest does for you in the DOM."],
          cases: [
            { stdin: "add item1 open\nadd item2\nclick item1.icon\nclick item2\nclick gap\nadd item3 delete\nclick item3.label\nremove item1\nclick item1\n", expected: "click item1.icon: open on item1\nfirst click on the container!\nclick item2: select on item2\nclick gap: ignored (no item)\nclick item3.label: delete on item3\nclick item1: ignored (no item)\nlistenersAdded=2 active=1 items=2 handled={\"delete\":1,\"open\":1,\"select\":1}\n" },
            { stdin: "click nothing\n", expected: "click nothing: ignored (no item)\nfirst click on the container!\nlistenersAdded=2 active=1 items=0 handled={}\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A click on a `<span>` inside a `<button>` with a listener on the button: `e.target` and `e.currentTarget` are…",
          options: ["Both the button", "The span and the button, respectively — where it happened versus where you listened", "Both the span", "The document and the button"],
          answer: 1,
          explanation: "Use `currentTarget` (or `closest`) for the element you care about.",
        },
        {
          prompt: "Event delegation means…",
          options: ["Each item gets its own listener", "One listener on an ancestor handles events from all descendants, present and future, via `e.target.closest(...)`", "Using `stopPropagation`", "Custom events"],
          answer: 1,
          explanation: "Fewer listeners, no per-item cleanup, works for dynamically added children.",
        },
        {
          prompt: "`e.preventDefault()` on a form's `submit`…",
          options: ["Stops the event bubbling", "Cancels the browser's submission; the event still propagates — the two are independent", "Removes the listener", "Resets the form"],
          answer: 1,
          explanation: "`stopPropagation` does not cancel the default action either.",
        },
        {
          prompt: "`el.removeEventListener(\"click\", () => handle())` after `el.addEventListener(\"click\", () => handle())`…",
          options: ["Removes the listener", "Removes nothing — a fresh arrow is a different function; keep the reference or use an `AbortSignal`", "Throws", "Removes all listeners"],
          answer: 1,
          explanation: "`{ signal }` lets one `abort()` remove every listener of a component.",
        },
        {
          prompt: "`{ passive: true }` on a scroll listener…",
          options: ["Makes it run later", "Promises the handler will not call `preventDefault`, so the browser can scroll immediately", "Removes it after one call", "Runs it in capture"],
          answer: 1,
          explanation: "`once: true` is the auto-remove option.",
        },
      ],
    },
    {
      slug: "fetch-and-the-network",
      file: "03-fetch-and-the-network.md",
      exercises: [
        {
          title: "A fetch client that handles the real cases",
          prompt: `The starter defines a fake \`fetch\` over a route table (a 200 with JSON, a 404 with a JSON error body, a 500 with an HTML body, a slow route, and an unknown route that rejects with \`TypeError("Failed to fetch")\` like a network failure); its Response's body can be read **once**. Implement \`fakeFetch\` as described (resolve after the route's delay; reject with an \`AbortError\`-named error when the signal aborts) and \`getJson(url, timeoutMs)\`: abort via \`AbortController\` after the timeout (clear the timer in \`finally\`), throw \`HttpError(status, "GET <url> -> <status>", detail)\` with the error body as \`detail\` when \`!res.ok\`, else return \`res.json()\`. Line 1 is the timeout; each following line a URL. Print \`<url>: ok <JSON>\`, \`<url>: HttpError <status> detail=<JSON>\`, \`<url>: timed out after <ms> ms\` or \`<url>: <name>: <message>\`; finally read a body twice and print \`second read: TypeError: body used already\`.

Example: \`30\` then \`/api/user\`, \`/api/missing\`, \`/api/broken\`, \`/api/slow\`, \`/api/nowhere\` →
\`\`\`
/api/user: ok {"id":1,"name":"Ada"}
/api/missing: HttpError 404 detail="{\\"error\\":\\"no such user\\"}"
/api/broken: HttpError 500 detail="<html>Internal Server Error</html>"
/api/slow: timed out after 30 ms
/api/nowhere: TypeError: Failed to fetch
second read: TypeError: body used already
\`\`\``,
          starterFile: "code/fetch-client.starter.js",
          solutionFile: "code/fetch-client.solution.js",
          hints: ["A 404 resolves — only the ok check turns it into an error; read res.text() for the detail before throwing.", "signal.addEventListener(\"abort\", ...) inside the fake fetch clears the pending timer and rejects."],
          cases: [
            { stdin: "30\n/api/user\n/api/missing\n/api/broken\n/api/slow\n/api/nowhere\n", expected: "/api/user: ok {\"id\":1,\"name\":\"Ada\"}\n/api/missing: HttpError 404 detail=\"{\\\"error\\\":\\\"no such user\\\"}\"\n/api/broken: HttpError 500 detail=\"<html>Internal Server Error</html>\"\n/api/slow: timed out after 30 ms\n/api/nowhere: TypeError: Failed to fetch\nsecond read: TypeError: body used already\n" },
            { stdin: "200\n/api/slow\n", expected: "/api/slow: ok {\"ok\":true}\nsecond read: TypeError: body used already\n", hidden: true },
          ],
        },
        {
          title: "Building URLs the right way",
          prompt: `Drive the real \`URL\` class with commands: \`base <url>\`, \`resolve <relative>\` (relative to the current URL), \`set <key> <value…>\`, \`append <key> <value…>\`, \`delete <key>\`, \`path <segments…>\` (each segment \`encodeURIComponent\`-ed), \`hash [value]\` (no value clears it), \`show\` (prints \`String(url)\`), \`parts\` (prints \`origin= pathname= search= hash= host= port=<JSON>\`), \`params\` (prints the entries as JSON).

Example: \`base https://shop.example.com/catalog/items?page=1#top\`, \`set q blue pens & more\`, \`append tag office\`, \`append tag sale\`, \`show\`, \`resolve ../about\`, \`show\`, \`path api users 42/edit\`, \`delete tag\`, \`hash\`, \`show\` →
\`\`\`
https://shop.example.com/catalog/items?page=1&q=blue+pens+%26+more&tag=office&tag=sale#top
https://shop.example.com/about
https://shop.example.com/api/users/42%2Fedit
\`\`\`
\`URLSearchParams\` encoded the ampersand; \`encodeURIComponent\` kept the slash inside the segment as \`%2F\`.`,
          starterFile: "code/url-builder.starter.js",
          solutionFile: "code/url-builder.solution.js",
          hints: ["new URL(relative, currentUrl) resolves ../ the way a browser does.", "url.pathname = \"/\" + segments.map(encodeURIComponent).join(\"/\")."],
          cases: [
            { stdin: "base https://shop.example.com/catalog/items?page=1#top\nparts\nset q blue pens & more\nappend tag office\nappend tag sale\nshow\nparams\nresolve ../about\nshow\npath api users 42/edit\ndelete tag\nhash\nshow\n", expected: "origin=https://shop.example.com pathname=/catalog/items search=?page=1 hash=#top host=shop.example.com port=\"\"\nhttps://shop.example.com/catalog/items?page=1&q=blue+pens+%26+more&tag=office&tag=sale#top\nparams=[[\"page\",\"1\"],[\"q\",\"blue pens & more\"],[\"tag\",\"office\"],[\"tag\",\"sale\"]]\nhttps://shop.example.com/about\nhttps://shop.example.com/api/users/42%2Fedit\n" },
            { stdin: "base http://localhost:3000/a/b\nresolve ./c?x=1\nparts\nset y 2\nshow\n", expected: "origin=http://localhost:3000 pathname=/a/c search=?x=1 hash= host=localhost:3000 port=\"3000\"\nhttp://localhost:3000/a/c?x=1&y=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`await fetch(\"/missing\")` for a URL that returns 404…",
          options: ["Rejects", "Resolves with `res.ok === false` — fetch rejects only on network failure or abort; check `ok` yourself", "Returns `null`", "Retries"],
          answer: 1,
          explanation: "Read the error body for detail and throw a typed error.",
        },
        {
          prompt: "Calling `res.json()` after `res.text()` on the same Response…",
          options: ["Works", "Throws `body used already` — the body is a one-shot stream; `clone()` first if two readers are needed", "Returns the cached text", "Returns `undefined`"],
          answer: 1,
          explanation: "Decide the format once, or clone.",
        },
        {
          prompt: "A \"CORS error\" in the console means…",
          options: ["Your JavaScript has a bug", "The browser refused to let the page read the response because the **server** did not allow the page's origin — fix it on the server", "The server is down", "The URL is wrong"],
          answer: 1,
          explanation: "curl and Node do not enforce CORS; the request may even have reached the server.",
        },
        {
          prompt: "To time out a fetch after 5 s you…",
          options: ["Pass `{ timeout: 5000 }`", "Create an `AbortController`, `setTimeout(() => controller.abort(), 5000)`, pass `signal`, and clear the timer in `finally`", "Use `Promise.race` with `setTimeout` only", "Cannot"],
          answer: 1,
          explanation: "Abort also cancels superseded requests so a slow old response cannot overwrite a new one.",
        },
        {
          prompt: "`encodeURIComponent` versus `encodeURI`:",
          options: ["Synonyms", "`encodeURIComponent` encodes a single value (including `/ ? & =`); `encodeURI` leaves URL structure intact — for whole URLs", "`encodeURI` is stricter", "Neither is needed with `URL`"],
          answer: 1,
          explanation: "`URLSearchParams` handles query values; `encodeURIComponent` for path segments.",
        },
      ],
    },
    {
      slug: "storage-history-and-browser-apis",
      file: "04-storage-history-and-browser-apis.md",
      exercises: [
        {
          title: "A Web Storage model with quota and cross-tab events",
          prompt: `Implement \`WebStorage(quotaBytes, name, bus)\`: \`setItem(key, value)\` coerces the value with \`String()\`, throws an error named \`QuotaExceededError\` (\`quota of <n> bytes exceeded\`) when the total of key and value lengths would exceed the quota, stores, and emits a \`storage\` event that **other** tabs print as \`  [<tab>] storage event: key=<k> old=<JSON> new=<JSON>\`; \`getItem\` returns \`null\` when missing; \`removeItem\` emits with \`new=null\`; \`key(i)\`, \`length\`. Two tabs \`A\` and \`B\` share the origin. Commands: \`<tab> set <k> <v…>\`, \`<tab> get <k>\`, \`<tab> remove <k>\`, \`<tab> json <k> <json>\` (round-trips through \`JSON.stringify\`/\`parse\`), \`<tab> raw <k>\` (tries to store the object \`{ a: 1 }\` directly), \`<tab> keys\`. Print each command's outcome or \`<tab> <cmd> <k>: <error name>: <message>\`.

Example (excerpt), quota 40: \`A set theme dark\` → the event line in tab B, then \`A set theme\`; \`A raw obj\` → the stored text would be \`[object Object]\` (16 chars) and exceeds the quota; \`B remove theme\` → B's own storage is empty, so \`A get theme\` still gives \`"dark"\`.
\`\`\`
  [B] storage event: key=theme old=null new="dark"
A set theme
B get theme -> null
\`\`\``,
          starterFile: "code/storage-model.starter.js",
          solutionFile: "code/storage-model.solution.js",
          hints: ["Each tab has its own copy of the data in this model; the storage event is the notification, not a sync.", "Compute the new total before writing so a failed write leaves the store untouched."],
          cases: [
            { stdin: "40\nA set theme dark\nB get theme\nA json prefs {\"n\":1,\"list\":[1,2]}\nA raw obj\nA set big 0123456789012345678901234567890123456789\nA keys\nB remove theme\nA get theme\n", expected: "  [B] storage event: key=theme old=null new=\"dark\"\nA set theme\nB get theme -> null\n  [B] storage event: key=prefs old=null new=\"{\\\"n\\\":1,\\\"list\\\":[1,2]}\"\nA json prefs -> {\"n\":1,\"list\":[1,2]}\nA raw obj: QuotaExceededError: quota of 40 bytes exceeded\nA set big: QuotaExceededError: quota of 40 bytes exceeded\nA keys=[\"theme\",\"prefs\"] length=2\nB removed theme\nA get theme -> \"dark\"\n" },
            { stdin: "10\nA set k value\nA set k2 v\n", expected: "  [B] storage event: key=k old=null new=\"value\"\nA set k\n  [B] storage event: key=k2 old=null new=\"v\"\nA set k2\n", hidden: true },
          ],
        },
        {
          title: "A cookie jar that applies the flags",
          prompt: `Parse \`Set-Cookie:\` lines into \`{ name, value, path (default /), secure, httpOnly, sameSite (default Lax), maxAge }\`. For each \`request <url> <same-site|cross-site> <method> <navigation|subresource>\` decide per cookie whether it is sent, with the first failing rule as the reason: \`expired\` (Max-Age ≤ 0), \`insecure\` (Secure on a non-https URL), \`path\` (request path does not start with the cookie path), \`samesite-none-requires-secure\`, \`samesite-strict\` (cross-site), \`samesite-lax\` (cross-site unless a top-level GET navigation). Print \`<METHOD> <url> [<site>, <kind>] -> Cookie: <name=value; …> | blocked: <name(reason), …>\` (\`(none)\` when nothing is sent; omit the blocked part when empty). Finish with \`readableByScript=<names without HttpOnly>\`.

Example (excerpt) for a session (Secure, HttpOnly, Lax), a Strict theme, a None-without-Secure tracker, an expired promo and a Secure cart on \`/shop\`:
\`\`\`
POST https://shop.example/shop/checkout [cross-site, subresource] -> Cookie: (none) | blocked: session(samesite-lax), theme(samesite-strict), tracker(samesite-none-requires-secure), promo(expired), cart(samesite-lax)
GET https://shop.example/help [cross-site, navigation] -> Cookie: session=abc | blocked: theme(samesite-strict), tracker(samesite-none-requires-secure), promo(expired), cart(path)
readableByScript=theme,tracker,promo,cart
\`\`\``,
          starterFile: "code/cookie-jar.starter.js",
          solutionFile: "code/cookie-jar.solution.js",
          hints: ["Check the rules in the stated order and return the first reason; null means the cookie is sent.", "Lax allows a cross-site cookie only on a top-level GET navigation — the CSRF defence in one line."],
          cases: [
            { stdin: "Set-Cookie: session=abc; Path=/; Secure; HttpOnly; SameSite=Lax\nSet-Cookie: theme=dark; Path=/; SameSite=Strict\nSet-Cookie: tracker=t1; Path=/; SameSite=None\nSet-Cookie: promo=x; Path=/shop; Secure; SameSite=Lax; Max-Age=0\nSet-Cookie: cart=3; Path=/shop; Secure; SameSite=Lax\nrequest https://shop.example/shop/cart same-site GET navigation\nrequest http://shop.example/shop/cart same-site GET navigation\nrequest https://shop.example/shop/checkout cross-site POST subresource\nrequest https://shop.example/help cross-site GET navigation\n", expected: "GET https://shop.example/shop/cart [same-site, navigation] -> Cookie: session=abc; theme=dark; cart=3 | blocked: tracker(samesite-none-requires-secure), promo(expired)\nGET http://shop.example/shop/cart [same-site, navigation] -> Cookie: theme=dark | blocked: session(insecure), tracker(samesite-none-requires-secure), promo(expired), cart(insecure)\nPOST https://shop.example/shop/checkout [cross-site, subresource] -> Cookie: (none) | blocked: session(samesite-lax), theme(samesite-strict), tracker(samesite-none-requires-secure), promo(expired), cart(samesite-lax)\nGET https://shop.example/help [cross-site, navigation] -> Cookie: session=abc | blocked: theme(samesite-strict), tracker(samesite-none-requires-secure), promo(expired), cart(path)\nreadableByScript=theme,tracker,promo,cart\n" },
            { stdin: "Set-Cookie: a=1; Secure; SameSite=None\nrequest https://x.example/ cross-site POST subresource\n", expected: "POST https://x.example/ [cross-site, subresource] -> Cookie: a=1\nreadableByScript=a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`localStorage.setItem(\"user\", { name: \"Ada\" })` stores…",
          options: ["The object", "The string `\"[object Object]\"` — values are strings; `JSON.stringify` first", "`null`", "An error"],
          answer: 1,
          explanation: "And `getItem` returns `null` for a missing key, so `JSON.parse(x ?? \"{}\")`.",
        },
        {
          prompt: "The `storage` event fires…",
          options: ["In the tab that wrote", "In **other** tabs of the same origin — a free cross-tab channel", "On the server", "Never"],
          answer: 1,
          explanation: "`BroadcastChannel` is the dedicated alternative.",
        },
        {
          prompt: "A session cookie should carry…",
          options: ["Nothing special", "`Secure` (HTTPS only), `HttpOnly` (invisible to scripts) and `SameSite=Lax` or `Strict` (CSRF defence)", "`SameSite=None` only", "A long `Max-Age`"],
          answer: 1,
          explanation: "`SameSite=None` requires `Secure` and reopens CSRF unless tokens are used.",
        },
        {
          prompt: "`history.pushState(state, \"\", \"/items\")`…",
          options: ["Loads `/items`", "Changes the URL and adds a history entry without loading; your code renders — and `popstate` does **not** fire for it", "Fires `popstate`", "Reloads"],
          answer: 1,
          explanation: "`popstate` fires on back/forward; the server must serve the shell for deep links.",
        },
        {
          prompt: "Lazy-loading images as they approach the viewport is best done with…",
          options: ["A scroll handler measuring `getBoundingClientRect`", "`IntersectionObserver` (with a `rootMargin`) or `loading=\"lazy\"`", "`setInterval`", "`MutationObserver`"],
          answer: 1,
          explanation: "Observers are batched and cheap; scroll handlers with layout reads thrash.",
        },
      ],
    },
    {
      slug: "rendering-performance-and-security",
      file: "05-rendering-performance-and-security.md",
      exercises: [
        {
          title: "Count the reflows",
          prompt: `The starter models the layout engine: \`write()\` marks layout dirty, \`read()\` forces a reflow when dirty (counting it). Starting dirty each time, implement three strategies over the input heights and end each with the frame's own \`read()\`: **naive** — for each item write then read (measure after mutating); **batched** — read every item first, then write every item; **requestAnimationFrame** — read each item immediately but queue the writes in a fake \`requestAnimationFrame\`, then run the frame. Print \`naive: reflows=<n> for <n> items\`, \`batched: reflows=<n>\`, \`requestAnimationFrame: reflows=<n>\`, \`sameResult=<all three produced the same doubled heights> out=<JSON>\`.

Example: \`10 20 30 40 50\` →
\`\`\`
naive: reflows=5 for 5 items
batched: reflows=2
requestAnimationFrame: reflows=2
sameResult=true out=[20,40,60,80,100]
\`\`\`
Interleaving a read after every write costs one layout per item; separating the phases costs one layout per phase.`,
          starterFile: "code/layout-thrash.starter.js",
          solutionFile: "code/layout-thrash.solution.js",
          hints: ["A read only reflows when something was written since the last layout — so consecutive reads are free.", "The rAF model is an array of callbacks run after the loop; the frame's final read() is the browser laying out once."],
          cases: [
            { stdin: "10 20 30 40 50\n", expected: "naive: reflows=5 for 5 items\nbatched: reflows=2\nrequestAnimationFrame: reflows=2\nsameResult=true out=[20,40,60,80,100]\n" },
            { stdin: "7\n", expected: "naive: reflows=1 for 1 items\nbatched: reflows=2\nrequestAnimationFrame: reflows=2\nsameResult=true out=[14]\n", hidden: true },
          ],
        },
        {
          title: "Sanitise untrusted HTML and check a CSP",
          prompt: `Line 1 is untrusted HTML, line 2 a Content-Security-Policy header, the rest are script sources to test. Write \`sanitize(markup)\`: split into tags and text; keep only \`b i p a br\` (an \`<a>\` keeps only an \`http(s)\` \`href\`, re-emitted as \`href="…" rel="noopener"\`); drop every other tag — and the whole content of \`<script>\`/\`<style>\` — recording what was dropped (\`onclick\`-style attributes as \`onclick\`, a rejected link as \`a[href=javascript:]\`); escape all text with an escaper that leaves existing entities alone. Print \`sanitized=<html>\` and \`dropped=<comma list or ->\`. Then \`cspAllows(policy, source)\` for the \`script-src\` directive: \`inline\` needs \`'unsafe-inline'\`, \`eval\` needs \`'unsafe-eval'\`, \`self\` needs \`'self'\`, a URL matches a host source exactly or a \`*.\` wildcard; no directive → nothing allowed. Print \`<source>: allowed|blocked\`.

Example (excerpt):
\`\`\`
sanitized=<p>Hi <b>Ada</b> &amp; <a href="https://x.io" rel="noopener">link</a><a>bad</a></p>
dropped=onclick,script,img,a[href=javascript:]
inline: blocked
https://a.trusted.net/x.js: allowed
https://evil.example/x.js: blocked
\`\`\``,
          starterFile: "code/sanitize-and-csp.starter.js",
          solutionFile: "code/sanitize-and-csp.solution.js",
          hints: ["markup.split(/(<[^>]+>)/) keeps the tags as their own tokens; a regex classifies each as open/close plus attributes.", "A real sanitiser is DOMPurify; this one shows the allow-list principle — never a deny-list."],
          cases: [
            { stdin: "<p>Hi <b>Ada</b> &amp; <a href=\"https://x.io\" onclick=\"steal()\">link</a><script>alert(1)</script><img src=x onerror=\"boom()\"><a href=\"javascript:evil()\">bad</a></p>\nscript-src 'self' https://cdn.example.com *.trusted.net; object-src 'none'\nself\ninline\neval\nhttps://cdn.example.com/lib.js\nhttps://a.trusted.net/x.js\nhttps://evil.example/x.js\n", expected: "sanitized=<p>Hi <b>Ada</b> &amp; <a href=\"https://x.io\" rel=\"noopener\">link</a><a>bad</a></p>\ndropped=onclick,script,img,a[href=javascript:]\nself: allowed\ninline: blocked\neval: blocked\nhttps://cdn.example.com/lib.js: allowed\nhttps://a.trusted.net/x.js: allowed\nhttps://evil.example/x.js: blocked\n" },
            { stdin: "<i>ok</i> 1 < 2\ndefault-src 'self'\nself\ninline\n", expected: "sanitized=<i>ok</i> 1 &lt; 2\ndropped=-\nself: blocked\ninline: blocked\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Animating `transform` and `opacity` is cheap because…",
          options: ["They are shorter to type", "They can be handled by the compositor without layout or paint; `top`/`left`/`width` trigger layout", "They run on the GPU always", "They are cached"],
          answer: 1,
          explanation: "Style → layout → paint → composite; skipping the first two keeps the 16.7 ms frame.",
        },
        {
          prompt: "`<script defer>` versus `<script async>`:",
          options: ["Identical", "Both download in parallel; `defer` runs in order after parsing, `async` runs as soon as it arrives, in any order", "`async` blocks parsing", "`defer` runs first"],
          answer: 1,
          explanation: "A plain `<script>` blocks parsing until it runs.",
        },
        {
          prompt: "A Content-Security-Policy of `script-src 'self'`…",
          options: ["Blocks all scripts", "Allows scripts only from the page's origin — inline scripts and `eval` are blocked, which neutralises most XSS payloads", "Allows CDNs", "Only affects images"],
          answer: 1,
          explanation: "Adding `'unsafe-inline'` defeats it; use nonces or hashes for necessary inline scripts.",
        },
        {
          prompt: "CSRF works because…",
          options: ["Scripts can read cookies", "The browser attaches the user's cookies to requests a malicious page triggers — `SameSite` cookies and tokens stop it; never mutate on GET", "Passwords are weak", "CORS is misconfigured"],
          answer: 1,
          explanation: "XSS steals from within the page; CSRF rides from outside it.",
        },
        {
          prompt: "The three Core Web Vitals are…",
          options: ["TTFB, FCP, TTI", "LCP (loading), INP (responsiveness), CLS (visual stability)", "CPU, memory, network", "HTML, CSS, JS size"],
          answer: 1,
          explanation: "Measure real users with `PerformanceObserver`; audit with Lighthouse.",
        },
      ],
    },
    {
      slug: "browser-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A virtual-DOM differ",
          prompt: `Two lines hold JSON trees: \`{ tag, props, children }\` where a child is a tree or a string. Write \`diff(a, b, path, patches)\` producing, in document order: \`REPLACE <path>\` when a text node and an element swap, \`REPLACE <path> <oldTag> -> <newTag>\` for different tags (do not descend), \`TEXT <path> <oldJSON> -> <newJSON>\`, \`PROPS <path> <+k=v ~k=v -k …>\` (added in new-key order, then changed, then removed), and for children by index \`INSERT <path> <"text" or <tag>>\` / \`REMOVE <path>\`; paths are \`root\`, \`root/0\`, \`root/1/0\`. Print the patches one per line or \`no changes\`.

Example: a list whose class and role change, whose first item loses an id, whose second item's text changes, and which gains a fourth item →
\`\`\`
PROPS root ~class="list active" +role="list"
PROPS root/0 -id
TEXT root/1/0 "Ink" -> "Blue Ink"
INSERT root/3 <li>
\`\`\``,
          starterFile: "code/vdom-diff.starter.js",
          solutionFile: "code/vdom-diff.solution.js",
          hints: ["Handle strings first (typeof a === \"string\" || typeof b === \"string\"), then tag mismatch, then props, then children up to the longer length.", "A tag change replaces the whole subtree — descending would produce meaningless patches."],
          cases: [
            { stdin: "{\"tag\":\"ul\",\"props\":{\"class\":\"list\"},\"children\":[{\"tag\":\"li\",\"props\":{\"id\":\"a\"},\"children\":[\"Pen\"]},{\"tag\":\"li\",\"props\":{},\"children\":[\"Ink\"]},{\"tag\":\"li\",\"props\":{},\"children\":[\"Pad\"]}]}\n{\"tag\":\"ul\",\"props\":{\"class\":\"list active\",\"role\":\"list\"},\"children\":[{\"tag\":\"li\",\"props\":{},\"children\":[\"Pen\"]},{\"tag\":\"li\",\"props\":{},\"children\":[\"Blue Ink\"]},{\"tag\":\"li\",\"props\":{},\"children\":[\"Pad\"]},{\"tag\":\"li\",\"props\":{},\"children\":[\"Clip\"]}]}\n", expected: "PROPS root ~class=\"list active\" +role=\"list\"\nPROPS root/0 -id\nTEXT root/1/0 \"Ink\" -> \"Blue Ink\"\nINSERT root/3 <li>\n" },
            { stdin: "{\"tag\":\"div\",\"props\":{},\"children\":[\"text\",{\"tag\":\"span\",\"props\":{},\"children\":[]}]}\n{\"tag\":\"div\",\"props\":{},\"children\":[{\"tag\":\"b\",\"props\":{},\"children\":[\"x\"]}]}\n", expected: "REPLACE root/0\nREMOVE root/1\n", hidden: true },
            { stdin: "{\"tag\":\"p\",\"props\":{},\"children\":[\"same\"]}\n{\"tag\":\"p\",\"props\":{},\"children\":[\"same\"]}\n", expected: "no changes\n", hidden: true },
          ],
        },
        {
          title: "A client-side router with a history stack",
          prompt: `Lines \`route <pattern>\` declare routes with \`:param\` segments and a trailing \`*\` (captured as \`rest\`); compile each to a regex. Keep a history array starting at \`["/"]\` with an index. Commands: \`push <path?query>\` (discard the forward stack, append, move) prints \`pushState <path> -> <match>\`; \`replace <path>\` prints \`replaceState …\`; \`back\`/\`forward\` move the index and print \`popstate <path> -> <match>\` (or \`back: nothing to go back to\` / \`forward: nothing ahead\`); \`stack\` prints \`stack=<JSON> index=<n>\`. A match is \`matched <pattern> params=<JSON> query=<JSON of the query string>\` (first declared route wins) or \`404 <pathname>\`.

Example (excerpt):
\`\`\`
pushState /users/42?tab=posts -> matched /users/:id params={"id":"42"} query={"tab":"posts"}
pushState /files/docs/a.pdf -> matched /files/* params={"rest":"docs/a.pdf"} query={}
popstate /users/42/posts/7 -> matched /users/:id/posts/:postId params={"id":"42","postId":"7"} query={}
pushState /nowhere -> 404 /nowhere
\`\`\`
A \`push\` after going back drops the entries ahead — exactly what the browser does.`,
          starterFile: "code/router.starter.js",
          solutionFile: "code/router.solution.js",
          hints: ["Escape slashes, turn :name into ([^/]+) and * into (.*), anchor with ^…$, and remember the parameter names in order.", "new URL(path, \"http://app.local\") splits pathname from the query for free."],
          cases: [
            { stdin: "route /\nroute /users/:id\nroute /users/:id/posts/:postId\nroute /files/*\npush /users/42?tab=posts\npush /users/42/posts/7\npush /files/docs/a.pdf\nback\nback\nstack\npush /nowhere\nforward\nback\nreplace /users/1\nstack\n", expected: "pushState /users/42?tab=posts -> matched /users/:id params={\"id\":\"42\"} query={\"tab\":\"posts\"}\npushState /users/42/posts/7 -> matched /users/:id/posts/:postId params={\"id\":\"42\",\"postId\":\"7\"} query={}\npushState /files/docs/a.pdf -> matched /files/* params={\"rest\":\"docs/a.pdf\"} query={}\npopstate /users/42/posts/7 -> matched /users/:id/posts/:postId params={\"id\":\"42\",\"postId\":\"7\"} query={}\npopstate /users/42?tab=posts -> matched /users/:id params={\"id\":\"42\"} query={\"tab\":\"posts\"}\nstack=[\"/\",\"/users/42?tab=posts\",\"/users/42/posts/7\",\"/files/docs/a.pdf\"] index=1\npushState /nowhere -> 404 /nowhere\nforward: nothing ahead\npopstate /users/42?tab=posts -> matched /users/:id params={\"id\":\"42\"} query={\"tab\":\"posts\"}\nreplaceState /users/1 -> matched /users/:id params={\"id\":\"1\"} query={}\nstack=[\"/\",\"/users/1\",\"/nowhere\"] index=1\n" },
            { stdin: "route /\nback\npush /x\nforward\n", expected: "back: nothing to go back to\npushState /x -> 404 /x\nforward: nothing ahead\n", hidden: true },
          ],
        },
        {
          title: "A stale-while-revalidate cache",
          prompt: `\`fetchValue(key)\` (in the starter) takes 10 ms, counts calls and returns \`<key>#<count>\`. Implement \`SwrCache(ttlMs).get(key)\`: on a **miss** fetch, store with a timestamp and return \`{ status: "miss", value }\`; when the entry is younger than the TTL return \`{ status: "hit", value }\`; when it is **stale** return the stale value immediately as \`{ status: "stale", value }\` and start **one** background revalidation that replaces the entry when it completes (a second stale read while it is in flight must not start another). Line 1 is the TTL; commands \`get <key>\` print \`get <key>: <status> <value> fetches=<count>\` and \`wait <ms>\` prints \`  (waited <ms> ms)\`.

Example: TTL \`40\`, then \`get a\`, \`get a\`, \`wait 60\`, \`get a\`, \`get a\`, \`wait 20\`, \`get a\`, \`get b\` →
\`\`\`
get a: miss a#1 fetches=1
get a: hit a#1 fetches=1
  (waited 60 ms)
get a: stale a#1 fetches=2
get a: stale a#1 fetches=2
  (waited 20 ms)
get a: hit a#2 fetches=2
get b: miss b#3 fetches=3
\`\`\`
The stale reads answered instantly with the old value while one refresh ran; the next read after it landed was fresh.`,
          starterFile: "code/swr-cache.starter.js",
          solutionFile: "code/swr-cache.solution.js",
          hints: ["Store the in-flight revalidation promise on the entry; only start one when it is null, and clear it when it settles.", "Do not await the revalidation in the stale path — return the old value now."],
          cases: [
            { stdin: "40\nget a\nget a\nwait 60\nget a\nget a\nwait 20\nget a\nget b\n", expected: "get a: miss a#1 fetches=1\nget a: hit a#1 fetches=1\n  (waited 60 ms)\nget a: stale a#1 fetches=2\nget a: stale a#1 fetches=2\n  (waited 20 ms)\nget a: hit a#2 fetches=2\nget b: miss b#3 fetches=3\n" },
            { stdin: "1000\nget k\nget k\n", expected: "get k: miss k#1 fetches=1\nget k: hit k#1 fetches=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`querySelectorAll` returns…",
          options: ["A live collection", "A static `NodeList` snapshot — iterable, but not an array (spread it for `map`)", "An array", "The first match"],
          answer: 1,
          explanation: "`getElementsByClassName` is the live one.",
        },
        {
          prompt: "Building a list of 1,000 items with one `appendChild` per item in a loop…",
          options: ["Is optimal", "Can trigger repeated layout work — build in a `DocumentFragment` (or a template) and insert once", "Is impossible", "Reflows zero times"],
          answer: 1,
          explanation: "`replaceChildren(fragment)` is one mutation.",
        },
        {
          prompt: "Which events do **not** bubble?",
          options: ["`click`, `input`", "`focus` and `blur` (use `focusin`/`focusout`), `mouseenter`/`mouseleave`, element `scroll`", "`submit`", "`keydown`"],
          answer: 1,
          explanation: "Delegating focus needs the bubbling variants.",
        },
        {
          prompt: "`stopPropagation` in an inner handler to keep an outer one from running is…",
          options: ["The standard pattern", "Usually a smell — it silently disables outer handlers (analytics, click-outside, delegation); prefer checking `e.target` in the outer handler", "Required for forms", "Faster"],
          answer: 1,
          explanation: "Legitimate uses exist but are rare.",
        },
        {
          prompt: "A `CustomEvent` carries its payload in…",
          options: ["`e.data`", "`e.detail` — set via `new CustomEvent(type, { detail, bubbles })`", "`e.payload`", "`e.value`"],
          answer: 1,
          explanation: "`dispatchEvent` returns `false` if a listener called `preventDefault` on a cancelable event.",
        },
        {
          prompt: "A cross-origin `fetch` with `Content-Type: application/json`…",
          options: ["Is a simple request", "Triggers a preflight `OPTIONS` request; the server must answer with the allowed methods and headers", "Is blocked always", "Needs no CORS"],
          answer: 1,
          explanation: "Form-encoded POSTs without custom headers are the \"simple\" case.",
        },
        {
          prompt: "Storing a bearer token in `localStorage`…",
          options: ["Is the secure choice", "Exposes it to any XSS on the origin; an `HttpOnly` cookie or in-memory storage is safer", "Encrypts it", "Sends it automatically"],
          answer: 1,
          explanation: "Weigh convenience against the threat model.",
        },
        {
          prompt: "`SameSite=Lax` sends a cookie on a cross-site request only when…",
          options: ["Never", "It is a top-level GET navigation — not on cross-site POSTs, iframes or fetches", "Always", "The request is HTTPS"],
          answer: 1,
          explanation: "`Strict` never sends cross-site; `None` always (and requires `Secure`).",
        },
        {
          prompt: "A single-page app's server must…",
          options: ["Return 404 for unknown paths", "Serve the app shell for every client route so deep links and refreshes work after `pushState`", "Redirect to `/`", "Disable caching"],
          answer: 1,
          explanation: "Otherwise `/users/42` works only when reached by clicking.",
        },
        {
          prompt: "Layout thrashing is…",
          options: ["Too many DOM nodes", "Interleaving DOM writes with layout reads so the browser reflows on every read — batch reads, then writes", "Slow CSS", "Large images"],
          answer: 1,
          explanation: "`IntersectionObserver`/`ResizeObserver` avoid measuring in handlers.",
        },
        {
          prompt: "The most robust XSS defence for rich user HTML is…",
          options: ["A regex that strips `<script>`", "An allow-list sanitiser (DOMPurify) plus a CSP and HttpOnly cookies — layers, never a deny-list regex", "Lower-casing the input", "`encodeURIComponent`"],
          answer: 1,
          explanation: "Render plain text with `textContent` whenever HTML is not required.",
        },
        {
          prompt: "Subresource Integrity (`integrity=\"sha384-…\"`) on a `<script src>`…",
          options: ["Speeds loading", "Makes the browser refuse the script if its bytes do not match the hash — protection against a compromised CDN", "Enables CORS", "Minifies it"],
          answer: 1,
          explanation: "Third-party scripts run with full page privileges; pin, self-host, restrict with CSP.",
        },
      ],
    },
  ],
});
