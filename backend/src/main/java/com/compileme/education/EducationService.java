package com.compileme.education;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.education.dto.*;
import com.compileme.education.mapper.EducationMapper;
import com.compileme.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        getEducationForCurrentUser(eduId); // Sahiplik kontrolü
        return educationResourceRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    @Transactional
    public EducationResourceResponse addResource(Long eduId, EducationResourceRequest request) {
        Education education = getEducationForCurrentUser(eduId);

        // Faz 6 Entegrasyonu: Kaynak dosya tipindeyse dosya varlığı ve sahipliği kontrol edilir
        if (request.type() != ResourceType.LINK) {
            String urlOrPath = request.urlOrPath();
            if (urlOrPath.startsWith("/api/files/")) {
                try {
                    Long fileId = Long.parseLong(urlOrPath.substring("/api/files/".length()));
                    // FileService dosya bulunamazsa veya kullanıcıya ait değilse NotFoundException fırlatır
                    fileService.getMetadata(fileId);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Geçersiz dosya URL biçimi: " + urlOrPath);
                }
            }
        }

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
    public void deleteResource(Long resourceId) {
        EducationResource resource = educationResourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Kaynak bulunamadı: " + resourceId));
        checkEducationOwnership(resource.getEducation());
        educationResourceRepository.delete(resource);
    }

    // =========================================================================
    // Practices
    // =========================================================================

    public List<EducationPracticeResponse> listPractices(Long eduId) {
        getEducationForCurrentUser(eduId); // Sahiplik kontrolü
        return educationPracticeRepository.findAllByEducationIdOrderByOrderIndexAsc(eduId)
                .stream()
                .map(EducationMapper::toResponse)
                .toList();
    }

    @Transactional
    public EducationPracticeResponse addPractice(Long eduId, EducationPracticeRequest request) {
        Education education = getEducationForCurrentUser(eduId);

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

        EducationPractice practice = EducationMapper.toEntity(request, education);
        practice.setOrderIndex(orderIndex);
        EducationPractice saved = educationPracticeRepository.save(practice);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public EducationPracticeResponse updatePractice(Long practiceId, EducationPracticeRequest request) {
        EducationPractice practice = educationPracticeRepository.findById(practiceId)
                .orElseThrow(() -> new NotFoundException("Pratik bulunamadı: " + practiceId));
        checkEducationOwnership(practice.getEducation());

        EducationMapper.apply(practice, request);
        EducationPractice saved = educationPracticeRepository.save(practice);
        return EducationMapper.toResponse(saved);
    }

    @Transactional
    public void deletePractice(Long practiceId) {
        EducationPractice practice = educationPracticeRepository.findById(practiceId)
                .orElseThrow(() -> new NotFoundException("Pratik bulunamadı: " + practiceId));
        checkEducationOwnership(practice.getEducation());
        educationPracticeRepository.delete(practice);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Education getEducationForCurrentUser(Long id) {
        Education education = educationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Eğitim bulunamadı: " + id));
        checkEducationOwnership(education);
        return education;
    }

    private void checkEducationOwnership(Education education) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!education.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Eğitim bulunamadı: " + education.getId());
        }
    }
}
