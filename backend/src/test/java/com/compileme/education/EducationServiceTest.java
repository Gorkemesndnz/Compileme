package com.compileme.education;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.education.dto.*;
import com.compileme.file.FileService;
import com.compileme.file.StoredFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EducationServiceTest {

    @Mock
    private EducationRepository educationRepository;
    @Mock
    private EducationResourceRepository educationResourceRepository;
    @Mock
    private EducationPracticeRepository educationPracticeRepository;
    @Mock
    private CurrentUserProvider currentUserProvider;
    @Mock
    private FileService fileService;

    @InjectMocks
    private EducationService educationService;

    private Long userId = 1L;
    private Education education;

    @BeforeEach
    void setUp() {
        education = Education.builder()
                .userId(userId)
                .title("Rust Language")
                .source("Rust Book")
                .type(EducationType.PROGRAMMING)
                .progressPercent(0)
                .status(EducationStatus.ACTIVE)
                .nextStudyDate(LocalDate.now())
                .build();
        education.setId(10L);
    }

    @Test
    void list_ShouldReturnEducationResponses() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationRepository.findAllByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(education));

        List<EducationResponse> result = educationService.list();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Rust Language", result.get(0).title());
    }

    @Test
    void create_ShouldSaveEducation() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationRepository.save(any(Education.class))).thenReturn(education);

        EducationRequest request = new EducationRequest("Rust Language", "Rust Book", null, EducationType.PROGRAMMING, EducationStatus.ACTIVE, LocalDate.now(), null, null, null, null, null);
        EducationResponse response = educationService.create(request);

        assertNotNull(response);
        assertEquals("Rust Language", response.title());
    }

    @Test
    void updateProgress_ShouldChangePercent() {
        when(educationRepository.findById(10L)).thenReturn(Optional.of(education));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationRepository.save(any(Education.class))).thenReturn(education);

        EducationResponse response = educationService.updateProgress(10L, 50);

        assertEquals(50, education.getProgressPercent());
    }

    @Test
    void addResource_ShouldVerifyFile_WhenFileResourceProvided() {
        when(educationRepository.findById(10L)).thenReturn(Optional.of(education));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        EducationResource resource = EducationResource.builder()
                .id(1L)
                .education(education)
                .name("Slides")
                .type(ResourceType.PDF)
                .urlOrPath("/api/files/5")
                .orderIndex(0)
                .build();

        when(educationResourceRepository.save(any(EducationResource.class))).thenReturn(resource);
        when(fileService.getMetadata(5L)).thenReturn(mock(StoredFile.class));

        EducationResourceRequest request = new EducationResourceRequest("Slides", ResourceType.PDF, "/api/files/5", 0);
        EducationResourceResponse response = educationService.addResource(10L, request);

        assertNotNull(response);
        verify(fileService, times(1)).getMetadata(5L);
        verify(educationResourceRepository, times(1)).save(any(EducationResource.class));
    }

    @Test
    void addPractice_ShouldAllowGeneralPractice_WhenResourceIdIsNull() {
        when(educationRepository.findById(10L)).thenReturn(Optional.of(education));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationPracticeRepository.findAllByEducationIdOrderByOrderIndexAsc(10L)).thenReturn(List.of());

        EducationPractice saved = EducationPractice.builder()
                .id(99L)
                .education(education)
                .resource(null)
                .title("General exercise")
                .completed(false)
                .code("")
                .notes("")
                .orderIndex(0)
                .build();
        when(educationPracticeRepository.save(any(EducationPractice.class))).thenReturn(saved);

        EducationPracticeRequest request = new EducationPracticeRequest("General exercise", false, "", "", null, null);
        EducationPracticeResponse response = educationService.addPractice(10L, request);

        assertNotNull(response);
        assertNull(response.resourceId());
        verify(educationResourceRepository, never()).findById(any());
    }

    @Test
    void addPractice_ShouldAttachResource_WhenResourceBelongsToEducation() {
        EducationResource resource = EducationResource.builder()
                .id(22L)
                .education(education)
                .name("PDF")
                .type(ResourceType.PDF)
                .urlOrPath("/api/files/22")
                .orderIndex(0)
                .build();

        when(educationRepository.findById(10L)).thenReturn(Optional.of(education));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationResourceRepository.findById(22L)).thenReturn(Optional.of(resource));
        when(educationPracticeRepository.findAllByEducationIdOrderByOrderIndexAsc(10L)).thenReturn(List.of());

        EducationPractice saved = EducationPractice.builder()
                .id(99L)
                .education(education)
                .resource(resource)
                .title("Resource exercise")
                .completed(false)
                .code("")
                .notes("")
                .orderIndex(0)
                .build();
        when(educationPracticeRepository.save(any(EducationPractice.class))).thenReturn(saved);

        EducationPracticeRequest request = new EducationPracticeRequest("Resource exercise", false, "", "", 22L, null);
        EducationPracticeResponse response = educationService.addPractice(10L, request);

        assertEquals(22L, response.resourceId());
    }

    @Test
    void addPractice_ShouldRejectResourceFromAnotherEducation() {
        Education otherEducation = Education.builder()
                .userId(userId)
                .title("Other")
                .source("Other")
                .type(EducationType.PROGRAMMING)
                .progressPercent(0)
                .status(EducationStatus.ACTIVE)
                .nextStudyDate(LocalDate.now())
                .build();
        otherEducation.setId(11L);

        EducationResource resource = EducationResource.builder()
                .id(22L)
                .education(otherEducation)
                .name("Other PDF")
                .type(ResourceType.PDF)
                .urlOrPath("/api/files/22")
                .orderIndex(0)
                .build();

        when(educationRepository.findById(10L)).thenReturn(Optional.of(education));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(educationResourceRepository.findById(22L)).thenReturn(Optional.of(resource));

        EducationPracticeRequest request = new EducationPracticeRequest("Resource exercise", false, "", "", 22L, null);

        assertThrows(IllegalArgumentException.class, () -> educationService.addPractice(10L, request));
    }
}
