import { useEffect, useRef } from "react";
 
export type DialogueLine = {
  id: string;
  speaker: "wiz" | "user" | "system";
  text: string;
};
 
type Props = {
  lines: DialogueLine[];
  thinking?: boolean;
};
 
export function DialogueScroll({ lines, thinking }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [lines, thinking]);
 
  return (
    <div>
      <h3>Wiz's Counsel</h3>
      <div className="dialogue-scroll" ref={ref}>
        {lines.length === 0 && !thinking && (
          <div className="dialogue-line system">
            Greetings, apprentice. When the path clouds, consult Wiz.
          </div>
        )}
        {lines.map((l) => (
          <div key={l.id} className={`dialogue-line ${l.speaker}`}>
            {l.text}
          </div>
        ))}
        {thinking && (
          <div className="dialogue-line system">
            <em>Wiz peers into the mists…</em>
          </div>
        )}
      </div>
    </div>
  );
}