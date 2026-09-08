import type { InterviewConfig } from "./interview-ai.js";

/**
 * The realtime (spoken) interview layer.
 *
 * The written round talks to Nemotron over chat-completions and owns its own
 * turn loop; a spoken round cannot work that way, because the audio never
 * reaches this process. The browser holds the socket to the model directly —
 * anything else would put a proxy hop in the middle of a conversation whose
 * whole point is that it is low latency.
 *
 * So this module issues credentials and context rather than running the
 * conversation: it mints a short-lived token, decides what the interviewer is
 * told, and hands the browser the smallest possible description of the session
 * it needs to open. What comes back is persisted through the events endpoint.
 *
 * Nothing Gemini-specific belongs above `RealtimeProvider`. A second vendor is
 * a second implementation of that interface and a new `PROVIDERS` entry, not a
 * change to the routes or to any of the UI.
 */

/** Everything the interviewer is told about the room, and nothing more. */
export interface InterviewContext {
  role: string;
  round: string;
  experience: string;
  difficulty: string;
  style: string;
  language: string;
  topics: string[];
  /** The wall-clock budget for the whole round. Questions asked follow from it. */
  durationMinutes: number;
  /** Non-empty only when resuming a round that already asked something. */
  askedSoFar: string[];
  currentQuestion: number;
  candidateName: string | null;
}

/** What the browser needs to open the session, and nothing more. */
export interface RealtimeCredential {
  provider: string;
  model: string;
  /** Short-lived. Never the account key. */
  token: string;
  /** Fully-formed socket URL with the credential already in place. */
  url: string;
  expiresAt: string;
  /**
   * The `setup` frame the client must send first. Assembled here so the system
   * instruction and the audio/session policy live server-side, where they can
   * change without shipping a new bundle.
   */
  setup: Record<string, unknown>;
}

export interface RealtimeProvider {
  readonly id: string;
  readonly model: string;
  /** False when the deployment has no key configured; the route 503s on it. */
  isConfigured(): boolean;
  createCredential(context: InterviewContext, resumeHandle?: string | null): Promise<RealtimeCredential>;
}

/* ── the interviewer's brief ───────────────────────────────────────────── */

/**
 * Spoken interviewing is a different skill from written interviewing, so this
 * is its own prompt rather than the written RUBRIC with a note bolted on.
 *
 * The written rubric optimises for a considered paragraph the candidate typed
 * over two minutes. Here the candidate is talking, the model is talking back in
 * audio, and every sentence it generates is a sentence they sit through — so
 * brevity is not a style preference, it is the difference between a
 * conversation and a lecture. The scoring guidance is deliberately absent: the
 * realtime model never scores anything. Marks come from the transcript
 * afterwards, on a model that can afford to think about it.
 */
function systemInstruction(context: InterviewContext): string {
  const asked = context.askedSoFar.length
    ? `\n\nAlready asked in this session — do not repeat these:\n${context.askedSoFar
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n")}`
    : "";

  const named = context.candidateName ? ` The candidate's name is ${context.candidateName}.` : "";

  return `You are a senior engineer conducting a live, spoken technical interview for a ${context.role} position.${named} This is a ${context.round} round at ${context.difficulty} difficulty, for someone at the ${context.experience} experience band. Primary language: ${context.language}. Interview style: ${context.style}.

Topics in scope: ${context.topics.join(", ") || "general software engineering"}.

## You are speaking, not writing

Your words are converted to speech and the candidate hears them in real time. Every sentence costs them waiting.

- Keep each turn to one to three sentences. Never deliver a paragraph.
- Ask exactly one question per turn. Never stack two questions together.
- No lists, no headings, no code blocks, no markdown — none of it survives being spoken.
- Speak numbers and symbols as a person would say them out loud.
- Use plain conversational English. Contractions are good.

## How you run the round

Open by introducing yourself in one sentence, then ask your first question immediately. Do not spend the candidate's time on preamble.

Probe. Do not march through a list. When an answer is vague, thin, or names a technology without justifying it, ask the obvious follow-up before moving on — that follow-up is where the signal is.

  Candidate: "I'd add Redis caching."
  You: "What would you cache, and how would you handle invalidation?"

Go deeper on a strong answer; change topic after a weak one, since a candidate who missed a question rarely recovers on its follow-up. Move between topics naturally, and never ask something already covered.

## The clock

This round lasts ${context.durationMinutes} minutes and ends automatically when the time is up. How many questions fit is up to you — cover as much ground as the time genuinely allows, without rushing the candidate through it.

Pace accordingly: with ${context.durationMinutes} minutes you have room for roughly ${Math.max(2, Math.round(context.durationMinutes / 2.5))} main threads plus their follow-ups. Do not race to fit more in, and do not linger so long on one topic that you learn nothing else about them.

Never mention the time, count the questions out loud, or tell the candidate how far through they are. They can see the clock. If you are told the time is nearly up, close the interview in one or two sentences and stop.

If the candidate interrupts you, stop and listen. They have the floor.

If they go quiet mid-thought, wait. Do not fill the silence — a pause is them thinking. Only prompt if the silence is long enough to be a stall, and then prompt gently.

If they ask you to repeat or rephrase, do it plainly without penalty.

## What you assess

Technical correctness, depth of understanding, problem solving, complexity and tradeoff reasoning, code and design quality, debugging instinct, and how clearly they communicate. Confident and wrong is worse than hesitant and right.

## Boundaries

Never state or hint at a score, a verdict, or how they are doing. If asked, say the feedback comes at the end.

Do not supply the answer to your own question. If they are stuck, narrow the question or offer a hint that still leaves them the work.

Stay in role. You are an interviewer, not an assistant: decline unrelated requests briefly and return to the interview.

When you have covered the ground, close the interview in one or two sentences, tell them their report is being prepared, and stop.${asked}`;
}

