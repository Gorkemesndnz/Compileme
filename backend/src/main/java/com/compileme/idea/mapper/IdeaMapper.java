package com.compileme.idea.mapper;

import com.compileme.idea.*;
import com.compileme.idea.dto.*;
import com.compileme.task.dto.TaskResponse;

public class IdeaMapper {

    public static IdeaResponse toResponse(Idea entity) {
        return toResponse(entity, 0, 0, 0);
    }

    public static IdeaResponse toResponse(Idea entity, long entryCount, long researchCount, long taskCount) {
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
                entryCount,
                researchCount,
                taskCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static Idea toEntity(IdeaRequest request, Long userId, String title, String content) {
        if (request == null) {
            return null;
        }
        IdeaStatus status = request.status() != null ? request.status() : IdeaStatus.RAW;
        return Idea.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .status(status)
                .tags(request.tags())
                .build();
    }

    public static void apply(Idea entity, IdeaRequest request, String resolvedTitle, String resolvedContent) {
        if (entity == null || request == null) {
            return;
        }
        if (resolvedTitle != null) {
            entity.setTitle(resolvedTitle);
        }
        if (resolvedContent != null) {
            entity.setContent(resolvedContent);
        }
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        if (request.tags() != null) {
            entity.setTags(request.tags());
        }
    }

    public static IdeaEntryResponse toEntryResponse(IdeaEntry entity) {
        if (entity == null) {
            return null;
        }
        return new IdeaEntryResponse(
                entity.getId(),
                entity.getIdea().getId(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static IdeaResearchResponse toResearchResponse(IdeaResearch entity) {
        if (entity == null) {
            return null;
        }
        return new IdeaResearchResponse(
                entity.getId(),
                entity.getIdea().getId(),
                entity.getTitle(),
                entity.getUrl(),
                entity.getType(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static IdeaTaskLinkResponse toTaskLinkResponse(IdeaTaskLink entity, TaskResponse task) {
        if (entity == null) {
            return null;
        }
        return new IdeaTaskLinkResponse(
                entity.getId(),
                entity.getIdea().getId(),
                entity.getEntry() != null ? entity.getEntry().getId() : null,
                task,
                entity.getCreatedAt()
        );
    }
}
