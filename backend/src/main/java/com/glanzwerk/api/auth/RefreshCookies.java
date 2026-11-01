package com.glanzwerk.api.auth;

import java.time.Duration;
import java.util.List;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * The two cookies a session consists of, built in one place.
 *
 * Three endpoints set them — sign-in, sign-out and changing a password — and every
 * attribute is load-bearing. A second hand-written copy is a copy that can disagree,
 * and the failure would be silent: the session would simply work, with one attribute
 * fewer.
 *
 * <p><b>The refresh token</b> is the credential. {@code HttpOnly} keeps it away from any
 * injected script, {@code Secure} keeps it off plain HTTP, the narrow path keeps it from
 * being attached to every API call, and {@code SameSite} keeps a cross-site form post
 * from replaying it.
 *
 * <p><b>The hint</b> carries no credential at all — just the fact that the cookie above
 * exists. It is deliberately readable by JavaScript, because the SPA cannot see an
 * HttpOnly cookie and so could not tell "signed out" from "signed in, token lost to a
 * reload": it asked {@code /auth/refresh} on every single page load and took a 401 for
 * the overwhelming majority of visitors, who have no session. The hint lets it not ask.
 * Both cookies are written in the same response with the same lifetime, so they lapse
 * together; if the hint is ever lost on its own the cost is that the visitor looks
 * signed out until they sign in again, which is why nothing is ever *authorised* by it.
 */
@Component
@RequiredArgsConstructor
public class RefreshCookies {
    static final String REFRESH_NAME = "refreshToken";

    /** Must match {@code SESSION_HINT_COOKIE} in the frontend's `auth.service.ts`. */
    static final String HINT_NAME = "glanzwerkSession";

    /** Scoped to the auth endpoints, so the credential is not sent with every call. */
    private static final String REFRESH_PATH = "/api/v1/auth";

    /** Site-wide: the hint has to be readable on whichever page the visitor landed on. */
    private static final String HINT_PATH = "/";

    private final JwtConfig jwtConfig;

    /** Cookies carrying a live session, lasting as long as the refresh token does. */
    public List<ResponseCookie> issue(Jwt refreshToken) {
        var maxAge = jwtConfig.getRefreshTokenExpiration();
        return List.of(
                refresh(refreshToken.toString(), maxAge),
                hint("1", maxAge));
    }

    /** Immediately-expiring empty cookies, which is how a sign-out ends a session. */
    public List<ResponseCookie> clear() {
        return List.of(refresh("", 0), hint("", 0));
    }

    private ResponseCookie refresh(String value, int maxAgeSeconds) {
        return base(REFRESH_NAME, value, REFRESH_PATH, maxAgeSeconds)
                .httpOnly(true)
                .build();
    }

    private ResponseCookie hint(String value, int maxAgeSeconds) {
        return base(HINT_NAME, value, HINT_PATH, maxAgeSeconds)
                // Readable on purpose. See the class comment.
                .httpOnly(false)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder base(
            String name, String value, String path, int maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .secure(jwtConfig.isCookieSecure())
                .path(path)
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                // Lax still sends the cookie on the SPA's own fetch to a same-site API,
                // while keeping it off a cross-site form post.
                .sameSite("Lax");
    }
}
