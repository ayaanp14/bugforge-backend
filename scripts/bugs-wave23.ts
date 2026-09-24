/**
 * Wave 23 — documented incidents at named companies and projects (see the
 * header of bugs-wave13.ts for the Node 12 rules). Each challenge plants a
 * reconstruction of the real defect; the tests encode the correct behaviour.
 */
import type { BugSpec } from "./bugs-data.js";

export const WAVE23: BugSpec[] = [

  {
    title: "Random Routing, Idle Dynos",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Networking", "Concurrency", "Limits"],
    description: `Modelled on **Heroku's routing layer, February 2013**. Rap Genius published an analysis showing that Heroku's router was assigning requests to dynos **at random** rather than to dynos that were free. Single-threaded dynos (a typical Rails app of the time) queued requests behind slow ones while other dynos sat idle, and the queueing time did not show up where customers were looking. Heroku acknowledged the behaviour and that its documentation had not reflected it.

This project is a reconstruction: \`Router.route\` picks a dyno from the pool using a random number.

Fix \`route\` so each request goes to the least-loaded dyno, deterministically.`,
    bugReport: `**BUG-ROUTER-1302** · Priority: High · Reported by: platform customer (latency analysis)

Router.route(dynos) must:
- return the dyno with the FEWEST in-flight requests (Dyno.inFlight)
- break ties by list order: the earliest dyno in the list wins
- increment the chosen dyno's inFlight by one
- throw IllegalStateException for an empty list
The router's random source must not influence the choice.

Observed: requests land on dynos already working through a queue while
other dynos report zero in-flight requests.`,
    logs: `[router] at=info path=/songs/42 dyno=web.1 queue=3 service=2104ms
[router] at=info dyno=web.2 queue=0 (idle 41s)
[router] at=info path=/artists dyno=web.1 queue=4 service=2388ms`,
    files: [
      {
        filePath: "src/router/Router.java",
        isEditable: true,
        language: "java",
        content: `class Router {
    private final SeqRng rng;

    Router(SeqRng rng) {
        this.rng = rng;
    }

    Dyno route(List<Dyno> dynos) {
        if (dynos.isEmpty()) throw new IllegalStateException("no dynos");
        Dyno pick = dynos.get(Math.floorMod(rng.next(), dynos.size()));
        pick.inFlight++;
        return pick;
    }
}`,
      },
      {
        filePath: "src/router/Dyno.java",
        isEditable: false,
        language: "java",
        content: `// A dyno runs one request at a time; everything else it is handed queues.
class Dyno {
    final String id;
    int inFlight;

    Dyno(String id, int inFlight) {
        this.id = id;
        this.inFlight = inFlight;
    }
}

interface SeqRng {
    int next();
}

// Deterministic stand-in for the router's random source.
class FixedSeq implements SeqRng {
    private final int[] values;
    private int i = 0;

    FixedSeq(int... values) {
        this.values = values;
    }

    public int next() {
        int v = values[i % values.length];
        i++;
        return v;
    }
}`,
      },
    ],
    tests: [
      {
        name: "a lone dyno takes the request",
        isHidden: false,
        source: `Router r = new Router(new FixedSeq(7));
List<Dyno> d = new ArrayList<>(Arrays.asList(new Dyno("web.1", 0)));
BugAssert.equal(r.route(d).id, "web.1", "the only dyno");
BugAssert.equal(d.get(0).inFlight, 1, "in-flight count goes up");`,
      },
      {
        name: "an idle dyno beats a busy one",
        isHidden: false,
        source: `Router r = new Router(new FixedSeq(0));
List<Dyno> d = new ArrayList<>(Arrays.asList(new Dyno("web.1", 3), new Dyno("web.2", 0), new Dyno("web.3", 2)));
BugAssert.equal(r.route(d).id, "web.2", "the idle dyno must get the request");`,
      },
      {
        name: "ties go to the first dyno in the list",
        isHidden: true,
        source: `Router r = new Router(new FixedSeq(2));
List<Dyno> d = new ArrayList<>(Arrays.asList(new Dyno("web.1", 1), new Dyno("web.2", 1), new Dyno("web.3", 1)));
BugAssert.equal(r.route(d).id, "web.1");`,
      },
      {
        name: "a burst spreads across idle dynos",
        isHidden: true,
        source: `Router r = new Router(new FixedSeq(0));
List<Dyno> d = new ArrayList<>(Arrays.asList(new Dyno("web.1", 0), new Dyno("web.2", 0)));
String seen = "";
for (int i = 0; i < 4; i++) seen += r.route(d).id + ",";
BugAssert.equal(seen, "web.1,web.2,web.1,web.2,", "each request goes to the least-loaded dyno");`,
      },
      {
        name: "an empty pool is an error",
        isHidden: true,
        source: `Router r = new Router(new FixedSeq(0));
boolean threw = false;
try {
    r.route(new ArrayList<Dyno>());
} catch (IllegalStateException e) {
    threw = true;
}
BugAssert.ok(threw, "IllegalStateException expected");`,
      },
    ],
    fixedFiles: {
      "src/router/Router.java": `class Router {
    private final SeqRng rng;

    Router(SeqRng rng) {
        this.rng = rng;
    }

    Dyno route(List<Dyno> dynos) {
        if (dynos.isEmpty()) throw new IllegalStateException("no dynos");
        // A single-threaded dyno queues everything it is handed, so a random
        // pick parks requests behind slow ones while other dynos idle. Send the
        // request to the least-loaded dyno; the first in the list wins a tie so
        // the choice is deterministic.
        Dyno pick = dynos.get(0);
        for (Dyno d : dynos) {
            if (d.inFlight < pick.inFlight) pick = d;
        }
        pick.inFlight++;
        return pick;
    }
}`,
    },
  },

  {
    title: "Two Files Named classes.dex",
    difficulty: "medium",
    category: "backend",
    language: "java",
    tags: ["Security", "Validation", "Parsing"],
    description: `Modelled on the **Android "Master Key" vulnerability** disclosed by Bluebox Security in July 2013 (Android bug 8219321). An APK is a ZIP archive, and a ZIP can hold **two entries with the same name**. The signature check and the installer resolved the duplicate name to *different* entries, so a signed app could carry modified code without its signature failing. Google shipped a fix to device makers that rejects such archives.

In this reconstruction the verifier keeps the first entry of each name while the installer (locked) keeps the last.

Fix \`ApkVerifier.verify\` so the two can never disagree.`,
    bugReport: `**BUG-8219321** · Priority: Critical · Reported by: security research

ApkVerifier.verify(entries, signed) returns true only if ALL hold:
- no two entries share a name (any duplicate name, even with identical
  content, makes the package invalid)
- the set of entry names equals the set of names in the signed manifest
- every entry's Digest.of(data) equals its signed digest

Observed: a package with the original classes.dex followed by a second,
modified classes.dex verifies — and the installer unpacks the modified one.`,
    logs: `[pm] verify com.example.app: signatures OK (2 entries checked)
[pm] install com.example.app: classes.dex sha:1c4f9e02 (not the signed digest)`,
    files: [
      {
        filePath: "src/pm/ApkVerifier.java",
        isEditable: true,
        language: "java",
        content: `class ApkVerifier {
    static boolean verify(List<ApkEntry> entries, Map<String, String> signed) {
        Map<String, ApkEntry> byName = new LinkedHashMap<>();
        for (ApkEntry e : entries) {
            if (!byName.containsKey(e.name)) byName.put(e.name, e);
        }
        if (!byName.keySet().equals(signed.keySet())) return false;
        for (ApkEntry e : byName.values()) {
            if (!Digest.of(e.data).equals(signed.get(e.name))) return false;
        }
        return true;
    }
}`,
      },
      {
        filePath: "src/pm/ApkEntry.java",
        isEditable: false,
        language: "java",
        content: `class ApkEntry {
    final String name;
    final String data;

    ApkEntry(String name, String data) {
        this.name = name;
        this.data = data;
    }
}

class Digest {
    static String of(String data) {
        return "sha:" + Integer.toHexString(data.hashCode());
    }
}

// The installer unpacks entries in archive order; a later entry with the same
// name replaces an earlier one.
class Installer {
    static Map<String, String> extract(List<ApkEntry> entries) {
        Map<String, String> out = new LinkedHashMap<>();
        for (ApkEntry e : entries) out.put(e.name, e.data);
        return out;
    }
}`,
      },
    ],
    tests: [
      {
        name: "an untouched package verifies",
        isHidden: false,
        source: `Map<String, String> signed = new HashMap<>();
signed.put("AndroidManifest.xml", Digest.of("<manifest/>"));
signed.put("classes.dex", Digest.of("original code"));
List<ApkEntry> apk = new ArrayList<>();
apk.add(new ApkEntry("AndroidManifest.xml", "<manifest/>"));
apk.add(new ApkEntry("classes.dex", "original code"));
BugAssert.ok(ApkVerifier.verify(apk, signed), "a signed package must verify");`,
      },
      {
        name: "a second classes.dex after the signed one is rejected",
        isHidden: false,
        source: `Map<String, String> signed = new HashMap<>();
signed.put("AndroidManifest.xml", Digest.of("<manifest/>"));
signed.put("classes.dex", Digest.of("original code"));
List<ApkEntry> apk = new ArrayList<>();
apk.add(new ApkEntry("AndroidManifest.xml", "<manifest/>"));
apk.add(new ApkEntry("classes.dex", "original code"));
apk.add(new ApkEntry("classes.dex", "patched code"));
BugAssert.equal(Installer.extract(apk).get("classes.dex"), "patched code", "the installer takes the last copy");
BugAssert.ok(!ApkVerifier.verify(apk, signed), "duplicate names must fail verification");`,
      },
      {
        name: "a modified entry fails its digest",
        isHidden: true,
        source: `Map<String, String> signed = new HashMap<>();
signed.put("classes.dex", Digest.of("original code"));
List<ApkEntry> apk = new ArrayList<>();
apk.add(new ApkEntry("classes.dex", "patched code"));
BugAssert.ok(!ApkVerifier.verify(apk, signed));`,
      },
      {
        name: "even identical duplicates are rejected",
        isHidden: true,
        source: `Map<String, String> signed = new HashMap<>();
signed.put("classes.dex", Digest.of("original code"));
List<ApkEntry> apk = new ArrayList<>();
apk.add(new ApkEntry("classes.dex", "original code"));
apk.add(new ApkEntry("classes.dex", "original code"));
BugAssert.ok(!ApkVerifier.verify(apk, signed), "any duplicate name is invalid");`,
      },
      {
        name: "a missing or unsigned entry fails",
        isHidden: true,
        source: `Map<String, String> signed = new HashMap<>();
signed.put("AndroidManifest.xml", Digest.of("<manifest/>"));
signed.put("classes.dex", Digest.of("original code"));
List<ApkEntry> missing = new ArrayList<>();
missing.add(new ApkEntry("classes.dex", "original code"));
BugAssert.ok(!ApkVerifier.verify(missing, signed), "missing manifest entry");
List<ApkEntry> extra = new ArrayList<>();
extra.add(new ApkEntry("AndroidManifest.xml", "<manifest/>"));
extra.add(new ApkEntry("classes.dex", "original code"));
extra.add(new ApkEntry("lib/evil.so", "x"));
BugAssert.ok(!ApkVerifier.verify(extra, signed), "unsigned extra entry");`,
      },
    ],
    fixedFiles: {
      "src/pm/ApkVerifier.java": `class ApkVerifier {
    static boolean verify(List<ApkEntry> entries, Map<String, String> signed) {
        Map<String, ApkEntry> byName = new LinkedHashMap<>();
        for (ApkEntry e : entries) {
            // The installer keeps the last entry of a name and this check would
            // see only one of them: with duplicates the two can disagree about
            // what "classes.dex" is. There is no safe copy to pick — refuse.
            if (byName.containsKey(e.name)) return false;
            byName.put(e.name, e);
        }
        if (!byName.keySet().equals(signed.keySet())) return false;
        for (ApkEntry e : byName.values()) {
            if (!Digest.of(e.data).equals(signed.get(e.name))) return false;
        }
        return true;
    }
}`,
    },
  },

  {
    title: "The Folder Called .GIT",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Validation", "Unicode"],
    description: `Modelled on **Git CVE-2014-9390** (December 2014). Git refused to check out a tree entry named \`.git\`, but compared the name exactly. On case-insensitive filesystems — Windows and macOS by default — a malicious repository could ship \`.Git/config\` or \`.GIT/config\`, and checking it out **overwrote the repository's own configuration**, which can lead to arbitrary command execution. Fixed Git releases compare the way the filesystem does (and also reject names that HFS+ treats as equivalent).

This reconstruction's \`verify_path\` blocks only the exact spelling.

Fix \`verify_path\` so no spelling of \`.git\` passes.`,
    bugReport: `**BUG-CVE-2014-9390** · Priority: Critical · Reported by: security

verify_path(path) returns False when ANY of these hold, True otherwise:
- path is empty or starts with "/"
- a component (split on "/") is empty, "." or ".."
- a component equals ".git" compared case-insensitively
  (".GIT", ".Git", ".gIt" … at any depth)
Names that merely start with .git (".gitignore", ".github") are fine.
checkout() validates every path before writing any file.

Observed: cloning a repository containing .Git/config on a Mac replaced
.git/config with the repository's copy.`,
    logs: `[checkout] writing .Git/config (fs: case-insensitive)
[checkout] .git/config modified by checkout`,
    files: [
      {
        filePath: "src/checkout/paths.py",
        isEditable: true,
        language: "python",
        content: `BLOCKED = ("", ".", "..", ".git")


def verify_path(path):
    if path == "" or path.startswith("/"):
        return False
    for part in path.split("/"):
        if part in BLOCKED:
            return False
    return True
`,
      },
      {
        filePath: "src/checkout/checkout.py",
        isEditable: false,
        language: "python",
        content: `paths = bug_require("./paths.py")


def checkout(tree, fs):
    # Validate the whole tree first: a refused tree writes nothing.
    for path in sorted(tree):
        if not paths.verify_path(path):
            raise ValueError("refusing to check out " + path)
    for path in sorted(tree):
        fs.write(path, tree[path])
`,
      },
      {
        filePath: "src/checkout/fs.py",
        isEditable: false,
        language: "python",
        content: `# A case-insensitive filesystem, like NTFS or default HFS+/APFS:
# "README", "readme" and "ReadMe" are the same file.


class CaseInsensitiveFS:
    def __init__(self, files=None):
        self.files = {}
        for k, v in (files or {}).items():
            self.write(k, v)

    def write(self, path, data):
        self.files[path.lower()] = data

    def read(self, path):
        return self.files.get(path.lower())
`,
      },
    ],
    tests: [
      {
        name: "ordinary paths are allowed",
        isHidden: false,
        source: `p = bug_require("src/checkout/paths.py")
assert_.ok(p.verify_path("src/main.c"))
assert_.ok(p.verify_path("docs/.gitignore"), ".gitignore is a normal file")
assert_.ok(p.verify_path(".github/workflows/ci.yml"))
assert_.ok(not p.verify_path(".git/config"), "the exact spelling is blocked")`,
      },
      {
        name: "other spellings of .git are blocked",
        isHidden: false,
        source: `p = bug_require("src/checkout/paths.py")
assert_.ok(not p.verify_path(".GIT/config"), ".GIT")
assert_.ok(not p.verify_path(".Git/config"), ".Git")`,
      },
      {
        name: ".git is blocked at any depth",
        isHidden: true,
        source: `p = bug_require("src/checkout/paths.py")
assert_.ok(not p.verify_path("vendor/lib/.gIt/hooks/post-checkout"))`,
      },
      {
        name: "a malicious tree leaves the repo config untouched",
        isHidden: true,
        source: `co = bug_require("src/checkout/checkout.py")
fsm = bug_require("src/checkout/fs.py")
fs = fsm.CaseInsensitiveFS({".git/config": "[core] bare = false"})
tree = {"README": "hi", ".Git/config": "[core] replaced"}
assert_.throws(lambda: co.checkout(tree, fs), "the tree must be refused")
assert_.equal(fs.read(".git/config"), "[core] bare = false")
assert_.equal(fs.read("README"), None, "a refused tree writes nothing")`,
      },
      {
        name: "traversal and malformed paths are refused",
        isHidden: true,
        source: `p = bug_require("src/checkout/paths.py")
assert_.ok(not p.verify_path("../x"))
assert_.ok(not p.verify_path("a//b"))
assert_.ok(not p.verify_path("/etc/passwd"))
assert_.ok(not p.verify_path(""))`,
      },
    ],
    fixedFiles: {
      "src/checkout/paths.py": `BLOCKED = ("", ".", "..")


def verify_path(path):
    if path == "" or path.startswith("/"):
        return False
    for part in path.split("/"):
        if part in BLOCKED:
            return False
        # On a case-insensitive filesystem ".GIT" and ".Git" ARE ".git", so a
        # tree entry spelled that way writes into the repository's own
        # metadata. Compare the way the filesystem does, not byte for byte.
        if part.lower() == ".git":
            return False
    return True
`,
    },
  },

  {
    title: "The Dotless I in Istanbul",
    difficulty: "easy",
    category: "backend",
    language: "java",
    tags: ["Unicode", "Parsing", "Config"],
    description: `Modelled on the **"Turkey test"**, a long-documented Java pitfall: \`String.toUpperCase()\` and \`toLowerCase()\` without an argument use the JVM's **default locale**, and in Turkish the lowercase \`i\` uppercases to a dotted \`İ\` while \`I\` lowercases to a dotless \`ı\`. Code that matches keywords or identifiers this way works everywhere until it runs on a machine configured for Turkish — then \`"limit".toUpperCase()\` is no longer \`"LIMIT"\`. The standard fix is to pass \`Locale.ROOT\` for machine-readable text.

Here the production hosts' default locale is modelled by \`ServerLocale.DEFAULT\`, and the SQL keyword matcher uses it.

Fix \`SqlKeywords\` so keyword and identifier handling is locale-independent.`,
    bugReport: `**BUG-TR-0142** · Priority: High · Reported by: Istanbul office

SqlKeywords.isKeyword(word) is true iff the word, uppercased
locale-independently (ASCII rules), is in KEYWORDS — for any casing:
"limit", "Limit", "LIMIT", "distinct", "like", "in", "into".
normalizeIdentifier(name) lowercases locale-independently:
"TITLE" -> "title", "ID" -> "id".
Words that are not keywords ("users", "limits", "selection") are not.

Observed: on the tr_TR hosts every query using LIMIT, DISTINCT, LIKE, IN or
INTO fails to parse, and the column "TITLE" is looked up as "tıtle".`,
    logs: `[sql] host=db-ist-2 user.language=tr
[sql] parse error near "limit": expected keyword, got identifier "LİMİT"
[sql] unknown column "tıtle"`,
    files: [
      {
        filePath: "src/sql/SqlKeywords.java",
        isEditable: true,
        language: "java",
        content: `class SqlKeywords {
    static final Set<String> KEYWORDS = new HashSet<>(Arrays.asList(
        "SELECT", "FROM", "WHERE", "INSERT", "INTO", "LIMIT", "DISTINCT", "LIKE", "IN", "ORDER", "BY"));

    static boolean isKeyword(String word) {
        return KEYWORDS.contains(word.toUpperCase(ServerLocale.DEFAULT));
    }

    static String normalizeIdentifier(String name) {
        return name.toLowerCase(ServerLocale.DEFAULT);
    }
}`,
      },
      {
        filePath: "src/sql/ServerLocale.java",
        isEditable: false,
        language: "java",
        content: `// The default locale of the production JVMs in the Istanbul region
// (-Duser.language=tr -Duser.country=TR). A bare toUpperCase() or
// toLowerCase() on those hosts behaves exactly like passing this.
class ServerLocale {
    static final Locale DEFAULT = new Locale("tr", "TR");
}`,
      },
    ],
    tests: [
      {
        name: "plain keywords match in any case",
        isHidden: false,
        source: `BugAssert.ok(SqlKeywords.isKeyword("select"), "select");
BugAssert.ok(SqlKeywords.isKeyword("From"), "From");
BugAssert.ok(!SqlKeywords.isKeyword("users"), "users is not a keyword");`,
      },
      {
        name: "keywords containing i match",
        isHidden: false,
        source: `BugAssert.ok(SqlKeywords.isKeyword("limit"), "limit");
BugAssert.ok(SqlKeywords.isKeyword("distinct"), "distinct");`,
      },
      {
        name: "LIKE, IN and INTO match",
        isHidden: true,
        source: `BugAssert.ok(SqlKeywords.isKeyword("like"), "like");
BugAssert.ok(SqlKeywords.isKeyword("in"), "in");
BugAssert.ok(SqlKeywords.isKeyword("Into"), "Into");`,
      },
      {
        name: "identifiers lowercase with ASCII rules",
        isHidden: true,
        source: `BugAssert.equal(SqlKeywords.normalizeIdentifier("TITLE"), "title");
BugAssert.equal(SqlKeywords.normalizeIdentifier("ID"), "id");`,
      },
      {
        name: "near-keywords are still identifiers",
        isHidden: true,
        source: `BugAssert.ok(!SqlKeywords.isKeyword("limits"), "limits");
BugAssert.ok(!SqlKeywords.isKeyword("selection"), "selection");`,
      },
    ],
    fixedFiles: {
      "src/sql/SqlKeywords.java": `class SqlKeywords {
    static final Set<String> KEYWORDS = new HashSet<>(Arrays.asList(
        "SELECT", "FROM", "WHERE", "INSERT", "INTO", "LIMIT", "DISTINCT", "LIKE", "IN", "ORDER", "BY"));

    // Keywords and identifiers are machine text, not prose: case-map them with
    // Locale.ROOT. Under the host's Turkish locale "i" uppercases to a dotted
    // capital and "I" lowercases to a dotless i, so "limit" never equalled LIMIT.
    static boolean isKeyword(String word) {
        return KEYWORDS.contains(word.toUpperCase(Locale.ROOT));
    }

    static String normalizeIdentifier(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}`,
    },
  },

  {
    title: "Nobody Left to Fly Christmas",
    difficulty: "easy",
    category: "backend",
    language: "python",
    tags: ["Validation", "State", "Time"],
    description: `Modelled on **American Airlines, November 2017**. A glitch in the airline's pilot scheduling system let pilots drop trips over the December holiday period, and thousands of flights — reportedly around 15,000 — ended up without a pilot assigned. The airline said it would pay pilots extra to pick the trips back up. The precise root cause was not published.

This reconstruction models the failure as a trip-drop request that is approved whenever the pilot is on the trip, without checking what the trip is left with.

Fix \`request_drop\` so no approval leaves a trip under its minimum crew.`,
    bugReport: `**BUG-CREW-1712** · Priority: Critical · Reported by: crew scheduling

request_drop(schedule, trip_id, pilot) returns True and removes the pilot
from schedule[trip_id]["assigned"] ONLY if:
- the trip exists
- the pilot is currently assigned to it
- after removal the trip still has at least rules.min_crew(trip) pilots
Otherwise it returns False and leaves the schedule unchanged.

Observed: drops on fully-staffed December trips were approved, leaving
those trips with fewer pilots than they need.`,
    logs: `[crew] drop approved trip=AA1217 pilot=P-4410 assigned=1 required=2
[crew] drop approved trip=AA1217 pilot=P-2981 assigned=0 required=2
[crew] 2017-12 open trips without crew: rising`,
    files: [
      {
        filePath: "src/crew/drops.py",
        isEditable: true,
        language: "python",
        content: `rules = bug_require("./rules.py")


def request_drop(schedule, trip_id, pilot):
    trip = schedule.get(trip_id)
    if trip is None:
        return False
    if pilot not in trip["assigned"]:
        return False
    trip["assigned"].remove(pilot)
    return True
`,
      },
      {
        filePath: "src/crew/rules.py",
        isEditable: false,
        language: "python",
        content: `# Coverage rules from the crew-scheduling contract.
# Every trip carries a "required" crew count, and the system may never approve
# a change that leaves a trip below it. Reserve pilots are assigned by a
# different process that is not modelled here.


def min_crew(trip):
    return trip["required"]
`,
      },
    ],
    tests: [
      {
        name: "a drop from an overstaffed trip is approved",
        isHidden: false,
        source: `d = bug_require("src/crew/drops.py")
s = {"AA100": {"required": 2, "assigned": ["P1", "P2", "P3"]}}
assert_.equal(d.request_drop(s, "AA100", "P3"), True)
assert_.equal(s["AA100"]["assigned"], ["P1", "P2"])`,
      },
      {
        name: "a drop that would leave the trip short is denied",
        isHidden: false,
        source: `d = bug_require("src/crew/drops.py")
s = {"AA1217": {"required": 2, "assigned": ["P1", "P2"]}}
assert_.equal(d.request_drop(s, "AA1217", "P1"), False, "the trip needs both pilots")
assert_.equal(s["AA1217"]["assigned"], ["P1", "P2"], "the schedule must be unchanged")`,
      },
      {
        name: "a pilot not on the trip or an unknown trip is denied",
        isHidden: true,
        source: `d = bug_require("src/crew/drops.py")
s = {"AA100": {"required": 1, "assigned": ["P1", "P2"]}}
assert_.equal(d.request_drop(s, "AA100", "P9"), False)
assert_.equal(d.request_drop(s, "AA999", "P1"), False)
assert_.equal(s["AA100"]["assigned"], ["P1", "P2"])`,
      },
      {
        name: "a run of drops stops at the minimum crew",
        isHidden: true,
        source: `d = bug_require("src/crew/drops.py")
s = {"AA300": {"required": 2, "assigned": ["P1", "P2", "P3", "P4"]}}
got = [d.request_drop(s, "AA300", p) for p in ["P4", "P3", "P2"]]
assert_.equal(got, [True, True, False])
assert_.equal(s["AA300"]["assigned"], ["P1", "P2"])`,
      },
    ],
    fixedFiles: {
      "src/crew/drops.py": `rules = bug_require("./rules.py")


def request_drop(schedule, trip_id, pilot):
    trip = schedule.get(trip_id)
    if trip is None:
        return False
    if pilot not in trip["assigned"]:
        return False
    # Approving a drop is only safe if the trip is still covered afterwards;
    # checking that the pilot was on the trip says nothing about who flies it.
    if len(trip["assigned"]) - 1 < rules.min_crew(trip):
        return False
    trip["assigned"].remove(pilot)
    return True
`,
    },
  },

  {
    title: "The Backup That Never Took Over",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Config", "Retries"],
    description: `Modelled on the **Tokyo Stock Exchange outage of 1 October 2020**. A memory device in the exchange's trading system failed, and the automatic switch to the backup that should have followed **did not happen** — TSE and its vendor Fujitsu later attributed that to a setting. The exchange suspended trading in every listed stock for the whole day.

This reconstruction's fault monitor looks up a failover mode per fault kind in the operations team's settings, and falls back to halting when it finds none.

Fix \`handleFault\` so each fault kind reads the setting that was actually written for it.`,
    bugReport: `**BUG-ARW-1001** · Priority: Critical · Reported by: market operations

handleFault(fault, settings, cluster) looks up the failover mode for the
fault's kind in settings.failover (keys as written in settings.js):
  DISK_FAULT -> "disk", MEM_FAULT -> "memory-device",
  NET_FAULT -> "network", PWR_FAULT -> "power"
- mode "auto" and a standby exists: active = standby, standby = null,
  return { action: "failed-over", active: <new active> }
- otherwise ("manual", no setting, unknown fault code, or no standby):
  cluster.halted = true, return { action: "halted", active: <unchanged> }

Observed: a memory-device fault halted the whole market although the
settings say "memory-device": "auto".`,
    logs: `[arrowhead] 07:04:12 fault code=MEM_FAULT node=node-a
[arrowhead] 07:04:12 failover mode=manual (no setting found) -> HALT
[arrowhead] 07:04:13 trading suspended: all issues`,
    files: [
      {
        filePath: "src/arrowhead/monitor.js",
        isEditable: true,
        language: "javascript",
        content: `var FAULT_SETTING = {
  DISK_FAULT: "disk",
  MEM_FAULT: "memory",
  NET_FAULT: "network",
  PWR_FAULT: "power"
};

exports.handleFault = function (fault, settings, cluster) {
  var mode = settings.failover[FAULT_SETTING[fault.code]] || "manual";
  if (mode === "auto" && cluster.standby) {
    cluster.active = cluster.standby;
    cluster.standby = null;
    return { action: "failed-over", active: cluster.active };
  }
  cluster.halted = true;
  return { action: "halted", active: cluster.active };
};
`,
      },
      {
        filePath: "src/arrowhead/settings.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Production failover settings, owned by the operations team. Each fault kind
maps to "auto" (switch to the standby at once) or "manual" (halt and wait for
an operator). A kind missing from this table is treated as "manual".
*/
exports.PRODUCTION = {
  failover: {
    "disk": "auto",
    "memory-device": "auto",
    "network": "auto",
    "power": "manual"
  }
};
`,
      },
    ],
    tests: [
      {
        name: "a disk fault fails over",
        isHidden: false,
        source: `var m = require("src/arrowhead/monitor");
var s = require("src/arrowhead/settings").PRODUCTION;
var c = { active: "node-a", standby: "node-b", halted: false };
assert.equal(m.handleFault({ code: "DISK_FAULT" }, s, c), { action: "failed-over", active: "node-b" });`,
      },
      {
        name: "a memory-device fault fails over",
        isHidden: false,
        source: `var m = require("src/arrowhead/monitor");
var s = require("src/arrowhead/settings").PRODUCTION;
var c = { active: "node-a", standby: "node-b", halted: false };
assert.equal(m.handleFault({ code: "MEM_FAULT" }, s, c), { action: "failed-over", active: "node-b" }, "the setting says auto");
assert.equal(c.halted, false, "the market must keep trading");`,
      },
      {
        name: "a manual setting halts",
        isHidden: true,
        source: `var m = require("src/arrowhead/monitor");
var s = require("src/arrowhead/settings").PRODUCTION;
var c = { active: "node-a", standby: "node-b", halted: false };
assert.equal(m.handleFault({ code: "PWR_FAULT" }, s, c), { action: "halted", active: "node-a" });
assert.equal(c.halted, true);`,
      },
      {
        name: "no standby or an unknown fault halts",
        isHidden: true,
        source: `var m = require("src/arrowhead/monitor");
var s = require("src/arrowhead/settings").PRODUCTION;
var c = { active: "node-a", standby: null, halted: false };
assert.equal(m.handleFault({ code: "MEM_FAULT" }, s, c), { action: "halted", active: "node-a" }, "nothing to fail over to");
var c2 = { active: "node-a", standby: "node-b", halted: false };
assert.equal(m.handleFault({ code: "FAN_FAULT" }, s, c2), { action: "halted", active: "node-a" }, "unknown kinds are manual");`,
      },
      {
        name: "a network fault fails over and uses up the standby",
        isHidden: true,
        source: `var m = require("src/arrowhead/monitor");
var s = require("src/arrowhead/settings").PRODUCTION;
var c = { active: "node-a", standby: "node-b", halted: false };
m.handleFault({ code: "NET_FAULT" }, s, c);
assert.equal(c.standby, null);
assert.equal(m.handleFault({ code: "MEM_FAULT" }, s, c), { action: "halted", active: "node-b" });`,
      },
    ],
    fixedFiles: {
      "src/arrowhead/monitor.js": `// Keys must match settings.js exactly: a lookup that misses falls back to
// "manual", so a misspelt key silently turns failover off for that fault kind.
var FAULT_SETTING = {
  DISK_FAULT: "disk",
  MEM_FAULT: "memory-device",
  NET_FAULT: "network",
  PWR_FAULT: "power"
};

exports.handleFault = function (fault, settings, cluster) {
  var mode = settings.failover[FAULT_SETTING[fault.code]] || "manual";
  if (mode === "auto" && cluster.standby) {
    cluster.active = cluster.standby;
    cluster.standby = null;
    return { action: "failed-over", active: cluster.active };
  }
  cluster.halted = true;
  return { action: "halted", active: cluster.active };
};
`,
    },
  },

  {
    title: "The Reset Mail Sent to a Look-Alike",
    difficulty: "medium",
    category: "backend",
    language: "python",
    tags: ["Security", "Unicode", "Auth"],
    description: `Modelled on **Django CVE-2019-19844** (December 2019). Django's password-reset form found accounts with a case-insensitive database lookup, and Unicode case mapping lets **different strings compare equal** — a dotless \`ı\` uppercases to a plain \`I\`. The form then mailed the reset link to the address **as typed**, not the address on the account, so an attacker could request a reset for a look-alike of a victim's email and receive the victim's reset token. The fix sends mail only to the stored address and re-checks the match with Unicode normalisation and case folding.

This reconstruction's \`send_reset\` has both halves of the original bug.

Fix \`send_reset\`.`,
    bugReport: `**BUG-CVE-2019-19844** · Priority: Critical (account takeover) · Reported by: security

send_reset(email, users, outbox) appends one message per matching ACTIVE
account, of the form {"to": <the account's stored email>, "username": ...}.
- candidates come from db.users_with_email_iexact (the database lookup)
- a candidate only matches if NFKC-normalised + casefolded, the typed
  address equals the stored one (so "MIKE@Example.ORG" matches
  "mike@example.org", but "mıke@example.org" with a dotless i does not)
- mail never goes to the typed address; unknown or inactive accounts get
  nothing

Observed: a reset for a look-alike address was delivered to the attacker's
mailbox carrying a valid token for the victim's account.`,
    logs: `[reset] lookup email__iexact="mıke@example.org" -> user mike
[reset] sent reset link for user=mike to=mıke@example.org`,
    files: [
      {
        filePath: "src/accounts/reset.py",
        isEditable: true,
        language: "python",
        content: `db = bug_require("./db.py")


def send_reset(email, users, outbox):
    for user in db.users_with_email_iexact(users, email):
        if not user["active"]:
            continue
        outbox.append({"to": email, "username": user["username"]})
`,
      },
      {
        filePath: "src/accounts/db.py",
        isEditable: false,
        language: "python",
        content: `# Stand-in for the ORM's email__iexact lookup. The database compares with
# Unicode case mapping, so two different strings can compare equal.


def users_with_email_iexact(users, email):
    key = email.upper()
    return [u for u in users if u["email"].upper() == key]
`,
      },
    ],
    tests: [
      {
        name: "the account's own address gets the link",
        isHidden: false,
        source: `r = bug_require("src/accounts/reset.py")
users = [{"username": "mike", "email": "mike@example.org", "active": True}]
out = []
r.send_reset("mike@example.org", users, out)
assert_.equal(out, [{"to": "mike@example.org", "username": "mike"}])`,
      },
      {
        name: "a dotless-i look-alike gets nothing",
        isHidden: false,
        source: `r = bug_require("src/accounts/reset.py")
users = [{"username": "mike", "email": "mike@example.org", "active": True}]
out = []
r.send_reset(u"m\\u0131ke@example.org", users, out)
assert_.equal(out, [], "the look-alike is not the account's address")`,
      },
      {
        name: "a different case is sent to the stored spelling",
        isHidden: true,
        source: `r = bug_require("src/accounts/reset.py")
users = [{"username": "mike", "email": "mike@example.org", "active": True}]
out = []
r.send_reset("MIKE@Example.ORG", users, out)
assert_.equal(out, [{"to": "mike@example.org", "username": "mike"}])`,
      },
      {
        name: "unknown addresses get nothing",
        isHidden: true,
        source: `r = bug_require("src/accounts/reset.py")
users = [{"username": "mike", "email": "mike@example.org", "active": True}]
out = []
r.send_reset("nobody@example.org", users, out)
assert_.equal(out, [])`,
      },
      {
        name: "inactive accounts get nothing",
        isHidden: true,
        source: `r = bug_require("src/accounts/reset.py")
users = [{"username": "old", "email": "old@example.org", "active": False}]
out = []
r.send_reset("OLD@example.org", users, out)
assert_.equal(out, [])`,
      },
    ],
    fixedFiles: {
      "src/accounts/reset.py": `import unicodedata

db = bug_require("./db.py")


def _same_address(a, b):
    return unicodedata.normalize("NFKC", a).casefold() == unicodedata.normalize("NFKC", b).casefold()


def send_reset(email, users, outbox):
    for user in db.users_with_email_iexact(users, email):
        if not user["active"]:
            continue
        # The database's case-insensitive match lets different strings compare
        # equal ("ı".upper() == "I"), so re-check with Unicode case folding —
        # and only ever mail the address on the account, never the one typed.
        if not _same_address(email, user["email"]):
            continue
        outbox.append({"to": user["email"], "username": user["username"]})
`,
    },
  },

  {
    title: "The Username That Changed When Asked Twice",
    difficulty: "hard",
    category: "backend",
    language: "python",
    tags: ["Security", "Unicode", "Auth"],
    description: `Modelled on **Spotify's June 2013 account-hijacking bug**, described in Spotify's own engineering write-up. Usernames were canonicalised with an XMPP "nodeprep" routine that was **not idempotent** for some Unicode characters: canonicalising \`ᴮᴵᴳᴮᴵᴿᴰ\` gave \`BIGBIRD\`, and canonicalising that again gave \`bigbird\`. Because the password-reset flow canonicalised a name that was already canonical, an attacker could register the odd-looking name and reset the password of the ordinary account it collapsed into. Spotify's fix rejected names whose canonical form is not stable.

\`nodeprep.py\` (locked) reproduces the non-idempotent mapping; \`accounts.py\` trusts it.

Fix \`AccountStore\` so no name can be steered into another account.`,
    bugReport: `**BUG-SPOT-1306** · Priority: Critical (account takeover) · Reported by: security

AccountStore:
- register(name, password): key = canonical(name). Raise ValueError if the
  key is not stable (canonical(key) != key) or is already taken. Return key.
- check_password(name, password): looks up canonical(name).
- request_reset(name): {"account": canonical(name)} or None if no account.
- complete_reset(ticket, new_password): ticket["account"] is already a
  canonical key — apply the change to exactly that account, without
  canonicalising again. Unknown key -> False, nothing changes.

Observed: after registering a name written in modifier letters, resetting
its password changed the password of the account "bigbird".`,
    logs: `[accounts] register display="ᴮᴵᴳᴮᴵᴿᴰ" key=BIGBIRD
[reset] ticket account=BIGBIRD -> applied to account=bigbird`,
    files: [
      {
        filePath: "src/accounts/accounts.py",
        isEditable: true,
        language: "python",
        content: `nodeprep = bug_require("./nodeprep.py")


class AccountStore:
    def __init__(self):
        self.accounts = {}

    def register(self, name, password):
        key = nodeprep.canonical(name)
        if key in self.accounts:
            raise ValueError("username taken")
        self.accounts[key] = {"display": name, "password": password}
        return key

    def check_password(self, name, password):
        acct = self.accounts.get(nodeprep.canonical(name))
        return acct is not None and acct["password"] == password

    def request_reset(self, name):
        key = nodeprep.canonical(name)
        if key not in self.accounts:
            return None
        return {"account": key}

    def complete_reset(self, ticket, new_password):
        acct = self.accounts.get(nodeprep.canonical(ticket["account"]))
        if acct is None:
            return False
        acct["password"] = new_password
        return True
`,
      },
      {
        filePath: "src/accounts/nodeprep.py",
        isEditable: false,
        language: "python",
        content: `# Simplified stand-in for the vendored nodeprep profile used to canonicalise
# usernames. This is third-party behaviour we cannot change: callers must not
# assume canonical(canonical(x)) == canonical(x).

MODIFIER_CAPITALS = {
    u"\\u1d2e": "B",
    u"\\u1d35": "I",
    u"\\u1d33": "G",
    u"\\u1d3f": "R",
    u"\\u1d30": "D",
}


def canonical(name):
    out = []
    for ch in name:
        if ch in MODIFIER_CAPITALS:
            out.append(MODIFIER_CAPITALS[ch])
        else:
            out.append(ch.lower())
    return "".join(out)
`,
      },
    ],
    tests: [
      {
        name: "an ordinary account registers and resets",
        isHidden: false,
        source: `m = bug_require("src/accounts/accounts.py")
s = m.AccountStore()
assert_.equal(s.register("BigBird", "pw1"), "bigbird")
t = s.request_reset("bigbird")
assert_.equal(s.complete_reset(t, "pw2"), True)
assert_.ok(s.check_password("BIGBIRD", "pw2"), "the new password works")`,
      },
      {
        name: "a name whose canonical form is unstable is refused",
        isHidden: false,
        source: `m = bug_require("src/accounts/accounts.py")
s = m.AccountStore()
odd = u"\\u1d2e\\u1d35\\u1d33\\u1d2e\\u1d35\\u1d3f\\u1d30"
assert_.throws(lambda: s.register(odd, "x"), "canonical(canonical(name)) differs from canonical(name)")`,
      },
      {
        name: "the hijack does not reach the victim",
        isHidden: true,
        source: `m = bug_require("src/accounts/accounts.py")
s = m.AccountStore()
s.register("bigbird", "victim-pw")
odd = u"\\u1d2e\\u1d35\\u1d33\\u1d2e\\u1d35\\u1d3f\\u1d30"
try:
    s.register(odd, "attacker-pw")
except ValueError:
    pass
t = s.request_reset(odd)
if t is not None:
    s.complete_reset(t, "owned")
assert_.ok(s.check_password("bigbird", "victim-pw"), "the victim's password must be unchanged")`,
      },
      {
        name: "a reset ticket applies to exactly its own key",
        isHidden: true,
        source: `m = bug_require("src/accounts/accounts.py")
s = m.AccountStore()
s.register("bigbird", "victim-pw")
assert_.equal(s.complete_reset({"account": "BIGBIRD"}, "owned"), False, "no account is stored under BIGBIRD")
assert_.ok(s.check_password("bigbird", "victim-pw"))`,
      },
      {
        name: "a taken name is refused in any case",
        isHidden: true,
        source: `m = bug_require("src/accounts/accounts.py")
s = m.AccountStore()
s.register("bigbird", "pw")
assert_.throws(lambda: s.register("BIGBIRD", "pw"))`,
      },
    ],
    fixedFiles: {
      "src/accounts/accounts.py": `nodeprep = bug_require("./nodeprep.py")


class AccountStore:
    def __init__(self):
        self.accounts = {}

    def register(self, name, password):
        key = nodeprep.canonical(name)
        # canonical() is not idempotent. A key that canonicalises to something
        # else can later be "canonicalised" into another account, so refuse it
        # at the door.
        if nodeprep.canonical(key) != key:
            raise ValueError("username is not stable under canonicalisation")
        if key in self.accounts:
            raise ValueError("username taken")
        self.accounts[key] = {"display": name, "password": password}
        return key

    def check_password(self, name, password):
        acct = self.accounts.get(nodeprep.canonical(name))
        return acct is not None and acct["password"] == password

    def request_reset(self, name):
        key = nodeprep.canonical(name)
        if key not in self.accounts:
            return None
        return {"account": key}

    def complete_reset(self, ticket, new_password):
        # The ticket already names a canonical key; canonicalising it again is
        # exactly how BIGBIRD became bigbird.
        acct = self.accounts.get(ticket["account"])
        if acct is None:
            return False
        acct["password"] = new_password
        return True
`,
    },
  },

  {
    title: "Your Password, in the Address Bar",
    difficulty: "easy",
    category: "backend",
    language: "javascript",
    tags: ["Security", "Auth", "Logging"],
    description: `Modelled on **Instagram's November 2018 disclosure**. Instagram told some users that its "Download Your Data" tool had put their password **in the URL** of the page in their browser, and that the passwords had been stored on Facebook's servers as a result. A URL ends up in browser history, proxies and server access logs, none of which treat it as a secret.

This reconstruction's client sends the credential as query parameters, and the (locked) server logs every request line.

Fix \`buildRequest\` so the password travels in the request body.`,
    bugReport: `**BUG-IG-1811** · Priority: Critical · Reported by: security

buildRequest(username, password) must return:
  { method: "POST", url: "/accounts/data_download/request",
    body: { username: <username>, password: <password> } }
- the URL is exactly the path: no query string, no credential in it
- the server must still accept a correct password (200) and refuse a wrong
  one (403)

Observed: the access log contains lines like
"GET /accounts/data_download/request?username=kai&password=…".`,
    logs: `[edge] GET /accounts/data_download/request?username=kai&password=hunter2 200
[logs] shipped 1 access-log batch to shared storage`,
    files: [
      {
        filePath: "src/privacy/downloadClient.js",
        isEditable: true,
        language: "javascript",
        content: `var PATH = "/accounts/data_download/request";
exports.PATH = PATH;

exports.buildRequest = function (username, password) {
  return {
    method: "GET",
    url: PATH + "?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password),
    body: null
  };
};
`,
      },
      {
        filePath: "src/privacy/server.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The data-download endpoint. Every request line (method + URL) is written to
the access log, which is shipped to shared storage and retained. Request
bodies are never logged. The endpoint still reads legacy query parameters.
*/
function parseQuery(url) {
  var out = {};
  var q = url.indexOf("?");
  if (q === -1) return out;
  url.substring(q + 1).split("&").forEach(function (pair) {
    var eq = pair.indexOf("=");
    if (eq > 0) out[decodeURIComponent(pair.substring(0, eq))] = decodeURIComponent(pair.substring(eq + 1));
  });
  return out;
}

exports.create = function (passwords) {
  var accessLog = [];
  return {
    accessLog: accessLog,
    handle: function (req) {
      accessLog.push(req.method + " " + req.url);
      var q = parseQuery(req.url);
      var body = req.body || {};
      var user = body.username || q.username;
      var pw = body.password || q.password;
      return passwords[user] === pw ? 200 : 403;
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "a correct password is accepted",
        isHidden: false,
        source: `var c = require("src/privacy/downloadClient");
var server = require("src/privacy/server").create({ kai: "hunter2" });
assert.equal(server.handle(c.buildRequest("kai", "hunter2")), 200);`,
      },
      {
        name: "the password is not in the URL",
        isHidden: false,
        source: `var c = require("src/privacy/downloadClient");
var req = c.buildRequest("kai", "hunter2");
assert.ok(req.url.indexOf("hunter2") === -1, "the credential must not appear in the URL");
assert.equal(req.url, "/accounts/data_download/request");`,
      },
      {
        name: "the request is a POST with the credential in the body",
        isHidden: true,
        source: `var c = require("src/privacy/downloadClient");
var req = c.buildRequest("kai", "p&ss=w0rd");
assert.equal(req.method, "POST");
assert.equal(req.body.username, "kai");
assert.equal(req.body.password, "p&ss=w0rd");`,
      },
      {
        name: "the access log never holds the password",
        isHidden: true,
        source: `var c = require("src/privacy/downloadClient");
var server = require("src/privacy/server").create({ kai: "hunter2" });
server.handle(c.buildRequest("kai", "hunter2"));
server.handle(c.buildRequest("kai", "wrong-guess"));
assert.equal(server.accessLog, ["POST /accounts/data_download/request", "POST /accounts/data_download/request"]);`,
      },
      {
        name: "a wrong password is refused",
        isHidden: true,
        source: `var c = require("src/privacy/downloadClient");
var server = require("src/privacy/server").create({ kai: "hunter2" });
assert.equal(server.handle(c.buildRequest("kai", "nope")), 403);`,
      },
    ],
    fixedFiles: {
      "src/privacy/downloadClient.js": `var PATH = "/accounts/data_download/request";
exports.PATH = PATH;

// A URL is not a secret: it lands in browser history, proxy logs and our own
// access logs. Credentials travel in the body of a POST, never the query.
exports.buildRequest = function (username, password) {
  return {
    method: "POST",
    url: PATH,
    body: { username: username, password: password }
  };
};
`,
    },
  },

  {
    title: "The /24 That Swallowed YouTube",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Networking", "Security", "Validation"],
    description: `Modelled on **Pakistan Telecom and YouTube, 24 February 2008**. Asked to block YouTube inside Pakistan, Pakistan Telecom (AS17557) announced \`208.65.153.0/24\` — a **more specific** slice of YouTube's \`208.65.152.0/22\`. The announcement leaked to its upstream provider and on across the internet, and because routers prefer the longest matching prefix, much of the world's YouTube traffic went to Pakistan instead for roughly two hours. Route origin validation (RPKI ROAs, which name the authorised origin AS and a maximum prefix length) is the defence that later became standard.

This reconstruction's route table checks announcements against ROAs, but only asks whether a ROA *covers* the prefix.

Fix \`announce\` to perform full origin validation.`,
    bugReport: `**BUG-BGP-0802** · Priority: Critical · Reported by: network engineering

rib.create(roas).announce(prefix, originAs) returns one of:
- "valid": some ROA covers the prefix, its asn === originAs, AND the
  prefix length <= that ROA's maxLength
- "invalid": at least one ROA covers the prefix but none makes it valid
- "not-found": no ROA covers the prefix
Invalid announcements are NOT installed; valid and not-found ones are.
lookup(address) returns the origin AS of the installed route with the
longest prefix containing the address (first installed wins a tie), or null.

Observed: AS17557's 208.65.153.0/24 was reported "valid" because YouTube's
/22 ROA covers it, and took over the traffic by longest-prefix match.`,
    logs: `[rib] announce 208.65.153.0/24 origin=AS17557 rov=valid
[rib] best path 208.65.153.238 -> AS17557 (/24 beats /22)`,
    files: [
      {
        filePath: "src/bgp/rib.js",
        isEditable: true,
        language: "javascript",
        content: `var ip = require("./ip");

function validate(net, originAs, roas) {
  for (var i = 0; i < roas.length; i++) {
    if (ip.covers(ip.parse(roas[i].prefix), net)) return "valid";
  }
  return "not-found";
}

exports.create = function (roas) {
  var routes = [];
  return {
    announce: function (prefix, originAs) {
      var net = ip.parse(prefix);
      var state = validate(net, originAs, roas);
      if (state === "invalid") return state;
      routes.push({ net: net, origin: originAs });
      return state;
    },
    lookup: function (address) {
      var n = ip.toInt(address);
      var best = null;
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i];
        if (ip.covers(r.net, { base: n, len: 32 }) && (!best || r.net.len > best.net.len)) best = r;
      }
      return best ? best.origin : null;
    }
  };
};
`,
      },
      {
        filePath: "src/bgp/ip.js",
        isEditable: false,
        language: "javascript",
        content: `// IPv4 helpers. Arithmetic avoids bitwise operators so /0 and /32 behave.
function toInt(addr) {
  var p = addr.split(".");
  return ((Number(p[0]) * 256 + Number(p[1])) * 256 + Number(p[2])) * 256 + Number(p[3]);
}

function parse(cidr) {
  var s = cidr.split("/");
  return { base: toInt(s[0]), len: Number(s[1]) };
}

// true when every address of \`inner\` lies inside \`outer\`
function covers(outer, inner) {
  if (inner.len < outer.len) return false;
  var size = Math.pow(2, 32 - outer.len);
  return Math.floor(inner.base / size) === Math.floor(outer.base / size);
}

exports.toInt = toInt;
exports.parse = parse;
exports.covers = covers;
`,
      },
      {
        filePath: "src/bgp/ROA.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A ROA is { prefix: "a.b.c.d/len", asn: <origin AS allowed>, maxLength: <n> }.
It authorises asn to originate prefix and any more-specific prefix inside it
up to maxLength bits. Origin validation (RFC 6811) compares an announcement
against every ROA that covers it; one match is enough.
*/
`,
      },
    ],
    tests: [
      {
        name: "the legitimate /22 is valid and routes",
        isHidden: false,
        source: `var rib = require("src/bgp/rib").create([{ prefix: "208.65.152.0/22", asn: 36561, maxLength: 22 }]);
assert.equal(rib.announce("208.65.152.0/22", 36561), "valid");
assert.equal(rib.lookup("208.65.153.238"), 36561);`,
      },
      {
        name: "the more-specific hijack is invalid and ignored",
        isHidden: false,
        source: `var rib = require("src/bgp/rib").create([{ prefix: "208.65.152.0/22", asn: 36561, maxLength: 22 }]);
rib.announce("208.65.152.0/22", 36561);
assert.equal(rib.announce("208.65.153.0/24", 17557), "invalid", "wrong origin, too specific");
assert.equal(rib.lookup("208.65.153.238"), 36561, "traffic must still reach the owner");`,
      },
      {
        name: "a wrong origin at the same length is invalid",
        isHidden: true,
        source: `var rib = require("src/bgp/rib").create([{ prefix: "208.65.152.0/22", asn: 36561, maxLength: 22 }]);
assert.equal(rib.announce("208.65.152.0/22", 17557), "invalid");
assert.equal(rib.lookup("208.65.153.238"), null, "invalid routes are not installed");`,
      },
      {
        name: "maxLength bounds the owner's own more-specifics",
        isHidden: true,
        source: `var rib = require("src/bgp/rib").create([{ prefix: "208.65.152.0/22", asn: 36561, maxLength: 24 }]);
assert.equal(rib.announce("208.65.153.0/24", 36561), "valid");
assert.equal(rib.announce("208.65.153.0/25", 36561), "invalid", "longer than maxLength");`,
      },
      {
        name: "uncovered prefixes are not-found and still route",
        isHidden: true,
        source: `var rib = require("src/bgp/rib").create([{ prefix: "208.65.152.0/22", asn: 36561, maxLength: 22 }]);
assert.equal(rib.announce("10.0.0.0/8", 64500), "not-found");
assert.equal(rib.lookup("10.1.2.3"), 64500);
assert.equal(rib.lookup("192.0.2.1"), null);`,
      },
      {
        name: "any one matching ROA makes it valid",
        isHidden: true,
        source: `var rib = require("src/bgp/rib").create([
  { prefix: "198.51.100.0/22", asn: 64510, maxLength: 22 },
  { prefix: "198.51.100.0/22", asn: 64511, maxLength: 24 }
]);
assert.equal(rib.announce("198.51.101.0/24", 64511), "valid");
assert.equal(rib.announce("198.51.102.0/24", 64510), "invalid");
assert.equal(rib.lookup("198.51.102.9"), null);`,
      },
    ],
    fixedFiles: {
      "src/bgp/rib.js": `var ip = require("./ip");

// Covering a prefix is not authorising it: the hijacked /24 sat inside
// YouTube's /22. A covering ROA makes an announcement valid only when it
// names the same origin AS and allows that prefix length; covered but
// unmatched is invalid.
function validate(net, originAs, roas) {
  var covered = false;
  for (var i = 0; i < roas.length; i++) {
    if (!ip.covers(ip.parse(roas[i].prefix), net)) continue;
    covered = true;
    if (roas[i].asn === originAs && net.len <= roas[i].maxLength) return "valid";
  }
  return covered ? "invalid" : "not-found";
}

exports.create = function (roas) {
  var routes = [];
  return {
    announce: function (prefix, originAs) {
      var net = ip.parse(prefix);
      var state = validate(net, originAs, roas);
      if (state === "invalid") return state;
      routes.push({ net: net, origin: originAs });
      return state;
    },
    lookup: function (address) {
      var n = ip.toInt(address);
      var best = null;
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i];
        if (ip.covers(r.net, { base: n, len: 32 }) && (!best || r.net.len > best.net.len)) best = r;
      }
      return best ? best.origin : null;
    }
  };
};
`,
    },
  },

  {
    title: "Signed In as Somebody Else",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Concurrency", "Auth", "State"],
    description: `Modelled on **GitHub, March 2021**. GitHub disclosed that a rare race condition in its request handling could, under specific conditions, send one user's session cookie back in the response to **another user's request** — leaving that browser signed in as someone else. GitHub fixed the bug and invalidated every signed-in session on github.com, signing everyone out.

This reconstruction's worker splits a request into \`begin\` (authenticate) and \`finish\` (render the response) so other requests can run in between, and keeps the authenticated session in a variable shared by the whole worker. The tests drive the interleaving explicitly.

Fix the worker so each response carries its own request's session.`,
    bugReport: `**BUG-GH-2103** · Priority: Critical (session leak) · Reported by: security

createWorker(sessions) returns { begin(req), finish(id), pending() }:
- begin({ id, cookie }) authenticates the request with sessions.lookup(cookie)
- finish(id) returns { id, user, setCookie } for THAT request: user is the
  session's name and setCookie its token, or both null for a request with
  no valid session — regardless of what began or finished in between
- finish(id) for an id that was never begun, or already finished, throws
- pending() is the number of begun but unfinished requests; a finished
  request leaves nothing behind

Observed: with two requests in flight, the first to finish was answered with
the second one's session cookie.`,
    logs: `[web] begin req=a cookie=tok-alice
[web] begin req=b cookie=tok-bob
[web] finish req=a user=bob set-cookie=tok-bob`,
    files: [
      {
        filePath: "src/web/worker.js",
        isEditable: true,
        language: "javascript",
        content: `exports.createWorker = function (sessions) {
  var current = null;
  var inFlight = 0;
  return {
    begin: function (req) {
      current = sessions.lookup(req.cookie);
      inFlight++;
    },
    finish: function (id) {
      inFlight--;
      return {
        id: id,
        user: current ? current.name : null,
        setCookie: current ? current.token : null
      };
    },
    pending: function () {
      return inFlight;
    }
  };
};
`,
      },
      {
        filePath: "src/web/sessions.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Session store: cookie token -> account name. lookup() returns
{ name, token } for a known token and null for a missing or unknown one.
One worker serves many requests; between a request's begin and finish the
worker may begin or finish any number of others.
*/
exports.create = function (rows) {
  return {
    lookup: function (cookie) {
      if (!cookie || !Object.prototype.hasOwnProperty.call(rows, cookie)) return null;
      return { name: rows[cookie], token: cookie };
    }
  };
};
`,
      },
    ],
    tests: [
      {
        name: "one request at a time works",
        isHidden: false,
        source: `var s = require("src/web/sessions").create({ "tok-alice": "alice", "tok-bob": "bob" });
var w = require("src/web/worker").createWorker(s);
w.begin({ id: "a", cookie: "tok-alice" });
assert.equal(w.finish("a"), { id: "a", user: "alice", setCookie: "tok-alice" });
w.begin({ id: "b", cookie: "tok-bob" });
assert.equal(w.finish("b"), { id: "b", user: "bob", setCookie: "tok-bob" });`,
      },
      {
        name: "interleaved requests keep their own sessions",
        isHidden: false,
        source: `var s = require("src/web/sessions").create({ "tok-alice": "alice", "tok-bob": "bob" });
var w = require("src/web/worker").createWorker(s);
w.begin({ id: "a", cookie: "tok-alice" });
w.begin({ id: "b", cookie: "tok-bob" });
assert.equal(w.finish("a"), { id: "a", user: "alice", setCookie: "tok-alice" }, "alice must not receive bob's cookie");
assert.equal(w.finish("b"), { id: "b", user: "bob", setCookie: "tok-bob" });`,
      },
      {
        name: "an anonymous request in between changes nothing",
        isHidden: true,
        source: `var s = require("src/web/sessions").create({ "tok-alice": "alice" });
var w = require("src/web/worker").createWorker(s);
w.begin({ id: "a", cookie: "tok-alice" });
w.begin({ id: "anon", cookie: null });
assert.equal(w.finish("a"), { id: "a", user: "alice", setCookie: "tok-alice" });
assert.equal(w.finish("anon"), { id: "anon", user: null, setCookie: null });`,
      },
      {
        name: "finishing in reverse order",
        isHidden: true,
        source: `var s = require("src/web/sessions").create({ "tok-alice": "alice", "tok-bob": "bob" });
var w = require("src/web/worker").createWorker(s);
w.begin({ id: "a", cookie: "tok-alice" });
w.begin({ id: "anon", cookie: "tok-expired" });
w.begin({ id: "b", cookie: "tok-bob" });
assert.equal(w.finish("b").user, "bob");
assert.equal(w.finish("anon"), { id: "anon", user: null, setCookie: null });
assert.equal(w.finish("a").setCookie, "tok-alice");`,
      },
      {
        name: "state is released and unknown ids throw",
        isHidden: true,
        source: `var s = require("src/web/sessions").create({ "tok-alice": "alice" });
var w = require("src/web/worker").createWorker(s);
w.begin({ id: "a", cookie: "tok-alice" });
w.begin({ id: "b", cookie: null });
assert.equal(w.pending(), 2);
w.finish("a");
w.finish("b");
assert.equal(w.pending(), 0);
assert.throws(function () { w.finish("a"); }, "a finished request cannot finish again");
assert.throws(function () { w.finish("zzz"); }, "never begun");`,
      },
    ],
    fixedFiles: {
      "src/web/worker.js": `exports.createWorker = function (sessions) {
  // Session state belongs to the request, not the worker: any number of other
  // requests can begin between this one's begin and finish, and a single
  // shared "current" slot hands the last one's cookie to whoever finishes next.
  var byRequest = {};
  return {
    begin: function (req) {
      byRequest[req.id] = sessions.lookup(req.cookie);
    },
    finish: function (id) {
      if (!Object.prototype.hasOwnProperty.call(byRequest, id)) {
        throw new Error("unknown request " + id);
      }
      var session = byRequest[id];
      delete byRequest[id];
      return {
        id: id,
        user: session ? session.name : null,
        setCookie: session ? session.token : null
      };
    },
    pending: function () {
      return Object.keys(byRequest).length;
    }
  };
};
`,
    },
  },

  {
    title: "The Reply Meant for the Last User",
    difficulty: "hard",
    category: "backend",
    language: "javascript",
    tags: ["Concurrency", "Caching", "Security"],
    description: `Modelled on **OpenAI's ChatGPT outage of 20 March 2023**. OpenAI's post-mortem traced it to a bug in the redis-py client library: a request **cancelled after its command was sent but before the reply was read** left that connection in the shared pool with the reply still waiting. The next request to use the connection read the stale reply — data belonging to a different user. Some users could see titles from other users' chat histories, and OpenAI said payment-related information of 1.2% of ChatGPT Plus subscribers active in a nine-hour window may have been visible. ChatGPT was taken offline while it was fixed.

In this reconstruction the client library (locked) releases a cancelled connection back to the pool as-is.

Fix the pool so a connection that is not clean is never handed out again.`,
    bugReport: `**BUG-POOL-0320** · Priority: Critical (cross-user data exposure) · Reported by: incident review

pool.create(factory) returns { acquire(), release(conn), stats() }:
- acquire() returns an idle connection if there is one, else a new one
  from factory(n) where n counts connections created (1, 2, …)
- release(conn) returns conn to the idle list ONLY if it is open and has no
  unread replies (conn.pendingReplies() === 0). Otherwise the pool closes
  it (conn.close()), counts it as discarded and never hands it out again
- stats() is { idle, created, discarded }

Observed: after a cancelled request, the next caller on that connection
received the cancelled request's reply.`,
    logs: `[api] GET /conversations user=alice cancelled (client disconnected)
[redis] conn#1 returned to pool, pending_replies=1
[api] GET /conversations user=bob -> titles:alice`,
    files: [
      {
        filePath: "src/cache/pool.js",
        isEditable: true,
        language: "javascript",
        content: `exports.create = function (factory) {
  var idle = [];
  var created = 0;
  var discarded = 0;
  return {
    acquire: function () {
      if (idle.length > 0) return idle.pop();
      created++;
      return factory(created);
    },
    release: function (conn) {
      idle.push(conn);
    },
    stats: function () {
      return { idle: idle.length, created: created, discarded: discarded };
    }
  };
};
`,
      },
      {
        filePath: "src/cache/conn.js",
        isEditable: false,
        language: "javascript",
        content: `/*
A pipelined connection: replies arrive in the order commands were sent and
wait in the inbox until read. Closing drops anything unread.
*/
exports.connect = function (server, id) {
  var inbox = [];
  var closed = false;
  return {
    id: id,
    send: function (cmd) {
      if (closed) throw new Error("connection closed");
      inbox.push(server(cmd));
    },
    read: function () {
      if (closed) throw new Error("connection closed");
      return inbox.shift();
    },
    pendingReplies: function () { return inbox.length; },
    close: function () { closed = true; inbox.length = 0; },
    isClosed: function () { return closed; }
  };
};
`,
      },
      {
        filePath: "src/cache/client.js",
        isEditable: false,
        language: "javascript",
        content: `/*
The client library's call path (third-party, not ours to change). A caller
may be cancelled - a closed tab, a timeout - after the command is written and
before the reply is read; the library then releases the connection as-is.
*/
exports.call = function (pool, cmd, cancelAfterSend) {
  var c = pool.acquire();
  c.send(cmd);
  if (cancelAfterSend) {
    pool.release(c);
    return { cancelled: true };
  }
  var reply = c.read();
  pool.release(c);
  return { reply: reply };
};
`,
      },
    ],
    tests: [
      {
        name: "sequential calls get their own replies",
        isHidden: false,
        source: `var conn = require("src/cache/conn");
var client = require("src/cache/client");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "titles:" + cmd.user; }, n); });
assert.equal(client.call(p, { user: "alice" }, false), { reply: "titles:alice" });
assert.equal(client.call(p, { user: "bob" }, false), { reply: "titles:bob" });`,
      },
      {
        name: "a cancelled call does not leak its reply",
        isHidden: false,
        source: `var conn = require("src/cache/conn");
var client = require("src/cache/client");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "titles:" + cmd.user; }, n); });
assert.equal(client.call(p, { user: "alice" }, true), { cancelled: true });
assert.equal(client.call(p, { user: "bob" }, false), { reply: "titles:bob" }, "bob must never read alice's reply");`,
      },
      {
        name: "a dirty connection is discarded and replaced",
        isHidden: true,
        source: `var conn = require("src/cache/conn");
var client = require("src/cache/client");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "r:" + cmd.user; }, n); });
client.call(p, { user: "alice" }, true);
var s = p.stats();
assert.equal([s.idle, s.created, s.discarded], [0, 1, 1]);
client.call(p, { user: "bob" }, false);
s = p.stats();
assert.equal([s.idle, s.created, s.discarded], [1, 2, 1], "a fresh connection was opened");`,
      },
      {
        name: "clean connections are reused",
        isHidden: true,
        source: `var conn = require("src/cache/conn");
var client = require("src/cache/client");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "r:" + cmd.user; }, n); });
client.call(p, { user: "a" }, false);
client.call(p, { user: "b" }, false);
var s = p.stats();
assert.equal([s.idle, s.created, s.discarded], [1, 1, 0]);`,
      },
      {
        name: "a closed connection is not pooled",
        isHidden: true,
        source: `var conn = require("src/cache/conn");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "r"; }, n); });
var c = p.acquire();
c.close();
p.release(c);
var s = p.stats();
assert.equal([s.idle, s.discarded], [0, 1]);
assert.ok(p.acquire() !== c, "the closed connection must not come back");`,
      },
      {
        name: "the discarded connection is closed",
        isHidden: true,
        source: `var conn = require("src/cache/conn");
var p = require("src/cache/pool").create(function (n) { return conn.connect(function (cmd) { return "r"; }, n); });
var c = p.acquire();
c.send({ user: "x" });
p.release(c);
assert.ok(c.isClosed(), "a connection with an unread reply must be closed");`,
      },
    ],
    fixedFiles: {
      "src/cache/pool.js": `exports.create = function (factory) {
  var idle = [];
  var created = 0;
  var discarded = 0;
  return {
    acquire: function () {
      if (idle.length > 0) return idle.pop();
      created++;
      return factory(created);
    },
    release: function (conn) {
      // A connection with an unread reply is out of step: the next command's
      // reader would get the previous caller's answer. It cannot be cleaned
      // safely, so close it and let acquire() open a fresh one.
      if (conn.isClosed() || conn.pendingReplies() > 0) {
        conn.close();
        discarded++;
        return;
      }
      idle.push(conn);
    },
    stats: function () {
      return { idle: idle.length, created: created, discarded: discarded };
    }
  };
};
`,
    },
  },

  {
    title: "Listening Everywhere, Asking Nothing",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Security", "Config", "Networking"],
    description: `Modelled on the **exposed MongoDB databases of 2015**. MongoDB releases of the time did not require authentication by default and, depending on how they were installed, listened on every network interface. In February 2015 researchers at Saarland University reported finding tens of thousands of MongoDB instances reachable from the internet with no access control, and later scans that year found similar numbers. MongoDB later made binding to localhost the default.

This reconstruction's config loader fills missing settings with the old defaults.

Fix \`load\` so a missing setting is the safe one and an exposed, unauthenticated server cannot start.`,
    bugReport: `**BUG-MDB-1502** · Priority: Critical · Reported by: security

load(raw) returns { bindIp, port, auth }:
- missing bindIp -> "127.0.0.1"; missing port -> 27017; missing auth -> true
- explicitly given values are kept (raw may be undefined or {})
- bindIp may be a comma-separated list (entries are trimmed). If ANY entry
  is not a loopback address (server.LOOPBACK: "127.0.0.1", "localhost",
  "::1") while auth is false, load throws — that server would be open to
  the network with no password
- loopback-only with auth false is allowed (local development)

Observed: a config file with only a storage path started a server on
0.0.0.0:27017 that accepted unauthenticated clients from anywhere.`,
    logs: `[mongod] waiting for connections on 0.0.0.0:27017
[mongod] access control is not enabled for the database
[mongod] connection accepted from 203.0.113.77:51882`,
    files: [
      {
        filePath: "src/db/config.js",
        isEditable: true,
        language: "javascript",
        content: `var DEFAULTS = { bindIp: "0.0.0.0", port: 27017, auth: false };

exports.load = function (raw) {
  raw = raw || {};
  return {
    bindIp: raw.bindIp !== undefined ? raw.bindIp : DEFAULTS.bindIp,
    port: raw.port !== undefined ? raw.port : DEFAULTS.port,
    auth: raw.auth !== undefined ? raw.auth : DEFAULTS.auth
  };
};
`,
      },
      {
        filePath: "src/db/server.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Starts the database with a loaded config. Addresses in LOOPBACK are reachable
only from this machine; anything else ("0.0.0.0", a LAN or public address)
is reachable from the network.
*/
exports.LOOPBACK = ["127.0.0.1", "localhost", "::1"];

exports.start = function (config) {
  return {
    listening: config.bindIp.split(",").map(function (s) { return s.trim(); }),
    port: config.port,
    requiresAuth: config.auth
  };
};
`,
      },
    ],
    tests: [
      {
        name: "explicit settings are kept",
        isHidden: false,
        source: `var c = require("src/db/config").load({ bindIp: "10.0.0.5", port: 27018, auth: true });
assert.equal([c.bindIp, c.port, c.auth], ["10.0.0.5", 27018, true]);`,
      },
      {
        name: "an empty config is safe",
        isHidden: false,
        source: `var c = require("src/db/config").load({});
assert.equal(c.bindIp, "127.0.0.1", "listen on loopback unless told otherwise");
assert.equal(c.auth, true, "require authentication unless told otherwise");`,
      },
      {
        name: "an open, unauthenticated server is refused",
        isHidden: true,
        source: `var load = require("src/db/config").load;
assert.throws(function () { load({ bindIp: "0.0.0.0", auth: false }); }, "all interfaces, no auth");
var c = load({ bindIp: "0.0.0.0" });
assert.equal([c.bindIp, c.auth], ["0.0.0.0", true], "public but authenticated is fine");`,
      },
      {
        name: "bind lists are checked entry by entry",
        isHidden: true,
        source: `var load = require("src/db/config").load;
assert.throws(function () { load({ bindIp: "127.0.0.1, 10.1.2.3", auth: false }); });
assert.equal(load({ bindIp: "localhost", auth: false }).auth, false, "local development");
assert.equal(load({ bindIp: "127.0.0.1,::1", auth: false }).bindIp, "127.0.0.1,::1");`,
      },
      {
        name: "port default and a missing config",
        isHidden: true,
        source: `var load = require("src/db/config").load;
var c = load(undefined);
assert.equal([c.bindIp, c.port, c.auth], ["127.0.0.1", 27017, true]);`,
      },
    ],
    fixedFiles: {
      "src/db/config.js": `var server = require("./server");

// A setting nobody wrote down must be the safe one: loopback only, with
// authentication on. The old defaults put tens of thousands of databases on
// the internet with no password.
var DEFAULTS = { bindIp: "127.0.0.1", port: 27017, auth: true };

exports.load = function (raw) {
  raw = raw || {};
  var config = {
    bindIp: raw.bindIp !== undefined ? raw.bindIp : DEFAULTS.bindIp,
    port: raw.port !== undefined ? raw.port : DEFAULTS.port,
    auth: raw.auth !== undefined ? raw.auth : DEFAULTS.auth
  };
  var exposed = config.bindIp.split(",").some(function (addr) {
    return server.LOOPBACK.indexOf(addr.trim()) === -1;
  });
  if (exposed && !config.auth) {
    throw new Error("refusing to listen on " + config.bindIp + " without authentication");
  }
  return config;
};
`,
    },
  },

  {
    title: "Someone Else's Account Page, From Cache",
    difficulty: "medium",
    category: "backend",
    language: "javascript",
    tags: ["Caching", "Security", "Auth"],
    description: `Modelled on **Steam, 25 December 2015**. While Steam was under a denial-of-service attack, a caching configuration change made to absorb the traffic caused some pages for **signed-in users** to be cached and served to other users. Valve said about 34,000 users' account pages may have been shown to someone else, and that the pages exposed no full card numbers and allowed no account changes.

This reconstruction's edge cache stores every successful GET by path, with no regard to who asked.

Fix \`handle\` so personal responses are never stored or served from cache.`,
    bugReport: `**BUG-EDGE-1225** · Priority: Critical · Reported by: support (users seeing other accounts)

cache.create(origin).handle(req) returns { status, body, fromCache }:
- only GET requests are served from / stored in the cache, keyed by path,
  and only status 200 responses are stored
- a request carrying a cookie or authorization header (req.headers.cookie /
  req.headers.authorization) bypasses the cache entirely: it is neither
  answered from the cache nor stored
- a response with a set-cookie header, or a cache-control header containing
  "private" or "no-store" (any case), is never stored
- everything else ("public, max-age=60", no cache-control at all) is stored

Observed: users opening /account saw another user's name, email and
purchase history.`,
    logs: `[edge] GET /account cookie=sess-alice MISS -> stored
[edge] GET /account cookie=sess-bob HIT (age 3s)`,
    files: [
      {
        filePath: "src/edge/cache.js",
        isEditable: true,
        language: "javascript",
        content: `exports.create = function (origin) {
  var store = {};
  return {
    handle: function (req) {
      var cacheable = req.method === "GET";
      if (cacheable && store[req.path]) {
        return { status: 200, body: store[req.path].body, fromCache: true };
      }
      var res = origin(req);
      if (cacheable && res.status === 200) store[req.path] = res;
      return { status: res.status, body: res.body, fromCache: false };
    }
  };
};
`,
      },
      {
        filePath: "src/edge/HTTP.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Requests:  { method, path, headers }   Responses: { status, headers, body }
Header names are lower-case; headers may be missing entirely.
A shared cache sits in front of every user. Anything personal - a response to
a signed-in request, one that sets a cookie, or one the origin marked
private/no-store - must never be stored in it.
*/
`,
      },
    ],
    tests: [
      {
        name: "public pages are cached",
        isHidden: false,
        source: `var calls = 0;
var edge = require("src/edge/cache").create(function (req) { calls++; return { status: 200, headers: {}, body: "store front" }; });
edge.handle({ method: "GET", path: "/store", headers: {} });
var second = edge.handle({ method: "GET", path: "/store", headers: {} });
assert.equal(second, { status: 200, body: "store front", fromCache: true });
assert.equal(calls, 1);`,
      },
      {
        name: "each signed-in user sees their own account page",
        isHidden: false,
        source: `var edge = require("src/edge/cache").create(function (req) {
  return { status: 200, headers: {}, body: "account of " + req.headers.cookie };
});
edge.handle({ method: "GET", path: "/account", headers: { cookie: "alice" } });
var bob = edge.handle({ method: "GET", path: "/account", headers: { cookie: "bob" } });
assert.equal(bob.body, "account of bob", "bob must not be served alice's page");
assert.equal(bob.fromCache, false);`,
      },
      {
        name: "a visitor after a signed-in user gets the public answer",
        isHidden: true,
        source: `var edge = require("src/edge/cache").create(function (req) {
  var who = (req.headers || {}).cookie;
  return { status: 200, headers: {}, body: who ? "account of " + who : "please sign in" };
});
edge.handle({ method: "GET", path: "/account", headers: { cookie: "alice" } });
assert.equal(edge.handle({ method: "GET", path: "/account", headers: {} }).body, "please sign in");
var viaToken = edge.handle({ method: "GET", path: "/account", headers: { authorization: "Bearer t" } });
assert.equal(viaToken.fromCache, false, "authorization bypasses the cache");`,
      },
      {
        name: "set-cookie responses are not stored",
        isHidden: true,
        source: `var calls = 0;
var edge = require("src/edge/cache").create(function (req) { calls++; return { status: 200, headers: { "set-cookie": "sess=new" + calls }, body: "welcome" }; });
edge.handle({ method: "GET", path: "/welcome", headers: {} });
var again = edge.handle({ method: "GET", path: "/welcome", headers: {} });
assert.equal([again.fromCache, calls], [false, 2]);`,
      },
      {
        name: "cache-control private and no-store are honoured",
        isHidden: true,
        source: `var calls = { p: 0, n: 0, pub: 0 };
var edge = require("src/edge/cache").create(function (req) {
  if (req.path === "/p") { calls.p++; return { status: 200, headers: { "cache-control": "Private, max-age=0" }, body: "p" }; }
  if (req.path === "/n") { calls.n++; return { status: 200, headers: { "cache-control": "no-store" }, body: "n" }; }
  calls.pub++; return { status: 200, headers: { "cache-control": "public, max-age=60" }, body: "pub" };
});
["/p", "/p", "/n", "/n", "/pub", "/pub"].forEach(function (path) { edge.handle({ method: "GET", path: path, headers: {} }); });
assert.equal([calls.p, calls.n, calls.pub], [2, 2, 1]);`,
      },
      {
        name: "only GET 200 is cached",
        isHidden: true,
        source: `var calls = 0;
var edge = require("src/edge/cache").create(function (req) { calls++; return { status: req.path === "/gone" ? 404 : 200, headers: {}, body: "x" }; });
edge.handle({ method: "POST", path: "/cart", headers: {} });
edge.handle({ method: "POST", path: "/cart", headers: {} });
edge.handle({ method: "GET", path: "/gone", headers: {} });
edge.handle({ method: "GET", path: "/gone", headers: {} });
assert.equal(calls, 4);`,
      },
    ],
    fixedFiles: {
      "src/edge/cache.js": `function signedIn(req) {
  var h = req.headers || {};
  return !!(h.cookie || h.authorization);
}

function storable(res) {
  var h = res.headers || {};
  if (h["set-cookie"]) return false;
  var cc = String(h["cache-control"] || "").toLowerCase();
  return cc.indexOf("private") === -1 && cc.indexOf("no-store") === -1;
}

exports.create = function (origin) {
  var store = {};
  return {
    handle: function (req) {
      // The key is the path alone, so a response is only safe to share if it
      // is the same for everyone: a signed-in request bypasses the cache both
      // ways, and a personal-looking response is never stored.
      var cacheable = req.method === "GET" && !signedIn(req);
      if (cacheable && store[req.path]) {
        return { status: 200, body: store[req.path].body, fromCache: true };
      }
      var res = origin(req);
      if (cacheable && res.status === 200 && storable(res)) store[req.path] = res;
      return { status: res.status, body: res.body, fromCache: false };
    }
  };
};
`,
    },
  },

  {
    title: "Somebody Else's Videos in My Takeout",
    difficulty: "medium",
    category: "database",
    language: "javascript",
    tags: ["Concurrency", "State", "Security"],
    description: `Modelled on **Google Takeout and Google Photos, November 2019**. Google told affected users that for several days in late November 2019 a technical issue caused some videos from Google Photos to be **exported into unrelated users' archives**, and that fewer than 0.01% of Google Photos users who used Takeout in that window were affected. Google did not publish a detailed root cause, so this project is a reconstruction of one classic way it happens.

Here the export worker interleaves several users' jobs and collects items for all of them in one shared buffer.

Fix the exporter so every archive holds exactly its own user's items.`,
    bugReport: `**BUG-TAKEOUT-1121** · Priority: Critical (privacy) · Reported by: user report

createExporter() returns { startJob(jobId, userId), addItem(jobId, item),
finishJob(jobId) } and jobs may interleave freely:
- addItem(jobId, item) adds item.id to that job's archive; it throws if the
  job is unknown or item.ownerId is not the job's user (and adds nothing)
- finishJob(jobId) returns archive.seal(userId, ids) -> { user, files }
  with exactly the ids added to THAT job, in the order they were added
- a finished job is forgotten: finishing it again, or an unknown id, throws

Observed: a user's archive contained another user's videos; the other user's
archive was missing them.`,
    logs: `[takeout] job=j1 user=u1 add v1
[takeout] job=j2 user=u2 add w1
[takeout] job=j1 sealed files=[v1,w1]`,
    files: [
      {
        filePath: "src/takeout/exporter.js",
        isEditable: true,
        language: "javascript",
        content: `var archive = require("./archive");

exports.createExporter = function () {
  var jobs = {};
  var buffer = [];
  return {
    startJob: function (jobId, userId) {
      jobs[jobId] = { userId: userId };
    },
    addItem: function (jobId, item) {
      if (!jobs[jobId]) throw new Error("unknown job " + jobId);
      buffer.push(item.id);
    },
    finishJob: function (jobId) {
      var job = jobs[jobId];
      if (!job) throw new Error("unknown job " + jobId);
      var out = archive.seal(job.userId, buffer);
      buffer = [];
      delete jobs[jobId];
      return out;
    }
  };
};
`,
      },
      {
        filePath: "src/takeout/archive.js",
        isEditable: false,
        language: "javascript",
        content: `/*
Seals an export archive. One exporter process runs many users' jobs at once,
interleaving their steps as media is fetched from storage.
*/
exports.seal = function (userId, ids) {
  return { user: userId, files: ids.slice() };
};
`,
      },
    ],
    tests: [
      {
        name: "a single job exports its items",
        isHidden: false,
        source: `var ex = require("src/takeout/exporter").createExporter();
ex.startJob("j1", "u1");
ex.addItem("j1", { id: "v1", ownerId: "u1" });
ex.addItem("j1", { id: "v2", ownerId: "u1" });
assert.equal(ex.finishJob("j1"), { user: "u1", files: ["v1", "v2"] });`,
      },
      {
        name: "interleaved jobs keep their own items",
        isHidden: false,
        source: `var ex = require("src/takeout/exporter").createExporter();
ex.startJob("j1", "u1");
ex.startJob("j2", "u2");
ex.addItem("j1", { id: "v1", ownerId: "u1" });
ex.addItem("j2", { id: "w1", ownerId: "u2" });
ex.addItem("j1", { id: "v2", ownerId: "u1" });
assert.equal(ex.finishJob("j1"), { user: "u1", files: ["v1", "v2"] }, "u1 must not receive u2's video");
assert.equal(ex.finishJob("j2"), { user: "u2", files: ["w1"] });`,
      },
      {
        name: "another user's item is refused",
        isHidden: true,
        source: `var ex = require("src/takeout/exporter").createExporter();
ex.startJob("j1", "u1");
assert.throws(function () { ex.addItem("j1", { id: "w9", ownerId: "u2" }); }, "wrong owner");
ex.addItem("j1", { id: "v1", ownerId: "u1" });
assert.equal(ex.finishJob("j1"), { user: "u1", files: ["v1"] });`,
      },
      {
        name: "jobs finishing out of order",
        isHidden: true,
        source: `var ex = require("src/takeout/exporter").createExporter();
ex.startJob("j1", "u1");
ex.addItem("j1", { id: "v1", ownerId: "u1" });
ex.startJob("j2", "u2");
ex.addItem("j2", { id: "w1", ownerId: "u2" });
ex.addItem("j2", { id: "w2", ownerId: "u2" });
assert.equal(ex.finishJob("j2"), { user: "u2", files: ["w1", "w2"] });
ex.addItem("j1", { id: "v2", ownerId: "u1" });
assert.equal(ex.finishJob("j1"), { user: "u1", files: ["v1", "v2"] });`,
      },
      {
        name: "finished and unknown jobs throw",
        isHidden: true,
        source: `var ex = require("src/takeout/exporter").createExporter();
ex.startJob("j1", "u1");
ex.finishJob("j1");
assert.throws(function () { ex.finishJob("j1"); }, "already finished");
assert.throws(function () { ex.addItem("nope", { id: "x", ownerId: "u1" }); }, "unknown job");
ex.startJob("j3", "u3");
assert.equal(ex.finishJob("j3"), { user: "u3", files: [] });`,
      },
    ],
    fixedFiles: {
      "src/takeout/exporter.js": `var archive = require("./archive");

exports.createExporter = function () {
  // Every job owns its own item list. One buffer shared by interleaved jobs
  // seals whatever happens to be in it into whichever archive finishes first.
  var jobs = {};
  return {
    startJob: function (jobId, userId) {
      jobs[jobId] = { userId: userId, items: [] };
    },
    addItem: function (jobId, item) {
      var job = jobs[jobId];
      if (!job) throw new Error("unknown job " + jobId);
      // Defence in depth: an archive only ever holds its own user's media.
      if (item.ownerId !== job.userId) throw new Error("item " + item.id + " is not owned by " + job.userId);
      job.items.push(item.id);
    },
    finishJob: function (jobId) {
      var job = jobs[jobId];
      if (!job) throw new Error("unknown job " + jobId);
      delete jobs[jobId];
      return archive.seal(job.userId, job.items);
    }
  };
};
`,
    },
  },

];

/** Title → the company/incident that inspired it (merged into ORIGINS). */
export const WAVE23_ORIGINS: Record<string, string> = {
  "Random Routing, Idle Dynos": "Heroku · 2013",
  "Two Files Named classes.dex": "Android Master Key · 2013",
  "The Folder Called .GIT": "Git · CVE-2014-9390",
  "The Dotless I in Istanbul": "Java · Turkish locale",
  "Nobody Left to Fly Christmas": "American Airlines · 2017",
  "The Backup That Never Took Over": "Tokyo Stock Exchange · 2020",
  "The Reset Mail Sent to a Look-Alike": "Django · CVE-2019-19844",
  "The Username That Changed When Asked Twice": "Spotify · 2013",
  "Your Password, in the Address Bar": "Instagram · 2018",
  "The /24 That Swallowed YouTube": "Pakistan Telecom · 2008",
  "Signed In as Somebody Else": "GitHub · 2021",
  "The Reply Meant for the Last User": "OpenAI · 2023",
  "Listening Everywhere, Asking Nothing": "MongoDB · 2015",
  "Someone Else's Account Page, From Cache": "Steam · 2015",
  "Somebody Else's Videos in My Takeout": "Google Photos · 2019",
};
