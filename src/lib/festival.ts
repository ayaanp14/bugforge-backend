/**
 * Diwali 2026, "Light seven diyas" (5–11 November 2026). The campaign itself —
 * the daily diyas, the notices, the home strip and the decorations — was
 * removed on 2026-11-14 (the owner's call). What members earned stays, as the
 * two `Honour` rows it wrote:
 *
 *   diwali_2026_diya → the festive avatar frame, worn for good since the
 *                      campaign ended (the SPA's lib/festival.ts)
 *   diwali_2026      → the limited-edition badge `festival-7` (lib/badges.ts)
 *
 * Neither kind is in lib/honours.ts HONOURS on purpose: an honour there plays
 * a celebration, wears the star and appears in the admin's grant list. No code
 * grants either kind any more. Mirrored by the SPA's lib/festival.ts.
 */

export const FESTIVAL_FRAME_KIND = "diwali_2026_diya";
export const FESTIVAL_BADGE_KIND = "diwali_2026";
