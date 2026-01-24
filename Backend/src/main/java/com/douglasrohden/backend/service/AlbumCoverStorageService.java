package com.douglasrohden.backend.service;

import com.douglasrohden.backend.config.MinioProperties;
import com.douglasrohden.backend.dto.AlbumCoverResponse;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.AlbumCover;
import com.douglasrohden.backend.repository.AlbumCoverRepository;
import com.douglasrohden.backend.repository.AlbumRepository;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AlbumCoverStorageService {

    private final AlbumRepository albumRepository;
    private final AlbumCoverRepository albumCoverRepository;
    private final MinioClient minioClient;
    private final MinioProperties properties;
    private final AtomicBoolean bucketEnsured = new AtomicBoolean(false);

    public AlbumCoverStorageService(
            AlbumRepository albumRepository,
            AlbumCoverRepository albumCoverRepository,
            MinioClient minioClient,
            MinioProperties properties) {
        this.albumRepository = albumRepository;
        this.albumCoverRepository = albumCoverRepository;
        this.minioClient = minioClient;
        this.properties = properties;
    }

    public List<AlbumCoverResponse> uploadCovers(Long albumId, MultipartFile[] files) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Álbum não encontrado"));

        if (files == null || files.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhum arquivo enviado");
        }

        ensureBucket();

        List<AlbumCoverResponse> responses = new ArrayList<>();
        String firstCoverUrl = null;
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            validateFile(file);
            AlbumCover cover = persistFile(album, file);
            AlbumCover saved = albumCoverRepository.save(cover);
            AlbumCoverResponse response = mapToResponse(saved);
            responses.add(response);
            if (i == 0) {
                firstCoverUrl = response.url();
            }
        }
        // Atualiza o campo imageUrl do álbum com a URL da primeira capa
        if (firstCoverUrl != null && !firstCoverUrl.isEmpty()) {
            album.setImageUrl(firstCoverUrl);
            albumRepository.save(album);
        }
        return responses;
    }

    public List<AlbumCoverResponse> listCovers(Long albumId) {
        if (!albumRepository.existsById(albumId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Álbum não encontrado");
        }
        ensureBucket();
        List<AlbumCover> covers = albumCoverRepository.findByAlbumId(albumId);
        return covers.stream().map(this::mapToResponse).toList();
    }

    public void deleteCover(Long albumId, Long coverId) {
        AlbumCover cover = albumCoverRepository.findByIdAndAlbumId(coverId, albumId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Capa não encontrada"));
        ensureBucket();
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(properties.getBucket())
                    .object(cover.getObjectKey())
                    .build());
            albumCoverRepository.deleteByIdAndAlbumId(coverId, albumId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao remover objeto no storage", e);
        }
    }

    private AlbumCover persistFile(Album album, MultipartFile file) {
        String objectKey = buildObjectKey(album.getId(), file);
        String contentType = resolveContentType(file);
        try (InputStream is = file.getInputStream()) {
            PutObjectArgs args = PutObjectArgs.builder()
                    .bucket(properties.getBucket())
                    .object(objectKey)
                    .stream(is, file.getSize(), -1)
                    .contentType(contentType)
                    .build();
            minioClient.putObject(args);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falha ao ler arquivo enviado", e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao armazenar arquivo no MinIO", e);
        }

        return AlbumCover.builder()
                .album(album)
                .objectKey(objectKey)
                .contentType(contentType)
                .sizeBytes(file.getSize())
                .build();
    }

    private String buildObjectKey(Long albumId, MultipartFile file) {
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String sanitizedExt = (StringUtils.hasText(extension)) ? extension.toLowerCase() : "bin";
        return "album/" + albumId + "/" + UUID.randomUUID() + "." + sanitizedExt;
    }

    private AlbumCoverResponse mapToResponse(AlbumCover cover) {
        String url = presignUrl(cover.getObjectKey());
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(resolveExpirationMinutes()));
        return AlbumCoverResponse.from(cover, url, expiresAt);
    }

    private String presignUrl(String objectKey) {
        try {
            int expirySeconds = (int) Duration.ofMinutes(resolveExpirationMinutes()).getSeconds();
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(properties.getBucket())
                    .object(objectKey)
                    .expiry(expirySeconds, TimeUnit.SECONDS)
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao gerar URL assinada", e);
        }
    }

    private void ensureBucket() {
        if (bucketEnsured.get()) {
            return;
        }
        synchronized (bucketEnsured) {
            if (bucketEnsured.get()) {
                return;
            }
            try {
                boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(properties.getBucket()).build());
                if (!exists) {
                    minioClient.makeBucket(MakeBucketArgs.builder().bucket(properties.getBucket()).build());
                }
                bucketEnsured.set(true);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao preparar bucket do MinIO", e);
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio ou ausente");
        }
        if (file.getSize() > properties.getMaxFileSizeBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tamanho máximo excedido");
        }
        String contentType = resolveContentType(file);
        boolean allowedByPrefix = contentType.startsWith("image/");
        boolean allowedByConfig = properties.getAllowedContentTypes().stream()
                .anyMatch(allowedType -> allowedType.equalsIgnoreCase(contentType));
        if (!(allowedByPrefix || allowedByConfig)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não permitido");
        }
    }

    private String resolveContentType(MultipartFile file) {
        if (file.getContentType() != null) {
            return file.getContentType();
        }
        return "application/octet-stream";
    }

    private int resolveExpirationMinutes() {
        Integer value = properties.getPresignExpirationMinutes();
        if (value == null || value <= 0) {
            return 30;
        }
        return value;
    }
}
