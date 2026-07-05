package com.compileme.idea;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.idea.dto.*;
import com.compileme.idea.event.IdeaConvertedEvent;
import com.compileme.idea.event.IdeaEntrySnapshot;
import com.compileme.idea.event.IdeaResearchSnapshot;
import com.compileme.idea.mapper.IdeaMapper;
import com.compileme.task.PlanningBucket;
import com.compileme.task.TaskKind;
import com.compileme.task.TaskService;
import com.compileme.task.dto.TaskRequest;
import com.compileme.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdeaService {

    private static final int GENERATED_TITLE_LIMIT = 80;

    private final IdeaRepository ideaRepository;
    private final IdeaEntryRepository ideaEntryRepository;
    private final IdeaResearchRepository ideaResearchRepository;
    private final IdeaTaskLinkRepository ideaTaskLinkRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ApplicationEventPublisher eventPublisher;
    private final TaskService taskService;

    public List<IdeaResponse> list() {
        Long userId = currentUserProvider.getCurrentUserId();
        return ideaRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponseWithCounts)
                .toList();
    }

    public IdeaDetailResponse getDetail(Long id) {
        Idea idea = getIdeaForCurrentUser(id);
        return toDetailResponse(idea);
    }

    @Transactional
    public IdeaResponse create(IdeaRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        String content = resolveCreateContent(request);
        String title = hasText(request.title()) ? request.title().trim() : generateTitle(content);

        Idea idea = IdeaMapper.toEntity(request, userId, title, content);
        Idea savedIdea = ideaRepository.save(idea);

        ideaEntryRepository.save(IdeaEntry.builder()
                .idea(savedIdea)
                .content(content)
                .build());

        return toResponseWithCounts(savedIdea);
    }

    @Transactional
    public IdeaResponse update(Long id, IdeaRequest request) {
        Idea idea = getIdeaForCurrentUser(id);
        String resolvedContent = request.content() != null ? trimToNull(request.content()) : null;
        String resolvedTitle = null;

        if (request.title() != null) {
            resolvedTitle = hasText(request.title())
                    ? request.title().trim()
                    : generateTitle(resolvedContent != null ? resolvedContent : idea.getContent());
        }

        IdeaMapper.apply(idea, request, resolvedTitle, resolvedContent);
        Idea savedIdea = ideaRepository.save(idea);
        return toResponseWithCounts(savedIdea);
    }

    @Transactional
    public IdeaEntryResponse addEntry(Long ideaId, IdeaEntryRequest request) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaEntry entry = ideaEntryRepository.save(IdeaEntry.builder()
                .idea(idea)
                .content(request.content().trim())
                .build());
        markDeveloping(idea);
        return IdeaMapper.toEntryResponse(entry);
    }

    @Transactional
    public IdeaEntryResponse updateEntry(Long ideaId, Long entryId, IdeaEntryRequest request) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaEntry entry = getEntryForIdea(entryId, idea);
        entry.setContent(request.content().trim());
        return IdeaMapper.toEntryResponse(ideaEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(Long ideaId, Long entryId) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaEntry entry = getEntryForIdea(entryId, idea);
        ideaEntryRepository.delete(entry);
    }

    @Transactional
    public IdeaResearchResponse addResearch(Long ideaId, IdeaResearchRequest request) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaResearch research = ideaResearchRepository.save(IdeaResearch.builder()
                .idea(idea)
                .title(request.title().trim())
                .url(trimToNull(request.url()))
                .type(request.type() != null ? request.type() : IdeaResearchType.REFERENCE)
                .notes(trimToNull(request.notes()))
                .build());
        markDeveloping(idea);
        return IdeaMapper.toResearchResponse(research);
    }

    @Transactional
    public IdeaResearchResponse updateResearch(Long ideaId, Long researchId, IdeaResearchRequest request) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaResearch research = getResearchForIdea(researchId, idea);
        research.setTitle(request.title().trim());
        research.setUrl(trimToNull(request.url()));
        research.setType(request.type() != null ? request.type() : IdeaResearchType.REFERENCE);
        research.setNotes(trimToNull(request.notes()));
        return IdeaMapper.toResearchResponse(ideaResearchRepository.save(research));
    }

    @Transactional
    public void deleteResearch(Long ideaId, Long researchId) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaResearch research = getResearchForIdea(researchId, idea);
        ideaResearchRepository.delete(research);
    }

    @Transactional
    public IdeaTaskLinkResponse createTask(Long ideaId, IdeaTaskCreateRequest request) {
        Idea idea = getIdeaForCurrentUser(ideaId);
        IdeaEntry entry = request.entryId() != null ? getEntryForIdea(request.entryId(), idea) : null;
        TaskResponse task = taskService.create(new TaskRequest(
                request.title().trim(),
                request.notes(),
                TaskKind.GENERAL,
                request.scheduledDate(),
                request.scheduledTime(),
                request.durationMinutes(),
                request.planningBucket() != null ? request.planningBucket() : PlanningBucket.DAY,
                request.targetPeriod(),
                null,
                null,
                null
        ));

        IdeaTaskLink link = ideaTaskLinkRepository.save(IdeaTaskLink.builder()
                .idea(idea)
                .entry(entry)
                .taskId(task.id())
                .build());
        markDeveloping(idea);
        return IdeaMapper.toTaskLinkResponse(link, task);
    }

    @Transactional
    public IdeaResponse convert(Long id) {
        Idea idea = getIdeaForCurrentUser(id);
        if (idea.getStatus() == IdeaStatus.CONVERTED) {
            throw new IllegalStateException("Fikir zaten projeye donusturulmus");
        }

        idea.setStatus(IdeaStatus.CONVERTED);
        Idea savedIdea = ideaRepository.save(idea);

        eventPublisher.publishEvent(new IdeaConvertedEvent(
                savedIdea.getId(),
                savedIdea.getUserId(),
                savedIdea.getTitle(),
                savedIdea.getContent(),
                entrySnapshots(savedIdea.getId()),
                researchSnapshots(savedIdea.getId())
        ));

        return toResponseWithCounts(savedIdea);
    }

    @Transactional
    public void linkProject(Long ideaId, Long projectId) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new NotFoundException("Fikir bulunamadi: " + ideaId));
        idea.setConvertedProjectId(projectId);
        idea.setStatus(IdeaStatus.CONVERTED);
        ideaRepository.save(idea);
    }

    @Transactional
    public void delete(Long id) {
        Idea idea = getIdeaForCurrentUser(id);
        ideaRepository.delete(idea);
    }

    private IdeaDetailResponse toDetailResponse(Idea idea) {
        List<IdeaEntryResponse> entries = ideaEntryRepository.findAllByIdeaIdOrderByCreatedAtDesc(idea.getId())
                .stream()
                .map(IdeaMapper::toEntryResponse)
                .toList();
        List<IdeaResearchResponse> research = ideaResearchRepository.findAllByIdeaIdOrderByCreatedAtDesc(idea.getId())
                .stream()
                .map(IdeaMapper::toResearchResponse)
                .toList();
        List<IdeaTaskLinkResponse> tasks = ideaTaskLinkRepository.findAllByIdeaIdOrderByCreatedAtDesc(idea.getId())
                .stream()
                .map(link -> IdeaMapper.toTaskLinkResponse(link, taskService.getById(link.getTaskId())))
                .toList();

        return new IdeaDetailResponse(
                toResponseWithCounts(idea),
                entries,
                research,
                tasks
        );
    }

    private IdeaResponse toResponseWithCounts(Idea idea) {
        return IdeaMapper.toResponse(
                idea,
                ideaEntryRepository.countByIdeaId(idea.getId()),
                ideaResearchRepository.countByIdeaId(idea.getId()),
                ideaTaskLinkRepository.countByIdeaId(idea.getId())
        );
    }

    private Idea getIdeaForCurrentUser(Long id) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Fikir bulunamadi: " + id));
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!idea.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Fikir bulunamadi: " + id);
        }
        return idea;
    }

    private IdeaEntry getEntryForIdea(Long entryId, Idea idea) {
        IdeaEntry entry = ideaEntryRepository.findById(entryId)
                .orElseThrow(() -> new NotFoundException("Fikir girdisi bulunamadi: " + entryId));
        if (!entry.getIdea().getId().equals(idea.getId())) {
            throw new NotFoundException("Fikir girdisi bulunamadi: " + entryId);
        }
        return entry;
    }

    private IdeaResearch getResearchForIdea(Long researchId, Idea idea) {
        IdeaResearch research = ideaResearchRepository.findById(researchId)
                .orElseThrow(() -> new NotFoundException("Arastirma bulunamadi: " + researchId));
        if (!research.getIdea().getId().equals(idea.getId())) {
            throw new NotFoundException("Arastirma bulunamadi: " + researchId);
        }
        return research;
    }

    private void markDeveloping(Idea idea) {
        if (idea.getStatus() == IdeaStatus.RAW) {
            idea.setStatus(IdeaStatus.DEVELOPING);
            ideaRepository.save(idea);
        }
    }

    private List<IdeaEntrySnapshot> entrySnapshots(Long ideaId) {
        return ideaEntryRepository.findAllByIdeaIdOrderByCreatedAtDesc(ideaId)
                .stream()
                .map(entry -> new IdeaEntrySnapshot(entry.getId(), entry.getContent(), entry.getCreatedAt()))
                .toList();
    }

    private List<IdeaResearchSnapshot> researchSnapshots(Long ideaId) {
        return ideaResearchRepository.findAllByIdeaIdOrderByCreatedAtDesc(ideaId)
                .stream()
                .map(research -> new IdeaResearchSnapshot(
                        research.getId(),
                        research.getTitle(),
                        research.getUrl(),
                        research.getType(),
                        research.getNotes(),
                        research.getCreatedAt()
                ))
                .toList();
    }

    private String resolveCreateContent(IdeaRequest request) {
        String content = trimToNull(request.content());
        if (content != null) {
            return content;
        }
        String title = trimToNull(request.title());
        if (title != null) {
            return title;
        }
        throw new IllegalArgumentException("Fikir icerigi veya basligi zorunludur.");
    }

    private String generateTitle(String content) {
        String source = trimToNull(content);
        if (source == null) {
            return "Yeni fikir";
        }
        int sentenceEnd = findFirstSentenceEnd(source);
        String title = sentenceEnd > 0 ? source.substring(0, sentenceEnd).trim() : source;
        if (title.length() > GENERATED_TITLE_LIMIT) {
            title = title.substring(0, GENERATED_TITLE_LIMIT).trim();
        }
        return title;
    }

    private int findFirstSentenceEnd(String value) {
        int best = -1;
        for (String marker : List.of(".", "!", "?")) {
            int index = value.indexOf(marker);
            if (index >= 0 && (best < 0 || index < best)) {
                best = index + 1;
            }
        }
        return best;
    }

    private boolean hasText(String value) {
        return trimToNull(value) != null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
