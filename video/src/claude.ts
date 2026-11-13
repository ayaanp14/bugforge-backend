/**
 * Every call to Claude, and what they cost. VIDEO_MODEL and VIDEO_COMPOSE_MODEL pick
 * the models, and a daily run goes through the Batches API (see "What it costs" in
 * the README);
 * the run's real spend is reported to the campaign page.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COVER, FRAMES, PLAYLISTS, ReviewSchema, ScriptSchema, type Format, type Review, type Script, type Timeline, type Usage } from "./types.ts";

/** The script and every review: where correctness is decided. */
export const MODEL = process.env["VIDEO_MODEL"] || "claude-opus-5-5";
/**
 * Writing and fixing the animation and the cover: 80% of a run's output tokens
 * (run cmw8riz2d, 2026-11-09: $2.24 of $2.84), at half Opus's price. The Opus
 * reviews still judge what it draws. VIDEO_COMPOSE_MODEL=claude-opus-5-5 undoes it.
 */
export const COMPOSE_MODEL = process.env["VIDEO_COMPOSE_MODEL"] || "claude-sonnet-5-5";

/**
 * The Message Batches API halves every token's price but answers in minutes
 * rather than at once, which a daily job can afford (it starts at 15:00 and posts
 * at 18:00). A batch that hasn't ended within BATCH_WAIT is cancelled and the
 * call is made at the normal price, so a slow queue never costs the day's video.
 * VIDEO_BATCH=off makes every call directly; a typed "Make one now" run does too.
 */
const BATCH_ON = () => process.env["VIDEO_BATCH"] !== "off";
const BATCH_WAIT_MS = Number(process.env["VIDEO_BATCH_WAIT_MIN"] || 20) * 60_000;
const BATCH_POLL_MS = 30_000;
let batching = true;
/** A typed run is someone waiting for it: no batches. */
export function useBatches(on: boolean) {
  batching = on;
}

/**
 * What the narration is spoken in, set per run from the campaign page. Hinglish is
 * the default by the owner's call (2026-11-07): the channel is for Indian students,
 * who learn this in Hindi mixed with English terms. Roman script, because Kajal
 * reads Roman Hinglish and the captions print it.
 */
export type Language = "hinglish" | "english";

const languageRules = (language: Language) =>
  language === "hinglish"
    ? "Write all narration in Hinglish, in Roman script, the way an Indian teacher explains this in class: Hindi sentence structure (hai, karte hain, isliye, kyunki, matlab) with every technical term in English (array, stack, pointer, time complexity, push, pop). Never Devanagari. Keep it conversational, not formal Hindi. Spell numbers out in English words (\"twenty three\", \"O of n\"), since that is how students say them. Scene titles, the thumbnail, code and everything on screen stay in English."
    : "Write all narration in English.";
const HERE = path.dirname(fileURLToPath(import.meta.url));

/** USD per million tokens: input, 1h cache write, cache read, output. */
const PRICES: Record<string, [number, number, number, number]> = {
  "claude-opus-5-5": [4, 8, 0.2, 20],
  "claude-sonnet-5-5": [2, 4, 0.1, 10],
};

export const spend: Usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, usd: 0 };

// A composition can think and write for many minutes; the SDK's retries would
// repeat a failed one, which is what a day's run wants.
const client = new Anthropic({ timeout: 30 * 60 * 1000, maxRetries: 3 });

type Effort = "low" | "medium" | "high";

interface Ask {
  /** The stable part, cached: the design rules and the reference composition. */
  system: string;
  content: Anthropic.Beta.Messages.BetaContentBlockParam[] | string;
  effort: Effort;
  schema?: Record<string, unknown>;
  /** MODEL unless given (COMPOSE_MODEL for the drawing). */
  model?: string;
}

type Reply = Pick<Anthropic.Messages.Message, "content" | "stop_reason" | "usage">;

const request = ({ system, content, effort, schema, model = MODEL }: Ask) => ({
  model,
  max_tokens: 64000,
  thinking: { type: "adaptive" },
  // One hour: a long composition outlasts the 5-minute cache, and the next call needs the prefix.
  system: [{ type: "text", text: system, cache_control: { type: "ephemeral", ttl: "1h" } }],
  messages: [{ role: "user", content }],
  output_config: { effort, ...(schema ? { format: { type: "json_schema", schema } } : {}) },
});

