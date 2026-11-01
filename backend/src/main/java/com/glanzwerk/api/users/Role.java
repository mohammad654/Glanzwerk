package com.glanzwerk.api.users;

/**
 * What a signed-in account may do.
 *
 * Public registration always produces {@link #CLIENT}. There is no EMPLOYEE member:
 * staff are plain records in {@code employees} with no password and no way to sign
 * in, so there is no such thing as an employee account to hold a role. {@link #ADMIN}
 * exists only on accounts created directly in the database — not even the dashboard
 * can mint one.
 */
public enum Role {
    CLIENT,
    ADMIN
}
