package com.compileme.education;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "education_practice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationPractice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "education_id", nullable = false)
    private Education education;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private EducationResource resource;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private Boolean completed;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
