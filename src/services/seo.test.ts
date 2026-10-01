import { test } from "node:test";
import assert from "node:assert/strict";
import { contentCardFor, contentCardUrl, lessonFaq, summarise, titles, trackDescription } from "./seo.js";

// The meta description of every content page — a problem statement, a bug
// report, a lesson — comes through here, and the SPA's lib/seo/summary is
// the same function. Pin the behaviour both must share.

test("a short text is returned whole, markup stripped", () => {
  assert.equal(summarise("Given `nums`, return **indices**."), "Given nums, return indices.");
  assert.equal(summarise("", "fallback"), "fallback");
});

test("whole sentences up to the limit, ending on one", () => {
  const out = summarise("The first sentence is here and it has some length to it. The second sentence follows the first one closely. The third one is long enough to push the total past the limit of the description by a comfortable margin, surely.");
  assert.equal(out, "The first sentence is here and it has some length to it. The second sentence follows the first one closely.");
});

test("a decimal, a version or an abbreviation is not a sentence boundary", () => {
  const text = "Add a Desk Lamp ($40.00) to the cart and the total goes NEGATIVE on larger carts, e.g. with three items. It shows $0.00 in staging but a small positive number in prod. More words follow here to make the text longer than the limit allows for.";
  const out = summarise(text);
  assert.ok(out.startsWith("Add a Desk Lamp ($40.00) to the cart"), out);
  assert.ok(out.endsWith("."), out);
  assert.ok(out.length <= 158, String(out.length));
});

test("one long sentence is cut on a word with an ellipsis", () => {
  const out = summarise("word ".repeat(80).trim() + ".");
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 158);
});

/*
 * The title templates. The SPA's src/lib/seo/titles.ts holds the same
 * functions and its e2e suite compares a rendered page's title with the
 * HTML the edge served; these pin the shapes so a change here is a
 * deliberate one made in both places.
 */
test("every content page kind has a title with its intent first and the brand where it fits", () => {
  assert.equal(titles.problem("Two Sum", "Easy"), "Two Sum — Easy Problem & Solution — CodeKairo");
  assert.equal(titles.topicHub("Arrays", 343), "Arrays Coding Problems: 343 Questions with Solutions");
  assert.equal(titles.companyHub("TCS", 57), "TCS Coding Interview Questions: 57 Tagged Problems");
  assert.equal(titles.bugHunt("The Checkout Meltdown", "JavaScript"), "The Checkout Meltdown — JavaScript Bug Hunt — CodeKairo");
  assert.equal(titles.bugHub("JavaScript", 105, "language"), "JavaScript Debugging Practice: 105 Bug Hunts on Real Code");
  assert.equal(titles.bugHub("Database", 29, "category"), "Database Bug Hunts: 29 Debugging Challenges — CodeKairo");
  assert.equal(titles.aptitudeCategory("Quantitative Aptitude", 517), "517 Quantitative Aptitude Questions with Solutions");
  assert.equal(titles.aptitudeTopic("Percentages"), "Percentages Aptitude Questions with Solutions — CodeKairo");
  assert.equal(titles.aptitudeQuestion("Remainder of a large power", "Number System"), "Remainder of a large power — Number System Aptitude Question");
  assert.equal(titles.studyTrack("Java", 138), "Learn Java: Free Java Tutorial in 138 Lessons — CodeKairo");
  assert.equal(titles.studyLesson("Records", "Java", false), "Records — Java lesson — CodeKairo");
  assert.equal(titles.studyLesson("Module test", "Java", true), "Module test — Java checkpoint — CodeKairo");
  // A lesson with an authored search title is titled by it alone.
  assert.equal(titles.studyLesson("JDK, JRE and JVM — the three layers", "Java", false, "What Is the JVM? JDK vs JRE vs JVM Explained"), "What Is the JVM? JDK vs JRE vs JVM Explained — CodeKairo");
  assert.equal(titles.studyLesson("Records", "Java", false, null), "Records — Java lesson — CodeKairo");
  assert.equal(titles.test("TCS NQT — Foundation", "TCS"), "TCS NQT — Foundation Mock Test — CodeKairo");
  assert.equal(titles.test("Foundation", "Infosys"), "Foundation Mock Test — Infosys Pattern — CodeKairo");
  assert.equal(titles.skillTest("Java", "Basic"), "Java Certification Test (Basic) — CodeKairo");
  // The longest skill still fits the 60-character budget, without the brand.
  assert.equal(titles.skillTest("Problem Solving (DSA)", "Intermediate"), "Problem Solving (DSA) Certification Test (Intermediate)");
});

