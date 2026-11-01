package com.glanzwerk.api.employees;

/**
 * Whether someone can be scheduled right now.
 *
 * There is no {@code INACTIVE} member on purpose. "No longer with us" is the account
 * being deactivated — {@code users.is_active} — and storing it here as well would
 * give the same fact two homes and two chances to disagree. The DTO derives the third
 * display state from the account, so the dashboard still shows all three.
 */
public enum EmployeeStatus {
    ACTIVE,
    ON_LEAVE
}
