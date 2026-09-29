/**
 * Who runs a spoken round, and in which language it opens.
 *
 * The candidate picks an interviewer in the lobby — a name, a manner and a
 * voice they have heard a sample of — and the conversation's opening
 * language. Both are chosen per round rather than stored on the saved setup:
 * the setup is *what* is asked, and the same setup is sat again with a
 * different voice.
 *
 * Ids are the product's own, not a vendor's voice names: the realtime
 * provider maps an interviewer to whichever voice it has
 * (`GEMINI_VOICES` in services/realtime-interview.ts), so a second provider
 * keeps every stored round meaningful. The frontend mirrors this table in
 * components/mock-interview/voice/interviewers.ts.
 */

export const INTERVIEWERS = [
  { id: "kate", name: "Kate", tone: "Firm" },
  { id: "parker", name: "Parker", tone: "Upbeat" },
  { id: "charles", name: "Charles", tone: "Informative" },
  { id: "ava", name: "Ava", tone: "Breezy" },
  { id: "finn", name: "Finn", tone: "Excitable" },
  { id: "leah", name: "Leah", tone: "Youthful" },
  { id: "owen", name: "Owen", tone: "Steady" },
  { id: "zoe", name: "Zoe", tone: "Bright" },
] as const;

export type Interviewer = (typeof INTERVIEWERS)[number];
export type InterviewerId = Interviewer["id"];

/**
 * The languages a round may open in. Only the opening: the brief still
 * follows the candidate into whichever of the three they actually speak.
 */
export const CONVERSATION_LANGUAGES = ["english", "hindi", "hinglish"] as const;
export type ConversationLanguage = (typeof CONVERSATION_LANGUAGES)[number];

/**
 * The interviewer an id names, or null for anything else: a round stored
 * before the choice, a client too old to send one, a tampered request. Null
 * is "no choice made", and such a round runs as every round did before —
 * the deployment's default voice (GEMINI_LIVE_VOICE, else Charon, which is
 * why the lobby's own default is Charles), and no name in the brief.
 */
export function interviewerFor(id: unknown): Interviewer | null {
  return INTERVIEWERS.find((interviewer) => interviewer.id === id) ?? null;
}

export function conversationLanguage(raw: unknown): ConversationLanguage {
  return (CONVERSATION_LANGUAGES as readonly unknown[]).includes(raw) ? (raw as ConversationLanguage) : "english";
}
