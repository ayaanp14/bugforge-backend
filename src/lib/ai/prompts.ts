import { readFileSync } from "node:fs";

/**
 * The model prompts, versioned and kept as files rather than strings in the
 * code: content/prompts/<task>/v<N>.md, shipped in the image beside dist/
 * like the handbook and the lessons. A changed prompt is a new version file,
 * so what a stored answer was produced by can always be read back (the rows
 * that keep a model's answer record `promptVersion`).
 *
 * The interviews, the assistant and the resume analyzer still build their
 * prompts in their own modules; new tasks start here, and the older ones move
 * when they are next changed.
 */

export const PROMPT_VERSIONS = {
  "submission-review": 1,
  // v2 (2026-10-07): short paragraphs, numbered steps, one closing question —
  // v1 wrote a sentence a line, which read as a list of fragments.
  // v3 (2026-10-10): conversational — answer the message first, never repeat
  // an earlier reply, read the current code fresh, bullets and `example`
  // blocks rather than paragraphs (the owner: "stiff, same reply again and
  // again, still taking the old code").
  tutor: 3,
  // Phase 6 (2026-10-09): the bug hunts' review, postmortem rubric and tutor.
  "bug-review": 1,
  "root-cause": 1,
  "bug-tutor": 1,
} as const;

export type PromptTask = keyof typeof PROMPT_VERSIONS;

const loaded = new Map<string, string>();

/** A task's current prompt (read once per process). */
export function promptFor(task: PromptTask): { text: string; version: number } {
  const version = PROMPT_VERSIONS[task];
  const key = `${task}/v${version}`;
  let text = loaded.get(key);
  if (text === undefined) {
    text = readFileSync(new URL(`../../../content/prompts/${task}/v${version}.md`, import.meta.url), "utf8").trim();
    loaded.set(key, text);
  }
  return { text, version };
}
