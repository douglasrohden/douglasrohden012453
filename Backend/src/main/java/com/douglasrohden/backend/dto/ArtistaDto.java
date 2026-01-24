package com.douglasrohden.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ArtistaDto {
    private Long id;
    private String nome;
    private String genero;
    private Long albumCount;
}
