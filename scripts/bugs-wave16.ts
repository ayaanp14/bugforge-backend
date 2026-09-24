/**
 * Wave 16 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE16: BugSpec[] = [

  {
    title: "The Key That Was Marked Keep",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Auth", "Config", "State"],
    description: `Modelled on the **Microsoft Azure Active Directory outage of March 15, 2021**. Microsoft's root-cause analysis says that during an automated rotation of signing keys, a key that had been **marked for retention was removed** because of a bug in the rotation process. Tokens signed with that key then failed validation, and sign-ins to many Microsoft and customer services failed for hours.

This project is a reconstruction: \`rotation.js\` builds the next key set when a new signing key is introduced, and \`validator.js\` accepts a token whose \`kid\` is still in the set. The rotation keeps only the key it is retiring and silently drops everything flagged \`retain\`.

Fix \`rotate\` so every key marked for retention survives the rotation.`,
    bugReport: `**BUG-AAD-0315** · Priority: Critical (sign-in outage) · Reported by: identity SRE

rotate(keys, newKid) takes the current key set — an array of
{ kid, active, retain } — and returns the NEXT key set:
- every key with active: true is retired to { kid, active: false, retain: true }
  (tokens it signed are still in flight)
- every key with retain: true is kept exactly as it is
- a key that is neither active nor retained is dropped
- surviving keys keep their original order; the new key
  { kid: newKid, active: true, retain: false } is appended last
- the input array and its objects are not modified

Observed: after the 19:00 rotation, tokens signed with a key flagged retain
fail validation — the key is gone from the published set.`,
    logs: `[keys] rotate: introduced k-2103, retired k-2102
[keys] published set: k-2102, k-2103 (3 keys dropped)
[auth] token kid=k-2031 rejected: unknown signing key (x41,208/min)`,
    files: [
      {
        filePath: "src/keys/rotation.js",
        isEditable: true,
        language: "javascript",
        content: `// Builds the next signing-key set when a new key is introduced.
exports.rotate = function (keys, newKid) {
  var next = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.active) {
      next.push({ kid: k.kid, active: false, retain: true });
    }
  }
  next.push({ kid: newKid, active: true, retain: false });
  return next;
};
`,
      },
      {
        filePath: "src/keys/validator.js",
        isEditable: false,
        language: "javascript",
        content: `// A token validates while the key that signed it is still published.
exports.validates = function (token, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].kid === token.kid) return true;
  }
  return false;
};
`,
      },
      {
        filePath: "src/keys/NOTES.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Key lifecycle: active (signs new tokens) -> retained (verifies tokens already
issued) -> dropped. "retain" is set by other systems too — for example a key
pinned while long-lived tokens it signed are still valid. Rotation must never
decide on its own that a retained key can go.
*/
`,
      },
    ],
    tests: [
      {
        name: "the new key becomes the active one",
        isHidden: false,
        source: `var rotate = require("src/keys/rotation").rotate;
var next = rotate([{ kid: "k1", active: true, retain: false }], "k2");
assert.equal(next, [{ kid: "k1", active: false, retain: true }, { kid: "k2", active: true, retain: false }]);`,
      },
      {
        name: "a key marked retain survives rotation",
        isHidden: false,
        source: `var rotate = require("src/keys/rotation").rotate;
var keys = [
  { kid: "k0", active: false, retain: true },
  { kid: "k1", active: true, retain: false }
];
assert.equal(rotate(keys, "k2"), [
  { kid: "k0", active: false, retain: true },
  { kid: "k1", active: false, retain: true },
  { kid: "k2", active: true, retain: false }
], "k0 was marked for retention");`,
      },
      {
        name: "tokens signed with a retained key still validate after rotation",
        isHidden: true,
        source: `var rotate = require("src/keys/rotation").rotate;
var validates = require("src/keys/validator").validates;
var keys = [
  { kid: "old", active: false, retain: true },
  { kid: "cur", active: true, retain: false }
];
var next = rotate(rotate(keys, "n1"), "n2");
assert.ok(validates({ kid: "old" }, next), "the retained key must still verify");
assert.ok(validates({ kid: "cur" }, next));
assert.ok(validates({ kid: "n2" }, next));`,
      },
      {
        name: "keys neither active nor retained are dropped, order kept",
        isHidden: true,
        source: `var rotate = require("src/keys/rotation").rotate;
var keys = [
  { kid: "a", active: false, retain: false },
  { kid: "b", active: false, retain: true },
  { kid: "c", active: true, retain: false },
  { kid: "d", active: false, retain: true }
];
assert.equal(rotate(keys, "e").map(function (k) { return k.kid; }), ["b", "c", "d", "e"]);`,
      },
      {
        name: "the input key set is not modified",
        isHidden: true,
        source: `var rotate = require("src/keys/rotation").rotate;
var keys = [{ kid: "r", active: false, retain: true }, { kid: "c", active: true, retain: false }];
rotate(keys, "n");
assert.equal(keys, [{ kid: "r", active: false, retain: true }, { kid: "c", active: true, retain: false }]);`,
      },
    ],
    fixedFiles: {
      "src/keys/rotation.js": `// Builds the next signing-key set when a new key is introduced.
exports.rotate = function (keys, newKid) {
  var next = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.active) {
      next.push({ kid: k.kid, active: false, retain: true });
    } else if (k.retain) {
      // A retained key still verifies tokens that are in flight; the flag is
      // set by more than this job, so rotation keeps it untouched.
      next.push({ kid: k.kid, active: k.active, retain: k.retain });
    }
  }
  next.push({ kid: newKid, active: true, retain: false });
  return next;
};
`,
    },
  },

  {
    title: "The Lookup That Confirmed Every Email",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Privacy", "Validation"],
    description: `Modelled on the **Twitter API vulnerability disclosed in 2022**. An API endpoint returned the account associated with a submitted email address or phone number — **even when the account holder had turned off discoverability** by email or phone. Twitter confirmed in August 2022 that the flaw had been used to compile data on about 5.4 million accounts before it was fixed.

