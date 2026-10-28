import { LocalizedPath, pathIn } from './i18n/localized-path';

export interface Service {
  /**
   * Locale-independent identity. Never shown and never routed — it exists so the
   * German and English versions of a page can recognise each other.
   */
  key: string;
  /** The URL segment per locale. Service pages sit at the root, as the SEO plan asks. */
  path: LocalizedPath;
  icon: string;
  image: string;
  title: string;
  /** Short label for compact places: menus, chips, footers. */
  shortTitle: string;
  /** One line, for cards and lists. */
  summary: string;
  /** Page <title>, kept under ~60 characters for search results. */
  metaTitle: string;
  /** Meta description, 150–160 characters. */
  metaDescription: string;
  /** Body copy on the service's own page. */
  description: string[];
  highlights: string[];
  /** The specific jobs people actually search for. */
  includes: string[];
}

/**
 * The service offering, one entry per page in the Growth & SEO guide's URL plan.
 * Each entry is a page, a nav item, a route, a prerendered file, a sitemap URL, an
 * Offer in the structured data and an option in the contact form.
 *
 * Ordered by commercial priority: recurring contract work first, because that is the
 * income the guide says to build the business on, then seasonal and one-off work.
 *
 * `scripts/generate-sitemap.mjs` reads the `path:` lines as text — keep them on one line.
 */
