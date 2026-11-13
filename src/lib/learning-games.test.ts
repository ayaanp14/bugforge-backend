import { test } from "node:test";
import assert from "node:assert/strict";
import { gameFences, gameHtml, gameProblems, parseGame } from "./learning-games.js";

/** The learning games' grammar (lib/learning-games). Run with: npm test */

const ORDER = `type: order
title: Follow one request
prompt: Put the hops in order.
- DNS lookup
- Load balancer
- App server
why: Name first, then the front door, then the code.`;

const MATCH = `type: match
title: Pattern to problem
- Singleton => one shared instance
- Observer => notify many listeners
- Strategy => swap an algorithm at runtime`;

const PICK = `type: pick
title: Which fix?
? Reads repeat the same keys and the database is slow.
* Add a cache
- Add a queue
> A cache serves repeated reads from memory.
? Writes arrive in bursts the database cannot absorb.
- Add a cache
* Add a queue
> A queue buffers the burst and lets workers drain it.
? One table outgrew one machine.
* Shard it
- Add an index
> Sharding splits rows across machines.`;

test("each kind parses into its shape", () => {
  const o = parseGame(ORDER);
  assert.deepEqual(o.errors, []);
  assert.equal(o.game?.kind, "order");
  assert.deepEqual(o.game?.kind === "order" && o.game.items, ["DNS lookup", "Load balancer", "App server"]);

  const m = parseGame(MATCH);
  assert.deepEqual(m.errors, []);
  assert.deepEqual(m.game?.kind === "match" && m.game.pairs[1], ["Observer", "notify many listeners"]);

  const p = parseGame(PICK);
  assert.deepEqual(p.errors, []);
  assert.equal(p.game?.kind === "pick" && p.game.rounds[1]!.answer, 1);
  assert.equal(p.game?.kind === "pick" && p.game.rounds[0]!.why, "A cache serves repeated reads from memory.");
});

test("an author's mistakes are named, and the game is not drawn", () => {
  const two = parseGame("type: order\ntitle: Too few\n- a\n- b");
  assert.equal(two.game, null);
  assert.match(two.errors.join(" "), /3–7 items/);

  const noRight = parseGame("type: pick\ntitle: T\n? Q1\n- a\n- b\n> w\n? Q2\n* a\n- b\n> w\n? Q3\n* a\n* b\n> w");
  assert.match(noRight.errors.join(" "), /round 1 marks 0 options/);
  assert.match(noRight.errors.join(" "), /round 3 marks 2 options/);

  assert.match(parseGame("type: quiz\ntitle: T").errors.join(" "), /type must be order, match or pick/);
  assert.match(parseGame("type: match\ntitle: T\n- a => b\n- c\n- e => f").errors.join(" "), /left => right/);
  assert.match(parseGame("type: match\ntitle: T\n- a => b\n- a => c\n- d => e").errors.join(" "), /ambiguous/);
});

test("fences are found in a body with their lines, and problems carry the line", () => {
  const body = `Intro\n\n\`\`\`game\n${ORDER}\n\`\`\`\n\nText\n\n\`\`\`game\ntype: order\ntitle: Bad\n- one\n\`\`\`\n`;
  const fences = gameFences(body);
  assert.equal(fences.length, 2);
  assert.equal(fences[0]!.line, 3);
  const problems = gameProblems(body);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /^line \d+: game: an order game has 3–7 items/);
});

test("the edge HTML states the knowledge the game tests", () => {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  assert.match(gameHtml(ORDER, esc), /<ol><li>DNS lookup<\/li><li>Load balancer<\/li><li>App server<\/li><\/ol>/);
  assert.match(gameHtml(MATCH, esc), /<li>Singleton — one shared instance<\/li>/);
  assert.match(gameHtml(PICK, esc), /<em>Add a queue<\/em>\. A queue buffers/);
  assert.equal(gameHtml("type: nope", esc), "");
});
