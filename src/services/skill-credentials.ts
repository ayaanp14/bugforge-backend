/**
 * Skill-test credentials: issuing one when a sitting passes, raising or
 * renewing it on a better one, the frame its holder wears, the public
 * verification read, and revocation.
 *
 * One SkillCredential row per (account, test). Its `code` is the public
 * identity — printed on the certificate, resolved by /verify/<code> — and
 * never changes once issued, so a certificate printed after a pass still
 * verifies after the holder sits again and earns distinction.
 */
import { prisma } from "../lib/prisma.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import { credentialName, isSkillLevel, LEVEL_LABEL, skillDef, SKILL_LEVELS, type SkillLevel } from "../lib/skill-catalog.js";
import {
  addMonths,
  credentialCode,
  credentialPath,
  credentialStatus,
  improvesCredential,
  WORN_CREDENTIAL_SELECT,
  type Band,
  type CredentialStatus,
} from "../lib/skill-tests.js";
import { createNotificationOnce } from "./notifications.js";
// dashboard imports credentialsFor from here; both sides only call the other
// at request time, so the cycle is inert (the same shape as roadmap's).
import { invalidateDashboard } from "./dashboard.js";

/**
 * XP for a first credential at each level, paid once per (account, test) —
 * a raised band or a renewal pays nothing more. Into `xp` and `rating`
 * together, like a roadmap chest: it is not a solve, so no per-source bucket.
 */
export const CREDENTIAL_XP: Record<SkillLevel, number> = { basic: 50, intermediate: 100, advanced: 150 };

/**
 * The topic ids a test's pool holds, in catalogue order — "what this test
 * covers". A skill's catalogue lists every topic it is examined on at any
 * level (Java's concurrency, SQL's window functions); a Basic test covers
 * only what its bank asks, and every page that says what a test covers —
 * its rules page, a credential's verify page, the SEO head — reads this.
 */
export function poolTopics(skill: string, level: string): Promise<string[]> {
  return cachedShared(`skill:pool-topics:v1:${skill}:${level}`, 900, async () => {
    const rows = await prisma.skillQuestion.groupBy({ by: ["topic"], where: { skill, level, active: true } });
    const present = new Set(rows.map((row) => row.topic));
    return (skillDef(skill)?.topics ?? []).filter((t) => present.has(t.id)).map((t) => t.id);
  });
}

const levelRank = (level: string) => (isSkillLevel(level) ? SKILL_LEVELS.indexOf(level) : -1);

const verifyKey = (code: string) => `skill:credential:v1:${code}`;

export type IssueOutcome = { kind: "new" | "raised" | "renewed"; code: string } | null;

/**
 * Issues or improves the credential a passing sitting earned. Idempotent:
 * the (account, test) unique index makes a second concurrent issue a no-op
 * for the loser, and a sitting that does not beat the standing changes
 * nothing.
 */
