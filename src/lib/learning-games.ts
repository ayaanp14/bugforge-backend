/**
 * Learning games (2026-11-14, the owner: "well animated, not too much
 * content, animation-based learning and games-based learning"). A game is a
 * fenced block in any teaching page — a CS note, a roadmap lesson, a study
 * lesson — written in a small line grammar so an author never escapes JSON:
 *
 *     ```game
 *     type: order
 *     title: Follow one request through the system
 *     prompt: Put the hops in the order a request takes.
 *     - DNS turns the name into an address
 *     - The load balancer picks a server
 *     - The app server checks the cache
 *     why: DNS first, then the balancer, then the app, which reads the cache before the database.
 *     ```
 *
 * Three kinds, each a different act of recall:
 *
 *  - `order` — 3 to 7 `- item` lines in the right order; the reader sees
 *    them shuffled and puts them back (a request's path, a pattern's steps,
 *    an algorithm's phases).
 *  - `match` — 3 to 6 `- left => right` lines; the reader pairs them
 *    (pattern ↔ the problem it solves, data structure ↔ its operation cost).
 *  - `pick`  — 3 to 8 rounds, each `? question`, two to four options (`*`
 *    the right one, `-` the others) and a `> why` line; the reader answers
 *    round by round with a score (which component fixes it, which complexity
 *    fits n = 10^5).
 *
 * The frontend mirrors this parser (src/lib/learning-games.ts — keep the two
 * in step) and plays it in components/learning/LearningGame.tsx; the edge
 * HTML (markdown-html.ts) writes the game's content as plain lists so a
 * crawler and a no-JS reader still get the knowledge. Pure; pinned by
 * learning-games.test.ts.
 */

export type GameKind = "order" | "match" | "pick";

export interface PickRound {
  question: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  why: string;
}

export type LearningGame =
  | { kind: "order"; title: string; prompt: string; items: string[]; why: string }
  | { kind: "match"; title: string; prompt: string; pairs: Array<[string, string]>; why: string }
  | { kind: "pick"; title: string; prompt: string; rounds: PickRound[] };

export const GAME_LIMITS = {
  title: 80,
  prompt: 200,
  item: 90,
  why: 300,
  order: [3, 7],
  match: [3, 6],
  rounds: [3, 8],
  options: [2, 4],
} as const;

