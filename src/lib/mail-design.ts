/**
 * The design tokens the designed mails share — the welcome mail
 * (welcome-mail-copy.ts) and the tournament reminder
 * (tournament-reminder-mail.ts) — so both read as the product.
 *
 * Copied from frontend/src/lib/palette.ts (LIGHT, DARK, TEAL, ON_TEAL,
 * EDITOR_*): a mail cannot read CSS variables, so they are literal here;
 * change them there first. Why every style is inline and the layout is
 * tables is in welcome-mail-copy.ts's header.
 */

/** Where the mark and the fonts are fetched from, whatever site sent the mail. */
export const ASSET_ORIGIN = "https://codekairo.com";

export const L = {
  ground: "#F7F7F7",
  panel: "#FFFFFF",
  ink: "#111111",
  secondary: "#5F5F5F",
  muted: "#737373",
  border: "#E5E5E5",
  well: "#F4F4F4",
  accent: "#0164FD",
  highlight: "#074099",
};
export const TEAL_DEEP = "#074099";
export const ON_TEAL = { secondary: "rgba(255,255,255,0.78)", muted: "rgba(255,255,255,0.64)" };
export const CODE = {
  text: "#0C1C34",
  keyword: TEAL_DEEP,
  string: "#0357DA",
  number: "#0A4FB8",
  comment: "#5F6B7D",
  operator: "#3D4A5E",
  gutter: "#AFAFAF",
};

export const SANS = "Gilroy,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** The site's web fonts, for the clients that load them (Apple Mail, iOS); the rest use the stack. */
export const FONT_FACES = `@font-face{font-family:Gilroy;font-weight:400;font-style:normal;src:url(${ASSET_ORIGIN}/fonts/Gilroy-400.woff2) format("woff2")}
@font-face{font-family:Gilroy;font-weight:600;font-style:normal;src:url(${ASSET_ORIGIN}/fonts/Gilroy-600.woff2) format("woff2")}
@font-face{font-family:Gilroy;font-weight:700;font-style:normal;src:url(${ASSET_ORIGIN}/fonts/Gilroy-700.woff2) format("woff2")}
@font-face{font-family:'JetBrains Mono';font-weight:400 700;font-style:normal;src:url(${ASSET_ORIGIN}/fonts/JetBrainsMono.woff2) format("woff2")}`;

/** Invisible filler after a preheader, so the inbox preview stops at our sentence instead of running on into the body. */
export const PREHEADER_FILLER = "&#847;&zwnj;&nbsp;".repeat(40);
