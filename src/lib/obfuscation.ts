/**
 * Simple obfuscation for invite and recovery codes.
 * This makes them look like hashes in the database while remaining reversible for the frontend.
 */

const PREFIX = "pf_";

export function encodeCode(plain: string | null): string | null {
  if (!plain) return null;
  // Simple Base64 encoding with a custom prefix
  const encoded = Buffer.from(plain).toString("base64");
  return `${PREFIX}${encoded}`;
}

export function decodeCode(encoded: string | null): string | null {
  if (!encoded) return null;
  if (!encoded.startsWith(PREFIX)) return encoded; // Legacy plain text
  
  try {
    const pure = encoded.substring(PREFIX.length);
    return Buffer.from(pure, "base64").toString("utf-8");
  } catch (err) {
    console.error("Failed to decode code:", err);
    return encoded;
  }
}
