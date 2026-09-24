/**
 * Wave 17 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE17: BugSpec[] = [

  {
    title: "The Freelist That Ate the Raft Log",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Performance", "State", "Limits"],
    description: `Modelled on **Roblox's 73-hour outage** (October 28–31, 2021). Roblox's post-mortem traced it to its Consul cluster: a newly enabled streaming feature behaved badly under heavy load, and a pathological performance issue in BoltDB — the embedded database Consul uses for its Raft log — meant its list of free pages had grown very large, making every write progressively slower.

This project is a reconstruction of that second failure mode. \`freelist.js\` is the page allocator of a small log store; \`db.js\` persists the whole freelist on every commit, as BoltDB does. Freed pages are appended and never reclaimed, so after churn every commit pays for thousands of dead entries.

Fix \`release\` (and \`allocate\`) so the freelist holds only genuine holes, sorted, and pages at the end of the file are given back by truncating it.`,
    bugReport: `**BUG-RBX-1028** · Priority: Critical · Reported by: storage on-call

The allocator state is { pageCount, free }. Page ids are 0..pageCount-1.

allocate(fl):
- if free is non-empty, remove and return the LOWEST free page id
- otherwise return pageCount and increment pageCount

release(fl, id):
- ignore ids outside 0..pageCount-1 and ids that are already free
- otherwise add id to free; free is always sorted ascending
- then, while the highest page of the file (pageCount - 1) is free, remove it
  from free and decrement pageCount (truncate the file)

So free never contains a duplicate, never contains an id >= pageCount, and
never contains pageCount - 1.

db.commit(fl, meter) costs free.length + 1 units. After allocating 2,000 pages
and releasing them all, 100 commits must cost exactly 100 units.

Observed: after the churn every commit costs 2,001 units and climbing.`,
    logs: `[raft] commit took 38ms freelist=412,880 pages
[raft] commit took 51ms freelist=498,117 pages
[consul] leader election timed out; raft log append latency p99 9.2s`,
    files: [
      {
        filePath: "src/raft/freelist.js",
        isEditable: true,
        language: "javascript",
        content: `// Page allocator for the Raft log store. Page ids are 0..pageCount-1.
exports.create = function () {
  return { pageCount: 0, free: [] };
};

exports.allocate = function (fl) {
  if (fl.free.length > 0) {
    var best = 0;
    for (var i = 1; i < fl.free.length; i++) {
      if (fl.free[i] < fl.free[best]) best = i;
    }
    return fl.free.splice(best, 1)[0];
  }
  var id = fl.pageCount;
  fl.pageCount += 1;
  return id;
};

exports.release = function (fl, id) {
  fl.free.push(id);
};
`,
      },
      {
        filePath: "src/raft/db.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Every commit persists the allocator's freelist next to the data page, the way
BoltDB writes its freelist on commit. A commit costs one unit per freelist
entry plus one for the data page; meter.units accumulates the cost.
*/
exports.meter = function () {
  return { units: 0, commits: 0 };
};

exports.commit = function (fl, meter) {
  meter.units += fl.free.length + 1;
  meter.commits += 1;
};
`,
      },
    ],
    tests: [
      {
        name: "fresh pages are handed out, then the lowest freed page is reused",
        isHidden: false,
        source: `var f = require("src/raft/freelist");
var fl = f.create();
var ids = [];
for (var i = 0; i < 5; i++) ids.push(f.allocate(fl));
assert.equal(ids, [0, 1, 2, 3, 4]);
f.release(fl, 3);
f.release(fl, 1);
assert.equal(f.allocate(fl), 1, "lowest free page first");
assert.equal(f.allocate(fl), 3);
assert.equal(f.allocate(fl), 5);`,
      },
      {
        name: "releasing the tail pages shrinks the file",
        isHidden: false,
        source: `var f = require("src/raft/freelist");
var fl = f.create();
for (var i = 0; i < 1000; i++) f.allocate(fl);
for (var j = 999; j >= 0; j--) f.release(fl, j);
assert.equal({ pageCount: fl.pageCount, free: fl.free }, { pageCount: 0, free: [] });`,
      },
      {
        name: "commit cost stays flat after churn",
        isHidden: false,
        source: `var f = require("src/raft/freelist");
var db = require("src/raft/db");
var fl = f.create();
for (var i = 0; i < 2000; i++) f.allocate(fl);
for (var j = 0; j < 2000; j++) f.release(fl, j);
var m = db.meter();
for (var k = 0; k < 100; k++) db.commit(fl, m);
assert.equal(m.units, 100, "an empty freelist costs nothing to persist");`,
      },
      {
        name: "a page released twice is listed once",
        isHidden: true,
        source: `var f = require("src/raft/freelist");
var fl = f.create();
f.allocate(fl); f.allocate(fl); f.allocate(fl);
f.release(fl, 0);
f.release(fl, 0);
assert.equal({ pageCount: fl.pageCount, free: fl.free }, { pageCount: 3, free: [0] });`,
      },
      {
        name: "holes stay sorted and the tail is trimmed",
        isHidden: true,
        source: `var f = require("src/raft/freelist");
var fl = f.create();
for (var i = 0; i < 6; i++) f.allocate(fl);
f.release(fl, 4);
f.release(fl, 1);
f.release(fl, 5);
assert.equal({ pageCount: fl.pageCount, free: fl.free }, { pageCount: 4, free: [1] });`,
      },
      {
        name: "releasing a page beyond the file is ignored",
        isHidden: true,
        source: `var f = require("src/raft/freelist");
var fl = f.create();
f.allocate(fl); f.allocate(fl);
f.release(fl, 7);
f.release(fl, -1);
assert.equal({ pageCount: fl.pageCount, free: fl.free }, { pageCount: 2, free: [] });`,
      },
    ],
    fixedFiles: {
      "src/raft/freelist.js": `// Page allocator for the Raft log store. Page ids are 0..pageCount-1.
exports.create = function () {
  return { pageCount: 0, free: [] };
};

exports.allocate = function (fl) {
  // free is kept sorted, so the lowest page is always at the front — no scan.
  if (fl.free.length > 0) return fl.free.shift();
  var id = fl.pageCount;
  fl.pageCount += 1;
  return id;
};

exports.release = function (fl, id) {
  // Every entry is rewritten on every commit, so nothing may enter the list
  // that is not a genuine hole: no pages outside the file, no duplicates.
  if (id < 0 || id >= fl.pageCount || fl.free.indexOf(id) !== -1) return;
  var at = 0;
  while (at < fl.free.length && fl.free[at] < id) at++;
  fl.free.splice(at, 0, id);
  // Free pages at the end of the file are given back by truncating it. Without
  // this, churn left the list holding every page ever freed and it only grew.
  while (fl.free.length > 0 && fl.free[fl.free.length - 1] === fl.pageCount - 1) {
    fl.free.pop();
    fl.pageCount -= 1;
  }
};
`,
    },
  },

  {
    title: "The Gift Card Paid Twice",
    difficulty: "hard",
    category: "database",
    language: "javascript",
    tags: ["Concurrency", "Money"],
    description: `Modelled on **Egor Homakov's 2015 Starbucks report**: he found that transferring balance between Starbucks gift cards was vulnerable to a race condition — by sending the same transfer request several times at once, the balance was credited more than once while the source card was debited only once, creating money that never existed.

