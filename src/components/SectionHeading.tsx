import { useRef } from 'react';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useInView } from '../hooks/useInView.ts';
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

/** An h2/h3 whose crayon lettering writes itself when it scrolls into view. */
export function SectionHeading({ text, color, id, small = false, onDone }: SectionHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref);
  const narrow = useMediaQuery('(max-width: 600px)');
  const Tag = small ? 'h3' : 'h2';
  const capHeight = small ? (narrow ? 20 : 26) : narrow ? 34 : 48;

  return (
    <Tag ref={ref} id={id} className={`section-heading ${small ? 'section-heading--small' : ''}`}>
      <span className="sr-only">{text}</span>
      <CrayonText text={text} decorative play={inView} capHeight={capHeight} tempo={1.3} color={color} onDone={onDone} />
    </Tag>
  );
}
