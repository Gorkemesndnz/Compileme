package com.compileme.common.security;

import org.springframework.stereotype.Component;

/**
 * Mevcut giriş yapmış kullanıcının ID bilgisini sağlayan servis.
 * Şu an için auth sistemi (Spring Security) kurulana kadar varsayılan olarak id = 1L (Görkem) döner.
 */
@Component
public class CurrentUserProvider {

    public Long getCurrentUserId() {
        return 1L; // V2 seed dosyasında eklenen Görkem kullanıcısının ID'si
    }
}
