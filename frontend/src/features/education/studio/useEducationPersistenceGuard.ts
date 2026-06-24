import React from 'react'
import { useEducations } from '@/api/education'
import { Task } from '@/api/tasks'

export const useEducationPersistenceGuard = (educationId: number, dbTasks: Task[]) => {
  const { data: apiEducations = [] } = useEducations()

  const isPersistedEducation = React.useMemo(
    () => apiEducations.some((item) => item.id === educationId),
    [apiEducations, educationId]
  )

  const persistedTaskIds = React.useMemo(
    () => new Set(dbTasks.map((task) => task.id)),
    [dbTasks]
  )

  return {
    isPersistedEducation,
    persistedTaskIds,
  }
}