export const SERVICES: readonly Service[] = [
  {
    key: 'maintenance',
    path: { de: 'unterhaltsreinigung-dresden', en: 'maintenance-cleaning-dresden' },
    icon: 'bi-arrow-repeat',
    image: 'assets/images/projects/unterhaltsreinigung-reinigungswagen-dresden.webp',
    title: $localize`:@@service.maintenance.title:Maintenance Cleaning Dresden`,
    shortTitle: $localize`:@@service.maintenance.shortTitle:Maintenance Cleaning`,
    summary: $localize`:@@service.maintenance.summary:Daily or weekly contract cleaning for offices, schools and commercial buildings, run by the same fixed team.`,
    metaTitle: $localize`:@@service.maintenance.metaTitle:Maintenance Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.maintenance.metaDescription:Daily or weekly maintenance cleaning for offices, schools and commercial sites in Dresden. Fixed teams, documented quality. Free site visit.`,
    description: [
      $localize`:@@service.maintenance.p1:Maintenance cleaning is the work that nobody notices until it stops. It is also the contract that decides whether a building feels looked after, so we treat it as the core of what we do rather than as filler between bigger jobs.`,
      $localize`:@@service.maintenance.p2:You get a written cleaning schedule that says what is done daily, weekly and monthly, and the same team doing it. People who come back to the same building learn where the problems are, which door sticks, which floor marks, and which room needs attention before a visit.`,
      $localize`:@@service.maintenance.p3:Every visit is logged, so when your facility manager or auditor asks what was cleaned and when, the answer is on paper. We agree the scope once, in plain language, and you have one contact person for any change to it.`,
    ],
    highlights: [
      $localize`:@@service.maintenance.h1:The same fixed team in your building`,
      $localize`:@@service.maintenance.h2:Written schedule: daily, weekly, monthly`,
      $localize`:@@service.maintenance.h3:Every visit documented for your records`,
      $localize`:@@service.maintenance.h4:One named contact for the whole contract`,
    ],
    includes: [
      $localize`:@@service.maintenance.i1:Daily and weekly office cleaning`,
      $localize`:@@service.maintenance.i2:Large-area and zone cleaning`,
      $localize`:@@service.maintenance.i3:Sanitary facilities and consumables`,
      $localize`:@@service.maintenance.i4:Kitchens, break rooms and tea points`,
      $localize`:@@service.maintenance.i5:Cleaning after closing time`,
      $localize`:@@service.maintenance.i6:Written cleaning specification on request`,
    ],
  },
  {
    key: 'office',
    path: { de: 'bueroreinigung-dresden', en: 'office-cleaning-dresden' },
    icon: 'bi-building',
    image: 'assets/images/services/bueroreinigung-dresden.webp',
    title: $localize`:@@service.office.title:Office Cleaning Dresden`,
    shortTitle: $localize`:@@service.office.shortTitle:Office Cleaning`,
    summary: $localize`:@@service.office.summary:Discreet cleaning for offices, law firms and practices, scheduled before opening or after closing.`,
    metaTitle: $localize`:@@service.office.metaTitle:Office Cleaning Dresden: Reliable & Discreet | Glanzwork`,
    metaDescription: $localize`:@@service.office.metaDescription:Professional office cleaning in Dresden before or after business hours. Transparent prices, a named contact. Request your free quote today.`,
    description: [
      $localize`:@@service.office.p1:An office says what a company is like before anyone speaks. We clean yours around your working day, so your staff arrive to a desk that is ready and your visitors never see the work being done.`,
      $localize`:@@service.office.p2:Law firms, practices and agencies handle confidential paperwork. Our teams are briefed on what not to touch, work to a fixed route, and are the same people each week, so you are not introducing strangers to your files every month.`,
      $localize`:@@service.office.p3:Pricing is per square metre and per visit, agreed in writing before we start. If your floor space or your schedule changes, the price changes with it and you see why.`,
    ],
    highlights: [
      $localize`:@@service.office.h1:Before opening or after closing`,
      $localize`:@@service.office.h2:Briefed on confidential areas`,
      $localize`:@@service.office.h3:Transparent price per square metre`,
      $localize`:@@service.office.h4:Vetted, directly employed staff`,
    ],
    includes: [
      $localize`:@@service.office.i1:Desks, surfaces and office furniture`,
      $localize`:@@service.office.i2:Meeting and conference rooms`,
      $localize`:@@service.office.i3:Kitchens and tea points`,
      $localize`:@@service.office.i4:Sanitary facilities and restocking`,
      $localize`:@@service.office.i5:Floors, carpets and entrance areas`,
      $localize`:@@service.office.i6:Interior glass and partition walls`,
    ],
  },
  {
    key: 'school',
    path: { de: 'schulreinigung-dresden', en: 'school-cleaning-dresden' },
    icon: 'bi-mortarboard',
    image: 'assets/images/projects/schulreinigung-klassenzimmer-dresden.webp',
    title: $localize`:@@service.school.title:School & Daycare Cleaning`,
    shortTitle: $localize`:@@service.school.shortTitle:School Cleaning`,
    summary: $localize`:@@service.school.summary:Classrooms, daycare rooms and sports halls cleaned to a hygiene plan, scheduled around lessons and holidays.`,
    metaTitle: $localize`:@@service.school.metaTitle:School & Daycare Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.school.metaDescription:Cleaning for schools, daycare centres and sports halls in Dresden to a hygiene plan. Scheduled around lessons and holidays, deep cleaning included.`,
    description: [
      $localize`:@@service.school.p1:Schools and daycare centres are the hardest buildings to clean well: heavy use, short windows, and a duty of care towards children. The work has to fit the timetable, not the other way round.`,
      $localize`:@@service.school.p2:We clean to a written hygiene plan, with the surfaces children actually touch treated as the priority: door handles, tables, taps and sanitary areas. Our staff are briefed on which products may be used in rooms with children and which may not.`,
      $localize`:@@service.school.p3:The school holidays are when deep cleaning happens: floors stripped and resealed, furniture moved, sports halls brought back to standard before the new term. We plan that calendar with you a term ahead so nothing is rushed in the last week.`,
    ],
    highlights: [
      $localize`:@@service.school.h1:Cleaned to a written hygiene plan`,
      $localize`:@@service.school.h2:Scheduled around lessons and care hours`,
      $localize`:@@service.school.h3:Deep cleaning during the holidays`,
      $localize`:@@service.school.h4:Staff trained for rooms used by children`,
    ],
    includes: [
      $localize`:@@service.school.i1:Classrooms and group rooms`,
      $localize`:@@service.school.i2:Daycare and after-school rooms`,
      $localize`:@@service.school.i3:Sports halls and changing rooms`,
      $localize`:@@service.school.i4:Sanitary facilities to a hygiene plan`,
      $localize`:@@service.school.i5:Corridors, stairwells and entrances`,
      $localize`:@@service.school.i6:Holiday deep cleaning and floor care`,
    ],
  },
  {
    key: 'medical',
    path: { de: 'praxisreinigung-dresden', en: 'medical-practice-cleaning-dresden' },
    icon: 'bi-heart-pulse',
    image: 'assets/images/projects/praxisreinigung-klinikflur-dresden.webp',
    title: $localize`:@@service.medical.title:Medical Practice & Care Home Cleaning`,
    shortTitle: $localize`:@@service.medical.shortTitle:Medical Cleaning`,
    summary: $localize`:@@service.medical.summary:Hygienic cleaning and disinfection for practices, medical centres and care homes, with documented procedures.`,
    metaTitle: $localize`:@@service.medical.metaTitle:Medical & Care Home Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.medical.metaDescription:Hygienic cleaning and disinfection for medical practices, health centres and care homes in Dresden. Trained staff, documented procedures.`,
    description: [
      $localize`:@@service.medical.p1:In a practice or a care home, cleaning is part of the hygiene concept, not a service around it. The sequence matters, the products matter, and so does being able to show what was done.`,
      $localize`:@@service.medical.p2:We work to your hygiene plan: treatment rooms, waiting areas and sanitary facilities in the right order, with separate equipment per zone so nothing is carried from one room into another. Staff are trained for medical settings and know what a contact surface is.`,
      $localize`:@@service.medical.p3:Every visit is documented in a form your practice manager can hand to an inspector. Where you need disinfection to a specific standard, we agree it in writing and use products that match it.`,
    ],
    highlights: [
      $localize`:@@service.medical.h1:Works to your existing hygiene plan`,
      $localize`:@@service.medical.h2:Separate equipment per hygiene zone`,
      $localize`:@@service.medical.h3:Documented for inspections`,
      $localize`:@@service.medical.h4:Staff trained for medical settings`,
    ],
    includes: [
      $localize`:@@service.medical.i1:Treatment and examination rooms`,
      $localize`:@@service.medical.i2:Waiting areas and reception`,
      $localize`:@@service.medical.i3:Surface disinfection to plan`,
      $localize`:@@service.medical.i4:Care homes and senior residences`,
      $localize`:@@service.medical.i5:Health centres and shared practices`,
      $localize`:@@service.medical.i6:Physiotherapy and dental practices`,
    ],
  },
  {
    key: 'publicSector',
    path: { de: 'oeffentliche-einrichtungen', en: 'public-sector-cleaning' },
    icon: 'bi-bank',
    image: 'assets/images/services/gebaeudereinigung-bueroteam-dresden.webp',
    title: $localize`:@@service.publicSector.title:Cleaning For Public Authorities`,
    shortTitle: $localize`:@@service.publicSector.shortTitle:Public Sector`,
    summary: $localize`:@@service.publicSector.summary:Building cleaning for authorities, administrations, libraries and municipal properties, tender-ready and documented.`,
    metaTitle: $localize`:@@service.publicSector.metaTitle:Public Building Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.publicSector.metaDescription:Building cleaning for authorities, administrations, libraries and municipal buildings in Dresden and Saxony. Pay-scale compliant, documented, dependable.`,
    description: [
      $localize`:@@service.publicSector.p1:Public buildings are bought through tenders, and tenders are won on paperwork as much as on price. We keep the documents a public buyer asks for ready: trade register entry, clearance certificates, liability insurance, references and proof of wage compliance.`,
      $localize`:@@service.publicSector.p2:We pay the industry collective wage and can show it. For a public client that is not a detail — it is a condition of award, and the reason a cheap bid often turns out not to be eligible.`,
      $localize`:@@service.publicSector.p3:We bid for lots that fit us: a single school, an office building, one administrative site. Being the right size for the lot means your building gets attention rather than being the smallest item on a national contract.`,
    ],
    highlights: [
      $localize`:@@service.publicSector.h1:Tender documents kept ready`,
      $localize`:@@service.publicSector.h2:Collective wage compliance on paper`,
      $localize`:@@service.publicSector.h3:Performance records for every site`,
      $localize`:@@service.publicSector.h4:Sized for single-building lots`,
    ],
    includes: [
      $localize`:@@service.publicSector.i1:Authorities and administrative buildings`,
      $localize`:@@service.publicSector.i2:Town halls and citizens' offices`,
      $localize`:@@service.publicSector.i3:Libraries and museums`,
      $localize`:@@service.publicSector.i4:Municipal and communal buildings`,
      $localize`:@@service.publicSector.i5:Framework agreements and call-offs`,
      $localize`:@@service.publicSector.i6:Service specifications on request`,
    ],
  },
  {
    key: 'industrial',
    path: { de: 'industriereinigung-dresden', en: 'industrial-cleaning-dresden' },
    icon: 'bi-gear-wide-connected',
    image: 'assets/images/services/industriereinigung-halle-sachsen.webp',
    title: $localize`:@@service.industrial.title:Industrial Cleaning Dresden`,
    shortTitle: $localize`:@@service.industrial.shortTitle:Industrial Cleaning`,
    summary: $localize`:@@service.industrial.summary:Production halls, warehouses and workshops cleaned around shift patterns, to your site safety rules.`,
    metaTitle: $localize`:@@service.industrial.metaTitle:Industrial Cleaning Dresden & Saxony | Glanzwork`,
    metaDescription: $localize`:@@service.industrial.metaDescription:Cleaning of production halls, warehouses and workshops on shift schedules. Safety-compliant procedures and fixed teams. Arrange a site visit now.`,
    description: [
      $localize`:@@service.industrial.p1:A production site cannot stop for cleaning. We work to your shift pattern, including nights and weekends, and plan around the lines that keep running.`,
      $localize`:@@service.industrial.p2:Before the first visit we walk the site with your safety officer: access rules, protective equipment, lockout procedures, which areas need a permit and which chemicals are banned. Our teams are briefed on that before they arrive, not on the day.`,
      $localize`:@@service.industrial.p3:Industrial floors, machine surroundings, social rooms and changing areas each need different equipment and different intervals. We price them separately so you can see what drives the cost and adjust the intervals where it makes sense.`,
    ],
    highlights: [
      $localize`:@@service.industrial.h1:Works to your shift pattern`,
      $localize`:@@service.industrial.h2:Briefed on site safety rules first`,
      $localize`:@@service.industrial.h3:Separate pricing per area type`,
      $localize`:@@service.industrial.h4:Night and weekend work available`,
    ],
    includes: [
      $localize`:@@service.industrial.i1:Production halls and assembly areas`,
      $localize`:@@service.industrial.i2:Warehouses and logistics centres`,
      $localize`:@@service.industrial.i3:Workshops and vehicle bays`,
      $localize`:@@service.industrial.i4:Industrial floors and machine surroundings`,
      $localize`:@@service.industrial.i5:Social rooms and changing facilities`,
      $localize`:@@service.industrial.i6:Laboratories and server rooms`,
    ],
  },
  {
    key: 'housing',
    path: { de: 'treppenhausreinigung-dresden', en: 'stairwell-cleaning-dresden' },
    icon: 'bi-house-door',
    image: 'assets/images/services/treppenhausreinigung-wohnanlage-dresden.webp',
    title: $localize`:@@service.housing.title:Stairwell Cleaning Dresden`,
    shortTitle: $localize`:@@service.housing.shortTitle:Housing Cleaning`,
    summary: $localize`:@@service.housing.summary:Stairwells, shared areas, winter service and grounds care for property managers and housing cooperatives.`,
    metaTitle: $localize`:@@service.housing.metaTitle:Stairwell Cleaning Dresden For Property Managers | Glanzwork`,
    metaDescription: $localize`:@@service.housing.metaDescription:Stairwell and shared-area cleaning, winter service and grounds care for property managers and housing cooperatives in Dresden. One contract, one invoice.`,
    description: [
      $localize`:@@service.housing.p1:A property manager does not want three contractors for one building. We take the stairwell, the grounds and the winter service together, on one contract with one invoice and one person to call.`,
      $localize`:@@service.housing.p2:Stairwell cleaning runs to a fixed weekday so residents know when it happens and complaints drop. Where a building has a cleaning rota on the wall, we take it over and keep it visible.`,
      $localize`:@@service.housing.p3:For cooperatives and owners' associations we can report per property, which makes the annual statement easier and shows owners exactly what their service charge paid for.`,
    ],
    highlights: [
      $localize`:@@service.housing.h1:Cleaning, grounds and winter in one contract`,
      $localize`:@@service.housing.h2:Fixed weekday, visible to residents`,
      $localize`:@@service.housing.h3:Per-property reporting for statements`,
      $localize`:@@service.housing.h4:One invoice, one contact person`,
    ],
    includes: [
      $localize`:@@service.housing.i1:Stairwells and access ways`,
      $localize`:@@service.housing.i2:Shared rooms, cellars and bin stores`,
      $localize`:@@service.housing.i3:Windows in shared areas`,
      $localize`:@@service.housing.i4:Outdoor areas and bin management`,
      $localize`:@@service.housing.i5:Winter service for the property`,
      $localize`:@@service.housing.i6:Cleaning after tenant changes`,
    ],
  },
  {
    key: 'glass',
    path: { de: 'glasreinigung-dresden', en: 'window-cleaning-dresden' },
    icon: 'bi-window',
    image: 'assets/images/services/glasreinigung-fassade-dresden.webp',
    title: $localize`:@@service.glass.title:Glass & Window Cleaning`,
    shortTitle: $localize`:@@service.glass.shortTitle:Glass Cleaning`,
    summary: $localize`:@@service.glass.summary:Streak-free windows, frames and glass facades for commercial and private properties, at height where needed.`,
    metaTitle: $localize`:@@service.glass.metaTitle:Glass & Window Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.glass.metaDescription:Streak-free window, frame and glass facade cleaning for businesses and private clients in Dresden. Short-notice appointments, fair prices.`,
    description: [
      $localize`:@@service.glass.p1:Glass is the first thing a visitor looks through and the easiest thing to get visibly wrong. We clean the frames and the rebates as well as the pane, because a clean pane in a dirty frame still looks dirty.`,
      $localize`:@@service.glass.p2:For upper floors and glass facades we work with telescopic poles and purified water, and with rope access where a facade cannot be reached any other way. Both are planned and insured before anyone goes up.`,
      $localize`:@@service.glass.p3:Solar panels and conservatories are their own job: the wrong brush scratches a panel, and a scratched panel loses yield for the rest of its life. We clean them with equipment made for the surface.`,
    ],
    highlights: [
      $localize`:@@service.glass.h1:Frames and rebates, not just the glass`,
      $localize`:@@service.glass.h2:Purified water for a streak-free finish`,
      $localize`:@@service.glass.h3:Rope access for high facades`,
      $localize`:@@service.glass.h4:Short-notice appointments`,
    ],
    includes: [
      $localize`:@@service.glass.i1:Windows, frames and rebates`,
      $localize`:@@service.glass.i2:Glass facades and entrance glazing`,
      $localize`:@@service.glass.i3:Shop windows and display cases`,
      $localize`:@@service.glass.i4:Conservatories and roof glazing`,
      $localize`:@@service.glass.i5:Solar and photovoltaic panels`,
      $localize`:@@service.glass.i6:Facade cleaning and maintenance`,
    ],
  },
  {
    key: 'deepClean',
    path: { de: 'grundreinigung-bauendreinigung', en: 'deep-construction-cleaning' },
    icon: 'bi-stars',
    image: 'assets/images/services/grundreinigung-desinfektion-dresden.webp',
    title: $localize`:@@service.deepClean.title:Deep & Post-Construction Cleaning`,
    shortTitle: $localize`:@@service.deepClean.shortTitle:Deep Cleaning`,
    summary: $localize`:@@service.deepClean.summary:Deep cleans, builders' cleans and special jobs: after renovation, a move, an event or water damage.`,
    metaTitle: $localize`:@@service.deepClean.metaTitle:Deep & Post-Construction Cleaning Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.deepClean.metaDescription:Deep cleaning, post-construction and special cleaning in Dresden: after renovation, moving, events or water damage. Fast and thorough.`,
    description: [
      $localize`:@@service.deepClean.p1:A deep clean resets a building to the state a maintenance contract can hold. It is the job to book before a new tenant moves in, after building work, or when regular cleaning has fallen behind.`,
      $localize`:@@service.deepClean.p2:Builders' cleans are a different trade from ordinary cleaning: fine dust settles for days, adhesive residue and paint spots need solvents, and protective film has to come off every surface. We plan a rough clean and a fine clean, not one pass.`,
      $localize`:@@service.deepClean.p3:After water damage speed decides how much is saved. We can usually be on site the same day to remove standing water and start drying, and we work alongside your insurer's assessor rather than ahead of them.`,
    ],
    highlights: [
      $localize`:@@service.deepClean.h1:Rough clean and fine clean, planned apart`,
      $localize`:@@service.deepClean.h2:Same-day response for water damage`,
      $localize`:@@service.deepClean.h3:Handover-ready for landlords and agents`,
      $localize`:@@service.deepClean.h4:Fixed price agreed before starting`,
    ],
    includes: [
      $localize`:@@service.deepClean.i1:Deep cleaning and spring cleaning`,
      $localize`:@@service.deepClean.i2:Post-construction and fine cleaning`,
      $localize`:@@service.deepClean.i3:Cleaning after renovation`,
      $localize`:@@service.deepClean.i4:Cleaning after water damage`,
      $localize`:@@service.deepClean.i5:Event and venue cleaning`,
      $localize`:@@service.deepClean.i6:Disinfection and hygiene cleaning`,
    ],
  },
  {
    key: 'winter',
    path: { de: 'winterdienst-dresden', en: 'winter-service-dresden' },
    icon: 'bi-snow',
    image: 'assets/images/services/winterdienst-streudienst-dresden.webp',
    title: $localize`:@@service.winter.title:Winter Service Dresden`,
    shortTitle: $localize`:@@service.winter.shortTitle:Winter Service`,
    summary: $localize`:@@service.winter.summary:Snow clearing and gritting for businesses, schools, property managers and private clients, early and documented.`,
    metaTitle: $localize`:@@service.winter.metaTitle:Winter Service Dresden: Snow & Grit | Glanzwork`,
    metaDescription: $localize`:@@service.winter.metaDescription:Snow clearing and gritting for companies, schools, property managers and private clients in Dresden. Early morning, documented for your liability.`,
    description: [
      $localize`:@@service.winter.p1:In Germany the property owner carries the clearing duty, and if someone falls it is the owner who has to prove the path was cleared. A winter service contract moves that work to us — and, just as importantly, creates the record.`,
      $localize`:@@service.winter.p2:We clear before the statutory times, starting early enough that your staff and visitors arrive on a safe surface rather than watching us work. Routes are fixed in advance and driven in a set order.`,
      $localize`:@@service.winter.p3:Every call-out is logged with the time, the route and what was spread. That log is what your insurer asks for after an accident. For sensitive grounds and planting we use grit rather than salt.`,
    ],
    highlights: [
      $localize`:@@service.winter.h1:Cleared before the statutory times`,
      $localize`:@@service.winter.h2:Every call-out logged for liability`,
      $localize`:@@service.winter.h3:Takes over the owner's clearing duty`,
      $localize`:@@service.winter.h4:Grit instead of salt where needed`,
    ],
    includes: [
      $localize`:@@service.winter.i1:Snow clearing for paths and car parks`,
      $localize`:@@service.winter.i2:Gritting and ice prevention`,
      $localize`:@@service.winter.i3:Seasonal contracts for businesses`,
      $localize`:@@service.winter.i4:Winter service for property managers`,
      $localize`:@@service.winter.i5:Entrances, steps and fire routes`,
      $localize`:@@service.winter.i6:Documented call-out records`,
    ],
  },
  {
    key: 'gardening',
    path: { de: 'gartenpflege-dresden', en: 'gardening-dresden' },
    icon: 'bi-tree',
    image: 'assets/images/projects/gartenpflege-hochdruckreinigung-dresden.webp',
    title: $localize`:@@service.gardening.title:Gardening & Grounds Care`,
    shortTitle: $localize`:@@service.gardening.shortTitle:Grounds Care`,
    summary: $localize`:@@service.gardening.summary:Lawns, hedges, leaves and green spaces for businesses, housing estates and private gardens.`,
    metaTitle: $localize`:@@service.gardening.metaTitle:Gardening & Grounds Care Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.gardening.metaDescription:Lawns, hedges, leaves and green spaces: gardening and outdoor cleaning for businesses, housing estates and private clients in Dresden. One-off or yearly.`,
    description: [
      $localize`:@@service.gardening.p1:Grounds care is the other half of looking after a property. A clean building with an overgrown entrance still reads as neglected, which is why we sell it with the cleaning rather than apart from it.`,
      $localize`:@@service.gardening.p2:A yearly contract spreads the work across the seasons: cutting and hedge trimming through the summer, leaves and gutters in autumn, winter service when it turns, and a tidy-up before spring. You pay a level monthly amount instead of unpredictable invoices.`,
      $localize`:@@service.gardening.p3:Hard surfaces need cleaning too. Pressure washing lifts moss and algae off paths, terraces and car parks, which is as much a safety job as a cosmetic one once a surface turns green.`,
    ],
    highlights: [
      $localize`:@@service.gardening.h1:Yearly contract, level monthly price`,
      $localize`:@@service.gardening.h2:Sold together with your cleaning`,
      $localize`:@@service.gardening.h3:Seasonal plan agreed in advance`,
      $localize`:@@service.gardening.h4:Green waste removed and disposed of`,
    ],
    includes: [
      $localize`:@@service.gardening.i1:Lawn mowing and lawn care`,
      $localize`:@@service.gardening.i2:Hedge and shrub trimming`,
      $localize`:@@service.gardening.i3:Leaf clearing and gutter cleaning`,
      $localize`:@@service.gardening.i4:Green space care for housing estates`,
      $localize`:@@service.gardening.i5:Pressure washing of paths and terraces`,
      $localize`:@@service.gardening.i6:Car park and outdoor area cleaning`,
    ],
  },
  {
    key: 'facility',
    path: { de: 'hausmeisterservice-dresden', en: 'caretaker-service-dresden' },
    icon: 'bi-tools',
    image: 'assets/images/services/hausmeisterservice-entruempelung-dresden.webp',
    title: $localize`:@@service.facility.title:Caretaker & Facility Services`,
    shortTitle: $localize`:@@service.facility.shortTitle:Caretaker Service`,
    summary: $localize`:@@service.facility.summary:Caretaking, bin management, clearances and property supervision — everything from one contractor.`,
    metaTitle: $localize`:@@service.facility.metaTitle:Caretaker & Property Services Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.facility.metaDescription:Caretaker service, bin management, clearances and property supervision in Dresden. Everything from one provider with a named contact person.`,
    description: [
      $localize`:@@service.facility.p1:A caretaker service is the small jobs that otherwise land on whoever is nearest: bins out and back, a light replaced, a blocked gully, a contractor let in and checked on.`,
      $localize`:@@service.facility.p2:We visit on an agreed rhythm and report what we found, so a property manager with buildings across the city knows the state of each one without driving to it.`,
      $localize`:@@service.facility.p3:Clearances are the other half: a flat after a tenancy, a cellar, an estate. We sort what can be recycled from what cannot, dispose of it properly and give you the disposal receipts.`,
    ],
    highlights: [
      $localize`:@@service.facility.h1:Agreed visit rhythm with a written report`,
      $localize`:@@service.facility.h2:Bins managed to the collection calendar`,
      $localize`:@@service.facility.h3:Disposal receipts for every clearance`,
      $localize`:@@service.facility.h4:One contractor for the whole property`,
    ],
    includes: [
      $localize`:@@service.facility.i1:Caretaker rounds and small repairs`,
      $localize`:@@service.facility.i2:Bin management and collection calendar`,
      $localize`:@@service.facility.i3:Property supervision and reporting`,
      $localize`:@@service.facility.i4:Flat and cellar clearances`,
      $localize`:@@service.facility.i5:Estate and household clearances`,
      $localize`:@@service.facility.i6:Waste removal and proper disposal`,
    ],
  },
  {
    key: 'home',
    path: { de: 'haushaltsreinigung-dresden', en: 'house-cleaning-dresden' },
    icon: 'bi-house-heart',
    image: 'assets/images/services/haushaltsreinigung-kueche-dresden.webp',
    title: $localize`:@@service.home.title:Home Cleaning Dresden`,
    shortTitle: $localize`:@@service.home.shortTitle:Home Cleaning`,
    summary: $localize`:@@service.home.summary:Regular home cleaning, move-out cleaning and window cleaning for private households, insured and invoiced.`,
    metaTitle: $localize`:@@service.home.metaTitle:Home Cleaning & Domestic Help Dresden | Glanzwork`,
    metaDescription: $localize`:@@service.home.metaDescription:Regular home cleaning, move-out cleaning and window cleaning in Dresden. Reliable, insured, and invoiced properly.`,
    description: [
      $localize`:@@service.home.p1:Domestic cleaning works when it is the same person every time. You explain your home once, and after that it simply happens on the agreed day.`,
      $localize`:@@service.home.p2:We are a registered company, not an informal arrangement: our cleaners are employed, insured and declared, and you get a proper invoice. That matters if something is damaged, and it matters for the tax relief on household services.`,
      $localize`:@@service.home.p3:Move-out cleaning is its own job, done to the standard a landlord or agent inspects against, so the deposit comes back and the handover happens on the day it was booked.`,
    ],
    highlights: [
      $localize`:@@service.home.h1:The same cleaner every visit`,
      $localize`:@@service.home.h2:Employed, insured and declared staff`,
      $localize`:@@service.home.h3:Proper invoice for tax relief`,
      $localize`:@@service.home.h4:Deposit-standard move-out cleaning`,
    ],
    includes: [
      $localize`:@@service.home.i1:Regular home and apartment cleaning`,
      $localize`:@@service.home.i2:Kitchens, ovens and appliances`,
      $localize`:@@service.home.i3:Bathroom descaling and limescale removal`,
      $localize`:@@service.home.i4:Window cleaning for private homes`,
      $localize`:@@service.home.i5:Move-out and end-of-tenancy cleaning`,
      $localize`:@@service.home.i6:Holiday lets and guest changeovers`,
    ],
  },
];

/** This build's URL segment for a service. */
export const servicePath = (service: Service): string => pathIn(service.path);

/** This build's router link for a service. */
export const serviceLink = (service: Service): string => `/${servicePath(service)}`;

/** Lookup by the URL this build serves the page at. */
export const findServiceByPath = (path: string): Service | undefined =>
  SERVICES.find((service) => servicePath(service) === path);

/** Lookup by the locale-independent key, for cross-locale work such as hreflang. */
export const findServiceByKey = (key: string): Service | undefined =>
  SERVICES.find((service) => service.key === key);
