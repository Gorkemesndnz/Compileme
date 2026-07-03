package com.compileme.education.mapper;

import com.compileme.education.*;
import com.compileme.education.dto.*;

public class EducationMapper {

    // Education
    public static EducationResponse toResponse(Education entity) {
        if (entity == null) return null;
        return new EducationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getTitle(),
                entity.getSource(),
                entity.getSourceUrl(),
                entity.getType(),
                entity.getProgressPercent(),
                entity.getStatus(),
                entity.getNextStudyDate(),
                entity.getDurationHours(),
                entity.getDescription(),
                entity.getCustomCategory(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static Education toEntity(EducationRequest request, Long userId) {
        if (request == null) return null;
        EducationStatus status = request.status() != null ? request.status() : EducationStatus.ACTIVE;
        return Education.builder()
                .userId(userId)
                .title(request.title())
                .source(request.source())
                .sourceUrl(request.sourceUrl())
                .type(request.type())
                .progressPercent(0) // Yeni eğitimler 0 ilerlemeyle başlar
                .status(status)
                .nextStudyDate(request.nextStudyDate())
                .durationHours(request.durationHours())
                .description(request.description())
                .customCategory(request.customCategory())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();
    }

    public static void apply(Education entity, EducationRequest request) {
        if (entity == null || request == null) return;
        if (request.title() != null) entity.setTitle(request.title());
        if (request.source() != null) entity.setSource(request.source());
        if (request.sourceUrl() != null) entity.setSourceUrl(request.sourceUrl());
        if (request.type() != null) entity.setType(request.type());
        if (request.status() != null) entity.setStatus(request.status());
        if (request.nextStudyDate() != null) entity.setNextStudyDate(request.nextStudyDate());
        if (request.durationHours() != null) entity.setDurationHours(request.durationHours());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.customCategory() != null) entity.setCustomCategory(request.customCategory());
        if (request.startDate() != null) entity.setStartDate(request.startDate());
        if (request.endDate() != null) entity.setEndDate(request.endDate());
    }

    // EducationResource
    public static EducationResourceResponse toResponse(EducationResource entity) {
        if (entity == null) return null;
        return new EducationResourceResponse(
                entity.getId(),
                entity.getEducation().getId(),
                entity.getName(),
                entity.getType(),
                entity.getUrlOrPath(),
                entity.getOrderIndex(),
                entity.getCompleted()
        );
    }

    public static EducationResource toEntity(EducationResourceRequest request, Education education) {
        if (request == null) return null;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return EducationResource.builder()
                .education(education)
                .name(request.name())
                .type(request.type())
                .urlOrPath(request.urlOrPath())
                .orderIndex(orderIndex)
                .completed(request.completed() != null ? request.completed() : false)
                .build();
    }

    public static void apply(EducationResource entity, EducationResourceRequest request) {
        if (request == null) return;
        if (request.name() != null) entity.setName(request.name());
        if (request.type() != null) entity.setType(request.type());
        if (request.urlOrPath() != null) entity.setUrlOrPath(request.urlOrPath());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
        if (request.completed() != null) entity.setCompleted(request.completed());
    }

    public static void apply(EducationResource entity, EducationResourceUpdateRequest request) {
        if (request == null) return;
        if (request.name() != null) entity.setName(request.name());
        if (request.type() != null) entity.setType(request.type());
        if (request.urlOrPath() != null) entity.setUrlOrPath(request.urlOrPath());
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
        if (request.completed() != null) entity.setCompleted(request.completed());
    }

    // EducationPractice
    public static EducationPracticeResponse toResponse(EducationPractice entity) {
        if (entity == null) return null;
        return new EducationPracticeResponse(
                entity.getId(),
                entity.getEducation().getId(),
                entity.getResource() != null ? entity.getResource().getId() : null,
                entity.getTitle(),
                entity.getCompleted(),
                entity.getCode(),
                entity.getNotes(),
                entity.getOrderIndex()
        );
    }

    public static EducationPractice toEntity(EducationPracticeRequest request, Education education, EducationResource resource) {
        if (request == null) return null;
        int orderIndex = request.orderIndex() != null ? request.orderIndex() : 0;
        return EducationPractice.builder()
                .education(education)
                .resource(resource)
                .title(request.title())
                .completed(request.completed())
                .code(request.code())
                .notes(request.notes())
                .orderIndex(orderIndex)
                .build();
    }

    public static void apply(EducationPractice entity, EducationPracticeRequest request, EducationResource resource) {
        if (entity == null || request == null) return;
        if (request.title() != null) entity.setTitle(request.title());
        if (request.completed() != null) entity.setCompleted(request.completed());
        if (request.code() != null) entity.setCode(request.code());
        if (request.notes() != null) entity.setNotes(request.notes());
        entity.setResource(resource);
        if (request.orderIndex() != null) entity.setOrderIndex(request.orderIndex());
    }
}