async function direct(a: Ask): Promise<Reply> {
  const stream = client.beta.messages.stream({
    ...request(a),
    betas: ["server-side-fallback-2026-07-01"],
    // A classifier declining mid-run (a security topic, say) falls over to the
    // recommended model rather than costing the day's video.
    fallbacks: "default",
  } as unknown as Anthropic.Beta.Messages.MessageCreateParamsStreaming);
  return (await stream.finalMessage()) as unknown as Reply;
}

/**
 * The same request through the Batches API, or null when it should be made
 * directly instead: the batch didn't end in time, failed, or was declined (the
 * Batches API refuses the `fallbacks` parameter, so a refusal is retried directly,
 * where the fallback can catch it).
 */
async function batched(a: Ask, charge: (r: Reply, discount: number) => void): Promise<Reply | null> {
  const created = await client.messages.batches
    .create({ requests: [{ custom_id: "call", params: request(a) as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming }] })
    .catch((e: Error) => {
      console.log(`  batch refused (${e.message.slice(0, 120)}); calling directly`);
      return null;
    });
  if (!created) return null;
  const started = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, BATCH_POLL_MS));
    const batch = await client.messages.batches.retrieve(created.id).catch(() => null);
    if (batch?.processing_status === "ended") break;
    if (Date.now() - started > BATCH_WAIT_MS) {
      await client.messages.batches.cancel(created.id).catch(() => undefined);
      console.log(`  batch still queued after ${BATCH_WAIT_MS / 60_000} min; calling directly`);
      // A request can finish in the moment between the deadline and the cancel; it is billed, so count it.
      for await (const r of await client.messages.batches.results(created.id).catch(() => [])) if (r.result.type === "succeeded") charge(r.result.message, 0.5);
      return null;
    }
  }
  for await (const r of await client.messages.batches.results(created.id)) {
    if (r.result.type !== "succeeded") {
      console.log(`  batch ${r.result.type}; calling directly`);
      return null;
    }
    if (r.result.message.stop_reason === "refusal") {
      charge(r.result.message, 0.5);
      console.log("  declined in the batch; calling directly, where a fallback can answer");
      return null;
    }
    return r.result.message;
  }
  return null;
}

async function ask(a: Ask): Promise<string> {
  const model = a.model ?? MODEL;
  const charge = (message: Reply, discount: number) => {
    const u = message.usage;
    const price = PRICES[model] ?? PRICES["claude-opus-5-5"]!;
    const write = u.cache_creation_input_tokens ?? 0;
    const read = u.cache_read_input_tokens ?? 0;
    spend.input += u.input_tokens;
    spend.cacheWrite += write;
    spend.cacheRead += read;
    spend.output += u.output_tokens;
    spend.usd += (discount * (u.input_tokens * price[0] + write * price[1] + read * price[2] + u.output_tokens * price[3])) / 1e6;
    console.log(`  ${model}${discount < 1 ? " (batch)" : ""}: ${u.input_tokens} in, ${write} cache write, ${read} cache read, ${u.output_tokens} out; run total $${spend.usd.toFixed(3)}`);
  };
  let message = BATCH_ON() && batching ? await batched(a, charge) : null;
  if (message) charge(message, 0.5);
  else {
    message = await direct(a);
    charge(message, 1);
  }

  if (message.stop_reason === "refusal") throw new Error("Claude declined this topic.");
  if (message.stop_reason === "max_tokens") throw new Error("Claude ran out of room before finishing.");
  return message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/* ── The script ─────────────────────────────────────────────────────── */

const string = { type: "string" };
const cutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "tags", "hashtags", "scenes"],
  properties: {
    title: string,
    description: string,
    tags: { type: "array", items: string },
    hashtags: { type: "array", items: string },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "narration", "visual"],
        properties: { id: string, title: string, narration: string, visual: string },
      },
    },
  },
};
const scriptSchema = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "practicePath", "learnPath", "code", "thumbnail", "reel", "playlist", "landscape", "short"],
  properties: {
    topic: string,
    practicePath: string,
    learnPath: string,
    code: {
      anyOf: [
        { type: "null" },
        { type: "object", additionalProperties: false, required: ["language", "source", "expectedOutput"], properties: { language: string, source: string, expectedOutput: string } },
      ],
    },
    thumbnail: { type: "object", additionalProperties: false, required: ["headline", "tag"], properties: { headline: string, tag: string } },
    reel: {
      type: "object",
      additionalProperties: false,
      required: ["hook", "caption", "hashtags"],
      properties: { hook: string, caption: string, hashtags: { type: "array", items: string } },
    },
    playlist: { type: "string", enum: [...PLAYLISTS] },
    landscape: cutSchema,
    short: cutSchema,
  },
};

