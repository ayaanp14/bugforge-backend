/**
 * READ ONLY. Reports which tables the target database already has and how full
 * they are, so a schema push is never run blind. Prints the host and database
 * name but never the credentials.
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL in the environment.");
  process.exit(1);
}
const parsed = new URL(url);
console.log(`target: ${parsed.hostname}:${parsed.port || 3306}/${parsed.pathname.slice(1)}`);
console.log(`local?  ${["localhost", "127.0.0.1"].includes(parsed.hostname) ? "YES — this is the dev database" : "no — this is a remote database"}`);

const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.slice(1),
  connectionLimit: 2,
  allowPublicKeyRetrieval: true,
  // A shared host across the public internet needs far longer than the
  // one-second default the adapter otherwise uses.
  connectTimeout: 30000,
  acquireTimeout: 30000,
} as any);
const prisma = new PrismaClient({ adapter });

const WANT = [
  "Feedback",
  "AptitudeQuestion",
  "AptitudeAttempt",
  "MockTest",
  "MockTestSection",
  "MockAttempt",
  "MockAnswer",
  "MockCodeAnswer",
];

const rows = await prisma.$queryRawUnsafe<Array<{ TABLE_NAME: string }>>(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
);
const present = new Set(rows.map((r) => r.TABLE_NAME));
console.log(`\n${present.size} tables in the schema.`);

console.log("\nthe tables this work needs:");
for (const name of WANT) {
  if (!present.has(name)) {
    console.log(`  ${name.padEnd(18)} MISSING — db push will create it`);
    continue;
  }
  const [{ n }] = await prisma.$queryRawUnsafe<Array<{ n: bigint }>>(`SELECT COUNT(*) AS n FROM \`${name}\``);
  console.log(`  ${name.padEnd(18)} exists, ${Number(n)} row(s)`);
}

// The columns added this session to an existing table.
if (present.has("MockTestSection")) {
  const cols = await prisma.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MockTestSection'"
  );
  const names = cols.map((c) => c.COLUMN_NAME);
  for (const col of ["kind", "marksPerQuestion"]) {
    console.log(`  MockTestSection.${col.padEnd(16)} ${names.includes(col) ? "present" : "MISSING — db push will add it"}`);
  }
}

// What is already live, so nothing here is a surprise.
const [{ users }] = await prisma.$queryRawUnsafe<Array<{ users: bigint }>>("SELECT COUNT(*) AS users FROM `User`");
const [{ problems }] = await prisma.$queryRawUnsafe<Array<{ problems: bigint }>>(
  "SELECT COUNT(*) AS problems FROM `Problem` WHERE isPublished = 1"
);
console.log(`\nlive data: ${Number(users)} users, ${Number(problems)} published problems`);

await prisma.$disconnect();
