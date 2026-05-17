import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Board } from "./components/Board";
import { FocusPoints } from "./components/FocusPoints";
import { CapturedPieces } from "./components/CapturedPieces";
import { MoveHistory } from "./components/MoveHistory";
import { DialogueScroll, type DialogueLine } from "./components/DialogueScroll";
import { StockfishEngine } from "./lib/stockfish";
import { consultWiz } from "./lib/wiz";

const STARTING_FOCUS = 3;

type GameStatus =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: "white" | "black" }
  | { kind: "stalemate" }
  | { kind: "draw"; reason: string };

function detectStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) {
    return { kind: "checkmate", winner: game.turn() === "w" ? "black" : "white" };
  }
  if (game.isStalemate()) return { kind: "stalemate" };
  if (game.isThreefoldRepetition()) return { kind: "draw", reason: "Threefold repetition" };
  if (game.isInsufficientMaterial()) return { kind: "draw", reason: "Insufficient material" };
  // chess.js v1 exposes a 50-move helper via isDraw + halfmove counter; fall back to fen.
  const halfmoves = parseInt(game.fen().split(" ")[4] ?? "0", 10);
  if (halfmoves >= 100) return { kind: "draw", reason: "Fifty-move rule" };
  if (game.isDraw()) return { kind: "draw", reason: "Draw" };
  return { kind: "playing" };
}

function announcementText(status: GameStatus): string | null {
  switch (status.kind) {
    case "playing":
      return null;
    case "checkmate":
      return status.winner === "white"
        ? "Checkmate! Victory is yours."
        : "Checkmate! The dark wizard prevails.";
    case "stalemate":
      return "Stalemate — the spell unravels.";
    case "draw":
      return `Draw — ${status.reason}.`;
  }
}

