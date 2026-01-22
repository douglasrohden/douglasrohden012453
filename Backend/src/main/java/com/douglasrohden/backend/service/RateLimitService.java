package com.douglasrohden.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;

@Service
public class RateLimitService {

    public record Probe(boolean consumed, long remainingTokens, long nanosToWaitForRefill) {
    }

    private final long defaultRequestsPerMinute;
    private final Cache<String, Bucket> buckets;

    public RateLimitService(
            @Value("${rate-limit.requests-per-minute-per-user:10}") long defaultRequestsPerMinute,
            @Value("${rate-limit.bucket-expire-after-minutes:10}") long bucketExpireAfterMinutes,
            @Value("${rate-limit.bucket-max-size:100000}") long bucketMaxSize
    ) {
        if (defaultRequestsPerMinute <= 0) {
            throw new IllegalArgumentException("rate-limit.requests-per-minute-per-user must be > 0");
        }
        this.defaultRequestsPerMinute = defaultRequestsPerMinute;
        this.buckets = Caffeine.newBuilder()
                .maximumSize(Math.max(1, bucketMaxSize))
                .expireAfterAccess(Duration.ofMinutes(Math.max(1, bucketExpireAfterMinutes)))
                .build();
    }

    public long defaultLimitPerMinute() {
        return defaultRequestsPerMinute;
    }

    public Probe tryConsume(String key) {
        return tryConsume(key, defaultRequestsPerMinute);
    }

    public Probe tryConsume(String key, long limitPerMinute) {
        long limit = Math.max(1, limitPerMinute);
        String safeKey = (key == null || key.isBlank()) ? "unknown" : key.trim();
        String bucketKey = limit + ":" + safeKey;

        Bucket bucket = buckets.get(bucketKey, k -> newBucket(limit));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return new Probe(probe.isConsumed(), probe.getRemainingTokens(), probe.getNanosToWaitForRefill());
    }

    public Map<String, Object> buildErrorBody(long retryAfterSeconds) {
        return Map.of(
                "code", "RATE_LIMIT",
                "message", "Muitas requisições. Tente novamente em " + retryAfterSeconds + "s.",
                "retryAfter", retryAfterSeconds
        );
    }

    public static long retryAfterSeconds(long nanosToWaitForRefill) {
        if (nanosToWaitForRefill <= 0) {
            return 1;
        }
        long seconds = (long) Math.ceil(nanosToWaitForRefill / 1_000_000_000d);
        return Math.max(1, seconds);
    }

    public static String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
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

    private Bucket newBucket(long limitPerMinute) {
        Bandwidth limit = Bandwidth.classic(
                limitPerMinute,
                Refill.intervally(limitPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }
}
