import { memo } from 'react';
import { MAP, SCHOOLS, UNIS } from './geo.ts';

export const COMPASS: readonly [number, number] = [288, 48];

/** Kirthar-ish hills up in the north-west, as a kid draws them: little ^ marks. */
const HILLS: [number, number, number][] = [
  [14, 66, 1],
  [24, 62, 1.2],
  [36, 67, 0.9],
  [150, 42, 0.9],
  [246, 54, 1],
  [256, 58, 0.8],
];

function CompassRose() {
  const [cx, cy] = COMPASS;
  const main = [0, 90, 180, 270];
  const minor = [45, 135, 225, 315];
  const point = (deg: number, len: number, w: number) => {
    const r = (deg * Math.PI) / 180;
    const tip = [cx + Math.sin(r) * len, cy - Math.cos(r) * len];
    const l = [cx + Math.sin(r - Math.PI / 2) * w, cy - Math.cos(r - Math.PI / 2) * w];
    const rr = [cx + Math.sin(r + Math.PI / 2) * w, cy - Math.cos(r + Math.PI / 2) * w];
    const p = (q: number[]) => `${q[0]!.toFixed(1)} ${q[1]!.toFixed(1)}`;
    return {
      outline: `M${p(l)}L${p(tip)}L${p(rr)}L${cx} ${cy}Z`,
      shade: `M${cx} ${cy}L${p(tip)}L${p(rr)}Z`,
    };
  };
  return (
    <g className="map-rose">
      <circle cx={cx} cy={cy} r="15.5" className="map-rose-ring" />
      <circle cx={cx} cy={cy} r="12.5" className="map-rose-ring2" />
      {minor.map((d) => {
        const pt = point(d, 11, 2.6);
        return (
          <g key={d}>
            <path d={pt.shade} className="map-rose-shade" />
            <path d={pt.outline} className="map-rose-point map-rose-point--minor" />
          </g>
        );
      })}
      {main.map((d) => {
        const pt = point(d, 18, 3.6);
        return (
          <g key={d}>
            <path d={pt.shade} className="map-rose-shade" />
            <path d={pt.outline} className="map-rose-point" />
          </g>
        );
      })}
      <text x={cx} y={cy - 20} className="map-rose-n">
        N
      </text>
    </g>
  );
}

/** A tiny schoolhouse: box, roof, door, little flag. Drawn around (0, 0). */
const SCHOOL_D = 'M-4.5 0V-5.5L0 -9.5L4.5 -5.5V0ZM-1.3 0V-3.2H1.3V0';
const SCHOOL_FLAG = 'M0 -9.5V-13.5L3.2 -12.4L0 -11.4';
/** A mortarboard: diamond top, cap, tassel. */
const CAP_TOP = 'M-6 -6.5L0 -9.2L6 -6.5L0 -3.9Z';
const CAP_BASE = 'M-3.4 -5V-1.6Q0 0.4 3.4 -1.6V-5';
const CAP_TASSEL = 'M0 -6.5L4.6 -5.2V-1.4';

/** The whole static map, drawn once: paper, sea, coast, roads, icons, compass, frame. */
export const MapBase = memo(function MapBase({ uid }: { uid: string }) {
  return (
    <svg className="map-base" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id={`${uid}-sea`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <rect width="4" height="4" className="map-sea-fill" />
          <path d="M0 0V4" className="map-sea-hatch" />
        </pattern>
        <filter id={`${uid}-rough`} x="-2%" y="-2%" width="104%" height="104%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* graticule */}
      <g className="map-grid">
        {MAP.grid.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* the Arabian Sea */}
      <path d={MAP.sea} fill={`url(#${uid}-sea)`} />

      <g filter={`url(#${uid}-rough)`}>
        {/* roads */}
        {MAP.mainRoads.map((d, i) => (
          <g key={i}>
            <path d={d} className="map-mainroad" />
            <path d={d} className="map-mainroad-mid" />
          </g>
        ))}
        {MAP.roads.map((d, i) => (
          <path key={i} d={d} className="map-road" />
        ))}

        {/* rivers: Lyari and Malir */}
        {MAP.rivers.map((d, i) => (
          <path key={i} d={d} className="map-river" />
        ))}

        {/* coast */}
        <path d={MAP.coastEcho} className="map-coast-echo" />
        <path d={MAP.coast} className="map-coast" />

        {/* hills */}
        {HILLS.map(([x, y, s], i) => (
          <path
            key={i}
            d="M-4 0L-0.5 -4.5L1 -2.6L2.2 -4L5 0"
            transform={`translate(${x} ${y}) scale(${s})`}
            className="map-hill"
          />
        ))}

        {/* schools and universities */}
        {SCHOOLS.map(([x, y], i) => (
          <g key={`s${i}`} transform={`translate(${x} ${y}) rotate(${(i % 3) * 3 - 3})`} className="map-school">
            <path d={SCHOOL_D} />
            <path d={SCHOOL_FLAG} className="map-school-flag" />
          </g>
        ))}
        {UNIS.map(([x, y], i) => (
          <g key={`u${i}`} transform={`translate(${x} ${y}) rotate(${(i % 2) * 6 - 3})`} className="map-uni">
            <path d={CAP_BASE} />
            <path d={CAP_TOP} className="map-uni-top" />
            <path d={CAP_TASSEL} className="map-uni-tassel" />
          </g>
        ))}

        <CompassRose />

        {/* scale bar */}
        <path d={MAP.scaleBar} className="map-scale" />
        <path d={MAP.scaleTicks} className="map-scale" />

        {/* map frame */}
        <path d={MAP.frame} className="map-frame" />
      </g>

      {/* labels */}
      <text x="150" y="191" className="map-label map-label--sea">
        Arabian Sea
      </text>
      <text x="96" y="62" className="map-label map-label--city" transform="rotate(-6 96 62)">
        KARACHI
      </text>
      <text x="262" y="196" className="map-label map-label--scale">
        0
      </text>
      <text x="298" y="196" className="map-label map-label--scale">
        5 km
      </text>
      <text x="8" y="196" className="map-label map-label--lat">
        24°50′N
      </text>

      {/* search box (the typing happens in an HTML layer on top) */}
      <path d={MAP.search} className="map-search-fill" />
      <path d={MAP.searchEcho} className="map-search-echo" />
      <path d={MAP.search} className="map-search-edge" />
    </svg>
  );
});
