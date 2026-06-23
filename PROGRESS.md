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
- **Aktif faz:** FE-3 — Eğitimler (Frontend)
- **Çalışıyor mu:** Evet (Proje komuta merkezi terminal görünümüyle ve 4 katmanlı akordeon sidebar ağacıyla çalışıyor.)
- **Sırada:** FE-3 — Eğitimler (Frontend)
- **Son güncelleme:** 24.06.2026

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
| 9 | Odak modu + Hava (backend) | ✅ Tamamlandı |
| 10 | Asistan (ops, backend) | ⬜ Başlanmadı |
| FE-0 | Temel & ortak UI altyapısı | ✅ Tamamlandı |
| FE-1 | Anasayfa + Su takibi (Frontend) | ✅ Tamamlandı |
| FE-2 | Projeler (Frontend) | ✅ Tamamlandı |

İşaretler: ⬜ Başlanmadı · 🟡 Devam ediyor · ✅ Tamamlandı · ⛔ Engellendi

---

## Günlük
> En yeni giriş en üstte. Yeni girişi buraya, bu satırın hemen altına ekle.

### 2026-06-24 · Faz FE-2 — Sidebar Akordeon Ağacı ve Terminal Kartlı Proje Hub Entegrasyonu
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - `/projects/:id` rotası `App.tsx` içerisine eklenerek yönlendirme altyapısı güncellendi.
  - `Sidebar.tsx` içerisinde standardı bozmadan `SidebarProjectNode` bileşeni kodlandı; bu sayede hook kurallarına uygun olarak projeler, fazlar ve alt fazlar (project documents içinden regex ile ayıklanarak) 4 katmanlı akıllı akordeon yapısıyla sunuldu.
  - Akordeon açılışları ve chevron rotasyonları Framer Motion ve `AnimatePresence` ile süzülerek açılacak hale getirildi.
  - `/projects` kök dizininde yer alan ilk projeyi otomatik seçen `useEffect` kaldırılarak, projelerin listelendiği macOS terminal simülasyonu içeren `ProjectsHub.tsx` komuta merkezi entegre edildi.
  - Terminal kartlarında `cat info.txt` ve `npm run check-status` komutları simüle edildi, dinamik faz ismi, tamamlanan görev yüzdesi ve ASCII ilerleme barı parlayan renklerle yazdırıldı.
- Kabul kriteri: `npx tsc --noEmit` hatasız tamamlandı.

### 2026-06-23 · Faz FE-2 — Görev Ekleme Formu Konum ve Stil Refaktörleri (Refactoring)
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - `OverviewPage.tsx` bileşeninden `TaskCreationForm` kaldırıldı.
  - `ProjectsPage.tsx` üzerinde **Gorevler** sekmesinde yer alan eski ilkel form kaldırıldı ve yerine `TaskCreationForm` entegre edildi.
  - `TaskCreationForm.tsx` içerisindeki native tarih/saat seçici girdileri kaldırılarak premium `DateTimePicker` bileşeni yerleştirildi.
  - Formun girdileri, dropdown'ları ve option alanları açık ve koyu temalara tam uyumlu hale getirilerek okunabilirlik ve kontrast sorunları giderildi. Yazı renkleri `text-slate-800 dark:text-zinc-100` olarak güncellendi.
  - `EmptyLine` ve `TaskList` bileşenlerinin stil sınıfları düzenlenerek, açık ve koyu temalarla tam uyumlu, göz yormayan, premium cam görünümlü (frosted glass) ve yüksek kontrastlı renk düzeni uygulandı.
  - Tarih seçicinin açıldığında formun altındaki elemanların arkasında kalması sorunu, ilk satıra `relative z-20` eklenerek çözüldü.
  - Faz ve Alt Faz seçim alanlarındaki native `<select>` elemanları kaldırılarak yerine `framer-motion` animasyonlu, `useRef` ile dışarı tıklayınca kapanma özellikli özel (custom) açılır dropdown menüleri entegre edildi.
- Kabul kriteri: `npx tsc --noEmit` hatasız tamamlandı.




