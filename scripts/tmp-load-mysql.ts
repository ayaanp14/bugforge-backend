/** One-shot loader: pgdump JSON → MySQL via the freshly generated client. */
import "dotenv/config";
import fs from "fs";
import { prisma } from "../src/lib/prisma.js";

const DIR = "C:/Users/AYAANP~1/AppData/Local/Temp/claude/d--coding-project/da107739-e950-42fa-b512-b91113baed5c/scratchpad/pgdump";
const load = (name: string): any[] => JSON.parse(fs.readFileSync(`${DIR}/${name}.json`, "utf8"));

// Nullable Json columns: Prisma createMany rejects JS null — omit instead.
const stripNullJson = (rows: any[], fields: string[]) =>
  rows.map((r) => {
    const out = { ...r };
    for (const f of fields) if (out[f] === null) delete out[f];
    return out;
  });

async function insert(name: string, model: { createMany: (args: { data: any[]; skipDuplicates?: boolean }) => Promise<{ count: number }> }, rows: any[], chunk = 500) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const res = await model.createMany({ data: rows.slice(i, i + chunk), skipDuplicates: true });
    inserted += res.count;
  }
  console.log(`${name}: ${inserted}/${rows.length}`);
}

(async () => {
  if (!fs.existsSync(`${DIR}/DUMP_OK`)) throw new Error("dump marker missing");
  await insert("users", prisma.user, load("users"));
  await insert("accounts", prisma.account, load("accounts"));
  await insert("sessions", prisma.session, load("sessions"));
  await insert("verificationTokens", prisma.verificationToken, load("verificationTokens"));
  await insert("userStats", prisma.userStats, load("userStats"));
  await insert("problems", prisma.problem, stripNullJson(load("problems"), ["starterCode", "signature"]));
  await insert("testCasesOrig", prisma.testCase, load("testCasesOrig"), 2000);
  await insert("bugChallenges", prisma.bugChallenge, load("bugChallenges"));
  await insert("challengeFiles", prisma.challengeFile, load("challengeFiles"));
  await insert("challengeTests", prisma.challengeTest, load("challengeTests"));
  await insert("bugSubmissions", prisma.bugSubmission, load("bugSubmissions"));
  await insert("pairRooms", prisma.pairRoom, load("pairRooms"));
  await insert("roomParticipants", prisma.roomParticipant, load("roomParticipants"));
  await insert("submissions", prisma.submission, load("submissions"));
  await insert("codeDrafts", prisma.codeDraft, load("codeDrafts"));
  await insert("problemTimers", prisma.problemTimer, load("problemTimers"));
  await insert("savedInterviews", prisma.savedInterview, load("savedInterviews"));
  await insert("mockSessions", prisma.mockInterviewSession, load("mockSessions"));
  await insert("mockQuestions", prisma.mockInterviewQuestion, load("mockQuestions"));
  await insert("notifications", prisma.notification, load("notifications"));
  console.log("LOAD COMPLETE");
  await prisma.$disconnect();
})().catch((e) => { console.error("LOAD FAILED:", e.message); process.exit(1); });
