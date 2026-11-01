package com.glanzwerk.api.auth;

import java.util.Optional;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.glanzwerk.api.users.Role;

/**
 * Who is calling, read from the security context rather than from the request.
 *
 * Every endpoint that acts "on my own data" goes through here, which is what keeps
 * one user from passing another user's id and being served their records.
 */
@Component
public class CurrentUser {

    public Optional<Long> id() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || !(authentication.getPrincipal() instanceof Long userId)) {
            return Optional.empty();
        }
        return Optional.of(userId);
    }

    /** The caller's id. Only call this from an endpoint that requires authentication. */
    public Long requireId() {
        return id().orElseThrow(() -> new UsernameNotFoundException("Not authenticated"));
    }

    public boolean hasRole(Role role) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role.name()));
    }

    public boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }
}
