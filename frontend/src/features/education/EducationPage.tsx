import React from 'react'
import { PageHeader } from '../../components/PageHeader'
import { GraduationCap } from 'lucide-react'

export const EducationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Eğitimler" 
        subtitle="Eğitim kaynakları, mini projeler ve notlar."
      />
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Eğitim Kaynakları Boş</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Faz 7 kapsamında eğitimler modülü aktif edildiğinde burada eğitimlerinizi takip edebileceksiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
