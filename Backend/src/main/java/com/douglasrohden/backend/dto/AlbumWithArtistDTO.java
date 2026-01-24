package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;

import java.util.Set;

public record AlbumWithArtistDTO(
        Long id,
        String titulo,
        Integer ano,
        String artistaNome,
        Set<ArtistSummaryDTO> artistas,
        String capaUrl) {
    private static final String ARTISTA_DESCONHECIDO = "Desconhecido";

    public static AlbumWithArtistDTO fromAlbum(Album album, String capaUrl) {
        return new AlbumWithArtistDTO(
                album.getId(),
                album.getTitulo(),
                album.getAno(),
                extrairNomeDoArtista(album),
                extrairArtistas(album),
                capaUrl);
    }

    private static String extrairNomeDoArtista(Album album) {
        Set<Artista> artistas = album.getArtistas();

        if (artistas == null || artistas.isEmpty()) {
            return ARTISTA_DESCONHECIDO;
        }

        // Return comma separated names if multiple, or just the first one for backward
        // compatibility if preferred.
        // But better to be descriptive.
        return artistas.stream()
                .map(Artista::getNome)
                .reduce((a, b) -> a + ", " + b)
                .orElse(ARTISTA_DESCONHECIDO);
    }

    private static java.util.stream.Stream<ArtistSummaryDTO> mapToArtistSummary(Set<Artista> artistas) {
        if (artistas == null)
            return java.util.stream.Stream.empty();
        return artistas.stream()
                .map(a -> new ArtistSummaryDTO(a.getId(), a.getNome(), a.getTipo()));
    }

    private static Set<ArtistSummaryDTO> extrairArtistas(Album album) {
        if (album.getArtistas() == null)
            return java.util.Collections.emptySet();
        return album.getArtistas().stream()
                .map(a -> new ArtistSummaryDTO(a.getId(), a.getNome(), a.getTipo()))
                .collect(java.util.stream.Collectors.toSet());
    }
}
