import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useHealth } from '../../api/health'
import { PageHeader } from '../../components/PageHeader'
import { ShieldCheck, ShieldAlert, Cpu, Database, Activity, Terminal } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useHealth()

  useEffect(() => {
    if (error) {
      toast.error('API Bağlantı Hatası: Sunucuya erişilemiyor!', {
        id: 'api-error-toast',
      })
    } else if (data?.status === 'UP') {
      toast.success('Sistem Aktif: API bağlantısı başarıyla kuruldu.', {
        id: 'api-success-toast',
      })
    }
  }, [data, error])

  const isApiConnected = !isLoading && !error && data?.status === 'UP'

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Anasayfa" 
        subtitle="Günlük hedefler, projeler ve genel durum özeti."
        action={
          <div className="flex items-center gap-4">
            <button
              onClick={() => toast.info('Test Bildirimi: Arayüz bildirim sistemi çalışıyor!')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              Bildirim Test Et
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sistem Durumu:</span>
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                  Kontrol ediliyor...
                </span>
              ) : isApiConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  API bağlantısı çalışıyor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  API bağlantısı çalışmıyor
                </span>
              )}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Günlük Görevler</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Bugün yapılması planlanan 0 görev var.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">0%</span>
            <span className="text-xs text-muted-foreground">tamamlandı</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Aktif Projeler</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Şu anda geliştirme aşamasında 0 aktif proje var.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">0</span>
            <span className="text-xs text-muted-foreground">proje aktif</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Eğitim İlerlemesi</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Aktif olarak devam eden 0 eğitim kaynağı var.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">0%</span>
            <span className="text-xs text-muted-foreground">ortalama ilerleme</span>
          </div>
        </div>
      </div>
    </div>
  )
}
