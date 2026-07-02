import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { useUiStore } from '../../store/useUiStore'
import { useProjects, useProjectPhases, Project } from '../../api/projects'
import { useTasks } from '../../api/tasks'

// Helper component for individual terminal card to obey React hook rules
const ProjectTerminalCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate()
  const { data: phases = [] } = useProjectPhases(project.id)
  const { data: tasks = [] } = useTasks({ projectId: project.id })

  const activePhase = phases.find(p => p.status === 'ACTIVE') || phases[0]
  const completedTasks = tasks.filter(t => t.status === 'DONE').length
  const totalTasks = tasks.length
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Generate ASCII progress bar matching the dashboard terminal style
  const barLength = 15
  const filledLength = Math.max(0, Math.min(barLength, Math.round((percent / 100) * barLength)))
  const emptyLength = barLength - filledLength
  const bar = `[${'='.repeat(filledLength)}${'-'.repeat(emptyLength)}]`

  return (
    <motion.div
      onClick={() => navigate(`/projects/${project.id}`)}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 shadow-md backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/50 dark:bg-black/45 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] cursor-pointer"
    >
      {/* MacOS Terminal Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 bg-zinc-150/80 px-4 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>
        <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          bash - {project.name.toLowerCase().replace(/\s+/g, '_')}_status.sh
        </span>
        <div className="w-12" /> {/* Spacer to balance dots */}
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-5 font-mono text-xs leading-6 text-slate-800 dark:text-zinc-200">
        {/* Command 1 */}
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="text-cyan-600 dark:text-cyan-400">compileme@developer:~$</span>
          <span className="text-slate-900 dark:text-zinc-100 font-semibold">cat info.txt</span>
        </div>
        <div className="mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <div className="font-black text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5">
            <span className="text-emerald-500">✔</span> Project: {project.name}
          </div>
          <div className="text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {project.description || 'No description provided.'}
          </div>
        </div>

        {/* Command 2 */}
        <div className="mt-4 flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="text-cyan-600 dark:text-cyan-400">compileme@developer:~$</span>
          <span className="text-slate-900 dark:text-zinc-100 font-semibold">npm run check-status</span>
        </div>
        <div className="mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-600 dark:text-amber-400 font-bold">[STATUS]</span>
            <span className="text-slate-700 dark:text-zinc-300">
              Active Phase: <span className="underline decoration-cyan-500/40 underline-offset-4">{activePhase?.name || 'None'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">[TASKS]</span>
            <span className="text-slate-700 dark:text-zinc-300">
              {completedTasks}/{totalTasks} Completed
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-450">
            <span className="font-semibold text-emerald-600 dark:text-emerald-450">{bar}</span>
            <span className="font-bold text-slate-800 dark:text-zinc-100">{percent}%</span>
          </div>
        </div>

        {/* Floating cursor prompt */}
        <div className="mt-4 flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="text-cyan-600 dark:text-cyan-400">compileme@developer:~$</span>
          <span className="h-4 w-2 animate-pulse bg-cyan-500" />
        </div>
      </div>
    </motion.div>
  )
}

export const ProjectsHub: React.FC = () => {
  const { data: projects = [] } = useProjects()
  const setProjectOnboardingOpen = useUiStore((state) => state.setProjectOnboardingOpen)

  const handleNewProject = () => {
    setProjectOnboardingOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projeler"
        titleClassName="text-neutral-950 dark:text-white"
        subtitle="Proje Komuta Merkezi - Tüm aktif projeleriniz ve teknik roadmap'leriniz."
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        className="grid grid-cols-1 gap-6 p-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Yeni Proje Ekle Kartı */}
        <motion.button
          onClick={handleNewProject}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white/40 p-6 text-center shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/50 hover:bg-white/60 dark:border-zinc-800 dark:bg-black/20 dark:hover:border-cyan-500/40 dark:hover:bg-black/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50/50 text-zinc-500 shadow-sm transition-all duration-300 group-hover:border-cyan-500/25 group-hover:bg-cyan-500/10 group-hover:text-cyan-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400 dark:group-hover:border-cyan-500/30 dark:group-hover:bg-cyan-500/10 dark:group-hover:text-cyan-400">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-zinc-150">
            Yeni Proje Başlat
          </h3>
          <p className="mt-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Yeni bir control room ayağa kaldır
          </p>
        </motion.button>

        {/* Proje Kartları */}
        {projects.map((project) => (
          <motion.div
            key={project.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <ProjectTerminalCard project={project} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default ProjectsHub
