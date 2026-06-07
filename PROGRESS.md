# Compileme — İlerleme Günlüğü (`docs/PROGRESS.md`)

> Tüm ajanlar (Antigravity / Codex / Claude) için ortak ilerleme kaydı. Amaç: "şu an neredeyiz, en son ne yapıldı, sırada ne var" sürekliliğini korumak.
>
> **Kurallar:**
> 1. Bir iş/faz tamamladıktan sonra **en üste** yeni bir günlük girişi ekle (en aşağıdaki şablonu kopyala).
> 2. Geçmiş girişleri **asla silme veya değiştirme** — sadece ekle.
> 3. Her girişten sonra yukarıdaki **"Şu Anki Durum"** özetini ve **"Faz Durumu"** tablosunu güncelle.
> 4. Engel veya plandan sapma varsa **mutlaka yaz** — bir sonraki ajan/oturum bunu okuyacak.
> 5. Mimariyi etkileyen kalıcı bir karar verdiysen en alttaki **"Kalıcı Kararlar"** listesine de bir satır ekle.

---

## Şu Anki Durum
- **Aktif faz:** Faz 8 — Takvim (backend)
- **Çalışıyor mu:** Evet (Faz 8 başarıyla tamamlandı, aggregate calendar API /api/calendar testleri başarılı)
- **Sırada:** Faz 9 — Odak modu + Hava backend modülünü kur (settings, weather proxy, focus sessions).
- **Son güncelleme:** 07.06.2026

## Faz Durumu
| Faz | Konu | Durum |
|-----|------|-------|
| 0 | İskelet & bağlama | ✅ Tamamlandı |
| 1 | Ortak altyapı | ✅ Tamamlandı |
| 2 | Görevler + Dashboard (backend) | ✅ Tamamlandı |
| 3 | Su takibi (backend) | ✅ Tamamlandı |
| 4 | Fikir havuzu (backend) | ✅ Tamamlandı |
| 5 | Projeler (backend) | ✅ Tamamlandı |
| 6 | Dosya (backend) | ✅ Tamamlandı |
| 7 | Eğitimler (backend) | ✅ Tamamlandı |
| 8 | Takvim (backend) | ✅ Tamamlandı |
| 9 | Odak modu + Hava (backend) | ⬜ Başlanmadı |
| 10 | Asistan (ops, backend) | ⬜ Başlanmadı |
| 11 | Cila/yayın (ops) | ⬜ Başlanmadı |

İşaretler: ⬜ Başlanmadı · 🟡 Devam ediyor · ✅ Tamamlandı · ⛔ Engellendi

---

## Günlük
> En yeni giriş en üstte. Yeni girişi buraya, bu satırın hemen altına ekle.

### 2026-06-07 · Faz 8 — Takvim (backend)
- Ajan: Antigravity
- Branch / commit: master / c50d3b0
- Durum: Tamamlandı
- Yapılanlar:
  - Takvim görünüm türleri için `CalendarView.java` (`DAY`, `WEEK`, `MONTH`) enum sınıfı eklendi.
  - Tasks (`TaskResponse`) ve Educations (`EducationResponse`) listelerini tek bir aggregate response gövdesinde birleştiren `CalendarResponse.java` DTO record sınıfı oluşturuldu.
  - Görevler ve eğitimleri tarih aralığı hesaplayarak getiren `CalendarService.java` servis sınıfı eklendi. Modül sınırlarına sadık kalınarak `TaskService` ve `EducationService` çağrıları kullanıldı.
  - HTTP `GET /api/calendar` endpoint'ini sağlayan `CalendarController.java` sınıfı eklendi.
- Kararlar:
  - `kind` parametresiyle filtreleme yapıldığında, eğitimlerin (education) sadece `kind == TaskKind.EDUCATION` veya filtre belirtilmediğinde getirilmesi, diğer kind'larda (`PROJECT`, `REFACTOR` vb.) listelenmemesi sağlandı.
- Kabul kriteri:
  - Proje JDK 21 ve IntelliJ Maven ile başarıyla derlendi, Docker imajı sorunsuz build edildi.
  - Günlük, haftalık, aylık görünümler ve kind filtreleri powershell API testleriyle doğrulandı. Pazartesi-Pazar haftalık sınır hesaplamalarının doğru yapıldığı görüldü.
- Açık konular / sıradaki:
  - Faz 9 (Odak modu + hava + settings backend) modülünün geliştirilmesine geçilecek.

