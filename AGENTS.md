# AGENTS.md — Compileme Proje Rehberi (tüm ajanlar için tek doğru kaynak)

> **Hangi ajan olursan ol (Antigravity / Codex / Claude / başka), bir işe başlamadan ÖNCE bu dosyayı oku ve buna uy.**
> Bu dosya stack, mimari kuralları, veritabanı yapısı, endpoint'ler ve faz planını tanımlar. Kod stili veya yapı kararı verirken bu dosya esas alınır; çakışan eski varsayımlar geçersizdir.

---

## 1. Proje nedir
**Compileme** — bir bilgisayar mühendisinin kişisel üretkenlik & planlama uygulaması. **Lokalde** çalışacak (ileride yayınlanabilir). Tek kullanıcı.

### Modüller (ekranlar)
- **Anasayfa:** karşılama + gün/tarih, bugünkü/yarınki görevler (todo), bugün yapamadığını yarına aktarma, özet kartları, su takibi, ekran başı süre.
- **Projeler:** proje + fazlar + faz görevleri; teknik döküman (kullanılan teknolojiler), DB şeması, refaktör/gelecek özellik planları, beğenilen kod parçacıkları (kopyalanabilir), tasarım/referans linkleri (frontend/backend ayrımı).
- **Eğitimler:** eğitim kaynakları (yazılım dili veya İngilizce gibi), kaynak linki, kademeli ilerleme %, PDF/slayt dosyaları, konu sonu pratik mini projeleri (kod/not ile).
- **Fikir Havuzu:** anlık fikirleri hızlı yazma; tek tuşla projeye dönüştürme.
- **Takvim:** günlük/haftalık/aylık görünüm; sürükle-bırak ile tarihe yerleştirme; görev/eğitim/refaktör filtreleri; aylık plana atıp sonra bir güne taşıma. Bir öğeye basınca ilgili proje/faz/göreve gider.
- **Odak Modu:** tam ekran saat/tarih, günün ajandası, hava durumu, ekran ışık/sıcaklık (renk) ayarı; ileride sayaç. Karanlıkta çalışırken hem ışık kaynağı hem odak ekranı.

---

## 2. Teknoloji stack'i (KESİN — değiştirme)
**Backend:** Java 17 (hedef) · Spring Boot 3.4.5 · Maven · Spring Web · Spring Data JPA + Hibernate · Spring Validation · Lombok · springdoc-openapi (Swagger UI)
**DB:** PostgreSQL 16 (Docker, **host portu 5433**) · Flyway (migration: `flyway-core` + `flyway-database-postgresql`)
**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS (shadcn/21st.dev uyumlu) · React Router · TanStack Query · axios · zustand
**Altyapı:** Docker Compose (postgres + pgadmin)

