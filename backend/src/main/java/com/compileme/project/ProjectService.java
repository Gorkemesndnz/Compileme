package com.compileme.project;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.project.dto.*;
import com.compileme.project.event.ProjectCreatedFromIdeaEvent;
import com.compileme.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectPhaseRepository projectPhaseRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final ProjectSnippetRepository projectSnippetRepository;
    private final ProjectLinkRepository projectLinkRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ApplicationEventPublisher eventPublisher;

    // =========================================================================
    // Project CRUD
    // =========================================================================

    public List<ProjectResponse> list() {
        Long userId = currentUserProvider.getCurrentUserId();
        return projectRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    public ProjectResponse getById(Long id) {
        Project project = getProjectForCurrentUser(id);
        return ProjectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Project project = ProjectMapper.toEntity(request, userId);
        Project saved = projectRepository.save(project);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = getProjectForCurrentUser(id);
        ProjectMapper.apply(project, request);
        Project saved = projectRepository.save(project);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Project project = getProjectForCurrentUser(id);
        projectRepository.delete(project);
    }

    @Transactional
    public void createFromIdea(Long ideaId, Long userId, String title, String content) {
        Project project = Project.builder()
                .userId(userId)
                .name(title)
                .description(content)
                .status(ProjectStatus.PLANNING)
                .build();
        Project savedProject = projectRepository.save(project);

        // Fikir modülüne projenin oluşturulduğunu bildir
        eventPublisher.publishEvent(new ProjectCreatedFromIdeaEvent(ideaId, savedProject.getId()));
    }

    // =========================================================================
    // ProjectPhase
    // =========================================================================

    public List<ProjectPhaseResponse> listPhases(Long projectId) {
        getProjectForCurrentUser(projectId); // ownership check
        return projectPhaseRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectPhaseResponse addPhase(Long projectId, ProjectPhaseRequest request) {
        Project project = getProjectForCurrentUser(projectId);
        
        int orderIndex = 0;
        if (request.orderIndex() == null) {
            orderIndex = projectPhaseRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                    .stream()
                    .mapToInt(ProjectPhase::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        ProjectPhase phase = ProjectMapper.toEntity(request, project);
        phase.setOrderIndex(orderIndex);
        ProjectPhase saved = projectPhaseRepository.save(phase);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectPhaseResponse updatePhase(Long phaseId, ProjectPhaseRequest request) {
        ProjectPhase phase = getPhaseForCurrentUser(phaseId);
        ProjectMapper.apply(phase, request);
        ProjectPhase saved = projectPhaseRepository.save(phase);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void deletePhase(Long phaseId) {
        ProjectPhase phase = getPhaseForCurrentUser(phaseId);
        projectPhaseRepository.delete(phase);
    }

    @Transactional
    public void reorderPhases(List<PhaseReorderItem> items) {
        for (PhaseReorderItem item : items) {
            ProjectPhase phase = getPhaseForCurrentUser(item.id());
            phase.setOrderIndex(item.orderIndex());
            projectPhaseRepository.save(phase);
        }
    }

    // =========================================================================
    // ProjectTechnology
    // =========================================================================

    public List<ProjectTechnologyResponse> listTechnologies(Long projectId) {
        getProjectForCurrentUser(projectId);
        return projectTechnologyRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectTechnologyResponse addTechnology(Long projectId, ProjectTechnologyRequest request) {
        Project project = getProjectForCurrentUser(projectId);
        
        int orderIndex = 0;
        if (request.orderIndex() == null) {
            orderIndex = projectTechnologyRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                    .stream()
                    .mapToInt(ProjectTechnology::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        ProjectTechnology tech = ProjectMapper.toEntity(request, project);
        tech.setOrderIndex(orderIndex);
        ProjectTechnology saved = projectTechnologyRepository.save(tech);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void deleteTechnology(Long techId) {
        ProjectTechnology tech = projectTechnologyRepository.findById(techId)
                .orElseThrow(() -> new NotFoundException("Teknoloji bulunamadı: " + techId));
        checkProjectOwnership(tech.getProject());
        projectTechnologyRepository.delete(tech);
    }

    // =========================================================================
    // ProjectSnippet
    // =========================================================================

    public List<ProjectSnippetResponse> listSnippets(Long projectId) {
        getProjectForCurrentUser(projectId);
        return projectSnippetRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectSnippetResponse addSnippet(Long projectId, ProjectSnippetRequest request) {
        Project project = getProjectForCurrentUser(projectId);
        ProjectSnippet snippet = ProjectMapper.toEntity(request, project);
        ProjectSnippet saved = projectSnippetRepository.save(snippet);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void deleteSnippet(Long snippetId) {
        ProjectSnippet snippet = projectSnippetRepository.findById(snippetId)
                .orElseThrow(() -> new NotFoundException("Snippet bulunamadı: " + snippetId));
        checkProjectOwnership(snippet.getProject());
        projectSnippetRepository.delete(snippet);
    }

    // =========================================================================
    // ProjectLink
    // =========================================================================

    public List<ProjectLinkResponse> listLinks(Long projectId) {
        getProjectForCurrentUser(projectId);
        return projectLinkRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectLinkResponse addLink(Long projectId, ProjectLinkRequest request) {
        Project project = getProjectForCurrentUser(projectId);
        
        int orderIndex = 0;
        if (request.orderIndex() == null) {
            orderIndex = projectLinkRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                    .stream()
                    .mapToInt(ProjectLink::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        ProjectLink link = ProjectMapper.toEntity(request, project);
        link.setOrderIndex(orderIndex);
        ProjectLink saved = projectLinkRepository.save(link);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void deleteLink(Long linkId) {
        ProjectLink link = projectLinkRepository.findById(linkId)
                .orElseThrow(() -> new NotFoundException("Link bulunamadı: " + linkId));
        checkProjectOwnership(link.getProject());
        projectLinkRepository.delete(link);
    }

    // =========================================================================
    // ProjectDocument
    // =========================================================================

    public List<ProjectDocumentResponse> listDocuments(Long projectId) {
        getProjectForCurrentUser(projectId);
        return projectDocumentRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectDocumentResponse addDocument(Long projectId, ProjectDocumentRequest request) {
        Project project = getProjectForCurrentUser(projectId);
        
        int orderIndex = 0;
        if (request.orderIndex() == null) {
            orderIndex = projectDocumentRepository.findAllByProjectIdOrderByOrderIndexAsc(projectId)
                    .stream()
                    .mapToInt(ProjectDocument::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        ProjectDocument doc = ProjectMapper.toEntity(request, project);
        doc.setOrderIndex(orderIndex);
        ProjectDocument saved = projectDocumentRepository.save(doc);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectDocumentResponse updateDocument(Long docId, ProjectDocumentRequest request) {
        ProjectDocument doc = getDocumentForCurrentUser(docId);
        ProjectMapper.apply(doc, request);
        ProjectDocument saved = projectDocumentRepository.save(doc);
        return ProjectMapper.toResponse(saved);
    }

    @Transactional
    public void deleteDocument(Long docId) {
        ProjectDocument doc = getDocumentForCurrentUser(docId);
        projectDocumentRepository.delete(doc);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Project getProjectForCurrentUser(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Proje bulunamadı: " + id));
        checkProjectOwnership(project);
        return project;
    }

    private ProjectPhase getPhaseForCurrentUser(Long phaseId) {
        ProjectPhase phase = projectPhaseRepository.findById(phaseId)
                .orElseThrow(() -> new NotFoundException("Faz bulunamadı: " + phaseId));
        checkProjectOwnership(phase.getProject());
        return phase;
    }

    private ProjectDocument getDocumentForCurrentUser(Long docId) {
        ProjectDocument doc = projectDocumentRepository.findById(docId)
                .orElseThrow(() -> new NotFoundException("Doküman bulunamadı: " + docId));
        checkProjectOwnership(doc.getProject());
        return doc;
    }

    private void checkProjectOwnership(Project project) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!project.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Proje bulunamadı: " + project.getId());
        }
    }
}
