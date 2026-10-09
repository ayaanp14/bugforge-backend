/**
 * Give an honour (src/lib/honours.ts) to accounts named by email or username.
 *
 *   npx tsx scripts/grant-honour.ts --kind founding_member --users "a@x.com,@bob,carol" [--mail] [--resend-mail] [--apply]
 *   npx tsx scripts/grant-honour.ts --list [--kind founding_member]
 *
 * Without --apply it is a dry run: it says who each name resolves to and
 * whether they already hold the honour, and writes nothing. --mail sends the
 * honour mail to each holder not yet mailed (--resend-mail: to everyone
 * named). Idempotent — naming someone twice changes nothing the second time.
 * The admin panel's Honours tab does the same over the API.
 *
 * Against the database in backend/.env. For production, run it on the box
 * (backend/deploy/README.md — content scripts): its MySQL has no public port.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { HONOUR_KINDS, honourDef, parseHonourees } from "../src/lib/honours.js";
import { grantHonour } from "../src/services/honours.js";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main() {
  const kind = value("--kind") ?? "founding_member";
  if (!honourDef(kind)) throw new Error(`--kind must be one of ${HONOUR_KINDS.join(", ")}`);

  if (flag("--list")) {
    const rows = await prisma.honour.findMany({
      where: { kind },
      orderBy: { grantedAt: "asc" },
      select: { grantedAt: true, celebratedAt: true, mailedAt: true, linkedinPosts: true, linkedinProfiles: true, user: { select: { username: true, email: true } } },
    });
    console.table(
      rows.map((r) => ({
        user: r.user.username,
        email: r.user.email,
        granted: r.grantedAt.toISOString().slice(0, 10),
        celebrated: r.celebratedAt ? "yes" : "",
        mailed: r.mailedAt ? "yes" : "",
        linkedinPosts: r.linkedinPosts,
        linkedinProfile: r.linkedinProfiles,
      })),
    );
    return;
  }

  const users = parseHonourees(value("--users") ?? "");
  if (!users.length) throw new Error('Name the accounts: --users "a@x.com,@bob"');

  if (!flag("--apply")) {
    for (const who of users) {
      const user = await prisma.user.findFirst({ where: who.includes("@") ? { email: who } : { username: who }, select: { id: true, username: true, email: true } });
      const held = user ? await prisma.honour.count({ where: { userId: user.id, kind } }) : 0;
      console.log(`${who.padEnd(36)} ${user ? `→ @${user.username} <${user.email}>${held ? "  (already holds it)" : ""}` : "→ NOT FOUND"}`);
    }
    console.log(`\nDry run. Add --apply to grant${flag("--mail") ? " and mail" : ""}.`);
    return;
  }

  const results = await grantHonour(kind, users, { grantedBy: "script", mail: flag("--mail") || flag("--resend-mail"), resendMail: flag("--resend-mail") });
  console.table(results.map((r) => ({ who: r.who, status: r.status, user: r.username ?? "", mailed: r.mailed === null || r.mailed === undefined ? "" : r.mailed ? "sent" : "NOT SENT" })));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
