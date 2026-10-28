// The company's NAP (name, address, phone) — the one record every visible contact
// detail and the LocalBusiness structured data read from. Local search ranks on NAP
// consistency, so these values must match the Google Business Profile character for
// character. A wrong value here is a wrong value in Google.
//
// Source: Glanzwork Growth & SEO Guide, 28 October 2026.
export const COMPANY = {
  name: 'Glanzwork',
  /** Owner and managing director; the `founder` node in the structured data. */
  founder: 'Laura Zeqiri',
  // TODO: the guide's 90-day plan calls for a mailbox on the company domain — large
  // clients and public tenders distrust a free webmail address.
  email: 'glanzwerk.info2025@gmail.com',
  /** As printed on the site. Dialling uses `phoneHref`, which must stay E.164. */
  phone: '0178 4550242',
  phoneHref: '+491784550242',
  openingHours: $localize`:@@company.openingHours:9:00 am - 6:00 pm`,
  address: {
    street: 'Limbacher Weg 16',
    postalCode: '01169',
    city: 'Dresden',
    region: 'Sachsen',
    country: 'DE',
  },
  /**
   * The Einsatzgebiet, home city first. Drives the "serving X" copy and the
   * LocalBusiness areaServed — the ring the guide says to win after Dresden itself.
   */
  areaServed: ['Dresden', 'Radebeul', 'Freital', 'Pirna', 'Heidenau', 'Coswig', 'Meißen'],
  /** Office hours. The emergency line is separate and advertised as 24/7. */
  openingHoursSpec: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  /** International clients and expats are an explicit target group for the English site. */
  languages: ['de', 'en'],
} as const;

export const ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}`;

/** The home city on its own reads better in a headline than the whole list. */
export const PRIMARY_CITY = COMPANY.address.city;

export const SOCIAL_LINKS = [
  { label: 'Facebook', icon: 'bi-facebook', url: 'https://www.facebook.com/' },
  { label: 'Instagram', icon: 'bi-instagram', url: 'https://www.instagram.com/' },
  { label: 'LinkedIn', icon: 'bi-linkedin', url: 'https://www.linkedin.com/' },
] as const;
