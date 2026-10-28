/**
 * Every project box on the site is generated from this list.
 * `theme` picks which themed interior the box renders (src/projects/themes/<theme>/).
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
  | 'pixel'
  | 'vision'
  | 'dashboard'
  | 'mystery';

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  /** Missing while the repo doesn't exist yet. */
  repo?: string;
  live?: string;
  /** Rubber stamp on the box for unfinished work, e.g. "in development". */
  stamp?: string;
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
    id: 'ishara',
    name: 'Ishara',
    tagline: 'Fine-tuning vision models to help visually impaired students',
    description:
      'Fine-tuning compact object-detection (YOLO) and depth-estimation models so a phone camera can warn visually impaired students about obstacles around campus, then optimising them with OpenVINO to run fast on-device.',
    stack: ['Python', 'YOLO', 'Fine-tuning', 'Monocular depth', 'OpenVINO', 'Streamlit'],
    repo: 'https://github.com/Zidarc/Ishara',
    stamp: 'in development',
    theme: 'vision',
  },
  {
    id: 'gcc',
    name: 'GitHub Campus Club',
    tagline: 'Website + community arcade for GCC at FAST NUCES',
    description:
      'The club site with learning paths, events, team directory, an arcade of mini-games (Commit Snake, Bug Bash) and a simulated Git terminal puzzle.',
    stack: ['Next.js', 'React', 'JavaScript'],
    repo: 'https://github.com/GCC-FAST-NUCES-Karachi/GCC',
    live: 'https://www.gccfast.tech/',
    theme: 'galaxy',
  },
  {
    id: 'synergy',
    name: 'Synergy',
    tagline: 'Stock-trading module for the Synergy competition',
    description:
      'Teams traded stocks in real time while an admin panel moved the market live. Serverless functions recalculated every holding and the leaderboard on each tick.',
    stack: ['JavaScript', 'Netlify Functions', 'Supabase', 'Postgres'],
    repo: 'https://github.com/Zidarc/SynergyIBA',
    live: 'https://synergy-iba.netlify.app/',
    theme: 'stocks',
  },
  {
    id: 'negotium',
    name: 'Negotium',
    tagline: 'Crypto-trading module for the Negotium competition at Cedar',
    description:
      'A real-time crypto-coin trading simulator for Negotium at Cedar College: 100+ traders buying and selling at once, with precise buy/sell controls and tuned MongoDB Atlas queries.',
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
    live: 'https://www.tgd26.com/',
    theme: 'mun',
  },
  {
    id: 'astralis-7',
    name: 'Astralis-7',
    tagline: 'NASA Space Apps 2023: a habitable exoplanet',
    description:
      'An interactive site for a fictional tidally-locked exoplanet, with 3D renders and an essay on how life could adapt to it.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Spline'],
    repo: 'https://github.com/ismailsilat7/NasaSpaceApps',
    live: 'https://ismailsilat7.github.io/NasaSpaceApps/',
    theme: 'mission-control',
  },
  {
    id: 'data-dash',
    name: 'Data-Dash',
    tagline: 'Power BI dashboards from messy multi-source data',
    description:
      'Cleaned and merged several Excel datasets, then built 5+ interactive Power BI dashboards comparing sales, music-genre performance and regional metrics, and presented the findings to 50+ people.',
    stack: ['Power BI', 'Excel'],
    repo: 'https://github.com/Zidarc/Data-Dash',
    theme: 'dashboard',
  },
  {
    id: 'geocode',
    name: 'GeoCode',
    tagline: 'Interactive geospatial mapping workshop',
    description:
      'Leaflet maps with multi-provider geocoding, distance/area measuring and pre-loaded datasets of schools and universities across Karachi.',
    stack: ['JavaScript', 'Leaflet', 'QGIS', 'GeoJSON'],
    repo: 'https://github.com/Zidarc/GEOCODE',
    live: 'https://zidarc.github.io/GEOCODE/',
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
    tagline: 'A little pixel-game town',
    description: 'Something pixelated is on its way. The code lands on GitHub soon.',
    stack: [],
    stamp: 'on GitHub soon',
    theme: 'pixel',
  },
  {
    id: 'mystery',
    name: 'Project ???',
    tagline: "Shh, it's a secret",
    description: "Something new is cooking. No hints yet, but you'll see it here first.",
    stack: [],
    stamp: 'in development',
    theme: 'mystery',
  },
];
