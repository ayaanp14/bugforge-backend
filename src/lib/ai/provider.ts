import type { z } from "zod";
import { completeJson, providerConfig, providerInfo, type Usage } from "../../services/interview-ai.js";

/**
 * The one door new AI features go through. Today it opens onto NVIDIA's
 * hosted Nemotron via the interview module's `completeJson` (plain fetch, the
 * retry/backoff, the Zod validation and the token accounting all live there);
 * a second provider is a second implementation of `AIProvider`, chosen here,
 * with no caller changing. No OpenAI-style SDK — see CLAUDE.md.
 *
 * Callers ask for a task's structured answer and get back the parsed object,
 * the usage and the model that produced it, so a stored answer can say what
 * made it.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIJsonOptions {
  maxTokens?: number;
  temperature?: number;
  /** Repair a reply into the schema's shape before it is validated. */
  coerce?: (raw: unknown) => unknown;
}

export interface AIStreamOptions {
  maxTokens?: number;
  temperature?: number;
  /** A deployment's own model for the task (e.g. TUTOR_MODEL); the provider's default otherwise. */
  model?: string;
  /** The whole answer's budget, retries included. */
  timeoutMs?: number;
}

/** A streamed answer that could not be had; `status` is what the route answers with. */
export class AIStreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AIStreamError";
  }
}

export interface AIProvider {
  readonly name: string;
  /** Configured on this deployment (a key is set). */
  available(): boolean;
  /** The model a task will run on — recorded beside its answer. */
  model(): string;
  json<S extends z.ZodType>(messages: AIMessage[], schema: S, name: string, options?: AIJsonOptions): Promise<{ parsed: z.infer<S>; usage: Usage }>;
  /** Free text, token by token through `onToken`; resolves with the whole answer and the model that wrote it. */
  stream(messages: AIMessage[], options: AIStreamOptions, onToken: (text: string) => void): Promise<{ text: string; model: string }>;
}

const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * One streamed request: OpenAI-style SSE, `data: {json}` lines and
 * `data: [DONE]`. A chunk can split a line, so the tail is carried between
 * reads. The provider's overload notice arrives *inside* a 200 stream as
 * `{"error": …}`, so it is returned rather than thrown, for the caller to
 * retry while nothing has been shown.
 *
 * The same loop as services/assistant.ts `attemptStream`, which keeps its
 * own copy until it is next changed (lib/ai/prompts.ts says the same of the
 * older prompts).
 */
async function attemptStream(body: Record<string, unknown>, signal: AbortSignal, onToken: (text: string) => void): Promise<{ text: string; inBandError: string | null }> {
  const { baseUrl, key } = providerConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new AIStreamError("The model took too long to answer.", 504);
    throw new AIStreamError(`The model is unreachable: ${(err as Error).message}`, 503);
  }
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new AIStreamError(`The model answered ${response.status}: ${detail.slice(0, 160) || response.statusText}`, response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let text = "";
  let inBandError: string | null = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const lines = carry.split("\n");
    carry = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let json: { choices?: Array<{ delta?: { content?: string | null } }>; error?: { message?: string; code?: number | string } };
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      if (json.error) {
        inBandError = `${json.error.message ?? "provider error"} (${json.error.code ?? "?"})`;
        continue;
      }
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        onToken(delta);
      }
    }
  }
  return { text, inBandError };
}

/**
 * Retried while no token has reached the caller — an HTTP refusal or the
 * in-band overload notice — five times over ~4 s, the assistant's schedule;
 * once a token is out the answer is what it is. Reasoning off: a teaching
 * turn that takes ten seconds to say its first word reads as broken.
 */
async function streamNvidia(messages: AIMessage[], options: AIStreamOptions, onToken: (text: string) => void): Promise<{ text: string; model: string }> {
  const model = options.model || providerConfig().model;
  const body = {
    model,
    messages,
    stream: true,
    max_tokens: options.maxTokens ?? 1200,
    temperature: options.temperature ?? 0.3,
    reasoning_effort: "none",
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 90_000);
  let text = "";
  try {
    let last: AIStreamError | null = null;
    for (let attempt = 0; attempt < 5 && !text; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
      let outcome: { text: string; inBandError: string | null };
      try {
        outcome = await attemptStream(body, controller.signal, (t) => {
          text += t;
          onToken(t);
        });
      } catch (err) {
        if (!(err instanceof AIStreamError) || !RETRY_STATUS.has(err.status) || text) throw err;
        last = err;
        continue;
      }
      if (outcome.text.trim()) break;
      last = new AIStreamError(outcome.inBandError ? `The model is busy: ${outcome.inBandError}` : "The model returned an empty answer.", 503);
    }
    if (!text.trim()) throw last ?? new AIStreamError("The model is unavailable.", 503);
  } finally {
    clearTimeout(timer);
  }
  return { text, model };
}

const nvidia: AIProvider = {
  name: "nvidia",
  available: () => Boolean(process.env["NVIDIA_API_KEY"]),
  model: () => providerInfo().model,
  json: (messages, schema, name, options = {}) =>
    // Not `structured`: strict json_schema decoding on nested schemas ran to
    // the token ceiling emitting whitespace (lib/resume-ai.ts measured it);
    // the prompt asks for the shape and `coerce` + Zod hold it to it.
    // Not hedged: one call, not two racing, for a job nobody is waiting on.
    completeJson(messages, schema, name, { structured: false, hedge: false, maxTokens: options.maxTokens, temperature: options.temperature, coerce: options.coerce }),
  stream: streamNvidia,
};

export const ai: AIProvider = nvidia;
