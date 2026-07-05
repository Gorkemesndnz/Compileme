package com.compileme.idea;

import com.compileme.idea.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ideas")
@RequiredArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @GetMapping
    public ResponseEntity<List<IdeaResponse>> getIdeas() {
        return ResponseEntity.ok(ideaService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IdeaDetailResponse> getIdea(@PathVariable Long id) {
        return ResponseEntity.ok(ideaService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<IdeaResponse> createIdea(@Valid @RequestBody IdeaRequest request) {
        return new ResponseEntity<>(ideaService.create(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<IdeaResponse> updateIdea(
            @PathVariable Long id,
            @RequestBody IdeaRequest request
    ) {
        return ResponseEntity.ok(ideaService.update(id, request));
    }

    @PostMapping("/{id}/entries")
    public ResponseEntity<IdeaEntryResponse> addEntry(
            @PathVariable Long id,
            @Valid @RequestBody IdeaEntryRequest request
    ) {
        return new ResponseEntity<>(ideaService.addEntry(id, request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/entries/{entryId}")
    public ResponseEntity<IdeaEntryResponse> updateEntry(
            @PathVariable Long id,
            @PathVariable Long entryId,
            @Valid @RequestBody IdeaEntryRequest request
    ) {
        return ResponseEntity.ok(ideaService.updateEntry(id, entryId, request));
    }

    @DeleteMapping("/{id}/entries/{entryId}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id, @PathVariable Long entryId) {
        ideaService.deleteEntry(id, entryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/research")
    public ResponseEntity<IdeaResearchResponse> addResearch(
            @PathVariable Long id,
            @Valid @RequestBody IdeaResearchRequest request
    ) {
        return new ResponseEntity<>(ideaService.addResearch(id, request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/research/{researchId}")
    public ResponseEntity<IdeaResearchResponse> updateResearch(
            @PathVariable Long id,
            @PathVariable Long researchId,
            @Valid @RequestBody IdeaResearchRequest request
    ) {
        return ResponseEntity.ok(ideaService.updateResearch(id, researchId, request));
    }

    @DeleteMapping("/{id}/research/{researchId}")
    public ResponseEntity<Void> deleteResearch(@PathVariable Long id, @PathVariable Long researchId) {
        ideaService.deleteResearch(id, researchId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/tasks")
    public ResponseEntity<IdeaTaskLinkResponse> createTask(
            @PathVariable Long id,
            @Valid @RequestBody IdeaTaskCreateRequest request
    ) {
        return new ResponseEntity<>(ideaService.createTask(id, request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<IdeaResponse> convertIdea(@PathVariable Long id) {
        return ResponseEntity.ok(ideaService.convert(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long id) {
        ideaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
