package com.glanzwerk.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * {@link Text#likePattern} is the one of these three with teeth. The search boxes in
 * the dashboard feed it straight from the user, and an unescaped {@code %} turned
 * "find this" into "match everything".
 */
class TextTest {

    @Test
    void wrapsASearchTermInWildcardsAndLowercasesIt() {
        assertThat(Text.likePattern("  Müller  ")).isEqualTo("%müller%");
    }

    @Test
    void treatsNothingWorthSearchingForAsNoFilter() {
        assertThat(Text.likePattern(null)).isNull();
        assertThat(Text.likePattern("")).isNull();
        assertThat(Text.likePattern("   ")).isNull();
    }

    @Test
    void escapesTheWildcardsTheUserTyped() {
        // Without this, a search for "%" is the pattern "%%%" — every row in the table.
        assertThat(Text.likePattern("%")).isEqualTo("%\\%%");
        // And "_" matched any single character, so "a_b" quietly found "axb".
        assertThat(Text.likePattern("a_b")).isEqualTo("%a\\_b%");
    }

    @Test
    void escapesTheEscapeCharacterItself() {
        // Escaped first, or escaping the wildcards would produce a dangling backslash
        // and the database would reject the pattern.
        assertThat(Text.likePattern("c:\\temp")).isEqualTo("%c:\\\\temp%");
        assertThat(Text.likePattern("\\%")).isEqualTo("%\\\\\\%%");
    }

    @Test
    void normalisesAnEmailForStorageAndComparison() {
        assertThat(Text.normalizeEmail("  Client@Example.DE ")).isEqualTo("client@example.de");
        assertThat(Text.normalizeEmail(null)).isNull();
    }

    @Test
    void treatsABlankOptionalFieldAsAbsent() {
        assertThat(Text.blankToNull("   ")).isNull();
        assertThat(Text.blankToNull(null)).isNull();
        assertThat(Text.blankToNull("  0351 1234  ")).isEqualTo("0351 1234");
    }
}
