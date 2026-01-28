package com.douglasrohden.backend.controller;

import org.springframework.boot.actuate.endpoint.ApiVersion;
import org.springframework.boot.actuate.endpoint.SecurityContext;
import org.springframework.boot.actuate.endpoint.web.WebEndpointResponse;
import org.springframework.boot.actuate.endpoint.web.WebServerNamespace;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpointWebExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final HealthEndpointWebExtension healthEndpointWebExtension;

    public HealthController(HealthEndpointWebExtension healthEndpointWebExtension) {
        this.healthEndpointWebExtension = healthEndpointWebExtension;
    }

    @GetMapping
    public ResponseEntity<HealthComponent> health() {
        return toResponse(healthEndpointWebExtension.health(
                ApiVersion.LATEST,
                WebServerNamespace.SERVER,
                SecurityContext.NONE));
    }

    @GetMapping("/live")
    public ResponseEntity<HealthComponent> live() {
        return toResponse(healthEndpointWebExtension.health(
                ApiVersion.LATEST,
                WebServerNamespace.SERVER,
                SecurityContext.NONE,
                "liveness"));
    }

    @GetMapping("/ready")
    public ResponseEntity<HealthComponent> ready() {
        return toResponse(healthEndpointWebExtension.health(
                ApiVersion.LATEST,
                WebServerNamespace.SERVER,
                SecurityContext.NONE,
                "readiness"));
    }

    private static ResponseEntity<HealthComponent> toResponse(WebEndpointResponse<HealthComponent> response) {
        return ResponseEntity.status(response.getStatus()).body(response.getBody());
    }
}