\`transfer.js\` builds a transfer as a sequence of steps; \`scheduler.js\` runs steps from several transfers in a chosen interleaving, each step atomically. The transfer reads the balance in one step, credits in the next and writes the debit back in a third — so two transfers can both spend the same balance.

Fix \`makeTransfer\` so the balance check and the debit happen together, before anything is credited.`,
    bugReport: `**BUG-SBUX-0515** · Priority: Critical (money creation) · Reported by: responsible disclosure

makeTransfer(store, from, to, amount) returns { steps, pc: 0, result: null }.
scheduler.run(transfers, order) runs each step atomically, in any interleaving.

Whatever the interleaving:
- a transfer succeeds (result "ok") only if the source card held at least
  \`amount\` at the moment it was debited; the destination is credited exactly
  \`amount\`
- otherwise result is "insufficient" and neither card changes
- money is conserved: the sum of all balances never changes
- a card's balance never goes below zero

store.debitIfAtLeast(card, amount) is an atomic check-and-debit.

Observed: two simultaneous transfers of a card's full balance both report
"ok" and the destination receives it twice.`,
    logs: `[cards] transfer 7713->2204 amount=10.00 ok
[cards] transfer 7713->2204 amount=10.00 ok
[ledger] reconciliation: card 2204 balance 20.00 exceeds funded total 10.00`,
    files: [
      {
        filePath: "src/cards/transfer.js",
        isEditable: true,
        language: "javascript",
        content: `// Moves \`amount\` from one gift card to another as a sequence of steps.
exports.makeTransfer = function (store, from, to, amount) {
  var t = { steps: [], pc: 0, result: null };
  var balance = 0;
  t.steps.push(function () {
    balance = store.get(from);
  });
  t.steps.push(function () {
    if (balance < amount) {
      t.result = "insufficient";
      return;
    }
    store.set(to, store.get(to) + amount);
  });
  t.steps.push(function () {
    store.set(from, balance - amount);
    t.result = "ok";
  });
  return t;
};
`,
      },
      {
        filePath: "src/cards/store.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The card store. The scheduler runs each transfer step as one indivisible unit,
so any single call below is atomic; two calls made in two different steps are
not — another transfer may run in between.
*/
exports.create = function (balances) {
  var b = {};
  for (var k in balances) b[k] = balances[k];
  return {
    balances: b,
    get: function (card) { return b[card]; },
    set: function (card, value) { b[card] = value; },
    debitIfAtLeast: function (card, amount) {
      if (b[card] < amount) return false;
      b[card] -= amount;
      return true;
    }
  };
};
`,
      },
      {
        filePath: "src/cards/scheduler.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Deterministic interleaving. \`order\` lists which transfer takes its next step;
each step runs atomically. A transfer stops as soon as it has a result. Once
\`order\` is used up, the remaining steps run round-robin.
*/
function stepOnce(t) {
  if (t.result !== null || t.pc >= t.steps.length) return false;
  var fn = t.steps[t.pc];
  t.pc += 1;
  fn();
  return true;
}

exports.run = function (transfers, order) {
  for (var i = 0; i < order.length; i++) stepOnce(transfers[order[i]]);
  var progressed = true;
  while (progressed) {
    progressed = false;
    for (var j = 0; j < transfers.length; j++) {
      if (stepOnce(transfers[j])) progressed = true;
    }
  }
  return transfers.map(function (t) { return t.result; });
};
`,
      },
    ],
    tests: [
      {
        name: "a single transfer moves the money",
        isHidden: false,
        source: `var s = require("src/cards/store").create({ A: 10, B: 0 });
var mk = require("src/cards/transfer").makeTransfer;
var run = require("src/cards/scheduler").run;
assert.equal(run([mk(s, "A", "B", 4)], []), ["ok"]);
assert.equal(s.balances, { A: 6, B: 4 });`,
      },
      {
        name: "two concurrent full-balance transfers pay out once",
        isHidden: false,
        source: `var s = require("src/cards/store").create({ A: 10, B: 0 });
var mk = require("src/cards/transfer").makeTransfer;
var run = require("src/cards/scheduler").run;
var results = run([mk(s, "A", "B", 10), mk(s, "A", "B", 10)], [0, 1, 0, 1, 0, 1]);
assert.equal(results.slice().sort(), ["insufficient", "ok"], "only one may succeed");
assert.equal(s.balances, { A: 0, B: 10 }, "the balance is spent once");`,
      },
      {
        name: "two halves interleaved both succeed and conserve money",
        isHidden: true,
        source: `var s = require("src/cards/store").create({ A: 10, B: 0 });
var mk = require("src/cards/transfer").makeTransfer;
var run = require("src/cards/scheduler").run;
assert.equal(run([mk(s, "A", "B", 5), mk(s, "A", "B", 5)], [0, 1, 0, 1, 0, 1]), ["ok", "ok"]);
assert.equal(s.balances, { A: 0, B: 10 });`,
      },
      {
        name: "an insufficient transfer changes nothing",
        isHidden: true,
        source: `var s = require("src/cards/store").create({ A: 3, B: 0 });
var mk = require("src/cards/transfer").makeTransfer;
var run = require("src/cards/scheduler").run;
assert.equal(run([mk(s, "A", "B", 5)], []), ["insufficient"]);
assert.equal(s.balances, { A: 3, B: 0 });`,
      },
      {
        name: "three interleaved transfers conserve the total",
        isHidden: true,
        source: `var s = require("src/cards/store").create({ A: 10, B: 0, C: 0 });
var mk = require("src/cards/transfer").makeTransfer;
var run = require("src/cards/scheduler").run;
var ts = [mk(s, "A", "B", 10), mk(s, "A", "C", 10), mk(s, "B", "C", 5)];
assert.equal(run(ts, [0, 1, 2, 0, 1, 2, 0, 1, 2]), ["ok", "insufficient", "insufficient"]);
assert.equal(s.balances, { A: 0, B: 10, C: 0 });
assert.equal(s.balances.A + s.balances.B + s.balances.C, 10, "money is conserved");`,
      },
    ],
    fixedFiles: {
      "src/cards/transfer.js": `// Moves \`amount\` from one gift card to another as a sequence of steps.
exports.makeTransfer = function (store, from, to, amount) {
  var t = { steps: [], pc: 0, result: null };
  // Check and debit in ONE atomic step. A balance read in one step and written
  // back in a later one is stale by the time it lands, and a concurrent
  // transfer can spend the very same money in between.
  t.steps.push(function () {
    if (!store.debitIfAtLeast(from, amount)) t.result = "insufficient";
  });
  // Credit only money that has already left the source card.
  t.steps.push(function () {
    store.set(to, store.get(to) + amount);
    t.result = "ok";
  });
  return t;
};
`,
    },
  },

  {
    title: "The Consumer Key That Opened Enterprise Mail",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Security", "Auth"],
    description: `Modelled on **Storm-0558** (disclosed July 2023): a China-based threat actor forged authentication tokens with an acquired Microsoft account (MSA) *consumer* signing key and used them to read enterprise email at a number of organisations, including US government agencies. Microsoft's investigation found that a token-validation flaw allowed the consumer key to be trusted for enterprise tokens.

This project is a reconstruction. \`TokenValidator\` checks the token's issuer and signature, but it looks the signing key up in the whole key ring — so a key that belongs to a different issuer is happily accepted as long as the signature verifies.

Fix \`validate\` so a token is only verified with a key that its own issuer publishes.`,
    bugReport: `**BUG-S0558** · Priority: Critical (token forgery) · Reported by: incident response

TokenValidator.validate(ring, token, expectedIssuer) returns, checking in order:
1. "wrong-issuer"   if token.iss != expectedIssuer
2. "untrusted-key"  if token.kid is not one of ring.keysFor(token.iss) —
                    a key held in the ring for ANOTHER issuer does not count
3. "bad-signature"  if Signer.sign(key.secret, token.payload()) != token.sig
4. "ok"             otherwise

Observed: a token signed with the consumer key "msa-1" but claiming the
enterprise issuer validates as "ok" at the enterprise endpoint.`,
    logs: `[owa] token kid=msa-1 iss=https://sts.windows.net/contoso sub=ceo@contoso -> ok
[audit] mailbox access by forged enterprise token signed with consumer key`,
    files: [
      {
        filePath: "src/auth/TokenValidator.java",
        isEditable: true,
        language: "java",
        content: `class TokenValidator {
    // Returns "ok" or the reason the token is refused.
    static String validate(KeyRing ring, Token t, String expectedIssuer) {
        if (!t.iss.equals(expectedIssuer)) return "wrong-issuer";
        SigningKey key = ring.find(t.kid);
        if (key == null) return "untrusted-key";
        if (!Signer.sign(key.secret, t.payload()).equals(t.sig)) return "bad-signature";
        return "ok";
    }
}
`,
      },
      {
        filePath: "src/auth/KeyRing.java",
        isEditable: false,
        language: "java",
        content: `class Issuers {
    static final String CONSUMER = "https://login.live.com";
    static final String ENTERPRISE = "https://sts.windows.net/contoso";
}

class SigningKey {
    final String kid;
    final String issuer;
    final String secret;
    SigningKey(String kid, String issuer, String secret) {
        this.kid = kid; this.issuer = issuer; this.secret = secret;
    }
}

class KeyRing {
    private final Map<String, SigningKey> byKid = new LinkedHashMap<>();
    void add(SigningKey k) { byKid.put(k.kid, k); }
    // Any key the ring holds, whichever issuer published it.
    SigningKey find(String kid) { return byKid.get(kid); }
    // The keys one issuer publishes in its metadata document.
    List<SigningKey> keysFor(String issuer) {
        List<SigningKey> out = new ArrayList<>();
        for (SigningKey k : byKid.values()) if (k.issuer.equals(issuer)) out.add(k);
        return out;
    }
}
`,
      },
      {
        filePath: "src/auth/Token.java",
        isEditable: false,
        language: "java",
        content: `class Token {
    final String kid, iss, sub, sig;
    Token(String kid, String iss, String sub, String sig) {
        this.kid = kid; this.iss = iss; this.sub = sub; this.sig = sig;
    }
    String payload() { return iss + "|" + sub; }
}

class Signer {
    static String sign(String secret, String payload) {
        long h = 1125899906842597L;
        String s = secret + "#" + payload;
        for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
        return Long.toHexString(h);
    }
}

class Fixtures {
    // One enterprise key and one consumer key in the same ring.
    static KeyRing ring() {
        KeyRing r = new KeyRing();
        r.add(new SigningKey("ent-1", Issuers.ENTERPRISE, "ent-secret"));
        r.add(new SigningKey("msa-1", Issuers.CONSUMER, "msa-secret"));
        return r;
    }
    static Token mint(String kid, String secret, String iss, String sub) {
        return new Token(kid, iss, sub, Signer.sign(secret, iss + "|" + sub));
    }
}
`,
      },
    ],
    tests: [
      {
        name: "a genuine enterprise token validates",
        isHidden: false,
        source: `                Token t = Fixtures.mint("ent-1", "ent-secret", Issuers.ENTERPRISE, "alice");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), t, Issuers.ENTERPRISE), "ok");`,
      },
      {
        name: "a consumer key cannot sign an enterprise token",
        isHidden: false,
        source: `                Token t = Fixtures.mint("msa-1", "msa-secret", Issuers.ENTERPRISE, "ceo");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), t, Issuers.ENTERPRISE), "untrusted-key", "key belongs to another issuer");`,
      },
      {
        name: "a consumer token is refused at the enterprise endpoint",
        isHidden: true,
        source: `                Token t = Fixtures.mint("msa-1", "msa-secret", Issuers.CONSUMER, "bob");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), t, Issuers.ENTERPRISE), "wrong-issuer");`,
      },
      {
        name: "a tampered signature is refused",
        isHidden: true,
        source: `                Token t = new Token("ent-1", Issuers.ENTERPRISE, "alice", "deadbeef");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), t, Issuers.ENTERPRISE), "bad-signature");`,
      },
      {
        name: "the rule holds for the consumer issuer too",
        isHidden: true,
        source: `                Token ok = Fixtures.mint("msa-1", "msa-secret", Issuers.CONSUMER, "bob");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), ok, Issuers.CONSUMER), "ok");
                Token cross = Fixtures.mint("ent-1", "ent-secret", Issuers.CONSUMER, "bob");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), cross, Issuers.CONSUMER), "untrusted-key");
                Token unknown = Fixtures.mint("ent-9", "ent-secret", Issuers.ENTERPRISE, "alice");
                BugAssert.equal(TokenValidator.validate(Fixtures.ring(), unknown, Issuers.ENTERPRISE), "untrusted-key");`,
      },
    ],
    fixedFiles: {
      "src/auth/TokenValidator.java": `class TokenValidator {
    // Returns "ok" or the reason the token is refused.
    static String validate(KeyRing ring, Token t, String expectedIssuer) {
        if (!t.iss.equals(expectedIssuer)) return "wrong-issuer";
        // Only a key the token's own issuer publishes may verify it. Looking the
        // kid up across the whole ring let a consumer signing key vouch for an
        // enterprise identity.
        SigningKey key = null;
        for (SigningKey k : ring.keysFor(t.iss)) {
            if (k.kid.equals(t.kid)) key = k;
        }
        if (key == null) return "untrusted-key";
        if (!Signer.sign(key.secret, t.payload()).equals(t.sig)) return "bad-signature";
        return "ok";
    }
}
`,
    },
  },

  {
    title: "The Deposit From Address Zero",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Validation", "Money"],
    description: `Modelled on the **Qubit Finance bridge exploit** (January 2022): the attacker called the bridge's token \`deposit\` path with a resource that mapped to the zero address — the placeholder used for native ETH. Calling an address that holds no contract code "succeeds" on Ethereum without doing anything, so the transfer helper reported success, the bridge recorded a deposit that never happened, and bridged tokens were minted on the other chain without any funds behind them. Losses were widely reported at around $80 million.

This project is a reconstruction. \`chain.js\` behaves like a low-level EVM call, and \`bridge.js\` trusts \`safeTransferFrom\` not throwing as proof that the funds arrived.

Fix \`deposit\` so only real token contracts are accepted and a mint is recorded only for funds the bridge actually received.`,
    bugReport: `**BUG-QBIT-0127** · Priority: Critical · Reported by: bridge monitoring

deposit(chain, registry, resourceId, from, amount, mints) must:
- throw for an unknown resourceId or a non-positive amount
- throw if the resource's token address is the zero address (chain.ZERO) or
  an address with no contract code (chain.hasCode(address) is false)
- throw if the token transfer fails
- throw unless the bridge's balance of the token (chain.balanceOf(token,
  BRIDGE)) rose by exactly \`amount\` (fee-on-transfer tokens are unsupported)
- on success, push exactly one { to: from, resourceId, amount } onto mints

Whenever it throws, nothing is pushed onto mints.

Observed: a deposit against the ETH resource (token = zero address) mints
xETH on the other chain although no funds moved.`,
    logs: `[bridge] Deposit resource=ETH token=0x0000000000000000000000000000000000000000 amount=190000000000000000000
[bridge] mint qXETH to 0xd01a... amount=190000000000000000000
[monitor] bridge ETH balance unchanged after deposit`,
    files: [
      {
        filePath: "src/bridge/bridge.js",
        isEditable: true,
        language: "javascript",
        content: `var safe = require("./safe");

var BRIDGE = "0xb41d6e";
exports.BRIDGE = BRIDGE;

// Locks \`amount\` of the resource's token in the bridge and records a mint on
// the other chain.
exports.deposit = function (chain, registry, resourceId, from, amount, mints) {
  var token = registry[resourceId];
  if (token === undefined) throw new Error("unknown resource " + resourceId);
  if (!(amount > 0)) throw new Error("amount must be positive");
  safe.safeTransferFrom(chain, token, from, BRIDGE, amount);
  mints.push({ to: from, resourceId: resourceId, amount: amount });
};
`,
      },
      {
        filePath: "src/bridge/chain.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A toy EVM. call(address, method, args) behaves like a low-level CALL: calling
an address with no contract code SUCCEEDS and returns no data — nothing runs.
deployToken(address, balances, feePercent) installs an ERC-20-like contract;
a fee token delivers amount minus feePercent to the receiver.
*/
exports.ZERO = "0x0000000000000000000000000000000000000000";

exports.create = function () {
  var contracts = {};
  return {
    deployToken: function (address, balances, feePercent) {
      contracts[address] = { balances: balances, fee: feePercent || 0 };
    },
    hasCode: function (address) {
      return Object.prototype.hasOwnProperty.call(contracts, address);
    },
    balanceOf: function (address, holder) {
      var c = contracts[address];
      return c ? (c.balances[holder] || 0) : 0;
    },
    call: function (address, method, args) {
      var c = contracts[address];
      if (!c) return { success: true, data: null };
      if (method !== "transferFrom") return { success: false, data: null };
      var from = args[0], to = args[1], amount = args[2];
      if ((c.balances[from] || 0) < amount) return { success: false, data: null };
      c.balances[from] -= amount;
      c.balances[to] = (c.balances[to] || 0) + amount - Math.floor(amount * c.fee / 100);
      return { success: true, data: true };
    }
  };
};
`,
      },
      {
        filePath: "src/bridge/safe.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Mirrors the common safeTransferFrom helper: it throws if the call fails or
returns false, and treats a call that returns NO data as success (some real
tokens return nothing).
*/
exports.safeTransferFrom = function (chain, token, from, to, amount) {
  var res = chain.call(token, "transferFrom", [from, to, amount]);
  if (!res.success) throw new Error("transfer failed");
  if (res.data !== null && res.data !== true) throw new Error("transfer returned false");
};
`,
      },
    ],
    tests: [
      {
        name: "a real token deposit mints the same amount",
        isHidden: false,
        source: `var c = require("src/bridge/chain");
var b = require("src/bridge/bridge");
var chain = c.create();
chain.deployToken("0xusdc", { alice: 100 });
var mints = [];
b.deposit(chain, { USDC: "0xusdc" }, "USDC", "alice", 40, mints);
assert.equal(mints, [{ to: "alice", resourceId: "USDC", amount: 40 }]);
assert.equal(chain.balanceOf("0xusdc", b.BRIDGE), 40);`,
      },
      {
        name: "the zero-address resource is refused and mints nothing",
        isHidden: false,
        source: `var c = require("src/bridge/chain");
var b = require("src/bridge/bridge");
var chain = c.create();
var mints = [];
assert.throws(function () { b.deposit(chain, { ETH: c.ZERO }, "ETH", "mallory", 190, mints); }, "no funds moved");
assert.equal(mints, []);`,
      },
      {
        name: "an address without contract code is refused",
        isHidden: true,
        source: `var c = require("src/bridge/chain");
var b = require("src/bridge/bridge");
var chain = c.create();
var mints = [];
assert.throws(function () { b.deposit(chain, { GHOST: "0xdead" }, "GHOST", "mallory", 5, mints); });
assert.equal(mints, []);`,
      },
      {
        name: "a deposit the bridge did not fully receive mints nothing",
        isHidden: true,
        source: `var c = require("src/bridge/chain");
var b = require("src/bridge/bridge");
var chain = c.create();
chain.deployToken("0xfee", { alice: 100 }, 10);
var mints = [];
assert.throws(function () { b.deposit(chain, { FEE: "0xfee" }, "FEE", "alice", 50, mints); });
assert.equal(mints, []);`,
      },
      {
        name: "an unfunded transfer is refused",
        isHidden: true,
        source: `var c = require("src/bridge/chain");
var b = require("src/bridge/bridge");
var chain = c.create();
chain.deployToken("0xusdc", { alice: 10 });
var mints = [];
assert.throws(function () { b.deposit(chain, { USDC: "0xusdc" }, "USDC", "alice", 11, mints); });
assert.equal(mints, []);`,
      },
    ],
    fixedFiles: {
      "src/bridge/bridge.js": `var safe = require("./safe");
var ZERO = require("./chain").ZERO;

var BRIDGE = "0xb41d6e";
exports.BRIDGE = BRIDGE;

// Locks \`amount\` of the resource's token in the bridge and records a mint on
// the other chain.
exports.deposit = function (chain, registry, resourceId, from, amount, mints) {
  var token = registry[resourceId];
  if (token === undefined) throw new Error("unknown resource " + resourceId);
  if (!(amount > 0)) throw new Error("amount must be positive");
  // A call to an address with no code "succeeds" without moving anything, so
  // "the transfer did not throw" proves nothing for the zero address (native
  // ETH's placeholder) or any other code-less address.
  if (token === ZERO || !chain.hasCode(token)) throw new Error("resource is not a token contract");
  var before = chain.balanceOf(token, BRIDGE);
  safe.safeTransferFrom(chain, token, from, BRIDGE, amount);
  // Mint only against funds that demonstrably arrived.
  if (chain.balanceOf(token, BRIDGE) - before !== amount) throw new Error("bridge did not receive the deposit");
  mints.push({ to: from, resourceId: resourceId, amount: amount });
};
`,
    },
  },

  {
    title: "The Invariant Off by a Hundred",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Money", "Validation"],
    description: `Modelled on the **Uranium Finance exploit** (April 2021): Uranium, a fork of Uniswap v2, changed the scale of its swap-fee arithmetic from 1,000 to 10,000, but the constant-product check at the end of \`swap\` still compared against the reserves scaled by 1,000². The invariant was therefore about 100 times weaker than intended, and attackers drained the pools by asking for far more output than their input paid for — tens of millions of dollars' worth.

This project is a reconstruction. \`fees.py\` defines the fee scale; \`pair.py\` scales balances by it and then checks the product against the old constant.

Fix \`swap\` so the invariant uses the same scale as the balances.`,
    bugReport: `**BUG-URANIUM-0428** · Priority: Critical · Reported by: protocol monitoring

swap(reserve0, reserve1, amount0_in, amount1_out) (token0 in, token1 out):
- raise ValueError if amount0_in <= 0 or amount1_out <= 0
- raise ValueError if amount1_out >= reserve1
- balance0 = reserve0 + amount0_in, balance1 = reserve1 - amount1_out
- adjusted0 = balance0 * SCALE - amount0_in * FEE, adjusted1 = balance1 * SCALE
- raise ValueError("K") unless adjusted0 * adjusted1 >= reserve0 * reserve1 * SCALE**2
- otherwise return [balance0, balance1]

With this rule, fees.get_amount_out(...) is exactly the largest accepted
output: the quote passes, the quote + 1 is rejected.

Observed: a 1,000-unit input withdraws 900,000 of a 1,000,000 reserve.`,
    logs: `[pair 0x8a..] swap in0=1000 out1=900000 k_check=pass
[pair 0x8a..] reserve1 1000000 -> 100000`,
    files: [
      {
        filePath: "src/amm/pair.py",
        isEditable: true,
        language: "python",
        content: `fees = bug_require("./fees.py")


def swap(reserve0, reserve1, amount0_in, amount1_out):
    """Token0 in, token1 out. Returns the new [reserve0, reserve1]."""
    if amount0_in <= 0 or amount1_out <= 0:
        raise ValueError("INSUFFICIENT_AMOUNT")
    if amount1_out >= reserve1:
        raise ValueError("INSUFFICIENT_LIQUIDITY")
    balance0 = reserve0 + amount0_in
    balance1 = reserve1 - amount1_out
    adjusted0 = balance0 * fees.SCALE - amount0_in * fees.FEE
    adjusted1 = balance1 * fees.SCALE
    if adjusted0 * adjusted1 < reserve0 * reserve1 * 1000 ** 2:
        raise ValueError("K")
    return [balance0, balance1]
`,
      },
      {
        filePath: "src/amm/fees.py",
        isEditable: false,
        language: "python",
        content: `# Fee arithmetic. Balances are scaled by SCALE before the fee is taken, so the
# swap fee is FEE / SCALE of the input (0.25%).
SCALE = 10000
FEE = 25


def get_amount_out(amount_in, reserve_in, reserve_out):
    """The largest output the pool should give for amount_in."""
    with_fee = amount_in * (SCALE - FEE)
    return (with_fee * reserve_out) // (reserve_in * SCALE + with_fee)
`,
      },
    ],
    tests: [
      {
        name: "a swap at the quoted price is accepted",
        isHidden: false,
        source: `pair = bug_require("src/amm/pair.py")
fees = bug_require("src/amm/fees.py")
out = fees.get_amount_out(10000, 1000000, 1000000)
assert_.equal(pair.swap(1000000, 1000000, 10000, out), [1010000, 1000000 - out])`,
      },
      {
        name: "a draining swap is rejected",
        isHidden: false,
        source: `pair = bug_require("src/amm/pair.py")
assert_.throws(lambda: pair.swap(1000000, 1000000, 1000, 900000), "a tiny input cannot take 90% of the pool")`,
      },
      {
        name: "one unit more than the quote is rejected",
        isHidden: true,
        source: `pair = bug_require("src/amm/pair.py")
fees = bug_require("src/amm/fees.py")
out = fees.get_amount_out(5000, 2000000, 3000000)
pair.swap(2000000, 3000000, 5000, out)
assert_.throws(lambda: pair.swap(2000000, 3000000, 5000, out + 1), "the quote is the ceiling")`,
      },
      {
        name: "zero amounts are rejected",
        isHidden: true,
        source: `pair = bug_require("src/amm/pair.py")
assert_.throws(lambda: pair.swap(1000, 1000, 0, 5))
assert_.throws(lambda: pair.swap(1000, 1000, 5, 0))`,
      },
      {
        name: "the whole reserve can never be withdrawn",
        isHidden: true,
        source: `pair = bug_require("src/amm/pair.py")
assert_.throws(lambda: pair.swap(1000, 1000, 10 ** 9, 1000))`,
      },
    ],
    fixedFiles: {
      "src/amm/pair.py": `fees = bug_require("./fees.py")


def swap(reserve0, reserve1, amount0_in, amount1_out):
    """Token0 in, token1 out. Returns the new [reserve0, reserve1]."""
    if amount0_in <= 0 or amount1_out <= 0:
        raise ValueError("INSUFFICIENT_AMOUNT")
    if amount1_out >= reserve1:
        raise ValueError("INSUFFICIENT_LIQUIDITY")
    balance0 = reserve0 + amount0_in
    balance1 = reserve1 - amount1_out
    adjusted0 = balance0 * fees.SCALE - amount0_in * fees.FEE
    adjusted1 = balance1 * fees.SCALE
    # Both balances were scaled by SCALE, so the reserves must be too. Comparing
    # against the old 1000 ** 2 made the invariant SCALE**2 / 1000**2 = 100x
    # weaker than the fee maths assumes.
    if adjusted0 * adjusted1 < reserve0 * reserve1 * fees.SCALE ** 2:
        raise ValueError("K")
    return [balance0, balance1]
`,
    },
  },

  {
    title: "The Meters That Thought It Was 1920",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Time", "Parsing"],
    description: `Modelled on **New York City's parking meters** on January 1, 2020: thousands of the city's meters stopped accepting credit and debit cards on New Year's Day, and each one had to be updated by hand. The city attributed it to a software problem with card expiration dates; the fault was widely reported as a "Y2K20" bug.

This project is an illustrative reconstruction built on the most common way that happens. Many Y2K fixes did not widen years to four digits; they used a *windowing pivot* — two-digit years below 20 mean 20YY, anything else 19YY. \`expiry.js\` still does exactly that, so on New Year's Day 2020 every card expiring in "20" or later suddenly looks like it expired in the 1920s.

Fix \`resolveYear\` so the window moves with the current year.`,
    bugReport: `**BUG-DOT-0101** · Priority: High · Reported by: meter operations

Card expiries are printed "MM/YY". A card is valid through the END of its
expiry month.

resolveYear(yy, currentYear) must return the unique year Y such that
  Y % 100 == yy  and  currentYear - 80 <= Y < currentYear + 20
e.g. resolveYear(22, 2019) = 2022, resolveYear(20, 2020) = 2020,
resolveYear(35, 2031) = 2035, resolveYear(99, 2020) = 1999.

isExpired("MM/YY", { year, month }) is true only when the expiry (year,
month) is strictly before today's (year, month).

Observed: since 1 January 2020 every card with an expiry of 20 or later is
declined as expired.`,
    logs: `[meter 4417] card ****1881 exp=08/23 -> DECLINED expired (1923-08)
[meter 4417] card ****0342 exp=01/20 -> DECLINED expired (1920-01)
[meter 4417] cash only mode`,
    files: [
      {
        filePath: "src/meter/expiry.js",
        isEditable: true,
        language: "javascript",
        content: `// Card expiry handling for the meter's card reader. Expiry is printed "MM/YY".
exports.resolveYear = function (yy, currentYear) {
  return yy < 20 ? 2000 + yy : 1900 + yy;
};

exports.isExpired = function (mmyy, today) {
  var parts = mmyy.split("/");
  var month = parseInt(parts[0], 10);
  var year = exports.resolveYear(parseInt(parts[1], 10), today.year);
  if (year !== today.year) return year < today.year;
  return month < today.month;
};
`,
      },
      {
        filePath: "src/meter/reader.js",
        isEditable: false,
        language: "javascript",
        content: `var expiry = require("./expiry");

// today is injected by the meter's clock: { year, month }.
exports.authorize = function (card, today) {
  if (expiry.isExpired(card.expiry, today)) return "declined: expired";
  return "approved";
};
`,
      },
    ],
    tests: [
      {
        name: "cards in December 2019 resolve correctly",
        isHidden: false,
        source: `var e = require("src/meter/expiry");
var today = { year: 2019, month: 12 };
assert.equal(e.isExpired("05/22", today), false, "expires 2022");
assert.equal(e.isExpired("11/19", today), true, "expired last month");`,
      },
      {
        name: "cards still work on New Year's Day 2020",
        isHidden: false,
        source: `var e = require("src/meter/expiry");
var today = { year: 2020, month: 1 };
assert.equal(e.isExpired("01/20", today), false, "valid through January 2020");
assert.equal(e.isExpired("08/23", today), false, "expires 2023, not 1923");`,
      },
      {
        name: "the window follows the current year",
        isHidden: true,
        source: `var e = require("src/meter/expiry");
assert.equal(e.resolveYear(35, 2031), 2035);
assert.equal(e.resolveYear(99, 2020), 1999);
assert.equal(e.resolveYear(39, 2020), 2039);
assert.equal(e.resolveYear(40, 2020), 1940);
assert.equal(e.resolveYear(22, 2019), 2022);`,
      },
      {
        name: "a card expired last month in 2020 is declined",
        isHidden: true,
        source: `var e = require("src/meter/expiry");
assert.equal(e.isExpired("01/20", { year: 2020, month: 2 }), true);`,
      },
      {
        name: "the reader approves a 2024 card in 2020",
        isHidden: true,
        source: `var r = require("src/meter/reader");
assert.equal(r.authorize({ expiry: "12/24" }, { year: 2020, month: 1 }), "approved");`,
      },
    ],
    fixedFiles: {
      "src/meter/expiry.js": `// Card expiry handling for the meter's card reader. Expiry is printed "MM/YY".
exports.resolveYear = function (yy, currentYear) {
  // A fixed pivot ("below 20 means 20YY") only postpones the century bug to
  // the pivot year. Place YY in a window that moves with the clock instead:
  // currentYear - 80 <= Y < currentYear + 20.
  var y = currentYear - (currentYear % 100) + yy;
  if (y >= currentYear + 20) y -= 100;
  if (y < currentYear - 80) y += 100;
  return y;
};

exports.isExpired = function (mmyy, today) {
  var parts = mmyy.split("/");
  var month = parseInt(parts[0], 10);
  var year = exports.resolveYear(parseInt(parts[1], 10), today.year);
  if (year !== today.year) return year < today.year;
  return month < today.month;
};
`,
    },
  },

  {
    title: "Priority Inversion on Mars",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Concurrency", "State"],
    description: `Modelled on **Mars Pathfinder** (July 1997): days after landing, the spacecraft began resetting itself. JPL traced it to priority inversion in its VxWorks software: a low-priority meteorological task held a mutex guarding the information bus, the high-priority bus-management task blocked waiting for it, and medium-priority tasks kept pre-empting the low-priority holder. A watchdog saw that the bus task had not completed in time and reset the system. JPL fixed it by uploading a change that enabled priority inheritance on that mutex.

This project reconstructs it with a deterministic tick scheduler (\`Task.java\`, locked). \`BusMutex\` is a plain lock: a task blocked on it does nothing for the owner.

Fix \`BusMutex\` so it implements priority inheritance.`,
    bugReport: `**BUG-MPF-0797** · Priority: Critical (spacecraft resets) · Reported by: flight software

Scheduler.run executes one op per tick, always picking the runnable task with
the highest effectivePriority (ties: the task listed first). At the start of
every tick it calls mutex.block(t) for each task waiting on the held mutex.

BusMutex must keep the public field \`owner\` and implement:
- tryLock(t): take the mutex if free (owner = t), return whether it did
- block(t): t is waiting; the owner's effectivePriority is raised to
  max(owner.effectivePriority, t.effectivePriority) (priority inheritance)
- unlock(t): if t owns it, release it and restore t.effectivePriority to
  t.basePriority

With meteo (priority 1, arrives tick 0: LOCK WORK WORK UNLOCK), bus
(priority 3, tick 1: LOCK WORK UNLOCK) and comms (priority 2, tick 2: six
WORK), the bus task must finish by tick 8 (Watchdog.fed(bus, 8)); the trace
is meteo x4, bus x3, comms x6.

Observed: comms runs ticks 2–7 while bus waits; bus finishes at tick 12 and
the watchdog resets the lander.`,
    logs: `[vxworks] bc_dist missed deadline; bc_sched watchdog expired
[vxworks] SYSTEM RESET
[ground] reset traced to mutex held by ASI/MET task`,
    files: [
      {
        filePath: "src/rtos/BusMutex.java",
        isEditable: true,
        language: "java",
        content: `class BusMutex {
    Task owner;
    List<Task> waiters = new ArrayList<>();

    boolean tryLock(Task t) {
        if (owner != null) return false;
        owner = t;
        waiters.remove(t);
        return true;
    }

    void block(Task t) {
        if (!waiters.contains(t)) waiters.add(t);
    }

    void unlock(Task t) {
        if (owner == t) owner = null;
    }
}
`,
      },
      {
        filePath: "src/rtos/Task.java",
        isEditable: false,
        language: "java",
        content: `class Task {
    final String name;
    final int basePriority;
    int effectivePriority;
    final int arrival;
    final String[] ops;
    int pc = 0;
    int finishedAt = -1;

    Task(String name, int priority, int arrival, String... ops) {
        this.name = name; this.basePriority = priority; this.effectivePriority = priority;
        this.arrival = arrival; this.ops = ops;
    }
    boolean done() { return pc >= ops.length; }
    String nextOp() { return ops[pc]; }
}

class Scheduler {
    static boolean waiting(Task t, BusMutex m) {
        return t.nextOp().equals("LOCK") && m.owner != null && m.owner != t;
    }

    // One op per tick; returns the name that ran each tick ("idle" if none).
    static List<String> run(List<Task> tasks, BusMutex m, int ticks) {
        List<String> trace = new ArrayList<>();
        for (int tick = 0; tick < ticks; tick++) {
            for (Task t : tasks) {
                if (t.arrival <= tick && !t.done() && waiting(t, m)) m.block(t);
            }
            Task pick = null;
            for (Task t : tasks) {
                if (t.arrival > tick || t.done() || waiting(t, m)) continue;
                if (pick == null || t.effectivePriority > pick.effectivePriority) pick = t;
            }
            if (pick == null) { trace.add("idle"); continue; }
            String op = pick.nextOp();
            if (op.equals("LOCK")) m.tryLock(pick);
            else if (op.equals("UNLOCK")) m.unlock(pick);
            pick.pc++;
            trace.add(pick.name);
            if (pick.done()) pick.finishedAt = tick;
        }
        return trace;
    }
}

class Watchdog {
    static boolean fed(Task bus, int deadline) {
        return bus.finishedAt >= 0 && bus.finishedAt <= deadline;
    }
}

class Lander {
    static Task meteo() { return new Task("meteo", 1, 0, "LOCK", "WORK", "WORK", "UNLOCK"); }
    static Task bus() { return new Task("bus", 3, 1, "LOCK", "WORK", "UNLOCK"); }
    static Task comms() { return new Task("comms", 2, 2, "WORK", "WORK", "WORK", "WORK", "WORK", "WORK"); }
}
`,
      },
    ],
    tests: [
      {
        name: "without contention the medium task simply pre-empts meteo",
        isHidden: false,
        source: `                Task meteo = Lander.meteo();
                Task comms = Lander.comms();
                List<String> trace = Scheduler.run(Arrays.asList(meteo, comms), new BusMutex(), 10);
                BugAssert.equal(String.join(",", trace), "meteo,meteo,comms,comms,comms,comms,comms,comms,meteo,meteo");`,
      },
      {
        name: "the bus task meets its watchdog deadline",
        isHidden: false,
        source: `                Task bus = Lander.bus();
                Scheduler.run(Arrays.asList(Lander.meteo(), bus, Lander.comms()), new BusMutex(), 16);
                BugAssert.ok(Watchdog.fed(bus, 8), "bus finished at tick " + bus.finishedAt);`,
      },
      {
        name: "the full schedule runs in inheritance order",
        isHidden: true,
        source: `                List<String> trace = Scheduler.run(Arrays.asList(Lander.meteo(), Lander.bus(), Lander.comms()), new BusMutex(), 16);
                BugAssert.equal(String.join(",", trace), "meteo,meteo,meteo,meteo,bus,bus,bus,comms,comms,comms,comms,comms,comms,idle,idle,idle");`,
      },
      {
        name: "the owner inherits the waiter's priority while it blocks",
        isHidden: true,
        source: `                Task meteo = Lander.meteo();
                Scheduler.run(Arrays.asList(meteo, Lander.bus(), Lander.comms()), new BusMutex(), 2);
                BugAssert.equal(meteo.effectivePriority, 3, "boosted to the bus task's priority");`,
      },
      {
        name: "priorities return to base after the mutex is released",
        isHidden: true,
        source: `                Task meteo = Lander.meteo();
                Task bus = Lander.bus();
                Scheduler.run(Arrays.asList(meteo, bus, Lander.comms()), new BusMutex(), 16);
                BugAssert.equal(meteo.effectivePriority, 1);
                BugAssert.equal(bus.effectivePriority, 3);
                BugAssert.equal(meteo.finishedAt, 3);`,
      },
    ],
    fixedFiles: {
      "src/rtos/BusMutex.java": `class BusMutex {
    Task owner;
    List<Task> waiters = new ArrayList<>();

    boolean tryLock(Task t) {
        if (owner != null) return false;
        owner = t;
        waiters.remove(t);
        return true;
    }

    void block(Task t) {
        if (!waiters.contains(t)) waiters.add(t);
        // Priority inheritance: the owner runs at the priority of the most
        // important task waiting on it, so a medium-priority task can no longer
        // starve the holder while the high-priority task waits.
        if (owner != null && t.effectivePriority > owner.effectivePriority) {
            owner.effectivePriority = t.effectivePriority;
        }
    }

    void unlock(Task t) {
        if (owner != t) return;
        owner = null;
        // The borrowed priority ends with the critical section.
        t.effectivePriority = t.basePriority;
    }
}
`,
    },
  },

  {
    title: "The Final Invitation That Never Came",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Time", "Validation"],
    description: `Modelled on the **NHS England breast screening failure** announced in May 2018: the Health Secretary told Parliament that a computer algorithm failure dating back to 2009 meant an estimated 450,000 women aged 68 to 71 had not been invited to their final breast screening. (A later independent review found the causes were more tangled than a single coding error.)

This project is a reconstruction of the simplest form of that failure — an age-band boundary. \`screening.py\` decides who is in the programme with an exclusive upper bound on completed years of age, so the oldest women in the programme silently drop out of the invitation run.

Fix \`in_programme\` so the band matches the policy exactly.`,
    bugReport: `**BUG-NHSBSP-0518** · Priority: Critical · Reported by: screening programme

in_programme(dob, today) — both datetime.date — is True from the day of a
woman's 50th birthday up to AND INCLUDING the day of her 71st birthday, and
False outside that. Birthdays come from dates.add_years(dob, n) (29 February
falls on 1 March in non-leap years).

select_for_invite(women, today_iso) returns the sorted ids of women who are
in_programme on that day AND are due: never screened (last is None), or
today >= add_years(last screening date, 3).

Observed: women aged 70, and women on their 71st birthday, are never
selected.`,
    logs: `[bso-batch] run 2018-05-01 selected=18,204 eligible_by_age=50..69
[audit] 0 invitations issued to women aged 70 since 2009`,
    files: [
      {
        filePath: "src/screening/screening.py",
        isEditable: true,
        language: "python",
        content: `dates = bug_require("./dates.py")
policy = bug_require("./policy.py")


def in_programme(dob, today):
    age = dates.age_years(dob, today)
    return policy.FIRST_AGE <= age < policy.LAST_AGE


def select_for_invite(women, today_iso):
    today = dates.parse(today_iso)
    chosen = []
    for w in women:
        if not in_programme(dates.parse(w["dob"]), today):
            continue
        last = w.get("last")
        if last is not None and today < dates.add_years(dates.parse(last), policy.INTERVAL_YEARS):
            continue
        chosen.append(w["id"])
    return sorted(chosen)
`,
      },
      {
        filePath: "src/screening/policy.py",
        isEditable: false,
        language: "python",
        content: `# Screening programme policy.
# Women are invited from their 50th birthday up to and including their 71st
# birthday, every INTERVAL_YEARS years.
FIRST_AGE = 50
LAST_AGE = 70
FINAL_BIRTHDAY = 71
INTERVAL_YEARS = 3
`,
      },
      {
        filePath: "src/screening/dates.py",
        isEditable: false,
        language: "python",
        content: `import datetime


def parse(iso):
    return datetime.date(int(iso[0:4]), int(iso[5:7]), int(iso[8:10]))


def add_years(d, n):
    """Same day n years later; 29 February becomes 1 March in a non-leap year."""
    try:
        return d.replace(year=d.year + n)
    except ValueError:
        return datetime.date(d.year + n, 3, 1)


def age_years(dob, today):
    """Completed years of age on today."""
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age
`,
      },
    ],
    tests: [
      {
        name: "a routine run picks the due women in the band",
        isHidden: false,
        source: `s = bug_require("src/screening/screening.py")
women = [
    {"id": "w1", "dob": "1963-01-10", "last": None},
    {"id": "w2", "dob": "1973-03-01", "last": None},
    {"id": "w3", "dob": "1960-02-02", "last": "2017-01-01"},
]
assert_.equal(s.select_for_invite(women, "2018-05-01"), ["w1"])`,
      },
      {
        name: "a 70-year-old gets her final invitation",
        isHidden: false,
        source: `s = bug_require("src/screening/screening.py")
women = [{"id": "w4", "dob": "1947-09-15", "last": "2015-04-01"}]
assert_.equal(s.select_for_invite(women, "2018-05-01"), ["w4"], "aged 70 is still in the programme")`,
      },
      {
        name: "the 71st birthday itself is included, the day after is not",
        isHidden: true,
        source: `s = bug_require("src/screening/screening.py")
women = [
    {"id": "on-71st", "dob": "1947-05-01", "last": None},
    {"id": "past-71st", "dob": "1947-04-30", "last": None},
]
assert_.equal(s.select_for_invite(women, "2018-05-01"), ["on-71st"])`,
      },
      {
        name: "the band starts on the 50th birthday",
        isHidden: true,
        source: `s = bug_require("src/screening/screening.py")
women = [
    {"id": "b", "dob": "1968-05-01", "last": None},
    {"id": "a", "dob": "1968-05-02", "last": None},
]
assert_.equal(s.select_for_invite(women, "2018-05-01"), ["b"])`,
      },
      {
        name: "due exactly three years after the last screening",
        isHidden: true,
        source: `s = bug_require("src/screening/screening.py")
women = [
    {"id": "due", "dob": "1958-06-06", "last": "2015-05-01"},
    {"id": "early", "dob": "1958-06-06", "last": "2015-05-02"},
]
assert_.equal(s.select_for_invite(women, "2018-05-01"), ["due"])`,
      },
      {
        name: "a leap-day birthday ends on 1 March",
        isHidden: true,
        source: `s = bug_require("src/screening/screening.py")
d = bug_require("src/screening/dates.py")
dob = d.parse("1948-02-29")
assert_.ok(s.in_programme(dob, d.parse("2019-03-01")), "71st birthday is 1 March 2019")
assert_.ok(not s.in_programme(dob, d.parse("2019-03-02")))`,
      },
    ],
    fixedFiles: {
      "src/screening/screening.py": `dates = bug_require("./dates.py")
policy = bug_require("./policy.py")


def in_programme(dob, today):
    # The policy is stated in birthdays, not completed years: "age < 70" drops
    # every woman aged 70 and everyone on her 71st birthday — the final
    # invitation round. Compare against the actual birthday dates, inclusive.
    first = dates.add_years(dob, policy.FIRST_AGE)
    last = dates.add_years(dob, policy.FINAL_BIRTHDAY)
    return first <= today <= last


def select_for_invite(women, today_iso):
    today = dates.parse(today_iso)
    chosen = []
    for w in women:
        if not in_programme(dates.parse(w["dob"]), today):
            continue
        last = w.get("last")
        if last is not None and today < dates.add_years(dates.parse(last), policy.INTERVAL_YEARS):
            continue
        chosen.append(w["id"])
    return sorted(chosen)
`,
    },
  },

  {
    title: "The Backup That Always Said Yes",
    difficulty: "easy",
    category: "database",
    language: "python",
    tags: ["Reliability", "Validation"],
    description: `Modelled on **Pixar's Toy Story 2 deletion** (1998): a recursive delete command run on the film's file server wiped out most of the production's files, and when the team turned to the backups they found they had been failing for some time without anyone noticing. The film was largely recovered from a copy a technical director happened to keep at home.

This project is a reconstruction. \`backup.py\` writes every file to a tape, but it swallows write errors and reports success based on what it *tried* to write — never checking what the tape actually holds.

Fix \`run_backup\` so failures are surfaced and the result is verified against the tape.`,
    bugReport: `**BUG-TS2-1998** · Priority: Critical · Reported by: systems

run_backup(source, tape) copies source (name -> data) to an empty tape, in
sorted name order, and returns {"ok", "files", "bytes"}:
- on the first TapeFull error, stop writing (attempt no further files)
- "files" and "bytes" describe what tape.catalogue() actually holds
  afterwards (count of entries, sum of sizes)
- "ok" is True only if no write failed AND every source file is in the
  catalogue with its exact size; otherwise False

Observed: the nightly job has reported ok for months while the tape held
only part of the tree.`,
    logs: `[backup] 1998-11-02 nightly: ok (files=18422)
[backup] 1998-11-03 nightly: ok (files=18422)
[restore] tape 0412: 4,117 of 18,422 expected files present`,
    files: [
      {
        filePath: "src/backup/backup.py",
        isEditable: true,
        language: "python",
        content: `tape_mod = bug_require("./tape.py")


def run_backup(source, tape):
    """Copy every file in source (name -> data) to the tape."""
    files = 0
    size = 0
    for name in sorted(source):
        data = source[name]
        try:
            tape.write(name, data)
        except tape_mod.TapeFull:
            continue
        files += 1
        size += len(data)
    return {"ok": True, "files": files, "bytes": size}
`,
      },
      {
        filePath: "src/backup/tape.py",
        isEditable: false,
        language: "python",
        content: `class TapeFull(Exception):
    pass


class Tape:
    """A backup tape. write() raises TapeFull when the data would not fit.
    Names in lose are accepted by a failing drive but never recorded."""

    def __init__(self, capacity, lose=None):
        self.capacity = capacity
        self.used = 0
        self.lose = set(lose or [])
        self.files = {}

    def write(self, name, data):
        if self.used + len(data) > self.capacity:
            raise TapeFull(name)
        self.used += len(data)
        if name not in self.lose:
            self.files[name] = len(data)

    def catalogue(self):
        return dict(self.files)
`,
      },
    ],
    tests: [
      {
        name: "a backup that fits is reported ok",
        isHidden: false,
        source: `b = bug_require("src/backup/backup.py")
t = bug_require("src/backup/tape.py")
tape = t.Tape(100)
assert_.equal(b.run_backup({"woody.rib": "abcd", "buzz.rib": "efghi"}, tape), {"ok": True, "files": 2, "bytes": 9})`,
      },
      {
        name: "a full tape is a failed backup",
        isHidden: false,
        source: `b = bug_require("src/backup/backup.py")
t = bug_require("src/backup/tape.py")
tape = t.Tape(10)
res = b.run_backup({"a": "1111", "b": "2222", "c": "3333"}, tape)
assert_.equal(res, {"ok": False, "files": 2, "bytes": 8}, "never report ok for a partial tape")`,
      },
      {
        name: "files the drive silently lost fail verification",
        isHidden: true,
        source: `b = bug_require("src/backup/backup.py")
t = bug_require("src/backup/tape.py")
tape = t.Tape(100, lose=["b"])
assert_.equal(b.run_backup({"a": "1111", "b": "2222", "c": "3333"}, tape), {"ok": False, "files": 2, "bytes": 8})`,
      },
      {
        name: "writing stops at the first failure",
        isHidden: true,
        source: `b = bug_require("src/backup/backup.py")
t = bug_require("src/backup/tape.py")
tape = t.Tape(10)
res = b.run_backup({"a": "12345678", "b": "1234", "c": "1"}, tape)
assert_.equal(res, {"ok": False, "files": 1, "bytes": 8})
assert_.equal(tape.catalogue(), {"a": 8})`,
      },
      {
        name: "an empty tree is trivially ok",
        isHidden: true,
        source: `b = bug_require("src/backup/backup.py")
t = bug_require("src/backup/tape.py")
assert_.equal(b.run_backup({}, t.Tape(0)), {"ok": True, "files": 0, "bytes": 0})`,
      },
    ],
    fixedFiles: {
      "src/backup/backup.py": `tape_mod = bug_require("./tape.py")


def run_backup(source, tape):
    """Copy every file in source (name -> data) to the tape."""
    ok = True
    for name in sorted(source):
        try:
            tape.write(name, source[name])
        except tape_mod.TapeFull:
            # A failed write is a failed backup. Swallowing it is how a job
            # reports "ok" for months while the tape holds half the tree.
            ok = False
            break
    # Report and verify what the tape actually holds, not what we asked of it.
    held = tape.catalogue()
    for name in source:
        if held.get(name) != len(source[name]):
            ok = False
    return {"ok": ok, "files": len(held), "bytes": sum(held.values())}
`,
    },
  },

  {
    title: "The Group Chat Nobody Approved",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Auth", "Validation"],
    description: `Modelled on **Facebook Messenger Kids** (July 2019): Facebook notified parents that a design flaw had let children join group chats with users their parents had not approved. A child could start a group with their approved contacts, and those contacts' own approved friends ended up in conversation with children whose parents had never approved them.

This project is a reconstruction. \`groups.js\` checks each new member against the chat's *creator* only — not against every child already in the chat.

Fix \`createGroup\` and \`addMember\` so every member is approved for every other member.`,
    bugReport: `**BUG-MK-0719** · Priority: Critical (child safety) · Reported by: trust & safety

approvals.isApproved(child, other) is true when other is on child's
parent-approved list. Approval is one-way.

A user may join a group only if, for EVERY current member m,
isApproved(m, user) AND isApproved(user, m).

createGroup(approvals, creator, invitees) starts with [creator], considers
invitees in order and adds each one that passes the rule against the members
added so far; the others are listed in rejected, in order. It returns
{ creator, members, rejected }.

addMember(approvals, group, user): true without change if user is already a
member; otherwise add and return true if the rule passes, else return false
and change nothing.

Observed: ben's group put dev in a chat with ana, whose parents never
approved dev.`,
    logs: `[mk-groups] create creator=ben members=ana,dev (checked against ben)
[trust] ana <-> dev not approved by either parent; conversation active`,
    files: [
      {
        filePath: "src/kids/groups.js",
        isEditable: true,
        language: "javascript",
        content: `// Group chats for the kids app.
exports.createGroup = function (approvals, creator, invitees) {
  var members = [creator];
  var rejected = [];
  for (var i = 0; i < invitees.length; i++) {
    if (approvals.isApproved(creator, invitees[i])) members.push(invitees[i]);
    else rejected.push(invitees[i]);
  }
  return { creator: creator, members: members, rejected: rejected };
};

exports.addMember = function (approvals, group, user) {
  if (group.members.indexOf(user) !== -1) return true;
  if (!approvals.isApproved(group.creator, user)) return false;
  group.members.push(user);
  return true;
};
`,
      },
      {
        filePath: "src/kids/approvals.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Parents approve contacts per child: lists[child] names the users that child
may talk to. Approval is one-way — ana listing ben says nothing about ben's
parents' decision.
*/
exports.create = function (lists) {
  return {
    isApproved: function (child, other) {
      return (lists[child] || []).indexOf(other) !== -1;
    }
  };
};

exports.sample = function () {
  return exports.create({
    ana: ["ben", "cai"],
    ben: ["ana", "cai", "dev"],
    cai: ["ana", "ben"],
    dev: ["ben"]
  });
};
`,
      },
    ],
    tests: [
      {
        name: "a group of mutually approved friends is created",
        isHidden: false,
        source: `var g = require("src/kids/groups");
var a = require("src/kids/approvals").sample();
assert.equal(g.createGroup(a, "ana", ["ben", "cai"]), { creator: "ana", members: ["ana", "ben", "cai"], rejected: [] });`,
      },
      {
        name: "the creator's friend is not approved for the other children",
        isHidden: false,
        source: `var g = require("src/kids/groups");
var a = require("src/kids/approvals").sample();
assert.equal(g.createGroup(a, "ben", ["ana", "dev"]), { creator: "ben", members: ["ben", "ana"], rejected: ["dev"] }, "ana's parents never approved dev");`,
      },
      {
        name: "adding a member checks every child already in the chat",
        isHidden: true,
        source: `var g = require("src/kids/groups");
var a = require("src/kids/approvals").sample();
var group = g.createGroup(a, "ben", ["cai"]);
assert.equal(g.addMember(a, group, "dev"), false);
assert.equal(group.members, ["ben", "cai"]);`,
      },
      {
        name: "one-way approval is not enough",
        isHidden: true,
        source: `var g = require("src/kids/groups");
var a = require("src/kids/approvals").create({ eve: ["fay"], fay: [] });
assert.equal(g.createGroup(a, "eve", ["fay"]), { creator: "eve", members: ["eve"], rejected: ["fay"] });`,
      },
      {
        name: "re-adding a member is a no-op",
        isHidden: true,
        source: `var g = require("src/kids/groups");
var a = require("src/kids/approvals").sample();
var group = g.createGroup(a, "ana", ["ben"]);
assert.equal(g.addMember(a, group, "ben"), true);
assert.equal(g.addMember(a, group, "cai"), true);
assert.equal(group.members, ["ana", "ben", "cai"]);`,
      },
    ],
    fixedFiles: {
      "src/kids/groups.js": `// Group chats for the kids app.

// Every pair of members must be approved both ways. Checking the newcomer
// against the creator alone let the creator's friends into conversations with
// children whose parents had never approved them.
function allowed(approvals, members, user) {
  for (var i = 0; i < members.length; i++) {
    if (!approvals.isApproved(members[i], user) || !approvals.isApproved(user, members[i])) return false;
  }
  return true;
}

exports.createGroup = function (approvals, creator, invitees) {
  var members = [creator];
  var rejected = [];
  for (var i = 0; i < invitees.length; i++) {
    if (allowed(approvals, members, invitees[i])) members.push(invitees[i]);
    else rejected.push(invitees[i]);
  }
  return { creator: creator, members: members, rejected: rejected };
};

exports.addMember = function (approvals, group, user) {
  if (group.members.indexOf(user) !== -1) return true;
  if (!allowed(approvals, group.members, user)) return false;
  group.members.push(user);
  return true;
};
`,
    },
  },

  {
    title: "The Edge of the Far Lands",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Overflow"],
    description: `Modelled on **Minecraft's Far Lands** (Java Edition before Beta 1.8): about 12.55 million blocks from spawn, the terrain generator broke down into towering walls of distorted, repeating terrain. The cause was numeric — the noise generator scaled block coordinates up for its octaves, and far enough out those values no longer fit the 32-bit integer arithmetic the generator relied on.

This project is a reconstruction. \`TerrainSampler.noiseCoord\` multiplies a block column by the noise scale in \`int\` arithmetic before widening the result, so just past 12,558,383 blocks the product wraps negative and the lattice lookups jump to the far side of the noise field.

Fix the sampler so the coordinate is computed without overflow.`,
    bugReport: `**BUG-MC-FARLANDS** · Priority: Medium · Reported by: explorers

For every int blockX (the whole int range is a legal column):
- noiseCoord(blockX) == (long) blockX * Noise.SCALE, exactly
- cell(blockX) == floorDiv(noiseCoord(blockX), Noise.CELL)
- height(blockX) interpolates Noise.lattice(cell) and Noise.lattice(cell + 1)
  by floorMod(noiseCoord, CELL) as the code already does
- consecutive columns never jump: cell(x + 1) - cell(x) is 0 or 1

Observed: at x = 12,558,384 the cell index jumps from about 2.1 million to
about -2.1 million and the terrain turns into walls.`,
    logs: `[worldgen] chunk x=784899 cell=2097151 -> cell=-2097152 at column 12558384
[worldgen] heightmap discontinuity 71 -> 12 over one block`,
    files: [
      {
        filePath: "src/world/TerrainSampler.java",
        isEditable: true,
        language: "java",
        content: `class TerrainSampler {
    // Position of a block column along the noise axis.
    static long noiseCoord(int blockX) {
        return blockX * Noise.SCALE;
    }

    static long cell(int blockX) {
        return Math.floorDiv(noiseCoord(blockX), (long) Noise.CELL);
    }

    static int height(int blockX) {
        long n = noiseCoord(blockX);
        long c = Math.floorDiv(n, (long) Noise.CELL);
        int frac = (int) Math.floorMod(n, (long) Noise.CELL);
        int a = Noise.lattice(c);
        int b = Noise.lattice(c + 1);
        return 64 + a + (b - a) * frac / Noise.CELL;
    }
}
`,
      },
      {
        filePath: "src/world/Noise.java",
        isEditable: false,
        language: "java",
        content: `class Noise {
    // Noise units per block at the highest-frequency octave.
    static final int SCALE = 171;
    // Noise units per lattice cell.
    static final int CELL = 1024;

    // Deterministic lattice value in 0..63 for a cell index.
    static int lattice(long cell) {
        long h = cell * 0x9E3779B97F4A7C15L;
        h ^= (h >>> 29);
        return (int) Math.floorMod(h, 64L);
    }
}
`,
      },
    ],
    tests: [
      {
        name: "columns near spawn sample normally",
        isHidden: false,
        source: `                BugAssert.equal(TerrainSampler.noiseCoord(1000), 171000L);
                BugAssert.equal(TerrainSampler.cell(1000), 166L);
                BugAssert.equal(TerrainSampler.cell(-1), -1L);`,
      },
      {
        name: "a column past 12.56 million blocks keeps its coordinate",
        isHidden: false,
        source: `                BugAssert.equal(TerrainSampler.noiseCoord(12600000), 2154600000L, "no 32-bit wrap");`,
      },
      {
        name: "far negative columns keep their coordinate",
        isHidden: true,
        source: `                BugAssert.equal(TerrainSampler.noiseCoord(-13000000), -2223000000L);
                BugAssert.equal(TerrainSampler.noiseCoord(Integer.MAX_VALUE), (long) Integer.MAX_VALUE * 171L);`,
      },
      {
        name: "no wall at the old boundary",
        isHidden: true,
        source: `                for (int x = 12558370; x < 12558400; x++) {
                    long step = TerrainSampler.cell(x + 1) - TerrainSampler.cell(x);
                    BugAssert.ok(step == 0 || step == 1, "jump at column " + x);
                }`,
      },
      {
        name: "height far out uses the true lattice cells",
        isHidden: true,
        source: `                int x = 20000000;
                long n = (long) x * 171L;
                long c = Math.floorDiv(n, 1024L);
                int frac = (int) Math.floorMod(n, 1024L);
                int a = Noise.lattice(c), b = Noise.lattice(c + 1);
                BugAssert.equal(TerrainSampler.height(x), 64 + a + (b - a) * frac / 1024);`,
      },
    ],
    fixedFiles: {
      "src/world/TerrainSampler.java": `class TerrainSampler {
    // Position of a block column along the noise axis.
    static long noiseCoord(int blockX) {
        // Widen BEFORE multiplying: int * int is computed in 32 bits and only
        // then converted, so past ~12.56M blocks the product had already
        // wrapped negative — the Far Lands.
        return (long) blockX * Noise.SCALE;
    }

    static long cell(int blockX) {
        return Math.floorDiv(noiseCoord(blockX), (long) Noise.CELL);
    }

    static int height(int blockX) {
        long n = noiseCoord(blockX);
        long c = Math.floorDiv(n, (long) Noise.CELL);
        int frac = (int) Math.floorMod(n, (long) Noise.CELL);
        int a = Noise.lattice(c);
        int b = Noise.lattice(c + 1);
        return 64 + a + (b - a) * frac / Noise.CELL;
    }
}
`,
    },
  },

  {
    title: "The Invisible Tweet Button",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Security", "Config"],
    description: `Modelled on the **Twitter "Don't Click" clickjacking worm** (February 2009): a page showed a single button labelled "Don't Click" over an invisible frame of Twitter's own page. Signed-in visitors who clicked it actually clicked Twitter's update button, posting the same link from their own account and spreading it to their followers. Twitter responded by stopping its pages from being framed by other sites.

This project is a reconstruction. \`headers.js\` builds response headers, but it only adds frame protection to a hand-picked list of "sensitive" routes — and the page that posts a tweet is not on it.

Fix \`buildHeaders\` so no HTML page can be framed by another site.`,
    bugReport: `**BUG-TW-0212** · Priority: Critical · Reported by: security

buildHeaders(path, contentType) returns a header object that always has
Content-Type = contentType. For EVERY HTML response (contentType starting
with "text/html"), on any path, known or not:
- X-Frame-Options: "DENY"
- Content-Security-Policy: the route's own policy (routes.ROUTES[path].csp)
  followed by "; frame-ancestors 'none'", or just "frame-ancestors 'none'"
  when the route has none
Non-HTML responses keep the route's CSP if any and get no X-Frame-Options.

Observed: /home — the page with the tweet box — can be framed by any site.`,
    logs: `[edge] GET /home referer=http://evil.example/dontclick.html sec-fetch-dest=iframe 200
[statuses] burst of identical "Don't Click" updates from unrelated accounts`,
    files: [
      {
        filePath: "src/web/headers.js",
        isEditable: true,
        language: "javascript",
        content: `var routes = require("./routes");

var FRAME_SENSITIVE = ["/login", "/settings"];

exports.buildHeaders = function (path, contentType) {
  var h = { "Content-Type": contentType };
  var route = routes.ROUTES[path] || {};
  if (route.csp) h["Content-Security-Policy"] = route.csp;
  if (FRAME_SENSITIVE.indexOf(path) !== -1) h["X-Frame-Options"] = "DENY";
  return h;
};
`,
      },
      {
        filePath: "src/web/routes.js",
        isEditable: false,
        language: "javascript",
        content: `// Per-route settings. Paths not listed here are still served (user pages,
// statuses, search ...).
exports.ROUTES = {
  "/home": { csp: "default-src 'self'" },
  "/login": { csp: "default-src 'self'; form-action 'self'" },
  "/settings": {},
  "/api/statuses/update": { csp: "default-src 'none'" }
};
`,
      },
    ],
    tests: [
      {
        name: "API responses are untouched and login stays protected",
        isHidden: false,
        source: `var b = require("src/web/headers").buildHeaders;
var api = b("/api/statuses/update", "application/json");
assert.equal(api["X-Frame-Options"], undefined);
assert.equal(api["Content-Security-Policy"], "default-src 'none'");
assert.equal(b("/login", "text/html")["X-Frame-Options"], "DENY");`,
      },
      {
        name: "the tweet page cannot be framed",
        isHidden: false,
        source: `var h = require("src/web/headers").buildHeaders("/home", "text/html");
assert.equal(h["X-Frame-Options"], "DENY", "the tweet box must not render inside another site");
assert.equal(h["Content-Security-Policy"], "default-src 'self'; frame-ancestors 'none'");`,
      },
      {
        name: "a route without its own policy still gets frame-ancestors",
        isHidden: true,
        source: `var h = require("src/web/headers").buildHeaders("/settings", "text/html");
assert.equal(h["Content-Security-Policy"], "frame-ancestors 'none'");
assert.equal(h["X-Frame-Options"], "DENY");`,
      },
      {
        name: "unknown HTML paths are protected too",
        isHidden: true,
        source: `var h = require("src/web/headers").buildHeaders("/biz/status/1234", "text/html; charset=utf-8");
assert.equal(h["X-Frame-Options"], "DENY");
assert.equal(h["Content-Security-Policy"], "frame-ancestors 'none'");
assert.equal(h["Content-Type"], "text/html; charset=utf-8");`,
      },
      {
        name: "an existing policy keeps its directives",
        isHidden: true,
        source: `var h = require("src/web/headers").buildHeaders("/login", "text/html");
assert.equal(h["Content-Security-Policy"], "default-src 'self'; form-action 'self'; frame-ancestors 'none'");`,
      },
    ],
    fixedFiles: {
      "src/web/headers.js": `var routes = require("./routes");

exports.buildHeaders = function (path, contentType) {
  var h = { "Content-Type": contentType };
  var route = routes.ROUTES[path] || {};
  if (route.csp) h["Content-Security-Policy"] = route.csp;
  // Frame protection is a property of every HTML page, not of a list of
  // "sensitive" ones: the page nobody listed (the tweet box) is the one that
  // got framed. Send both the legacy header and the CSP directive.
  if (String(contentType).indexOf("text/html") === 0) {
    h["X-Frame-Options"] = "DENY";
    h["Content-Security-Policy"] = route.csp ? route.csp + "; frame-ancestors 'none'" : "frame-ancestors 'none'";
  }
  return h;
};
`,
    },
  },

  {
    title: "The Seventy-Two Byte Password",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "Caching"],
    description: `Modelled on **Okta's October 2024 advisory**: Okta generated the cache key for AD/LDAP delegated authentication by running bcrypt over the user id, username and password joined together. bcrypt only reads the first 72 bytes of its input, so for usernames of 52 characters or more the password fell partly or wholly past that limit — and under certain conditions a login with any password could match a previously cached key. Okta switched the key generation to PBKDF2.

This project is a reconstruction. \`bcrypt.js\` (locked) truncates to 72 UTF-8 bytes exactly like the real thing. \`cache.js\` builds its key from the concatenated fields.

Fix \`cacheKey\` and \`matches\` so the key depends on every byte of all three fields.`,
    bugReport: `**BUG-OKTA-1030** · Priority: Critical (auth bypass) · Reported by: security

cacheKey(userId, username, password) returns a bcrypt hash (bcrypt.hash
output) and matches(stored, userId, username, password) says whether the
triple produced that key. Requirements:
- the key must depend on every byte of userId, username and password,
  however long they are and whatever characters they use (length limits are
  in UTF-8 bytes, so a 31-character name of "é" is 62 bytes)
- triples that differ in any field never share a key, including splits of
  the same text, e.g. ("u1", "ab", "c") vs ("u1", "a", "bc")
- matches(cacheKey(a, b, c), a, b, c) is true

digest.sha256hex(text) returns a fixed-length 64-character digest of all of
its input.

Observed: for a 63-character username, a cached key matches any password.`,
    logs: `[ad-agent] unreachable; using delegated-auth cache
[auth] user 00u1abcdef login ok (cache hit) password_len=5
[auth] user 00u1abcdef login ok (cache hit) password_len=19`,
    files: [
      {
        filePath: "src/auth/cache.js",
        isEditable: true,
        language: "javascript",
        content: `var bcrypt = require("./bcrypt");

// Cache key for delegated (AD/LDAP) authentication, consulted when the
// directory agent cannot be reached.
function material(userId, username, password) {
  return userId + username + password;
}

exports.cacheKey = function (userId, username, password) {
  return bcrypt.hash(material(userId, username, password));
};

exports.matches = function (stored, userId, username, password) {
  return bcrypt.compare(material(userId, username, password), stored);
};
`,
      },
      {
        filePath: "src/auth/bcrypt.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Stand-in for bcrypt with the one property that matters here: bcrypt reads
only the first 72 BYTES of its input (UTF-8). Anything after byte 72 has no
effect on the hash.
*/
function fnv(bytes, seed) {
  var h = seed >>> 0;
  for (var i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ("00000000" + h.toString(16)).slice(-8);
}
exports.fnv = fnv;
exports.MAX_BYTES = 72;

exports.hash = function (input) {
  var bytes = Buffer.from(String(input), "utf8").slice(0, exports.MAX_BYTES);
  return "$2b$12$" + fnv(bytes, 2166136261) + fnv(bytes, 33554467);
};

exports.compare = function (input, hashed) {
  return exports.hash(input) === hashed;
};
`,
      },
      {
        filePath: "src/auth/digest.js",
        isEditable: false,
        language: "javascript",
        content: `var fnv = require("./bcrypt").fnv;

/*
Stand-in for SHA-256: a fixed 64-character hex digest over EVERY byte of its
input, however long.
*/
exports.sha256hex = function (input) {
  var bytes = Buffer.from(String(input), "utf8");
  var out = "";
  for (var k = 0; k < 8; k++) out += fnv(bytes, 2166136261 + k * 7919);
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "an ordinary account caches and checks its key",
        isHidden: false,
        source: `var c = require("src/auth/cache");
var key = c.cacheKey("00u1abcdef", "kai", "hunter2");
assert.equal(c.matches(key, "00u1abcdef", "kai", "hunter2"), true);
assert.equal(c.matches(key, "00u1abcdef", "kai", "hunter3"), false);`,
      },
      {
        name: "a long username does not make the password optional",
        isHidden: false,
        source: `var c = require("src/auth/cache");
var user = "x".repeat(50) + "@corp.example";
var key = c.cacheKey("00u1abcdef", user, "correct horse");
assert.equal(c.matches(key, "00u1abcdef", user, "correct horse"), true);
assert.equal(c.matches(key, "00u1abcdef", user, "wrong"), false, "the password must count");`,
      },
      {
        name: "the limit is in bytes, not characters",
        isHidden: true,
        source: `var c = require("src/auth/cache");
var user = "\\u00e9".repeat(31);
var key = c.cacheKey("00u1abcdef", user, "pw-one");
assert.equal(c.matches(key, "00u1abcdef", user, "pw-two"), false);`,
      },
      {
        name: "field boundaries are part of the key",
        isHidden: true,
        source: `var c = require("src/auth/cache");
assert.ok(c.cacheKey("u1", "ab", "c") !== c.cacheKey("u1", "a", "bc"), "different splits, different keys");`,
      },
      {
        name: "the key is still a bcrypt hash",
        isHidden: true,
        source: `var c = require("src/auth/cache");
var key = c.cacheKey("00u2", "y".repeat(80), "pw");
assert.equal(key.slice(0, 7), "$2b$12$");
assert.equal(c.matches(key, "00u2", "y".repeat(80), "pw"), true);
assert.equal(c.matches(key, "00u2", "y".repeat(80), "pX"), false);`,
      },
    ],
    fixedFiles: {
      "src/auth/cache.js": `var bcrypt = require("./bcrypt");
var digest = require("./digest");

// Cache key for delegated (AD/LDAP) authentication, consulted when the
// directory agent cannot be reached.
function material(userId, username, password) {
  // bcrypt ignores everything past 72 bytes, so a long username pushed the
  // password out of the hash entirely. Pre-hash the fields into a fixed
  // 64-character digest (well under the limit) so every byte counts, and
  // encode them as a JSON array so ("ab", "c") and ("a", "bc") differ.
  return digest.sha256hex(JSON.stringify([userId, username, password]));
}

exports.cacheKey = function (userId, username, password) {
  return bcrypt.hash(material(userId, username, password));
};

exports.matches = function (stored, userId, username, password) {
  return bcrypt.compare(material(userId, username, password), stored);
};
`,
    },
  },

  {
    title: "The Dividend Paid in Ghost Shares",
    difficulty: "easy",
    category: "database",
    language: "javascript",
    tags: ["Money", "Validation"],
    description: `Modelled on **Samsung Securities' "ghost shares"** (April 2018): an employee paying the dividend to the employee stock ownership plan entered 1,000 *shares* per share instead of 1,000 *won* per share. The system credited about 2.8 billion shares that did not exist — many times the company's actual share count — and some employees sold millions of them before the error was contained.

This project is a reconstruction. \`payout.js\` will pay a dividend in either unit and never asks whether the shares it credits exist.

Fix \`applyDividend\` so it validates the instruction and can never credit shares beyond those issued.`,
    bugReport: `**BUG-SS-0406** · Priority: Critical · Reported by: settlement

applyDividend(ledger, { amount, unit }):
- amount must be a positive integer and unit "KRW" or "SHARES"; otherwise
  throw and change nothing
- "KRW": every account's cash += shares * amount
- "SHARES": every account's shares += shares * amount — but only if the total
  shares held across all accounts afterwards is <= ledger.sharesIssued;
  otherwise throw and change NOTHING (no partial credit)
- returns { unit, total } where total is the sum credited across accounts

Observed: an instruction of 1,000 SHARES was accepted and credited 150,000
shares against 1,000 issued.`,
    logs: `[esop] dividend unit=SHARES amount=1000 accounts=2 credited=150000
[settlement] holdings 150150 exceed shares issued 1000
[trading] sell orders placed from ESOP accounts against credited shares`,
    files: [
      {
        filePath: "src/esop/payout.js",
        isEditable: true,
        language: "javascript",
        content: `// Pays the ESOP dividend. instruction: { amount, unit: "KRW" | "SHARES" }.
exports.applyDividend = function (ledger, instruction) {
  var total = 0;
  for (var i = 0; i < ledger.accounts.length; i++) {
    var acct = ledger.accounts[i];
    var credit = acct.shares * instruction.amount;
    if (instruction.unit === "SHARES") acct.shares += credit;
    else acct.cash += credit;
    total += credit;
  }
  return { unit: instruction.unit, total: total };
};
`,
      },
      {
        filePath: "src/esop/ledger.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The ESOP ledger. sharesIssued is how many shares exist; the accounts can
never hold more than that between them.
*/
exports.sample = function (sharesIssued) {
  return {
    sharesIssued: sharesIssued === undefined ? 1000 : sharesIssued,
    accounts: [
      { id: "e1", shares: 100, cash: 0 },
      { id: "e2", shares: 50, cash: 0 }
    ]
  };
};
`,
      },
    ],
    tests: [
      {
        name: "a cash dividend is paid per share held",
        isHidden: false,
        source: `var p = require("src/esop/payout");
var l = require("src/esop/ledger").sample();
assert.equal(p.applyDividend(l, { amount: 1000, unit: "KRW" }), { unit: "KRW", total: 150000 });
assert.equal(l.accounts, [{ id: "e1", shares: 100, cash: 100000 }, { id: "e2", shares: 50, cash: 50000 }]);`,
      },
      {
        name: "1,000 shares per share is refused",
        isHidden: false,
        source: `var p = require("src/esop/payout");
var l = require("src/esop/ledger").sample();
assert.throws(function () { p.applyDividend(l, { amount: 1000, unit: "SHARES" }); }, "those shares do not exist");
assert.equal(l, require("src/esop/ledger").sample(), "nothing may change");`,
      },
      {
        name: "a small stock dividend within the issued count is allowed",
        isHidden: true,
        source: `var p = require("src/esop/payout");
var l = require("src/esop/ledger").sample();
assert.equal(p.applyDividend(l, { amount: 1, unit: "SHARES" }), { unit: "SHARES", total: 150 });
assert.equal(l.accounts, [{ id: "e1", shares: 200, cash: 0 }, { id: "e2", shares: 100, cash: 0 }]);`,
      },
      {
        name: "one share over the issued count is refused",
        isHidden: true,
        source: `var p = require("src/esop/payout");
var l = require("src/esop/ledger").sample(299);
assert.throws(function () { p.applyDividend(l, { amount: 1, unit: "SHARES" }); });
assert.equal(l, require("src/esop/ledger").sample(299));`,
      },
      {
        name: "malformed instructions are refused",
        isHidden: true,
        source: `var p = require("src/esop/payout");
var l = require("src/esop/ledger").sample();
assert.throws(function () { p.applyDividend(l, { amount: 0, unit: "KRW" }); }, "zero");
assert.throws(function () { p.applyDividend(l, { amount: -5, unit: "KRW" }); }, "negative");
assert.throws(function () { p.applyDividend(l, { amount: 1.5, unit: "KRW" }); }, "fractional");
assert.throws(function () { p.applyDividend(l, { amount: 1000, unit: "USD" }); }, "unknown unit");
assert.equal(l, require("src/esop/ledger").sample());`,
      },
    ],
    fixedFiles: {
      "src/esop/payout.js": `// Pays the ESOP dividend. instruction: { amount, unit: "KRW" | "SHARES" }.
exports.applyDividend = function (ledger, instruction) {
  var amount = instruction.amount;
  var unit = instruction.unit;
  if (typeof amount !== "number" || !isFinite(amount) || amount <= 0 || Math.floor(amount) !== amount) {
    throw new Error("amount must be a positive integer");
  }
  if (unit !== "KRW" && unit !== "SHARES") throw new Error("unknown unit " + unit);
  var i;
  var total = 0;
  var held = 0;
  for (i = 0; i < ledger.accounts.length; i++) {
    total += ledger.accounts[i].shares * amount;
    held += ledger.accounts[i].shares;
  }
  // Shares cannot be conjured by a keystroke: validate the whole payout
  // against the issued count BEFORE touching any account, so a wrong unit
  // is refused outright instead of minting shares that do not exist.
  if (unit === "SHARES" && held + total > ledger.sharesIssued) {
    throw new Error("payout would exceed shares issued");
  }
  for (i = 0; i < ledger.accounts.length; i++) {
    var acct = ledger.accounts[i];
    var credit = acct.shares * amount;
    if (unit === "SHARES") acct.shares += credit;
    else acct.cash += credit;
  }
  return { unit: unit, total: total };
};
`,
    },
  },

  {
    title: "The Check That Hadn't Cleared",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Money", "Validation"],
    description: `Modelled on the **JPMorgan Chase "infinite money glitch"** (August–September 2024): videos spread on social media showing people depositing checks — often bad ones, or checks written to themselves — and withdrawing the money before the checks bounced. Chase called it check fraud, closed the gap, and later sued some customers to recover the funds.

This project is a reconstruction of the underlying mistake: \`availability.js\` counts a deposited check as spendable the moment it is deposited, whether or not it has cleared.

Fix \`availableBalance\` so uncleared deposits are available only up to the policy's immediate amount.`,
    bugReport: `**BUG-JPM-0902** · Priority: Critical · Reported by: fraud operations

account.entries holds { type: "deposit", amount, status } (status "cleared",
"pending" or "returned") and { type: "withdrawal", amount }.

availableBalance(account) =
    sum of CLEARED deposits
  - sum of withdrawals
  + min(policy.IMMEDIATE_LIMIT, sum of PENDING deposits)
Returned deposits count for nothing. The immediate amount is one allowance
across all pending deposits, not one per check.

withdraw(account, amount) succeeds (records a withdrawal, returns true) only
if 0 < amount <= availableBalance(account); otherwise returns false and
records nothing.

Observed: a $10,000 check deposited a minute ago can be withdrawn in full.`,
    logs: `[atm 0931] acct ****5521 deposit check 10000.00 status=pending
[atm 0931] acct ****5521 withdraw 9800.00 approved (available 10100.00)
[returns] check 0048 returned: NSF`,
    files: [
      {
        filePath: "src/bank/availability.js",
        isEditable: true,
        language: "javascript",
        content: `var policy = require("./policy");

exports.availableBalance = function (account) {
  var total = 0;
  for (var i = 0; i < account.entries.length; i++) {
    var e = account.entries[i];
    if (e.type === "deposit") {
      if (e.status !== "returned") total += e.amount;
    } else {
      total -= e.amount;
    }
  }
  return total;
};

exports.withdraw = function (account, amount) {
  if (!(amount > 0) || amount > exports.availableBalance(account)) return false;
  account.entries.push({ type: "withdrawal", amount: amount });
  return true;
};
`,
      },
      {
        filePath: "src/bank/policy.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Funds availability policy. Deposits that have not cleared are held, except
for an immediate allowance of IMMEDIATE_LIMIT dollars in total, which is
released at once to keep ordinary customers whole.
*/
exports.IMMEDIATE_LIMIT = 225;
`,
      },
    ],
    tests: [
      {
        name: "cleared money is available",
        isHidden: false,
        source: `var a = require("src/bank/availability");
var acct = { entries: [{ type: "deposit", amount: 500, status: "cleared" }, { type: "withdrawal", amount: 200 }] };
assert.equal(a.availableBalance(acct), 300);
assert.equal(a.withdraw(acct, 300), true);
assert.equal(a.availableBalance(acct), 0);`,
      },
      {
        name: "a large uncleared check is mostly held",
        isHidden: false,
        source: `var a = require("src/bank/availability");
var acct = { entries: [{ type: "deposit", amount: 100, status: "cleared" }, { type: "deposit", amount: 10000, status: "pending" }] };
assert.equal(a.availableBalance(acct), 325, "100 cleared + 225 immediate");
assert.equal(a.withdraw(acct, 5000), false);`,
      },
      {
        name: "a small pending deposit is fully available",
        isHidden: true,
        source: `var a = require("src/bank/availability");
var acct = { entries: [{ type: "deposit", amount: 150, status: "pending" }] };
assert.equal(a.availableBalance(acct), 150);`,
      },
      {
        name: "the immediate allowance is shared by all pending checks",
        isHidden: true,
        source: `var a = require("src/bank/availability");
var acct = { entries: [{ type: "deposit", amount: 200, status: "pending" }, { type: "deposit", amount: 200, status: "pending" }] };
assert.equal(a.availableBalance(acct), 225);`,
      },
      {
        name: "returned checks count for nothing",
        isHidden: true,
        source: `var a = require("src/bank/availability");
var acct = { entries: [
  { type: "deposit", amount: 50, status: "cleared" },
  { type: "deposit", amount: 900, status: "returned" },
  { type: "deposit", amount: 300, status: "pending" }
] };
assert.equal(a.availableBalance(acct), 275);`,
      },
      {
        name: "withdrawals stop exactly at the available amount",
        isHidden: true,
        source: `var a = require("src/bank/availability");
var acct = { entries: [{ type: "deposit", amount: 100, status: "cleared" }, { type: "deposit", amount: 1000, status: "pending" }] };
assert.equal(a.withdraw(acct, 326), false);
assert.equal(a.withdraw(acct, 325), true);
assert.equal(a.availableBalance(acct), 0);
assert.equal(acct.entries.length, 3);`,
      },
    ],
    fixedFiles: {
      "src/bank/availability.js": `var policy = require("./policy");

exports.availableBalance = function (account) {
  var cleared = 0;
  var pending = 0;
  for (var i = 0; i < account.entries.length; i++) {
    var e = account.entries[i];
    if (e.type === "deposit") {
      if (e.status === "cleared") cleared += e.amount;
      else if (e.status === "pending") pending += e.amount;
    } else {
      cleared -= e.amount;
    }
  }
  // A deposited check is a promise, not money. Until it clears, only the
  // policy's single immediate allowance may be spent against it — releasing
  // the whole amount let people withdraw checks that later bounced.
  return cleared + Math.min(policy.IMMEDIATE_LIMIT, pending);
};

exports.withdraw = function (account, amount) {
  if (!(amount > 0) || amount > exports.availableBalance(account)) return false;
  account.entries.push({ type: "withdrawal", amount: amount });
  return true;
};
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE17_ORIGINS: Record<string, string> = {
  "The Freelist That Ate the Raft Log": "Roblox · 2021",
  "The Gift Card Paid Twice": "Starbucks · 2015",
  "The Consumer Key That Opened Enterprise Mail": "Microsoft · Storm-0558 (2023)",
  "The Deposit From Address Zero": "Qubit Finance · 2022",
  "The Invariant Off by a Hundred": "Uranium Finance · 2021",
  "The Meters That Thought It Was 1920": "NYC parking meters · 2020",
  "Priority Inversion on Mars": "NASA Mars Pathfinder · 1997",
  "The Final Invitation That Never Came": "NHS England · 2018",
  "The Backup That Always Said Yes": "Pixar · 1998",
  "The Group Chat Nobody Approved": "Facebook Messenger Kids · 2019",
  "The Edge of the Far Lands": "Minecraft · Far Lands",
  "The Invisible Tweet Button": "Twitter · 2009",
  "The Seventy-Two Byte Password": "Okta · 2024",
  "The Dividend Paid in Ghost Shares": "Samsung Securities · 2018",
  "The Check That Hadn't Cleared": "JPMorgan Chase · 2024",
};