test("a track's description fits a results page and the SPA's copy of it", () => {
  const d = trackDescription("Java", 20, 138, "OpenJDK 18");
  assert.equal(d, "Learn Java free: 138 lessons in 20 modules, from first programs to interview questions, with exercises judged on OpenJDK 18 and a certificate.");
  // The longest runtime name the tracks use still fits.
  assert.ok(trackDescription("JavaScript", 16, 96, "Clang 18 · C++20").length <= 160);
});

test("a lesson's FAQ is its direct answer first, then its common questions", () => {
  assert.deepEqual(lessonFaq(null), {});
  assert.deepEqual(lessonFaq({ title: "t", description: "d", question: null, answer: null, faq: [] }), {});
  assert.deepEqual(lessonFaq({ title: "t", description: "d", question: "What is the JVM?", answer: "A machine.", faq: [{ q: "Why?", a: "Because." }] }), {
    faq: [
      { q: "What is the JVM?", a: "A machine." },
      { q: "Why?", a: "Because." },
    ],
  });
});

/*
 * The content pages' link-preview cards (lib/content-card): drawn from the
 * page's own head, only for the five kinds that have one, at an address the
 * SPA's lib/content-card rebuilds from the path alone.
 */
test("a content page's preview card says what its head says, and hubs keep the site's card", () => {
  type Head = Parameters<typeof contentCardFor>[1];
  const problem = { path: "/problems/two-sum", title: titles.problem("Two Sum", "Easy"), description: "", crumb: "Two Sum", facts: { difficulty: "Easy", keywords: ["Array", "Hash Table", "Math"] } } as Head;
  const card = contentCardFor("/problems/two-sum", problem);
  assert.equal(card?.kind, "problem");
  assert.equal(card?.title, "Two Sum");
  assert.equal(card?.eyebrow, "Easy · Array · Hash Table");
  const lesson = { path: "/study-plans/java/if-else", title: titles.studyLesson("if, else", "Java", false, "Java If-Else Statements"), description: "", crumb: "if, else", facts: { language: "Java", minutes: 12 } } as Head;
  assert.equal(contentCardFor("/study-plans/java/if-else", lesson)?.title, "Java If-Else Statements");
  const hub = { path: "/challenges/arrays", title: "Arrays", description: "" } as Head;
  assert.equal(contentCardFor("/challenges/arrays", hub), null);
  assert.equal(contentCardFor("/bug-hunts/javascript", { ...hub, path: "/bug-hunts/javascript" }), null);
  assert.match(contentCardUrl("/problems/two-sum"), /\/api\/seo\/card\.png\?path=%2Fproblems%2Ftwo-sum&d=1$/);
});

test("the brand is added only where the whole title fits in 60 characters", () => {
  const long = titles.problem("Find First and Last Position of Element in Sorted Array", "Medium");
  assert.equal(long, "Find First and Last Position of Element in Sorted Array — Medium Problem & Solution");
  for (const t of [titles.problem("Two Sum", "Easy"), titles.test("Foundation", "Infosys"), titles.aptitudeTopic("Percentages")]) {
    assert.ok(t.endsWith(" — CodeKairo") && t.length <= 60, t);
  }
});

test("two aptitude questions of one topic never share a title", () => {
  assert.notEqual(titles.aptitudeQuestion("Successive discounts", "Percentages"), titles.aptitudeQuestion("Percentage points", "Percentages"));
});
