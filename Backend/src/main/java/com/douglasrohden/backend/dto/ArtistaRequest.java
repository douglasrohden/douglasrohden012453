package com.douglasrohden.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ArtistaRequest {
    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    private String genero;

    private String imageUrl;

    private String tipo;
}