### 2026-06-07 · Faz 7 — Eğitimler (backend)
- Ajan: Antigravity
- Branch / commit: master / 8a82684
- Durum: Tamamlandı
- Yapılanlar:
  - Eğitim kaynak tipleri, durumu ve eğitim türü için `ResourceType`, `EducationStatus` ve `EducationType` enumları tanımlandı.
  - JPA Entity sınıfları `Education.java`, `EducationResource.java` ve `EducationPractice.java` yazıldı.
  - `EducationRepository`, `EducationResourceRepository` ve `EducationPracticeRepository` interface'leri oluşturuldu.
  - DTO record'ları ve veri eşleme için `EducationMapper` mapping katmanı yazıldı.
  - Tüm iş mantığını, sahiplik doğrulamalarını ve Faz 6 dosya doğrulamalarını içeren `EducationService` concrete sınıfı yazıldı.
  - REST endpoint'lerini sunan `EducationController.java` denetleyicisi eklendi.
- Kararlar:
  - `education_resource` ve `education_practice` tabloları Validate şemasında `updated_at` içermediğinden JPA doğrulaması hatası almamak adına `BaseEntity`'den türetilmedi.
- Kabul kriteri:
  - Derleme, Docker Compose başlangıcı ve Flyway V3 doğrulamaları başarıyla geçti.
  - Yüzdelik validasyonu, var olmayan dosya sahiplik doğrulamaları ve silme/güncelleme testleri başarıyla gerçekleştirildi.

### 2026-06-07 · Faz 6 — Dosya (backend)
- Ajan: Antigravity
- Branch / commit: master / Faz 6
- Durum: Tamamlandı
- Yapılanlar:
  - Dosya metaverilerini saklamak için `StoredFile.java` JPA Entity sınıfı ve `StoredFileRepository.java` interface'i oluşturuldu.
  - Flyway şema değişikliğini uygulamak için `V3__create_stored_file_table.sql` migration dosyası eklendi.
  - `application.yml` dosyasına multipart dosya boyutu limitleri (15MB) ve `app.upload.dir` (diskte `./uploads`) özelliği eklendi.
  - Dosya yükleme ve indirme işlemleri sırasında oluşabilecek disk ve I/O hataları için `FileStorageException.java` hata sınıfı common paketine eklendi.
  - Dosyaların diskte UUID tabanlı benzersiz isimlerle kaydedilmesi, diskten yüklenmesi, silinmesi ve metaverilerinin veritabanında saklanması iş mantığını yöneten `FileService.java` concrete sınıfı yazıldı. Uygulama başlarken (`@PostConstruct`) diskteki upload dizininin otomatik oluşturulması sağlandı.
  - Dosya yükleme (`POST /api/files`), indirme/ inline görüntüleme (`GET /api/files/{id}`), metadata sorgulama (`GET /api/files/{id}/metadata`) ve dosya silme (`DELETE /api/files/{id}`) REST endpoint'lerini sunan `FileController.java` sınıfı eklendi.
- Kararlar:
  - `stored_file` tablosunda `updated_at` kolonu bulunmadığı için `StoredFile` entity sınıfı `BaseEntity`'den türetilmedi (validate hatasını önlemek amacıyla).
  - Dosya indirme endpoint'inde `Content-Disposition` header'ı `inline` yapılarak tarayıcıların desteklenen formatları (PDF, resim, metin) doğrudan açabilmesi sağlandı.
- Kabul kriteri:
  - Proje JDK 21 ile hem yerel ortamda hem de Docker multi-stage build içinde başarıyla derlendi.
  - Docker Compose ortamı (`postgres`, `backend`, `pgadmin`) sorunsuz ayağa kaldırıldı, Flyway V3 başarıyla uygulandı.
  - curl.exe ile yapılan testlerde dosya başarıyla yüklendi, `id = 1` ile metaveri alındı.
  - Yüklenen dosya `/api/files/1` ile içeriği ve `Content-Type: text/plain` header'ı doğrulanarak indirildi.
  - Dosya `/api/files/1` üzerinden silindi, veritabanı kaydıyla beraber Docker üzerindeki `/uploads` dizininden de fiziksel dosyanın tamamen silindiği ve tekrar sorgulandığında `404 Not Found` döndüğü doğrulandı.
- Açık konular / sıradaki:
  - Faz 7 (Eğitimler backend modülü - education, resource, practice CRUD işlemleri) başlatılacak.