export default function App() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [focus, setFocus] = useState(STARTING_FOCUS);
  const [difficulty, setDifficulty] = useState(3);
  const [thinking, setThinking] = useState(false);
  const [wizThinking, setWizThinking] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [fading, setFading] = useState(false);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const engineRef = useRef<StockfishEngine | null>(null);

  // Initialise the engine once. The worker keeps running until the page unloads.
  useEffect(() => {
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine.waitReady().then(() => {
      engine.newGame();
      engine.setLevel(difficulty);
    });
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep engine difficulty in sync.
  useEffect(() => {
    engineRef.current?.setLevel(difficulty);
  }, [difficulty]);

  const status = useMemo(() => detectStatus(game), [game]);
  const announcement = announcementText(status);
  const isHumanTurn = game.turn() === "w" && status.kind === "playing";
  const sanHistory = game.history();

  const cloneAfter = useCallback((mutator: (c: Chess) => boolean): Chess | null => {
    const next = new Chess(game.fen());
    // Reapply history so chess.js can detect threefold repetition.
    const historyVerbose = game.history({ verbose: true });
    next.reset();
    for (const m of historyVerbose) {
      next.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    const ok = mutator(next);
    if (!ok) return null;
    return next;
  }, [game]);

  const tryMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (!isHumanTurn || thinking) return false;
      let captured: { type: string; color: "w" | "b" } | null = null;
      const next = cloneAfter((c) => {
        try {
          const mv = c.move({ from, to, promotion: "q" });
          if (!mv) return false;
          if (mv.captured) {
            captured = { type: mv.captured, color: mv.color === "w" ? "b" : "w" };
          }
          return true;
        } catch {
          return false;
        }
      });
      if (!next) return false;
      setGame(next);
      setSelected(null);
      setLegalTargets([]);
      setLastMove({ from, to });
      if (captured) {
        const c = captured as { type: string; color: "w" | "b" };
        const code = `${c.color}${c.type}`;
        setCapturedByWhite((p) => [...p, code]);
      }
      return true;
    },
    [isHumanTurn, thinking, cloneAfter]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || thinking) return;
      // If a square with a target dot is clicked, treat it as a move.
      if (selected && legalTargets.includes(square)) {
        tryMove(selected, square);
        return;
      }
      const piece = game.get(square);
      if (piece && piece.color === "w") {
        const moves = game.moves({ square, verbose: true }) as { to: Square }[];
        setSelected(square);
        setLegalTargets(moves.map((m) => m.to));
        return;
      }
      // Click empty / opponent piece with no selection → clear.
      setSelected(null);
      setLegalTargets([]);
    },
    [game, selected, legalTargets, isHumanTurn, thinking, tryMove]
  );

  // Engine reply when it's black's turn.
  useEffect(() => {
    if (status.kind !== "playing") return;
    if (game.turn() !== "b") return;
    const engine = engineRef.current;
    if (!engine) return;
    setThinking(true);
    let cancelled = false;
    (async () => {
      try {
        const mv = await engine.getBestMove(game.fen(), difficulty);
        if (cancelled || !mv) return;
        let captured: { type: string; color: "w" | "b" } | null = null;
        const next = cloneAfter((c) => {
          try {
            const m = c.move({
              from: mv.from,
              to: mv.to,
              promotion: mv.promotion ?? "q",
            });
            if (!m) return false;
            if (m.captured) {
              captured = { type: m.captured, color: m.color === "w" ? "b" : "w" };
            }
            return true;
          } catch {
            return false;
          }
        });
        if (!next) return;
        setGame(next);
        setLastMove({ from: mv.from as Square, to: mv.to as Square });
        if (captured) {
          const c = captured as { type: string; color: "w" | "b" };
          const code = `${c.color}${c.type}`;
          setCapturedByBlack((p) => [...p, code]);
        }
      } finally {
        if (!cancelled) setThinking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game, status, difficulty, cloneAfter]);

  const handleConsultWiz = useCallback(async () => {
    if (focus <= 0 || wizThinking || status.kind !== "playing") return;
    setWizThinking(true);
    setDialogue((d) => [
      ...d,
      { id: `u-${Date.now()}`, speaker: "user", text: "*You consult Wiz.*" },
    ]);
    setFocus((f) => Math.max(0, f - 1));
    try {
      const advice = await consultWiz({
        fen: game.fen(),
        lastMoves: sanHistory.slice(-3),
        turn: game.turn() as "w" | "b",
      });
      setDialogue((d) => [
        ...d,
        { id: `w-${Date.now()}`, speaker: "wiz", text: advice },
      ]);
    } catch {
      setDialogue((d) => [
        ...d,
        {
          id: `w-${Date.now()}`,
          speaker: "wiz",
          text:
            "The mists are thick today, apprentice. Trust your study and play with care.",
        },
      ]);
    } finally {
      setWizThinking(false);
    }
  }, [focus, wizThinking, status, game, sanHistory]);

  // Surface an exhaustion message the first time the user clicks at 0 focus.
  const handleConsultClick = useCallback(() => {
    if (focus <= 0) {
      setDialogue((d) => [
        ...d,
        {
          id: `s-${Date.now()}`,
          speaker: "system",
          text:
            "Your focus is spent — the well is dry. Finish this match on your own wits, brave one.",
        },
      ]);
      return;
    }
    void handleConsultWiz();
  }, [focus, handleConsultWiz]);

  const handleRewind = useCallback(() => {
    if (focus <= 0) {
      setDialogue((d) => [
        ...d,
        {
          id: `s-${Date.now()}`,
          speaker: "system",
          text: "You lack the focus to bend time. Play on.",
        },
      ]);
      return;
    }
    if (sanHistory.length < 2) return;
    if (thinking) return;
    setFocus((f) => Math.max(0, f - 1));
    const next = new Chess();
    const verbose = game.history({ verbose: true });
    // Undo two plies (opponent + player) so it's the human's turn again.
    const keep = verbose.slice(0, Math.max(0, verbose.length - 2));
    for (const m of keep) {
      next.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    setGame(next);
    setSelected(null);
    setLegalTargets([]);
    setLastMove(
      keep.length > 0
        ? { from: keep[keep.length - 1].from as Square, to: keep[keep.length - 1].to as Square }
        : null
    );
    // Recompute captures from scratch to keep them consistent.
    const newCapW: string[] = [];
    const newCapB: string[] = [];
    for (const m of keep) {
      if (m.captured) {
        const code = `${m.color === "w" ? "b" : "w"}${m.captured}`;
        if (m.color === "w") newCapW.push(code);
        else newCapB.push(code);
      }
    }
    setCapturedByWhite(newCapW);
    setCapturedByBlack(newCapB);
    setDialogue((d) => [
      ...d,
      {
        id: `s-${Date.now()}`,
        speaker: "system",
        text: "*Time bends backward — the last exchange is undone.*",
      },
    ]);
  }, [focus, sanHistory, thinking, game]);

  const handleNewGame = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      const next = new Chess();
      setGame(next);
      setSelected(null);
      setLegalTargets([]);
      setFocus(STARTING_FOCUS);
      setCapturedByWhite([]);
      setCapturedByBlack([]);
      setLastMove(null);
      setDialogue([]);
      engineRef.current?.newGame();
      engineRef.current?.setLevel(difficulty);
      setTimeout(() => setFading(false), 60);
    }, 380);
  }, [difficulty]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="brand">WizChess</div>
          <div className="tagline">Where every move is a spell.</div>
        </div>
        <div className="controls">
          <label htmlFor="difficulty">Opponent</label>
          <select
            id="difficulty"
            className="btn btn-secondary"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          >
            <option value={1}>1 – First-Year</option>
            <option value={2}>2 – Second-Year</option>
            <option value={3}>3 – Third-Year</option>
            <option value={4}>4 – Fourth-Year</option>
            <option value={5}>5 – O.W.L. Candidate</option>
            <option value={6}>6 – N.E.W.T. Candidate</option>
            <option value={7}>7 – Auror</option>
            <option value={8}>8 – Archmage</option>
          </select>
          <button className="btn btn-ghost" onClick={handleNewGame}>
            New Game
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="board-column">
          {announcement && <div className="announcement pulse">{announcement}</div>}
          <Board
            game={game}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onPieceDrop={tryMove}
          />
          <div className="controls">
            <button
              className="btn desktop-consult"
              disabled={focus <= 0 || wizThinking || status.kind !== "playing"}
              onClick={handleConsultClick}
            >
              Consult Wiz
            </button>
            <button
              className="btn btn-ghost"
              disabled={sanHistory.length < 2 || focus <= 0 || thinking}
              onClick={handleRewind}
              title="Cost: 1 Focus Point"
            >
              Rewind Time
            </button>
            <span style={{ color: "#c9b78d", fontSize: 14 }}>
              {thinking ? "The dark wizard ponders…" : ""}
            </span>
          </div>

          <div className="panel" style={{ width: "100%", maxWidth: 640 }}>
            <DialogueScroll lines={dialogue} thinking={wizThinking} />
          </div>
        </section>

        <aside className="sidebar">
          <div className="panel-dark">
            <FocusPoints count={focus} />
          </div>
          <div className="panel-dark">
            <CapturedPieces
              capturedByWhite={capturedByWhite}
              capturedByBlack={capturedByBlack}
            />
          </div>
          <div className="panel-dark">
            <MoveHistory sanHistory={sanHistory} />
          </div>
        </aside>
      </main>

      <button
        className="btn floating-consult"
        disabled={focus <= 0 || wizThinking || status.kind !== "playing"}
        onClick={handleConsultClick}
      >
        ✦ Consult Wiz
      </button>

      <div className={`fade-overlay ${fading ? "active" : ""}`} aria-hidden />
    </div>
  );
}