/**
 * The site's own description of itself, from the page it publishes for answer
 * engines, so what a video may claim stays in step with the site. This repository
 * doesn't hold the frontend's fact modules.
 */
async function siteFacts(): Promise<string> {
  const text = await fetch("https://codekairo.com/llms.txt").then((r) => (r.ok ? r.text() : "")).catch(() => "");
  return text.slice(0, 3000) || "CodeKairo is a web-based coding practice and interview-preparation platform for college students and early-career software engineers.";
}

const scriptSystem = (facts: string, language: Language) => `You write the daily explainer videos for CodeKairo's YouTube channel. Each topic gets two cuts: a landscape tutorial and a vertical Short.

About CodeKairo, the only facts about it you may state: ${facts}

The audience is Indian engineering students preparing for coding interviews and campus placements. Treat them as smart and short of time.

The landscape cut runs 3 to 5 minutes, 450 to 800 words, in 7 to 12 scenes. Its usual arc for an algorithm: a hook, the problem, the obvious approach and why it falls short, the insight, a step-by-step walkthrough on a small concrete example, a common mistake, the code, the complexity, then a sign-off. Other kinds of topic take the arc that suits them.

The Short runs 20 to 35 seconds, 50 to 90 words, in 3 to 4 scenes. Shorter is better: YouTube pushes a Short that people watch to the end and replay, and swipes past one that drags. Its first scene is the hook, at most 10 words and 3 seconds: one surprising, concrete payoff ("One loop. O(n squared) becomes O(n).", "Twenty checks to find one number in a million."), since a viewer decides in the first second whether to swipe. Then the one idea that makes the topic click, shown not told, and a last line sending them to CodeKairo. It stands on its own and is not a trimmed copy of the long cut.

${languageRules(language)}

Never say or show the word LeetCode, or a problem number from it, anywhere in the video: not in the narration, a scene title, a visual, the thumbnail or the cover (the owner's rule). Name a problem only by its own name, "Best Time to Buy and Sell Stock", even when the topic you were given carries a LeetCode number.

Narration is read aloud by a text-to-speech voice, so write for the ear: short sentences, plain words, no markdown. Spell numbers and symbols out as they should be spoken ("twenty three", "O of log n", "n squared"). Every statement about the topic must be correct; a viewer will be tested on it in an interview, so walk the example through and check each value before you write it down.

"visual" tells the animator what the scene shows, how it moves (the camera pushing in on the cell that matters, a pointer gliding, cells landing one by one) and which spoken words the changes land on. Anything that can be computed, such as array states, should come from a concrete example given in full there.

Scene ids are unique, lower-case-with-dashes, and the two cuts have separate lists. Scene titles are 40 characters or fewer.

"code" is for a topic with a program worth showing: a complete Java file with a class named Main whose main method prints results, plus exactly what it prints as expectedOutput. It is compiled and run, and shown to viewers exactly as written, so keep it short enough for a screen (under 30 lines) and well named. Use null when the topic has no program, such as most system design.

"practicePath" and "learnPath" are where the video sends viewers on codekairo.com, chosen only from the real pages listed with the topic. practicePath is where they practise this exact thing: the problem's own page when there is one (/problems/container-with-most-water), else the closest hub or note. learnPath is a different page that teaches the idea behind it: a roadmap lesson (/roadmap/two-pointers), a CS note or a topic hub; "" if none fits. Never /challenges when a closer page is listed.

What YouTube search and suggestions read, for each cut:
- Title: lead with the exact term a student types (the problem's or concept's usual name), then the angle, and for a LeetCode problem its number as students search it ("LeetCode 121"). Under 70 characters so search results don't cut it (100 is the hard limit)${language === "hinglish" ? ', in English, with "in Hindi" in it, since that is how Indian students search for a Hinglish explanation ("Valid Parentheses Explained in Hindi | Stack")' : ""}. Honest: no all caps, no promise the video doesn't keep. The Short's title is under 60 characters, a hook that names the term ("Why Binary Search Is O(log n)${language === "hinglish" ? " in Hindi" : ""}").
- Description: the first sentence restates the title's search term in a natural sentence, since it is what search shows under the title. Then 2 to 4 sentences of what the viewer learns, naturally naming the related terms a student would also search: the pattern, the LeetCode problem name when it is one, Java, the interview it helps with. No links, chapters or hashtags; those are added for you.
- Tags: 10 to 15, lower case, no "#", most specific first: the exact name, its other common names, ${language === "hinglish" ? 'the name with "in hindi" and "hindi", ' : ""}the pattern or data structure, then broad ones such as dsa, coding interview, placement preparation, leetcode (only for a LeetCode problem), java. Under 400 characters in all.
- Hashtags: exactly 3, no "#", one word each with no spaces (binarysearch, dsa, codinginterview); YouTube shows them above the title. The Short's first hashtag is shorts.
Avoid "<" and ">" anywhere in these; YouTube refuses them.

"playlist" is the one shelf of the channel this topic belongs on.

Thumbnail headline is 2 to 6 punchy words, at most 40 characters.

"reel" is the same Short posted to Instagram, where people find it in Reels, Explore and search rather than by a title:
- hook: the caption's first line, all Instagram shows before "more". Under 90 characters, in English, naming the topic by the term a student searches, and giving a reason to watch: a surprising number, a mistake most people make, a promise ("Most people solve Container With Most Water in O(n squared). One idea makes it O(n)."). At most one emoji. Never the YouTube title word for word.
- caption: what follows the hook, 2 to 4 short lines with a blank line between: the one idea in plain words${language === "hinglish" ? " (English or light Hinglish in Roman script)" : ""}, then a line asking them to save it for their next interview or send it to a friend preparing for placements, then one question that invites a comment (the edge case, their language, how they'd solve it). Under 500 characters, no links, no hashtags.
- hashtags: 3 to 5, no "#", one word each, specific first (containerwithmostwater, twopointers, dsa, codinginterview, placementprep). Never generic reach tags such as viral, reels, fyp or explore; Instagram reads those as spam.`;

