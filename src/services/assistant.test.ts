import { test } from "node:test";
import assert from "node:assert/strict";
import { briefingIndex, goalLines } from "./assistant.js";
import type { DashboardPlan, OnboardingState } from "../lib/onboarding.js";
import { freeForAll } from "../lib/plans.js";
import type { RoadDefinition } from "./roadmap.js";
import { isFollowUp, pickChunks, PICK_CHARS, renderChunks } from "../lib/assistant-index.js";

/**
 * What the assistant is handed, question by question: for each question a
 * person might ask, the briefing picked for it must contain the sentence that
 * answers it — the handbook's words, the generated plan table or the road.
 * The pick is capped (lib/assistant-index) so a message stays small; this is
 * what proves the cap still leaves the answer in. When a handbook edit moves
 * or rewords an answer, update its pattern here; when it pushes an answer
 * out, split the bullet or add an alias rather than raising the cap.
 *
 * Run with: npm test
 */

// The road as seeded (scripts/roadmap-data.ts): the real tiers and stages,
// placeholder problem titles.
const STAGES: Array<[string, string, string, number]> = [
  ["Arrays 101", "Indexing, running totals, single passes — the habits every later stage relies on.", "foundations", 6],
  ["Hashing", "Trade memory for time: counting, lookups and the one-pass two-sum.", "foundations", 6],
  ["Strings", "Scanning, building and comparing text without allocating your way out of it.", "foundations", 6],
  ["Two Pointers", "Two indices, one pass: the technique behind most sorted-array problems.", "foundations", 6],
  ["Sliding Window", "Grow and shrink a window over the input instead of restarting the scan.", "foundations", 6],
  ["Prefix Sums", "Precompute once, answer range questions in constant time.", "foundations", 6],
  ["Stacks", "Last in, first out — matching, evaluating and the monotonic stack.", "core", 6],
  ["Binary Search", "Halve the space every step — on arrays, on answers, on rotated inputs.", "core", 6],
  ["Sorting & Greedy", "Order the input, then take the locally best step and prove it holds.", "core", 6],
  ["Intervals", "Sort by start, sweep, merge — the pattern behind every scheduling question.", "core", 6],
  ["Heaps", "Keep the k best in reach: priority queues for top-k, scheduling and streams.", "core", 6],
  ["Matrix & Grids", "Two-dimensional indexing, in-place transforms and the first grid walks.", "core", 6],
  ["Bit Manipulation", "Masks, shifts and XOR tricks — small problems with elegant answers.", "advanced", 6],
  ["Recursion & Backtracking", "Build the answer one choice at a time and undo the ones that fail.", "advanced", 6],
  ["Graphs: BFS & DFS", "Islands, rooms and reachability — the two traversals every graph question starts from.", "advanced", 6],
  ["Graphs: Advanced", "Topological order, union-find, shortest paths and spanning trees.", "advanced", 6],
  ["Dynamic Programming I", "One-dimensional state: stairs, robbers, coins and the longest increasing run.", "mastery", 6],
  ["Dynamic Programming II", "Grids and two strings: paths, edit distance, subsequences and palindromes.", "mastery", 6],
  ["Capstone", "Hard problems only. Clear four of these and the road is yours.", "mastery", 4],
];

const road: RoadDefinition = {
  tiers: [
    { id: "foundations", title: "Foundations", blurb: "Arrays, hashing, strings and the two-pointer family. Everything after this assumes them.", rewardXp: 30, interviewCredits: 1 },
    { id: "core", title: "Core techniques", blurb: "The data structures and search patterns most interview rounds are built on.", rewardXp: 50, interviewCredits: 1 },
    { id: "advanced", title: "Advanced", blurb: "Bits, recursion and graphs — where the harder rounds start.", rewardXp: 80, interviewCredits: 2 },
    { id: "mastery", title: "Mastery", blurb: "Dynamic programming and the capstone: the problems that decide the final round.", rewardXp: 100, interviewCredits: 3 },
  ],
  stages: STAGES.map(([title, blurb, tier, required], i) => ({
    id: `s${i}`,
    key: `s${i}`,
    title,
    blurb,
    tier,
    icon: "layers",
    required,
    problems: Array.from({ length: 8 }, (_, n) => ({ id: `p${i}-${n}`, slug: `p${i}-${n}`, title: `P${i}x${n}`, difficulty: "easy" })),
  })),
};

const index = briefingIndex(road);
const briefingFor = (question: string, previous: string | null = null) => renderChunks(pickChunks(index, question, previous));

