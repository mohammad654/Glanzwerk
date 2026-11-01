import { API_BASE_URL } from '../build-env';

/**
 * An API URL from a path.
 *
 * Every call goes through here rather than interpolating the base URL at the call
 * site, so there is exactly one place that knows where the API is — and one place to
 * change when it moves.
 */
export const api = (path: string): string => `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
