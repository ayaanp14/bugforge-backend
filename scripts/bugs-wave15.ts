/**
 * Wave 15 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE15: BugSpec[] = [

  {
    title: "The Drain Order That Matched Too Much",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Config", "Networking"],
    description: `Modelled on **Google's network outage of 2 June 2019**: a configuration change intended for a small number of servers in a single region was applied to a larger set of servers across several neighbouring regions. The maintenance automation then descheduled the network control plane jobs on all of them, those regions lost a large share of their network capacity, and Google Cloud, YouTube and Gmail were degraded for hours.

This project is a reconstruction. \`drain.js\` picks the servers a maintenance order applies to and deschedules their jobs — but it selects on the job tag alone, so an order written for one cluster reaches every server that carries the tag, anywhere.

Fix \`selectTargets\` so an order only ever reaches the exact region and clusters it names.`,
    bugReport: `**BUG-NETCTL-0602** · Priority: P0 · Reported by: SRE on-call

selectTargets(fleet, scope) — scope is { tag, region, clusters: [...] }.
A server is a target only when ALL of these hold:
- its tags include scope.tag
- its region is exactly scope.region (no prefix or family matching:
  "us-east" does not mean "us-east1")
- its cluster is one of scope.clusters (an empty list selects nothing)
Targets are returned as server names in fleet order.

deschedule(fleet, scope) empties the jobs of every target and returns how many
jobs it stopped. Servers that are not targets keep their jobs.

Observed: an order scoped to us-east1-a descheduled the network control jobs
in us-east1-b, us-east4 and us-central1 as well.`,
    logs: `[maint] order MO-4471 scope=us-east1/[us-east1-a] tag=netctl
[maint] descheduling netctl on 5 servers: ue1a-01 ue1a-02 ue1b-01 ue4a-01 uc1a-01
[netmon] us-east4: control plane jobs 0/1 running, capacity withdrawn`,
    files: [
      {
        filePath: "src/ops/drain.js",
        isEditable: true,
        language: "javascript",
        content: `// Maintenance orders: pick the servers an order applies to, then stop their jobs.

// scope: { tag, region, clusters: [...] }
exports.selectTargets = function (fleet, scope) {
  var out = [];
  for (var i = 0; i < fleet.length; i++) {
    var server = fleet[i];
    if (server.tags.indexOf(scope.tag) !== -1) out.push(server.name);
  }
  return out;
};

exports.deschedule = function (fleet, scope) {
  var targets = exports.selectTargets(fleet, scope);
  var stopped = 0;
  for (var i = 0; i < fleet.length; i++) {
    if (targets.indexOf(fleet[i].name) !== -1) {
      stopped += fleet[i].jobs.length;
      fleet[i].jobs = [];
    }
  }
  return stopped;
};
`,
      },
      {
        filePath: "src/ops/fleet.js",
        isEditable: false,
        language: "javascript",
        content: `// A small slice of the fleet inventory, as the maintenance tool sees it.
exports.build = function () {
  return [
    { name: "ue1a-01", region: "us-east1", cluster: "us-east1-a", tags: ["netctl"], jobs: ["nc-1", "nc-2"] },
    { name: "ue1a-02", region: "us-east1", cluster: "us-east1-a", tags: ["netctl"], jobs: ["nc-3"] },
    { name: "ue1a-03", region: "us-east1", cluster: "us-east1-a", tags: ["web"], jobs: ["web-1"] },
    { name: "ue1b-01", region: "us-east1", cluster: "us-east1-b", tags: ["netctl"], jobs: ["nc-4"] },
    { name: "ue4a-01", region: "us-east4", cluster: "us-east4-a", tags: ["netctl"], jobs: ["nc-5"] },
    { name: "uc1a-01", region: "us-central1", cluster: "us-central1-a", tags: ["netctl"], jobs: ["nc-6"] }
  ];
};
`,
      },
      {
        filePath: "src/ops/RUNBOOK.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Maintenance orders are written by humans for a specific place. The tag says
WHAT to stop; the region and cluster list say WHERE. An order must never reach
further than the place it names — a selector that errs should select less,
not more.
*/
`,
      },
    ],
    tests: [
      {
        name: "an order for a whole region's clusters selects them",
        isHidden: false,
        source: `var d = require("src/ops/drain");
var fleet = require("src/ops/fleet").build().filter(function (s) { return s.region === "us-east1"; });
assert.equal(d.selectTargets(fleet, { tag: "netctl", region: "us-east1", clusters: ["us-east1-a", "us-east1-b"] }), ["ue1a-01", "ue1a-02", "ue1b-01"]);`,
      },
      {
        name: "an order for one cluster stays in that cluster",
        isHidden: false,
        source: `var d = require("src/ops/drain");
var fleet = require("src/ops/fleet").build();
assert.equal(d.selectTargets(fleet, { tag: "netctl", region: "us-east1", clusters: ["us-east1-a"] }), ["ue1a-01", "ue1a-02"], "other clusters and regions must not be touched");`,
      },
      {
        name: "deschedule stops only the targets' jobs",
        isHidden: true,
        source: `var d = require("src/ops/drain");
var fleet = require("src/ops/fleet").build();
assert.equal(d.deschedule(fleet, { tag: "netctl", region: "us-east1", clusters: ["us-east1-a"] }), 3);
assert.equal(fleet.map(function (s) { return s.jobs.length; }), [0, 0, 1, 1, 1, 1]);`,
      },
      {
        name: "an empty cluster list selects nothing",
        isHidden: true,
        source: `var d = require("src/ops/drain");
var fleet = require("src/ops/fleet").build();
assert.equal(d.selectTargets(fleet, { tag: "netctl", region: "us-east1", clusters: [] }), []);`,
      },
      {
        name: "regions match exactly, not by prefix",
        isHidden: true,
        source: `var d = require("src/ops/drain");
var fleet = require("src/ops/fleet").build();
assert.equal(d.selectTargets(fleet, { tag: "netctl", region: "us-east", clusters: ["us-east1-a", "us-east4-a"] }), []);
assert.equal(d.selectTargets(fleet, { tag: "netctl", region: "us-east4", clusters: ["us-east1-a", "us-east4-a"] }), ["ue4a-01"]);`,
      },
    ],
    fixedFiles: {
      "src/ops/drain.js": `// Maintenance orders: pick the servers an order applies to, then stop their jobs.

// scope: { tag, region, clusters: [...] }
exports.selectTargets = function (fleet, scope) {
  var clusters = scope.clusters || [];
  var out = [];
  for (var i = 0; i < fleet.length; i++) {
    var server = fleet[i];
    // The tag alone matched every control-plane server in every region. An
    // order reaches only the exact region and the clusters it lists; an empty
    // list means nothing, never everything.
    if (server.tags.indexOf(scope.tag) === -1) continue;
    if (server.region !== scope.region) continue;
    if (clusters.indexOf(server.cluster) === -1) continue;
    out.push(server.name);
  }
  return out;
};

exports.deschedule = function (fleet, scope) {
  var targets = exports.selectTargets(fleet, scope);
  var stopped = 0;
  for (var i = 0; i < fleet.length; i++) {
    if (targets.indexOf(fleet[i].name) !== -1) {
      stopped += fleet[i].jobs.length;
      fleet[i].jobs = [];
    }
  }
  return stopped;
};
`,
    },
  },

  {
    title: "The Class Path Nobody Denied",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["Security", "Validation"],
    description: `Modelled on **Spring4Shell** (CVE-2022-22965, March 2022): Spring MVC's data binding let request parameters walk a property path from the form object into \`class.module.classLoader…\`. An older fix had blocked the path \`class.classLoader\`, but on JDK 9+ the class loader was also reachable through the new \`module\` property, and on some Tomcat deployments that was enough for remote code execution.

