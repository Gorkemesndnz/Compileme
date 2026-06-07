package com.compileme.file;

import com.compileme.file.dto.StoredFileResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FileController.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FileService fileService;

    @Test
    void uploadFile_ShouldReturnOkStatus() throws Exception {
        StoredFileResponse response = new StoredFileResponse(
                1L, "test.txt", 10L, "text/plain", OffsetDateTime.now(), "/api/files/1"
        );

        when(fileService.save(any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "Hello".getBytes()
        );

        mockMvc.perform(multipart("/api/files")
                        .file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalName").value("test.txt"));
    }

    @Test
    void downloadFile_ShouldReturnBinaryData() throws Exception {
        StoredFile storedFile = StoredFile.builder()
                .id(1L)
                .userId(1L)
                .originalName("test.txt")
                .contentType("text/plain")
                .fileSize(10L)
                .storedName("uuid-test.txt")
                .build();

        Resource resource = new ByteArrayResource("Hello".getBytes());

        when(fileService.getMetadata(1L)).thenReturn(storedFile);
        when(fileService.load(1L)).thenReturn(resource);

        mockMvc.perform(get("/api/files/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.TEXT_PLAIN))
                .andExpect(content().string("Hello"));
    }
}
