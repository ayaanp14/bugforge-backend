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
  // How long a query waits for a free pooled connection. Thirty seconds only
  // ever meant a request that was going to fail took thirty seconds to say so;
  // if the pool is saturated for ten, it is not clearing in twenty more.
  acquireTimeout: 10000,
  // Seconds an idle connection may sit in the pool before the driver closes it
  // itself. The shared host enforces its own `wait_timeout`; a connection it
  // has already dropped looks pooled and healthy until the next query fails on
  // it, so this stays comfortably under the server's limit.
  idleTimeout: 60,
});

export const prisma = new PrismaClient({ adapter });
