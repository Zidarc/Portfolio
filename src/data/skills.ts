/** Skills gathered from everything Ali has shipped (see projects.ts and github.com/Zidarc). */
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
    skills: ['TypeScript', 'JavaScript', 'Python', 'C++', 'C', 'SQL', 'HTML', 'CSS'],
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
    title: 'Data & AI',
    colour: 'purple',
    skills: ['MongoDB', 'Supabase', 'PostgreSQL', 'SQLite', 'YOLO', 'OpenVINO', 'Jupyter', 'Streamlit', 'Power BI', 'Excel', 'QGIS'],
  },
  {
    title: 'Graphics & Media',
    colour: 'orange',
    skills: ['Unity AR', 'Raylib', 'BMP image processing', 'Sharp', 'Tesseract OCR'],
  },
  {
    title: 'Tools & Deploy',
    colour: 'yellow',
    skills: ['Git', 'GitHub Actions', 'Docker', 'Vercel', 'Netlify', 'Vitest'],
  },
];
