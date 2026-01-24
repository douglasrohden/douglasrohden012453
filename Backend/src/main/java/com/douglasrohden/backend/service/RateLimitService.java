package com.douglasrohden.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    public record Probe(boolean consumed, long remainingTokens, long nanosToWaitForRefill) {
    }

    private final long requestsPerWindow;
    private final long windowSeconds;
    private final long bucketExpireAfterSeconds;
    private final long bucketMaxSize;
    private final ConcurrentHashMap<String, BucketHolder> buckets = new ConcurrentHashMap<>();

    public RateLimitService(
            @Value("${rate-limit.requests-per-window:10}") long requestsPerWindow,
            @Value("${rate-limit.window-seconds:60}") long windowSeconds,
            @Value("${rate-limit.bucket-expire-after-seconds:600}") long bucketExpireAfterSeconds,
            @Value("${rate-limit.bucket-max-size:100000}") long bucketMaxSize
    ) {
        if (requestsPerWindow <= 0) {
            throw new IllegalArgumentException("rate-limit.requests-per-window must be > 0");
        }
        if (windowSeconds <= 0) {
            throw new IllegalArgumentException("rate-limit.window-seconds must be > 0");
        }

        this.requestsPerWindow = requestsPerWindow;
        this.windowSeconds = windowSeconds;
        this.bucketExpireAfterSeconds = Math.max(1, bucketExpireAfterSeconds);
        this.bucketMaxSize = Math.max(1, bucketMaxSize);
    }

    public long defaultLimitPerWindow() {
        return requestsPerWindow;
    }

    public long windowSeconds() {
        return windowSeconds;
    }

    public Probe tryConsume(String key) {
        return tryConsume(key, requestsPerWindow);
    }

    public Probe tryConsume(String key, long limitPerWindow) {
        long limit = Math.max(1, limitPerWindow);
        String safeKey = (key == null || key.isBlank()) ? "unknown" : key.trim();
        String bucketKey = limit + ":" + windowSeconds + ":" + safeKey;

        long nowMs = System.currentTimeMillis();
        long expireMs = Duration.ofSeconds(bucketExpireAfterSeconds).toMillis();

        BucketHolder holder = buckets.compute(bucketKey, (k, existing) -> {
            if (existing == null) {
                return new BucketHolder(newBucket(limit), nowMs);
            }
            if (nowMs - existing.lastAccessMs > expireMs) {
                return new BucketHolder(newBucket(limit), nowMs);
            }
            existing.lastAccessMs = nowMs;
            return existing;
        });

        // Limpesa simples para respeitar bucketMaxSize sem biblioteca de cache.
        // Remove entradas expiradas; se ainda exceder, remove arbitrariamente até caber.
        if (buckets.size() > bucketMaxSize) {
            cleanup(nowMs, expireMs);
        }

        Bucket bucket = holder.bucket;
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return new Probe(probe.isConsumed(), probe.getRemainingTokens(), probe.getNanosToWaitForRefill());
    }

    private void cleanup(long nowMs, long expireMs) {
        // 1) remove expirados
        for (Map.Entry<String, BucketHolder> entry : buckets.entrySet()) {
            BucketHolder holder = entry.getValue();
            if (holder != null && nowMs - holder.lastAccessMs > expireMs) {
                buckets.remove(entry.getKey(), holder);
            }
        }

        // 2) se ainda exceder, remove o que vier primeiro na iteração
        if (buckets.size() <= bucketMaxSize) return;
        for (String k : buckets.keySet()) {
            buckets.remove(k);
            if (buckets.size() <= bucketMaxSize) return;
        }
    }

    public Map<String, Object> buildErrorBody(long retryAfterSeconds) {
        return Map.of(
                "code", "RATE_LIMIT",
                "message", "Muitas requisições. Tente novamente em " + retryAfterSeconds + "s.",
                "retryAfter", retryAfterSeconds,
                "limit", requestsPerWindow,
                "windowSeconds", windowSeconds
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

    private Bucket newBucket(long limitPerWindow) {
        Bandwidth limit = Bandwidth.classic(
                limitPerWindow,
                Refill.intervally(limitPerWindow, Duration.ofSeconds(windowSeconds))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private static final class BucketHolder {
        private final Bucket bucket;
        private volatile long lastAccessMs;

        private BucketHolder(Bucket bucket, long lastAccessMs) {
            this.bucket = bucket;
            this.lastAccessMs = lastAccessMs;
        }
    }
}
