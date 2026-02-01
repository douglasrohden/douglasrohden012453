package com.douglasrohden.backend.service;

import com.douglasrohden.backend.config.MinioProperties;
import com.douglasrohden.backend.dto.AlbumImageResponse;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.AlbumImage;
import com.douglasrohden.backend.repository.AlbumImageRepository;
import com.douglasrohden.backend.repository.AlbumRepository;
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
@DisplayName("AlbumImageStorageService service tests")
class AlbumImageStorageServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private AlbumImageRepository albumImageRepository;

    @Mock
    private MinioClient minioClient;

    private MinioProperties minioProperties = new MinioProperties();

    @InjectMocks
    private AlbumImageStorageService service;

    @Test
    @DisplayName("uploadCovers rejects empty payload")
    void uploadRejectsEmptyFiles() {
        Album album = new Album();
        album.setId(1L);
        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));

        assertThrows(ResponseStatusException.class,
            () -> service.uploadCovers(1L, new MultipartFile[]{}));
    }

    @Test
    @DisplayName("uploadCovers stores image and returns presigned URL")
    void uploadStoresImageAndReturnsUrl() throws Exception {
        minioProperties.setBucket("album-covers");
        minioProperties.setAccessKey("minio");
        minioProperties.setSecretKey("minio");
        minioProperties.setEndpoint("http://localhost:9000");

        Album album = new Album();
        album.setId(1L);

        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));
        when(minioClient.bucketExists(any())).thenReturn(true);
        doReturn(null).when(minioClient).putObject(any());
        when(minioClient.getPresignedObjectUrl(any())).thenReturn("http://example/presign");
        doAnswer(invocation -> {
            AlbumImage image = invocation.getArgument(0);
            image.setId(10L);
            return image;
        }).when(albumImageRepository).save(any(AlbumImage.class));

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "cover.jpg",
            "image/jpeg",
            "fake".getBytes()
        );

        List<AlbumImageResponse> responses = service.uploadCovers(1L, new MultipartFile[]{file});

        assertEquals(1, responses.size());
        assertEquals("http://example/presign", responses.get(0).url());
        assertEquals("image/jpeg", responses.get(0).contentType());
    }
}
