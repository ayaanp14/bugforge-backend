-- Performance indexes added 2026-09-10 (see prisma/schema.prisma comments).
-- Apply to production once with:  npx prisma db execute --file prisma/sql/2026-09-10-perf-indexes.sql
-- (or `npx prisma db push` from a shell whose DATABASE_URL points at production).
-- Every statement is an index add/replace; ADD INDEX is online DDL on InnoDB.

-- DropIndex
DROP INDEX `Duel_status_mode_kind_visibility_idx` ON `Duel`;

-- CreateIndex
CREATE INDEX `BugChallenge_isPublished_category_difficulty_idx` ON `BugChallenge`(`isPublished`, `category`, `difficulty`);

-- CreateIndex
CREATE INDEX `BugChallenge_isPublished_createdAt_idx` ON `BugChallenge`(`isPublished`, `createdAt`);

-- CreateIndex
CREATE INDEX `BugSubmission_userId_challengeId_submittedAt_idx` ON `BugSubmission`(`userId`, `challengeId`, `submittedAt`);

-- CreateIndex
CREATE INDEX `BugSubmission_userId_verdict_submittedAt_idx` ON `BugSubmission`(`userId`, `verdict`, `submittedAt`);

-- CreateIndex
CREATE INDEX `BugSubmission_verdict_submittedAt_idx` ON `BugSubmission`(`verdict`, `submittedAt`);

-- CreateIndex
CREATE INDEX `Duel_status_mode_kind_visibility_createdAt_idx` ON `Duel`(`status`, `mode`, `kind`, `visibility`, `createdAt`);

-- CreateIndex
CREATE INDEX `MockAttempt_userId_startedAt_idx` ON `MockAttempt`(`userId`, `startedAt`);

-- CreateIndex
CREATE INDEX `Notification_userId_type_idx` ON `Notification`(`userId`, `type`);

-- CreateIndex
CREATE INDEX `PairRoom_status_startedAt_idx` ON `PairRoom`(`status`, `startedAt`);

-- CreateIndex
CREATE INDEX `PairRoom_status_endedAt_idx` ON `PairRoom`(`status`, `endedAt`);

-- CreateIndex
CREATE INDEX `Submission_userId_problemId_submittedAt_idx` ON `Submission`(`userId`, `problemId`, `submittedAt`);

-- CreateIndex
CREATE INDEX `Submission_verdict_submittedAt_idx` ON `Submission`(`verdict`, `submittedAt`);

