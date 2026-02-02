package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.ArtistaRequest;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.service.ArtistaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ArtistaController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ArtistaController controller tests")
class ArtistaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ArtistaService artistaService;

    @Test
    @DisplayName("list returns paged artists")
    void listReturnsPagedArtists() throws Exception {
        ArtistaDto dto = new ArtistaDto(1L, "Serj Tankian", 3L, "CANTOR", null);
        PageImpl<ArtistaDto> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 10), 1);

        when(artistaService.search(eq(""), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/v1/artistas")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].nome").value("Serj Tankian"))
                .andExpect(jsonPath("$.content[0].albumCount").value(3));
    }

    @Test
    @DisplayName("create returns created artist")
    void createReturnsArtist() throws Exception {
        ArtistaRequest request = new ArtistaRequest();
        request.setNome("Guns N' Roses");
        request.setTipo("BANDA");

        Artista saved = new Artista();
        saved.setId(10L);
        saved.setNome("Guns N' Roses");
        saved.setTipo(ArtistaTipo.BANDA);

        when(artistaService.createWithAlbums(any(Artista.class), any())).thenReturn(saved);

        mockMvc.perform(post("/v1/artistas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.nome").value("Guns N' Roses"));
    }

    @Test
    @DisplayName("create validates request")
    void createValidatesRequest() throws Exception {
        ArtistaRequest request = new ArtistaRequest();

        mockMvc.perform(post("/v1/artistas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
