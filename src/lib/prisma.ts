import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

// MySQL (verto84f_bot on vertowork.com) via the MariaDB driver adapter
// (Prisma 7 requires driver adapters). The shared host caps
// max_user_connections at 25, so keep the pool small.
const dbUrl = new URL(process.env["DATABASE_URL"]!);

/**
 * Measured against production (Railway → the cPanel host) on 2026-09-23:
 *
 *   TCP round trip ............ 270 ms
 *   SELECT 1 .................. 269 ms
 *   SELECT COUNT(*) Submission  269 ms   <- identical to SELECT 1
 *   opening a connection ...... 1117 ms  (TCP + MySQL auth ≈ 4 round trips)
 *
 * A COUNT over the whole submission table costs exactly what `SELECT 1` costs,
 * which is the whole story: server-side execution is a rounding error and
 * every millisecond is the wire. Nothing here is fixed by an index; latency is
 * fixed by making fewer round trips and never paying for a connection twice.
 */
const adapter = new PrismaMariaDb({
  // `pingTimeout` is honoured by the driver (lib/config/pool-options.js reads
  // it) but is missing from mariadb's published PoolConfig typings, so the
  // literal is widened for that one key rather than typed as `any`.
  ...({ pingTimeout: 5_000 } as { pingTimeout?: number }),
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

  // ---------------------------------------------------------------------
  // Connection validation. These three lines were worth ~800ms on *every*
  // query in production; do not restore the defaults without re-measuring.
  //
  // Before handing out a pooled connection that has been idle longer than
  // `minDelayValidation`, the driver PINGs it and waits `pingTimeout` for the
  // reply. The defaults are 500ms and 250ms — and the ping is a round trip, so
  // on this database it takes 270ms and the 250ms timeout can *never* be met.
  // Every acquire therefore: pinged (250ms, timed out) -> declared the
  // connection dead -> discarded it -> walked the next idle connection and
  // failed that one the same way -> finally opened a fresh one (1117ms).
  // A healthy connection was thrown away and rebuilt on essentially every
  // request, because the health check was timing out against a live server.
  //
  // Measured, one Prisma findFirst on a connection idle for 2s (median of 3):
  //   defaults ............................. 1344 ms
  //   the settings below ....................  557 ms
  // and with validation skipped entirely ....  283 ms  (one round trip)
  //
  // So: skip the ping for a connection used in the last minute, and give a
  // ping that does happen long enough to answer. A minute is the balance —
  // under traffic the five pooled connections rotate well inside it and cost
  // nothing, while an idle spell still revalidates before handing one out.
  //
  // Dropping the check entirely would be another ~280ms, but the ping is what
  // catches a half-open socket (a NAT or firewall timeout, where no FIN ever
  // arrives and the connection only looks alive). A socket the server closed
  // properly is already caught for free — the driver marks it CLOSED and
  // isValid() fails it before any ping is considered.
  // ---------------------------------------------------------------------
  minDelayValidation: 60_000,

  // ---------------------------------------------------------------------
  // Prepared-statement reuse. The adapter runs every query through the
  // binary protocol (connection.execute) and, unless told otherwise,
  // forces prepareCacheLength to 0 — so each query PREPAREs, EXECUTEs and
  // throws the statement away. Two round trips where one would do, on a link
  // where a round trip is the entire cost of a query. The server agrees it
  // has been happening: Com_stmt_prepare stood at 5.27 million.
  //
  // Caching the handle per connection makes a repeated query shape one round
  // trip. Measured, the same Prisma findFirst repeated (median of 6):
  //   prepareCacheLength 0 (adapter default) .... 566 ms
  //   prepareCacheLength 256 .................... 294 ms   <- the 270ms floor
  //
  // Only the first use of each shape pays the PREPARE, and the app has on the
  // order of a hundred shapes. The budget is per connection and the server's
  // max_prepared_stmt_count is 16382, so this is ~1.3k of it at a pool of 5.
  // ---------------------------------------------------------------------
  prepareCacheLength: 256,
  // Seconds an idle connection may sit in the pool before the driver closes it
  // itself. The server's own wait_timeout is 3600s, so the previous 60s was
  // far below what the host actually allows and only ever meant re-paying the
  // 1117ms handshake. The driver keeps `minimumIdle` (= connectionLimit)
  // connections regardless; this is the ceiling for anything above that.
  idleTimeout: 1800,
});

export const prisma = new PrismaClient({ adapter });
