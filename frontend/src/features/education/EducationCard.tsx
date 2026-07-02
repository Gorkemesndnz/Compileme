import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Calendar, Check, ChevronRight, Pause, Play, Plus, Tv, Youtube, Trash2, Code2, Globe, FileText, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Education, EducationStatus, EducationType } from './types'
import { useDeleteEducation } from '@/api/education'
import { toast } from 'sonner'

export interface EducationCardProps {
  education: Education
}

const statusIcon: Record<EducationStatus, React.ReactNode> = {
  ACTIVE: <Play className="h-4 w-4 stroke-cyan-500" />,
  PAUSED: <Pause className="h-4 w-4 stroke-amber-500" />,
  DONE: <Check className="h-4 w-4 stroke-emerald-500" />,
}

const getCategoryIcon = (type: EducationType) => {
  switch (type) {
    case 'PROGRAMMING':
      return <Code2 className="h-5 w-5 text-cyan-500" />
    case 'LANGUAGE':
      return <Globe className="h-5 w-5 text-amber-500" />
    case 'FRONTEND':
      return <FileText className="h-5 w-5 text-indigo-500" />
    case 'MOBILE':
      return <Smartphone className="h-5 w-5 text-emerald-500" />
    case 'OTHER':
    default:
      return <BookOpen className="h-5 w-5 text-purple-500" />
  }
}

const EducationCardComponent: React.FC<EducationCardProps> = ({ education }) => {
  const navigate = useNavigate()
  const deleteMutation = useDeleteEducation()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`"${education.title}" eğitimini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(education.id, {
        onSuccess: () => {
          toast.success('Eğitim başarıyla silindi.')
        },
        onError: () => {
          toast.error('Eğitim silinirken bir hata oluştu.')
        }
      })
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/education/${education.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(`/education/${education.id}`)
        }
      }}
      className="group h-[300px] w-full max-w-[290px] cursor-pointer [perspective:1000px]"
      aria-label={`${education.title} studyosuna gir`}
    >
      <div className="relative h-full rounded-[50px] border border-slate-300 bg-gradient-to-br from-slate-100/80 to-slate-200/90 shadow-2xl transition-all duration-500 ease-in-out [transform-style:preserve-3d] group-hover:[box-shadow:rgba(15,23,42,0.24)_30px_50px_25px_-40px,rgba(15,23,42,0.12)_0px_25px_30px_0px] group-hover:[transform:rotate3d(1,1,0,30deg)] dark:border-white/5 dark:from-zinc-900 dark:to-black">
        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-5 left-5 z-30 p-2 rounded-full bg-slate-900/10 hover:bg-red-500/20 text-slate-500 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 [transform:translate3d(0,0,35px)] dark:bg-white/5 cursor-pointer"
          title="Eğitimi Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <div className="absolute inset-2 rounded-[55px] border-b border-l border-slate-300 bg-gradient-to-b from-white/45 to-white/15 backdrop-blur-sm [transform:translate3d(0,0,25px)] [transform-style:preserve-3d] dark:border-white/20 dark:from-white/30 dark:to-white/10" />

        <div className="absolute inset-0 [transform:translate3d(0,0,26px)]">
          <div className="px-7 pt-[70px]">
            <span className="block truncate text-xl font-black text-slate-950 dark:text-white">
              {education.title}
            </span>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-300 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"
                  style={{ width: `${education.progress_percent}%` } as any}
                />
              </div>
              <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
                %{education.progress_percent}
              </span>
            </div>
            <span className="mt-3 block line-clamp-2 text-[13px] font-medium text-slate-700 dark:text-zinc-300">
              {education.description || `Kaynak: ${education.source}`}
            </span>
            {education.description && (
              <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                Kaynak: {education.source}
              </span>
            )}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between [transform:translate3d(0,0,26px)] [transform-style:preserve-3d]">
          <div className="flex gap-2 [transform-style:preserve-3d]">
            <div className="flex h-[32px] items-center rounded-full bg-white px-3.5 font-mono text-[11px] font-bold text-slate-800 shadow-md transition-all duration-300 group-hover:[transform:translate3d(0,0,30px)] dark:bg-zinc-800 dark:text-zinc-300">
              <Calendar className="mr-1.5 h-3.5 w-3.5 stroke-slate-600 dark:stroke-slate-400" />
              {education.next_study_date || 'Plan Yok'}
            </div>
          </div>

          <div className="flex items-center justify-end transition-all duration-200 ease-in-out hover:[transform:translate3d(0,0,10px)]">
            <span className="text-xs font-bold text-slate-950 dark:text-white">Eğitime Gir</span>
            <ChevronRight className="h-4 w-4 stroke-slate-950 dark:stroke-white" strokeWidth={3} />
          </div>
        </div>

        <div className="absolute right-0 top-0 [transform-style:preserve-3d]">
          {[
            { size: '150px', pos: '6px', z: '20px', delay: '0s' },
            { size: '120px', pos: '8px', z: '40px', delay: '0.2s' },
            { size: '95px', pos: '12px', z: '60px', delay: '0.4s' },
          ].map((circle) => (
            <div
              key={`${circle.size}-${circle.z}`}
              className="absolute aspect-square rounded-full bg-slate-900/5 shadow-sm transition-all duration-500 ease-in-out dark:bg-white/5"
              style={{
                width: circle.size,
                top: circle.pos,
                right: circle.pos,
                transform: `translate3d(0, 0, ${circle.z})`,
                transitionDelay: circle.delay,
              } as any}
            />
          ))}
          <div
            className="absolute grid aspect-square w-[45px] place-content-center rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out [transform:translate3d(0,0,80px)] [transition-delay:0.6s] group-hover:[transform:translate3d(0,0,100px)] dark:bg-zinc-800"
            style={{ top: '20px', right: '20px' } as any}
          >
            {getCategoryIcon(education.type)}
          </div>
        </div>
      </div>
    </div>
  )
}

export const EducationCard = React.memo(EducationCardComponent)

export const AddEducationCard: React.FC<{ categoryLabel: string; onClick: () => void }> = ({ categoryLabel, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[300px] w-full max-w-[290px] flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-slate-300 bg-white/55 text-slate-900 shadow-md backdrop-blur-2xl transition-all hover:border-cyan-500/50 hover:bg-white/75 hover:shadow-[0_0_28px_rgba(6,182,212,0.14)]',
        'dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-cyan-300/40 dark:hover:bg-white/[0.07]'
      )}
    >
      <span className="grid h-12 w-12 place-content-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-sm font-bold">{categoryLabel} egitimi ekle</span>
      <span className="max-w-[210px] text-center text-xs font-medium text-slate-600 dark:text-slate-400">
        Yeni kaynak, PDF veya calisma plani icin hizli baslangic.
      </span>
    </button>
  )
}
