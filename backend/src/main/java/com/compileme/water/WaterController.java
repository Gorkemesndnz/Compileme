package com.compileme.water;

import com.compileme.water.dto.WaterLogRequest;
import com.compileme.water.dto.WaterLogResponse;
import com.compileme.water.dto.WaterSummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
public class WaterController {

    private final WaterService waterService;

    @GetMapping
    public ResponseEntity<WaterSummaryResponse> getSummary(
            @RequestParam(required = false) LocalDate date
    ) {
        WaterSummaryResponse summary = waterService.getSummary(date);
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<WaterLogResponse> addLog(@Valid @RequestBody WaterLogRequest request) {
        WaterLogResponse response = waterService.addLog(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        waterService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
}
