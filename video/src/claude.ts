/**
 * Every call to Claude, and what they cost. VIDEO_MODEL picks the model;
 * the run's real spend is reported to the campaign page.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FRAMES, ReviewSchema, ScriptSchema, type Format, type Review, type Script, type Timeline, type Usage } from "./types.ts";

export const MODEL = process.env["VIDEO_MODEL"] || "claude-opus-5-5";
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
}

async function ask({ system, content, effort, schema }: Ask): Promise<string> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    betas: ["server-side-fallback-2026-07-01"],
    // A classifier declining mid-run (a security topic, say) falls over to the
    // recommended model rather than costing the day's video.
    fallbacks: "default",
    // One hour: a long composition outlasts the 5-minute cache, and the next call needs the prefix.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral", ttl: "1h" } }],
    messages: [{ role: "user", content }],
    output_config: { effort, ...(schema ? { format: { type: "json_schema", schema } } : {}) },
  } as unknown as Anthropic.Beta.Messages.MessageCreateParamsStreaming);
  const message = await stream.finalMessage();

  const u = message.usage;
  const price = PRICES[MODEL] ?? PRICES["claude-opus-5-5"]!;
  const write = u.cache_creation_input_tokens ?? 0;
  const read = u.cache_read_input_tokens ?? 0;
  spend.input += u.input_tokens;
  spend.cacheWrite += write;
  spend.cacheRead += read;
  spend.output += u.output_tokens;
  spend.usd += (u.input_tokens * price[0] + write * price[1] + read * price[2] + u.output_tokens * price[3]) / 1e6;
  console.log(`  ${u.input_tokens} in, ${write} cache write, ${read} cache read, ${u.output_tokens} out; run total $${spend.usd.toFixed(3)}`);

  if (message.stop_reason === "refusal") throw new Error("Claude declined this topic.");
  if (message.stop_reason === "max_tokens") throw new Error("Claude ran out of room before finishing.");
  return message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/* ── The script ─────────────────────────────────────────────────────── */

