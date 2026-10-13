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
  /**
   * The answer's shape as a strict JSON Schema, for a provider that decodes
   * to one (OpenAI's structured outputs); the NVIDIA provider ignores it and
   * relies on the prompt + `coerce`. Zod still validates either way.
   */
  jsonSchema?: Record<string, unknown>;
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

/* ── OpenAI ──────────────────────────────────────────────────────────── */

/**
 * OpenAI's chat completions over plain fetch (no SDK — CLAUDE.md), for the
 * tasks the owner chose it for: the social module's posts (services/social.ts,
 * 2026-10-13 — the campaign site's mail writer was already on OpenAI). Strict
 * structured outputs when the task passes `jsonSchema`: OpenAI decodes nested
 * schemas cleanly, unlike the NVIDIA endpoint above. `OPENAI_API_KEY` turns
 * it on; `OPENAI_MODEL` picks the model.
 *
 * The default is the cheapest current model, by the owner's ask: gpt-6-luna
 * ($0.10 / $0.50 per million tokens on OpenAI's pricing page, 2026-10-13;
 * strict structured outputs supported). gpt-5-nano lists cheaper ($0.05 /
 * $0.40) but its model page marks it deprecated, and a daily job on a model
 * being retired stops one morning. A day's posts are a fraction of a cent on
 * either; set OPENAI_MODEL to choose.
 *
 * JSON only: no streamed task runs on it yet, so `stream` refuses rather than
 * carrying a second copy of the SSE loop nobody calls.
 */
const OPENAI_DEFAULT_MODEL = "gpt-6-luna";
const openaiModel = () => process.env["OPENAI_MODEL"] || OPENAI_DEFAULT_MODEL;

