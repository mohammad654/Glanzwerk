export interface Project {
  slug: string;
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
    slug: 'office-daily-cleaning',
    title: 'Daily Office Maintenance',
    category: 'Commercial',
    icon: 'bi-building',
    image: 'assets/images/projects/corridor-daily-clean.jpg',
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
    slug: 'glass-facade-tower',
    title: 'Glass Facade Cleaning',
    category: 'High-Rise',
    icon: 'bi-building-up',
    image: 'assets/images/projects/glass-facade-tower.jpg',
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
    slug: 'restaurant-kitchen-clean',
    title: 'Commercial Kitchen Deep Clean',
    category: 'Hospitality',
    icon: 'bi-cup-hot',
    image: 'assets/images/projects/restaurant-kitchen.jpg',
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
    slug: 'facade-pressure-washing',
    title: 'Exterior Pressure Washing',
    category: 'Property Care',
    icon: 'bi-droplet',
    image: 'assets/images/projects/pressure-washing.jpg',
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
    slug: 'winter-service-contract',
    title: 'Winter Service Contract',
    category: 'Facility Services',
    icon: 'bi-snow',
    image: 'assets/images/projects/street-sweeping.jpg',
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
];

export const projectPath = (slug: string): string => `projects/${slug}`;

export const findProject = (slug: string): Project | undefined =>
  PROJECTS.find((project) => project.slug === slug);
