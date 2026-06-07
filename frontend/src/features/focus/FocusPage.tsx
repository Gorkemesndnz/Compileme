import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sun } from 'lucide-react'

export const FocusPage: React.FC = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-8 md:p-12 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black select-none">
      {/* Decorative background grid/glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/60 border border-border/50 px-4 py-2 rounded-lg transition-all text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Odaktan Çık
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 px-3 py-1.5 rounded-full border border-border/30">
          <Sun className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          Hava Durumu: İstanbul 22°C (Açık)
        </div>
      </div>

      {/* Center Clock */}
      <div className="flex flex-col items-center justify-center text-center z-10 py-12">
        <div className="text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_0_80px_rgba(0,255,255,0.15)] select-all font-mono">
          {formatTime(time)}
        </div>
        <div className="text-muted-foreground font-semibold text-lg md:text-xl mt-4 tracking-wide">
          {formatDate(time)}
        </div>
      </div>

      {/* Bottom widgets / Agenda placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full z-10">
        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-sm text-primary tracking-wider uppercase">Günün Ajandası</h3>
          <div className="text-muted-foreground text-sm flex items-center justify-center py-4 border border-dashed border-border/50 rounded-lg">
            Bugün için planlanmış bir ajanda öğesi bulunmuyor.
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-sm text-primary tracking-wider uppercase">Odak Durumu</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Aktif Oturum:</span>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Hazır
            </span>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Karanlık mod odak ekranı, siz kod yazarken veya çalışırken ortam ışığını optimize etmek için tasarlanmıştır.
          </div>
        </div>
      </div>
    </div>
  )
}
