package com.glanzwerk.api.employees;

/**
 * The three states the dashboard shows. Two of them come from the profile and the
 * third from the account, which is why this is not the stored {@link EmployeeStatus}.
 */
public enum EmployeeDisplayStatus {
    ACTIVE,
    ON_LEAVE,
    INACTIVE
}
