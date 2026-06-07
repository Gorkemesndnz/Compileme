package com.compileme.project.mapper;

import com.compileme.project.*;
import com.compileme.project.dto.*;

public class ProjectMapper {

    // Project
    public static ProjectResponse toResponse(Project entity) {
        if (entity == null) return null;
        return new ProjectResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static Project toEntity(ProjectRequest request, Long userId) {
        if (request == null) return null;
        ProjectStatus status = request.status() != null ? request.status() : ProjectStatus.PLANNING;
        return Project.builder()
                .userId(userId)
                .name(request.name())
                .description(request.description())
                .status(status)
                .build();
    }

    public static void apply(Project entity, ProjectRequest request) {
        if (entity == null || request == null) return;
        if (request.name() != null) entity.setName(request.name());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.status() != null) entity.setStatus(request.status());
    }

    // ProjectPhase
    public static ProjectPhaseResponse toResponse(ProjectPhase entity) {
        if (entity == null) return null;
        return new ProjectPhaseResponse(
                entity.getId(),
                entity.getProject().getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getOrderIndex()
        );
    }

    public static ProjectPhase toEntity(ProjectPhaseRequest request, Project project) {
        if (request == null) return null;
        ProjectStatus status = request.status() != null ? request.status() : ProjectStatus.PLANNING;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return ProjectPhase.builder()
                .project(project)
                .name(request.name())
                .description(request.description())
                .status(status)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .orderIndex(orderIndex)
                .build();
    }

    public static void apply(ProjectPhase entity, ProjectPhaseRequest request) {
        if (entity == null || request == null) return;
        if (request.name() != null) entity.setName(request.name());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.status() != null) entity.setStatus(request.status());
        if (request.startDate() != null) entity.setStartDate(request.startDate());
        if (request.endDate() != null) entity.setEndDate(request.endDate());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
    }

    // ProjectTechnology
    public static ProjectTechnologyResponse toResponse(ProjectTechnology entity) {
        if (entity == null) return null;
        return new ProjectTechnologyResponse(
                entity.getId(),
                entity.getProject().getId(),
                entity.getCategory(),
                entity.getTitle(),
                entity.getTechnology(),
                entity.getNotes(),
                entity.getOrderIndex()
        );
    }

    public static ProjectTechnology toEntity(ProjectTechnologyRequest request, Project project) {
        if (request == null) return null;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return ProjectTechnology.builder()
                .project(project)
                .category(request.category())
                .title(request.title())
                .technology(request.technology())
                .notes(request.notes())
                .orderIndex(orderIndex)
                .build();
    }

    public static void apply(ProjectTechnology entity, ProjectTechnologyRequest request) {
        if (entity == null || request == null) return;
        if (request.category() != null) entity.setCategory(request.category());
        if (request.title() != null) entity.setTitle(request.title());
        if (request.technology() != null) entity.setTechnology(request.technology());
        if (request.notes() != null) entity.setNotes(request.notes());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
    }

    // ProjectSnippet
    public static ProjectSnippetResponse toResponse(ProjectSnippet entity) {
        if (entity == null) return null;
        return new ProjectSnippetResponse(
                entity.getId(),
                entity.getProject().getId(),
                entity.getTitle(),
                entity.getLanguage(),
                entity.getCode(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getCreatedAt()
        );
    }

    public static ProjectSnippet toEntity(ProjectSnippetRequest request, Project project) {
        if (request == null) return null;
        return ProjectSnippet.builder()
                .project(project)
                .title(request.title())
                .language(request.language())
                .code(request.code())
                .description(request.description())
                .category(request.category())
                .build();
    }

    public static void apply(ProjectSnippet entity, ProjectSnippetRequest request) {
        if (entity == null || request == null) return;
        if (request.title() != null) entity.setTitle(request.title());
        if (request.language() != null) entity.setLanguage(request.language());
        if (request.code() != null) entity.setCode(request.code());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.category() != null) entity.setCategory(request.category());
    }

    // ProjectLink
    public static ProjectLinkResponse toResponse(ProjectLink entity) {
        if (entity == null) return null;
        return new ProjectLinkResponse(
                entity.getId(),
                entity.getProject().getId(),
                entity.getTitle(),
                entity.getUrl(),
                entity.getType(),
                entity.getCategory(),
                entity.getNotes(),
                entity.getOrderIndex()
        );
    }

    public static ProjectLink toEntity(ProjectLinkRequest request, Project project) {
        if (request == null) return null;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return ProjectLink.builder()
                .project(project)
                .title(request.title())
                .url(request.url())
                .type(request.type())
                .category(request.category())
                .notes(request.notes())
                .orderIndex(orderIndex)
                .build();
    }

    public static void apply(ProjectLink entity, ProjectLinkRequest request) {
        if (entity == null || request == null) return;
        if (request.title() != null) entity.setTitle(request.title());
        if (request.url() != null) entity.setUrl(request.url());
        if (request.type() != null) entity.setType(request.type());
        if (request.category() != null) entity.setCategory(request.category());
        if (request.notes() != null) entity.setNotes(request.notes());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
    }

    // ProjectDocument
    public static ProjectDocumentResponse toResponse(ProjectDocument entity) {
        if (entity == null) return null;
        return new ProjectDocumentResponse(
                entity.getId(),
                entity.getProject().getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getContent(),
                entity.getContentFormat(),
                entity.getOrderIndex()
        );
    }

    public static ProjectDocument toEntity(ProjectDocumentRequest request, Project project) {
        if (request == null) return null;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return ProjectDocument.builder()
                .project(project)
                .type(request.type())
                .title(request.title())
                .content(request.content())
                .contentFormat(request.contentFormat())
                .orderIndex(orderIndex)
                .build();
    }

    public static void apply(ProjectDocument entity, ProjectDocumentRequest request) {
        if (entity == null || request == null) return;
        if (request.type() != null) entity.setType(request.type());
        if (request.title() != null) entity.setTitle(request.title());
        if (request.content() != null) entity.setContent(request.content());
        if (request.contentFormat() != null) entity.setContentFormat(request.contentFormat());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
    }
}