const string = { type: "string" };
const cutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "tags", "scenes"],
  properties: {
    title: string,
    description: string,
    tags: { type: "array", items: string },
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
  required: ["topic", "practicePath", "code", "thumbnail", "landscape", "short"],
  properties: {
    topic: string,
    practicePath: string,
    code: {
      anyOf: [
        { type: "null" },
        { type: "object", additionalProperties: false, required: ["language", "source", "expectedOutput"], properties: { language: string, source: string, expectedOutput: string } },
      ],
    },
    thumbnail: { type: "object", additionalProperties: false, required: ["headline", "tag"], properties: { headline: string, tag: string } },
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

const scriptSystem = (facts: string) => `You write the daily explainer videos for CodeKairo's YouTube channel. Each topic gets two cuts: a landscape tutorial and a vertical Short.

About CodeKairo, the only facts about it you may state: ${facts}

The audience is Indian engineering students preparing for coding interviews and campus placements. Treat them as smart and short of time.

The landscape cut runs 3 to 5 minutes, 450 to 800 words, in 7 to 12 scenes. Its usual arc for an algorithm: a hook, the problem, the obvious approach and why it falls short, the insight, a step-by-step walkthrough on a small concrete example, a common mistake, the code, the complexity, then a sign-off. Other kinds of topic take the arc that suits them.

The Short runs 30 to 60 seconds, 80 to 150 words, in 3 to 6 scenes. It opens on one surprising, concrete claim in the first sentence, since a viewer decides in two seconds, shows the one idea that makes the topic click, and ends by sending them to CodeKairo. It stands on its own and is not a trimmed copy of the long cut.

Narration is read aloud by a text-to-speech voice, so write for the ear: short sentences, plain words, no markdown. Spell numbers and symbols out as they should be spoken ("twenty three", "O of log n", "n squared"). Every statement about the topic must be correct; a viewer will be tested on it in an interview, so walk the example through and check each value before you write it down.

"visual" tells the animator what the scene shows and which spoken words the changes land on. Anything that can be computed, such as array states, should come from a concrete example given in full there.

Scene ids are unique, lower-case-with-dashes, and the two cuts have separate lists. Scene titles are 40 characters or fewer.

"code" is for a topic with a program worth showing: a complete Java file with a class named Main whose main method prints results, plus exactly what it prints as expectedOutput. It is compiled and run, and shown to viewers exactly as written, so keep it short enough for a screen (under 30 lines) and well named. Use null when the topic has no program, such as most system design.

"practicePath" is the path on codekairo.com to practise this, such as /problems/two-sum, /roadmap, /notes/system-design/rate-limiting or /challenges. If you are unsure a specific page exists, use /challenges.

Titles are what a student would search for and under 100 characters. Avoid "<" and ">" in titles and descriptions; YouTube refuses them. Descriptions say what the viewer learns in 2 to 4 sentences; links, chapters and hashtags get added for you. Thumbnail headline is 2 to 6 punchy words, at most 40 characters.`;

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

export async function writeScript(prompt: string, posted: string[]): Promise<Script> {
  const earlier = posted.length ? `\n\nAlready on the channel. Never repeat these topics, angles or hooks:\n${posted.map((t) => `- ${t}`).join("\n")}` : "";
  const raw = await ask({ system: scriptSystem(await siteFacts()), content: `Today's video: ${prompt}${earlier}`, effort: "high", schema: scriptSchema });
  return ScriptSchema.parse(JSON.parse(raw));
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

## The look

This is a CodeKairo page in motion. Dark ground #0A0A0A; surfaces #111111, #161616, #1C1C1C; hairlines #262626, #383838; text #F5F5F5, secondary #A3A3A3, muted #8C8C8C. The one colour is blue: accent #3AA9FF, highlight #7CC9FF, deep steps #0794F9, #0068CC. State colours only name a state: success #52C98A, error #FF7A7E. Gilroy (400, 500, 600, 700) for words and 'JetBrains Mono' for code and values. No gradients, glass, glows or shadows. Corners are 8px at most.

Everything must be readable on a phone: on a Short keep text at 34px or larger, on landscape 26px or larger. Fill the stage with one large idea at a time rather than scattering small items. Text must stay inside the stage; check your sizes against its width and height.

Show the idea moving: values travel, pointers glide between cells, things get crossed out as the voice says why. A viewer should get the idea with the sound off. Compute drawn values by running the algorithm in the script rather than typing them, so the picture can't contradict itself, and make sure it agrees with the narration.

Rich layouts need care but not bulk: reuse helpers across scenes and keep the file as small as the picture allows.

## Reference

A complete composition for a three-scene Short. Match its discipline, then go further with the visuals; a scene should usually show more movement than this.

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

export async function compose(script: Script, format: Format, timeline: Timeline): Promise<string> {
  const { stage } = FRAMES[format];
  const reply = await ask({
    system: composeSystem(),
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
  const reply = await ask({
    system: composeSystem(),
    effort: "medium",
    content: `This ${format} composition for "${script.topic}" needs fixing.

Problems:
${problems.map((p) => `- ${p}`).join("\n")}

Scenes:

${sceneBrief(script, format, timeline)}

The composition:

\`\`\`html
${composition}
\`\`\`

Fix every problem, keep what works, and reply with the whole corrected composition.`,
  });
  return fenced(reply);
}

/* ── The review ─────────────────────────────────────────────────────── */

const REVIEW_SYSTEM = `You check CodeKairo's explainer videos before they go public. They publish without a person watching, so you are the last reader.

You get the script, and frames from late in each scene. Report a blocker for a technical error in the narration, code or picture; a picture that contradicts what is said; text that overlaps, is cut off or is too small to read on a phone; or a scene that is blank or plainly unfinished. Frames are half size, so judge text by its proportion of the frame.

A frame caught mid-animation is fine, and so is a design you would have done differently: report those as minor or not at all. An empty problems list means it can go out. Some things in the frames (header, captions) are drawn by the page rather than the composition, and captions show one line at a time.`;

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

export async function reviewVideo(script: Script, stills: { format: Format; scene: string; jpeg: Buffer }[]): Promise<Review> {
  const images = stills.flatMap((s): Anthropic.Beta.Messages.BetaContentBlockParam[] => [
    { type: "text", text: `${s.format}, scene "${s.scene}":` },
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.jpeg.toString("base64") } },
  ]);
  const raw = await ask({
    system: REVIEW_SYSTEM,
    effort: "high",
    schema: reviewSchema,
    content: [{ type: "text", text: `The script:\n${JSON.stringify(script, null, 1)}` }, ...images],
  });
  return ReviewSchema.parse(JSON.parse(raw));
}
