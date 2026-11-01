import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { chooseTheme, useTheme } from '../theme.ts';

/** Paper by day, blackboard by night: a crayon moon switches to chalk, a chalk sun switches back. */
export function ThemeButton({ className }: { className?: string }) {
  const theme = useTheme();
  const night = theme === 'dark';

  return (
    <button
      type="button"
      className={className}
      title={night ? 'Back to paper' : 'Blackboard (dark mode)'}
      onClick={(e) => {
        // the new theme spreads out from the button (from its middle when pressed with the keyboard)
        const r = e.currentTarget.getBoundingClientRect();
        const pointer = e.clientX !== 0 || e.clientY !== 0;
        chooseTheme(night ? 'light' : 'dark', {
          x: pointer ? e.clientX : r.left + r.width / 2,
          y: pointer ? e.clientY : r.top + r.height / 2,
        });
      }}
    >
      <span className="sr-only">{night ? 'Switch to paper (light mode)' : 'Switch to blackboard (dark mode)'}</span>
      <CrayonDoodle
        key={theme}
        name={night ? 'sun' : 'moon'}
        instant
        decorative
        color={night ? 'var(--crayon-yellow)' : 'var(--crayon-purple)'}
      />
    </button>
  );
}
