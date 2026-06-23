import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Layers3,
  Trash2,
  Plus,
  Cpu,
  Database,
  Smartphone,
  Folder,
  Code,
  Terminal,
  HelpCircle,
  Loader2,
} from 'lucide-react'
import {
  Project,
  TechnologyCategory,
  useProjectTechnologies,
  useAddProjectTechnology,
  useDeleteProjectTechnology,
  useProjectDocuments,
  useProjectPhases,
} from '../../api/projects'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { cn } from '../../lib/utils'

// Category labels mapping
const CATEGORY_LABELS: Record<TechnologyCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  MOBILE: 'Mobile',
  DATABASE: 'Database',
  DEVOPS: 'DevOps',
  OTHER: 'Other',
}

// Category icons mapping
const CATEGORY_ICONS: Record<TechnologyCategory, React.ComponentType<{ className?: string }>> = {
  FRONTEND: Code,
  BACKEND: Terminal,
  MOBILE: Smartphone,
  DATABASE: Database,
  DEVOPS: Layers3,
  OTHER: Folder,
}

// Soft colors for technology initial daire (avatar)
const AVATAR_COLORS = [
  'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
]

function getAvatarColorClass(name: string) {
  const code = name.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

interface MergedTechItem {
  id: string | number
  name: string
  title: string
  notes?: string
  category: TechnologyCategory
  phaseId?: number
  phaseName?: string
  adrReason?: string
  isGlobal: boolean
}

interface ProjectTechStackProps {
  project: Project
}

export const ProjectTechStack: React.FC<ProjectTechStackProps> = ({ project }) => {
  const navigate = useNavigate()
  const [techForm, setTechForm] = useState({
    category: 'FRONTEND' as TechnologyCategory,
    title: '',
    technology: '',
    notes: '',
  })

  // Tooltip tracking: stores item id
  const [activeTooltipId, setActiveTooltipId] = useState<string | number | null>(null)

  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: globalTechnologies = [], isLoading: techLoading } = useProjectTechnologies(project.id)
  const { data: documents = [] } = useProjectDocuments(project.id)
  const { data: phases = [] } = useProjectPhases(project.id)

  const addTechnologyMutation = useAddProjectTechnology()
  const deleteTechnologyMutation = useDeleteProjectTechnology(project.id)

  // ── MERGING STRATEGY ───────────────────────────────────────────────
  const mergedTechnologies = useMemo(() => {
    // 1. Add global technologies
    const list: MergedTechItem[] = globalTechnologies.map((gt) => ({
      id: `global-${gt.id}`,
      name: gt.technology,
      title: gt.title,
      notes: gt.notes,
      category: gt.category,
      adrReason: gt.notes, // global uses notes for ADR
      isGlobal: true,
      rawId: gt.id,
    } as MergedTechItem & { rawId: number }))

    // 2. Extract phase-level technologies from TECH_DOC documents
    documents.forEach((doc) => {
      if (doc.type === 'TECH_DOC' && doc.title.startsWith('TECH_STACK_ADR_PHASE_')) {
        const phaseIdStr = doc.title.substring('TECH_STACK_ADR_PHASE_'.length)
        const phaseId = parseInt(phaseIdStr, 10)
        const relatedPhase = phases.find((p) => p.id === phaseId)

        if (!isNaN(phaseId) && doc.content) {
          try {
            const parsed = JSON.parse(doc.content)
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                list.push({
                  id: `phase-${phaseId}-${item.id}`,
                  name: item.name,
                  title: item.title || 'Mühendislik Bileşeni',
                  category: (item.category || 'OTHER') as TechnologyCategory,
                  phaseId,
                  phaseName: relatedPhase ? relatedPhase.name : `Faz #${phaseId}`,
                  adrReason: item.adrReason || '',
                  isGlobal: false,
                })
              })
            }
          } catch (e) {
            console.error('Failed to parse phase technology document', doc.title, e)
          }
        }
      }
    })

    return list
  }, [globalTechnologies, documents, phases])

  // Group by category
  const categoriesData = useMemo(() => {
    return (Object.keys(CATEGORY_LABELS) as TechnologyCategory[]).map((category) => {
      const items = mergedTechnologies.filter((t) => t.category === category)
      return {
        category,
        label: CATEGORY_LABELS[category],
        Icon: CATEGORY_ICONS[category],
        items,
      }
    })
  }, [mergedTechnologies])

  const handleAddTechnology = (e: React.FormEvent) => {
    e.preventDefault()
    if (!techForm.technology.trim() || !techForm.title.trim()) {
      toast.error('Lütfen teknoloji adını ve başlığını/rolünü girin.')
      return
    }

    addTechnologyMutation.mutate(
      {
        projectId: project.id,
        request: {
          category: techForm.category,
          title: techForm.title.trim(),
          technology: techForm.technology.trim(),
          notes: techForm.notes.trim() || undefined,
          orderIndex: globalTechnologies.length,
        },
      },
      {
        onSuccess: () => {
          setTechForm({
            category: 'FRONTEND',
            title: '',
            technology: '',
            notes: '',
          })
          toast.success('Global teknoloji panosuna eklendi.')
        },
      }
    )
  }

  const handleDeleteGlobal = (rawId: number) => {
    deleteTechnologyMutation.mutate(rawId, {
      onSuccess: () => {
        toast.success('Teknoloji panodan kaldırıldı.')
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* ── ADD GLOBAL TECHNOLOGY FORM ──────────────────────────────── */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-6">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Layers3 className="h-4.5 w-4.5 text-cyan-500" />
          Global Teknoloji Ekle
        </h3>
        <form onSubmit={handleAddTechnology} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-3">
              <select
                value={techForm.category}
                onChange={(e) =>
                  setTechForm((form) => ({ ...form, category: e.target.value as TechnologyCategory }))
                }
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-bold"
              >
                {(Object.keys(CATEGORY_LABELS) as TechnologyCategory[]).map((category) => (
                  <option key={category} value={category} className="dark:bg-zinc-900">
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <Input
                value={techForm.technology}
                onChange={(e) => setTechForm((form) => ({ ...form, technology: e.target.value }))}
                placeholder="Teknoloji Adı (Örn: React, Spring Boot)"
                className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="md:col-span-5 flex gap-2">
              <Input
                value={techForm.title}
                onChange={(e) => setTechForm((form) => ({ ...form, title: e.target.value }))}
                placeholder="Rolü / Başlığı (Örn: UI Library, API Framework)"
                className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all flex-1"
              />
              <button
                type="submit"
                disabled={addTechnologyMutation.isPending}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {addTechnologyMutation.isPending ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Plus className="h-4.5 w-4.5" />
                )}
                Ekle
              </button>
            </div>
          </div>
          <Textarea
            value={techForm.notes}
            onChange={(e) => setTechForm((form) => ({ ...form, notes: e.target.value }))}
            placeholder="Mimari Karar Gerekçesi (ADR)"
            className="w-full min-h-[75px] bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* ── KANBAN COLUMNS düzeninde listele ─────────────────────────── */}
      {techLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesData.map(({ category, label, Icon, items }) => (
            <div
              key={category}
              className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-5 flex flex-col min-h-[300px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/50 dark:border-slate-800/40 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                    {label}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-200/60 dark:bg-slate-800/50 text-slate-650 dark:text-zinc-400 px-2 py-0.5 rounded-lg">
                  {items.length}
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 space-y-3.5">
                {items.map((tech) => {
                  const initial = tech.name.charAt(0).toUpperCase()
                  const avatarColor = getAvatarColorClass(tech.name)
                  const hasAdr = !!tech.adrReason

                  return (
                    <div
                      key={tech.id}
                      className="relative flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/50 bg-white/60 dark:border-zinc-800/30 dark:bg-zinc-950/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md group"
                      onMouseEnter={() => hasAdr && setActiveTooltipId(tech.id)}
                      onMouseLeave={() => setActiveTooltipId(null)}
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={cn(
                            'h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border',
                            avatarColor
                          )}
                        >
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate pr-1">
                            {tech.name}
                          </h4>
                          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            {tech.title}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions / Phase badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {tech.isGlobal ? (
                          <button
                            onClick={() => handleDeleteGlobal((tech as any).rawId)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Kaldır"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (tech.phaseId) {
                                navigate(`/projects/${project.id}/phases/${tech.phaseId}`)
                              }
                            }}
                            className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-400/25 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            title={`${tech.phaseName} Odasına Git`}
                          >
                            {tech.phaseName || `Faz ${tech.phaseId}`}
                          </button>
                        )}
                      </div>

                      {/* Premium Glassmorphic Tooltip for ADR on Hover */}
                      {hasAdr && activeTooltipId === tech.id && (
                        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-white/95 dark:bg-black/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3.5 z-50 pointer-events-none transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <span className="block text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">
                            Mimari Gerekçe (ADR)
                          </span>
                          <p className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 break-words font-medium">
                            {tech.adrReason}
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/95 dark:border-t-black/90" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="flex-1 border-dashed border-2 border-slate-250 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                    <HelpCircle className="h-7 w-7 text-zinc-305 dark:text-zinc-700 mb-2" />
                    <span className="text-[11px] text-zinc-400 italic font-medium">
                      Teknoloji eklenmedi
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
