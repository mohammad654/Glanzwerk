package com.glanzwerk.api.users;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.common.Text;

import lombok.RequiredArgsConstructor;

/**
 * Accounts: registration, self-service and the lookups other features need.
 *
 * Employee and administrator accounts are not created here — {@code EmployeeService}
 * owns that, because an employee account only makes sense together with its profile.
 */
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * Creates a public account. The role is hard-coded to {@link Role#CLIENT}: this is
     * the one code path a stranger can reach, so it must not be able to produce
     * anything else, whatever the request body contains.
     */
    @Transactional
    public UserDto register(RegisterRequest request) {
        var email = Text.normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            // Named so the form can mark the email box and offer to sign in instead.
            throw new ConflictException("email", "That email address is already registered.");
        }

        var user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(Text.blankToNull(request.getPhone()))
                .role(Role.CLIENT)
                .active(true)
                .build();

        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserDto get(Long id) {
        return userMapper.toDto(require(id));
    }

    @Transactional
    public UserDto updateProfile(Long id, UpdateProfileRequest request) {
        var user = require(id);
        user.setName(request.getName().trim());
        user.setPhone(Text.blankToNull(request.getPhone()));

        return userMapper.toDto(userRepository.save(user));
    }

    /**
     * Changes the caller's own password, and returns the account so the controller can
     * mint them a fresh session.
     *
     * Bumping the token version is what makes the change mean something: it revokes
     * every token already issued for the account, so a session somebody else is holding
     * dies at its next refresh instead of lasting out the week. The caller's own session
     * is replaced in the same response — see {@code UserController}.
     */
    @Transactional
    public User changePassword(Long id, ChangePasswordRequest request) {
        var user = require(id);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            // Not 403: the caller is who they say they are, they just got the old
            // password wrong, and a 403 would read as "you may not change passwords".
            throw new ConflictException("currentPassword", "Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.revokeIssuedTokens();

        return userRepository.save(user);
    }

    /** The entity, for features that need more than the DTO exposes. */
    @Transactional(readOnly = true)
    public User require(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found."));
    }
}
