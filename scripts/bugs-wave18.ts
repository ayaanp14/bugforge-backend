/**
 * Wave 18 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE18: BugSpec[] = [

  {
    title: "The Intermediate Nobody Was Watching",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Time", "Monitoring"],
    description: `Modelled on **Mozilla Firefox, May 2019** ("Armagadd-on"): an intermediate certificate in the chain Mozilla used to sign Firefox add-ons expired. Firefox verifies every add-on's signature, so once that certificate lapsed nearly every installed extension was disabled at once. Mozilla pushed a replacement certificate through its Studies system and shipped it in Firefox 66.0.4.

This project is a reconstruction of the safety net that should have fired first: an expiry monitor that walks the signing chains and reports what is about to lapse. It only ever looks at one certificate per chain.

Fix \`expiringCerts\` so every certificate in every chain is watched.`,
    bugReport: `**BUG-ARMAGADDON** · Priority: Critical · Reported by: release engineering

expiringCerts(chains, nowMs, windowDays) — each chain is an array of certs
ordered leaf first, then intermediates, then the root. A cert is
{ serial, subject, notAfter } (notAfter in epoch ms).

It must report EVERY certificate in EVERY chain (leaf, intermediates and root)
whose daysLeft <= windowDays, where daysLeft = time.daysBetween(nowMs, notAfter)
(floored whole days; negative once the cert has already expired — an expired
cert is still reported).
- each report is { serial, subject, daysLeft } (in that key order)
- a certificate shared by several chains is reported once (by serial)
- sorted by daysLeft ascending, ties by serial ascending

Observed: an intermediate five days from expiry produced no alert at all; only
leaf certificates ever show up in the report.`,
    logs: `[certwatch] scanned 3 chains, 0 certificates inside the 30-day window
[addons] signature verification failed: certificate expired (intermediate "signing-ca")
[addons] disabled 41 of 42 installed extensions`,
    files: [
      {
        filePath: "src/certs/monitor.js",
        isEditable: true,
        language: "javascript",
        content: `var time = require("./time");

// Scans every signing chain we ship and reports certificates that expire
// inside the alert window, soonest first.
exports.expiringCerts = function (chains, nowMs, windowDays) {
  var seen = {};
  var out = [];
  for (var i = 0; i < chains.length; i++) {
    var cert = chains[i][0];
    if (!cert || seen[cert.serial]) continue;
    seen[cert.serial] = true;
    var daysLeft = time.daysBetween(nowMs, cert.notAfter);
    if (daysLeft <= windowDays) {
      out.push({ serial: cert.serial, subject: cert.subject, daysLeft: daysLeft });
    }
  }
  out.sort(function (a, b) {
    if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
    return a.serial < b.serial ? -1 : a.serial > b.serial ? 1 : 0;
  });
  return out;
};
`,
      },
      {
        filePath: "src/certs/time.js",
        isEditable: false,
        language: "javascript",
        content: `var DAY_MS = 86400000;
exports.DAY_MS = DAY_MS;

// Whole days from \`fromMs\` until \`toMs\`, floored (negative once past).
exports.daysBetween = function (fromMs, toMs) {
  return Math.floor((toMs - fromMs) / DAY_MS);
};
`,
      },
      {
        filePath: "src/certs/CHAINS.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A signing chain is only as long-lived as its shortest-lived member. The leaf
that signs an add-on is re-issued often; the intermediate above it lives for
years, which is exactly why nobody remembers it until the day it lapses.
*/
`,
      },
    ],
    tests: [
      {
        name: "a leaf inside the window is reported",
        isHidden: false,
        source: `var m = require("src/certs/monitor");
var D = 86400000, now = 18000 * D;
var chain = [
  { serial: "L1", subject: "addon-leaf", notAfter: now + 10 * D },
  { serial: "I1", subject: "signing-ca", notAfter: now + 400 * D },
  { serial: "R1", subject: "root-ca", notAfter: now + 3000 * D }
];
assert.equal(m.expiringCerts([chain], now, 30), [{ serial: "L1", subject: "addon-leaf", daysLeft: 10 }]);`,
      },
      {
        name: "an intermediate inside the window is reported",
        isHidden: false,
        source: `var m = require("src/certs/monitor");
var D = 86400000, now = 18000 * D;
var chain = [
  { serial: "L1", subject: "addon-leaf", notAfter: now + 200 * D },
  { serial: "I1", subject: "signing-ca", notAfter: now + 5 * D },
  { serial: "R1", subject: "root-ca", notAfter: now + 3000 * D }
];
assert.equal(m.expiringCerts([chain], now, 30), [{ serial: "I1", subject: "signing-ca", daysLeft: 5 }], "the intermediate is five days from lapsing");`,
      },
      {
        name: "an already-expired intermediate is still reported",
        isHidden: true,
        source: `var m = require("src/certs/monitor");
var D = 86400000, now = 18000 * D;
var chain = [
  { serial: "L1", subject: "addon-leaf", notAfter: now + 200 * D },
  { serial: "I1", subject: "signing-ca", notAfter: now - D - D / 2 }
];
assert.equal(m.expiringCerts([chain], now, 30), [{ serial: "I1", subject: "signing-ca", daysLeft: -2 }]);`,
      },
      {
        name: "a shared intermediate is reported once, soonest first",
        isHidden: true,
        source: `var m = require("src/certs/monitor");
var D = 86400000, now = 18000 * D;
var inter = { serial: "I1", subject: "signing-ca", notAfter: now + 5 * D };
var root = { serial: "R1", subject: "root-ca", notAfter: now + 25 * D };
var a = [{ serial: "L1", subject: "addon-a", notAfter: now + 90 * D }, inter, root];
var b = [{ serial: "L2", subject: "addon-b", notAfter: now + 20 * D }, inter, root];
assert.equal(m.expiringCerts([a, b], now, 30), [
  { serial: "I1", subject: "signing-ca", daysLeft: 5 },
  { serial: "L2", subject: "addon-b", daysLeft: 20 },
  { serial: "R1", subject: "root-ca", daysLeft: 25 }
]);`,
      },
      {
        name: "ties are ordered by serial",
        isHidden: true,
        source: `var m = require("src/certs/monitor");
var D = 86400000, now = 18000 * D;
var chain = [
  { serial: "L9", subject: "addon-leaf", notAfter: now + 7 * D },
  { serial: "I2", subject: "signing-ca", notAfter: now + 7 * D },
  { serial: "R1", subject: "root-ca", notAfter: now + 3000 * D }
];
assert.equal(m.expiringCerts([chain], now, 7), [
  { serial: "I2", subject: "signing-ca", daysLeft: 7 },
  { serial: "L9", subject: "addon-leaf", daysLeft: 7 }
]);`,
      },
    ],
    fixedFiles: {
      "src/certs/monitor.js": `var time = require("./time");

// Scans every signing chain we ship and reports certificates that expire
// inside the alert window, soonest first.
exports.expiringCerts = function (chains, nowMs, windowDays) {
  var seen = {};
  var out = [];
  for (var i = 0; i < chains.length; i++) {
    // Every link of the chain can break verification, not just the leaf: the
    // long-lived intermediate is precisely the one nobody re-issues by habit.
    for (var j = 0; j < chains[i].length; j++) {
      var cert = chains[i][j];
      if (!cert || seen[cert.serial]) continue;
      seen[cert.serial] = true;
      var daysLeft = time.daysBetween(nowMs, cert.notAfter);
      if (daysLeft <= windowDays) {
        out.push({ serial: cert.serial, subject: cert.subject, daysLeft: daysLeft });
      }
    }
  }
  out.sort(function (a, b) {
    if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
    return a.serial < b.serial ? -1 : a.serial > b.serial ? 1 : 0;
  });
  return out;
};
`,
    },
  },

  {
    title: "The Invite Link That Shared a Hash",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Privacy"],
    description: `Modelled on **Slack, August 2022**: Slack disclosed that when a user created or revoked a shareable invitation link for a workspace, a bug sent that user's **hashed password** to the clients of other members of the workspace. The hashes were salted and not visible in the app, but Slack reset the passwords of the affected users.

This reconstruction broadcasts an event to the workspace whenever a link is created or revoked — and puts the whole stored user record in it.

