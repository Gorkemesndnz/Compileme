package com.compileme.idea.dto;

import java.util.List;

public record IdeaDetailResponse(
        IdeaResponse idea,
        List<IdeaEntryResponse> entries,
        List<IdeaResearchResponse> research,
        List<IdeaTaskLinkResponse> tasks
) {}
