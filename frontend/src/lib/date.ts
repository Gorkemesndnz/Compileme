/**
 * Türkçe yerelleştirilmiş tarih ve saat yardımcı fonksiyonları.
 */

/**
 * Tarih nesnesini veya tarih dizgisini Türkçe formatta döner.
 * Örnek girdi: Date veya "2026-06-07"
 * Örnek çıktı: "7 Haziran 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Tarih nesnesini veya tarih dizgisini Türkçe saat formatında döner (HH:MM).
 * Örnek girdi: Date veya "14:30:00"
 * Örnek çıktı: "14:30"
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  if (typeof date === 'string' && date.includes(':')) {
    // Sadece "14:30:00" gibi saat verildiyse ilk iki parçayı al
    const parts = date.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  }
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Bugünü YYYY-MM-DD formatında döner (örn: "2026-06-07").
 */
export function today(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Belirli bir tarihe n gün ekleyip YYYY-MM-DD formatında döner.
 * Örnek: addDays("2026-06-07", 1) -> "2026-06-08" (Yarına aktar)
 */
export function addDays(date: Date | string, n: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  d.setDate(d.getDate() + n)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
