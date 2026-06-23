import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Trash2, GitBranch, Cpu, BookOpen, Database, HelpCircle } from 'lucide-react'
import { ProjectDocument, DocumentType } from '../../api/projects'
import { SketchButton } from '../../components/ui/SketchButton'
import { cn } from '../../lib/utils'

interface DocCardProps {
  document: ProjectDocument
  projectId: number
  onDelete: (id: number) => void
}

interface DocMetadata {
  phaseId: number
  subPhaseId: number
  subIndex: number
  phaseIndex: number
}

// Extract subphase metadata if present in comments
function parseDocMetadata(content?: string): DocMetadata | null {
  if (!content) return null
  const match = content.match(/<!-- CM_METADATA: ({.*?}) -->/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as DocMetadata
  } catch {
    return null
  }
}

// Format reading time
function getReadingTime(content?: string): string {
  if (!content) return '1 dk okuma'
  const cleanText = content.replace(/<!-- CM_METADATA: ({.*?}) -->\s*/, '')
  const characters = cleanText.length
  const minutes = Math.max(1, Math.round(characters / 500))
  return `${minutes} dk okuma`
}

// Clean markdown content metadata tag
function cleanContentPreview(content?: string): string {
  if (!content) return ''
  const cleaned = content.replace(/<!-- CM_METADATA: ({.*?}) -->\s*/, '')
  return cleaned.slice(0, 120) + (cleaned.length > 120 ? '...' : '')
}

export const DocCard: React.FC<DocCardProps> = ({
  document,
  projectId,
  onDelete,
}) => {
  const navigate = useNavigate()
  const metadata = parseDocMetadata(document.content)
  const isSubPhase = document.title.startsWith('DOC_SUBPHASE_')

  // 1. Akıllı Başlık Dönüştürücü (Smart Title Masking)
  const getFormattedHeader = (): { title: string; phaseBadge?: string; targetPhaseId?: number } => {
    // A) Check for tech stack ADR auto-generated documents (e.g. TECH_STACK_ADR_PHASE_4)
    const adrMatch = document.title.match(/^TECH_STACK_ADR_PHASE_(\d+)$/)
    if (adrMatch) {
      const phaseNum = adrMatch[1]
      return {
        title: `Faz ${phaseNum} — Teknoloji Yığını & ADR`,
        phaseBadge: `Faz ${phaseNum}`,
        targetPhaseId: parseInt(phaseNum, 10), // Will map directly to Phase ID if possible
      }
    }

    // B) Check for sub-phase auto-generated notes
    if (isSubPhase && metadata) {
      return {
        title: `Faz ${metadata.phaseIndex + 1}.${metadata.subIndex} Notları`,
        phaseBadge: `Faz ${metadata.phaseIndex + 1}.${metadata.subIndex}`,
        targetPhaseId: metadata.phaseId,
      }
    }

    return { title: document.title }
  }

  const headerInfo = getFormattedHeader()

  // 2. Döküman Türüne Özel Tonal Badges (Pastel colors)
  const getBadgeStyle = (type: DocumentType) => {
    switch (type) {
      case 'DB_SCHEMA':
        return 'bg-blue-100/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/30'
      case 'REFACTOR_PLAN':
        return 'bg-purple-100/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200/30'
      case 'FUTURE_FEATURES':
        return 'bg-amber-100/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/30'
      case 'TECH_DOC':
        return 'bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30'
      case 'GENERAL':
      default:
        return 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200/30'
    }
  }

  const getDocIcon = (type: DocumentType, isSub: boolean) => {
    if (isSub) return <GitBranch className="h-4 w-4 text-cyan-500" />
    if (type === 'DB_SCHEMA') return <Database className="h-4 w-4 text-blue-500" />
    if (type === 'TECH_DOC') return <Cpu className="h-4 w-4 text-emerald-500" />
    return <BookOpen className="h-4 w-4 text-indigo-500" />
  }

  const handleNavigateToPhase = () => {
    if (metadata) {
      navigate(`/projects/${projectId}/phases/${metadata.phaseId}?subPhaseId=${metadata.subPhaseId}`)
    } else if (headerInfo.targetPhaseId) {
      navigate(`/projects/${projectId}/phases/${headerInfo.targetPhaseId}`)
    }
  }

  return (
    <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 relative group">
      
      {/* 3. Minimalist Link Badge */}
      {headerInfo.phaseBadge && (
        <button
          onClick={handleNavigateToPhase}
          className="absolute top-4 right-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] px-2 py-0.5 rounded-lg border border-cyan-500/20 transition-all font-black flex items-center gap-1 cursor-pointer"
          title="İlgili Faz/Alt Faza Git"
        >
          <GitBranch className="h-3 w-3" />
          {headerInfo.phaseBadge}
        </button>
      )}

      {/* Tonal Badge & Icon Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900/50 text-slate-700 dark:text-slate-300 shadow-inner">
          {getDocIcon(document.type, isSubPhase)}
        </div>
        <span className={cn('text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-lg uppercase', getBadgeStyle(document.type))}>
          {isSubPhase ? 'Alt Faz Notu' : document.type.replace('_', ' ')}
        </span>
      </div>

      {/* Title & Preview Content */}
      <div className="space-y-1">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
          {headerInfo.title}
        </h4>
        
        {/* Reading time & date footer */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
          <Calendar className="h-3 w-3" />
          <span>•</span>
          <span>{getReadingTime(document.content)}</span>
        </div>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
          {cleanContentPreview(document.content) || (
            <span className="italic text-zinc-400 dark:text-zinc-500">İçerik boş.</span>
          )}
        </p>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800/40 mt-2 pt-3">
        <SketchButton
          tone="destructive"
          onClick={() => onDelete(document.id)}
          className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          title="Dokümanı Sil"
        >
          <Trash2 className="h-4 w-4" />
        </SketchButton>
      </div>

    </div>
  )
}

interface DocCardsProps {
  documents: ProjectDocument[]
  projectId: number
  onDelete: (id: number) => void
}

export const DocCards: React.FC<DocCardsProps> = ({
  documents,
  projectId,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocCard
          key={doc.id}
          document={doc}
          projectId={projectId}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