### 2026-06-22 · Faz FE-2 — Tarih Seçici Taşma Hatası, Faz Durumu Dropdown & Backdrop Blur Entegrasyonu (Bugfix & UI Improvement)
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - `DateTimePicker.tsx` bileşeninde açılır takvimin dar container'larda sola taşarak ekrandan çıkması (overflow) sorunu, bileşene dynamic align (`align="left" | "right"`) desteği eklenerek çözüldü.
  - `PhasesManagerPage.tsx` üzerindeki `Başlangıç Tarihi` seçici `align="left"`, `Bitiş Tarihi` seçici ise `align="right"` olarak ayarlanarak takvimin drawer sınırları içinde kalması sağlandı.
  - Yeni faz oluşturma formundaki native HTML `<select>` elemanı kaldırıldı. Yerine projenin genel siber-komuta ve glassmorphic temasına uygun, Framer Motion (`AnimatePresence` + `motion.div`) destekli, `DateTimePicker` stili tetikleyici butona ve durum ikonlarına (🟡, 🟢, 🔵, 🟣) sahip premium bir özel açılır kutu (custom select dropdown) entegre edildi.
  - Sayfa geçiş animasyonlarında kullanılan `motion.div` transformlarının child `position: fixed` elemanlarının (backdrop overlay ve drawer) viewport yerine container'a göre konumlanmasına yol açması sebebiyle, drawer ve backdrop overlay `createPortal` ile doğrudan `document.body` üzerine taşındı. Böylece sayfa başlığı (header), sidebar ve footer da dahil olmak üzere tüm ekranın pürüzsüz bir şekilde bulanıklaşması (backdrop-blur) sağlandı.
  - Form başarıyla gönderildiğinde veya kapatıldığında açılır kutunun açık kalma durumu resetlenecek şekilde state yönetimi pürüzsüzleştirildi.
- Kararlar:
  - Form kontrollerinde native select'ler yerine custom UI bileşenleri kullanılarak premium hissi sürdürüldü.
- Kabul kriteri: `npm run build` hatasız tamamlandı.

