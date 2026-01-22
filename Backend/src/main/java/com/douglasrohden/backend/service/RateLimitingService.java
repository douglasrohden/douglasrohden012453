package com.douglasrohden.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final long requestsPerMinutePerUser;
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public RateLimitingService(@Value("${rate-limit.requests-per-minute-per-user:10}") long requestsPerMinutePerUser) {
        if (requestsPerMinutePerUser <= 0) {
            throw new IllegalArgumentException("rate-limit.requests-per-minute-per-user must be > 0");
        }
        this.requestsPerMinutePerUser = requestsPerMinutePerUser;
    }

    public long getRequestsPerMinutePerUser() {
        return requestsPerMinutePerUser;
    }

    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, this::newBucket);
    }

    private Bucket newBucket(String key) {
        Bandwidth limit = Bandwidth.classic(requestsPerMinutePerUser,
            Refill.greedy(requestsPerMinutePerUser, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
