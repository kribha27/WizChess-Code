// Consult Wiz: calls a small backend proxy that talks to Gemini 2.5 Flash.
// Falls back to a themed offline message if no backend URL is configured or the request fails.
 
import { sanitizeFen } from "./sanitizeFen";
 
const WIZ_API_URL = (import.meta.env.VITE_WIZ_API_URL as string | undefined) ?? "";
 
export type WizContext = {
  fen: string;
  lastMoves: string[]; // SAN strings, oldest -> newest, length up to 3
  turn: "w" | "b";
};
 
const OFFLINE_FALLBACKS = [
  "Mmm. The board hums with possibility, but my crystal ball is dim today. Trust your instincts — guard the centre, keep your king in his castle, and let your knights dance.",
  "Ahh, the air is thick with strategy. Without my orb I cannot read the runes precisely, yet I feel a coiled threat near your king. Tighten your defences before you strike.",
  "The wind whispers, but does not speak plainly. Look to your pawns, dear apprentice — they are the foundation of every grand spell. Keep them in harmony.",
];
 
function offlineFallback(): string {
  return OFFLINE_FALLBACKS[Math.floor(Math.random() * OFFLINE_FALLBACKS.length)];
}
 
/**
 * Strip any algebraic-notation-shaped tokens that may have slipped past the model
 * (defence-in-depth — the system prompt also forbids them).
 */
export function stripCoordinates(text: string): string {
  return text
    // Square names like e4, Nf3, Bxe5, O-O, O-O-O, e8=Q
    .replace(/\b(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b/g, "your move")
    // Stray file letters in lists like "a-h"
    .replace(/\b[a-h]\s*-\s*[a-h]\b/g, "the board")
    // Collapse any double whitespace
    .replace(/\s{2,}/g, " ")
    .trim();
}
 
export async function consultWiz(ctx: WizContext): Promise<string> {
  // Sanitize FEN first
  let safeFen: string;
  try {
    safeFen = sanitizeFen(ctx.fen);
  } catch {
    return "The vision shimmers and breaks — the board itself is unclear to me. Take a breath, apprentice.";
  }
 
  if (!WIZ_API_URL) {
    return offlineFallback();
  }
 
  try {
    const res = await fetch(`${WIZ_API_URL.replace(/\/$/, "")}/api/wiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen: safeFen,
        lastMoves: ctx.lastMoves.slice(-3),
        turn: ctx.turn,
      }),
    });
    if (!res.ok) {
      return offlineFallback();
    }
    const data = (await res.json()) as { advice?: string };
    if (!data.advice) return offlineFallback();
    return stripCoordinates(data.advice);
  } catch {
    return offlineFallback();
  }
}