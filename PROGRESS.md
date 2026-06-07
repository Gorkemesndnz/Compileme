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
- **Aktif faz:** Faz 4 — Fikir Havuzu (backend)
- **Çalışıyor mu:** Evet (Faz 3 başarıyla tamamlandı, backend derleniyor ve tüm su-dashboard API testleri başarılı)
- **Sırada:** Faz 4'ü kur → Fikir Havuzu backend modülü (idea CRUD + convert).
- **Son güncelleme:** 07.06.2026

## Faz Durumu
| Faz | Konu | Durum |
|-----|------|-------|
| 0 | İskelet & bağlama | ✅ Tamamlandı |
| 1 | Ortak altyapı | ✅ Tamamlandı |
| 2 | Görevler + Dashboard (backend) | ✅ Tamamlandı |
| 3 | Su takibi (backend) | ✅ Tamamlandı |
| 4 | Fikir havuzu (backend) | ⬜ Başlanmadı |
| 5 | Projeler (backend) | ⬜ Başlanmadı |
| 6 | Dosya (backend) | ⬜ Başlanmadı |
| 7 | Eğitimler (backend) | ⬜ Başlanmadı |
| 8 | Takvim (backend) | ⬜ Başlanmadı |
| 9 | Odak modu + Hava (backend) | ⬜ Başlanmadı |
| 10 | Asistan (ops, backend) | ⬜ Başlanmadı |
| 11 | Cila/yayın (ops) | ⬜ Başlanmadı |

İşaretler: ⬜ Başlanmadı · 🟡 Devam ediyor · ✅ Tamamlandı · ⛔ Engellendi

---

## Günlük
> En yeni giriş en üstte. Yeni girişi buraya, bu satırın hemen altına ekle.

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
