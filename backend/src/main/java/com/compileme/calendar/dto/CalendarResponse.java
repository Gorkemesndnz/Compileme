package com.compileme.calendar.dto;

import com.compileme.task.dto.TaskResponse;
import com.compileme.education.dto.EducationResponse;
import java.util.List;

public record CalendarResponse(
    List<TaskResponse> tasks,
    List<EducationResponse> educations
) {}
