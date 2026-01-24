package com.douglasrohden.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AlbumCoverStorageServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private AlbumCoverRepository albumCoverRepository;

    @Mock
    private MinioClient minioClient;

    private MinioProperties properties;

    private AlbumCoverStorageService service;

    @BeforeEach
    void setup() {
        properties = new MinioProperties();
        properties.setBucket("album-covers");
        properties.setEndpoint("http://localhost:9000");
        properties.setAccessKey("minioadmin");
        properties.setSecretKey("minioadmin123");
        properties.setMaxFileSizeBytes(10_000L);
        service = new AlbumCoverStorageService(albumRepository, albumCoverRepository, minioClient, properties);
    }

    @Test
    void shouldUploadFileAndReturnPresignedUrl() throws Exception {
        Album album = new Album();
        album.setId(1L);

        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));
        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
        when(minioClient.putObject(any(PutObjectArgs.class))).thenReturn(null);
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://localhost:9000/presigned");
        when(albumCoverRepository.save(any(AlbumCover.class))).thenAnswer(invocation -> {
            AlbumCover cover = invocation.getArgument(0);
            cover.setId(99L);
            return cover;
        });

        MockMultipartFile file = new MockMultipartFile("files", "capa.png", "image/png", new byte[] { 1, 2, 3 });

        List<AlbumCoverResponse> responses = service.uploadCovers(1L, new MockMultipartFile[] { file });

        assertEquals(1, responses.size());
        assertEquals("http://localhost:9000/presigned", responses.get(0).url());
        assertEquals("image/png", responses.get(0).contentType());
    }

    @Test
    void shouldFailWhenAlbumDoesNotExist() {
        MockMultipartFile file = new MockMultipartFile("files", "capa.png", "image/png", new byte[] { 1 });
        when(albumRepository.findById(123L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.uploadCovers(123L, new MockMultipartFile[] { file }));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void shouldValidateFileSize() {
        properties.setMaxFileSizeBytes(1L);
        Album album = new Album();
        album.setId(1L);
        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));
        MockMultipartFile file = new MockMultipartFile("files", "capa.png", "image/png", new byte[] { 1, 2, 3 });

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.uploadCovers(1L, new MockMultipartFile[] { file }));

        assertEquals(400, ex.getStatusCode().value());
    }
}
