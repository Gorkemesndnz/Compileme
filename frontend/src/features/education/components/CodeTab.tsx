import React from 'react'
import { Braces, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { buildLineNumbers } from './studioHelpers'
import { CodeFile, EducationPractice, EducationResource, FolderData, ReinforcementTask } from '../types'

interface CodeTabProps {
  selectedPractice: EducationPractice | undefined
  activeFile: CodeFile
  codeDraft: string | null
  setCodeDraft: (val: string | null) => void
  activeFileName: string
  handleSaveCodeDirectly: () => void
  isCodeDirty: boolean
  folders: FolderData[]
  resources: EducationResource[]
  reinforcements: Record<string, ReinforcementTask[]>
}

const CodeTabComponent: React.FC<CodeTabProps> = ({
  selectedPractice,
  activeFile,
  codeDraft,
  setCodeDraft,
  activeFileName,
  handleSaveCodeDirectly,
  isCodeDirty,
  folders,
  resources,
  reinforcements,
}) => {
  const activeResource = selectedPractice?.resource_id
    ? resources.find((resource) => resource.id === selectedPractice.resource_id)
    : undefined
  const activeFolder = activeResource
    ? folders.find((folder) => folder.resourceIds.includes(activeResource.id))
    : undefined
  const activeContextTargetId = activeResource ? `resource:${activeResource.id}` : ''
  const activeTasks = activeContextTargetId ? (reinforcements[activeContextTargetId] || []) : []
  const currentTaskMatch = activeTasks.find((task) => task.codeFileName === activeFileName)
  const breadcrumb = [
    activeFolder?.name,
    activeResource?.name,
    currentTaskMatch?.title || activeFileName,
  ].filter(Boolean).join(' / ')
  const lineNumbers = buildLineNumbers(codeDraft ?? activeFile.content)

  if (!selectedPractice || !activeResource) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/55 p-8 text-center text-xs font-bold text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-300">
        Lütfen sol döküman ağacından bir pekiştirme veya kod dosyası seçin.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[500px] min-w-0 flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/25">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Kod bağlamı
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
          <Braces className="h-4 w-4 shrink-0 text-cyan-500" />
          <span className="min-w-0 truncate">{breadcrumb}</span>
        </div>
      </div>

      <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden rounded-2xl border border-cyan-500/10 bg-slate-950 shadow-lg dark:bg-black/45">
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/30 px-4 dark:border-zinc-800 dark:bg-zinc-900/10">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-black text-cyan-500 dark:text-cyan-400">
              {activeFile.name}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {isCodeDirty ? 'Kaydedilmemiş değişiklikler var' : 'Kaydedildi'}
            </span>
            <Button
              type="button"
              onClick={handleSaveCodeDirectly}
              variant="secondary"
              size="sm"
              className={cn(
                'h-8 text-[10px] font-black uppercase',
                isCodeDirty
                  ? 'border-emerald-600 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-600'
                  : 'cursor-default text-slate-500 dark:text-zinc-400'
              )}
              disabled={!isCodeDirty}
            >
              <Save className="mr-1.5 h-3 w-3" />
              <span>Kaydet</span>
            </Button>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-1 overflow-hidden">
          <div className="w-10 select-none border-r border-slate-200 bg-slate-100/5 py-4 pr-2 text-right font-mono text-[10px] leading-6 text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-950/20">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>

          <textarea
            data-code-editor="true"
            value={codeDraft ?? activeFile.content}
            onChange={(event) => setCodeDraft(event.target.value)}
            spellCheck={false}
            className="h-full min-h-[300px] w-full resize-none bg-transparent px-4 py-4 font-mono text-xs leading-6 text-cyan-50/90 outline-none placeholder:text-zinc-700 focus:ring-1 focus:ring-cyan-500/20"
            placeholder="// Kodlerinizi buraya yazın..."
          />
        </div>
      </div>
    </div>
  )
}

export const CodeTab = React.memo(CodeTabComponent)
