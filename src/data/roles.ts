/** Roles from Ali's LinkedIn experience section, newest first. */
export interface Role {
  title: string;
  org: string;
  /** Shown as written, e.g. 'Oct 2026'. */
  start: string;
  /** Omitted while the role is ongoing. */
  end?: string;
  /** Crayon colour token name, e.g. 'red' → var(--crayon-red). */
  colour: string;
  note?: string;
  skills: string[];
}

export const roles: Role[] = [
  {
    title: 'Tech Competition Co-head',
    org: 'ACM NUCES Karachi',
    start: 'Oct 2026',
    colour: 'red',
    skills: ['Module design', 'Competitive programming'],
  },
  {
    title: 'Product Design Head',
    org: 'GitHub Campus Club, FAST NUCES',
    start: 'Oct 2026',
    colour: 'purple',
    skills: ['Product development', 'Product management'],
  },
  {
    title: 'Assistant Director, Registration & Web Dev',
    org: "The Grand Debate '26",
    start: '2026',
    colour: 'blue',
    note: "Running delegate registration, and I built the event's website and registration portal (one of the projects below).",
    skills: ['Web development', 'Registration ops'],
  },
  {
    title: 'Programs & Initiatives Co-head',
    org: 'Youth Intelligentsia',
    start: 'Oct 2026',
    colour: 'green',
    skills: ['Program planning', 'Event management'],
  },
  {
    title: 'Marketing Co-head',
    org: 'AWS SBG FAST NUCES Karachi',
    start: 'Oct 2026',
    colour: 'orange',
    skills: ['Marketing', 'Marketing strategy'],
  },
  {
    title: 'Student Teaching Assistant',
    org: 'FAST NUCES Karachi',
    start: 'Sep 2026',
    colour: 'red',
    note: 'Functional English',
    skills: ['English'],
  },
  {
    title: 'Recursion Hell Co-head',
    org: "Developers' Day, ACM NUCES",
    start: 'Feb 2026',
    end: 'Apr 2026',
    colour: 'red',
    note: 'Ran the competition, and built the game it was played on (one of the projects below).',
    skills: ['Technical leadership', 'Project management'],
  },
  {
    title: 'A Level Intern Lead',
    org: 'OctiLearn',
    start: 'Jul 2024',
    end: 'Aug 2024',
    colour: 'purple',
    note: 'Led the A Level interns on product development.',
    skills: ['Product development'],
  },
];
