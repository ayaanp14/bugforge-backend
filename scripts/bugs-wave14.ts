/**
 * Wave 14 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE14: BugSpec[] = [

  {
    title: "The Feature File That Doubled Overnight",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Config", "Limits", "Validation"],
    description: `Modelled on the **Cloudflare outage of 18 November 2025**: a change to database permissions made a metadata query — one that did not filter by database name — return every column twice. The Bot Management feature file generated from it doubled in size, went past the proxy's hard limit of 200 features, and the proxy code that loaded it failed with an unhandled error instead of rejecting the file. Cloudflare's network served 5xx errors for hours.

In this reconstruction, \`loader.js\` turns the metadata rows into the feature list the proxy runs on. It takes every row at face value and treats an oversize file as fatal.

Fix \`loadFeatureFile\` so duplicate rows collapse and a bad file is refused while the last good configuration keeps serving.`,
    bugReport: `**BUG-BOTFEAT** · Priority: Critical (global 5xx) · Reported by: edge SRE

loadFeatureFile(rows, live) builds the feature config from metadata rows
({ database, name, type }). live is the config currently serving
({ features: [...] }) or null.
- features are the DISTINCT row names, in first-seen order — the same column
  reported by two databases is one feature
- if the distinct count is within limits.MAX_FEATURES (200, inclusive),
  return { features: <list>, status: "loaded" }
- if it exceeds the limit the file is bad. Never throw: return
  { features: live.features, status: "kept-last-good" }, or
  { features: [], status: "rejected" } when there is no live config

Observed: after the permissions change every row came back twice, the
feature count doubled, and the loader threw — taking the proxy down.`,
    logs: `[featgen] wrote bot feature file: 2 x rows (default, r0)
[proxy] loadFeatureFile: Error: feature count 240 exceeds limit 200
[proxy] worker panicked; serving 5xx`,
    files: [
      {
        filePath: "src/bots/loader.js",
        isEditable: true,
        language: "javascript",
        content: `var limits = require("./limits");

// Builds the bot-management feature config from column metadata rows.
exports.loadFeatureFile = function (rows, live) {
  var features = rows.map(function (row) { return row.name; });
  if (features.length > limits.MAX_FEATURES) {
    throw new Error("feature count " + features.length + " exceeds limit " + limits.MAX_FEATURES);
  }
  return { features: features, status: "loaded" };
};
`,
      },
      {
        filePath: "src/bots/limits.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The proxy preallocates memory for its bot features, so a feature file may
list at most MAX_FEATURES entries. The file is regenerated every few minutes
from database metadata and pushed to every machine in the network.
*/
exports.MAX_FEATURES = 200;
`,
      },
      {
        filePath: "src/bots/QUERY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The generator reads column metadata with a query shaped like:

  SELECT name, type FROM system.columns
  WHERE table = 'http_requests_features'
  ORDER BY name

It does not filter by database. After the permissions change the account
could also see the underlying "r0" database, so every column came back once
per database. The rows handed to loadFeatureFile carry the database name.
*/
`,
      },
    ],
    tests: [
      {
        name: "a clean file loads in order",
        isHidden: false,
        source: `var L = require("src/bots/loader");
var rows = [{ database: "default", name: "ua_len" }, { database: "default", name: "tls_fp" }];
assert.equal(L.loadFeatureFile(rows, null), { features: ["ua_len", "tls_fp"], status: "loaded" });`,
      },
      {
        name: "the same column from two databases is one feature",
        isHidden: false,
        source: `var L = require("src/bots/loader");
var rows = [
  { database: "default", name: "ua_len" }, { database: "default", name: "tls_fp" },
  { database: "r0", name: "ua_len" }, { database: "r0", name: "tls_fp" }
];
assert.equal(L.loadFeatureFile(rows, null), { features: ["ua_len", "tls_fp"], status: "loaded" }, "duplicates collapse");`,
      },
      {
        name: "150 features reported twice still load",
        isHidden: true,
        source: `var L = require("src/bots/loader");
var rows = [];
for (var i = 0; i < 150; i++) rows.push({ database: "default", name: "f" + i });
for (var j = 0; j < 150; j++) rows.push({ database: "r0", name: "f" + j });
var out = L.loadFeatureFile(rows, { features: ["old"] });
assert.equal(out.status, "loaded");
assert.equal(out.features.length, 150);
assert.equal(out.features[149], "f149");`,
      },
      {
        name: "an oversize file keeps the last good config",
        isHidden: true,
        source: `var L = require("src/bots/loader");
var rows = [];
for (var i = 0; i < 201; i++) rows.push({ database: "default", name: "f" + i });
var out;
try { out = L.loadFeatureFile(rows, { features: ["a", "b"] }); } catch (e) { out = "threw: " + e.message; }
assert.equal(out, { features: ["a", "b"], status: "kept-last-good" }, "never throw on a bad file");`,
      },
      {
        name: "an oversize file with nothing live is rejected, and 200 is allowed",
        isHidden: true,
        source: `var L = require("src/bots/loader");
var big = [];
for (var i = 0; i < 201; i++) big.push({ database: "default", name: "f" + i });
var out;
try { out = L.loadFeatureFile(big, null); } catch (e) { out = "threw: " + e.message; }
assert.equal(out, { features: [], status: "rejected" });
var exact = big.slice(0, 200);
assert.equal(L.loadFeatureFile(exact, null).status, "loaded", "the limit is inclusive");`,
      },
    ],
    fixedFiles: {
      "src/bots/loader.js": `var limits = require("./limits");

// Builds the bot-management feature config from column metadata rows.
exports.loadFeatureFile = function (rows, live) {
  // The metadata query can report one column once per database it can see,
  // so a feature is identified by its name, not by its row.
  var seen = {};
  var features = [];
  rows.forEach(function (row) {
    if (!Object.prototype.hasOwnProperty.call(seen, row.name)) {
      seen[row.name] = true;
      features.push(row.name);
    }
  });
  // An oversize file is bad input, not a reason to die: refuse it and keep
  // serving whatever config was already live.
  if (features.length > limits.MAX_FEATURES) {
    if (live) return { features: live.features, status: "kept-last-good" };
    return { features: [], status: "rejected" };
  }
  return { features: features, status: "loaded" };
};
`,
    },
  },

  {
    title: "The Blank Field That Crashed Every Region",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Validation", "Config"],
    description: `Modelled on the **Google Cloud outage of 12 June 2025**: Service Control, which checks API requests against policy and quota, had gained a new quota-policy check that shipped without appropriate error handling and without a feature flag. When a policy change containing unintended blank fields was replicated globally, that code path hit a null pointer and the binary went into a crash loop in every region, taking a long list of Google Cloud products down with it.

\`ServiceControl.check\` evaluates one quota policy against a request's usage. It assumes every field of the policy is populated.

Fix it so a policy with missing or blank fields is treated as no quota policy — the check fails open — instead of crashing.`,
    bugReport: `**BUG-SVCCTL** · Priority: Critical (global) · Reported by: SRE

check(policy, usage) returns "ALLOW" or "DENY:<metric>":
- policy null -> "ALLOW"
- a policy whose metric is null or blank (empty / whitespace only), or whose
  limit is null, is incomplete: treat it as no quota policy -> "ALLOW".
  Never throw.
- otherwise usage > limit -> "DENY:" + the trimmed metric, else "ALLOW"
  (usage equal to the limit is allowed)

admit(policies, usage) is true unless some policy's check denies. An
incomplete policy in the list never throws and never blocks.

Observed: a replicated policy with blank fields crashed every instance with
a NullPointerException, on every restart.`,
    logs: `[service-control] applying policy update p-7781 (replicated)
[service-control] java.lang.NullPointerException at ServiceControl.check
[service-control] task restarted (crash loop, all regions)`,
    files: [
      {
        filePath: "src/control/ServiceControl.java",
        isEditable: true,
        language: "java",
        content: `class ServiceControl {
    static String check(QuotaPolicy policy, long usage) {
        if (policy == null) return "ALLOW";
        String metric = policy.metric.trim();
        long limit = policy.limit;
        return usage > limit ? "DENY:" + metric : "ALLOW";
    }

    static boolean admit(List<QuotaPolicy> policies, long usage) {
        for (QuotaPolicy p : policies) {
            if (check(p, usage).startsWith("DENY")) return false;
        }
        return true;
    }
}`,
      },
      {
        filePath: "src/control/QuotaPolicy.java",
        isEditable: false,
        language: "java",
        content: `class QuotaPolicy {
    // Fields arrive from the policy store exactly as written and replicated.
    // Any of them may be absent (null) or blank when left empty upstream.
    final String project;
    final String metric;
    final Long limit;

    QuotaPolicy(String project, String metric, Long limit) {
        this.project = project;
        this.metric = metric;
        this.limit = limit;
    }
}`,
      },
    ],
    tests: [
      {
        name: "a complete policy denies over its limit",
        isHidden: false,
        source: `                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", "requests", 100L), 150L), "DENY:requests", "over limit");
                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", "requests", 100L), 50L), "ALLOW", "under limit");`,
      },
      {
        name: "a policy with blank fields does not crash",
        isHidden: false,
        source: `                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", null, null), 150L), "ALLOW", "incomplete policy = no policy");`,
      },
      {
        name: "whitespace metric or missing limit is incomplete",
        isHidden: true,
        source: `                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", "   ", 10L), 150L), "ALLOW", "blank metric");
                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", "requests", null), 150L), "ALLOW", "missing limit");
                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", " cpu ", 10L), 11L), "DENY:cpu", "metric is trimmed");`,
      },
      {
        name: "admit skips incomplete policies but honours complete ones",
        isHidden: true,
        source: `                List<QuotaPolicy> mixed = Arrays.asList(new QuotaPolicy("p1", "", null), new QuotaPolicy("p1", "requests", 100L));
                BugAssert.equal(ServiceControl.admit(mixed, 150L), false, "the complete policy still denies");
                BugAssert.equal(ServiceControl.admit(mixed, 50L), true, "the blank one never blocks");`,
      },
      {
        name: "no policy and usage at the limit are allowed",
        isHidden: true,
        source: `                BugAssert.equal(ServiceControl.check(null, 150L), "ALLOW");
                BugAssert.equal(ServiceControl.check(new QuotaPolicy("p1", "requests", 100L), 100L), "ALLOW", "equal is allowed");`,
      },
    ],
    fixedFiles: {
      "src/control/ServiceControl.java": `class ServiceControl {
    static String check(QuotaPolicy policy, long usage) {
        if (policy == null) return "ALLOW";
        // Policy data is replicated globally as written: a blank field must be
        // handled here, or one bad row crash-loops every instance at once.
        // An incomplete policy is no quota policy, so this check fails open.
        if (policy.metric == null || policy.metric.trim().isEmpty() || policy.limit == null) {
            return "ALLOW";
        }
        String metric = policy.metric.trim();
        long limit = policy.limit;
        return usage > limit ? "DENY:" + metric : "ALLOW";
    }

    static boolean admit(List<QuotaPolicy> policies, long usage) {
        for (QuotaPolicy p : policies) {
            if (check(p, usage).startsWith("DENY")) return false;
        }
        return true;
    }
}`,
    },
  },

  {
    title: "The Late Enactor and the Empty Record",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Concurrency", "Networking"],
    description: `Modelled on the **AWS us-east-1 outage of 19–20 October 2025**: DynamoDB's DNS automation has a planner that produces numbered DNS plans and independent enactors that apply them. One enactor was badly delayed; by the time it applied its old plan, another enactor had already applied a much newer one — and that enactor's clean-up then deleted the old plan the delayed one had just made live. The regional endpoint was left with an empty DNS record, and the failure cascaded through the services that depend on DynamoDB.

\`enactor.js\` applies plans and cleans up old ones. The tests interleave the steps of two enactors explicitly, so the race is deterministic.

Fix \`applyPlan\` and \`cleanup\` so a stale plan can never replace a newer live one and the live plan is never deleted.`,
    bugReport: `**BUG-DDBDNS** · Priority: Critical (regional outage) · Reported by: DNS on-call

dns.js (locked) keeps store = { plans: { <generation>: [ips] }, live: <generation> | null }.

applyPlan(store, generation):
- a generation with no published plan -> false, nothing changes
- a generation OLDER than store.live is stale -> false, live unchanged
- otherwise (nothing live yet, or the same or a newer generation)
  -> store.live = generation, return true

cleanup(store, olderThan):
- deletes every plan whose generation < olderThan, EXCEPT the live plan
- returns the deleted generations as numbers, ascending

dns.resolve(store) must never come back empty while an applied plan exists.

Observed: enactor B applied plan 5; delayed enactor A then applied plan 1
over it; B's cleanup of plans older than 3 deleted plan 1 — now the live
one. resolve() returned [].`,
    logs: `[enactor-b] applied plan 5 to dynamodb.us-east-1
[enactor-a] applied plan 1 to dynamodb.us-east-1 (started 14m ago)
[enactor-b] cleanup: deleted plans [1, 2]
[resolver] dynamodb.us-east-1 -> NOERROR, 0 answers`,
    files: [
      {
        filePath: "src/dns/enactor.js",
        isEditable: true,
        language: "javascript",
        content: `// Applies DNS plans produced by the planner to the live endpoint record.
exports.applyPlan = function (store, generation) {
  if (!store.plans[generation]) return false;
  store.live = generation;
  return true;
};

// Removes plans that are too old to be useful.
exports.cleanup = function (store, olderThan) {
  var deleted = [];
  Object.keys(store.plans).forEach(function (key) {
    var generation = Number(key);
    if (generation < olderThan) {
      delete store.plans[key];
      deleted.push(generation);
    }
  });
  return deleted.sort(function (a, b) { return a - b; });
};
`,
      },
      {
        filePath: "src/dns/dns.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The planner publishes numbered plans (higher generation = newer). Several
enactors apply them independently; any of them may be delayed arbitrarily
between reading a plan and applying it.
*/
exports.createStore = function () {
  return { plans: {}, live: null };
};

exports.publish = function (store, generation, ips) {
  store.plans[generation] = ips.slice();
};

exports.resolve = function (store) {
  if (store.live === null) return [];
  return store.plans[store.live] || [];
};
`,
      },
    ],
    tests: [
      {
        name: "plans applied in order resolve to the newest",
        isHidden: false,
        source: `var dns = require("src/dns/dns");
var E = require("src/dns/enactor");
var s = dns.createStore();
dns.publish(s, 1, ["10.0.0.1"]);
dns.publish(s, 2, ["10.0.0.2"]);
assert.equal(E.applyPlan(s, 1), true);
assert.equal(E.applyPlan(s, 2), true);
assert.equal(dns.resolve(s), ["10.0.0.2"]);`,
      },
      {
        name: "a delayed enactor cannot empty the record",
        isHidden: false,
        source: `var dns = require("src/dns/dns");
var E = require("src/dns/enactor");
var s = dns.createStore();
for (var g = 1; g <= 5; g++) dns.publish(s, g, ["10.0.0." + g]);
E.applyPlan(s, 5);   // enactor B
E.applyPlan(s, 1);   // enactor A, delayed, still holding plan 1
E.cleanup(s, 3);     // enactor B cleans up
assert.equal(dns.resolve(s), ["10.0.0.5"], "the endpoint must keep answering with the newest plan");`,
      },
      {
        name: "a stale plan is refused",
        isHidden: true,
        source: `var dns = require("src/dns/dns");
var E = require("src/dns/enactor");
var s = dns.createStore();
dns.publish(s, 3, ["a"]);
dns.publish(s, 7, ["b"]);
assert.equal(E.applyPlan(s, 7), true);
assert.equal(E.applyPlan(s, 3), false, "older than live");
assert.equal(s.live, 7);
assert.equal(E.applyPlan(s, 7), true, "re-applying the live generation is fine");
assert.equal(E.applyPlan(s, 9), false, "unpublished generation");`,
      },
      {
        name: "cleanup never deletes the live plan",
        isHidden: true,
        source: `var dns = require("src/dns/dns");
var E = require("src/dns/enactor");
var s = dns.createStore();
for (var g = 1; g <= 5; g++) dns.publish(s, g, ["10.0.0." + g]);
E.applyPlan(s, 2);
assert.equal(E.cleanup(s, 5), [1, 3, 4]);
assert.equal(dns.resolve(s), ["10.0.0.2"]);
assert.ok(!!s.plans[5], "newer plans are kept");`,
      },
      {
        name: "cleanup with nothing live removes old plans",
        isHidden: true,
        source: `var dns = require("src/dns/dns");
var E = require("src/dns/enactor");
var s = dns.createStore();
dns.publish(s, 10, ["x"]);
dns.publish(s, 2, ["y"]);
assert.equal(E.cleanup(s, 5), [2]);
assert.equal(Object.keys(s.plans), ["10"]);`,
      },
    ],
    fixedFiles: {
      "src/dns/enactor.js": `// Applies DNS plans produced by the planner to the live endpoint record.
exports.applyPlan = function (store, generation) {
  if (!store.plans[generation]) return false;
  // An enactor can be delayed for any length of time between picking up a
  // plan and applying it. Check staleness against what is live *now*, at the
  // moment of applying, and refuse to go backwards.
  if (store.live !== null && generation < store.live) return false;
  store.live = generation;
  return true;
};

// Removes plans that are too old to be useful.
exports.cleanup = function (store, olderThan) {
  var deleted = [];
  Object.keys(store.plans).forEach(function (key) {
    var generation = Number(key);
    // Whatever is live stays, however old: deleting it empties the record.
    if (generation < olderThan && generation !== store.live) {
      delete store.plans[key];
      deleted.push(generation);
    }
  });
  return deleted.sort(function (a, b) { return a - b; });
};
`,
    },
  },

  {
    title: "Secrets for Every Fork",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Config"],
    description: `Modelled on **Travis CI's September 2021 security bulletin** (CVE-2021-41077): for several days, the secure environment variables of public repositories — signing keys, access tokens — were made available to builds of pull requests opened from forks. Anyone able to open a pull request could have a build read them.

\`env.js\` builds a job's environment. It is meant to hold secrets back from fork pull requests, but its check reads a field the build payload does not carry.

Fix \`buildEnv\` so secrets reach only pushes and pull requests opened from the same repository.`,
    bugReport: `**BUG-FORKENV** · Priority: Critical (secret exposure) · Reported by: security

buildEnv(build, settings) returns the job environment as an object:
- every settings.plain variable, in order
- then settings.secure variables ONLY when the build is trusted:
  build.event === "push", or build.event === "pull_request" with a headRepo
  equal to its baseRepo. A pull request whose headRepo differs (a fork) or
  is missing is untrusted.
- then TRAVIS_SECURE_ENV_VARS: "true" when secrets were added, else "false"

Observed: pull requests from forks receive DEPLOY_KEY and NPM_TOKEN.`,
    logs: `[worker] job 88213 pull_request base=acme/site head=stranger/site
[worker] env: CI, DEPLOY_KEY, NPM_TOKEN, TRAVIS_SECURE_ENV_VARS=true`,
    files: [
      {
        filePath: "src/ci/env.js",
        isEditable: true,
        language: "javascript",
        content: `// Builds the environment a CI job runs with.
exports.buildEnv = function (build, settings) {
  var env = {};
  Object.keys(settings.plain).forEach(function (k) { env[k] = settings.plain[k]; });
  var trusted = build.event === "push" || !build.fork;
  if (trusted) {
    Object.keys(settings.secure).forEach(function (k) { env[k] = settings.secure[k]; });
  }
  env.TRAVIS_SECURE_ENV_VARS = trusted ? "true" : "false";
  return env;
};
`,
      },
      {
        filePath: "src/ci/BUILD.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A build, as the scheduler hands it over:

  { event: "push" | "pull_request", baseRepo: "owner/name", headRepo: "owner/name" }

headRepo is the repository the commits come from. A pull request from a fork
has a different headRepo; one opened from a branch of the same repository has
the same one. For a push, headRepo equals baseRepo. There are no other fields.
*/
`,
      },
    ],
    tests: [
      {
        name: "a push gets its secrets",
        isHidden: false,
        source: `var buildEnv = require("src/ci/env").buildEnv;
var settings = { plain: { CI: "true" }, secure: { DEPLOY_KEY: "k1" } };
var env = buildEnv({ event: "push", baseRepo: "acme/site", headRepo: "acme/site" }, settings);
assert.equal(env, { CI: "true", DEPLOY_KEY: "k1", TRAVIS_SECURE_ENV_VARS: "true" });`,
      },
      {
        name: "a fork pull request gets no secrets",
        isHidden: false,
        source: `var buildEnv = require("src/ci/env").buildEnv;
var settings = { plain: { CI: "true" }, secure: { DEPLOY_KEY: "k1", NPM_TOKEN: "t1" } };
var env = buildEnv({ event: "pull_request", baseRepo: "acme/site", headRepo: "stranger/site" }, settings);
assert.equal(env, { CI: "true", TRAVIS_SECURE_ENV_VARS: "false" }, "secrets must not reach a fork");`,
      },
      {
        name: "a same-repository pull request is trusted",
        isHidden: true,
        source: `var buildEnv = require("src/ci/env").buildEnv;
var settings = { plain: {}, secure: { DEPLOY_KEY: "k1" } };
var env = buildEnv({ event: "pull_request", baseRepo: "acme/site", headRepo: "acme/site" }, settings);
assert.equal(env, { DEPLOY_KEY: "k1", TRAVIS_SECURE_ENV_VARS: "true" });`,
      },
      {
        name: "a pull request with no head repository is untrusted",
        isHidden: true,
        source: `var buildEnv = require("src/ci/env").buildEnv;
var settings = { plain: { A: "1" }, secure: { DEPLOY_KEY: "k1" } };
var env = buildEnv({ event: "pull_request", baseRepo: "acme/site" }, settings);
assert.equal(env, { A: "1", TRAVIS_SECURE_ENV_VARS: "false" });`,
      },
    ],
    fixedFiles: {
      "src/ci/env.js": `// Builds the environment a CI job runs with.
exports.buildEnv = function (build, settings) {
  var env = {};
  Object.keys(settings.plain).forEach(function (k) { env[k] = settings.plain[k]; });
  // The payload has no "fork" field — trust has to be derived from the
  // repositories themselves. Code from another repository must never see
  // this repository's secrets.
  var sameRepo = !!build.headRepo && build.headRepo === build.baseRepo;
  var trusted = build.event === "push" || (build.event === "pull_request" && sameRepo);
  if (trusted) {
    Object.keys(settings.secure).forEach(function (k) { env[k] = settings.secure[k]; });
  }
  env.TRAVIS_SECURE_ENV_VARS = trusted ? "true" : "false";
  return env;
};
`,
    },
  },

  {
    title: "The Uploader Nobody Checksummed",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Security", "Validation"],
    description: `Modelled on the **Codecov Bash Uploader compromise** (disclosed April 2021): an attacker modified the uploader script Codecov served, and for about two months CI pipelines that downloaded it and piped it straight into a shell sent their environment variables — credentials included — to a server the attacker controlled. It was noticed when a customer found the script did not match its published checksum.

\`installer.py\` downloads the uploader and runs it. It computes the checksum, but a mismatch only produces a warning.

Fix \`install\` so a script is run only when its SHA-256 matches the published value.`,
    bugReport: `**BUG-UPLOADER** · Priority: Critical (supply chain) · Reported by: security

install(fetch, published_sha256, run, log):
- script = fetch() (bytes); digest = the SHA-256 hex digest of script
- the published value is compared case-insensitively, surrounding
  whitespace ignored
- match: call run(script) exactly once, return the digest (lower-case hex),
  append nothing to log
- mismatch, or a missing/empty published value: append one line starting
  with "refused:" to log, raise errors.IntegrityError, and never call run

Observed: a tampered uploader logged "warning: checksum mismatch" and ran
anyway.`,
    logs: `[ci] fetched codecov uploader (5.2 KB)
[ci] warning: checksum mismatch 9f2c...e1
[ci] running uploader`,
    files: [
      {
        filePath: "src/ci/installer.py",
        isEditable: true,
        language: "python",
        content: `import hashlib

errors = bug_require("./errors.py")


def install(fetch, published_sha256, run, log):
    script = fetch()
    digest = hashlib.sha256(script).hexdigest()
    if digest != published_sha256:
        log.append("warning: checksum mismatch " + digest)
    run(script)
    return digest
`,
      },
      {
        filePath: "src/ci/errors.py",
        isEditable: false,
        language: "python",
        content: `class IntegrityError(Exception):
    """Raised when a downloaded artifact does not match its published checksum."""
    pass
`,
      },
    ],
    tests: [
      {
        name: "a script matching its checksum runs",
        isHidden: false,
        source: `import hashlib
inst = bug_require("src/ci/installer")
script = b"echo uploading coverage"
ran = []
log = []
d = inst.install(lambda: script, hashlib.sha256(script).hexdigest(), lambda s: ran.append(s), log)
assert_.equal(d, hashlib.sha256(script).hexdigest())
assert_.equal(len(ran), 1, "ran once")
assert_.equal(log, [])`,
      },
      {
        name: "a tampered script is refused and never runs",
        isHidden: false,
        source: `import hashlib
inst = bug_require("src/ci/installer")
errors = bug_require("src/ci/errors")
published = hashlib.sha256(b"echo uploading coverage").hexdigest()
tampered = b"echo uploading coverage; send-env-elsewhere"
ran = []
log = []
raised = False
try:
    inst.install(lambda: tampered, published, lambda s: ran.append(s), log)
except errors.IntegrityError:
    raised = True
assert_.ok(raised, "must raise IntegrityError")
assert_.equal(len(ran), 0, "must never run a tampered script")`,
      },
      {
        name: "the published value is compared case-insensitively",
        isHidden: true,
        source: `import hashlib
inst = bug_require("src/ci/installer")
script = b"echo ok"
ran = []
log = []
published = "  " + hashlib.sha256(script).hexdigest().upper() + "\\n"
d = inst.install(lambda: script, published, lambda s: ran.append(s), log)
assert_.equal(d, hashlib.sha256(script).hexdigest())
assert_.equal(len(ran), 1)
assert_.equal(log, [], "a match logs nothing")`,
      },
      {
        name: "a missing checksum is refused",
        isHidden: true,
        source: `inst = bug_require("src/ci/installer")
errors = bug_require("src/ci/errors")
for published in ("", None):
    ran = []
    log = []
    raised = False
    try:
        inst.install(lambda: b"echo ok", published, lambda s: ran.append(s), log)
    except errors.IntegrityError:
        raised = True
    assert_.ok(raised, "no checksum, no run")
    assert_.equal(len(ran), 0)
    assert_.equal(len(log), 1)
    assert_.ok(log[0].startswith("refused:"), "log line starts with refused:")`,
      },
    ],
    fixedFiles: {
      "src/ci/installer.py": `import hashlib

errors = bug_require("./errors.py")


def install(fetch, published_sha256, run, log):
    script = fetch()
    digest = hashlib.sha256(script).hexdigest()
    expected = (published_sha256 or "").strip().lower()
    # A checksum that is only logged protects nobody: the whole point is to
    # refuse to execute bytes we cannot vouch for, before they run.
    if not expected or digest != expected:
        log.append("refused: checksum mismatch " + digest)
        raise errors.IntegrityError("uploader checksum mismatch")
    run(script)
    return digest
`,
    },
  },

  {
    title: "Withdraw, Then Withdraw Again",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Money", "State"],
    description: `Modelled on **The DAO attack** (June 2016): The DAO's contract sent ether to a caller *before* updating the caller's balance. The recipient was itself a contract whose receive hook called straight back into the withdrawal, and every nested call still saw the untouched balance. Roughly a third of The DAO's funds were drained, and Ethereum hard-forked to reverse it.

\`vault.js\` has the same order of operations. The re-entrant recipient is modelled deterministically in \`wallets.js\`: its \`receive\` calls \`withdraw\` again a fixed number of times.

Fix \`withdraw\` so a nested call can never pay out the same balance twice.`,
    bugReport: `**BUG-REENTRY** · Priority: Critical (funds drained) · Reported by: audit

vault.withdraw(who, wallet):
- pays the caller's whole balance by calling wallet.receive(amount, vault)
  once and returns amount
- a balance of 0 returns 0 without calling receive
- receive may call vault.withdraw again (re-entrancy); that nested call must
  see the balance as already paid out and return 0
- after any sequence of calls, vault.reserve equals the sum of the balances
  still held
- if receive throws, the withdrawal is undone — the balance and the reserve
  are restored — and the error propagates

Observed: an attacker with a balance of 10 re-entered three times, was paid
40, and the honest depositor's 30 could no longer be withdrawn.`,
    logs: `[vault] withdraw mallory 10 (depth 4)
[vault] reserve 40 -> 0, balances { mallory: 0, alice: 30 }
[vault] withdraw alice: Error: insufficient reserve`,
    files: [
      {
        filePath: "src/vault/vault.js",
        isEditable: true,
        language: "javascript",
        content: `exports.createVault = function () {
  var vault = { balances: {}, reserve: 0 };

  vault.deposit = function (who, amount) {
    vault.balances[who] = (vault.balances[who] || 0) + amount;
    vault.reserve += amount;
  };

  vault.withdraw = function (who, wallet) {
    var amount = vault.balances[who] || 0;
    if (amount === 0) return 0;
    if (amount > vault.reserve) throw new Error("insufficient reserve");
    wallet.receive(amount, vault);
    vault.reserve -= amount;
    vault.balances[who] = 0;
    return amount;
  };

  return vault;
};
`,
      },
      {
        filePath: "src/vault/wallets.js",
        isEditable: false,
        language: "javascript",
        content: `// Recipients. receive(amount, vault) is an external call: the vault cannot
// know what the recipient does inside it.
exports.honest = function () {
  var w = { received: 0 };
  w.receive = function (amount) { w.received += amount; };
  return w;
};

// Calls back into withdraw from inside receive, up to depth extra times.
exports.reentrant = function (who, depth) {
  var w = { received: 0, calls: 0 };
  w.receive = function (amount, vault) {
    w.received += amount;
    if (w.calls < depth) {
      w.calls++;
      vault.withdraw(who, w);
    }
  };
  return w;
};

exports.rejecting = function () {
  return { receive: function () { throw new Error("receive rejected"); } };
};
`,
      },
    ],
    tests: [
      {
        name: "an honest withdrawal pays the balance",
        isHidden: false,
        source: `var v = require("src/vault/vault").createVault();
var W = require("src/vault/wallets");
v.deposit("alice", 30);
var w = W.honest();
assert.equal(v.withdraw("alice", w), 30);
assert.equal(w.received, 30);
assert.equal(v.reserve, 0);`,
      },
      {
        name: "re-entering withdraw pays nothing extra",
        isHidden: false,
        source: `var v = require("src/vault/vault").createVault();
var W = require("src/vault/wallets");
v.deposit("mallory", 10);
v.deposit("alice", 30);
var attacker = W.reentrant("mallory", 3);
v.withdraw("mallory", attacker);
assert.equal(attacker.received, 10, "only mallory's own balance");
var alice = W.honest();
assert.equal(v.withdraw("alice", alice), 30, "alice's money is still there");`,
      },
      {
        name: "the reserve matches the balances after an attack",
        isHidden: true,
        source: `var v = require("src/vault/vault").createVault();
var W = require("src/vault/wallets");
v.deposit("mallory", 10);
v.deposit("alice", 30);
v.withdraw("mallory", W.reentrant("mallory", 2));
assert.equal(v.balances, { mallory: 0, alice: 30 });
assert.equal(v.reserve, 30);`,
      },
      {
        name: "a failed receive undoes the withdrawal",
        isHidden: true,
        source: `var v = require("src/vault/vault").createVault();
var W = require("src/vault/wallets");
v.deposit("bob", 25);
assert.throws(function () { v.withdraw("bob", W.rejecting()); }, "the error propagates");
assert.equal(v.balances, { bob: 25 });
assert.equal(v.reserve, 25);
var w = W.honest();
assert.equal(v.withdraw("bob", w), 25, "and the money can still be withdrawn");`,
      },
      {
        name: "an empty balance never calls receive",
        isHidden: true,
        source: `var v = require("src/vault/vault").createVault();
var called = 0;
assert.equal(v.withdraw("nobody", { receive: function () { called++; } }), 0);
assert.equal(called, 0);`,
      },
    ],
    fixedFiles: {
      "src/vault/vault.js": `exports.createVault = function () {
  var vault = { balances: {}, reserve: 0 };

  vault.deposit = function (who, amount) {
    vault.balances[who] = (vault.balances[who] || 0) + amount;
    vault.reserve += amount;
  };

  vault.withdraw = function (who, wallet) {
    var amount = vault.balances[who] || 0;
    if (amount === 0) return 0;
    if (amount > vault.reserve) throw new Error("insufficient reserve");
    // Checks, effects, THEN interactions: receive() is someone else's code and
    // may call back in. Settle our own state first so a nested call sees the
    // balance as already paid.
    vault.balances[who] = 0;
    vault.reserve -= amount;
    try {
      wallet.receive(amount, vault);
    } catch (e) {
      vault.balances[who] = (vault.balances[who] || 0) + amount;
      vault.reserve += amount;
      throw e;
    }
    return amount;
  };

  return vault;
};
`,
    },
  },

  {
    title: "The Index That Started at Zero",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Money", "State"],
    description: `Modelled on **Compound's Proposal 062** (September 2021): an upgrade to the contract that distributes COMP rewards contained a bug in how reward indexes were initialised. A single comparison treated a market's freshly initialised index wrongly, so accounts that had never been settled in that market were credited as if they had been accruing since the very beginning — and could claim far more COMP than they had earned. Because changes to the protocol had to pass governance, the fix could not ship immediately.

\`rewards.js\` is a reconstruction of that accrual step: each market carries a reward index that only grows, each account remembers the index it was last settled at, and an account that has never been settled has index 0.

Fix \`accrue\` so a never-settled account starts from the initial index in every initialised market.`,
    bugReport: `**BUG-COMP062** · Priority: Critical (over-distribution) · Reported by: protocol team

constants.js: SCALE = 1e6, INITIAL_INDEX = 1e6 — every rewards market starts
at INITIAL_INDEX; a market with index 0 has never been initialised.

accrue(market, account)  (market = { index }, account = { balance, index, accrued })
- start = account.index
- an account with index 0 has never been settled: in an initialised market
  (market.index >= INITIAL_INDEX) it starts from INITIAL_INDEX instead
- earned = floor(balance * (market.index - start) / SCALE)
- then account.index = market.index, account.accrued += earned; return earned

So an account that joins a market the moment its rewards begin earns 0.

Observed: accounts in a market whose index had just been initialised were
credited balance * 1 COMP each on their first claim.`,
    logs: `[comptroller] market cXYZ rewards initialised index=1000000
[comptroller] claim 0x9a..: supplierIndex=0 delta=1000000 accrued=4200
[comptroller] claim 0x3c..: supplierIndex=0 delta=1000000 accrued=91000`,
    files: [
      {
        filePath: "src/rewards/rewards.js",
        isEditable: true,
        language: "javascript",
        content: `var C = require("./constants");

// Settles an account's reward accrual against the market's current index.
exports.accrue = function (market, account) {
  var start = account.index;
  if (start === 0 && market.index > C.INITIAL_INDEX) {
    start = C.INITIAL_INDEX;
  }
  var earned = Math.floor(account.balance * (market.index - start) / C.SCALE);
  account.index = market.index;
  account.accrued += earned;
  return earned;
};
`,
      },
      {
        filePath: "src/rewards/constants.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Reward indexes are fixed-point numbers scaled by SCALE. A market's index
starts at INITIAL_INDEX when its rewards are switched on and only ever grows;
a market that never had rewards keeps index 0. An account's index is the
market index it was last settled at, or 0 if it was never settled.
*/
exports.SCALE = 1000000;
exports.INITIAL_INDEX = 1000000;
`,
      },
    ],
    tests: [
      {
        name: "a settled account earns the index growth",
        isHidden: false,
        source: `var R = require("src/rewards/rewards");
var account = { balance: 100, index: 1000000, accrued: 0 };
assert.equal(R.accrue({ index: 1500000 }, account), 50);
assert.equal(account, { balance: 100, index: 1500000, accrued: 50 });`,
      },
      {
        name: "joining a freshly initialised market earns nothing",
        isHidden: false,
        source: `var R = require("src/rewards/rewards");
var account = { balance: 4200, index: 0, accrued: 0 };
assert.equal(R.accrue({ index: 1000000 }, account), 0, "no index growth, no reward");
assert.equal(account.index, 1000000);`,
      },
      {
        name: "a never-settled account in a grown market earns only the growth",
        isHidden: true,
        source: `var R = require("src/rewards/rewards");
var account = { balance: 100, index: 0, accrued: 0 };
assert.equal(R.accrue({ index: 1200000 }, account), 20);`,
      },
      {
        name: "a second claim at the same index earns nothing",
        isHidden: true,
        source: `var R = require("src/rewards/rewards");
var market = { index: 1000000 };
var account = { balance: 500, index: 0, accrued: 0 };
R.accrue(market, account);
assert.equal(R.accrue(market, account), 0);
market.index = 1010000;
assert.equal(R.accrue(market, account), 5);
assert.equal(account.accrued, 5);`,
      },
      {
        name: "a market without rewards pays nothing",
        isHidden: true,
        source: `var R = require("src/rewards/rewards");
var account = { balance: 900, index: 0, accrued: 0 };
assert.equal(R.accrue({ index: 0 }, account), 0);
assert.equal(account.accrued, 0);`,
      },
    ],
    fixedFiles: {
      "src/rewards/rewards.js": `var C = require("./constants");

// Settles an account's reward accrual against the market's current index.
exports.accrue = function (market, account) {
  var start = account.index;
  // A market sitting exactly at INITIAL_INDEX has been initialised — its
  // rewards just began. Excluding that case left start at 0 and paid a
  // brand-new account a full INITIAL_INDEX worth of growth it never saw.
  if (start === 0 && market.index >= C.INITIAL_INDEX) {
    start = C.INITIAL_INDEX;
  }
  var earned = Math.floor(account.balance * (market.index - start) / C.SCALE);
  account.index = market.index;
  account.accrued += earned;
  return earned;
};
`,
    },
  },

  {
    title: "The Year That Didn't Fit in an Int",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Overflow", "Time"],
    description: `Modelled on **Microsoft Exchange's "Y2K22" bug** (1 January 2022): on-premises Exchange servers stopped delivering email at midnight on New Year's Day. The version of the malware-scanning engine's updates encodes a date as yyMMddHHmm, and it was being stored in a signed 32-bit integer; the first update of 2022, 2201010001, is larger than 2,147,483,647, so the conversion failed, the scanning engine could not load, and mail sat in the transport queues.

\`EngineVersion.java\` parses and compares those version stamps; \`MalwareFilter.java\` is the transport's gate.

Fix \`EngineVersion\` so every yyMMddHHmm version parses and compares correctly.`,
    bugReport: `**BUG-Y2K22** · Priority: Critical (mail flow stopped) · Reported by: messaging ops

Engine versions are 10-digit strings "yyMMddHHmm".
- parse(v) returns the numeric value for every 10-digit version, including
  versions from 2022 onwards ("2201010001" -> 2201010001); anything that is
  not exactly 10 digits throws an IllegalArgumentException
- isNewer(a, b) is true when a's value is greater than b's
- latest(list) returns the newest version string in the list
- MalwareFilter.route(v) (locked) returns "DELIVER" for a loadable version,
  "QUEUED" otherwise

Observed: at 00:00 on 2022-01-01 the new engine version "2201010001" failed
to load and every message stayed in the queue.`,
    logs: `[FIPFS] Cannot convert "2201010001" to long.
[FIPFS] The FIP-FS Scan Process failed initialization.
[Transport] 18,402 messages in submission queue`,
    files: [
      {
        filePath: "src/filter/EngineVersion.java",
        isEditable: true,
        language: "java",
        content: `class EngineVersion {
    static int parse(String version) {
        if (version == null || version.length() != 10) {
            throw new IllegalArgumentException("bad engine version: " + version);
        }
        return Integer.parseInt(version);
    }

    static boolean isNewer(String candidate, String current) {
        return parse(candidate) > parse(current);
    }

    static String latest(List<String> versions) {
        String best = null;
        for (String v : versions) {
            if (best == null || isNewer(v, best)) best = v;
        }
        return best;
    }
}`,
      },
      {
        filePath: "src/filter/MalwareFilter.java",
        isEditable: false,
        language: "java",
        content: `class MalwareFilter {
    // Transport asks the filter before handing a message on. If the scan
    // engine's version cannot be loaded, nothing can be scanned and the
    // message waits in the queue.
    static String route(String engineVersion) {
        try {
            EngineVersion.parse(engineVersion);
            return "DELIVER";
        } catch (IllegalArgumentException e) {
            return "QUEUED";
        }
    }
}`,
      },
    ],
    tests: [
      {
        name: "a 2021 version parses",
        isHidden: false,
        source: `                BugAssert.equal(EngineVersion.parse("2112310001"), 2112310001L, "Dec 31, 2021 00:01");
                BugAssert.equal(MalwareFilter.route("2112310001"), "DELIVER");`,
      },
      {
        name: "the first version of 2022 still delivers mail",
        isHidden: false,
        source: `                BugAssert.equal(MalwareFilter.route("2201010001"), "DELIVER", "Jan 1, 2022 00:01");`,
      },
      {
        name: "2022 versions parse to their full value",
        isHidden: true,
        source: `                BugAssert.equal(EngineVersion.parse("2201010001"), 2201010001L);
                BugAssert.equal(EngineVersion.parse("9912312359"), 9912312359L);`,
      },
      {
        name: "comparisons across the new year",
        isHidden: true,
        source: `                BugAssert.ok(EngineVersion.isNewer("2201010001", "2112310001"), "2022 is newer than 2021");
                BugAssert.ok(!EngineVersion.isNewer("2112310001", "2201010001"), "and not the other way round");
                BugAssert.equal(EngineVersion.latest(Arrays.asList("2112310001", "2201010001", "2112300001")), "2201010001");`,
      },
      {
        name: "malformed versions are still refused",
        isHidden: true,
        source: `                BugAssert.equal(MalwareFilter.route("22O1010001"), "QUEUED", "letter O");
                BugAssert.equal(MalwareFilter.route("123"), "QUEUED", "too short");`,
      },
    ],
    fixedFiles: {
      "src/filter/EngineVersion.java": `class EngineVersion {
    // yyMMddHHmm reaches 10 digits' worth of magnitude: every version from
    // 2022 on is above Integer.MAX_VALUE (2,147,483,647). Hold it in a long.
    static long parse(String version) {
        if (version == null || version.length() != 10) {
            throw new IllegalArgumentException("bad engine version: " + version);
        }
        return Long.parseLong(version);
    }

    static boolean isNewer(String candidate, String current) {
        return parse(candidate) > parse(current);
    }

    static String latest(List<String> versions) {
        String best = null;
        for (String v : versions) {
            if (best == null || isNewer(v, best)) best = v;
        }
        return best;
    }
}`,
    },
  },

  {
    title: "Every 256th Setup",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Overflow", "State"],
    description: `Modelled on the **Therac-25** radiation therapy accidents (1985–1987), analysed by Nancy Leveson and Clark Turner. In one of the software faults they documented, a one-byte flag was *incremented* on every pass of the set-up routine instead of being set to a fixed non-zero value. On every 256th pass it rolled over to zero — and zero meant "skip the check" that the turntable was in the right position. If the operator pressed the set button at that moment, treatment could proceed with the turntable out of place.

\`setup.py\` reconstructs that routine; \`hardware.py\` models the one-byte register.

Fix \`setup_pass\` so the position check runs on every single pass.`,
    bugReport: `**BUG-CLASS3** · Priority: Critical (patient safety) · Reported by: physics QA

setup_pass(state, collimator_in_position) runs one pass of the set-up test:
- state["passes"] increases by 1
- state["class3"] is a one-byte flag (0..255) meaning "a position check is
  pending"; after every pass it must be non-zero
- returns "HOLD" whenever the collimator is NOT in position and "READY" when
  it is — on every pass, however many passes have already run

Observed: during a long set-up, pass 256 reported READY with the collimator
out of position.`,
    logs: `[setup] pass 255 class3=255 chkcol=HOLD
[setup] pass 256 class3=0 chkcol=skipped -> READY
[setup] operator SET accepted`,
    files: [
      {
        filePath: "src/therac/setup.py",
        isEditable: true,
        language: "python",
        content: `hardware = bug_require("./hardware.py")


def setup_pass(state, collimator_in_position):
    state["passes"] += 1
    state["class3"] = (state["class3"] + 1) & hardware.BYTE_MASK
    if state["class3"] != 0:
        if not collimator_in_position:
            return "HOLD"
    return "READY"
`,
      },
      {
        filePath: "src/therac/hardware.py",
        isEditable: false,
        language: "python",
        content: `# The flag lives in a single byte of shared memory: arithmetic on it
# wraps at 256, exactly as the hardware does.
BYTE_MASK = 0xFF


def new_state():
    return {"class3": 0, "passes": 0}
`,
      },
    ],
    tests: [
      {
        name: "the first pass holds when out of position",
        isHidden: false,
        source: `setup = bug_require("src/therac/setup")
hw = bug_require("src/therac/hardware")
s = hw.new_state()
assert_.equal(setup.setup_pass(s, False), "HOLD")
assert_.equal(setup.setup_pass(s, True), "READY")`,
      },
      {
        name: "pass 256 still checks the position",
        isHidden: false,
        source: `setup = bug_require("src/therac/setup")
hw = bug_require("src/therac/hardware")
s = hw.new_state()
for i in range(255):
    setup.setup_pass(s, True)
assert_.equal(setup.setup_pass(s, False), "HOLD", "pass 256")`,
      },
      {
        name: "pass 512 still checks the position",
        isHidden: true,
        source: `setup = bug_require("src/therac/setup")
hw = bug_require("src/therac/hardware")
s = hw.new_state()
for i in range(511):
    setup.setup_pass(s, False)
assert_.equal(setup.setup_pass(s, False), "HOLD", "pass 512")
assert_.equal(s["passes"], 512)`,
      },
      {
        name: "the flag stays a non-zero byte",
        isHidden: true,
        source: `setup = bug_require("src/therac/setup")
hw = bug_require("src/therac/hardware")
s = hw.new_state()
for i in range(768):
    setup.setup_pass(s, True)
    assert_.ok(1 <= s["class3"] <= 255, "class3 must be a non-zero byte after pass " + str(i + 1))
assert_.equal(s["passes"], 768)`,
      },
      {
        name: "an in-position pass 256 is ready",
        isHidden: true,
        source: `setup = bug_require("src/therac/setup")
hw = bug_require("src/therac/hardware")
s = hw.new_state()
for i in range(255):
    setup.setup_pass(s, True)
assert_.equal(setup.setup_pass(s, True), "READY")`,
      },
    ],
    fixedFiles: {
      "src/therac/setup.py": `hardware = bug_require("./hardware.py")

# Any fixed non-zero value means "check pending".
CHECK_PENDING = 1


def setup_pass(state, collimator_in_position):
    state["passes"] += 1
    # Incrementing a one-byte flag wraps to 0 on every 256th pass, and 0 reads
    # as "nothing to check". Set it; never count with it.
    state["class3"] = CHECK_PENDING
    if not collimator_in_position:
        return "HOLD"
    return "READY"
`,
    },
  },

  {
    title: "The Spreadsheet That Ran Out of Rows",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Limits", "Validation"],
    description: `Modelled on **Public Health England's October 2020 reporting failure**: nearly 16,000 positive COVID-19 test results were left out of the daily figures, and their contacts were not traced, for about a week. Lab results arrived as CSV files and were loaded into Excel templates in the legacy XLS format, which holds at most 65,536 rows per sheet; everything past the limit was silently dropped.

\`exporter.py\` turns records into legacy sheets. It stops at the row limit without a word.

Fix \`export_sheets\` so every record is exported, split across as many sheets as it takes.`,
    bugReport: `**BUG-XLSROWS** · Priority: Critical (data loss) · Reported by: data pipeline

export_sheets(records, max_rows=None) — max_rows defaults to
limits.XLS_MAX_ROWS (65,536):
- returns a list of sheets; every sheet is [limits.HEADER] followed by up to
  max_rows - 1 records, so no sheet has more than max_rows rows
- every record appears exactly once, in the original order; sheets are
  filled completely before the next one starts
- no records -> [[HEADER]]
- max_rows < 2 cannot hold a record: raise ValueError

Observed: a 70,000-row lab file produced one full sheet; 4,465 results were
never uploaded, with no error.`,
    logs: `[ingest] lab_feed_2020-10-01.csv: 70000 rows
[export] wrote results.xls (65536 rows)
[upload] 65535 results uploaded`,
    files: [
      {
        filePath: "src/pipeline/exporter.py",
        isEditable: true,
        language: "python",
        content: `limits = bug_require("./limits.py")


def export_sheets(records, max_rows=None):
    if max_rows is None:
        max_rows = limits.XLS_MAX_ROWS
    sheet = [limits.HEADER]
    for record in records:
        if len(sheet) >= max_rows:
            break
        sheet.append(record)
    return [sheet]
`,
      },
      {
        filePath: "src/pipeline/limits.py",
        isEditable: false,
        language: "python",
        content: `# The legacy spreadsheet format: one sheet holds at most this many rows,
# the header row included. Newer formats allow more; the upload templates
# still use this one.
XLS_MAX_ROWS = 65536
HEADER = "specimen_id,result,lab"
`,
      },
    ],
    tests: [
      {
        name: "a small file fits one sheet",
        isHidden: false,
        source: `ex = bug_require("src/pipeline/exporter")
lim = bug_require("src/pipeline/limits")
assert_.equal(ex.export_sheets(["a", "b", "c"]), [[lim.HEADER, "a", "b", "c"]])`,
      },
      {
        name: "70,000 records are all exported",
        isHidden: false,
        source: `ex = bug_require("src/pipeline/exporter")
records = list(range(70000))
sheets = ex.export_sheets(records)
assert_.equal(sum(len(s) - 1 for s in sheets), 70000, "no record may be dropped")
assert_.equal(len(sheets), 2)
assert_.ok(all(len(s) <= 65536 for s in sheets), "each sheet within the limit")`,
      },
      {
        name: "small sheets split in order",
        isHidden: true,
        source: `ex = bug_require("src/pipeline/exporter")
H = bug_require("src/pipeline/limits").HEADER
assert_.equal(ex.export_sheets([1, 2, 3, 4, 5, 6, 7], 4), [[H, 1, 2, 3], [H, 4, 5, 6], [H, 7]])`,
      },
      {
        name: "the exact boundary",
        isHidden: true,
        source: `ex = bug_require("src/pipeline/exporter")
H = bug_require("src/pipeline/limits").HEADER
one = ex.export_sheets(list(range(65535)))
assert_.equal(len(one), 1, "65,535 records fill one sheet exactly")
two = ex.export_sheets(list(range(65536)))
assert_.equal(len(two), 2)
assert_.equal(two[1], [H, 65535])
flat = [r for s in two for r in s[1:]]
assert_.ok(flat == list(range(65536)), "order kept, nothing repeated")`,
      },
      {
        name: "empty input and impossible limits",
        isHidden: true,
        source: `ex = bug_require("src/pipeline/exporter")
H = bug_require("src/pipeline/limits").HEADER
assert_.equal(ex.export_sheets([]), [[H]])
assert_.throws(lambda: ex.export_sheets([1], 1), "a one-row sheet holds only the header")`,
      },
    ],
    fixedFiles: {
      "src/pipeline/exporter.py": `limits = bug_require("./limits.py")


def export_sheets(records, max_rows=None):
    if max_rows is None:
        max_rows = limits.XLS_MAX_ROWS
    per_sheet = max_rows - 1
    if per_sheet < 1:
        raise ValueError("a sheet of %d rows cannot hold any record" % max_rows)
    # The format's row limit is a property of one sheet, not of the data:
    # spill into another sheet instead of silently dropping what is left.
    records = list(records)
    if not records:
        return [[limits.HEADER]]
    sheets = []
    for start in range(0, len(records), per_sheet):
        sheets.append([limits.HEADER] + records[start:start + per_sheet])
    return sheets
`,
    },
  },

  {
    title: "The Two-Terabyte Wall",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Limits", "Storage"],
    description: `Modelled on **Instapaper's February 2017 outage**: the service was down for well over a day because its MySQL database could no longer write to its bookmarks table. The table had been created before April 2014, so its data file lived on an ext3 filesystem with a 2 TB per-file limit; once the file reached that size, inserts failed. Recovery meant moving the data onto a new database instance.

\`planner.js\` chooses which partition file a new row goes into. It does roll over to a fresh partition before a file is full — but it measures "full" against one number for every file instead of the limit of the filesystem that file actually lives on.

Fix \`insert\` so no write ever pushes a file past its own filesystem's limit.`,
    bugReport: `**BUG-EFBIG** · Priority: Critical (writes failing) · Reported by: on-call DBA

store = { partitions: [{ name, fs, bytes }, ...] }; the last partition is the
active one. limits.FS_FILE_LIMIT gives each filesystem's per-file limit.

insert(store, rowBytes):
- if the row fits in the active partition — bytes + rowBytes <=
  FS_FILE_LIMIT[active.fs]; reaching the limit exactly is fine — write it
  there
- otherwise first append a new partition
  { name: "bookmarks_" + <its index in the list>, fs: limits.NEW_PARTITION_FS, bytes: 0 }
  and write the row there
- a row too large for even a new partition throws, and nothing changes
- returns the name of the partition the row was written to

Observed: the active partition (ext3, created 2013) reached 2 TiB and every
insert failed with EFBIG; the planner never rolled over because the file was
nowhere near the 16 TiB table limit.`,
    logs: `[mysql] ERROR 1114 (HY000): The table 'bookmarks' is full
[disk] EFBIG: bookmarks_0 would exceed the ext3 file size limit
[planner] active partition bookmarks_0 at 12.5% of MAX_TABLE_BYTES`,
    files: [
      {
        filePath: "src/storage/planner.js",
        isEditable: true,
        language: "javascript",
        content: `var disk = require("./disk");
var limits = require("./limits");

// Chooses the partition file a new row is written to.
exports.insert = function (store, rowBytes) {
  var active = store.partitions[store.partitions.length - 1];
  if (active.bytes + rowBytes > limits.MAX_TABLE_BYTES) {
    active = { name: "bookmarks_" + store.partitions.length, fs: limits.NEW_PARTITION_FS, bytes: 0 };
    store.partitions.push(active);
  }
  disk.write(active, rowBytes);
  return active.name;
};
`,
      },
      {
        filePath: "src/storage/limits.js",
        isEditable: false,
        language: "javascript",
        content: `var TiB = 1024 * 1024 * 1024 * 1024;
exports.TiB = TiB;

// Largest single file each filesystem can hold.
exports.FS_FILE_LIMIT = { ext3: 2 * TiB, ext4: 16 * TiB };

// Largest table the database engine is configured for.
exports.MAX_TABLE_BYTES = 16 * TiB;

// New partitions are always created on the current filesystem. Partitions
// created years ago keep whatever filesystem they were created on.
exports.NEW_PARTITION_FS = "ext4";
`,
      },
      {
        filePath: "src/storage/disk.js",
        isEditable: false,
        language: "javascript",
        content: `var limits = require("./limits");

exports.write = function (file, bytes) {
  var cap = limits.FS_FILE_LIMIT[file.fs];
  if (file.bytes + bytes > cap) {
    throw new Error("EFBIG: " + file.name + " would exceed the " + file.fs + " file size limit");
  }
  file.bytes += bytes;
};
`,
      },
    ],
    tests: [
      {
        name: "a row goes into the active ext4 partition",
        isHidden: false,
        source: `var P = require("src/storage/planner");
var store = { partitions: [{ name: "bookmarks_0", fs: "ext4", bytes: 1000 }] };
assert.equal(P.insert(store, 500), "bookmarks_0");
assert.equal(store.partitions, [{ name: "bookmarks_0", fs: "ext4", bytes: 1500 }]);`,
      },
      {
        name: "a full ext3 partition rolls over",
        isHidden: false,
        source: `var P = require("src/storage/planner");
var L = require("src/storage/limits");
var store = { partitions: [{ name: "bookmarks_0", fs: "ext3", bytes: 2 * L.TiB - 100 }] };
assert.equal(P.insert(store, 500), "bookmarks_1", "must roll over before the 2 TiB file limit");
assert.equal(store.partitions[1], { name: "bookmarks_1", fs: "ext4", bytes: 500 });
assert.equal(store.partitions[0].bytes, 2 * L.TiB - 100, "the old file is untouched");`,
      },
      {
        name: "filling an ext3 file exactly to its limit is allowed",
        isHidden: true,
        source: `var P = require("src/storage/planner");
var L = require("src/storage/limits");
var store = { partitions: [{ name: "bookmarks_0", fs: "ext3", bytes: 2 * L.TiB - 100 }] };
assert.equal(P.insert(store, 100), "bookmarks_0");
assert.equal(store.partitions[0].bytes, 2 * L.TiB);
assert.equal(P.insert(store, 1), "bookmarks_1", "the next row rolls over");
assert.equal(P.insert(store, 1), "bookmarks_1", "and later rows follow it");`,
      },
      {
        name: "an ext4 partition can grow past 2 TiB",
        isHidden: true,
        source: `var P = require("src/storage/planner");
var L = require("src/storage/limits");
var store = { partitions: [
  { name: "bookmarks_0", fs: "ext3", bytes: 2 * L.TiB },
  { name: "bookmarks_1", fs: "ext4", bytes: 3 * L.TiB }
] };
assert.equal(P.insert(store, 10), "bookmarks_1");
assert.equal(store.partitions.length, 2);`,
      },
      {
        name: "a row too large for any file is refused",
        isHidden: true,
        source: `var P = require("src/storage/planner");
var L = require("src/storage/limits");
var store = { partitions: [{ name: "bookmarks_0", fs: "ext4", bytes: 0 }] };
assert.throws(function () { P.insert(store, 17 * L.TiB); });
assert.equal(store.partitions, [{ name: "bookmarks_0", fs: "ext4", bytes: 0 }], "nothing changes");`,
      },
    ],
    fixedFiles: {
      "src/storage/planner.js": `var disk = require("./disk");
var limits = require("./limits");

// Chooses the partition file a new row is written to.
exports.insert = function (store, rowBytes) {
  if (rowBytes > limits.FS_FILE_LIMIT[limits.NEW_PARTITION_FS]) {
    throw new Error("row of " + rowBytes + " bytes cannot fit in any partition");
  }
  var active = store.partitions[store.partitions.length - 1];
  // The ceiling that matters is the filesystem's per-file limit for THIS
  // file — an old partition on ext3 hits its 2 TiB wall long before the
  // table limit the engine is configured for.
  if (active.bytes + rowBytes > limits.FS_FILE_LIMIT[active.fs]) {
    active = { name: "bookmarks_" + store.partitions.length, fs: limits.NEW_PARTITION_FS, bytes: 0 };
    store.partitions.push(active);
  }
  disk.write(active, rowBytes);
  return active.name;
};
`,
    },
  },

  {
    title: "One Plus Two Plus Three Is Twenty-Four",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["State", "Rendering"],
    description: `Modelled on the **iOS 11 Calculator bug** (2017): typing 1 + 2 + 3 = quickly gave 24. The operator keys played a highlight animation after each tap, and a tap on an operator whose animation was still running was ignored — so the second + vanished, and the input became 1 + 23. Apple fixed it in iOS 11.2.

\`calculator.js\` reproduces the keypad. Every keypress carries its own timestamp, so the tests replay fast and slow typing deterministically.

Fix \`press\` so every keypress is applied, whatever the animation is doing.`,
    bugReport: `**BUG-CALC24** · Priority: High · Reported by: a lot of people

createCalculator() returns { press(key, nowMs), display() }. Keys are
"0"-"9", "+", "-" and "=".
- digits build the current entry; display() shows the entry
- an operator applies the pending operation to the running total (the first
  operator just takes the entry as the total), becomes the pending operation,
  and display() shows the running total
- "=" applies the pending operation, shows the result and clears the state
  so the next digit starts a new calculation
- EVERY press is applied in order, however soon after the previous one it
  arrives. The operator animation (ui.OPERATOR_ANIMATION_MS) is cosmetic.

Observed: 1 + 2 + 3 = typed quickly shows 24; typed slowly it shows 6.`,
    logs: `[keypad] t=0 "1"  t=60 "+"  t=120 "2"  t=180 "+" (animating, ignored)  t=240 "3"  t=300 "="
[display] 24`,
    files: [
      {
        filePath: "src/calc/calculator.js",
        isEditable: true,
        language: "javascript",
        content: `var ui = require("./ui");

exports.createCalculator = function () {
  var total = null;
  var entry = "";
  var pending = null;
  var shown = "0";
  var animatingUntil = {};

  function settle() {
    var value = entry === "" ? 0 : Number(entry);
    if (total === null) total = value;
    else if (pending === "+") total = total + value;
    else if (pending === "-") total = total - value;
    entry = "";
  }

  return {
    press: function (key, now) {
      if (ui.isOperator(key)) {
        if (now < (animatingUntil[key] || 0)) return;
        animatingUntil[key] = now + ui.OPERATOR_ANIMATION_MS;
        settle();
        pending = key;
        shown = String(total);
      } else if (key === "=") {
        settle();
        shown = String(total);
        total = null;
        pending = null;
      } else {
        entry += key;
        shown = entry;
      }
    },
    display: function () { return shown; }
  };
};
`,
      },
      {
        filePath: "src/calc/ui.js",
        isEditable: false,
        language: "javascript",
        content: `// How long an operator key's highlight animation runs after a tap.
exports.OPERATOR_ANIMATION_MS = 350;

exports.isOperator = function (key) {
  return key === "+" || key === "-";
};
`,
      },
    ],
    tests: [
      {
        name: "slow typing adds up",
        isHidden: false,
        source: `var calc = require("src/calc/calculator").createCalculator();
var t = 0;
"1+2+3=".split("").forEach(function (k) { calc.press(k, t); t += 1000; });
assert.equal(calc.display(), "6");`,
      },
      {
        name: "fast typing adds up too",
        isHidden: false,
        source: `var calc = require("src/calc/calculator").createCalculator();
var t = 0;
"1+2+3=".split("").forEach(function (k) { calc.press(k, t); t += 60; });
assert.equal(calc.display(), "6", "no keypress may be dropped");`,
      },
      {
        name: "fast subtraction with multi-digit numbers",
        isHidden: true,
        source: `var calc = require("src/calc/calculator").createCalculator();
var t = 0;
"12-5-3=".split("").forEach(function (k) { calc.press(k, t); t += 40; });
assert.equal(calc.display(), "4");`,
      },
      {
        name: "the running total shows after each fast operator",
        isHidden: true,
        source: `var calc = require("src/calc/calculator").createCalculator();
var t = 0;
"5+5+5+".split("").forEach(function (k) { calc.press(k, t); t += 30; });
assert.equal(calc.display(), "15");
calc.press("5", t);
calc.press("=", t + 30);
assert.equal(calc.display(), "20");`,
      },
      {
        name: "mixed operators and a fresh calculation",
        isHidden: true,
        source: `var calc = require("src/calc/calculator").createCalculator();
var t = 0;
"9+1-4=".split("").forEach(function (k) { calc.press(k, t); t += 50; });
assert.equal(calc.display(), "6");
"2+2=".split("").forEach(function (k) { calc.press(k, t); t += 50; });
assert.equal(calc.display(), "4", "= starts over");`,
      },
    ],
    fixedFiles: {
      "src/calc/calculator.js": `var ui = require("./ui");

exports.createCalculator = function () {
  var total = null;
  var entry = "";
  var pending = null;
  var shown = "0";

  function settle() {
    var value = entry === "" ? 0 : Number(entry);
    if (total === null) total = value;
    else if (pending === "+") total = total + value;
    else if (pending === "-") total = total - value;
    entry = "";
  }

  return {
    // The animation is presentation; it must never gate input. Dropping an
    // operator tap while it plays silently merges two operands (1 + 23).
    press: function (key) {
      if (ui.isOperator(key)) {
        settle();
        pending = key;
        shown = String(total);
      } else if (key === "=") {
        settle();
        shown = String(total);
        total = null;
        pending = null;
      } else {
        entry += key;
        shown = entry;
      }
    },
    display: function () { return shown; }
  };
};
`,
    },
  },

  {
    title: "The Kill Screen at Level 256",
    difficulty: "medium",
    category: "frontend",
    language: "java",
    tags: ["Overflow", "Rendering"],
    description: `Modelled on **Pac-Man's level 256 "kill screen"** (Namco, 1980): the game keeps its level counter in a single byte. On level 256 the routine that draws the fruit row at the bottom of the screen overflows — its fruit count wraps to zero, the loop that counts down to zero runs 256 times, and it writes garbage over the right half of the maze, leaving the level impossible to finish.

\`FruitRow.java\` reconstructs that routine against a small screen model (\`MazeScreen.java\`): slots 0–6 are the fruit row, and any other slot lands on maze tiles.

Fix \`FruitRow\` so every level draws at most seven fruits and nothing ever touches the maze.`,
    bugReport: `**BUG-LVL256** · Priority: High · Reported by: a very good player

levelIndex is 0 on level 1 (level 256 is levelIndex 255; levels past 256
must work too).
- fruitCount(levelIndex) = min(levelIndex + 1, 7), for every levelIndex >= 0
- draw(screen, levelIndex) puts exactly fruitCount(levelIndex) fruits into
  slots 0 .. count-1 and returns that count; screen.corruptedTiles stays 0

Observed: on level 256 draw() returned 256 and 249 maze tiles were
overwritten.`,
    logs: `[game] level 256 start
[render] fruit row: 256 sprites drawn
[render] maze tiles overwritten: 249`,
    files: [
      {
        filePath: "src/game/FruitRow.java",
        isEditable: true,
        language: "java",
        content: `class FruitRow {
    // levelIndex is the game's level counter: 0 on level 1, kept in one byte.
    static int fruitCount(int levelIndex) {
        int n = (levelIndex + 1) & 0xFF;
        return n < MazeScreen.FRUIT_SLOTS ? n : MazeScreen.FRUIT_SLOTS;
    }

    static int draw(MazeScreen screen, int levelIndex) {
        int n = fruitCount(levelIndex);
        int slot = 0;
        do {
            screen.putFruit(slot, levelIndex - slot);
            slot++;
            n = (n - 1) & 0xFF;
        } while (n != 0);
        return slot;
    }
}`,
      },
      {
        filePath: "src/game/MazeScreen.java",
        isEditable: false,
        language: "java",
        content: `class MazeScreen {
    static final int FRUIT_SLOTS = 7;
    final int[] fruitRow = new int[FRUIT_SLOTS];
    int corruptedTiles = 0;

    // Draws one fruit sprite. A slot outside the fruit row lands on the maze.
    void putFruit(int slot, int fruit) {
        if (slot >= 0 && slot < FRUIT_SLOTS) {
            fruitRow[slot] = fruit;
        } else {
            corruptedTiles++;
        }
    }
}`,
      },
    ],
    tests: [
      {
        name: "level 1 draws one fruit",
        isHidden: false,
        source: `                MazeScreen screen = new MazeScreen();
                BugAssert.equal(FruitRow.draw(screen, 0), 1, "one fruit on level 1");
                BugAssert.equal(screen.corruptedTiles, 0);`,
      },
      {
        name: "level 256 draws seven fruits and leaves the maze alone",
        isHidden: false,
        source: `                MazeScreen screen = new MazeScreen();
                BugAssert.equal(FruitRow.draw(screen, 255), 7, "level 256");
                BugAssert.equal(screen.corruptedTiles, 0, "no maze tile may be overwritten");`,
      },
      {
        name: "fruit counts across the levels",
        isHidden: true,
        source: `                BugAssert.equal(FruitRow.fruitCount(2), 3, "level 3");
                BugAssert.equal(FruitRow.fruitCount(6), 7, "level 7");
                BugAssert.equal(FruitRow.fruitCount(20), 7, "level 21");
                BugAssert.equal(FruitRow.fruitCount(255), 7, "level 256");`,
      },
      {
        name: "levels past 256 keep working",
        isHidden: true,
        source: `                BugAssert.equal(FruitRow.fruitCount(511), 7, "level 512");
                MazeScreen screen = new MazeScreen();
                BugAssert.equal(FruitRow.draw(screen, 1000), 7);
                BugAssert.equal(screen.corruptedTiles, 0);`,
      },
      {
        name: "level 3 fills the first three slots",
        isHidden: true,
        source: `                MazeScreen screen = new MazeScreen();
                BugAssert.equal(FruitRow.draw(screen, 2), 3);
                BugAssert.equal(screen.fruitRow, new int[] { 2, 1, 0, 0, 0, 0, 0 });`,
      },
    ],
    fixedFiles: {
      "src/game/FruitRow.java": `class FruitRow {
    // levelIndex is the game's level counter: 0 on level 1.
    static int fruitCount(int levelIndex) {
        // Count in a wide int: masking to a byte turns level 256 into 0, and
        // 0 is not "no fruit" to a loop that counts down to zero.
        return Math.min(levelIndex + 1, MazeScreen.FRUIT_SLOTS);
    }

    static int draw(MazeScreen screen, int levelIndex) {
        int n = fruitCount(levelIndex);
        // Test before drawing, never after: a count of 0 must draw nothing.
        for (int slot = 0; slot < n; slot++) {
            screen.putFruit(slot, levelIndex - slot);
        }
        return n;
    }
}`,
    },
  },

  {
    title: "The Quote That Escaped the Link",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Security", "Parsing"],
    description: `Modelled on the **Twitter "onMouseOver" worm** (21 September 2010): a tweet containing a link followed by an @ and a double quote broke out of the \`href\` attribute Twitter's auto-linker generated, adding an attribute of the author's choosing to the link. Merely hovering over such a tweet ran script, and self-retweeting versions spread across the site within hours. Twitter said it had fixed the bug the month before, and a later site update had brought it back.

\`linkify.js\` turns the URLs in a tweet into links and escapes everything else — but its escaping was written for text between tags, not for attribute values.

Fix \`linkify\` so neither the text nor a link can break out of its context.`,
    bugReport: `**BUG-HOVER** · Priority: Critical (XSS) · Reported by: security

linkify(text) returns HTML:
- a URL is "http://" or "https://" followed by non-whitespace characters;
  each becomes <a href="E">E</a>, where E is the escaped URL
- all other text is escaped
- escaping is the same everywhere: & -> &amp;  < -> &lt;  > -> &gt;
  " -> &quot;  ' -> &#39;
- so no URL or text can ever close the href attribute or open a tag

Observed: a URL containing a double quote ends the href value early and the
rest of the URL is parsed as new attributes on the <a>.`,
    logs: `[render] tweet 25094329857 -> <a href="http://t.co/@"onmouseover="...">
[csp-report] inline event handler executed on twitter.com`,
    files: [
      {
        filePath: "src/tweets/linkify.js",
        isEditable: true,
        language: "javascript",
        content: `var URL_RE = /https?:\\/\\/\\S+/g;

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

exports.linkify = function (text) {
  var out = "";
  var last = 0;
  var m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    var url = escapeHtml(m[0]);
    out += '<a href="' + url + '">' + url + "</a>";
    last = m.index + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
};
`,
      },
      {
        filePath: "src/tweets/CONTEXTS.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A rendered tweet puts user-controlled text in two contexts:
- text between tags
- the value of a double-quoted href attribute

A character that is harmless in one context can end the other. Escaping has
to cover every character that is special in EITHER context.
*/
`,
      },
    ],
    tests: [
      {
        name: "a plain link is linkified",
        isHidden: false,
        source: `var linkify = require("src/tweets/linkify").linkify;
assert.equal(linkify("see https://t.co/abc now"), 'see <a href="https://t.co/abc">https://t.co/abc</a> now');`,
      },
      {
        name: "a double quote cannot close the href",
        isHidden: false,
        source: `var linkify = require("src/tweets/linkify").linkify;
var out = linkify('http://t.co/@"onmouseover="x"');
assert.equal(out, '<a href="http://t.co/@&quot;onmouseover=&quot;x&quot;">http://t.co/@&quot;onmouseover=&quot;x&quot;</a>');`,
      },
      {
        name: "text is escaped for every context",
        isHidden: true,
        source: `var linkify = require("src/tweets/linkify").linkify;
assert.equal(linkify('say "hi" & <b>'), "say &quot;hi&quot; &amp; &lt;b&gt;");
assert.equal(linkify("it's"), "it&#39;s");`,
      },
      {
        name: "ampersands and single quotes in URLs",
        isHidden: true,
        source: `var linkify = require("src/tweets/linkify").linkify;
assert.equal(linkify("https://a.co/?x=1&y=2"), '<a href="https://a.co/?x=1&amp;y=2">https://a.co/?x=1&amp;y=2</a>');
assert.equal(linkify("https://a.co/'x"), '<a href="https://a.co/&#39;x">https://a.co/&#39;x</a>');`,
      },
      {
        name: "each link has exactly its own two quotes",
        isHidden: true,
        source: `var linkify = require("src/tweets/linkify").linkify;
var out = linkify('a http://x.io/"b" c https://y.io/" d');
assert.equal(out.split('"').length - 1, 4, "two links, two attribute quotes each");`,
      },
    ],
    fixedFiles: {
      "src/tweets/linkify.js": `var URL_RE = /https?:\\/\\/\\S+/g;

// The same string lands in an attribute value and in text, so escape for
// both: a quote is harmless between tags but ends a quoted attribute.
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

exports.linkify = function (text) {
  var out = "";
  var last = 0;
  var m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    var url = escapeHtml(m[0]);
    out += '<a href="' + url + '">' + url + "</a>";
    last = m.index + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
};
`,
    },
  },

  {
    title: "Root, No Password, Second Try",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth"],
    description: `Modelled on the **macOS High Sierra root login bug** (CVE-2017-13872, November 2017): typing \`root\` with an empty password into an authentication dialog failed the first time and succeeded the second. The root account ships disabled, with no password at all; the credential check, finding no stored password hash, took the path meant for upgrading legacy passwords and saved the one just typed. Apple described it as a logic error in the validation of credentials and shipped a security update within a day.

\`auth.js\` reconstructs that check. \`hashing.js\` holds the (toy) current hash and legacy formats.

Fix \`authenticate\` so a disabled account never authenticates and a login attempt never sets a password.`,
    bugReport: `**BUG-ROOTLOGIN** · Priority: Critical (privilege escalation) · Reported by: a developer on Twitter

directory: { <username>: { passwordHash: string|null, legacyCrypt: string|null } }

authenticate(directory, username, password):
- unknown user -> false
- an empty password never authenticates, for any account
- passwordHash set -> hashing.verify(password, passwordHash)
- only legacyCrypt set (an account from before the hash upgrade): if
  hashing.verifyLegacy(password, legacyCrypt) the account is upgraded
  (passwordHash = hashing.hash(password), legacyCrypt = null) and the login
  succeeds; otherwise false and nothing changes
- neither set: the account is disabled -> false, and the record is never
  modified

Observed: root/"" fails once, then succeeds — and root now has a password.`,
    logs: `[authd] authenticate root: no shadow hash, upgrading credential
[authd] authenticate root: FAILED
[authd] authenticate root: OK`,
    files: [
      {
        filePath: "src/auth/auth.js",
        isEditable: true,
        language: "javascript",
        content: `var hashing = require("./hashing");

exports.authenticate = function (directory, username, password) {
  var account = directory[username];
  if (!account) return false;
  if (!account.passwordHash) {
    var upgrading = !!account.legacyCrypt;
    if (upgrading && !hashing.verifyLegacy(password, account.legacyCrypt)) return false;
    account.passwordHash = hashing.hash(password);
    account.legacyCrypt = null;
    return upgrading;
  }
  return hashing.verify(password, account.passwordHash);
};
`,
      },
      {
        filePath: "src/auth/hashing.js",
        isEditable: false,
        language: "javascript",
        content: `// Toy formats for the exercise — not real cryptography.
exports.hash = function (password) {
  var h = 7;
  for (var i = 0; i < password.length; i++) h = (h * 31 + password.charCodeAt(i)) >>> 0;
  return "h1$" + h.toString(16) + "$" + password.length;
};

exports.verify = function (password, stored) {
  return exports.hash(password) === stored;
};

exports.legacyCrypt = function (password) {
  return "crypt$" + password.split("").reverse().join("");
};

exports.verifyLegacy = function (password, stored) {
  return exports.legacyCrypt(password) === stored;
};
`,
      },
      {
        filePath: "src/auth/ACCOUNTS.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Account records:
- passwordHash set: a normal account.
- only legacyCrypt set: created before the hash upgrade. A login with the
  right password upgrades it to passwordHash and clears legacyCrypt.
- neither set: the account is disabled. This is how root ships.
*/
`,
      },
    ],
    tests: [
      {
        name: "a normal account checks its password",
        isHidden: false,
        source: `var A = require("src/auth/auth");
var H = require("src/auth/hashing");
var dir = { kai: { passwordHash: H.hash("s3cret"), legacyCrypt: null } };
assert.equal(A.authenticate(dir, "kai", "s3cret"), true);
assert.equal(A.authenticate(dir, "kai", "nope"), false);
assert.equal(A.authenticate(dir, "nobody", "s3cret"), false);`,
      },
      {
        name: "root with an empty password never gets in",
        isHidden: false,
        source: `var A = require("src/auth/auth");
var dir = { root: { passwordHash: null, legacyCrypt: null } };
assert.equal(A.authenticate(dir, "root", ""), false, "first try");
assert.equal(A.authenticate(dir, "root", ""), false, "second try");`,
      },
      {
        name: "a disabled account is never modified by a login attempt",
        isHidden: true,
        source: `var A = require("src/auth/auth");
var dir = { root: { passwordHash: null, legacyCrypt: null } };
A.authenticate(dir, "root", "letmein");
assert.equal(A.authenticate(dir, "root", "letmein"), false);
assert.equal(dir.root, { passwordHash: null, legacyCrypt: null });`,
      },
      {
        name: "a legacy account upgrades on a correct login",
        isHidden: true,
        source: `var A = require("src/auth/auth");
var H = require("src/auth/hashing");
var dir = { old: { passwordHash: null, legacyCrypt: H.legacyCrypt("tiger") } };
assert.equal(A.authenticate(dir, "old", "lion"), false);
assert.equal(dir.old.passwordHash, null, "a wrong password changes nothing");
assert.equal(A.authenticate(dir, "old", "tiger"), true);
assert.equal(dir.old, { passwordHash: H.hash("tiger"), legacyCrypt: null });
assert.equal(A.authenticate(dir, "old", "tiger"), true);`,
      },
      {
        name: "an empty password never authenticates",
        isHidden: true,
        source: `var A = require("src/auth/auth");
var H = require("src/auth/hashing");
var dir = {
  legacy: { passwordHash: null, legacyCrypt: H.legacyCrypt("") },
  blank: { passwordHash: H.hash(""), legacyCrypt: null }
};
assert.equal(A.authenticate(dir, "legacy", ""), false);
assert.equal(dir.legacy.passwordHash, null);
assert.equal(A.authenticate(dir, "blank", ""), false);`,
      },
    ],
    fixedFiles: {
      "src/auth/auth.js": `var hashing = require("./hashing");

exports.authenticate = function (directory, username, password) {
  if (!Object.prototype.hasOwnProperty.call(directory, username)) return false;
  var account = directory[username];
  if (!password) return false;
  if (account.passwordHash) return hashing.verify(password, account.passwordHash);
  // No credential at all means the account is disabled. A login attempt
  // verifies credentials; it must never be the thing that creates one.
  if (!account.legacyCrypt) return false;
  if (!hashing.verifyLegacy(password, account.legacyCrypt)) return false;
  // Upgrade only after the legacy credential has been proven.
  account.passwordHash = hashing.hash(password);
  account.legacyCrypt = null;
  return true;
};
`,
    },
  },
];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE14_ORIGINS: Record<string, string> = {
  "The Feature File That Doubled Overnight": "Cloudflare · 2025",
  "The Blank Field That Crashed Every Region": "Google Cloud · 2025",
  "The Late Enactor and the Empty Record": "AWS DynamoDB · 2025",
  "Secrets for Every Fork": "Travis CI · CVE-2021-41077",
  "The Uploader Nobody Checksummed": "Codecov · 2021",
  "Withdraw, Then Withdraw Again": "The DAO · 2016",
  "The Index That Started at Zero": "Compound · 2021",
  "The Year That Didn't Fit in an Int": "Microsoft Exchange · 2022",
  "Every 256th Setup": "Therac-25 · 1985–87",
  "The Spreadsheet That Ran Out of Rows": "Public Health England · 2020",
  "The Two-Terabyte Wall": "Instapaper · 2017",
  "One Plus Two Plus Three Is Twenty-Four": "Apple iOS 11 · 2017",
  "The Kill Screen at Level 256": "Pac-Man · 1980",
  "The Quote That Escaped the Link": "Twitter · 2010",
  "Root, No Password, Second Try": "macOS · CVE-2017-13872",
};
