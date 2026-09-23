-- MockAttempt.activeKey — 2026-09-24
--
-- Enforces "one sitting in progress per candidate per test" in the database,
-- replacing a `SELECT id FROM User ... FOR UPDATE` that held a per-user mutex
-- across three round trips inside POST /api/tests/:slug/start.
--
-- MySQL has no partial unique indexes, so the condition rides in the value:
-- a live attempt stores "<userId>:<testId>", a closed one stores NULL, and
-- NULLs do not collide in a unique index.
--
-- Apply with:
--   npx prisma db execute --file prisma/sql/2026-09-24-mock-attempt-active-key.sql
-- or, against production:
--   node scripts/prisma-prod.mjs db execute --file prisma/sql/2026-09-24-mock-attempt-active-key.sql
--
-- SAFE TO RE-RUN. Every step checks whether it has already been applied, so an
-- interrupted run can simply be repeated: whatever landed is skipped and the
-- rest continues. MySQL has no `ADD COLUMN IF NOT EXISTS` (that is MariaDB),
-- hence the information_schema guards.
--
-- ORDER: run this BEFORE deploying the application build that writes
-- `activeKey`. With the column absent, the new code's insert fails and every
-- test start 500s. The reverse is harmless — with the column present and the
-- old build running, nothing ever writes it, every row stays NULL, the unique
-- index never trips and the old lock keeps enforcing the rule.

-- 1. The column. Nullable, so adding it cannot fail on existing rows.
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MockAttempt' AND COLUMN_NAME = 'activeKey'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE `MockAttempt` ADD COLUMN `activeKey` VARCHAR(80) NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Backfill the sittings that are live right now.
--
-- If a candidate somehow has two in-progress attempts at the same test — the
-- race this constraint is being added to prevent — only the newest keeps the
-- key. The older ones stay NULL: they are already unreachable (the resume
-- lookup takes the newest), and blocking the migration over them would leave
-- the rule unenforced instead.
--
-- Idempotent on its own: re-running writes the same value to the same rows.
UPDATE `MockAttempt` m
JOIN (
  SELECT `userId`, `testId`, MAX(`startedAt`) AS newest
  FROM `MockAttempt`
  WHERE `status` = 'in-progress'
  GROUP BY `userId`, `testId`
) live
  ON live.`userId` = m.`userId`
 AND live.`testId` = m.`testId`
 AND live.newest   = m.`startedAt`
SET m.`activeKey` = CONCAT(m.`userId`, ':', m.`testId`)
WHERE m.`status` = 'in-progress';

-- 3. The constraint itself.
SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MockAttempt'
     AND INDEX_NAME = 'MockAttempt_activeKey_key'
);
SET @sql := IF(@has_idx = 0,
  'CREATE UNIQUE INDEX `MockAttempt_activeKey_key` ON `MockAttempt`(`activeKey`)',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verification (expect 0 from each) — scratch/verify-mock-active-key.mts runs
-- these and exits non-zero if anything is wrong:
--   -- a live attempt with no key, or a closed one still holding a key
--   SELECT COUNT(*) FROM `MockAttempt`
--    WHERE (`status` = 'in-progress' AND `activeKey` IS NULL)
--       OR (`status` <> 'in-progress' AND `activeKey` IS NOT NULL);
--   -- two live sittings for the same candidate and test
--   SELECT COUNT(*) FROM (SELECT `userId`, `testId` FROM `MockAttempt`
--    WHERE `status` = 'in-progress' GROUP BY `userId`, `testId` HAVING COUNT(*) > 1) d;
--   -- a key that does not match its own row
--   SELECT COUNT(*) FROM `MockAttempt`
--    WHERE `activeKey` IS NOT NULL AND `activeKey` <> CONCAT(`userId`, ':', `testId`);
--
-- ROLLBACK — application first, schema second:
--   1. deploy the previous build (it never writes `activeKey`; the old
--      User-row lock enforces the rule again)
--   2. only then, if the column must really go:
--        DROP INDEX `MockAttempt_activeKey_key` ON `MockAttempt`;
--        ALTER TABLE `MockAttempt` DROP COLUMN `activeKey`;
--   Dropping the index while the new build is running is the dangerous order:
--   the insert would stop colliding and a candidate could open two sittings at
--   the same test. Leaving the column in place costs nothing.
