/**
 * Case-insensitive "contains" across several fields, with an empty query matching
 * everything. Every admin table filters this way, so the rule lives in one place
 * rather than being re-typed slightly differently on each page.
 */
export const matchesQuery = (query: string, ...fields: (string | undefined)[]): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return fields.some((field) => field?.toLowerCase().includes(needle));
};
