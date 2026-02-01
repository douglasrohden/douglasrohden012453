package com.douglasrohden.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("RateLimitService service tests")
class RateLimitServiceTest {

    @Test
    @DisplayName("consumes tokens until limit is reached")
    void consumesTokensUntilLimit() {
        RateLimitService service = new RateLimitService(2, 60, 120, 1000);

        RateLimitService.Probe first = service.tryConsume("user:1");
        RateLimitService.Probe second = service.tryConsume("user:1");
        RateLimitService.Probe third = service.tryConsume("user:1");

        assertTrue(first.consumed());
        assertTrue(second.consumed());
        assertFalse(third.consumed());
    }

    @Test
    @DisplayName("retryAfterSeconds never returns zero")
    void retryAfterSecondsNeverZero() {
        assertEquals(1, RateLimitService.retryAfterSeconds(0));
        assertEquals(1, RateLimitService.retryAfterSeconds(-100));
    }
}
