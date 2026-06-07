package com.compileme.settings;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "water_goal_ml", nullable = false)
    private Integer waterGoalMl;

    @Column(name = "weather_city", nullable = false, length = 120)
    private String weatherCity;

    @Column(name = "theme", nullable = false, length = 20)
    private String theme;

    @Column(name = "focus_brightness", nullable = false)
    private Integer focusBrightness;

    @Column(name = "focus_temperature", nullable = false, length = 20)
    private String focusTemperature;
}
