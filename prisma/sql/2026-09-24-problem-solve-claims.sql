-- ProblemSolve — 2026-09-24
--
-- The claim table that replaces `SELECT id FROM User ... FOR UPDATE` in the
-- accepted-submission payout (src/routes/execution.ts). The unique pair makes
-- the first insert the payout and every later one a duplicate-key error, so
-- the database decides who is paid and no row has to be locked.
--
-- Apply with:
--   npx prisma db execute --file prisma/sql/2026-09-24-problem-solve-claims.sql
-- or, against production:
--   node scripts/prisma-prod.mjs db execute --file prisma/sql/2026-09-24-problem-solve-claims.sql
--
-- SAFE TO RE-RUN. Every step is guarded or naturally idempotent
-- (CREATE TABLE IF NOT EXISTS, INSERT IGNORE, information_schema checks
-- around the foreign keys), so an interrupted run can simply be repeated.
--
-- ORDER MATTERS. The table and its backfill must be in place *before* the new
-- payout code runs: with the table empty, every already-solved problem would
-- look unclaimed and pay a second time. Deploy is therefore:
--   1. run this file            (claims exist, old code still uses the lock)
--   2. deploy the application   (new code finds the claims and pays nobody twice)
-- Running it after the deploy, or deploying without running it, double-pays.

-- 1. The table. Charset and collation follow the rest of the schema so the
--    foreign keys match their parents.
CREATE TABLE IF NOT EXISTS `ProblemSolve` (
  `id`          VARCHAR(191) NOT NULL,
  `userId`      VARCHAR(191) NOT NULL,
  `problemId`   VARCHAR(191) NOT NULL,
  `submittedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ProblemSolve_userId_problemId_key` (`userId`, `problemId`),
  INDEX `ProblemSolve_problemId_fkey` (`problemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Backfill: one claim per (user, problem) that has ever been accepted,
--    stamped with the *earliest* accept — that is the solve the XP was paid
--    for. `INSERT IGNORE` makes re-running this file harmless.
--
--    The id is built from the pair rather than a random value so a re-run
--    cannot create a second row for the same solve even if the unique index
--    were somehow missing. 'ps-' plus a hash keeps it inside VARCHAR(191) and
--    visibly distinct from a cuid, which is honest: these rows were derived,
--    not written by a submission.
INSERT IGNORE INTO `ProblemSolve` (`id`, `userId`, `problemId`, `submittedAt`)
SELECT
  CONCAT('ps-', SHA2(CONCAT(s.`userId`, ':', s.`problemId`), 224)),
  s.`userId`,
  s.`problemId`,
  MIN(s.`submittedAt`)
FROM `Submission` s
JOIN `User`    u ON u.`id` = s.`userId`
JOIN `Problem` p ON p.`id` = s.`problemId`
WHERE s.`verdict` = 'ACCEPTED'
GROUP BY s.`userId`, s.`problemId`;

-- 3. The foreign keys, added after the backfill so a pre-existing orphan
--    surfaces as a failure here rather than silently dropping a claim.
--    Guarded so the file stays safe to re-run: MySQL has no
--    `ADD CONSTRAINT IF NOT EXISTS`.
SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProblemSolve'
     AND CONSTRAINT_NAME = 'ProblemSolve_userId_fkey'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE `ProblemSolve` ADD CONSTRAINT `ProblemSolve_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProblemSolve'
     AND CONSTRAINT_NAME = 'ProblemSolve_problemId_fkey'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE `ProblemSolve` ADD CONSTRAINT `ProblemSolve_problemId_fkey` FOREIGN KEY (`problemId`) REFERENCES `Problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verification — scratch/verify-solve-claims.mts runs all of these and refuses
-- to pass unless every "must be zero" is zero:
--   -- accepted pairs vs claims (must be equal)
--   SELECT (SELECT COUNT(*) FROM (SELECT userId, problemId FROM Submission
--            WHERE verdict='ACCEPTED' GROUP BY userId, problemId) a) AS acceptedPairs,
--          (SELECT COUNT(*) FROM ProblemSolve) AS claims;
--   -- missing claims (must be 0)
--   SELECT COUNT(*) FROM (SELECT s.userId, s.problemId FROM Submission s
--            LEFT JOIN ProblemSolve c ON c.userId = s.userId AND c.problemId = s.problemId
--            WHERE s.verdict='ACCEPTED' AND c.id IS NULL
--            GROUP BY s.userId, s.problemId) m;
--   -- claims with no accepted submission behind them (must be 0)
--   SELECT COUNT(*) FROM ProblemSolve c WHERE NOT EXISTS
--          (SELECT 1 FROM Submission s WHERE s.userId=c.userId AND s.problemId=c.problemId AND s.verdict='ACCEPTED');
--   -- a claim stamped later than the earliest accept (must be 0)
--   SELECT COUNT(*) FROM ProblemSolve c JOIN
--          (SELECT userId, problemId, MIN(submittedAt) f FROM Submission WHERE verdict='ACCEPTED'
--           GROUP BY userId, problemId) e
--       ON e.userId=c.userId AND e.problemId=c.problemId WHERE c.submittedAt <> e.f;
--
-- Rollback:
--   Revert the application first (it must go back to the locking payout before
--   the table disappears, or every accepted solve pays again).
--     1. deploy the previous build  (payout uses the User lock again)
--     2. only if the table must really go:
--          ALTER TABLE `ProblemSolve` DROP FOREIGN KEY `ProblemSolve_problemId_fkey`;
--          ALTER TABLE `ProblemSolve` DROP FOREIGN KEY `ProblemSolve_userId_fkey`;
--          DROP TABLE `ProblemSolve`;
--   Prefer leaving it in place: it is business history (who was paid for what,
--   and when), it costs one small row per solve, and the old payout path
--   ignores it entirely. Dropping it loses the record permanently.
