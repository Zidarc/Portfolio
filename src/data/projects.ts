/**
 * Every project box on the site is generated from this list.
 * `theme` picks which themed interior the box renders (built in Stage 6).
 */
export type ProjectTheme =
  | 'stranger-things'
  | 'galaxy'
  | 'stocks'
  | 'crypto'
  | 'maps'
  | 'paint'
  | 'mun'
  | 'mission-control'
  | 'pixel';

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  /** Missing while the repo doesn't exist yet. */
  repo?: string;
  live?: string;
  /** Set for team projects so the box says what Ali did. */
  role?: string;
  /** Work in progress: rendered as "coming soon". */
  wip?: boolean;
  theme: ProjectTheme;
}

export const projects: Project[] = [
  {
    id: 'recursion-hell',
    name: 'Recursion Hell',
    tagline: "Real-time team puzzle game for DevDay '26",
    description:
      'A real-time, team-based puzzle game with auth, game logic and a live leaderboard. Teams race through puzzles that keep folding back into themselves.',
    stack: ['React', 'Vite', 'Tailwind', 'TypeScript', 'Express', 'SQLite', 'Supabase', 'JWT'],
    repo: 'https://github.com/Zidarc/Cyber-Loop',
    live: 'https://recursion-hell.vercel.app',
    theme: 'stranger-things',
  },
  {
    id: 'gcc',
    name: 'GitHub Campus Club',
    tagline: 'Website + community arcade for GCC at FAST NUCES',
    description:
      'The club site with learning paths, events, team directory, an arcade of mini-games (Commit Snake, Bug Bash) and a simulated Git terminal puzzle.',
    stack: ['Next.js', 'React', 'JavaScript'],
    repo: 'https://github.com/GCC-FAST-NUCES-Karachi/GCC',
    theme: 'galaxy',
  },
  {
    id: 'synergy',
    name: 'Synergy IBA',
    tagline: 'Real-time simulated trading dashboard',
    description:
      'Teams buy and sell while an admin panel moves the market live. Serverless functions recalculate holdings and the leaderboard on every tick.',
    stack: ['JavaScript', 'Netlify Functions', 'Supabase', 'Postgres'],
    repo: 'https://github.com/Zidarc/SynergyIBA',
    live: 'https://synergy-iba.netlify.app/',
    theme: 'stocks',
  },
  {
    id: 'negotium',
    name: 'Negotium',
    tagline: 'Real-time crypto trading platform',
    description:
      'A MERN crypto trading simulator that handled 100+ concurrent traders, with precise buy/sell controls and tuned MongoDB Atlas queries.',
    stack: ['React', 'Node.js', 'Express', 'MongoDB Atlas'],
    repo: 'https://github.com/Zidarc/Negotioum-ccx',
    theme: 'crypto',
  },
  {
    id: 'grand-debate',
    name: "The Grand Debate '26",
    tagline: 'MUN website + registration portal',
    description:
      'Event site and delegate portal for The Literary Club: registrations, receipt upload with OCR checks, status lookup, email notifications and an organiser dashboard for committee allocation.',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'MongoDB', 'Nodemailer', 'Tesseract OCR'],
    repo: 'https://github.com/mukhtar-x/GrandDebatePortal',
    role: 'Web developer: frontend + backend',
    theme: 'mun',
  },
  {
    id: 'astralis-7',
    name: 'Astralis-7',
    tagline: 'NASA Space Apps 2023: a habitable exoplanet',
    description:
      'An interactive site for a fictional tidally-locked exoplanet, with 3D renders and an essay on how life could adapt to it. Built by team Stellar Coders.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Spline'],
    repo: 'https://github.com/ismailsilat7/NasaSpaceApps',
    live: 'https://ismailsilat7.github.io/NasaSpaceApps/',
    role: 'Web developer',
    theme: 'mission-control',
  },
  {
    id: 'geocode',
    name: 'GeoCode',
    tagline: 'Interactive geospatial mapping workshop',
    description:
      'Leaflet maps with multi-provider geocoding, distance/area measuring and pre-loaded datasets of schools and universities across Karachi.',
    stack: ['JavaScript', 'Leaflet', 'QGIS', 'GeoJSON'],
    repo: 'https://github.com/Zidarc/GEOCODE',
    theme: 'maps',
  },
  {
    id: 'bmp-editor',
    name: 'BMP Image Editor',
    tagline: 'A bitmap editor written in C',
    description:
      'Loads, edits and saves 24-bit BMPs with a dozen hand-written filters (blur, sepia, emboss, pixelate, vignette…) behind a Raylib GUI and a CLI.',
    stack: ['C', 'Raylib', 'RayGui'],
    repo: 'https://github.com/Zidarc/BitMap_Image_Editor',
    theme: 'paint',
  },
  {
    id: 'pixel-town',
    name: 'Pixel Town',
    tagline: 'Coming soon',
    description: 'Something pixelated is being built. Check back soon.',
    stack: [],
    wip: true,
    theme: 'pixel',
  },
];
