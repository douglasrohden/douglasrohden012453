package com.douglasrohden.backend.controller;

import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Minimal health/hello endpoint kept for tooling and quick checks.
 * Exposes a simple JSON payload and returns a traceId for correlation.
 */
@RestController
@RequestMapping("/v1/hello")
public class HelloController {

   @io.swagger.v3.oas.annotations.Operation(summary = "Health / Hello", description = "Retorna status simples e traceId")
   @GetMapping
   public ResponseEntity<Map<String, Object>> hello() {
      String traceId = MDC.get("traceId");
      if (traceId == null || traceId.isBlank()) {
         traceId = UUID.randomUUID().toString();
      }
      Map<String, Object> body = Map.of(
            "message", "ok",
            "timestamp", java.time.Instant.now().toString(),
            "traceId", traceId
      );
      return ResponseEntity.ok(body);
   }
}

