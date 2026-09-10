import { z } from "zod";

/**
 * The interview model layer.
 *
 * Everything the model sees is assembled here, in one deterministic order:
 *
 *   [0] RUBRIC          - byte-identical for every session and every user
 *   [1] session config  - stable for the life of one interview
 *   [2..] transcript    - grows a turn at a time; each turn re-reads the last
 *   [n] the new answer  - the only genuinely new tokens
 *
 * The ordering is worth keeping even though NVIDIA bills nothing: a stable
 * prefix is what any prefix cache upstream can reuse, and it makes a turn
 * reproducible. Nothing volatile (timestamps, ids, `Date.now()`) may appear
 * before the last item.
 */

/**
 * NVIDIA's hosted catalogue is the only provider, and the only one there is any
 * intention of supporting. The endpoint is a chat-completions API, which the
 * `openai` SDK used to speak for us — but a whole vendor SDK for a single POST
 * was misleading about who we talk to and gave us no control over the one thing
 * that matters here, which is how long we are willing to wait. It is a `fetch`
 * now: no SDK, no second provider, no fallback chain.
 *
 * Models are namespaced: `nvidia/nemotron-3-super-120b-a12b`.
 */
const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.INTERVIEW_MODEL || "nvidia/nemotron-3-super-120b-a12b";

/**
 * The model that writes questions, which is the only model on the critical
 * path.
 *
 * Marking and the report are generated behind the response — the candidate is
 * reading or typing while they run, and nothing waits on them. Writing the
 * next question is different: when the prefetch has not landed by the time an
 * answer arrives, `/answer` blocks on this call and the candidate watches a
 * spinner for however long it takes.
 *
 * Those two jobs do not need the same model. Scoring an answer against a
 * rubric is the hard one and keeps the large model; asking the next question
 * from a transcript is comparatively light, and a smaller model answers it
 * several times faster. Unset, this is the main model and behaviour is
 * unchanged — set INTERVIEW_QUESTION_MODEL to split them.
 */
const QUESTION_MODEL = process.env.INTERVIEW_QUESTION_MODEL || MODEL;

/**
 * Nemotron decodes at roughly twenty tokens a second on the free tier, so a
 * long reply legitimately takes a minute. The ceiling exists for the request
 * that has stopped moving altogether, not for the slow one.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.INTERVIEW_TIMEOUT_MS ?? 120_000);

/**
 * USD per 1M tokens. NVIDIA's hosted catalogue is free, so these read 0 and the
 * cost columns record 0 — but they stay wired and overridable so a paid tier or
 * a self-hosted NIM can price itself without the analytics changing.
 */
const RATE = {
  input: Number(process.env.INTERVIEW_RATE_INPUT ?? 0),
  cached: Number(process.env.INTERVIEW_RATE_CACHED ?? 0),
  output: Number(process.env.INTERVIEW_RATE_OUTPUT ?? 0),
};

/**
 * Not every Nemotron implements `response_format`. Super enforces it; Ultra
 * ignores it — so for those we ask for JSON in the prompt and validate the
 * reply ourselves. Set INTERVIEW_STRUCTURED_OUTPUTS=off to force that path.
 */
function structuredOutputsFor(model: string): boolean {
  const flag = (process.env.INTERVIEW_STRUCTURED_OUTPUTS || "auto").toLowerCase();
  if (flag === "on") return true;
  if (flag === "off") return false;
  // Known not to enforce a schema. Everything else is assumed to.
  return !/nemotron-3-ultra|nemotron-3\.5-lightning/i.test(model);
}

/** Resolved per model: the question model may enforce schemas when the marking
 *  model does not, or the other way round. */
const STRUCTURED_OUTPUTS = structuredOutputsFor(MODEL);

/* ── the NVIDIA client ─────────────────────────────────────────────────── */

/** Only the fields we read. Nemotron returns more; none of it is used. */
interface CompletionResponse {
  choices?: Array<{
    message?: { content?: string | null; refusal?: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { message?: string };
}

/** Carries the HTTP status so the retry policy can tell transient from fatal. */
class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function apiKey() {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("Set NVIDIA_API_KEY to run interviews");
  return key;
}

async function postCompletion(
  body: Record<string, unknown>,
  controller = new AbortController(),
): Promise<CompletionResponse> {
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      // Our own deadline: transient, and worth another attempt.
      if (timedOut) throw new ProviderError(`Interview provider timed out after ${REQUEST_TIMEOUT_MS}ms`, 408);
      // Otherwise a hedge won and cancelled this one. Deliberately given no
      // status, so the retry policy leaves it alone — there is nothing left to
      // retry for, the answer already arrived on another attempt.
      throw error;
    }
    throw new ProviderError(`Interview provider unreachable: ${(error as Error).message}`, 503);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ProviderError(
      `Interview provider ${response.status}: ${detail.slice(0, 200) || response.statusText}`,
      response.status,
    );
  }

  return (await response.json()) as CompletionResponse;
}

/**
 * The JSON Schema for a Zod schema, computed once per schema object.
 *
 * Every schema in this file is a module-level constant, yet `toJSONSchema`
 * was walking it afresh on every call — twice per turn when structured
 * outputs are off, once for the prompt and once for the format. It is pure,
 * so the result is memoised against the schema itself; a WeakMap so a schema
 * built ad hoc somewhere would still be collectable.
 *
 * `$schema` is stripped here, once: Zod emits it, some gateways reject it.
 */
