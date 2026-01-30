package com.douglasrohden.backend.service;

import com.douglasrohden.backend.config.MinioProperties;
import com.douglasrohden.backend.dto.ArtistImageResponse;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistImage;
import com.douglasrohden.backend.repository.ArtistImageRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ArtistImageStorageService {

    private final ArtistaRepository artistaRepository;
    private final ArtistImageRepository artistImageRepository;
    private final MinioClient minioClient;
    private final MinioClient presignClient;
    private final MinioProperties properties;
    private final AtomicBoolean bucketEnsured = new AtomicBoolean(false);

    public ArtistImageStorageService(
            ArtistaRepository artistaRepository,
            ArtistImageRepository artistImageRepository,
            MinioClient minioClient,
            MinioProperties properties) {
        this.artistaRepository = artistaRepository;
        this.artistImageRepository = artistImageRepository;
        this.minioClient = minioClient;
        this.properties = properties;
        this.presignClient = buildPresignClient(minioClient, properties);
    }

    public List<ArtistImageResponse> uploadImages(Long artistaId, MultipartFile[] files) {
        Artista artista = artistaRepository.findById(artistaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artista não encontrado"));

        if (files == null || files.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhum arquivo enviado");
        }

        ensureBucket();

        List<ArtistImageResponse> responses = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            validateFile(file);
            ArtistImage image = persistFile(artista, file);
            ArtistImage saved = artistImageRepository.save(image);
            ArtistImageResponse response = mapToResponse(saved);
            responses.add(response);
        }
        return responses;
    }

    public List<ArtistImageResponse> listImages(Long artistaId) {
        if (!artistaRepository.existsById(artistaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Artista não encontrado");
        }
        ensureBucket();
        List<ArtistImage> images = artistImageRepository.findByArtistaId(artistaId);
        return images.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void deleteImage(Long artistaId, Long imageId) {
        ArtistImage image = artistImageRepository.findByIdAndArtistaId(imageId, artistaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada"));
        ensureBucket();
        try {
            artistImageRepository.deleteByIdAndArtistaId(imageId, artistaId);
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(properties.getBucket())
                    .object(image.getObjectKey())
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao remover objeto no storage", e);
        }
    }

    private ArtistImage persistFile(Artista artista, MultipartFile file) {
        String objectKey = buildObjectKey(artista.getId(), file);
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

        return ArtistImage.builder()
                .artista(artista)
                .objectKey(objectKey)
                .contentType(contentType)
                .sizeBytes(file.getSize())
                .build();
    }

    private String buildObjectKey(Long artistaId, MultipartFile file) {
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String sanitizedExt = (StringUtils.hasText(extension)) ? extension.toLowerCase() : "bin";
        return "artista/" + artistaId + "/" + UUID.randomUUID() + "." + sanitizedExt;
    }

    private ArtistImageResponse mapToResponse(ArtistImage image) {
        String url = generatePresignedUrl(image.getObjectKey());
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(resolveExpirationMinutes()));
        return ArtistImageResponse.from(image, url, expiresAt);
    }

    public String generatePresignedUrl(String objectKey) {
        try {
            int expirySeconds = (int) Duration.ofMinutes(resolveExpirationMinutes()).getSeconds();
            return presignClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(properties.getBucket())
                    .object(objectKey)
                    .expiry(expirySeconds, TimeUnit.SECONDS)
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao gerar URL assinada", e);
        }
    }

    private MinioClient buildPresignClient(MinioClient fallback, MinioProperties props) {
        String externalEndpoint = props.getExternalEndpoint();
        if (!StringUtils.hasText(externalEndpoint)) {
            return fallback;
        }
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(externalEndpoint)
                .credentials(props.getAccessKey(), props.getSecretKey());
        if (StringUtils.hasText(props.getRegion())) {
            builder.region(props.getRegion());
        }
        return builder.build();
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
                boolean exists = minioClient
                        .bucketExists(BucketExistsArgs.builder().bucket(properties.getBucket()).build());
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
