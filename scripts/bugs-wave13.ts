/**
 * Wave 13 — documented security failures at named companies. Each challenge
 * plants the real defect and asks the hunter to close it; the tests encode the
 * correct, secure behaviour.
 *
 * Project files are Node 12-safe JS: no ??, ?., replaceAll, .at() or .flat().
 * Locked context files must be valid JS (the judge wraps every file as a
 * CommonJS module), so they carry their notes in a block comment.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE13: BugSpec[] = [

  {
    title: "The Environment Variable That Ran Code",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Parsing"],
    description: `Modelled on **Shellshock** (CVE-2014-6271, September 2014): Bash exported functions through environment variables, and its parser kept **executing whatever followed** the function definition. Any service that passed request data into the environment handed attackers command execution.

\`envparse.js\` has the same shape: it accepts a function definition in a variable and keeps everything after the closing brace.

Fix \`parseFunctionVar\` so trailing content after the definition is discarded and the variable rejected.`,
    bugReport: `**BUG-SHELLSHOCK** · Priority: Critical (RCE) · Reported by: security

parseFunctionVar(value) parses an exported function definition of the exact
form "() { <body>; }" and must return { ok, body, trailing }:
- a clean definition returns { ok: true, body: "<body>", trailing: "" }
- a definition with ANYTHING after the closing brace is malformed: return
  { ok: false, body: "", trailing: "" } and parse nothing
- a value that is not a function definition returns { ok: false, ... } too

Observed: text after the closing brace is returned as \`trailing\` and the
caller evaluates it.`,
    logs: `[env] parsed HTTP_USER_AGENT trailing="echo pwned"
[env] trailing segment evaluated by the request handler`,
    files: [
      {
        filePath: "src/shell/envparse.js",
        isEditable: true,
        language: "javascript",
        content: `// Parses an exported function definition out of an env var value.
exports.parseFunctionVar = function (value) {
  var open = value.indexOf("() {");
  if (open !== 0) return { ok: false, body: "", trailing: "" };
  var close = value.indexOf("}", 4);
  if (close === -1) return { ok: false, body: "", trailing: "" };
  var body = value.substring(4, close).trim();
  var trailing = value.substring(close + 1).trim();
  return { ok: true, body: body, trailing: trailing };
};
`,
      },
      {
        filePath: "src/shell/THREAT.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Environment variables carry request-controlled data in CGI-style services. A
parser that returns anything beyond the construct it was asked to parse hands
that data straight to whatever runs next. Reject, do not salvage.
*/
`,
      },
    ],
    tests: [
      {
        name: "a clean definition parses",
        isHidden: false,
        source: `var p = require("src/shell/envparse").parseFunctionVar;
assert.equal(p("() { echo hi; }"), { ok: true, body: "echo hi;", trailing: "" });`,
      },
      {
        name: "trailing content makes the value invalid",
        isHidden: false,
        source: `var p = require("src/shell/envparse").parseFunctionVar;
assert.equal(p("() { :; }; echo pwned"), { ok: false, body: "", trailing: "" }, "nothing may survive past the closing brace");`,
      },
      {
        name: "a non-definition is rejected",
        isHidden: true,
        source: `var p = require("src/shell/envparse").parseFunctionVar;
assert.equal(p("just a value"), { ok: false, body: "", trailing: "" });`,
      },
      {
        name: "an unterminated definition is rejected",
        isHidden: true,
        source: `var p = require("src/shell/envparse").parseFunctionVar;
assert.equal(p("() { echo hi;"), { ok: false, body: "", trailing: "" });`,
      },
    ],
    fixedFiles: {
      "src/shell/envparse.js": `// Parses an exported function definition out of an env var value.
exports.parseFunctionVar = function (value) {
  var open = value.indexOf("() {");
  if (open !== 0) return { ok: false, body: "", trailing: "" };
  var close = value.indexOf("}", 4);
  if (close === -1) return { ok: false, body: "", trailing: "" };
  // Anything past the closing brace is request-controlled data, not part of
  // the construct we were asked to parse. Reject the whole value rather than
  // handing the remainder to whatever runs next.
  var trailing = value.substring(close + 1).trim();
  if (trailing.length > 0) return { ok: false, body: "", trailing: "" };
  return { ok: true, body: value.substring(4, close).trim(), trailing: "" };
};
`,
    },
  },

  {
    title: "The Password in the Debug Log",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Logging"],
    description: `Modelled on **Twitter's 2018 disclosure**: a bug wrote passwords to an internal log *before* the hashing step, leaving them readable in plain text. Twitter asked all 330 million users to change their password. GitHub disclosed a near-identical bug the same year.

