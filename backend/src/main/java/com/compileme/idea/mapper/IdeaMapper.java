package com.compileme.idea.mapper;

import com.compileme.idea.Idea;
import com.compileme.idea.IdeaStatus;
import com.compileme.idea.dto.IdeaRequest;
import com.compileme.idea.dto.IdeaResponse;

public class IdeaMapper {

    public static IdeaResponse toResponse(Idea entity) {
        if (entity == null) {
            return null;
        }
        return new IdeaResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getTitle(),
                entity.getContent(),
                entity.getStatus(),
                entity.getTags(),
                entity.getConvertedProjectId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static Idea toEntity(IdeaRequest request, Long userId) {
        if (request == null) {
            return null;
        }
        IdeaStatus status = request.status() != null ? request.status() : IdeaStatus.RAW;
        return Idea.builder()
                .userId(userId)
                .title(request.title())
                .content(request.content())
                .status(status)
                .tags(request.tags())
                .build();
    }

    public static void apply(Idea entity, IdeaRequest request) {
        if (entity == null || request == null) {
            return;
        }
        if (request.title() != null) {
            entity.setTitle(request.title());
        }
        if (request.content() != null) {
            entity.setContent(request.content());
        }
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        if (request.tags() != null) {
            entity.setTags(request.tags());
        }
    }
}