This project is a reconstruction: \`lookup.js\` answers "which account uses this contact?" for the find-your-friends feature, and it ignores the account's \`discoverable\` setting. It also answers a miss with a differently shaped object than a hit, which on its own tells a caller something.

Fix \`findByContact\` so it respects discoverability and answers every miss identically.`,
    bugReport: `**BUG-TW-ENUM** · Priority: Critical (privacy) · Reported by: bug bounty

findByContact(accounts, contact) — accounts are { id, email, phone,
discoverable }; contact is an email or a phone number. Compare after
directory.normalize (trim, lower-case). It must return exactly:
- { found: true, id: <id> } when an account has that email or phone AND
  discoverable is true
- { found: false, id: null } in EVERY other case — no match, or a match on an
  account that is not discoverable. The two cases must be indistinguishable.

Observed: a private account's id comes back for its email, and an unknown
email returns { found: false } without an id field.`,
    logs: `[contacts] lookup email=… -> id=18830114 (discoverable=false)
[waf] 1.2M lookups from 3 IPs in 24h`,
    files: [
      {
        filePath: "src/contacts/lookup.js",
        isEditable: true,
        language: "javascript",
        content: `var normalize = require("./directory").normalize;

exports.findByContact = function (accounts, contact) {
  var wanted = normalize(contact);
  for (var i = 0; i < accounts.length; i++) {
    var a = accounts[i];
    if (normalize(a.email) === wanted || normalize(a.phone) === wanted) {
      return { found: true, id: a.id };
    }
  }
  return { found: false };
};
`,
      },
      {
        filePath: "src/contacts/directory.js",
        isEditable: false,
        language: "javascript",
        content: `// Contacts are compared trimmed and lower-cased; a missing field never matches.
exports.normalize = function (value) {
  if (value === null || value === undefined) return "\\u0000missing";
  return String(value).trim().toLowerCase();
};
`,
      },
    ],
    tests: [
      {
        name: "a discoverable account is found by email",
        isHidden: false,
        source: `var find = require("src/contacts/lookup").findByContact;
var accounts = [{ id: "u1", email: "ana@example.com", phone: "+15550001", discoverable: true }];
assert.equal(find(accounts, " Ana@Example.com "), { found: true, id: "u1" });`,
      },
      {
        name: "a private account is not revealed",
        isHidden: false,
        source: `var find = require("src/contacts/lookup").findByContact;
var accounts = [{ id: "u2", email: "bo@example.com", phone: "+15550002", discoverable: false }];
assert.equal(find(accounts, "bo@example.com"), { found: false, id: null }, "discoverability is off");`,
      },
      {
        name: "an unknown contact gets the same answer as a private one",
        isHidden: true,
        source: `var find = require("src/contacts/lookup").findByContact;
var accounts = [{ id: "u2", email: "bo@example.com", phone: "+15550002", discoverable: false }];
assert.equal(find(accounts, "nobody@example.com"), find(accounts, "bo@example.com"));
assert.equal(find(accounts, "nobody@example.com"), { found: false, id: null });`,
      },
      {
        name: "phone lookups respect discoverability too",
        isHidden: true,
        source: `var find = require("src/contacts/lookup").findByContact;
var accounts = [
  { id: "p1", email: "x@example.com", phone: "+15550009", discoverable: false },
  { id: "p2", email: "y@example.com", phone: "+15550010", discoverable: true }
];
assert.equal(find(accounts, "+15550009"), { found: false, id: null });
assert.equal(find(accounts, "+15550010"), { found: true, id: "p2" });`,
      },
    ],
    fixedFiles: {
      "src/contacts/lookup.js": `var normalize = require("./directory").normalize;

exports.findByContact = function (accounts, contact) {
  var wanted = normalize(contact);
  for (var i = 0; i < accounts.length; i++) {
    var a = accounts[i];
    // The owner's discoverability setting is the whole point of the check —
    // a match on a private account must look exactly like no match at all.
    if (a.discoverable === true && (normalize(a.email) === wanted || normalize(a.phone) === wanted)) {
      return { found: true, id: a.id };
    }
  }
  return { found: false, id: null };
};
`,
    },
  },

  {
    title: "Wildcards for Every Account",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Security", "Auth", "Validation"],
    description: `Modelled on the **USPS "Informed Visibility" API exposure reported in November 2018**. An API behind usps.com let **any logged-in user query account details of other users**, and many of its search parameters accepted **wildcards**, so one query could return records for many accounts. USPS fixed it after it was reported publicly.

This project is a reconstruction: \`accounts.js\` turns request parameters into a filter for the locked store, which — like many query layers — treats \`"*"\` as "match anything". The filter is never scoped to the caller, and wildcards pass straight through.

Fix \`searchAccounts\` so a caller can only ever read their own account and wildcards are refused.`,
    bugReport: `**BUG-USPS-IV** · Priority: Critical (data exposure) · Reported by: external researcher

searchAccounts(rows, caller, params) returns the account rows the caller may
see that match params:
- ONLY the keys email and username in params are used; any other key (id,
  ownerId, …) is ignored
- a used value that is not a non-empty string, or that contains "*" or "%",
  throws Error("wildcard or empty search value") and nothing is returned
- the result is ALWAYS scoped to the caller: only rows whose id equals
  caller.id can be returned
- rows come back in store order via store.find

Observed: searching { email: "*" } returns every account in the table.`,
    logs: `[iv-api] GET /accounts?email=* by user 88121 -> 60,114 rows
[iv-api] GET /accounts?username=jdoe by user 88121 -> 1 row (owner 40071)`,
    files: [
      {
        filePath: "src/accounts/accounts.js",
        isEditable: true,
        language: "javascript",
        content: `var store = require("./store");

exports.searchAccounts = function (rows, caller, params) {
  var filter = {};
  for (var key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      filter[key] = params[key];
    }
  }
  return store.find(rows, filter);
};
`,
      },
      {
        filePath: "src/accounts/store.js",
        isEditable: false,
        language: "javascript",
        content: `// find(rows, filter): rows where every filter field matches exactly;
// a filter value of "*" matches any value (used by internal reports).
exports.find = function (rows, filter) {
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var ok = true;
    for (var k in filter) {
      if (filter[k] !== "*" && rows[i][k] !== filter[k]) { ok = false; break; }
    }
    if (ok) out.push(rows[i]);
  }
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "a user can find their own account",
        isHidden: false,
        source: `var s = require("src/accounts/accounts").searchAccounts;
var rows = [{ id: 1, email: "a@x.io", username: "ana" }, { id: 2, email: "b@x.io", username: "bo" }];
assert.equal(s(rows, { id: 1 }, { email: "a@x.io" }), [{ id: 1, email: "a@x.io", username: "ana" }]);`,
      },
      {
        name: "another user's account is never returned",
        isHidden: false,
        source: `var s = require("src/accounts/accounts").searchAccounts;
var rows = [{ id: 1, email: "a@x.io", username: "ana" }, { id: 2, email: "b@x.io", username: "bo" }];
assert.equal(s(rows, { id: 1 }, { username: "bo" }), [], "results are scoped to the caller");`,
      },
      {
        name: "wildcard values are refused",
        isHidden: true,
        source: `var s = require("src/accounts/accounts").searchAccounts;
var rows = [{ id: 1, email: "a@x.io", username: "ana" }];
assert.throws(function () { s(rows, { id: 1 }, { email: "*" }); }, "a bare star");
assert.throws(function () { s(rows, { id: 1 }, { username: "an%" }); }, "a SQL-style wildcard");
assert.throws(function () { s(rows, { id: 1 }, { username: "a*" }); }, "an embedded star");`,
      },
      {
        name: "empty values are refused",
        isHidden: true,
        source: `var s = require("src/accounts/accounts").searchAccounts;
var rows = [{ id: 1, email: "a@x.io", username: "ana" }];
assert.throws(function () { s(rows, { id: 1 }, { email: "" }); });`,
      },
      {
        name: "other parameters cannot widen the scope",
        isHidden: true,
        source: `var s = require("src/accounts/accounts").searchAccounts;
var rows = [{ id: 1, email: "a@x.io", username: "ana" }, { id: 2, email: "b@x.io", username: "bo" }];
assert.equal(s(rows, { id: 1 }, { id: 2 }), [{ id: 1, email: "a@x.io", username: "ana" }], "id is not a search key");
assert.equal(s(rows, { id: 1 }, { id: "*", email: "b@x.io" }), []);`,
      },
    ],
    fixedFiles: {
      "src/accounts/accounts.js": `var store = require("./store");

var SEARCH_KEYS = ["email", "username"];

exports.searchAccounts = function (rows, caller, params) {
  // Scope first: the store treats "*" as match-anything, so the only safe
  // filter is one that already pins the caller's own row.
  var filter = { id: caller.id };
  for (var i = 0; i < SEARCH_KEYS.length; i++) {
    var key = SEARCH_KEYS[i];
    if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
    var value = params[key];
    if (typeof value !== "string" || value === "" || value.indexOf("*") !== -1 || value.indexOf("%") !== -1) {
      throw new Error("wildcard or empty search value");
    }
    filter[key] = value;
  }
  return store.find(rows, filter);
};
`,
    },
  },

  {
    title: "The Duplicate Check Skipped for Speed",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Validation", "Money"],
    description: `Modelled on **Bitcoin Core CVE-2018-17144** (fixed in 0.16.3, September 2018). A performance optimisation stopped block validation from running the **duplicate-input check** on each transaction, on the assumption that a later step would catch it. It did not: a block containing a transaction that spent the same output twice could crash nodes, and on some versions could have been accepted — creating coins from nothing.

This project is a reconstruction: \`block.py\` validates a block against a UTXO set and calls the locked \`tx_check.check_transaction\` with duplicate checking turned off. Its input loop totals each listed input without removing it first, so a repeated input is counted twice.

Fix \`validate_block\` so no transaction with a repeated input can be accepted.`,
    bugReport: `**BUG-CVE-2018-17144** · Priority: Critical (consensus) · Reported by: security@

validate_block(block, utxo) — block = {"txs": [{"id", "inputs": [outpoint…],
"outputs": [amount…]}]}; utxo maps outpoint -> amount. Returns
{"ok": bool, "reason": str}; reasons, checked per tx in this order:
- tx_check.check_transaction's reason (it reports "bad-txns-vin-empty",
  "bad-txns-vout-negative" and, when asked, "bad-txns-inputs-duplicate")
- "bad-txns-inputs-missingorspent" — an input not in the (staged) UTXO set
- "bad-txns-in-belowout" — outputs sum to more than the inputs
Transactions are applied in order, so a later tx may spend an earlier tx's
outputs ("<txid>:<index>"). On success utxo is updated in place (inputs
removed, outputs added) and reason is ""; on ANY failure utxo is left exactly
as it was.

Observed: a tx listing the same outpoint twice is accepted and its outputs
carry twice the input value.`,
    logs: `[validation] block 000…a7f accepted: tx f00d inputs=[c0ffee:0, c0ffee:0] in=100 out=200
[validation] total supply check: +100 unexpected`,
    files: [
      {
        filePath: "src/chain/block.py",
        isEditable: true,
        language: "python",
        content: `tx_check = bug_require("./tx_check.py")


def validate_block(block, utxo):
    staged = dict(utxo)
    for tx in block["txs"]:
        err = tx_check.check_transaction(tx, False)
        if err:
            return {"ok": False, "reason": err}
        total_in = 0
        for outpoint in tx["inputs"]:
            if outpoint not in staged:
                return {"ok": False, "reason": "bad-txns-inputs-missingorspent"}
            total_in += staged[outpoint]
        if sum(tx["outputs"]) > total_in:
            return {"ok": False, "reason": "bad-txns-in-belowout"}
        for outpoint in tx["inputs"]:
            staged.pop(outpoint, None)
        for i, amount in enumerate(tx["outputs"]):
            staged[tx["id"] + ":" + str(i)] = amount
    utxo.clear()
    utxo.update(staged)
    return {"ok": True, "reason": ""}
`,
      },
      {
        filePath: "src/chain/tx_check.py",
        isEditable: false,
        language: "python",
        content: `# Context-free transaction checks. Returns a reason string, or "" if valid.
# check_duplicate_inputs exists because mempool code re-checks transactions it
# has already validated once.


def check_transaction(tx, check_duplicate_inputs=True):
    if len(tx["inputs"]) == 0:
        return "bad-txns-vin-empty"
    for amount in tx["outputs"]:
        if amount < 0:
            return "bad-txns-vout-negative"
    if check_duplicate_inputs:
        seen = set()
        for outpoint in tx["inputs"]:
            if outpoint in seen:
                return "bad-txns-inputs-duplicate"
            seen.add(outpoint)
    return ""
`,
      },
    ],
    tests: [
      {
        name: "a plain valid block is accepted and applied",
        isHidden: false,
        source: `m = bug_require("src/chain/block.py")
utxo = {"a:0": 50}
r = m.validate_block({"txs": [{"id": "t1", "inputs": ["a:0"], "outputs": [30, 20]}]}, utxo)
assert_.equal(r, {"ok": True, "reason": ""})
assert_.equal(utxo, {"t1:0": 30, "t1:1": 20})`,
      },
      {
        name: "a transaction spending one output twice is rejected",
        isHidden: false,
        source: `m = bug_require("src/chain/block.py")
utxo = {"c0ffee:0": 100}
r = m.validate_block({"txs": [{"id": "f00d", "inputs": ["c0ffee:0", "c0ffee:0"], "outputs": [200]}]}, utxo)
assert_.equal(r, {"ok": False, "reason": "bad-txns-inputs-duplicate"})`,
      },
      {
        name: "a rejected block leaves the UTXO set untouched",
        isHidden: true,
        source: `m = bug_require("src/chain/block.py")
utxo = {"x:0": 10, "y:0": 5}
block = {"txs": [
    {"id": "t1", "inputs": ["x:0"], "outputs": [10]},
    {"id": "t2", "inputs": ["y:0", "y:0"], "outputs": [10]},
]}
r = m.validate_block(block, utxo)
assert_.equal(r["ok"], False)
assert_.equal(utxo, {"x:0": 10, "y:0": 5})`,
      },
      {
        name: "a later transaction may spend an earlier one's output",
        isHidden: true,
        source: `m = bug_require("src/chain/block.py")
utxo = {"g:0": 40}
block = {"txs": [
    {"id": "t1", "inputs": ["g:0"], "outputs": [40]},
    {"id": "t2", "inputs": ["t1:0"], "outputs": [25, 15]},
]}
assert_.equal(m.validate_block(block, utxo), {"ok": True, "reason": ""})
assert_.equal(utxo, {"t2:0": 25, "t2:1": 15})`,
      },
      {
        name: "a double spend across two transactions is still caught",
        isHidden: true,
        source: `m = bug_require("src/chain/block.py")
utxo = {"g:0": 40}
block = {"txs": [
    {"id": "t1", "inputs": ["g:0"], "outputs": [40]},
    {"id": "t2", "inputs": ["g:0"], "outputs": [40]},
]}
assert_.equal(m.validate_block(block, utxo), {"ok": False, "reason": "bad-txns-inputs-missingorspent"})
assert_.equal(utxo, {"g:0": 40})`,
      },
      {
        name: "a duplicate hidden among other inputs is caught",
        isHidden: true,
        source: `m = bug_require("src/chain/block.py")
utxo = {"a:0": 1, "b:0": 2, "c:0": 3}
r = m.validate_block({"txs": [{"id": "t", "inputs": ["a:0", "b:0", "c:0", "b:0"], "outputs": [8]}]}, utxo)
assert_.equal(r, {"ok": False, "reason": "bad-txns-inputs-duplicate"})
assert_.equal(utxo, {"a:0": 1, "b:0": 2, "c:0": 3})`,
      },
    ],
    fixedFiles: {
      "src/chain/block.py": `tx_check = bug_require("./tx_check.py")


def validate_block(block, utxo):
    staged = dict(utxo)
    for tx in block["txs"]:
        # Block validation must run the duplicate-input check itself: the
        # input loop below sums values before removing anything, so nothing
        # later in this function would notice an outpoint listed twice.
        err = tx_check.check_transaction(tx, True)
        if err:
            return {"ok": False, "reason": err}
        total_in = 0
        for outpoint in tx["inputs"]:
            if outpoint not in staged:
                return {"ok": False, "reason": "bad-txns-inputs-missingorspent"}
            total_in += staged[outpoint]
        if sum(tx["outputs"]) > total_in:
            return {"ok": False, "reason": "bad-txns-in-belowout"}
        for outpoint in tx["inputs"]:
            staged.pop(outpoint, None)
        for i, amount in enumerate(tx["outputs"]):
            staged[tx["id"] + ":" + str(i)] = amount
    utxo.clear()
    utxo.update(staged)
    return {"ok": True, "reason": ""}
`,
    },
  },

  {
    title: "Anyone Could Initialise the Wallet",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "State"],
    description: `Modelled on the **Parity multisig wallet hack of July 2017** — the first of Parity's two 2017 incidents. The wallet contracts forwarded unknown calls to a shared library, and the library's \`initWallet\` function, meant to run once at deployment, **could be called again by anyone**. Attackers re-initialised three wallets with themselves as the sole owner and withdrew roughly 150,000 ETH.

This project is a reconstruction in plain JavaScript: \`dispatch.js\` forwards any method name to the library (as the contract's fallback did), and \`wallet.js\` lets \`initWallet\` overwrite the owners of a wallet that is already set up.

Fix \`initWallet\` so a wallet can be initialised exactly once.`,
    bugReport: `**BUG-PARITY-0719** · Priority: Critical (funds at risk) · Reported by: white-hat group

Wallet state: { owners: [], required: 0, balance, initialised }.
- initWallet(wallet, sender, owners, required) sets owners/required and marks
  the wallet initialised — ONLY if it is not initialised yet. A second call,
  from anyone (including an existing owner), throws
  Error("already initialised") and changes nothing.
- deploy(owners, required, balance) creates a wallet and initialises it.
- execute(wallet, sender, amount) withdraws: sender must be an owner (else
  throws Error("not an owner")), amount <= balance (else throws); returns the
  new balance.

Observed: dispatch(wallet, attacker, "initWallet", [[attacker], 1]) makes the
attacker the only owner, and the next execute drains the wallet.`,
    logs: `[chain] tx 0xeef1… initWallet([0xb3764…], 1) from 0xb3764… -> ok
[chain] tx 0x0e0f… execute(0xb3764…, 26793 ETH) from 0xb3764… -> ok`,
    files: [
      {
        filePath: "src/wallet/wallet.js",
        isEditable: true,
        language: "javascript",
        content: `exports.initWallet = function (wallet, sender, owners, required) {
  wallet.owners = owners.slice();
  wallet.required = required;
  wallet.initialised = true;
};

exports.deploy = function (owners, required, balance) {
  var wallet = { owners: [], required: 0, balance: balance, initialised: false };
  exports.initWallet(wallet, owners[0], owners, required);
  return wallet;
};

exports.execute = function (wallet, sender, amount) {
  if (wallet.owners.indexOf(sender) === -1) throw new Error("not an owner");
  if (amount > wallet.balance) throw new Error("insufficient balance");
  wallet.balance -= amount;
  return wallet.balance;
};
`,
      },
      {
        filePath: "src/wallet/dispatch.js",
        isEditable: false,
        language: "javascript",
        content: `// The wallet contract's fallback: any call it does not define itself is
// forwarded to the shared library with the caller's arguments.
var lib = require("./wallet");

exports.dispatch = function (wallet, sender, method, args) {
  var fn = lib[method];
  if (typeof fn !== "function") throw new Error("no such method: " + method);
  return fn.apply(null, [wallet, sender].concat(args));
};
`,
      },
    ],
    tests: [
      {
        name: "an owner can withdraw from a deployed wallet",
        isHidden: false,
        source: `var w = require("src/wallet/wallet");
var d = require("src/wallet/dispatch").dispatch;
var wallet = w.deploy(["alice", "bob"], 1, 100);
assert.equal(d(wallet, "alice", "execute", [40]), 60);`,
      },
      {
        name: "re-initialising a deployed wallet is refused",
        isHidden: false,
        source: `var w = require("src/wallet/wallet");
var d = require("src/wallet/dispatch").dispatch;
var wallet = w.deploy(["alice"], 1, 100);
assert.throws(function () { d(wallet, "mallory", "initWallet", [["mallory"], 1]); }, "initWallet must run once");
assert.equal(wallet.owners, ["alice"]);`,
      },
      {
        name: "the attacker cannot drain the wallet after trying",
        isHidden: true,
        source: `var w = require("src/wallet/wallet");
var d = require("src/wallet/dispatch").dispatch;
var wallet = w.deploy(["alice"], 1, 100);
try { d(wallet, "mallory", "initWallet", [["mallory"], 1]); } catch (e) {}
assert.throws(function () { d(wallet, "mallory", "execute", [100]); });
assert.equal(wallet.balance, 100);`,
      },
      {
        name: "even an owner cannot re-initialise",
        isHidden: true,
        source: `var w = require("src/wallet/wallet");
var wallet = w.deploy(["alice", "bob"], 2, 10);
assert.throws(function () { w.initWallet(wallet, "alice", ["alice"], 1); });
assert.equal([wallet.owners, wallet.required], [["alice", "bob"], 2]);`,
      },
      {
        name: "a fresh wallet can be initialised once",
        isHidden: true,
        source: `var w = require("src/wallet/wallet");
var wallet = { owners: [], required: 0, balance: 5, initialised: false };
w.initWallet(wallet, "carol", ["carol"], 1);
assert.equal([wallet.owners, wallet.initialised], [["carol"], true]);`,
      },
    ],
    fixedFiles: {
      "src/wallet/wallet.js": `exports.initWallet = function (wallet, sender, owners, required) {
  // The fallback forwards any method to this library, so initWallet is
  // reachable by anyone for the wallet's whole life. It must refuse to run
  // on a wallet that already has owners.
  if (wallet.initialised) throw new Error("already initialised");
  wallet.owners = owners.slice();
  wallet.required = required;
  wallet.initialised = true;
};

exports.deploy = function (owners, required, balance) {
  var wallet = { owners: [], required: 0, balance: balance, initialised: false };
  exports.initWallet(wallet, owners[0], owners, required);
  return wallet;
};

exports.execute = function (wallet, sender, amount) {
  if (wallet.owners.indexOf(sender) === -1) throw new Error("not an owner");
  if (amount > wallet.balance) throw new Error("insufficient balance");
  wallet.balance -= amount;
  return wallet.balance;
};
`,
    },
  },

  {
    title: "The Hang at 49.7 Days",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Time", "Overflow"],
    description: `Modelled on the **Windows 95 / Windows 98 hang documented by Microsoft in 1999** (Knowledge Base article Q216641): after **49.7 days** of continuous uptime the system could stop responding. The cause was a 32-bit millisecond tick counter — 2^32 ms is about 49.7 days — that wraps back to zero, and timing code that did not survive the wrap. Few people noticed for years, because few Windows 9x machines stayed up that long.

This project is a reconstruction: \`TickTimer\` measures elapsed time and timeouts from readings of an unsigned 32-bit tick counter (held in a \`long\`, always in [0, 2^32)). Its arithmetic is correct only until the counter wraps; a deadline computed just before the wrap is never reached.

Fix \`elapsed\` and \`expired\` so they are correct across the wrap.`,
    bugReport: `**BUG-Q216641** · Priority: High (hang) · Reported by: long-uptime test rig

Tick values are unsigned 32-bit milliseconds in [0, 2^32) (see Tick.MOD).
- elapsed(start, now) = milliseconds from start to now, modulo 2^32 — always
  in [0, 2^32). elapsed(4294967295, 5) is 6.
- expired(start, timeoutMs, now) is true iff elapsed(start, now) >= timeoutMs
  (timeouts are always below 2^31).
- firstExpired(start, timeoutMs, readings) is the index of the first reading
  at which the timeout has expired, or -1.

Observed: a 1-second wait started at tick 4294967000 never finishes — every
reading after the wrap is "before the deadline".`,
    logs: `[vmm] tick=4294966904 wait(timeout=1000) start
[vmm] tick=0000000312 deadline=4294967904 not reached
[vmm] tick=0003600000 deadline=4294967904 not reached (watchdog: none)`,
    files: [
      {
        filePath: "src/timer/TickTimer.java",
        isEditable: true,
        language: "java",
        content: `class TickTimer {
    // Milliseconds between two readings of the tick counter.
    static long elapsed(long start, long now) {
        return now - start;
    }

    static boolean expired(long start, long timeoutMs, long now) {
        long deadline = start + timeoutMs;
        return now >= deadline;
    }

    // Index of the first reading at which the timeout has expired, or -1.
    static int firstExpired(long start, long timeoutMs, long[] readings) {
        for (int i = 0; i < readings.length; i++) {
            if (expired(start, timeoutMs, readings[i])) return i;
        }
        return -1;
    }
}`,
      },
      {
        filePath: "src/timer/Tick.java",
        isEditable: false,
        language: "java",
        content: `// The hardware counter: unsigned 32-bit milliseconds since boot, held in a
// long. It wraps to 0 after 2^32 ms (about 49.7 days).
class Tick {
    static final long MOD = 1L << 32;
    static final long MASK = MOD - 1;

    static long advance(long tick, long ms) {
        return (tick + ms) & MASK;
    }
}`,
      },
    ],
    tests: [
      {
        name: "elapsed time within one lap",
        isHidden: false,
        source: `                BugAssert.equal(TickTimer.elapsed(1000L, 4000L), 3000L, "3 seconds");
                BugAssert.ok(TickTimer.expired(1000L, 2500L, 4000L), "2.5 s timeout");`,
      },
      {
        name: "a timeout started just before the wrap expires after it",
        isHidden: false,
        source: `                long start = 4294967000L;
                long now = Tick.advance(start, 1000L);
                BugAssert.equal(now, 704L, "the counter wrapped");
                BugAssert.ok(TickTimer.expired(start, 1000L, now), "1000 ms have passed");`,
      },
      {
        name: "elapsed is modular across the wrap",
        isHidden: true,
        source: `                BugAssert.equal(TickTimer.elapsed(4294967295L, 5L), 6L);
                BugAssert.equal(TickTimer.elapsed(4000000000L, 294967296L), 589934592L);`,
      },
      {
        name: "not expired one millisecond early, across the wrap",
        isHidden: true,
        source: `                BugAssert.ok(!TickTimer.expired(4294967000L, 1000L, 703L), "999 ms is not 1000 ms");`,
      },
      {
        name: "polling finds the first expired reading after the wrap",
        isHidden: true,
        source: `                long[] readings = { 4294967000L, 4294967295L, 0L, 500L, 704L, 1000L };
                BugAssert.equal(TickTimer.firstExpired(4294966000L, 2000L, readings), 4);`,
      },
    ],
    fixedFiles: {
      "src/timer/TickTimer.java": `class TickTimer {
    // Milliseconds between two readings of the tick counter. Subtract first
    // and reduce modulo 2^32: the difference of two wrapped readings is right
    // as long as less than one full lap has passed, while start + timeout can
    // land beyond 2^32 where no reading will ever reach it.
    static long elapsed(long start, long now) {
        return (now - start) & Tick.MASK;
    }

    static boolean expired(long start, long timeoutMs, long now) {
        return elapsed(start, now) >= timeoutMs;
    }

    // Index of the first reading at which the timeout has expired, or -1.
    static int firstExpired(long start, long timeoutMs, long[] readings) {
        for (int i = 0; i < readings.length; i++) {
            if (expired(start, timeoutMs, readings[i])) return i;
        }
        return -1;
    }
}`,
    },
  },

  {
    title: "The Alarm Queue That Went Quiet",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Concurrency", "State"],
    description: `Modelled on the **Northeast blackout of August 14, 2003**. The US–Canada task force found that the alarm function of the XA/21 energy management system at FirstEnergy's control room **stalled without any indication** — a race condition in GE's software was later identified as the cause — so operators did not see alarms as transmission lines tripped. The cascade that followed left about 50 million people without power.

This project reconstructs the *class* of bug, not GE's code: \`alarms.js\` is an alarm processor and its writers sharing one queue. The processor looks at the queue, and if it found it empty goes to sleep until a writer wakes it; writers only wake it on the empty → non-empty transition. Each function below is one atomic step, and the locked \`scheduler.js\` replays an interleaving of steps deterministically.

Fix the processor so no interleaving can leave it asleep with alarms waiting.`,
    bugReport: `**BUG-EMS-0814** · Priority: Critical (silent alarm loss) · Reported by: operations

Steps (each atomic): check(sys) — processor takes one alarm off the queue
(onto sys.shown) or notes it was empty; sleep(sys) — processor sleeps if its
last look found nothing; raise(sys, alarm) — a writer queues an alarm.
Required, for EVERY interleaving of these steps:
- invariant: the processor is never asleep (sys.sleeping) while the queue
  holds an alarm
- afterwards, scheduler.drain(sys) shows every raised alarm, in the order
  raised — including alarms raised later on
- an alarm raised while the processor sleeps wakes it (this works today)

Observed: with the order check, raise, sleep the processor sleeps on a
non-empty queue, and because later writers see a non-empty queue they never
wake it. The display stays frozen.`,
    logs: `14:14 [xa21] alarm list: last update 14:14:02
15:05 [xa21] line trip Harding-Chamberlin 345kV queued (depth 12)
15:32 [xa21] line trip Hanna-Juniper 345kV queued (depth 31) — processor state: asleep`,
    files: [
      {
        filePath: "src/ems/alarms.js",
        isEditable: true,
        language: "javascript",
        content: `exports.create = function () {
  return { queue: [], shown: [], sleeping: false, sawEmpty: false };
};

// Processor: take one alarm off the queue, or note that it was empty.
exports.check = function (sys) {
  if (sys.sleeping) return "asleep";
  if (sys.queue.length > 0) {
    sys.shown.push(sys.queue.shift());
    sys.sawEmpty = false;
    return "shown";
  }
  sys.sawEmpty = true;
  return "empty";
};

// Processor: sleep until a writer wakes us, if the last check found nothing.
exports.sleep = function (sys) {
  if (sys.sawEmpty) sys.sleeping = true;
  return sys.sleeping ? "asleep" : "awake";
};

// Writer: queue an alarm. Only the empty -> non-empty edge needs a wake-up.
exports.raise = function (sys, alarm) {
  sys.queue.push(alarm);
  if (sys.queue.length === 1 && sys.sleeping) sys.sleeping = false;
};
`,
      },
      {
        filePath: "src/ems/scheduler.js",
        isEditable: false,
        language: "javascript",
        content: `// Replays an interleaving deterministically. Steps: "check", "sleep",
// "raise:<alarm>". Returns the system for chaining.
var alarms = require("./alarms");

exports.run = function (sys, steps) {
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    if (s === "check") alarms.check(sys);
    else if (s === "sleep") alarms.sleep(sys);
    else if (s.indexOf("raise:") === 0) alarms.raise(sys, s.slice(6));
    else throw new Error("unknown step " + s);
  }
  return sys;
};

// The processor running on its own: check until the queue is empty, then
// sleep. Stops early if it is already asleep. Returns everything shown.
exports.drain = function (sys) {
  for (var i = 0; i < 100; i++) {
    var r = alarms.check(sys);
    if (r === "empty") { alarms.sleep(sys); break; }
    if (r === "asleep") break;
  }
  return sys.shown;
};
`,
      },
    ],
    tests: [
      {
        name: "alarms raised between cycles are shown",
        isHidden: false,
        source: `var a = require("src/ems/alarms");
var sch = require("src/ems/scheduler");
var sys = sch.run(a.create(), ["raise:A", "check", "check", "sleep", "raise:B"]);
assert.equal(sch.drain(sys), ["A", "B"]);`,
      },
      {
        name: "an alarm raised between check and sleep is not lost",
        isHidden: false,
        source: `var a = require("src/ems/alarms");
var sch = require("src/ems/scheduler");
var sys = sch.run(a.create(), ["check", "raise:L1", "sleep"]);
assert.ok(!(sys.sleeping && sys.queue.length > 0), "asleep with an alarm waiting");
assert.equal(sch.drain(sys), ["L1"]);`,
      },
      {
        name: "later alarms are shown after the race",
        isHidden: true,
        source: `var a = require("src/ems/alarms");
var sch = require("src/ems/scheduler");
var sys = sch.run(a.create(), ["check", "raise:L1", "sleep", "raise:L2", "raise:L3"]);
assert.equal(sch.drain(sys), ["L1", "L2", "L3"]);`,
      },
      {
        name: "every interleaving of one writer with two processor cycles",
        isHidden: true,
        source: `var a = require("src/ems/alarms");
var sch = require("src/ems/scheduler");
var proc = ["check", "sleep", "check", "sleep"];
for (var pos = 0; pos <= proc.length; pos++) {
  var steps = proc.slice(0, pos).concat(["raise:X"], proc.slice(pos));
  var sys = a.create();
  for (var i = 0; i < steps.length; i++) {
    sch.run(sys, [steps[i]]);
    assert.ok(!(sys.sleeping && sys.queue.length > 0), steps.join(",") + " step " + i);
  }
  assert.equal(sch.drain(sys), ["X"], steps.join(","));
}`,
      },
      {
        name: "an alarm raised while asleep wakes the processor",
        isHidden: true,
        source: `var a = require("src/ems/alarms");
var sch = require("src/ems/scheduler");
var sys = sch.run(a.create(), ["check", "sleep", "raise:W"]);
assert.equal(sys.sleeping, false);
assert.equal(sch.drain(sys), ["W"]);`,
      },
    ],
    fixedFiles: {
      "src/ems/alarms.js": `exports.create = function () {
  return { queue: [], shown: [], sleeping: false, sawEmpty: false };
};

// Processor: take one alarm off the queue, or note that it was empty.
exports.check = function (sys) {
  if (sys.sleeping) return "asleep";
  if (sys.queue.length > 0) {
    sys.shown.push(sys.queue.shift());
    sys.sawEmpty = false;
    return "shown";
  }
  sys.sawEmpty = true;
  return "empty";
};

// Processor: sleep until a writer wakes us, if the queue is still empty.
exports.sleep = function (sys) {
  // sawEmpty is a stale observation: a writer may have queued an alarm since
  // the check, and it saw us awake so it did not wake us. Decide on the
  // queue as it is now, in the same step that goes to sleep.
  if (sys.sawEmpty && sys.queue.length === 0) sys.sleeping = true;
  sys.sawEmpty = false;
  return sys.sleeping ? "asleep" : "awake";
};

// Writer: queue an alarm. Only the empty -> non-empty edge needs a wake-up.
exports.raise = function (sys, alarm) {
  sys.queue.push(alarm);
  if (sys.queue.length === 1 && sys.sleeping) sys.sleeping = false;
};
`,
    },
  },

  {
    title: "Good Time on the Enhancement",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Validation", "Time"],
    description: `Modelled on the **Washington State Department of Corrections sentencing error disclosed in December 2015**. From 2002, the department's software applied **good-time credit to sentence enhancements** — extra time, for example for using a weapon, that the law requires to be served in full. An estimated 3,200 prisoners were released early before it was corrected.

This project is a reconstruction: \`credit.py\` computes how many days a sentence requires after earned-release credit, using the percentages in the locked \`rules.py\`. It applies the credit to the whole sentence, enhancements included.

Fix \`days_to_serve\` so credit is earned only on the base term.`,
    bugReport: `**BUG-DOC-2015** · Priority: Critical (public safety) · Reported by: victim's family / records office

days_to_serve(base_days, enhancements, category):
- enhancements is a list of day counts; every one is served in FULL, with no
  credit of any kind
- credit = base_days * rules.CREDIT_PERCENT[category] // 100 (integer floor),
  and applies to the base term only
- result = (base_days - credit) + sum(enhancements)
release_day(start_day, base_days, enhancements, category) = start_day +
days_to_serve(...).

Observed: 300 days base + a 365-day firearm enhancement at 33 % credit
computes 446 days to serve instead of 566.`,
    logs: `[offender-mgmt] DOC#8841 base=300 enh=[365] cat=standard -> 446 days
[offender-mgmt] DOC#8841 release scheduled 120 days early (unflagged)`,
    files: [
      {
        filePath: "src/sentencing/credit.py",
        isEditable: true,
        language: "python",
        content: `rules = bug_require("./rules.py")


def days_to_serve(base_days, enhancements, category):
    total = base_days + sum(enhancements)
    credit = total * rules.CREDIT_PERCENT[category] // 100
    return total - credit


def release_day(start_day, base_days, enhancements, category):
    return start_day + days_to_serve(base_days, enhancements, category)
`,
      },
      {
        filePath: "src/sentencing/rules.py",
        isEditable: false,
        language: "python",
        content: `# Earned-release credit, as a percentage of the term it applies to.
# Enhancements (weapon, school zone, …) are served flat: they earn nothing.
CREDIT_PERCENT = {
    "standard": 33,
    "serious_violent": 10,
    "none": 0,
}
`,
      },
    ],
    tests: [
      {
        name: "a sentence without enhancements earns credit",
        isHidden: false,
        source: `m = bug_require("src/sentencing/credit.py")
assert_.equal(m.days_to_serve(300, [], "standard"), 201)`,
      },
      {
        name: "an enhancement is served in full",
        isHidden: false,
        source: `m = bug_require("src/sentencing/credit.py")
assert_.equal(m.days_to_serve(300, [365], "standard"), 566, "no credit on the 365 enhancement days")`,
      },
      {
        name: "several enhancements under a lower credit rate",
        isHidden: true,
        source: `m = bug_require("src/sentencing/credit.py")
assert_.equal(m.days_to_serve(1000, [730, 365], "serious_violent"), 1995)`,
      },
      {
        name: "credit is floored on the base term",
        isHidden: true,
        source: `m = bug_require("src/sentencing/credit.py")
assert_.equal(m.days_to_serve(100, [], "standard"), 67)
assert_.equal(m.days_to_serve(100, [50], "standard"), 117)`,
      },
      {
        name: "the release day uses the corrected term",
        isHidden: true,
        source: `m = bug_require("src/sentencing/credit.py")
assert_.equal(m.release_day(10, 300, [365], "standard"), 576)
assert_.equal(m.release_day(0, 90, [30], "none"), 120)`,
      },
    ],
    fixedFiles: {
      "src/sentencing/credit.py": `rules = bug_require("./rules.py")


def days_to_serve(base_days, enhancements, category):
    # Enhancements must be served in full; credit is earned on the base term
    # alone and the enhancement days are added back untouched.
    credit = base_days * rules.CREDIT_PERCENT[category] // 100
    return (base_days - credit) + sum(enhancements)


def release_day(start_day, base_days, enhancements, category):
    return start_day + days_to_serve(base_days, enhancements, category)
`,
    },
  },

  {
    title: "Two Billion Transactions Later",
    difficulty: "hard",
    category: "database",
    language: "java",
    tags: ["Overflow", "Time", "Limits"],
    description: `Modelled on **Sentry's July 2015 outage**, described in its post-mortem "Transaction ID Wraparound in Postgres". PostgreSQL transaction IDs are 32-bit and compared **circularly**; when the oldest unfrozen transaction gets too far behind the current one, Postgres stops accepting writes to protect the data from wraparound. Sentry's primary database reached that point and writes stopped until the long vacuum work completed.

This project is a reconstruction of the monitoring side: \`XidMonitor\` compares transaction ids and reports how close the database is to that limit, using the thresholds in the locked \`XidLimits\`. It compares ids as plain numbers and never raises a warning before the stop threshold.

Fix \`precedes\`, \`age\` and \`status\` so they are circular and the monitor warns in time.`,
    bugReport: `**BUG-SENTRY-XID** · Priority: Critical (write outage) · Reported by: on-call

Transaction ids are unsigned 32-bit values in [0, 2^32) that wrap.
- precedes(a, b): a is older than b in circular order — true iff
  (a - b) mod 2^32, read as a signed 32-bit integer, is negative.
  precedes(4294967000, 100) is true; precedes(100, 4294967000) is false.
- age(current, oldest) = (current - oldest) mod 2^32, in [0, 2^32).
- status(current, oldest): "STOP" if age >= XidLimits.STOP_AGE, else "WARN"
  if age >= XidLimits.WARN_AGE, else "OK".

Observed: no warning ever fired, and after the counter wrapped status()
reported "OK" for a database minutes away from refusing writes.`,
    logs: `[pg-monitor] xid=852032704 oldest=3000000000 age=-2147967296 status=OK
postgres: ERROR: database is not accepting commands to avoid wraparound data loss in database "sentry"`,
    files: [
      {
        filePath: "src/pg/XidMonitor.java",
        isEditable: true,
        language: "java",
        content: `class XidMonitor {
    // True when transaction id a is older than b.
    static boolean precedes(long a, long b) {
        return a < b;
    }

    // How many transactions current is ahead of the oldest unfrozen one.
    static long age(long current, long oldest) {
        return current - oldest;
    }

    static String status(long current, long oldest) {
        long age = age(current, oldest);
        if (age >= XidLimits.STOP_AGE) return "STOP";
        return "OK";
    }
}`,
      },
      {
        filePath: "src/pg/XidLimits.java",
        isEditable: false,
        language: "java",
        content: `// Transaction ids are 32-bit and circular: half the id space is "the past",
// half "the future". Our monitor's thresholds, as ages of the oldest
// unfrozen transaction: page someone at WARN_AGE, writes stop near STOP_AGE.
class XidLimits {
    static final long MOD = 1L << 32;
    static final long HALF = 1L << 31;
    static final long WARN_AGE = 1500000000L;
    static final long STOP_AGE = HALF - 1000000L;
}`,
      },
    ],
    tests: [
      {
        name: "ordering of nearby ids",
        isHidden: false,
        source: `                BugAssert.ok(XidMonitor.precedes(100L, 200L), "100 is older");
                BugAssert.ok(!XidMonitor.precedes(200L, 100L), "200 is newer");
                BugAssert.equal(XidMonitor.status(5000L, 1000L), "OK");`,
      },
      {
        name: "the monitor warns before the stop threshold",
        isHidden: false,
        source: `                BugAssert.equal(XidMonitor.status(1600000010L, 10L), "WARN", "age 1.6 billion");
                BugAssert.equal(XidMonitor.status(2146483658L, 10L), "STOP", "at the stop threshold");`,
      },
      {
        name: "ids compare circularly across the wrap",
        isHidden: true,
        source: `                BugAssert.ok(XidMonitor.precedes(4294967000L, 100L), "just before the wrap is older");
                BugAssert.ok(!XidMonitor.precedes(100L, 4294967000L), "just after the wrap is newer");`,
      },
      {
        name: "age is modular",
        isHidden: true,
        source: `                BugAssert.equal(XidMonitor.age(50L, 4294967246L), 100L);
                BugAssert.equal(XidMonitor.age(7L, 7L), 0L);`,
      },
      {
        name: "status after the counter wrapped",
        isHidden: true,
        source: `                BugAssert.equal(XidMonitor.status(852032704L, 3000000000L), "STOP", "age 2,147,000,000");
                BugAssert.equal(XidMonitor.status(500000000L, 3000000000L), "WARN", "age 1,794,967,296");
                BugAssert.equal(XidMonitor.status(10L, 4294967000L), "OK", "age 306");`,
      },
    ],
    fixedFiles: {
      "src/pg/XidMonitor.java": `class XidMonitor {
    // True when transaction id a is older than b. Ids are circular, so compare
    // the 32-bit difference as a signed number (as Postgres does) — a plain
    // a < b calls every id issued after the wrap "older".
    static boolean precedes(long a, long b) {
        return (int) (a - b) < 0;
    }

    // How many transactions current is ahead of the oldest unfrozen one,
    // modulo 2^32 so a wrapped counter still yields the true distance.
    static long age(long current, long oldest) {
        return (current - oldest) & (XidLimits.MOD - 1);
    }

    static String status(long current, long oldest) {
        long age = age(current, oldest);
        if (age >= XidLimits.STOP_AGE) return "STOP";
        // A monitor that speaks only at the stop line is an outage report.
        if (age >= XidLimits.WARN_AGE) return "WARN";
        return "OK";
    }
}`,
    },
  },

  {
    title: "Public by Default",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Privacy", "State", "Rendering"],
    description: `Modelled on **Facebook's June 2018 disclosure**: between May 18 and May 27, 2018, a bug affecting about **14 million users** set the suggested audience for their new posts to **Public**, whatever they had chosen before. Facebook said it happened while it was building a new way to share featured items on profiles, and it asked affected users to review their posts.

This project is a reconstruction: \`audience.js\` picks the audience preselected in the post composer, and the locked \`picker.js\` renders it. A code path added for featured items suggests "public" outright, and the fallback for users with no history is "public" too.

Fix \`suggestAudience\` so the suggestion is always the user's own last choice, or the most private option.`,
    bugReport: `**BUG-FB-AUDIENCE** · Priority: High (privacy) · Reported by: user reports

suggestAudience(profile, context) returns the audience preselected in the
composer. The result is the SAME whatever the context ("feed", "featured",
"profile", …):
- profile.lastAudience if it is one of options.AUDIENCES
- otherwise (missing or unrecognised) the most private option, AUDIENCES[0]
  ("only_me")
"public" is suggested only to someone whose last choice was "public".

Observed: in the featured-items flow a user whose last post was
friends-only gets "public" preselected.`,
    logs: `[composer] ctx=featured user=… last=friends suggested=public
[composer] ctx=feed user=… last=(none) suggested=public`,
    files: [
      {
        filePath: "src/composer/audience.js",
        isEditable: true,
        language: "javascript",
        content: `var AUDIENCES = require("./options").AUDIENCES;

// The audience preselected when the composer opens.
exports.suggestAudience = function (profile, context) {
  if (context === "featured") return "public";
  if (profile.lastAudience) return profile.lastAudience;
  return "public";
};
`,
      },
      {
        filePath: "src/composer/options.js",
        isEditable: false,
        language: "javascript",
        content: `// Audiences, from most private to least.
exports.AUDIENCES = ["only_me", "friends", "public"];
`,
      },
      {
        filePath: "src/composer/picker.js",
        isEditable: false,
        language: "javascript",
        content: `var suggest = require("./audience").suggestAudience;
var AUDIENCES = require("./options").AUDIENCES;

// Renders the picker, the preselected option in brackets.
exports.render = function (profile, context) {
  var chosen = suggest(profile, context);
  return AUDIENCES.map(function (a) { return a === chosen ? "[" + a + "]" : a; }).join(" | ");
};
`,
      },
    ],
    tests: [
      {
        name: "the feed composer keeps the last audience",
        isHidden: false,
        source: `var s = require("src/composer/audience").suggestAudience;
assert.equal(s({ lastAudience: "friends" }, "feed"), "friends");`,
      },
      {
        name: "featured items keep the last audience too",
        isHidden: false,
        source: `var s = require("src/composer/audience").suggestAudience;
assert.equal(s({ lastAudience: "friends" }, "featured"), "friends", "context must not change the audience");`,
      },
      {
        name: "no history suggests the most private option",
        isHidden: true,
        source: `var s = require("src/composer/audience").suggestAudience;
assert.equal(s({}, "feed"), "only_me");
assert.equal(s({}, "featured"), "only_me");`,
      },
      {
        name: "an unrecognised stored value falls back to private",
        isHidden: true,
        source: `var s = require("src/composer/audience").suggestAudience;
assert.equal(s({ lastAudience: "everyone" }, "feed"), "only_me");`,
      },
      {
        name: "the rendered picker preselects the private choice",
        isHidden: true,
        source: `var picker = require("src/composer/picker");
assert.equal(picker.render({ lastAudience: "only_me" }, "featured"), "[only_me] | friends | public");
assert.equal(picker.render({ lastAudience: "public" }, "featured"), "only_me | friends | [public]");`,
      },
    ],
    fixedFiles: {
      "src/composer/audience.js": `var AUDIENCES = require("./options").AUDIENCES;

// The audience preselected when the composer opens.
exports.suggestAudience = function (profile, context) {
  // No flow gets its own default: a post's audience is the user's choice, and
  // when we do not know it we err towards the most private option.
  if (AUDIENCES.indexOf(profile.lastAudience) !== -1) return profile.lastAudience;
  return AUDIENCES[0];
};
`,
    },
  },

  {
    title: "The Installer That Deleted boot.ini",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Validation", "Config"],
    description: `Modelled on **EVE Online's Trinity patch of December 2007**. CCP's installer for the Premium graphics update was meant to remove a file named \`boot.ini\` that belonged to EVE, but it **deleted \`boot.ini\` from the root of the system drive** instead — the file Windows XP needed to start. Affected machines would not boot until the file was restored, and CCP published repair instructions.

This project is a reconstruction: \`installer.py\` removes files listed in a patch manifest, and names in the manifest are relative to the game's install directory. It resolves them with the locked \`pathutil.join\`, which — like \`os.path.join\` — lets a rooted name replace the base directory, and it never checks that the result is still inside the install directory.

Fix \`remove_legacy_files\` so it can only ever delete inside the install directory.`,
    bugReport: `**BUG-TRINITY-BOOT** · Priority: Critical (machines unbootable) · Reported by: player support

remove_legacy_files(fs, install_dir, names) returns
{"deleted": [...], "refused": [...]}:
- install_dir None or "" raises ValueError before anything is touched
- root = pathutil.normalize(install_dir)
- every name is relative to root, even when the manifest writes it with a
  leading "/" or "\\"; a name carrying a drive letter ("D:…") is refused
- target = pathutil.normalize(root + "/" + name-without-leading-separators);
  a target that is not inside root (does not start with root + "/") is
  refused — the ORIGINAL name goes in "refused" and nothing is deleted
- a target inside root that exists is deleted and listed in "deleted";
  one that does not exist is skipped silently

Observed: the manifest entry "/boot.ini" deleted C:/boot.ini.`,
    logs: `[patcher] install_dir=C:/Program Files/CCP/EVE
[patcher] removing legacy file C:/boot.ini … ok
[support] ticket #…: "NTLDR: invalid boot.ini" after patching`,
    files: [
      {
        filePath: "src/patcher/installer.py",
        isEditable: true,
        language: "python",
        content: `pathutil = bug_require("./pathutil.py")


def remove_legacy_files(fs, install_dir, names):
    deleted = []
    refused = []
    for name in names:
        target = pathutil.join(install_dir, name)
        if fs.exists(target):
            fs.delete(target)
            deleted.append(target)
    return {"deleted": deleted, "refused": refused}
`,
      },
      {
        filePath: "src/patcher/pathutil.py",
        isEditable: false,
        language: "python",
        content: `# Path helpers. Separators are normalised to "/"; a path may start with a
# drive such as "C:".


def split_drive(path):
    if len(path) >= 2 and path[1] == ":":
        return path[:2], path[2:]
    return "", path


def normalize(path):
    drive, rest = split_drive(path.replace("\\\\", "/"))
    parts = []
    for seg in rest.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if parts:
                parts.pop()
        else:
            parts.append(seg)
    return drive + "/" + "/".join(parts)


def join(base, name):
    # Like os.path.join on Windows: a name with a drive replaces the base, and
    # a rooted name ("/x") keeps only the base's drive.
    name = name.replace("\\\\", "/")
    drive, _ = split_drive(name)
    if drive:
        return normalize(name)
    if name.startswith("/"):
        return normalize(split_drive(base)[0] + name)
    return normalize(base + "/" + name)
`,
      },
      {
        filePath: "src/patcher/fakefs.py",
        isEditable: false,
        language: "python",
        content: `class FakeFS:
    def __init__(self, paths):
        self.files = set(paths)

    def exists(self, path):
        return path in self.files

    def delete(self, path):
        self.files.remove(path)

    def listing(self):
        return sorted(self.files)
`,
      },
    ],
    tests: [
      {
        name: "a legacy file inside the install directory is removed",
        isHidden: false,
        source: `inst = bug_require("src/patcher/installer.py")
fs = bug_require("src/patcher/fakefs.py").FakeFS(["C:/Games/EVE/cache/old.dat", "C:/boot.ini"])
r = inst.remove_legacy_files(fs, "C:/Games/EVE", ["cache/old.dat", "cache/missing.dat"])
assert_.equal(r, {"deleted": ["C:/Games/EVE/cache/old.dat"], "refused": []})
assert_.equal(fs.listing(), ["C:/boot.ini"])`,
      },
      {
        name: "a rooted manifest name stays inside the install directory",
        isHidden: false,
        source: `inst = bug_require("src/patcher/installer.py")
fs = bug_require("src/patcher/fakefs.py").FakeFS(["C:/Games/EVE/boot.ini", "C:/boot.ini"])
r = inst.remove_legacy_files(fs, "C:/Games/EVE", ["/boot.ini"])
assert_.equal(r["deleted"], ["C:/Games/EVE/boot.ini"])
assert_.ok(fs.exists("C:/boot.ini"), "the system boot.ini must survive")`,
      },
      {
        name: "climbing out of the install directory is refused",
        isHidden: true,
        source: `inst = bug_require("src/patcher/installer.py")
fs = bug_require("src/patcher/fakefs.py").FakeFS(["C:/boot.ini"])
r = inst.remove_legacy_files(fs, "C:/Games/EVE/", ["..\\\\..\\\\boot.ini"])
assert_.equal(r, {"deleted": [], "refused": ["..\\\\..\\\\boot.ini"]})
assert_.equal(fs.listing(), ["C:/boot.ini"])`,
      },
      {
        name: "a name with a drive letter is refused",
        isHidden: true,
        source: `inst = bug_require("src/patcher/installer.py")
fs = bug_require("src/patcher/fakefs.py").FakeFS(["C:/boot.ini", "C:/Games/EVE/a.txt"])
r = inst.remove_legacy_files(fs, "C:/Games/EVE", ["C:\\\\boot.ini", "\\\\a.txt"])
assert_.equal(r, {"deleted": ["C:/Games/EVE/a.txt"], "refused": ["C:\\\\boot.ini"]})
assert_.ok(fs.exists("C:/boot.ini"))`,
      },
      {
        name: "a missing install directory touches nothing",
        isHidden: true,
        source: `inst = bug_require("src/patcher/installer.py")
fs = bug_require("src/patcher/fakefs.py").FakeFS(["/boot.ini", "C:/boot.ini"])
assert_.throws(lambda: inst.remove_legacy_files(fs, "", ["boot.ini"]))
assert_.throws(lambda: inst.remove_legacy_files(fs, None, ["boot.ini"]))
assert_.equal(fs.listing(), ["/boot.ini", "C:/boot.ini"])`,
      },
    ],
    fixedFiles: {
      "src/patcher/installer.py": `pathutil = bug_require("./pathutil.py")


def remove_legacy_files(fs, install_dir, names):
    # Without an install directory every name would resolve against the
    # drive root — refuse before touching anything.
    if not install_dir:
        raise ValueError("install_dir is required")
    root = pathutil.normalize(install_dir)
    deleted = []
    refused = []
    for name in names:
        rel = name.replace("\\\\", "/")
        # Manifest names are relative to the game even when written rooted; a
        # generic join would let "/boot.ini" mean the system drive's root.
        if pathutil.split_drive(rel)[0]:
            refused.append(name)
            continue
        target = pathutil.normalize(root + "/" + rel.lstrip("/"))
        if not target.startswith(root + "/"):
            refused.append(name)
            continue
        if fs.exists(target):
            fs.delete(target)
            deleted.append(target)
    return {"deleted": deleted, "refused": refused}
`,
    },
  },

  {
    title: "The Payment Page Script Nobody Pinned",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Security", "Validation"],
    description: `Modelled on the **British Airways data breach of 2018**, attributed to the Magecart group. Attackers **modified a JavaScript file that BA's website loaded**, so that card details typed into the payment page were also sent to a server the attackers controlled. The UK Information Commissioner's Office later fined BA £20 million over the breach.

This project is a reconstruction of one defence that stops a tampered script from running: Subresource Integrity. \`loader.js\` fetches a script for the payment page along with the integrity value it was pinned to, and the locked \`sri.js\` computes a script body's integrity value (a small stand-in for SHA-256, so the project has no dependencies). The loader notices a mismatch — and loads the script anyway.

Fix \`loadScript\` so only a script whose integrity matches its pin is ever added to the page.`,
    bugReport: `**BUG-BA-SRI** · Priority: Critical (card data) · Reported by: security review

loadScript(page, src, integrity, fetch) — page is { scripts: [], warnings: [] };
fetch(src) returns the script body. Returns { loaded, reason }:
- integrity missing or empty -> { loaded: false, reason: "missing-integrity" }
- sri.integrityOf(body) !== integrity -> { loaded: false,
  reason: "integrity-mismatch" }
- otherwise push { src, body } onto page.scripts and return
  { loaded: true, reason: "" }
A refused script is NEVER added to page.scripts.

Observed: a modified vendor script produced a warning and was executed on
the payment page.`,
    logs: `[checkout] integrity mismatch for /cms/js/modernizr-2.6.2.min.js (expected sri-4be1…, got sri-9c07…)
[checkout] scripts loaded: 14 (0 refused)`,
    files: [
      {
        filePath: "src/checkout/loader.js",
        isEditable: true,
        language: "javascript",
        content: `var sri = require("./sri");

exports.loadScript = function (page, src, integrity, fetch) {
  var body = fetch(src);
  if (integrity && sri.integrityOf(body) !== integrity) {
    page.warnings.push("integrity mismatch for " + src);
  }
  page.scripts.push({ src: src, body: body });
  return { loaded: true, reason: "" };
};
`,
      },
      {
        filePath: "src/checkout/sri.js",
        isEditable: false,
        language: "javascript",
        content: `// integrityOf(body): the integrity value a script is pinned to. A 32-bit
// FNV-1a digest standing in for SHA-256 — the check is what matters here.
exports.integrityOf = function (body) {
  var h = 0x811c9dc5;
  for (var i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "sri-" + ("0000000" + h.toString(16)).slice(-8);
};
`,
      },
    ],
    tests: [
      {
        name: "a script matching its pin loads",
        isHidden: false,
        source: `var load = require("src/checkout/loader").loadScript;
var sri = require("src/checkout/sri");
var body = "window.Modernizr = {};";
var page = { scripts: [], warnings: [] };
var r = load(page, "/js/modernizr.js", sri.integrityOf(body), function () { return body; });
assert.equal(r, { loaded: true, reason: "" });
assert.equal(page.scripts, [{ src: "/js/modernizr.js", body: body }]);`,
      },
      {
        name: "a tampered script is refused",
        isHidden: false,
        source: `var load = require("src/checkout/loader").loadScript;
var sri = require("src/checkout/sri");
var pinned = sri.integrityOf("window.Modernizr = {};");
var page = { scripts: [], warnings: [] };
var r = load(page, "/js/modernizr.js", pinned, function () { return "window.Modernizr = {}; sendCardTo(attacker);"; });
assert.equal(r, { loaded: false, reason: "integrity-mismatch" });
assert.equal(page.scripts, [], "the modified script must not run");`,
      },
      {
        name: "a script without a pin is refused",
        isHidden: true,
        source: `var load = require("src/checkout/loader").loadScript;
var page = { scripts: [], warnings: [] };
assert.equal(load(page, "/js/a.js", "", function () { return "x"; }), { loaded: false, reason: "missing-integrity" });
assert.equal(load(page, "/js/b.js", undefined, function () { return "y"; }), { loaded: false, reason: "missing-integrity" });
assert.equal(page.scripts, []);`,
      },
      {
        name: "a refusal does not stop the next good script",
        isHidden: true,
        source: `var load = require("src/checkout/loader").loadScript;
var sri = require("src/checkout/sri");
var page = { scripts: [], warnings: [] };
load(page, "/js/bad.js", sri.integrityOf("good"), function () { return "evil"; });
var r = load(page, "/js/good.js", sri.integrityOf("good"), function () { return "good"; });
assert.equal(r, { loaded: true, reason: "" });
assert.equal(page.scripts.map(function (s) { return s.src; }), ["/js/good.js"]);`,
      },
    ],
    fixedFiles: {
      "src/checkout/loader.js": `var sri = require("./sri");

exports.loadScript = function (page, src, integrity, fetch) {
  // A script on the payment page runs with access to every field the
  // customer types. No pin, or a body that does not match it, means the
  // script does not run — a warning nobody reads protects nothing.
  if (!integrity) return { loaded: false, reason: "missing-integrity" };
  var body = fetch(src);
  if (sri.integrityOf(body) !== integrity) {
    page.warnings.push("integrity mismatch for " + src);
    return { loaded: false, reason: "integrity-mismatch" };
  }
  page.scripts.push({ src: src, body: body });
  return { loaded: true, reason: "" };
};
`,
    },
  },

  {
    title: "Distance to the Decimal",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Privacy"],
    description: `Modelled on the **Tinder location-privacy flaw reported by Include Security in 2014**. Tinder's API returned the distance to other users with **very high precision**, so by requesting it from three spoofed positions an attacker could trilaterate someone's location to within about 100 feet. Tinder fixed it after it was reported.

This project is a reconstruction: \`nearby.js\` builds the profile card one user sees of another. It returns the raw distance from the locked \`geo.js\` — and the other user's coordinates along with it.

Fix \`toPublicProfile\` so the card carries a coarse distance and nothing else about location.`,
    bugReport: `**BUG-TINDER-LOC** · Priority: High (privacy) · Reported by: external researcher

toPublicProfile(viewer, other) — users are { id, name, lat, lon, … }.
Return EXACTLY { id, name, distanceMiles } (in that key order):
- distanceMiles = Math.round(geo.haversineMiles(viewer, other)), and never
  less than 1 (anything under a mile, including 0, is reported as 1)
- no coordinates and no other field of \`other\` may appear
listNearby(viewer, others) maps toPublicProfile over others, in order.

Observed: the card carries distanceMiles: 6.909… and the user's lat/lon.`,
    logs: `GET /user/recs -> [{"id":"52b4…","distanceMiles":6.909390495,"lat":…,"lon":…}]`,
    files: [
      {
        filePath: "src/nearby/nearby.js",
        isEditable: true,
        language: "javascript",
        content: `var geo = require("./geo");

exports.toPublicProfile = function (viewer, other) {
  return {
    id: other.id,
    name: other.name,
    distanceMiles: geo.haversineMiles(viewer, other),
    lat: other.lat,
    lon: other.lon
  };
};

exports.listNearby = function (viewer, others) {
  return others.map(function (o) { return exports.toPublicProfile(viewer, o); });
};
`,
      },
      {
        filePath: "src/nearby/geo.js",
        isEditable: false,
        language: "javascript",
        content: `// Great-circle distance in miles between two { lat, lon } points.
var R = 3958.8;
function rad(d) { return d * Math.PI / 180; }

exports.haversineMiles = function (a, b) {
  var dLat = rad(b.lat - a.lat);
  var dLon = rad(b.lon - a.lon);
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
};
`,
      },
    ],
    tests: [
      {
        name: "the card names the right person",
        isHidden: false,
        source: `var n = require("src/nearby/nearby");
var p = n.toPublicProfile({ id: "me", lat: 0, lon: 0 }, { id: "u2", name: "Sam", lat: 0.1, lon: 0 });
assert.equal([p.id, p.name], ["u2", "Sam"]);`,
      },
      {
        name: "the distance is whole miles",
        isHidden: false,
        source: `var n = require("src/nearby/nearby");
var p = n.toPublicProfile({ id: "me", lat: 0, lon: 0 }, { id: "u2", name: "Sam", lat: 0.1, lon: 0 });
assert.equal(p.distanceMiles, 7, "6.909 miles rounds to 7");`,
      },
      {
        name: "no coordinates or extra fields leak",
        isHidden: true,
        source: `var n = require("src/nearby/nearby");
var other = { id: "u3", name: "Ren", lat: 0.1, lon: 0, email: "ren@example.com" };
assert.equal(n.toPublicProfile({ id: "me", lat: 0, lon: 0 }, other), { id: "u3", name: "Ren", distanceMiles: 7 });`,
      },
      {
        name: "anything under a mile is reported as one mile",
        isHidden: true,
        source: `var n = require("src/nearby/nearby");
var me = { id: "me", lat: 0, lon: 0 };
assert.equal(n.toPublicProfile(me, { id: "a", name: "A", lat: 0.005, lon: 0 }).distanceMiles, 1);
assert.equal(n.toPublicProfile(me, { id: "b", name: "B", lat: 0, lon: 0 }).distanceMiles, 1);`,
      },
      {
        name: "the list applies the same rules",
        isHidden: true,
        source: `var n = require("src/nearby/nearby");
var me = { id: "me", lat: 0, lon: 0 };
var list = n.listNearby(me, [{ id: "a", name: "A", lat: 0.1, lon: 0 }, { id: "b", name: "B", lat: 0.001, lon: 0 }]);
assert.equal(list, [{ id: "a", name: "A", distanceMiles: 7 }, { id: "b", name: "B", distanceMiles: 1 }]);`,
      },
    ],
    fixedFiles: {
      "src/nearby/nearby.js": `var geo = require("./geo");

exports.toPublicProfile = function (viewer, other) {
  // Precise distances from a few vantage points pin a person down; whole
  // miles (floored at 1) keep the feature useful without that. Coordinates
  // never leave the server.
  var miles = Math.max(1, Math.round(geo.haversineMiles(viewer, other)));
  return { id: other.id, name: other.name, distanceMiles: miles };
};

exports.listNearby = function (viewer, others) {
  return others.map(function (o) { return exports.toPublicProfile(viewer, o); });
};
`,
    },
  },

  {
    title: "610,000 Shares at One Yen",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Money", "Validation", "Limits"],
    description: `Modelled on the **Mizuho Securities J-Com order of December 8, 2005**. A trader meant to sell **1 share at ¥610,000** in the newly listed J-Com and instead entered **610,000 shares at ¥1** — far more shares than the company had issued. The system showed a warning that was overridden, the order went through, and attempts to cancel it failed; Mizuho's loss was reported at roughly ¥40 billion.

This project is a reconstruction: \`orders.js\` takes a sell ticket from the order-entry screen, checks it against the locked listing data, and hands it to the locked exchange. Its limit check only produces warnings, and the call into the exchange passes the ticket's fields in the wrong positions.

Fix \`enterSellOrder\` so the order the exchange receives is the one on the ticket and an impossible quantity is blocked outright.`,
    bugReport: `**BUG-JCOM-1208** · Priority: Critical (trading loss) · Reported by: risk desk

enterSellOrder(market, ticket) — ticket is { symbol, price, quantity }:
- a symbol not in LISTINGS throws
- quantity > LISTINGS[symbol].outstanding throws
  Error("quantity exceeds shares outstanding") — a HARD block that nothing
  overrides; no order reaches the exchange (market.orders unchanged)
- otherwise the order is submitted with exactly the ticket's price and
  quantity (exchange.submit(market, symbol, price, quantity)) and the result
  is { order, warnings }, warnings from checkLimits
- a price below 70 % of lastPrice is a SOFT warning ("PRICE_FAR_BELOW_LAST"):
  the order is still submitted

Observed: a ticket for 1 share at 610,000 reached the exchange as 610,000
shares at 1, with a warning attached and no block.`,
    logs: `09:27:04 [oms] JCOM SELL ticket qty=1 px=610000
09:27:04 [oms] warnings=[QTY_EXCEEDS_OUTSTANDING, PRICE_FAR_BELOW_LAST] -> submitted
09:27:05 [tse] JCOM SELL 610000 @ 1 accepted`,
    files: [
      {
        filePath: "src/trading/orders.js",
        isEditable: true,
        language: "javascript",
        content: `var exchange = require("./exchange");
var LISTINGS = require("./listings").LISTINGS;

function checkLimits(ticket) {
  var listing = LISTINGS[ticket.symbol];
  var warnings = [];
  if (ticket.quantity > listing.outstanding) warnings.push("QTY_EXCEEDS_OUTSTANDING");
  if (ticket.price < listing.lastPrice * 0.7) warnings.push("PRICE_FAR_BELOW_LAST");
  return warnings;
}
exports.checkLimits = checkLimits;

// ticket: { symbol, price, quantity } from the order-entry screen.
exports.enterSellOrder = function (market, ticket) {
  var warnings = checkLimits(ticket);
  var order = exchange.submit(market, ticket.symbol, ticket.quantity, ticket.price);
  return { order: order, warnings: warnings };
};
`,
      },
      {
        filePath: "src/trading/exchange.js",
        isEditable: false,
        language: "javascript",
        content: `exports.createMarket = function () {
  return { orders: [] };
};

// submit(market, symbol, price, quantity): the exchange accepts the order as given.
exports.submit = function (market, symbol, price, quantity) {
  var order = { id: market.orders.length + 1, symbol: symbol, price: price, quantity: quantity };
  market.orders.push(order);
  return order;
};
`,
      },
      {
        filePath: "src/trading/listings.js",
        isEditable: false,
        language: "javascript",
        content: `// Illustrative listing data (shares outstanding, last traded price in yen).
exports.LISTINGS = {
  JCOM: { outstanding: 14500, lastPrice: 610000 },
  TOYO: { outstanding: 3000000, lastPrice: 5200 }
};
`,
      },
    ],
    tests: [
      {
        name: "the limit check flags a price far below the last trade",
        isHidden: false,
        source: `var o = require("src/trading/orders");
assert.equal(o.checkLimits({ symbol: "JCOM", price: 1, quantity: 1 }), ["PRICE_FAR_BELOW_LAST"]);`,
      },
      {
        name: "the exchange receives the ticket's price and quantity",
        isHidden: false,
        source: `var o = require("src/trading/orders");
var ex = require("src/trading/exchange");
var market = ex.createMarket();
var r = o.enterSellOrder(market, { symbol: "JCOM", price: 610000, quantity: 1 });
assert.equal(r.order, { id: 1, symbol: "JCOM", price: 610000, quantity: 1 }, "1 share at 610,000");
assert.equal(r.warnings, []);`,
      },
      {
        name: "more shares than exist is blocked outright",
        isHidden: true,
        source: `var o = require("src/trading/orders");
var ex = require("src/trading/exchange");
var market = ex.createMarket();
assert.throws(function () { o.enterSellOrder(market, { symbol: "JCOM", price: 1, quantity: 610000 }); });
assert.equal(market.orders, [], "nothing may reach the exchange");`,
      },
      {
        name: "selling exactly the shares outstanding is allowed",
        isHidden: true,
        source: `var o = require("src/trading/orders");
var ex = require("src/trading/exchange");
var market = ex.createMarket();
var r = o.enterSellOrder(market, { symbol: "JCOM", price: 600000, quantity: 14500 });
assert.equal([r.order.price, r.order.quantity, r.warnings], [600000, 14500, []]);`,
      },
      {
        name: "a low price is a warning, not a block",
        isHidden: true,
        source: `var o = require("src/trading/orders");
var ex = require("src/trading/exchange");
var market = ex.createMarket();
var r = o.enterSellOrder(market, { symbol: "TOYO", price: 1000, quantity: 200 });
assert.equal(r, { order: { id: 1, symbol: "TOYO", price: 1000, quantity: 200 }, warnings: ["PRICE_FAR_BELOW_LAST"] });`,
      },
      {
        name: "an unknown symbol is rejected",
        isHidden: true,
        source: `var o = require("src/trading/orders");
var ex = require("src/trading/exchange");
var market = ex.createMarket();
assert.throws(function () { o.enterSellOrder(market, { symbol: "NOPE", price: 1, quantity: 1 }); });
assert.equal(market.orders, []);`,
      },
    ],
    fixedFiles: {
      "src/trading/orders.js": `var exchange = require("./exchange");
var LISTINGS = require("./listings").LISTINGS;

function checkLimits(ticket) {
  var listing = LISTINGS[ticket.symbol];
  var warnings = [];
  if (ticket.quantity > listing.outstanding) warnings.push("QTY_EXCEEDS_OUTSTANDING");
  if (ticket.price < listing.lastPrice * 0.7) warnings.push("PRICE_FAR_BELOW_LAST");
  return warnings;
}
exports.checkLimits = checkLimits;

// ticket: { symbol, price, quantity } from the order-entry screen.
exports.enterSellOrder = function (market, ticket) {
  var listing = LISTINGS[ticket.symbol];
  if (!listing) throw new Error("unknown symbol");
  // Selling more shares than exist can never be intended: that is a hard
  // block, not a warning a busy trader can click through.
  if (ticket.quantity > listing.outstanding) {
    throw new Error("quantity exceeds shares outstanding");
  }
  var warnings = checkLimits(ticket);
  // Name each field at the call — price and quantity are both plain numbers,
  // so a positional swap type-checks and trades.
  var price = ticket.price;
  var quantity = ticket.quantity;
  var order = exchange.submit(market, ticket.symbol, price, quantity);
  return { order: order, warnings: warnings };
};
`,
    },
  },

  {
    title: "Interest Sent as Orders",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Money", "Validation", "Config"],
    description: `Modelled on **Goldman Sachs' options misfire of August 20, 2013**. Goldman said an internal system error caused **indications of interest** — messages that are not meant to trade — to be **sent to US options exchanges as real orders**, many at erroneous prices, some at $1. A large number of the resulting trades were later cancelled or adjusted by the exchanges.

This project is a reconstruction: \`OptionsRouter\` takes a batch of outgoing messages and decides what goes to the exchange. It treats every message as a live order, and a message without a price is filled in with the default from the locked \`RouterConfig\`.

Fix \`route\` so indications of interest never reach the exchange and no order is sent without an explicit, positive price.`,
    bugReport: `**BUG-GS-0820** · Priority: Critical (erroneous trades) · Reported by: exchange surveillance

route(batch) returns a RouteResult with three lists, each in batch order:
- a message of type "IOI" is NEVER routed: its id goes in held
- a message of type "ORDER" with an explicit price > 0 cents is routed as
  "<id>@<priceCents>"
- an "ORDER" with a missing (null) or non-positive price, and a message of
  any other type, is rejected: its id goes in rejected
RouterConfig.DEFAULT_PRICE_CENTS must never be used to price a live order.

Observed: indications of interest were routed as orders, and those without
a price went out at 100 cents.`,
    logs: `09:30:02 [router] routed IOI-88213 SPY 150820C00160000 x500 @100
09:30:02 [router] routed IOI-88214 AAPL 150820P00450000 x300 @100
09:30:03 [surveillance] member GS: burst of $1 option prints across exchanges`,
    files: [
      {
        filePath: "src/router/OptionsRouter.java",
        isEditable: true,
        language: "java",
        content: `class OptionsRouter {
    static RouteResult route(List<Message> batch) {
        RouteResult result = new RouteResult();
        for (Message m : batch) {
            int price = m.priceCents != null ? m.priceCents : RouterConfig.DEFAULT_PRICE_CENTS;
            result.routed.add(m.id + "@" + price);
        }
        return result;
    }
}`,
      },
      {
        filePath: "src/router/Message.java",
        isEditable: false,
        language: "java",
        content: `// type is "ORDER" (live, executable) or "IOI" (indication of interest:
// tells counterparties we might trade — never executable). priceCents may be
// null: IOIs usually carry no price.
class Message {
    final String id;
    final String type;
    final String symbol;
    final int qty;
    final Integer priceCents;

    Message(String id, String type, String symbol, int qty, Integer priceCents) {
        this.id = id;
        this.type = type;
        this.symbol = symbol;
        this.qty = qty;
        this.priceCents = priceCents;
    }
}

class RouteResult {
    final List<String> routed = new ArrayList<>();
    final List<String> rejected = new ArrayList<>();
    final List<String> held = new ArrayList<>();
}`,
      },
      {
        filePath: "src/router/RouterConfig.java",
        isEditable: false,
        language: "java",
        content: `class RouterConfig {
    // Placeholder price used by the quote simulator in test environments.
    static final int DEFAULT_PRICE_CENTS = 100;
}`,
      },
    ],
    tests: [
      {
        name: "a priced order is routed",
        isHidden: false,
        source: `                RouteResult r = OptionsRouter.route(Arrays.asList(new Message("o1", "ORDER", "SPY", 10, 250)));
                BugAssert.equal(r.routed, "[o1@250]");`,
      },
      {
        name: "an indication of interest is never routed",
        isHidden: false,
        source: `                RouteResult r = OptionsRouter.route(Arrays.asList(new Message("i1", "IOI", "SPY", 500, null)));
                BugAssert.equal(r.routed, "[]", "IOIs are not orders");
                BugAssert.equal(r.held, "[i1]");`,
      },
      {
        name: "an order without a price is rejected",
        isHidden: true,
        source: `                RouteResult r = OptionsRouter.route(Arrays.asList(new Message("o2", "ORDER", "AAPL", 3, null)));
                BugAssert.equal(r.routed, "[]", "never priced by default");
                BugAssert.equal(r.rejected, "[o2]");`,
      },
      {
        name: "a zero or negative price is rejected",
        isHidden: true,
        source: `                RouteResult r = OptionsRouter.route(Arrays.asList(
                    new Message("z", "ORDER", "QQQ", 1, 0),
                    new Message("n", "ORDER", "QQQ", 1, -5)));
                BugAssert.equal(r.rejected, "[z, n]");
                BugAssert.equal(r.routed, "[]");`,
      },
      {
        name: "a mixed batch is sorted into the right lists",
        isHidden: true,
        source: `                RouteResult r = OptionsRouter.route(Arrays.asList(
                    new Message("a", "ORDER", "SPY", 1, 120),
                    new Message("b", "IOI", "SPY", 9, 130),
                    new Message("c", "QUOTE", "SPY", 1, 140),
                    new Message("d", "ORDER", "SPY", 2, null),
                    new Message("e", "ORDER", "SPY", 3, 90)));
                BugAssert.equal(r.routed, "[a@120, e@90]");
                BugAssert.equal(r.held, "[b]");
                BugAssert.equal(r.rejected, "[c, d]");`,
      },
    ],
    fixedFiles: {
      "src/router/OptionsRouter.java": `class OptionsRouter {
    static RouteResult route(List<Message> batch) {
        RouteResult result = new RouteResult();
        for (Message m : batch) {
            // An indication of interest is information, not an instruction to
            // trade — it must never reach an exchange as an order.
            if ("IOI".equals(m.type)) {
                result.held.add(m.id);
                continue;
            }
            // A live order carries its own explicit price; a default is only
            // ever a placeholder, and at the exchange it is a real price.
            if (!"ORDER".equals(m.type) || m.priceCents == null || m.priceCents <= 0) {
                result.rejected.add(m.id);
                continue;
            }
            result.routed.add(m.id + "@" + m.priceCents);
        }
        return result;
    }
}`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE16_ORIGINS: Record<string, string> = {
  "The Key That Was Marked Keep": "Microsoft Azure AD · 2021",
  "The Lookup That Confirmed Every Email": "Twitter · 2022",
  "Wildcards for Every Account": "USPS · 2018",
  "The Duplicate Check Skipped for Speed": "Bitcoin Core · CVE-2018-17144",
  "Anyone Could Initialise the Wallet": "Parity multisig · July 2017",
  "The Hang at 49.7 Days": "Windows 95/98 · 1999",
  "The Alarm Queue That Went Quiet": "Northeast blackout · 2003",
  "Good Time on the Enhancement": "Washington State DOC · 2015",
  "Two Billion Transactions Later": "Sentry · 2015",
  "Public by Default": "Facebook · 2018",
  "The Installer That Deleted boot.ini": "EVE Online · 2007",
  "The Payment Page Script Nobody Pinned": "British Airways · 2018",
  "Distance to the Decimal": "Tinder · 2014",
  "610,000 Shares at One Yen": "Mizuho Securities · 2005",
  "Interest Sent as Orders": "Goldman Sachs · 2013",
};
