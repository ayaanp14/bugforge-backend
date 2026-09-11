/**
 * Wave 12 — infrastructure and platform outages, one planted bug each.
 *
 * Project files are Node 12-safe JS: no ??, ?., replaceAll, .at() or .flat().
 * Locked context files must be valid JS (the judge wraps every file as a
 * CommonJS module), so they carry their notes in a block comment.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE12: BugSpec[] = [

  {
    title: "The Route Leak Nobody Filtered",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Validation"],
    description: `Modelled on the **Verizon/Cloudflare BGP leak** (24 June 2019): a small ISP's route optimiser re-announced huge swathes of the internet as its own, and Verizon accepted the announcements without any prefix or AS-path filter. Traffic for Cloudflare, Amazon and Linode was black-holed for around two hours.

\`bgp.js\` decides whether to accept an announced route and applies no policy at all.

Fix \`acceptRoute\` so announcements outside the peer's policy are rejected.`,
    bugReport: `**BUG-AS396531** · Priority: Critical · Reported by: network engineering

acceptRoute(route, policy) must accept a route only when ALL hold:
- route.prefixLen is at most policy.maxPrefixLen (more specific is a red flag)
- route.asPath.length is at most policy.maxAsPath
- route.asPath[0] is in policy.allowedOrigins

Observed: every announcement from the peer is accepted, including a /24 with a
20-hop path originated by an AS we have never heard of.`,
    logs: `[bgp] accepted prefix=104.16.0.0/24 asPath=20 hops origin=AS33154
[bgp] 20% of global traffic now pointed at a 20Gbps peer`,
    files: [
      {
        filePath: "src/net/bgp.js",
        isEditable: true,
        language: "javascript",
        content: `// Decides whether to install an announced route.
exports.acceptRoute = function (route, policy) {
  return true;
};
`,
      },
      {
        filePath: "src/net/POLICY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A peer announcement is only trustworthy inside the agreed policy. All three
checks are independent and all three must pass. A more-specific prefix wins
routing decisions globally, so the prefix-length ceiling is the important one.
*/
`,
      },
    ],
    tests: [
      {
        name: "a policy-compliant route is accepted",
        isHidden: false,
        source: `var a = require("src/net/bgp").acceptRoute;
var policy = { maxPrefixLen: 22, maxAsPath: 5, allowedOrigins: ["AS13335"] };
assert.equal(a({ prefixLen: 20, asPath: ["AS13335", "AS701"] }, policy), true);`,
      },
      {
        name: "an over-specific prefix is rejected",
        isHidden: false,
        source: `var a = require("src/net/bgp").acceptRoute;
var policy = { maxPrefixLen: 22, maxAsPath: 5, allowedOrigins: ["AS13335"] };
assert.equal(a({ prefixLen: 24, asPath: ["AS13335"] }, policy), false, "a /24 beyond the ceiling must be filtered");`,
      },
      {
        name: "an unknown origin is rejected",
        isHidden: false,
        source: `var a = require("src/net/bgp").acceptRoute;
var policy = { maxPrefixLen: 22, maxAsPath: 5, allowedOrigins: ["AS13335"] };
assert.equal(a({ prefixLen: 20, asPath: ["AS33154", "AS701"] }, policy), false);`,
      },
      {
        name: "an absurdly long AS path is rejected",
        isHidden: true,
        source: `var a = require("src/net/bgp").acceptRoute;
var policy = { maxPrefixLen: 22, maxAsPath: 5, allowedOrigins: ["AS13335"] };
var path = [];
for (var i = 0; i < 20; i++) path.push(i === 0 ? "AS13335" : "AS" + i);
assert.equal(a({ prefixLen: 20, asPath: path }, policy), false);`,
      },
    ],
    fixedFiles: {
      "src/net/bgp.js": `// Decides whether to install an announced route.
exports.acceptRoute = function (route, policy) {
  // A more-specific prefix wins routing globally — this ceiling matters most.
  if (route.prefixLen > policy.maxPrefixLen) return false;
  if (route.asPath.length > policy.maxAsPath) return false;
  if (policy.allowedOrigins.indexOf(route.asPath[0]) === -1) return false;
  return true;
};
`,
    },
  },

  {
    title: "One Customer's Config Took Down the Edge",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Configuration", "Defensive Coding"],
    description: `Modelled on the **Fastly global outage** (8 June 2021): a latent bug shipped weeks earlier was triggered when one customer pushed a valid configuration change. 85% of the CDN's network started returning errors within a minute.

