/** Wave 2 — frontend JavaScript bugs inspired by famous real-world incidents. */
import type { BugSpec } from "./bugs-data.js";

export const WAVE2: BugSpec[] = [

  {
    title: "The 140-Character Lie",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Strings", "Unicode"],
    description: `Inspired by Twitter's infamous character-counter quirks: links are supposed to cost a **flat 23 characters** (the t.co wrapper), and an emoji is **one** character to a human — yet the composer keeps blocking tweets that should fit.

Fix \`charCount.js\` so the counter matches the spec.`,
    bugReport: `**BUG-140** · Reported by: composer team

Spec: every URL counts as exactly 23 characters; everything else counts in
user-perceived characters (code points), not UTF-16 units.

Observed:
- "check https://a.very/long/path…" is counted at the URL's full length
- a single 🙂 is counted as TWO characters`,
    logs: `[composer] countTweet("🙂") -> 2 (expected 1)
[composer] over-limit block fired at 138 visible chars`,
    files: [
      {
        filePath: "src/tweet/charCount.js",
        isEditable: true,
        language: "javascript",
        content: `// Counts a tweet the way the platform bills it.
// Spec: URLs cost a flat 23 characters; text is counted in code points.
var URL_COST = 23;

exports.countTweet = function (text) {
  return text.length;
};
`,
      },
    ],
    tests: [
      {
        name: "plain text counts its characters",
        isHidden: false,
        source: `var c = require("src/tweet/charCount").countTweet;
assert.equal(c("hello"), 5);`,
      },
      {
        name: "a URL costs a flat 23",
        isHidden: false,
        source: `var c = require("src/tweet/charCount").countTweet;
assert.equal(c("check https://example.com/some/very/long/path now"), 33, "6 text + 23 url + 4 text");`,
      },
      {
        name: "an emoji is one character",
        isHidden: false,
        source: `var c = require("src/tweet/charCount").countTweet;
assert.equal(c("🙂🙂"), 2);`,
      },
      {
        name: "mixed url and emoji",
        isHidden: true,
        source: `var c = require("src/tweet/charCount").countTweet;
assert.equal(c("go https://a.b/x 🚀"), 28, "3 + 23 + 1 space + 1 emoji");`,
      },
    ],
    fixedFiles: {
      "src/tweet/charCount.js": `// Counts a tweet the way the platform bills it.
// Spec: URLs cost a flat 23 characters; text is counted in code points.
var URL_COST = 23;

exports.countTweet = function (text) {
  var placeholder = new Array(URL_COST + 1).join("x");
  var normalized = text.replace(/https?:\\/\\/\\S+/g, placeholder);
  var count = 0;
  for (var i = 0; i < normalized.length; i++) {
    count++;
    var code = normalized.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) i++; // skip the low surrogate
  }
  return count;
};
`,
    },
  },

  {
    title: "The Resurfaced Memory",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Filtering", "Privacy"],
    description: `Inspired by Facebook's Year in Review resurfacing posts people had deleted or locked down. The highlight reel must only ever contain **public, non-deleted** posts — sorted by likes, best first.

The bug hides in one filter expression in \`yearReview.js\`.`,
    bugReport: `**BUG-2014** · Priority: Critical (trust) · Reported by: comms

- Deleted posts are appearing in Year in Review reels.
- Private posts appear too.
- The "top" post shown is actually the LEAST liked one.

Spec: exclude deleted posts, exclude visibility "private", return the top N
by likes, most-liked first.`,
    logs: `[review] included post id=77 deleted=true
[review] first slide likes=2, last slide likes=9540`,
    files: [
      {
        filePath: "src/review/yearReview.js",
        isEditable: true,
        language: "javascript",
        content: `// Builds the year-in-review highlight reel.
exports.buildReel = function (posts, topN) {
  var eligible = posts.filter(function (p) {
    return !p.deleted || p.visibility !== "private";
  });
  eligible.sort(function (a, b) {
    return a.likes - b.likes;
  });
  return eligible.slice(0, topN);
};
`,
      },
    ],
    tests: [
      {
        name: "deleted posts never appear",
        isHidden: false,
        source: `var build = require("src/review/yearReview").buildReel;
var reel = build([
  { id: 1, likes: 10, deleted: true, visibility: "public" },
  { id: 2, likes: 5, deleted: false, visibility: "public" },
], 5);
assert.equal(reel.length, 1);
assert.equal(reel[0].id, 2);`,
      },
      {
        name: "private posts never appear",
        isHidden: false,
        source: `var build = require("src/review/yearReview").buildReel;
var reel = build([
  { id: 1, likes: 10, deleted: false, visibility: "private" },
  { id: 2, likes: 5, deleted: false, visibility: "public" },
], 5);
assert.equal(reel.length, 1);
assert.equal(reel[0].id, 2);`,
      },
      {
        name: "most liked comes first",
        isHidden: false,
        source: `var build = require("src/review/yearReview").buildReel;
var reel = build([
  { id: 1, likes: 3, deleted: false, visibility: "public" },
  { id: 2, likes: 9, deleted: false, visibility: "public" },
  { id: 3, likes: 6, deleted: false, visibility: "public" },
], 2);
assert.equal(reel.map(function (p) { return p.id; }), [2, 3]);`,
      },
      {
        name: "topN limits the reel",
        isHidden: true,
        source: `var build = require("src/review/yearReview").buildReel;
var posts = [];
for (var i = 1; i <= 8; i++) posts.push({ id: i, likes: i, deleted: false, visibility: "public" });
var reel = build(posts, 3);
assert.equal(reel.map(function (p) { return p.likes; }), [8, 7, 6]);`,
      },
    ],
    fixedFiles: {
      "src/review/yearReview.js": `// Builds the year-in-review highlight reel.
exports.buildReel = function (posts, topN) {
  var eligible = posts.filter(function (p) {
    return !p.deleted && p.visibility !== "private";
  });
  eligible.sort(function (a, b) {
    return b.likes - a.likes;
  });
  return eligible.slice(0, topN);
};
`,
    },
  },

  {
    title: "Shuffle Isn't Random",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Algorithms", "Randomness"],
    description: `Inspired by Spotify's famous shuffle complaints — and the classic broken shuffle behind them. A proper **Fisher–Yates** shuffle draws index \`j\` uniformly from \`0..i\` at each step; the shipped version draws from the whole array every time, biasing the result.

The RNG harness is locked and deterministic, so the correct permutations are exactly checkable.`,
    bugReport: `**BUG-4096** · Reported by: playback QA

With the seeded RNG that always returns 0.99, a correct Fisher–Yates pass must
leave the queue in its original order (j always equals i). Ours reorders it.

Statistical audit: the naive draw over the full length makes some
permutations ~30% more likely than others.`,
    logs: `[shuffle] rng=const(0.99) input=[1,2,3,4] -> [1,3,4,2] (expected [1,2,3,4])`,
    files: [
      {
        filePath: "src/player/rng.js",
        isEditable: false,
        language: "javascript",
        content: `// Deterministic RNG for tests. DO NOT EDIT.
exports.fromSequence = function (values) {
  var i = 0;
  return function () {
    var v = values[i % values.length];
    i++;
    return v;
  };
};
`,
      },
      {
        filePath: "src/player/shuffle.js",
        isEditable: true,
        language: "javascript",
        content: `// Fisher–Yates shuffle over a copy of the queue.
// rng() returns a float in [0, 1).
exports.shuffle = function (queue, rng) {
  var arr = queue.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * arr.length);
    var t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
};
`,
      },
    ],
    tests: [
      {
        name: "rng pinned high keeps the order (j === i each step)",
        isHidden: false,
        source: `var shuffle = require("src/player/shuffle").shuffle;
var rng = require("src/player/rng").fromSequence([0.99]);
assert.equal(shuffle([1, 2, 3, 4], rng), [1, 2, 3, 4]);`,
      },
      {
        name: "rng pinned low rotates deterministically",
        isHidden: false,
        source: `var shuffle = require("src/player/shuffle").shuffle;
var rng = require("src/player/rng").fromSequence([0]);
assert.equal(shuffle([1, 2, 3, 4], rng), [2, 3, 4, 1]);`,
      },
      {
        name: "every track is preserved",
        isHidden: false,
        source: `var shuffle = require("src/player/shuffle").shuffle;
var rng = require("src/player/rng").fromSequence([0.42, 0.17, 0.8]);
var out = shuffle([10, 20, 30, 40, 50], rng).slice().sort(function (a, b) { return a - b; });
assert.equal(out, [10, 20, 30, 40, 50]);`,
      },
      {
        name: "mixed seed produces the exact Fisher–Yates permutation",
        isHidden: true,
        source: `var shuffle = require("src/player/shuffle").shuffle;
var rng = require("src/player/rng").fromSequence([0.5, 0, 0.5]);
assert.equal(shuffle([10, 20, 30, 40], rng), [40, 20, 10, 30]);`,
      },
    ],
    fixedFiles: {
      "src/player/shuffle.js": `// Fisher–Yates shuffle over a copy of the queue.
// rng() returns a float in [0, 1).
exports.shuffle = function (queue, rng) {
  var arr = queue.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
};
`,
    },
  },

  {
    title: "Ten Seconds to Next Episode",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Timers", "Off-by-one"],
    description: `Inspired by every streaming service's autoplay countdown. The "Next episode in N…" overlay is skipping straight from 2 to launch, and sometimes fires the next episode a full second early.

Both symptoms come from the same two lines in \`countdown.js\`.`,
    bugReport: `**BUG-9001** · Reported by: playback UX

Spec (10s window):
- secondsLeft(startMs, nowMs) shows the CEILING of the remaining time: at
  9.2s remaining it must show 10, at 0.5s it shows 1, at 0 exactly it shows 0.
- shouldLaunch(startMs, nowMs) is true only once the full window has elapsed.

Observed: the overlay shows 9 immediately, and launch fires at 9.1s.`,
    logs: `[autoplay] t+0.0s label=9 (expected 10)
[autoplay] launched at t+9.1s (expected t+10.0s)`,
    files: [
      {
        filePath: "src/player/countdown.js",
        isEditable: true,
        language: "javascript",
        content: `// Autoplay countdown for the next-episode overlay.
var WINDOW_MS = 10000;

exports.secondsLeft = function (startMs, nowMs) {
  var remaining = WINDOW_MS - (nowMs - startMs);
  if (remaining <= 0) return 0;
  return Math.floor(remaining / 1000);
};

exports.shouldLaunch = function (startMs, nowMs) {
  return nowMs - startMs > WINDOW_MS - 1000;
};
`,
      },
    ],
    tests: [
      {
        name: "shows the full window at the start",
        isHidden: false,
        source: `var cd = require("src/player/countdown");
assert.equal(cd.secondsLeft(0, 0), 10);
assert.equal(cd.secondsLeft(0, 800), 10, "9.2s remaining rounds up to 10");`,
      },
      {
        name: "shows 1 for the final second",
        isHidden: false,
        source: `var cd = require("src/player/countdown");
assert.equal(cd.secondsLeft(0, 9500), 1);
assert.equal(cd.secondsLeft(0, 10000), 0);`,
      },
      {
        name: "never launches early",
        isHidden: false,
        source: `var cd = require("src/player/countdown");
assert.equal(cd.shouldLaunch(0, 9100), false, "9.1s is too early");
assert.equal(cd.shouldLaunch(0, 10000), true, "exactly 10s launches");`,
      },
      {
        name: "mid-window label is exact",
        isHidden: true,
        source: `var cd = require("src/player/countdown");
assert.equal(cd.secondsLeft(1000, 5500), 6, "5.5s remaining shows 6");
assert.equal(cd.shouldLaunch(1000, 10999), false);
assert.equal(cd.shouldLaunch(1000, 11000), true);`,
      },
    ],
    fixedFiles: {
      "src/player/countdown.js": `// Autoplay countdown for the next-episode overlay.
var WINDOW_MS = 10000;

exports.secondsLeft = function (startMs, nowMs) {
  var remaining = WINDOW_MS - (nowMs - startMs);
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 1000);
};

exports.shouldLaunch = function (startMs, nowMs) {
  return nowMs - startMs >= WINDOW_MS;
};
`,
    },
  },

  {
    title: "The Phantom Unread Badge",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["State", "Dedupe"],
    description: `Inspired by the eternally-wrong unread badges of chat apps. The socket re-delivers messages after reconnects, and marking a channel read somehow leaves exactly one message behind.

\`unread.js\` folds the event stream into a badge count — two bugs, one function.`,
    bugReport: `**BUG-1337** · Reported by: mobile team

Event stream contract:
- { type: "message", id, channel } — ids are unique but MAY be re-delivered
- { type: "read", channel, upToId } — clears every message with id <= upToId

Observed: badge shows 5 after a reconnect that re-sent 2 messages, and after
"mark as read" one unread always remains.`,
    logs: `[badge] general: events=6 unique=4 badge=6
[badge] after read upTo=42 -> badge=1 (expected 0)`,
    files: [
      {
        filePath: "src/chat/unread.js",
        isEditable: true,
        language: "javascript",
        content: `// Folds the socket event stream into unread counts per channel.
exports.unreadCounts = function (events) {
  var perChannel = {};

  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e.type === "message") {
      if (!perChannel[e.channel]) perChannel[e.channel] = [];
      perChannel[e.channel].push(e.id);
    } else if (e.type === "read") {
      var list = perChannel[e.channel] || [];
      perChannel[e.channel] = list.filter(function (id) {
        return id > e.upToId + 1;
      });
    }
  }

  var out = {};
  for (var ch in perChannel) out[ch] = perChannel[ch].length;
  return out;
};
`,
      },
    ],
    tests: [
      {
        name: "re-delivered messages count once",
        isHidden: false,
        source: `var f = require("src/chat/unread").unreadCounts;
var out = f([
  { type: "message", id: 1, channel: "general" },
  { type: "message", id: 2, channel: "general" },
  { type: "message", id: 1, channel: "general" },
]);
assert.equal(out.general, 2, "id 1 was re-delivered");`,
      },
      {
        name: "read clears everything up to and including upToId",
        isHidden: false,
        source: `var f = require("src/chat/unread").unreadCounts;
var out = f([
  { type: "message", id: 1, channel: "general" },
  { type: "message", id: 2, channel: "general" },
  { type: "read", channel: "general", upToId: 2 },
]);
assert.equal(out.general, 0);`,
      },
      {
        name: "messages after the read marker stay unread",
        isHidden: false,
        source: `var f = require("src/chat/unread").unreadCounts;
var out = f([
  { type: "message", id: 1, channel: "general" },
  { type: "read", channel: "general", upToId: 1 },
  { type: "message", id: 2, channel: "general" },
]);
assert.equal(out.general, 1);`,
      },
      {
        name: "channels are independent",
        isHidden: true,
        source: `var f = require("src/chat/unread").unreadCounts;
var out = f([
  { type: "message", id: 1, channel: "a" },
  { type: "message", id: 5, channel: "b" },
  { type: "message", id: 5, channel: "b" },
  { type: "read", channel: "a", upToId: 9 },
]);
assert.equal(out.a, 0);
assert.equal(out.b, 1);`,
      },
    ],
    fixedFiles: {
      "src/chat/unread.js": `// Folds the socket event stream into unread counts per channel.
exports.unreadCounts = function (events) {
  var perChannel = {};

  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e.type === "message") {
      if (!perChannel[e.channel]) perChannel[e.channel] = [];
      if (perChannel[e.channel].indexOf(e.id) === -1) {
        perChannel[e.channel].push(e.id);
      }
    } else if (e.type === "read") {
      var list = perChannel[e.channel] || [];
      perChannel[e.channel] = list.filter(function (id) {
        return id > e.upToId;
      });
    }
  }

  var out = {};
  for (var ch in perChannel) out[ch] = perChannel[ch].length;
  return out;
};
`,
    },
  },

  {
    title: "Double-Charged at Checkout",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Idempotency", "Payments"],
    description: `Inspired by the double-submit bugs every payments team has fought (and the idempotency keys Stripe popularised to kill them). An impatient double-click sends the same request twice — the processor must charge exactly once per idempotency key.

Fix \`chargeProcessor.js\`.`,
    bugReport: `**BUG-5150** · Priority: Critical · Reported by: support (chargebacks!)

Contract: process(key, amountCents) — a repeated key must be a no-op that
returns the ORIGINAL charge (same id, same amount), creating nothing new.

Observed: double-clicks create two charges; the retry even returns a
different charge id than the first attempt.`,
    logs: `[charge] key=ck_1a2b amount=4999 -> ch_001
[charge] key=ck_1a2b amount=4999 -> ch_002   <- duplicate!`,
    files: [
      {
        filePath: "src/pay/chargeProcessor.js",
        isEditable: true,
        language: "javascript",
        content: `// Charges with idempotency keys: one key, one charge — ever.
var charges = [];
var seenKeys = {};
var nextId = 1;

exports.process = function (key, amountCents) {
  var charge = { id: "ch_" + nextId, amount: amountCents, key: key };
  nextId++;
  charges.push(charge);
  if (!seenKeys[key]) {
    seenKeys[key] = charge;
  }
  return seenKeys[key];
};

exports.allCharges = function () { return charges.slice(); };
exports.resetAll = function () { charges = []; seenKeys = {}; nextId = 1; };
`,
      },
    ],
    tests: [
      {
        name: "a repeated key charges exactly once",
        isHidden: false,
        source: `var p = require("src/pay/chargeProcessor");
p.resetAll();
var a = p.process("ck_1", 4999);
var b = p.process("ck_1", 4999);
assert.equal(p.allCharges().length, 1, "one charge for one key");
assert.equal(a.id, b.id, "the retry returns the original charge");`,
      },
      {
        name: "different keys create separate charges",
        isHidden: false,
        source: `var p = require("src/pay/chargeProcessor");
p.resetAll();
p.process("ck_1", 1000);
p.process("ck_2", 2000);
assert.equal(p.allCharges().length, 2);`,
      },
      {
        name: "amounts are never double-counted",
        isHidden: true,
        source: `var p = require("src/pay/chargeProcessor");
p.resetAll();
p.process("k1", 500);
p.process("k1", 500);
p.process("k2", 250);
var total = p.allCharges().reduce(function (s, c) { return s + c.amount; }, 0);
assert.equal(total, 750);`,
      },
    ],
    fixedFiles: {
      "src/pay/chargeProcessor.js": `// Charges with idempotency keys: one key, one charge — ever.
var charges = [];
var seenKeys = {};
var nextId = 1;

exports.process = function (key, amountCents) {
  if (seenKeys[key]) {
    return seenKeys[key];
  }
  var charge = { id: "ch_" + nextId, amount: amountCents, key: key };
  nextId++;
  charges.push(charge);
  seenKeys[key] = charge;
  return charge;
};

exports.allCharges = function () { return charges.slice(); };
exports.resetAll = function () { charges = []; seenKeys = {}; nextId = 1; };
`,
    },
  },

  {
    title: "The One-Night Overcharge",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Dates", "Off-by-one"],
    description: `Inspired by the fencepost bugs that plague every booking site. Guests booking two nights are being quoted three, and a same-day "day use" booking charges a full night.

The nightly math lives in \`nights.js\` — dates arrive as \`YYYY-MM-DD\` strings.`,
    bugReport: `**BUG-1861** · Priority: High · Reported by: pricing

Check-in 2024-06-10, check-out 2024-06-12 is TWO nights. We quote three.
Check-in == check-out is ZERO nights. We quote one.

Guests are (rightly) filing refunds.`,
    logs: `[quote] 2024-06-10 -> 2024-06-12 nights=3 (expected 2)`,
    files: [
      {
        filePath: "src/booking/nights.js",
        isEditable: true,
        language: "javascript",
        content: `// Nights between an ISO check-in and check-out date (UTC, no times).
var DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(iso) {
  var p = iso.split("-");
  return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

exports.nightsBetween = function (checkin, checkout) {
  var diff = toUtc(checkout) - toUtc(checkin);
  return Math.floor(diff / DAY_MS) + 1;
};
`,
      },
    ],
    tests: [
      {
        name: "two nights are two nights",
        isHidden: false,
        source: `var n = require("src/booking/nights").nightsBetween;
assert.equal(n("2024-06-10", "2024-06-12"), 2);`,
      },
      {
        name: "same-day stay is zero nights",
        isHidden: false,
        source: `var n = require("src/booking/nights").nightsBetween;
assert.equal(n("2024-06-10", "2024-06-10"), 0);`,
      },
      {
        name: "month boundary is exact",
        isHidden: false,
        source: `var n = require("src/booking/nights").nightsBetween;
assert.equal(n("2024-01-30", "2024-02-02"), 3);`,
      },
      {
        name: "leap day counts correctly",
        isHidden: true,
        source: `var n = require("src/booking/nights").nightsBetween;
assert.equal(n("2024-02-28", "2024-03-01"), 2, "2024 has a Feb 29");`,
      },
    ],
    fixedFiles: {
      "src/booking/nights.js": `// Nights between an ISO check-in and check-out date (UTC, no times).
var DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(iso) {
  var p = iso.split("-");
  return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

exports.nightsBetween = function (checkin, checkout) {
  var diff = toUtc(checkout) - toUtc(checkin);
  return Math.round(diff / DAY_MS);
};
`,
    },
  },

  {
    title: "Cursor Chaos After the Emoji",
    difficulty: "medium",
    category: "frontend",
    language: "javascript",
    tags: ["Unicode", "Strings"],
    description: `Inspired by collaborative editors corrupting text around emoji. Positions in the document model are **user-perceived characters** (code points) — but the insert routine slices at raw UTF-16 offsets, splitting surrogate pairs and producing mojibake.

Fix \`insertAt.js\` so inserts land where humans expect.`,
    bugReport: `**BUG-D0C5** · Priority: High · Reported by: collab-editing

insertAt("a🙂b", 2, "X") must produce "a🙂Xb" — position 2 is after the
emoji, which is ONE character to the user.

Observed output contains a lone surrogate: the emoji is torn in half and the
document renders �X� from that point on.`,
    logs: `[ot] apply insert pos=2 -> "a\\ud83dX\\ude42b" (broken surrogate pair)`,
    files: [
      {
        filePath: "src/editor/insertAt.js",
        isEditable: true,
        language: "javascript",
        content: `// Inserts a string at a position measured in user-perceived characters.
exports.insertAt = function (text, pos, insertion) {
  return text.slice(0, pos) + insertion + text.slice(pos);
};
`,
      },
    ],
    tests: [
      {
        name: "plain ASCII inserts normally",
        isHidden: false,
        source: `var ins = require("src/editor/insertAt").insertAt;
assert.equal(ins("hello", 2, "-"), "he-llo");`,
      },
      {
        name: "inserting after an emoji keeps it intact",
        isHidden: false,
        source: `var ins = require("src/editor/insertAt").insertAt;
assert.equal(ins("a🙂b", 2, "X"), "a🙂Xb");`,
      },
      {
        name: "inserting between two emoji",
        isHidden: false,
        source: `var ins = require("src/editor/insertAt").insertAt;
assert.equal(ins("🙂🚀", 1, "|"), "🙂|🚀");`,
      },
      {
        name: "position past several emoji",
        isHidden: true,
        source: `var ins = require("src/editor/insertAt").insertAt;
assert.equal(ins("🙂🙂🙂", 3, "!"), "🙂🙂🙂!");
assert.equal(ins("x🙂y🙂z", 4, "*"), "x🙂y🙂*z");`,
      },
    ],
    fixedFiles: {
      "src/editor/insertAt.js": `// Inserts a string at a position measured in user-perceived characters.
exports.insertAt = function (text, pos, insertion) {
  var chars = Array.from(text);
  chars.splice(pos, 0, insertion);
  return chars.join("");
};
`,
    },
  },

  {
    title: "The Upvote That Counted Twice",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Dedupe", "State"],
    description: `Inspired by vote-count drift on link aggregators. A user who taps up, then down, then up again must count as **one final upvote** — the tally is per user, last action wins.

The event fold in \`votes.js\` sums raw events instead.`,
    bugReport: `**BUG-UPV2** · Reported by: ranking team

tally([u1:+1, u1:-1, u1:+1]) must be +1 (one user, final state up).
We compute +1 -1 +1 = ... well, +1 — but tally([u1:+1, u1:+1]) gives +2,
and rage-tappers are minting infinite karma.`,
    logs: `[votes] post 991: 3 users, tally=17`,
    files: [
      {
        filePath: "src/feed/votes.js",
        isEditable: true,
        language: "javascript",
        content: `// Folds vote events into a score. dir is +1 or -1.
exports.tally = function (events) {
  var score = 0;
  for (var i = 0; i < events.length; i++) {
    score += events[i].dir;
  }
  return score;
};
`,
      },
    ],
    tests: [
      {
        name: "one user's repeated upvotes count once",
        isHidden: false,
        source: `var tally = require("src/feed/votes").tally;
assert.equal(tally([
  { user: "u1", dir: 1 },
  { user: "u1", dir: 1 },
  { user: "u1", dir: 1 },
]), 1);`,
      },
      {
        name: "last action per user wins",
        isHidden: false,
        source: `var tally = require("src/feed/votes").tally;
assert.equal(tally([
  { user: "u1", dir: 1 },
  { user: "u1", dir: -1 },
]), -1);`,
      },
      {
        name: "independent users sum",
        isHidden: false,
        source: `var tally = require("src/feed/votes").tally;
assert.equal(tally([
  { user: "u1", dir: 1 },
  { user: "u2", dir: 1 },
  { user: "u3", dir: -1 },
]), 1);`,
      },
      {
        name: "mixed churn resolves to final states",
        isHidden: true,
        source: `var tally = require("src/feed/votes").tally;
assert.equal(tally([
  { user: "a", dir: 1 },
  { user: "b", dir: 1 },
  { user: "a", dir: -1 },
  { user: "c", dir: 1 },
  { user: "b", dir: 1 },
  { user: "a", dir: 1 },
]), 3);`,
      },
    ],
    fixedFiles: {
      "src/feed/votes.js": `// Folds vote events into a score. dir is +1 or -1.
exports.tally = function (events) {
  var lastByUser = {};
  for (var i = 0; i < events.length; i++) {
    lastByUser[events[i].user] = events[i].dir;
  }
  var score = 0;
  for (var u in lastByUser) {
    score += lastByUser[u];
  }
  return score;
};
`,
    },
  },

  {
    title: "Infinite Scroll, Infinite Repeats",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Pagination", "Dedupe"],
    description: `Inspired by every infinite feed that shows you the same clip twice. Page boundaries shift while you scroll (new posts push everything down), so incoming pages overlap what's already rendered.

\`feedMerge.js\` must append only the truly-new items, preserving order.`,
    bugReport: `**BUG-∞** · Reported by: feed QA

mergePage(existing, incoming) contract:
- keep every existing item, in order
- append only incoming items whose id is not already present, in their order

Observed: raw concatenation — users see duplicates on every page boundary.`,
    logs: `[feed] rendered ids: [8,7,6,5, 6,5,4,3]  <- 6 and 5 repeated`,
    files: [
      {
        filePath: "src/feed/feedMerge.js",
        isEditable: true,
        language: "javascript",
        content: `// Appends an incoming page to the already-rendered feed.
exports.mergePage = function (existing, incoming) {
  return existing.concat(incoming);
};
`,
      },
    ],
    tests: [
      {
        name: "overlapping items appear once",
        isHidden: false,
        source: `var merge = require("src/feed/feedMerge").mergePage;
var out = merge(
  [{ id: 8 }, { id: 7 }, { id: 6 }],
  [{ id: 6 }, { id: 5 }, { id: 4 }]
);
assert.equal(out.map(function (x) { return x.id; }), [8, 7, 6, 5, 4]);`,
      },
      {
        name: "disjoint pages append cleanly",
        isHidden: false,
        source: `var merge = require("src/feed/feedMerge").mergePage;
var out = merge([{ id: 3 }], [{ id: 2 }, { id: 1 }]);
assert.equal(out.map(function (x) { return x.id; }), [3, 2, 1]);`,
      },
      {
        name: "a fully-duplicate page adds nothing",
        isHidden: true,
        source: `var merge = require("src/feed/feedMerge").mergePage;
var out = merge([{ id: 2 }, { id: 1 }], [{ id: 2 }, { id: 1 }]);
assert.equal(out.length, 2);`,
      },
    ],
    fixedFiles: {
      "src/feed/feedMerge.js": `// Appends an incoming page to the already-rendered feed.
exports.mergePage = function (existing, incoming) {
  var seen = {};
  for (var i = 0; i < existing.length; i++) {
    seen[existing[i].id] = true;
  }
  var out = existing.slice();
  for (var j = 0; j < incoming.length; j++) {
    if (!seen[incoming[j].id]) {
      seen[incoming[j].id] = true;
      out.push(incoming[j]);
    }
  }
  return out;
};
`,
    },
  },

  {
    title: "Undo Send Never Works",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Units", "Timers"],
    description: `Inspired by Gmail's Undo Send — and by the unit-mismatch bugs that break features like it. The undo window is **5 seconds**, but the button is dead the instant an email leaves.

One comparison in \`undoSend.js\` mixes milliseconds with seconds.`,
    bugReport: `**BUG-CTRL-Z** · Priority: High · Reported by: dogfood

canUndo(sentAtMs, nowMs) with a 5-second window:
- 2s after sending -> must be true
- 6s after sending -> must be false
- exactly 5.000s   -> still true (inclusive)

Observed: false even 50ms after sending.`,
    logs: `[undo] sentAt=1700000000000 now=1700000000050 canUndo=false (?!)`,
    files: [
      {
        filePath: "src/mail/undoSend.js",
        isEditable: true,
        language: "javascript",
        content: `// The undo-send grace window.
var WINDOW_SECONDS = 5;

exports.canUndo = function (sentAtMs, nowMs) {
  return nowMs - sentAtMs <= WINDOW_SECONDS;
};
`,
      },
    ],
    tests: [
      {
        name: "undo works inside the window",
        isHidden: false,
        source: `var u = require("src/mail/undoSend").canUndo;
assert.equal(u(1700000000000, 1700000002000), true, "2s after send");`,
      },
      {
        name: "undo expires after the window",
        isHidden: false,
        source: `var u = require("src/mail/undoSend").canUndo;
assert.equal(u(1700000000000, 1700000006000), false, "6s after send");`,
      },
      {
        name: "the boundary second is inclusive",
        isHidden: false,
        source: `var u = require("src/mail/undoSend").canUndo;
assert.equal(u(1700000000000, 1700000005000), true, "exactly 5s");`,
      },
      {
        name: "one millisecond past the boundary is too late",
        isHidden: true,
        source: `var u = require("src/mail/undoSend").canUndo;
assert.equal(u(1700000000000, 1700000005001), false);`,
      },
    ],
    fixedFiles: {
      "src/mail/undoSend.js": `// The undo-send grace window.
var WINDOW_SECONDS = 5;

exports.canUndo = function (sentAtMs, nowMs) {
  return nowMs - sentAtMs <= WINDOW_SECONDS * 1000;
};
`,
    },
  },

  {
    title: "The ETA That Went Negative",
    difficulty: "easy",
    category: "frontend",
    language: "javascript",
    tags: ["Formatting", "Math"],
    description: `Inspired by ride-hailing apps showing "-1 min" while your driver waits outside. The ETA label must never go below "Arriving now", and partial minutes always round **up** — a driver 61 seconds away is "2 min", not "1 min".

Fix \`eta.js\`.`,
    bugReport: `**BUG-404MIN** · Reported by: rider app

formatEta(msRemaining):
- under 30 seconds (including anything negative) -> "Arriving now"
- otherwise ceil to whole minutes -> "N min"

Observed: "0 min" at 20s and "-1 min" after arrival.`,
    logs: `[eta] remaining=-32000 label="-1 min"`,
    files: [
      {
        filePath: "src/ride/eta.js",
        isEditable: true,
        language: "javascript",
        content: `// Human label for the ride ETA.
exports.formatEta = function (msRemaining) {
  var minutes = Math.floor(msRemaining / 60000);
  return minutes + " min";
};
`,
      },
    ],
    tests: [
      {
        name: "under 30 seconds is Arriving now",
        isHidden: false,
        source: `var f = require("src/ride/eta").formatEta;
assert.equal(f(20000), "Arriving now");`,
      },
      {
        name: "partial minutes round up",
        isHidden: false,
        source: `var f = require("src/ride/eta").formatEta;
assert.equal(f(90000), "2 min");
assert.equal(f(61000), "2 min");`,
      },
      {
        name: "negative time never shows",
        isHidden: false,
        source: `var f = require("src/ride/eta").formatEta;
assert.equal(f(-32000), "Arriving now");`,
      },
      {
        name: "exact minutes stay exact",
        isHidden: true,
        source: `var f = require("src/ride/eta").formatEta;
assert.equal(f(60000), "1 min");
assert.equal(f(300000), "5 min");`,
      },
    ],
    fixedFiles: {
      "src/ride/eta.js": `// Human label for the ride ETA.
exports.formatEta = function (msRemaining) {
  if (msRemaining < 30000) return "Arriving now";
  return Math.ceil(msRemaining / 60000) + " min";
};
`,
    },
  },

];
