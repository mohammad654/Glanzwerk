/**
 * The roles the backend issues. Public registration only ever produces `CLIENT`.
 *
 * There is no `EMPLOYEE`: staff are plain records with no account and no way to sign
 * in, so there is no token that could carry such a role. See `Role` on the server.
 */
export type Role = 'CLIENT' | 'ADMIN';

/** An account, as `UserDto` sends it. No password field exists on the wire. */
export interface AuthUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: Role;
  readonly active: boolean;
  readonly createdAt: string;
}

/**
 * What `/auth/login` and `/auth/refresh` answer with.
 *
 * There is no refresh token here on purpose: it travels as an HttpOnly cookie, which
 * no script on the page can read. The access token is short-lived and stays in memory.
 */
export interface SessionResponse {
  readonly accessToken: string;
  /** Seconds the access token is good for. */
  readonly expiresIn: number;
  readonly user: AuthUser;
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface Registration {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
}

/** A reset link being redeemed: the token out of the URL and the new password. */
export interface PasswordReset {
  readonly token: string;
  readonly password: string;
}
