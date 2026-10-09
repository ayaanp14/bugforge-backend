import { test } from "node:test";
import assert from "node:assert/strict";
import { DIAGNOSIS_WINDOW_SECS, diagnosisOf, diffLines, incidentOf, patchOf, patchText, severityOf, symptomsOf, targetSecsOf, ticketOf } from "./bug-incident.js";
import { SOURCE_RULES } from "./skill-score.js";

const REPORT = `**BUG-2107** · Priority: Critical · Reported by: support (14 duplicate tickets)

Steps to reproduce:
1. Add "Desk Lamp" ($40.00) ×2 to the cart`;

test("the ticket line every report opens with", () => {
  assert.deepEqual(ticketOf(REPORT), { ticket: "BUG-2107", priority: "Critical", reportedBy: "support (14 duplicate tickets)" });
  assert.deepEqual(ticketOf("**BUG-REVLON** · Priority: Critical (funds) · Reported by: wire operations"), { ticket: "BUG-REVLON", priority: "Critical (funds)", reportedBy: "wire operations" });
  assert.deepEqual(ticketOf("**BUG-1** · Priority: High"), { ticket: "BUG-1", priority: "High", reportedBy: null });
  assert.equal(ticketOf("Users see the wrong total."), null);
  assert.equal(ticketOf(""), null);
});

test("severity from the report's words, else the difficulty — never SEV-1 by guess", () => {
  for (const p of ["Critical", "Critical (child safety)", "Existential", "P0", "Blocker", "Recall-grade"]) assert.equal(severityOf(p, "easy"), "SEV-1", p);
  assert.equal(severityOf("High (privacy)", "easy"), "SEV-2");
  assert.equal(severityOf("Medium", "hard"), "SEV-3");
  assert.equal(severityOf("Everyone", "hard"), "SEV-2");
  assert.equal(severityOf(null, "hard"), "SEV-2");
  assert.equal(severityOf(null, "medium"), "SEV-3");
});

test("the time target is the scorer's par, so 'within target' and pace are one rule", () => {
  for (const d of ["easy", "medium", "hard"] as const) assert.equal(targetSecsOf(d), SOURCE_RULES.bug.parSecs![d]);
  const brief = incidentOf({ bugReport: REPORT, difficulty: "medium", category: "frontend", logs: "console.error: …" });
  assert.equal(brief.targetMins, 20);
  assert.equal(brief.severity, "SEV-1");
  assert.equal(brief.playbook.length, 5);
  assert.match(brief.playbook[2]!, /logs/);
  assert.match(brief.playbook[3]!, /state/);
  assert.doesNotMatch(incidentOf({ bugReport: "x", difficulty: "easy", category: "database", logs: null }).playbook[2]!, /logs/);
});

test("symptoms as stored are made safe", () => {
  assert.equal(symptomsOf(null), null);
  assert.deepEqual(symptomsOf([{ name: "a", passed: true, detail: "" }, { nope: 1 }, { name: "b", passed: "yes" }]), [
    { name: "a", passed: true, detail: "" },
    { name: "b", passed: false, detail: "" },
  ]);
});

const t = (min: number) => new Date(Date.UTC(2026, 9, 9, 10, min));

test("the diagnosis runs from the incident when it was started before the fix", () => {
  const subs = [
    { verdict: "FAILED", submittedAt: t(5) },
    { verdict: "ACCEPTED", submittedAt: t(14) },
    { verdict: "ACCEPTED", submittedAt: t(30) },
  ];
  const d = diagnosisOf({ openedAt: t(0), incidentAt: t(2) }, subs, "medium")!;
  assert.equal(d.from, "incident");
  assert.equal(d.secs, 12 * 60);
  assert.equal(d.withinTarget, true);
  assert.equal(d.attempts, 2);
  assert.deepEqual(d.fixedAt, t(14));
});

test("an incident started after the fix does not reset the clock; practice times from the first open", () => {
  const d = diagnosisOf({ openedAt: t(0), incidentAt: t(40) }, [{ verdict: "ACCEPTED", submittedAt: t(25) }], "easy")!;
  assert.equal(d.from, "opened");
  assert.equal(d.secs, 25 * 60);
  assert.equal(d.withinTarget, false);
});

test("open, untimed and missing", () => {
  const open = diagnosisOf({ openedAt: t(0), incidentAt: null }, [{ verdict: "FAILED", submittedAt: t(3) }], "hard")!;
  assert.equal(open.fixedAt, null);
  assert.equal(open.secs, null);
  assert.equal(open.withinTarget, null);
  assert.equal(open.attempts, 1);
  const longAgo = diagnosisOf({ openedAt: t(0), incidentAt: null }, [{ verdict: "ACCEPTED", submittedAt: new Date(t(0).getTime() + (DIAGNOSIS_WINDOW_SECS + 60) * 1000) }], "hard")!;
  assert.equal(longAgo.secs, null);
  const before = diagnosisOf({ openedAt: t(30), incidentAt: null }, [{ verdict: "ACCEPTED", submittedAt: t(5) }], "hard")!;
  assert.equal(before.secs, null);
  assert.equal(diagnosisOf(null, [], "easy"), null);
});

test("a line diff with context, joined hunks and counts", () => {
  const before = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].join("\n");
  const after = ["a", "b", "C", "d", "e", "f", "g", "h", "i", "j", "k"].join("\n");
  const d = diffLines("x.js", before, after)!;
  assert.equal(d.added, 2);
  assert.equal(d.removed, 1);
  assert.equal(d.hunks.length, 2);
  assert.deepEqual(d.hunks[0]!.lines, [
    { op: " ", text: "a" },
    { op: " ", text: "b" },
    { op: "-", text: "c" },
    { op: "+", text: "C" },
    { op: " ", text: "d" },
    { op: " ", text: "e" },
  ]);
  assert.equal(d.hunks[0]!.oldStart, 1);
  assert.deepEqual(d.hunks[1]!.lines.at(-1), { op: "+", text: "k" });
  assert.equal(diffLines("x.js", "same", "same"), null);
  // Two changes four lines apart share one hunk.
  const close = diffLines("y", "1\n2\n3\n4\n5\n6", "X\n2\n3\n4\n5\nY")!;
  assert.equal(close.hunks.length, 1);
});

test("the patch is the editable files only; a locked file sent back is ignored", () => {
  const files = [
    { filePath: "a.js", content: "let x = 1;\n", isEditable: true },
    { filePath: "lock.js", content: "const K = 2;\n", isEditable: false },
  ];
  const p = patchOf(files, { "a.js": "let x = 2;\n", "lock.js": "hacked" });
  assert.deepEqual(p.files.map((f) => f.file), ["a.js"]);
  assert.equal(p.added, 1);
  assert.equal(patchOf(files, {}).files.length, 0);
  const text = patchText(p);
  assert.match(text, /^--- a\/a\.js\n\+\+\+ b\/a\.js\n@@ -1 \+1 @@\n-let x = 1;\n\+let x = 2;$/);
});
