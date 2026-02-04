package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ArtistaRequest {
    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    private String tipo;
    private List<Long> albumIds;

    public Artista toEntity() {
        Artista artista = new Artista();
        artista.setNome(this.nome);

        if (this.tipo != null) {
            try {
                artista.setTipo(ArtistaTipo.valueOf(this.tipo.toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // tipo inválido será ignorado; o service define CANTOR como padrão
            }
        }

        return artista;
    }
}
