import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useIdeas } from '../../api/ideas'
import { IdeaCard } from './IdeaCard'
import { IdeaComposer } from './IdeaComposer'

export const IdeasHub: React.FC = () => {
  const navigate = useNavigate()
  const { data: ideas = [], isLoading } = useIdeas()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fikir Havuzu" subtitle="Fikirler yukleniyor." />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Fikir Havuzu"
          subtitle="Startup, proje, urun ve yaratıcı fikirlerini yakala; zamanla gelistir."
        />
        <div className="flex min-h-[58vh] items-center justify-center">
          <div className="w-full space-y-5">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Ilk fikrini yakala</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">Baslik dusunmeden yaz; sistem fikri takip edilebilir hale getirecek.</p>
              </div>
            </div>
            <IdeaComposer onCreated={(idea) => navigate(`/ideas/${idea.id}`)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fikir Havuzu"
        subtitle="Ham fikirlerden proje adaylarina uzanan gelisim panosu."
      />
      <IdeaComposer compact onCreated={(idea) => navigate(`/ideas/${idea.id}`)} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  )
}
