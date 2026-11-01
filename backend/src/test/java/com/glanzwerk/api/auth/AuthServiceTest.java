package com.glanzwerk.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.function.UnaryOperator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;

import com.glanzwerk.api.common.InvalidCredentialsException;
import com.glanzwerk.api.users.Role;
import com.glanzwerk.api.users.User;
import com.glanzwerk.api.users.UserDto;
import com.glanzwerk.api.users.UserMapper;
import com.glanzwerk.api.users.UserRepository;

import io.jsonwebtoken.ClaimsBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Sign-in reports which half of the credentials was wrong. That is a deliberate
 * trade — see {@link InvalidCredentialsException} — so these tests pin the three
 * answers down: unknown address, wrong password, and the blocked account that is
 * told neither.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, new UserMapperStub(), jwtService);
    }

    @Test
    void namesTheEmailFieldWhenNoAccountHasTheAddress() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.de")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(login("Nobody@Example.DE", "Sicher123")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting(failure -> ((InvalidCredentialsException) failure).getField())
                .isEqualTo("email");

        // Nothing is sent to the password check for an address we have never seen.
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void namesThePasswordFieldWhenTheAccountExistsButThePasswordDoesNot() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(client()));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("nope"));

        assertThatThrownBy(() -> authService.login(login("client@example.de", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting(failure -> ((InvalidCredentialsException) failure).getField())
                .isEqualTo("password");
    }

    @Test
    void tellsADeactivatedAccountNothingAtAll() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(client()));
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("blocked"));

        // Not an InvalidCredentialsException: a blocked account must not learn that
        // its password was right, and the caller must not learn that it is blocked.
        assertThatThrownBy(() -> authService.login(login("client@example.de", "Sicher123")))
                .isInstanceOf(BadCredentialsException.class)
                .isNotInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void signsInWithTheNormalisedAddress() {
        when(userRepository.findByEmailIgnoreCase("client@example.de")).thenReturn(Optional.of(client()));
        when(authenticationManager.authenticate(any())).thenReturn(org.mockito.Mockito.mock(Authentication.class));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn(null);
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn(null);

        var result = authService.login(login("  Client@Example.DE  ", "Sicher123"));

        assertThat(result.user().email()).isEqualTo("client@example.de");
    }

    // ------------------------------------------------- refresh-token revocation

    /**
     * Changing a password is the one action a victim takes expecting it to end an
     * intrusion. A refresh cookie lives a week and nothing can withdraw it, so these
     * tests are the whole of the revocation.
     */
    @Test
    void refusesARefreshTokenMintedBeforeTheCredentialsChanged() {
        var user = client();
        // The account has moved on; the cookie still claims version 1.
        user.setTokenVersion(2);

        when(jwtService.parseToken("stale", TokenType.REFRESH)).thenReturn(refreshTokenForVersion(1));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.refresh("stale"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void acceptsARefreshTokenThatMatchesTheAccountsCurrentVersion() {
        var user = client();
        user.setTokenVersion(2);

        when(jwtService.parseToken("fresh", TokenType.REFRESH)).thenReturn(refreshTokenForVersion(2));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn(null);

        assertThat(authService.refresh("fresh").user().id()).isEqualTo(7L);
    }

    @Test
    void readsAMissingVersionClaimAsZeroSoExistingSessionsSurvive() {
        var user = client();
        // Zero is the column default, so a token minted before the claim existed —
        // and so carrying none — must still match rather than signing everyone out.
        assertThat(user.getTokenVersion()).isZero();

        when(jwtService.parseToken("legacy", TokenType.REFRESH)).thenReturn(refreshTokenWithoutVersion());
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn(null);

        assertThat(authService.refresh("legacy").user().id()).isEqualTo(7L);
    }

    @Test
    void refusesARefreshTokenForADeactivatedAccount() {
        var user = client();
        user.setActive(false);

        when(jwtService.parseToken("any", TokenType.REFRESH)).thenReturn(refreshTokenForVersion(0));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.refresh("any"))
                .isInstanceOf(BadCredentialsException.class);
    }

    private static Jwt refreshTokenForVersion(int tokenVersion) {
        return refreshToken(builder -> builder.add("tv", tokenVersion));
    }

    private static Jwt refreshTokenWithoutVersion() {
        return refreshToken(builder -> builder);
    }

    /** A real claim set, so the reading of the claim is exercised rather than stubbed. */
    private static Jwt refreshToken(UnaryOperator<ClaimsBuilder> withVersion) {
        var now = Instant.now();
        var claims = withVersion.apply(Jwts.claims()
                        .subject("7")
                        .add("role", Role.CLIENT.name())
                        .add("type", TokenType.REFRESH.name()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(604800)))
                .build();

        return new Jwt(claims, Keys.hmacShaKeyFor(
                "test-secret-long-enough-for-hs256-signing".getBytes(StandardCharsets.UTF_8)));
    }

    private static LoginRequest login(String email, String password) {
        var request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private static User client() {
        return User.builder()
                .id(7L)
                .name("A Client")
                .email("client@example.de")
                .password("$2a$10$irrelevant")
                .role(Role.CLIENT)
                .active(true)
                .build();
    }

    private static class UserMapperStub implements UserMapper {
        @Override
        public UserDto toDto(User user) {
            return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(),
                    user.getRole(), user.isActive(), user.getCreatedAt());
        }
    }
}