\`auth.js\` logs the whole credential object on every login attempt.

Fix \`login\` so no secret ever reaches the log.`,
    bugReport: `**BUG-TW2018** · Priority: Critical · Reported by: security review

login(credentials, store, logger) must:
- log exactly one entry of the form { event: "login", username: <username> } —
  never the password, and never any other secret field
- return true when store[username] equals hash(password), false otherwise

Observed: the log line contains the raw password. Anyone with log access has
every user's credential.`,
    logs: `[auth] login {"username":"kai","password":"hunter2"}
[auth] 330M log lines contain readable credentials`,
    files: [
      {
        filePath: "src/auth/auth.js",
        isEditable: true,
        language: "javascript",
        content: `function hash(text) {
  var h = 5381;
  for (var i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return "h" + h.toString(16);
}
exports.hash = hash;

exports.login = function (credentials, store, logger) {
  logger.log({ event: "login", username: credentials.username, password: credentials.password });
  return store[credentials.username] === hash(credentials.password);
};
`,
      },
      {
        filePath: "src/auth/LOGGING.js",
        isEditable: false,
        language: "javascript",
        content: `/*
logger.log(entry) appends entry to logger.entries.
Logs are replicated, retained and widely readable. A secret that reaches a log
is a secret that has been disclosed — redact at the call site, not downstream.
*/
`,
      },
      {
        filePath: "src/auth/logger.js",
        isEditable: false,
        language: "javascript",
        content: `exports.create = function () {
  var entries = [];
  return {
    entries: entries,
    log: function (entry) { entries.push(entry); }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "a correct password authenticates",
        isHidden: false,
        source: `var a = require("src/auth/auth");
var logger = require("src/auth/logger").create();
var store = { kai: a.hash("hunter2") };
assert.equal(a.login({ username: "kai", password: "hunter2" }, store, logger), true);`,
      },
      {
        name: "the password never reaches the log",
        isHidden: false,
        source: `var a = require("src/auth/auth");
var logger = require("src/auth/logger").create();
var store = { kai: a.hash("hunter2") };
a.login({ username: "kai", password: "hunter2" }, store, logger);
assert.equal(logger.entries, [{ event: "login", username: "kai" }], "the log must carry no secret");`,
      },
      {
        name: "a wrong password is rejected and still not logged",
        isHidden: true,
        source: `var a = require("src/auth/auth");
var logger = require("src/auth/logger").create();
var store = { kai: a.hash("hunter2") };
assert.equal(a.login({ username: "kai", password: "wrong" }, store, logger), false);
assert.equal(logger.entries, [{ event: "login", username: "kai" }]);`,
      },
      {
        name: "an unknown user is rejected",
        isHidden: true,
        source: `var a = require("src/auth/auth");
var logger = require("src/auth/logger").create();
assert.equal(a.login({ username: "ghost", password: "x" }, {}, logger), false);
assert.equal(logger.entries.length, 1);`,
      },
    ],
    fixedFiles: {
      "src/auth/auth.js": `function hash(text) {
  var h = 5381;
  for (var i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return "h" + h.toString(16);
}
exports.hash = hash;

exports.login = function (credentials, store, logger) {
  // Redact at the call site: build the log entry explicitly from the fields
  // that are safe to keep, rather than passing the credential object along.
  logger.log({ event: "login", username: credentials.username });
  return store[credentials.username] === hash(credentials.password);
};
`,
    },
  },

  {
    title: "Readable Passwords at Rest",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Security", "Hashing"],
    description: `Modelled on **Facebook's 2019 disclosure**: hundreds of millions of user passwords had been stored in readable form in internal systems, searchable by thousands of employees. The passwords had never been hashed on the path that wrote them.

\`accounts.js\` stores whatever it is handed and compares it directly.

Fix \`createAccount\` and \`verify\` so passwords are stored **only** as salted hashes.`,
    bugReport: `**BUG-FB2019** · Priority: Critical · Reported by: security

createAccount(store, username, password) must write a record shaped
{ salt, hash } — with no field anywhere holding the password itself.
verify(store, username, password) must return true only for the right password.

Observed: the stored record contains a \`password\` field in plain text, and
verify compares strings directly.`,
    logs: `[store] record kai = {"password":"hunter2"}
[audit] 2000 internal accounts could read the users table`,
    files: [
      {
        filePath: "src/accounts/accounts.js",
        isEditable: true,
        language: "javascript",
        content: `var crypto = require("./crypto");

exports.createAccount = function (store, username, password) {
  store[username] = { password: password };
  return true;
};

exports.verify = function (store, username, password) {
  var record = store[username];
  if (!record) return false;
  return record.password === password;
};
`,
      },
      {
        filePath: "src/accounts/crypto.js",
        isEditable: false,
        language: "javascript",
        content: `// Deterministic stand-in for a password KDF. DO NOT EDIT.
exports.makeSalt = function (username) {
  var s = 0;
  for (var i = 0; i < username.length; i++) s = (s * 31 + username.charCodeAt(i)) >>> 0;
  return "s" + s.toString(16);
};

exports.derive = function (salt, password) {
  var h = 2166136261;
  var text = salt + "|" + password;
  for (var i = 0; i < text.length; i++) {
    h = h ^ text.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return "d" + h.toString(16);
};
`,
      },
    ],
    tests: [
      {
        name: "the right password verifies",
        isHidden: false,
        source: `var a = require("src/accounts/accounts");
var store = {};
a.createAccount(store, "kai", "hunter2");
assert.equal(a.verify(store, "kai", "hunter2"), true);`,
      },
      {
        name: "the stored record holds no readable password",
        isHidden: false,
        source: `var a = require("src/accounts/accounts");
var store = {};
a.createAccount(store, "kai", "hunter2");
var record = store["kai"];
var keys = Object.keys(record).sort();
assert.equal(keys, ["hash", "salt"], "only a salt and a hash may be stored");
var dumped = JSON.stringify(record);
assert.ok(dumped.indexOf("hunter2") === -1, "the password must not appear anywhere in the record");`,
      },
      {
        name: "a wrong password is rejected",
        isHidden: true,
        source: `var a = require("src/accounts/accounts");
var store = {};
a.createAccount(store, "kai", "hunter2");
assert.equal(a.verify(store, "kai", "hunter3"), false);
assert.equal(a.verify(store, "nobody", "hunter2"), false);`,
      },
      {
        name: "two users with the same password get different hashes",
        isHidden: true,
        source: `var a = require("src/accounts/accounts");
var store = {};
a.createAccount(store, "kai", "same");
a.createAccount(store, "sam", "same");
assert.ok(store["kai"].hash !== store["sam"].hash, "the salt must be per-user");`,
      },
    ],
    fixedFiles: {
      "src/accounts/accounts.js": `var crypto = require("./crypto");

exports.createAccount = function (store, username, password) {
  // Store only what is needed to check a future attempt: a per-user salt and
  // the derived hash. The password itself never lands in the record.
  var salt = crypto.makeSalt(username);
  store[username] = { salt: salt, hash: crypto.derive(salt, password) };
  return true;
};

exports.verify = function (store, username, password) {
  var record = store[username];
  if (!record) return false;
  return record.hash === crypto.derive(record.salt, password);
};
`,
    },
  },

  {
    title: "The Fetch That Reached the Metadata Service",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Security", "SSRF"],
    description: `Modelled on the **Capital One breach** (July 2019): a misconfigured proxy let an attacker make the server fetch a URL of their choosing. They pointed it at the cloud metadata endpoint \`169.254.169.254\`, retrieved the instance's credentials, and used them to read 100 million customer records.

\`fetcher.js\` fetches whatever URL it is given.

Fix \`checkUrl\` so internal and link-local addresses are refused.`,
    bugReport: `**BUG-CAPONE** · Priority: Critical (SSRF) · Reported by: security

checkUrl(url) must return { allowed, reason } for a URL of the form
"http://<host>/<path>":
- reject anything whose host is not in the public allow-list — reason "blocked"
- specifically reject the metadata address 169.254.169.254, localhost,
  127.0.0.1, and the private ranges 10.x and 192.168.x
- an allowed host returns { allowed: true, reason: "ok" }

Observed: every URL is fetched, including the instance metadata endpoint.`,
    logs: `[proxy] fetched http://169.254.169.254/latest/meta-data/iam/security-credentials/
[proxy] response contained an access key and session token`,
    files: [
      {
        filePath: "src/proxy/fetcher.js",
        isEditable: true,
        language: "javascript",
        content: `var ALLOWED_HOSTS = ["images.example.com", "cdn.example.com", "assets.example.org"];
exports.ALLOWED_HOSTS = ALLOWED_HOSTS;

function hostOf(url) {
  var withoutScheme = url.replace("http://", "").replace("https://", "");
  var slash = withoutScheme.indexOf("/");
  return slash === -1 ? withoutScheme : withoutScheme.substring(0, slash);
}
exports.hostOf = hostOf;

exports.checkUrl = function (url) {
  return { allowed: true, reason: "ok" };
};
`,
      },
      {
        filePath: "src/proxy/SSRF.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A server-side fetch runs with the server's network position and the server's
credentials. Treat the destination as untrusted input: allow-list the hosts you
intend to reach, and never rely on a deny-list alone.
*/
`,
      },
    ],
    tests: [
      {
        name: "an allow-listed host is permitted",
        isHidden: false,
        source: `var c = require("src/proxy/fetcher").checkUrl;
assert.equal(c("http://images.example.com/cat.png"), { allowed: true, reason: "ok" });`,
      },
      {
        name: "the metadata endpoint is refused",
        isHidden: false,
        source: `var c = require("src/proxy/fetcher").checkUrl;
assert.equal(c("http://169.254.169.254/latest/meta-data/"), { allowed: false, reason: "blocked" }, "link-local metadata must never be reachable");`,
      },
      {
        name: "loopback and private ranges are refused",
        isHidden: false,
        source: `var c = require("src/proxy/fetcher").checkUrl;
assert.equal(c("http://localhost/admin").allowed, false);
assert.equal(c("http://127.0.0.1:8080/").allowed, false);
assert.equal(c("http://10.0.0.5/secret").allowed, false);
assert.equal(c("http://192.168.1.1/").allowed, false);`,
      },
      {
        name: "an unknown public host is also refused",
        isHidden: true,
        source: `var c = require("src/proxy/fetcher").checkUrl;
assert.equal(c("http://evil.example/x"), { allowed: false, reason: "blocked" });
assert.equal(c("http://cdn.example.com/a.js"), { allowed: true, reason: "ok" });`,
      },
    ],
    fixedFiles: {
      "src/proxy/fetcher.js": `var ALLOWED_HOSTS = ["images.example.com", "cdn.example.com", "assets.example.org"];
exports.ALLOWED_HOSTS = ALLOWED_HOSTS;

function hostOf(url) {
  var withoutScheme = url.replace("http://", "").replace("https://", "");
  var slash = withoutScheme.indexOf("/");
  return slash === -1 ? withoutScheme : withoutScheme.substring(0, slash);
}
exports.hostOf = hostOf;

exports.checkUrl = function (url) {
  var host = hostOf(url);
  // Strip any port before comparing — 127.0.0.1:8080 is still loopback.
  var colon = host.indexOf(":");
  if (colon !== -1) host = host.substring(0, colon);
  // Allow-list only. A deny-list alone always misses a spelling of localhost.
  if (ALLOWED_HOSTS.indexOf(host) === -1) {
    return { allowed: false, reason: "blocked" };
  }
  return { allowed: true, reason: "ok" };
};
`,
    },
  },

  {
    title: "Document 000000001, No Login Required",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Authorization"],
    description: `Modelled on the **First American Financial** exposure (May 2019): document URLs used sequential IDs and the endpoint performed **no authorization check**. Changing the number in the URL walked 885 million records of mortgage paperwork, including bank statements and social security numbers.

\`documents.js\` returns any document whose id is requested.

Fix \`getDocument\` so a caller may only read documents they own.`,
    bugReport: `**BUG-FAF2019** · Priority: Critical (IDOR) · Reported by: security

getDocument(store, docId, session) must return { status, doc }:
- { status: 401, doc: null } when session is missing or has no userId
- { status: 404, doc: null } when the document does not exist
- { status: 403, doc: null } when the document's ownerId is not the caller
- { status: 200, doc } otherwise

Observed: any id returns the document, with or without a session.`,
    logs: `[docs] served doc 000000002 to anonymous caller
[docs] 885,000,000 documents enumerable by incrementing the id`,
    files: [
      {
        filePath: "src/docs/documents.js",
        isEditable: true,
        language: "javascript",
        content: `// Fetches a document by id.
exports.getDocument = function (store, docId, session) {
  var doc = store[docId];
  return { status: 200, doc: doc };
};
`,
      },
      {
        filePath: "src/docs/MODEL.js",
        isEditable: false,
        language: "javascript",
        content: `/*
store maps docId -> { id, ownerId, body }.
session is either null or { userId }.
An object id is not a capability: knowing it must never be sufficient to read
the object. Check authentication, then existence, then ownership.
*/
`,
      },
    ],
    tests: [
      {
        name: "the owner can read their document",
        isHidden: false,
        source: `var g = require("src/docs/documents").getDocument;
var store = { d1: { id: "d1", ownerId: "u1", body: "deed" } };
assert.equal(g(store, "d1", { userId: "u1" }), { status: 200, doc: { id: "d1", ownerId: "u1", body: "deed" } });`,
      },
      {
        name: "another user is refused",
        isHidden: false,
        source: `var g = require("src/docs/documents").getDocument;
var store = { d1: { id: "d1", ownerId: "u1", body: "deed" } };
assert.equal(g(store, "d1", { userId: "u2" }), { status: 403, doc: null }, "an id is not a capability");`,
      },
      {
        name: "an anonymous caller is refused",
        isHidden: false,
        source: `var g = require("src/docs/documents").getDocument;
var store = { d1: { id: "d1", ownerId: "u1", body: "deed" } };
assert.equal(g(store, "d1", null), { status: 401, doc: null });
assert.equal(g(store, "d1", {}), { status: 401, doc: null });`,
      },
      {
        name: "a missing document is a 404, not a 200",
        isHidden: true,
        source: `var g = require("src/docs/documents").getDocument;
assert.equal(g({}, "nope", { userId: "u1" }), { status: 404, doc: null });`,
      },
    ],
    fixedFiles: {
      "src/docs/documents.js": `// Fetches a document by id.
exports.getDocument = function (store, docId, session) {
  // Authenticate, then check existence, then check ownership. An object id is
  // not a capability.
  if (!session || !session.userId) return { status: 401, doc: null };
  var doc = store[docId];
  if (!doc) return { status: 404, doc: null };
  if (doc.ownerId !== session.userId) return { status: 403, doc: null };
  return { status: 200, doc: doc };
};
`,
    },
  },

  {
    title: "The Endpoint That Forgot Private Meant Private",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Privacy"],
    description: `Modelled on the **Peloton API exposure** (2021): an endpoint returned full profile data — age, weight, workout history — for any user id, ignoring the account's "private profile" setting entirely. It was reachable without authentication.

\`profiles.js\` returns everything it has.

Fix \`getProfile\` so private accounts expose only their public fields to strangers.`,
    bugReport: `**BUG-PELOTON** · Priority: High (privacy) · Reported by: security

getProfile(store, userId, viewerId) must return the profile fields the viewer
is entitled to:
- the owner (viewerId equals userId) always sees every field
- a stranger viewing a PUBLIC profile sees every field
- a stranger viewing a PRIVATE profile sees only { id, displayName }
- a missing user returns null

Observed: private profiles return their full record to any caller.`,
    logs: `[api] GET /profile/8812 viewer=anonymous private=true -> full record
[api] age, weight and workout history returned for private accounts`,
    files: [
      {
        filePath: "src/social/profiles.js",
        isEditable: true,
        language: "javascript",
        content: `// Returns a user's profile as visible to the viewer.
exports.getProfile = function (store, userId, viewerId) {
  var user = store[userId];
  if (!user) return null;
  return user;
};
`,
      },
      {
        filePath: "src/social/MODEL.js",
        isEditable: false,
        language: "javascript",
        content: `/*
store maps userId -> { id, displayName, isPrivate, age, weight }.
A privacy setting is only real if every read path honours it. Build the
response from the fields the viewer may see, rather than removing fields from
the full record and hoping none were missed.
*/
`,
      },
    ],
    tests: [
      {
        name: "the owner sees everything",
        isHidden: false,
        source: `var g = require("src/social/profiles").getProfile;
var store = { u1: { id: "u1", displayName: "Kai", isPrivate: true, age: 31, weight: 70 } };
assert.equal(g(store, "u1", "u1"), { id: "u1", displayName: "Kai", isPrivate: true, age: 31, weight: 70 });`,
      },
      {
        name: "a stranger sees only public fields of a private profile",
        isHidden: false,
        source: `var g = require("src/social/profiles").getProfile;
var store = { u1: { id: "u1", displayName: "Kai", isPrivate: true, age: 31, weight: 70 } };
assert.equal(g(store, "u1", "u2"), { id: "u1", displayName: "Kai" }, "a private profile must not leak age or weight");`,
      },
      {
        name: "a public profile is fully visible",
        isHidden: false,
        source: `var g = require("src/social/profiles").getProfile;
var store = { u3: { id: "u3", displayName: "Sam", isPrivate: false, age: 40, weight: 65 } };
assert.equal(g(store, "u3", "u9"), { id: "u3", displayName: "Sam", isPrivate: false, age: 40, weight: 65 });`,
      },
      {
        name: "an anonymous viewer of a private profile is limited",
        isHidden: true,
        source: `var g = require("src/social/profiles").getProfile;
var store = { u1: { id: "u1", displayName: "Kai", isPrivate: true, age: 31, weight: 70 } };
assert.equal(g(store, "u1", null), { id: "u1", displayName: "Kai" });
assert.equal(g(store, "missing", "u1"), null);`,
      },
    ],
    fixedFiles: {
      "src/social/profiles.js": `// Returns a user's profile as visible to the viewer.
exports.getProfile = function (store, userId, viewerId) {
  var user = store[userId];
  if (!user) return null;
  if (viewerId === userId) return user;
  if (!user.isPrivate) return user;
  // Build the restricted view from the fields a stranger may see, rather than
  // stripping fields off the full record and hoping none were missed.
  return { id: user.id, displayName: user.displayName };
};
`,
    },
  },

  {
    title: "Audio Before the Call Was Answered",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "State Machine"],
    description: `Modelled on the **Apple Group FaceTime bug** (January 2019): adding your own number to a group call put the callee's device into a state where it transmitted **audio before the call was answered**. Apple disabled Group FaceTime server-side for over a week.

\`call.js\` starts the media stream as soon as a participant is added, whatever state the call is in.

Fix \`addParticipant\` so media only flows once the call is genuinely answered.`,
    bugReport: `**BUG-FACETIME** · Priority: Critical (privacy) · Reported by: security

addParticipant(call, userId) must:
- add the user to call.participants
- start streaming that participant's media ONLY when call.state is "answered"
- while the state is "ringing", the participant is added with streaming false
- return the resulting participant record

answerCall(call) flips the state to "answered" and starts media for everyone
already present.

Observed: adding a participant while the call is still ringing starts their
media immediately, so the callee is heard before picking up.`,
    logs: `[call] participant self added while state=ringing streaming=true
[call] callee audio transmitted 11s before answer`,
    files: [
      {
        filePath: "src/calls/call.js",
        isEditable: true,
        language: "javascript",
        content: `exports.addParticipant = function (call, userId) {
  var p = { userId: userId, streaming: true };
  call.participants.push(p);
  return p;
};

exports.answerCall = function (call) {
  call.state = "answered";
  for (var i = 0; i < call.participants.length; i++) {
    call.participants[i].streaming = true;
  }
  return call;
};
`,
      },
      {
        filePath: "src/calls/STATES.js",
        isEditable: false,
        language: "javascript",
        content: `/*
call = { state: "ringing" | "answered", participants: [{ userId, streaming }] }.
Media capture is gated on consent, and consent is the answer event. No path
into the participant list may bypass that gate.
*/
`,
      },
    ],
    tests: [
      {
        name: "a participant added while ringing does not stream",
        isHidden: false,
        source: `var c = require("src/calls/call");
var call = { state: "ringing", participants: [] };
assert.equal(c.addParticipant(call, "self"), { userId: "self", streaming: false }, "no media before the call is answered");`,
      },
      {
        name: "answering starts media for everyone present",
        isHidden: false,
        source: `var c = require("src/calls/call");
var call = { state: "ringing", participants: [] };
c.addParticipant(call, "a");
c.addParticipant(call, "b");
c.answerCall(call);
assert.equal(call.participants[0].streaming, true);
assert.equal(call.participants[1].streaming, true);`,
      },
      {
        name: "a participant added after answering streams immediately",
        isHidden: true,
        source: `var c = require("src/calls/call");
var call = { state: "answered", participants: [] };
assert.equal(c.addParticipant(call, "late"), { userId: "late", streaming: true });`,
      },
      {
        name: "the participant list still records everyone",
        isHidden: true,
        source: `var c = require("src/calls/call");
var call = { state: "ringing", participants: [] };
c.addParticipant(call, "x");
c.addParticipant(call, "y");
assert.equal(call.participants.length, 2);`,
      },
    ],
    fixedFiles: {
      "src/calls/call.js": `exports.addParticipant = function (call, userId) {
  // Media capture is gated on consent, and consent is the answer event.
  var p = { userId: userId, streaming: call.state === "answered" };
  call.participants.push(p);
  return p;
};

exports.answerCall = function (call) {
  call.state = "answered";
  for (var i = 0; i < call.participants.length; i++) {
    call.participants[i].streaming = true;
  }
  return call;
};
`,
    },
  },

  {
    title: "Nine Digits and You're In the Meeting",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Access Control"],
    description: `Modelled on **Zoom's 2020 "Zoombombing" wave**: meeting IDs were short numeric codes, passwords were off by default, and there was no rate limit on joining. Automated tools guessed live meeting IDs and dropped strangers into calls.

\`meetings.js\` admits anyone who supplies an existing meeting id.

Fix \`joinMeeting\` so a passcode is required and repeated failed attempts are throttled.`,
    bugReport: `**BUG-ZOOM2020** · Priority: Critical · Reported by: trust & safety

joinMeeting(meetings, attempts, meetingId, passcode) must return
{ status, admitted }:
- "not-found" when the meeting does not exist
- "locked" when that client has already made 5 failed attempts
- "denied" when the passcode does not match (and the failure is recorded)
- "ok" with admitted true when it matches

attempts is a plain object mapping meetingId -> failed count.

Observed: any known meeting id admits the caller, and there is no attempt
limit at all.`,
    logs: `[meet] admitted anonymous joiner to 8471120394 (no passcode set)
[meet] 41,000 join attempts from one source in 6 minutes`,
    files: [
      {
        filePath: "src/meet/meetings.js",
        isEditable: true,
        language: "javascript",
        content: `exports.joinMeeting = function (meetings, attempts, meetingId, passcode) {
  var meeting = meetings[meetingId];
  if (!meeting) return { status: "not-found", admitted: false };
  return { status: "ok", admitted: true };
};
`,
      },
      {
        filePath: "src/meet/POLICY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
meetings maps meetingId -> { id, passcode }.
A short numeric identifier is guessable by construction, so it cannot be the
only thing standing between a stranger and the room. Require the passcode and
throttle repeated failures — five is the limit.
*/
`,
      },
    ],
    tests: [
      {
        name: "the right passcode admits",
        isHidden: false,
        source: `var j = require("src/meet/meetings").joinMeeting;
var meetings = { "847112": { id: "847112", passcode: "1234" } };
assert.equal(j(meetings, {}, "847112", "1234"), { status: "ok", admitted: true });`,
      },
      {
        name: "a wrong passcode is denied",
        isHidden: false,
        source: `var j = require("src/meet/meetings").joinMeeting;
var meetings = { "847112": { id: "847112", passcode: "1234" } };
var attempts = {};
assert.equal(j(meetings, attempts, "847112", "0000"), { status: "denied", admitted: false }, "a known id must not be enough");
assert.equal(attempts["847112"], 1);`,
      },
      {
        name: "repeated failures lock the meeting",
        isHidden: false,
        source: `var j = require("src/meet/meetings").joinMeeting;
var meetings = { "847112": { id: "847112", passcode: "1234" } };
var attempts = {};
for (var i = 0; i < 5; i++) j(meetings, attempts, "847112", "0000");
assert.equal(j(meetings, attempts, "847112", "1234"), { status: "locked", admitted: false }, "guessing must be throttled");`,
      },
      {
        name: "an unknown meeting is not found",
        isHidden: true,
        source: `var j = require("src/meet/meetings").joinMeeting;
assert.equal(j({}, {}, "000000", "1234"), { status: "not-found", admitted: false });`,
      },
    ],
    fixedFiles: {
      "src/meet/meetings.js": `var MAX_ATTEMPTS = 5;

exports.joinMeeting = function (meetings, attempts, meetingId, passcode) {
  var meeting = meetings[meetingId];
  if (!meeting) return { status: "not-found", admitted: false };
  // A short numeric id is guessable by construction, so throttle first...
  var failed = attempts[meetingId] || 0;
  if (failed >= MAX_ATTEMPTS) return { status: "locked", admitted: false };
  // ...then require the passcode.
  if (meeting.passcode !== passcode) {
    attempts[meetingId] = failed + 1;
    return { status: "denied", admitted: false };
  }
  return { status: "ok", admitted: true };
};
`,
    },
  },

  {
    title: "The Heatmap That Mapped the Base",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Privacy", "Aggregation"],
    description: `Modelled on the **Strava global heatmap** (January 2018): aggregated, "anonymised" activity data was published worldwide. In remote regions the only people running were soldiers, so the heatmap traced the perimeters and patrol routes of undisclosed military bases.

\`heatmap.js\` publishes every cell that has any activity at all.

Fix \`buildHeatmap\` so a cell is only published when enough **distinct users** contributed to it.`,
    bugReport: `**BUG-STRAVA** · Priority: Critical (privacy) · Reported by: trust & safety

buildHeatmap(activities, minUsers) must return the published cells as a sorted
array of { cell, count } where:
- count is the number of DISTINCT users with activity in that cell
- only cells with count >= minUsers are published
- cells are sorted by cell name ascending

Observed: every cell is published, including cells whose entire signal comes
from a single person.`,
    logs: `[heatmap] published cell "af-77-12" contributors=1
[heatmap] cell outlines a facility that is not on any map`,
    files: [
      {
        filePath: "src/geo/heatmap.js",
        isEditable: true,
        language: "javascript",
        content: `// Aggregates activities into publishable heatmap cells.
exports.buildHeatmap = function (activities, minUsers) {
  var byCell = {};
  for (var i = 0; i < activities.length; i++) {
    var a = activities[i];
    if (!byCell[a.cell]) byCell[a.cell] = {};
    byCell[a.cell][a.userId] = true;
  }
  var out = [];
  var cells = Object.keys(byCell);
  for (var c = 0; c < cells.length; c++) {
    out.push({ cell: cells[c], count: Object.keys(byCell[cells[c]]).length });
  }
  out.sort(function (x, y) { return x.cell < y.cell ? -1 : (x.cell > y.cell ? 1 : 0); });
  return out;
};
`,
      },
      {
        filePath: "src/geo/PRIVACY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Aggregation is only anonymising when the aggregate is large enough to hide the
individual. A cell whose signal comes from one or two people is a record of
those people's movements, however it is labelled. Enforce a k-anonymity floor.
*/
`,
      },
    ],
    tests: [
      {
        name: "a busy cell is published",
        isHidden: false,
        source: `var b = require("src/geo/heatmap").buildHeatmap;
var acts = [
  { cell: "aa-01", userId: "u1" },
  { cell: "aa-01", userId: "u2" },
  { cell: "aa-01", userId: "u3" }
];
assert.equal(b(acts, 3), [{ cell: "aa-01", count: 3 }]);`,
      },
      {
        name: "a single-contributor cell is withheld",
        isHidden: false,
        source: `var b = require("src/geo/heatmap").buildHeatmap;
var acts = [
  { cell: "af-77", userId: "solo" },
  { cell: "af-77", userId: "solo" },
  { cell: "bb-02", userId: "u1" },
  { cell: "bb-02", userId: "u2" },
  { cell: "bb-02", userId: "u3" }
];
assert.equal(b(acts, 3), [{ cell: "bb-02", count: 3 }], "one person's route is not an aggregate");`,
      },
      {
        name: "repeat visits by the same user count once",
        isHidden: true,
        source: `var b = require("src/geo/heatmap").buildHeatmap;
var acts = [];
for (var i = 0; i < 50; i++) acts.push({ cell: "cc-03", userId: "same" });
assert.equal(b(acts, 2), []);`,
      },
      {
        name: "output is sorted by cell",
        isHidden: true,
        source: `var b = require("src/geo/heatmap").buildHeatmap;
var acts = [
  { cell: "zz-99", userId: "a" }, { cell: "zz-99", userId: "b" },
  { cell: "aa-00", userId: "a" }, { cell: "aa-00", userId: "b" }
];
assert.equal(b(acts, 2), [{ cell: "aa-00", count: 2 }, { cell: "zz-99", count: 2 }]);`,
      },
    ],
    fixedFiles: {
      "src/geo/heatmap.js": `// Aggregates activities into publishable heatmap cells.
exports.buildHeatmap = function (activities, minUsers) {
  var byCell = {};
  for (var i = 0; i < activities.length; i++) {
    var a = activities[i];
    if (!byCell[a.cell]) byCell[a.cell] = {};
    byCell[a.cell][a.userId] = true;
  }
  var out = [];
  var cells = Object.keys(byCell);
  for (var c = 0; c < cells.length; c++) {
    var count = Object.keys(byCell[cells[c]]).length;
    // k-anonymity floor: a cell whose signal comes from too few people is a
    // record of those people, not an aggregate.
    if (count < minUsers) continue;
    out.push({ cell: cells[c], count: count });
  }
  out.sort(function (x, y) { return x.cell < y.cell ? -1 : (x.cell > y.cell ? 1 : 0); });
  return out;
};
`,
    },
  },

  {
    title: "The API That Returned More Than the Profile",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "API Design"],
    description: `Modelled on the **Google+ API bug** (disclosed October 2018): an endpoint meant to return a user's *public* profile fields also returned fields the user had shared only with friends. Around 500,000 accounts were affected, and Google shut the consumer product down.

\`api.js\` serialises the whole record and lets the caller pick fields.

Fix \`publicProfile\` so it emits only the fields declared public, whatever the caller asks for.`,
    bugReport: `**BUG-GPLUS** · Priority: High (privacy) · Reported by: security

publicProfile(user, requestedFields) must return an object containing only the
requested fields that are ALSO in user.publicFields — anything else is omitted
silently. The result's keys must be in the order given by requestedFields.

Observed: requesting "email" on an account that shares it only with friends
returns the email anyway.`,
    logs: `[api] fields=[name,email] publicFields=[name] -> returned email
[api] 496,951 profiles affected`,
    files: [
      {
        filePath: "src/api/api.js",
        isEditable: true,
        language: "javascript",
        content: `// Returns the caller-requested subset of a profile.
exports.publicProfile = function (user, requestedFields) {
  var out = {};
  for (var i = 0; i < requestedFields.length; i++) {
    var f = requestedFields[i];
    if (user.data.hasOwnProperty(f)) out[f] = user.data[f];
  }
  return out;
};
`,
      },
      {
        filePath: "src/api/MODEL.js",
        isEditable: false,
        language: "javascript",
        content: `/*
user = { data: { ...all fields... }, publicFields: [names] }.
The caller chooses what to ASK for; the server chooses what to ANSWER with.
A field-selection parameter is never an authorisation decision.
*/
`,
      },
    ],
    tests: [
      {
        name: "public fields are returned",
        isHidden: false,
        source: `var p = require("src/api/api").publicProfile;
var user = { data: { name: "Kai", email: "k@example.com" }, publicFields: ["name"] };
assert.equal(p(user, ["name"]), { name: "Kai" });`,
      },
      {
        name: "a non-public field is omitted",
        isHidden: false,
        source: `var p = require("src/api/api").publicProfile;
var user = { data: { name: "Kai", email: "k@example.com" }, publicFields: ["name"] };
assert.equal(p(user, ["name", "email"]), { name: "Kai" }, "asking for a field is not permission to receive it");`,
      },
      {
        name: "an unknown field is ignored",
        isHidden: true,
        source: `var p = require("src/api/api").publicProfile;
var user = { data: { name: "Kai" }, publicFields: ["name", "nickname"] };
assert.equal(p(user, ["nickname", "name"]), { name: "Kai" });`,
      },
      {
        name: "several public fields all come through",
        isHidden: true,
        source: `var p = require("src/api/api").publicProfile;
var user = { data: { name: "Kai", city: "Pune", email: "k@example.com" }, publicFields: ["name", "city"] };
assert.equal(p(user, ["name", "city", "email"]), { name: "Kai", city: "Pune" });`,
      },
    ],
    fixedFiles: {
      "src/api/api.js": `// Returns the caller-requested subset of a profile.
exports.publicProfile = function (user, requestedFields) {
  var out = {};
  for (var i = 0; i < requestedFields.length; i++) {
    var f = requestedFields[i];
    // The caller chooses what to ASK for; the server chooses what to answer
    // with. A field-selection parameter is not an authorisation decision.
    if (user.publicFields.indexOf(f) === -1) continue;
    if (user.data.hasOwnProperty(f)) out[f] = user.data[f];
  }
  return out;
};
`,
    },
  },

  {
    title: "Version 2.3.10 Is Not Older Than 2.3.9",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Versioning"],
    description: `Modelled on the **Equifax breach** (2017), which turned on a known-vulnerable dependency that was never upgraded. A common contributing bug in patch tooling is comparing semantic versions as **strings**, so \`"2.3.10"\` sorts before \`"2.3.9"\` and a patched build is reported as still vulnerable — or worse, an unpatched one as fixed.

\`versions.js\` compares versions lexicographically.

Fix \`isVulnerable\` so versions are compared numerically, component by component.`,
    bugReport: `**BUG-CVE2017-5638** · Priority: Critical · Reported by: security

isVulnerable(installed, fixedIn) must return true when the installed version is
strictly OLDER than fixedIn, comparing "major.minor.patch" numerically.

Observed: string comparison decides that "2.3.10" < "2.3.9", so a fully patched
host is flagged, and "10.0.0" < "9.0.0" leaves a truly vulnerable host unflagged.`,
    logs: `[scan] host web-14 installed=2.3.10 fixedIn=2.3.9 vulnerable=true (wrong)
[scan] host web-22 installed=10.0.0 fixedIn=9.0.0 vulnerable=false (wrong)`,
    files: [
      {
        filePath: "src/scan/versions.js",
        isEditable: true,
        language: "javascript",
        content: `// True when the installed version predates the fix.
exports.isVulnerable = function (installed, fixedIn) {
  return installed < fixedIn;
};
`,
      },
      {
        filePath: "src/scan/SEMVER.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A version is a tuple of numbers, not a string. "2.3.10" has a larger patch
component than "2.3.9" even though it sorts earlier as text. Compare major,
then minor, then patch — each as an integer.
*/
`,
      },
    ],
    tests: [
      {
        name: "an older patch is vulnerable",
        isHidden: false,
        source: `var v = require("src/scan/versions").isVulnerable;
assert.equal(v("2.3.8", "2.3.9"), true);`,
      },
      {
        name: "a double-digit patch is not older",
        isHidden: false,
        source: `var v = require("src/scan/versions").isVulnerable;
assert.equal(v("2.3.10", "2.3.9"), false, "10 is a larger patch than 9");`,
      },
      {
        name: "a double-digit major is not older",
        isHidden: false,
        source: `var v = require("src/scan/versions").isVulnerable;
assert.equal(v("10.0.0", "9.0.0"), false);
assert.equal(v("9.0.0", "10.0.0"), true);`,
      },
      {
        name: "an equal version is not vulnerable",
        isHidden: true,
        source: `var v = require("src/scan/versions").isVulnerable;
assert.equal(v("2.3.9", "2.3.9"), false);
assert.equal(v("2.4.0", "2.3.9"), false);
assert.equal(v("2.2.99", "2.3.0"), true);`,
      },
    ],
    fixedFiles: {
      "src/scan/versions.js": `// True when the installed version predates the fix.
function parts(version) {
  var raw = version.split(".");
  var out = [];
  for (var i = 0; i < 3; i++) {
    out.push(parseInt(raw[i], 10) || 0);
  }
  return out;
}

exports.isVulnerable = function (installed, fixedIn) {
  // A version is a tuple of numbers, not a string: compare component by
  // component, each as an integer.
  var a = parts(installed);
  var b = parts(fixedIn);
  for (var i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
};
`,
    },
  },

  {
    title: "Every Post, One Id at a Time",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Rate Limiting"],
    description: `Modelled on the **Parler scrape** (January 2021): post IDs were sequential, the API required no authentication for reads, and there was no rate limit. A small group enumerated the entire site — roughly 70 TB — in a couple of days.

\`feed.js\` serves any post id to anyone as fast as they can ask.

Fix \`fetchPost\` so unauthenticated callers are refused and each client is rate limited.`,
    bugReport: `**BUG-PARLER** · Priority: Critical · Reported by: platform security

fetchPost(store, postId, session, buckets, limit) must return { status, post }:
- "unauthorized" when session is missing or has no clientId
- "rate-limited" when this client has already made \`limit\` requests
- "not-found" when the post does not exist (this still consumes a request)
- "ok" with the post otherwise

buckets maps clientId -> requests made so far.

Observed: no session is required and no request is counted, so the whole
archive can be walked by incrementing the id.`,
    logs: `[feed] served post 0000000001..0000998211 to one client in 41 minutes
[feed] no session, no throttle, sequential ids`,
    files: [
      {
        filePath: "src/feed/feed.js",
        isEditable: true,
        language: "javascript",
        content: `exports.fetchPost = function (store, postId, session, buckets, limit) {
  var post = store[postId];
  if (!post) return { status: "not-found", post: null };
  return { status: "ok", post: post };
};
`,
      },
      {
        filePath: "src/feed/POLICY.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Sequential identifiers make an archive enumerable, so the read path needs both
an identity and a budget. Count every request that reaches the store — a miss
costs the same as a hit, or the counter becomes a free oracle.
*/
`,
      },
    ],
    tests: [
      {
        name: "an authenticated caller can read a post",
        isHidden: false,
        source: `var f = require("src/feed/feed").fetchPost;
var store = { p1: { id: "p1", body: "hello" } };
var buckets = {};
assert.equal(f(store, "p1", { clientId: "c1" }, buckets, 10), { status: "ok", post: { id: "p1", body: "hello" } });
assert.equal(buckets["c1"], 1);`,
      },
      {
        name: "an anonymous caller is refused",
        isHidden: false,
        source: `var f = require("src/feed/feed").fetchPost;
var store = { p1: { id: "p1", body: "hello" } };
assert.equal(f(store, "p1", null, {}, 10), { status: "unauthorized", post: null });`,
      },
      {
        name: "the budget stops enumeration",
        isHidden: false,
        source: `var f = require("src/feed/feed").fetchPost;
var store = { p1: { id: "p1", body: "hello" } };
var buckets = {};
for (var i = 0; i < 3; i++) f(store, "p1", { clientId: "c1" }, buckets, 3);
assert.equal(f(store, "p1", { clientId: "c1" }, buckets, 3), { status: "rate-limited", post: null });`,
      },
      {
        name: "a miss also consumes budget",
        isHidden: true,
        source: `var f = require("src/feed/feed").fetchPost;
var buckets = {};
assert.equal(f({}, "nope", { clientId: "c1" }, buckets, 5), { status: "not-found", post: null });
assert.equal(buckets["c1"], 1, "a miss must cost the same as a hit");`,
      },
    ],
    fixedFiles: {
      "src/feed/feed.js": `exports.fetchPost = function (store, postId, session, buckets, limit) {
  if (!session || !session.clientId) return { status: "unauthorized", post: null };
  var used = buckets[session.clientId] || 0;
  if (used >= limit) return { status: "rate-limited", post: null };
  // Count every request that reaches the store — a miss must cost the same as
  // a hit, or the counter becomes a free existence oracle.
  buckets[session.clientId] = used + 1;
  var post = store[postId];
  if (!post) return { status: "not-found", post: null };
  return { status: "ok", post: post };
};
`,
    },
  },

  {
    title: "The Unauthenticated Customer Lookup",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Authentication"],
    description: `Modelled on the **Panera Bread exposure** (2018): an ordering API endpoint returned customer names, addresses, birthdays and the last four card digits to anyone who called it — no authentication at all. It stayed open for about eight months after being reported.

\`lookup.js\` answers any query.

Fix \`lookupCustomer\` so it requires a valid API key **and** returns only non-sensitive fields.`,
    bugReport: `**BUG-PANERA** · Priority: Critical · Reported by: security disclosure

lookupCustomer(store, customerId, apiKey, validKeys) must return
{ status, customer }:
- "unauthorized" when apiKey is missing or not in validKeys
- "not-found" when the customer does not exist
- "ok" with ONLY { id, firstName, city } — never the full address, birthday or
  card digits

Observed: any caller gets the complete record.`,
    logs: `[api] GET /customer/8812 apiKey=(none) -> full record incl. cardLast4
[api] endpoint open for 8 months`,
    files: [
      {
        filePath: "src/orders/lookup.js",
        isEditable: true,
        language: "javascript",
        content: `exports.lookupCustomer = function (store, customerId, apiKey, validKeys) {
  var customer = store[customerId];
  if (!customer) return { status: "not-found", customer: null };
  return { status: "ok", customer: customer };
};
`,
      },
      {
        filePath: "src/orders/MODEL.js",
        isEditable: false,
        language: "javascript",
        content: `/*
store maps customerId -> { id, firstName, city, address, birthday, cardLast4 }.
Authenticate first, then return a response built from the fields the endpoint
is meant to expose — never the stored record itself.
*/
`,
      },
    ],
    tests: [
      {
        name: "a valid key returns the safe fields",
        isHidden: false,
        source: `var l = require("src/orders/lookup").lookupCustomer;
var store = { c1: { id: "c1", firstName: "Kai", city: "Pune", address: "12 Elm St", birthday: "1994-02-11", cardLast4: "4417" } };
assert.equal(l(store, "c1", "key-a", ["key-a"]), { status: "ok", customer: { id: "c1", firstName: "Kai", city: "Pune" } });`,
      },
      {
        name: "no key means no data",
        isHidden: false,
        source: `var l = require("src/orders/lookup").lookupCustomer;
var store = { c1: { id: "c1", firstName: "Kai", city: "Pune", address: "12 Elm St", birthday: "1994-02-11", cardLast4: "4417" } };
assert.equal(l(store, "c1", null, ["key-a"]), { status: "unauthorized", customer: null });
assert.equal(l(store, "c1", "wrong", ["key-a"]), { status: "unauthorized", customer: null });`,
      },
      {
        name: "sensitive fields never leave",
        isHidden: false,
        source: `var l = require("src/orders/lookup").lookupCustomer;
var store = { c1: { id: "c1", firstName: "Kai", city: "Pune", address: "12 Elm St", birthday: "1994-02-11", cardLast4: "4417" } };
var out = l(store, "c1", "key-a", ["key-a"]);
var dumped = JSON.stringify(out);
assert.ok(dumped.indexOf("4417") === -1, "card digits must not be returned");
assert.ok(dumped.indexOf("Elm St") === -1, "the address must not be returned");`,
      },
      {
        name: "a missing customer is a 404 for a valid key",
        isHidden: true,
        source: `var l = require("src/orders/lookup").lookupCustomer;
assert.equal(l({}, "nope", "key-a", ["key-a"]), { status: "not-found", customer: null });`,
      },
    ],
    fixedFiles: {
      "src/orders/lookup.js": `exports.lookupCustomer = function (store, customerId, apiKey, validKeys) {
  // Authenticate first...
  if (!apiKey || validKeys.indexOf(apiKey) === -1) {
    return { status: "unauthorized", customer: null };
  }
  var customer = store[customerId];
  if (!customer) return { status: "not-found", customer: null };
  // ...then build the response from the fields this endpoint is meant to
  // expose, rather than handing back the stored record.
  return {
    status: "ok",
    customer: { id: customer.id, firstName: customer.firstName, city: customer.city }
  };
};
`,
    },
  },

  // ── END WAVE13 ──
];
