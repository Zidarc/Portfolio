import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Ali Hussain · Karachi, Pakistan
      </p>
      <p className="footer__made">
        drawn with crayons &amp; TypeScript ·{' '}
        <a className="footer__link" href="/draw">
          grab a crayon on the sketchpad
        </a>
      </p>
    </footer>
  );
}
