package com.douglasrohden.backend.model;

import jakarta.persistence.*;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashSet;

@Entity
@Table(name = "album")
public class Album {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String titulo;
	private Integer ano;

	@ManyToMany(mappedBy = "albuns")
	@JsonIgnore
	private Set<Artista> artistas = new HashSet<>();

	@OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@JsonIgnore
	private Set<AlbumCover> covers = new HashSet<>();

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getTitulo() { return titulo; }
	public void setTitulo(String titulo) { this.titulo = titulo; }
	public Integer getAno() { return ano; }
	public void setAno(Integer ano) { this.ano = ano; }
	public Set<Artista> getArtistas() { return artistas; }
	public void setArtistas(Set<Artista> artistas) { this.artistas = artistas; }

	public Set<AlbumCover> getCovers() { return covers; }
	public void setCovers(Set<AlbumCover> covers) { this.covers = covers; }

}