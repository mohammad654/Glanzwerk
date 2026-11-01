package com.glanzwerk.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

class RateLimiterTest {

    @Test
    void allowsUpToTheLimitThenRefuses() {
        var limiter = new RateLimiter();

        for (var attempt = 1; attempt <= 3; attempt++) {
            assertThat(limiter.tryAcquire("ip", 3, Duration.ofMinutes(5)))
                    .as("attempt %d", attempt)
                    .isTrue();
        }

        assertThat(limiter.tryAcquire("ip", 3, Duration.ofMinutes(5))).isFalse();
    }

    @Test
    void countsEachKeySeparately() {
        var limiter = new RateLimiter();

        assertThat(limiter.tryAcquire("first", 1, Duration.ofMinutes(5))).isTrue();
        assertThat(limiter.tryAcquire("first", 1, Duration.ofMinutes(5))).isFalse();
        // One caller exhausting their allowance must not lock out everyone else.
        assertThat(limiter.tryAcquire("second", 1, Duration.ofMinutes(5))).isTrue();
    }

    /**
     * The failed-login budget is keyed on the account, so it has to be spendable on the
     * *failure* rather than on the attempt. Charging it up front would let anybody lock
     * an account out by submitting rubbish for its address.
     */
    @Test
    void readingAKeyDoesNotSpendAnyOfIt() {
        var limiter = new RateLimiter();

        assertThat(limiter.isExhausted("account", 2)).isFalse();
        assertThat(limiter.isExhausted("account", 2)).isFalse();
        // Still the full allowance, however many times it was asked about.
        assertThat(limiter.tryAcquire("account", 2, Duration.ofMinutes(5))).isTrue();
        assertThat(limiter.tryAcquire("account", 2, Duration.ofMinutes(5))).isTrue();
        assertThat(limiter.tryAcquire("account", 2, Duration.ofMinutes(5))).isFalse();
    }

    @Test
    void reportsAKeyAsExhaustedOnceItsBudgetIsSpent() {
        var limiter = new RateLimiter();

        assertThat(limiter.record("account", Duration.ofMinutes(15))).isEqualTo(1);
        assertThat(limiter.isExhausted("account", 2)).isFalse();

        assertThat(limiter.record("account", Duration.ofMinutes(15))).isEqualTo(2);
        assertThat(limiter.isExhausted("account", 2)).isTrue();
    }

    @Test
    void forgetsAnExhaustedKeyOnceItsWindowHasPassed() {
        var limiter = new RateLimiter();

        limiter.record("account", Duration.ZERO);
        // A zero-length window is already over, so the budget is back.
        assertThat(limiter.isExhausted("account", 1)).isFalse();
    }

    @Test
    void startsAFreshWindowOnceTheOldOneHasPassed() {
        var limiter = new RateLimiter();

        assertThat(limiter.tryAcquire("ip", 1, Duration.ZERO)).isTrue();
        // A zero-length window is already over, so the next call is a new one.
        assertThat(limiter.tryAcquire("ip", 1, Duration.ZERO)).isTrue();
    }
}
