import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import '../sections/Hero.css';
import './OgCard.css';

/**
 * Dev only (`npm run dev`, then `?og`): the 1200 x 630 card link previews show (LinkedIn, WhatsApp…).
 * Screenshot it at exactly 1200 x 630 and save it as public/og.jpg. Fixed seeds keep it the same every time.
 */
export default function OgCard() {
  return (
    <div className="og">
      <div className="og__words">
        <CrayonText
          text={'Hello,\nI am Ali Hussain'}
          instant
          seed={2026}
          capHeight={70}
          wordSpacing={0.8}
          color="var(--crayon-red)"
        />
        <p className="og__tagline">
          Backend &amp; systems · CS '29, FAST NUCES
          <br />I build things that don't fall over.
        </p>
        <p className="og__url">ali-hussain-portfolio.netlify.app</p>
      </div>

      <div className="og__portrait">
        <div className="hero__frame">
          <div className="hero__photo">
            <img src={`${import.meta.env.BASE_URL}ali.webp`} alt="" />
          </div>
          <CrayonDoodle name="rings" instant seed={7} decorative className="hero__rings" />
        </div>
        <CrayonDoodle name="sparkle" instant seed={3} decorative color="var(--crayon-yellow)" className="og__sparkle" />
        <CrayonDoodle name="cat" instant seed={11} decorative color="var(--crayon-graphite)" className="og__cat" />
      </div>
    </div>
  );
}
