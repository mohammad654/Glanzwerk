package com.glanzwerk.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.InvalidCredentialsException;
import com.glanzwerk.api.users.Role;
import com.glanzwerk.api.users.User;
import com.glanzwerk.api.users.UserRepository;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    private static final Instant NOW = Instant.parse("2026-03-01T10:00:00Z");
    private static final String OLD_HASH = "$2a$10$notarealhashnotarealhashnotarealhashnotarealhash12";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordResetNotifier notifier;

    private PasswordResetProperties properties;
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        properties = new PasswordResetProperties();
        properties.setTokenValidity(Duration.ofHours(1));
        properties.setLinkTemplate("https://glanzwerk.test/de/passwort-neu-setzen?token={token}");

        service = new PasswordResetService(
                userRepository,
                tokenRepository,
                notifier,
                properties,
                // The real encoder: "is the new password hashed" is what is asserted.
                new BCryptPasswordEncoder(),
                Clock.fixed(NOW, ZoneId.of("Europe/Berlin")));
    }

    @Test
    void storesOnlyTheHashOfTheTokenItSendsOut() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(client()));

        service.requestReset(forgot("client@example.de"));

        var saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(saved.capture());
        var link = ArgumentCaptor.forClass(String.class);
        verify(notifier).notifyPasswordReset(any(User.class), link.capture(), eq(NOW.plusSeconds(3600)));

        var token = link.getValue().substring(link.getValue().indexOf("token=") + 6);
        assertThat(token).isNotBlank();
        // The stored value must not be the token: a dump of the table cannot be
        // turned back into a working link.
        assertThat(saved.getValue().getTokenHash())
                .isNotEqualTo(token)
                .hasSize(64);
    }

    @Test
    void invalidatesOutstandingLinksBeforeIssuingANewOne() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(client()));

        service.requestReset(forgot("client@example.de"));

        // Order matters: saving first and deleting afterwards would delete the new row.
        var order = inOrder(tokenRepository);
        order.verify(tokenRepository).deleteByUserId(7L);
        order.verify(tokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void saysWhenNoAccountHasTheAddress() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requestReset(forgot("nobody@example.de")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting(failure -> ((InvalidCredentialsException) failure).getField())
                .isEqualTo("email");

        verify(notifier, never()).notifyPasswordReset(any(), anyString(), any());
    }

    @Test
    void refusesToResetADeactivatedAccount() {
        var blocked = client();
        blocked.setActive(false);
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(blocked));

        assertThatThrownBy(() -> service.requestReset(forgot("client@example.de")))
                .isInstanceOf(ConflictException.class);

        verify(tokenRepository, never()).save(any());
    }

    @Test
    void redeemingALinkHashesTheNewPasswordAndSpendsTheToken() {
        var user = client();
        var token = tokenFor(user, NOW.plusSeconds(600));
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        service.reset(reset("whatever-token", "Sicher123"));

        assertThat(user.getPassword()).isNotEqualTo("Sicher123").startsWith("$2");
        assertThat(token.getUsedAt()).isEqualTo(NOW);
        verify(userRepository).save(user);
    }

    @Test
    void refusesAnExpiredLinkAndLeavesThePasswordAlone() {
        var user = client();
        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(tokenFor(user, NOW.minusSeconds(1))));

        assertThatThrownBy(() -> service.reset(reset("whatever-token", "Sicher123")))
                .isInstanceOf(BadRequestException.class);

        assertThat(user.getPassword()).isEqualTo(OLD_HASH);
        verify(userRepository, never()).save(any());
    }

    @Test
    void refusesALinkThatHasAlreadyBeenUsed() {
        var user = client();
        var spent = tokenFor(user, NOW.plusSeconds(600));
        spent.setUsedAt(NOW.minusSeconds(60));
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(spent));

        assertThatThrownBy(() -> service.reset(reset("whatever-token", "Sicher123")))
                .isInstanceOf(BadRequestException.class);

        assertThat(user.getPassword()).isEqualTo(OLD_HASH);
    }

    @Test
    void refusesATokenNothingWasIssuedFor() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reset(reset("made-up", "Sicher123")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void issuesADifferentTokenEveryTime() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(client()));

        service.requestReset(forgot("client@example.de"));
        service.requestReset(forgot("client@example.de"));

        var saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(0).getTokenHash())
                .isNotEqualTo(saved.getAllValues().get(1).getTokenHash());
    }

    private static User client() {
        return User.builder()
                .id(7L)
                .name("A Client")
                .email("client@example.de")
                .password(OLD_HASH)
                .role(Role.CLIENT)
                .active(true)
                .build();
    }

    private static PasswordResetToken tokenFor(User user, Instant expiresAt) {
        return PasswordResetToken.builder()
                .id(1L)
                .user(user)
                .tokenHash("irrelevant: the lookup is stubbed")
                .expiresAt(expiresAt)
                .build();
    }

    private static ForgotPasswordRequest forgot(String email) {
        var request = new ForgotPasswordRequest();
        request.setEmail(email);
        return request;
    }

    private static ResetPasswordRequest reset(String token, String password) {
        var request = new ResetPasswordRequest();
        request.setToken(token);
        request.setPassword(password);
        return request;
    }
}
