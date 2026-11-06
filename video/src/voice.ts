/**
 * The narration, in the voice of the 2026-11-05 Shorts (frontend/scratch/shorts,
 * the owner's pick for these videos): Gemini TTS, voice Kore, the same model and
 * the same direction, and the same way of cutting the read-aloud pauses down.
 *
 * A text is read in one call because a sentence read on its own loses the rhythm
 * of the script: a Short is one call, a long video one call per scene. The model
 * returns no word timings, so lines are recovered from its pauses and words are
 * spread across each line by length. Not forced alignment, but the Shorts proved
 * it lands close enough to read along with.
 *
 * Unlike those Shorts, nobody is watching when this runs, so a read whose pauses
 * do not fit its lines is asked for again and then used anyway, with a warning,
 * rather than stopping the day's video.
 */
import { writeFileSync } from "node:fs";
import type { Format, SceneScript, TimedScene, Timeline, Word } from "./types.ts";

const MODEL = process.env["GEMINI_TTS_MODEL"] || "gemini-3.1-flash-tts-preview";
const VOICE = process.env["GEMINI_TTS_VOICE"] || "Kore";
const STYLE = "Read this as a sharp, upbeat tech explainer on a short video: quick, clear and natural";
const API = process.env["GEMINI_API_URL"] || "https://generativelanguage.googleapis.com";
const RATE = 24000;

/** The silence left between lines once the read-aloud pauses are cut. */
const GAP_S = 0.14;
const SCENE_GAP_S = 0.3;
const END_HOLD_S = 1.2;
const WINDOW_S = 0.02;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function synthesise(lines: string[], attempt = 1): Promise<Float32Array> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(`${API}/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}, with a full one second pause after each line:\n${lines.join("\n")}` }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    }),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 6) {
    const wait = Number(res.headers.get("retry-after")) || 15 * attempt;
    console.log(`  Gemini TTS answered ${res.status}; waiting ${wait} s`);
    await sleep(wait * 1000);
    return synthesise(lines, attempt + 1);
  }
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
  const data = body.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) {
    // The preview model now and then ends a turn with no audio; another call answers.
    if (attempt < 6) return synthesise(lines, attempt + 1);
    throw new Error("Gemini TTS returned no audio");
  }
  let bytes = Buffer.from(data, "base64");
  // The API's docs describe a RIFF header on unary answers; the Shorts' calls got
  // bare PCM. Taking either means a change on their side cannot read a header as sound.
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF") {
    const chunk = bytes.indexOf("data", 12, "latin1");
    if (chunk > 0) bytes = bytes.subarray(chunk + 8);
  }
  const pcm = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < pcm.length; i++) pcm[i] = bytes.readInt16LE(i * 2) / 0x8000;
  return pcm;
}

function envelope(pcm: Float32Array): number[] {
  const win = Math.round(RATE * WINDOW_S);
  const out: number[] = [];
  for (let i = 0; i + win <= pcm.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += pcm[j]! * pcm[j]!;
    out.push(Math.sqrt(sum / win));
  }
  return out;
}

/** Speech stretches [start, end] in seconds, split at pauses of 220 ms or more. */
function stretches(env: number[]): [number, number][] {
  const floor = 0.02;
  const minGap = 11;
  const out: [number, number][] = [];
  let start = -1;
  let quiet = 0;
  env.forEach((v, i) => {
    if (v > floor) {
      if (start < 0) start = i;
      quiet = 0;
    } else if (start >= 0 && ++quiet >= minGap) {
      out.push([start * WINDOW_S, (i - quiet + 1) * WINDOW_S]);
      start = -1;
      quiet = 0;
    }
  });
  if (start >= 0) out.push([start * WINDOW_S, env.length * WINDOW_S]);
  return out;
}

/**
 * The script's lines onto the speech: stretches are joined across the shortest
 * gaps until one is left per line, since a comma's pause is shorter than a line's.
 * Null when the read has fewer pauses than lines.
 */
export function alignLines(spans: [number, number][], lines: string[]): [number, number][] | null {
  const groups = spans.map((s): [number, number] => [s[0], s[1]]);
  if (groups.length < lines.length) return null;
  while (groups.length > lines.length) {
    let best = 0;
    for (let i = 1; i < groups.length - 1; i++) {
      if (groups[i + 1]![0] - groups[i]![1] < groups[best + 1]![0] - groups[best]![1]) best = i;
    }
    groups.splice(best, 2, [groups[best]![0], groups[best + 1]![1]]);
  }
  return groups;
}

/**
 * A line said far faster or slower than its neighbours means a pause landed in
 * the wrong place. Lines under 25 characters don't get a vote: the Shorts' beats
 * were all of a length, but "Here's the trick." is naturally slow next to a
 * full sentence, and judging it sent every read back as bad.
 */
export function plausible(groups: [number, number][], lines: string[]): boolean {
  const rates = groups.map(([a, b], i) => ({ rate: lines[i]!.length / (b - a), long: lines[i]!.length >= 25 }));
  const long = rates.filter((r) => r.long);
  if (!long.length) return true;
  const mean = long.reduce((x, r) => x + r.rate, 0) / long.length;
  return long.every((r) => r.rate >= mean * 0.55 && r.rate <= mean * 1.6);
}

export const sentences = (text: string) => text.match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

/** Each word's start spread by length across the time the line took to say. */
function spread(line: string, from: number, seconds: number): Word[] {
  const shown = line.split(/\s+/).filter(Boolean);
  const chars = shown.reduce((n, w) => n + w.length + 1, 0);
  let c = 0;
  return shown.map((w) => {
    const t = from + (c / chars) * seconds;
    c += w.length + 1;
    return { w, t };
  });
}

