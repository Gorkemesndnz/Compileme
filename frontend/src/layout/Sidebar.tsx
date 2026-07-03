import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import {
  LayoutDashboard,
  Folder,
  GraduationCap,
  Lightbulb,
  Calendar,
  Timer,
  Settings,
  UserCircle,
  LogOut,
  ChevronsUpDown,
  UserCog,
  Blocks,
  ChevronDown,
  ChevronRight,
  Plus,
  Sun,
  Moon,
  Globe,
  Monitor
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useTranslation } from '@/store/translations'
import { ProjectStatus, useProjects, useProjectPhases, useProjectDocuments, Project } from '@/api/projects'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { useEducations } from '@/api/education'
import { groupEducationsByType } from '@/features/education/educationHelpers'
import { EducationType } from '@/features/education/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.65)]',
  ACTIVE: 'bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.65)]',
  PAUSED: 'bg-neutral-400 shadow-[0_0_6px_rgba(163,163,163,0.45)]',
  DONE: 'bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.6)]',
}

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.2rem",
  },
}

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
}

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -10,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
}

const transitionProps: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
}

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)(?::STATUS:(\w+))?\]\s*(.*)$/

function decodeSubTitle(title: string) {
  const match = title.match(SUB_REGEX)
  if (!match) return null
  return {
    phaseId: parseInt(match[1], 10),
    subIndex: parseInt(match[2], 10),
    status: match[3] || 'PLANNING',
    label: match[4],
  }
}

const SUB_PHASE_STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]',
  DEVELOPMENT: 'bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]',
  TEST: 'bg-violet-400 shadow-[0_0_5px_rgba(167,139,250,0.5)]',
  COMPLETED: 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]',
}

interface SidebarProjectNodeProps {
  project: Project
  activeProjectId: number | undefined
  pathname: string
  searchParams: URLSearchParams
  openProject: (projectId: number) => void
  isCollapsed: boolean
  variants: any
}

