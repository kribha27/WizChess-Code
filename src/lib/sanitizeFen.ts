import { Chess } from "chess.js";
 
/**
 * Validate a FEN string by attempting to load it into a fresh chess.js instance.
 * Throws if the FEN is malformed. Returns the canonical FEN re-emitted by chess.js
 * (which strips invalid trailing data and normalizes whitespace).
 */
export function sanitizeFen(fen: string): string {
  if (typeof fen !== "string") throw new Error("FEN must be a string");
  const trimmed = fen.trim();
  // Reject anything that looks like newlines / control chars / shell metacharacters
  if (/[\r\n\t]/.test(trimmed)) throw new Error("FEN contains control chars");
  if (trimmed.length > 100) throw new Error("FEN too long");
  // chess.js validates structure on load
  const c = new Chess();
  try {
    c.load(trimmed);
  } catch (e) {
    throw new Error("Invalid FEN: " + (e instanceof Error ? e.message : String(e)), {
      cause: e,
    });
  }
  return c.fen();
}