const jsonSchemaCache = new WeakMap<z.ZodType, Record<string, unknown>>();

function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  let cached = jsonSchemaCache.get(schema);
  if (!cached) {
    const { $schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
    void $schema;
    cached = rest;
    jsonSchemaCache.set(schema, cached);
  }
  return cached;
}

/**
 * A strict JSON Schema for the response format. Zod already emits `required`
 * and `additionalProperties: false`.
 */
function responseFormat(schema: z.ZodType, name: string) {
  return { type: "json_schema" as const, json_schema: { name, schema: jsonSchemaOf(schema), strict: true } };
}

/** What the model layer is actually talking to — for logs and the smoke test. */
export function providerInfo() {
  return {
    model: MODEL,
    questionModel: QUESTION_MODEL,
    split: QUESTION_MODEL !== MODEL,
    baseUrl: BASE_URL,
    structuredOutputs: STRUCTURED_OUTPUTS,
    questionStructuredOutputs: structuredOutputsFor(QUESTION_MODEL),
    free: RATE.input === 0 && RATE.output === 0,
  };
}

/* ── the cached prefix ─────────────────────────────────────────────────── */

/**
 * Deliberately thorough: this is the one prompt that decides interview quality,
 * and its length is also what lifts the prefix over the caching minimum, so
 * detail here costs nothing after the first call of the day.
 */
