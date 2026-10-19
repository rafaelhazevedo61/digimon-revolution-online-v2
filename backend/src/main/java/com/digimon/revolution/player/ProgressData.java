package com.digimon.revolution.player;

import jakarta.validation.constraints.*;
import java.util.List;

/** Development checkpoint only. Gameplay is still calculated by the client. */
public record ProgressData(
    @Min(2) @Max(2) int version,
    @Min(1) @Max(10000) int level,
    @Min(0) @Max(1000000) long xp,
    @Min(0) @Max(1000000000) long bits,
    @Min(0) @Max(3) int stage,
    @Min(1) @Max(30) int areaId,
    @Min(0) @Max(30) int lastWonArea,
    @Min(0) @Max(100) int attackUpgrade,
    @Min(0) @Max(100) int healthUpgrade,
    @Min(0) @Max(1000000000) long totalXP,
    @Min(0) @Max(10000000) long victories,
    @NotNull @Size(max=6) List<@NotNull @Min(5) @Max(30) Integer> bosses,
    boolean complete,
    @Min(0) long savedAt
) {
    @AssertTrue(message="Checkpoint contains inconsistent progression")
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isConsistent() {
        return xp < 60L+(level-1)*25L && (!complete || areaId==30)
            && bosses!=null && bosses.stream().allMatch(id -> id!=null && id%5==0);
    }
}
