package com.douglasrohden.backend.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Deprecated: use /actuator/health for health checks
@RestController
@RequestMapping("/api/db")
public class DbPingController {

    private final JdbcTemplate jdbcTemplate;

    public DbPingController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * @deprecated Use /actuator/health for health checks. This endpoint is legacy and may be removed.
     */
    @GetMapping("/ping")
    @Deprecated
    public Map<String, Object> ping() {
        Integer one = jdbcTemplate.queryForObject("select 1", Integer.class);
        return Map.of(
                "ok", one != null && one == 1,
                "timestamp", Instant.now().toString());
    }
}
