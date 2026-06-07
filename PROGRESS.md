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
- **Aktif faz:** Faz 0 — İskelet & bağlama
- **Çalışıyor mu:** Henüz çalıştırılmadı (Antigravity planı üretti, uygulama bekleniyor)
- **Sırada:** Faz 0'ı kur → 3 kabul kriterini geçir → git'e "Faz 0: iskelet" commit'i
- **Son güncelleme:** —

## Faz Durumu
| Faz | Konu | Durum |
|-----|------|-------|
| 0 | İskelet & bağlama | ⬜ Başlanmadı |
| 1 | Ortak altyapı | ⬜ Başlanmadı |
| 2 | Görevler + Anasayfa | ⬜ Başlanmadı |
| 3 | Su takibi | ⬜ Başlanmadı |
| 4 | Fikir havuzu | ⬜ Başlanmadı |
| 5 | Projeler | ⬜ Başlanmadı |
| 6 | Dosya | ⬜ Başlanmadı |
| 7 | Eğitimler | ⬜ Başlanmadı |
| 8 | Takvim | ⬜ Başlanmadı |
| 9 | Odak modu | ⬜ Başlanmadı |
| 10 | Asistan (ops) | ⬜ Başlanmadı |
| 11 | Cila/yayın (ops) | ⬜ Başlanmadı |

İşaretler: ⬜ Başlanmadı · 🟡 Devam ediyor · ✅ Tamamlandı · ⛔ Engellendi

---

## Günlük
> En yeni giriş en üstte. Yeni girişi buraya, bu satırın hemen altına ekle.

_(Henüz giriş yok — ilk girişi Faz 0 tamamlandığında ekle.)_

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
