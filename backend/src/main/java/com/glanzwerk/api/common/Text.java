package com.glanzwerk.api.common;

/**
 * The two normalisations every inbound string goes through.
 *
 * Shared because the rules have to be identical everywhere: an email stored with a
 * capital letter in one place and lowercased in another is an account that cannot
 * sign in, and a column holding {@code ""} in some rows and {@code NULL} in others
 * needs every query to check for both.
 */
public final class Text {
    private Text() {
    }

    /** Emails are compared case-insensitively, so they are stored one way. */
    public static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    /** An optional field the user left blank is absent, not an empty string. */
    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * A search box's text as a {@code LIKE} pattern: lowercased, wrapped in wildcards,
     * and with the wildcards the user typed escaped so they are matched literally.
     *
     * The escaping is the part that matters. Without it a search for {@code %} is the
     * pattern {@code %%%}, which matches every row in the table — and {@code _} matches
     * any single character, so a search for {@code a_b} quietly found {@code axb}. The
     * value is a bound parameter either way, so this was never an injection; it was the
     * search box answering a question nobody asked.
     *
     * The queries that take this declare {@code escape '\'} so the backslash is read as
     * an escape rather than as data. Null for nothing worth searching for, which every
     * query treats as "no filter".
     */
    public static String likePattern(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        var escaped = query.trim().toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");

        return "%" + escaped + "%";
    }
}