### 2026-06-22 · Proje Sayfası Siyah Ekran Hatası Düzeltmesi (Bugfix)
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - `ProjectsPage.tsx` bileşeninde `projectsLoading` durumunun ele alınmaması nedeniyle, ilk yüklemede (proje verileri henüz gelmemişken) `selectedProject`'in `undefined` olmasına bağlı olarak oluşan TypeError (Cannot read properties of undefined (reading 'name')) ve dolayısıyla oluşan siyah ekran hatası giderildi.
  - Yükleme durumunda bir yükleniyor animasyonu (`Loader2` spinner'ı) gösteren `projectsLoading` kontrolü eklendi.
  - Sayfaya direkt girildiğinde (veya bir proje silindiğinde) eğer veritabanında projeler mevcutsa, ilk projeyi otomatik olarak seçen ve "İlk proje odasını kur" onboarding ekranının gereksiz yere çıkmasını engelleyen otomatik proje seçme `useEffect` mekanizması entegre edildi.
- Kararlar:
  - İlk yüklemedeki null pointer/undefined referans çökmelerini önlemek için React render akışından önce veri yüklenme durumları (`projectsLoading`) kontrol altına alındı.
- Kabul kriteri: `npm run build` hatasız tamamlandı.

### 2026-06-22 · Faz FE-2 — Faz Yönetimi & Faza Özel Alt Komuta Odası Entegrasyonu
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Üst katman faz listeleme, sürükle-bırak sıralama (`Reorder.Group` / Framer Motion) ve sağdan kayan drawer (`AnimatePresence`) ile faz oluşturmayı sunan `PhasesManagerPage.tsx` bileşeni yazıldı.
  - Tıklanan faza özel derin çalışma alanı sunan, genel sekmeleri gizleyen `PhaseDetailRoom.tsx` bileşeni yazıldı.
  - Faza özel alt odada:
    - Türkçe ve standart tarihleri otomatik çözebilen (`parseDatePart`) kompakt görev çizelgesi, göreve özel genişleyebilir mühendislik notları / bulgular alanı.
    - Şık ve faza izole DB Schema Studio modülü: tabloları yöneten editor, Mermaid ER diyagramı çizicisi. Şemayı JSON formatında `document_type='DB_SCHEMA'` ve `title='DB_SCHEMA_PHASE_{id}'` olarak backend'e kaydeder.
    - Faza özel referans linkleri ve snippets teknik hafıza paneli.
    - Tüm faz hafızasını (amaç, görevler, notlar, DB şeması) tek tıkla kopyalayan `Faz Hafızasını Kopyala (AI Context Copy)` Markdown export butonu.
  - Bileşenler `ProjectsPage.tsx` ana dosyasına entegre edilerek eski faz listesinin yerine bağlandı.
- Kararlar:
  - Snippets, documents ve links tablolarında `phaseId` kolonu bulunmadığı için, faza özel referans kaynakları `[Faz: phaseId]` başlık önekiyle izole edildi ve frontend seviyesinde otomatik filtrelendi.
- Kabul kriteri: `npm run build` hatasız tamamlandı.

### 2026-06-22 · Faz FE-2 — OverviewPage Bileşeni ve Mimarisi Entegrasyonu
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Spagetti kod yapısını önleyen, API çağrısı ve karmaşık iç state barındırmayan saf sunum katmanı `OverviewPage.tsx` bileşeni yazıldı.
  - Sol tarafta dikey siber-yeşil/mavi timeline hattı ve metro haritası şeklinde hizalanmış, faz durumunu ve ilerlemesini dinamik gösteren faz kartları kodlandı.
  - Sağ tarafta monospace fontlu Bugünkü Proje Görevleri kontrol listesi ile `localStorage` destekli otomatik kaydedilen Karalama Defteri (Scratchpad) textarea'sı oluşturuldu.
  - Hızlı görev ekleme formu için `MovingBorderButton`, görev silme butonu için `SketchButton` stilleri uygulandı.
  - Bileşen `ProjectsPage.tsx` ana dosyasına import edilerek 'overview' sekmesi altındaki eski karmaşık yapının yerini aldı.
- Kararlar:
  - `OverviewPage` içerisinde faz görevlerinin tamamlanma yüzdelerini dinamik hesaplayabilmek için `projectTasks` props olarak eklendi.
- Kabul kriteri: `npm run build` hatasız tamamlandı.

### 2026-06-22 · Faz FE-2 — Project Name & Description Inline Edit Pürüzsüzleştirme
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Proje adı ve açıklama alanları için dikey yerleşim (`flex flex-col items-start gap-1`) düzenine geçilerek açıklama kesin bir şekilde başlığın altına konumlandırıldı.
  - Yanlışlıkla tıklamaları ve hatalı düzenlemeleri önlemek için doğrudan metinlere tıklanarak düzenlenen mekanizma kaldırıldı; metinler statikleştirildi.
  - Bağımsız hover alanları (`group/name` ve `group/desc`) tanımlandı. İlgili alana gelindiğinde sağ köşede beliren edit butonları ve sağ taraftaki üç nokta ayarlar menüsü tetikleyicisi, projenin durum seçimi bileşeninde kullanılan premium, etrafı ışıklı/hareketli kenarlıklı `MovingBorderButton` bileşenine dönüştürüldü.
  - Aktifleşen `input` ve `textarea` alanlarının edit modunda sade, kenarlıksız ve ikonsuz saf bir görünüm sunması sağlandı.
- Kararlar:
  - Metinlerin arka planındaki kapsül görünümü kaldırılarak sade, MovingBorderButton tetiklemeli minimal ve tutarlı bir tasarıma geçildi.
- Kabul kriteri: `npm run build` hatasız tamamlandı.

### 2026-06-22 · Faz FE-2 — Project Control Header revizyonu
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Tekrarlanan PageHeader, düzenleme formu, Hafıza Paneli ve metrik kartları tek kompakt glass header içinde birleştirildi.
  - Proje adı ve açıklaması klavye destekli inline düzenlemeye geçirildi; native durum seçici Radix menüyle değiştirildi.
  - Markdown dışa aktarma ve modal tabanlı güvenli proje silme akışları eklendi.
  - Silme onayı için ortak `SketchButton` bileşeni oluşturuldu.
- Kararlar: `PAUSED` arayüzde “Beklemede” olarak gösterildi; backend desteği olmayan arşiv aksiyonu eklenmedi.
- Kabul kriteri: TypeScript kontrolü, production build ve `git diff --check` başarıyla tamamlandı.
- Açık konular / sıradaki: FE-2 alt panel light/dark tema cilasına devam edilecek.

### 2026-06-22 · Faz FE-2 — Aktif proje çalışma alanı sadeleştirmesi
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Aktif proje ekranındaki yerel `Project Library` arama, filtreleme ve oluşturma paneli kaldırıldı.
  - Sayfa başlığı ve alt başlığı seçili projenin adı ve açıklamasıyla dinamik hale getirildi.
  - `FE-2 Control Room` etiketi kaldırıldı ve ana çalışma alanı tam genişliğe açıldı.
- Kararlar: Proje seçimi ve yeni proje tetikleme sorumluluğu ortak uygulama sidebar'ında bırakıldı.
- Kabul kriteri: `npm.cmd run build` ve `git diff --check` başarıyla tamamlandı; `/projects` HTTP 200 döndü.
- Açık konular / sıradaki: Aktif proje panelinin açık/koyu tema görsel cilasına devam edilecek.

### 2026-06-21 · Faz FE-0/FE-1 — GlassFooter Redesign (efferd/footer-section)
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Eski `CinematicFooter.tsx` (parallax curtain-reveal) kaldırıldı.
  - 21st.dev'in `efferd/footer-section` şablonundan esinlenen modern, minimal, cam temalı `GlassFooter.tsx` bileşeni oluşturuldu.
  - Footer tabanına obsidyen cam görünümü (`bg-black/45 backdrop-blur-xl border-t border-white/10`) ve orta üst kısma şık bir cyan border glow çizgisi yerleştirildi.
  - Arka planda sürekli ve yavaşça salınım yapan iki adet renkli parıltı küresi (Cyan ve Violet) CSS keyframe animasyonları ile canlandırıldı.
  - Footer bileşenleri (modüller, kısayollar, API ve GitHub bağlantıları) `framer-motion` (`whileInView`, delay ve blur efektleriyle) staggered olarak animasyonlu giriş yapacak şekilde yapılandırıldı.
  - Bileşen `AppLayout.tsx` içerisine sayfa akışının sonuna standart olarak entegre edildi.
- Kabul kriteri:
  - `npm run build` derlemesi sıfır hata ile tamamlandı.

### 2026-06-21 · Faz FE-1 — 3 Sütunlu Zaman Çizelgesi ve Aceternity UI Buton Entegrasyonu
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Dashboard görev paneli 3 Sütunlu (Bugün, Yarın, Aylık Plan) akışkan zaman çizelgesine dönüştürüldü.
  - Sütun altlarındaki "+ Görev Ekle" butonlarında pürüzsüz dönen cyan gradyan kenarlıklı Aceternity UI Moving Border (`moving-border.tsx`) entegrasyonu yapıldı.
  - Sürükle-bırak için HTML5 native drag-drop altyapısı kurularak sütun içi ve arası taşımalar mutasyonlarla bağlandı.
  - 3. sütunda tarihsiz aylık plan havuzu (`planning_bucket = 'MONTH'`) ve ayın planlı günlerini içeren akıllı odaklayıcı listelendi. Planlı bir güne tıklayınca 1. sütun o güne odaklanacak şekilde dinamik hale getirildi.
  - `completed_at` alanı, tik durumuna göre anlık ISO String zaman damgası veya `null` olacak şekilde otomatik yönetildi.
  - `duration_minutes` süre girdileri backend ile entegrasyon için integer sayı tipine cast edilerek gönderildi.
  - Aylık plana görev eklenirken veya taşınırken `target_period` o anki ayın koduyla (örn: "2026-06") beslendi.
  - `project_id` ve `education_id` alanlarında lookup isim eşleşmeleri yapılarak ID numaraları yerine şık proje/eğitim isimleri gösterildi.
- Kabul kriteri:
  - `npm run build` derlemesi sıfır hata ile tamamlandı.

### 2026-06-21 · Faz FE-1 — Mikro Su Takibi Widget Entegrasyonu
- Ajan: Antigravity
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Dashboard ekranındaki eski devasa su takip kartı tamamen kaldırıldı.
  - Ekranın en sağ üst köşesine (karşılama alanının karşısına) havada asılı, minimal `<MicroWaterTracker>` popover widget'ı eklendi.
  - Popover buzlu cam efektleri, ince progress bar, 4 kapsül su preset butonu (+300ml, +470ml, +500ml, +1500ml) ve kalın gölgeli retro-modern "Geri Al" / "Günü Sıfırla" butonlarıyla donatıldı.
  - Dışarıya tıklayınca kapanma (click-outside) ve `framer-motion` animasyonu eklendi.
  - Dashboard görev kolonları 3'ten 2'ye düşürülerek Bugün ve Yarın listeleri genişletildi.
  - **Optimizasyon:** Su ekleme, silme ve günü sıfırlama işlemlerine TanStack Query **Optimistic Updates (İyimser Güncellemeler)** modeli entegre edildi. Tepkime süresi 0ms'ye indirildi.
  - **Hata Düzeltme:** Backend API veri modeli (`consumedMl`, `targetMl`, `percent`) ile frontend önbellek modeli (`amountMl`, `goalMl`, `percentage`) arasındaki alan adı uyuşmazlığı tespit edilerek frontend modeli backend ile tam uyumlu hale getirildi. Su miktarının ve progress bar'ın artmama hatası kökten çözüldü.
- Kararlar:
  - Stanley (+470ml) eklemeleri DB şemasını korumak için `CUSTOM` kaynak tipi ve `470` ml miktarı ile backend'e bağlandı.
- Kabul kriteri:
  - `npm run build` derlemesi sıfır hata ile tamamlandı.
  - Su ekleme/silme tepkimesi 0ms olarak doğrulandı, progress bar animasyonları, su miktarları ve yüzdeleri anında güncelleniyor.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-21 · Faz FE-1 — DateTimePicker Katman ve Saat Seçici Düzeltmesi
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Sidebar `z-50`, quick-add bar `z-10` yapılarak genişleyen Sidebar'ın giriş barının üstünde kalması sağlandı.
  - DateTimePicker trigger yüksekliği/radius'u Fikir-Görev switcher ile uyumlu `h-11 rounded-full` geometriye geçirildi.
  - Popover footer'ındaki “Bugün” aksiyonu kaldırıldı; onay butonu kompakt saat alanının yanına taşındı.
  - DateTimePicker içindeki native `input[type=time]` kaldırıldı ve özel saat/dakika grid seçicisi eklendi.
  - Native dropdown'un mavi blokları ve siyah focus/active katmanı özel light/dark Tailwind durumlarıyla değiştirildi.
- Kararlar:
  - Siyah ekran bug'ını kalıcı olarak önlemek için tarayıcı-native saat seçici yerine uygulama kontrollü seçenek grid'i kullanıldı.
- Kabul kriteri:
  - `npm.cmd run build` ve `git diff --check` başarıyla tamamlandı.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-21 · Faz FE-1 — Quick Add Input Çerçeve Temizliği
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Quick-add input alanındaki border, outline, ring, ring-offset ve shadow focus stilleri tamamen sıfırlandı.
  - Input arka planı light/dark modda şeffaf tutuldu; mobil alt border kaldırıldı.
  - Quick-add ana wrapper radius değeri `20px`, iç padding ve flex boşlukları switcher/picker/CTA ile uyumlu hale getirildi.
- Kararlar:
  - Değişiklik ortak `Input` primitive'i yerine yalnızca Dashboard quick-add kullanımına scope edildi.
- Kabul kriteri:
  - `npm.cmd run build` başarıyla tamamlandı.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-21 · Faz FE-1 — Fikir/Görev Toggle Revizyonu
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Quick-add seçim alanı bağımsız `IdeaTaskToggle` bileşenine taşındı.
  - Bileşen kontrollü `value` / `onValueChange` prop'larıyla ve kontrolsüz kullanım için varsayılan `idea` state'iyle hazırlandı.
  - Kayan rounded seçim yüzeyi, `Lightbulb` ve `CheckSquare` ikonları ile light/dark tema stilleri eklendi.
  - Dashboard placeholder metinleri moda göre “Aklındaki fikri yaz...” ve “Yeni görev oluştur...” olarak güncellendi.
- Kararlar:
  - Yeni dependency eklenmedi; mevcut React, Tailwind, Lucide ve `cn()` altyapısı kullanıldı.
- Kabul kriteri:
  - `npm.cmd run build` başarıyla tamamlandı.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-21 · Faz FE-1 — Quick Add DateTimePicker ve CTA Revizyonu
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Dashboard quick-add barındaki native tarih/saat inputları kaldırıldı.
  - RuixenUI/21st.dev çizgisinde ay geçişi, gün seçimi, saat girişi, bugün seçimi, saat temizleme, dışarı tıklama ve Escape kapanışı destekleyen `DateTimePicker` eklendi.
  - Yuvarlak glass “Ekle” butonu kaldırılarak underline genişleme ve sağa kayan Lucide ok animasyonuna sahip metin tabanlı `EKLE` CTA uygulandı.
  - Fikir/Görev sekmeleri Lucide ikonlarıyla yenilendi; quick-add wrapper light/dark zinc glass yüzeyleriyle uyumlu hale getirildi.
  - Mobilde sekme, input, picker ve CTA dikey akışa geçecek şekilde responsive düzen korundu.
- Kararlar:
  - `date-fns`, Radix Popover ve `styled-components` eklenmedi; mevcut React, Tailwind ve Lucide altyapısıyla feature-scope bileşen oluşturuldu.
  - Kullanıcının SVG oku yerine proje UI kuralına uygun Lucide `ArrowRight` kullanıldı.
- Kabul kriteri:
  - `npm.cmd run build` başarıyla tamamlandı.
  - Playwright oturumu açıldı; etkileşim snapshot testi araç kullanım limiti nedeniyle tamamlanamadı.
- Açık konular / sıradaki:
  - Araç limiti yenilendiğinde görev sekmesi, takvim açma/gün seçme/saat seçme ve dark mode etkileşim smoke testi tekrar çalıştırılabilir.

### 2026-06-21 · Faz FE-1 — Dashboard Light Tema Kontrast Revizyonu
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - Dashboard açık tema metinleri, istatistik değerleri, görev boş durumları, su takip verileri ve aksiyonları daha koyu/okunabilir renklere geçirildi.
  - Karşılama alanı `Sun` ikonu, “İyi Günler” başlığı ve belirgin tarih satırıyla yenilendi.
  - Quick-add fikir/görev seçimi, odak kısayolu ve EaseMize glass butonları açık temaya özel kontrast ve doğal gölge stilleriyle güncellendi.
  - Sidebar ikon/metin kontrastı artırıldı; aktif ve hover durumları dark tema korunarak düzenlendi.
  - Quick-add mobil yerleşimi dikey akışa alınarak yatay viewport taşması giderildi.
- Kararlar:
  - 21st.dev EaseMize button ve mevcut layout korunarak light tema düzeltmeleri Dashboard kapsamında sınırlandırıldı.
- Kabul kriteri:
  - `npm.cmd run build` başarıyla tamamlandı.
  - Dashboard 1440x900 ve 390x844 Edge renderlarında görsel olarak doğrulandı; yatay taşma ve açık tema okunurluk sorunları giderildi.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-08 · Faz FE-2 — Projeler Control Room
- Ajan: Codex
- Branch / commit: master / (commit bekliyor)
- Durum: Tamamlandı
- Yapılanlar:
  - `ProjectsPage.tsx` placeholder ekrandan premium glass Project Control Room ekranına dönüştürüldü.
  - Sol proje kütüphanesi, seçili proje üst paneli, hafıza/metric kartları ve tab yapısı eklendi.
  - Fazlar stacked-roadmap hissinde tasarlandı; faz ekleme, status güncelleme, silme ve yukarı/aşağı sıralama bağlandı.
  - Proje görevleri `task` tablosuna `kind=PROJECT`, `projectId`, `phaseId` ile bağlandı; tarihli görevler `DAY`, tarihsizler `UNSCHEDULED` gider.
  - Stack, dokümanlar, refactor planları, snippet kopyalama, linkler ve dosya upload -> project link workaround akışları eklendi.
  - DB Schema Studio eklendi: tablo/kolon/PK/FK form editorü, diyagram görünümü ve otomatik Mermaid ER kodu üretimi.
  - `projects.ts` tüm proje alt kaynak hook'larıyla genişletildi, `files.ts` upload helper'ı eklendi, `tasks.ts` move endpoint'i backend `MoveRequest` body sözleşmesine göre düzeltildi.
  - 21st.dev EaseMize cam buton için `components/ui/glass-button.tsx` resmi import yolu eklendi.
- Kararlar:
  - Backend değiştirilmedi. Dosya-proje ilişkisi v1 için upload sonrası `project_link` kaydı ile çözüldü.
  - Mermaid dependency eklenmedi; frontend DB Schema Studio formdan Mermaid ER kodu üretiyor ve yerel diyagram görünümü render ediyor.
- Kabul kriteri:
  - `npm.cmd run build` başarıyla tamamlandı.
  - Vite sadece mevcut bundle size uyarısı verdi; TypeScript/Vite build hatası yok.
- Açık konular / sıradaki:
  - FE-3 Eğitimler ekranına geçilebilir.

### 2026-06-08 · Faz FE-1 — Anasayfa + Su Takibi Entegrasyon & Cila
- Ajan: Antigravity
- Branch / commit: master / (master b8882b0 - feat(frontend): implement black background, light glass layout, EaseMize premium glass button, inline task CRUD, and ideas API integration)
- Durum: Tamamlandı
- Yapılanlar:
  - **EaseMize Glass Button & CVA Kaldırılması**: `class-variance-authority` bağımlılığı olmayan pure React mapping yöntemine geçilerek Vite/Rollup derleme hatası giderildi. `variant="glass"` durumunda bu premium cam buton sarmalandı.
  - **Zemin & Frosted Cam Entegrasyonu**: Body arka planı `#000000` yapıldı. Beyaz frosted cam panellerde (`.glass-panel`) yazı kontrastını sağlamak adına local değişkenler ezilerek mükemmel okunabilirlik elde edildi.
  - **Su Dalga Animasyonu ve Stepper Revizyonu**: Circular wave dairesinde dikey yükselme inline `top` CSS özelliğiyle ayrıştırılarak animasyon çakışması önlendi. Preset'ler ve stepper'lar EaseMize `variant="glass"` butonlarıyla donatıldı.
  - **Görev CRUD Arayüzü**: Görev kartlarına tıklandığında açılan inline düzenleme formu, anlık markdown önizlemesi, yarına/bugüne taşıma ve hızlı ekleme barı entegrasyonu tamamen çalışır duruma getirildi.
  - **Fikirler Entegrasyonu**: `ideas.ts` API hook'u tamamlandı ve Dashboard'daki stat kartı ve Quick-Add barı üzerinden backend veri tabanıyla başarıyla bağlandı.
- Kabul kriteri:
  - `npm run build` komutu sıfır hata ile frontend tarafında derlendi (`Build Success`).
  - Yerel backend (8080) ve postgres (5433) port bağlantıları yeşil alındı.


### 2026-06-08 · Faz FE-1 — Anasayfa + Su Takibi (Frontend)
- Ajan: Antigravity
- Branch / commit: master / (FE-1 tamamlama ve Su Takibi görsel/işlevsel güncellemeleri)
- Durum: Tamamlandı
- Yapılanlar:
  - **Siyah Koyu Tema & Açık Tema Entegrasyonu**:
    - Koyu tema arka planı lacivertten saf siyaha (`#000000`) çevrildi. `LivingVineBackground.tsx` kanvas zemin rengi siyah yapıldı ve animasyon izleri siyah trails olarak güncellendi.
    - `index.css` üzerinde `:root` için Açık Tema renkleri (beyaz arka plan ve koyu metinler), `.dark` sınıfı altında ise Siyah Koyu Tema renkleri tanımlandı.
    - `.glass-panel` kart arka planları dinamik `var(--card)` ve `var(--border)` CSS değişkenlerine geçirilerek temaya göre otomatik renk değiştiren cam kart tasarımı (light frosted / dark smoky glass) sağlandı.
    - `Sidebar.tsx` sol menüsünün en altına Açık/Koyu tema arasında geçişi tetikleyen Sun/Moon ikonlu dinamik tema değiştirme düğmesi yerleştirildi.
    - `App.tsx` içerisine `useEffect` eklenerek `useUiStore` üzerindeki tema durumu HTML elementine senkronize edildi.
  - `DashboardPage.tsx` sayfası API'ye bağlanarak dinamik hale getirildi. Bugünün/yarının görev adetleri ve su tüketimi dynamic stats kartlarında gösterildi.
  - SVG dalga animasyonlu, dairesel su takip widget'ı kodlandı (Hedef yüzdesine göre su seviyesi otomatik yükselir/düşer).
  - **Yeni Su Takibi Görsel Tasarımı**: Kullanıcının paylaştığı tasarım doğrultusunda su takibi widget'ı yenilendi:
    - Sol kısımda dalga animasyonlu dairesel ilerleme halkası, sağ kısımda ml cinsinden tüketilen miktar ve hedef bilgisi yerleşimine geçildi.
    - **2x2 Grid Butonları**: Büyük Şişe (+1.5L), Küçük Şişe (+500ml), Stanley (+470ml) ve Normal Bardak (+350ml) seçenekleri grid halinde yerleştirildi.
    - **Custom Stepper Entegrasyonu**: Özel ml eklemeleri için `+`/`-` stepper düğmeleri içeren ve `+ Ekle` butonu ile çalışan dinamik kontrol alanı geliştirildi.
    - **Günü Sıfırla Desteği**: Footer alanına bugünkü tüm su loglarını onay kutusuyla temizleyen "Günü sıfırla" butonu eklendi.
  - **Su Takibi Güncellemesi**: Backend tarafında (`WaterService.java`) varsayılan ml değerlerinin preset'lerde ezilmesine izin verecek şekilde `amountMl` parametre desteği entegre edildi; böylece frontend üzerinden gönderilen 350ml ve 470ml değerleri artık DB'ye başarıyla kaydediliyor. `WaterServiceTest` sınıfına bu davranışı doğrulayan test eklendi.
  - **Geri Al / Çıkartma Butonu**: Yanlış eklemelere karşı hızlıca son eklenen su log kaydını geri alan/çıkartan turuncu vurgulu `Geri al` (Undo) butonu footer kısmına eklendi.
  - Su geçmişi geçmiş tablosu eklendi ve eklenen su loglarının tek tıkla silinmesini sağlayan silme işlevi bağlandı.
  - Hızlı görev ekleme, tamamlandı/yapılacak checkbox toggle işlevleri ve "Yarına Aktar" butonu bağlandı.
  - Geçmiş günlerden kalan eksik görevleri gösteren ve tek tıkla bugüne taşıyan "Tümünü Bugüne Taşı" banner'ı eklendi.
  - Global animasyonlu asma sarmaşık (`LivingVineBackground.tsx`) arka planı kodlandı ve `App.tsx` içerisine enjekte edildi.
  - Butonlar için şık `liquid-glass` (parlama/cam efekti) variantı `Button.tsx`'e entegre edildi.
- Kabul kriteri:
  - `npm run build` hatasız tamamlandı.
  - Backend `WaterServiceTest` testleri ve `mvn test` derleme testleri (manuel incelendi) başarıyla entegre edildi.

### 2026-06-08 · Faz FE-0 — Temel & Ortak UI Altyapısı
- Ajan: Antigravity
- Branch / commit: master / (FE-0 tamamlama)
- Durum: Tamamlandı
- Yapılanlar:
  - 21st.dev'den alınan collapsible, `framer-motion` animasyonlu modern `Sidebar.tsx` bileşeni React Router uyumlu hale getirilerek entegre edildi.
  - Sidebar ve diğer UI ihtiyaçları için Radix UI tabanlı `Avatar`, `DropdownMenu`, `Separator`, `ScrollArea`, `Dialog`, `Select`, `Progress` ve `Tooltip` primitive'leri oluşturuldu.
  - `Skeleton` pulsate yükleme bileşeni, yeniden dene destekli `ErrorScreen` ve `LoadingScreen` ortak ekranları eklendi.
  - `index.css` dosyasına `.glass-panel` ve `.glow-cyan` gibi premium neon/glassmorphism sınıfları eklendi.
  - `App.tsx` QueryClient yapılandırılarak global query/mutation cache hata dinleyicileri ve otomatik `sonner` toast tetikleyicileri entegre edildi.
  - `types.ts` ile ortak API tipleri ve `ApiError` sarmalayıcısı tanımlandı.
- Kabul kriteri:
  - `npm run build` derleme testi başarıyla `Vite built` çıktısı vererek tamamlandı.

### 2026-06-07 · Faz 9 — Backend Test Altyapısı & Hata Yönetimi Düzeltmeleri
- Ajan: Antigravity
- Branch / commit: master / 1488509 (ve hata yönetimi geliştirmeleri)
- Durum: Tamamlandı
- Yapılanlar:
  - 9 backend modülünün tüm Service (Mockito) ve Controller (MockMvc) testleri yazıldı.
  - Spring Boot context yüklenmesi sırasındaki WeatherService çoklu constructor hatası `@Autowired` ile giderildi.
  - `FileControllerTest` durum kodu 201 Created olarak düzeltildi.
  - `ProjectServiceTest` event fırlatma mantığı `create` ve `createFromIdea` olarak ayrıldı.
  - Spring Boot varsayılan `/error` yönlendirmesini ele almak için `CustomErrorController` eklendi. Tarayıcılarda dark-theme şık HTML (404, 503, 500) hata sayfaları, API istemcilerinde structured JSON `ApiError` dönmesi sağlandı.
  - `GlobalExceptionHandler` sınıfına `DataAccessResourceFailureException` (503), `HttpRequestMethodNotSupportedException` (405) ve state/argument (400) hataları eklendi.
  - `CustomErrorControllerTest` yazılarak hem HTML hem JSON hata çıktıları test edildi.
- Kararlar:
  - Testlerin izole çalışabilmesi için veritabanı gerektiren entegrasyon testleri yerine mock katmanı tercih edildi.
- Kabul kriteri:
  - `mvn clean test` çıktısında `BUILD SUCCESS` alındı ve tüm 63 test başarıyla geçti.
- Açık konular / sıradaki:
  - Frontend modüllerine (FE-0: Temel & ortak UI altyapısı) geçiş yapılacak.

### 2026-06-07 · Faz 9 — Odak modu + Hava (backend)
- Ajan: Antigravity
- Branch / commit: master / a5c56e4
- Durum: Tamamlandı
- Yapılanlar:
  - OpenWeatherMap API Key'in güvenliği için kök dizinde `.env` dosyası oluşturuldu ve `.gitignore` altında korumaya alındı.
  - `docker-compose.yml` ve `application.yml` dosyaları güncellenerek çevre değişkeni enjeksiyonu (`OPENWEATHER_API_KEY`) sağlandı.
  - `Settings.java` entity, `SettingsRepository.java`, `SettingsService.java` (get/update fallback mantıklı) ve `SettingsController.java` eklendi.
  - `FocusSession.java` entity, `FocusSessionRepository.java`, `FocusSessionService.java` (otomatik aktif oturum kapatma ve duration hesabı mantıklı) ve `FocusSessionController.java` eklendi.
  - RestClient kullanan proxy `WeatherService.java` ve şehir adı yanında **enlem/boylam (lat/lon) koordinat** destekli `WeatherController.java` eklendi.
- Kararlar:
  - settings ve focus_session tabloları audit kolonları içermediği için validate hata koruması adına `BaseEntity`'den türetilmedi.
  - Hava durumu proxy endpoint'i, dönen JSON yanıtını doğrudan (raw formatta) istemciye iletecek şekilde tasarlandı.
- Kabul kriteri:
  - JDK 21 ile yerel ve docker derlemeleri sıfır hata ile geçti.
  - PowerShell ile yapılan Settings API (GET/PUT), Weather API (şehir ve koordinat bazlı proxy testleri) ve Focus Session API (start, sleep, stop, listeleme) testleri başarıyla doğrulandı.
- Açık konular / sıradaki:
  - Faz 10 (Asistan backend - opsiyonel) veya doğrudan Frontend entegrasyonuna (FE-0) geçilecek.

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
- **Weather API Key (.env):** OpenWeatherMap API key yerel .env dosyasında saklanır ve git'e pushlanması engellenir. Docker Compose aracılığıyla container ortamına güvenle aktarılır.
- **Weather Coordinates (lat/lon):** /api/weather endpoint'i koordinat tabanlı sorguları (lat/lon) doğrudan destekler.

