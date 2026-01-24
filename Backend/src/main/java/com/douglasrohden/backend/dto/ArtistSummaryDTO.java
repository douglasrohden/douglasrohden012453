package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.ArtistaTipo;

public record ArtistSummaryDTO(
        Long id,
        String nome,
        ArtistaTipo tipo) {
}
