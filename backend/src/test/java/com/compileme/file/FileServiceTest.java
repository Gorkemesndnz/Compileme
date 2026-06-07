package com.compileme.file;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.file.dto.StoredFileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private StoredFileRepository fileRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private FileService fileService;
    private Long userId = 1L;
    private StoredFile storedFile;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        fileService = new FileService(fileRepository, currentUserProvider);
        ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.toString());
        fileService.init(); // Create uploads folder inside temp dir

        storedFile = StoredFile.builder()
                .id(1L)
                .userId(userId)
                .originalName("test.txt")
                .contentType("text/plain")
                .fileSize(12L)
                .storedName("some-uuid-test.txt")
                .build();
    }

    @Test
    void upload_ShouldSaveFileToDiskAndDatabase() throws IOException {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(fileRepository.save(any(StoredFile.class))).thenReturn(storedFile);

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file", "test.txt", "text/plain", "Hello World".getBytes()
        );

        StoredFileResponse result = fileService.save(multipartFile);

        assertNotNull(result);
        assertEquals("test.txt", result.originalName());
        verify(fileRepository, times(1)).save(any(StoredFile.class));
    }

    @Test
    void getMetadata_ShouldReturnMetadata_WhenOwnershipMatches() {
        when(fileRepository.findByIdAndUserId(1L, userId)).thenReturn(Optional.of(storedFile));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        StoredFile result = fileService.getMetadata(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void delete_ShouldDeleteFileFromDiskAndDatabase(@TempDir Path tempDir) throws IOException {
        // Test dosyasını geçici klasörde fiziksel olarak oluşturalım
        Path testFile = tempDir.resolve("uuid-test-file.txt");
        Files.writeString(testFile, "Hello File");

        StoredFile physicalFile = StoredFile.builder()
                .id(1L)
                .userId(userId)
                .originalName("test.txt")
                .contentType("text/plain")
                .fileSize(10L)
                .storedName(testFile.getFileName().toString()) // relative to tempDir
                .build();

        // Servisi bu geçici klasörle yeniden kuralım
        FileService customService = new FileService(fileRepository, currentUserProvider);
        ReflectionTestUtils.setField(customService, "uploadDir", tempDir.toString());
        customService.init();

        when(fileRepository.findByIdAndUserId(1L, userId)).thenReturn(Optional.of(physicalFile));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        customService.delete(1L);

        // Diskteki dosyanın silindiğini doğrula
        assertFalse(Files.exists(testFile));
        verify(fileRepository, times(1)).delete(physicalFile);
    }
}
