/** Questions offered on an empty sketchpad, so visitors know what the AI is for. */
export const STARTERS = ["What does Ali do?", "What's Ali's favourite project?", 'Has Ali used Docker?'];

/**
 * "Try asking": a few questions on an empty sheet. Picking one writes it on the sheet and asks it.
 */
export function Starters({ onPick, disabled }: { onPick: (question: string) => void; disabled?: boolean }) {
  return (
    <div className="sketchpad__starters">
      <p>Not sure what to ask? Try one:</p>
      <ul>
        {STARTERS.map((q) => (
          <li key={q}>
            <button type="button" disabled={disabled} onClick={() => onPick(q)}>
              {q}
            </button>
          </li>
        ))}
      </ul>
      <p className="sketchpad__starters-or">…or just start drawing.</p>
    </div>
  );
}
