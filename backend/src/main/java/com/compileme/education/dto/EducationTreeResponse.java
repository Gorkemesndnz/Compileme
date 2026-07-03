package com.compileme.education.dto;

import java.util.List;

public record EducationTreeResponse(
        List<EducationResourceTreeDto> resources,
        List<EducationPracticeTreeDto> practices
) {}
