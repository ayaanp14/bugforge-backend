/**
 * Re-scores a closed spoken round from its stored transcript.
 *
 * For a voice interview whose breakdown came out wrong — the case this was
 * written for: rounds scored before the placeholder question budget was kept
 * out of the breakdown prompt, which folded forty-odd turns into four rows.
 * The transcript is all on disk, so the round can be marked again exactly as
 * /voice/complete marks it: breakdown, question rows, then the closing report.
 * The previous rows are replaced, not merged, for the reason /complete gives —
 * a breakdown is a model call and two of them spliced together score nothing.
 *
 * Costs two model calls per session. Without --run it only prints what the
 * new breakdown would be.
 *
 *   npx tsx scripts/rescore-voice-session.ts <sessionId> [--run]
 *   node scripts/run-prod.mjs scripts/rescore-voice-session.ts <sessionId> --run
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { askingTurnCount, coalesce } from "../src/lib/voice-transcript.js";
import { analyzeVoiceTranscript, type InterviewConfig } from "../src/services/interview-ai.js";
import { finalizeInterview } from "../src/services/interview-completion.js";

const [sessionId, ...flags] = process.argv.slice(2);
const run = flags.includes("--run");

if (!sessionId) {
  console.error("usage: npx tsx scripts/rescore-voice-session.ts <sessionId> [--run]");
  process.exit(1);
}

(async () => {
  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
    include: { savedInterview: true },
  });
  if (!session) throw new Error(`no session ${sessionId}`);
  if (session.mode !== "voice") throw new Error(`${sessionId} is a ${session.mode} round, not a spoken one`);
  if (session.status !== "completed") throw new Error(`${sessionId} is ${session.status}; only a completed round is re-scored`);

  const template = session.savedInterview;
  const config: InterviewConfig = {
    roleId: template.roleId,
    roundId: template.roundId,
    difficulty: template.difficulty ?? "medium",
    experienceBand: template.experienceBand ?? "mid",
    interviewStyle: template.interviewStyle ?? "balanced",
    stackFocusIds: (template.stackFocusIds as string[] | null) ?? [],
    focusAreaIds: (template.focusAreaIds as string[] | null) ?? [],
  };

  const events = await prisma.interviewEvent.findMany({
    where: { sessionId, type: "transcript" },
    orderBy: { sequence: "asc" },
    select: { speaker: true, text: true },
  });
  const lines = coalesce(events);
  const asking = askingTurnCount(lines);
  const before = await prisma.mockInterviewQuestion.count({ where: { sessionId } });
  console.log(`${sessionId}: ${lines.length} transcript turns, ${asking} asking turns, ${before} rows stored`);

  const { questions, usage } = await analyzeVoiceTranscript(config, lines, asking);
  if (questions.length === 0) throw new Error("the breakdown returned no questions; nothing changed");

  for (const [i, q] of questions.entries()) {
    console.log(`${i + 1}. [${q.topic} · ${q.score}/10 ${q.verdict}] ${q.question}`);
    for (const f of q.followUps) console.log(`     ↳ ${f}`);
  }
  console.log(`\n${questions.length} questions (was ${before})`);

  if (!run) {
    console.log("Dry run — pass --run to replace the stored rows and rewrite the report.");
    await prisma.$disconnect();
    return;
  }

  await prisma.mockInterviewQuestion.deleteMany({ where: { sessionId } });
  await prisma.mockInterviewQuestion.createMany({
    data: questions.map((q, index) => ({
      sessionId,
      orderIndex: index,
      questionText: q.question,
      followUps: q.followUps,
      userAnswer: q.answer,
      topic: q.topic,
      difficulty: q.difficulty,
      focusArea: q.focusArea,
      expectedSkills: q.expectedSkills,
      evaluationScore: q.score,
      verdict: q.verdict,
      feedback: q.feedback,
      missed: q.missed,
      status: "evaluated",
    })),
  });

  const stored = await prisma.mockInterviewQuestion.findMany({
    where: { sessionId, status: "evaluated" },
    orderBy: { orderIndex: "asc" },
  });

  // Same call /voice/complete makes, with the same "the count is the budget"
  // rule; the session's timings are already on the row and stay as they are.
  const completed = await finalizeInterview(
    { id: sessionId, userId: session.userId, questionBudget: stored.length },
    config,
    stored,
    usage,
    { questionBudget: stored.length },
  );
  console.log(`rewritten: ${stored.length} rows, overall ${completed.overallScore === null ? "—" : completed.overallScore / 10}/10`);

  await prisma.$disconnect();
})();
