import type { SpokenLine } from "../services/interview-ai.js";

/**
 * The pure half of the voice interview: turning what the client reported into
 * something worth storing and scoring.
 *
 * Kept out of the route handlers because none of it needs a database, a request
 * or a model — which also makes it the part that can be tested directly.
 */

/** The running state a round is conducted from — see PHASE 13. */
export interface VoiceState {
  currentQuestion: number;
  questionsCompleted: number;
  followUpsAsked: number;
  topicsCovered: string[];
  interruptions: number;
  /** Last resumption handle the model gave us, so a drop can pick back up. */
  resumeHandle: string | null;
}

export const EMPTY_STATE: VoiceState = {
  currentQuestion: 1,
  questionsCompleted: 0,
  followUpsAsked: 0,
  topicsCovered: [],
  interruptions: 0,
  resumeHandle: null,
};

/**
 * A stored state may predate any field here, so every read goes through this.
 *
 * `topicsCovered` is copied rather than spread through: a shallow spread hands
 * every caller the *same* array as the one on `EMPTY_STATE`, so one caller
 * pushing a topic would silently change the default for every session this
 * process handles afterwards.
 */
export function stateOf(raw: unknown): VoiceState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_STATE, topicsCovered: [] };
  }
  const stored = raw as Partial<VoiceState>;
  return {
    ...EMPTY_STATE,
    ...stored,
    topicsCovered: Array.isArray(stored.topicsCovered) ? [...stored.topicsCovered] : [],
  };
}

/**
 * Transcription arrives in fragments — a few words at a time, as the speech
 * recogniser commits them — and each fragment is persisted on its own so a
 * crash loses at most a second. Scoring wants turns, not fragments, so
 * consecutive rows from the same speaker are run back together here.
 *
 * Speaker changes are the only turn boundary that matters: the model's own
 * `turnComplete` is about audio generation, not about who was talking.
 */
export function coalesce(events: Array<{ speaker: string; text: string | null }>): SpokenLine[] {
  const lines: SpokenLine[] = [];
  for (const event of events) {
    const text = (event.text ?? "").trim();
    if (!text) continue;
    const speaker = event.speaker === "interviewer" ? "interviewer" : "candidate";
    const last = lines[lines.length - 1];
    if (last && last.speaker === speaker) {
      last.text = `${last.text} ${text}`.replace(/\s+/g, " ").trim();
    } else {
      lines.push({ speaker, text });
    }
  }
  return lines;
}

/** Words the candidate actually contributed — the bar for "worth scoring". */
export function candidateWordCount(lines: SpokenLine[]): number {
  return lines
    .filter((line) => line.speaker === "candidate")
    .reduce((total, line) => total + line.text.split(/\s+/).filter(Boolean).length, 0);
}

const SPEAKERS = new Set(["candidate", "interviewer", "system"]);
/** One batch is a second or two of conversation; this is a sanity bound. */
export const MAX_BATCH = 200;
const MAX_TEXT = 8000;

export interface SanitizedEvent {
  sequence: number;
  speaker: string;
  type: string;
  text: string | null;
  questionNumber: number | null;
  metadata: Record<string, unknown>;
}

/**
 * The client owns sequence numbers, so everything it sends is untrusted input
 * on a row that later becomes a score. Anything malformed is dropped rather
 * than stored — a bad row cannot be corrected later, but a missing one is just
 * a gap in a transcript that is already lossy.
 */
export function sanitizeEvents(raw: unknown): SanitizedEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_BATCH)
    .filter(
      (event): event is Record<string, unknown> =>
        Boolean(event) &&
        typeof event === "object" &&
        Number.isInteger((event as { sequence?: unknown }).sequence) &&
        ((event as { sequence: number }).sequence) >= 0 &&
        typeof (event as { type?: unknown }).type === "string" &&
        SPEAKERS.has((event as { speaker?: unknown }).speaker as string),
    )
    .map((event) => ({
      sequence: event.sequence as number,
      speaker: event.speaker as string,
      type: (event.type as string).slice(0, 64),
      text: typeof event.text === "string" ? (event.text as string).slice(0, MAX_TEXT) : null,
      questionNumber: Number.isInteger(event.questionNumber) ? (event.questionNumber as number) : null,
      metadata:
        event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
          ? (event.metadata as Record<string, unknown>)
          : {},
    }));
}
