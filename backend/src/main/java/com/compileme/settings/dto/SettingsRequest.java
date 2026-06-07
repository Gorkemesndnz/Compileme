package com.compileme.settings.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SettingsRequest(
        @NotNull(message = "Su tüketimi hedefi boş olamaz")
        @Min(value = 1, message = "Su tüketimi hedefi en az 1 ml olmalıdır")
        Integer waterGoalMl,

        @NotBlank(message = "Hava durumu şehri boş olamaz")
        @Size(max = 120, message = "Şehir adı en fazla 120 karakter olabilir")
        String weatherCity,

        @NotBlank(message = "Tema boş olamaz")
        @Size(max = 20, message = "Tema adı en fazla 20 karakter olabilir")
        String theme,

        @NotNull(message = "Odak ekranı parlaklığı boş olamaz")
        @Min(value = 0, message = "Parlaklık en az 0 olmalıdır")
        Integer focusBrightness,

        @NotBlank(message = "Odak ekranı sıcaklığı boş olamaz")
        @Size(max = 20, message = "Sıcaklık değeri en fazla 20 karakter olabilir")
        String focusTemperature
) {}