const SidebarProjectNodeComponent: React.FC<SidebarProjectNodeProps> = ({
  project,
  activeProjectId,
  pathname,
  searchParams,
  openProject,
  isCollapsed,
  variants
}) => {
  const [isExpanded, setIsExpanded] = React.useState(project.id === activeProjectId)
  const navigate = useNavigate()
  const { data: phases = [] } = useProjectPhases(project.id, { enabled: isExpanded })
  const { data: documents = [] } = useProjectDocuments(project.id, { enabled: isExpanded })
  const [expandedPhases, setExpandedPhases] = React.useState<Record<number, boolean>>({})

  const isProjectActive = project.id === activeProjectId && pathname.startsWith('/projects')
  const isProjectExactlyActive = pathname === `/projects/${project.id}`
  const activeSubPhaseId = searchParams.get('subPhaseId')

  React.useEffect(() => {
    if (project.id === activeProjectId) {
      setIsExpanded(true)
    }
  }, [activeProjectId, project.id])

  React.useEffect(() => {
    phases.forEach((phase) => {
      const isPhaseActive = pathname.startsWith(`/projects/${project.id}/phases/${phase.id}`)
      if (isPhaseActive) {
        setExpandedPhases((prev) => ({ ...prev, [phase.id]: true }))
      }
    })
  }, [pathname, phases, project.id])

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded((prev) => !prev)
  }

  const togglePhaseExpand = (phaseId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  const subPhasesByPhase = React.useMemo(() => {
    const map: Record<number, Array<{ subIndex: number; status: string; label: string; docId: number }>> = {}
    documents.forEach((doc) => {
      const decoded = decodeSubTitle(doc.title)
      if (decoded) {
        if (!map[decoded.phaseId]) {
          map[decoded.phaseId] = []
        }
        map[decoded.phaseId].push({
          subIndex: decoded.subIndex,
          status: decoded.status,
          label: decoded.label,
          docId: doc.id
        })
      }
    })
    Object.keys(map).forEach((phaseId) => {
      map[parseInt(phaseId, 10)].sort((a, b) => a.subIndex - b.subIndex)
    })
    return map
  }, [documents])

  return (
    <div className="flex flex-col w-full">
      {/* Lvl 2: Project Row */}
      <div
        className={cn(
          'group/project flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-slate-600 transition-all hover:bg-zinc-500/10 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-zinc-800/40 dark:hover:text-white',
          isProjectExactlyActive && 'bg-zinc-500/10 font-bold text-slate-950 dark:bg-zinc-800/50 dark:text-white',
          isProjectActive && !isProjectExactlyActive && 'bg-zinc-500/5 text-slate-900 dark:bg-zinc-800/20 dark:text-zinc-300'
        )}
      >
        <button
          type="button"
          onClick={() => openProject(project.id)}
          className="flex flex-1 items-center gap-2 text-left min-w-0 h-full"
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PROJECT_STATUS_DOT[project.status])} />
          <span className="truncate text-xs md:text-sm font-mono">{project.name}</span>
        </button>

        {phases.length > 0 && (
          <button
            type="button"
            onClick={toggleExpand}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 hover:bg-zinc-500/10 hover:text-slate-900 focus-visible:outline-none dark:text-neutral-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        )}
      </div>

      {/* Lvl 3: Phases list */}
      <AnimatePresence initial={false}>
        {isExpanded && phases.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col mt-0.5"
          >
            {phases.map((phase) => {
              const isPhaseActive = pathname.startsWith(`/projects/${project.id}/phases/${phase.id}`)
              const isPhaseExactlyActive = isPhaseActive && !activeSubPhaseId
              const phaseSubPhases = subPhasesByPhase[phase.id] || []
              const isPhaseExpanded = !!expandedPhases[phase.id]

              return (
                <div key={phase.id} className="flex flex-col w-full pl-2 ml-2 border-l border-zinc-200/50 dark:border-zinc-800/40">
                  <div
                    className={cn(
                      'group/phase flex h-8 w-full items-center justify-between rounded-md px-1.5 text-left text-slate-500 transition-all hover:bg-zinc-500/5 hover:text-slate-900 dark:text-neutral-500 dark:hover:bg-zinc-800/20 dark:hover:text-zinc-300',
                      isPhaseExactlyActive && 'bg-zinc-500/10 font-bold text-slate-950 dark:bg-zinc-800/40 dark:text-white',
                      isPhaseActive && !isPhaseExactlyActive && 'bg-zinc-500/5 text-slate-800 dark:bg-zinc-800/10 dark:text-zinc-300'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}/phases/${phase.id}`)}
                      className="flex flex-1 items-center gap-1.5 text-left min-w-0 h-full text-xs font-mono"
                    >
                      <span className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-sm',
                        phase.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                      )} />
                      <span className="truncate">{phase.name}</span>
                    </button>

                    {phaseSubPhases.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => togglePhaseExpand(phase.id, e)}
                        className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-zinc-500/10 hover:text-slate-900 focus-visible:outline-none dark:text-neutral-500 dark:hover:bg-zinc-900/50 dark:hover:text-white"
                      >
                        <ChevronRight
                          className={cn(
                            'h-3 w-3 transition-transform duration-200',
                            isPhaseExpanded && 'rotate-90'
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Lvl 4: Subphases List */}
                  <AnimatePresence initial={false}>
                    {isPhaseExpanded && phaseSubPhases.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col mt-0.5"
                      >
                        {phaseSubPhases.map((sub) => {
                          const isSubActive = isPhaseActive && activeSubPhaseId === sub.subIndex.toString()
                          const subDotColor = SUB_PHASE_STATUS_COLORS[sub.status] || SUB_PHASE_STATUS_COLORS.PLANNING

                          return (
                            <button
                              key={`${phase.id}-sub-${sub.subIndex}`}
                              type="button"
                              onClick={() => navigate(`/projects/${project.id}/phases/${phase.id}?subPhaseId=${sub.subIndex}`)}
                              className={cn(
                                'flex h-7 w-full items-center gap-1.5 rounded-md pl-2 pr-1.5 ml-2 border-l border-zinc-200/50 dark:border-zinc-800/40 text-left text-[11px] font-mono text-slate-500 transition-all hover:bg-zinc-500/5 hover:text-slate-800 dark:text-neutral-500 dark:hover:bg-zinc-800/20 dark:hover:text-zinc-300',
                                isSubActive && 'bg-zinc-500/10 font-bold text-slate-950 dark:bg-zinc-800/40 dark:text-white border-l-cyan-500'
                              )}
                            >
                              <span className={cn('h-1 w-1 shrink-0 rounded-full', subDotColor)} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SidebarProjectNode = React.memo(SidebarProjectNodeComponent)

export const Sidebar: React.FC = () => {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)
  const activeProjectId = useUiStore((state) => state.activeProjectId)
  const setActiveProjectId = useUiStore((state) => state.setActiveProjectId)
  const setProjectOnboardingOpen = useUiStore((state) => state.setProjectOnboardingOpen)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)

  const { t } = useTranslation()

  const isCollapsed = !sidebarOpen
  const setIsCollapsed = (collapsed: boolean) => setSidebarOpen(!collapsed)

  const [isProjectListOpen, setIsProjectListOpen] = useState(false)
  const [isEducationTreeOpen, setIsEducationTreeOpen] = useState(false)
  const [expandedEducationCategories, setExpandedEducationCategories] = useState<Record<EducationType, boolean>>({
    PROGRAMMING: true,
    LANGUAGE: false,
    FRONTEND: false,
    MOBILE: false,
    OTHER: false,
  })
  const [isAnySidebarMenuOpen, setIsAnySidebarMenuOpen] = useState(false)
  const isPointerInsideSidebarRef = React.useRef(false)
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])

  const { data: projects = [] } = useProjects()
  const { data: rawEducations = [] } = useEducations()

  const educations = React.useMemo(() => {
    return rawEducations.map((edu: any) => ({
      id: edu.id,
      title: edu.title,
      source: edu.source || '',
      description: edu.source || '',
      type: edu.type,
      progress_percent: edu.progressPercent ?? 0,
      status: edu.status || 'ACTIVE',
      next_study_date: edu.nextStudyDate || null,
    }))
  }, [rawEducations])

  const educationGroups = React.useMemo(() => groupEducationsByType(educations), [educations])
  const activeEducationId = React.useMemo(() => {
    const match = pathname.match(/^\/education\/(\d+)/)
    return match ? Number(match[1]) : undefined
  }, [pathname])

  React.useEffect(() => {
    if (!pathname.startsWith('/education')) {
      return
    }

    setIsEducationTreeOpen(true)
    const activeEducation = educations.find((education) => education.id === activeEducationId)
    if (activeEducation) {
      setExpandedEducationCategories((prev) => ({ ...prev, [activeEducation.type]: true }))
    }
  }, [activeEducationId, pathname, educations])

  const openProject = (projectId: number) => {
    setActiveProjectId(projectId)
    setProjectOnboardingOpen(false)
    navigate(`/projects/${projectId}`)
  }

  const openProjectOnboarding = () => {
    setActiveProjectId(undefined)
    setProjectOnboardingOpen(true)
    navigate('/projects')
  }

  const toggleEducationTree = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsEducationTreeOpen((open) => !open)
  }

  const toggleEducationCategory = (type: EducationType) => {
    setExpandedEducationCategories((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const navItems = [
    { to: '/', label: t('sidebar_dashboard'), icon: LayoutDashboard },
    { to: '/projects', label: t('sidebar_projects'), icon: Folder },
    { to: '/education', label: t('sidebar_education'), icon: GraduationCap },
    { to: '/ideas', label: t('sidebar_ideas'), icon: Lightbulb },
    { to: '/calendar', label: t('sidebar_calendar'), icon: Calendar },
    { to: '/focus', label: t('sidebar_focus'), icon: Timer },
  ]

  const handleSidebarMenuOpenChange = (open: boolean) => {
    setIsAnySidebarMenuOpen(open)

    if (!open && !isPointerInsideSidebarRef.current) {
      setIsCollapsed(true)
    }
  }

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 top-0 z-50 h-full shrink-0 border-r border-border bg-card shadow-lg select-none",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => {
        isPointerInsideSidebarRef.current = true
        setIsCollapsed(false)
      }}
      onMouseLeave={() => {
        isPointerInsideSidebarRef.current = false
        if (!isAnySidebarMenuOpen) {
          setIsCollapsed(true)
        }
      }}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col text-slate-700 transition-all dark:text-muted-foreground"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col p-0 m-0 list-none">
          <div className="flex grow flex-col items-center">
            
            {/* Top Logo / Workspace Area */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-border p-2">
              <div className="flex w-full items-center">
                <DropdownMenu modal={false} onOpenChange={handleSidebarMenuOpenChange}>
                  <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
                    <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/40 text-left transition-colors cursor-pointer">
                      <Avatar className="rounded size-5 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                        <AvatarFallback className="bg-transparent text-primary">C</AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <motion.div
                          variants={variants}
                          className="flex items-center justify-between w-full min-w-0"
                        >
                          <span className="text-sm font-bold text-foreground truncate mr-1">
                            Compileme
                          </span>
                          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-muted-foreground/70" />
                        </motion.div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-card border border-border">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" /> Yönetici Paneli
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Blocks className="h-4 w-4" /> Eklentiler
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Yeni Alan Oluştur
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))

                      if (item.to === '/projects') {
                        return (
                          <div key={item.to}>
                            <div className="relative">
                              <Link
                                to={item.to}
                                onClick={() => setProjectOnboardingOpen(false)}
                                className={cn(
                                  "flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-slate-700 transition-all duration-200 hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground",
                                  isActive && "border-l-2 border-primary bg-primary/10 font-semibold text-primary shadow-[0_0_15px_rgba(0,255,255,0.05)]",
                                )}
                              >
                                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                                {!isCollapsed && (
                                  <motion.span variants={variants} className="ml-3.5 truncate text-sm">
                                    {item.label}
                                  </motion.span>
                                )}
                              </Link>

                              {!isCollapsed && (
                                <motion.div variants={variants} className="absolute inset-y-0 right-1.5 my-auto flex h-7 items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={openProjectOnboarding}
                                    aria-label="Yeni proje oluştur"
                                    title="Yeni proje"
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 transition-all hover:border-cyan-500/25 hover:bg-cyan-500/10 hover:text-cyan-700 hover:shadow-[0_0_12px_rgba(6,182,212,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:text-neutral-400 dark:hover:text-cyan-300"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsProjectListOpen((open) => !open)}
                                    aria-label={isProjectListOpen ? 'Proje listesini kapat' : 'Proje listesini aç'}
                                    aria-expanded={isProjectListOpen}
                                    title={isProjectListOpen ? 'Projeleri gizle' : 'Projeleri göster'}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 transition-all hover:border-zinc-500/20 hover:bg-zinc-500/10 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:text-neutral-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                                  >
                                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', !isProjectListOpen && '-rotate-90')} />
                                  </button>
                                </motion.div>
                              )}
                            </div>

                            {!isCollapsed && isProjectListOpen && projects.length > 0 && (
                              <motion.div variants={variants} className="mt-2 space-y-1 pl-3 font-mono text-xs md:text-sm">
                                {projects.map((project) => (
                                  <SidebarProjectNode
                                    key={project.id}
                                    project={project}
                                    activeProjectId={activeProjectId}
                                    pathname={pathname}
                                    searchParams={searchParams}
                                    openProject={openProject}
                                    isCollapsed={isCollapsed}
                                    variants={variants}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </div>
                        )
                      }

                      if (item.to === '/education') {
                        return (
                          <div key={item.to}>
                            <div className="relative">
                              <Link
                                to={item.to}
                                className={cn(
                                  "flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-slate-900 transition-all duration-200 hover:bg-white/70 hover:text-slate-950 hover:shadow-md dark:text-slate-100 dark:hover:bg-white/[0.07] dark:hover:text-white",
                                  isActive && "border-l-2 border-primary bg-white/75 font-semibold text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] backdrop-blur-xl dark:bg-white/[0.08] dark:text-cyan-200 dark:shadow-[0_0_18px_rgba(34,211,238,0.12)]",
                                )}
                              >
                                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                                {!isCollapsed && (
                                  <motion.span variants={variants} className="ml-3.5 truncate text-sm">
                                    {item.label}
                                  </motion.span>
                                )}
                              </Link>

                              {!isCollapsed && educationGroups.length > 0 && (
                                <motion.div variants={variants} className="absolute inset-y-0 right-1.5 my-auto flex h-7 items-center">
                                  <button
                                    type="button"
                                    onClick={toggleEducationTree}
                                    aria-label={isEducationTreeOpen ? 'Egitim agacini kapat' : 'Egitim agacini ac'}
                                    aria-expanded={isEducationTreeOpen}
                                    title={isEducationTreeOpen ? 'Kategorileri gizle' : 'Kategorileri goster'}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-600 transition-all hover:border-cyan-500/25 hover:bg-cyan-500/10 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:text-neutral-400 dark:hover:text-cyan-300"
                                  >
                                    <ChevronRight
                                      className={cn(
                                        'h-3.5 w-3.5 transition-transform duration-200',
                                        isEducationTreeOpen && 'rotate-90'
                                      )}
                                    />
                                  </button>
                                </motion.div>
                              )}
                            </div>

                            <AnimatePresence initial={false}>
                              {!isCollapsed && isEducationTreeOpen && educationGroups.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-2 overflow-hidden pl-4 font-mono text-xs md:text-sm"
                                >
                                  <div className="ml-2 flex flex-col gap-1 border-l border-slate-200 dark:border-slate-800">
                                    {educationGroups.map((group) => {
                                      const isCategoryOpen = expandedEducationCategories[group.type]
                                      const hasActiveEducation = group.educations.some((education) => education.id === activeEducationId)

                                      return (
                                        <div key={group.type} className="flex flex-col pl-2">
                                          <button
                                            type="button"
                                            onClick={() => toggleEducationCategory(group.type)}
                                            className={cn(
                                              'group/category flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-slate-800 transition-all hover:bg-white/70 hover:text-slate-950 hover:shadow-sm dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white',
                                              hasActiveEducation && 'bg-white/75 text-cyan-700 shadow-[0_0_16px_rgba(6,182,212,0.1)] backdrop-blur-xl dark:bg-white/[0.07] dark:text-cyan-200'
                                            )}
                                            aria-expanded={isCategoryOpen}
                                          >
                                            <ChevronRight
                                              className={cn(
                                                'h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 group-hover/category:text-cyan-700 dark:text-slate-500 dark:group-hover/category:text-cyan-300',
                                                isCategoryOpen && 'rotate-90'
                                              )}
                                            />
                                            <span className="truncate">{group.label}</span>
                                            <span className="ml-auto rounded-full border border-slate-200 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                                              {group.educations.length}
                                            </span>
                                          </button>

                                          <AnimatePresence initial={false}>
                                            {isCategoryOpen && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden pl-6"
                                              >
                                                <div className="ml-2 flex flex-col gap-1 border-l border-slate-200 py-1 dark:border-slate-800">
                                                  {group.educations.map((education) => {
                                                    const isEducationActive = activeEducationId === education.id

                                                    return (
                                                      <button
                                                        key={education.id}
                                                        type="button"
                                                        onClick={() => navigate(`/education/${education.id}`)}
                                                        className={cn(
                                                          'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] text-slate-700 transition-all hover:bg-white/70 hover:text-slate-950 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
                                                          isEducationActive && 'bg-white/80 font-bold text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.14)] backdrop-blur-xl dark:bg-white/[0.08] dark:text-cyan-200'
                                                        )}
                                                      >
                                                        <span
                                                          className={cn(
                                                            'h-1.5 w-1.5 shrink-0 rounded-full',
                                                            education.status === 'ACTIVE' && 'bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.65)]',
                                                            education.status === 'PAUSED' && 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.65)]',
                                                            education.status === 'DONE' && 'bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.65)]'
                                                          )}
                                                        />
                                                        <span className="truncate">{education.title}</span>
                                                      </button>
                                                    )
                                                  })}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      }
                      
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-slate-700 transition-all duration-200 hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground",
                            isActive && "bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-[0_0_15px_rgba(0,255,255,0.05)]",
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                          {!isCollapsed && (
                            <motion.span
                              variants={variants}
                              className="ml-3.5 text-sm truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Bottom Footer - Settings & Account */}
              <div className="flex flex-col p-2 gap-1 border-t border-border bg-muted/10">
                {/* Theme Selector Dropdown */}
                <DropdownMenu modal={false} onOpenChange={handleSidebarMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-left text-slate-700 transition-all hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground cursor-pointer select-none">
                      {theme === 'dark' ? (
                        <Moon className="h-4 w-4 shrink-0 text-cyan-400" />
                      ) : theme === 'light' ? (
                        <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                      ) : (
                        <Monitor className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      {!isCollapsed && (
                        <motion.span variants={variants} className="ml-3.5 text-sm truncate">
                          {theme === 'dark'
                            ? t('sidebar_theme_dark')
                            : theme === 'light'
                            ? t('sidebar_theme_light')
                            : t('sidebar_theme_system')}
                        </motion.span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-48 bg-card border border-border">
                    <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2 font-semibold">
                      <Sun className="h-4 w-4 text-amber-400" /> {t('sidebar_theme_light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2 font-semibold">
                      <Moon className="h-4 w-4 text-cyan-400" /> {t('sidebar_theme_dark')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2 font-semibold">
                      <Monitor className="h-4 w-4 text-slate-400" /> {t('sidebar_theme_system')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Language Selector Dropdown */}
                <DropdownMenu modal={false} onOpenChange={handleSidebarMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-left text-slate-700 transition-all hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground cursor-pointer select-none">
                      <Globe className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-400" />
                      {!isCollapsed && (
                        <motion.span variants={variants} className="ml-3.5 text-sm truncate">
                          {language === 'tr' ? 'Türkçe' : language === 'en' ? 'English' : 'Deutsch'}
                        </motion.span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-48 bg-card border border-border">
                    <DropdownMenuItem onClick={() => setLanguage('tr')} className="flex items-center gap-2 font-semibold">
                      <span>🇹🇷 Türkçe</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="flex items-center gap-2 font-semibold">
                      <span>🇺🇸 English</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('de')} className="flex items-center gap-2 font-semibold">
                      <span>🇩🇪 Deutsch</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to="/settings"
                  className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-slate-700 transition-all hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="ml-3.5 text-sm">
                      {t('sidebar_settings')}
                    </motion.span>
                  )}
                </Link>
                
                <div>
                  <DropdownMenu modal={false} onOpenChange={handleSidebarMenuOpenChange}>
                    <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
                      <button className="flex h-9 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 text-left text-slate-700 transition-all hover:bg-secondary/60 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-secondary/40 dark:hover:text-foreground">
                        <Avatar className="size-5 bg-secondary border border-border">
                          <AvatarFallback className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-muted-foreground">G</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                          <motion.div
                            variants={variants}
                            className="flex w-full items-center justify-between min-w-0"
                          >
                            <span className="text-sm font-medium truncate mr-1">Görkem</span>
                            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-muted-foreground/70" />
                          </motion.div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" sideOffset={10} className="w-56 bg-card border border-border">
                      <div className="flex flex-row items-center gap-2.5 p-2.5">
                        <Avatar className="size-8 bg-secondary border border-border">
                          <AvatarFallback className="text-xs font-bold text-muted-foreground">G</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            Görkem Esen
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            gorkem@compileme.com
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> {t('sidebar_profile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" /> {t('sidebar_logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>

          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  )
}
export default Sidebar
