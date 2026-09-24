/**
 * Wave 20 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE20: BugSpec[] = [

  {
    title: "Twenty Thousand Spaces on the Home Page",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Performance", "Regex"],
    description: `Modelled on the **Stack Overflow outage of 20 July 2016**. A post containing roughly 20,000 consecutive whitespace characters reached the home page, where a regular expression trimmed trailing whitespace from each post. Because the pattern was only anchored at the *end*, the engine tried every starting position inside the run and scanned forward to the next non-space each time, turning a trim into quadratic work. The web servers pinned their CPUs and the site went down for about half an hour; the fix replaced the regex with a simple backwards scan.

\`trim.js\` is a reconstruction of that matcher's behaviour, written out as a loop so every character examined is counted by the renderer's cursor.

Rewrite \`trimTrailing\` so it does linear work while returning exactly the same text.`,
    bugReport: `**BUG-SO-0720** · Priority: Critical (site down) · Reported by: SRE on call

trimTrailing(cursor) returns the post text with trailing whitespace removed.
- whitespace is exactly what whitespace.isWhitespace accepts (space, tab,
  LF, CR, U+200C); everything before the trailing run is kept byte for byte,
  including whitespace in the middle of the post
- an empty or all-whitespace post returns ""
- characters may only be examined through cursor.charAt(i), and a call must
  examine at most text.length + 1 characters, whatever the input

Observed: a post with a long run of spaces followed by one more character
makes the call examine millions of characters; the home page times out.`,
    logs: `[web-11] GET / 200 34812ms  cpu=100%
[web-11] render summary post=38189021 cursor.reads=199990000
[lb] health check failed: web-01..web-11 (timeout)`,
    files: [
      {
        filePath: "src/render/trim.js",
        isEditable: true,
        language: "javascript",
        content: `var isWhitespace = require("./whitespace").isWhitespace;

// Strips trailing whitespace from a post summary before it is rendered.
exports.trimTrailing = function (cursor) {
  var n = cursor.length;
  for (var start = 0; start < n; start++) {
    if (!isWhitespace(cursor.charAt(start))) continue;
    var j = start;
    while (j < n && isWhitespace(cursor.charAt(j))) j++;
    if (j === n) return cursor.slice(0, start);
  }
  return cursor.slice(0, n);
};
`,
      },
      {
        filePath: "src/render/whitespace.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The set the renderer has always trimmed: space, tab, line feed, carriage
return and U+200C (zero-width non-joiner).
*/
var CODES = [32, 9, 10, 13, 0x200c];

