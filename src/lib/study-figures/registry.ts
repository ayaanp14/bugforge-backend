import type { Walkthrough } from "../walkthroughs/core.js";
import { FIGURES as sqlWhatIsADatabase } from "./sql/what-is-a-database.js";
import { FIGURES as sqlHowAQueryRuns } from "./sql/how-a-query-runs.js";
import { FIGURES as sqlTheWhereClause } from "./sql/the-where-clause.js";
import { FIGURES as sqlDistinct } from "./sql/distinct.js";
import { FIGURES as sqlOrderBy } from "./sql/order-by.js";
import { FIGURES as sqlLimitAndOffset } from "./sql/limit-and-offset.js";
import { FIGURES as sqlNullAndThreeValuedLogic } from "./sql/null-and-three-valued-logic.js";
import { FIGURES as sqlGroupBy } from "./sql/group-by.js";
import { FIGURES as sqlHaving } from "./sql/having.js";
import { FIGURES as sqlInnerJoin } from "./sql/inner-join.js";
import { FIGURES as sqlLeftAndRightJoins } from "./sql/left-and-right-joins.js";
import { FIGURES as sqlFullAndCrossJoins } from "./sql/full-and-cross-joins.js";
import { FIGURES as sqlSelfJoins } from "./sql/self-joins.js";
import { FIGURES as sqlJoiningManyTables } from "./sql/joining-many-tables.js";
import { FIGURES as sqlSemiAndAntiJoins } from "./sql/semi-and-anti-joins.js";
import { FIGURES as sqlNotInAndNull } from "./sql/not-in-and-null.js";
import { FIGURES as sqlCorrelatedSubqueries } from "./sql/correlated-subqueries.js";
import { FIGURES as sqlUnionAndUnionAll } from "./sql/union-and-union-all.js";
import { FIGURES as sqlIntersectAndExcept } from "./sql/intersect-and-except.js";
import { FIGURES as sqlRecursiveCtes } from "./sql/recursive-ctes.js";
import { FIGURES as sqlOverAndPartitionBy } from "./sql/over-and-partition-by.js";
import { FIGURES as sqlRankingFunctions } from "./sql/ranking-functions.js";
import { FIGURES as sqlLagAndLead } from "./sql/lag-and-lead.js";
import { FIGURES as sqlRunningTotalsAndFrames } from "./sql/running-totals-and-frames.js";
import { FIGURES as sqlNormalization } from "./sql/normalization.js";
import { FIGURES as sqlHowIndexesWork } from "./sql/how-indexes-work.js";
import { FIGURES as sqlCompositeIndexes } from "./sql/composite-indexes.js";
import { FIGURES as sqlIsolationLevels } from "./sql/isolation-levels.js";
import { FIGURES as sqlLocksAndDeadlocks } from "./sql/locks-and-deadlocks.js";
import { FIGURES as sqlMvcc } from "./sql/mvcc.js";

type LessonFigures = Readonly<Record<string, () => Walkthrough>>;

/**
 * Every study-plan lesson's figures by track key, then lesson slug, then
 * figure name (one module per lesson, `<track>/<lesson slug>.ts` beside this
 * file exporting FIGURES — the roadmap lessons' convention). A lesson slug
 * is unique within its track (scripts/study-plans/dsl.ts validateTrack).
 */
export const STUDY_FIGURES: Readonly<Record<string, Readonly<Record<string, LessonFigures>>>> = {
  sql: {
    "what-is-a-database": sqlWhatIsADatabase,
    "how-a-query-runs": sqlHowAQueryRuns,
    "the-where-clause": sqlTheWhereClause,
    distinct: sqlDistinct,
    "order-by": sqlOrderBy,
    "limit-and-offset": sqlLimitAndOffset,
    "null-and-three-valued-logic": sqlNullAndThreeValuedLogic,
    "group-by": sqlGroupBy,
    having: sqlHaving,
    "inner-join": sqlInnerJoin,
    "left-and-right-joins": sqlLeftAndRightJoins,
    "full-and-cross-joins": sqlFullAndCrossJoins,
    "self-joins": sqlSelfJoins,
    "joining-many-tables": sqlJoiningManyTables,
    "semi-and-anti-joins": sqlSemiAndAntiJoins,
    "not-in-and-null": sqlNotInAndNull,
    "correlated-subqueries": sqlCorrelatedSubqueries,
    "union-and-union-all": sqlUnionAndUnionAll,
    "intersect-and-except": sqlIntersectAndExcept,
    "recursive-ctes": sqlRecursiveCtes,
    "over-and-partition-by": sqlOverAndPartitionBy,
    "ranking-functions": sqlRankingFunctions,
    "lag-and-lead": sqlLagAndLead,
    "running-totals-and-frames": sqlRunningTotalsAndFrames,
    normalization: sqlNormalization,
    "how-indexes-work": sqlHowIndexesWork,
    "composite-indexes": sqlCompositeIndexes,
    "isolation-levels": sqlIsolationLevels,
    "locks-and-deadlocks": sqlLocksAndDeadlocks,
    mvcc: sqlMvcc,
  },
};
