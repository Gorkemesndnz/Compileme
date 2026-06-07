import React from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Folder } from 'lucide-react'

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projeler" 
        subtitle="Proje fazları, teknoloji dökümanları ve kod parçacıkları."
      />
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Folder className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Proje Listesi Boş</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Faz 5 kapsamında projeler modülü aktif edildiğinde burada projelerinizi yönetebileceksiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
