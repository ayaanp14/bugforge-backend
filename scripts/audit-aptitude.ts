/**
 * Quality gate for the aptitude bank.
 *
 *   npx tsx scripts/audit-aptitude.ts
 *
 * The structural check in seed-aptitude only proves a question is well formed.
 * This one goes after the errors that actually matter in a hand-written bank:
 *
 *  - the marked option disagreeing with the question's own worked solution,
 *    which is the single most damaging mistake possible here;
 *  - duplicated questions, which waste a candidate's time;
 *  - the author's working-out left in the prose;
 *  - options that are not mutually exclusive, or a numeric set out of order.
 */
import { APTITUDE_QUESTIONS } from "./aptitude-data/index.js";
import { validateAptitudeSeed, uncoveredTopics } from "./aptitude-data/types.js";
import { APTITUDE_TOPICS, aptitudeTopic } from "../src/lib/aptitude-topics.js";

const problems: string[] = [];
const warn = (slug: string, message: string) => problems.push(`${slug}: ${message}`);

/** A single number with an optional currency mark and an optional unit. */
const PLAIN_QUANTITY =
  /^₹?-?\d[\d,]*(\.\d+)?\s*(%|km\/h|m\/s|cm²|cm³|m²|m³|km|cm|kg|mm|days?|hours?|hrs?|h|min|minutes?|sec|s|L|litres?|°|marks?|years?)?$/i;

/** Strip markdown emphasis and currency/percent noise so two spellings compare equal. */
const bare = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/[₹,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

for (const p of validateAptitudeSeed(APTITUDE_QUESTIONS)) warn(p.slug, p.problem);

const seenSlug = new Map<string, number>();
const seenPrompt = new Map<string, string>();

for (const q of APTITUDE_QUESTIONS) {
  seenSlug.set(q.slug, (seenSlug.get(q.slug) ?? 0) + 1);

  // A prompt alone is not a question: "Choose the correct sentence:" is shared
  // legitimately across sentence-correction items, whose options differ.
  const promptKey = `${bare(q.prompt)} || ${q.options.map(bare).sort().join(" | ")}`;
  const twin = seenPrompt.get(promptKey);
  if (twin) warn(q.slug, `same prompt as ${twin}`);
  else seenPrompt.set(promptKey, q.slug);

  // The solution must end by naming the answer, and it must be the marked one.
  const tail = q.solution.slice(q.solution.lastIndexOf("Answer:"));
  if (!tail.startsWith("Answer:")) {
    warn(q.slug, "solution never states the answer");
  } else {
    const stated = bare(tail.replace(/^Answer:/, "").replace(/\.$/, ""));
    const keyed = bare(q.options[q.answer]);
    // A stated answer may be phrased more fully than the option ("₹9,000 each"),
    // so containment either way counts as agreement.
    if (!stated.includes(keyed) && !keyed.includes(stated)) {
      warn(q.slug, `solution says "${stated}" but option ${q.answer} is "${keyed}"`);
    }
    // The working must actually arrive at the answer it states. A final line
    // agreeing with the key while the steps compute something else is the one
    // error the check above cannot see.
    const working = bare(q.solution.slice(0, q.solution.lastIndexOf("Answer:")));
    // Trailing full stops are sentence punctuation, not part of the number.
    const numeric = keyed.match(/-?\d[\d.]*/g)?.map((n) => n.replace(/\.+$/, ""));
    if (numeric && working && !numeric.every((n) => working.includes(n))) {
      warn(q.slug, `the working never reaches "${keyed}"`);
    }
  }

  const prose = [q.solution, q.approach, ...q.hints].join("\n");
  // Self-correction phrasing only. Plain "recompute" is legitimate advice, so
  // the pattern looks for the author talking to themselves mid-solution.
  // Two exclusions are deliberate, both learned from false positives:
  //   - "so I" is not matched, because syllogism solutions name conclusion I;
  //   - "wait," is only matched when it opens a sentence, because the deadlock
  //     conditions are "mutual exclusion, hold and wait, no preemption ...".
  if (/(\bRechecking\b|\bRe-reading\b|\bRecomputing step\b|\bCareful:|\bAdding again\b|(^|[.!?]\s+|\n)wait,|\bhmm\b|so recompute|\blet me\b|\bI made a\b)/im.test(prose)) {
    warn(q.slug, "working-out left in the prose");
  }

  // Numeric option sets read as ascending in every real paper.
  // Only plain quantities. Fractions ("9/10"), ratios ("18 : 17") and phrases
  // are ordered by meaning rather than by magnitude, so they are exempt.
  const values = q.options.map((option) => {
    const text = option.trim();
    if (!PLAIN_QUANTITY.test(text)) return null;
    const value = Number(text.replace(/[₹,\s]/g, "").replace(/[^\d.\-].*$/, ""));
    return Number.isFinite(value) ? value : null;
  });
  if (values.every((v) => v !== null)) {
    const ordered = [...(values as number[])].sort((a, b) => a - b);
    if (!(values as number[]).every((v, i) => v === ordered[i])) warn(q.slug, "numeric options are not in ascending order");
  }

  if (!aptitudeTopic(q.topic)) warn(q.slug, `unknown topic ${q.topic}`);
}

for (const [slug, count] of seenSlug) if (count > 1) warn(slug, `slug used ${count} times`);

/* ── coverage ─────────────────────────────────────────────────────── */

const perTopic = new Map<string, number>();
for (const q of APTITUDE_QUESTIONS) perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
const answerSpread = [0, 0, 0, 0, 0, 0];
for (const q of APTITUDE_QUESTIONS) answerSpread[q.answer] += 1;

console.log(`${APTITUDE_QUESTIONS.length} questions`);
for (const topic of APTITUDE_TOPICS) {
  const n = perTopic.get(topic.id) ?? 0;
  console.log(`  ${topic.id.padEnd(28)} ${String(n).padStart(4)}${n === 0 ? "  ← empty" : ""}`);
}
const missing = uncoveredTopics(APTITUDE_QUESTIONS);
if (missing.length) console.log(`uncovered: ${missing.join(", ")}`);
console.log(`answer position 0..5: ${answerSpread.join(", ")}`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log("\nno problems found");