This project is a reconstruction without reflection: the form object is a tree of maps, and every object exposes a \`class\` entry just as every Java bean exposes \`getClass()\`; the JDK 9 route is the \`jdkModule\` entry and the class loader is \`loader\`. \`DataBinder.bind\` walks the dotted path and sets the leaf — guarded by a denylist of one exact prefix.

Fix \`bind\` so no property path can ever travel through \`class\`.`,
    bugReport: `**BUG-S4S** · Priority: Critical · Reported by: security

DataBinder.bind(target, path, value) walks a dotted path through nested maps
and sets the leaf, returning true when it bound and false when it refused.
- a path is refused (false, nothing changed) if ANY of its segments is
  "class", compared case-insensitively — wherever it appears in the path
- a path is refused if an intermediate segment is missing or is not a map
- a path is refused if the leaf does not already exist or is itself a map
  (binding only sets existing simple properties)
- otherwise the leaf is set to value and bind returns true

Observed: class.loader.* is refused, but
class.jdkModule.loader.logConfig.pattern binds and rewrites the container's
logging pattern.`,
    logs: `[binder] refused class.loader.logConfig.pattern
[binder] bound class.jdkModule.loader.logConfig.pattern = "<attacker text>"`,
    files: [
      {
        filePath: "src/web/DataBinder.java",
        isEditable: true,
        language: "java",
        content: `class DataBinder {
    @SuppressWarnings("unchecked")
    static boolean bind(Map<String, Object> target, String path, String value) {
        if (path.toLowerCase().startsWith("class.loader")) return false;
        String[] segs = path.split("\\\\.");
        Map<String, Object> node = target;
        for (int i = 0; i < segs.length - 1; i++) {
            Object next = node.get(segs[i]);
            if (!(next instanceof Map)) return false;
            node = (Map<String, Object>) next;
        }
        String leaf = segs[segs.length - 1];
        if (!node.containsKey(leaf) || node.get(leaf) instanceof Map) return false;
        node.put(leaf, value);
        return true;
    }
}
`,
      },
      {
        filePath: "src/web/FormObject.java",
        isEditable: false,
        language: "java",
        content: `class FormObject {
    // A signup form as the binder sees it. Like every Java object it exposes
    // "class", and through it the class loader (directly on old JDKs, and via
    // "jdkModule" on JDK 9+).
    static Map<String, Object> newForm() {
        Map<String, Object> logConfig = new LinkedHashMap<>();
        logConfig.put("pattern", "combined");
        Map<String, Object> loader = new LinkedHashMap<>();
        loader.put("logConfig", logConfig);
        Map<String, Object> jdkModule = new LinkedHashMap<>();
        jdkModule.put("loader", loader);
        Map<String, Object> clazz = new LinkedHashMap<>();
        clazz.put("jdkModule", jdkModule);
        clazz.put("loader", loader);
        Map<String, Object> address = new LinkedHashMap<>();
        address.put("city", "");
        Map<String, Object> form = new LinkedHashMap<>();
        form.put("name", "");
        form.put("address", address);
        form.put("class", clazz);
        return form;
    }

    @SuppressWarnings("unchecked")
    static Object read(Map<String, Object> root, String path) {
        Object node = root;
        for (String seg : path.split("\\\\.")) {
            if (!(node instanceof Map)) return null;
            node = ((Map<String, Object>) node).get(seg);
        }
        return node;
    }
}
`,
      },
    ],
    tests: [
      {
        name: "a plain property binds",
        isHidden: false,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "name", "Ada"), true);
                BugAssert.equal(FormObject.read(form, "name"), "Ada");`,
      },
      {
        name: "the route through the module property is refused",
        isHidden: false,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "class.jdkModule.loader.logConfig.pattern", "x"), false, "no path may travel through class");
                BugAssert.equal(FormObject.read(form, "class.jdkModule.loader.logConfig.pattern"), "combined", "the pattern must be untouched");`,
      },
      {
        name: "the old direct route stays refused",
        isHidden: false,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "class.loader.logConfig.pattern", "x"), false);
                BugAssert.equal(FormObject.read(form, "class.loader.logConfig.pattern"), "combined");`,
      },
      {
        name: "nested simple properties bind",
        isHidden: true,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "address.city", "Pune"), true);
                BugAssert.equal(FormObject.read(form, "address.city"), "Pune");`,
      },
      {
        name: "any class segment is refused, whatever its case",
        isHidden: true,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "class.jdkModule", "x"), false);
                form.put("CLASS", form.get("class"));
                BugAssert.equal(DataBinder.bind(form, "CLASS.jdkModule.loader.logConfig.pattern", "x"), false);
                BugAssert.equal(FormObject.read(form, "class.jdkModule.loader.logConfig.pattern"), "combined");`,
      },
      {
        name: "unknown and non-map paths are refused",
        isHidden: true,
        source: `                Map<String, Object> form = FormObject.newForm();
                BugAssert.equal(DataBinder.bind(form, "address.zip", "411001"), false);
                BugAssert.equal(DataBinder.bind(form, "name.first", "Ada"), false);
                BugAssert.equal(DataBinder.bind(form, "address", "x"), false);`,
      },
    ],
    fixedFiles: {
      "src/web/DataBinder.java": `class DataBinder {
    @SuppressWarnings("unchecked")
    static boolean bind(Map<String, Object> target, String path, String value) {
        String[] segs = path.split("\\\\.");
        // A prefix denylist only blocks the one route someone thought of; JDK 9
        // added a second route through the module. Refuse "class" anywhere in the path.
        for (String seg : segs) {
            if (seg.equalsIgnoreCase("class")) return false;
        }
        Map<String, Object> node = target;
        for (int i = 0; i < segs.length - 1; i++) {
            Object next = node.get(segs[i]);
            if (!(next instanceof Map)) return false;
            node = (Map<String, Object>) next;
        }
        String leaf = segs[segs.length - 1];
        if (!node.containsKey(leaf) || node.get(leaf) instanceof Map) return false;
        node.put(leaf, value);
        return true;
    }
}
`,
    },
  },

  {
    title: "The Key That Joined the Wrong Repository",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Validation"],
    description: `Modelled on **GitHub, March 2012**: Egor Homakov showed that a Rails *mass assignment* weakness let him submit an extra attribute in a public-key update form and attach his SSH key to the Rails organisation, then pushed a commit to the rails/rails repository to prove it. GitHub patched the endpoint the same day, and the incident pushed Rails towards strong parameters.

This project is a reconstruction. \`update.js\` edits an SSH key record by copying **every** submitted field onto it — including the field that says who owns it.

Fix \`updateKey\` so only the fields a user may edit are applied.`,
    bugReport: `**BUG-MASSASSIGN** · Priority: Critical · Reported by: a user, publicly

updateKey(store, currentUser, keyId, params):
- returns null (and changes nothing) when the key does not exist or is not
  owned by currentUser
- otherwise applies ONLY params.title and params.key when present — every
  other submitted field (ownerId, id, anything unknown) is ignored and never
  added to the record — and returns the record

Observed: a request carrying ownerId moved a key to another account.`,
    logs: `[keys] PUT /keys/1 params={"title":"laptop","ownerId":"rails"} by egor
[keys] key 1 owner egor -> rails`,
    files: [
      {
        filePath: "src/keys/update.js",
        isEditable: true,
        language: "javascript",
        content: `// PUT /keys/:id — edit an SSH key the caller owns.
exports.updateKey = function (store, currentUser, keyId, params) {
  var record = store.find(keyId);
  if (!record || record.ownerId !== currentUser) return null;
  Object.keys(params).forEach(function (field) {
    record[field] = params[field];
  });
  return record;
};
`,
      },
      {
        filePath: "src/keys/store.js",
        isEditable: false,
        language: "javascript",
        content: `exports.create = function () {
  var keys = [
    { id: 1, title: "laptop", key: "ssh-ed25519 AAAA1", ownerId: "egor" },
    { id: 2, title: "deploy", key: "ssh-rsa BBBB2", ownerId: "rails" }
  ];
  return {
    keys: keys,
    find: function (id) {
      for (var i = 0; i < keys.length; i++) if (keys[i].id === id) return keys[i];
      return null;
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "the owner can rename a key",
        isHidden: false,
        source: `var u = require("src/keys/update");
var store = require("src/keys/store").create();
assert.equal(u.updateKey(store, "egor", 1, { title: "work laptop" }), { id: 1, title: "work laptop", key: "ssh-ed25519 AAAA1", ownerId: "egor" });`,
      },
      {
        name: "ownerId in the request is ignored",
        isHidden: false,
        source: `var u = require("src/keys/update");
var store = require("src/keys/store").create();
u.updateKey(store, "egor", 1, { title: "laptop", ownerId: "rails" });
assert.equal(store.find(1).ownerId, "egor", "a key's owner is not a form field");`,
      },
      {
        name: "someone else's key cannot be edited",
        isHidden: true,
        source: `var u = require("src/keys/update");
var store = require("src/keys/store").create();
assert.equal(u.updateKey(store, "egor", 2, { title: "mine now" }), null);
assert.equal(store.find(2).title, "deploy");
assert.equal(u.updateKey(store, "egor", 99, { title: "x" }), null);`,
      },
      {
        name: "unknown fields and the id are never applied",
        isHidden: true,
        source: `var u = require("src/keys/update");
var store = require("src/keys/store").create();
var r = u.updateKey(store, "egor", 1, { key: "ssh-ed25519 CCCC3", id: 2, admin: true });
assert.equal(r, { id: 1, title: "laptop", key: "ssh-ed25519 CCCC3", ownerId: "egor" });`,
      },
    ],
    fixedFiles: {
      "src/keys/update.js": `// PUT /keys/:id — edit an SSH key the caller owns.
// Copying every submitted field let a request set ownerId; only the fields a
// user may edit are applied, everything else in the body is ignored.
var PERMITTED = ["title", "key"];

exports.updateKey = function (store, currentUser, keyId, params) {
  var record = store.find(keyId);
  if (!record || record.ownerId !== currentUser) return null;
  PERMITTED.forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(params, field)) record[field] = params[field];
  });
  return record;
};
`,
    },
  },

  {
    title: "The Zero Root Everyone Trusted",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "State"],
    description: `Modelled on the **Nomad bridge exploit of 1 August 2022**: a routine upgrade initialised the bridge's trusted root to \`0x00\`. A message that has never been proven also maps to the default root \`0x00\`, so the check "is this message's root confirmed?" passed for *any* message. Once the first exploit transaction appeared, hundreds of copycats replayed it with their own addresses, and roughly $190 million was drained.

