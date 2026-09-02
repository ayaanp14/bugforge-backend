/** Wave 6 — database-layer bugs across js / python / java. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE6: BugSpec[] = [

  {
    title: "The N+1 Query Storm",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["ORM", "Performance"],
    description: `Inspired by the outage pattern behind a thousand postmortems: a page renders 50 posts, and the ORM quietly fires **51 queries**. Works fine in staging with 5 rows; melts the primary at scale.

The mock data layer counts queries. Load every author in **one** batched query.`,
    bugReport: `**BUG-N+1** · Priority: High · Reported by: DBA (again)

loadAuthors(posts) must resolve each post's author using AT MOST one query
(db.findUsersByIds). Returned shape: [{ postId, authorName }] in post order.

Observed: one db.findUserById call per post — 51 queries per page render.`,
    logs: `[db] SELECT * FROM users WHERE id = ? (x51 in 40ms)
[alert] primary saturated during feed render`,
    files: [
      {
        filePath: "src/orm/db.js",
        isEditable: false,
        language: "javascript",
        content: `// Mock data layer with a query counter. DO NOT EDIT.
var USERS = { u1: "Ada", u2: "Grace", u3: "Edsger" };
var queries = 0;

exports.findUserById = function (id) {
  queries++;
  return { id: id, name: USERS[id] };
};

exports.findUsersByIds = function (ids) {
  queries++;
  var out = {};
  for (var i = 0; i < ids.length; i++) out[ids[i]] = { id: ids[i], name: USERS[ids[i]] };
  return out;
};

exports.queryCount = function () { return queries; };
exports.resetCount = function () { queries = 0; };
`,
      },
      {
        filePath: "src/orm/authors.js",
        isEditable: true,
        language: "javascript",
        content: `var db = require("./db");

// Resolves the author of every post.
exports.loadAuthors = function (posts) {
  var out = [];
  for (var i = 0; i < posts.length; i++) {
    var user = db.findUserById(posts[i].authorId);
    out.push({ postId: posts[i].id, authorName: user.name });
  }
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "authors resolve correctly and in order",
        isHidden: false,
        source: `var db = require("src/orm/db");
var load = require("src/orm/authors").loadAuthors;
db.resetCount();
var out = load([
  { id: 1, authorId: "u2" },
  { id: 2, authorId: "u1" },
]);
assert.equal(out, [{ postId: 1, authorName: "Grace" }, { postId: 2, authorName: "Ada" }]);`,
      },
      {
        name: "one page load is one query",
        isHidden: false,
        source: `var db = require("src/orm/db");
var load = require("src/orm/authors").loadAuthors;
db.resetCount();
load([
  { id: 1, authorId: "u1" },
  { id: 2, authorId: "u2" },
  { id: 3, authorId: "u3" },
  { id: 4, authorId: "u1" },
]);
assert.equal(db.queryCount(), 1, "batch it!");`,
      },
      {
        name: "an empty page queries at most once",
        isHidden: true,
        source: `var db = require("src/orm/db");
var load = require("src/orm/authors").loadAuthors;
db.resetCount();
assert.equal(load([]), []);
assert.ok(db.queryCount() <= 1);`,
      },
    ],
    fixedFiles: {
      "src/orm/authors.js": `var db = require("./db");

// Resolves the author of every post.
exports.loadAuthors = function (posts) {
  if (posts.length === 0) return [];
  var ids = [];
  for (var i = 0; i < posts.length; i++) {
    if (ids.indexOf(posts[i].authorId) === -1) ids.push(posts[i].authorId);
  }
  var users = db.findUsersByIds(ids);
  var out = [];
  for (var j = 0; j < posts.length; j++) {
    out.push({ postId: posts[j].id, authorName: users[posts[j].authorId].name });
  }
  return out;
};
`,
    },
  },

  {
    title: "Release the Connection!",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Connection Pool", "Error Handling"],
    description: `Inspired by the slow-motion outage every service hits eventually: a query throws, the error path skips \`release()\`, and the pool bleeds one connection per failure until nothing is left at 3 AM.

The pool is locked. \`withConnection\` must release on **every** path.`,
    bugReport: `**BUG-POOL-DRAIN** · Priority: Critical · Reported by: 3 AM pager

withConnection(pool, fn):
- acquires, runs fn(conn), returns its result
- the connection is released whether fn returns OR throws
- the original error still propagates

Observed: pool.available() ratchets down after every failed query, then
"pool exhausted" takes the whole service down.`,
    logs: `[pool] available: 10 -> 9 -> 8 -> ... -> 0
[api] Error: pool exhausted`,
    files: [
      {
        filePath: "src/db/pool.js",
        isEditable: false,
        language: "javascript",
        content: `// Fixed-size connection pool. DO NOT EDIT.
var CAPACITY = 2;
var available = CAPACITY;

exports.acquire = function () {
  if (available === 0) throw new Error("pool exhausted");
  available--;
  return { id: "conn" };
};
exports.release = function () {
  if (available < CAPACITY) available++;
};
exports.available = function () { return available; };
exports.resetAll = function () { available = CAPACITY; };
`,
      },
      {
        filePath: "src/db/withConnection.js",
        isEditable: true,
        language: "javascript",
        content: `var pool = require("./pool");

exports.withConnection = function (fn) {
  var conn = pool.acquire();
  var result = fn(conn);
  pool.release();
  return result;
};
`,
      },
    ],
    tests: [
      {
        name: "the happy path acquires, runs and releases",
        isHidden: false,
        source: `var pool = require("src/db/pool");
var withConn = require("src/db/withConnection").withConnection;
pool.resetAll();
var out = withConn(function () { return 42; });
assert.equal(out, 42);
assert.equal(pool.available(), 2);`,
      },
      {
        name: "a throwing query still releases",
        isHidden: false,
        source: `var pool = require("src/db/pool");
var withConn = require("src/db/withConnection").withConnection;
pool.resetAll();
assert.throws(function () {
  withConn(function () { throw new Error("deadlock"); });
}, "the error must propagate");
assert.equal(pool.available(), 2, "and the connection must come back");`,
      },
      {
        name: "repeated failures never drain the pool",
        isHidden: true,
        source: `var pool = require("src/db/pool");
var withConn = require("src/db/withConnection").withConnection;
pool.resetAll();
for (var i = 0; i < 5; i++) {
  try { withConn(function () { throw new Error("boom"); }); } catch (e) { /* expected */ }
}
assert.equal(pool.available(), 2);`,
      },
    ],
    fixedFiles: {
      "src/db/withConnection.js": `var pool = require("./pool");

