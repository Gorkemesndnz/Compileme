package com.compileme.education;

import com.compileme.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "education")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Education extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String source;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EducationType type;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EducationStatus status;

    @Column(name = "next_study_date")
    private LocalDate nextStudyDate;
}
