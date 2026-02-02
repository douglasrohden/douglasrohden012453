package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumImageRepository;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.service.AlbumImageStorageService;
import com.douglasrohden.backend.service.AlbumService;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AlbumController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AlbumController controller tests")
class AlbumControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AlbumRepository albumRepository;

    @MockBean
    private AlbumService albumService;

    @MockBean
    private AlbumImageStorageService albumImageStorageService;

    @MockBean
    private AlbumImageRepository albumImageRepository;

    @Test
    @DisplayName("list returns paged albums")
    void listReturnsPagedAlbums() throws Exception {
        Album album = new Album();
        album.setId(1L);
        album.setTitulo("Harakiri");

        PageImpl<Album> page = new PageImpl<>(List.of(album), PageRequest.of(0, 10), 1);
        when(albumRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(albumImageRepository.findFirstCoversByAlbumIds(eq(List.of(1L)))).thenReturn(List.of());

        mockMvc.perform(get("/v1/albuns")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].titulo").value("Harakiri"));
    }

    @Test
    @DisplayName("create returns created album")
    void createReturnsAlbum() throws Exception {
        CreateAlbumRequest request = new CreateAlbumRequest("Harakiri", 2012, List.of(), false);

        Album saved = new Album();
        saved.setId(2L);
        saved.setTitulo("Harakiri");
        saved.setAno(2012);

        when(albumService.createWithArtistas(any(Album.class), any())).thenReturn(saved);

        mockMvc.perform(post("/v1/albuns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.titulo").value("Harakiri"));
    }
}
