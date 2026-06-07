package com.compileme.education;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "education_resource")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "education_id", nullable = false)
    private Education education;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType type;

    @Column(name = "url_or_path", nullable = false, columnDefinition = "TEXT")
    private String urlOrPath;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
