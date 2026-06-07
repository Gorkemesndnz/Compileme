package com.compileme.idea;

import com.compileme.idea.dto.IdeaRequest;
import com.compileme.idea.dto.IdeaResponse;
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
        List<IdeaResponse> ideas = ideaService.list();
        return ResponseEntity.ok(ideas);
    }

    @PostMapping
    public ResponseEntity<IdeaResponse> createIdea(@Valid @RequestBody IdeaRequest request) {
        IdeaResponse response = ideaService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<IdeaResponse> updateIdea(
            @PathVariable Long id,
            @RequestBody IdeaRequest request
    ) {
        IdeaResponse response = ideaService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<IdeaResponse> convertIdea(@PathVariable Long id) {
        IdeaResponse response = ideaService.convert(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long id) {
        ideaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
