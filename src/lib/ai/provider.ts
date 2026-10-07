import type { z } from "zod";
import { completeJson, providerInfo, type Usage } from "../../services/interview-ai.js";

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

export interface AIProvider {
  readonly name: string;
  /** Configured on this deployment (a key is set). */
  available(): boolean;
  /** The model a task will run on — recorded beside its answer. */
  model(): string;
  json<S extends z.ZodType>(messages: AIMessage[], schema: S, name: string, options?: AIJsonOptions): Promise<{ parsed: z.infer<S>; usage: Usage }>;
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
};

export const ai: AIProvider = nvidia;
