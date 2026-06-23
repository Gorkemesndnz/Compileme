import React, { useState, useEffect } from 'react'
import { Project, ProjectPhase } from '../../api/projects'
import { useTasks } from '../../api/tasks'
import { ControlRoomHeader } from './phase-room/ControlRoomHeader'
import { FeatureNavigationBar, FeatureId, ALL_FEATURES } from './phase-room/FeatureNavigationBar'
import { FeatureToggleModal } from './phase-room/FeatureToggleModal'
import { usePhaseAiExport } from './phase-room/usePhaseAiExport'

// Views
import { TasksView } from './phase-room/views/TasksView'
import { DbSchemaView } from './phase-room/views/DbSchemaView'
import { ApiEndpointsView } from './phase-room/views/ApiEndpointsView'
import { SubPhasesView } from './phase-room/views/SubPhasesView'
import { TechnicalMemoryView } from './phase-room/views/TechnicalMemoryView'

interface PhaseDetailRoomProps {
  project: Project
  phase: ProjectPhase
  phaseIndex: number
  onBack: () => void
}

const DEFAULT_ACTIVE_FEATURES: FeatureId[] = ['tasks', 'subphases', 'db_schema', 'tech_memory']
const VALID_FEATURE_IDS = new Set<FeatureId>(ALL_FEATURES.map((feature) => feature.id))

function normalizeFeatureIds(value: unknown): FeatureId[] {
  if (!Array.isArray(value)) return DEFAULT_ACTIVE_FEATURES
  if (value.length === 0) return []

  const features = value.filter(
    (id): id is FeatureId => typeof id === 'string' && VALID_FEATURE_IDS.has(id as FeatureId)
  )

  return features.length > 0 ? features : DEFAULT_ACTIVE_FEATURES
}

function readStoredFeatures(phaseId: number): FeatureId[] {
  try {
    const saved = localStorage.getItem(`cm_phase_${phaseId}_features`)
    return saved ? normalizeFeatureIds(JSON.parse(saved)) : DEFAULT_ACTIVE_FEATURES
  } catch {
    return DEFAULT_ACTIVE_FEATURES
  }
}

function persistStoredFeatures(phaseId: number, features: FeatureId[]) {
  try {
    localStorage.setItem(`cm_phase_${phaseId}_features`, JSON.stringify(features))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

class PhaseViewErrorBoundary extends React.Component<
  {
    activeTab: FeatureId
    phaseId: number
    onReset: () => void
    children: React.ReactNode
  },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: { activeTab: FeatureId; phaseId: number }) {
    if (
      this.state.hasError &&
      (previousProps.activeTab !== this.props.activeTab || previousProps.phaseId !== this.props.phaseId)
    ) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="glass-panel rounded-3xl border border-red-400/20 bg-red-500/5 p-8 text-center">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
          Bu modül yüklenemedi
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-zinc-500 dark:text-zinc-400">
          Kontrol odası açık tutuldu. Modül verisi geçici olarak sorunluysa faz görevlerine dönüp çalışmaya devam edebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ hasError: false })
            this.props.onReset()
          }}
          className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-cyan-600"
        >
          Faz görevlerine dön
        </button>
      </div>
    )
  }
}

export const PhaseDetailRoom: React.FC<PhaseDetailRoomProps> = ({
  project,
  phase,
  phaseIndex,
  onBack,
}) => {
  // ── CORE FEATURES STATE ──────────────────────────────────────────
  const [activeFeatures, setActiveFeatures] = useState<FeatureId[]>(() => readStoredFeatures(phase.id))
  const [activeTab, setActiveTab] = useState<FeatureId>('tasks')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    persistStoredFeatures(phase.id, activeFeatures)
  }, [activeFeatures, phase.id])

  // AI Export handler
  const { handleExport } = usePhaseAiExport(project, phase, phaseIndex)

  // Fetch phase tasks to calculate progress percent
  const { data: projectTasks = [] } = useTasks({ projectId: project.id })
  const phaseTasks = projectTasks.filter((t) => t.phaseId === phase.id)
  const completedTasksCount = phaseTasks.filter((t) => t.status === 'DONE').length
  const completionPercent =
    phaseTasks.length > 0 ? Math.round((completedTasksCount / phaseTasks.length) * 100) : 0

  // If the active tab gets disabled, reset to the first available active feature
  useEffect(() => {
    if (!activeFeatures.includes(activeTab)) {
      if (activeFeatures.length > 0) {
        setActiveTab(activeFeatures[0])
      }
    }
  }, [activeFeatures, activeTab])

  // Handle checking/unchecking features in settings modal
  const handleToggleFeature = (id: FeatureId) => {
    setActiveFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleResetView = () => {
    if (!activeFeatures.includes('tasks')) {
      setActiveFeatures((prev) => ['tasks', ...prev])
    }
    setActiveTab('tasks')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <ControlRoomHeader
        project={project}
        phase={phase}
        onBack={onBack}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCopyData={handleExport}
        completionPercent={completionPercent}
      />

      {/* ── NAVIGATION BAR ─────────────────────────────────────────── */}
      {activeFeatures.length > 0 && (
        <FeatureNavigationBar
          activeFeatures={activeFeatures}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* ── VIEWS SWITCHBOARD ──────────────────────────────────────── */}
      <PhaseViewErrorBoundary activeTab={activeTab} phaseId={phase.id} onReset={handleResetView}>
        <div className="transition-all duration-300">
        {activeFeatures.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-zinc-200/60 dark:border-zinc-800/40">
            <p className="text-sm text-zinc-400 italic">
              Tüm kontrol odası modülleri kapatıldı. Sağ üstteki dişli çark ikonundan yeni modüller aktif edebilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && activeFeatures.includes('tasks') && (
              <TasksView project={project} phase={phase} />
            )}

            {activeTab === 'subphases' && activeFeatures.includes('subphases') && (
              <SubPhasesView project={project} phase={phase} phaseIndex={phaseIndex} />
            )}

            {activeTab === 'db_schema' && activeFeatures.includes('db_schema') && (
              <DbSchemaView project={project} phase={phase} />
            )}

            {activeTab === 'api_endpoints' && activeFeatures.includes('api_endpoints') && (
              <ApiEndpointsView project={project} phase={phase} />
            )}

            {activeTab === 'tech_memory' && activeFeatures.includes('tech_memory') && (
              <TechnicalMemoryView project={project} phase={phase} />
            )}
          </>
        )}
        </div>
      </PhaseViewErrorBoundary>

      {/* ── SETTINGS MODAL ─────────────────────────────────────────── */}
      <FeatureToggleModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeFeatures={activeFeatures}
        onToggleFeature={handleToggleFeature}
      />
    </div>
  )
}
