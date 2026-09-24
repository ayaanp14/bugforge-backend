/**
 * Wave 19 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE19: BugSpec[] = [

  {
    title: "The Certificate Nobody Renewed",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Time", "Config", "Security"],
    description: `Modelled on the **Ericsson outage of 6 December 2018**: an expired certificate in Ericsson's SGSN-MME core-network software took mobile data down for millions of customers of **O2 in the UK** and **SoftBank in Japan**, among other operators, for most of a day. Ericsson said the cause was an expired certificate in the software versions installed with those customers.

This project is a reconstruction of the safeguard that should have caught it: a renewal check that flags a certificate once it enters its renewal window. \`CertRenewal.java\` computes how many days a certificate has left — and the renewal alert never fires.

Fix \`CertRenewal\` so the days-to-expiry figure, and everything built on it, follows the spec.`,
    bugReport: `**BUG-CERT-1206** · Priority: Critical · Reported by: network operations

All times are epoch milliseconds (long).

daysUntilExpiry(now, notAfter)
- whole days between now and notAfter, rounded toward negative infinity:
  floor((notAfter - now) / CertPolicy.MILLIS_PER_DAY)
- 10 days left -> 10; 29 days 23 hours left -> 29; 1 ms past expiry -> -1

shouldRenew(now, notAfter)
- true when daysUntilExpiry <= CertPolicy.RENEW_WINDOW_DAYS (30), including
  after expiry

status(now, notAfter)
- "EXPIRED" when daysUntilExpiry < 0
- "RENEW"   when 0 <= daysUntilExpiry <= 30
- "OK"      otherwise

Observed: a certificate with 10 days left reports 240 days, status "OK";
nobody is paged until the node refuses to start.`,
    logs: `[certwatch] sgsn-mme-07 cert notAfter=2018-12-06T00:00Z days_left=240 status=OK
[certwatch] no renewals due
[sgsn-mme-07] TLS handshake failed: certificate has expired`,
    files: [
      {
        filePath: "CertRenewal.java",
        isEditable: true,
        language: "java",
        content: `class CertRenewal {
    // Whole days before the certificate expires; negative once it has.
    static long daysUntilExpiry(long nowMillis, long notAfterMillis) {
        return (notAfterMillis - nowMillis) / CertPolicy.MILLIS_PER_HOUR;
    }

    static boolean shouldRenew(long nowMillis, long notAfterMillis) {
        return daysUntilExpiry(nowMillis, notAfterMillis) <= CertPolicy.RENEW_WINDOW_DAYS;
    }

    static String status(long nowMillis, long notAfterMillis) {
        long days = daysUntilExpiry(nowMillis, notAfterMillis);
        if (days < 0) return "EXPIRED";
        if (days <= CertPolicy.RENEW_WINDOW_DAYS) return "RENEW";
        return "OK";
    }
}`,
      },
      {
        filePath: "CertPolicy.java",
        isEditable: false,
        language: "java",
        content: `class CertPolicy {
    static final long MILLIS_PER_SECOND = 1000L;
    static final long MILLIS_PER_HOUR = 60L * 60L * MILLIS_PER_SECOND;
    static final long MILLIS_PER_DAY = 24L * MILLIS_PER_HOUR;

    // Renew (and page someone) this many days before notAfter.
    static final int RENEW_WINDOW_DAYS = 30;
}`,
      },
    ],
    tests: [
      {
        name: "a certificate with 100 days left is fine",
        isHidden: false,
        source: `                long now = 1543622400000L;
                long notAfter = now + 100L * CertPolicy.MILLIS_PER_DAY;
                BugAssert.equal(CertRenewal.status(now, notAfter), "OK");
                BugAssert.ok(!CertRenewal.shouldRenew(now, notAfter), "no renewal yet");`,
      },
      {
        name: "ten days left is ten days, and due for renewal",
        isHidden: false,
        source: `                long now = 1543622400000L;
                long notAfter = now + 10L * CertPolicy.MILLIS_PER_DAY;
                BugAssert.equal(CertRenewal.daysUntilExpiry(now, notAfter), 10L, "days left");
                BugAssert.equal(CertRenewal.status(now, notAfter), "RENEW");
                BugAssert.ok(CertRenewal.shouldRenew(now, notAfter), "renewal must trigger");`,
      },
      {
        name: "the renewal window boundary",
        isHidden: true,
        source: `                long now = 1543622400000L;
                long d = CertPolicy.MILLIS_PER_DAY;
                BugAssert.equal(CertRenewal.status(now, now + 30L * d), "RENEW", "exactly 30 days");
                BugAssert.equal(CertRenewal.status(now, now + 31L * d), "OK", "31 days");
                BugAssert.equal(CertRenewal.daysUntilExpiry(now, now + 30L * d - 3600000L), 29L, "29 days 23 hours");`,
      },
      {
        name: "one millisecond past expiry is expired",
        isHidden: true,
        source: `                long now = 1544054400000L;
                BugAssert.equal(CertRenewal.daysUntilExpiry(now, now - 1L), -1L, "floor, not truncation");
                BugAssert.equal(CertRenewal.status(now, now - 1L), "EXPIRED");
                BugAssert.ok(CertRenewal.shouldRenew(now, now - 1L), "an expired cert still needs renewing");`,
      },
      {
        name: "the day of expiry itself is still renewable",
        isHidden: true,
        source: `                long now = 1544054400000L;
                BugAssert.equal(CertRenewal.daysUntilExpiry(now, now), 0L);
                BugAssert.equal(CertRenewal.status(now, now + 1000L), "RENEW");`,
      },
    ],
    fixedFiles: {
      "CertRenewal.java": `class CertRenewal {
    // Whole days before the certificate expires; negative once it has.
    // Divide by a DAY, not an hour (an hour count read as days put every cert
    // 24x further from expiry than it was), and floor so a cert that expired
    // a millisecond ago is -1, not 0.
    static long daysUntilExpiry(long nowMillis, long notAfterMillis) {
        return Math.floorDiv(notAfterMillis - nowMillis, CertPolicy.MILLIS_PER_DAY);
    }

    static boolean shouldRenew(long nowMillis, long notAfterMillis) {
        return daysUntilExpiry(nowMillis, notAfterMillis) <= CertPolicy.RENEW_WINDOW_DAYS;
    }

    static String status(long nowMillis, long notAfterMillis) {
        long days = daysUntilExpiry(nowMillis, notAfterMillis);
        if (days < 0) return "EXPIRED";
        if (days <= CertPolicy.RENEW_WINDOW_DAYS) return "RENEW";
        return "OK";
    }
}`,
    },
  },

  {
    title: "Ghost in the Hostname Buffer",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Overflow", "Networking"],
    description: `Modelled on **GHOST** (CVE-2015-0235, disclosed by Qualys in January 2015): glibc's \`__nss_hostname_digits_dots\`, used by \`gethostbyname\`, answers numeric hostnames like \`"10.0.0.1"\` without a DNS lookup and lays the result out in a caller-supplied buffer. Its size calculation left out one pointer (\`sizeof(char *)\`), so a crafted numeric hostname could write a few bytes past the end of the buffer.

\`digitsdots.js\` reconstructs that path over a simulated byte buffer (\`membuf.js\`) that, like C, records an out-of-bounds write instead of stopping it.

Fix \`requiredSize\` and \`resolve\` so the buffer is sized for everything written into it and nothing is ever written past its end.`,
    bugReport: `**BUG-GHOST** · Priority: Critical (heap overflow) · Reported by: security

Layout written for a numeric host (see layout.js):
  [ address: ADDR_SIZE | h_addr_list pointer: PTR_SIZE | h_aliases pointer: PTR_SIZE | name bytes | NUL ]

requiredSize(name) = ADDR_SIZE + 2 * PTR_SIZE + name.length + 1
  requiredSize("10.0.0.1") -> 29

resolve(name, buf)
- a name that is not only digits and dots (or is empty) -> { ok: false, error: "NOT_NUMERIC" }
- buf.size < requiredSize(name) -> { ok: false, error: "ERANGE" } and NOTHING is written
- otherwise the layout is written and { ok: true, used: requiredSize(name) } returned
- buf.overflowed must never become true

Observed: a buffer 8 bytes smaller than needed passes the size check and the
name is written past its end.`,
    logs: `[resolver] gethostbyname("0000...0000") bufsize=1024 need=1032
[membuf] write at offset 1024 beyond size 1024`,
    files: [
      {
        filePath: "src/net/digitsdots.js",
        isEditable: true,
        language: "javascript",
        content: `var layout = require("./layout");

function isNumericHost(name) {
  return name.length > 0 && /^[0-9.]+$/.test(name);
}

function zeros(n) {
  var out = [];
  for (var i = 0; i < n; i++) out.push(0);
  return out;
}

exports.requiredSize = function (name) {
  return layout.ADDR_SIZE + layout.PTR_SIZE + name.length + 1;
};

exports.resolve = function (name, buf) {
  if (!isNumericHost(name)) return { ok: false, error: "NOT_NUMERIC" };
  if (buf.size < exports.requiredSize(name)) return { ok: false, error: "ERANGE" };

  var addr = [0, 0, 0, 0];
  var parts = name.split(".");
  for (var i = 0; i < 4 && i < parts.length; i++) addr[i] = Number(parts[i]) & 255;

  var at = buf.write(0, addr);
  at = buf.write(at, zeros(layout.PTR_SIZE));
  at = buf.write(at, zeros(layout.PTR_SIZE));
  var chars = [];
  for (var j = 0; j < name.length; j++) chars.push(name.charCodeAt(j));
  chars.push(0);
  at = buf.write(at, chars);
  return { ok: true, used: at };
};
`,
      },
      {
        filePath: "src/net/layout.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A numeric hostname ("1.2.3.4") is answered without a DNS query. The result is
laid out in the caller's buffer the way the C struct expects it:

  [ in_addr | h_addr_list pointer | h_aliases pointer | hostname | NUL ]

Sizes are for a 64-bit build.
*/
exports.ADDR_SIZE = 4;
exports.PTR_SIZE = 8;
`,
      },
      {
        filePath: "src/net/membuf.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A fixed-size byte buffer. Like memory in C, nothing stops a write past the end:
the bytes land in whatever sits next to the buffer. We only record that it
happened, so the tests can see it.
*/
exports.create = function (size) {
  var buf = { size: size, bytes: [], overflowed: false };
  buf.write = function (offset, values) {
    for (var i = 0; i < values.length; i++) {
      if (offset + i >= size) buf.overflowed = true;
      buf.bytes[offset + i] = values[i];
    }
    return offset + values.length;
  };
  return buf;
};
`,
      },
    ],
    tests: [
      {
        name: "a numeric host fits in a roomy buffer",
        isHidden: false,
        source: `var d = require("src/net/digitsdots");
var buf = require("src/net/membuf").create(64);
assert.equal(d.resolve("10.0.0.1", buf), { ok: true, used: 29 });
assert.equal(buf.overflowed, false);`,
      },
      {
        name: "the size covers both pointers",
        isHidden: false,
        source: `var d = require("src/net/digitsdots");
assert.equal(d.requiredSize("10.0.0.1"), 29, "4 + 8 + 8 + 8 + 1");
assert.equal(d.requiredSize("1.2.3.4.5.6.7.8"), 36);`,
      },
      {
        name: "a buffer of exactly the required size is enough",
        isHidden: true,
        source: `var d = require("src/net/digitsdots");
var buf = require("src/net/membuf").create(29);
assert.equal(d.resolve("10.0.0.1", buf), { ok: true, used: 29 });
assert.equal(buf.overflowed, false, "not one byte past the end");`,
      },
      {
        name: "a buffer one pointer short is refused untouched",
        isHidden: true,
        source: `var d = require("src/net/digitsdots");
var buf = require("src/net/membuf").create(21);
assert.equal(d.resolve("10.0.0.1", buf), { ok: false, error: "ERANGE" });
assert.equal(buf.overflowed, false, "no overflow");
assert.equal(buf.bytes.length, 0, "nothing written on ERANGE");
var buf2 = require("src/net/membuf").create(28);
assert.equal(d.resolve("10.0.0.1", buf2), { ok: false, error: "ERANGE" }, "one byte short");`,
      },
      {
        name: "a long numeric name cannot overflow",
        isHidden: true,
        source: `var d = require("src/net/digitsdots");
var name = "";
for (var i = 0; i < 100; i++) name += "0";
var buf = require("src/net/membuf").create(120);
assert.equal(d.resolve(name, buf), { ok: false, error: "ERANGE" });
assert.equal(buf.overflowed, false);`,
      },
      {
        name: "non-numeric names take the DNS path",
        isHidden: true,
        source: `var d = require("src/net/digitsdots");
var buf = require("src/net/membuf").create(64);
assert.equal(d.resolve("example.com", buf), { ok: false, error: "NOT_NUMERIC" });
assert.equal(d.resolve("", buf), { ok: false, error: "NOT_NUMERIC" });`,
      },
    ],
    fixedFiles: {
      "src/net/digitsdots.js": `var layout = require("./layout");

function isNumericHost(name) {
  return name.length > 0 && /^[0-9.]+$/.test(name);
}

function zeros(n) {
  var out = [];
  for (var i = 0; i < n; i++) out.push(0);
  return out;
}

// Two pointers are written (h_addr_list AND h_aliases); the GHOST sizing
// counted one, so the last PTR_SIZE bytes of the name ran off the buffer.
exports.requiredSize = function (name) {
  return layout.ADDR_SIZE + 2 * layout.PTR_SIZE + name.length + 1;
};

exports.resolve = function (name, buf) {
  if (!isNumericHost(name)) return { ok: false, error: "NOT_NUMERIC" };
  var need = exports.requiredSize(name);
  if (buf.size < need) return { ok: false, error: "ERANGE" };

  var addr = [0, 0, 0, 0];
  var parts = name.split(".");
  for (var i = 0; i < 4 && i < parts.length; i++) addr[i] = Number(parts[i]) & 255;

  var at = buf.write(0, addr);
  at = buf.write(at, zeros(layout.PTR_SIZE));
  at = buf.write(at, zeros(layout.PTR_SIZE));
  var chars = [];
  for (var j = 0; j < name.length; j++) chars.push(name.charCodeAt(j));
  chars.push(0);
  at = buf.write(at, chars);
  return { ok: true, used: at };
};
`,
    },
  },

  {
    title: "The Backslash at the End of the Line",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Security", "Overflow", "Parsing"],
    description: `Modelled on **Baron Samedit** (CVE-2021-3156, disclosed by Qualys in January 2021): when sudo ran in shell mode it unescaped backslashes in the command-line arguments into a heap buffer sized from the argument's length. An argument ending in a single backslash made the loop step over the backslash **and the string's NUL terminator**, so it kept copying the next string in memory past the end of the buffer — a heap overflow any local user could trigger, present in sudo for about ten years.

\`unescape.py\` reconstructs the copy loop over a simulated heap (\`heap.py\`) in which strings sit back to back, each ended by a NUL, and the destination buffer records an out-of-bounds write the way C would silently allow it.

Fix \`unescape\` so it never reads past the argument's terminator or writes past its buffer.`,
    bugReport: `**BUG-SAMEDIT** · Priority: Critical (local privilege escalation) · Reported by: security

unescape(mem, start) copies the NUL-terminated argument at mem[start] into a
FixedBuffer of capacity strlen + 1 and returns that buffer:
- a backslash followed by any character copies just that character
  ("a\\ b" -> "a b", "\\\\" -> one backslash)
- a backslash that is the LAST character of the argument (immediately before
  its NUL) is copied literally as a backslash
- the copy ends with a single NUL; nothing after the argument's own
  terminator is ever read or written
- buf.overflowed must stay False; buf.text() is the unescaped argument

Observed: an argument ending in a backslash pulls the neighbouring heap
string into the buffer and writes past its end.`,
    logs: `[sudoedit] argv[1]="echo\\" strlen=5 capacity=6
[heap] FixedBuffer(6) write #7 beyond capacity
[heap] FixedBuffer(6) wrote 15 chars`,
    files: [
      {
        filePath: "src/sudo/unescape.py",
        isEditable: true,
        language: "python",
        content: `heap = bug_require("src/sudo/heap.py")

BACKSLASH = chr(92)


def strlen(mem, start):
    n = 0
    while mem[start + n] != heap.NUL:
        n += 1
    return n


def unescape(mem, start):
    """Copies the argument at mem[start] into a fresh buffer, dropping the
    backslash that escapes each shell metacharacter."""
    buf = heap.FixedBuffer(strlen(mem, start) + 1)
    i = start
    while mem[i] != heap.NUL:
        if mem[i] == BACKSLASH:
            i += 1
        buf.put(mem[i])
        i += 1
    buf.put(heap.NUL)
    return buf
`,
      },
      {
        filePath: "src/sudo/heap.py",
        isEditable: false,
        language: "python",
        content: `# The process heap as sudo's C code sees it: NUL-terminated strings laid out
# back to back. Reading past a terminator reads the NEXT string.
NUL = chr(0)


def layout(strings):
    """Returns (mem, starts): one list of characters holding every string
    followed by its NUL, and the offset where each string begins."""
    mem = []
    starts = []
    for s in strings:
        starts.append(len(mem))
        mem.extend(list(s))
        mem.append(NUL)
    return mem, starts


class FixedBuffer:
    """A heap buffer of \`capacity\` characters. Like C, it does not stop an
    out-of-bounds write -- it only records that one happened."""

    def __init__(self, capacity):
        self.capacity = capacity
        self.data = []
        self.overflowed = False

    def put(self, ch):
        if len(self.data) >= self.capacity:
            self.overflowed = True
        self.data.append(ch)

    def text(self):
        """The string as C would read it: up to the first NUL."""
        out = []
        for ch in self.data:
            if ch == NUL:
                break
            out.append(ch)
        return "".join(out)
`,
      },
    ],
    tests: [
      {
        name: "an escaped space is unescaped",
        isHidden: false,
        source: `heap = bug_require("src/sudo/heap.py")
u = bug_require("src/sudo/unescape.py")
BS = chr(92)
mem, starts = heap.layout(["a" + BS + " b", "NEXT"])
buf = u.unescape(mem, starts[0])
assert_.equal(buf.text(), "a b")
assert_.equal(buf.overflowed, False)`,
      },
      {
        name: "a trailing backslash stays inside the argument",
        isHidden: false,
        source: `heap = bug_require("src/sudo/heap.py")
u = bug_require("src/sudo/unescape.py")
BS = chr(92)
mem, starts = heap.layout(["echo" + BS, "SECRET=hunter2"])
buf = u.unescape(mem, starts[0])
assert_.equal(buf.overflowed, False, "must not write past the buffer")
assert_.equal(buf.text(), "echo" + BS, "the lone backslash is literal")`,
      },
      {
        name: "an escaped backslash becomes one backslash",
        isHidden: true,
        source: `heap = bug_require("src/sudo/heap.py")
u = bug_require("src/sudo/unescape.py")
BS = chr(92)
mem, starts = heap.layout(["x" + BS + BS + "y", "NEXT"])
buf = u.unescape(mem, starts[0])
assert_.equal(buf.text(), "x" + BS + "y")
assert_.equal(buf.overflowed, False)`,
      },
      {
        name: "an argument that is only a backslash",
        isHidden: true,
        source: `heap = bug_require("src/sudo/heap.py")
u = bug_require("src/sudo/unescape.py")
BS = chr(92)
mem, starts = heap.layout([BS, "AAAAAAAAAAAAAAAA"])
buf = u.unescape(mem, starts[0])
assert_.equal(buf.text(), BS)
assert_.equal(buf.overflowed, False)
assert_.equal(len(buf.data), 2, "the backslash and one NUL")`,
      },
      {
        name: "the neighbouring string is never copied",
        isHidden: true,
        source: `heap = bug_require("src/sudo/heap.py")
u = bug_require("src/sudo/unescape.py")
BS = chr(92)
mem, starts = heap.layout(["ls", "-l" + BS, "PATH=/secret"])
buf = u.unescape(mem, starts[1])
assert_.ok("P" not in buf.data, "nothing from the next string")
assert_.equal(buf.text(), "-l" + BS)
first = u.unescape(mem, starts[0])
assert_.equal(first.text(), "ls")`,
      },
    ],
    fixedFiles: {
      "src/sudo/unescape.py": `heap = bug_require("src/sudo/heap.py")

BACKSLASH = chr(92)


def strlen(mem, start):
    n = 0
    while mem[start + n] != heap.NUL:
        n += 1
    return n


def unescape(mem, start):
    """Copies the argument at mem[start] into a fresh buffer, dropping the
    backslash that escapes each shell metacharacter."""
    buf = heap.FixedBuffer(strlen(mem, start) + 1)
    i = start
    while mem[i] != heap.NUL:
        # Only treat the backslash as an escape when something follows it.
        # Stepping over a trailing backslash also stepped over the NUL, and
        # the loop copied the next heap string past the end of the buffer.
        if mem[i] == BACKSLASH and mem[i + 1] != heap.NUL:
            i += 1
        buf.put(mem[i])
        i += 1
    buf.put(heap.NUL)
    return buf
`,
    },
  },

  {
    title: "Refunds for Money Never Taken",
    difficulty: "easy",
    category: "database",
    language: "javascript",
    tags: ["Money", "Validation", "State"],
    description: `Modelled on **Revolut's US payments flaw** (2022, reported by the Financial Times in 2023): a problem in how Revolut's US card system handled certain declined transactions meant refunds were issued **from Revolut's own funds** for payments whose money had never actually left the customer's account. Criminals exploited it before it was closed; the reported losses were around $20 million.

\`reversal.js\` credits a customer when the card network reports a transaction as failed or reversed. It credits every reversal it is told about.

Fix \`reverse\` so a refund only ever returns money that was actually taken, once.`,
    bugReport: `**BUG-REV-US** · Priority: Critical (direct financial loss) · Reported by: finance

reverse(store, txId) returns the number of cents credited:
- unknown txId -> 0, nothing changes
- tx.debited is false (declined / failed before settlement: the customer
  never lost the money) -> 0, nothing changes (tx.refunded stays as it was)
- tx.refunded already true -> 0, nothing changes
- otherwise credit store.accounts[tx.account] with tx.amount, set
  tx.refunded = true, and return tx.amount

Observed: declined transactions are "refunded" — the customer's balance goes
up by money they never spent, and the same reversal pays out again when the
network resends it.`,
    logs: `[card-us] tx=tx_991 status=DECLINED debited=false
[reversal] tx_991 credited 50000 to acct_17
[recon] ledger short by 50000 against settlement file`,
    files: [
      {
        filePath: "src/payments/reversal.js",
        isEditable: true,
        language: "javascript",
        content: `// Handles a reversal notice from the card network.
exports.reverse = function (store, txId) {
  var tx = store.txs[txId];
  if (!tx) return 0;
  store.accounts[tx.account] += tx.amount;
  tx.refunded = true;
  return tx.amount;
};
`,
      },
      {
        filePath: "src/payments/store.js",
        isEditable: false,
        language: "javascript",
        content: `/*
store.accounts: { accountId: balance in cents }
store.txs:      { txId: { account, amount (cents), debited, refunded } }

debited is true only once settlement confirmed the customer's money actually
left their account. A declined or failed authorisation never sets it — and
a refund of a transaction that was never debited is paid from our own money.
*/
exports.create = function (accounts, txs) {
  return { accounts: accounts, txs: txs };
};
`,
      },
    ],
    tests: [
      {
        name: "a settled charge is refunded",
        isHidden: false,
        source: `var r = require("src/payments/reversal");
var s = require("src/payments/store").create({ a1: 1000 }, { t1: { account: "a1", amount: 2500, debited: true, refunded: false } });
assert.equal(r.reverse(s, "t1"), 2500);
assert.equal(s.accounts.a1, 3500);
assert.equal(s.txs.t1.refunded, true);`,
      },
      {
        name: "a declined charge is never refunded",
        isHidden: false,
        source: `var r = require("src/payments/reversal");
var s = require("src/payments/store").create({ a1: 1000 }, { t2: { account: "a1", amount: 50000, debited: false, refunded: false } });
assert.equal(r.reverse(s, "t2"), 0, "nothing was taken, nothing is returned");
assert.equal(s.accounts.a1, 1000);`,
      },
      {
        name: "a reversal resent by the network pays once",
        isHidden: true,
        source: `var r = require("src/payments/reversal");
var s = require("src/payments/store").create({ a1: 0 }, { t1: { account: "a1", amount: 700, debited: true, refunded: false } });
r.reverse(s, "t1");
assert.equal(r.reverse(s, "t1"), 0, "second notice");
assert.equal(s.accounts.a1, 700);`,
      },
      {
        name: "unknown transactions change nothing",
        isHidden: true,
        source: `var r = require("src/payments/reversal");
var s = require("src/payments/store").create({ a1: 10 }, {});
assert.equal(r.reverse(s, "nope"), 0);
assert.equal(s.accounts, { a1: 10 });`,
      },
      {
        name: "a declined charge is left untouched",
        isHidden: true,
        source: `var r = require("src/payments/reversal");
var s = require("src/payments/store").create({ a1: 1000 }, { t2: { account: "a1", amount: 300, debited: false, refunded: false } });
r.reverse(s, "t2");
assert.equal(s.txs.t2, { account: "a1", amount: 300, debited: false, refunded: false });`,
      },
    ],
    fixedFiles: {
      "src/payments/reversal.js": `// Handles a reversal notice from the card network.
exports.reverse = function (store, txId) {
  var tx = store.txs[txId];
  if (!tx) return 0;
  // Only return money we actually took, and only once. Crediting a declined
  // (never-debited) transaction pays the customer out of our own funds, and a
  // resent notice would pay again.
  if (!tx.debited || tx.refunded) return 0;
  store.accounts[tx.account] += tx.amount;
  tx.refunded = true;
  return tx.amount;
};
`,
    },
  },

  {
    title: "The Deposits Nobody Reported",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Validation", "Money", "Config"],
    description: `Modelled on the **Commonwealth Bank of Australia AUSTRAC case** (filed August 2017): AUSTRAC alleged that CBA's Intelligent Deposit Machines failed to send **53,506 threshold transaction reports** for cash deposits of $10,000 or more between 2012 and 2015. CBA attributed the failure to a coding error introduced by a 2012 software update to the machines. The bank later agreed to a A$700 million penalty. This project reconstructs that kind of error: the update gave machine deposits their own transaction code, and the reporting rule still keys on the old one.

\`ttr.py\` decides which transactions need a threshold transaction report (TTR). Deposit-machine cash deposits carry their own code in \`codes.py\`.

Fix \`needs_ttr\` so every cash deposit at or above the threshold is reported, whichever channel it came through.`,
    bugReport: `**BUG-TTR** · Priority: Critical (regulatory) · Reported by: financial crime compliance

needs_ttr(txn) is True exactly when:
- txn["type"] is a cash-deposit code — any code in codes.CASH_DEPOSIT_CODES
  (teller AND deposit-machine), and
- txn["amount_cents"] >= codes.THRESHOLD_CENTS (AUD 10,000.00 exactly counts)

Card payments, transfers and anything else never need a TTR.
reports_due(txns) returns the ids of the transactions needing one, in input order.

Observed: cash deposits made at deposit machines are never reported.`,
    logs: `[aml] batch 2015-09-01 txns=48211 ttr_due=3
[aml] idm=IDM-0412 type=CD07 amount=2000000 ttr=false`,
    files: [
      {
        filePath: "src/aml/ttr.py",
        isEditable: true,
        language: "python",
        content: `codes = bug_require("src/aml/codes.py")


def needs_ttr(txn):
    return (
        txn["type"] == codes.TELLER_CASH_DEPOSIT
        and txn["amount_cents"] >= codes.THRESHOLD_CENTS
    )


def reports_due(txns):
    return [t["id"] for t in txns if needs_ttr(t)]
`,
      },
      {
        filePath: "src/aml/codes.py",
        isEditable: false,
        language: "python",
        content: `# Transaction type codes. Deposit-machine (IDM) cash deposits have their own
# code; teller cash deposits keep the original one.
TELLER_CASH_DEPOSIT = "CD01"
IDM_CASH_DEPOSIT = "CD07"
CARD_PAYMENT = "CP01"
TRANSFER = "TR01"

CASH_DEPOSIT_CODES = (TELLER_CASH_DEPOSIT, IDM_CASH_DEPOSIT)

# AUD 10,000.00 — reports are due at or above this amount.
THRESHOLD_CENTS = 1000000
`,
      },
    ],
    tests: [
      {
        name: "a teller cash deposit of $10,000 is reported",
        isHidden: false,
        source: `t = bug_require("src/aml/ttr.py")
assert_.equal(t.needs_ttr({"id": "a", "type": "CD01", "amount_cents": 1000000}), True)`,
      },
      {
        name: "a deposit-machine cash deposit over the threshold is reported",
        isHidden: false,
        source: `t = bug_require("src/aml/ttr.py")
assert_.equal(t.needs_ttr({"id": "b", "type": "CD07", "amount_cents": 2000000}), True, "IDM deposits count too")`,
      },
      {
        name: "just under the threshold is not reported",
        isHidden: true,
        source: `t = bug_require("src/aml/ttr.py")
assert_.equal(t.needs_ttr({"id": "c", "type": "CD07", "amount_cents": 999999}), False)
assert_.equal(t.needs_ttr({"id": "d", "type": "CD07", "amount_cents": 1000000}), True, "exactly $10,000")`,
      },
      {
        name: "non-cash transactions never need a TTR",
        isHidden: true,
        source: `t = bug_require("src/aml/ttr.py")
assert_.equal(t.needs_ttr({"id": "e", "type": "TR01", "amount_cents": 5000000}), False)
assert_.equal(t.needs_ttr({"id": "f", "type": "CP01", "amount_cents": 5000000}), False)`,
      },
      {
        name: "a mixed batch lists every due report in order",
        isHidden: true,
        source: `t = bug_require("src/aml/ttr.py")
batch = [
    {"id": "1", "type": "CD07", "amount_cents": 1500000},
    {"id": "2", "type": "TR01", "amount_cents": 1500000},
    {"id": "3", "type": "CD01", "amount_cents": 1000000},
    {"id": "4", "type": "CD07", "amount_cents": 50000},
    {"id": "5", "type": "CD07", "amount_cents": 1000000},
]
assert_.equal(t.reports_due(batch), ["1", "3", "5"])`,
      },
    ],
    fixedFiles: {
      "src/aml/ttr.py": `codes = bug_require("src/aml/codes.py")


def needs_ttr(txn):
    # Key the rule on the whole family of cash-deposit codes, not one code:
    # when deposit machines got their own code, a check against the teller
    # code alone silently stopped reporting every machine deposit.
    return (
        txn["type"] in codes.CASH_DEPOSIT_CODES
        and txn["amount_cents"] >= codes.THRESHOLD_CENTS
    )


def reports_due(txns):
    return [t["id"] for t in txns if needs_ttr(t)]
`,
    },
  },

  {
    title: "When 65536 Read as Zero",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Rendering", "Overflow"],
    description: `Modelled on the **Excel 2007 display bug** (September 2007): typing \`=850*77.1\` showed **100000** instead of 65535. The value in the cell was right; the code that turned certain floating-point results lying a hair below 65535 or 65536 into text for the grid printed the wrong digits. Microsoft confirmed the problem was confined to how a handful of values were displayed and shipped a fix within weeks.

This project reconstructs a formatter with the same kind of fault in the same place: a fast path for near-integer values that memoises digit strings in a 16-bit slot (\`cell16.js\`). Its range check looks at the value *before* it is rounded.

Fix \`display\` so every near-integer value shows the integer it rounds to.`,
    bugReport: `**BUG-XL-65535** · Priority: High · Reported by: a customer's quarterly report

display(x) returns the text the grid shows for a numeric cell:
- if x is within 1e-9 of an integer n, show String(n)
  (display(850 * 77.1) -> "65535", display(65535.99999999999) -> "65536")
- otherwise show String(Math.round(x * 100) / 100)   (3.14159 -> "3.14")
- cell16.render may be used as a fast path, but only for integers n with
  0 <= n <= cell16.MAX (65535); everything else goes through general()

Observed: values just below 65536 display as "0".`,
    logs: `[grid] B7 value=65535.99999999999 text="0"
[grid] B8 value=65536 text="65536"`,
    files: [
      {
        filePath: "src/grid/format.js",
        isEditable: true,
        language: "javascript",
        content: `var cell16 = require("./cell16");
var EPS = 1e-9;

// Text shown in the grid for a numeric cell value.
exports.display = function (x) {
  if (x >= 0 && x < cell16.MAX + 1) {
    var whole = Math.floor(x);
    var frac = x - whole;
    if (frac < EPS) return cell16.render(whole);
    if (1 - frac < EPS) return cell16.render(whole + 1);
  }
  return exports.general(x);
};

exports.general = function (x) {
  var n = Math.round(x);
  if (Math.abs(x - n) < EPS) return String(n);
  return String(Math.round(x * 100) / 100);
};
`,
      },
      {
        filePath: "src/grid/cell16.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Fast path for small integers: the render cache keys its memoised digit strings
by a 16-bit slot, so it can only hold 0..MAX.
*/
var slot = new Uint16Array(1);
var memo = {};

exports.MAX = 65535;

exports.render = function (n) {
  slot[0] = n;
  var key = slot[0];
  if (memo[key] === undefined) memo[key] = String(key);
  return memo[key];
};
`,
      },
    ],
    tests: [
      {
        name: "ordinary values display normally",
        isHidden: false,
        source: `var f = require("src/grid/format");
assert.equal(f.display(850 * 77.1), "65535", "the famous formula");
assert.equal(f.display(12), "12");
assert.equal(f.display(3.14159), "3.14");`,
      },
      {
        name: "a value just below 65536 shows 65536",
        isHidden: false,
        source: `var f = require("src/grid/format");
assert.equal(f.display(65535.99999999999), "65536");`,
      },
      {
        name: "the 16-bit boundary itself",
        isHidden: true,
        source: `var f = require("src/grid/format");
assert.equal(f.display(65535), "65535");
assert.equal(f.display(65536), "65536");
assert.equal(f.display(65535.9999999999), "65536", "1e-10 below");`,
      },
      {
        name: "larger near-integers take the general path",
        isHidden: true,
        source: `var f = require("src/grid/format");
assert.equal(f.display(131071.99999999999), "131072");
assert.equal(f.display(65536.00000000001), "65536");`,
      },
      {
        name: "near-integers below the boundary round up correctly",
        isHidden: true,
        source: `var f = require("src/grid/format");
assert.equal(f.display(0.1 + 0.2), "0.3");
assert.equal(f.display(254.99999999999997), "255");
assert.equal(f.display(99.99999999999999), "100");`,
      },
    ],
    fixedFiles: {
      "src/grid/format.js": `var cell16 = require("./cell16");
var EPS = 1e-9;

// Text shown in the grid for a numeric cell value.
exports.display = function (x) {
  // Round first, then range-check the integer we will actually render: a
  // value a hair below 65536 rounds UP to 65536, which does not fit the
  // 16-bit slot and wrapped to 0 when the check looked at x instead.
  var n = Math.round(x);
  if (Math.abs(x - n) < EPS && n >= 0 && n <= cell16.MAX) return cell16.render(n);
  return exports.general(x);
};

exports.general = function (x) {
  var n = Math.round(x);
  if (Math.abs(x - n) < EPS) return String(n);
  return String(Math.round(x * 100) / 100);
};
`,
    },
  },

  {
    title: "The Thruster That Spun It Faster",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Config", "State", "Validation"],
    description: `Modelled on the loss of **JAXA's Hitomi (ASTRO-H)** X-ray observatory in March 2016. JAXA's investigation found that the attitude system wrongly believed the craft was rotating and tried to correct it, which made it actually rotate; when it then entered safe mode, the thrusters fired using **incorrect parameters that had been uploaded after a software change** and not properly checked. The firing increased the spin instead of stopping it, and parts of the spacecraft, including the solar array paddles, broke off.

This project is a reconstruction. \`safehold.py\` damps body rates by firing the thruster that produces the opposing torque, looked up in a hand-entered command table. The thruster geometry in \`geometry.py\` (mounting point \`r\`, thrust direction \`f\`, torque = r × f) is the ground truth; \`sim.py\` applies the resulting torque.

Fix the command table so every entry matches the geometry and safe-hold removes spin on every axis.`,
    bugReport: `**BUG-ASTRO-H** · Priority: Critical (loss of vehicle) · Reported by: attitude control team

COMMAND_TABLE maps a demanded torque ("+x", "-x", "+y", "-y", "+z", "-z") to the
thruster that produces it: geometry.torque(COMMAND_TABLE[key]) must be a unit
vector along exactly that axis, with that sign.

select(rate) returns, in x, y, z order, the thrusters to fire for one pulse:
- axes with abs(rate) <= DEADBAND (0.05 rad/s) fire nothing
- otherwise fire the thruster demanded by the OPPOSITE sign of that axis'
  rate (rate > 0 demands "-axis", rate < 0 demands "+axis")

Running sim.run(rate, select, pulses) long enough must bring every axis
inside the deadband.

Observed: a z-axis spin gets faster with every safe-hold pulse.`,
    logs: `[aocs] SAFE_HOLD entered rate=(0.00, 0.00, 0.50) rad/s
[aocs] pulse 5 rate_z=1.00
[aocs] pulse 10 rate_z=1.50 — structural limit exceeded`,
    files: [
      {
        filePath: "src/aocs/safehold.py",
        isEditable: true,
        language: "python",
        content: `# Thruster selection for safe-hold rate damping.
# Key: the torque the controller demands.
COMMAND_TABLE = {
    "+x": "RCS-2",
    "-x": "RCS-1",
    "+y": "RCS-3",
    "-y": "RCS-4",
    "+z": "RCS-6",
    "-z": "RCS-5",
}

DEADBAND = 0.05
AXES = ["x", "y", "z"]


def select(rate):
    """Thrusters to fire this pulse to oppose the measured body rate."""
    fired = []
    for i in range(3):
        if abs(rate[i]) <= DEADBAND:
            continue
        demand = ("-" if rate[i] > 0 else "+") + AXES[i]
        fired.append(COMMAND_TABLE[demand])
    return fired
`,
      },
      {
        filePath: "src/aocs/geometry.py",
        isEditable: false,
        language: "python",
        content: `# Reaction-control thrusters: mounting point r and thrust direction f in
# the body frame. The torque a thruster produces is r x f.
THRUSTERS = {
    "RCS-1": {"r": [0, 0, 1], "f": [0, 1, 0]},
    "RCS-2": {"r": [0, 0, 1], "f": [0, -1, 0]},
    "RCS-3": {"r": [0, 0, 1], "f": [1, 0, 0]},
    "RCS-4": {"r": [0, 0, 1], "f": [-1, 0, 0]},
    "RCS-5": {"r": [1, 0, 0], "f": [0, 1, 0]},
    "RCS-6": {"r": [1, 0, 0], "f": [0, -1, 0]},
}


def cross(a, b):
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]


def torque(name):
    t = THRUSTERS[name]
    return cross(t["r"], t["f"])
`,
      },
      {
        filePath: "src/aocs/sim.py",
        isEditable: false,
        language: "python",
        content: `geometry = bug_require("src/aocs/geometry.py")

# Change in body rate (rad/s) per pulse per unit of torque.
GAIN = 0.1


def apply(rate, fired):
    out = list(rate)
    for name in fired:
        t = geometry.torque(name)
        for i in range(3):
            out[i] += GAIN * t[i]
    return out


def run(rate, controller, pulses):
    for _ in range(pulses):
        rate = apply(rate, controller(rate))
    return rate
`,
      },
    ],
    tests: [
      {
        name: "safe-hold damps an x-axis spin",
        isHidden: false,
        source: `sim = bug_require("src/aocs/sim.py")
s = bug_require("src/aocs/safehold.py")
r = sim.run([0.5, 0.0, 0.0], s.select, 10)
assert_.ok(abs(r[0]) <= s.DEADBAND, "x rate should be inside the deadband, got " + str(r[0]))`,
      },
      {
        name: "safe-hold damps a z-axis spin",
        isHidden: false,
        source: `sim = bug_require("src/aocs/sim.py")
s = bug_require("src/aocs/safehold.py")
r = sim.run([0.0, 0.0, 0.5], s.select, 10)
assert_.ok(abs(r[2]) <= s.DEADBAND, "z rate should be inside the deadband, got " + str(r[2]))`,
      },
      {
        name: "every table entry matches the thruster geometry",
        isHidden: true,
        source: `geo = bug_require("src/aocs/geometry.py")
s = bug_require("src/aocs/safehold.py")
for key in ["+x", "-x", "+y", "-y", "+z", "-z"]:
    sign = 1 if key[0] == "+" else -1
    axis = "xyz".index(key[1])
    want = [0, 0, 0]
    want[axis] = sign
    assert_.equal(geo.torque(s.COMMAND_TABLE[key]), want, key)`,
      },
      {
        name: "a tumble on all three axes is stopped",
        isHidden: true,
        source: `sim = bug_require("src/aocs/sim.py")
s = bug_require("src/aocs/safehold.py")
r = sim.run([0.3, -0.4, -0.35], s.select, 12)
for i in range(3):
    assert_.ok(abs(r[i]) <= s.DEADBAND, "axis " + str(i) + " = " + str(r[i]))`,
      },
      {
        name: "nothing fires inside the deadband, and z is opposed",
        isHidden: true,
        source: `s = bug_require("src/aocs/safehold.py")
assert_.equal(s.select([0.01, -0.05, 0.0]), [])
geo = bug_require("src/aocs/geometry.py")
fired = s.select([0.0, 0.0, -0.3])
assert_.equal(len(fired), 1)
assert_.equal(geo.torque(fired[0])[2], 1, "a negative z rate needs +z torque")`,
      },
    ],
    fixedFiles: {
      "src/aocs/safehold.py": `# Thruster selection for safe-hold rate damping.
# Key: the torque the controller demands. Each entry is checked against
# geometry.torque (r x f): RCS-5 gives +z and RCS-6 gives -z. The z pair had
# been entered the wrong way round, so every "damping" pulse added spin.
COMMAND_TABLE = {
    "+x": "RCS-2",
    "-x": "RCS-1",
    "+y": "RCS-3",
    "-y": "RCS-4",
    "+z": "RCS-5",
    "-z": "RCS-6",
}

DEADBAND = 0.05
AXES = ["x", "y", "z"]


def select(rate):
    """Thrusters to fire this pulse to oppose the measured body rate."""
    fired = []
    for i in range(3):
        if abs(rate[i]) <= DEADBAND:
            continue
        demand = ("-" if rate[i] > 0 else "+") + AXES[i]
        fired.append(COMMAND_TABLE[demand])
    return fired
`,
    },
  },

  {
    title: "The Player That Wore Out Disks",
    difficulty: "hard",
    category: "database",
    language: "javascript",
    tags: ["Caching", "Limits", "State"],
    description: `Modelled on the **Spotify desktop client disk-write reports** of November 2016: users noticed the app writing tens to hundreds of gigabytes a day to disk even while idle — a real concern for SSD lifespan. The writes were traced to the client's local database being rewritten over and over; Spotify shipped a fix in an update later that month.

\`store.js\` is a reconstruction: a small persistent key/value cache that rewrites its entire snapshot file on every change. The file system is injected (\`fakefs.js\` counts full rewrites and appends), so you can see exactly what it does.

Rewrite \`store.js\` to log changes by appending and only compact into a snapshot after enough changes have accumulated, exactly as the spec describes.`,
    bugReport: `**BUG-SSD-WRITES** · Priority: High · Reported by: community forum

open(fs) -> { get, set }. Paths and limits are in config.js.

Loading: state = JSON.parse(fs.readFile(SNAPSHOT)) if it exists (else {}),
then every non-empty line of fs.readFile(LOG) (if any) is a JSON [key, value]
applied in order. The count of changes since the last compaction starts at
the number of log lines replayed.

get(key) -> the value, or null if never set.

set(key, value) (values are strings, numbers or booleans):
- if state already holds exactly that value (===) -> no I/O at all
- otherwise update state and fs.appendFile(LOG, JSON.stringify([key, value]) + "\\n")
  and count one change
- when the count reaches COMPACT_AFTER, compact:
  fs.writeFile(SNAPSHOT, JSON.stringify(state)) then fs.writeFile(LOG, "")
  and reset the count to 0

So 50 changes = 50 appends and 0 rewrites; 100 changes = 100 appends and 2
rewrites (snapshot + log truncate); 250 changes = 4 rewrites.

Observed: every single set rewrites the full snapshot.`,
    logs: `[storage] state.json rewritten (4.1 MB) reason=set
[storage] state.json rewritten (4.1 MB) reason=set
[disk] 81 GB written in the last 24h by the desktop client`,
    files: [
      {
        filePath: "src/cache/store.js",
        isEditable: true,
        language: "javascript",
        content: `var config = require("./config");

exports.open = function (fs) {
  var state = {};
  var snap = fs.readFile(config.SNAPSHOT);
  if (snap) state = JSON.parse(snap);

  function persist() {
    fs.writeFile(config.SNAPSHOT, JSON.stringify(state));
  }

  return {
    get: function (key) {
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : null;
    },
    set: function (key, value) {
      state[key] = value;
      persist();
    }
  };
};
`,
      },
      {
        filePath: "src/cache/config.js",
        isEditable: false,
        language: "javascript",
        content: `exports.SNAPSHOT = "cache/state.json";
exports.LOG = "cache/state.log";
// Changes appended to the log before it is folded into a fresh snapshot.
exports.COMPACT_AFTER = 100;
`,
      },
      {
        filePath: "src/cache/fakefs.js",
        isEditable: false,
        language: "javascript",
        content: `/*
In-memory file system that counts what was written. writeFile replaces the
whole file (the expensive kind of write); appendFile adds to the end.
*/
exports.create = function () {
  var files = {};
  var fs = { files: files, rewrites: 0, appends: 0, bytesWritten: 0 };
  fs.writeFile = function (path, data) {
    files[path] = data;
    fs.rewrites++;
    fs.bytesWritten += data.length;
  };
  fs.appendFile = function (path, data) {
    files[path] = (files[path] || "") + data;
    fs.appends++;
    fs.bytesWritten += data.length;
  };
  fs.readFile = function (path) {
    return files[path] === undefined ? null : files[path];
  };
  return fs;
};
`,
      },
    ],
    tests: [
      {
        name: "values survive a reopen",
        isHidden: false,
        source: `var store = require("src/cache/store");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
s.set("volume", 70);
s.set("shuffle", true);
assert.equal(s.get("volume"), 70);
assert.equal(s.get("missing"), null);
var again = store.open(fs);
assert.equal([again.get("volume"), again.get("shuffle")], [70, true]);`,
      },
      {
        name: "small changes are appended, not rewritten",
        isHidden: false,
        source: `var store = require("src/cache/store");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
for (var i = 0; i < 50; i++) s.set("track:" + i, "pos" + i);
assert.equal(fs.rewrites, 0, "no full rewrites for 50 changes");
assert.equal(fs.appends, 50);`,
      },
      {
        name: "compaction happens every COMPACT_AFTER changes",
        isHidden: true,
        source: `var store = require("src/cache/store");
var config = require("src/cache/config");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
for (var i = 0; i < 100; i++) s.set("k" + i, i);
assert.equal(fs.rewrites, 2, "snapshot + log truncate");
assert.equal(fs.files[config.LOG], "");
assert.equal(JSON.parse(fs.files[config.SNAPSHOT]).k99, 99);
for (var j = 0; j < 150; j++) s.set("k" + j, "v" + j);
assert.equal(fs.rewrites, 4, "250 changes -> two compactions");`,
      },
      {
        name: "setting the same value again writes nothing",
        isHidden: true,
        source: `var store = require("src/cache/store");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
s.set("volume", 70);
s.set("volume", 70);
s.set("volume", 70);
assert.equal([fs.appends, fs.rewrites], [1, 0]);`,
      },
      {
        name: "a reopen replays the log over the snapshot",
        isHidden: true,
        source: `var store = require("src/cache/store");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
for (var i = 0; i < 130; i++) s.set("k" + (i % 40), i);
var again = store.open(fs);
assert.equal([again.get("k0"), again.get("k9"), again.get("k39")], [120, 129, 119]);
for (var j = 0; j < 70; j++) again.set("z" + j, j);
assert.equal(fs.rewrites, 4, "the 30 replayed lines count toward the next compaction");`,
      },
      {
        name: "a busy day writes far less than a rewrite per change",
        isHidden: true,
        source: `var store = require("src/cache/store");
var fs = require("src/cache/fakefs").create();
var s = store.open(fs);
for (var i = 0; i < 1000; i++) s.set("key" + (i % 200), "value-" + i);
assert.equal(fs.rewrites, 20);
assert.ok(fs.bytesWritten < 200000, "bytes written: " + fs.bytesWritten);`,
      },
    ],
    fixedFiles: {
      "src/cache/store.js": `var config = require("./config");

exports.open = function (fs) {
  var state = {};
  var pending = 0;
  var snap = fs.readFile(config.SNAPSHOT);
  if (snap) state = JSON.parse(snap);
  var log = fs.readFile(config.LOG);
  if (log) {
    log.split("\\n").forEach(function (line) {
      if (!line) return;
      var entry = JSON.parse(line);
      state[entry[0]] = entry[1];
      pending++;
    });
  }

  // Rewriting the whole snapshot on every change is what turned an idle
  // client into tens of GB of writes a day. Append one small record per
  // change instead, and fold the log into a snapshot only once it is long.
  function compact() {
    fs.writeFile(config.SNAPSHOT, JSON.stringify(state));
    fs.writeFile(config.LOG, "");
    pending = 0;
  }

  return {
    get: function (key) {
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : null;
    },
    set: function (key, value) {
      if (Object.prototype.hasOwnProperty.call(state, key) && state[key] === value) return;
      state[key] = value;
      fs.appendFile(config.LOG, JSON.stringify([key, value]) + "\\n");
      pending++;
      if (pending >= config.COMPACT_AFTER) compact();
    }
  };
};
`,
    },
  },

  {
    title: "The Config Value That Crashed Every App",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Config", "Validation", "Parsing"],
    description: `Modelled on the **Facebook iOS SDK crash of 10 July 2020**: a change to a server-side configuration that the Facebook SDK downloads at launch sent a value the SDK did not expect, and apps embedding it — Spotify, Tinder and Pinterest among them — crashed on launch until Facebook reverted the change. A similar incident had happened in May 2020.

\`config.js\` is a reconstruction of the SDK's launch step: it merges the server's settings into the defaults and trusts every field to have the right shape.

Fix \`applyServerConfig\` so it validates every field, falls back to defaults for anything malformed, and never throws.`,
    bugReport: `**BUG-SDK-0710** · Priority: Critical (crash on launch) · Reported by: app developers, all at once

applyServerConfig(raw) returns { sampleRate, filters, endpoints } (in that key
order) and must never throw, whatever JSON value raw is.
- raw not a plain object (null, array, string, number, boolean) -> a fresh
  copy of the defaults
- sampleRate: a finite number with 0 <= n <= 1, else the default (1)
- dataFilters -> filters: must be a plain object (not null, not an array),
  else {}. Each entry is kept only if its value is an array whose items are
  all strings; kept items are lower-cased. Other entries are dropped.
  Key order follows the input.
- endpoints: a non-empty array whose items are all strings (copied), else the
  default (["graph"])

Observed: a dataFilters entry whose value is \`true\` instead of an array
crashes every app on launch.`,
    logs: `[FBSDK] fetched app settings v=2020-07-10
TypeError: raw.dataFilters[event].map is not a function
    at applyServerConfig (config.js:9)`,
    files: [
      {
        filePath: "src/sdk/config.js",
        isEditable: true,
        language: "javascript",
        content: `var defaults = require("./defaults");

// Applies the server-delivered app settings at launch.
exports.applyServerConfig = function (raw) {
  var out = defaults.copyDefaults();
  if (raw.sampleRate !== undefined) out.sampleRate = raw.sampleRate;
  if (raw.dataFilters !== undefined) {
    Object.keys(raw.dataFilters).forEach(function (event) {
      out.filters[event] = raw.dataFilters[event].map(function (p) {
        return p.toLowerCase();
      });
    });
  }
  if (raw.endpoints !== undefined) out.endpoints = raw.endpoints.slice();
  return out;
};
`,
      },
      {
        filePath: "src/sdk/defaults.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Settings used when the server's copy is missing or unusable. The server copy
is fetched on every launch, before the app's own code runs — anything that
throws here takes the host app down with it.
*/
exports.copyDefaults = function () {
  return { sampleRate: 1, filters: {}, endpoints: ["graph"] };
};
`,
      },
    ],
    tests: [
      {
        name: "a well-formed config is applied",
        isHidden: false,
        source: `var c = require("src/sdk/config");
assert.equal(
  c.applyServerConfig({ sampleRate: 0.25, dataFilters: { purchase: ["Email", "Phone"] }, endpoints: ["graph", "events"] }),
  { sampleRate: 0.25, filters: { purchase: ["email", "phone"] }, endpoints: ["graph", "events"] }
);`,
      },
      {
        name: "a filter of the wrong type is dropped, not fatal",
        isHidden: false,
        source: `var c = require("src/sdk/config");
var out = c.applyServerConfig({ dataFilters: { purchase: true, login: ["Email"] } });
assert.equal(out, { sampleRate: 1, filters: { login: ["email"] }, endpoints: ["graph"] });`,
      },
      {
        name: "a config that is not an object falls back to defaults",
        isHidden: true,
        source: `var c = require("src/sdk/config");
var d = { sampleRate: 1, filters: {}, endpoints: ["graph"] };
assert.equal(c.applyServerConfig(null), d, "null");
assert.equal(c.applyServerConfig([1, 2]), d, "array");
assert.equal(c.applyServerConfig("ok"), d, "string");
assert.equal(c.applyServerConfig(7), d, "number");`,
      },
      {
        name: "bad scalar fields fall back individually",
        isHidden: true,
        source: `var c = require("src/sdk/config");
assert.equal(c.applyServerConfig({ sampleRate: "0.5" }).sampleRate, 1, "string rate");
assert.equal(c.applyServerConfig({ sampleRate: 7 }).sampleRate, 1, "out of range");
assert.equal(c.applyServerConfig({ sampleRate: 0 }).sampleRate, 0, "zero is valid");
assert.equal(c.applyServerConfig({ endpoints: [] }).endpoints, ["graph"], "empty");
assert.equal(c.applyServerConfig({ endpoints: "graph" }).endpoints, ["graph"], "string");
assert.equal(c.applyServerConfig({ endpoints: ["a", 3] }).endpoints, ["graph"], "mixed");`,
      },
      {
        name: "filters of the wrong shape are ignored",
        isHidden: true,
        source: `var c = require("src/sdk/config");
assert.equal(c.applyServerConfig({ dataFilters: "abc" }).filters, {});
assert.equal(c.applyServerConfig({ dataFilters: ["x"] }).filters, {});
assert.equal(c.applyServerConfig({ dataFilters: null }).filters, {});
assert.equal(c.applyServerConfig({ dataFilters: { a: ["X", 1], b: [], c: { d: 1 } } }).filters, { b: [] });`,
      },
    ],
    fixedFiles: {
      "src/sdk/config.js": `var defaults = require("./defaults");

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function allStrings(list) {
  for (var i = 0; i < list.length; i++) {
    if (typeof list[i] !== "string") return false;
  }
  return true;
}

// Applies the server-delivered app settings at launch.
// Every field is checked before use: this runs before the host app's own
// code, so one value of an unexpected type from the server must degrade to
// a default rather than crash every app that embeds the SDK.
exports.applyServerConfig = function (raw) {
  var out = defaults.copyDefaults();
  if (!isPlainObject(raw)) return out;

  var rate = raw.sampleRate;
  if (typeof rate === "number" && isFinite(rate) && rate >= 0 && rate <= 1) out.sampleRate = rate;

  if (isPlainObject(raw.dataFilters)) {
    Object.keys(raw.dataFilters).forEach(function (event) {
      var list = raw.dataFilters[event];
      if (!Array.isArray(list) || !allStrings(list)) return;
      out.filters[event] = list.map(function (p) { return p.toLowerCase(); });
    });
  }

  if (Array.isArray(raw.endpoints) && raw.endpoints.length > 0 && allStrings(raw.endpoints)) {
    out.endpoints = raw.endpoints.slice();
  }
  return out;
};
`,
    },
  },

  {
    title: "User Minus One Is Root",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Security", "Auth", "Overflow"],
    description: `Modelled on **sudo CVE-2019-14287** (October 2019): with a sudoers rule meant to allow running a command as *any user except root* (\`(ALL, !root)\`), asking for user id **-1** (or its unsigned form 4294967295) passed the "not root" check — and because the system call used to switch ids treats -1 as "leave this id unchanged", the command ran with sudo's own id: root.

\`RunAs.java\` reconstructs the runas step: parse \`#<uid>\`, check the policy, switch ids through \`Kernel.setresuid\`.

Fix \`RunAs.run\` so user id -1 can never be requested.`,
    bugReport: `**BUG-SUDO-14287** · Priority: Critical (privilege escalation) · Reported by: security

run(spec) returns "uid=<n>" for the effective uid the command runs as, or "denied".
- spec must be "#" followed by a decimal integer, else "denied"
- values are 32-bit uids: a negative n means n + 2^32 (so "#-2" is 4294967294);
  values below -2^31 or above 4294967295 are "denied"
- 4294967295 (-1) is not a user id — it is setresuid's "unchanged" marker —
  and must be "denied", however it is written
- the policy (RunasPolicy.allows) must then approve the uid

Observed: run("#-1") returns "uid=0" — the policy said "not root" and the
command ran as root.`,
    logs: `[sudo] alice : TTY=pts/0 ; USER=#-1 ; COMMAND=/usr/bin/id
[sudo] policy (ALL, !root): target uid 4294967295 != 0 -> allowed
[id] uid=0(root) gid=1000(alice)`,
    files: [
      {
        filePath: "RunAs.java",
        isEditable: true,
        language: "java",
        content: `class RunAs {
    static String run(String spec) {
        if (spec == null || !spec.startsWith("#")) return "denied";
        long n;
        try {
            n = Long.parseLong(spec.substring(1));
        } catch (NumberFormatException e) {
            return "denied";
        }
        if (n < -2147483648L || n > 0xFFFFFFFFL) return "denied";
        long uid = n & 0xFFFFFFFFL;
        if (!RunasPolicy.allows(uid)) return "denied";
        return "uid=" + Kernel.setresuid(uid);
    }
}`,
      },
      {
        filePath: "RunasPolicy.java",
        isEditable: false,
        language: "java",
        content: `class RunasPolicy {
    // sudoers: alice ALL=(ALL, !root) /usr/bin/id — any target user except root.
    static boolean allows(long uid) {
        return uid != 0;
    }
}`,
      },
      {
        filePath: "Kernel.java",
        isEditable: false,
        language: "java",
        content: `class Kernel {
    // sudo itself runs as root. setresuid treats (uid_t) -1 — 0xFFFFFFFF —
    // as "leave this id unchanged", so asking for it keeps the current uid.
    static final long UNCHANGED = 0xFFFFFFFFL;
    static final long CURRENT_UID = 0L;

    static long setresuid(long uid) {
        if (uid == UNCHANGED) return CURRENT_UID;
        return uid;
    }
}`,
      },
    ],
    tests: [
      {
        name: "an ordinary user id is allowed",
        isHidden: false,
        source: `                BugAssert.equal(RunAs.run("#1000"), "uid=1000");`,
      },
      {
        name: "user id -1 is denied",
        isHidden: false,
        source: `                BugAssert.equal(RunAs.run("#-1"), "denied", "-1 must never reach setresuid");`,
      },
      {
        name: "root and junk are denied",
        isHidden: true,
        source: `                BugAssert.equal(RunAs.run("#0"), "denied", "root by number");
                BugAssert.equal(RunAs.run("#abc"), "denied");
                BugAssert.equal(RunAs.run("1000"), "denied", "missing #");
                BugAssert.equal(RunAs.run("#4294967296"), "denied", "out of range");`,
      },
      {
        name: "the unsigned spelling of -1 is denied too",
        isHidden: true,
        source: `                BugAssert.equal(RunAs.run("#4294967295"), "denied");`,
      },
      {
        name: "other negative ids wrap to real uids",
        isHidden: true,
        source: `                BugAssert.equal(RunAs.run("#-2"), "uid=4294967294");
                BugAssert.equal(RunAs.run("#4294967294"), "uid=4294967294");`,
      },
    ],
    fixedFiles: {
      "RunAs.java": `class RunAs {
    static String run(String spec) {
        if (spec == null || !spec.startsWith("#")) return "denied";
        long n;
        try {
            n = Long.parseLong(spec.substring(1));
        } catch (NumberFormatException e) {
            return "denied";
        }
        if (n < -2147483648L || n > 0xFFFFFFFFL) return "denied";
        long uid = n & 0xFFFFFFFFL;
        // (uid_t) -1 is not a user: setresuid reads it as "keep the current
        // id", which for sudo is root. Refuse it BEFORE the policy check, which
        // only sees a number that is not 0 and would allow it.
        if (uid == Kernel.UNCHANGED) return "denied";
        if (!RunasPolicy.allows(uid)) return "denied";
        return "uid=" + Kernel.setresuid(uid);
    }
}`,
    },
  },

  {
    title: "Commission on the Tax",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Money", "Validation"],
    description: `Modelled on **Uber's New York City driver underpayment** (acknowledged May 2017): since late 2014 Uber had been calculating its commission on NYC drivers' **gross fares, including sales tax and Black Car Fund fees**, instead of on the fare after those pass-through charges. Uber said it would repay the affected drivers with interest — reported at tens of millions of dollars.

\`statement.js\` is a reconstruction of the per-trip driver statement. Taxes and fees are collected from the rider and passed on; they are not part of the fare the commission applies to.

Fix \`statement\` so the commission is taken from the fare alone.`,
    bugReport: `**BUG-NYC-COMM** · Priority: High (driver pay) · Reported by: driver support

statement(trip) — all amounts in integer cents — returns, in this key order:
- gross:        trip.fare + trip.salesTax + trip.blackCarFund (what the rider paid)
- commission:   Math.round(trip.fare * rates.COMMISSION_RATE)
                (the fare only — never tax or fees)
- taxesAndFees: trip.salesTax + trip.blackCarFund
- driverPay:    trip.fare - commission

Example: fare 2000, tax 177, BCF 50 -> { gross: 2227, commission: 500,
taxesAndFees: 227, driverPay: 1500 }

Observed: commission 557 and driver pay 1443 on that trip.`,
    logs: `[payouts] trip=nyc-88213 fare=2000 tax=177 bcf=50 commission=557
[payouts] weekly statement NYC: commission base includes tax + BCF`,
    files: [
      {
        filePath: "src/pay/statement.js",
        isEditable: true,
        language: "javascript",
        content: `var rates = require("./rates");

// Per-trip driver statement. All amounts are integer cents.
exports.statement = function (trip) {
  var gross = trip.fare + trip.salesTax + trip.blackCarFund;
  var taxesAndFees = trip.salesTax + trip.blackCarFund;
  var commission = Math.round(gross * rates.COMMISSION_RATE);
  return {
    gross: gross,
    commission: commission,
    taxesAndFees: taxesAndFees,
    driverPay: gross - taxesAndFees - commission
  };
};
`,
      },
      {
        filePath: "src/pay/rates.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Sales tax and the Black Car Fund fee are collected from the rider and remitted
on; neither is revenue, for the driver or for us.
*/
exports.COMMISSION_RATE = 0.25;
`,
      },
    ],
    tests: [
      {
        name: "a trip with no tax or fees",
        isHidden: false,
        source: `var s = require("src/pay/statement");
assert.equal(s.statement({ fare: 1000, salesTax: 0, blackCarFund: 0 }), { gross: 1000, commission: 250, taxesAndFees: 0, driverPay: 750 });`,
      },
      {
        name: "commission is taken from the fare, not the taxes",
        isHidden: false,
        source: `var s = require("src/pay/statement");
assert.equal(s.statement({ fare: 2000, salesTax: 177, blackCarFund: 50 }), { gross: 2227, commission: 500, taxesAndFees: 227, driverPay: 1500 });`,
      },
      {
        name: "rounding is on the fare's commission",
        isHidden: true,
        source: `var s = require("src/pay/statement");
assert.equal(s.statement({ fare: 1001, salesTax: 89, blackCarFund: 25 }), { gross: 1115, commission: 250, taxesAndFees: 114, driverPay: 751 });
assert.equal(s.statement({ fare: 1002, salesTax: 89, blackCarFund: 25 }).commission, 251, "half rounds up");`,
      },
      {
        name: "a fees-only line takes no commission",
        isHidden: true,
        source: `var s = require("src/pay/statement");
assert.equal(s.statement({ fare: 0, salesTax: 40, blackCarFund: 25 }), { gross: 65, commission: 0, taxesAndFees: 65, driverPay: 0 });`,
      },
    ],
    fixedFiles: {
      "src/pay/statement.js": `var rates = require("./rates");

// Per-trip driver statement. All amounts are integer cents.
exports.statement = function (trip) {
  var gross = trip.fare + trip.salesTax + trip.blackCarFund;
  var taxesAndFees = trip.salesTax + trip.blackCarFund;
  // The commission base is the fare alone. Sales tax and the Black Car Fund
  // fee pass straight through; charging commission on them took a cut of
  // money that was never the driver's revenue (or ours).
  var commission = Math.round(trip.fare * rates.COMMISSION_RATE);
  return {
    gross: gross,
    commission: commission,
    taxesAndFees: taxesAndFees,
    driverPay: trip.fare - commission
  };
};
`,
    },
  },

  {
    title: "The Clock Started Eleven Hours Early",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Time", "State"],
    description: `Modelled on **Boeing Starliner's Orbital Flight Test** (20 December 2019): the capsule's flight computer read its mission elapsed time from the Atlas V launch vehicle at the wrong point in the countdown, so its clock was off by about **11 hours**. After separation it believed it was in a different phase of the mission and fired its thrusters accordingly, burning so much propellant that the planned docking with the International Space Station was called off.

\`MissionClock.java\` is a reconstruction: it receives each launch-sequence event with the booster's clock reading and must latch the mission epoch at liftoff. \`FlightPhases\` maps elapsed time to the phase — and to the thruster plan — the software believes it is in.

Fix \`MissionClock\` so mission elapsed time is measured from liftoff and nothing else.`,
    bugReport: `**BUG-OFT-MET** · Priority: Critical · Reported by: flight software IV&V

onEvent(event, boosterTime) is called for every launch-sequence event, in
order, with the booster's clock (seconds since booster power-on).
- the epoch is latched from the FIRST "LIFTOFF" event only; every other
  event, before or after it, and any repeated "LIFTOFF", leaves it alone

met(boosterTime)
- before liftoff has been latched -> -1
- after -> boosterTime - epoch

phase(boosterTime) -> FlightPhases.phaseAt(met(boosterTime))

Observed: with the countdown events delivered first, met is ~11 hours
(39,600 s) too large and the capsule plans a burn for the wrong phase.`,
    logs: `[fsw] event TERMINAL_COUNT booster_t=1000 -> MET epoch latched
[fsw] event LIFTOFF booster_t=40600
[fsw] T+300 MET=39900 phase=COAST — executing coast-phase attitude plan`,
    files: [
      {
        filePath: "MissionClock.java",
        isEditable: true,
        language: "java",
        content: `class MissionClock {
    private long epoch;
    private boolean latched;

    // Called for every launch-sequence event with the booster's clock
    // reading (seconds since the booster's own power-on).
    void onEvent(String event, long boosterTime) {
        if (!latched) {
            epoch = boosterTime;
            latched = true;
        }
    }

    long met(long boosterTime) {
        if (!latched) return -1;
        return boosterTime - epoch;
    }

    String phase(long boosterTime) {
        return FlightPhases.phaseAt(met(boosterTime));
    }
}`,
      },
      {
        filePath: "FlightPhases.java",
        isEditable: false,
        language: "java",
        content: `class FlightPhases {
    // Mission elapsed time (seconds since liftoff) -> the phase the flight
    // software believes it is in. Each phase has its own thruster plan.
    static String phaseAt(long met) {
        if (met < 0) return "PRELAUNCH";
        if (met < 900) return "ASCENT";
        if (met < 2700) return "ORBIT_INSERTION";
        return "COAST";
    }
}`,
      },
    ],
    tests: [
      {
        name: "liftoff alone starts the clock",
        isHidden: false,
        source: `                MissionClock c = new MissionClock();
                c.onEvent("LIFTOFF", 5000L);
                BugAssert.equal(c.met(5300L), 300L, "T+300");
                BugAssert.equal(c.phase(5300L), "ASCENT");`,
      },
      {
        name: "countdown events do not start the clock",
        isHidden: false,
        source: `                MissionClock c = new MissionClock();
                c.onEvent("TERMINAL_COUNT", 1000L);
                c.onEvent("LIFTOFF", 40600L);
                BugAssert.equal(c.met(40900L), 300L, "MET must count from liftoff");
                BugAssert.equal(c.phase(40900L), "ASCENT");`,
      },
      {
        name: "before liftoff there is no mission time",
        isHidden: true,
        source: `                MissionClock c = new MissionClock();
                c.onEvent("TERMINAL_COUNT", 1000L);
                c.onEvent("ENGINE_START", 40597L);
                BugAssert.equal(c.met(40599L), -1L);
                BugAssert.equal(c.phase(40599L), "PRELAUNCH");`,
      },
      {
        name: "a repeated liftoff event does not move the epoch",
        isHidden: true,
        source: `                MissionClock c = new MissionClock();
                c.onEvent("LIFTOFF", 100L);
                c.onEvent("LIFTOFF", 700L);
                c.onEvent("SEPARATION", 1000L);
                BugAssert.equal(c.met(1300L), 1200L);
                BugAssert.equal(c.phase(1300L), "ORBIT_INSERTION");`,
      },
      {
        name: "phases follow real elapsed time after a long countdown",
        isHidden: true,
        source: `                MissionClock c = new MissionClock();
                c.onEvent("POWER_TRANSFER", 10L);
                c.onEvent("TERMINAL_COUNT", 2000L);
                c.onEvent("LIFTOFF", 41600L);
                c.onEvent("SEPARATION", 42500L);
                BugAssert.equal(c.phase(42600L), "ORBIT_INSERTION");
                BugAssert.equal(c.phase(44300L), "COAST");`,
      },
    ],
    fixedFiles: {
      "MissionClock.java": `class MissionClock {
    private long epoch;
    private boolean latched;

    // Called for every launch-sequence event with the booster's clock
    // reading (seconds since the booster's own power-on).
    void onEvent(String event, long boosterTime) {
        // Latch on LIFTOFF only. Taking the first event the booster sends
        // anchored the mission clock hours into the countdown, and every
        // phase decision afterwards was made on the wrong time.
        if (!latched && "LIFTOFF".equals(event)) {
            epoch = boosterTime;
            latched = true;
        }
    }

    long met(long boosterTime) {
        if (!latched) return -1;
        return boosterTime - epoch;
    }

    String phase(long boosterTime) {
        return FlightPhases.phaseAt(met(boosterTime));
    }
}`,
    },
  },

  {
    title: "One Domain Checked Three Times",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Concurrency", "Validation"],
    description: `Modelled on the **Let's Encrypt CAA rechecking bug** (found 29 February 2020): when a certificate request covered several domain names whose CAA records needed rechecking, Boulder — Let's Encrypt's CA software — checked **one of those names N times** instead of each name once. The Go code captured a reference to the loop variable, so every check saw the same name. Let's Encrypt announced it would revoke about 3 million affected certificates.

\`caa.js\` reconstructs it in JavaScript: the rechecks are queued as closures inside a \`for\` loop and run afterwards by \`pool.js\`, the way Boulder fanned them out.

Fix \`recheck\` so every name on the order is checked exactly once.`,
    bugReport: `**BUG-CAA-2020** · Priority: Critical (mis-issuance) · Reported by: incident response

recheck(domains, lookup) — lookup(domain) returns true when CAA permits issuance.
- lookup is called exactly once for each entry of domains, with that entry,
  in input order (duplicates in the input are each checked)
- returns { ok, failed }: failed lists the domains whose lookup returned
  false, in input order; ok is true exactly when failed is empty
- an empty list -> { ok: true, failed: [] }

Observed: for ["a.example", "b.example", "c.example"] lookup was called with
"c.example" three times; a.example and b.example were never checked.`,
    logs: `[boulder] recheckCAA order=4418 names=3
[boulder] caa lookup c.example ok
[boulder] caa lookup c.example ok
[boulder] caa lookup c.example ok`,
    files: [
      {
        filePath: "src/ca/caa.js",
        isEditable: true,
        language: "javascript",
        content: `var pool = require("./pool");

// Re-checks CAA for every name on an order before issuance.
exports.recheck = function (domains, lookup) {
  var tasks = [];
  for (var i = 0; i < domains.length; i++) {
    var domain = domains[i];
    tasks.push(function () {
      return { domain: domain, ok: lookup(domain) };
    });
  }
  var results = pool.runAll(tasks);
  var failed = results
    .filter(function (r) { return !r.ok; })
    .map(function (r) { return r.domain; });
  return { ok: failed.length === 0, failed: failed };
};
`,
      },
      {
        filePath: "src/ca/pool.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Runs queued tasks after the loop that queued them has finished — the way the
CA fans CAA lookups out to workers. Deterministic: tasks run in queue order.
*/
exports.runAll = function (tasks) {
  var results = [];
  for (var i = 0; i < tasks.length; i++) results.push(tasks[i]());
  return results;
};
`,
      },
    ],
    tests: [
      {
        name: "a single-name order is checked",
        isHidden: false,
        source: `var caa = require("src/ca/caa");
var seen = [];
var out = caa.recheck(["a.example"], function (d) { seen.push(d); return true; });
assert.equal(seen, ["a.example"]);
assert.equal(out, { ok: true, failed: [] });`,
      },
      {
        name: "every name is checked once",
        isHidden: false,
        source: `var caa = require("src/ca/caa");
var seen = [];
caa.recheck(["a.example", "b.example", "c.example"], function (d) { seen.push(d); return true; });
assert.equal(seen, ["a.example", "b.example", "c.example"]);`,
      },
      {
        name: "a forbidden name in the middle fails the order",
        isHidden: true,
        source: `var caa = require("src/ca/caa");
var out = caa.recheck(["a.example", "b.example", "c.example"], function (d) { return d !== "b.example"; });
assert.equal(out, { ok: false, failed: ["b.example"] });`,
      },
      {
        name: "failures are reported in input order",
        isHidden: true,
        source: `var caa = require("src/ca/caa");
var out = caa.recheck(["x.test", "ok.test", "y.test", "z.test"], function (d) { return d === "ok.test"; });
assert.equal(out, { ok: false, failed: ["x.test", "y.test", "z.test"] });`,
      },
      {
        name: "empty and duplicate lists",
        isHidden: true,
        source: `var caa = require("src/ca/caa");
assert.equal(caa.recheck([], function () { return false; }), { ok: true, failed: [] });
var seen = [];
caa.recheck(["a.example", "a.example", "b.example"], function (d) { seen.push(d); return true; });
assert.equal(seen, ["a.example", "a.example", "b.example"]);`,
      },
    ],
    fixedFiles: {
      "src/ca/caa.js": `var pool = require("./pool");

// Re-checks CAA for every name on an order before issuance.
exports.recheck = function (domains, lookup) {
  // Each task must capture its OWN domain. A closure over the loop's shared
  // variable (var is function-scoped) reads it when the task runs — after
  // the loop — so every task checked the last name.
  var tasks = domains.map(function (domain) {
    return function () {
      return { domain: domain, ok: lookup(domain) };
    };
  });
  var results = pool.runAll(tasks);
  var failed = results
    .filter(function (r) { return !r.ok; })
    .map(function (r) { return r.domain; });
  return { ok: failed.length === 0, failed: failed };
};
`,
    },
  },

  {
    title: "The Login Key Made of Passwords",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on **Ashley Madison** (2015): after attackers published the site's user database, its passwords turned out to be hashed with bcrypt — slow to crack. But the password-cracking group CynoSure Prime found a second stored value, \`$loginkey\`, that for older accounts was an **MD5 hash of the lowercased username and lowercased password**. Cracking those fast hashes recovered about 11 million passwords, and the bcrypt protection counted for nothing.

\`register.js\` is a reconstruction. The password hash itself is fine (\`hashing.passwordHash\` is a salted, slow hash); the auto-login key stored beside it is derived from the password.

Fix \`register\` so nothing stored with the account is derived from the password except the slow hash.`,
    bugReport: `**BUG-LOGINKEY** · Priority: Critical · Reported by: security review

register(username, password, rng) returns
  { username, salt, passwordHash, loginKey }   (in that key order)
where rng(n) returns n random bytes (integers 0–255):
- salt = hashing.hex(rng(16))                  (first call)
- passwordHash = hashing.passwordHash(password, salt)
- loginKey = hashing.hex(rng(16))              (second call) — random, and
  independent of the username and the password

verify(record, password) -> true exactly when the password matches.

Observed: loginKey is hashing.fastDigest(lower(username) + "::" + lower(password)) — an
unsalted fast hash of the password stored next to the bcrypt one.`,
    logs: `[audit] users.loginkey: 32-hex values, identical for accounts with the same username+password
[audit] loginkey recomputable from fastDigest(lower(user)::lower(pass))`,
    files: [
      {
        filePath: "src/accounts/register.js",
        isEditable: true,
        language: "javascript",
        content: `var hashing = require("./hashing");

// rng(n) -> n random bytes (0-255) from the CSPRNG.
exports.register = function (username, password, rng) {
  var salt = hashing.hex(rng(16));
  return {
    username: username,
    salt: salt,
    passwordHash: hashing.passwordHash(password, salt),
    loginKey: hashing.fastDigest(username.toLowerCase() + "::" + password.toLowerCase())
  };
};

exports.verify = function (record, password) {
  return hashing.passwordHash(password, record.salt) === record.passwordHash;
};
`,
      },
      {
        filePath: "src/accounts/hashing.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Toy stand-ins so the project runs in the sandbox: passwordHash plays bcrypt
(salted, iterated) and fastDigest plays MD5 (unsalted, one pass). Neither is
real cryptography; what matters is which one a password goes into.
*/
function fnv(text, seed) {
  var h = seed >>> 0;
  for (var i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function hex8(n) {
  return ("0000000" + n.toString(16)).slice(-8);
}

// Salted, deliberately slow password hash (stands in for bcrypt).
exports.passwordHash = function (password, salt) {
  var out = "";
  for (var k = 0; k < 4; k++) {
    var h = fnv(salt + ":" + password, 2166136261 + k);
    for (var r = 0; r < 1000; r++) h = fnv(hex8(h) + password, h);
    out += hex8(h);
  }
  return out;
};

// Fast, unsalted digest (stands in for MD5). Fine for checksums; never for
// anything a password goes into.
exports.fastDigest = function (text) {
  return hex8(fnv(text, 2166136261)) + hex8(fnv(text, 40503)) + hex8(fnv(text, 7)) + hex8(fnv(text, 99991));
};

exports.hex = function (bytes) {
  return bytes.map(function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join("");
};
`,
      },
    ],
    tests: [
      {
        name: "the password verifies",
        isHidden: false,
        source: `var r = require("src/accounts/register");
var next = 0;
var rng = function (n) { var out = []; for (var i = 0; i < n; i++) out.push(next++ & 255); return out; };
var rec = r.register("Alice", "Secret1", rng);
assert.ok(r.verify(rec, "Secret1"), "right password");
assert.ok(!r.verify(rec, "secret1"), "case matters");`,
      },
      {
        name: "the login key is random, not derived from the password",
        isHidden: false,
        source: `var r = require("src/accounts/register");
var next = 0;
var rng = function (n) { var out = []; for (var i = 0; i < n; i++) out.push(next++ & 255); return out; };
var rec = r.register("Alice", "Secret1", rng);
assert.equal(rec.salt, "000102030405060708090a0b0c0d0e0f");
assert.equal(rec.loginKey, "101112131415161718191a1b1c1d1e1f", "second 16 random bytes");`,
      },
      {
        name: "the record has exactly the specified fields",
        isHidden: true,
        source: `var r = require("src/accounts/register");
var h = require("src/accounts/hashing");
var next = 200;
var rng = function (n) { var out = []; for (var i = 0; i < n; i++) out.push(next++ & 255); return out; };
var rec = r.register("bob", "pw", rng);
assert.equal(Object.keys(rec), ["username", "salt", "passwordHash", "loginKey"]);
assert.equal(rec.passwordHash, h.passwordHash("pw", rec.salt));`,
      },
      {
        name: "the login key does not depend on the password",
        isHidden: true,
        source: `var r = require("src/accounts/register");
function seq() { var next = 7; return function (n) { var out = []; for (var i = 0; i < n; i++) out.push((next += 13) & 255); return out; }; }
var a = r.register("Carol", "first-password", seq());
var b = r.register("Carol", "another-one", seq());
assert.equal(a.loginKey, b.loginKey, "same random bytes -> same key, whatever the password");
assert.ok(a.passwordHash !== b.passwordHash);`,
      },
      {
        name: "nothing stored is a fast hash of the credentials",
        isHidden: true,
        source: `var r = require("src/accounts/register");
var h = require("src/accounts/hashing");
var next = 0;
var rng = function (n) { var out = []; for (var i = 0; i < n; i++) out.push(next++ & 255); return out; };
var rec = r.register("Dave", "Hunter2", rng);
var weak = [h.fastDigest("dave::hunter2"), h.fastDigest("Dave::Hunter2"), h.fastDigest("Hunter2")];
Object.keys(rec).forEach(function (k) {
  assert.ok(weak.indexOf(rec[k]) === -1, k + " is a fast hash of the password");
});`,
      },
    ],
    fixedFiles: {
      "src/accounts/register.js": `var hashing = require("./hashing");

// rng(n) -> n random bytes (0-255) from the CSPRNG.
exports.register = function (username, password, rng) {
  var salt = hashing.hex(rng(16));
  return {
    username: username,
    salt: salt,
    passwordHash: hashing.passwordHash(password, salt),
    // The login key must be random. An MD5 of the (lowercased) credentials
    // stored beside the slow hash let every password be cracked at MD5 speed,
    // making the slow hash pointless.
    loginKey: hashing.hex(rng(16))
  };
};

exports.verify = function (record, password) {
  return hashing.passwordHash(password, record.salt) === record.passwordHash;
};
`,
    },
  },

  {
    title: "Tweets From a Borrowed Number",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "Validation"],
    description: `Modelled on the **Twitter SMS spoofing issue reported in 2012** by security researcher Jonathan Rusch: Twitter let people post by text message from the phone number linked to their account, and a message **spoofed to appear to come from that number** could post to the account. Accounts without an SMS PIN were exposed; Twitter advised users to protect SMS posting with a PIN.

\`inbound.js\` is a reconstruction of the SMS-to-post handler. It trusts the sender number on the message as proof of identity.

Fix \`handle\` so a text only posts when it proves it came from the account holder, as the spec describes.`,
    bugReport: `**BUG-SMS-SPOOF** · Priority: Critical · Reported by: external researcher

handle(msg, directory) — msg is { from, body, carrierVerified }; the sender
number (from) can be forged, carrierVerified is set only by our carrier
gateway. Returns { status: "posted", account, text } or { status: "rejected", reason }.
- no account linked to msg.from -> reason "unknown-number"
- account.pin set: the body must start with the PIN followed by a space; text is
  the rest, trimmed. Missing or wrong PIN -> reason "bad-pin" (carrierVerified
  does not replace the PIN)
- no PIN: posted only when msg.carrierVerified === true; otherwise reason
  "unverified-sender"; text is the body trimmed
- text empty after the above -> reason "empty"

Observed: a message with a forged "from" and no PIN posts to the account.`,
    logs: `[sms] inbound from=+15550100 carrier_verified=false body="gotcha"
[sms] posted to @kai`,
    files: [
      {
        filePath: "src/sms/inbound.js",
        isEditable: true,
        language: "javascript",
        content: `// Turns an inbound SMS into a post on the linked account.
exports.handle = function (msg, directory) {
  var account = directory.byPhone(msg.from);
  if (!account) return { status: "rejected", reason: "unknown-number" };
  var text = msg.body.trim();
  if (!text) return { status: "rejected", reason: "empty" };
  return { status: "posted", account: account.handle, text: text };
};
`,
      },
      {
        filePath: "src/sms/directory.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Accounts with a linked phone: { handle, phone, pin } (pin is null when the
account holder never set one). The sender number on an SMS is set by whoever
sent it and proves nothing on its own.
*/
exports.create = function (accounts) {
  return {
    byPhone: function (phone) {
      for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].phone === phone) return accounts[i];
      }
      return null;
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "a carrier-verified text from a linked phone posts",
        isHidden: false,
        source: `var h = require("src/sms/inbound").handle;
var dir = require("src/sms/directory").create([{ handle: "kai", phone: "+15550100", pin: null }]);
assert.equal(h({ from: "+15550100", body: " hello ", carrierVerified: true }, dir), { status: "posted", account: "kai", text: "hello" });`,
      },
      {
        name: "a spoofed sender without a PIN is rejected",
        isHidden: false,
        source: `var h = require("src/sms/inbound").handle;
var dir = require("src/sms/directory").create([{ handle: "kai", phone: "+15550100", pin: null }]);
assert.equal(h({ from: "+15550100", body: "gotcha", carrierVerified: false }, dir), { status: "rejected", reason: "unverified-sender" });`,
      },
      {
        name: "the right PIN posts the rest of the message",
        isHidden: true,
        source: `var h = require("src/sms/inbound").handle;
var dir = require("src/sms/directory").create([{ handle: "ana", phone: "+15550111", pin: "4821" }]);
assert.equal(h({ from: "+15550111", body: "4821 lunch at noon", carrierVerified: false }, dir), { status: "posted", account: "ana", text: "lunch at noon" });`,
      },
      {
        name: "a wrong or missing PIN is rejected even from the carrier",
        isHidden: true,
        source: `var h = require("src/sms/inbound").handle;
var dir = require("src/sms/directory").create([{ handle: "ana", phone: "+15550111", pin: "4821" }]);
assert.equal(h({ from: "+15550111", body: "1234 hi", carrierVerified: true }, dir), { status: "rejected", reason: "bad-pin" });
assert.equal(h({ from: "+15550111", body: "hi there", carrierVerified: true }, dir), { status: "rejected", reason: "bad-pin" });
assert.equal(h({ from: "+15550111", body: "48211 hi", carrierVerified: true }, dir), { status: "rejected", reason: "bad-pin" }, "PIN must be followed by a space");`,
      },
      {
        name: "unknown numbers and empty posts",
        isHidden: true,
        source: `var h = require("src/sms/inbound").handle;
var dir = require("src/sms/directory").create([{ handle: "ana", phone: "+15550111", pin: "4821" }, { handle: "kai", phone: "+15550100", pin: null }]);
assert.equal(h({ from: "+15559999", body: "hi", carrierVerified: true }, dir), { status: "rejected", reason: "unknown-number" });
assert.equal(h({ from: "+15550111", body: "4821    ", carrierVerified: false }, dir), { status: "rejected", reason: "empty" });
assert.equal(h({ from: "+15550100", body: "   ", carrierVerified: true }, dir), { status: "rejected", reason: "empty" });`,
      },
    ],
    fixedFiles: {
      "src/sms/inbound.js": `// Turns an inbound SMS into a post on the linked account.
// The sender number is chosen by whoever sends the text, so it identifies an
// account but never authenticates one: require the account's PIN, or, for an
// account without one, a sender our carrier gateway has verified.
exports.handle = function (msg, directory) {
  var account = directory.byPhone(msg.from);
  if (!account) return { status: "rejected", reason: "unknown-number" };
  var text;
  if (account.pin) {
    var prefix = account.pin + " ";
    if (msg.body.indexOf(prefix) !== 0) return { status: "rejected", reason: "bad-pin" };
    text = msg.body.substring(prefix.length).trim();
  } else {
    if (msg.carrierVerified !== true) return { status: "rejected", reason: "unverified-sender" };
    text = msg.body.trim();
  }
  if (!text) return { status: "rejected", reason: "empty" };
  return { status: "posted", account: account.handle, text: text };
};
`,
    },
  },

];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE19_ORIGINS: Record<string, string> = {
  "The Certificate Nobody Renewed": "Ericsson · O2 UK 2018",
  "Ghost in the Hostname Buffer": "glibc · CVE-2015-0235",
  "The Backslash at the End of the Line": "sudo · CVE-2021-3156",
  "Refunds for Money Never Taken": "Revolut · 2022",
  "The Deposits Nobody Reported": "Commonwealth Bank · 2017",
  "When 65536 Read as Zero": "Microsoft Excel · 2007",
  "The Thruster That Spun It Faster": "JAXA Hitomi · 2016",
  "The Player That Wore Out Disks": "Spotify · 2016",
  "The Config Value That Crashed Every App": "Facebook iOS SDK · 2020",
  "User Minus One Is Root": "sudo · CVE-2019-14287",
  "Commission on the Tax": "Uber · 2017",
  "The Clock Started Eleven Hours Early": "Boeing Starliner · 2019",
  "One Domain Checked Three Times": "Let's Encrypt · 2020",
  "The Login Key Made of Passwords": "Ashley Madison · 2015",
  "Tweets From a Borrowed Number": "Twitter · 2012",
};
