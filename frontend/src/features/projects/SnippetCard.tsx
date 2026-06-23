import React, { useState } from 'react'
import { Copy, Check, Trash2, ExternalLink, Code } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectSnippet, SnippetCategory } from '../../api/projects'
import { SketchButton } from '../../components/ui/SketchButton'
import { cn } from '../../lib/utils'

interface SnippetCardProps {
  snippet: ProjectSnippet
  onDelete: (id: number) => void
}

interface SnippetDescInfo {
  description: string
  referenceUrl?: string
}

function parseSnippetDescription(rawDesc?: string): SnippetDescInfo {
  if (!rawDesc) return { description: '' }
  try {
    const parsed = JSON.parse(rawDesc)
    if (typeof parsed === 'object' && parsed !== null && 'description' in parsed) {
      return parsed as SnippetDescInfo
    }
  } catch {
    // Normal text description, not JSON
  }
  return { description: rawDesc }
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  onDelete,
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const descInfo = parseSnippetDescription(snippet.description)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippet.code)
    setIsCopied(true)
    toast.success('Kod panoya kopyalandı!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const isDevOpsLang = ['docker', 'dockerfile', 'bash', 'shell', 'sh', 'yaml', 'yml', 'kubernetes', 'k8s'].includes((snippet.language || '').toLowerCase().trim())
  const codeColorClass = isDevOpsLang ? 'text-emerald-400' : 'text-cyan-400'

  // Kategoriye Özel Tonal Badges
  const getCategoryBadge = (category: SnippetCategory, language?: string) => {
    const lang = (language || '').toLowerCase().trim()
    
    // Check if SQL or category is DATABASE
    if (lang === 'sql' || category === 'DATABASE') {
      return (
        <span className="bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-0.5 rounded-md text-xs font-bold border border-amber-200/20">
          Veritabanı
        </span>
      )
    }

    // Check if DevOps / Terminal
    if (['docker', 'dockerfile', 'bash', 'shell', 'sh', 'yaml', 'yml', 'kubernetes', 'k8s'].includes(lang)) {
      return (
        <span className="bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-md text-xs font-bold border border-emerald-200/20">
          DevOps / Terminal
        </span>
      )
    }

    if (category === 'FRONTEND') {
      return (
        <span className="bg-blue-100/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-xs font-bold border border-blue-200/20">
          Frontend
        </span>
      )
    }

    if (category === 'BACKEND') {
      return (
        <span className="bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 px-2.5 py-0.5 rounded-md text-xs font-bold border border-purple-200/20">
          Backend
        </span>
      )
    }

    return (
      <span className="bg-slate-100/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 px-2.5 py-0.5 rounded-md text-xs font-bold border border-slate-200/20">
        Diğer
      </span>
    )
  }

  return (
    <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col gap-3 relative group">
      
      {/* Upper Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-sm font-extrabold text-slate-950 dark:text-slate-105 truncate">
            {snippet.title}
          </h4>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md shrink-0 font-bold">
            {snippet.language || 'plain'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {getCategoryBadge(snippet.category, snippet.language)}
        </div>
      </div>

      {/* Description & Optional Link */}
      {descInfo.description && (
        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
          {descInfo.description}
        </p>
      )}

      {descInfo.referenceUrl && (
        <div className="flex items-center">
          <a
            href={descInfo.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Referans / Repo Bağlantısı</span>
          </a>
        </div>
      )}

      {/* IDE Code Simulation */}
      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 font-mono text-xs relative group/code overflow-hidden">
        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer opacity-0 group-hover/code:opacity-100 text-[10px] font-bold shadow-sm"
          title="Kopyala"
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
              <span className="text-emerald-400">Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Kopyala</span>
            </>
          )}
        </button>

        <pre className={cn("max-h-64 overflow-auto scrollbar-thin pr-8 leading-5 font-mono whitespace-pre-wrap", codeColorClass)}>
          {snippet.code}
        </pre>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800/40 mt-1 pt-3">
        <SketchButton
          tone="destructive"
          onClick={() => onDelete(snippet.id)}
          className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          title="Snippeti Sil"
        >
          <Trash2 className="h-4 w-4" />
        </SketchButton>
      </div>

    </div>
  )
}
