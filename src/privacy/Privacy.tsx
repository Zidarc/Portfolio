import { CrayonText } from '../crayon/CrayonText.tsx';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import './Privacy.css';

/** When this page last changed (shown on it). */
const UPDATED = '7 November 2026';

/**
 * /privacy: what the site collects and what it doesn't. Kept in plain words, and kept true: if the
 * contact form, the sketchpad's AI or what's stored in the browser changes, change this too.
 */
export function Privacy() {
  const narrow = useMediaQuery('(max-width: 600px)');

  return (
    <main className="privacy">
      <a className="privacy__back" href="/">
        ← back to Ali's site
      </a>
      <h1 className="privacy__title">
        <span className="sr-only">Privacy</span>
        <CrayonText text="Privacy" decorative capHeight={narrow ? 44 : 60} tempo={1.4} color="var(--crayon-blue)" />
      </h1>
      <p className="privacy__lead">
        This is my personal portfolio. It has no ads, no analytics, no tracking and no cookies. Here is everything
        it does with information about you.
      </p>

      <h2>The contact form</h2>
      <p>
        When you send a message, your name, email address and message are emailed to me through Google's Gmail API.
        The site itself doesn't keep them: they live in my inbox, and I only use them to reply to you. The app that
        sends them can only send email; it can't read or change anything else in the mailbox.
      </p>
      <p>
        To stop spam, the server counts how many messages arrive from each internet address for a few minutes. That
        count is kept in memory only and is soon forgotten.
      </p>

      <h2>The sketchpad's AI</h2>
      <p>
        Your drawings stay in your browser. Only when you press <strong>✨ ask</strong> does the sketchpad send
        something: your typed notes, a picture of your new handwriting, and the last few questions and answers on
        the sheet. They go to an AI provider (currently Cloudflare Workers AI) to be answered. The provider's own
        privacy terms apply to what it receives.
      </p>
      <p>
        The questions and answers are kept, with nothing about who asked, so I can see what people want to know and
        so a question asked before can be answered straight away. To limit how many questions one visitor can ask, a
        scrambled (one-way hashed) form of your internet address is kept with the times of your questions, for a day.
        These are stored with Netlify, which hosts the site.
      </p>
      <p>Please don't write anything private on the sketchpad if you're going to ask the AI about it.</p>

      <h2>Stored in your browser</h2>
      <ul>
        <li>Your day or night choice, and whether sounds are on, stay until you clear them.</li>
        <li>
          Your sketchpad drawings, where you'd moved to on the sheet, and whether you've already seen the opening
          drawing stay until you close the tab. The drawings never leave your browser unless you press ask.
        </li>
      </ul>

      <h2>Other things the page loads</h2>
      <p>
        Billo the cat's mood is read from my GitHub profile (raw.githubusercontent.com), so GitHub sees that request,
        as it would for any visit to GitHub. The fonts and everything else come from this site.
      </p>
      <p>
        Netlify, which hosts the site, keeps the usual short-lived server logs for any website (such as internet
        addresses and the pages asked for).
      </p>

      <h2>Questions</h2>
      <p>
        Ask me anything about this, or ask me to delete a message you sent, through the{' '}
        <a href="/#contact">contact form</a>.
      </p>
      <p className="privacy__updated">Last updated {UPDATED}.</p>
    </main>
  );
}
