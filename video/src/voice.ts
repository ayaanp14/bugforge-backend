/**
 * The narration: Amazon Polly, voice Kajal (neural, Indian English), the voice the
 * site reads interview questions in. The owner's call on 2026-11-07, after the first
 * real run died on Gemini TTS's free tier (ten voice requests a day, where one video
 * needs a dozen), and after hearing Kajal generative and neural read the same
 * Hinglish: neural. It reads Roman-script Hinglish and English alike.
 *
 * Polly reports when every word is said (speech marks), so the captions and the
 * animation cues land on the words exactly. Each scene is one request, which keeps
 * every read under Polly's 3,000-character cap. POLLY_VOICE / POLLY_ENGINE /
 * POLLY_REGION change the voice; a voice without speech marks (the generative
 * engine has none) is timed instead from the pauses between its sentences.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { PollyClient, SynthesizeSpeechCommand, type Engine, type LanguageCode, type VoiceId } from "@aws-sdk/client-polly";
import ffmpegStatic from "ffmpeg-static";
import type { Format, SceneScript, TimedScene, Timeline, Word } from "./types.ts";

const RATE = 24000;
const VOICE = (process.env["POLLY_VOICE"] || "Kajal") as VoiceId;
const ENGINE = (process.env["POLLY_ENGINE"] || "neural") as Engine;
// Kajal and Aditi speak Indian English and Hindi; unnamed, Polly may read English with Hindi phonetics.
const LANGUAGE = (process.env["POLLY_LANGUAGE"] || (["Kajal", "Aditi"].includes(VOICE) ? "en-IN" : "")) as LanguageCode | "";
// Generative voices are served from fewer regions than neural ones (Kajal generative: us-east-1 only).
const REGION = process.env["POLLY_REGION"] || (ENGINE === "generative" ? "us-east-1" : "ap-south-1");
/** SynthesizeSpeech refuses more than 3,000 billed characters a request. */
const MAX_CHARS = 2900;

/** The silence left between lines once each line's own trailing silence is cut. */
const GAP_S = 0.14;
const SCENE_GAP_S = 0.3;
const END_HOLD_S = 1.2;
const WINDOW_S = 0.02;

export const voiceName = () => `Polly ${VOICE} (${ENGINE})`;

/* ── Polly ───────────────────────────────────────────────────────────── */

let polly: PollyClient | null = null;

async function pollyCall(text: string, format: "mp3" | "json"): Promise<Buffer> {
  if (text.length > MAX_CHARS) throw new Error(`A scene's narration is ${text.length} characters; Polly takes ${MAX_CHARS} a request.`);
  polly ??= new PollyClient({ region: REGION, maxAttempts: 4 });
  const answer = await polly.send(
    new SynthesizeSpeechCommand({
      Text: text,
      TextType: "text",
      VoiceId: VOICE,
      Engine: ENGINE,
      ...(LANGUAGE ? { LanguageCode: LANGUAGE } : {}),
      OutputFormat: format,
      ...(format === "mp3" ? { SampleRate: "24000" } : { SpeechMarkTypes: ["sentence", "word"] }),
    }),
  );
  if (!answer.AudioStream) throw new Error("Polly returned no audio");
  return Buffer.from(await answer.AudioStream.transformToByteArray());
}

/**
 * MP3 rather than Polly's raw PCM, which stops at 16 kHz and sounds like a phone
 * line; 24 kHz MP3 decoded here keeps the voice crisp.
 */
function decodeMp3(mp3: Buffer): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const ff = spawn(process.env["FFMPEG_PATH"] || (ffmpegStatic as unknown as string), ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", String(RATE), "pipe:1"]);
    const out: Buffer[] = [];
    ff.stdout.on("data", (d: Buffer) => out.push(d));
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg could not decode Polly's audio (${code})`));
      const all = Buffer.concat(out);
      const usable = all.length - (all.length % 4);
      resolve(new Float32Array(all.buffer.slice(all.byteOffset, all.byteOffset + usable)));
    });
    ff.stdin.end(mp3);
  });
}

/* ── Timing from the audio itself, for a voice with no speech marks ─────── */

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

/** The end of the speech before `limit`: a line's own trailing silence is cut. */
function speechEnd(pcm: Float32Array, from: number, limit: number): number {
  const env = envelope(pcm.subarray(Math.round(from * RATE), Math.round(limit * RATE)));
  for (let i = env.length - 1; i >= 0; i--) if (env[i]! > 0.02) return from + (i + 1) * WINDOW_S;
  return limit;
}

export const sentences = (text: string) => text.match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

/** Each word's start spread by length across the time the line took to say. */
/** The same words in the same order, ignoring case and punctuation. */
export function sameWords(a: string, b: string): boolean {
  const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, " ").trim().split(/\s+/).join(" ");
  return words(a) === words(b);
}

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

/* ── A read ──────────────────────────────────────────────────────────── */

