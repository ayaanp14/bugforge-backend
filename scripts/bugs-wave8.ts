/** Wave 8 — state, iteration and coercion bugs inspired by real incidents. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE8: BugSpec[] = [

  {
    title: "The Gene Named September 2nd",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Coercion", "Data Import"],
    description: `Inspired by the genomics community literally **renaming 27 human genes** (SEPT2 → SEPTIN2, MARCH1 → MARCHF1…) because Excel kept auto-converting them to dates, and scientific-notation lookalikes like "1E5" to numbers. Roughly a fifth of published gene lists carried the corruption.

\`cells.py\` imports spreadssheet cells. Convert only what is *unambiguously* a number.`,
    bugReport: `**BUG-SEPT2** · Priority: High (data integrity) · Reported by: research tools

parse_cell(value) rules:
- pure integers ("42", "-7") -> int … EXCEPT leading zeros ("007" is an ID!)
- pure decimals ("3.14") -> float
- EVERYTHING else stays a string: "SEPT2", "1E5", "007", "3/4"

Observed: "1E5" imports as 100000.0 and "007" as 7 — identifiers destroyed.`,
    logs: `[import] "1E5" -> 100000.0
[import] "007" -> 7`,
    files: [
      {
        filePath: "src/import/cells.py",
        isEditable: true,
        language: "python",
        content: `# Parses a raw spreadsheet cell into int / float / str.

def parse_cell(value):
    try:
        number = float(value)
        if number == int(number):
            return int(number)
        return number
    except ValueError:
        return value
`,
      },
    ],
    tests: [
      {
        name: "plain integers convert",
        isHidden: false,
        source: `m = bug_require("src/import/cells")
assert_.equal(m.parse_cell("42"), 42)
assert_.equal(m.parse_cell("-7"), -7)`,
      },
      {
        name: "scientific-notation lookalikes stay strings",
        isHidden: false,
        source: `m = bug_require("src/import/cells")
assert_.equal(m.parse_cell("1E5"), "1E5")
assert_.equal(m.parse_cell("SEPT2"), "SEPT2")`,
      },
      {
        name: "leading zeros mean identifier",
        isHidden: false,
        source: `m = bug_require("src/import/cells")
assert_.equal(m.parse_cell("007"), "007")`,
      },
      {
        name: "decimals convert, oddballs survive",
        isHidden: true,
        source: `m = bug_require("src/import/cells")
assert_.equal(m.parse_cell("3.14"), 3.14)
assert_.equal(m.parse_cell("3/4"), "3/4")
assert_.equal(m.parse_cell("0"), 0)`,
      },
    ],
    fixedFiles: {
      "src/import/cells.py": `import re

# Parses a raw spreadsheet cell into int / float / str.

def parse_cell(value):
    if re.fullmatch(r"-?\\d+", value):
        digits = value[1:] if value.startswith("-") else value
        if len(digits) > 1 and digits.startswith("0"):
            return value
        return int(value)
    if re.fullmatch(r"-?\\d+\\.\\d+", value):
        return float(value)
    return value
`,
    },
  },

  {
    title: "Stuck on Mute",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["State", "Stale Closures"],
    description: `Inspired by the most 2020 bug imaginable: you unmute, the app says you're unmuted, everyone still hears silence. Under the hood, rapid toggles were computed against a **stale snapshot** of the state instead of the latest value.

\`muteState.js\` folds mic events. Each toggle must flip the *current* state.`,
    bugReport: `**BUG-UNMUTE** · Priority: Critical (all-hands demo) · Reported by: everyone

processEvents(initialMuted, events):
- {type:"toggle"} flips the CURRENT state
- {type:"set", muted} assigns directly
- returns the final state

Observed: two quick toggles from unmuted leave you MUTED — both toggles
computed against the initial value.`,
    logs: `[mic] start=false toggle toggle -> true (expected false)`,
    files: [
      {
        filePath: "src/av/muteState.js",
        isEditable: true,
        language: "javascript",
        content: `// Folds microphone events into the final mute state.
exports.processEvents = function (initialMuted, events) {
  var muted = initialMuted;
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e.type === "toggle") {
      muted = !initialMuted;
    } else if (e.type === "set") {
      muted = e.muted;
    }
  }
  return muted;
};
`,
      },
    ],
    tests: [
      {
        name: "a double toggle returns to the start",
        isHidden: false,
        source: `var p = require("src/av/muteState").processEvents;
assert.equal(p(false, [{ type: "toggle" }, { type: "toggle" }]), false);`,
      },
      {
        name: "a single toggle flips",
        isHidden: false,
        source: `var p = require("src/av/muteState").processEvents;
assert.equal(p(false, [{ type: "toggle" }]), true);
assert.equal(p(true, [{ type: "toggle" }]), false);`,
      },
      {
        name: "set overrides, toggles continue from there",
        isHidden: false,
        source: `var p = require("src/av/muteState").processEvents;
assert.equal(p(false, [{ type: "set", muted: true }, { type: "toggle" }]), false);`,
      },
      {
        name: "long sequences resolve correctly",
        isHidden: true,
        source: `var p = require("src/av/muteState").processEvents;
assert.equal(p(true, [
  { type: "toggle" }, { type: "toggle" }, { type: "toggle" },
  { type: "set", muted: false }, { type: "toggle" },
]), true);`,
      },
    ],
    fixedFiles: {
      "src/av/muteState.js": `// Folds microphone events into the final mute state.
exports.processEvents = function (initialMuted, events) {
  var muted = initialMuted;
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e.type === "toggle") {
      muted = !muted;
    } else if (e.type === "set") {
      muted = e.muted;
    }
  }
  return muted;
};
`,
    },
  },

  {
    title: "Six Degrees, Give or Take",
    difficulty: "hard",
    category: "frontend",
    language: "javascript",
    tags: ["Graphs", "BFS"],
    description: `Inspired by the "2nd-degree connection" labels of professional networks — which must be the **shortest** path between two people. Depth-first exploration returns the first path it stumbles into, and profiles show "3rd" for direct connections.

\`degrees.js\` computes connection degree. It needs breadth-first, not depth-first.`,
    bugReport: `**BUG-DEGREES** · Priority: High · Reported by: profile team

degree(network, from, to):
- the SHORTEST connection distance (1 = direct)
- unreachable -> -1, self -> 0

Observed: alice and dave are directly connected, but because the traversal
dives down alice → bob → carol → dave first, the label says 3rd.`,
    logs: `[profile] degree(alice, dave) = 3 (they are 1st-degree!)`,
    files: [
      {
        filePath: "src/graph/degrees.js",
        isEditable: true,
        language: "javascript",
        content: `// Connection degree between two members.
exports.degree = function (network, from, to) {
  var visited = {};

  function dfs(node, depth) {
    if (node === to) return depth;
    visited[node] = true;
    var neighbors = network[node] || [];
    for (var i = 0; i < neighbors.length; i++) {
      if (!visited[neighbors[i]]) {
        var found = dfs(neighbors[i], depth + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  }

  return dfs(from, 0);
};
`,
      },
    ],
    tests: [
      {
        name: "direct connections are first degree",
        isHidden: false,
        source: `var degree = require("src/graph/degrees").degree;
var network = {
  alice: ["bob", "dave"],
  bob: ["alice", "carol"],
  carol: ["bob", "dave"],
  dave: ["alice", "carol"],
};
assert.equal(degree(network, "alice", "dave"), 1, "shortest path, not first found");`,
      },
      {
        name: "second degree via a mutual",
        isHidden: false,
        source: `var degree = require("src/graph/degrees").degree;
var network = {
  alice: ["bob", "dave"],
  bob: ["alice", "carol"],
  carol: ["bob", "dave"],
  dave: ["alice", "carol"],
};
assert.equal(degree(network, "bob", "dave"), 2);`,
      },
      {
        name: "unreachable members are -1, self is 0",
        isHidden: false,
        source: `var degree = require("src/graph/degrees").degree;
var network = { a: ["b"], b: ["a"], z: [] };
assert.equal(degree(network, "a", "z"), -1);
assert.equal(degree(network, "a", "a"), 0);`,
      },
      {
        name: "a longer chain measures exactly",
        isHidden: true,
        source: `var degree = require("src/graph/degrees").degree;
var network = { a: ["b"], b: ["a", "c"], c: ["b", "d"], d: ["c"] };
assert.equal(degree(network, "a", "d"), 3);`,
      },
    ],
    fixedFiles: {
      "src/graph/degrees.js": `// Connection degree between two members.
exports.degree = function (network, from, to) {
  if (from === to) return 0;
  var visited = {};
  visited[from] = true;
  var queue = [{ node: from, depth: 0 }];
  var head = 0;
  while (head < queue.length) {
    var current = queue[head++];
    var neighbors = network[current.node] || [];
    for (var i = 0; i < neighbors.length; i++) {
      var n = neighbors[i];
      if (n === to) return current.depth + 1;
      if (!visited[n]) {
        visited[n] = true;
        queue.push({ node: n, depth: current.depth + 1 });
      }
    }
  }
  return -1;
};
`,
    },
  },

  {
    title: "The Leaning Tower of Pins",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Layout", "Algorithms"],
    description: `Inspired by every masonry grid that grew one giraffe column: round-robin placement ignores item heights, so a run of tall cards stacks into the same column and the layout tips over.

\`masonry.js\` must always drop the next item into the **currently shortest** column (ties → lowest index).`,
    bugReport: `**BUG-MASONRY** · Reported by: web platform

layout(heights, columns) -> { assignment, columnHeights }:
- each item goes to the column with the smallest current height
- ties break toward the lower column index

Observed: round-robin puts item 3 in column 0 even though column 1 is
5 units shorter — after a hundred pins the page is a staircase.`,
    logs: `[grid] column heights after 40 pins: [3120, 1180]`,
    files: [
      {
        filePath: "src/grid/masonry.js",
        isEditable: true,
        language: "javascript",
        content: `// Assigns items (by height) to masonry columns.
exports.layout = function (heights, columns) {
  var columnHeights = [];
  for (var c = 0; c < columns; c++) columnHeights.push(0);
  var assignment = [];
  for (var i = 0; i < heights.length; i++) {
    var col = i % columns;
    assignment.push(col);
    columnHeights[col] += heights[i];
  }
  return { assignment: assignment, columnHeights: columnHeights };
};
`,
      },
    ],
    tests: [
      {
        name: "items chase the shortest column",
        isHidden: false,
        source: `var layout = require("src/grid/masonry").layout;
var out = layout([10, 5, 5, 4], 2);
assert.equal(out.assignment, [0, 1, 1, 0]);
assert.equal(out.columnHeights, [14, 10]);`,
      },
      {
        name: "ties break to the lower index",
        isHidden: false,
        source: `var layout = require("src/grid/masonry").layout;
var out = layout([3, 3, 3], 3);
assert.equal(out.assignment, [0, 1, 2]);`,
      },
      {
        name: "a tall first item does not hog its column",
        isHidden: true,
        source: `var layout = require("src/grid/masonry").layout;
var out = layout([20, 2, 2, 2], 2);
assert.equal(out.assignment, [0, 1, 1, 1]);
assert.equal(out.columnHeights, [20, 6]);`,
      },
    ],
    fixedFiles: {
      "src/grid/masonry.js": `// Assigns items (by height) to masonry columns.
exports.layout = function (heights, columns) {
  var columnHeights = [];
  for (var c = 0; c < columns; c++) columnHeights.push(0);
  var assignment = [];
  for (var i = 0; i < heights.length; i++) {
    var col = 0;
    for (var j = 1; j < columns; j++) {
      if (columnHeights[j] < columnHeights[col]) col = j;
    }
    assignment.push(col);
    columnHeights[col] += heights[i];
  }
  return { assignment: assignment, columnHeights: columnHeights };
};
`,
    },
  },

  {
    title: "The 130% Progress Bar",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Math", "Clamping"],
    description: `Inspired by every upload dialog that has proudly announced "130%" or "NaN%". Retried chunks push the done-count past the total, and empty uploads divide by zero.

\`progress.js\` renders the percentage. Clamp it into reality.`,
    bugReport: `**BUG-130PCT** · Reported by: design QA

percent(done, total):
- an integer 0..100 (floor)
- total 0 -> 0, never NaN
- done beyond total -> 100, negatives -> 0

Observed: retries show 130%, empty folders show NaN%.`,
    logs: `[upload] 13/10 chunks -> "130%"
[upload] 0/0 chunks -> "NaN%"`,
    files: [
      {
        filePath: "src/ui/progress.js",
        isEditable: true,
        language: "javascript",
        content: `// Renders upload progress as a whole percentage.
exports.percent = function (done, total) {
  return Math.floor((done / total) * 100);
};
`,
      },
    ],
    tests: [
      {
        name: "normal progress computes",
        isHidden: false,
        source: `var pct = require("src/ui/progress").percent;
assert.equal(pct(5, 10), 50);
assert.equal(pct(1, 3), 33);`,
      },
      {
        name: "over-completion clamps to 100",
        isHidden: false,
        source: `var pct = require("src/ui/progress").percent;
assert.equal(pct(13, 10), 100);`,
      },
      {
        name: "zero totals never NaN",
        isHidden: false,
        source: `var pct = require("src/ui/progress").percent;
assert.equal(pct(0, 0), 0);`,
      },
      {
        name: "negatives clamp to zero",
        isHidden: true,
        source: `var pct = require("src/ui/progress").percent;
assert.equal(pct(-2, 10), 0);
assert.equal(pct(10, 10), 100);`,
      },
    ],
    fixedFiles: {
      "src/ui/progress.js": `// Renders upload progress as a whole percentage.
exports.percent = function (done, total) {
  if (total <= 0) return 0;
  var value = Math.floor((done / total) * 100);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};
`,
    },
  },

  {
    title: "The Toast That Never Left",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Arrays", "Mutation"],
    description: `Inspired by notification trays everywhere: expired toasts that linger forever. Two bugs conspire — the classic **splice-while-iterating** skip (removing index i shifts the next element into i, then i++ jumps over it), and an exclusive comparison that spares anything expiring exactly now.

\`toasts.js\` sweeps the tray.`,
    bugReport: `**BUG-TOAST** · Reported by: design systems

sweep(toasts, now):
- remove every toast with expiresAt <= now
- keep the survivors in order

Observed: when two expired toasts sit side by side, only the first is
removed; and a toast expiring exactly at the sweep tick survives forever.`,
    logs: `[tray] sweep(now=6): removed 1 of 2 expired`,
    files: [
      {
        filePath: "src/ui/toasts.js",
        isEditable: true,
        language: "javascript",
        content: `// Removes expired toasts (mutates and returns the array).
exports.sweep = function (toasts, now) {
  for (var i = 0; i < toasts.length; i++) {
    if (toasts[i].expiresAt < now) {
      toasts.splice(i, 1);
    }
  }
  return toasts;
};
`,
      },
    ],
    tests: [
      {
        name: "adjacent expired toasts are both removed",
        isHidden: false,
        source: `var sweep = require("src/ui/toasts").sweep;
var out = sweep([
  { id: "x", expiresAt: 4 },
  { id: "y", expiresAt: 4 },
  { id: "z", expiresAt: 9 },
], 6);
assert.equal(out.map(function (t) { return t.id; }), ["z"]);`,
      },
      {
        name: "expiring exactly now counts as expired",
        isHidden: false,
        source: `var sweep = require("src/ui/toasts").sweep;
var out = sweep([{ id: "a", expiresAt: 5 }, { id: "b", expiresAt: 7 }], 5);
assert.equal(out.map(function (t) { return t.id; }), ["b"]);`,
      },
      {
        name: "fresh toasts are untouched and ordered",
        isHidden: true,
        source: `var sweep = require("src/ui/toasts").sweep;
var out = sweep([
  { id: "1", expiresAt: 10 },
  { id: "2", expiresAt: 2 },
  { id: "3", expiresAt: 11 },
  { id: "4", expiresAt: 1 },
], 5);
assert.equal(out.map(function (t) { return t.id; }), ["1", "3"]);`,
      },
    ],
    fixedFiles: {
      "src/ui/toasts.js": `// Removes expired toasts (mutates and returns the array).
exports.sweep = function (toasts, now) {
  for (var i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].expiresAt <= now) {
      toasts.splice(i, 1);
    }
  }
  return toasts;
};
`,
    },
  },

  {
    title: "The Infinite Spinner",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["State", "Error Handling"],
    description: `Inspired by the most-screenshotted bug in any app: the spinner that never stops. The loading flag is cleared on success — and **only** on success. One failed request and the UI spins until a refresh.

\`loading.js\` folds request lifecycle events.`,
    bugReport: `**BUG-SPINNER** · Reported by: support (screenshot supply is infinite)

reduce(state, event) — events: start / success / error:
- start   -> loading true, error null
- success -> loading false, data set
- error   -> loading FALSE, error message set

Observed: the error branch forgets the flag; failed dashboards spin forever.`,
    logs: `[ui] request failed; isLoading still true 45 minutes later`,
    files: [
      {
        filePath: "src/ui/loading.js",
        isEditable: true,
        language: "javascript",
        content: `// Request lifecycle reducer.
exports.reduce = function (state, event) {
  if (event.type === "start") {
    return { loading: true, data: state.data, error: null };
  }
  if (event.type === "success") {
    return { loading: false, data: event.data, error: null };
  }
  if (event.type === "error") {
    return { loading: state.loading, data: state.data, error: event.message };
  }
  return state;
};
`,
      },
    ],
    tests: [
      {
        name: "errors stop the spinner",
        isHidden: false,
        source: `var reduce = require("src/ui/loading").reduce;
var s = reduce({ loading: false, data: null, error: null }, { type: "start" });
s = reduce(s, { type: "error", message: "500" });
assert.equal(s.loading, false, "spinner must stop on failure");
assert.equal(s.error, "500");`,
      },
      {
        name: "success stores the data",
        isHidden: false,
        source: `var reduce = require("src/ui/loading").reduce;
var s = reduce({ loading: true, data: null, error: null }, { type: "success", data: [1, 2] });
assert.equal(s.loading, false);
assert.equal(s.data, [1, 2]);`,
      },
      {
        name: "a retry after failure clears the error",
        isHidden: true,
        source: `var reduce = require("src/ui/loading").reduce;
var s = { loading: false, data: null, error: "old" };
s = reduce(s, { type: "start" });
assert.equal(s.loading, true);
assert.equal(s.error, null);`,
      },
    ],
    fixedFiles: {
      "src/ui/loading.js": `// Request lifecycle reducer.
exports.reduce = function (state, event) {
  if (event.type === "start") {
    return { loading: true, data: state.data, error: null };
  }
  if (event.type === "success") {
    return { loading: false, data: event.data, error: null };
  }
  if (event.type === "error") {
    return { loading: false, data: state.data, error: event.message };
  }
  return state;
};
`,
    },
  },

  {
    title: "The Leaderboard Shuffle",
    difficulty: "medium",
    category: "frontend",
    language: "java",
    tags: ["Sorting", "Stability"],
    description: `Inspired by the leaderboard-flicker tickets every game studio collects: players with **equal scores** swap places on every refresh. Ties must preserve the order they arrived in (stable sort) — but someone "helpfully" added an alphabetical tiebreak.

\`Leaderboard.java\` sorts by score, descending, stable.`,
    bugReport: `**BUG-FLICKER** · Reported by: live-ops

sortByScore(names, scores) -> names sorted by score DESC:
- equal scores keep their ORIGINAL relative order (arrival order)
- no other tiebreak, alphabetical or otherwise

Observed: "zoe" reached 50 points before "amy", but every refresh shows amy
above zoe — the tiebreak reorders them.`,
    logs: `[board] tie at 50: zoe (first) rendered below amy`,
    files: [
      {
        filePath: "Leaderboard.java",
        isEditable: true,
        language: "java",
        content: `import java.util.*;

class Leaderboard {
    static String[] sortByScore(String[] names, int[] scores) {
        Integer[] idx = new Integer[names.length];
        for (int i = 0; i < idx.length; i++) idx[i] = i;
        Arrays.sort(idx, new Comparator<Integer>() {
            public int compare(Integer a, Integer b) {
                if (scores[b] != scores[a]) return scores[b] - scores[a];
                return names[a].compareTo(names[b]);
            }
        });
        String[] out = new String[names.length];
        for (int i = 0; i < out.length; i++) out[i] = names[idx[i]];
        return out;
    }
}`,
      },
    ],
    tests: [
      {
        name: "ties keep arrival order",
        isHidden: false,
        source: `                String[] out = Leaderboard.sortByScore(
                    new String[] { "zoe", "amy", "bob" },
                    new int[] { 50, 50, 70 });
                BugAssert.equal(out, new String[] { "bob", "zoe", "amy" }, "zoe scored first");`,
      },
      {
        name: "scores still dominate",
        isHidden: false,
        source: `                String[] out = Leaderboard.sortByScore(
                    new String[] { "a", "b", "c" },
                    new int[] { 10, 30, 20 });
                BugAssert.equal(out, new String[] { "b", "c", "a" });`,
      },
      {
        name: "an all-tied board is untouched",
        isHidden: true,
        source: `                String[] out = Leaderboard.sortByScore(
                    new String[] { "delta", "charlie", "bravo" },
                    new int[] { 5, 5, 5 });
                BugAssert.equal(out, new String[] { "delta", "charlie", "bravo" });`,
      },
    ],
    fixedFiles: {
      "Leaderboard.java": `import java.util.*;

class Leaderboard {
    static String[] sortByScore(String[] names, int[] scores) {
        Integer[] idx = new Integer[names.length];
        for (int i = 0; i < idx.length; i++) idx[i] = i;
        Arrays.sort(idx, new Comparator<Integer>() {
            public int compare(Integer a, Integer b) {
                return scores[b] - scores[a];
            }
        });
        String[] out = new String[names.length];
        for (int i = 0; i < out.length; i++) out[i] = names[idx[i]];
        return out;
    }
}`,
    },
  },

  {
    title: "The Coupon That Stacked Itself",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Idempotency", "Pricing"],
    description: `Inspired by the promo-code exploits that make it to Twitter every Black Friday: enter \`SAVE10\`, then \`save10\`, then \`Save10\` — and watch the discounts stack. Codes must apply **once**, case-insensitively.

\`Promotions.java\` applies a list of entered codes to a total.`,
    bugReport: `**BUG-STACK10** · Priority: High (margin) · Reported by: e-commerce

applyCodes(totalCents, codes):
- each KNOWN code applies its percentage once, case-insensitive dedupe
- unknown codes are ignored
- discounts compound multiplicatively, integer cents floor at each step

Observed: "SAVE10" + "save10" gives 19%; script kiddies found it in hours.`,
    logs: `[cart] codes=[SAVE10, save10, SAVE10] total 10000 -> 7290`,
    files: [
      {
        filePath: "PromoTable.java",
        isEditable: false,
        language: "java",
        content: `import java.util.*;

// Known promotions (percent off). DO NOT EDIT.
class PromoTable {
    static final Map<String, Integer> PERCENT = new HashMap<>();
    static {
        PERCENT.put("save10", 10);
        PERCENT.put("spring5", 5);
    }
}`,
      },
      {
        filePath: "Promotions.java",
        isEditable: true,
        language: "java",
        content: `import java.util.*;

class Promotions {
    static long applyCodes(long totalCents, String[] codes) {
        long total = totalCents;
        for (String code : codes) {
            Integer pct = PromoTable.PERCENT.get(code.toLowerCase());
            if (pct != null) {
                total = total * (100 - pct) / 100;
            }
        }
        return total;
    }
}`,
      },
    ],
    tests: [
      {
        name: "case variants of one code apply once",
        isHidden: false,
        source: `                BugAssert.equal(Promotions.applyCodes(10000L, new String[] { "SAVE10", "save10", "Save10" }), 9000L);`,
      },
      {
        name: "distinct codes compound",
        isHidden: false,
        source: `                BugAssert.equal(Promotions.applyCodes(10000L, new String[] { "SAVE10", "SPRING5" }), 8550L);`,
      },
      {
        name: "unknown codes change nothing",
        isHidden: true,
        source: `                BugAssert.equal(Promotions.applyCodes(4999L, new String[] { "HACKTHEPLANET" }), 4999L);
                BugAssert.equal(Promotions.applyCodes(10000L, new String[] {}), 10000L);`,
      },
    ],
    fixedFiles: {
      "Promotions.java": `import java.util.*;

class Promotions {
    static long applyCodes(long totalCents, String[] codes) {
        long total = totalCents;
        Set<String> used = new HashSet<>();
        for (String code : codes) {
            String key = code.toLowerCase();
            Integer pct = PromoTable.PERCENT.get(key);
            if (pct != null && !used.contains(key)) {
                used.add(key);
                total = total * (100 - pct) / 100;
            }
        }
        return total;
    }
}`,
    },
  },

  {
    title: "The Generator That Vanished",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Iterators", "Python Gotchas"],
    description: `Inspired by a bug class unique to Python that has shipped wrong reports at real companies: a **generator** can be consumed exactly once. Count its rows, then sum them — and the sum sees an empty sequence. Totals: zero. Nobody notices until finance does.

The row source (locked) returns a generator. \`report.py\` iterates it twice.`,
    bugReport: `**BUG-GENEXH** · Priority: High · Reported by: analytics QA

summarize(rows) -> {"count": n, "total": sum of amt}:
- rows may be ANY iterable, including a one-shot generator
- both numbers must reflect the same data

Observed: count is right, total is 0 — the second pass over the generator
finds it already exhausted.`,
    logs: `[report] rows=3 revenue_total=0`,
    files: [
      {
        filePath: "src/data/source.py",
        isEditable: false,
        language: "python",
        content: `# Streams rows from storage. Returns a GENERATOR. DO NOT EDIT.

def fetch_rows():
    yield {"id": 1, "amt": 10}
    yield {"id": 2, "amt": 20}
    yield {"id": 3, "amt": 30}
`,
      },
      {
        filePath: "src/data/report.py",
        isEditable: true,
        language: "python",
        content: `# Summarises a row stream.

def summarize(rows):
    count = sum(1 for _ in rows)
    total = sum(r["amt"] for r in rows)
    return {"count": count, "total": total}
`,
      },
    ],
    tests: [
      {
        name: "a generator is summarised correctly",
        isHidden: false,
        source: `src = bug_require("src/data/source")
rep = bug_require("src/data/report")
out = rep.summarize(src.fetch_rows())
assert_.equal(out["count"], 3)
assert_.equal(out["total"], 60, "the second pass must see the data too")`,
      },
      {
        name: "plain lists still work",
        isHidden: false,
        source: `rep = bug_require("src/data/report")
out = rep.summarize([{"amt": 5}, {"amt": 7}])
assert_.equal(out, {"count": 2, "total": 12})`,
      },
      {
        name: "empty streams are zeros",
        isHidden: true,
        source: `rep = bug_require("src/data/report")
out = rep.summarize(iter([]))
assert_.equal(out, {"count": 0, "total": 0})`,
      },
    ],
    fixedFiles: {
      "src/data/report.py": `# Summarises a row stream.

def summarize(rows):
    materialized = list(rows)
    count = len(materialized)
    total = sum(r["amt"] for r in materialized)
    return {"count": count, "total": total}
`,
    },
  },

  {
    title: "The Mutable Default Trap",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Python Gotchas", "State"],
    description: `Inspired by Python's most famous footgun — the one in every interview and, somehow, still in every codebase: a **mutable default argument** is created once and shared across every call. Two users' shopping carts become one.

\`carts.py\`: \`def add_item(item, cart=[])\`. You already know.`,
    bugReport: `**BUG-DEF-ARG** · Priority: High (data bleed!) · Reported by: checkout

add_item(item, cart=None) -> the cart with the item appended:
- calls WITHOUT a cart get a FRESH empty cart every time
- calls with an explicit cart append to that cart

Observed: customer B's brand-new cart already contains customer A's items.`,
    logs: `[cart] new session cart contents: ["A's headphones"] (?!)`,
    files: [
      {
        filePath: "src/shop/carts.py",
        isEditable: true,
        language: "python",
        content: `# Cart operations.

def add_item(item, cart=[]):
    cart.append(item)
    return cart
`,
      },
    ],
    tests: [
      {
        name: "fresh calls get fresh carts",
        isHidden: false,
        source: `m = bug_require("src/shop/carts")
a = m.add_item("headphones")
b = m.add_item("keyboard")
assert_.equal(a, ["headphones"], "customer A's cart")
assert_.equal(b, ["keyboard"], "customer B must start empty")`,
      },
      {
        name: "explicit carts still accumulate",
        isHidden: false,
        source: `m = bug_require("src/shop/carts")
cart = []
m.add_item("x", cart)
m.add_item("y", cart)
assert_.equal(cart, ["x", "y"])`,
      },
      {
        name: "three fresh sessions stay isolated",
        isHidden: true,
        source: `m = bug_require("src/shop/carts")
m.add_item("1")
m.add_item("2")
c = m.add_item("3")
assert_.equal(c, ["3"])`,
      },
    ],
    fixedFiles: {
      "src/shop/carts.py": `# Cart operations.

def add_item(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart
`,
    },
  },

  {
    title: "The Reducer That Bit the Hand",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Immutability", "State"],
    description: `Inspired by the debugging sessions behind every "my component won't re-render" question: the reducer **mutates** the existing state and returns the same object. Reference equality says nothing changed; memoised components agree; the UI freezes in time.

\`todosReducer.js\` must return new objects, never touch the old ones.`,
    bugReport: `**BUG-MUTATE** · Reported by: web platform

reduce(state, action) for ADD_TODO:
- returns a NEW state object with a NEW items array
- the previous state object must remain EXACTLY as it was

Observed: state is mutated in place and returned as-is — memo checks see the
same reference and skip the re-render.`,
    logs: `[devtools] prevState === nextState -> render skipped (items differ!)`,
    files: [
      {
        filePath: "src/store/todosReducer.js",
        isEditable: true,
        language: "javascript",
        content: `// Todos reducer.
exports.reduce = function (state, action) {
  if (action.type === "ADD_TODO") {
    state.items.push(action.text);
    return state;
  }
  return state;
};
`,
      },
    ],
    tests: [
      {
        name: "adding returns a new state reference",
        isHidden: false,
        source: `var reduce = require("src/store/todosReducer").reduce;
var prev = { items: ["a"] };
var next = reduce(prev, { type: "ADD_TODO", text: "b" });
assert.ok(next !== prev, "a new object must come back");
assert.ok(next.items !== prev.items, "a new array too");
assert.equal(next.items, ["a", "b"]);`,
      },
      {
        name: "the previous state is untouched",
        isHidden: false,
        source: `var reduce = require("src/store/todosReducer").reduce;
var prev = { items: ["a"] };
reduce(prev, { type: "ADD_TODO", text: "b" });
assert.equal(prev.items, ["a"], "time-travel debugging depends on this");`,
      },
      {
        name: "unknown actions return the same state",
        isHidden: true,
        source: `var reduce = require("src/store/todosReducer").reduce;
var prev = { items: [] };
assert.ok(reduce(prev, { type: "NOPE" }) === prev);`,
      },
    ],
    fixedFiles: {
      "src/store/todosReducer.js": `// Todos reducer.
exports.reduce = function (state, action) {
  if (action.type === "ADD_TODO") {
    return { items: state.items.concat([action.text]) };
  }
  return state;
};
`,
    },
  },

  {
    title: "A Century of Missing Interest",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Integer Division", "Finance"],
    description: `Inspired by the interest-calculation bugs that have triggered real banking remediations: integer division runs before multiplication, \`rate / 100\` becomes **zero**, and a decade of compounding earns exactly nothing.

\`Interest.java\` compounds yearly, in integer cents.`,
    bugReport: `**BUG-DIV0INT** · Priority: Critical (regulatory) · Reported by: core banking

compound(principalCents, ratePercent, years):
- one compounding per year: value = value * (100 + rate) / 100 (floor)
- 10000 cents at 5% for 1 year -> 10500; 2 years -> 11025

Observed: every account earned 0 interest — 5 / 100 is 0 in integer math.`,
    logs: `[interest] 10000 @ 5% x 10y -> 10000`,
    files: [
      {
        filePath: "Interest.java",
        isEditable: true,
        language: "java",
        content: `class Interest {
    static long compound(long principalCents, int ratePercent, int years) {
        long value = principalCents;
        for (int i = 0; i < years; i++) {
            value = value + value * (ratePercent / 100);
        }
        return value;
    }
}`,
      },
    ],
    tests: [
      {
        name: "one year of five percent",
        isHidden: false,
        source: `                BugAssert.equal(Interest.compound(10000L, 5, 1), 10500L);`,
      },
      {
        name: "two years compound",
        isHidden: false,
        source: `                BugAssert.equal(Interest.compound(10000L, 5, 2), 11025L);`,
      },
      {
        name: "zero years returns the principal",
        isHidden: false,
        source: `                BugAssert.equal(Interest.compound(12345L, 7, 0), 12345L);`,
      },
      {
        name: "long horizons floor at each step",
        isHidden: true,
        source: `                BugAssert.equal(Interest.compound(100L, 3, 3), 109L, "103 -> 106 -> 109 with flooring");`,
      },
    ],
    fixedFiles: {
      "Interest.java": `class Interest {
    static long compound(long principalCents, int ratePercent, int years) {
        long value = principalCents;
        for (int i = 0; i < years; i++) {
            value = value * (100 + ratePercent) / 100;
        }
        return value;
    }
}`,
    },
  },

];