> **Ortam notları (gerçek kurulum — bunlara uy):**
> - Hedef derleme sürümü **Java 17** (yerel makinede JDK 18 var; Spring Boot 3.4.5 ile tam uyumlu). Java 21'e yükseltme yapma — yerelde yok.
> - PostgreSQL Docker **host portu 5433** (yerelde 5432 dolu). `application.yml` JDBC bu porta bağlı. 5432 varsayma.
> - Bağımlılık eklerken sürüm uyumuna dikkat (örn. lucide-react'ta olmayan ikon adı kullanma — `FolderCode` yok, `Folder` kullan).

### Bilinçli OLMAYAN kararlar (eklemeyin)
- **Mikroservis YOK** — modüler monolit (sebep: tek kullanıcı/tek deploy; mikroservisin maliyeti var faydası yok).
- **Redis YOK** — gerek yok. Önbellek gerekirse önce Spring Cache + Caffeine (process-içi). Redis ancak çok-instance yayın senaryosunda.
- **Auth (Spring Security) v1'de YOK** — ama şema `user_id` ile hazır; ileride sancısız eklenir. Şimdilik tek kullanıcı `id=1`.

---

## 3. Mimari kuralları (modüler monolit — EN ÖNEMLİ BÖLÜM)
Amaç: bir yeri değiştirince başka 10 yerin bozulmaması. Bunu sağlayan kurallar:

1. **Package-by-feature.** Her modül kendi paketinde: `com.compileme.<modul>` → `controller / service / repository / entity / dto`. Ortaklar `com.compileme.common`.
2. **Modül sınırı kapalıdır.** Bir modül başka modülün **repository'sine veya entity'sine ASLA doğrudan dokunmaz.** Sadece o modülün **public servis arayüzü + DTO**'su üzerinden konuşur. (Örn. Takvim, görev verisi için `TaskRepository`'ye değil `TaskService`'in metoduna gider.)
3. **Modüller arası tepkiler domain event ile.** "Şu olunca şu da olsun" (fikir projeye dönüşünce proje oluştur, görev tamamlanınca dashboard sayacı yenilensin) → Spring `ApplicationEventPublisher` / `@EventListener`. Sıkı bağlama yapma.
4. **Şemanın sahibi Flyway.** `spring.jpa.hibernate.ddl-auto=validate`. Hibernate tablo OLUŞTURMAZ, sadece doğrular. Şema değişikliği = yeni `V#__...sql` migration.
5. **Enum alanları:** DB'de `VARCHAR + CHECK`, Java'da `@Enumerated(EnumType.STRING)`. (PG native enum kullanma — değiştirmesi acı.)

Frontend tarafı da aynı mantık: her modül `src/features/<modul>/` içinde kapalı kalır; ortaklar `src/components`, `src/api`, `src/lib`, `src/layout`. Bir feature başka feature'ın iç dosyalarını import etmez.

---

## 4. Repo yapısı
```
compileme/
├── docker-compose.yml          # postgres:16 + pgadmin
├── README.md
├── AGENTS.md                   # bu dosya
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/compileme/
│       │   ├── CompilemeApplication.java
│       │   ├── common/{config,entity,exception}/
│       │   ├── task/  idea/  water/  focus/  calendar/  dashboard/  file/  weather/  settings/
│       │   └── project/{ , phase, technology, snippet, link, document}/
│       │       education/{ , resource, practice}/
│       └── resources/
│           ├── application.yml
│           └── db/migration/V1__init_schema.sql, V2__seed_user.sql, ...
└── frontend/
    ├── package.json, vite.config.ts, tsconfig*.json, tailwind.config.js, postcss.config.js, index.html
    └── src/
        ├── main.tsx, App.tsx, index.css
        ├── api/client.ts          # axios, baseURL /api
        ├── lib/utils.ts           # cn() = clsx + tailwind-merge (shadcn/21st.dev için)
        ├── layout/{AppLayout,Sidebar}.tsx
        ├── components/            # ortak UI
        └── features/{dashboard,projects,education,ideas,calendar,focus,water}/
```
Her backend feature paketinde tipik: `*Controller`, `*Service`, `*Repository`, `*` (entity), `dto/`, gerekirse `mapper/`.

---

## 5. Genel konvansiyonlar
- API kök yolu `/api`. JSON. `/api` istekleri Vite proxy ile `http://localhost:8080`'e gider.
- CORS: `http://localhost:5173`'e izin.
- Ortak `BaseEntity`: `id` + `createdAt`/`updatedAt` (`@CreationTimestamp`/`@UpdateTimestamp`).
- Hata yönetimi: `GlobalExceptionHandler` + `ApiError` (timestamp, status, error, message, path).
- Tailwind: shadcn token'ları (CSS değişkenleri: `--background`, `--primary`, …) + `cn()` yardımcısı. Koyu tema varsayılan (lacivert zemin, cyan vurgu). 21st.dev component'leri `src/components/` altına doğrudan yapıştırılabilir.
- Tarih/saat: tarih `date`, saat `time`; göreceli tarihler her zaman **bugünün tarihine** göre çözülür.
- Premium Tarih/Saat Seçimi: Arayüzlerde tarih ve saat seçimi için native tarayıcı girdileri yerine custom `DateTimePicker` bileşeni kullanılır. Bu bileşen, takvim görünümünün yanı sıra dikey kaydırma tekerleği (dikey wheel picker, 00-23 ve 00-59 scroll-snap destekli) ile premium saat seçimi sağlar. Tüm görev ekleme formları bu bileşeni kullanmalıdır.

---

## 6. Veritabanı yapısı
Tam DDL: `backend/src/main/resources/db/migration/V1__init_schema.sql` (tek doğru kaynak). Aşağısı model özetidir.

**app_user**(id, display_name, created_at)
**settings**(id, user_id→app_user, water_goal_ml=3000, weather_city, theme, focus_brightness, focus_temperature)

**project**(id, user_id, name, description, status[PLANNING/ACTIVE/PAUSED/DONE], created_at, updated_at)
**project_phase**(id, project_id→project, name, description, status, start_date, end_date, order_index)
**project_technology**(id, project_id, category[BACKEND/FRONTEND/MOBILE/DATABASE/DEVOPS/OTHER], title, technology, notes, order_index)
**project_snippet**(id, project_id, title, language, code, description, category[FRONTEND/BACKEND/OTHER], created_at)
**project_link**(id, project_id, title, url, type[DESIGN/REFERENCE/REPO/OTHER], category[FRONTEND/BACKEND/OTHER], notes, order_index)
**project_document**(id, project_id, type[DB_SCHEMA/REFACTOR_PLAN/FUTURE_FEATURES/TECH_DOC/GENERAL], title, content, content_format[MARKDOWN/CODE/SQL], order_index)

**idea**(id, user_id, title, content, status[RAW/DEVELOPING/CONVERTED], tags, converted_project_id→project, created_at, updated_at)

**education**(id, user_id, title, source, source_url, type[PROGRAMMING/LANGUAGE/OTHER], progress_percent 0-100, status[ACTIVE/PAUSED/DONE], next_study_date, created_at, updated_at)
**education_resource**(id, education_id→education, name, type[PDF/SLIDE/FILE/LINK], url_or_path, order_index)
**education_practice**(id, education_id, title, completed, code, notes, order_index)

**task** — MERKEZİ TABLO (Anasayfa bugün/yarın + Takvim + faz görevleri AYNI tabloyu kullanır):
(id, user_id, title, notes, status[TODO/DONE], kind[GENERAL/PROJECT/EDUCATION/REFACTOR], scheduled_date, scheduled_time, duration_minutes, planning_bucket[UNSCHEDULED/DAY/WEEK/MONTH], target_period, project_id, phase_id, education_id, order_index, completed_at, created_at, updated_at)
- "Yarına aktar" = `scheduled_date += 1`.
- Sürükle-bırak (aylık→gün) = `planning_bucket=DAY` + `scheduled_date` ata.
- Detaya yönlendirme = `kind` + ilgili FK üzerinden.
- **Bu tabloya sonradan dokunmak en maliyetlisidir — kind/bucket/FK kombinasyonu tüm görev-takvim akışını taşır.**

**water_log**(id, user_id, log_date, amount_ml>0, source[BOTTLE_1500/HALF_500/GLASS_300/CUSTOM], created_at)
**focus_session**(id, user_id, started_at, ended_at, duration_seconds, type[FOCUS/GENERAL], session_date)

---

## 7. REST endpoint'leri (planlanan)
**Dashboard:** `GET /api/dashboard?date=`
**Görevler:** `GET /api/tasks?date=&from=&to=&bucket=&kind=&projectId=&educationId=` · `POST` · `PATCH /{id}` · `PATCH /{id}/complete` · `PATCH /{id}/move` (yarına aktar / drag-drop) · `PATCH /reorder` · `DELETE /{id}`
**Fikirler:** `GET/POST /api/ideas` · `PATCH/DELETE /{id}` · `POST /{id}/convert`
**Projeler:** `GET/POST /api/projects` · `GET/PATCH/DELETE /{id}` · alt: `/{id}/phases`, `/phases/{id}` (+reorder), `/phases/{id}/tasks`, `/{id}/technologies`, `/{id}/snippets`, `/{id}/links`, `/{id}/documents`
**Eğitimler:** `GET/POST /api/educations` · `GET/PATCH/DELETE /{id}` · `PATCH /{id}/progress` · `/{id}/resources` · `/{id}/practices`
**Takvim:** `GET /api/calendar?view=day|week|month&date=` (task + education birleşik)
**Su:** `GET /api/water?date=` · `POST /api/water` · `DELETE /api/water/{id}`
**Odak/Süre:** `POST /api/focus-sessions/start` · `PATCH /{id}/stop` · `GET /api/focus-sessions?date=`
**Hava:** `GET /api/weather?city=` (OpenWeatherMap proxy)
**Dosya:** `POST /api/files` (multipart) · `GET /api/files/{id}`
**Ayarlar:** `GET/PUT /api/settings`
**(Sonra) Asistan:** `POST /api/assistant/message` (NL → görev/fikir)

---

## 8. Faz planı (sırayla; her fazı TEK ajan baştan sona bitirir)

> **YAKLAŞIM: BACKEND-FIRST.** Önce tüm backend (API) bitirilir, sonra frontend. Faz 2–10 **yalnızca backend**'dir; bu fazlarda `frontend/`'e dokunulmaz. Her modülün ekranı, backend bittikten sonra "Frontend Fazları" bloğunda gelir.
> Not: Faz 0 frontend iskeletini (boş kabuk + bağlantı testi) kurdu ve Faz 1 bazı frontend temel parçalarını (sonner, date helpers, useUiStore, `components/ui` primitive'leri) ekledi — bunlar duruyor; üzerine özellik ekranları frontend fazında gelecek.

### Backend fazları
- **Faz 0 — Kurulum & iskelet:** repo, docker-compose, Flyway V1+V2, CORS, `GET /api/health`, Swagger; frontend iskelet kabuğu + splash. ✅
- **Faz 1 — Backend ortak altyapı:** domain event altyapısı, `CurrentUserProvider`, Jackson tarih ayarı, `docs/MODULE-TEMPLATE.md`. (Ops: Spring Modulith.) ✅
- **Faz 2 — Görevler + Dashboard (çekirdek):** task CRUD + complete + move (yarına aktar/drag) + reorder; `GET /api/dashboard` bugünkü görev özeti (TaskService üzerinden).
- **Faz 3 — Su takibi:** water_log; bugünkü toplam/hedef/yüzde; log + sil.
- **Faz 4 — Fikir havuzu:** idea CRUD + convert (domain event → project).
- **Faz 5 — Projeler:** (5a project + project_phase, faz görevleri task'a ID ile bağlanır) (5b technology + snippet + link + document).
- **Faz 6 — Dosya:** multipart upload, indir/aç.
- **Faz 7 — Eğitimler:** education + resource + practice; ilerleme; dosya (Faz 6).
- **Faz 8 — Takvim:** aggregation endpoint (task + education); günlük/haftalık/aylık; kind filtresi.
- **Faz 9 — Odak / hava:** weather (OpenWeatherMap proxy); focus_session (ekran başı süre); settings.
- **Faz 10 — Asistan (ops):** NL → structured task; bulut API veya Ollama.

### Frontend fazları (TÜM backend bitince başlar)
- **FE-0 — Temel & ortak UI:** 21st.dev entegrasyonu, query/mutation hook convention (`src/api/<modul>.ts`), ortak ekran iskeletleri (loading/error/empty), tema.
- **FE — Anasayfa + Su:** bugün/yarın listeleri, hızlı ekleme, özet kartları, su halkası animasyonu.
- **FE — Projeler · Eğitimler · Takvim (drag-drop) · Odak modu · Fikir havuzu:** her modülün ekranı.
- **Cila/yayın (ops):** validation cilası, responsive, Dockerize, (yayınlarsa) auth.

> Backend'de: Faz 6 (dosya), Faz 7'den (eğitim) önce gelmeli. Çekirdek değer Faz 2'de.
> `docs/PROGRESS.md` faz durum tablosu bu sırayı takip eder.

---

## 9. Ajan çalışma kuralları
1. **Önce bu dosyayı oku, sonra iş yap.** Her prompt'a "AGENTS.md'yi oku ve uy" diye başlanır.
2. **Tek seferde tek faz, tek ajan.** Bir fazı yarıda başka ajana devretme — tutarsızlık oradan doğar.
3. **Bitti sayılır kriterini geçmeden** sonraki faza geçme.
4. **Modül sınırına saygı** (Bölüm 3). Kolaya kaçıp başka modülün repository'sine erişme.
5. **Her faz öncesi/sonrası git commit.** Bir ajan bir şeyi bozarsa `git diff` ile gör, gerekirse geri al.
6. **Aynı workspace'te aynı anda iki ajan dosya yazmasın.**
7. Ajan-özel config klasörleri (`.claude/` vb.) `.gitignore`'da; çakışma yaratmasın.
8. **İlerleme günlüğünü güncelle.** Bir iş/faz bitince `docs/PROGRESS.md`'ye oradaki şablona uygun bir giriş ekle, "Şu Anki Durum" ve "Faz Durumu" tablosunu güncelle. Bir sonraki ajan/oturum işe başlamadan önce o dosyayı okur.

### İş dağılımı (öneri)
- **Mekanik/kalıp işler → Antigravity (ücretsiz):** CRUD doldurma, DTO/mapper, form bağlama, test iskeleti.
- **Mimari/karar/debug → Claude + sen:** yeni modül sınır tasarımı, domain event'ler, takvim aggregation, asistan fazı, takılmalar.
- **Codex:** hızlı tek-dosya düzeltmeleri / mekanik kovaya yardımcı.
