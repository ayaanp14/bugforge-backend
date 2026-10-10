/**
 * Questions read aloud in a real voice: Amazon Polly's neural engine, in place
 * of the browser's `speechSynthesis`, which on most machines is the robotic
 * system voice (the owner's call, 2026-10-11 — Polly for its 12-month free
 * tier, Kajal for an Indian English voice).
 *
 * Credentials come from the SDK's default chain: on EC2 the instance role
 * (`codekairo-ec2-ssm` carries an inline `polly:SynthesizeSpeech` policy; the
 * container reaches IMDS because the hop limit is 2), locally
 * `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` or an `aws login` profile. With
 * none, a call fails and the route answers 503 — the client then falls back to
 * the browser voice, so the button never goes dead.
 *
 * Only text the server already holds is ever synthesised (the route reads a
 * question row by id), so the endpoint cannot be used as a free TTS proxy for
 * arbitrary text — the free tier is characters, and those are ours.
 */
import { createHash } from "node:crypto";
import { PollyClient, SynthesizeSpeechCommand, type Engine, type LanguageCode, type VoiceId } from "@aws-sdk/client-polly";

const VOICE = (process.env["POLLY_VOICE"] || "Kajal") as VoiceId;
const ENGINE = (process.env["POLLY_ENGINE"] || "neural") as Engine;
const REGION = process.env["POLLY_REGION"] || process.env["AWS_REGION"] || "ap-south-1";

/**
 * Kajal and Aditi speak both Indian English and Hindi; for them the language
 * must be named or Polly may pick Hindi phonetics for an English question.
 * Any other voice has one language and refuses a LanguageCode it lacks.
 */
const BILINGUAL = new Set(["Kajal", "Aditi"]);
const LANGUAGE = (process.env["POLLY_LANGUAGE"] || (BILINGUAL.has(VOICE) ? "en-IN" : "")) as LanguageCode | "";

/** `POLLY=off` turns the feature off without a deploy of the client. */
export const speechEnabled = process.env["POLLY"] !== "off";

/** SynthesizeSpeech refuses more than 3,000 billed characters; a question is a few hundred. */
const MAX_CHARS = 2_900;

/** A Polly answer is ~0.5–1 s; past this the browser voice is the better experience. */
const TIMEOUT_MS = 8_000;

/**
 * Generated audio, kept in process. A question's text never changes once
 * asked, so its audio is reusable for as long as the process lives: a replay
 * or a reload spends no characters. ~60 KB a question at Polly's 24 kHz MP3;
 * the byte budget bounds it however long the process runs.
 */
const CACHE_BYTES = 32 * 1024 * 1024;
const audioCache = new Map<string, Buffer>();
let cachedBytes = 0;
const inFlight = new Map<string, Promise<Buffer>>();

let client: PollyClient | null = null;
const pollyClient = () => (client ??= new PollyClient({ region: REGION, maxAttempts: 2 }));

/**
 * The question as a voice should read it: markdown marks and code
 * punctuation spelt out by a synthesiser ("backtick", "asterisk") are
 * dropped, sentence punctuation kept for the pauses. The same rule the
 * browser path used, so both voices read the same words.
 */
export function speakableText(text: string): string {
  const clean = text.replace(/[`"/[\](){}*#_+-]/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_CHARS) return clean;
  const cut = clean.slice(0, MAX_CHARS);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return sentenceEnd > MAX_CHARS / 2 ? cut.slice(0, sentenceEnd + 1) : cut;
}

function remember(key: string, audio: Buffer) {
  audioCache.set(key, audio);
  cachedBytes += audio.length;
  // Map iteration is insertion order, so the first key is the oldest.
  for (const [oldKey, old] of audioCache) {
    if (cachedBytes <= CACHE_BYTES) break;
    audioCache.delete(oldKey);
    cachedBytes -= old.length;
  }
}

async function synthesize(text: string): Promise<Buffer> {
  const answer = await pollyClient().send(
    new SynthesizeSpeechCommand({
      Text: text,
      TextType: "text",
      OutputFormat: "mp3",
      VoiceId: VOICE,
      Engine: ENGINE,
      ...(LANGUAGE ? { LanguageCode: LANGUAGE } : {}),
    }),
    { abortSignal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!answer.AudioStream) throw new Error("Polly returned no audio");
  return Buffer.from(await answer.AudioStream.transformToByteArray());
}

/**
 * MP3 audio of `text` read aloud. Cached by voice + text; two requests for
 * the same text at once (a double click, the auto-read racing the button)
 * share one Polly call. Throws when Polly is unreachable or refuses.
 */
export async function speechFor(text: string): Promise<Buffer> {
  const speakable = speakableText(text);
  if (!speakable) throw new Error("Nothing to read");
  const key = createHash("sha256").update(`${VOICE}|${ENGINE}|${LANGUAGE}|${speakable}`).digest("hex");

  const hit = audioCache.get(key);
  if (hit) {
    // Re-insert so a replayed question counts as recently used.
    audioCache.delete(key);
    audioCache.set(key, hit);
    return hit;
  }

  let pending = inFlight.get(key);
  if (!pending) {
    pending = synthesize(speakable)
      .then((audio) => {
        remember(key, audio);
        return audio;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}
