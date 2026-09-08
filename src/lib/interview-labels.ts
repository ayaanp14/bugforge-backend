/**
 * Turning the ids the database stores back into English.
 *
 * Configuration is stored as slugs (`frontend-engineer`, `api-design`) and the
 * model writes topic tags in whatever case it feels like. Both the report
 * charts and the spoken interviewer's brief need those as words a person would
 * say, so the one prettifier lives here rather than once per reader.
 */

const ACRONYMS = new Set([
  "dsa", "sql", "api", "css", "html", "http", "ui", "ux", "orm", "jwt",
  "cli", "cdn", "dom", "tcp", "ssr", "crud", "oop", "io", "rest", "grpc",
]);

/** Chart axes have finite room, and the model sometimes writes a whole sentence
 * where a topic tag belongs ("Implement Express endpoint with validation…"). */
const MAX_LABEL = 42;

export function prettyLabel(raw: string) {
  // Slugs come through as-is ("api-design", "node-express"); as labels they read
  // far better spaced, and it lets the acronym list see the parts separately.
  const text = raw.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!text) return "General";
  const words = text.split(" ");
  // Two or three words is a tag, and title case suits it. Anything longer is a
  // phrase, where title casing every word reads worse than leaving it alone.
  const cased =
    words.length <= 3
      ? words
          .map((word) =>
            ACRONYMS.has(word.toLowerCase())
              ? word.toUpperCase()
              : word.charAt(0).toUpperCase() + word.slice(1),
          )
          .join(" ")
      : text.charAt(0).toUpperCase() + text.slice(1);
  return cased.length > MAX_LABEL ? `${cased.slice(0, MAX_LABEL - 1).trimEnd()}…` : cased;
}
