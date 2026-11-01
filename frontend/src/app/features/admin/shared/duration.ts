/**
 * Minutes as hours and minutes — "3:30 h", or "4 h" when it lands on the hour.
 *
 * Deliberately not a locale message: digits, a colon and "h" read the same in both
 * languages, and a translatable template here would be a string nobody translates
 * differently.
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}:${String(rest).padStart(2, '0')} h` : `${hours} h`;
};
