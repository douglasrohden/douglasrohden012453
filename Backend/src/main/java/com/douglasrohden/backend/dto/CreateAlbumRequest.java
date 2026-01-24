package com.douglasrohden.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateAlbumRequest(
                @NotBlank(message = "Título é obrigatório") @Size(max = 255, message = "Título deve ter no máximo 255 caracteres") String titulo,
                Integer ano,
                List<Long> artistaIds,
                Boolean individual) {
}
