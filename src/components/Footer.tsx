import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Ali Hussain · Karachi, Pakistan
      </p>
      <p className="footer__made">drawn with crayons &amp; TypeScript</p>
    </footer>
  );
}
