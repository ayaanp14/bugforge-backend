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
import { FIGURES as lldModellingRequirements } from "./lld/modelling-requirements.js";
import { FIGURES as lldLruCacheDesign } from "./lld/lru-cache-design.js";
import { FIGURES as lldParkingLotDesign } from "./lld/parking-lot-design.js";
import { FIGURES as lldVendingMachineDesign } from "./lld/vending-machine-design.js";
import { FIGURES as lldElevatorDesign } from "./lld/elevator-design.js";
import { FIGURES as lldTicketBookingDesign } from "./lld/ticket-booking-design.js";
import { FIGURES as lldExpenseSharingDesign } from "./lld/expense-sharing-design.js";
import { FIGURES as cpContestTemplateAndBudgets } from "./competitive-programming/contest-template-and-budgets.js";
import { FIGURES as cpPrefixSumsAndDifferenceArrays } from "./competitive-programming/prefix-sums-and-difference-arrays.js";
import { FIGURES as cpBitTricksForContests } from "./competitive-programming/bit-tricks-for-contests.js";
import { FIGURES as cpSearchingTheAnswerSpace } from "./competitive-programming/searching-the-answer-space.js";
import { FIGURES as cpExchangeArguments } from "./competitive-programming/exchange-arguments.js";
import { FIGURES as cpSieveAndModularArithmetic } from "./competitive-programming/sieve-and-modular-arithmetic.js";
import { FIGURES as cpDsuUnionBySize } from "./competitive-programming/dsu-union-by-size.js";
import { FIGURES as cpDijkstraAnd01Bfs } from "./competitive-programming/dijkstra-and-0-1-bfs.js";
import { FIGURES as cpKahnsAlgorithm } from "./competitive-programming/kahns-algorithm.js";
import { FIGURES as cpSegmentTreesAndFenwickTrees } from "./competitive-programming/segment-trees-and-fenwick-trees.js";
import { FIGURES as cpDpOptimisationTechniques } from "./competitive-programming/dp-optimisation-techniques.js";
import { FIGURES as cpKmpZFunctionAndHashing } from "./competitive-programming/kmp-z-function-and-hashing.js";

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
  // 2026-11-14: the Low-Level Design practice and Competitive Programming tracks (scripts/study-plans/lld, competitive-programming).
  lld: {
    "modelling-requirements": lldModellingRequirements,
    "lru-cache-design": lldLruCacheDesign,
    "parking-lot-design": lldParkingLotDesign,
    "vending-machine-design": lldVendingMachineDesign,
    "elevator-design": lldElevatorDesign,
    "ticket-booking-design": lldTicketBookingDesign,
    "expense-sharing-design": lldExpenseSharingDesign,
  },
  "competitive-programming": {
    "contest-template-and-budgets": cpContestTemplateAndBudgets,
    "prefix-sums-and-difference-arrays": cpPrefixSumsAndDifferenceArrays,
    "bit-tricks-for-contests": cpBitTricksForContests,
    "searching-the-answer-space": cpSearchingTheAnswerSpace,
    "exchange-arguments": cpExchangeArguments,
    "sieve-and-modular-arithmetic": cpSieveAndModularArithmetic,
    "dsu-union-by-size": cpDsuUnionBySize,
    "dijkstra-and-0-1-bfs": cpDijkstraAnd01Bfs,
    "kahns-algorithm": cpKahnsAlgorithm,
    "segment-trees-and-fenwick-trees": cpSegmentTreesAndFenwickTrees,
    "dp-optimisation-techniques": cpDpOptimisationTechniques,
    "kmp-z-function-and-hashing": cpKmpZFunctionAndHashing,
  },
};
