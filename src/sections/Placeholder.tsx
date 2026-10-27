/** Temporary stand-in so the navbar has somewhere to scroll to. Replaced in Stages 4–5. */
export function Placeholder({ id, title, stage }: { id: string; title: string; stage: number }) {
  return (
    <section
      id={id}
      aria-label={title}
      style={{
        display: 'grid',
        placeContent: 'center',
        minHeight: '90vh',
        margin: '0 var(--gutter) 3rem',
        border: '2px dashed var(--ink-soft)',
        borderRadius: '18px 12px 20px 14px',
        textAlign: 'center',
        color: 'var(--ink-soft)',
      }}
    >
      <h2 style={{ margin: 0, fontWeight: 400, fontSize: '2.2rem' }}>{title}</h2>
      <p>coming in Stage {stage}</p>
    </section>
  );
}
