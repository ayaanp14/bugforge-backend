-- Dead objects, dropped 2026-10-10 (perf/schema audit). Every one re-checked
-- by search across backend/src, backend/scripts, frontend/src and mobile/src,
-- and production's contents read first (all empty or unused):
--
--   Session, VerificationToken   NextAuth-era tables; auth is JWT + RevokedSession.
--                                0 rows in production. No code reads them.
--   Account.access_token, refresh_token, id_token, expires_at
--                                Only ever written as null (routes/oauth.ts) —
--                                0 rows held a token. Dropping them means no
--                                provider token can ever be stored again.
--   Account.token_type, scope, session_state
--                                Never read or written by the API (6 rows held
--                                leftover metadata nothing reads).
--   MockInterviewSession.gtwyThreadId   Commented "dead" in the schema; never set.
--   UserStats.pairSessions       Never written (always 0); only the export read it.
--   Indexes: Duel[createdBy], SqlSolve[slug], PostReport[createdAt],
--            RoadmapStageProblem[stageId, problemId] unique (problemId is unique
--            on its own; [stageId, position] serves the stageId foreign key).
--   JobRun[job, startedAt] -> [startedAt]: the one list query sorts by
--            startedAt with no job filter.
--
-- RUN BEFORE THE COMMIT THAT CHANGES schema.prisma DEPLOYS, after a backup:
--   the deploy's `db push` refuses column and table drops (no --accept-data-
--   loss, by design), and Prisma's own form of the RoadmapStageProblem change
--   drops the stageId foreign key without re-adding it (seen in its diff on
--   2026-10-10, as with TestCase). Done here, no foreign key is touched; the
--   index drops MySQL allows because another index still serves each FK.
-- Every table involved has at most a few hundred rows: each statement is
-- instant. (PollVote[postId], a prefix of its own unique, was left: Prisma
-- treats it as the postId foreign key's index and would put it back.)
-- Not reversible without the backup for the dropped data (there was
-- none of value); the indexes can be re-created from the old schema.

DROP INDEX `Duel_createdBy_idx` ON `Duel`;
DROP INDEX `SqlSolve_slug_idx` ON `SqlSolve`;
DROP INDEX `PostReport_createdAt_idx` ON `PostReport`;
ALTER TABLE `RoadmapStageProblem` DROP INDEX `RoadmapStageProblem_stageId_problemId_key`;
CREATE INDEX `JobRun_startedAt_idx` ON `JobRun`(`startedAt`);
DROP INDEX `JobRun_job_startedAt_idx` ON `JobRun`;

ALTER TABLE `Account`
  DROP COLUMN `access_token`,
  DROP COLUMN `refresh_token`,
  DROP COLUMN `id_token`,
  DROP COLUMN `expires_at`,
  DROP COLUMN `token_type`,
  DROP COLUMN `scope`,
  DROP COLUMN `session_state`;
ALTER TABLE `MockInterviewSession` DROP COLUMN `gtwyThreadId`;
ALTER TABLE `UserStats` DROP COLUMN `pairSessions`;

DROP TABLE `Session`;
DROP TABLE `VerificationToken`;
