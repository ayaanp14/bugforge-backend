/**
 * One-off data migration for the authentication hardening.
 *
 *   npx tsx scripts/auth-hardening-backfill.ts            # report only
 *   npx tsx scripts/auth-hardening-backfill.ts --apply    # write
 *   node scripts/run-prod.mjs scripts/auth-hardening-backfill.ts --apply
 *
 * Run it once, after `prisma db push` and before (or right after) the API
 * that enforces email verification goes live.
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
 * It also used to clear the provider tokens stored on `Account` rows; those
 * columns were dropped on 2026-10-10 (prisma/sql/2026-10-10-drop-dead-
 * objects.sql), which cleared them for good.
 */
import { prisma } from "../src/lib/prisma.js";

const apply = process.argv.includes("--apply");

async function main() {
  const unverified = await prisma.user.count({ where: { emailVerified: null } });
  console.log(`accounts without emailVerified: ${unverified}`);

  if (!apply) {
    console.log("dry run — pass --apply to write");
    return;
  }

  // Raw SQL because Prisma cannot express "set column A from column B".
  const verified = await prisma.$executeRawUnsafe(
    "UPDATE `User` SET `emailVerified` = `createdAt` WHERE `emailVerified` IS NULL",
  );
  console.log(`marked verified: ${verified}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