Fix \`invites.js\` so events only ever carry the public profile.`,
    bugReport: `**BUG-INVITE-HASH** · Priority: Critical · Reported by: security

createInviteLink(workspace, user, code, bus) and
revokeInviteLink(workspace, user, code, bus) broadcast an event on the
workspace's channel. The event's \`actor\` must be the PUBLIC profile only:
{ id, name, avatar } — exactly users.PUBLIC_FIELDS, in that order. No other
field of the stored record (passwordHash, email, …) may appear in any event.

- create: stores { code, workspace: workspace.id, active: true } in
  workspace.links, broadcasts { type: "invite_link_created", code, actor },
  returns the link
- revoke: marks the link inactive, broadcasts
  { type: "invite_link_revoked", code, actor } and returns true; an unknown
  code returns false and broadcasts nothing

Observed: every member's client receives the actor's passwordHash and email.`,
    logs: `[rt] T1 <- invite_link_created actor={"id":"U1","name":"Kai","email":"kai@example.com","passwordHash":"hash:9f2c…","avatar":"k.png"}`,
    files: [
      {
        filePath: "src/workspace/invites.js",
        isEditable: true,
        language: "javascript",
        content: `exports.createInviteLink = function (workspace, user, code, bus) {
  var link = { code: code, workspace: workspace.id, active: true };
  workspace.links.push(link);
  bus.broadcast(workspace.id, { type: "invite_link_created", code: code, actor: user });
  return link;
};

exports.revokeInviteLink = function (workspace, user, code, bus) {
  for (var i = 0; i < workspace.links.length; i++) {
    var link = workspace.links[i];
    if (link.code === code && link.active) {
      link.active = false;
      bus.broadcast(workspace.id, { type: "invite_link_revoked", code: code, actor: user });
      return true;
    }
  }
  return false;
};
`,
      },
      {
        filePath: "src/workspace/users.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Stored user records carry credentials and contact details. Anything sent to
another member's client must be built from these fields only, in this order.
*/
exports.PUBLIC_FIELDS = ["id", "name", "avatar"];
`,
      },
      {
        filePath: "src/workspace/bus.js",
        isEditable: false,
        language: "javascript",
        content: `// In-memory stand-in for the realtime fan-out to every member's client.
exports.create = function () {
  var events = [];
  return {
    events: events,
    broadcast: function (channel, event) { events.push({ channel: channel, event: event }); }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "creating a link stores and returns it",
        isHidden: false,
        source: `var inv = require("src/workspace/invites");
var bus = require("src/workspace/bus").create();
var ws = { id: "T1", links: [] };
var kai = { id: "U1", name: "Kai", email: "kai@example.com", passwordHash: "hash:9f2c", avatar: "k.png" };
assert.equal(inv.createInviteLink(ws, kai, "abc", bus), { code: "abc", workspace: "T1", active: true });
assert.equal(ws.links.length, 1);`,
      },
      {
        name: "the creation event carries only the public profile",
        isHidden: false,
        source: `var inv = require("src/workspace/invites");
var bus = require("src/workspace/bus").create();
var ws = { id: "T1", links: [] };
var kai = { id: "U1", name: "Kai", email: "kai@example.com", passwordHash: "hash:9f2c", avatar: "k.png" };
inv.createInviteLink(ws, kai, "abc", bus);
assert.equal(bus.events, [{ channel: "T1", event: { type: "invite_link_created", code: "abc", actor: { id: "U1", name: "Kai", avatar: "k.png" } } }]);`,
      },
      {
        name: "the revocation event carries only the public profile",
        isHidden: true,
        source: `var inv = require("src/workspace/invites");
var bus = require("src/workspace/bus").create();
var ws = { id: "T1", links: [] };
var kai = { id: "U1", name: "Kai", email: "kai@example.com", passwordHash: "hash:9f2c", avatar: "k.png" };
inv.createInviteLink(ws, kai, "abc", bus);
assert.equal(inv.revokeInviteLink(ws, kai, "abc", bus), true);
assert.equal(bus.events[1].event, { type: "invite_link_revoked", code: "abc", actor: { id: "U1", name: "Kai", avatar: "k.png" } });
assert.equal(ws.links[0].active, false);`,
      },
      {
        name: "no event anywhere contains a secret",
        isHidden: true,
        source: `var inv = require("src/workspace/invites");
var bus = require("src/workspace/bus").create();
var ws = { id: "T1", links: [] };
var ana = { passwordHash: "hash:77aa", email: "ana@example.com", id: "U2", avatar: "a.png", name: "Ana" };
inv.createInviteLink(ws, ana, "x1", bus);
inv.revokeInviteLink(ws, ana, "x1", bus);
var wire = JSON.stringify(bus.events);
assert.ok(wire.indexOf("hash:77aa") === -1, "password hash leaked");
assert.ok(wire.indexOf("ana@example.com") === -1, "email leaked");
assert.equal(bus.events[0].event.actor, { id: "U2", name: "Ana", avatar: "a.png" }, "fields in PUBLIC_FIELDS order");`,
      },
      {
        name: "revoking an unknown code broadcasts nothing",
        isHidden: true,
        source: `var inv = require("src/workspace/invites");
var bus = require("src/workspace/bus").create();
var ws = { id: "T1", links: [] };
assert.equal(inv.revokeInviteLink(ws, { id: "U1", name: "Kai", avatar: "k.png" }, "nope", bus), false);
assert.equal(bus.events.length, 0);`,
      },
    ],
    fixedFiles: {
      "src/workspace/invites.js": `var users = require("./users");

// Events fan out to every member's client, so they carry a projection built
// field by field from the allow-list — never the stored record, which holds
// the password hash and the email address.
function publicProfile(user) {
  var out = {};
  for (var i = 0; i < users.PUBLIC_FIELDS.length; i++) {
    var key = users.PUBLIC_FIELDS[i];
    out[key] = user[key];
  }
  return out;
}

exports.createInviteLink = function (workspace, user, code, bus) {
  var link = { code: code, workspace: workspace.id, active: true };
  workspace.links.push(link);
  bus.broadcast(workspace.id, { type: "invite_link_created", code: code, actor: publicProfile(user) });
  return link;
};

exports.revokeInviteLink = function (workspace, user, code, bus) {
  for (var i = 0; i < workspace.links.length; i++) {
    var link = workspace.links[i];
    if (link.code === code && link.active) {
      link.active = false;
      bus.broadcast(workspace.id, { type: "invite_link_revoked", code: code, actor: publicProfile(user) });
      return true;
    }
  }
  return false;
};
`,
    },
  },

  {
    title: "Four Hours of Any Password",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Auth", "Security"],
    description: `Modelled on **Dropbox, June 2011**: a code update introduced a bug in Dropbox's authentication, and for about four hours accounts could be signed into **with any password**. Dropbox found and fixed it the same day and ended the sessions that were opened during the window.

In this reconstruction, the password checker was refactored to return a verdict object (so failures could be logged with a reason) — and the login code kept testing it as if it were a boolean.

Fix \`login\` so a wrong password is refused again.`,
    bugReport: `**BUG-DBX-0619** · Priority: Critical (auth bypass) · Reported by: on-call

login(accounts, username, password) returns a session id or None:
- "sess-" + username only when the account exists and hashing.verify(...)
  says the password matches (Verdict.ok is True)
- an unknown username, an empty password or a non-matching password returns
  None

Observed: since the verifier refactor every non-empty password signs in.`,
    logs: `[auth] verify user=alice verdict=mismatch -> session sess-alice issued
[auth] 100% of failed verifications resulted in a session in the last 4h`,
    files: [
      {
        filePath: "src/auth/sessions.py",
        isEditable: true,
        language: "python",
        content: `hashing = bug_require("./hashing.py")


def login(accounts, username, password):
    record = accounts.get(username)
    if record is None:
        return None
    if not password:
        return None
    if hashing.verify(record, password):
        return "sess-" + username
    return None
`,
      },
      {
        filePath: "src/auth/hashing.py",
        isEditable: false,
        language: "python",
        content: `# Password verification. Returns a Verdict rather than a bare bool so the
# caller can log why a check failed.
import hashlib


class Verdict:
    def __init__(self, ok, reason):
        self.ok = ok
        self.reason = reason


def digest(salt, password):
    return hashlib.sha256((salt + ":" + password).encode("utf-8")).hexdigest()


def verify(record, password):
    if digest(record["salt"], password) == record["hash"]:
        return Verdict(True, "match")
    return Verdict(False, "mismatch")
`,
      },
    ],
    tests: [
      {
        name: "the right password signs in",
        isHidden: false,
        source: `h = bug_require("src/auth/hashing.py")
s = bug_require("src/auth/sessions.py")
accounts = {"alice": {"salt": "s1", "hash": h.digest("s1", "correct horse")}}
assert_.equal(s.login(accounts, "alice", "correct horse"), "sess-alice")`,
      },
      {
        name: "a wrong password is refused",
        isHidden: false,
        source: `h = bug_require("src/auth/hashing.py")
s = bug_require("src/auth/sessions.py")
accounts = {"alice": {"salt": "s1", "hash": h.digest("s1", "correct horse")}}
assert_.equal(s.login(accounts, "alice", "battery staple"), None, "any password must not open the account")`,
      },
      {
        name: "an unknown user is refused",
        isHidden: true,
        source: `s = bug_require("src/auth/sessions.py")
assert_.equal(s.login({}, "mallory", "whatever"), None)`,
      },
      {
        name: "a near-miss password is refused",
        isHidden: true,
        source: `h = bug_require("src/auth/hashing.py")
s = bug_require("src/auth/sessions.py")
accounts = {"bob": {"salt": "zz", "hash": h.digest("zz", "Tr0ub4dor")}}
assert_.equal(s.login(accounts, "bob", "tr0ub4dor"), None)
assert_.equal(s.login(accounts, "bob", "Tr0ub4dor "), None)
assert_.equal(s.login(accounts, "bob", "Tr0ub4dor"), "sess-bob")`,
      },
      {
        name: "another account's password does not open this one",
        isHidden: true,
        source: `h = bug_require("src/auth/hashing.py")
s = bug_require("src/auth/sessions.py")
accounts = {
    "alice": {"salt": "s1", "hash": h.digest("s1", "correct horse")},
    "bob": {"salt": "s2", "hash": h.digest("s2", "hunter2")},
}
assert_.equal(s.login(accounts, "alice", "hunter2"), None)
assert_.equal(s.login(accounts, "bob", ""), None)`,
      },
    ],
    fixedFiles: {
      "src/auth/sessions.py": `hashing = bug_require("./hashing.py")


def login(accounts, username, password):
    record = accounts.get(username)
    if record is None:
        return None
    if not password:
        return None
    # verify() returns a Verdict object, and any object is truthy — the
    # decision is its .ok field, never the object itself.
    if hashing.verify(record, password).ok is True:
        return "sess-" + username
    return None
`,
    },
  },

  {
    title: "The Fees That Priced People Out",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Money", "Validation"],
    description: `Modelled on **Wells Fargo, 2018**: the bank disclosed that a calculation error in the tool it used to decide whether mortgage customers qualified for a loan modification had **included attorneys' fees incorrectly**. Hundreds of customers who should have qualified were denied or not offered a modification, and many of them later lost their homes to foreclosure.

This reconstruction re-amortises a delinquent loan and checks the new payment against an affordability ceiling. The fees end up in the wrong place in that calculation.

Fix \`evaluate\` so the eligibility decision follows the policy below.`,
    bugReport: `**BUG-MOD-FEES** · Priority: Critical · Reported by: mortgage operations audit

evaluate(app) — all amounts in integer cents. app has principal, arrears,
attorney_fees, monthly_income. Returns, in this shape:
{ "eligible", "balance", "payment", "fees_due" }

- balance: the modified (capitalised) balance = principal + arrears.
  Attorney fees are NOT capitalised into the re-amortised loan; they are
  reported separately as fees_due (= attorney_fees).
- payment: policy.monthly_payment(balance, policy.RATE_BPS, policy.TERM_MONTHS)
- eligible: payment <= policy.max_payment(monthly_income)  (a payment exactly
  at the ceiling qualifies)

Observed: applicants whose payment fits the ceiling are denied as soon as
their file carries any attorney fees.`,
    logs: `[underwriting] app=M-20417 balance=21900000 payment=66318 ceiling=65100 -> DENIED
[underwriting] app=M-20417 manual review: payment without fees would be 65100`,
    files: [
      {
        filePath: "src/mortgage/underwriting.py",
        isEditable: true,
        language: "python",
        content: `policy = bug_require("./policy.py")


def evaluate(app):
    balance = app["principal"] + app["arrears"] + app["attorney_fees"]
    payment = policy.monthly_payment(balance, policy.RATE_BPS, policy.TERM_MONTHS)
    return {
        "eligible": payment <= policy.max_payment(app["monthly_income"]),
        "balance": balance,
        "payment": payment,
        "fees_due": app["attorney_fees"],
    }
`,
      },
      {
        filePath: "src/mortgage/policy.py",
        isEditable: false,
        language: "python",
        content: `# Modification underwriting policy (house rules for this exercise).
AFFORDABILITY_PCT = 31    # modified payment may be at most 31% of gross monthly income
TERM_MONTHS = 480         # modified loans re-amortise over 40 years
RATE_BPS = 200            # at 2.00% a year


def monthly_payment(balance_cents, rate_bps, months):
    r = rate_bps / 10000.0 / 12
    if r == 0:
        return -(-balance_cents // months)
    p = balance_cents * r / (1 - (1 + r) ** -months)
    return int(round(p))


def max_payment(income_cents):
    return income_cents * AFFORDABILITY_PCT // 100
`,
      },
    ],
    tests: [
      {
        name: "a file with no fees and ample income qualifies",
        isHidden: false,
        source: `u = bug_require("src/mortgage/underwriting.py")
p = bug_require("src/mortgage/policy.py")
r = u.evaluate({"principal": 20000000, "arrears": 1500000, "attorney_fees": 0, "monthly_income": 900000})
assert_.equal(r["eligible"], True)
assert_.equal(r["balance"], 21500000)
assert_.equal(r["payment"], p.monthly_payment(21500000, p.RATE_BPS, p.TERM_MONTHS))`,
      },
      {
        name: "attorney fees do not push an affordable file over the ceiling",
        isHidden: false,
        source: `u = bug_require("src/mortgage/underwriting.py")
p = bug_require("src/mortgage/policy.py")
pay = p.monthly_payment(21500000, p.RATE_BPS, p.TERM_MONTHS)
income = -(-pay * 100 // 31)
r = u.evaluate({"principal": 20000000, "arrears": 1500000, "attorney_fees": 400000, "monthly_income": income})
assert_.equal(r["eligible"], True, "the fees are not part of the modified loan")`,
      },
      {
        name: "fees are reported, not capitalised",
        isHidden: true,
        source: `u = bug_require("src/mortgage/underwriting.py")
p = bug_require("src/mortgage/policy.py")
r = u.evaluate({"principal": 15000000, "arrears": 900000, "attorney_fees": 250000, "monthly_income": 800000})
assert_.equal(r, {
    "eligible": True,
    "balance": 15900000,
    "payment": p.monthly_payment(15900000, p.RATE_BPS, p.TERM_MONTHS),
    "fees_due": 250000,
})`,
      },
      {
        name: "a payment exactly at the ceiling qualifies",
        isHidden: true,
        source: `u = bug_require("src/mortgage/underwriting.py")
p = bug_require("src/mortgage/policy.py")
pay = p.monthly_payment(30000000, p.RATE_BPS, p.TERM_MONTHS)
income = -(-pay * 100 // 31)
assert_.equal(p.max_payment(income), pay)
r = u.evaluate({"principal": 29000000, "arrears": 1000000, "attorney_fees": 1200000, "monthly_income": income})
assert_.equal(r["eligible"], True)
assert_.equal(r["payment"], pay)`,
      },
      {
        name: "a file that cannot afford the modified loan is still denied",
        isHidden: true,
        source: `u = bug_require("src/mortgage/underwriting.py")
r = u.evaluate({"principal": 30000000, "arrears": 2000000, "attorney_fees": 0, "monthly_income": 200000})
assert_.equal(r["eligible"], False)`,
      },
    ],
    fixedFiles: {
      "src/mortgage/underwriting.py": `policy = bug_require("./policy.py")


def evaluate(app):
    # Attorney fees are settled separately and never re-amortised: folding
    # them into the modified balance inflates the payment and denies people
    # whose actual modified loan is affordable.
    balance = app["principal"] + app["arrears"]
    payment = policy.monthly_payment(balance, policy.RATE_BPS, policy.TERM_MONTHS)
    return {
        "eligible": payment <= policy.max_payment(app["monthly_income"]),
        "balance": balance,
        "payment": payment,
        "fees_due": app["attorney_fees"],
    }
`,
    },
  },

  {
    title: "Divided by the Sum, Not the Average",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Money", "Math"],
    description: `Modelled on **JPMorgan Chase, 2012** (the "London Whale"): the bank's own task-force report into the Chief Investment Office's trading losses of more than $6 billion found that a new value-at-risk model was run through spreadsheets, and that one step — after subtracting an old rate from a new one — **divided by their sum instead of their average**. That muted the measured volatility by a factor of two and lowered the reported VaR.

\`risk.js\` is a reconstruction of that step: it turns a series of daily hazard-rate marks into relative changes, then into a volatility and a 95% VaR.

Fix \`relativeChange\`.`,
    bugReport: `**BUG-VAR-CIO** · Priority: Critical · Reported by: model review

relativeChange(oldRate, newRate) = (newRate - oldRate) / average(oldRate, newRate)
where average(a, b) = (a + b) / 2.

- changes(rates): relativeChange for each consecutive pair
- volatility(rates): stats.round6(population stdev of changes(rates))
- valueAtRisk(position, rates): Math.round(stats.Z_95 * volatility(rates) * position)

Examples: relativeChange(0.02, 0.03) = 0.4; volatility([0.02, 0.03, 0.02, 0.03])
= 0.377124; valueAtRisk(1000000, that series) = 620369.

Observed: every volatility the model reports is exactly half the desk's own
recalculation.`,
    logs: `[var] book=synthetic-credit vol=0.188562 var95=310185
[model-review] independent recalculation: vol=0.377124 var95=620369`,
    files: [
      {
        filePath: "src/risk/risk.js",
        isEditable: true,
        language: "javascript",
        content: `var stats = require("./stats");

// Relative change in a hazard rate between two daily marks.
function relativeChange(oldRate, newRate) {
  return (newRate - oldRate) / (oldRate + newRate);
}
exports.relativeChange = relativeChange;

exports.changes = function (rates) {
  var out = [];
  for (var i = 1; i < rates.length; i++) out.push(relativeChange(rates[i - 1], rates[i]));
  return out;
};

exports.volatility = function (rates) {
  return stats.round6(stats.stdev(exports.changes(rates)));
};

exports.valueAtRisk = function (position, rates) {
  return Math.round(stats.Z_95 * exports.volatility(rates) * position);
};
`,
      },
      {
        filePath: "src/risk/stats.js",
        isEditable: false,
        language: "javascript",
        content: `exports.Z_95 = 1.645;

exports.round6 = function (x) {
  return Math.round(x * 1e6) / 1e6;
};

// Population standard deviation.
exports.stdev = function (xs) {
  if (xs.length === 0) return 0;
  var mean = 0;
  for (var i = 0; i < xs.length; i++) mean += xs[i];
  mean /= xs.length;
  var v = 0;
  for (var j = 0; j < xs.length; j++) v += (xs[j] - mean) * (xs[j] - mean);
  return Math.sqrt(v / xs.length);
};
`,
      },
    ],
    tests: [
      {
        name: "a flat series has no volatility",
        isHidden: false,
        source: `var r = require("src/risk/risk");
assert.equal(r.volatility([0.02, 0.02, 0.02]), 0);
assert.equal(r.relativeChange(0.01, 0.01), 0);`,
      },
      {
        name: "a relative change divides by the average of the two rates",
        isHidden: false,
        source: `var r = require("src/risk/risk");
var s = require("src/risk/stats");
assert.equal(s.round6(r.relativeChange(0.02, 0.03)), 0.4);`,
      },
      {
        name: "volatility of an oscillating series",
        isHidden: true,
        source: `var r = require("src/risk/risk");
assert.equal(r.volatility([0.02, 0.03, 0.02, 0.03]), 0.377124);`,
      },
      {
        name: "value at risk on a position",
        isHidden: true,
        source: `var r = require("src/risk/risk");
assert.equal(r.valueAtRisk(1000000, [0.02, 0.03, 0.02, 0.03]), 620369);
assert.equal(r.valueAtRisk(2500000, [0.010, 0.012, 0.011, 0.015, 0.013]), 766188);`,
      },
    ],
    fixedFiles: {
      "src/risk/risk.js": `var stats = require("./stats");

// Relative change in a hazard rate between two daily marks. The denominator
// is the AVERAGE of the two marks; dividing by their sum halves every change
// and with it the volatility and the VaR built on top.
function relativeChange(oldRate, newRate) {
  return (newRate - oldRate) / ((oldRate + newRate) / 2);
}
exports.relativeChange = relativeChange;

exports.changes = function (rates) {
  var out = [];
  for (var i = 1; i < rates.length; i++) out.push(relativeChange(rates[i - 1], rates[i]));
  return out;
};

exports.volatility = function (rates) {
  return stats.round6(stats.stdev(exports.changes(rates)));
};

exports.valueAtRisk = function (position, rates) {
  return Math.round(stats.Z_95 * exports.volatility(rates) * position);
};
`,
    },
  },
  {
    title: "The Week That Belonged to Next Year",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Time", "Dates", "Auth"],
    description: `Modelled on **Twitter for Android, 29 December 2014**: many Android users were signed out of the app and could not sign back in. The cause, as Twitter's engineers explained, was a date format written with \`YYYY\` — the **week-based year** — instead of \`yyyy\`, the calendar year. In the last days of December the week that contains 1 January already belongs to the next week-based year, so the app believed it was 2015 a few days early.

This reconstruction stamps session times as strings and compares them to decide whether a session has expired.

Fix \`Stamps\` so a stamp always shows the calendar year.`,
    bugReport: `**BUG-YYYY** · Priority: Critical · Reported by: mobile on-call

Stamps.stamp(epochMillis) formats an instant in UTC as "yyyy-MM-dd HH:mm"
using the CALENDAR year (Locale.US), e.g.
- 2014-12-15T09:30Z -> "2014-12-15 09:30"
- 2014-12-29T00:00Z -> "2014-12-29 00:00"
- 2014-12-31T23:59Z -> "2014-12-31 23:59"
- 2015-01-01T00:00Z -> "2015-01-01 00:00"

SessionGuard (locked) compares these strings, so a stamp that jumps a year
ahead makes every session look expired.

Observed: from 28 December onwards every stamp reads 2015 and users are
signed out on launch.`,
    logs: `[session] now=2015-12-29 00:00 expires=2015-01-11 12:00 -> EXPIRED, signing out
[session] 1 of 1 sessions expired on launch (device clock 2014-12-29)`,
    files: [
      {
        filePath: "src/session/Stamps.java",
        isEditable: true,
        language: "java",
        content: `import java.text.SimpleDateFormat;

class Stamps {
    static final String PATTERN = "YYYY-MM-dd HH:mm";

    static String stamp(long epochMillis) {
        SimpleDateFormat f = new SimpleDateFormat(PATTERN, Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(epochMillis));
    }
}`,
      },
      {
        filePath: "src/session/SessionGuard.java",
        isEditable: false,
        language: "java",
        content: `class SessionGuard {
    static final long DAY_MS = 86400000L;

    // Stamps sort chronologically as plain strings, so expiry is a string
    // comparison against the current stamp.
    static boolean isExpired(String expiresAt, long nowMillis) {
        return Stamps.stamp(nowMillis).compareTo(expiresAt) > 0;
    }

    static String issue(long nowMillis, int days) {
        return Stamps.stamp(nowMillis + days * DAY_MS);
    }
}`,
      },
    ],
    tests: [
      {
        name: "a mid-December instant",
        isHidden: false,
        source: `                BugAssert.equal(Stamps.stamp(1418635800000L), "2014-12-15 09:30");`,
      },
      {
        name: "29 December 2014 is still 2014",
        isHidden: false,
        source: `                BugAssert.equal(Stamps.stamp(1419811200000L), "2014-12-29 00:00", "calendar year, not week year");`,
      },
      {
        name: "a session issued on 28 December survives the 29th",
        isHidden: true,
        source: `                String expires = SessionGuard.issue(1419768000000L, 14);
                BugAssert.equal(expires, "2015-01-11 12:00");
                BugAssert.equal(SessionGuard.isExpired(expires, 1419811200000L), false, "must not sign the user out");`,
      },
      {
        name: "New Year's Eve and New Year's Day",
        isHidden: true,
        source: `                BugAssert.equal(Stamps.stamp(1420070340000L), "2014-12-31 23:59");
                BugAssert.equal(Stamps.stamp(1420070400000L), "2015-01-01 00:00");`,
      },
      {
        name: "27 December is unaffected",
        isHidden: true,
        source: `                BugAssert.equal(Stamps.stamp(1419681600000L), "2014-12-27 12:00");`,
      },
    ],
    fixedFiles: {
      "src/session/Stamps.java": `import java.text.SimpleDateFormat;

class Stamps {
    // yyyy is the calendar year. YYYY is the week-based year, which rolls over
    // with the week containing 1 January — days early at the end of December.
    static final String PATTERN = "yyyy-MM-dd HH:mm";

    static String stamp(long epochMillis) {
        SimpleDateFormat f = new SimpleDateFormat(PATTERN, Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(epochMillis));
    }
}`,
    },
  },

  {
    title: "The Rover That Could Not Finish Booting",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Memory", "Limits", "State"],
    description: `Modelled on **NASA's Spirit rover, January 2004**: about two and a half weeks after landing on Mars, Spirit stopped sending useful data and kept resetting. The cause was its flash file system — files had accumulated in flash memory, many of them left over from the cruise to Mars, and managing them at boot needed more RAM than the rover had, so every start-up failed. Engineers commanded Spirit to start without using the flash, deleted files and reformatted it.

This reconstruction keeps a directory table in flash and mounts it into a fixed RAM budget at boot. Deleting files and writing new ones slowly makes the table unmountable.

Fix \`filetable.js\` so the table can always be mounted.`,
    bugReport: `**BUG-SOL18** · Priority: Critical · Reported by: flight software

Mounting costs limits.ENTRY_BYTES of RAM per entry in the table, and boot has
limits.RAM_BUDGET_BYTES. The table must ALWAYS stay mountable:
- mountBytes() = (number of LIVE files) * ENTRY_BYTES — removing a file frees
  its entry immediately
- write(name, bytes): overwriting an existing live file returns true and adds
  no entry; a NEW file is refused (returns false, nothing stored) when the
  number of live files already equals limits.MAX_MOUNTABLE
  (= RAM_BUDGET_BYTES / ENTRY_BYTES)
- remove(name) returns true for a live file, false otherwise
- list() returns live names in the order they were (last) created; a name
  written again after removal goes to the end

Observed: after a few days of create/delete cycles boot.mount reports
"out of memory" and the rover resets in a loop.`,
    logs: `[boot] mount flash: need 2048 B, budget 512 B -> out of memory
[boot] reset (attempt 3)
[boot] mount flash: need 2048 B, budget 512 B -> out of memory`,
    files: [
      {
        filePath: "src/flash/filetable.js",
        isEditable: true,
        language: "javascript",
        content: `var limits = require("./limits");

exports.create = function () {
  var entries = [];

  function find(name) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].name === name && !entries[i].deleted) return i;
    }
    return -1;
  }

  return {
    write: function (name, bytes) {
      var i = find(name);
      if (i !== -1) {
        entries[i].bytes = bytes;
        return true;
      }
      if (entries.length >= limits.MAX_FLASH_FILES) return false;
      entries.push({ name: name, bytes: bytes, deleted: false });
      return true;
    },
    remove: function (name) {
      var i = find(name);
      if (i === -1) return false;
      entries[i].deleted = true;
      return true;
    },
    list: function () {
      var out = [];
      for (var i = 0; i < entries.length; i++) if (!entries[i].deleted) out.push(entries[i].name);
      return out;
    },
    mountBytes: function () {
      return entries.length * limits.ENTRY_BYTES;
    }
  };
};
`,
      },
      {
        filePath: "src/flash/limits.js",
        isEditable: false,
        language: "javascript",
        content: `exports.ENTRY_BYTES = 64;
exports.RAM_BUDGET_BYTES = 512;
exports.MAX_MOUNTABLE = exports.RAM_BUDGET_BYTES / exports.ENTRY_BYTES; // 8
exports.MAX_FLASH_FILES = 32; // what the flash chip itself could hold
`,
      },
      {
        filePath: "src/flash/boot.js",
        isEditable: false,
        language: "javascript",
        content: `var limits = require("./limits");

exports.mount = function (table) {
  var need = table.mountBytes();
  if (need > limits.RAM_BUDGET_BYTES) return { ok: false, need: need, reason: "out of memory" };
  return { ok: true, need: need, reason: "" };
};
`,
      },
    ],
    tests: [
      {
        name: "a fresh table mounts",
        isHidden: false,
        source: `var t = require("src/flash/filetable").create();
var boot = require("src/flash/boot");
t.write("a", 10); t.write("b", 20); t.write("c", 30);
assert.equal(t.list(), ["a", "b", "c"]);
assert.equal(boot.mount(t), { ok: true, need: 192, reason: "" });`,
      },
      {
        name: "deleted files free their mount memory",
        isHidden: false,
        source: `var t = require("src/flash/filetable").create();
var boot = require("src/flash/boot");
for (var i = 0; i < 8; i++) t.write("f" + i, 100);
for (var j = 0; j < 4; j++) t.remove("f" + j);
t.write("n1", 5); t.write("n2", 5);
assert.equal(t.list(), ["f4", "f5", "f6", "f7", "n1", "n2"]);
assert.equal(boot.mount(t), { ok: true, need: 384, reason: "" });`,
      },
      {
        name: "the table never grows past what boot can mount",
        isHidden: true,
        source: `var t = require("src/flash/filetable").create();
var boot = require("src/flash/boot");
for (var i = 0; i < 8; i++) assert.equal(t.write("f" + i, 1), true);
assert.equal(t.write("f8", 1), false, "a ninth live file cannot be mounted");
assert.equal(t.write("f3", 99), true, "overwriting is fine");
assert.equal(t.list().length, 8);
assert.equal(boot.mount(t).ok, true);`,
      },
      {
        name: "a long create/delete cycle keeps booting",
        isHidden: true,
        source: `var t = require("src/flash/filetable").create();
var boot = require("src/flash/boot");
for (var i = 0; i < 100; i++) {
  assert.equal(t.write("log" + i, 64), true, "write " + i);
  assert.equal(t.remove("log" + i), true, "remove " + i);
}
assert.equal(t.list(), []);
assert.equal(boot.mount(t), { ok: true, need: 0, reason: "" });`,
      },
      {
        name: "re-creating a removed name moves it to the end",
        isHidden: true,
        source: `var t = require("src/flash/filetable").create();
t.write("a", 1); t.write("b", 1); t.write("c", 1);
assert.equal(t.remove("a"), true);
assert.equal(t.remove("a"), false);
t.write("a", 2); t.write("b", 3);
assert.equal(t.list(), ["b", "c", "a"]);`,
      },
    ],
    fixedFiles: {
      "src/flash/filetable.js": `var limits = require("./limits");

exports.create = function () {
  var entries = [];

  function find(name) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].name === name) return i;
    }
    return -1;
  }

  return {
    write: function (name, bytes) {
      var i = find(name);
      if (i !== -1) {
        entries[i].bytes = bytes;
        return true;
      }
      // The bound that matters is what boot can mount into RAM, not what the
      // flash chip can hold — a table past it can never be mounted again.
      if (entries.length >= limits.MAX_MOUNTABLE) return false;
      entries.push({ name: name, bytes: bytes });
      return true;
    },
    remove: function (name) {
      var i = find(name);
      if (i === -1) return false;
      // Free the entry outright: a tombstone still costs mount memory and
      // accumulates with every create/delete cycle.
      entries.splice(i, 1);
      return true;
    },
    list: function () {
      var out = [];
      for (var i = 0; i < entries.length; i++) out.push(entries[i].name);
      return out;
    },
    mountBytes: function () {
      return entries.length * limits.ENTRY_BYTES;
    }
  };
};
`,
    },
  },

  {
    title: "Orders Sent to the Unknown Queue",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Validation", "Routing"],
    description: `Modelled on the **VA's Oracle Cerner EHR rollout**, reviewed by the VA Office of Inspector General in 2022: at the first site to go live, the Mann-Grandstaff VA Medical Center in Spokane, the new system sent orders that it could not match to a known location to an **"unknown queue"** that clinicians did not know existed. Thousands of orders sat there without anyone acting on them, and the OIG linked the problem to patient harm.

This reconstruction routes orders to clinic queues by location code; anything unmapped is parked in a queue nobody works.

Fix \`OrderRouter.route\` so no order is ever silently parked.`,
    bugReport: `**BUG-OIG-UNKNOWN** · Priority: Critical (patient safety) · Reported by: clinical informatics

route(orderId, location, orderedBy, store) returns the queue the order was put in.
The location code is normalised first: trimmed and upper-cased (null -> "").
- mapped location: enqueue in LocationMap.queueFor(code), notify nobody
- unmapped location: enqueue in QueueStore.TRIAGE (a monitored queue) AND
  notify the ordering clinician with exactly
  store.notifyUser(orderedBy, "order <orderId> not routed: location '<code>' is not mapped")
- every order must end up in a queue listed in QueueStore.MONITORED; there
  must never be a queue named "UNKNOWN"

Observed: orders for unmapped locations are put in "UNKNOWN", which no
worklist shows, and the ordering clinician is never told.`,
    logs: `[orders] O-88121 location=SPK-PT -> UNKNOWN
[orders] UNKNOWN queue depth 11,204 (no subscribers)`,
    files: [
      {
        filePath: "src/orders/OrderRouter.java",
        isEditable: true,
        language: "java",
        content: `class OrderRouter {
    static String route(String orderId, String location, String orderedBy, QueueStore store) {
        String code = location == null ? "" : location.trim().toUpperCase();
        String queue = LocationMap.queueFor(code);
        if (queue == null) {
            queue = "UNKNOWN";
        }
        store.enqueue(queue, orderId);
        return queue;
    }
}`,
      },
      {
        filePath: "src/orders/QueueStore.java",
        isEditable: false,
        language: "java",
        content: `class QueueStore {
    static final String TRIAGE = "ORDER_TRIAGE";
    // Queues a clinician works every shift. Anything else is never looked at.
    static final Set<String> MONITORED = new HashSet<>(Arrays.asList(
        "LAB", "RADIOLOGY", "PHARMACY", "CARDIOLOGY", TRIAGE));

    final Map<String, List<String>> queues = new TreeMap<>();
    final List<String> notices = new ArrayList<>();

    void enqueue(String queue, String orderId) {
        queues.computeIfAbsent(queue, k -> new ArrayList<>()).add(orderId);
    }

    void notifyUser(String user, String text) {
        notices.add(user + ": " + text);
    }

    List<String> queue(String name) {
        List<String> q = queues.get(name);
        return q == null ? new ArrayList<>() : q;
    }
}`,
      },
      {
        filePath: "src/orders/LocationMap.java",
        isEditable: false,
        language: "java",
        content: `class LocationMap {
    private static final Map<String, String> MAP = new HashMap<>();
    static {
        MAP.put("SPK-LAB", "LAB");
        MAP.put("SPK-RAD", "RADIOLOGY");
        MAP.put("SPK-RX", "PHARMACY");
        MAP.put("SPK-CARD", "CARDIOLOGY");
    }

    // null when the location has not been mapped to a clinic queue.
    static String queueFor(String code) {
        return MAP.get(code);
    }
}`,
      },
    ],
    tests: [
      {
        name: "a mapped order reaches its clinic queue",
        isHidden: false,
        source: `                QueueStore s = new QueueStore();
                BugAssert.equal(OrderRouter.route("O1", "SPK-LAB", "dr.lee", s), "LAB");
                BugAssert.equal(s.queue("LAB"), Arrays.asList("O1"));
                BugAssert.equal(s.notices.size(), 0);`,
      },
      {
        name: "an unmapped order goes to the monitored triage queue",
        isHidden: false,
        source: `                QueueStore s = new QueueStore();
                String q = OrderRouter.route("O2", "SPK-PT", "dr.lee", s);
                BugAssert.equal(q, "ORDER_TRIAGE");
                BugAssert.ok(QueueStore.MONITORED.contains(q), "must be a queue someone works");
                BugAssert.equal(s.queue("ORDER_TRIAGE"), Arrays.asList("O2"));`,
      },
      {
        name: "the ordering clinician is told",
        isHidden: true,
        source: `                QueueStore s = new QueueStore();
                OrderRouter.route("O2", " spk-pt ", "dr.lee", s);
                BugAssert.equal(s.notices, Arrays.asList("dr.lee: order O2 not routed: location 'SPK-PT' is not mapped"));`,
      },
      {
        name: "every order lands in a monitored queue",
        isHidden: true,
        source: `                QueueStore s = new QueueStore();
                OrderRouter.route("A", "SPK-RX", "dr.a", s);
                OrderRouter.route("B", null, "dr.b", s);
                OrderRouter.route("C", "WALLA-WALLA", "dr.c", s);
                OrderRouter.route("D", "SPK-CARD", "dr.d", s);
                BugAssert.ok(!s.queues.containsKey("UNKNOWN"), "no UNKNOWN queue");
                for (String name : s.queues.keySet()) BugAssert.ok(QueueStore.MONITORED.contains(name), name + " is unmonitored");
                BugAssert.equal(s.queue("ORDER_TRIAGE"), Arrays.asList("B", "C"));
                BugAssert.equal(s.notices.get(0), "dr.b: order B not routed: location '' is not mapped");`,
      },
      {
        name: "location codes are normalised before lookup",
        isHidden: true,
        source: `                QueueStore s = new QueueStore();
                BugAssert.equal(OrderRouter.route("R1", "  spk-rad ", "dr.lee", s), "RADIOLOGY");
                BugAssert.equal(s.notices.size(), 0);`,
      },
    ],
    fixedFiles: {
      "src/orders/OrderRouter.java": `class OrderRouter {
    static String route(String orderId, String location, String orderedBy, QueueStore store) {
        String code = location == null ? "" : location.trim().toUpperCase();
        String queue = LocationMap.queueFor(code);
        if (queue == null) {
            // An order nobody sees is worse than one that bounces. Park it
            // where a person works the list, and tell the clinician who placed
            // it that it did not reach its destination.
            queue = QueueStore.TRIAGE;
            store.notifyUser(orderedBy, "order " + orderId + " not routed: location '" + code + "' is not mapped");
        }
        store.enqueue(queue, orderId);
        return queue;
    }
}`,
    },
  },

  {
    title: "One Shard Took Every New User",
    difficulty: "hard",
    category: "database",
    language: "javascript",
    tags: ["Sharding", "Scaling"],
    description: `Modelled on **Foursquare, October 2010**: the service was down for about eleven hours. Its check-in data was sharded across MongoDB servers by user, the shards had filled unevenly, and one of them grew until its data no longer fit in memory — at which point it slowed to the speed of disk and took the site with it.

This reconstruction places users on shards by contiguous id ranges fixed when the cluster was built. User ids only grow, so every new user lands on the same shard.

Fix \`shardFor\` so placement is balanced for any set of user ids.`,
    bugReport: `**BUG-4SQ-SHARD** · Priority: Critical · Reported by: database operations

shardFor(userId, shardCount) must:
- return an integer in [0, shardCount)
- be stable: the same userId and shardCount always give the same shard
- spread users evenly whatever their ids look like — sequential ids, ids far
  above the original ranges, and ids that share a common stride (our id
  service hands out ids in strides of the server count) must each put every
  shard within 10% of an equal share
Hash the id (hash.fnv1a32 over the decimal string is available); do not use
ranges or the raw id modulo the shard count.

shardLoads(checkins, shardCount) counts check-ins per shard (a check-in
follows its user) and fitsInRam(loads, capacity) must then hold for a cluster
sized for the average load plus headroom.

Observed: every user created since launch is on the last shard.`,
    logs: `[shards] shard3 working set above RAM, page faults climbing
[shards] shard0 18%, shard1 17%, shard2 18%, shard3 47% of all check-ins`,
    files: [
      {
        filePath: "src/checkins/placement.js",
        isEditable: true,
        language: "javascript",
        content: `var config = require("./config");

// Users were split into contiguous id ranges when the cluster was built.
exports.shardFor = function (userId, shardCount) {
  var shard = Math.floor(userId / config.RANGE_SIZE);
  return shard < shardCount ? shard : shardCount - 1;
};

exports.shardLoads = function (checkins, shardCount) {
  var loads = [];
  for (var s = 0; s < shardCount; s++) loads.push(0);
  for (var i = 0; i < checkins.length; i++) {
    loads[exports.shardFor(checkins[i].userId, shardCount)] += 1;
  }
  return loads;
};

exports.fitsInRam = function (loads, capacity) {
  for (var i = 0; i < loads.length; i++) if (loads[i] > capacity) return false;
  return true;
};
`,
      },
      {
        filePath: "src/checkins/config.js",
        isEditable: false,
        language: "javascript",
        content: `/*
User ids are allocated in increasing order and never reused. RANGE_SIZE is
the range each shard was given when the cluster was first split.
*/
exports.RANGE_SIZE = 250000;
`,
      },
      {
        filePath: "src/checkins/hash.js",
        isEditable: false,
        language: "javascript",
        content: `// 32-bit FNV-1a over a string's UTF-16 code units, as an unsigned integer.
exports.fnv1a32 = function (str) {
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};
`,
      },
    ],
    tests: [
      {
        name: "shards are in range and stable",
        isHidden: false,
        source: `var p = require("src/checkins/placement");
for (var id = 1; id <= 2000; id += 7) {
  var s = p.shardFor(id, 4);
  assert.ok(s >= 0 && s < 4 && s === Math.floor(s), "shard " + s + " for " + id);
  assert.equal(p.shardFor(id, 4), s, "stable for " + id);
}`,
      },
      {
        name: "sequential users are spread evenly",
        isHidden: false,
        source: `var p = require("src/checkins/placement");
var c = [];
for (var id = 1; id <= 20000; id++) c.push({ userId: id });
var loads = p.shardLoads(c, 4);
for (var s = 0; s < 4; s++) assert.ok(loads[s] >= 4500 && loads[s] <= 5500, "shard " + s + " holds " + loads[s]);`,
      },
      {
        name: "new users far above the original ranges are spread evenly",
        isHidden: true,
        source: `var p = require("src/checkins/placement");
var c = [];
for (var id = 1000000; id < 1020000; id++) c.push({ userId: id });
var loads = p.shardLoads(c, 8);
for (var s = 0; s < 8; s++) assert.ok(loads[s] >= 2250 && loads[s] <= 2750, "shard " + s + " holds " + loads[s]);`,
      },
      {
        name: "strided ids are spread evenly",
        isHidden: true,
        source: `var p = require("src/checkins/placement");
var a = [];
for (var k = 1; k <= 8000; k++) a.push({ userId: 8 * k });
var la = p.shardLoads(a, 4);
for (var s = 0; s < 4; s++) assert.ok(la[s] >= 1800 && la[s] <= 2200, "stride 8 / 4 shards: " + la[s]);
var b = [];
for (var j = 1; j <= 6000; j++) b.push({ userId: 6 * j });
var lb = p.shardLoads(b, 6);
for (var t = 0; t < 6; t++) assert.ok(lb[t] >= 900 && lb[t] <= 1100, "stride 6 / 6 shards: " + lb[t]);`,
      },
      {
        name: "a cluster sized with headroom fits in RAM",
        isHidden: true,
        source: `var p = require("src/checkins/placement");
var c = [];
for (var id = 500000; id < 540000; id++) { c.push({ userId: id }); if (id % 3 === 0) c.push({ userId: id }); }
var loads = p.shardLoads(c, 4);
var total = loads.reduce(function (a, b) { return a + b; }, 0);
assert.equal(total, c.length);
assert.ok(p.fitsInRam(loads, Math.ceil(c.length / 4 * 1.15)), "loads " + JSON.stringify(loads));`,
      },
    ],
    fixedFiles: {
      "src/checkins/placement.js": `var config = require("./config");
var hash = require("./hash");

// Ranges fixed at build time send every new (higher) id to one shard, and a
// bare id % n collapses ids that share a stride. Hashing the id spreads any
// id pattern evenly. (config.RANGE_SIZE stays for the migration tooling.)
exports.shardFor = function (userId, shardCount) {
  return hash.fnv1a32(String(userId)) % shardCount;
};

exports.shardLoads = function (checkins, shardCount) {
  var loads = [];
  for (var s = 0; s < shardCount; s++) loads.push(0);
  for (var i = 0; i < checkins.length; i++) {
    loads[exports.shardFor(checkins[i].userId, shardCount)] += 1;
  }
  return loads;
};

exports.fitsInRam = function (loads, capacity) {
  for (var i = 0; i < loads.length; i++) if (loads[i] > capacity) return false;
  return true;
};
`,
    },
  },

  {
    title: "Too Young by One Birthday",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Validation", "Dates"],
    description: `Modelled on **Twitter, 2016**: after Twitter began showing balloons on users' birthdays, a prank spread urging people to change their birth year to 2007. Twitter requires users to be at least 13, so accounts whose new birthday made them appear younger than that were **locked**, and their owners had to go through support to get back in.

This reconstruction is the logic behind the birthday field in the settings form. It computes ages wrongly around the birthday itself, and it saves a birthday that will lock the account without asking first.

Fix \`birthday.js\`.`,
    bugReport: `**BUG-BDAY-LOCK** · Priority: High · Reported by: account support

Dates are { y, m, d } with m in 1..12.
ageOn(birth, today): whole years completed — today.y - birth.y, minus one if
today's (month, day) is before the birth (month, day). A 29 February birthday
is not yet reached on 28 February of a non-leap year and is reached on 1 March.

reviewChange(proposed, today) returns { action, age, message } (in that order):
- age < 0 (a birthday in the future): { action: "reject", age, message: "Birthday is in the future" }
- age < policy.MIN_AGE: { action: "confirm", age, message: policy.LOCK_WARNING }
  — the form must ask before saving a birthday that locks the account
- otherwise: { action: "save", age, message: "" }

Observed: people born later in the year are credited a year early, and a
birth year of 2007 is saved straight away and the account locked.`,
    logs: `[settings] birthday saved 2007-01-01 age=9
[accounts] locked U-5521: under minimum age`,
    files: [
      {
        filePath: "src/profile/birthday.js",
        isEditable: true,
        language: "javascript",
        content: `var policy = require("./policy");

// Age in whole years on \`today\`. Dates are { y, m, d } with m in 1..12.
exports.ageOn = function (birth, today) {
  return today.y - birth.y;
};

// Decides what the settings form does when the user saves a new birthday.
exports.reviewChange = function (proposed, today) {
  var age = exports.ageOn(proposed, today);
  if (age < 0) return { action: "reject", age: age, message: "Birthday is in the future" };
  return { action: "save", age: age, message: "" };
};
`,
      },
      {
        filePath: "src/profile/policy.js",
        isEditable: false,
        language: "javascript",
        content: `exports.MIN_AGE = 13;
exports.LOCK_WARNING = "Saving this birthday will lock your account: you must be 13 or older to use this service.";
`,
      },
    ],
    tests: [
      {
        name: "age after this year's birthday",
        isHidden: false,
        source: `var b = require("src/profile/birthday");
assert.equal(b.ageOn({ y: 1990, m: 1, d: 5 }, { y: 2016, m: 4, d: 10 }), 26);`,
      },
      {
        name: "age before this year's birthday",
        isHidden: false,
        source: `var b = require("src/profile/birthday");
assert.equal(b.ageOn({ y: 1990, m: 12, d: 5 }, { y: 2016, m: 4, d: 10 }), 25);
assert.equal(b.ageOn({ y: 1990, m: 4, d: 11 }, { y: 2016, m: 4, d: 10 }), 25, "the day before the birthday");`,
      },
      {
        name: "a birthday that locks the account asks first",
        isHidden: false,
        source: `var b = require("src/profile/birthday");
var policy = require("src/profile/policy");
assert.equal(b.reviewChange({ y: 2007, m: 1, d: 1 }, { y: 2016, m: 4, d: 10 }), { action: "confirm", age: 9, message: policy.LOCK_WARNING });`,
      },
      {
        name: "thirteen tomorrow is still twelve today",
        isHidden: true,
        source: `var b = require("src/profile/birthday");
var policy = require("src/profile/policy");
assert.equal(b.reviewChange({ y: 2003, m: 4, d: 11 }, { y: 2016, m: 4, d: 10 }), { action: "confirm", age: 12, message: policy.LOCK_WARNING });
assert.equal(b.reviewChange({ y: 2003, m: 4, d: 10 }, { y: 2016, m: 4, d: 10 }), { action: "save", age: 13, message: "" });`,
      },
      {
        name: "29 February birthdays",
        isHidden: true,
        source: `var b = require("src/profile/birthday");
assert.equal(b.ageOn({ y: 2000, m: 2, d: 29 }, { y: 2017, m: 2, d: 28 }), 16);
assert.equal(b.ageOn({ y: 2000, m: 2, d: 29 }, { y: 2017, m: 3, d: 1 }), 17);
assert.equal(b.ageOn({ y: 2000, m: 2, d: 29 }, { y: 2016, m: 2, d: 29 }), 16);`,
      },
      {
        name: "a birthday later this year is in the future",
        isHidden: true,
        source: `var b = require("src/profile/birthday");
assert.equal(b.reviewChange({ y: 2016, m: 6, d: 1 }, { y: 2016, m: 4, d: 10 }), { action: "reject", age: -1, message: "Birthday is in the future" });
assert.equal(b.reviewChange({ y: 2016, m: 4, d: 10 }, { y: 2016, m: 4, d: 10 }).action, "confirm", "born today is age 0, not the future");`,
      },
    ],
    fixedFiles: {
      "src/profile/birthday.js": `var policy = require("./policy");

// Age in whole years on \`today\`. Dates are { y, m, d } with m in 1..12.
exports.ageOn = function (birth, today) {
  var age = today.y - birth.y;
  // The year only counts once the birthday itself has been reached; the bare
  // year difference credits everyone born later in the year a year early.
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age -= 1;
  return age;
};

// Decides what the settings form does when the user saves a new birthday.
exports.reviewChange = function (proposed, today) {
  var age = exports.ageOn(proposed, today);
  if (age < 0) return { action: "reject", age: age, message: "Birthday is in the future" };
  // Saving an under-age birthday locks the account; never do that without an
  // explicit confirmation from the user.
  if (age < policy.MIN_AGE) return { action: "confirm", age: age, message: policy.LOCK_WARNING };
  return { action: "save", age: age, message: "" };
};
`,
    },
  },

  {
    title: "Three Runs Deep Is Not Deep Enough",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Algorithms", "Overflow"],
    description: `Modelled on the **TimSort bug found in 2015** by Stijn de Gouw and colleagues while formally verifying the sort used by CPython and OpenJDK: \`mergeCollapse\`, which merges runs to restore the run-stack invariant after each new run is pushed, **only checked the top three runs**. The invariant could therefore break deeper in the stack, and because the size of Java's run stack had been derived from that invariant, a carefully constructed input could overflow it and throw \`ArrayIndexOutOfBoundsException\`. CPython adopted the corrected check; OpenJDK enlarged the stack.

This reconstruction models only the run stack: run lengths are pushed and merged, and \`RunInvariant\` checks the whole stack.

Fix \`mergeCollapse\` so the invariant holds over the whole stack after every push.`,
    bugReport: `**BUG-TIMSORT-2015** · Priority: High · Reported by: formal verification

The run-stack invariant (RunInvariant.holds, locked) must hold for EVERY
position of runLen after each push:
  runLen[i] > runLen[i+1] + runLen[i+2]   and   runLen[i] > runLen[i+1]

mergeCollapse() must use the corrected rule, looping while more than one run
remains, with n = size - 2:
- if (n > 0 && runLen[n-1] <= runLen[n] + runLen[n+1])
     || (n > 1 && runLen[n-2] <= runLen[n-1] + runLen[n]):
       if runLen[n-1] < runLen[n+1] then n = n - 1; mergeAt(n)
- else if runLen[n] <= runLen[n+1]: mergeAt(n)
- else stop
mergeAt(i) replaces runs i and i+1 by their sum and records i in merges.

Example: RunStack.of(120, 80, 25, 20) then push(30) must end as [275] with
merges [2, 2, 1, 0].

Observed: that example ends as [120, 80, 45, 30] — 120 <= 80 + 45.`,
    logs: `[sort] run stack [120, 80, 45, 30] violates invariant at depth 0
[sort] java.lang.ArrayIndexOutOfBoundsException in pushRun (run stack sized from the invariant)`,
    files: [
      {
        filePath: "src/sort/RunStack.java",
        isEditable: true,
        language: "java",
        content: `class RunStack {
    final List<Integer> runLen = new ArrayList<>();
    final List<Integer> merges = new ArrayList<>();

    static RunStack of(int... lens) {
        RunStack s = new RunStack();
        for (int l : lens) s.runLen.add(l);
        return s;
    }

    void push(int len) {
        runLen.add(len);
        mergeCollapse();
    }

    void mergeAt(int i) {
        runLen.set(i, runLen.get(i) + runLen.get(i + 1));
        runLen.remove(i + 1);
        merges.add(i);
    }

    // Merges adjacent runs until the stack invariant is re-established.
    void mergeCollapse() {
        while (runLen.size() > 1) {
            int n = runLen.size() - 2;
            if (n > 0 && runLen.get(n - 1) <= runLen.get(n) + runLen.get(n + 1)) {
                if (runLen.get(n - 1) < runLen.get(n + 1)) n--;
                mergeAt(n);
            } else if (runLen.get(n) <= runLen.get(n + 1)) {
                mergeAt(n);
            } else {
                break;
            }
        }
    }
}`,
      },
      {
        filePath: "src/sort/RunInvariant.java",
        isEditable: false,
        language: "java",
        content: `class RunInvariant {
    // The TimSort run-stack invariant, for every position i (0 = bottom):
    //   len[i] > len[i+1] + len[i+2]   and   len[i] > len[i+1]
    // Run lengths then grow at least as fast as Fibonacci numbers from the
    // top down, which is what bounds the depth of the stack.
    static boolean holds(List<Integer> lens) {
        for (int i = 0; i + 1 < lens.size(); i++) {
            if (lens.get(i) <= lens.get(i + 1)) return false;
            if (i + 2 < lens.size() && lens.get(i) <= lens.get(i + 1) + lens.get(i + 2)) return false;
        }
        return true;
    }
}`,
      },
    ],
    tests: [
      {
        name: "a longer run on top is merged down",
        isHidden: false,
        source: `                RunStack s = new RunStack();
                s.push(10);
                s.push(20);
                BugAssert.equal(s.runLen, Arrays.asList(30));`,
      },
      {
        name: "a valid stack is left alone",
        isHidden: false,
        source: `                RunStack s = RunStack.of(100, 40, 20);
                s.push(10);
                BugAssert.equal(s.runLen, Arrays.asList(100, 40, 20, 10));
                BugAssert.equal(s.merges.size(), 0);`,
      },
      {
        name: "the invariant holds below the top three runs",
        isHidden: false,
        source: `                RunStack s = RunStack.of(120, 80, 25, 20);
                s.push(30);
                BugAssert.ok(RunInvariant.holds(s.runLen), "stack is " + s.runLen);`,
      },
      {
        name: "the counterexample collapses exactly as specified",
        isHidden: true,
        source: `                RunStack s = RunStack.of(120, 80, 25, 20);
                s.push(30);
                BugAssert.equal(s.runLen, Arrays.asList(275));
                BugAssert.equal(s.merges, Arrays.asList(2, 2, 1, 0));`,
      },
      {
        name: "the invariant holds after every push of a long sequence",
        isHidden: true,
        source: `                RunStack s = new RunStack();
                for (int i = 0; i < 300; i++) {
                    s.push((i * 37 % 50) + 1);
                    BugAssert.ok(RunInvariant.holds(s.runLen), "after push " + i + ": " + s.runLen);
                }`,
      },
    ],
    fixedFiles: {
      "src/sort/RunStack.java": `class RunStack {
    final List<Integer> runLen = new ArrayList<>();
    final List<Integer> merges = new ArrayList<>();

    static RunStack of(int... lens) {
        RunStack s = new RunStack();
        for (int l : lens) s.runLen.add(l);
        return s;
    }

    void push(int len) {
        runLen.add(len);
        mergeCollapse();
    }

    void mergeAt(int i) {
        runLen.set(i, runLen.get(i) + runLen.get(i + 1));
        runLen.remove(i + 1);
        merges.add(i);
    }

    // Merges adjacent runs until the stack invariant is re-established.
    void mergeCollapse() {
        while (runLen.size() > 1) {
            int n = runLen.size() - 2;
            // Checking only the top three runs lets a merge break the
            // invariant one level further down (de Gouw et al., 2015); the
            // fourth run from the top has to be checked as well.
            if ((n > 0 && runLen.get(n - 1) <= runLen.get(n) + runLen.get(n + 1))
                    || (n > 1 && runLen.get(n - 2) <= runLen.get(n - 1) + runLen.get(n))) {
                if (runLen.get(n - 1) < runLen.get(n + 1)) n--;
                mergeAt(n);
            } else if (runLen.get(n) <= runLen.get(n + 1)) {
                mergeAt(n);
            } else {
                break;
            }
        }
    }
}`,
    },
  },

  {
    title: "The Fields You Never Saw",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Security", "Privacy"],
    description: `Modelled on the **browser autofill phishing demo published in January 2017** by Finnish developer Viljami Kuosmanen: a page showed only name and email fields, but also contained address, phone and other fields positioned off-screen. When a user accepted the browser's autofill suggestion, Chrome — and other browsers and extensions that fill a whole profile at once, Safari and Opera among them — **filled the invisible fields too**, handing the page data the user never saw being entered.

This reconstruction fills a form from a saved profile. It skips \`type="hidden"\` inputs and nothing else.

Fix \`autofill\` so only fields a person can actually see are filled.`,
    bugReport: `**BUG-AUTOFILL-HIDDEN** · Priority: High (privacy) · Reported by: security

autofill(fields, data, page) returns { filled, skipped }.
A field is { name, autocomplete, type, value, style: { display, visibility,
opacity }, rect: { x, y, width, height } }; page is { width, height }.

A field is a CANDIDATE when profile.keyFor(field.autocomplete) names a key
that data has a value for. Non-candidates are ignored entirely.
A candidate is filled (filled[name] = value, in field order) only when:
- it is empty (value is "" or missing), and
- it is VISIBLE: type !== "hidden", style.display !== "none",
  style.visibility !== "hidden", style.opacity > 0, rect.width > 0,
  rect.height > 0, and the rect overlaps the page:
  x < page.width, y < page.height, x + width > 0, y + height > 0
Every other candidate is listed in skipped (by name, in field order).

Observed: a form showing only name and email also receives the address and
phone number from fields positioned at x = -500.`,
    logs: `[autofill] form#newsletter filled 6 fields (2 on screen)`,
    files: [
      {
        filePath: "src/forms/autofill.js",
        isEditable: true,
        language: "javascript",
        content: `var profile = require("./profile");

// Fills every empty field whose autocomplete token we hold a value for.
exports.autofill = function (fields, data, page) {
  var filled = {};
  var skipped = [];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var key = profile.keyFor(f.autocomplete);
    if (!key || data[key] === undefined) continue;
    if (f.type === "hidden" || f.value) {
      skipped.push(f.name);
      continue;
    }
    filled[f.name] = data[key];
  }
  return { filled: filled, skipped: skipped };
};
`,
      },
      {
        filePath: "src/forms/profile.js",
        isEditable: false,
        language: "javascript",
        content: `// autocomplete token -> key in the saved profile.
var TOKENS = {
  "name": "fullName",
  "email": "email",
  "tel": "phone",
  "street-address": "street",
  "postal-code": "postcode",
  "country-name": "country"
};

exports.keyFor = function (token) {
  return Object.prototype.hasOwnProperty.call(TOKENS, token) ? TOKENS[token] : null;
};
`,
      },
    ],
    tests: [
      {
        name: "visible name and email are filled",
        isHidden: false,
        source: `var a = require("src/forms/autofill");
function field(name, token, x) { return { name: name, autocomplete: token, type: "text", value: "", style: { display: "block", visibility: "visible", opacity: 1 }, rect: { x: x, y: 100, width: 200, height: 24 } }; }
var data = { fullName: "Ana Lee", email: "ana@example.test", phone: "555-0100" };
assert.equal(a.autofill([field("n", "name", 20), field("e", "email", 20)], data, { width: 1000, height: 2000 }),
  { filled: { n: "Ana Lee", e: "ana@example.test" }, skipped: [] });`,
      },
      {
        name: "a field pushed off the page is not filled",
        isHidden: false,
        source: `var a = require("src/forms/autofill");
function field(name, token, x) { return { name: name, autocomplete: token, type: "text", value: "", style: { display: "block", visibility: "visible", opacity: 1 }, rect: { x: x, y: 100, width: 200, height: 24 } }; }
var data = { fullName: "Ana Lee", email: "ana@example.test", phone: "555-0100" };
assert.equal(a.autofill([field("n", "name", 20), field("e", "email", 20), field("p", "tel", -500)], data, { width: 1000, height: 2000 }),
  { filled: { n: "Ana Lee", e: "ana@example.test" }, skipped: ["p"] });`,
      },
      {
        name: "styled-away and zero-size fields are not filled",
        isHidden: true,
        source: `var a = require("src/forms/autofill");
function field(name, token, style, rect) { return { name: name, autocomplete: token, type: "text", value: "", style: style, rect: rect }; }
var ok = { display: "block", visibility: "visible", opacity: 1 };
var box = { x: 10, y: 10, width: 100, height: 20 };
var data = { fullName: "Ana Lee", email: "e@x.test", phone: "1", street: "1 Main St", postcode: "12345", country: "FI" };
var fields = [
  field("a", "name", ok, box),
  field("b", "email", { display: "none", visibility: "visible", opacity: 1 }, box),
  field("c", "tel", { display: "block", visibility: "hidden", opacity: 1 }, box),
  field("d", "street-address", { display: "block", visibility: "visible", opacity: 0 }, box),
  field("e", "postal-code", ok, { x: 10, y: 10, width: 0, height: 20 }),
  field("f", "country-name", ok, { x: 10, y: 5000, width: 100, height: 20 })
];
assert.equal(a.autofill(fields, data, { width: 1000, height: 2000 }), { filled: { a: "Ana Lee" }, skipped: ["b", "c", "d", "e", "f"] });`,
      },
      {
        name: "a partly visible field counts as visible",
        isHidden: true,
        source: `var a = require("src/forms/autofill");
var f = { name: "n", autocomplete: "name", type: "text", value: "", style: { display: "block", visibility: "visible", opacity: 0.5 }, rect: { x: -10, y: -5, width: 200, height: 24 } };
assert.equal(a.autofill([f], { fullName: "Ana" }, { width: 800, height: 600 }), { filled: { n: "Ana" }, skipped: [] });`,
      },
      {
        name: "typed-in, hidden-type and unknown fields",
        isHidden: true,
        source: `var a = require("src/forms/autofill");
function field(name, token, type, value) { return { name: name, autocomplete: token, type: type, value: value, style: { display: "block", visibility: "visible", opacity: 1 }, rect: { x: 0, y: 0, width: 50, height: 20 } }; }
var fields = [field("n", "name", "text", "Typed"), field("h", "email", "hidden", ""), field("z", "nickname", "text", ""), field("t", "tel", "tel", "")];
assert.equal(a.autofill(fields, { fullName: "Ana", email: "e@x.test" }, { width: 800, height: 600 }), { filled: {}, skipped: ["n", "h"] });`,
      },
    ],
    fixedFiles: {
      "src/forms/autofill.js": `var profile = require("./profile");

// Only a field the person can actually see may receive their data: a page
// can position, hide or shrink inputs so that autofill fills them silently.
function isVisible(f, page) {
  var r = f.rect;
  if (f.type === "hidden") return false;
  if (f.style.display === "none" || f.style.visibility === "hidden") return false;
  if (!(f.style.opacity > 0)) return false;
  if (!(r.width > 0 && r.height > 0)) return false;
  return r.x < page.width && r.y < page.height && r.x + r.width > 0 && r.y + r.height > 0;
}

// Fills every empty, visible field whose autocomplete token we hold a value for.
exports.autofill = function (fields, data, page) {
  var filled = {};
  var skipped = [];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var key = profile.keyFor(f.autocomplete);
    if (!key || data[key] === undefined) continue;
    if (f.value || !isVisible(f, page)) {
      skipped.push(f.name);
      continue;
    }
    filled[f.name] = data[key];
  }
  return { filled: filled, skipped: skipped };
};
`,
    },
  },

  {
    title: "The Car That Only Asked for Its VIN",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Auth", "Security"],
    description: `Modelled on the **Nissan Leaf / NissanConnect EV disclosure, February 2016**: security researcher Troy Hunt showed that the API behind Nissan's companion app identified a car by its **VIN alone**. Anyone who knew or guessed a Leaf's VIN could switch its climate control on and off and read its recent trip history — no login, no link to the owner. Nissan took the service offline while it was fixed.

This reconstruction is that remote-control endpoint. It looks a car up by VIN and does what it is asked.

Fix \`handle\` so only the car's owner, with a live session, can reach it.`,
    bugReport: `**BUG-LEAF-VIN** · Priority: Critical · Reported by: external researcher

handle(req, store) with req = { vin, action, token, now } returns { status, body }.
store.sessions: token -> { userId, expiresAt }; store.vehicles: vin -> { ownerId, climate, trips }.

Checks, in this order:
1. Authentication: req.token must name a session in store.sessions whose
   expiresAt > req.now. Otherwise -> { status: 401, body: { error: "unauthenticated" } }.
2. Authorisation: the vehicle must exist AND vehicle.ownerId must equal the
   session's userId. Otherwise -> { status: 403, body: { error: "forbidden" } }
   (the same answer for an unknown VIN, so VINs cannot be probed).
3. Actions: "climate_on" / "climate_off" set vehicle.climate and return
   { status: 200, body: { vin, climate } }; "trips" returns
   { status: 200, body: { vin, trips } }; anything else ->
   { status: 400, body: { error: "unknown action" } }.
A refused request must not change any vehicle.

Observed: a request carrying only a VIN turns on a stranger's heater.`,
    logs: `[carwings] POST /climate vin=SJNFAAZE0U60XXXXX token=<none> -> 200
[carwings] GET /trips vin=SJNFAAZE0U60XXXXX token=<none> -> 200 (14 trips)`,
    files: [
      {
        filePath: "src/telematics/api.js",
        isEditable: true,
        language: "javascript",
        content: `// Remote API for the companion app: climate control and trip history.
exports.handle = function (req, store) {
  var car = store.vehicles[req.vin];
  if (!car) return { status: 404, body: { error: "unknown vehicle" } };

  if (req.action === "climate_on" || req.action === "climate_off") {
    car.climate = req.action === "climate_on";
    return { status: 200, body: { vin: req.vin, climate: car.climate } };
  }
  if (req.action === "trips") {
    return { status: 200, body: { vin: req.vin, trips: car.trips } };
  }
  return { status: 400, body: { error: "unknown action" } };
};
`,
      },
      {
        filePath: "src/telematics/fixtures.js",
        isEditable: false,
        language: "javascript",
        content: `// Builds a small store: two owners, two cars, one session each.
exports.store = function () {
  return {
    sessions: {
      "tok-ana": { userId: "ana", expiresAt: 5000 },
      "tok-bo": { userId: "bo", expiresAt: 5000 },
      "tok-old": { userId: "ana", expiresAt: 1000 }
    },
    vehicles: {
      "VIN-ANA-1": { ownerId: "ana", climate: false, trips: [{ km: 12 }, { km: 30 }] },
      "VIN-BO-1": { ownerId: "bo", climate: false, trips: [{ km: 4 }] }
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "the owner can read their trips",
        isHidden: false,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "trips", token: "tok-ana", now: 2000 }, s),
  { status: 200, body: { vin: "VIN-ANA-1", trips: [{ km: 12 }, { km: 30 }] } });`,
      },
      {
        name: "a request with only a VIN is refused",
        isHidden: false,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-BO-1", action: "climate_on", now: 2000 }, s), { status: 401, body: { error: "unauthenticated" } });
assert.equal(s.vehicles["VIN-BO-1"].climate, false, "the heater must stay off");`,
      },
      {
        name: "another owner's session cannot touch the car",
        isHidden: true,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-BO-1", action: "climate_on", token: "tok-ana", now: 2000 }, s), { status: 403, body: { error: "forbidden" } });
assert.equal(api.handle({ vin: "VIN-BO-1", action: "trips", token: "tok-ana", now: 2000 }, s), { status: 403, body: { error: "forbidden" } });
assert.equal(s.vehicles["VIN-BO-1"].climate, false);`,
      },
      {
        name: "an unknown VIN looks the same as someone else's",
        isHidden: true,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-NOPE", action: "trips", token: "tok-ana", now: 2000 }, s), { status: 403, body: { error: "forbidden" } });
assert.equal(api.handle({ vin: "VIN-NOPE", action: "trips", now: 2000 }, s), { status: 401, body: { error: "unauthenticated" } }, "authentication comes first");`,
      },
      {
        name: "expired and unknown sessions are unauthenticated",
        isHidden: true,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "climate_on", token: "tok-old", now: 2000 }, s), { status: 401, body: { error: "unauthenticated" } });
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "climate_on", token: "tok-ana", now: 5000 }, s), { status: 401, body: { error: "unauthenticated" } }, "expiresAt is exclusive");
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "climate_on", token: "guess", now: 2000 }, s).status, 401);
assert.equal(s.vehicles["VIN-ANA-1"].climate, false);`,
      },
      {
        name: "the owner controls the climate",
        isHidden: true,
        source: `var api = require("src/telematics/api");
var s = require("src/telematics/fixtures").store();
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "climate_on", token: "tok-ana", now: 2000 }, s), { status: 200, body: { vin: "VIN-ANA-1", climate: true } });
assert.equal(api.handle({ vin: "VIN-ANA-1", action: "honk", token: "tok-ana", now: 2000 }, s), { status: 400, body: { error: "unknown action" } });`,
      },
    ],
    fixedFiles: {
      "src/telematics/api.js": `// Remote API for the companion app: climate control and trip history.
exports.handle = function (req, store) {
  // A VIN is printed on the windscreen — it identifies a car, it does not
  // authenticate anyone. Require a live session first...
  var session = req.token ? store.sessions[req.token] : null;
  if (!session || !(session.expiresAt > req.now)) {
    return { status: 401, body: { error: "unauthenticated" } };
  }
  // ...then that the session's user owns this car. Unknown and foreign VINs
  // get the same answer so the endpoint cannot be used to probe for cars.
  var car = store.vehicles[req.vin];
  if (!car || car.ownerId !== session.userId) {
    return { status: 403, body: { error: "forbidden" } };
  }

  if (req.action === "climate_on" || req.action === "climate_off") {
    car.climate = req.action === "climate_on";
    return { status: 200, body: { vin: req.vin, climate: car.climate } };
  }
  if (req.action === "trips") {
    return { status: 200, body: { vin: req.vin, trips: car.trips } };
  }
  return { status: 400, body: { error: "unknown action" } };
};
`,
    },
  },

  {
    title: "The Loss That Lost Its Minus Sign",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Money", "Accounting"],
    description: `Modelled on **Fidelity's Magellan Fund, 1994**: late in the year the fund told shareholders to expect a sizeable year-end distribution — and then paid none. Fidelity explained that a tax accountant had **omitted the minus sign** on a net capital loss of $1.3 billion, so it was recorded as a gain and the distribution estimate was overstated by $2.6 billion.

This reconstruction aggregates a fund ledger into its net capital result and the per-share distribution estimate. It normalises the signs of the entries on the way in.

Fix \`ledger.py\` so losses reduce the result.`,
    bugReport: `**BUG-MAGELLAN-94** · Priority: Critical · Reported by: fund accounting

Entries are { "fund", "kind", "amount" } with amounts in cents. Feeds disagree
on sign conventions, so the SIGN of amount is not reliable — the kind is:
- kind "gain": adds abs(amount)
- kind "loss": subtracts abs(amount)
- any other kind (dividend, fee, …) is not a capital item and is ignored

net_capital(entries) -> the signed total.
net_by_fund(entries) -> { fund: net_capital of that fund's entries } for every
fund that has at least one entry (of any kind).
distribution_estimate(entries, shares) -> { "net_capital", "per_share_cents",
"carryforward" }: when net > 0, per_share_cents = net // shares and
carryforward = 0; otherwise per_share_cents = 0 and carryforward = -net.

Observed: a year with a large realised loss reports it as a gain of the same
size, and the estimate sent to shareholders is overstated by twice the loss.`,
    logs: `[fund-acct] MAGELLAN realised gains 1,000 loss 1,300 -> net +2,300
[fund-acct] distribution estimate published: net +2,300 (restated: -300)`,
    files: [
      {
        filePath: "src/funds/ledger.py",
        isEditable: true,
        language: "python",
        content: `# Year-end capital result and the distribution estimate sent to shareholders.

CAPITAL_KINDS = ("gain", "loss")


def signed_amount(entry):
    # Feeds disagree on sign conventions; normalise to magnitudes.
    return abs(entry["amount"])


def net_capital(entries):
    total = 0
    for e in entries:
        if e["kind"] in CAPITAL_KINDS:
            total += signed_amount(e)
    return total


def net_by_fund(entries):
    grouped = {}
    for e in entries:
        grouped.setdefault(e["fund"], []).append(e)
    return {fund: net_capital(rows) for fund, rows in grouped.items()}


def distribution_estimate(entries, shares):
    net = net_capital(entries)
    if net > 0:
        return {"net_capital": net, "per_share_cents": net // shares, "carryforward": 0}
    return {"net_capital": net, "per_share_cents": 0, "carryforward": -net}
`,
      },
      {
        filePath: "src/funds/feeds.py",
        isEditable: false,
        language: "python",
        content: `# Notes on the feeds that populate the ledger.
#
# The custodian feed writes every amount as a positive magnitude and relies on
# "kind" for direction. The legacy import writes losses as negative amounts.
# Both land in the same table, so direction must come from "kind" alone.
FEEDS = ("custodian", "legacy_import")
`,
      },
    ],
    tests: [
      {
        name: "gains add up",
        isHidden: false,
        source: `l = bug_require("src/funds/ledger.py")
e = [{"fund": "MAG", "kind": "gain", "amount": 500}, {"fund": "MAG", "kind": "gain", "amount": 300}]
assert_.equal(l.net_capital(e), 800)`,
      },
      {
        name: "a loss reduces the net",
        isHidden: false,
        source: `l = bug_require("src/funds/ledger.py")
e = [{"fund": "MAG", "kind": "gain", "amount": 1000}, {"fund": "MAG", "kind": "loss", "amount": 1300}]
assert_.equal(l.net_capital(e), -300, "a loss recorded as a gain overstates the result by twice the loss")`,
      },
      {
        name: "a loss entered as a negative amount is still a loss",
        isHidden: true,
        source: `l = bug_require("src/funds/ledger.py")
e = [{"fund": "MAG", "kind": "gain", "amount": 1000}, {"fund": "MAG", "kind": "loss", "amount": -1300}, {"fund": "MAG", "kind": "gain", "amount": -200}]
assert_.equal(l.net_capital(e), -100)`,
      },
      {
        name: "a net loss pays nothing and carries forward",
        isHidden: true,
        source: `l = bug_require("src/funds/ledger.py")
e = [{"fund": "MAG", "kind": "gain", "amount": 1000}, {"fund": "MAG", "kind": "loss", "amount": 1300}, {"fund": "MAG", "kind": "dividend", "amount": 900}]
assert_.equal(l.distribution_estimate(e, 10), {"net_capital": -300, "per_share_cents": 0, "carryforward": 300})`,
      },
      {
        name: "a net gain is distributed per share",
        isHidden: true,
        source: `l = bug_require("src/funds/ledger.py")
e = [{"fund": "MAG", "kind": "gain", "amount": 5000}, {"fund": "MAG", "kind": "loss", "amount": 1001}, {"fund": "MAG", "kind": "fee", "amount": -50}]
assert_.equal(l.distribution_estimate(e, 4), {"net_capital": 3999, "per_share_cents": 999, "carryforward": 0})`,
      },
      {
        name: "net per fund",
        isHidden: true,
        source: `l = bug_require("src/funds/ledger.py")
e = [
    {"fund": "MAG", "kind": "loss", "amount": 1300},
    {"fund": "CON", "kind": "gain", "amount": 700},
    {"fund": "MAG", "kind": "gain", "amount": 100},
    {"fund": "IDX", "kind": "dividend", "amount": 40},
]
assert_.equal(l.net_by_fund(e), {"MAG": -1200, "CON": 700, "IDX": 0})`,
      },
    ],
    fixedFiles: {
      "src/funds/ledger.py": `# Year-end capital result and the distribution estimate sent to shareholders.

CAPITAL_KINDS = ("gain", "loss")


def signed_amount(entry):
    # Feeds disagree on the sign of amount, so the magnitude comes from the
    # amount and the direction from the kind. Dropping the direction turns a
    # loss into a gain of the same size.
    magnitude = abs(entry["amount"])
    return -magnitude if entry["kind"] == "loss" else magnitude


def net_capital(entries):
    total = 0
    for e in entries:
        if e["kind"] in CAPITAL_KINDS:
            total += signed_amount(e)
    return total


def net_by_fund(entries):
    grouped = {}
    for e in entries:
        grouped.setdefault(e["fund"], []).append(e)
    return {fund: net_capital(rows) for fund, rows in grouped.items()}


def distribution_estimate(entries, shares):
    net = net_capital(entries)
    if net > 0:
        return {"net_capital": net, "per_share_cents": net // shares, "carryforward": 0}
    return {"net_capital": net, "per_share_cents": 0, "carryforward": -net}
`,
    },
  },

  {
    title: "The Sure Hit That Missed One Time in 256",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Randomness", "Games"],
    description: `Modelled on the **first-generation Pokémon games** (Red and Green in Japan in 1996, Red and Blue abroad): the accuracy check drew a random byte from 0 to 255 and hit only if it was **strictly less than** the move's accuracy scaled to that range. Scaled accuracy tops out at 255, so a roll of 255 always missed — even a "100% accurate" move missed one time in 256.

This reconstruction is the battle screen's hit check, with the random source injected.

Fix \`willHit\` so a 100%-accurate move always hits.`,
    bugReport: `**BUG-1-IN-256** · Priority: Medium · Reported by: players, for decades

willHit(accuracyPct, rng) — rng() returns an integer roll in 0..255.
- accuracyPct >= 100: always hits, and rng is NOT called (the roll is not drawn)
- otherwise: draw exactly one roll; hit iff roll < threshold(accuracyPct),
  where threshold(p) = floor(p * 255 / 100)
hitsOutOf256(p) counts the hits over every possible roll: 256 for a 100% move,
127 for a 50% move.

Observed: a 100% move misses when the roll is 255.`,
    logs: `[battle] TACKLE acc=100 roll=255 -> MISSED`,
    files: [
      {
        filePath: "src/battle/accuracy.js",
        isEditable: true,
        language: "javascript",
        content: `var rules = require("./rules");

// Accuracy is a percentage, scaled to the range of the random byte.
exports.threshold = function (accuracyPct) {
  var t = Math.floor(accuracyPct * rules.MAX_ROLL / 100);
  return t > rules.MAX_ROLL ? rules.MAX_ROLL : t;
};

exports.willHit = function (accuracyPct, rng) {
  return rng() < exports.threshold(accuracyPct);
};

exports.hitsOutOf256 = function (accuracyPct) {
  var hits = 0;
  for (var roll = 0; roll <= rules.MAX_ROLL; roll++) {
    if (exports.willHit(accuracyPct, function () { return roll; })) hits++;
  }
  return hits;
};
`,
      },
      {
        filePath: "src/battle/rules.js",
        isEditable: false,
        language: "javascript",
        content: `// The random source yields one byte per draw: 0..MAX_ROLL inclusive.
exports.MAX_ROLL = 255;
`,
      },
    ],
    tests: [
      {
        name: "a 100% move hits on a low roll",
        isHidden: false,
        source: `var a = require("src/battle/accuracy");
assert.equal(a.willHit(100, function () { return 0; }), true);`,
      },
      {
        name: "a 100% move hits on the highest roll",
        isHidden: false,
        source: `var a = require("src/battle/accuracy");
assert.equal(a.willHit(100, function () { return 255; }), true, "a sure hit must not miss on 255");`,
      },
      {
        name: "a 100% move hits on every roll",
        isHidden: true,
        source: `var a = require("src/battle/accuracy");
assert.equal(a.hitsOutOf256(100), 256);`,
      },
      {
        name: "a 50% move keeps its odds",
        isHidden: true,
        source: `var a = require("src/battle/accuracy");
assert.equal(a.willHit(50, function () { return 126; }), true);
assert.equal(a.willHit(50, function () { return 127; }), false);
assert.equal(a.hitsOutOf256(50), 127);`,
      },
      {
        name: "a sure hit does not draw a roll",
        isHidden: true,
        source: `var a = require("src/battle/accuracy");
var calls = 0;
assert.equal(a.willHit(100, function () { calls++; return 255; }), true);
assert.equal(calls, 0, "the random sequence must not advance");
var more = 0;
a.willHit(70, function () { more++; return 10; });
assert.equal(more, 1, "a normal move draws exactly one roll");`,
      },
    ],
    fixedFiles: {
      "src/battle/accuracy.js": `var rules = require("./rules");

// Accuracy is a percentage, scaled to the range of the random byte.
exports.threshold = function (accuracyPct) {
  var t = Math.floor(accuracyPct * rules.MAX_ROLL / 100);
  return t > rules.MAX_ROLL ? rules.MAX_ROLL : t;
};

exports.willHit = function (accuracyPct, rng) {
  // Scaled accuracy tops out at MAX_ROLL, so "roll < threshold" leaves the
  // top roll a miss even for a sure hit. A 100% move skips the roll entirely.
  if (accuracyPct >= 100) return true;
  return rng() < exports.threshold(accuracyPct);
};

exports.hitsOutOf256 = function (accuracyPct) {
  var hits = 0;
  for (var roll = 0; roll <= rules.MAX_ROLL; roll++) {
    if (exports.willHit(accuracyPct, function () { return roll; })) hits++;
  }
  return hits;
};
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE18_ORIGINS: Record<string, string> = {
  "The Intermediate Nobody Was Watching": "Mozilla Firefox · 2019",
  "The Invite Link That Shared a Hash": "Slack · 2022",
  "Four Hours of Any Password": "Dropbox · 2011",
  "The Fees That Priced People Out": "Wells Fargo · 2018",
  "Divided by the Sum, Not the Average": "JPMorgan Chase · 2012",
  "The Week That Belonged to Next Year": "Twitter · 2014",
  "The Rover That Could Not Finish Booting": "NASA Spirit rover · 2004",
  "Orders Sent to the Unknown Queue": "VA / Oracle Cerner · 2022",
  "One Shard Took Every New User": "Foursquare · 2010",
  "Too Young by One Birthday": "Twitter · 2016",
  "Three Runs Deep Is Not Deep Enough": "TimSort (CPython, OpenJDK) · 2015",
  "The Fields You Never Saw": "Browser autofill · 2017",
  "The Car That Only Asked for Its VIN": "Nissan Leaf · 2016",
  "The Loss That Lost Its Minus Sign": "Fidelity Magellan · 1994",
  "The Sure Hit That Missed One Time in 256": "Pokémon Red/Blue · 1996",
};