async function openaiJson<S extends z.ZodType>(messages: AIMessage[], schema: S, name: string, options: AIJsonOptions = {}): Promise<{ parsed: z.infer<S>; usage: Usage }> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const model = openaiModel();
  // Reasoning models (gpt-5 onwards, the o-series) refuse `temperature`; the others refuse `reasoning_effort`.
  const reasoning = /^(gpt-[5-9]|gpt-\d{2}|o\d)/.test(model);
  const body = JSON.stringify({
    model,
    messages,
    response_format: options.jsonSchema
      ? { type: "json_schema", json_schema: { name, strict: true, schema: options.jsonSchema } }
      : { type: "json_object" },
    max_completion_tokens: options.maxTokens ?? 4000,
    ...(reasoning ? { reasoning_effort: "low" } : { temperature: options.temperature ?? 0.3 }),
  });
  let last: Error | null = null;
  // Three tries on a refusal worth retrying (rate limit, overload), ~1 s and ~3 s apart.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt * attempt + 500));
    let res: Response;
    try {
      res = await fetch(`${process.env["OPENAI_API_URL"] || "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body,
        signal: AbortSignal.timeout(150_000),
      });
    } catch (err) {
      last = new Error(`OpenAI is unreachable: ${(err as Error).message}`);
      continue;
    }
    const answer = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      choices?: Array<{ finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number }; completion_tokens_details?: { reasoning_tokens?: number } };
    } | null;
    if (!res.ok) {
      last = new Error(`OpenAI answered ${res.status}: ${answer?.error?.message ?? res.statusText}`);
      if (RETRY_STATUS.has(res.status)) continue;
      throw last;
    }
    const choice = answer?.choices?.[0];
    if (choice?.message?.refusal) throw new Error(`OpenAI declined: ${choice.message.refusal}`);
    if (choice?.finish_reason === "length") throw new Error("OpenAI ran out of tokens");
    let raw: unknown;
    try {
      raw = JSON.parse(choice?.message?.content ?? "");
    } catch {
      last = new Error("OpenAI's answer was not JSON");
      continue;
    }
    const parsed = schema.parse(options.coerce ? options.coerce(raw) : raw) as z.infer<S>;
    const u = answer?.usage;
    return {
      parsed,
      usage: {
        promptTokens: u?.prompt_tokens ?? 0,
        cachedTokens: u?.prompt_tokens_details?.cached_tokens ?? 0,
        completionTokens: u?.completion_tokens ?? 0,
        reasoningTokens: u?.completion_tokens_details?.reasoning_tokens ?? 0,
        // Not priced here: the model is a deployment's choice and its price list moves.
        costMicros: 0,
      },
    };
  }
  throw last ?? new Error("OpenAI is unavailable");
}

export const openai: AIProvider = {
  name: "openai",
  available: () => Boolean(process.env["OPENAI_API_KEY"]),
  model: openaiModel,
  json: openaiJson,
  stream: () => Promise.reject(new AIStreamError("No streamed task runs on OpenAI.", 501)),
};

/**
 * One generated picture from OpenAI's Image API, as bytes.
 *
 * The default is the cheapest model trusted with words in the picture — the
 * social poster carries its headline in it, by the owner's ask (2026-10-13).
 * Per 1024×1024 picture on OpenAI's pricing (same day), low / medium / high:
 * gpt-image-1-mini $0.005 / $0.011 / $0.036, gpt-image-1.5 $0.009 / $0.034 /
 * $0.133, gpt-image-2 $0.006 / $0.053 / $0.211. The mini is cheapest but the
 * oldest generation, the weakest at lettering; gpt-image-1.5 at medium is the
 * cheapest newer-generation option. OpenAI's own guide says text can still
 * come out imprecise on any of them, so a person checks the poster.
 * `OPENAI_IMAGE_MODEL` / `OPENAI_IMAGE_QUALITY` change them. JPEG, because
 * the picture is stored in the database and a PNG is several times the size.
 */
export const OPENAI_IMAGE_DEFAULTS = { model: "gpt-image-1.5", quality: "medium" } as const;
export const openaiImageModel = () => process.env["OPENAI_IMAGE_MODEL"] || OPENAI_IMAGE_DEFAULTS.model;

/**
 * An edit of an existing picture (POST /v1/images/edits, multipart): the
 * picture goes up as the starting point and the model changes what the
 * prompt asks. `input_fidelity: "high"` asks it to keep the input's details
 * (layout, lettering) closely; a model that does not take the parameter
 * answers 400 naming it, and the request is sent once more without it.
 */
export async function openaiImageEdit(prompt: string, image: Buffer, options: { size?: "1024x1024" | "1024x1536" | "1536x1024" } = {}): Promise<{ bytes: Buffer; model: string; mime: string }> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const model = openaiImageModel();
  const quality = process.env["OPENAI_IMAGE_QUALITY"] || OPENAI_IMAGE_DEFAULTS.quality;
  let fidelity = true;
  let last: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0 && fidelity) await new Promise((r) => setTimeout(r, 2000));
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt.slice(0, 4000));
    form.append("image", new Blob([new Uint8Array(image)], { type: "image/png" }), "poster-base.png");
    form.append("size", options.size ?? "1024x1024");
    form.append("quality", quality);
    form.append("output_format", "jpeg");
    form.append("output_compression", "88");
    if (fidelity) form.append("input_fidelity", "high");
    let res: Response;
    try {
      res = await fetch(`${process.env["OPENAI_API_URL"] || "https://api.openai.com/v1"}/images/edits`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}` },
        body: form,
        signal: AbortSignal.timeout(240_000),
      });
    } catch (err) {
      last = new Error(`OpenAI is unreachable: ${(err as Error).message}`);
      continue;
    }
    const answer = (await res.json().catch(() => null)) as { error?: { message?: string; param?: string }; data?: Array<{ b64_json?: string }> } | null;
    if (!res.ok) {
      const message = answer?.error?.message ?? res.statusText;
      last = new Error(`OpenAI image edit answered ${res.status}: ${message}`);
      if (res.status === 400 && fidelity && /input_fidelity/i.test(`${answer?.error?.param ?? ""} ${message}`)) {
        fidelity = false;
        continue;
      }
      if (RETRY_STATUS.has(res.status)) continue;
      throw last;
    }
    const b64 = answer?.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image");
    return { bytes: Buffer.from(b64, "base64"), model, mime: "image/jpeg" };
  }
  throw last ?? new Error("OpenAI image edits is unavailable");
}

export async function openaiImage(prompt: string, options: { size?: "1024x1024" | "1024x1536" | "1536x1024" } = {}): Promise<{ bytes: Buffer; model: string; mime: string }> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const model = openaiImageModel();
  const quality = process.env["OPENAI_IMAGE_QUALITY"] || OPENAI_IMAGE_DEFAULTS.quality;
  let last: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    let res: Response;
    try {
      res = await fetch(`${process.env["OPENAI_API_URL"] || "https://api.openai.com/v1"}/images/generations`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, prompt: prompt.slice(0, 4000), n: 1, size: options.size ?? "1024x1024", quality, output_format: "jpeg", output_compression: 85 }),
        signal: AbortSignal.timeout(180_000),
      });
    } catch (err) {
      last = new Error(`OpenAI is unreachable: ${(err as Error).message}`);
      continue;
    }
    const answer = (await res.json().catch(() => null)) as { error?: { message?: string }; data?: Array<{ b64_json?: string }> } | null;
    if (!res.ok) {
      last = new Error(`OpenAI images answered ${res.status}: ${answer?.error?.message ?? res.statusText}`);
      if (RETRY_STATUS.has(res.status)) continue;
      throw last;
    }
    const b64 = answer?.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image");
    return { bytes: Buffer.from(b64, "base64"), model, mime: "image/jpeg" };
  }
  throw last ?? new Error("OpenAI images is unavailable");
}
