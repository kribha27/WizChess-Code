type Props = {
  count: number;
  total?: number;
};
 
export function FocusPoints({ count, total = 3 }: Props) {
  return (
    <div>
      <h3>Focus Points</h3>
      <div className="focus-row" aria-label={`${count} of ${total} focus points remaining`}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`focus-orb ${i < count ? "" : "spent"}`}
            aria-hidden
            title={i < count ? "Focus point" : "Spent"}
          >
            ✦
          </div>
        ))}
      </div>
    </div>
  );
}