package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.model.ArtistImage;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.repository.ArtistaRepository.ArtistaComAlbumCount;
import com.douglasrohden.backend.repository.ArtistImageRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ArtistaService service tests")
class ArtistaServiceTest {

    @Mock
    private ArtistaRepository repository;

    @Mock
    private AlbumService albumService;

    @Mock
    private ArtistImageRepository artistImageRepository;

    @Mock
    private ArtistImageStorageService imageStorageService;

    @InjectMocks
    private ArtistaService service;

    @Test
    @DisplayName("createWithAlbums assigns default type and links albums")
    void createWithAlbumsAssignsDefaultType() {
        Artista artista = new Artista();
        artista.setNome("Test Artist");

        Album album = new Album();
        album.setId(10L);

        when(albumService.findByIds(List.of(10L))).thenReturn(List.of(album));
        doAnswer(invocation -> {
            Artista arg = invocation.getArgument(0);
            arg.setId(1L);
            return arg;
        }).when(repository).save(any(Artista.class));

        Artista saved = service.createWithAlbums(artista, List.of(10L));

        assertEquals(ArtistaTipo.CANTOR, saved.getTipo());
        assertNotNull(saved.getAlbuns());
        assertTrue(saved.getAlbuns().contains(album));
    }

    @Test
    @DisplayName("search maps album count and image url")
    void searchMapsAlbumCountAndImageUrl() {
        ArtistaComAlbumCount projection = new ArtistaComAlbumCount() {
            @Override
            public Long getId() {
                return 1L;
            }

            @Override
            public String getNome() {
                return "Serj Tankian";
            }

            @Override
            public long getAlbumCount() {
                return 3L;
            }

            @Override
            public ArtistaTipo getTipo() {
                return ArtistaTipo.CANTOR;
            }
        };

        Page<ArtistaComAlbumCount> page = new PageImpl<>(List.of(projection), PageRequest.of(0, 10), 1);
        when(repository.searchWithAlbumCount("", null, PageRequest.of(0, 10))).thenReturn(page);

        Artista artista = new Artista();
        artista.setId(1L);
        ArtistImage image = ArtistImage.builder()
            .id(5L)
            .artista(artista)
            .objectKey("artista/1/image.jpg")
            .build();

        when(artistImageRepository.findFirstImagesByArtistaIds(List.of(1L))).thenReturn(List.of(image));
        when(imageStorageService.generatePresignedUrl("artista/1/image.jpg")).thenReturn("http://example");

        Page<ArtistaDto> result = service.search("", null, PageRequest.of(0, 10));

        ArtistaDto dto = result.getContent().get(0);
        assertEquals("Serj Tankian", dto.getNome());
        assertEquals(Long.valueOf(3L), dto.getAlbumCount());
        assertEquals("http://example", dto.getImageUrl());
    }
}
