/**
 * What a person is called when the product has to name them: the display
 * name they set, else their username, which every account has. Password
 * accounts are born without a name, and a pair room listed them as "(You)"
 * and "?" — the host could not tell who was in the room or whom the kick
 * button would kick (QA-009). The community and the nav already fall back
 * this way on the client; room payloads carry the name resolved.
 */
export function displayNameOf(user: { name?: string | null; username?: string | null } | null | undefined): string {
  return (user?.name || user?.username || "").trim() || "Anonymous";
}
