package com.glanzwerk.api.users;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glanzwerk.api.auth.AuthService;
import com.glanzwerk.api.auth.CurrentUser;
import com.glanzwerk.api.auth.JwtConfig;
import com.glanzwerk.api.auth.RefreshCookies;
import com.glanzwerk.api.auth.SessionResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Self-service for the signed-in account.
 *
 * There is deliberately no {@code /users/{id}} and no {@code GET /users} here. The
 * tutorial scaffold this replaced had both, unguarded, which let any authenticated
 * client read, rename and delete any other account by guessing an id. Everything
 * acts on the caller's own id, taken from the token and never from the URL, so there
 * is no id to tamper with. Administrators manage other people's accounts through
 * {@code /admin/employees} and {@code /admin/clients}.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthService authService;
    private final RefreshCookies refreshCookies;
    private final JwtConfig jwtConfig;
    private final CurrentUser currentUser;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto me() {
        return userService.get(currentUser.requireId());
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUser.requireId(), request);
    }

    /**
     * Changes the caller's password and hands back a brand-new session.
     *
     * Changing a password revokes every refresh token issued before it, which is the
     * point — a session somebody else is holding stops working. That would include the
     * caller's own, so a fresh access token and refresh cookie go out in this response
     * and the person who made the change stays signed in. Returning 204 here would log
     * them out of the page they are standing on.
     */
    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SessionResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        var user = userService.changePassword(currentUser.requireId(), request);
        var session = authService.startSession(user);

        var response = ResponseEntity.ok();
        refreshCookies.issue(session.refreshToken())
                .forEach(cookie -> response.header(HttpHeaders.SET_COOKIE, cookie.toString()));

        return response.body(new SessionResponse(
                session.accessToken().toString(),
                jwtConfig.getAccessTokenExpiration(),
                session.user()));
    }
}
