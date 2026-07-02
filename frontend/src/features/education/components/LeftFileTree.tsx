import React from 'react'
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  Pencil,
  Trash2,
  RefreshCw,
  Zap,
  FileText,
  Braces,
  Plus,
  UploadCloud,
  Link as LinkIcon,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFileIcon } from './studioHelpers'
import { FolderData, EducationResource, ReinforcementTask, ResourceNote } from '../types'

interface LeftFileTreeProps {
  folders: FolderData[]
  resources: EducationResource[]
  selectedResourceId: number | null | undefined
  selectedFolderId: string
  activeTab: 'overview' | 'files' | 'links' | 'reinforce' | 'primary' | 'notes'
  activeFileName: string
  activeResourceNoteId: string | null
  reinforcements: Record<string, ReinforcementTask[]>
  resourceNoteItems: Record<string, ResourceNote[]>
  treeExpandedNodes: Record<string, boolean>
  treeLoadingNodes: Record<string, boolean>
  handleToggleTreeNode: (nodeId: string) => void
  handleTreeNodeClick: (type: 'file' | 'task' | 'note', targetId: string, itemId?: string | number) => void
  handleSelectFolder: (folderId: string) => void
  handleCreateFolderRequest: () => void
  handleUploadFileRequest: () => void
  handleAddLinkRequest: () => void
  handleImportCurriculumRequest: () => void
  handleCreateReinforcementForResource: (resId: number) => void
  handleCreateNoteForResource: (resourceKey: string) => void
  handleRenameFolder: (folderId: string) => void
  handleDeleteFolder: (folderId: string) => void
  handleRenameResource: (resId: number) => void
  handleDeleteResource: (resId: number) => void
  handleRenameTask: (actualKey: string, taskId: string) => void
  handleDeleteTask: (actualKey: string, taskId: string) => void
  handleRenameNote: (actualKey: string, noteId: string) => void
  handleDeleteNote: (actualKey: string, noteId: string) => void
}

