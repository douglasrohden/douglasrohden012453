package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.service.AlbumService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;

/**
 * Controlador REST para gerenciar álbuns.
 * Este controlador recebe requisições HTTP e retorna respostas em formato JSON.
 */
@RestController
@RequestMapping("/v1/albuns") // Define a URL base: /v1/albuns
@RequiredArgsConstructor // Lombok: cria um construtor com os campos final automaticamente
public class AlbumController {
    // Repositório para acessar os dados de álbuns no banco de dados
    private final AlbumRepository albumRepository;
    // Serviço com regras de negócio para álbuns
    private final AlbumService albumService;

    /**
     * Endpoint GET para listar todos os álbuns com paginação.
     * URL: GET /v1/albuns?page=0&size=10
     * Retorna álbuns com informações do artista associado.
     */
    @io.swagger.v3.oas.annotations.Operation(summary = "Listar álbuns (paginated)", description = "Retorna página de álbuns. Paginação obrigatória.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Página retornada"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Parâmetros de paginação obrigatórios"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @GetMapping
    public ResponseEntity<Page<AlbumWithArtistDTO>> getAllAlbuns(Pageable pageable) {
        // Valida se os parâmetros de paginação foram fornecidos corretamente
        if (pageable == null || !pageable.isPaged()) {
            return ResponseEntity.badRequest().build(); // Retorna erro 400 se inválido
        }

        // Passo 1: Busca os álbuns do banco de dados com paginação
        Page<Album> albumsPage = albumRepository.findAll(pageable);

        // Passo 2: Converte cada álbum (entidade) em um DTO com informações do artista
        List<AlbumWithArtistDTO> dtos = converterParaDTOs(albumsPage.getContent());

        // Passo 3: Cria a página de DTOs com os mesmos dados de paginação
        Page<AlbumWithArtistDTO> dtoPage = new PageImpl<>(dtos, pageable, albumsPage.getTotalElements());

        // Retorna a página de DTOs com status 200 (OK)
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * Converte uma lista de álbuns em uma lista de DTOs.
     * Este método percorre cada álbum e cria um DTO com informações do artista.
     */
    private List<AlbumWithArtistDTO> converterParaDTOs(List<Album> albums) {
        List<AlbumWithArtistDTO> dtos = new ArrayList<>();
        for (Album album : albums) {
            dtos.add(AlbumWithArtistDTO.fromAlbum(album));
        }
        return dtos;
    }

    /**
     * Endpoint POST para criar um novo álbum.
     * URL: POST /v1/albuns
     * Body: JSON com título, ano e URL da imagem
     */
    @io.swagger.v3.oas.annotations.Operation(summary = "Cadastrar álbum", description = "Cria um novo álbum.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Álbum criado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PostMapping
    public ResponseEntity<Album> create(@Valid @RequestBody CreateAlbumRequest request) {
        // Cria uma nova instância de álbum
        Album album = new Album();

        // Define os atributos do álbum com os dados recebidos na requisição
        album.setTitulo(request.titulo());
        album.setAno(request.ano());
        album.setImageUrl(request.imageUrl());

        // Chama o serviço para salvar o álbum no banco de dados
        // e retorna com status 201 (CREATED)
        return ResponseEntity.status(HttpStatus.CREATED).body(albumService.create(album));
    }
}
