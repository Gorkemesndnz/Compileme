package com.compileme.idea;

import com.compileme.idea.event.IdeaConvertedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class IdeaEventListener {

    @EventListener
    public void handleIdeaConverted(IdeaConvertedEvent event) {
        log.info("IdeaConvertedEvent received - Idea ID: {}, User ID: {}, Title: '{}'",
                event.ideaId(), event.userId(), event.title());
        // Faz 5 (Projeler modülü) kapsamında bu dinleyici genişletilerek 
        // gelen fikir verisinden yeni bir Project entity'si oluşturulacaktır.
    }
}