exports.withConnection = function (fn) {
  var conn = pool.acquire();
  try {
    return fn(conn);
  } finally {
    pool.release();
  }
};
`,
    },
  },

  {
    title: "The Optimistic Lock That Wasn't",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Concurrency", "Versioning"],
    description: `Inspired by the lost-update bugs behind countless "my changes disappeared" tickets. Two editors load version 4; both save; the second silently erases the first. Optimistic locking exists precisely to stop this — if anyone actually checks the version.

\`optimistic.py\` doesn't.`,
    bugReport: `**BUG-LOST-UPDATE** · Priority: High · Reported by: CMS team

update_row(row, expected_version, changes):
- row["version"] != expected_version -> raise ValueError("conflict")
- otherwise apply changes and INCREMENT row["version"]

Observed: stale writers win, and version never moves off 1.`,
    logs: `[cms] doc 88 saved by editor A (v4) then editor B (v4) -> A's edits gone`,
    files: [
      {
        filePath: "src/store/optimistic.py",
        isEditable: true,
        language: "python",
        content: `# Optimistic-concurrency row update.

def update_row(row, expected_version, changes):
    for key in changes:
        row[key] = changes[key]
    return row
`,
      },
    ],
    tests: [
      {
        name: "a matching version applies and bumps",
        isHidden: false,
        source: `m = bug_require("src/store/optimistic")
row = {"version": 4, "title": "old"}
m.update_row(row, 4, {"title": "new"})
assert_.equal(row["title"], "new")
assert_.equal(row["version"], 5, "version must increment")`,
      },
      {
        name: "a stale version is rejected",
        isHidden: false,
        source: `m = bug_require("src/store/optimistic")
row = {"version": 5, "title": "fresh"}
assert_.throws(lambda: m.update_row(row, 4, {"title": "stale"}), "conflict must raise")
assert_.equal(row["title"], "fresh", "and nothing must change")`,
      },
      {
        name: "sequential saves each bump once",
        isHidden: true,
        source: `m = bug_require("src/store/optimistic")
row = {"version": 1, "body": "a"}
m.update_row(row, 1, {"body": "b"})
m.update_row(row, 2, {"body": "c"})
assert_.equal(row["version"], 3)
assert_.equal(row["body"], "c")`,
      },
    ],
    fixedFiles: {
      "src/store/optimistic.py": `# Optimistic-concurrency row update.

def update_row(row, expected_version, changes):
    if row["version"] != expected_version:
        raise ValueError("conflict")
    for key in changes:
        row[key] = changes[key]
    row["version"] = row["version"] + 1
    return row
`,
    },
  },

  {
    title: "Keyset Without a Tiebreak",
    difficulty: "hard",
    category: "database",
    language: "javascript",
    tags: ["Pagination", "Ordering"],
    description: `Inspired by the pagination bug that silently swallows rows on every busy platform: keyset pagination on \`created_at\` alone. When several rows share a timestamp (bulk imports do this constantly), the next page skips their siblings.

The cursor carries \`(created, id)\` — use both.`,
    bugReport: `**BUG-KEYSET** · Priority: High · Reported by: data eng

nextPage(rows, cursor, limit) — rows pre-sorted by (created, id) ascending:
- return up to limit rows strictly AFTER the cursor position
- "after" means created > cursor.created, OR equal created AND id > cursor.id

Observed: three rows imported in the same second; page 2 starts after the
whole second — two rows never appear anywhere.`,
    logs: `[export] total rows 9, paginated union 7 (2 lost at ts=500)`,
    files: [
      {
        filePath: "src/query/keyset.js",
        isEditable: true,
        language: "javascript",
        content: `// Keyset pagination over rows sorted by (created, id).
exports.nextPage = function (rows, cursor, limit) {
  var out = [];
  for (var i = 0; i < rows.length && out.length < limit; i++) {
    if (rows[i].created > cursor.created) {
      out.push(rows[i]);
    }
  }
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "rows after the cursor timestamp appear",
        isHidden: false,
        source: `var next = require("src/query/keyset").nextPage;
var rows = [
  { id: 1, created: 100 }, { id: 2, created: 200 }, { id: 3, created: 300 },
];
assert.equal(next(rows, { created: 100, id: 1 }, 10).map(function (r) { return r.id; }), [2, 3]);`,
      },
      {
        name: "same-timestamp siblings are not skipped",
        isHidden: false,
        source: `var next = require("src/query/keyset").nextPage;
var rows = [
  { id: 1, created: 500 }, { id: 2, created: 500 }, { id: 3, created: 500 }, { id: 4, created: 600 },
];
assert.equal(next(rows, { created: 500, id: 1 }, 10).map(function (r) { return r.id; }), [2, 3, 4]);`,
      },
      {
        name: "the limit caps the page",
        isHidden: false,
        source: `var next = require("src/query/keyset").nextPage;
var rows = [
  { id: 1, created: 1 }, { id: 2, created: 2 }, { id: 3, created: 3 },
];
assert.equal(next(rows, { created: 0, id: 0 }, 2).length, 2);`,
      },
      {
        name: "paginating the whole set loses nothing",
        isHidden: true,
        source: `var next = require("src/query/keyset").nextPage;
var rows = [];
for (var i = 1; i <= 9; i++) rows.push({ id: i, created: i <= 3 ? 500 : 500 + i });
var seen = [];
var cursor = { created: 0, id: 0 };
for (var p = 0; p < 10; p++) {
  var page = next(rows, cursor, 2);
  if (page.length === 0) break;
  for (var j = 0; j < page.length; j++) seen.push(page[j].id);
  cursor = { created: page[page.length - 1].created, id: page[page.length - 1].id };
}
assert.equal(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9]);`,
      },
    ],
    fixedFiles: {
      "src/query/keyset.js": `// Keyset pagination over rows sorted by (created, id).
exports.nextPage = function (rows, cursor, limit) {
  var out = [];
  for (var i = 0; i < rows.length && out.length < limit; i++) {
    var r = rows[i];
    if (r.created > cursor.created || (r.created === cursor.created && r.id > cursor.id)) {
      out.push(r);
    }
  }
  return out;
};
`,
    },
  },

  {
    title: "IN () Means Nothing",
    difficulty: "easy",
    category: "database",
    language: "javascript",
    tags: ["SQL", "Edge Cases"],
    description: `Inspired by the empty-list crash that has paged every team with a query builder: \`WHERE id IN ()\` is a syntax error in real databases. The empty case must compile to a query that matches **nothing** — deliberately.

The mock engine (locked) is as strict as Postgres.`,
    bugReport: `**BUG-IN-EMPTY** · Priority: High · Reported by: batch jobs

selectByIds(ids) -> { sql, params }:
- non-empty: "SELECT * FROM items WHERE id IN (?, ?, …)" with params
- empty:     "SELECT * FROM items WHERE 1=0" (matches nothing, no params)

Observed: the nightly job passes an empty batch and the whole run dies on a
SQL syntax error.`,
    logs: `[job] SyntaxError: unexpected token ')' in: ... WHERE id IN ()`,
    files: [
      {
        filePath: "src/sql/engine.js",
        isEditable: false,
        language: "javascript",
        content: `// Strict mock engine. DO NOT EDIT.
var ITEMS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

exports.run = function (built) {
  if (built.sql.indexOf("IN ()") !== -1) {
    throw new Error("SyntaxError: unexpected token ')'");
  }
  if (built.sql.indexOf("1=0") !== -1) return [];
  return ITEMS.filter(function (row) {
    return built.params.indexOf(row.id) !== -1;
  });
};
`,
      },
      {
        filePath: "src/sql/selectByIds.js",
        isEditable: true,
        language: "javascript",
        content: `// Builds the batched select.
exports.selectByIds = function (ids) {
  var marks = ids.map(function () { return "?"; }).join(", ");
  return { sql: "SELECT * FROM items WHERE id IN (" + marks + ")", params: ids };
};
`,
      },
    ],
    tests: [
      {
        name: "a normal batch selects its rows",
        isHidden: false,
        source: `var engine = require("src/sql/engine");
var sel = require("src/sql/selectByIds").selectByIds;
var rows = engine.run(sel([2, 4]));
assert.equal(rows.map(function (r) { return r.id; }), [2, 4]);`,
      },
      {
        name: "an empty batch matches nothing without crashing",
        isHidden: false,
        source: `var engine = require("src/sql/engine");
var sel = require("src/sql/selectByIds").selectByIds;
assert.equal(engine.run(sel([])), []);`,
      },
      {
        name: "a single id works",
        isHidden: true,
        source: `var engine = require("src/sql/engine");
var sel = require("src/sql/selectByIds").selectByIds;
assert.equal(engine.run(sel([3])).length, 1);`,
      },
    ],
    fixedFiles: {
      "src/sql/selectByIds.js": `// Builds the batched select.
exports.selectByIds = function (ids) {
  if (ids.length === 0) {
    return { sql: "SELECT * FROM items WHERE 1=0", params: [] };
  }
  var marks = ids.map(function () { return "?"; }).join(", ");
  return { sql: "SELECT * FROM items WHERE id IN (" + marks + ")", params: ids };
};
`,
    },
  },

  {
    title: "NULL Isn't Equal to NULL",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["SQL", "NULL Semantics"],
    description: `Inspired by the SQL lesson everyone learns in production: \`WHERE col = NULL\` matches **nothing**, ever — three-valued logic demands \`IS NULL\`. The report for "orders without a shipping date" has been returning zero rows for a month.

\`where_builder.py\` generates the clause; the locked engine follows real SQL semantics.`,
    bugReport: `**BUG-3VL** · Priority: High · Reported by: analytics

build_where(field, value):
- value is None -> {"clause": "<field> IS NULL", "params": []}
- otherwise     -> {"clause": "<field> = ?", "params": [value]}

Observed: None becomes "= ?" with a NULL param — the engine (correctly)
matches nothing, and ops thinks every order shipped.`,
    logs: `[report] unshipped orders: 0 (warehouse says: definitely not zero)`,
    files: [
      {
        filePath: "src/sql/sqlengine.py",
        isEditable: false,
        language: "python",
        content: `# Mock engine with real SQL NULL semantics. DO NOT EDIT.

def run(rows, where):
    clause = where["clause"]
    params = where["params"]
    field = clause.split(" ")[0]
    if "IS NULL" in clause:
        return [r for r in rows if r.get(field) is None]
    # "= ?" — NULL never equals anything, including NULL.
    value = params[0]
    if value is None:
        return []
    return [r for r in rows if r.get(field) == value]
`,
      },
      {
        filePath: "src/sql/where_builder.py",
        isEditable: true,
        language: "python",
        content: `# Builds a WHERE clause for a single field.

def build_where(field, value):
    return {"clause": field + " = ?", "params": [value]}
`,
      },
    ],
    tests: [
      {
        name: "null filters use IS NULL",
        isHidden: false,
        source: `eng = bug_require("src/sql/sqlengine")
b = bug_require("src/sql/where_builder")
rows = [
    {"id": 1, "shipped_at": None},
    {"id": 2, "shipped_at": 500},
    {"id": 3, "shipped_at": None},
]
out = eng.run(rows, b.build_where("shipped_at", None))
assert_.equal([r["id"] for r in out], [1, 3])`,
      },
      {
        name: "concrete values still match with equals",
        isHidden: false,
        source: `eng = bug_require("src/sql/sqlengine")
b = bug_require("src/sql/where_builder")
rows = [{"id": 1, "status": "open"}, {"id": 2, "status": "done"}]
out = eng.run(rows, b.build_where("status", "done"))
assert_.equal([r["id"] for r in out], [2])`,
      },
      {
        name: "no rows are null when none are",
        isHidden: true,
        source: `eng = bug_require("src/sql/sqlengine")
b = bug_require("src/sql/where_builder")
rows = [{"id": 1, "x": 5}]
assert_.equal(eng.run(rows, b.build_where("x", None)), [])`,
      },
    ],
    fixedFiles: {
      "src/sql/where_builder.py": `# Builds a WHERE clause for a single field.

def build_where(field, value):
    if value is None:
        return {"clause": field + " IS NULL", "params": []}
    return {"clause": field + " = ?", "params": [value]}
`,
    },
  },

  {
    title: "Read Your Own Writes",
    difficulty: "easy",
    category: "database",
    language: "java",
    tags: ["Replication", "Consistency"],
    description: `Inspired by the "my comment vanished!" bug of every replicated database: a user writes to the primary, the very next read hits a lagging replica, and their data is briefly gone. The classic fix: pin reads to the **primary** for a short window after your own write.

\`ReadRouter.java\` ignores the window.`,
    bugReport: `**BUG-RYW** · Priority: High · Reported by: community team

routeRead(msSinceOwnWrite) with a 500ms pin window:
- writes newer than 500ms (including clock-skew negatives) -> "primary"
- otherwise -> "replica"

Observed: everything goes to replicas; users see their posts flicker out of
existence right after submitting.`,
    logs: `[router] msSinceOwnWrite=40 -> replica (lag 180ms) -> row not found`,
    files: [
      {
        filePath: "ReadRouter.java",
        isEditable: true,
        language: "java",
        content: `class ReadRouter {
    static final long PIN_WINDOW_MS = 500;

    static String routeRead(long msSinceOwnWrite) {
        return "replica";
    }
}`,
      },
    ],
    tests: [
      {
        name: "fresh writers read from the primary",
        isHidden: false,
        source: `                BugAssert.equal(ReadRouter.routeRead(40L), "primary");`,
      },
      {
        name: "old writers read from replicas",
        isHidden: false,
        source: `                BugAssert.equal(ReadRouter.routeRead(2000L), "replica");`,
      },
      {
        name: "boundaries and skew behave",
        isHidden: true,
        source: `                BugAssert.equal(ReadRouter.routeRead(499L), "primary");
                BugAssert.equal(ReadRouter.routeRead(500L), "replica");
                BugAssert.equal(ReadRouter.routeRead(-20L), "primary", "clock skew still pins");`,
      },
    ],
    fixedFiles: {
      "ReadRouter.java": `class ReadRouter {
    static final long PIN_WINDOW_MS = 500;

    static String routeRead(long msSinceOwnWrite) {
        if (msSinceOwnWrite < PIN_WINDOW_MS) {
            return "primary";
        }
        return "replica";
    }
}`,
    },
  },

  {
    title: "The Cache Key With a Twist",
    difficulty: "easy",
    category: "database",
    language: "javascript",
    tags: ["Caching", "Canonicalization"],
    description: `Inspired by every CDN's cache-hit-ratio mystery: \`?a=1&b=2\` and \`?b=2&a=1\` are the same request — but naive key building treats them as two, doubling origin load and halving the hit rate.

\`cacheKey.js\` must canonicalise the params.`,
    bugReport: `**BUG-CDN-KEY** · Reported by: edge performance

cacheKey(path, params):
- identical params in ANY order produce the IDENTICAL key
- different values produce different keys

Observed: hit ratio 46% on an endpoint that should be ~95% — clients send
params in whatever order their serialiser feels like.`,
    logs: `[edge] MISS /api/list?a=1&b=2
[edge] MISS /api/list?b=2&a=1   <- same request!`,
    files: [
      {
        filePath: "src/cdn/cacheKey.js",
        isEditable: true,
        language: "javascript",
        content: `// Builds the cache key for a request.
exports.cacheKey = function (path, params) {
  var parts = [];
  for (var k in params) {
    parts.push(k + "=" + params[k]);
  }
  return path + "?" + parts.join("&");
};
`,
      },
    ],
    tests: [
      {
        name: "param order does not change the key",
        isHidden: false,
        source: `var key = require("src/cdn/cacheKey").cacheKey;
var a = key("/api/list", { a: 1, b: 2 });
var b = key("/api/list", { b: 2, a: 1 });
assert.equal(a, b, "same params, same key");`,
      },
      {
        name: "different values differ",
        isHidden: false,
        source: `var key = require("src/cdn/cacheKey").cacheKey;
assert.ok(key("/x", { a: 1 }) !== key("/x", { a: 2 }));
assert.ok(key("/x", { a: 1 }) !== key("/y", { a: 1 }));`,
      },
      {
        name: "empty params are stable",
        isHidden: true,
        source: `var key = require("src/cdn/cacheKey").cacheKey;
assert.equal(key("/x", {}), key("/x", {}));`,
      },
    ],
    fixedFiles: {
      "src/cdn/cacheKey.js": `// Builds the cache key for a request.
exports.cacheKey = function (path, params) {
  var keys = [];
  for (var k in params) {
    keys.push(k);
  }
  keys.sort();
  var parts = [];
  for (var i = 0; i < keys.length; i++) {
    parts.push(keys[i] + "=" + params[keys[i]]);
  }
  return path + "?" + parts.join("&");
};
`,
    },
  },

  {
    title: "The Runaway Retry",
    difficulty: "easy",
    category: "database",
    language: "python",
    tags: ["Retries", "Backoff"],
    description: `Inspired by the retry storms that finish off every wounded database: a hiccup triggers retries, uncapped exponential delays overflow into instant retries — and the "backoff" becomes a battering ram.

\`backoff.py\`: n retry delays, doubling from 1s, **capped at 60s**.`,
    bugReport: `**BUG-STAMPEDE** · Priority: High · Reported by: SRE

delays(n):
- [1, 2, 4, 8, 16, 32, 60, 60, ...] — doubling, capped at 60, length n

Observed: the list starts at 0 (an INSTANT retry), never caps, and returns
one extra element — retry #31 asks to wait 2^31 seconds.`,
    logs: `[retry] delays(3) -> [0, 1, 2, 4]`,
    files: [
      {
        filePath: "src/db/backoff.py",
        isEditable: true,
        language: "python",
        content: `# Exponential backoff schedule for reconnect attempts.

CAP_SECONDS = 60

def delays(n):
    return [2 ** i // 2 for i in range(n + 1)]
`,
      },
    ],
    tests: [
      {
        name: "the schedule doubles from one second",
        isHidden: false,
        source: `m = bug_require("src/db/backoff")
assert_.equal(m.delays(5), [1, 2, 4, 8, 16])`,
      },
      {
        name: "long schedules cap at sixty",
        isHidden: false,
        source: `m = bug_require("src/db/backoff")
assert_.equal(m.delays(8), [1, 2, 4, 8, 16, 32, 60, 60])`,
      },
      {
        name: "zero retries is an empty schedule",
        isHidden: true,
        source: `m = bug_require("src/db/backoff")
assert_.equal(m.delays(0), [])
assert_.equal(len(m.delays(3)), 3)`,
      },
    ],
    fixedFiles: {
      "src/db/backoff.py": `# Exponential backoff schedule for reconnect attempts.

CAP_SECONDS = 60

def delays(n):
    return [min(2 ** i, CAP_SECONDS) for i in range(n)]
`,
    },
  },

  {
    title: "Escaping the Wildcard",
    difficulty: "medium",
    category: "database",
    language: "java",
    tags: ["SQL", "Escaping"],
    description: `Inspired by the search boxes of the world: a user searches for the literal text \`50%\` and gets every row containing "50", because \`%\` is a LIKE wildcard. Underscores are worse — \`a_c\` matches "abc". User input must be escaped before it goes anywhere near a pattern.

The LIKE matcher (locked) supports \`\\\\\` escapes. \`SearchQuery.java\` doesn't use them.`,
    bugReport: `**BUG-LIKE50** · Priority: Medium (data leak adjacent) · Reported by: search

contains(text, term) — true iff text contains the LITERAL term:
- "%" and "_" in the term must match themselves, not act as wildcards

Observed: searching "50%" returns "50 cents" and "500 units"; searching
"a_c" returns "abc".`,
    logs: `[search] term="50%" matched 4,812 rows (expected 3)`,
    files: [
      {
        filePath: "LikeMatcher.java",
        isEditable: false,
        language: "java",
        content: `// A faithful SQL LIKE evaluator with backslash escapes. DO NOT EDIT.
class LikeMatcher {
    static boolean like(String text, String pattern) {
        return match(text, 0, pattern, 0);
    }

    private static boolean match(String t, int i, String p, int j) {
        if (j == p.length()) return i == t.length();
        char pc = p.charAt(j);
        if (pc == '\\\\' && j + 1 < p.length()) {
            char lit = p.charAt(j + 1);
            return i < t.length() && t.charAt(i) == lit && match(t, i + 1, p, j + 2);
        }
        if (pc == '%') {
            for (int k = i; k <= t.length(); k++) {
                if (match(t, k, p, j + 1)) return true;
            }
            return false;
        }
        if (pc == '_') {
            return i < t.length() && match(t, i + 1, p, j + 1);
        }
        return i < t.length() && t.charAt(i) == pc && match(t, i + 1, p, j + 1);
    }
}`,
      },
      {
        filePath: "SearchQuery.java",
        isEditable: true,
        language: "java",
        content: `class SearchQuery {
    // True iff text contains the literal term.
    static boolean contains(String text, String term) {
        return LikeMatcher.like(text, "%" + term + "%");
    }
}`,
      },
    ],
    tests: [
      {
        name: "a percent sign is literal",
        isHidden: false,
        source: `                BugAssert.ok(SearchQuery.contains("save 50% today", "50%"), "literal match");
                BugAssert.ok(!SearchQuery.contains("50 cents", "50%"), "% must not act as a wildcard");`,
      },
      {
        name: "an underscore is literal",
        isHidden: false,
        source: `                BugAssert.ok(SearchQuery.contains("file a_c.txt", "a_c"));
                BugAssert.ok(!SearchQuery.contains("abc", "a_c"), "_ must not match any char");`,
      },
      {
        name: "plain terms still search normally",
        isHidden: false,
        source: `                BugAssert.ok(SearchQuery.contains("hello world", "lo wo"));
                BugAssert.ok(!SearchQuery.contains("hello", "bye"));`,
      },
      {
        name: "backslashes in the term stay literal",
        isHidden: true,
        source: `                BugAssert.ok(SearchQuery.contains("C:\\\\temp", "C:\\\\temp"));`,
      },
    ],
    fixedFiles: {
      "SearchQuery.java": `class SearchQuery {
    // True iff text contains the literal term.
    static boolean contains(String text, String term) {
        StringBuilder escaped = new StringBuilder();
        for (int i = 0; i < term.length(); i++) {
            char c = term.charAt(i);
            if (c == '%' || c == '_' || c == '\\\\') {
                escaped.append('\\\\');
            }
            escaped.append(c);
        }
        return LikeMatcher.like(text, "%" + escaped + "%");
    }
}`,
    },
  },

  {
    title: "The Half-Applied Batch",
    difficulty: "medium",
    category: "database",
    language: "python",
    tags: ["Transactions", "Atomicity"],
    description: `Inspired by every ledger that ever ended a day unbalanced: a batch of postings hits an invalid entry halfway through, the job aborts — and the first half of the batch **stays applied**. Transactions exist so that either everything happens or nothing does.

\`postings.py\` mutates as it goes.`,
    bugReport: `**BUG-ATOMIC** · Priority: Critical · Reported by: finance close

apply_batch(ledger, ops) — ops are {"acct", "delta"}:
- if ANY op references a missing account, or would take any balance below
  zero, raise ValueError and leave the ledger COMPLETELY unchanged
- otherwise apply all ops

Observed: a failing 3rd op leaves ops 1–2 applied. The books never balance.`,
    logs: `[ledger] batch failed at op 3/5; partial state persisted`,
    files: [
      {
        filePath: "src/ledger/postings.py",
        isEditable: true,
        language: "python",
        content: `# Applies a batch of postings to the ledger (acct -> balance).

def apply_batch(ledger, ops):
    for op in ops:
        acct = op["acct"]
        if acct not in ledger:
            raise ValueError("unknown account: " + acct)
        new_balance = ledger[acct] + op["delta"]
        if new_balance < 0:
            raise ValueError("overdraft on " + acct)
        ledger[acct] = new_balance
    return ledger
`,
      },
    ],
    tests: [
      {
        name: "a valid batch applies fully",
        isHidden: false,
        source: `m = bug_require("src/ledger/postings")
ledger = {"cash": 100, "rev": 0}
m.apply_batch(ledger, [{"acct": "cash", "delta": -40}, {"acct": "rev", "delta": 40}])
assert_.equal(ledger, {"cash": 60, "rev": 40})`,
      },
      {
        name: "a failing batch leaves the ledger untouched",
        isHidden: false,
        source: `m = bug_require("src/ledger/postings")
ledger = {"cash": 100, "rev": 0}
assert_.throws(lambda: m.apply_batch(ledger, [
    {"acct": "cash", "delta": -40},
    {"acct": "rev", "delta": 40},
    {"acct": "cash", "delta": -500},
]))
assert_.equal(ledger, {"cash": 100, "rev": 0}, "atomicity!")`,
      },
      {
        name: "unknown accounts abort cleanly",
        isHidden: true,
        source: `m = bug_require("src/ledger/postings")
ledger = {"cash": 50}
assert_.throws(lambda: m.apply_batch(ledger, [{"acct": "cash", "delta": -10}, {"acct": "ghost", "delta": 10}]))
assert_.equal(ledger, {"cash": 50})`,
      },
    ],
    fixedFiles: {
      "src/ledger/postings.py": `# Applies a batch of postings to the ledger (acct -> balance).

def apply_batch(ledger, ops):
    staged = dict(ledger)
    for op in ops:
        acct = op["acct"]
        if acct not in staged:
            raise ValueError("unknown account: " + acct)
        new_balance = staged[acct] + op["delta"]
        if new_balance < 0:
            raise ValueError("overdraft on " + acct)
        staged[acct] = new_balance
    for acct in staged:
        ledger[acct] = staged[acct]
    return ledger
`,
    },
  },

  {
    title: "The Rotation That Ate the Backups",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Backups", "Retention"],
    description: `Inspired by retention scripts gone wrong the world over (and the reason "test your restores" is a proverb): the nightly rotation is supposed to keep the **newest** N snapshots plus, always, at least one **full** backup. This one keeps the oldest and deletes every full.

\`retention.js\` decides what survives.`,
    bugReport: `**BUG-ROTATE** · Priority: Critical · Reported by: storage

keep(snapshots, keepN):
- keep the keepN NEWEST snapshots (by created, descending in the result)
- if no full backup made the cut, ALSO keep the newest full one
- everything else is deleted

Observed: the script keeps the oldest N, and full backups age out first
because they're the biggest and oldest. Restore drill failed this morning.`,
    logs: `[rotate] kept: [day-001, day-002, day-003] — all incrementals from last year`,
    files: [
      {
        filePath: "src/backup/retention.js",
        isEditable: true,
        language: "javascript",
        content: `// Decides which snapshots survive the nightly rotation.
exports.keep = function (snapshots, keepN) {
  var sorted = snapshots.slice().sort(function (a, b) {
    return a.created - b.created;
  });
  return sorted.slice(0, keepN);
};
`,
      },
    ],
    tests: [
      {
        name: "the newest N survive, newest first",
        isHidden: false,
        source: `var keep = require("src/backup/retention").keep;
var out = keep([
  { id: "a", created: 1, full: false },
  { id: "b", created: 3, full: true },
  { id: "c", created: 2, full: false },
  { id: "d", created: 4, full: false },
], 2);
assert.equal(out.map(function (s) { return s.id; }), ["d", "b"]);`,
      },
      {
        name: "the newest full backup is always retained",
        isHidden: false,
        source: `var keep = require("src/backup/retention").keep;
var out = keep([
  { id: "full-old", created: 1, full: true },
  { id: "inc-1", created: 5, full: false },
  { id: "inc-2", created: 6, full: false },
], 2);
assert.equal(out.map(function (s) { return s.id; }), ["inc-2", "inc-1", "full-old"]);`,
      },
      {
        name: "small sets keep everything",
        isHidden: true,
        source: `var keep = require("src/backup/retention").keep;
var out = keep([{ id: "x", created: 9, full: true }], 5);
assert.equal(out.map(function (s) { return s.id; }), ["x"]);`,
      },
    ],
    fixedFiles: {
      "src/backup/retention.js": `// Decides which snapshots survive the nightly rotation.
exports.keep = function (snapshots, keepN) {
  var sorted = snapshots.slice().sort(function (a, b) {
    return b.created - a.created;
  });
  var kept = sorted.slice(0, keepN);
  var hasFull = kept.some(function (s) { return s.full; });
  if (!hasFull) {
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].full) {
        kept.push(sorted[i]);
        break;
      }
    }
  }
  return kept;
};
`,
    },
  },

  {
    title: "The Upsert That Forgot to Add",
    difficulty: "easy",
    category: "database",
    language: "java",
    tags: ["Upserts", "Counters"],
    description: `Inspired by analytics counters everywhere: the "ON CONFLICT ADD" upsert that actually does "ON CONFLICT REPLACE". Every flush OVERWRITES the day's count with the latest batch, and the dashboards saw only the last five minutes of every day.

\`CounterUpdater.java\` merges a delta into the store. The store (locked) is a plain map.`,
    bugReport: `**BUG-UPSERT** · Priority: High · Reported by: analytics

applyDelta(store, key, delta):
- existing key -> ADD delta to the stored value
- new key -> initialise with delta

Observed: page_views was 40,000 at 23:55 and 312 at midnight — each batch
replaced the total.`,
    logs: `[flush] page_views <- 312 (was 40188)`,
    files: [
      {
        filePath: "CounterStore.java",
        isEditable: false,
        language: "java",
        content: `import java.util.*;

// Plain key-value store. DO NOT EDIT.
class CounterStore {
    private final Map<String, Long> map = new HashMap<>();

    Long get(String key) { return map.get(key); }
    void put(String key, long value) { map.put(key, value); }
}`,
      },
      {
        filePath: "CounterUpdater.java",
        isEditable: true,
        language: "java",
        content: `class CounterUpdater {
    static void applyDelta(CounterStore store, String key, long delta) {
        store.put(key, delta);
    }
}`,
      },
    ],
    tests: [
      {
        name: "deltas accumulate on existing keys",
        isHidden: false,
        source: `                CounterStore store = new CounterStore();
                CounterUpdater.applyDelta(store, "page_views", 40000L);
                CounterUpdater.applyDelta(store, "page_views", 312L);
                BugAssert.equal(store.get("page_views"), 40312L, "add, not replace");`,
      },
      {
        name: "new keys initialise with the delta",
        isHidden: false,
        source: `                CounterStore store = new CounterStore();
                CounterUpdater.applyDelta(store, "signups", 7L);
                BugAssert.equal(store.get("signups"), 7L);`,
      },
      {
        name: "many batches sum exactly",
        isHidden: true,
        source: `                CounterStore store = new CounterStore();
                for (int i = 1; i <= 5; i++) {
                    CounterUpdater.applyDelta(store, "k", (long) i);
                }
                BugAssert.equal(store.get("k"), 15L);`,
      },
    ],
    fixedFiles: {
      "CounterUpdater.java": `class CounterUpdater {
    static void applyDelta(CounterStore store, String key, long delta) {
        Long existing = store.get(key);
        long base = existing == null ? 0L : existing;
        store.put(key, base + delta);
    }
}`,
    },
  },

];
