/**
 * How much of a candidate's code is somebody else's — specifically, the
 * editorial solution the catalogue publishes for the same problem.
 *
 * A skill test's coding section draws from the public catalogue, whose
 * editorial tab shows a reference solution in every language. A candidate
 * who opens it in another tab and copies it out passes every case; this is
 * how grading notices. It is deliberately simple — winnowing-free k-gram
 * containment over a token stream with comments and layout removed — because
 * it only ever raises a flag for a person to look at, never decides
 * anything, and the case it exists for — the editorial copied out — keeps
 * the editorial's own names.
 *
 * Identifiers are kept: normalising them would make every textbook two-sum
 * look like every other, and the editorial is one specific text.
 */

const COMMENTS: Record<string, RegExp> = {
  python: /#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''/g,
  ruby: /#[^\n]*|=begin[\s\S]*?=end/g,
};
const C_LIKE_COMMENTS = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

const TOKEN = /[A-Za-z_$][A-Za-z0-9_$]*|\d+(?:\.\d+)?|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|[^\sA-Za-z0-9_$]/g;

/** Below this many tokens there is too little code to say anything. */
export const MIN_TOKENS = 30;
const K = 5;

export function tokenize(code: string, language: string): string[] {
  const stripped = code.replace(COMMENTS[language] ?? C_LIKE_COMMENTS, " ");
  return stripped.match(TOKEN) ?? [];
}

function grams(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + K <= tokens.length; i += 1) out.add(tokens.slice(i, i + K).join(" "));
  return out;
}

/**
 * The share (0–1) of the candidate's k-grams that also appear in the
 * reference. Containment rather than Jaccard: a copied solution with a
 * helper of the candidate's own around it is still the editorial.
 */
export function similarity(candidate: string, reference: string, language: string): number {
  const mine = tokenize(candidate, language);
  const theirs = tokenize(reference, language);
  if (mine.length < MIN_TOKENS || theirs.length < MIN_TOKENS) return 0;
  const a = grams(mine);
  const b = grams(theirs);
  if (a.size === 0) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return Math.round((shared / a.size) * 1000) / 1000;
}
