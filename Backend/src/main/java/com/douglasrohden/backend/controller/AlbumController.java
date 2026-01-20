package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/albuns")
public class AlbumController {
    @Autowired
    private AlbumRepository albumRepository;

    @io.swagger.v3.oas.annotations.Operation(summary = "Listar álbuns", description = "Retorna lista de álbuns")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista retornada"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @GetMapping
    public List<Album> getAllAlbuns() {
        return albumRepository.findAll();
    }
}
