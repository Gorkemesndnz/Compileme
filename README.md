# 🚀 Compileme — Bilgisayar Mühendisi Kişisel Üretkenlik & Planlama Platformu

**Compileme**, yazılım geliştiriciler ve bilgisayar mühendisleri için tasarlanmış; projeleri, fazları, eğitimleri, fikir havuzunu, günlük görevleri, takvimi, odak modunu ve su tüketimini tek bir noktadan yöneten **modüler monolit mimarili** kişisel üretkenlik ve planlama uygulamasıdır.

---

## 📸 Ekranlar ve Modüller

* **🏠 Anasayfa (Dashboard):** Günlük/yarınki görev planı, hızlı görev ve su ekleme, ekran başı süre takibi, özet metrik kartları.
* **📂 Projeler (Projects):** Projeler, fazlar, metro hatlı Proje Yol Haritası (Roadmap), kod kütüphanesi (snippets), teknik dökümanlar ve tasarım linkleri.
* **🎓 Eğitimler (Education Studio):** Eğitim kaynakları (PDF, Slayt, Link), sıralı eğitim yol haritası (Roadmap), çift tıklamayla dosya açma, dinamik sürükle-bırak ile sıralama ve konu sonu pratik mini projeler.
* **💡 Fikir Havuzu (Ideas):** Anlık fikirleri kaydetme, tag'leme ve tek tıkla domain event ile gerçek projeye dönüştürme.
* **📅 Takvim (Calendar):** Günlük/Haftalık/Aylık takvim görünümü, sürükle-bırak ile tarihlere görev/eğitim atama ve detay yönlendirmesi.
* **🧘 Odak Modu & Hava Durumu (Focus & Weather):** Tam ekran odak saati, hava durumu bilgisi, zemin ışık/renk ayarı ve sayaç.
* **💧 Su Takibi (Water Tracker):** Günlük su hedefi (mL) ve dikey doldurma animasyonu ile hızlı kayıt.

---

## 🛠️ Teknoloji Stack'i

### **Backend (Sunucu Katmanı)**
* **Dil / Sürüm:** Java 17 (JDK 18 ile tam uyumlu)
* **Framework:** Spring Boot 3.4.5
* **Derleme Aracı:** Maven
* **Veritabanı:** PostgreSQL 16 (Docker, Port `5433` lokal / `5421` internal)
* **ORM & Migration:** Spring Data JPA + Hibernate & Flyway (`flyway-core`)
* **Dökümantasyon:** OpenAPI 3 / Swagger UI (`springdoc-openapi-starter-webmvc-ui`)

### **Frontend (Arayüz Katmanı)**
* **Kütüphane / Derleyici:** React 18 · Vite · TypeScript
* **Stil:** Tailwind CSS (shadcn / 21st.dev uyumlu modern UI) & Glassmorphism & Modern Dark/Light Tema
* **State & Query:** TanStack Query (React Query) · Zustand · Axios

### **Altyapı (Infrastructure)**
* **Konteynerizasyon:** Docker & Docker Compose (`postgres`, `pgadmin`, `backend`)

---

## 🔐 API Key Güvenliği ve Canlıda Saklanması (Production Security)

Uygulama içerisinde hava durumu bilgisi için **OpenWeatherMap API** entegrasyonu bulunmaktadır.

### 🛡️ API Key Neden Çalınmaz ve Nasıl Saklanır?
1. **Proxy Mimarisi (Server-Side Proxy):** API Key **ASLA** frontend (React/Browser) kodlarına yazılmaz. Arayüz sadece sizin backend sunucunuza `GET /api/weather?city=Istanbul` isteği atar.
2. **Backend Maskeleme:** OpenWeather API isteğini Java Spring Boot sunucusu arka planda kendi ortam değişkenlerinden (`OPENWEATHER_API_KEY`) okuyarak yapar. Tarayıcı Ağ (Network) sekmesini inceleyen hiç kimse sizin API key'inizi göremez.
3. **`.env` Dosyası:** Gerçek API anahtarlarınız `.gitignore` tarafından korunan `.env` dosyasında tutulur ve Git deposuna **asla commit edilmez**.

---

## ⚡ Kurulum ve Çalıştırma Rehberi

### 1. Ön Gereksinimler (Prerequisites)
Bilgisayarınızda aşağıdaki araçların yüklü olduğundan emin olun:
* **Java 17+** (yerelde `java -version`)
* **Node.js 18+** & **npm** (`node -v`)
* **Docker & Docker Compose** (`docker --version`)

---

### 2. Depoyu Klonlama ve Ortam Dosyasını Hazırlama

```bash
git clone https://github.com/Gorkemesndnz/Compileme.git
cd Compileme
```

Proje kök dizinindeki `.env.example` dosyasını kopyalayarak gizli `.env` dosyanızı oluşturun:

```bash
# Windows PowerShell
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

`.env` dosyasını açıp kendi OpenWeatherMap API anahtarınızı girin:

```env
POSTGRES_DB=compileme
POSTGRES_USER=compileme
POSTGRES_PASSWORD=compileme

OPENWEATHER_API_KEY=buraya_openweather_api_keyinizi_yazin
```

---

### 3. Lokal Geliştirme Ortamı (Development Mode)

#### Adım 1: Veritabanını Docker ile Başlatın
```bash
docker compose up -d postgres
```
> **Not:** PostgreSQL varsayılan olarak **5433** portunda dinler. (Yerel 5432 çakışmalarını önlemek için).

#### Adım 2: Backend Servisini Çalıştırın
```bash
cd backend
mvn spring-boot:run
```
> Backend sunucusu `http://localhost:8080` adresinde çalışmaya başlar.
> Swagger UI dökümantasyonu: `http://localhost:8080/swagger-ui.html`

#### Adım 3: Frontend Sunucusunu Çalıştırın
Yeni bir terminal sekmesi açın:
```bash
cd frontend
npm install
npm run dev
```
> Uygulama arayüzü `http://localhost:5173` adresinde açılacaktır.

---

### 4. Canlıya Alma / Production Dağıtımı (Docker Compose)

Tüm projeyi (PostgreSQL + Spring Boot Backend) canlı sunucuda tek komutla konteynerize edip ayağa kaldırmak için:

```bash
# .env dosyanızın hazır olduğundan emin olun
docker compose up -d --build
```

Konteyner durumlarını kontrol etmek için:
```bash
docker compose ps
```

Kapatmak için:
```bash
docker compose down
```

---

## 🏛️ Veritabanı Şeması & Migration (Flyway)

Veritabanı şeması **Flyway** migration yönetimi altındadır. Spring Boot uygulaması başladığında tabloları otomatik oluşturur ve günceller (`db/migration/V1__init_schema.sql` ... `V11`).

Ana tablolar:
* `app_user` & `settings`
* `project`, `project_phase`, `project_technology`, `project_snippet`, `project_link`, `project_document`
* `education`, `education_resource`, `education_practice`
* `task` (Merkezi Görev Tablosu)
* `idea`, `water_log`, `focus_session`

---

## 📄 Lisans
Bu proje kişisel kullanım ve geliştirme amacıyla tasarlanmıştır. Tüm hakları saklıdır.
