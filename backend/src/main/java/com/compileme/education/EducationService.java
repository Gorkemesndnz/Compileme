package com.compileme.education;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.education.dto.*;
import com.compileme.education.mapper.EducationMapper;
import com.compileme.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EducationService {

    private final EducationRepository educationRepository;
    private final EducationResourceRepository educationResourceRepository;
    private final EducationPracticeRepository educationPracticeRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FileService fileService;

    public List<EducationResponse> listByNextStudyDateRange(LocalDate from, LocalDate to) {
        Long userId = currentUserProvider.getCurrentUserId();
        return educationRepository.findAllByUserIdAndNextStudyDateBetween(userId, from, to)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    // =========================================================================
    // Education CRUD
    // =========================================================================

    public List<EducationResponse> list() {
        Long userId = currentUserProvider.getCurrentUserId();
        return educationRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    public EducationResponse getById(Long id) {
        Education education = getEducationForCurrentUser(id);
        return EducationMapper.toResponse(education);
    }

    public void ensureEducationBelongsToCurrentUser(Long id) {
        getEducationForCurrentUser(id);
    }

    @Transactional
    public EducationResponse create(EducationRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Education education = EducationMapper.toEntity(request, userId);
        Education saved = educationRepository.save(education);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public EducationResponse update(Long id, EducationRequest request) {
        Education education = getEducationForCurrentUser(id);
        EducationMapper.apply(education, request);
        Education saved = educationRepository.save(education);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Education education = getEducationForCurrentUser(id);
        educationRepository.delete(education);
    }

    @Transactional
    public EducationResponse updateProgress(Long id, Integer progressPercent) {
        Education education = getEducationForCurrentUser(id);
        education.setProgressPercent(progressPercent);
        Education saved = educationRepository.save(education);
        return EducationMapper.toResponse(saved);
    }

    // =========================================================================
    // Resources
    // =========================================================================

    public List<EducationResourceResponse> listResources(Long eduId) {
        getEducationForCurrentUser(eduId);
        return educationResourceRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    @Transactional
    public EducationResourceResponse addResource(Long eduId, EducationResourceRequest request) {
        Education education = getEducationForCurrentUser(eduId);
        validateResourceFileReference(request.type(), request.urlOrPath());

        int orderIndex;
        if (request.orderIndex() == null) {
            orderIndex = educationResourceRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                    .stream()
                    .mapToInt(EducationResource::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        EducationResource resource = EducationMapper.toEntity(request, education);
        resource.setOrderIndex(orderIndex);
        EducationResource saved = educationResourceRepository.save(resource);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public EducationResourceResponse updateResource(Long resourceId, EducationResourceUpdateRequest request) {
        EducationResource resource = educationResourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Kaynak bulunamadi: " + resourceId));
        checkEducationOwnership(resource.getEducation());

        ResourceType nextType = request.type() != null ? request.type() : resource.getType();
        String nextUrlOrPath = request.urlOrPath() != null ? request.urlOrPath() : resource.getUrlOrPath();
        validateResourceFileReference(nextType, nextUrlOrPath);

        EducationMapper.apply(resource, request);
        return EducationMapper.toResponse(resource);
    }

    @Transactional
    public void reorderResources(Long eduId, List<EducationResourceReorderItem> items) {
        Education education = getEducationForCurrentUser(eduId);

        for (EducationResourceReorderItem item : items) {
            EducationResource resource = educationResourceRepository.findById(item.id())
                    .orElseThrow(() -> new NotFoundException("Kaynak bulunamadi: " + item.id()));
            if (!resource.getEducation().getId().equals(education.getId())) {
                throw new NotFoundException("Kaynak bu egitime ait degil: " + item.id());
            }
            resource.setOrderIndex(item.orderIndex());
        }
    }

    @Transactional
    public void deleteResource(Long resourceId) {
        EducationResource resource = educationResourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Kaynak bulunamadi: " + resourceId));
        checkEducationOwnership(resource.getEducation());
        educationResourceRepository.delete(resource);
    }

    private void validateResourceFileReference(ResourceType type, String urlOrPath) {
        if (type == ResourceType.LINK || urlOrPath == null || !urlOrPath.startsWith("/api/files/")) {
            return;
        }

        try {
            Long fileId = Long.parseLong(urlOrPath.substring("/api/files/".length()));
            fileService.getMetadata(fileId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Gecersiz dosya URL bicimi: " + urlOrPath);
        }
    }

    // =========================================================================
    // Practices
    // =========================================================================

    public List<EducationPracticeResponse> listPractices(Long eduId) {
        getEducationForCurrentUser(eduId);
        return educationPracticeRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    @Transactional
    public EducationPracticeResponse addPractice(Long eduId, EducationPracticeRequest request) {
        Education education = getEducationForCurrentUser(eduId);
        EducationResource resource = resolvePracticeResource(education, request.resourceId());

        int orderIndex;
        if (request.orderIndex() == null) {
            orderIndex = educationPracticeRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                    .stream()
                    .mapToInt(EducationPractice::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;
        } else {
            orderIndex = request.orderIndex();
        }

        EducationPractice practice = EducationMapper.toEntity(request, education, resource);
        practice.setOrderIndex(orderIndex);
        EducationPractice saved = educationPracticeRepository.save(practice);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public EducationPracticeResponse updatePractice(Long practiceId, EducationPracticeRequest request) {
        EducationPractice practice = educationPracticeRepository.findById(practiceId)
                .orElseThrow(() -> new NotFoundException("Pratik bulunamadi: " + practiceId));
        checkEducationOwnership(practice.getEducation());
        EducationResource resource = resolvePracticeResource(practice.getEducation(), request.resourceId());

        EducationMapper.apply(practice, request, resource);
        EducationPractice saved = educationPracticeRepository.save(practice);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public void deletePractice(Long practiceId) {
        EducationPractice practice = educationPracticeRepository.findById(practiceId)
                .orElseThrow(() -> new NotFoundException("Pratik bulunamadi: " + practiceId));
        checkEducationOwnership(practice.getEducation());
        educationPracticeRepository.delete(practice);
    }

    public EducationTreeResponse getEducationTree(Long id) {
        getEducationForCurrentUser(id);
        List<EducationResourceTreeDto> resources = educationResourceRepository.findTreeDtoByEducationId(id);
        List<EducationPracticeTreeDto> practices = educationPracticeRepository.findTreeDtoByEducationId(id);
        return new EducationTreeResponse(resources, practices);
    }

    public EducationPracticeResponse getPracticeById(Long practiceId) {
        EducationPractice practice = educationPracticeRepository.findById(practiceId)
                .orElseThrow(() -> new NotFoundException("Pratik bulunamadi: " + practiceId));
        checkEducationOwnership(practice.getEducation());
        return EducationMapper.toResponse(practice);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Education getEducationForCurrentUser(Long id) {
        Education education = educationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Egitim bulunamadi: " + id));
        checkEducationOwnership(education);
        return education;
    }

    private void checkEducationOwnership(Education education) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!education.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Egitim bulunamadi: " + education.getId());
        }
    }

    private EducationResource resolvePracticeResource(Education education, Long resourceId) {
        if (resourceId == null) {
            return null;
        }

        EducationResource resource = educationResourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Kaynak bulunamadi: " + resourceId));
        checkEducationOwnership(resource.getEducation());
        if (!resource.getEducation().getId().equals(education.getId())) {
            throw new IllegalArgumentException("Pratik kaynagi ayni egitime ait olmalidir.");
        }
        return resource;
    }
}