/**
 * Is this topic already on the channel? Run before anything costly. The API's own
 * check only catches the same words; this catches the same video in different ones.
 */
export async function findDuplicate(prompt: string, posted: string[]): Promise<string | null> {
  if (!posted.length) return null;
  const raw = await ask({
    system: `You keep a coding-education YouTube channel from repeating itself. Given a request for a new video and what the channel already has, decide whether a viewer of an existing video would feel the new one is the same video. The same problem or concept explained again is a repeat, however it is titled. A related but distinct topic is not: Two Sum and Three Sum are different videos, and so are binary search and binary search on the answer. A request that asks for a new angle on a covered topic is new only if a viewer would really learn something else from it. Name the existing title it repeats, exactly as listed, or null.`,
    content: `Requested: ${prompt}\n\nAlready on the channel:\n${posted.map((t) => `- ${t}`).join("\n")}`,
    effort: "low",
    schema: { type: "object", additionalProperties: false, required: ["duplicateOf"], properties: { duplicateOf: { anyOf: [{ type: "null" }, string] } } },
  });
  return (JSON.parse(raw) as { duplicateOf: string | null }).duplicateOf;
}

export async function writeScript(prompt: string, posted: string[], language: Language, pages: string[]): Promise<Script> {
  const earlier = posted.length ? `\n\nAlready on the channel. Never repeat these topics, angles or hooks:\n${posted.map((t) => `- ${t}`).join("\n")}` : "";
  const raw = await ask({ system: scriptSystem(await siteFacts(), language), content: `Today's video: ${prompt}\n\nReal pages on codekairo.com that may fit, best match first:\n${pages.map((p) => `- ${p}`).join("\n")}${earlier}`, effort: "high", schema: scriptSchema });
  return ScriptSchema.parse(JSON.parse(raw));
}

/**
 * "LeetCode" and its problem numbers, with any brackets around them. The owner's
 * rule (2026-11-10): never inside a video. The prompts say so; this is the last
 * guard, run over everything the voice reads or a page draws before either
 * happens. Titles, descriptions and tags (outside the video) keep their search words.
 */
