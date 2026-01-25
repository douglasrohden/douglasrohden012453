package com.douglasrohden.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ArtistaDto {
    private Long id;
    private String nome;
    private Long albumCount;
    private String tipo;
    private String imageUrl;
}
