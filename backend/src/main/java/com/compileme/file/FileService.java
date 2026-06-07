package com.compileme.file;

import com.compileme.common.exception.FileStorageException;
import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.file.dto.StoredFileResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileService {

    private final StoredFileRepository storedFileRepository;
    private final CurrentUserProvider currentUserProvider;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException e) {
            throw new FileStorageException("Yükleme dizini oluşturulamadı: " + uploadDir, e);
        }
    }

    @Transactional
    public StoredFileResponse save(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileStorageException("Boş dosya yüklenemez.");
        }

        String originalName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalName.contains("..")) {
            throw new FileStorageException("Geçersiz dosya adı: " + originalName);
        }

        // Çakışmayı engellemek için benzersiz bir isim üret
        String storedName = UUID.randomUUID().toString() + "_" + originalName;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("Dosya diske yazılamadı: " + originalName, e);
        }

        Long userId = currentUserProvider.getCurrentUserId();

        StoredFile storedFile = StoredFile.builder()
                .userId(userId)
                .originalName(originalName)
                .storedName(storedName)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();

        StoredFile saved = storedFileRepository.save(storedFile);
        return toResponse(saved);
    }

    public Resource load(Long id) {
        StoredFile storedFile = getMetadata(id);

        try {
            Path filePath = this.fileStorageLocation.resolve(storedFile.getStoredName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("Dosya diskten okunamadı: " + storedFile.getOriginalName());
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("Geçersiz dosya yolu: " + storedFile.getOriginalName(), e);
        }
    }

    public StoredFile getMetadata(Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        return storedFileRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Dosya bulunamadı: " + id));
    }

    public StoredFileResponse getResponseMetadata(Long id) {
        return toResponse(getMetadata(id));
    }

    @Transactional
    public void delete(Long id) {
        StoredFile storedFile = getMetadata(id);

        try {
            Path filePath = this.fileStorageLocation.resolve(storedFile.getStoredName()).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Dosya diskten silinemedi: " + storedFile.getOriginalName(), e);
        }

        storedFileRepository.delete(storedFile);
    }

    private StoredFileResponse toResponse(StoredFile file) {
        String downloadUrl = "/api/files/" + file.getId();
        return new StoredFileResponse(
                file.getId(),
                file.getOriginalName(),
                file.getFileSize(),
                file.getContentType(),
                file.getCreatedAt(),
                downloadUrl
        );
    }
}
