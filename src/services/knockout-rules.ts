/**
 * The 1v1 knockout's rules that need no database: the bracket's shape and
 * seeding, where a winner goes next, how a match that runs out of time is
 * decided, and what each round is called. services/knockout.ts loads and
 * writes the rows; knockout-rules.test.ts pins these.
 */

/** Before the start: players confirm they are here; only they are seeded. */
export const CHECK_IN_MINUTES = 60;
/** Between a match being decided and the next one starting, to walk to the next room. */
export const MATCH_BREAK_SECONDS = 60;

/** The smallest power of two that holds every player (at least 2). */
export function bracketSize(players: number): number {
  let size = 2;
  while (size < players) size *= 2;
  return size;
}

export const roundsFor = (size: number) => Math.round(Math.log2(size));

/**
 * The standard seeding order: slot i of the first round holds seed order[i],
 * and neighbouring slots meet. For 8: 1 8 4 5 2 7 3 6 — so the top two seeds
 * can only meet in the final, and a missing seed (a bye) always faces the
 * seeds that earned one.
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export interface FirstRoundMatch<P> {
  position: number;
  a: { player: P; seed: number } | null;
  b: { player: P; seed: number } | null;
}

/**
 * Round one from the players in seed order (best first). A slot beyond the
 * field is a bye; with the field more than half the bracket, no match is two
 * byes.
 */
export function firstRound<P>(seeded: readonly P[]): FirstRoundMatch<P>[] {
  const size = bracketSize(seeded.length);
  const order = seedOrder(size);
  const slot = (seed: number) => (seed <= seeded.length ? { player: seeded[seed - 1]!, seed } : null);
  const matches: FirstRoundMatch<P>[] = [];
  for (let i = 0; i < size; i += 2) matches.push({ position: i / 2, a: slot(order[i]!), b: slot(order[i + 1]!) });
  return matches;
}

/** Where a match's winner plays next, or null after the final. */
export function nextSlot(round: number, position: number, totalRounds: number): { round: number; position: number; side: "a" | "b" } | null {
  if (round >= totalRounds) return null;
  return { round: round + 1, position: Math.floor(position / 2), side: position % 2 === 0 ? "a" : "b" };
}

/** "Final", "Semifinal", "Quarterfinal", "Round of 16". */
export function roundName(round: number, totalRounds: number): string {
  const left = totalRounds - round;
  if (left === 0) return "Final";
  if (left === 1) return "Semifinal";
  if (left === 2) return "Quarterfinal";
  return `Round of ${2 ** (left + 1)}`;
}

/** The problem a round is played on: the set in order, wrapping when rounds outnumber problems. */
export const problemForRound = <T>(problems: readonly T[], round: number): T | null => (problems.length ? problems[(round - 1) % problems.length]! : null);

export interface Side {
  seed: number;
  /** Best test cases passed so far, and when that best was first reached. */
  passed: number;
  bestAt: Date | null;
}

/**
 * A match whose time ran out with no accepted solution: most cases passed
 * wins, then whoever reached that score first, then the better seed. A
 * player who never submitted has passed nothing and loses to one who did —
 * a no-show is decided the same way, without a special case.
 */
export function timeoutWinner(a: Side, b: Side): "a" | "b" {
  if (a.passed !== b.passed) return a.passed > b.passed ? "a" : "b";
  if (a.bestAt && b.bestAt && a.bestAt.getTime() !== b.bestAt.getTime()) return a.bestAt < b.bestAt ? "a" : "b";
  if (a.bestAt && !b.bestAt) return "a";
  if (b.bestAt && !a.bestAt) return "b";
  return a.seed <= b.seed ? "a" : "b";
}

/**
 * How far a player got, for their profile: "Champion", "Runner-up",
 * "Semifinalist", "Quarterfinalist", "Round of 16".
 */
export function placementLabel(lastRound: number, wonLast: boolean, totalRounds: number): string {
  if (lastRound === totalRounds) return wonLast ? "Champion" : "Runner-up";
  if (lastRound === totalRounds - 1) return "Semifinalist";
  if (lastRound === totalRounds - 2) return "Quarterfinalist";
  return roundName(lastRound, totalRounds);
}
