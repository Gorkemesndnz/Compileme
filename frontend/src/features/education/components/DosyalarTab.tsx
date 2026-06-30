import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, FolderPlus, UploadCloud, Folder, Pencil, Trash2, ChevronRight, FileText, Code2, RefreshCw, Zap, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { getFileIcon } from './studioHelpers'
import { FolderData, EducationResource } from '../types'
import { toast } from 'sonner'

interface DosyalarTabProps {
  folders: FolderData[]
  resources: EducationResource[]
  foldersOpen: Record<string, boolean>
  toggleFolderState: (folderId: string) => void
  completedResources: Record<number, boolean>
  saveCompletedResources: (completed: Record<number, boolean>) => void
  handleRenameFolder: (folderId: string) => void
  handleDeleteFolder: (folderId: string) => void
  handleRenameResource: (resId: number) => void
  handleDeleteResource: (resId: number) => void
  handleOpenNotesForResource: (res: EducationResource) => void
  handleOpenCodeForResource: (res: EducationResource) => void
  triggerReplaceFile: (resId: number) => void
  setActiveReinforceResourceId: (resId: number | null) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleFileReplace: (e: React.ChangeEvent<HTMLInputElement>) => void
  setIsFolderCreatorOpen: (val: boolean) => void
  setIsImporterOpen: (val: boolean) => void
  handleDragStartFolder: (e: React.DragEvent, idx: number) => void
  handleDragStartResource: (e: React.DragEvent, folderId: string, resourceId: number) => void
  handleDropFolder: (e: React.DragEvent, targetIdx: number) => void
  handleDropResource: (e: React.DragEvent, targetFolderId: string, targetResIdx: number) => void
  handleDropResourceOnFolderHeader: (e: React.DragEvent, targetFolderId: string) => void
}

