/**
 * Which interview skill a mock-interview question evidences (Phase 7 of
 * ADAPTIVE_COACH.md): the skill graph's "interview" domain, fed by the
 * questions the interviewer asked and scored.
 *
 * Only two fields of a question are a fixed vocabulary: the round it was
 * asked in (SavedInterview.roundId — the builder's ids) and the focus areas
 * chosen. Everything else — `topic`, `focusArea`, `expectedSkills` — is text
 * the model writes ("Query Optimization Alternatives", "cache coherence",
 * "self-awareness"); a survey of the local rows on 2026-10-07 found almost no
 * value twice. So the round decides, and the question's own words override
 * it only when they plainly say what kind of question it was: a technical
 * round opens with "tell me about yourself", a coding round asks about
 * complexity, a backend round turns into system design.
 *
 * The four skills are the four kinds of answer an interview scores
 * differently, and the ones the published round structures name
 * (lib/simulations): working a problem out aloud, technical questions,
 * design, and the behavioural/HR conversation. Communication is not one of
 * them: the interviewer gives a question one score, so there is nothing to
 * separate it by.
 */

export const INTERVIEW_SKILLS = ["int:coding", "int:technical", "int:design", "int:behavioural"] as const;
export type InterviewSkill = (typeof INTERVIEW_SKILLS)[number];

/** The builder's round ids (frontend components/mock-interview/interview-options.ts) and the kind of answer each scores. */
export const ROUND_SKILL: Readonly<Record<string, InterviewSkill | null>> = {
  "coding-interview": "int:coding",
  "machine-coding": "int:coding",
  "debugging-interview": "int:technical",
  "technical-interview": "int:technical",
  "frontend-round": "int:technical",
  "backend-round": "int:technical",
  "core-cs-fundamentals": "int:technical",
  "resume-deep-dive": "int:technical",
  "take-home-review": "int:technical",
  "system-design-interview": "int:design",
  "low-level-design": "int:design",
  "behavioral-round": "int:behavioural",
  "hr-round": "int:behavioural",
  "managerial-round": "int:behavioural",
  // Measured elsewhere (the aptitude bank) or not an interview answer at all.
  "aptitude-reasoning": null,
  "case-study": null,
};

// The question's words, strongest signal first. Behavioural before the rest:
// "ownership of a production incident" is a behavioural question about a
// technical event. Design before coding: "complexity" is coding, but
// "scaling" a service is design.
const OVERRIDES: ReadonlyArray<[InterviewSkill, RegExp]> = [
  [
    "int:behavioural",
    /\b(behaviou?ral|tell me about yourself|introduc|teamwork|team ?work|conflict|motivation|ownership|accountab|self[- ]?(awareness|reflection)|prioriti[sz]|time[- ]management|leadership|strength|weakness|career|why (this|our) company|relocat|failure story|feedback from|learning from|continuous learning|professional development)/i,
  ],
  [
    "int:design",
    /\b(system design|architect|scal(e|ing|ability)|distributed|microservice|load[- ]?balanc|shard|replication|high availability|rate[- ]limit|cach(e|ing)|message queue|event[- ]driven|consistency model|cap theorem|api design|service design|low[- ]level design)/i,
  ],
  [
    "int:coding",
    // Not "stack" or "heap": a technical round's "tech stack" and "heap memory" are not coding questions.
    /\b(algorithm|array|string|linked list|binary tree|tree traversal|graph|dynamic programming|\bdp\b|recursi|binary search|two pointers|sliding window|sort(ing)?\b|hash ?map|time complexity|space complexity|complexity analysis|big[- ]o|traversal|backtrack|greedy|matrix|subarray|substring)/i,
  ],
];

export interface InterviewQuestionFacts {
  roundId: string;
  topic: string | null;
  focusArea: string | null;
  expectedSkills: readonly string[];
}

/** The interview skill a question evidences, or null when it is none of them (an aptitude round, a case study). */
export function interviewSkillOf(q: InterviewQuestionFacts): InterviewSkill | null {
  const round = ROUND_SKILL[q.roundId];
  if (round === null) return null;
  const words = [q.topic, q.focusArea, ...q.expectedSkills].filter(Boolean).join(" · ");
  for (const [skill, re] of OVERRIDES) if (re.test(words)) return skill;
  // A round typed in by hand ("bar raiser with a VP") is a technical conversation unless its words say otherwise.
  return round ?? "int:technical";
}

/** The interview's depth as the scorer's assessment level (SavedInterview.difficulty: beginner | intermediate | advanced). */
export function interviewLevel(difficulty: string | null | undefined): "basic" | "intermediate" | "advanced" {
  return difficulty === "advanced" ? "advanced" : difficulty === "intermediate" ? "intermediate" : "basic";
}

/**
 * A question's score is 0–10 (services/interview-ai.ts Evaluation; the
 * session's overallScore is the mean × 10). As a percentage for the scorer:
 */
export const answerPercent = (score: number): number => Math.min(100, Math.max(0, score * 10));

/** A question's score counted as "right" in the scorer's topic tally: the interviewer's "adequate" (6) and up. */
export const ANSWER_PASS_SCORE = 6;
