package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.security.JwtUtil;
import com.douglasrohden.backend.service.ArtistaService;
import com.douglasrohden.backend.service.RateLimitService;
import com.douglasrohden.backend.service.RateLimitService.Probe;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes do Controller de Artistas
 * Valida requisito SEPLAG: CRUD completo de artistas
 */
@WebMvcTest(ArtistaController.class)
@DisplayName("ArtistaController - Testes de CRUD de Artistas")
class ArtistaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ArtistaService artistaService;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        when(rateLimitService.tryConsume(anyString())).thenReturn(new Probe(true, 10, 0));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve criar artista com sucesso")
    void deveCriarArtista() throws Exception {
        Artista artista = Artista.builder().id(1L).nome("Novo Artista").tipo(ArtistaTipo.CANTOR).build();

        when(artistaService.createWithAlbums(any(), any())).thenReturn(artista);

        mockMvc.perform(post("/v1/artistas")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Novo Artista\"}")
                .with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.nome").value("Novo Artista"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve listar artistas com paginação")
    void deveListarArtistas() throws Exception {
        ArtistaDto dto = new ArtistaDto(1L, "Artista Teste", 5L, "CANTOR", null);
        Page<ArtistaDto> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 10), 1);

        when(artistaService.search(anyString(), anyString(), anyString(), anyString(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/artistas"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].nome").value("Artista Teste"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve buscar artista por ID")
    void deveBuscarArtistaPorId() throws Exception {
        Artista artista = Artista.builder().id(1L).nome("Artista Teste").tipo(ArtistaTipo.CANTOR).build();

        when(artistaService.findById(1L)).thenReturn(artista);

        mockMvc.perform(get("/v1/artistas/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nome").value("Artista Teste"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve atualizar artista")
    void deveAtualizarArtista() throws Exception {
        Artista artista = Artista.builder().id(1L).nome("Artista Atualizado").tipo(ArtistaTipo.CANTOR).build();

        when(artistaService.update(eq(1L), any(Artista.class))).thenReturn(artista);

        mockMvc.perform(put("/v1/artistas/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Artista Atualizado\"}")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nome").value("Artista Atualizado"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve excluir artista")
    void deveExcluirArtista() throws Exception {
        mockMvc.perform(delete("/v1/artistas/1").with(csrf()))
            .andExpect(status().isNoContent());
    }
}