export async function issueCredential(input: {
  userId: string;
  test: { id: string; slug: string; title: string; skill: string; level: string; validityMonths: number };
  attemptId: string;
  percent: number;
  band: Exclude<Band, "fail">;
  now?: Date;
}): Promise<IssueOutcome> {
  const now = input.now ?? new Date();
  const expiresAt = addMonths(now, input.test.validityMonths);
  const existing = await prisma.skillCredential.findUnique({
    where: { userId_testId: { userId: input.userId, testId: input.test.id } },
    select: { id: true, code: true, percent: true, expiresAt: true, revokedAt: true },
  });

  let outcome: IssueOutcome = null;
  let credentialId: string | null = null;

  if (!existing) {
    // A code collision is one in a trillion; the unique index catches it and
    // a fresh code goes again. A collision on (userId, testId) means a
    // concurrent sitting issued first — its credential stands.
    for (let tries = 0; tries < 4 && !credentialId; tries += 1) {
      const code = credentialCode();
      try {
        const row = await prisma.skillCredential.create({
          data: {
            code,
            userId: input.userId,
            testId: input.test.id,
            skill: input.test.skill,
            level: input.test.level,
            band: input.band,
            percent: input.percent,
            attemptId: input.attemptId,
            issuedAt: now,
            expiresAt,
          },
          select: { id: true, code: true },
        });
        credentialId = row.id;
        outcome = { kind: "new", code: row.code };
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        const raced = await prisma.skillCredential.findUnique({
          where: { userId_testId: { userId: input.userId, testId: input.test.id } },
          select: { id: true },
        });
        if (raced) return null;
      }
    }
    if (!credentialId) throw new Error("could not mint a unique credential code");

    await prisma.user.update({
      where: { id: input.userId },
      data: { xp: { increment: CREDENTIAL_XP[input.test.level as SkillLevel] ?? 0 }, rating: { increment: CREDENTIAL_XP[input.test.level as SkillLevel] ?? 0 } },
      select: { id: true },
    });
  } else if (improvesCredential(existing, { percent: input.percent }, now)) {
    const renewed = credentialStatus(existing, now) === "expired";
    // Guarded on the stored percent so two sittings closing together cannot
    // write the worse one last.
    const raised = await prisma.skillCredential.updateMany({
      where: renewed ? { id: existing.id, revokedAt: null } : { id: existing.id, revokedAt: null, percent: { lt: input.percent } },
      data: { band: input.band, percent: input.percent, attemptId: input.attemptId, issuedAt: now, expiresAt },
    });
    if (raised.count === 0) return null;
    credentialId = existing.id;
    outcome = { kind: renewed ? "renewed" : "raised", code: existing.code };
  } else {
    return null;
  }
  if (!outcome || !credentialId) return null;

  await wearIfBetter(input.userId, credentialId, input.test.skill, input.test.level, now);
  invalidate(verifyKey(outcome.code));
  invalidateDashboard(input.userId);

  const name = credentialName(input.test.skill, input.test.level);
  const xp = CREDENTIAL_XP[input.test.level as SkillLevel] ?? 0;
  await createNotificationOnce(input.userId, {
    type: `skill_credential:${outcome.code}:${outcome.kind === "new" ? "issued" : `${input.band}:${now.toISOString().slice(0, 10)}`}`,
    title:
      outcome.kind === "new"
        ? `Certified: ${name} 🎓 +${xp} XP`
        : outcome.kind === "renewed"
          ? `Credential renewed: ${name}`
          : `Credential raised: ${name}${input.band === "distinction" ? " — with distinction" : ""}`,
    body:
      outcome.kind === "new"
        ? `You passed the ${input.test.title} skill test${input.band === "distinction" ? " with distinction" : ""}. Your certificate is ready to download and verify, and its frame is on your profile picture.`
        : `Your ${name} credential now shows your latest result and is valid for another ${input.test.validityMonths / 12} years.`,
    href: credentialPath(outcome.code),
  });

  return outcome;
}

/**
 * Puts a newly earned credential on the avatar when nothing better is worn:
 * nothing at all, a worn credential that has lapsed, or a lower level of
 * the same skill. A frame the holder chose for another skill stays.
 */
async function wearIfBetter(userId: string, credentialId: string, skill: string, level: string, now: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wornCredential: { select: { id: true, skill: true, level: true, expiresAt: true, revokedAt: true } } },
  });
  const worn = user?.wornCredential;
  const replace =
    !worn ||
    worn.id === credentialId ||
    credentialStatus(worn, now) !== "valid" ||
    (worn.skill === skill && levelRank(level) > levelRank(worn.level));
  if (replace && worn?.id !== credentialId) {
    await prisma.user.update({ where: { id: userId }, data: { wornCredentialId: credentialId }, select: { id: true } });
  }
}

/** A credential as the profile and the result page show it. */
export interface CredentialSummary {
  code: string;
  skill: string;
  level: string;
  name: string;
  testSlug: string;
  band: string;
  percent: number;
  issuedAt: Date;
  expiresAt: Date;
  status: CredentialStatus;
  worn: boolean;
}

/**
 * An account's credentials, newest first, for its profile. Revoked ones are
 * left out — a profile shows what stands — and `percent` goes only to the
 * owner (the public profile allow-list drops it).
 */
