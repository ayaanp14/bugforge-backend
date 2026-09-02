/**
 * Hand-authored bug-hunt challenges.
 *
 * Each challenge is a small multi-file JS project with 1+ planted bugs in the
 * editable file(s). `tests` run through src/lib/bug-judge.ts on the shared
 * execution engine; `fixedFiles` hold a known-correct fix used ONLY by
 * `seed-bugs.ts --validate` to prove the suite fails when buggy and passes
 * when fixed. Locked files are context the hunter can read but not change.
 */

export interface BugSpec {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: "frontend" | "backend" | "database";
  description: string;
  bugReport: string;
  logs: string | null;
  files: Array<{ filePath: string; content: string; isEditable: boolean; language: string }>;
  tests: Array<{ name: string; source: string; isHidden: boolean }>;
  /** filePath -> corrected content (editable files only) */
  fixedFiles: Record<string, string>;
}

export const BUGS: BugSpec[] = [

  // ════════════════════════════════════════════════════════════════
  // 1. FRONTEND — cart totals
  // ════════════════════════════════════════════════════════════════
  {
    title: "The Checkout Meltdown",
    difficulty: "easy",
    category: "frontend",
    description: `Shoppers on **Lumen Store** are seeing wildly wrong totals at checkout the moment they apply a coupon. The cart state itself is fine — the bug lives somewhere in the pure calculation layer that the React checkout page calls.

You have three files. Only \`calculateTotals.js\` is editable — the formatter and constants are shared with other teams and locked.

Fix the calculation so every test in the suite passes.`,
    bugReport: `**BUG-2107** · Priority: Critical · Reported by: support (14 duplicate tickets)

Steps to reproduce:
1. Add "Desk Lamp" ($40.00) ×2 to the cart
2. Apply coupon SAVE20 (20% off)
3. Observe the order summary

Expected: subtotal $80.00, discount $16.00, total $69.12 (with 8% tax)
Actual: discount shows $64.00 and the total goes NEGATIVE on larger carts.

Also flagged by QA: a 100%-off promo coupon produces a total of exactly $0.00 in staging but a small positive number in prod.`,
    logs: `console.error: [checkout] total sanity check failed { subtotal: 80, discount: 64, total: -1.28 }
console.error: [checkout] total sanity check failed { subtotal: 210, discount: 168, total: -3.36 }`,
    files: [
      {
        filePath: "src/cart/constants.js",
        isEditable: false,
        language: "javascript",
        content: `// Shared pricing constants — owned by the payments team. DO NOT EDIT.
exports.TAX_RATE = 0.08;
exports.MAX_DISCOUNT_RATE = 1; // coupons can never exceed 100%
`,
      },
      {
        filePath: "src/cart/formatPrice.js",
        isEditable: false,
        language: "javascript",
        content: `// Renders a number of dollars as a display string. Locked — used app-wide.
exports.formatPrice = function (amount) {
  return "$" + amount.toFixed(2);
};
`,
      },
      {
        filePath: "src/cart/calculateTotals.js",
        isEditable: true,
        language: "javascript",
        content: `var constants = require("./constants");

// items: [{ name, priceCents, quantity }]
// coupon: { rate } where rate is 0..1 (0.2 = 20% off) — or null
exports.calculateTotals = function (items, coupon) {
  var subtotalCents = 0;
  for (var i = 0; i < items.length; i++) {
    subtotalCents += items[i].priceCents;
  }

  var rate = coupon ? coupon.rate : 0;
  if (rate > constants.MAX_DISCOUNT_RATE) rate = constants.MAX_DISCOUNT_RATE;

  var discountCents = Math.round(subtotalCents * rate * items.length);
  var taxedCents = Math.round((subtotalCents - discountCents) * (1 + constants.TAX_RATE));

  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: taxedCents / 100,
  };
};
`,
      },
    ],
    tests: [
      {
        name: "subtotal multiplies price by quantity",
        isHidden: false,
        source: `var calc = require("src/cart/calculateTotals").calculateTotals;
var r = calc([{ name: "Desk Lamp", priceCents: 4000, quantity: 2 }], null);
assert.equal(r.subtotal, 80, "subtotal for 2 × $40.00");`,
      },
      {
        name: "20% coupon discounts the subtotal once",
        isHidden: false,
        source: `var calc = require("src/cart/calculateTotals").calculateTotals;
var r = calc([{ name: "Desk Lamp", priceCents: 4000, quantity: 2 }], { rate: 0.2 });
assert.equal(r.discount, 16, "discount for 20% of $80.00");
assert.equal(r.total, 69.12, "total = (80 - 16) * 1.08");`,
      },
      {
        name: "no coupon means no discount",
        isHidden: false,
        source: `var calc = require("src/cart/calculateTotals").calculateTotals;
var r = calc([{ name: "Mug", priceCents: 1250, quantity: 1 }], null);
assert.equal(r.discount, 0);
assert.equal(r.total, 13.5, "total = 12.50 * 1.08");`,
      },
      {
        name: "multi-line carts stay consistent",
        isHidden: true,
        source: `var calc = require("src/cart/calculateTotals").calculateTotals;
var r = calc([
  { name: "Keyboard", priceCents: 9900, quantity: 1 },
  { name: "Cable", priceCents: 700, quantity: 3 },
], { rate: 0.1 });
assert.equal(r.subtotal, 120, "99.00 + 3 × 7.00");
assert.equal(r.discount, 12);
assert.equal(r.total, 116.64, "(120 - 12) * 1.08");`,
      },
      {
        name: "100% coupon clamps to a zero total",
        isHidden: true,
        source: `var calc = require("src/cart/calculateTotals").calculateTotals;
var r = calc([{ name: "Sticker", priceCents: 300, quantity: 4 }], { rate: 1.5 });
assert.equal(r.discount, 12, "clamped to 100% of the $12.00 subtotal");
assert.equal(r.total, 0);`,
      },
    ],
    fixedFiles: {
      "src/cart/calculateTotals.js": `var constants = require("./constants");

exports.calculateTotals = function (items, coupon) {
  var subtotalCents = 0;
  for (var i = 0; i < items.length; i++) {
    subtotalCents += items[i].priceCents * items[i].quantity;
  }

  var rate = coupon ? coupon.rate : 0;
  if (rate > constants.MAX_DISCOUNT_RATE) rate = constants.MAX_DISCOUNT_RATE;

  var discountCents = Math.round(subtotalCents * rate);
  var taxedCents = Math.round((subtotalCents - discountCents) * (1 + constants.TAX_RATE));

  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: taxedCents / 100,
  };
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 2. BACKEND — pagination
  // ════════════════════════════════════════════════════════════════
  {
    title: "Ghost Rows in the Audit Log",
    difficulty: "medium",
    category: "backend",
    description: `The **audit-log API** of an internal admin tool paginates records for the dashboard. Customers report that page 1 is missing the newest records, and the same rows appear on two different pages.

The Express handler and the mock data layer are locked — the bug is isolated in \`paginate.js\`, the pure helper the handler delegates to.

Make the whole suite green without touching the locked files.`,
    bugReport: `**BUG-3341** · Priority: High · Reported by: platform-eng

The dashboard shows 10 rows per page. With 25 records in the table:
- Page 1 starts at record #11 instead of record #1
- Records #21–25 appear on BOTH page 2 and page 3
- The "next page" arrow stays enabled on the final page, leading to an empty page 4

API contract (see handler.js): \`page\` is 1-based; response = { items, page, hasNext }.`,
    logs: `GET /api/audit?page=1&limit=10 -> items[0].id = 11 (expected 1)
GET /api/audit?page=3&limit=10 -> hasNext = true (expected false)`,
    files: [
      {
        filePath: "src/api/db.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock data layer — stands in for the real ORM. DO NOT EDIT.
var ROWS = [];
for (var i = 1; i <= 25; i++) {
  ROWS.push({ id: i, action: "event-" + i });
}

// findMany({ skip, take }) mirrors the real client's semantics.
exports.findMany = function (opts) {
  var skip = opts && opts.skip ? opts.skip : 0;
  var take = opts && typeof opts.take === "number" ? opts.take : ROWS.length;
  return ROWS.slice(skip, skip + take);
};

exports.count = function () {
  return ROWS.length;
};
`,
      },
      {
        filePath: "src/api/paginate.js",
        isEditable: true,
        language: "javascript",
        content: `// Pure pagination helper used by the audit-log handler.
// page is 1-based. Returns { skip, take, hasNext }.
exports.getPageWindow = function (page, limit, totalCount) {
  var skip = page * limit;
  var take = limit;
  var hasNext = skip + take <= totalCount;
  return { skip: skip, take: take, hasNext: hasNext };
};
`,
      },
      {
        filePath: "src/api/handler.js",
        isEditable: false,
        language: "javascript",
        content: `// Express-style handler (framework stripped). DO NOT EDIT.
var db = require("./db");
var paginate = require("./paginate");

exports.getAuditPage = function (query) {
  var page = parseInt(query.page, 10) || 1;
  var limit = parseInt(query.limit, 10) || 10;

  var win = paginate.getPageWindow(page, limit, db.count());
  var items = db.findMany({ skip: win.skip, take: win.take });

  return { items: items, page: page, hasNext: win.hasNext };
};
`,
      },
    ],
    tests: [
      {
        name: "page 1 starts at the first record",
        isHidden: false,
        source: `var h = require("src/api/handler");
var r = h.getAuditPage({ page: "1", limit: "10" });
assert.equal(r.items.length, 10);
assert.equal(r.items[0].id, 1, "first row of page 1");
assert.equal(r.hasNext, true);`,
      },
      {
        name: "page 2 continues without overlap",
        isHidden: false,
        source: `var h = require("src/api/handler");
var p1 = h.getAuditPage({ page: "1", limit: "10" });
var p2 = h.getAuditPage({ page: "2", limit: "10" });
assert.equal(p2.items[0].id, 11, "page 2 starts where page 1 ended");
var ids1 = p1.items.map(function (x) { return x.id; });
var ids2 = p2.items.map(function (x) { return x.id; });
for (var i = 0; i < ids2.length; i++) {
  assert.ok(ids1.indexOf(ids2[i]) === -1, "row " + ids2[i] + " duplicated across pages");
}`,
      },
      {
        name: "final partial page disables hasNext",
        isHidden: false,
        source: `var h = require("src/api/handler");
var r = h.getAuditPage({ page: "3", limit: "10" });
assert.equal(r.items.length, 5, "25 rows -> last page has 5");
assert.equal(r.items[0].id, 21);
assert.equal(r.hasNext, false);`,
      },
      {
        name: "exactly-full last page also stops",
        isHidden: true,
        source: `var p = require("src/api/paginate");
var win = p.getPageWindow(5, 5, 25);
assert.equal(win.skip, 20);
assert.equal(win.hasNext, false, "page 5 of 5x5=25 is the end");`,
      },
      {
        name: "out-of-range page returns an empty window",
        isHidden: true,
        source: `var h = require("src/api/handler");
var r = h.getAuditPage({ page: "9", limit: "10" });
assert.equal(r.items.length, 0);
assert.equal(r.hasNext, false);`,
      },
    ],
    fixedFiles: {
      "src/api/paginate.js": `// Pure pagination helper used by the audit-log handler.
// page is 1-based. Returns { skip, take, hasNext }.
exports.getPageWindow = function (page, limit, totalCount) {
  var skip = (page - 1) * limit;
  var take = limit;
  var hasNext = skip + take < totalCount;
  return { skip: skip, take: take, hasNext: hasNext };
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 3. DATABASE — connection string parsing
  // ════════════════════════════════════════════════════════════════
  {
    title: "Access Denied at Midnight",
    difficulty: "medium",
    category: "database",
    description: `After a credential rotation, the **reporting service** can no longer reach its MySQL database — but only in production. The new password contains special characters, which the platform team URL-encodes into the connection string, exactly per spec.

The pool builder and the service entrypoint are locked. The bug is in \`parseConnectionString.js\`.

Decode what the spec requires, and the suite goes green.`,
    bugReport: `**BUG-4090** · Priority: Blocker · Reported by: on-call (02:14)

After rotating the DB password to \`S3cure@pass%\` the service fails to boot.
The connection string set in the environment is:

    mysql://reporter:S3cure%40pass%25@db.internal:3306/analytics

Spec (RFC 3986): userinfo is percent-ENCODED in the URL and must be DECODED
before use. The host must obviously never contain pieces of the password.

Staging (password without special characters) connects fine, which is why this
slipped through review.`,
    logs: `[pool] connecting as user="reporter" host="pass%25@db.internal" ...
[pool] ERROR Access denied for user 'reporter'@'10.0.3.17' (using password: YES)
[boot] FATAL could not initialize reporting database`,
    files: [
      {
        filePath: "src/db/parseConnectionString.js",
        isEditable: true,
        language: "javascript",
        content: `// Parses mysql://user:password@host:port/database?params
// Returns { user, password, host, port, database }.
exports.parseConnectionString = function (url) {
  var rest = url.slice("mysql://".length);

  var atIndex = rest.indexOf("@");
  var creds = rest.slice(0, atIndex);
  var location = rest.slice(atIndex + 1);

  var colon = creds.indexOf(":");
  var user = creds.slice(0, colon);
  var password = creds.slice(colon + 1);

  var qIndex = location.indexOf("?");
  if (qIndex !== -1) location = location.slice(0, qIndex);

  var slash = location.indexOf("/");
  var hostPort = location.slice(0, slash);
  var database = location.slice(slash + 1);

  var hpColon = hostPort.indexOf(":");
  var host = hpColon === -1 ? hostPort : hostPort.slice(0, hpColon);
  var port = hpColon === -1 ? 5432 : parseInt(hostPort.slice(hpColon + 1), 10);

  return { user: user, password: password, host: host, port: port, database: database };
};
`,
      },
      {
        filePath: "src/db/pool.js",
        isEditable: false,
        language: "javascript",
        content: `// Builds a (mock) pool config and validates it. DO NOT EDIT.
exports.createPool = function (config) {
  if (!config.host || config.host.indexOf("@") !== -1) {
    throw new Error("invalid host: " + config.host);
  }
  if (typeof config.port !== "number" || isNaN(config.port)) {
    throw new Error("invalid port");
  }
  return {
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
    status: "ready",
  };
};
`,
      },
      {
        filePath: "src/db/index.js",
        isEditable: false,
        language: "javascript",
        content: `// Service entrypoint used by the reporting jobs. DO NOT EDIT.
var parse = require("./parseConnectionString").parseConnectionString;
var pool = require("./pool");

exports.connect = function (url) {
  var config = parse(url);
  return pool.createPool(config);
};
`,
      },
    ],
    tests: [
      {
        name: "plain credentials parse cleanly",
        isHidden: false,
        source: `var db = require("src/db/index");
var p = db.connect("mysql://reporter:simplepass@db.internal:3306/analytics");
assert.equal(p.user, "reporter");
assert.equal(p.password, "simplepass");
assert.equal(p.host, "db.internal");
assert.equal(p.port, 3306);
assert.equal(p.database, "analytics");`,
      },
      {
        name: "percent-encoded password is decoded",
        isHidden: false,
        source: `var db = require("src/db/index");
var p = db.connect("mysql://reporter:S3cure%40pass%25@db.internal:3306/analytics");
assert.equal(p.password, "S3cure@pass%", "userinfo must be percent-decoded");
assert.equal(p.host, "db.internal", "host must not swallow password pieces");`,
      },
      {
        name: "default MySQL port is 3306",
        isHidden: false,
        source: `var parse = require("src/db/parseConnectionString").parseConnectionString;
var c = parse("mysql://root:root@localhost/app");
assert.equal(c.port, 3306, "mysql defaults to 3306, not 5432");`,
      },
      {
        name: "query string never leaks into the database name",
        isHidden: true,
        source: `var parse = require("src/db/parseConnectionString").parseConnectionString;
var c = parse("mysql://u:p@h:3307/shop?connection_limit=5");
assert.equal(c.database, "shop");
assert.equal(c.port, 3307);`,
      },
      {
        name: "encoded user is decoded too",
        isHidden: true,
        source: `var parse = require("src/db/parseConnectionString").parseConnectionString;
var c = parse("mysql://svc%2Breporting:pw@h:3306/app");
assert.equal(c.user, "svc+reporting");`,
      },
    ],
    fixedFiles: {
      "src/db/parseConnectionString.js": `// Parses mysql://user:password@host:port/database?params
// Returns { user, password, host, port, database }.
exports.parseConnectionString = function (url) {
  var rest = url.slice("mysql://".length);

  var atIndex = rest.lastIndexOf("@");
  var creds = rest.slice(0, atIndex);
  var location = rest.slice(atIndex + 1);

  var colon = creds.indexOf(":");
  var user = decodeURIComponent(creds.slice(0, colon));
  var password = decodeURIComponent(creds.slice(colon + 1));

  var qIndex = location.indexOf("?");
  if (qIndex !== -1) location = location.slice(0, qIndex);

  var slash = location.indexOf("/");
  var hostPort = location.slice(0, slash);
  var database = location.slice(slash + 1);

  var hpColon = hostPort.indexOf(":");
  var host = hpColon === -1 ? hostPort : hostPort.slice(0, hpColon);
  var port = hpColon === -1 ? 3306 : parseInt(hostPort.slice(hpColon + 1), 10);

  return { user: user, password: password, host: host, port: port, database: database };
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 4. FRONTEND — stale async search results
  // ════════════════════════════════════════════════════════════════
  {
    title: "The Vanishing Search Results",
    difficulty: "easy",
    category: "frontend",
    description: `The search box on **Atlas Docs** shows results for a query the user typed three keystrokes ago. Fast responses for old queries are overwriting slow responses for new ones.

The UI pipeline and the mock search service are locked. The race-guard logic in \`requestTracker.js\` is where the bug lives.`,
    bugReport: `**BUG-1188** · Priority: High · Reported by: design QA

Type "re", then quickly "react". The list flashes the correct results, then
snaps BACK to the results for "re".

The tracker is supposed to give every request an increasing id, and only let
the response through if it belongs to the LATEST request.`,
    logs: `[search] issued id=1 q="re"
[search] issued id=2 q="react"
[search] applied id=2 q="react"   <- correct
[search] applied id=1 q="re"      <- stale overwrite!`,
    files: [
      {
        filePath: "src/search/requestTracker.js",
        isEditable: true,
        language: "javascript",
        content: `// Guards against out-of-order async responses.
var latestId = 0;

exports.nextRequestId = function () {
  latestId = latestId + 1;
  return latestId;
};

// Should return true only for the response belonging to the newest request.
exports.shouldApply = function (responseId) {
  return responseId <= latestId;
};

exports.reset = function () {
  latestId = 0;
};
`,
      },
      {
        filePath: "src/search/searchService.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock search backend. DO NOT EDIT.
exports.resultsFor = function (query) {
  return ["match-1:" + query, "match-2:" + query];
};
`,
      },
      {
        filePath: "src/search/ui.js",
        isEditable: false,
        language: "javascript",
        content: `// Render pipeline. DO NOT EDIT.
var tracker = require("./requestTracker");
var service = require("./searchService");

var rendered = null;

exports.issue = function (query) {
  var id = tracker.nextRequestId();
  return { id: id, query: query };
};

// A response arrives (possibly out of order).
exports.receive = function (request) {
  if (tracker.shouldApply(request.id)) {
    rendered = service.resultsFor(request.query);
  }
  return rendered;
};

exports.rendered = function () { return rendered; };
exports.resetAll = function () { rendered = null; tracker.reset(); };
`,
      },
    ],
    tests: [
      {
        name: "in-order responses render normally",
        isHidden: false,
        source: `var ui = require("src/search/ui");
ui.resetAll();
var a = ui.issue("re");
ui.receive(a);
assert.equal(ui.rendered()[0], "match-1:re");`,
      },
      {
        name: "stale response must not overwrite a newer one",
        isHidden: false,
        source: `var ui = require("src/search/ui");
ui.resetAll();
var a = ui.issue("re");
var b = ui.issue("react");
ui.receive(b); // fast response for the NEW query
ui.receive(a); // slow response for the OLD query arrives late
assert.equal(ui.rendered()[0], "match-1:react", "stale response overwrote the newer results");`,
      },
      {
        name: "the newest request always applies",
        isHidden: false,
        source: `var ui = require("src/search/ui");
ui.resetAll();
ui.issue("a");
var b = ui.issue("ab");
ui.receive(b);
assert.equal(ui.rendered()[0], "match-1:ab");`,
      },
      {
        name: "three-way interleave keeps only the final query",
        isHidden: true,
        source: `var ui = require("src/search/ui");
ui.resetAll();
var a = ui.issue("r");
var b = ui.issue("re");
var c = ui.issue("rea");
ui.receive(c);
ui.receive(a);
ui.receive(b);
assert.equal(ui.rendered()[0], "match-1:rea");`,
      },
      {
        name: "reset starts a fresh id sequence",
        isHidden: true,
        source: `var tracker = require("src/search/requestTracker");
tracker.reset();
assert.equal(tracker.nextRequestId(), 1);
assert.equal(tracker.shouldApply(1), true);`,
      },
    ],
    fixedFiles: {
      "src/search/requestTracker.js": `// Guards against out-of-order async responses.
var latestId = 0;

exports.nextRequestId = function () {
  latestId = latestId + 1;
  return latestId;
};

// Should return true only for the response belonging to the newest request.
exports.shouldApply = function (responseId) {
  return responseId === latestId;
};

exports.reset = function () {
  latestId = 0;
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 5. FRONTEND — form validation
  // ════════════════════════════════════════════════════════════════
  {
    title: "False Positives at the Signup Gate",
    difficulty: "medium",
    category: "frontend",
    description: `The signup form on **Northwind Cloud** rejects perfectly valid users and lets some invalid ones through. The rule schema and error messages are locked; the interpreter in \`validate.js\` is yours to fix.

Three symptoms, one file.`,
    bugReport: `**BUG-2266** · Priority: High · Reported by: growth team (signup conversion -12%)

1. A user aged exactly 18 is rejected ("must be at least 18") — 18 IS the minimum.
2. Entering 0 for "newsletter frequency" says "this field is required" — 0 is a
   valid choice per the schema (required means present, not truthy).
3. The email "sales@acme" passes validation and bounces later — the rule says a
   dot-separated domain is required.`,
    logs: `[signup] reject { field: "age", value: 18, rule: "min:18" }
[signup] reject { field: "frequency", value: 0, rule: "required" }
[signup] accept { field: "email", value: "sales@acme" }`,
    files: [
      {
        filePath: "src/forms/rules.js",
        isEditable: false,
        language: "javascript",
        content: `// Field schema for the signup form. DO NOT EDIT.
exports.SIGNUP_RULES = {
  email: { required: true, email: true },
  age: { required: true, min: 18 },
  frequency: { required: true },
};
`,
      },
      {
        filePath: "src/forms/validate.js",
        isEditable: true,
        language: "javascript",
        content: `// Interprets the rule schema against submitted values.
// Returns an array of { field, message } errors (empty = valid).
var messages = require("./messages");

var EMAIL_RE = /\\S+@\\S+/;

exports.validate = function (rules, values) {
  var errors = [];

  for (var field in rules) {
    var rule = rules[field];
    var value = values[field];

    if (rule.required && !value) {
      errors.push({ field: field, message: messages.required(field) });
      continue;
    }

    if (rule.email && value !== undefined && !EMAIL_RE.test(value)) {
      errors.push({ field: field, message: messages.email(field) });
    }

    if (rule.min !== undefined && typeof value === "number" && value <= rule.min) {
      errors.push({ field: field, message: messages.min(field, rule.min) });
    }
  }

  return errors;
};
`,
      },
      {
        filePath: "src/forms/messages.js",
        isEditable: false,
        language: "javascript",
        content: `// Error message catalogue. DO NOT EDIT.
exports.required = function (field) { return field + " is required"; };
exports.email = function (field) { return field + " must be a valid email"; };
exports.min = function (field, min) { return field + " must be at least " + min; };
`,
      },
    ],
    tests: [
      {
        name: "a fully valid submission has no errors",
        isHidden: false,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "ada@lovelace.dev", age: 30, frequency: 2 });
assert.equal(errors.length, 0, JSON.stringify(errors));`,
      },
      {
        name: "age exactly at the minimum is accepted",
        isHidden: false,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "kid@family.org", age: 18, frequency: 1 });
assert.equal(errors.length, 0, "18 satisfies min:18 — got " + JSON.stringify(errors));`,
      },
      {
        name: "zero satisfies a required field",
        isHidden: false,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "x@y.io", age: 25, frequency: 0 });
assert.equal(errors.length, 0, "0 is present, required must pass — got " + JSON.stringify(errors));`,
      },
      {
        name: "an email without a domain dot is rejected",
        isHidden: false,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "sales@acme", age: 25, frequency: 1 });
assert.equal(errors.length, 1);
assert.equal(errors[0].field, "email");`,
      },
      {
        name: "missing values still fail required",
        isHidden: true,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "x@y.io", age: 25 });
assert.equal(errors.length, 1);
assert.equal(errors[0].message, "frequency is required");`,
      },
      {
        name: "multiple violations are all reported",
        isHidden: true,
        source: `var v = require("src/forms/validate").validate;
var rules = require("src/forms/rules").SIGNUP_RULES;
var errors = v(rules, { email: "nope", age: 12, frequency: 1 });
assert.equal(errors.length, 2, JSON.stringify(errors));`,
      },
    ],
    fixedFiles: {
      "src/forms/validate.js": `// Interprets the rule schema against submitted values.
// Returns an array of { field, message } errors (empty = valid).
var messages = require("./messages");

var EMAIL_RE = /^\\S+@\\S+\\.\\S+$/;

exports.validate = function (rules, values) {
  var errors = [];

  for (var field in rules) {
    var rule = rules[field];
    var value = values[field];

    if (rule.required && (value === undefined || value === null || value === "")) {
      errors.push({ field: field, message: messages.required(field) });
      continue;
    }

    if (rule.email && value !== undefined && !EMAIL_RE.test(value)) {
      errors.push({ field: field, message: messages.email(field) });
    }

    if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
      errors.push({ field: field, message: messages.min(field, rule.min) });
    }
  }

  return errors;
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 6. BACKEND — JWT expiry
  // ════════════════════════════════════════════════════════════════
  {
    title: "The Token That Never Dies",
    difficulty: "medium",
    category: "backend",
    description: `Security review flagged that **Meridian API** access tokens keep working long after they expire — and freshly issued tokens are sometimes rejected at 9 AM sharp.

Token decoding and the route guard are locked. \`verifyToken.js\` owns the expiry math.

Remember: JWT \`exp\` is in **seconds** since epoch (RFC 7519), and the service allows 60 seconds of clock skew in the client's favour.`,
    bugReport: `**BUG-5521** · Priority: Critical (security) · Reported by: pentest

- A token with exp = one hour AGO is still accepted.
- Tokens minted by a server whose clock is 30s ahead get rejected, even though
  the spec grants 60s of skew tolerance.

Contract for verifyToken(token, nowMs):
  returns { valid: true, userId } or { valid: false, reason }.`,
    logs: `[guard] ALLOW userId=u_812 exp=1767261600 now=1767265200000  <- expired 1h ago!
[guard] DENY  reason=expired exp=1767268830 now=1767268800000    <- only 30s ahead`,
    files: [
      {
        filePath: "src/auth/tokenStore.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock token decoding (signature already verified upstream). DO NOT EDIT.
// Token format used in tests: "uid|expSeconds"
exports.decode = function (token) {
  var parts = token.split("|");
  return { userId: parts[0], exp: parseInt(parts[1], 10) };
};
`,
      },
      {
        filePath: "src/auth/verifyToken.js",
        isEditable: true,
        language: "javascript",
        content: `var store = require("./tokenStore");

var CLOCK_SKEW_SECONDS = 60;

// exp is SECONDS since epoch (JWT spec). nowMs is milliseconds.
exports.verifyToken = function (token, nowMs) {
  var payload = store.decode(token);

  var deadline = payload.exp - CLOCK_SKEW_SECONDS;
  if (deadline < nowMs) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, userId: payload.userId };
};
`,
      },
      {
        filePath: "src/auth/guard.js",
        isEditable: false,
        language: "javascript",
        content: `// Route guard used by every protected endpoint. DO NOT EDIT.
var verify = require("./verifyToken").verifyToken;

exports.authorize = function (token, nowMs) {
  var result = verify(token, nowMs);
  if (!result.valid) return { status: 401, reason: result.reason };
  return { status: 200, userId: result.userId };
};
`,
      },
    ],
    tests: [
      {
        name: "a fresh token is accepted",
        isHidden: false,
        source: `var guard = require("src/auth/guard");
var nowMs = 1700000000000;
var exp = Math.floor(nowMs / 1000) + 3600; // valid for another hour
var r = guard.authorize("u_1|" + exp, nowMs);
assert.equal(r.status, 200);
assert.equal(r.userId, "u_1");`,
      },
      {
        name: "a token expired an hour ago is rejected",
        isHidden: false,
        source: `var guard = require("src/auth/guard");
var nowMs = 1700000000000;
var exp = Math.floor(nowMs / 1000) - 3600; // expired 1h ago
var r = guard.authorize("u_2|" + exp, nowMs);
assert.equal(r.status, 401, "expired token must be denied");
assert.equal(r.reason, "expired");`,
      },
      {
        name: "clock skew works in the client's favour",
        isHidden: false,
        source: `var guard = require("src/auth/guard");
var nowMs = 1700000000000;
var exp = Math.floor(nowMs / 1000) - 30; // nominally expired 30s ago — within 60s skew
var r = guard.authorize("u_3|" + exp, nowMs);
assert.equal(r.status, 200, "30s inside the skew window must pass");`,
      },
      {
        name: "just beyond the skew window is rejected",
        isHidden: true,
        source: `var guard = require("src/auth/guard");
var nowMs = 1700000000000;
var exp = Math.floor(nowMs / 1000) - 61; // 1s beyond the grace period
var r = guard.authorize("u_4|" + exp, nowMs);
assert.equal(r.status, 401);`,
      },
      {
        name: "expiry exactly at the skew boundary passes",
        isHidden: true,
        source: `var guard = require("src/auth/guard");
var nowMs = 1700000000000;
var exp = Math.floor(nowMs / 1000) - 60; // exactly at the boundary
var r = guard.authorize("u_5|" + exp, nowMs);
assert.equal(r.status, 200);`,
      },
    ],
    fixedFiles: {
      "src/auth/verifyToken.js": `var store = require("./tokenStore");

var CLOCK_SKEW_SECONDS = 60;

// exp is SECONDS since epoch (JWT spec). nowMs is milliseconds.
exports.verifyToken = function (token, nowMs) {
  var payload = store.decode(token);

  var deadlineMs = (payload.exp + CLOCK_SKEW_SECONDS) * 1000;
  if (deadlineMs < nowMs) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, userId: payload.userId };
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 7. BACKEND — rate limiter
  // ════════════════════════════════════════════════════════════════
  {
    title: "Rate Limiter Free-for-All",
    difficulty: "hard",
    category: "backend",
    description: `The public API of **Relay Notify** is supposed to allow **3 requests per 10 seconds per client**. Under load testing, one client got 40 requests through — and separate clients are mysteriously throttling each other.

The clock and the app wiring are locked. The sliding-window logic in \`rateLimiter.js\` has (at least) two independent bugs.`,
    bugReport: `**BUG-7010** · Priority: Critical · Reported by: SRE

Observed with limit=3, windowMs=10000:
- client A fires 5 requests instantly -> ALL 5 allowed (expected 3)
- client A then gets blocked... and so does client B, who sent nothing
- after waiting 10+ seconds, clients stay blocked longer than they should

Contract: allow(clientId, nowMs) -> true/false.`,
    logs: `[limit] allow A t=0     -> true
[limit] allow A t=1     -> true
[limit] allow A t=2     -> true
[limit] allow A t=3     -> true    <- should be false
[limit] allow B t=4     -> false   <- B never sent anything before!`,
    files: [
      {
        filePath: "src/mw/rateLimiter.js",
        isEditable: true,
        language: "javascript",
        content: `// Sliding-window rate limiter: LIMIT requests per WINDOW_MS per client.
var LIMIT = 3;
var WINDOW_MS = 10000;

var hits = [];

exports.allow = function (clientId, nowMs) {
  // Drop hits that have left the window
  hits = hits.filter(function (h) {
    return h.at > nowMs - WINDOW_MS && h.at !== nowMs - WINDOW_MS;
  });

  hits.push({ client: clientId, at: nowMs });

  var count = 0;
  for (var i = 0; i < hits.length; i++) {
    count++;
  }
  return count <= LIMIT + 1;
};

exports.resetAll = function () {
  hits = [];
};
`,
      },
      {
        filePath: "src/mw/app.js",
        isEditable: false,
        language: "javascript",
        content: `// Request pipeline. DO NOT EDIT.
var limiter = require("./rateLimiter");

exports.handle = function (clientId, nowMs) {
  if (!limiter.allow(clientId, nowMs)) {
    return { status: 429 };
  }
  return { status: 200 };
};

exports.reset = function () { limiter.resetAll(); };
`,
      },
    ],
    tests: [
      {
        name: "the first three requests pass",
        isHidden: false,
        source: `var app = require("src/mw/app");
app.reset();
assert.equal(app.handle("A", 0).status, 200);
assert.equal(app.handle("A", 100).status, 200);
assert.equal(app.handle("A", 200).status, 200);`,
      },
      {
        name: "the fourth request inside the window is throttled",
        isHidden: false,
        source: `var app = require("src/mw/app");
app.reset();
app.handle("A", 0);
app.handle("A", 100);
app.handle("A", 200);
assert.equal(app.handle("A", 300).status, 429, "4th request within 10s must be blocked");`,
      },
      {
        name: "clients are limited independently",
        isHidden: false,
        source: `var app = require("src/mw/app");
app.reset();
app.handle("A", 0);
app.handle("A", 1);
app.handle("A", 2);
assert.equal(app.handle("B", 3).status, 200, "client B has its own budget");`,
      },
      {
        name: "the window actually slides",
        isHidden: true,
        source: `var app = require("src/mw/app");
app.reset();
app.handle("A", 0);
app.handle("A", 100);
app.handle("A", 200);
assert.equal(app.handle("A", 10201).status, 200, "old hits left the window");`,
      },
      {
        name: "a hit exactly WINDOW_MS old no longer counts",
        isHidden: true,
        source: `var app = require("src/mw/app");
app.reset();
app.handle("A", 0);
app.handle("A", 1);
app.handle("A", 2);
assert.equal(app.handle("A", 10000).status, 200, "t=0 is outside (t > now - window fails)");`,
      },
    ],
    fixedFiles: {
      "src/mw/rateLimiter.js": `// Sliding-window rate limiter: LIMIT requests per WINDOW_MS per client.
var LIMIT = 3;
var WINDOW_MS = 10000;

var hits = [];

exports.allow = function (clientId, nowMs) {
  // Drop hits that have left the window
  hits = hits.filter(function (h) {
    return h.at > nowMs - WINDOW_MS;
  });

  var count = 0;
  for (var i = 0; i < hits.length; i++) {
    if (hits[i].client === clientId) count++;
  }
  if (count >= LIMIT) return false;

  hits.push({ client: clientId, at: nowMs });
  return true;
};

exports.resetAll = function () {
  hits = [];
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 8. DATABASE — query builder
  // ════════════════════════════════════════════════════════════════
  {
    title: "The Phantom WHERE Clause",
    difficulty: "medium",
    category: "database",
    description: `The internal ORM of **Ledgerline** builds parameterised SQL. Since last week's refactor, filtered reports return rows that should have been excluded, and reusing a base query leaks conditions between reports.

The mock SQL engine and fixtures are locked — they faithfully implement AND/OR and $n placeholders. Fix \`queryBuilder.js\`.`,
    bugReport: `**BUG-8804** · Priority: High · Reported by: finance (wrong report sent to a client!)

- .where("status", "paid").where("region", "EU") returns paid OR EU rows —
  the conditions must combine with AND.
- Building two different queries from one shared base makes the second query
  inherit the first one's filters.
- With two conditions both placeholders render as $1 — the engine then binds
  the wrong values.`,
    logs: `[sql] SELECT * FROM invoices WHERE status = $1 OR region = $1
[sql] params = ["paid", "EU"]
[report] expected 1 row, got 5`,
    files: [
      {
        filePath: "src/db/queryBuilder.js",
        isEditable: true,
        language: "javascript",
        content: `// Tiny parameterised query builder for the invoices table.
function Query(conditions) {
  this.conditions = conditions;
}

Query.prototype.where = function (field, value) {
  this.conditions.push({ field: field, value: value });
  return new Query(this.conditions);
};

Query.prototype.build = function () {
  if (this.conditions.length === 0) {
    return { sql: "SELECT * FROM invoices", params: [] };
  }
  var parts = [];
  var params = [];
  for (var i = 0; i < this.conditions.length; i++) {
    parts.push(this.conditions[i].field + " = $1");
    params.push(this.conditions[i].value);
  }
  return {
    sql: "SELECT * FROM invoices WHERE " + parts.join(" OR "),
    params: params,
  };
};

exports.query = function () {
  return new Query([]);
};
`,
      },
      {
        filePath: "src/db/engine.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock SQL engine — honestly evaluates the built SQL. DO NOT EDIT.
var FIXTURES = require("./fixtures").INVOICES;

exports.run = function (built) {
  var sql = built.sql;
  var params = built.params;
  if (sql.indexOf("WHERE") === -1) return FIXTURES.slice();

  var clause = sql.split("WHERE")[1].trim();
  var joiner = clause.indexOf(" AND ") !== -1 ? " AND " : " OR ";
  var conds = clause.split(joiner).map(function (part) {
    var m = part.trim().match(/^(\\w+) = \\$(\\d+)$/);
    if (!m) throw new Error("engine cannot parse condition: " + part.trim());
    return { field: m[1], value: params[parseInt(m[2], 10) - 1] };
  });

  return FIXTURES.filter(function (row) {
    var results = conds.map(function (c) { return row[c.field] === c.value; });
    if (joiner === " AND ") {
      return results.every(function (x) { return x; });
    }
    return results.some(function (x) { return x; });
  });
};
`,
      },
      {
        filePath: "src/db/fixtures.js",
        isEditable: false,
        language: "javascript",
        content: `// Test data. DO NOT EDIT.
exports.INVOICES = [
  { id: 1, status: "paid", region: "EU" },
  { id: 2, status: "paid", region: "US" },
  { id: 3, status: "open", region: "EU" },
  { id: 4, status: "open", region: "US" },
  { id: 5, status: "void", region: "EU" },
];
`,
      },
    ],
    tests: [
      {
        name: "a single condition filters correctly",
        isHidden: false,
        source: `var q = require("src/db/queryBuilder").query;
var engine = require("src/db/engine");
var rows = engine.run(q().where("status", "paid").build());
assert.equal(rows.length, 2);`,
      },
      {
        name: "two conditions combine with AND",
        isHidden: false,
        source: `var q = require("src/db/queryBuilder").query;
var engine = require("src/db/engine");
var rows = engine.run(q().where("status", "paid").where("region", "EU").build());
assert.equal(rows.length, 1, "only invoice #1 is paid AND in the EU");
assert.equal(rows[0].id, 1);`,
      },
      {
        name: "placeholders are numbered sequentially",
        isHidden: false,
        source: `var q = require("src/db/queryBuilder").query;
var built = q().where("status", "open").where("region", "US").build();
assert.ok(built.sql.indexOf("$2") !== -1, "second condition must bind $2, got: " + built.sql);
assert.equal(built.params.length, 2);`,
      },
      {
        name: "a shared base query is not mutated by branches",
        isHidden: true,
        source: `var q = require("src/db/queryBuilder").query;
var engine = require("src/db/engine");
var base = q().where("region", "EU");
var paid = base.where("status", "paid");
var open = base.where("status", "open");
assert.equal(engine.run(paid.build()).length, 1, "EU AND paid");
assert.equal(engine.run(open.build()).length, 1, "EU AND open — base leaked conditions if this fails");`,
      },
      {
        name: "no conditions returns every row",
        isHidden: true,
        source: `var q = require("src/db/queryBuilder").query;
var engine = require("src/db/engine");
assert.equal(engine.run(q().build()).length, 5);`,
      },
    ],
    fixedFiles: {
      "src/db/queryBuilder.js": `// Tiny parameterised query builder for the invoices table.
function Query(conditions) {
  this.conditions = conditions;
}

Query.prototype.where = function (field, value) {
  return new Query(this.conditions.concat([{ field: field, value: value }]));
};

Query.prototype.build = function () {
  if (this.conditions.length === 0) {
    return { sql: "SELECT * FROM invoices", params: [] };
  }
  var parts = [];
  var params = [];
  for (var i = 0; i < this.conditions.length; i++) {
    parts.push(this.conditions[i].field + " = $" + (i + 1));
    params.push(this.conditions[i].value);
  }
  return {
    sql: "SELECT * FROM invoices WHERE " + parts.join(" AND "),
    params: params,
  };
};

exports.query = function () {
  return new Query([]);
};
`,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 9. DATABASE — cache layer
  // ════════════════════════════════════════════════════════════════
  {
    title: "Cache Stampede at Dawn",
    difficulty: "hard",
    category: "database",
    description: `Every morning at 06:00, the **Horizon Analytics** database gets hammered with identical queries — the cache layer in front of it has quietly stopped caching. Worse, invalidating one report wipes the entire cache.

The mock database (with a call counter) and the raw cache store are locked. All three bugs live in \`cachedRepo.js\`.`,
    bugReport: `**BUG-9977** · Priority: Critical · Reported by: DBA on-call

With TTL = 60s:
- Two immediate reads of the same key hit the database TWICE (should be once).
- Reads of EXPIRED entries are served from cache forever — stale dashboards.
- invalidate("report:42") clears every key, causing the 06:00 stampede.

Contract: get(key, nowMs) -> value, using db.load(key) on a miss.`,
    logs: `[db] load report:42   (call #1)
[db] load report:42   (call #2)   <- cache miss again?!
[cache] invalidate report:42 -> store size 0 (was 31)`,
    files: [
      {
        filePath: "src/db/mockDb.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock database with a call counter. DO NOT EDIT.
var calls = 0;

exports.load = function (key) {
  calls = calls + 1;
  return "data-for-" + key;
};

exports.callCount = function () { return calls; };
exports.resetCalls = function () { calls = 0; };
`,
      },
      {
        filePath: "src/db/cacheStore.js",
        isEditable: false,
        language: "javascript",
        content: `// Raw cache store. DO NOT EDIT.
var entries = {};

exports.get = function (key) { return entries[key]; };
exports.set = function (key, entry) { entries[key] = entry; };
exports.remove = function (key) { delete entries[key]; };
exports.clear = function () { entries = {}; };
exports.size = function () { return Object.keys(entries).length; };
`,
      },
      {
        filePath: "src/db/cachedRepo.js",
        isEditable: true,
        language: "javascript",
        content: `// Read-through cache in front of the analytics database.
var db = require("./mockDb");
var store = require("./cacheStore");

var TTL_MS = 60000;

exports.get = function (key, nowMs) {
  var entry = store.get(key);
  if (entry) {
    if (nowMs - entry.storedAt < TTL_MS) {
      return entry.value;
    }
    return entry.value; // expired entries are cheap to serve
  }

  var value = db.load(key);
  return value;
};

exports.invalidate = function (key) {
  store.clear();
};

exports.resetAll = function () {
  store.clear();
  db.resetCalls();
};
`,
      },
    ],
    tests: [
      {
        name: "the second read of a key is served from cache",
        isHidden: false,
        source: `var repo = require("src/db/cachedRepo");
var db = require("src/db/mockDb");
repo.resetAll();
repo.get("report:42", 1000);
repo.get("report:42", 2000);
assert.equal(db.callCount(), 1, "identical reads within TTL must hit the db once");`,
      },
      {
        name: "an expired entry is re-fetched",
        isHidden: false,
        source: `var repo = require("src/db/cachedRepo");
var db = require("src/db/mockDb");
repo.resetAll();
repo.get("report:42", 1000);
repo.get("report:42", 1000 + 61000); // past the 60s TTL
assert.equal(db.callCount(), 2, "expired entries must be reloaded");`,
      },
      {
        name: "invalidate removes only the targeted key",
        isHidden: false,
        source: `var repo = require("src/db/cachedRepo");
var store = require("src/db/cacheStore");
repo.resetAll();
repo.get("report:1", 1000);
repo.get("report:2", 1000);
repo.invalidate("report:1");
assert.equal(store.size(), 1, "only report:1 should be evicted");`,
      },
      {
        name: "values are returned correctly on hit and miss",
        isHidden: true,
        source: `var repo = require("src/db/cachedRepo");
repo.resetAll();
assert.equal(repo.get("report:9", 1000), "data-for-report:9");
assert.equal(repo.get("report:9", 2000), "data-for-report:9");`,
      },
      {
        name: "a reload after expiry refreshes the TTL window",
        isHidden: true,
        source: `var repo = require("src/db/cachedRepo");
var db = require("src/db/mockDb");
repo.resetAll();
repo.get("k", 0);
repo.get("k", 61000); // expired -> reload (#2)
repo.get("k", 100000); // 39s after reload -> cached
assert.equal(db.callCount(), 2, "the refreshed entry must be cached again");`,
      },
    ],
    fixedFiles: {
      "src/db/cachedRepo.js": `// Read-through cache in front of the analytics database.
var db = require("./mockDb");
var store = require("./cacheStore");

var TTL_MS = 60000;

exports.get = function (key, nowMs) {
  var entry = store.get(key);
  if (entry && nowMs - entry.storedAt < TTL_MS) {
    return entry.value;
  }

  var value = db.load(key);
  store.set(key, { value: value, storedAt: nowMs });
  return value;
};

exports.invalidate = function (key) {
  store.remove(key);
};

exports.resetAll = function () {
  store.clear();
  db.resetCalls();
};
`,
    },
  },

];
