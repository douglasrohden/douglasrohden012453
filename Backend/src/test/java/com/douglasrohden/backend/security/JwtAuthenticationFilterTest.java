package com.douglasrohden.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import io.jsonwebtoken.JwtException;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@DisplayName("JwtAuthenticationFilter component tests")
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @Test
    @DisplayName("loads JwtAuthenticationFilter via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("com.douglasrohden.backend.security.JwtAuthenticationFilter"));
    }

    @Nested
    @DisplayName("scenarios to implement for component")
    class Scenarios {

        @Test
        void happyPath() {
            JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);
            MockHttpServletRequest request = new MockHttpServletRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            request.addHeader("Authorization", "Bearer valid.jwt");
            when(jwtUtil.extractUsername("valid.jwt")).thenReturn("tester");

            UserDetails user = User.withUsername("tester")
                    .password("secret")
                    .authorities(new String[] {})
                    .build();
            when(userDetailsService.loadUserByUsername("tester")).thenReturn(user);
            when(jwtUtil.isTokenValid("valid.jwt", user)).thenReturn(true);

            SecurityContextHolder.clearContext();
            assertDoesNotThrow(() -> filter.doFilter(request, response, chain));

            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
            assertEquals("tester", SecurityContextHolder.getContext().getAuthentication().getName());
        }

        @Test
        void handlesEdgeCases() {
            JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);
            MockHttpServletRequest request = new MockHttpServletRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            request.addHeader("Authorization", "Bearer invalid.jwt");
            when(jwtUtil.extractUsername("invalid.jwt")).thenThrow(new JwtException("invalid"));

            SecurityContextHolder.clearContext();
            assertDoesNotThrow(() -> filter.doFilter(request, response, chain));

            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verifyNoInteractions(userDetailsService);
        }
    }
}
