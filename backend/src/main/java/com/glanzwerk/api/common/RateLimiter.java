package com.glanzwerk.api.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

/**
 * A fixed-window counter per key, held in memory.
 *
 * It exists to blunt the abuse the unauthenticated endpoints invite: a script posting
 * a thousand enquiries, or working through a password list. It is per instance and per
 * process, so behind more than one replica the effective limit is the limit times the
 * replica count — good enough for a single-node deployment, and the point at which to
 * move the counter into Redis or a reverse proxy.
 *
 * Expired windows are swept so an abandoned key cannot keep its entry alive and the map
 * cannot grow without bound. The sweep is amortised rather than run on every call: it
 * walks the whole map, and doing that per request made every rate-limited endpoint
 * O(number of distinct keys) — which is backwards, because the keys multiply exactly
 * when the endpoint is under attack.
 */
@Component
public class RateLimiter {
    /**
     * How many writes pass between sweeps. The map therefore holds at most this many
     * expired entries at a time, which bounds it without touching every key per call.
     */
    private static final int WRITES_PER_SWEEP = 256;

    private record Window(Instant resetAt, int count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    private final AtomicInteger writesSinceSweep = new AtomicInteger();

    /** True when this call is within the allowance, false when it should be rejected. */
    public boolean tryAcquire(String key, int limit, Duration window) {
        return record(key, window) <= limit;
    }

    /**
     * Counts one event against a key and answers the running total.
     *
     * Separate from {@link #tryAcquire} because a failed-login budget has to be spent
     * on the *failure*, which is only known after the attempt: charging it up front
     * would let anybody lock an account out by submitting rubbish for it.
     */
    public int record(String key, Duration window) {
        var now = Instant.now();
        sweepOccasionally(now);

        var updated = windows.compute(key, (ignored, current) ->
                current == null || current.resetAt().isBefore(now)
                        ? new Window(now.plus(window), 1)
                        : new Window(current.resetAt(), current.count() + 1));

        return updated.count();
    }

    /** Whether a key has already used up its allowance, without spending any of it. */
    public boolean isExhausted(String key, int limit) {
        var current = windows.get(key);
        return current != null
                && !current.resetAt().isBefore(Instant.now())
                && current.count() >= limit;
    }

    private void sweepOccasionally(Instant now) {
        if (writesSinceSweep.incrementAndGet() < WRITES_PER_SWEEP) {
            return;
        }
        writesSinceSweep.set(0);
        windows.entrySet().removeIf(entry -> entry.getValue().resetAt().isBefore(now));
    }
}
