package com.compileme.project.dto;

import com.compileme.project.LinkCategory;
import com.compileme.project.LinkType;

public record ProjectLinkResponse(
        Long id,
        Long projectId,
        String title,
        String url,
        LinkType type,
        LinkCategory category,
        String notes,
        int orderIndex
) {}
