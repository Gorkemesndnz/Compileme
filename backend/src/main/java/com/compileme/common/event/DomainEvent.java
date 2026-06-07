package com.compileme.common.event;

import java.time.OffsetDateTime;

/**
 * Bütün Spring domain event'leri için ortak işaretçi arayüzü (Marker Interface).
 * Domain olaylarının ortak özelliklerini barındırır.
 */
public interface DomainEvent {
    
    /**
     * Olayın gerçekleştiği tarih ve saat bilgisini döner.
     */
    OffsetDateTime getOccurredAt();
}