interface Read {
  /** One entry per line: where that line's speech sits in the pcm. */
  spans: [number, number][];
  lines: string[];
  pcm: Float32Array;
  /** When the voice reported them: each line's words, timed in the pcm. Otherwise spread by length. */
  words?: Word[][];
}

interface Mark {
  time: number;
  type: string;
  /** Byte offsets of the text this mark speaks, in the request's text. */
  start?: number;
  end?: number;
  value: string;
}

/**
 * Each stretch of the script once, in order. Polly can report spelled-out letters
 * twice: "a b c a b c b b" came back as "a b c b c a b c b c b b" (run cmwbx65h7,
 * 2026-11-10), most likely the letters read once as letters and again as the
 * abbreviation "ABC", and the captions printed every mark. A repeated mark covers
 * text an earlier one already covered, so a word mark that starts before the
 * previous one ends is dropped. Marks without offsets are all kept, as before.
 */
export function distinctWords<T extends { start?: number; end?: number }>(marks: T[]): T[] {
  let covered = -1;
  return marks.filter((m) => {
    if (typeof m.start !== "number" || typeof m.end !== "number") return true;
    if (m.start < covered) return false;
    covered = m.end;
    return true;
  });
}

/**
 * One scene read aloud, its lines and every word's time taken from Polly's speech
 * marks. The sentences Polly itself heard are the caption lines, so its marks and
 * the lines can never disagree.
 */
async function pollyRead(lines: string[], warnings: string[]): Promise<Read> {
  const text = lines.join(" ");
  const pcm = await decodeMp3(await pollyCall(text, "mp3"));
  const duration = pcm.length / RATE;
  let marks: Mark[] = [];
  try {
    marks = (await pollyCall(text, "json")).toString("utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Mark);
  } catch (err) {
    console.log(`  no speech marks for ${voiceName()} (${(err as Error).name}); timing by pauses`);
  }
  const said = marks.filter((m) => m.type === "sentence");
  const words = distinctWords(marks.filter((m) => m.type === "word"));
  if (!said.length || !words.length) {
    const spans = alignLines(stretches(envelope(pcm)), lines);
    if (spans) return { spans, lines, pcm };
    warnings.push(`Captions may run slightly off in "${lines[0]!.slice(0, 40)}…": the voice gave no timings.`);
    return { spans: [[0, duration]], lines: [text], pcm };
  }
  const spans: [number, number][] = [];
  const lineWords: Word[][] = [];
  said.forEach((sentence, i) => {
    const start = sentence.time / 1000;
    const next = said[i + 1] ? said[i + 1]!.time / 1000 : duration;
    spans.push([start, speechEnd(pcm, start, next)]);
    lineWords.push(words.filter((w) => w.time / 1000 >= start && w.time / 1000 < next).map((w) => ({ w: w.value, t: w.time / 1000 })));
  });
  return { spans, lines: said.map((x) => x.value.trim()), pcm, words: lineWords };
}

/** No audio or credentials: silence at a typical pace, for layout work and the demo. */
function estimatedRead(lines: string[]): Read {
  let at = 0.05;
  const spans = lines.map((line): [number, number] => {
    const span: [number, number] = [at, at + line.length / 15.5];
    at = span[1] + 0.5;
    return span;
  });
  return { spans, lines, pcm: new Float32Array(Math.round(at * RATE)) };
}

/* ── The cut ─────────────────────────────────────────────────────────── */

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
  const perScene: Read[] = [];
  for (const [i, scene] of scenes.entries()) {
    console.log(`  voicing ${format} ${i + 1}/${scenes.length}: ${scene.id}`);
    const lines = sentences(scene.narration);
    perScene.push(estimate ? estimatedRead(lines) : await pollyRead(lines, warnings));
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
      // Polly's own word times when its words are the line's words; otherwise the
      // line's words spread over its speech, so a caption never prints a word the
      // script doesn't say (the second guard behind distinctWords).
      const said = read.words?.[l];
      const exact = said?.length && sameWords(said.map((x) => x.w).join(" "), line);
      if (said?.length && !exact) console.log(`  captions for "${line.slice(0, 40)}…" timed by length: the voice's words didn't match the script`);
      words.push(...(exact ? said!.map((x) => ({ w: x.w, t: lineStart + Math.max(0, x.t - from / RATE) })) : spread(line, lineStart, seconds)));
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
  // -1 dBFS: speech alone in a feed of music is the quiet one otherwise.
  if (peak > 0) for (let i = 0; i < track.length; i++) track[i] = track[i]! * (0.89 / peak);

  const duration = at / RATE;
  timed[timed.length - 1]!.end = duration;
  const timeline: Timeline = { format, duration, scenes: timed };
  writeFileSync(`${dir}/narration.wav`, wav(track));
  writeFileSync(`${dir}/timeline.json`, JSON.stringify(timeline));
  writeFileSync(`${dir}/captions.srt`, srt.join("\n"));
  return timeline;
}