exports.isWhitespace = function (ch) {
  return CODES.indexOf(ch.charCodeAt(0)) !== -1;
};
`,
      },
      {
        filePath: "src/render/cursor.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A cursor wraps a post body for the renderer. Every character examined goes
through charAt(i), which counts the read; slice() is free. Rendering budgets
are expressed in reads.
*/
exports.create = function (text) {
  var cursor = {
    length: text.length,
    reads: 0,
    charAt: function (i) {
      cursor.reads++;
      return text.charAt(i);
    },
    slice: function (from, to) {
      return text.slice(from, to);
    }
  };
  return cursor;
};
`,
      },
    ],
    tests: [
      {
        name: "ordinary summaries lose only their trailing whitespace",
        isHidden: false,
        source: `var trim = require("src/render/trim").trimTrailing;
var cursor = require("src/render/cursor");
assert.equal(trim(cursor.create("Hello  world   ")), "Hello  world");
assert.equal(trim(cursor.create("no trailing")), "no trailing");
assert.equal(trim(cursor.create("")), "");`,
      },
      {
        name: "a long whitespace run inside a post stays within budget",
        isHidden: false,
        source: `var trim = require("src/render/trim").trimTrailing;
var cursor = require("src/render/cursor");
var text = "post" + " ".repeat(5000) + "x";
var c = cursor.create(text);
assert.equal(trim(c), text);
assert.ok(c.reads <= text.length + 1, "examined " + c.reads + " characters for a " + text.length + "-character post");`,
      },
      {
        name: "an all-whitespace post trims to nothing within budget",
        isHidden: true,
        source: `var trim = require("src/render/trim").trimTrailing;
var cursor = require("src/render/cursor");
var text = " ".repeat(5000);
var c = cursor.create(text);
assert.equal(trim(c), "");
assert.ok(c.reads <= text.length + 1, "examined " + c.reads);`,
      },
      {
        name: "tabs and zero-width non-joiners are trimmed too",
        isHidden: true,
        source: `var trim = require("src/render/trim").trimTrailing;
var cursor = require("src/render/cursor");
var tail = String.fromCharCode(0x200c, 9, 32, 13, 10);
assert.equal(trim(cursor.create("done" + tail)), "done");
assert.equal(trim(cursor.create("a" + String.fromCharCode(9) + "b" + tail)), "a" + String.fromCharCode(9) + "b");`,
      },
      {
        name: "many medium runs still cost linear work",
        isHidden: true,
        source: `var trim = require("src/render/trim").trimTrailing;
var cursor = require("src/render/cursor");
var body = "";
for (var i = 0; i < 100; i++) body += "a" + " ".repeat(50);
var c = cursor.create(body + "end   ");
assert.equal(trim(c), body + "end");
assert.ok(c.reads <= body.length + 7, "examined " + c.reads);`,
      },
    ],
    fixedFiles: {
      "src/render/trim.js": `var isWhitespace = require("./whitespace").isWhitespace;

// Strips trailing whitespace from a post summary before it is rendered.
exports.trimTrailing = function (cursor) {
  // Walk back from the end instead of trying every start position: an
  // end-anchored match retried from each index inside a long run is
  // quadratic, and one 20,000-space post was enough to pin every web server.
  var end = cursor.length;
  while (end > 0 && isWhitespace(cursor.charAt(end - 1))) end--;
  return cursor.slice(0, end);
};
`,
    },
  },

  {
    title: "The Empty Argument List That Became Root",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Bounds"],
    description: `Modelled on **PwnKit** (CVE-2021-4034, disclosed by Qualys in January 2022). polkit's \`pkexec\` assumed it was always started with at least one argument. Started with an *empty* argv, its option loop was skipped, it read \`argv[1]\` anyway — which on Linux is the first environment variable, laid out right after argv — and later wrote the resolved program path back into that slot. That out-of-bounds read and write let a local user smuggle an environment variable past pkexec's sanitising and gain root. The bug had been present since 2009; the fix makes pkexec refuse to run when argc is 0.

\`process.py\` models the kernel's layout as one array (argv, a terminator, then envp) with unchecked indexing, like C. \`pkexec.py\` resolves the program to run.

Fix \`resolve\` so it never reads or writes outside argv.`,
    bugReport: `**BUG-PWNKIT** · Priority: Critical (local root) · Reported by: security

resolve(frame, lookup) returns {"program": path, "args": [...]}:
- argv[0] is pkexec itself; options start at argv[1] and are the arguments
  beginning with "--"; the first argument that is not an option is the program
- a program without a leading "/" is resolved with lookup(name) and the
  resolved path is written back into its argv slot
- "args" are the arguments after the program
- if frame.argc < 1, raise ValueError before touching anything
- if there is no program (only pkexec and options), raise ValueError
- nothing outside argv (indexes 0 .. argc-1) may ever be read or written

Observed: with an empty argv, resolve reads the first environment variable
as if it were the program and overwrites it with a "resolved" path.`,
    logs: `pkexec: argc=0 argv[1]="LANG=C"
pkexec: resolved program "/usr/bin/LANG=C" written to argv[1]
audit: environment of setuid process modified after sanitising`,
    files: [
      {
        filePath: "src/polkit/pkexec.py",
        isEditable: true,
        language: "python",
        content: `# Resolves the program pkexec was asked to run.

def resolve(frame, lookup):
    n = 1
    while n < frame.argc:
        if frame.argv(n).startswith("--"):
            n += 1
            continue
        break
    path = frame.argv(n)
    if not path.startswith("/"):
        path = lookup(path)
        frame.set_argv(n, path)
    args = [frame.argv(i) for i in range(n + 1, frame.argc)]
    return {"program": path, "args": args}
`,
      },
      {
        filePath: "src/polkit/process.py",
        isEditable: false,
        language: "python",
        content: `# The stack a setuid program receives from the kernel: argv entries, a None
# terminator, then envp entries and another None - one contiguous array, as in
# C. argv(i) and set_argv(i) index that array with no bounds check, exactly
# like argv[i] does.

class Frame:
    def __init__(self, argv, envp):
        self.argc = len(argv)
        self.memory = list(argv) + [None] + list(envp) + [None]

    def argv(self, i):
        return self.memory[i]

    def set_argv(self, i, value):
        self.memory[i] = value

    def environ(self):
        return [v for v in self.memory[self.argc + 1:] if v is not None]
`,
      },
    ],
    tests: [
      {
        name: "a program name is resolved through the lookup",
        isHidden: false,
        source: `proc = bug_require("src/polkit/process.py")
pk = bug_require("src/polkit/pkexec.py")
f = proc.Frame(["pkexec", "ls", "-l"], ["HOME=/home/kai"])
assert_.equal(pk.resolve(f, lambda name: "/usr/bin/" + name), {"program": "/usr/bin/ls", "args": ["-l"]})
assert_.equal(f.argv(1), "/usr/bin/ls", "the resolved path is written back into argv")`,
      },
      {
        name: "an empty argv is refused with ValueError",
        isHidden: false,
        source: `proc = bug_require("src/polkit/process.py")
pk = bug_require("src/polkit/pkexec.py")
f = proc.Frame([], ["HOME=/home/kai", "LANG=C"])
try:
    pk.resolve(f, lambda name: "/usr/bin/" + name)
    raised = None
except Exception as e:
    raised = type(e).__name__
assert_.equal(raised, "ValueError", "argc == 0 must be refused")`,
      },
      {
        name: "the environment is untouched after a refused call",
        isHidden: true,
        source: `proc = bug_require("src/polkit/process.py")
pk = bug_require("src/polkit/pkexec.py")
f = proc.Frame([], ["HOME=/home/kai", "LANG=C"])
try:
    pk.resolve(f, lambda name: "/usr/bin/" + name)
except Exception:
    pass
assert_.equal(f.environ(), ["HOME=/home/kai", "LANG=C"])`,
      },
      {
        name: "pkexec with no program raises ValueError",
        isHidden: true,
        source: `proc = bug_require("src/polkit/process.py")
pk = bug_require("src/polkit/pkexec.py")
for argv in (["pkexec"], ["pkexec", "--disable-internal-agent"]):
    f = proc.Frame(argv, ["LANG=C"])
    try:
        pk.resolve(f, lambda name: "/usr/bin/" + name)
        raised = None
    except Exception as e:
        raised = type(e).__name__
    assert_.equal(raised, "ValueError", str(argv))
    assert_.equal(f.environ(), ["LANG=C"])`,
      },
      {
        name: "options are skipped and absolute paths used as given",
        isHidden: true,
        source: `proc = bug_require("src/polkit/process.py")
pk = bug_require("src/polkit/pkexec.py")
def lookup(name):
    raise AssertionError("an absolute path needs no lookup")
f = proc.Frame(["pkexec", "--disable-internal-agent", "/bin/id", "-u"], [])
assert_.equal(pk.resolve(f, lookup), {"program": "/bin/id", "args": ["-u"]})`,
      },
    ],
    fixedFiles: {
      "src/polkit/pkexec.py": `# Resolves the program pkexec was asked to run.

def resolve(frame, lookup):
    # argc can be 0: execve() accepts an empty argv. Without this check the
    # loop below is skipped, n stays 1, and argv[1] is the first environment
    # variable - read, then overwritten, after the environment was sanitised.
    if frame.argc < 1:
        raise ValueError("pkexec needs at least argv[0]")
    n = 1
    while n < frame.argc:
        if frame.argv(n).startswith("--"):
            n += 1
            continue
        break
    # Only options (or nothing) after argv[0]: there is no program slot to
    # read, and argv[n] would again be past the end of argv.
    if n >= frame.argc:
        raise ValueError("no program to run")
    path = frame.argv(n)
    if not path.startswith("/"):
        path = lookup(path)
        frame.set_argv(n, path)
    args = [frame.argv(i) for i in range(n + 1, frame.argc)]
    return {"program": path, "args": args}
`,
    },
  },

  {
    title: "The Root That Brought Its Own Generator",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Security", "Validation"],
    description: `Modelled on **"Curveball"** (CVE-2020-0601, patched by Microsoft in January 2020 after a report from the NSA). Windows' CryptoAPI accepted elliptic-curve certificates that spell out their curve parameters explicitly. When checking whether a certificate was a trusted root, it matched on the **public key** but did not check that the curve parameters — in particular the generator point — were the standard ones. An attacker could keep a trusted root's public key, pick a different generator for which they knew the matching private key, and have their forged "root" trusted for TLS and code signing.

\`ChainValidator.java\` decides whether a certificate is one of the trusted roots. Curves can be named (resolved through \`Curves.named\`) or given explicitly.

Fix \`isTrustedRoot\` so a match requires the same public key **on the same curve**.`,
    bugReport: `**BUG-CURVEBALL** · Priority: Critical (signature spoofing) · Reported by: security

ChainValidator.isTrustedRoot(cert, store) is true only when some root in
store.roots has:
- the same public key point (qx, qy), AND
- identical domain parameters: p, a, b, gx, gy and n all equal
A key's parameters are key.explicit when present, otherwise
Curves.named(key.curveName). A curve that resolves to nothing (unknown name,
no name and no parameters) never matches. Explicitly spelled-out parameters
equal to a named curve's values count as that curve.

Observed: a certificate carrying a trusted root's public key with its own
explicit generator is accepted as that root.`,
    logs: `[chain] leaf "update.example" -> root "Trusted Root CA" (explicit params, gx=555 gy=777)
[chain] root matched by public key -> TRUSTED`,
    files: [
      {
        filePath: "src/crypto/ChainValidator.java",
        isEditable: true,
        language: "java",
        content: `class ChainValidator {
    // A certificate is anchored when it is one of the trusted roots.
    static boolean isTrustedRoot(Certificate cert, RootStore store) {
        for (Certificate root : store.roots) {
            if (root.key.qx == cert.key.qx && root.key.qy == cert.key.qy) {
                return true;
            }
        }
        return false;
    }
}`,
      },
      {
        filePath: "src/crypto/EcParams.java",
        isEditable: false,
        language: "java",
        content: `// Elliptic-curve domain parameters (toy sizes): the field prime p, the
// curve coefficients a and b, the generator point (gx, gy) and its order n.
class EcParams {
    final long p, a, b, gx, gy, n;

    EcParams(long p, long a, long b, long gx, long gy, long n) {
        this.p = p; this.a = a; this.b = b;
        this.gx = gx; this.gy = gy; this.n = n;
    }
}

// The named curves this build understands; any other name is unknown (null).
class Curves {
    static final EcParams P256 = new EcParams(1009L, 2L, 3L, 101L, 202L, 997L);
    static final EcParams P384 = new EcParams(2003L, 5L, 7L, 303L, 404L, 1999L);

    static EcParams named(String name) {
        if ("P-256".equals(name)) return P256;
        if ("P-384".equals(name)) return P384;
        return null;
    }
}`,
      },
      {
        filePath: "src/crypto/Certificate.java",
        isEditable: false,
        language: "java",
        content: `// A public key names its curve OR carries explicit parameters.
class EcPublicKey {
    final String curveName;   // e.g. "P-256", or null
    final EcParams explicit;  // explicit parameters, or null
    final long qx, qy;        // the public point

    EcPublicKey(String curveName, EcParams explicit, long qx, long qy) {
        this.curveName = curveName;
        this.explicit = explicit;
        this.qx = qx;
        this.qy = qy;
    }
}

class Certificate {
    final String subject;
    final EcPublicKey key;

    Certificate(String subject, EcPublicKey key) {
        this.subject = subject;
        this.key = key;
    }
}

class RootStore {
    final List<Certificate> roots = new ArrayList<>();

    void add(Certificate root) {
        roots.add(root);
    }
}`,
      },
    ],
    tests: [
      {
        name: "the genuine root is trusted",
        isHidden: false,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                Certificate cert = new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L));
                BugAssert.ok(ChainValidator.isTrustedRoot(cert, store), "the real root");`,
      },
      {
        name: "a root's key with a substituted generator is not trusted",
        isHidden: false,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                EcParams forged = new EcParams(1009L, 2L, 3L, 555L, 777L, 997L);
                Certificate cert = new Certificate("Trusted Root CA", new EcPublicKey(null, forged, 555L, 777L));
                BugAssert.ok(!ChainValidator.isTrustedRoot(cert, store), "same key, attacker-chosen generator");`,
      },
      {
        name: "explicit parameters equal to the named curve still match",
        isHidden: true,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                EcParams spelled = new EcParams(1009L, 2L, 3L, 101L, 202L, 997L);
                Certificate cert = new Certificate("Trusted Root CA", new EcPublicKey(null, spelled, 555L, 777L));
                BugAssert.ok(ChainValidator.isTrustedRoot(cert, store), "P-256 written out in full");`,
      },
      {
        name: "the same point on a different named curve is not trusted",
        isHidden: true,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                Certificate cert = new Certificate("Trusted Root CA", new EcPublicKey("P-384", null, 555L, 777L));
                BugAssert.ok(!ChainValidator.isTrustedRoot(cert, store), "P-384");`,
      },
      {
        name: "any single differing parameter breaks the match",
        isHidden: true,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                EcParams otherPrime = new EcParams(1013L, 2L, 3L, 101L, 202L, 997L);
                EcParams otherOrder = new EcParams(1009L, 2L, 3L, 101L, 202L, 991L);
                BugAssert.ok(!ChainValidator.isTrustedRoot(new Certificate("x", new EcPublicKey(null, otherPrime, 555L, 777L)), store), "p differs");
                BugAssert.ok(!ChainValidator.isTrustedRoot(new Certificate("x", new EcPublicKey(null, otherOrder, 555L, 777L)), store), "n differs");`,
      },
      {
        name: "unknown curves and different keys never match",
        isHidden: true,
        source: `                RootStore store = new RootStore();
                store.add(new Certificate("Trusted Root CA", new EcPublicKey("P-256", null, 555L, 777L)));
                BugAssert.ok(!ChainValidator.isTrustedRoot(new Certificate("x", new EcPublicKey("brainpool-x", null, 555L, 777L)), store), "unknown name");
                BugAssert.ok(!ChainValidator.isTrustedRoot(new Certificate("x", new EcPublicKey(null, null, 555L, 777L)), store), "no curve at all");
                BugAssert.ok(!ChainValidator.isTrustedRoot(new Certificate("x", new EcPublicKey("P-256", null, 556L, 777L)), store), "different key");`,
      },
    ],
    fixedFiles: {
      "src/crypto/ChainValidator.java": `class ChainValidator {
    static EcParams resolve(EcPublicKey key) {
        if (key.explicit != null) return key.explicit;
        return key.curveName == null ? null : Curves.named(key.curveName);
    }

    static boolean sameParams(EcParams x, EcParams y) {
        return x.p == y.p && x.a == y.a && x.b == y.b
            && x.gx == y.gx && x.gy == y.gy && x.n == y.n;
    }

    // A certificate is anchored when it is one of the trusted roots.
    static boolean isTrustedRoot(Certificate cert, RootStore store) {
        // A public key only means something together with its curve: with
        // explicit parameters an attacker can keep a root's point and choose
        // a generator whose private key they know. Match the whole curve.
        EcParams mine = resolve(cert.key);
        if (mine == null) return false;
        for (Certificate root : store.roots) {
            EcParams theirs = resolve(root.key);
            if (theirs == null) continue;
            if (root.key.qx == cert.key.qx && root.key.qy == cert.key.qy && sameParams(mine, theirs)) {
                return true;
            }
        }
        return false;
    }
}`,
    },
  },

  {
    title: "The Payment Method Called Nothing",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Payments", "Validation"],
    description: `Modelled on the **Uber free-rides bug** that security researcher Anand Prakash disclosed in 2017 after reporting it through Uber's bug bounty programme. By setting the payment method on a ride request to an invalid value, he could take rides that were never charged. The request was accepted and the car dispatched; the payment method was only exercised at the end of the trip, when it could no longer be charged. Uber fixed it after the report.

\`dispatch.js\` is a reconstruction: \`requestRide\` dispatches a car for any payment method id, and \`completeRide\` records the charge failure and completes the trip anyway.

Fix \`requestRide\` so an unchargeable payment method is refused before a car is dispatched.`,
    bugReport: `**BUG-RIDE-FREE** · Priority: Critical (revenue) · Reported by: bug bounty

requestRide(account, request, trips):
- look up account.paymentMethods[request.paymentMethodId]
- if payments.isChargeable(method) is false (missing id, unknown id,
  unsupported type, unverified method), return
  { ok: false, error: "invalid_payment_method" } and push NO trip
- otherwise push and return { ok: true, trip } with the trip as today
  (id "trip-<n>", status "dispatched")
completeRide charges the fare to the ledger exactly once for a valid trip.

Observed: a request with paymentMethodId pointing at type "xyz" is
dispatched and completed; the ledger has no charge for it.`,
    logs: `[dispatch] trip-8812 dispatched rider=rider-7 payment=pm_x
[billing] trip-8812 charge failed: payment method cannot be charged
[billing] trip-8812 completed fare=1250 collected=0`,
    files: [
      {
        filePath: "src/rides/dispatch.js",
        isEditable: true,
        language: "javascript",
        content: `var payments = require("./payments");

exports.requestRide = function (account, request, trips) {
  var trip = {
    id: "trip-" + (trips.length + 1),
    rider: account.id,
    paymentMethodId: request.paymentMethodId,
    fare: request.fare,
    status: "dispatched"
  };
  trips.push(trip);
  return { ok: true, trip: trip };
};

exports.completeRide = function (account, trip, ledger) {
  var method = account.paymentMethods[trip.paymentMethodId];
  try {
    payments.charge(method, trip.fare, ledger);
  } catch (e) {
    trip.chargeError = e.message;
  }
  trip.status = "completed";
  return trip;
};
`,
      },
      {
        filePath: "src/rides/payments.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Payment methods live on the account, keyed by id:
  account.paymentMethods = { pm_1: { id: "pm_1", type: "card", verified: true } }
Only the types in SUPPORTED can be charged, and only once verified.
*/
var SUPPORTED = ["card", "wallet"];
exports.SUPPORTED = SUPPORTED;

exports.isChargeable = function (method) {
  return !!method && SUPPORTED.indexOf(method.type) !== -1 && method.verified === true;
};

exports.charge = function (method, amount, ledger) {
  if (!exports.isChargeable(method)) throw new Error("payment method cannot be charged");
  ledger.push({ method: method.id, amount: amount });
};
`,
      },
    ],
    tests: [
      {
        name: "a ride on a verified card is dispatched and charged",
        isHidden: false,
        source: `var d = require("src/rides/dispatch");
var account = { id: "rider-7", paymentMethods: { pm_card: { id: "pm_card", type: "card", verified: true } } };
var trips = [], ledger = [];
var r = d.requestRide(account, { paymentMethodId: "pm_card", fare: 1250 }, trips);
assert.equal(r.ok, true);
assert.equal(r.trip.status, "dispatched");
d.completeRide(account, r.trip, ledger);
assert.equal(ledger, [{ method: "pm_card", amount: 1250 }]);`,
      },
      {
        name: "an unsupported payment type is refused before dispatch",
        isHidden: false,
        source: `var d = require("src/rides/dispatch");
var account = { id: "rider-7", paymentMethods: { pm_x: { id: "pm_x", type: "xyz", verified: true } } };
var trips = [];
assert.equal(d.requestRide(account, { paymentMethodId: "pm_x", fare: 1250 }, trips), { ok: false, error: "invalid_payment_method" });
assert.equal(trips.length, 0, "no car may be dispatched");`,
      },
      {
        name: "unknown and missing payment method ids are refused",
        isHidden: true,
        source: `var d = require("src/rides/dispatch");
var account = { id: "rider-7", paymentMethods: { pm_card: { id: "pm_card", type: "card", verified: true } } };
var trips = [];
assert.equal(d.requestRide(account, { paymentMethodId: "pm_missing", fare: 900 }, trips), { ok: false, error: "invalid_payment_method" });
assert.equal(d.requestRide(account, { fare: 900 }, trips), { ok: false, error: "invalid_payment_method" });
assert.equal(trips.length, 0);`,
      },
      {
        name: "an unverified card is refused",
        isHidden: true,
        source: `var d = require("src/rides/dispatch");
var account = { id: "rider-7", paymentMethods: { pm_new: { id: "pm_new", type: "card", verified: false } } };
var trips = [];
assert.equal(d.requestRide(account, { paymentMethodId: "pm_new", fare: 900 }, trips), { ok: false, error: "invalid_payment_method" });
assert.equal(trips.length, 0);`,
      },
      {
        name: "a verified wallet is accepted and numbered",
        isHidden: true,
        source: `var d = require("src/rides/dispatch");
var account = { id: "rider-9", paymentMethods: { pm_w: { id: "pm_w", type: "wallet", verified: true } } };
var trips = [{ id: "trip-1" }];
var r = d.requestRide(account, { paymentMethodId: "pm_w", fare: 400 }, trips);
assert.equal(r.ok, true);
assert.equal(r.trip.id, "trip-2");
assert.equal(trips.length, 2);`,
      },
    ],
    fixedFiles: {
      "src/rides/dispatch.js": `var payments = require("./payments");

exports.requestRide = function (account, request, trips) {
  // Validate the payment method before a car moves. Charging only at the end
  // of the trip meant an invalid method surfaced after the service had been
  // delivered, and the ride was simply free.
  var method = account.paymentMethods[request.paymentMethodId];
  if (!payments.isChargeable(method)) {
    return { ok: false, error: "invalid_payment_method" };
  }
  var trip = {
    id: "trip-" + (trips.length + 1),
    rider: account.id,
    paymentMethodId: request.paymentMethodId,
    fare: request.fare,
    status: "dispatched"
  };
  trips.push(trip);
  return { ok: true, trip: trip };
};

exports.completeRide = function (account, trip, ledger) {
  var method = account.paymentMethods[trip.paymentMethodId];
  try {
    payments.charge(method, trip.fare, ledger);
  } catch (e) {
    trip.chargeError = e.message;
  }
  trip.status = "completed";
  return trip;
};
`,
    },
  },

  {
    title: "Four Years and a Day Off",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Dates", "Configuration"],
    description: `Modelled on the **1900 and 1904 date systems in Microsoft Excel**. Excel stores a date as a serial day number from a workbook-wide epoch: Excel for Windows uses the 1900 system, while older Excel for Mac workbooks default to the 1904 system. Microsoft's own documentation warns that copying dates between workbooks that use different systems shifts them by **four years and one day** (1,462 days), because the serial is pasted unchanged and reinterpreted against the other epoch.

\`paste.js\` is the clipboard handler of a spreadsheet web app that supports both systems.

Fix \`pasteCells\` so a pasted date shows the same calendar date in the target workbook.`,
    bugReport: `**BUG-XL-1462** · Priority: High · Reported by: finance team (Mac + Windows)

pasteCells(cells, sourceSystem, targetSystem) returns new cells:
- a "date" cell pasted from the "1900" system into a "1904" workbook has its
  serial reduced by dateSystems.SYSTEM_OFFSET_DAYS (1462); the reverse
  direction adds it; the same system on both sides leaves it alone
- "number" and "text" cells are never changed
- the input array and its cells are not modified
After a paste, dateSystems.toIso(value, targetSystem) must equal
dateSystems.toIso(original, sourceSystem).

Observed: invoice dates pasted from a Windows workbook into a Mac one show
up four years and one day later.`,
    logs: `[clipboard] paste 12 cells source=1900 target=1904
[render] A2 serial=45000 -> 2027-03-16 (source showed 2023-03-15)`,
    files: [
      {
        filePath: "src/sheet/paste.js",
        isEditable: true,
        language: "javascript",
        content: `// Pastes clipboard cells into the target workbook.
// cell: { kind: "date" | "number" | "text", value }
exports.pasteCells = function (cells, sourceSystem, targetSystem) {
  return cells.map(function (cell) {
    return { kind: cell.kind, value: cell.value };
  });
};
`,
      },
      {
        filePath: "src/sheet/dateSystems.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Spreadsheet dates are serial day numbers counted from a workbook-wide epoch.
  "1900" (Windows default): serial 1 is 1900-01-01; serial 60 is the
         fictitious 1900-02-29 kept for Lotus 1-2-3 compatibility.
  "1904" (older Mac default): serial 0 is 1904-01-01.
For any date after 1900-02-28 the serials differ by exactly
SYSTEM_OFFSET_DAYS: serial1900 = serial1904 + 1462.
*/
exports.SYSTEM_OFFSET_DAYS = 1462;

var DAY_MS = 86400000;

exports.toIso = function (serial, system) {
  var base = system === "1904" ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  return new Date(base + serial * DAY_MS).toISOString().slice(0, 10);
};
`,
      },
    ],
    tests: [
      {
        name: "a paste within the same date system is unchanged",
        isHidden: false,
        source: `var paste = require("src/sheet/paste").pasteCells;
var cells = [{ kind: "date", value: 45000 }, { kind: "text", value: "INV-7" }];
assert.equal(paste(cells, "1900", "1900"), cells);
assert.equal(paste(cells, "1904", "1904"), cells);`,
      },
      {
        name: "a Windows date pasted into a Mac workbook keeps its calendar date",
        isHidden: false,
        source: `var paste = require("src/sheet/paste").pasteCells;
var ds = require("src/sheet/dateSystems");
var out = paste([{ kind: "date", value: 45000 }], "1900", "1904");
assert.equal(out, [{ kind: "date", value: 43538 }]);
assert.equal(ds.toIso(out[0].value, "1904"), "2023-03-15");`,
      },
      {
        name: "a Mac date pasted into a Windows workbook keeps its calendar date",
        isHidden: true,
        source: `var paste = require("src/sheet/paste").pasteCells;
var ds = require("src/sheet/dateSystems");
var out = paste([{ kind: "date", value: 43538 }], "1904", "1900");
assert.equal(out, [{ kind: "date", value: 45000 }]);
assert.equal(ds.toIso(out[0].value, "1900"), ds.toIso(43538, "1904"));`,
      },
      {
        name: "numbers and text are never shifted",
        isHidden: true,
        source: `var paste = require("src/sheet/paste").pasteCells;
var cells = [{ kind: "number", value: 45000 }, { kind: "text", value: "45000" }, { kind: "date", value: 40000 }];
assert.equal(paste(cells, "1900", "1904"), [{ kind: "number", value: 45000 }, { kind: "text", value: "45000" }, { kind: "date", value: 38538 }]);`,
      },
      {
        name: "the clipboard cells are not modified",
        isHidden: true,
        source: `var paste = require("src/sheet/paste").pasteCells;
var cells = [{ kind: "date", value: 45000 }];
paste(cells, "1900", "1904");
assert.equal(cells, [{ kind: "date", value: 45000 }]);`,
      },
    ],
    fixedFiles: {
      "src/sheet/paste.js": `var dateSystems = require("./dateSystems");

// Pastes clipboard cells into the target workbook.
// cell: { kind: "date" | "number" | "text", value }
exports.pasteCells = function (cells, sourceSystem, targetSystem) {
  // A serial only means a date relative to its workbook's epoch. Pasting it
  // unchanged across systems re-reads it against the other epoch: 1,462 days
  // (four years and a day) off. Rebase date cells onto the target epoch.
  var delta = 0;
  if (sourceSystem === "1900" && targetSystem === "1904") delta = -dateSystems.SYSTEM_OFFSET_DAYS;
  if (sourceSystem === "1904" && targetSystem === "1900") delta = dateSystems.SYSTEM_OFFSET_DAYS;
  return cells.map(function (cell) {
    var value = cell.kind === "date" ? cell.value + delta : cell.value;
    return { kind: cell.kind, value: value };
  });
};
`,
    },
  },

  {
    title: "Pounds Where Kilograms Should Be",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Units", "Math"],
    description: `Modelled on **Air Canada Flight 143, the "Gimli Glider"** (23 July 1983). The Boeing 767's fuel gauges were inoperative, so the fuel on board was measured with drip sticks in litres and converted by hand. The conversion used **1.77** — the density of jet fuel in *pounds* per litre — where the new metric aircraft needed about **0.8** *kilograms* per litre. The crew believed they had more than twice the fuel they actually carried; the aircraft ran dry in flight and glided to a landing on a former air-force runway at Gimli, Manitoba. Everyone on board survived.

\`fuel.py\` is the fuel sheet: it converts a drip-stick reading into mass and works out how many litres to uplift. Every mass on the sheet is in kilograms.

Fix the conversions.`,
    bugReport: `**BUG-FUEL-143** · Priority: Critical (safety) · Reported by: line maintenance

- mass_on_board_kg(litres) = litres * units.KG_PER_LITRE
- litres_to_uplift(dipstick_litres, required_kg):
    shortfall_kg = required_kg - mass_on_board_kg(dipstick_litres)
    0 when shortfall_kg <= 0, otherwise shortfall_kg / KG_PER_LITRE
    rounded to the nearest whole litre (an int)
All masses are kilograms; the pounds factor has no place on this sheet.

Observed: 1,000 litres are booked as 1,770 kg of fuel, and the uplift comes
out at less than half of what the aircraft needs.`,
    logs: `[fuel-sheet] dipstick=7682 L -> on board 13597 kg (factor 1.77)
[fuel-sheet] required 22300 kg -> uplift 4917 L
[fdr] FUEL QTY LOW both tanks, FL410`,
    files: [
      {
        filePath: "src/fuel/fuel.py",
        isEditable: true,
        language: "python",
        content: `units = bug_require("./units.py")


def mass_on_board_kg(litres):
    return litres * units.LB_PER_LITRE


def litres_to_uplift(dipstick_litres, required_kg):
    shortfall_kg = required_kg - mass_on_board_kg(dipstick_litres)
    if shortfall_kg <= 0:
        return 0
    return int(round(shortfall_kg / units.LB_PER_LITRE))
`,
      },
      {
        filePath: "src/fuel/units.py",
        isEditable: false,
        language: "python",
        content: `# Conversion factors for jet fuel on the fuel sheet. This fleet's fuel
# figures - required fuel, burn, reserves - are all in KILOGRAMS.
KG_PER_LITRE = 0.8
LB_PER_LITRE = 1.77   # the imperial fleets' factor: pounds, not kilograms
`,
      },
    ],
    tests: [
      {
        name: "no uplift when the tanks already hold enough",
        isHidden: false,
        source: `fuel = bug_require("src/fuel/fuel.py")
assert_.equal(fuel.litres_to_uplift(30000, 22300), 0)`,
      },
      {
        name: "litres convert to kilograms",
        isHidden: false,
        source: `fuel = bug_require("src/fuel/fuel.py")
kg = fuel.mass_on_board_kg(1000)
assert_.ok(abs(kg - 800) < 1e-6, "1000 L should be 800 kg, got " + str(kg))`,
      },
      {
        name: "the flight 143 uplift is computed in kilograms",
        isHidden: true,
        source: `fuel = bug_require("src/fuel/fuel.py")
assert_.equal(fuel.litres_to_uplift(7682, 22300), 20193)`,
      },
      {
        name: "after the uplift the aircraft carries the required mass",
        isHidden: true,
        source: `fuel = bug_require("src/fuel/fuel.py")
for dip, req in ((7682, 22300), (5000, 12000), (100, 900)):
    up = fuel.litres_to_uplift(dip, req)
    assert_.ok(isinstance(up, int), "uplift must be whole litres")
    total = fuel.mass_on_board_kg(dip + up)
    assert_.ok(abs(total - req) <= 0.8, "total %.1f kg vs required %d kg" % (total, req))`,
      },
    ],
    fixedFiles: {
      "src/fuel/fuel.py": `units = bug_require("./units.py")

# Every mass on this sheet is kilograms, so the density must be kg per litre.
# Using the pounds factor (1.77) is exactly how Flight 143 left with less than
# half the fuel it needed: it overstated the fuel on board AND understated
# the litres to add.


def mass_on_board_kg(litres):
    return litres * units.KG_PER_LITRE


def litres_to_uplift(dipstick_litres, required_kg):
    shortfall_kg = required_kg - mass_on_board_kg(dipstick_litres)
    if shortfall_kg <= 0:
        return 0
    return int(round(shortfall_kg / units.KG_PER_LITRE))
`,
    },
  },

  {
    title: "The App That Kept Registering Itself",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Idempotency", "State"],
    description: `Modelled on the **Microsoft Teams / Android emergency-call issue of January 2022**. Google and Microsoft reported that on some Android phones with the Teams app installed but *not signed in*, certain 911 calls could fail. Teams was repeatedly registering calling accounts with the Android platform, and the way the platform then chose between registered accounts could leave an emergency call without the right one. Microsoft shipped a Teams update and Google an Android platform fix.

This project is a simplified reconstruction: \`PhoneAccountRegistry\` records every registration, and the locked \`EmergencyRouter\` only ranks the most recently registered accounts, so a flood of duplicates pushes the SIM out of consideration.

Make registration idempotent.`,
    bugReport: `**BUG-E911-TEAMS** · Priority: Critical (emergency calling) · Reported by: carrier escalation

PhoneAccountRegistry.register(app, handle, simBacked):
- the registry holds at most ONE account per (app, handle) pair
- registering a pair that is already present updates that entry's
  simBacked flag in place — its position in the list does not change
- a new pair is appended at the end
- different handles from the same app are different accounts
emergencyAccount() must keep returning the SIM account however many times an
app re-registers itself.

Observed: an app that re-registers on every launch while signed out fills the
registry, and emergencyAccount() returns null.`,
    logs: `[telecom] registerPhoneAccount com.microsoft.teams/teams (count=19)
[telecom] registerPhoneAccount com.microsoft.teams/teams (count=20)
[telecom] emergency call: no SIM-backed account in ranking window`,
    files: [
      {
        filePath: "src/telecom/PhoneAccountRegistry.java",
        isEditable: true,
        language: "java",
        content: `class PhoneAccountRegistry {
    final List<PhoneAccount> accounts = new ArrayList<>();

    // Called by apps whenever they (re)initialise their calling integration.
    void register(String app, String handle, boolean simBacked) {
        accounts.add(new PhoneAccount(app, handle, simBacked));
    }

    int size() {
        return accounts.size();
    }

    PhoneAccount emergencyAccount() {
        return EmergencyRouter.pick(accounts);
    }
}`,
      },
      {
        filePath: "src/telecom/PhoneAccount.java",
        isEditable: false,
        language: "java",
        content: `class PhoneAccount {
    final String app;
    final String handle;
    boolean simBacked;

    PhoneAccount(String app, String handle, boolean simBacked) {
        this.app = app;
        this.handle = handle;
        this.simBacked = simBacked;
    }
}

// The platform's emergency routing, simplified: it ranks only the WINDOW most
// recently registered accounts and dials through the first SIM-backed one
// among them, oldest first.
class EmergencyRouter {
    static final int WINDOW = 8;

    static PhoneAccount pick(List<PhoneAccount> accounts) {
        int from = Math.max(0, accounts.size() - WINDOW);
        for (int i = from; i < accounts.size(); i++) {
            if (accounts.get(i).simBacked) return accounts.get(i);
        }
        return null;
    }
}`,
      },
    ],
    tests: [
      {
        name: "the SIM handles emergency calls on a fresh registry",
        isHidden: false,
        source: `                PhoneAccountRegistry r = new PhoneAccountRegistry();
                r.register("com.android.phone", "sim-1", true);
                r.register("com.microsoft.teams", "teams", false);
                BugAssert.equal(r.emergencyAccount().handle, "sim-1");`,
      },
      {
        name: "re-registering on every launch keeps one entry",
        isHidden: false,
        source: `                PhoneAccountRegistry r = new PhoneAccountRegistry();
                r.register("com.android.phone", "sim-1", true);
                for (int i = 0; i < 20; i++) r.register("com.microsoft.teams", "teams", false);
                BugAssert.equal(r.size(), 2, "one SIM + one Teams account");`,
      },
      {
        name: "emergency routing survives an app's re-registrations",
        isHidden: true,
        source: `                PhoneAccountRegistry r = new PhoneAccountRegistry();
                r.register("com.android.phone", "sim-1", true);
                for (int i = 0; i < 20; i++) r.register("com.microsoft.teams", "teams", false);
                PhoneAccount a = r.emergencyAccount();
                BugAssert.ok(a != null && a.handle.equals("sim-1"), "911 must still reach the SIM");`,
      },
      {
        name: "different handles from one app are separate accounts",
        isHidden: true,
        source: `                PhoneAccountRegistry r = new PhoneAccountRegistry();
                r.register("com.android.phone", "sim-1", true);
                r.register("com.microsoft.teams", "work", false);
                r.register("com.microsoft.teams", "personal", false);
                r.register("com.microsoft.teams", "work", false);
                BugAssert.equal(r.size(), 3);`,
      },
      {
        name: "re-registering updates the entry in place",
        isHidden: true,
        source: `                PhoneAccountRegistry r = new PhoneAccountRegistry();
                r.register("com.android.phone", "sim-1", true);
                r.register("com.microsoft.teams", "teams", false);
                r.register("com.android.phone", "sim-1", false);
                BugAssert.equal(r.size(), 2);
                BugAssert.equal(r.accounts.get(0).handle, "sim-1", "position is kept");
                BugAssert.ok(!r.accounts.get(0).simBacked, "flag updated");
                BugAssert.ok(r.emergencyAccount() == null, "no SIM-backed account remains");`,
      },
    ],
    fixedFiles: {
      "src/telecom/PhoneAccountRegistry.java": `class PhoneAccountRegistry {
    final List<PhoneAccount> accounts = new ArrayList<>();

    // Called by apps whenever they (re)initialise their calling integration.
    void register(String app, String handle, boolean simBacked) {
        // Registration must be idempotent: an app that re-registers on every
        // launch would otherwise flood the list, and the router, which only
        // ranks the newest entries, loses sight of the SIM for 911.
        for (PhoneAccount existing : accounts) {
            if (existing.app.equals(app) && existing.handle.equals(handle)) {
                existing.simBacked = simBacked;
                return;
            }
        }
        accounts.add(new PhoneAccount(app, handle, simBacked));
    }

    int size() {
        return accounts.size();
    }

    PhoneAccount emergencyAccount() {
        return EmergencyRouter.pick(accounts);
    }
}`,
    },
  },

  {
    title: "The Sunset That Crashed the Phone",
    difficulty: "easy",
    category: "frontend",
    language: "java",
    tags: ["Overflow", "Bounds"],
    description: `Modelled on the **Android wallpaper crash of 2020**. A photograph of a lake at sunset, shared widely online, put some Android phones into a crash loop when it was set as the wallpaper. The image used a wide-gamut colour space; after conversion, a pixel's computed luminance **rounded up to 256** and was used to index a 256-entry histogram — one past the end. System UI crashed on every start until the wallpaper was removed. The fix clamped the value to the histogram's range.

\`Histogram.java\` builds the luminance histogram System UI uses to pick light or dark status-bar icons. Converted pixels arrive on the 0–255 scale but can land slightly outside it.

Fix \`build\` so every pixel lands in a valid bin.`,
    bugReport: `**BUG-WALLPAPER** · Priority: Critical (crash loop) · Reported by: device QA

Histogram.build(pixels) returns int[256]:
- each pixel's luminance is Luminance.of(px), rounded to the nearest integer
- a value above 255 counts in bin 255; a value below 0 counts in bin 0
- every pixel is counted exactly once (the bins sum to pixels.length)

Observed: ArrayIndexOutOfBoundsException: Index 256 out of bounds for
length 256 when the sunset photo is set as wallpaper.`,
    logs: `E AndroidRuntime: FATAL EXCEPTION: main  Process: com.android.systemui
E AndroidRuntime: java.lang.ArrayIndexOutOfBoundsException: length=256; index=256
I ActivityManager: Process com.android.systemui has died (restart 7)`,
    files: [
      {
        filePath: "src/ui/Histogram.java",
        isEditable: true,
        language: "java",
        content: `class Histogram {
    static final int BINS = 256;

    static int[] build(double[][] pixels) {
        int[] bins = new int[BINS];
        for (double[] px : pixels) {
            int y = (int) Math.round(Luminance.of(px));
            bins[y]++;
        }
        return bins;
    }
}`,
      },
      {
        filePath: "src/ui/Luminance.java",
        isEditable: false,
        language: "java",
        content: `// Rec. 709 luma weights. Pixels arrive already converted to sRGB for the
// histogram, as doubles on the 0-255 scale; a wide-gamut source can land a
// little outside that range after conversion.
class Luminance {
    static final double WR = 0.2126, WG = 0.7152, WB = 0.0722;

    static double of(double[] px) {
        return WR * px[0] + WG * px[1] + WB * px[2];
    }
}`,
      },
    ],
    tests: [
      {
        name: "black and white land in the end bins",
        isHidden: false,
        source: `                int[] h = Histogram.build(new double[][] { {0, 0, 0}, {255, 255, 255}, {100, 100, 100} });
                BugAssert.equal(h[0], 1, "black");
                BugAssert.equal(h[255], 1, "white");
                BugAssert.equal(h[100], 1, "grey");`,
      },
      {
        name: "a pixel just above 255 is counted in the top bin",
        isHidden: false,
        source: `                int[] h = Histogram.build(new double[][] { {255.6, 255.6, 255.6} });
                BugAssert.equal(h[255], 1, "the sunset pixel");`,
      },
      {
        name: "a pixel below 0 is counted in the bottom bin",
        isHidden: true,
        source: `                int[] h = Histogram.build(new double[][] { {-0.7, -0.7, -0.7}, {-40, 0, 0} });
                BugAssert.equal(h[0], 2);`,
      },
      {
        name: "every pixel is counted exactly once",
        isHidden: true,
        source: `                double[][] px = { {300, 300, 300}, {255.4, 255.4, 255.4}, {-3, -3, -3}, {12, 200, 40}, {0.4, 0.4, 0.4} };
                int[] h = Histogram.build(px);
                int total = 0;
                for (int c : h) total += c;
                BugAssert.equal(total, 5);
                BugAssert.equal(h[255], 2, "300 and 255.4");
                BugAssert.equal(h[0], 2, "-3 and 0.4");
                BugAssert.equal(h.length, 256);`,
      },
    ],
    fixedFiles: {
      "src/ui/Histogram.java": `class Histogram {
    static final int BINS = 256;

    static int[] build(double[][] pixels) {
        int[] bins = new int[BINS];
        for (double[] px : pixels) {
            int y = (int) Math.round(Luminance.of(px));
            // A wide-gamut pixel converted to sRGB can round to 256 (or below
            // 0); indexing with it crashed System UI in a loop. Clamp to the
            // histogram's range.
            if (y > BINS - 1) y = BINS - 1;
            if (y < 0) y = 0;
            bins[y]++;
        }
        return bins;
    }
}`,
    },
  },

  {
    title: "One Flipped Bit, Gossiped Everywhere",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Consistency", "Validation"],
    description: `Modelled on the **Amazon S3 outage of 20 July 2008**. S3's servers shared system state with each other through a gossip protocol. Amazon's post-mortem found that a single bit had been corrupted in some of those messages; S3 checksummed much of its traffic but not this internal state, so the corrupted value was accepted and passed on server to server. The state could not be repaired while running, and S3 had to be taken down and its gossip state cleared, which took several hours. Amazon added checksums to that state afterwards.

\`gossip.js\` merges a peer's server-state message into a node: each entry carries a status and a version, and newer versions win — so a flipped high bit in a version makes a bogus entry win everywhere.

Fix \`applyGossip\` to verify the message before merging anything.`,
    bugReport: `**BUG-S3-0720** · Priority: Critical · Reported by: storage on-call

applyGossip(node, message) — message is { from, state, checksum }:
- if message.checksum is not a number equal to checksum.of(message.state),
  the message is dropped: node.state is unchanged, node.rejected increases
  by 1, and the call returns false
- otherwise each entry is merged (an entry with a higher version replaces the
  node's copy; unknown servers are added) and the call returns true
A node must therefore never relay state it received corrupted.

Observed: one message with version 3 flipped to 1027 marked a healthy server
"down" on every node in the cluster within minutes.`,
    logs: `[gossip] node-b <- node-a s1 status=down version=1027 (had up@3)
[gossip] node-c <- node-b s1 status=down version=1027
[gossip] 100% of nodes report s1 down; request routing degraded`,
    files: [
      {
        filePath: "src/gossip/gossip.js",
        isEditable: true,
        language: "javascript",
        content: `var checksum = require("./checksum");

// Merges a peer's view of server state into this node.
exports.applyGossip = function (node, message) {
  var incoming = message.state;
  Object.keys(incoming).forEach(function (id) {
    var mine = node.state[id];
    var theirs = incoming[id];
    if (!mine || theirs.version > mine.version) {
      node.state[id] = { status: theirs.status, version: theirs.version };
    }
  });
  return true;
};
`,
      },
      {
        filePath: "src/gossip/checksum.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A message checksum over a state map { serverId: { status, version } }.
seal() is what a sender uses; it copies the state so later edits to the
sender's map cannot change a message already on the wire.
*/
function canonical(state) {
  return Object.keys(state).sort().map(function (id) {
    return id + ":" + state[id].status + "/" + state[id].version;
  }).join(";");
}

exports.of = function (state) {
  var s = canonical(state);
  var h = 7;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

exports.seal = function (from, state) {
  var copy = JSON.parse(JSON.stringify(state));
  return { from: from, state: copy, checksum: exports.of(copy) };
};
`,
      },
      {
        filePath: "src/gossip/cluster.js",
        isEditable: false,
        language: "javascript",
        content: `var checksum = require("./checksum");
var gossip = require("./gossip");

exports.createNode = function (id) {
  return { id: id, state: {}, rejected: 0 };
};

// One gossip round from one node to another.
exports.relay = function (from, to) {
  return gossip.applyGossip(to, checksum.seal(from.id, from.state));
};
`,
      },
    ],
    tests: [
      {
        name: "a valid message is merged",
        isHidden: false,
        source: `var cs = require("src/gossip/checksum");
var g = require("src/gossip/gossip");
var node = require("src/gossip/cluster").createNode("b");
assert.equal(g.applyGossip(node, cs.seal("a", { s1: { status: "up", version: 3 } })), true);
assert.equal(node.state, { s1: { status: "up", version: 3 } });`,
      },
      {
        name: "a message corrupted in transit is dropped",
        isHidden: false,
        source: `var cs = require("src/gossip/checksum");
var g = require("src/gossip/gossip");
var node = require("src/gossip/cluster").createNode("b");
node.state.s1 = { status: "up", version: 3 };
var msg = cs.seal("a", { s1: { status: "down", version: 3 } });
msg.state.s1.version = msg.state.s1.version ^ 1024;
assert.equal(g.applyGossip(node, msg), false);
assert.equal(node.state, { s1: { status: "up", version: 3 } }, "the corrupted entry must not be merged");`,
      },
      {
        name: "rejections are counted and unsealed messages refused",
        isHidden: true,
        source: `var g = require("src/gossip/gossip");
var node = require("src/gossip/cluster").createNode("b");
assert.equal(g.applyGossip(node, { from: "a", state: { s1: { status: "up", version: 1 } } }), false);
assert.equal(g.applyGossip(node, { from: "a", state: { s1: { status: "up", version: 1 } }, checksum: "12" }), false);
assert.equal(node.rejected, 2);
assert.equal(node.state, {});`,
      },
      {
        name: "corruption does not spread past the first hop",
        isHidden: true,
        source: `var cs = require("src/gossip/checksum");
var g = require("src/gossip/gossip");
var cluster = require("src/gossip/cluster");
var a = cluster.createNode("a"), b = cluster.createNode("b"), c = cluster.createNode("c");
a.state.s1 = { status: "up", version: 3 };
cluster.relay(a, b);
cluster.relay(b, c);
var bad = cs.seal("a", { s1: { status: "down", version: 3 } });
bad.state.s1.version = bad.state.s1.version ^ 1024;
g.applyGossip(b, bad);
cluster.relay(b, c);
assert.equal(c.state, { s1: { status: "up", version: 3 } });
assert.equal(b.rejected, 1);`,
      },
      {
        name: "older versions never replace newer ones",
        isHidden: true,
        source: `var cs = require("src/gossip/checksum");
var g = require("src/gossip/gossip");
var node = require("src/gossip/cluster").createNode("b");
g.applyGossip(node, cs.seal("a", { s1: { status: "up", version: 5 }, s2: { status: "up", version: 1 } }));
assert.equal(g.applyGossip(node, cs.seal("c", { s1: { status: "down", version: 4 }, s3: { status: "down", version: 2 } })), true);
assert.equal(node.state, { s1: { status: "up", version: 5 }, s2: { status: "up", version: 1 }, s3: { status: "down", version: 2 } });`,
      },
    ],
    fixedFiles: {
      "src/gossip/gossip.js": `var checksum = require("./checksum");

// Merges a peer's view of server state into this node.
exports.applyGossip = function (node, message) {
  var incoming = message.state;
  // Verify before merging. Unchecked state is how one flipped bit became
  // cluster-wide truth: once merged, this node re-seals it with a valid
  // checksum and every peer downstream believes it.
  if (typeof message.checksum !== "number" || message.checksum !== checksum.of(incoming)) {
    node.rejected++;
    return false;
  }
  Object.keys(incoming).forEach(function (id) {
    var mine = node.state[id];
    var theirs = incoming[id];
    if (!mine || theirs.version > mine.version) {
      node.state[id] = { status: theirs.status, version: theirs.version };
    }
  });
  return true;
};
`,
    },
  },

  {
    title: "The Error Code That Meant Yes",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Error Handling"],
    description: `Modelled on **GnuTLS CVE-2014-0092** (March 2014). GnuTLS's certificate-verification code used helpers that were read as booleans — non-zero meant "yes" — but on certain errors they returned a **negative error code**. Callers tested the result with a plain \`if\`, so an error was taken as success, and specially crafted certificates were accepted as valid. It was disclosed weeks after Apple's "goto fail" and fixed in GnuTLS 3.2.12 and 3.1.22.

\`verify.js\` walks a chain using two helpers that follow the C convention documented in \`x509.js\`: 1 for yes, 0 for no, negative for an error.

Fix \`verifyChain\` so an error is never read as "yes".`,
    bugReport: `**BUG-GNUTLS-0092** · Priority: Critical (TLS bypass) · Reported by: security audit

verifyChain(chain, trustedRoots) — chain[0] is the leaf, each certificate
is issued by the next, the last must be in trustedRoots (by subject):
- every issuer must be a CA: x509.checkIfCa(issuer) === 1
- every signature must check: x509.checkSignature(child, issuer) === 1
- 0 (no) AND any negative value (error) both fail the chain
- an empty chain fails

Observed: a chain whose intermediate cannot be decoded verifies as valid.`,
    logs: `[tls] verify chain leaf=shop.example depth=3
[x509] check_if_ca(intermediate) = -69 (ASN.1 DER error)
[tls] chain OK`,
    files: [
      {
        filePath: "src/tls/verify.js",
        isEditable: true,
        language: "javascript",
        content: `var x509 = require("./x509");

// chain[0] is the leaf; each certificate is issued by the next one; the last
// must be one of trustedRoots (by subject).
exports.verifyChain = function (chain, trustedRoots) {
  if (chain.length === 0) return false;
  for (var i = 0; i + 1 < chain.length; i++) {
    var child = chain[i];
    var issuer = chain[i + 1];
    if (!x509.checkIfCa(issuer)) return false;
    if (!x509.checkSignature(child, issuer)) return false;
  }
  return trustedRoots.indexOf(chain[chain.length - 1].subject) !== -1;
};
`,
      },
      {
        filePath: "src/tls/x509.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Certificates are plain objects: { subject, isCa, signedBy, der }.
der === "malformed" means the encoding cannot be decoded.

Return convention (inherited from the C library this wraps):
  checkIfCa(cert)              1 = is a CA,  0 = is not,  negative = error
  checkSignature(cert, issuer) 1 = valid,    0 = invalid, negative = error
ERR_DER (-69) is returned when a certificate cannot be decoded.
*/
var ERR_DER = -69;
exports.ERR_DER = ERR_DER;

function decodes(cert) {
  return cert.der !== "malformed";
}

exports.checkIfCa = function (cert) {
  if (!decodes(cert)) return ERR_DER;
  return cert.isCa ? 1 : 0;
};

exports.checkSignature = function (cert, issuer) {
  if (!decodes(cert) || !decodes(issuer)) return ERR_DER;
  return cert.signedBy === issuer.subject ? 1 : 0;
};
`,
      },
    ],
    tests: [
      {
        name: "a well-formed chain to a trusted root verifies",
        isHidden: false,
        source: `var v = require("src/tls/verify").verifyChain;
var chain = [
  { subject: "shop.example", isCa: false, signedBy: "Intermediate", der: "ok" },
  { subject: "Intermediate", isCa: true, signedBy: "Root", der: "ok" },
  { subject: "Root", isCa: true, signedBy: "Root", der: "ok" }
];
assert.equal(v(chain, ["Root"]), true);`,
      },
      {
        name: "an undecodable intermediate fails the chain",
        isHidden: false,
        source: `var v = require("src/tls/verify").verifyChain;
var chain = [
  { subject: "shop.example", isCa: false, signedBy: "Intermediate", der: "ok" },
  { subject: "Intermediate", isCa: true, signedBy: "Root", der: "malformed" },
  { subject: "Root", isCa: true, signedBy: "Root", der: "ok" }
];
assert.equal(v(chain, ["Root"]), false, "an error code is not a yes");`,
      },
      {
        name: "a non-CA issuer fails the chain",
        isHidden: true,
        source: `var v = require("src/tls/verify").verifyChain;
var chain = [
  { subject: "shop.example", isCa: false, signedBy: "other.example", der: "ok" },
  { subject: "other.example", isCa: false, signedBy: "Root", der: "ok" },
  { subject: "Root", isCa: true, signedBy: "Root", der: "ok" }
];
assert.equal(v(chain, ["Root"]), false);`,
      },
      {
        name: "an undecodable leaf fails the chain",
        isHidden: true,
        source: `var v = require("src/tls/verify").verifyChain;
var chain = [
  { subject: "shop.example", isCa: false, signedBy: "Root", der: "malformed" },
  { subject: "Root", isCa: true, signedBy: "Root", der: "ok" }
];
assert.equal(v(chain, ["Root"]), false);`,
      },
      {
        name: "wrong signers, untrusted roots and empty chains fail",
        isHidden: true,
        source: `var v = require("src/tls/verify").verifyChain;
var root = { subject: "Root", isCa: true, signedBy: "Root", der: "ok" };
assert.equal(v([{ subject: "a", isCa: false, signedBy: "Someone", der: "ok" }, root], ["Root"]), false);
assert.equal(v([{ subject: "a", isCa: false, signedBy: "Root", der: "ok" }, root], ["Other Root"]), false);
assert.equal(v([], ["Root"]), false);`,
      },
    ],
    fixedFiles: {
      "src/tls/verify.js": `var x509 = require("./x509");

// chain[0] is the leaf; each certificate is issued by the next one; the last
// must be one of trustedRoots (by subject).
exports.verifyChain = function (chain, trustedRoots) {
  if (chain.length === 0) return false;
  for (var i = 0; i + 1 < chain.length; i++) {
    var child = chain[i];
    var issuer = chain[i + 1];
    // These helpers return 1 / 0 / a NEGATIVE error code. A truthiness test
    // reads the error code as "yes" — compare against 1 explicitly.
    if (x509.checkIfCa(issuer) !== 1) return false;
    if (x509.checkSignature(child, issuer) !== 1) return false;
  }
  return trustedRoots.indexOf(chain[chain.length - 1].subject) !== -1;
};
`,
    },
  },

  {
    title: "Three Presses, Three Remittances",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Idempotency", "Money"],
    description: `Modelled on the **"Dalmellington bug" in the Post Office's Horizon system**, one of the defects examined in the High Court's 2019 Horizon Issues judgment (Bates v Post Office). At the Dalmellington branch a cash remittance to an outreach branch was recorded **several times**: the terminal was slow to respond, the confirm button was pressed again, and each press was booked as another transfer. The duplicated entries appeared as a cash shortfall at the branch. Across the wider Horizon scandal, hundreds of subpostmasters were held liable — many prosecuted — for shortfalls the system produced.

\`remittance.py\` books a remittance. The counter terminal sends one call per press of the confirm button, each carrying the \`request_key\` generated when the remittance screen was opened.

Make \`record_remittance\` idempotent on that key.`,
    bugReport: `**BUG-HNG-DAL** · Priority: Critical (branch accounts) · Reported by: branch support

record_remittance(ledger, branch, request_key, amount_pence):
- amount_pence <= 0 raises ValueError (unchanged)
- the first call for a (branch, request_key) inserts one row and returns
  {"status": "recorded", "id": <row id>}
- a repeat call with the same branch, key and amount inserts nothing and
  returns {"status": "duplicate", "id": <the original row id>}
- a repeat with the same branch and key but a DIFFERENT amount raises
  ValueError and inserts nothing
- keys are scoped to a branch: the same key at another branch is a separate
  remittance

Observed: a remittance confirmed three times while the terminal hung is
booked three times; the branch shows a shortfall of twice the amount.`,
    logs: `[horizon] branch=DAL rem_out key=R-5510 amount=800000 row=41
[horizon] branch=DAL rem_out key=R-5510 amount=800000 row=42
[horizon] branch=DAL rem_out key=R-5510 amount=800000 row=43
[balancing] branch=DAL discrepancy=-1600000`,
    files: [
      {
        filePath: "src/branch/remittance.py",
        isEditable: true,
        language: "python",
        content: `# Books a cash remittance sent from a branch.


def record_remittance(ledger, branch, request_key, amount_pence):
    if amount_pence <= 0:
        raise ValueError("amount must be positive")
    row = ledger.insert(branch, request_key, amount_pence)
    return {"status": "recorded", "id": row["id"]}
`,
      },
      {
        filePath: "src/branch/ledger.py",
        isEditable: false,
        language: "python",
        content: `# The branch remittances table. Rows are dicts:
#   {"id": int, "branch": str, "key": str, "amount": int}   (amount in pence)


class Ledger:
    def __init__(self):
        self.rows = []

    def insert(self, branch, key, amount):
        row = {"id": len(self.rows) + 1, "branch": branch, "key": key, "amount": amount}
        self.rows.append(row)
        return row

    def find(self, branch, key):
        for row in self.rows:
            if row["branch"] == branch and row["key"] == key:
                return row
        return None

    def total(self, branch):
        return sum(r["amount"] for r in self.rows if r["branch"] == branch)
`,
      },
    ],
    tests: [
      {
        name: "a single remittance is recorded",
        isHidden: false,
        source: `Ledger = bug_require("src/branch/ledger.py").Ledger
rem = bug_require("src/branch/remittance.py")
ledger = Ledger()
assert_.equal(rem.record_remittance(ledger, "DAL", "R-5510", 800000), {"status": "recorded", "id": 1})
assert_.equal(ledger.total("DAL"), 800000)`,
      },
      {
        name: "pressing confirm three times books one remittance",
        isHidden: false,
        source: `Ledger = bug_require("src/branch/ledger.py").Ledger
rem = bug_require("src/branch/remittance.py")
ledger = Ledger()
for _ in range(3):
    rem.record_remittance(ledger, "DAL", "R-5510", 800000)
assert_.equal(len(ledger.rows), 1)
assert_.equal(ledger.total("DAL"), 800000)`,
      },
      {
        name: "repeats report the original row as a duplicate",
        isHidden: true,
        source: `Ledger = bug_require("src/branch/ledger.py").Ledger
rem = bug_require("src/branch/remittance.py")
ledger = Ledger()
rem.record_remittance(ledger, "DAL", "R-1", 5000)
rem.record_remittance(ledger, "DAL", "R-2", 7000)
assert_.equal(rem.record_remittance(ledger, "DAL", "R-1", 5000), {"status": "duplicate", "id": 1})
assert_.equal(rem.record_remittance(ledger, "DAL", "R-2", 7000), {"status": "duplicate", "id": 2})
assert_.equal(ledger.total("DAL"), 12000)`,
      },
      {
        name: "a reused key with a different amount is refused",
        isHidden: true,
        source: `Ledger = bug_require("src/branch/ledger.py").Ledger
rem = bug_require("src/branch/remittance.py")
ledger = Ledger()
rem.record_remittance(ledger, "DAL", "R-1", 5000)
assert_.throws(lambda: rem.record_remittance(ledger, "DAL", "R-1", 9000))
assert_.equal(len(ledger.rows), 1)`,
      },
      {
        name: "keys are scoped per branch and amounts still validated",
        isHidden: true,
        source: `Ledger = bug_require("src/branch/ledger.py").Ledger
rem = bug_require("src/branch/remittance.py")
ledger = Ledger()
assert_.equal(rem.record_remittance(ledger, "DAL", "R-1", 5000)["status"], "recorded")
assert_.equal(rem.record_remittance(ledger, "AYR", "R-1", 5000), {"status": "recorded", "id": 2})
assert_.throws(lambda: rem.record_remittance(ledger, "DAL", "R-9", 0))
assert_.equal(len(ledger.rows), 2)`,
      },
    ],
    fixedFiles: {
      "src/branch/remittance.py": `# Books a cash remittance sent from a branch.


def record_remittance(ledger, branch, request_key, amount_pence):
    if amount_pence <= 0:
        raise ValueError("amount must be positive")
    # One remittance screen = one remittance, however many times confirm is
    # pressed while the terminal is slow. Without this, every press was
    # booked again and surfaced as a shortfall the branch was made to repay.
    existing = ledger.find(branch, request_key)
    if existing is not None:
        if existing["amount"] != amount_pence:
            raise ValueError("request key already used for a different amount")
        return {"status": "duplicate", "id": existing["id"]}
    row = ledger.insert(branch, request_key, amount_pence)
    return {"status": "recorded", "id": row["id"]}
`,
    },
  },

  {
    title: "Two Spikes, 1.2 Seconds Apart",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Sensors", "State", "Time"],
    description: `Modelled on **Qantas Flight 72** (7 October 2008), an Airbus A330 flying from Singapore to Perth that made two sudden, uncommanded pitch-down manoeuvres, injuring many of those on board; it diverted to Learmonth. The Australian Transport Safety Bureau found that one air data inertial reference unit had begun emitting intermittent data spikes, including in angle of attack. The flight control computers' algorithm was designed to hold the last good value for 1.2 seconds when it detected a spike — but in a very specific pattern, **a second spike arriving 1.2 seconds after the first**, a spike got through and the computers commanded nose-down.

\`aoaFilter.js\` is a reconstruction of that spike filter.

Fix \`sample\` so a hold never lets an unchecked value through.`,
    bugReport: `**BUG-QF72** · Priority: Critical (flight controls) · Reported by: flight test

createFilter({ initial, threshold, holdMs }).sample(t, value) returns the
angle of attack the control laws use; t is in ms and strictly increasing.
- not holding, |value - lastGood| <= threshold: accept it (lastGood = value)
  and return it
- not holding, deviation > threshold: this is a spike — start a hold at t and
  return lastGood
- holding and t - holdStart < holdMs: return lastGood; the value is ignored
- the first sample with t - holdStart >= holdMs ends the hold and is then
  judged exactly like a sample that is not holding (so a spike at that very
  instant starts a new hold)
Nothing above threshold away from lastGood is ever returned.

Observed: spikes at t = 1000 and t = 2200 with holdMs = 1200 — the second
spike is returned as the angle of attack, and protection commands nose-down.`,
    logs: `[adiru-1] AOA spike 50.6 deg at t=1000 -> hold
[fcpc] AOA used=50.6 deg at t=2200
[fcpc] high-AOA protection: PITCH DOWN`,
    files: [
      {
        filePath: "src/fcpc/aoaFilter.js",
        isEditable: true,
        language: "javascript",
        content: `// Rejects short spikes in the angle-of-attack signal by holding the last
// good value for holdMs.
exports.createFilter = function (opts) {
  var lastGood = opts.initial;
  var holdStart = null;
  return {
    sample: function (t, value) {
      if (holdStart !== null) {
        if (t - holdStart < opts.holdMs) return lastGood;
        holdStart = null;
        lastGood = value;
        return value;
      }
      if (Math.abs(value - lastGood) > opts.threshold) {
        holdStart = t;
        return lastGood;
      }
      lastGood = value;
      return value;
    }
  };
};
`,
      },
      {
        filePath: "src/fcpc/protection.js",
        isEditable: false,
        language: "javascript",
        content: `/*
High angle-of-attack protection. Anything above PROTECTION_AOA degrees makes
the control laws command the nose down. Sustained genuine changes are
resolved by the unit-voting stage upstream, not by the spike filter.
*/
var PROTECTION_AOA = 15;
exports.PROTECTION_AOA = PROTECTION_AOA;

exports.pitchCommand = function (aoa) {
  return aoa > PROTECTION_AOA ? "NOSE_DOWN" : "NORMAL";
};
`,
      },
    ],
    tests: [
      {
        name: "clean data passes straight through",
        isHidden: false,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 2.1, threshold: 10, holdMs: 1200 });
assert.equal([f.sample(0, 2.1), f.sample(100, 2.5), f.sample(200, 3.0), f.sample(300, 2.8)], [2.1, 2.5, 3.0, 2.8]);`,
      },
      {
        name: "a single spike is held out",
        isHidden: false,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 2.1, threshold: 10, holdMs: 1200 });
var out = [];
for (var t = 0; t <= 3000; t += 100) out.push(f.sample(t, t === 1000 ? 50.6 : 2.1));
assert.ok(out.every(function (x) { return x === 2.1; }), JSON.stringify(out));`,
      },
      {
        name: "two spikes exactly one hold apart never reach the control laws",
        isHidden: false,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 2.1, threshold: 10, holdMs: 1200 });
var p = require("src/fcpc/protection");
var cmds = [];
for (var t = 0; t <= 4000; t += 100) {
  var v = (t === 1000 || t === 2200) ? 50.6 : 2.1;
  cmds.push(p.pitchCommand(f.sample(t, v)));
}
assert.equal(cmds.indexOf("NOSE_DOWN"), -1, "a spike got through");`,
      },
      {
        name: "normal values resume once the second hold ends",
        isHidden: true,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 2.1, threshold: 10, holdMs: 1200 });
var seen = {};
for (var t = 0; t <= 3500; t += 100) {
  var v = (t === 1000 || t === 2200) ? 50.6 : (t >= 3400 ? 3.0 : 2.1);
  seen[t] = f.sample(t, v);
}
assert.equal([seen[2200], seen[3300], seen[3400], seen[3500]], [2.1, 2.1, 3.0, 3.0]);`,
      },
      {
        name: "values inside a hold are ignored even when they look normal",
        isHidden: true,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 2.1, threshold: 10, holdMs: 1200 });
f.sample(0, 2.1);
assert.equal(f.sample(100, 40), 2.1);
assert.equal(f.sample(600, 4.0), 2.1, "still holding");
assert.equal(f.sample(1299, 4.0), 2.1, "still holding at 1199 ms");
assert.equal(f.sample(1300, 4.0), 4.0, "hold over at exactly holdMs");`,
      },
      {
        name: "back-to-back spikes at every hold boundary are all held",
        isHidden: true,
        source: `var f = require("src/fcpc/aoaFilter").createFilter({ initial: 5, threshold: 8, holdMs: 1000 });
var max = 0;
for (var t = 0; t <= 6000; t += 250) {
  var v = (t % 1000 === 0 && t > 0) ? 60 : 5;
  var out = f.sample(t, v);
  if (out > max) max = out;
}
assert.equal(max, 5);`,
      },
    ],
    fixedFiles: {
      "src/fcpc/aoaFilter.js": `// Rejects short spikes in the angle-of-attack signal by holding the last
// good value for holdMs.
exports.createFilter = function (opts) {
  var lastGood = opts.initial;
  var holdStart = null;
  return {
    sample: function (t, value) {
      if (holdStart !== null) {
        if (t - holdStart < opts.holdMs) return lastGood;
        // The hold is over, but the sample that ends it is still just a
        // sample: accepting it unchecked is exactly how a second spike,
        // arriving one hold period after the first, reached the control laws.
        holdStart = null;
      }
      if (Math.abs(value - lastGood) > opts.threshold) {
        holdStart = t;
        return lastGood;
      }
      lastGood = value;
      return value;
    }
  };
};
`,
    },
  },

  {
    title: "The Hashes Without Salt",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Security", "Hashing"],
    description: `Modelled on the **LinkedIn password leak of June 2012**. About 6.5 million LinkedIn password hashes were posted online. They were **unsalted SHA-1**: the same password always produced the same hash, so one precomputed guess cracked every account that shared it, and a fast hash made guessing cheap. LinkedIn confirmed the leak and moved to salted hashing; years later a far larger dump from the same breach surfaced.

\`passwords.py\` stores and checks member passwords. The storage policy in \`config.py\` has long said what it should be; the code never followed it.

Rewrite \`hash_password\` and \`verify_password\` to follow the policy.`,
    bugReport: `**BUG-LI-2012** · Priority: Critical · Reported by: security

hash_password(password, rng) returns
  "pbkdf2_sha256$<iterations>$<salt hex>$<hash hex>"
- salt = rng(config.SALT_BYTES) — a fresh salt per call, from the injected rng
- hash = hashlib.pbkdf2_hmac("sha256", password UTF-8, salt,
  config.ITERATIONS, config.KEY_BYTES)
- hex is lowercase
verify_password(password, stored):
- recomputes with the stored salt and iteration count, compares in constant
  time (hmac.compare_digest), returns True/False
- anything not in the four-part format above (including a legacy bare SHA-1
  hex digest) returns False — never raises

Observed: two members with the password "linkedin" have byte-identical
stored hashes.`,
    logs: `[audit] users.password_hash: 6.5M rows, 0 salts
[audit] top hash 7c4a8d09ca3762af61e59520943dc26494f8941b shared by many accounts`,
    files: [
      {
        filePath: "src/accounts/passwords.py",
        isEditable: true,
        language: "python",
        content: `import hashlib
import hmac

config = bug_require("./config.py")


def hash_password(password, rng):
    return hashlib.sha1(password.encode("utf-8")).hexdigest()


def verify_password(password, stored):
    candidate = hashlib.sha1(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(candidate, stored)
`,
      },
      {
        filePath: "src/accounts/config.py",
        isEditable: false,
        language: "python",
        content: `# Password storage policy.
#   stored = "pbkdf2_sha256$<iterations>$<salt hex>$<hash hex>"
#   salt:  SALT_BYTES bytes from the injected rng, rng(n) -> bytes
#   hash:  hashlib.pbkdf2_hmac("sha256", password utf-8, salt, ITERATIONS, KEY_BYTES)
# ITERATIONS is kept low here so the test suite runs quickly.
ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 1000
SALT_BYTES = 16
KEY_BYTES = 32
`,
      },
    ],
    tests: [
      {
        name: "a stored password verifies and a wrong one does not",
        isHidden: false,
        source: `import os
pw = bug_require("src/accounts/passwords.py")
stored = pw.hash_password("correct horse", os.urandom)
assert_.ok(pw.verify_password("correct horse", stored) is True)
assert_.ok(pw.verify_password("correct horsf", stored) is False)`,
      },
      {
        name: "two members with the same password get different hashes",
        isHidden: false,
        source: `pw = bug_require("src/accounts/passwords.py")
a = pw.hash_password("linkedin", lambda n: bytes([1] * n))
b = pw.hash_password("linkedin", lambda n: bytes([2] * n))
assert_.ok(a != b, "identical passwords must not produce identical stored values")`,
      },
      {
        name: "the stored value follows the policy format",
        isHidden: true,
        source: `import hashlib
pw = bug_require("src/accounts/passwords.py")
stored = pw.hash_password("hunter2", lambda n: bytes(range(n)))
parts = stored.split("$")
assert_.equal(len(parts), 4)
assert_.equal(parts[0], "pbkdf2_sha256")
assert_.equal(parts[1], "1000")
assert_.equal(parts[2], bytes(range(16)).hex())
expected = hashlib.pbkdf2_hmac("sha256", b"hunter2", bytes(range(16)), 1000, 32).hex()
assert_.equal(parts[3], expected)`,
      },
      {
        name: "each call draws a fresh salt from the rng",
        isHidden: true,
        source: `pw = bug_require("src/accounts/passwords.py")
calls = []
def rng(n):
    calls.append(n)
    return bytes([len(calls)] * n)
x = pw.hash_password("pw", rng)
y = pw.hash_password("pw", rng)
assert_.equal(calls, [16, 16])
assert_.ok(x != y)
assert_.ok(pw.verify_password("pw", x) and pw.verify_password("pw", y))`,
      },
      {
        name: "legacy and malformed values never verify",
        isHidden: true,
        source: `import hashlib
pw = bug_require("src/accounts/passwords.py")
legacy = hashlib.sha1(b"linkedin").hexdigest()
assert_.ok(pw.verify_password("linkedin", legacy) is False, "bare SHA-1 must not verify")
assert_.ok(pw.verify_password("x", "pbkdf2_sha256$1000$zz$00") is False)
assert_.ok(pw.verify_password("x", "") is False)`,
      },
    ],
    fixedFiles: {
      "src/accounts/passwords.py": `import hashlib
import hmac

config = bug_require("./config.py")

# Unsalted SHA-1 made every shared password one crack away for every account
# that used it. A per-user salt makes identical passwords store differently,
# and PBKDF2's iterations make each guess expensive.


def _derive(password, salt, iterations, length):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, length)


def hash_password(password, rng):
    salt = rng(config.SALT_BYTES)
    digest = _derive(password, salt, config.ITERATIONS, config.KEY_BYTES)
    return "$".join([config.ALGORITHM, str(config.ITERATIONS), salt.hex(), digest.hex()])


def verify_password(password, stored):
    parts = stored.split("$")
    if len(parts) != 4 or parts[0] != config.ALGORITHM:
        return False
    try:
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected = bytes.fromhex(parts[3])
    except ValueError:
        return False
    if iterations < 1 or not expected:
        return False
    candidate = _derive(password, salt, iterations, len(expected))
    return hmac.compare_digest(candidate, expected)
`,
    },
  },

  {
    title: "The Log That Wore Out the Car",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Resource Limits", "Logging"],
    description: `Modelled on **Tesla's 2021 media-control-unit recall**. After an NHTSA investigation, Tesla recalled roughly 135,000 Model S and Model X vehicles whose media control unit used an 8 GB eMMC flash chip that could wear out: every flash chip survives only a limited number of program/erase cycles, and once this one was exhausted the touchscreen could fail, taking functions such as the rear-view camera display and defogging controls with it. Reporting on the failures widely pointed at the steady stream of log data being written to the chip.

\`logger.js\` is a reconstruction of such a logger: it writes every log line to flash as its own write.

Fix the logger to batch writes and cap what it keeps on flash.`,
    bugReport: `**BUG-MCU-EMMC** · Priority: High (hardware wear) · Reported by: vehicle reliability

createLogger(flash) returns { log(line), flush() }:
- log() appends to an in-memory buffer; nothing reaches flash until the
  buffer holds config.BATCH_LINES lines, which are then written with ONE
  flash.write(lines) call and the buffer emptied
- flush() writes whatever is buffered with one flash.write call; with an
  empty buffer it writes nothing
- after every write, if flash.lines holds more than config.RETAIN_LINES
  lines, the oldest are dropped with flash.dropOldest(count) so exactly
  RETAIN_LINES remain
- lines reach flash in the order they were logged

Observed: flash.writes equals the number of log lines; the part's write
budget is spent in a few years of normal driving.`,
    logs: `[mcu] emmc: life_time_est_typ_b=0x0B (exceeded)
[mcu] emmc: program/erase cycles consumed by /var/log: 97%
[mcu] display: boot failed, rear camera unavailable`,
    files: [
      {
        filePath: "src/mcu/logger.js",
        isEditable: true,
        language: "javascript",
        content: `var config = require("./config");

exports.createLogger = function (flash) {
  return {
    log: function (line) {
      flash.write([line]);
    },
    flush: function () {}
  };
};
`,
      },
      {
        filePath: "src/mcu/config.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Flash budget for the media unit's logs.
BATCH_LINES  lines are buffered in RAM and written to flash together.
RETAIN_LINES the most lines kept on flash; older ones are dropped.
*/
exports.BATCH_LINES = 50;
exports.RETAIN_LINES = 200;
`,
      },
      {
        filePath: "src/mcu/flash.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The media unit's eMMC, simulated. Every write() is one program/erase cycle
against the part, however many lines it carries — that count is what wears
the chip out. dropOldest() is a metadata change and costs no cycle here.
*/
exports.create = function () {
  var flash = {
    writes: 0,
    lines: [],
    write: function (lines) {
      flash.writes++;
      for (var i = 0; i < lines.length; i++) flash.lines.push(lines[i]);
    },
    dropOldest: function (count) {
      flash.lines.splice(0, count);
    }
  };
  return flash;
};
`,
      },
    ],
    tests: [
      {
        name: "logged lines reach flash in order after a flush",
        isHidden: false,
        source: `var flash = require("src/mcu/flash").create();
var logger = require("src/mcu/logger").createLogger(flash);
logger.log("boot");
logger.log("gps fix");
logger.log("nav ready");
logger.flush();
assert.equal(flash.lines, ["boot", "gps fix", "nav ready"]);`,
      },
      {
        name: "lines are written in batches",
        isHidden: false,
        source: `var flash = require("src/mcu/flash").create();
var logger = require("src/mcu/logger").createLogger(flash);
for (var i = 0; i < 120; i++) logger.log("line " + i);
assert.equal(flash.writes, 2, "two full batches of 50");
logger.flush();
assert.equal(flash.writes, 3, "the remaining 20 in one more write");
assert.equal(flash.lines.length, 120);`,
      },
      {
        name: "nothing reaches flash before a batch fills",
        isHidden: true,
        source: `var flash = require("src/mcu/flash").create();
var logger = require("src/mcu/logger").createLogger(flash);
for (var i = 0; i < 49; i++) logger.log("l" + i);
assert.equal([flash.writes, flash.lines.length], [0, 0]);
logger.log("l49");
assert.equal([flash.writes, flash.lines.length], [1, 50]);`,
      },
      {
        name: "flushing an empty buffer costs no write",
        isHidden: true,
        source: `var flash = require("src/mcu/flash").create();
var logger = require("src/mcu/logger").createLogger(flash);
logger.flush();
for (var i = 0; i < 50; i++) logger.log("l" + i);
logger.flush();
logger.flush();
assert.equal(flash.writes, 1);`,
      },
      {
        name: "flash keeps only the newest RETAIN_LINES lines",
        isHidden: true,
        source: `var flash = require("src/mcu/flash").create();
var logger = require("src/mcu/logger").createLogger(flash);
for (var i = 0; i < 1010; i++) logger.log("line " + i);
logger.flush();
assert.equal(flash.lines.length, 200);
assert.equal([flash.lines[0], flash.lines[199]], ["line 810", "line 1009"]);
assert.equal(flash.writes, 21);`,
      },
    ],
    fixedFiles: {
      "src/mcu/logger.js": `var config = require("./config");

// Every flash write is a program/erase cycle the chip never gets back. One
// write per log line spent the part's lifetime on logs; buffer in RAM, write
// in batches, and keep only a bounded tail on flash.
exports.createLogger = function (flash) {
  var buffer = [];

  function flush() {
    if (buffer.length === 0) return;
    var batch = buffer;
    buffer = [];
    flash.write(batch);
    var excess = flash.lines.length - config.RETAIN_LINES;
    if (excess > 0) flash.dropOldest(excess);
  }

  return {
    log: function (line) {
      buffer.push(line);
      if (buffer.length >= config.BATCH_LINES) flush();
    },
    flush: flush
  };
};
`,
    },
  },

  {
    title: "The Signature Nonce That Never Changed",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Security", "Randomness"],
    description: `Modelled on the **PlayStation 3 signing-key disclosure** presented by the fail0verflow group in December 2010. ECDSA requires a fresh, secret random number (the nonce *k*) for every signature. Sony's signing used the **same k for every signature**, and two signatures made with the same nonce are enough to compute the private key with simple algebra — which is what happened to the key Sony used to sign PS3 software.

\`signer.py\` signs with a DSA-style scheme over a toy group (\`group.py\`; the numbers are tiny so tests run instantly, the structure is the real one). It draws its nonce once, when the signer is created.

Fix \`Signer\` so every signature uses a fresh nonce from the injected RNG.`,
    bugReport: `**BUG-SIGN-K** · Priority: Critical (key compromise) · Reported by: crypto review

Signer(private_key, rng).sign(message) returns (r, s):
- each call draws a NEW nonce k = rng.below(group.Q); nothing is drawn when
  the signer is created
- k == 0 is not a valid nonce: draw again
- r = pow(G, k, P) % Q and s = k^-1 * (digest(message) + private_key * r) % Q;
  if r == 0 or s == 0, draw again
- every signature must verify with group.verify(public_key, message, sig)
Consequences the tests check: n signatures consume n nonces (when none are
rejected), and two signatures never share an r.

Observed: every signature from the release signer carries the same r.`,
    logs: `[signer] sign pkg=update-3.41 r=0x2c1 s=0x0f3
[signer] sign pkg=update-3.50 r=0x2c1 s=0x1a7
[audit] 2 signatures share r — private key recoverable`,
    files: [
      {
        filePath: "src/signing/signer.py",
        isEditable: true,
        language: "python",
        content: `group = bug_require("./group.py")


class Signer:
    def __init__(self, private_key, rng):
        self.private_key = private_key
        self.rng = rng
        self.nonce = self._draw_nonce()

    def _draw_nonce(self):
        k = self.rng.below(group.Q)
        while k == 0:
            k = self.rng.below(group.Q)
        return k

    def sign(self, message):
        k = self.nonce
        r = pow(group.G, k, group.P) % group.Q
        s = (pow(k, -1, group.Q) * (group.digest(message) + self.private_key * r)) % group.Q
        return (r, s)
`,
      },
      {
        filePath: "src/signing/group.py",
        isEditable: false,
        language: "python",
        content: `# A toy DSA-style group: tiny numbers, real structure.
P = 2039        # prime modulus, P = 2Q + 1
Q = 1019        # prime order of the subgroup
G = 4           # generator of the order-Q subgroup


def digest(message):
    h = 0
    for byte in message.encode("utf-8"):
        h = (h * 131 + byte) % Q
    return h


def public_key(private_key):
    return pow(G, private_key, P)


def verify(public, message, signature):
    r, s = signature
    if not (0 < r < Q and 0 < s < Q):
        return False
    w = pow(s, -1, Q)
    u1 = (digest(message) * w) % Q
    u2 = (r * w) % Q
    return (pow(G, u1, P) * pow(public, u2, P)) % P % Q == r
`,
      },
      {
        filePath: "src/signing/rng.py",
        isEditable: false,
        language: "python",
        content: `# A deterministic stand-in for the signer's CSPRNG, for tests.
class SequenceRng:
    def __init__(self, values):
        self.values = list(values)
        self.calls = 0

    def below(self, n):
        value = self.values[self.calls % len(self.values)] % n
        self.calls += 1
        return value
`,
      },
    ],
    tests: [
      {
        name: "a signature verifies",
        isHidden: false,
        source: `group = bug_require("src/signing/group.py")
Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
s = Signer(123, SequenceRng([77, 501, 900]))
sig = s.sign("firmware 3.55")
assert_.ok(group.verify(group.public_key(123), "firmware 3.55", sig))`,
      },
      {
        name: "two signatures never share a nonce",
        isHidden: false,
        source: `Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
s = Signer(123, SequenceRng([77, 501, 900]))
r1, _ = s.sign("update 3.41")
r2, _ = s.sign("update 3.50")
assert_.ok(r1 != r2, "same r means the same k - the private key falls out")`,
      },
      {
        name: "each signature draws its own nonce",
        isHidden: true,
        source: `Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
rng = SequenceRng([77, 501, 900, 12])
s = Signer(123, rng)
assert_.equal(rng.calls, 0, "nothing drawn at construction")
for m in ("a", "b", "c"):
    s.sign(m)
assert_.equal(rng.calls, 3)`,
      },
      {
        name: "signing the same message twice gives different signatures",
        isHidden: true,
        source: `group = bug_require("src/signing/group.py")
Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
s = Signer(321, SequenceRng([5, 9]))
a = s.sign("same")
b = s.sign("same")
assert_.ok(a != b)
assert_.ok(group.verify(group.public_key(321), "same", a) and group.verify(group.public_key(321), "same", b))`,
      },
      {
        name: "a zero nonce is skipped",
        isHidden: true,
        source: `Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
a = Signer(123, SequenceRng([0, 77])).sign("m")
b = Signer(123, SequenceRng([77])).sign("m")
assert_.equal(a, b)`,
      },
      {
        name: "many signatures all verify",
        isHidden: true,
        source: `group = bug_require("src/signing/group.py")
Signer = bug_require("src/signing/signer.py").Signer
SequenceRng = bug_require("src/signing/rng.py").SequenceRng
s = Signer(777, SequenceRng([5, 9, 1000, 33, 700, 64]))
rs = set()
for i in range(6):
    sig = s.sign("pkg-" + str(i))
    assert_.ok(group.verify(group.public_key(777), "pkg-" + str(i), sig), "pkg-" + str(i))
    rs.add(sig[0])
assert_.equal(len(rs), 6)`,
      },
    ],
    fixedFiles: {
      "src/signing/signer.py": `group = bug_require("./group.py")


class Signer:
    def __init__(self, private_key, rng):
        self.private_key = private_key
        self.rng = rng

    def sign(self, message):
        # A nonce is single-use. Reusing k across signatures lets anyone
        # holding two of them solve for the private key - draw a fresh one
        # for every signature, and never keep it.
        h = group.digest(message)
        while True:
            k = self.rng.below(group.Q)
            if k == 0:
                continue
            r = pow(group.G, k, group.P) % group.Q
            if r == 0:
                continue
            s = (pow(k, -1, group.Q) * (h + self.private_key * r)) % group.Q
            if s == 0:
                continue
            return (r, s)
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE20_ORIGINS: Record<string, string> = {
  "Twenty Thousand Spaces on the Home Page": "Stack Overflow · 2016",
  "The Empty Argument List That Became Root": "polkit · CVE-2021-4034",
  "The Root That Brought Its Own Generator": "Windows CryptoAPI · CVE-2020-0601",
  "The Payment Method Called Nothing": "Uber · 2017",
  "Four Years and a Day Off": "Excel · 1904 date system",
  "Pounds Where Kilograms Should Be": "Air Canada · 1983",
  "The App That Kept Registering Itself": "Microsoft Teams · 2022",
  "The Sunset That Crashed the Phone": "Android · 2020",
  "One Flipped Bit, Gossiped Everywhere": "Amazon S3 · 2008",
  "The Error Code That Meant Yes": "GnuTLS · CVE-2014-0092",
  "Three Presses, Three Remittances": "Post Office Horizon · Dalmellington",
  "Two Spikes, 1.2 Seconds Apart": "Qantas Flight 72 · 2008",
  "The Hashes Without Salt": "LinkedIn · 2012",
  "The Log That Wore Out the Car": "Tesla · 2021",
  "The Signature Nonce That Never Changed": "Sony PS3 · 2010",
};