// [question, what the picked briefing must contain, the previous question]
const QUESTIONS: Array<[string, RegExp, string?]> = [
  ["how much does the pro plan cost", /\*\*Pro\*\* — /],
  ["is there a free plan, what do I get", /Free forever/],
  ["what happens if I leave a duel midway", /Walking away/],
  ["my opponent disconnected in a duel, what now", /Claim the win/],
  ["what happens if I take a screenshot in a duel", /Print Screen/],
  ["how much xp does winning a duel give", /easy 40, medium 60, hard 90/],
  ["what is in the first chest", /\+30 XP/],
  ["how do I clear a roadmap stage", /usually 6 of 8/],
  ["I forgot my password", /Forgot password/],
  ["how long does the verification code last", /Codes live \*\*5 minutes\*\*/],
  ["can I delete my account", /Deleting an account/],
  ["is there a dark mode", /dark mode toggle/],
  ["how is my streak counted", /counted in Indian time/],
  ["my streak broke yesterday why", /lapsed streak/],
  ["how many mock interviews do I get per week", /mock interviews (per|a) week/],
  ["does an abandoned interview count against my allowance", /abandoned before any answer costs nothing/],
  ["how many questions are in a written interview", /7 questions/],
  ["can the voice interviewer speak hindi", /Hinglish/],
  ["what file types can I upload to the resume analyzer", /PDF or DOCX/],
  ["how is the ATS score calculated", /keyword match \(25\)/],
  ["how do I get a java certificate", /verifiable CodeKairo credential/],
  ["what is the pass mark for a skill test", /\*\*60%\*\* passes/],
  ["can I retake a skill test I failed", /\*\*7 days\*\*/],
  ["how do I add my skill test certificate to linkedin", /Add to LinkedIn/],
  ["how do I remove the certification frame from my profile picture", /Certifications\*\* section of/],
  ["how long is the TCS NQT test", /TCS NQT — Foundation: 75 min/],
  ["does the tech mahindra test have negative marking", /−0\.25 per wrong/],
  ["can I go back to a section after finishing it in a placement test", /cannot be reopened/],
  ["how do study plans work", /language taught in depth/],
  ["how do i get a certificate for java", /study-plans\/<track>\/certificate/],
  ["which java version runs the study plan exercises", /OpenJDK 18/],
  ["when does the daily contest problem change", /05:30 IST/],
  ["how is time penalty counted in the daily contest", /5 minutes per wrong submission/],
  ["do I get xp for solving the daily contest", /Every solver of the day gets \*\*20 XP\*\*/],
  ["what do the fastest solvers of the daily contest win", /\*\*fastest\*\* on the day's board gets \*\*\+15\*\*/],
  ["how does the bug hunt daily limit work", /distinct hunts submitted per IST day/],
  ["how much xp for fixing a bug", /\*\*50 XP\*\*/],
  ["can I practice with a friend live", /2 to 4 people/],
  ["who gets credit when we submit in a pair room", /Submissions credit the host/],
  ["how do I contact support about a refund", /support@codekairo\.com/],
  ["how can I host a coding contest for my college", /create an \*\*organization\*\*/],
  ["how is penalty time counted in an ICPC style contest", /20 per rejected attempt/],
  ["can I delete or edit my tournament on battles after publishing", /\*\*deleted until it starts\*\*/],
  ["what are the ranks", /Novice\*\* 0–99/],
  ["does rating start at 1200", /starts at \*\*0\*\*/],
  ["which programming languages are supported", /13 programming languages/],
  ["why does optional chaining fail in my javascript submission", /Node 12/],
  ["how do I share my win on linkedin", /LinkedIn does not let a site fill/],
  ["how many badges are there", /19 achievement badges/],
  ["can I show my github contributions on my profile", /Connect GitHub/],
  ["does codekairo store my github token", /keeps no GitHub token/],
  ["can other people see my profile", /Public profile — `\/u\/<username>`/],
  ["can someone else see the code I submitted", /the \*\*code\*\* of any submission/],
  ["will my subscription auto renew", /No auto-renewal/],
  ["what happens if I upgrade in the middle of a plan", /\*\*Upgrading\*\*/],
  ["can I post a poll in the community", /\*\*poll\*\* \(2–4 options/],
  ["what time does the streak reminder come", /18:00 and 20:00 IST/],
  ["does the site work on my phone", /web app/],
  ["what are the aptitude categories", /Quantitative Aptitude/],
  ["does aptitude practice give xp", /Aptitude practice pays no XP/],
  ["where can I see my old interviews", /mock-interview\/history/],
  ["where is the list of array problems", /challenges\/arrays/],
  ["how many problems are there", /More than 1,500 published/],
  ["how many hints does an aptitude question have", /up to four/],
  ["how do I change what I am preparing for", /shows it with a \*\*Change\*\* button/],
  ["I skipped the welcome question, can I answer it later", /\*\*Tell us\*\* if you skipped/],
  ["do the plan steps tick automatically", /Steps tick themselves/],
  ["what does the weekly digest contain", /one suggestion for what you said you are preparing for/],
  ["how is my skill score calculated", /each problem, hunt or question counts once/],
  ["why is my arrays skill stuck at 55%", /easy work alone can never take a skill past 55%/],
  ["does opening the hints lower my skill", /opening the hints first counts 0\.6/],
  ["when should I review a topic again", /review schedule of 2, 7, 21, 45 and 90 days/],
  ["how is my daily mission chosen", /in this order of priority: a problem you left a draft on/],
  ["can I change how much time I have today", /sets the time you have — 15 minutes to 4 hours/],
  ["how do I mark a tutorial done in my mission", /\*\*Mark done\*\*, because reading leaves no record/],
  ["can I skip roadmap stages I already know", /already rates every uncleared stage before one \*strong\*/],
  ["what is my route on the roadmap", /signed-in members see the order to work in/],
  ["why did I get a skill review notification", /when a skill on your skill profile is \*\*due for review\*\*/],
  ["why did my submission fail", /gets an explanation in a \*\*Code Review\*\* tab/],
  ["does the AI see the hidden test cases when it reviews my code", /It never sees the hidden test cases/],
  ["why is there no code review on the daily contest problem", /the AI part is held back/],
  ["how ready am I for TCS", /how much of what a target company asks you have shown/],
  ["how is my placement readiness calculated", /each section read against your skill in exactly what it tests/],
  ["can I set the date of my placement drive", /Add the drive or interview date and press \*\*Save as my target\*\*/],
  ["does my placement target change my daily mission", /the mission leans toward the area of readiness with most to gain/],
  ["what is a company simulation", /a company's whole process practised as one run/],
  ["can I give my drive date when I answer what I'm preparing for", /\*\*When is your drive or interview\?\*\*/],
  ["what is the Try item in my mission", /one item named \*\*Try\*\* may appear for something you have never used/],
  ["does a simulation count toward my weekly interview limit", /every interview round counts toward your weekly interview allowance like any other/],
  ["how are my interview skills measured", /\*\*Interviews\*\* is your mock-interview answers by the kind of question/],
  ["why is there a TCS mock in today's mission", /the company's mock test \(on a day of 2 hours or more/],
  ["how does the tutor work", /answers at one of seven rungs and never above it/],
  ["does using the tutor lower my skill score", /Approach, Complexity and Hint count like opening the problem.s hints/],
  ["why is the tutor off on the daily contest problem", /When the tutor is off/],
  ["can the tutor just give me the code", /does not climb, and code is held back below Pseudocode/],
  // Phase 6: bug hunts as incidents.
  ["what is the postmortem on a bug hunt", /scores it out of 100 against your accepted patch/],
  ["how is my bug hunt diagnosis time measured", /\*\*diagnosis time\*\* is from that start/],
  ["what does SEV-1 mean on a bug hunt", /SEV-1 critical, SEV-2 major, SEV-3 minor/],
  ["why did my bug fix fail", /passed on the shipped build but fails with your patch/],
  ["what does Likely mean in the failure explanation", /\*\*Likely\*\* \(a reading of it\)/],
  // Follow-ups: the answer is only reachable through the previous question.
  ["how long does it last?", /expires after \*\*2 hours\*\*/, "how do private duel rooms work"],
  ["and elite?", /\*\*Elite\*\* — /, "how much does the pro plan cost"],
  ["what about points?", /easy 3, medium 4, hard 5/, "how does the daily contest work"],
  ["can I choose the voice?", /Kate/, "tell me about the voice interview"],
  ["is it free?", /free on every plan/, "how do study plans work"],
  ["how many do I get on free?", /\*\*Free\*\* — free/, "how do bonus interviews work"],
  ["what if I refresh?", /refresh or a dropped connection costs nothing/, "how long can a duel go on"],
  // Topic switches: a previous question about something else must not crowd out the new one.
  ["is there a dark mode", /dark mode toggle/, "how much does the pro plan cost per month"],
  ["I forgot my password", /Forgot password/, "what happens if my opponent leaves a duel"],
  ["what are the ranks", /Novice\*\* 0–99/, "how do I upload my resume"],
  ["how long is the TCS NQT test", /TCS NQT — Foundation: 75 min/, "can I choose the voice of the interviewer"],
  ["dark mode?", /dark mode toggle/, "how much does the pro plan cost per month in rupees"],
];

for (const [question, answer, previous] of QUESTIONS) {
  test(`"${question}"${previous ? ` after "${previous}"` : ""} is handed its answer`, () => {
    const text = briefingFor(question, previous ?? null);
    assert.match(text, answer, `picked: ${[...new Set(pickChunks(index, question, previous ?? null).map((c) => c.section))].join(" · ")}`);
  });
}

test("a pick stays small: inside the budget, ~3.4 KB on average (it was ~6.7 KB)", () => {
  const sizes = QUESTIONS.map(([q, , prev]) => briefingFor(q, prev ?? null).length);
  // renderChunks drops repeated headings, so the rendered text is never over the chunks' own budget.
  assert.ok(Math.max(...sizes) <= PICK_CHARS, `largest ${Math.max(...sizes)}`);
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  assert.ok(mean < 4000, `mean ${Math.round(mean)} chars — the picks are growing; look for a bullet that has become a wall`);
});

test("a standalone question ignores the one before it", () => {
  const alone = pickChunks(index, "is there a dark mode", null).map((c) => c.id);
  assert.deepEqual(pickChunks(index, "is there a dark mode", "how much does the pro plan cost").map((c) => c.id), alone);
});

test("a question with no words of its own leans on the previous one", () => {
  assert.deepEqual(pickChunks(index, "why?", null), []);
  assert.ok(pickChunks(index, "why?", "what happens if I leave a duel").some((c) => c.section.startsWith("Duels")));
});

test("follow-ups are told apart from new questions", () => {
  for (const q of ["and elite?", "what about points?", "how long does it last?", "is it free?", "Also, can I pause?", "what if I refresh?"]) {
    assert.equal(isFollowUp(q), true, q);
  }
  for (const q of ["is there a dark mode", "how do I reset my password", "what happens to my streak if I miss a day and then solve two problems"]) {
    assert.equal(isFollowUp(q), false, q);
  }
});

// While the free-for-all period runs (lib/plans FREE_FOR_ALL_UNTIL) the plan
// table opens with the offer, and "is everything free?" must land on it —
// skipped once the period is over, when the paragraph is gone by design.
test("\"is everything free right now\" is handed the free-for-all paragraph while it runs", { skip: !freeForAll().active && "the free-for-all period is over" }, () => {
  for (const q of ["is everything free right now", "why is the pro plan free", "can I buy a plan", "when does the free period end"]) {
    assert.match(briefingFor(q), /Free for everyone until 1 January 2027/, q);
  }
});

// The account block's goal lines (services/assistant.ts goalLines): what the
// member said they are preparing for, and the next undone step of the plan.
const state = (over: Partial<OnboardingState>): OnboardingState => ({ goal: null, level: null, details: {}, answeredAt: null, ask: "welcome", ...over });
const steps = (done: boolean[]): DashboardPlan["steps"] =>
  done.map((d, i) => ({ key: `k${i}`, title: `Step ${i + 1}`, detail: `Why ${i + 1}.`, href: `/s${i + 1}`, done: d }));

test("an account that has not answered is pointed at /welcome and the profile", () => {
  for (const s of [state({}), state({ answeredAt: "2026-10-06T00:00:00.000Z", ask: null })]) {
    const lines = goalLines(s, null);
    assert.match(lines.preparingFor, /^not said yet/);
    assert.match(lines.preparingFor, /\(\/welcome\)/);
    assert.match(lines.preparingFor, /\(\/profile\)/);
    assert.equal(lines.nextStepOfTheirPlan, undefined);
  }
});

test("an answer names the goal, companies or language and level, then the plan's next undone step", () => {
  const placements = state({ goal: "placements", level: "some", details: { companies: ["TCS", "Infosys"] }, answeredAt: "x", ask: null });
  const lines = goalLines(placements, { goal: "placements", level: "some", details: {}, steps: steps([true, false, false]) });
  assert.match(lines.preparingFor, /^campus placements, target companies TCS, Infosys; has solved a few/);
  assert.equal(lines.nextStepOfTheirPlan, '[Step 2](/s2) — Why 2. (1 of 3 steps of "Your plan" on the home page done)');

  const language = goalLines(state({ goal: "language", details: { language: "cpp" }, answeredAt: "x", ask: null }), null);
  assert.match(language.preparingFor, /^learning a language \(C\+\+\); changeable/);
  assert.equal(language.nextStepOfTheirPlan, undefined);
});

test("a plan built for another goal is not quoted, and a finished one says so", () => {
  const product = state({ goal: "product", answeredAt: "x", ask: null });
  assert.equal(goalLines(product, { goal: "placements", level: null, details: {}, steps: steps([false]) }).nextStepOfTheirPlan, undefined);
  assert.match(goalLines(product, { goal: "product", level: null, details: {}, steps: steps([true, true]) }).nextStepOfTheirPlan ?? "", /^all 2 steps/);
});
