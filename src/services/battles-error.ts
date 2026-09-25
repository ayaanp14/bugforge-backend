/**
 * A refusal with the HTTP status to answer it with — every Battles service
 * throws these and routes/battles.ts turns them into `{ error }`. Its own
 * module so battles.ts, contest.ts and knockout.ts can all use it without
 * importing each other in a circle.
 */
export class BattlesError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
