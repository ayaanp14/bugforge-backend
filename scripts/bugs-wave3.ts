/** Wave 3 — backend bugs inspired by famous real-world incidents (js + python). */
import type { BugSpec } from "./bugs-data.js";

export const WAVE3: BugSpec[] = [

  {
    title: "The Flag That Fired Old Code",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Feature Flags", "Trading"],
    description: `Inspired by Knight Capital's 2012 collapse: a decommissioned feature flag was repurposed, and servers still carrying the OLD code path blasted the market with orders. $460M gone in 45 minutes.

Here, the legacy module is locked (you can't delete it — that's the point). The router must treat the dead flag as dead and clamp order quantity, no matter what.`,
    bugReport: `**BUG-KCG-2012** · Priority: Existential · Reported by: risk desk

Spec for route(order, flags):
- The "power_peg" flag is DEAD. Its presence must change nothing.
- Quantity is always clamped to MAX_QTY (100) — never more, never negative.
- Exactly ONE order comes out for one order in.

Observed: with the flag set, the legacy blaster emits 1000x child orders.`,
    logs: `[router] flags=["power_peg"] in qty=50 -> out orders=50000 (!!)`,
    files: [
      {
        filePath: "src/trade/legacy.js",
        isEditable: false,
        language: "javascript",
        content: `// Decommissioned "Power Peg" test blaster. Kept for audit. DO NOT EDIT.
exports.blast = function (order) {
  var out = [];
  for (var i = 0; i < order.qty * 1000; i++) {
    out.push({ symbol: order.symbol, qty: 1 });
  }
  return out;
};
`,
      },
      {
        filePath: "src/trade/router.js",
        isEditable: true,
        language: "javascript",
        content: `var legacy = require("./legacy");

var MAX_QTY = 100;

// Routes one inbound order. flags is an array of active flag names.
exports.route = function (order, flags) {
  if (flags.indexOf("power_peg") !== -1) {
    return legacy.blast(order);
  }
  return [{ symbol: order.symbol, qty: order.qty }];
};
`,
      },
    ],
    tests: [
      {
        name: "the dead flag changes nothing",
        isHidden: false,
        source: `var route = require("src/trade/router").route;
var out = route({ symbol: "ACME", qty: 50 }, ["power_peg"]);
assert.equal(out.length, 1, "one order in, one order out");
assert.equal(out[0].qty, 50);`,
      },
      {
        name: "quantity is clamped to the risk limit",
        isHidden: false,
        source: `var route = require("src/trade/router").route;
var out = route({ symbol: "ACME", qty: 5000 }, []);
assert.equal(out[0].qty, 100, "MAX_QTY is 100");`,
      },
      {
        name: "normal orders pass through untouched",
        isHidden: false,
        source: `var route = require("src/trade/router").route;
var out = route({ symbol: "XYZ", qty: 7 }, ["dark_mode", "other"]);
assert.equal(out, [{ symbol: "XYZ", qty: 7 }]);`,
      },
      {
        name: "negative quantity never escapes",
        isHidden: true,
        source: `var route = require("src/trade/router").route;
var out = route({ symbol: "ACME", qty: -20 }, ["power_peg"]);
assert.equal(out.length, 1);
assert.equal(out[0].qty, 0, "clamped to zero");`,
      },
    ],
    fixedFiles: {
      "src/trade/router.js": `var legacy = require("./legacy");

var MAX_QTY = 100;

// Routes one inbound order. flags is an array of active flag names.
exports.route = function (order, flags) {
  var qty = order.qty;
  if (qty < 0) qty = 0;
  if (qty > MAX_QTY) qty = MAX_QTY;
  return [{ symbol: order.symbol, qty: qty }];
};
`,
    },
  },

  {
    title: "One Typo, Half the Internet",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Validation", "Operations"],
    description: `Inspired by the 2017 AWS S3 outage: an engineer running a routine playbook mistyped one number and removed far more capacity than intended — taking a chunk of the internet down with it.

The tooling should have refused. Make \`decommission.js\` refuse.`,
    bugReport: `**BUG-S3-0228** · Priority: Critical · Reported by: incident review

planRemoval(requestedCount, pool) rules:
- requestedCount must parse as a positive integer, else throw "invalid count"
- at least MIN_ALIVE (2) servers must remain: clamp the removal to pool.length - 2
- removing from a pool of 2 or fewer removes nothing

Observed: "1O0" (letter O) parsed as 1, "100" removed 100 of 10, pool hit zero.`,
    logs: `[decom] pool=10 requested=100 removed=10 remaining=0
[decom] index-fleet offline; GET /* -> 500`,
    files: [
      {
        filePath: "src/ops/decommission.js",
        isEditable: true,
        language: "javascript",
        content: `var MIN_ALIVE = 2;

// Plans a capacity removal. Returns the servers that remain.
exports.planRemoval = function (requestedCount, pool) {
  var count = parseInt(requestedCount, 10);
  return pool.slice(0, pool.length - count);
};
`,
      },
    ],
    tests: [
      {
        name: "a sane removal removes exactly that many",
        isHidden: false,
        source: `var plan = require("src/ops/decommission").planRemoval;
var remaining = plan("3", ["a", "b", "c", "d", "e", "f"]);
assert.equal(remaining.length, 3);`,
      },
      {
        name: "an oversized request is clamped to keep MIN_ALIVE",
        isHidden: false,
        source: `var plan = require("src/ops/decommission").planRemoval;
var pool = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];
var remaining = plan("100", pool);
assert.equal(remaining.length, 2, "never below MIN_ALIVE");`,
      },
      {
        name: "garbage input throws instead of guessing",
        isHidden: false,
        source: `var plan = require("src/ops/decommission").planRemoval;
assert.throws(function () { plan("1O0", ["a", "b", "c"]); }, "letter O is not a number");
assert.throws(function () { plan("-5", ["a", "b", "c"]); });`,
      },
      {
        name: "a tiny pool is untouchable",
        isHidden: true,
        source: `var plan = require("src/ops/decommission").planRemoval;
assert.equal(plan("1", ["a", "b"]).length, 2, "pools at MIN_ALIVE lose nothing");`,
      },
    ],
    fixedFiles: {
      "src/ops/decommission.js": `var MIN_ALIVE = 2;

// Plans a capacity removal. Returns the servers that remain.
exports.planRemoval = function (requestedCount, pool) {
  if (!/^\\d+$/.test(String(requestedCount).trim())) {
    throw new Error("invalid count: " + requestedCount);
  }
  var count = parseInt(requestedCount, 10);
  var maxRemovable = Math.max(0, pool.length - MIN_ALIVE);
  if (count > maxRemovable) count = maxRemovable;
  return pool.slice(0, pool.length - count);
};
`,
    },
  },

  {
    title: "The Greedy Regex",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Regex", "Parsing"],
    description: `Inspired by Cloudflare's 2019 global outage — a single greedy regex in the WAF pinned every CPU on the edge. Beyond the meltdown, greedy patterns are just wrong-answer machines.

\`ruleParser.js\` extracts the FIRST \`key=value\` token from a firewall rule line. The shipped pattern grabs the wrong things.`,
    bugReport: `**BUG-WAF-711** · Priority: Critical · Reported by: edge team

extractAssignment(line) spec:
- scan whitespace-separated tokens; the first token containing "=" wins
- key = the part before the FIRST "=", value = everything after it
- keys are lowercase letters/underscores only, else keep scanning
- no such token -> null

Observed: on "score=5 action=block", the greedy pattern returns
key "score=5 action" value "block".`,
    logs: `[waf] parse("score=5 action=block") -> { key: "score=5 action", value: "block" }`,
    files: [
      {
        filePath: "src/waf/ruleParser.js",
        isEditable: true,
        language: "javascript",
        content: `// Extracts the first key=value assignment from a rule line.
exports.extractAssignment = function (line) {
  var m = line.match(/(.*)=(.*)/);
  if (!m) return null;
  return { key: m[1], value: m[2] };
};
`,
      },
    ],
    tests: [
      {
        name: "the first assignment wins",
        isHidden: false,
        source: `var x = require("src/waf/ruleParser").extractAssignment;
assert.equal(x("score=5 action=block"), { key: "score", value: "5" });`,
      },
      {
        name: "value keeps everything after the first equals",
        isHidden: false,
        source: `var x = require("src/waf/ruleParser").extractAssignment;
assert.equal(x("expr=a==b other"), { key: "expr", value: "a==b" });`,
      },
      {
        name: "tokens with invalid keys are skipped",
        isHidden: false,
        source: `var x = require("src/waf/ruleParser").extractAssignment;
assert.equal(x("9bad=1 mode=strict"), { key: "mode", value: "strict" });`,
      },
      {
        name: "no assignment returns null",
        isHidden: true,
        source: `var x = require("src/waf/ruleParser").extractAssignment;
assert.equal(x("just some words"), null);
assert.equal(x(""), null);`,
      },
    ],
    fixedFiles: {
      "src/waf/ruleParser.js": `// Extracts the first key=value assignment from a rule line.
exports.extractAssignment = function (line) {
  var tokens = line.split(/\\s+/);
  for (var i = 0; i < tokens.length; i++) {
    var eq = tokens[i].indexOf("=");
    if (eq <= 0) continue;
    var key = tokens[i].slice(0, eq);
    if (!/^[a-z_]+$/.test(key)) continue;
    return { key: key, value: tokens[i].slice(eq + 1) };
  }
  return null;
};
`,
    },
  },

  {
    title: "The Leap Day Meltdown",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Dates", "Leap Years"],
    description: `Inspired by the GitHub and Azure outages that both landed on February 29th. Monthly billing anniversaries get pushed "one month forward" — and every date library shortcut breaks on leap years.

\`billing.py\` computes the next billing date. Its month table thinks February always has 28 days, and it never clamps.`,
    bugReport: `**BUG-0229** · Priority: High · Reported by: billing on-call

next_billing_date(year, month, day) -> [year, month, day] rules:
- move one month forward, clamping the day to the target month's length
- February has 29 days in leap years (divisible by 4, except centuries
  unless divisible by 400)

Observed: Jan 31, 2024 -> "Feb 31" -> exception; Jan 31, 2023 -> Mar 3 drift.`,
    logs: `[billing] anniversary(2024, 1, 31) raised: day is out of range for month`,
    files: [
      {
        filePath: "src/billing.py",
        isEditable: true,
        language: "python",
        content: `# Computes the next monthly billing anniversary.

DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

def next_billing_date(year, month, day):
    month = month + 1
    if month > 12:
        month = 1
        year = year + 1
    return [year, month, day]
`,
      },
    ],
    tests: [
      {
        name: "leap-year February clamps to the 29th",
        isHidden: false,
        source: `m = bug_require("src/billing")
assert_.equal(m.next_billing_date(2024, 1, 31), [2024, 2, 29], "2024 is a leap year")`,
      },
      {
        name: "non-leap February clamps to the 28th",
        isHidden: false,
        source: `m = bug_require("src/billing")
assert_.equal(m.next_billing_date(2023, 1, 31), [2023, 2, 28])`,
      },
      {
        name: "31st clamps into 30-day months",
        isHidden: false,
        source: `m = bug_require("src/billing")
assert_.equal(m.next_billing_date(2024, 3, 31), [2024, 4, 30])`,
      },
      {
        name: "december rolls the year",
        isHidden: true,
        source: `m = bug_require("src/billing")
assert_.equal(m.next_billing_date(2024, 12, 15), [2025, 1, 15])
assert_.equal(m.next_billing_date(2100, 1, 29), [2100, 2, 28], "2100 is NOT a leap year")`,
      },
    ],
    fixedFiles: {
      "src/billing.py": `# Computes the next monthly billing anniversary.

DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

def _is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

def _month_length(year, month):
    if month == 2 and _is_leap(year):
        return 29
    return DAYS_IN_MONTH[month - 1]

def next_billing_date(year, month, day):
    month = month + 1
    if month > 12:
        month = 1
        year = year + 1
    limit = _month_length(year, month)
    if day > limit:
        day = limit
    return [year, month, day]
`,
    },
  },

  {
    title: "Left-Pad the World",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Strings", "Dependencies"],
    description: `Inspired by the 11 lines that broke the internet in 2016, when \`left-pad\` vanished from npm and half the ecosystem stopped building. The team vendored their own replacement — and got those 11 lines wrong.

\`leftPad.js\`: pad a string on the left to a target length.`,
    bugReport: `**BUG-11LOC** · Reported by: build infra

leftPad(str, len, ch):
- pads with ch (default " ") until the string is len long
- strings already at or beyond len come back untouched

Observed: leftPad("5", 3, "0") returns "0005" (pads len EXTRA chars) and the
default fill inserts the literal text "undefined".`,
    logs: `[ids] order number rendered as "undefined42"`,
    files: [
      {
        filePath: "src/util/leftPad.js",
        isEditable: true,
        language: "javascript",
        content: `// Pads str on the left with ch until it reaches len characters.
exports.leftPad = function (str, len, ch) {
  str = String(str);
  var pad = "";
  for (var i = 0; i < len; i++) {
    pad += ch;
  }
  return pad + str;
};
`,
      },
    ],
    tests: [
      {
        name: "pads to the target length",
        isHidden: false,
        source: `var lp = require("src/util/leftPad").leftPad;
assert.equal(lp("5", 3, "0"), "005");`,
      },
      {
        name: "long-enough strings pass through",
        isHidden: false,
        source: `var lp = require("src/util/leftPad").leftPad;
assert.equal(lp("hello", 3, "0"), "hello");
assert.equal(lp("abc", 3, "0"), "abc");`,
      },
      {
        name: "default fill is a space",
        isHidden: false,
        source: `var lp = require("src/util/leftPad").leftPad;
assert.equal(lp("7", 3), "  7");`,
      },
      {
        name: "numbers are stringified first",
        isHidden: true,
        source: `var lp = require("src/util/leftPad").leftPad;
assert.equal(lp(42, 5, "x"), "xxx42");`,
      },
    ],
    fixedFiles: {
      "src/util/leftPad.js": `// Pads str on the left with ch until it reaches len characters.
exports.leftPad = function (str, len, ch) {
  str = String(str);
  if (ch === undefined) ch = " ";
  var pad = "";
  while (pad.length + str.length < len) {
    pad += ch;
  }
  return pad + str;
};
`,
    },
  },

  {
    title: "The Negative Invoice",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Validation", "Payments"],
    description: `Inspired by the classic negative-amount exploits that have hit payment processors: transfer **-$500** to someone and the money flows backwards, straight past every balance check.

\`transfer.py\` moves money between accounts. It trusts the amount.`,
    bugReport: `**BUG-MINUS** · Priority: Critical (fraud) · Reported by: fintech risk

transfer(balances, src, dst, amount) rules:
- amount must be a positive number -> otherwise raise ValueError
- src must hold at least amount   -> otherwise raise ValueError
- on success, debit src and credit dst; return the updated dict

Observed: amount=-500 silently DRAINS the destination account.`,
    logs: `[xfer] alice->bob amount=-500 | alice 1500 (+500), bob -300 (-500)`,
    files: [
      {
        filePath: "src/pay/transfer.py",
        isEditable: true,
        language: "python",
        content: `# Moves money between account balances (a dict of name -> cents).

def transfer(balances, src, dst, amount):
    balances[src] = balances[src] - amount
    balances[dst] = balances[dst] + amount
    return balances
`,
      },
    ],
    tests: [
      {
        name: "a normal transfer moves the money",
        isHidden: false,
        source: `m = bug_require("src/pay/transfer")
out = m.transfer({"alice": 1000, "bob": 200}, "alice", "bob", 300)
assert_.equal(out["alice"], 700)
assert_.equal(out["bob"], 500)`,
      },
      {
        name: "negative amounts are rejected",
        isHidden: false,
        source: `m = bug_require("src/pay/transfer")
assert_.throws(lambda: m.transfer({"alice": 1000, "bob": 200}, "alice", "bob", -500), "negative amount")`,
      },
      {
        name: "insufficient funds are rejected",
        isHidden: false,
        source: `m = bug_require("src/pay/transfer")
assert_.throws(lambda: m.transfer({"alice": 100, "bob": 0}, "alice", "bob", 500))`,
      },
      {
        name: "an exact-balance transfer works and zero is rejected",
        isHidden: true,
        source: `m = bug_require("src/pay/transfer")
out = m.transfer({"a": 500, "b": 0}, "a", "b", 500)
assert_.equal(out["a"], 0)
assert_.equal(out["b"], 500)
assert_.throws(lambda: m.transfer({"a": 500, "b": 0}, "a", "b", 0))`,
      },
    ],
    fixedFiles: {
      "src/pay/transfer.py": `# Moves money between account balances (a dict of name -> cents).

def transfer(balances, src, dst, amount):
    if not isinstance(amount, (int, float)) or amount <= 0:
        raise ValueError("amount must be positive")
    if balances[src] < amount:
        raise ValueError("insufficient funds")
    balances[src] = balances[src] - amount
    balances[dst] = balances[dst] + amount
    return balances
`,
    },
  },

  {
    title: "Infinite Leverage",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Finance", "Validation"],
    description: `Inspired by the 2019 "infinite money" exploit where a brokerage's margin math counted borrowed money as collateral for borrowing more. Users looped it into six-figure positions on a $2,000 deposit.

\`margin.py\` computes buying power. Three inputs, one rule each — all three are wrong.`,
    bugReport: `**BUG-∞-LEV** · Priority: Existential · Reported by: clearing

buying_power(account) with 2x leverage:
- settled_cash counts at 2x
- pending deposits count at ZERO (not settled!)
- borrowed funds SUBTRACT from buying power, never add

account = {"settled_cash": c, "pending": p, "borrowed": b}

Observed: pending and borrowed both counted at 2x — deposit, borrow, repeat.`,
    logs: `[margin] settled=2000 pending=50000 borrowed=48000 -> power=200000 (!!)`,
    files: [
      {
        filePath: "src/broker/margin.py",
        isEditable: true,
        language: "python",
        content: `# Computes buying power for a margin account.

LEVERAGE = 2

def buying_power(account):
    total = account["settled_cash"] + account["pending"] + account["borrowed"]
    return total * LEVERAGE
`,
      },
    ],
    tests: [
      {
        name: "settled cash gets 2x leverage",
        isHidden: false,
        source: `m = bug_require("src/broker/margin")
assert_.equal(m.buying_power({"settled_cash": 2000, "pending": 0, "borrowed": 0}), 4000)`,
      },
      {
        name: "pending deposits add nothing",
        isHidden: false,
        source: `m = bug_require("src/broker/margin")
assert_.equal(m.buying_power({"settled_cash": 2000, "pending": 50000, "borrowed": 0}), 4000)`,
      },
      {
        name: "borrowed funds reduce buying power",
        isHidden: false,
        source: `m = bug_require("src/broker/margin")
assert_.equal(m.buying_power({"settled_cash": 2000, "pending": 0, "borrowed": 1000}), 3000)`,
      },
      {
        name: "buying power never goes negative",
        isHidden: true,
        source: `m = bug_require("src/broker/margin")
assert_.equal(m.buying_power({"settled_cash": 100, "pending": 0, "borrowed": 5000}), 0)`,
      },
    ],
    fixedFiles: {
      "src/broker/margin.py": `# Computes buying power for a margin account.

LEVERAGE = 2

def buying_power(account):
    power = account["settled_cash"] * LEVERAGE - account["borrowed"]
    if power < 0:
        power = 0
    return power
`,
    },
  },

  {
    title: "The Null Price Latte",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Null Safety", "Pricing"],
    description: `Inspired by the point-of-sale glitches that let customers check out carts full of items with missing prices — for free. When the menu doesn't know an item, \`NaN\` walks straight through the math and the register renders it as $0.00.

\`register.js\` must refuse instead.`,
    bugReport: `**BUG-FREE-LATTE** · Priority: High · Reported by: store ops

total(items, menu) — items are { sku, qty }:
- unknown sku -> throw "Unknown item: <sku>"
- otherwise sum price * qty in cents

Observed: unknown skus produce NaN, the UI prints $0.00, and word spreads fast.`,
    logs: `[pos] cart=[latte, secret-item] total=NaN -> charged $0.00`,
    files: [
      {
        filePath: "src/pos/register.js",
        isEditable: true,
        language: "javascript",
        content: `// Sums a cart against the price menu (cents).
exports.total = function (items, menu) {
  var sum = 0;
  for (var i = 0; i < items.length; i++) {
    sum += menu[items[i].sku] * items[i].qty;
  }
  return sum;
};
`,
      },
    ],
    tests: [
      {
        name: "known items sum correctly",
        isHidden: false,
        source: `var total = require("src/pos/register").total;
var menu = { latte: 450, muffin: 300 };
assert.equal(total([{ sku: "latte", qty: 2 }, { sku: "muffin", qty: 1 }], menu), 1200);`,
      },
      {
        name: "unknown items throw loudly",
        isHidden: false,
        source: `var total = require("src/pos/register").total;
assert.throws(function () {
  total([{ sku: "secret-item", qty: 1 }], { latte: 450 });
}, "unknown sku must not be free");`,
      },
      {
        name: "an empty cart is zero",
        isHidden: true,
        source: `var total = require("src/pos/register").total;
assert.equal(total([], { latte: 450 }), 0);`,
      },
    ],
    fixedFiles: {
      "src/pos/register.js": `// Sums a cart against the price menu (cents).
exports.total = function (items, menu) {
  var sum = 0;
  for (var i = 0; i < items.length; i++) {
    var price = menu[items[i].sku];
    if (typeof price !== "number") {
      throw new Error("Unknown item: " + items[i].sku);
    }
    sum += price * items[i].qty;
  }
  return sum;
};
`,
    },
  },

  {
    title: "Retry After What?",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["HTTP", "Parsing"],
    description: `Inspired by the API clients that hammer rate-limited services into the ground. The \`Retry-After\` header legally comes in TWO shapes — a number of **seconds**, or an **HTTP date** — and this client handles neither correctly.

Fix \`backoff.js\` before the vendor blocks the whole IP range.`,
    bugReport: `**BUG-429** · Priority: High · Reported by: integrations

retryDelayMs(retryAfter, nowMs):
- numeric string ("30") -> that many SECONDS, as milliseconds
- HTTP date string     -> delay until that date (clamped to >= 0)
- missing/unparseable  -> default 1000ms

Observed: "30" is treated as 30 MILLISECONDS, and date headers become NaN,
so the client retries instantly, forever.`,
    logs: `[client] 429 retry-after="30" -> sleeping 30ms
[client] 429 retry-after="Wed, 21 Oct 2026 07:28:00 GMT" -> sleeping NaN`,
    files: [
      {
        filePath: "src/http/backoff.js",
        isEditable: true,
        language: "javascript",
        content: `// Turns a Retry-After header into a delay in milliseconds.
exports.retryDelayMs = function (retryAfter, nowMs) {
  return parseInt(retryAfter, 10);
};
`,
      },
    ],
    tests: [
      {
        name: "numeric seconds become milliseconds",
        isHidden: false,
        source: `var d = require("src/http/backoff").retryDelayMs;
assert.equal(d("30", 1700000000000), 30000);`,
      },
      {
        name: "http dates wait until the date",
        isHidden: false,
        source: `var d = require("src/http/backoff").retryDelayMs;
var now = Date.parse("2026-10-21T07:00:00Z");
assert.equal(d("Wed, 21 Oct 2026 07:28:00 GMT", now), 28 * 60 * 1000);`,
      },
      {
        name: "missing header falls back to one second",
        isHidden: false,
        source: `var d = require("src/http/backoff").retryDelayMs;
assert.equal(d(undefined, 1700000000000), 1000);
assert.equal(d("soonish", 1700000000000), 1000);`,
      },
      {
        name: "past dates clamp to zero",
        isHidden: true,
        source: `var d = require("src/http/backoff").retryDelayMs;
var now = Date.parse("2026-10-21T08:00:00Z");
assert.equal(d("Wed, 21 Oct 2026 07:28:00 GMT", now), 0);`,
      },
    ],
    fixedFiles: {
      "src/http/backoff.js": `// Turns a Retry-After header into a delay in milliseconds.
exports.retryDelayMs = function (retryAfter, nowMs) {
  if (typeof retryAfter === "string" && /^\\d+$/.test(retryAfter.trim())) {
    return parseInt(retryAfter, 10) * 1000;
  }
  var when = Date.parse(retryAfter);
  if (!isNaN(when)) {
    var delta = when - nowMs;
    return delta > 0 ? delta : 0;
  }
  return 1000;
};
`,
    },
  },

  {
    title: "The Replayed Webhook",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Time"],
    description: `Inspired by the webhook-replay attacks every payment integration guide warns about: capture one signed delivery, resend it later (or pre-date it into the future), and trigger the fulfilment twice.

\`webhook.py\` validates deliveries. Its replay window only looks one way, and its dedupe records the event before checking it.`,
    bugReport: `**BUG-HOOK-2X** · Priority: Critical (security) · Reported by: pentest

accept(event_id, timestamp, now, seen) rules (300s tolerance):
- reject if the event id was already accepted -> "replay"
- reject if |now - timestamp| > 300           -> "stale"
- otherwise record the id in seen and return "ok"

Observed: the same event id is accepted twice, and a timestamp 2 hours in the
FUTURE sails through.`,
    logs: `[hook] evt_9f2 accepted
[hook] evt_9f2 accepted   <- replay!`,
    files: [
      {
        filePath: "src/hooks/webhook.py",
        isEditable: true,
        language: "python",
        content: `# Validates an incoming webhook delivery.

TOLERANCE_SECONDS = 300

def accept(event_id, timestamp, now, seen):
    seen.add(event_id)
    if now - timestamp > TOLERANCE_SECONDS:
        return "stale"
    if event_id in seen:
        return "ok"
    return "ok"
`,
      },
    ],
    tests: [
      {
        name: "a fresh event is accepted once",
        isHidden: false,
        source: `m = bug_require("src/hooks/webhook")
seen = set()
assert_.equal(m.accept("evt_1", 1000, 1010, seen), "ok")`,
      },
      {
        name: "the same event id is a replay",
        isHidden: false,
        source: `m = bug_require("src/hooks/webhook")
seen = set()
m.accept("evt_1", 1000, 1010, seen)
assert_.equal(m.accept("evt_1", 1000, 1020, seen), "replay")`,
      },
      {
        name: "old deliveries are stale",
        isHidden: false,
        source: `m = bug_require("src/hooks/webhook")
assert_.equal(m.accept("evt_2", 1000, 2000, set()), "stale")`,
      },
      {
        name: "future-dated deliveries are stale too",
        isHidden: true,
        source: `m = bug_require("src/hooks/webhook")
seen = set()
assert_.equal(m.accept("evt_3", 9000, 1000, seen), "stale")
assert_.ok("evt_3" not in seen, "rejected events must not be recorded")`,
      },
    ],
    fixedFiles: {
      "src/hooks/webhook.py": `# Validates an incoming webhook delivery.

TOLERANCE_SECONDS = 300

def accept(event_id, timestamp, now, seen):
    if event_id in seen:
        return "replay"
    if abs(now - timestamp) > TOLERANCE_SECONDS:
        return "stale"
    seen.add(event_id)
    return "ok"
`,
    },
  },

  {
    title: "Happy New Year, Dropped Messages",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Queues", "Bounds"],
    description: `Inspired by the messaging-app meltdowns every New Year's Eve at midnight, when send queues overflow worldwide. Policy for the bounded outbox: when full, **drop the oldest** — the newest message is the one the user just hit send on.

\`outbox.js\` does the opposite, and its capacity check is off by one.`,
    bugReport: `**BUG-NYE** · Priority: High · Reported by: messaging core

enqueue(queue, msg, cap) rules:
- the returned queue never exceeds cap
- when full, the OLDEST message is dropped to admit the new one

Observed: at capacity the NEW message is silently discarded (users' midnight
wishes vanish), and the queue actually grows to cap+1 first.`,
    logs: `[outbox] cap=3 size=4
[outbox] dropped incoming msg id=m5 (queue kept stale m1)`,
    files: [
      {
        filePath: "src/msg/outbox.js",
        isEditable: true,
        language: "javascript",
        content: `// Bounded send queue. Returns the new queue (never mutates the input).
exports.enqueue = function (queue, msg, cap) {
  if (queue.length > cap) {
    return queue.slice();
  }
  return queue.concat([msg]);
};
`,
      },
    ],
    tests: [
      {
        name: "under capacity just appends",
        isHidden: false,
        source: `var enq = require("src/msg/outbox").enqueue;
assert.equal(enq(["m1"], "m2", 3), ["m1", "m2"]);`,
      },
      {
        name: "at capacity the oldest is dropped",
        isHidden: false,
        source: `var enq = require("src/msg/outbox").enqueue;
assert.equal(enq(["m1", "m2", "m3"], "m4", 3), ["m2", "m3", "m4"]);`,
      },
      {
        name: "the queue never exceeds cap",
        isHidden: false,
        source: `var enq = require("src/msg/outbox").enqueue;
var q = [];
for (var i = 1; i <= 10; i++) q = enq(q, "m" + i, 4);
assert.equal(q.length, 4);
assert.equal(q, ["m7", "m8", "m9", "m10"]);`,
      },
      {
        name: "cap of one keeps only the newest",
        isHidden: true,
        source: `var enq = require("src/msg/outbox").enqueue;
assert.equal(enq(["old"], "new", 1), ["new"]);`,
      },
    ],
    fixedFiles: {
      "src/msg/outbox.js": `// Bounded send queue. Returns the new queue (never mutates the input).
exports.enqueue = function (queue, msg, cap) {
  var next = queue.concat([msg]);
  while (next.length > cap) {
    next.shift();
  }
  return next;
};
`,
    },
  },

  {
    title: "Locked Out of Everything",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Networking", "Validation"],
    description: `Inspired by Facebook's October 2021 outage: a routine command withdrew the routes announcing their OWN backbone — including the ones engineers needed to log in and fix it. Badge readers stopped working. Someone reportedly needed an angle grinder.

\`routes.py\` plans a route withdrawal. It must protect the management network and never withdraw everything.`,
    bugReport: `**BUG-BGP-104** · Priority: Existential · Reported by: network eng

plan_withdrawal(announced, to_withdraw) rules:
- "mgmt/16" is sacred: it survives every withdrawal
- at least one route must remain announced, else raise ValueError
- returns the routes still announced, in their original order

Observed: the audit command withdrew mgmt/16 and then everything else.`,
    logs: `[bgp] withdrawing 214/214 routes
[noc] dashboards unreachable; DNS gone; door badges offline`,
    files: [
      {
        filePath: "src/net/routes.py",
        isEditable: true,
        language: "python",
        content: `# Plans a BGP route withdrawal.

MGMT_ROUTE = "mgmt/16"

def plan_withdrawal(announced, to_withdraw):
    remaining = []
    for route in announced:
        if route not in to_withdraw:
            remaining.append(route)
    return remaining
`,
      },
    ],
    tests: [
      {
        name: "a normal withdrawal removes the listed routes",
        isHidden: false,
        source: `m = bug_require("src/net/routes")
out = m.plan_withdrawal(["a/24", "b/24", "mgmt/16", "c/24"], ["b/24"])
assert_.equal(out, ["a/24", "mgmt/16", "c/24"])`,
      },
      {
        name: "the management route is untouchable",
        isHidden: false,
        source: `m = bug_require("src/net/routes")
out = m.plan_withdrawal(["a/24", "mgmt/16"], ["mgmt/16", "a/24"])
assert_.equal(out, ["mgmt/16"])`,
      },
      {
        name: "withdrawing every route is refused",
        isHidden: false,
        source: `m = bug_require("src/net/routes")
assert_.throws(lambda: m.plan_withdrawal(["a/24", "b/24"], ["a/24", "b/24"]), "cannot go fully dark")`,
      },
      {
        name: "order is preserved for the survivors",
        isHidden: true,
        source: `m = bug_require("src/net/routes")
out = m.plan_withdrawal(["z/24", "mgmt/16", "a/24", "m/24"], ["a/24"])
assert_.equal(out, ["z/24", "mgmt/16", "m/24"])`,
      },
    ],
    fixedFiles: {
      "src/net/routes.py": `# Plans a BGP route withdrawal.

MGMT_ROUTE = "mgmt/16"

def plan_withdrawal(announced, to_withdraw):
    remaining = []
    for route in announced:
        if route == MGMT_ROUTE or route not in to_withdraw:
            remaining.append(route)
    if len(remaining) == 0:
        raise ValueError("refusing to withdraw every announced route")
    return remaining
`,
    },
  },

];
