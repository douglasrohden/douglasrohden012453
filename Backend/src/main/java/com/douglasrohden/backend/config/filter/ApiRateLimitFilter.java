package com.douglasrohden.backend.config.filter;

import com.douglasrohden.backend.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {
    private static final String[] SKIP_PREFIXES = {
            "/swagger-ui/",
            "/v3/api-docs/",
            "/actuator/",
            "/error",
            "/ws/"
    };

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    public ApiRateLimitFilter(RateLimitService rateLimitService, ObjectMapper objectMapper) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()))
            return true;

        String uri = request.getRequestURI();
        if (uri == null)
            return true;

        for (String prefix : SKIP_PREFIXES) {
            if (uri.startsWith(prefix))
                return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String key = resolveRateLimitKey(request);
        RateLimitService.Probe probe = rateLimitService.tryConsume(key);

        long limit = rateLimitService.defaultLimitPerWindow();
        long windowSeconds = rateLimitService.windowSeconds();
        response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
        response.setHeader("X-Rate-Limit-Window-Seconds", String.valueOf(windowSeconds));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.remainingTokens()));

        if (probe.consumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = RateLimitService.retryAfterSeconds(probe.nanosToWaitForRefill());
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(response.getWriter(), rateLimitService.buildErrorBody(retryAfterSeconds));
    }

    private String resolveRateLimitKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() != null
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            return "user:" + authentication.getName();
        }

        return "ip:" + RateLimitService.clientIp(request);
    }
}