This project is a reconstruction. \`replica.js\` keeps confirmed roots, proven messages and processed messages; \`process\` looks up a message's root — defaulting to the zero root — and asks whether that root is acceptable.

Fix the replica so the zero root is never acceptable, however the contract was initialised.`,
    bugReport: `**BUG-NOMAD** · Priority: Critical · Reported by: incident response

- acceptableRoot(state, root, now) is true only when root is NOT the zero
  root, root has a confirmation time, and that time is <= now
- initialize(state, root) may be called with the zero root (the upgrade did
  exactly that) — it must not make any unproven message acceptable
- process(state, message, now) throws when the message was already processed,
  or when its proven root is missing or not acceptable; otherwise marks it
  processed and returns true

Observed: after the upgrade, process() accepted messages that were never
proven.`,
    logs: `[replica] initialize committedRoot=0x00
[replica] process msg=h:withdraw-100-to-0xbeef root=0x00 -> accepted
[replica] 300+ processed messages with no proof in the next hours`,
    files: [
      {
        filePath: "src/bridge/replica.js",
        isEditable: true,
        language: "javascript",
        content: `var c = require("./constants");

exports.create = function () {
  return { confirmAt: {}, messages: {}, processed: {} };
};

exports.initialize = function (state, committedRoot) {
  state.confirmAt[committedRoot] = 1;
};

exports.prove = function (state, message, root) {
  state.messages[c.hashMessage(message)] = root;
};

exports.acceptableRoot = function (state, root, now) {
  var t = state.confirmAt[root];
  if (!t) return false;
  return t <= now;
};

exports.process = function (state, message, now) {
  var h = c.hashMessage(message);
  if (state.processed[h]) throw new Error("already processed");
  var root = state.messages[h] || c.ZERO_ROOT;
  if (!exports.acceptableRoot(state, root, now)) throw new Error("not proven");
  state.processed[h] = true;
  return true;
};
`,
      },
      {
        filePath: "src/bridge/constants.js",
        isEditable: false,
        language: "javascript",
        content: `// In the contract, a mapping read for a key never written returns zero —
// the same value as ZERO_ROOT.
exports.ZERO_ROOT = "0x00";

exports.hashMessage = function (message) {
  return "h:" + message;
};
`,
      },
    ],
    tests: [
      {
        name: "a proven message under a confirmed root is processed",
        isHidden: false,
        source: `var r = require("src/bridge/replica");
var s = r.create();
r.initialize(s, "0xabc");
r.prove(s, "withdraw-5-to-alice", "0xabc");
assert.equal(r.process(s, "withdraw-5-to-alice", 10), true);`,
      },
      {
        name: "after a zero-root upgrade, unproven messages are rejected",
        isHidden: false,
        source: `var r = require("src/bridge/replica");
var s = r.create();
r.initialize(s, "0x00");
assert.throws(function () { r.process(s, "withdraw-100-to-mallory", 10); }, "a message nobody proved must never pass");
assert.equal(s.processed, {});`,
      },
      {
        name: "the zero root is never acceptable",
        isHidden: true,
        source: `var r = require("src/bridge/replica");
var s = r.create();
r.initialize(s, "0x00");
assert.equal(r.acceptableRoot(s, "0x00", 1000), false);
assert.equal(r.acceptableRoot(s, "0x99", 1000), false);`,
      },
      {
        name: "a processed message cannot be replayed",
        isHidden: true,
        source: `var r = require("src/bridge/replica");
var s = r.create();
r.initialize(s, "0xabc");
r.prove(s, "m1", "0xabc");
r.process(s, "m1", 10);
assert.throws(function () { r.process(s, "m1", 11); });`,
      },
      {
        name: "a root inside its waiting window is not yet acceptable",
        isHidden: true,
        source: `var r = require("src/bridge/replica");
var s = r.create();
s.confirmAt["0xdef"] = 500;
r.prove(s, "m2", "0xdef");
assert.throws(function () { r.process(s, "m2", 100); });
assert.equal(r.process(s, "m2", 500), true);`,
      },
    ],
    fixedFiles: {
      "src/bridge/replica.js": `var c = require("./constants");

exports.create = function () {
  return { confirmAt: {}, messages: {}, processed: {} };
};

exports.initialize = function (state, committedRoot) {
  state.confirmAt[committedRoot] = 1;
};

exports.prove = function (state, message, root) {
  state.messages[c.hashMessage(message)] = root;
};

exports.acceptableRoot = function (state, root, now) {
  // The zero root is what an unproven message looks up to. An upgrade that
  // "confirmed" it made every message acceptable, so it never is.
  if (!root || root === c.ZERO_ROOT) return false;
  var t = state.confirmAt[root];
  if (!t) return false;
  return t <= now;
};

exports.process = function (state, message, now) {
  var h = c.hashMessage(message);
  if (state.processed[h]) throw new Error("already processed");
  var root = state.messages[h];
  if (!root || !exports.acceptableRoot(state, root, now)) throw new Error("not proven");
  state.processed[h] = true;
  return true;
};
`,
    },
  },

  {
    title: "The Donation That Skipped the Health Check",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Money", "Validation"],
    description: `Modelled on the **Euler Finance exploit of 13 March 2023**: the lending protocol's \`donateToReserves\` function let an account give away its collateral without the account-health (liquidity) check that other balance-reducing actions performed. The attacker used leverage, donated enough to leave the account under-collateralised, then liquidated it from a second account at a discount, taking about $197 million. The funds were later returned.

This project is a reconstruction. In \`pool.js\`, \`withdraw\` refuses to leave an account unhealthy; \`donateToReserves\` reduces collateral just the same, with no such check.

Fix \`donateToReserves\` so it can never leave an account unhealthy.`,
    bugReport: `**BUG-EULER** · Priority: Critical · Reported by: protocol security

Every action that reduces an account's collateral follows one rule:
- amount must be > 0 and <= the account's collateral, else throw
- after the change the account must satisfy risk.isHealthy; if it would not,
  throw and leave the account AND the pool exactly as they were
donateToReserves(pool, id, amount) additionally adds amount to pool.reserves
when it succeeds, and returns the account.

Observed: donateToReserves lets an account push itself below the health
line, after which it can be liquidated at a profit.`,
    logs: `[pool] donate acct=0x5f amount=100000000 collateral->310000000 debt=390000000
[risk] acct=0x5f health=0.79 -> liquidatable`,
    files: [
      {
        filePath: "src/lending/pool.js",
        isEditable: true,
        language: "javascript",
        content: `var risk = require("./risk");

exports.create = function () {
  return { reserves: 0, accounts: {} };
};

exports.open = function (pool, id, collateral, debt) {
  pool.accounts[id] = { collateral: collateral, debt: debt };
  return pool.accounts[id];
};

exports.withdraw = function (pool, id, amount) {
  var acc = pool.accounts[id];
  if (amount <= 0 || amount > acc.collateral) throw new Error("bad amount");
  acc.collateral -= amount;
  if (!risk.isHealthy(acc)) {
    acc.collateral += amount;
    throw new Error("e/collateral-violation");
  }
  return acc;
};

exports.donateToReserves = function (pool, id, amount) {
  var acc = pool.accounts[id];
  if (amount <= 0 || amount > acc.collateral) throw new Error("bad amount");
  acc.collateral -= amount;
  pool.reserves += amount;
  return acc;
};
`,
      },
      {
        filePath: "src/lending/risk.js",
        isEditable: false,
        language: "javascript",
        content: `// Collateral counts at 75% of its value against debt.
exports.COLLATERAL_FACTOR_BPS = 7500;

exports.isHealthy = function (acc) {
  return acc.collateral * exports.COLLATERAL_FACTOR_BPS >= acc.debt * 10000;
};
`,
      },
    ],
    tests: [
      {
        name: "a donation that keeps the account healthy goes through",
        isHidden: false,
        source: `var p = require("src/lending/pool");
var pool = p.create();
p.open(pool, "a", 1000, 600);
assert.equal(p.donateToReserves(pool, "a", 100), { collateral: 900, debt: 600 });
assert.equal(pool.reserves, 100);`,
      },
      {
        name: "a donation that would leave the account unhealthy reverts",
        isHidden: false,
        source: `var p = require("src/lending/pool");
var pool = p.create();
p.open(pool, "a", 1000, 600);
assert.throws(function () { p.donateToReserves(pool, "a", 300); }, "donating into insolvency must fail");
assert.equal(pool.accounts.a, { collateral: 1000, debt: 600 });
assert.equal(pool.reserves, 0);`,
      },
      {
        name: "withdraw keeps its own health check",
        isHidden: true,
        source: `var p = require("src/lending/pool");
var pool = p.create();
p.open(pool, "a", 1000, 600);
assert.throws(function () { p.withdraw(pool, "a", 300); });
assert.equal(pool.accounts.a.collateral, 1000);`,
      },
      {
        name: "a donation that lands exactly on the line is allowed",
        isHidden: true,
        source: `var p = require("src/lending/pool");
var pool = p.create();
p.open(pool, "a", 1000, 600);
p.donateToReserves(pool, "a", 200);
assert.equal(pool.accounts.a.collateral, 800);
assert.equal(pool.reserves, 200);
assert.throws(function () { p.donateToReserves(pool, "a", 1); });
assert.equal(pool.reserves, 200);`,
      },
      {
        name: "a debt-free account may donate everything, but not more",
        isHidden: true,
        source: `var p = require("src/lending/pool");
var pool = p.create();
p.open(pool, "b", 50, 0);
assert.throws(function () { p.donateToReserves(pool, "b", 51); });
p.donateToReserves(pool, "b", 50);
assert.equal(pool.accounts.b.collateral, 0);
assert.equal(pool.reserves, 50);`,
      },
    ],
    fixedFiles: {
      "src/lending/pool.js": `var risk = require("./risk");

exports.create = function () {
  return { reserves: 0, accounts: {} };
};

exports.open = function (pool, id, collateral, debt) {
  pool.accounts[id] = { collateral: collateral, debt: debt };
  return pool.accounts[id];
};

exports.withdraw = function (pool, id, amount) {
  var acc = pool.accounts[id];
  if (amount <= 0 || amount > acc.collateral) throw new Error("bad amount");
  acc.collateral -= amount;
  if (!risk.isHealthy(acc)) {
    acc.collateral += amount;
    throw new Error("e/collateral-violation");
  }
  return acc;
};

exports.donateToReserves = function (pool, id, amount) {
  var acc = pool.accounts[id];
  if (amount <= 0 || amount > acc.collateral) throw new Error("bad amount");
  acc.collateral -= amount;
  // A donation reduces collateral exactly like a withdrawal does, so it owes
  // the same health check — without it an account could make itself
  // insolvent and be liquidated at a discount.
  if (!risk.isHealthy(acc)) {
    acc.collateral += amount;
    throw new Error("e/collateral-violation");
  }
  pool.reserves += amount;
  return acc;
};
`,
    },
  },

  {
    title: "The Week Number That Went Back to 1999",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Time", "Overflow"],
    description: `Modelled on the **GPS week-number rollover of 6 April 2019**: the legacy GPS navigation message carries the week number in 10 bits, so it wraps to zero every 1024 weeks (about 19.6 years). The first wrap was in August 1999; at the second, receivers that assumed a fixed rollover era — or had no rollover handling at all — suddenly reported dates 1024 weeks in the past, and some systems that depended on them failed.

This project is a reconstruction. \`GpsWeek.resolve\` turns the broadcast 10-bit week into a full week number by adding the era the firmware was built in, as a fixed constant.

Fix \`resolve\` so the full week is found relative to the firmware's build week and keeps working across any number of future rollovers.`,
    bugReport: `**BUG-WNRO** · Priority: High · Reported by: field support

GpsWeek.resolve(broadcastWeek):
- broadcastWeek outside 0..1023 throws IllegalArgumentException
- otherwise returns the SMALLEST full week w such that
  w % 1024 == broadcastWeek and w >= GpsConstants.BUILD_WEEK
  (a receiver can never be running before it was built)
GpsWeek.dayNumber(broadcastWeek, dayOfWeek) = resolve(broadcastWeek) * 7 + dayOfWeek.

Observed: after the April 2019 rollover the broadcast week reads 0 and the
receiver resolves it to week 1024 — August 1999.`,
    logs: `[gps] wn10=1023 -> week 2047 (2019-03-31)
[gps] wn10=0 -> week 1024 (1999-08-22)
[nav] timestamp moved back 7168 days, rejecting fix`,
    files: [
      {
        filePath: "src/gps/GpsWeek.java",
        isEditable: true,
        language: "java",
        content: `class GpsWeek {
    static int resolve(int broadcastWeek) {
        if (broadcastWeek < 0 || broadcastWeek >= GpsConstants.ROLLOVER) {
            throw new IllegalArgumentException("week out of range: " + broadcastWeek);
        }
        return GpsConstants.ERA_AT_BUILD * GpsConstants.ROLLOVER + broadcastWeek;
    }

    static int dayNumber(int broadcastWeek, int dayOfWeek) {
        return resolve(broadcastWeek) * 7 + dayOfWeek;
    }
}
`,
      },
      {
        filePath: "src/gps/GpsConstants.java",
        isEditable: false,
        language: "java",
        content: `class GpsConstants {
    // The legacy navigation message carries the week number in 10 bits.
    static final int WEEK_BITS = 10;
    static final int ROLLOVER = 1 << WEEK_BITS; // 1024 weeks
    // Full GPS week in which this firmware image was built.
    static final int BUILD_WEEK = 1981;
    // Rollovers already completed when the firmware was built
    // (week 1024 began in August 1999).
    static final int ERA_AT_BUILD = 1;
}
`,
      },
    ],
    tests: [
      {
        name: "a week late in the build era resolves",
        isHidden: false,
        source: `                BugAssert.equal(GpsWeek.resolve(1000), 2024, "wn10=1000");`,
      },
      {
        name: "week 0 after the 2019 rollover is week 2048",
        isHidden: false,
        source: `                BugAssert.equal(GpsWeek.resolve(0), 2048, "not August 1999");`,
      },
      {
        name: "the build week itself and the week before it",
        isHidden: true,
        source: `                BugAssert.equal(GpsWeek.resolve(957), 1981, "the build week");
                BugAssert.equal(GpsWeek.resolve(956), 3004, "one week before the build week can only be the next era");`,
      },
      {
        name: "day numbers use the resolved week",
        isHidden: true,
        source: `                BugAssert.equal(GpsWeek.dayNumber(0, 6), 14342);
                BugAssert.equal(GpsWeek.dayNumber(1023, 0), 14329);`,
      },
      {
        name: "out-of-range broadcast weeks are rejected",
        isHidden: true,
        source: `                boolean threw = false;
                try { GpsWeek.resolve(1024); } catch (IllegalArgumentException e) { threw = true; }
                BugAssert.ok(threw, "1024 does not fit in 10 bits");
                threw = false;
                try { GpsWeek.resolve(-1); } catch (IllegalArgumentException e) { threw = true; }
                BugAssert.ok(threw, "negative week");`,
      },
    ],
    fixedFiles: {
      "src/gps/GpsWeek.java": `class GpsWeek {
    static int resolve(int broadcastWeek) {
        if (broadcastWeek < 0 || broadcastWeek >= GpsConstants.ROLLOVER) {
            throw new IllegalArgumentException("week out of range: " + broadcastWeek);
        }
        // A fixed era is only right until the next rollover. Resolve against
        // the build week instead: the receiver cannot be running before it was
        // built, so take the first matching week at or after it.
        int week = broadcastWeek;
        while (week < GpsConstants.BUILD_WEEK) week += GpsConstants.ROLLOVER;
        return week;
    }

    static int dayNumber(int broadcastWeek, int dayOfWeek) {
        return resolve(broadcastWeek) * 7 + dayOfWeek;
    }
}
`,
    },
  },

  {
    title: "The Break That Left the Switch",
    difficulty: "hard",
    category: "backend",
    language: "java",
    tags: ["State", "Networking"],
    description: `Modelled on the **AT&T long-distance network collapse of 15 January 1990**: a software update to the 4ESS switches contained a C \`break\` statement inside an \`if\` that was itself inside a \`switch\`. The \`break\` was meant to leave the \`if\`, but it left the \`switch\`, skipping the processing that followed. When one switch reset and came back, the messages it sent made its neighbours reset too, and the failure rippled across the network for about nine hours.

This project is a reconstruction in Java, where \`break\` has the same meaning. \`Handler.handle\` processes signalling messages: an incoming message from a peer that was marked out of service should bring the peer back into service (when the write buffer is empty) and then be delivered — always.

Fix \`handle\` so every incoming message is delivered.`,
    bugReport: `**BUG-4ESS** · Priority: P0 · Reported by: network operations

Handler.handle(state, msg):
- PEER_DOWN: add msg.from to state.peersDown
- INCOMING:
    - if msg.from is in peersDown AND state.writeBufferDepth == 0: remove it
      from peersDown and append msg.from to state.inServiceSent
    - if the buffer is not empty, the peer stays down for now (it will be
      marked in service by a later message)
    - in EVERY case, append msg.id to state.delivered, exactly once
- any other type throws IllegalStateException
Handler.handleAll(state, msgs) handles each message in order.

Observed: messages from a recovering peer arriving while the write buffer is
busy are silently dropped.`,
    logs: `[4ess] peer NYC-04 back from reset, sending status
[4ess] INCOMING from NYC-04 while buffer depth=3 -> no delivery
[4ess] self-reset triggered`,
    files: [
      {
        filePath: "src/signal/Handler.java",
        isEditable: true,
        language: "java",
        content: `class Handler {
    static void handle(SwitchState st, Msg m) {
        switch (m.type) {
            case Msg.PEER_DOWN:
                st.peersDown.add(m.from);
                break;
            case Msg.INCOMING:
                if (st.peersDown.contains(m.from)) {
                    if (st.writeBufferDepth == 0) {
                        st.peersDown.remove(m.from);
                        st.inServiceSent.add(m.from);
                    } else {
                        break;
                    }
                }
                st.delivered.add(m.id);
                break;
            default:
                throw new IllegalStateException("unknown message type " + m.type);
        }
    }

    static void handleAll(SwitchState st, List<Msg> msgs) {
        for (Msg m : msgs) handle(st, m);
    }
}
`,
      },
      {
        filePath: "src/signal/Msg.java",
        isEditable: false,
        language: "java",
        content: `class Msg {
    static final int INCOMING = 1;
    static final int PEER_DOWN = 2;

    final int type;
    final String from;
    final String id;

    Msg(int type, String from, String id) {
        this.type = type;
        this.from = from;
        this.id = id;
    }
}
`,
      },
      {
        filePath: "src/signal/SwitchState.java",
        isEditable: false,
        language: "java",
        content: `class SwitchState {
    final Set<String> peersDown = new TreeSet<>();
    final List<String> delivered = new ArrayList<>();
    final List<String> inServiceSent = new ArrayList<>();
    int writeBufferDepth = 0;
}
`,
      },
    ],
    tests: [
      {
        name: "messages from a healthy peer are delivered",
        isHidden: false,
        source: `                SwitchState st = new SwitchState();
                Handler.handle(st, new Msg(Msg.INCOMING, "NYC-04", "m1"));
                BugAssert.equal(st.delivered, Arrays.asList("m1"));`,
      },
      {
        name: "a recovering peer with an empty buffer is marked in service",
        isHidden: false,
        source: `                SwitchState st = new SwitchState();
                Handler.handle(st, new Msg(Msg.PEER_DOWN, "NYC-04", "d1"));
                Handler.handle(st, new Msg(Msg.INCOMING, "NYC-04", "m1"));
                BugAssert.equal(st.inServiceSent, Arrays.asList("NYC-04"));
                BugAssert.equal(st.delivered, Arrays.asList("m1"));
                BugAssert.ok(st.peersDown.isEmpty(), "peer back in service");`,
      },
      {
        name: "a busy buffer never drops the message",
        isHidden: false,
        source: `                SwitchState st = new SwitchState();
                st.writeBufferDepth = 3;
                Handler.handle(st, new Msg(Msg.PEER_DOWN, "NYC-04", "d1"));
                Handler.handle(st, new Msg(Msg.INCOMING, "NYC-04", "m1"));
                BugAssert.equal(st.delivered, Arrays.asList("m1"), "the message must still be processed");
                BugAssert.ok(st.peersDown.contains("NYC-04"), "the peer stays down until the buffer drains");
                BugAssert.ok(st.inServiceSent.isEmpty(), "no in-service message yet");`,
      },
      {
        name: "the peer comes back once the buffer drains",
        isHidden: true,
        source: `                SwitchState st = new SwitchState();
                st.writeBufferDepth = 2;
                Handler.handleAll(st, Arrays.asList(
                    new Msg(Msg.PEER_DOWN, "ATL-01", "d1"),
                    new Msg(Msg.INCOMING, "ATL-01", "m1"),
                    new Msg(Msg.INCOMING, "CHI-02", "m2")));
                st.writeBufferDepth = 0;
                Handler.handle(st, new Msg(Msg.INCOMING, "ATL-01", "m3"));
                BugAssert.equal(st.delivered, Arrays.asList("m1", "m2", "m3"));
                BugAssert.equal(st.inServiceSent, Arrays.asList("ATL-01"));`,
      },
      {
        name: "unknown message types are refused",
        isHidden: true,
        source: `                SwitchState st = new SwitchState();
                boolean threw = false;
                try { Handler.handle(st, new Msg(9, "X", "m")); } catch (IllegalStateException e) { threw = true; }
                BugAssert.ok(threw, "type 9");
                BugAssert.ok(st.delivered.isEmpty(), "nothing delivered");`,
      },
    ],
    fixedFiles: {
      "src/signal/Handler.java": `class Handler {
    static void handle(SwitchState st, Msg m) {
        switch (m.type) {
            case Msg.PEER_DOWN:
                st.peersDown.add(m.from);
                break;
            case Msg.INCOMING:
                // The old else-branch "break" left the whole switch, not just the
                // if, so the message was never processed. Only the status update
                // depends on the buffer; delivery always happens.
                if (st.peersDown.contains(m.from) && st.writeBufferDepth == 0) {
                    st.peersDown.remove(m.from);
                    st.inServiceSent.add(m.from);
                }
                st.delivered.add(m.id);
                break;
            default:
                throw new IllegalStateException("unknown message type " + m.type);
        }
    }

    static void handleAll(SwitchState st, List<Msg> msgs) {
        for (Msg m : msgs) handle(st, m);
    }
}
`,
    },
  },

  {
    title: "Debts Averaged Out of Thin Air",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Money", "Validation"],
    description: `Modelled on **Robodebt**, the Australian government's automated welfare debt-recovery scheme (2016–2019): it averaged a person's annual income from tax records evenly across the year's fortnights and compared that average with the income they had reported fortnight by fortnight. Anyone whose earnings were uneven — casual or seasonal work — could be issued a debt they did not owe. In 2019 the Federal Court found a debt based on averaging unlawful, and a Royal Commission reported on the scheme in 2023.

This project is a reconstruction. \`assess.py\` computes a debt by spreading the annual figure across 26 fortnights.

Fix \`assess\` so each fortnight is judged on that fortnight's own income, and a mismatch with the annual figure is flagged for review — never turned into a debt.`,
    bugReport: `**BUG-OCI** · Priority: Critical · Reported by: ombudsman referral

assess(annual_income, fortnights) — each fortnight is
{"reported": int, "actual": int or None, "paid": int}.
- the income for a fortnight is "actual" (payslip evidence) when it is not
  None, otherwise the "reported" figure; the annual figure is NEVER divided
  across fortnights
- debt = sum over fortnights of max(0, paid - rules.entitlement(income))
- review = abs(annual_income - sum of the incomes used) > rules.REVIEW_TOLERANCE
Returns {"debt": int, "review": bool}.

Observed: a casual worker who earned everything in half the year and claimed
benefits correctly in the other half was issued a debt of 4550.`,
    logs: `[oci] client 88231 annual=26000 averaged=1000/fn
[oci] client 88231 raised debt=4550 (13 fortnights over-paid)`,
    files: [
      {
        filePath: "src/compliance/assess.py",
        isEditable: true,
        language: "python",
        content: `rules = bug_require("./rules.py")


def assess(annual_income, fortnights):
    fortnightly = annual_income // rules.FORTNIGHTS_PER_YEAR
    debt = 0
    for f in fortnights:
        owed = f["paid"] - rules.entitlement(fortnightly)
        if owed > 0:
            debt += owed
    used_total = fortnightly * len(fortnights)
    review = abs(annual_income - used_total) > rules.REVIEW_TOLERANCE
    return {"debt": debt, "review": review}
`,
      },
      {
        filePath: "src/compliance/rules.py",
        isEditable: false,
        language: "python",
        content: `# Payment rules (simplified). All amounts are whole dollars per fortnight.
FORTNIGHTS_PER_YEAR = 26
BASE_RATE = 500
FREE_AREA = 300
REVIEW_TOLERANCE = 100


def entitlement(income):
    """What a person earning 'income' this fortnight is entitled to."""
    if income <= FREE_AREA:
        return BASE_RATE
    return max(0, BASE_RATE - (income - FREE_AREA) // 2)
`,
      },
    ],
    tests: [
      {
        name: "steady earnings: a real over-payment is found",
        isHidden: false,
        source: `m = bug_require("src/compliance/assess.py")
fns = [{"reported": 400, "actual": None, "paid": 500}] * 26
assert_.equal(m.assess(10400, fns), {"debt": 1300, "review": False})`,
      },
      {
        name: "uneven earnings raise no debt when every fortnight was right",
        isHidden: false,
        source: `m = bug_require("src/compliance/assess.py")
work = [{"reported": 2000, "actual": 2000, "paid": 0}] * 13
benefit = [{"reported": 0, "actual": 0, "paid": 500}] * 13
assert_.equal(m.assess(26000, work + benefit), {"debt": 0, "review": False}, "averaging invents a debt here")`,
      },
      {
        name: "payslip evidence overrides the reported figure",
        isHidden: true,
        source: `m = bug_require("src/compliance/assess.py")
fns = [{"reported": 0, "actual": 1300, "paid": 500}] + [{"reported": 0, "actual": None, "paid": 500}] * 25
assert_.equal(m.assess(1300, fns), {"debt": 500, "review": False})`,
      },
      {
        name: "a mismatch with the annual figure is flagged, not charged",
        isHidden: true,
        source: `m = bug_require("src/compliance/assess.py")
fns = [{"reported": 0, "actual": None, "paid": 500}] * 26
assert_.equal(m.assess(5200, fns), {"debt": 0, "review": True})`,
      },
      {
        name: "differences within tolerance are not flagged",
        isHidden: true,
        source: `m = bug_require("src/compliance/assess.py")
fns = [{"reported": 250, "actual": None, "paid": 500}] * 2
assert_.equal(m.assess(560, fns), {"debt": 0, "review": False})`,
      },
    ],
    fixedFiles: {
      "src/compliance/assess.py": `rules = bug_require("./rules.py")


def assess(annual_income, fortnights):
    # Spreading the annual figure evenly invents income in fortnights where
    # none was earned. Judge each fortnight on its own evidence; the annual
    # figure can only prompt a human review, never a debt.
    debt = 0
    used_total = 0
    for f in fortnights:
        income = f["actual"] if f.get("actual") is not None else f["reported"]
        used_total += income
        owed = f["paid"] - rules.entitlement(income)
        if owed > 0:
            debt += owed
    review = abs(annual_income - used_total) > rules.REVIEW_TOLERANCE
    return {"debt": debt, "review": review}
`,
    },
  },

  {
    title: "The Fsync That Lied on Retry",
    difficulty: "hard",
    category: "database",
    language: "python",
    tags: ["Retries", "State"],
    description: `Modelled on **PostgreSQL's "fsyncgate" (2018)**: developers found that when \`fsync\` failed, Linux could report the error once, mark the dirty pages clean and drop them. PostgreSQL's checkpointer retried the \`fsync\`, the retry succeeded, and the data it believed durable had never reached disk. The fix, released in February 2019, was to treat a failed \`fsync\` as fatal: PANIC, and recover from the write-ahead log on restart.

This project is a reconstruction with a fake OS that behaves the way Linux did. \`checkpoint.py\` writes buffers, fsyncs, and truncates the WAL — retrying once when the fsync fails.

Fix \`checkpoint\` so a failed fsync is never retried and never trusted.`,
    bugReport: `**BUG-FSYNCGATE** · Priority: Critical (silent data loss) · Reported by: storage team

checkpoint(os_, buffers, wal) — wal is {"records": [...], "redo_lsn": int}:
- writes every buffer (sorted by page name) with os_.write, then calls
  os_.fsync() exactly once
- on success: redo_lsn += number of records, records = [], return that number
- on ANY failure of fsync: raise errors.Panic — do not call fsync again, and
  leave the WAL exactly as it was, so crash recovery (recovery.recover) can
  replay it

Observed: after an EIO the checkpoint retried, succeeded, truncated the WAL,
and the pages were nowhere on disk.`,
    logs: `[checkpointer] fsync failed: EIO, retrying
[checkpointer] fsync ok, checkpoint complete redo_lsn=412
[startup] page p1 missing, no WAL to replay`,
    files: [
      {
        filePath: "src/storage/checkpoint.py",
        isEditable: true,
        language: "python",
        content: `errors = bug_require("./errors.py")


def checkpoint(os_, buffers, wal):
    for page in sorted(buffers):
        os_.write(page, buffers[page])
    try:
        os_.fsync()
    except OSError:
        os_.fsync()
    flushed = len(wal["records"])
    wal["records"] = []
    wal["redo_lsn"] += flushed
    return flushed
`,
      },
      {
        filePath: "src/storage/fakeos.py",
        isEditable: false,
        language: "python",
        content: `class FakeOS:
    """Page cache + disk. fsync outcomes are scripted: True ok, False EIO."""

    def __init__(self, fsync_results):
        self.disk = {}
        self.dirty = {}
        self.results = list(fsync_results)
        self.fsync_calls = 0

    def write(self, page, value):
        self.dirty[page] = value

    def fsync(self):
        self.fsync_calls += 1
        ok = self.results.pop(0) if self.results else True
        if ok:
            self.disk.update(self.dirty)
            self.dirty = {}
            return
        # Like Linux at the time: report the error once, then mark the pages
        # clean and forget them. A later fsync has nothing left to fail on.
        self.dirty = {}
        raise OSError("EIO")
`,
      },
      {
        filePath: "src/storage/errors.py",
        isEditable: false,
        language: "python",
        content: `class Panic(Exception):
    """Stop the server; crash recovery replays the WAL on restart."""
`,
      },
      {
        filePath: "src/storage/recovery.py",
        isEditable: false,
        language: "python",
        content: `def recover(os_, wal):
    for page, value in wal["records"]:
        os_.write(page, value)
    os_.fsync()
`,
      },
    ],
    tests: [
      {
        name: "a clean checkpoint makes pages durable and truncates the WAL",
        isHidden: false,
        source: `cp = bug_require("src/storage/checkpoint.py")
FakeOS = bug_require("src/storage/fakeos.py").FakeOS
os_ = FakeOS([True])
wal = {"records": [["p1", "a"], ["p2", "b"]], "redo_lsn": 0}
assert_.equal(cp.checkpoint(os_, {"p1": "a", "p2": "b"}, wal), 2)
assert_.equal(os_.disk, {"p1": "a", "p2": "b"})
assert_.equal(wal, {"records": [], "redo_lsn": 2})`,
      },
      {
        name: "a failed fsync panics and is never retried",
        isHidden: false,
        source: `cp = bug_require("src/storage/checkpoint.py")
errors = bug_require("src/storage/errors.py")
FakeOS = bug_require("src/storage/fakeos.py").FakeOS
os_ = FakeOS([False, True])
wal = {"records": [["p1", "a"]], "redo_lsn": 0}
raised = False
try:
    cp.checkpoint(os_, {"p1": "a"}, wal)
except errors.Panic:
    raised = True
assert_.ok(raised, "a failed fsync must PANIC")
assert_.equal(os_.fsync_calls, 1, "never retry a failed fsync")`,
      },
      {
        name: "the WAL survives a failed checkpoint",
        isHidden: true,
        source: `cp = bug_require("src/storage/checkpoint.py")
FakeOS = bug_require("src/storage/fakeos.py").FakeOS
os_ = FakeOS([False])
wal = {"records": [["p1", "a"]], "redo_lsn": 7}
try:
    cp.checkpoint(os_, {"p1": "a"}, wal)
except Exception:
    pass
assert_.equal(wal, {"records": [["p1", "a"]], "redo_lsn": 7})`,
      },
      {
        name: "crash recovery restores what the failed fsync lost",
        isHidden: true,
        source: `cp = bug_require("src/storage/checkpoint.py")
rec = bug_require("src/storage/recovery.py")
FakeOS = bug_require("src/storage/fakeos.py").FakeOS
os_ = FakeOS([False])
wal = {"records": [["p1", "a"], ["p2", "b"]], "redo_lsn": 0}
try:
    cp.checkpoint(os_, {"p1": "a", "p2": "b"}, wal)
except Exception:
    pass
rec.recover(os_, wal)
assert_.equal(os_.disk, {"p1": "a", "p2": "b"})`,
      },
    ],
    fixedFiles: {
      "src/storage/checkpoint.py": `errors = bug_require("./errors.py")


def checkpoint(os_, buffers, wal):
    for page in sorted(buffers):
        os_.write(page, buffers[page])
    try:
        os_.fsync()
    except OSError as e:
        # After a failed fsync the kernel may already have dropped the dirty
        # pages, so a retry "succeeds" with nothing written. The only safe
        # answer is to stop with the WAL intact and let recovery replay it.
        raise errors.Panic("fsync failed: " + str(e))
    flushed = len(wal["records"])
    wal["records"] = []
    wal["redo_lsn"] += flushed
    return flushed
`,
    },
  },

  {
    title: "The Migration That Unblocked Everyone",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Security", "State"],
    description: `Modelled on **Facebook's block-list bug (disclosed July 2018)**: for about a week in late May and early June 2018, a bug temporarily unblocked people that more than 800,000 users had blocked — a blocked person could, for instance, contact them on Messenger again. Facebook fixed the bug, restored the blocks and notified the affected users.

Facebook did not publish the code involved; this project is a reconstruction of one way such a bug happens. \`migrate.py\` applies a batch of relationship-setting updates, normalising every flag to a boolean — so a flag the update never mentioned is rewritten to \`False\`.

Fix \`apply_updates\` so an update only changes the fields it actually carries.`,
    bugReport: `**BUG-BLOCKLIST** · Priority: Critical (privacy) · Reported by: trust & safety

apply_updates(rows, updates) — each update is {"a", "b", ...some of
"blocked" / "following" / "muted"}:
- the row for (a, b) is found with relations.find; an update with no
  matching row is skipped
- ONLY the flags present in the update are written (as booleans); every
  flag the update does not mention keeps its current value
- an update may explicitly set "blocked": False (a real unblock)
- returns the number of rows that matched an update

Observed: a bulk update that only touched "following" cleared "blocked" on
every row it matched.`,
    logs: `[migrate] batch rel-settings-0529 applied to 812000 rows
[support] ticket: "someone I blocked just messaged me"`,
    files: [
      {
        filePath: "src/social/migrate.py",
        isEditable: true,
        language: "python",
        content: `relations = bug_require("./relations.py")

FIELDS = ("blocked", "following", "muted")


def apply_updates(rows, updates):
    matched = 0
    for u in updates:
        row = relations.find(rows, u["a"], u["b"])
        if row is None:
            continue
        for field in FIELDS:
            row[field] = bool(u.get(field, False))
        matched += 1
    return matched
`,
      },
      {
        filePath: "src/social/relations.py",
        isEditable: false,
        language: "python",
        content: `# A row describes how user "a" treats user "b".


def find(rows, a, b):
    for row in rows:
        if row["a"] == a and row["b"] == b:
            return row
    return None


def can_message(rows, sender, recipient):
    row = find(rows, recipient, sender)
    return not (row is not None and row["blocked"])
`,
      },
    ],
    tests: [
      {
        name: "an update sets the flag it carries",
        isHidden: false,
        source: `m = bug_require("src/social/migrate.py")
rows = [{"a": "ana", "b": "ben", "blocked": False, "following": False, "muted": False}]
assert_.equal(m.apply_updates(rows, [{"a": "ana", "b": "ben", "following": True}]), 1)
assert_.equal(rows[0]["following"], True)`,
      },
      {
        name: "a block survives an update that does not mention it",
        isHidden: false,
        source: `m = bug_require("src/social/migrate.py")
rel = bug_require("src/social/relations.py")
rows = [{"a": "ana", "b": "eve", "blocked": True, "following": True, "muted": False}]
m.apply_updates(rows, [{"a": "ana", "b": "eve", "following": False}])
assert_.equal(rows[0]["blocked"], True, "the block must survive")
assert_.ok(not rel.can_message(rows, "eve", "ana"), "eve is still blocked")`,
      },
      {
        name: "an explicit unblock works",
        isHidden: true,
        source: `m = bug_require("src/social/migrate.py")
rows = [{"a": "ana", "b": "eve", "blocked": True, "following": False, "muted": True}]
m.apply_updates(rows, [{"a": "ana", "b": "eve", "blocked": False}])
assert_.equal(rows[0], {"a": "ana", "b": "eve", "blocked": False, "following": False, "muted": True})`,
      },
      {
        name: "unmatched updates are skipped and other flags kept",
        isHidden: true,
        source: `m = bug_require("src/social/migrate.py")
rows = [
    {"a": "ana", "b": "eve", "blocked": True, "following": False, "muted": True},
    {"a": "ben", "b": "cy", "blocked": False, "following": True, "muted": False},
]
n = m.apply_updates(rows, [{"a": "zed", "b": "ana", "blocked": True}, {"a": "ana", "b": "eve", "muted": 0}])
assert_.equal(n, 1)
assert_.equal(rows[0], {"a": "ana", "b": "eve", "blocked": True, "following": False, "muted": False})
assert_.equal(rows[1], {"a": "ben", "b": "cy", "blocked": False, "following": True, "muted": False})`,
      },
    ],
    fixedFiles: {
      "src/social/migrate.py": `relations = bug_require("./relations.py")

FIELDS = ("blocked", "following", "muted")


def apply_updates(rows, updates):
    matched = 0
    for u in updates:
        row = relations.find(rows, u["a"], u["b"])
        if row is None:
            continue
        for field in FIELDS:
            # Defaulting absent flags to False rewrote every block the update
            # never mentioned. Only fields the update carries are written.
            if field in u:
                row[field] = bool(u[field])
        matched += 1
    return matched
`,
    },
  },

  {
    title: "The Plague the Pets Carried",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["State"],
    description: `Modelled on **World of Warcraft's Corrupted Blood incident (September 2005)**: a debuff cast by the boss Hakkar in the new Zul'Gurub raid was meant to stay inside that zone. But a hunter's pet that was dismissed while infected kept the debuff, and when it was summoned again in a capital city the plague spread from player to player across the world. Blizzard had to fix the mechanic and reset the servers.

This project is a reconstruction. \`zone.js\` strips zone-bound debuffs when a player leaves the instance — from the player, and from their pet only if the pet is currently summoned.

Fix \`leaveInstance\` so nothing the player owns leaves the zone still carrying a zone-bound debuff.`,
    bugReport: `**BUG-ZG-HAKKAR** · Priority: P0 · Reported by: every city on the realm

leaveInstance(world, playerId):
- removes every debuff with zoneBound: true from the player
- removes every zoneBound debuff from the player's pet (player.petId), whether
  the pet is summoned or dismissed; a player may have no pet (petId null)
- keeps every debuff that is not zone-bound, in its original order
- sets the player's zone to "world"

Observed: a pet dismissed inside Zul'Gurub still carries Corrupted Blood when
summoned in Ironforge.`,
    logs: `[zone] rexxar left zulgurub, debuffs cleared
[ironforge] misha summoned with Corrupted Blood
[ironforge] 214 players infected in 3 minutes`,
    files: [
      {
        filePath: "src/raid/zone.js",
        isEditable: true,
        language: "javascript",
        content: `function stripZoneBound(entity) {
  entity.debuffs = entity.debuffs.filter(function (d) { return !d.zoneBound; });
}

exports.leaveInstance = function (world, playerId) {
  var player = world.entities[playerId];
  stripZoneBound(player);
  if (player.petId && world.entities[player.petId].summoned) {
    stripZoneBound(world.entities[player.petId]);
  }
  player.zone = "world";
};
`,
      },
      {
        filePath: "src/raid/world.js",
        isEditable: false,
        language: "javascript",
        content: `exports.create = function () {
  return {
    entities: {
      rexxar: {
        id: "rexxar", zone: "zulgurub", petId: "misha",
        debuffs: [{ name: "Corrupted Blood", zoneBound: true }, { name: "Weakened Soul", zoneBound: false }]
      },
      misha: {
        id: "misha", zone: "zulgurub", summoned: false,
        debuffs: [{ name: "Corrupted Blood", zoneBound: true }, { name: "Hunter's Mark", zoneBound: false }]
      },
      jaina: {
        id: "jaina", zone: "zulgurub", petId: null,
        debuffs: [{ name: "Corrupted Blood", zoneBound: true }]
      }
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "the player leaves clean and keeps ordinary debuffs",
        isHidden: false,
        source: `var z = require("src/raid/zone");
var w = require("src/raid/world").create();
z.leaveInstance(w, "rexxar");
assert.equal(w.entities.rexxar.debuffs, [{ name: "Weakened Soul", zoneBound: false }]);
assert.equal(w.entities.rexxar.zone, "world");`,
      },
      {
        name: "a dismissed pet is cleaned too",
        isHidden: false,
        source: `var z = require("src/raid/zone");
var w = require("src/raid/world").create();
z.leaveInstance(w, "rexxar");
assert.equal(w.entities.misha.debuffs, [{ name: "Hunter's Mark", zoneBound: false }], "the pet must not carry the plague out");`,
      },
      {
        name: "a summoned pet is cleaned",
        isHidden: true,
        source: `var z = require("src/raid/zone");
var w = require("src/raid/world").create();
w.entities.misha.summoned = true;
z.leaveInstance(w, "rexxar");
assert.equal(w.entities.misha.debuffs, [{ name: "Hunter's Mark", zoneBound: false }]);`,
      },
      {
        name: "a player without a pet leaves cleanly",
        isHidden: true,
        source: `var z = require("src/raid/zone");
var w = require("src/raid/world").create();
z.leaveInstance(w, "jaina");
assert.equal(w.entities.jaina.debuffs, []);
assert.equal(w.entities.misha.debuffs.length, 2, "someone else's pet is not touched");`,
      },
    ],
    fixedFiles: {
      "src/raid/zone.js": `function stripZoneBound(entity) {
  entity.debuffs = entity.debuffs.filter(function (d) { return !d.zoneBound; });
}

exports.leaveInstance = function (world, playerId) {
  var player = world.entities[playerId];
  stripZoneBound(player);
  // A dismissed pet still exists and is summoned again later, somewhere else.
  // Clean it whatever its state, or it carries the zone's debuffs out.
  if (player.petId && world.entities[player.petId]) {
    stripZoneBound(world.entities[player.petId]);
  }
  player.zone = "world";
};
`,
    },
  },

  {
    title: "Java, Newline, Script",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Security", "Parsing"],
    description: `Modelled on the **Samy worm on MySpace (October 2005)**: MySpace's profile filter removed the word \`javascript\`, but some browsers still ran a CSS \`url()\` in which the word was split by a newline — \`java\\nscript:\`. Samy Kamkar's profile used that gap to add him as a friend of everyone who viewed it, and the worm reached over a million profiles in about a day.

This project is a reconstruction. \`sanitize.js\` decides whether a URL may go into a profile's background style by searching for a forbidden word.

Fix \`isSafeUrl\` so the check is made on what the browser will actually see, and only known-safe schemes pass.`,
    bugReport: `**BUG-SAMY** · Priority: Critical (stored XSS) · Reported by: security

isSafeUrl(url):
- first remove every character with code <= 32 (spaces, tabs, newlines and
  other control characters) and code 127, then lower-case the result
- if what remains starts with a scheme (a letter, then letters, digits, "+",
  "-" or ".", then ":"), the URL is safe ONLY when that scheme is http or https
- a URL with no scheme (e.g. "/img/bg.png", "img/bg.png") is relative and safe
render.backgroundStyle uses it to decide whether a URL is emitted.

Observed: "java<newline>script:…" passes the filter and runs in the viewer's
browser.`,
    logs: `[profile] saved style for user 11851658 (filter: ok)
[profile] friend count for user 11851658 growing without user action`,
    files: [
      {
        filePath: "src/profile/sanitize.js",
        isEditable: true,
        language: "javascript",
        content: `// Decides whether a user-supplied URL may appear in a profile style.
exports.isSafeUrl = function (url) {
  return String(url).toLowerCase().indexOf("javascript") === -1;
};
`,
      },
      {
        filePath: "src/profile/render.js",
        isEditable: false,
        language: "javascript",
        content: `var sanitize = require("./sanitize");

exports.backgroundStyle = function (url) {
  if (!sanitize.isSafeUrl(url)) return "";
  return "background:url(" + JSON.stringify(String(url)) + ")";
};
`,
      },
    ],
    tests: [
      {
        name: "an https background is allowed",
        isHidden: false,
        source: `var s = require("src/profile/sanitize");
assert.equal(s.isSafeUrl("https://img.example.com/bg.png"), true);
assert.equal(s.isSafeUrl("javascript:alert(1)"), false);`,
      },
      {
        name: "a scheme split by a newline is still refused",
        isHidden: false,
        source: `var s = require("src/profile/sanitize");
assert.equal(s.isSafeUrl("java\\nscript:alert(1)"), false, "browsers ignore the newline");`,
      },
      {
        name: "tabs, spaces and case do not help",
        isHidden: true,
        source: `var s = require("src/profile/sanitize");
assert.equal(s.isSafeUrl(" JaVa\\tScRiPt:alert(1)"), false);
assert.equal(s.isSafeUrl("java\\rscript:x"), false);`,
      },
      {
        name: "only http and https schemes pass",
        isHidden: true,
        source: `var s = require("src/profile/sanitize");
assert.equal(s.isSafeUrl("vbscript:msgbox(1)"), false);
assert.equal(s.isSafeUrl("data:text/html,hi"), false);
assert.equal(s.isSafeUrl("HTTP://img.example.com/a.png"), true);`,
      },
      {
        name: "relative URLs are allowed and rendered",
        isHidden: true,
        source: `var s = require("src/profile/sanitize");
var r = require("src/profile/render");
assert.equal(s.isSafeUrl("/img/bg.png"), true);
assert.equal(s.isSafeUrl("img/bg.png"), true);
assert.equal(r.backgroundStyle("/img/bg.png"), "background:url(\\"/img/bg.png\\")");
assert.equal(r.backgroundStyle("java\\nscript:x"), "");`,
      },
    ],
    fixedFiles: {
      "src/profile/sanitize.js": `// Decides whether a user-supplied URL may appear in a profile style.
var SAFE_SCHEMES = ["http", "https"];

exports.isSafeUrl = function (url) {
  // Browsers skip whitespace and control characters inside a scheme, so a
  // word search on the raw text misses "java<newline>script:". Normalise
  // first, then allow known-good schemes instead of banning bad words.
  var raw = String(url);
  var cleaned = "";
  for (var i = 0; i < raw.length; i++) {
    var code = raw.charCodeAt(i);
    if (code > 32 && code !== 127) cleaned += raw.charAt(i);
  }
  cleaned = cleaned.toLowerCase();
  var m = /^([a-z][a-z0-9+.-]*):/.exec(cleaned);
  if (!m) return true;
  return SAFE_SCHEMES.indexOf(m[1]) !== -1;
};
`,
    },
  },

  {
    title: "The Preview That Minted Someone Else's Token",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on **Facebook's "View As" breach (disclosed September 2018)**: "View As" shows you your own profile as another person sees it. A combination of bugs meant that, in that mode, the video uploader generated an access token for the person being viewed as rather than for the viewer. Attackers chained this to collect tokens; Facebook first estimated almost 50 million affected accounts and later said about 29 million had tokens taken.

This project is a reconstruction. \`viewAs.js\` builds a render context in which \`user\` is the person the page is rendered as — and the composer mints its uploader token for \`ctx.user\`.

Fix the composer so a token is only ever minted for the authenticated viewer.`,
    bugReport: `**BUG-VIEWAS** · Priority: Critical · Reported by: security

renderPage(session, subjectId, tokens) returns { renderedAs, uploaderToken }:
- renderedAs is subjectId when it is given and differs from
  session.userId (View As mode), otherwise session.userId
- the uploader token is minted with tokens.mint(...) for session.userId —
  ALWAYS the authenticated viewer, never the subject — exactly once per render
buildContext(session, subjectId) returns { viewer, user, viewAs } in that key
order.

Observed: in View As mode the page carries a working token for the person
being previewed.`,
    logs: `[viewas] viewer=u_1001 subject=u_2002 uploader token owner=u_2002`,
    files: [
      {
        filePath: "src/profile/viewAs.js",
        isEditable: true,
        language: "javascript",
        content: `exports.buildContext = function (session, subjectId) {
  var viewAs = !!subjectId && subjectId !== session.userId;
  return {
    viewer: session.userId,
    user: viewAs ? subjectId : session.userId,
    viewAs: viewAs
  };
};

exports.renderComposer = function (ctx, tokens) {
  var token = tokens.mint(ctx.user);
  return { renderedAs: ctx.user, uploaderToken: token.token };
};

exports.renderPage = function (session, subjectId, tokens) {
  return exports.renderComposer(exports.buildContext(session, subjectId), tokens);
};
`,
      },
      {
        filePath: "src/profile/tokens.js",
        isEditable: false,
        language: "javascript",
        content: `exports.create = function () {
  var issued = [];
  return {
    issued: issued,
    mint: function (userId) {
      var t = { token: "tok-" + userId + "-" + (issued.length + 1), owner: userId };
      issued.push(t);
      return t;
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "your own page gets your own token",
        isHidden: false,
        source: `var v = require("src/profile/viewAs");
var tokens = require("src/profile/tokens").create();
assert.equal(v.renderPage({ userId: "u_1001" }, null, tokens), { renderedAs: "u_1001", uploaderToken: "tok-u_1001-1" });`,
      },
      {
        name: "View As renders as the subject but mints for the viewer",
        isHidden: false,
        source: `var v = require("src/profile/viewAs");
var tokens = require("src/profile/tokens").create();
var page = v.renderPage({ userId: "u_1001" }, "u_2002", tokens);
assert.equal(page.renderedAs, "u_2002");
assert.equal(page.uploaderToken, "tok-u_1001-1", "the token belongs to whoever is signed in");`,
      },
      {
        name: "no token is ever issued to the subject",
        isHidden: true,
        source: `var v = require("src/profile/viewAs");
var tokens = require("src/profile/tokens").create();
v.renderPage({ userId: "u_1001" }, "u_2002", tokens);
v.renderPage({ userId: "u_1001" }, "u_3003", tokens);
assert.equal(tokens.issued.map(function (t) { return t.owner; }), ["u_1001", "u_1001"]);`,
      },
      {
        name: "the context keeps viewer and subject apart",
        isHidden: true,
        source: `var v = require("src/profile/viewAs");
assert.equal(v.buildContext({ userId: "a" }, "b"), { viewer: "a", user: "b", viewAs: true });
assert.equal(v.buildContext({ userId: "a" }, "a"), { viewer: "a", user: "a", viewAs: false });`,
      },
    ],
    fixedFiles: {
      "src/profile/viewAs.js": `exports.buildContext = function (session, subjectId) {
  var viewAs = !!subjectId && subjectId !== session.userId;
  return {
    viewer: session.userId,
    user: viewAs ? subjectId : session.userId,
    viewAs: viewAs
  };
};

exports.renderComposer = function (ctx, tokens) {
  // ctx.user is who the page is rendered AS; in View As mode that is someone
  // else. Credentials are only ever minted for the authenticated viewer.
  var token = tokens.mint(ctx.viewer);
  return { renderedAs: ctx.user, uploaderToken: token.token };
};

exports.renderPage = function (session, subjectId, tokens) {
  return exports.renderComposer(exports.buildContext(session, subjectId), tokens);
};
`,
    },
  },

  {
    title: "The Exchange That Could Not List Itself",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Parsing", "Validation"],
    description: `Modelled on **BATS Global Markets' own IPO (23 March 2012)**: BATS listed its shares on its own exchange, and on the day a software bug affected trading in symbols in the range from A to BFZZZ — a range that included the BATS ticker itself. The company withdrew the IPO the same day.

BATS did not publish the faulty code; this project is a reconstruction of a range-routing mistake of that kind. \`router.js\` sends a symbol to the matching unit that owns its alphabetical range, but it scans the table with the wrong comparison and never checks the upper bound.

Fix \`route\` so every symbol reaches exactly the unit whose range contains it.`,
    bugReport: `**BUG-BATS-IPO** · Priority: P0 · Reported by: market operations

route(table, symbol) — table rows are { lo, hi, unit }, both bounds INCLUSIVE:
- the symbol is compared upper-cased, as a plain string
- return the unit of the row with lo <= symbol <= hi
- a symbol on a boundary belongs to the row that names it ("BG" -> the row
  whose lo is "BG"; "A" -> the row whose lo is "A")
- a symbol that falls in no row returns null — never a neighbouring unit

Observed: symbols equal to a range's lower bound went to the wrong unit (or
nowhere), and symbols in an unassigned gap were routed anyway.`,
    logs: `[router] BG -> U1 (expected U2)
[router] A -> null`,
    files: [
      {
        filePath: "src/exchange/router.js",
        isEditable: true,
        language: "javascript",
        content: `// Sends each symbol to the matching unit that owns its range.
exports.route = function (table, symbol) {
  var s = String(symbol).toUpperCase();
  for (var i = table.length - 1; i >= 0; i--) {
    if (s > table[i].lo) return table[i].unit;
  }
  return null;
};
`,
      },
      {
        filePath: "src/exchange/partitions.js",
        isEditable: false,
        language: "javascript",
        content: `// Production partition table, sorted by lo. Bounds are inclusive.
exports.TABLE = [
  { lo: "A", hi: "BFZZZ", unit: "U1" },
  { lo: "BG", hi: "MZZZZ", unit: "U2" },
  { lo: "N", hi: "ZZZZZ", unit: "U3" }
];
`,
      },
    ],
    tests: [
      {
        name: "ordinary symbols reach their unit",
        isHidden: false,
        source: `var r = require("src/exchange/router");
var T = require("src/exchange/partitions").TABLE;
assert.equal(r.route(T, "AAPL"), "U1");
assert.equal(r.route(T, "BATS"), "U1");
assert.equal(r.route(T, "MSFT"), "U2");
assert.equal(r.route(T, "NVDA"), "U3");`,
      },
      {
        name: "a symbol on a lower bound belongs to that row",
        isHidden: false,
        source: `var r = require("src/exchange/router");
var T = require("src/exchange/partitions").TABLE;
assert.equal(r.route(T, "BG"), "U2");`,
      },
      {
        name: "the very first symbol and the upper bounds",
        isHidden: true,
        source: `var r = require("src/exchange/router");
var T = require("src/exchange/partitions").TABLE;
assert.equal(r.route(T, "A"), "U1");
assert.equal(r.route(T, "BFZZZ"), "U1");
assert.equal(r.route(T, "ZZZZZ"), "U3");`,
      },
      {
        name: "symbols are compared upper-cased",
        isHidden: true,
        source: `var r = require("src/exchange/router");
var T = require("src/exchange/partitions").TABLE;
assert.equal(r.route(T, "bats"), "U1");
assert.equal(r.route(T, "n"), "U3");`,
      },
      {
        name: "a gap in the table routes nowhere",
        isHidden: true,
        source: `var r = require("src/exchange/router");
var T = [{ lo: "A", hi: "CZZZZ", unit: "U1" }, { lo: "M", hi: "ZZZZZ", unit: "U3" }];
assert.equal(r.route(T, "GOOG"), null);
assert.equal(r.route(T, "C"), "U1");`,
      },
    ],
    fixedFiles: {
      "src/exchange/router.js": `// Sends each symbol to the matching unit that owns its range.
exports.route = function (table, symbol) {
  var s = String(symbol).toUpperCase();
  // Both bounds are inclusive and both must hold: a strict ">" on lo lost
  // every boundary symbol, and ignoring hi routed gaps to a neighbour.
  for (var i = 0; i < table.length; i++) {
    if (s >= table[i].lo && s <= table[i].hi) return table[i].unit;
  }
  return null;
};
`,
    },
  },

  {
    title: "The Share Price That Outgrew Its Integer",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Money"],
    description: `Modelled on **Nasdaq and Berkshire Hathaway (May 2021)**: Nasdaq's systems stored prices as an unsigned 32-bit integer with four implied decimal places, so the largest price they could represent was $429,496.7295. Berkshire Hathaway's Class A shares were approaching that figure, and Nasdaq had to upgrade its systems to a wider price field.

This project is a reconstruction in Java, which has no unsigned int. \`Price.parse\` turns a decimal price into ticks of 1/10,000 — computing in \`int\` before widening to \`long\`, so large prices wrap long before the old 32-bit ceiling.

Fix \`Price.parse\` so any realistic price is represented exactly.`,
    bugReport: `**BUG-BRKA** · Priority: High · Reported by: market data

Price.parse(text) returns the price in ticks (1 tick = 0.0001) as a long:
- "150.25" -> 1502500, "437131" -> 4371310000
- up to four decimal places; missing places are zeros
- the whole-dollar part may be any non-negative value up to at least
  100,000,000 — the result must never wrap
Price.format(ticks) prints whole dollars, ".", then exactly four digits.
Price.notional(ticks, quantity) = ticks * quantity, as a long.

Observed: a quote of 437131.00 parsed to 76342704 ticks — a price of 7634.2704.`,
    logs: `[quotes] BRK.A last=437131.00 ticks=76342704
[quotes] BRK.A print rejected: move of -98% vs previous close`,
    files: [
      {
        filePath: "src/quotes/Price.java",
        isEditable: true,
        language: "java",
        content: `class Price {
    static final int SCALE = 10000;

    static long parse(String text) {
        String[] parts = text.split("\\\\.");
        int whole = Integer.parseInt(parts[0]);
        int frac = 0;
        if (parts.length > 1) {
            frac = Integer.parseInt((parts[1] + "0000").substring(0, 4));
        }
        return whole * SCALE + frac;
    }

    static String format(long ticks) {
        return (ticks / SCALE) + "." + String.format("%04d", ticks % SCALE);
    }

    static long notional(long ticks, int quantity) {
        return ticks * quantity;
    }
}
`,
      },
      {
        filePath: "src/quotes/LegacyFeed.java",
        isEditable: false,
        language: "java",
        content: `class LegacyFeed {
    // The legacy price field: an UNSIGNED 32-bit tick count with four implied
    // decimals, so at most 4,294,967,295 ticks ($429,496.7295).
    static final long LEGACY_MAX_TICKS = 4294967295L;

    static boolean fitsLegacy(long ticks) {
        return ticks >= 0 && ticks <= LEGACY_MAX_TICKS;
    }
}
`,
      },
    ],
    tests: [
      {
        name: "ordinary prices parse",
        isHidden: false,
        source: `                BugAssert.equal(Price.parse("150.25"), 1502500L);
                BugAssert.equal(Price.format(Price.parse("150.25")), "150.2500");`,
      },
      {
        name: "a Berkshire Class A price parses exactly",
        isHidden: false,
        source: `                BugAssert.equal(Price.parse("437131.00"), 4371310000L, "must not wrap");
                BugAssert.equal(Price.format(Price.parse("437131")), "437131.0000");`,
      },
      {
        name: "the old 32-bit ceiling is crossed cleanly",
        isHidden: true,
        source: `                BugAssert.equal(Price.parse("429496.7295"), 4294967295L);
                BugAssert.equal(Price.parse("429496.7296"), 4294967296L);
                BugAssert.ok(!LegacyFeed.fitsLegacy(Price.parse("429496.7296")), "no longer fits the legacy field");
                BugAssert.equal(Price.parse("214748.3648"), 2147483648L);`,
      },
      {
        name: "notional and very large prices stay exact",
        isHidden: true,
        source: `                BugAssert.equal(Price.notional(Price.parse("437131"), 3), 13113930000L);
                BugAssert.equal(Price.parse("100000000.0001"), 1000000000001L);`,
      },
    ],
    fixedFiles: {
      "src/quotes/Price.java": `class Price {
    static final int SCALE = 10000;

    static long parse(String text) {
        String[] parts = text.split("\\\\.");
        // int * int is computed in 32 bits and wraps before it is widened; do
        // the arithmetic in long from the start.
        long whole = Long.parseLong(parts[0]);
        long frac = 0;
        if (parts.length > 1) {
            frac = Long.parseLong((parts[1] + "0000").substring(0, 4));
        }
        return whole * SCALE + frac;
    }

    static String format(long ticks) {
        return (ticks / SCALE) + "." + String.format("%04d", ticks % SCALE);
    }

    static long notional(long ticks, int quantity) {
        return ticks * quantity;
    }
}
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE15_ORIGINS: Record<string, string> = {
  "The Drain Order That Matched Too Much": "Google · 2019",
  "The Class Path Nobody Denied": "Spring · CVE-2022-22965",
  "The Key That Joined the Wrong Repository": "GitHub · 2012",
  "The Zero Root Everyone Trusted": "Nomad · 2022",
  "The Donation That Skipped the Health Check": "Euler Finance · 2023",
  "The Week Number That Went Back to 1999": "GPS week rollover · 2019",
  "The Break That Left the Switch": "AT&T · 1990",
  "Debts Averaged Out of Thin Air": "Robodebt (Australia) · 2016–2019",
  "The Fsync That Lied on Retry": "PostgreSQL · fsyncgate 2018",
  "The Migration That Unblocked Everyone": "Facebook · 2018",
  "The Plague the Pets Carried": "World of Warcraft · 2005",
  "Java, Newline, Script": "MySpace · Samy worm 2005",
  "The Preview That Minted Someone Else's Token": "Facebook · View As 2018",
  "The Exchange That Could Not List Itself": "BATS Global Markets · 2012",
  "The Share Price That Outgrew Its Integer": "Nasdaq · 2021",
};
