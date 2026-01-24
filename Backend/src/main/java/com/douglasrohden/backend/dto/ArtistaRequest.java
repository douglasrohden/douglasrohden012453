package com.douglasrohden.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ArtistaRequest {
    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    private String genero;
    private String tipo;
    private List<Long> albumIds;
}
