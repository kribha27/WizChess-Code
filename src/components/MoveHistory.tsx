type Props = {
  sanHistory: string[];
};
 
export function MoveHistory({ sanHistory }: Props) {
  const rows: { num: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      w: sanHistory[i],
      b: sanHistory[i + 1],
    });
  }
  return (
    <div>
      <h3>Move History</h3>
      <div className="history" aria-label="Move history">
        {rows.length === 0 && (
          <div style={{ color: "rgba(74,4,4,0.5)", fontStyle: "italic" }}>
            No moves yet.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.num} className="history-row">
            <span className="num">{r.num}.</span>
            <span>{r.w ?? ""}</span>
            <span>{r.b ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}