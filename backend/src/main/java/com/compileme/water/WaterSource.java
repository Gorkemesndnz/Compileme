package com.compileme.water;

import lombok.Getter;

@Getter
public enum WaterSource {
    BOTTLE_1500(1500),
    HALF_500(500),
    GLASS_300(300),
    CUSTOM(null);

    private final Integer defaultMl;

    WaterSource(Integer defaultMl) {
        this.defaultMl = defaultMl;
    }
}
