-- TestCase: (problemId, orderIndex) -> (problemId, isHidden, orderIndex). See the
-- comment on the model in prisma/schema.prisma for the measurements.
--
-- APPLIED TO PRODUCTION 2026-10-10 (over SSM, before the schema commit
-- deployed): ADD took 120 s online on 8.77M rows; two-sum's visible-case read
-- went from 5,003 rows / 34.4 ms to 3 rows / 0.69 ms. Kept as the record and
-- for any other database (a re-run on this one fails harmlessly: duplicate key
-- name).
--
-- RUN THIS ON A DATABASE BEFORE THE COMMIT THAT CHANGES schema.prisma DEPLOYS:
--   npx prisma db execute --file prisma/sql/2026-10-10-testcase-visible-index.sql
-- (on the box: the same one-off Prisma container deploy.sh uses — deploy/README.md).
--
-- Why not let the deploy's `db push` do it: Prisma writes this change as
--   DROP FOREIGN KEY TestCase_problemId_fkey; DROP INDEX …; CREATE INDEX …
-- and re-adding a foreign key on a ~10M-row table is a table-copy rebuild
-- (~1.7 GB) under lock — and the diff Prisma 7 printed on 2026-10-10 did not
-- even re-add it. Done here instead, the new index is built online first and
-- the old one dropped after; MySQL allows that drop because the new index has
-- problemId leftmost and so still serves the foreign key, which is never
-- touched. Afterwards `db push` finds the index it expects (same name) and
-- does nothing to this table.
--
-- Cost: the build took 32 s on a local 10M-row copy, online (reads and writes
-- continue). Index size ~540 MB against ~465 MB for the one it replaces.
-- Reversible: swap the two column lists back in the same two statements.

ALTER TABLE `TestCase`
  ADD INDEX `TestCase_problemId_isHidden_orderIndex_idx` (`problemId`, `isHidden`, `orderIndex`),
  ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE `TestCase`
  DROP INDEX `TestCase_problemId_orderIndex_idx`,
  ALGORITHM=INPLACE, LOCK=NONE;
