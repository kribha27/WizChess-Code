import { PIECE_GLYPH, PIECE_VALUE } from "../lib/pieces";
 
type Props = {
  // Array of captured piece codes (e.g. "wp", "bn") in order of capture.
  capturedByWhite: string[]; // black pieces captured by white player
  capturedByBlack: string[]; // white pieces captured by black opponent
};
 
function sortByValue(pieces: string[]): string[] {
  return [...pieces].sort(
    (a, b) => (PIECE_VALUE[b[1]] ?? 0) - (PIECE_VALUE[a[1]] ?? 0)
  );
}
 
export function CapturedPieces({ capturedByWhite, capturedByBlack }: Props) {
  return (
    <div>
      <h3>Captured</h3>
      <div style={{ marginBottom: 6, fontSize: 14, color: "#c9b78d" }}>By you</div>
      <div className="captured" aria-label="Pieces captured by white">
        {sortByValue(capturedByWhite).map((p, i) => (
          <span key={`w-${i}`}>{PIECE_GLYPH[p] ?? "?"}</span>
        ))}
        {capturedByWhite.length === 0 && (
          <span style={{ color: "#888", fontSize: 13 }}>none</span>
        )}
      </div>
      <div style={{ margin: "8px 0 6px", fontSize: 14, color: "#c9b78d" }}>By opponent</div>
      <div className="captured" aria-label="Pieces captured by black">
        {sortByValue(capturedByBlack).map((p, i) => (
          <span key={`b-${i}`}>{PIECE_GLYPH[p] ?? "?"}</span>
        ))}
        {capturedByBlack.length === 0 && (
          <span style={{ color: "#888", fontSize: 13 }}>none</span>
        )}
      </div>
    </div>
  );
}