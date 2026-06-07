import React from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Calendar } from 'lucide-react'

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Takvim" 
        subtitle="Günlük, haftalık ve aylık görev planlamaları."
      />
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Takvim Boş</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Faz 8 kapsamında takvim modülü aktif edildiğinde burada görevlerinizi tarih bazında planlayabileceksiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