const LEETCODE = /[([]?\s*\bleet\s*code\b(?:\s*(?:problem|question|number|no\.?))*(?:\s*#?\s*\d+)?\s*[)\]]?/gi;
export const hasLeetCode = (s: string) => /\bleet\s*code\b/i.test(s);
const scrub = (s: string) => s.replace(LEETCODE, " ").replace(/\s{2,}/g, " ").replace(/\s+([,.:;!?])/g, "$1").replace(/,([.:;!?])/g, "$1").replace(/^[\s,:;]+|[\s,:;]+$/g, "").trim();

/** The script with LeetCode taken out of everything inside the video. Returns what it changed, for the run's log. */
export function withoutLeetCode(script: Script): { script: Script; changed: number } {
  let changed = 0;
  const clean = (s: string) => {
    if (!hasLeetCode(s)) return s;
    changed++;
    return scrub(s);
  };
  const cut = (c: Script["short"]) => ({ ...c, scenes: c.scenes.map((x) => ({ ...x, title: clean(x.title), narration: clean(x.narration), visual: clean(x.visual) })) });
  const out: Script = {
    ...script,
    topic: clean(script.topic),
    thumbnail: { headline: clean(script.thumbnail.headline), tag: clean(script.thumbnail.tag) },
    landscape: cut(script.landscape),
    short: cut(script.short),
  };
  return { script: out, changed };
}

/* ── The composition ────────────────────────────────────────────────── */

const reference = () => readFileSync(path.join(HERE, "..", "fixtures", "reference-short.html"), "utf8");

const composeSystem = () => `You animate CodeKairo's explainer videos as HTML. Your composition goes inside a fixed page and a renderer takes a screenshot of it at each moment, so a video is a function from time to picture.

## The contract

You write the contents of a <div id="ck-stage">: a <style> block, one <section data-scene="<id>"> per scene, then a <script>. The page already has the logo header and the word-by-word captions above and below the stage, so never draw captions, a logo, or a scene title bar.

- The runtime shows only the section of the current scene and fades it at the cuts.
- Register exactly one draw function with CK.render((t, scene) => { ... }). t is seconds from the start of the video. Set styles, text and SVG attributes from t alone. Going to any t in any order must draw the same picture, so keep no state between calls and never append to the DOM inside it; build elements once at the top of the script, then only update them.
- setTimeout, setInterval and requestAnimationFrame throw, CSS animations and transitions are disabled, and the clock reads zero. Every movement comes from t.
- No network exists: no images, fonts or scripts by URL. Draw with HTML, CSS, inline SVG or <canvas>.

## The CK helpers

- CK.scene(id) gives {id, title, start, end, words}.
- CK.cue(sceneId, "phrase") gives the seconds at which those exact spoken words start. It throws if the phrase isn't in that scene's narration, so copy phrases word for word, without crossing a sentence end. Tie changes to the words that name them; this is what makes a video feel made rather than generated.
- CK.p(t, from, to, curve?) eases 0 to 1 between two times. CK.ease has linear, out, inOut, back. CK.mix(a, b, v) interpolates. CK.clamp(v, a?, b?).
- CK.reveal(el, t, at, until?, rise?) fades and lifts an element in from time at.
- CK.typed(text, v) gives the first v (0 to 1) of a string.
- CK.code(el, {fontSize, first, last}) fills el with the script's code, syntax coloured. Always show code through this; never retype it. CK.focusLines(el, [lineNumbers]) lights lines and dims the rest; [] lights all.
- CK.stage is {x, y, w, h}, CK.vertical is true on a Short.

Motion helpers, one line each. Each sets the element's transform and opacity, so give an element one of them per frame, not two:
- CK.move(el, t, [{at, x, y, z, rx, ry, rot, scale, opacity, ease?}, ...]) moves through keyframes (px and degrees). A key keeps what it doesn't name from the key before it, so {at: CK.cue(...), x: 240} moves only x. This is how values travel and pointers glide.
- CK.pop(el, t, at, until?) springs in with an overshoot. CK.flip(el, t, at, until?) turns in like a card. CK.slide(el, t, at, "left"|"right"|"up"|"down", dist?, until?) slides in turning to face the viewer.
- CK.stagger(els, t, at, gap?, fx?) runs an entrance (CK.pop by default) over a list, gap seconds apart: an array's cells landing one after another.
- Numbers for CK.move's props: CK.bump(t, at, amount?) is a scale factor that kicks up just after at (emphasis on the word that names it), CK.shake(t, at, px?) an x offset for a wrong answer, CK.float(t, amp?, period?, phase?) a gentle idle bob.
- CK.count(el, t, from, to, a, b, decimals?) counts a number up. CK.trace(svgPathOrLine, t, a, b) draws a stroke along its length: arrows, links, crossing lines out.

The camera:
- Every scene already drifts (a slow push in with a slight turn) and swings in at its cut. That is the floor, not the motion.
- CK.camera(sceneId, [{at, zoom, x, y, rx, ry, rz, focus, ease?}, ...]) adds the scene's own camera moves; call it once per scene at the top of the script, not inside the draw. focus is an element or a selector inside the scene: the camera centres on it (zoom 1.35 unless the key says) and follows it if it moves. zoom 0.8 to 2.2, rx and ry up to 25 degrees, rz up to 10. Keys carry forward like CK.move's, so {at, zoom: 1} pulls back out.
- The stage clips above and below (the header and captions) and has only the side margins to spill into, so zoom in on something smaller than the stage: a cell, a line of code, a node. Type that already fills the stage’s width takes no zoom past 1.05.

## Motion

A viewer should feel the video is moving the whole time. In every scene after the hook:
- At least one camera move on a spoken cue: push in to the cell or line that matters, follow the pointer as it travels, pull back to show the whole structure, or swing around (ry 12 to 20) as the idea turns.
- Lay structures out in depth when it reads well: an array or grid tilted back like a board on a table (rx 20 to 35 on its row), cards at slightly different z, a stack rising towards the camera. Bring it flat again (rx 0) when the viewer has to read the values closely.
- Entrances are springs and staggers, not fades: cells pop in one after another, panels slide or flip in, and every change lands with a CK.bump on the word that names it.
- Something always moves: a pointer bobbing with CK.float, a value travelling between cells, a line tracing in.
Keep the hook's first frame fully drawn (no entrance on it), and keep text facing the viewer enough to read.

## The look

This is a CodeKairo page in motion. Dark ground #0A0A0A; surfaces #111111, #161616, #1C1C1C; hairlines #262626, #383838; text #F5F5F5, secondary #A3A3A3, muted #8C8C8C. The one colour is blue: accent #3AA9FF, highlight #7CC9FF, deep steps #0794F9, #0068CC. State colours only name a state: success #52C98A, error #FF7A7E. Gilroy (400, 500, 600, 700) for words and 'JetBrains Mono' for code and values. No gradients, glass, glows or shadows. Corners are 8px at most.

Never write the word LeetCode or a LeetCode problem number on screen.

Everything must be readable on a phone: on a Short keep text at 44px or larger, on landscape 26px or larger.

On a Short, the first scene is the hook and decides whether anyone keeps watching. The page hides its header during it. Fill the stage with the payoff in huge type (110px or more): the before and after, the number, the struck-through slow way. It must be fully drawn on the scene's very first frame, with no fade or reveal in, because that frame is also what shows while the Short loads in the feed; movement can come after. Fill the stage with one large idea at a time rather than scattering small items. Text must stay inside the stage; check your sizes against its width and height.

Show the idea moving: values travel, pointers glide between cells, things get crossed out as the voice says why. A viewer should get the idea with the sound off. Compute drawn values by running the algorithm in the script rather than typing them, so the picture can't contradict itself, and make sure it agrees with the narration.

Rich layouts need care but not bulk: reuse helpers across scenes and keep the file as small as the picture allows.

## Reference

A complete composition for a three-scene Short. Match its discipline and its motion, then go further with the visuals.

\`\`\`html
${reference()}
\`\`\`

Reply with the composition in one \`\`\`html fence and nothing else.`;

function fenced(reply: string): string {
  const match = reply.match(/```html\s*\n([\s\S]*)\n```/);
  if (!match) throw new Error("Claude's reply held no composition.");
  return match[1]!;
}

const sceneBrief = (script: Script, format: Format, timeline: Timeline) =>
  timeline.scenes
    .map((s) => {
      const authored = script[format].scenes.find((x) => x.id === s.id)!;
      return `### ${s.id} (${(s.end - s.start).toFixed(1)} s)\nNarration: ${authored.narration}\nShows: ${authored.visual}`;
    })
    .join("\n\n");

/* ── Fixing: edits, not a rewrite ───────────────────────────────────── */
//
// A review round used to send the whole file back: 17-18k output tokens to change
// a few lines (run cmw8riz2d: two rounds, $0.80). Now the model answers with
// find-and-replace edits; if any of them doesn't apply cleanly, the whole file is
// asked for as before, so a fix is never lost to a bad edit.

const editsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["edits"],
  properties: {
    edits: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["find", "replace"], properties: { find: { type: "string" }, replace: { type: "string" } } },
    },
  },
};