export async function credentialsFor(userId: string, now: Date = new Date()): Promise<CredentialSummary[]> {
  const [rows, user] = await Promise.all([
    prisma.skillCredential.findMany({
      where: { userId, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      select: { id: true, code: true, skill: true, level: true, band: true, percent: true, issuedAt: true, expiresAt: true, revokedAt: true, test: { select: { slug: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { wornCredentialId: true } }),
  ]);
  return rows.map((row) => ({
    code: row.code,
    skill: row.skill,
    level: row.level,
    name: credentialName(row.skill, row.level),
    testSlug: row.test.slug,
    band: row.band,
    percent: row.percent,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    status: credentialStatus(row, now),
    worn: row.id === user?.wornCredentialId,
  }));
}

/**
 * The public verification read for /verify/<code>: who holds it, for what,
 * and whether it stands today. The rows are cached for a minute (a revoke
 * drops the entry); the status is computed per request, so an expiry is
 * never served late. No score: what a credential certifies is its band.
 */
export async function verifyCredential(code: string, viewerId: string | null, now: Date = new Date()) {
  const row = await cached(verifyKey(code), 60_000, () =>
    prisma.skillCredential.findUnique({
      where: { code },
      select: {
        code: true,
        skill: true,
        level: true,
        band: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        userId: true,
        test: { select: { slug: true, title: true, durationSec: true, totalQuestions: true, sections: { orderBy: { orderIndex: "asc" }, select: { name: true, kind: true, questionCount: true } } } },
        user: {
          select: {
            name: true,
            username: true,
            avatar_url: true,
            roadmapRewards: { select: { tierKey: true } },
            ...WORN_CREDENTIAL_SELECT,
          },
        },
      },
    }),
  );
  if (!row) return null;
  const def = skillDef(row.skill);
  const status = credentialStatus(row, now);
  const covered = await poolTopics(row.skill, row.level);
  return {
    code: row.code,
    name: credentialName(row.skill, row.level),
    skill: { id: row.skill, label: def?.label ?? row.skill, short: def?.short ?? row.skill.slice(0, 3).toUpperCase() },
    level: row.level,
    levelLabel: isSkillLevel(row.level) ? LEVEL_LABEL[row.level] : row.level,
    band: row.band,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    status,
    revokedAt: status === "revoked" ? row.revokedAt : null,
    holder: row.user,
    test: {
      slug: row.test.slug,
      title: row.test.title,
      durationSec: row.test.durationSec,
      totalQuestions: row.test.totalQuestions,
      sections: row.test.sections,
      topics: (def?.topics ?? []).filter((t) => covered.includes(t.id)).map((t) => t.label),
    },
    isOwner: viewerId === row.userId,
  };
}

/**
 * Wears one of the account's own valid credentials, or nothing (`null`).
 * Answers the refusal as a string, or null on success.
 */
export async function setWornCredential(userId: string, code: string | null): Promise<string | null> {
  if (code === null) {
    await prisma.user.update({ where: { id: userId }, data: { wornCredentialId: null }, select: { id: true } });
    invalidateDashboard(userId);
    return null;
  }
  const credential = await prisma.skillCredential.findUnique({ where: { code }, select: { id: true, userId: true, expiresAt: true, revokedAt: true } });
  if (!credential || credential.userId !== userId) return "That credential is not yours";
  if (credentialStatus(credential) !== "valid") return "Only a valid credential can be worn";
  await prisma.user.update({ where: { id: userId }, data: { wornCredentialId: credential.id }, select: { id: true } });
  invalidateDashboard(userId);
  return null;
}

/**
 * Revokes a credential (an admin's decision, with the reason recorded) or
 * restores one. A revoked credential comes off every avatar at once: the
 * column pointing at it is cleared, so no author payload carries it again.
 */
export async function setRevoked(code: string, revoke: boolean, reason: string | null): Promise<boolean> {
  const credential = await prisma.skillCredential.findUnique({ where: { code }, select: { id: true, userId: true } });
  if (!credential) return false;
  await prisma.$transaction([
    prisma.skillCredential.update({
      where: { id: credential.id },
      data: revoke ? { revokedAt: new Date(), revokedReason: reason } : { revokedAt: null, revokedReason: null },
      select: { id: true },
    }),
    ...(revoke ? [prisma.user.updateMany({ where: { wornCredentialId: credential.id }, data: { wornCredentialId: null } })] : []),
  ]);
  invalidate(verifyKey(code));
  invalidateDashboard(credential.userId);
  return true;
}