const RUBRIC = `You are a senior engineer conducting a technical interview. You have run hundreds of these. You are warm but not soft: the candidate should leave knowing exactly where they stand.

## How you run the interview

Ask one question at a time. Never ask two things at once, and never stack a follow-up onto a new topic.

Each question builds on what the candidate has already shown you. If an answer was strong, go deeper on the same thread rather than moving on — depth reveals more than breadth. If an answer was weak, change topic rather than grinding; a candidate who cannot answer a question usually cannot answer its follow-up either, and repeated failure on one thread tells you nothing new.

Ask what a working engineer would actually need to know. Prefer questions grounded in a concrete situation ("you notice the p99 has doubled since Tuesday's deploy — what do you look at first?") over definition recall ("what is a p99?"). Trivia is a bad interview question even when the trivia is real.

Never ask a question you have already asked in this session, and never re-ask a question the candidate has already effectively answered while responding to something else.

Match the round. A system design round asks about tradeoffs, failure modes, scale and data flow. A coding round asks the candidate to reason about an implementation. A behavioural round asks for specific past situations and probes for what they personally did. Do not drift between rounds.

## How you score

Score each answer 0-10 on what the answer demonstrates, not on how confidently it is delivered:

- 9-10 — Correct, complete, and shows judgement beyond the question. Names tradeoffs unprompted, identifies where the approach breaks down.
- 7-8  — Correct and complete for the level asked. Minor gaps, nothing misleading.
- 5-6  — Broadly right with real gaps, or right but shallow. Would need follow-up in a real interview.
- 3-4  — Partially right, or right for the wrong reason. Contains a claim that is wrong.
- 1-2  — Largely incorrect, or answers a different question than the one asked.
- 0    — No answer, refusal, or entirely off-topic.

Calibrate to the stated experience band. A junior giving a clean 7-level answer is doing well; a staff engineer giving the same answer is underperforming. Score against what the band should know, and say so in the feedback when the gap is the point.

Confident, fluent, wrong answers score low. Hesitant, correct answers score high. Reward the engineering, not the delivery.

Do not inflate. A 7 should be uncommon and a 9 rare. If every candidate scores 8 the scores mean nothing, and the report built from them is worthless.

## How you give feedback

Two to four sentences, addressed to the candidate as "you".

Lead with the single most useful thing they could hear. Be concrete and quote them where it helps — "you reached for an index before asking what the query actually was" beats "consider your approach to optimisation".

Name what was missing, not just what was wrong. The gap between the answer given and the answer a strong candidate gives is the most valuable thing you can tell them.

Never write filler. "Good effort", "nice job", "keep practising" and "you clearly understand the basics" carry no information and make the whole report feel automated. If an answer was weak, say it was weak and say why.

Populate "missed" with the specific points a strong answer would have covered and this one did not — each a short noun phrase, not a sentence. Leave it empty only when the answer genuinely covered everything.

## Calibrating to the experience band

Junior (0-2 years): expect correct mechanics and honest uncertainty. They should know what a tool does; they are not expected to know when it is the wrong tool. Reward clear reasoning even when the conclusion is incomplete. Do not punish gaps in operational or scale experience they have had no chance to acquire.

Mid (2-5 years): expect correct mechanics plus one level of "why". They should know the common failure modes of the things they use daily, and be able to debug a problem they have not seen before. Vagueness about tradeoffs is a real gap at this level.

Senior (5-10 years): expect tradeoffs named unprompted, and awareness of what breaks at scale, under failure, and under a team of ten. A senior who describes only the happy path is underperforming regardless of how correct the happy path is.

Staff and above: expect the answer to address the problem behind the question — cost, blast radius, migration path, what they would tell a team to do and why. Correct-but-narrow is a weak answer at this level.

When an answer would be strong for a lower band and weak for the stated one, say exactly that in the feedback. It is the single most useful sentence you can give someone.

## Round-specific guidance

System design: drive toward data flow, storage choice, consistency, failure modes and scale. Ask what breaks first as traffic grows ten times. Push for numbers — request rates, payload sizes, storage growth. A candidate who never estimates anything is guessing. Do not accept a list of technologies as a design.

Coding: ask them to reason about an implementation rather than recite an algorithm. Edge cases, complexity, and what they would test are all fair game. If they give code, evaluate the code that is actually there — not the code you assume they meant. Off-by-one errors, unhandled empties and mutation bugs are worth calling out precisely.

Debugging and operational: give a symptom, not a cause. Good candidates ask what changed, look at the data before the code, and narrow the search space. Reward a systematic search; penalise guessing at fixes.

Behavioural: ask for a specific situation, then probe for what this person personally did, what the alternatives were, and what they would do differently. "We decided" is not an answer; find out what they decided. A candidate who cannot name a mistake is not being candid.

Fundamentals: acceptable only where the concept has real consequences. Ask what happens, not what it is called.

## Handling difficult answers

"I don't know": accept it gracefully, score it honestly, and move to a different area. Do not lecture. An honest "I don't know" is worth more than a confident guess and should score above a wrong answer, though still low.

Partial answers: score what is there. Put the rest in "missed". Do not average a strong half with an absent half into a middling score — say which half was strong.

Rambling: score the substance, not the length. If the candidate circled a correct answer without landing on it, say so and say what landing would have looked like.

Answers that misread the question: score against what was asked, and note the misreading in the feedback — misreading a requirement is itself a signal worth surfacing.

Answers containing code: read it. If it is wrong, quote the specific line or condition. Generic feedback on concrete code is the fastest way to lose the candidate's trust.

## Feedback the report can build on

Every piece of feedback you write will be read twice: once by the candidate now, and once by you at the end when you write the closing report. Write it so the second reading is useful — name the specific concept, not just the verdict. "You described the write path but never addressed what happens when two writes race" is reusable evidence. "Incomplete answer" is not.

## Worked examples of feedback

Question: "Your API's p99 latency doubled after Tuesday's deploy. Where do you start?"

Answer: "I'd check the logs and see if there are any errors, then maybe look at the database."
Score 3, verdict weak. Feedback: "You reached for the logs before establishing what changed. p99 doubling after a specific deploy is a strong signal — the first move is to diff that deploy and check whether the regression tracks the rollout, not to browse logs. You also jumped to the database without evidence; naming a suspect before you have narrowed the search is the habit to break here." Missed: ["diff the deploy", "correlate with rollout timing", "check p50 vs p99 to see if it is all traffic or a tail", "rule out a dependency before blaming the database"].

Answer: "First I'd confirm it's real and not a metrics artefact, then check whether p50 moved too — if only p99 moved it's a tail problem, so I'd suspect lock contention, a slow dependency on a subset of requests, or GC. Then I'd diff the deploy for anything touching those paths, and check if it correlates with the rollout percentage."
Score 9, verdict strong. Feedback: "Strong. You separated tail regression from across-the-board regression before forming a hypothesis, which is exactly the split that determines where to look next, and you tied the timing back to the rollout rather than assuming causation from correlation. The one thing I'd add is a rollback decision point — at what latency, and after how long, do you stop investigating and revert?" Missed: ["when to roll back rather than keep debugging"].

Notice what the strong feedback does: it names the specific reasoning that earned the score, and its one addition is something the candidate can act on. Notice what the weak feedback avoids: it never says "good attempt", never softens the score, and quotes the candidate's own move back to them.

## Output

Return only the structured object you are asked for. No preamble, no markdown, no commentary outside the fields.

For "starterCode": the presence of this field decides whether the candidate gets a code editor or a plain text box, so get it right. When the question asks the candidate to write code, return a complete, properly formatted starter skeleton in the editor language named in the configuration: the function, method or class signature the question implies, parameter names taken from the question, a single comment placeholder where the body goes, every brace or block closed, real newlines, and two-space indentation (four for Python). No solution, no explanation, no imports the candidate does not need, and no markdown fences — the text is placed straight into the editor. When the question does not ask for code — a design, conceptual, debugging-by-discussion or behavioural question — return an empty string so the candidate gets a text box.

For "expectedSkills": three to five short tags naming what the question tests.

For "question": the question itself and nothing else. Do not number it, do not prefix it with "Question 3:" or "Next:", and do not restate the round. The interface shows the candidate where they are.

For "topic": two or three words naming the subject area, always populated — it is what the closing report groups by.`;

/* ── schemas ───────────────────────────────────────────────────────────── */

const QuestionFields = {
  question: z.string(),
  topic: z.string(),
  focusArea: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expectedSkills: z.array(z.string()),
};

/**
 * Two shapes, chosen by whether the round asks the candidate to write code.
 *
 * `starterCode` is a required field, so a discussion round still had to emit
 * one — and the model does not emit `""`, it writes a stub, which the caller
 * then throws away because a discussion round has no editor. That is a few
 * hundred tokens of pure latency on the one call a candidate waits for. The
 * field is simply absent from the schema where it cannot be used, which is a
 * harder guarantee than asking the model to leave it empty.
 */