### 2026-06-07 · Faz 5 — Projeler (backend)
- Ajan: Antigravity
- Branch / commit: master / Faz 5
- Durum: Tamamlandı
- Yapılanlar:
  - Projeler modülünde kullanılan enum'lar (`ProjectStatus`, `TechnologyCategory`, `SnippetCategory`, `LinkType`, `LinkCategory`, `DocumentType`, `DocumentFormat`) oluşturuldu.
  - V1 şemasına uygun JPA entity sınıfları (`Project`, `ProjectPhase`, `ProjectTechnology`, `ProjectSnippet`, `ProjectLink`, `ProjectDocument`) yazıldı. Denetim kolonları (created_at, updated_at) olmayan tablolar için entity sınıfları `BaseEntity`'den türetilmedi.
  - Altı ana repository arayüzü (`ProjectRepository`, `ProjectPhaseRepository`, `ProjectTechnologyRepository`, `ProjectSnippetRepository`, `ProjectLinkRepository`, `ProjectDocumentRepository`) oluşturuldu.
  - Modüller arası gevşek bağlılık için `ProjectCreatedFromIdeaEvent` domain event sınıfı yazıldı.
  - `ProjectEventListener` (`IdeaConvertedEvent` dinler) ve `IdeaEventListener` (`ProjectCreatedFromIdeaEvent` dinler) dinleyicileri eklendi.
  - Fikir modülündeki `IdeaService` sınıfına `linkProject(Long ideaId, Long projectId)` metodu eklenerek fikir ile dönüşen proje arasındaki ilişkilendirme sağlandı.
  - Proje, faz, teknoloji, snippet, link ve doküman için DTO sınıfları ile veri eşleme için `ProjectMapper` yazıldı.
  - Tüm iş mantığı ve yetkilendirme (sahiplik) denetimlerini gerçekleştiren `ProjectService` ile REST endpoint'lerini (`GET`, `POST`, `PATCH`, `DELETE`) sunan `ProjectController` kodlandı.
  - Faz sıralama sıralamasını yönetmek için `PATCH /api/projects/phases/reorder` endpoint'i yazıldı.
- Kararlar:
  - Fikir havuzunun projeler modülü ile sıkı sıkıya bağlı (hard-dependency) olmasını engellemek için çift yönlü olay tabanlı döngü (double-event loop) tasarlandı. Fikir dönüştürüldüğünde proje oluşturulur, proje oluşturulunca olay fırlatılarak fikir güncellenir.
- Kabul kriteri:
  - Proje `mvn compile` ile başarıyla derlendi, tüm 9 JPA repository'si yüklendi.
  - PowerShell / curl.exe ile yapılan API testlerinde:
    - Yeni bir fikir eklendi, projeye başarıyla dönüştürüldü ve fikrin `convertedProjectId` alanı ve durumu `CONVERTED` olarak güncellendi.
    - Proje güncelleme, faz ekleme/listeleme/sıralama değiştirme (reorder) testleri başarıyla gerçekleştirildi.
    - Teknoloji, snippet, link, doküman ekleme/listeleme/güncelleme/silme işlemleri başarıyla tamamlandı.
    - Proje silindiğinde ilişkili faz, teknoloji, snippet vb. verilerin ON DELETE CASCADE ile silindiği ve ilgili fikrin `convertedProjectId` alanının SET NULL yapıldığı doğrulandı.
- Açık konular / sıradaki:
  - Faz 6 (Dosya backend modülü - multipart upload ve dosya indirme/açma işlemleri) başlatılacak.