interface Read {
  /** One entry per line: where that line's speech sits in the pcm. */
  spans: [number, number][];
  lines: string[];
  pcm: Float32Array;
}

async function readAloud(lines: string[], warnings: string[]): Promise<Read> {
  let pcm: Float32Array = new Float32Array(0);
  let last: [number, number][] | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    pcm = await synthesise(lines);
    last = alignLines(stretches(envelope(pcm)), lines);
    if (last && plausible(last, lines)) return { spans: last, lines, pcm };
    console.log("  the read's pauses do not fit its lines; asking again");
  }
  warnings.push(`Captions may run slightly off in "${lines[0]!.slice(0, 40)}…": the voice's pauses did not match its lines.`);
  // The split still cuts the long pauses out, which matters more to the listener than a caption's exact timing.
  if (last) return { spans: last, lines, pcm };
  return { spans: [[0, pcm.length / RATE]], lines: [lines.join(" ")], pcm };
}

/** No audio or key: silence at a typical pace, for layout work and the demo. */
function estimatedRead(lines: string[]): Read {
  let at = 0.05;
  const spans = lines.map((line): [number, number] => {
    const span: [number, number] = [at, at + line.length / 15.5];
    at = span[1] + 0.5;
    return span;
  });
  return { spans, lines, pcm: new Float32Array(Math.round(at * RATE)) };
}

function wav(samples: Float32Array): Buffer {
  const head = Buffer.alloc(44);
  const size = samples.length * 2;
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + size, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(size, 40);
  const body = Buffer.alloc(size);
  for (let i = 0; i < samples.length; i++) body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 0x7fff), i * 2);
  return Buffer.concat([head, body]);
}

const stamp = (s: number) => {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** Writes narration.wav, timeline.json and captions.srt under `dir`. */
export async function voiceCut(format: Format, scenes: SceneScript[], dir: string, warnings: string[], estimate = false): Promise<Timeline> {
  // A Short is one call, for its rhythm. A long cut is one call per scene: a
  // five-minute read in one call would lose everything to a single bad pause.
  const reads = async (lines: string[]) => (estimate ? estimatedRead(lines) : readAloud(lines, warnings));
  const sceneLines = scenes.map((s) => sentences(s.narration));
  const perScene: Read[] = [];
  if (format === "short") {
    const all = await reads(sceneLines.flat());
    // Hand each scene its share of the one read. A fallback read has no lines
    // to share out, so it goes out as the first scene's and the rest draw from
    // the proportional split below.
    if (all.lines.length === sceneLines.flat().length) {
      let i = 0;
      for (const lines of sceneLines) {
        perScene.push({ pcm: all.pcm, lines, spans: all.spans.slice(i, i + lines.length) });
        i += lines.length;
      }
    } else {
      const total = sceneLines.flat().join(" ").length;
      const end = all.spans[0]![1];
      let at = 0;
      for (const lines of sceneLines) {
        const text = lines.join(" ");
        const span: [number, number] = [at, at + (text.length / total) * end];
        perScene.push({ pcm: all.pcm, lines: [text], spans: [span] });
        at = span[1];
      }
    }
  } else {
    for (const [i, lines] of sceneLines.entries()) {
      console.log(`  voicing ${i + 1}/${sceneLines.length}: ${scenes[i]!.id}`);
      perScene.push(await reads(lines));
    }
  }

  const parts: Float32Array[] = [];
  let at = 0;
  const push = (p: Float32Array) => {
    parts.push(p);
    at += p.length;
  };
  const timed: TimedScene[] = [];
  const srt: string[] = [];
  scenes.forEach((scene, index) => {
    const read = perScene[index]!;
    const start = at / RATE;
    const words: Word[] = [];
    read.lines.forEach((line, l) => {
      const [a, b] = read.spans[l]!;
      const from = Math.max(0, Math.round((a - 0.03) * RATE));
      const to = Math.min(read.pcm.length, Math.round((b + 0.05) * RATE));
      const lineStart = at / RATE;
      const seconds = (to - from) / RATE;
      push(read.pcm.subarray(from, to));
      push(new Float32Array(Math.round(GAP_S * RATE)));
      words.push(...spread(line, lineStart, seconds));
      srt.push(`${srt.length + 1}\n${stamp(lineStart)} --> ${stamp(lineStart + seconds)}\n${line}\n`);
    });
    push(new Float32Array(Math.round(SCENE_GAP_S * RATE)));
    timed.push({ id: scene.id, title: scene.title, start, end: at / RATE, words });
  });
  // The end card stays up a moment after the last word.
  push(new Float32Array(Math.round(END_HOLD_S * RATE)));

  const track = new Float32Array(at);
  let w = 0;
  for (const part of parts) {
    track.set(part, w);
    w += part.length;
  }
  let peak = 0;
  for (const v of track) peak = Math.max(peak, Math.abs(v));
  // -1 dBFS, as the Shorts: speech alone in a feed of music is the quiet one otherwise.
  if (peak > 0) for (let i = 0; i < track.length; i++) track[i] = track[i]! * (0.89 / peak);

  const duration = at / RATE;
  timed[timed.length - 1]!.end = duration;
  const timeline: Timeline = { format, duration, scenes: timed };
  writeFileSync(`${dir}/narration.wav`, wav(track));
  writeFileSync(`${dir}/timeline.json`, JSON.stringify(timeline));
  writeFileSync(`${dir}/captions.srt`, srt.join("\n"));
  return timeline;
}
