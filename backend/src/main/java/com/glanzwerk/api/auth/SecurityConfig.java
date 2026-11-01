package com.glanzwerk.api.auth;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.glanzwerk.api.common.ApiErrorWriter;
import com.glanzwerk.api.common.SecurityRules;

import lombok.RequiredArgsConstructor;

/**
 * Stateless JWT security.
 *
 * Two things carry the weight here. The chain ends with
 * {@code anyRequest().authenticated()}, so an endpoint nobody wrote a rule for is
 * closed rather than open. And {@code @EnableMethodSecurity} turns on the
 * {@code @PreAuthorize} annotations on the controllers, which are the second, finer
 * layer: the URL rules say who may reach {@code /admin/**}, the annotations say who
 * may call a given method, and a mistake in one does not silently open the other.
 *
 * Requests the filters turn away do not reach {@code GlobalExceptionHandler}, so the
 * entry point and the access-denied handler write the same {@link ApiErrorWriter} shape
 * the rest of the API uses; a bare status with an empty body is the one failure a client
 * cannot explain to the person in front of it.
 *
 * CSRF is disabled because there is no session and no cookie-based authentication to
 * forge: the access token travels in the Authorization header, which a cross-site
 * form post cannot set. The one cookie, the refresh token, is scoped to the refresh
 * path and the endpoint that reads it does nothing but mint a new access token for
 * the account that cookie already belongs to.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final List<SecurityRules> featureSecurityRules;
    private final CorsProperties corsProperties;
    private final ApiErrorWriter apiErrorWriter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(passwordEncoder());
        provider.setUserDetailsService(userDetailsService);
        // Without this, a wrong email and a wrong password fail differently and the
        // timing difference alone tells an attacker which emails exist.
        provider.setHideUserNotFoundExceptions(true);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept-Language"));
        // Required for the refresh cookie to be sent and set cross-origin.
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(c -> c.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(c -> {
                    featureSecurityRules.forEach(rules -> rules.configure(c));
                    c.anyRequest().authenticated();
                })
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(c -> {
                    // 401 for "no usable credentials", 403 for "credentials, wrong role" —
                    // both in the same JSON shape every other failure uses, so the client
                    // has one thing to parse. See ApiErrorWriter.
                    c.authenticationEntryPoint((request, response, exception) -> apiErrorWriter.write(
                            request, response, HttpStatus.UNAUTHORIZED,
                            "Authentication is required for this request."));
                    c.accessDeniedHandler((request, response, exception) -> apiErrorWriter.write(
                            request, response, HttpStatus.FORBIDDEN,
                            "You may not perform this action."));
                });

        return http.build();
    }
}
