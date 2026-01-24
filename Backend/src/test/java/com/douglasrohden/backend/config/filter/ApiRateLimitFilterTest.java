package com.douglasrohden.backend.config.filter;

import com.douglasrohden.backend.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ApiRateLimitFilterTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldApplyRateLimitToAllV1RoutesIncludingAuth() throws Exception {
        RateLimitService rateLimitService = mock(RateLimitService.class);
        ObjectMapper objectMapper = new ObjectMapper();
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimitService, objectMapper);

        when(rateLimitService.tryConsume(any())).thenReturn(new RateLimitService.Probe(true, 9, 0));
        when(rateLimitService.defaultLimitPerWindow()).thenReturn(10L);
        when(rateLimitService.windowSeconds()).thenReturn(60L);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/autenticacao/login");
        request.setRemoteAddr("1.2.3.4");
        request.addHeader("X-User-Action-Id", "ignored");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        verify(rateLimitService, times(1)).tryConsume("ip:1.2.3.4");
        assertNotEquals(429, response.getStatus());
    }

    @Test
    void shouldNotFilterNonV1Routes() throws Exception {
        RateLimitService rateLimitService = mock(RateLimitService.class);
        ObjectMapper objectMapper = new ObjectMapper();
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimitService, objectMapper);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/swagger-ui/index.html");
        request.setRemoteAddr("1.2.3.4");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        verify(rateLimitService, never()).tryConsume(any());
    }

    @Test
    void shouldReturn429WithRetryAfterAndJsonBody() throws Exception {
        RateLimitService rateLimitService = mock(RateLimitService.class);
        ObjectMapper objectMapper = new ObjectMapper();
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimitService, objectMapper);

        // 10s retry-after
        when(rateLimitService.tryConsume(any())).thenReturn(new RateLimitService.Probe(false, 0, 10_000_000_000L));
        when(rateLimitService.defaultLimitPerWindow()).thenReturn(10L);
        when(rateLimitService.windowSeconds()).thenReturn(60L);
        when(rateLimitService.buildErrorBody(10L)).thenReturn(
                Map.of("code", "RATE_LIMIT", "message", "blocked", "retryAfter", 10)
        );

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/albuns");
        request.setRemoteAddr("1.2.3.4");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(429, response.getStatus());
        assertEquals("10", response.getHeader("Retry-After"));
        assertTrue(response.getContentAsString().contains("\"code\":\"RATE_LIMIT\""));
    }
}
