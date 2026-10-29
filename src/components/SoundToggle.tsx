import { useEffect, useState } from 'react';
import { playScribble, playTap, setSoundEnabled, soundEnabled } from '../sound/sfx.ts';
import './SoundToggle.css';

/** A small sound on/off switch in the corner, plus the click sounds it controls. */
export function SoundToggle() {
  const [on, setOn] = useState(soundEnabled);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest('a, button')) return;
      if (target.closest('.nav__link, .nav-sheet__link, .nav__logo')) playScribble();
      else playTap();
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
    if (!on) playTap(); // a little tap so you hear what you switched on (the click listener ran before this)
  };

  return (
    <button type="button" className="sound-toggle" aria-pressed={on} onClick={toggle}>
      <span aria-hidden="true">{on ? '🔊' : '🔇'}</span> sound {on ? 'on' : 'off'}
    </button>
  );
}
