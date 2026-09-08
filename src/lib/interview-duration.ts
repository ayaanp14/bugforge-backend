/**
 * How long a spoken round runs, and roughly how much fits inside it.
 *
 * A written round is bounded by a question count; a spoken one is bounded by
 * the clock, because a conversation cannot be scheduled a question at a time —
 * one good answer and its follow-ups can eat five minutes, and cutting that
 * short to hit a quota is exactly the wrong trade. So the candidate picks a
 * length, the interviewer paces itself, and the number of questions asked is an
 * outcome rather than a setting.
 */

/** The lengths offered. Anything else is rejected rather than clamped. */
export const VOICE_DURATIONS = [10, 20, 30] as const;

export type VoiceDuration = (typeof VOICE_DURATIONS)[number];

const DEFAULT_DURATION: VoiceDuration = 20;

/** Validates a client-supplied length, falling back to the default. */
export function voiceDurationMinutes(raw: unknown): VoiceDuration {
  const value = typeof raw === "number" ? raw : Number(raw);
  return (VOICE_DURATIONS as readonly number[]).includes(value)
    ? (value as VoiceDuration)
    : DEFAULT_DURATION;
}

/**
 * A placeholder question count for a round that has not happened yet.
 *
 * Only used to keep `questionBudget` non-zero between /start and /complete —
 * the report reads it, and a zero there renders "0 questions" on a live round.
 * Once the round closes, the real count replaces it. Two and a half minutes per
 * thread is what the transcripts actually average, follow-ups included.
 */
export function estimatedQuestions(durationMinutes: number): number {
  return Math.max(2, Math.round(durationMinutes / 2.5));
}
