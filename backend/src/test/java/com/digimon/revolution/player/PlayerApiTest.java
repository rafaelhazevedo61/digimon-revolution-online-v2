package com.digimon.revolution.player;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@DirtiesContext(classMode=DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PlayerApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    ProgressData valid(){return new ProgressData(2,1,0,80,0,2,1,0,0,40,1,List.of(),false,1000);}
    String body(long revision,ProgressData progress)throws Exception{return mapper.writeValueAsString(new PlayerController.SaveRequest(revision,progress));}
    @Test void savesAndLoadsFromH2()throws Exception{
        mvc.perform(get("/api/dev/player")).andExpect(status().isOk()).andExpect(jsonPath("revision").value(0)).andExpect(jsonPath("progress").isEmpty());
        mvc.perform(put("/api/dev/player/save").contentType("application/json").content(body(0,valid()))).andExpect(status().isOk()).andExpect(jsonPath("revision").value(1));
        mvc.perform(get("/api/dev/player")).andExpect(jsonPath("progress.bits").value(80)).andExpect(jsonPath("progress.areaId").value(2));
    }
    @Test void refusesStaleRevision()throws Exception{
        mvc.perform(put("/api/dev/player/save").contentType("application/json").content(body(0,valid()))).andExpect(status().isOk());
        mvc.perform(put("/api/dev/player/save").contentType("application/json").content(body(0,valid()))).andExpect(status().isConflict());
    }
    @Test void rejectsInvalidAndInconsistentProgress()throws Exception{
        ObjectNode node=(ObjectNode)mapper.valueToTree(new PlayerController.SaveRequest(0,valid()));
        ((ObjectNode)node.get("progress")).put("areaId",31);
        mvc.perform(put("/api/dev/player/save").contentType("application/json").content(node.toString())).andExpect(status().isBadRequest());
        ((ObjectNode)node.get("progress")).put("areaId",2).put("xp",500);
        mvc.perform(put("/api/dev/player/save").contentType("application/json").content(node.toString())).andExpect(status().isBadRequest());
    }
}
