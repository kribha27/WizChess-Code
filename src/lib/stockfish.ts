// Lightweight wrapper around Stockfish 18 (lite, single-threaded WASM) running in a Web Worker.
// The engine binary is served from /stockfish/stockfish.js + /stockfish/stockfish.wasm.
 
import { sanitizeFen } from "./sanitizeFen";
 
export type EngineMove = {
  from: string;
  to: string;
  promotion?: string;
};
 
// Stockfish "skill level" goes 0..20. We expose 8 difficulty levels.
const SKILL_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 3,
  3: 6,
  4: 9,
  5: 12,
  6: 15,
  7: 18,
  8: 20,
};
 
const MOVETIME_BY_LEVEL: Record<number, number> = {
  1: 120,
  2: 200,
  3: 300,
  4: 450,
  5: 700,
  6: 1000,
  7: 1400,
  8: 2000,
};
 
export class StockfishEngine {
  private worker: Worker;
  private ready = false;
  private readyResolve: (() => void) | null = null;
  private readyPromise: Promise<void>;
  private pendingResolve: ((mv: EngineMove | null) => void) | null = null;
 
  constructor() {
    // Use CDN for Stockfish to bypass missing local files and disk space issues
    const workerScript = `importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js');`;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.readyPromise = new Promise((res) => {
      this.readyResolve = res;
    });
 
    this.worker.onmessage = (ev: MessageEvent<string>) => {
      const line = typeof ev.data === "string" ? ev.data : "";
      if (!line) return;
      if (!this.ready && (line.includes("uciok") || line.includes("readyok"))) {
        this.ready = true;
        this.readyResolve?.();
      }
      if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const mv = parts[1];
        if (this.pendingResolve) {
          const r = this.pendingResolve;
          this.pendingResolve = null;
          if (!mv || mv === "(none)" || mv === "0000") {
            r(null);
          } else {
            r({
              from: mv.slice(0, 2),
              to: mv.slice(2, 4),
              promotion: mv.length > 4 ? mv.slice(4, 5) : undefined,
            });
          }
        }
      }
    };
 
    this.send("uci");
    this.send("isready");
  }
 
  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }
 
  async waitReady(): Promise<void> {
    if (this.ready) return;
    return this.readyPromise;
  }
 
  setLevel(level: number) {
    const skill = SKILL_BY_LEVEL[level] ?? 10;
    this.send(`setoption name Skill Level value ${skill}`);
  }
 
  newGame() {
    this.send("ucinewgame");
    this.send("isready");
  }
 
  /**
   * Ask Stockfish for the best move from the given FEN at the given difficulty level.
   */
  async getBestMove(fen: string, level: number): Promise<EngineMove | null> {
    await this.waitReady();
    const safe = sanitizeFen(fen);
    this.setLevel(level);
    const movetime = MOVETIME_BY_LEVEL[level] ?? 800;
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.send(`position fen ${safe}`);
      this.send(`go movetime ${movetime}`);
    });
  }
 
  destroy() {
    try {
      this.send("quit");
      this.worker.terminate();
    } catch {
      // ignore
    }
  }
}