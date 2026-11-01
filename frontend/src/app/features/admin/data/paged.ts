/** A page of rows, exactly as `PagedResponse<T>` sends it. */
export interface Paged<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export const emptyPage = <T>(): Paged<T> => ({
  items: [],
  page: 0,
  size: 0,
  totalItems: 0,
  totalPages: 0,
});
