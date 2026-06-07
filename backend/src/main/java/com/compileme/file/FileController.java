package com.compileme.file;

import com.compileme.file.dto.StoredFileResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping
    public ResponseEntity<StoredFileResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        StoredFileResponse response = fileService.save(file);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id, HttpServletRequest request) {
        Resource resource = fileService.load(id);
        StoredFile metadata = fileService.getMetadata(id);

        String contentType = metadata.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/metadata")
    public ResponseEntity<StoredFileResponse> getFileMetadata(@PathVariable Long id) {
        StoredFileResponse response = fileService.getResponseMetadata(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        fileService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
