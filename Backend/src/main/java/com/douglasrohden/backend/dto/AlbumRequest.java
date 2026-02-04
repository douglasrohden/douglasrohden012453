package com.douglasrohden.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO unificado para criar e atualizar álbuns.
 */
public record AlbumRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
        String titulo,
        Integer ano,
        List<Long> artistaIds,
        Boolean individual) {
}
