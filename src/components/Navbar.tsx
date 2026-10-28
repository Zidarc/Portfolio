import { useEffect, useRef, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useActiveSection } from '../hooks/useActiveSection.ts';
import './Navbar.css';

const LINKS = [
  { id: 'home', label: 'Home', colour: 'red' },
  { id: 'about', label: 'About', colour: 'blue' },
  { id: 'roles', label: 'Roles', colour: 'red' },
  { id: 'skills', label: 'Skills', colour: 'green' },
  { id: 'projects', label: 'Projects', colour: 'orange' },
  { id: 'contact', label: 'Contact', colour: 'purple' },
] as const;

type LinkId = (typeof LINKS)[number]['id'];
const IDS = LINKS.map((l) => l.id);

export function Navbar() {
  const active = useActiveSection(IDS) as LinkId;
  const [hovered, setHovered] = useState<LinkId | null>(null);
  /** Bumping an id's counter remounts its arrow, so every reveal is a freshly drawn one. */
  const [drawCount, setDrawCount] = useState<Partial<Record<LinkId, number>>>({});
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpenCount, setMenuOpenCount] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const redraw = (id: LinkId) => setDrawCount((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  useEffect(() => redraw(active), [active]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // mobile sheet: lock page scroll, close on Escape, move focus in and back out
  useEffect(() => {
    if (!menuOpen) return;
    const toggle = toggleRef.current;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector('a')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [menuOpen]);

  const openMenu = () => {
    setMenuOpenCount((n) => n + 1);
    setMenuOpen(true);
  };

  const showArrow = (id: LinkId) => hovered === id || active === id;
  const hoverProps = (id: LinkId) => ({
    onMouseEnter: () => {
      setHovered(id);
      if (id !== hovered) redraw(id);
    },
    onMouseLeave: () => setHovered(null),
    onFocus: () => {
      setHovered(id);
      if (id !== hovered) redraw(id);
    },
    onBlur: () => setHovered(null),
  });

  return (
    <>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <a href="#home" className="nav__logo">
            <span className="sr-only">Ali Hussain, back to top</span>
            <CrayonText text="AH" instant decorative capHeight={24} weight={0.13} color="var(--crayon-red)" />
          </a>

          <nav aria-label="Main">
            <ul className="nav__list">
              {LINKS.map(({ id, label, colour }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="nav__link"
                    aria-current={active === id ? 'location' : undefined}
                    {...hoverProps(id)}
                  >
                    <span className={`nav__arrow ${showArrow(id) ? 'is-shown' : ''}`}>
                      {drawCount[id] !== undefined && (
                        <CrayonDoodle
                          key={drawCount[id]}
                          name="arrow"
                          tempo={2.2}
                          decorative
                          color={`var(--crayon-${colour})`}
                        />
                      )}
                    </span>
                    <span className="sr-only">{label}</span>
                    <CrayonText
                      text={label}
                      instant
                      decorative
                      capHeight={18}
                      weight={0.12}
                      color={active === id ? `var(--crayon-${colour})` : 'var(--crayon-graphite)'}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="nav__toggle"
            aria-expanded={menuOpen}
            aria-controls="nav-sheet"
            onClick={openMenu}
          >
            <span className="sr-only">Open menu</span>
            <CrayonDoodle name="menu" instant decorative weight={0.15} color="var(--crayon-graphite)" />
          </button>
        </div>

        <div className="nav__underline" aria-hidden="true">
          {scrolled && <CrayonDoodle name="underline" weight={0.035} tempo={1.4} decorative color="var(--crayon-graphite)" />}
        </div>
      </header>

      {menuOpen && (
        <div
          ref={sheetRef}
          id="nav-sheet"
          className="nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          key={menuOpenCount}
        >
          <button type="button" className="nav-sheet__close" onClick={() => setMenuOpen(false)}>
            <span className="sr-only">Close menu</span>
            <CrayonDoodle name="cross" tempo={2} decorative color="var(--crayon-graphite)" />
          </button>
          <ul className="nav-sheet__list">
            {LINKS.map(({ id, label, colour }, i) => (
              <li key={id}>
                <a href={`#${id}`} className="nav-sheet__link" onClick={() => setMenuOpen(false)}>
                  <span className="nav-sheet__arrow">
                    <CrayonDoodle name="arrow" tempo={2} delay={150 + i * 260} decorative color={`var(--crayon-${colour})`} />
                  </span>
                  <span className="sr-only">{label}</span>
                  <CrayonText
                    text={label}
                    instant
                    decorative
                    capHeight={30}
                    weight={0.11}
                    color={active === id ? `var(--crayon-${colour})` : 'var(--crayon-graphite)'}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
