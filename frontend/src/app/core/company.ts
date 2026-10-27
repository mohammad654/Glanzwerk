// Placeholders — swap for the real Glanzwerk details. Everything that shows a
// phone number, email or address reads them from here, including the LocalBusiness
// structured data, so a wrong value here is also a wrong value in Google.
export const COMPANY = {
  name: 'Glanzwerk',
  email: 'hello@glanzwerk.de',
  phone: '+49 123 456 789',
  openingHours: $localize`:@@company.openingHours:9:00 am - 6:00 pm`,
  address: {
    street: 'Musterstraße 12',
    postalCode: '10115',
    city: 'Berlin',
    country: 'DE',
  },
  /** Drives the "serving X" copy and the LocalBusiness areaServed. */
  areaServed: 'Berlin',
  // The top bar needs prose, structured data needs machine-readable times.
  openingHoursSpec: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
} as const;

export const ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}`;

export const SOCIAL_LINKS = [
  { label: 'Facebook', icon: 'bi-facebook', url: 'https://www.facebook.com/' },
  { label: 'Instagram', icon: 'bi-instagram', url: 'https://www.instagram.com/' },
  { label: 'LinkedIn', icon: 'bi-linkedin', url: 'https://www.linkedin.com/' },
] as const;