const DiscussionQuestion = z.object(QuestionFields);
const CodingQuestion = z.object({ ...QuestionFields, starterCode: z.string() });

const Question = CodingQuestion;

const Evaluation = z.object({
  score: z.number().int().min(0).max(10),
  verdict: z.enum(["strong", "adequate", "weak", "no_answer"]),
  feedback: z.string(),
  missed: z.array(z.string()),
});

/** A question on its own — the opener, and every question after a scored turn. */
const CodingTurn = z.object({ question: CodingQuestion });
const DiscussionTurn = z.object({ question: DiscussionQuestion });
const questionSchema = (wantsCode: boolean) => (wantsCode ? CodingTurn : DiscussionTurn);
/** An evaluation on its own — the scoring half of a turn, and the final answer. */
const LastTurn = z.object({ evaluation: Evaluation });
const Report = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

/** A discussion round returns no stub at all, so the field is optional here. */
export type InterviewQuestion = z.infer<typeof DiscussionQuestion> & { starterCode?: string };
export type InterviewEvaluation = z.infer<typeof Evaluation>;
export type InterviewReport = z.infer<typeof Report>;

/* ── prompt assembly ───────────────────────────────────────────────────── */

export interface InterviewConfig {
  roleId: string;
  roundId: string;
  difficulty: string;
  experienceBand: string;
  interviewStyle: string;
  stackFocusIds: string[];
  focusAreaIds: string[];
  /** Monaco language id the round's editor opens in; the stub is written in it. */
  language?: string;
}

export interface TranscriptTurn {
  questionText: string;
  userAnswer: string | null;
}

/** Stable for the life of a session, so it sits inside the cached prefix. */
function configBlock(config: InterviewConfig, budget: number) {
  return [
    `Target role: ${config.roleId}`,
    `Round: ${config.roundId}`,
    `Experience band: ${config.experienceBand}`,
    `Difficulty: ${config.difficulty}`,
    `Interview style: ${config.interviewStyle}`,
    `Stack focus: ${config.stackFocusIds.join(", ") || "not specified"}`,
    `Focus areas: ${config.focusAreaIds.join(", ") || "not specified"}`,
    `Editor language for starter code: ${config.language ?? "javascript"}`,
    `Total questions in this interview: ${budget}`,
  ].join("\n");
}

type InputItem = { role: "system" | "user" | "assistant"; content: string };

/**
 * The prefix, in the one order every call must use. Callers append their own
 * volatile tail; nothing here may vary between turns of a session.
 */
function prefix(config: InterviewConfig, budget: number, transcript: TranscriptTurn[]): InputItem[] {
  const input: InputItem[] = [
    { role: "system", content: RUBRIC },
    { role: "system", content: configBlock(config, budget) },
  ];

  for (const turn of transcript) {
    input.push({ role: "assistant", content: turn.questionText });
    input.push({ role: "user", content: turn.userAnswer ?? "(no answer given)" });
  }

  return input;
}

/* ── usage ─────────────────────────────────────────────────────────────── */

export interface Usage {
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  /** Millionths of a dollar, so cost can be summed as an integer. */
  costMicros: number;
}

const EMPTY_USAGE: Usage = {
  promptTokens: 0,
  cachedTokens: 0,
  completionTokens: 0,
  reasoningTokens: 0,
  costMicros: 0,
};

function readUsage(usage: CompletionResponse["usage"]): Usage {
  if (!usage) return EMPTY_USAGE;

  const promptTokens = usage.prompt_tokens ?? 0;
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;
  // Cached tokens are counted inside input_tokens, so bill the remainder at the
  // full rate and the cached share at the discounted one.
  const fresh = Math.max(0, promptTokens - cachedTokens);

  return {
    promptTokens,
    cachedTokens,
    completionTokens,
    reasoningTokens,
    costMicros: Math.round(fresh * RATE.input + cachedTokens * RATE.cached + completionTokens * RATE.output),
  };
}

export function addUsage(a: Usage, b: Usage): Usage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    reasoningTokens: a.reasoningTokens + b.reasoningTokens,
    costMicros: a.costMicros + b.costMicros,
  };
}

/* ── calls ─────────────────────────────────────────────────────────────── */

/**
 * Nemotron thinks before it answers, and the thinking is billed and decoded
 * like any other token while never reaching us.
 *
 * Measured: a scored answer stores about 154 tokens' worth of feedback, and the
 * same call reported 785-1,317 completion tokens. The content held no prose
 * before the JSON, so the difference was not something we were discarding at
 * this end — it was reasoning the endpoint never returned. Turning it off cut
 * an evaluation from 440 tokens to 207 and 22.5s to 2.8s in the same test, and
 * scoring stayed calibrated: the weak answer scored 4 with thinking and 3
 * without, the strong one 8 and 7. Slightly harsher, which is the direction the
 * rubric asks for anyway.
 *
 * Only "none" is safe. `reasoning_effort: "low"` was measured running to the
 * full 16,000-token ceiling and truncating mid-object after 195 seconds — far
 * worse than leaving it on. Set INTERVIEW_REASONING_EFFORT=default to send
 * nothing and get the model's own behaviour back.
 */
const REASONING_EFFORT = process.env.INTERVIEW_REASONING_EFFORT ?? "none";

