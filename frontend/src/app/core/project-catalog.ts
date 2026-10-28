import { LocalizedPath, pathIn } from './i18n/localized-path';

export interface Project {
  /** Locale-independent identity; never shown and never routed. */
  key: string;
  /** The URL segment per locale. Keep each on one line: the sitemap script reads them. */
  path: LocalizedPath;
  title: string;
  category: string;
  icon: string;
  image: string;
  summary: string;
  description: string[];
  facts: { label: string; value: string }[];
}

export const PROJECTS: readonly Project[] = [
  {
    key: 'office-daily-cleaning',
    path: { de: 'referenzen/bueroreinigung-taeglich', en: 'references/daily-office-cleaning' },
    title: 'Daily Office Maintenance',
    category: 'Commercial',
    icon: 'bi-building',
    image: 'assets/images/projects/unterhaltsreinigung-reinigungswagen-dresden.webp',
    summary: 'Five-day maintenance cleaning across three floors of open-plan office space.',
    description: [
      'A professional services client with roughly 180 staff across three floors needed a cleaning standard that held all day, including for client visits in the afternoon.',
      'We moved the main clean to the evening and added a short midday presence covering kitchens, washrooms and reception. That single change removed almost every complaint the previous contractor had been receiving.',
      'The site runs to a written specification with a named supervisor and a monthly quality walk recorded with the client.',
    ],
    facts: [
      { label: 'Property', value: 'Three floors, approx. 180 staff' },
      { label: 'Scope', value: 'Maintenance cleaning, five days' },
      { label: 'Schedule', value: 'Evening clean plus midday cover' },
    ],
  },
  {
    key: 'glass-facade-tower',
    path: { de: 'referenzen/glasfassade-hochhaus', en: 'references/glass-facade-tower' },
    title: 'Glass Facade Cleaning',
    category: 'High-Rise',
    icon: 'bi-building-up',
    image: 'assets/images/projects/glasfassade-hochhaus-dresden.webp',
    summary: 'Quarterly cleaning of a fully glazed eleven-storey facade using an access platform.',
    description: [
      'A fully glazed office tower where the facade had been cleaned irregularly for several years, leaving mineral deposits that ordinary washing would no longer shift.',
      'The first visit was a restoration clean to remove the bonded deposits. From there a quarterly cycle keeps the glass in condition, with each visit now taking a fraction of the original time.',
      'Work is carried out from the building maintenance unit, with exclusion zones agreed with the facilities team before each deployment.',
    ],
    facts: [
      { label: 'Property', value: 'Eleven-storey glazed office' },
      { label: 'Access', value: 'Building maintenance unit' },
      { label: 'Cycle', value: 'Quarterly, after initial restoration' },
    ],
  },
  {
    key: 'restaurant-kitchen-clean',
    path: { de: 'referenzen/grosskuechenreinigung', en: 'references/commercial-kitchen-deep-clean' },
    title: 'Commercial Kitchen Deep Clean',
    category: 'Hospitality',
    icon: 'bi-cup-hot',
    image: 'assets/images/projects/grosskuechenreinigung-dresden.webp',
    summary: 'Overnight deep clean of a restaurant kitchen, completed between two services.',
    description: [
      'Commercial kitchens can only be deep cleaned cold, which in practice means overnight. This kitchen had a single window between Sunday close and Tuesday opening.',
      'Extraction canopies, ducting, fryers, grease traps and the voids behind fixed equipment were stripped back to surface. Floors were degreased and resealed.',
      'The client received a photographic record and a hygiene certificate for their due diligence file. The kitchen opened on schedule.',
    ],
    facts: [
      { label: 'Property', value: 'Restaurant kitchen' },
      { label: 'Scope', value: 'Extraction, equipment, floors' },
      { label: 'Window', value: 'Overnight, between services' },
    ],
  },
  {
    key: 'facade-pressure-washing',
    path: { de: 'referenzen/fassaden-hochdruckreinigung', en: 'references/exterior-pressure-washing' },
    title: 'Exterior Pressure Washing',
    category: 'Property Care',
    icon: 'bi-droplet',
    image: 'assets/images/projects/fassadenreinigung-hochdruck-dresden.webp',
    summary: 'Restoring entrance areas, paving and rendered walls across a mixed-use development.',
    description: [
      'Years of algae and traffic film had left the entrances and paved areas of a mixed-use development looking considerably older than the building actually is.',
      'We worked at controlled pressure with surface cleaners rather than open lances, which protects jointing and avoids the striping that aggressive washing leaves behind.',
      'The result is now protected by an annual return visit, which costs a fraction of the original restoration.',
    ],
    facts: [
      { label: 'Property', value: 'Mixed-use development' },
      { label: 'Scope', value: 'Paving, entrances, rendered walls' },
      { label: 'Cycle', value: 'Annual maintenance visit' },
    ],
  },
  {
    key: 'winter-service-contract',
    path: { de: 'referenzen/winterdienst-vertrag', en: 'references/winter-service-contract' },
    title: 'Winter Service Contract',
    category: 'Facility Services',
    icon: 'bi-snow',
    image: 'assets/images/projects/aussenreinigung-kehrmaschine-dresden.webp',
    summary: 'Documented snow clearing and gritting across six sites through the winter season.',
    description: [
      'A property manager responsible for six sites needed winter cover that would stand up to scrutiny if a liability claim were ever brought.',
      'Routes are cleared before 07:00 on every deployment day, prioritised by entrance and pedestrian traffic. Each visit is logged with time, location, material used and the operative responsible.',
      'The logs are provided monthly and form the evidence that the duty of care was met, which is the part most winter contracts leave out.',
    ],
    facts: [
      { label: 'Portfolio', value: 'Six managed sites' },
      { label: 'Scope', value: 'Snow clearing and gritting' },
      { label: 'Reporting', value: 'Logged deployments, monthly record' },
    ],
  },
  {
    key: 'hospital-ward-cleaning',
    path: { de: 'referenzen/klinikreinigung-station', en: 'references/hospital-ward-cleaning' },
    title: 'Hospital Ward Cleaning',
    category: 'Healthcare',
    icon: 'bi-hospital',
    image: 'assets/images/projects/praxisreinigung-klinikflur-dresden.webp',
    summary: 'Daily clinical cleaning of two inpatient wards, run to a written disinfection plan.',
    description: [
      'A clinical area is not cleaned to a standard of appearance but to a standard of hygiene, and the two are not the same job. Every surface on the ward is assigned a risk class, and the risk class decides the agent, the contact time and how often the cloth is changed.',
      'The wards are cleaned twice daily, seven days a week, around ward rounds and meal service. Patient rooms, bathrooms and the high-touch points along the corridor run on a colour-coded cloth system so nothing crosses from one zone into another.',
      'Operatives on this site are trained to the hygiene plan and their training is recorded. Each shift is signed off against a checklist the hygiene officer holds, which is the document that matters when the ward is inspected.',
    ],
    facts: [
      { label: 'Property', value: 'Two inpatient wards, 64 beds' },
      { label: 'Scope', value: 'Clinical cleaning and surface disinfection' },
      { label: 'Schedule', value: 'Twice daily, seven days a week' },
    ],
  },
  {
    key: 'school-cleaning-contract',
    path: { de: 'referenzen/schulreinigung-vertrag', en: 'references/school-cleaning-contract' },
    title: 'School Cleaning Contract',
    category: 'Education',
    icon: 'bi-mortarboard',
    image: 'assets/images/projects/schulreinigung-klassenzimmer-dresden.webp',
    summary: 'Term-time cleaning of a primary school, with the deep clean moved into the holidays.',
    description: [
      'A primary school with around 400 pupils where the cleaning window is short and absolute: the building has to be finished before breakfast club opens and nobody can be in a classroom while children are.',
      'Classrooms, halls and corridors are cleaned after the last activity each day, with washrooms and door furniture disinfected on a separate round. The caretaker holds a plan showing which rooms are done in which order, so a late booking does not derail the shift.',
      'Floor stripping, sealing and the full washroom deep clean are held back for the holidays, when the building is empty and the work can be done properly rather than squeezed around a timetable.',
    ],
    facts: [
      { label: 'Property', value: 'Primary school, approx. 400 pupils' },
      { label: 'Scope', value: 'Classrooms, halls, corridors, washrooms' },
      { label: 'Schedule', value: 'Daily after hours, deep clean in holidays' },
    ],
  },
];

/** This build's URL segment for a project. */
export const projectPath = (project: Project): string => pathIn(project.path);

/** The same route as a router link. */
export const projectLink = (project: Project): string => `/${projectPath(project)}`;

/** Lookup by the URL this build serves the page at. */
export const findProjectByPath = (path: string): Project | undefined =>
  PROJECTS.find((project) => projectPath(project) === path);
