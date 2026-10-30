import { CrayonText } from '../crayon/CrayonText.tsx';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import './SectionHeading.css';

interface SectionHeadingProps {
  text: string;
  color: string;
  id?: string;
  /** Smaller sub-heading inside a section. */
  small?: boolean;
  onDone?: () => void;
}

/** An h2/h3 in crayon lettering, already written (drawing it in was work for little). */
export function SectionHeading({ text, color, id, small = false, onDone }: SectionHeadingProps) {
  const narrow = useMediaQuery('(max-width: 600px)');
  const Tag = small ? 'h3' : 'h2';
  const capHeight = small ? (narrow ? 20 : 26) : narrow ? 34 : 48;

  return (
    <Tag id={id} className={`section-heading ${small ? 'section-heading--small' : ''}`}>
      <span className="sr-only">{text}</span>
      <CrayonText text={text} decorative instant capHeight={capHeight} color={color} onDone={onDone} />
    </Tag>
  );
}