\`router.js\` resolves a hostname to a backend and assumes the backend map is always populated. A customer whose config legitimately has no explicit backends takes the whole request path down.

Fix \`resolveBackend\` so an empty or missing map degrades to the default backend instead of failing.`,
    bugReport: `**BUG-FASTLY** · Priority: Critical · Reported by: edge SRE

resolveBackend(config, host) must return:
- config.backends[host] when that entry exists
- config.defaultBackend when it does not, or when backends is missing/empty
- the string "origin" when there is no default either

Observed: a config whose \`backends\` object is absent throws, and a config whose
\`backends\` is empty returns undefined — both surface as a 503 for every request
served by that edge node.`,
    logs: `[edge] TypeError: Cannot read property 'www.example.com' of undefined
[edge] 85% of POPs returning 503`,
    files: [
      {
        filePath: "src/edge/router.js",
        isEditable: true,
        language: "javascript",
        content: `// Maps a hostname to the backend that should serve it.
exports.resolveBackend = function (config, host) {
  return config.backends[host];
};
`,
      },
      {
        filePath: "src/edge/CONTRACT.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Customer configuration is user input. Every optional field must degrade, not
throw: an edge node that cannot resolve a backend still has to serve the
default rather than fail the request.
*/
`,
      },
    ],
    tests: [
      {
        name: "an explicit backend is used",
        isHidden: false,
        source: `var r = require("src/edge/router").resolveBackend;
assert.equal(r({ backends: { "a.example": "pool-a" }, defaultBackend: "pool-d" }, "a.example"), "pool-a");`,
      },
      {
        name: "a missing backends map falls back",
        isHidden: false,
        source: `var r = require("src/edge/router").resolveBackend;
assert.equal(r({ defaultBackend: "pool-d" }, "a.example"), "pool-d", "an absent map must not throw");`,
      },
      {
        name: "an empty backends map falls back",
        isHidden: false,
        source: `var r = require("src/edge/router").resolveBackend;
assert.equal(r({ backends: {}, defaultBackend: "pool-d" }, "a.example"), "pool-d");`,
      },
      {
        name: "with no default at all the origin is used",
        isHidden: true,
        source: `var r = require("src/edge/router").resolveBackend;
assert.equal(r({}, "a.example"), "origin");
assert.equal(r({ backends: {} }, "zzz.example"), "origin");`,
      },
    ],
    fixedFiles: {
      "src/edge/router.js": `// Maps a hostname to the backend that should serve it.
exports.resolveBackend = function (config, host) {
  // Customer config is user input: every optional field degrades, never throws.
  var backends = config.backends;
  if (backends && backends.hasOwnProperty(host)) return backends[host];
  if (config.defaultBackend) return config.defaultBackend;
  return "origin";
};
`,
    },
  },

  {
    title: "Both Halves Thought They Were Primary",
    difficulty: "hard",
    category: "database",
    language: "javascript",
    tags: ["Consensus", "Split Brain"],
    description: `Modelled on the **GitHub outage of 21 October 2018**: a 43-second network partition let automated failover promote a second primary on the other coast. Writes landed on both sides, and reconciling them took over 24 hours of degraded service.

\`replica.js\` accepts a write on whichever node receives it, with no quorum check.

Fix \`commitWrite\` so a node only commits when it can see a majority of the cluster.`,
    bugReport: `**BUG-GH1021** · Priority: Critical (data divergence) · Reported by: database SRE

commitWrite(cluster, nodeId, value) must:
- commit only if the node is reachable AND a strict majority of the cluster's
  nodes are reachable from it
- on commit, append the value to that node's log and return true
- otherwise change nothing and return false

Observed: after a partition, both sides accept writes and the logs diverge.`,
    logs: `[repl] node=us-east committed seq=91002 (visible peers: 2 of 5)
[repl] node=us-west committed seq=91002 (visible peers: 3 of 5)`,
    files: [
      {
        filePath: "src/db/replica.js",
        isEditable: true,
        language: "javascript",
        content: `// Commits a write on the given node.
exports.commitWrite = function (cluster, nodeId, value) {
  var node = cluster.nodes[nodeId];
  node.log.push(value);
  return true;
};
`,
      },
      {
        filePath: "src/db/QUORUM.js",
        isEditable: false,
        language: "javascript",
        content: `/*
cluster.nodes maps a node id to { reachable: bool, visiblePeers: [ids], log: [] }.
A node may only commit when it can see a strict majority of the cluster,
counting itself. Anything less risks a second primary on the other side of a
partition.
*/
`,
      },
    ],
    tests: [
      {
        name: "a node with a majority commits",
        isHidden: false,
        source: `var c = require("src/db/replica").commitWrite;
var cluster = { nodes: {
  a: { reachable: true, visiblePeers: ["b", "c"], log: [] },
  b: { reachable: true, visiblePeers: ["a"], log: [] },
  c: { reachable: true, visiblePeers: ["a"], log: [] }
} };
assert.equal(c(cluster, "a", "w1"), true);
assert.equal(cluster.nodes.a.log, ["w1"]);`,
      },
      {
        name: "the minority side refuses to commit",
        isHidden: false,
        source: `var c = require("src/db/replica").commitWrite;
var cluster = { nodes: {
  a: { reachable: true, visiblePeers: [], log: [] },
  b: { reachable: true, visiblePeers: ["c"], log: [] },
  c: { reachable: true, visiblePeers: ["b"], log: [] }
} };
assert.equal(c(cluster, "a", "w1"), false, "one of three is not a majority");
assert.equal(cluster.nodes.a.log, []);`,
      },
      {
        name: "an unreachable node never commits",
        isHidden: true,
        source: `var c = require("src/db/replica").commitWrite;
var cluster = { nodes: {
  a: { reachable: false, visiblePeers: ["b", "c"], log: [] },
  b: { reachable: true, visiblePeers: [], log: [] },
  c: { reachable: true, visiblePeers: [], log: [] }
} };
assert.equal(c(cluster, "a", "w1"), false);
assert.equal(cluster.nodes.a.log, []);`,
      },
      {
        name: "exactly half is not a majority",
        isHidden: true,
        source: `var c = require("src/db/replica").commitWrite;
var cluster = { nodes: {
  a: { reachable: true, visiblePeers: ["b"], log: [] },
  b: { reachable: true, visiblePeers: ["a"], log: [] },
  c: { reachable: true, visiblePeers: ["d"], log: [] },
  d: { reachable: true, visiblePeers: ["c"], log: [] }
} };
assert.equal(c(cluster, "a", "w1"), false, "2 of 4 is a tie, not a majority");`,
      },
    ],
    fixedFiles: {
      "src/db/replica.js": `// Commits a write on the given node.
exports.commitWrite = function (cluster, nodeId, value) {
  var node = cluster.nodes[nodeId];
  if (!node || !node.reachable) return false;
  var total = Object.keys(cluster.nodes).length;
  // Count self plus visible peers; a strict majority is required, so a tie on
  // an even cluster is not enough.
  var visible = 1 + node.visiblePeers.length;
  if (visible * 2 <= total) return false;
  node.log.push(value);
  return true;
};
`,
    },
  },

  {
    title: "Zero Usage Meant Zero Quota",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Quotas", "Missing Data"],
    description: `Modelled on **Google's authentication outage** (14 December 2020): a storage migration left the user-ID service reporting zero usage. The automated quota system read that as "needs nothing" and cut its allocation to zero, so every service requiring a Google login failed for about 45 minutes.

\`quota.js\` sets an allocation straight from the reported usage, with no way to tell "genuinely idle" from "no data".

Fix \`computeQuota\` so a missing or stale report keeps the previous allocation rather than dropping to zero.`,
    bugReport: `**BUG-GOOG1214** · Priority: Critical · Reported by: identity SRE

computeQuota(report, previous, minimum) must return:
- previous, when report is missing/null or report.stale is true — an absent
  signal is not evidence of idleness
- max(minimum, report.usage * 2) otherwise, so a live service always keeps a
  usable floor

Observed: a stale report with usage 0 sets the allocation to 0, and the service
cannot serve a single request afterwards.`,
    logs: `[quota] service=user-id allocation 0 (reported usage: 0, report age: 41h)
[quota] user-id rejecting 100% of requests: OUT_OF_QUOTA`,
    files: [
      {
        filePath: "src/quota/quota.js",
        isEditable: true,
        language: "javascript",
        content: `// Recomputes a service's quota allocation.
exports.computeQuota = function (report, previous, minimum) {
  return report.usage * 2;
};
`,
      },
      {
        filePath: "src/quota/RULES.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Absence of a signal is not a signal. A quota system that reduces an allocation
based on missing data will eventually starve a healthy service. Hold the
previous value and let a human look at it.
*/
`,
      },
    ],
    tests: [
      {
        name: "a live report doubles the usage",
        isHidden: false,
        source: `var q = require("src/quota/quota").computeQuota;
assert.equal(q({ usage: 500, stale: false }, 900, 100), 1000);`,
      },
      {
        name: "a stale report keeps the previous allocation",
        isHidden: false,
        source: `var q = require("src/quota/quota").computeQuota;
assert.equal(q({ usage: 0, stale: true }, 900, 100), 900, "missing data must never mean zero quota");`,
      },
      {
        name: "a null report keeps the previous allocation",
        isHidden: false,
        source: `var q = require("src/quota/quota").computeQuota;
assert.equal(q(null, 750, 100), 750);`,
      },
      {
        name: "a genuinely idle service keeps the floor",
        isHidden: true,
        source: `var q = require("src/quota/quota").computeQuota;
assert.equal(q({ usage: 0, stale: false }, 900, 100), 100);
assert.equal(q({ usage: 10, stale: false }, 900, 100), 100);`,
      },
    ],
    fixedFiles: {
      "src/quota/quota.js": `// Recomputes a service's quota allocation.
exports.computeQuota = function (report, previous, minimum) {
  // Absence of a signal is not a signal: hold the previous allocation.
  if (!report || report.stale) return previous;
  var target = report.usage * 2;
  // A live service always keeps a usable floor.
  return target < minimum ? minimum : target;
};
`,
    },
  },

  {
    title: "Scaled Down Overnight, Trampled at Dawn",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Autoscaling", "Thundering Herd"],
    description: `Modelled on **Slack's outage of 4 January 2021**: the fleet scaled down over the quiet holidays, then the first working day of the year brought everyone back at once. The autoscaler could not add capacity fast enough, and the resulting overload took the service down for hours.

\`autoscaler.js\` sizes the fleet purely on current load, with no floor and no rate limit.

Fix \`scaleTarget\` so it never drops below a floor and never scales down faster than the configured step.`,
    bugReport: `**BUG-SLACK0104** · Priority: High · Reported by: capacity SRE

scaleTarget(current, load, config) must return the next fleet size, where:
- the raw target is load / config.perInstanceCapacity, rounded up
- the result is never below config.minInstances
- a scale-DOWN never removes more than config.maxScaleDownStep instances at once
- scaling up is not rate limited

Observed: an overnight lull takes the fleet from 400 instances to 2 in one step,
and the morning ramp cannot recover.`,
    logs: `[autoscale] target 2 (from 400) load=95 rps
[autoscale] 09:02 load=42000 rps, healthy instances 4, queue depth 1.2M`,
    files: [
      {
        filePath: "src/scale/autoscaler.js",
        isEditable: true,
        language: "javascript",
        content: `// Computes the next fleet size from the current load.
exports.scaleTarget = function (current, load, config) {
  return Math.ceil(load / config.perInstanceCapacity);
};
`,
      },
      {
        filePath: "src/scale/CONFIG.js",
        isEditable: false,
        language: "javascript",
        content: `/*
config = { perInstanceCapacity, minInstances, maxScaleDownStep }.
Scaling up is cheap and urgent; scaling down is an optimisation and must be
gradual. A fleet that has shrunk too far cannot grow back before the traffic
arrives.
*/
`,
      },
    ],
    tests: [
      {
        name: "scaling up is immediate",
        isHidden: false,
        source: `var s = require("src/scale/autoscaler").scaleTarget;
var config = { perInstanceCapacity: 100, minInstances: 20, maxScaleDownStep: 10 };
assert.equal(s(20, 5000, config), 50, "scale-up must not be throttled");`,
      },
      {
        name: "scaling down is gradual",
        isHidden: false,
        source: `var s = require("src/scale/autoscaler").scaleTarget;
var config = { perInstanceCapacity: 100, minInstances: 20, maxScaleDownStep: 10 };
assert.equal(s(400, 95, config), 390, "at most 10 instances may be removed per step");`,
      },
      {
        name: "the floor is respected",
        isHidden: false,
        source: `var s = require("src/scale/autoscaler").scaleTarget;
var config = { perInstanceCapacity: 100, minInstances: 20, maxScaleDownStep: 100 };
assert.equal(s(25, 0, config), 20);`,
      },
      {
        name: "a small legitimate scale-down still happens",
        isHidden: true,
        source: `var s = require("src/scale/autoscaler").scaleTarget;
var config = { perInstanceCapacity: 100, minInstances: 5, maxScaleDownStep: 10 };
assert.equal(s(30, 2500, config), 25);`,
      },
    ],
    fixedFiles: {
      "src/scale/autoscaler.js": `// Computes the next fleet size from the current load.
exports.scaleTarget = function (current, load, config) {
  var target = Math.ceil(load / config.perInstanceCapacity);
  // A fleet that shrank too far cannot grow back before the traffic arrives.
  if (target < config.minInstances) target = config.minInstances;
  if (target < current) {
    var floor = current - config.maxScaleDownStep;
    if (target < floor) target = floor;
    if (target < config.minInstances) target = config.minInstances;
  }
  return target;
};
`,
    },
  },

  {
    title: "The Node Update That Cut the Network",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Deployments", "Draining"],
    description: `Modelled on the **Datadog outage of 8 March 2023**: a routine security update to \`systemd-networkd\` restarted networking on nodes that were still running workloads, severing their container network. Tens of thousands of nodes across three clouds went down at once.

\`updater.js\` applies updates to a node without checking whether the update class is disruptive.

Fix \`applyNodeUpdate\` so a network-class update drains the node's workloads first.`,
    bugReport: `**BUG-DD0308** · Priority: Critical · Reported by: platform

applyNodeUpdate(node, update) must return { applied, drained }:
- an update with kind "network" requires the node to be drained first — set
  node.workloads to [] and drained to true before applying
- any other kind applies in place with drained false
- a node already marked cordoned:false must be cordoned before draining

Observed: a network update is applied while workloads are still scheduled, and
they lose connectivity with no chance to move.`,
    logs: `[node] applied kind=network workloads_running=48
[node] 0/48 workloads reachable after restart`,
    files: [
      {
        filePath: "src/ops/updater.js",
        isEditable: true,
        language: "javascript",
        content: `// Applies a maintenance update to a node.
exports.applyNodeUpdate = function (node, update) {
  node.version = update.version;
  return { applied: true, drained: false };
};
`,
      },
      {
        filePath: "src/ops/LIFECYCLE.js",
        isEditable: false,
        language: "javascript",
        content: `/*
node = { version, cordoned: bool, workloads: [names] }.
A disruptive update must cordon the node (so nothing new lands on it) and drain
its workloads (so they reschedule elsewhere) before it is applied.
*/
`,
      },
    ],
    tests: [
      {
        name: "a benign update applies in place",
        isHidden: false,
        source: `var u = require("src/ops/updater").applyNodeUpdate;
var node = { version: 1, cordoned: false, workloads: ["a", "b"] };
assert.equal(u(node, { kind: "package", version: 2 }), { applied: true, drained: false });
assert.equal(node.workloads, ["a", "b"]);
assert.equal(node.version, 2);`,
      },
      {
        name: "a network update drains first",
        isHidden: false,
        source: `var u = require("src/ops/updater").applyNodeUpdate;
var node = { version: 1, cordoned: false, workloads: ["a", "b"] };
assert.equal(u(node, { kind: "network", version: 3 }), { applied: true, drained: true }, "workloads must move before the network restarts");
assert.equal(node.workloads, []);
assert.equal(node.cordoned, true);
assert.equal(node.version, 3);`,
      },
      {
        name: "an already cordoned node still drains",
        isHidden: true,
        source: `var u = require("src/ops/updater").applyNodeUpdate;
var node = { version: 1, cordoned: true, workloads: ["x"] };
assert.equal(u(node, { kind: "network", version: 4 }), { applied: true, drained: true });
assert.equal(node.workloads, []);`,
      },
      {
        name: "an empty network node applies cleanly",
        isHidden: true,
        source: `var u = require("src/ops/updater").applyNodeUpdate;
var node = { version: 1, cordoned: false, workloads: [] };
assert.equal(u(node, { kind: "network", version: 5 }), { applied: true, drained: true });
assert.equal(node.version, 5);`,
      },
    ],
    fixedFiles: {
      "src/ops/updater.js": `// Applies a maintenance update to a node.
exports.applyNodeUpdate = function (node, update) {
  if (update.kind === "network") {
    // Cordon so nothing new lands here, then drain so running workloads can
    // reschedule before their network is restarted underneath them.
    node.cordoned = true;
    node.workloads = [];
    node.version = update.version;
    return { applied: true, drained: true };
  }
  node.version = update.version;
  return { applied: true, drained: false };
};
`,
    },
  },

  {
    title: "The Label That Kubernetes Removed",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Migration", "Deprecation"],
    description: `Modelled on **Reddit's Pi-Day outage** (14 March 2023): a Kubernetes upgrade to 1.24 removed the long-deprecated \`master\` node label. Calico's route calculation still keyed on it, so the cluster's network layer silently misrouted and the site was down for several hours.

\`topology.js\` reads only the legacy label and has no fallback.

Fix \`roleOf\` so the modern label is honoured and the legacy one remains a fallback.`,
    bugReport: `**BUG-REDDIT314** · Priority: Critical · Reported by: compute

roleOf(node) must return the node's role, preferring the modern label:
- "node-role.kubernetes.io/control-plane" wins if present
- otherwise the legacy "node-role.kubernetes.io/master"
- otherwise "worker"

Observed: after the upgrade only the legacy key exists on old nodes and only
the modern key on new ones. Reading one key alone mislabels half the cluster.`,
    logs: `[topology] node ip-10-0-3-14 role=worker (expected control-plane)
[topology] route table built from 0 control-plane nodes`,
    files: [
      {
        filePath: "src/k8s/topology.js",
        isEditable: true,
        language: "javascript",
        content: `// Determines a node's role from its labels.
exports.roleOf = function (node) {
  if (node.labels["node-role.kubernetes.io/master"] !== undefined) {
    return "control-plane";
  }
  return "worker";
};
`,
      },
      {
        filePath: "src/k8s/LABELS.js",
        isEditable: false,
        language: "javascript",
        content: `/*
During a rolling upgrade both label spellings exist in the same cluster. Code
that reads only one of them will be wrong for half the nodes for the entire
duration of the migration.
*/
`,
      },
    ],
    tests: [
      {
        name: "the modern label is recognised",
        isHidden: false,
        source: `var r = require("src/k8s/topology").roleOf;
assert.equal(r({ labels: { "node-role.kubernetes.io/control-plane": "" } }), "control-plane");`,
      },
      {
        name: "the legacy label still works",
        isHidden: false,
        source: `var r = require("src/k8s/topology").roleOf;
assert.equal(r({ labels: { "node-role.kubernetes.io/master": "" } }), "control-plane");`,
      },
      {
        name: "a plain node is a worker",
        isHidden: true,
        source: `var r = require("src/k8s/topology").roleOf;
assert.equal(r({ labels: {} }), "worker");
assert.equal(r({ labels: { "kubernetes.io/os": "linux" } }), "worker");`,
      },
      {
        name: "both labels present is still control-plane",
        isHidden: true,
        source: `var r = require("src/k8s/topology").roleOf;
assert.equal(r({ labels: { "node-role.kubernetes.io/master": "", "node-role.kubernetes.io/control-plane": "" } }), "control-plane");`,
      },
    ],
    fixedFiles: {
      "src/k8s/topology.js": `// Determines a node's role from its labels.
exports.roleOf = function (node) {
  // Both spellings coexist for the whole duration of a rolling upgrade.
  if (node.labels["node-role.kubernetes.io/control-plane"] !== undefined) {
    return "control-plane";
  }
  if (node.labels["node-role.kubernetes.io/master"] !== undefined) {
    return "control-plane";
  }
  return "worker";
};
`,
    },
  },

  {
    title: "Half the Servers Had the Old Config",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Configuration", "Consistency"],
    description: `Modelled on the **NYSE trading halt of 8 July 2015**: a configuration update was loaded onto some gateway servers but not all of them. The mismatch produced inconsistent behaviour on the open, and trading was suspended for nearly four hours.

\`startup.js\` opens the market as soon as the servers are up, without checking that they agree.

Fix \`canOpenMarket\` so trading only starts when every server carries the same config version.`,
    bugReport: `**BUG-NYSE0708** · Priority: Critical · Reported by: market operations

canOpenMarket(servers) must return { open, reason }:
- { open: false, reason: "offline" } if any server is not up
- { open: false, reason: "config-mismatch" } if the servers do not all report
  the same configVersion
- { open: true, reason: "ok" } otherwise

Observed: the market opens with mixed config versions and orders are handled
inconsistently depending on which gateway receives them.`,
    logs: `[gateway] open=true versions seen: {"2015.07.07":12,"2015.07.08":9}
[gateway] order routing inconsistent across gateways; halting`,
    files: [
      {
        filePath: "src/market/startup.js",
        isEditable: true,
        language: "javascript",
        content: `// Decides whether the market may open.
exports.canOpenMarket = function (servers) {
  for (var i = 0; i < servers.length; i++) {
    if (!servers[i].up) return { open: false, reason: "offline" };
  }
  return { open: true, reason: "ok" };
};
`,
      },
      {
        filePath: "src/market/PREFLIGHT.js",
        isEditable: false,
        language: "javascript",
        content: `/*
servers = [{ id, up: bool, configVersion: string }].
Every gateway must agree on the configuration before the open. A partial
rollout is worse than no rollout: identical orders take different paths.
*/
`,
      },
    ],
    tests: [
      {
        name: "matching versions open the market",
        isHidden: false,
        source: `var c = require("src/market/startup").canOpenMarket;
assert.equal(c([
  { id: "g1", up: true, configVersion: "2015.07.08" },
  { id: "g2", up: true, configVersion: "2015.07.08" }
]), { open: true, reason: "ok" });`,
      },
      {
        name: "mixed versions block the open",
        isHidden: false,
        source: `var c = require("src/market/startup").canOpenMarket;
assert.equal(c([
  { id: "g1", up: true, configVersion: "2015.07.07" },
  { id: "g2", up: true, configVersion: "2015.07.08" }
]), { open: false, reason: "config-mismatch" }, "a partial rollout must not open the market");`,
      },
      {
        name: "an offline server blocks the open",
        isHidden: true,
        source: `var c = require("src/market/startup").canOpenMarket;
assert.equal(c([
  { id: "g1", up: false, configVersion: "v1" },
  { id: "g2", up: true, configVersion: "v1" }
]), { open: false, reason: "offline" });`,
      },
      {
        name: "a single server opens fine",
        isHidden: true,
        source: `var c = require("src/market/startup").canOpenMarket;
assert.equal(c([{ id: "g1", up: true, configVersion: "v9" }]), { open: true, reason: "ok" });`,
      },
    ],
    fixedFiles: {
      "src/market/startup.js": `// Decides whether the market may open.
exports.canOpenMarket = function (servers) {
  for (var i = 0; i < servers.length; i++) {
    if (!servers[i].up) return { open: false, reason: "offline" };
  }
  // A partial rollout is worse than no rollout: identical orders would take
  // different paths depending on which gateway received them.
  for (var j = 1; j < servers.length; j++) {
    if (servers[j].configVersion !== servers[0].configVersion) {
      return { open: false, reason: "config-mismatch" };
    }
  }
  return { open: true, reason: "ok" };
};
`,
    },
  },

  {
    title: "The Scheduler That Never Converged",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Optimisation", "Fallbacks"],
    description: `Modelled on the **Southwest Airlines meltdown** (December 2022): a storm produced far more crew reassignments than the scheduling system could resolve. The solver could not converge, staff fell back to phoning crews individually, and nearly 17,000 flights were cancelled.

\`scheduler.js\` iterates until it converges — and returns whatever half-finished state it happens to hold if it does not.

Fix \`solveSchedule\` so a run that fails to converge reports failure and returns the **last known-good** assignment instead of a partial one.`,
    bugReport: `**BUG-SWA1222** · Priority: Critical · Reported by: crew ops

solveSchedule(assignments, maxIterations) must return { converged, schedule }:
- it repeatedly resolves conflicts; a schedule is valid when no crew is
  double-booked
- if it converges within maxIterations, return { converged: true, schedule }
- if it does not, return { converged: false, schedule: <the last VALID state> },
  never a partially rewritten one

Observed: on a hard input the loop exhausts its budget and hands back a
schedule with crews double-booked, which downstream systems then act on.`,
    logs: `[crew] solver exhausted 500 iterations; emitted schedule with 214 conflicts
[crew] 16700 flights cancelled`,
    files: [
      {
        filePath: "src/crew/scheduler.js",
        isEditable: true,
        language: "javascript",
        content: `function conflicts(schedule) {
  var seen = {};
  var n = 0;
  for (var i = 0; i < schedule.length; i++) {
    var key = schedule[i].crew + "@" + schedule[i].slot;
    if (seen[key]) n++;
    seen[key] = true;
  }
  return n;
}
exports.conflicts = conflicts;

exports.solveSchedule = function (assignments, maxIterations) {
  var schedule = assignments.slice();
  for (var it = 0; it < maxIterations; it++) {
    if (conflicts(schedule) === 0) return { converged: true, schedule: schedule };
    // Nudge one conflicting assignment into the next slot and try again.
    for (var i = 0; i < schedule.length; i++) {
      var key = schedule[i].crew + "@" + schedule[i].slot;
      var dup = false;
      for (var j = 0; j < i; j++) {
        if (schedule[j].crew + "@" + schedule[j].slot === key) dup = true;
      }
      if (dup) {
        schedule[i] = { crew: schedule[i].crew, slot: schedule[i].slot + 1 };
        break;
      }
    }
  }
  return { converged: false, schedule: schedule };
};
`,
      },
      {
        filePath: "src/crew/SAFETY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A schedule that has been partially rewritten is not a plan — it is a draft.
Downstream systems act on whatever they are given, so a solver that fails must
hand back the last state it knows to be valid, and say clearly that it failed.
*/
`,
      },
    ],
    tests: [
      {
        name: "a clean schedule converges immediately",
        isHidden: false,
        source: `var s = require("src/crew/scheduler");
var out = s.solveSchedule([{ crew: "A", slot: 1 }, { crew: "B", slot: 1 }], 10);
assert.equal(out.converged, true);
assert.equal(s.conflicts(out.schedule), 0);`,
      },
      {
        name: "a solvable conflict is resolved",
        isHidden: false,
        source: `var s = require("src/crew/scheduler");
var out = s.solveSchedule([{ crew: "A", slot: 1 }, { crew: "A", slot: 1 }], 10);
assert.equal(out.converged, true);
assert.equal(s.conflicts(out.schedule), 0);`,
      },
      {
        name: "a failed run returns a valid schedule, not a partial one",
        isHidden: false,
        source: `var s = require("src/crew/scheduler");
var input = [];
for (var i = 0; i < 8; i++) input.push({ crew: "A", slot: 1 });
var out = s.solveSchedule(input, 2);
assert.equal(out.converged, false);
assert.equal(s.conflicts(out.schedule), 0, "a non-converged run must not emit a conflicting schedule");`,
      },
      {
        name: "the returned schedule is never empty for a non-empty input",
        isHidden: true,
        source: `var s = require("src/crew/scheduler");
var input = [];
for (var i = 0; i < 5; i++) input.push({ crew: "B", slot: 3 });
var out = s.solveSchedule(input, 1);
assert.ok(out.schedule.length > 0);
assert.equal(s.conflicts(out.schedule), 0);`,
      },
    ],
    fixedFiles: {
      "src/crew/scheduler.js": `function conflicts(schedule) {
  var seen = {};
  var n = 0;
  for (var i = 0; i < schedule.length; i++) {
    var key = schedule[i].crew + "@" + schedule[i].slot;
    if (seen[key]) n++;
    seen[key] = true;
  }
  return n;
}
exports.conflicts = conflicts;

// A conflict-free fallback: give every assignment its own slot. Not optimal,
// but valid — which is what downstream systems require.
function safeFallback(assignments) {
  var out = [];
  var next = {};
  for (var i = 0; i < assignments.length; i++) {
    var crew = assignments[i].crew;
    if (next[crew] === undefined) next[crew] = assignments[i].slot;
    out.push({ crew: crew, slot: next[crew] });
    next[crew] = next[crew] + 1;
  }
  return out;
}

exports.solveSchedule = function (assignments, maxIterations) {
  var schedule = assignments.slice();
  for (var it = 0; it < maxIterations; it++) {
    if (conflicts(schedule) === 0) return { converged: true, schedule: schedule };
    for (var i = 0; i < schedule.length; i++) {
      var key = schedule[i].crew + "@" + schedule[i].slot;
      var dup = false;
      for (var j = 0; j < i; j++) {
        if (schedule[j].crew + "@" + schedule[j].slot === key) dup = true;
      }
      if (dup) {
        schedule[i] = { crew: schedule[i].crew, slot: schedule[i].slot + 1 };
        break;
      }
    }
  }
  if (conflicts(schedule) === 0) return { converged: false, schedule: schedule };
  // Failed to converge: hand back something valid rather than a half-rewritten
  // draft that downstream systems would act on.
  return { converged: false, schedule: safeFallback(assignments) };
};
`,
    },
  },

  {
    title: "Twenty-One Fields, Twenty Supplied",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Parsing", "Bounds Checking"],
    description: `Modelled on the **CrowdStrike Falcon outage** (19 July 2024): a rapid-response content update carried fewer input fields than the sensor's template expected. The sensor read past the end of the supplied array, faulted in kernel mode, and around 8.5 million Windows machines blue-screened worldwide.

\`channel.js\` indexes fields straight out of the record with no count check.

Fix \`readTemplate\` so a record with the wrong field count is rejected before anything is read.`,
    bugReport: `**BUG-CS0719** · Priority: Critical · Reported by: sensor team

readTemplate(record, template) must return { ok, values }:
- template.indexes lists the field positions the template needs
- if record.fields has fewer entries than the highest index requires, the
  record is invalid: return { ok: false, values: [] }
- otherwise return { ok: true, values: <the fields at those indexes> }

Observed: a record with 20 fields is fed to a template that reads index 20, and
the read returns undefined — which downstream code dereferences.`,
    logs: `[sensor] template 291 read index 20 of a 20-field record -> undefined
[sensor] PAGE_FAULT_IN_NONPAGED_AREA`,
    files: [
      {
        filePath: "src/sensor/channel.js",
        isEditable: true,
        language: "javascript",
        content: `// Extracts the fields a template needs from a channel record.
exports.readTemplate = function (record, template) {
  var values = [];
  for (var i = 0; i < template.indexes.length; i++) {
    values.push(record.fields[template.indexes[i]]);
  }
  return { ok: true, values: values };
};
`,
      },
      {
        filePath: "src/sensor/FORMAT.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Content updates are data, and data is never trusted. Validate the shape of a
record against the template BEFORE reading any field: a read past the end is
undefined behaviour in the native sensor.
*/
`,
      },
    ],
    tests: [
      {
        name: "a well-formed record is read",
        isHidden: false,
        source: `var r = require("src/sensor/channel").readTemplate;
assert.equal(r({ fields: ["a", "b", "c", "d"] }, { indexes: [0, 3] }), { ok: true, values: ["a", "d"] });`,
      },
      {
        name: "a short record is rejected outright",
        isHidden: false,
        source: `var r = require("src/sensor/channel").readTemplate;
var fields = [];
for (var i = 0; i < 20; i++) fields.push("f" + i);
assert.equal(r({ fields: fields }, { indexes: [20] }), { ok: false, values: [] }, "a read past the end must be refused");`,
      },
      {
        name: "an empty record is rejected",
        isHidden: true,
        source: `var r = require("src/sensor/channel").readTemplate;
assert.equal(r({ fields: [] }, { indexes: [0] }), { ok: false, values: [] });`,
      },
      {
        name: "a template needing nothing succeeds",
        isHidden: true,
        source: `var r = require("src/sensor/channel").readTemplate;
assert.equal(r({ fields: [] }, { indexes: [] }), { ok: true, values: [] });`,
      },
    ],
    fixedFiles: {
      "src/sensor/channel.js": `// Extracts the fields a template needs from a channel record.
exports.readTemplate = function (record, template) {
  // Validate the shape BEFORE reading anything — a read past the end is
  // undefined behaviour in the native sensor.
  for (var i = 0; i < template.indexes.length; i++) {
    var idx = template.indexes[i];
    if (idx < 0 || idx >= record.fields.length) {
      return { ok: false, values: [] };
    }
  }
  var values = [];
  for (var j = 0; j < template.indexes.length; j++) {
    values.push(record.fields[template.indexes[j]]);
  }
  return { ok: true, values: values };
};
`,
    },
  },

  {
    title: "More Routes Than the Router Could Hold",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Resource Limits", "Atomicity"],
    description: `Modelled on the **Optus outage of 8 November 2023**: a routing information change propagated from an upstream peer exceeded a preset limit on the routers, which then disconnected themselves from the network. Around 10 million customers lost service for most of a day.

\`routing.js\` installs routes one at a time and stops when it runs out of room, leaving the table half-updated.

Fix \`installRoutes\` so an update that would exceed the limit is rejected **atomically**, leaving the existing table untouched.`,
    bugReport: `**BUG-OPTUS1108** · Priority: Critical · Reported by: core network

installRoutes(table, routes, limit) must return { installed, table }:
- if table.length + routes.length would exceed limit, install nothing and
  return { installed: 0, table: <unchanged> }
- otherwise append them all and return the new count

Observed: routes are appended until the limit is hit, so the table ends up
containing part of an update. The router then withdraws from the network.`,
    logs: `[rib] limit 1000 reached after 137 of 900 new prefixes
[rib] inconsistent table; process restarting`,
    files: [
      {
        filePath: "src/net/routing.js",
        isEditable: true,
        language: "javascript",
        content: `// Installs a batch of routes into the table.
exports.installRoutes = function (table, routes, limit) {
  var installed = 0;
  for (var i = 0; i < routes.length; i++) {
    if (table.length >= limit) break;
    table.push(routes[i]);
    installed++;
  }
  return { installed: installed, table: table };
};
`,
      },
      {
        filePath: "src/net/RIB.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A routing update is all or nothing. A table holding half an update advertises
an inconsistent view of the network, which is worse than advertising the old
one. Check capacity before mutating anything.
*/
`,
      },
    ],
    tests: [
      {
        name: "a batch that fits is installed",
        isHidden: false,
        source: `var i = require("src/net/routing").installRoutes;
var table = ["r1"];
assert.equal(i(table, ["r2", "r3"], 10), { installed: 2, table: ["r1", "r2", "r3"] });`,
      },
      {
        name: "an over-capacity batch installs nothing",
        isHidden: false,
        source: `var i = require("src/net/routing").installRoutes;
var table = ["r1", "r2"];
var out = i(table, ["r3", "r4", "r5"], 4);
assert.equal(out.installed, 0, "a partial update is worse than none");
assert.equal(table, ["r1", "r2"]);`,
      },
      {
        name: "a batch that exactly fills the table is installed",
        isHidden: true,
        source: `var i = require("src/net/routing").installRoutes;
var table = ["r1"];
assert.equal(i(table, ["r2", "r3"], 3), { installed: 2, table: ["r1", "r2", "r3"] });`,
      },
      {
        name: "an empty batch is a no-op",
        isHidden: true,
        source: `var i = require("src/net/routing").installRoutes;
var table = ["r1"];
assert.equal(i(table, [], 1), { installed: 0, table: ["r1"] });`,
      },
    ],
    fixedFiles: {
      "src/net/routing.js": `// Installs a batch of routes into the table.
exports.installRoutes = function (table, routes, limit) {
  // All or nothing: a table holding half an update advertises an inconsistent
  // view of the network, which is worse than advertising the old one.
  if (table.length + routes.length > limit) {
    return { installed: 0, table: table };
  }
  for (var i = 0; i < routes.length; i++) {
    table.push(routes[i]);
  }
  return { installed: routes.length, table: table };
};
`,
    },
  },

  {
    title: "The Filter That Held Back the Flood",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Fail Closed"],
    description: `Modelled on the **Rogers outage of 8 July 2022**: a maintenance step removed a routing filter from the core network. Without it the routers received far more routing information than they could process, the IP core collapsed, and a third of Canada's internet — including 911 service — was down for around 15 hours.

\`distribution.js\` distributes routes to the core and treats an empty filter list as "allow everything".

Fix \`distribute\` so an empty filter list fails **closed**, and so a batch that exceeds the core's processing budget is refused.`,
    bugReport: `**BUG-ROGERS0708** · Priority: Critical · Reported by: IP core

distribute(routes, filters, budget) must return { sent, blocked }:
- an EMPTY filters array means nothing is explicitly permitted, so nothing is
  sent — fail closed, not open
- otherwise send only routes whose prefix starts with one of the filters
- if the number of routes that would be sent exceeds budget, send none and
  report them all as blocked

Observed: removing the last filter turns the guard into a pass-through and the
entire global table is pushed at the core.`,
    logs: `[core] filters=[] sent=1043221 routes
[core] control plane unresponsive across all regions`,
    files: [
      {
        filePath: "src/net/distribution.js",
        isEditable: true,
        language: "javascript",
        content: `// Distributes routes into the core network.
exports.distribute = function (routes, filters, budget) {
  var sent = [];
  var blocked = [];
  for (var i = 0; i < routes.length; i++) {
    var allowed = filters.length === 0;
    for (var j = 0; j < filters.length; j++) {
      if (routes[i].indexOf(filters[j]) === 0) allowed = true;
    }
    if (allowed) sent.push(routes[i]);
    else blocked.push(routes[i]);
  }
  return { sent: sent, blocked: blocked };
};
`,
      },
      {
        filePath: "src/net/GUARD.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A filter list is an allow-list. An empty allow-list permits nothing — treating
it as "permit everything" turns a safety device into a pass-through at exactly
the moment someone has removed the last entry by mistake.
*/
`,
      },
    ],
    tests: [
      {
        name: "matching routes are sent",
        isHidden: false,
        source: `var d = require("src/net/distribution").distribute;
assert.equal(d(["10.1.0.0/16", "192.168.0.0/16"], ["10."], 100), { sent: ["10.1.0.0/16"], blocked: ["192.168.0.0/16"] });`,
      },
      {
        name: "an empty filter list sends nothing",
        isHidden: false,
        source: `var d = require("src/net/distribution").distribute;
var out = d(["10.1.0.0/16", "192.168.0.0/16"], [], 100);
assert.equal(out.sent, [], "an empty allow-list must fail closed");
assert.equal(out.blocked.length, 2);`,
      },
      {
        name: "a batch over budget is refused",
        isHidden: false,
        source: `var d = require("src/net/distribution").distribute;
var routes = [];
for (var i = 0; i < 10; i++) routes.push("10." + i + ".0.0/16");
var out = d(routes, ["10."], 5);
assert.equal(out.sent, [], "an over-budget batch must not reach the core");
assert.equal(out.blocked.length, 10);`,
      },
      {
        name: "a batch exactly at budget is sent",
        isHidden: true,
        source: `var d = require("src/net/distribution").distribute;
var routes = ["10.0.0.0/16", "10.1.0.0/16"];
assert.equal(d(routes, ["10."], 2).sent.length, 2);`,
      },
    ],
    fixedFiles: {
      "src/net/distribution.js": `// Distributes routes into the core network.
exports.distribute = function (routes, filters, budget) {
  // An empty allow-list permits nothing. Treating it as "permit everything"
  // turns a safety device into a pass-through.
  if (filters.length === 0) {
    return { sent: [], blocked: routes.slice() };
  }
  var candidates = [];
  var blocked = [];
  for (var i = 0; i < routes.length; i++) {
    var allowed = false;
    for (var j = 0; j < filters.length; j++) {
      if (routes[i].indexOf(filters[j]) === 0) allowed = true;
    }
    if (allowed) candidates.push(routes[i]);
    else blocked.push(routes[i]);
  }
  if (candidates.length > budget) {
    return { sent: [], blocked: routes.slice() };
  }
  return { sent: candidates, blocked: blocked };
};
`,
    },
  },

  {
    title: "The Re-Mirror Storm",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Retries", "Backpressure"],
    description: `Modelled on the **Amazon EBS outage of 21 April 2011**: a network change routed traffic onto a low-capacity network. Volumes that lost their mirror immediately searched the cluster for space, and because they retried without backoff they consumed the remaining capacity and blocked each other — a "re-mirroring storm" that took down Reddit, Quora and Heroku for days.

\`mirror.js\` retries the search on every tick with no backoff and no cap.

Fix \`reMirror\` so a volume that cannot find space backs off instead of retrying immediately, and the cluster's free capacity is never oversubscribed.`,
    bugReport: `**BUG-EBS0421** · Priority: Critical · Reported by: storage

reMirror(cluster, volumes, ticks) must return { placed, attempts }:
- each tick, every unplaced volume whose backoff has expired tries once to take
  one unit of cluster.free
- a failed attempt doubles that volume's backoff (starting at 1), so it waits
  that many ticks before trying again
- cluster.free must never go negative

Observed: with no free capacity, every volume retries on every tick. The
attempt count explodes and nothing ever gets placed.`,
    logs: `[ebs] free=0 attempts=1284000 placed=0
[ebs] control plane saturated by re-mirror requests`,
    files: [
      {
        filePath: "src/storage/mirror.js",
        isEditable: true,
        language: "javascript",
        content: `// Re-mirrors volumes that lost their replica.
exports.reMirror = function (cluster, volumes, ticks) {
  var placed = 0;
  var attempts = 0;
  var state = [];
  for (var i = 0; i < volumes.length; i++) state.push({ done: false });
  for (var t = 0; t < ticks; t++) {
    for (var v = 0; v < volumes.length; v++) {
      if (state[v].done) continue;
      attempts++;
      if (cluster.free > 0) {
        cluster.free--;
        state[v].done = true;
        placed++;
      }
    }
  }
  return { placed: placed, attempts: attempts };
};
`,
      },
      {
        filePath: "src/storage/BACKOFF.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A failed request that retries immediately is a load amplifier. Exponential
backoff turns a storm into a trickle: after k consecutive failures a volume
waits 2^(k-1) ticks before trying again.
*/
`,
      },
    ],
    tests: [
      {
        name: "volumes are placed when capacity exists",
        isHidden: false,
        source: `var r = require("src/storage/mirror").reMirror;
var cluster = { free: 3 };
var out = r(cluster, ["v1", "v2", "v3"], 5);
assert.equal(out.placed, 3);
assert.equal(cluster.free, 0);`,
      },
      {
        name: "a full cluster does not produce a storm",
        isHidden: false,
        source: `var r = require("src/storage/mirror").reMirror;
var cluster = { free: 0 };
var volumes = [];
for (var i = 0; i < 10; i++) volumes.push("v" + i);
var out = r(cluster, volumes, 64);
assert.equal(out.placed, 0);
assert.ok(out.attempts <= 10 * 8, "backoff must limit retries, saw " + out.attempts);`,
      },
      {
        name: "capacity is never oversubscribed",
        isHidden: true,
        source: `var r = require("src/storage/mirror").reMirror;
var cluster = { free: 2 };
var out = r(cluster, ["a", "b", "c", "d"], 20);
assert.equal(out.placed, 2);
assert.ok(cluster.free >= 0);`,
      },
      {
        name: "capacity that appears later is still used",
        isHidden: true,
        source: `var r = require("src/storage/mirror").reMirror;
var cluster = { free: 1 };
var out = r(cluster, ["a"], 4);
assert.equal(out.placed, 1);
assert.ok(out.attempts <= 4);`,
      },
    ],
    fixedFiles: {
      "src/storage/mirror.js": `// Re-mirrors volumes that lost their replica.
exports.reMirror = function (cluster, volumes, ticks) {
  var placed = 0;
  var attempts = 0;
  var state = [];
  for (var i = 0; i < volumes.length; i++) {
    // nextTry: the earliest tick this volume may attempt again.
    state.push({ done: false, wait: 1, nextTry: 0 });
  }
  for (var t = 0; t < ticks; t++) {
    for (var v = 0; v < volumes.length; v++) {
      var s = state[v];
      if (s.done) continue;
      // An immediate retry is a load amplifier — wait out the backoff.
      if (t < s.nextTry) continue;
      attempts++;
      if (cluster.free > 0) {
        cluster.free--;
        s.done = true;
        placed++;
      } else {
        s.nextTry = t + s.wait;
        s.wait = s.wait * 2;
      }
    }
  }
  return { placed: placed, attempts: attempts };
};
`,
    },
  },

  // ── END WAVE12 ──
];
