package com.glanzwerk.api.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.InvalidCredentialsException;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.users.User;
import com.glanzwerk.api.users.UserMapper;
import com.glanzwerk.api.users.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final JwtService jwtService;

    /**
     * Signs in, and says which half was wrong when it fails.
     *
     * The account is looked up before the password is checked so an unknown address
     * can be reported as one — "email or password is incorrect" sends a customer who
     * never finished registering off to retype a password for an account that does
     * not exist. The cost is that the two answers differ, which makes this endpoint
     * an account-existence oracle; see {@link InvalidCredentialsException}. The rate
     * limit on the controller is what bounds it.
     *
     * A deactivated account deliberately falls into neither branch: it answers with
     * the blunt message, because "your account has been blocked" is not something to
     * tell whoever is at the keyboard.
     */
    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        var email = Text.normalizeEmail(request.getEmail());

        var user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "email", "No account is registered with that email address."));

        try {
            // Still the authority on whether the password matches, and on whether the
            // account may sign in at all: it is the one path that applies every check.
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (DisabledException exception) {
            // A blocked account is told neither that it is blocked nor that the
            // password was right, so it gets the blunt message. It also needs its own
            // branch: DisabledException is not a BadCredentialsException, so without
            // this it reached the catch-all handler and came back as a 500.
            throw new BadCredentialsException("Account is deactivated");
        } catch (BadCredentialsException exception) {
            throw new InvalidCredentialsException("password", "The password is incorrect.");
        }

        return startSession(user);
    }

    /**
     * A full session for an account whose identity is already established.
     *
     * Shared by sign-in and by changing a password: both need a new access token *and*
     * a new refresh cookie, and both must mint them the same way. Changing a password
     * revokes every refresh token issued up to that moment (see {@link #refresh}), so
     * the session that made the change has to be re-issued here or it would log itself
     * out along with the others.
     */
    public LoginResult startSession(User user) {
        return new LoginResult(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                userMapper.toDto(user));
    }

    /**
     * Exchanges a refresh cookie for a new access token.
     *
     * The account is re-read every time instead of trusting the claims, so a role
     * change, a deactivation or a password change takes effect at the next refresh
     * rather than whenever the week-old cookie happens to expire.
     *
     * The token version is this system's only revocation: a cookie minted before the
     * account's credentials last changed no longer matches the row and is refused. See
     * {@code User#tokenVersion}.
     */
    @Transactional(readOnly = true)
    public LoginResult refresh(String refreshToken) {
        var jwt = jwtService.parseToken(refreshToken, TokenType.REFRESH);
        if (jwt == null) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        var user = userRepository.findById(jwt.getUserId())
                .filter(User::isActive)
                .filter(candidate -> jwt.getTokenVersion() == candidate.getTokenVersion())
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        return new LoginResult(
                jwtService.generateAccessToken(user),
                null,
                userMapper.toDto(user));
    }

}
