import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import type { Chess, Square } from "chess.js";

type Props = {
  game: Chess;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
  onPieceDrop: (from: Square, to: Square) => boolean;
  flipped?: boolean;
};

const DARK = "#ae0001";
const LIGHT = "#5d5d5d";
const SELECTION = "#1a472a";
const HIGHLIGHT = "#ae0001";
const LAST_MOVE_TINT = "rgba(229, 139, 11, 0.45)";

export function Board({
  game, selected, legalTargets, lastMove,
  onSquareClick, onPieceDrop, flipped,
}: Props) {
  const fen = game.fen();

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = { boxShadow: `inset 0 0 0 9999px ${LAST_MOVE_TINT}` };
      styles[lastMove.to] = { boxShadow: `inset 0 0 0 9999px ${LAST_MOVE_TINT}` };
    }

    if (selected) {
      styles[selected] = {
        boxShadow: `inset 0 0 0 4px ${SELECTION}, inset 0 0 0 9999px rgba(26, 71, 42, 0.35)`,
      };
    }

    for (const t of legalTargets) {
      const piece = game.get(t);
      if (piece) {
        styles[t] = { ...(styles[t] ?? {}), boxShadow: `inset 0 0 0 4px ${HIGHLIGHT}` };
      } else {
        styles[t] = {
          ...(styles[t] ?? {}),
          background: `radial-gradient(circle, ${HIGHLIGHT} 16%, rgba(229,139,11,0.55) 22%, transparent 28%)`,
          animation: "magic-pulse 2s ease-in-out infinite",
        };
      }
    }

    if (game.inCheck()) {
      const turn = game.turn();
      const board = game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = board[r][c];
          if (sq && sq.type === "k" && sq.color === turn) {
            const file = "abcdefgh"[c];
            const rank = 8 - r;
            const id = `${file}${rank}`;
            styles[id] = {
              ...(styles[id] ?? {}),
              boxShadow: `inset 0 0 0 9999px rgba(174, 0, 1, 0.45), inset 0 0 0 4px ${HIGHLIGHT}`,
              animation: "magic-pulse 2s ease-in-out infinite",
            };
          }
        }
      }
    }

    return styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, legalTargets, lastMove, fen]);

  return (
    <div className="board-frame">
      <div className="board-inner">
        <Chessboard
          id="wizchess-board"
          position={fen}
          boardOrientation={flipped ? "black" : "white"}
          customDarkSquareStyle={{ backgroundColor: DARK }}
          customLightSquareStyle={{ backgroundColor: LIGHT }}
          customSquareStyles={squareStyles}
          animationDuration={220}
          arePiecesDraggable={true}
          showBoardNotation={true}
          onSquareClick={(square: Square) => onSquareClick(square)}
          onPieceDrop={(sourceSquare: Square, targetSquare: Square) => {
            return onPieceDrop(sourceSquare, targetSquare);
          }}
        />
      </div>
    </div>
  );
}