/**
 * Explicit output ceiling. Without one the request reserves the model's full
 * 64K output window, which reserves budget nobody needs — a turn is a question
 * plus a paragraph. With reasoning off nothing observed has passed 800 tokens,
 * so this is roughly five times the largest real reply: loose enough never to
 * truncate a legitimate one, tight enough to bound a runaway.
 */
const MAX_OUTPUT_TOKENS = Number(process.env.INTERVIEW_MAX_OUTPUT_TOKENS ?? 4000);

/**
 * The hosted catalogue is free and correspondingly busy — "Service temporarily
 * overloaded" comes back often enough to hit on a first request. Without a
 * retry that 503 surfaces as a lost turn: the candidate's answer is not saved
 * and they are asked to submit it again, which doubles a wait that is already
 * the slowest part of the interview.
 *
 * Only transient classes are retried. A 400 or a refusal is a bug or a policy
 * decision and will fail identically the second time.
 */
const RETRY_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);
const RETRIES = Number(process.env.INTERVIEW_RETRIES ?? 6);

/**
 * A refusal is not a slow response.
 *
 * Measured against this endpoint: roughly a third of requests come back
 * "Service temporarily overloaded", and they come back in 180-360ms — the
 * gateway declines before generating a token. Backing off for seconds after
 * one is pure added latency, and with only a couple of attempts a turn still
 * fails outright often enough to matter.
 *
 * So a refusal is retried almost immediately, many times: six attempts at a 35%
 * refusal rate leaves under a 0.2% chance of losing the turn, and costs under a
 * second of waiting in total. Jitter keeps two calls that were refused together
 * from returning together.
 *
 * A 408 is the opposite case — the request did start, and hammering it would
 * queue work behind work — so it keeps a real backoff.
 */
function backoffFor(status: number, attempt: number) {
  const base = status === 408 ? 2000 * (attempt + 1) : 150 + attempt * 120;
  return base + Math.random() * base * 0.4;
}

