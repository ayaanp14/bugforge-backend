import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

// MySQL (verto84f_bot on vertowork.com) via the MariaDB driver adapter
// (Prisma 7 requires driver adapters). The shared host caps
// max_user_connections at 25, so keep the pool small.
const dbUrl = new URL(process.env["DATABASE_URL"]!);

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),
  connectionLimit: Number(dbUrl.searchParams.get("connection_limit") ?? 5),
  // MySQL 8 uses caching_sha2_password; without TLS the connector must be
  // allowed to fetch the server's public key or every connection fails.
  allowPublicKeyRetrieval: true,
  connectTimeout: 20000,
  acquireTimeout: 30000,
});

export const prisma = new PrismaClient({ adapter });
