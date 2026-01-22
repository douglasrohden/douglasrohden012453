package com.douglasrohden.backend.config.filter;

import com.douglasrohden.backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;

    public LoginRateLimitFilter(RateLimitingService rateLimitingService) {
        this.rateLimitingService = rateLimitingService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !"/v1/autenticacao/login".equals(uri);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Para login, o usuário ainda não está autenticado, então limitamos por IP.
        // Isso também ajuda a bloquear brute force (mesma regra 10/min padrão).
        String key = "login-ip:" + getClientIp(request);

        Bucket bucket = rateLimitingService.resolveBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        long limit = rateLimitingService.getRequestsPerMinutePerUser();

        response.addHeader("X-Rate-Limit-Limit", String.valueOf(limit));

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.addHeader("X-Rate-Limit-Remaining", "0");

        long waitSeconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
        if (waitSeconds <= 0) {
            waitSeconds = 1;
        }
        response.addHeader("Retry-After", String.valueOf(waitSeconds));
        response.setContentType("text/plain");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("Too many requests");
    }

    private static String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // Usa o primeiro IP da lista
            int comma = forwardedFor.indexOf(',');
            String ip = comma >= 0 ? forwardedFor.substring(0, comma) : forwardedFor;
            ip = ip.trim();
            if (!ip.isBlank()) {
                return ip;
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }
}
