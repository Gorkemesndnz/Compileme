import React from 'react'
import { Save, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { buildLineNumbers, getTargetLabel } from './studioHelpers'
import { FolderData, EducationResource, EducationPractice, ReinforcementTarget, ReinforcementTask, CodeFile } from '../types'

interface CodeTabProps {
  selectedPractice: EducationPractice | undefined
  codeFiles: CodeFile[]
  activeFile: CodeFile
  codeDraft: string | null
  setCodeDraft: (val: string | null) => void
  activeFileName: string
  handleFileTabChange: (fileName: string) => void
  handleSaveCodeDirectly: () => void
  isCodeDirty: boolean
  folders: FolderData[]
  resources: EducationResource[]
  reinforcementTargets: ReinforcementTarget[]
  reinforcements: Record<string, ReinforcementTask[]>
  selectedFolderIdForDropdown: string
  handleDropdown1Change: (val: string) => void
  handleDropdown2Change: (val: string) => void
  handleDropdown3Change: (val: string) => void
}

export const CodeTab: React.FC<CodeTabProps> = ({
  selectedPractice,
  codeFiles,
  activeFile,
  codeDraft,
  setCodeDraft,
  activeFileName,
  handleFileTabChange,
  handleSaveCodeDirectly,
  isCodeDirty,
  folders,
  resources,
  reinforcementTargets,
  reinforcements,
  selectedFolderIdForDropdown,
  handleDropdown1Change,
  handleDropdown2Change,
  handleDropdown3Change,
}) => {
  const activeContextTargetId = selectedPractice?.resource_id
    ? `resource:${selectedPractice.resource_id}`
    : ''

  const activeTasks = activeContextTargetId
    ? (reinforcements[activeContextTargetId] || [])
    : []

  const currentTaskMatch = activeTasks.find((t) => t.codeFileName === activeFileName)
  const activeDropdown2Value = currentTaskMatch ? currentTaskMatch.id : 'direct'

  const folderResourceIds = new Set(folders.flatMap((f) => f.resourceIds))
  const uncategorizedResources = resources.filter((r) => !folderResourceIds.has(r.id))

  // Determine the options for Dropdown 2 (Files) based on selected folder
  const filteredFiles = React.useMemo(() => {
    if (!selectedFolderIdForDropdown) return []

    if (selectedFolderIdForDropdown === 'project-documents') {
      return reinforcementTargets.filter(t => t.type === 'project-document')
    }

    if (selectedFolderIdForDropdown === 'uncategorized') {
      return reinforcementTargets.filter(t => {
        if (t.type === 'resource') {
          return !folderResourceIds.has(t.resource.id)
        }
        return false
      })
    }

    const folder = folders.find(f => f.id === selectedFolderIdForDropdown)
    if (!folder) return []

    return reinforcementTargets.filter(t => {
      if (t.type === 'resource') {
        return folder.resourceIds.includes(t.resource.id)
      }
      return false
    })
  }, [selectedFolderIdForDropdown, folders, reinforcementTargets, folderResourceIds])

  const lineNumbers = buildLineNumbers(codeDraft ?? activeFile.content)

  const codeContextPanel = (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/25 backdrop-blur-xl p-3 shadow-md">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            Kod baglami
          </p>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Yazdiginiz kodu dosya, dokuman veya pekistirme ile iliskilendirin.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row w-full md:w-auto">
          {/* Dropdown 1: Klasör Seçimi */}
          <select
            value={selectedFolderIdForDropdown}
            onChange={(e) => handleDropdown1Change(e.target.value)}
            className="h-10 w-full sm:w-[180px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-black/30 px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500/50"
          >
            <option value="" className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
              Klasör Seç...
            </option>
            {folders.map((f) => (
              <option key={f.id} value={f.id} className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
                {f.name}
              </option>
            ))}
            {uncategorizedResources.length > 0 && (
              <option value="uncategorized" className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
                Klasörsüz Dosyalar
              </option>
            )}
            {reinforcementTargets.some(t => t.type === 'project-document') && (
              <option value="project-documents" className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
                Proje Dökümanları
              </option>
            )}
          </select>

          {/* Dropdown 2: Dosya Seçimi */}
          <select
            value={activeContextTargetId}
            disabled={!selectedFolderIdForDropdown}
            onChange={(e) => handleDropdown2Change(e.target.value)}
            className={cn(
              "h-10 w-full sm:w-[220px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-black/30 px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500/50",
              !selectedFolderIdForDropdown && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="" className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
              Dosya/Döküman Seç...
            </option>
            {filteredFiles.map((target) => (
              <option
                key={target.id}
                value={target.id}
                className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold"
              >
                {getTargetLabel(target)}
              </option>
            ))}
          </select>

          {/* Dropdown 3: Pekiştirme / Görev Seçimi */}
          <select
            value={activeDropdown2Value}
            disabled={!activeContextTargetId}
            onChange={(e) => handleDropdown3Change(e.target.value)}
            className={cn(
              "h-10 w-full sm:w-[200px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-black/30 px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500/50",
              !activeContextTargetId && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="direct" className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold">
              Genel Pratik / Notlar
            </option>
            {activeTasks.map((task) => (
              <option
                key={task.id}
                value={task.id}
                className="text-slate-905 bg-white dark:text-white dark:bg-zinc-900 font-bold"
              >
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  if (!selectedPractice) {
    return (
      <div className="space-y-3">
        {codeContextPanel}
        <div className="text-center py-12 text-xs font-bold text-slate-900 dark:text-zinc-350">
          Lütfen önce sol döküman listesinden bir pratik odası seçin.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 h-full flex flex-col min-h-[500px]">
      {codeContextPanel}

      {/* Editor Panel */}
      <div className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-950 dark:bg-black/45 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden relative border-cyan-500/10">
        {/* Editor Header / File Tabs */}
        <div className="h-12 border-b border-slate-200 dark:border-zinc-850 bg-slate-100/30 dark:bg-zinc-900/10 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {codeFiles.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => handleFileTabChange(file.name)}
                className={cn(
                  'px-3 py-1.5 rounded-t-lg text-xs font-mono font-bold transition-all relative cursor-pointer',
                  activeFile.name === file.name
                    ? 'bg-slate-900 text-cyan-400 font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                )}
              >
                {file.name}
                {activeFile.name === file.name && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              {isCodeDirty ? 'Kaydedilmemiş Değişiklikler Var' : 'Kaydedildi'}
            </span>
            <Button
              type="button"
              onClick={handleSaveCodeDirectly}
              variant="glass"
              size="sm"
              className={cn(
                "h-8 text-[10px] font-black uppercase rounded-lg transition-all",
                isCodeDirty
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"
                  : "bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/50 cursor-default"
              )}
              disabled={!isCodeDirty}
            >
              <Save className="h-3 w-3 mr-1.5" />
              <span>Kaydet</span>
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden min-h-[300px]">
          {/* Gutter / Line Numbers */}
          <div className="w-10 bg-slate-100/5 dark:bg-zinc-950/20 border-r border-slate-200 dark:border-zinc-850/50 py-4 select-none text-right pr-2 text-[10px] font-mono text-zinc-550 leading-6">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>

          {/* Code Input */}
          <textarea
            value={codeDraft ?? activeFile.content}
            onChange={(e) => setCodeDraft(e.target.value)}
            spellCheck={false}
            className="w-full h-full min-h-[300px] resize-none bg-transparent py-4 px-4 font-mono text-xs leading-6 text-cyan-50/90 outline-none placeholder:text-zinc-750 focus:ring-1 focus:ring-cyan-500/20"
            placeholder="// Kodlerinizi buraya yazin..."
          />
        </div>
      </div>
    </div>
  )
}
