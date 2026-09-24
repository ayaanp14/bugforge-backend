/**
 * Wave 21 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE21: BugSpec[] = [

  {
    title: "Every Region in One Flight",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Config", "Deploys"],
    description: `Modelled on the **Microsoft Azure Storage outage of 18–19 November 2014**. A performance change to Azure Storage had been tested and "flighted" on a small set of production clusters, but it was then applied across most regions at once instead of following the incremental flighting process. The change contained a bug that sent the blob front-ends into an infinite loop, and storage — and the services built on it — went down in many regions together. Microsoft's post-incident review said the standard flighting policy had not been followed and moved to enforcing it in the deployment tooling.

This reconstruction's \`planner.js\` splits a deployment into waves: one canary region, then small batches. A change marked \`alreadyTested\` skips all that and goes everywhere in a single wave.

Fix \`planWaves\` so every change is staged, no matter what the change claims about itself.`,
    bugReport: `**BUG-FLIGHT** · Priority: Critical · Reported by: incident review

planWaves(change, regions) returns the list of deployment waves:
- no regions -> []
- wave 1 is exactly the first region (the canary)
- the remaining regions follow in order, in batches of WAVE_SIZE
  (rollout-config.js; the last batch may be shorter)
- the shape depends ONLY on the region list. No property of the change
  (alreadyTested, priority, author ...) may shorten or skip the staging.

runner.run(waves, isHealthyAfter) stops after the first unhealthy wave, so
a bad change must only ever reach the canary.

Observed: a change flagged alreadyTested is planned as one wave holding every
region; when it misbehaves, every region is hit before anyone can stop it.`,
    logs: `[deploy] change perf-7731 alreadyTested=true -> 1 wave, 5 regions
[blob-fe] us-east: request loop detected, CPU 100%
[blob-fe] eu-west: request loop detected, CPU 100%`,
    files: [
      {
        filePath: "src/deploy/planner.js",
        isEditable: true,
        language: "javascript",
        content: `var cfg = require("./rollout-config");

// Splits a change's deployment into waves of regions.
exports.planWaves = function (change, regions) {
  if (regions.length === 0) return [];
  if (change.alreadyTested) return [regions.slice()];
  var waves = [[regions[0]]];
  for (var i = 1; i < regions.length; i += cfg.WAVE_SIZE) {
    waves.push(regions.slice(i, i + cfg.WAVE_SIZE));
  }
  return waves;
};
`,
      },
      {
        filePath: "src/deploy/rollout-config.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Flighting: a change reaches one canary region first, then the rest of the
fleet in small batches, with a health check between waves. A change that was
"tested elsewhere" has still never run on this fleet's traffic.
*/
exports.WAVE_SIZE = 2;
`,
      },
      {
        filePath: "src/deploy/runner.js",
        isEditable: false,
        language: "javascript",
        content: `// Deploys wave by wave; stops after the first wave with an unhealthy region.
exports.run = function (waves, isHealthyAfter) {
  var touched = [];
  for (var w = 0; w < waves.length; w++) {
    var bad = false;
    for (var r = 0; r < waves[w].length; r++) {
      touched.push(waves[w][r]);
      if (!isHealthyAfter(waves[w][r])) bad = true;
    }
    if (bad) return { status: "halted", touched: touched };
  }
  return { status: "complete", touched: touched };
};
`,
      },
    ],
    tests: [
      {
        name: "an ordinary change is staged canary-first",
        isHidden: false,
        source: `var plan = require("src/deploy/planner").planWaves;
assert.equal(plan({ alreadyTested: false }, ["a", "b", "c", "d", "e"]), [["a"], ["b", "c"], ["d", "e"]]);`,
      },
      {
        name: "a change that claims to be tested is staged too",
        isHidden: false,
        source: `var plan = require("src/deploy/planner").planWaves;
assert.equal(plan({ alreadyTested: true }, ["a", "b", "c", "d", "e"]), [["a"], ["b", "c"], ["d", "e"]], "no flag skips flighting");`,
      },
      {
        name: "a looping change only ever reaches the canary",
        isHidden: true,
        source: `var plan = require("src/deploy/planner").planWaves;
var run = require("src/deploy/runner").run;
var result = run(plan({ alreadyTested: true, priority: "high" }, ["a", "b", "c", "d"]), function () { return false; });
assert.equal(result, { status: "halted", touched: ["a"] });`,
      },
      {
        name: "empty and single-region fleets",
        isHidden: true,
        source: `var plan = require("src/deploy/planner").planWaves;
assert.equal(plan({ alreadyTested: true }, []), []);
assert.equal(plan({ alreadyTested: true }, ["solo"]), [["solo"]]);
assert.equal(plan({}, ["a", "b", "c", "d"]), [["a"], ["b", "c"], ["d"]]);`,
      },
    ],
    fixedFiles: {
      "src/deploy/planner.js": `var cfg = require("./rollout-config");

// Splits a change's deployment into waves of regions.
// The plan depends on the fleet alone: "already tested" was tested somewhere
// else, and a flag on the change is exactly how a whole fleet got updated at
// once. Every change goes canary-first, then in batches.
exports.planWaves = function (change, regions) {
  if (regions.length === 0) return [];
  var waves = [[regions[0]]];
  for (var i = 1; i < regions.length; i += cfg.WAVE_SIZE) {
    waves.push(regions.slice(i, i + cfg.WAVE_SIZE));
  }
  return waves;
};
`,
    },
  },

  {
    title: "The Signature Made of Zeros",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Security", "Crypto"],
    description: `Modelled on **"Psychic Signatures" (CVE-2022-21449)**, disclosed in April 2022 by Neil Madden. Java 15 through 18 had a rewritten ECDSA implementation that skipped a check the algorithm requires: that the signature values r and s both lie in [1, n-1]. A signature with **r = s = 0** passed verification for any message and any public key, so anything relying on Java's ECDSA — signed JWTs, SAML assertions, TLS handshakes — could be fooled by a blank signature. Oracle fixed it in the April 2022 Critical Patch Update.

