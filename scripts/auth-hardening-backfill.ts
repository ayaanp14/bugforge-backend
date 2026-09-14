/**
 * One-off data migration for the authentication hardening.
 *
 *   npx tsx scripts/auth-hardening-backfill.ts            # report only
 *   npx tsx scripts/auth-hardening-backfill.ts --apply    # write
 *   node scripts/run-prod.mjs scripts/auth-hardening-backfill.ts --apply
 *
 * Run it once, after `prisma db push` and before (or right after) the API
 * that enforces email verification goes live. Two things:
 *
 * 1. Accounts that exist already are marked verified. Sign-in now refuses a
 *    password account whose address was never confirmed, and no account had
 *    one confirmed before this change — `emailVerified` is a NextAuth-era
 *    column nothing wrote to. Without this step every existing member would
 *    be asked for a code at their next sign-in. They would get through (the
 *    code goes to their address), but it is a surprise nobody needs.
 *    Stamped with the account's creation date so the column keeps meaning
 *    "confirmed since".
 *
 * 2. Provider tokens stored on `Account` rows are cleared. The OAuth routes
 *    used to persist GitHub and Google access, refresh and id tokens that
 *    nothing ever read; they no longer write them, and the rows written
 *    before should not keep holding a third party's credentials either.
 */
import { prisma } from "../src/lib/prisma.js";

const apply = process.argv.includes("--apply");

async function main() {
  const unverified = await prisma.user.count({ where: { emailVerified: null } });
  const tokenRows = await prisma.account.count({
    where: { OR: [{ access_token: { not: null } }, { refresh_token: { not: null } }, { id_token: { not: null } }] },
  });
  console.log(`accounts without emailVerified: ${unverified}`);
  console.log(`provider link rows still holding tokens: ${tokenRows}`);

  if (!apply) {
    console.log("dry run — pass --apply to write");
    return;
  }

  // Raw SQL because Prisma cannot express "set column A from column B".
  const verified = await prisma.$executeRawUnsafe(
    "UPDATE `User` SET `emailVerified` = `createdAt` WHERE `emailVerified` IS NULL",
  );
  const cleared = await prisma.account.updateMany({
    where: { OR: [{ access_token: { not: null } }, { refresh_token: { not: null } }, { id_token: { not: null } }] },
    data: { access_token: null, refresh_token: null, id_token: null, expires_at: null },
  });
  console.log(`marked verified: ${verified}`);
  console.log(`token columns cleared: ${cleared.count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