/** Parse one game fence. Errors are sentences for the author, one per problem; a game with any error is not drawn. */
export function parseGame(source: string): { game: LearningGame | null; errors: string[] } {
  const errors: string[] = [];
  const head: Record<string, string> = {};
  const items: string[] = [];
  const rounds: Array<{ question: string; options: Array<{ text: string; right: boolean }>; why: string }> = [];

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("?")) {
      rounds.push({ question: line.slice(1).trim(), options: [], why: "" });
      continue;
    }
    const round = rounds[rounds.length - 1];
    if (round && (line.startsWith("*") || line.startsWith("- ")) && head["type"] === "pick") {
      round.options.push({ text: line.slice(1).trim(), right: line.startsWith("*") });
      continue;
    }
    if (round && line.startsWith(">")) {
      round.why = line.slice(1).trim();
      continue;
    }
    if (line.startsWith("- ")) {
      items.push(line.slice(2).trim());
      continue;
    }
    const kv = /^([a-z]+):\s*(.*)$/.exec(line);
    if (kv) {
      head[kv[1]!] = kv[2]!.trim();
      continue;
    }
    errors.push(`unreadable line "${line.slice(0, 40)}"`);
  }

  const kind = head["type"];
  const title = head["title"] ?? "";
  const prompt = head["prompt"] ?? "";
  const why = head["why"] ?? "";
  if (kind !== "order" && kind !== "match" && kind !== "pick") errors.push(`type must be order, match or pick (found "${kind ?? ""}")`);
  if (!title) errors.push("a game needs a title");
  if (title.length > GAME_LIMITS.title) errors.push(`title over ${GAME_LIMITS.title} characters`);
  if (prompt.length > GAME_LIMITS.prompt) errors.push(`prompt over ${GAME_LIMITS.prompt} characters`);
  if (why.length > GAME_LIMITS.why) errors.push(`why over ${GAME_LIMITS.why} characters`);
  const tooLong = (s: string) => s.length > GAME_LIMITS.item;

  if (kind === "order") {
    const [lo, hi] = GAME_LIMITS.order;
    if (items.length < lo || items.length > hi) errors.push(`an order game has ${lo}–${hi} items (found ${items.length})`);
    if (new Set(items).size !== items.length) errors.push("two items are the same, so the order is ambiguous");
    for (const it of items) if (tooLong(it)) errors.push(`item over ${GAME_LIMITS.item} characters: "${it.slice(0, 30)}…"`);
    if (rounds.length) errors.push("an order game has no ? rounds");
    if (!errors.length) return { game: { kind, title, prompt, items, why }, errors };
  }
  if (kind === "match") {
    const [lo, hi] = GAME_LIMITS.match;
    const pairs: Array<[string, string]> = [];
    for (const it of items) {
      const parts = it.split("=>");
      if (parts.length !== 2 || !parts[0]!.trim() || !parts[1]!.trim()) errors.push(`a match line is "- left => right" (found "${it.slice(0, 40)}")`);
      else pairs.push([parts[0]!.trim(), parts[1]!.trim()]);
    }
    if (pairs.length < lo || pairs.length > hi) errors.push(`a match game has ${lo}–${hi} pairs (found ${pairs.length})`);
    if (new Set(pairs.map((p) => p[0])).size !== pairs.length || new Set(pairs.map((p) => p[1])).size !== pairs.length) errors.push("every left and every right must be different, or the pairing is ambiguous");
    for (const [a, b] of pairs) if (tooLong(a) || tooLong(b)) errors.push(`a side over ${GAME_LIMITS.item} characters: "${a.slice(0, 30)}…"`);
    if (!errors.length) return { game: { kind, title, prompt, pairs, why }, errors };
  }
  if (kind === "pick") {
    const [lo, hi] = GAME_LIMITS.rounds;
    if (rounds.length < lo || rounds.length > hi) errors.push(`a pick game has ${lo}–${hi} rounds (found ${rounds.length})`);
    if (items.length) errors.push("a pick game's options belong under a ? round");
    const out: PickRound[] = [];
    rounds.forEach((r, i) => {
      const at = `round ${i + 1}`;
      const [olo, ohi] = GAME_LIMITS.options;
      if (!r.question) errors.push(`${at} has no question`);
      if (r.question.length > GAME_LIMITS.prompt) errors.push(`${at}: question over ${GAME_LIMITS.prompt} characters`);
      if (r.options.length < olo || r.options.length > ohi) errors.push(`${at} has ${olo}–${ohi} options (found ${r.options.length})`);
      const right = r.options.filter((o) => o.right).length;
      if (right !== 1) errors.push(`${at} marks ${right} options with * — exactly one is right`);
      if (new Set(r.options.map((o) => o.text)).size !== r.options.length) errors.push(`${at} repeats an option`);
      for (const o of r.options) if (tooLong(o.text)) errors.push(`${at}: option over ${GAME_LIMITS.item} characters`);
      if (!r.why) errors.push(`${at} needs a "> why" line`);
      if (r.why.length > GAME_LIMITS.why) errors.push(`${at}: why over ${GAME_LIMITS.why} characters`);
      out.push({ question: r.question, options: r.options.map((o) => o.text), answer: r.options.findIndex((o) => o.right), why: r.why });
    });
    if (!errors.length) return { game: { kind, title, prompt, rounds: out }, errors };
  }
  return { game: null, errors };
}

/** Every ```game fence in a Markdown body, with the line it opens on. */
export function gameFences(body: string): Array<{ line: number; source: string }> {
  const out: Array<{ line: number; source: string }> = [];
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const open = /^\s*(```+|~~~+)\s*game\s*$/.exec(lines[i]!);
    if (!open) continue;
    const close = new RegExp(`^\\s*${open[1]}\\s*$`);
    const src: string[] = [];
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j]!)) src.push(lines[j++]!);
    out.push({ line: i + 1, source: src.join("\n") });
    i = j;
  }
  return out;
}

/** Problems with every game in a body, as "line N: …" sentences (the content gates call this). */
export function gameProblems(body: string): string[] {
  return gameFences(body).flatMap(({ line, source }) => parseGame(source).errors.map((e) => `line ${line}: game: ${e}`));
}

/**
 * The game as plain HTML for the edge and a no-JS reader: the knowledge it
 * tests, stated (the order as an ordered list, the pairs, each round's
 * answer and why) — `escape` is the caller's HTML escaper.
 */
export function gameHtml(source: string, escape: (s: string) => string): string {
  const { game } = parseGame(source);
  if (!game) return "";
  const head = `<p><strong>${escape(game.title)}</strong>${game.prompt ? ` — ${escape(game.prompt)}` : ""}</p>`;
  if (game.kind === "order") {
    return `<aside class="learning-game">${head}<ol>${game.items.map((i) => `<li>${escape(i)}</li>`).join("")}</ol>${game.why ? `<p>${escape(game.why)}</p>` : ""}</aside>`;
  }
  if (game.kind === "match") {
    return `<aside class="learning-game">${head}<ul>${game.pairs.map(([a, b]) => `<li>${escape(a)} — ${escape(b)}</li>`).join("")}</ul>${game.why ? `<p>${escape(game.why)}</p>` : ""}</aside>`;
  }
  return `<aside class="learning-game">${head}<ol>${game.rounds
    .map((r) => `<li>${escape(r.question)} <em>${escape(r.options[r.answer]!)}</em>. ${escape(r.why)}</li>`)
    .join("")}</ol></aside>`;
}
