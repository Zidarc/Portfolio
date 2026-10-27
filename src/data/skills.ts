/** Skills gathered from everything Ali has shipped (see projects.ts) plus the old site's list. */
export interface SkillGroup {
  title: string;
  /** Crayon colour token name, e.g. 'red' → var(--crayon-red). */
  colour: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    colour: 'red',
    skills: ['TypeScript', 'JavaScript', 'Python', 'C', 'SQL', 'HTML', 'CSS'],
  },
  {
    title: 'Frontend',
    colour: 'blue',
    skills: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'React Router', 'Leaflet', 'Spline 3D'],
  },
  {
    title: 'Backend',
    colour: 'green',
    skills: ['Node.js', 'Express', 'Next.js Route Handlers', 'Serverless Functions', 'JWT Auth', 'Nodemailer'],
  },
  {
    title: 'Data',
    colour: 'purple',
    skills: ['MongoDB', 'Mongoose', 'Supabase', 'PostgreSQL', 'SQLite', 'Power BI', 'QGIS', 'GeoJSON'],
  },
  {
    title: 'Graphics & Media',
    colour: 'orange',
    skills: ['Raylib', 'BMP image processing', 'Sharp', 'Tesseract OCR'],
  },
  {
    title: 'Tools & Deploy',
    colour: 'yellow',
    skills: ['Git', 'GitHub Actions', 'Docker', 'Vercel', 'Netlify', 'Vitest', 'ESLint'],
  },
];