/** Each edit in turn; its `find` must occur exactly once in the text as it stands. Null if one doesn't. */
export function applyEdits(text: string, edits: { find: string; replace: string }[]): string | null {
  let out = text;
  for (const { find, replace } of edits) {
    if (!find || out.split(find).length !== 2) return null;
    out = out.replace(find, () => replace);
  }
  return edits.length ? out : null;
}

async function fix(system: string, what: string, brief: string, html: string, problems: string[]): Promise<string> {
  const head = `${brief}

This ${what} needs fixing.

Problems:
${problems.map((p) => `- ${p}`).join("\n")}

The ${what}:

\`\`\`html
${html}
\`\`\``;
  const raw = await ask({
    system,
    model: COMPOSE_MODEL,
    effort: "medium",
    schema: editsSchema,
    content: `${head}

Fix every problem and keep what works. Reply only with edits, not the whole file: each edit's "find" is an exact passage copied from the ${what} above, long enough to occur exactly once, and "replace" is what goes there instead. Edits apply in order.`,
  });
  const edits = (JSON.parse(raw) as { edits: { find: string; replace: string }[] }).edits;
  const fixed = applyEdits(html, edits);
  if (fixed) return fixed;
  console.log(`  ${edits.length} edit(s) didn't apply cleanly; asking for the whole ${what}`);
  return fenced(await ask({ system, model: COMPOSE_MODEL, effort: "medium", content: `${head}\n\nFix every problem, keep what works, and reply with the whole corrected ${what}.` }));
}

