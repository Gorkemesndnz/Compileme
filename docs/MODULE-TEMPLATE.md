# Compileme — Yeni Modül Oluşturma Şablonu

Bu rehber, Compileme projesine yeni bir modül eklerken takip edilmesi gereken mimari adımları, dosya iskeletini ve konvansiyonları tanımlar.

---

## 1. Modül Sıralaması (Sequence)
Yeni bir modül eklerken adımları her zaman şu sırayla izleyin:
1. **Veritabanı Göçü:** Flyway ile `V#__<mig>.sql` oluşturun.
2. **Entity Sınıfı:** `com.compileme.<modul>` paketi altında JPA Entity oluşturun.
3. **Repository Sınıfı:** Spring Data JPA interface'ini yazın.
4. **DTO Sınıfları:** Request (`XRequest`) ve Response (`XResponse`) sınıflarını hazırlayın.
5. **Static Mapper:** Elle eşleme yapan statik `toResponse` ve `toEntity` metotları yazın.
6. **Service Sınıfı:** Concrete service sınıfını ve iş mantığını kodlayın.
7. **Controller Sınıfı:** REST endpoint'lerini (`/api/<modul>`) açın.
8. **Frontend Hook:** `src/api/<modul>.ts` altında TanStack Query kancalarını (useQuery/useMutation) yazın.
9. **Arayüz Sayfası:** `src/features/<modul>/<X>Page.tsx` sayfasını çekirdek primitive bileşenlerle oluşturun.

---

## 2. Mimari Kurallar ve Modül Sınırları

> [!IMPORTANT]
> **Modül Sınırı Kapalıdır:** Bir modül başka bir modülün `Repository` veya `Entity` sınıflarına **ASLA doğrudan erişemez**. Modüller arası iletişim sadece **public Servis metotları ve DTO'lar** üzerinden yapılır.
>
> **Asenkron / Domain Event:** "Şu olunca bu da olsun" durumlarında (örn. fikir projeye dönüşünce) servisleri sıkı bağlamak yerine Spring `@EventListener` ve `ApplicationEventPublisher` kullanın.

---

## 3. Kod Şablonları

### A. Backend

#### Entity
```java
package com.compileme.project;

import com.compileme.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "project")
@Getter
@Setter
public class Project extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.PLANNING;
}
```

#### DTO Sınıfları
```java
// dto/ProjectRequest.java
package com.compileme.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
    @NotBlank(message = "Proje adı boş olamaz")
    @Size(max = 200, message = "Proje adı en fazla 200 karakter olabilir")
    String name,
    
    @Size(max = 1000, message = "Açıklama en fazla 1000 karakter olabilir")
    String description
) {}
```
```java
// dto/ProjectResponse.java
package com.compileme.project.dto;

import com.compileme.project.ProjectStatus;
import java.time.OffsetDateTime;

public record ProjectResponse(
    Long id,
    String name,
    String description,
    ProjectStatus status,
    OffsetDateTime createdAt
) {}
```

#### Static Mapper
```java
package com.compileme.project.mapper;

import com.compileme.project.Project;
import com.compileme.project.dto.ProjectResponse;

public class ProjectMapper {

    public static ProjectResponse toResponse(Project project) {
        if (project == null) return null;
        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getDescription(),
            project.getStatus(),
            project.getCreatedAt()
        );
    }
}
```

#### Service (Concrete class, NO interface)
```java
package com.compileme.project;

import com.compileme.project.dto.ProjectResponse;
import com.compileme.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<ProjectResponse> getProjects(Long userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(ProjectMapper::toResponse)
                .toList();
    }
}
```

### B. Frontend

#### API Hook
`src/api/` altında TanStack Query kancalarını bu biçimde yazın:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface ProjectResponse {
  id: number
  name: string
  description: string
  status: string
}

// Query hook'ları: ['modul_adi', ...parametreler] şeklinde queryKey kullanın
export const useProjects = () => {
  return useQuery<ProjectResponse[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectResponse[]>('/projects')
      return response.data
    }
  })
}
```

#### Arayüz Sayfası
`src/components/ui/` altındaki çekirdek primitive'leri kullanarak sayfayı oluşturun:
```tsx
import React from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useProjects } from '../../api/projects'

export const ProjectsPage: React.FC = () => {
  const { data: projects, isLoading } = useProjects()

  if (isLoading) {
    return <div className="flex justify-center p-12"><Spinner className="h-8 w-8 text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Projeler" subtitle="Projelerinizi buradan yönetin." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects?.map(p => (
          <Card key={p.id}>
            <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
            <CardContent><p>{p.description}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```
