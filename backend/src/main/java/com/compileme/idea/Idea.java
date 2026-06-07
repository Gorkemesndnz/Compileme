package com.compileme.idea;

import com.compileme.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "idea")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Idea extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IdeaStatus status;

    @Column(length = 300)
    private String tags;

    @Column(name = "converted_project_id")
    private Long convertedProjectId;
}
