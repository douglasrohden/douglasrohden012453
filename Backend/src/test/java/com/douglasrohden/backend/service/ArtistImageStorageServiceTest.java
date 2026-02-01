package com.douglasrohden.backend.service;

import com.douglasrohden.backend.config.MinioProperties;
import com.douglasrohden.backend.dto.ArtistImageResponse;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistImage;
import com.douglasrohden.backend.repository.ArtistImageRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import io.minio.MinioClient;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ArtistImageStorageService service tests")
class ArtistImageStorageServiceTest {

    @Mock
    private ArtistaRepository artistaRepository;

    @Mock
    private ArtistImageRepository artistImageRepository;

    @Mock
    private MinioClient minioClient;

    private MinioProperties minioProperties = new MinioProperties();

    @InjectMocks
    private ArtistImageStorageService service;

    @Test
    @DisplayName("uploadImages rejects empty payload")
    void uploadRejectsEmptyFiles() {
        Artista artista = new Artista();
        artista.setId(1L);
        when(artistaRepository.findById(1L)).thenReturn(Optional.of(artista));

        assertThrows(ResponseStatusException.class,
            () -> service.uploadImages(1L, new MultipartFile[]{}));
    }

    @Test
    @DisplayName("uploadImages stores image and returns presigned URL")
    void uploadStoresImageAndReturnsUrl() throws Exception {
        minioProperties.setBucket("album-covers");
        minioProperties.setAccessKey("minio");
        minioProperties.setSecretKey("minio");
        minioProperties.setEndpoint("http://localhost:9000");

        Artista artista = new Artista();
        artista.setId(1L);

        when(artistaRepository.findById(1L)).thenReturn(Optional.of(artista));
        when(minioClient.bucketExists(any())).thenReturn(true);
        doReturn(null).when(minioClient).putObject(any());
        when(minioClient.getPresignedObjectUrl(any())).thenReturn("http://example/presign");
        doAnswer(invocation -> {
            ArtistImage image = invocation.getArgument(0);
            image.setId(10L);
            return image;
        }).when(artistImageRepository).save(any(ArtistImage.class));

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "artist.jpg",
            "image/jpeg",
            "fake".getBytes()
        );

        List<ArtistImageResponse> responses = service.uploadImages(1L, new MultipartFile[]{file});

        assertEquals(1, responses.size());
        assertEquals("http://example/presign", responses.get(0).url());
        assertEquals("image/jpeg", responses.get(0).contentType());
    }
}
