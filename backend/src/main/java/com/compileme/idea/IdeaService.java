package com.compileme.idea;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.idea.dto.IdeaRequest;
import com.compileme.idea.dto.IdeaResponse;
import com.compileme.idea.event.IdeaConvertedEvent;
import com.compileme.idea.mapper.IdeaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdeaService {

    private final IdeaRepository ideaRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ApplicationEventPublisher eventPublisher;

    public List<IdeaResponse> list() {
        Long userId = currentUserProvider.getCurrentUserId();
        return ideaRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(IdeaMapper::toResponse)
                .toList();
    }

    @Transactional
    public IdeaResponse create(IdeaRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Idea idea = IdeaMapper.toEntity(request, userId);
        Idea savedIdea = ideaRepository.save(idea);
        return IdeaMapper.toResponse(savedIdea);
    }

    @Transactional
    public IdeaResponse update(Long id, IdeaRequest request) {
        Idea idea = getIdeaForCurrentUser(id);
        IdeaMapper.apply(idea, request);
        Idea savedIdea = ideaRepository.save(idea);
        return IdeaMapper.toResponse(savedIdea);
    }

    @Transactional
    public IdeaResponse convert(Long id) {
        Idea idea = getIdeaForCurrentUser(id);
        if (idea.getStatus() == IdeaStatus.CONVERTED) {
            throw new IllegalStateException("Fikir zaten projeye dönüştürülmüş");
        }

        idea.setStatus(IdeaStatus.CONVERTED);
        Idea savedIdea = ideaRepository.save(idea);

        // Modüller arası domain event'i yayınla
        eventPublisher.publishEvent(new IdeaConvertedEvent(
                idea.getId(),
                idea.getUserId(),
                idea.getTitle(),
                idea.getContent()
        ));

        return IdeaMapper.toResponse(savedIdea);
    }

    @Transactional
    public void delete(Long id) {
        Idea idea = getIdeaForCurrentUser(id);
        ideaRepository.delete(idea);
    }

    private Idea getIdeaForCurrentUser(Long id) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Fikir bulunamadı: " + id));
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!idea.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Fikir bulunamadı: " + id);
        }
        return idea;
    }
}
