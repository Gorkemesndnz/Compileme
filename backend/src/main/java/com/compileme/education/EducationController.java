package com.compileme.education;

import com.compileme.education.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/educations")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    // =========================================================================
    // Education
    // =========================================================================

    @GetMapping
    public ResponseEntity<List<EducationResponse>> getEducations() {
        List<EducationResponse> educations = educationService.list();
        return ResponseEntity.ok(educations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EducationResponse> getEducationById(@PathVariable Long id) {
        EducationResponse response = educationService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<EducationResponse> createEducation(@Valid @RequestBody EducationRequest request) {
        EducationResponse response = educationService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EducationResponse> updateEducation(
            @PathVariable Long id,
            @RequestBody EducationRequest request
    ) {
        EducationResponse response = educationService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long id) {
        educationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<EducationResponse> updateProgress(
            @PathVariable Long id,
            @Valid @RequestBody ProgressUpdateRequest request
    ) {
        EducationResponse response = educationService.updateProgress(id, request.progressPercent());
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // Resources
    // =========================================================================

    @GetMapping("/{id}/resources")
    public ResponseEntity<List<EducationResourceResponse>> getResources(@PathVariable Long id) {
        List<EducationResourceResponse> resources = educationService.listResources(id);
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/{id}/resources")
    public ResponseEntity<EducationResourceResponse> addResource(
            @PathVariable Long id,
            @Valid @RequestBody EducationResourceRequest request
    ) {
        EducationResourceResponse response = educationService.addResource(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/resources/{resourceId}")
    public ResponseEntity<EducationResourceResponse> updateResource(
            @PathVariable Long resourceId,
            @RequestBody EducationResourceUpdateRequest request
    ) {
        EducationResourceResponse response = educationService.updateResource(resourceId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/resources/reorder")
    public ResponseEntity<Void> reorderResources(
            @PathVariable Long id,
            @Valid @RequestBody List<EducationResourceReorderItem> items
    ) {
        educationService.reorderResources(id, items);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long resourceId) {
        educationService.deleteResource(resourceId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Practices
    // =========================================================================

    @GetMapping("/{id}/practices")
    public ResponseEntity<List<EducationPracticeResponse>> getPractices(@PathVariable Long id) {
        List<EducationPracticeResponse> practices = educationService.listPractices(id);
        return ResponseEntity.ok(practices);
    }

    @PostMapping("/{id}/practices")
    public ResponseEntity<EducationPracticeResponse> addPractice(
            @PathVariable Long id,
            @Valid @RequestBody EducationPracticeRequest request
    ) {
        EducationPracticeResponse response = educationService.addPractice(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/practices/{practiceId}")
    public ResponseEntity<EducationPracticeResponse> updatePractice(
            @PathVariable Long practiceId,
            @Valid @RequestBody EducationPracticeRequest request
    ) {
        EducationPracticeResponse response = educationService.updatePractice(practiceId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/practices/{practiceId}")
    public ResponseEntity<Void> deletePractice(@PathVariable Long practiceId) {
        educationService.deletePractice(practiceId);
        return ResponseEntity.noContent().build();
    }
}
