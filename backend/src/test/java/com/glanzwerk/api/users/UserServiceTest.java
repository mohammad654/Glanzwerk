package com.glanzwerk.api.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.glanzwerk.api.common.ConflictException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        // The real encoder, not a mock: "is the password hashed" is the thing being
        // asserted, and a stubbed encoder would pass whatever it was told to return.
        userService = new UserService(userRepository, new UserMapperStub(), new BCryptPasswordEncoder());
    }

    @Test
    void publicRegistrationAlwaysCreatesAClient() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        userService.register(request("New Client", "New.Client@Example.DE", "Sicher123"));

        var saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(Role.CLIENT);
        assertThat(saved.getValue().isActive()).isTrue();
    }

    @Test
    void storesTheEmailLowercasedSoItCannotBeRegisteredTwiceInDifferentCase() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        userService.register(request("New Client", "  New.Client@Example.DE ", "Sicher123"));

        var saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("new.client@example.de");
    }

    @Test
    void neverStoresThePasswordAsGiven() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        userService.register(request("New Client", "client@example.de", "Sicher123"));

        var saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        var hash = saved.getValue().getPassword();
        assertThat(hash).isNotEqualTo("Sicher123").startsWith("$2");
        assertThat(new BCryptPasswordEncoder().matches("Sicher123", hash)).isTrue();
    }

    @Test
    void refusesAnEmailThatIsAlreadyRegistered() {
        when(userRepository.existsByEmailIgnoreCase("taken@example.de")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request("Someone", "taken@example.de", "Sicher123")))
                .isInstanceOf(ConflictException.class);

        verify(userRepository, never()).save(any());
    }

    // ------------------------------------------------------- changing a password

    /**
     * Bumping the version is the revocation: {@code AuthService.refresh} refuses any
     * token carrying the old one, so without this a stolen week-long session survived
     * the password change made to stop it.
     */
    @Test
    void bumpsTheTokenVersionSoOtherSessionsAreRevoked() {
        var user = client("Sicher123");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        userService.changePassword(7L, changePassword("Sicher123", "NochSicherer1"));

        assertThat(user.getTokenVersion()).isEqualTo(1);
    }

    @Test
    void storesTheNewPasswordHashedAndNotAsGiven() {
        var user = client("Sicher123");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        userService.changePassword(7L, changePassword("Sicher123", "NochSicherer1"));

        assertThat(user.getPassword()).isNotEqualTo("NochSicherer1");
        assertThat(new BCryptPasswordEncoder().matches("NochSicherer1", user.getPassword())).isTrue();
    }

    @Test
    void refusesTheChangeWhenTheCurrentPasswordIsWrongAndStampsNothing() {
        var user = client("Sicher123");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.changePassword(7L, changePassword("NotMine1", "NochSicherer1")))
                .isInstanceOf(ConflictException.class);

        // Not bumped, or a wrong guess would have signed every other session out.
        assertThat(user.getTokenVersion()).isZero();
        verify(userRepository, never()).save(any(User.class));
    }

    private static ChangePasswordRequest changePassword(String current, String next) {
        var request = new ChangePasswordRequest();
        request.setCurrentPassword(current);
        request.setNewPassword(next);
        return request;
    }

    private static User client(String password) {
        return User.builder()
                .id(7L)
                .name("A Client")
                .email("client@example.de")
                .password(new BCryptPasswordEncoder().encode(password))
                .role(Role.CLIENT)
                .active(true)
                .build();
    }

    private RegisterRequest request(String name, String email, String password) {
        var request = new RegisterRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    /** MapStruct generates the real one at build time; the mapping is not under test here. */
    private static class UserMapperStub implements UserMapper {
        @Override
        public UserDto toDto(User user) {
            return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(),
                    user.getRole(), user.isActive(), user.getCreatedAt());
        }
    }
}
