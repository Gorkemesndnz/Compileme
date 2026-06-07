package com.compileme.project;

import com.compileme.idea.event.IdeaConvertedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectEventListener {

    private final ProjectService projectService;

    @EventListener
    public void handleIdeaConverted(IdeaConvertedEvent event) {
        log.info("ProjectEventListener: IdeaConvertedEvent received for Idea ID: {}, Title: '{}'",
                event.ideaId(), event.title());
        projectService.createFromIdea(event.ideaId(), event.userId(), event.title(), event.content());
    }
}
