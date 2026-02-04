package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.security.JwtUtil;
import com.douglasrohden.backend.service.AlbumService;
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

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

/**
 * Testes do Controller de Álbuns
 * Valida requisito SEPLAG: CRUD completo de álbuns
 */
@WebMvcTest(AlbumController.class)
@DisplayName("AlbumController - Testes de CRUD de Álbuns")
class AlbumControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AlbumService albumService;

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
    @DisplayName("Deve criar álbum com sucesso")
    void deveCriarAlbum() throws Exception {
        AlbumRequest request = new AlbumRequest("Novo Álbum", 2023, List.of(), false);
        Album album = new Album();
        album.setId(1L);
        album.setTitulo("Novo Álbum");
        album.setAno(2023);

        when(albumService.create(any(AlbumRequest.class))).thenReturn(album);

        mockMvc.perform(post("/v1/albuns")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.titulo").value("Novo Álbum"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve listar álbuns com paginação")
    void deveListarAlbuns() throws Exception {
        AlbumWithArtistDTO dto = new AlbumWithArtistDTO(1L, "Álbum Teste", 2020, "Artista", new HashSet<>(), null, true, false, true, false);
        Page<AlbumWithArtistDTO> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 10), 1);

        when(albumService.search(any(), any(), any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/albuns?page=0&size=10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].titulo").value("Álbum Teste"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve atualizar álbum")
    void deveAtualizarAlbum() throws Exception {
        AlbumRequest request = new AlbumRequest("Álbum Atualizado", 2024, List.of(), false);
        Album album = new Album();
        album.setId(1L);
        album.setTitulo("Álbum Atualizado");
        album.setAno(2024);

        when(albumService.update(eq(1L), any(AlbumRequest.class))).thenReturn(Optional.of(album));

        mockMvc.perform(put("/v1/albuns/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titulo").value("Álbum Atualizado"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve excluir álbum")
    void deveExcluirAlbum() throws Exception {
        mockMvc.perform(delete("/v1/albuns/1").with(csrf()))
            .andExpect(status().isNoContent());
    }
}
