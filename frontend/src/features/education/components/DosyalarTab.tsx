import React from 'react'
import { CheckCircle2, Code2, ExternalLink, FileText, RefreshCw, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getFileIcon } from './studioHelpers'
import { EducationResource, FolderData } from '../types'

interface DosyalarTabProps {
  folders: FolderData[]
  resources: EducationResource[]
  selectedResourceId: number | null | undefined
  completedResources: Record<number, boolean>
  saveCompletedResources: (completed: Record<number, boolean>) => void
  handleRenameResource: (resId: number) => void
  handleDeleteResource: (resId: number) => void
  handleOpenNotesForResource: (res: EducationResource) => void
  handleOpenCodeForResource: (res: EducationResource) => void
  triggerReplaceFile: (resId: number) => void
  setActiveReinforceResourceId: (resId: number | null) => void
}

const DosyalarTabComponent: React.FC<DosyalarTabProps> = ({
  folders,
  resources,
  selectedResourceId,
  completedResources,
  saveCompletedResources,
  handleRenameResource,
  handleDeleteResource,
  handleOpenNotesForResource,
  handleOpenCodeForResource,
  triggerReplaceFile,
  setActiveReinforceResourceId,
}) => {
  const selectedResource = selectedResourceId
    ? resources.find((resource) => resource.id === selectedResourceId)
    : undefined
  const selectedFolder = selectedResource
    ? folders.find((folder) => folder.resourceIds.includes(selectedResource.id))
    : undefined

  if (!selectedResource) {
    return (
      <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-xs font-bold text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-300">
        Soldan bir dosya veya link seçin.
      </div>
    )
  }

  const isCompleted = !!completedResources[selectedResource.id]

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/65 p-5 shadow-md backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/25">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500">
              {getFileIcon(selectedResource.name, selectedResource.type)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                {selectedFolder ? selectedFolder.name : 'Klasörsüz kaynak'}
              </p>
              <h3 className="mt-1 truncate text-base font-black text-slate-900 dark:text-white">
                {selectedResource.name}
              </h3>
              <p className="mt-1 break-all font-mono text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                {selectedResource.url_or_path}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-[10px] font-black uppercase text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                  {selectedResource.type}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Tamamlandı
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button
              type="button"
              onClick={() => window.open(selectedResource.url_or_path, '_blank')}
              variant="primary"
              size="sm"
              className="font-bold"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              <span>Aç</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                const updated = { ...completedResources, [selectedResource.id]: !isCompleted }
                saveCompletedResources(updated)
              }}
              variant="secondary"
              size="sm"
              className="font-bold"
            >
              {isCompleted ? 'Geri Al' : 'Tamamlandı'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Button type="button" onClick={() => handleOpenNotesForResource(selectedResource)} variant="secondary" className="h-12 justify-start font-bold">
          <FileText className="mr-2 h-4 w-4 text-cyan-500" />
          <span>Notları Aç</span>
        </Button>
        <Button type="button" onClick={() => handleOpenCodeForResource(selectedResource)} variant="secondary" className="h-12 justify-start font-bold">
          <Code2 className="mr-2 h-4 w-4 text-cyan-500" />
          <span>Kod Alanı</span>
        </Button>
        <Button type="button" onClick={() => setActiveReinforceResourceId(selectedResource.id)} variant="secondary" className="h-12 justify-start font-bold">
          <Zap className="mr-2 h-4 w-4 text-cyan-500" />
          <span>Pekiştirmeler</span>
        </Button>
        <Button type="button" onClick={() => triggerReplaceFile(selectedResource.id)} variant="secondary" className="h-12 justify-start font-bold">
          <RefreshCw className="mr-2 h-4 w-4 text-cyan-500" />
          <span>Değiştir</span>
        </Button>
        <Button type="button" onClick={() => handleRenameResource(selectedResource.id)} variant="secondary" className="h-12 justify-start font-bold">
          <FileText className="mr-2 h-4 w-4 text-cyan-500" />
          <span>Yeniden Adlandır</span>
        </Button>
        <Button type="button" onClick={() => handleDeleteResource(selectedResource.id)} variant="dangerGhost" className="h-12 justify-start font-bold">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Sil</span>
        </Button>
      </div>
    </div>
  )
}

export const DosyalarTab = React.memo(DosyalarTabComponent)
