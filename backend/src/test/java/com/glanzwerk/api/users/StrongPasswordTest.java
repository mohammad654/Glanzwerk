package com.glanzwerk.api.users;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * The password policy is now declared once, on {@link StrongPassword}, instead of
 * hand-copied onto three request bodies.
 *
 * Two things are worth pinning down. That the rules still bite — the whole point of
 * sharing them was that one copy could not be relaxed on its own — and that a failure
 * still comes back under the field's own name, because the account forms mark the input
 * from {@code fieldErrors} and would silently stop doing so if the path changed.
 */
class StrongPasswordTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void startValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @Test
    void acceptsAPasswordThatMeetsEveryRule() {
        assertThat(violationsFor("Sicher123")).isEmpty();
    }

    @Test
    void refusesOneThatIsTooShortOrMissingACharacterClass() {
        assertThat(violationsFor("Sich12")).isNotEmpty();      // under eight
        assertThat(violationsFor("sicher123")).isNotEmpty();   // no upper case
        assertThat(violationsFor("SICHER123")).isNotEmpty();   // no lower case
        assertThat(violationsFor("SicherPass")).isNotEmpty();  // no digit
        assertThat(violationsFor("")).isNotEmpty();
        assertThat(violationsFor(null)).isNotEmpty();
    }

    @Test
    void refusesOnePastBcryptsSeventyTwoCharacterLimit() {
        // Anything beyond it is ignored when hashing, so accepting it would quietly
        // weaken the password the user thought they had chosen.
        assertThat(violationsFor("Aa1" + "x".repeat(70))).isNotEmpty();
        assertThat(violationsFor("Aa1" + "x".repeat(69))).isEmpty();
    }

    @Test
    void reportsOneMessageUnderTheFieldsOwnName() {
        var violations = validator.validate(register("sicher"));

        // ReportAsSingleViolation: a password that breaks three rules is one message,
        // not a stack of them, and it names `password` so the form marks that input.
        assertThat(paths(violations)).containsExactly("password");
        assertThat(violations).hasSize(1);
    }

    private static Set<ConstraintViolation<RegisterRequest>> violationsFor(String password) {
        return validator.validateProperty(register(password), "password");
    }

    private static Set<String> paths(Set<? extends ConstraintViolation<?>> violations) {
        return violations.stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    private static RegisterRequest register(String password) {
        var request = new RegisterRequest();
        request.setName("A Client");
        request.setEmail("client@example.de");
        request.setPassword(password);
        return request;
    }
}
