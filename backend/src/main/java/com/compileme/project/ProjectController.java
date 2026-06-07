package com.compileme.project;

import com.compileme.project.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // =========================================================================
    // Project CRUD
    // =========================================================================

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects() {
        List<ProjectResponse> projects = projectService.list();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        ProjectResponse project = projectService.getById(id);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request
    ) {
        ProjectResponse response = projectService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ProjectPhase
    // =========================================================================

    @GetMapping("/{id}/phases")
    public ResponseEntity<List<ProjectPhaseResponse>> getPhases(@PathVariable Long id) {
        List<ProjectPhaseResponse> phases = projectService.listPhases(id);
        return ResponseEntity.ok(phases);
    }

    @PostMapping("/{id}/phases")
    public ResponseEntity<ProjectPhaseResponse> addPhase(
            @PathVariable Long id,
            @Valid @RequestBody ProjectPhaseRequest request
    ) {
        ProjectPhaseResponse response = projectService.addPhase(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/phases/{phaseId}")
    public ResponseEntity<ProjectPhaseResponse> updatePhase(
            @PathVariable Long phaseId,
            @RequestBody ProjectPhaseRequest request
    ) {
        ProjectPhaseResponse response = projectService.updatePhase(phaseId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/phases/{phaseId}")
    public ResponseEntity<Void> deletePhase(@PathVariable Long phaseId) {
        projectService.deletePhase(phaseId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/phases/reorder")
    public ResponseEntity<Void> reorderPhases(@Valid @RequestBody List<PhaseReorderItem> items) {
        projectService.reorderPhases(items);
        return ResponseEntity.ok().build();
    }

    // =========================================================================
    // ProjectTechnology
    // =========================================================================

    @GetMapping("/{id}/technologies")
    public ResponseEntity<List<ProjectTechnologyResponse>> getTechnologies(@PathVariable Long id) {
        List<ProjectTechnologyResponse> techs = projectService.listTechnologies(id);
        return ResponseEntity.ok(techs);
    }

    @PostMapping("/{id}/technologies")
    public ResponseEntity<ProjectTechnologyResponse> addTechnology(
            @PathVariable Long id,
            @Valid @RequestBody ProjectTechnologyRequest request
    ) {
        ProjectTechnologyResponse response = projectService.addTechnology(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/technologies/{techId}")
    public ResponseEntity<Void> deleteTechnology(@PathVariable Long techId) {
        projectService.deleteTechnology(techId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ProjectSnippet
    // =========================================================================

    @GetMapping("/{id}/snippets")
    public ResponseEntity<List<ProjectSnippetResponse>> getSnippets(@PathVariable Long id) {
        List<ProjectSnippetResponse> snippets = projectService.listSnippets(id);
        return ResponseEntity.ok(snippets);
    }

    @PostMapping("/{id}/snippets")
    public ResponseEntity<ProjectSnippetResponse> addSnippet(
            @PathVariable Long id,
            @Valid @RequestBody ProjectSnippetRequest request
    ) {
        ProjectSnippetResponse response = projectService.addSnippet(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/snippets/{snippetId}")
    public ResponseEntity<Void> deleteSnippet(@PathVariable Long snippetId) {
        projectService.deleteSnippet(snippetId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ProjectLink
    // =========================================================================

    @GetMapping("/{id}/links")
    public ResponseEntity<List<ProjectLinkResponse>> getLinks(@PathVariable Long id) {
        List<ProjectLinkResponse> links = projectService.listLinks(id);
        return ResponseEntity.ok(links);
    }

    @PostMapping("/{id}/links")
    public ResponseEntity<ProjectLinkResponse> addLink(
            @PathVariable Long id,
            @Valid @RequestBody ProjectLinkRequest request
    ) {
        ProjectLinkResponse response = projectService.addLink(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/links/{linkId}")
    public ResponseEntity<Void> deleteLink(@PathVariable Long linkId) {
        projectService.deleteLink(linkId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ProjectDocument
    // =========================================================================

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<ProjectDocumentResponse>> getDocuments(@PathVariable Long id) {
        List<ProjectDocumentResponse> docs = projectService.listDocuments(id);
        return ResponseEntity.ok(docs);
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<ProjectDocumentResponse> addDocument(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDocumentRequest request
    ) {
        ProjectDocumentResponse response = projectService.addDocument(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/documents/{docId}")
    public ResponseEntity<ProjectDocumentResponse> updateDocument(
            @PathVariable Long docId,
            @RequestBody ProjectDocumentRequest request
    ) {
        ProjectDocumentResponse response = projectService.updateDocument(docId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        projectService.deleteDocument(docId);
        return ResponseEntity.noContent().build();
    }
}
