package com.douglasrohden.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import java.util.Set;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "artista")
public class Artista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;

    @Size(max = 50, message = "Gênero deve ter no máximo 50 caracteres")
    private String genero;

    // Will handle image storage via MinIO separately or as a URL string for now
    @Size(max = 255, message = "imageUrl deve ter no máximo 255 caracteres")
    private String imageUrl;

    @ManyToMany
    @JoinTable(
        name = "artista_album",
        joinColumns = @JoinColumn(name = "artista_id"),
        inverseJoinColumns = @JoinColumn(name = "album_id")
    )
    private Set<Album> albuns;
}
