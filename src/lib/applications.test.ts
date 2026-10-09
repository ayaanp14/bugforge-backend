import { test } from "node:test";
import assert from "node:assert/strict";
import { APPLICATION_LIMITS, linksFor, parseApplication, summaryOf } from "./applications.js";

const NOW = Date.UTC(2026, 9, 9, 12);

test("a new application needs a company and a role, and starts as applied", () => {
  assert.deepEqual(parseApplication({ role: "SDE" }, false, NOW), { error: "Give the company." });
  assert.deepEqual(parseApplication({ company: "TCS", role: "  " }, false, NOW), { error: "Give the role." });
  const ok = parseApplication({ company: "  TCS ", role: "Ninja   fresher", nextOn: "2026-10-20", link: "https://nextstep.tcs.com/x" }, false, NOW);
  assert.ok("data" in ok);
  assert.equal(ok.data.company, "TCS");
  assert.equal(ok.data.role, "Ninja fresher");
  assert.equal(ok.data.stage, "applied");
  assert.equal(ok.data.nextOn?.toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(ok.data.link, "https://nextstep.tcs.com/x");
  assert.equal(ok.data.notes, null);
});

test("fields are checked: stage and source from their lists, dates as days, links only http(s)", () => {
  assert.ok("error" in parseApplication({ company: "A", role: "B", stage: "hired" }, false, NOW));
  assert.ok("error" in parseApplication({ company: "A", role: "B", source: "linkedin" }, false, NOW));
  assert.ok("error" in parseApplication({ company: "A", role: "B", nextOn: "20/10/2026" }, false, NOW));
  assert.ok("error" in parseApplication({ company: "A", role: "B", nextOn: "2040-01-01" }, false, NOW));
  assert.deepEqual(parseApplication({ company: "A", role: "B", link: "javascript:alert(1)" }, false, NOW), { error: "The link must start with https://." });
  assert.ok("error" in parseApplication({ company: "x".repeat(APPLICATION_LIMITS.company + 1), role: "B" }, false, NOW));
  assert.ok("error" in parseApplication({ company: "A", role: "B", notes: "n".repeat(APPLICATION_LIMITS.notes + 1) }, false, NOW));
});

test("an edit takes only what was sent; nothing sent is refused", () => {
  const edit = parseApplication({ stage: "interviewing", nextOn: null }, true, NOW);
  assert.ok("data" in edit);
  assert.deepEqual(Object.keys(edit.data).sort(), ["nextOn", "stage"]);
  assert.equal(edit.data.nextOn, null);
  assert.deepEqual(parseApplication({}, true, NOW), { error: "Nothing to change." });
  assert.deepEqual(parseApplication({ company: "" }, true, NOW), { error: "Give the company." });
});

test("a row links to readiness and a simulation only for a company the site knows, loosely matched", () => {
  const known = [{ name: "TCS" }, { name: "HCL" }, { name: "Amazon" }];
  const sims = [{ slug: "tcs", company: "TCS" }];
  assert.deepEqual(linksFor("tcs ", known, sims), { company: "TCS", readiness: "/readiness?company=TCS", simulation: "/simulations/tcs" });
  assert.deepEqual(linksFor("HCLTech", known, sims), { company: "HCL", readiness: "/readiness?company=HCL", simulation: null });
  assert.deepEqual(linksFor("Tiny Startup", known, sims), { company: null, readiness: null, simulation: null });
  assert.deepEqual(linksFor("!!!", known, sims), { company: null, readiness: null, simulation: null });
});

test("the summary counts stages and lists the open applications' next dates, soonest first", () => {
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  const rows = [
    { id: "a", company: "TCS", role: "Ninja", stage: "assessment", nextOn: d("2026-10-12"), nextLabel: "NQT" },
    { id: "b", company: "Amazon", role: "SDE", stage: "interviewing", nextOn: d("2026-10-09"), nextLabel: "Round 2" },
    { id: "c", company: "Infosys", role: "SE", stage: "rejected", nextOn: d("2026-10-10"), nextLabel: null },
    { id: "e", company: "Wipro", role: "PE", stage: "applied", nextOn: d("2026-10-01"), nextLabel: "past" },
    { id: "f", company: "Zoho", role: "MTS", stage: "saved", nextOn: null, nextLabel: null },
  ];
  const s = summaryOf(rows, NOW);
  assert.equal(s.total, 5);
  assert.equal(s.byStage.rejected, 1);
  assert.equal(s.byStage.offer, 0);
  assert.deepEqual(s.upcoming.map((u) => [u.id, u.daysLeft]), [["b", 0], ["a", 3]]);
});