const LeftFileTreeComponent: React.FC<LeftFileTreeProps> = ({
  folders,
  resources,
  selectedResourceId,
  selectedFolderId,
  activeTab,
  activeFileName,
  activeResourceNoteId,
  reinforcements,
  resourceNoteItems,
  treeExpandedNodes,
  treeLoadingNodes,
  handleToggleTreeNode,
  handleTreeNodeClick,
  handleSelectFolder,
  handleCreateFolderRequest,
  handleUploadFileRequest,
  handleAddLinkRequest,
  handleImportCurriculumRequest,
  handleCreateReinforcementForResource,
  handleCreateNoteForResource,
  handleRenameFolder,
  handleDeleteFolder,
  handleRenameResource,
  handleDeleteResource,
  handleRenameTask,
  handleDeleteTask,
  handleRenameNote,
  handleDeleteNote,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false)
  const folderResourceIds = new Set(folders.flatMap((f) => f.resourceIds))
  const uncategorizedResources = resources.filter((r) => !folderResourceIds.has(r.id))

  const runAddAction = (action: () => void) => {
    setIsAddMenuOpen(false)
    action()
  }

  const renderFolderNode = (folderId: string, folderName: string, folderResIds: number[], isUncategorized = false) => {
    const isExpanded = !!treeExpandedNodes[folderId]
    const isLoading = !!treeLoadingNodes[folderId]

    const folderResources = folderResIds
      .map(id => resources.find(r => r.id === id))
      .filter((r): r is EducationResource => !!r)

    return (
      <div key={folderId} className="space-y-1">
        {/* Folder row */}
        <div
          onClick={() => {
            handleSelectFolder(folderId)
            void handleToggleTreeNode(folderId)
          }}
          className={cn(
            "group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
            selectedFolderId === folderId
              ? "bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300"
              : isExpanded
              ? "bg-slate-100/50 dark:bg-zinc-900/40 text-slate-900 dark:text-zinc-200"
              : "text-slate-700 dark:text-zinc-400 hover:bg-slate-100/20 dark:hover:bg-zinc-900/20"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
            )}
            <span className="truncate">{folderName}</span>
            <span className="text-[10px] text-slate-400 font-normal shrink-0 font-mono">
              ({folderResources.length})
            </span>
          </div>

          {/* Folder CRUD Actions */}
          {!isUncategorized && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleRenameFolder(folderId)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
                title="Yeniden Adlandır"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(folderId)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                title="Klasörü Sil"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Folder Children */}
        {isExpanded && (
          <div className="pl-4 border-l border-slate-200 dark:border-zinc-800 ml-4 space-y-1">
            {isLoading ? (
              <div className="flex items-center gap-2 py-1.5 px-3 text-[10px] text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin text-cyan-500" />
                <span>Yükleniyor...</span>
              </div>
            ) : folderResources.length === 0 ? (
              <div className="py-1 px-3 text-[10px] text-slate-400 italic">
                Klasör boş
              </div>
            ) : (
              folderResources.map(res => renderResourceNode(res))
            )}
          </div>
        )}
      </div>
    )
  }

  const renderResourceNode = (res: EducationResource) => {
    const nodeId = `file-${res.id}`
    const isExpanded = !!treeExpandedNodes[nodeId]
    const isLoading = !!treeLoadingNodes[nodeId]

    const isResActive = selectedResourceId === res.id

    // Determine task & note keys and lists
    const actualTaskKey = reinforcements[`resource:${res.id}`] ? `resource:${res.id}` : (reinforcements[String(res.id)] ? String(res.id) : `resource:${res.id}`)
    const taskList = reinforcements[actualTaskKey] || []

    const actualNoteKey = resourceNoteItems[`resource:${res.id}`] ? `resource:${res.id}` : (resourceNoteItems[String(res.id)] ? String(res.id) : `resource:${res.id}`)
    const noteList = resourceNoteItems[actualNoteKey] || []

    return (
      <div key={res.id} className="space-y-1">
        {/* File Row */}
        <div
          onClick={() => handleTreeNodeClick('file', String(res.id))}
          className={cn(
            "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none",
            isResActive
              ? "text-slate-900 bg-white dark:text-white dark:bg-zinc-900 font-bold border-l-2 border-cyan-500"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/20"
          )}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleTreeNode(nodeId)
              }}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              )}
            </button>
            {getFileIcon(res.name, res.type)}
            <span className="truncate">{res.name}</span>
          </div>

          {/* File CRUD Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleRenameResource(res.id)}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
              title="Yeniden Adlandır"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteResource(res.id)}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
              title="Dosyayı Sil"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* File Children (Tasks & Notes Categories) */}
        {isExpanded && (
          <div className="pl-3 border-l border-slate-100 dark:border-zinc-800 ml-3 space-y-1">
            {isLoading ? (
              <div className="flex items-center gap-1.5 py-1 px-2 text-[10px] text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin text-cyan-500" />
                <span>Yükleniyor...</span>
              </div>
            ) : (
              <>
                {/* Category 1: Pekiştirme Kodları */}
                {renderCategoryNode(res.id, 'tasks', 'Pekiştirme Kodları', taskList, actualTaskKey)}
                {/* Category 2: Notlar */}
                {renderCategoryNode(res.id, 'notes', 'Notlar', noteList, actualNoteKey)}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderCategoryNode = (resId: number, categoryType: 'tasks' | 'notes', label: string, items: any[], actualKey: string) => {
    const catNodeId = `${categoryType}-${resId}`
    const isExpanded = !!treeExpandedNodes[catNodeId]
    const isLoading = !!treeLoadingNodes[catNodeId]

    const icon = categoryType === 'tasks' ? (
      <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
    ) : (
      <FileText className="h-3 w-3 text-emerald-500 shrink-0" />
    )

    return (
      <div className="space-y-1">
        {/* Category Header Row */}
        <div
          onClick={() => handleToggleTreeNode(catNodeId)}
          className="group flex items-center justify-between py-1 px-2 rounded hover:bg-slate-100/50 dark:hover:bg-zinc-900/10 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {isExpanded ? (
              <ChevronDown className="h-2.5 w-2.5 shrink-0" />
            ) : (
              <ChevronRight className="h-2.5 w-2.5 shrink-0" />
            )}
            {icon}
            <span className="truncate">{label}</span>
            <span className="text-[9px] font-normal shrink-0 font-mono">({items.length})</span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (categoryType === 'tasks') {
                handleCreateReinforcementForResource(resId)
              } else {
                handleCreateNoteForResource(actualKey)
              }
            }}
            className="rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-cyan-500/10 hover:text-cyan-600 group-hover:opacity-100 dark:hover:text-cyan-300"
            title={categoryType === 'tasks' ? 'Pekistirme ekle' : 'Not ekle'}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Category Items */}
        {isExpanded && (
          <div className="pl-3 border-l border-slate-100 dark:border-zinc-800/50 ml-3.5 space-y-1">
            {isLoading ? (
              <div className="flex items-center gap-1.5 py-1 px-2 text-[9px] text-slate-400">
                <RefreshCw className="h-2.5 w-2.5 animate-spin text-cyan-500" />
                <span>Yükleniyor...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-1 px-2 text-[9px] text-slate-400 italic">
                Öğe yok
              </div>
            ) : (
              items.map(item => {
                if (categoryType === 'tasks') {
                  // Reinforcement task item
                  const isTaskActive = selectedResourceId === resId && activeTab === 'primary' && activeFileName === item.codeFileName
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTreeNodeClick('task', `resource:${resId}`, item.id)}
                      className={cn(
                        "group flex items-center justify-between py-1 px-2 rounded text-[11px] transition-all cursor-pointer select-none",
                        isTaskActive
                          ? "text-slate-950 bg-white dark:text-white dark:bg-zinc-950 font-bold border-l-2 border-yellow-500"
                          : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100/40 dark:hover:bg-zinc-900/15"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <Zap className="h-2.5 w-2.5 text-yellow-500 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                        <div
                          onClick={(event) => {
                            event.stopPropagation()
                            handleTreeNodeClick('task', `resource:${resId}`, item.id)
                          }}
                          className="mt-1 ml-3 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-300"
                        >
                          <Braces className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{item.codeFileName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRenameTask(actualKey, item.id)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(actualKey, item.id)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  )
                } else {
                  // Note item
                  const isNoteActive = selectedResourceId === resId && activeTab === 'notes' && activeResourceNoteId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTreeNodeClick('note', `resource:${resId}`, item.id)}
                      className={cn(
                        "group flex items-center justify-between py-1 px-2 rounded text-[11px] transition-all cursor-pointer select-none",
                        isNoteActive
                          ? "text-slate-950 bg-white dark:text-white dark:bg-zinc-950 font-bold border-l-2 border-emerald-500"
                          : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100/40 dark:hover:bg-zinc-900/15"
                      )}
                    >
                      <div className="flex items-center gap-1 overflow-hidden">
                        <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRenameNote(actualKey, item.id)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(actualKey, item.id)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  )
                }
              })
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-zinc-950/20 rounded-2xl border border-slate-200 dark:border-zinc-800/60 p-4 overflow-y-auto space-y-4">
      <div className="relative flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-400">
          EĞİTİM DÖKÜMANLARI
        </span>
        <button
          type="button"
          onClick={() => setIsAddMenuOpen((open) => !open)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 shadow-sm transition-all hover:bg-cyan-500/15 dark:text-cyan-300"
          title="Kaynak ekle"
        >
          <Plus className="h-4 w-4" />
        </button>
        {isAddMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Menuyu kapat"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsAddMenuOpen(false)}
            />
            <div className="absolute right-0 top-9 z-50 w-48 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
              <button type="button" onClick={() => runAddAction(handleCreateFolderRequest)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-zinc-200 dark:hover:text-cyan-300">
                <Folder className="h-3.5 w-3.5 text-amber-500" />
                Yeni Klasor
              </button>
              <button type="button" onClick={() => runAddAction(handleUploadFileRequest)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-zinc-200 dark:hover:text-cyan-300">
                <UploadCloud className="h-3.5 w-3.5 text-cyan-500" />
                Dosya Yukle
              </button>
              <button type="button" onClick={() => runAddAction(handleAddLinkRequest)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-zinc-200 dark:hover:text-cyan-300">
                <LinkIcon className="h-3.5 w-3.5 text-violet-500" />
                Link Ekle
              </button>
              <button type="button" onClick={() => runAddAction(handleImportCurriculumRequest)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-zinc-200 dark:hover:text-cyan-300">
                <ClipboardList className="h-3.5 w-3.5 text-emerald-500" />
                Mufredat Yapistir
              </button>
            </div>
          </>
        )}
      </div>
      <div className="space-y-3 flex-grow">
        {/* Folders */}
        {folders.map(folder => renderFolderNode(folder.id, folder.name, folder.resourceIds))}

        {/* Uncategorized files folder */}
        {uncategorizedResources.length > 0 &&
          renderFolderNode('uncategorized', 'Klasörsüz Dosyalar', uncategorizedResources.map(r => r.id), true)
        }

        {folders.length === 0 && uncategorizedResources.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            Henüz dosya eklenmemiş.
          </div>
        )}
      </div>
    </div>
  )
}

export const LeftFileTree = React.memo(LeftFileTreeComponent)