This reconstruction uses a deliberately insecure toy group (\`ToyCurve\`) that keeps ECDSA's verification algebra: inverting 0 comes back as 0, and the identity "point" has x = 0. \`EcdsaVerifier.verify\` does the maths but never checks the ranges.

Fix \`verify\` so out-of-range signatures are rejected before any arithmetic.`,
    bugReport: `**BUG-PSYCHIC** · Priority: Critical (auth bypass) · Reported by: security

EcdsaVerifier.verify(z, r, s, publicKey) must return true only for a genuine
signature of hash z under publicKey:
- r and s must each satisfy 1 <= value <= N - 1 (N = ToyCurve.N); anything
  else (0, N, negative, larger than N, null) is rejected immediately
- for in-range values: w = s^-1, u1 = z*w, u2 = r*w (mod N) and the
  signature is valid when (u1*G + u2*Q) mod N equals r

Observed: verify(anyHash, 0, 0, anyKey) returns true.`,
    logs: `[auth] ES256 token accepted: r=0 s=0 sub=admin
[auth] ES256 token accepted: r=0 s=0 sub=root`,
    files: [
      {
        filePath: "src/crypto/EcdsaVerifier.java",
        isEditable: true,
        language: "java",
        content: `import java.math.BigInteger;

class EcdsaVerifier {
    static boolean verify(BigInteger z, BigInteger r, BigInteger s, BigInteger publicKey) {
        BigInteger w = ToyCurve.inverse(s);
        BigInteger u1 = z.multiply(w).mod(ToyCurve.N);
        BigInteger u2 = r.multiply(w).mod(ToyCurve.N);
        BigInteger point = ToyCurve.add(ToyCurve.mul(u1), ToyCurve.mul(u2, publicKey));
        return point.mod(ToyCurve.N).equals(r);
    }
}`,
      },
      {
        filePath: "src/crypto/ToyCurve.java",
        isEditable: false,
        language: "java",
        content: `import java.math.BigInteger;

// A toy stand-in for an elliptic curve: the additive group of integers mod N
// with generator G. Scalar multiplication is k*G mod N, a point's "x" is the
// value itself and the identity (the point at infinity) is 0. Insecure by
// design; it keeps ECDSA's verification algebra and nothing else.
class ToyCurve {
    static final BigInteger N = BigInteger.valueOf(1000003);
    static final BigInteger G = BigInteger.valueOf(2);

    static BigInteger mul(BigInteger k) {
        return k.multiply(G).mod(N);
    }

    static BigInteger mul(BigInteger k, BigInteger point) {
        return k.multiply(point).mod(N);
    }

    static BigInteger add(BigInteger p, BigInteger q) {
        return p.add(q).mod(N);
    }

    // Field inverse by Fermat's little theorem, as the real code does it:
    // a^(N-2) mod N. Zero has no inverse, and this returns 0 for it.
    static BigInteger inverse(BigInteger a) {
        return a.modPow(N.subtract(BigInteger.valueOf(2)), N);
    }
}`,
      },
      {
        filePath: "src/crypto/Signer.java",
        isEditable: false,
        language: "java",
        content: `import java.math.BigInteger;

class Signer {
    static BigInteger publicKey(BigInteger d) {
        return ToyCurve.mul(d);
    }

    // Returns {r, s} for hash z under private key d with nonce k.
    static BigInteger[] sign(BigInteger z, BigInteger d, BigInteger k) {
        BigInteger r = ToyCurve.mul(k);
        BigInteger s = ToyCurve.inverse(k).multiply(z.add(r.multiply(d))).mod(ToyCurve.N);
        return new BigInteger[] { r, s };
    }
}`,
      },
    ],
    tests: [
      {
        name: "a genuine signature verifies",
        isHidden: false,
        source: `                java.math.BigInteger d = java.math.BigInteger.valueOf(12345);
                java.math.BigInteger z = java.math.BigInteger.valueOf(4242);
                java.math.BigInteger[] sig = Signer.sign(z, d, java.math.BigInteger.valueOf(777));
                BugAssert.ok(EcdsaVerifier.verify(z, sig[0], sig[1], Signer.publicKey(d)), "valid signature");`,
      },
      {
        name: "a blank r = s = 0 signature is rejected",
        isHidden: false,
        source: `                java.math.BigInteger q = Signer.publicKey(java.math.BigInteger.valueOf(12345));
                java.math.BigInteger zero = java.math.BigInteger.ZERO;
                BugAssert.ok(!EcdsaVerifier.verify(java.math.BigInteger.valueOf(4242), zero, zero, q), "psychic signature");
                BugAssert.ok(!EcdsaVerifier.verify(java.math.BigInteger.valueOf(99), zero, zero, q), "any message");`,
      },
      {
        name: "a signature over a different hash is rejected",
        isHidden: false,
        source: `                java.math.BigInteger d = java.math.BigInteger.valueOf(12345);
                java.math.BigInteger z = java.math.BigInteger.valueOf(4242);
                java.math.BigInteger[] sig = Signer.sign(z, d, java.math.BigInteger.valueOf(777));
                BugAssert.ok(!EcdsaVerifier.verify(z.add(java.math.BigInteger.ONE), sig[0], sig[1], Signer.publicKey(d)), "tampered message");`,
      },
      {
        name: "r = 0 with s = N is rejected",
        isHidden: true,
        source: `                java.math.BigInteger q = Signer.publicKey(java.math.BigInteger.valueOf(12345));
                BugAssert.ok(!EcdsaVerifier.verify(java.math.BigInteger.valueOf(4242), java.math.BigInteger.ZERO, ToyCurve.N, q), "s = N is 0 in disguise");`,
      },
      {
        name: "out-of-range and null values are rejected",
        isHidden: true,
        source: `                java.math.BigInteger d = java.math.BigInteger.valueOf(12345);
                java.math.BigInteger z = java.math.BigInteger.valueOf(4242);
                java.math.BigInteger[] sig = Signer.sign(z, d, java.math.BigInteger.valueOf(777));
                java.math.BigInteger q = Signer.publicKey(d);
                BugAssert.ok(!EcdsaVerifier.verify(z, sig[0].add(ToyCurve.N), sig[1], q), "r + N");
                BugAssert.ok(!EcdsaVerifier.verify(z, sig[0], sig[1].negate(), q), "negative s");
                BugAssert.ok(!EcdsaVerifier.verify(z, null, sig[1], q), "null r");`,
      },
    ],
    fixedFiles: {
      "src/crypto/EcdsaVerifier.java": `import java.math.BigInteger;

class EcdsaVerifier {
    // ECDSA requires 1 <= r, s <= N-1. Skipping that check is CVE-2022-21449:
    // inverting 0 "succeeds" (it returns 0), u1 and u2 become 0, the sum is
    // the identity whose x is 0, and r = 0 matches. Range-check first.
    static boolean inRange(BigInteger v) {
        return v != null && v.signum() > 0 && v.compareTo(ToyCurve.N) < 0;
    }

    static boolean verify(BigInteger z, BigInteger r, BigInteger s, BigInteger publicKey) {
        if (!inRange(r) || !inRange(s)) return false;
        BigInteger w = ToyCurve.inverse(s);
        BigInteger u1 = z.multiply(w).mod(ToyCurve.N);
        BigInteger u2 = r.multiply(w).mod(ToyCurve.N);
        BigInteger point = ToyCurve.add(ToyCurve.mul(u1), ToyCurve.mul(u2, publicKey));
        return point.mod(ToyCurve.N).equals(r);
    }
}`,
    },
  },

  {
    title: "The Defaults That Reached Every Object",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Validation"],
    description: `Modelled on **lodash CVE-2019-10744** (July 2019). lodash's \`defaultsDeep\` walked into whatever keys the source object carried. A payload such as \`{"constructor": {"prototype": {...}}}\` led it from a plain object to \`Object\`, then to \`Object.prototype\`, and it wrote the attacker's keys there — **prototype pollution**: every object in the process suddenly had new properties. It was fixed in lodash 4.17.12 by refusing to merge those keys.

This reconstruction's settings service merges a user's saved JSON with the app defaults using a hand-written \`defaultsDeep\` that has the same blind spot.

Fix \`defaultsDeep\` so a merge can never climb out of the data into a prototype.`,
    bugReport: `**BUG-PROTO** · Priority: Critical · Reported by: security

defaultsDeep(target, source) fills keys that are undefined on target with
source's value, recursing when both sides hold objects. It must:
- never read or write through the keys "__proto__", "constructor" or
  "prototype" — such keys in source are skipped entirely
- still merge every other key normally (safe siblings of a skipped key are
  kept)
- only consider source's own keys

config.build(userJson) must therefore never add a property to
Object.prototype, whatever JSON it is given.

Observed: after saving settings {"constructor":{"prototype":{"isAdmin":true}}}
every object in the process reports isAdmin === true.`,
    logs: `[settings] saved user 88 preferences (212 bytes)
[authz] ({}).isAdmin === true for a request with no session`,
    files: [
      {
        filePath: "src/util/defaults-deep.js",
        isEditable: true,
        language: "javascript",
        content: `function isMergeable(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

// Fills every key missing from target with source's value, recursing into
// nested objects. Mutates and returns target.
function defaultsDeep(target, source) {
  for (var key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    var incoming = source[key];
    var existing = target[key];
    if (existing === undefined) {
      target[key] = incoming;
    } else if (isMergeable(existing) && isMergeable(incoming)) {
      defaultsDeep(existing, incoming);
    }
  }
  return target;
}

exports.defaultsDeep = defaultsDeep;
`,
      },
      {
        filePath: "src/settings/config.js",
        isEditable: false,
        language: "javascript",
        content: `var dd = require("../util/defaults-deep").defaultsDeep;

var DEFAULTS = { theme: "light", editor: { tabSize: 2, wrap: false } };

// Builds a settings object: the user's saved JSON wins, defaults fill gaps.
exports.build = function (userJson) {
  var base = dd({}, JSON.parse(userJson));
  return dd(base, JSON.parse(JSON.stringify(DEFAULTS)));
};
`,
      },
    ],
    tests: [
      {
        name: "nested defaults fill the gaps",
        isHidden: false,
        source: `var build = require("src/settings/config").build;
assert.equal(build('{"editor":{"wrap":true}}'), { editor: { wrap: true, tabSize: 2 }, theme: "light" });`,
      },
      {
        name: "a constructor.prototype payload pollutes nothing",
        isHidden: false,
        source: `var build = require("src/settings/config").build;
try {
  build('{"constructor":{"prototype":{"pwnedA":true}}}');
  assert.ok(({}).pwnedA === undefined, "Object.prototype must not gain pwnedA");
} finally {
  delete Object.prototype.pwnedA;
}`,
      },
      {
        name: "a __proto__ payload pollutes nothing",
        isHidden: true,
        source: `var build = require("src/settings/config").build;
try {
  build('{"__proto__":{"pwnedB":true}}');
  assert.ok(({}).pwnedB === undefined, "Object.prototype must not gain pwnedB");
} finally {
  delete Object.prototype.pwnedB;
}`,
      },
      {
        name: "safe keys next to a poisoned one still merge",
        isHidden: true,
        source: `var build = require("src/settings/config").build;
try {
  var out = build('{"constructor":{"prototype":{"pwnedC":1}},"theme":"dark"}');
  assert.ok(({}).pwnedC === undefined, "no pollution");
  assert.equal(out, { theme: "dark", editor: { tabSize: 2, wrap: false } });
} finally {
  delete Object.prototype.pwnedC;
}`,
      },
      {
        name: "defaultsDeep skips a prototype key on a function target",
        isHidden: true,
        source: `var dd = require("src/util/defaults-deep").defaultsDeep;
function Widget() {}
try {
  dd({ kind: Widget }, JSON.parse('{"kind":{"prototype":{"pwnedD":1}},"size":3}'));
  assert.ok(new Widget().pwnedD === undefined, "Widget.prototype untouched");
} finally {
  delete Widget.prototype.pwnedD;
}`,
      },
    ],
    fixedFiles: {
      "src/util/defaults-deep.js": `function isMergeable(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

// These keys are not data: following them from a plain object leads to
// Object / Object.prototype, and writing there pollutes every object in the
// process (lodash CVE-2019-10744). Skip them outright. (A list, not an object
// literal: { "__proto__": true } would set a prototype, not a key.)
var FORBIDDEN = ["__proto__", "constructor", "prototype"];

// Fills every key missing from target with source's value, recursing into
// nested objects. Mutates and returns target.
function defaultsDeep(target, source) {
  for (var key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (FORBIDDEN.indexOf(key) !== -1) continue;
    var incoming = source[key];
    var existing = target[key];
    if (existing === undefined) {
      target[key] = incoming;
    } else if (isMergeable(existing) && isMergeable(incoming)) {
      defaultsDeep(existing, incoming);
    }
  }
  return target;
}

exports.defaultsDeep = defaultsDeep;
`,
    },
  },

  {
    title: "Five Countries Missing From the Average",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Data", "Off By One"],
    description: `Modelled on the **Reinhart–Rogoff spreadsheet error**. Their 2010 paper "Growth in a Time of Debt" was widely cited in austerity debates. In 2013 Thomas Herndon, Michael Ash and Robert Pollin re-ran the authors' own spreadsheet and found, among other issues, that an AVERAGE formula's cell range stopped short and **left out five countries — Australia, Austria, Belgium, Canada and Denmark** — from the headline growth figures. Reinhart and Rogoff acknowledged the coding error.

This reconstruction's \`summary.py\` averages a worksheet's growth column through a spreadsheet-style range helper, and the range it asks for starts several rows too late.

Fix \`average_growth\` so every country row is counted.`,
    bugReport: `**BUG-RR2013** · Priority: High · Reported by: replication study

average_growth(rows) — rows[0] is the header, every later row is one country
[name, bucket, growth]:
- average the growth column over EVERY country row (sheet row 2 through the
  last row)
- blank cells (None) are skipped, not counted as zero
- no values at all -> None
- round the result to 2 decimals

Observed: the first five countries in the sheet never reach the average, so
the figure changes when the sheet is re-sorted.`,
    logs: `[replicate] AVERAGE over L30:L44 — sheet data runs L30:L49
[replicate] 5 of 20 countries excluded from the 90%+ bucket`,
    files: [
      {
        filePath: "src/sheet/summary.py",
        isEditable: true,
        language: "python",
        content: `sheet = bug_require("./sheet.py")

GROWTH_COLUMN = 2


def average_growth(rows):
    cells = sheet.cell_range(rows, 7, len(rows), GROWTH_COLUMN)
    values = [c for c in cells if c is not None]
    if not values:
        return None
    return round(sum(values) / len(values), 2)
`,
      },
      {
        filePath: "src/sheet/sheet.py",
        isEditable: false,
        language: "python",
        content: `# A worksheet is a list of rows; row 0 is the header. Cells are addressed
# the spreadsheet way: rows are 1-based and ranges are inclusive, so
# cell_range(rows, 2, 4, c) reads column c of sheet rows 2, 3 and 4.


def cell_range(rows, first, last, column):
    return [rows[i - 1][column] for i in range(first, last + 1)]
`,
      },
    ],
    tests: [
      {
        name: "every country is averaged",
        isHidden: false,
        source: `m = bug_require("src/sheet/summary.py")
rows = [["Country", "Bucket", "Growth"],
        ["Australia", "90+", 3.0], ["Austria", "90+", 1.0], ["Belgium", "90+", 2.0],
        ["Canada", "90+", 2.0], ["Denmark", "90+", 2.0], ["Greece", "90+", 4.0],
        ["Italy", "90+", -1.0]]
assert_.equal(m.average_growth(rows), 1.86, "illustrative figures, all seven rows")`,
      },
      {
        name: "a header-only sheet has no average",
        isHidden: false,
        source: `m = bug_require("src/sheet/summary.py")
assert_.equal(m.average_growth([["Country", "Bucket", "Growth"]]), None)`,
      },
      {
        name: "blank cells are skipped, not zero",
        isHidden: true,
        source: `m = bug_require("src/sheet/summary.py")
rows = [["Country", "Bucket", "Growth"], ["A", "90+", 2.0], ["B", "90+", None], ["C", "90+", 4.0]]
assert_.equal(m.average_growth(rows), 3.0)`,
      },
      {
        name: "a single country is its own average",
        isHidden: true,
        source: `m = bug_require("src/sheet/summary.py")
assert_.equal(m.average_growth([["Country", "Bucket", "Growth"], ["Japan", "90+", 0.7]]), 0.7)`,
      },
      {
        name: "re-sorting the sheet does not change the average",
        isHidden: true,
        source: `m = bug_require("src/sheet/summary.py")
body = [["C" + str(i), "90+", float(i)] for i in range(1, 13)]
header = [["Country", "Bucket", "Growth"]]
a = m.average_growth(header + body)
b = m.average_growth(header + list(reversed(body)))
assert_.equal(a, 6.5)
assert_.equal(b, 6.5)`,
      },
    ],
    fixedFiles: {
      "src/sheet/summary.py": `sheet = bug_require("./sheet.py")

GROWTH_COLUMN = 2
FIRST_DATA_ROW = 2  # sheet row 1 is the header; data starts right after it


def average_growth(rows):
    # The range must span every data row. A range that starts late silently
    # drops whichever countries happen to sort first (Reinhart-Rogoff lost
    # Australia through Denmark exactly this way).
    cells = sheet.cell_range(rows, FIRST_DATA_ROW, len(rows), GROWTH_COLUMN)
    values = [c for c in cells if c is not None]
    if not values:
        return None
    return round(sum(values) / len(values), 2)
`,
    },
  },

  {
    title: "The Tweet ID JavaScript Rounded Off",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Parsing", "Identifiers"],
    description: `Modelled on **Twitter's move to Snowflake ids in 2010**. Tweet ids became 64-bit integers that soon grew past 2^53, the largest integer a JavaScript number holds exactly. A client that ran the API's JSON through \`JSON.parse\` got a *different*, rounded id, so links and replies pointed at the wrong tweet or none. Twitter's answer was to add string copies of every id — \`id_str\`, \`in_reply_to_status_id_str\` — and tell JavaScript clients to use those.

This reconstruction's timeline view model still reads the numeric fields.

Fix \`toViewModel\` so every id comes from its string field.`,
    bugReport: `**BUG-IDSTR** · Priority: High · Reported by: web client team

toViewModel(rawJson) returns { id, text, permalink, replyTo }:
- id is the tweet's id_str, exactly as sent
- permalink is "/status/" + id
- replyTo is in_reply_to_status_id_str, or null when that is null/absent
- a payload without a digits-only id_str string is malformed: throw

Observed: tweet 1234567890123456789 renders a permalink to
/status/1234567890123456800, which is somebody else's tweet (or a 404).`,
    logs: `[timeline] GET /status/1234567890123456800 -> 404
[timeline] reply target 1498765432109876543 not found in thread`,
    files: [
      {
        filePath: "src/timeline/tweets.js",
        isEditable: true,
        language: "javascript",
        content: `// Turns one raw API payload (a JSON string) into the view model the
// timeline renders.
exports.toViewModel = function (rawJson) {
  var t = JSON.parse(rawJson);
  var id = String(t.id);
  var replyTo = t.in_reply_to_status_id == null ? null : String(t.in_reply_to_status_id);
  return {
    id: id,
    text: t.text,
    permalink: "/status/" + id,
    replyTo: replyTo
  };
};
`,
      },
      {
        filePath: "src/timeline/NUMBERS.js",
        isEditable: false,
        language: "javascript",
        content: `/*
JavaScript numbers are IEEE-754 doubles: integers are exact only up to
Number.MAX_SAFE_INTEGER = 2^53 - 1 = 9007199254740991. JSON.parse turns any
larger integer literal into the nearest double without complaint.
The API sends every id twice: as a number (id) and as a string (id_str).
*/
exports.MAX_SAFE = 9007199254740991;
`,
      },
    ],
    tests: [
      {
        name: "an early, small id renders",
        isHidden: false,
        source: `var vm = require("src/timeline/tweets").toViewModel;
assert.equal(vm('{"id":20,"id_str":"20","text":"just setting up","in_reply_to_status_id":null,"in_reply_to_status_id_str":null}'),
  { id: "20", text: "just setting up", permalink: "/status/20", replyTo: null });`,
      },
      {
        name: "a snowflake id keeps every digit",
        isHidden: false,
        source: `var vm = require("src/timeline/tweets").toViewModel;
var out = vm('{"id":1234567890123456789,"id_str":"1234567890123456789","text":"hi","in_reply_to_status_id":null,"in_reply_to_status_id_str":null}');
assert.equal(out.id, "1234567890123456789");
assert.equal(out.permalink, "/status/1234567890123456789");`,
      },
      {
        name: "the reply target keeps every digit",
        isHidden: true,
        source: `var vm = require("src/timeline/tweets").toViewModel;
var out = vm('{"id":1498765432109876999,"id_str":"1498765432109876999","text":"re","in_reply_to_status_id":1498765432109876543,"in_reply_to_status_id_str":"1498765432109876543"}');
assert.equal(out.replyTo, "1498765432109876543");`,
      },
      {
        name: "a payload without id_str is rejected",
        isHidden: true,
        source: `var vm = require("src/timeline/tweets").toViewModel;
assert.throws(function () { vm('{"id":20,"text":"x","in_reply_to_status_id":null}'); }, "no id_str");
assert.throws(function () { vm('{"id":20,"id_str":20,"text":"x"}'); }, "numeric id_str");`,
      },
      {
        name: "a missing reply field is null",
        isHidden: true,
        source: `var vm = require("src/timeline/tweets").toViewModel;
assert.equal(vm('{"id":7,"id_str":"7","text":"t"}').replyTo, null);`,
      },
    ],
    fixedFiles: {
      "src/timeline/tweets.js": `var DIGITS = /^[0-9]+$/;

// Turns one raw API payload (a JSON string) into the view model the
// timeline renders.
// Snowflake ids exceed 2^53, so the numeric fields are already rounded by the
// time JSON.parse hands them over. Only the *_str copies are exact.
exports.toViewModel = function (rawJson) {
  var t = JSON.parse(rawJson);
  if (typeof t.id_str !== "string" || !DIGITS.test(t.id_str)) {
    throw new Error("tweet payload without a usable id_str");
  }
  var replyStr = t.in_reply_to_status_id_str;
  return {
    id: t.id_str,
    text: t.text,
    permalink: "/status/" + t.id_str,
    replyTo: typeof replyStr === "string" ? replyStr : null
  };
};
`,
    },
  },

  {
    title: "The Missing Torque Calibration",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Config", "Safety", "Validation"],
    description: `Modelled on the **Airbus A400M crash near Seville on 9 May 2015**. On a pre-delivery test flight, three of the aircraft's four engines did not respond correctly after take-off and the aircraft crashed, killing four of the six crew. Airbus later said that torque calibration parameter data had been **accidentally wiped from the engine control units of three engines during software installation**, leaving those engines unable to operate as commanded, and the missing data was not flagged before take-off.

This reconstruction's \`CalibrationLoader\` reads each engine's parameter file. A missing parameter quietly becomes \`0\`, so the preflight check sees a "calibration" for every engine and signs off.

Fix the loader so a missing, blank or unreadable parameter can never be flown on.`,
    bugReport: `**BUG-A400M** · Priority: Critical (safety) · Reported by: flight test

CalibrationLoader.load(file) builds a Calibration from the parameters
"torque.gain" and "torque.offset":
- each value is parsed as a double (surrounding whitespace allowed)
- a parameter that is missing, blank, or not a number must make load() throw
  IllegalStateException naming the parameter — never a default of 0, never a
  NumberFormatException
- Preflight.check(engines) (locked) relies on that: it answers "GO" only when
  every engine loads, otherwise "NO-GO: engines 1,2,3" (1-based)

Observed: three engines with erased calibration files pass preflight as "GO";
in flight their torque commands come out as raw * 0 + 0.`,
    logs: `[ecu-1] load torque.gain=<absent> torque.offset=<absent>
[preflight] engines 1-4 calibrated: GO
[ecu-1] torque command 0.0 for throttle 92%`,
    files: [
      {
        filePath: "src/engine/CalibrationLoader.java",
        isEditable: true,
        language: "java",
        content: `class CalibrationLoader {
    static Calibration load(EngineFile file) {
        double gain = read(file, "torque.gain");
        double offset = read(file, "torque.offset");
        return new Calibration(gain, offset);
    }

    static double read(EngineFile file, String key) {
        String raw = file.values.getOrDefault(key, "0");
        return Double.parseDouble(raw.trim());
    }
}`,
      },
      {
        filePath: "src/engine/Calibration.java",
        isEditable: false,
        language: "java",
        content: `// One engine control unit's parameter file, as key/value text pairs.
class EngineFile {
    final Map<String, String> values = new HashMap<>();

    static EngineFile of(String... kv) {
        EngineFile f = new EngineFile();
        for (int i = 0; i + 1 < kv.length; i += 2) f.values.put(kv[i], kv[i + 1]);
        return f;
    }
}

class Calibration {
    final double gain;
    final double offset;

    Calibration(double gain, double offset) {
        this.gain = gain;
        this.offset = offset;
    }

    // Commanded torque for a raw throttle reading.
    double torque(double raw) {
        return raw * gain + offset;
    }
}`,
      },
      {
        filePath: "src/engine/Preflight.java",
        isEditable: false,
        language: "java",
        content: `class Preflight {
    // "GO" when every engine's calibration loads; otherwise
    // "NO-GO: engines 1,3" (1-based, ascending).
    static String check(List<EngineFile> engines) {
        List<String> bad = new ArrayList<>();
        for (int i = 0; i < engines.size(); i++) {
            try {
                CalibrationLoader.load(engines.get(i));
            } catch (IllegalStateException e) {
                bad.add(String.valueOf(i + 1));
            }
        }
        return bad.isEmpty() ? "GO" : "NO-GO: engines " + String.join(",", bad);
    }
}`,
      },
    ],
    tests: [
      {
        name: "a complete calibration loads",
        isHidden: false,
        source: `                Calibration c = CalibrationLoader.load(EngineFile.of("torque.gain", "1.5", "torque.offset", " 2 "));
                BugAssert.equal(c.torque(10), 17.0, "10 * 1.5 + 2");`,
      },
      {
        name: "four calibrated engines are GO",
        isHidden: false,
        source: `                List<EngineFile> engines = new ArrayList<>();
                for (int i = 0; i < 4; i++) engines.add(EngineFile.of("torque.gain", "1.2", "torque.offset", "0.5"));
                BugAssert.equal(Preflight.check(engines), "GO");`,
      },
      {
        name: "three erased engines are NO-GO",
        isHidden: false,
        source: `                List<EngineFile> engines = new ArrayList<>();
                engines.add(EngineFile.of());
                engines.add(EngineFile.of());
                engines.add(EngineFile.of());
                engines.add(EngineFile.of("torque.gain", "1.2", "torque.offset", "0.5"));
                BugAssert.equal(Preflight.check(engines), "NO-GO: engines 1,2,3", "erased calibration must ground the aircraft");`,
      },
      {
        name: "a single missing parameter throws IllegalStateException",
        isHidden: true,
        source: `                boolean threw = false;
                try {
                    CalibrationLoader.load(EngineFile.of("torque.gain", "1.2"));
                } catch (IllegalStateException e) {
                    threw = true;
                    BugAssert.ok(e.getMessage() != null && e.getMessage().contains("torque.offset"), "the message names the parameter");
                }
                BugAssert.ok(threw, "missing torque.offset must throw");`,
      },
      {
        name: "blank and unreadable values are NO-GO, not a crash",
        isHidden: true,
        source: `                List<EngineFile> engines = new ArrayList<>();
                engines.add(EngineFile.of("torque.gain", "1.2", "torque.offset", "0.5"));
                engines.add(EngineFile.of("torque.gain", "  ", "torque.offset", "0.5"));
                engines.add(EngineFile.of("torque.gain", "1.2", "torque.offset", "0.5"));
                engines.add(EngineFile.of("torque.gain", "1.2", "torque.offset", "n/a"));
                BugAssert.equal(Preflight.check(engines), "NO-GO: engines 2,4");`,
      },
    ],
    fixedFiles: {
      "src/engine/CalibrationLoader.java": `class CalibrationLoader {
    static Calibration load(EngineFile file) {
        double gain = read(file, "torque.gain");
        double offset = read(file, "torque.offset");
        return new Calibration(gain, offset);
    }

    // A calibration parameter has no safe default: 0 is a plausible-looking
    // number that makes the engine ignore its throttle. Absent, blank or
    // unreadable data must stop the engine being declared ready, and it must
    // surface as the exception preflight is built to catch.
    static double read(EngineFile file, String key) {
        String raw = file.values.get(key);
        if (raw == null || raw.trim().isEmpty()) {
            throw new IllegalStateException("calibration parameter missing: " + key);
        }
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("calibration parameter unreadable: " + key);
        }
    }
}`,
    },
  },

  {
    title: "The Files Deleted Years Ago Came Back",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Data", "Sync", "Time"],
    description: `Modelled on **Dropbox in January 2017**, when users reported that files and folders they had deleted — some of them years earlier — had reappeared in their accounts. Dropbox said a bug had caused a small number of users' deleted files to be restored and that it was contacting the people affected.

This reconstruction models one plausible way such a bug happens: a compaction job trims each path's event log before the log is replayed into the live file tree. It throws away old **delete tombstones** but keeps the old uploads they cancelled, so the next replay brings the files back. (Dropbox's own internal root cause was not published in this form; the project is a reconstruction of the failure, not of their code.)

Fix \`compact\` so compaction never changes which files are live.`,
    bugReport: `**BUG-RESURRECT** · Priority: Critical · Reported by: support (users)

compact(events, now, retentionMs) — events are { path, op: "put"|"delete", at }
in the order they happened. It returns the events to keep, in their
original order:
- keep every event with now - at <= retentionMs
- additionally keep, for each path whose LATEST event is a put, that latest
  put (however old — a live file is never compacted away)
- drop everything else

Invariant: replay.livePaths(compact(events, ...)) === replay.livePaths(events).

Observed: a folder deleted two years ago is live again after the nightly
compaction.`,
    logs: `[compact] 3 tombstones older than 30d dropped
[replay] /photos/2015 restored (latest event: put @ day 10)`,
    files: [
      {
        filePath: "src/sync/compact.js",
        isEditable: true,
        language: "javascript",
        content: `// Compacts the event log before it is replayed into the live file tree.
// events: [{ path, op: "put" | "delete", at }] in the order they happened.
exports.compact = function (events, now, retentionMs) {
  return events.filter(function (e) {
    if (e.op === "put") return true;
    return now - e.at <= retentionMs;
  });
};
`,
      },
      {
        filePath: "src/sync/replay.js",
        isEditable: false,
        language: "javascript",
        content: `// Replays an event log: the last event for a path decides whether it exists.
exports.livePaths = function (events) {
  var state = {};
  events.forEach(function (e) { state[e.path] = e.op === "put"; });
  return Object.keys(state).filter(function (p) { return state[p]; }).sort();
};
`,
      },
    ],
    tests: [
      {
        name: "recent events are kept as they are",
        isHidden: false,
        source: `var compact = require("src/sync/compact").compact;
var DAY = 86400000, now = 1000 * DAY;
var events = [{ path: "a", op: "put", at: 990 * DAY }, { path: "a", op: "delete", at: 995 * DAY }, { path: "b", op: "put", at: 999 * DAY }];
assert.equal(compact(events, now, 30 * DAY), events);`,
      },
      {
        name: "a file deleted long ago stays deleted",
        isHidden: false,
        source: `var compact = require("src/sync/compact").compact;
var live = require("src/sync/replay").livePaths;
var DAY = 86400000, now = 1000 * DAY;
var events = [{ path: "/photos/2015", op: "put", at: 10 * DAY }, { path: "/photos/2015", op: "delete", at: 20 * DAY }, { path: "/notes", op: "put", at: 990 * DAY }];
assert.equal(live(compact(events, now, 30 * DAY)), ["/notes"], "the tombstone's work must survive compaction");`,
      },
      {
        name: "an old file that is still live is kept",
        isHidden: true,
        source: `var compact = require("src/sync/compact").compact;
var DAY = 86400000, now = 1000 * DAY;
var events = [{ path: "c", op: "put", at: 5 * DAY }];
assert.equal(compact(events, now, 30 * DAY), events);`,
      },
      {
        name: "exactly the specified events survive",
        isHidden: true,
        source: `var compact = require("src/sync/compact").compact;
var DAY = 86400000, now = 1000 * DAY;
var events = [
  { path: "a", op: "put", at: 10 * DAY },
  { path: "a", op: "delete", at: 20 * DAY },
  { path: "c", op: "put", at: 5 * DAY },
  { path: "c", op: "put", at: 8 * DAY },
  { path: "d", op: "put", at: 995 * DAY }
];
assert.equal(compact(events, now, 30 * DAY), [events[3], events[4]]);`,
      },
      {
        name: "deleted then re-uploaded long ago stays live",
        isHidden: true,
        source: `var compact = require("src/sync/compact").compact;
var live = require("src/sync/replay").livePaths;
var DAY = 86400000, now = 1000 * DAY;
var events = [{ path: "x", op: "put", at: 1 * DAY }, { path: "x", op: "delete", at: 2 * DAY }, { path: "x", op: "put", at: 3 * DAY }];
var kept = compact(events, now, 30 * DAY);
assert.equal(kept, [events[2]]);
assert.equal(live(kept), ["x"]);`,
      },
    ],
    fixedFiles: {
      "src/sync/compact.js": `// Compacts the event log before it is replayed into the live file tree.
// events: [{ path, op: "put" | "delete", at }] in the order they happened.
// A tombstone only matters relative to the puts it cancels: dropping an old
// delete while keeping the older put resurrects the file on the next replay.
// So an expired event survives only if it is the latest event for its path
// AND a put (the file is live); everything an old delete cancelled goes too.
exports.compact = function (events, now, retentionMs) {
  var latest = {};
  events.forEach(function (e, i) { latest[e.path] = i; });
  return events.filter(function (e, i) {
    if (now - e.at <= retentionMs) return true;
    return latest[e.path] === i && e.op === "put";
  });
};
`,
    },
  },

  {
    title: "The Canary That Failed and Was Overruled",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Config", "Deploys"],
    description: `Modelled on the **Google Compute Engine outage of 11 April 2016**, when GCE instances lost external connectivity in every region for about 18 minutes. Google's post-mortem: engineers removed an unused IP block from the network configuration, and a timing quirk in the management software produced an inconsistent, effectively empty configuration. The canary step correctly found the new configuration unsafe — but a **second bug** meant that failure did not stop the rollout, and every site withdrew its announcements of Google Cloud's IP blocks.

This reconstruction's \`propagate.js\` runs a set of canary checks and then pushes the config everywhere. It also never questions a config with no IP blocks in it.

Fix \`propagate\` so a failed canary aborts and an empty config is never pushed.`,
    bugReport: `**BUG-GCE0411** · Priority: Critical · Reported by: SRE

propagate(config, sites, runChecks) returns { status, reason, pushed }:
- config.blocks missing or empty -> { status: "aborted", reason: "empty-config",
  pushed: [] }, WITHOUT calling runChecks (the canary is not touched either)
- otherwise runChecks(sites[0], config) returns [{ name, ok }, ...]; if ANY
  check is not ok -> { status: "aborted", reason: "canary", pushed: [] }
- only when every check passes -> { status: "done", reason: null,
  pushed: <every site, in order> }

Observed: the canary reported a failing check, the rollout carried on, and
all sites withdrew their routes.`,
    logs: `[canary] site=us-central1 check=announcements FAILED check=bgp-session ok
[propagate] canary verdict: pass (last check ok)
[propagate] pushed config (0 blocks) to 14 sites`,
    files: [
      {
        filePath: "src/net/propagate.js",
        isEditable: true,
        language: "javascript",
        content: `// Pushes a new IP-block announcement config to every site: the canary
// first, then everyone else.
exports.propagate = function (config, sites, runChecks) {
  var canary = sites[0];
  var results = runChecks(canary, config);
  var failed = false;
  for (var i = 0; i < results.length; i++) {
    failed = !results[i].ok;
  }
  if (failed) return { status: "aborted", reason: "canary", pushed: [] };
  return { status: "done", reason: null, pushed: sites.slice() };
};
`,
      },
      {
        filePath: "src/net/ROLLOUT.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A config with no blocks tells every site to withdraw every route. That is
never an intended change; treat it as corruption.
The canary runs several independent checks. One failing check is enough:
the checks are not a vote.
*/
`,
      },
    ],
    tests: [
      {
        name: "a healthy config reaches every site",
        isHidden: false,
        source: `var p = require("src/net/propagate").propagate;
var out = p({ blocks: ["10.0.0.0/8"] }, ["s1", "s2", "s3"], function () { return [{ name: "a", ok: true }, { name: "b", ok: true }]; });
assert.equal(out, { status: "done", reason: null, pushed: ["s1", "s2", "s3"] });`,
      },
      {
        name: "one failing canary check aborts",
        isHidden: false,
        source: `var p = require("src/net/propagate").propagate;
var out = p({ blocks: ["10.0.0.0/8"] }, ["s1", "s2"], function () { return [{ name: "announcements", ok: false }, { name: "bgp", ok: true }]; });
assert.equal(out, { status: "aborted", reason: "canary", pushed: [] });`,
      },
      {
        name: "all checks failing aborts",
        isHidden: true,
        source: `var p = require("src/net/propagate").propagate;
var out = p({ blocks: ["10.0.0.0/8"] }, ["s1", "s2"], function () { return [{ name: "a", ok: false }, { name: "b", ok: false }]; });
assert.equal(out, { status: "aborted", reason: "canary", pushed: [] });`,
      },
      {
        name: "an empty config is refused before the canary",
        isHidden: true,
        source: `var p = require("src/net/propagate").propagate;
var calls = 0;
var checks = function () { calls++; return [{ name: "a", ok: true }]; };
assert.equal(p({ blocks: [] }, ["s1", "s2"], checks), { status: "aborted", reason: "empty-config", pushed: [] });
assert.equal(p({}, ["s1", "s2"], checks), { status: "aborted", reason: "empty-config", pushed: [] });
assert.equal(calls, 0, "the canary must not even see an empty config");`,
      },
      {
        name: "a failure in the middle of the checks aborts",
        isHidden: true,
        source: `var p = require("src/net/propagate").propagate;
var out = p({ blocks: ["a"] }, ["s1"], function () { return [{ name: "a", ok: true }, { name: "b", ok: false }, { name: "c", ok: true }]; });
assert.equal(out.status, "aborted");`,
      },
    ],
    fixedFiles: {
      "src/net/propagate.js": `// Pushes a new IP-block announcement config to every site: the canary
// first, then everyone else.
exports.propagate = function (config, sites, runChecks) {
  // An empty config means "withdraw everything" — never a real change.
  if (!config.blocks || config.blocks.length === 0) {
    return { status: "aborted", reason: "empty-config", pushed: [] };
  }
  var canary = sites[0];
  var results = runChecks(canary, config);
  // Any failing check fails the canary. Overwriting the flag per check let
  // a later passing check erase an earlier failure.
  var failed = false;
  for (var i = 0; i < results.length; i++) {
    if (!results[i].ok) failed = true;
  }
  if (failed) return { status: "aborted", reason: "canary", pushed: [] };
  return { status: "done", reason: null, pushed: sites.slice() };
};
`,
    },
  },

  {
    title: "The Hash That Started With a Zero Byte",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Crypto", "Hashing"],
    description: `Modelled on the **Nintendo Wii "Trucha" signing bug**, found by the homebrew community around 2008. The Wii's system software checked a signature by recovering the signed SHA-1 hash and comparing it with the content's hash using **\`strncmp\`** — a *string* comparison that stops at the first zero byte. A forged signature that recovered to a hash beginning with 0x00, paired with content tweaked until its own hash also began with 0x00, compared "equal" after zero bytes, and unsigned software ran as if Nintendo had signed it.

This reconstruction's \`verify.py\` compares the two hashes the same way: byte by byte, stopping at the first zero.

Fix \`hashes_match\` so it compares every byte of both hashes, in constant time.`,
    bugReport: `**BUG-TRUCHA** · Priority: Critical · Reported by: security

hashes_match(computed, recovered) — both are bytes objects:
- True only when both have the same length AND every byte is equal
- a zero byte is an ordinary byte value, not a terminator
- the comparison must not return early on a mismatch (use a constant-time
  comparison such as hmac.compare_digest)

accept(content, recovered) == hashes_match(sha1(content), recovered).

Observed: content whose SHA-1 starts with 0x00 is accepted with a signature
that recovers to twenty zero bytes.`,
    logs: `[ios] title 00010001 sig check: hash[0]=00 recovered[0]=00 -> OK
[ios] launched unsigned title 00010001`,
    files: [
      {
        filePath: "src/ios/verify.py",
        isEditable: true,
        language: "python",
        content: `digest = bug_require("./digest.py")


def hashes_match(computed, recovered):
    for i in range(len(computed)):
        a = computed[i]
        b = recovered[i] if i < len(recovered) else 0
        if a != b:
            return False
        if a == 0:
            return True
    return True


def accept(content, recovered):
    return hashes_match(digest.sha1(content), recovered)
`,
      },
      {
        filePath: "src/ios/digest.py",
        isEditable: false,
        language: "python",
        content: `# SHA-1 as raw bytes (20 of them). "recovered" in verify.py is the hash the
# signature decrypts to; a real system gets it from the RSA public-key step.
import hashlib


def sha1(data):
    return hashlib.sha1(data).digest()
`,
      },
    ],
    tests: [
      {
        name: "the genuine hash is accepted",
        isHidden: false,
        source: `m = bug_require("src/ios/verify.py")
d = bug_require("src/ios/digest.py")
content = b"channel.app"
assert_.ok(m.accept(content, d.sha1(content)))`,
      },
      {
        name: "a hash that differs in the first byte is rejected",
        isHidden: false,
        source: `m = bug_require("src/ios/verify.py")
d = bug_require("src/ios/digest.py")
content = b"channel.app"
h = d.sha1(content)
bad = bytes([h[0] ^ 1]) + h[1:]
assert_.ok(not m.accept(content, bad))`,
      },
      {
        name: "a zero-led forgery is rejected",
        isHidden: false,
        source: `m = bug_require("src/ios/verify.py")
d = bug_require("src/ios/digest.py")
content = None
for i in range(100000):
    c = ("homebrew-" + str(i)).encode()
    if d.sha1(c)[0] == 0:
        content = c
        break
assert_.ok(content is not None, "fixture: found content hashing to 0x00...")
assert_.ok(not m.accept(content, bytes(20)), "twenty zero bytes are not that content's hash")`,
      },
      {
        name: "a zero byte in the middle is not a terminator",
        isHidden: true,
        source: `m = bug_require("src/ios/verify.py")
d = bug_require("src/ios/digest.py")
found = None
for i in range(100000):
    c = ("title-" + str(i)).encode()
    h = d.sha1(c)
    if 0 in h[1:10]:
        found = (c, h)
        break
assert_.ok(found is not None, "fixture")
c, h = found
k = h.index(0, 1)
forged = h[:k + 1] + bytes(20 - k - 1)
assert_.ok(forged != h, "fixture: forged differs")
assert_.ok(not m.accept(c, forged))`,
      },
      {
        name: "length mismatches are rejected",
        isHidden: true,
        source: `m = bug_require("src/ios/verify.py")
h = bytes([0, 1, 2, 3])
assert_.ok(not m.hashes_match(h, h[:1]), "shorter")
assert_.ok(not m.hashes_match(h, h + bytes(1)), "longer")
assert_.ok(m.hashes_match(h, bytes([0, 1, 2, 3])), "equal")`,
      },
    ],
    fixedFiles: {
      "src/ios/verify.py": `import hmac

digest = bug_require("./digest.py")


def hashes_match(computed, recovered):
    # A hash is binary data, not a C string: 0x00 is just a byte value.
    # strncmp-style comparison stopped at the first zero, so any content whose
    # hash began with 0x00 matched a forged all-zero hash. Compare the full
    # length, in constant time so timing leaks nothing either.
    if len(computed) != len(recovered):
        return False
    return hmac.compare_digest(computed, recovered)


def accept(content, recovered):
    return hashes_match(digest.sha1(content), recovered)
`,
    },
  },

  {
    title: "Two Waypoints, One Name",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Parsing", "Safety", "Resilience"],
    description: `Modelled on the **NATS flight-plan failure of 28 August 2023**, the UK bank-holiday Monday when air traffic control had to fall back to manual flight-plan processing. NATS's investigation found that a single flight plan referred to **two different waypoints that share the same identifier**. The flight-plan processing system could not resolve the route, treated it as a critical error, and — to protect safety — both the primary and the backup system stopped processing, triggering widespread cancellations.
This reconstruction's \`RouteResolver\` refuses any identifier with more than one match, and \`FlightPlanProcessor.processAll\` lets that one exception stop the whole batch.

Fix the resolver to use the route's context, and the processor to send a single unresolvable plan to the manual queue.`,
    bugReport: `**BUG-NATS0828** · Priority: Critical · Reported by: operations

RouteResolver.resolve(route, db):
- an id with exactly one entry resolves to it
- an unknown id throws RouteException
- an id with several entries resolves to the candidate NEAREST (squared
  distance, Waypoint.dist2) to the previous resolved waypoint of the route
- if the ambiguous id is the first waypoint (no context), or two candidates
  are equally near, throw RouteException

FlightPlanProcessor.processAll(plans, db):
- each plan is resolved independently; success -> its callsign is appended to
  \`processed\`
- a RouteException -> its callsign is appended to \`manual\` and processing
  CONTINUES with the next plan; processAll never throws for one bad plan

Observed: one plan with a duplicated waypoint name stopped processing for
every plan behind it.`,
    logs: `[fprsa] plan BAW123 route ... KOBA ... -> 2 candidates for KOBA
[fprsa] critical exception, entering maintenance mode
[fprsa-backup] same plan, same exception, entering maintenance mode`,
    files: [
      {
        filePath: "src/atc/FlightPlanProcessor.java",
        isEditable: true,
        language: "java",
        content: `class RouteResolver {
    static List<Waypoint> resolve(List<String> route, WaypointDb db) {
        List<Waypoint> out = new ArrayList<>();
        for (String id : route) {
            List<Waypoint> candidates = db.lookup(id);
            if (candidates.size() != 1) {
                throw new RouteException("cannot resolve " + id);
            }
            out.add(candidates.get(0));
        }
        return out;
    }
}

class FlightPlanProcessor {
    final List<String> processed = new ArrayList<>();
    final List<String> manual = new ArrayList<>();

    void processAll(List<FlightPlan> plans, WaypointDb db) {
        for (FlightPlan p : plans) {
            RouteResolver.resolve(p.route, db);
            processed.add(p.callsign);
        }
    }
}`,
      },
      {
        filePath: "src/atc/Waypoints.java",
        isEditable: false,
        language: "java",
        content: `class Waypoint {
    final String id;
    final int x;
    final int y;

    Waypoint(String id, int x, int y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    long dist2(Waypoint o) {
        long dx = x - o.x, dy = y - o.y;
        return dx * dx + dy * dy;
    }

    public String toString() {
        return id + "@" + x + "," + y;
    }
}

// Waypoint identifiers are NOT globally unique: the same five-letter name
// can belong to points on different continents.
class WaypointDb {
    private final Map<String, List<Waypoint>> byId = new HashMap<>();

    void add(String id, int x, int y) {
        byId.computeIfAbsent(id, k -> new ArrayList<>()).add(new Waypoint(id, x, y));
    }

    List<Waypoint> lookup(String id) {
        return byId.getOrDefault(id, Collections.emptyList());
    }
}

class FlightPlan {
    final String callsign;
    final List<String> route;

    FlightPlan(String callsign, String... route) {
        this.callsign = callsign;
        this.route = Arrays.asList(route);
    }
}

class RouteException extends RuntimeException {
    RouteException(String msg) {
        super(msg);
    }
}`,
      },
      {
        filePath: "src/atc/Charts.java",
        isEditable: false,
        language: "java",
        content: `// Test chart: a handful of European points plus one identifier (KOBA) that
// also names a point far away, and one (TWIN) whose two points sit at the
// same distance from MID.
class Charts {
    static WaypointDb europe() {
        WaypointDb db = new WaypointDb();
        db.add("LAM", 0, 0);
        db.add("DVR", 100, 0);
        db.add("MID", 50, 0);
        db.add("TIGER", 50, 50);
        db.add("KOBA", 110, 5);
        db.add("KOBA", 4000, 3000);
        db.add("FAR", 3990, 2990);
        db.add("TWIN", 0, 100);
        db.add("TWIN", 100, 100);
        return db;
    }
}`,
      },
    ],
    tests: [
      {
        name: "a route of unique waypoints resolves",
        isHidden: false,
        source: `                List<Waypoint> r = RouteResolver.resolve(Arrays.asList("LAM", "DVR", "TIGER"), Charts.europe());
                BugAssert.equal(r.toString(), "[LAM@0,0, DVR@100,0, TIGER@50,50]");`,
      },
      {
        name: "a duplicated name resolves by the route around it",
        isHidden: false,
        source: `                List<Waypoint> r = RouteResolver.resolve(Arrays.asList("LAM", "DVR", "KOBA"), Charts.europe());
                BugAssert.equal(r.get(2).toString(), "KOBA@110,5", "the KOBA next to DVR");`,
      },
      {
        name: "one bad plan goes to the manual queue and the rest continue",
        isHidden: false,
        source: `                FlightPlanProcessor fp = new FlightPlanProcessor();
                List<FlightPlan> plans = Arrays.asList(
                    new FlightPlan("AAA1", "LAM", "DVR"),
                    new FlightPlan("BBB2", "LAM", "NOWHERE"),
                    new FlightPlan("CCC3", "DVR", "TIGER"));
                fp.processAll(plans, Charts.europe());
                BugAssert.equal(fp.processed.toString(), "[AAA1, CCC3]");
                BugAssert.equal(fp.manual.toString(), "[BBB2]");`,
      },
      {
        name: "the far twin is chosen when the route is far away",
        isHidden: true,
        source: `                List<Waypoint> r = RouteResolver.resolve(Arrays.asList("FAR", "KOBA"), Charts.europe());
                BugAssert.equal(r.get(1).toString(), "KOBA@4000,3000");`,
      },
      {
        name: "no context or a tie goes to manual",
        isHidden: true,
        source: `                FlightPlanProcessor fp = new FlightPlanProcessor();
                List<FlightPlan> plans = Arrays.asList(
                    new FlightPlan("FIRST1", "KOBA", "DVR"),
                    new FlightPlan("OK2", "LAM", "DVR", "KOBA"),
                    new FlightPlan("TIE3", "MID", "TWIN"));
                fp.processAll(plans, Charts.europe());
                BugAssert.equal(fp.processed.toString(), "[OK2]");
                BugAssert.equal(fp.manual.toString(), "[FIRST1, TIE3]");`,
      },
    ],
    fixedFiles: {
      "src/atc/FlightPlanProcessor.java": `class RouteResolver {
    // Identifiers are not unique worldwide, so a duplicate is normal data, not
    // corruption: pick the candidate that fits the route (nearest to the point
    // before it). Only when context cannot decide is the plan unresolvable.
    static List<Waypoint> resolve(List<String> route, WaypointDb db) {
        List<Waypoint> out = new ArrayList<>();
        for (String id : route) {
            List<Waypoint> candidates = db.lookup(id);
            if (candidates.isEmpty()) throw new RouteException("unknown waypoint " + id);
            if (candidates.size() == 1) {
                out.add(candidates.get(0));
                continue;
            }
            if (out.isEmpty()) throw new RouteException("ambiguous " + id + " with no preceding waypoint");
            Waypoint prev = out.get(out.size() - 1);
            Waypoint best = null;
            long bestD = Long.MAX_VALUE;
            boolean tie = false;
            for (Waypoint c : candidates) {
                long d = c.dist2(prev);
                if (d < bestD) {
                    best = c;
                    bestD = d;
                    tie = false;
                } else if (d == bestD) {
                    tie = true;
                }
            }
            if (tie) throw new RouteException("ambiguous " + id + ": equally near candidates");
            out.add(best);
        }
        return out;
    }
}

class FlightPlanProcessor {
    final List<String> processed = new ArrayList<>();
    final List<String> manual = new ArrayList<>();

    // One unresolvable plan is an exception to hand to a human, not a reason
    // to stop processing every plan behind it (the primary and the backup
    // both halted on the same single plan).
    void processAll(List<FlightPlan> plans, WaypointDb db) {
        for (FlightPlan p : plans) {
            try {
                RouteResolver.resolve(p.route, db);
                processed.add(p.callsign);
            } catch (RouteException e) {
                manual.add(p.callsign);
            }
        }
    }
}`,
    },
  },

  {
    title: "The Cleanup Job That Ran Against Production",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Access", "Config", "Data"],
    description: `Modelled on the **AWS Elastic Load Balancing outage of 24 December 2012** in US-East. Amazon's summary: a maintenance process was **inadvertently run against the production ELB state data** and deleted part of it. The process was started by one of a small number of developers who had access to production for that purpose, and at the time such runs did not require per-change approval. Load balancers began to fail over Christmas Eve — Netflix streaming was among the services hit — and AWS changed its access controls so that production state changes need specific approval.

This reconstruction's job runner checks only that the operator *may* reach the target environment. A cleanup written for staging runs happily against production.

Fix \`run_job\` so destructive jobs only run where they were meant to, with approval for production.`,
    bugReport: `**BUG-ELB1224** · Priority: Critical · Reported by: incident review

run_job(job, user, target_env, store, approvals) — job is
{ name, destructive, env, matches }:
- the user must have access to target_env (access.can_access), else raise
  PermissionError
- a destructive job must declare job["env"] and it must equal target_env
  exactly, else raise PermissionError
- a destructive job against "production" additionally needs
  approvals.get(job["name"]) to be a non-empty change id, else raise
  PermissionError
- a refused job leaves store["rows"] untouched
- when allowed, a destructive job removes every row for which
  job["matches"](row) is true; any allowed job returns "ran"

Observed: a staging cleanup run by an engineer with production access
deleted production rows.`,
    logs: `[ops] dev-ana ran cleanup-stale-lbs env=production (job authored for staging)
[elb] 1,204 load balancer state rows deleted
[elb] control plane: state missing for lb-7f3a, scaling disabled`,
    files: [
      {
        filePath: "src/ops/jobs.py",
        isEditable: true,
        language: "python",
        content: `access = bug_require("./access.py")


def run_job(job, user, target_env, store, approvals):
    if not access.can_access(user, target_env):
        raise PermissionError("no access to " + target_env)
    if job["destructive"]:
        store["rows"] = [r for r in store["rows"] if not job["matches"](r)]
    return "ran"
`,
      },
      {
        filePath: "src/ops/access.py",
        isEditable: false,
        language: "python",
        content: `# Who may connect to which environment's state store. Having access is not
# the same as having approval to change what is there.
ACCESS = {
    "dev-ana": ["development", "staging", "production"],
    "dev-bo": ["development"],
}


def can_access(user, env):
    return env in ACCESS.get(user, [])
`,
      },
    ],
    tests: [
      {
        name: "a destructive job on its own dev environment runs",
        isHidden: false,
        source: `m = bug_require("src/ops/jobs.py")
store = {"rows": [1, 2, 3, 4]}
job = {"name": "drop-even", "destructive": True, "env": "development", "matches": lambda r: r % 2 == 0}
assert_.equal(m.run_job(job, "dev-bo", "development", store, {}), "ran")
assert_.equal(store["rows"], [1, 3])`,
      },
      {
        name: "a staging job pointed at production is refused",
        isHidden: false,
        source: `m = bug_require("src/ops/jobs.py")
store = {"rows": [1, 2, 3, 4]}
job = {"name": "cleanup", "destructive": True, "env": "staging", "matches": lambda r: True}
assert_.throws(lambda: m.run_job(job, "dev-ana", "production", store, {"cleanup": "CHG-1"}), "wrong environment")
assert_.equal(store["rows"], [1, 2, 3, 4], "production state untouched")`,
      },
      {
        name: "production needs an approval",
        isHidden: true,
        source: `m = bug_require("src/ops/jobs.py")
store = {"rows": [1, 2, 3]}
job = {"name": "cleanup", "destructive": True, "env": "production", "matches": lambda r: r == 2}
assert_.throws(lambda: m.run_job(job, "dev-ana", "production", store, {}), "no approval")
assert_.throws(lambda: m.run_job(job, "dev-ana", "production", store, {"cleanup": ""}), "empty approval")
assert_.throws(lambda: m.run_job(job, "dev-ana", "production", store, {"other-job": "CHG-9"}), "approval for another job")
assert_.equal(store["rows"], [1, 2, 3])`,
      },
      {
        name: "an approved production job runs",
        isHidden: true,
        source: `m = bug_require("src/ops/jobs.py")
store = {"rows": [1, 2, 3]}
job = {"name": "cleanup", "destructive": True, "env": "production", "matches": lambda r: r == 2}
assert_.equal(m.run_job(job, "dev-ana", "production", store, {"cleanup": "CHG-42"}), "ran")
assert_.equal(store["rows"], [1, 3])`,
      },
      {
        name: "no access is still refused, and read-only jobs just run",
        isHidden: true,
        source: `m = bug_require("src/ops/jobs.py")
store = {"rows": [1]}
job = {"name": "c", "destructive": True, "env": "staging", "matches": lambda r: True}
assert_.throws(lambda: m.run_job(job, "dev-bo", "staging", store, {}), "no access")
report = {"name": "count", "destructive": False, "matches": lambda r: True}
assert_.equal(m.run_job(report, "dev-ana", "production", store, {}), "ran")
assert_.equal(store["rows"], [1])
nameless = {"name": "c2", "destructive": True, "matches": lambda r: True}
assert_.throws(lambda: m.run_job(nameless, "dev-ana", "development", store, {}), "undeclared env")
assert_.equal(store["rows"], [1])`,
      },
    ],
    fixedFiles: {
      "src/ops/jobs.py": `access = bug_require("./access.py")


def run_job(job, user, target_env, store, approvals):
    if not access.can_access(user, target_env):
        raise PermissionError("no access to " + target_env)
    if job["destructive"]:
        # Access says who CAN reach an environment; it says nothing about
        # whether this job belongs there. A destructive job runs only in the
        # environment it declares, and production changes need an approval.
        if job.get("env") != target_env:
            raise PermissionError("job " + job["name"] + " is not for " + target_env)
        if target_env == "production" and not approvals.get(job["name"]):
            raise PermissionError("production change needs approval: " + job["name"])
        store["rows"] = [r for r in store["rows"] if not job["matches"](r)]
    return "ran"
`,
    },
  },

  {
    title: "Posting on Anyone's Timeline",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on **Khalil Shreateh's Facebook report of August 2013**. The security researcher found he could post to the timeline of **any** Facebook user, including people who were not his friends. When his report to the bug-bounty programme was dismissed, he demonstrated it by posting on Mark Zuckerberg's own timeline. Facebook then fixed the flaw (and declined to pay a bounty, since the demonstration broke its rules).

This reconstruction's \`wall.js\` checks that both accounts exist and then posts. It never asks whether the actor is allowed to write on that wall.

Fix \`postToWall\` so it enforces the wall owner's audience setting.`,
    bugReport: `**BUG-WALL** · Priority: Critical · Reported by: external researcher

postToWall(g, actorId, ownerId, text) returns { ok, error }:
- unknown owner -> { ok: false, error: "not_found" }
- unknown actor -> { ok: false, error: "unauthenticated" }
- the owner may always post on their own wall
- audience "friends": a friend of the owner (graph.areFriends) may post
- audience "only_me": nobody but the owner
- anyone else -> { ok: false, error: "forbidden" } and the wall is unchanged
- an allowed post appends { from: actorId, text } and returns
  { ok: true, error: null }

Observed: a stranger's post appeared on the CEO's timeline.`,
    logs: `[wall] khalil -> mark: "..." (not friends) ok=true`,
    files: [
      {
        filePath: "src/social/wall.js",
        isEditable: true,
        language: "javascript",
        content: `var graph = require("./graph");

exports.postToWall = function (g, actorId, ownerId, text) {
  var owner = g.users[ownerId];
  if (!owner) return { ok: false, error: "not_found" };
  if (!g.users[actorId]) return { ok: false, error: "unauthenticated" };
  owner.wall.push({ from: actorId, text: text });
  return { ok: true, error: null };
};
`,
      },
      {
        filePath: "src/social/graph.js",
        isEditable: false,
        language: "javascript",
        content: `exports.create = function () {
  return {
    users: {
      mark: { wall: [], audience: "friends" },
      khalil: { wall: [], audience: "friends" },
      sarah: { wall: [], audience: "friends" },
      quiet: { wall: [], audience: "only_me" }
    },
    friendships: [["mark", "sarah"], ["sarah", "quiet"]]
  };
};

exports.areFriends = function (g, a, b) {
  return g.friendships.some(function (f) {
    return (f[0] === a && f[1] === b) || (f[0] === b && f[1] === a);
  });
};
`,
      },
    ],
    tests: [
      {
        name: "the owner posts on their own wall",
        isHidden: false,
        source: `var w = require("src/social/wall");
var g = require("src/social/graph").create();
assert.equal(w.postToWall(g, "khalil", "khalil", "hello"), { ok: true, error: null });
assert.equal(g.users.khalil.wall, [{ from: "khalil", text: "hello" }]);`,
      },
      {
        name: "a stranger cannot post on someone's wall",
        isHidden: false,
        source: `var w = require("src/social/wall");
var g = require("src/social/graph").create();
assert.equal(w.postToWall(g, "khalil", "mark", "bug report"), { ok: false, error: "forbidden" });
assert.equal(g.users.mark.wall, [], "wall unchanged");`,
      },
      {
        name: "a friend posts on a friends wall",
        isHidden: true,
        source: `var w = require("src/social/wall");
var g = require("src/social/graph").create();
assert.equal(w.postToWall(g, "sarah", "mark", "hi"), { ok: true, error: null });
assert.equal(g.users.mark.wall, [{ from: "sarah", text: "hi" }]);`,
      },
      {
        name: "only_me shuts out friends too",
        isHidden: true,
        source: `var w = require("src/social/wall");
var g = require("src/social/graph").create();
assert.equal(w.postToWall(g, "sarah", "quiet", "hi"), { ok: false, error: "forbidden" });
assert.equal(w.postToWall(g, "quiet", "quiet", "note"), { ok: true, error: null });
assert.equal(g.users.quiet.wall.length, 1);`,
      },
      {
        name: "unknown accounts",
        isHidden: true,
        source: `var w = require("src/social/wall");
var g = require("src/social/graph").create();
assert.equal(w.postToWall(g, "ghost", "mark", "x"), { ok: false, error: "unauthenticated" });
assert.equal(w.postToWall(g, "mark", "nobody", "x"), { ok: false, error: "not_found" });`,
      },
    ],
    fixedFiles: {
      "src/social/wall.js": `var graph = require("./graph");

// Existing is not the same as allowed: the endpoint must ask whether THIS
// actor may write on THIS wall, per the owner's audience setting.
function mayPost(g, actorId, ownerId, owner) {
  if (actorId === ownerId) return true;
  if (owner.audience === "friends") return graph.areFriends(g, actorId, ownerId);
  return false;
}

exports.postToWall = function (g, actorId, ownerId, text) {
  var owner = g.users[ownerId];
  if (!owner) return { ok: false, error: "not_found" };
  if (!g.users[actorId]) return { ok: false, error: "unauthenticated" };
  if (!mayPost(g, actorId, ownerId, owner)) return { ok: false, error: "forbidden" };
  owner.wall.push({ from: actorId, text: text });
  return { ok: true, error: null };
};
`,
    },
  },

  {
    title: "The Internal Header Anyone Could Send",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "Networking"],
    description: `Modelled on **Next.js CVE-2025-29927** (March 2025). Next.js marked its own internal subrequests with an \`x-middleware-subrequest\` header so middleware would not recurse into itself. The framework **trusted that header on incoming requests too**: a client that sent it with the right value had middleware skipped entirely — and with it any authentication or authorisation check the app ran in middleware. Patched releases stopped honouring the header from outside, and the advice for unpatched deployments was to strip it at the edge.

This reconstruction's \`pipeline.js\` has the same recursion guard, read straight from the request headers.

Fix \`handle\` so only the server's own subrequests can skip middleware.`,
    bugReport: `**BUG-MWSKIP** · Priority: Critical (auth bypass) · Reported by: security

handle(req, middleware, route) — req = { path, headers, internal? }:
- req.internal === true marks a subrequest the server itself created; only
  then is the "x-middleware-subrequest" header honoured (a colon-separated
  list of middleware names already run; if middleware.name is in it,
  middleware is skipped)
- on any other request the header is deleted from req.headers before
  middleware or the route sees it, and middleware ALWAYS runs
- a non-null result from middleware.run(req) is returned as the response;
  otherwise route(req) is

Observed: GET /admin with "x-middleware-subrequest: middleware" and no
cookie returns the admin page.`,
    logs: `[edge] GET /admin cookie=<none> x-middleware-subrequest=middleware -> 200`,
    files: [
      {
        filePath: "src/server/pipeline.js",
        isEditable: true,
        language: "javascript",
        content: `var HEADER = "x-middleware-subrequest";

// Runs the middleware, then the route. A subrequest lists the middleware it
// has already been through, so middleware that fetches its own app does not
// recurse forever.
exports.handle = function (req, middleware, route) {
  var seen = (req.headers[HEADER] || "").split(":");
  if (seen.indexOf(middleware.name) === -1) {
    var early = middleware.run(req);
    if (early) return early;
  }
  return route(req);
};
`,
      },
      {
        filePath: "src/server/auth-middleware.js",
        isEditable: false,
        language: "javascript",
        content: `exports.name = "middleware";

// Refuses anything under /admin without a session cookie. Header names
// arrive lower-cased from the HTTP layer.
exports.run = function (req) {
  if (req.path.indexOf("/admin") === 0 && !req.headers.cookie) {
    return { status: 401, body: "sign in" };
  }
  return null;
};
`,
      },
    ],
    tests: [
      {
        name: "an anonymous /admin request is refused",
        isHidden: false,
        source: `var handle = require("src/server/pipeline").handle;
var mw = require("src/server/auth-middleware");
var route = function () { return { status: 200, body: "admin" }; };
assert.equal(handle({ path: "/admin", headers: {} }, mw, route), { status: 401, body: "sign in" });`,
      },
      {
        name: "the internal header cannot skip middleware from outside",
        isHidden: false,
        source: `var handle = require("src/server/pipeline").handle;
var mw = require("src/server/auth-middleware");
var route = function () { return { status: 200, body: "admin" }; };
assert.equal(handle({ path: "/admin", headers: { "x-middleware-subrequest": "middleware" } }, mw, route), { status: 401, body: "sign in" });`,
      },
      {
        name: "repeated names do not help either",
        isHidden: true,
        source: `var handle = require("src/server/pipeline").handle;
var mw = require("src/server/auth-middleware");
var route = function () { return { status: 200, body: "admin" }; };
var h = { "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware" };
assert.equal(handle({ path: "/admin/users", headers: h }, mw, route).status, 401);`,
      },
      {
        name: "the server's own subrequest still skips (no recursion)",
        isHidden: true,
        source: `var handle = require("src/server/pipeline").handle;
var runs = 0;
var mw = { name: "middleware", run: function () { runs++; return null; } };
var route = function () { return { status: 200, body: "ok" }; };
assert.equal(handle({ path: "/", headers: { "x-middleware-subrequest": "middleware" }, internal: true }, mw, route), { status: 200, body: "ok" });
assert.equal(runs, 0, "internal subrequest skips");
handle({ path: "/", headers: {}, internal: true }, mw, route);
assert.equal(runs, 1, "internal request without the header still runs it");`,
      },
      {
        name: "the route never sees the header on an external request",
        isHidden: true,
        source: `var handle = require("src/server/pipeline").handle;
var mw = require("src/server/auth-middleware");
var route = function (req) { return { status: 200, body: JSON.stringify(req.headers) }; };
var out = handle({ path: "/", headers: { cookie: "s=1", "x-middleware-subrequest": "other" } }, mw, route);
assert.equal(out, { status: 200, body: '{"cookie":"s=1"}' });`,
      },
    ],
    fixedFiles: {
      "src/server/pipeline.js": `var HEADER = "x-middleware-subrequest";

// Runs the middleware, then the route. A subrequest lists the middleware it
// has already been through, so middleware that fetches its own app does not
// recurse forever.
// That marker is internal state: anything a client sends is attacker input.
// Honour it only on requests the server itself created, and strip it from
// everything else before middleware or the route can read it.
exports.handle = function (req, middleware, route) {
  if (req.internal !== true) delete req.headers[HEADER];
  var seen = req.internal === true ? (req.headers[HEADER] || "").split(":") : [];
  if (seen.indexOf(middleware.name) === -1) {
    var early = middleware.run(req);
    if (early) return early;
  }
  return route(req);
};
`,
    },
  },

  {
    title: "The Password Reset Sent to a Second Address",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "Validation"],
    description: `Modelled on **GitLab CVE-2023-7028**, disclosed in January 2024 with the maximum CVSS score of 10. The password-reset form's email parameter could carry **more than one address**, and GitLab sent the reset link to all of them — including an address the attacker controlled that had never been verified on the account. Supplying the victim's address alongside one's own was enough to take over the account (unless it had two-factor authentication). The bug had been introduced by a change to email handling in GitLab 16.1 in May 2023.

This reconstruction's \`reset.js\` accepts a string or an array, finds the account through any listed address, and mails every address it was given.

Fix \`requestReset\` so the link can only ever go to the account's own verified address.`,
    bugReport: `**BUG-GL7028** · Priority: Critical (account takeover) · Reported by: bug bounty

requestReset(params, users, mailer, makeToken):
- params.email must be a single string; an array, object, number or missing
  value -> { ok: false, error: "invalid_email" } and nothing is sent
- the string is matched against user.email ignoring case and surrounding
  whitespace
- if it matches a user whose emailVerified is true, send exactly ONE mail:
  mailer.send(user.email, makeToken(user.id)) — to the address stored on the
  account, never to the spelling the request used
- matched-but-unverified or unknown addresses send nothing
- every well-formed request answers { ok: true } (no account enumeration)

Observed: email[]=victim@corp.example&email[]=attacker@evil.example mails
the victim's reset token to the attacker.`,
    logs: `[reset] user=1 token issued; mailed to victim@corp.example, attacker@evil.example`,
    files: [
      {
        filePath: "src/accounts/reset.js",
        isEditable: true,
        language: "javascript",
        content: `function findByEmail(users, email) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) return users[i];
  }
  return null;
}

// Sends a password-reset link. Answers { ok: true } whether or not the
// address is known, so the endpoint cannot be used to discover accounts.
exports.requestReset = function (params, users, mailer, makeToken) {
  var emails = [].concat(params.email);
  var user = null;
  for (var i = 0; i < emails.length && !user; i++) user = findByEmail(users, emails[i]);
  if (!user) return { ok: true };
  var token = makeToken(user.id);
  emails.forEach(function (to) { mailer.send(to, token); });
  return { ok: true };
};
`,
      },
      {
        filePath: "src/accounts/fixtures.js",
        isEditable: false,
        language: "javascript",
        content: `exports.users = function () {
  return [
    { id: 1, username: "victim", email: "victim@corp.example", emailVerified: true },
    { id: 2, username: "fresh", email: "fresh@corp.example", emailVerified: false }
  ];
};

exports.mailer = function () {
  var sent = [];
  return { sent: sent, send: function (to, token) { sent.push({ to: to, token: token }); } };
};

exports.makeToken = function (id) { return "t" + id; };
`,
      },
    ],
    tests: [
      {
        name: "a normal reset goes to the account's address",
        isHidden: false,
        source: `var r = require("src/accounts/reset").requestReset;
var f = require("src/accounts/fixtures");
var mailer = f.mailer();
assert.equal(r({ email: "victim@corp.example" }, f.users(), mailer, f.makeToken), { ok: true });
assert.equal(mailer.sent, [{ to: "victim@corp.example", token: "t1" }]);`,
      },
      {
        name: "an array of addresses is refused",
        isHidden: false,
        source: `var r = require("src/accounts/reset").requestReset;
var f = require("src/accounts/fixtures");
var mailer = f.mailer();
var out = r({ email: ["victim@corp.example", "attacker@evil.example"] }, f.users(), mailer, f.makeToken);
assert.equal(out, { ok: false, error: "invalid_email" });
assert.equal(mailer.sent, [], "no token may leave");`,
      },
      {
        name: "matching ignores case and the mail uses the stored address",
        isHidden: true,
        source: `var r = require("src/accounts/reset").requestReset;
var f = require("src/accounts/fixtures");
var mailer = f.mailer();
assert.equal(r({ email: "  VICTIM@Corp.Example " }, f.users(), mailer, f.makeToken), { ok: true });
assert.equal(mailer.sent, [{ to: "victim@corp.example", token: "t1" }]);`,
      },
      {
        name: "an unverified address gets nothing",
        isHidden: true,
        source: `var r = require("src/accounts/reset").requestReset;
var f = require("src/accounts/fixtures");
var mailer = f.mailer();
assert.equal(r({ email: "fresh@corp.example" }, f.users(), mailer, f.makeToken), { ok: true });
assert.equal(mailer.sent, []);`,
      },
      {
        name: "unknown and malformed inputs",
        isHidden: true,
        source: `var r = require("src/accounts/reset").requestReset;
var f = require("src/accounts/fixtures");
var mailer = f.mailer();
assert.equal(r({ email: "nobody@corp.example" }, f.users(), mailer, f.makeToken), { ok: true });
assert.equal(r({}, f.users(), mailer, f.makeToken), { ok: false, error: "invalid_email" });
assert.equal(r({ email: { "0": "victim@corp.example" } }, f.users(), mailer, f.makeToken), { ok: false, error: "invalid_email" });
assert.equal(r({ email: ["victim@corp.example"] }, f.users(), mailer, f.makeToken), { ok: false, error: "invalid_email" });
assert.equal(mailer.sent, []);`,
      },
    ],
    fixedFiles: {
      "src/accounts/reset.js": `function findByEmail(users, email) {
  var wanted = email.trim().toLowerCase();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === wanted) return users[i];
  }
  return null;
}

// Sends a password-reset link. Answers { ok: true } whether or not the
// address is known, so the endpoint cannot be used to discover accounts.
// The request only *identifies* the account: the link goes to the verified
// address stored on it, once, never to anything the request supplied —
// accepting a list is how a second, attacker-owned address got the token.
exports.requestReset = function (params, users, mailer, makeToken) {
  if (typeof params.email !== "string") return { ok: false, error: "invalid_email" };
  var user = findByEmail(users, params.email);
  if (!user || user.emailVerified !== true) return { ok: true };
  mailer.send(user.email, makeToken(user.id));
  return { ok: true };
};
`,
    },
  },

  {
    title: "The Distribution List That Replied to Itself",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Limits", "Email", "Resilience"],
    description: `Modelled on **Microsoft's "Bedlam DL3" incident of October 1997**. A message went to an internal distribution list with a very large membership. Recipients hit **Reply All** — many of them to ask to be removed from the list, others to tell everyone to stop replying — and every reply went to the whole list again. The cascade of messages overwhelmed Microsoft's Exchange servers, and "Bedlam DL3" became the Exchange team's shorthand for a reply-all storm.

This reconstruction's \`send.js\` expands the list and delivers, every time.

Fix \`send\` so reply-all to a huge list is blocked and a repeating storm on one thread is throttled.`,
    bugReport: `**BUG-BEDLAM** · Priority: High · Reported by: messaging ops

send(msg, directory, history, now) — msg = { to, subject, replyAll }:
- recipients = lists.expand(directory, msg.to)
- msg.replyAll and recipients.length > REPLY_ALL_MAX_RECIPIENTS (limits.js)
  -> { ok: false, error: "reply_all_blocked", delivered: 0 }; exactly the
  limit is allowed; a message that is not a reply-all is never blocked by this
- storm throttle: normalise a subject by trimming, removing any number of
  leading "RE:" prefixes (any case, optional spaces) and lower-casing. If
  history already holds STORM_THRESHOLD or more entries with the same \`to\`
  and the same normalised subject whose age now - at is < STORM_WINDOW_MS
  -> { ok: false, error: "throttled", delivered: 0 }
- a refused message is not recorded
- otherwise push { to, subject: <normalised>, at: now } onto history and
  return { ok: true, error: null, delivered: recipients.length }

Observed: thousands of "RE: RE: please remove me" messages to the whole list
within minutes.`,
    logs: `[exchange] queue depth 1,204,331 (bedlam-dl3)
[exchange] RE: RE: RE: remove me -> 600 recipients
[exchange] store.exe: message rate exceeds capacity`,
    files: [
      {
        filePath: "src/mail/send.js",
        isEditable: true,
        language: "javascript",
        content: `var lists = require("./lists");

exports.send = function (msg, directory, history, now) {
  var recipients = lists.expand(directory, msg.to);
  history.push({ to: msg.to, subject: msg.subject, at: now });
  return { ok: true, error: null, delivered: recipients.length };
};
`,
      },
      {
        filePath: "src/mail/limits.js",
        isEditable: false,
        language: "javascript",
        content: `exports.REPLY_ALL_MAX_RECIPIENTS = 500;
exports.STORM_THRESHOLD = 3;
exports.STORM_WINDOW_MS = 10 * 60 * 1000;
`,
      },
      {
        filePath: "src/mail/lists.js",
        isEditable: false,
        language: "javascript",
        content: `// A distribution list expands to its member addresses.
exports.expand = function (directory, name) {
  return directory[name] ? directory[name].slice() : [];
};
`,
      },
    ],
    tests: [
      {
        name: "an ordinary message is delivered",
        isHidden: false,
        source: `var send = require("src/mail/send").send;
var dir = { team: ["a", "b", "c", "d", "e"] };
assert.equal(send({ to: "team", subject: "lunch?", replyAll: false }, dir, [], 0), { ok: true, error: null, delivered: 5 });`,
      },
      {
        name: "reply-all to a huge list is blocked",
        isHidden: false,
        source: `var send = require("src/mail/send").send;
var big = [];
for (var i = 0; i < 600; i++) big.push("user" + i);
var history = [];
assert.equal(send({ to: "bedlam-dl3", subject: "RE: remove me", replyAll: true }, { "bedlam-dl3": big }, history, 0), { ok: false, error: "reply_all_blocked", delivered: 0 });
assert.equal(history, [], "a refused message is not recorded");`,
      },
      {
        name: "the limit itself is allowed, and a first send to a big list is not a reply-all",
        isHidden: true,
        source: `var send = require("src/mail/send").send;
var five = [], six = [];
for (var i = 0; i < 500; i++) five.push("u" + i);
for (var j = 0; j < 600; j++) six.push("u" + j);
assert.equal(send({ to: "l500", subject: "x", replyAll: true }, { l500: five }, [], 0).delivered, 500);
assert.equal(send({ to: "l600", subject: "announcement", replyAll: false }, { l600: six }, [], 0).delivered, 600);`,
      },
      {
        name: "a reply storm on one thread is throttled",
        isHidden: true,
        source: `var send = require("src/mail/send").send;
var dir = { team: ["a", "b", "c"] };
var h = [];
assert.equal(send({ to: "team", subject: "Why am I on this list?", replyAll: true }, dir, h, 0).ok, true);
assert.equal(send({ to: "team", subject: "RE: Why am I on this list?", replyAll: true }, dir, h, 1000).ok, true);
assert.equal(send({ to: "team", subject: "Re: re:why am I on this list? ", replyAll: true }, dir, h, 2000).ok, true);
assert.equal(send({ to: "team", subject: "RE: RE: RE: WHY AM I ON THIS LIST?", replyAll: true }, dir, h, 3000), { ok: false, error: "throttled", delivered: 0 });
assert.equal(h.length, 3);
assert.equal(h[1].subject, "why am i on this list?");
assert.equal(send({ to: "team", subject: "different thread", replyAll: true }, dir, h, 3000).ok, true);`,
      },
      {
        name: "the storm window expires",
        isHidden: true,
        source: `var send = require("src/mail/send").send;
var dir = { team: ["a", "b"] };
var h = [];
send({ to: "team", subject: "s", replyAll: true }, dir, h, 0);
send({ to: "team", subject: "RE: s", replyAll: true }, dir, h, 1);
send({ to: "team", subject: "RE: s", replyAll: true }, dir, h, 2);
assert.equal(send({ to: "team", subject: "RE: s", replyAll: true }, dir, h, 600002).ok, true, "exactly 10 minutes old no longer counts");
assert.equal(send({ to: "other", subject: "RE: s", replyAll: true }, { other: ["z"] }, h, 3).ok, true, "another list is a different storm");`,
      },
    ],
    fixedFiles: {
      "src/mail/send.js": `var lists = require("./lists");
var limits = require("./limits");

function normalise(subject) {
  var s = subject.trim();
  while (/^re:/i.test(s)) s = s.slice(3).trim();
  return s.toLowerCase();
}

// Every reply-all to a list multiplies by the list's size, and each reply
// provokes more: the load grows with members x replies. Block reply-all to
// very large lists outright, and throttle a thread that keeps coming back.
exports.send = function (msg, directory, history, now) {
  var recipients = lists.expand(directory, msg.to);
  if (msg.replyAll && recipients.length > limits.REPLY_ALL_MAX_RECIPIENTS) {
    return { ok: false, error: "reply_all_blocked", delivered: 0 };
  }
  var subject = normalise(msg.subject);
  var recent = history.filter(function (h) {
    return h.to === msg.to && h.subject === subject && now - h.at < limits.STORM_WINDOW_MS;
  });
  if (recent.length >= limits.STORM_THRESHOLD) {
    return { ok: false, error: "throttled", delivered: 0 };
  }
  history.push({ to: msg.to, subject: subject, at: now });
  return { ok: true, error: null, delivered: recipients.length };
};
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE21_ORIGINS: Record<string, string> = {
  "Every Region in One Flight": "Microsoft Azure · 2014",
  "The Signature Made of Zeros": "Java · CVE-2022-21449",
  "The Defaults That Reached Every Object": "lodash · CVE-2019-10744",
  "Five Countries Missing From the Average": "Reinhart–Rogoff · 2013",
  "The Tweet ID JavaScript Rounded Off": "Twitter · 2010",
  "The Missing Torque Calibration": "Airbus A400M · 2015",
  "The Files Deleted Years Ago Came Back": "Dropbox · 2017",
  "The Canary That Failed and Was Overruled": "Google Compute Engine · 2016",
  "The Hash That Started With a Zero Byte": "Nintendo Wii · Trucha bug 2008",
  "Two Waypoints, One Name": "NATS · 2023",
  "The Cleanup Job That Ran Against Production": "AWS ELB · 2012",
  "Posting on Anyone's Timeline": "Facebook · 2013",
  "The Internal Header Anyone Could Send": "Next.js · CVE-2025-29927",
  "The Password Reset Sent to a Second Address": "GitLab · CVE-2023-7028",
  "The Distribution List That Replied to Itself": "Microsoft · Bedlam DL3 1997",
};
