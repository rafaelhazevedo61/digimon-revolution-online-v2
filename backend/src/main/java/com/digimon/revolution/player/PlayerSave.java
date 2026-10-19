package com.digimon.revolution.player;

import jakarta.persistence.*;

@Entity
@Table(name="player_save")
public class PlayerSave {
    @Id private String id;
    @Version private Long revision;
    @Lob private String progressJson;
    protected PlayerSave() {}
    PlayerSave(String id) { this.id=id; }
    public String getId(){return id;}
    public long getRevision(){return revision==null?0:revision;}
    public String getProgressJson(){return progressJson;}
    public void setProgressJson(String value){progressJson=value;}
}