export async function compose(script: Script, format: Format, timeline: Timeline): Promise<string> {
  const { stage } = FRAMES[format];
  const reply = await ask({
    system: composeSystem(),
    model: COMPOSE_MODEL,
    effort: "medium",
    content: `Topic: ${script.topic}
Format: ${format}. The stage is ${stage.w} x ${stage.h} px. Total ${timeline.duration.toFixed(1)} s.
${script.code ? `\nThe script's code (shown through CK.code), with line numbers for CK.focusLines:\n${script.code.source.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n")}\n` : ""}
Scenes:

${sceneBrief(script, format, timeline)}`,
  });
  return fenced(reply);
}

export async function revise(script: Script, format: Format, timeline: Timeline, composition: string, problems: string[]): Promise<string> {
  return fix(composeSystem(), "composition", `Topic: ${script.topic}. Format: ${format}.\n\nScenes:\n\n${sceneBrief(script, format, timeline)}`, composition, problems);
}

/* ── The reel's cover ───────────────────────────────────────────────── */
//
// Designed per topic by the model, because the covers that did best on the
// channel (Binary Search, HTTP vs HTTPS; the owner's pick, 2026-11-09) each draw
// the topic's own idea, which no fixed template can.

const coverSystem = () => `You design the cover of CodeKairo's daily coding reel on Instagram. The cover is what shows on the profile grid, in Explore and when the reel is shared, so it decides whether anyone taps.

## The contract

You write the contents of a <div id="ck-cover"> that is ${COVER.area.w} x ${COVER.area.h} px: a <style> block and the markup, plus a <script> only if building the markup in code is simpler (it runs once). The page already draws the CodeKairo logo just above this area, so never draw a logo or the brand name. No network exists: no images, fonts or scripts by URL; draw with HTML, CSS and inline SVG. Everything must stay inside the area; nothing may be cut off. Position inside it freely (the div is position:relative).

## What a cover that works has, top to bottom

1. An eyebrow: one short line in blue capitals, letter-spaced, 30 to 36px, naming the angle ("ONE LETTER. HUGE DIFFERENCE.", or "EASY · CODING INTERVIEW · JAVA" with a small green dot before Easy).
2. The headline: the topic's name as people search it, huge and bold, 120 to 170px, two or three lines at most, the one word that matters in blue (HTTP vs HTTP<blue>S</blue>).
3. The payoff, when the topic has one: a struck-through "before" in the error colour against an "after" in blue ("1,000,000 checks" struck out, then "→ 20 checks"; "O(n²)" struck out, then "→ O(n)").
4. One picture of the idea, drawn from the script's real example, large enough to read: the sorted array with the middle cell lit and low/high marked; two cards, HTTP with an open lock and what an eavesdropper reads in plain text against HTTPS with a closed lock and gibberish; the two walls and the water between them. One picture, not a collage.
5. One line at the bottom, 40 to 48px, the promise of the reel ("Throw away half the array with every check"), its key words in blue.

A design may leave out the payoff or change the order when the topic calls for it, but it is always big, few elements and high contrast: it is read as a tile a third of a phone's width. No text under 30px except tiny labels inside the picture (at least 22px).

## The look

Dark ground #0A0A0A, a faint grid of #141414 lines is fine; surfaces #111111, #161616, #1C1C1C; hairlines #262626, #383838; text #F5F5F5, secondary #A3A3A3. Blue is the one colour: accent #3AA9FF, highlight #7CC9FF, deep #0794F9, #0068CC. Error #FF7A7E and success #52C98A only name a state (the struck-through cost, a broken thing, a lock that leaks). Gilroy 400 to 700 for words, 'JetBrains Mono' for code and values. Corners 8px at most, no gradients, glows or shadows, except that a card may be tinted with its state colour at low opacity.

Never write the word LeetCode or a LeetCode problem number on the cover. Every value drawn must be correct for the topic and agree with the script. Reply with the cover in one \`\`\`html fence and nothing else.`;

const coverBrief = (script: Script) => `Topic: ${script.topic}
The reel's title: ${script.short.title}
Its hook: ${script.reel?.hook ?? script.short.title}
The YouTube thumbnail's headline and tag, for the angle: ${script.thumbnail.headline} / ${script.thumbnail.tag}

The Short's scenes:
${script.short.scenes.map((s) => `- ${s.title}: ${s.narration}\n  Shows: ${s.visual}`).join("\n")}`;

export async function composeCover(script: Script, previous?: { html: string; problems: string[] }): Promise<string> {
  if (previous) return fix(coverSystem(), "cover", coverBrief(script), previous.html, previous.problems);
  return fenced(await ask({ system: coverSystem(), model: COMPOSE_MODEL, effort: "medium", content: coverBrief(script) }));
}

const coverReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["problems"],
  properties: { problems: { type: "array", items: string } },
};

/** The video's reviewer, looking at one still: what would stop it going out. */
export async function reviewCover(script: Script, jpeg: Buffer, language: Language): Promise<string[]> {
  const raw = await ask({
    system: reviewSystem(language),
    effort: "medium",
    schema: coverReviewSchema,
    content: [
      { type: "text", text: `This time you check the reel's cover, a still image shown on the profile grid and when shared, not a video frame. List only blockers: a technical error, a value that contradicts the topic, text that overlaps, is cut off or is unreadable at a third of a phone's width, or a cover that is blank or unfinished. An empty list means it goes out.\n\n${coverBrief(script)}` },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
    ],
  });
  return (JSON.parse(raw) as { problems: string[] }).problems;
}

/* ── The review ─────────────────────────────────────────────────────── */

const reviewSystem = (language: Language) => `You check CodeKairo's explainer videos before they go public. They publish without a person watching, so you are the last reader.

You get the script, and frames from late in each scene. Report a blocker for a technical error in the narration, code or picture; a picture that contradicts what is said; text that overlaps, is cut off or is too small to read on a phone; or a scene that is blank or plainly unfinished. Frames are half size, so judge text by its proportion of the frame.${language === "hinglish" ? " The narration and captions are Roman-script Hinglish on purpose; judge what they say, not the language." : ""}

A frame caught mid-animation is fine, so is a camera zoomed in or tilted on purpose (a tilted board, part of the stage cropped by a push in) while the text that matters stays readable, and so is a design you would have done differently: report those as minor or not at all. An empty problems list means it can go out. Some things in the frames (header, captions) are drawn by the page rather than the composition, and captions show one line at a time.`;

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["problems"],
  properties: {
    problems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["format", "scene", "severity", "problem"],
        properties: { format: { type: "string", enum: ["landscape", "short", "both"] }, scene: string, severity: { type: "string", enum: ["blocker", "minor"] }, problem: string },
      },
    },
  },
};

export async function reviewVideo(script: Script, stills: { format: Format; scene: string; jpeg: Buffer }[], language: Language): Promise<Review> {
  const images = stills.flatMap((s): Anthropic.Beta.Messages.BetaContentBlockParam[] => [
    { type: "text", text: `${s.format}, scene "${s.scene}":` },
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.jpeg.toString("base64") } },
  ]);
  const raw = await ask({
    system: reviewSystem(language),
    effort: "high",
    schema: reviewSchema,
    content: [{ type: "text", text: `The script:\n${JSON.stringify(script, null, 1)}` }, ...images],
  });
  return ReviewSchema.parse(JSON.parse(raw));
}
