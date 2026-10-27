export interface Service {
  slug: string;
  title: string;
  /** Short label for compact places: menus, chips, footers. */
  shortTitle: string;
  icon: string;
  image: string;
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

export const SERVICES: readonly Service[] = [
  {
    slug: 'home-cleaning',
    title: 'Home & Apartment Cleaning',
    shortTitle: 'Home Cleaning',
    icon: 'bi-house-heart',
    image: 'assets/images/services/home-cleaning.jpg',
    summary:
      'Regular, deep, and move-in or move-out cleaning for houses and apartments, booked weekly or as a one-off.',
    metaTitle: 'Home & Apartment Cleaning Services | Glanzwerk',
    metaDescription:
      'Professional house and apartment cleaning: regular visits, deep cleans, and move-in or move-out cleaning. Insured, vetted cleaners. Get a free quote today.',
    description: [
      'We take the cleaning off your list: the same cleaner, on the same day, to a standard you agree with us once and then stop thinking about.',
      'Regular visits cover the whole home: kitchens degreased, bathrooms descaled, floors vacuumed and mopped, surfaces dusted, beds changed and the bins taken out. Deep cleans go further, into ovens, behind appliances, through tile grout and limescale.',
      'Moving house is where cleaning matters most and time is shortest. Our move-out cleans are built to meet landlord and letting-agent standards, so deposits come back and handovers happen on schedule.',
    ],
    highlights: [
      'The same trusted cleaner every visit',
      'Weekly, fortnightly or one-off bookings',
      'Deposit-standard move-out cleaning',
      'Fully insured and background-checked staff',
    ],
    includes: [
      'Regular house and apartment cleaning',
      'Deep cleaning and spring cleaning',
      'Oven, fridge and appliance cleaning',
      'Bathroom descaling and limescale removal',
      'End-of-tenancy and move-out cleaning',
      'Cleaning after renovation or decorating',
    ],
  },
  {
    slug: 'commercial-cleaning',
    title: 'Office & Commercial Cleaning',
    shortTitle: 'Commercial Cleaning',
    icon: 'bi-building',
    image: 'assets/images/services/commercial-cleaning.jpg',
    summary:
      'Contract cleaning for offices, shops, warehouses and hospitality, scheduled around your opening hours.',
    metaTitle: 'Office & Commercial Cleaning Contracts | Glanzwerk',
    metaDescription:
      'Reliable commercial cleaning for offices, retail, warehouses and hospitality. Written specification, fixed teams, out-of-hours scheduling. Request a free site survey.',
    description: [
      'Clients judge a commercial contract on how it holds up over months. Every contract starts with a written specification setting out each task and how often it happens, which makes the standard measurable.',
      'Your site gets a fixed team and a named supervisor. The same people attend each visit, so they learn the building and answer for the result.',
      'We work before you open, after you close, or overnight. Offices, shops, showrooms, warehouses, gyms, restaurants and shared apartment buildings are all covered, on schedules from daily to monthly.',
    ],
    highlights: [
      'Written cleaning specification per site',
      'Fixed team and named supervisor',
      'Out-of-hours and overnight scheduling',
      'Consumables managed and restocked',
    ],
    includes: [
      'Daily and weekly office cleaning',
      'Retail, showroom and shop cleaning',
      'Warehouse and industrial cleaning',
      'Restaurant and hospitality cleaning',
      'Stairwells, lobbies and common areas',
      'Washroom hygiene and consumables',
    ],
  },
  {
    slug: 'moving-relocation',
    title: 'Moving & Relocation Help',
    shortTitle: 'Moving Help',
    icon: 'bi-box-seam',
    image: 'assets/images/services/moving-relocation.jpg',
    summary:
      'Packing, loading, furniture handling and unpacking, on its own or combined with your move-out clean.',
    metaTitle: 'Moving & Relocation Services | Packing & Removals | Glanzwerk',
    metaDescription:
      'Moving help when you need it: packing, loading, furniture handling, unpacking and post-move cleaning. Combine your move and clean with one team. Free quote.',
    description: [
      'Most moves go wrong in the gap between companies: the removals firm leaves, and the cleaning still has to happen before the keys go back. We do both, so there is no gap.',
      'Our teams pack and label, wrap and protect furniture, load and unload, dismantle and reassemble, and unpack at the other end. We can handle the whole move or simply add extra hands on the day your removal company is stretched.',
      'Combine it with a move-out clean of the old property and a pre-arrival clean of the new one, and the whole changeover sits with one team on one invoice.',
    ],
    highlights: [
      'Packing, labelling and unpacking',
      'Furniture dismantling and reassembly',
      'Extra moving labour at short notice',
      'Combined move-and-clean packages',
    ],
    includes: [
      'Packing and unpacking boxes',
      'Loading and unloading vehicles',
      'Moving furniture between rooms or properties',
      'Furniture assembly and disassembly',
      'Support for professional removal companies',
      'Cleaning of both old and new property',
    ],
  },
  {
    slug: 'snow-outdoor',
    title: 'Snow & Outdoor Services',
    shortTitle: 'Snow & Outdoor',
    icon: 'bi-snow',
    image: 'assets/images/services/snow-outdoor.jpg',
    summary:
      'Snow clearing, gritting, pressure washing and seasonal outdoor cleanup, documented on every visit.',
    metaTitle: 'Snow Removal, Gritting & Pressure Washing | Glanzwerk',
    metaDescription:
      'Winter service and outdoor cleaning: snow clearing, de-icing and gritting, pressure washing, gutters and seasonal cleanup. Every deployment logged. Get a quote.',
    description: [
      'Property owners carry a legal duty of care to keep entrances and paths safe in winter. Passing that duty to a contractor only protects you if the contractor documents the work, so we log every deployment with the time, the location, the material used and the operative responsible.',
      'Routes are cleared before the working day starts, prioritised by entrance and footfall. Driveways, pavements, car parks and business entrances are all covered, including overnight and holiday call-outs.',
      'Outside winter the same teams handle pressure washing, patios and driveways, gutters, moss and algae removal, leaf clearance and general seasonal tidying.',
    ],
    highlights: [
      'Cleared before the working day begins',
      'Every deployment logged for your records',
      'Overnight and holiday call-outs',
      'Pressure washing and seasonal cleanup',
    ],
    includes: [
      'Snow shovelling and driveway clearing',
      'De-icing, gritting and salt application',
      'Car park and business entrance clearing',
      'Pressure washing of paving and facades',
      'Gutter clearing and leaf removal',
      'Moss, algae and graffiti removal',
    ],
  },
  {
    slug: 'emergency-24-7',
    title: 'Emergency & 24/7 Cleaning',
    shortTitle: 'Emergency 24/7',
    icon: 'bi-lightning-charge',
    image: 'assets/images/services/emergency-247.jpg',
    summary:
      'Same-day, overnight, weekend and holiday call-outs for when something cannot wait until Monday.',
    metaTitle: 'Emergency & 24/7 Cleaning Services | Same-Day | Glanzwerk',
    metaDescription:
      'Emergency cleaning around the clock: same-day appointments, overnight shifts, weekends and holidays. Spills, after-party, flood cleanup and urgent call-outs.',
    description: [
      'Some jobs cannot wait for the next scheduled visit. A spill before a client arrives, a property that has to be ready tonight, a venue that needs resetting before it opens in the morning.',
      'We hold capacity for same-day and out-of-hours work: night shifts, weekends and public holidays. Call us and you will hear straight away what we can do and when.',
      'Typical call-outs include spill response, after-party and event cleanup, urgent washroom cleaning, initial flood cleanup and overnight property preparation.',
    ],
    highlights: [
      'Same-day appointments where capacity allows',
      'Nights, weekends and public holidays',
      'Spill, flood and incident response',
      'A straight answer when you call',
    ],
    includes: [
      'Same-day and last-minute cleaning',
      'Overnight and night-shift cleaning',
      'After-party and event cleanup',
      'Emergency spill and flood response',
      'Urgent washroom and kitchen cleaning',
      'Weekend and holiday call-outs',
    ],
  },
  {
    slug: 'property-maintenance',
    title: 'Property Maintenance & Support',
    shortTitle: 'Property Support',
    icon: 'bi-tools',
    image: 'assets/images/services/property-maintenance.jpg',
    summary:
      'Furniture assembly, small repairs, garden tidying and the household jobs that never quite get done.',
    metaTitle: 'Property Maintenance & Handyman Support | Glanzwerk',
    metaDescription:
      'Practical property support: furniture assembly, small repairs, curtain and shelf fitting, garden tidying and landlord property checks. One team, one call.',
    description: [
      'Most properties accumulate a list of small jobs that are each too minor to call a tradesperson for, and together take a whole weekend. We work through that list.',
      'Furniture assembled, pictures and mirrors hung, blinds and curtain rails fitted, bulbs replaced, shelves put up, rooms rearranged. We also handle basic garden tidying, leaf clearance and bin cleaning.',
      'For landlords and letting agents we also handle property checks, key coordination and preparing a home between tenants, so a property is viewing-ready without you attending in person.',
    ],
    highlights: [
      'Furniture assembly and disassembly',
      'Small repairs and fittings',
      'Garden tidying and outdoor upkeep',
      'Landlord property checks and key handling',
    ],
    includes: [
      'Flat-pack furniture assembly',
      'Hanging pictures, mirrors and shelves',
      'Curtain rails and blind installation',
      'Minor repairs and touch-up painting',
      'Basic garden and path tidying',
      'Preparing properties between tenants',
    ],
  },
  {
    slug: 'waste-removal',
    title: 'Waste Removal & Clearance',
    shortTitle: 'Waste Clearance',
    icon: 'bi-trash3',
    image: 'assets/images/services/waste-removal.jpg',
    summary:
      'Bulky waste, furniture disposal, decluttering and full property clearance, loaded and taken away.',
    metaTitle: 'Waste Removal, House & Office Clearance | Glanzwerk',
    metaDescription:
      'Bulky waste collection, furniture disposal, decluttering and full house or office clearance. We load, remove and recycle responsibly. Request a free quote.',
    description: [
      'Clearance is heavy, awkward work, and it gets put off because it needs a van, two people to lift and somewhere to take the load. We bring all of that.',
      'Old sofas and mattresses, garage and loft clearances, office furniture, moving boxes and garden waste: we carry it out, load it and dispose of it responsibly, separating what can be recycled or donated.',
      'For full property clearances we work room by room, sorting what stays, what goes and what is worth keeping, which makes the job far less overwhelming than facing it alone.',
    ],
    highlights: [
      'We carry, load and take it away',
      'Responsible recycling and donation',
      'Single items or whole properties',
      'Decluttering help, room by room',
    ],
    includes: [
      'Bulky waste and furniture disposal',
      'Mattress and sofa removal',
      'Garage, loft and basement clearance',
      'Office and commercial clearance',
      'Garden and green waste collection',
      'Full property clearance after a move',
    ],
  },
];

export const servicePath = (slug: string): string => `services/${slug}`;

/** The same route as a router link. */
export const serviceLink = (slug: string): string => `/${servicePath(slug)}`;

export const findService = (slug: string): Service | undefined =>
  SERVICES.find((service) => service.slug === slug);
