package com.compileme.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    public record HealthStatus(String status, String app) {}

    @GetMapping
    public HealthStatus getHealth() {
        return new HealthStatus("UP", "compileme");
    }
}
