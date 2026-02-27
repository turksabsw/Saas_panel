# TradeHub Catalog — B2B Marketplace Ürün Yönetim Arayüzü

> Frappe/ERPNext tabanlı TR TradeHub B2B marketplace platformu için geliştirilmiş, tek dosyalık (Single-File) ürün katalog yönetim arayüzü.

![Vue.js](https://img.shields.io/badge/Vue.js-3.3-4FC08D?logo=vue.js&logoColor=white)
![Flowbite](https://img.shields.io/badge/Flowbite-2.2-1C64F2?logo=tailwindcss&logoColor=white)
![Lucide Icons](https://img.shields.io/badge/Icons-Lucide_SVG-f59e0b)
![Single File](https://img.shields.io/badge/Deploy-Single_HTML-7c3aed)
![Size](https://img.shields.io/badge/Size-~230KB-10b981)

---

## Özellikler

### Genel
- **Tek dosya deploy** — Tüm CSS, JS, şema ve bileşenler tek HTML dosyasında (~230KB)
- **Dark / Light mode** — Anlık tema geçişi, localStorage ile kalıcılık
- **Responsive layout** — Flexbox tabanlı sidebar push mimarisi
- **52 DocType şeması** — 24 standalone + 28 child table, gerçek Frappe JSON'larından sıkıştırılmış
- **Türkçe arayüz** — 60+ section label çevirisi, tüm UI metinleri Türkçe

### Navigasyon
- **Icon Rail** — 10 modül (Ana Sayfa, Satış, Ürünler, Müşteri, Finans, Lojistik, Pazarlama, Analiz, Mesajlar, Ayarlar) + büyük ikonlar ve alt etiketler
- **Collapsible Sidebar** — 8 kategorize grup, 26 DocType bağlantısı, smooth geçiş animasyonları
- **Breadcrumb** — Dinamik güncellenen breadcrumb: Ana Sayfa > TradeHub Catalog > DocType > Kayıt

### Görünüm Modları
| Mod | Açıklama |
|-----|----------|
| **Liste** | Tablo görünümü — checkbox seçim, sıralama, durum filtresi, pagination |
| **Grid** | Kart tabanlı görünüm — responsive grid, hover efektleri |
| **Kanban** | 3 sütunlu board — Taslak (amber), Aktif (yeşil), İptal (kırmızı) |
| **Medya Grid** | Medya doctype'larında otomatik aktif — thumbnail preview, mimetype ikonları (görsel, video, PDF, ses, doküman) |

### Form / Detay Görünümü
- **Şema tabanlı render** — 20+ Frappe field type desteği (Data, Select, Check, Table, Attach, Attach Image, Text Editor, Code, Color, Date, Int, Float, Currency, Percent, Rating, Link, Long Text, Small Text, Tab Break, Section Break, Column Break)
- **Tab desteği** — PIM Product gibi çok tablı DocType'lar için tab navigation
- **Collapsible section'lar** — Açılır/kapanır bölümler, animasyonlu
- **Child table** — Satır ekleme/silme, inline düzenleme
- **Dosya yükleme** — Drag & drop + click, base64 encoding, image preview, dosya boyutu gösterimi, 25MB limit
- **Renk seçici** — Color field type için native color picker + hex input

### CRUD İşlemleri
- **Oluşturma** — Otomatik ID ve isim üretimi (prefix + sıra numarası)
- **Kaydetme** — Zorunlu alan validasyonu, localStorage cache
- **Silme** — Modal overlay ile onay popup'ı (blur backdrop, animasyonlu)
- **Listeleme** — Mock data + cache'den yükleme, arama, filtreleme, sıralama

### Veri Katmanı
- **localStorage cache** — `th_[DocType]` formatında kalıcı depolama
- **Mock data generator** — Her DocType için random kayıtlar (20-35 arası)
- **Dosya metadata** — Upload edilen dosyaların adı ve boyutu cache'de saklanır

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Vue.js 3.3 (Composition API, CDN) |
| UI Kit | Flowbite 2.2 (CSS only) |
| İkonlar | Lucide-style inline SVG |
| Font | DM Sans (UI) + JetBrains Mono (code/data) |
| Tema | CSS Custom Properties (28+ değişken) |
| Depolama | localStorage (client-side) |
| Build | Yok — tek dosya, build gerektirmez |

---

## DocType Şemaları

### Standalone (24)

| Grup | DocType'lar |
|------|-------------|
| Ürün Listelemeleri | PIM Product, PIM Product Variant, Media Asset |
| Stok Birimi (SKU) | Product, Product Variant, Brand Gating |
| Katalog Yapısı | Product Category, Category, Brand, Product Class, Product Family |
| Özellik Yönetimi | Product Attribute, Product Attribute Value, Product Attribute Group, Attribute Set, Attribute |
| PIM Yönetimi | PIM Attribute, PIM Attribute Group |
| Puan & Sıralama | Ranking Weight Config, Filter Config |
| Satış Kanalı | Sales Channel |
| Medya & SEO | Media Library, SEO Meta, Category Display Schema |

### Child Table (28)

Attribute Value, Attribute Set Item, Attribute Label Override, Brand Gating, Channel Field Mapping, Completeness Rule, Family Attribute, Family Default Value, PIM Attribute Option, PIM Product Attribute Value, PIM Product Category Link, PIM Product Class Field Value, PIM Product Description, PIM Product Media, PIM Product Price, PIM Product Relation, PIM Variant Axis Value, PIM Variant Media, Product Class Allowed Status, Product Class Attribute Group, Product Class Display Field, Product Class Field, Product Class Role Permission, Product Class Search Config, Product Pricing Tier, Required Image Angle, Translatable Attribute Flag, Variant Axis, Virtual Category Rule

---

## Dosya Yapısı

```
tradehub-catalog.html          # Tek dosya — tüm uygulama
├── <style>                     # CSS (~4KB sıkıştırılmış)
│   ├── CSS Variables           # Dark/Light tema değişkenleri
│   ├── Icon Rail               # Sol navigasyon çubuğu
│   ├── Sidebar                 # Collapsible sidebar
│   ├── Topbar                  # Üst toolbar
│   ├── Data Table              # Liste görünümü
│   ├── Kanban Board            # Kanban sütunları
│   ├── Media Grid              # Medya thumbnail kartları
│   ├── Form                    # Detay/form bileşenleri
│   ├── Modal                   # Silme onay popup
│   └── Toast                   # Bildirim mesajları
├── <body>                      # Vue.js template
│   ├── Icon Rail               # 10 modül + tema toggle + profil
│   ├── Sidebar                 # 8 grup, 26 link
│   ├── Main Content
│   │   ├── Topbar + Breadcrumb
│   │   ├── List View (table/grid/kanban/media)
│   │   ├── Detail View (form)
│   │   └── Empty State
│   ├── Delete Modal
│   └── Toast Notifications
└── <script>                    # Vue.js application
    ├── State (refs, reactives)
    ├── Schemas (52 DocType JSON)
    ├── Computed Properties
    ├── CRUD Functions
    ├── File Upload Handlers
    ├── Theme Toggle
    └── Sidebar/Navigation Logic
```

---

## Kullanım

### Hızlı Başlangıç
```bash
# Dosyayı tarayıcıda aç
open tradehub-catalog.html        # macOS
xdg-open tradehub-catalog.html    # Linux
start tradehub-catalog.html       # Windows
```

Build, sunucu veya bağımlılık gerektirmez. CDN üzerinden Vue.js ve Flowbite yüklenir.

### Tema Değiştirme
Sol icon rail'ın alt kısmındaki ☀️/🌙 butonuna tıkla. Tercih localStorage'da saklanır.

### Görünüm Değiştirme
Liste başlığının sağ üstündeki grid/list/kanban butonlarını kullan. Medya doctype'larında (Medya Varlıkları, Medya Kütüphanesi, Listeleme Görseli) grid modu otomatik olarak medya kartlarına dönüşür.

### Kayıt İşlemleri
- **Yeni kayıt:** "Yeni Ekle" butonuna tıkla
- **Düzenleme:** Listeden bir kayda tıkla → form açılır → değiştir → "Kaydet"
- **Silme:** Detay sayfasında "Sil" → onay popup'ında "Evet, Sil"
- **Dosya yükleme:** Attach/Attach Image alanına tıkla veya dosyayı sürükle-bırak

---

## CSS Tema Değişkenleri

```css
/* Dark Mode (varsayılan) */
:root {
  --rl: 72px;            /* Icon rail genişliği */
  --sw: 220px;           /* Sidebar genişliği */
  --th: 48px;            /* Topbar yüksekliği */
  --p:  #7c3aed;         /* Primary (violet) */
  --pl: #a78bfa;         /* Primary light */
  --s:  #0f0f14;         /* Surface */
  --sr: #16161d;         /* Surface raised */
  --so: #1e1e28;         /* Surface overlay */
  --b:  #2a2a38;         /* Border */
  --bs: #222230;         /* Border subtle */
  --t:  #e8e8f0;         /* Text */
  --tm: #8888a0;         /* Text muted */
  --td: #5c5c74;         /* Text dim */
  --ao: #f59e0b;         /* Accent orange */
  --ag: #10b981;         /* Accent green */
  --ar: #ef4444;         /* Accent red */
  --ab: #3b82f6;         /* Accent blue */
}

/* Light Mode */
html.light {
  --s:  #f5f5f7;
  --sr: #ffffff;
  --so: #eeeef2;
  --t:  #1a1a2e;
  --tm: #5c5c74;
  --td: #8888a0;
  /* ... */
}
```

---

## Modül Haritası (Icon Rail)

| # | Modül | İkon | Durum |
|---|-------|------|-------|
| 1 | Ana Sayfa | 🏠 Home | Empty state |
| 2 | Satış | 🛒 Cart | Empty state |
| 3 | **Ürünler** | 📦 Package | **Aktif — Catalog UI** |
| 4 | Müşteri | 👤 User | Empty state |
| 5 | Finans | 💰 Dollar | Empty state |
| 6 | Lojistik | 🚛 Truck | Empty state |
| 7 | Pazarlama | 📈 Activity | Empty state |
| 8 | Analiz | 📊 BarChart | Empty state |
| 9 | Mesajlar | 💬 Message | Empty state |
| 10 | Ayarlar | ⚙️ Settings | Empty state |

---

## Sidebar Grupları

| Grup | Renk | Link Sayısı |
|------|------|-------------|
| ÜRÜN LİSTELEMELERİ | 🔴 `#ef4444` | 4 |
| STOK BİRİMİ (SKU) | 🟡 `#f59e0b` | 3 |
| KATALOG YAPISI | 🟣 `#7c3aed` | 5 |
| ÖZELLİK YÖNETİMİ | 🟣 `#8b5cf6` | 4 |
| PIM YÖNETİMİ | 🔵 `#3b82f6` | 4 |
| PUAN & SIRALAMA | 🟠 `#f97316` | 2 |
| SATIŞ KANALI | 🔵 `#06b6d4` | 1 |
| MEDYA & SEO | 🩷 `#ec4899` | 3 |
| **Toplam** | | **26** |

---

## Geliştirme Notları

### Mimari Kararlar
- **Tek dosya yaklaşımı:** Frappe workspace'e embed edilebilirlik için tercih edildi. Tüm şemalar sıkıştırılarak (~85% oranında) HTML içine gömüldü.
- **localStorage:** Sunucu bağlantısı olmadan CRUD demo'su için. Gerçek implementasyonda Frappe API'ye bağlanacak.
- **CSS Variables:** Tek kaynak tema yönetimi — dark/light geçişi sadece CSS variable'ları override eder.
- **Inline SVG:** Network bağımlılığını azaltmak için Lucide/Tabler ikonları inline SVG olarak embed edildi.

### Bilinen Sınırlamalar
- Sunucu bağlantısı yok — tüm veriler client-side (localStorage)
- Dosya upload'ları base64 olarak saklanır — büyük dosyalarda localStorage limiti aşılabilir
- Bazı Frappe field dependency'leri (`depends_on`) henüz evaluate edilmiyor
- Sorting sadece mock data sıralamasını etkiler

### Gelecek Planlar
- [ ] Frappe API entegrasyonu (REST/WebSocket)
- [ ] Gerçek dosya upload (S3/MinIO)
- [ ] Field dependency evaluation
- [ ] Bulk actions (toplu silme/düzenleme)
- [ ] Export (CSV/Excel)
- [ ] Drag & drop kanban status değiştirme
- [ ] Gelişmiş filtreleme (çoklu alan, tarih aralığı)
- [ ] Keyboard shortcuts

---

## Geliştirme Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| v1.0 | 27.02.2026 | İlk sürüm — sidebar, liste, grid, detay form |
| v1.1 | 27.02.2026 | 8 standalone + 7 child table şema entegrasyonu |
| v1.2 | 27.02.2026 | 15 PIM şeması, Tab Break desteği |
| v1.3 | 27.02.2026 | Toplam 52 DocType, 206KB single-file |
| v1.4 | 27.02.2026 | Sidebar layout fix (flex push mimarisi) |
| v1.5 | 27.02.2026 | CRUD + localStorage cache |
| v1.6 | 27.02.2026 | Dropdown fix + dosya yükleme |
| **v2.0** | **27.02.2026** | **Icon rail büyütme + etiketler, Dark/Light mode, Kanban view, Medya grid + mimetype, Silme onay modal** |

---

## Lisans

TradeHub B2B Marketplace Platform — Dahili kullanım. Tüm hakları saklıdır.

---

<p align="center">
  <strong>TradeHub Catalog</strong> · B2B Marketplace Ürün Yönetimi<br>
  <sub>Vue.js 3 · Flowbite · Lucide SVG · Single-File Architecture</sub>
</p>