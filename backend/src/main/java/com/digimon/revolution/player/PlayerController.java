package com.digimon.revolution.player;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("dev")
@RequestMapping("/api/dev/player")
public class PlayerController {
    private final PlayerService service;
    public PlayerController(PlayerService service){this.service=service;}
    @GetMapping public PlayerService.PlayerResponse load(){return service.load();}
    @PutMapping("/save") public PlayerService.PlayerResponse save(@Valid @RequestBody SaveRequest request){return service.save(request.revision(),request.progress());}
    public record SaveRequest(@Min(0) long revision,@NotNull @Valid ProgressData progress) {}
}
