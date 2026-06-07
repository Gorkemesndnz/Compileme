package com.compileme.common.event;

import java.time.OffsetDateTime;

/**
 * Modüller arası domain event konvansiyonunun somut örneğidir.
 * Örnek: "Fikir projeye dönüştüğünde" veya "Ayarlar güncellendiğinde" tetiklenecek bir olayı temsil eder.
 */
public record ExampleDomainEvent(
        Long userId,
        String description,
        OffsetDateTime occurredAt
) implements DomainEvent {

    public ExampleDomainEvent(Long userId, String description) {
        this(userId, description, OffsetDateTime.now());
    }

    @Override
    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}