### 2026-06-07 · Faz 4 — Fikir Havuzu (backend)
- Ajan: Antigravity
- Branch / commit: master / Faz 4
- Durum: Tamamlandı
- Yapılanlar:
  - JPA Entity `Idea.java` oluşturuldu, V1 veri tabanı şemasıyla birebir eşlendi (güncelleme tarihi bulunduğundan `BaseEntity`'den türetildi).
  - Fikir durumu için `RAW`, `DEVELOPING`, `CONVERTED` durumlarını içeren `IdeaStatus` enum'u yazıldı.
  - Kullanıcıya göre fikirleri listeleyen `IdeaRepository` eklendi.
  - Girdi/çıktı veri modelleri için `IdeaRequest` ve `IdeaResponse` DTO'ları ve statik mapping için `IdeaMapper`Mapper sınıfı yazıldı.
  - Domain Event yapısını implement eden `IdeaConvertedEvent` record sınıfı tanımlandı.
  - `IdeaService` concrete servis sınıfı eklenerek CRUD, güncelleme, silme (sahiplik doğrulamalı) ve projeye dönüştürme (`convert`) işlemleri implement edildi.
  - `IdeaEventListener` concrete sınıfı yazıldı, `IdeaConvertedEvent` tetiklendiğinde olay loglandı (Faz 5'te bu dinleyici gerçek proje kaydı oluşturacak şekilde genişletilecek).
  - `/api/ideas` altındaki REST endpoint'leri (`GET`, `POST`, `PATCH`, `/convert`, `DELETE`) `IdeaController` ile sunuldu.
- Kararlar:
  - Fikir projeye dönüştürüldüğünde gevşek bağlılığı (loose coupling) sağlamak amacıyla Spring domain event yapısı kullanıldı.
  - Projeler modülü henüz yazılmadığı için geçici bir olay dinleyicisi `@EventListener` yazılarak olay loglandı.
- Kabul kriteri:
  - Proje `mvn compile` ile hatasız derlendi, Tomcat başarıyla başladı.
  - API üzerinden log ekleme, güncelleme, dönüştürme ve silme testleri PowerShell aracılığıyla başarıyla tamamlandı. Fikir dönüştürüldüğünde olay dinleyicisinin (`IdeaEventListener`) log mesajını başarıyla bastığı doğrulandı.
- Açık konular / sıradaki:
  - Faz 5 (Projeler backend) modülünün geliştirilmesine geçilecek.

### 2026-06-07 · Faz 3 — Su Takibi (backend)
- Ajan: Antigravity
- Branch / commit: master / Faz 3
- Durum: Tamamlandı
- Yapılanlar:
  - JPA Entity `WaterLog.java` oluşturuldu, V1 veri tabanı şemasıyla birebir eşlendi (güncelleme tarihi bulunmadığından `BaseEntity`'den türetilmedi).
  - Su kaynakları ve varsayılan ml değerleri için `WaterSource` enum'u tanımlandı.
  - Tarihe göre listeleme ve `coalesce` destekli SUM (toplam tüketilen ml) sorguları için `WaterLogRepository` yazıldı.
  - Girdi/çıktı veri modelleri için `WaterLogRequest`, `WaterLogResponse`, `WaterSummaryResponse` DTO'ları ve statik `WaterLogMapper` mapper sınıfı oluşturuldu.
  - `WaterService` concrete servis sınıfı eklenerek su özet istatistiklerini hesaplama (yüzde hesaplaması tam sayıya yuvarlandı), su tüketimi ekleme (preset kaynakların ml'leri sunucuda çözülür, CUSTOM'da >0 kontrolü yapılır) ve log silme (sahiplik denetimli) işlemleri yazıldı.
  - REST endpoint'leri `/api/water` (`GET`, `POST`, `DELETE`) `WaterController` ile sunuldu.
  - `DashboardService` güncellenerek bugünün tüketilen su miktarı `WaterService` üzerinden çekildi ve `DashboardResponse` içerisindeki `todayWaterAmountMl` alanı dolduruldu.
- Kararlar:
  - Günlük su hedefi şimdilik `DEFAULT_WATER_GOAL_ML = 3000` ml olarak sabitlendi (Faz 9 settings entegrasyonunda dinamik yapılacak).
  - Presets (1500ml/500ml/300ml) ml değerleri sunucu tarafında enum'da tutularak istemci veri tutarsızlıkları engellendi.
- Kabul kriteri:
  - Proje `mvn compile` ile hatasız derlendi ve Tomcat sorunsuz başladı.
  - API üzerinden log ekleme (HALF_500, CUSTOM 450ml), özet sorgulama (950ml, %32), dashboard entegrasyonu, log silme (450ml, %15) ve geçersiz custom girdi doğrulama testleri başarıyla gerçekleştirildi.
- Açık konular / sıradaki:
  - Faz 4 (Fikir Havuzu backend) modülünün geliştirilmesine geçilecek.

### 2026-06-07 · Faz 2 — Görevler + Dashboard (backend)
- Ajan: Antigravity
- Branch / commit: master / Faz 2
- Durum: Tamamlandı
- Yapılanlar:
  - JPA Entity `Task.java` oluşturuldu, V1 veri tabanı şemasıyla birebir eşlendi.
  - Görev durumu, türü ve havuzu için `TaskStatus`, `TaskKind`, `PlanningBucket` enum'ları eklendi.
  - `CurrentUserProvider` ile giriş yapan kullanıcının (`user_id = 1L`) veri erişim kapsamı güvenli hale getirildi.
  - `TaskRepository` yazıldı ve esnek arama sorgusu entegre edildi.
  - `TaskService` concrete servis olarak CRUD, complete (toggle), move (aktarma), reorder (sıralama) ve silme iş mantığıyla implement edildi.
  - `/api/tasks` altındaki tüm REST endpoint'leri (CRUD, `/complete`, `/move`, `/reorder`) `TaskController` ile sunuldu.
  - `DashboardController` ve `DashboardService` katmanı, modül sınırlarına uygun şekilde `TaskService` aracılığıyla bugünün görev sayılarını (toplam/tamamlanan) getirecek şekilde kodlandı.
- Kararlar:
  - PostgreSQL'de sorgu parametre tiplerinin belirsizlik hatasını (`could not determine data type of parameter`) aşmak için JPQL filtrelerinde parametreler açıkça cast edildi: `cast(:param as type)`.
- Kabul kriteri:
  - `mvn compile` başarıyla tamamlandı, uygulama Flyway migration'larını sorunsuz uygulayarak başladı.
  - PowerShell ile `POST`, `GET`, `PATCH` ve `DELETE` istekleri üzerinden tüm CRUD, tamamlama, sıralama ve taşıma işlemleri doğrulanarak sistemin çalıştığı gözlemlendi.
  - Dashboard API'sinin toplam/tamamlanan görev adetlerini doğru yansıttığı teyit edildi.
- Açık konular / sıradaki:
  - Faz 3 (Su Takibi backend) geliştirilmesine geçilecek.

### 2026-06-07 · Faz 1 — Ortak altyapı
- Ajan: Antigravity
- Branch / commit: master / c550817 (Faz 0) -> Sonraki commit Faz 1
- Durum: Tamamlandı
- Yapılanlar:
  - Backend tarafında `DomainEvent` marker interface'i ve `ExampleDomainEvent` örnek event kaydı oluşturuldu.
  - Jackson nesne serileştiricisinin tarih verilerini ISO-8601 biçiminde dönmesi için `JacksonConfig.java` yazıldı.
  - Frontend tarafına `sonner` bildirim kütüphanesi kuruldu ve `App.tsx` içerisine `<Toaster />` enjekte edildi.
  - TanStack Query `staleTime: 30000` ve pencere odağı yenilemeleri devre dışı bırakacak şekilde güncellendi.
  - Türkçe tarih biçimlendirme ve gün ekleme fonksiyonları `src/lib/date.ts` altında kodlandı.
  - Zustand ile sol menü ve tema yönetimi sağlayan `useUiStore.ts` store'u oluşturuldu.
  - `src/api/health.ts` custom hook'u yazıldı ve Dashboard inline query yerine `useHealth()` hook'una geçirildi.
  - Çekirdek primitive bileşenler (`Button`, `Card`, `Input`, `Textarea`, `Label`, `Badge`, `Spinner`, `EmptyState`) `components/ui/` altında oluşturuldu.
  - `docs/MODULE-TEMPLATE.md` ile yeni modül ekleme standartları dökümante edildi.
- Kararlar:
  - Bağımlılık sadeliğini korumak adına MapStruct kullanılmadı, elle eşleme konvensiyonu dökümante edildi.
  - Sayfalama (pagination) kişisel ölçekte gerek görülmediği için listeler doğrudan `List<XResponse>` dönülecek.
- Kabul kriteri:
  - `npm run build` ve `mvn compile` başarıyla tamamlandı.
  - Dashboard'daki durum göstergesi custom hook ile çalışmakta, bildirim sistemi (toast) çalışır vaziyettedir.
- Açık konular / sıradaki:
  - Faz 2 (Görevler ve Anasayfa) başlatılacak.

### 2026-06-07 · Faz 0 — İskelet & bağlama
- Ajan: Antigravity
- Branch / commit: master / a2121d1
- Durum: Tamamlandı
- Yapılanlar:
  - `docker-compose.yml` ile PostgreSQL 16 ve pgAdmin 4 ayağa kaldırıldı (Çakışma önlemek için host portu `5433` yapıldı).
  - Spring Boot 3.4.5 Maven backend oluşturuldu. Local sistemde JDK 18 olduğundan target compile sürümü `17` olarak ayarlandı.
  - Flyway entegrasyonu tamamlandı, `V1__init_schema.sql` ve `V2__seed_user.sql` (Görkem kullanıcısı ve ayarları) migrations başarıyla uygulandı.
  - `/api/health` durum endpoint'i yazıldı.
  - React + Vite + TypeScript + Tailwind CSS tabanlı frontend iskeleti kuruldu.
  - Sol navigasyon sidebar'ı ve tam ekran Odak Modu geçişi uygulandı.
  - TanStack Query ile dashboard üzerinde `/api/health` çağrılıp API bağlantı durumu görselleştirildi.
  - Oturumda bir kez çalışan animasyonlu `WelcomeSplash` ("Hoş geldin, Görkem") entegre edildi.
  - `npm run build` ile frontend'in hatasız derlendiği doğrulandı.
- Kararlar:
  - Local makinede port `5432` dolu olduğundan Docker host portu `5433` olarak değiştirildi.
  - Local makinede JDK 21 bulunmadığından backend target compiler release sürümü Java `17`'ye çekildi (Spring Boot 3.4.5 ile tam uyumludur).
  - Lucide React'ın bu sürümünde Rollup bundler compile sırasında `FolderCode` bulunamadığı için Sidebar ve Projects sayfasındaki ikon `Folder` olarak değiştirildi.
- Kabul kriteri: 
  - `docker compose up -d` başarılı.
  - `/api/health` 200 dönüyor.
  - Frontend `localhost:5173`'te açılıyor, Sidebar sayfaları geziliyor, animasyon oynuyor ve yeşil "API bağlantısı çalışıyor" görünüyor.
- Açık konular / sıradaki: 
  - Faz 1 (Ortak altyapı) başlatılacak.

---

## Boş Şablon (kopyala-yapıştır)

```
### YYYY-AA-GG · Faz X — Konu
- Ajan: Antigravity / Codex / Claude
- Branch / commit: faz-x-konu / <commit-hash>
- Durum: Tamamlandı / Devam / Engellendi
- Yapılanlar: (hangi dosyalar oluştu/değişti, ne eklendi — kısa ve net)
- Kararlar: (plandan sapma / seçim ve sebebi — yoksa "yok")
- Kabul kriteri: (geçti mi? hangi kriterler doğrulandı — örn. health 200, frontend yeşil)
- Açık konular / sıradaki: (TODO, engel, bir sonraki ajana not)
```

---

## Kalıcı Kararlar (ADR-lite)
> Mimariyi/şemayı etkileyen ve uzun süreli geçerli olan kararlar. Yeni karar = yeni satır.

- **Mimari:** Modüler monolit (mikroservis değil). Modüller sadece servis + DTO üzerinden konuşur.
- **Şema sahibi Flyway** (`ddl-auto=validate`); enum alanlar `VARCHAR + CHECK`.
- **Redis yok** — gerekirse önce Spring Cache + Caffeine.
- **Auth v1'de yok** — şema `user_id` ile hazır, tek kullanıcı `id=1`.
- **`task` merkezi tablo** — bugün/yarın + takvim + faz görevleri aynı tabloda; dokunmak en maliyetlisi.
- **PostgreSQL Portu:** Yerel port `5432` dolu olduğu için Docker host portu `5433` yapıldı ve backend bu porta bağlandı.
- **Java Sürümü:** Yerel makinede yalnızca JDK 18 kurulu olduğu için Java 21 yerine hedef derleme sürümü Java `17` yapıldı (Spring Boot 3.x ile tam uyumludur).
- **PostgreSQL Nullable Parametre Eşleşmesi:** JPQL/HQL sorgularında parametre null kontrolü yapılırken (`:param is null`) PostgreSQL'in tip çözümleme hatası vermesini engellemek için parametreler `cast(:param as type)` şeklinde cast edilir.
- **Java 21 Modernizasyonu ve Docker:** Proje Java 21 LTS sürümüne yükseltildi, Maven multi-stage Dockerfile ve docker-compose backend servisi eklenerek tüm mimari Dockerize edildi.
- **stored_file Denetim Kolonları:** stored_file tablosunda updated_at bulunmadığından entity sınıfı BaseEntity'den türetilmedi.
