import { prisma } from "../lib/prisma.js";
import { writeReport, type InterviewConfig, type Usage } from "./interview-ai.js";

/**
 * Closing an interview, once its answers are scored.
 *
 * The two modes reach this point by different routes — a written round has been
 * marking answers all along, a spoken one recovers its marks from the
 * transcript at the end — but from here they are the same interview. The
 * average, the per-topic breakdown and the closing prose are computed exactly
 * once, here, so the history list and the report page cannot tell the two
 * apart. That is the whole point of the split: different interaction layers,
 * one analytics domain.
 */

/** The fields the aggregation reads off a marked question row. */
export interface ScoredQuestion {
  topic: string | null;
  evaluationScore: number | null;
  feedback: string | null;
  missed: unknown;
}

/** Folds one call's usage into the session's running totals. */
export function usageIncrement(usage: Usage) {
  return {
    promptTokens: { increment: usage.promptTokens },
    cachedTokens: { increment: usage.cachedTokens },
    completionTokens: { increment: usage.completionTokens },
    reasoningTokens: { increment: usage.reasoningTokens },
    costMicros: { increment: usage.costMicros },
  };
}

/**
 * Scores are 0-10 per question and the session stores a 0-100 overall, so the
 * average is scaled once, here, rather than at each call site.
 */
export async function finalizeInterview(
  session: { id: string; questionBudget: number },
  config: InterviewConfig,
  scored: ScoredQuestion[],
  /** Anything already spent getting to this point — the voice breakdown call. */
  priorUsage?: Usage,
  /** Extra columns the caller owns, e.g. the spoken round's timings. */
  extra: Record<string, unknown> = {},
) {
  const scores = scored.map((q) => q.evaluationScore as number);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Per-topic averages, straight out of the rows.
  const byTopic = new Map<string, number[]>();
  for (const q of scored) {
    const topic = q.topic ?? "general";
    const bucket = byTopic.get(topic) ?? [];
    bucket.push(q.evaluationScore as number);
    byTopic.set(topic, bucket);
  }
  const topicBreakdown = [...byTopic.entries()]
    .map(([topic, values]) => ({
      topic,
      asked: values.length,
      average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
    }))
    .sort((a, b) => a.average - b.average);

  const { report, usage } = await writeReport(
    config,
    scored.map((q) => ({
      topic: q.topic,
      score: q.evaluationScore as number,
      feedback: q.feedback ?? "",
      missed: ((q.missed as string[] | null) ?? []),
    })),
    average,
    session.questionBudget,
  );

  const total: Usage = priorUsage
    ? {
        promptTokens: usage.promptTokens + priorUsage.promptTokens,
        cachedTokens: usage.cachedTokens + priorUsage.cachedTokens,
        completionTokens: usage.completionTokens + priorUsage.completionTokens,
        reasoningTokens: usage.reasoningTokens + priorUsage.reasoningTokens,
        costMicros: usage.costMicros + priorUsage.costMicros,
      }
    : usage;

  return prisma.mockInterviewSession.update({
    where: { id: session.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      overallScore: Math.round(average * 10),
      summary: report.summary,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      nextSteps: report.nextSteps,
      topicBreakdown,
      ...extra,
      ...usageIncrement(total),
    },
  });
}