async function withRetry<T>(label: string, call: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await call();
    } catch (error) {
      last = error;
      const status = (error as { status?: number }).status;
      if (status === undefined || !RETRY_STATUS.has(status) || attempt === RETRIES) break;
      const wait = Math.round(backoffFor(status, attempt));
      if (process.env.INTERVIEW_DEBUG_TIMING === "1") {
        console.log(`[interview] ${label} ${status}, retry ${attempt + 1}/${RETRIES} in ${wait}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw last;
}

/**
 * Hedging, because the slow case here does not fail — it succeeds slowly.
 *
 * Measured on identical prompts back to back: one call decoded at 57 tokens a
 * second and finished in 4s, the next decoded at 3.9 and took 134s. Nothing
 * about the request differed; the difference was which worker answered it. A
 * retry policy is no help against that, because there is no error to react to.
 *
 * So a request that has not answered within the hedge window gets a second one
 * started alongside it, and the first to finish wins while the rest are
 * aborted. A fast call finishes long before the hedge fires and costs nothing
 * extra; a call that drew a slow worker gets a fresh draw instead of running to
 * completion. Tokens are free on this tier, which is what makes the trade
 * one-sided.
 */
const HEDGE_MS = Number(process.env.INTERVIEW_HEDGE_MS ?? 6000);
const HEDGE_ATTEMPTS = Number(process.env.INTERVIEW_HEDGE_ATTEMPTS ?? 3);

function hedged<T>(label: string, run: (controller: AbortController) => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controllers: AbortController[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let started = 0;
    let outstanding = 0;
    let done = false;

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      // The winner's own controller is already settled; aborting it is a no-op.
      controllers.forEach((c) => c.abort());
      fn();
    };

    const start = () => {
      started += 1;
      outstanding += 1;
      const attempt = started;
      if (attempt > 1 && process.env.INTERVIEW_DEBUG_TIMING === "1") {
        console.log(`[interview] ${label} still running after ${HEDGE_MS * (attempt - 1)}ms — hedging (attempt ${attempt})`);
      }

      const controller = new AbortController();
      controllers.push(controller);

      run(controller).then(
        (value) => finish(() => resolve(value)),
        (error) => {
          outstanding -= 1;
          if (done) return;
          // An abort here is this hedge losing the race, not a failure.
          if ((error as Error)?.name === "AbortError") return;
          if (outstanding > 0) return;
          if (started >= HEDGE_ATTEMPTS) finish(() => reject(error));
          else start();
        },
      );

      if (started < HEDGE_ATTEMPTS) {
        timers.push(
          setTimeout(() => {
            if (!done) start();
          }, HEDGE_MS),
        );
      }
    };

    start();
  });
}

/**
 * A question call, with the main model as a safety net.
 *
 * The question model is the one piece of configuration that can be pointed at
 * an arbitrary model name, and getting it wrong used to be fatal: a model the
 * account cannot serve answers 404, `openInterview` throws, and /start returns
 * 500 for every candidate until someone notices. That is far too much blast
 * radius for a latency optimisation.
 *
 * So a failure here costs a slow turn rather than a broken interview: whatever
 * went wrong — unavailable model, a refusal, JSON it could not hold to — the
 * question is asked again on the model that writes everything else. The error
 * is logged either way, so a misconfiguration is loud in the logs instead of
 * silently doubling every turn's latency.
 */
async function askQuestion<S extends z.ZodType>(
  messages: InputItem[],
  schema: S,
  name: string,
): Promise<{ parsed: z.infer<S>; usage: Usage }> {
  if (QUESTION_MODEL === MODEL) return ask(messages, schema, name);
  try {
    return await ask(messages, schema, name, MAX_OUTPUT_TOKENS, QUESTION_MODEL);
  } catch (error: any) {
    console.error(
      `[interview] ${name} failed on ${QUESTION_MODEL} (${error?.message}) — retrying on ${MODEL}`,
    );
    return ask(messages, schema, name, MAX_OUTPUT_TOKENS, MODEL);
  }
}

/** Strips ```json fences a chatty model wraps its JSON in. */
function unfence(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  // Some models prepend a sentence; fall back to the outermost JSON object.
  if (body.startsWith("{")) return body;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/**
 * The path for models without `response_format`: state the schema in the
 * prompt, then parse and validate here. Zod is the enforcement either way, so
 * a bad reply still fails loudly rather than becoming a fabricated score.
 */
/**
 * One request path for every model.
 *
 * We ask for `response_format` where the model enforces it, and fall back to
 * stating the schema in the prompt where it does not — but either way the
 * reply is parsed and validated here rather than by the SDK's parse helper,
 * which turns a gateway error body into an unreadable "cannot read 'map' of
 * undefined". Zod is the enforcement in both cases, so a bad reply fails loudly
 * instead of becoming a fabricated score.
 */
async function ask<S extends z.ZodType>(
  messages: InputItem[],
  schema: S,
  name: string,
  /** Overrides the shared ceiling for the rare call that writes far more. */
  maxTokens = MAX_OUTPUT_TOKENS,
  /** Which model answers. Questions use the fast one; everything else the main. */
  model: string = MODEL,
): Promise<{ parsed: z.infer<S>; usage: Usage }> {
  const structured = model === MODEL ? STRUCTURED_OUTPUTS : structuredOutputsFor(model);
  const outgoing: InputItem[] = structured
    ? messages
    : [
        ...messages,
        {
          role: "system",
          content:
            `Reply with a single JSON object and nothing else — no prose before or after, no markdown fence. ` +
            `It must validate against this JSON Schema:\n\n${JSON.stringify(jsonSchemaOf(schema), null, 2)}`,
        },
      ];

  const request = {
    model,
    messages: outgoing,
    max_completion_tokens: maxTokens,
    ...(REASONING_EFFORT === "default" ? {} : { reasoning_effort: REASONING_EFFORT }),
    ...(structured ? { response_format: responseFormat(schema, name) } : {}),
  };

  const startedAt = Date.now();
  // Retry handles the instant refusals; hedging handles the slow successes.
  const response = await hedged(name, (controller) =>
    withRetry(name, () => postCompletion(request, controller)),
  );

  // Turn latency here is decode-bound and the provider's rate swings by an
  // order of magnitude with load, so "the interview felt slow" is unanswerable
  // without the per-call split. Off unless asked for.
  if (process.env.INTERVIEW_DEBUG_TIMING === "1") {
    const ms = Date.now() - startedAt;
    const out = response.usage?.completion_tokens ?? 0;
    console.log(
      `[interview] ${name} ${ms}ms via ${model} | out=${out} in=${response.usage?.prompt_tokens ?? 0}` +
        ` cached=${response.usage?.prompt_tokens_details?.cached_tokens ?? 0}` +
        ` | ${out && ms ? (out / (ms / 1000)).toFixed(1) : "?"} tok/s`,
    );
  }

  // A gateway can answer 200 with an error body and no choices at all.
  const choice = response.choices?.[0];
  if (!choice) {
    const upstream = response.error?.message;
    throw new Error(upstream ? `Interview provider error: ${upstream}` : `Interview provider returned no choices for ${name}`);
  }
  if (choice.message?.refusal) throw new Error(`Interview model refused: ${choice.message.refusal}`);
  if (choice.finish_reason === "length") {
    throw new Error(`Interview model ran out of output budget writing ${name} — raise INTERVIEW_MAX_OUTPUT_TOKENS`);
  }

  const text = choice.message?.content ?? "";
  if (!text.trim()) throw new Error(`Interview model returned an empty ${name}`);

  let candidate: unknown;
  try {
    candidate = JSON.parse(unfence(text));
  } catch {
    throw new Error(`Interview model returned unparsable JSON for ${name}: ${text.slice(0, 160)}`);
  }

  const result = schema.safeParse(candidate);
  if (!result.success) {
    throw new Error(`Interview model returned a ${name} that failed validation: ${result.error.message.slice(0, 200)}`);
  }
  return { parsed: result.data as z.infer<S>, usage: readUsage(response.usage) };
}

/** Opens the interview. No transcript yet, so the prefix is just rubric + config. */
export async function openInterview(config: InterviewConfig, budget: number, wantsCode: boolean) {
  const input = prefix(config, budget, []);
  input.push({ role: "user", content: "Begin the interview. Ask question 1." });
  const { parsed, usage } = await askQuestion(input, questionSchema(wantsCode), "first_turn");
  return { question: parsed.question as InterviewQuestion, usage };
}

/**
 * The two halves of a turn.
 *
 * They began as one call, which read as the obvious economy: one round trip,
 * one prefix, and the model could choose the next question in light of the
 * score it had just written. Measurement killed it. Decoding is strictly
 * sequential and this provider runs anywhere between 5 and 60 tokens a second,
 * so a combined reply is the sum of both halves — and the scoring half turns
 * out to be the larger one, at 800-1,100 tokens against the question's 100-700.
 *
 * That matters more than it looks, because the score is deliberately withheld
 * until the interview closes. Waiting for it means the candidate waits on the
 * longest thing in the turn and is then shown none of it. So the two are split:
 * the caller awaits the question and lets the score land on its own.
 *
 * The coupling is not lost, only moved — the question call is told to judge the
 * answer's strength itself, which is what the rubric already asks of it.
 */
function turnPrompt(
  config: InterviewConfig,
  budget: number,
  transcript: TranscriptTurn[],
  currentQuestion: string,
) {
  const input = prefix(config, budget, transcript);
  input.push({ role: "assistant", content: currentQuestion });
  return input;
}

/** Scores one answer. Nothing waits on this — see the note above. */
export async function evaluateAnswer(
  config: InterviewConfig,
  budget: number,
  transcript: TranscriptTurn[],
  currentQuestion: string,
  answer: string,
) {
  const input = turnPrompt(config, budget, transcript, currentQuestion);
  input.push({
    role: "user",
    content: `${answer}\n\n---\nScore that answer. Do not ask another question.`,
  });
  const { parsed, usage } = await ask(input, LastTurn, "evaluation");
  return { evaluation: parsed.evaluation, usage };
}

/** Asks the next question. This is the only call a candidate actually waits on. */
export async function askNextQuestion(
  config: InterviewConfig,
  budget: number,
  transcript: TranscriptTurn[],
  currentQuestion: string,
  answer: string,
  questionNumber: number,
  wantsCode: boolean,
) {
  const input = turnPrompt(config, budget, transcript, currentQuestion);
  input.push({
    role: "user",
    content:
      `${answer}\n\n---\nAsk question ${questionNumber + 1} of ${budget}. ` +
      `Judge for yourself how well that answer went and choose accordingly: go deeper on the same thread ` +
      `if it was strong, move to a different area if it was weak. Do not score it here. ` +
      // Every token generated here is a token the candidate waits through.
      `Keep the question itself to one to three sentences.`,
  });
  const { parsed, usage } = await askQuestion(input, questionSchema(wantsCode), "next_question");
  return { nextQuestion: parsed.question as InterviewQuestion, usage };
}

/**
 * Writes the question *after* the one currently on screen, while the candidate
 * is still answering it.
 *
 * This is the whole latency story. A candidate spends thirty seconds to three
 * minutes on an answer; generating a question takes five to fifteen. That gap
 * is free wall-clock time, and filling it means a submitted answer can be met
 * with a question that already exists instead of one that has to be written.
 *
 * The cost is one answer's worth of hindsight: this question is chosen knowing
 * everything the candidate has said *except* the reply being typed as it is
 * written. Everything earlier is still in the transcript, so the interview
 * still develops — it simply reacts a beat later than it used to.
 */
export async function prefetchQuestion(
  config: InterviewConfig,
  budget: number,
  transcript: TranscriptTurn[],
  askedQuestion: string,
  questionNumber: number,
  wantsCode: boolean,
) {
  const input = prefix(config, budget, transcript);
  input.push({ role: "assistant", content: askedQuestion });
  input.push({
    role: "user",
    content:
      `You have just asked the question above and the candidate is still writing their answer. ` +
      `Write the question you will ask after it — question ${questionNumber + 1} of ${budget}. ` +
      `It must cover different ground from the question above and from everything already asked, ` +
      `since you cannot yet know how the current answer goes. ` +
      `Keep the question itself to one to three sentences.`,
  });
  const { parsed, usage } = await askQuestion(input, questionSchema(wantsCode), "prefetch_question");
  return { nextQuestion: parsed.question as InterviewQuestion, usage };
}

/** Scores the final answer. No next question — the budget is spent. */
export async function evaluateFinal(
  config: InterviewConfig,
  budget: number,
  transcript: TranscriptTurn[],
  currentQuestion: string,
  answer: string,
) {
  const input = prefix(config, budget, transcript);
  input.push({ role: "assistant", content: currentQuestion });
  input.push({
    role: "user",
    content: `${answer}\n\n---\nThat was the final question. Score it. Do not ask another.`,
  });
  const { parsed, usage } = await ask(input, LastTurn, "last_turn");
  return { evaluation: parsed.evaluation, usage };
}

/**
 * The closing report.
 *
 * Deliberately does NOT see the transcript — every number in the report is
 * computed from stored scores, and the model only writes prose over feedback it
 * already produced. That keeps the most expensive-looking call one of the
 * cheapest in the session.
 */
export async function writeReport(
  config: InterviewConfig,
  perQuestion: Array<{ topic: string | null; score: number; feedback: string; missed: string[] }>,
  averageScore: number,
  budget: number,
) {
  const digest = perQuestion
    .map(
      (q, i) =>
        `${i + 1}. [${q.topic ?? "general"}] scored ${q.score}/10 — ${q.feedback}` +
        (q.missed.length ? ` (missed: ${q.missed.join("; ")})` : ""),
    )
    .join("\n");

  const input: InputItem[] = [
    { role: "system", content: RUBRIC },
    { role: "system", content: configBlock(config, budget) },
    {
      role: "user",
      content:
        `The interview is over. Here is how each answer scored, with the feedback already given:\n\n${digest}\n\n` +
        `Average: ${averageScore.toFixed(1)}/10.\n\n` +
        `Write the closing report. The summary is three to five sentences addressed to the candidate, ` +
        `naming the pattern across answers rather than restating them one by one. ` +
        `Strengths and weaknesses are short specific phrases drawn from the evidence above — no filler, ` +
        `and omit a strength rather than invent one. Next steps are concrete things to go and study or practise.`,
    },
  ];

  const { parsed, usage } = await ask(input, Report, "report");
  return { report: parsed, usage };
}

/* ── scoring a spoken round ────────────────────────────────────────────── */

/**
 * One question lifted out of a voice transcript, scored on the same 0-10 scale
 * the written round uses. The extra fields over `Evaluation` are the ones a
 * written round gets for free from the row it already wrote — a spoken round
 * has to recover them from what was actually said.
 */
const SpokenTurn = z.object({
  question: z.string(),
  answer: z.string(),
  topic: z.string(),
  focusArea: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expectedSkills: z.array(z.string()),
  score: z.number().int().min(0).max(10),
  verdict: z.enum(["strong", "adequate", "weak", "no_answer"]),
  feedback: z.string(),
  missed: z.array(z.string()),
});
const SpokenBreakdown = z.object({ questions: z.array(SpokenTurn) });

export type SpokenQuestion = z.infer<typeof SpokenTurn>;

/** A line of the conversation as it was actually spoken. */
export interface SpokenLine {
  speaker: "interviewer" | "candidate";
  text: string;
}

/**
 * Turns a spoken round into the same scored question rows a written round
 * stores, so history, the report page and the career analytics never learn
 * that two kinds of interview exist.
 *
 * Deliberately not run on the realtime model. That model is priced and tuned
 * for holding a conversation at latency, and it spent the whole interview under
 * instructions never to reveal a judgement — asking it to grade its own round
 * afterwards is both the expensive way and the biased one. Nemotron sees the
 * finished transcript cold, with the same rubric that marks every written
 * answer, which is what makes the two modes comparable at all.
 *
 * Follow-ups are folded into the question that prompted them: a probe and its
 * answer are evidence about one topic, not a separate question the candidate
 * was asked.
 */
export async function analyzeVoiceTranscript(
  config: InterviewConfig,
  budget: number,
  lines: SpokenLine[],
) {
  const conversation = lines
    .map((line) => `${line.speaker === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${line.text}`)
    .join("\n");

  const input: InputItem[] = [
    { role: "system", content: RUBRIC },
    { role: "system", content: configBlock(config, budget) },
    {
      role: "user",
      content:
        `Below is the full transcript of a spoken technical interview, transcribed from audio. ` +
        `Break it into the questions that were actually asked and score each one.\n\n` +
        `${conversation}\n\n---\n` +
        `Rules for the breakdown:\n` +
        `- One entry per substantive question. Fold each follow-up into the question that prompted it: ` +
        `the answer field should capture everything the candidate said on that thread.\n` +
        `- Skip greetings, the closing, and any exchange that was not a question about engineering.\n` +
        `- Quote the question roughly as it was asked, cleaned up into one sentence.\n` +
        `- The answer field summarises what the candidate actually said, in their own terms. ` +
        `Do not improve it, and do not credit them with anything they did not say.\n` +
        `- This is speech, so expect filler, false starts and transcription errors. ` +
        `Judge the engineering, not the fluency, and do not penalise a mangled word that is obviously ` +
        `the right term misheard.\n` +
        `- The interview may have been conducted in English, Hindi, or a mix of the two, and either ` +
        `side may switch language mid-way. Score exactly the same either way: an idea explained ` +
        `correctly in Hindi is worth what it is worth in English, and answering in Hindi is never ` +
        `itself a weakness. Write every field you produce — question, answer, feedback, missed — in ` +
        `English regardless, since the report is read later as text.\n` +
        `- A question the candidate never really answered scores accordingly, with verdict "no_answer".\n` +
        `- Score on the same scale you would apply to a written answer for this experience band.`,
    },
  ];

  // A nine-question breakdown carries nine sets of feedback, which is several
  // times what any single written call emits — the shared ceiling would cut it
  // off mid-object and fail validation.
  const { parsed, usage } = await ask(
    input,
    SpokenBreakdown,
    "voice_breakdown",
    Number(process.env.INTERVIEW_VOICE_MAX_OUTPUT_TOKENS ?? 12_000),
  );
  return { questions: parsed.questions, usage };
}

/** Questions per interview, from the difficulty tier the builder offers. */
export function questionBudgetFor(difficulty: string): number {
  const key = (difficulty || "").toLowerCase();
  if (key.includes("hard") || key.includes("senior") || key.includes("staff")) return 9;
  if (key.includes("easy") || key.includes("intro") || key.includes("junior")) return 5;
  return 7;
}