/** The compact brief — ids resolved to English, nothing the model cannot use. */
export function buildContext(args: {
  config: InterviewConfig;
  durationMinutes: number;
  language: string;
  roleLabel: string;
  roundLabel: string;
  topics: string[];
  askedSoFar?: string[];
  currentQuestion?: number;
  candidateName?: string | null;
}): InterviewContext {
  return {
    role: args.roleLabel,
    round: args.roundLabel,
    experience: args.config.experienceBand,
    difficulty: args.config.difficulty,
    style: args.config.interviewStyle,
    language: args.language,
    topics: args.topics,
    durationMinutes: args.durationMinutes,
    askedSoFar: args.askedSoFar ?? [],
    currentQuestion: args.currentQuestion ?? 1,
    candidateName: args.candidateName ?? null,
  };
}

/* ── Gemini Live ───────────────────────────────────────────────────────── */

const GEMINI_HOST = "generativelanguage.googleapis.com";

/**
 * Ephemeral tokens are the whole reason the browser can hold the socket. The
 * account key mints a token that is single-use and short-lived, so the worst a
 * leaked one buys is the session it was already for — never the account.
 *
 * The published docs describe a `liveConnectConstraints` field that would also
 * pin the token to one model and config. The live v1beta and v1alpha endpoints
 * both reject it outright ("Unknown name liveConnectConstraints"), so it is not
 * sent. Verified against the API rather than copied from the example.
 */
const gemini: RealtimeProvider = {
  id: "gemini",
  model: process.env["GEMINI_LIVE_MODEL"] || "gemini-3.1-flash-live-preview",

  isConfigured() {
    return Boolean(process.env["GEMINI_API_KEY"]);
  },

  async createCredential(context, resumeHandle) {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) throw new Error("Set GEMINI_API_KEY to run voice interviews");

    const model = `models/${this.model}`;
    const now = Date.now();

    /**
     * `newSessionExpireTime` is the window to *open* the socket; `expireTime`
     * is how long that socket may then keep sending. A minute to connect is
     * plenty even on a slow phone, and thirty minutes of session covers a full
     * round — a reconnect past that mints a fresh token, which is cheap.
     */
    const body = {
      uses: 1,
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      expireTime: new Date(now + 30 * 60_000).toISOString(),
    };

    const response = await fetch(`https://${GEMINI_HOST}/v1beta/auth_tokens`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      // Deliberately not surfaced to the candidate — it can quote the key.
      console.error("[voice] Gemini token mint failed:", response.status, detail.slice(0, 400));
      throw new RealtimeUnavailable(
        response.status === 429
          ? "The voice interviewer is at capacity right now. Try again in a minute."
          : "Could not reach the voice interviewer. Try again in a moment.",
      );
    }

    const payload = (await response.json()) as { name?: string; token?: { name?: string } };
    const token = payload.name ?? payload.token?.name;
    if (!token) throw new RealtimeUnavailable("Could not reach the voice interviewer. Try again in a moment.");

    /**
     * A token-authenticated socket goes to the *Constrained* RPC — the
     * unconstrained one only accepts a raw API key, which is exactly what must
     * never reach a browser.
     */
    const url =
      `wss://${GEMINI_HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService` +
      `.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;

    return {
      provider: this.id,
      model: this.model,
      token,
      url,
      expiresAt: body.expireTime,
      setup: {
        setup: {
          model,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env["GEMINI_LIVE_VOICE"] || "Charon" } },
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction(context) }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Server-side VAD. The client still stops playback the instant an
          // interruption is reported, but deciding *when* the candidate started
          // talking is the model's job — it hears the audio we do not.
          realtimeInputConfig: { automaticActivityDetection: {} },
          contextWindowCompression: { slidingWindow: {} },
          sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
        },
      },
    };
  },
};

/** Raised for anything the candidate is allowed to read verbatim. */
export class RealtimeUnavailable extends Error {
  readonly userFacing = true;
}

const PROVIDERS: Record<string, RealtimeProvider> = { [gemini.id]: gemini };

export function realtimeProvider(id = process.env["REALTIME_PROVIDER"] || "gemini"): RealtimeProvider {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error(`Unknown realtime provider "${id}"`);
  return provider;
}
