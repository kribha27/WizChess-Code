// src/api.ts
// Centralized API helper for WizChess frontend

// Use environment variable first, fallback to Railway URL
const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://wizchess-code-production.up.railway.app";

// Example: get AI advice for a chess position
export async function getWizAdvice(
  fen: string,
  lastMoves: string[],
  turn: string
) {
  const response = await fetch(`${API_URL}/api/wiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fen, lastMoves, turn }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.statusText}`);
  }

  return response.json();
}
