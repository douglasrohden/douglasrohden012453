package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;

import java.util.Set;

public record AlbumWithArtistDTO(
        Long id,
        String titulo,
        Integer ano,
        String artistaNome,
        String capaUrl) {
    private static final String ARTISTA_DESCONHECIDO = "Desconhecido";

    public static AlbumWithArtistDTO fromAlbum(Album album, String capaUrl) {
        return new AlbumWithArtistDTO(
                album.getId(),
                album.getTitulo(),
                album.getAno(),
                extrairNomeDoArtista(album),
                capaUrl);
    }

    private static String extrairNomeDoArtista(Album album) {
        Set<Artista> artistas = album.getArtistas();

        if (artistas == null || artistas.isEmpty()) {
            return ARTISTA_DESCONHECIDO;
        }

        // Pega o primeiro item de forma simples (for + return)
        for (Artista artista : artistas) {
            if (artista == null)
                return ARTISTA_DESCONHECIDO;

            String nome = artista.getNome();
            if (nome == null || nome.isBlank())
                return ARTISTA_DESCONHECIDO;

            return nome;
        }

        return ARTISTA_DESCONHECIDO;
    }
}
