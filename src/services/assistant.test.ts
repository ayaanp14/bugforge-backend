import { test } from "node:test";
import assert from "node:assert/strict";
import { briefingIndex } from "./assistant.js";
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
  ["how long is the TCS NQT test", /TCS NQT — Foundation: 75 min/],
  ["does the tech mahindra test have negative marking", /−0\.25 per wrong/],
  ["can I go back to a section after finishing it in a placement test", /cannot be reopened/],
  ["how do study plans work", /language taught in depth/],
  ["how do i get a certificate for java", /study-plans\/<track>\/certificate/],
  ["which java version runs the study plan exercises", /OpenJDK 18/],
  ["when does the daily contest problem change", /05:30 IST/],
  ["how is time penalty counted in the daily contest", /5 minutes per wrong submission/],
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
  ["will my subscription auto renew", /No auto-renewal/],
  ["what happens if I upgrade in the middle of a plan", /\*\*Upgrading\*\*/],
  ["can I post a poll in the community", /\*\*poll\*\* \(2–4 options/],
  ["what time does the streak reminder come", /18:00 and 20:00 IST/],
  ["does the site work on my phone", /web app/],
  ["what are the aptitude categories", /Quantitative Aptitude/],
  ["does aptitude practice give xp", /Aptitude practice pays no XP/],
  ["where can I see my old interviews", /mock-interview\/history/],
  ["where is the list of array problems", /challenges\/arrays/],
  ["how many problems are there", /Around 600 published/],
  ["how many hints does an aptitude question have", /up to four/],
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
