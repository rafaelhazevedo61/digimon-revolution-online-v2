package com.digimon.revolution.player;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("dev")
public class PlayerService {
    private static final String LOCAL_PLAYER="local-player";
    private final PlayerRepository repository;
    private final ObjectMapper mapper;
    public PlayerService(PlayerRepository repository,ObjectMapper mapper){this.repository=repository;this.mapper=mapper;}
    @PostConstruct
    void seed(){if(!repository.existsById(LOCAL_PLAYER))repository.saveAndFlush(new PlayerSave(LOCAL_PLAYER));}
    @Transactional(readOnly=true)
    public PlayerResponse load(){return response(repository.findById(LOCAL_PLAYER).orElseThrow());}
    @Transactional
    public PlayerResponse save(long expectedRevision,ProgressData progress){
        PlayerSave player=repository.findById(LOCAL_PLAYER).orElseThrow();
        if(player.getRevision()!=expectedRevision)throw new ResponseStatusException(HttpStatus.CONFLICT,"Save revision changed. Reload before syncing again.");
        try{player.setProgressJson(mapper.writeValueAsString(progress));}
        catch(JsonProcessingException e){throw new IllegalStateException("Could not encode progress",e);}
        repository.saveAndFlush(player);
        return response(player);
    }
    private PlayerResponse response(PlayerSave player){
        try{return new PlayerResponse(player.getId(),player.getRevision(),player.getProgressJson()==null?null:mapper.readValue(player.getProgressJson(),ProgressData.class));}
        catch(JsonProcessingException e){throw new IllegalStateException("Could not decode progress",e);}
    }
    public record PlayerResponse(String playerId,long revision,ProgressData progress) {}
}
