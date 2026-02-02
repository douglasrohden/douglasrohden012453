package com.douglasrohden.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import io.jsonwebtoken.JwtException;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@DisplayName("JwtUtil component tests")
class JwtUtilTest {

    @Test
    @DisplayName("loads JwtUtil via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("com.douglasrohden.backend.security.JwtUtil"));
    }

    @Nested
    @DisplayName("scenarios to implement for component")
    class Scenarios {

        @Test
        void happyPath() {
            JwtUtil jwtUtil = new JwtUtil("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
            ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", 60_000L);

            UserDetails user = User.withUsername("tester")
                    .password("secret")
                    .authorities(new String[] {})
                    .build();

            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "ADMIN");

            String token = jwtUtil.generateToken(claims, user);

            assertEquals("tester", jwtUtil.extractUsername(token));
            assertEquals("ADMIN", jwtUtil.extractClaim(token, c -> c.get("role")));
            assertTrue(jwtUtil.isTokenValid(token, user));
        }

        @Test
        void handlesEdgeCases() {
            JwtUtil jwtUtil = new JwtUtil("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
            ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", -1_000L);

            UserDetails user = User.withUsername("expired")
                    .password("secret")
                    .authorities(new String[] {})
                    .build();

            String expiredToken = jwtUtil.generateToken(user);
            assertFalse(jwtUtil.isTokenValid(expiredToken, user));

            assertThrows(JwtException.class, () -> jwtUtil.extractUsername("invalid.token"));
        }
    }
}