export const DosyalarTab: React.FC<DosyalarTabProps> = ({
  folders,
  resources,
  foldersOpen,
  toggleFolderState,
  completedResources,
  saveCompletedResources,
  handleRenameFolder,
  handleDeleteFolder,
  handleRenameResource,
  handleDeleteResource,
  handleOpenNotesForResource,
  handleOpenCodeForResource,
  triggerReplaceFile,
  setActiveReinforceResourceId,
  fileInputRef,
  handleFileUpload,
  handleFileReplace,
  setIsFolderCreatorOpen,
  setIsImporterOpen,
  handleDragStartFolder,
  handleDragStartResource,
  handleDropFolder,
  handleDropResource,
  handleDropResourceOnFolderHeader,
}) => {
  const folderResourceIds = new Set(folders.flatMap((f) => f.resourceIds))
  const uncategorizedResources = resources.filter((r) => !folderResourceIds.has(r.id))

  return (
    <div className="space-y-6">
      {/* Hidden inputs for replacement */}
      <input
        type="file"
        id="replace-file-input"
        onChange={handleFileReplace}
        className="hidden"
      />

      {/* Üst Kontrol & Batch Importer */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="rounded-full font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Tekil Dosya Yükle</span>
          </Button>
          <Button
            onClick={() => setIsFolderCreatorOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full font-bold"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            <span>Yeni Klasör</span>
          </Button>
        </div>
        <Button
          onClick={() => setIsImporterOpen(true)}
          variant="glass"
          size="sm"
          className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-4 py-2 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.08)] cursor-pointer"
        >
          <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
          <span>Müfredat Yapıştır</span>
        </Button>
      </div>

      {/* Klasörleme Yapısı ve Drag & Drop */}
      <div className="space-y-4">
        {folders.map((folder, folderIdx) => {
          const isOpen = !!foldersOpen[folder.id]
          const folderResources = folder.resourceIds
            .map(id => resources.find(r => r.id === id))
            .filter((r): r is EducationResource => !!r)

          return (
            <div
              key={folder.id}
              draggable
              onDragStart={(e) => handleDragStartFolder(e, folderIdx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const type = e.dataTransfer.getData('text/plain')
                if (type === 'resource') {
                  handleDropResourceOnFolderHeader(e, folder.id)
                } else {
                  handleDropFolder(e, folderIdx)
                }
              }}
              className="border border-slate-200 dark:border-zinc-850 rounded-2xl bg-white/20 dark:bg-zinc-950/10 overflow-hidden shadow-sm"
            >
              {/* Folder Header */}
              <div
                onClick={() => toggleFolderState(folder.id)}
                className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-zinc-900/30 text-xs font-bold text-slate-900 dark:text-white cursor-pointer select-none group/folder"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>{folder.name} ({folderResources.length} Öğe)</span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleRenameFolder(folder.id)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
                    title="Yeniden Adlandır"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                    title="Klasörü Sil"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-transform duration-300 ml-1', isOpen && 'rotate-90')} />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-200 dark:border-zinc-800"
                  >
                    <div className="p-3 space-y-2">
                      {folderResources.length === 0 ? (
                        <p className="text-xs text-slate-900 dark:text-zinc-350 p-3">Bu klasör henüz boş. Dosyaları buraya sürükleyebilirsiniz.</p>
                      ) : (
                        <div className="relative border-l border-slate-200 dark:border-zinc-800 ml-3 pl-4 space-y-2">
                          {folderResources.map((res, resIdx) => (
                            <div
                              key={res.id}
                              draggable
                              onDragStart={(e) => handleDragStartResource(e, folder.id, res.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDropResource(e, folder.id, resIdx)
                              }}
                              className="flex items-center justify-between p-3 bg-white/40 dark:bg-zinc-900/35 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl hover:bg-slate-100/40 dark:hover:bg-zinc-900/20 transition-all cursor-pointer group"
                            >
                              {/* Left: Checkbox + Icon + Link Title */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={!!completedResources[res.id]}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const updated = { ...completedResources, [res.id]: !completedResources[res.id] }
                                    saveCompletedResources(updated)
                                    toast.success(updated[res.id] ? 'Kaynak tamamlandı!' : 'Kaynak işareti kaldırıldı.')
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer shrink-0"
                                />
                                <div
                                  onClick={() => {
                                    window.open(res.url_or_path, '_blank')
                                    toast.success('Belge yeni sekmede açıldı!')
                                  }}
                                  className="flex items-center gap-2 cursor-pointer hover:underline min-w-0 flex-1"
                                >
                                  {getFileIcon(res.name, res.type)}
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {res.name}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Interactive Actions */}
                              <div className="flex items-center gap-1 shrink-0 ml-4 opacity-75 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleOpenNotesForResource(res)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                  title="Notlar"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenCodeForResource(res)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                  title="Kodlama Editörü"
                                >
                                  <Code2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => triggerReplaceFile(res.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                  title="Değiştir"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setActiveReinforceResourceId(res.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                  title="Pekiştirme Projeleri"
                                >
                                  <Zap className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(res.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                  title="Kaldır"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Klasörlenmemiş Kaynaklar Bölümü */}
      {uncategorizedResources.length > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDropResource(e, 'uncategorized', uncategorizedResources.length)
          }}
          className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-slate-50/20 dark:bg-black/10 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <FolderOpen className="h-4 w-4 text-slate-400" />
            <span>Klasörlenmemiş Dosyalar ({uncategorizedResources.length} Öğe)</span>
          </div>
          <div className="space-y-2 pl-4 border-l border-slate-200 dark:border-zinc-800">
            {uncategorizedResources.map((res, resIdx) => (
              <div
                key={res.id}
                draggable
                onDragStart={(e) => handleDragStartResource(e, 'uncategorized', res.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDropResource(e, 'uncategorized', resIdx)
                }}
                className="flex items-center justify-between p-3 bg-white/40 dark:bg-zinc-900/35 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl hover:bg-slate-100/40 dark:hover:bg-zinc-900/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={!!completedResources[res.id]}
                    onChange={(e) => {
                      e.stopPropagation()
                      const updated = { ...completedResources, [res.id]: !completedResources[res.id] }
                      saveCompletedResources(updated)
                      toast.success(updated[res.id] ? 'Kaynak tamamlandı!' : 'Kaynak işareti kaldırıldı.')
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <div
                    onClick={() => {
                      window.open(res.url_or_path, '_blank')
                      toast.success('Belge yeni sekmede açıldı!')
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:underline min-w-0 flex-1"
                  >
                    {getFileIcon(res.name, res.type)}
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {res.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-4 opacity-75 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenNotesForResource(res)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                    title="Notlar"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenCodeForResource(res)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                    title="Kodlama Editörü"
                  >
                    <Code2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => triggerReplaceFile(res.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                    title="Değiştir"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveReinforceResourceId(res.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                    title="Pekiştirme Projeleri"
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Kaldır"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
