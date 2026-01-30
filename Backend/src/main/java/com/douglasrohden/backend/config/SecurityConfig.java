package com.douglasrohden.backend.config;

import com.douglasrohden.backend.config.filter.ApiRateLimitFilter;
import com.douglasrohden.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.env.Environment;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PERMIT_ALL = {
            "/v1/autenticacao/**",
            "/v1/dev/**",
            "/api/db/**",
            "/ws/**",
            "/actuator/**",
            "/health/**",
            "/error",
            "/swagger-ui/**",
            "/v3/api-docs/**"
    };

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final ApiRateLimitFilter apiRateLimitFilter;
    private final UserDetailsService userDetailsService;
    private final Environment environment;

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
            ApiRateLimitFilter apiRateLimitFilter,
            UserDetailsService userDetailsService,
            Environment environment) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.apiRateLimitFilter = apiRateLimitFilter;
        this.userDetailsService = userDetailsService;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PERMIT_ALL).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> response
                                .sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response
                                .sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden")))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(apiRateLimitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Mitigation for CVE-2025-22228: ensure passwords longer than 72 chars are
        // rejected
        // BCrypt ignores bytes after 72 characters; this check prevents bypasses by
        // enforcing a max length.
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder delegate = new BCryptPasswordEncoder();
            private static final int MAX_PASSWORD_LENGTH = 72;

            @Override
            public String encode(CharSequence rawPassword) {
                if (rawPassword == null) {
                    throw new IllegalArgumentException("Password cannot be null");
                }
                if (rawPassword.length() > MAX_PASSWORD_LENGTH) {
                    throw new IllegalArgumentException("Password exceeds maximum length of " + MAX_PASSWORD_LENGTH);
                }
                return delegate.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (rawPassword == null) {
                    return false;
                }
                if (rawPassword.length() > MAX_PASSWORD_LENGTH) {
                    // Reject too-long passwords rather than delegating to BCrypt which would ignore
                    // the extra characters
                    return false;
                }
                return delegate.matches(rawPassword, encodedPassword);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // CORS restritivo por origem:
        // - Dev (default): permite apenas localhost (Vite).
        // - Docker/produção: restringe apenas à(s) origem(ns) configurada(s) via
        // env/property.
        // Ex.: CORS_ALLOWED_ORIGINS=https://meu-front.com,https://www.meu-front.com
        List<String> configuredOrigins = parseAllowedOrigins(corsAllowedOrigins);
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (configuredOrigins.isEmpty()) {
            if (isProd) {
                throw new IllegalStateException(
                        "cors.allowed-origins must be configured when SPRING_PROFILES_ACTIVE=prod");
            }
            configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        } else {
            configuration.setAllowedOriginPatterns(configuredOrigins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "X-Rate-Limit-Limit",
                        "X-Rate-Limit-Remaining",
                        "Retry-After"));
        configuration.setMaxAge(3600L);
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public FilterRegistrationBean<ApiRateLimitFilter> apiRateLimitFilterRegistration(ApiRateLimitFilter filter) {
        FilterRegistrationBean<ApiRateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    private static List<String> parseAllowedOrigins(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }
}
