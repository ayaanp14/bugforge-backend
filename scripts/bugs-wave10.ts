/**
 * Wave 10 — famous production incidents, one planted bug each.
 *
 * Every challenge here is modelled on a documented, publicly written-up
 * failure at a named company or project (see bugs-origins.ts for the
 * attribution shown in the UI). The code is a reduced, runnable stand-in for
 * the real defect, not a copy of the original source.
 *
 * Project files are Node 12-safe JS: no ??, ?., replaceAll, .at() or .flat().
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE10: BugSpec[] = [

  {
    title: "The Pointer That Ran Past the Buffer",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Memory Safety", "Off-by-One"],
    description: `Modelled on **Cloudbleed** (Cloudflare, February 2017): an HTML rewriter checked for the end of its buffer with \`==\` instead of \`>=\`. When a page ended in just the wrong way the pointer stepped *past* the terminator, and the parser kept reading — spraying adjacent memory, including other customers' cookies and private messages, into public responses.

\`scanner.js\` walks a buffer looking for a terminator byte and returns everything before it. Its end check has the same flaw.

Fix \`scan\` so it can never read past the end of the buffer.`,
    bugReport: `**BUG-CB17** · Priority: Critical (data leak) · Reported by: security

scan(arena, length, terminator):
- \`arena\` is a shared backing store; this request owns only its first
  \`length\` bytes, and everything after that belongs to other requests
- returns the owned bytes before the first \`terminator\`
- if the terminator is absent within the owned region, returns all \`length\`
  of them

Observed: the loop bounds itself on the ARENA size rather than on \`length\`,
so a request whose region has no terminator keeps reading into the next
request's bytes and returns them.`,
    logs: `[rewriter] scan overran: length=3 returned=6
[rewriter] response contained bytes from an unrelated request`,
    files: [
      {
        filePath: "src/parser/scanner.js",
        isEditable: true,
        language: "javascript",
        content: `// Reads owned bytes up to (but not including) the terminator.
exports.scan = function (arena, length, terminator) {
  var out = [];
  var p = 0;
  // Stop when we reach the end of the backing store.
  while (p < arena.length) {
    if (arena[p] === terminator) return out;
    out.push(arena[p]);
    p++;
  }
  return out;
};
`,
      },
      {
        filePath: "src/parser/README.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nThe scanner is called on regions of a shared arena. Anything it reads at or
beyond \`length\` belongs to another request and must never be returned.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "stops at the terminator",
        isHidden: false,
        source: `var scan = require("src/parser/scanner").scan;
assert.equal(scan([1, 2, 0, 3, 4], 5, 0), [1, 2]);`,
      },
      {
        name: "a region without a terminator stops at its own end",
        isHidden: false,
        source: `var scan = require("src/parser/scanner").scan;
var arena = [1, 2, 3, 44, 55, 66];
assert.equal(scan(arena, 3, 0), [1, 2, 3], "must not read past the owned length");`,
      },
      {
        name: "an empty region returns nothing",
        isHidden: true,
        source: `var scan = require("src/parser/scanner").scan;
assert.equal(scan([9, 9, 9], 0, 0), []);`,
      },
      {
        name: "a terminator just past the region is not seen",
        isHidden: true,
        source: `var scan = require("src/parser/scanner").scan;
assert.equal(scan([5, 6, 0, 77], 2, 0), [5, 6]);`,
      },
    ],
    fixedFiles: {
      "src/parser/scanner.js": `// Reads owned bytes up to (but not including) the terminator.
exports.scan = function (arena, length, terminator) {
  var out = [];
  var p = 0;
  // Bound on the OWNED length, not on the shared backing store — everything at
  // or past \`length\` belongs to another request.
  while (p < length) {
    if (arena[p] === terminator) return out;
    out.push(arena[p]);
    p++;
  }
  return out;
};
`,
    },
  },

  {
    title: "Goto Fail, Goto Fail",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Control Flow"],
    description: `Modelled on Apple's **\`goto fail\`** bug (CVE-2014-1266, February 2014): a duplicated \`goto fail;\` line in the TLS handshake meant the *final* signature check was never executed. Every certificate that got that far was accepted, so anyone on the network could impersonate a secure site.

\`verify.js\` runs three checks in sequence and returns whether the certificate is trustworthy — except one of them can never fail the request.

Fix \`verifyCertificate\` so **all three** checks actually gate the result.`,
    bugReport: `**BUG-GOTOFAIL** · Priority: Critical (auth bypass) · Reported by: security audit

verifyCertificate(cert) must return true only when ALL of these hold:
- cert.chainValid is true
- cert.notExpired is true
- cert.signatureValid is true

Observed: a certificate with signatureValid=false is still accepted, as long as
the first two checks pass.`,
    logs: `[tls] accepted cert issuer="Totally Legit CA" signatureValid=false
[tls] MITM proxy interception went undetected in staging`,
    files: [
      {
        filePath: "src/tls/verify.js",
        isEditable: true,
        language: "javascript",
        content: `// Returns true only if every check passes.
exports.verifyCertificate = function (cert) {
  var ok = true;

  if (!cert.chainValid) {
    ok = false;
    return ok;
  }

  if (!cert.notExpired) {
    ok = false;
    return ok;
  }
    return ok;

  if (!cert.signatureValid) {
    ok = false;
    return ok;
  }

  return ok;
};
`,
      },
    ],
    tests: [
      {
        name: "a fully valid certificate is accepted",
        isHidden: false,
        source: `var v = require("src/tls/verify").verifyCertificate;
assert.equal(v({ chainValid: true, notExpired: true, signatureValid: true }), true);`,
      },
      {
        name: "a forged signature is rejected",
        isHidden: false,
        source: `var v = require("src/tls/verify").verifyCertificate;
assert.equal(v({ chainValid: true, notExpired: true, signatureValid: false }), false, "the signature check must gate the result");`,
      },
      {
        name: "an expired certificate is rejected",
        isHidden: true,
        source: `var v = require("src/tls/verify").verifyCertificate;
assert.equal(v({ chainValid: true, notExpired: false, signatureValid: true }), false);`,
      },
      {
        name: "a broken chain is rejected",
        isHidden: true,
        source: `var v = require("src/tls/verify").verifyCertificate;
assert.equal(v({ chainValid: false, notExpired: true, signatureValid: true }), false);`,
      },
    ],
    fixedFiles: {
      "src/tls/verify.js": `// Returns true only if every check passes.
exports.verifyCertificate = function (cert) {
  if (!cert.chainValid) return false;
  if (!cert.notExpired) return false;
  if (!cert.signatureValid) return false;
  return true;
};
`,
    },
  },

  {
    title: "Entropy Removed to Silence a Warning",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Randomness"],
    description: `Modelled on the **Debian OpenSSL** disaster (CVE-2008-0166): a maintainer removed a line that fed uninitialised memory into the random pool because it tripped a Valgrind warning. With it went almost all the entropy — the only varying input left was the process ID, so the whole distribution could only generate about 32,767 distinct keys.

\`keygen.js\` has the same shape: it *accepts* a seed of real entropy but never mixes it in.

Fix \`generateKey\` so the supplied entropy actually determines the key.`,
    bugReport: `**BUG-DSA1571** · Priority: Critical · Reported by: security research

generateKey(entropy, pid):
- must produce a key that depends on BOTH arguments
- two different entropy values with the same pid must give different keys

Observed: every machine with pid 4242 generates the identical key regardless of
the entropy handed to it. Scanning the keyspace takes seconds.`,
    logs: `[keygen] collision: entropy=91117 and entropy=55051 produced the same key
[keygen] distinct keys observed across 10000 runs: 4`,
    files: [
      {
        filePath: "src/crypto/keygen.js",
        isEditable: true,
        language: "javascript",
        content: `// Derives a key from the entropy pool and the process id.
exports.generateKey = function (entropy, pid) {
  var state = 5381;
  // NOTE: mixing the entropy pool tripped a memory checker, so it was removed.
  state = (state * 33 + pid) % 2147483647;
  state = (state * 33 + 17) % 2147483647;
  return state;
};
`,
      },
      {
        filePath: "src/crypto/POLICY.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nKey material must depend on every entropy source supplied to it. Removing an
input to quieten a diagnostic tool is never an acceptable fix.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "different entropy gives different keys",
        isHidden: false,
        source: `var g = require("src/crypto/keygen").generateKey;
assert.ok(g(91117, 4242) !== g(55051, 4242), "entropy must affect the key");`,
      },
      {
        name: "different pids still give different keys",
        isHidden: false,
        source: `var g = require("src/crypto/keygen").generateKey;
assert.ok(g(1234, 10) !== g(1234, 11), "the pid must still be mixed in");`,
      },
      {
        name: "the same inputs are reproducible",
        isHidden: true,
        source: `var g = require("src/crypto/keygen").generateKey;
assert.equal(g(777, 99), g(777, 99), "generation must stay deterministic");`,
      },
      {
        name: "a spread of entropy values yields many distinct keys",
        isHidden: true,
        source: `var g = require("src/crypto/keygen").generateKey;
var seen = {};
for (var i = 0; i < 50; i++) seen[g(i * 7919, 4242)] = true;
assert.ok(Object.keys(seen).length >= 40, "keyspace is far too small");`,
      },
    ],
    fixedFiles: {
      "src/crypto/keygen.js": `// Derives a key from the entropy pool and the process id.
exports.generateKey = function (entropy, pid) {
  var state = 5381;
  // Both inputs must reach the state, or the keyspace collapses to the pid.
  state = (state * 33 + entropy) % 2147483647;
  state = (state * 33 + pid) % 2147483647;
  state = (state * 33 + 17) % 2147483647;
  return state;
};
`,
    },
  },

  {
    title: "Seven Minutes to Parse a Menu",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Performance", "Complexity"],
    description: `Modelled on the **GTA Online** load-time investigation (2021): a player traced six-minute loads to a JSON parser that called \`sscanf\` on a 10 MB buffer for every one of its 63,000 items. \`sscanf\` measures the whole string first, so each item cost a full scan — a one-line fix cut load times by 70%.

\`catalog.js\` has the same shape: a helper re-walks the entire payload on every item.

Fix \`parseItems\` so the total work is linear in the payload length.`,
    bugReport: `**BUG-LOADTIME** · Priority: High · Reported by: performance

parseItems(payload) splits a comma-separated payload into trimmed item names.

Observed: parsing is quadratic. With a payload of 2,000 items the helper reads
about 4,000,000 characters. The instrumented counter proves it.`,
    logs: `[catalog] parsed 63000 items in 383s
[catalog] charReads=3968072 for a 1994-char payload`,
    files: [
      {
        filePath: "src/catalog/catalog.js",
        isEditable: true,
        language: "javascript",
        content: `var counter = require("./counter");

// Returns the length of the payload, counting every character it touches.
function measure(payload) {
  var n = 0;
  while (n < payload.length) {
    counter.charRead();
    n++;
  }
  return n;
}

exports.parseItems = function (payload) {
  var items = [];
  var current = "";
  for (var i = 0; i < payload.length; i++) {
    // Re-measures the whole payload on every single character.
    var total = measure(payload);
    if (i >= total) break;
    var c = payload.charAt(i);
    if (c === ",") {
      items.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.length > 0) items.push(current);
  return items;
};
`,
      },
      {
        filePath: "src/catalog/counter.js",
        isEditable: false,
        language: "javascript",
        content: `// Instrumentation shared with the profiler. DO NOT EDIT.
var reads = 0;
exports.charRead = function () { reads++; };
exports.reads = function () { return reads; };
exports.reset = function () { reads = 0; };
`,
      },
    ],
    tests: [
      {
        name: "splits a small payload correctly",
        isHidden: false,
        source: `var c = require("src/catalog/catalog");
assert.equal(c.parseItems("a,b,c"), ["a", "b", "c"]);`,
      },
      {
        name: "parsing stays linear",
        isHidden: false,
        source: `var c = require("src/catalog/catalog");
var counter = require("src/catalog/counter");
var payload = [];
for (var i = 0; i < 400; i++) payload.push("item" + i);
var text = payload.join(",");
counter.reset();
c.parseItems(text);
assert.ok(counter.reads() <= text.length * 3, "work must be linear, saw " + counter.reads() + " reads for " + text.length + " chars");`,
      },
      {
        name: "a single item still parses",
        isHidden: true,
        source: `var c = require("src/catalog/catalog");
assert.equal(c.parseItems("solo"), ["solo"]);`,
      },
      {
        name: "a long payload returns every item",
        isHidden: true,
        source: `var c = require("src/catalog/catalog");
var parts = [];
for (var i = 0; i < 300; i++) parts.push("x" + i);
assert.equal(c.parseItems(parts.join(",")).length, 300);`,
      },
    ],
    fixedFiles: {
      "src/catalog/catalog.js": `var counter = require("./counter");

exports.parseItems = function (payload) {
  var items = [];
  var current = "";
  // The length is a property, not a scan — read it once and walk the payload
  // exactly once.
  var total = payload.length;
  for (var i = 0; i < total; i++) {
    counter.charRead();
    var c = payload.charAt(i);
    if (c === ",") {
      items.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.length > 0) items.push(current);
  return items;
};
`,
    },
  },

  {
    title: "The Slash That Flagged the Whole Web",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Data Validation", "Substring Matching"],
    description: `Modelled on **Google's 2009 malware-warning incident**: a single \`/\` was accidentally added to the list of dangerous URL patterns. Because every URL contains a slash, the warning "This site may harm your computer" appeared on every result on the web for about 40 minutes.

\`blocklist.js\` matches URLs against patterns by substring. It has no guard against a pattern that matches everything.

Fix \`isBlocked\` so degenerate patterns cannot flag every URL.`,
    bugReport: `**BUG-SAFEBROWSE** · Priority: Critical · Reported by: search quality

isBlocked(url, patterns) should return true only when the URL genuinely matches
a meaningful pattern.

Observed: an operator typo added "/" to the list. Every single URL now matches.
Empty strings behave the same way.`,
    logs: `[safebrowsing] flagged 100% of results in this batch (n=4821)
[safebrowsing] active patterns: ["evil.example", "/", ""]`,
    files: [
      {
        filePath: "src/safety/blocklist.js",
        isEditable: true,
        language: "javascript",
        content: `// Returns true when the URL matches any blocklist pattern.
exports.isBlocked = function (url, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    if (url.indexOf(patterns[i]) !== -1) return true;
  }
  return false;
};
`,
      },
      {
        filePath: "src/safety/RULES.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nA blocklist pattern is only meaningful if it identifies a specific host or
path. Patterns shorter than 4 characters, and patterns consisting only of "/"
and "." separators, must be ignored rather than applied.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "a genuine pattern still blocks",
        isHidden: false,
        source: `var b = require("src/safety/blocklist").isBlocked;
assert.equal(b("http://evil.example/x", ["evil.example"]), true);`,
      },
      {
        name: "a lone slash does not flag the web",
        isHidden: false,
        source: `var b = require("src/safety/blocklist").isBlocked;
assert.equal(b("http://news.example/story", ["/"]), false, "a bare separator must be ignored");`,
      },
      {
        name: "an empty pattern is ignored",
        isHidden: true,
        source: `var b = require("src/safety/blocklist").isBlocked;
assert.equal(b("http://a.example", [""]), false);`,
      },
      {
        name: "a real pattern still works alongside a degenerate one",
        isHidden: true,
        source: `var b = require("src/safety/blocklist").isBlocked;
assert.equal(b("http://evil.example/x", ["/", "evil.example"]), true);
assert.equal(b("http://good.example/x", ["/", "evil.example"]), false);`,
      },
    ],
    fixedFiles: {
      "src/safety/blocklist.js": `// Returns true when the URL matches any *meaningful* blocklist pattern.
function meaningful(pattern) {
  if (pattern.length < 4) return false;
  // A pattern made only of separators matches everything — reject it.
  var stripped = "";
  for (var i = 0; i < pattern.length; i++) {
    var c = pattern.charAt(i);
    if (c !== "/" && c !== ".") stripped += c;
  }
  return stripped.length > 0;
}

exports.isBlocked = function (url, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    if (!meaningful(patterns[i])) continue;
    if (url.indexOf(patterns[i]) !== -1) return true;
  }
  return false;
};
`,
    },
  },

  {
    title: "Divide by Zero, Dead in the Water",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Error Handling", "Validation"],
    description: `Modelled on the **USS Yorktown** (September 1997): a crew member entered a \`0\` into a remote database field. The propulsion control software divided by it, the exception cascaded through the network, and the guided-missile cruiser lost propulsion and had to be towed back to port.

\`calibration.js\` computes a ratio from operator-supplied readings and has the same missing guard.

Fix \`computeRatio\` so a zero divisor is rejected rather than propagated.`,
    bugReport: `**BUG-DDG48** · Priority: Critical (loss of propulsion) · Reported by: engineering watch

computeRatio(readings):
- returns { ok: true, value } when every divisor is non-zero
- returns { ok: false, value: 0 } when any divisor is zero — the caller then
  falls back to the last good value instead of shutting down

Observed: a zero divisor produces Infinity (or NaN), which then poisons every
downstream average and takes the whole control loop with it.`,
    logs: `[prop] ratio=Infinity from divisor=0 at index 2
[prop] control loop aborted; manual override required`,
    files: [
      {
        filePath: "src/control/calibration.js",
        isEditable: true,
        language: "javascript",
        content: `// Averages numerator/divisor across all readings.
exports.computeRatio = function (readings) {
  var total = 0;
  for (var i = 0; i < readings.length; i++) {
    total += readings[i].numerator / readings[i].divisor;
  }
  return { ok: true, value: total / readings.length };
};
`,
      },
    ],
    tests: [
      {
        name: "a healthy set of readings averages correctly",
        isHidden: false,
        source: `var c = require("src/control/calibration").computeRatio;
assert.equal(c([{ numerator: 10, divisor: 2 }, { numerator: 9, divisor: 3 }]), { ok: true, value: 4 });`,
      },
      {
        name: "a zero divisor is rejected, not propagated",
        isHidden: false,
        source: `var c = require("src/control/calibration").computeRatio;
assert.equal(c([{ numerator: 5, divisor: 1 }, { numerator: 7, divisor: 0 }]), { ok: false, value: 0 }, "a zero divisor must not reach the arithmetic");`,
      },
      {
        name: "a single valid reading works",
        isHidden: true,
        source: `var c = require("src/control/calibration").computeRatio;
assert.equal(c([{ numerator: 8, divisor: 4 }]), { ok: true, value: 2 });`,
      },
      {
        name: "a zero in the very first slot is caught",
        isHidden: true,
        source: `var c = require("src/control/calibration").computeRatio;
assert.equal(c([{ numerator: 1, divisor: 0 }, { numerator: 2, divisor: 2 }]), { ok: false, value: 0 });`,
      },
    ],
    fixedFiles: {
      "src/control/calibration.js": `// Averages numerator/divisor across all readings.
exports.computeRatio = function (readings) {
  var total = 0;
  for (var i = 0; i < readings.length; i++) {
    // Validate before dividing — an Infinity here reaches the whole control loop.
    if (readings[i].divisor === 0) return { ok: false, value: 0 };
    total += readings[i].numerator / readings[i].divisor;
  }
  return { ok: true, value: total / readings.length };
};
`,
    },
  },

  {
    title: "Crossing the Date Line",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Coordinates", "Wraparound"],
    description: `Modelled on the **F-22 Raptor date-line incident** (February 2007): a flight of six aircraft crossed the 180th meridian on the way to Okinawa and every onboard computer crashed at once, losing navigation and fuel systems. The jets had to follow their tankers back by sight.

\`navigation.js\` computes the shortest longitude difference between two points and does not handle the wrap at ±180.

Fix \`longitudeDelta\` so it returns the shortest signed difference, always in the range (-180, 180].`,
    bugReport: `**BUG-DATELINE** · Priority: Critical · Reported by: flight test

longitudeDelta(from, to) returns the shortest signed difference in degrees:
- positive when heading east, negative when heading west
- always within (-180, 180]

Observed: crossing the antimeridian from 179 to -179 reports -358 instead of
the correct +2, which sends the whole navigation solution off the map.`,
    logs: `[nav] delta=-358.0 from=179.0 to=-179.0
[nav] course solution rejected; system reset`,
    files: [
      {
        filePath: "src/nav/navigation.js",
        isEditable: true,
        language: "javascript",
        content: `// Shortest signed longitude difference, in degrees.
exports.longitudeDelta = function (from, to) {
  return to - from;
};
`,
      },
      {
        filePath: "src/nav/SPEC.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nLongitude is cyclic with period 360. The shortest signed difference must be
normalised into (-180, 180]: a difference of exactly 180 stays +180.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "an ordinary eastward hop",
        isHidden: false,
        source: `var d = require("src/nav/navigation").longitudeDelta;
assert.equal(d(10, 30), 20);`,
      },
      {
        name: "crossing the antimeridian takes the short way",
        isHidden: false,
        source: `var d = require("src/nav/navigation").longitudeDelta;
assert.equal(d(179, -179), 2, "should wrap eastward, not go the long way round");
assert.equal(d(-179, 179), -2);`,
      },
      {
        name: "a westward hop is negative",
        isHidden: true,
        source: `var d = require("src/nav/navigation").longitudeDelta;
assert.equal(d(30, 10), -20);`,
      },
      {
        name: "exactly half the globe stays positive",
        isHidden: true,
        source: `var d = require("src/nav/navigation").longitudeDelta;
assert.equal(d(0, 180), 180);
assert.equal(d(0, 0), 0);`,
      },
    ],
    fixedFiles: {
      "src/nav/navigation.js": `// Shortest signed longitude difference, in degrees.
exports.longitudeDelta = function (from, to) {
  var delta = to - from;
  // Longitude is cyclic: fold the difference into (-180, 180].
  while (delta > 180) delta -= 360;
  while (delta <= -180) delta += 360;
  return delta;
};
`,
    },
  },

  {
    title: "The Cleanup That Deleted the Customers",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Data Loss", "Identifiers"],
    description: `Modelled on the **Atlassian Jira outage** (April 2022): a script meant to remove a deprecated app was handed **site IDs** where it expected **app IDs**, and it ran with a "permanent delete" flag. About 400 customer sites were wiped, and restoring them took two weeks.

\`cleanup.js\` deletes records by id without checking that the ids it was given are the right *kind*.

Fix \`removeApps\` so it only ever deletes app records, and reports ids it refuses.`,
    bugReport: `**BUG-JIRA22** · Priority: Critical (data loss) · Reported by: incident command

removeApps(store, ids) must:
- delete only entries whose kind is "app"
- leave every other entry untouched
- return { deleted: [...], skipped: [...] } listing the ids in each group,
  in the order they were supplied

Observed: passing site ids deletes the sites. The function never looks at the
record's kind.`,
    logs: `[cleanup] deleted id=site-19 kind=site
[cleanup] 400 customer sites removed in 9 minutes`,
    files: [
      {
        filePath: "src/ops/cleanup.js",
        isEditable: true,
        language: "javascript",
        content: `// Removes the given ids from the store.
exports.removeApps = function (store, ids) {
  var deleted = [];
  var skipped = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (store[id]) {
      delete store[id];
      deleted.push(id);
    } else {
      skipped.push(id);
    }
  }
  return { deleted: deleted, skipped: skipped };
};
`,
      },
      {
        filePath: "src/ops/SCHEMA.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nEvery record in the store has a \`kind\` field: "app", "site" or "user".
Destructive maintenance scripts must assert the kind before deleting.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "apps are deleted",
        isHidden: false,
        source: `var r = require("src/ops/cleanup").removeApps;
var store = { "app-1": { kind: "app" }, "app-2": { kind: "app" } };
assert.equal(r(store, ["app-1"]), { deleted: ["app-1"], skipped: [] });
assert.equal(Object.keys(store), ["app-2"]);`,
      },
      {
        name: "sites are never deleted",
        isHidden: false,
        source: `var r = require("src/ops/cleanup").removeApps;
var store = { "site-19": { kind: "site" }, "app-3": { kind: "app" } };
var out = r(store, ["site-19", "app-3"]);
assert.equal(out, { deleted: ["app-3"], skipped: ["site-19"] }, "a site id must be refused");
assert.ok(store["site-19"], "the site must survive");`,
      },
      {
        name: "unknown ids are skipped",
        isHidden: true,
        source: `var r = require("src/ops/cleanup").removeApps;
var store = { "app-1": { kind: "app" } };
assert.equal(r(store, ["nope"]), { deleted: [], skipped: ["nope"] });`,
      },
      {
        name: "users are protected too",
        isHidden: true,
        source: `var r = require("src/ops/cleanup").removeApps;
var store = { "user-7": { kind: "user" } };
assert.equal(r(store, ["user-7"]), { deleted: [], skipped: ["user-7"] });
assert.ok(store["user-7"]);`,
      },
    ],
    fixedFiles: {
      "src/ops/cleanup.js": `// Removes the given ids from the store — apps only.
exports.removeApps = function (store, ids) {
  var deleted = [];
  var skipped = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var record = store[id];
    // Assert the record kind before anything destructive happens.
    if (record && record.kind === "app") {
      delete store[id];
      deleted.push(id);
    } else {
      skipped.push(id);
    }
  }
  return { deleted: deleted, skipped: skipped };
};
`,
    },
  },

  {
    title: "The Console That Thought 2010 Was a Leap Year",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Dates", "Leap Years"],
    description: `Modelled on **ApocalyPS3** (1 March 2010): the PlayStation 3's clock firmware treated 2010 as a leap year. On 1 March the hardware reported a 29 February that did not exist, date validation failed everywhere, and older consoles worldwide could not sign in, play games or use trophies.

\`clock.js\` has the same faulty leap-year rule.

Fix \`isLeapYear\` so it follows the Gregorian rule.`,
    bugReport: `**BUG-8001050F** · Priority: Critical · Reported by: platform

isLeapYear(year) must implement the Gregorian rule:
- divisible by 4 -> leap
- unless divisible by 100 -> not leap
- unless divisible by 400 -> leap

Observed: 2010 is reported as a leap year, and so is every year ending in 0.
1900 is also wrong in the other direction.`,
    logs: `[rtc] date rolled to 2010-02-29
[rtc] trophy sync failed: invalid timestamp`,
    files: [
      {
        filePath: "src/clock/clock.js",
        isEditable: true,
        language: "javascript",
        content: `// Gregorian leap-year test.
exports.isLeapYear = function (year) {
  // "Every fourth year, and also the round ones" — as shipped.
  if (year % 10 === 0) return true;
  return year % 4 === 0;
};

exports.daysInFebruary = function (year) {
  return exports.isLeapYear(year) ? 29 : 28;
};
`,
      },
    ],
    tests: [
      {
        name: "ordinary leap years are leap",
        isHidden: false,
        source: `var c = require("src/clock/clock");
assert.equal(c.isLeapYear(2024), true);
assert.equal(c.isLeapYear(2020), true);`,
      },
      {
        name: "2010 is not a leap year",
        isHidden: false,
        source: `var c = require("src/clock/clock");
assert.equal(c.isLeapYear(2010), false, "2010 is not divisible by 4");
assert.equal(c.daysInFebruary(2010), 28);`,
      },
      {
        name: "century years follow the 100/400 rule",
        isHidden: true,
        source: `var c = require("src/clock/clock");
assert.equal(c.isLeapYear(1900), false);
assert.equal(c.isLeapYear(2000), true);
assert.equal(c.isLeapYear(2100), false);`,
      },
      {
        name: "non-leap years are rejected",
        isHidden: true,
        source: `var c = require("src/clock/clock");
assert.equal(c.isLeapYear(2023), false);
assert.equal(c.daysInFebruary(2023), 28);`,
      },
    ],
    fixedFiles: {
      "src/clock/clock.js": `// Gregorian leap-year test.
exports.isLeapYear = function (year) {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
};

exports.daysInFebruary = function (year) {
  return exports.isLeapYear(year) ? 29 : 28;
};
`,
    },
  },

  {
    title: "Back to 1970",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Dates", "Underflow"],
    description: `Modelled on the **iOS "1 January 1970" bug** (2016): setting a 64-bit iPhone's date to the very start of the Unix epoch caused timezone offsets to push internal timestamps *below* zero. Code that assumed a non-negative epoch spun forever, and affected devices bricked on the next reboot.

\`uptime.js\` computes elapsed seconds and has the same missing floor.

Fix \`elapsedSince\` so a timestamp at or before the epoch cannot produce a negative or looping result.`,
    bugReport: `**BUG-1970** · Priority: Critical · Reported by: device reliability

elapsedSince(nowEpoch, thenEpoch, tzOffsetSeconds):
- returns the number of seconds elapsed, after applying the timezone offset
  to the "then" value
- must never return a negative number; clamp to 0 instead

Observed: with thenEpoch=0 and a large positive offset the result goes below zero and
the retry loop that consumes it never terminates.`,
    logs: `[time] elapsed=-39600 now=0 then=0 tz=39600
[time] boot watchdog: retry loop exceeded 100000 iterations`,
    files: [
      {
        filePath: "src/time/uptime.js",
        isEditable: true,
        language: "javascript",
        content: `// Seconds elapsed between two epoch timestamps, offset-adjusted.
exports.elapsedSince = function (nowEpoch, thenEpoch, tzOffsetSeconds) {
  var adjusted = thenEpoch + tzOffsetSeconds;
  return nowEpoch - adjusted;
};

// Retries once per elapsed second, capped by the caller.
exports.retryCount = function (nowEpoch, thenEpoch, tzOffsetSeconds) {
  var n = exports.elapsedSince(nowEpoch, thenEpoch, tzOffsetSeconds);
  var count = 0;
  while (count < n) count++;
  return count;
};
`,
      },
    ],
    tests: [
      {
        name: "a normal interval is measured",
        isHidden: false,
        source: `var u = require("src/time/uptime");
assert.equal(u.elapsedSince(1000, 400, 0), 600);`,
      },
      {
        name: "the epoch with a large positive offset clamps to zero",
        isHidden: false,
        source: `var u = require("src/time/uptime");
assert.equal(u.elapsedSince(0, 0, 39600), 0, "elapsed time must never go negative");
assert.equal(u.retryCount(0, 0, 39600), 0);`,
      },
      {
        name: "a positive offset still works",
        isHidden: true,
        source: `var u = require("src/time/uptime");
assert.equal(u.elapsedSince(10000, 1000, 3600), 5400);`,
      },
      {
        name: "a future timestamp clamps rather than going negative",
        isHidden: true,
        source: `var u = require("src/time/uptime");
assert.equal(u.elapsedSince(100, 500, 0), 0);`,
      },
    ],
    fixedFiles: {
      "src/time/uptime.js": `// Seconds elapsed between two epoch timestamps, offset-adjusted.
exports.elapsedSince = function (nowEpoch, thenEpoch, tzOffsetSeconds) {
  var adjusted = thenEpoch + tzOffsetSeconds;
  var elapsed = nowEpoch - adjusted;
  // A timezone offset can push "then" past "now"; elapsed time has a
  // floor of zero, and every consumer downstream assumes it.
  return elapsed < 0 ? 0 : elapsed;
};

exports.retryCount = function (nowEpoch, thenEpoch, tzOffsetSeconds) {
  var n = exports.elapsedSince(nowEpoch, thenEpoch, tzOffsetSeconds);
  var count = 0;
  while (count < n) count++;
  return count;
};
`,
    },
  },

  {
    title: "184 Billion Coins From Nowhere",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Overflow", "Validation"],
    description: `Modelled on the **Bitcoin value overflow incident** (CVE-2010-5139, 15 August 2010): a transaction with two enormous outputs made their sum overflow a signed 64-bit integer and wrap to a small number, so the "outputs must not exceed inputs" check passed. Block 74638 created 184.467 billion BTC out of nothing, and the chain had to be forked.

\`ledger.js\` validates a transaction the same way — by summing outputs and comparing.

Fix \`validate\` so a wrapped or absurd total cannot pass.`,
    bugReport: `**BUG-VALUEOVERFLOW** · Priority: Critical · Reported by: consensus

validate(inputTotal, outputs) returns true only if the outputs are a legitimate
spend:
- every output must be strictly positive and at most MAX_MONEY
- the sum of the outputs must be at most inputTotal

Observed: two outputs just under the wrap point sum to a small positive number
and the transaction is accepted, minting money from nothing.`,
    logs: `[consensus] accepted tx outputs=[9223372036854775806, 9223372036854775806] inputTotal=50
[consensus] supply increased by 1.844e+11`,
    files: [
      {
        filePath: "src/chain/ledger.js",
        isEditable: true,
        language: "javascript",
        content: `var MAX_MONEY = 2100000000000000;
exports.MAX_MONEY = MAX_MONEY;

// Wraps like a fixed-width signed integer would.
function addWrapping(a, b) {
  var sum = a + b;
  if (sum > MAX_MONEY * 4) sum = sum - MAX_MONEY * 8;
  return sum;
}

exports.validate = function (inputTotal, outputs) {
  var total = 0;
  for (var i = 0; i < outputs.length; i++) {
    total = addWrapping(total, outputs[i]);
  }
  return total <= inputTotal;
};
`,
      },
      {
        filePath: "src/chain/CONSENSUS.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nMoney values are bounded by MAX_MONEY. Every individual output, and the
running total, must be range-checked *before* it can participate in a
comparison — a wrapped total is indistinguishable from a small legitimate one.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "an ordinary spend is accepted",
        isHidden: false,
        source: `var l = require("src/chain/ledger");
assert.equal(l.validate(100, [40, 50]), true);`,
      },
      {
        name: "an overflowing pair of outputs is rejected",
        isHidden: false,
        source: `var l = require("src/chain/ledger");
var huge = l.MAX_MONEY * 4 - 10;
assert.equal(l.validate(50, [huge, huge]), false, "a wrapped total must not pass the check");`,
      },
      {
        name: "spending more than the inputs is rejected",
        isHidden: true,
        source: `var l = require("src/chain/ledger");
assert.equal(l.validate(100, [60, 60]), false);`,
      },
      {
        name: "zero and negative outputs are rejected",
        isHidden: true,
        source: `var l = require("src/chain/ledger");
assert.equal(l.validate(100, [0, 50]), false);
assert.equal(l.validate(100, [-10, 50]), false);`,
      },
    ],
    fixedFiles: {
      "src/chain/ledger.js": `var MAX_MONEY = 2100000000000000;
exports.MAX_MONEY = MAX_MONEY;

exports.validate = function (inputTotal, outputs) {
  var total = 0;
  for (var i = 0; i < outputs.length; i++) {
    var v = outputs[i];
    // Range-check each output BEFORE it can contribute to a total that might
    // wrap, and re-check the running total after every addition.
    if (v <= 0 || v > MAX_MONEY) return false;
    total += v;
    if (total > MAX_MONEY) return false;
  }
  return total <= inputTotal;
};
`,
    },
  },

  {
    title: "The Wallet Library That Killed Itself",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Access Control", "Initialization"],
    description: `Modelled on the **Parity multisig wallet freeze** (November 2017): the shared library contract's initialiser was never claimed, so an anonymous account called it, became the owner, and then invoked \`kill\`. Every wallet that delegated to that library was bricked, freezing roughly 513,000 ETH permanently.

\`wallet.js\` exposes an initialiser that anyone can call at any time.

Fix the library so ownership can only be set once, and only destructive operations the owner performs are allowed.`,
    bugReport: `**BUG-PARITY** · Priority: Critical (funds frozen) · Reported by: security

The library must behave like this:
- initialize(lib, owner) sets the owner only if there is not one already;
  it returns true on success and false if the library is already initialised
- destroy(lib, caller) sets lib.dead = true only when caller is the owner
  and returns true; otherwise it changes nothing and returns false

Observed: initialize can be called repeatedly by anyone, so an attacker simply
re-initialises to themselves and calls destroy.`,
    logs: `[wallet] initialize called by 0xdevops237 on an already-initialised library
[wallet] destroy succeeded; 587 dependent wallets now unusable`,
    files: [
      {
        filePath: "src/wallet/wallet.js",
        isEditable: true,
        language: "javascript",
        content: `// Shared multisig library.
exports.initialize = function (lib, owner) {
  lib.owner = owner;
  return true;
};

exports.destroy = function (lib, caller) {
  lib.dead = true;
  return true;
};
`,
      },
      {
        filePath: "src/wallet/THREAT.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nThe library object is shared by every wallet that delegates to it. An
initialiser that can run twice is an ownership takeover; a destructive call
without an owner check is a denial of service for every dependent wallet.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "the first initialisation succeeds",
        isHidden: false,
        source: `var w = require("src/wallet/wallet");
var lib = {};
assert.equal(w.initialize(lib, "alice"), true);
assert.equal(lib.owner, "alice");`,
      },
      {
        name: "re-initialisation is refused",
        isHidden: false,
        source: `var w = require("src/wallet/wallet");
var lib = {};
w.initialize(lib, "alice");
assert.equal(w.initialize(lib, "attacker"), false, "the library must only initialise once");
assert.equal(lib.owner, "alice");`,
      },
      {
        name: "only the owner may destroy",
        isHidden: false,
        source: `var w = require("src/wallet/wallet");
var lib = {};
w.initialize(lib, "alice");
assert.equal(w.destroy(lib, "attacker"), false);
assert.ok(!lib.dead, "the library must survive an unauthorised destroy");
assert.equal(w.destroy(lib, "alice"), true);
assert.equal(lib.dead, true);`,
      },
      {
        name: "an uninitialised library cannot be destroyed",
        isHidden: true,
        source: `var w = require("src/wallet/wallet");
var lib = {};
assert.equal(w.destroy(lib, "anyone"), false);
assert.ok(!lib.dead);`,
      },
    ],
    fixedFiles: {
      "src/wallet/wallet.js": `// Shared multisig library.
exports.initialize = function (lib, owner) {
  // One-shot: an initialiser that can run twice is an ownership takeover.
  if (lib.owner) return false;
  lib.owner = owner;
  return true;
};

exports.destroy = function (lib, caller) {
  if (!lib.owner || lib.owner !== caller) return false;
  lib.dead = true;
  return true;
};
`,
    },
  },

  {
    title: "The Transaction That Changed Its Own Name",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Hashing", "Idempotency"],
    description: `Modelled on **transaction malleability** as exploited against Mt. Gox (2014): a transaction's id was derived from data that a third party could tamper with without invalidating it. Withdrawals were re-broadcast under a new id, the exchange's bookkeeping never saw the original settle, and it re-sent the funds.

\`txid.js\` computes a transaction id over fields that include a mutable signature blob.

Fix \`computeId\` so the id depends only on the immutable parts of the transaction.`,
    bugReport: `**BUG-MALLEABLE** · Priority: Critical (double spend) · Reported by: treasury

computeId(tx) must produce the same id for two transactions that move the same
funds, even if their \`signature\` fields differ — the signature is not part of
a transaction's identity.

Observed: re-encoding the signature yields a different id, so the ledger treats
a re-broadcast withdrawal as brand new and pays out twice.`,
    logs: `[ledger] withdrawal wd-7781 settled under two distinct ids
[ledger] duplicate payout detected after reconciliation: 1 of 219`,
    files: [
      {
        filePath: "src/tx/txid.js",
        isEditable: true,
        language: "javascript",
        content: `function hash(text) {
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) {
    h = h ^ text.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16);
}

// Identity of a transaction.
exports.computeId = function (tx) {
  return hash(tx.from + "|" + tx.to + "|" + tx.amount + "|" + tx.nonce + "|" + tx.signature);
};
`,
      },
      {
        filePath: "src/tx/PROTOCOL.js",
        isEditable: false,
        language: "javascript",
        content: `/*\nA transaction is identified by from, to, amount and nonce. The signature
authorises the transfer but is NOT part of its identity: it can be re-encoded
by any relay without changing what the transaction does.
\n*/\n`,
      },
    ],
    tests: [
      {
        name: "different transfers have different ids",
        isHidden: false,
        source: `var t = require("src/tx/txid").computeId;
