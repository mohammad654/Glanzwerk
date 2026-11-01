package com.glanzwerk.api.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * The caller's address, for rate limiting only.
 *
 * {@code X-Forwarded-For} is trusted only when the app is told it sits behind a proxy
 * (see {@code server.forward-headers-strategy}); a client can set that header freely,
 * so trusting it unconditionally would let anyone reset their own rate limit by
 * inventing an address. {@code getRemoteAddr()} is already proxy-corrected by Spring
 * Boot when that strategy is enabled, which is why nothing here reads the header.
 */
public final class RequestIp {
    private RequestIp() {
    }

    public static String of(HttpServletRequest request) {
        var address = request.getRemoteAddr();
        return address == null || address.isBlank() ? "unknown" : address;
    }
}
