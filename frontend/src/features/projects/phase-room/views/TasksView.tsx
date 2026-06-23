import React from 'react'
import { PhaseTasksTab } from '../PhaseTasksTab'
import { Project, ProjectPhase } from '../../../../api/projects'

interface TasksViewProps {
  project: Project
  phase: ProjectPhase
}

export const TasksView: React.FC<TasksViewProps> = ({ project, phase }) => {
  return (
    <div className="space-y-4">
      <PhaseTasksTab project={project} phase={phase} />
    </div>
  )
}