var a = { from: "x", to: "y", amount: 10, nonce: 1, signature: "sigA" };
var b = { from: "x", to: "y", amount: 11, nonce: 1, signature: "sigA" };
assert.ok(t(a) !== t(b));`,
      },
      {
        name: "re-encoding the signature does not change the id",
        isHidden: false,
        source: `var t = require("src/tx/txid").computeId;
var a = { from: "x", to: "y", amount: 10, nonce: 1, signature: "sigA" };
var b = { from: "x", to: "y", amount: 10, nonce: 1, signature: "sigA-reencoded" };
assert.equal(t(a), t(b), "the signature must not be part of the identity");`,
      },
      {
        name: "the nonce still distinguishes transactions",
        isHidden: true,
        source: `var t = require("src/tx/txid").computeId;
var a = { from: "x", to: "y", amount: 10, nonce: 1, signature: "s" };
var b = { from: "x", to: "y", amount: 10, nonce: 2, signature: "s" };
assert.ok(t(a) !== t(b));`,
      },
      {
        name: "the id is stable across calls",
        isHidden: true,
        source: `var t = require("src/tx/txid").computeId;
var a = { from: "x", to: "y", amount: 10, nonce: 5, signature: "s" };
assert.equal(t(a), t(a));`,
      },
    ],
    fixedFiles: {
      "src/tx/txid.js": `function hash(text) {
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) {
    h = h ^ text.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16);
}

// Identity of a transaction — immutable fields only. The signature authorises
// the transfer but any relay can re-encode it, so it must stay out of the id.
exports.computeId = function (tx) {
  return hash(tx.from + "|" + tx.to + "|" + tx.amount + "|" + tx.nonce);
};
`,
    },
  },

  // ── END WAVE10 ──
];
