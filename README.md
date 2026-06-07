# Compileme

Compileme, bir bilgisayar mühendisinin kişisel üretkenlik ve planlama uygulamasıdır.

## Mimari & Teknoloji Stack'i
- **Backend:** Java 21, Spring Boot 3.4.5, Maven, JPA, Flyway, PostgreSQL
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Axios, Zustand

Detaylı mimari ve faz planlaması için [AGENTS.md](file:///c:/Projelerim/Compileme/AGENTS.md) dosyasını inceleyin.

## Çalıştırma Adımları

Uygulamayı çalıştırmak için aşağıdaki adımları sırayla takip edin:

1. **Veritabanını Başlatın:**
   ```bash
   docker compose up -d
   ```

2. **Backend'i Başlatın:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Frontend'i Başlatın:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
