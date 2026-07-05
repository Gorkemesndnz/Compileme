package com.compileme.idea;

import com.compileme.idea.event.IdeaConvertedEvent;
import com.compileme.project.event.ProjectCreatedFromIdeaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdeaEventListener {

    private final IdeaService ideaService;

    @EventListener
    public void handleIdeaConverted(IdeaConvertedEvent event) {
        log.info("IdeaConvertedEvent received - Idea ID: {}, User ID: {}, Title: '{}'",
                event.ideaId(), event.userId(), event.title());
    }

    @EventListener
    public void handleProjectCreated(ProjectCreatedFromIdeaEvent event) {
        ideaService.linkProject(event.ideaId(), event.projectId());
    }
}
